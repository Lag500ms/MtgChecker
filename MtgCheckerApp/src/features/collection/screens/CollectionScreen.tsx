import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  deleteOwnedCard,
  getCollectionSummary,
  updateOwnedQuantity,
} from '@/features/collection/api/inventoryApi';
import type { CollectionSummary, OwnedCard } from '@/features/collection/types/inventory';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import { OwnedCardRow } from '../components/OwnedCardRow';

const STALE_MS = 60_000;

export function CollectionScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_desc' | 'name' | 'qty'>('price_desc');

  const lastLoadedAt = useRef(0);
  const loadedForAccount = useRef<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!account) {
        setSummary(null);
        loadedForAccount.current = null;
        lastLoadedAt.current = 0;
        return;
      }
      const sameAccount = loadedForAccount.current === account.id;
      const fresh = lastLoadedAt.current > 0 && Date.now() - lastLoadedAt.current < STALE_MS;
      if (!force && sameAccount && fresh) {
        return;
      }
      setLoading(true);
      try {
        const data = await getCollectionSummary();
        setSummary(data);
        loadedForAccount.current = account.id;
        lastLoadedAt.current = Date.now();
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    },
    [account],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const changeQty = async (card: OwnedCard, next: number) => {
    if (next < 1) {
      await remove(card);
      return;
    }
    try {
      const updated = await updateOwnedQuantity(card.id, { quantity: next });
      setSummary((prev) => {
        if (!prev) return null;
        const newCards = prev.cards.map((c) => (c.id === card.id ? updated : c));
        let totalVal = 0;
        let totalCards = 0;
        newCards.forEach((c) => {
          totalCards += c.quantity;
          const p = parseFloat(c.priceUsd ?? '0') || 0;
          totalVal += p * c.quantity;
        });
        return {
          ...prev,
          cards: newCards,
          totalValueUsd: parseFloat(totalVal.toFixed(2)),
          totalCardsCount: totalCards,
        };
      });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  const remove = async (card: OwnedCard) => {
    try {
      await deleteOwnedCard(card.id);
      setSummary((prev) => {
        if (!prev) return null;
        const newCards = prev.cards.filter((c) => c.id !== card.id);
        let totalVal = 0;
        let totalCards = 0;
        newCards.forEach((c) => {
          totalCards += c.quantity;
          const p = parseFloat(c.priceUsd ?? '0') || 0;
          totalVal += p * c.quantity;
        });
        return {
          ...prev,
          cards: newCards,
          totalValueUsd: parseFloat(totalVal.toFixed(2)),
          totalCardsCount: totalCards,
          uniqueCardsCount: newCards.length,
        };
      });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    if (!summary?.cards) return [];
    let list = summary.cards;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.setCode.toLowerCase().includes(q) ||
          c.collectorNumber.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      const priceA = parseFloat(a.priceUsd ?? '0') || 0;
      const priceB = parseFloat(b.priceUsd ?? '0') || 0;

      if (sortBy === 'price_desc') {
        const totalA = priceA * a.quantity;
        const totalB = priceB * b.quantity;
        return totalB - totalA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'qty') {
        return b.quantity - a.quantity;
      }
      return 0;
    });
  }, [summary?.cards, searchQuery, sortBy]);

  if (!account) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Collection" />
        <EmptyState
          icon="lock"
          title="Sign in to track cards"
          message="Your collection and portfolio are tied to your account."
        />
        <Pressable onPress={() => router.push('/login')} style={styles.linkWrap}>
          <Text style={[styles.link, { color: theme.accent }]}>Go to login</Text>
        </Pressable>
      </View>
    );
  }

  const totalValueFormatted = (summary?.totalValueUsd ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Collection" />

      {loading && !summary ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={filteredAndSortedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <View
                style={[
                  styles.portfolioCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.portfolioTopRow}>
                  <View>
                    <Text style={styles.portfolioLabel}>TOTAL PORTFOLIO VALUE</Text>
                    <Text style={styles.portfolioAmount}>${totalValueFormatted}</Text>
                  </View>

                  {summary?.deltaValue7d != null && summary.deltaValue7d !== 0 ? (
                    <View
                      style={[
                        styles.deltaBadge,
                        summary.deltaValue7d > 0 ? styles.deltaPositive : styles.deltaNegative,
                      ]}
                    >
                      <Feather
                        name={summary.deltaValue7d > 0 ? 'trending-up' : 'trending-down'}
                        size={13}
                        color={summary.deltaValue7d > 0 ? '#22C55E' : '#EF4444'}
                      />
                      <Text
                        style={[
                          styles.deltaText,
                          { color: summary.deltaValue7d > 0 ? '#22C55E' : '#EF4444' },
                        ]}
                      >
                        {summary.deltaValue7d > 0 ? '+' : ''}${Math.abs(summary.deltaValue7d).toFixed(2)}
                        {summary.deltaPercent7d != null
                          ? ` (${summary.deltaPercent7d > 0 ? '+' : ''}${summary.deltaPercent7d.toFixed(1)}%)`
                          : ''}{' '}
                        7d
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.deltaNeutralBadge}>
                      <Text style={styles.deltaNeutralText}>7d baseline set</Text>
                    </View>
                  )}
                </View>

                <View style={styles.portfolioDivider} />

                <View style={styles.portfolioBottomRow}>
                  <View style={styles.statItem}>
                    <Feather name="layers" size={13} color="#B9C9C4" />
                    <Text style={styles.statText}>
                      {summary?.totalCardsCount ?? 0} Cards Total
                    </Text>
                  </View>
                  <View style={styles.statDot} />
                  <View style={styles.statItem}>
                    <Feather name="grid" size={13} color="#B9C9C4" />
                    <Text style={styles.statText}>
                      {summary?.uniqueCardsCount ?? 0} Unique
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.toolbar}>
                <View
                  style={[
                    styles.searchBox,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Feather name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search collection or set code…"
                    placeholderTextColor="#6B8A8C"
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                      <Feather name="x" size={15} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.sortRow}>
                  <Pressable
                    onPress={() => setSortBy('price_desc')}
                    style={[styles.sortPill, sortBy === 'price_desc' && styles.sortPillActive]}
                  >
                    <Text
                      style={[
                        styles.sortPillText,
                        sortBy === 'price_desc' && styles.sortPillTextActive,
                      ]}
                    >
                      Top Value
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSortBy('name')}
                    style={[styles.sortPill, sortBy === 'name' && styles.sortPillActive]}
                  >
                    <Text
                      style={[styles.sortPillText, sortBy === 'name' && styles.sortPillTextActive]}
                    >
                      Name A-Z
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSortBy('qty')}
                    style={[styles.sortPill, sortBy === 'qty' && styles.sortPillActive]}
                  >
                    <Text
                      style={[styles.sortPillText, sortBy === 'qty' && styles.sortPillTextActive]}
                    >
                      Quantity
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="layers"
              title={searchQuery ? 'No matching cards' : 'Collection empty'}
              message={
                searchQuery
                  ? 'Try a different card name or set code.'
                  : 'Scan or search cards to add them to your collection.'
              }
            />
          }
          renderItem={({ item }) => (
            <OwnedCardRow
              card={item}
              onInc={() => changeQty(item, item.quantity + 1)}
              onDec={() => changeQty(item, item.quantity - 1)}
              onDelete={() => remove(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  headerContainer: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  portfolioCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  portfolioTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  portfolioLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.6,
  },
  portfolioAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F3E7CF',
    marginTop: 2,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  deltaPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  deltaNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deltaNeutralBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  deltaNeutralText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B9C9C4',
  },
  portfolioDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  portfolioBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B9C9C4',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: borderRadius.full,
    backgroundColor: '#6B8A8C',
  },
  toolbar: {
    gap: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortPillActive: {
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    borderColor: '#E0AD62',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B9C9C4',
  },
  sortPillTextActive: {
    color: '#E0AD62',
    fontWeight: '700',
  },
  linkWrap: { alignItems: 'center', marginTop: spacing.lg },
  link: { ...typography.button },
});

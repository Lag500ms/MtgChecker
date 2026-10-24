import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  autocompleteCardNames,
  findCardByName,
  findPrintings,
  searchCards,
} from '@/features/cards/api/cardsApi';
import type { Card, SearchCardsParams } from '@/features/cards/types/card';
import { addOwnedCard } from '@/features/collection/api/inventoryApi';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import { CardDetailSheet } from '../components/CardDetailSheet';
import { CardResultRow } from '../components/CardResultRow';

type ColorOption = { code: string; label: string };
const COLOR_OPTIONS: ColorOption[] = [
  { code: 'w', label: 'W' },
  { code: 'u', label: 'U' },
  { code: 'b', label: 'B' },
  { code: 'r', label: 'R' },
  { code: 'g', label: 'G' },
  { code: 'c', label: 'C' },
];

const FORMAT_OPTIONS = [
  'commander',
  'standard',
  'modern',
  'pioneer',
  'legacy',
  'pauper',
];

const TYPE_OPTIONS = [
  'Creature',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Planeswalker',
  'Land',
];

const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'mythic'];

const CMC_OPTIONS = ['0', '1', '2', '3', '4', '5', '6+'];

type SortOption = {
  id: string;
  label: string;
  order: SearchCardsParams['order'];
  dir: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  { id: 'name_asc', label: 'Name (A to Z)', order: 'name', dir: 'asc' },
  { id: 'name_desc', label: 'Name (Z to A)', order: 'name', dir: 'desc' },
  { id: 'usd_asc', label: 'Price: Low to High', order: 'usd', dir: 'asc' },
  { id: 'usd_desc', label: 'Price: High to Low', order: 'usd', dir: 'desc' },
  { id: 'released_desc', label: 'Release Date: Newest', order: 'released', dir: 'desc' },
  { id: 'released_asc', label: 'Release Date: Oldest', order: 'released', dir: 'asc' },
];

function CardSkeleton({ theme }: { theme: any }) {
  return (
    <View
      style={[
        styles.skeletonRow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: theme.border,
        },
      ]}
    >
      <View style={[styles.skeletonThumb, { backgroundColor: theme.border }]} />
      <View style={styles.skeletonMeta}>
        <View style={[styles.skeletonLine, { width: '65%', backgroundColor: theme.border }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 10, backgroundColor: theme.border }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 10, backgroundColor: theme.border }]} />
      </View>
      <View style={[styles.skeletonPrice, { backgroundColor: theme.border }]} />
    </View>
  );
}

export function SearchScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();

  const flatListRef = useRef<FlatList<Card>>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedCmc, setSelectedCmc] = useState<string | null>(null);
  const [selectedSortId, setSelectedSortId] = useState<string>('name_asc');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedCardForDetail, setSelectedCardForDetail] = useState<Card | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeQueryString, setActiveQueryString] = useState<string | null>(null);
  const [specificCardMode, setSpecificCardMode] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSort = SORT_OPTIONS.find((s) => s.id === selectedSortId) || SORT_OPTIONS[0];

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || specificCardMode) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const list = await autocompleteCardNames(trimmed);
        setSuggestions(list.slice(0, 8));
        setShowSuggestions(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, specificCardMode]);

  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const activeFilterCount =
    selectedColors.length +
    (selectedFormat ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedRarity ? 1 : 0) +
    (selectedCmc ? 1 : 0) +
    (selectedSortId !== 'name_asc' ? 1 : 0);

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedFormat(null);
    setSelectedType(null);
    setSelectedRarity(null);
    setSelectedCmc(null);
    setSelectedSortId('name_asc');
  };

  const openCardDetail = (card: Card) => {
    setSelectedCardForDetail(card);
    setShowDetailSheet(true);
  };

  const handleSelectSuggestion = async (cardName: string) => {
    setShowSuggestions(false);
    setQuery(cardName);
    setSpecificCardMode(cardName);
    setLoading(true);
    setError(null);

    try {
      const printings = await findPrintings(cardName);
      if (printings && printings.length > 0) {
        setResults(printings);
        openCardDetail(printings[0]);
      } else {
        const single = await findCardByName(cardName);
        setResults([single]);
        openCardDetail(single);
      }
      setHasMore(false);
      setActiveQueryString(null);
    } catch (e: any) {
      try {
        const single = await findCardByName(cardName);
        setResults([single]);
        openCardDetail(single);
        setHasMore(false);
        setActiveQueryString(null);
      } catch {
        setResults([]);
        setError(e?.response?.data?.message || e?.message || 'Card not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async () => {
    setShowSuggestions(false);
    setSpecificCardMode(null);
    const trimmed = query.trim();
    if (!trimmed && activeFilterCount === 0) return;

    let scryfallQuery = trimmed;
    if (selectedFormat) {
      scryfallQuery += ` f:${selectedFormat.toLowerCase()}`;
    }
    if (selectedColors.length > 0) {
      scryfallQuery += ` c:${selectedColors.join('')}`;
    }
    if (selectedType) {
      scryfallQuery += ` t:${selectedType.toLowerCase()}`;
    }
    if (selectedRarity) {
      scryfallQuery += ` r:${selectedRarity.toLowerCase()}`;
    }
    if (selectedCmc) {
      if (selectedCmc === '6+') {
        scryfallQuery += ` cmc>=6`;
      } else {
        scryfallQuery += ` cmc=${selectedCmc}`;
      }
    }

    scryfallQuery = scryfallQuery.trim();
    if (!scryfallQuery) return;

    setLoading(true);
    setError(null);
    setPage(1);
    setActiveQueryString(scryfallQuery);

    try {
      const response = await searchCards({
        q: scryfallQuery,
        order: currentSort.order,
        dir: currentSort.dir,
        page: 1,
      });

      const cardList = response.cards || response.found || [];
      setResults(cardList);
      setHasMore(Boolean(response.hasMore));
      if (cardList.length === 0) {
        setError('No cards matched your search and filters.');
      }
    } catch (e: any) {
      setResults([]);
      setHasMore(false);
      setError(e?.response?.data?.message || e?.message || 'No cards found.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndReached = () => {
    if (!hasMore || loadingMore || loading || !activeQueryString) return;
    loadMoreCards();
  };

  const loadMoreCards = async () => {
    if (!hasMore || loadingMore || !activeQueryString) return;

    const nextPageNumber = page + 1;
    setLoadingMore(true);
    try {
      const response = await searchCards({
        q: activeQueryString,
        order: currentSort.order,
        dir: currentSort.dir,
        page: nextPageNumber,
      });

      const nextCards = response.cards || response.found || [];
      setResults((prev) => [...prev, ...nextCards]);
      setPage(nextPageNumber);
      setHasMore(Boolean(response.hasMore));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const addToCollection = async (card: Card) => {
    if (!account) {
      Alert.alert('Sign in required', 'Log in to save cards to your collection.');
      return;
    }
    const finish = card.finishes?.[0] || 'nonfoil';
    try {
      await addOwnedCard({
        setCode: card.set,
        collectorNumber: card.collectorNumber,
        finish,
        quantity: 1,
      });
      Alert.alert('Added', `${card.name} (${card.set.toUpperCase()}) saved.`);
    } catch (e: any) {
      Alert.alert('Could not add', e?.response?.data?.message || e?.message || 'Request failed');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Search Cards" />

      <View style={styles.body}>
        <View style={styles.searchBarContainer}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Feather name="search" size={18} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (specificCardMode) {
                  setSpecificCardMode(null);
                }
              }}
              placeholder="Search card name, type, rules text…"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              returnKeyType="search"
              onSubmitEditing={executeSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {loadingSuggestions ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setSpecificCardMode(null);
                }}
                hitSlop={8}
              >
                <Feather name="x" size={16} color={theme.textMuted} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setShowFilterModal(true)}
              style={[
                styles.filterIconBtn,
                activeFilterCount > 0 && { backgroundColor: theme.accent },
              ]}
              hitSlop={6}
            >
              <Feather
                name="sliders"
                size={16}
                color={activeFilterCount > 0 ? theme.accentContrast : theme.textMuted}
              />
              {activeFilterCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                  <Text style={styles.badgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>

            {loading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Pressable
                onPress={executeSearch}
                style={[styles.searchActionBtn, { backgroundColor: theme.accent }]}
              >
                <Feather name="arrow-right" size={16} color={theme.accentContrast} />
              </Pressable>
            )}
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View
              style={[
                styles.suggestionsDropdown,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: '#000',
                },
              ]}
            >
              {suggestions.map((item, idx) => (
                <Pressable
                  key={`${item}-${idx}`}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    { borderBottomColor: theme.border },
                    pressed && { backgroundColor: theme.background },
                  ]}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Feather name="corner-down-right" size={14} color={theme.accent} />
                  <Text
                    style={[styles.suggestionText, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                  <Text style={[styles.suggestionHint, { color: theme.accent }]}>
                    Open details
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {specificCardMode ? (
          <View
            style={[
              styles.specificBanner,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.specificBannerLeft}>
              <Feather name="check-circle" size={14} color={theme.accent} />
              <Text style={[styles.specificBannerText, { color: theme.text }]}>
                Showing printings for: <Text style={{ fontWeight: '700' }}>{specificCardMode}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setSpecificCardMode(null);
                executeSearch();
              }}
            >
              <Text style={[styles.specificBannerClose, { color: theme.accent }]}>
                Search all
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}

        {loading ? (
          <View style={styles.skeletonContainer}>
            <CardSkeleton theme={theme} />
            <CardSkeleton theme={theme} />
            <CardSkeleton theme={theme} />
            <CardSkeleton theme={theme} />
            <CardSkeleton theme={theme} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              setShowBackToTop(y > 350);
            }}
            scrollEventThrottle={32}
            ListEmptyComponent={
              <EmptyState
                icon="search"
                title="Find a card"
                message="Type a card name for quick suggestions, or apply filters and tap search."
              />
            }
            renderItem={({ item }) => (
              <CardResultRow
                card={item}
                onPress={() => openCardDetail(item)}
                actionLabel="Add"
                onAction={() => addToCollection(item)}
              />
            )}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <CardSkeleton theme={theme} />
                  <CardSkeleton theme={theme} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {showBackToTop && (
        <Pressable
          onPress={scrollToTop}
          style={[
            styles.backToTopBtn,
            { backgroundColor: theme.accent, shadowColor: '#000' },
          ]}
        >
          <Feather name="arrow-up" size={18} color={theme.accentContrast} />
        </Pressable>
      )}

      <CardDetailSheet
        card={selectedCardForDetail}
        visible={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        onSelectPrinting={(p) => setSelectedCardForDetail(p)}
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filter & Sort</Text>
              <Pressable onPress={() => setShowFilterModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Sort Order</Text>
              <View style={styles.sortList}>
                {SORT_OPTIONS.map((s) => {
                  const isSelected = selectedSortId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedSortId(s.id)}
                      style={[
                        styles.sortRow,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && { borderColor: theme.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortText,
                          { color: theme.text },
                          isSelected && { color: theme.accent, fontWeight: '700' },
                        ]}
                      >
                        {s.label}
                      </Text>
                      {isSelected ? (
                        <Feather name="check" size={16} color={theme.accent} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Format Legality</Text>
              <View style={styles.chipRow}>
                {FORMAT_OPTIONS.map((fmt) => {
                  const isSelected = selectedFormat === fmt;
                  return (
                    <Pressable
                      key={fmt}
                      onPress={() => setSelectedFormat(isSelected ? null : fmt)}
                      style={[
                        styles.filterChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.text, textTransform: 'capitalize' },
                          isSelected && { color: theme.accentContrast, fontWeight: '700' },
                        ]}
                      >
                        {fmt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Colors</Text>
              <View style={styles.chipRow}>
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColors.includes(c.code);
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => toggleColor(c.code)}
                      style={[
                        styles.colorChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.text },
                          isSelected && { color: theme.accentContrast, fontWeight: '700' },
                        ]}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Mana Value (CMC)</Text>
              <View style={styles.chipRow}>
                {CMC_OPTIONS.map((val) => {
                  const isSelected = selectedCmc === val;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => setSelectedCmc(isSelected ? null : val)}
                      style={[
                        styles.colorChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.text },
                          isSelected && { color: theme.accentContrast, fontWeight: '700' },
                        ]}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Type Line</Text>
              <View style={styles.chipRow}>
                {TYPE_OPTIONS.map((t) => {
                  const isSelected = selectedType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setSelectedType(isSelected ? null : t)}
                      style={[
                        styles.filterChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.text },
                          isSelected && { color: theme.accentContrast, fontWeight: '700' },
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Rarity</Text>
              <View style={styles.chipRow}>
                {RARITY_OPTIONS.map((r) => {
                  const isSelected = selectedRarity === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setSelectedRarity(isSelected ? null : r)}
                      style={[
                        styles.filterChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        isSelected && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.text, textTransform: 'capitalize' },
                          isSelected && { color: theme.accentContrast, fontWeight: '700' },
                        ]}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={resetFilters}
                style={[styles.footerBtn, { borderColor: theme.border, borderWidth: 1 }]}
              >
                <Text style={[styles.footerBtnText, { color: theme.textSecondary }]}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowFilterModal(false);
                  executeSearch();
                }}
                style={[styles.footerBtn, { backgroundColor: theme.accent, flex: 2 }]}
              >
                <Text style={[styles.footerBtnText, { color: theme.accentContrast, fontWeight: '700' }]}>
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  searchBarContainer: {
    position: 'relative',
    zIndex: 100,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.xs,
  },
  filterIconBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchActionBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 999,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    ...typography.body,
    fontWeight: '600',
  },
  suggestionHint: {
    ...typography.caption,
    fontWeight: '700',
  },
  specificBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  specificBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  specificBannerText: {
    ...typography.bodySmall,
  },
  specificBannerClose: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  skeletonContainer: {
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  skeletonThumb: {
    width: 38,
    height: 52,
    borderRadius: borderRadius.xs,
  },
  skeletonMeta: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 14,
    borderRadius: borderRadius.xs,
  },
  skeletonPrice: {
    width: 32,
    height: 18,
    borderRadius: borderRadius.xs,
  },
  loadingMoreContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  backToTopBtn: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title,
    fontWeight: '700',
  },
  modalScroll: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    ...typography.caption,
  },
  sortList: {
    gap: spacing.xs,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  sortText: {
    ...typography.bodySmall,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  footerBtnText: {
    ...typography.body,
  },
});

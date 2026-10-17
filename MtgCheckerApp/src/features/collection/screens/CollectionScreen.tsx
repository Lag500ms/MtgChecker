import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  deleteOwnedCard,
  listOwnedCards,
  updateOwnedQuantity,
} from '@/features/collection/api/inventoryApi';
import type { OwnedCard } from '@/features/collection/types/inventory';
import { useAppTheme } from '@/lib/ThemeProvider';
import { spacing, typography } from '@/lib/theme';

import { OwnedCardRow } from '../components/OwnedCardRow';

export function CollectionScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!account) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await listOwnedCards());
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const changeQty = async (card: OwnedCard, next: number) => {
    if (next < 1) {
      await remove(card);
      return;
    }
    try {
      const updated = await updateOwnedQuantity(card.id, { quantity: next });
      setItems((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  const remove = async (card: OwnedCard) => {
    try {
      await deleteOwnedCard(card.id);
      setItems((prev) => prev.filter((c) => c.id !== card.id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  if (!account) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Collection" />
        <EmptyState
          icon="lock"
          title="Sign in to track cards"
          message="Your inventory is tied to your account."
        />
        <Pressable onPress={() => router.push('/login')} style={styles.linkWrap}>
          <Text style={[styles.link, { color: theme.accent }]}>Go to login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Collection" />
      {loading && !items.length ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="layers"
              title="Collection empty"
              message="Search a card and tap Add to save a printing."
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  linkWrap: { alignItems: 'center', marginTop: spacing.lg },
  link: { ...typography.button },
});

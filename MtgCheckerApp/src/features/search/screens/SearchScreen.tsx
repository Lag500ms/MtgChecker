import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { findCardByName, findPrintings } from '@/features/cards/api/cardsApi';
import type { Card } from '@/features/cards/types/card';
import { addOwnedCard } from '@/features/collection/api/inventoryApi';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import { CardResultRow } from '../components/CardResultRow';

export function SearchScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [printings, setPrintings] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const list = await findPrintings(name);
      setPrintings(list);
      if (!list.length) {
        const single = await findCardByName(name);
        setPrintings([single]);
      }
    } catch (e: any) {
      setPrintings([]);
      setError(e?.response?.data?.message || e?.message || 'Card not found');
    } finally {
      setLoading(false);
    }
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
      <ScreenHeader title="Search" />
      <View style={styles.body}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Exact card name…"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
            onSubmitEditing={search}
            autoCapitalize="words"
          />
          {loading ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <Feather name="arrow-right" size={18} color={theme.accent} onPress={search} />
          )}
        </View>

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <FlatList
          data={printings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading
              ? undefined
              : (
                <EmptyState
                  icon="search"
                  title="Find a card"
                  message="Search by exact name to list every printing with price."
                />
              )
          }
          renderItem={({ item }) => (
            <CardResultRow
              card={item}
              actionLabel="Add"
              onAction={() => addToCollection(item)}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.xs,
  },
  error: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
});

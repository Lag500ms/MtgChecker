import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { OwnedCard } from '@/features/collection/types/inventory';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type OwnedCardRowProps = {
  card: OwnedCard;
  onInc: () => void;
  onDec: () => void;
  onDelete: () => void;
};

export function OwnedCardRow({ card, onInc, onDec, onDelete }: OwnedCardRowProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          {card.setName} · {card.setCode.toUpperCase()} #{card.collectorNumber} · {card.finish}
        </Text>
        <Text style={[styles.price, { color: theme.accent }]}>
          ${card.priceUsd ?? '—'} · qty {card.quantity}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onDec} hitSlop={8}>
          <Feather name="minus-circle" size={22} color={theme.textSecondary} />
        </Pressable>
        <Pressable onPress={onInc} hitSlop={8}>
          <Feather name="plus-circle" size={22} color={theme.accent} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Feather name="trash-2" size={20} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  meta: { flex: 1, gap: 2 },
  name: { ...typography.body, fontWeight: '700' },
  sub: { ...typography.caption },
  price: { ...typography.bodySmall, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

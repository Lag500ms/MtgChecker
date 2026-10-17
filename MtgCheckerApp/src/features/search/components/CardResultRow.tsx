import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Card } from '@/features/cards/types/card';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type CardResultRowProps = {
  card: Card;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function CardResultRow({ card, onPress, actionLabel, onAction }: CardResultRowProps) {
  const { theme } = useAppTheme();
  const price = card.prices?.usd ?? card.prices?.usdFoil ?? '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
          {card.setName} · {card.set.toUpperCase()} #{card.collectorNumber}
        </Text>
        {card.typeLine ? (
          <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>
            {card.typeLine}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: theme.accent }]}>${price}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={[styles.action, { backgroundColor: theme.accent }]}>
            <Text style={[styles.actionText, { color: theme.accentContrast }]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
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
  right: { alignItems: 'flex-end', gap: spacing.sm },
  price: { ...typography.bodySmall, fontWeight: '700' },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  actionText: { ...typography.caption, fontWeight: '700' },
});

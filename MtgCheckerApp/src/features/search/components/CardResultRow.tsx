import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CardArt } from '@/components/CardArt';
import type { Card } from '@/features/cards/types/card';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type CardResultRowProps = {
  card: Card;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

const COLOR_MAP: Record<string, string> = {
  W: '#F8E7B9',
  U: '#0E68AB',
  B: '#2B2927',
  R: '#D3202A',
  G: '#00733E',
  GOLD: '#D4AF37',
  COLORLESS: '#9E9E9E',
  LAND: '#8D6E63',
};

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  common: { bg: '#374151', text: '#E5E7EB' },
  uncommon: { bg: '#475569', text: '#CBD5E1' },
  rare: { bg: '#854D0E', text: '#FEF08A' },
  mythic: { bg: '#9A3412', text: '#FFEDD5' },
};

function getCardStripeColor(card: Card): string {
  if (card.colors && card.colors.length > 1) {
    return COLOR_MAP.GOLD;
  }
  if (card.colors && card.colors.length === 1) {
    const single = card.colors[0].toUpperCase();
    if (COLOR_MAP[single]) {
      return COLOR_MAP[single];
    }
  }

  const mana = card.manaCost || '';
  const colorMatches = new Set(
    (mana.match(/\{([WUBRG])\}/g) || []).map((m) => m.replace(/[{}]/g, ''))
  );
  if (colorMatches.size > 1) {
    return COLOR_MAP.GOLD;
  }
  if (colorMatches.size === 1) {
    const single = Array.from(colorMatches)[0];
    if (COLOR_MAP[single]) {
      return COLOR_MAP[single];
    }
  }

  const type = (card.typeLine || '').toLowerCase();
  if (type.includes('land')) {
    return COLOR_MAP.LAND;
  }
  if (type.includes('artifact')) {
    return COLOR_MAP.COLORLESS;
  }
  return '#64748B';
}

function parseManaSymbols(manaCost?: string): string[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

function getManaSymbolStyle(symbol: string) {
  const sym = symbol.toUpperCase();
  switch (sym) {
    case 'W':
      return { bg: '#F8E7B9', text: '#78350F' };
    case 'U':
      return { bg: '#0284C7', text: '#FFFFFF' };
    case 'B':
      return { bg: '#1E293B', text: '#F8FAFC' };
    case 'R':
      return { bg: '#DC2626', text: '#FFFFFF' };
    case 'G':
      return { bg: '#16A34A', text: '#FFFFFF' };
    case 'C':
      return { bg: '#64748B', text: '#F8FAFC' };
    default:
      return { bg: '#475569', text: '#F8FAFC' };
  }
}

function CardResultRowComponent({ card, onPress, actionLabel, onAction }: CardResultRowProps) {
  const { theme } = useAppTheme();
  const price = card.prices?.usd ?? card.prices?.usdFoil ?? '—';
  const stripeColor = getCardStripeColor(card);
  const manaSymbols = parseManaSymbols(card.manaCost);
  const rarityKey = (card.rarity || 'common').toLowerCase();
  const rarityStyle = RARITY_COLORS[rarityKey] || RARITY_COLORS.common;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: stripeColor,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <CardArt card={card} size="small" contentFit="cover" style={styles.thumbnail} />

      <View style={styles.mainInfo}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {card.name}
          </Text>

          {manaSymbols.length > 0 && (
            <View style={styles.manaRow}>
              {manaSymbols.map((sym, idx) => {
                const sStyle = getManaSymbolStyle(sym);
                return (
                  <View key={`${sym}-${idx}`} style={[styles.manaCircle, { backgroundColor: sStyle.bg }]}>
                    <Text style={[styles.manaText, { color: sStyle.text }]}>{sym}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {card.typeLine ? (
          <Text style={[styles.typeLine, { color: theme.textSecondary }]} numberOfLines={1}>
            {card.typeLine}
          </Text>
        ) : null}

        <View style={styles.bottomMeta}>
          <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.bg }]}>
            <Text style={[styles.rarityText, { color: rarityStyle.text }]}>
              {card.rarity ? card.rarity.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <Text style={[styles.setCode, { color: theme.textMuted }]} numberOfLines={1}>
            {card.set.toUpperCase()} #{card.collectorNumber} · {card.setName}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <Text style={[styles.price, { color: theme.accent }]}>${price}</Text>
        {onAction ? (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
            hitSlop={6}
          >
            <Feather name="plus" size={14} color={theme.accentContrast} />
            {actionLabel && actionLabel !== 'Add' && (
              <Text style={[styles.actionBtnText, { color: theme.accentContrast }]}>
                {actionLabel}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export const CardResultRow = memo(CardResultRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  thumbnail: {
    width: 38,
    height: 52,
    borderRadius: borderRadius.xs,
    backgroundColor: '#1E293B',
  },
  placeholderThumb: {
    width: 38,
    height: 52,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '800',
  },
  mainInfo: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
  },
  manaRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  manaCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  typeLine: {
    ...typography.caption,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    minWidth: 14,
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '800',
  },
  setCode: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  price: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '700',
  },
});

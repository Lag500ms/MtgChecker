import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import type { OwnedCard } from '@/features/collection/types/inventory';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type OwnedCardRowProps = {
  card: OwnedCard;
  onInc: () => void;
  onDec: () => void;
  onDelete: () => void;
  onPress?: () => void;
};

function OwnedCardRowComponent({ card, onInc, onDec, onDelete, onPress }: OwnedCardRowProps) {
  const { theme } = useAppTheme();

  const isFoil = card.finish.toLowerCase() === 'foil';
  const isEtched = card.finish.toLowerCase() === 'etched';
  const hasMultiple = card.quantity > 1;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.thumbWrap}>
        {card.imageUri ? (
          <Image
            source={{ uri: card.imageUri }}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.thumbFallback, { backgroundColor: '#071A1B' }]}>
            <Feather name="image" size={16} color="#6B8A8C" />
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {card.name}
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.setCodeBadge}>
            <Text style={styles.setCodeText}>
              {card.setCode.toUpperCase()} #{card.collectorNumber}
            </Text>
          </View>

          {isFoil && (
            <View style={styles.foilBadge}>
              <Feather name="star" size={9} color="#D4AF37" />
              <Text style={styles.foilText}>FOIL</Text>
            </View>
          )}

          {isEtched && (
            <View style={styles.etchedBadge}>
              <Text style={styles.etchedText}>ETCHED</Text>
            </View>
          )}

          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{card.condition ?? 'NM'}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.priceUnit, { color: theme.accent }]}>
            ${card.priceUsd ?? '—'}
          </Text>
          {hasMultiple && card.totalPriceUsd ? (
            <Text style={[styles.priceTotal, { color: theme.textSecondary }]}>
              (Total: ${card.totalPriceUsd})
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <View style={[styles.stepperWrap, { borderColor: theme.border }]}>
          <Pressable onPress={onDec} hitSlop={6} style={styles.stepperBtn}>
            <Feather name="minus" size={14} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.qtyBox}>
            <Text style={[styles.qtyText, { color: theme.text }]}>{card.quantity}</Text>
          </View>

          <Pressable onPress={onInc} hitSlop={6} style={styles.stepperBtn}>
            <Feather name="plus" size={14} color={theme.accent} />
          </Pressable>
        </View>

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Feather name="trash-2" size={16} color={theme.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export const OwnedCardRow = memo(OwnedCardRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: 44,
    height: 62,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: '#071A1B',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  setCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  setCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B9C9C4',
    letterSpacing: 0.3,
  },
  foilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: borderRadius.sm,
  },
  foilText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F6D48A',
    letterSpacing: 0.5,
  },
  etchedBadge: {
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: borderRadius.sm,
  },
  etchedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: borderRadius.sm,
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 1,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceTotal: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  qtyBox: {
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
});

import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardArt } from '@/components/CardArt';
import { ManaPips } from '@/components/ManaPips';
import { SetSymbol } from '@/components/SetSymbol';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import type { DeckCardItem } from '../types/deck';
import type { Card } from '@/features/cards/types/card';

export type SampleHandModalProps = {
  visible: boolean;
  cards: DeckCardItem[];
  deckName: string;
  onClose: () => void;
};

function flattenAndShuffle(cards: DeckCardItem[]): DeckCardItem[] {
  const pool: DeckCardItem[] = [];
  for (const card of cards) {
    const qty = Math.max(1, card.quantity || 1);
    for (let i = 0; i < qty; i++) {
      pool.push({ ...card });
    }
  }

  /* Fisher-Yates Shuffle */
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  return pool;
}

function toCardLike(item: DeckCardItem): Card {
  return {
    id: item.scryfallId,
    oracleId: item.scryfallId,
    name: item.name,
    set: item.setCode || 'mtg',
    setName: item.setCode?.toUpperCase() || 'Set',
    collectorNumber: item.collectorNumber || '1',
    manaCost: item.manaCost,
    typeLine: item.typeLine,
    rarity: 'common',
    imageUris: item.imageUrl
      ? {
          small: item.imageUrl,
          normal: item.imageUrl,
          large: item.imageUrl,
          png: item.imageUrl,
          artCrop: item.imageUrl,
          borderCrop: item.imageUrl,
        }
      : undefined,
  };
}

function SampleHandModalComponent({
  visible,
  cards,
  deckName,
  onClose,
}: SampleHandModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [library, setLibrary] = useState<DeckCardItem[]>([]);
  const [hand, setHand] = useState<DeckCardItem[]>([]);
  const [mulliganCount, setMulliganCount] = useState(0);

  const resetGame = useCallback(() => {
    const shuffled = flattenAndShuffle(cards);
    setHand(shuffled.slice(0, 7));
    setLibrary(shuffled.slice(7));
    setMulliganCount(0);
  }, [cards]);

  useEffect(() => {
    if (visible) {
      resetGame();
    }
  }, [visible, resetGame]);

  const handleMulligan = () => {
    const nextCount = mulliganCount + 1;
    const shuffled = flattenAndShuffle(cards);
    setHand(shuffled.slice(0, 7));
    setLibrary(shuffled.slice(7));
    setMulliganCount(nextCount);
  };

  const handleDrawOne = () => {
    if (library.length === 0) return;
    const nextCard = library[0];
    setLibrary((prev) => prev.slice(1));
    setHand((prev) => [...prev, nextCard]);
  };

  const landsInHand = hand.filter((c) =>
    (c.typeLine || '').toLowerCase().includes('land')
  ).length;

  const isSmallScreen = width < 380;
  const cardWidth = isSmallScreen ? (width - 48) / 2 : (width - 56) / 3;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingTop: Math.max(insets.top, spacing.md),
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                Playtest Hand: {deckName}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Hand: {hand.length} · Library: {library.length}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Status Bar */}
          <View style={[styles.statusBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.statusCol}>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Opening Lands</Text>
              <Text
                style={[
                  styles.statusValue,
                  {
                    color:
                      landsInHand >= 2 && landsInHand <= 4
                        ? '#22C55E'
                        : landsInHand < 2
                        ? '#EF4444'
                        : '#F59E0B',
                  },
                ]}
              >
                {landsInHand} / {hand.length} Lands
              </Text>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusCol}>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Mulligan</Text>
              <Text style={[styles.statusValue, { color: mulliganCount > 0 ? '#F59E0B' : theme.text }]}>
                {mulliganCount === 0 ? 'Initial (0)' : `Mulligan ${mulliganCount} (Bottom ${mulliganCount})`}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsBar}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleDrawOne}
              disabled={library.length === 0}
            >
              <Feather name="plus-circle" size={15} color={theme.accentContrast} />
              <Text style={[styles.actionBtnText, { color: theme.accentContrast }]}>Draw 1 Card</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtnSecondary,
                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleMulligan}
            >
              <Feather name="rotate-ccw" size={15} color={theme.text} />
              <Text style={[styles.actionBtnSecText, { color: theme.text }]}>Mulligan</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtnSecondary,
                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={resetGame}
            >
              <Feather name="refresh-cw" size={15} color={theme.textMuted} />
              <Text style={[styles.actionBtnSecText, { color: theme.textMuted }]}>Shuffle</Text>
            </Pressable>
          </View>

          {/* Hand Cards Grid */}
          <ScrollView contentContainerStyle={styles.cardsScroll} showsVerticalScrollIndicator={false}>
            {hand.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="inbox" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No cards in hand.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {hand.map((item, idx) => {
                  const cardLike = toCardLike(item);
                  return (
                    <View
                      key={`${item.scryfallId}-${idx}`}
                      style={[
                        styles.cardCell,
                        {
                          width: cardWidth,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.cardCellImageWrap}>
                        <CardArt card={cardLike} size="normal" contentFit="cover" style={styles.cardArt} />
                      </View>

                      <View style={styles.cardCellMeta}>
                        <Text style={[styles.cardCellName, { color: theme.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.cardCellSubRow}>
                          {item.setCode ? (
                            <SetSymbol setCode={item.setCode} size={11} />
                          ) : null}
                          <ManaPips manaCost={item.manaCost} size={11} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusCol: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionBtnSecText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardsScroll: {
    paddingBottom: spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardCell: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 4,
  },
  cardCellImageWrap: {
    aspectRatio: 63 / 88,
    width: '100%',
  },
  cardArt: {
    width: '100%',
    height: '100%',
  },
  cardCellMeta: {
    paddingHorizontal: 4,
    paddingTop: 3,
    gap: 2,
  },
  cardCellName: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardCellSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
  },
});

export const SampleHandModal = memo(SampleHandModalComponent);

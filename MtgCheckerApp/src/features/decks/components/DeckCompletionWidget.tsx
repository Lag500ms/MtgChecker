import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { listOwnedCards } from '@/features/collection/api/inventoryApi';
import type { OwnedCard } from '@/features/collection/types/inventory';
import { SetSymbol } from '@/components/SetSymbol';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import type { DeckCardItem } from '../types/deck';

export type DeckCompletionWidgetProps = {
  cards: DeckCardItem[];
};

interface MissingCardItem {
  name: string;
  needed: number;
  owned: number;
  missing: number;
  priceUsd: number;
  setCode?: string;
}

function DeckCompletionWidgetComponent({ cards }: DeckCompletionWidgetProps) {
  const { theme } = useAppTheme();
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMissingModal, setShowMissingModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    listOwnedCards()
      .then((data) => {
        if (isMounted) {
          setOwnedCards(data || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOwnedCards([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const analysis = useMemo(() => {
    const ownedMap = new Map<string, number>();
    for (const oc of ownedCards) {
      const key = oc.name.toLowerCase().trim();
      ownedMap.set(key, (ownedMap.get(key) || 0) + (oc.quantity || 1));
    }

    let totalCardsRequired = 0;
    let totalCardsOwned = 0;
    let estimatedMissingCost = 0;
    const missingList: MissingCardItem[] = [];

    for (const card of cards) {
      const qty = Math.max(1, card.quantity || 1);
      totalCardsRequired += qty;

      const key = card.name.toLowerCase().trim();
      const owned = ownedMap.get(key) || 0;
      const matched = Math.min(qty, owned);
      totalCardsOwned += matched;

      const diff = qty - owned;
      if (diff > 0) {
        const unitPrice = 0.5; /* Default estimate if unpriced */
        const cost = diff * unitPrice;
        estimatedMissingCost += cost;

        missingList.push({
          name: card.name,
          needed: qty,
          owned,
          missing: diff,
          priceUsd: cost,
          setCode: card.setCode,
        });
      }
    }

    const completionPct =
      totalCardsRequired > 0
        ? Math.round((totalCardsOwned / totalCardsRequired) * 100)
        : 100;

    return {
      totalCardsRequired,
      totalCardsOwned,
      totalMissing: totalCardsRequired - totalCardsOwned,
      completionPct,
      estimatedMissingCost: Math.round(estimatedMissingCost * 100) / 100,
      missingList,
    };
  }, [cards, ownedCards]);

  if (loading) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Đang so khớp với Kho bộ sưu tập...
        </Text>
      </View>
    );
  }

  if (cards.length === 0) return null;

  const pctColor =
    analysis.completionPct >= 90
      ? '#22C55E'
      : analysis.completionPct >= 60
      ? '#F59E0B'
      : '#EF4444';

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]}>Mức Độ Hoàn Thiện (Deck Completion)</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            So khớp bài trong Deck với Kho sưu tập cá nhân
          </Text>
        </View>

        <View style={[styles.pctBadge, { backgroundColor: pctColor + '20', borderColor: pctColor }]}>
          <Text style={[styles.pctBadgeText, { color: pctColor }]}>{analysis.completionPct}% ĐÃ CÓ</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.trackBg, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.fillBar,
            { width: `${Math.max(3, analysis.completionPct)}%`, backgroundColor: pctColor },
          ]}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.statBoxLabel, { color: theme.textMuted }]}>ĐÃ SỞ HỮU</Text>
          <Text style={[styles.statBoxValue, { color: '#22C55E' }]}>
            {analysis.totalCardsOwned} / {analysis.totalCardsRequired} lá
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.statBoxLabel, { color: theme.textMuted }]}>CÒN THIẾU</Text>
          <Text style={[styles.statBoxValue, { color: analysis.totalMissing > 0 ? '#EF4444' : '#22C55E' }]}>
            {analysis.totalMissing === 0 ? 'Đủ 100%' : `${analysis.totalMissing} lá`}
          </Text>
        </View>
      </View>

      {/* Action to View Missing */}
      {analysis.totalMissing > 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.viewMissingBtn,
            { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => setShowMissingModal(true)}
        >
          <Feather name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.viewMissingText}>
            Xem danh sách {analysis.totalMissing} lá còn thiếu
          </Text>
          <Feather name="chevron-right" size={14} color="#EF4444" />
        </Pressable>
      ) : (
        <View style={styles.fullOwnedBadge}>
          <Feather name="check-circle" size={14} color="#22C55E" />
          <Text style={styles.fullOwnedText}>
            Bạn đã sở hữu đầy đủ tất cả lá bài trong bộ bài này!
          </Text>
        </View>
      )}

      {/* Missing Cards Modal */}
      <Modal
        visible={showMissingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMissingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Danh Sách {analysis.totalMissing} Thẻ Bài Còn Thiếu
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Cần tìm mua hoặc đổi bài (Trade) để hoàn thiện deck
                </Text>
              </View>
              <Pressable onPress={() => setShowMissingModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {analysis.missingList.map((item, idx) => (
                <View
                  key={`${item.name}-${idx}`}
                  style={[styles.missingRow, { borderColor: theme.border }]}
                >
                  <View style={styles.missingLeft}>
                    <View style={styles.missingQtyBadge}>
                      <Text style={styles.missingQtyText}>x{item.missing}</Text>
                    </View>
                    <View style={styles.missingNameWrap}>
                      <Text style={[styles.missingName, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.missingSubRow}>
                        {item.setCode ? (
                          <SetSymbol setCode={item.setCode} size={11} />
                        ) : null}
                        <Text style={[styles.missingSubText, { color: theme.textMuted }]}>
                          Cần: {item.needed} · Kho có: {item.owned}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.modalCloseBtn, { backgroundColor: theme.accent }]}
              onPress={() => setShowMissingModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  loadingBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  loadingText: {
    ...typography.caption,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  statBox: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statBoxValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  viewMissingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 2,
  },
  viewMissingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  fullOwnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  fullOwnedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    maxHeight: '80%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...typography.body,
    fontWeight: '800',
  },
  modalSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  modalScroll: {
    maxHeight: 380,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  missingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  missingQtyBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  missingQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  missingNameWrap: {
    flex: 1,
    gap: 2,
  },
  missingName: {
    fontSize: 13,
    fontWeight: '700',
  },
  missingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missingSubText: {
    fontSize: 10,
  },
  modalCloseBtn: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0E12',
  },
});

export const DeckCompletionWidget = memo(DeckCompletionWidgetComponent);

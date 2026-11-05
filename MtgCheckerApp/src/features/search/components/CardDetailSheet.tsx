import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardArt } from '@/components/CardArt';
import { HoloFoilCard } from '@/components/HoloFoilCard';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { findPrintings, fetchCardRulings, type CardRuling } from '@/features/cards/api/cardsApi';
import type { Card } from '@/features/cards/types/card';
import { addOwnedCard } from '@/features/collection/api/inventoryApi';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type CardDetailSheetProps = {
  card: Card | null;
  visible: boolean;
  onClose: () => void;
  onSelectPrinting?: (newCard: Card) => void;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  recognizedText?: string;
  onOpenManualCorrection?: (initialText?: string) => void;
};

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  common: { bg: '#374151', text: '#E5E7EB' },
  uncommon: { bg: '#475569', text: '#CBD5E1' },
  rare: { bg: '#854D0E', text: '#FEF08A' },
  mythic: { bg: '#9A3412', text: '#FFEDD5' },
};

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

export function CardDetailSheet({
  card,
  visible,
  onClose,
  onSelectPrinting,
  confidence,
  recognizedText,
  onOpenManualCorrection,
}: CardDetailSheetProps) {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [activeCard, setActiveCard] = useState<Card | null>(card);
  const [printings, setPrintings] = useState<Card[]>([]);
  const [loadingPrintings, setLoadingPrintings] = useState(false);
  const [selectedFinish, setSelectedFinish] = useState<'nonfoil' | 'foil' | 'etched'>('nonfoil');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [rulings, setRulings] = useState<CardRuling[]>([]);
  const [loadingRulings, setLoadingRulings] = useState(false);
  const [rulingsExpanded, setRulingsExpanded] = useState(false);

  useEffect(() => {
    setActiveCard(card);
    setQuantity(1);
    if (!card) {
      setPrintings([]);
      setRulings([]);
      return;
    }

    setLoadingPrintings(true);
    findPrintings(card.name)
      .then((list) => {
        setPrintings(list || []);
      })
      .catch(() => {
        setPrintings([]);
      })
      .finally(() => {
        setLoadingPrintings(false);
      });
  }, [card]);

  useEffect(() => {
    if (!activeCard?.id) {
      setRulings([]);
      return;
    }
    setLoadingRulings(true);
    fetchCardRulings(activeCard.id)
      .then((data) => {
        setRulings(data || []);
      })
      .catch(() => {
        setRulings([]);
      })
      .finally(() => {
        setLoadingRulings(false);
      });
  }, [activeCard?.id]);

  if (!activeCard) return null;

  const current = activeCard;
  const manaSymbols = parseManaSymbols(current.manaCost);
  const rarityKey = (current.rarity || 'common').toLowerCase();
  const rarityStyle = RARITY_COLORS[rarityKey] || RARITY_COLORS.common;

  const handleAdd = async () => {
    if (!account) {
      toast.info('Please sign in to add cards to your collection.', 'Sign in required');
      return;
    }

    setAdding(true);
    try {
      await addOwnedCard({
        setCode: current.set,
        collectorNumber: current.collectorNumber,
        finish: selectedFinish,
        quantity,
      });
      toast.success(`Added ${quantity}x ${current.name} (${current.set.toUpperCase()}) to collection.`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not add card');
    } finally {
      setAdding(false);
    }
  };

  const legalities = current.legalities || {};
  const priorityFormats = ['commander', 'standard', 'modern', 'pioneer', 'legacy', 'pauper'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.topHandleBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {current.name}
              </Text>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                hitSlop={8}
              >
                <Feather name="x" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.imageSection}>
              <HoloFoilCard
                card={current}
                finish={selectedFinish}
                size="normal"
                contentFit="contain"
                style={styles.cardImage}
              />
              {selectedFinish !== 'nonfoil' && (
                <View style={styles.foilHintBadge}>
                  <Feather name="zap" size={12} color="#FBBF24" />
                  <Text style={styles.foilHintText}>
                    {selectedFinish === 'etched'
                      ? 'Nghiêng máy hoặc vuốt để xem ánh kim Etched'
                      : 'Nghiêng máy hoặc vuốt để xem ánh nhũ Foil 3D'}
                  </Text>
                </View>
              )}
            </View>

            {confidence && (
              <View
                style={[
                  styles.confidenceCard,
                  {
                    backgroundColor:
                      confidence === 'HIGH'
                        ? 'rgba(22, 163, 74, 0.12)'
                        : confidence === 'MEDIUM'
                        ? 'rgba(245, 158, 11, 0.14)'
                        : 'rgba(220, 38, 38, 0.14)',
                    borderColor:
                      confidence === 'HIGH'
                        ? '#16A34A'
                        : confidence === 'MEDIUM'
                        ? '#F59E0B'
                        : '#DC2626',
                  },
                ]}
              >
                <View style={styles.confidenceLeft}>
                  <Feather
                    name={
                      confidence === 'HIGH'
                        ? 'check-circle'
                        : confidence === 'MEDIUM'
                        ? 'alert-triangle'
                        : 'alert-circle'
                    }
                    size={16}
                    color={
                      confidence === 'HIGH'
                        ? '#16A34A'
                        : confidence === 'MEDIUM'
                        ? '#F59E0B'
                        : '#DC2626'
                    }
                  />
                  <View style={styles.confidenceCol}>
                    <Text
                      style={[
                        styles.confidenceTitle,
                        {
                          color:
                            confidence === 'HIGH'
                              ? '#16A34A'
                              : confidence === 'MEDIUM'
                              ? '#F59E0B'
                              : '#DC2626',
                        },
                      ]}
                    >
                      {confidence === 'HIGH'
                        ? 'High Recognition Match'
                        : confidence === 'MEDIUM'
                        ? 'Medium Recognition Match'
                        : 'Low Recognition Match'}
                    </Text>
                    <Text style={[styles.confidenceSub, { color: theme.textSecondary }]}>
                      {recognizedText ? `OCR text: "${recognizedText}"` : 'Verify Set code and Number'}
                    </Text>
                  </View>
                </View>

                {onOpenManualCorrection && confidence !== 'HIGH' && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onOpenManualCorrection(recognizedText);
                    }}
                    style={[styles.confidenceFixBtn, { backgroundColor: theme.accent }]}
                    hitSlop={8}
                  >
                    <Text style={[styles.confidenceFixBtnText, { color: theme.accentContrast }]}>
                      Edit
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.headerBlock}>
              {manaSymbols.length > 0 && (
                <View style={styles.manaRow}>
                  {manaSymbols.map((sym, idx) => {
                    const sStyle = getManaSymbolStyle(sym);
                    return (
                      <View key={`${sym}-${idx}`} style={[styles.manaPip, { backgroundColor: sStyle.bg }]}>
                        <Text style={[styles.manaPipText, { color: sStyle.text }]}>{sym}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.typeBadgeRow}>
                <Text style={[styles.typeText, { color: theme.textSecondary }]}>
                  {current.typeLine || 'Card'}
                </Text>
                <View style={[styles.rarityPill, { backgroundColor: rarityStyle.bg }]}>
                  <Text style={[styles.rarityPillText, { color: rarityStyle.text }]}>
                    {(current.rarity || 'common').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.setDetailText, { color: theme.textMuted }]}>
                {current.setName} · {current.set.toUpperCase()} #{current.collectorNumber}
                {current.releasedAt ? ` · ${current.releasedAt}` : ''}
              </Text>
            </View>

            {current.oracleText ? (
              <View style={[styles.oracleBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.oracleLabel, { color: theme.textSecondary }]}>Oracle Text</Text>
                <Text style={[styles.oracleText, { color: theme.text }]}>{current.oracleText}</Text>
              </View>
            ) : null}

            {current.flavorText ? (
              <View style={styles.flavorBox}>
                <Text style={[styles.flavorText, { color: theme.textMuted }]}>
                  "{current.flavorText}"
                </Text>
              </View>
            ) : null}

            {current.power && current.toughness ? (
              <View style={[styles.ptBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Text style={[styles.ptText, { color: theme.text }]}>
                  P/T: {current.power} / {current.toughness}
                </Text>
              </View>
            ) : current.loyalty ? (
              <View style={[styles.ptBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Text style={[styles.ptText, { color: theme.text }]}>
                  Loyalty: {current.loyalty}
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Market Prices</Text>
            </View>

            <View style={styles.priceGrid}>
              <View style={[styles.priceCell, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.priceCellLabel, { color: theme.textMuted }]}>USD Non-foil</Text>
                <Text style={[styles.priceCellValue, { color: theme.accent }]}>
                  ${current.prices?.usd || '—'}
                </Text>
              </View>

              <View style={[styles.priceCell, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.priceCellLabel, { color: theme.textMuted }]}>USD Foil</Text>
                <Text style={[styles.priceCellValue, { color: theme.accent }]}>
                  ${current.prices?.usdFoil || '—'}
                </Text>
              </View>

              <View style={[styles.priceCell, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.priceCellLabel, { color: theme.textMuted }]}>EUR</Text>
                <Text style={[styles.priceCellValue, { color: theme.accent }]}>
                  €{current.prices?.eur || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>All Printings</Text>
              {loadingPrintings && <ActivityIndicator size="small" color={theme.accent} />}
            </View>

            {printings.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.printingsScroll}>
                {printings.map((p) => {
                  const isSelected = p.id === current.id;
                  const pPrice = p.prices?.usd ?? p.prices?.usdFoil ?? '—';
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setActiveCard(p);
                        if (onSelectPrinting) onSelectPrinting(p);
                      }}
                      style={[
                        styles.printingCard,
                        {
                          backgroundColor: theme.background,
                          borderColor: isSelected ? theme.accent : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.printingSetCode, { color: isSelected ? theme.accent : theme.text }]}>
                        {p.set.toUpperCase()}
                      </Text>
                      <Text style={[styles.printingSetSub, { color: theme.textMuted }]} numberOfLines={1}>
                        #{p.collectorNumber}
                      </Text>
                      <Text style={[styles.printingPrice, { color: theme.accent }]}>
                        ${pPrice}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={[styles.noPrintingsText, { color: theme.textMuted }]}>
                No other printings found.
              </Text>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Format Legalities</Text>
            </View>

            <View style={styles.legalitiesGrid}>
              {priorityFormats.map((fmt) => {
                const status = legalities[fmt] || 'not_legal';
                const isLegal = status === 'legal';
                const isBanned = status === 'banned';
                return (
                  <View
                    key={fmt}
                    style={[
                      styles.legalityBadge,
                      {
                        backgroundColor: isLegal
                          ? 'rgba(22, 163, 74, 0.15)'
                          : isBanned
                          ? 'rgba(220, 38, 38, 0.15)'
                          : theme.background,
                        borderColor: isLegal
                          ? '#16A34A'
                          : isBanned
                          ? '#DC2626'
                          : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.legalityFormat,
                        {
                          color: isLegal
                            ? '#16A34A'
                            : isBanned
                            ? '#DC2626'
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {fmt.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.legalityStatus,
                        {
                          color: isLegal
                            ? '#16A34A'
                            : isBanned
                            ? '#DC2626'
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setRulingsExpanded((prev) => !prev)}
              style={({ pressed }) => [
                styles.rulingsCollapsibleHeader,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.rulingsHeaderLeft}>
                <Feather name="shield" size={16} color="#E0AD62" />
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: spacing.sm }]}>
                  Official WotC Rulings
                </Text>
                {rulings.length > 0 && (
                  <View style={styles.rulingsBadge}>
                    <Text style={styles.rulingsBadgeText}>{rulings.length}</Text>
                  </View>
                )}
              </View>
              <View style={styles.rulingsHeaderRight}>
                {loadingRulings ? (
                  <ActivityIndicator size="small" color="#E0AD62" />
                ) : (
                  <Feather
                    name={rulingsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textMuted}
                  />
                )}
              </View>
            </Pressable>

            {rulingsExpanded && (
              <View style={styles.rulingsBody}>
                {rulings.length === 0 ? (
                  <View
                    style={[
                      styles.emptyRulingsBox,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <Feather name="check-circle" size={16} color="#22C55E" />
                    <Text style={[styles.emptyRulingsText, { color: theme.textSecondary }]}>
                      Không có ngoại lệ hoặc ruling đặc thù. Thẻ bài tuân theo luật cơ bản MTG Comprehensive Rules.
                    </Text>
                  </View>
                ) : (
                  rulings.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.rulingItemCard,
                        { backgroundColor: theme.background, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.rulingItemHeader}>
                        <View style={styles.rulingSourceTag}>
                          <Text style={styles.rulingSourceTagText}>
                            {(item.source || 'WotC').toUpperCase()}
                          </Text>
                        </View>
                        {item.publishedAt ? (
                          <Text style={[styles.rulingDateText, { color: theme.textMuted }]}>
                            {item.publishedAt}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.rulingCommentText, { color: theme.text }]}>
                        {item.comment}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              {
                borderTopColor: theme.border,
                backgroundColor: theme.surface,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={styles.finishToggleRow}>
              <Pressable
                onPress={() => setSelectedFinish('nonfoil')}
                style={[
                  styles.finishChip,
                  { borderColor: theme.border, backgroundColor: theme.background },
                  selectedFinish === 'nonfoil' && {
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.finishChipText,
                    { color: theme.text },
                    selectedFinish === 'nonfoil' && { color: theme.accentContrast, fontWeight: '700' },
                  ]}
                >
                  Regular
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedFinish('foil')}
                style={[
                  styles.finishChip,
                  { borderColor: theme.border, backgroundColor: theme.background },
                  selectedFinish === 'foil' && {
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.finishChipText,
                    { color: theme.text },
                    selectedFinish === 'foil' && { color: theme.accentContrast, fontWeight: '700' },
                  ]}
                >
                  Foil
                </Text>
              </Pressable>

              {current.finishes?.includes('etched') && (
                <Pressable
                  onPress={() => setSelectedFinish('etched')}
                  style={[
                    styles.finishChip,
                    { borderColor: theme.border, backgroundColor: theme.background },
                    selectedFinish === 'etched' && {
                      backgroundColor: theme.accent,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.finishChipText,
                      { color: theme.text },
                      selectedFinish === 'etched' && { color: theme.accentContrast, fontWeight: '700' },
                    ]}
                  >
                    Etched
                  </Text>
                </Pressable>
              )}

              <View style={[styles.quantityStepper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.stepperAction}
                  hitSlop={6}
                >
                  <Feather name="minus" size={14} color={theme.text} />
                </Pressable>
                <Text style={[styles.quantityNumber, { color: theme.text }]}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => q + 1)}
                  style={styles.stepperAction}
                  hitSlop={6}
                >
                  <Feather name="plus" size={14} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={adding}
              style={[styles.addBtn, { backgroundColor: theme.accent }]}
            >
              {adding ? (
                <ActivityIndicator size="small" color={theme.accentContrast} />
              ) : (
                <>
                  <Feather name="plus-circle" size={18} color={theme.accentContrast} />
                  <Text
                    style={[styles.addBtnText, { color: theme.accentContrast }]}
                    numberOfLines={1}
                  >
                    {quantity > 1 ? `Add ${quantity} to collection` : 'Add to collection'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    height: '86%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  topHandleBar: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    elevation: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  imageSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  cardImage: {
    width: 176,
    height: 246,
    borderRadius: 12,
  },
  foilHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  foilHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  placeholderCard: {
    width: 220,
    height: 308,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderCardText: {
    ...typography.caption,
  },
  headerBlock: {
    gap: 4,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h2,
    fontWeight: '800',
    flex: 1,
  },
  manaRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  manaPip: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaPipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeText: {
    ...typography.body,
    fontWeight: '600',
  },
  rarityPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  rarityPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  setDetailText: {
    ...typography.caption,
  },
  oracleBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  oracleLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  oracleText: {
    ...typography.body,
    lineHeight: 22,
  },
  flavorBox: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  flavorText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  ptBox: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  ptText: {
    ...typography.bodySmall,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  priceGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priceCell: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  priceCellLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  priceCellValue: {
    ...typography.body,
    fontWeight: '800',
  },
  printingsScroll: {
    marginBottom: spacing.sm,
  },
  printingCard: {
    width: 80,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  printingSetCode: {
    ...typography.bodySmall,
    fontWeight: '800',
  },
  printingSetSub: {
    fontSize: 10,
  },
  printingPrice: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  noPrintingsText: {
    ...typography.caption,
    marginVertical: spacing.xs,
  },
  legalitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  legalityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  legalityFormat: {
    fontSize: 9,
    fontWeight: '800',
  },
  legalityStatus: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  finishToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  finishChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  finishChipText: {
    ...typography.caption,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'stretch',
  },
  addBtnText: {
    ...typography.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  confidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  confidenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  confidenceCol: {
    flex: 1,
  },
  confidenceTitle: {
    ...typography.caption,
    fontWeight: '700',
  },
  confidenceSub: {
    fontSize: 11,
  },
  confidenceFixBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  confidenceFixBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 4,
  },
  stepperAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  quantityNumber: {
    ...typography.caption,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  rulingsCollapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  rulingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulingsHeaderRight: {
    paddingLeft: spacing.sm,
  },
  rulingsBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(224, 173, 98, 0.2)',
  },
  rulingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E0AD62',
  },
  rulingsBody: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  emptyRulingsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  emptyRulingsText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  rulingItemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  rulingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulingSourceTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rulingSourceTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  rulingDateText: {
    fontSize: 11,
  },
  rulingCommentText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
});

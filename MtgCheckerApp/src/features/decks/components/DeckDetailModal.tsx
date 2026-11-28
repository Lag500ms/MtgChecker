import { useUiText } from '@/lib/useUiText';
import { getApiErrorMessage } from '@/lib/apiError';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SetSymbol } from '@/components/SetSymbol';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ui';
import { ManaCurveChart } from './ManaCurveChart';
import { ManaBaseAnalyzer } from './ManaBaseAnalyzer';
import { DeckCompletionWidget } from './DeckCompletionWidget';
import { SampleHandModal } from './SampleHandModal';
import { parseDeckText } from '../utils/deckTextParser';
import { checkCardLegality } from '../utils/legality';
import { syncDeckCards } from '../api/deckApi';
import { findPrintings } from '@/features/cards/api/cardsApi';
import type { Card } from '@/features/cards/types/card';
import type { Deck, DeckCardItem } from '../types/deck';

interface DeckDetailModalProps {
  visible: boolean;
  deck: Deck | null;
  onClose: () => void;
  onDeckUpdated: (updated: Deck) => void;
}

const COLOR_MAP: Record<string, { label: string; bg: string; text: string }> = {
  W: { label: 'White', bg: '#F9FAF4', text: '#333333' },
  U: { label: 'Blue', bg: '#0E68AB', text: '#FFFFFF' },
  B: { label: 'Black', bg: '#150B00', text: '#FFFFFF' },
  R: { label: 'Red', bg: '#D3202A', text: '#FFFFFF' },
  G: { label: 'Green', bg: '#00733E', text: '#FFFFFF' },
};

export function DeckDetailModal({
  visible,
  deck,
  onClose,
  onDeckUpdated,
}: DeckDetailModalProps) {
  const ui = useUiText();
  const { theme } = useAppTheme();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const isLandscape = width > 500;

  const [cards, setCards] = useState<DeckCardItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINBOARD' | 'SIDEBOARD'>('ALL');
  const [viewMode, setViewMode] = useState<'text' | 'image'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<DeckCardItem | null>(null);
  const [infoModalData, setInfoModalData] = useState<{ title: string; message: string } | null>(null);

  const [editingCard, setEditingCard] = useState<DeckCardItem | null>(null);
  const [printings, setPrintings] = useState<Card[]>([]);
  const [loadingPrintings, setLoadingPrintings] = useState(false);

  const [showSampleHand, setShowSampleHand] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const numColumns = viewMode === 'text' ? 1 : isLandscape ? 6 : 3;
  const gridGap = 8;
  const gridPadding = 16 * 2;
  const cardWidth = Math.floor((width - gridPadding - gridGap * (numColumns - 1)) / numColumns);
  const cardHeight = Math.floor(cardWidth * (88 / 63));

  useEffect(() => {
    if (!editingCard) {
      setPrintings([]);
      return;
    }
    setLoadingPrintings(true);
    findPrintings(editingCard.name)
      .then((res) => {
        setPrintings(res || []);
      })
      .catch(() => {
        setPrintings([]);
      })
      .finally(() => {
        setLoadingPrintings(false);
      });
  }, [editingCard]);

  const handleSelectPrinting = (printing: Card) => {
    if (!editingCard) return;
    const newImageUrl = printing.imageUris?.normal || printing.imageUris?.small;
    setCards((prev) =>
      prev.map((c) => {
        if (c.scryfallId === editingCard.scryfallId) {
          return {
            ...c,
            scryfallId: printing.id,
            imageUrl: newImageUrl,
            setCode: printing.set,
            collectorNumber: printing.collectorNumber,
          };
        }
        return c;
      })
    );
    setHasUnsavedChanges(true);
    toast.success(`Switched to [${printing.set.toUpperCase()} #${printing.collectorNumber}].`);
    setEditingCard(null);
  };

  const handleBatchImportText = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const parsed = parseDeckText(importText);
      if (parsed.lines.length === 0) {
        toast.info(ui("No cards recognized from text."));
        return;
      }

      /* Search cards from backend or Scryfall */
      const newItems: DeckCardItem[] = [];
      for (const line of parsed.lines) {
        try {
          const resp = await apiClient.get<any>('/cards/named', {
            params: { exact: line.name },
          });
          const cardData = resp.data;
          const leg = checkCardLegality(cardData, deck?.format, deck?.commanderColorIdentity);
          newItems.push({
            scryfallId: cardData.id,
            name: cardData.name,
            imageUrl: cardData.imageUris?.normal || cardData.imageUris?.small,
            manaCost: cardData.manaCost,
            cmc: cardData.cmc,
            typeLine: cardData.typeLine,
            quantity: line.quantity,
            category: line.category,
            setCode: cardData.set,
            collectorNumber: cardData.collectorNumber,
            isLegal: leg.isLegal,
            legalityStatus: leg.status,
          });
        } catch {
          newItems.push({
            scryfallId: `custom-${Date.now()}-${Math.random()}`,
            name: line.name,
            quantity: line.quantity,
            category: line.category,
            setCode: line.setCode,
            collectorNumber: line.collectorNumber,
          });
        }
      }

      setCards((prev) => {
        const merged = [...prev];
        for (const item of newItems) {
          const existingIdx = merged.findIndex((c) => c.name.toLowerCase() === item.name.toLowerCase());
          if (existingIdx >= 0) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              quantity: merged[existingIdx].quantity + item.quantity,
            };
          } else {
            merged.push(item);
          }
        }
        return merged;
      });

      setHasUnsavedChanges(true);
      setShowImportModal(false);
      setImportText('');
      toast.success(`Successfully imported ${parsed.totalCards} cards into deck!`);
    } catch (error) {
      toast.error(ui(getApiErrorMessage(error)));
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (deck) {
      setCards(deck.cards || []);
      setHasUnsavedChanges(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [deck]);

  const cardsWithLegality = useMemo(() => {
    if (!deck) return [];
    return cards.map((card) => {
      const leg = checkCardLegality(card as any, deck.format, deck.commanderColorIdentity);
      return {
        ...card,
        isLegal: leg.isLegal,
        legalityStatus: leg.status,
        legalityBadge: leg.badgeText,
        legalityColor: leg.badgeColor,
        legalityReason: leg.reason,
      };
    });
  }, [cards, deck]);

  const illegalCardsCount = useMemo(() => {
    return cardsWithLegality.filter((c) => !c.isLegal).length;
  }, [cardsWithLegality]);

  const totalCardCount = useMemo(() => {
    return cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (activeTab === 'ALL') return cardsWithLegality;
    return cardsWithLegality.filter((c) => c.category === activeTab);
  }, [cardsWithLegality, activeTab]);

  const handleUpdateQuantity = (scryfallId: string, delta: number) => {
    setCards((prev) => {
      const next = prev
        .map((c) => {
          if (c.scryfallId === scryfallId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as DeckCardItem[];
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleConfirmRemoveCard = () => {
    if (!cardToDelete) return;
    setCards((prev) => prev.filter((c) => c.scryfallId !== cardToDelete.scryfallId));
    setHasUnsavedChanges(true);
    toast.info(`Removed "${cardToDelete.name}" from deck.`);
    setCardToDelete(null);
  };

  const handleSearchCard = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await apiClient.get<any[]>('/cards/local-cache', {
        params: { query: searchQuery.trim(), limit: 8 },
      });
      setSearchResults(response.data || []);
    } catch {
      try {
        const fallback = await apiClient.get<any>('/cards/search', {
          params: { q: searchQuery.trim() },
        });
        setSearchResults(fallback.data?.cards?.slice(0, 8) || []);
      } catch {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCardToDeck = (rawCard: any) => {
    const existingIndex = cards.findIndex((c) => c.scryfallId === rawCard.id);
    if (existingIndex >= 0) {
      handleUpdateQuantity(rawCard.id, 1);
    } else {
      const newCard: DeckCardItem = {
        scryfallId: rawCard.id,
        name: rawCard.name,
        setCode: rawCard.set,
        collectorNumber: rawCard.collectorNumber,
        manaCost: rawCard.manaCost,
        typeLine: rawCard.typeLine,
        imageUrl: rawCard.imageUris?.normal || rawCard.imageUris?.small,
        cmc: rawCard.cmc != null ? Number(rawCard.cmc) : 0,
        quantity: 1,
        category: 'MAINBOARD',
      };
      setCards((prev) => [newCard, ...prev]);
      setHasUnsavedChanges(true);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSyncCloud = async () => {
    if (!deck) return;
    setIsSyncing(true);
    try {
      const payload = {
        cards: cards.map((c) => ({
          scryfallId: c.scryfallId,
          name: c.name,
          setCode: c.setCode,
          collectorNumber: c.collectorNumber,
          manaCost: c.manaCost,
          typeLine: c.typeLine,
          imageUrl: c.imageUrl,
          cmc: c.cmc,
          quantity: c.quantity,
          category: c.category,
        })),
      };
      const syncedDeck = await syncDeckCards(deck.id, payload);
      setHasUnsavedChanges(false);
      onDeckUpdated(syncedDeck);
      toast.success('Deck saved and synced to cloud.', 'Success');
    } catch (err: unknown) {
      const msg = ui(getApiErrorMessage(err));
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!deck) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Pressable hitSlop={12} onPress={onClose}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={[styles.deckTitle, { color: theme.text }]} numberOfLines={1}>
              {deck.name}
            </Text>
            <View style={styles.deckFormatRow}>
              <View style={[styles.formatTag, { backgroundColor: 'rgba(224, 173, 98, 0.18)' }]}>
                <Text style={[styles.formatTagText, { color: theme.accent }]}>
                  {deck.format?.name || 'Custom'}
                </Text>
              </View>
              <Text style={[styles.cardCountText, { color: theme.textSecondary }]}>
                {totalCardCount}{ui("cards")}</Text>
              {illegalCardsCount > 0 ? (
                <View style={styles.illegalPill}>
                  <Feather name="alert-triangle" size={12} color="#FFF" />
                  <Text style={styles.illegalPillText}>{illegalCardsCount}{ui("illegal")}</Text>
                </View>
              ) : (
                <View style={styles.legalPill}>
                  <Feather name="check" size={12} color="#10B981" />
                  <Text style={styles.legalPillText}>{ui("Legal")}</Text>
                </View>
              )}
            </View>
          </View>
          <Pressable
            style={[
              styles.syncButton,
              {
                backgroundColor: hasUnsavedChanges ? theme.accent : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={handleSyncCloud}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color={hasUnsavedChanges ? '#000' : '#FFF'} size="small" />
            ) : (
              <Feather
                name="cloud"
                size={18}
                color={hasUnsavedChanges ? '#000' : theme.textSecondary}
              />
            )}
          </Pressable>
        </View>

        <FlatList
          key={viewMode + (isLandscape ? '_landscape' : '_portrait')}
          data={filteredCards}
          keyExtractor={(item) => item.scryfallId}
          numColumns={numColumns}
          columnWrapperStyle={viewMode === 'image' ? styles.gridRowWrapper : undefined}
          contentContainerStyle={viewMode === 'image' ? styles.gridContent : styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {deck.commanderCardName ? (
                <View
                  style={[
                    styles.commanderBanner,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.commanderBannerLeft}>
                    <View style={styles.commanderBadgesRow}>
                      <View
                        style={[
                          styles.commanderBadge,
                          { backgroundColor: 'rgba(224, 173, 98, 0.16)' },
                        ]}
                      >
                        <Feather name="shield" size={13} color={theme.accent} />
                        <Text style={[styles.commanderBadgeText, { color: theme.accent }]}>
                          COMMANDER
                        </Text>
                      </View>
                      {deck.partnerCommanderCardName ? (
                        <View
                          style={[
                            styles.commanderBadge,
                            { backgroundColor: 'rgba(14, 104, 171, 0.18)' },
                          ]}
                        >
                          <Feather name="users" size={13} color="#38BDF8" />
                          <Text style={[styles.commanderBadgeText, { color: '#38BDF8' }]}>{ui("PARTNER")}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.commanderName, { color: theme.text }]} numberOfLines={1}>
                      {deck.commanderCardName}
                      {deck.partnerCommanderCardName ? ` & ${deck.partnerCommanderCardName}` : ''}
                    </Text>
                  </View>
                  {deck.commanderColorIdentity && deck.commanderColorIdentity.length > 0 ? (
                    <View style={styles.colorPillsRow}>
                      {deck.commanderColorIdentity.map((c) => {
                        const info = COLOR_MAP[c] || { label: c, bg: '#666666', text: '#FFFFFF' };
                        return (
                          <View key={c} style={[styles.colorPill, { backgroundColor: info.bg }]}>
                            <Text style={[styles.colorPillText, { color: info.text }]}>{c}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={[styles.colorPill, { backgroundColor: '#666666' }]}>
                      <Text style={[styles.colorPillText, { color: '#FFFFFF' }]}>C</Text>
                    </View>
                  )}
                </View>
              ) : null}

              <DeckCompletionWidget cards={cards} />
              <ManaCurveChart cards={cards} />
              <ManaBaseAnalyzer cards={cards} />

              <View style={styles.controlsRow}>
                <View style={styles.tabsRow}>
                  {(['ALL', 'MAINBOARD', 'SIDEBOARD'] as const).map((tab) => {
                    const isSelected = activeTab === tab;
                    return (
                      <Pressable
                        key={tab}
                        style={[
                          styles.tabButton,
                          {
                            backgroundColor: isSelected ? theme.accent : 'rgba(255,255,255,0.05)',
                          },
                        ]}
                        onPress={() => setActiveTab(tab)}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            { color: isSelected ? '#000' : theme.textSecondary },
                          ]}
                        >
                          {tab === 'ALL'
                            ? `All (${cards.length})`
                            : tab === 'MAINBOARD'
                            ? 'Main'
                            : 'Side'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.rightToolsWrap}>
                  <Pressable
                    style={[styles.toolBtn, { backgroundColor: 'rgba(224, 173, 98, 0.15)', borderColor: theme.accent }]}
                    onPress={() => setShowSampleHand(true)}
                  >
                    <Feather name="play-circle" size={13} color={theme.accent} />
                    <Text style={[styles.toolBtnText, { color: theme.accent }]}>{ui("Playtest")}</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.toolBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}
                    onPress={() => setShowImportModal(true)}
                  >
                    <Feather name="file-text" size={13} color={theme.text} />
                    <Text style={[styles.toolBtnText, { color: theme.text }]}>{ui("Import")}</Text>
                  </Pressable>

                  <View style={[styles.viewModeToggle, { borderColor: theme.border }]}>
                    <Pressable
                      style={[
                        styles.viewModeBtn,
                        viewMode === 'text' && { backgroundColor: theme.accent },
                      ]}
                      onPress={() => setViewMode('text')}
                    >
                      <Feather
                        name="list"
                        size={15}
                        color={viewMode === 'text' ? '#000' : theme.textSecondary}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.viewModeBtn,
                        viewMode === 'image' && { backgroundColor: theme.accent },
                      ]}
                      onPress={() => setViewMode('image')}
                    >
                      <Feather
                        name="grid"
                        size={15}
                        color={viewMode === 'image' ? '#000' : theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isIllegal = !item.isLegal;

            if (viewMode === 'image') {
              return (
                <Pressable
                  style={[
                    styles.gridImageItem,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      borderColor: isIllegal ? '#EF4444' : 'rgba(255,255,255,0.08)',
                      borderWidth: isIllegal ? 2 : 1,
                    },
                  ]}
                  onPress={() => setEditingCard(item)}
                >
                  <Image
                    source={{ uri: item.imageUrl || 'https://cards.scryfall.io/back.png' }}
                    style={styles.gridImage}
                    contentFit="cover"
                  />
                  <View style={styles.imageQtyBadge}>
                    <Text style={styles.imageQtyText}>x{item.quantity}</Text>
                  </View>
                  {isIllegal && (
                    <View style={styles.imageIllegalBadge}>
                      <Feather name="alert-triangle" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            }

            return (
              <Pressable
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isIllegal ? '#EF4444' : theme.border,
                    borderWidth: isIllegal ? 1.5 : 1,
                  },
                ]}
                onPress={() => setEditingCard(item)}
              >
                <View style={styles.cardMain}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      style={[
                        styles.cardName,
                        {
                          color: isIllegal ? '#EF4444' : theme.text,
                          textDecorationLine: item.legalityStatus === 'banned' ? 'line-through' : 'none',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {isIllegal ? (
                      <Pressable
                        style={[styles.legalityBadge, { backgroundColor: item.legalityColor || '#EF4444' }]}
                        onPress={() =>
                          setInfoModalData({
                            title: 'Format Legality',
                            message: item.legalityReason || 'Card is not legal in this format',
                          })
                        }
                      >
                        <Text style={styles.legalityBadgeText}>{item.legalityBadge || 'ILLEGAL'}</Text>
                        <Feather name="help-circle" size={11} color="#FFF" style={{ marginLeft: 3 }} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    {item.setCode ? (
                      <SetSymbol setCode={item.setCode} size={12} />
                    ) : null}
                    <Text style={[styles.cardType, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.typeLine || 'Magic Card'} {item.setCode ? `• ${item.setCode.toUpperCase()} #${item.collectorNumber}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperContainer}>
                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                    onPress={() => handleUpdateQuantity(item.scryfallId, -1)}
                  >
                    <Feather name="minus" size={14} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.stepperQty, { color: theme.text }]}>{item.quantity}</Text>
                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                    onPress={() => handleUpdateQuantity(item.scryfallId, 1)}
                  >
                    <Feather name="plus" size={14} color={theme.text} />
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => setCardToDelete(item)}
                  >
                    <Feather name="trash-2" size={15} color="#EF4444" />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={36} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{ui("No cards in this section yet.")}</Text>
            </View>
          }
        />

        <View style={[styles.searchFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={styles.searchBarRow}>
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
              ]}
              placeholder={ui("Quick add: card name (Lightning Bolt, Counterspell...)")}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchCard}
              returnKeyType="search"
            />
            <Pressable
              style={[styles.searchActionBtn, { backgroundColor: theme.accent }]}
              onPress={handleSearchCard}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Feather name="search" size={18} color="#000" />
              )}
            </Pressable>
          </View>

          {searchResults.length > 0 ? (
            <View style={[styles.resultsDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {searchResults.map((result) => (
                <Pressable
                  key={result.id}
                  style={[styles.resultItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleAddCardToDeck(result)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: theme.text }]} numberOfLines={1}>
                      {result.name}
                    </Text>
                    <Text style={[styles.resultType, { color: theme.textSecondary }]} numberOfLines={1}>
                      {result.typeLine || result.type_line || ''} {result.manaCost || result.mana_cost || ''}
                    </Text>
                  </View>
                  <Feather name="plus-circle" size={20} color={theme.accent} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <ConfirmModal
          visible={!!cardToDelete}
          title={ui("Remove Card")}
          message={`Are you sure you want to remove "${cardToDelete?.name}" from this deck?`}
          confirmLabel={ui("Remove")}
          cancelLabel={ui("Cancel")}
          icon="trash-2"
          isDestructive
          onConfirm={handleConfirmRemoveCard}
          onCancel={() => setCardToDelete(null)}
        />

        <ConfirmModal
          visible={!!infoModalData}
          title={infoModalData?.title || ''}
          message={infoModalData?.message || ''}
          confirmLabel={ui("Understood")}
          cancelLabel={ui("Close")}
          icon="alert-circle"
          isDestructive={false}
          onConfirm={() => setInfoModalData(null)}
          onCancel={() => setInfoModalData(null)}
        />

        <Modal
          visible={!!editingCard}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingCard(null)}
        >
          <View style={styles.switchModalBackdrop}>
            <Pressable
              style={styles.switchModalDismiss}
              onPress={() => setEditingCard(null)}
            />
            <View
              style={[
                styles.switchModalSheet,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.switchModalHeader}>
                <View style={styles.switchModalHeaderLeft}>
                  <Text style={[styles.switchModalTitle, { color: theme.text }]} numberOfLines={1}>
                    {editingCard?.name}
                  </Text>
                  <Text style={[styles.switchModalSub, { color: theme.textSecondary }]}>
                    {editingCard?.setCode?.toUpperCase()} #{editingCard?.collectorNumber}{ui("• Tap printing to switch")}</Text>
                </View>
                <Pressable
                  onPress={() => setEditingCard(null)}
                  hitSlop={10}
                  style={styles.switchModalCloseBtn}
                >
                  <Feather name="x" size={20} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.switchModalActionRow}>
                <View style={styles.stepperContainer}>
                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => editingCard && handleUpdateQuantity(editingCard.scryfallId, -1)}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.stepperQty, { color: theme.text }]}>
                    {cards.find((c) => c.scryfallId === editingCard?.scryfallId)?.quantity || 1}
                  </Text>
                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                    onPress={() => editingCard && handleUpdateQuantity(editingCard.scryfallId, 1)}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.removeCardBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                  onPress={() => {
                    if (editingCard) {
                      setCardToDelete(editingCard);
                      setEditingCard(null);
                    }
                  }}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                  <Text style={styles.removeCardText}>{ui("Remove from deck")}</Text>
                </Pressable>
              </View>

              <View style={styles.printingsSection}>
                <View style={styles.printingsSectionHeader}>
                  <View style={styles.printingsTitleRow}>
                    <Feather name="layers" size={14} color="#E0AD62" />
                    <Text style={[styles.printingsSectionTitle, { color: theme.text }]}>{ui("All Printings")}</Text>
                  </View>
                  {loadingPrintings && <ActivityIndicator size="small" color="#E0AD62" />}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.printingsScroll}
                >
                  {printings.map((p) => {
                    const isCurrent = p.id === editingCard?.scryfallId;
                    const imgUri = p.imageUris?.small || p.imageUris?.normal;
                    const price = p.prices?.usd || p.prices?.usdFoil || '—';
                    return (
                      <Pressable
                        key={p.id}
                        style={[
                          styles.printingCardItem,
                          {
                            borderColor: isCurrent ? theme.accent : theme.border,
                            backgroundColor: isCurrent ? 'rgba(224, 173, 98, 0.14)' : 'rgba(255,255,255,0.03)',
                          },
                        ]}
                        onPress={() => handleSelectPrinting(p)}
                      >
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.printingThumb}
                          contentFit="cover"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <SetSymbol setCode={p.set} rarity={p.rarity} size={13} />
                          <Text
                            style={[styles.printingSetCode, { color: isCurrent ? theme.accent : theme.text }]}
                            numberOfLines={1}
                          >
                            {p.set.toUpperCase()} #{p.collectorNumber}
                          </Text>
                        </View>
                        <Text style={styles.printingPrice}>${price}</Text>
                        {isCurrent && (
                          <View style={[styles.currentVersionBadge, { backgroundColor: theme.accent }]}>
                            <Text style={styles.currentVersionText}>{ui("Current")}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sample Hand Simulator Modal */}
        <SampleHandModal
          visible={showSampleHand}
          cards={cards}
          deckName={deck?.name || 'Deck'}
          onClose={() => setShowSampleHand(false)}
        />

        {/* Batch Import Text Modal */}
        <Modal
          visible={showImportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImportModal(false)}
        >
          <View style={styles.importOverlay}>
            <View style={[styles.importBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.importHeader}>
                <Text style={[styles.importTitle, { color: theme.text }]}>{ui("Import Decklist (Text)")}</Text>
                <Pressable onPress={() => setShowImportModal(false)} hitSlop={10}>
                  <Feather name="x" size={18} color={theme.text} />
                </Pressable>
              </View>

              <Text style={[styles.importSubtitle, { color: theme.textSecondary }]}>{ui("Paste decklist format from MTG Arena, Moxfield, or plain text:")}</Text>

              <TextInput
                style={[
                  styles.importInput,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                ]}
                multiline
                numberOfLines={7}
                placeholder={"1 Sol Ring\n1 Arcane Signet\n1 Command Tower\n1 Rhystic Study (WOT) 25"}
                placeholderTextColor={theme.textSecondary}
                value={importText}
                onChangeText={setImportText}
              />

              <View style={styles.importActions}>
                <Pressable
                  style={[styles.importCancelBtn, { borderColor: theme.border }]}
                  onPress={() => setShowImportModal(false)}
                >
                  <Text style={[styles.importCancelText, { color: theme.text }]}>{ui("Cancel")}</Text>
                </Pressable>

                <Pressable
                  style={[styles.importConfirmBtn, { backgroundColor: theme.accent, opacity: isImporting ? 0.7 : 1 }]}
                  onPress={handleBatchImportText}
                  disabled={isImporting || !importText.trim()}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.importConfirmText}>{ui("Import Cards")}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  commanderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  commanderBannerLeft: {
    flex: 1,
  },
  commanderBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commanderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  commanderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  commanderName: {
    fontSize: 14,
    fontWeight: '700',
  },
  colorPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  deckFormatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  formatTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardCountText: {
    fontSize: 12,
  },
  illegalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  illegalPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  legalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  legalPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cardMain: {
    flex: 1,
    marginRight: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
  },
  legalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legalityBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardType: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  searchFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    borderTopWidth: 1,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
  },
  searchActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsDropdown: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
    maxHeight: 220,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultType: {
    fontSize: 11,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 8,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  viewModeBtn: {
    width: 32,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  listContent: {
    paddingBottom: 110,
  },
  gridRowWrapper: {
    gap: 8,
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  gridImageItem: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1E232B',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  imageQtyBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.4)',
  },
  imageQtyText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E0AD62',
  },
  imageIllegalBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  switchModalDismiss: {
    flex: 1,
  },
  switchModalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
    maxHeight: '80%',
  },
  switchModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchModalHeaderLeft: {
    flex: 1,
  },
  switchModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  switchModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  switchModalCloseBtn: {
    padding: 4,
  },
  switchModalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  removeCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  removeCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  printingsSection: {
    gap: 10,
  },
  printingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  printingsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.3,
  },
  printingsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  printingCardItem: {
    width: 105,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 6,
    alignItems: 'center',
    gap: 4,
  },
  printingThumb: {
    width: 90,
    height: 126,
    borderRadius: 6,
  },
  printingSetCode: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  printingPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  currentVersionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentVersionText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0E12',
  },
  rightToolsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  importOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  importBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  importTitle: {
    ...typography.body,
    fontWeight: '800',
  },
  importSubtitle: {
    ...typography.caption,
  },
  importInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    textAlignVertical: 'top',
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 120,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  importCancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  importCancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  importConfirmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  importConfirmText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E12',
  },
});

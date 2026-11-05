import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppTheme } from '@/lib/ThemeProvider';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ui';
import {
  createDeck,
  deleteDeck,
  fetchActiveFormats,
  getDeckDetail,
  listUserDecks,
} from '../api/deckApi';
import { CreateDeckModal } from '../components/CreateDeckModal';
import { DeckDetailModal } from '../components/DeckDetailModal';
import type { Deck, DeckFormat, DeckSummary } from '../types/deck';

const COLOR_MAP: Record<string, { label: string; bg: string; text: string }> = {
  W: { label: 'Trắng', bg: '#F9FAF4', text: '#333333' },
  U: { label: 'Xanh lam', bg: '#0E68AB', text: '#FFFFFF' },
  B: { label: 'Đen', bg: '#150B00', text: '#FFFFFF' },
  R: { label: 'Đỏ', bg: '#D3202A', text: '#FFFFFF' },
  G: { label: 'Xanh lục', bg: '#00733E', text: '#FFFFFF' },
  C: { label: 'Không màu', bg: '#666666', text: '#FFFFFF' },
};

export function DecksScreen() {
  const { theme } = useAppTheme();
  const toast = useToast();
  const [formats, setFormats] = useState<DeckFormat[]>([]);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<DeckSummary | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedFormats, fetchedDecks] = await Promise.all([
        fetchActiveFormats(),
        listUserDecks(),
      ]);
      setFormats(fetchedFormats);
      setDecks(fetchedDecks);
    } catch {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCreateDeck = async (
    name: string,
    formatId: string,
    description?: string,
    commanderCardId?: string,
    commanderCardName?: string,
    commanderColorIdentity?: string[],
    coverCardUri?: string,
    partnerCommanderCardId?: string,
    partnerCommanderCardName?: string,
    partnerCoverCardUri?: string,
    visibility?: string
  ) => {
    try {
      const created = await createDeck({
        name,
        formatId,
        description,
        commanderCardId,
        commanderCardName,
        commanderColorIdentity,
        coverCardUri,
        partnerCommanderCardId,
        partnerCommanderCardName,
        partnerCoverCardUri,
        visibility,
      });
      await loadData();
      setSelectedDeck(created);
      setDetailModalVisible(true);
      toast.success(`Đã tạo bộ bài "${name}" thành công.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo bộ bài';
      toast.error(msg, 'Lỗi');
    }
  };

  const handleOpenDeck = async (summary: DeckSummary) => {
    const full = await getDeckDetail(summary.id);
    if (full) {
      setSelectedDeck(full);
      setDetailModalVisible(true);
    } else {
      toast.error('Không thể tải chi tiết bộ bài.', 'Lỗi');
    }
  };

  const handleConfirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    try {
      await deleteDeck(deckToDelete.id);
      setDecks((prev) => prev.filter((d) => d.id !== deckToDelete.id));
      toast.success(`Đã xóa bộ bài "${deckToDelete.name}".`);
    } catch {
      toast.error('Không thể xóa bộ bài lúc này.', 'Lỗi');
    } finally {
      setDeckToDelete(null);
    }
  };

  const filteredDecks = decks.filter((d) => {
    const matchFormat =
      selectedFormatFilter === 'ALL' || d.format?.id === selectedFormatFilter;
    if (!matchFormat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = d.name.toLowerCase().includes(q);
    const cmdMatch = (d.commanderCardName || '').toLowerCase().includes(q);
    const partnerMatch = (d.partnerCommanderCardName || '').toLowerCase().includes(q);
    return nameMatch || cmdMatch || partnerMatch;
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Bộ Bài Của Tôi"
        rightAction={
          <Pressable
            style={[styles.createHeaderBtn, { backgroundColor: theme.accent }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Feather name="plus" size={16} color="#0D0E12" />
            <Text
              style={styles.createHeaderBtnText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Tạo Deck
            </Text>
          </Pressable>
        }
      />

      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={15} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên bộ bài hoặc Tướng..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={15} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'ALL', name: 'Tất cả' }, ...formats]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const isSelected = selectedFormatFilter === item.id;
            return (
              <Pressable
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => setSelectedFormatFilter(item.id)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#0D0E12' : theme.textSecondary },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredDecks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={styles.deckListContent}
          renderItem={({ item }) => {
            const hasCover = !!item.coverCardUri;
            const targetCount = item.format?.minCards || 100;
            const isComplete = item.totalCount >= targetCount;
            const progressRatio = Math.min(item.totalCount / targetCount, 1);

            return (
              <Pressable
                style={[
                  styles.deckCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => handleOpenDeck(item)}
              >
                {hasCover && (
                  <View style={styles.deckCoverBackgroundWrap}>
                    <Image
                      source={{ uri: item.coverCardUri }}
                      style={styles.deckCoverImage}
                      contentFit="cover"
                    />
                    <View style={styles.deckCoverDarkOverlay} />
                  </View>
                )}

                <View style={styles.deckCardTopRow}>
                  <View style={styles.deckBadgeGroup}>
                    <View
                      style={[
                        styles.formatBadge,
                        {
                          backgroundColor: hasCover
                            ? 'rgba(0, 0, 0, 0.65)'
                            : 'rgba(224, 173, 98, 0.18)',
                          borderColor: '#E0AD62',
                        },
                      ]}
                    >
                      <Text style={[styles.formatBadgeText, { color: '#E0AD62' }]}>
                        {item.format?.name || 'Custom'}
                      </Text>
                    </View>
                    {item.commanderColorIdentity && item.commanderColorIdentity.length > 0 ? (
                      <View style={styles.colorPipsRow}>
                        {item.commanderColorIdentity.map((c) => {
                          const colorInfo = COLOR_MAP[c] || { bg: '#666', text: '#fff' };
                          return (
                            <View
                              key={c}
                              style={[styles.colorPip, { backgroundColor: colorInfo.bg }]}
                            >
                              <Text style={[styles.colorPipText, { color: colorInfo.text }]}>
                                {c}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => setDeckToDelete(item)}
                    style={styles.deleteDeckBtn}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={hasCover ? 'rgba(255,255,255,0.75)' : theme.textSecondary}
                    />
                  </Pressable>
                </View>

                <View style={styles.deckCardMiddle}>
                  <Text style={[styles.deckName, { color: '#FFFFFF' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.commanderCardName ? (
                    <View style={styles.commanderNameRow}>
                      <Feather name="shield" size={12} color="#E0AD62" />
                      <Text
                        style={[styles.commanderNameText, { color: hasCover ? '#E2E8F0' : theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.commanderCardName}
                        {item.partnerCommanderCardName ? ` & ${item.partnerCommanderCardName}` : ''}
                      </Text>
                    </View>
                  ) : item.description ? (
                    <Text
                      style={[styles.deckDesc, { color: hasCover ? '#CBD5E1' : theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.deckCardBottomRow}>
                  <View style={styles.progressSection}>
                    <View style={styles.progressTextRow}>
                      <Text style={[styles.progressLabel, { color: hasCover ? '#E2E8F0' : theme.textSecondary }]}>
                        {item.totalCount} / {targetCount} lá
                      </Text>
                      {isComplete && (
                        <View style={styles.completeBadge}>
                          <Feather name="check" size={10} color="#10B981" />
                          <Text style={styles.completeLabel}>Đầy đủ</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.round(progressRatio * 100)}%`,
                            backgroundColor: isComplete ? '#10B981' : '#E0AD62',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="copy" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery ? 'Không tìm thấy bộ bài nào' : 'Chưa có bộ bài nào'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery
                  ? `Không có bộ bài nào khớp với từ khóa "${searchQuery}".`
                  : 'Tạo bộ bài đầu tiên của bạn cho thể thức Commander, Standard hoặc Pauper.'}
              </Text>
              {!searchQuery && (
                <Pressable
                  style={[styles.emptyCreateBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Feather name="plus" size={16} color="#0D0E12" />
                  <Text style={styles.emptyCreateBtnText}>Tạo Bộ Bài Mới</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      <CreateDeckModal
        visible={createModalVisible}
        formats={formats}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateDeck}
      />

      <DeckDetailModal
        visible={detailModalVisible}
        deck={selectedDeck}
        onClose={() => setDetailModalVisible(false)}
        onDeckUpdated={(updated) => {
          setSelectedDeck(updated);
          setDecks((prev) =>
            prev.map((d) =>
              d.id === updated.id
                ? {
                    ...d,
                    mainboardCount: updated.mainboardCount,
                    sideboardCount: updated.sideboardCount,
                    totalCount: updated.totalCount,
                    updatedAt: updated.updatedAt,
                  }
                : d
            )
          );
        }}
      />

      <ConfirmModal
        visible={!!deckToDelete}
        title="Xác nhận xóa bộ bài"
        message={`Bạn có chắc chắn muốn xóa bộ bài "${deckToDelete?.name}" không? Thao tác này sẽ xóa toàn bộ danh sách thẻ liên quan và không thể khôi phục.`}
        confirmLabel="Xóa Bộ Bài"
        cancelLabel="Hủy"
        icon="trash-2"
        isDestructive
        onConfirm={handleConfirmDeleteDeck}
        onCancel={() => setDeckToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  createHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    minWidth: 80,
  },
  createHeaderBtnText: {
    color: '#0D0E12',
    fontSize: 12,
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterRow: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  deckCard: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
    gap: 10,
  },
  deckCoverBackgroundWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deckCoverImage: {
    width: '100%',
    height: '100%',
  },
  deckCoverDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 14, 18, 0.82)',
  },
  deckCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  deckBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  colorPipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorPip: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  colorPipText: {
    fontSize: 9,
    fontWeight: '900',
  },
  deleteDeckBtn: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  deckCardMiddle: {
    gap: 4,
    zIndex: 1,
  },
  deckName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  commanderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commanderNameText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  deckDesc: {
    fontSize: 12,
  },
  deckCardBottomRow: {
    zIndex: 1,
  },
  progressSection: {
    gap: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  emptyCreateBtnText: {
    color: '#0D0E12',
    fontSize: 13,
    fontWeight: '800',
  },
});

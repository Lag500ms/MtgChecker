import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import {
  type ChapterSummary,
  type ComprehensiveRule,
  type RuleGlossaryTerm,
  type SectionSummary,
  fetchCrRule,
  fetchCrRulesByChapter,
  fetchCrSections,
  searchCrRules,
  searchGlossary,
} from '../api/rulesApi';

interface ComprehensiveRulesModalProps {
  visible: boolean;
  initialRuleNumber?: string | null;
  onClose: () => void;
}

export function ComprehensiveRulesModal({
  visible,
  initialRuleNumber,
  onClose,
}: ComprehensiveRulesModalProps) {
  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'rules' | 'glossary'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionSummary | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterSummary | null>(null);
  const [chapterRules, setChapterRules] = useState<ComprehensiveRule[]>([]);
  const [ruleSearchResults, setRuleSearchResults] = useState<ComprehensiveRule[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<RuleGlossaryTerm[]>([]);
  const [highlightedRule, setHighlightedRule] = useState<ComprehensiveRule | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSections();
      if (initialRuleNumber) {
        openRuleDirectly(initialRuleNumber);
      }
    }
  }, [visible, initialRuleNumber]);

  useEffect(() => {
    if (!visible) return;
    if (activeTab === 'glossary') {
      loadGlossary(searchQuery);
    }
  }, [activeTab, searchQuery, visible]);

  async function loadSections() {
    try {
      setLoading(true);
      const data = await fetchCrSections();
      setSections(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadChapterRules(chapter: ChapterSummary) {
    try {
      setLoading(true);
      setSelectedChapter(chapter);
      setHighlightedRule(null);
      const data = await fetchCrRulesByChapter(chapter.chapterNumber);
      setChapterRules(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function openRuleDirectly(ruleNum: string) {
    const cleanNum = ruleNum.replace(/^CR\s*/i, '').trim();
    try {
      setLoading(true);
      const rule = await fetchCrRule(cleanNum);
      setActiveTab('rules');
      setHighlightedRule(rule);
      const chapterNum = rule.chapterNumber;
      const data = await fetchCrRulesByChapter(chapterNum);
      setChapterRules(data);
      setSelectedChapter({
        chapterNumber: rule.chapterNumber,
        chapterTitle: rule.chapterTitle,
      });
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(text: string) {
    setSearchQuery(text);
    if (!text.trim()) {
      setRuleSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'rules') {
        const page = await searchCrRules(text.trim(), 0, 30);
        setRuleSearchResults(page.content);
      } else {
        const page = await searchGlossary(text.trim(), 0, 40);
        setGlossaryTerms(page.content);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadGlossary(query = '') {
    try {
      setLoading(true);
      const page = await searchGlossary(query.trim(), 0, 50);
      setGlossaryTerms(page.content);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  function handleResetView() {
    setSelectedChapter(null);
    setHighlightedRule(null);
    setSearchQuery('');
    setRuleSearchResults([]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Feather name="book-open" size={18} color="#E0AD62" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Comprehensive Rules
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                Toàn thư Luật & Thuật ngữ MTG
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
            <Feather name="x" size={18} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'rules' && [styles.activeTabItem, { borderColor: '#E0AD62' }],
            ]}
            onPress={() => {
              setActiveTab('rules');
              setSearchQuery('');
            }}
          >
            <Feather
              name="file-text"
              size={14}
              color={activeTab === 'rules' ? '#E0AD62' : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'rules' ? '#E0AD62' : theme.textMuted },
              ]}
            >
              Điều Luật (3,165 CR)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'glossary' && [styles.activeTabItem, { borderColor: '#E0AD62' }],
            ]}
            onPress={() => {
              setActiveTab('glossary');
              setSearchQuery('');
            }}
          >
            <Feather
              name="bookmark"
              size={14}
              color={activeTab === 'glossary' ? '#E0AD62' : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'glossary' ? '#E0AD62' : theme.textMuted },
              ]}
            >
              Từ Điển Thuật Ngữ (727)
            </Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={
              activeTab === 'rules'
                ? 'Tìm số điều (704.5k) hoặc từ khóa (layer, combat)...'
                : 'Tra thuật ngữ MTG (Haste, Ward, Scry)...'
            }
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Feather name="x-circle" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#E0AD62" />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Đang tải luật...</Text>
          </View>
        )}

        {activeTab === 'rules' ? (
          searchQuery.trim().length > 0 ? (
            <FlatList
              data={ruleSearchResults}
              keyExtractor={(item) => item.ruleNumber}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <RuleCard
                  rule={item}
                  theme={theme}
                  onSelectRef={openRuleDirectly}
                />
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyWrap}>
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                      Không tìm thấy điều luật khớp với "{searchQuery}"
                    </Text>
                  </View>
                ) : undefined
              }
            />
          ) : selectedChapter ? (
            <View style={styles.flex1}>
              <View style={[styles.navBreadcrumb, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable style={styles.backBtn} onPress={handleResetView}>
                  <Feather name="chevron-left" size={18} color="#E0AD62" />
                  <Text style={styles.backText}>Chương mục</Text>
                </Pressable>
                <Text style={[styles.breadcrumbTitle, { color: theme.text }]} numberOfLines={1}>
                  CR {selectedChapter.chapterNumber}: {selectedChapter.chapterTitle}
                </Text>
              </View>

              <FlatList
                data={chapterRules}
                keyExtractor={(item) => item.ruleNumber}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <RuleCard
                    rule={item}
                    theme={theme}
                    isHighlighted={highlightedRule?.ruleNumber === item.ruleNumber}
                    onSelectRef={openRuleDirectly}
                  />
                )}
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
                9 PHẦN LUẬT COMPREHENSIVE RULES
              </Text>
              {sections.map((sec) => (
                <View key={sec.sectionNumber} style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Pressable
                    style={styles.sectionHeaderPress}
                    onPress={() => setSelectedSection(selectedSection?.sectionNumber === sec.sectionNumber ? null : sec)}
                  >
                    <View style={styles.sectionNumberBadge}>
                      <Text style={styles.sectionNumberText}>{sec.sectionNumber}</Text>
                    </View>
                    <Text style={[styles.sectionTitleText, { color: theme.text }]}>
                      {sec.sectionTitle}
                    </Text>
                    <Feather
                      name={selectedSection?.sectionNumber === sec.sectionNumber ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>

                  {selectedSection?.sectionNumber === sec.sectionNumber && (
                    <View style={styles.chaptersList}>
                      {sec.chapters.map((ch) => (
                        <Pressable
                          key={ch.chapterNumber}
                          style={[styles.chapterItem, { borderTopColor: theme.border }]}
                          onPress={() => loadChapterRules(ch)}
                        >
                          <Text style={styles.chapterNum}>{ch.chapterNumber}.</Text>
                          <Text style={[styles.chapterTitle, { color: theme.text }]}>{ch.chapterTitle}</Text>
                          <Feather name="arrow-right" size={14} color="#E0AD62" />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )
        ) : (
          <FlatList
            data={glossaryTerms}
            keyExtractor={(item) => item.term}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.glossaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.glossaryHeader}>
                  <Text style={[styles.glossaryTerm, { color: theme.text }]}>{item.term}</Text>
                  {item.isObsolete && (
                    <View style={styles.obsoleteBadge}>
                      <Text style={styles.obsoleteText}>Obsolete</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.glossaryDef, { color: theme.textSecondary }]}>
                  {item.definition}
                </Text>
                {item.seeRule && (
                  <Pressable
                    style={styles.seeRuleBtn}
                    onPress={() => openRuleDirectly(item.seeRule!)}
                  >
                    <Feather name="external-link" size={12} color="#E0AD62" />
                    <Text style={styles.seeRuleText}>Xem điều luật CR {item.seeRule}</Text>
                  </Pressable>
                )}
              </View>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    Không tìm thấy thuật ngữ khớp
                  </Text>
                </View>
              ) : undefined
            }
          />
        )}
      </View>
    </Modal>
  );
}

function RuleCard({
  rule,
  theme,
  isHighlighted,
  onSelectRef,
}: {
  rule: ComprehensiveRule;
  theme: any;
  isHighlighted?: boolean;
  onSelectRef: (ruleNumber: string) => void;
}) {
  return (
    <View
      style={[
        styles.ruleCard,
        {
          backgroundColor: isHighlighted ? 'rgba(224, 173, 98, 0.08)' : theme.surface,
          borderColor: isHighlighted ? '#E0AD62' : theme.border,
        },
      ]}
    >
      <View style={styles.ruleCardHeader}>
        <View style={styles.ruleNumBadge}>
          <Text style={styles.ruleNumText}>CR {rule.ruleNumber}</Text>
        </View>
        <Text style={[styles.ruleChapterLabel, { color: theme.textMuted }]}>
          {rule.chapterTitle}
        </Text>
      </View>

      <Text style={[styles.ruleBodyText, { color: theme.text }]}>
        {rule.ruleText}
      </Text>

      {rule.examplesText && (
        <View style={[styles.exampleBox, { backgroundColor: theme.surfaceAlt || 'rgba(0,0,0,0.2)' }]}>
          <View style={styles.exampleHeader}>
            <Feather name="info" size={11} color="#E0AD62" />
            <Text style={styles.exampleLabel}>VÍ DỤ CHÍNH THỨC</Text>
          </View>
          <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
            {rule.examplesText}
          </Text>
        </View>
      )}

      {rule.crossReferences && rule.crossReferences.length > 0 && (
        <View style={styles.crossRefRow}>
          <Text style={[styles.crossRefLabel, { color: theme.textMuted }]}>Tham chiếu:</Text>
          {rule.crossReferences.map((ref, idx) => (
            <Pressable key={idx} style={styles.crossRefPill} onPress={() => onSelectRef(ref)}>
              <Text style={styles.crossRefText}>CR {ref}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodySmall,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 0,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  navBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    ...typography.caption,
    color: '#E0AD62',
    fontWeight: '600',
  },
  breadcrumbTitle: {
    flex: 1,
    ...typography.caption,
    fontWeight: '600',
  },
  sectionHeading: {
    ...typography.caption,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeaderPress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0AD62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    ...typography.caption,
    color: '#121212',
    fontWeight: '700',
  },
  sectionTitleText: {
    flex: 1,
    ...typography.h3,
    fontWeight: '600',
  },
  chaptersList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  chapterNum: {
    ...typography.caption,
    color: '#E0AD62',
    fontWeight: '700',
    minWidth: 32,
  },
  chapterTitle: {
    flex: 1,
    ...typography.body,
  },
  ruleCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  ruleNumBadge: {
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  ruleNumText: {
    ...typography.caption,
    color: '#E0AD62',
    fontWeight: '700',
  },
  ruleChapterLabel: {
    ...typography.bodySmall,
  },
  ruleBodyText: {
    ...typography.body,
    lineHeight: 20,
  },
  exampleBox: {
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exampleLabel: {
    ...typography.caption,
    color: '#E0AD62',
    fontWeight: '700',
    fontSize: 10,
  },
  exampleText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  crossRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  crossRefLabel: {
    ...typography.bodySmall,
    fontSize: 11,
  },
  crossRefPill: {
    backgroundColor: 'rgba(224, 173, 98, 0.12)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  crossRefText: {
    ...typography.caption,
    color: '#E0AD62',
    fontSize: 11,
    fontWeight: '600',
  },
  glossaryCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  glossaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glossaryTerm: {
    ...typography.h3,
    fontWeight: '700',
  },
  obsoleteBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  obsoleteText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 10,
  },
  glossaryDef: {
    ...typography.body,
    lineHeight: 20,
  },
  seeRuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  seeRuleText: {
    ...typography.caption,
    color: '#E0AD62',
    fontWeight: '600',
  },
});

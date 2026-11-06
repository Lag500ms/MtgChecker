import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import type { CheatSheetTopic } from '@/features/rules/data/cheatSheets';
import type { JudgeVerdict } from '@/features/rules/data/quickJudgeDisputes';
import type { FormatRule } from '@/features/rules/data/formats';
import { CheatSheetModal } from '@/features/rules/components/CheatSheetModal';
import { ComprehensiveRulesModal } from '@/features/rules/components/ComprehensiveRulesModal';
import { FormatRuleModal } from '@/features/rules/components/FormatRuleModal';
import { JudgeVerdictCard } from '@/features/rules/components/JudgeVerdictCard';
import { JudgeSearchBar } from '@/features/rules/components/JudgeSearchBar';
import { RuleTopicCard } from '@/features/rules/components/RuleTopicCard';
import { LifeTrackerModal } from '@/features/lifetracker/components/LifeTrackerModal';
import type { StartingLifeMode } from '@/features/lifetracker/types';
import {
  askJudgeAi,
  fetchCheatSheets,
  fetchFormatRules,
  fetchQuickDisputes,
  getInitialCheatSheets,
  getInitialFormatRules,
  getInitialQuickDisputes,
} from '@/features/rules/api/rulesApi';

export function HomeScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<JudgeVerdict | null>(null);
  const [activeSheetTopic, setActiveSheetTopic] = useState<CheatSheetTopic | null>(null);
  const [activeFormat, setActiveFormat] = useState<FormatRule | null>(null);
  const [lifeTrackerVisible, setLifeTrackerVisible] = useState(false);
  const [lifeTrackerLife, setLifeTrackerLife] = useState<StartingLifeMode>(40);
  const [crModalVisible, setCrModalVisible] = useState(false);
  const [crTargetRule, setCrTargetRule] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [cheatSheets, setCheatSheets] = useState<CheatSheetTopic[]>([]);
  const [quickDisputes, setQuickDisputes] = useState<JudgeVerdict[]>([]);
  const [formatRules, setFormatRules] = useState<FormatRule[]>([]);

  const scenarioTags = useMemo(() => {
    const rawCategories = Array.from(
      new Set(
        quickDisputes
          .map((d) => d.category?.toUpperCase())
          .filter((c): c is string => Boolean(c))
      )
    );

    const labelMap: Record<string, string> = {
      COMMANDER: '👑 Commander',
      COMBAT: '⚔️ Combat',
      TIMING: '⏱️ Upkeep/Timing',
      LAYERS: '🧩 Layers',
      ETB: '⚡ ETB',
    };

    const tags = [
      { id: 'ALL', label: 'Tất cả' },
      ...rawCategories.map((c) => ({
        id: c,
        label: labelMap[c] || c,
      })),
    ];

    if (tags.length <= 1) {
      return [
        { id: 'ALL', label: 'Tất cả' },
        { id: 'COMMANDER', label: '👑 Commander' },
        { id: 'COMBAT', label: '⚔️ Combat' },
        { id: 'TIMING', label: '⏱️ Upkeep/Timing' },
        { id: 'LAYERS', label: '🧩 Layers' },
        { id: 'ETB', label: '⚡ ETB' },
      ];
    }
    return tags;
  }, [quickDisputes]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [initialSheets, initialDisputes, initialFormats] = await Promise.all([
        getInitialCheatSheets(),
        getInitialQuickDisputes(),
        getInitialFormatRules(),
      ]);
      if (isMounted) {
        setCheatSheets(initialSheets);
        setQuickDisputes(initialDisputes);
        setFormatRules(initialFormats);
      }
      const [remoteSheets, remoteDisputes, remoteFormats] = await Promise.all([
        fetchCheatSheets(),
        fetchQuickDisputes(),
        fetchFormatRules(),
      ]);
      if (isMounted) {
        setCheatSheets(remoteSheets);
        setQuickDisputes(remoteDisputes);
        setFormatRules(remoteFormats);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDisputes = useMemo(() => {
    return quickDisputes.filter((d) => {
      const matchCategory =
        selectedCategory === 'ALL' ||
        (d.category && d.category.toUpperCase() === selectedCategory);
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const lower = searchQuery.toLowerCase().trim();
      return (
        d.query.toLowerCase().includes(lower) ||
        d.verdictTitle.toLowerCase().includes(lower) ||
        d.cardNames.some((c) => c.toLowerCase().includes(lower)) ||
        d.summary.toLowerCase().includes(lower) ||
        d.crRules.some((r) => r.toLowerCase().includes(lower))
      );
    });
  }, [searchQuery, quickDisputes, selectedCategory]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return cheatSheets;
    const lower = searchQuery.toLowerCase().trim();
    return cheatSheets.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.subtitle.toLowerCase().includes(lower) ||
        t.badge.toLowerCase().includes(lower) ||
        t.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(lower) ||
            s.description.toLowerCase().includes(lower) ||
            s.items?.some(
              (i) =>
                i.term.toLowerCase().includes(lower) ||
                i.details.toLowerCase().includes(lower) ||
                (i.crCode && i.crCode.toLowerCase().includes(lower))
            )
        )
    );
  }, [searchQuery, cheatSheets]);

  const handleSelectVerdict = (verdict: JudgeVerdict) => {
    if (selectedVerdict?.id === verdict.id) {
      setSelectedVerdict(null);
    } else {
      setSelectedVerdict(verdict);
    }
  };

  const findOfflineRuleVerdict = (
    query: string,
    topics: CheatSheetTopic[]
  ): JudgeVerdict | null => {
    const lower = query.toLowerCase().trim();
    if (!lower) return null;

    for (const topic of topics) {
      for (const section of topic.sections) {
        if (section.items) {
          for (const item of section.items) {
            const rawCr = (item.crCode || '').toLowerCase().replace(/cr\s*/g, '');
            const matchCr = rawCr && lower.includes(rawCr);
            const matchTerm =
              lower.includes(item.term.toLowerCase()) ||
              item.term.toLowerCase().includes(lower);

            if (matchCr || matchTerm) {
              return {
                id: `offline_rule_${topic.id}_${item.term.replace(/\s+/g, '_')}`,
                query,
                cardNames: [],
                verdict: 'YES',
                verdictTitle: `${item.term} (${item.crCode || topic.badge})`,
                summary: item.details,
                stackSteps: [
                  `1. Cẩm nang: ${topic.title}`,
                  `2. Điều khoản: ${section.heading}`,
                  `3. Tra cứu Comprehensive Rules ngoại tuyến: ${item.crCode || topic.badge}`,
                ],
                crRules: item.crCode ? [item.crCode] : [topic.badge],
                category: topic.id.toUpperCase(),
              };
            }
          }
        }

        const matchHeading =
          section.heading.toLowerCase().includes(lower) ||
          lower.includes(section.heading.toLowerCase());
        if (matchHeading) {
          return {
            id: `offline_sec_${topic.id}_${section.heading.replace(/\s+/g, '_')}`,
            query,
            cardNames: [],
            verdict: 'YES',
            verdictTitle: section.heading,
            summary: section.description,
            stackSteps: [
              `1. Cẩm nang: ${topic.title}`,
              `2. Tra cứu Comprehensive Rules ngoại tuyến: ${topic.badge}`,
            ],
            crRules: [topic.badge],
            category: topic.id.toUpperCase(),
          };
        }
      }
    }

    return null;
  };

  const handleAskAi = async () => {
    if (!searchQuery.trim() || isLoadingAi) return;

    const lower = searchQuery.toLowerCase().trim();
    const offlineMatch = quickDisputes.find(
      (d) =>
        d.query.toLowerCase().includes(lower) ||
        lower.includes(d.query.toLowerCase())
    );
    if (offlineMatch) {
      setSelectedVerdict(offlineMatch);
      return;
    }

    const offlineRule = findOfflineRuleVerdict(searchQuery, cheatSheets);
    const isCrCodeQuery = /^(cr\s*)?\d{3}/i.test(lower) || lower.startsWith('cr');
    if (isCrCodeQuery && offlineRule) {
      setSelectedVerdict(offlineRule);
      return;
    }

    setIsLoadingAi(true);
    setAiError(null);
    try {
      const response = await askJudgeAi(searchQuery.trim());
      setSelectedVerdict(response);
    } catch (err: unknown) {
      if (offlineRule) {
        setSelectedVerdict({
          ...offlineRule,
          summary: `[Ngoại tuyến - Comprehensive Rules] ${offlineRule.summary}`,
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Could not contact AI Judge. Check network or server.';
        setAiError(msg);
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Judge Desk"
        rightAction={
          <View style={styles.headerRightRow}>
            <Pressable
              onPress={() => {
                setLifeTrackerLife(40);
                setLifeTrackerVisible(true);
              }}
              hitSlop={10}
              style={styles.headerIconBtn}
            >
              <Feather name="shield" size={20} color="#E0AD62" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={styles.headerIconBtn}>
              <Feather name="settings" size={20} color={theme.text} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => {
            setLifeTrackerLife(40);
            setLifeTrackerVisible(true);
          }}
          style={({ pressed }) => [
            styles.lifeTrackerBanner,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: 'rgba(224, 173, 98, 0.4)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.navIconBox, { backgroundColor: 'rgba(224, 173, 98, 0.15)' }]}>
            <Feather name="shield" size={20} color="#E0AD62" />
          </View>
          <View style={styles.lifeTrackerBannerTextWrap}>
            <View style={styles.lifeTrackerBannerTitleRow}>
              <Text style={[styles.lifeTrackerBannerTitle, { color: theme.text }]}>
                Bàn Đấu & Tính Máu (Life Tracker 4P)
              </Text>
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>HOT</Text>
              </View>
            </View>
            <Text style={[styles.lifeTrackerBannerSub, { color: theme.textSecondary }]}>
              Commander 40 HP · Sát thương tướng · Poison · Xúc xắc & Đồng xu
            </Text>
          </View>
          <Feather name="play" size={16} color="#E0AD62" />
        </Pressable>

        <View style={styles.navGrid}>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [
              styles.navCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Feather name="search" size={18} color="#38BDF8" />
            </View>
            <Text style={[styles.navLabel, { color: theme.text }]}>Card Search</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [
              styles.navCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
              <Feather name="camera" size={18} color="#22C55E" />
            </View>
            <Text style={[styles.navLabel, { color: theme.text }]}>Scanner</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/collection')}
            style={({ pressed }) => [
              styles.navCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(224, 173, 98, 0.12)' }]}>
              <Feather name="layers" size={18} color="#E0AD62" />
            </View>
            <Text style={[styles.navLabel, { color: theme.text }]}>Collection</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/decks')}
            style={({ pressed }) => [
              styles.navCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.navIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
              <Feather name="book" size={18} color="#A855F7" />
            </View>
            <Text style={[styles.navLabel, { color: theme.text }]}>Decks</Text>
          </Pressable>
        </View>

        {formatRules.length > 0 && (
          <View style={styles.formatSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="award" size={15} color="#E0AD62" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Format Essentials
                </Text>
              </View>
              <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
                Chơi format nào?
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formatsScroll}
            >
              {formatRules.map((fmt) => (
                <Pressable
                  key={fmt.id}
                  onPress={() => setActiveFormat(fmt)}
                  style={({ pressed }) => [
                    styles.formatCard,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={styles.formatCardHeader}>
                    <Text style={[styles.formatCardName, { color: theme.text }]}>{fmt.name}</Text>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatBadgeText}>{fmt.badge}</Text>
                    </View>
                  </View>
                  <Text style={[styles.formatCardLife, { color: '#E0AD62' }]}>
                    {fmt.startingLife} Máu · {fmt.maxDeckSize ? `${fmt.minDeckSize} Lá` : `${fmt.minDeckSize}+ Lá`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View
          style={[
            styles.aiConsultationBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.aiBoxHeader}>
            <View style={styles.aiBoxHeaderLeft}>
              <View style={styles.aiIconBadge}>
                <Feather name="cpu" size={16} color="#E0AD62" />
              </View>
              <View style={styles.aiBoxHeaderTexts}>
                <Text style={[styles.aiBoxTitle, { color: theme.text }]}>
                  Trọng Tài AI (Gemini Judge)
                </Text>
                <Text style={[styles.aiBoxSub, { color: theme.textSecondary }]}>
                  Hỏi luật thi đấu, tương tác 2 lá bài, hay độ hữu dụng thẻ...
                </Text>
              </View>
            </View>
          </View>

          <JudgeSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => {
              setSearchQuery('');
              setAiError(null);
            }}
            onSubmit={handleAskAi}
            isLoading={isLoadingAi}
          />

          {aiError && (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                },
              ]}
            >
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{aiError}</Text>
              <Pressable onPress={() => setAiError(null)} hitSlop={8}>
                <Feather name="x" size={14} color="#EF4444" />
              </Pressable>
            </View>
          )}

          {isLoadingAi && (
            <View
              style={[
                styles.loadingCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <ActivityIndicator size="small" color="#E0AD62" />
              <View style={styles.loadingTextWrap}>
                <Text style={[styles.loadingTitle, { color: theme.text }]}>
                  Trọng tài Gemini AI đang tra cứu Oracle text & luật CR...
                </Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
                  Phân tích cơ chế thẻ, thứ tự ưu tiên Priority và các bước Stack
                </Text>
              </View>
            </View>
          )}

          {selectedVerdict && (
            <View style={styles.verdictResultContainer}>
              <JudgeVerdictCard
                verdict={selectedVerdict}
                onClear={() => setSelectedVerdict(null)}
                onSelectRule={(ruleNum) => {
                  setCrTargetRule(ruleNum);
                  setCrModalVisible(true);
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="zap" size={15} color="#E0AD62" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Instant Table Verdicts
            </Text>
          </View>
          <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
            {filteredDisputes.length} tình huống
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scenarioFilterScroll}
        >
          {scenarioTags.map((tag) => {
            const isSelected = selectedCategory === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setSelectedCategory(tag.id)}
                style={[
                  styles.scenarioFilterChip,
                  {
                    backgroundColor: isSelected ? '#E0AD62' : theme.surfaceElevated,
                    borderColor: isSelected ? '#E0AD62' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scenarioFilterText,
                    {
                      color: isSelected ? '#121212' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {filteredDisputes.map((dispute) => {
            const isSelected = selectedVerdict?.id === dispute.id;
            return (
              <Pressable
                key={dispute.id}
                onPress={() => handleSelectVerdict(dispute)}
                style={({ pressed }) => [
                  styles.disputeChip,
                  {
                    backgroundColor: isSelected
                      ? '#E0AD62'
                      : theme.surfaceElevated,
                    borderColor: isSelected ? '#E0AD62' : theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#000000' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {dispute.query}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [
            styles.crBrowserBanner,
            {
              backgroundColor: 'rgba(224, 173, 98, 0.1)',
              borderColor: '#E0AD62',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => {
            setCrTargetRule(null);
            setCrModalVisible(true);
          }}
        >
          <View style={styles.crBannerIconBox}>
            <Feather name="book-open" size={20} color="#E0AD62" />
          </View>
          <View style={styles.crBannerTexts}>
            <View style={styles.crBannerTitleRow}>
              <Text style={[styles.crBannerTitle, { color: theme.text }]}>
                Tra Cứu Luật Toàn Thư (CR)
              </Text>
              <View style={styles.crBannerBadge}>
                <Text style={styles.crBannerBadgeText}>3,165 LUẬT</Text>
              </View>
            </View>
            <Text style={[styles.crBannerSub, { color: theme.textSecondary }]}>
              Tra cứu 9 phần luật thi đấu chính thức & 727 thuật ngữ MTG Glossary
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#E0AD62" />
        </Pressable>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="book-open" size={15} color="#E0AD62" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Official Rules Compendium
            </Text>
          </View>
          <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
            CR References
          </Text>
        </View>

        {filteredTopics.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <Feather name="info" size={24} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No rules found matching &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          filteredTopics.map((topic) => (
            <RuleTopicCard
              key={topic.id}
              topic={topic}
              onPress={() => setActiveSheetTopic(topic)}
            />
          ))
        )}

        <Pressable
          onPress={() => router.push(account ? '/settings' : '/login')}
          style={({ pressed }) => [
            styles.authBar,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather
            name={account ? 'check-circle' : 'user'}
            size={16}
            color={account ? '#22C55E' : theme.accent}
          />
          <Text style={[styles.authText, { color: theme.textSecondary }]}>
            {account
              ? `Signed in as ${account.displayName}`
              : 'Sign in to sync your collection & decks'}
          </Text>
          <Feather name="chevron-right" size={14} color={theme.textMuted} />
        </Pressable>
      </ScrollView>

      <CheatSheetModal
        topic={activeSheetTopic}
        visible={activeSheetTopic !== null}
        onClose={() => setActiveSheetTopic(null)}
      />

      <FormatRuleModal
        format={activeFormat}
        visible={activeFormat !== null}
        onClose={() => setActiveFormat(null)}
        onOpenLifeTracker={(startingLife) => {
          setLifeTrackerLife(startingLife as StartingLifeMode);
          setLifeTrackerVisible(true);
        }}
      />

      <ComprehensiveRulesModal
        visible={crModalVisible}
        initialRuleNumber={crTargetRule}
        onClose={() => {
          setCrModalVisible(false);
          setCrTargetRule(null);
        }}
      />

      <LifeTrackerModal
        visible={lifeTrackerVisible}
        onClose={() => setLifeTrackerVisible(false)}
        initialLife={lifeTrackerLife}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  lifeTrackerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  lifeTrackerBannerTextWrap: {
    flex: 1,
  },
  lifeTrackerBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  lifeTrackerBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  lifeTrackerBannerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  hotBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  navGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  navCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  formatSection: {
    marginBottom: spacing.xs,
  },
  formatsScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  formatCard: {
    width: 170,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  formatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatCardName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 4,
  },
  formatBadge: {
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
  },
  formatCardLife: {
    fontSize: 11,
    fontWeight: '600',
  },
  scenarioFilterScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scenarioFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  scenarioFilterText: {
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionCount: {
    ...typography.caption,
  },
  chipsScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  disputeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  loadingTextWrap: {
    flex: 1,
    gap: 2,
  },
  loadingTitle: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  loadingSub: {
    ...typography.caption,
    fontSize: 11,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    ...typography.caption,
  },
  emptyBox: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
  },
  authBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  authText: {
    ...typography.caption,
    flex: 1,
  },
  aiConsultationBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  aiBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  aiBoxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  aiIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(224, 173, 98, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBoxHeaderTexts: {
    flex: 1,
  },
  aiBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  aiBoxSub: {
    fontSize: 11,
    marginTop: 1,
  },
  verdictResultContainer: {
    marginTop: spacing.xs,
  },
  crBrowserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  crBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 173, 98, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crBannerTexts: {
    flex: 1,
  },
  crBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crBannerTitle: {
    ...typography.h3,
    fontWeight: '700',
  },
  crBannerBadge: {
    backgroundColor: '#E0AD62',
    borderRadius: borderRadius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  crBannerBadgeText: {
    ...typography.caption,
    color: '#121212',
    fontWeight: '800',
    fontSize: 9,
  },
  crBannerSub: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});

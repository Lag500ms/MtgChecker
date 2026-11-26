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
  const [showFormats, setShowFormats] = useState(false);
  const [showAllDisputes, setShowAllDisputes] = useState(false);
  const [showRuleTopics, setShowRuleTopics] = useState(false);
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
      { id: 'ALL', label: 'All' },
      ...rawCategories.map((c) => ({
        id: c,
        label: labelMap[c] || c,
      })),
    ];

    if (tags.length <= 1) {
      return [
        { id: 'ALL', label: 'All' },
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
                  `1. Guide: ${topic.title}`,
                  `2. Section: ${section.heading}`,
                  `3. Offline Comprehensive Rules lookup: ${item.crCode || topic.badge}`,
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
              `1. Guide: ${topic.title}`,
              `2. Offline Comprehensive Rules lookup: ${topic.badge}`,
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
          summary: `[Offline - Comprehensive Rules] ${offlineRule.summary}`,
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
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={styles.headerIconBtn}
          >
            <Feather name="settings" size={20} color={theme.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.aiConsultationBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.aiBoxHeader}>
            <View style={styles.aiBoxHeaderLeft}>
              <View style={styles.aiIconBadge}>
                <Feather name="cpu" size={16} color={theme.accent} />
              </View>
              <View style={styles.aiBoxHeaderTexts}>
                <Text style={[styles.aiBoxTitle, { color: theme.text }]}>Ask the Judge</Text>
                <Text style={[styles.aiBoxSub, { color: theme.textSecondary }]}>Rules, card interactions, and quick rulings</Text>
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
            <View style={[styles.errorCard, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }]}>
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{aiError}</Text>
              <Pressable onPress={() => setAiError(null)} hitSlop={8}>
                <Feather name="x" size={14} color="#EF4444" />
              </Pressable>
            </View>
          )}
          {isLoadingAi && (
            <View style={[styles.loadingCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.accent} />
              <View style={styles.loadingTextWrap}>
                <Text style={[styles.loadingTitle, { color: theme.text }]}>Checking card text and rules…</Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>This may take a few seconds.</Text>
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

        <View style={styles.heroSection}>
          <Pressable
            onPress={() => {
              setLifeTrackerLife(40);
              setLifeTrackerVisible(true);
            }}
            style={({ pressed }) => [styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(224, 173, 98, 0.14)' }]}>
              <Feather name="activity" size={20} color={theme.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>Life tracker</Text>
              <Text style={[styles.heroSub, { color: theme.textSecondary }]}>Start a game</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={theme.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(122, 155, 132, 0.16)' }]}>
              <Feather name="camera" size={20} color={theme.success} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>Scan a card</Text>
              <Text style={[styles.heroSub, { color: theme.textSecondary }]}>Look up a card</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={theme.textMuted} />
          </Pressable>
        </View>

        {formatRules.length > 0 && (
          <View style={styles.formatSection}>
            <Pressable
              onPress={() => setShowFormats((visible) => !visible)}
              style={[styles.collapsibleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <View style={styles.sectionTitleRow}>
                <Feather name="award" size={17} color={theme.accent} />
                <View>
                  <Text style={[styles.collapsibleTitle, { color: theme.text }]}>Format rules</Text>
                  <Text style={[styles.collapsibleSub, { color: theme.textSecondary }]}>Starting life and deck size</Text>
                </View>
              </View>
              <View style={styles.collapsibleRight}>
                <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{formatRules.length}</Text>
                <Feather name={showFormats ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
              </View>
            </Pressable>

            {showFormats && <ScrollView
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
                    {fmt.startingLife} Life · {fmt.maxDeckSize ? `${fmt.minDeckSize} Cards` : `${fmt.minDeckSize}+ Cards`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="zap" size={15} color="#E0AD62" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Popular rulings
            </Text>
          </View>
          <Pressable onPress={() => setShowAllDisputes((visible) => !visible)} hitSlop={8}>
            <Text style={[styles.sectionCount, { color: theme.accent }]}>
              {showAllDisputes ? 'Show less' : `See all ${filteredDisputes.length}`}
            </Text>
          </Pressable>
        </View>

        {showAllDisputes && <ScrollView
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
        </ScrollView>}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {(showAllDisputes ? filteredDisputes : filteredDisputes.slice(0, 3)).map((dispute) => {
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
              <Text style={[styles.crBannerTitle, { color: theme.text }]}>Rules library</Text>
            </View>
            <Text style={[styles.crBannerSub, { color: theme.textSecondary }]}>
              Comprehensive rules and topic guides
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#E0AD62" />
        </Pressable>

        <Pressable
          onPress={() => setShowRuleTopics((visible) => !visible)}
          style={[styles.collapsibleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={styles.sectionTitleRow}>
            <Feather name="book-open" size={17} color={theme.accent} />
            <View>
              <Text style={[styles.collapsibleTitle, { color: theme.text }]}>Topic guides</Text>
              <Text style={[styles.collapsibleSub, { color: theme.textSecondary }]}>Priority, layers, keywords, and more</Text>
            </View>
          </View>
          <View style={styles.collapsibleRight}>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{filteredTopics.length}</Text>
            <Feather name={showRuleTopics ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
          </View>
        </Pressable>

        {showRuleTopics && filteredTopics.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <Feather name="info" size={24} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No rules found matching &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : showRuleTopics ? (
          filteredTopics.map((topic) => (
            <RuleTopicCard
              key={topic.id}
              topic={topic}
              onPress={() => setActiveSheetTopic(topic)}
            />
          ))
        ) : null}

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
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  heroSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 80,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  heroBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  formatSection: {
    marginBottom: spacing.md,
  },
  collapsibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  collapsibleSub: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 1,
  },
  collapsibleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    marginTop: spacing.lg,
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

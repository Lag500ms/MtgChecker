import { useUiText } from '@/lib/useUiText';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppTheme } from '@/lib/ThemeProvider';
import { useLanguage } from '@/lib/LanguageProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';
import { useRulesList } from '../useRulesList';
import { JudgeVerdictCard } from '../components/JudgeVerdictCard';
import { ComprehensiveRulesModal } from '../components/ComprehensiveRulesModal';
import type { JudgeVerdict } from '../data/quickJudgeDisputes';
import { CheatSheetModal } from '../components/CheatSheetModal';
import { FormatRuleModal } from '../components/FormatRuleModal';
import { RuleTopicCard } from '../components/RuleTopicCard';
import type { CheatSheetTopic } from '../data/cheatSheets';
import type { FormatRule } from '../data/formats';
import { fetchCheatSheets, fetchQuickDisputes, fetchFormatRules, getInitialCheatSheets, getInitialQuickDisputes, getInitialFormatRules } from '../api/rulesApi';

export function RulesScreen() {
  const ui = useUiText();
  const { theme } = useAppTheme();
  const { language } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState<JudgeVerdict | null>(null);
  const [crModalVisible, setCrModalVisible] = useState(false);
  const [crTargetRule, setCrTargetRule] = useState<string | null>(null);
  const cheatSheets = useRulesList(getInitialCheatSheets, fetchCheatSheets);
  const quickDisputes = useRulesList(getInitialQuickDisputes, fetchQuickDisputes);
  const [activeSheetTopic, setActiveSheetTopic] = useState<CheatSheetTopic | null>(null);
  const [activeFormat, setActiveFormat] = useState<FormatRule | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showFormats, setShowFormats] = useState(false);
  const [showAllDisputes, setShowAllDisputes] = useState(false);
  const [showRuleTopics, setShowRuleTopics] = useState(false);
  const formatRules = useRulesList(getInitialFormatRules, fetchFormatRules);
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

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={language === 'vi' ? 'Tra luật' : 'Rules'} showBack
        onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput value={searchQuery} onChangeText={setSearchQuery}
          accessibilityLabel={ui("Filter topic guides and rulings")}
          placeholder={language === 'vi' ? 'Lọc chủ đề và tình huống luật' : ui("Filter topic guides and rulings")}
          placeholderTextColor={theme.textMuted}
          style={{ color: theme.text, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 14 }} />
        {formatRules.length > 0 && (
          <View style={styles.formatSection}>
            <Pressable
              onPress={() => setShowFormats((visible) => !visible)}
              style={[styles.collapsibleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <View style={styles.sectionTitleRow}>
                <Feather name="award" size={17} color={theme.accent} />
                <View>
                  <Text style={[styles.collapsibleTitle, { color: theme.text }]}>{ui("Format rules")}</Text>
                  <Text style={[styles.collapsibleSub, { color: theme.textSecondary }]}>{ui("Starting life and deck size")}</Text>
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
                    {fmt.startingLife}{ui("Life ·")}{fmt.maxDeckSize ? `${fmt.minDeckSize} Cards` : `${fmt.minDeckSize}+ Cards`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="zap" size={15} color="#E0AD62" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{ui("Popular rulings")}</Text>
          </View>
          <Pressable onPress={() => setShowAllDisputes((visible) => !visible)} hitSlop={8}>
            <Text style={[styles.sectionCount, { color: theme.accent }]}>
              {showAllDisputes ? ui("Show less") : `See all ${filteredDisputes.length}`}
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
              <Text style={[styles.crBannerTitle, { color: theme.text }]}>{ui("Rules library")}</Text>
            </View>
            <Text style={[styles.crBannerSub, { color: theme.textSecondary }]}>{ui("Comprehensive rules and topic guides")}</Text>
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
              <Text style={[styles.collapsibleTitle, { color: theme.text }]}>{ui("Topic guides")}</Text>
              <Text style={[styles.collapsibleSub, { color: theme.textSecondary }]}>{ui("Priority, layers, keywords, and more")}</Text>
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
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{ui("No rules found matching &quot;")}{searchQuery}&quot;
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
          router.push({ pathname: '/lifetracker', params: { life: String(startingLife) } });
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

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
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
  crBannerSub: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});

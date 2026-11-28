import { useUiText } from '@/lib/useUiText';
import { getApiErrorMessage } from '@/lib/apiError';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { JudgeSearchBar } from '../components/JudgeSearchBar';
import type { CheatSheetTopic } from '../data/cheatSheets';
import { askJudgeAi, fetchCheatSheets, fetchQuickDisputes, getInitialCheatSheets, getInitialQuickDisputes } from '../api/rulesApi';

export function JudgeScreen() {
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
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
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
        const msg = ui(getApiErrorMessage(err));
        setAiError(msg);
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={language === 'vi' ? 'Hỏi AI' : 'Ask AI'} showBack
        onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
                <Text style={[styles.aiBoxTitle, { color: theme.text }]}>{ui("Ask the Judge")}</Text>
                <Text style={[styles.aiBoxSub, { color: theme.textSecondary }]}>{ui("Rules, card interactions, and quick rulings")}</Text>
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
                <Text style={[styles.loadingTitle, { color: theme.text }]}>{ui("Checking card text and rules…")}</Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>{ui("This may take a few seconds.")}</Text>
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

      </ScrollView>
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
});

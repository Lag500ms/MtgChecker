import { useUiText } from '@/lib/useUiText';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { JudgeVerdict } from '../data/quickJudgeDisputes';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type JudgeVerdictCardProps = {
  verdict: JudgeVerdict;
  onClear: () => void;
  onSelectRule?: (ruleNumber: string) => void;
};

export function JudgeVerdictCard({ verdict, onClear, onSelectRule }: JudgeVerdictCardProps) {
  const ui = useUiText();
  const { theme } = useAppTheme();

  const isYes = verdict.verdict === 'YES';
  const isNo = verdict.verdict === 'NO';

  const badgeColor = isYes ? '#22C55E' : isNo ? '#EF4444' : '#E0AD62';
  const badgeBg = isYes
    ? 'rgba(34, 197, 94, 0.12)'
    : isNo
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(224, 173, 98, 0.12)';
  const badgeBorder = isYes
    ? 'rgba(34, 197, 94, 0.35)'
    : isNo
      ? 'rgba(239, 68, 68, 0.35)'
      : 'rgba(224, 173, 98, 0.35)';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          <Feather
            name={isYes ? 'check-circle' : isNo ? 'x-circle' : 'alert-triangle'}
            size={13}
            color={badgeColor}
          />
          <Text style={[styles.statusText, { color: badgeColor }]}>
            {isYes ? 'JUDGE VERDICT: YES' : isNo ? 'JUDGE VERDICT: NO' : 'JUDGE VERDICT: CONDITIONAL'}
          </Text>
        </View>

        <View style={styles.topRightWrap}>
          {verdict.isCached !== undefined && (
            <View style={styles.sourceBadge}>
              <Feather name={verdict.isCached ? "database" : "cpu"} size={11} color="#E0AD62" />
              <Text style={styles.sourceText}>{verdict.isCached ? "CACHED" : "AI RAG"}</Text>
            </View>
          )}
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <Feather name="x" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.verdictTitle, { color: theme.text }]}>
        {verdict.verdictTitle}
      </Text>

      <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
        {verdict.summary}
      </Text>

      {verdict.stackSteps && verdict.stackSteps.length > 0 && (
        <View style={styles.stackBox}>
          <View style={styles.stackHeader}>
            <Feather name="layers" size={12} color="#E0AD62" />
            <Text style={styles.stackHeaderText}>{ui("RESOLUTION ORDER ON THE STACK")}</Text>
          </View>
          {verdict.stackSteps.map((step, idx) => (
            <Text key={idx} style={[styles.stepLine, { color: theme.text }]}>
              {step}
            </Text>
          ))}
        </View>
      )}

      {verdict.crRules && verdict.crRules.length > 0 && (
        <View style={styles.rulesRow}>
          <Text style={styles.rulesLabel}>{ui("RULES CITATIONS:")}</Text>
          {verdict.crRules.map((rule, idx) => (
            <Pressable
              key={idx}
              style={styles.rulePill}
              onPress={() => onSelectRule?.(rule)}
            >
              <Feather name="book-open" size={10} color="#E0AD62" />
              <Text style={styles.rulePillText}>{rule}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(224, 173, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.3)',
  },
  sourceText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  clearBtn: {
    padding: 2,
  },
  verdictTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
  },
  stackBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.2)',
    padding: spacing.md,
    gap: 4,
    marginTop: 2,
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  stackHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  stepLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  rulesLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B9C9C4',
    letterSpacing: 0.5,
  },
  rulePill: {
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rulePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E0AD62',
  },
});

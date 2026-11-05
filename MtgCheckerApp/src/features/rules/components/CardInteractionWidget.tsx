import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { JudgeVerdict } from '../data/quickJudgeDisputes';
import { analyzeCardInteraction } from '../api/rulesApi';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type CardInteractionWidgetProps = {
  onVerdictReady: (verdict: JudgeVerdict) => void;
};

const TIMING_OPTIONS = [
  { id: 'ETB', label: 'Vào sân (ETB)' },
  { id: 'UPKEEP', label: 'Upkeep (Đầu lượt)' },
  { id: 'COMBAT', label: 'Combat (Giao tranh)' },
  { id: 'STACK', label: 'Stack / SBA' },
  { id: 'GENERAL', label: 'Bất kỳ (General)' },
];

export function CardInteractionWidget({ onVerdictReady }: CardInteractionWidgetProps) {
  const { theme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardA, setCardA] = useState('');
  const [cardB, setCardB] = useState('');
  const [selectedTiming, setSelectedTiming] = useState('GENERAL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!cardA.trim() || !cardB.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const verdict = await analyzeCardInteraction(
        cardA.trim(),
        cardB.trim(),
        selectedTiming !== 'GENERAL' ? selectedTiming : undefined
      );
      onVerdictReady(verdict);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối AI Judge';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        style={styles.headerPressable}
        onPress={() => setIsExpanded(!isExpanded)}
        hitSlop={6}
      >
        <View style={styles.headerTitleWrap}>
          <Feather name="git-merge" size={16} color="#E0AD62" />
          <Text style={[styles.title, { color: theme.text }]}>So Kèo Tương Tác 2 Thẻ Bài</Text>
        </View>
        <View style={styles.headerRightWrap}>
          <Text style={[styles.badge, { backgroundColor: 'rgba(224, 173, 98, 0.15)', color: '#E0AD62' }]}>
            AI Matchup
          </Text>
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textSecondary}
          />
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.expandedContent}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Nhập 2 lá bài để AI Judge đối soát Oracle text và phân tích thứ tự Stack / SBA:
          </Text>

          <View style={styles.inputsRow}>
            <View style={[styles.inputBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Feather name="layers" size={14} color="#9CA3AF" />
              <TextInput
                placeholder="Thẻ bài 1 (vd: Blood Moon)"
                placeholderTextColor="#6B7280"
                value={cardA}
                onChangeText={setCardA}
                style={[styles.textInput, { color: theme.text }]}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {cardA.length > 0 && (
                <Pressable onPress={() => setCardA('')} hitSlop={8}>
                  <Feather name="x-circle" size={14} color="#6B7280" />
                </Pressable>
              )}
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={[styles.inputBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Feather name="layers" size={14} color="#9CA3AF" />
              <TextInput
                placeholder="Thẻ bài 2 (vd: Urza's Saga)"
                placeholderTextColor="#6B7280"
                value={cardB}
                onChangeText={setCardB}
                style={[styles.textInput, { color: theme.text }]}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {cardB.length > 0 && (
                <Pressable onPress={() => setCardB('')} hitSlop={8}>
                  <Feather name="x-circle" size={14} color="#6B7280" />
                </Pressable>
              )}
            </View>
          </View>

          <Text style={[styles.timingLabel, { color: theme.textSecondary }]}>Giai đoạn tranh chấp:</Text>
          <View style={styles.timingChips}>
            {TIMING_OPTIONS.map((opt) => {
              const isSelected = selectedTiming === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedTiming(opt.id)}
                  style={[
                    styles.timingChip,
                    {
                      backgroundColor: isSelected ? '#E0AD62' : theme.surfaceElevated,
                      borderColor: isSelected ? '#E0AD62' : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timingChipText,
                      { color: isSelected ? '#121212' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            onPress={handleAnalyze}
            disabled={!cardA.trim() || !cardB.trim() || isAnalyzing}
            style={({ pressed }) => [
              styles.analyzeBtn,
              {
                backgroundColor: (!cardA.trim() || !cardB.trim()) ? theme.surfaceElevated : '#E0AD62',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#121212" size="small" />
            ) : (
              <>
                <Feather name="check-circle" size={16} color={(!cardA.trim() || !cardB.trim()) ? '#6B7280' : '#121212'} />
                <Text
                  style={[
                    styles.analyzeBtnText,
                    { color: (!cardA.trim() || !cardB.trim()) ? '#6B7280' : '#121212' },
                  ]}
                >
                  Phán Quyết Tương Tác
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  headerPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    letterSpacing: 0.5,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  inputsRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  vsBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  timingLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  timingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timingChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  timingChipText: {
    fontSize: 11,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  analyzeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
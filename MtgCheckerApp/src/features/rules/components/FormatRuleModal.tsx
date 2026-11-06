import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FormatRule } from '../data/formats';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type FormatRuleModalProps = {
  format: FormatRule | null;
  visible: boolean;
  onClose: () => void;
  onOpenLifeTracker?: (startingLife: number) => void;
};

export function FormatRuleModal({
  format,
  visible,
  onClose,
  onOpenLifeTracker,
}: FormatRuleModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!format) return null;

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
          <View style={styles.dragHandleBar}>
            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
          </View>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text }]}>{format.name}</Text>
                <View style={styles.crBadge}>
                  <Text style={styles.crBadgeText}>{format.badge}</Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {format.summary}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.statLabel}>Starting Life</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>{format.startingLife} HP</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={styles.statLabel}>Deck Size</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {format.maxDeckSize ? `${format.minDeckSize} Cards` : `${format.minDeckSize}+ Cards`}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Essential Format Rules</Text>

          {format.keyRules.map((rule, idx) => (
            <View
              key={idx}
              style={[
                styles.ruleCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.ruleHeader}>
                <Text style={[styles.ruleTitle, { color: theme.text }]}>{rule.title}</Text>
                <View style={styles.citationBadge}>
                  <Text style={styles.citationText}>{rule.crCitation}</Text>
                </View>
              </View>
              <Text style={[styles.ruleDescription, { color: theme.textSecondary }]}>
                {rule.description}
              </Text>
            </View>
          ))}

          {onOpenLifeTracker && (
            <Pressable
              onPress={() => {
                onClose();
                onOpenLifeTracker(format.startingLife);
              }}
              style={({ pressed }) => [
                styles.openTrackerBtn,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="shield" size={16} color="#000" />
              <Text style={styles.openTrackerBtnText}>
                Bắt đầu chơi với Life Tracker ({format.startingLife} HP)
              </Text>
            </Pressable>
          )}
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    height: '82%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  dragHandleBar: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  crBadge: {
    backgroundColor: 'rgba(224, 173, 98, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.4)',
  },
  crBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 6,
    borderRadius: borderRadius.md,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ruleCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: spacing.sm,
  },
  citationBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  citationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  ruleDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  openTrackerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  openTrackerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});

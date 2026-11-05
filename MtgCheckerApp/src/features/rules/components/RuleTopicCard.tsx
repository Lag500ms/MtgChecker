import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { CheatSheetTopic } from '../data/cheatSheets';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type RuleTopicCardProps = {
  topic: CheatSheetTopic;
  onPress: () => void;
};

export function RuleTopicCard({ topic, onPress }: RuleTopicCardProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.iconBox}>
        <Feather
          name={topic.icon as keyof typeof Feather.glyphMap}
          size={20}
          color="#E0AD62"
        />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {topic.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{topic.badge}</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
          {topic.subtitle}
        </Text>
      </View>

      <Feather name="chevron-right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(224, 173, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(224, 173, 98, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.35)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.caption,
    lineHeight: 16,
  },
});

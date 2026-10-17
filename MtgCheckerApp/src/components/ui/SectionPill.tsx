import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type SectionPillProps = {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
};

export function SectionPill({ label, icon = 'settings' }: SectionPillProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: theme.accent }]}>
        <Feather name={icon} size={14} color={theme.accentContrast} />
        <Text style={[styles.label, { color: theme.accentContrast }]}>{label}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },
});

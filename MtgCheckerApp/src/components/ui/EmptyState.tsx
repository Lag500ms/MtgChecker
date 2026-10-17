import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/ThemeProvider';
import { spacing, typography } from '@/lib/theme';

type EmptyStateProps = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
};

export function EmptyState({ icon = 'inbox', title, message }: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <Feather name={icon} size={36} color={theme.textMuted} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});

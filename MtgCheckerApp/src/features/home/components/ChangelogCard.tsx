import { useUiText } from '@/lib/useUiText';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '@/components/ui';
import { useAppTheme } from '@/lib/ThemeProvider';
import { spacing, typography } from '@/lib/theme';

const ITEMS = [
  { tag: 'NEW', text: 'Inventory: track owned printings with live USD price.' },
  { tag: 'NEW', text: 'Card lookup via Scryfall (name, printings, batch).' },
  { tag: 'CHANGE', text: 'Soft MTG themes (Sultai / Boros / Izzet) for less eye strain.' },
];

export function ChangelogCard() {
  const ui = useUiText();
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{ui("Latest changes")}</Text>
        <View style={styles.headerActions}>
          <Feather name="external-link" size={16} color={theme.textMuted} />
          <Pressable onPress={() => setVisible(false)} hitSlop={8}>
            <Feather name="x" size={18} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.version, { color: theme.accent }]}>1.0.0</Text>
      {ITEMS.map((item) => (
        <Text key={item.text} style={[styles.item, { color: theme.textSecondary }]}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>{item.tag}</Text>
          {'  '}
          {item.text}
        </Text>
      ))}
      <Text style={[styles.date, { color: theme.textMuted }]}>October 17, 2026</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  version: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  item: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});

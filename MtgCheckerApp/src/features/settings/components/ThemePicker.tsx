import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/ThemeProvider';
import { THEME_OPTIONS, borderRadius, spacing, typography } from '@/lib/theme';

export function ThemePicker() {
  const { theme, themeId, setThemeId } = useAppTheme();

  return (
    <View style={styles.wrap}>
      {THEME_OPTIONS.map((option) => {
        const selected = option.id === themeId;
        return (
          <Pressable
            key={option.id}
            onPress={() => setThemeId(option.id)}
            style={[
              styles.item,
              {
                backgroundColor: theme.surface,
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}
          >
            <View style={styles.swatches}>
              <View style={[styles.swatch, { backgroundColor: option.background }]} />
              <View style={[styles.swatch, { backgroundColor: option.surface }]} />
              <View style={[styles.swatch, { backgroundColor: option.accent }]} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: theme.text }]}>{option.label}</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{option.description}</Text>
            </View>
            {selected ? <Feather name="check-circle" size={20} color={theme.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  swatches: { flexDirection: 'row', gap: 4 },
  swatch: {
    width: 14,
    height: 28,
    borderRadius: 4,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...typography.body, fontWeight: '700' },
  desc: { ...typography.caption },
});

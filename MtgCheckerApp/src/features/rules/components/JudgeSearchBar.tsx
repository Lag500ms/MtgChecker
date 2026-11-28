import { useUiText } from '@/lib/useUiText';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

type JudgeSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  placeholder?: string;
};

export function JudgeSearchBar({
  value,
  onChangeText,
  onClear,
  onSubmit,
  isLoading = false,
  placeholder = 'Ask judge or search rules (e.g. Doubling Season, Layers)...',
}: JudgeSearchBarProps) {
  const ui = useUiText();
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
      ]}
    >
      <Feather name="search" size={18} color="#E0AD62" style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={ui(placeholder)}
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onSubmit}
        editable={!isLoading}
      />
      {isLoading ? (
        <ActivityIndicator size="small" color="#E0AD62" style={styles.actionIcon} />
      ) : (
        <View style={styles.actionGroup}>
          {value.length > 0 && (
            <Pressable onPress={onClear} hitSlop={10} style={styles.iconBtn}>
              <Feather name="x-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
          {value.trim().length > 2 && onSubmit && (
            <Pressable
              onPress={onSubmit}
              hitSlop={8}
              style={[styles.askBtn, { backgroundColor: '#E0AD62' }]}
            >
              <Feather name="zap" size={13} color="#000000" />
              <Text style={styles.askBtnText}>Ask AI</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    height: 48,
    ...typography.body,
    paddingVertical: 0,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  actionIcon: {
    paddingHorizontal: spacing.xs,
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  askBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/lib/ThemeProvider';
import { spacing, typography } from '@/lib/theme';

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
};

export function ScreenHeader({ title, showBack = false, rightAction, onBack }: ScreenHeaderProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm, backgroundColor: theme.background }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable onPress={handleBack} hitSlop={10} style={styles.side}>
            <Feather name="arrow-left" size={22} color={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, styles.right]}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
});

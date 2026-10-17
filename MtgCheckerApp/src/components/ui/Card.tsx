import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing } from '@/lib/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bare?: boolean;
  onPress?: () => void;
};

export function Card({ children, style, bare = false, onPress }: CardProps) {
  const { theme } = useAppTheme();
  const composed = [
    styles.card,
    { backgroundColor: theme.surface, borderColor: theme.border },
    !bare && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <Pressable style={composed} onPress={onPress} android_ripple={{ color: theme.border }}>
        {children}
      </Pressable>
    );
  }

  return <View style={composed}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});

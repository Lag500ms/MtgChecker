import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAppTheme } from '@/lib/ThemeProvider';

export function DecksScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Decks" />
      <EmptyState
        icon="copy"
        title="Decks coming soon"
        message="Backend deck APIs are not available yet. Collection tracking is ready."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

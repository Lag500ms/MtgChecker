import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui';
import { useAppTheme } from '@/lib/ThemeProvider';

export function ScanScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Scan" />
      <EmptyState
        icon="camera"
        title="Scan coming soon"
        message="Camera recognition is not wired yet. Use Search by exact card name for now."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

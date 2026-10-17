import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAppTheme } from '@/lib/ThemeProvider';
import { spacing, typography } from '@/lib/theme';

import { ChangelogCard } from '../components/ChangelogCard';
import { QuickActionButton } from '../components/QuickActionButton';

const TIPS = [
  {
    title: 'Look up any printing',
    body: 'Search by exact name, then open printings to pick set & finish.',
  },
  {
    title: 'Build your collection',
    body: 'Sign in to save owned cards and track USD price per printing.',
  },
  {
    title: 'Eye-friendly themes',
    body: 'Switch Sultai / Boros / Izzet accents in Settings — muted, not neon.',
  },
];

export function HomeScreen() {
  const { theme } = useAppTheme();
  const { account } = useAuth();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Home"
        rightAction={
          <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
            <Feather name="settings" size={22} color={theme.text} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ChangelogCard />

        <View style={styles.actionsRow}>
          <QuickActionButton
            label="Search cards"
            icon="search"
            onPress={() => router.push('/search')}
          />
          <QuickActionButton
            label="Collection"
            icon="layers"
            onPress={() => router.push('/collection')}
          />
        </View>
        <View style={styles.actionsRow}>
          <QuickActionButton
            label={account ? `Hi, ${account.displayName}` : 'Sign in'}
            icon={account ? 'user' : 'log-in'}
            onPress={() => router.push(account ? '/settings' : '/login')}
            wide
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tips</Text>
          <Feather name="refresh-cw" size={16} color={theme.textMuted} />
        </View>

        {TIPS.map((tip) => (
          <Card key={tip.title} style={styles.tipCard}>
            <Text style={[styles.tipTitle, { color: theme.text }]}>{tip.title}</Text>
            <Text style={[styles.tipBody, { color: theme.textSecondary }]}>{tip.body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  tipCard: {
    marginBottom: spacing.sm,
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tipBody: {
    ...typography.bodySmall,
  },
});

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, ListRow, SectionPill } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { APP_NAME, API_BASE_URL } from '@/lib/apiConfig';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import { ThemePicker } from '../components/ThemePicker';

export function SettingsScreen() {
  const { theme } = useAppTheme();
  const { account, logout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    Alert.alert('Sign out', 'Clear local session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout().then(() => router.replace('/' as Href));
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.accountRow}>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <Feather name="user" size={22} color={theme.accentContrast} />
            </View>
            <View style={styles.accountText}>
              <Text style={[styles.accountName, { color: theme.text }]}>
                {account?.displayName ?? 'Guest'}
              </Text>
              <Text style={[styles.accountSub, { color: theme.textSecondary }]}>
                {account?.email ?? 'Local session · sign in to sync collection'}
              </Text>
            </View>
            {account ? (
              <Pressable onPress={onLogout} hitSlop={8}>
                <Feather name="more-vertical" size={20} color={theme.textMuted} />
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push('/login')}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Login</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <SectionPill label="Appearance" icon="droplet" />
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          MTG-inspired accents, desaturated for night use. Background stays dark.
        </Text>
        <ThemePicker />

        <SectionPill label="General" icon="sliders" />
        <ListRow icon="cloud" title="API endpoint" subtitle={API_BASE_URL} />
        <ListRow icon="info" title="App" subtitle={`${APP_NAME} · 1.0.0`} />
        {!account ? (
          <ListRow
            icon="user-plus"
            title="Create account"
            subtitle="Register with email"
            onPress={() => router.push('/register')}
          />
        ) : null}
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: { flex: 1, gap: 2 },
  accountName: { ...typography.body, fontWeight: '700' },
  accountSub: { ...typography.bodySmall },
  hint: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
});

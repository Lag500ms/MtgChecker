import { useUiText } from '@/lib/useUiText';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, ConfirmModal, ListRow, SectionPill } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { APP_NAME } from '@/lib/apiConfig';
import { useAppTheme } from '@/lib/ThemeProvider';
import { useLanguage } from '@/lib/LanguageProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

import { ThemePicker } from '../components/ThemePicker';

export function SettingsScreen() {
  const ui = useUiText();
  const { theme } = useAppTheme();
  const { language, setLanguage, t } = useLanguage();
  const { account, ready, logout } = useAuth();
  const router = useRouter();
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const onLogout = () => {
    setLogoutConfirmVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={ui("Settings")} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {ready && <Card>
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
                <Text style={{ color: theme.accent, fontWeight: '700' }}>{ui("Login")}</Text>
              </Pressable>
            )}
          </View>
        </Card>}

        <SectionPill label={ui("Appearance")} icon="droplet" />
        <ThemePicker />

        <SectionPill label={t('language')} icon="globe" />
        <View style={styles.languageRow}>
          {(['en', 'vi'] as const).map((lang) => (
            <Pressable key={lang} accessibilityRole="button"
              accessibilityState={{ selected: language === lang }}
              onPress={() => setLanguage(lang)}
              style={[styles.languageButton, {
                backgroundColor: language === lang ? theme.accent : theme.surface,
                borderColor: language === lang ? theme.accent : theme.border,
              }]}>
              <Text style={{ fontWeight: '800', color: language === lang ? theme.accentContrast : theme.text }}>
                {lang === 'en' ? t('english') : t('vietnamese')}
              </Text>
            </Pressable>
          ))}
        </View>
        <SectionPill label={ui("General")} icon="sliders" />
        <ListRow icon="info" title={ui("App")} subtitle={`${APP_NAME} · 1.0.0`} />
        {ready && !account ? (
          <ListRow
            icon="user-plus"
            title={ui("Create account")}
            subtitle={ui("Register with email")}
            onPress={() => router.push('/register')}
          />
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={logoutConfirmVisible}
        title={ui("Log Out")}
        message={ui("Are you sure you want to log out of your account on this device?")}
        confirmLabel={ui("Log Out")}
        cancelLabel={ui("Cancel")}
        icon="log-out"
        isDestructive={true}
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          void logout().then(() => router.replace('/' as Href));
        }}
        onCancel={() => setLogoutConfirmVisible(false)}
      />
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
  languageRow: { flexDirection: 'row', gap: 9, marginBottom: spacing.lg },
  languageButton: { flex: 1, borderWidth: 1, borderRadius: borderRadius.md, padding: 13, alignItems: 'center' },
  hint: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
});

import { useUiText } from '@/lib/useUiText';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useToast } from '@/components/Toast';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

export function RegisterScreen() {
  const ui = useUiText();
  const { theme } = useAppTheme();
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const displayNameValue = displayName.trim();
    const emailValue = email.trim();
    const passwordValue = password;

    if (!displayNameValue || !emailValue || !passwordValue) {
      toast.info(ui("Display name, email and password are required"), ui("Register failed"));
      return;
    }
    if (passwordValue.length < 8) {
      toast.info(ui("Password must be at least 8 characters"), ui("Register failed"));
      return;
    }

    setLoading(true);
    try {
      await register({
        displayName: displayNameValue,
        email: emailValue,
        password: passwordValue,
      });
      toast.success(ui("Account created successfully!"));
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e: unknown) {
      toast.error(ui(getApiErrorMessage(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={ui("Register")} showBack />
      <View style={styles.body}>
        <Card>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{ui("Display name")}</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            textContentType="name"
            placeholder="Planeswalker"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>{ui("Password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={Platform.OS === 'android' ? 'password' : 'new-password'}
            textContentType="newPassword"
            placeholder="••••••••"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSubmit}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={theme.accentContrast} />
            ) : (
              <Text style={[styles.btnText, { color: theme.accentContrast }]}>{ui("Create account")}</Text>
            )}
          </Pressable>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: spacing.lg },
  label: { ...typography.caption, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  btn: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  btnText: { ...typography.button },
});

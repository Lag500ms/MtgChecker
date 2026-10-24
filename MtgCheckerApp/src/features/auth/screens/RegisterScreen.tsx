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
import { type Href, useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApiErrorMessage } from '@/lib/apiError';
import { API_BASE_URL } from '@/lib/apiConfig';
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

export function RegisterScreen() {
  const { theme } = useAppTheme();
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const displayNameValue = displayName.trim();
    const emailValue = email.trim();
    const passwordValue = password;

    if (!displayNameValue || !emailValue || !passwordValue) {
      Alert.alert('Register failed', 'Display name, email and password are required');
      return;
    }
    if (passwordValue.length < 8) {
      Alert.alert('Register failed', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        displayName: displayNameValue,
        email: emailValue,
        password: passwordValue,
      });
      router.replace('/' as Href);
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e);
      const hint =
        msg.toLowerCase().includes('network')
          ? `${msg}\n\nAPI: ${API_BASE_URL}`
          : msg;
      Alert.alert('Register failed', hint);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Register" showBack />
      <View style={styles.body}>
        <Card>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Display name</Text>
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
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
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
            onPress={onSubmit}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={theme.accentContrast} />
            ) : (
              <Text style={[styles.btnText, { color: theme.accentContrast }]}>Create account</Text>
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

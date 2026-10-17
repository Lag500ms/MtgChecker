import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAppTheme } from '@/lib/ThemeProvider';
import { borderRadius, spacing, typography } from '@/lib/theme';

export function LoginScreen() {
  const { theme } = useAppTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/' as Href);
    } catch (e: any) {
      Alert.alert('Login failed', e?.response?.data?.message || e?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Sign in" showBack />
      <View style={styles.body}>
        <Card>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
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
              <Text style={[styles.btnText, { color: theme.accentContrast }]}>Sign in</Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/register')} style={styles.linkWrap}>
            <Text style={{ color: theme.accent }}>Need an account? Register</Text>
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
  linkWrap: { alignItems: 'center', marginTop: spacing.lg },
});

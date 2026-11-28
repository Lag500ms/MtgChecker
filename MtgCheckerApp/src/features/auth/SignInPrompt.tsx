import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '@/lib/LanguageProvider';
import { useAppTheme } from '@/lib/ThemeProvider';
import { useAuth } from './AuthProvider';

type Props = {
  purpose: 'collection' | 'decks' | 'card';
  cardName?: string;
  onLater?: () => void;
  onLogin?: () => void;
};

export function SignInPrompt({ purpose, cardName, onLater, onLogin }: Props) {
  const { ready } = useAuth();
  const { theme } = useAppTheme();
  const { language } = useLanguage();
  const router = useRouter();
  const vi = language === 'vi';
  if (!ready) return <ActivityIndicator style={styles.panel} color={theme.accent} />;
  const message = {
    collection: vi ? 'Đăng nhập để lưu và quản lý bộ sưu tập của bạn.' : 'Sign in to save and manage your collection.',
    decks: vi ? 'Đăng nhập để tạo và quản lý bộ bài của bạn.' : 'Sign in to create and manage your decks.',
    card: vi ? `Đăng nhập để lưu ${cardName} vào bộ sưu tập.` : `Sign in to save ${cardName} to your collection.`,
  }[purpose];
  const signIn = (
    <Pressable accessibilityRole="button" onPress={onLogin ?? (() => router.push('/login'))}
      style={[styles.button, { backgroundColor: theme.accent }]}>
      <Text style={{ color: theme.accentContrast, fontWeight: '700' }}>{vi ? 'Đăng nhập' : 'Sign in'}</Text>
    </Pressable>
  );
  if (purpose !== 'card') {
    const artwork = purpose === 'collection'
      ? require('../../../assets/images/guest/collection.jpg')
      : require('../../../assets/images/guest/decks.jpg');
    return (
      <View style={styles.guestPage}>
        <View style={styles.hero}>
          <Image source={artwork} accessible={false} resizeMode="cover" style={styles.art} />
          <Text style={[styles.caption, { color: theme.text }]}>{message}</Text>
          {signIn}
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Feather name="lock" size={20} color={theme.accent} />
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      <View style={styles.actions}>
        {signIn}
        <Pressable accessibilityRole="button" onPress={onLater ?? (() => router.navigate('/'))} style={styles.button}>
          <Text style={{ color: theme.textSecondary }}>{vi ? 'Để sau' : 'Not now'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guestPage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16 },
  hero: { width: '100%', maxWidth: 480, alignItems: 'center', gap: 16 },
  art: { width: '100%', aspectRatio: 1.95, maxHeight: 240, borderRadius: 16 },
  caption: { fontSize: 19, lineHeight: 27, fontWeight: '600', textAlign: 'center' },
  panel: { margin: 16, gap: 12, padding: 16, borderWidth: 1, borderRadius: 14 },
  message: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, borderRadius: 9, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
});

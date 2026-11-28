import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/lib/ThemeProvider';
import { useLanguage } from '@/lib/LanguageProvider';
import { useAuth } from '@/features/auth/AuthProvider';

const rows = [
  [
    { path: '/collection', en: 'Collection', vi: 'Bộ sưu tập', icon: 'archive', color: '#90BCA7' },
    { path: '/decks', en: 'Decks', vi: 'Bộ bài', icon: 'layers', color: '#D8AD79' },
  ],
  [
    { path: '/scan', en: 'Scan a card', vi: 'Quét lá bài', icon: 'camera', color: '#86B8D3' },
    { path: '/rules', en: 'Rules', vi: 'Tra luật', icon: 'book-open', color: '#CCB796' },
  ],
  [
    { path: '/judge', en: 'Ask AI', vi: 'Hỏi AI', icon: 'message-circle', color: '#BEA3DA' },
    { path: '/lifetracker', en: 'Life Tracker', vi: 'Bảng tính máu', icon: 'activity', color: '#DA9A99' },
  ],
] as const;

export function HomeScreen() {
  const { theme } = useAppTheme();
  const { language } = useLanguage();
  const { account, ready } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[
      styles.page, { paddingTop: insets.top + 20, paddingBottom: 24 },
    ]}>
      <View style={styles.header}>
        <Image source={require('../../../../assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.title, { color: theme.text }]}>MtgChecker</Text>
        {ready && <Pressable accessibilityRole="button" onPress={() => router.push(account ? '/settings' : '/login')}
          style={[styles.account, { backgroundColor: theme.surface }]}>
          {account && <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={{ color: theme.accentContrast }}>{account.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>}
          <Text numberOfLines={1} style={{ flexShrink: 1, color: theme.text, fontWeight: '700' }}>
            {account?.displayName ?? (language === 'vi' ? 'Đăng nhập' : 'Sign in')}
          </Text>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={language === 'vi' ? 'Cài đặt' : 'Settings'}
          style={styles.action} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={21} color={theme.textSecondary} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.navigate({
        pathname: '/search', params: { focusSearch: String(Date.now()) },
      })} style={({ pressed }) => [styles.search, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}>
        <Feather name="search" size={28} color={theme.accentContrast} />
        <Text style={[styles.searchLabel, { color: theme.accentContrast }]}>
          {language === 'vi' ? 'Tìm lá bài' : 'Search cards'}
        </Text>
        <Feather name="arrow-right" size={22} color={theme.accentContrast} />
      </Pressable>
      {rows.map(row => (
        <View key={row[0].path} style={styles.row}>
          {row.map(tile => (
            <Pressable key={tile.path} accessibilityRole="button" onPress={() => router.navigate(tile.path)}
              style={({ pressed }) => [styles.tile, { backgroundColor: pressed ? theme.surfaceElevated : theme.surface, borderColor: theme.border }]}>
              <View style={styles.tileTop}>
                <View style={[styles.iconBox, { backgroundColor: tile.color + '18' }]}>
                  <Feather name={tile.icon} size={23} color={tile.color} />
                </View>
                <Feather name="arrow-up-right" size={16} color={theme.textMuted} />
              </View>
              <Text style={[styles.tileLabel, { color: theme.text }]}>{tile[language]}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 38, height: 38, borderRadius: 11, marginRight: 10 },
  title: { flex: 1, fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  account: { maxWidth: '43%', minHeight: 44, flexDirection: 'row', gap: 7, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center' },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 22, minHeight: 88 },
  searchLabel: { flex: 1, fontSize: 23, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, minWidth: 0, minHeight: 116, padding: 15, gap: 16, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 17, fontWeight: '700' },
});

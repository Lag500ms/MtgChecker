import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeId } from './theme';

const THEME_KEY = 'mtgchecker.themeId';

export async function loadThemeId(): Promise<ThemeId | null> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  if (value === 'default' || value === 'sultai' || value === 'boros' || value === 'izzet') {
    return value;
  }
  return null;
}

export async function saveThemeId(id: ThemeId): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, id);
}

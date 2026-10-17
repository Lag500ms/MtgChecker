import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'mtgchecker.accessToken';
const REFRESH_KEY = 'mtgchecker.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
  await AsyncStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(ACCESS_KEY), AsyncStorage.removeItem(REFRESH_KEY)]);
}

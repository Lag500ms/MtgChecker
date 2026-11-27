import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PATH = '/api/v1';
const DEFAULT_API_PORT = '8081';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function isLoopbackHost(url: string): boolean {
  return /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

/** Host running Metro (your PC), e.g. 192.168.0.128 from hostUri "192.168.0.128:8082". */
function getExpoDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;

  try {
    if (hostUri.includes('://')) {
      return new URL(hostUri).hostname || null;
    }
    return hostUri.split(':')[0] || null;
  } catch {
    return hostUri.split(':')[0] || null;
  }
}

function buildApiUrl(host: string, port: string): string {
  return stripTrailingSlash(`http://${host}:${port}${API_PATH}`);
}

/**
 * - Web: localhost is fine.
 * - Android emulator: 10.0.2.2 → host machine.
 * - Physical device / Expo Go: PC LAN IP from Expo (never localhost).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
  const apiPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || DEFAULT_API_PORT;

  if (Platform.OS === 'web') {
    return fromEnv ? stripTrailingSlash(fromEnv) : buildApiUrl('localhost', apiPort);
  }

  if (fromEnv && !isLoopbackHost(fromEnv)) {
    return stripTrailingSlash(fromEnv);
  }

  if (Platform.OS === 'android' && Constants.isDevice === false) {
    return buildApiUrl('10.0.2.2', apiPort);
  }

  const lanHost = getExpoDevHost();
  if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
    return buildApiUrl(lanHost, apiPort);
  }

  if (fromEnv) return stripTrailingSlash(fromEnv);
  return buildApiUrl('localhost', apiPort);
}

export const API_BASE_URL = resolveApiBaseUrl();
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME?.trim() || 'MtgChecker';

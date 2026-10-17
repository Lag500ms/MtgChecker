function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:8081/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME?.trim() || 'MtgChecker';

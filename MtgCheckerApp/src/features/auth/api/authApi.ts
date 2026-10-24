import { apiClient } from '@/lib/apiClient';

import type { Account, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email: payload.email,
    password: payload.password,
    displayName: payload.displayName,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function fetchMe(): Promise<Account> {
  const { data } = await apiClient.get<Account>('/accounts/me');
  return data;
}

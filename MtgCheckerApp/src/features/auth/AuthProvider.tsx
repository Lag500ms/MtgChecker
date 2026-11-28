import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/tokenStorage';

import { fetchMe, login as loginApi, logout as logoutApi, register as registerApi } from './api/authApi';
import type { Account, LoginRequest, RegisterRequest } from './types/auth';

type AuthContextValue = {
  account: Account | null;
  ready: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  const refreshAccount = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setAccount(null);
      return;
    }
    try {
      const me = await fetchMe();
      setAccount(me);
    } catch {
      await clearTokens();
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshAccount();
      } catch (error) {
        console.warn("Could not restore account session", error);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshAccount]);

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await loginApi(payload);
    await setTokens(res.accessToken, res.refreshToken);
    setAccount(res.account);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const res = await registerApi(payload);
    await setTokens(res.accessToken, res.refreshToken);
    setAccount(res.account);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } finally {
      await clearTokens();
      setAccount(null);
    }
  }, []);

  const value = useMemo(
    () => ({ account, ready, login, register, logout, refreshAccount }),
    [account, ready, login, register, logout, refreshAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

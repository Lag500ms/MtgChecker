import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { themeById, type AppPalette, type ThemeId } from './theme';
import { loadThemeId, saveThemeId } from './themeStorage';

type ThemeContextValue = {
  theme: AppPalette;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadThemeId().then((id) => {
      if (mounted && id) setThemeIdState(id);
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    void saveThemeId(id);
  }, []);

  const value = useMemo(
    () => ({
      theme: themeById(themeId),
      themeId,
      setThemeId,
      ready,
    }),
    [themeId, setThemeId, ready],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style="light" />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}

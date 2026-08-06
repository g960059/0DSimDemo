import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type AppThemeId = 'dark' | 'light';

export const APP_THEME_STORAGE_KEY = 'circleheart.app.theme';
export const DEFAULT_APP_THEME: AppThemeId = 'dark';

const APP_THEMES = new Set<AppThemeId>(['dark', 'light']);

let currentTheme: AppThemeId | null = null;
const listeners = new Set<() => void>();

function normalizeTheme(value: string | null): AppThemeId | null {
  return APP_THEMES.has(value as AppThemeId) ? (value as AppThemeId) : null;
}

export function getStoredAppTheme(): AppThemeId {
  if (typeof localStorage === 'undefined') return DEFAULT_APP_THEME;
  try {
    return normalizeTheme(localStorage.getItem(APP_THEME_STORAGE_KEY)) ?? DEFAULT_APP_THEME;
  } catch {
    return DEFAULT_APP_THEME;
  }
}

function readTheme(): AppThemeId {
  if (currentTheme === null) currentTheme = getStoredAppTheme();
  return currentTheme;
}

function applyTheme(theme: AppThemeId): void {
  if (typeof document !== 'undefined') document.body.dataset.appTheme = theme;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme still applies to this session when storage is blocked.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAppTheme(theme: AppThemeId): void {
  if (readTheme() === theme) return;
  currentTheme = theme;
  for (const listener of [...listeners]) listener();
  applyTheme(theme);
}

export function useAppTheme() {
  const appTheme = useSyncExternalStore(subscribe, readTheme, readTheme);

  useEffect(() => {
    // The theme belongs to the document, so route unmounts must not remove it.
    applyTheme(appTheme);
  }, [appTheme]);

  const updateAppTheme = useCallback((theme: AppThemeId) => setAppTheme(theme), []);
  return { appTheme, setAppTheme: updateAppTheme };
}

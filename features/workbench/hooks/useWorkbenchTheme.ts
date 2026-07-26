import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { WorkbenchThemeId } from '@/components/workbench/WorkbenchSidePanel';
import { getStoredWorkbenchTheme, WORKBENCH_THEME_STORAGE_KEY } from '@/features/workbench/workbenchDefaults';

/**
 * One theme, owned once.
 *
 * The theme belongs to the document, not to whichever route happens to be
 * mounted. When several routes each held their own copy, each wrote the body
 * dataset and each removed it on unmount, so a navigation could clear the
 * attribute the incoming route had just set. The state lives here instead, and
 * every reader sees the same value.
 */
let currentTheme: WorkbenchThemeId | null = null;
const listeners = new Set<() => void>();

function readTheme(): WorkbenchThemeId {
  if (currentTheme === null) currentTheme = getStoredWorkbenchTheme();
  return currentTheme;
}

function applyTheme(theme: WorkbenchThemeId): void {
  if (typeof document !== 'undefined') {
    document.body.dataset.workbenchTheme = theme;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WORKBENCH_THEME_STORAGE_KEY, theme);
    }
  } catch {
    // A full or blocked store must not strand the change: the theme applies
    // for this session and is simply not remembered for the next one.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setWorkbenchThemeV1(theme: WorkbenchThemeId): void {
  if (readTheme() === theme) return;
  currentTheme = theme;
  // Subscribers are told before anything that can fail, so a rejected write
  // cannot leave the store changed and every reader showing the old value.
  for (const listener of [...listeners]) listener();
  applyTheme(theme);
}

export function useWorkbenchTheme() {
  const workbenchTheme = useSyncExternalStore(subscribe, readTheme, readTheme);

  useEffect(() => {
    // Applied, never cleaned up: the attribute belongs to the document for as
    // long as the app is mounted, so unmounting a route must not remove it.
    applyTheme(workbenchTheme);
  }, [workbenchTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const timers = new WeakMap<Element, number>();
    const scrollableSelector = '.custom-scrollbar, .workbench-dockview .dv-scrollable';
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const scrollable = target.closest(scrollableSelector);
      if (!scrollable) return;
      scrollable.classList.add('is-scrolling');
      const previousTimer = timers.get(scrollable);
      if (previousTimer) window.clearTimeout(previousTimer);
      timers.set(scrollable, window.setTimeout(() => {
        scrollable.classList.remove('is-scrolling');
        timers.delete(scrollable);
      }, 850));
    };
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const setWorkbenchTheme = useCallback((theme: WorkbenchThemeId) => {
    setWorkbenchThemeV1(theme);
  }, []);

  return { workbenchTheme, setWorkbenchTheme };
}

import { useEffect, useState } from 'react';
import type { WorkbenchThemeId } from '@/components/workbench/WorkbenchSidePanel';
import { getStoredWorkbenchTheme, WORKBENCH_THEME_STORAGE_KEY } from '@/features/workbench/workbenchDefaults';

export function useWorkbenchTheme() {
  const [workbenchTheme, setWorkbenchTheme] = useState<WorkbenchThemeId>(getStoredWorkbenchTheme);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(WORKBENCH_THEME_STORAGE_KEY, workbenchTheme);
  }, [workbenchTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.workbenchTheme = workbenchTheme;
    return () => {
      if (document.body.dataset.workbenchTheme === workbenchTheme) {
        delete document.body.dataset.workbenchTheme;
      }
    };
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

  return { workbenchTheme, setWorkbenchTheme };
}

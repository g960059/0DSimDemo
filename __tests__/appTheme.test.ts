import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('application theme', () => {
  it('reads and writes only the current application theme key', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    vi.stubGlobal('document', { body: { dataset: {} } });

    const theme = await import('@/appTheme');
    expect(theme.APP_THEME_STORAGE_KEY).toBe('circleheart.app.theme');
    expect(theme.getStoredAppTheme()).toBe('dark');
    theme.setAppTheme('light');

    expect(values.get(theme.APP_THEME_STORAGE_KEY)).toBe('light');
    expect((document.body.dataset as Record<string, string>).appTheme).toBe('light');
  });

  it('applies the current application dataset before the first paint', () => {
    const html = readFileSync('index.html', 'utf8');

    expect(html).toContain('document.body.dataset.appTheme');
    expect(html).not.toContain('document.body.dataset.workbenchTheme');
  });

});

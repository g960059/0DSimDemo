import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { outputColorV3 } from '@/components/workbench/WorkbenchSurfaceV3';

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

  it('keeps the shared light and dark surfaces quiet and Zenn-blue accented', () => {
    const css = readFileSync('index.css', 'utf8');

    expect(css).toContain('--wb-app-bg: #0a1622;');
    expect(css).toContain('--wb-zone-main-bg: #0b1a29;');
    expect(css).toContain('--wb-app-bg: #f4f7f9;');
    expect(css).toContain('--wb-zone-main-bg: #f8fafb;');
    expect(css).toContain('--wb-accent: #3ea8ff;');
    expect(css).toContain('--wb-line: var(--wb-border);');
    expect(css).toContain('--wb-grid: rgba(37, 55, 72, 0.09);');
    expect(css).toContain('--wb-type-label: 0.75rem;');
    expect(css).toContain('--wb-type-value: 1rem;');
  });

  it('uses semantic default series colors legible on both application canvases', () => {
    const outputIds = [
      'hemodynamics.volume.LA',
      'hemodynamics.volume.LV',
      'hemodynamics.volume.RA',
      'hemodynamics.volume.RV',
      'hemodynamics.pressure.absolute.LA',
      'hemodynamics.pressure.absolute.LV',
      'hemodynamics.pressure.absolute.RA',
      'hemodynamics.pressure.absolute.RV',
      'hemodynamics.pressure.transmural.LA',
      'hemodynamics.pressure.transmural.LV',
      'hemodynamics.pressure.transmural.RA',
      'hemodynamics.pressure.transmural.RV',
      'hemodynamics.pressure.absolute.Ao',
      'hemodynamics.pressure.absolute.SA',
      'hemodynamics.pressure.absolute.PA',
      'hemodynamics.pressure.absolute.PVein',
      'hemodynamics.pressure.absolute.VC',
      'hemodynamics.flow.valve.MV',
      'hemodynamics.flow.valve.AoV',
      'hemodynamics.flow.valve.TV',
      'hemodynamics.flow.valve.PV',
      'coronary.flow.total',
      'coronary.flow.inlet.LAD',
      'coronary.flow.inlet.LCx',
      'coronary.flow.inlet.RCA',
      'device.LVAD.flow',
      'rhythm.phase.regular-sinus',
      'future.output.uses-deterministic-fallback',
    ] as const;
    const backgrounds = ['#0b1a29', '#f8fafb'] as const;

    outputIds.forEach((outputId) => {
      const color = outputColorV3(outputId);
      backgrounds.forEach((background) => {
        expect(
          contrastRatio(color, background),
          `${outputId} ${color} on ${background}`,
        ).toBeGreaterThanOrEqual(3);
      });
    });

    expect(outputColorV3('coronary.flow.total')).toBe('#66717b');
    expect(outputColorV3('hemodynamics.pressure.absolute.LV')).toBe('#cf405a');
    expect(outputColorV3('hemodynamics.pressure.absolute.RV')).toBe('#3472c4');
  });

});

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

function relativeLuminance(color: string): number {
  const channels = color.match(/[0-9a-f]{2}/gi)?.map((channel) =>
    Number.parseInt(channel, 16) / 255);
  if (channels === undefined || channels.length !== 3) {
    throw new Error(`Expected canonical six-digit hex, received ${color}`);
  }
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]!) + (0.7152 * linear[1]!) + (0.0722 * linear[2]!);
}

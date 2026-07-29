import { describe, expect, it } from 'vitest';
import { localeFromPathname, prefixPath, stripLocaleFromPathname, switchLocalePath } from '../localeRouting';
import enTranslation from '../locales/en/translation.json';
import jaTranslation from '../locales/ja/translation.json';

function flattenTranslationKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => (
    flattenTranslationKeys(child, prefix ? `${prefix}.${key}` : key)
  ));
}

describe('locale helpers', () => {
  it('detects supported path locales and defaults to Japanese', () => {
    expect(localeFromPathname('/en/cases')).toBe('en');
    expect(localeFromPathname('/ja/cases')).toBe('ja');
    expect(localeFromPathname('/cases')).toBe('ja');
  });

  it('strips locale prefixes from pathnames', () => {
    expect(stripLocaleFromPathname('/en/workbench/normal')).toBe('/workbench/normal');
    expect(stripLocaleFromPathname('/ja/cases')).toBe('/cases');
    expect(stripLocaleFromPathname('/cases')).toBe('/cases');
    expect(stripLocaleFromPathname('/en')).toBe('/');
  });

  it('always prefixes localized paths', () => {
    expect(prefixPath('/cases', 'ja')).toBe('/ja/cases');
    expect(prefixPath('/cases', 'en')).toBe('/en/cases');
    expect(prefixPath('/', 'ja')).toBe('/ja');
    expect(prefixPath('/', 'en')).toBe('/en');
  });

  it('switches locale while preserving query and hash', () => {
    expect(switchLocalePath('/ja/workbench/normal', '?from=cases', '#metrics', 'en')).toBe('/en/workbench/normal?from=cases#metrics');
    expect(switchLocalePath('/en/workbench/normal', '?from=cases', '#metrics', 'ja')).toBe('/ja/workbench/normal?from=cases#metrics');
  });

  it('keeps Japanese and English translation keys in parity', () => {
    expect(flattenTranslationKeys(jaTranslation).sort()).toEqual(flattenTranslationKeys(enTranslation).sort());
  });

  it('localizes both scenario-cap and shared-lane refusal messages', () => {
    expect(enTranslation.workbench.scenarioPane.maximumScenariosReached)
      .toContain('Maximum of {{count}} scenarios');
    expect(jaTranslation.workbench.scenarioPane.maximumScenariosReached)
      .toContain('シナリオは最大{{count}}件');
    expect(enTranslation.workbench.scenarioPane.liveLaneCapacityReached)
      .toContain('live simulation slots');
    expect(jaTranslation.workbench.scenarioPane.liveLaneCapacityReached)
      .toContain('ライブ実験の同時実行枠');
  });
});

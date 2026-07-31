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
    expect(localeFromPathname('/en/workbench')).toBe('en');
    expect(localeFromPathname('/ja/workbench')).toBe('ja');
    expect(localeFromPathname('/workbench')).toBe('ja');
  });

  it('strips locale prefixes from pathnames', () => {
    expect(stripLocaleFromPathname('/en/workbench/details')).toBe('/workbench/details');
    expect(stripLocaleFromPathname('/ja/workbench')).toBe('/workbench');
    expect(stripLocaleFromPathname('/workbench')).toBe('/workbench');
    expect(stripLocaleFromPathname('/en')).toBe('/');
  });

  it('always prefixes localized paths', () => {
    expect(prefixPath('/workbench', 'ja')).toBe('/ja/workbench');
    expect(prefixPath('/workbench', 'en')).toBe('/en/workbench');
    expect(prefixPath('/', 'ja')).toBe('/ja');
    expect(prefixPath('/', 'en')).toBe('/en');
  });

  it('switches locale while preserving query and hash', () => {
    expect(switchLocalePath('/ja/workbench', '?from=home', '#status', 'en')).toBe('/en/workbench?from=home#status');
    expect(switchLocalePath('/en/workbench', '?from=home', '#status', 'ja')).toBe('/ja/workbench?from=home#status');
  });

  it('keeps Japanese and English translation keys in parity', () => {
    expect(flattenTranslationKeys(jaTranslation).sort()).toEqual(flattenTranslationKeys(enTranslation).sort());
  });
});

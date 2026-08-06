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
    expect(localeFromPathname('/en/experiments')).toBe('en');
    expect(localeFromPathname('/ja/experiments')).toBe('ja');
    expect(localeFromPathname('/experiments')).toBe('ja');
  });

  it('strips locale prefixes from pathnames', () => {
    expect(stripLocaleFromPathname('/en/experiments/details')).toBe('/experiments/details');
    expect(stripLocaleFromPathname('/ja/experiments')).toBe('/experiments');
    expect(stripLocaleFromPathname('/experiments')).toBe('/experiments');
    expect(stripLocaleFromPathname('/en')).toBe('/');
  });

  it('always prefixes localized paths', () => {
    expect(prefixPath('/experiments', 'ja')).toBe('/ja/experiments');
    expect(prefixPath('/experiments', 'en')).toBe('/en/experiments');
    expect(prefixPath('/', 'ja')).toBe('/ja');
    expect(prefixPath('/', 'en')).toBe('/en');
  });

  it('switches locale while preserving query and hash', () => {
    expect(switchLocalePath('/ja/experiments', '?from=home', '#status', 'en')).toBe('/en/experiments?from=home#status');
    expect(switchLocalePath('/en/experiments', '?from=home', '#status', 'ja')).toBe('/ja/experiments?from=home#status');
    expect(switchLocalePath('/ja/experiments/experiment-opaque_123', '?from=list', '#status', 'en'))
      .toBe('/en/experiments/experiment-opaque_123?from=list#status');
  });

  it('keeps Japanese and English translation keys in parity', () => {
    expect(flattenTranslationKeys(jaTranslation).sort()).toEqual(flattenTranslationKeys(enTranslation).sort());
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  detectPreferredLocale,
  localeFromAcceptLanguage,
  localeFromCookieHeader,
  localeFromPathname,
  prefixPath,
  setPreferredLocale,
  stripLocaleFromPathname,
  switchLocalePath,
} from '../localeRouting';
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

  it('parses saved locale cookies and weighted browser languages', () => {
    expect(localeFromCookieHeader('theme=dark; circleheart.locale=en'))
      .toBe('en');
    expect(localeFromCookieHeader('circleheart.locale=fr')).toBeUndefined();
    expect(localeFromAcceptLanguage('fr-FR, en-US;q=0.7, ja-JP;q=0.9'))
      .toBe('ja');
    expect(localeFromAcceptLanguage('ja;q=0, en;q=0.5')).toBe('en');
    expect(localeFromAcceptLanguage('fr, *;q=0.8')).toBeUndefined();
  });

  it('uses and persists one browser locale across storage and cookies', () => {
    const storage = new Map<string, string>();
    let cookie = 'circleheart.locale=en';
    const documentLike = {} as { cookie: string };
    Object.defineProperty(documentLike, 'cookie', {
      configurable: true,
      get: () => cookie,
      set: (value: string) => { cookie = value; },
    });
    vi.stubGlobal('document', documentLike);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, value); },
      },
      location: { protocol: 'https:' },
      navigator: { language: 'ja-JP', languages: ['ja-JP'] },
    });

    try {
      expect(detectPreferredLocale()).toBe('en');
      setPreferredLocale('ja');
      expect(storage.get('circleheart.locale')).toBe('ja');
      expect(cookie).toBe(
        'circleheart.locale=ja; Path=/; Max-Age=31536000; SameSite=Lax; Secure',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps Japanese and English translation keys in parity', () => {
    expect(flattenTranslationKeys(jaTranslation).sort()).toEqual(flattenTranslationKeys(enTranslation).sort());
  });
});

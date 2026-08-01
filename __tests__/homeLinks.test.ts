import { describe, expect, it } from 'vitest';
import {
  articlesHref,
  homeHref,
  workbenchHref,
} from '../homeLinks';

describe('homeLinks', () => {
  it('builds static home and workbench hrefs', () => {
    expect(workbenchHref()).toBe('/ja/workbench');
    expect(articlesHref()).toBe('/ja/articles');
    expect(homeHref()).toBe('/ja');
  });

  it('always prefixes localized hrefs', () => {
    expect(workbenchHref('en')).toBe('/en/workbench');
    expect(articlesHref('en')).toBe('/en/articles');
    expect(homeHref('en')).toBe('/en');
    expect(workbenchHref('ja')).toBe('/ja/workbench');
  });
});

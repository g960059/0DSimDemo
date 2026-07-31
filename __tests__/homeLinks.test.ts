import { describe, expect, it } from 'vitest';
import {
  homeHref,
  workbenchHref,
} from '../homeLinks';

describe('homeLinks', () => {
  it('builds static home and workbench hrefs', () => {
    expect(workbenchHref()).toBe('/ja/workbench');
    expect(homeHref()).toBe('/ja');
  });

  it('always prefixes localized hrefs', () => {
    expect(workbenchHref('en')).toBe('/en/workbench');
    expect(homeHref('en')).toBe('/en');
    expect(workbenchHref('ja')).toBe('/ja/workbench');
  });
});

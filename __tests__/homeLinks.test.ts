import { describe, expect, it } from 'vitest';
import {
  allCasesHref,
  authorPreviewHref,
  caseHref,
  homeHref,
  readerPreviewHref,
  workbenchHref,
} from '../homeLinks';

describe('homeLinks', () => {
  it('builds encoded lesson hrefs', () => {
  });

  it('builds encoded case hrefs with cases source', () => {
    expect(caseHref('normal sinus')).toBe('/ja/workbench/normal%20sinus?from=cases');
    expect(caseHref('valve/lesions')).toBe('/ja/workbench/valve%2Flesions?from=cases');
  });

  it('builds static workbench and all-cases hrefs', () => {
    expect(workbenchHref()).toBe('/ja/workbench');
    expect(allCasesHref()).toBe('/ja/cases');
    expect(authorPreviewHref()).toBe('/ja/studio/author');
    expect(homeHref()).toBe('/ja');
  });

  it('builds session Reader Preview hrefs without trusting raw ids', () => {
    expect(readerPreviewHref('preview 1')).toBe('/ja/studio/preview/preview%201');
    expect(readerPreviewHref('preview/a', 'en')).toBe('/en/studio/preview/preview%2Fa');
  });

  it('always prefixes localized hrefs', () => {
    expect(caseHref('normal sinus', 'en')).toBe('/en/workbench/normal%20sinus?from=cases');
    expect(workbenchHref('en')).toBe('/en/workbench');
    expect(allCasesHref('en')).toBe('/en/cases');
    expect(authorPreviewHref('en')).toBe('/en/studio/author');
    expect(homeHref('en')).toBe('/en');

    expect(caseHref('normal sinus', 'ja')).toBe('/ja/workbench/normal%20sinus?from=cases');
  });
});

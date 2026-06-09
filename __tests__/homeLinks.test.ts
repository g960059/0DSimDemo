import { describe, expect, it } from 'vitest';
import { allCasesHref, caseHref, homeHref, lessonHref, workbenchHref } from '../homeLinks';

describe('homeLinks', () => {
  it('builds encoded lesson hrefs', () => {
    expect(lessonHref('normal reference')).toBe('/ja/lesson/normal%20reference');
    expect(lessonHref('a/b')).toBe('/ja/lesson/a%2Fb');
  });

  it('builds encoded case hrefs with cases source', () => {
    expect(caseHref('normal sinus')).toBe('/ja/workbench/normal%20sinus?from=cases');
    expect(caseHref('valve/lesions')).toBe('/ja/workbench/valve%2Flesions?from=cases');
  });

  it('builds static workbench and all-cases hrefs', () => {
    expect(workbenchHref()).toBe('/ja/workbench');
    expect(allCasesHref()).toBe('/ja/cases');
    expect(homeHref()).toBe('/ja');
  });

  it('always prefixes localized hrefs', () => {
    expect(lessonHref('normal reference', 'en')).toBe('/en/lesson/normal%20reference');
    expect(caseHref('normal sinus', 'en')).toBe('/en/workbench/normal%20sinus?from=cases');
    expect(workbenchHref('en')).toBe('/en/workbench');
    expect(allCasesHref('en')).toBe('/en/cases');
    expect(homeHref('en')).toBe('/en');

    expect(lessonHref('normal reference', 'ja')).toBe('/ja/lesson/normal%20reference');
    expect(caseHref('normal sinus', 'ja')).toBe('/ja/workbench/normal%20sinus?from=cases');
  });
});

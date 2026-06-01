import { describe, expect, it } from 'vitest';
import { allCasesHref, caseHref, lessonHref, workbenchHref } from '../homeLinks';

describe('homeLinks', () => {
  it('builds encoded lesson hrefs', () => {
    expect(lessonHref('normal reference')).toBe('/lesson/normal%20reference');
    expect(lessonHref('a/b')).toBe('/lesson/a%2Fb');
  });

  it('builds encoded case hrefs with cases source', () => {
    expect(caseHref('normal sinus')).toBe('/workbench?case=normal%20sinus&from=cases');
    expect(caseHref('valve/lesions')).toBe('/workbench?case=valve%2Flesions&from=cases');
  });

  it('builds static workbench and all-cases hrefs', () => {
    expect(workbenchHref()).toBe('/workbench');
    expect(allCasesHref()).toBe('/cases');
  });
});

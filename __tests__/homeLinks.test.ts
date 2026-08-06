import { describe, expect, it } from 'vitest';
import {
  articlesHref,
  homeHref,
  workbenchDetailHref,
  workbenchHref,
} from '../homeLinks';
import {
  allocateOpaqueWorkbenchIdV3,
  classifyWorkbenchAvailabilityV3,
  createOpaqueWorkbenchIdV3,
  isOpaqueWorkbenchIdV3,
} from '@/studio/infrastructure/browser/StudioWorkbenchIdentityV3';

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

  it('builds a URL-safe Workbench detail route without deriving identity from a model', () => {
    expect(workbenchDetailHref({
      locale: 'en',
      workbenchId: 'workbench-opaque_identity',
    })).toBe('/en/workbench/workbench-opaque_identity');
    expect(() => workbenchDetailHref({
      locale: 'ja',
      workbenchId: 'model/exact-release',
    })).toThrow(/URL-safe opaque identity/);
  });

  it('allocates URL-safe opaque identities and retries collisions', () => {
    const tokens = ['collision_token', 'unique_token_123'];
    const tokenFactory = () => tokens.shift()!;
    const allocated = allocateOpaqueWorkbenchIdV3(
      ['workbench-collision_token'],
      tokenFactory,
    );

    expect(allocated).toBe('workbench-unique_token_123');
    expect(isOpaqueWorkbenchIdV3(allocated)).toBe(true);
    expect(isOpaqueWorkbenchIdV3('model/exact-release')).toBe(false);
    expect(createOpaqueWorkbenchIdV3(() => 'opaque_token_123'))
      .toBe('workbench-opaque_token_123');
  });

  it('never treats the current default as a fallback for another exact model', () => {
    expect(classifyWorkbenchAvailabilityV3('model/exact-a', 'model/exact-a'))
      .toBe('available');
    expect(classifyWorkbenchAvailabilityV3('model/exact-a', 'model/exact-b'))
      .toBe('unavailable-model');
  });
});

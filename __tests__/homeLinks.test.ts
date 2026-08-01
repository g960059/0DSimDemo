import { describe, expect, it } from 'vitest';
import {
  articlesHref,
  articleEditorHref,
  articlePlacementHref,
  articleReaderHref,
  experimentDetailHref,
  experimentsHref,
  experimentSnapshotHref,
  homeHref,
  newArticleEditorHref,
} from '../homeLinks';
import {
  allocateOpaqueWorkbenchIdV3,
  classifyWorkbenchAvailabilityV3,
  createOpaqueWorkbenchIdV3,
  isOpaqueWorkbenchIdV3,
} from '@/studio/infrastructure/browser/StudioWorkbenchIdentityV3';

describe('homeLinks', () => {
  it('builds static home and workbench hrefs', () => {
    expect(experimentsHref()).toBe('/ja/experiments');
    expect(articlesHref()).toBe('/ja/articles');
    expect(homeHref()).toBe('/ja');
  });

  it('always prefixes localized hrefs', () => {
    expect(experimentsHref('en')).toBe('/en/experiments');
    expect(articlesHref('en')).toBe('/en/articles');
    expect(homeHref('en')).toBe('/en');
    expect(experimentsHref('ja')).toBe('/ja/experiments');
  });

  it('builds a URL-safe Experiment detail route without deriving identity from a model', () => {
    expect(experimentDetailHref({
      experimentId: 'workbench-opaque_identity',
      locale: 'en',
    })).toBe('/en/experiments/workbench-opaque_identity');
    expect(() => experimentDetailHref({
      experimentId: 'model/exact-release',
      locale: 'ja',
    })).toThrow(/URL-safe opaque identity/);
  });

  it('separates the Article library, Reader, and Editor URLs', () => {
    expect(newArticleEditorHref('ja')).toBe('/ja/articles/new/edit');
    expect(articleReaderHref({ articleId: 'article-opaque', locale: 'en' }))
      .toBe('/en/articles/article-opaque');
    expect(articleEditorHref({ articleId: 'article-opaque', locale: 'en' }))
      .toBe('/en/articles/article-opaque/edit');
    expect(articlePlacementHref({
      articleId: 'article-opaque',
      locale: 'en',
      placementId: 'placement/local-one',
    })).toBe('/en/articles/article-opaque#placement-placement%2Flocal-one');
    expect(experimentSnapshotHref({
      experimentId: 'workbench-opaque_identity',
      snapshotId: 'snapshot/exact-one',
      locale: 'ja',
    })).toBe('/ja/experiments/workbench-opaque_identity/snapshots/snapshot%2Fexact-one');
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

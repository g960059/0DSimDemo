import { describe, expect, it } from 'vitest';
import {
  accountSettingsHref,
  articlesHref,
  articleEditorHref,
  articlePlacementHref,
  articleReaderHref,
  experimentDetailHref,
  experimentsHref,
  experimentSnapshotHref,
  homeHref,
  loginHref,
  myArticlesHref,
  myExperimentsHref,
  newArticleEditorHref,
  newExperimentHref,
} from '../homeLinks';
import {
  allocateOpaqueExperimentIdV3,
  classifyExperimentAvailabilityV3,
  createOpaqueExperimentIdV3,
  isOpaqueExperimentIdV3,
} from '@/studio/infrastructure/browser/StudioExperimentIdentityV3';

describe('homeLinks', () => {
  it('builds static home and workbench hrefs', () => {
    expect(experimentsHref()).toBe('/ja/experiments');
    expect(articlesHref()).toBe('/ja/articles');
    expect(homeHref()).toBe('/ja');
    expect(newExperimentHref()).toBe('/ja/experiments/new');
    expect(myExperimentsHref()).toBe('/ja/me/experiments');
    expect(myArticlesHref()).toBe('/ja/me/articles');
    expect(accountSettingsHref()).toBe('/ja/me/settings');
    expect(loginHref()).toBe('/ja/login');
  });

  it('always prefixes localized hrefs', () => {
    expect(experimentsHref('en')).toBe('/en/experiments');
    expect(articlesHref('en')).toBe('/en/articles');
    expect(homeHref('en')).toBe('/en');
    expect(experimentsHref('ja')).toBe('/ja/experiments');
    expect(myExperimentsHref('en')).toBe('/en/me/experiments');
    expect(myArticlesHref('en')).toBe('/en/me/articles');
  });

  it('builds a URL-safe Experiment detail route without deriving identity from a model', () => {
    expect(experimentDetailHref({
      experimentId: 'experiment-opaque_identity',
      locale: 'en',
    })).toBe('/en/experiments/experiment-opaque_identity');
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
      snapshotId: 'snapshot/exact-one',
      locale: 'ja',
    })).toBe('/ja/snapshots/snapshot%2Fexact-one');
  });

  it('allocates URL-safe opaque identities and retries collisions', () => {
    const tokens = ['collision_token', 'unique_token_123'];
    const tokenFactory = () => tokens.shift()!;
    const allocated = allocateOpaqueExperimentIdV3(
      ['experiment-collision_token'],
      tokenFactory,
    );

    expect(allocated).toBe('experiment-unique_token_123');
    expect(isOpaqueExperimentIdV3(allocated)).toBe(true);
    expect(isOpaqueExperimentIdV3('model/exact-release')).toBe(false);
    expect(createOpaqueExperimentIdV3(() => 'opaque_token_123'))
      .toBe('experiment-opaque_token_123');
  });

  it('never treats the current default as a fallback for another exact model', () => {
    expect(classifyExperimentAvailabilityV3('model/exact-a', 'model/exact-a'))
      .toBe('available');
    expect(classifyExperimentAvailabilityV3('model/exact-a', 'model/exact-b'))
      .toBe('unavailable-model');
  });
});

import { describe, expect, it } from 'vitest';
import {
  accountSettingsHref,
  articlesHref,
  articleEditorHref,
  articlePlacementHref,
  articleReaderHref,
  devDashboardHref,
  experimentDetailHref,
  experimentsHref,
  experimentSnapshotHref,
  homeHref,
  loginHref,
  modelLabHref,
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
  resolveExperimentAvailabilityV3,
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
    expect(devDashboardHref()).toBe('/ja/dev');
    expect(modelLabHref()).toBe('/ja/dev/model-lab');
  });

  it('always prefixes localized hrefs', () => {
    expect(experimentsHref('en')).toBe('/en/experiments');
    expect(articlesHref('en')).toBe('/en/articles');
    expect(homeHref('en')).toBe('/en');
    expect(experimentsHref('ja')).toBe('/ja/experiments');
    expect(myExperimentsHref('en')).toBe('/en/me/experiments');
    expect(myArticlesHref('en')).toBe('/en/me/articles');
    expect(devDashboardHref('en')).toBe('/en/dev');
    expect(modelLabHref('en')).toBe('/en/dev/model-lab');
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
    expect(isOpaqueExperimentIdV3("d9428888-122b-4a51-85c4-5dc04b6f0708"))
      .toBe(true);
    expect(isOpaqueExperimentIdV3('model/exact-release')).toBe(false);
    expect(createOpaqueExperimentIdV3(() => 'opaque_token_123'))
      .toBe('experiment-opaque_token_123');
  });

  it('never treats the active model as a fallback for another exact model', () => {
    expect(classifyExperimentAvailabilityV3(
      'model/exact-a',
      'model/exact-a',
      true,
    )).toBe('active-model');
    expect(classifyExperimentAvailabilityV3(
      'model/exact-a',
      'model/exact-b',
      true,
    )).toBe('exact-loadable');
    expect(classifyExperimentAvailabilityV3(
      'model/exact-a',
      'model/exact-b',
      false,
    ))
      .toBe('unavailable-model');
  });

  it('distinguishes a loadable historical model from an unavailable one', async () => {
    const requested: string[] = [];
    const availability = await resolveExperimentAvailabilityV3({
      savedExperiments: [
        { experimentId: 'experiment/current', modelId: 'model/current' },
        {
          experimentId: 'experiment/historical-a',
          modelId: 'model/historical',
          surfaceSeriesId: 'surface/historical',
        },
        { experimentId: 'experiment/missing', modelId: 'model/missing' },
        {
          experimentId: 'experiment/historical-b',
          modelId: 'model/historical',
          surfaceSeriesId: 'surface/historical',
        },
      ],
      activeModelId: 'model/current',
      async resolveExperiment(modelId, surfaceSeriesId) {
        requested.push(`${modelId}:${surfaceSeriesId ?? ''}`);
        if (modelId === 'model/missing') throw new Error('not loadable');
      },
    });

    expect([...availability]).toEqual([
      ['experiment/current', 'active-model'],
      ['experiment/historical-a', 'exact-loadable'],
      ['experiment/missing', 'unavailable-model'],
      ['experiment/historical-b', 'exact-loadable'],
    ]);
    expect(requested).toEqual([
      'model/historical:surface/historical',
      'model/missing:',
    ]);
  });
});

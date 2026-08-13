import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import {
  publicArticleExcerptV3,
} from "@/components/site/PublicCatalogPresentationV3";
import { StudioBrowserContentStoreV3 } from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  StudioBrowserExperimentIndexV3,
  STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
  type StudioBrowserExperimentRecordV3,
} from "@/studio/infrastructure/browser/StudioBrowserExperimentIndexV3";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

export type PublicExperimentCatalogItemV3 = Readonly<{
  record: StudioBrowserExperimentRecordV3;
  snapshotId: string;
  modelId: string;
  scenarioCount: number;
}>;

export type PublicArticleCatalogItemV3 = Readonly<{
  articleId: string;
  locale: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
}>;

export type PublicCatalogV3 = Readonly<{
  articles: readonly PublicArticleCatalogItemV3[];
  experiments: readonly PublicExperimentCatalogItemV3[];
}>;

export function publicArticlesForLocaleV3(
  articles: readonly PublicArticleCatalogItemV3[],
  locale: string,
): readonly PublicArticleCatalogItemV3[] {
  return Object.freeze(articles.filter((article) => article.locale === locale));
}

type PublicCatalogContentPortV3 = Pick<
  StudioBrowserContentStoreV3,
  "listArticles" | "listSnapshots"
>;

type PublicCatalogExperimentIndexPortV3 = Pick<
  StudioBrowserExperimentIndexV3,
  "list"
>;

/**
 * Read-only public projection of the pre-release browser repositories.
 * Backend catalog adoption replaces this adapter, not the Home/List UI.
 */
export function readPublicCatalogV3(
  store: PublicCatalogContentPortV3 = new StudioBrowserContentStoreV3(),
  experimentIndex: PublicCatalogExperimentIndexPortV3 =
    new StudioBrowserExperimentIndexV3(),
): PublicCatalogV3 {
  const snapshotById = new Map(store.listSnapshots().map((snapshot) => [
    snapshot.snapshotId,
    snapshot,
  ]));
  const articles = Object.freeze(
    store.listArticles()
      .filter(({ visibility }) => visibility === "public")
      .map((article) => localPublicArticleSummaryV3(article))
      .sort((left, right) => left.title.localeCompare(right.title)),
  );
  const experiments = Object.freeze(
    experimentIndex.list()
      .flatMap((record) => {
        if (record.publishedSnapshotId === null) return [];
        const snapshot = snapshotById.get(record.publishedSnapshotId);
        if (snapshot === undefined) return [];
        return [Object.freeze({
          record,
          snapshotId: snapshot.snapshotId,
          modelId: snapshot.content.modelId,
          scenarioCount: snapshot.content.scenarios.length,
        })];
      })
      .sort((left, right) =>
        right.record.updatedAt.localeCompare(left.record.updatedAt)),
  );
  return Object.freeze({ articles, experiments });
}

/** Configured clients read the server publication pointers exclusively. */
export async function readPublicCatalogAsyncV3(): Promise<PublicCatalogV3> {
  const remote = createStudioSupabaseContentRepositoryV1();
  if (remote === null) return readPublicCatalogV3();
  const [articlePage, experimentPage] = await Promise.all([
    remote.listPublicArticles(),
    remote.listPublicExperiments(),
  ]);
  return Object.freeze({
    articles: articlePage.items,
    experiments: Object.freeze(experimentPage.items.map((resource) => Object.freeze({
      record: Object.freeze({
        schemaId: STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
        experimentId: resource.experimentId,
        title: resource.title,
        createdAt: resource.publishedAt,
        updatedAt: resource.publishedAt,
        publishedSnapshotId: resource.snapshotId,
      }),
      snapshotId: resource.snapshotId,
      modelId: resource.modelId,
      scenarioCount: resource.scenarioCount,
    }))),
  });
}

function localPublicArticleSummaryV3(
  article: StudioArticleDraftV2,
): PublicArticleCatalogItemV3 {
  return Object.freeze({
    articleId: article.articleId,
    locale: article.locale,
    title: article.title,
    excerpt: publicArticleExcerptV3(article.blocks),
    // Browser fallback has no publication clock; keep its immutable content
    // usable without manufacturing backend provenance.
    publishedAt: new Date(0).toISOString(),
  });
}

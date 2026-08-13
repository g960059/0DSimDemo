import { describe, expect, it } from "vitest";

import {
  publicArticlesForLocaleV3,
  readPublicCatalogV3,
} from "@/components/site/PublicCatalogV3";
import {
  publicArticleExcerptV3,
} from "@/components/site/PublicCatalogPresentationV3";
import type {
  StudioArticleBlockV2,
  StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import type { ExperimentSnapshotV2 } from "@/studio/contracts/v2/content";
import type { StudioBrowserExperimentRecordV3 } from "@/studio/infrastructure/browser/StudioBrowserExperimentIndexV3";

describe("public catalog V3", () => {
  it("exposes public Articles and valid published Snapshot pointers only", () => {
    const publicArticle = {
      schemaId: "circleheart-studio-article-draft-v2",
      articleId: "article-public",
      draftVersion: 0,
      locale: "en",
      title: "Public",
      visibility: "public",
      blocks: [],
    } as StudioArticleDraftV2;
    const draftArticle = {
      schemaId: "circleheart-studio-article-draft-v2",
      articleId: "article-draft",
      draftVersion: 0,
      locale: "en",
      title: "Draft",
      visibility: "draft",
      blocks: [],
    } as StudioArticleDraftV2;
    const publication = {
      snapshotId: "snapshot-publication",
      content: {
        modelId: "model/test",
        scenarios: [{ scenarioId: "scenario/test" }],
      },
    } as unknown as ExperimentSnapshotV2;
    const records = [
      experimentRecord("experiment-public", publication.snapshotId),
      experimentRecord("experiment-draft", null),
      experimentRecord("experiment-missing-snapshot", "snapshot/missing"),
    ];

    const catalog = readPublicCatalogV3(
      {
        listArticles: () => [draftArticle, publicArticle],
        listSnapshots: () => [publication],
      },
      { list: () => records },
    );

    expect(catalog.articles.map(({ articleId }) => articleId)).toEqual([
      "article-public",
    ]);
    expect(catalog.experiments.map(({ record }) => record.experimentId))
      .toEqual(["experiment-public"]);
  });

  it("uses authored prose for previews instead of storage identity", () => {
    const blocks: readonly StudioArticleBlockV2[] = [
      { blockId: "heading/internal", kind: "heading", level: 2, text: "Heading" },
      {
        blockId: "experiment/internal",
        kind: "experiment",
        placement: {} as never,
      },
      { blockId: "paragraph/internal", kind: "paragraph", text: "  Useful summary.  " },
    ];

    expect(publicArticleExcerptV3(blocks)).toBe("Useful summary.");
    expect(publicArticleExcerptV3(blocks.slice(0, 1))).toBe("Heading");
    expect(publicArticleExcerptV3(blocks.slice(1, 2))).toBeNull();
  });

  it("projects public Articles for the requested content locale", () => {
    const articles = [
      { articleId: "article-ja", locale: "ja" },
      { articleId: "article-en", locale: "en" },
      { articleId: "article-ja-two", locale: "ja" },
    ] as unknown as Parameters<typeof publicArticlesForLocaleV3>[0];

    expect(publicArticlesForLocaleV3(articles, "ja").map(({ articleId }) => articleId))
      .toEqual(["article-ja", "article-ja-two"]);
    expect(publicArticlesForLocaleV3(articles, "en").map(({ articleId }) => articleId))
      .toEqual(["article-en"]);
  });
});

function experimentRecord(
  experimentId: string,
  publishedSnapshotId: string | null,
): StudioBrowserExperimentRecordV3 {
  return {
    schemaId: "circleheart-studio-browser-experiment-record-v5",
    experimentId,
    title: experimentId,
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
    publishedSnapshotId,
  };
}

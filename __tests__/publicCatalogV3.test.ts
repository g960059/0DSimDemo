import { describe, expect, it } from "vitest";

import { readPublicCatalogV3 } from "@/components/site/PublicCatalogV3";
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
  it("exposes public Articles and valid publication pointers only", () => {
    const publicArticle = {
      articleId: "article-public",
      title: "Public",
      visibility: "public",
    } as StudioArticleDraftV2;
    const draftArticle = {
      articleId: "article-draft",
      title: "Draft",
      visibility: "draft",
    } as StudioArticleDraftV2;
    const publication = {
      snapshotId: "snapshot-publication",
      kind: "publication",
    } as ExperimentSnapshotV2;
    const articleSnapshot = {
      snapshotId: "snapshot-article",
      kind: "article",
    } as ExperimentSnapshotV2;
    const records = [
      experimentRecord("experiment-public", publication.snapshotId),
      experimentRecord("experiment-draft", null),
      experimentRecord("experiment-wrong-kind", articleSnapshot.snapshotId),
    ];

    const catalog = readPublicCatalogV3(
      {
        listArticles: () => [draftArticle, publicArticle],
        listSnapshots: () => [publication, articleSnapshot],
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

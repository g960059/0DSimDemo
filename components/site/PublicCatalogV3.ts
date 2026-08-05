import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import type { ExperimentSnapshotV2 } from "@/studio/contracts/v2/content";
import { StudioBrowserContentStoreV3 } from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  StudioBrowserExperimentIndexV3,
  type StudioBrowserExperimentRecordV3,
} from "@/studio/infrastructure/browser/StudioBrowserExperimentIndexV3";

export type PublicExperimentCatalogItemV3 = Readonly<{
  record: StudioBrowserExperimentRecordV3;
  snapshot: ExperimentSnapshotV2;
}>;

export type PublicCatalogV3 = Readonly<{
  articles: readonly StudioArticleDraftV2[];
  experiments: readonly PublicExperimentCatalogItemV3[];
}>;

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
      .sort((left, right) => left.title.localeCompare(right.title)),
  );
  const experiments = Object.freeze(
    experimentIndex.list()
      .flatMap((record) => {
        if (record.publishedSnapshotId === null) return [];
        const snapshot = snapshotById.get(record.publishedSnapshotId);
        if (snapshot === undefined || snapshot.kind !== "publication") return [];
        return [Object.freeze({ record, snapshot })];
      })
      .sort((left, right) =>
        right.record.updatedAt.localeCompare(left.record.updatedAt)),
  );
  return Object.freeze({ articles, experiments });
}

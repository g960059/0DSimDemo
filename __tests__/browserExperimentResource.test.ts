import { describe, expect, it } from "vitest";

import {
  STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
  StudioArticleExperimentAuthoringHandoffStoreV3,
} from "@/studio/infrastructure/browser/StudioArticleExperimentAuthoringHandoffV3";
import {
  BROWSER_EXPERIMENT_INDEX_KEY,
  BrowserExperimentIndex,
} from "@/studio/infrastructure/browser/BrowserExperimentIndex";

class MemoryStorageV3 {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("browser Experiment resource metadata", () => {
  it("retires the pre-cutover Workbench-prefixed metadata index", () => {
    const storage = new MemoryStorageV3();
    storage.setItem(
      "circleheart.studio.browser-experiment-index.v4",
      JSON.stringify({ schemaId: "legacy", experiments: [] }),
    );

    new BrowserExperimentIndex(storage);

    expect(storage.values.has(
      "circleheart.studio.browser-experiment-index.v4",
    )).toBe(false);
  });

  it("keeps title and publication pointer outside the numerical content store", () => {
    const storage = new MemoryStorageV3();
    const index = new BrowserExperimentIndex(storage);
    const experimentId = "experiment-resource-001";

    const created = index.ensure({
      experimentId,
      title: "Untitled experiment",
      nowIso: "2026-08-04T00:00:00.000Z",
    });
    expect(created.publishedSnapshotId).toBeNull();

    const renamed = index.rename({
      experimentId,
      title: "Severe AS comparison",
      nowIso: "2026-08-04T00:01:00.000Z",
    });
    expect(renamed.title).toBe("Severe AS comparison");
    expect(renamed.updatedAt).toBe("2026-08-04T00:01:00.000Z");

    const published = index.publish({
      experimentId,
      snapshotId: "snapshot/severe-as-v1",
      nowIso: "2026-08-04T00:02:00.000Z",
    });
    expect(published.publishedSnapshotId).toBe("snapshot/severe-as-v1");
    expect(index.read(experimentId)).toEqual(published);
    expect(storage.values.get(BROWSER_EXPERIMENT_INDEX_KEY))
      .not.toContain("fixture");

    expect(index.delete(experimentId)).toBe(true);
    expect(index.read(experimentId)).toBeNull();
    expect(index.delete(experimentId)).toBe(false);
  });

  it("does not overwrite existing metadata when an Experiment is rediscovered", () => {
    const index = new BrowserExperimentIndex(new MemoryStorageV3());
    const experimentId = "experiment-resource-002";
    const first = index.ensure({
      experimentId,
      title: "Authored title",
      nowIso: "2026-08-04T01:00:00.000Z",
    });
    const rediscovered = index.ensure({
      experimentId,
      title: "Scenario fallback",
      nowIso: "2026-08-04T02:00:00.000Z",
    });

    expect(rediscovered).toEqual(first);
    expect(rediscovered.title).toBe("Authored title");
  });
});

describe("Article → Experiment authoring handoff V3", () => {
  it("round-trips the insertion target and immutable Snapshot identity", () => {
    const storage = new MemoryStorageV3();
    const handoff = new StudioArticleExperimentAuthoringHandoffStoreV3(storage);
    const briefing = {
      defaultTitle: "Clinical AS",
      scenarioScope: {
        visibleScenarioIds: ["scenario/baseline"],
        initialFocusScenarioId: "scenario/baseline",
      },
      graphs: [],
      outputs: [],
      controls: [],
    } as const;

    const pending = handoff.begin({
      articleId: "article/clinical-as",
      sessionToken: "session-article-001",
      insertionIndex: 2,
      replacementBlockId: "block/empty",
      briefing,
    });
    expect(pending.snapshotId).toBeNull();

    expect(handoff.complete({
      sessionToken: "session-other-001",
      snapshotId: "snapshot/wrong",
      briefing,
    })).toBeNull();

    const completed = handoff.complete({
      sessionToken: pending.sessionToken,
      snapshotId: "snapshot/clinical-as-v1",
      briefing,
    });
    expect(completed?.snapshotId).toBe("snapshot/clinical-as-v1");
    // Completion remains recoverable until the Article persistence boundary
    // explicitly clears it.
    expect(handoff.read()).toEqual(completed);
    handoff.clear();
    expect(handoff.read()).toBeNull();
  });

  it("clears malformed session transport instead of carrying ambiguous context", () => {
    const storage = new MemoryStorageV3();
    storage.setItem(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
      JSON.stringify({ articleId: "article/incomplete" }),
    );
    const handoff = new StudioArticleExperimentAuthoringHandoffStoreV3(storage);

    expect(handoff.read()).toBeNull();
    expect(storage.values.has(
      STUDIO_ARTICLE_EXPERIMENT_AUTHORING_HANDOFF_V3_KEY,
    )).toBe(false);
  });
});

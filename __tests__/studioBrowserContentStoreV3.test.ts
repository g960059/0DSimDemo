import { describe, expect, it } from "vitest";

import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
  type ArticleExperimentSnapshotV2,
  type ExperimentPlacementBriefingV2,
  type ExperimentSnapshotV2,
  type ExperimentV2,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_BROWSER_CONTENT_STORE_V3_KEY,
  STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID,
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import type { StudioSimulationFrameV2 } from "@/studio/contracts/v2/simulation";
import {
  createStudioSimulationWorkerClientForTestV2,
  type StudioSimulationWorkerQualifiedSnapshotCommitV2,
  type StudioSimulationWorkerTransportV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

class MemoryStorageV3 {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

class QualifyingWorkerTransportV3 implements StudioSimulationWorkerTransportV2 {
  readonly #messageListeners = new Set<(event: MessageEvent<unknown>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();
  postMessage(): void {}
  terminate(): void {}
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void) | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.add(listener as (event: MessageEvent<unknown>) => void);
    } else {
      this.#errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }
  removeEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  removeEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  removeEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void) | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.delete(listener as (event: MessageEvent<unknown>) => void);
    } else {
      this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }
  emit(data: unknown): void {
    this.#messageListeners.forEach((listener) => listener({ data } as MessageEvent<unknown>));
  }
}

function experimentV3(input: Readonly<{
  experimentId?: string;
  version?: number;
  modelId?: string;
}> = {}): ExperimentV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
    experimentId: input.experimentId ?? "experiment-browser-store-a1b2c3d4",
    version: input.version ?? 0,
    content: {
      modelId: input.modelId ?? "model/exact-v3",
      scenarios: [{
        scenarioId: "scenario/baseline",
        label: "Baseline",
        capture: {
          fixture: { control: 1 },
          checkpoint: {
            acceptedRevision: 4,
            acceptedTimeSec: 0.008,
            payload: { state: [1, 2, 3] },
          },
        },
      }],
      surface: {
        graphPanes: [{
          paneId: "pane/waveform",
          role: "graph",
          label: "Waveform",
          order: 0,
          priority: 10,
          graphId: "graph/waveform",
          scenarioScope: { mode: "visible-scenarios" },
          excludedTraces: [],
          windowSec: 2,
          series: [],
        }],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
      },
    },
  };
}

function briefingV3(): ExperimentPlacementBriefingV2 {
  return {
    defaultTitle: "Stored experiment",
    scenarioScope: {
      visibleScenarioIds: ["scenario/baseline"],
      initialFocusScenarioId: "scenario/baseline",
    },
    graphs: [{
      paneId: "pane/waveform",
      order: 0,
      emphasis: "primary",
    }],
    outputs: [],
    controls: [],
  };
}

function snapshotV3(
  experiment: ExperimentV2,
  input: Readonly<{
    snapshotId?: string;
    kind?: "publication" | "article";
  }> = {},
): ExperimentSnapshotV2 {
  const base = {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: input.snapshotId ?? "snapshot/browser-store-1",
    content: experiment.content,
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  return input.kind === "article"
    ? { ...base, kind: "article", briefing: briefingV3() }
    : { ...base, kind: "publication" };
}

async function qualifiedCommitV3(
  experiment: ExperimentV2,
  input: Readonly<{
    snapshotId?: string;
    kind?: "publication" | "article";
  }> = {},
): Promise<StudioSimulationWorkerQualifiedSnapshotCommitV2> {
  const transport = new QualifyingWorkerTransportV3();
  const client = createStudioSimulationWorkerClientForTestV2({ transport });
  const scenario = experiment.content.scenarios[0]!;
  const initialized = client.initialize({
    expectedModelId: experiment.content.modelId,
    runtimeSessionId: "runtime/browser-store-test",
    scenarioId: scenario.scenarioId,
    scenarioLabel: scenario.label,
    fixture: scenario.capture.fixture,
    checkpoint: scenario.capture.checkpoint,
  });
  const frame: StudioSimulationFrameV2 = {
    modelId: experiment.content.modelId,
    runtimeSessionId: "runtime/browser-store-test",
    scenarioId: scenario.scenarioId,
    inputEpoch: 0,
    acceptedRevision: scenario.capture.checkpoint.acceptedRevision,
    acceptedTimeSec: scenario.capture.checkpoint.acceptedTimeSec,
    outputs: {},
  };
  transport.emit({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId: 1,
    status: "ok",
    kind: "initialized",
    frame,
  });
  await initialized;

  const kind = input.kind ?? "publication";
  const pending = kind === "article"
    ? client.createSnapshot({
        runtimeSessionId: frame.runtimeSessionId,
        scenarioId: frame.scenarioId,
        surface: experiment.content.surface,
        snapshotKind: "article",
        briefing: briefingV3(),
      })
    : client.createSnapshot({
        runtimeSessionId: frame.runtimeSessionId,
        scenarioId: frame.scenarioId,
        surface: experiment.content.surface,
        snapshotKind: "publication",
      });
  transport.emit({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId: 2,
    status: "ok",
    kind: "snapshot-created",
    snapshot: snapshotV3(experiment, {
      snapshotId: input.snapshotId,
      kind,
    }),
  });
  return pending;
}

function articleV3(
  snapshot: ArticleExperimentSnapshotV2,
  input: Readonly<{ version?: number; placementId?: string }> = {},
): StudioArticleDraftV2 {
  return {
    schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
    articleId: "article/browser-store",
    draftVersion: input.version ?? 0,
    visibility: "draft",
    locale: "ja",
    title: "Article",
    blocks: [{
      blockId: "block/experiment",
      kind: "experiment",
      placement: {
        schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
        placementId: input.placementId ?? "placement/browser-store",
        snapshotId: snapshot.snapshotId,
        titleOverride: null,
        caption: null,
      },
    }],
  };
}

describe("Studio browser content store V3", () => {
  it("deletes every retired pre-release envelope instead of migrating it", () => {
    const storage = new MemoryStorageV3();
    [
      "circleheart.studio.browser-content.v2",
      "circleheart.studio.browser-content.v3",
      "circleheart.studio.browser-content.v3.binding-v1",
      "circleheart.studio.browser-content.v4",
      "circleheart.studio.browser-content.v5",
      "circleheart.studio.browser-content.v6",
      "circleheart.studio.browser-content.v7",
    ].forEach((key) => storage.setItem(key, "legacy"));

    const store = new StudioBrowserContentStoreV3(storage);

    expect(store.listExperiments()).toEqual([]);
    expect([...storage.values.keys()]).toEqual([]);
  });

  it("creates only explicitly saved Experiments and advances version by one", () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    expect(store.listExperiments()).toEqual([]);

    const initial = experimentV3();
    const first = store.saveExperiment(initial, initial.content);
    const replacement = {
      ...first,
      version: 1,
      content: {
        ...first.content,
        surface: { ...first.content.surface, note: { text: "saved" } },
      },
    };
    const second = store.saveExperiment(replacement, replacement.content);

    expect(second.version).toBe(1);
    expect(store.readExperiment(first.experimentId)?.content.surface.note.text)
      .toBe("saved");
    expect(Object.isFrozen(second)).toBe(true);
  });

  it("rechecks a Worker Save against the submitted authored candidate", () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const candidate = experimentV3();
    const changedByWorker = {
      ...candidate,
      content: {
        ...candidate.content,
        scenarios: candidate.content.scenarios.map((scenario) => ({
          ...scenario,
          label: `${scenario.label} changed by worker`,
        })),
      },
    } satisfies ExperimentV2;

    expect(() => store.saveExperiment(
      changedByWorker,
      candidate.content,
    )).toThrow(/Saved Experiment changed authored Scenario/);
    expect(store.listExperiments()).toEqual([]);
  });

  it("rejects generic IDs, skipped initial versions, stale writes, and model swaps", () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const generic = experimentV3({ experimentId: "experiment/generic" });
    expect(() => store.saveExperiment(generic, generic.content))
      .toThrow(/opaque Experiment identity/);
    const skipped = experimentV3({ version: 1 });
    expect(() => store.saveExperiment(skipped, skipped.content))
      .toThrow(/start at version 0/);

    const initial = experimentV3();
    const current = store.saveExperiment(initial, initial.content);
    const skippedAdvance = { ...current, version: 2 };
    expect(() => store.saveExperiment(skippedAdvance, skippedAdvance.content))
      .toThrow(/advance by exactly one/);
    const modelSwap = {
      ...current,
      version: 1,
      content: { ...current.content, modelId: "model/other" },
    };
    expect(() => store.saveExperiment(modelSwap, modelSwap.content))
      .toThrow(/cannot change modelId/);
  });

  it("persists a qualified Article Snapshot without creating an Experiment", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const sessionContent = experimentV3();
    const commit = await qualifiedCommitV3(sessionContent, { kind: "article" });

    const saved = store.saveSnapshotCommit(commit, sessionContent.content);

    expect(saved.snapshot.kind).toBe("article");
    expect(store.listExperiments()).toEqual([]);
    expect(store.listSnapshots()).toHaveLength(1);
  });

  it("requires a version-matched saved Experiment for Publication", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const sessionContent = experimentV3();
    const commit = await qualifiedCommitV3(sessionContent);

    expect(() => store.saveSnapshotCommit(commit, sessionContent.content))
      .toThrow(/requires a saved Experiment source/);
    const savedExperiment = store.saveExperiment(
      sessionContent,
      sessionContent.content,
    );
    expect(() => store.saveSnapshotCommit(
      commit,
      sessionContent.content,
      {
        experimentId: savedExperiment.experimentId,
        expectedVersion: savedExperiment.version + 1,
      },
    )).toThrow(/expected version/);
    expect(store.saveSnapshotCommit(
      commit,
      sessionContent.content,
      {
        experimentId: savedExperiment.experimentId,
        expectedVersion: savedExperiment.version,
      },
    ).snapshot.kind).toBe("publication");
  });

  it("rechecks worker-qualified labels and fixtures against the frozen candidate", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const candidate = experimentV3();
    const changed = {
      ...candidate,
      content: {
        ...candidate.content,
        scenarios: candidate.content.scenarios.map((scenario) => ({
          ...scenario,
          label: `${scenario.label} changed by worker`,
        })),
      },
    } satisfies ExperimentV2;
    const commit = await qualifiedCommitV3(changed);

    expect(() => store.saveSnapshotCommit(commit, candidate.content))
      .toThrow(/changed authored Scenario/);
    expect(store.listSnapshots()).toEqual([]);
  });

  it("never overwrites an immutable snapshotId", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const candidate = experimentV3();
    const experiment = store.saveExperiment(candidate, candidate.content);
    const source = {
      experimentId: experiment.experimentId,
      expectedVersion: experiment.version,
    };
    store.saveSnapshotCommit(
      await qualifiedCommitV3(experiment),
      experiment.content,
      source,
    );
    await expect(async () => store.saveSnapshotCommit(
      await qualifiedCommitV3(experiment),
      experiment.content,
      source,
    )).rejects.toThrow(/already exists/);
  });

  it("stores Briefing only inside an Article Snapshot and accepts a minimal Placement", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const experiment = experimentV3();
    const saved = store.saveSnapshotCommit(await qualifiedCommitV3(
      experiment,
      { kind: "article", snapshotId: "snapshot/article-1" },
    ), experiment.content).snapshot;
    expect(saved.kind).toBe("article");
    if (saved.kind !== "article") throw new Error("expected Article Snapshot");

    store.saveArticle(articleV3(saved));

    expect(store.readArticle("article/browser-store")?.blocks[0]).toEqual({
      blockId: "block/experiment",
      kind: "experiment",
      placement: {
        schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
        placementId: "placement/browser-store",
        snapshotId: "snapshot/article-1",
        titleOverride: null,
        caption: null,
      },
    });
    expect(saved.briefing).toEqual(briefingV3());
  });

  it("rejects Article placement of a Publication Snapshot", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const candidate = experimentV3();
    const experiment = store.saveExperiment(candidate, candidate.content);
    const publication = store.saveSnapshotCommit(
      await qualifiedCommitV3(experiment),
      experiment.content,
      {
        experimentId: experiment.experimentId,
        expectedVersion: experiment.version,
      },
    ).snapshot;
    const forgedArticle = articleV3({
      ...publication,
      kind: "article",
      briefing: briefingV3(),
    });

    expect(() => store.saveArticle({
      ...forgedArticle,
      blocks: forgedArticle.blocks.map((block) => block.kind === "experiment"
        ? {
            ...block,
            placement: {
              ...block.placement,
              snapshotId: publication.snapshotId,
            },
          }
        : block),
    })).toThrow(/must pin an article Snapshot/);
  });

  it("enforces Article compare-and-swap and rejects dangling Snapshot references", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const experiment = experimentV3();
    const saved = store.saveSnapshotCommit(await qualifiedCommitV3(
      experiment,
      { kind: "article", snapshotId: "snapshot/article-2" },
    ), experiment.content).snapshot;
    if (saved.kind !== "article") throw new Error("expected Article Snapshot");
    store.saveArticle(articleV3(saved));
    expect(() => store.saveArticle(articleV3(saved)))
      .toThrow(/advance by exactly one/);
    expect(() => store.saveArticle({
      ...articleV3(saved, { version: 1 }),
      blocks: [{
        ...articleV3(saved).blocks[0]!,
        placement: {
          ...(articleV3(saved).blocks[0]! as Extract<StudioArticleDraftV2["blocks"][number], { kind: "experiment" }>).placement,
          snapshotId: "snapshot/missing",
        },
      }],
    })).toThrow(/Snapshot not found/);
  });

  it("deletes an Experiment without cascading to immutable Snapshots or Articles", async () => {
    const store = new StudioBrowserContentStoreV3(new MemoryStorageV3());
    const candidate = experimentV3();
    const experiment = store.saveExperiment(candidate, candidate.content);
    const snapshot = store.saveSnapshotCommit(await qualifiedCommitV3(
      experiment,
      { kind: "article", snapshotId: "snapshot/retained" },
    ), experiment.content).snapshot;
    if (snapshot.kind !== "article") throw new Error("expected Article Snapshot");
    store.saveArticle(articleV3(snapshot));

    expect(store.deleteExperiment(experiment.experimentId)).toBe(true);
    expect(store.readExperiment(experiment.experimentId)).toBeNull();
    expect(store.readSnapshot(snapshot.snapshotId)).toEqual(snapshot);
    expect(store.readArticle("article/browser-store")).not.toBeNull();
  });

  it("fails closed when the single current envelope is corrupt", () => {
    const storage = new MemoryStorageV3();
    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V3_KEY, JSON.stringify({
      schemaId: STUDIO_BROWSER_CONTENT_STORE_V3_SCHEMA_ID,
      experiments: [],
      snapshots: [],
      articles: [],
      legacyWorkspace: {},
    }));
    const store = new StudioBrowserContentStoreV3(storage);

    expect(() => store.listSnapshots()).toThrow(/schema is invalid/);
  });
});

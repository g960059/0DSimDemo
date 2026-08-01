import { describe, expect, it } from "vitest";

import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  type ExperimentSnapshotV2,
  type ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_BROWSER_CONTENT_STORE_V2_KEY,
  StudioBrowserContentStoreV2,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV2";
import type { StudioSimulationFrameV2 } from "@/studio/contracts/v2/simulation";
import {
  createStudioSimulationWorkerClientForTestV2,
  type StudioSimulationWorkerQualifiedSnapshotCommitV2,
  type StudioSimulationWorkerTransportV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

class MemoryStorageV2 {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class QualifyingWorkerTransportV2 implements StudioSimulationWorkerTransportV2 {
  readonly messages: unknown[] = [];
  readonly #messageListeners = new Set<(event: MessageEvent<unknown>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();

  postMessage(message: unknown): void {
    this.messages.push(message);
  }
  terminate(): void {}
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }
  emitMessage(data: unknown): void {
    for (const listener of this.#messageListeners) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
}

function workspaceV2(input: Readonly<{
  experimentId?: string;
  draftVersion?: number;
  headSnapshotId?: string | null;
  basedOnSnapshotId?: string | null;
  modelId?: string;
}> = {}): ExperimentWorkspaceV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
    experimentId: input.experimentId ?? "experiment/browser-store",
    draftVersion: input.draftVersion ?? 0,
    headSnapshotId: input.headSnapshotId ?? null,
    basedOnSnapshotId: input.basedOnSnapshotId ?? null,
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
          colorHex: "#3ea8ff",
          order: 0,
          priority: 10,
          graphId: "graph/waveform",
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

function snapshotV2(input: Readonly<{
  snapshotId?: string;
  experimentId?: string;
  parentSnapshotId?: string | null;
  workspace?: ExperimentWorkspaceV2;
}> = {}): ExperimentSnapshotV2 {
  const workspace = input.workspace ?? workspaceV2({
    experimentId: input.experimentId,
  });
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: input.snapshotId ?? "snapshot/browser-store-1",
    experimentId: input.experimentId ?? workspace.experimentId,
    parentSnapshotId: input.parentSnapshotId ?? null,
    content: workspace.content,
    createdAt: "2026-08-01T00:00:00.000Z",
  };
}

async function qualifySnapshotCommitV2(
  current: ExperimentWorkspaceV2,
  snapshotId = "snapshot/browser-store-1",
): Promise<StudioSimulationWorkerQualifiedSnapshotCommitV2> {
  const transport = new QualifyingWorkerTransportV2();
    const client = createStudioSimulationWorkerClientForTestV2({ transport });
  const scenario = current.content.scenarios[0]!;
  const initialized = client.initialize({
    expectedModelId: current.content.modelId,
    runtimeSessionId: "runtime/browser-store-test",
    scenarioId: scenario.scenarioId,
    scenarioLabel: scenario.label,
    fixture: scenario.capture.fixture,
    checkpoint: scenario.capture.checkpoint,
    authoringSeed: { workspace: current },
  });
  const frame: StudioSimulationFrameV2 = {
    modelId: current.content.modelId,
    runtimeSessionId: "runtime/browser-store-test",
    scenarioId: scenario.scenarioId,
    inputEpoch: 0,
    acceptedRevision: scenario.capture.checkpoint.acceptedRevision,
    acceptedTimeSec: scenario.capture.checkpoint.acceptedTimeSec,
    outputs: {},
  };
  transport.emitMessage({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId: 1,
    status: "ok",
    kind: "initialized",
    frame,
  });
  await initialized;

  const pending = client.createSnapshot({
    runtimeSessionId: frame.runtimeSessionId,
    scenarioId: frame.scenarioId,
    experimentId: current.experimentId,
    expectedDraftVersion: current.draftVersion,
    expectedHeadSnapshotId: current.headSnapshotId,
  });
  const snapshot = snapshotV2({
    snapshotId,
    experimentId: current.experimentId,
    parentSnapshotId: current.basedOnSnapshotId,
    workspace: current,
  });
  const workspace = {
    ...current,
    draftVersion: current.draftVersion + 1,
    headSnapshotId: snapshot.snapshotId,
    basedOnSnapshotId: snapshot.snapshotId,
    content: snapshot.content,
  } satisfies ExperimentWorkspaceV2;
  transport.emitMessage({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId: 2,
    status: "ok",
    kind: "snapshot-created",
    snapshot,
    workspace,
  });
  return pending;
}

async function publishFirstSnapshotV2(
  store: StudioBrowserContentStoreV2,
): Promise<Readonly<{
  snapshot: ExperimentSnapshotV2;
  workspace: ExperimentWorkspaceV2;
  qualifiedCommit: StudioSimulationWorkerQualifiedSnapshotCommitV2;
}>> {
  const current = workspaceV2();
  store.saveWorkspace(current);
  const qualifiedCommit = await qualifySnapshotCommitV2(current);
  const persisted = store.saveSnapshotAndWorkspace(qualifiedCommit);
  return Object.freeze({ ...persisted, qualifiedCommit });
}

describe("Studio browser content store V2", () => {
  it("starts empty and owns a detached frozen Workspace on explicit save", () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    expect(store.listWorkspaces()).toEqual([]);

    const mutable = structuredClone(workspaceV2()) as ExperimentWorkspaceV2 & {
      content: { scenarios: Array<{ label: string }> };
    };
    const saved = store.saveWorkspace(mutable);
    mutable.content.scenarios[0]!.label = "Mutated outside";

    expect(store.readWorkspace(saved.experimentId)?.content.scenarios[0]?.label)
      .toBe("Baseline");
    expect(Object.isFrozen(saved)).toBe(true);
    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY))
      .toContain("circleheart-studio-browser-content-v2");
  });

  it("publishes only a sealed qualified Snapshot result atomically", async () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    const { snapshot, workspace } = await publishFirstSnapshotV2(store);

    expect({ snapshot, workspace }).toEqual({
      snapshot,
      workspace,
    });
    expect(store.readSnapshot(snapshot.snapshotId)?.snapshotId)
      .toBe(snapshot.snapshotId);
    expect(store.readWorkspace(workspace.experimentId)?.headSnapshotId)
      .toBe(snapshot.snapshotId);

    const before = storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);
    const structuralClone = {
      snapshot,
      workspace,
    } as unknown as StudioSimulationWorkerQualifiedSnapshotCommitV2;
    expect(() => store.saveSnapshotAndWorkspace(structuralClone))
      .toThrow(/requires a sealed qualified Worker result/);
    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY)).toBe(before);
  });

  it("enforces Workspace compare-and-swap version and lineage", () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    store.saveWorkspace(workspaceV2());
    const before = storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);

    expect(() => store.saveWorkspace(workspaceV2({ draftVersion: 0 })))
      .toThrow(/draftVersion must advance by exactly one/);
    expect(() => store.saveWorkspace(workspaceV2({ draftVersion: 2 })))
      .toThrow(/draftVersion must advance by exactly one/);
    expect(() => store.saveWorkspace(workspaceV2({
      draftVersion: 1,
      headSnapshotId: "snapshot/forged-head",
    }))).toThrow(/cannot change Snapshot lineage/);

    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY)).toBe(before);
    expect(store.saveWorkspace(workspaceV2({ draftVersion: 1 })).draftVersion)
      .toBe(1);
  });

  it("rejects initial Workspaces that skip creation or claim missing lineage", () => {
    const store = new StudioBrowserContentStoreV2(new MemoryStorageV2());
    expect(() => store.saveWorkspace(workspaceV2({ draftVersion: 1 })))
      .toThrow(/must start at draftVersion 0 without a head/);
    expect(() => store.saveWorkspace(workspaceV2({
      basedOnSnapshotId: "snapshot/missing",
    }))).toThrow(/fork source Snapshot not found/);
  });

  it("never overwrites an immutable snapshotId, including an identical retry", async () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    const committed = await publishFirstSnapshotV2(store);
    const before = storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);

    expect(() => store.saveSnapshotAndWorkspace(committed.qualifiedCommit))
      .toThrow(/immutable snapshotId already exists/);
    expect(() => store.saveSnapshotAndWorkspace({
      snapshot: {
        ...committed.snapshot,
        createdAt: "2026-08-01T00:00:01.000Z",
      },
      workspace: committed.workspace,
    } as unknown as StudioSimulationWorkerQualifiedSnapshotCommitV2))
      .toThrow(/requires a sealed qualified Worker result/);
    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY)).toBe(before);
  });

  it("rejects a sealed Snapshot commit after the persisted Workspace advances", async () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    const current = workspaceV2();
    store.saveWorkspace(current);
    const staleQualifiedCommit = await qualifySnapshotCommitV2(current);
    store.saveWorkspace(workspaceV2({ draftVersion: 1 }));
    const before = storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);

    expect(() => store.saveSnapshotAndWorkspace(staleQualifiedCommit))
      .toThrow(/atomically advance version/);
    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY)).toBe(before);
  });

  it("enforces Article draftVersion compare-and-swap", () => {
    const storage = new MemoryStorageV2();
    const store = new StudioBrowserContentStoreV2(storage);
    const article = {
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: "article/cas",
      draftVersion: 0,
      locale: "ja",
      title: "Article",
      blocks: [],
    };
    expect(() => store.saveArticle({
      ...article,
      articleId: "article/skipped-initial-version",
      draftVersion: 1,
    })).toThrow(/initial Article must start at draftVersion 0/);
    store.saveArticle(article);
    const before = storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);
    expect(() => store.saveArticle(article))
      .toThrow(/Article draftVersion must advance by exactly one/);
    expect(() => store.saveArticle({ ...article, draftVersion: 2 }))
      .toThrow(/Article draftVersion must advance by exactly one/);
    expect(storage.values.get(STUDIO_BROWSER_CONTENT_STORE_V2_KEY)).toBe(before);
    expect(store.saveArticle({ ...article, draftVersion: 1 }).draftVersion)
      .toBe(1);
  });

  it("allows repeated Snapshot placement but rejects duplicate Placement identity", async () => {
    const store = new StudioBrowserContentStoreV2(new MemoryStorageV2());
    await publishFirstSnapshotV2(store);
    const placement = (placementId: string) => ({
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId,
      snapshotId: "snapshot/browser-store-1",
      caption: null,
    });
    const article = {
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: "article/browser-store",
      draftVersion: 0,
      locale: "ja",
      title: "Article",
      blocks: [
        { blockId: "block/one", kind: "experiment", placement: placement("placement/one") },
        { blockId: "block/two", kind: "experiment", placement: placement("placement/two") },
      ],
    };
    expect(store.saveArticle(article).blocks).toHaveLength(2);
    expect(() => store.saveArticle({
      ...article,
      blocks: [
        article.blocks[0],
        { ...article.blocks[1], placement: placement("placement/one") },
      ],
    })).toThrow(/duplicate Placement ID/);
  });

  it("rejects dangling Snapshot, Scenario, and pane references in Articles", async () => {
    const store = new StudioBrowserContentStoreV2(new MemoryStorageV2());
    const { snapshot } = await publishFirstSnapshotV2(store);
    const placement = {
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/cross-validated",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing: {
        scenarioIds: ["scenario/baseline"],
        panePicks: [{ paneId: "pane/waveform", priority: 10 }],
      },
    };
    const article = {
      schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
      articleId: "article/cross-validated",
      draftVersion: 0,
      locale: "ja",
      title: "Article",
      blocks: [{
        blockId: "block/experiment",
        kind: "experiment",
        placement,
      }],
    };
    expect(store.saveArticle(article).blocks).toHaveLength(1);
    expect(() => store.saveArticle({
      ...article,
      blocks: [{
        ...article.blocks[0],
        placement: { ...placement, snapshotId: "snapshot/missing" },
      }],
    })).toThrow(/Article placement Snapshot not found/);
    expect(() => store.saveArticle({
      ...article,
      blocks: [{
        ...article.blocks[0],
        placement: {
          ...placement,
          briefing: {
            ...placement.briefing,
            scenarioIds: ["scenario/missing"],
          },
        },
      }],
    })).toThrow(/unknown id scenario\/missing/);
    expect(() => store.saveArticle({
      ...article,
      blocks: [{
        ...article.blocks[0],
        placement: {
          ...placement,
          briefing: {
            ...placement.briefing,
            panePicks: [{ paneId: "pane/missing", priority: 1 }],
          },
        },
      }],
    })).toThrow(/unknown pane pane\/missing/);
  });

  it("fails closed on invalid Snapshots, dangling heads, and bad lineage in storage", () => {
    const storage = new MemoryStorageV2();
    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY, JSON.stringify({
      schemaId: "circleheart-studio-browser-content-v2",
      workspaces: [workspaceV2({
        headSnapshotId: "snapshot/missing",
      })],
      snapshots: [],
      articles: [],
    }));
    expect(() => new StudioBrowserContentStoreV2(storage).listSnapshots())
      .toThrow(/Workspace head is invalid/);

    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY, JSON.stringify({
      schemaId: "circleheart-studio-browser-content-v2",
      workspaces: [workspaceV2()],
      snapshots: [snapshotV2({
        workspace: workspaceV2({ modelId: "model/other-v3" }),
      })],
      articles: [],
    }));
    expect(() => new StudioBrowserContentStoreV2(storage).listSnapshots())
      .toThrow(/has no matching Experiment Workspace and modelId/);

    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY, JSON.stringify({
      schemaId: "circleheart-studio-browser-content-v2",
      workspaces: [workspaceV2()],
      snapshots: [snapshotV2({ parentSnapshotId: "snapshot/missing" })],
      articles: [],
    }));
    expect(() => new StudioBrowserContentStoreV2(storage).listSnapshots())
      .toThrow(/Snapshot parent not found/);

    const snapshotOne = snapshotV2({
      snapshotId: "snapshot/cycle-one",
      parentSnapshotId: "snapshot/cycle-two",
    });
    const snapshotTwo = snapshotV2({
      snapshotId: "snapshot/cycle-two",
      parentSnapshotId: "snapshot/cycle-one",
    });
    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY, JSON.stringify({
      schemaId: "circleheart-studio-browser-content-v2",
      workspaces: [workspaceV2({
        draftVersion: 2,
        headSnapshotId: snapshotTwo.snapshotId,
        basedOnSnapshotId: snapshotTwo.snapshotId,
      })],
      snapshots: [snapshotOne, snapshotTwo],
      articles: [],
    }));
    expect(() => new StudioBrowserContentStoreV2(storage).listSnapshots())
      .toThrow(/lineage contains a cycle/);
  });

  it("fails closed when the single versioned envelope is corrupted", () => {
    const storage = new MemoryStorageV2();
    storage.setItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY, JSON.stringify({
      schemaId: "circleheart-studio-browser-content-v2",
      workspaces: [],
      snapshots: [],
      articles: [],
      legacyReaderBriefs: [],
    }));
    expect(() => new StudioBrowserContentStoreV2(storage).listSnapshots())
      .toThrow(/schema is invalid/);
  });
});

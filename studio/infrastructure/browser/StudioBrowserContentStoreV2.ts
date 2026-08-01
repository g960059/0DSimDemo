import {
  validateStudioArticleDraftV2,
} from "@/studio/application/authoring/StudioArticleDataV2";
import {
  validateExperimentPlacementAgainstSnapshotV2,
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type { StudioArticleDraftV2 } from "@/studio/contracts/v2/article";
import type {
  ExperimentSnapshotV2,
  ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  assertStudioSimulationWorkerQualifiedSnapshotCommitV2,
  type StudioSimulationWorkerQualifiedSnapshotCommitV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

export const STUDIO_BROWSER_CONTENT_STORE_V2_KEY =
  "circleheart.studio.browser-content.v2";
export const STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID =
  "circleheart-studio-browser-content-v2" as const;

export type StudioBrowserStoragePortV2 = Pick<Storage, "getItem" | "setItem">;

type StudioBrowserContentEnvelopeV2 = Readonly<{
  schemaId: typeof STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID;
  workspaces: readonly ExperimentWorkspaceV2[];
  snapshots: readonly ExperimentSnapshotV2[];
  articles: readonly StudioArticleDraftV2[];
}>;

export class StudioBrowserContentStoreV2 {
  readonly #storage: StudioBrowserStoragePortV2;

  constructor(storage: StudioBrowserStoragePortV2 = window.localStorage) {
    this.#storage = storage;
  }

  listWorkspaces(): readonly ExperimentWorkspaceV2[] {
    return this.#read().workspaces;
  }

  listSnapshots(): readonly ExperimentSnapshotV2[] {
    return this.#read().snapshots;
  }

  listArticles(): readonly StudioArticleDraftV2[] {
    return this.#read().articles;
  }

  readWorkspace(experimentId: string): ExperimentWorkspaceV2 | null {
    return this.#read().workspaces.find((workspace) =>
      workspace.experimentId === experimentId) ?? null;
  }

  readSnapshot(snapshotId: string): ExperimentSnapshotV2 | null {
    return this.#read().snapshots.find((snapshot) =>
      snapshot.snapshotId === snapshotId) ?? null;
  }

  readArticle(articleId: string): StudioArticleDraftV2 | null {
    return this.#read().articles.find((article) =>
      article.articleId === articleId) ?? null;
  }

  saveWorkspace(workspaceValue: unknown): ExperimentWorkspaceV2 {
    const workspace = validateExperimentWorkspaceV2(workspaceValue);
    const current = this.#read();
    const stored = current.workspaces.find(({ experimentId }) =>
      experimentId === workspace.experimentId);
    if (stored === undefined) {
      assertInitialWorkspaceV2(workspace, current.snapshots);
    } else {
      assertDraftWorkspaceAdvanceV2(stored, workspace);
    }
    this.#write({
      ...current,
      workspaces: replaceByIdV2(
        current.workspaces,
        workspace,
        ({ experimentId }) => experimentId,
      ),
    });
    return workspace;
  }

  saveSnapshotAndWorkspace(
    input: StudioSimulationWorkerQualifiedSnapshotCommitV2,
  ): Readonly<{
    snapshot: ExperimentSnapshotV2;
    workspace: ExperimentWorkspaceV2;
  }> {
    assertStudioSimulationWorkerQualifiedSnapshotCommitV2(input);
    const snapshot = validateExperimentSnapshotV2(input.snapshot);
    const workspace = validateExperimentWorkspaceV2(input.workspace);
    if (
      snapshot.experimentId !== workspace.experimentId
      || workspace.headSnapshotId !== snapshot.snapshotId
    ) {
      throw new Error(
        "Browser content store requires one Snapshot and its atomically advanced Workspace",
      );
    }
    const current = this.#read();
    const storedWorkspace = current.workspaces.find(({ experimentId }) =>
      experimentId === snapshot.experimentId);
    if (storedWorkspace === undefined) {
      throw new Error(
        `Browser content store Workspace not found: ${snapshot.experimentId}`,
      );
    }
    if (current.snapshots.some(({ snapshotId }) =>
      snapshotId === snapshot.snapshotId)) {
      throw new Error(
        `Browser content store immutable snapshotId already exists: ${snapshot.snapshotId}`,
      );
    }
    assertQualifiedSnapshotAdvanceV2(
      storedWorkspace,
      snapshot,
      workspace,
      current.snapshots,
    );
    this.#write({
      ...current,
      workspaces: replaceByIdV2(
        current.workspaces,
        workspace,
        ({ experimentId }) => experimentId,
      ),
      snapshots: replaceByIdV2(
        current.snapshots,
        snapshot,
        ({ snapshotId }) => snapshotId,
      ),
    });
    return Object.freeze({ snapshot, workspace });
  }

  saveArticle(articleValue: unknown): StudioArticleDraftV2 {
    const article = validateStudioArticleDraftV2(articleValue);
    const current = this.#read();
    assertArticlePlacementsV2(article, current.snapshots);
    const stored = current.articles.find(({ articleId }) =>
      articleId === article.articleId);
    assertArticleDraftAdvanceV2(stored, article);
    this.#write({
      ...current,
      articles: replaceByIdV2(
        current.articles,
        article,
        ({ articleId }) => articleId,
      ),
    });
    return article;
  }

  #read(): StudioBrowserContentEnvelopeV2 {
    const raw = this.#storage.getItem(STUDIO_BROWSER_CONTENT_STORE_V2_KEY);
    if (raw === null) return emptyEnvelopeV2();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Stored Studio browser content is not JSON: ${errorMessageV2(error)}`,
      );
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Stored Studio browser content must be an object");
    }
    const record = parsed as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const expected = ["articles", "schemaId", "snapshots", "workspaces"];
    if (
      keys.length !== expected.length
      || keys.some((key, index) => key !== expected[index])
      || record.schemaId !== STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID
      || !Array.isArray(record.workspaces)
      || !Array.isArray(record.snapshots)
      || !Array.isArray(record.articles)
    ) {
      throw new Error("Stored Studio browser content schema is invalid");
    }
    const workspaces = Object.freeze(record.workspaces.map(
      validateExperimentWorkspaceV2,
    ));
    const snapshots = Object.freeze(record.snapshots.map(
      validateExperimentSnapshotV2,
    ));
    const articles = Object.freeze(record.articles.map(
      validateStudioArticleDraftV2,
    ));
    assertUniqueV2(workspaces.map(({ experimentId }) => experimentId), "Experiment");
    assertUniqueV2(snapshots.map(({ snapshotId }) => snapshotId), "Snapshot");
    assertUniqueV2(articles.map(({ articleId }) => articleId), "Article");
    const envelope = Object.freeze({
      schemaId: STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID,
      workspaces,
      snapshots,
      articles,
    });
    assertEnvelopeRelationshipsV2(envelope);
    return envelope;
  }

  #write(input: StudioBrowserContentEnvelopeV2): void {
    const envelope: StudioBrowserContentEnvelopeV2 = Object.freeze({
      schemaId: STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID,
      workspaces: Object.freeze(input.workspaces.map(validateExperimentWorkspaceV2)),
      snapshots: Object.freeze(input.snapshots.map(validateExperimentSnapshotV2)),
      articles: Object.freeze(input.articles.map(validateStudioArticleDraftV2)),
    });
    assertEnvelopeRelationshipsV2(envelope);
    this.#storage.setItem(
      STUDIO_BROWSER_CONTENT_STORE_V2_KEY,
      studioCanonicalJsonStringify(envelope),
    );
  }
}

function assertArticleDraftAdvanceV2(
  current: StudioArticleDraftV2 | undefined,
  next: StudioArticleDraftV2,
): void {
  if (current === undefined) {
    if (next.draftVersion !== 0) {
      throw new Error(
        "Browser content store initial Article must start at draftVersion 0",
      );
    }
    return;
  }
  if (next.draftVersion !== current.draftVersion + 1) {
    throw new Error(
      "Browser content store Article draftVersion must advance by exactly one",
    );
  }
}

function assertInitialWorkspaceV2(
  workspace: ExperimentWorkspaceV2,
  snapshots: readonly ExperimentSnapshotV2[],
): void {
  if (workspace.draftVersion !== 0 || workspace.headSnapshotId !== null) {
    throw new Error(
      "Browser content store initial Workspace must start at draftVersion 0 without a head",
    );
  }
  if (workspace.basedOnSnapshotId === null) return;
  const source = snapshots.find(({ snapshotId }) =>
    snapshotId === workspace.basedOnSnapshotId);
  if (source === undefined) {
    throw new Error(
      `Browser content store fork source Snapshot not found: ${workspace.basedOnSnapshotId}`,
    );
  }
  if (
    workspace.content.modelId !== source.content.modelId
    || !samePortableValueV2(workspace.content, source.content)
  ) {
    throw new Error(
      "Browser content store initial fork Workspace must exactly copy its source Snapshot",
    );
  }
}

function assertDraftWorkspaceAdvanceV2(
  current: ExperimentWorkspaceV2,
  next: ExperimentWorkspaceV2,
): void {
  if (next.draftVersion !== current.draftVersion + 1) {
    throw new Error(
      "Browser content store Workspace draftVersion must advance by exactly one",
    );
  }
  if (
    next.headSnapshotId !== current.headSnapshotId
    || next.basedOnSnapshotId !== current.basedOnSnapshotId
  ) {
    throw new Error(
      "Browser content store Draft save cannot change Snapshot lineage",
    );
  }
  if (next.content.modelId !== current.content.modelId) {
    throw new Error(
      "Browser content store Experiment series cannot change modelId",
    );
  }
}

function assertQualifiedSnapshotAdvanceV2(
  current: ExperimentWorkspaceV2,
  snapshot: ExperimentSnapshotV2,
  next: ExperimentWorkspaceV2,
  snapshots: readonly ExperimentSnapshotV2[],
): void {
  if (
    snapshot.experimentId !== current.experimentId
    || next.experimentId !== current.experimentId
  ) {
    throw new Error(
      "Browser content store Snapshot commit must retain Experiment identity",
    );
  }
  if (
    snapshot.content.modelId !== current.content.modelId
    || next.content.modelId !== current.content.modelId
  ) {
    throw new Error(
      "Browser content store Snapshot commit must retain the exact modelId",
    );
  }
  if (snapshot.parentSnapshotId !== current.basedOnSnapshotId) {
    throw new Error(
      "Browser content store Snapshot parent must match the Workspace basedOn head",
    );
  }
  if (
    next.draftVersion !== current.draftVersion + 1
    || next.headSnapshotId !== snapshot.snapshotId
    || next.basedOnSnapshotId !== snapshot.snapshotId
  ) {
    throw new Error(
      "Browser content store Snapshot commit must atomically advance version, head, and basedOn",
    );
  }
  if (!samePortableValueV2(next.content, snapshot.content)) {
    throw new Error(
      "Browser content store advanced Workspace must contain the exact Snapshot content",
    );
  }
  if (!sameAuthoredContentExceptCheckpointsV2(current, snapshot)) {
    throw new Error(
      "Browser content store qualification may change checkpoints only",
    );
  }
  if (snapshot.parentSnapshotId !== null) {
    const parent = snapshots.find(({ snapshotId }) =>
      snapshotId === snapshot.parentSnapshotId);
    if (parent === undefined) {
      throw new Error(
        `Browser content store Snapshot parent not found: ${snapshot.parentSnapshotId}`,
      );
    }
    if (parent.content.modelId !== snapshot.content.modelId) {
      throw new Error(
        "Browser content store Snapshot lineage cannot change modelId",
      );
    }
  }
}

function sameAuthoredContentExceptCheckpointsV2(
  current: ExperimentWorkspaceV2,
  snapshot: ExperimentSnapshotV2,
): boolean {
  const before = current.content;
  const after = snapshot.content;
  if (
    before.modelId !== after.modelId
    || !samePortableValueV2(before.surface, after.surface)
    || before.scenarios.length !== after.scenarios.length
  ) {
    return false;
  }
  return before.scenarios.every((scenario, index) => {
    const qualified = after.scenarios[index];
    return qualified !== undefined
      && qualified.scenarioId === scenario.scenarioId
      && qualified.label === scenario.label
      && samePortableValueV2(
        qualified.capture.fixture,
        scenario.capture.fixture,
      );
  });
}

function assertEnvelopeRelationshipsV2(
  envelope: StudioBrowserContentEnvelopeV2,
): void {
  const workspaces = new Map(envelope.workspaces.map((workspace) =>
    [workspace.experimentId, workspace] as const));
  const snapshots = new Map(envelope.snapshots.map((snapshot) =>
    [snapshot.snapshotId, snapshot] as const));

  for (const snapshot of snapshots.values()) {
    const workspace = workspaces.get(snapshot.experimentId);
    if (
      workspace === undefined
      || workspace.content.modelId !== snapshot.content.modelId
    ) {
      throw new Error(
        `Stored Snapshot ${snapshot.snapshotId} has no matching Experiment Workspace and modelId`,
      );
    }
    if (snapshot.parentSnapshotId === null) continue;
    const parent = snapshots.get(snapshot.parentSnapshotId);
    if (parent === undefined) {
      throw new Error(
        `Stored Snapshot parent not found: ${snapshot.parentSnapshotId}`,
      );
    }
    if (parent.content.modelId !== snapshot.content.modelId) {
      throw new Error("Stored Snapshot lineage changes modelId");
    }
  }
  assertAcyclicSnapshotLineageV2(snapshots);

  for (const workspace of workspaces.values()) {
    if (workspace.headSnapshotId !== null) {
      const head = snapshots.get(workspace.headSnapshotId);
      if (
        head === undefined
        || head.experimentId !== workspace.experimentId
        || head.content.modelId !== workspace.content.modelId
      ) {
        throw new Error(
          `Stored Workspace head is invalid: ${workspace.headSnapshotId}`,
        );
      }
    }
    if (workspace.basedOnSnapshotId !== null) {
      const basedOn = snapshots.get(workspace.basedOnSnapshotId);
      if (
        basedOn === undefined
        || basedOn.content.modelId !== workspace.content.modelId
      ) {
        throw new Error(
          `Stored Workspace basedOn is invalid: ${workspace.basedOnSnapshotId}`,
        );
      }
    }
  }

  envelope.articles.forEach((article) =>
    assertArticlePlacementsV2(article, envelope.snapshots));
}

function assertAcyclicSnapshotLineageV2(
  snapshots: ReadonlyMap<string, ExperimentSnapshotV2>,
): void {
  const complete = new Set<string>();
  const visiting = new Set<string>();
  const visit = (snapshotId: string): void => {
    if (complete.has(snapshotId)) return;
    if (visiting.has(snapshotId)) {
      throw new Error("Stored Snapshot lineage contains a cycle");
    }
    visiting.add(snapshotId);
    const parent = snapshots.get(snapshotId)?.parentSnapshotId;
    if (parent !== null && parent !== undefined) visit(parent);
    visiting.delete(snapshotId);
    complete.add(snapshotId);
  };
  snapshots.forEach(({ snapshotId }) => visit(snapshotId));
}

function assertArticlePlacementsV2(
  article: StudioArticleDraftV2,
  snapshots: readonly ExperimentSnapshotV2[],
): void {
  const byId = new Map(snapshots.map((snapshot) =>
    [snapshot.snapshotId, snapshot] as const));
  article.blocks.forEach((block) => {
    if (block.kind !== "experiment") return;
    const snapshot = byId.get(block.placement.snapshotId);
    if (snapshot === undefined) {
      throw new Error(
        `Browser content store Article placement Snapshot not found: ${block.placement.snapshotId}`,
      );
    }
    validateExperimentPlacementAgainstSnapshotV2(
      block.placement,
      snapshot,
    );
  });
}

function samePortableValueV2(left: unknown, right: unknown): boolean {
  return studioCanonicalJsonStringify(left)
    === studioCanonicalJsonStringify(right);
}

function emptyEnvelopeV2(): StudioBrowserContentEnvelopeV2 {
  return Object.freeze({
    schemaId: STUDIO_BROWSER_CONTENT_STORE_V2_SCHEMA_ID,
    workspaces: Object.freeze([]),
    snapshots: Object.freeze([]),
    articles: Object.freeze([]),
  });
}

function replaceByIdV2<TValue>(
  values: readonly TValue[],
  next: TValue,
  id: (value: TValue) => string,
): readonly TValue[] {
  const nextId = id(next);
  const found = values.some((value) => id(value) === nextId);
  return Object.freeze(found
    ? values.map((value) => id(value) === nextId ? next : value)
    : [...values, next]);
}

function assertUniqueV2(ids: readonly string[], kind: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Stored Studio browser content has duplicate ${kind} identity`);
  }
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

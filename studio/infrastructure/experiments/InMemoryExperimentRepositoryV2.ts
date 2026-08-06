import {
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  StudioExperimentAuthoringApplicationV2,
} from "@/studio/application/authoring/StudioExperimentAuthoringApplicationV2";
import type {
  ExperimentQueryPortV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentSnapshotV2,
  ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import type {
  ExperimentDraftVersionV2,
  ExperimentIdV2,
  ExperimentSnapshotIdV2,
} from "@/studio/contracts/v2/ids";

export class StudioExperimentNotFoundErrorV2 extends Error {
  constructor(experimentId: string) {
    super(`Studio Experiment V2 not found: ${experimentId}`);
    this.name = "StudioExperimentNotFoundErrorV2";
  }
}

export class StudioExperimentAlreadyExistsErrorV2 extends Error {
  constructor(experimentId: string) {
    super(`Studio Experiment V2 already exists: ${experimentId}`);
    this.name = "StudioExperimentAlreadyExistsErrorV2";
  }
}

export class StudioExperimentConflictErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment V2 conflict: ${message}`);
    this.name = "StudioExperimentConflictErrorV2";
  }
}

const QUALIFIED_SNAPSHOT_COMMIT_CAPABILITY_V2 = Symbol(
  "StudioQualifiedSnapshotCommitV2",
);

type SnapshotCommitInputInternalV2 = Readonly<{
  expectedDraftVersion: ExperimentDraftVersionV2;
  expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
  snapshot: ExperimentSnapshotV2;
  nextWorkspace: ExperimentWorkspaceV2;
}>;

/**
 * Deterministic repository used by the V2 foundation and tests.
 *
 * Values enter only through fail-closed validators and remain detached,
 * deeply frozen snapshots. `commitSnapshot` contains no asynchronous gap:
 * readers observe both the immutable Snapshot and updated head, or neither.
 */
class InMemoryExperimentRepositoryV2 {
  readonly #workspaces =
    new Map<ExperimentIdV2, ExperimentWorkspaceV2>();
  readonly #snapshots =
    new Map<ExperimentSnapshotIdV2, ExperimentSnapshotV2>();

  constructor(seed: InMemoryExperimentAuthoringSeedV2 | undefined) {
    if (seed === undefined) return;
    const validatedSeed = validateSeedEnvelopeV2(seed);

    for (const snapshot of validatedSeed.snapshots ?? []) {
      if (this.#snapshots.has(snapshot.snapshotId)) {
        throw new StudioExperimentConflictErrorV2(
          `seed contains duplicate snapshotId: ${snapshot.snapshotId}`,
        );
      }
      this.#snapshots.set(snapshot.snapshotId, snapshot);
    }

    for (const snapshot of this.#snapshots.values()) {
      if (snapshot.parentSnapshotId === null) continue;
      const parent = this.#snapshots.get(snapshot.parentSnapshotId);
      if (
        parent !== undefined
        && parent.content.modelId !== snapshot.content.modelId
      ) {
        throw new StudioExperimentConflictErrorV2(
          "seed Snapshot lineage must keep the exact modelId",
        );
      }
    }

    if (validatedSeed.workspace !== undefined) {
      const workspace = validatedSeed.workspace;
      assertSeedWorkspaceLineageV2(workspace, this.#snapshots);
      this.#workspaces.set(workspace.experimentId, workspace);
    }
  }

  get workspaceCount(): number {
    return this.#workspaces.size;
  }

  get snapshotCount(): number {
    return this.#snapshots.size;
  }

  createWorkspace(workspaceValue: ExperimentWorkspaceV2): void {
    const workspace = validateExperimentWorkspaceV2(workspaceValue);
    if (this.#workspaces.has(workspace.experimentId)) {
      throw new StudioExperimentAlreadyExistsErrorV2(
        workspace.experimentId,
      );
    }
    this.#workspaces.set(workspace.experimentId, workspace);
  }

  readWorkspace(
    experimentId: ExperimentIdV2,
  ): ExperimentWorkspaceV2 | null {
    return this.#workspaces.get(experimentId) ?? null;
  }

  replaceWorkspace(
    expectedDraftVersion: ExperimentDraftVersionV2,
    workspaceValue: ExperimentWorkspaceV2,
  ): void {
    const workspace = validateExperimentWorkspaceV2(workspaceValue);
    const current = this.#requiredWorkspaceV2(workspace.experimentId);
    assertExpectedDraftVersionV2(current, expectedDraftVersion);
    if (workspace.draftVersion !== current.draftVersion + 1) {
      throw new StudioExperimentConflictErrorV2(
        "replacement draftVersion must advance by exactly one",
      );
    }
    if (
      workspace.headSnapshotId !== current.headSnapshotId
      || workspace.basedOnSnapshotId !== current.basedOnSnapshotId
    ) {
      throw new StudioExperimentConflictErrorV2(
        "SaveDraft cannot change snapshot lineage",
      );
    }
    this.#workspaces.set(workspace.experimentId, workspace);
  }

  rebaseWorkspace(input: Readonly<{
    expectedDraftVersion: ExperimentDraftVersionV2;
    expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
    targetSnapshotId: ExperimentSnapshotIdV2;
    workspace: ExperimentWorkspaceV2;
  }>): void {
    const workspace = validateExperimentWorkspaceV2(input.workspace);
    const current = this.#requiredWorkspaceV2(workspace.experimentId);
    assertExpectedDraftVersionV2(current, input.expectedDraftVersion);
    if (current.headSnapshotId !== input.expectedHeadSnapshotId) {
      throw new StudioExperimentConflictErrorV2(
        "headSnapshotId changed before rebase",
      );
    }
    const target = this.#snapshots.get(input.targetSnapshotId);
    if (target === undefined) {
      throw new StudioExperimentConflictErrorV2(
        `rebase target Snapshot not found: ${input.targetSnapshotId}`,
      );
    }
    if (
      workspace.experimentId !== current.experimentId
      || workspace.draftVersion !== current.draftVersion + 1
      || workspace.headSnapshotId !== current.headSnapshotId
      || workspace.basedOnSnapshotId !== target.snapshotId
      || target.content.modelId !== current.content.modelId
      || workspace.content.modelId !== current.content.modelId
    ) {
      throw new StudioExperimentConflictErrorV2(
        "rebase must keep the head and exact model while advancing basedOn",
      );
    }
    this.#workspaces.set(workspace.experimentId, workspace);
  }

  readSnapshot(
    snapshotId: ExperimentSnapshotIdV2,
  ): ExperimentSnapshotV2 | null {
    return this.#snapshots.get(snapshotId) ?? null;
  }

  [QUALIFIED_SNAPSHOT_COMMIT_CAPABILITY_V2](): Readonly<{
    commitSnapshot(input: SnapshotCommitInputInternalV2): void;
  }> {
    return Object.freeze({
      commitSnapshot: this.#commitSnapshotV2.bind(this),
    });
  }

  #commitSnapshotV2(input: SnapshotCommitInputInternalV2): void {
    const snapshot = validateExperimentSnapshotV2(input.snapshot);
    const nextWorkspace = validateExperimentWorkspaceV2(
      input.nextWorkspace,
    );
    const current = this.#requiredWorkspaceV2(snapshot.experimentId);
    assertExpectedDraftVersionV2(current, input.expectedDraftVersion);
    if (current.headSnapshotId !== input.expectedHeadSnapshotId) {
      throw new StudioExperimentConflictErrorV2(
        "headSnapshotId changed while the candidate was qualified",
      );
    }
    if (this.#snapshots.has(snapshot.snapshotId)) {
      throw new StudioExperimentConflictErrorV2(
        `snapshotId already exists: ${snapshot.snapshotId}`,
      );
    }
    if (
      snapshot.parentSnapshotId !== current.basedOnSnapshotId
      || nextWorkspace.experimentId !== current.experimentId
      || nextWorkspace.draftVersion !== current.draftVersion + 1
      || nextWorkspace.headSnapshotId !== snapshot.snapshotId
      || nextWorkspace.basedOnSnapshotId !== snapshot.snapshotId
      || !samePortableValueV2(nextWorkspace.content, snapshot.content)
    ) {
      throw new StudioExperimentConflictErrorV2(
        "Snapshot commit does not atomically advance the same workspace",
      );
    }

    this.#snapshots.set(snapshot.snapshotId, snapshot);
    this.#workspaces.set(nextWorkspace.experimentId, nextWorkspace);
  }

  #requiredWorkspaceV2(
    experimentId: ExperimentIdV2,
  ): ExperimentWorkspaceV2 {
    const workspace = this.#workspaces.get(experimentId);
    if (workspace === undefined) {
      throw new StudioExperimentNotFoundErrorV2(experimentId);
    }
    return workspace;
  }
}

export type InMemoryExperimentAuthoringDependenciesV2 = Omit<
  ConstructorParameters<typeof StudioExperimentAuthoringApplicationV2>[0],
  "repository" | "qualifiedSnapshotCommit"
> & Readonly<{
  seed?: InMemoryExperimentAuthoringSeedV2;
}>;

export type InMemoryExperimentAuthoringSeedV2 = Readonly<{
  workspace?: ExperimentWorkspaceV2;
  snapshots?: readonly ExperimentSnapshotV2[];
}>;

export type InMemoryExperimentQueryFacadeV2 = ExperimentQueryPortV2 & Readonly<{
  readonly workspaceCount: number;
  readonly snapshotCount: number;
}>;

export type StudioExperimentAuthoringFacadeV2 = Pick<
  StudioExperimentAuthoringApplicationV2,
  | "createWorkspace"
  | "forkWorkspace"
  | "readWorkspace"
  | "readSnapshot"
  | "saveDraft"
  | "rebaseDraft"
  | "createSnapshot"
>;

/**
 * The only exported construction path for a usable in-memory authoring stack.
 * The raw repository never leaves this factory, and the module-private Symbol
 * required by Snapshot commit is held only by the injected commit closure.
 */
export function createInMemoryExperimentAuthoringV2(
  dependencies: InMemoryExperimentAuthoringDependenciesV2,
): Readonly<{
  application: StudioExperimentAuthoringFacadeV2;
  queries: InMemoryExperimentQueryFacadeV2;
}> {
  const { seed, ...authoringDependencies } = dependencies;
  const repository = new InMemoryExperimentRepositoryV2(seed);
  const application = new StudioExperimentAuthoringApplicationV2({
    ...authoringDependencies,
    repository,
    qualifiedSnapshotCommit:
      repository[QUALIFIED_SNAPSHOT_COMMIT_CAPABILITY_V2](),
  });
  const authoringFacade: StudioExperimentAuthoringFacadeV2 = Object.freeze({
    createWorkspace: application.createWorkspace.bind(application),
    forkWorkspace: application.forkWorkspace.bind(application),
    readWorkspace: application.readWorkspace.bind(application),
    readSnapshot: application.readSnapshot.bind(application),
    saveDraft: application.saveDraft.bind(application),
    rebaseDraft: application.rebaseDraft.bind(application),
    createSnapshot: application.createSnapshot.bind(application),
  });
  const queries: InMemoryExperimentQueryFacadeV2 = Object.freeze({
    readWorkspace(experimentId: ExperimentIdV2) {
      return application.readWorkspace(experimentId);
    },
    readSnapshot(snapshotId: ExperimentSnapshotIdV2) {
      return application.readSnapshot(snapshotId);
    },
    get workspaceCount() {
      return repository.workspaceCount;
    },
    get snapshotCount() {
      return repository.snapshotCount;
    },
  });
  return Object.freeze({ application: authoringFacade, queries });
}

function validateSeedEnvelopeV2(
  seed: InMemoryExperimentAuthoringSeedV2,
): InMemoryExperimentAuthoringSeedV2 {
  if (
    seed === null
    || typeof seed !== "object"
    || Array.isArray(seed)
    || (
      Object.getPrototypeOf(seed) !== Object.prototype
      && Object.getPrototypeOf(seed) !== null
    )
  ) {
    throw new StudioExperimentConflictErrorV2(
      "authoring seed must be a plain data object",
    );
  }
  const allowed = new Set(["workspace", "snapshots"]);
  const unknown = Reflect.ownKeys(seed).filter((key) =>
    typeof key !== "string" || !allowed.has(key));
  if (unknown.length > 0) {
    throw new StudioExperimentConflictErrorV2(
      "authoring seed contains unknown fields",
    );
  }
  const workspaceValue = seedDataPropertyV2(seed, "workspace");
  const snapshotsValue = seedDataPropertyV2(seed, "snapshots");
  const workspace = workspaceValue === ABSENT_SEED_FIELD_V2
    ? undefined
    : validateExperimentWorkspaceV2(workspaceValue);
  const snapshots = snapshotsValue === ABSENT_SEED_FIELD_V2
    ? undefined
    : validateSeedSnapshotsV2(snapshotsValue);
  return Object.freeze({
    ...(workspace === undefined ? {} : { workspace }),
    ...(snapshots === undefined ? {} : { snapshots }),
  });
}

const ABSENT_SEED_FIELD_V2 = Symbol("absent-seed-field-v2");

function seedDataPropertyV2(
  seed: object,
  key: "workspace" | "snapshots",
): unknown | typeof ABSENT_SEED_FIELD_V2 {
  const descriptor = Object.getOwnPropertyDescriptor(seed, key);
  if (descriptor === undefined) return ABSENT_SEED_FIELD_V2;
  if (!descriptor.enumerable || !("value" in descriptor)) {
    throw new StudioExperimentConflictErrorV2(
      `authoring seed ${key} must be an enumerable data property`,
    );
  }
  return descriptor.value;
}

function validateSeedSnapshotsV2(
  value: unknown,
): readonly ExperimentSnapshotV2[] {
  if (
    !Array.isArray(value)
    || Object.getPrototypeOf(value) !== Array.prototype
  ) {
    throw new StudioExperimentConflictErrorV2(
      "authoring seed snapshots must be a plain array",
    );
  }
  const expectedKeys = new Set(["length"]);
  for (let index = 0; index < value.length; index += 1) {
    expectedKeys.add(String(index));
  }
  if (Reflect.ownKeys(value).some((key) =>
    typeof key !== "string" || !expectedKeys.has(key))) {
    throw new StudioExperimentConflictErrorV2(
      "authoring seed snapshots must not contain custom properties",
    );
  }
  const snapshots: ExperimentSnapshotV2[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw new StudioExperimentConflictErrorV2(
        "authoring seed snapshots must be dense enumerable data",
      );
    }
    snapshots.push(validateExperimentSnapshotV2(descriptor.value));
  }
  return Object.freeze(snapshots);
}

function assertSeedWorkspaceLineageV2(
  workspace: ExperimentWorkspaceV2,
  snapshots: ReadonlyMap<ExperimentSnapshotIdV2, ExperimentSnapshotV2>,
): void {
  if (workspace.headSnapshotId !== null) {
    const head = snapshots.get(workspace.headSnapshotId);
    if (head === undefined) {
      throw new StudioExperimentConflictErrorV2(
        `seed workspace head Snapshot not found: ${workspace.headSnapshotId}`,
      );
    }
    if (
      head.experimentId !== workspace.experimentId
      || head.content.modelId !== workspace.content.modelId
    ) {
      throw new StudioExperimentConflictErrorV2(
        "seed workspace head must belong to the same Experiment and model",
      );
    }
  }
  if (workspace.basedOnSnapshotId !== null) {
    const basedOn = snapshots.get(workspace.basedOnSnapshotId);
    if (basedOn === undefined) {
      throw new StudioExperimentConflictErrorV2(
        `seed workspace base Snapshot not found: ${workspace.basedOnSnapshotId}`,
      );
    }
    if (basedOn.content.modelId !== workspace.content.modelId) {
      throw new StudioExperimentConflictErrorV2(
        "seed workspace base must use the same exact model",
      );
    }
  }
}

function assertExpectedDraftVersionV2(
  workspace: ExperimentWorkspaceV2,
  expectedDraftVersion: ExperimentDraftVersionV2,
): void {
  if (workspace.draftVersion !== expectedDraftVersion) {
    throw new StudioExperimentConflictErrorV2(
      `expected draftVersion ${expectedDraftVersion}, `
        + `found ${workspace.draftVersion}`,
    );
  }
}

function samePortableValueV2(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null
    || right === null
    || typeof left !== "object"
    || typeof right !== "object"
  ) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) =>
        samePortableValueV2(value, right[index]));
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) =>
      key === rightKeys[index]
      && samePortableValueV2(leftRecord[key], rightRecord[key]));
}

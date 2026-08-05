import {
  validateExperimentSnapshotV2,
  validateExperimentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  StudioExperimentAuthoringApplicationV2,
} from "@/studio/application/authoring/StudioExperimentAuthoringApplicationV2";
import type {
  ExperimentQueryPortV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentSnapshotV2,
  ExperimentV2,
} from "@/studio/contracts/v2/content";
import type {
  ExperimentVersionV2,
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

/**
 * Deterministic repository used by the V2 foundation and tests.
 *
 * Values enter only through fail-closed validators and remain detached,
 * deeply frozen values. Snapshot persistence is independent of a mutable
 * Experiment; separate library metadata may point at a publication Snapshot.
 */
class InMemoryExperimentRepositoryV2 {
  readonly #experiments =
    new Map<ExperimentIdV2, ExperimentV2>();
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

    if (validatedSeed.experiment !== undefined) {
      const experiment = validatedSeed.experiment;
      this.#experiments.set(experiment.experimentId, experiment);
    }
  }

  get experimentCount(): number {
    return this.#experiments.size;
  }

  get snapshotCount(): number {
    return this.#snapshots.size;
  }

  createExperiment(experimentValue: ExperimentV2): void {
    const experiment = validateExperimentV2(experimentValue);
    if (this.#experiments.has(experiment.experimentId)) {
      throw new StudioExperimentAlreadyExistsErrorV2(
        experiment.experimentId,
      );
    }
    this.#experiments.set(experiment.experimentId, experiment);
  }

  readExperiment(
    experimentId: ExperimentIdV2,
  ): ExperimentV2 | null {
    return this.#experiments.get(experimentId) ?? null;
  }

  replaceExperiment(
    expectedVersion: ExperimentVersionV2,
    experimentValue: ExperimentV2,
  ): void {
    const experiment = validateExperimentV2(experimentValue);
    const current = this.#requiredExperimentV2(experiment.experimentId);
    assertExpectedVersionV2(current, expectedVersion);
    if (experiment.version !== current.version + 1) {
      throw new StudioExperimentConflictErrorV2(
        "replacement version must advance by exactly one",
      );
    }
    if (experiment.content.modelId !== current.content.modelId) {
      throw new StudioExperimentConflictErrorV2(
        "SaveExperiment cannot change the exact modelId",
      );
    }
    this.#experiments.set(experiment.experimentId, experiment);
  }

  readSnapshot(
    snapshotId: ExperimentSnapshotIdV2,
  ): ExperimentSnapshotV2 | null {
    return this.#snapshots.get(snapshotId) ?? null;
  }

  [QUALIFIED_SNAPSHOT_COMMIT_CAPABILITY_V2](): Readonly<{
    commitSnapshot(snapshot: ExperimentSnapshotV2): void;
  }> {
    return Object.freeze({
      commitSnapshot: this.#commitSnapshotV2.bind(this),
    });
  }

  #commitSnapshotV2(snapshotValue: ExperimentSnapshotV2): void {
    const snapshot = validateExperimentSnapshotV2(snapshotValue);
    if (this.#snapshots.has(snapshot.snapshotId)) {
      throw new StudioExperimentConflictErrorV2(
        `snapshotId already exists: ${snapshot.snapshotId}`,
      );
    }
    this.#snapshots.set(snapshot.snapshotId, snapshot);
  }

  #requiredExperimentV2(
    experimentId: ExperimentIdV2,
  ): ExperimentV2 {
    const experiment = this.#experiments.get(experimentId);
    if (experiment === undefined) {
      throw new StudioExperimentNotFoundErrorV2(experimentId);
    }
    return experiment;
  }
}

export type InMemoryExperimentAuthoringDependenciesV2 = Omit<
  ConstructorParameters<typeof StudioExperimentAuthoringApplicationV2>[0],
  "repository" | "qualifiedSnapshotCommit"
> & Readonly<{
  seed?: InMemoryExperimentAuthoringSeedV2;
}>;

export type InMemoryExperimentAuthoringSeedV2 = Readonly<{
  experiment?: ExperimentV2;
  snapshots?: readonly ExperimentSnapshotV2[];
}>;

export type InMemoryExperimentQueryFacadeV2 = ExperimentQueryPortV2 & Readonly<{
  readonly experimentCount: number;
  readonly snapshotCount: number;
}>;

export type StudioExperimentAuthoringFacadeV2 = Pick<
  StudioExperimentAuthoringApplicationV2,
  | "createExperiment"
  | "forkExperiment"
  | "readExperiment"
  | "readSnapshot"
  | "saveExperiment"
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
    createExperiment: application.createExperiment.bind(application),
    forkExperiment: application.forkExperiment.bind(application),
    readExperiment: application.readExperiment.bind(application),
    readSnapshot: application.readSnapshot.bind(application),
    saveExperiment: application.saveExperiment.bind(application),
    createSnapshot: application.createSnapshot.bind(application),
  });
  const queries: InMemoryExperimentQueryFacadeV2 = Object.freeze({
    readExperiment(experimentId: ExperimentIdV2) {
      return application.readExperiment(experimentId);
    },
    readSnapshot(snapshotId: ExperimentSnapshotIdV2) {
      return application.readSnapshot(snapshotId);
    },
    get experimentCount() {
      return repository.experimentCount;
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
  const allowed = new Set(["experiment", "snapshots"]);
  const unknown = Reflect.ownKeys(seed).filter((key) =>
    typeof key !== "string" || !allowed.has(key));
  if (unknown.length > 0) {
    throw new StudioExperimentConflictErrorV2(
      "authoring seed contains unknown fields",
    );
  }
  const experimentValue = seedDataPropertyV2(seed, "experiment");
  const snapshotsValue = seedDataPropertyV2(seed, "snapshots");
  const experiment = experimentValue === ABSENT_SEED_FIELD_V2
    ? undefined
    : validateExperimentV2(experimentValue);
  const snapshots = snapshotsValue === ABSENT_SEED_FIELD_V2
    ? undefined
    : validateSeedSnapshotsV2(snapshotsValue);
  return Object.freeze({
    ...(experiment === undefined ? {} : { experiment }),
    ...(snapshots === undefined ? {} : { snapshots }),
  });
}

const ABSENT_SEED_FIELD_V2 = Symbol("absent-seed-field-v2");

function seedDataPropertyV2(
  seed: object,
  key: "experiment" | "snapshots",
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

function assertExpectedVersionV2(
  experiment: ExperimentV2,
  expectedVersion: ExperimentVersionV2,
): void {
  if (experiment.version !== expectedVersion) {
    throw new StudioExperimentConflictErrorV2(
      `expected version ${expectedVersion}, `
        + `found ${experiment.version}`,
    );
  }
}

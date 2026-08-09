import {
  assertExperimentCapturesMatchModelV2,
  assertExperimentContentMatchesModelV2,
  assertExperimentDesiredFixturesMatchModelV2,
  validateExperimentCaptureConfirmationV2,
  validateExperimentCaptureCorrelationV2,
  validateExperimentDesiredContentForModelV2,
  validateExperimentSnapshotV2,
  validateExperimentV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentSnapshotV2,
  type ExperimentV2,
} from "@/studio/contracts/v2/content";
import type {
  CreateExperimentSnapshotCommandV2,
  CreateExperimentCommandV2,
  ExperimentCapturedContentV2,
  ExperimentDesiredContentV2,
  ExperimentSnapshotIdFactoryPortV2,
  ForkExperimentCommandV2,
  SaveExperimentCommandV2,
  StudioClockPortV2,
} from "@/studio/contracts/v2/authoring";
import {
  assertCaptureAdapterMatchesModelV2,
  assertModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelRuntimeResolverPortV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import type {
  ExperimentVersionV2,
} from "@/studio/contracts/v2/ids";
import {
  StudioExperimentSnapshotAdmissionProtocolErrorV2,
  StudioExperimentSnapshotAdmissionRejectedErrorV2,
  studioSnapshotAdmissionServiceV1,
} from "./StudioSnapshotAdmissionServiceV1";

export {
  StudioExperimentSnapshotAdmissionProtocolErrorV2,
  StudioExperimentSnapshotAdmissionRejectedErrorV2,
} from "./StudioSnapshotAdmissionServiceV1";

export class StudioExperimentAuthoringConflictErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment authoring conflict: ${message}`);
    this.name = "StudioExperimentAuthoringConflictErrorV2";
  }
}

export class StudioExperimentCaptureMutationErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment capture changed authored content: ${message}`);
    this.name = "StudioExperimentCaptureMutationErrorV2";
  }
}

type ExperimentStoreInternalV2 = Readonly<{
  readExperiment(experimentId: string): ExperimentV2 | null;
  readSnapshot(snapshotId: string): ExperimentSnapshotV2 | null;
  createExperiment(experiment: ExperimentV2): void;
  replaceExperiment(
    expectedVersion: ExperimentVersionV2,
    experiment: ExperimentV2,
  ): void;
}>;

type AdmittedSnapshotCommitInternalV2 = Readonly<{
  commitSnapshot(snapshot: ExperimentSnapshotV2): void;
}>;

/**
 * Command boundary for explicitly saved Experiments and independent immutable
 * Snapshots.
 *
 * `saveExperiment` accepts checkpoint-free desired content. Fixture-changing Saves
 * delegate complete accepted-boundary capture to the exact model runtime;
 * Surface/label/order-only Saves reuse the current matching checkpoints. The
 * common Studio admission service verifies public executability without changing the captured
 * checkpoint; this application owns frozen-candidate identity and repository
 * visibility. A Snapshot may come directly from an ephemeral Experiment
 * Session. A standalone Publication workflow may additionally require a
 * version-matched, explicitly saved Experiment head.
 */
export class StudioExperimentAuthoringApplicationV2 {
  readonly #repository: ExperimentStoreInternalV2;
  readonly #admittedSnapshotCommit: AdmittedSnapshotCommitInternalV2;
  readonly #models: ExactModelRuntimeResolverPortV2;
  readonly #snapshotIds: ExperimentSnapshotIdFactoryPortV2;
  readonly #clock: StudioClockPortV2;

  constructor(input: Readonly<{
    repository: ExperimentStoreInternalV2;
    admittedSnapshotCommit: AdmittedSnapshotCommitInternalV2;
    models: ExactModelRuntimeResolverPortV2;
    snapshotIds: ExperimentSnapshotIdFactoryPortV2;
    clock: StudioClockPortV2;
  }>) {
    this.#repository = input.repository;
    this.#admittedSnapshotCommit = input.admittedSnapshotCommit;
    this.#models = input.models;
    this.#snapshotIds = input.snapshotIds;
    this.#clock = input.clock;
  }

  async createExperiment(
    command: CreateExperimentCommandV2,
  ): Promise<ExperimentV2> {
    assertCommandKeysV2(
      command,
      ["experimentId", "content"],
      [],
      "CreateExperiment",
    );
    const experiment = validateExperimentV2({
      schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
      experimentId: command.experimentId,
      version: 0,
      content: command.content,
    });
    const { contract: model, captureAdapter: adapter } = this.#requiredModelRuntimeV2(
      experiment.content.modelId,
    );
    assertExperimentContentMatchesModelV2(experiment.content, model);
    await assertExperimentCapturesMatchModelV2(
      experiment.content,
      model,
      adapter,
    );
    this.#repository.createExperiment(experiment);
    return experiment;
  }

  async forkExperiment(
    command: ForkExperimentCommandV2,
  ): Promise<ExperimentV2> {
    assertCommandKeysV2(
      command,
      ["experimentId", "sourceSnapshotId"],
      [],
      "ForkExperiment",
    );
    const sourceValue = this.#repository.readSnapshot(command.sourceSnapshotId);
    if (sourceValue === null) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `fork source Snapshot not found: ${command.sourceSnapshotId}`,
      );
    }
    const source = await this.#validateRegisteredSnapshotV2(sourceValue);
    const experiment = validateExperimentV2({
      schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
      experimentId: command.experimentId,
      version: 0,
      content: source.content,
    });
    this.#repository.createExperiment(experiment);
    return experiment;
  }

  async readExperiment(
    experimentId: string,
  ): Promise<ExperimentV2 | null> {
    const experiment = this.#repository.readExperiment(experimentId);
    if (experiment === null) return null;
    const validated = validateExperimentV2(experiment);
    const { contract: model, captureAdapter: adapter } = this.#requiredModelRuntimeV2(
      validated.content.modelId,
    );
    assertExperimentContentMatchesModelV2(validated.content, model);
    await assertExperimentCapturesMatchModelV2(
      validated.content,
      model,
      adapter,
    );
    return validated;
  }

  async readSnapshot(
    snapshotId: string,
  ): Promise<ExperimentSnapshotV2 | null> {
    const snapshot = this.#repository.readSnapshot(snapshotId);
    return snapshot === null
      ? null
      : await this.#validateRegisteredSnapshotV2(snapshot);
  }

  async saveExperiment(
    command: SaveExperimentCommandV2,
  ): Promise<ExperimentV2> {
    assertCommandKeysV2(
      command,
      [
        "experimentId",
        "expectedVersion",
        "desiredContent",
      ],
      ["captureCorrelation"],
      "SaveExperiment",
    );
    const current = await this.#requiredExperimentV2(command.experimentId);
    assertAuthoringVersionV2(current, command.expectedVersion);
    if (command.desiredContent.modelId !== current.content.modelId) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "modelId is fixed for an Experiment series",
      );
    }
    const runtime = this.#requiredModelRuntimeV2(
      current.content.modelId,
    );
    const { contract: model, captureAdapter: adapter } = runtime;
    const desiredContent = validateExperimentDesiredContentForModelV2(
      command.desiredContent,
      model,
    );
    assertExperimentDesiredFixturesMatchModelV2(
      desiredContent,
      model,
      adapter,
    );
    const hasCaptureCorrelation = Object.prototype.hasOwnProperty.call(
      command,
      "captureCorrelation",
    );
    const capturedContent = hasCaptureCorrelation
      ? await captureDesiredContentAtAcceptedBoundaryV2({
        runtime,
        experimentId: current.experimentId,
        desiredContent,
        captureCorrelation: command.captureCorrelation,
      })
      : reuseMatchingScenarioCapturesV2(current.content, desiredContent);
    const replacement = validateExperimentV2({
      schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
      experimentId: current.experimentId,
      version: current.version + 1,
      content: capturedContent,
    });
    assertCapturedDesiredContentV2(
      desiredContent,
      replacement.content,
      (message) => new StudioExperimentCaptureMutationErrorV2(message),
    );
    assertExperimentContentMatchesModelV2(replacement.content, model);
    await assertExperimentCapturesMatchModelV2(
      replacement.content,
      model,
      adapter,
    );
    this.#repository.replaceExperiment(
      command.expectedVersion,
      replacement,
    );
    return replacement;
  }

  async createSnapshot(
    command: CreateExperimentSnapshotCommandV2,
  ): Promise<ExperimentSnapshotV2> {
    assertCommandKeysV2(
      command,
      ["content", "surfaceReleaseId"],
      ["createdBy", "savedExperiment"],
      "CreateSnapshot",
    );
    if (
      Object.prototype.hasOwnProperty.call(command, "createdBy")
      && command.createdBy === undefined
    ) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "CreateSnapshot.createdBy must be omitted or contain an ID",
      );
    }
    const candidateContent = command.content;
    if (command.savedExperiment !== undefined) {
      assertCommandKeysV2(
        command.savedExperiment,
        ["experimentId", "expectedVersion"],
        [],
        "CreateSnapshot.savedExperiment",
      );
      const sourceExperiment = await this.#requiredExperimentV2(
        command.savedExperiment.experimentId,
      );
      assertAuthoringVersionV2(
        sourceExperiment,
        command.savedExperiment.expectedVersion,
      );
      assertSameAuthoredProjectionV2(
        sourceExperiment.content,
        candidateContent,
        (message) => new StudioExperimentAuthoringConflictErrorV2(
          `Snapshot candidate is not the clean saved Experiment head: ${message}`,
        ),
      );
    }
    const runtime = this.#requiredModelRuntimeV2(
      candidateContent.modelId,
    );
    const { contract: model, captureAdapter: adapter } = runtime;
    assertExperimentContentMatchesModelV2(
      candidateContent,
      model,
    );
    await assertExperimentCapturesMatchModelV2(
      candidateContent,
      model,
      adapter,
    );

    // Both Article Briefing and standalone publication pass through this one
    // Studio-owned boundary. Admission cannot manufacture a settled
    // replacement checkpoint.
    await studioSnapshotAdmissionServiceV1.admitFrozenCandidate({
      adapter: runtime.snapshotGate,
      model,
      content: candidateContent,
    });

    const snapshotId = this.#snapshotIds.nextSnapshotId();
    const snapshot = validateExperimentSnapshotV2({
      schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
      snapshotId,
      surfaceReleaseId: command.surfaceReleaseId,
      content: candidateContent,
      createdAt: this.#clock.nowIso(),
      ...(command.createdBy === undefined
        ? {}
        : { createdBy: command.createdBy }),
    });
    this.#admittedSnapshotCommit.commitSnapshot(snapshot);
    return snapshot;
  }

  async #requiredExperimentV2(
    experimentId: string,
  ): Promise<ExperimentV2> {
    const experiment = await this.readExperiment(experimentId);
    if (experiment === null) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `Experiment not found: ${experimentId}`,
      );
    }
    return experiment;
  }

  async #validateRegisteredSnapshotV2(
    snapshotValue: ExperimentSnapshotV2,
  ): Promise<ExperimentSnapshotV2> {
    const snapshot = validateExperimentSnapshotV2(snapshotValue);
    const { contract: model, captureAdapter: adapter } = this.#requiredModelRuntimeV2(
      snapshot.content.modelId,
    );
    assertExperimentContentMatchesModelV2(snapshot.content, model);
    await assertExperimentCapturesMatchModelV2(
      snapshot.content,
      model,
      adapter,
    );
    return snapshot;
  }

  #requiredModelRuntimeV2(modelId: string): ResolvedExactModelRuntimeV2 {
    const runtime = this.#models.resolveExactRuntime(modelId);
    assertModelContractV2(runtime.contract);
    assertCaptureAdapterMatchesModelV2(
      runtime.captureAdapter,
      runtime.contract,
    );
    if (
      runtime.contract.modelId !== modelId
      || runtime.experimentCapture.modelId !== modelId
      || runtime.experimentCapture.fixtureSchemaId
        !== runtime.contract.fixtureSchemaId
      || runtime.experimentCapture.checkpointCodecId
        !== runtime.contract.checkpointCodecId
      || typeof runtime.experimentCapture.captureAcceptedCandidate !== "function"
      || runtime.snapshotGate.modelId !== modelId
      || runtime.snapshotGate.snapshotGateId
        !== runtime.contract.snapshotGateId
      || typeof runtime.snapshotGate.admitFrozenCandidate !== "function"
      || runtime.fixtureAdapter.modelId !== modelId
      || runtime.fixtureAdapter.fixtureSchemaId
        !== runtime.contract.fixtureSchemaId
      || typeof runtime.fixtureAdapter.validateCompleteFixture !== "function"
      || runtime.simulationAdapter.modelId !== modelId
      || runtime.simulationAdapter.fixtureSchemaId
        !== runtime.contract.fixtureSchemaId
      || runtime.simulationAdapter.checkpointCodecId
        !== runtime.contract.checkpointCodecId
      || typeof runtime.simulationAdapter.createSession !== "function"
      || typeof runtime.simulationAdapter.disposeSession !== "function"
      || typeof runtime.simulationAdapter.currentFrame !== "function"
      || typeof runtime.simulationAdapter.advanceOnePresentationStep
        !== "function"
      || typeof runtime.simulationAdapter.applyControl !== "function"
      || typeof runtime.simulationAdapter.replaceFixture !== "function"
      || typeof runtime.simulationAdapter.currentInputEpoch !== "function"
    ) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `registered executable bundle does not exactly match model ${modelId}`,
      );
    }
    return runtime;
  }
}

async function captureDesiredContentAtAcceptedBoundaryV2(input: Readonly<{
  runtime: ResolvedExactModelRuntimeV2;
  experimentId: string;
  desiredContent: ExperimentDesiredContentV2;
  captureCorrelation: unknown;
}>): Promise<ExperimentContentV2> {
  const correlation = validateExperimentCaptureCorrelationV2(
    input.captureCorrelation,
    input.desiredContent,
  );
  const captureResult = await input.runtime.experimentCapture
    .captureAcceptedCandidate({
      experimentId: input.experimentId,
      model: input.runtime.contract,
      desiredContent: input.desiredContent,
      correlation,
    });
  assertExperimentCaptureResultEnvelopeV2(captureResult);
  validateExperimentCaptureConfirmationV2(captureResult.confirmation, {
    experimentId: input.experimentId,
    correlation,
  });
  if (Object.prototype.hasOwnProperty.call(
    captureResult.content,
    "surfaceSeriesId",
  )) {
    throw new StudioExperimentCaptureMutationErrorV2(
      "exact-model capture must not own surfaceSeriesId",
    );
  }
  // Surface identity is Studio-owned metadata. Exact-model capture adapters
  // freeze numerical Scenario state and the authored presentation projection;
  // they do not need to know which registry series supplied that projection.
  return {
    ...captureResult.content,
    surfaceSeriesId: input.desiredContent.surfaceSeriesId,
  };
}

/**
 * Presentation-only edits do not invalidate a Scenario's accepted numerical
 * state. Reuse is allowed only when every desired Scenario already exists and
 * retains an exactly equal complete fixture; any new or dirty fixture must be
 * captured by the live exact-model runtime.
 */
function reuseMatchingScenarioCapturesV2(
  current: ExperimentContentV2,
  desired: ExperimentDesiredContentV2,
): ExperimentContentV2 {
  const currentByScenarioId = new Map(
    current.scenarios.map((scenario) => [scenario.scenarioId, scenario]),
  );
  const scenarios = desired.scenarios.map((scenario) => {
    const persisted = currentByScenarioId.get(scenario.scenarioId);
    if (
      persisted === undefined
      || !samePortableValueV2(
        scenario.fixture,
        persisted.capture.fixture,
      )
    ) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "captureCorrelation is required when a Scenario is new or its fixture changed",
      );
    }
    return {
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      capture: {
        fixture: scenario.fixture,
        checkpoint: persisted.capture.checkpoint,
      },
    };
  });
  return {
    modelId: desired.modelId,
    surfaceSeriesId: desired.surfaceSeriesId,
    scenarios,
    surface: desired.surface,
  };
}

function assertExperimentCaptureResultEnvelopeV2(
  value: unknown,
): asserts value is Readonly<{
  content: ExperimentCapturedContentV2;
  confirmation: unknown;
}> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "confirmation,content"
  ) {
    throw new StudioExperimentCaptureMutationErrorV2(
      "result must contain exactly content and confirmation",
    );
  }
}

function assertCommandKeysV2(
  value: unknown,
  required: readonly string[],
  optional: readonly string[],
  commandName: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioExperimentAuthoringConflictErrorV2(
      `${commandName} command must be an object`,
    );
  }
  const actual = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) =>
    !Object.prototype.hasOwnProperty.call(value, key));
  const unknown = actual.filter((key) => !allowed.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    throw new StudioExperimentAuthoringConflictErrorV2(
      `${commandName} field set mismatch (missing: `
        + `${missing.join(", ") || "none"}; unknown: `
        + `${unknown.join(", ") || "none"})`,
    );
  }
}

function assertAuthoringVersionV2(
  experiment: ExperimentV2,
  expectedVersion: number,
): void {
  if (experiment.version !== expectedVersion) {
    throw new StudioExperimentAuthoringConflictErrorV2(
      `expected version ${expectedVersion}, `
        + `found ${experiment.version}`,
    );
  }
}

function assertCapturedDesiredContentV2(
  desired: ExperimentDesiredContentV2,
  captured: ExperimentContentV2,
  mutationError: (message: string) => Error,
): void {
  if (desired.modelId !== captured.modelId) {
    throw mutationError("modelId");
  }
  if (desired.surfaceSeriesId !== captured.surfaceSeriesId) {
    throw mutationError("surfaceSeriesId");
  }
  if (!samePortableValueV2(desired.surface, captured.surface)) {
    throw mutationError("Surface");
  }
  if (desired.scenarios.length !== captured.scenarios.length) {
    throw mutationError("Scenario count or order");
  }
  desired.scenarios.forEach((scenario, index) => {
    const capturedScenario = captured.scenarios[index];
    if (
      scenario.scenarioId !== capturedScenario.scenarioId
      || scenario.label !== capturedScenario.label
      || !samePortableValueV2(
        scenario.fixture,
        capturedScenario.capture.fixture,
      )
    ) {
      throw mutationError(
        `Scenario ${scenario.scenarioId} order, identity, label, or fixture`,
      );
    }
  });
}

function assertSameAuthoredProjectionV2(
  saved: ExperimentContentV2,
  candidate: ExperimentContentV2,
  mutationError: (message: string) => Error,
): void {
  if (saved.modelId !== candidate.modelId) {
    throw mutationError("modelId");
  }
  if (saved.surfaceSeriesId !== candidate.surfaceSeriesId) {
    throw mutationError("surfaceSeriesId");
  }
  if (!samePortableValueV2(saved.surface, candidate.surface)) {
    throw mutationError("Surface");
  }
  if (saved.scenarios.length !== candidate.scenarios.length) {
    throw mutationError("Scenario count");
  }
  saved.scenarios.forEach((scenario, index) => {
    const captured = candidate.scenarios[index];
    if (
      scenario.scenarioId !== captured.scenarioId
      || scenario.label !== captured.label
      || !samePortableValueV2(
        scenario.capture.fixture,
        captured.capture.fixture,
      )
    ) {
      throw mutationError(
        `Scenario ${scenario.scenarioId} identity, label, or fixture`,
      );
    }
  });
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

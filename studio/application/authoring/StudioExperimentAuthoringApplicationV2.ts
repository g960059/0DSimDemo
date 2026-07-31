import {
  assertExperimentCapturesMatchModelV2,
  assertExperimentContentMatchesModelV2,
  assertExperimentDesiredFixturesMatchModelV2,
  validateDraftCaptureConfirmationV2,
  validateDraftCaptureCorrelationV2,
  validateExperimentDesiredContentForModelV2,
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentSnapshotV2,
  type ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import type {
  CreateExperimentSnapshotCommandV2,
  CreateExperimentWorkspaceCommandV2,
  ExperimentDesiredContentV2,
  ExperimentSnapshotGateResultV2,
  ExperimentSnapshotIdFactoryPortV2,
  ForkExperimentWorkspaceCommandV2,
  RebaseExperimentDraftCommandV2,
  SaveExperimentDraftCommandV2,
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
  ExperimentDraftVersionV2,
  ExperimentSnapshotIdV2,
} from "@/studio/contracts/v2/ids";

export class StudioExperimentAuthoringConflictErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment authoring conflict: ${message}`);
    this.name = "StudioExperimentAuthoringConflictErrorV2";
  }
}

export class StudioExperimentSnapshotGateRejectedErrorV2 extends Error {
  constructor(reason: string) {
    super(`Studio Experiment Snapshot gate rejected: ${reason}`);
    this.name = "StudioExperimentSnapshotGateRejectedErrorV2";
  }
}

export class StudioExperimentSnapshotGateMutationErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment Snapshot gate changed authored content: ${message}`);
    this.name = "StudioExperimentSnapshotGateMutationErrorV2";
  }
}

export class StudioExperimentSnapshotGateProtocolErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment Snapshot gate returned an invalid result: ${message}`);
    this.name = "StudioExperimentSnapshotGateProtocolErrorV2";
  }
}

export class StudioExperimentDraftCaptureMutationErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio Experiment Draft capture changed authored content: ${message}`);
    this.name = "StudioExperimentDraftCaptureMutationErrorV2";
  }
}

type ExperimentWorkspaceStoreInternalV2 = Readonly<{
  readWorkspace(experimentId: string): ExperimentWorkspaceV2 | null;
  readSnapshot(snapshotId: string): ExperimentSnapshotV2 | null;
  createWorkspace(workspace: ExperimentWorkspaceV2): void;
  replaceWorkspace(
    expectedDraftVersion: ExperimentDraftVersionV2,
    workspace: ExperimentWorkspaceV2,
  ): void;
  rebaseWorkspace(input: Readonly<{
    expectedDraftVersion: ExperimentDraftVersionV2;
    expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
    targetSnapshotId: ExperimentSnapshotIdV2;
    workspace: ExperimentWorkspaceV2;
  }>): void;
}>;

type QualifiedSnapshotCommitInternalV2 = Readonly<{
  commitSnapshot(input: Readonly<{
    expectedDraftVersion: ExperimentDraftVersionV2;
    expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
    snapshot: ExperimentSnapshotV2;
    nextWorkspace: ExperimentWorkspaceV2;
  }>): void;
}>;

/**
 * Command boundary for the V2 mutable-workspace / immutable-Snapshot model.
 *
 * `saveDraft` accepts checkpoint-free desired content. Fixture-changing Saves
 * delegate complete accepted-boundary capture to the exact model runtime;
 * Surface/label/order-only Saves reuse the current matching checkpoints. The
 * gate owns settlement and minimum numerical verification; this application
 * owns frozen-candidate identity, lineage, and atomic repository visibility.
 */
export class StudioExperimentAuthoringApplicationV2 {
  readonly #repository: ExperimentWorkspaceStoreInternalV2;
  readonly #qualifiedSnapshotCommit: QualifiedSnapshotCommitInternalV2;
  readonly #models: ExactModelRuntimeResolverPortV2;
  readonly #snapshotIds: ExperimentSnapshotIdFactoryPortV2;
  readonly #clock: StudioClockPortV2;

  constructor(input: Readonly<{
    repository: ExperimentWorkspaceStoreInternalV2;
    qualifiedSnapshotCommit: QualifiedSnapshotCommitInternalV2;
    models: ExactModelRuntimeResolverPortV2;
    snapshotIds: ExperimentSnapshotIdFactoryPortV2;
    clock: StudioClockPortV2;
  }>) {
    this.#repository = input.repository;
    this.#qualifiedSnapshotCommit = input.qualifiedSnapshotCommit;
    this.#models = input.models;
    this.#snapshotIds = input.snapshotIds;
    this.#clock = input.clock;
  }

  async createWorkspace(
    command: CreateExperimentWorkspaceCommandV2,
  ): Promise<ExperimentWorkspaceV2> {
    assertCommandKeysV2(
      command,
      ["experimentId", "content"],
      [],
      "CreateWorkspace",
    );
    const workspace = validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: command.experimentId,
      draftVersion: 0,
      headSnapshotId: null,
      basedOnSnapshotId: null,
      content: command.content,
    });
    const { contract: model, captureAdapter: adapter } = this.#requiredModelRuntimeV2(
      workspace.content.modelId,
    );
    assertExperimentContentMatchesModelV2(workspace.content, model);
    await assertExperimentCapturesMatchModelV2(
      workspace.content,
      model,
      adapter,
    );
    this.#repository.createWorkspace(workspace);
    return workspace;
  }

  async forkWorkspace(
    command: ForkExperimentWorkspaceCommandV2,
  ): Promise<ExperimentWorkspaceV2> {
    assertCommandKeysV2(
      command,
      ["experimentId", "sourceSnapshotId"],
      [],
      "ForkWorkspace",
    );
    const sourceValue = this.#repository.readSnapshot(command.sourceSnapshotId);
    if (sourceValue === null) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `fork source Snapshot not found: ${command.sourceSnapshotId}`,
      );
    }
    const source = await this.#validateRegisteredSnapshotV2(sourceValue);
    const workspace = validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: command.experimentId,
      draftVersion: 0,
      headSnapshotId: null,
      basedOnSnapshotId: source.snapshotId,
      content: source.content,
    });
    this.#repository.createWorkspace(workspace);
    return workspace;
  }

  async readWorkspace(
    experimentId: string,
  ): Promise<ExperimentWorkspaceV2 | null> {
    const workspace = this.#repository.readWorkspace(experimentId);
    if (workspace === null) return null;
    const validated = validateExperimentWorkspaceV2(workspace);
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

  async saveDraft(
    command: SaveExperimentDraftCommandV2,
  ): Promise<ExperimentWorkspaceV2> {
    assertCommandKeysV2(
      command,
      [
        "experimentId",
        "expectedDraftVersion",
        "desiredContent",
      ],
      ["captureCorrelation"],
      "SaveDraft",
    );
    const current = await this.#requiredWorkspaceV2(command.experimentId);
    assertAuthoringVersionV2(current, command.expectedDraftVersion);
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
    const replacement = validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: current.experimentId,
      draftVersion: current.draftVersion + 1,
      headSnapshotId: current.headSnapshotId,
      basedOnSnapshotId: current.basedOnSnapshotId,
      content: capturedContent,
    });
    assertCapturedDesiredContentV2(
      desiredContent,
      replacement.content,
      (message) => new StudioExperimentDraftCaptureMutationErrorV2(message),
    );
    assertExperimentContentMatchesModelV2(replacement.content, model);
    await assertExperimentCapturesMatchModelV2(
      replacement.content,
      model,
      adapter,
    );
    this.#repository.replaceWorkspace(
      command.expectedDraftVersion,
      replacement,
    );
    return replacement;
  }

  async rebaseDraft(
    command: RebaseExperimentDraftCommandV2,
  ): Promise<ExperimentWorkspaceV2> {
    assertCommandKeysV2(
      command,
      [
        "experimentId",
        "expectedDraftVersion",
        "expectedHeadSnapshotId",
        "targetSnapshotId",
        "content",
      ],
      [],
      "RebaseDraft",
    );
    const current = await this.#requiredWorkspaceV2(command.experimentId);
    assertAuthoringVersionV2(current, command.expectedDraftVersion);
    if (current.headSnapshotId !== command.expectedHeadSnapshotId) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "headSnapshotId does not match the caller's expected head",
      );
    }
    const targetValue = this.#repository.readSnapshot(command.targetSnapshotId);
    if (targetValue === null) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `rebase target Snapshot not found: ${command.targetSnapshotId}`,
      );
    }
    const target = await this.#validateRegisteredSnapshotV2(targetValue);
    const { contract: model, captureAdapter: adapter } = this.#requiredModelRuntimeV2(
      current.content.modelId,
    );
    if (
      target.content.modelId !== model.modelId
      || command.content.modelId !== model.modelId
    ) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "rebase target and resolved content must use the Experiment's exact modelId",
      );
    }
    const replacement = validateExperimentWorkspaceV2({
      ...current,
      draftVersion: current.draftVersion + 1,
      basedOnSnapshotId: target.snapshotId,
      content: command.content,
    });
    assertExperimentContentMatchesModelV2(replacement.content, model);
    await assertExperimentCapturesMatchModelV2(
      replacement.content,
      model,
      adapter,
    );
    this.#repository.rebaseWorkspace({
      expectedDraftVersion: command.expectedDraftVersion,
      expectedHeadSnapshotId: command.expectedHeadSnapshotId,
      targetSnapshotId: target.snapshotId,
      workspace: replacement,
    });
    return replacement;
  }

  async createSnapshot(
    command: CreateExperimentSnapshotCommandV2,
  ): Promise<ExperimentSnapshotV2> {
    assertCommandKeysV2(
      command,
      [
        "experimentId",
        "expectedDraftVersion",
        "expectedHeadSnapshotId",
      ],
      ["createdBy"],
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
    const candidateWorkspace = await this.#requiredWorkspaceV2(
      command.experimentId,
    );
    assertAuthoringVersionV2(
      candidateWorkspace,
      command.expectedDraftVersion,
    );
    if (
      candidateWorkspace.headSnapshotId
      !== command.expectedHeadSnapshotId
    ) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        "headSnapshotId does not match the caller's expected head",
      );
    }
    const runtime = this.#requiredModelRuntimeV2(
      candidateWorkspace.content.modelId,
    );
    const { contract: model, captureAdapter: adapter } = runtime;
    assertExperimentContentMatchesModelV2(
      candidateWorkspace.content,
      model,
    );
    await assertExperimentCapturesMatchModelV2(
      candidateWorkspace.content,
      model,
      adapter,
    );

    // The repository owns an already detached/frozen workspace. The gate
    // therefore receives the exact immutable candidate that this command
    // intends to publish, never a mutable live-session projection.
    const gateResult = await runtime.snapshotGate.qualifyFrozenCandidate({
      model,
      content: candidateWorkspace.content,
    });
    assertSnapshotGateResultEnvelopeV2(gateResult);
    if (gateResult.status === "rejected") {
      throw new StudioExperimentSnapshotGateRejectedErrorV2(
        gateResult.reason,
      );
    }

    const qualifiedWorkspace = validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: candidateWorkspace.experimentId,
      draftVersion: candidateWorkspace.draftVersion + 1,
      headSnapshotId: candidateWorkspace.headSnapshotId,
      basedOnSnapshotId: candidateWorkspace.basedOnSnapshotId,
      content: gateResult.qualifiedContent,
    });
    assertExperimentContentMatchesModelV2(
      qualifiedWorkspace.content,
      model,
    );
    await assertExperimentCapturesMatchModelV2(
      qualifiedWorkspace.content,
      model,
      adapter,
    );
    assertChangedCheckpointsOnlyV2(
      candidateWorkspace.content,
      qualifiedWorkspace.content,
      (message) => new StudioExperimentSnapshotGateMutationErrorV2(message),
    );

    const snapshotId = this.#snapshotIds.nextSnapshotId();
    const snapshot = validateExperimentSnapshotV2({
      schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
      snapshotId,
      experimentId: candidateWorkspace.experimentId,
      parentSnapshotId: candidateWorkspace.basedOnSnapshotId,
      content: qualifiedWorkspace.content,
      createdAt: this.#clock.nowIso(),
      ...(command.createdBy === undefined
        ? {}
        : { createdBy: command.createdBy }),
    });
    const nextWorkspace = validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: candidateWorkspace.experimentId,
      draftVersion: candidateWorkspace.draftVersion + 1,
      headSnapshotId: snapshot.snapshotId,
      basedOnSnapshotId: snapshot.snapshotId,
      content: snapshot.content,
    });

    this.#qualifiedSnapshotCommit.commitSnapshot({
      expectedDraftVersion: command.expectedDraftVersion,
      expectedHeadSnapshotId: command.expectedHeadSnapshotId,
      snapshot,
      nextWorkspace,
    });
    return snapshot;
  }

  async #requiredWorkspaceV2(
    experimentId: string,
  ): Promise<ExperimentWorkspaceV2> {
    const workspace = await this.readWorkspace(experimentId);
    if (workspace === null) {
      throw new StudioExperimentAuthoringConflictErrorV2(
        `workspace not found: ${experimentId}`,
      );
    }
    return workspace;
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
      || runtime.draftCapture.modelId !== modelId
      || runtime.draftCapture.fixtureSchemaId
        !== runtime.contract.fixtureSchemaId
      || runtime.draftCapture.checkpointCodecId
        !== runtime.contract.checkpointCodecId
      || typeof runtime.draftCapture.captureAcceptedCandidate !== "function"
      || runtime.snapshotGate.modelId !== modelId
      || runtime.snapshotGate.snapshotGateId
        !== runtime.contract.snapshotGateId
      || typeof runtime.snapshotGate.qualifyFrozenCandidate !== "function"
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
  const correlation = validateDraftCaptureCorrelationV2(
    input.captureCorrelation,
    input.desiredContent,
  );
  const captureResult = await input.runtime.draftCapture
    .captureAcceptedCandidate({
      experimentId: input.experimentId,
      model: input.runtime.contract,
      desiredContent: input.desiredContent,
      correlation,
    });
  assertDraftCaptureResultEnvelopeV2(captureResult);
  validateDraftCaptureConfirmationV2(captureResult.confirmation, {
    experimentId: input.experimentId,
    correlation,
  });
  return captureResult.content;
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
    scenarios,
    surface: desired.surface,
  };
}

function assertDraftCaptureResultEnvelopeV2(
  value: unknown,
): asserts value is Readonly<{ content: ExperimentContentV2; confirmation: unknown }> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "confirmation,content"
  ) {
    throw new StudioExperimentDraftCaptureMutationErrorV2(
      "result must contain exactly content and confirmation",
    );
  }
}

function assertSnapshotGateResultEnvelopeV2(
  value: unknown,
): asserts value is ExperimentSnapshotGateResultV2 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new StudioExperimentSnapshotGateProtocolErrorV2(
      "result must be an object",
    );
  }
  const record = value as Record<string, unknown>;
  if (record.status === "passed") {
    assertGateResultKeysV2(record, ["status", "qualifiedContent"]);
    return;
  }
  if (record.status === "rejected") {
    assertGateResultKeysV2(record, ["status", "reason"]);
    if (
      typeof record.reason !== "string"
      || record.reason.trim().length === 0
    ) {
      throw new StudioExperimentSnapshotGateProtocolErrorV2(
        "rejected result must contain a non-empty reason",
      );
    }
    return;
  }
  throw new StudioExperimentSnapshotGateProtocolErrorV2(
    'status must be exactly "passed" or "rejected"',
  );
}

function assertGateResultKeysV2(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new StudioExperimentSnapshotGateProtocolErrorV2(
      `fields must be exactly ${required.join(", ")}`,
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
  workspace: ExperimentWorkspaceV2,
  expectedDraftVersion: number,
): void {
  if (workspace.draftVersion !== expectedDraftVersion) {
    throw new StudioExperimentAuthoringConflictErrorV2(
      `expected draftVersion ${expectedDraftVersion}, `
        + `found ${workspace.draftVersion}`,
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

function assertChangedCheckpointsOnlyV2(
  candidate: ExperimentContentV2,
  qualified: ExperimentContentV2,
  mutationError: (message: string) => Error,
): void {
  if (candidate.modelId !== qualified.modelId) {
    throw mutationError("modelId");
  }
  if (!samePortableValueV2(candidate.surface, qualified.surface)) {
    throw mutationError("Surface");
  }
  if (candidate.scenarios.length !== qualified.scenarios.length) {
    throw mutationError("Scenario count");
  }
  candidate.scenarios.forEach((scenario, index) => {
    const settled = qualified.scenarios[index];
    if (
      scenario.scenarioId !== settled.scenarioId
      || scenario.label !== settled.label
      || !samePortableValueV2(
        scenario.capture.fixture,
        settled.capture.fixture,
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

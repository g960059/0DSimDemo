import {
  EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID,
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  type ArtifactStorePortV1,
  type ExactSignalReplayRecipeV1,
  type ReplayOriginArtifactRefV1,
  type RunArtifactRefV1,
  type RuntimeExecutionIdentityV1,
  type SimulationInputRefV1,
  type SnapshotEnvelopeRefV1,
  type StudioJsonValueV1,
} from "@/studio/contracts/v1";

export const MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_SCHEMA_ID =
  "circleheart-main-wire-exact-signal-replay-origin-envelope-v1" as const;
export const MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_MEDIA_TYPE =
  "application/vnd.circleheart.main-wire-exact-signal-replay-origin.v1+json" as const;

export type MainWireExactSignalReplayOriginCorrelationV1 = Readonly<{
  originKind:
    | "opened-run"
    | "live-transition"
    | "promoted-steady-candidate";
  sessionId: string;
  scenarioId: string;
  liveBranchId: string;
  targetGeneration: number;
  presentationRevision: number;
  candidateId: string | null;
}>;

export type MainWireExactSignalReplayOriginEnvelopeContentV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_SCHEMA_ID;
  schemaVersion: 1;
  correlation: MainWireExactSignalReplayOriginCorrelationV1;
  sourceRunRef: RunArtifactRefV1;
  recipe: ExactSignalReplayRecipeV1;
}>;

/**
 * Adapter-owned lookup entry. The selector is duplicated only for bounded
 * in-memory indexing; the strict loader rechecks it against the CAS envelope
 * before replay, so it cannot assert a different generation or presentation.
 */
export type MainWireRetainedExactSignalReplayOriginV1 = Readonly<{
  originRef: ReplayOriginArtifactRefV1;
  correlation: MainWireExactSignalReplayOriginCorrelationV1;
  recipe: ExactSignalReplayRecipeV1;
}>;

export class MainWireExactSignalReplayOriginValidationErrorV1
extends Error {
  constructor(message: string) {
    super(`MainWire exact replay origin rejected: ${message}`);
    this.name = "MainWireExactSignalReplayOriginValidationErrorV1";
  }
}

export async function putMainWireExactSignalReplayOriginEnvelopeV1(
  artifacts: ArtifactStorePortV1,
  input: Readonly<{
    correlation: MainWireExactSignalReplayOriginCorrelationV1;
    sourceRunRef: RunArtifactRefV1;
    simulationInputRef: SimulationInputRefV1;
    replayCheckpointRef: SnapshotEnvelopeRefV1;
    targetInputSha256: string;
    execution: RuntimeExecutionIdentityV1;
    boundaryRevision: number;
    boundaryTimeSec: number;
    cycleLengthSec: number;
  }>,
): Promise<MainWireRetainedExactSignalReplayOriginV1> {
  const content = loadMainWireExactSignalReplayOriginEnvelopeV1({
    schemaId:
      MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_SCHEMA_ID,
    schemaVersion: 1,
    correlation: input.correlation,
    sourceRunRef: input.sourceRunRef,
    recipe: {
      schemaId: EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID,
      schemaVersion: 1,
      simulationInputRef: input.simulationInputRef,
      replayCheckpointRef: input.replayCheckpointRef,
      targetInputSha256: input.targetInputSha256,
      execution: input.execution,
      boundaryRevision: input.boundaryRevision,
      boundaryTimeSec: input.boundaryTimeSec,
      cycleLengthSec: input.cycleLengthSec,
    },
  });
  const ref = await artifacts.putJson({
    kind: "replay-origin",
    mediaType:
      MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_MEDIA_TYPE,
    content: content as unknown as StudioJsonValueV1,
  });
  if (ref.kind !== "replay-origin") {
    throw originErrorV1("artifact store returned the wrong artifact kind");
  }
  return Object.freeze({
    originRef: ref as ReplayOriginArtifactRefV1,
    correlation: content.correlation,
    recipe: content.recipe,
  });
}

export function loadMainWireExactSignalReplayOriginEnvelopeV1(
  value: unknown,
): MainWireExactSignalReplayOriginEnvelopeContentV1 {
  const envelope = recordV1(value, "envelope");
  assertExactKeysV1(envelope, [
    "schemaId",
    "schemaVersion",
    "correlation",
    "sourceRunRef",
    "recipe",
  ], "envelope");
  if (
    envelope.schemaId
      !== MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_SCHEMA_ID
    || envelope.schemaVersion !== 1
  ) throw originErrorV1("schema identity mismatch");

  const correlationValue = recordV1(
    envelope.correlation,
    "correlation",
  );
  assertExactKeysV1(correlationValue, [
    "originKind",
    "sessionId",
    "scenarioId",
    "liveBranchId",
    "targetGeneration",
    "presentationRevision",
    "candidateId",
  ], "correlation");
  const originKind = correlationValue.originKind;
  if (
    originKind !== "opened-run"
    && originKind !== "live-transition"
    && originKind !== "promoted-steady-candidate"
  ) throw originErrorV1("origin kind is invalid");
  const ids = [
    correlationValue.sessionId,
    correlationValue.scenarioId,
    correlationValue.liveBranchId,
  ];
  if (
    ids.some((entry) =>
      typeof entry !== "string"
      || entry.trim().length === 0
      || entry.trim() !== entry
    )
    || !nonnegativeSafeIntegerV1(correlationValue.targetGeneration)
    || !nonnegativeSafeIntegerV1(correlationValue.presentationRevision)
    || (
      originKind === "promoted-steady-candidate"
        ? typeof correlationValue.candidateId !== "string"
          || correlationValue.candidateId.trim().length === 0
        : correlationValue.candidateId !== null
    )
  ) throw originErrorV1("correlation identity is invalid");
  const correlation = Object.freeze({
    originKind,
    sessionId: correlationValue.sessionId as string,
    scenarioId: correlationValue.scenarioId as string,
    liveBranchId: correlationValue.liveBranchId as string,
    targetGeneration: correlationValue.targetGeneration as number,
    presentationRevision:
      correlationValue.presentationRevision as number,
    candidateId: correlationValue.candidateId as string | null,
  });

  const sourceRunRef = loadArtifactRefV1(
    envelope.sourceRunRef,
    "run-artifact",
    "sourceRunRef",
  );
  const recipeValue = recordV1(envelope.recipe, "recipe");
  assertExactKeysV1(recipeValue, [
    "schemaId",
    "schemaVersion",
    "simulationInputRef",
    "replayCheckpointRef",
    "targetInputSha256",
    "execution",
    "boundaryRevision",
    "boundaryTimeSec",
    "cycleLengthSec",
  ], "recipe");
  if (
    recipeValue.schemaId !== EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID
    || recipeValue.schemaVersion !== 1
    || typeof recipeValue.targetInputSha256 !== "string"
    || !SHA256_HEX_PATTERN_V1.test(recipeValue.targetInputSha256)
    || !nonnegativeSafeIntegerV1(recipeValue.boundaryRevision)
    || !finiteNonnegativeV1(recipeValue.boundaryTimeSec)
    || typeof recipeValue.cycleLengthSec !== "number"
    || !Number.isFinite(recipeValue.cycleLengthSec)
    || recipeValue.cycleLengthSec <= 0
  ) throw originErrorV1("recipe identity is invalid");
  const execution = loadExecutionIdentityV1(recipeValue.execution);
  const recipe = Object.freeze({
    schemaId: EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    simulationInputRef: loadArtifactRefV1(
      recipeValue.simulationInputRef,
      "simulation-input",
      "recipe.simulationInputRef",
    ),
    replayCheckpointRef: loadArtifactRefV1(
      recipeValue.replayCheckpointRef,
      "snapshot-envelope",
      "recipe.replayCheckpointRef",
    ),
    targetInputSha256: recipeValue.targetInputSha256,
    execution,
    boundaryRevision: recipeValue.boundaryRevision as number,
    boundaryTimeSec: recipeValue.boundaryTimeSec as number,
    cycleLengthSec: recipeValue.cycleLengthSec as number,
  }) satisfies ExactSignalReplayRecipeV1;
  return Object.freeze({
    schemaId:
      MAIN_WIRE_EXACT_SIGNAL_REPLAY_ORIGIN_ENVELOPE_V1_SCHEMA_ID,
    schemaVersion: 1 as const,
    correlation,
    sourceRunRef,
    recipe,
  });
}

export function sameMainWireReplayOriginCorrelationV1(
  left: MainWireExactSignalReplayOriginCorrelationV1,
  right: MainWireExactSignalReplayOriginCorrelationV1,
): boolean {
  return left.originKind === right.originKind
    && left.sessionId === right.sessionId
    && left.scenarioId === right.scenarioId
    && left.liveBranchId === right.liveBranchId
    && left.targetGeneration === right.targetGeneration
    && left.presentationRevision === right.presentationRevision
    && left.candidateId === right.candidateId;
}

export function sameMainWireExactSignalReplayRecipeV1(
  left: ExactSignalReplayRecipeV1,
  right: ExactSignalReplayRecipeV1,
): boolean {
  return left.schemaId === right.schemaId
    && left.schemaVersion === right.schemaVersion
    && sameArtifactRefV1(
      left.simulationInputRef,
      right.simulationInputRef,
    )
    && sameArtifactRefV1(
      left.replayCheckpointRef,
      right.replayCheckpointRef,
    )
    && left.targetInputSha256 === right.targetInputSha256
    && sameExecutionIdentityV1(left.execution, right.execution)
    && left.boundaryRevision === right.boundaryRevision
    && left.boundaryTimeSec === right.boundaryTimeSec
    && left.cycleLengthSec === right.cycleLengthSec;
}

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;

function loadExecutionIdentityV1(
  value: unknown,
): RuntimeExecutionIdentityV1 {
  const execution = recordV1(value, "recipe.execution");
  assertExactKeysV1(execution, [
    "modelRef",
    "runtimeRef",
    "solverRef",
    "stateCodecRef",
    "protocolRef",
  ], "recipe.execution");
  if (
    Object.values(execution).some((entry) =>
      typeof entry !== "string"
      || entry.trim().length === 0
      || entry.trim() !== entry
    )
  ) throw originErrorV1("execution identity is invalid");
  return Object.freeze({
    modelRef: execution.modelRef as string,
    runtimeRef: execution.runtimeRef as string,
    solverRef: execution.solverRef as string,
    stateCodecRef: execution.stateCodecRef as string,
    protocolRef: execution.protocolRef as string,
  });
}

function loadArtifactRefV1<
  TKind extends "run-artifact" | "simulation-input" | "snapshot-envelope",
>(
  value: unknown,
  expectedKind: TKind,
  label: string,
): TKind extends "run-artifact"
  ? RunArtifactRefV1
  : TKind extends "simulation-input"
    ? SimulationInputRefV1
    : SnapshotEnvelopeRefV1 {
  const ref = recordV1(value, label);
  assertExactKeysV1(ref, [
    "schemaId",
    "kind",
    "sha256",
    "mediaType",
    "byteLength",
  ], label);
  if (
    ref.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== expectedKind
    || typeof ref.sha256 !== "string"
    || !SHA256_HEX_PATTERN_V1.test(ref.sha256)
    || typeof ref.mediaType !== "string"
    || ref.mediaType.trim().length === 0
    || ref.mediaType.trim() !== ref.mediaType
    || !nonnegativeSafeIntegerV1(ref.byteLength)
  ) throw originErrorV1(`${label} is invalid`);
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: expectedKind,
    sha256: ref.sha256,
    mediaType: ref.mediaType,
    byteLength: ref.byteLength as number,
  }) as unknown as TKind extends "run-artifact"
    ? RunArtifactRefV1
    : TKind extends "simulation-input"
      ? SimulationInputRefV1
      : SnapshotEnvelopeRefV1;
}

function sameArtifactRefV1(
  left: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
  right: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function sameExecutionIdentityV1(
  left: RuntimeExecutionIdentityV1,
  right: RuntimeExecutionIdentityV1,
): boolean {
  return left.modelRef === right.modelRef
    && left.runtimeRef === right.runtimeRef
    && left.solverRef === right.solverRef
    && left.stateCodecRef === right.stateCodecRef
    && left.protocolRef === right.protocolRef;
}

function recordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw originErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeysV1(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) throw originErrorV1(`${label} fields mismatch`);
}

function nonnegativeSafeIntegerV1(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function finiteNonnegativeV1(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= 0;
}

function originErrorV1(
  message: string,
): MainWireExactSignalReplayOriginValidationErrorV1 {
  return new MainWireExactSignalReplayOriginValidationErrorV1(message);
}

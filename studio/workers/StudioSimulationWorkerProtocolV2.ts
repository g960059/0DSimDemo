import type {
  ExperimentScenarioV2,
  ExperimentSnapshotV2,
  ExperimentSurfaceV2,
  ExperimentWorkspaceV2,
  ScenarioCheckpointV2,
  ScenarioPresetV2,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  validateScenarioCaptureV2,
  validateScenarioPresetV2,
  validateExperimentSnapshotV2,
  validateExperimentWorkspaceV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type {
  StudioJsonValueV2,
} from "@/studio/contracts/v2/json";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  validateStudioSimulationAnalysisV2,
  validateStudioSimulationFrameV2,
  validateStudioSimulationPortableIdV2,
  validateStudioSimulationScenarioInputV2,
} from "@/studio/contracts/v2/simulation";

export const STUDIO_SIMULATION_WORKER_PROTOCOL_V2 =
  "circleheart-studio-simulation-worker-protocol-v2" as const;
export const STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2 = 16;

export type StudioSimulationWorkerAuthoringSeedV2 = Readonly<{
  workspace?: ExperimentWorkspaceV2;
  snapshots?: readonly ExperimentSnapshotV2[];
}>;

export type StudioSimulationWorkerInitializeInputV2 = Readonly<{
  expectedModelId: string;
  runtimeSessionId: string;
  scenarioId: string;
  scenarioLabel: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
  authoringSeed?: StudioSimulationWorkerAuthoringSeedV2;
}>;

export type StudioSimulationWorkerAdvanceInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  stepCount: number;
}>;

export type StudioSimulationWorkerApplyControlInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  controlId: string;
  value: number;
  expectedInputEpoch: number;
}>;

export type StudioSimulationWorkerRequestAnalysisInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  analysisId: string;
  expectedInputEpoch: number;
  expectedAcceptedRevision: number;
  expectedAcceptedTimeSec: number;
}>;

export type StudioSimulationWorkerSaveDraftInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  experimentId: string;
  surface: ExperimentSurfaceV2;
  expectedDraftVersion: number | null;
}>;

export type StudioSimulationWorkerScenarioDescriptorV2 = Readonly<{
  scenarioId: string;
  label: string;
}>;

export type StudioSimulationWorkerScenarioStateV2 = Readonly<{
  activeScenarioId: string;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  frame: StudioSimulationFrameV2;
}>;

export type StudioSimulationWorkerScenarioCapturesV2 = Readonly<{
  activeScenarioId: string;
  scenarios: readonly ExperimentScenarioV2[];
}>;

export type StudioSimulationWorkerAddScenarioFromPresetInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  label: string;
  preset: ScenarioPresetV2;
}>;

export type StudioSimulationWorkerDuplicateScenarioInputV2 = Readonly<{
  runtimeSessionId: string;
  sourceScenarioId: string;
  scenarioId: string;
  label: string;
}>;

export type StudioSimulationWorkerRenameScenarioInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  label: string;
}>;

export type StudioSimulationWorkerDeleteScenarioInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
}>;

export type StudioSimulationWorkerSelectScenarioInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
}>;

export type StudioSimulationWorkerReadScenariosInputV2 = Readonly<{
  runtimeSessionId: string;
}>;

export type StudioSimulationWorkerCreateSnapshotInputV2 = Readonly<{
  runtimeSessionId: string;
  scenarioId: string;
  experimentId: string;
  expectedDraftVersion: number;
  expectedHeadSnapshotId: string | null;
}>;

export type StudioSimulationWorkerRequestV2 =
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "initialize";
      expectedModelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      scenarioLabel: string;
      fixture: StudioJsonValueV2;
      checkpoint?: ScenarioCheckpointV2;
      authoringSeed?: StudioSimulationWorkerAuthoringSeedV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "advance";
      runtimeSessionId: string;
      scenarioId: string;
      stepCount: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "apply-control";
      runtimeSessionId: string;
      scenarioId: string;
      controlId: string;
      value: number;
      expectedInputEpoch: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "request-analysis";
      runtimeSessionId: string;
      scenarioId: string;
      analysisId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "save-draft";
      runtimeSessionId: string;
      scenarioId: string;
      experimentId: string;
      surface: ExperimentSurfaceV2;
      expectedDraftVersion: number | null;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "read-scenarios";
      runtimeSessionId: string;
      expectedActiveScenarioId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "select-scenario";
      runtimeSessionId: string;
      scenarioId: string;
      expectedActiveScenarioId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "add-scenario-from-preset";
      runtimeSessionId: string;
      scenarioId: string;
      label: string;
      preset: ScenarioPresetV2;
      expectedActiveScenarioId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "duplicate-scenario";
      runtimeSessionId: string;
      sourceScenarioId: string;
      scenarioId: string;
      label: string;
      expectedActiveScenarioId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "rename-scenario";
      runtimeSessionId: string;
      scenarioId: string;
      label: string;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "delete-scenario";
      runtimeSessionId: string;
      scenarioId: string;
      expectedActiveScenarioId: string;
      expectedInputEpoch: number;
      expectedAcceptedRevision: number;
      expectedAcceptedTimeSec: number;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "create-snapshot";
      runtimeSessionId: string;
      scenarioId: string;
      experimentId: string;
      expectedDraftVersion: number;
      expectedHeadSnapshotId: string | null;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "dispose";
      runtimeSessionId: string;
    }>;

export type StudioSimulationWorkerResponseV2 =
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "initialized";
      frame: StudioSimulationFrameV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "advanced";
      frames: readonly StudioSimulationFrameV2[];
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "control-applied";
      frame: StudioSimulationFrameV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "analysis-result";
      analysis: StudioSimulationAnalysisV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "scenario-state";
      state: StudioSimulationWorkerScenarioStateV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "scenarios-captured";
      captures: StudioSimulationWorkerScenarioCapturesV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "draft-saved";
      workspace: ExperimentWorkspaceV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "snapshot-created";
      snapshot: ExperimentSnapshotV2;
      workspace: ExperimentWorkspaceV2;
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "ok";
      kind: "disposed";
    }>
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      status: "error";
      fatal: boolean;
      message: string;
    }>;

export class StudioSimulationWorkerProtocolErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio simulation worker V2 rejected ${path}: ${message}`);
    this.name = "StudioSimulationWorkerProtocolErrorV2";
  }
}

export function createStudioSimulationInitializeRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "initialize" }> {
  const input = exactDataRecordV2(value, [
    "expectedModelId",
    "fixture",
    "runtimeSessionId",
    "scenarioId",
    "scenarioLabel",
  ], ["authoringSeed", "checkpoint"], "$.initialize");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "initialize",
    expectedModelId: input.expectedModelId,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    scenarioLabel: input.scenarioLabel,
    fixture: input.fixture,
    ...(Object.prototype.hasOwnProperty.call(input, "checkpoint")
      ? { checkpoint: input.checkpoint }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "authoringSeed")
      ? { authoringSeed: input.authoringSeed }
      : {}),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "initialize" }>;
}

export function createStudioSimulationAdvanceRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "advance" }> {
  const input = exactDataRecordV2(value, [
    "runtimeSessionId",
    "scenarioId",
    "stepCount",
  ], [], "$.advance");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "advance",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    stepCount: input.stepCount,
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "advance" }>;
}

export function createStudioSimulationApplyControlRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "apply-control" }> {
  const input = exactDataRecordV2(value, [
    "controlId",
    "expectedInputEpoch",
    "runtimeSessionId",
    "scenarioId",
    "value",
  ], [], "$.applyControl");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "apply-control",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    controlId: input.controlId,
    value: input.value,
    expectedInputEpoch: input.expectedInputEpoch,
  }) as Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "apply-control" }
  >;
}

export function createStudioSimulationRequestAnalysisRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "request-analysis" }> {
  const input = exactDataRecordV2(value, [
    "analysisId",
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedInputEpoch",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.requestAnalysis");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "request-analysis",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    analysisId: input.analysisId,
    expectedInputEpoch: input.expectedInputEpoch,
    expectedAcceptedRevision: input.expectedAcceptedRevision,
    expectedAcceptedTimeSec: input.expectedAcceptedTimeSec,
  }) as Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "request-analysis" }
  >;
}

export function createStudioSimulationSaveDraftRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "save-draft" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedDraftVersion",
    "expectedInputEpoch",
    "experimentId",
    "runtimeSessionId",
    "scenarioId",
    "surface",
  ], [], "$.saveDraft");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "save-draft",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    experimentId: input.experimentId,
    surface: input.surface,
    expectedDraftVersion: input.expectedDraftVersion,
    expectedInputEpoch: input.expectedInputEpoch,
    expectedAcceptedRevision: input.expectedAcceptedRevision,
    expectedAcceptedTimeSec: input.expectedAcceptedTimeSec,
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "save-draft" }>;
}

function activeBoundaryCorrelationFieldsV2(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return {
    expectedActiveScenarioId: input.expectedActiveScenarioId,
    expectedInputEpoch: input.expectedInputEpoch,
    expectedAcceptedRevision: input.expectedAcceptedRevision,
    expectedAcceptedTimeSec: input.expectedAcceptedTimeSec,
  };
}

export function createStudioSimulationReadScenariosRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "read-scenarios" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedActiveScenarioId",
    "expectedInputEpoch",
    "runtimeSessionId",
  ], [], "$.readScenarios");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "read-scenarios",
    runtimeSessionId: input.runtimeSessionId,
    ...activeBoundaryCorrelationFieldsV2(input),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "read-scenarios" }>;
}

export function createStudioSimulationSelectScenarioRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "select-scenario" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedActiveScenarioId",
    "expectedInputEpoch",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.selectScenario");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "select-scenario",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    ...activeBoundaryCorrelationFieldsV2(input),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "select-scenario" }>;
}

export function createStudioSimulationAddScenarioFromPresetRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "add-scenario-from-preset" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedActiveScenarioId",
    "expectedInputEpoch",
    "label",
    "preset",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.addScenarioFromPreset");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "add-scenario-from-preset",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    label: input.label,
    preset: input.preset,
    ...activeBoundaryCorrelationFieldsV2(input),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "add-scenario-from-preset" }>;
}

export function createStudioSimulationDuplicateScenarioRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "duplicate-scenario" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedActiveScenarioId",
    "expectedInputEpoch",
    "label",
    "runtimeSessionId",
    "scenarioId",
    "sourceScenarioId",
  ], [], "$.duplicateScenario");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "duplicate-scenario",
    runtimeSessionId: input.runtimeSessionId,
    sourceScenarioId: input.sourceScenarioId,
    scenarioId: input.scenarioId,
    label: input.label,
    ...activeBoundaryCorrelationFieldsV2(input),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "duplicate-scenario" }>;
}

export function createStudioSimulationRenameScenarioRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "rename-scenario" }> {
  const input = exactDataRecordV2(value, [
    "label",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.renameScenario");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "rename-scenario",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    label: input.label,
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "rename-scenario" }>;
}

export function createStudioSimulationDeleteScenarioRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "delete-scenario" }> {
  const input = exactDataRecordV2(value, [
    "expectedAcceptedRevision",
    "expectedAcceptedTimeSec",
    "expectedActiveScenarioId",
    "expectedInputEpoch",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.deleteScenario");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "delete-scenario",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    ...activeBoundaryCorrelationFieldsV2(input),
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "delete-scenario" }>;
}

export function createStudioSimulationCreateSnapshotRequestV2(
  requestId: number,
  value: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "create-snapshot" }> {
  const input = exactDataRecordV2(value, [
    "expectedDraftVersion",
    "expectedHeadSnapshotId",
    "experimentId",
    "runtimeSessionId",
    "scenarioId",
  ], [], "$.createSnapshot");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "create-snapshot",
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    experimentId: input.experimentId,
    expectedDraftVersion: input.expectedDraftVersion,
    expectedHeadSnapshotId: input.expectedHeadSnapshotId,
  }) as Extract<
    StudioSimulationWorkerRequestV2,
    { kind: "create-snapshot" }
  >;
}

export function createStudioSimulationDisposeRequestV2(
  requestId: number,
  runtimeSessionId: unknown,
): Extract<StudioSimulationWorkerRequestV2, { kind: "dispose" }> {
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "dispose",
    runtimeSessionId,
  }) as Extract<StudioSimulationWorkerRequestV2, { kind: "dispose" }>;
}

/** Decodes and detaches an untrusted message before any adapter is invoked. */
export function validateStudioSimulationWorkerRequestV2(
  value: unknown,
): StudioSimulationWorkerRequestV2 {
  const envelope = dataRecordV2(value, "$.request");
  assertProtocolV2(envelope.protocol, "$.request.protocol");
  const requestId = positiveRequestIdV2(
    envelope.requestId,
    "$.request.requestId",
  );

  if (envelope.kind === "initialize") {
    const request = exactDataRecordV2(envelope, [
      "expectedModelId",
      "fixture",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
      "scenarioLabel",
    ], ["authoringSeed", "checkpoint"], "$.request");
    const scenario = validateStudioSimulationScenarioInputV2({
      scenarioId: request.scenarioId,
      fixture: request.fixture,
      ...(Object.prototype.hasOwnProperty.call(request, "checkpoint")
        ? { checkpoint: request.checkpoint }
        : {}),
    });
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "initialize",
      expectedModelId: validateStudioSimulationPortableIdV2(
        request.expectedModelId,
        "$.request.expectedModelId",
      ),
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: scenario.scenarioId,
      scenarioLabel: nonemptyTrimmedStringV2(
        request.scenarioLabel,
        "$.request.scenarioLabel",
      ),
      fixture: scenario.fixture,
      ...(scenario.checkpoint === undefined
        ? {}
        : { checkpoint: scenario.checkpoint }),
      ...(Object.prototype.hasOwnProperty.call(request, "authoringSeed")
        ? {
            authoringSeed: validateAuthoringSeedV2(
              request.authoringSeed,
              "$.request.authoringSeed",
            ),
          }
        : {}),
    });
  }

  if (envelope.kind === "advance") {
    const request = exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
      "stepCount",
    ], [], "$.request");
    const stepCount = request.stepCount;
    if (
      typeof stepCount !== "number"
      || !Number.isSafeInteger(stepCount)
      || stepCount < 1
      || stepCount > STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2
    ) {
      throw protocolErrorV2(
        "$.request.stepCount",
        `must be an integer within [1, ${STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2}]`,
      );
    }
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "advance",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      stepCount,
    });
  }

  if (envelope.kind === "apply-control") {
    const request = exactDataRecordV2(envelope, [
      "controlId",
      "expectedInputEpoch",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
      "value",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "apply-control",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      controlId: validateStudioSimulationPortableIdV2(
        request.controlId,
        "$.request.controlId",
      ),
      value: finiteScalarV2(request.value, "$.request.value"),
      expectedInputEpoch: nonnegativeSafeIntegerV2(
        request.expectedInputEpoch,
        "$.request.expectedInputEpoch",
      ),
    });
  }

  if (envelope.kind === "request-analysis") {
    const request = exactDataRecordV2(envelope, [
      "analysisId",
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedInputEpoch",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "request-analysis",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      analysisId: validateStudioSimulationPortableIdV2(
        request.analysisId,
        "$.request.analysisId",
      ),
      expectedInputEpoch: nonnegativeSafeIntegerV2(
        request.expectedInputEpoch,
        "$.request.expectedInputEpoch",
      ),
      expectedAcceptedRevision: nonnegativeSafeIntegerV2(
        request.expectedAcceptedRevision,
        "$.request.expectedAcceptedRevision",
      ),
      expectedAcceptedTimeSec: nonnegativeFiniteNumberV2(
        request.expectedAcceptedTimeSec,
        "$.request.expectedAcceptedTimeSec",
      ),
    });
  }

  if (envelope.kind === "save-draft") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedDraftVersion",
      "expectedInputEpoch",
      "experimentId",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
      "surface",
    ], [], "$.request");
    const runtimeSessionId = validateStudioSimulationPortableIdV2(
      request.runtimeSessionId,
      "$.request.runtimeSessionId",
    );
    const scenarioId = validateStudioSimulationPortableIdV2(
      request.scenarioId,
      "$.request.scenarioId",
    );
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "save-draft",
      runtimeSessionId,
      scenarioId,
      experimentId: validateStudioSimulationPortableIdV2(
        request.experimentId,
        "$.request.experimentId",
      ),
      surface: validateSurfaceV2(
        request.surface,
        scenarioId,
        "$.request.surface",
      ),
      expectedDraftVersion: nullableNonnegativeSafeIntegerV2(
        request.expectedDraftVersion,
        "$.request.expectedDraftVersion",
      ),
      expectedInputEpoch: nonnegativeSafeIntegerV2(
        request.expectedInputEpoch,
        "$.request.expectedInputEpoch",
      ),
      expectedAcceptedRevision: nonnegativeSafeIntegerV2(
        request.expectedAcceptedRevision,
        "$.request.expectedAcceptedRevision",
      ),
      expectedAcceptedTimeSec: nonnegativeFiniteNumberV2(
        request.expectedAcceptedTimeSec,
        "$.request.expectedAcceptedTimeSec",
      ),
    });
  }

  if (envelope.kind === "read-scenarios") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedActiveScenarioId",
      "expectedInputEpoch",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "read-scenarios",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      ...validateActiveBoundaryCorrelationV2(request, "$.request"),
    });
  }

  if (envelope.kind === "select-scenario") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedActiveScenarioId",
      "expectedInputEpoch",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "select-scenario",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      ...validateActiveBoundaryCorrelationV2(request, "$.request"),
    });
  }

  if (envelope.kind === "add-scenario-from-preset") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedActiveScenarioId",
      "expectedInputEpoch",
      "kind",
      "label",
      "preset",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    let preset: ScenarioPresetV2;
    try {
      preset = validateScenarioPresetV2(request.preset);
    } catch (error) {
      throw protocolErrorV2(
        "$.request.preset",
        errorMessageForProtocolV2(error),
      );
    }
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "add-scenario-from-preset",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      label: nonemptyTrimmedStringV2(request.label, "$.request.label"),
      preset,
      ...validateActiveBoundaryCorrelationV2(request, "$.request"),
    });
  }

  if (envelope.kind === "duplicate-scenario") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedActiveScenarioId",
      "expectedInputEpoch",
      "kind",
      "label",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
      "sourceScenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "duplicate-scenario",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      sourceScenarioId: validateStudioSimulationPortableIdV2(
        request.sourceScenarioId,
        "$.request.sourceScenarioId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      label: nonemptyTrimmedStringV2(request.label, "$.request.label"),
      ...validateActiveBoundaryCorrelationV2(request, "$.request"),
    });
  }

  if (envelope.kind === "rename-scenario") {
    const request = exactDataRecordV2(envelope, [
      "kind",
      "label",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "rename-scenario",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      label: nonemptyTrimmedStringV2(request.label, "$.request.label"),
    });
  }

  if (envelope.kind === "delete-scenario") {
    const request = exactDataRecordV2(envelope, [
      "expectedAcceptedRevision",
      "expectedAcceptedTimeSec",
      "expectedActiveScenarioId",
      "expectedInputEpoch",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "delete-scenario",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      ...validateActiveBoundaryCorrelationV2(request, "$.request"),
    });
  }

  if (envelope.kind === "create-snapshot") {
    const request = exactDataRecordV2(envelope, [
      "expectedDraftVersion",
      "expectedHeadSnapshotId",
      "experimentId",
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
      "scenarioId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "create-snapshot",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
      scenarioId: validateStudioSimulationPortableIdV2(
        request.scenarioId,
        "$.request.scenarioId",
      ),
      experimentId: validateStudioSimulationPortableIdV2(
        request.experimentId,
        "$.request.experimentId",
      ),
      expectedDraftVersion: nonnegativeSafeIntegerV2(
        request.expectedDraftVersion,
        "$.request.expectedDraftVersion",
      ),
      expectedHeadSnapshotId: nullablePortableIdV2(
        request.expectedHeadSnapshotId,
        "$.request.expectedHeadSnapshotId",
      ),
    });
  }

  if (envelope.kind === "dispose") {
    const request = exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "runtimeSessionId",
    ], [], "$.request");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      kind: "dispose",
      runtimeSessionId: validateStudioSimulationPortableIdV2(
        request.runtimeSessionId,
        "$.request.runtimeSessionId",
      ),
    });
  }
  throw protocolErrorV2("$.request.kind", "has an invalid request kind");
}

/** Decodes and detaches an untrusted response before resolving a caller. */
export function validateStudioSimulationWorkerResponseV2(
  value: unknown,
): StudioSimulationWorkerResponseV2 {
  const envelope = dataRecordV2(value, "$.response");
  assertProtocolV2(envelope.protocol, "$.response.protocol");
  const requestId = responseRequestIdV2(
    envelope.requestId,
    "$.response.requestId",
  );

  if (envelope.status === "error") {
    const response = exactDataRecordV2(envelope, [
      "fatal",
      "message",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    if (typeof response.fatal !== "boolean") {
      throw protocolErrorV2("$.response.fatal", "must be a boolean");
    }
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "error",
      fatal: response.fatal,
      message: portableErrorMessageV2(
        response.message,
        "$.response.message",
      ),
    });
  }
  if (envelope.status !== "ok") {
    throw protocolErrorV2("$.response.status", "has an invalid status");
  }

  if (envelope.kind === "initialized") {
    const response = exactDataRecordV2(envelope, [
      "frame",
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "initialized",
      frame: validateStudioSimulationFrameV2(response.frame),
    });
  }
  if (envelope.kind === "advanced") {
    const response = exactDataRecordV2(envelope, [
      "frames",
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    const frameValues = arrayDataValuesV2(
      response.frames,
      "$.response.frames",
    );
    if (
      frameValues.length < 1
      || frameValues.length > STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2
    ) {
      throw protocolErrorV2(
        "$.response.frames",
        `must contain 1-${STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2} frames`,
      );
    }
    const frames: StudioSimulationFrameV2[] = [];
    for (let index = 0; index < frameValues.length; index += 1) {
      frames.push(validateStudioSimulationFrameV2(
        frameValues[index],
        `$.response.frames[${index}]`,
      ));
    }
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "advanced",
      frames: Object.freeze(frames),
    });
  }
  if (envelope.kind === "control-applied") {
    const response = exactDataRecordV2(envelope, [
      "frame",
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "control-applied",
      frame: validateStudioSimulationFrameV2(response.frame),
    });
  }
  if (envelope.kind === "analysis-result") {
    const response = exactDataRecordV2(envelope, [
      "analysis",
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "analysis-result",
      analysis: validateStudioSimulationAnalysisV2(response.analysis),
    });
  }
  if (envelope.kind === "scenario-state") {
    const response = exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "state",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "scenario-state",
      state: validateScenarioStateV2(response.state, "$.response.state"),
    });
  }
  if (envelope.kind === "scenarios-captured") {
    const response = exactDataRecordV2(envelope, [
      "captures",
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "scenarios-captured",
      captures: validateScenarioCapturesV2(
        response.captures,
        "$.response.captures",
      ),
    });
  }
  if (envelope.kind === "draft-saved") {
    const response = exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "status",
      "workspace",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "draft-saved",
      workspace: validateExperimentWorkspaceV2(response.workspace),
    });
  }
  if (envelope.kind === "snapshot-created") {
    const response = exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "snapshot",
      "status",
      "workspace",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "snapshot-created",
      snapshot: validateExperimentSnapshotV2(response.snapshot),
      workspace: validateExperimentWorkspaceV2(response.workspace),
    });
  }
  if (envelope.kind === "disposed") {
    exactDataRecordV2(envelope, [
      "kind",
      "protocol",
      "requestId",
      "status",
    ], [], "$.response");
    return Object.freeze({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId,
      status: "ok",
      kind: "disposed",
    });
  }
  throw protocolErrorV2("$.response.kind", "has an invalid response kind");
}

/** Extracts correlation without invoking accessors on an invalid message. */
export function studioSimulationWorkerRequestIdFromUnknownV2(
  value: unknown,
): number {
  try {
    if (
      value === null
      || typeof value !== "object"
      || Array.isArray(value)
    ) {
      return 0;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return 0;
    const descriptor = Object.getOwnPropertyDescriptor(value, "requestId");
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
      || typeof descriptor.value !== "number"
      || !Number.isSafeInteger(descriptor.value)
      || descriptor.value < 1
    ) {
      return 0;
    }
    return descriptor.value;
  } catch {
    // Revoked or hostile proxies cannot supply trustworthy correlation.
    return 0;
  }
}

function assertProtocolV2(value: unknown, path: string): void {
  if (value !== STUDIO_SIMULATION_WORKER_PROTOCOL_V2) {
    throw protocolErrorV2(path, "protocol identity mismatch");
  }
}

function positiveRequestIdV2(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 1
  ) {
    throw protocolErrorV2(path, "must be a positive safe integer");
  }
  return value;
}

function responseRequestIdV2(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
    || Object.is(value, -0)
  ) {
    throw protocolErrorV2(path, "must be a nonnegative safe integer");
  }
  return value;
}

function nonnegativeSafeIntegerV2(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
    || Object.is(value, -0)
  ) {
    throw protocolErrorV2(path, "must be a nonnegative safe integer");
  }
  return value;
}

function validateActiveBoundaryCorrelationV2(
  value: Record<string, unknown>,
  path: string,
): Readonly<{
  expectedActiveScenarioId: string;
  expectedInputEpoch: number;
  expectedAcceptedRevision: number;
  expectedAcceptedTimeSec: number;
}> {
  return Object.freeze({
    expectedActiveScenarioId: validateStudioSimulationPortableIdV2(
      value.expectedActiveScenarioId,
      `${path}.expectedActiveScenarioId`,
    ),
    expectedInputEpoch: nonnegativeSafeIntegerV2(
      value.expectedInputEpoch,
      `${path}.expectedInputEpoch`,
    ),
    expectedAcceptedRevision: nonnegativeSafeIntegerV2(
      value.expectedAcceptedRevision,
      `${path}.expectedAcceptedRevision`,
    ),
    expectedAcceptedTimeSec: nonnegativeFiniteNumberV2(
      value.expectedAcceptedTimeSec,
      `${path}.expectedAcceptedTimeSec`,
    ),
  });
}

function validateScenarioDescriptorsV2(
  value: unknown,
  path: string,
): readonly StudioSimulationWorkerScenarioDescriptorV2[] {
  const values = arrayDataValuesV2(value, path);
  if (values.length === 0) {
    throw protocolErrorV2(path, "must contain at least one Scenario");
  }
  const ids = new Set<string>();
  return Object.freeze(values.map((entry, index) => {
    const itemPath = `${path}[${index}]`;
    const descriptor = exactDataRecordV2(
      entry,
      ["label", "scenarioId"],
      [],
      itemPath,
    );
    const scenarioId = validateStudioSimulationPortableIdV2(
      descriptor.scenarioId,
      `${itemPath}.scenarioId`,
    );
    if (ids.has(scenarioId)) {
      throw protocolErrorV2(`${itemPath}.scenarioId`, "must be unique");
    }
    ids.add(scenarioId);
    return Object.freeze({
      scenarioId,
      label: nonemptyTrimmedStringV2(
        descriptor.label,
        `${itemPath}.label`,
      ),
    });
  }));
}

function validateScenarioStateV2(
  value: unknown,
  path: string,
): StudioSimulationWorkerScenarioStateV2 {
  const state = exactDataRecordV2(
    value,
    ["activeScenarioId", "frame", "scenarios"],
    [],
    path,
  );
  const activeScenarioId = validateStudioSimulationPortableIdV2(
    state.activeScenarioId,
    `${path}.activeScenarioId`,
  );
  const scenarios = validateScenarioDescriptorsV2(
    state.scenarios,
    `${path}.scenarios`,
  );
  if (!scenarios.some(({ scenarioId }) => scenarioId === activeScenarioId)) {
    throw protocolErrorV2(
      `${path}.activeScenarioId`,
      "must identify one returned Scenario",
    );
  }
  const frame = validateStudioSimulationFrameV2(
    state.frame,
    `${path}.frame`,
  );
  if (frame.scenarioId !== activeScenarioId) {
    throw protocolErrorV2(
      `${path}.frame.scenarioId`,
      "must match activeScenarioId",
    );
  }
  return Object.freeze({ activeScenarioId, scenarios, frame });
}

function validateScenarioCapturesV2(
  value: unknown,
  path: string,
): StudioSimulationWorkerScenarioCapturesV2 {
  const captures = exactDataRecordV2(
    value,
    ["activeScenarioId", "scenarios"],
    [],
    path,
  );
  const activeScenarioId = validateStudioSimulationPortableIdV2(
    captures.activeScenarioId,
    `${path}.activeScenarioId`,
  );
  const values = arrayDataValuesV2(captures.scenarios, `${path}.scenarios`);
  if (values.length === 0) {
    throw protocolErrorV2(`${path}.scenarios`, "must not be empty");
  }
  const ids = new Set<string>();
  const scenarios = values.map((entry, index) => {
    const itemPath = `${path}.scenarios[${index}]`;
    const scenario = exactDataRecordV2(
      entry,
      ["capture", "label", "scenarioId"],
      [],
      itemPath,
    );
    const scenarioId = validateStudioSimulationPortableIdV2(
      scenario.scenarioId,
      `${itemPath}.scenarioId`,
    );
    if (ids.has(scenarioId)) {
      throw protocolErrorV2(`${itemPath}.scenarioId`, "must be unique");
    }
    ids.add(scenarioId);
    let capture;
    try {
      capture = validateScenarioCaptureV2(scenario.capture);
    } catch (error) {
      throw protocolErrorV2(
        `${itemPath}.capture`,
        errorMessageForProtocolV2(error),
      );
    }
    return Object.freeze({
      scenarioId,
      label: nonemptyTrimmedStringV2(scenario.label, `${itemPath}.label`),
      capture,
    });
  });
  if (!ids.has(activeScenarioId)) {
    throw protocolErrorV2(
      `${path}.activeScenarioId`,
      "must identify one captured Scenario",
    );
  }
  return Object.freeze({
    activeScenarioId,
    scenarios: Object.freeze(scenarios),
  });
}

function nullableNonnegativeSafeIntegerV2(
  value: unknown,
  path: string,
): number | null {
  return value === null ? null : nonnegativeSafeIntegerV2(value, path);
}

function nullablePortableIdV2(
  value: unknown,
  path: string,
): string | null {
  return value === null
    ? null
    : validateStudioSimulationPortableIdV2(value, path);
}

function nonemptyTrimmedStringV2(value: unknown, path: string): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > 4_096
    || value.trim() !== value
  ) {
    throw protocolErrorV2(
      path,
      "must be a nonempty trimmed string of at most 4096 characters",
    );
  }
  assertUnicodeScalarSequenceV2(value, path);
  return value;
}

function validateAuthoringSeedV2(
  value: unknown,
  path: string,
): StudioSimulationWorkerAuthoringSeedV2 {
  const seed = exactDataRecordV2(
    value,
    [],
    ["snapshots", "workspace"],
    path,
  );
  let workspace: ExperimentWorkspaceV2 | undefined;
  if (Object.prototype.hasOwnProperty.call(seed, "workspace")) {
    try {
      workspace = validateExperimentWorkspaceV2(seed.workspace);
    } catch (error) {
      throw protocolErrorV2(path, errorMessageForProtocolV2(error));
    }
  }
  let snapshots: readonly ExperimentSnapshotV2[] | undefined;
  if (Object.prototype.hasOwnProperty.call(seed, "snapshots")) {
    const values = arrayDataValuesV2(seed.snapshots, `${path}.snapshots`);
    const detached: ExperimentSnapshotV2[] = [];
    for (let index = 0; index < values.length; index += 1) {
      try {
        detached.push(validateExperimentSnapshotV2(values[index]));
      } catch (error) {
        throw protocolErrorV2(
          `${path}.snapshots[${index}]`,
          errorMessageForProtocolV2(error),
        );
      }
    }
    snapshots = Object.freeze(detached);
  }
  return Object.freeze({
    ...(workspace === undefined ? {} : { workspace }),
    ...(snapshots === undefined ? {} : { snapshots }),
  });
}

function validateSurfaceV2(
  value: unknown,
  scenarioId: string,
  path: string,
): ExperimentSurfaceV2 {
  try {
    return validateExperimentWorkspaceV2({
      schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
      experimentId: "experiment/protocol-validation",
      draftVersion: 0,
      headSnapshotId: null,
      basedOnSnapshotId: null,
      content: {
        modelId: "model/protocol-validation",
        scenarios: [{
          scenarioId,
          label: "Protocol validation",
          capture: {
            fixture: null,
            checkpoint: {
              acceptedRevision: 0,
              acceptedTimeSec: 0,
              payload: null,
            },
          },
        }],
        surface: value,
      },
    }).content.surface;
  } catch (error) {
    throw protocolErrorV2(path, errorMessageForProtocolV2(error));
  }
}

function errorMessageForProtocolV2(error: unknown): string {
  try {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    if (typeof error === "string" && error.length > 0) return error;
  } catch {
    // Hostile thrown values are reduced to one portable protocol message.
  }
  return "contains invalid authoring data";
}

function finiteScalarV2(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw protocolErrorV2(path, "must be a finite scalar number");
  }
  return value;
}

function nonnegativeFiniteNumberV2(value: unknown, path: string): number {
  const number = finiteScalarV2(value, path);
  if (number < 0 || Object.is(number, -0)) {
    throw protocolErrorV2(path, "must be a nonnegative finite number");
  }
  return number;
}

function portableErrorMessageV2(value: unknown, path: string): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > 4_096
  ) {
    throw protocolErrorV2(path, "must be a 1-4096 character string");
  }
  assertUnicodeScalarSequenceV2(value, path);
  return value;
}

function dataRecordV2(value: unknown, path: string): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw protocolErrorV2(path, "must be a plain data object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw protocolErrorV2(path, "must not use a custom prototype");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") {
      throw protocolErrorV2(path, "must not contain symbol fields");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw protocolErrorV2(
        `${path}[${JSON.stringify(key)}]`,
        "must be an enumerable data property",
      );
    }
  }
  return value as Record<string, unknown>;
}

function exactDataRecordV2(
  value: unknown,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): Record<string, unknown> {
  const record = dataRecordV2(value, path);
  const allowed = new Set<string>();
  for (const key of required) allowed.add(key);
  for (const key of optional) allowed.add(key);
  const missing: string[] = [];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) missing.push(key);
  }
  const unknown: string[] = [];
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) unknown.push(key);
  }
  if (missing.length > 0 || unknown.length > 0) {
    throw protocolErrorV2(
      path,
      `fields must match exactly (missing: ${missing.join(", ") || "none"}; `
        + `unknown: ${unknown.join(", ") || "none"})`,
    );
  }
  return record;
}

function arrayDataValuesV2(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw protocolErrorV2(path, "must be an array");
  }
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    throw protocolErrorV2(path, "array must not use a custom prototype");
  }
  const expected = new Set<string>(["length"]);
  for (let index = 0; index < value.length; index += 1) {
    expected.add(String(index));
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !expected.has(key)) {
      throw protocolErrorV2(path, "array must not have custom properties");
    }
  }
  const result: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw protocolErrorV2(
        `${path}[${index}]`,
        "must be a dense enumerable data property",
      );
    }
    result.push(descriptor.value);
  }
  return Object.freeze(result);
}

function assertUnicodeScalarSequenceV2(value: string, path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw protocolErrorV2(path, "contains an unpaired high surrogate");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw protocolErrorV2(path, "contains an unpaired low surrogate");
    }
  }
}

function protocolErrorV2(
  path: string,
  message: string,
): StudioSimulationWorkerProtocolErrorV2 {
  return new StudioSimulationWorkerProtocolErrorV2(path, message);
}

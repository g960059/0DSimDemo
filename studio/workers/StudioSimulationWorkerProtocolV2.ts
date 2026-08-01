import type {
  ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
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
export const STUDIO_SIMULATION_WORKER_MAX_ADVANCE_STEPS_V2 = 8;

export type StudioSimulationWorkerInitializeInputV2 = Readonly<{
  expectedModelId: string;
  runtimeSessionId: string;
  scenarioId: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
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

export type StudioSimulationWorkerRequestV2 =
  | Readonly<{
      protocol: typeof STUDIO_SIMULATION_WORKER_PROTOCOL_V2;
      requestId: number;
      kind: "initialize";
      expectedModelId: string;
      runtimeSessionId: string;
      scenarioId: string;
      fixture: StudioJsonValueV2;
      checkpoint?: ScenarioCheckpointV2;
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
  ], ["checkpoint"], "$.initialize");
  return validateStudioSimulationWorkerRequestV2({
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    kind: "initialize",
    expectedModelId: input.expectedModelId,
    runtimeSessionId: input.runtimeSessionId,
    scenarioId: input.scenarioId,
    fixture: input.fixture,
    ...(Object.prototype.hasOwnProperty.call(input, "checkpoint")
      ? { checkpoint: input.checkpoint }
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
    ], ["checkpoint"], "$.request");
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
      fixture: scenario.fixture,
      ...(scenario.checkpoint === undefined
        ? {}
        : { checkpoint: scenario.checkpoint }),
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

import type {
  ScenarioCheckpointV2,
} from "./content";
import type {
  ModelIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";

export type StudioSimulationOutputAvailabilityV2 =
  | "available"
  | "not-evaluated-at-accepted-state";

export type StudioSimulationOutputQualityV2 =
  | "authoritative-state"
  | "accepted-derived"
  | "not-assessed";

export type StudioSimulationOutputValueV2 = Readonly<{
  outputId: string;
  value: number | readonly number[] | null;
  availability: StudioSimulationOutputAvailabilityV2;
  quality: StudioSimulationOutputQualityV2;
}>;

/**
 * Portable runtime frame returned by one exact registered model.
 *
 * Frames are ephemeral. Their accepted clock lets renderers order samples and
 * lets Experiment capture prove which accepted boundary was saved without making
 * frames part of durable Experiment content.
 */
export type StudioSimulationFrameV2 = Readonly<{
  modelId: ModelIdV2;
  runtimeSessionId: string;
  scenarioId: ScenarioIdV2;
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  outputs: Readonly<Record<string, StudioSimulationOutputValueV2>>;
}>;

/**
 * Model-owned packed presentation page.
 *
 * Exact adapters may write accepted clocks and selected scalar signals
 * directly into transferable numeric buffers. This avoids constructing one
 * rich frame object per 2 ms sample. The terminal frame remains complete for
 * latest-value, control and capture correlation.
 */
export type RegisteredModelPresentationBatchV2 = Readonly<{
  outputIds: readonly string[];
  acceptedRevisions: Float64Array;
  acceptedTimesSec: Float64Array;
  outputStates: Uint8Array;
  outputValues: Float64Array;
  terminalFrame: StudioSimulationFrameV2;
}>;

/** Exact-manifest capability negotiating the optional packed presentation ABI. */
export const STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1 =
  "runtime/exact-presentation-batch-v1" as const;

/**
 * Immutable, on-demand analysis of one exact accepted simulation boundary.
 *
 * Analysis methods own these ephemeral results. They deliberately stay
 * out of every streamed frame and carry the exact source clock so a caller can
 * never mistake a result computed from an older input or accepted state for
 * the currently displayed simulation.
 */
export type StudioSimulationAnalysisV2 = Readonly<{
  modelId: ModelIdV2;
  runtimeSessionId: string;
  scenarioId: ScenarioIdV2;
  inputEpoch: number;
  sourceAcceptedRevision: number;
  sourceAcceptedTimeSec: number;
  analysisId: string;
  payload: StudioJsonValueV2;
}>;

/**
 * Main-thread execution plan for one model-owned analysis. Partitions are
 * portable request tokens; each receives its own Worker and exact checkpoint
 * clone. The merger is trusted client code registered alongside the exact
 * model and never crosses the durable or Worker boundary.
 */
export type StudioSimulationAnalysisExecutionPlanV2 = Readonly<{
  partitions: readonly string[];
  merge(
    analyses: readonly StudioSimulationAnalysisV2[],
  ): StudioSimulationAnalysisV2;
}>;

export type StudioSimulationAnalysisExecutionPlanResolverV2 = (
  analysisId: string,
) => StudioSimulationAnalysisExecutionPlanV2 | null;

export type StudioSimulationScenarioInputV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
}>;

/**
 * Registry-bound live owner. Callers never import a model-specific numerical
 * session directly; they resolve this adapter from the exact model runtime.
 */
export type RegisteredModelSimulationAdapterV2 = Readonly<{
  modelId: ModelIdV2;
  fixtureSchemaId: string;
  checkpointCodecId: string;
  createSession(input: Readonly<{
    runtimeSessionId: string;
    scenarios: readonly StudioSimulationScenarioInputV2[];
  }>): Promise<void>;
  disposeSession(runtimeSessionId: string): void;
  currentFrame(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
  }>): StudioSimulationFrameV2;
  advanceOnePresentationStep(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
  }>): Promise<StudioSimulationFrameV2>;
  /**
   * Exact-model batch projection for the live presentation hot path.
   *
   * Every packed row must represent the same accepted numerical sample that a
   * repeated `advanceOnePresentationStep` call would have produced, in the
   * same order. The terminal frame must remain complete so capture, controls
   * and latest-value consumers retain one authoritative model frame.
   *
   * This is a projection optimization, never permission to skip, interpolate
   * or otherwise alter accepted numerical steps. Every admitted exact
   * manifest declares `runtime/exact-presentation-batch-v1`; the packed
   * operation is part of the single supported runtime ABI.
   */
  advancePresentationBatch(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
    stepCount: number;
    presentationOutputIds: readonly string[];
  }>): Promise<RegisteredModelPresentationBatchV2>;
  /**
   * Applies one model-owned semantic control at an accepted boundary.
   *
   * The adapter must compare `expectedInputEpoch` and commit the resulting
   * fixture/state/frame as one operation. A rejected action must leave both
   * the input epoch and current frame unchanged.
   */
  applyControl(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
    controlId: string;
    value: number;
    expectedInputEpoch: number;
  }>): Promise<StudioSimulationFrameV2>;
  /**
   * Compatibility ABI for admitted artifacts that still embed analysis
   * execution. New callers route through an AnalysisExecutor; implementations
   * must reject stale clocks and must not mutate the numerical session.
   */
  requestAnalysis(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
    analysisId: string;
    expectedInputEpoch: number;
    expectedAcceptedRevision: number;
    expectedAcceptedTimeSec: number;
    analysisPartition?: string;
    /** Ephemeral partial results from the same exact source boundary. */
    onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
  }>): Promise<StudioSimulationAnalysisV2>;
  replaceFixture(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
    fixture: StudioJsonValueV2;
  }>): Promise<number>;
  currentInputEpoch(input: Readonly<{
    runtimeSessionId: string;
    scenarioId: ScenarioIdV2;
  }>): number;
}>;

const STUDIO_SIMULATION_PORTABLE_ID_V2 =
  /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;
const MAXIMUM_STUDIO_SIMULATION_JSON_DEPTH_V2 = 256;

export class StudioSimulationContractValidationErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio simulation V2 rejected ${path}: ${message}`);
    this.name = "StudioSimulationContractValidationErrorV2";
  }
}

/** Validates and takes ownership of one worker-bound Scenario input. */
export function validateStudioSimulationScenarioInputV2(
  value: unknown,
  path = "$.scenario",
): StudioSimulationScenarioInputV2 {
  const scenario = exactDataRecordV2(
    value,
    ["fixture", "scenarioId"],
    ["checkpoint"],
    path,
  );
  const scenarioId = validateStudioSimulationPortableIdV2(
    scenario.scenarioId,
    `${path}.scenarioId`,
  );
  const fixture = validateAndOwnStudioSimulationPortableJsonV2(
    scenario.fixture,
    `${path}.fixture`,
  );
  const hasCheckpoint = Object.prototype.hasOwnProperty.call(
    scenario,
    "checkpoint",
  );
  const checkpoint = hasCheckpoint
    ? validateCheckpointV2(scenario.checkpoint, `${path}.checkpoint`)
    : undefined;
  return Object.freeze({
    scenarioId,
    fixture,
    ...(checkpoint === undefined ? {} : { checkpoint }),
  });
}

/** Validates and takes ownership of one model-independent worker frame. */
export function validateStudioSimulationFrameV2(
  value: unknown,
  path = "$.frame",
): StudioSimulationFrameV2 {
  const frame = exactDataRecordV2(value, [
    "acceptedRevision",
    "acceptedTimeSec",
    "inputEpoch",
    "modelId",
    "outputs",
    "runtimeSessionId",
    "scenarioId",
  ], [], path);
  const modelId = validateStudioSimulationPortableIdV2(
    frame.modelId,
    `${path}.modelId`,
  );
  const runtimeSessionId = validateStudioSimulationPortableIdV2(
    frame.runtimeSessionId,
    `${path}.runtimeSessionId`,
  );
  const scenarioId = validateStudioSimulationPortableIdV2(
    frame.scenarioId,
    `${path}.scenarioId`,
  );
  const inputEpoch = nonnegativeSafeIntegerV2(
    frame.inputEpoch,
    `${path}.inputEpoch`,
  );
  const acceptedRevision = nonnegativeSafeIntegerV2(
    frame.acceptedRevision,
    `${path}.acceptedRevision`,
  );
  const acceptedTimeSec = nonnegativeFiniteNumberV2(
    frame.acceptedTimeSec,
    `${path}.acceptedTimeSec`,
  );
  const outputs = validateOutputsV2(frame.outputs, `${path}.outputs`);
  return Object.freeze({
    modelId,
    runtimeSessionId,
    scenarioId,
    inputEpoch,
    acceptedRevision,
    acceptedTimeSec,
    outputs,
  });
}

/** Validates, detaches, and deeply freezes one portable analysis result. */
export function validateStudioSimulationAnalysisV2(
  value: unknown,
  path = "$.analysis",
): StudioSimulationAnalysisV2 {
  const analysis = exactDataRecordV2(value, [
    "analysisId",
    "inputEpoch",
    "modelId",
    "payload",
    "runtimeSessionId",
    "scenarioId",
    "sourceAcceptedRevision",
    "sourceAcceptedTimeSec",
  ], [], path);
  return Object.freeze({
    modelId: validateStudioSimulationPortableIdV2(
      analysis.modelId,
      `${path}.modelId`,
    ),
    runtimeSessionId: validateStudioSimulationPortableIdV2(
      analysis.runtimeSessionId,
      `${path}.runtimeSessionId`,
    ),
    scenarioId: validateStudioSimulationPortableIdV2(
      analysis.scenarioId,
      `${path}.scenarioId`,
    ),
    inputEpoch: nonnegativeSafeIntegerV2(
      analysis.inputEpoch,
      `${path}.inputEpoch`,
    ),
    sourceAcceptedRevision: nonnegativeSafeIntegerV2(
      analysis.sourceAcceptedRevision,
      `${path}.sourceAcceptedRevision`,
    ),
    sourceAcceptedTimeSec: nonnegativeFiniteNumberV2(
      analysis.sourceAcceptedTimeSec,
      `${path}.sourceAcceptedTimeSec`,
    ),
    analysisId: validateStudioSimulationPortableIdV2(
      analysis.analysisId,
      `${path}.analysisId`,
    ),
    payload: validateAndOwnStudioSimulationPortableJsonV2(
      analysis.payload,
      `${path}.payload`,
    ),
  });
}

export function validateStudioSimulationPortableIdV2(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== "string"
    || !STUDIO_SIMULATION_PORTABLE_ID_V2.test(value)
  ) {
    throw validationErrorV2(path, "must be a portable opaque ID");
  }
  return value;
}

function validateCheckpointV2(
  value: unknown,
  path: string,
): ScenarioCheckpointV2 {
  const checkpoint = exactDataRecordV2(value, [
    "acceptedRevision",
    "acceptedTimeSec",
    "payload",
  ], [], path);
  return Object.freeze({
    acceptedRevision: nonnegativeSafeIntegerV2(
      checkpoint.acceptedRevision,
      `${path}.acceptedRevision`,
    ),
    acceptedTimeSec: nonnegativeFiniteNumberV2(
      checkpoint.acceptedTimeSec,
      `${path}.acceptedTimeSec`,
    ),
    payload: validateAndOwnStudioSimulationPortableJsonV2(
      checkpoint.payload,
      `${path}.payload`,
    ),
  });
}

function validateOutputsV2(
  value: unknown,
  path: string,
): Readonly<Record<string, StudioSimulationOutputValueV2>> {
  const outputRecord = dataRecordV2(value, path);
  const outputs: Record<string, StudioSimulationOutputValueV2> = {};
  for (const outputId of Object.keys(outputRecord)) {
    validateStudioSimulationPortableIdV2(outputId, `${path} key`);
    const outputPath = `${path}[${JSON.stringify(outputId)}]`;
    const output = exactDataRecordV2(outputRecord[outputId], [
      "availability",
      "outputId",
      "quality",
      "value",
    ], [], outputPath);
    if (output.outputId !== outputId) {
      throw validationErrorV2(
        `${outputPath}.outputId`,
        `must match output map key ${outputId}`,
      );
    }
    if (
      output.availability !== "available"
      && output.availability !== "not-evaluated-at-accepted-state"
    ) {
      throw validationErrorV2(
        `${outputPath}.availability`,
        "has an invalid availability",
      );
    }
    if (
      output.quality !== "authoritative-state"
      && output.quality !== "accepted-derived"
      && output.quality !== "not-assessed"
    ) {
      throw validationErrorV2(
        `${outputPath}.quality`,
        "has an invalid quality",
      );
    }
    const validatedOutput: StudioSimulationOutputValueV2 = Object.freeze({
      outputId,
      value: validateOutputValueV2(output.value, `${outputPath}.value`),
      availability: output.availability,
      quality: output.quality,
    });
    Object.defineProperty(outputs, outputId, {
      configurable: false,
      enumerable: true,
      value: validatedOutput,
      writable: false,
    });
  }
  return Object.freeze(outputs);
}

function validateOutputValueV2(
  value: unknown,
  path: string,
): number | readonly number[] | null {
  if (value === null) return null;
  if (typeof value === "number") {
    return portableNumberV2(value, path);
  }
  if (!Array.isArray(value)) {
    throw validationErrorV2(path, "must be a number, number array, or null");
  }
  const entries = arrayDataValuesV2(value, path);
  const result: number[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    result.push(portableNumberV2(entries[index], `${path}[${index}]`));
  }
  return Object.freeze(result);
}

/**
 * Shared worker-bound portable JSON decoder.
 *
 * This is intentionally stricter than JSON.stringify: accessors, custom
 * prototypes, sparse arrays, cycles, non-finite numbers, negative zero, and
 * invalid Unicode scalar sequences are rejected before any model code sees
 * the value. The returned graph is detached and deeply frozen.
 */
export function validateAndOwnStudioSimulationPortableJsonV2(
  value: unknown,
  path = "$.value",
): StudioJsonValueV2 {
  return clonePortableJsonV2(value, path, new Set<object>(), 0);
}

function clonePortableJsonV2(
  value: unknown,
  path: string,
  ancestors: Set<object> = new Set<object>(),
  depth = 0,
): StudioJsonValueV2 {
  if (depth > MAXIMUM_STUDIO_SIMULATION_JSON_DEPTH_V2) {
    throw validationErrorV2(path, "portable JSON nesting limit exceeded");
  }
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    assertUnicodeScalarSequenceV2(value, path);
    return value;
  }
  if (typeof value === "number") return portableNumberV2(value, path);
  if (typeof value !== "object") {
    throw validationErrorV2(path, "must be portable JSON");
  }
  if (ancestors.has(value)) {
    throw validationErrorV2(path, "portable JSON must not be cyclic");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const entries = arrayDataValuesV2(value, path);
      const result: StudioJsonValueV2[] = [];
      for (let index = 0; index < entries.length; index += 1) {
        result.push(clonePortableJsonV2(
          entries[index],
          `${path}[${index}]`,
          ancestors,
          depth + 1,
        ));
      }
      return Object.freeze(result);
    }
    const record = dataRecordV2(value, path);
    const result: Record<string, StudioJsonValueV2> = {};
    for (const key of Object.keys(record)) {
      assertUnicodeScalarSequenceV2(key, `${path} property name`);
      Object.defineProperty(result, key, {
        configurable: false,
        enumerable: true,
        value: clonePortableJsonV2(
          record[key],
          `${path}[${JSON.stringify(key)}]`,
          ancestors,
          depth + 1,
        ),
        writable: false,
      });
    }
    return Object.freeze(result);
  } finally {
    ancestors.delete(value);
  }
}

function dataRecordV2(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw validationErrorV2(path, "must be a plain data object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validationErrorV2(path, "must not use a custom prototype");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") {
      throw validationErrorV2(path, "must not contain symbol fields");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      throw validationErrorV2(
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
    throw validationErrorV2(
      path,
      `fields must match exactly (missing: ${missing.join(", ") || "none"}; `
        + `unknown: ${unknown.join(", ") || "none"})`,
    );
  }
  return record;
}

function arrayDataValuesV2(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw validationErrorV2(path, "must be an array");
  }
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    throw validationErrorV2(path, "array must not use a custom prototype");
  }
  const expected = new Set<string>(["length"]);
  for (let index = 0; index < value.length; index += 1) {
    expected.add(String(index));
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !expected.has(key)) {
      throw validationErrorV2(path, "array must not have custom properties");
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
      throw validationErrorV2(
        `${path}[${index}]`,
        "must be a dense enumerable data property",
      );
    }
    result.push(descriptor.value);
  }
  return Object.freeze(result);
}

function nonnegativeSafeIntegerV2(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
    || Object.is(value, -0)
  ) {
    throw validationErrorV2(path, "must be a nonnegative safe integer");
  }
  return value;
}

function nonnegativeFiniteNumberV2(value: unknown, path: string): number {
  const number = portableNumberV2(value, path);
  if (number < 0) {
    throw validationErrorV2(path, "must be nonnegative");
  }
  return number;
}

function portableNumberV2(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || Object.is(value, -0)
  ) {
    throw validationErrorV2(
      path,
      "must be finite and must not be negative zero",
    );
  }
  return value;
}

function assertUnicodeScalarSequenceV2(value: string, path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw validationErrorV2(path, "contains an unpaired high surrogate");
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw validationErrorV2(path, "contains an unpaired low surrogate");
    }
  }
}

function validationErrorV2(
  path: string,
  message: string,
): StudioSimulationContractValidationErrorV2 {
  return new StudioSimulationContractValidationErrorV2(path, message);
}

import type {
  MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID =
  "main-wire-five-wall-coupled-accepted-history-predictor-v1" as const;
export const MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_CHECKPOINT_V2_ID =
  "circleheart-main-wire-five-wall-coupled-predictor-checkpoint-v2" as const;

export type MainWireFiveWallCoupledPredictionOrderV1 =
  | "linear"
  | "quadratic"
  | "cubic";

export type MainWireFiveWallCoupledPredictorWorkspaceV1 = Readonly<{
  schemaId: "circleheart-main-wire-five-wall-coupled-predictor-workspace-v1";
  dimension: 30;
}>;

export type MainWireFiveWallCoupledPredictionV1 = Readonly<{
  predictorId: typeof MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID;
  mode:
    | "context"
    | "linear-extrapolation"
    | "quadratic-extrapolation"
    | "cubic-extrapolation";
  extrapolationScale: number;
  /**
   * Synchronously borrowed storage. The next prepare/record/reset call may
   * overwrite it; the Newton solver copies it before returning.
   */
  initialGuessMl: Float64Array;
}>;

export type MainWireFiveWallCoupledPredictorReportV1 = Readonly<{
  predictorId: typeof MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID;
  hasAcceptedPair: boolean;
  historyDepth: 0 | 2 | 3 | 4;
  expectedBaseRevision: number | null;
  expectedBaseAcceptedTimeSec: number | null;
  predictionCount: number;
  contextFallbackCount: number;
  dampedPredictionCount: number;
  resetCount: number;
}>;

export type MainWireFiveWallCoupledPredictorCheckpointV2 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  historyDepth: 0 | 2 | 3 | 4;
  expectedBaseRevision: number | null;
  expectedBaseAcceptedTimeSec: number | null;
  oldestAcceptedMl: readonly number[];
  olderAcceptedMl: readonly number[];
  previousAcceptedMl: readonly number[];
  currentAcceptedMl: readonly number[];
}>;

type PredictorStorage = {
  readonly oldestAcceptedMl: Float64Array;
  readonly olderAcceptedMl: Float64Array;
  readonly previousAcceptedMl: Float64Array;
  readonly currentAcceptedMl: Float64Array;
  readonly predictedMl: Float64Array;
  hasAcceptedPair: boolean;
  historyDepth: 0 | 2 | 3 | 4;
  expectedBaseRevision: number | null;
  expectedBaseAcceptedTimeSec: number | null;
  preparedBaseRevision: number | null;
  preparedBaseAcceptedTimeSec: number | null;
  predictionCount: number;
  contextFallbackCount: number;
  dampedPredictionCount: number;
  resetCount: number;
};

const STORAGE = new WeakMap<
  MainWireFiveWallCoupledPredictorWorkspaceV1,
  PredictorStorage
>();

export function createMainWireFiveWallCoupledPredictorWorkspaceV1():
MainWireFiveWallCoupledPredictorWorkspaceV1 {
  const workspace = Object.freeze({
    schemaId:
      "circleheart-main-wire-five-wall-coupled-predictor-workspace-v1" as const,
    dimension: 30 as const,
  });
  STORAGE.set(workspace, {
    oldestAcceptedMl: new Float64Array(30),
    olderAcceptedMl: new Float64Array(30),
    previousAcceptedMl: new Float64Array(30),
    currentAcceptedMl: new Float64Array(30),
    predictedMl: new Float64Array(30),
    hasAcceptedPair: false,
    historyDepth: 0,
    expectedBaseRevision: null,
    expectedBaseAcceptedTimeSec: null,
    preparedBaseRevision: null,
    preparedBaseAcceptedTimeSec: null,
    predictionCount: 0,
    contextFallbackCount: 0,
    dampedPredictionCount: 0,
    resetCount: 0,
  });
  return workspace;
}

/**
 * Predicts the next implicit root from accepted first-, second-, or
 * third-order finite differences.
 * Prediction changes no model equation or tolerance. It is used only when
 * the caller presents the exact sequential accepted state; discontinuities,
 * restores, parameter changes, and inadmissible extrapolations fall back to
 * the context-owned starting point.
 */
export function prepareMainWireFiveWallCoupledPredictionV1<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
  order: MainWireFiveWallCoupledPredictionOrderV1 = "linear",
): MainWireFiveWallCoupledPredictionV1 {
  context.assertWorkspaceCurrent();
  if (order !== "linear" && order !== "quadratic" && order !== "cubic") {
    throw new RangeError("coupled predictor order is unsupported");
  }
  const storage = requireStorage(workspace);
  storage.preparedBaseRevision = context.baseRevision;
  storage.preparedBaseAcceptedTimeSec = context.baseAcceptedTimeSec;
  if (!matchesSequentialAcceptedState(context, storage)) {
    if (storage.hasAcceptedPair) resetHistory(storage);
    storage.contextFallbackCount += 1;
    return contextPrediction(context);
  }

  const cubic = order === "cubic" && storage.historyDepth === 4;
  const quadratic = order === "quadratic" && storage.historyDepth >= 3;
  let scale = 1;
  while (scale >= 1 / 256) {
    for (let index = 0; index < workspace.dimension; index += 1) {
      const current = context.initialUnknownsMl[index]!;
      const displacement = cubic
        ? 3 * current - 6 * storage.previousAcceptedMl[index]!
          + 4 * storage.olderAcceptedMl[index]!
          - storage.oldestAcceptedMl[index]!
        : quadratic
          ? 2 * current - 3 * storage.previousAcceptedMl[index]!
            + storage.olderAcceptedMl[index]!
        : current - storage.previousAcceptedMl[index]!;
      storage.predictedMl[index] = current + scale * displacement;
    }
    if (isAdmissiblePrediction(context, storage.predictedMl)) {
      storage.predictionCount += 1;
      if (scale < 1) storage.dampedPredictionCount += 1;
      return Object.freeze({
        predictorId: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
        mode: cubic
          ? "cubic-extrapolation" as const
          : quadratic
            ? "quadratic-extrapolation" as const
            : "linear-extrapolation" as const,
        extrapolationScale: scale,
        initialGuessMl: storage.predictedMl,
      });
    }
    scale *= 0.5;
  }
  storage.contextFallbackCount += 1;
  return contextPrediction(context);
}

/**
 * Records a root only after the caller has atomically admitted and promoted
 * that exact solution. A failed solve or failed admission must not call this
 * function, so rejected candidates cannot train the next-step predictor.
 */
export function recordAcceptedMainWireFiveWallCoupledSolutionV1<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
  acceptedSolutionMl: Float64Array,
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): void {
  context.assertWorkspaceCurrent();
  const storage = requireStorage(workspace);
  if (
    storage.preparedBaseRevision !== context.baseRevision
    || !sameNumber(
      storage.preparedBaseAcceptedTimeSec,
      context.baseAcceptedTimeSec,
    )
  ) {
    throw new Error(
      "coupled predictor can record only its most recently prepared context",
    );
  }
  requireFiniteVector(acceptedSolutionMl, workspace.dimension, "accepted root");
  if (!isAdmissiblePrediction(context, acceptedSolutionMl)) {
    throw new RangeError("accepted root is outside the coupled predictor domain");
  }
  if (storage.hasAcceptedPair) {
    if (storage.historyDepth >= 3) {
      storage.oldestAcceptedMl.set(storage.olderAcceptedMl);
    }
    storage.olderAcceptedMl.set(storage.previousAcceptedMl);
  }
  storage.previousAcceptedMl.set(context.initialUnknownsMl);
  storage.currentAcceptedMl.set(acceptedSolutionMl);
  storage.hasAcceptedPair = true;
  storage.historyDepth = storage.historyDepth === 0
    ? 2
    : storage.historyDepth === 2
      ? 3
      : 4;
  storage.expectedBaseRevision = context.baseRevision + 1;
  storage.expectedBaseAcceptedTimeSec =
    context.baseAcceptedTimeSec + context.stepDtSec;
}

export function resetMainWireFiveWallCoupledPredictorV1(
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): void {
  const storage = requireStorage(workspace);
  resetHistory(storage);
}

export function reportMainWireFiveWallCoupledPredictorV1(
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): MainWireFiveWallCoupledPredictorReportV1 {
  const storage = requireStorage(workspace);
  return Object.freeze({
    predictorId: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
    hasAcceptedPair: storage.hasAcceptedPair,
    historyDepth: storage.historyDepth,
    expectedBaseRevision: storage.expectedBaseRevision,
    expectedBaseAcceptedTimeSec: storage.expectedBaseAcceptedTimeSec,
    predictionCount: storage.predictionCount,
    contextFallbackCount: storage.contextFallbackCount,
    dampedPredictionCount: storage.dampedPredictionCount,
    resetCount: storage.resetCount,
  });
}

/** Exact algorithmic history required for seed-identical continuation. */
export function checkpointMainWireFiveWallCoupledPredictorV1(
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): MainWireFiveWallCoupledPredictorCheckpointV2 {
  const storage = requireStorage(workspace);
  return Object.freeze({
    checkpointId: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    historyDepth: storage.historyDepth,
    expectedBaseRevision: storage.expectedBaseRevision,
    expectedBaseAcceptedTimeSec: storage.expectedBaseAcceptedTimeSec,
    oldestAcceptedMl: Object.freeze(Array.from(storage.oldestAcceptedMl)),
    olderAcceptedMl: Object.freeze(Array.from(storage.olderAcceptedMl)),
    previousAcceptedMl: Object.freeze(Array.from(storage.previousAcceptedMl)),
    currentAcceptedMl: Object.freeze(Array.from(storage.currentAcceptedMl)),
  });
}

/**
 * Restores predictor history only when its current root and accepted clock
 * exactly match the restored numerical authority.
 */
export function restoreMainWireFiveWallCoupledPredictorV1(
  input: unknown,
  accepted: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    unknownsMl: Float64Array;
  }>,
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): void {
  const checkpoint = validatePredictorCheckpoint(input);
  const storage = requireStorage(workspace);
  resetStorage(storage);
  if (checkpoint.historyDepth === 0) return;
  if (
    checkpoint.expectedBaseRevision !== accepted.revision
    || !sameNumber(
      checkpoint.expectedBaseAcceptedTimeSec,
      accepted.acceptedTimeSec,
    )
  ) {
    throw new Error("coupled predictor checkpoint clock differs from accepted state");
  }
  requireFiniteVector(accepted.unknownsMl, 30, "restored accepted root");
  for (let index = 0; index < 30; index += 1) {
    if (!sameCoupledRootValue(
      checkpoint.currentAcceptedMl[index]!,
      accepted.unknownsMl[index]!,
    )) {
      throw new Error(
        `coupled predictor checkpoint root differs from accepted state at index ${index}`,
      );
    }
  }
  storage.oldestAcceptedMl.set(checkpoint.oldestAcceptedMl);
  storage.olderAcceptedMl.set(checkpoint.olderAcceptedMl);
  storage.previousAcceptedMl.set(checkpoint.previousAcceptedMl);
  storage.currentAcceptedMl.set(checkpoint.currentAcceptedMl);
  storage.hasAcceptedPair = true;
  storage.historyDepth = checkpoint.historyDepth;
  storage.expectedBaseRevision = checkpoint.expectedBaseRevision;
  storage.expectedBaseAcceptedTimeSec =
    checkpoint.expectedBaseAcceptedTimeSec;
}

function matchesSequentialAcceptedState<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
  storage: PredictorStorage,
): boolean {
  if (
    !storage.hasAcceptedPair
    || storage.expectedBaseRevision !== context.baseRevision
    || !sameNumber(
      storage.expectedBaseAcceptedTimeSec,
      context.baseAcceptedTimeSec,
    )
  ) return false;
  for (let index = 0; index < context.dimension; index += 1) {
    const expected = storage.currentAcceptedMl[index]!;
    const actual = context.initialUnknownsMl[index]!;
    if (!sameCoupledRootValue(expected, actual)) return false;
  }
  return true;
}

function isAdmissiblePrediction<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
  values: Float64Array,
): boolean {
  if (values.length !== context.dimension) return false;
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (
      !Number.isFinite(value)
      || !(value > context.lowerBoundsMl[index]!)
      || !(value < context.upperBoundsMl[index]!)
    ) return false;
    sum += value;
  }
  return context.fixedGlobalTotalBloodVolumeMl - sum
    > context.minimumDependentSvVolumeMl;
}

function contextPrediction<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
): MainWireFiveWallCoupledPredictionV1 {
  return Object.freeze({
    predictorId: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
    mode: "context" as const,
    extrapolationScale: 0,
    initialGuessMl: context.initialUnknownsMl,
  });
}

function resetHistory(storage: PredictorStorage): void {
  storage.oldestAcceptedMl.fill(0);
  storage.olderAcceptedMl.fill(0);
  storage.previousAcceptedMl.fill(0);
  storage.currentAcceptedMl.fill(0);
  storage.hasAcceptedPair = false;
  storage.historyDepth = 0;
  storage.expectedBaseRevision = null;
  storage.expectedBaseAcceptedTimeSec = null;
  storage.resetCount += 1;
}

function resetStorage(storage: PredictorStorage): void {
  storage.oldestAcceptedMl.fill(0);
  storage.olderAcceptedMl.fill(0);
  storage.previousAcceptedMl.fill(0);
  storage.currentAcceptedMl.fill(0);
  storage.predictedMl.fill(0);
  storage.hasAcceptedPair = false;
  storage.historyDepth = 0;
  storage.expectedBaseRevision = null;
  storage.expectedBaseAcceptedTimeSec = null;
  storage.preparedBaseRevision = null;
  storage.preparedBaseAcceptedTimeSec = null;
  storage.predictionCount = 0;
  storage.contextFallbackCount = 0;
  storage.dampedPredictionCount = 0;
  storage.resetCount = 0;
}

function validatePredictorCheckpoint(
  input: unknown,
): MainWireFiveWallCoupledPredictorCheckpointV2 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("coupled predictor checkpoint must be a plain object");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("coupled predictor checkpoint must be a plain object");
  }
  const expectedKeys = [
    "checkpointId",
    "schemaVersion",
    "historyDepth",
    "expectedBaseRevision",
    "expectedBaseAcceptedTimeSec",
    "oldestAcceptedMl",
    "olderAcceptedMl",
    "previousAcceptedMl",
    "currentAcceptedMl",
  ].sort();
  const keys = Reflect.ownKeys(input);
  if (
    keys.some((key) => typeof key !== "string")
    || keys.length !== expectedKeys.length
    || (keys as string[]).sort().some((key, index) =>
      key !== expectedKeys[index])
  ) {
    throw new Error("coupled predictor checkpoint has unexpected fields");
  }
  const checkpointId = ownDataValue(input, "checkpointId");
  const schemaVersion = ownDataValue(input, "schemaVersion");
  const historyDepth = ownDataValue(input, "historyDepth");
  if (
    checkpointId
      !== MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_CHECKPOINT_V2_ID
    || schemaVersion !== 2
    || (historyDepth !== 0
      && historyDepth !== 2
      && historyDepth !== 3
      && historyDepth !== 4)
  ) {
    throw new Error("unsupported coupled predictor checkpoint schema");
  }
  const vectors = [
    validateCheckpointVector(ownDataValue(input, "oldestAcceptedMl")),
    validateCheckpointVector(ownDataValue(input, "olderAcceptedMl")),
    validateCheckpointVector(ownDataValue(input, "previousAcceptedMl")),
    validateCheckpointVector(ownDataValue(input, "currentAcceptedMl")),
  ] as const;
  const expectedBaseRevision = ownDataValue(input, "expectedBaseRevision");
  const expectedBaseAcceptedTimeSec = ownDataValue(
    input,
    "expectedBaseAcceptedTimeSec",
  );
  if (historyDepth === 0) {
    if (
      expectedBaseRevision !== null
      || expectedBaseAcceptedTimeSec !== null
      || vectors.some((vector) => vector.some((value) => value !== 0))
    ) {
      throw new Error("empty coupled predictor checkpoint is not canonical");
    }
  } else if (
    !Number.isSafeInteger(expectedBaseRevision)
    || (expectedBaseRevision as number) < 0
    || typeof expectedBaseAcceptedTimeSec !== "number"
    || !Number.isFinite(expectedBaseAcceptedTimeSec)
    || expectedBaseAcceptedTimeSec < 0
  ) {
    throw new Error("coupled predictor checkpoint clock is invalid");
  }
  if (
    historyDepth === 2
    && (vectors[0].some((value) => value !== 0)
      || vectors[1].some((value) => value !== 0))
  ) {
    throw new Error("two-root coupled predictor checkpoint is not canonical");
  }
  if (historyDepth === 3 && vectors[0].some((value) => value !== 0)) {
    throw new Error("three-root coupled predictor checkpoint is not canonical");
  }
  return Object.freeze({
    checkpointId:
      MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    historyDepth,
    expectedBaseRevision: expectedBaseRevision as number | null,
    expectedBaseAcceptedTimeSec:
      expectedBaseAcceptedTimeSec as number | null,
    oldestAcceptedMl: vectors[0],
    olderAcceptedMl: vectors[1],
    previousAcceptedMl: vectors[2],
    currentAcceptedMl: vectors[3],
  });
}

function ownDataValue(record: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(`coupled predictor checkpoint ${key} must be a data field`);
  }
  return descriptor.value;
}

function validateCheckpointVector(input: unknown): readonly number[] {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
    throw new Error("coupled predictor checkpoint vector is invalid");
  }
  const keys = Reflect.ownKeys(input);
  if (
    input.length !== 30
    || keys.length !== 31
    || keys.some((key) => typeof key === "symbol")
  ) {
    throw new Error("coupled predictor checkpoint vector is invalid");
  }
  const values = new Array<number>(30);
  for (let index = 0; index < 30; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || typeof descriptor.value !== "number"
      || !Number.isFinite(descriptor.value)
    ) {
      throw new Error("coupled predictor checkpoint vector is invalid");
    }
    values[index] = descriptor.value;
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(input, "length");
  if (
    lengthDescriptor === undefined
    || !("value" in lengthDescriptor)
    || lengthDescriptor.value !== 30
  ) {
    throw new Error("coupled predictor checkpoint vector is invalid");
  }
  return Object.freeze(values);
}

function requireStorage(
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): PredictorStorage {
  const storage = STORAGE.get(workspace);
  if (storage === undefined || workspace.dimension !== 30) {
    throw new Error("coupled predictor workspace is incompatible");
  }
  return storage;
}

function requireFiniteVector(
  values: Float64Array,
  expectedLength: number,
  label: string,
): void {
  if (!(values instanceof Float64Array) || values.length !== expectedLength) {
    throw new RangeError(`${label} must contain ${expectedLength} f64 values`);
  }
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${label} must contain only finite values`);
    }
  }
}

function sameNumber(left: number | null, right: number): boolean {
  return left !== null && Object.is(left, right);
}

function sameCoupledRootValue(left: number, right: number): boolean {
  const tolerance = 1e-12 * Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= tolerance;
}

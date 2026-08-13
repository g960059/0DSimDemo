import type {
  MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID =
  "main-wire-five-wall-coupled-linear-predictor-v1" as const;

export type MainWireFiveWallCoupledPredictorWorkspaceV1 = Readonly<{
  schemaId: "circleheart-main-wire-five-wall-coupled-predictor-workspace-v1";
  dimension: 30;
}>;

export type MainWireFiveWallCoupledPredictionV1 = Readonly<{
  predictorId: typeof MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID;
  mode: "context" | "linear-extrapolation";
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
  expectedBaseRevision: number | null;
  expectedBaseAcceptedTimeSec: number | null;
  predictionCount: number;
  contextFallbackCount: number;
  dampedPredictionCount: number;
  resetCount: number;
}>;

type PredictorStorage = {
  readonly previousAcceptedMl: Float64Array;
  readonly currentAcceptedMl: Float64Array;
  readonly predictedMl: Float64Array;
  hasAcceptedPair: boolean;
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
    previousAcceptedMl: new Float64Array(30),
    currentAcceptedMl: new Float64Array(30),
    predictedMl: new Float64Array(30),
    hasAcceptedPair: false,
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
 * Predicts the next implicit root from the last accepted displacement.
 * Prediction changes no model equation or tolerance. It is used only when
 * the caller presents the exact sequential accepted state; discontinuities,
 * restores, parameter changes, and inadmissible extrapolations fall back to
 * the context-owned starting point.
 */
export function prepareMainWireFiveWallCoupledPredictionV1<TWallState>(
  context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
  workspace: MainWireFiveWallCoupledPredictorWorkspaceV1,
): MainWireFiveWallCoupledPredictionV1 {
  const storage = requireStorage(workspace);
  storage.preparedBaseRevision = context.baseRevision;
  storage.preparedBaseAcceptedTimeSec = context.baseAcceptedTimeSec;
  if (!matchesSequentialAcceptedState(context, storage)) {
    if (storage.hasAcceptedPair) resetHistory(storage);
    storage.contextFallbackCount += 1;
    return contextPrediction(context);
  }

  let scale = 1;
  while (scale >= 1 / 256) {
    for (let index = 0; index < workspace.dimension; index += 1) {
      const current = context.initialUnknownsMl[index]!;
      storage.predictedMl[index] = current + scale * (
        current - storage.previousAcceptedMl[index]!
      );
    }
    if (isAdmissiblePrediction(context, storage.predictedMl)) {
      storage.predictionCount += 1;
      if (scale < 1) storage.dampedPredictionCount += 1;
      return Object.freeze({
        predictorId: MAIN_WIRE_FIVE_WALL_COUPLED_PREDICTOR_V1_ID,
        mode: "linear-extrapolation" as const,
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
  storage.previousAcceptedMl.set(context.initialUnknownsMl);
  storage.currentAcceptedMl.set(acceptedSolutionMl);
  storage.hasAcceptedPair = true;
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
    expectedBaseRevision: storage.expectedBaseRevision,
    expectedBaseAcceptedTimeSec: storage.expectedBaseAcceptedTimeSec,
    predictionCount: storage.predictionCount,
    contextFallbackCount: storage.contextFallbackCount,
    dampedPredictionCount: storage.dampedPredictionCount,
    resetCount: storage.resetCount,
  });
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
    const tolerance = 1e-12 * Math.max(1, Math.abs(expected), Math.abs(actual));
    if (Math.abs(expected - actual) > tolerance) return false;
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
  storage.hasAcceptedPair = false;
  storage.expectedBaseRevision = null;
  storage.expectedBaseAcceptedTimeSec = null;
  storage.resetCount += 1;
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

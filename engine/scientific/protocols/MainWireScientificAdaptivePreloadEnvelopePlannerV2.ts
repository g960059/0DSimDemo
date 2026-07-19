/**
 * Deterministic, simulation-free planning for a bidirectional TBV preload
 * envelope. The planner owns target ordering and seed provenance only; it does
 * not run the model or reinterpret P2/failure observations as P1 evidence.
 */

export const MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID =
  "main-wire-scientific-adaptive-preload-envelope-planner-v2" as const;

export const MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2 =
  Object.freeze({
    minimumNormalizedTbv: 0.35,
    baselineNormalizedTbv: 1,
    maximumNormalizedTbv: 1.30,
    defaultInitialStepNormalizedTbv: 0.05,
    minimumStepNormalizedTbv: 0.025,
    maximumStepNormalizedTbv: 0.10,
    growFactor: 1.5,
    shrinkFactor: 0.5,
    growMaximumCompletedBeatCount: 24,
    shrinkMinimumCompletedBeatCountExclusive: 24,
    minimumStepFailureLimit: 2,
  });

export type MainWireScientificPreloadEnvelopeLaneV2 = "negative" | "positive";
export type MainWireScientificPreloadEnvelopeShapeClassV2 =
  | "unavailable"
  | "low"
  | "moderate"
  | "high";

export type MainWireScientificPreloadEnvelopeMetricsV2 = Readonly<{
  cardiacOutputLMin: number;
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
}>;

export type MainWireScientificPreloadEnvelopeShapeSignalThresholdV2 = Readonly<{
  absoluteMidpointError: number;
  relativeMidpointError: number;
}>;

export type MainWireScientificPreloadEnvelopeShapeThresholdsV2 = Readonly<{
  cardiacOutputLMin: MainWireScientificPreloadEnvelopeShapeSignalThresholdV2;
  meanRapTransmuralMmHg: MainWireScientificPreloadEnvelopeShapeSignalThresholdV2;
  meanLapTransmuralMmHg: MainWireScientificPreloadEnvelopeShapeSignalThresholdV2;
  lowMaximumNormalizedError: number;
  highMinimumNormalizedError: number;
}>;

export const MAIN_WIRE_SCIENTIFIC_PRELOAD_ENVELOPE_SHAPE_THRESHOLDS_V2 =
  Object.freeze({
    cardiacOutputLMin: Object.freeze({
      absoluteMidpointError: 0.15,
      relativeMidpointError: 0.03,
    }),
    meanRapTransmuralMmHg: Object.freeze({
      absoluteMidpointError: 0.5,
      relativeMidpointError: 0.05,
    }),
    meanLapTransmuralMmHg: Object.freeze({
      absoluteMidpointError: 0.5,
      relativeMidpointError: 0.05,
    }),
    lowMaximumNormalizedError: 0.5,
    highMinimumNormalizedError: 1,
  }) satisfies MainWireScientificPreloadEnvelopeShapeThresholdsV2;

export type MainWireScientificPreloadEnvelopeShapePointV2 = Readonly<{
  normalizedTbv: number;
  metrics: MainWireScientificPreloadEnvelopeMetricsV2;
}>;

export type MainWireScientificPreloadEnvelopeSignalShapeV2 = Readonly<{
  measuredMiddle: number;
  linearlyPredictedMiddle: number;
  midpointError: number;
  allowedMidpointError: number;
  normalizedMidpointError: number;
  secondDividedDifference: number;
}>;

export type MainWireScientificPreloadEnvelopeShapeAssessmentV2 = Readonly<{
  classification: Exclude<MainWireScientificPreloadEnvelopeShapeClassV2, "unavailable">;
  maximumNormalizedMidpointError: number;
  cardiacOutputLMin: MainWireScientificPreloadEnvelopeSignalShapeV2;
  meanRapTransmuralMmHg: MainWireScientificPreloadEnvelopeSignalShapeV2;
  meanLapTransmuralMmHg: MainWireScientificPreloadEnvelopeSignalShapeV2;
}>;

export type MainWireScientificPreloadEnvelopeTargetDecisionV2 =
  | "initial-step"
  | "retain-step"
  | "fast-low-curvature-grow"
  | "slow-convergence-shrink"
  | "high-curvature-shrink"
  | "blocking-midpoint-retry"
  | "minimum-step-confirmation"
  | "hard-bound-clamp";

export type MainWireScientificPreloadEnvelopeTargetV2 = Readonly<{
  targetId: string;
  deterministicOrderKey: string;
  lane: MainWireScientificPreloadEnvelopeLaneV2;
  laneAttemptIndex: number;
  normalizedTbv: number;
  totalBloodVolumeMl: number;
  provenance: Readonly<{
    plannerId: typeof MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID;
    plannerVersion: "2.0.0";
    decision: MainWireScientificPreloadEnvelopeTargetDecisionV2;
    seedPeriodicity: "P1";
    seedPointId: string;
    seedNormalizedTbv: number;
    stepFromSeedNormalizedTbv: number;
    priorBlockingTargetId: string | null;
    minimumStepFailureOrdinal: 0 | 1 | 2;
  }>;
}>;

export type MainWireScientificPreloadEnvelopeP1PointV2 = Readonly<{
  pointId: string;
  targetId: string;
  normalizedTbv: number;
  totalBloodVolumeMl: number;
  completedBeatCount: number;
  metrics: MainWireScientificPreloadEnvelopeMetricsV2;
}>;

export type MainWireScientificPreloadEnvelopeBlockingOutcomeV2 =
  | "P2"
  | "failure";

export type MainWireScientificPreloadEnvelopeTargetObservationV2 =
  | Readonly<{
    targetId: string;
    lane: MainWireScientificPreloadEnvelopeLaneV2;
    outcome: "P1";
    completedBeatCount: number;
    metrics: MainWireScientificPreloadEnvelopeMetricsV2;
  }>
  | Readonly<{
    targetId: string;
    lane: MainWireScientificPreloadEnvelopeLaneV2;
    outcome: MainWireScientificPreloadEnvelopeBlockingOutcomeV2;
    completedBeatCount: number;
    reason: string;
  }>;

export type MainWireScientificPreloadEnvelopeBoundaryV2 = Readonly<{
  status: "unresolved-boundary";
  lane: MainWireScientificPreloadEnvelopeLaneV2;
  lastP1PointId: string;
  lastP1NormalizedTbv: number;
  blockedNormalizedTbv: number;
  blockingTargetIds: readonly string[];
  blockingOutcomes: readonly MainWireScientificPreloadEnvelopeBlockingOutcomeV2[];
  minimumStepFailureCount: 2;
}>;

type MainWireScientificPreloadEnvelopeBlockingAttemptV2 = Readonly<{
  targetId: string;
  normalizedTbv: number;
  stepFromSeedNormalizedTbv: number;
  outcome: MainWireScientificPreloadEnvelopeBlockingOutcomeV2;
}>;

export type MainWireScientificPreloadEnvelopeLaneStateV2 = Readonly<{
  lane: MainWireScientificPreloadEnvelopeLaneV2;
  status: "active" | "complete" | "unresolved-boundary";
  currentStepNormalizedTbv: number;
  nextLaneAttemptIndex: number;
  lastP1: MainWireScientificPreloadEnvelopeP1PointV2;
  p1History: readonly MainWireScientificPreloadEnvelopeP1PointV2[];
  pendingTarget: MainWireScientificPreloadEnvelopeTargetV2 | null;
  consecutiveBlockingAttempts: readonly MainWireScientificPreloadEnvelopeBlockingAttemptV2[];
  minimumStepFailureCount: 0 | 1 | 2;
  boundary: MainWireScientificPreloadEnvelopeBoundaryV2 | null;
}>;

export type MainWireScientificAdaptivePreloadEnvelopePlannerStateV2 = Readonly<{
  plannerId: typeof MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID;
  plannerVersion: "2.0.0";
  baselineTotalBloodVolumeMl: number;
  initialStepNormalizedTbv: number;
  shapeThresholds: MainWireScientificPreloadEnvelopeShapeThresholdsV2;
  lanes: Readonly<Record<
    MainWireScientificPreloadEnvelopeLaneV2,
    MainWireScientificPreloadEnvelopeLaneStateV2
  >>;
}>;

export type MainWireScientificAdaptivePreloadEnvelopePlannerInitializationV2 =
  Readonly<{
    state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2;
    initialTargets: readonly [
      MainWireScientificPreloadEnvelopeTargetV2,
      MainWireScientificPreloadEnvelopeTargetV2,
    ];
  }>;

export type MainWireScientificAdaptivePreloadEnvelopePlannerAdvanceV2 =
  Readonly<{
    state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2;
    completedTarget: MainWireScientificPreloadEnvelopeTargetV2;
    acceptedPoint: MainWireScientificPreloadEnvelopeP1PointV2 | null;
    shapeAssessment: MainWireScientificPreloadEnvelopeShapeAssessmentV2 | null;
    nextTarget: MainWireScientificPreloadEnvelopeTargetV2 | null;
    boundary: MainWireScientificPreloadEnvelopeBoundaryV2 | null;
  }>;

export function createMainWireScientificAdaptivePreloadEnvelopePlannerV2(
  input: Readonly<{
    baselineTotalBloodVolumeMl: number;
    baselineMetrics: MainWireScientificPreloadEnvelopeMetricsV2;
    initialStepNormalizedTbv?: number;
    shapeThresholds?: MainWireScientificPreloadEnvelopeShapeThresholdsV2;
  }>,
): MainWireScientificAdaptivePreloadEnvelopePlannerInitializationV2 {
  requirePositiveFinite(input.baselineTotalBloodVolumeMl, "baselineTotalBloodVolumeMl");
  validateMetrics(input.baselineMetrics);
  const limits = MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2;
  const initialStep = input.initialStepNormalizedTbv
    ?? limits.defaultInitialStepNormalizedTbv;
  if (
    !Number.isFinite(initialStep)
    || initialStep < limits.minimumStepNormalizedTbv
    || initialStep > limits.maximumStepNormalizedTbv
  ) {
    throw new Error(
      `initialStepNormalizedTbv must be within [${limits.minimumStepNormalizedTbv}, ${limits.maximumStepNormalizedTbv}]`,
    );
  }
  const inputThresholds = input.shapeThresholds
    ?? MAIN_WIRE_SCIENTIFIC_PRELOAD_ENVELOPE_SHAPE_THRESHOLDS_V2;
  validateShapeThresholds(inputThresholds);
  const thresholds = freezeShapeThresholds(inputThresholds);
  const baseline = p1Point(
    "preload-envelope-v2-baseline-nu-1p000000",
    "preload-envelope-v2-baseline-nu-1p000000",
    limits.baselineNormalizedTbv,
    input.baselineTotalBloodVolumeMl,
    0,
    input.baselineMetrics,
  );
  const negative = initialLane(
    "negative",
    baseline,
    initialStep,
    input.baselineTotalBloodVolumeMl,
  );
  const positive = initialLane(
    "positive",
    baseline,
    initialStep,
    input.baselineTotalBloodVolumeMl,
  );
  const state = freezePlannerState({
    plannerId: MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID,
    plannerVersion: "2.0.0",
    baselineTotalBloodVolumeMl: input.baselineTotalBloodVolumeMl,
    initialStepNormalizedTbv: initialStep,
    shapeThresholds: thresholds,
    lanes: { negative, positive },
  });
  return Object.freeze({
    state,
    initialTargets: Object.freeze([
      negative.pendingTarget!,
      positive.pendingTarget!,
    ] as const),
  });
}

export function advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  observation: MainWireScientificPreloadEnvelopeTargetObservationV2,
): MainWireScientificAdaptivePreloadEnvelopePlannerAdvanceV2 {
  assertPlannerState(state);
  const lane = state.lanes[observation.lane];
  const completedTarget = lane.pendingTarget;
  if (lane.status !== "active" || completedTarget === null) {
    throw new Error(`${observation.lane} lane has no pending target`);
  }
  if (observation.targetId !== completedTarget.targetId) {
    throw new Error(
      `stale or mismatched target ${observation.targetId}; expected ${completedTarget.targetId}`,
    );
  }
  requirePositiveInteger(observation.completedBeatCount, "completedBeatCount");

  const advanced = observation.outcome === "P1"
    ? acceptP1(state, lane, completedTarget, observation)
    : acceptBlocking(state, lane, completedTarget, observation);
  const nextState = freezePlannerState({
    ...state,
    lanes: {
      ...state.lanes,
      [observation.lane]: advanced.lane,
    },
  });
  return Object.freeze({
    state: nextState,
    completedTarget,
    acceptedPoint: advanced.acceptedPoint,
    shapeAssessment: advanced.shapeAssessment,
    nextTarget: advanced.lane.pendingTarget,
    boundary: advanced.lane.boundary,
  });
}

export function assessMainWireScientificPreloadEnvelopeShapeV2(
  first: MainWireScientificPreloadEnvelopeShapePointV2,
  second: MainWireScientificPreloadEnvelopeShapePointV2,
  third: MainWireScientificPreloadEnvelopeShapePointV2,
  thresholds: MainWireScientificPreloadEnvelopeShapeThresholdsV2 =
    MAIN_WIRE_SCIENTIFIC_PRELOAD_ENVELOPE_SHAPE_THRESHOLDS_V2,
): MainWireScientificPreloadEnvelopeShapeAssessmentV2 {
  validateShapeThresholds(thresholds);
  const points = [first, second, third]
    .map((point) => {
      if (!Number.isFinite(point.normalizedTbv)) {
        throw new Error("shape point normalizedTbv must be finite");
      }
      validateMetrics(point.metrics);
      return point;
    })
    .sort((left, right) => left.normalizedTbv - right.normalizedTbv);
  const [left, middle, right] = points;
  if (
    left === undefined || middle === undefined || right === undefined
    || !(left.normalizedTbv < middle.normalizedTbv)
    || !(middle.normalizedTbv < right.normalizedTbv)
  ) {
    throw new Error("shape points must have three distinct normalized TBV coordinates");
  }
  const cardiacOutputLMin = signalShape(
    left.normalizedTbv,
    left.metrics.cardiacOutputLMin,
    middle.normalizedTbv,
    middle.metrics.cardiacOutputLMin,
    right.normalizedTbv,
    right.metrics.cardiacOutputLMin,
    thresholds.cardiacOutputLMin,
  );
  const meanRapTransmuralMmHg = signalShape(
    left.normalizedTbv,
    left.metrics.meanRapTransmuralMmHg,
    middle.normalizedTbv,
    middle.metrics.meanRapTransmuralMmHg,
    right.normalizedTbv,
    right.metrics.meanRapTransmuralMmHg,
    thresholds.meanRapTransmuralMmHg,
  );
  const meanLapTransmuralMmHg = signalShape(
    left.normalizedTbv,
    left.metrics.meanLapTransmuralMmHg,
    middle.normalizedTbv,
    middle.metrics.meanLapTransmuralMmHg,
    right.normalizedTbv,
    right.metrics.meanLapTransmuralMmHg,
    thresholds.meanLapTransmuralMmHg,
  );
  const maximumNormalizedMidpointError = Math.max(
    cardiacOutputLMin.normalizedMidpointError,
    meanRapTransmuralMmHg.normalizedMidpointError,
    meanLapTransmuralMmHg.normalizedMidpointError,
  );
  const classification = maximumNormalizedMidpointError
      >= thresholds.highMinimumNormalizedError
    ? "high" as const
    : maximumNormalizedMidpointError <= thresholds.lowMaximumNormalizedError
      ? "low" as const
      : "moderate" as const;
  return Object.freeze({
    classification,
    maximumNormalizedMidpointError,
    cardiacOutputLMin,
    meanRapTransmuralMmHg,
    meanLapTransmuralMmHg,
  });
}

function acceptP1(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  lane: MainWireScientificPreloadEnvelopeLaneStateV2,
  completedTarget: MainWireScientificPreloadEnvelopeTargetV2,
  observation: Extract<MainWireScientificPreloadEnvelopeTargetObservationV2, { outcome: "P1" }>,
) {
  validateMetrics(observation.metrics);
  const acceptedPoint = p1Point(
    `preload-envelope-v2-${lane.lane}-p1-${String(completedTarget.laneAttemptIndex).padStart(4, "0")}`,
    completedTarget.targetId,
    completedTarget.normalizedTbv,
    completedTarget.totalBloodVolumeMl,
    observation.completedBeatCount,
    observation.metrics,
  );
  const p1History = Object.freeze([...lane.p1History, acceptedPoint]);
  const shapeAssessment = p1History.length >= 3
    ? assessMainWireScientificPreloadEnvelopeShapeV2(
      p1History.at(-3)!,
      p1History.at(-2)!,
      p1History.at(-1)!,
      state.shapeThresholds,
    )
    : null;
  if (atLaneHardBound(lane.lane, acceptedPoint.normalizedTbv)) {
    return {
      acceptedPoint,
      shapeAssessment,
      lane: freezeLane({
        ...lane,
        status: "complete",
        lastP1: acceptedPoint,
        p1History,
        pendingTarget: null,
        consecutiveBlockingAttempts: [],
        minimumStepFailureCount: 0,
      }),
    };
  }

  const adapted = adaptStep(
    lane.currentStepNormalizedTbv,
    observation.completedBeatCount,
    shapeAssessment?.classification ?? "unavailable",
  );
  const target = nextContinuationTarget(
    state,
    lane.lane,
    lane.nextLaneAttemptIndex,
    acceptedPoint,
    adapted.step,
    adapted.decision,
  );
  return {
    acceptedPoint,
    shapeAssessment,
    lane: freezeLane({
      ...lane,
      status: "active",
      currentStepNormalizedTbv: adapted.step,
      nextLaneAttemptIndex: lane.nextLaneAttemptIndex + 1,
      lastP1: acceptedPoint,
      p1History,
      pendingTarget: target,
      consecutiveBlockingAttempts: [],
      minimumStepFailureCount: 0,
      boundary: null,
    }),
  };
}

function acceptBlocking(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  lane: MainWireScientificPreloadEnvelopeLaneStateV2,
  completedTarget: MainWireScientificPreloadEnvelopeTargetV2,
  observation: Extract<MainWireScientificPreloadEnvelopeTargetObservationV2, { outcome: "P2" | "failure" }>,
) {
  if (observation.reason.trim().length === 0) {
    throw new Error("blocking observation reason must not be empty");
  }
  const limits = MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2;
  const blockedStep = roundNormalized(Math.abs(
    completedTarget.normalizedTbv - lane.lastP1.normalizedTbv,
  ));
  const blockedAtMinimum = blockedStep
    <= limits.minimumStepNormalizedTbv + 1e-9;
  const attempt: MainWireScientificPreloadEnvelopeBlockingAttemptV2 = Object.freeze({
    targetId: completedTarget.targetId,
    normalizedTbv: completedTarget.normalizedTbv,
    stepFromSeedNormalizedTbv: blockedStep,
    outcome: observation.outcome,
  });
  const blockingAttempts = Object.freeze([
    ...lane.consecutiveBlockingAttempts,
    attempt,
  ]);
  const minimumStepFailureCount = blockedAtMinimum
    ? Math.min(2, lane.minimumStepFailureCount + 1) as 1 | 2
    : lane.minimumStepFailureCount;
  if (minimumStepFailureCount >= limits.minimumStepFailureLimit) {
    const minimumAttempts = blockingAttempts.filter(({ stepFromSeedNormalizedTbv }) =>
      stepFromSeedNormalizedTbv <= limits.minimumStepNormalizedTbv + 1e-9);
    const boundary: MainWireScientificPreloadEnvelopeBoundaryV2 = Object.freeze({
      status: "unresolved-boundary",
      lane: lane.lane,
      lastP1PointId: lane.lastP1.pointId,
      lastP1NormalizedTbv: lane.lastP1.normalizedTbv,
      blockedNormalizedTbv: completedTarget.normalizedTbv,
      blockingTargetIds: Object.freeze(minimumAttempts.map(({ targetId }) => targetId)),
      blockingOutcomes: Object.freeze(minimumAttempts.map(({ outcome }) => outcome)),
      minimumStepFailureCount: 2,
    });
    return {
      acceptedPoint: null,
      shapeAssessment: null,
      lane: freezeLane({
        ...lane,
        status: "unresolved-boundary",
        pendingTarget: null,
        consecutiveBlockingAttempts: blockingAttempts,
        minimumStepFailureCount: 2,
        boundary,
      }),
    };
  }

  const nextStep = blockedAtMinimum
    ? limits.minimumStepNormalizedTbv
    : roundNormalized(Math.max(
      limits.minimumStepNormalizedTbv,
      blockedStep * limits.shrinkFactor,
    ));
  const nextNormalizedTbv = blockedAtMinimum
    ? completedTarget.normalizedTbv
    : moveFromSeed(lane.lane, lane.lastP1.normalizedTbv, nextStep);
  const nextTarget = target(
    state.baselineTotalBloodVolumeMl,
    lane.lane,
    lane.nextLaneAttemptIndex,
    nextNormalizedTbv,
    lane.lastP1,
    blockedAtMinimum
      ? "minimum-step-confirmation"
      : "blocking-midpoint-retry",
    completedTarget.targetId,
    minimumStepFailureCount,
  );
  return {
    acceptedPoint: null,
    shapeAssessment: null,
    lane: freezeLane({
      ...lane,
      status: "active",
      currentStepNormalizedTbv: nextStep,
      nextLaneAttemptIndex: lane.nextLaneAttemptIndex + 1,
      pendingTarget: nextTarget,
      consecutiveBlockingAttempts: blockingAttempts,
      minimumStepFailureCount,
      boundary: null,
    }),
  };
}

function initialLane(
  lane: MainWireScientificPreloadEnvelopeLaneV2,
  baseline: MainWireScientificPreloadEnvelopeP1PointV2,
  initialStep: number,
  baselineTotalBloodVolumeMl: number,
): MainWireScientificPreloadEnvelopeLaneStateV2 {
  const pendingTarget = target(
    baselineTotalBloodVolumeMl,
    lane,
    1,
    moveFromSeed(lane, baseline.normalizedTbv, initialStep),
    baseline,
    "initial-step",
    null,
    0,
  );
  return freezeLane({
    lane,
    status: "active",
    currentStepNormalizedTbv: initialStep,
    nextLaneAttemptIndex: 2,
    lastP1: baseline,
    p1History: [baseline],
    pendingTarget,
    consecutiveBlockingAttempts: [],
    minimumStepFailureCount: 0,
    boundary: null,
  });
}

function nextContinuationTarget(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  lane: MainWireScientificPreloadEnvelopeLaneV2,
  laneAttemptIndex: number,
  seed: MainWireScientificPreloadEnvelopeP1PointV2,
  step: number,
  decision: MainWireScientificPreloadEnvelopeTargetDecisionV2,
) {
  const moved = moveFromSeed(lane, seed.normalizedTbv, step);
  const bound = laneHardBound(lane);
  const clamped = lane === "negative"
    ? Math.max(bound, moved)
    : Math.min(bound, moved);
  return target(
    state.baselineTotalBloodVolumeMl,
    lane,
    laneAttemptIndex,
    clamped,
    seed,
    clamped !== moved ? "hard-bound-clamp" : decision,
    null,
    0,
  );
}

function target(
  baselineTotalBloodVolumeMl: number,
  lane: MainWireScientificPreloadEnvelopeLaneV2,
  laneAttemptIndex: number,
  normalizedTbvInput: number,
  seed: MainWireScientificPreloadEnvelopeP1PointV2,
  decision: MainWireScientificPreloadEnvelopeTargetDecisionV2,
  priorBlockingTargetId: string | null,
  minimumStepFailureOrdinal: 0 | 1 | 2,
): MainWireScientificPreloadEnvelopeTargetV2 {
  const normalizedTbv = roundNormalized(normalizedTbvInput);
  const targetId = `preload-envelope-v2-${lane}-${String(laneAttemptIndex).padStart(4, "0")}-nu-${normalizedId(normalizedTbv)}`;
  const stepFromSeedNormalizedTbv = roundNormalized(Math.abs(
    normalizedTbv - seed.normalizedTbv,
  ));
  return Object.freeze({
    targetId,
    deterministicOrderKey: `${lane === "negative" ? "0" : "1"}:${String(laneAttemptIndex).padStart(6, "0")}`,
    lane,
    laneAttemptIndex,
    normalizedTbv,
    totalBloodVolumeMl: roundVolume(baselineTotalBloodVolumeMl * normalizedTbv),
    provenance: Object.freeze({
      plannerId: MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID,
      plannerVersion: "2.0.0",
      decision,
      seedPeriodicity: "P1",
      seedPointId: seed.pointId,
      seedNormalizedTbv: seed.normalizedTbv,
      stepFromSeedNormalizedTbv,
      priorBlockingTargetId,
      minimumStepFailureOrdinal,
    }),
  });
}

function p1Point(
  pointId: string,
  targetId: string,
  normalizedTbv: number,
  totalBloodVolumeMl: number,
  completedBeatCount: number,
  metrics: MainWireScientificPreloadEnvelopeMetricsV2,
): MainWireScientificPreloadEnvelopeP1PointV2 {
  return Object.freeze({
    pointId,
    targetId,
    normalizedTbv,
    totalBloodVolumeMl,
    completedBeatCount,
    metrics: Object.freeze({ ...metrics }),
  });
}

function adaptStep(
  currentStep: number,
  completedBeatCount: number,
  shape: MainWireScientificPreloadEnvelopeShapeClassV2,
): Readonly<{
  step: number;
  decision: MainWireScientificPreloadEnvelopeTargetDecisionV2;
}> {
  const limits = MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2;
  if (shape === "high") {
    return Object.freeze({
      step: roundNormalized(Math.max(
        limits.minimumStepNormalizedTbv,
        currentStep * limits.shrinkFactor,
      )),
      decision: "high-curvature-shrink",
    });
  }
  if (completedBeatCount > limits.shrinkMinimumCompletedBeatCountExclusive) {
    return Object.freeze({
      step: roundNormalized(Math.max(
        limits.minimumStepNormalizedTbv,
        currentStep * limits.shrinkFactor,
      )),
      decision: "slow-convergence-shrink",
    });
  }
  if (
    completedBeatCount <= limits.growMaximumCompletedBeatCount
    && shape === "low"
  ) {
    return Object.freeze({
      step: roundNormalized(Math.min(
        limits.maximumStepNormalizedTbv,
        currentStep * limits.growFactor,
      )),
      decision: "fast-low-curvature-grow",
    });
  }
  return Object.freeze({ step: currentStep, decision: "retain-step" });
}

function signalShape(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: MainWireScientificPreloadEnvelopeShapeSignalThresholdV2,
): MainWireScientificPreloadEnvelopeSignalShapeV2 {
  const fraction = (x1 - x0) / (x2 - x0);
  const predicted = y0 + fraction * (y2 - y0);
  const error = y1 - predicted;
  const scale = Math.max(Math.abs(y0), Math.abs(y1), Math.abs(y2), Math.abs(predicted));
  const allowed = Math.max(
    threshold.absoluteMidpointError,
    threshold.relativeMidpointError * scale,
  );
  const firstSlope = (y1 - y0) / (x1 - x0);
  const secondSlope = (y2 - y1) / (x2 - x1);
  const secondDividedDifference = 2 * (secondSlope - firstSlope) / (x2 - x0);
  return Object.freeze({
    measuredMiddle: y1,
    linearlyPredictedMiddle: predicted,
    midpointError: error,
    allowedMidpointError: allowed,
    normalizedMidpointError: Math.abs(error) / allowed,
    secondDividedDifference,
  });
}

function validateMetrics(metrics: MainWireScientificPreloadEnvelopeMetricsV2): void {
  for (const [name, value] of Object.entries(metrics)) {
    if (!Number.isFinite(value)) {
      throw new Error(`${name} must be finite`);
    }
  }
}

function validateShapeThresholds(
  thresholds: MainWireScientificPreloadEnvelopeShapeThresholdsV2,
): void {
  for (const [name, signal] of Object.entries({
    cardiacOutputLMin: thresholds.cardiacOutputLMin,
    meanRapTransmuralMmHg: thresholds.meanRapTransmuralMmHg,
    meanLapTransmuralMmHg: thresholds.meanLapTransmuralMmHg,
  })) {
    requirePositiveFinite(signal.absoluteMidpointError, `${name}.absoluteMidpointError`);
    requirePositiveFinite(signal.relativeMidpointError, `${name}.relativeMidpointError`);
  }
  requirePositiveFinite(
    thresholds.lowMaximumNormalizedError,
    "lowMaximumNormalizedError",
  );
  requirePositiveFinite(
    thresholds.highMinimumNormalizedError,
    "highMinimumNormalizedError",
  );
  if (
    thresholds.lowMaximumNormalizedError
    >= thresholds.highMinimumNormalizedError
  ) {
    throw new Error(
      "lowMaximumNormalizedError must be less than highMinimumNormalizedError",
    );
  }
}

function assertPlannerState(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
): void {
  if (
    state.plannerId
      !== MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_PLANNER_V2_ID
    || state.plannerVersion !== "2.0.0"
  ) {
    throw new Error("adaptive preload envelope planner identity mismatch");
  }
}

function freezePlannerState(
  state: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
): MainWireScientificAdaptivePreloadEnvelopePlannerStateV2 {
  return Object.freeze({
    ...state,
    shapeThresholds: state.shapeThresholds,
    lanes: Object.freeze({
      negative: state.lanes.negative,
      positive: state.lanes.positive,
    }),
  });
}

function freezeShapeThresholds(
  thresholds: MainWireScientificPreloadEnvelopeShapeThresholdsV2,
): MainWireScientificPreloadEnvelopeShapeThresholdsV2 {
  return Object.freeze({
    cardiacOutputLMin: Object.freeze({ ...thresholds.cardiacOutputLMin }),
    meanRapTransmuralMmHg: Object.freeze({ ...thresholds.meanRapTransmuralMmHg }),
    meanLapTransmuralMmHg: Object.freeze({ ...thresholds.meanLapTransmuralMmHg }),
    lowMaximumNormalizedError: thresholds.lowMaximumNormalizedError,
    highMinimumNormalizedError: thresholds.highMinimumNormalizedError,
  });
}

function freezeLane(
  lane: MainWireScientificPreloadEnvelopeLaneStateV2,
): MainWireScientificPreloadEnvelopeLaneStateV2 {
  return Object.freeze({
    ...lane,
    p1History: Object.freeze([...lane.p1History]),
    consecutiveBlockingAttempts: Object.freeze([
      ...lane.consecutiveBlockingAttempts,
    ]),
  });
}

function moveFromSeed(
  lane: MainWireScientificPreloadEnvelopeLaneV2,
  seedNormalizedTbv: number,
  step: number,
): number {
  return roundNormalized(seedNormalizedTbv + (lane === "negative" ? -step : step));
}

function laneHardBound(lane: MainWireScientificPreloadEnvelopeLaneV2): number {
  const limits = MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2;
  return lane === "negative"
    ? limits.minimumNormalizedTbv
    : limits.maximumNormalizedTbv;
}

function atLaneHardBound(
  lane: MainWireScientificPreloadEnvelopeLaneV2,
  normalizedTbv: number,
): boolean {
  return Math.abs(normalizedTbv - laneHardBound(lane)) <= 1e-9;
}

function normalizedId(value: number): string {
  return value.toFixed(6).replace(".", "p");
}

function roundNormalized(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

function roundVolume(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function requirePositiveFinite(value: number, name: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
}

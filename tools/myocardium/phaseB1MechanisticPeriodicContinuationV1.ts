export const PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID =
  "phase-b1-mechanistic-repeated-cycle-fixed-point-continuation-v1" as const;

export const PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1 =
  Object.freeze({
    continuationId: PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID,
    algorithm: "repeated-cycle-fixed-point-continuation" as const,
    minimumWarmupCycleCount: 5,
    requiredConsecutivePassingCycleCount: 3,
    completeStateEndpointDistanceTolerance: 1e-6,
    streakWindowEndpointDistanceTolerance: 1e-6,
    maximumLeftRightCardiacOutputMismatchFraction: 0.05,
    maximumAllEdgeSignedMeanFlowMismatchFraction: 0.05,
    defaultMaximumCycleCount: 30,
    maximumCycleExhaustionMeansConvergence: false as const,
    singleCycleMayEstablishPeriodicOrbit: false as const,
    fullHighDimensionalNewtonShootingUsed: false as const,
    futureShootingBoundary:
      "replace-the-cycle-map-iteration-with-a-matrix-free-shooting-root-without-changing-the-complete-state-or-hemodynamic-gates" as const,
  } as const);

export type PhaseB1MechanisticPeriodicContinuationTerminalStatusV1 =
  | "running"
  | "converged-repeated-cycle-fixed-point"
  | "maximum-cycles-exhausted-without-convergence";

export type PhaseB1MechanisticPeriodicCycleReadbackV1 = Readonly<{
  cycleIndex: number;
  maximumNormalizedEndpointDistance: number;
  streakWindowNormalizedEndpointDistance: number;
  leftCardiacOutputLPerMin: number;
  rightCardiacOutputLPerMin: number;
  leftVentricularEndDiastolicVolumeMl: number;
  leftVentricularEndSystolicVolumeMl: number;
  systemicArterialMinimumPressureMmHg: number;
  systemicArterialMaximumPressureMmHg: number;
  systemicArterialMeanPressureMmHg: number;
  maximumAllEdgeSignedMeanFlowMismatchFraction: number;
  everyEdgeSignedMeanFlowForward: boolean;
  committedIntervalTotalBloodVolumeConservationGatePass: boolean;
  structuralAndNumericalIntervalLedgerGatesPass: boolean;
}>;

export type PhaseB1MechanisticPeriodicContinuationCheckpointV1 = Readonly<{
  continuationId: typeof PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID;
  cycleIndex: number;
  completedCycleCount: number;
  warmupCycleCountRequired: number;
  warmupCycleCountCompleted: number;
  warmupComplete: boolean;
  convergenceGateEligibleThisCycle: boolean;
  completeStateEndpointDistance: number;
  completeStateEndpointDistanceTolerance: number;
  completeStateEndpointDistancePass: boolean;
  streakWindowEndpointDistance: number;
  streakWindowEndpointDistanceTolerance: number;
  streakWindowEndpointDistancePass: boolean;
  leftCardiacOutputLPerMin: number;
  rightCardiacOutputLPerMin: number;
  leftRightCardiacOutputMismatchFraction: number;
  maximumLeftRightCardiacOutputMismatchFraction: number;
  leftRightCardiacOutputMismatchPass: boolean;
  allEdgeSignedMeanFlowMismatchFraction: number;
  maximumAllEdgeSignedMeanFlowMismatchFraction: number;
  allEdgeSignedMeanFlowMismatchPass: boolean;
  everyEdgeSignedMeanFlowForward: boolean;
  committedIntervalTotalBloodVolumeConservationGatePass: boolean;
  structuralAndNumericalIntervalLedgerGatesPass: boolean;
  cycleLocalConvergencePass: boolean;
  consecutivePassingCycleCount: number;
  requiredConsecutivePassingCycleCount: number;
  terminalStatus: PhaseB1MechanisticPeriodicContinuationTerminalStatusV1;
  repeatedCycleFixedPointConvergencePass: boolean;
  maximumCycleExhaustionMeansConvergence: false;
}>;

export type PhaseB1MechanisticPeriodicContinuationStateV1 = Readonly<{
  continuationId: typeof PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID;
  maximumCycleCount: number;
  completedCycleCount: number;
  consecutivePassingCycleCount: number;
  terminalStatus: PhaseB1MechanisticPeriodicContinuationTerminalStatusV1;
  repeatedCycleFixedPointConvergencePass: boolean;
  lastCheckpoint: PhaseB1MechanisticPeriodicContinuationCheckpointV1 | null;
}>;

export function initializePhaseB1MechanisticPeriodicContinuationV1(
  maximumCycleCount: number,
): PhaseB1MechanisticPeriodicContinuationStateV1 {
  if (!Number.isSafeInteger(maximumCycleCount) || maximumCycleCount <= 0) {
    throw new Error("maximumCycleCount must be a positive safe integer");
  }
  return Object.freeze({
    continuationId: PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID,
    maximumCycleCount,
    completedCycleCount: 0,
    consecutivePassingCycleCount: 0,
    terminalStatus: "running" as const,
    repeatedCycleFixedPointConvergencePass: false,
    lastCheckpoint: null,
  });
}

export function recordPhaseB1MechanisticPeriodicContinuationCycleV1(input: Readonly<{
  state: PhaseB1MechanisticPeriodicContinuationStateV1;
  readback: PhaseB1MechanisticPeriodicCycleReadbackV1;
}>): Readonly<{
  state: PhaseB1MechanisticPeriodicContinuationStateV1;
  checkpoint: PhaseB1MechanisticPeriodicContinuationCheckpointV1;
}> {
  assertRunningState(input.state);
  assertReadback(input.readback);
  if (input.readback.cycleIndex !== input.state.completedCycleCount) {
    throw new Error("periodic continuation cycle index is not contiguous");
  }

  const policy = PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_POLICY_V1;
  const completedCycleCount = input.state.completedCycleCount + 1;
  const warmupCycleCountCompleted = Math.min(
    completedCycleCount,
    policy.minimumWarmupCycleCount,
  );
  const warmupComplete = completedCycleCount >= policy.minimumWarmupCycleCount;
  // Exactly minimumWarmupCycleCount complete beats are discarded.  The next
  // beat is the first one eligible to contribute to the convergence streak.
  const convergenceGateEligibleThisCycle =
    completedCycleCount > policy.minimumWarmupCycleCount;
  const completeStateEndpointDistancePass =
    input.readback.maximumNormalizedEndpointDistance
      < policy.completeStateEndpointDistanceTolerance;
  const leftRightCardiacOutputMismatchFraction =
    computeLeftRightCardiacOutputMismatchFractionV1(
      input.readback.leftCardiacOutputLPerMin,
      input.readback.rightCardiacOutputLPerMin,
    );
  const leftRightCardiacOutputMismatchPass =
    leftRightCardiacOutputMismatchFraction
      < policy.maximumLeftRightCardiacOutputMismatchFraction;
  const allEdgeSignedMeanFlowMismatchPass =
    input.readback.maximumAllEdgeSignedMeanFlowMismatchFraction
      < policy.maximumAllEdgeSignedMeanFlowMismatchFraction;
  const cycleLocalConvergencePass = convergenceGateEligibleThisCycle
    && completeStateEndpointDistancePass
    && leftRightCardiacOutputMismatchPass
    && allEdgeSignedMeanFlowMismatchPass
    && input.readback.everyEdgeSignedMeanFlowForward
    && input.readback.committedIntervalTotalBloodVolumeConservationGatePass
    && input.readback.structuralAndNumericalIntervalLedgerGatesPass;
  const tentativeConsecutivePassingCycleCount = cycleLocalConvergencePass
    ? input.state.consecutivePassingCycleCount + 1
    : 0;
  const streakWindowEndpointDistancePass =
    input.readback.streakWindowNormalizedEndpointDistance
      < policy.streakWindowEndpointDistanceTolerance;
  const consecutivePassingCycleCount =
    tentativeConsecutivePassingCycleCount
      >= policy.requiredConsecutivePassingCycleCount
      && !streakWindowEndpointDistancePass
      ? 0
      : tentativeConsecutivePassingCycleCount;
  const repeatedCycleFixedPointConvergencePass =
    consecutivePassingCycleCount
      >= policy.requiredConsecutivePassingCycleCount;
  const terminalStatus = repeatedCycleFixedPointConvergencePass
    ? "converged-repeated-cycle-fixed-point" as const
    : completedCycleCount >= input.state.maximumCycleCount
      ? "maximum-cycles-exhausted-without-convergence" as const
      : "running" as const;
  const checkpoint = Object.freeze({
    continuationId: PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID,
    cycleIndex: input.readback.cycleIndex,
    completedCycleCount,
    warmupCycleCountRequired: policy.minimumWarmupCycleCount,
    warmupCycleCountCompleted,
    warmupComplete,
    convergenceGateEligibleThisCycle,
    completeStateEndpointDistance:
      input.readback.maximumNormalizedEndpointDistance,
    completeStateEndpointDistanceTolerance:
      policy.completeStateEndpointDistanceTolerance,
    completeStateEndpointDistancePass,
    streakWindowEndpointDistance:
      input.readback.streakWindowNormalizedEndpointDistance,
    streakWindowEndpointDistanceTolerance:
      policy.streakWindowEndpointDistanceTolerance,
    streakWindowEndpointDistancePass,
    leftCardiacOutputLPerMin: input.readback.leftCardiacOutputLPerMin,
    rightCardiacOutputLPerMin: input.readback.rightCardiacOutputLPerMin,
    leftRightCardiacOutputMismatchFraction,
    maximumLeftRightCardiacOutputMismatchFraction:
      policy.maximumLeftRightCardiacOutputMismatchFraction,
    leftRightCardiacOutputMismatchPass,
    allEdgeSignedMeanFlowMismatchFraction:
      input.readback.maximumAllEdgeSignedMeanFlowMismatchFraction,
    maximumAllEdgeSignedMeanFlowMismatchFraction:
      policy.maximumAllEdgeSignedMeanFlowMismatchFraction,
    allEdgeSignedMeanFlowMismatchPass,
    everyEdgeSignedMeanFlowForward:
      input.readback.everyEdgeSignedMeanFlowForward,
    committedIntervalTotalBloodVolumeConservationGatePass:
      input.readback.committedIntervalTotalBloodVolumeConservationGatePass,
    structuralAndNumericalIntervalLedgerGatesPass:
      input.readback.structuralAndNumericalIntervalLedgerGatesPass,
    cycleLocalConvergencePass,
    consecutivePassingCycleCount,
    requiredConsecutivePassingCycleCount:
      policy.requiredConsecutivePassingCycleCount,
    terminalStatus,
    repeatedCycleFixedPointConvergencePass,
    maximumCycleExhaustionMeansConvergence: false as const,
  });
  const state = Object.freeze({
    continuationId: PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID,
    maximumCycleCount: input.state.maximumCycleCount,
    completedCycleCount,
    consecutivePassingCycleCount,
    terminalStatus,
    repeatedCycleFixedPointConvergencePass,
    lastCheckpoint: checkpoint,
  });
  return Object.freeze({ state, checkpoint });
}

export function computeLeftRightCardiacOutputMismatchFractionV1(
  leftCardiacOutputLPerMin: number,
  rightCardiacOutputLPerMin: number,
): number {
  requireFinite(leftCardiacOutputLPerMin, "leftCardiacOutputLPerMin");
  requireFinite(rightCardiacOutputLPerMin, "rightCardiacOutputLPerMin");
  const denominator = 0.5 * (
    Math.abs(leftCardiacOutputLPerMin)
    + Math.abs(rightCardiacOutputLPerMin)
  );
  // Zero/zero output is not a usable periodic-flow operating point.  Return a
  // finite fail-closed sentinel so the canonical JSON report never contains
  // Infinity while the <5% gate remains closed.
  if (!(denominator > 0)) return 1;
  return Math.abs(leftCardiacOutputLPerMin - rightCardiacOutputLPerMin)
    / denominator;
}

function assertRunningState(
  state: PhaseB1MechanisticPeriodicContinuationStateV1,
): void {
  if (
    state.continuationId !== PHASE_B1_MECHANISTIC_PERIODIC_CONTINUATION_V1_ID
    || state.terminalStatus !== "running"
    || state.repeatedCycleFixedPointConvergencePass
    || state.completedCycleCount < 0
    || !Number.isSafeInteger(state.completedCycleCount)
    || state.completedCycleCount >= state.maximumCycleCount
    || state.consecutivePassingCycleCount < 0
    || !Number.isSafeInteger(state.consecutivePassingCycleCount)
  ) {
    throw new Error("periodic continuation state is not live and consistent");
  }
}

function assertReadback(readback: PhaseB1MechanisticPeriodicCycleReadbackV1): void {
  if (!Number.isSafeInteger(readback.cycleIndex) || readback.cycleIndex < 0) {
    throw new Error("readback.cycleIndex must be a nonnegative safe integer");
  }
  const finiteFields = [
    "maximumNormalizedEndpointDistance",
    "streakWindowNormalizedEndpointDistance",
    "leftCardiacOutputLPerMin",
    "rightCardiacOutputLPerMin",
    "leftVentricularEndDiastolicVolumeMl",
    "leftVentricularEndSystolicVolumeMl",
    "systemicArterialMinimumPressureMmHg",
    "systemicArterialMaximumPressureMmHg",
    "systemicArterialMeanPressureMmHg",
    "maximumAllEdgeSignedMeanFlowMismatchFraction",
  ] as const;
  for (const field of finiteFields) requireFinite(readback[field], `readback.${field}`);
  if (readback.maximumNormalizedEndpointDistance < 0) {
    throw new Error("readback.maximumNormalizedEndpointDistance must be nonnegative");
  }
  if (
    readback.streakWindowNormalizedEndpointDistance < 0
    || readback.maximumAllEdgeSignedMeanFlowMismatchFraction < 0
  ) {
    throw new Error("periodic distances and flow mismatch must be nonnegative");
  }
  for (const field of [
    "everyEdgeSignedMeanFlowForward",
    "committedIntervalTotalBloodVolumeConservationGatePass",
    "structuralAndNumericalIntervalLedgerGatesPass",
  ] as const) {
    if (typeof readback[field] !== "boolean") {
      throw new Error(`readback.${field} must be boolean`);
    }
  }
  if (
    readback.leftVentricularEndDiastolicVolumeMl
      < readback.leftVentricularEndSystolicVolumeMl
  ) {
    throw new Error("readback LV EDV must be greater than or equal to LV ESV");
  }
  if (
    readback.systemicArterialMinimumPressureMmHg
      > readback.systemicArterialMaximumPressureMmHg
  ) {
    throw new Error("readback systemic arterial pressure extrema are reversed");
  }
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

import {
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "@/engine/executionPlan/MainWireNumericalClockV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
  assertMainWireStandard66SelectedTraceLiveSessionV1,
  createMainWireStandard66SelectedTraceLiveSessionV1,
  readMainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTraceLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
  compareMainWireIntegratedModelAcceptedStatesV3,
  type MainWireIntegratedModelPeriodicAcceptedStateV3,
  type MainWireIntegratedModelPeriodicClosureReportV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
export const MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID =
  "main-wire-standard66-full-accepted-state-p1-settling-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID =
  "main-wire-standard66-full-accepted-state-p1-settling-protocol-identity-v1" as const;

const MAXIMUM_RETAINED_WINDOW_BOUNDARIES_V1 = 3 as const;
const MAXIMUM_RETAINED_P1_OBSERVATIONS_V1 = 3 as const;

export type MainWireStandard66P1SettlingExecutionPurposeV1 =
  "preregistered-settling" | "bounded-smoke";

export type MainWireStandard66P1SettlingRunnerInputV1 = Readonly<{
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  executionPurpose?: MainWireStandard66P1SettlingExecutionPurposeV1;
  /**
   * A short integration-only lane for tests and diagnostics. It can exercise
   * the same solver route and boundary logic but can never establish P1.
   */
  boundedSmokeHorizonSec?: number;
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale?: number;
}>;

export type MainWireStandard66P1SettlingLiveSessionInputV1 = Readonly<{
  liveSession: MainWireStandard66SelectedTraceLiveSessionV1;
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  executionPurpose?: MainWireStandard66P1SettlingExecutionPurposeV1;
  boundedSmokeHorizonSec?: number;
}>;

export type MainWireStandard66P1SettlingProtocolIdentityV1 = Readonly<{
  identityId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID;
  runnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
  liveSessionRouteIdentity: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
  executionPurpose: MainWireStandard66P1SettlingExecutionPurposeV1;
  clock: Readonly<{
    armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    requestedStepSec: number;
    requestedGridOriginSec: 0;
  }>;
  evaluationHorizonsSec: readonly number[];
  fullAcceptedStatePeriod1: Readonly<{
    comparatorId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID;
    policyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.policyId;
    referenceScales: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3;
    normalizedTolerance: number;
    consecutiveClosuresRequired: number;
    failedClosureResetsConsecutiveCount: true;
    comparisonBoundary: "exact-empty-coronary-autoregulation-window-at-n-times-cycle-length";
  }>;
  exactConstruction: MainWireStandard66SelectedTraceLiveSessionConstructionV1;
}>;

export type MainWireStandard66AnchoredAdvanceTargetV1 = Readonly<{
  targetTimeSec: number;
  requestedBoundaryOrdinal: number;
  landsOnRequestedGrid: boolean;
  landsOnCoronaryWindowBoundary: boolean;
  landsOnEvaluationHorizon: boolean;
}>;

export type MainWireStandard66P1SettlingWindowBoundaryV1 = Readonly<{
  windowIndex: number;
  acceptedTimeSec: number;
  acceptedRevision: number;
  acceptedState: MainWireIntegratedModelPeriodicAcceptedStateV3;
}>;

export type MainWireStandard66P1SettlingObservationV1 = Readonly<{
  windowIndex: number;
  acceptedTimeSec: number;
  acceptedRevision: number;
  period1: MainWireIntegratedModelPeriodicClosureReportV3;
  period1MaximumNormalizedDelta: number;
  withinPeriod1Tolerance: boolean;
  consecutivePeriod1Closures: number;
}>;

export type MainWireStandard66P1SettlingHorizonEvaluationV1 = Readonly<{
  horizonSec: number;
  latestWindowIndex: number;
  latestWindowBoundaryTimeSec: number;
  latestPeriod1MaximumNormalizedDelta: number | null;
  consecutivePeriod1Closures: number;
  diagnosticPeriod1SuffixSatisfied: boolean;
  preregisteredPeriod1EstablishedAtThisHorizon: boolean;
}>;

export type MainWireStandard66P1SettlingFailureV1 = Readonly<{
  kind: "advance-failed" | "boundary-validation-failed";
  message: string;
  requestedTargetTimeSec: number;
  acceptedTimeSec: number;
  acceptedRevision: number;
}>;

export type MainWireStandard66P1SettlingResultV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
  protocolIdentity: MainWireStandard66P1SettlingProtocolIdentityV1;
  protocolIdentityHash: string;
  executionPurpose: MainWireStandard66P1SettlingExecutionPurposeV1;
  status:
    | "period1-settled"
    | "maximum-horizon-reached"
    | "bounded-smoke-complete"
    | "failed";
  source: Readonly<{
    modelOwner: "Standard66-selected-typed-authority-session";
    coldStartForThisArm: true;
    sameCompiledExecutionPlanAsProduction: true;
    sameCoupledNewtonWorkspaceBindingAsProduction: true;
    exactModelMutation: false;
    exactFrameOutputReserved: false;
    registryOrModelSurfaceChanged: false;
  }>;
  clock: Readonly<{
    armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    requestedStepSec: number;
    productionPresentationStepSec: number;
    productionScheduleArm: boolean;
    anchoredRequestedGridOriginSec: number;
    requestedGridPhaseResetAtEvents: false;
    acceptedStepsMayBeShortenedAtModelEvents: true;
  }>;
  periodicBoundary: Readonly<{
    comparisonBoundary: "exact-empty-coronary-autoregulation-window-at-n-times-cycle-length";
    cycleLengthSec: number;
    coronaryWindowDurationSec: number;
    period1NormalizedTolerance: number;
    consecutiveClosuresRequired: number;
    failedClosureResetsConsecutiveCount: true;
    retainedWindowBoundaryLimit: 3;
    retainedObservationLimit: 3;
  }>;
  horizons: Readonly<{
    plannedSec: readonly number[];
    evaluated: readonly MainWireStandard66P1SettlingHorizonEvaluationV1[];
    settledAtHorizonSec: number | null;
  }>;
  counters: Readonly<{
    advanceCallCount: number;
    requestedGridLandingCount: number;
    internalAcceptedCommitCount: number;
    eventClippedAcceptedCommitCount: number;
    completedCoronaryWindowCount: number;
    completedPeriod1ComparisonCount: number;
  }>;
  retainedWindowBoundaries: readonly MainWireStandard66P1SettlingWindowBoundaryV1[];
  retainedPeriod1Observations: readonly MainWireStandard66P1SettlingObservationV1[];
  diagnosticConsecutivePeriod1Closures: number;
  numericalPeriod1Established: boolean;
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
  releaseAcceptanceEstablished: false;
  terminalAcceptedTimeSec: number;
  terminalAcceptedRevision: number;
  failure: MainWireStandard66P1SettlingFailureV1 | null;
}>;

/** Rebuilds rather than hand-copies the preregistered final-clamped sequence. */
export function buildMainWireStandard66SettlingEvaluationHorizonsV1(): readonly number[] {
  const protocol = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1;
  const horizons: number[] = [protocol.initialHorizonSec];
  while (horizons.at(-1)! < protocol.maximumHorizonSec) {
    const next = Math.min(
      horizons.at(-1)! + protocol.extensionSec,
      protocol.maximumHorizonSec,
    );
    if (!(next > horizons.at(-1)!)) {
      throw new Error("Standard66 settling horizon sequence did not advance");
    }
    horizons.push(next);
  }
  if (
    horizons.length !== protocol.evaluationHorizonsSec.length ||
    horizons.some(
      (horizonSec, index) =>
        horizonSec !== protocol.evaluationHorizonsSec[index],
    ) ||
    horizons.at(-1) !== protocol.maximumHorizonSec
  ) {
    throw new Error(
      "Standard66 settling horizons differ from the preregistered final-clamped sequence",
    );
  }
  return Object.freeze(horizons);
}

/**
 * Chooses the next target without moving the requested-grid origin. A model
 * event can insert an off-grid target, after which the same next grid ordinal
 * remains pending.
 */
export function resolveMainWireStandard66AnchoredAdvanceTargetV1(
  input: Readonly<{
    currentTimeSec: number;
    requestedGridOriginSec: number;
    requestedStepSec: number;
    nextRequestedBoundaryOrdinal: number;
    nextCoronaryWindowBoundaryTimeSec: number;
    nextEvaluationHorizonSec: number;
  }>,
): MainWireStandard66AnchoredAdvanceTargetV1 {
  requireFiniteV1(input.currentTimeSec, "current time");
  requireFiniteV1(input.requestedGridOriginSec, "requested-grid origin");
  requirePositiveFiniteV1(input.requestedStepSec, "requested step");
  requirePositiveIntegerV1(
    input.nextRequestedBoundaryOrdinal,
    "next requested boundary ordinal",
  );
  requireFiniteV1(
    input.nextCoronaryWindowBoundaryTimeSec,
    "next coronary-window boundary",
  );
  requireFiniteV1(input.nextEvaluationHorizonSec, "next evaluation horizon");
  const requestedGridTimeSec =
    input.requestedGridOriginSec +
    input.nextRequestedBoundaryOrdinal * input.requestedStepSec;
  const tolerance = timeToleranceV1(
    input.currentTimeSec,
    requestedGridTimeSec,
    input.nextCoronaryWindowBoundaryTimeSec,
    input.nextEvaluationHorizonSec,
  );
  for (const [label, value] of [
    ["requested-grid", requestedGridTimeSec],
    ["coronary-window", input.nextCoronaryWindowBoundaryTimeSec],
    ["evaluation-horizon", input.nextEvaluationHorizonSec],
  ] as const) {
    if (!(value > input.currentTimeSec + tolerance)) {
      throw new Error(`Standard66 settling ${label} target is not future`);
    }
  }
  const earliestTimeSec = Math.min(
    requestedGridTimeSec,
    input.nextCoronaryWindowBoundaryTimeSec,
    input.nextEvaluationHorizonSec,
  );
  const landsOnRequestedGrid = nearlyEqualTimeV1(
    earliestTimeSec,
    requestedGridTimeSec,
  );
  const landsOnCoronaryWindowBoundary = nearlyEqualTimeV1(
    earliestTimeSec,
    input.nextCoronaryWindowBoundaryTimeSec,
  );
  const landsOnEvaluationHorizon = nearlyEqualTimeV1(
    earliestTimeSec,
    input.nextEvaluationHorizonSec,
  );
  // When floating arithmetic makes two owners coincide within the declared
  // clock tolerance, retain the authoritative model-event clock. Advancing to
  // a nearly-equal grid clock on the earlier side would not yet own an empty
  // autoregulation window.
  const targetTimeSec = landsOnCoronaryWindowBoundary
    ? input.nextCoronaryWindowBoundaryTimeSec
    : landsOnEvaluationHorizon
      ? input.nextEvaluationHorizonSec
      : requestedGridTimeSec;
  return Object.freeze({
    targetTimeSec,
    requestedBoundaryOrdinal: input.nextRequestedBoundaryOrdinal,
    landsOnRequestedGrid,
    landsOnCoronaryWindowBoundary,
    landsOnEvaluationHorizon,
  });
}

export function nextMainWireStandard66ConsecutiveP1CountV1(
  priorCount: number,
  withinPeriod1Tolerance: boolean,
): number {
  if (!Number.isSafeInteger(priorCount) || priorCount < 0) {
    throw new Error("Standard66 consecutive P1 count is invalid");
  }
  if (typeof withinPeriod1Tolerance !== "boolean") {
    throw new Error("Standard66 P1 closure decision must be boolean");
  }
  return withinPeriod1Tolerance ? priorCount + 1 : 0;
}

/**
 * Cold-starts one clock arm and advances through the production compiled
 * transaction route. Full accepted-state P1 is evaluated only at exact empty
 * coronary-window boundaries; physical-time horizons only read that result.
 */
export async function runMainWireStandard66P1SettlingV1(
  input: MainWireStandard66P1SettlingRunnerInputV1,
): Promise<MainWireStandard66P1SettlingResultV1> {
  const owned = ownInputV1(input);
  const liveSession = await createMainWireStandard66SelectedTraceLiveSessionV1({
    hemodynamicResearchInputs: owned.hemodynamicResearchInputs,
    mechanismResearchInputs: owned.mechanismResearchInputs,
    ventricularContractilityScale: owned.ventricularContractilityScale,
  });
  return runOwnedMainWireStandard66P1SettlingV1(owned, liveSession);
}

/**
 * Advances a branded production-route handle in place. The caller retains the
 * handle so a terminal accepted-endpoint trace can continue the exact same
 * Session after settling without placing mutable runtime state in this report.
 */
export async function runMainWireStandard66P1SettlingOnLiveSessionV1(
  input: MainWireStandard66P1SettlingLiveSessionInputV1,
): Promise<MainWireStandard66P1SettlingResultV1> {
  assertMainWireStandard66SelectedTraceLiveSessionV1(input.liveSession);
  const construction =
    readMainWireStandard66SelectedTraceLiveSessionConstructionV1(
      input.liveSession,
    );
  const owned = ownInputV1({
    clockArmId: input.clockArmId,
    executionPurpose: input.executionPurpose,
    boundedSmokeHorizonSec: input.boundedSmokeHorizonSec,
    hemodynamicResearchInputs: construction.hemodynamicResearchInputs,
    mechanismResearchInputs: construction.mechanismResearchInputs,
    ventricularContractilityScale: construction.ventricularContractilityScale,
  });
  return runOwnedMainWireStandard66P1SettlingV1(owned, input.liveSession);
}

async function runOwnedMainWireStandard66P1SettlingV1(
  owned: ReturnType<typeof ownInputV1>,
  liveSession: MainWireStandard66SelectedTraceLiveSessionV1,
): Promise<MainWireStandard66P1SettlingResultV1> {
  assertMainWireStandard66SelectedTraceLiveSessionV1(liveSession);
  const exactConstruction =
    readMainWireStandard66SelectedTraceLiveSessionConstructionV1(liveSession);
  const protocolIdentity = buildProtocolIdentityV1(owned, exactConstruction);
  const protocolIdentityHash = await sha256CanonicalJsonHex(protocolIdentity);
  const session = liveSession.session;
  const initialState = session.currentAcceptedState();
  const initialBoundary = boundaryFromStateV1(initialState);
  if (
    initialState.acceptedTimeSec !== 0 ||
    initialState.revision !== 0 ||
    initialBoundary.windowIndex !== 0
  ) {
    throw new Error(
      "Standard66 settling live session must be an unadvanced cold window-zero state",
    );
  }
  const regular = initialState.composedRhythm.regularAtrialSourceState;
  if (regular === null) {
    throw new Error("Standard66 settling requires a regular atrial source");
  }
  const cycleLengthSec = regular.configuration.cycleLengthSec;
  const coronaryWindowDurationSec =
    initialState.coronary.coronaryAutoregulationBinding.windowPolicy
      .durationSec;
  if (!nearlyEqualTimeV1(cycleLengthSec, coronaryWindowDurationSec)) {
    throw new Error(
      "Standard66 settling coronary window does not equal the sinus cycle",
    );
  }

  const retainedWindowBoundaries: MainWireStandard66P1SettlingWindowBoundaryV1[] =
    [initialBoundary];
  const retainedPeriod1Observations: MainWireStandard66P1SettlingObservationV1[] =
    [];
  const horizonEvaluations: MainWireStandard66P1SettlingHorizonEvaluationV1[] =
    [];
  let currentAcceptedTimeSec = initialState.acceptedTimeSec;
  let currentAcceptedRevision = initialState.revision;
  let nextCoronaryWindowBoundaryTimeSec =
    initialState.coronary.coronaryAutoregulation.windowStartAcceptedTimeSec +
    coronaryWindowDurationSec;
  let nextRequestedBoundaryOrdinal = 1;
  let horizonIndex = 0;
  let consecutivePeriod1Closures = 0;
  let advanceCallCount = 0;
  let requestedGridLandingCount = 0;
  let internalAcceptedCommitCount = 0;
  let eventClippedAcceptedCommitCount = 0;
  let completedCoronaryWindowCount = 0;
  let completedPeriod1ComparisonCount = 0;
  let settledAtHorizonSec: number | null = null;
  let failure: MainWireStandard66P1SettlingFailureV1 | null = null;
  let terminalStatus: MainWireStandard66P1SettlingResultV1["status"] =
    owned.executionPurpose === "bounded-smoke"
      ? "bounded-smoke-complete"
      : "maximum-horizon-reached";

  while (horizonIndex < owned.evaluationHorizonsSec.length) {
    while (
      requestedGridTimeV1(
        initialState.acceptedTimeSec,
        nextRequestedBoundaryOrdinal,
        owned.requestedStepSec,
      ) <=
      currentAcceptedTimeSec + timeToleranceV1(currentAcceptedTimeSec)
    ) {
      nextRequestedBoundaryOrdinal += 1;
    }
    const target = resolveMainWireStandard66AnchoredAdvanceTargetV1({
      currentTimeSec: currentAcceptedTimeSec,
      requestedGridOriginSec: initialState.acceptedTimeSec,
      requestedStepSec: owned.requestedStepSec,
      nextRequestedBoundaryOrdinal,
      nextCoronaryWindowBoundaryTimeSec,
      nextEvaluationHorizonSec: owned.evaluationHorizonsSec[horizonIndex]!,
    });
    const projected =
      session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        target.targetTimeSec,
        Object.freeze([]),
      );
    const advanced = projected.advance;
    advanceCallCount += 1;
    if (advanced.status !== "advanced") {
      failure = Object.freeze({
        kind: "advance-failed" as const,
        message:
          advanced.status === "failed"
            ? `${advanced.reason}: ${advanced.message}`
            : `unexpected ${advanced.status} result`,
        requestedTargetTimeSec: target.targetTimeSec,
        acceptedTimeSec: advanced.acceptedTimeSec,
        acceptedRevision: advanced.acceptedRevision,
      });
      terminalStatus = "failed";
      break;
    }
    internalAcceptedCommitCount += advanced.internalAcceptedSubstepCount;
    eventClippedAcceptedCommitCount += advanced.boundaryClippedSubstepCount;
    currentAcceptedTimeSec = advanced.acceptedTimeSec;
    currentAcceptedRevision = advanced.acceptedRevision;
    if (target.landsOnRequestedGrid) {
      requestedGridLandingCount += 1;
      nextRequestedBoundaryOrdinal += 1;
    }
    if (!nearlyEqualTimeV1(currentAcceptedTimeSec, target.targetTimeSec)) {
      failure = Object.freeze({
        kind: "boundary-validation-failed" as const,
        message: "accepted clock did not land on the selected target",
        requestedTargetTimeSec: target.targetTimeSec,
        acceptedTimeSec: currentAcceptedTimeSec,
        acceptedRevision: currentAcceptedRevision,
      });
      terminalStatus = "failed";
      break;
    }

    if (target.landsOnCoronaryWindowBoundary) {
      const boundaryState = session.currentAcceptedState();
      try {
        const boundary = boundaryFromStateV1(boundaryState);
        const previousBoundary = retainedWindowBoundaries.at(-1)!;
        if (boundary.windowIndex !== previousBoundary.windowIndex + 1) {
          throw new Error(
            "Standard66 settling window index did not advance by one",
          );
        }
        const period1 = compareMainWireIntegratedModelAcceptedStatesV3(
          boundary.acceptedState,
          previousBoundary.acceptedState,
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        );
        const withinPeriod1Tolerance =
          period1.overall.maximumNormalizedDelta <=
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance;
        consecutivePeriod1Closures = nextMainWireStandard66ConsecutiveP1CountV1(
          consecutivePeriod1Closures,
          withinPeriod1Tolerance,
        );
        const observation = Object.freeze({
          windowIndex: boundary.windowIndex,
          acceptedTimeSec: boundary.acceptedTimeSec,
          acceptedRevision: boundary.acceptedRevision,
          period1,
          period1MaximumNormalizedDelta: period1.overall.maximumNormalizedDelta,
          withinPeriod1Tolerance,
          consecutivePeriod1Closures,
        });
        pushBoundedV1(
          retainedWindowBoundaries,
          boundary,
          MAXIMUM_RETAINED_WINDOW_BOUNDARIES_V1,
        );
        pushBoundedV1(
          retainedPeriod1Observations,
          observation,
          MAXIMUM_RETAINED_P1_OBSERVATIONS_V1,
        );
        completedCoronaryWindowCount += 1;
        completedPeriod1ComparisonCount += 1;
        nextCoronaryWindowBoundaryTimeSec =
          boundaryState.coronary.coronaryAutoregulation
            .windowStartAcceptedTimeSec + coronaryWindowDurationSec;
      } catch (error) {
        failure = boundaryFailureV1(
          error instanceof Error ? error.message : String(error),
          target.targetTimeSec,
          boundaryState,
        );
        terminalStatus = "failed";
        break;
      }
    }

    if (target.landsOnEvaluationHorizon) {
      const latestBoundary = retainedWindowBoundaries.at(-1)!;
      const latestObservation = retainedPeriod1Observations.at(-1) ?? null;
      const diagnosticPeriod1SuffixSatisfied =
        consecutivePeriod1Closures >=
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.consecutiveP1ClosuresRequired;
      const preregisteredPeriod1EstablishedAtThisHorizon =
        owned.executionPurpose === "preregistered-settling" &&
        diagnosticPeriod1SuffixSatisfied;
      horizonEvaluations.push(
        Object.freeze({
          horizonSec: owned.evaluationHorizonsSec[horizonIndex]!,
          latestWindowIndex: latestBoundary.windowIndex,
          latestWindowBoundaryTimeSec: latestBoundary.acceptedTimeSec,
          latestPeriod1MaximumNormalizedDelta:
            latestObservation?.period1MaximumNormalizedDelta ?? null,
          consecutivePeriod1Closures,
          diagnosticPeriod1SuffixSatisfied,
          preregisteredPeriod1EstablishedAtThisHorizon,
        }),
      );
      if (preregisteredPeriod1EstablishedAtThisHorizon) {
        settledAtHorizonSec = owned.evaluationHorizonsSec[horizonIndex]!;
        terminalStatus = "period1-settled";
        break;
      }
      horizonIndex += 1;
    }
  }

  const terminal = session.currentAcceptedState();
  const numericalPeriod1Established =
    terminalStatus === "period1-settled" &&
    failure === null &&
    owned.executionPurpose === "preregistered-settling";
  return Object.freeze({
    runnerId: MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
    protocolIdentity,
    protocolIdentityHash,
    executionPurpose: owned.executionPurpose,
    status: terminalStatus,
    source: Object.freeze({
      modelOwner: "Standard66-selected-typed-authority-session" as const,
      coldStartForThisArm: true as const,
      sameCompiledExecutionPlanAsProduction: true as const,
      sameCoupledNewtonWorkspaceBindingAsProduction: true as const,
      exactModelMutation: false as const,
      exactFrameOutputReserved: false as const,
      registryOrModelSurfaceChanged: false as const,
    }),
    clock: Object.freeze({
      armId: owned.clockArmId,
      requestedStepSec: owned.requestedStepSec,
      productionPresentationStepSec:
        MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 *
        MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
      productionScheduleArm:
        owned.requestedStepSec ===
        MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 *
          MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
      anchoredRequestedGridOriginSec: initialState.acceptedTimeSec,
      requestedGridPhaseResetAtEvents: false as const,
      acceptedStepsMayBeShortenedAtModelEvents: true as const,
    }),
    periodicBoundary: Object.freeze({
      comparisonBoundary:
        "exact-empty-coronary-autoregulation-window-at-n-times-cycle-length" as const,
      cycleLengthSec,
      coronaryWindowDurationSec,
      period1NormalizedTolerance:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
      consecutiveClosuresRequired:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.consecutiveP1ClosuresRequired,
      failedClosureResetsConsecutiveCount: true as const,
      retainedWindowBoundaryLimit: 3 as const,
      retainedObservationLimit: 3 as const,
    }),
    horizons: Object.freeze({
      plannedSec: owned.evaluationHorizonsSec,
      evaluated: Object.freeze([...horizonEvaluations]),
      settledAtHorizonSec,
    }),
    counters: Object.freeze({
      advanceCallCount,
      requestedGridLandingCount,
      internalAcceptedCommitCount,
      eventClippedAcceptedCommitCount,
      completedCoronaryWindowCount,
      completedPeriod1ComparisonCount,
    }),
    retainedWindowBoundaries: Object.freeze([...retainedWindowBoundaries]),
    retainedPeriod1Observations: Object.freeze([
      ...retainedPeriod1Observations,
    ]),
    diagnosticConsecutivePeriod1Closures: consecutivePeriod1Closures,
    numericalPeriod1Established,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    terminalAcceptedTimeSec: terminal.acceptedTimeSec,
    terminalAcceptedRevision: terminal.revision,
    failure,
  });
}

function buildProtocolIdentityV1(
  owned: ReturnType<typeof ownInputV1>,
  exactConstruction: MainWireStandard66SelectedTraceLiveSessionConstructionV1,
): MainWireStandard66P1SettlingProtocolIdentityV1 {
  return Object.freeze({
    identityId: MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID,
    runnerId: MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
    liveSessionRouteIdentity:
      MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
    executionPurpose: owned.executionPurpose,
    clock: Object.freeze({
      armId: owned.clockArmId,
      requestedStepSec: owned.requestedStepSec,
      requestedGridOriginSec: 0 as const,
    }),
    evaluationHorizonsSec: Object.freeze([...owned.evaluationHorizonsSec]),
    fullAcceptedStatePeriod1: Object.freeze({
      comparatorId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
      policyId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.policyId,
      referenceScales: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      normalizedTolerance:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
      consecutiveClosuresRequired:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.consecutiveP1ClosuresRequired,
      failedClosureResetsConsecutiveCount: true as const,
      comparisonBoundary:
        "exact-empty-coronary-autoregulation-window-at-n-times-cycle-length" as const,
    }),
    exactConstruction,
  });
}

function ownInputV1(input: MainWireStandard66P1SettlingRunnerInputV1) {
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      (candidate) => candidate.armId === input.clockArmId,
    );
  if (arm === undefined) {
    throw new Error("Standard66 settling clock arm is unsupported");
  }
  const executionPurpose = input.executionPurpose ?? "preregistered-settling";
  if (
    executionPurpose !== "preregistered-settling" &&
    executionPurpose !== "bounded-smoke"
  ) {
    throw new Error("Standard66 settling execution purpose is unsupported");
  }
  let evaluationHorizonsSec: readonly number[];
  if (executionPurpose === "preregistered-settling") {
    if (input.boundedSmokeHorizonSec !== undefined) {
      throw new Error(
        "Standard66 preregistered settling cannot override its horizons",
      );
    }
    evaluationHorizonsSec =
      buildMainWireStandard66SettlingEvaluationHorizonsV1();
  } else {
    const horizonSec = input.boundedSmokeHorizonSec;
    if (
      horizonSec === undefined ||
      !Number.isFinite(horizonSec) ||
      horizonSec <= 0 ||
      horizonSec >
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.initialHorizonSec
    ) {
      throw new Error("Standard66 bounded-smoke horizon is invalid");
    }
    evaluationHorizonsSec = Object.freeze([horizonSec]);
  }
  const ventricularContractilityScale =
    input.ventricularContractilityScale ?? 1;
  requirePositiveFiniteV1(
    ventricularContractilityScale,
    "ventricular contractility scale",
  );
  return Object.freeze({
    clockArmId: arm.armId,
    requestedStepSec: arm.requestedStepSec,
    executionPurpose,
    evaluationHorizonsSec,
    hemodynamicResearchInputs:
      input.hemodynamicResearchInputs ??
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    mechanismResearchInputs:
      input.mechanismResearchInputs ??
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    ventricularContractilityScale,
  });
}

function boundaryFromStateV1(
  acceptedState: MainWireIntegratedModelPeriodicAcceptedStateV3,
): MainWireStandard66P1SettlingWindowBoundaryV1 {
  const window = acceptedState.coronary.coronaryAutoregulation;
  if (
    window.windowStartRevision !== acceptedState.revision ||
    !nearlyEqualTimeV1(
      window.windowStartAcceptedTimeSec,
      acceptedState.acceptedTimeSec,
    ) ||
    window.acceptedDurationSec !== 0 ||
    window.acceptedStepCount !== 0 ||
    window.windowControl !== null ||
    Object.values(window.qmTimeIntegralMlByTerritoryLayer).some((layers) =>
      Object.values(layers).some((value) => value !== 0),
    ) ||
    Object.values(window.perfusionPressureTimeIntegralMmHgSecByTerritory).some(
      (value) => value !== 0,
    )
  ) {
    throw new Error(
      "Standard66 P1 comparison state is not an exact empty coronary-window boundary",
    );
  }
  return Object.freeze({
    windowIndex: window.windowIndex,
    acceptedTimeSec: acceptedState.acceptedTimeSec,
    acceptedRevision: acceptedState.revision,
    acceptedState,
  });
}

function boundaryFailureV1(
  message: string,
  requestedTargetTimeSec: number,
  state: MainWireIntegratedModelPeriodicAcceptedStateV3,
): MainWireStandard66P1SettlingFailureV1 {
  return Object.freeze({
    kind: "boundary-validation-failed" as const,
    message,
    requestedTargetTimeSec,
    acceptedTimeSec: state.acceptedTimeSec,
    acceptedRevision: state.revision,
  });
}

function pushBoundedV1<T>(values: T[], value: T, maximumLength: number): void {
  values.push(value);
  if (values.length > maximumLength) values.shift();
}

function requestedGridTimeV1(
  originSec: number,
  ordinal: number,
  stepSec: number,
): number {
  return originSec + ordinal * stepSec;
}

function nearlyEqualTimeV1(first: number, second: number): boolean {
  return Math.abs(first - second) <= timeToleranceV1(first, second);
}

function timeToleranceV1(...values: readonly number[]): number {
  return (
    64 * Number.EPSILON * Math.max(1, ...values.map((value) => Math.abs(value)))
  );
}

function requireFiniteV1(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Standard66 settling ${label} must be finite`);
  }
}

function requirePositiveFiniteV1(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Standard66 settling ${label} must be positive and finite`);
  }
}

function requirePositiveIntegerV1(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Standard66 settling ${label} must be a positive integer`);
  }
}

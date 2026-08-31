import {
  MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID,
  assertMainWireStandard66ResearchContinuationLiveSessionV1,
  readMainWireStandard66ResearchContinuationConstructionV1,
  type MainWireStandard66ResearchContinuationConstructionV1,
  type MainWireStandard66ResearchContinuationLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  resolveMainWireStandard66AnchoredAdvanceTargetV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  canonicalCoronaryAutoregulationWindowEndTimeV3,
  canonicalCoronaryAutoregulationWindowStartTimeV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  sha256BytesHex,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  compareMainWireIntegratedModelAcceptedStatesForPhaseLagDiagnosticV1,
  type MainWireIntegratedModelPeriodicAcceptedStateV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import type {
  MainWireIntegratedModelStandard66OutputIdV1,
  MainWireIntegratedModelStandard66OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID =
  "main-wire-standard66-research-continuation-phase-screen-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_CLAIM_V1 =
  Object.freeze({
    purpose: "research-continuation-speed-and-attractor-screen" as const,
    warmStart: true as const,
    fullAcceptedStateCompared: true as const,
    comparisonLagPolicy:
      "smallest-zero-grid-phase-matched-cycle-lag-within-one-to-three" as const,
    phaseMatchedComparisonsRequired: true as const,
    candidateConsecutiveComparisonsRequired: 3 as const,
    freshConfirmationConsecutiveComparisonsRequired: 3 as const,
    exactModelMutation: false as const,
    acceptedStatesPersisted: false as const,
    compactTerminalCompletedBeatProjectionRecorded: true as const,
    formalValidationOutcomeProduced: false as const,
    formalPeriodicClassifierEligible: false as const,
    numericalPeriodicityEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });

const MAXIMUM_CONTINUATION_DURATION_SEC_V1 = 250 as const;
const DEFAULT_MAXIMUM_CONTINUATION_DURATION_SEC_V1 =
  MAXIMUM_CONTINUATION_DURATION_SEC_V1;
const REQUIRED_CONSECUTIVE_PHASE_MATCHED_COMPARISONS_V1 = 3 as const;

const TERMINAL_COMPLETED_BEAT_OUTPUT_IDS_V1 = Object.freeze([
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.mean.SA",
  "hemodynamics.stroke-volume.LV-extrema",
  "hemodynamics.stroke-volume.LV-event-defined",
  "hemodynamics.valve-volume.forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.duration.valve-forward-flow.AoV",
] as const satisfies readonly MainWireIntegratedModelStandard66OutputIdV1[]);

type ExactBoundaryV1 = Readonly<{
  windowIndex: number;
  acceptedTimeSec: number;
  acceptedRevision: number;
  acceptedState: MainWireIntegratedModelPeriodicAcceptedStateV3;
}>;

export type MainWireStandard66ResearchContinuationPhaseScreenObservationV1 =
  Readonly<{
    stage: "candidate-screen" | "fresh-confirmation";
    expectedLagCycles: 1 | 2 | 3;
    currentWindowIndex: number;
    referenceWindowIndex: number;
    acceptedTimeSec: number;
    acceptedRevision: number;
    elapsedContinuationSec: number;
    anchoredGridPhase: Readonly<{
      currentPhaseSec: number;
      referencePhaseSec: number;
      circularAbsoluteDifferenceSec: number;
      phaseMatched: boolean;
    }>;
    maximumNormalizedDelta: number;
    worstGroup: string;
    worstPath: string;
    withinTolerance: boolean;
    consecutiveWithinTolerance: number;
  }>;

export type MainWireStandard66ResearchContinuationPhaseScreenResultV1 =
  Readonly<{
    runnerId:
      typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID;
    runIdentity: Readonly<{
      runnerId:
        typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID;
      liveSessionRouteIdentity:
        typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID;
      construction:
        MainWireStandard66ResearchContinuationConstructionV1;
      clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
      requestedStepSec: number;
      requestedGridOriginSec: 0;
      maximumContinuationDurationSec: number;
    }>;
    runIdentityHash: string;
    status: "phase-screen-confirmed" | "maximum-duration-reached" | "failed";
    source: Readonly<{
      modelOwner: "Standard66-selected-typed-authority-session";
      coldStartForThisArm: false;
      warmResearchContinuation: true;
      sameCompiledExecutionPlanAsProduction: true;
      sameCoupledNewtonWorkspaceBindingAsProduction: true;
      exactModelMutation: false;
      formalValidationEligible: false;
    }>;
    clock: Readonly<{
      armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
      requestedStepSec: number;
      anchoredRequestedGridOriginSec: number;
      acceptedStepsMayBeShortenedAtModelEvents: true;
    }>;
    periodicBoundary: Readonly<{
      cycleLengthSec: number;
      coronaryWindowDurationSec: number;
      expectedLagCycles: 1 | 2 | 3;
      normalizedTolerance: number;
      candidateConsecutiveComparisonsRequired: 3;
      freshConfirmationConsecutiveComparisonsRequired: 3;
    }>;
    transition: Readonly<{
      acceptedTimeSec: number;
      acceptedRevision: number;
      initialWindowIndex: number;
      zeroAnchoredRequestedGridPhaseSec: number;
    }>;
    candidate: Readonly<{
      acceptedTimeSec: number;
      acceptedRevision: number;
      windowIndex: number;
      elapsedContinuationSec: number;
    }> | null;
    freshConfirmation: Readonly<{
      acceptedTimeSec: number;
      acceptedRevision: number;
      windowIndex: number;
      elapsedContinuationSec: number;
    }> | null;
    counters: Readonly<{
      advanceCallCount: number;
      requestedGridLandingCount: number;
      internalAcceptedCommitCount: number;
      eventClippedAcceptedCommitCount: number;
      completedCoronaryWindowCount: number;
      phaseMatchedComparisonCount: number;
    }>;
    observations:
      readonly MainWireStandard66ResearchContinuationPhaseScreenObservationV1[];
    terminalCompletedBeatProjection: Readonly<
      Record<string, MainWireIntegratedModelStandard66OutputValueV1>
    >;
    terminalAcceptedTimeSec: number;
    terminalAcceptedRevision: number;
    formalProtocolEligibility: false;
    numericalPeriodicityEstablished: false;
    failure: Readonly<{
      message: string;
      requestedTargetTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
    }> | null;
    claim:
      typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_CLAIM_V1;
  }>;

export async function runMainWireStandard66ResearchContinuationPhaseScreenV1(
  input: Readonly<{
    liveSession: MainWireStandard66ResearchContinuationLiveSessionV1;
    clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    maximumContinuationDurationSec?: number;
  }>,
): Promise<MainWireStandard66ResearchContinuationPhaseScreenResultV1> {
  assertMainWireStandard66ResearchContinuationLiveSessionV1(
    input.liveSession,
  );
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      (candidate) => candidate.armId === input.clockArmId,
    );
  if (arm === undefined) {
    throw new Error("Standard66 continuation phase-screen clock arm is invalid");
  }
  const maximumContinuationDurationSec =
    input.maximumContinuationDurationSec
      ?? DEFAULT_MAXIMUM_CONTINUATION_DURATION_SEC_V1;
  if (
    !Number.isFinite(maximumContinuationDurationSec)
    || maximumContinuationDurationSec <= 0
    || maximumContinuationDurationSec > MAXIMUM_CONTINUATION_DURATION_SEC_V1
  ) {
    throw new Error(
      "Standard66 continuation phase-screen duration is invalid",
    );
  }
  const construction =
    readMainWireStandard66ResearchContinuationConstructionV1(
      input.liveSession,
    );
  const session = input.liveSession.session;
  const initialState = session.currentAcceptedState();
  if (
    initialState.acceptedTimeSec
      !== construction.targetEpoch.acceptedTimeSec
    || initialState.revision !== construction.targetEpoch.acceptedRevision
    || initialState.coronary.coronaryAutoregulation.windowIndex
      !== construction.targetEpoch.initialWindowIndex
  ) {
    throw new Error(
      "Standard66 continuation phase-screen did not start at its fresh target epoch",
    );
  }
  const predictor = session.coupledPredictorReport();
  if (predictor.hasAcceptedPair || predictor.historyDepth !== 0) {
    throw new Error(
      "Standard66 continuation phase-screen target predictor is not fresh",
    );
  }
  const runIdentity = Object.freeze({
    runnerId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID,
    liveSessionRouteIdentity:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID,
    construction,
    clockArmId: arm.armId,
    requestedStepSec: arm.requestedStepSec,
    requestedGridOriginSec: 0 as const,
    maximumContinuationDurationSec,
  });
  const [runIdentityHash, initialStateIdentitySha256] = await Promise.all([
    sha256CanonicalJsonHex(runIdentity),
    sha256BytesHex(session.snapshotAcceptedStateBytes()),
  ]);
  if (
    initialStateIdentitySha256
      !== construction.targetEpoch.acceptedStateIdentitySha256
  ) {
    throw new Error(
      "Standard66 continuation phase-screen target state identity differs from construction",
    );
  }
  const initialAfterIdentity = session.currentAcceptedState();
  if (
    initialAfterIdentity.acceptedTimeSec !== initialState.acceptedTimeSec
    || initialAfterIdentity.revision !== initialState.revision
  ) {
    throw new Error(
      "Standard66 continuation phase-screen target advanced during identity capture",
    );
  }
  const initialBoundary = exactBoundaryFromStateV1(initialState);
  const regular = initialState.composedRhythm.regularAtrialSourceState;
  if (regular === null) {
    throw new Error("Standard66 continuation phase-screen requires sinus rhythm");
  }
  const cycleLengthSec = regular.configuration.cycleLengthSec;
  const coronaryWindowDurationSec = initialState.coronary
    .coronaryAutoregulationBinding.windowPolicy.durationSec;
  if (cycleLengthSec !== coronaryWindowDurationSec) {
    throw new Error(
      "Standard66 continuation phase-screen periodic durations differ",
    );
  }
  const expectedLagCycles = smallestPhaseMatchedLagV1(
    cycleLengthSec,
    arm.requestedStepSec,
  );
  const transitionTimeSec = initialState.acceptedTimeSec;
  const deadlineSec = transitionTimeSec + maximumContinuationDurationSec;
  if (!Number.isFinite(deadlineSec)) {
    throw new Error("Standard66 continuation phase-screen deadline is invalid");
  }

  let currentAcceptedTimeSec = transitionTimeSec;
  let currentAcceptedRevision = initialState.revision;
  let nextRequestedBoundaryOrdinal = Math.max(
    1,
    Math.floor(transitionTimeSec / arm.requestedStepSec) + 1,
  );
  while (
    nextRequestedBoundaryOrdinal * arm.requestedStepSec <=
    transitionTimeSec + timeToleranceV1(
      transitionTimeSec,
      arm.requestedStepSec,
    )
  ) {
    nextRequestedBoundaryOrdinal += 1;
  }
  let nextCoronaryWindowBoundaryTimeSec =
    canonicalCoronaryAutoregulationWindowEndTimeV3(
      initialState.coronary.coronaryAutoregulationBinding,
      initialState.coronary.coronaryAutoregulation.windowIndex,
    );
  let retainedBoundaries: ExactBoundaryV1[] = [initialBoundary];
  let stage: "candidate-screen" | "fresh-confirmation" =
    "candidate-screen";
  let consecutiveWithinTolerance = 0;
  let candidate:
    MainWireStandard66ResearchContinuationPhaseScreenResultV1["candidate"] =
    null;
  let freshConfirmation:
    MainWireStandard66ResearchContinuationPhaseScreenResultV1[
      "freshConfirmation"
    ] = null;
  const observations:
    MainWireStandard66ResearchContinuationPhaseScreenObservationV1[] = [];
  let status:
    MainWireStandard66ResearchContinuationPhaseScreenResultV1["status"] =
    "maximum-duration-reached";
  let failure:
    MainWireStandard66ResearchContinuationPhaseScreenResultV1["failure"] =
    null;
  let advanceCallCount = 0;
  let requestedGridLandingCount = 0;
  let internalAcceptedCommitCount = 0;
  let eventClippedAcceptedCommitCount = 0;
  let completedCoronaryWindowCount = 0;
  let phaseMatchedComparisonCount = 0;

  while (
    currentAcceptedTimeSec <
    deadlineSec - timeToleranceV1(currentAcceptedTimeSec, deadlineSec)
  ) {
    const target = resolveMainWireStandard66AnchoredAdvanceTargetV1({
      currentTimeSec: currentAcceptedTimeSec,
      requestedGridOriginSec: 0,
      requestedStepSec: arm.requestedStepSec,
      nextRequestedBoundaryOrdinal,
      nextCoronaryWindowBoundaryTimeSec,
      nextEvaluationHorizonSec: deadlineSec,
    });
    const projected = session
      .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        target.targetTimeSec,
        Object.freeze([]),
      );
    const advanced = projected.advance;
    advanceCallCount += 1;
    if (advanced.status !== "advanced") {
      failure = Object.freeze({
        message: advanced.status === "failed"
          ? `${advanced.reason}: ${advanced.message}`
          : `unexpected ${advanced.status} result`,
        requestedTargetTimeSec: target.targetTimeSec,
        acceptedTimeSec: advanced.acceptedTimeSec,
        acceptedRevision: advanced.acceptedRevision,
      });
      status = "failed";
      break;
    }
    currentAcceptedTimeSec = advanced.acceptedTimeSec;
    currentAcceptedRevision = advanced.acceptedRevision;
    internalAcceptedCommitCount += advanced.internalAcceptedSubstepCount;
    eventClippedAcceptedCommitCount += advanced.boundaryClippedSubstepCount;
    if (target.landsOnRequestedGrid) {
      requestedGridLandingCount += 1;
      nextRequestedBoundaryOrdinal += 1;
    }
    if (
      Math.abs(currentAcceptedTimeSec - target.targetTimeSec) >
      timeToleranceV1(currentAcceptedTimeSec, target.targetTimeSec)
    ) {
      failure = Object.freeze({
        message: "accepted clock did not land on the continuation target",
        requestedTargetTimeSec: target.targetTimeSec,
        acceptedTimeSec: currentAcceptedTimeSec,
        acceptedRevision: currentAcceptedRevision,
      });
      status = "failed";
      break;
    }

    if (target.landsOnCoronaryWindowBoundary) {
      try {
        const boundaryState = session.currentAcceptedState();
        const boundary = exactBoundaryFromStateV1(boundaryState);
        const previous = retainedBoundaries.at(-1)!;
        if (boundary.windowIndex !== previous.windowIndex + 1) {
          throw new Error(
            "continuation coronary window index did not advance by one",
          );
        }
        retainedBoundaries.push(boundary);
        if (retainedBoundaries.length > expectedLagCycles + 1) {
          retainedBoundaries.shift();
        }
        completedCoronaryWindowCount += 1;
        nextCoronaryWindowBoundaryTimeSec =
          canonicalCoronaryAutoregulationWindowEndTimeV3(
            boundaryState.coronary.coronaryAutoregulationBinding,
            boundaryState.coronary.coronaryAutoregulation.windowIndex,
          );

        if (retainedBoundaries.length === expectedLagCycles + 1) {
          const reference = retainedBoundaries[0]!;
          const current = retainedBoundaries[expectedLagCycles]!;
          const report =
            compareMainWireIntegratedModelAcceptedStatesForPhaseLagDiagnosticV1(
              current.acceptedState,
              reference.acceptedState,
              expectedLagCycles,
            );
          const currentPhase = anchoredGridPhaseSecV1(
            current.acceptedTimeSec,
            0,
            arm.requestedStepSec,
          );
          const referencePhase = anchoredGridPhaseSecV1(
            reference.acceptedTimeSec,
            0,
            arm.requestedStepSec,
          );
          const rawPhaseDifferenceSec = Math.abs(
            currentPhase - referencePhase,
          );
          const circularAbsoluteDifferenceSec = Math.min(
            rawPhaseDifferenceSec,
            arm.requestedStepSec - rawPhaseDifferenceSec,
          );
          const phaseMatched = circularAbsoluteDifferenceSec <=
            timeToleranceV1(
              current.acceptedTimeSec,
              reference.acceptedTimeSec,
              arm.requestedStepSec,
            );
          const withinTolerance = phaseMatched &&
            report.overall.maximumNormalizedDelta <=
              MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
                .period1NormalizedTolerance;
          consecutiveWithinTolerance = withinTolerance
            ? consecutiveWithinTolerance + 1
            : 0;
          if (phaseMatched) phaseMatchedComparisonCount += 1;
          observations.push(Object.freeze({
            stage,
            expectedLagCycles,
            currentWindowIndex: current.windowIndex,
            referenceWindowIndex: reference.windowIndex,
            acceptedTimeSec: current.acceptedTimeSec,
            acceptedRevision: current.acceptedRevision,
            elapsedContinuationSec:
              current.acceptedTimeSec - transitionTimeSec,
            anchoredGridPhase: Object.freeze({
              currentPhaseSec: currentPhase,
              referencePhaseSec: referencePhase,
              circularAbsoluteDifferenceSec,
              phaseMatched,
            }),
            maximumNormalizedDelta: report.overall.maximumNormalizedDelta,
            worstGroup: report.overall.worstGroup,
            worstPath: report.overall.worstPath,
            withinTolerance,
            consecutiveWithinTolerance,
          }));
          if (
            consecutiveWithinTolerance >=
            REQUIRED_CONSECUTIVE_PHASE_MATCHED_COMPARISONS_V1
          ) {
            if (stage === "candidate-screen") {
              candidate = Object.freeze({
                acceptedTimeSec: current.acceptedTimeSec,
                acceptedRevision: current.acceptedRevision,
                windowIndex: current.windowIndex,
                elapsedContinuationSec:
                  current.acceptedTimeSec - transitionTimeSec,
              });
              stage = "fresh-confirmation";
              consecutiveWithinTolerance = 0;
              retainedBoundaries = [current];
            } else {
              freshConfirmation = Object.freeze({
                acceptedTimeSec: current.acceptedTimeSec,
                acceptedRevision: current.acceptedRevision,
                windowIndex: current.windowIndex,
                elapsedContinuationSec:
                  current.acceptedTimeSec - transitionTimeSec,
              });
              status = "phase-screen-confirmed";
              break;
            }
          }
        }
      } catch (error) {
        failure = Object.freeze({
          message: error instanceof Error ? error.message : String(error),
          requestedTargetTimeSec: target.targetTimeSec,
          acceptedTimeSec: currentAcceptedTimeSec,
          acceptedRevision: currentAcceptedRevision,
        });
        status = "failed";
        break;
      }
    }
    if (target.landsOnEvaluationHorizon) break;
  }

  const terminal = session.currentAcceptedState();
  const terminalCompletedBeatProjection =
    session.projectCurrentAcceptedStandard66ValuesV1(
      TERMINAL_COMPLETED_BEAT_OUTPUT_IDS_V1,
    );
  return Object.freeze({
    runnerId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID,
    runIdentity,
    runIdentityHash,
    status,
    source: Object.freeze({
      modelOwner: "Standard66-selected-typed-authority-session" as const,
      coldStartForThisArm: false as const,
      warmResearchContinuation: true as const,
      sameCompiledExecutionPlanAsProduction: true as const,
      sameCoupledNewtonWorkspaceBindingAsProduction: true as const,
      exactModelMutation: false as const,
      formalValidationEligible: false as const,
    }),
    clock: Object.freeze({
      armId: arm.armId,
      requestedStepSec: arm.requestedStepSec,
      anchoredRequestedGridOriginSec: 0 as const,
      acceptedStepsMayBeShortenedAtModelEvents: true as const,
    }),
    periodicBoundary: Object.freeze({
      cycleLengthSec,
      coronaryWindowDurationSec,
      expectedLagCycles,
      normalizedTolerance:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
          .period1NormalizedTolerance,
      candidateConsecutiveComparisonsRequired:
        REQUIRED_CONSECUTIVE_PHASE_MATCHED_COMPARISONS_V1,
      freshConfirmationConsecutiveComparisonsRequired:
        REQUIRED_CONSECUTIVE_PHASE_MATCHED_COMPARISONS_V1,
    }),
    transition: Object.freeze({
      acceptedTimeSec: transitionTimeSec,
      acceptedRevision: initialState.revision,
      initialWindowIndex: initialBoundary.windowIndex,
      zeroAnchoredRequestedGridPhaseSec: anchoredGridPhaseSecV1(
        transitionTimeSec,
        0,
        arm.requestedStepSec,
      ),
    }),
    candidate,
    freshConfirmation,
    counters: Object.freeze({
      advanceCallCount,
      requestedGridLandingCount,
      internalAcceptedCommitCount,
      eventClippedAcceptedCommitCount,
      completedCoronaryWindowCount,
      phaseMatchedComparisonCount,
    }),
    observations: Object.freeze([...observations]),
    terminalCompletedBeatProjection,
    terminalAcceptedTimeSec: terminal.acceptedTimeSec,
    terminalAcceptedRevision: terminal.revision,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    failure,
    claim:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_CLAIM_V1,
  });
}

function exactBoundaryFromStateV1(
  acceptedState: MainWireIntegratedModelPeriodicAcceptedStateV3,
): ExactBoundaryV1 {
  const window = acceptedState.coronary.coronaryAutoregulation;
  const binding = acceptedState.coronary.coronaryAutoregulationBinding;
  const canonicalStart = canonicalCoronaryAutoregulationWindowStartTimeV3(
    binding,
    window.windowIndex,
  );
  if (
    window.windowStartRevision !== acceptedState.revision
    || window.windowOriginAcceptedTimeSec
      !== binding.windowPolicy.originAcceptedTimeSec
    || window.windowStartAcceptedTimeSec !== canonicalStart
    || acceptedState.acceptedTimeSec !== canonicalStart
    || window.acceptedDurationSec !== 0
    || window.acceptedStepCount !== 0
    || window.windowControl !== null
    || Object.values(window.qmTimeIntegralMlByTerritoryLayer).some((layers) =>
      Object.values(layers).some((entry) => entry !== 0),
    )
    || Object.values(
      window.perfusionPressureTimeIntegralMmHgSecByTerritory,
    ).some((entry) => entry !== 0)
  ) {
    throw new Error(
      "Standard66 continuation comparison state is not an exact empty coronary-window boundary",
    );
  }
  return Object.freeze({
    windowIndex: window.windowIndex,
    acceptedTimeSec: acceptedState.acceptedTimeSec,
    acceptedRevision: acceptedState.revision,
    acceptedState,
  });
}

function anchoredGridPhaseSecV1(
  acceptedTimeSec: number,
  originSec: number,
  requestedStepSec: number,
): number {
  const elapsedSec = acceptedTimeSec - originSec;
  const ratio = elapsedSec / requestedStepSec;
  const nearestOrdinal = Math.round(ratio);
  const tolerance = timeToleranceV1(
    acceptedTimeSec,
    originSec,
    requestedStepSec,
  );
  const nearGrid = Math.abs(
    elapsedSec - nearestOrdinal * requestedStepSec,
  ) <= tolerance;
  const lowerGridOrdinal = nearGrid ? nearestOrdinal : Math.floor(ratio);
  const phaseSec = nearGrid
    ? 0
    : elapsedSec - lowerGridOrdinal * requestedStepSec;
  if (
    !Number.isSafeInteger(lowerGridOrdinal)
    || lowerGridOrdinal < 0
    || phaseSec < 0
    || phaseSec >= requestedStepSec
  ) {
    throw new Error("Standard66 continuation grid phase is invalid");
  }
  return phaseSec;
}

function smallestPhaseMatchedLagV1(
  cycleLengthSec: number,
  requestedStepSec: number,
): 1 | 2 | 3 {
  for (const lag of [1, 2, 3] as const) {
    const lagDurationSec = lag * cycleLengthSec;
    const nearestRequestedStepCount = Math.round(
      lagDurationSec / requestedStepSec,
    );
    if (
      Math.abs(
        lagDurationSec - nearestRequestedStepCount * requestedStepSec,
      ) <= timeToleranceV1(
        lagDurationSec,
        requestedStepSec,
      )
    ) {
      return lag;
    }
  }
  throw new Error(
    "Standard66 continuation has no phase-matched lag within three cycles",
  );
}

function timeToleranceV1(...values: readonly number[]): number {
  return 64 * Number.EPSILON * Math.max(
    1,
    ...values.map((value) => Math.abs(value)),
  );
}

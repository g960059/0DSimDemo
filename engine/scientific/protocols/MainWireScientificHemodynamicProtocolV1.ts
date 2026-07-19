import {
  buildNonCoronaryCirculationGraphV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  effectiveUnstressedVolumeFromNodeV1,
  nonValveEdgeLossV1,
  respiratoryExternalPressureForKindV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  buildVolumeConstrainedGuytonCurve,
  solveFillingPressureAbs,
  type VascularEdgeSnapshot,
  type VascularNodeSnapshot,
  type VascularReturnSnapshot,
} from "@/engine/guytonVascular";
import {
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryStepSuccessV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type { FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationStatusV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type { MainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type { MainWireCommonPericardiumBindingV1 } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  buildMainWireScientificPreloadOperatingLocusV1,
  type MainWireScientificHemodynamicMeasurementV1,
  type MainWireScientificHemodynamicOperatingPointV1,
  type MainWireScientificPreloadOperatingLocusV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import { complianceFromPtm, stressedVolumeFromPtm } from "@/engine/vascularPv";
import {
  initializeMainWireScientificFastTbvPreviewSeedV1,
  initializeMainWireScientificTbvTargetSeedV1,
  type MainWireScientificTbvSeedInitializationDiagnosticsV1,
} from "@/engine/scientific/protocols/MainWireScientificTbvContinuationSeedPredictorV1";
import {
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1,
  type MainWireScientificFastTbvAcquisitionV1,
  type MainWireScientificFastTbvClosureEvidenceV1,
  type MainWireScientificFastTbvPointEvidenceV1,
  type MainWireScientificFastTbvPreviewTargetV1,
  type MainWireScientificFastTbvTerminalObservationV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  assessMainWireScientificFastTbvRefinementV1,
  type MainWireScientificFastTbvRefinementAssessmentV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvRefinementPolicyV1";

export const MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V1_ID =
  "main-wire-scientific-guyton-starling-protocol-v1" as const;

const DT_SEC = 0.002;
const STEPS_PER_BEAT = 500;
const PRELOAD_TARGET_SCALES = Object.freeze([0.9, 0.95, 1, 1.05, 1.1]);
const MAXIMUM_SETTLING_BEATS =
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount;

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;
type StepSuccess = MainWireFiveWallNonCoronaryStepSuccessV1<MechanicsState>;

export type MainWireScientificProtocolAcceptedStateV1 = AcceptedState;

export type MainWireScientificHemodynamicProtocolDependenciesV1 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
}>;

export type MainWireScientificProtocolSourceIdentityV1 = Readonly<{
  revision: number;
  acceptedTimeSec: number;
  fixedTotalBloodVolumeMl: number;
}>;

export type MainWireScientificPreloadOperatingPointV1 = Readonly<{
  targetScale: number;
  fixedTotalBloodVolumeMl: number;
  status:
    | MainWireFiveWallPeriodicClassificationStatusV1
    | "maximum-beats-reached"
    | "step-failure";
  acceptedForPeriod1Locus: boolean;
  completedBeatCount: number;
  meanRapTransmuralMmHg: number | null;
  meanLapTransmuralMmHg: number | null;
  netCardiacOutputLMin: number | null;
  forwardCardiacOutputLMin: number | null;
  lvEndDiastolicVolumeMl: number | null;
  lvEndSystolicVolumeMl: number | null;
  lvStrokeWorkMmHgMl: number | null;
  lvPressureVolumeObservation: Readonly<{
    endDiastolic: Readonly<{
      volumeMl: number;
      transmuralPressureMmHg: number;
    }>;
    endSystolic: Readonly<{
      volumeMl: number;
      transmuralPressureMmHg: number;
    }>;
    strokeWorkMmHgMl: number;
    eventStatus: "complete" | "non-ejecting-beat";
    evidenceRole: "tbv-operating-point-observation-only";
    crossPointFitEligible: false;
  }> | null;
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
  period2Branches:
    | readonly [
        MainWireScientificPreloadBranchMeasurementV1,
        MainWireScientificPreloadBranchMeasurementV1,
      ]
    | null;
  failureReason: string | null;
}>;

export type MainWireScientificPreloadBranchMeasurementV1 = Readonly<{
  branchId: "strong" | "weak";
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
  netCardiacOutputLMin: number;
  lvEndDiastolicVolumeMl: number | null;
  lvEndSystolicVolumeMl: number | null;
  lvStrokeWorkMmHgMl: number;
}>;

export type MainWireScientificVascularFunctionCurveV1 = Readonly<{
  side: "right" | "left";
  xSemantics:
    | "mean-transmural-right-atrial-pressure-cvp-model-equivalent"
    | "mean-transmural-left-atrial-pressure-pcwp-surrogate";
  ySemantics:
    "systemic-venous-return-l-per-min" | "pulmonary-venous-return-l-per-min";
  pressureReferenceOffsetMmHg: number;
  fillingPressureAbsoluteMmHg: number;
  fillingPressureTransmuralMmHg: number;
  points: readonly Readonly<{
    pressureTransmuralMmHg: number;
    flowLMin: number;
  }>[];
}>;

export type MainWireScientificGuytonStarlingProtocolResultV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V1_ID;
  protocolVersion: "1.0.0";
  source: MainWireScientificProtocolSourceIdentityV1;
  claim: Readonly<{
    totalBloodVolumeSweepIsOneDimensionalPreloadOperatingLocus: true;
    totalBloodVolumeSweepIsNotGuytonPumpExperiment: true;
    totalBloodVolumeSweepIsNotEspvrOrEdpvr: true;
    vascularCurveMethod: "cycle-mean-fixed-volume-vascular-pv-law-volume-constrained";
    preloadInitialization: "independent-source-state-fork-shared-SV-VC-transmural-offset";
    period2PointsAveragedIntoPeriod1Locus: false;
  }>;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  rightVascularFunction: MainWireScientificVascularFunctionCurveV1;
  leftVascularFunction: MainWireScientificVascularFunctionCurveV1;
  preloadOperatingPoints: readonly MainWireScientificPreloadOperatingPointV1[];
  preloadOperatingLocus: MainWireScientificPreloadOperatingLocusV1;
}>;

export type MainWireScientificGuytonStarlingBaselineV2 = Readonly<{
  source: MainWireScientificProtocolSourceIdentityV1;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  rightVascularFunction: MainWireScientificVascularFunctionCurveV1;
  leftVascularFunction: MainWireScientificVascularFunctionCurveV1;
  baselinePoint: MainWireScientificPreloadOperatingPointV1;
  /** Trusted protocol-worker state at the same cycle phase, never presented. */
  continuationSeedState: MainWireScientificProtocolAcceptedStateV1;
}>;

export type MainWireScientificSettledPreloadPointV2 = Readonly<{
  point: MainWireScientificPreloadOperatingPointV1;
  /** Present only for a classified P1 endpoint eligible to seed continuation. */
  continuationSeedState: MainWireScientificProtocolAcceptedStateV1 | null;
  /** Initializer provenance; null only when initialization itself failed. */
  seedInitialization: MainWireScientificTbvSeedInitializationDiagnosticsV1 | null;
}>;

export function runMainWireScientificGuytonStarlingProtocolV1(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  sourceState: AcceptedState,
): MainWireScientificGuytonStarlingProtocolResultV1 {
  const prepared = prepareMainWireScientificGuytonStarlingBaselineV2(
    dependencies,
    sourceState,
  );
  const source = prepared.source;
  const baselinePeriodicity = prepared.baselinePeriodicity;
  const rightVascularFunction = prepared.rightVascularFunction;
  const leftVascularFunction = prepared.leftVascularFunction;
  const preloadOperatingPoints = PRELOAD_TARGET_SCALES.map((targetScale) =>
    targetScale === 1
      ? prepared.baselinePoint
      : settleIndependentPreloadPoint(
          dependencies,
          sourceState,
          source.fixedTotalBloodVolumeMl * targetScale,
          targetScale,
        ),
  );
  const preloadOperatingLocus = buildMainWireScientificPreloadOperatingLocusV1(
    preloadOperatingPoints.map((point) =>
      preloadOperatingPointForAnalysis(point),
    ),
  );
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V1_ID,
    protocolVersion: "1.0.0" as const,
    source,
    claim: Object.freeze({
      totalBloodVolumeSweepIsOneDimensionalPreloadOperatingLocus: true as const,
      totalBloodVolumeSweepIsNotGuytonPumpExperiment: true as const,
      totalBloodVolumeSweepIsNotEspvrOrEdpvr: true as const,
      vascularCurveMethod:
        "cycle-mean-fixed-volume-vascular-pv-law-volume-constrained" as const,
      preloadInitialization:
        "independent-source-state-fork-shared-SV-VC-transmural-offset" as const,
      period2PointsAveragedIntoPeriod1Locus: false as const,
    }),
    baselinePeriodicity,
    rightVascularFunction,
    leftVascularFunction,
    preloadOperatingPoints: Object.freeze(preloadOperatingPoints),
    preloadOperatingLocus,
  });
}

/**
 * Computes the one-beat vascular snapshot and source operating point before
 * any expensive preload exploration. Browser job hosts can therefore publish
 * the Guyton structural curves immediately and dispatch continuation lanes
 * afterwards.
 */
export function prepareMainWireScientificGuytonStarlingBaselineV2(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  sourceState: MainWireScientificProtocolAcceptedStateV1,
): MainWireScientificGuytonStarlingBaselineV2 {
  const source = sourceIdentity(sourceState);
  const baseline = runProtocolBeat(dependencies, sourceState, () => 1);
  const baselineClosure = compareMainWireFiveWallAcceptedStatesV1(
    baseline.state,
    sourceState,
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  );
  const baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1 =
    baselineClosure.overall.maximumNormalizedDelta <=
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.period1NormalizedTolerance
      ? "period1-converged"
      : "not-converged";
  const rightSnapshot = meanVascularSnapshot(
    "right",
    baseline.steps,
    dependencies.runtime,
  );
  const leftSnapshot = meanVascularSnapshot(
    "left",
    baseline.steps,
    dependencies.runtime,
  );
  const meanOffset = mean(
    baseline.steps.map(
      ({ sample }) =>
        sample.nodeAbsolutePressureMmHg.RA -
        sample.chamberTransmuralPressureMmHg.RA,
    ),
  );
  const meanLeftOffset = mean(
    baseline.steps.map(
      ({ sample }) =>
        sample.nodeAbsolutePressureMmHg.LA -
        sample.chamberTransmuralPressureMmHg.LA,
    ),
  );
  const baselinePoint = preloadPointFromSettledBeat({
    targetScale: 1,
    fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
    status: baselinePeriodicity,
    completedBeatCount: 1,
    closureObservations: [],
    steps: baseline.steps,
    previousPeriod2BranchSteps: null,
    failureReason:
      baselinePeriodicity === "period1-converged"
        ? null
        : "source session did not reproduce a period-1 beat",
  });
  return Object.freeze({
    source,
    baselinePeriodicity,
    rightVascularFunction: vascularFunctionResult(rightSnapshot, meanOffset),
    leftVascularFunction: vascularFunctionResult(leftSnapshot, meanLeftOffset),
    baselinePoint,
    continuationSeedState: baseline.state,
  });
}

export function buildMainWireScientificPreloadOperatingLocusFromPointsV1(
  points: readonly MainWireScientificPreloadOperatingPointV1[],
): MainWireScientificPreloadOperatingLocusV1 {
  return buildMainWireScientificPreloadOperatingLocusV1(
    points.map((point) => preloadOperatingPointForAnalysis(point)),
  );
}

export function buildMainWireScientificPreloadOperatingLocusFromIdentifiedPointsV1(
  points: readonly Readonly<{
    pointId: string;
    point: MainWireScientificPreloadOperatingPointV1;
  }>[],
): MainWireScientificPreloadOperatingLocusV1 {
  return buildMainWireScientificPreloadOperatingLocusV1(
    points.map(({ pointId, point }) =>
      preloadOperatingPointForAnalysis(point, pointId),
    ),
  );
}

function settleIndependentPreloadPoint(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  sourceState: AcceptedState,
  targetTbvMl: number,
  targetScale: number,
): MainWireScientificPreloadOperatingPointV1 {
  return settleMainWireScientificContinuationPreloadPointV2(
    dependencies,
    sourceState,
    targetTbvMl,
    targetScale,
  ).point;
}

/**
 * Settles one fixed-TBV continuation target from a same-phase accepted seed.
 * Only a classified P1 endpoint is returned as the next warm seed. P2,
 * unresolved and failed targets remain visible evidence but cannot silently
 * propagate an untrusted branch into the next volume point.
 */
export function settleMainWireScientificContinuationPreloadPointV2(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  seedState: MainWireScientificProtocolAcceptedStateV1,
  targetTbvMl: number,
  targetScale: number,
  options: Readonly<{
    previousPeriod1SeedState?: MainWireScientificProtocolAcceptedStateV1 | null;
  }> = {},
): MainWireScientificSettledPreloadPointV2 {
  let state: AcceptedState;
  let seedInitialization: MainWireScientificTbvSeedInitializationDiagnosticsV1 | null =
    null;
  try {
    const initialized = initializeMainWireScientificTbvTargetSeedV1({
      currentP1State: seedState,
      previousP1State: options.previousPeriod1SeedState ?? null,
      targetTbvMl,
      runtime: dependencies.runtime,
      cycleLengthSec: STEPS_PER_BEAT * DT_SEC,
    });
    state = initialized.state;
    seedInitialization = initialized.diagnostics;
  } catch (error) {
    return Object.freeze({
      point: emptyPreloadPoint(
        targetScale,
        targetTbvMl,
        "step-failure",
        errorMessage(error),
      ),
      continuationSeedState: null,
      seedInitialization,
    });
  }
  const closureObservations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  let previous = state;
  let previous2: AcceptedState | null = null;
  let terminalSteps: readonly ProtocolStep[] = [];
  let previousTerminalSteps: readonly ProtocolStep[] | null = null;
  let previousBeatStartState: AcceptedState | null = null;
  let immediatelyPreviousCapturedSteps: readonly ProtocolStep[] | null = null;
  for (let beatIndex = 1; beatIndex <= MAXIMUM_SETTLING_BEATS; beatIndex += 1) {
    const beatStartState = state;
    const captureDiagnostics =
      beatIndex === MAXIMUM_SETTLING_BEATS ||
      shouldCapturePreloadSettlingBeat(closureObservations);
    let beat;
    try {
      beat = runProtocolBeat(dependencies, state, () => 1, captureDiagnostics);
    } catch (error) {
      return Object.freeze({
        point: emptyPreloadPoint(
          targetScale,
          targetTbvMl,
          "step-failure",
          errorMessage(error),
          beatIndex - 1,
        ),
        continuationSeedState: null,
        seedInitialization,
      });
    }
    state = beat.state;
    terminalSteps = beat.steps;
    previousTerminalSteps = immediatelyPreviousCapturedSteps;
    immediatelyPreviousCapturedSteps =
      terminalSteps.length > 0 ? terminalSteps : null;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      state,
      previous,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 =
      previous2 === null
        ? null
        : compareMainWireFiveWallAcceptedStatesV1(
            state,
            previous2,
            MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
          );
    closureObservations.push(Object.freeze({ beatIndex, period1, period2 }));
    const classification = classifyProtocolPeriodicity(closureObservations);
    previous2 = previous;
    previous = state;
    if (
      classification.status === "period1-converged" ||
      classification.status === "period2-suspect"
    ) {
      if (terminalSteps.length === 0) {
        terminalSteps = runProtocolBeat(
          dependencies,
          beatStartState,
          () => 1,
          true,
        ).steps;
      }
      if (
        classification.status === "period2-suspect" &&
        previousTerminalSteps === null &&
        previousBeatStartState !== null
      ) {
        previousTerminalSteps = runProtocolBeat(
          dependencies,
          previousBeatStartState,
          () => 1,
          true,
        ).steps;
      }
      const point = preloadPointFromSettledBeat({
        targetScale,
        fixedTotalBloodVolumeMl: targetTbvMl,
        status: classification.status,
        completedBeatCount: beatIndex,
        closureObservations,
        steps: terminalSteps,
        previousPeriod2BranchSteps:
          classification.status === "period2-suspect"
            ? previousTerminalSteps
            : null,
        failureReason:
          classification.status === "period2-suspect"
            ? "period-2-suspect orbit classified; point retained but excluded from P1 locus"
            : null,
      });
      return Object.freeze({
        point,
        continuationSeedState:
          classification.status === "period1-converged" ? state : null,
        seedInitialization,
      });
    }
    previousBeatStartState = beatStartState;
  }
  return Object.freeze({
    point: preloadPointFromSettledBeat({
      targetScale,
      fixedTotalBloodVolumeMl: targetTbvMl,
      status: "maximum-beats-reached",
      completedBeatCount: MAXIMUM_SETTLING_BEATS,
      closureObservations,
      steps: terminalSteps,
      previousPeriod2BranchSteps: null,
      failureReason:
        "periodicity gate was not reached within the bounded protocol",
    }),
    continuationSeedState: null,
    seedInitialization,
  });
}

/**
 * Produces a rapid finite-hold TBV observation after an artificial,
 * compliance-projected state jump and an initial two natural beats. A point may
 * pass the provisional near-P1 residual screen, but that is not assumed. This
 * is an intentionally separate evidence path: it never returns a settled
 * operating point, never seeds the canonical continuation planner, and never
 * enters an ESPVR/EDPVR/PRSW fit.
 */
export function estimateMainWireScientificFastTbvPreviewPointV1(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  sourceState: MainWireScientificProtocolAcceptedStateV1,
  target: MainWireScientificFastTbvPreviewTargetV1,
  sourceFingerprint: string,
  sourceEvidenceId = "source-period1-baseline",
  initializationStrategy:
    | "adaptive-provisional-secant"
    | "vascular-compliance-projection"
    | "shared-sv-vc-pressure-offset" = "adaptive-provisional-secant",
  previousSourceState: MainWireScientificProtocolAcceptedStateV1 | null = null,
): Readonly<{
  evidence: MainWireScientificFastTbvPointEvidenceV1;
  terminalState: MainWireScientificProtocolAcceptedStateV1 | null;
  refinementAssessment: MainWireScientificFastTbvRefinementAssessmentV1 | null;
}> {
  let initializer: MainWireScientificTbvSeedInitializationDiagnosticsV1 | null =
    null;
  const acquisition = (
    diagnostics: MainWireScientificTbvSeedInitializationDiagnosticsV1 | null,
    completedNaturalBeatCountAfterPrediction: 0 | 1 | 2,
  ): MainWireScientificFastTbvAcquisitionV1 =>
    Object.freeze({
      target,
      sourceEvidenceId,
      initializer: diagnostics,
      plannedNaturalBeatCountAfterPrediction: 2 as const,
      completedNaturalBeatCountAfterPrediction,
      holdDurationSec:
        completedNaturalBeatCountAfterPrediction * STEPS_PER_BEAT * DT_SEC,
    });
  let predictedState: AcceptedState;
  try {
    const initialized =
      initializationStrategy === "adaptive-provisional-secant" &&
      previousSourceState !== null
        ? initializeMainWireScientificTbvTargetSeedV1({
            currentP1State: sourceState,
            previousP1State: previousSourceState,
            targetTbvMl: target.totalBloodVolumeMl,
            runtime: dependencies.runtime,
            cycleLengthSec: STEPS_PER_BEAT * DT_SEC,
            referenceEvidence: "provisional-fast-preview",
          })
        : initializationStrategy !== "shared-sv-vc-pressure-offset"
          ? initializeMainWireScientificFastTbvPreviewSeedV1({
              sourceState,
              targetTbvMl: target.totalBloodVolumeMl,
              runtime: dependencies.runtime,
            })
          : initializeMainWireScientificTbvTargetSeedV1({
              currentP1State: sourceState,
              previousP1State: null,
              targetTbvMl: target.totalBloodVolumeMl,
              runtime: dependencies.runtime,
            });
    initializer = initialized.diagnostics;
    predictedState = initialized.state;
  } catch (error) {
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target,
        sourceFingerprint,
        acquisition: acquisition(initializer, 0),
        failureKind: "physical-bound",
        reason: errorMessage(error),
      }),
      null,
    );
  }

  let firstBeat: ReturnType<typeof runProtocolBeat>;
  try {
    firstBeat = runProtocolBeat(dependencies, predictedState, () => 1, true);
  } catch (error) {
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target,
        sourceFingerprint,
        acquisition: acquisition(initializer, 0),
        failureKind: "solver",
        reason: errorMessage(error),
      }),
      null,
    );
  }
  let secondBeat: ReturnType<typeof runProtocolBeat>;
  try {
    secondBeat = runProtocolBeat(dependencies, firstBeat.state, () => 1, true);
  } catch (error) {
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target,
        sourceFingerprint,
        acquisition: acquisition(initializer, 1),
        failureKind: "solver",
        reason: errorMessage(error),
      }),
      null,
    );
  }

  const predictorToFirstNaturalBeatResidual =
    compareMainWireFiveWallAcceptedStatesV1(
      firstBeat.state,
      predictedState,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    ).overall.maximumNormalizedDelta;
  const naturalBeatToBeatResidual = compareMainWireFiveWallAcceptedStatesV1(
    secondBeat.state,
    firstBeat.state,
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  ).overall.maximumNormalizedDelta;
  const firstObservation = fastTbvObservationFromSteps(firstBeat.steps);
  const observation = fastTbvObservationFromSteps(secondBeat.steps);
  const closureResidualsFinite = [
    predictorToFirstNaturalBeatResidual,
    naturalBeatToBeatResidual,
  ].every(Number.isFinite);
  if (
    !closureResidualsFinite ||
    !firstObservation.quality.numerics.passed ||
    !observation.quality.numerics.passed
  ) {
    const combinedFinite =
      closureResidualsFinite &&
      firstObservation.quality.numerics.finite &&
      observation.quality.numerics.finite;
    const maximumTbvErrorMl = Math.max(
      firstObservation.quality.numerics.totalBloodVolumeAbsoluteErrorMl,
      observation.quality.numerics.totalBloodVolumeAbsoluteErrorMl,
    );
    const maximumContinuityResidualMl = Math.max(
      firstObservation.quality.numerics.maximumContinuityAbsoluteResidualMl,
      observation.quality.numerics.maximumContinuityAbsoluteResidualMl,
    );
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target,
        sourceFingerprint,
        acquisition: acquisition(initializer, 2),
        failureKind: !combinedFinite
          ? "non-finite"
          : maximumTbvErrorMl >
              MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.maximumTbvAbsoluteErrorMl
            ? "mass-conservation"
            : "solver",
        reason: `fast preview natural-beat QC failed (TBV ${maximumTbvErrorMl} mL; continuity ${maximumContinuityResidualMl} mL; finite closure ${closureResidualsFinite})`,
      }),
      null,
    );
  }
  const residualRatio =
    naturalBeatToBeatResidual /
    Math.max(predictorToFirstNaturalBeatResidual, 1e-12);
  const refinementAssessment = assessMainWireScientificFastTbvRefinementV1({
    previousBeat: Object.freeze({
      naturalBeatOrdinal: 1,
      fullStateMaximumNormalizedDelta: predictorToFirstNaturalBeatResidual,
      observation: firstObservation,
    }),
    latestBeat: Object.freeze({
      naturalBeatOrdinal: 2,
      fullStateMaximumNormalizedDelta: naturalBeatToBeatResidual,
      observation,
    }),
  });
  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1;
  const canonicalTolerance =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.period1NormalizedTolerance;
  const closure: MainWireScientificFastTbvClosureEvidenceV1 = Object.freeze({
    policyId: policy.policyId,
    requiredCanonicalConsecutivePeriod1Beats: 3 as const,
    observedCanonicalConsecutivePeriod1Beats:
      naturalBeatToBeatResidual <= canonicalTolerance
        ? (1 as const)
        : (0 as const),
    predictorToFirstNaturalBeatMaximumNormalizedDelta:
      predictorToFirstNaturalBeatResidual,
    latestPeriod1MaximumNormalizedDelta: naturalBeatToBeatResidual,
    residualRatio,
    nearPeriod1ResidualTolerance: policy.nearPeriod1ResidualTolerance,
    residualTrend:
      residualRatio <= policy.maximumContractingResidualRatio
        ? ("contracting" as const)
        : residualRatio <= 1.05
          ? ("flat" as const)
          : ("growing" as const),
    predictorInjectionExcludedFromCanonicalP1Count: true as const,
  });
  const common = Object.freeze({
    evidenceId: target.targetId,
    sourceFingerprint,
    acquisition: acquisition(initializer, 2),
    observation,
    closure,
  });
  const lvPvEndpointDisplay =
    observation.quality.lvEvents.endpointDisplayEligible;
  if (
    naturalBeatToBeatResidual <= policy.nearPeriod1ResidualTolerance &&
    residualRatio <= policy.maximumContractingResidualRatio
  ) {
    return fastPreviewEvaluation(
      Object.freeze({
        ...common,
        evidenceClass: "near-period1-estimate" as const,
        periodicityClaim: "not-demonstrated" as const,
        eligibility: Object.freeze({
          hemodynamicPreview: true as const,
          rapidFiniteHoldLocus: true as const,
          settledP1Locus: false as const,
          lvPvEndpointDisplay,
          continuationSeed: false as const,
          espvrEdpvrPrswFit: false as const,
        }),
        estimateAssessment:
          "residual-near-period1-but-gate-incomplete" as const,
      }),
      secondBeat.state,
      refinementAssessment,
    );
  }
  return fastPreviewEvaluation(
    Object.freeze({
      ...common,
      evidenceClass: "finite-hold-unclassified" as const,
      periodicityClaim: "not-demonstrated" as const,
      eligibility: Object.freeze({
        hemodynamicPreview: true as const,
        rapidFiniteHoldLocus:
          naturalBeatToBeatResidual <= policy.maximumRapidFiniteHoldResidual &&
          residualRatio <= policy.maximumContractingResidualRatio,
        settledP1Locus: false as const,
        lvPvEndpointDisplay,
        continuationSeed: false as const,
        espvrEdpvrPrswFit: false as const,
      }),
      reason:
        naturalBeatToBeatResidual > policy.nearPeriod1ResidualTolerance
          ? "two-beat hold ended outside the provisional near-P1 residual gate"
          : "full-state residual did not contract monotonically after prediction",
    }),
    secondBeat.state,
    refinementAssessment,
  );
}

/** Advances one already-emitted rapid point by exactly one natural beat. */
export function refineMainWireScientificFastTbvPreviewPointV1(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  terminalState: MainWireScientificProtocolAcceptedStateV1,
  previousEvidence: MainWireScientificFastTbvPointEvidenceV1,
): Readonly<{
  evidence: MainWireScientificFastTbvPointEvidenceV1;
  terminalState: MainWireScientificProtocolAcceptedStateV1 | null;
  refinementAssessment: MainWireScientificFastTbvRefinementAssessmentV1 | null;
}> {
  if (previousEvidence.evidenceClass === "failure") {
    return fastPreviewEvaluation(previousEvidence, null);
  }
  const targetTbvErrorMl = Math.abs(
    terminalState.circulation.totalBloodVolumeMl
      - previousEvidence.acquisition.target.totalBloodVolumeMl,
  );
  if (
    !Number.isFinite(targetTbvErrorMl)
    || targetTbvErrorMl
      > MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.maximumTbvAbsoluteErrorMl
  ) {
    throw new Error(
      "rapid TBV refinement state does not match its evidence target",
    );
  }
  const previousCompleted =
    previousEvidence.acquisition.completedNaturalBeatCountAfterPrediction;
  if (previousCompleted < 2 || previousCompleted >= 5) {
    throw new Error("rapid TBV point can only refine after beats 2 through 4");
  }
  const completed = (previousCompleted + 1) as 3 | 4 | 5;
  const acquisition: MainWireScientificFastTbvAcquisitionV1 = Object.freeze({
    ...previousEvidence.acquisition,
    plannedNaturalBeatCountAfterPrediction: completed,
    completedNaturalBeatCountAfterPrediction: completed,
    holdDurationSec: completed * STEPS_PER_BEAT * DT_SEC,
  });
  let nextBeat: ReturnType<typeof runProtocolBeat>;
  try {
    nextBeat = runProtocolBeat(dependencies, terminalState, () => 1, true);
  } catch (error) {
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target: previousEvidence.acquisition.target,
        sourceFingerprint: previousEvidence.sourceFingerprint,
        acquisition: Object.freeze({
          ...acquisition,
          completedNaturalBeatCountAfterPrediction: previousCompleted,
          holdDurationSec: previousCompleted * STEPS_PER_BEAT * DT_SEC,
        }),
        failureKind: "solver",
        reason: errorMessage(error),
      }),
      null,
    );
  }

  const latestResidual = compareMainWireFiveWallAcceptedStatesV1(
    nextBeat.state,
    terminalState,
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  ).overall.maximumNormalizedDelta;
  const observation = fastTbvObservationFromSteps(nextBeat.steps);
  if (!Number.isFinite(latestResidual) || !observation.quality.numerics.passed) {
    const numerics = observation.quality.numerics;
    return fastPreviewEvaluation(
      fastPreviewFailure({
        target: previousEvidence.acquisition.target,
        sourceFingerprint: previousEvidence.sourceFingerprint,
        acquisition,
        failureKind: !Number.isFinite(latestResidual) || !numerics.finite
          ? "non-finite"
          : numerics.totalBloodVolumeAbsoluteErrorMl
                > MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.maximumTbvAbsoluteErrorMl
            ? "mass-conservation"
            : "solver",
        reason: `fast preview refinement beat QC failed (TBV ${numerics.totalBloodVolumeAbsoluteErrorMl} mL; continuity ${numerics.maximumContinuityAbsoluteResidualMl} mL; finite closure ${Number.isFinite(latestResidual)})`,
      }),
      null,
    );
  }

  const previousResidual =
    previousEvidence.closure.latestPeriod1MaximumNormalizedDelta;
  const residualRatio = latestResidual / Math.max(previousResidual, 1e-12);
  const refinementAssessment = assessMainWireScientificFastTbvRefinementV1({
    previousBeat: Object.freeze({
      naturalBeatOrdinal: previousCompleted,
      fullStateMaximumNormalizedDelta: previousResidual,
      observation: previousEvidence.observation,
    }),
    latestBeat: Object.freeze({
      naturalBeatOrdinal: completed,
      fullStateMaximumNormalizedDelta: latestResidual,
      observation,
    }),
  });
  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1;
  const canonicalTolerance =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.period1NormalizedTolerance;
  const closure: MainWireScientificFastTbvClosureEvidenceV1 = Object.freeze({
    ...previousEvidence.closure,
    observedCanonicalConsecutivePeriod1Beats:
      latestResidual <= canonicalTolerance ? 1 as const : 0 as const,
    latestPeriod1MaximumNormalizedDelta: latestResidual,
    residualRatio,
    residualTrend: residualRatio <= policy.maximumContractingResidualRatio
      ? "contracting" as const
      : residualRatio <= 1.05
        ? "flat" as const
        : "growing" as const,
  });
  const common = Object.freeze({
    evidenceId: previousEvidence.evidenceId,
    sourceFingerprint: previousEvidence.sourceFingerprint,
    acquisition,
    observation,
    closure,
  });
  const lvPvEndpointDisplay =
    observation.quality.lvEvents.endpointDisplayEligible;
  const nearPeriod1 = latestResidual <= policy.nearPeriod1ResidualTolerance
    && residualRatio <= policy.maximumContractingResidualRatio;
  const evidence: MainWireScientificFastTbvPointEvidenceV1 = nearPeriod1
    ? Object.freeze({
        ...common,
        evidenceClass: "near-period1-estimate" as const,
        periodicityClaim: "not-demonstrated" as const,
        eligibility: Object.freeze({
          hemodynamicPreview: true as const,
          rapidFiniteHoldLocus: true as const,
          settledP1Locus: false as const,
          lvPvEndpointDisplay,
          continuationSeed: false as const,
          espvrEdpvrPrswFit: false as const,
        }),
        estimateAssessment:
          "residual-near-period1-but-gate-incomplete" as const,
      })
    : Object.freeze({
        ...common,
        evidenceClass: "finite-hold-unclassified" as const,
        periodicityClaim: "not-demonstrated" as const,
        eligibility: Object.freeze({
          hemodynamicPreview: true as const,
          rapidFiniteHoldLocus:
            latestResidual <= policy.maximumRapidFiniteHoldResidual
            && residualRatio <= policy.maximumContractingResidualRatio,
          settledP1Locus: false as const,
          lvPvEndpointDisplay,
          continuationSeed: false as const,
          espvrEdpvrPrswFit: false as const,
        }),
        reason: latestResidual > policy.nearPeriod1ResidualTolerance
          ? `${completed}-beat finite hold ended outside the provisional near-P1 residual gate`
          : "full-state residual did not contract monotonically after prediction",
      });
  return fastPreviewEvaluation(
    evidence,
    nextBeat.state,
    refinementAssessment,
  );
}

function fastPreviewEvaluation(
  evidence: MainWireScientificFastTbvPointEvidenceV1,
  terminalState: MainWireScientificProtocolAcceptedStateV1 | null,
  refinementAssessment: MainWireScientificFastTbvRefinementAssessmentV1 | null = null,
) {
  return Object.freeze({ evidence, terminalState, refinementAssessment });
}

function fastTbvObservationFromSteps(
  steps: readonly ProtocolStep[],
): MainWireScientificFastTbvTerminalObservationV1 {
  const samples = steps.map(({ sample }) => sample);
  const metrics = beatMetrics(samples);
  const events = extractEndDiastolicAndEndSystolic(samples);
  const totalBloodVolumeAbsoluteErrorMl = steps.reduce(
    (maximum, { sample }) =>
      Math.max(maximum, Math.abs(sample.diagnostics.totalBloodVolumeErrorMl)),
    0,
  );
  const maximumContinuityAbsoluteResidualMl = steps.reduce(
    (maximum, { sample }) =>
      Math.max(
        maximum,
        Math.abs(sample.diagnostics.maximumContinuityResidualMl),
      ),
    0,
  );
  const finite = [
    metrics.meanRapTransmuralMmHg,
    metrics.meanLapTransmuralMmHg,
    metrics.netCardiacOutputLMin,
    metrics.forwardCardiacOutputLMin,
    metrics.strokeWorkMmHgMl,
    totalBloodVolumeAbsoluteErrorMl,
    maximumContinuityAbsoluteResidualMl,
  ].every(Number.isFinite);
  const policy = MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1;
  const eventStatus =
    events.endDiastolic === null
      ? ("missing-end-diastolic-event" as const)
      : events.endSystolic === null
        ? ("missing-end-systolic-event" as const)
        : events.endDiastolic.volumeMl - events.endSystolic.volumeMl <= 1
          ? ("non-ejecting-beat" as const)
          : ("complete" as const);
  return Object.freeze({
    meanRapTransmuralMmHg: metrics.meanRapTransmuralMmHg,
    meanLapTransmuralMmHg: metrics.meanLapTransmuralMmHg,
    netCardiacOutputLMin: metrics.netCardiacOutputLMin,
    forwardCardiacOutputLMin: metrics.forwardCardiacOutputLMin,
    lvPressureVolume:
      events.endDiastolic !== null && events.endSystolic !== null
        ? Object.freeze({
            endDiastolicVolumeMl: events.endDiastolic.volumeMl,
            endDiastolicTransmuralPressureMmHg:
              events.endDiastolic.pressureTransmuralMmHg,
            endSystolicVolumeMl: events.endSystolic.volumeMl,
            endSystolicTransmuralPressureMmHg:
              events.endSystolic.pressureTransmuralMmHg,
            strokeWorkMmHgMl: metrics.strokeWorkMmHgMl,
          })
        : null,
    quality: Object.freeze({
      numerics: Object.freeze({
        finite,
        totalBloodVolumeAbsoluteErrorMl,
        maximumContinuityAbsoluteResidualMl,
        passed:
          finite &&
          totalBloodVolumeAbsoluteErrorMl <= policy.maximumTbvAbsoluteErrorMl &&
          maximumContinuityAbsoluteResidualMl <=
            policy.maximumContinuityAbsoluteResidualMl,
      }),
      lvEvents: Object.freeze({
        status: eventStatus,
        endpointDisplayEligible: eventStatus === "complete",
      }),
    }),
  });
}

function fastPreviewFailure(
  input: Readonly<{
    target: MainWireScientificFastTbvPreviewTargetV1;
    sourceFingerprint: string;
    acquisition: MainWireScientificFastTbvAcquisitionV1;
    failureKind: Extract<
      MainWireScientificFastTbvPointEvidenceV1,
      { evidenceClass: "failure" }
    >["failureKind"];
    reason: string;
  }>,
): Extract<
  MainWireScientificFastTbvPointEvidenceV1,
  { evidenceClass: "failure" }
> {
  return Object.freeze({
    evidenceId: input.target.targetId,
    sourceFingerprint: input.sourceFingerprint,
    evidenceClass: "failure" as const,
    periodicityClaim: "none" as const,
    acquisition: input.acquisition,
    eligibility: noFastPreviewEligibility(),
    failureKind: input.failureKind,
    reason: input.reason,
  });
}

function noFastPreviewEligibility() {
  return Object.freeze({
    hemodynamicPreview: false as const,
    rapidFiniteHoldLocus: false as const,
    settledP1Locus: false as const,
    lvPvEndpointDisplay: false as const,
    continuationSeed: false as const,
    espvrEdpvrPrswFit: false as const,
  });
}

/**
 * Full per-step diagnostics are only needed for a terminal P1 beat or for the
 * two terminal P2 branches. The classifier requires consecutive beat-boundary
 * evidence, so its preceding observations identify those beats before they
 * are integrated. This keeps the scientific classification unchanged while
 * avoiding diagnostic sample/state arrays during the long settling prefix.
 */
function shouldCapturePreloadSettlingBeat(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): boolean {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  const period1PredecessorCount = Math.max(0, policy.consecutiveBeats - 1);
  if (
    observationSuffixMatches(
      observations,
      period1PredecessorCount,
      (observation) =>
        observation.period1 !== null &&
        observation.period1.overall.maximumNormalizedDelta <=
          policy.period1NormalizedTolerance,
    )
  )
    return true;

  // Capture one beat earlier for P2 so the immediately preceding strong/weak
  // branch remains available when the next beat completes the evidence suffix.
  const period2PredecessorCount = Math.max(0, policy.consecutiveBeats - 2);
  return observationSuffixMatches(
    observations,
    period2PredecessorCount,
    (observation) =>
      observation.period1 !== null &&
      observation.period2 !== null &&
      observation.period1.overall.maximumNormalizedDelta >=
        policy.period2MinimumPeriod1NormalizedDelta &&
      observation.period2.overall.maximumNormalizedDelta <=
        policy.period2NormalizedTolerance,
  );
}

function observationSuffixMatches(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
  requiredCount: number,
  matches: (observation: MainWireFiveWallPeriodicBeatObservationV1) => boolean,
): boolean {
  if (requiredCount === 0) return true;
  const suffix = observations.slice(-requiredCount);
  return (
    suffix.length === requiredCount &&
    suffix.every(
      (observation, index) =>
        matches(observation) &&
        (index === 0 ||
          observation.beatIndex === suffix[index - 1]!.beatIndex + 1),
    )
  );
}

type ProtocolStep = Readonly<{
  state: AcceptedState;
  step: StepSuccess;
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2;
}>;

function runProtocolBeat(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  initialState: AcceptedState,
  vcRaResistanceScaleAtPhase: (phase01: number) => number,
  captureDiagnostics = true,
): Readonly<{ state: AcceptedState; steps: readonly ProtocolStep[] }> {
  let state = initialState;
  const steps: ProtocolStep[] = [];
  for (let stepIndex = 0; stepIndex < STEPS_PER_BEAT; stepIndex += 1) {
    const phase01 = (stepIndex + 1) / STEPS_PER_BEAT;
    const scale = vcRaResistanceScaleAtPhase(phase01);
    const stepped = stepMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      state,
      {
        dtSec: DT_SEC,
        runtime: dependencies.runtime,
        calciumDriveParams: dependencies.calciumDriveParams,
        pericardium: dependencies.pericardium,
        protocolResistanceScaleByEdge: Object.freeze({ VC_RA: scale }),
      },
    );
    if (stepped.converged === false) {
      throw new Error(
        `protocol beat step ${stepIndex + 1} failed: ${stepped.message}`,
      );
    }
    state = stepped.acceptedState;
    if (captureDiagnostics) {
      steps.push(
        Object.freeze({
          state,
          step: stepped,
          sample: sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
        }),
      );
    }
  }
  return Object.freeze({ state, steps: Object.freeze(steps) });
}

function preloadPointFromSettledBeat(
  input: Readonly<{
    targetScale: number;
    fixedTotalBloodVolumeMl: number;
    status: MainWireScientificPreloadOperatingPointV1["status"];
    completedBeatCount: number;
    closureObservations: readonly MainWireFiveWallPeriodicBeatObservationV1[];
    steps: readonly ProtocolStep[];
    previousPeriod2BranchSteps: readonly ProtocolStep[] | null;
    failureReason: string | null;
  }>,
): MainWireScientificPreloadOperatingPointV1 {
  const samples = input.steps.map(({ sample }) => sample);
  const metrics = samples.length === 0 ? null : beatMetrics(samples);
  const latest = input.closureObservations.at(-1);
  const acceptedForPeriod1Locus = input.status === "period1-converged";
  const period2Branches =
    input.status === "period2-suspect" &&
    input.previousPeriod2BranchSteps !== null
      ? period2BranchMeasurements(
          input.previousPeriod2BranchSteps.map(({ sample }) => sample),
          samples,
        )
      : null;
  const lvPressureVolumeObservation =
    metrics !== null &&
    metrics.endDiastolic !== null &&
    metrics.endSystolic !== null
      ? Object.freeze({
          endDiastolic: Object.freeze({
            volumeMl: metrics.endDiastolic.volumeMl,
            transmuralPressureMmHg: metrics.endDiastolic.pressureTransmuralMmHg,
          }),
          endSystolic: Object.freeze({
            volumeMl: metrics.endSystolic.volumeMl,
            transmuralPressureMmHg: metrics.endSystolic.pressureTransmuralMmHg,
          }),
          strokeWorkMmHgMl: metrics.strokeWorkMmHgMl,
          eventStatus:
            metrics.endDiastolic.volumeMl - metrics.endSystolic.volumeMl > 1
              ? ("complete" as const)
              : ("non-ejecting-beat" as const),
          evidenceRole: "tbv-operating-point-observation-only" as const,
          crossPointFitEligible: false as const,
        })
      : null;
  return Object.freeze({
    targetScale: input.targetScale,
    fixedTotalBloodVolumeMl: input.fixedTotalBloodVolumeMl,
    status: input.status,
    acceptedForPeriod1Locus,
    completedBeatCount: input.completedBeatCount,
    meanRapTransmuralMmHg: metrics?.meanRapTransmuralMmHg ?? null,
    meanLapTransmuralMmHg: metrics?.meanLapTransmuralMmHg ?? null,
    netCardiacOutputLMin: metrics?.netCardiacOutputLMin ?? null,
    forwardCardiacOutputLMin: metrics?.forwardCardiacOutputLMin ?? null,
    lvEndDiastolicVolumeMl: metrics?.endDiastolic?.volumeMl ?? null,
    lvEndSystolicVolumeMl: metrics?.endSystolic?.volumeMl ?? null,
    lvStrokeWorkMmHgMl: metrics?.strokeWorkMmHgMl ?? null,
    lvPressureVolumeObservation,
    latestPeriod1MaximumNormalizedDelta:
      latest?.period1?.overall.maximumNormalizedDelta ?? null,
    latestPeriod2MaximumNormalizedDelta:
      latest?.period2?.overall.maximumNormalizedDelta ?? null,
    period2Branches,
    failureReason: input.failureReason,
  });
}

function emptyPreloadPoint(
  targetScale: number,
  fixedTotalBloodVolumeMl: number,
  status: "step-failure",
  failureReason: string,
  completedBeatCount = 0,
): MainWireScientificPreloadOperatingPointV1 {
  return Object.freeze({
    targetScale,
    fixedTotalBloodVolumeMl,
    status,
    acceptedForPeriod1Locus: false,
    completedBeatCount,
    meanRapTransmuralMmHg: null,
    meanLapTransmuralMmHg: null,
    netCardiacOutputLMin: null,
    forwardCardiacOutputLMin: null,
    lvEndDiastolicVolumeMl: null,
    lvEndSystolicVolumeMl: null,
    lvStrokeWorkMmHgMl: null,
    lvPressureVolumeObservation: null,
    latestPeriod1MaximumNormalizedDelta: null,
    latestPeriod2MaximumNormalizedDelta: null,
    period2Branches: null,
    failureReason,
  });
}

function period2BranchMeasurements(
  firstSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  secondSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): readonly [
  MainWireScientificPreloadBranchMeasurementV1,
  MainWireScientificPreloadBranchMeasurementV1,
] {
  const candidates = [
    beatMetrics(firstSamples),
    beatMetrics(secondSamples),
  ].sort((left, right) => right.strokeWorkMmHgMl - left.strokeWorkMmHgMl);
  const branch = (
    branchId: "strong" | "weak",
    metrics: ReturnType<typeof beatMetrics>,
  ): MainWireScientificPreloadBranchMeasurementV1 =>
    Object.freeze({
      branchId,
      meanRapTransmuralMmHg: metrics.meanRapTransmuralMmHg,
      meanLapTransmuralMmHg: metrics.meanLapTransmuralMmHg,
      netCardiacOutputLMin: metrics.netCardiacOutputLMin,
      lvEndDiastolicVolumeMl: metrics.endDiastolic?.volumeMl ?? null,
      lvEndSystolicVolumeMl: metrics.endSystolic?.volumeMl ?? null,
      lvStrokeWorkMmHgMl: metrics.strokeWorkMmHgMl,
    });
  return Object.freeze([
    branch("strong", candidates[0]!),
    branch("weak", candidates[1]!),
  ]);
}

function preloadOperatingPointForAnalysis(
  point: MainWireScientificPreloadOperatingPointV1,
  identifiedPointId?: string,
): MainWireScientificHemodynamicOperatingPointV1 {
  const common = {
    pointId: identifiedPointId ?? `tbv-${point.targetScale.toFixed(3)}`,
    protocolKind: "tbv-preload-operating-locus" as const,
    role:
      point.targetScale === 1
        ? ("baseline" as const)
        : ("operating-locus" as const),
    totalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
  };
  if (point.status === "period1-converged") {
    return Object.freeze({
      ...common,
      periodicity: "P1" as const,
      measurement: preloadAnalysisMeasurement(point),
    });
  }
  if (point.status === "period2-suspect" && point.period2Branches !== null) {
    return Object.freeze({
      ...common,
      periodicity: "P2" as const,
      branches: Object.freeze(
        point.period2Branches.map((branch) =>
          Object.freeze({
            branchId: branch.branchId,
            measurement: branchAnalysisMeasurement(branch),
          }),
        ),
      ) as readonly [
        Readonly<{
          branchId: "strong";
          measurement: MainWireScientificHemodynamicMeasurementV1;
        }>,
        Readonly<{
          branchId: "weak";
          measurement: MainWireScientificHemodynamicMeasurementV1;
        }>,
      ],
    });
  }
  return Object.freeze({
    ...common,
    periodicity: "failure" as const,
    failureReason: point.failureReason ?? `point status ${point.status}`,
  });
}

function preloadAnalysisMeasurement(
  point: MainWireScientificPreloadOperatingPointV1,
): MainWireScientificHemodynamicMeasurementV1 {
  return Object.freeze({
    meanRightAtrialTransmuralPressureMmHg:
      point.meanRapTransmuralMmHg ?? Number.NaN,
    meanLeftAtrialTransmuralPressureMmHg:
      point.meanLapTransmuralMmHg ?? Number.NaN,
    cardiacOutputLPerMin: point.netCardiacOutputLMin ?? Number.NaN,
    lvPressureVolume: null,
    quality: Object.freeze({
      lvEventStatus: "ambiguous-valve-event" as const,
      totalBloodVolumeAbsoluteErrorMl: 0,
      maximumContinuityAbsoluteResidualMl: 0,
    }),
  });
}

function branchAnalysisMeasurement(
  branch: MainWireScientificPreloadBranchMeasurementV1,
): MainWireScientificHemodynamicMeasurementV1 {
  return Object.freeze({
    meanRightAtrialTransmuralPressureMmHg: branch.meanRapTransmuralMmHg,
    meanLeftAtrialTransmuralPressureMmHg: branch.meanLapTransmuralMmHg,
    cardiacOutputLPerMin: branch.netCardiacOutputLMin,
    lvPressureVolume: null,
    quality: Object.freeze({
      lvEventStatus: "ambiguous-valve-event" as const,
      totalBloodVolumeAbsoluteErrorMl: 0,
      maximumContinuityAbsoluteResidualMl: 0,
    }),
  });
}

function beatMetrics(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
) {
  const eventPoints = extractEndDiastolicAndEndSystolic(samples);
  const netAorticVolumeMl = trapezoidIntegral(
    samples.map((sample) => sample.flowMlPerSec.AoV),
    DT_SEC,
  );
  const forwardAorticVolumeMl = trapezoidIntegral(
    samples.map((sample) => Math.max(0, sample.flowMlPerSec.AoV)),
    DT_SEC,
  );
  return Object.freeze({
    meanRapTransmuralMmHg: mean(
      samples.map((sample) => sample.chamberTransmuralPressureMmHg.RA),
    ),
    meanLapTransmuralMmHg: mean(
      samples.map((sample) => sample.chamberTransmuralPressureMmHg.LA),
    ),
    netCardiacOutputLMin: (netAorticVolumeMl * 60) / 1000,
    forwardCardiacOutputLMin: (forwardAorticVolumeMl * 60) / 1000,
    endDiastolic: eventPoints.endDiastolic,
    endSystolic: eventPoints.endSystolic,
    strokeWorkMmHgMl: strokeWork(samples),
  });
}

function extractEndDiastolicAndEndSystolic(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): Readonly<{
  endDiastolic: Readonly<{
    volumeMl: number;
    pressureTransmuralMmHg: number;
  }> | null;
  endSystolic: Readonly<{
    volumeMl: number;
    pressureTransmuralMmHg: number;
  }> | null;
}> {
  const aorticThresholdMlPerSec = 1;
  const mitralThresholdMlPerSec = 1;
  const aorticOpenIndex = samples.findIndex(
    (sample, index) =>
      index > 0 &&
      sample.flowMlPerSec.AoV > aorticThresholdMlPerSec &&
      samples[index - 1]!.flowMlPerSec.AoV <= aorticThresholdMlPerSec,
  );
  if (aorticOpenIndex < 1) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const preAorticOpening = samples.slice(0, aorticOpenIndex);
  const maximumPreAorticVolumeMl = Math.max(
    ...preAorticOpening.map((sample) => sample.nodeVolumeMl.LV),
  );
  // At a competent-valve isovolumic onset, LV volume is already at its
  // maximum while both valve flows are negligible in either direction. Choose the first
  // such sample so the ED pressure is not contaminated by the later
  // isovolumic pressure rise. In regurgitant/non-isovolumic cases this gate can
  // fail closed instead of inventing an ED anchor.
  const edIndex = preAorticOpening.findIndex(
    (sample) =>
      Math.abs(sample.flowMlPerSec.MV) <= mitralThresholdMlPerSec &&
      Math.abs(sample.flowMlPerSec.AoV) <= aorticThresholdMlPerSec &&
      sample.nodeVolumeMl.LV >= maximumPreAorticVolumeMl - 0.05,
  );
  if (edIndex < 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  let aorticCloseIndex = -1;
  for (let index = aorticOpenIndex + 1; index < samples.length; index += 1) {
    if (
      samples[index - 1]!.flowMlPerSec.AoV > aorticThresholdMlPerSec &&
      samples[index]!.flowMlPerSec.AoV <= aorticThresholdMlPerSec
    ) {
      aorticCloseIndex = index;
      break;
    }
  }
  if (aorticCloseIndex < 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const ed = samples[edIndex]!;
  const es = samples[aorticCloseIndex]!;
  return Object.freeze({
    endDiastolic: Object.freeze({
      volumeMl: ed.nodeVolumeMl.LV,
      pressureTransmuralMmHg: ed.chamberTransmuralPressureMmHg.LV,
    }),
    endSystolic: Object.freeze({
      volumeMl: es.nodeVolumeMl.LV,
      pressureTransmuralMmHg: es.chamberTransmuralPressureMmHg.LV,
    }),
  });
}

function strokeWork(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): number {
  if (samples.length < 2) return 0;
  let integral = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    integral +=
      0.5 *
      (previous.chamberTransmuralPressureMmHg.LV +
        current.chamberTransmuralPressureMmHg.LV) *
      (current.nodeVolumeMl.LV - previous.nodeVolumeMl.LV);
  }
  const first = samples[0]!;
  const last = samples.at(-1)!;
  integral +=
    0.5 *
    (last.chamberTransmuralPressureMmHg.LV +
      first.chamberTransmuralPressureMmHg.LV) *
    (first.nodeVolumeMl.LV - last.nodeVolumeMl.LV);
  return Math.max(0, -integral);
}

function vascularFunctionResult(
  snapshot: VascularReturnSnapshot,
  pressureReferenceOffsetMmHg: number,
): MainWireScientificVascularFunctionCurveV1 {
  const fillingPressureAbsoluteMmHg = solveFillingPressureAbs(snapshot);
  const xMinAbsolute = pressureReferenceOffsetMmHg - 8;
  const xMaxAbsolute = Math.max(
    xMinAbsolute + 4,
    fillingPressureAbsoluteMmHg + 2,
  );
  const xGrid = Array.from(
    { length: 33 },
    (_, index) => xMinAbsolute + ((xMaxAbsolute - xMinAbsolute) * index) / 32,
  );
  const curve = buildVolumeConstrainedGuytonCurve(snapshot, xGrid);
  return Object.freeze({
    side: snapshot.side,
    xSemantics:
      snapshot.side === "right"
        ? ("mean-transmural-right-atrial-pressure-cvp-model-equivalent" as const)
        : ("mean-transmural-left-atrial-pressure-pcwp-surrogate" as const),
    ySemantics:
      snapshot.side === "right"
        ? ("systemic-venous-return-l-per-min" as const)
        : ("pulmonary-venous-return-l-per-min" as const),
    pressureReferenceOffsetMmHg,
    fillingPressureAbsoluteMmHg,
    fillingPressureTransmuralMmHg:
      fillingPressureAbsoluteMmHg - pressureReferenceOffsetMmHg,
    points: Object.freeze(
      curve.points.map((point) =>
        Object.freeze({
          pressureTransmuralMmHg: point.x - pressureReferenceOffsetMmHg,
          flowLMin: point.y,
        }),
      ),
    ),
  });
}

function meanVascularSnapshot(
  side: "right" | "left",
  steps: readonly ProtocolStep[],
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): VascularReturnSnapshot {
  const graph = buildNonCoronaryCirculationGraphV1();
  const snapshots = steps.map(({ state, sample }) =>
    instantaneousVascularSnapshot(side, state, sample, runtime, graph),
  );
  if (snapshots.length === 0) {
    throw new Error("vascular protocol collected no accepted samples");
  }
  const first = snapshots[0]!;
  const nodes = first.nodesDownstreamToUpstream.map((node, index) => {
    const values = snapshots.map(
      (snapshot) => snapshot.nodesDownstreamToUpstream[index]!,
    );
    return Object.freeze({
      ...node,
      Pabs: mean(values.map((value) => value.Pabs)),
      Ptm: mean(values.map((value) => value.Ptm)),
      Pext: mean(values.map((value) => value.Pext)),
      volumeMl: mean(values.map((value) => value.volumeMl)),
      unstressedVolumeMl: mean(values.map((value) => value.unstressedVolumeMl)),
      stressedVolumeMl: mean(values.map((value) => value.stressedVolumeMl)),
      complianceEffMlPerMmHg: mean(
        values.map((value) => value.complianceEffMlPerMmHg),
      ),
    });
  });
  const edges = first.edgesDownstreamToUpstream.map((edge, index) => {
    const values = snapshots.map(
      (snapshot) => snapshot.edgesDownstreamToUpstream[index]!,
    );
    return Object.freeze({
      ...edge,
      R_mmHg_s_per_mL: mean(values.map((value) => value.R_mmHg_s_per_mL)),
      B_mmHg_s2_per_mL2: mean(values.map((value) => value.B_mmHg_s2_per_mL2)),
      Pext: mean(values.map((value) => value.Pext)),
    });
  });
  const totalComplianceMlPerMmHg = nodes.reduce(
    (sum, node) => sum + node.complianceEffMlPerMmHg,
    0,
  );
  return {
    side,
    downstreamNode: side === "right" ? "RA" : "LA",
    nodesDownstreamToUpstream: nodes as VascularNodeSnapshot[],
    edgesDownstreamToUpstream: edges as VascularEdgeSnapshot[],
    totalStressedVolumeMl: nodes.reduce(
      (sum, node) => sum + node.stressedVolumeMl,
      0,
    ),
    totalUnstressedVolumeMl: nodes.reduce(
      (sum, node) => sum + node.unstressedVolumeMl,
      0,
    ),
    totalComplianceMlPerMmHg,
    externalPressureWeightedMmHg:
      totalComplianceMlPerMmHg > 1e-9
        ? nodes.reduce(
            (sum, node) => sum + node.complianceEffMlPerMmHg * node.Pext,
            0,
          ) / totalComplianceMlPerMmHg
        : 0,
    mode: "cycle-mean" as const,
    sampleCount: snapshots.length,
    durationSeconds: 1,
  };
}

function instantaneousVascularSnapshot(
  side: "right" | "left",
  state: AcceptedState,
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  graph: ReturnType<typeof buildNonCoronaryCirculationGraphV1>,
): VascularReturnSnapshot {
  const nodePath =
    side === "right"
      ? (["VC", "SV", "Cap", "Art", "SA", "Ao"] as const)
      : (["PVein", "PVen", "PCap"] as const);
  const edgePath =
    side === "right"
      ? (["VC_RA", "SV_VC", "Cap_SV", "Art_Cap", "SA_Art", "Ao_SA"] as const)
      : (["PVein_LA", "PVen_PVein", "PCap_PVen"] as const);
  const absolutePressure = (nodeName: NonCoronaryNodeNameV1): number => {
    if (
      nodeName === "LA" ||
      nodeName === "LV" ||
      nodeName === "RA" ||
      nodeName === "RV"
    ) {
      return sample.nodeAbsolutePressureMmHg[nodeName];
    }
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const ptm = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      state.circulation.nodeVolumesMl[nodeName],
      runtime.vascular,
      "adaptive-volume-tolerance",
    );
    return (
      ptm +
      respiratoryExternalPressureForKindV1(
        respiratoryKind(node.ext),
        sample.timeSec,
        runtime.respiratory,
      )
    );
  };
  const nodes = nodePath.map((nodeName): VascularNodeSnapshot => {
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    if (
      node.kind !== "arterial" &&
      node.kind !== "linear" &&
      node.kind !== "venousPressure"
    ) {
      throw new Error(`${nodeName} is not a vascular return node`);
    }
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const volumeMl = state.circulation.nodeVolumesMl[nodeName];
    const unstressedVolumeMl = effectiveUnstressedVolumeFromNodeV1(
      node,
      runtime.vascular,
    );
    const pext = respiratoryExternalPressureForKindV1(
      respiratoryKind(node.ext),
      sample.timeSec,
      runtime.respiratory,
    );
    const pabs = absolutePressure(nodeName);
    const ptm = pabs - pext;
    return Object.freeze({
      name: nodeName,
      kind: node.kind,
      Pabs: pabs,
      Ptm: ptm,
      Pext: pext,
      volumeMl,
      unstressedVolumeMl,
      stressedVolumeMl: volumeMl - unstressedVolumeMl,
      complianceEffMlPerMmHg: complianceFromPtm(law, ptm),
      law,
    });
  });
  const edges = edgePath.map((edgeName): VascularEdgeSnapshot => {
    const edge = graph.edges[graph.edgeIndex.get(edgeName)!]!;
    if (edge.kind === "valve") {
      throw new Error(`${edgeName} is not a vascular return resistance edge`);
    }
    const upstreamPressureMmHg = absolutePressure(
      edge.up as NonCoronaryNodeNameV1,
    );
    const downstreamPressureMmHg = absolutePressure(
      edge.down as NonCoronaryNodeNameV1,
    );
    const pext = respiratoryExternalPressureForKindV1(
      respiratoryKind(edge.ext),
      sample.timeSec,
      runtime.respiratory,
    );
    const losses = nonValveEdgeLossV1({
      edge,
      params: runtime.losses,
      upstreamPressureMmHg,
      downstreamPressureMmHg,
      edgeExternalPressureMmHg: pext,
    });
    return Object.freeze({
      name: edgeName,
      up: edge.up,
      down: edge.down,
      R_mmHg_s_per_mL: losses.resistanceMmHgSecPerMl,
      B_mmHg_s2_per_mL2: losses.quadraticLossMmHgSec2PerMl2,
      waterfall: Boolean(edge.waterfall),
      Pext: pext,
      Pcrit: edge.Pcrit ?? 0,
    });
  });
  const totalComplianceMlPerMmHg = nodes.reduce(
    (sum, node) => sum + node.complianceEffMlPerMmHg,
    0,
  );
  return {
    side,
    downstreamNode: side === "right" ? "RA" : "LA",
    nodesDownstreamToUpstream: nodes,
    edgesDownstreamToUpstream: edges,
    totalStressedVolumeMl: nodes.reduce(
      (sum, node) => sum + node.stressedVolumeMl,
      0,
    ),
    totalUnstressedVolumeMl: nodes.reduce(
      (sum, node) => sum + node.unstressedVolumeMl,
      0,
    ),
    totalComplianceMlPerMmHg,
    externalPressureWeightedMmHg:
      totalComplianceMlPerMmHg > 1e-9
        ? nodes.reduce(
            (sum, node) => sum + node.complianceEffMlPerMmHg * node.Pext,
            0,
          ) / totalComplianceMlPerMmHg
        : 0,
    mode: "instant" as const,
    sampleCount: 1,
    durationSeconds: 0,
  };
}

function classifyProtocolPeriodicity(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
) {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  return classifyMainWireFiveWallPeriodicityV1(observations, {
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

function sourceIdentity(
  state: AcceptedState,
): MainWireScientificProtocolSourceIdentityV1 {
  return Object.freeze({
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    fixedTotalBloodVolumeMl: state.circulation.totalBloodVolumeMl,
  });
}

function trapezoidIntegral(values: readonly number[], dtSec: number): number {
  let total = 0;
  for (let index = 1; index < values.length; index += 1) {
    total += 0.5 * (values[index - 1]! + values[index]!) * dtSec;
  }
  return total;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function respiratoryKind(
  ext: NodeSpec["ext"] | EdgeSpec["ext"],
): "none" | "pth" | "palv" {
  if (ext === undefined || ext === "none") return "none";
  if (ext === "pth" || ext === "palv") return ext;
  throw new Error(`external-pressure kind ${ext} is outside noncoronary scope`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

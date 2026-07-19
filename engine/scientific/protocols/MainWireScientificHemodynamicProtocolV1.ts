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
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationStatusV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  analyzeMainWireScientificLvPressureVolumeProtocolV1,
  buildMainWireScientificPreloadOperatingLocusV1,
  type MainWireScientificHemodynamicMeasurementV1,
  type MainWireScientificHemodynamicOperatingPointV1,
  type MainWireScientificLvPressureVolumeAnalysisV1,
  type MainWireScientificPreloadOperatingLocusV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import {
  complianceFromPtm,
  stressedVolumeFromPtm,
} from "@/engine/vascularPv";

export const MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V1_ID =
  "main-wire-scientific-guyton-starling-protocol-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V1_ID =
  "main-wire-scientific-pv-relations-protocol-v1" as const;

const DT_SEC = 0.002;
const STEPS_PER_BEAT = 500;
const PRELOAD_TARGET_SCALES = Object.freeze([0.9, 0.95, 1, 1.05, 1.1]);
const MAXIMUM_SETTLING_BEATS =
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount;
const IVC_PROTOCOL_BEATS = 8;
const IVC_MAXIMUM_RESISTANCE_SCALE = 64;
const PV_OUTPUT_STRIDE = 5;

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
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
  period2Branches: readonly [
    MainWireScientificPreloadBranchMeasurementV1,
    MainWireScientificPreloadBranchMeasurementV1,
  ] | null;
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
    | "systemic-venous-return-l-per-min"
    | "pulmonary-venous-return-l-per-min";
  pressureReferenceOffsetMmHg: number;
  fillingPressureAbsoluteMmHg: number;
  fillingPressureTransmuralMmHg: number;
  points: readonly Readonly<{ pressureTransmuralMmHg: number; flowLMin: number }>[];
}>;

export type MainWireScientificGuytonStarlingProtocolResultV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V1_ID;
  protocolVersion: "1.0.0";
  source: MainWireScientificProtocolSourceIdentityV1;
  claim: Readonly<{
    totalBloodVolumeSweepIsOneDimensionalPreloadOperatingLocus: true;
    totalBloodVolumeSweepIsNotGuytonPumpExperiment: true;
    totalBloodVolumeSweepIsNotEspvrOrEdpvr: true;
    vascularCurveMethod:
      "cycle-mean-fixed-volume-vascular-pv-law-volume-constrained";
    preloadInitialization:
      "independent-source-state-fork-shared-SV-VC-transmural-offset";
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
}>;

export type MainWireScientificPvProtocolSampleV1 = Readonly<{
  phase01: number;
  lvVolumeMl: number;
  lvTransmuralPressureMmHg: number;
}>;

export type MainWireScientificPvProtocolBeatV1 = Readonly<{
  beatIndex: number;
  vcRaResistanceScaleEnd: number;
  fixedTotalBloodVolumeMl: number;
  samples: readonly MainWireScientificPvProtocolSampleV1[];
  endDiastolic: Readonly<{ volumeMl: number; pressureTransmuralMmHg: number }> | null;
  endSystolic: Readonly<{ volumeMl: number; pressureTransmuralMmHg: number }> | null;
  strokeWorkMmHgMl: number;
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
  netCardiacOutputLMin: number;
  totalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  classification:
    | "fit-eligible"
    | "alternans-suspect-high"
    | "alternans-suspect-low"
    | "rejected";
  valid: boolean;
  rejectionReason: string | null;
}>;

export type MainWireScientificPvRelationsProtocolResultV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V1_ID;
  protocolVersion: "1.0.0";
  source: MainWireScientificProtocolSourceIdentityV1;
  claim: Readonly<{
    intervention:
      "fixed-TBV-transient-graded-VC_RA-resistance-ramp";
    pressureSemantics: "LV-transmural-pressure";
    endDiastoleEvent:
      "maximum-volume-low-forward-flow-surrogate-before-aortic-opening";
    endSystoleEvent: "aortic-closure";
    edpvrReference:
      "Klotz-2006-informed-V0-prior-plus-multibeat-exponential-envelope-fit";
    fitPointSelection:
      "baseline-plus-monotonic-EDV-reduction-at-least-max-0.5mL-or-1-percent-of-baseline";
    sourceSessionMutated: false;
    alternansSuspectBeatsAveragedIntoFits: false;
    fitOwnedByAnalysisLayer: true;
  }>;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  rampBeats: readonly MainWireScientificPvProtocolBeatV1[];
  edpvrReference: Readonly<{
    method: "Klotz-2006-single-beat-V0-prior";
    baselineEndDiastolicVolumeMl: number;
    baselineEndDiastolicTransmuralPressureMmHg: number;
    referenceVolumeMl: number;
    referencePressureMmHg: 0;
    fitRelation:
      "Ped_tm=P0+alpha*(exp(beta*(Ved-Vref))-1)";
    interpretation:
      "literature-informed-reference-for-operating-envelope-not-passive-material-identification";
  }>;
  fitPointSelection: Readonly<{
    policy:
      "baseline-plus-monotonic-EDV-reduction-at-least-max-0.5mL-or-1-percent-of-baseline";
    minimumEdvSeparationMl: number;
    includedBeatIds: readonly string[];
    excludedRedundantBeatIds: readonly string[];
  }>;
  analysis: MainWireScientificLvPressureVolumeAnalysisV1;
  recovery: Readonly<{
    completedBeatCount: number;
    status: MainWireFiveWallPeriodicClassificationStatusV1 | "maximum-beats-reached";
    latestPeriod1MaximumNormalizedDelta: number | null;
    maximumRelativeBaselineStateDelta: number;
  }>;
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
      ));
  const preloadOperatingLocus = buildMainWireScientificPreloadOperatingLocusV1(
    preloadOperatingPoints.map((point) =>
      preloadOperatingPointForAnalysis(point)),
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
    baselineClosure.overall.maximumNormalizedDelta
        <= MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
          .period1NormalizedTolerance
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
  const meanOffset = mean(baseline.steps.map(({ sample }) =>
    sample.nodeAbsolutePressureMmHg.RA
      - sample.chamberTransmuralPressureMmHg.RA));
  const meanLeftOffset = mean(baseline.steps.map(({ sample }) =>
    sample.nodeAbsolutePressureMmHg.LA
      - sample.chamberTransmuralPressureMmHg.LA));
  const baselinePoint = preloadPointFromSettledBeat({
    targetScale: 1,
    fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
    status: baselinePeriodicity,
    completedBeatCount: 1,
    closureObservations: [],
    steps: baseline.steps,
    previousPeriod2BranchSteps: null,
    failureReason: baselinePeriodicity === "period1-converged"
      ? null
      : "source session did not reproduce a period-1 beat",
  });
  return Object.freeze({
    source,
    baselinePeriodicity,
    rightVascularFunction: vascularFunctionResult(rightSnapshot, meanOffset),
    leftVascularFunction: vascularFunctionResult(
      leftSnapshot,
      meanLeftOffset,
    ),
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
      preloadOperatingPointForAnalysis(point, pointId)),
  );
}

export function runMainWireScientificPvRelationsProtocolV1(
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1,
  sourceState: AcceptedState,
): MainWireScientificPvRelationsProtocolResultV1 {
  const baseline = runProtocolBeat(dependencies, sourceState, () => 1);
  const baselineClosure = compareMainWireFiveWallAcceptedStatesV1(
    baseline.state,
    sourceState,
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  );
  const baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1 =
    baselineClosure.overall.maximumNormalizedDelta
        <= MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
          .period1NormalizedTolerance
      ? "period1-converged"
      : "not-converged";
  const rampBeatsUnclassified: MainWireScientificPvProtocolBeatV1[] = [
    pvBeatFromSteps(0, 1, baseline.steps, sourceState.circulation.totalBloodVolumeMl),
  ];
  let state = baseline.state;
  for (let beatIndex = 1; beatIndex < IVC_PROTOCOL_BEATS; beatIndex += 1) {
    const startProgress = (beatIndex - 1) / (IVC_PROTOCOL_BEATS - 1);
    const endProgress = beatIndex / (IVC_PROTOCOL_BEATS - 1);
    const beat = runProtocolBeat(dependencies, state, (phase01) => {
      const progress = startProgress
        + (endProgress - startProgress) * smoothRamp01(phase01);
      return Math.exp(Math.log(IVC_MAXIMUM_RESISTANCE_SCALE) * progress);
    });
    state = beat.state;
    rampBeatsUnclassified.push(pvBeatFromSteps(
      beatIndex,
      Math.exp(Math.log(IVC_MAXIMUM_RESISTANCE_SCALE) * endProgress),
      beat.steps,
      sourceState.circulation.totalBloodVolumeMl,
    ));
  }
  const baselineGatedBeats = baselinePeriodicity === "period1-converged"
    ? rampBeatsUnclassified
    : rampBeatsUnclassified.map((beat) => beat.beatIndex === 0
      ? Object.freeze({
        ...beat,
        classification: "rejected" as const,
        valid: false,
        rejectionReason:
          `source baseline did not reproduce period-1 closure (${baselinePeriodicity})`,
      })
      : beat);
  const rampBeats = classifyRampAlternansSuspect(baselineGatedBeats);
  const fitPointSelection = selectPvProtocolFitPoints(rampBeats);
  const analysisPoints = pvProtocolOperatingPointsForAnalysis(
    rampBeats,
    new Set(fitPointSelection.includedBeatIds),
    baselinePeriodicity,
  );
  const edpvrReference = klotzInformedEdpvrReference(rampBeats[0]!);
  const analysis = analyzeMainWireScientificLvPressureVolumeProtocolV1({
    points: analysisPoints,
    edpvrReference: Object.freeze({
      referenceVolumeMl: edpvrReference.referenceVolumeMl,
      referencePressureMmHg: edpvrReference.referencePressureMmHg,
    }),
  });

  let recoveryState = state;
  const recoveryObservations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  let recoveryStatus: MainWireFiveWallPeriodicClassificationStatusV1 =
    "not-converged";
  let previous = recoveryState;
  let previous2: AcceptedState | null = null;
  let recoveryBeatCount = 0;
  for (; recoveryBeatCount < 12; recoveryBeatCount += 1) {
    const recovered = runProtocolBeat(dependencies, recoveryState, () => 1);
    recoveryState = recovered.state;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      recoveryState,
      previous,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = previous2 === null ? null
      : compareMainWireFiveWallAcceptedStatesV1(
        recoveryState,
        previous2,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      );
    recoveryObservations.push(Object.freeze({
      beatIndex: recoveryBeatCount + 1,
      period1,
      period2,
    }));
    const classification = classifyProtocolPeriodicity(recoveryObservations);
    recoveryStatus = classification.status;
    previous2 = previous;
    previous = recoveryState;
    if (recoveryStatus === "period1-converged") {
      recoveryBeatCount += 1;
      break;
    }
  }
  const recoveryVsBaseline = compareMainWireFiveWallAcceptedStatesV1(
    recoveryState,
    sourceState,
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  );
  const latestRecovery = recoveryObservations.at(-1);
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V1_ID,
    protocolVersion: "1.0.0" as const,
    source: sourceIdentity(sourceState),
    claim: Object.freeze({
      intervention:
        "fixed-TBV-transient-graded-VC_RA-resistance-ramp" as const,
      pressureSemantics: "LV-transmural-pressure" as const,
      endDiastoleEvent:
        "maximum-volume-low-forward-flow-surrogate-before-aortic-opening" as const,
      endSystoleEvent: "aortic-closure" as const,
      edpvrReference:
        "Klotz-2006-informed-V0-prior-plus-multibeat-exponential-envelope-fit" as const,
      fitPointSelection:
        "baseline-plus-monotonic-EDV-reduction-at-least-max-0.5mL-or-1-percent-of-baseline" as const,
      sourceSessionMutated: false as const,
      alternansSuspectBeatsAveragedIntoFits: false as const,
      fitOwnedByAnalysisLayer: true as const,
    }),
    baselinePeriodicity,
    rampBeats: Object.freeze(rampBeats),
    edpvrReference,
    fitPointSelection,
    analysis,
    recovery: Object.freeze({
      completedBeatCount: recoveryBeatCount,
      status: recoveryStatus === "not-converged" && recoveryBeatCount >= 12
        ? "maximum-beats-reached" as const
        : recoveryStatus,
      latestPeriod1MaximumNormalizedDelta:
        latestRecovery?.period1?.overall.maximumNormalizedDelta ?? null,
      maximumRelativeBaselineStateDelta:
        recoveryVsBaseline.overall.maximumNormalizedDelta,
    }),
  });
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
): MainWireScientificSettledPreloadPointV2 {
  let state: AcceptedState;
  try {
    state = forkAcceptedStateAtFixedBloodVolume(
      seedState,
      dependencies.runtime,
      targetTbvMl,
    );
  } catch (error) {
    return Object.freeze({
      point: emptyPreloadPoint(
        targetScale,
        targetTbvMl,
        "step-failure",
        errorMessage(error),
      ),
      continuationSeedState: null,
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
    const captureDiagnostics = beatIndex === MAXIMUM_SETTLING_BEATS
      || shouldCapturePreloadSettlingBeat(closureObservations);
    let beat;
    try {
      beat = runProtocolBeat(
        dependencies,
        state,
        () => 1,
        captureDiagnostics,
      );
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
      });
    }
    state = beat.state;
    terminalSteps = beat.steps;
    previousTerminalSteps = immediatelyPreviousCapturedSteps;
    immediatelyPreviousCapturedSteps = terminalSteps.length > 0
      ? terminalSteps
      : null;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      state,
      previous,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = previous2 === null ? null
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
      classification.status === "period1-converged"
      || classification.status === "period2-suspect"
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
        classification.status === "period2-suspect"
        && previousTerminalSteps === null
        && previousBeatStartState !== null
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
        failureReason: classification.status === "period2-suspect"
          ? "period-2-suspect orbit classified; point retained but excluded from P1 locus"
          : null,
      });
      return Object.freeze({
        point,
        continuationSeedState:
          classification.status === "period1-converged" ? state : null,
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
  if (observationSuffixMatches(
    observations,
    period1PredecessorCount,
    (observation) => observation.period1 !== null
      && observation.period1.overall.maximumNormalizedDelta
        <= policy.period1NormalizedTolerance,
  )) return true;

  // Capture one beat earlier for P2 so the immediately preceding strong/weak
  // branch remains available when the next beat completes the evidence suffix.
  const period2PredecessorCount = Math.max(0, policy.consecutiveBeats - 2);
  return observationSuffixMatches(
    observations,
    period2PredecessorCount,
    (observation) => observation.period1 !== null
      && observation.period2 !== null
      && observation.period1.overall.maximumNormalizedDelta
        >= policy.period2MinimumPeriod1NormalizedDelta
      && observation.period2.overall.maximumNormalizedDelta
        <= policy.period2NormalizedTolerance,
  );
}

function observationSuffixMatches(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
  requiredCount: number,
  matches: (observation: MainWireFiveWallPeriodicBeatObservationV1) => boolean,
): boolean {
  if (requiredCount === 0) return true;
  const suffix = observations.slice(-requiredCount);
  return suffix.length === requiredCount
    && suffix.every((observation, index) => matches(observation)
      && (index === 0
        || observation.beatIndex === suffix[index - 1]!.beatIndex + 1));
}

/**
 * Forks a preload target from the supplied same-phase accepted seed. V1 calls
 * this with the source state for independent points; V2 calls it with the
 * preceding P1 terminal state for bidirectional continuation. Only the two
 * systemic venous reservoirs receive or lose volume, with one shared change
 * in transmural pressure under their authoritative nonlinear PV laws.
 * Chamber volumes, Land state, valve memory, root-flow memory, HR, vascular
 * properties, and all model parameters remain unchanged at the fork.
 */
function forkAcceptedStateAtFixedBloodVolume(
  sourceState: AcceptedState,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  targetTbvMl: number,
): AcceptedState {
  if (!(targetTbvMl > 0) || !Number.isFinite(targetTbvMl)) {
    throw new Error("protocol fixed TBV must be positive and finite");
  }
  const sourceTbvMl = sourceState.circulation.totalBloodVolumeMl;
  const targetVenousVolumeDeltaMl = targetTbvMl - sourceTbvMl;
  if (Math.abs(targetVenousVolumeDeltaMl) <= 1e-10) return sourceState;

  const graph = buildNonCoronaryCirculationGraphV1();
  const reservoirs = (["SV", "VC"] as const).map((nodeName) => {
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const sourceVolumeMl = sourceState.circulation.nodeVolumesMl[nodeName];
    const sourcePtmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      sourceVolumeMl,
      runtime.vascular,
      "adaptive-volume-tolerance",
    );
    return Object.freeze({ nodeName, law, sourceVolumeMl, sourcePtmMmHg });
  });
  const changedVolumeMl = (offsetMmHg: number): number => reservoirs.reduce(
    (sum, reservoir) => sum
      + reservoir.law.Vu
      + stressedVolumeFromPtm(
        reservoir.law,
        reservoir.sourcePtmMmHg + offsetMmHg,
      )
      - reservoir.sourceVolumeMl,
    0,
  );
  const residualMl = (offsetMmHg: number): number =>
    changedVolumeMl(offsetMmHg) - targetVenousVolumeDeltaMl;

  let lowerMmHg = -1;
  let upperMmHg = 1;
  for (let expansion = 0; expansion < 32 && residualMl(lowerMmHg) > 0;
    expansion += 1) lowerMmHg *= 2;
  for (let expansion = 0; expansion < 32 && residualMl(upperMmHg) < 0;
    expansion += 1) upperMmHg *= 2;
  if (!(residualMl(lowerMmHg) <= 0 && residualMl(upperMmHg) >= 0)) {
    throw new Error("protocol TBV target is outside the SV/VC PV-law bracket");
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpointMmHg = 0.5 * (lowerMmHg + upperMmHg);
    if (residualMl(midpointMmHg) < 0) lowerMmHg = midpointMmHg;
    else upperMmHg = midpointMmHg;
  }
  const offsetMmHg = 0.5 * (lowerMmHg + upperMmHg);
  const changed = Object.fromEntries(reservoirs.map((reservoir) => [
    reservoir.nodeName,
    reservoir.law.Vu + stressedVolumeFromPtm(
      reservoir.law,
      reservoir.sourcePtmMmHg + offsetMmHg,
    ),
  ])) as Readonly<Record<"SV" | "VC", number>>;
  if (!(changed.SV > 0) || !(changed.VC > 0)) {
    throw new Error("protocol TBV fork produced a non-positive venous volume");
  }
  const nodeVolumesMl = Object.freeze({
    ...sourceState.circulation.nodeVolumesMl,
    SV: changed.SV,
    VC: changed.VC,
  });
  const resolvedTbvMl = Object.values(nodeVolumesMl).reduce(
    (sum, volumeMl) => sum + volumeMl,
    0,
  );
  if (Math.abs(resolvedTbvMl - targetTbvMl) > 1e-6) {
    throw new Error(
      `protocol TBV fork missed target by ${resolvedTbvMl - targetTbvMl} mL`,
    );
  }
  return Object.freeze({
    ...sourceState,
    circulation: Object.freeze({
      ...sourceState.circulation,
      totalBloodVolumeMl: targetTbvMl,
      nodeVolumesMl,
    }),
  });
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
      steps.push(Object.freeze({
        state,
        step: stepped,
        sample: sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
      }));
    }
  }
  return Object.freeze({ state, steps: Object.freeze(steps) });
}

function preloadPointFromSettledBeat(input: Readonly<{
  targetScale: number;
  fixedTotalBloodVolumeMl: number;
  status: MainWireScientificPreloadOperatingPointV1["status"];
  completedBeatCount: number;
  closureObservations: readonly MainWireFiveWallPeriodicBeatObservationV1[];
  steps: readonly ProtocolStep[];
  previousPeriod2BranchSteps: readonly ProtocolStep[] | null;
  failureReason: string | null;
}>): MainWireScientificPreloadOperatingPointV1 {
  const samples = input.steps.map(({ sample }) => sample);
  const metrics = samples.length === 0 ? null : beatMetrics(samples);
  const latest = input.closureObservations.at(-1);
  const acceptedForPeriod1Locus = input.status === "period1-converged";
  const period2Branches = input.status === "period2-suspect"
    && input.previousPeriod2BranchSteps !== null
    ? period2BranchMeasurements(
      input.previousPeriod2BranchSteps.map(({ sample }) => sample),
      samples,
    )
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
  const candidates = [beatMetrics(firstSamples), beatMetrics(secondSamples)]
    .sort((left, right) => right.strokeWorkMmHgMl - left.strokeWorkMmHgMl);
  const branch = (
    branchId: "strong" | "weak",
    metrics: ReturnType<typeof beatMetrics>,
  ): MainWireScientificPreloadBranchMeasurementV1 => Object.freeze({
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
    role: point.targetScale === 1
      ? "baseline" as const
      : "operating-locus" as const,
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
      branches: Object.freeze(point.period2Branches.map((branch) =>
        Object.freeze({
          branchId: branch.branchId,
          measurement: branchAnalysisMeasurement(branch),
        }))) as readonly [
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

function beatMetrics(samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[]) {
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
    meanRapTransmuralMmHg: mean(samples.map((sample) =>
      sample.chamberTransmuralPressureMmHg.RA)),
    meanLapTransmuralMmHg: mean(samples.map((sample) =>
      sample.chamberTransmuralPressureMmHg.LA)),
    netCardiacOutputLMin: netAorticVolumeMl * 60 / 1000,
    forwardCardiacOutputLMin: forwardAorticVolumeMl * 60 / 1000,
    endDiastolic: eventPoints.endDiastolic,
    endSystolic: eventPoints.endSystolic,
    strokeWorkMmHgMl: strokeWork(samples),
  });
}

function pvBeatFromSteps(
  beatIndex: number,
  vcRaResistanceScaleEnd: number,
  steps: readonly ProtocolStep[],
  fixedTotalBloodVolumeMl: number,
): MainWireScientificPvProtocolBeatV1 {
  const samples = steps.map(({ sample }) => sample);
  const events = extractEndDiastolicAndEndSystolic(samples);
  const maximumBloodVolumeErrorMl = steps.reduce(
    (maximum, { sample }) => Math.max(
      maximum,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    ),
    0,
  );
  const maximumContinuityResidualMl = steps.reduce(
    (maximum, { sample }) => Math.max(
      maximum,
      Math.abs(sample.diagnostics.maximumContinuityResidualMl),
    ),
    0,
  );
  const metrics = beatMetrics(samples);
  const valid = events.endDiastolic !== null
    && events.endSystolic !== null
    && maximumBloodVolumeErrorMl <= 1e-6
    && maximumContinuityResidualMl <= 1e-5
    && events.endDiastolic.volumeMl - events.endSystolic.volumeMl > 1
    && metrics.strokeWorkMmHgMl > 0;
  return Object.freeze({
    beatIndex,
    vcRaResistanceScaleEnd,
    fixedTotalBloodVolumeMl,
    samples: Object.freeze(samples
      .filter((_, index) => index % PV_OUTPUT_STRIDE === 0)
      .map((sample) => Object.freeze({
        phase01: sample.cyclePhase01,
        lvVolumeMl: sample.nodeVolumeMl.LV,
        lvTransmuralPressureMmHg:
          sample.chamberTransmuralPressureMmHg.LV,
      }))),
    endDiastolic: events.endDiastolic,
    endSystolic: events.endSystolic,
    strokeWorkMmHgMl: metrics.strokeWorkMmHgMl,
    meanRapTransmuralMmHg: metrics.meanRapTransmuralMmHg,
    meanLapTransmuralMmHg: metrics.meanLapTransmuralMmHg,
    netCardiacOutputLMin: metrics.netCardiacOutputLMin,
    totalBloodVolumeAbsoluteErrorMl: maximumBloodVolumeErrorMl,
    maximumContinuityAbsoluteResidualMl: maximumContinuityResidualMl,
    classification: valid ? "fit-eligible" as const : "rejected" as const,
    valid,
    rejectionReason: valid
      ? null
      : events.endDiastolic === null
        ? "mitral-closure/end-diastolic event was not detected"
        : events.endSystolic === null
          ? "aortic-closure/end-systolic event was not detected"
          : maximumBloodVolumeErrorMl > 1e-6
            ? `fixed-TBV conservation error ${maximumBloodVolumeErrorMl} mL`
            : maximumContinuityResidualMl > 1e-5
              ? `continuity residual ${maximumContinuityResidualMl} mL`
              : "beat did not have positive ejection and positive transmural stroke work",
  });
}

/**
 * Conservative screen for alternating residuals during a changing-load ramp.
 * This cannot establish a period-2 orbit because successive beats have
 * different resistance histories. Suspect beats are therefore labelled as
 * high/low evidence and excluded, never synthesized into a P2 branch.
 */
function classifyRampAlternansSuspect(
  beats: readonly MainWireScientificPvProtocolBeatV1[],
): readonly MainWireScientificPvProtocolBeatV1[] {
  const valid = beats.filter((beat) => beat.valid);
  if (valid.length < 6) return Object.freeze([...beats]);
  const x = valid.map((beat) => beat.beatIndex);
  const y = valid.map((beat) => beat.strokeWorkMmHgMl);
  const meanX = mean(x);
  const meanY = mean(y);
  const denominator = x.reduce((sum, value) =>
    sum + (value - meanX) ** 2, 0);
  const slope = denominator > 0
    ? x.reduce((sum, value, index) =>
      sum + (value - meanX) * (y[index]! - meanY), 0) / denominator
    : 0;
  const residuals = y.map((value, index) =>
    value - (meanY + slope * (x[index]! - meanX)));
  const alternatingTransitions = residuals.slice(1).filter((value, index) =>
    value * residuals[index]! < 0).length;
  const positiveMean = mean(residuals.filter((value) => value > 0));
  const negativeMean = mean(residuals.filter((value) => value < 0));
  const separation = Number.isFinite(positiveMean) && Number.isFinite(negativeMean)
    ? positiveMean - negativeMean
    : 0;
  const baselineWork = Math.max(Math.abs(valid[0]!.strokeWorkMmHgMl), 1);
  const alternans = alternatingTransitions >= residuals.length - 2
    && separation / baselineWork >= 0.02;
  if (!alternans) return Object.freeze([...beats]);
  const residualByBeat = new Map(valid.map((beat, index) =>
    [beat.beatIndex, residuals[index]!] as const));
  return Object.freeze(beats.map((beat) => {
    if (!beat.valid || beat.beatIndex === 0) return beat;
    return Object.freeze({
      ...beat,
      classification: (residualByBeat.get(beat.beatIndex) ?? 0) >= 0
        ? "alternans-suspect-high" as const
        : "alternans-suspect-low" as const,
      rejectionReason:
        "alternating stroke-work residuals during a changing-load ramp; excluded as alternans-suspect, not diagnosed as a period-2 orbit",
    });
  }));
}

function klotzInformedEdpvrReference(
  baselineBeat: MainWireScientificPvProtocolBeatV1,
): MainWireScientificPvRelationsProtocolResultV1["edpvrReference"] {
  const fallback = baselineBeat.samples.reduce((selected, sample) =>
    sample.lvVolumeMl > selected.lvVolumeMl ? sample : selected,
  baselineBeat.samples[0] ?? {
    phase01: 0,
    lvVolumeMl: 1,
    lvTransmuralPressureMmHg: 0,
  });
  const volumeMl = baselineBeat.endDiastolic?.volumeMl
    ?? fallback.lvVolumeMl;
  const pressureMmHg = baselineBeat.endDiastolic?.pressureTransmuralMmHg
    ?? fallback.lvTransmuralPressureMmHg;
  // Klotz et al. estimate the zero-pressure volume as
  // V0 ~= Vm * (0.6 - 0.006 * Pm). Here it is used only to fix the otherwise
  // weakly identified reference coordinate of a separate multi-beat
  // exponential fit; this is not presented as the original single-beat curve.
  const referenceVolumeMl = volumeMl * (0.6 - 0.006 * pressureMmHg);
  return Object.freeze({
    method: "Klotz-2006-single-beat-V0-prior" as const,
    baselineEndDiastolicVolumeMl: volumeMl,
    baselineEndDiastolicTransmuralPressureMmHg: pressureMmHg,
    referenceVolumeMl,
    referencePressureMmHg: 0 as const,
    fitRelation:
      "Ped_tm=P0+alpha*(exp(beta*(Ved-Vref))-1)" as const,
    interpretation:
      "literature-informed-reference-for-operating-envelope-not-passive-material-identification" as const,
  });
}

function selectPvProtocolFitPoints(
  beats: readonly MainWireScientificPvProtocolBeatV1[],
): MainWireScientificPvRelationsProtocolResultV1["fitPointSelection"] {
  const baseline = beats.find((beat) =>
    beat.beatIndex === 0 && beat.valid && beat.endDiastolic !== null);
  const baselineEdvMl = baseline?.endDiastolic?.volumeMl ?? 0;
  const minimumEdvSeparationMl = Math.max(0.5, baselineEdvMl * 0.01);
  const includedBeatIds: string[] = baseline === undefined
    ? []
    : [`ivc-beat-${baseline.beatIndex}`];
  const excludedRedundantBeatIds: string[] = [];
  let lastIncludedEdvMl = baselineEdvMl;
  for (const beat of beats) {
    if (beat.beatIndex === 0 || !beat.valid || beat.endDiastolic === null) continue;
    if (beat.classification !== "fit-eligible") continue;
    const beatId = `ivc-beat-${beat.beatIndex}`;
    if (beat.endDiastolic.volumeMl
        <= lastIncludedEdvMl - minimumEdvSeparationMl) {
      includedBeatIds.push(beatId);
      lastIncludedEdvMl = beat.endDiastolic.volumeMl;
    } else {
      excludedRedundantBeatIds.push(beatId);
    }
  }
  return Object.freeze({
    policy:
      "baseline-plus-monotonic-EDV-reduction-at-least-max-0.5mL-or-1-percent-of-baseline" as const,
    minimumEdvSeparationMl,
    includedBeatIds: Object.freeze(includedBeatIds),
    excludedRedundantBeatIds: Object.freeze(excludedRedundantBeatIds),
  });
}

function pvProtocolOperatingPointsForAnalysis(
  beats: readonly MainWireScientificPvProtocolBeatV1[],
  includedFitEligibleBeatIds: ReadonlySet<string>,
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1,
): readonly MainWireScientificHemodynamicOperatingPointV1[] {
  const points: MainWireScientificHemodynamicOperatingPointV1[] = [];
  for (const beat of beats) {
    const pointId = `ivc-beat-${beat.beatIndex}`;
    if (beat.valid && beat.classification === "fit-eligible"
        && !includedFitEligibleBeatIds.has(pointId)) continue;
    const common = {
      pointId,
      protocolKind: "fixed-tbv-ivc-like-preload-reduction" as const,
      role: beat.beatIndex === 0
        ? "baseline" as const
        : "preload-reduction" as const,
      totalBloodVolumeMl: beat.fixedTotalBloodVolumeMl,
    };
    if (beat.beatIndex === 0 && baselinePeriodicity !== "period1-converged") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason:
          `source baseline did not reproduce period-1 closure (${baselinePeriodicity})`,
      }));
    } else if (!beat.valid || beat.classification === "rejected") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason: beat.rejectionReason ?? "invalid protocol beat",
      }));
    } else if (
      beat.classification === "alternans-suspect-high"
      || beat.classification === "alternans-suspect-low"
    ) {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason: beat.rejectionReason
          ?? "alternans-suspect evidence during changing-load ramp",
      }));
    } else {
      points.push(Object.freeze({
        ...common,
        periodicity: "transient-fit-eligible" as const,
        measurement: pvBeatAnalysisMeasurement(beat),
      }));
    }
  }
  return Object.freeze(points);
}

function pvBeatAnalysisMeasurement(
  beat: MainWireScientificPvProtocolBeatV1,
): MainWireScientificHemodynamicMeasurementV1 {
  const eventStatus = beat.endDiastolic === null
    ? "missing-end-diastolic-event" as const
    : beat.endSystolic === null
      ? "missing-end-systolic-event" as const
      : beat.endDiastolic.volumeMl - beat.endSystolic.volumeMl <= 1
        ? "non-ejecting-beat" as const
        : "complete" as const;
  return Object.freeze({
    meanRightAtrialTransmuralPressureMmHg: beat.meanRapTransmuralMmHg,
    meanLeftAtrialTransmuralPressureMmHg: beat.meanLapTransmuralMmHg,
    cardiacOutputLPerMin: beat.netCardiacOutputLMin,
    lvPressureVolume: beat.endDiastolic !== null && beat.endSystolic !== null
      ? Object.freeze({
        endDiastolicVolumeMl: beat.endDiastolic.volumeMl,
        endDiastolicTransmuralPressureMmHg:
          beat.endDiastolic.pressureTransmuralMmHg,
        endSystolicVolumeMl: beat.endSystolic.volumeMl,
        endSystolicTransmuralPressureMmHg:
          beat.endSystolic.pressureTransmuralMmHg,
        strokeWorkMmHgMl: beat.strokeWorkMmHgMl,
      })
      : null,
    quality: Object.freeze({
      lvEventStatus: eventStatus,
      totalBloodVolumeAbsoluteErrorMl:
        beat.totalBloodVolumeAbsoluteErrorMl,
      maximumContinuityAbsoluteResidualMl:
        beat.maximumContinuityAbsoluteResidualMl,
    }),
  });
}

function extractEndDiastolicAndEndSystolic(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): Readonly<{
  endDiastolic: Readonly<{ volumeMl: number; pressureTransmuralMmHg: number }> | null;
  endSystolic: Readonly<{ volumeMl: number; pressureTransmuralMmHg: number }> | null;
}> {
  const aorticThresholdMlPerSec = 1;
  const mitralThresholdMlPerSec = 1;
  const aorticOpenIndex = samples.findIndex((sample, index) =>
    index > 0
    && sample.flowMlPerSec.AoV > aorticThresholdMlPerSec
    && samples[index - 1]!.flowMlPerSec.AoV <= aorticThresholdMlPerSec);
  if (aorticOpenIndex < 1) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const preAorticOpening = samples.slice(0, aorticOpenIndex);
  const maximumPreAorticVolumeMl = Math.max(...preAorticOpening.map((sample) =>
    sample.nodeVolumeMl.LV));
  // At a competent-valve isovolumic onset, LV volume is already at its
  // maximum while both valve flows are negligible in either direction. Choose the first
  // such sample so the ED pressure is not contaminated by the later
  // isovolumic pressure rise. In regurgitant/non-isovolumic cases this gate can
  // fail closed instead of inventing an ED anchor.
  const edIndex = preAorticOpening.findIndex((sample) =>
    Math.abs(sample.flowMlPerSec.MV) <= mitralThresholdMlPerSec
    && Math.abs(sample.flowMlPerSec.AoV) <= aorticThresholdMlPerSec
    && sample.nodeVolumeMl.LV >= maximumPreAorticVolumeMl - 0.05);
  if (edIndex < 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  let aorticCloseIndex = -1;
  for (let index = aorticOpenIndex + 1; index < samples.length; index += 1) {
    if (
      samples[index - 1]!.flowMlPerSec.AoV > aorticThresholdMlPerSec
      && samples[index]!.flowMlPerSec.AoV <= aorticThresholdMlPerSec
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
    integral += 0.5 * (
      previous.chamberTransmuralPressureMmHg.LV
      + current.chamberTransmuralPressureMmHg.LV
    ) * (current.nodeVolumeMl.LV - previous.nodeVolumeMl.LV);
  }
  const first = samples[0]!;
  const last = samples.at(-1)!;
  integral += 0.5 * (
    last.chamberTransmuralPressureMmHg.LV
    + first.chamberTransmuralPressureMmHg.LV
  ) * (first.nodeVolumeMl.LV - last.nodeVolumeMl.LV);
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
  const xGrid = Array.from({ length: 33 }, (_, index) =>
    xMinAbsolute + (xMaxAbsolute - xMinAbsolute) * index / 32);
  const curve = buildVolumeConstrainedGuytonCurve(snapshot, xGrid);
  return Object.freeze({
    side: snapshot.side,
    xSemantics: snapshot.side === "right"
      ? "mean-transmural-right-atrial-pressure-cvp-model-equivalent" as const
      : "mean-transmural-left-atrial-pressure-pcwp-surrogate" as const,
    ySemantics: snapshot.side === "right"
      ? "systemic-venous-return-l-per-min" as const
      : "pulmonary-venous-return-l-per-min" as const,
    pressureReferenceOffsetMmHg,
    fillingPressureAbsoluteMmHg,
    fillingPressureTransmuralMmHg:
      fillingPressureAbsoluteMmHg - pressureReferenceOffsetMmHg,
    points: Object.freeze(curve.points.map((point) => Object.freeze({
      pressureTransmuralMmHg: point.x - pressureReferenceOffsetMmHg,
      flowLMin: point.y,
    }))),
  });
}

function meanVascularSnapshot(
  side: "right" | "left",
  steps: readonly ProtocolStep[],
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): VascularReturnSnapshot {
  const graph = buildNonCoronaryCirculationGraphV1();
  const snapshots = steps.map(({ state, sample }) =>
    instantaneousVascularSnapshot(side, state, sample, runtime, graph));
  if (snapshots.length === 0) {
    throw new Error("vascular protocol collected no accepted samples");
  }
  const first = snapshots[0]!;
  const nodes = first.nodesDownstreamToUpstream.map((node, index) => {
    const values = snapshots.map((snapshot) =>
      snapshot.nodesDownstreamToUpstream[index]!);
    return Object.freeze({
      ...node,
      Pabs: mean(values.map((value) => value.Pabs)),
      Ptm: mean(values.map((value) => value.Ptm)),
      Pext: mean(values.map((value) => value.Pext)),
      volumeMl: mean(values.map((value) => value.volumeMl)),
      unstressedVolumeMl: mean(values.map((value) => value.unstressedVolumeMl)),
      stressedVolumeMl: mean(values.map((value) => value.stressedVolumeMl)),
      complianceEffMlPerMmHg: mean(values.map((value) =>
        value.complianceEffMlPerMmHg)),
    });
  });
  const edges = first.edgesDownstreamToUpstream.map((edge, index) => {
    const values = snapshots.map((snapshot) =>
      snapshot.edgesDownstreamToUpstream[index]!);
    return Object.freeze({
      ...edge,
      R_mmHg_s_per_mL: mean(values.map((value) => value.R_mmHg_s_per_mL)),
      B_mmHg_s2_per_mL2: mean(values.map((value) => value.B_mmHg_s2_per_mL2)),
      Pext: mean(values.map((value) => value.Pext)),
    });
  });
  const totalComplianceMlPerMmHg = nodes.reduce((sum, node) =>
    sum + node.complianceEffMlPerMmHg, 0);
  return {
    side,
    downstreamNode: side === "right" ? "RA" : "LA",
    nodesDownstreamToUpstream: nodes as VascularNodeSnapshot[],
    edgesDownstreamToUpstream: edges as VascularEdgeSnapshot[],
    totalStressedVolumeMl: nodes.reduce((sum, node) =>
      sum + node.stressedVolumeMl, 0),
    totalUnstressedVolumeMl: nodes.reduce((sum, node) =>
      sum + node.unstressedVolumeMl, 0),
    totalComplianceMlPerMmHg,
    externalPressureWeightedMmHg: totalComplianceMlPerMmHg > 1e-9
      ? nodes.reduce((sum, node) =>
        sum + node.complianceEffMlPerMmHg * node.Pext, 0)
        / totalComplianceMlPerMmHg
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
  const nodePath = side === "right"
    ? (["VC", "SV", "Cap", "Art", "SA", "Ao"] as const)
    : (["PVein", "PVen", "PCap"] as const);
  const edgePath = side === "right"
    ? (["VC_RA", "SV_VC", "Cap_SV", "Art_Cap", "SA_Art", "Ao_SA"] as const)
    : (["PVein_LA", "PVen_PVein", "PCap_PVen"] as const);
  const absolutePressure = (nodeName: NonCoronaryNodeNameV1): number => {
    if (nodeName === "LA" || nodeName === "LV"
      || nodeName === "RA" || nodeName === "RV") {
      return sample.nodeAbsolutePressureMmHg[nodeName];
    }
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const ptm = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      state.circulation.nodeVolumesMl[nodeName],
      runtime.vascular,
      "adaptive-volume-tolerance",
    );
    return ptm + respiratoryExternalPressureForKindV1(
      respiratoryKind(node.ext),
      sample.timeSec,
      runtime.respiratory,
    );
  };
  const nodes = nodePath.map((nodeName): VascularNodeSnapshot => {
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    if (node.kind !== "arterial" && node.kind !== "linear"
      && node.kind !== "venousPressure") {
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
  const totalComplianceMlPerMmHg = nodes.reduce((sum, node) =>
    sum + node.complianceEffMlPerMmHg, 0);
  return {
    side,
    downstreamNode: side === "right" ? "RA" : "LA",
    nodesDownstreamToUpstream: nodes,
    edgesDownstreamToUpstream: edges,
    totalStressedVolumeMl: nodes.reduce((sum, node) =>
      sum + node.stressedVolumeMl, 0),
    totalUnstressedVolumeMl: nodes.reduce((sum, node) =>
      sum + node.unstressedVolumeMl, 0),
    totalComplianceMlPerMmHg,
    externalPressureWeightedMmHg: totalComplianceMlPerMmHg > 1e-9
      ? nodes.reduce((sum, node) =>
        sum + node.complianceEffMlPerMmHg * node.Pext, 0)
        / totalComplianceMlPerMmHg
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

function smoothRamp01(value: number): number {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
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

function respiratoryKind(ext: NodeSpec["ext"] | EdgeSpec["ext"]):
"none" | "pth" | "palv" {
  if (ext === undefined || ext === "none") return "none";
  if (ext === "pth" || ext === "palv") return ext;
  throw new Error(`external-pressure kind ${ext} is outside noncoronary scope`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

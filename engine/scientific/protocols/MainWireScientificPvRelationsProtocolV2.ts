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
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicClassificationStatusV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type { MainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type { MainWireCommonPericardiumBindingV1 } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type { NonCoronaryCirculationRuntimeParamsV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  analyzeMainWireScientificLvPressureVolumeProtocolV1,
  type MainWireScientificEdpvrReferenceV1,
  type MainWireScientificHemodynamicMeasurementV1,
  type MainWireScientificHemodynamicOperatingPointV1,
  type MainWireScientificLvPressureVolumeAnalysisV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";

/**
 * Fixed-TBV, short transient preload-reduction protocol for LV ESPVR/EDPVR.
 *
 * The source accepted state is an input only. Every transaction advances a
 * local state reference, so the browser scenario remains untouched and no
 * recovery beats are needed. This protocol is deliberately distinct from the
 * TBV operating locus: all parameters and total blood volume remain fixed
 * while only the protocol-owned VC_RA resistance multiplier changes.
 */
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID =
  "main-wire-scientific-pv-relations-protocol-v2" as const;

const AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC = 1;
const MITRAL_FORWARD_FLOW_THRESHOLD_ML_PER_SEC = 1;

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;
type StepSuccess = MainWireFiveWallNonCoronaryStepSuccessV1<MechanicsState>;

export type MainWireScientificPvRelationsProtocolDependenciesV2 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
}>;

export type MainWireScientificPvRelationsProtocolPolicyV2 = Readonly<{
  integrationTimeStepSec: number;
  maximumEventLockDurationSec: number;
  resistanceRampDurationSec: number;
  sustainedValveEventDurationSec: number;
  minimumTotalBeatCount: number;
  maximumTotalBeatCount: number;
  maximumVcRaResistanceScale: number;
  minimumFitPointCount: number;
  targetEndDiastolicVolumeSpanFraction: number;
  minimumEndDiastolicVolumeSeparationMl: number;
  minimumEndDiastolicVolumeSeparationFractionOfBaseline: number;
  maximumTotalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  minimumStrokeVolumeMl: number;
  outputStride: number;
}>;

export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2 =
  Object.freeze({
    integrationTimeStepSec: 0.002,
    maximumEventLockDurationSec: 2,
    resistanceRampDurationSec: 0.25,
    sustainedValveEventDurationSec: 0.004,
    minimumTotalBeatCount: 6,
    maximumTotalBeatCount: 8,
    maximumVcRaResistanceScale: 16,
    minimumFitPointCount: 6,
    targetEndDiastolicVolumeSpanFraction: 0.15,
    minimumEndDiastolicVolumeSeparationMl: 0.5,
    minimumEndDiastolicVolumeSeparationFractionOfBaseline: 0.01,
    maximumTotalBloodVolumeAbsoluteErrorMl: 1e-4,
    maximumContinuityAbsoluteResidualMl: 1e-5,
    minimumStrokeVolumeMl: 1,
    outputStride: 5,
  }) satisfies MainWireScientificPvRelationsProtocolPolicyV2;

export type MainWireScientificPvRelationPressurePointV2 = Readonly<{
  sampleIndex: number;
  phase01: number;
  volumeMl: number;
  absolutePressureMmHg: number;
  transmuralPressureMmHg: number;
  externalPressureMmHg: number;
}>;

export type MainWireScientificPvRelationDisplaySampleV2 = Readonly<{
  phase01: number;
  lvVolumeMl: number;
  lvAbsolutePressureMmHg: number;
  lvTransmuralPressureMmHg: number;
}>;

export type MainWireScientificPvRelationBeatClassificationV2 =
  | "fit-eligible"
  | "redundant-loading-point"
  | "alternans-suspect-high"
  | "alternans-suspect-low"
  | "rejected";

export type MainWireScientificPvRelationBeatV2 = Readonly<{
  beatIndex: number;
  role: "baseline" | "preload-reduction";
  vcRaResistanceScaleStart: number;
  vcRaResistanceScaleEnd: number;
  resistanceScaleAtEndDiastole: number | null;
  resistanceScaleAtEndSystole: number | null;
  interventionRampCompletedBeforeEndDiastole: boolean;
  fixedTotalBloodVolumeMl: number;
  samples: readonly MainWireScientificPvRelationDisplaySampleV2[];
  endDiastolic: MainWireScientificPvRelationPressurePointV2 | null;
  endSystolic: MainWireScientificPvRelationPressurePointV2 | null;
  strokeWorkTransmuralMmHgMl: number;
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
  netCardiacOutputLMin: number;
  totalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  classification: MainWireScientificPvRelationBeatClassificationV2;
  valid: boolean;
  rejectionReason: string | null;
}>;

export type MainWireScientificPvRelationFitPointSelectionV2 = Readonly<{
  policy:
    "baseline-plus-monotonic-EDV-reduction-with-configured-minimum-separation";
  minimumEndDiastolicVolumeSeparationMl: number;
  includedBeatIds: readonly string[];
  excludedRedundantBeatIds: readonly string[];
}>;

export type MainWireScientificPvRelationsTerminationReasonV2 =
  | "predeclared-loading-span-reached"
  | "maximum-beats-reached"
  | "source-periodicity-gate-failed"
  | "baseline-quality-gate-failed"
  | "alternans-suspect"
  | "unsupported-mitral-or-aortic-regurgitation"
  | "step-failure"
  | "cancelled";

/**
 * Removes the conventional-PRSW vocabulary from this transient protocol.
 * The shared V1 analyzer can fit any supplied stroke-work signal, but V2 owns
 * an open, changing-load path integral rather than a demonstrated closed PV
 * loop. Its slope is therefore retained only as path-work/EDV sensitivity.
 */
export function adaptMainWireScientificPvRelationAnalysisV2(
  analysis: MainWireScientificLvPressureVolumeAnalysisV1,
) {
  const {
    minimumPrswPointCount,
    minimumPrswAdjustedR2,
    maximumPrswRmseFractionOfStrokeWorkSpan,
    maximumPrswLeaveOneOutSlopeRelativeDeviation,
    ...pressureVolumeThresholds
  } = analysis.thresholds;
  const { prsw: _prswBoundary, ...pressureVolumeBoundary } =
    analysis.physiologyBoundary;
  const pathFit = analysis.prsw.fit;
  const transientPathWorkEdvSensitivity = Object.freeze({
    status: analysis.prsw.status,
    fit: pathFit === null
      ? null
      : Object.freeze({
          relation: "Wtransient=Mw_like*(Ved-Vw_like)" as const,
          transientPathWorkEdvSlopeMmHg:
            pathFit.preloadRecruitableStrokeWorkSlopeMmHg,
          volumeAxisInterceptMl: pathFit.volumeAxisInterceptMl,
          transientPathWorkInterceptMmHgMl:
            pathFit.strokeWorkInterceptMmHgMl,
          diagnostics: pathFit.diagnostics,
          leaveOneOutSlopeMaximumRelativeDeviation:
            pathFit.leaveOneOutSlopeMaximumRelativeDeviation,
          conventionalPrswClaimed: false as const,
        }),
    pointIds: analysis.prsw.pointIds,
    rejectReasons: Object.freeze(analysis.prsw.rejectReasons.map((reason) =>
      Object.freeze({
        code: reason.code.startsWith("prsw-")
          ? `transient-path-work-edv-${reason.code.slice("prsw-".length)}`
          : reason.code,
        message: reason.message
          .replaceAll("PRSW", "transient path-work–EDV sensitivity")
          .replaceAll("stroke-work span", "transient path-work span"),
        pointIds: reason.pointIds,
      }))),
  });
  return Object.freeze({
    analysisId: analysis.analysisId,
    protocolKind: analysis.protocolKind,
    physiologyBoundary: Object.freeze({
      ...pressureVolumeBoundary,
      transientPathWorkEdvSensitivity:
        "open-changing-load-path-work-relation-not-conventional-PRSW" as const,
      conventionalPrswClaimed: false as const,
    }),
    thresholds: Object.freeze({
      ...pressureVolumeThresholds,
      minimumTransientPathWorkEdvPointCount: minimumPrswPointCount,
      minimumTransientPathWorkEdvAdjustedR2: minimumPrswAdjustedR2,
      maximumTransientPathWorkEdvRmseFractionOfPathWorkSpan:
        maximumPrswRmseFractionOfStrokeWorkSpan,
      maximumTransientPathWorkEdvLeaveOneOutSlopeRelativeDeviation:
        maximumPrswLeaveOneOutSlopeRelativeDeviation,
    }),
    includedFitEligiblePointIds: analysis.includedFitEligiblePointIds,
    exclusions: analysis.exclusions,
    espvr: analysis.espvr,
    quadraticEspvrSensitivity: analysis.quadraticEspvrSensitivity,
    edpvr: analysis.edpvr,
    transientPathWorkEdvSensitivity,
    overallStatus:
      analysis.espvr.status === "accepted"
      && analysis.edpvr.status === "accepted"
        ? "accepted" as const
        : "rejected" as const,
  });
}

export type MainWireScientificPvRelationsAnalysisV2 = ReturnType<
  typeof adaptMainWireScientificPvRelationAnalysisV2
>;

export type MainWireScientificPvRelationsProgressV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID;
  completedBeatCount: number;
  minimumTotalBeatCount: number;
  maximumTotalBeatCount: number;
  latestBeat: MainWireScientificPvRelationBeatV2;
  beats: readonly MainWireScientificPvRelationBeatV2[];
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV2;
  provisionalAnalysis: MainWireScientificPvRelationsAnalysisV2;
  canStopEarly: boolean;
}>;

export type MainWireScientificPvRelationsProtocolResultV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID;
  protocolVersion: "2.0.0";
  source: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    fixedTotalBloodVolumeMl: number;
  }>;
  claim: Readonly<{
    intervention:
      "fixed-TBV-event-locked-adaptive-graded-VC_RA-resistance-ramp";
    fitPressureSemantics: "LV-transmural-pressure";
    retainedEndpointPressureSemantics:
      "LV-absolute-and-transmural-pressure-with-derived-external-pressure";
    endDiastoleEvent:
      "maximum-volume-forward-mitral-and-aortic-flow-below-threshold-before-aortic-opening-within-event-locked-cycle";
    endSystoleEvent: "end-of-forward-aortic-ejection";
    aorticEventSemantics:
      "forward-flow-threshold-event-not-anatomical-valve-closure";
    transientPressureVolumeWorkSemantics:
      "negative-chronological-integral-Ptm-dV-without-artificial-endpoint-closure";
    stoppingRule:
      "predeclared-point-count-and-EDV-span-independent-of-fit-acceptance";
    mitralOrAorticRegurgitationApplicability:
      "unsupported-fails-closed-pending-disease-envelope-validation";
    maxElastanceIterativeSensitivity:
      "not-implemented-reserved-for-research-mode";
    sourceSessionMutated: false;
    recoveryBeatsRequired: false;
    totalBloodVolumeVaried: false;
    tbvOperatingLocusMaySubstituteForThisProtocol: false;
    interventionParameter: "VC_RA-resistance-multiplier";
    nonInterventionControlsAndModelParametersFrozen: true;
    alternansSuspectBeatsAveragedIntoFits: false;
    fitOwnedByAnalysisLayer: true;
  }>;
  policy: MainWireScientificPvRelationsProtocolPolicyV2;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  beats: readonly MainWireScientificPvRelationBeatV2[];
  edpvrReference: MainWireScientificEdpvrReferenceV1;
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV2;
  analysis: MainWireScientificPvRelationsAnalysisV2;
  terminationReason: MainWireScientificPvRelationsTerminationReasonV2;
  failureReason: string | null;
}>;

export type MainWireScientificPvRelationsProtocolOptionsV2 = Readonly<{
  policy?: Partial<MainWireScientificPvRelationsProtocolPolicyV2>;
  onProgress?: (progress: MainWireScientificPvRelationsProgressV2) => void;
  shouldCancel?: () => boolean;
}>;

export function classifyMainWireScientificPvRelationRegurgitationSupportV2(
  valvePreset: NonCoronaryCirculationRuntimeParamsV1["valvePreset"],
): Readonly<{
  supported: boolean;
  unsupportedBracketIds: readonly string[];
  hasUnbracketedLeftValveRegurgitation: boolean;
}> {
  const unsupportedBracketIds = valvePreset.brackets
    .filter(({ lesionCode }) => lesionCode === "MR" || lesionCode === "AR")
    .map(({ bracketId }) => bracketId);
  const hasUnbracketedLeftValveRegurgitation =
    valvePreset.valves.MV.closedReverseEroaCm2 > 0
    || valvePreset.valves.AoV.closedReverseEroaCm2 > 0;
  return Object.freeze({
    supported:
      unsupportedBracketIds.length === 0
      && !hasUnbracketedLeftValveRegurgitation,
    unsupportedBracketIds: Object.freeze(unsupportedBracketIds),
    hasUnbracketedLeftValveRegurgitation,
  });
}

export type MainWireScientificPvRelationOverlayPressureBasisV2 =
  | "intracavitary-absolute"
  | "transmural";

export type MainWireScientificPvRelationOverlayCurveV2 = Readonly<{
  relation: "ESPVR" | "EDPVR";
  relationModel:
    | "linear-ESPVR"
    | "quadratic-ESPVR-sensitivity"
    | "exponential-EDPVR";
  pressureBasis: MainWireScientificPvRelationOverlayPressureBasisV2;
  sourceBeatIds: readonly string[];
  formalFitStatus: "accepted" | "rejected";
  displaySemantics:
    | "formal-transmural-analysis-sampled-over-observed-volume-span"
    | "intracavitary-display-projection-from-formal-transmural-analysis-plus-observed-external-pressure";
  points: readonly Readonly<{
    volumeMl: number;
    pressureMmHg: number;
  }>[];
}>;

export type MainWireScientificPvRelationOverlayCurvesV2 = Readonly<{
  sourceBeatIds: readonly string[];
  claim: Readonly<{
    sameAcceptedBeatIdsForBothPressureBases: true;
    formalAnalysisPressureBasis: "transmural";
    intracavitaryCurveIsIndependentScientificRefit: false;
    intracavitaryProjection:
      "formal-transmural-relation-plus-volume-local-observed-external-pressure";
    extrapolationBeyondObservedEndpointVolumeSpan: false;
  }>;
  transmural: Readonly<{
    espvr: MainWireScientificPvRelationOverlayCurveV2 | null;
    edpvr: MainWireScientificPvRelationOverlayCurveV2 | null;
  }>;
  intracavitaryAbsolute: Readonly<{
    espvr: MainWireScientificPvRelationOverlayCurveV2 | null;
    edpvr: MainWireScientificPvRelationOverlayCurveV2 | null;
  }>;
}>;

type EndpointSample = Readonly<{
  cyclePhase01: number;
  nodeVolumeMl: Readonly<{ LV: number }>;
  nodeAbsolutePressureMmHg: Readonly<{ LV: number }>;
  chamberTransmuralPressureMmHg: Readonly<{ LV: number }>;
  flowMlPerSec: Readonly<{ MV: number; AoV: number }>;
}>;

type ProtocolStep = Readonly<{
  state: AcceptedState;
  step: StepSuccess;
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2;
  resistanceScale: number;
}>;

export function resolveMainWireScientificPvRelationsProtocolPolicyV2(
  partial: Partial<MainWireScientificPvRelationsProtocolPolicyV2> = {},
): MainWireScientificPvRelationsProtocolPolicyV2 {
  const policy = Object.freeze({
    ...MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    ...partial,
  });
  if (!Number.isInteger(policy.minimumTotalBeatCount)
      || !Number.isInteger(policy.maximumTotalBeatCount)
      || policy.minimumTotalBeatCount < 2
      || policy.maximumTotalBeatCount < policy.minimumTotalBeatCount) {
    throw new Error("PV relation protocol requires an integer 2 <= minimum beat count <= maximum beat count");
  }
  if (!(policy.integrationTimeStepSec > 0)
      || policy.integrationTimeStepSec > 0.01
      || !(policy.maximumEventLockDurationSec >= 1)
      || !(policy.resistanceRampDurationSec > 0)
      || policy.resistanceRampDurationSec
        >= policy.maximumEventLockDurationSec
      || policy.sustainedValveEventDurationSec
        < policy.integrationTimeStepSec * 2
      || policy.sustainedValveEventDurationSec > 0.02) {
    throw new Error(
      "PV relation protocol timing policy is outside its bounded numerical sensitivity envelope",
    );
  }
  if (policy.maximumTotalBeatCount > 16) {
    throw new Error("PV relation protocol maximum beat count must not exceed 16");
  }
  if (!(policy.maximumVcRaResistanceScale > 1)
      || !Number.isFinite(policy.maximumVcRaResistanceScale)) {
    throw new Error("PV relation protocol maximum VC_RA resistance scale must be finite and greater than one");
  }
  if (!Number.isInteger(policy.minimumFitPointCount)
      || policy.minimumFitPointCount < 3
      || policy.minimumFitPointCount > policy.minimumTotalBeatCount) {
    throw new Error("PV relation protocol minimum fit-point count must be between three and the minimum beat count");
  }
  if (!(policy.targetEndDiastolicVolumeSpanFraction > 0)
      || !(policy.targetEndDiastolicVolumeSpanFraction < 1)) {
    throw new Error("PV relation protocol target EDV span fraction must lie strictly between zero and one");
  }
  if (!Number.isFinite(policy.minimumEndDiastolicVolumeSeparationMl)
      || policy.minimumEndDiastolicVolumeSeparationMl < 0
      || !Number.isFinite(
        policy.minimumEndDiastolicVolumeSeparationFractionOfBaseline,
      )
      || policy.minimumEndDiastolicVolumeSeparationFractionOfBaseline < 0) {
    throw new Error("PV relation protocol EDV separation thresholds must be finite and non-negative");
  }
  if (!Number.isFinite(policy.maximumTotalBloodVolumeAbsoluteErrorMl)
      || policy.maximumTotalBloodVolumeAbsoluteErrorMl < 0
      || !Number.isFinite(policy.maximumContinuityAbsoluteResidualMl)
      || policy.maximumContinuityAbsoluteResidualMl < 0) {
    throw new Error("PV relation protocol numerical residual limits must be finite and non-negative");
  }
  if (!Number.isFinite(policy.minimumStrokeVolumeMl)
      || policy.minimumStrokeVolumeMl <= 0) {
    throw new Error("PV relation protocol minimum stroke volume must be finite and positive");
  }
  if (!Number.isInteger(policy.outputStride) || policy.outputStride < 1) {
    throw new Error("PV relation protocol output stride must be a positive integer");
  }
  return policy;
}

export function runMainWireScientificPvRelationsProtocolV2(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV2,
  sourceState: AcceptedState,
  options: MainWireScientificPvRelationsProtocolOptionsV2 = {},
): MainWireScientificPvRelationsProtocolResultV2 {
  const policy = resolveMainWireScientificPvRelationsProtocolPolicyV2(
    options.policy,
  );
  const source = sourceIdentity(sourceState);
  const beats: MainWireScientificPvRelationBeatV2[] = [];
  let state = sourceState;
  let baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1 =
    "not-converged";
  let failureReason: string | null = null;
  let terminationReason: MainWireScientificPvRelationsTerminationReasonV2 =
    "maximum-beats-reached";

  const regurgitationSupport =
    classifyMainWireScientificPvRelationRegurgitationSupportV2(
      dependencies.runtime.valvePreset,
    );
  if (!regurgitationSupport.supported) {
    failureReason = [
      "fixed-TBV PV relations are not yet validated for configured mitral or aortic regurgitation",
      regurgitationSupport.unsupportedBracketIds.length > 0
        ? `(${regurgitationSupport.unsupportedBracketIds.join(", ")})`
        : "(unbracketed reverse effective orifice area)",
    ].join(" ");
    terminationReason = "unsupported-mitral-or-aortic-regurgitation";
  }

  if (failureReason === null) try {
    const phaseAligned = alignProtocolStateToAorticClosure(
      dependencies,
      state,
      1,
      policy,
    );
    state = phaseAligned;
    const baseline = runProtocolBeat(dependencies, state, 1, 1, policy);
    state = baseline.state;
    const closure = compareMainWireFiveWallAcceptedStatesV1(
      baseline.state,
      phaseAligned,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    baselinePeriodicity =
      closure.overall.maximumNormalizedDelta <=
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.period1NormalizedTolerance
        ? "period1-converged"
        : "not-converged";
    beats.push(pvBeatFromSteps({
      beatIndex: 0,
      role: "baseline",
      resistanceScaleStart: 1,
      resistanceScaleEnd: 1,
      steps: baseline.steps,
      fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
      policy,
    }));
  } catch (error) {
    failureReason = errorMessage(error);
    terminationReason = "step-failure";
  }

  if (failureReason === null && baselinePeriodicity !== "period1-converged") {
    const baseline = beats[0]!;
    beats[0] = Object.freeze({
      ...baseline,
      classification: "rejected" as const,
      valid: false,
      rejectionReason:
        `source baseline did not reproduce period-1 closure (${baselinePeriodicity})`,
    });
    terminationReason = "source-periodicity-gate-failed";
  }
  if (
    failureReason === null
    && baselinePeriodicity === "period1-converged"
    && beats[0]?.valid !== true
  ) {
    terminationReason = "baseline-quality-gate-failed";
  }

  let previousResistanceScale = 1;
  while (
    failureReason === null
    && baselinePeriodicity === "period1-converged"
    && beats[0]?.valid === true
    && beats.length < policy.maximumTotalBeatCount
  ) {
    if (options.shouldCancel?.() === true) {
      terminationReason = "cancelled";
      break;
    }
    const nextResistanceScale = nextMainWireScientificPvRelationResistanceScaleV2({
      beats,
      currentResistanceScale: previousResistanceScale,
      policy,
    });
    try {
      const stepped = runProtocolBeat(
        dependencies,
        state,
        previousResistanceScale,
        nextResistanceScale,
        policy,
      );
      state = stepped.state;
      beats.push(pvBeatFromSteps({
        beatIndex: beats.length,
        role: "preload-reduction",
        resistanceScaleStart: previousResistanceScale,
        resistanceScaleEnd: nextResistanceScale,
        steps: stepped.steps,
        fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
        policy,
      }));
      previousResistanceScale = nextResistanceScale;
    } catch (error) {
      failureReason = errorMessage(error);
      terminationReason = "step-failure";
      break;
    }

    const evaluated = evaluateProtocolBeats(beats, policy, baselinePeriodicity);
    replaceArray(beats, evaluated.beats);
    const canStopEarly = canStopMainWireScientificPvRelationsProtocolEarlyV2({
      completedBeatCount: beats.length,
      beats,
      policy,
    });
    options.onProgress?.(Object.freeze({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID,
      completedBeatCount: beats.length,
      minimumTotalBeatCount: policy.minimumTotalBeatCount,
      maximumTotalBeatCount: policy.maximumTotalBeatCount,
      latestBeat: beats.at(-1)!,
      beats: Object.freeze([...beats]),
      fitPointSelection: evaluated.fitPointSelection,
      provisionalAnalysis: evaluated.analysis,
      canStopEarly,
    }));
    if (hasAlternansSuspect(beats) && beats.length >= policy.minimumTotalBeatCount) {
      terminationReason = "alternans-suspect";
      break;
    }
    if (canStopEarly) {
      terminationReason = "predeclared-loading-span-reached";
      break;
    }
  }

  const evaluated = evaluateProtocolBeats(
    beats,
    policy,
    baselinePeriodicity,
    failureReason,
  );
  replaceArray(beats, evaluated.beats);
  const edpvrReference = klotzInformedEdpvrReference(beats[0]);
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID,
    protocolVersion: "2.0.0" as const,
    source,
    claim: Object.freeze({
      intervention:
        "fixed-TBV-event-locked-adaptive-graded-VC_RA-resistance-ramp" as const,
      fitPressureSemantics: "LV-transmural-pressure" as const,
      retainedEndpointPressureSemantics:
        "LV-absolute-and-transmural-pressure-with-derived-external-pressure" as const,
      endDiastoleEvent:
        "maximum-volume-forward-mitral-and-aortic-flow-below-threshold-before-aortic-opening-within-event-locked-cycle" as const,
      endSystoleEvent: "end-of-forward-aortic-ejection" as const,
      aorticEventSemantics:
        "forward-flow-threshold-event-not-anatomical-valve-closure" as const,
      transientPressureVolumeWorkSemantics:
        "negative-chronological-integral-Ptm-dV-without-artificial-endpoint-closure" as const,
      stoppingRule:
        "predeclared-point-count-and-EDV-span-independent-of-fit-acceptance" as const,
      mitralOrAorticRegurgitationApplicability:
        "unsupported-fails-closed-pending-disease-envelope-validation" as const,
      maxElastanceIterativeSensitivity:
        "not-implemented-reserved-for-research-mode" as const,
      sourceSessionMutated: false as const,
      recoveryBeatsRequired: false as const,
      totalBloodVolumeVaried: false as const,
      tbvOperatingLocusMaySubstituteForThisProtocol: false as const,
      interventionParameter: "VC_RA-resistance-multiplier" as const,
      nonInterventionControlsAndModelParametersFrozen: true as const,
      alternansSuspectBeatsAveragedIntoFits: false as const,
      fitOwnedByAnalysisLayer: true as const,
    }),
    policy,
    baselinePeriodicity,
    beats: Object.freeze([...beats]),
    edpvrReference,
    fitPointSelection: evaluated.fitPointSelection,
    analysis: evaluated.analysis,
    terminationReason,
    failureReason,
  });
}

/**
 * Adaptive log-resistance schedule. It remains monotone and bounded, but moves
 * faster when the observed EDV span lags the target and slows when it is ahead.
 */
export function nextMainWireScientificPvRelationResistanceScaleV2(input: Readonly<{
  beats: readonly MainWireScientificPvRelationBeatV2[];
  currentResistanceScale: number;
  policy: MainWireScientificPvRelationsProtocolPolicyV2;
}>): number {
  const loadingOpportunityCount = input.policy.maximumTotalBeatCount - 1;
  const baseLogIncrement =
    Math.log(input.policy.maximumVcRaResistanceScale) / loadingOpportunityCount;
  const completedLoadingBeatCount = Math.max(0, input.beats.length - 1);
  const expectedProgressAtNextBeat =
    Math.min(1, (completedLoadingBeatCount + 1) /
      Math.max(1, input.policy.minimumTotalBeatCount - 1));
  const baselineEdv = input.beats[0]?.endDiastolic?.volumeMl ?? null;
  const currentMinimumEdv = minimumFinite(input.beats.map(
    (beat) => beat.endDiastolic?.volumeMl ?? Number.NaN,
  ));
  const observedSpanFraction = baselineEdv !== null
    && baselineEdv > 0
    && currentMinimumEdv !== null
      ? Math.max(0, (baselineEdv - currentMinimumEdv) / baselineEdv)
      : 0;
  const expectedSpanFraction =
    input.policy.targetEndDiastolicVolumeSpanFraction * expectedProgressAtNextBeat;
  const paceRatio = expectedSpanFraction > 1e-12
    ? observedSpanFraction / expectedSpanFraction
    : 1;
  const adaptation = paceRatio < 0.7 ? 1.6 : paceRatio > 1.25 ? 0.7 : 1;
  const nextLogScale = Math.log(Math.max(1, input.currentResistanceScale))
    + baseLogIncrement * adaptation;
  return Math.min(
    input.policy.maximumVcRaResistanceScale,
    Math.max(input.currentResistanceScale, Math.exp(nextLogScale)),
  );
}

export function canStopMainWireScientificPvRelationsProtocolEarlyV2(
  input: Readonly<{
    completedBeatCount: number;
    beats: readonly MainWireScientificPvRelationBeatV2[];
    policy: MainWireScientificPvRelationsProtocolPolicyV2;
  }>,
): boolean {
  if (input.completedBeatCount < input.policy.minimumTotalBeatCount) return false;
  const selected = input.beats.filter((beat) => beat.classification === "fit-eligible");
  if (selected.length < input.policy.minimumFitPointCount) return false;
  const baselineEdv = selected.find((beat) => beat.role === "baseline")
    ?.endDiastolic?.volumeMl;
  const minimumEdv = minimumFinite(selected.map(
    (beat) => beat.endDiastolic?.volumeMl ?? Number.NaN,
  ));
  if (baselineEdv === undefined || minimumEdv === null || baselineEdv <= 0) {
    return false;
  }
  const spanFraction = (baselineEdv - minimumEdv) / baselineEdv;
  // Fit acceptance is deliberately not part of acquisition stopping. Using a
  // reported fit to decide its own loading range creates selection leakage and
  // gives rejected relations a systematically wider protocol envelope.
  return spanFraction >= input.policy.targetEndDiastolicVolumeSpanFraction;
}

export function extractMainWireScientificLvRelationEndpointsV2(
  samples: readonly EndpointSample[],
  sustainedValveEventSampleCount = 2,
): Readonly<{
  endDiastolic: MainWireScientificPvRelationPressurePointV2 | null;
  endSystolic: MainWireScientificPvRelationPressurePointV2 | null;
}> {
  if (samples.length < 3) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const aorticOpenIndex = chronologicalSustainedTransitionIndex(
    samples,
    1,
    sustainedValveEventSampleCount,
    (sample) => sample.flowMlPerSec.AoV
      > AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC,
  );
  if (aorticOpenIndex < 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const aorticCloseIndex = chronologicalSustainedTransitionIndex(
    samples,
    aorticOpenIndex + 1,
    sustainedValveEventSampleCount,
    (sample) => sample.flowMlPerSec.AoV
      <= AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC,
  );
  if (aorticCloseIndex < 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const diastolicIndices = Array.from(
    { length: aorticOpenIndex },
    (_, index) => index,
  );
  if (diastolicIndices.length === 0) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  const preAorticOpening = diastolicIndices.map((index) => samples[index]!);
  const maximumPreAorticVolumeMl = Math.max(
    ...preAorticOpening.map((sample) => sample.nodeVolumeMl.LV),
  );
  const edIndex = diastolicIndices.find((index) => {
    const sample = samples[index]!;
    return sample.flowMlPerSec.MV
        <= MITRAL_FORWARD_FLOW_THRESHOLD_ML_PER_SEC
      && sample.flowMlPerSec.AoV
        <= AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC
      && sample.nodeVolumeMl.LV >= maximumPreAorticVolumeMl - 0.05;
  });
  if (edIndex === undefined) {
    return Object.freeze({ endDiastolic: null, endSystolic: null });
  }
  return Object.freeze({
    endDiastolic: pressurePoint(samples[edIndex]!, edIndex),
    endSystolic: pressurePoint(samples[aorticCloseIndex]!, aorticCloseIndex),
  });
}

function chronologicalSustainedTransitionIndex(
  samples: readonly EndpointSample[],
  startIndex: number,
  sustainedSampleCount: number,
  isNewState: (sample: EndpointSample) => boolean,
): number {
  const required = Math.max(2, Math.round(sustainedSampleCount));
  for (
    let index = Math.max(1, startIndex);
    index <= samples.length - required;
    index += 1
  ) {
    const previous = samples[index - 1]!;
    if (isNewState(previous)) continue;
    let sustained = true;
    for (
      let offset = 0;
      offset < required;
      offset += 1
    ) {
      if (!isNewState(samples[index + offset]!)) {
        sustained = false;
        break;
      }
    }
    if (sustained) return index;
  }
  return -1;
}

export function selectMainWireScientificPvRelationFitPointsV2(
  beats: readonly MainWireScientificPvRelationBeatV2[],
  policy: MainWireScientificPvRelationsProtocolPolicyV2,
): MainWireScientificPvRelationFitPointSelectionV2 {
  const baseline = beats.find((beat) =>
    beat.role === "baseline" && beat.valid && beat.endDiastolic !== null);
  const baselineEdvMl = baseline?.endDiastolic?.volumeMl ?? 0;
  const minimumEndDiastolicVolumeSeparationMl = Math.max(
    policy.minimumEndDiastolicVolumeSeparationMl,
    baselineEdvMl * policy.minimumEndDiastolicVolumeSeparationFractionOfBaseline,
  );
  const includedBeatIds: string[] = baseline === undefined
    ? []
    : [beatId(baseline)];
  const excludedRedundantBeatIds: string[] = [];
  let lastIncludedEdvMl = baselineEdvMl;
  for (const beat of beats) {
    if (beat.role === "baseline" || !beat.valid || beat.endDiastolic === null) {
      continue;
    }
    if (beat.classification !== "fit-eligible"
        && beat.classification !== "redundant-loading-point") continue;
    if (beat.endDiastolic.volumeMl
        <= lastIncludedEdvMl - minimumEndDiastolicVolumeSeparationMl) {
      includedBeatIds.push(beatId(beat));
      lastIncludedEdvMl = beat.endDiastolic.volumeMl;
    } else {
      excludedRedundantBeatIds.push(beatId(beat));
    }
  }
  return Object.freeze({
    policy:
      "baseline-plus-monotonic-EDV-reduction-with-configured-minimum-separation" as const,
    minimumEndDiastolicVolumeSeparationMl,
    includedBeatIds: Object.freeze(includedBeatIds),
    excludedRedundantBeatIds: Object.freeze(excludedRedundantBeatIds),
  });
}

export function buildMainWireScientificPvRelationAnalysisPointsV2(
  beats: readonly MainWireScientificPvRelationBeatV2[],
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV2,
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1,
): readonly MainWireScientificHemodynamicOperatingPointV1[] {
  const included = new Set(fitPointSelection.includedBeatIds);
  const points: MainWireScientificHemodynamicOperatingPointV1[] = [];
  for (const beat of beats) {
    const pointId = beatId(beat);
    const common = Object.freeze({
      pointId,
      protocolKind: "fixed-tbv-ivc-like-preload-reduction" as const,
      role: beat.role,
      totalBloodVolumeMl: beat.fixedTotalBloodVolumeMl,
    });
    if (beat.role === "baseline" && baselinePeriodicity !== "period1-converged") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason:
          `source baseline did not reproduce period-1 closure (${baselinePeriodicity})`,
      }));
    } else if (beat.classification === "alternans-suspect-high"
        || beat.classification === "alternans-suspect-low") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason: beat.rejectionReason
          ?? "alternans-suspect evidence during changing-load ramp",
      }));
    } else if (!beat.valid || beat.classification === "rejected") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason: beat.rejectionReason ?? "invalid protocol beat",
      }));
    } else if (included.has(pointId)) {
      points.push(Object.freeze({
        ...common,
        periodicity: "transient-fit-eligible" as const,
        measurement: pvBeatAnalysisMeasurement(beat),
      }));
    }
  }
  return Object.freeze(points);
}

/**
 * Produces basis-explicit overlay curves from exactly the same accepted beat
 * IDs. Scientific fitting remains transmural. The intracavitary curve is a
 * display projection obtained by adding the endpoint-observed external
 * pressure Pabs-Ptm as a local function of volume; it is never represented as
 * an independent ESPVR/EDPVR fit.
 */
export function buildMainWireScientificPvRelationOverlayCurvesV2(input: Readonly<{
  beats: readonly MainWireScientificPvRelationBeatV2[];
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV2;
  analysis: Pick<
    MainWireScientificPvRelationsAnalysisV2,
    "espvr" | "quadraticEspvrSensitivity" | "edpvr"
  >;
  sampleCount?: number;
}>): MainWireScientificPvRelationOverlayCurvesV2 {
  const sampleCount = Math.max(2, Math.min(256, Math.round(input.sampleCount ?? 48)));
  const included = new Set(input.fitPointSelection.includedBeatIds);
  const selected = input.beats.filter((beat) => included.has(beatId(beat)));
  const sourceBeatIds = Object.freeze(selected.map(beatId));
  const esObservations = selected.flatMap((beat) => beat.endSystolic === null
    ? []
    : [Object.freeze({
        volumeMl: beat.endSystolic.volumeMl,
        externalPressureMmHg: beat.endSystolic.externalPressureMmHg,
      })]);
  const edObservations = selected.flatMap((beat) => beat.endDiastolic === null
    ? []
    : [Object.freeze({
        volumeMl: beat.endDiastolic.volumeMl,
        externalPressureMmHg: beat.endDiastolic.externalPressureMmHg,
      })]);

  const espvrFit = input.analysis.espvr.fit;
  const edpvrFit = input.analysis.edpvr.fit;
  const quadraticEspvr =
    input.analysis.quadraticEspvrSensitivity?.nonlinear === true
      ? input.analysis.quadraticEspvrSensitivity
      : null;
  const espvrRelationModel = quadraticEspvr === null
    ? "linear-ESPVR" as const
    : "quadratic-ESPVR-sensitivity" as const;
  const espvrPressureAtVolume = espvrFit === null
    ? null
    : quadraticEspvr === null
      ? (volumeMl: number) =>
          espvrFit.endSystolicElastanceMmHgPerMl
            * (volumeMl - espvrFit.volumeAxisInterceptMl)
      : (volumeMl: number) =>
          quadraticEspvr.quadraticCoefficientMmHgPerMl2 * volumeMl ** 2
          + quadraticEspvr.linearCoefficientMmHgPerMl * volumeMl
          + quadraticEspvr.interceptMmHg;
  const transmuralEspvr = espvrFit === null
    ? null
    : sampledRelationCurve({
        relation: "ESPVR",
        relationModel: espvrRelationModel,
        basis: "transmural",
        sourceBeatIds,
        status: input.analysis.espvr.status,
        sampleCount,
        observations: esObservations,
        transmuralPressureAtVolume: espvrPressureAtVolume!,
      });
  const absoluteEspvr = espvrFit === null
    ? null
    : sampledRelationCurve({
        relation: "ESPVR",
        relationModel: espvrRelationModel,
        basis: "intracavitary-absolute",
        sourceBeatIds,
        status: input.analysis.espvr.status,
        sampleCount,
        observations: esObservations,
        transmuralPressureAtVolume: espvrPressureAtVolume!,
      });
  const transmuralEdpvr = edpvrFit === null
    ? null
    : sampledRelationCurve({
        relation: "EDPVR",
        relationModel: "exponential-EDPVR",
        basis: "transmural",
        sourceBeatIds,
        status: input.analysis.edpvr.status,
        sampleCount,
        observations: edObservations,
        transmuralPressureAtVolume: (volumeMl) =>
          edpvrFit.referencePressureMmHg
          + edpvrFit.alphaMmHg * (
            Math.exp(
              edpvrFit.betaPerMl * (volumeMl - edpvrFit.referenceVolumeMl),
            ) - 1
          ),
      });
  const absoluteEdpvr = edpvrFit === null
    ? null
    : sampledRelationCurve({
        relation: "EDPVR",
        relationModel: "exponential-EDPVR",
        basis: "intracavitary-absolute",
        sourceBeatIds,
        status: input.analysis.edpvr.status,
        sampleCount,
        observations: edObservations,
        transmuralPressureAtVolume: (volumeMl) =>
          edpvrFit.referencePressureMmHg
          + edpvrFit.alphaMmHg * (
            Math.exp(
              edpvrFit.betaPerMl * (volumeMl - edpvrFit.referenceVolumeMl),
            ) - 1
          ),
      });

  return Object.freeze({
    sourceBeatIds,
    claim: Object.freeze({
      sameAcceptedBeatIdsForBothPressureBases: true as const,
      formalAnalysisPressureBasis: "transmural" as const,
      intracavitaryCurveIsIndependentScientificRefit: false as const,
      intracavitaryProjection:
        "formal-transmural-relation-plus-volume-local-observed-external-pressure" as const,
      extrapolationBeyondObservedEndpointVolumeSpan: false as const,
    }),
    transmural: Object.freeze({
      espvr: transmuralEspvr,
      edpvr: transmuralEdpvr,
    }),
    intracavitaryAbsolute: Object.freeze({
      espvr: absoluteEspvr,
      edpvr: absoluteEdpvr,
    }),
  });
}

function sampledRelationCurve(input: Readonly<{
  relation: "ESPVR" | "EDPVR";
  relationModel: MainWireScientificPvRelationOverlayCurveV2["relationModel"];
  basis: MainWireScientificPvRelationOverlayPressureBasisV2;
  sourceBeatIds: readonly string[];
  status: "accepted" | "rejected";
  sampleCount: number;
  observations: readonly Readonly<{
    volumeMl: number;
    externalPressureMmHg: number;
  }>[];
  transmuralPressureAtVolume: (volumeMl: number) => number;
}>): MainWireScientificPvRelationOverlayCurveV2 | null {
  const observations = collapseExternalPressureObservations(input.observations);
  if (observations.length === 0) return null;
  const minimumVolumeMl = observations[0]!.volumeMl;
  const maximumVolumeMl = observations.at(-1)!.volumeMl;
  const spanMl = maximumVolumeMl - minimumVolumeMl;
  const points = Array.from({ length: input.sampleCount }, (_, index) => {
    const fraction = input.sampleCount === 1
      ? 0
      : index / (input.sampleCount - 1);
    const volumeMl = minimumVolumeMl + spanMl * fraction;
    const transmuralPressureMmHg = input.transmuralPressureAtVolume(volumeMl);
    const pressureMmHg = input.basis === "transmural"
      ? transmuralPressureMmHg
      : transmuralPressureMmHg
        + interpolateExternalPressure(observations, volumeMl);
    return Object.freeze({ volumeMl, pressureMmHg });
  });
  return Object.freeze({
    relation: input.relation,
    relationModel: input.relationModel,
    pressureBasis: input.basis,
    sourceBeatIds: input.sourceBeatIds,
    formalFitStatus: input.status,
    displaySemantics: input.basis === "transmural"
      ? "formal-transmural-analysis-sampled-over-observed-volume-span" as const
      : "intracavitary-display-projection-from-formal-transmural-analysis-plus-observed-external-pressure" as const,
    points: Object.freeze(points),
  });
}

function collapseExternalPressureObservations(
  observations: readonly Readonly<{
    volumeMl: number;
    externalPressureMmHg: number;
  }>[],
): readonly Readonly<{
  volumeMl: number;
  externalPressureMmHg: number;
}>[] {
  const sorted = observations
    .filter(({ volumeMl, externalPressureMmHg }) =>
      Number.isFinite(volumeMl) && Number.isFinite(externalPressureMmHg))
    .sort((a, b) => a.volumeMl - b.volumeMl);
  const collapsed: Array<{ volumeMl: number; externalPressureMmHg: number }> = [];
  for (const observation of sorted) {
    const previous = collapsed.at(-1);
    if (previous !== undefined
        && Math.abs(previous.volumeMl - observation.volumeMl) <= 1e-9) {
      previous.externalPressureMmHg =
        0.5 * (previous.externalPressureMmHg + observation.externalPressureMmHg);
    } else {
      collapsed.push({ ...observation });
    }
  }
  return Object.freeze(collapsed.map((observation) => Object.freeze(observation)));
}

function interpolateExternalPressure(
  observations: readonly Readonly<{
    volumeMl: number;
    externalPressureMmHg: number;
  }>[],
  volumeMl: number,
): number {
  if (observations.length === 1) {
    return observations[0]!.externalPressureMmHg;
  }
  if (volumeMl <= observations[0]!.volumeMl) {
    return observations[0]!.externalPressureMmHg;
  }
  if (volumeMl >= observations.at(-1)!.volumeMl) {
    return observations.at(-1)!.externalPressureMmHg;
  }
  for (let index = 1; index < observations.length; index += 1) {
    const right = observations[index]!;
    if (volumeMl > right.volumeMl) continue;
    const left = observations[index - 1]!;
    const fraction = (volumeMl - left.volumeMl)
      / (right.volumeMl - left.volumeMl);
    return left.externalPressureMmHg
      + (right.externalPressureMmHg - left.externalPressureMmHg) * fraction;
  }
  return observations.at(-1)!.externalPressureMmHg;
}

function runProtocolBeat(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV2,
  initialState: AcceptedState,
  resistanceScaleStart: number,
  resistanceScaleEnd: number,
  policy: MainWireScientificPvRelationsProtocolPolicyV2,
): Readonly<{ state: AcceptedState; steps: readonly ProtocolStep[] }> {
  const maximumEventLockStepCount = Math.ceil(
    policy.maximumEventLockDurationSec / policy.integrationTimeStepSec,
  );
  const resistanceRampStepCount = Math.ceil(
    policy.resistanceRampDurationSec / policy.integrationTimeStepSec,
  );
  const sustainedValveEventSampleCount = Math.max(2, Math.ceil(
    policy.sustainedValveEventDurationSec / policy.integrationTimeStepSec,
  ));
  let state = initialState;
  const steps: ProtocolStep[] = [];
  let forwardAorticSampleCount = 0;
  let nonForwardAorticSampleCount = 0;
  let aorticOpeningObserved = false;
  for (
    let stepIndex = 0;
    stepIndex < maximumEventLockStepCount;
    stepIndex += 1
  ) {
    // Complete the intervention during early diastole and hold it before the
    // measured ED and ES events. This avoids fitting two endpoints that were
    // exposed to different instantaneous occlusion levels.
    const ramp = smoothRamp01(Math.min(
      1,
      (stepIndex + 1) / resistanceRampStepCount,
    ));
    const scale = Math.exp(
      Math.log(resistanceScaleStart)
      + (Math.log(resistanceScaleEnd) - Math.log(resistanceScaleStart)) * ramp,
    );
    const protocolStep = stepProtocolAtResistanceScale(
      dependencies,
      state,
      scale,
      policy.integrationTimeStepSec,
      `beat step ${stepIndex + 1}`,
    );
    state = protocolStep.state;
    steps.push(protocolStep);
    const sample = protocolStep.sample;
    if (sample.flowMlPerSec.AoV
        > AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC) {
      forwardAorticSampleCount += 1;
      nonForwardAorticSampleCount = 0;
      if (forwardAorticSampleCount >= sustainedValveEventSampleCount) {
        aorticOpeningObserved = true;
      }
    } else {
      forwardAorticSampleCount = 0;
      if (aorticOpeningObserved) nonForwardAorticSampleCount += 1;
      if (
        aorticOpeningObserved
        && nonForwardAorticSampleCount
          >= sustainedValveEventSampleCount
      ) {
        return Object.freeze({ state, steps: Object.freeze(steps) });
      }
    }
  }
  throw new Error(
    "PV relation protocol could not observe an event-locked aortic opening-to-closure cycle",
  );
}

function alignProtocolStateToAorticClosure(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV2,
  initialState: AcceptedState,
  resistanceScale: number,
  policy: MainWireScientificPvRelationsProtocolPolicyV2,
): AcceptedState {
  const maximumEventLockStepCount = Math.ceil(
    policy.maximumEventLockDurationSec / policy.integrationTimeStepSec,
  );
  const sustainedValveEventSampleCount = Math.max(2, Math.ceil(
    policy.sustainedValveEventDurationSec / policy.integrationTimeStepSec,
  ));
  let state = initialState;
  let forwardAorticSampleCount = 0;
  let nonForwardAorticSampleCount = 0;
  for (
    let stepIndex = 0;
    stepIndex < maximumEventLockStepCount;
    stepIndex += 1
  ) {
    const protocolStep = stepProtocolAtResistanceScale(
      dependencies,
      state,
      resistanceScale,
      policy.integrationTimeStepSec,
      `phase-alignment step ${stepIndex + 1}`,
    );
    state = protocolStep.state;
    const sample = protocolStep.sample;
    if (sample.flowMlPerSec.AoV
        > AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC) {
      forwardAorticSampleCount += 1;
      nonForwardAorticSampleCount = 0;
    } else {
      if (forwardAorticSampleCount >= sustainedValveEventSampleCount) {
        nonForwardAorticSampleCount += 1;
      } else {
        nonForwardAorticSampleCount = 0;
      }
      if (nonForwardAorticSampleCount
          >= sustainedValveEventSampleCount) {
        return state;
      }
    }
  }
  throw new Error(
    "PV relation protocol could not phase-align the source branch to aortic closure",
  );
}

function stepProtocolAtResistanceScale(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV2,
  state: AcceptedState,
  resistanceScale: number,
  dtSec: number,
  context: string,
): ProtocolStep {
  const stepped = stepMainWireFiveWallNonCoronaryV1(
    dependencies.provider,
    state,
    {
      dtSec,
      runtime: dependencies.runtime,
      calciumDriveParams: dependencies.calciumDriveParams,
      pericardium: dependencies.pericardium,
      protocolResistanceScaleByEdge: Object.freeze({
        VC_RA: resistanceScale,
      }),
    },
  );
  if (stepped.converged === false) {
    throw new Error(`PV relation protocol ${context} failed: ${stepped.message}`);
  }
  return Object.freeze({
    state: stepped.acceptedState,
    step: stepped,
    sample: sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
    resistanceScale,
  });
}

function pvBeatFromSteps(input: Readonly<{
  beatIndex: number;
  role: "baseline" | "preload-reduction";
  resistanceScaleStart: number;
  resistanceScaleEnd: number;
  steps: readonly ProtocolStep[];
  fixedTotalBloodVolumeMl: number;
  policy: MainWireScientificPvRelationsProtocolPolicyV2;
}>): MainWireScientificPvRelationBeatV2 {
  const samples = input.steps.map(({ sample }) => sample);
  const sustainedValveEventSampleCount = Math.max(2, Math.ceil(
    input.policy.sustainedValveEventDurationSec
      / input.policy.integrationTimeStepSec,
  ));
  const events = extractMainWireScientificLvRelationEndpointsV2(
    samples,
    sustainedValveEventSampleCount,
  );
  const resistanceScaleAtEndDiastole = events.endDiastolic === null
    ? null
    : input.steps[events.endDiastolic.sampleIndex]?.resistanceScale ?? null;
  const resistanceScaleAtEndSystole = events.endSystolic === null
    ? null
    : input.steps[events.endSystolic.sampleIndex]?.resistanceScale ?? null;
  const scaleTolerance = Math.max(1, input.resistanceScaleEnd) * 1e-10;
  const interventionRampCompletedBeforeEndDiastole =
    resistanceScaleAtEndDiastole !== null
    && resistanceScaleAtEndSystole !== null
    && Math.abs(
      resistanceScaleAtEndDiastole - input.resistanceScaleEnd,
    ) <= scaleTolerance
    && Math.abs(
      resistanceScaleAtEndSystole - input.resistanceScaleEnd,
    ) <= scaleTolerance;
  const totalBloodVolumeAbsoluteErrorMl = input.steps.reduce(
    (maximum, { sample }) => Math.max(
      maximum,
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl),
    ),
    0,
  );
  const maximumContinuityAbsoluteResidualMl = input.steps.reduce(
    (maximum, { sample }) => Math.max(
      maximum,
      Math.abs(sample.diagnostics.maximumContinuityResidualMl),
    ),
    0,
  );
  const strokeWorkTransmuralMmHgMl = strokeWork(samples);
  const strokeVolumeMl = events.endDiastolic !== null
    && events.endSystolic !== null
      ? events.endDiastolic.volumeMl - events.endSystolic.volumeMl
      : Number.NaN;
  const valid = events.endDiastolic !== null
    && events.endSystolic !== null
    && totalBloodVolumeAbsoluteErrorMl <=
      input.policy.maximumTotalBloodVolumeAbsoluteErrorMl
    && maximumContinuityAbsoluteResidualMl <=
      input.policy.maximumContinuityAbsoluteResidualMl
    && interventionRampCompletedBeforeEndDiastole
    && strokeVolumeMl >= input.policy.minimumStrokeVolumeMl
    && strokeWorkTransmuralMmHgMl > 0;
  const netAorticVolumeMl = trapezoidIntegral(
    samples.map((sample) => sample.flowMlPerSec.AoV),
    input.policy.integrationTimeStepSec,
  );
  return Object.freeze({
    beatIndex: input.beatIndex,
    role: input.role,
    vcRaResistanceScaleStart: input.resistanceScaleStart,
    vcRaResistanceScaleEnd: input.resistanceScaleEnd,
    resistanceScaleAtEndDiastole,
    resistanceScaleAtEndSystole,
    interventionRampCompletedBeforeEndDiastole,
    fixedTotalBloodVolumeMl: input.fixedTotalBloodVolumeMl,
    samples: Object.freeze(samples
      .filter((_, index) => index % input.policy.outputStride === 0)
      .map((sample) => Object.freeze({
        phase01: sample.cyclePhase01,
        lvVolumeMl: sample.nodeVolumeMl.LV,
        lvAbsolutePressureMmHg: sample.nodeAbsolutePressureMmHg.LV,
        lvTransmuralPressureMmHg:
          sample.chamberTransmuralPressureMmHg.LV,
      }))),
    endDiastolic: events.endDiastolic,
    endSystolic: events.endSystolic,
    strokeWorkTransmuralMmHgMl,
    meanRapTransmuralMmHg: mean(samples.map(
      (sample) => sample.chamberTransmuralPressureMmHg.RA,
    )),
    meanLapTransmuralMmHg: mean(samples.map(
      (sample) => sample.chamberTransmuralPressureMmHg.LA,
    )),
    netCardiacOutputLMin: netAorticVolumeMl * 60 / 1000,
    totalBloodVolumeAbsoluteErrorMl,
    maximumContinuityAbsoluteResidualMl,
    classification: valid ? "fit-eligible" as const : "rejected" as const,
    valid,
    rejectionReason: valid ? null : invalidBeatReason({
      events,
      totalBloodVolumeAbsoluteErrorMl,
      maximumContinuityAbsoluteResidualMl,
      interventionRampCompletedBeforeEndDiastole,
      strokeVolumeMl,
      strokeWorkTransmuralMmHgMl,
      policy: input.policy,
    }),
  });
}

function evaluateProtocolBeats(
  rawBeats: readonly MainWireScientificPvRelationBeatV2[],
  policy: MainWireScientificPvRelationsProtocolPolicyV2,
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1,
  protocolFailureReason: string | null = null,
): Readonly<{
  beats: readonly MainWireScientificPvRelationBeatV2[];
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV2;
  analysis: MainWireScientificPvRelationsAnalysisV2;
}> {
  const alternansClassified = classifyRampAlternansSuspect(rawBeats);
  const provisionalSelection = selectMainWireScientificPvRelationFitPointsV2(
    alternansClassified,
    policy,
  );
  const included = new Set(provisionalSelection.includedBeatIds);
  const beats = Object.freeze(alternansClassified.map((beat) =>
    beat.valid
    && beat.classification === "fit-eligible"
    && !included.has(beatId(beat))
      ? Object.freeze({
          ...beat,
          classification: "redundant-loading-point" as const,
          rejectionReason:
            "valid loading beat retained for display but excluded from fit because EDV separation was redundant",
        })
      : beat));
  const fitPointSelection = selectMainWireScientificPvRelationFitPointsV2(
    beats,
    policy,
  );
  const analysisPoints = [...buildMainWireScientificPvRelationAnalysisPointsV2(
    beats,
    fitPointSelection,
    baselinePeriodicity,
  )];
  if (protocolFailureReason !== null) {
    analysisPoints.push(Object.freeze({
      pointId: `ivc-beat-${beats.length}-step-failure`,
      protocolKind: "fixed-tbv-ivc-like-preload-reduction" as const,
      role: "preload-reduction" as const,
      totalBloodVolumeMl: beats[0]?.fixedTotalBloodVolumeMl ?? Number.NaN,
      periodicity: "failure" as const,
      failureReason: protocolFailureReason,
    }));
  }
  const edpvrReference = klotzInformedEdpvrReference(beats[0]);
  const rawAnalysis = analyzeMainWireScientificLvPressureVolumeProtocolV1({
    points: analysisPoints,
    edpvrReference,
  });
  return Object.freeze({
    beats,
    fitPointSelection,
    analysis: adaptMainWireScientificPvRelationAnalysisV2(rawAnalysis),
  });
}

function classifyRampAlternansSuspect(
  beats: readonly MainWireScientificPvRelationBeatV2[],
): readonly MainWireScientificPvRelationBeatV2[] {
  const reset = beats.map((beat) => beat.classification === "alternans-suspect-high"
    || beat.classification === "alternans-suspect-low"
      ? Object.freeze({
          ...beat,
          classification: "fit-eligible" as const,
          rejectionReason: null,
        })
      : beat);
  const valid = reset.filter((beat) => beat.valid);
  if (valid.length < 6) return Object.freeze(reset);
  const x = valid.map((beat) => beat.beatIndex);
  const y = valid.map((beat) => beat.strokeWorkTransmuralMmHgMl);
  const meanX = mean(x);
  const meanY = mean(y);
  const denominator = x.reduce(
    (sum, value) => sum + (value - meanX) ** 2,
    0,
  );
  const slope = denominator > 0
    ? x.reduce(
        (sum, value, index) =>
          sum + (value - meanX) * (y[index]! - meanY),
        0,
      ) / denominator
    : 0;
  const residuals = y.map(
    (value, index) => value - (meanY + slope * (x[index]! - meanX)),
  );
  const alternatingTransitions = residuals.slice(1).filter(
    (value, index) => value * residuals[index]! < 0,
  ).length;
  const positive = residuals.filter((value) => value > 0);
  const negative = residuals.filter((value) => value < 0);
  const separation = positive.length > 0 && negative.length > 0
    ? mean(positive) - mean(negative)
    : 0;
  const baselineWork = Math.max(
    Math.abs(valid[0]!.strokeWorkTransmuralMmHgMl),
    1,
  );
  const alternans = alternatingTransitions >= residuals.length - 2
    && separation / baselineWork >= 0.02;
  if (!alternans) return Object.freeze(reset);
  const residualByBeat = new Map(valid.map(
    (beat, index) => [beat.beatIndex, residuals[index]!] as const,
  ));
  return Object.freeze(reset.map((beat) => {
    if (!beat.valid || beat.role === "baseline") return beat;
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

function pvBeatAnalysisMeasurement(
  beat: MainWireScientificPvRelationBeatV2,
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
            beat.endDiastolic.transmuralPressureMmHg,
          endSystolicVolumeMl: beat.endSystolic.volumeMl,
          endSystolicTransmuralPressureMmHg:
            beat.endSystolic.transmuralPressureMmHg,
          strokeWorkMmHgMl: beat.strokeWorkTransmuralMmHgMl,
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

function klotzInformedEdpvrReference(
  baselineBeat: MainWireScientificPvRelationBeatV2 | undefined,
): MainWireScientificEdpvrReferenceV1 {
  const fallback = baselineBeat?.samples.reduce(
    (selected, sample) => sample.lvVolumeMl > selected.lvVolumeMl
      ? sample
      : selected,
    baselineBeat.samples[0] ?? {
      phase01: 0,
      lvVolumeMl: 1,
      lvAbsolutePressureMmHg: 0,
      lvTransmuralPressureMmHg: 0,
    },
  );
  const volumeMl = baselineBeat?.endDiastolic?.volumeMl
    ?? fallback?.lvVolumeMl
    ?? 1;
  const pressureMmHg = baselineBeat?.endDiastolic?.transmuralPressureMmHg
    ?? fallback?.lvTransmuralPressureMmHg
    ?? 0;
  const unboundedReferenceVolumeMl = volumeMl * (0.6 - 0.006 * pressureMmHg);
  return Object.freeze({
    referenceVolumeMl: Math.max(0, Math.min(
      volumeMl - 1e-6,
      unboundedReferenceVolumeMl,
    )),
    referencePressureMmHg: 0,
  });
}

function pressurePoint(
  sample: EndpointSample,
  sampleIndex: number,
): MainWireScientificPvRelationPressurePointV2 {
  const absolutePressureMmHg = sample.nodeAbsolutePressureMmHg.LV;
  const transmuralPressureMmHg = sample.chamberTransmuralPressureMmHg.LV;
  return Object.freeze({
    sampleIndex,
    phase01: sample.cyclePhase01,
    volumeMl: sample.nodeVolumeMl.LV,
    absolutePressureMmHg,
    transmuralPressureMmHg,
    externalPressureMmHg: absolutePressureMmHg - transmuralPressureMmHg,
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
  // This is a genuinely transient path. Adding a synthetic last-to-first
  // chord would make work depend on an unobserved pressure-volume trajectory.
  return -integral;
}

function invalidBeatReason(input: Readonly<{
  events: ReturnType<typeof extractMainWireScientificLvRelationEndpointsV2>;
  totalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  interventionRampCompletedBeforeEndDiastole: boolean;
  strokeVolumeMl: number;
  strokeWorkTransmuralMmHgMl: number;
  policy: MainWireScientificPvRelationsProtocolPolicyV2;
}>): string {
  if (input.events.endDiastolic === null) {
    return "end-diastolic valve event was not detected";
  }
  if (input.events.endSystolic === null) {
    return "end of forward aortic ejection/end-systolic event was not detected";
  }
  if (!input.interventionRampCompletedBeforeEndDiastole) {
    return "VC_RA resistance ramp did not reach its declared target before end diastole";
  }
  if (input.totalBloodVolumeAbsoluteErrorMl
      > input.policy.maximumTotalBloodVolumeAbsoluteErrorMl) {
    return `fixed-TBV conservation error ${input.totalBloodVolumeAbsoluteErrorMl} mL`;
  }
  if (input.maximumContinuityAbsoluteResidualMl
      > input.policy.maximumContinuityAbsoluteResidualMl) {
    return `continuity residual ${input.maximumContinuityAbsoluteResidualMl} mL`;
  }
  if (input.strokeVolumeMl < input.policy.minimumStrokeVolumeMl) {
    return `stroke volume ${input.strokeVolumeMl} mL is below the protocol minimum`;
  }
  return `transmural stroke work ${input.strokeWorkTransmuralMmHgMl} mmHg mL is not positive`;
}

function hasAlternansSuspect(
  beats: readonly MainWireScientificPvRelationBeatV2[],
): boolean {
  return beats.some((beat) => beat.classification === "alternans-suspect-high"
    || beat.classification === "alternans-suspect-low");
}

function sourceIdentity(state: AcceptedState) {
  return Object.freeze({
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    fixedTotalBloodVolumeMl: state.circulation.totalBloodVolumeMl,
  });
}

function beatId(beat: MainWireScientificPvRelationBeatV2): string {
  return `ivc-beat-${beat.beatIndex}`;
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

function minimumFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.min(...finite);
}

function replaceArray<T>(target: T[], values: readonly T[]): void {
  target.splice(0, target.length, ...values);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

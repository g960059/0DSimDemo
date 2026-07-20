import {
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryStepSuccessV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type { FiveWallNormalCalciumDriveParamsV1 } from
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicClassificationStatusV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import { MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type { MainWireNormalAdultFiveWallProviderV1 } from
  "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type { MainWireCommonPericardiumBindingV1 } from
  "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type { NonCoronaryCirculationRuntimeParamsV1 } from
  "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  analyzeMainWireScientificLvPressureVolumeProtocolV1,
  type MainWireScientificEdpvrReferenceV1,
  type MainWireScientificHemodynamicMeasurementV1,
  type MainWireScientificHemodynamicOperatingPointV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import {
  adaptMainWireScientificPvRelationAnalysisV2,
  classifyMainWireScientificPvRelationRegurgitationSupportV2,
  extractMainWireScientificLvRelationEndpointsV2,
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
  resolveMainWireScientificPvRelationsProtocolPolicyV2,
  runMainWireScientificPvRelationsProtocolV2,
  type MainWireScientificPvRelationBeatClassificationV2,
  type MainWireScientificPvRelationBeatV2,
  type MainWireScientificPvRelationDisplaySampleV2,
  type MainWireScientificPvRelationPressurePointV2,
  type MainWireScientificPvRelationsAnalysisV2,
  type MainWireScientificPvRelationsProgressV2,
  type MainWireScientificPvRelationsProtocolOptionsV2,
  type MainWireScientificPvRelationsProtocolPolicyV2,
  type MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";

/**
 * Bidirectional fixed-TBV loading response built as two independent source
 * clones. V2 remains the compatibility contract for the validated lower lane;
 * V3 adds a separately acquired VC_RA-resistance-reduction lane without
 * relabelling it as volume loading, saline loading, PLR, or IVC release.
 */
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID =
  "main-wire-scientific-pv-relations-protocol-v3" as const;
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION =
  "3.0.0" as const;
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_ENDPOINT_POLICY_V3_ID =
  "event-end-forward-aortic-ejection-no-iterative-emax-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY =
  `${MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID}@${MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION}|endpoint=${MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_ENDPOINT_POLICY_V3_ID}` as const;

const AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC = 1;
const MITRAL_FORWARD_FLOW_THRESHOLD_ML_PER_SEC = 1;

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;
type StepSuccess = MainWireFiveWallNonCoronaryStepSuccessV1<MechanicsState>;

export type MainWireScientificPvRelationsProtocolDependenciesV3 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
}>;

export type MainWireScientificPvRelationsHigherLoadingPolicyV3 = Readonly<
  Omit<
    MainWireScientificPvRelationsProtocolPolicyV2,
    "maximumVcRaResistanceScale"
  > & {
    minimumVcRaResistanceScale: number;
  }
>;

export type MainWireScientificPvRelationsProtocolPolicyV3 = Readonly<{
  lowerLoading: MainWireScientificPvRelationsProtocolPolicyV2;
  higherLoading: MainWireScientificPvRelationsHigherLoadingPolicyV3;
}>;

const {
  maximumVcRaResistanceScale: _unusedMaximumVcRaResistanceScale,
  ...higherLoadingDefaults
} = MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2;

export const MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V3 =
  Object.freeze({
    lowerLoading: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    higherLoading: Object.freeze({
      ...higherLoadingDefaults,
      // Deliberately modest. A wider higher-loading envelope requires separate
      // validation rather than assuming reciprocal symmetry with V2's 16x limb.
      minimumVcRaResistanceScale: 0.5,
    }),
  }) satisfies MainWireScientificPvRelationsProtocolPolicyV3;

export type MainWireScientificPvRelationsLaneV3 =
  | "lower-loading"
  | "higher-loading";

export type MainWireScientificPvRelationBeatClassificationV3 =
  | MainWireScientificPvRelationBeatClassificationV2
  | "wrong-direction-loading-point";

export type MainWireScientificPvRelationBeatV3 = Readonly<
  Omit<MainWireScientificPvRelationBeatV2, "role" | "classification"> & {
    beatId: string;
    lane: MainWireScientificPvRelationsLaneV3;
    role: "baseline" | MainWireScientificPvRelationsLaneV3;
    endpointMethod: "end-of-forward-aortic-ejection";
    classification: MainWireScientificPvRelationBeatClassificationV3;
  }
>;

export type MainWireScientificPvRelationFitPointSelectionV3 = Readonly<{
  lane: MainWireScientificPvRelationsLaneV3;
  policy:
    | "baseline-plus-monotonic-EDV-reduction-with-configured-minimum-separation"
    | "baseline-plus-monotonic-EDV-increase-with-configured-minimum-separation";
  minimumEndDiastolicVolumeSeparationMl: number;
  includedBeatIds: readonly string[];
  excludedRedundantBeatIds: readonly string[];
  excludedWrongDirectionBeatIds: readonly string[];
}>;

export type MainWireScientificPvRelationsLaneAnalysisV3 = Readonly<
  Omit<MainWireScientificPvRelationsAnalysisV2, "protocolKind" | "physiologyBoundary"> & {
    protocolKind:
      "fixed-tbv-bidirectional-vc-ra-resistance-perturbation";
    lane: MainWireScientificPvRelationsLaneV3;
    physiologyBoundary: MainWireScientificPvRelationsAnalysisV2[
      "physiologyBoundary"
    ] & Readonly<{
      intervention:
        | "VC_RA-resistance-increase-achieved-lower-EDV"
        | "VC_RA-resistance-decrease-achieved-higher-EDV";
      literalVolumeLoadingClaimed: false;
      pooledBidirectionalRelationClaimed: false;
    }>;
  }
>;

export type MainWireScientificPvRelationsHigherTerminationReasonV3 =
  | "predeclared-higher-loading-span-reached"
  | "maximum-beats-reached"
  | "higher-edv-not-increased"
  | "source-periodicity-gate-failed"
  | "baseline-quality-gate-failed"
  | "alternans-suspect"
  | "unsupported-mitral-or-aortic-regurgitation"
  | "step-failure"
  | "cancelled";

export type MainWireScientificPvRelationsLaneResultV3 = Readonly<{
  lane: MainWireScientificPvRelationsLaneV3;
  sourceCloneIndependent: true;
  intervention:
    | "VC_RA-resistance-increase"
    | "VC_RA-resistance-decrease";
  acquisitionStatus: "accepted" | "rejected";
  terminationReason: string;
  failureReason: string | null;
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1;
  beats: readonly MainWireScientificPvRelationBeatV3[];
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV3;
  analysis: MainWireScientificPvRelationsLaneAnalysisV3;
  achievedEndDiastolicVolumeSpanFraction: number;
  achievedDeclaredEdvDirection: boolean;
}>;

export type MainWireScientificPvRelationsProgressV3 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID;
  protocolVersion: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION;
  protocolCacheIdentity:
    typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY;
  stage: MainWireScientificPvRelationsLaneV3;
  completedUniqueBeatCount: number;
  latestBeat: MainWireScientificPvRelationBeatV3;
  beats: readonly MainWireScientificPvRelationBeatV3[];
  lowerCompletedBeatCount: number;
  higherCompletedBeatCount: number;
  compatibilityProgressV2: MainWireScientificPvRelationsProgressV2 | null;
}>;

export type MainWireScientificPvRelationsProtocolResultV3 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID;
  protocolVersion: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION;
  protocolCacheIdentity:
    typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY;
  source: MainWireScientificPvRelationsProtocolResultV2["source"];
  claim: Readonly<{
    intervention:
      "fixed-TBV-source-cloned-bidirectional-VC_RA-resistance-perturbation";
    higherLoadingSemantics:
      "VC_RA-resistance-decrease-achieved-higher-EDV-not-volume-loading";
    fitPressureSemantics: "LV-transmural-pressure";
    sourceSessionMutated: false;
    totalBloodVolumeVaried: false;
    nonInterventionControlsAndModelParametersFrozen: true;
    lanesPooledIntoSingleRelation: false;
    conventionalPrswClaimed: false;
  }>;
  endpointPolicy: Readonly<{
    endpointPolicyId:
      typeof MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_ENDPOINT_POLICY_V3_ID;
    formalEndSystolicEndpoint: "end-of-forward-aortic-ejection";
    eventEndpointSensitivityRetained: true;
    iterativeMaximumElastance: Readonly<{
      status: "not-supported";
      reason:
        "requires-full-resolution-post-ejection-tail-and-iterative-V0-convergence-validation";
    }>;
  }>;
  policy: MainWireScientificPvRelationsProtocolPolicyV3;
  baseline: MainWireScientificPvRelationBeatV3 | null;
  lanes: Readonly<{
    lowerLoading: MainWireScientificPvRelationsLaneResultV3;
    higherLoading: MainWireScientificPvRelationsLaneResultV3;
  }>;
  beats: readonly MainWireScientificPvRelationBeatV3[];
  pooling: Readonly<{
    status: "not-performed";
    reason:
      "pending-predeclared-direction-equivalence-and-hysteresis-validation";
  }>;
  overallAcquisitionStatus: "accepted" | "rejected";
  compatibilityResultV2: MainWireScientificPvRelationsProtocolResultV2;
}>;

export type MainWireScientificPvRelationsProtocolOptionsV3 = Readonly<{
  policy?: Readonly<{
    lowerLoading?: Partial<MainWireScientificPvRelationsProtocolPolicyV2>;
    higherLoading?: Partial<MainWireScientificPvRelationsHigherLoadingPolicyV3>;
  }>;
  onProgress?: (progress: MainWireScientificPvRelationsProgressV3) => void;
  shouldCancel?: () => boolean;
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

export function resolveMainWireScientificPvRelationsProtocolPolicyV3(
  partial: MainWireScientificPvRelationsProtocolOptionsV3["policy"] = {},
): MainWireScientificPvRelationsProtocolPolicyV3 {
  const lowerLoading = resolveMainWireScientificPvRelationsProtocolPolicyV2(
    partial.lowerLoading,
  );
  const higherCandidate = {
    ...MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V3.higherLoading,
    ...partial.higherLoading,
  };
  const minimumVcRaResistanceScale =
    higherCandidate.minimumVcRaResistanceScale;
  if (!(minimumVcRaResistanceScale > 0)
      || !(minimumVcRaResistanceScale < 1)
      || !Number.isFinite(minimumVcRaResistanceScale)) {
    throw new Error(
      "V3 higher-loading minimum VC_RA resistance scale must be finite and lie strictly between zero and one",
    );
  }
  const {
    minimumVcRaResistanceScale: _minimum,
    ...higherCommon
  } = higherCandidate;
  const validatedCommon = resolveMainWireScientificPvRelationsProtocolPolicyV2({
    ...higherCommon,
    maximumVcRaResistanceScale:
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2
        .maximumVcRaResistanceScale,
  });
  const {
    maximumVcRaResistanceScale: _maximum,
    ...validatedHigherCommon
  } = validatedCommon;
  return Object.freeze({
    lowerLoading,
    higherLoading: Object.freeze({
      ...validatedHigherCommon,
      minimumVcRaResistanceScale,
    }),
  });
}

export function runMainWireScientificPvRelationsProtocolV3(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV3,
  sourceState: AcceptedState,
  options: MainWireScientificPvRelationsProtocolOptionsV3 = {},
): MainWireScientificPvRelationsProtocolResultV3 {
  const policy = resolveMainWireScientificPvRelationsProtocolPolicyV3(
    options.policy,
  );
  let compatibilityProgressV2: MainWireScientificPvRelationsProgressV2 | null =
    null;
  const lowerResultV2 = runMainWireScientificPvRelationsProtocolV2(
    dependencies,
    sourceState,
    Object.freeze({
      policy: policy.lowerLoading,
      shouldCancel: options.shouldCancel,
      onProgress: (progress) => {
        compatibilityProgressV2 = progress;
        const lowerBeats = mapLowerBeats(progress.beats);
        options.onProgress?.(v3Progress({
          stage: "lower-loading",
          lowerBeats,
          higherBeats: Object.freeze([]),
          latestBeat: lowerBeats.at(-1)!,
          compatibilityProgressV2: progress,
        }));
      },
    }) satisfies MainWireScientificPvRelationsProtocolOptionsV2,
  );
  const lowerLoading = lowerLaneResult(lowerResultV2, policy.lowerLoading);
  const higherLoading = runHigherLoadingLane(
    dependencies,
    sourceState,
    policy.higherLoading,
    {
      shouldCancel: options.shouldCancel,
      onProgress: (higherBeats) => {
        const lowerBeats = lowerLoading.beats;
        const combined = combineUniqueLaneBeats(lowerBeats, higherBeats);
        options.onProgress?.(v3Progress({
          stage: "higher-loading",
          lowerBeats,
          higherBeats,
          latestBeat: higherBeats.at(-1)!,
          compatibilityProgressV2,
          combined,
        }));
      },
    },
  );
  const beats = combineUniqueLaneBeats(
    lowerLoading.beats,
    higherLoading.beats,
  );
  const baseline = lowerLoading.beats.find((beat) => beat.role === "baseline")
    ?? higherLoading.beats.find((beat) => beat.role === "baseline")
    ?? null;
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
    protocolVersion: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION,
    protocolCacheIdentity:
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
    source: lowerResultV2.source,
    claim: Object.freeze({
      intervention:
        "fixed-TBV-source-cloned-bidirectional-VC_RA-resistance-perturbation" as const,
      higherLoadingSemantics:
        "VC_RA-resistance-decrease-achieved-higher-EDV-not-volume-loading" as const,
      fitPressureSemantics: "LV-transmural-pressure" as const,
      sourceSessionMutated: false as const,
      totalBloodVolumeVaried: false as const,
      nonInterventionControlsAndModelParametersFrozen: true as const,
      lanesPooledIntoSingleRelation: false as const,
      conventionalPrswClaimed: false as const,
    }),
    endpointPolicy: Object.freeze({
      endpointPolicyId:
        MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_ENDPOINT_POLICY_V3_ID,
      formalEndSystolicEndpoint: "end-of-forward-aortic-ejection" as const,
      eventEndpointSensitivityRetained: true as const,
      iterativeMaximumElastance: Object.freeze({
        status: "not-supported" as const,
        reason:
          "requires-full-resolution-post-ejection-tail-and-iterative-V0-convergence-validation" as const,
      }),
    }),
    policy,
    baseline,
    lanes: Object.freeze({ lowerLoading, higherLoading }),
    beats,
    pooling: Object.freeze({
      status: "not-performed" as const,
      reason:
        "pending-predeclared-direction-equivalence-and-hysteresis-validation" as const,
    }),
    overallAcquisitionStatus:
      lowerLoading.acquisitionStatus === "accepted"
      && higherLoading.acquisitionStatus === "accepted"
        ? "accepted" as const
        : "rejected" as const,
    compatibilityResultV2: lowerResultV2,
  });
}

function mapLowerBeats(
  beats: readonly MainWireScientificPvRelationBeatV2[],
): readonly MainWireScientificPvRelationBeatV3[] {
  return Object.freeze(beats.map((beat) => Object.freeze({
    ...beat,
    beatId: `ivc-beat-${beat.beatIndex}`,
    lane: "lower-loading" as const,
    role: beat.role === "baseline"
      ? "baseline" as const
      : "lower-loading" as const,
    endpointMethod: "end-of-forward-aortic-ejection" as const,
    classification: beat.classification,
  })));
}

function lowerLaneResult(
  result: MainWireScientificPvRelationsProtocolResultV2,
  policy: MainWireScientificPvRelationsProtocolPolicyV2,
): MainWireScientificPvRelationsLaneResultV3 {
  const beats = mapLowerBeats(result.beats);
  const selection = Object.freeze({
    lane: "lower-loading" as const,
    policy:
      "baseline-plus-monotonic-EDV-reduction-with-configured-minimum-separation" as const,
    minimumEndDiastolicVolumeSeparationMl:
      result.fitPointSelection.minimumEndDiastolicVolumeSeparationMl,
    includedBeatIds: result.fitPointSelection.includedBeatIds,
    excludedRedundantBeatIds:
      result.fitPointSelection.excludedRedundantBeatIds,
    excludedWrongDirectionBeatIds: Object.freeze([]),
  });
  const includedBeatIds = new Set(selection.includedBeatIds);
  const spanFraction = achievedEdvSpanFraction(
    beats.filter((beat) => beat.valid && includedBeatIds.has(beat.beatId)),
    "lower-loading",
  );
  const achievedDeclaredEdvDirection = spanFraction > 0;
  const acquisitionStatus =
    result.terminationReason === "predeclared-loading-span-reached"
    && result.baselinePeriodicity === "period1-converged"
    && result.failureReason === null
    && selection.includedBeatIds.length >= policy.minimumFitPointCount
      ? "accepted" as const
      : "rejected" as const;
  return Object.freeze({
    lane: "lower-loading" as const,
    sourceCloneIndependent: true as const,
    intervention: "VC_RA-resistance-increase" as const,
    acquisitionStatus,
    terminationReason: result.terminationReason,
    failureReason: result.failureReason,
    baselinePeriodicity: result.baselinePeriodicity,
    beats,
    fitPointSelection: selection,
    analysis: laneAnalysis(result.analysis, "lower-loading"),
    achievedEndDiastolicVolumeSpanFraction: spanFraction,
    achievedDeclaredEdvDirection,
  });
}

function laneAnalysis(
  analysis: MainWireScientificPvRelationsAnalysisV2,
  lane: MainWireScientificPvRelationsLaneV3,
): MainWireScientificPvRelationsLaneAnalysisV3 {
  return Object.freeze({
    ...analysis,
    protocolKind:
      "fixed-tbv-bidirectional-vc-ra-resistance-perturbation" as const,
    lane,
    physiologyBoundary: Object.freeze({
      ...analysis.physiologyBoundary,
      intervention: lane === "lower-loading"
        ? "VC_RA-resistance-increase-achieved-lower-EDV" as const
        : "VC_RA-resistance-decrease-achieved-higher-EDV" as const,
      literalVolumeLoadingClaimed: false as const,
      pooledBidirectionalRelationClaimed: false as const,
    }),
  });
}

function combineUniqueLaneBeats(
  lowerBeats: readonly MainWireScientificPvRelationBeatV3[],
  higherBeats: readonly MainWireScientificPvRelationBeatV3[],
): readonly MainWireScientificPvRelationBeatV3[] {
  return Object.freeze([
    ...lowerBeats,
    ...higherBeats.filter((beat) => beat.role !== "baseline"),
  ]);
}

function v3Progress(input: Readonly<{
  stage: MainWireScientificPvRelationsLaneV3;
  lowerBeats: readonly MainWireScientificPvRelationBeatV3[];
  higherBeats: readonly MainWireScientificPvRelationBeatV3[];
  latestBeat: MainWireScientificPvRelationBeatV3;
  compatibilityProgressV2: MainWireScientificPvRelationsProgressV2 | null;
  combined?: readonly MainWireScientificPvRelationBeatV3[];
}>): MainWireScientificPvRelationsProgressV3 {
  const beats = input.combined ?? combineUniqueLaneBeats(
    input.lowerBeats,
    input.higherBeats,
  );
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
    protocolVersion: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION,
    protocolCacheIdentity:
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
    stage: input.stage,
    completedUniqueBeatCount: beats.length,
    latestBeat: input.latestBeat,
    beats,
    lowerCompletedBeatCount: input.lowerBeats.length,
    higherCompletedBeatCount: input.higherBeats.length,
    compatibilityProgressV2: input.compatibilityProgressV2,
  });
}

type HigherLaneCallbacks = Readonly<{
  onProgress?: (
    beats: readonly MainWireScientificPvRelationBeatV3[],
  ) => void;
  shouldCancel?: () => boolean;
}>;

type HigherLaneEvaluation = Readonly<{
  beats: readonly MainWireScientificPvRelationBeatV3[];
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV3;
  analysis: MainWireScientificPvRelationsLaneAnalysisV3;
}>;

function runHigherLoadingLane(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV3,
  sourceState: AcceptedState,
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3,
  callbacks: HigherLaneCallbacks,
): MainWireScientificPvRelationsLaneResultV3 {
  const sourceTbvMl = sourceState.circulation.totalBloodVolumeMl;
  const beats: MainWireScientificPvRelationBeatV3[] = [];
  let state = sourceState;
  let baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1 =
    "not-converged";
  let failureReason: string | null = null;
  let terminationReason: MainWireScientificPvRelationsHigherTerminationReasonV3 =
    "maximum-beats-reached";

  const regurgitationSupport =
    classifyMainWireScientificPvRelationRegurgitationSupportV2(
      dependencies.runtime.valvePreset,
    );
  if (!regurgitationSupport.supported) {
    failureReason = [
      "fixed-TBV V3 higher-loading lane is not validated for configured mitral or aortic regurgitation",
      regurgitationSupport.unsupportedBracketIds.length > 0
        ? `(${regurgitationSupport.unsupportedBracketIds.join(", ")})`
        : "(unbracketed reverse effective orifice area)",
    ].join(" ");
    terminationReason = "unsupported-mitral-or-aortic-regurgitation";
  }

  if (failureReason === null) try {
    const phaseAligned = alignProtocolStateToAorticClosureV3(
      dependencies,
      state,
      1,
      policy,
    );
    state = phaseAligned;
    const baseline = runProtocolBeatV3(dependencies, state, 1, 1, policy);
    state = baseline.state;
    const closure = compareMainWireFiveWallAcceptedStatesV1(
      baseline.state,
      phaseAligned,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    baselinePeriodicity =
      closure.overall.maximumNormalizedDelta <=
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
        .period1NormalizedTolerance
        ? "period1-converged"
        : "not-converged";
    beats.push(pvBeatFromStepsV3({
      beatIndex: 0,
      role: "baseline",
      resistanceScaleStart: 1,
      resistanceScaleEnd: 1,
      steps: baseline.steps,
      fixedTotalBloodVolumeMl: sourceTbvMl,
      policy,
    }));
  } catch (error) {
    failureReason = errorMessage(error);
    terminationReason = "step-failure";
  }

  if (failureReason === null && baselinePeriodicity !== "period1-converged") {
    const baseline = beats[0];
    if (baseline !== undefined) beats[0] = Object.freeze({
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
  ) terminationReason = "baseline-quality-gate-failed";

  let previousResistanceScale = 1;
  while (
    failureReason === null
    && baselinePeriodicity === "period1-converged"
    && beats[0]?.valid === true
    && beats.length < policy.maximumTotalBeatCount
  ) {
    if (callbacks.shouldCancel?.() === true) {
      terminationReason = "cancelled";
      break;
    }
    const nextResistanceScale =
      nextMainWireScientificPvRelationHigherResistanceScaleV3({
        beats,
        currentResistanceScale: previousResistanceScale,
        policy,
      });
    try {
      const stepped = runProtocolBeatV3(
        dependencies,
        state,
        previousResistanceScale,
        nextResistanceScale,
        policy,
      );
      state = stepped.state;
      beats.push(pvBeatFromStepsV3({
        beatIndex: beats.length,
        role: "higher-loading",
        resistanceScaleStart: previousResistanceScale,
        resistanceScaleEnd: nextResistanceScale,
        steps: stepped.steps,
        fixedTotalBloodVolumeMl: sourceTbvMl,
        policy,
      }));
      previousResistanceScale = nextResistanceScale;
    } catch (error) {
      failureReason = errorMessage(error);
      terminationReason = "step-failure";
      break;
    }

    const evaluated = evaluateHigherLoadingBeats(
      beats,
      policy,
      baselinePeriodicity,
    );
    replaceArray(beats, evaluated.beats);
    callbacks.onProgress?.(Object.freeze([...beats]));
    if (hasAlternansSuspect(beats)
        && beats.length >= policy.minimumTotalBeatCount) {
      terminationReason = "alternans-suspect";
      break;
    }
    if (canStopMainWireScientificPvRelationsHigherLaneEarlyV3({
      completedBeatCount: beats.length,
      beats,
      policy,
    })) {
      terminationReason = "predeclared-higher-loading-span-reached";
      break;
    }
  }

  let evaluated = evaluateHigherLoadingBeats(
    beats,
    policy,
    baselinePeriodicity,
    failureReason,
  );
  replaceArray(beats, evaluated.beats);
  const selectedBeatIds = new Set(
    evaluated.fitPointSelection.includedBeatIds,
  );
  const achievedSpanFraction = achievedEdvSpanFraction(
    beats.filter((beat) => beat.valid && selectedBeatIds.has(beat.beatId)),
    "higher-loading",
  );
  const achievedDeclaredEdvDirection = achievedSpanFraction > 0;
  if (
    terminationReason === "maximum-beats-reached"
    && !achievedDeclaredEdvDirection
  ) {
    terminationReason = "higher-edv-not-increased";
    failureReason =
      "VC_RA resistance reduction did not produce a separated increase in LV end-diastolic volume";
    evaluated = evaluateHigherLoadingBeats(
      beats,
      policy,
      baselinePeriodicity,
      failureReason,
    );
    replaceArray(beats, evaluated.beats);
  }
  const acquisitionStatus =
    terminationReason === "predeclared-higher-loading-span-reached"
    && evaluated.fitPointSelection.includedBeatIds.length >=
      policy.minimumFitPointCount
    && achievedDeclaredEdvDirection
      ? "accepted" as const
      : "rejected" as const;
  return Object.freeze({
    lane: "higher-loading" as const,
    sourceCloneIndependent: true as const,
    intervention: "VC_RA-resistance-decrease" as const,
    acquisitionStatus,
    terminationReason,
    failureReason,
    baselinePeriodicity,
    beats: Object.freeze([...beats]),
    fitPointSelection: evaluated.fitPointSelection,
    analysis: evaluated.analysis,
    achievedEndDiastolicVolumeSpanFraction: achievedSpanFraction,
    achievedDeclaredEdvDirection,
  });
}

export function nextMainWireScientificPvRelationHigherResistanceScaleV3(
  input: Readonly<{
    beats: readonly MainWireScientificPvRelationBeatV3[];
    currentResistanceScale: number;
    policy: MainWireScientificPvRelationsHigherLoadingPolicyV3;
  }>,
): number {
  const loadingOpportunityCount = input.policy.maximumTotalBeatCount - 1;
  const baseLogDecrement =
    Math.log(1 / input.policy.minimumVcRaResistanceScale)
      / loadingOpportunityCount;
  const completedLoadingBeatCount = Math.max(0, input.beats.length - 1);
  const expectedProgressAtNextBeat = Math.min(
    1,
    (completedLoadingBeatCount + 1)
      / Math.max(1, input.policy.minimumTotalBeatCount - 1),
  );
  const baselineEdv = input.beats[0]?.endDiastolic?.volumeMl ?? null;
  const currentMaximumEdv = maximumFinite(input.beats.map(
    (beat) => beat.valid
      ? beat.endDiastolic?.volumeMl ?? Number.NaN
      : Number.NaN,
  ));
  const observedSpanFraction = baselineEdv !== null
    && baselineEdv > 0
    && currentMaximumEdv !== null
      ? Math.max(0, (currentMaximumEdv - baselineEdv) / baselineEdv)
      : 0;
  const expectedSpanFraction =
    input.policy.targetEndDiastolicVolumeSpanFraction
      * expectedProgressAtNextBeat;
  const paceRatio = expectedSpanFraction > 1e-12
    ? observedSpanFraction / expectedSpanFraction
    : 1;
  const adaptation = paceRatio < 0.7 ? 1.6 : paceRatio > 1.25 ? 0.7 : 1;
  const boundedCurrent = Math.min(1, Math.max(
    input.policy.minimumVcRaResistanceScale,
    input.currentResistanceScale,
  ));
  const nextLogScale = Math.log(boundedCurrent)
    - baseLogDecrement * adaptation;
  return Math.max(
    input.policy.minimumVcRaResistanceScale,
    Math.min(input.currentResistanceScale, Math.exp(nextLogScale)),
  );
}

export function canStopMainWireScientificPvRelationsHigherLaneEarlyV3(
  input: Readonly<{
    completedBeatCount: number;
    beats: readonly MainWireScientificPvRelationBeatV3[];
    policy: MainWireScientificPvRelationsHigherLoadingPolicyV3;
  }>,
): boolean {
  if (input.completedBeatCount < input.policy.minimumTotalBeatCount) return false;
  const selection = selectMainWireScientificPvRelationHigherFitPointsV3(
    input.beats,
    input.policy,
  );
  if (selection.includedBeatIds.length < input.policy.minimumFitPointCount) {
    return false;
  }
  const included = new Set(selection.includedBeatIds);
  const selected = input.beats.filter((beat) => included.has(beat.beatId));
  const baselineEdv = selected.find((beat) => beat.role === "baseline")
    ?.endDiastolic?.volumeMl;
  const maximumEdv = maximumFinite(selected.map(
    (beat) => beat.endDiastolic?.volumeMl ?? Number.NaN,
  ));
  if (baselineEdv === undefined || maximumEdv === null || baselineEdv <= 0) {
    return false;
  }
  return (maximumEdv - baselineEdv) / baselineEdv >=
      input.policy.targetEndDiastolicVolumeSpanFraction;
}

export function selectMainWireScientificPvRelationHigherFitPointsV3(
  beats: readonly MainWireScientificPvRelationBeatV3[],
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3,
): MainWireScientificPvRelationFitPointSelectionV3 {
  const baseline = beats.find((beat) =>
    beat.role === "baseline" && beat.valid && beat.endDiastolic !== null);
  const baselineEdvMl = baseline?.endDiastolic?.volumeMl ?? 0;
  const minimumEndDiastolicVolumeSeparationMl = Math.max(
    policy.minimumEndDiastolicVolumeSeparationMl,
    baselineEdvMl * policy.minimumEndDiastolicVolumeSeparationFractionOfBaseline,
  );
  const includedBeatIds: string[] = baseline === undefined
    ? []
    : [baseline.beatId];
  const excludedRedundantBeatIds: string[] = [];
  const excludedWrongDirectionBeatIds: string[] = [];
  let lastIncludedEdvMl = baselineEdvMl;
  for (const beat of beats) {
    if (beat.role === "baseline" || !beat.valid || beat.endDiastolic === null) {
      continue;
    }
    if (beat.classification === "alternans-suspect-high"
        || beat.classification === "alternans-suspect-low"
        || beat.classification === "rejected") continue;
    if (beat.endDiastolic.volumeMl
        >= lastIncludedEdvMl + minimumEndDiastolicVolumeSeparationMl) {
      includedBeatIds.push(beat.beatId);
      lastIncludedEdvMl = beat.endDiastolic.volumeMl;
    } else if (beat.endDiastolic.volumeMl
        <= baselineEdvMl - minimumEndDiastolicVolumeSeparationMl) {
      excludedWrongDirectionBeatIds.push(beat.beatId);
    } else {
      excludedRedundantBeatIds.push(beat.beatId);
    }
  }
  return Object.freeze({
    lane: "higher-loading" as const,
    policy:
      "baseline-plus-monotonic-EDV-increase-with-configured-minimum-separation" as const,
    minimumEndDiastolicVolumeSeparationMl,
    includedBeatIds: Object.freeze(includedBeatIds),
    excludedRedundantBeatIds: Object.freeze(excludedRedundantBeatIds),
    excludedWrongDirectionBeatIds: Object.freeze(
      excludedWrongDirectionBeatIds,
    ),
  });
}

function evaluateHigherLoadingBeats(
  rawBeats: readonly MainWireScientificPvRelationBeatV3[],
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3,
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1,
  protocolFailureReason: string | null = null,
): HigherLaneEvaluation {
  const alternansClassified = classifyLaneAlternansSuspect(rawBeats);
  const provisionalSelection =
    selectMainWireScientificPvRelationHigherFitPointsV3(
      alternansClassified,
      policy,
    );
  const included = new Set(provisionalSelection.includedBeatIds);
  const wrongDirection = new Set(
    provisionalSelection.excludedWrongDirectionBeatIds,
  );
  const beats = Object.freeze(alternansClassified.map((beat) => {
    if (!beat.valid || beat.classification !== "fit-eligible"
        || included.has(beat.beatId)) return beat;
    if (wrongDirection.has(beat.beatId)) return Object.freeze({
      ...beat,
      classification: "wrong-direction-loading-point" as const,
      rejectionReason:
        "VC_RA resistance reduction produced a separated EDV change in the wrong direction; excluded from the higher-loading fit",
    });
    return Object.freeze({
      ...beat,
      classification: "redundant-loading-point" as const,
      rejectionReason:
        "valid higher-loading beat retained for display but excluded because EDV separation was redundant",
    });
  }));
  const fitPointSelection =
    selectMainWireScientificPvRelationHigherFitPointsV3(beats, policy);
  const analysisPoints = [
    ...buildHigherLoadingAnalysisPoints(beats, fitPointSelection, baselinePeriodicity),
  ];
  if (protocolFailureReason !== null) analysisPoints.push(Object.freeze({
    pointId: `higher-beat-${beats.length}-protocol-failure`,
    protocolKind: "fixed-tbv-ivc-like-preload-reduction" as const,
    role: "preload-reduction" as const,
    totalBloodVolumeMl: beats[0]?.fixedTotalBloodVolumeMl ?? Number.NaN,
    periodicity: "failure" as const,
    failureReason: protocolFailureReason,
  }));
  const rawAnalysis = analyzeMainWireScientificLvPressureVolumeProtocolV1({
    points: analysisPoints,
    edpvrReference: klotzInformedEdpvrReferenceV3(beats[0]),
  });
  return Object.freeze({
    beats,
    fitPointSelection,
    analysis: laneAnalysis(
      adaptMainWireScientificPvRelationAnalysisV2(rawAnalysis),
      "higher-loading",
    ),
  });
}

function buildHigherLoadingAnalysisPoints(
  beats: readonly MainWireScientificPvRelationBeatV3[],
  fitPointSelection: MainWireScientificPvRelationFitPointSelectionV3,
  baselinePeriodicity: MainWireFiveWallPeriodicClassificationStatusV1,
): readonly MainWireScientificHemodynamicOperatingPointV1[] {
  const included = new Set(fitPointSelection.includedBeatIds);
  const points: MainWireScientificHemodynamicOperatingPointV1[] = [];
  for (const beat of beats) {
    const common = Object.freeze({
      pointId: beat.beatId,
      // The shared V1 analyzer is used strictly as a numerical fitting kernel.
      // laneAnalysis() replaces this compatibility vocabulary before V3 export.
      protocolKind: "fixed-tbv-ivc-like-preload-reduction" as const,
      role: beat.role === "baseline"
        ? "baseline" as const
        : "preload-reduction" as const,
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
          ?? "alternans-suspect evidence during higher-loading ramp",
      }));
    } else if (!beat.valid || beat.classification === "rejected"
        || beat.classification === "wrong-direction-loading-point") {
      points.push(Object.freeze({
        ...common,
        periodicity: "failure" as const,
        failureReason: beat.rejectionReason ?? "invalid higher-loading beat",
      }));
    } else if (included.has(beat.beatId)) {
      points.push(Object.freeze({
        ...common,
        periodicity: "transient-fit-eligible" as const,
        measurement: pvBeatAnalysisMeasurementV3(beat),
      }));
    }
  }
  return Object.freeze(points);
}

function classifyLaneAlternansSuspect(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): readonly MainWireScientificPvRelationBeatV3[] {
  const reset = beats.map((beat) =>
    beat.classification === "alternans-suspect-high"
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
        "alternating stroke-work residuals within the higher-loading lane; excluded as alternans-suspect",
    });
  }));
}

function runProtocolBeatV3(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV3,
  initialState: AcceptedState,
  resistanceScaleStart: number,
  resistanceScaleEnd: number,
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3,
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
    const ramp = smoothRamp01(Math.min(
      1,
      (stepIndex + 1) / resistanceRampStepCount,
    ));
    const scale = Math.exp(
      Math.log(resistanceScaleStart)
      + (Math.log(resistanceScaleEnd) - Math.log(resistanceScaleStart)) * ramp,
    );
    const protocolStep = stepProtocolAtResistanceScaleV3(
      dependencies,
      state,
      scale,
      policy.integrationTimeStepSec,
      `higher-loading beat step ${stepIndex + 1}`,
    );
    state = protocolStep.state;
    steps.push(protocolStep);
    const sample = protocolStep.sample;
    if (sample.flowMlPerSec.AoV > AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC) {
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
        && nonForwardAorticSampleCount >= sustainedValveEventSampleCount
      ) return Object.freeze({ state, steps: Object.freeze(steps) });
    }
  }
  throw new Error(
    "V3 higher-loading lane could not observe an event-locked aortic opening-to-closure cycle",
  );
}

function alignProtocolStateToAorticClosureV3(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV3,
  initialState: AcceptedState,
  resistanceScale: number,
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3,
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
    const protocolStep = stepProtocolAtResistanceScaleV3(
      dependencies,
      state,
      resistanceScale,
      policy.integrationTimeStepSec,
      `higher-loading phase-alignment step ${stepIndex + 1}`,
    );
    state = protocolStep.state;
    const sample = protocolStep.sample;
    if (sample.flowMlPerSec.AoV > AORTIC_FORWARD_FLOW_THRESHOLD_ML_PER_SEC) {
      forwardAorticSampleCount += 1;
      nonForwardAorticSampleCount = 0;
    } else {
      if (forwardAorticSampleCount >= sustainedValveEventSampleCount) {
        nonForwardAorticSampleCount += 1;
      } else {
        nonForwardAorticSampleCount = 0;
      }
      if (nonForwardAorticSampleCount >= sustainedValveEventSampleCount) {
        return state;
      }
    }
  }
  throw new Error(
    "V3 higher-loading lane could not phase-align source clone to aortic closure",
  );
}

function stepProtocolAtResistanceScaleV3(
  dependencies: MainWireScientificPvRelationsProtocolDependenciesV3,
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
    throw new Error(`V3 ${context} failed: ${stepped.message}`);
  }
  return Object.freeze({
    state: stepped.acceptedState,
    step: stepped,
    sample: sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
    resistanceScale,
  });
}

function pvBeatFromStepsV3(input: Readonly<{
  beatIndex: number;
  role: "baseline" | "higher-loading";
  resistanceScaleStart: number;
  resistanceScaleEnd: number;
  steps: readonly ProtocolStep[];
  fixedTotalBloodVolumeMl: number;
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3;
}>): MainWireScientificPvRelationBeatV3 {
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
  const scaleTolerance = Math.max(1, Math.abs(input.resistanceScaleEnd)) * 1e-10;
  const interventionRampCompletedBeforeEndDiastole =
    resistanceScaleAtEndDiastole !== null
    && resistanceScaleAtEndSystole !== null
    && Math.abs(resistanceScaleAtEndDiastole - input.resistanceScaleEnd)
      <= scaleTolerance
    && Math.abs(resistanceScaleAtEndSystole - input.resistanceScaleEnd)
      <= scaleTolerance;
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
    beatId: `higher-beat-${input.beatIndex}`,
    beatIndex: input.beatIndex,
    lane: "higher-loading" as const,
    role: input.role,
    endpointMethod: "end-of-forward-aortic-ejection" as const,
    vcRaResistanceScaleStart: input.resistanceScaleStart,
    vcRaResistanceScaleEnd: input.resistanceScaleEnd,
    resistanceScaleAtEndDiastole,
    resistanceScaleAtEndSystole,
    interventionRampCompletedBeforeEndDiastole,
    fixedTotalBloodVolumeMl: input.fixedTotalBloodVolumeMl,
    samples: Object.freeze(samples
      .filter((_, index) => index % input.policy.outputStride === 0)
      .map((sample): MainWireScientificPvRelationDisplaySampleV2 =>
        Object.freeze({
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
    rejectionReason: valid ? null : invalidBeatReasonV3({
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

function pvBeatAnalysisMeasurementV3(
  beat: MainWireScientificPvRelationBeatV3,
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

function klotzInformedEdpvrReferenceV3(
  baselineBeat: MainWireScientificPvRelationBeatV3 | undefined,
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

function invalidBeatReasonV3(input: Readonly<{
  events: ReturnType<typeof extractMainWireScientificLvRelationEndpointsV2>;
  totalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  interventionRampCompletedBeforeEndDiastole: boolean;
  strokeVolumeMl: number;
  strokeWorkTransmuralMmHgMl: number;
  policy: MainWireScientificPvRelationsHigherLoadingPolicyV3;
}>): string {
  if (input.events.endDiastolic === null) {
    return "end-diastolic valve event was not detected";
  }
  if (input.events.endSystolic === null) {
    return "end of forward aortic ejection/end-systolic event was not detected";
  }
  if (!input.interventionRampCompletedBeforeEndDiastole) {
    return "VC_RA resistance-reduction ramp did not reach its target before end diastole";
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
  return `transmural path work ${input.strokeWorkTransmuralMmHgMl} mmHg mL is not positive`;
}

function achievedEdvSpanFraction(
  beats: readonly MainWireScientificPvRelationBeatV3[],
  lane: MainWireScientificPvRelationsLaneV3,
): number {
  const baselineEdv = beats.find((beat) => beat.role === "baseline")
    ?.endDiastolic?.volumeMl;
  if (baselineEdv === undefined || !(baselineEdv > 0)) return 0;
  const endpoint = lane === "lower-loading"
    ? minimumFinite(beats.map((beat) =>
        beat.endDiastolic?.volumeMl ?? Number.NaN))
    : maximumFinite(beats.map((beat) =>
        beat.endDiastolic?.volumeMl ?? Number.NaN));
  if (endpoint === null) return 0;
  return lane === "lower-loading"
    ? Math.max(0, (baselineEdv - endpoint) / baselineEdv)
    : Math.max(0, (endpoint - baselineEdv) / baselineEdv);
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
  return -integral;
}

function hasAlternansSuspect(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): boolean {
  return beats.some((beat) => beat.classification === "alternans-suspect-high"
    || beat.classification === "alternans-suspect-low");
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

function maximumFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.max(...finite);
}

function replaceArray<T>(target: T[], values: readonly T[]): void {
  target.splice(0, target.length, ...values);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

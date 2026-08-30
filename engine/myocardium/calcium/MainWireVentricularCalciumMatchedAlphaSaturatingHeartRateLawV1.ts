import {
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import { MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID =
  "main-wire-ventricular-calcium-matched-alpha-saturating-heart-rate-law-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1 =
  60 as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1 =
  0.4 as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_RANGE_V1 =
  Object.freeze({ lower: 0.25 as const, upper: 0.66 as const });

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1 =
  Object.freeze({
    sourceFitAnchor: Object.freeze({
      classification: "source-derived-fact" as const,
      scope:
        "HR60 matched-alpha ventricular calcium time constant from the existing source-only fit" as const,
      doi: "10.1016/j.yjmcc.2017.03.008" as const,
    }),
    humanRateTimingDirection: Object.freeze([
      Object.freeze({
        classification: "data-supported-fact" as const,
        scope:
          "contraction and relaxation timing shortened with pacing rate in nonfailing human left-ventricular trabeculae" as const,
        doi: "10.1152/ajpheart.00163.2019" as const,
        limitation:
          "tissue force timing is not the matched-alpha calcium component time constant" as const,
      }),
      Object.freeze({
        classification: "data-supported-fact" as const,
        scope:
          "calcium decay and onset-off timing shortened with pacing rate in cultured failing-human myocardial slices" as const,
        doi: "10.1038/s42003-024-05886-3" as const,
        limitation:
          "failing donor tissue and prolonged slice culture limit transfer to a normal-heart prior" as const,
      }),
    ]),
    reducedOrderClosure: Object.freeze({
      classification: "mechanistic-inference" as const,
      scope:
        "a common weak rate-dependent calcium time constant represents unresolved rate-dependent calcium handling without a new cycling state" as const,
      supportingDoi: "10.1371/journal.pcbi.1002061" as const,
    }),
    boundedFunctionalFormAndCoefficient: Object.freeze({
      classification: "fixed-model-hypothesis" as const,
      scope:
        "the bounded log-symmetric coordinate, common rise-decay law, central coefficient 0.40, and prior endpoints 0.25 and 0.66" as const,
      hemodynamicOutcomeUsed: false as const,
      parameterSearchOrFitting: false as const,
    }),
  });

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1 =
  Object.freeze([
    "matched-alpha-saturating-hr-law-a040-hr-50",
    "matched-alpha-saturating-hr-law-a040-hr-60",
    "matched-alpha-saturating-hr-law-a040-hr-75",
    "matched-alpha-saturating-hr-law-a040-hr-90",
  ] as const);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1 =
  Object.freeze([
    "matched-alpha-saturating-hr-law-a025-hr-50",
    "matched-alpha-saturating-hr-law-a025-hr-90",
    "matched-alpha-saturating-hr-law-a066-hr-50",
    "matched-alpha-saturating-hr-law-a066-hr-90",
  ] as const);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1 =
  Object.freeze([
    ...MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
    ...MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1,
  ] as const);

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawPriorSensitivityProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1 =
  50 | 60 | 75 | 90;

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1 =
  0.25 | 0.4 | 0.66;

export type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1 =
  Readonly<{
    profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1;
    designRole: "main-four-heart-rate-design" | "endpoint-prior-sensitivity";
    heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1;
    cycleLengthSec: number;
    referenceHeartRateBpm: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1;
    dimensionlessRateCoefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1;
    heartRateSaturationCoordinate: number;
    ventricularTimeConstantScaleFromHr60SourceFit: number;
    ventricularRiseTimeConstantSec: number;
    ventricularDecayTimeConstantSec: number;
    globalMathematicalTimeConstantScaleLowerExclusive: number;
    globalMathematicalTimeConstantScaleUpperExclusive: number;
    localLogTimeConstantVsLogHeartRateElasticityAtHr60: number;
    waveformFamily: "periodic-normalized-biexponential-exact-alpha-limit";
    ventricularPulseTimeToPeakSec: number;
    ventricularNormalizedPulseCycleIntegralSec: number;
    ventricularDiastolicCalciumUM: number;
    ventricularPeakCalciumUM: number;
    ventricularElectricalToCalciumDelaySec: 0.012;
    atrioventricularDelaySec: 0.12;
    sourceFitProfileId: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId;
    evidence: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1;
    hr60FixedAbsoluteTimeControlParamsIdentityReusedExactly: boolean;
    atrialParamsRetainedExactlyFromFixedControl: true;
    ventricularExtremaRetainedExactlyFromFixedControl: true;
    ventricularElectricalToCalciumDelayRetainedExactly: true;
    onlyVentricularRiseAndDecayTimeConstantsEligibleToDifferFromFixedControl: true;
    periodicCarryRecomputedForCycleLength: true;
    fixedDiscreteCandidate: true;
    arbitraryNumericResolverExposed: false;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
  }>;

const SOURCE_TAU_SEC =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.ventricularRiseTimeConstantSec;
const FIXED_ATRIOVENTRICULAR_DELAY_SEC = 0.12 as const;
const FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC = 0.012 as const;

if (
  SOURCE_TAU_SEC !==
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.ventricularDecayTimeConstantSec
) {
  throw new Error(
    "matched-alpha saturating heart-rate law requires the exact source alpha limit",
  );
}

function fixedControlProfileId(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
):
  | "absolute-time-alpha-fit-hr-50"
  | "absolute-time-alpha-fit-hr-60"
  | "absolute-time-alpha-fit-hr-75"
  | "absolute-time-alpha-fit-hr-90" {
  return `absolute-time-alpha-fit-hr-${heartRateBpm}`;
}

function saturationCoordinate(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
): number {
  const referenceHeartRateBpm =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1;
  return (
    (heartRateBpm - referenceHeartRateBpm) /
    (heartRateBpm + referenceHeartRateBpm)
  );
}

function timeConstantScale(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  coefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
): number {
  return Math.exp(-coefficient * saturationCoordinate(heartRateBpm));
}

function rateDependentParams(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  coefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
): FiveWallNormalCalciumDriveParamsV1 {
  const control = resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
    fixedControlProfileId(heartRateBpm),
  );
  if (
    heartRateBpm ===
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1 &&
    coefficient ===
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1
  ) {
    return control;
  }
  const tauSec = SOURCE_TAU_SEC * timeConstantScale(heartRateBpm, coefficient);
  return Object.freeze({
    ...control,
    parameterSetId: `${control.parameterSetId}-${profileId}-v1`,
    ventricular: Object.freeze({
      ...control.ventricular,
      riseTimeConstantSec: tauSec,
      decayTimeConstantSec: tauSec,
    }),
  });
}

const PARAMS_BY_PROFILE_ID = Object.freeze({
  "matched-alpha-saturating-hr-law-a040-hr-50": rateDependentParams(
    "matched-alpha-saturating-hr-law-a040-hr-50",
    50,
    0.4,
  ),
  "matched-alpha-saturating-hr-law-a040-hr-60": rateDependentParams(
    "matched-alpha-saturating-hr-law-a040-hr-60",
    60,
    0.4,
  ),
  "matched-alpha-saturating-hr-law-a040-hr-75": rateDependentParams(
    "matched-alpha-saturating-hr-law-a040-hr-75",
    75,
    0.4,
  ),
  "matched-alpha-saturating-hr-law-a040-hr-90": rateDependentParams(
    "matched-alpha-saturating-hr-law-a040-hr-90",
    90,
    0.4,
  ),
  "matched-alpha-saturating-hr-law-a025-hr-50": rateDependentParams(
    "matched-alpha-saturating-hr-law-a025-hr-50",
    50,
    0.25,
  ),
  "matched-alpha-saturating-hr-law-a025-hr-90": rateDependentParams(
    "matched-alpha-saturating-hr-law-a025-hr-90",
    90,
    0.25,
  ),
  "matched-alpha-saturating-hr-law-a066-hr-50": rateDependentParams(
    "matched-alpha-saturating-hr-law-a066-hr-50",
    50,
    0.66,
  ),
  "matched-alpha-saturating-hr-law-a066-hr-90": rateDependentParams(
    "matched-alpha-saturating-hr-law-a066-hr-90",
    90,
    0.66,
  ),
} satisfies Readonly<
  Record<
    MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
    FiveWallNormalCalciumDriveParamsV1
  >
>);

function profile(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
  designRole: "main-four-heart-rate-design" | "endpoint-prior-sensitivity",
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  coefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
): MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1 {
  const params = PARAMS_BY_PROFILE_ID[profileId];
  const control = resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
    fixedControlProfileId(heartRateBpm),
  );
  const coordinate = saturationCoordinate(heartRateBpm);
  const scale = timeConstantScale(heartRateBpm, coefficient);
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    params.cycleLengthSec,
    params.ventricular.riseTimeConstantSec,
    params.ventricular.decayTimeConstantSec,
  );
  if (
    shape.shapeRegime !== "alpha-limit" ||
    params.cycleLengthSec !== 60 / heartRateBpm ||
    params.atrioventricularDelaySec !== FIXED_ATRIOVENTRICULAR_DELAY_SEC ||
    params.atrioventricularDelaySec !== control.atrioventricularDelaySec ||
    params.atrial !== control.atrial ||
    params.ventricular.diastolicCalciumUM !==
      control.ventricular.diastolicCalciumUM ||
    params.ventricular.peakAmplitudeUM !==
      control.ventricular.peakAmplitudeUM ||
    params.ventricular.electricalToCalciumDelaySec !==
      FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC ||
    params.ventricular.riseTimeConstantSec !== SOURCE_TAU_SEC * scale ||
    params.ventricular.decayTimeConstantSec !== SOURCE_TAU_SEC * scale
  ) {
    throw new Error(
      "matched-alpha saturating heart-rate law factor matching failed",
    );
  }
  return Object.freeze({
    profileId,
    designRole,
    heartRateBpm,
    cycleLengthSec: params.cycleLengthSec,
    referenceHeartRateBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1,
    dimensionlessRateCoefficient: coefficient,
    heartRateSaturationCoordinate: coordinate,
    ventricularTimeConstantScaleFromHr60SourceFit: scale,
    ventricularRiseTimeConstantSec: params.ventricular.riseTimeConstantSec,
    ventricularDecayTimeConstantSec: params.ventricular.decayTimeConstantSec,
    globalMathematicalTimeConstantScaleLowerExclusive: Math.exp(-coefficient),
    globalMathematicalTimeConstantScaleUpperExclusive: Math.exp(coefficient),
    localLogTimeConstantVsLogHeartRateElasticityAtHr60: -0.5 * coefficient,
    waveformFamily:
      "periodic-normalized-biexponential-exact-alpha-limit" as const,
    ventricularPulseTimeToPeakSec: shape.timeToPeakSec,
    ventricularNormalizedPulseCycleIntegralSec:
      shape.normalizedPulseCycleIntegralSec,
    ventricularDiastolicCalciumUM: params.ventricular.diastolicCalciumUM,
    ventricularPeakCalciumUM:
      params.ventricular.diastolicCalciumUM +
      params.ventricular.peakAmplitudeUM,
    ventricularElectricalToCalciumDelaySec:
      FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    sourceFitProfileId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId,
    evidence:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1,
    hr60FixedAbsoluteTimeControlParamsIdentityReusedExactly:
      params === control && heartRateBpm === 60 && coefficient === 0.4,
    atrialParamsRetainedExactlyFromFixedControl: true as const,
    ventricularExtremaRetainedExactlyFromFixedControl: true as const,
    ventricularElectricalToCalciumDelayRetainedExactly: true as const,
    onlyVentricularRiseAndDecayTimeConstantsEligibleToDifferFromFixedControl:
      true as const,
    periodicCarryRecomputedForCycleLength: true as const,
    fixedDiscreteCandidate: true as const,
    arbitraryNumericResolverExposed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILES_V1 =
  Object.freeze({
    "matched-alpha-saturating-hr-law-a040-hr-50": profile(
      "matched-alpha-saturating-hr-law-a040-hr-50",
      "main-four-heart-rate-design",
      50,
      0.4,
    ),
    "matched-alpha-saturating-hr-law-a040-hr-60": profile(
      "matched-alpha-saturating-hr-law-a040-hr-60",
      "main-four-heart-rate-design",
      60,
      0.4,
    ),
    "matched-alpha-saturating-hr-law-a040-hr-75": profile(
      "matched-alpha-saturating-hr-law-a040-hr-75",
      "main-four-heart-rate-design",
      75,
      0.4,
    ),
    "matched-alpha-saturating-hr-law-a040-hr-90": profile(
      "matched-alpha-saturating-hr-law-a040-hr-90",
      "main-four-heart-rate-design",
      90,
      0.4,
    ),
    "matched-alpha-saturating-hr-law-a025-hr-50": profile(
      "matched-alpha-saturating-hr-law-a025-hr-50",
      "endpoint-prior-sensitivity",
      50,
      0.25,
    ),
    "matched-alpha-saturating-hr-law-a025-hr-90": profile(
      "matched-alpha-saturating-hr-law-a025-hr-90",
      "endpoint-prior-sensitivity",
      90,
      0.25,
    ),
    "matched-alpha-saturating-hr-law-a066-hr-50": profile(
      "matched-alpha-saturating-hr-law-a066-hr-50",
      "endpoint-prior-sensitivity",
      50,
      0.66,
    ),
    "matched-alpha-saturating-hr-law-a066-hr-90": profile(
      "matched-alpha-saturating-hr-law-a066-hr-90",
      "endpoint-prior-sensitivity",
      90,
      0.66,
    ),
  } satisfies Readonly<
    Record<
      MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
      MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1
    >
  >);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-anchored-bounded-heart-rate-calcium-timing-law" as const,
    formula: "s=(HR-60)/(HR+60); tau_rise=tau_decay=tau0*exp(-a*s)" as const,
    equivalentCoordinate: "s=tanh(0.5*ln(HR/60))" as const,
    sourceTauSec: SOURCE_TAU_SEC,
    mainCoefficient:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
    priorCoefficientRange:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_RANGE_V1,
    declaredPhysiologicalEvaluationEnvelopeBpm: Object.freeze({
      lower: 30 as const,
      upper: 180 as const,
    }),
    mathematicallyPositiveAndBoundedForEveryPositiveHeartRate: true as const,
    globalScaleBoundsForCoefficientA:
      "exp(-a)<tau(HR)/tau0<exp(a) for every finite HR>0" as const,
    exactHr60FixedAbsoluteTimeControlParamsIdentity: true as const,
    exactHr60SourceFitVentricularWaveformAndTimeConstantAnchor: true as const,
    riseAndDecayShareOneTimeConstant: true as const,
    separateFirstOrderRiseDecayHeartRateSlopesIntroduced: false as const,
    alphaAnchorAndDecayNotFasterThanRiseImplyZeroHr60LogRatioSlope:
      true as const,
    ventricularCalciumExtremaHeldExactly: true as const,
    ventricularElectricalToCalciumDelayHeldAtSec: 0.012 as const,
    atrioventricularDelayHeldAtSec: 0.12 as const,
    atrialCalciumParamsHeldExactly: true as const,
    periodicCarryRecomputedAtEachCycleLength: true as const,
    forceFrequencyRelationModeled: false as const,
    calciumCyclingStateModeled: false as const,
    dynamicRateHistoryModeled: false as const,
    fixedSteadyRateProfilesOnly: true as const,
    arbitraryNumericHeartRateOrCoefficientResolverExposed: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    evidence:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_EVIDENCE_V1,
  });

export function resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
): MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1 {
  if (
    !Object.prototype.hasOwnProperty.call(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILES_V1,
      profileId,
    )
  ) {
    throw new Error(
      `unsupported matched-alpha saturating heart-rate law profile: ${String(profileId)}`,
    );
  }
  return MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILES_V1[
    profileId
  ];
}

export function resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (!Object.prototype.hasOwnProperty.call(PARAMS_BY_PROFILE_ID, profileId)) {
    throw new Error(
      `unsupported matched-alpha saturating heart-rate law profile: ${String(profileId)}`,
    );
  }
  return PARAMS_BY_PROFILE_ID[profileId];
}

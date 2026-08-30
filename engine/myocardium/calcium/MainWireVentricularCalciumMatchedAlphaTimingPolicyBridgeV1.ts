import {
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import { MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID =
  "main-wire-ventricular-calcium-matched-alpha-timing-policy-bridge-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1 =
  Object.freeze([
    "matched-alpha-fixed-absolute-time-hr-50",
    "matched-alpha-fixed-absolute-time-hr-90",
    "matched-alpha-rr-scaled-tau-hr-50",
    "matched-alpha-rr-scaled-tau-hr-90",
  ] as const);

export type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumMatchedAlphaTimingPolicyV1 =
  "fixed-absolute-time" | "rr-scaled-tau";

export type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1 =
  50 | 90;

export type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1 =
  Readonly<{
    profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1;
    timingPolicy: MainWireVentricularCalciumMatchedAlphaTimingPolicyV1;
    heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1;
    cycleLengthSec: number;
    cycleLengthScaleFromHr60: number;
    waveformFamily: "periodic-normalized-biexponential-exact-alpha-limit";
    sourceFitProfileId: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId;
    fixedAbsoluteTimeControlProfileId:
      "absolute-time-alpha-fit-hr-50" | "absolute-time-alpha-fit-hr-90";
    ventricularRiseTimeConstantSec: number;
    ventricularDecayTimeConstantSec: number;
    ventricularTimeConstantScaleFromSourceFit: number;
    ventricularPulseTimeToPeakSec: number;
    ventricularPulsePeakPhase01: number;
    ventricularNormalizedPulseCycleIntegralSec: number;
    ventricularDiastolicCalciumUM: number;
    ventricularPeakCalciumUM: number;
    ventricularElectricalToCalciumDelaySec: 0.012;
    atrioventricularDelaySec: 0.12;
    atrialParamsRetainedExactlyFromFixedControl: true;
    ventricularExtremaRetainedExactlyFromFixedControl: true;
    ventricularElectricalToCalciumDelayRetainedExactly: true;
    onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy: true;
    physiologicalRateAdaptationClaimed: false;
    fixedDiscreteCandidate: true;
    parameterSearchOrFitting: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
  }>;

const REFERENCE_CYCLE_LENGTH_SEC = 1;
const FIXED_ATRIOVENTRICULAR_DELAY_SEC = 0.12 as const;
const FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC = 0.012 as const;
const SOURCE_TAU_SEC =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.ventricularRiseTimeConstantSec;

if (
  SOURCE_TAU_SEC !==
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.ventricularDecayTimeConstantSec
) {
  throw new Error(
    "matched-alpha bridge requires the exact alpha-limit source fit",
  );
}

function fixedControlProfileId(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1,
): "absolute-time-alpha-fit-hr-50" | "absolute-time-alpha-fit-hr-90" {
  return heartRateBpm === 50
    ? "absolute-time-alpha-fit-hr-50"
    : "absolute-time-alpha-fit-hr-90";
}

function cycleLengthSec(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1,
): number {
  return 60 / heartRateBpm;
}

function rrScaledTauParams(
  profileId:
    "matched-alpha-rr-scaled-tau-hr-50" | "matched-alpha-rr-scaled-tau-hr-90",
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1,
): FiveWallNormalCalciumDriveParamsV1 {
  const control = resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
    fixedControlProfileId(heartRateBpm),
  );
  const scale = cycleLengthSec(heartRateBpm) / REFERENCE_CYCLE_LENGTH_SEC;
  if (
    control.ventricular.riseTimeConstantSec !== SOURCE_TAU_SEC ||
    control.ventricular.decayTimeConstantSec !== SOURCE_TAU_SEC ||
    control.ventricular.electricalToCalciumDelaySec !==
      FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC ||
    control.atrioventricularDelaySec !== FIXED_ATRIOVENTRICULAR_DELAY_SEC
  ) {
    throw new Error("matched-alpha bridge fixed control identity mismatch");
  }
  return Object.freeze({
    ...control,
    parameterSetId: `${control.parameterSetId}-${profileId}-rr-scaled-tau-v1`,
    ventricular: Object.freeze({
      ...control.ventricular,
      riseTimeConstantSec: SOURCE_TAU_SEC * scale,
      decayTimeConstantSec: SOURCE_TAU_SEC * scale,
    }),
  });
}

const PARAMS_BY_PROFILE_ID = Object.freeze({
  "matched-alpha-fixed-absolute-time-hr-50":
    resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
      "absolute-time-alpha-fit-hr-50",
    ),
  "matched-alpha-fixed-absolute-time-hr-90":
    resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
      "absolute-time-alpha-fit-hr-90",
    ),
  "matched-alpha-rr-scaled-tau-hr-50": rrScaledTauParams(
    "matched-alpha-rr-scaled-tau-hr-50",
    50,
  ),
  "matched-alpha-rr-scaled-tau-hr-90": rrScaledTauParams(
    "matched-alpha-rr-scaled-tau-hr-90",
    90,
  ),
} satisfies Readonly<
  Record<
    MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
    FiveWallNormalCalciumDriveParamsV1
  >
>);

function profile(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
  timingPolicy: MainWireVentricularCalciumMatchedAlphaTimingPolicyV1,
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1,
): MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1 {
  const params = PARAMS_BY_PROFILE_ID[profileId];
  const control = resolveMainWireVentricularCalciumHeartRateHypothesisParamsV1(
    fixedControlProfileId(heartRateBpm),
  );
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    params.cycleLengthSec,
    params.ventricular.riseTimeConstantSec,
    params.ventricular.decayTimeConstantSec,
  );
  if (
    shape.shapeRegime !== "alpha-limit" ||
    params.cycleLengthSec !== cycleLengthSec(heartRateBpm) ||
    params.atrioventricularDelaySec !== FIXED_ATRIOVENTRICULAR_DELAY_SEC ||
    params.atrial !== control.atrial ||
    params.ventricular.diastolicCalciumUM !==
      control.ventricular.diastolicCalciumUM ||
    params.ventricular.peakAmplitudeUM !==
      control.ventricular.peakAmplitudeUM ||
    params.ventricular.electricalToCalciumDelaySec !==
      FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC
  ) {
    throw new Error("matched-alpha bridge factor matching failed");
  }
  return Object.freeze({
    profileId,
    timingPolicy,
    heartRateBpm,
    cycleLengthSec: params.cycleLengthSec,
    cycleLengthScaleFromHr60:
      params.cycleLengthSec / REFERENCE_CYCLE_LENGTH_SEC,
    waveformFamily:
      "periodic-normalized-biexponential-exact-alpha-limit" as const,
    sourceFitProfileId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_V1.profileId,
    fixedAbsoluteTimeControlProfileId: fixedControlProfileId(heartRateBpm),
    ventricularRiseTimeConstantSec: params.ventricular.riseTimeConstantSec,
    ventricularDecayTimeConstantSec: params.ventricular.decayTimeConstantSec,
    ventricularTimeConstantScaleFromSourceFit:
      params.ventricular.riseTimeConstantSec / SOURCE_TAU_SEC,
    ventricularPulseTimeToPeakSec: shape.timeToPeakSec,
    ventricularPulsePeakPhase01: shape.timeToPeakSec / params.cycleLengthSec,
    ventricularNormalizedPulseCycleIntegralSec:
      shape.normalizedPulseCycleIntegralSec,
    ventricularDiastolicCalciumUM: params.ventricular.diastolicCalciumUM,
    ventricularPeakCalciumUM:
      params.ventricular.diastolicCalciumUM +
      params.ventricular.peakAmplitudeUM,
    ventricularElectricalToCalciumDelaySec:
      FIXED_VENTRICULAR_ELECTRICAL_TO_CALCIUM_DELAY_SEC,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrialParamsRetainedExactlyFromFixedControl: true as const,
    ventricularExtremaRetainedExactlyFromFixedControl: true as const,
    ventricularElectricalToCalciumDelayRetainedExactly: true as const,
    onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy:
      true as const,
    physiologicalRateAdaptationClaimed: false as const,
    fixedDiscreteCandidate: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILES_V1 =
  Object.freeze({
    "matched-alpha-fixed-absolute-time-hr-50": profile(
      "matched-alpha-fixed-absolute-time-hr-50",
      "fixed-absolute-time",
      50,
    ),
    "matched-alpha-fixed-absolute-time-hr-90": profile(
      "matched-alpha-fixed-absolute-time-hr-90",
      "fixed-absolute-time",
      90,
    ),
    "matched-alpha-rr-scaled-tau-hr-50": profile(
      "matched-alpha-rr-scaled-tau-hr-50",
      "rr-scaled-tau",
      50,
    ),
    "matched-alpha-rr-scaled-tau-hr-90": profile(
      "matched-alpha-rr-scaled-tau-hr-90",
      "rr-scaled-tau",
      90,
    ),
  } satisfies Readonly<
    Record<
      MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
      MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1
    >
  >);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1 =
  Object.freeze({
    role: "matched-alpha-heart-rate-timing-policy-factorial-bridge" as const,
    heartRatesBpm: Object.freeze([50, 90] as const),
    timingPolicies: Object.freeze([
      "fixed-absolute-time",
      "rr-scaled-tau",
    ] as const),
    waveformFamilyHeldExactly: true as const,
    ventricularCalciumExtremaHeldExactly: true as const,
    ventricularElectricalToCalciumDelayHeldAtSec: 0.012 as const,
    atrioventricularDelayHeldAtSec: 0.12 as const,
    atrialCalciumParamsHeldExactly: true as const,
    rrScaledTauPolicy:
      "source-fit-rise-and-decay-time-constants-multiplied-by-RR-over-one-second" as const,
    forceFrequencyRelationModeled: false as const,
    calciumCyclingStateModeled: false as const,
    physiologicalRateAdaptationClaimed: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    arbitraryNumericHeartRateOrTimeConstantInputExposed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1 {
  if (
    !Object.prototype.hasOwnProperty.call(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILES_V1,
      profileId,
    )
  ) {
    throw new Error(
      `unsupported matched-alpha timing-policy bridge profile: ${String(profileId)}`,
    );
  }
  return MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILES_V1[
    profileId
  ];
}

export function resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (!Object.prototype.hasOwnProperty.call(PARAMS_BY_PROFILE_ID, profileId)) {
    throw new Error(
      `unsupported matched-alpha timing-policy bridge profile: ${String(profileId)}`,
    );
  }
  return PARAMS_BY_PROFILE_ID[profileId];
}

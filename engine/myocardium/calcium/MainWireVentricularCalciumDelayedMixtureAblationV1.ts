import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialDelayedMixtureShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_V1_ID =
  "main-wire-ventricular-calcium-delayed-mixture-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1 =
  Object.freeze([
    "ventricular-calcium-quarter-delayed-by-rise-time-exposure-preserving",
    "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving",
    "ventricular-calcium-quarter-delayed-by-decay-time-exposure-preserving",
    "ventricular-calcium-half-delayed-by-decay-time-exposure-preserving",
  ] as const);

export type MainWireVentricularCalciumDelayedMixtureProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1)[number];

/** Compatibility name for the first, least-perturbed fixed profile. */
export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID =
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1[0];

export type MainWireVentricularCalciumDelayedMixtureProfileV1 = Readonly<{
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1;
  delayedWeightFactor: "quarter" | "half";
  delayedWeight01: number;
  delayReference:
    | "baseline-ventricular-rise-time-constant"
    | "baseline-ventricular-decay-time-constant";
  delaySec: number;
  unnormalizedMixturePeak01: number;
  ventricularPeakAmplitudeScaleFromPrior: number;
  ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const BASE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);

function profile(
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1,
  delayedWeightFactor:
    MainWireVentricularCalciumDelayedMixtureProfileV1["delayedWeightFactor"],
  delayReference:
    MainWireVentricularCalciumDelayedMixtureProfileV1["delayReference"],
): MainWireVentricularCalciumDelayedMixtureProfileV1 {
  const delayedWeight01 = delayedWeightFactor === "quarter" ? 0.25 : 0.5;
  const delaySec = delayReference
    === "baseline-ventricular-rise-time-constant"
    ? PRIOR.ventricular.riseTimeConstantSec
    : PRIOR.ventricular.decayTimeConstantSec;
  const mixtureShape = measurePeriodicBiexponentialDelayedMixtureShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    PRIOR.ventricular.decayTimeConstantSec,
    delayedWeight01,
    delaySec,
  );
  return Object.freeze({
    profileId,
    delayedWeightFactor,
    delayedWeight01,
    delayReference,
    delaySec,
    unnormalizedMixturePeak01: mixtureShape.unnormalizedMixturePeak01,
    ventricularPeakAmplitudeScaleFromPrior:
      mixtureShape.unnormalizedMixturePeak01,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      mixtureShape.unnormalizedMixturePeak01
      * mixtureShape.normalizedMixtureCycleIntegralSec
      / BASE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILES_V1 =
  Object.freeze({
    "ventricular-calcium-quarter-delayed-by-rise-time-exposure-preserving":
      profile(
        "ventricular-calcium-quarter-delayed-by-rise-time-exposure-preserving",
        "quarter",
        "baseline-ventricular-rise-time-constant",
      ),
    "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving":
      profile(
        "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving",
        "half",
        "baseline-ventricular-rise-time-constant",
      ),
    "ventricular-calcium-quarter-delayed-by-decay-time-exposure-preserving":
      profile(
        "ventricular-calcium-quarter-delayed-by-decay-time-exposure-preserving",
        "quarter",
        "baseline-ventricular-decay-time-constant",
      ),
    "ventricular-calcium-half-delayed-by-decay-time-exposure-preserving":
      profile(
        "ventricular-calcium-half-delayed-by-decay-time-exposure-preserving",
        "half",
        "baseline-ventricular-decay-time-constant",
      ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumDelayedMixtureProfileIdV1,
    MainWireVentricularCalciumDelayedMixtureProfileV1
  >>);

/** Compatibility name for the first, least-perturbed fixed profile. */
export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1 =
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILES_V1[
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID
  ];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-source-research-ablation" as const,
    waveform:
      "convex-sum-of-canonical-periodic-pulse-and-one-delayed-copy" as const,
    delayedWeightAxis: Object.freeze([0.25, 0.5] as const),
    delayAxis:
      "baseline-ventricular-rise-versus-decay-time-constant" as const,
    normalization:
      "analytic-piecewise-two-exponential-maximum" as const,
    exposureDefinition:
      "cycle-integral-of-calcium-above-diastolic-level" as const,
    everyProfilePreservesVentricularCalciumCycleExposure: true as const,
    allVentricularWallsShareOneWaveform: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    circulationRuntimeChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumDelayedMixtureProfileV1(
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1,
): MainWireVentricularCalciumDelayedMixtureProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular calcium delayed-mixture profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
  profileId: MainWireVentricularCalciumDelayedMixtureProfileIdV1 =
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID,
): FiveWallNormalCalciumDriveParamsV1 {
  const resolved =
    resolveMainWireVentricularCalciumDelayedMixtureProfileV1(profileId);
  return Object.freeze({
    parameterSetId: `${PRIOR.parameterSetId}-${resolved.profileId}`,
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      peakAmplitudeUM: PRIOR.ventricular.peakAmplitudeUM
        * resolved.ventricularPeakAmplitudeScaleFromPrior,
    }),
    ventricularDelayedMixture: Object.freeze({
      shape: "delayed-convex-mixture-v1" as const,
      delayedWeight01: resolved.delayedWeight01,
      delaySec: resolved.delaySec,
      unnormalizedMixturePeak01: resolved.unnormalizedMixturePeak01,
    }),
  });
}

export function validateMainWireVentricularCalciumDelayedMixtureProfileV1(
  value: MainWireVentricularCalciumDelayedMixtureProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "ventricular calcium delayed-mixture profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILES_V1[value.profileId];
  if (expected === undefined) {
    return Object.freeze([
      "ventricular calcium delayed-mixture profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "ventricular calcium delayed-mixture profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireVentricularCalciumDelayedMixtureProfileV1]
      !== expected[
        key as keyof MainWireVentricularCalciumDelayedMixtureProfileV1
      ]
    ) {
      issues.push(
        `ventricular calcium delayed-mixture profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

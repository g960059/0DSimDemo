import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialDelayedMixtureShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_V1_ID =
  "main-wire-ventricular-calcium-delayed-mixture-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID =
  "ventricular-calcium-quarter-delayed-by-rise-time-exposure-preserving" as const;

export type MainWireVentricularCalciumDelayedMixtureProfileV1 = Readonly<{
  profileId:
    typeof MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID;
  delayedWeight01: 0.25;
  delayReference: "baseline-ventricular-rise-time-constant";
  delaySec: number;
  unnormalizedMixturePeak01: number;
  ventricularPeakAmplitudeScaleFromPrior: number;
  ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const DELAYED_WEIGHT_01 = 0.25;
const DELAY_SEC = PRIOR.ventricular.riseTimeConstantSec;
const BASE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);
const MIXTURE_SHAPE = measurePeriodicBiexponentialDelayedMixtureShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
  DELAYED_WEIGHT_01,
  DELAY_SEC,
);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1 =
  Object.freeze({
    profileId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1_ID,
    delayedWeight01: DELAYED_WEIGHT_01,
    delayReference:
      "baseline-ventricular-rise-time-constant" as const,
    delaySec: DELAY_SEC,
    unnormalizedMixturePeak01:
      MIXTURE_SHAPE.unnormalizedMixturePeak01,
    ventricularPeakAmplitudeScaleFromPrior:
      MIXTURE_SHAPE.unnormalizedMixturePeak01,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      MIXTURE_SHAPE.unnormalizedMixturePeak01
      * MIXTURE_SHAPE.normalizedMixtureCycleIntegralSec
      / BASE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  } satisfies MainWireVentricularCalciumDelayedMixtureProfileV1);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-research-ablation" as const,
    waveform:
      "convex-sum-of-canonical-periodic-pulse-and-one-delayed-copy" as const,
    delayedWeight01: DELAYED_WEIGHT_01,
    delayReference:
      "baseline-ventricular-rise-time-constant" as const,
    normalization:
      "analytic-piecewise-two-exponential-maximum" as const,
    exposureDefinition:
      "cycle-integral-of-calcium-above-diastolic-level" as const,
    ventricularCalciumCycleExposurePreserved: true as const,
    allVentricularWallsShareOneWaveform: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    circulationRuntimeChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumDelayedMixtureParamsV1():
  FiveWallNormalCalciumDriveParamsV1 {
  const profile = MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1;
  return Object.freeze({
    parameterSetId:
      `${PRIOR.parameterSetId}-${profile.profileId}`,
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      peakAmplitudeUM: PRIOR.ventricular.peakAmplitudeUM
        * profile.ventricularPeakAmplitudeScaleFromPrior,
    }),
    ventricularDelayedMixture: Object.freeze({
      shape: "delayed-convex-mixture-v1" as const,
      delayedWeight01: profile.delayedWeight01,
      delaySec: profile.delaySec,
      unnormalizedMixturePeak01: profile.unnormalizedMixturePeak01,
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
  const expected = MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1;
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

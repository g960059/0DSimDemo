import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_V1_ID =
  "main-wire-ventricular-calcium-waveform-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-calcium-rise-high-exposure-preserving",
    "ventricular-calcium-decay-high-exposure-preserving",
    "ventricular-calcium-rise-decay-high-exposure-preserving",
  ] as const);

export type MainWireVentricularCalciumWaveformProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumWaveformProfileV1 = Readonly<{
  profileId: MainWireVentricularCalciumWaveformProfileIdV1;
  riseTimeFactor: "baseline" | "high";
  decayTimeFactor: "baseline" | "high";
  ventricularRiseTimeScaleFromPrior: number;
  ventricularDecayTimeScaleFromPrior: number;
  ventricularPeakAmplitudeScaleFromPrior: number;
  ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const HIGH_TIME_SCALE = 4 / 3;
const BASELINE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);

function profile(
  profileId: MainWireVentricularCalciumWaveformProfileIdV1,
  riseTimeFactor: MainWireVentricularCalciumWaveformProfileV1["riseTimeFactor"],
  decayTimeFactor: MainWireVentricularCalciumWaveformProfileV1["decayTimeFactor"],
): MainWireVentricularCalciumWaveformProfileV1 {
  const riseScale = riseTimeFactor === "high" ? HIGH_TIME_SCALE : 1;
  const decayScale = decayTimeFactor === "high" ? HIGH_TIME_SCALE : 1;
  const candidateShape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec * riseScale,
    PRIOR.ventricular.decayTimeConstantSec * decayScale,
  );
  const amplitudeScale =
    BASELINE_SHAPE.normalizedPulseCycleIntegralSec
    / candidateShape.normalizedPulseCycleIntegralSec;
  return Object.freeze({
    profileId,
    riseTimeFactor,
    decayTimeFactor,
    ventricularRiseTimeScaleFromPrior: riseScale,
    ventricularDecayTimeScaleFromPrior: decayScale,
    ventricularPeakAmplitudeScaleFromPrior: amplitudeScale,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      amplitudeScale
      * candidateShape.normalizedPulseCycleIntegralSec
      / BASELINE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", "baseline", "baseline"),
    "ventricular-calcium-rise-high-exposure-preserving": profile(
      "ventricular-calcium-rise-high-exposure-preserving",
      "high",
      "baseline",
    ),
    "ventricular-calcium-decay-high-exposure-preserving": profile(
      "ventricular-calcium-decay-high-exposure-preserving",
      "baseline",
      "high",
    ),
    "ventricular-calcium-rise-decay-high-exposure-preserving": profile(
      "ventricular-calcium-rise-decay-high-exposure-preserving",
      "high",
      "high",
    ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumWaveformProfileIdV1,
    MainWireVentricularCalciumWaveformProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-source-research-ablation" as const,
    riseTimeAxis:
      "common-ventricular-calcium-rise-time" as const,
    decayTimeAxis:
      "common-ventricular-calcium-decay-time" as const,
    highTimeScale: HIGH_TIME_SCALE,
    amplitudeDerivation:
      "analytic-cycle-integral-match-independently-for-each-profile" as const,
    exposureDefinition:
      "cycle-integral-of-calcium-above-diastolic-level" as const,
    everyProfilePreservesVentricularCalciumCycleExposure: true as const,
    allVentricularWallsShareOneWaveform: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumWaveformProfileV1(
  profileId: MainWireVentricularCalciumWaveformProfileIdV1,
): MainWireVentricularCalciumWaveformProfileV1 {
  const resolved = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILES_V1[
    profileId
  ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular calcium waveform profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularCalciumWaveformParamsV1(
  profileId: MainWireVentricularCalciumWaveformProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (profileId === "canonical") return PRIOR;
  const resolved = resolveMainWireVentricularCalciumWaveformProfileV1(profileId);
  return Object.freeze({
    parameterSetId: `${PRIOR.parameterSetId}-${profileId}`,
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      peakAmplitudeUM: PRIOR.ventricular.peakAmplitudeUM
        * resolved.ventricularPeakAmplitudeScaleFromPrior,
      riseTimeConstantSec: PRIOR.ventricular.riseTimeConstantSec
        * resolved.ventricularRiseTimeScaleFromPrior,
      decayTimeConstantSec: PRIOR.ventricular.decayTimeConstantSec
        * resolved.ventricularDecayTimeScaleFromPrior,
    }),
  });
}

export function validateMainWireVentricularCalciumWaveformProfileV1(
  value: MainWireVentricularCalciumWaveformProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "ventricular calcium waveform profile must be an object",
    ]);
  }
  const expected = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILES_V1[
    value.profileId
  ];
  if (expected === undefined) {
    return Object.freeze([
      "ventricular calcium waveform profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "ventricular calcium waveform profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireVentricularCalciumWaveformProfileV1]
      !== expected[key as keyof MainWireVentricularCalciumWaveformProfileV1]
    ) {
      issues.push(
        `ventricular calcium waveform profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

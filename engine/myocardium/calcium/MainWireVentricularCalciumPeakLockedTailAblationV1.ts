import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_V1_ID =
  "main-wire-ventricular-calcium-peak-locked-tail-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-calcium-peak-locked-tail-high-exposure-preserving",
  ] as const);

export type MainWireVentricularCalciumPeakLockedTailProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumPeakLockedTailProfileV1 = Readonly<{
  profileId: MainWireVentricularCalciumPeakLockedTailProfileIdV1;
  tailDurationFactor: "baseline" | "high";
  ventricularDecayTimeScaleFromPrior: number;
  ventricularRiseTimeScaleFromPrior: number;
  ventricularPeakAmplitudeScaleFromPrior: number;
  ventricularPulseTimeToPeakSec: number;
  ventricularPulseTimeToPeakResidualSec: number;
  ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const HIGH_DECAY_TIME_SCALE = 4 / 3;
const BASE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);

function profile(
  profileId: MainWireVentricularCalciumPeakLockedTailProfileIdV1,
  tailDurationFactor:
    MainWireVentricularCalciumPeakLockedTailProfileV1["tailDurationFactor"],
): MainWireVentricularCalciumPeakLockedTailProfileV1 {
  const decayScale = tailDurationFactor === "high"
    ? HIGH_DECAY_TIME_SCALE
    : 1;
  const decayTimeConstantSec =
    PRIOR.ventricular.decayTimeConstantSec * decayScale;
  const riseTimeConstantSec = tailDurationFactor === "high"
    ? solveRiseTimeConstantForPulsePeakTime(
      PRIOR.cycleLengthSec,
      decayTimeConstantSec,
      BASE_SHAPE.timeToPeakSec,
    )
    : PRIOR.ventricular.riseTimeConstantSec;
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    riseTimeConstantSec,
    decayTimeConstantSec,
  );
  const amplitudeScale =
    BASE_SHAPE.normalizedPulseCycleIntegralSec
    / shape.normalizedPulseCycleIntegralSec;
  return Object.freeze({
    profileId,
    tailDurationFactor,
    ventricularDecayTimeScaleFromPrior: decayScale,
    ventricularRiseTimeScaleFromPrior:
      riseTimeConstantSec / PRIOR.ventricular.riseTimeConstantSec,
    ventricularPeakAmplitudeScaleFromPrior: amplitudeScale,
    ventricularPulseTimeToPeakSec: shape.timeToPeakSec,
    ventricularPulseTimeToPeakResidualSec:
      shape.timeToPeakSec - BASE_SHAPE.timeToPeakSec,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      amplitudeScale
      * shape.normalizedPulseCycleIntegralSec
      / BASE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", "baseline"),
    "ventricular-calcium-peak-locked-tail-high-exposure-preserving": profile(
      "ventricular-calcium-peak-locked-tail-high-exposure-preserving",
      "high",
    ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumPeakLockedTailProfileIdV1,
    MainWireVentricularCalciumPeakLockedTailProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-one-sided-tail-duration-research-ablation" as const,
    waveform: "same-periodic-analytically-normalized-biexponential" as const,
    highDecayTimeScale: HIGH_DECAY_TIME_SCALE,
    riseTimeDerivation:
      "deterministic-root-of-analytic-periodic-pulse-peak-time" as const,
    peakTimeConstraint:
      "canonical-ventricular-calcium-pulse-time-to-peak" as const,
    amplitudeDerivation:
      "analytic-cycle-integral-match-after-peak-time-constraint" as const,
    exposureDefinition:
      "cycle-integral-of-calcium-above-diastolic-level" as const,
    everyProfilePreservesCalciumPulsePeakTime: true as const,
    everyProfilePreservesVentricularCalciumCycleExposure: true as const,
    allVentricularWallsShareOneWaveform: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    circulationRuntimeChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumPeakLockedTailProfileV1(
  profileId: MainWireVentricularCalciumPeakLockedTailProfileIdV1,
): MainWireVentricularCalciumPeakLockedTailProfileV1 {
  const profile =
    MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(
      `unsupported ventricular calcium peak-locked tail profile: ${String(profileId)}`,
    );
  }
  return profile;
}

export function resolveMainWireVentricularCalciumPeakLockedTailParamsV1(
  profileId: MainWireVentricularCalciumPeakLockedTailProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (profileId === "canonical") return PRIOR;
  const profile =
    resolveMainWireVentricularCalciumPeakLockedTailProfileV1(profileId);
  return Object.freeze({
    parameterSetId: `${PRIOR.parameterSetId}-${profile.profileId}`,
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      peakAmplitudeUM:
        PRIOR.ventricular.peakAmplitudeUM
        * profile.ventricularPeakAmplitudeScaleFromPrior,
      riseTimeConstantSec:
        PRIOR.ventricular.riseTimeConstantSec
        * profile.ventricularRiseTimeScaleFromPrior,
      decayTimeConstantSec:
        PRIOR.ventricular.decayTimeConstantSec
        * profile.ventricularDecayTimeScaleFromPrior,
    }),
  });
}

export function validateMainWireVentricularCalciumPeakLockedTailProfileV1(
  value: MainWireVentricularCalciumPeakLockedTailProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "ventricular calcium peak-locked tail profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILES_V1[value.profileId];
  if (expected === undefined) {
    return Object.freeze([
      "ventricular calcium peak-locked tail profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "ventricular calcium peak-locked tail profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireVentricularCalciumPeakLockedTailProfileV1]
      !== expected[
        key as keyof MainWireVentricularCalciumPeakLockedTailProfileV1
      ]
    ) {
      issues.push(
        `ventricular calcium peak-locked tail profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

function solveRiseTimeConstantForPulsePeakTime(
  cycleLengthSec: number,
  decayTimeConstantSec: number,
  targetPeakTimeSec: number,
): number {
  let lower = Math.max(Number.EPSILON, targetPeakTimeSec * 1e-6);
  let upper = Math.min(
    decayTimeConstantSec * (1 - 1e-12),
    targetPeakTimeSec * (1 - 1e-12),
  );
  const residual = (riseTimeConstantSec: number): number =>
    measurePeriodicBiexponentialCalciumPulseShapeV1(
      cycleLengthSec,
      riseTimeConstantSec,
      decayTimeConstantSec,
    ).timeToPeakSec - targetPeakTimeSec;
  if (!(residual(lower) < 0 && residual(upper) > 0)) {
    throw new Error("peak-locked calcium rise-time root is not bracketed");
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (residual(midpoint) < 0) lower = midpoint;
    else upper = midpoint;
  }
  const solved = 0.5 * (lower + upper);
  if (Math.abs(residual(solved)) > 1e-14) {
    throw new Error("peak-locked calcium rise-time solve did not converge");
  }
  return solved;
}

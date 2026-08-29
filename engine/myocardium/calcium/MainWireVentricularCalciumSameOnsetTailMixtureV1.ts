import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateNormalizedPeriodicBiexponentialCalciumPulseV1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_V1_ID =
  "main-wire-ventricular-calcium-same-onset-tail-mixture-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "same-onset-tail-slow-twofold-weight-one-tenth",
    "same-onset-tail-slow-twofold-weight-one-fifth",
    "same-onset-tail-slow-twofold-weight-three-tenths",
    "same-onset-tail-slow-twofold-weight-two-fifths",
    "same-onset-tail-slow-threefold-weight-one-tenth",
    "same-onset-tail-slow-threefold-weight-one-fifth",
    "same-onset-tail-slow-threefold-weight-three-tenths",
    "same-onset-tail-slow-threefold-weight-two-fifths",
  ] as const);

export type MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumSameOnsetTailMixtureProfileV1 = Readonly<{
  profileId:
    MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1;
  slowDecayTimeScaleFromPrior: number;
  slowComponentWeight01: number;
  unnormalizedMixturePeak01: number;
  mixtureTimeToPeakSec: number;
  supradiastolicCalciumExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-same-onset-slow-removal-component-screen" as const,
    waveform:
      "peak-normalized-convex-mixture-of-two-periodic-biexponentials-sharing-onset-and-rise-time" as const,
    slowDecayScaleAxis: Object.freeze([2, 3] as const),
    slowComponentWeightAxis: Object.freeze([0.1, 0.2, 0.3, 0.4] as const),
    peakAmplitudePreservedExactlyAfterAnalyticRootNormalization: true as const,
    diastolicCalciumPreserved: true as const,
    electricalToCalciumDelayPreserved: true as const,
    calciumStateAdded: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    parameterSearchOrFitting: false as const,
    exactClosedLoopModelUsesProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const BASE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);

function profile(
  profileId: MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1,
  slowDecayTimeScaleFromPrior: number,
  slowComponentWeight01: number,
): MainWireVentricularCalciumSameOnsetTailMixtureProfileV1 {
  if (profileId === "canonical") {
    return Object.freeze({
      profileId,
      slowDecayTimeScaleFromPrior: 1,
      slowComponentWeight01: 0,
      unnormalizedMixturePeak01: 1,
      mixtureTimeToPeakSec: BASE_SHAPE.timeToPeakSec,
      supradiastolicCalciumExposureScaleFromPrior: 1,
      parameterSearchOrFitting: false as const,
      hemodynamicOutcomeUsedToDeriveProfile: false as const,
    });
  }
  const slowDecayTimeConstantSec =
    PRIOR.ventricular.decayTimeConstantSec * slowDecayTimeScaleFromPrior;
  const peak = solveMixturePeak(
    slowDecayTimeConstantSec,
    slowComponentWeight01,
  );
  const slowShape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    slowDecayTimeConstantSec,
  );
  const normalizedIntegral = (
    (1 - slowComponentWeight01)
      * BASE_SHAPE.normalizedPulseCycleIntegralSec
    + slowComponentWeight01 * slowShape.normalizedPulseCycleIntegralSec
  ) / peak.value;
  return Object.freeze({
    profileId,
    slowDecayTimeScaleFromPrior,
    slowComponentWeight01,
    unnormalizedMixturePeak01: peak.value,
    mixtureTimeToPeakSec: peak.timeSec,
    supradiastolicCalciumExposureScaleFromPrior:
      normalizedIntegral / BASE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", 1, 0),
    "same-onset-tail-slow-twofold-weight-one-tenth": profile(
      "same-onset-tail-slow-twofold-weight-one-tenth", 2, 0.1,
    ),
    "same-onset-tail-slow-twofold-weight-one-fifth": profile(
      "same-onset-tail-slow-twofold-weight-one-fifth", 2, 0.2,
    ),
    "same-onset-tail-slow-twofold-weight-three-tenths": profile(
      "same-onset-tail-slow-twofold-weight-three-tenths", 2, 0.3,
    ),
    "same-onset-tail-slow-twofold-weight-two-fifths": profile(
      "same-onset-tail-slow-twofold-weight-two-fifths", 2, 0.4,
    ),
    "same-onset-tail-slow-threefold-weight-one-tenth": profile(
      "same-onset-tail-slow-threefold-weight-one-tenth", 3, 0.1,
    ),
    "same-onset-tail-slow-threefold-weight-one-fifth": profile(
      "same-onset-tail-slow-threefold-weight-one-fifth", 3, 0.2,
    ),
    "same-onset-tail-slow-threefold-weight-three-tenths": profile(
      "same-onset-tail-slow-threefold-weight-three-tenths", 3, 0.3,
    ),
    "same-onset-tail-slow-threefold-weight-two-fifths": profile(
      "same-onset-tail-slow-threefold-weight-two-fifths", 3, 0.4,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1,
    MainWireVentricularCalciumSameOnsetTailMixtureProfileV1
  >>);

export function resolveMainWireVentricularCalciumSameOnsetTailMixtureProfileV1(
  profileId: MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1,
): MainWireVentricularCalciumSameOnsetTailMixtureProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILES_V1[
      profileId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported same-onset calcium tail mixture: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function evaluateMainWireVentricularCalciumSameOnsetTailMixtureV1(
  timeSec: number,
  profileId: MainWireVentricularCalciumSameOnsetTailMixtureProfileIdV1,
): number {
  const resolved =
    resolveMainWireVentricularCalciumSameOnsetTailMixtureProfileV1(profileId);
  const timeSinceOnsetSec = positiveModulo(
    timeSec - PRIOR.ventricular.electricalToCalciumDelaySec,
    PRIOR.cycleLengthSec,
  );
  const normalized = unnormalizedMixture(
    timeSinceOnsetSec,
    PRIOR.ventricular.decayTimeConstantSec
      * resolved.slowDecayTimeScaleFromPrior,
    resolved.slowComponentWeight01,
  ) / resolved.unnormalizedMixturePeak01;
  return PRIOR.ventricular.diastolicCalciumUM
    + PRIOR.ventricular.peakAmplitudeUM * clamp01(normalized);
}

function solveMixturePeak(
  slowDecayTimeConstantSec: number,
  slowComponentWeight01: number,
): Readonly<{ timeSec: number; value: number }> {
  let lower = 0;
  let upper = PRIOR.cycleLengthSec;
  const derivativeAtLower = mixtureDerivative(
    lower,
    slowDecayTimeConstantSec,
    slowComponentWeight01,
  );
  const derivativeAtUpper = mixtureDerivative(
    upper,
    slowDecayTimeConstantSec,
    slowComponentWeight01,
  );
  if (!(derivativeAtLower > 0 && derivativeAtUpper < 0)) {
    throw new Error("same-onset tail mixture peak is not bracketed");
  }
  for (let iteration = 0; iteration < 128; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (mixtureDerivative(
      midpoint,
      slowDecayTimeConstantSec,
      slowComponentWeight01,
    ) > 0) lower = midpoint;
    else upper = midpoint;
  }
  const timeSec = 0.5 * (lower + upper);
  return Object.freeze({
    timeSec,
    value: unnormalizedMixture(
      timeSec,
      slowDecayTimeConstantSec,
      slowComponentWeight01,
    ),
  });
}

function unnormalizedMixture(
  timeSinceOnsetSec: number,
  slowDecayTimeConstantSec: number,
  slowComponentWeight01: number,
): number {
  const base = evaluateNormalizedPeriodicBiexponentialCalciumPulseV1(
    timeSinceOnsetSec,
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    PRIOR.ventricular.decayTimeConstantSec,
  );
  const slow = evaluateNormalizedPeriodicBiexponentialCalciumPulseV1(
    timeSinceOnsetSec,
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    slowDecayTimeConstantSec,
  );
  return (1 - slowComponentWeight01) * base
    + slowComponentWeight01 * slow;
}

function mixtureDerivative(
  timeSec: number,
  slowDecayTimeConstantSec: number,
  slowComponentWeight01: number,
): number {
  return (1 - slowComponentWeight01) * normalizedPulseDerivative(
    timeSec,
    PRIOR.ventricular.decayTimeConstantSec,
  ) + slowComponentWeight01 * normalizedPulseDerivative(
    timeSec,
    slowDecayTimeConstantSec,
  );
}

function normalizedPulseDerivative(
  timeSec: number,
  decayTimeConstantSec: number,
): number {
  const cycle = PRIOR.cycleLengthSec;
  const rise = PRIOR.ventricular.riseTimeConstantSec;
  const decayCarry = 1 / (1 - Math.exp(-cycle / decayTimeConstantSec));
  const riseCarry = 1 / (1 - Math.exp(-cycle / rise));
  const raw = (time: number): number =>
    decayCarry * Math.exp(-time / decayTimeConstantSec)
    - riseCarry * Math.exp(-time / rise);
  const peakTime = Math.log(
    riseCarry / rise / (decayCarry / decayTimeConstantSec),
  ) / (1 / rise - 1 / decayTimeConstantSec);
  const amplitude = raw(peakTime) - raw(0);
  return (
    -decayCarry / decayTimeConstantSec
      * Math.exp(-timeSec / decayTimeConstantSec)
    + riseCarry / rise * Math.exp(-timeSec / rise)
  ) / amplitude;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

function clamp01(value: number): number {
  if (value < -1e-12 || value > 1 + 1e-12 || !Number.isFinite(value)) {
    throw new Error("same-onset tail mixture left [0,1]");
  }
  return Math.min(1, Math.max(0, value));
}

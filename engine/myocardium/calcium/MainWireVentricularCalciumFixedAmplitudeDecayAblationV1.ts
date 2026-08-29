import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_ABLATION_V1_ID =
  "main-wire-ventricular-calcium-fixed-amplitude-decay-ablation-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-calcium-decay-one-and-half-fixed-amplitude",
    "ventricular-calcium-decay-twofold-fixed-amplitude",
  ] as const);

export type MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumFixedAmplitudeDecayProfileV1 = Readonly<{
  profileId: MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1;
  ventricularDecayTimeScaleFromPrior: 1 | 1.5 | 2;
  ventricularPeakAmplitudeScaleFromPrior: 1;
  ventricularRiseTimeScaleFromPrior: 1;
  ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const BASELINE_SHAPE = measurePeriodicBiexponentialCalciumPulseShapeV1(
  PRIOR.cycleLengthSec,
  PRIOR.ventricular.riseTimeConstantSec,
  PRIOR.ventricular.decayTimeConstantSec,
);

function profile(
  profileId: MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
  decayScale: 1 | 1.5 | 2,
): MainWireVentricularCalciumFixedAmplitudeDecayProfileV1 {
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    PRIOR.ventricular.decayTimeConstantSec * decayScale,
  );
  return Object.freeze({
    profileId,
    ventricularDecayTimeScaleFromPrior: decayScale,
    ventricularPeakAmplitudeScaleFromPrior: 1 as const,
    ventricularRiseTimeScaleFromPrior: 1 as const,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      shape.normalizedPulseCycleIntegralSec
      / BASELINE_SHAPE.normalizedPulseCycleIntegralSec,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", 1),
    "ventricular-calcium-decay-one-and-half-fixed-amplitude": profile(
      "ventricular-calcium-decay-one-and-half-fixed-amplitude",
      1.5,
    ),
    "ventricular-calcium-decay-twofold-fixed-amplitude": profile(
      "ventricular-calcium-decay-twofold-fixed-amplitude",
      2,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
    MainWireVentricularCalciumFixedAmplitudeDecayProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_CLAIM_V1 =
  Object.freeze({
    role: "fixed-amplitude-decay-time-causal-bracket" as const,
    commonVentricularDecayTimeAxis: true as const,
    ventricularPeakAmplitudeHeldExactlyAtPrior: true as const,
    ventricularRiseTimeHeldExactlyAtPrior: true as const,
    calciumExposureIntentionallyNotPreserved: true as const,
    allVentricularWallsShareOneWaveform: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumFixedAmplitudeDecayProfileV1(
  profileId: MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
): MainWireVentricularCalciumFixedAmplitudeDecayProfileV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular calcium fixed-amplitude decay profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularCalciumFixedAmplitudeDecayParamsV1(
  profileId: MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  if (profileId === "canonical") return PRIOR;
  const resolved =
    resolveMainWireVentricularCalciumFixedAmplitudeDecayProfileV1(profileId);
  return Object.freeze({
    parameterSetId: `${PRIOR.parameterSetId}-${profileId}`,
    cycleLengthSec: PRIOR.cycleLengthSec,
    atrioventricularDelaySec: PRIOR.atrioventricularDelaySec,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      ...PRIOR.ventricular,
      decayTimeConstantSec:
        PRIOR.ventricular.decayTimeConstantSec
        * resolved.ventricularDecayTimeScaleFromPrior,
    }),
  });
}

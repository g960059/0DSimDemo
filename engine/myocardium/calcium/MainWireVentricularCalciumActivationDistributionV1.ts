import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialSimpsonActivationDistributionShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_V1_ID =
  "main-wire-ventricular-calcium-activation-distribution-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_PROFILE_IDS_V1 =
  Object.freeze([
    "ventricular-activation-distribution-simpson-60ms",
    "ventricular-activation-distribution-simpson-80ms",
    "ventricular-activation-distribution-simpson-100ms",
    "ventricular-activation-distribution-simpson-120ms",
  ] as const);

export type MainWireVentricularCalciumActivationDistributionProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumActivationDistributionProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularCalciumActivationDistributionProfileIdV1;
    supportDurationSec: 0.06 | 0.08 | 0.1 | 0.12;
    delaySec: readonly [0, number, number];
    weight01: readonly [number, number, number];
    unnormalizedMixturePeak01: number;
    effectiveTimeToPeakSec: number;
    ventricularPeakAmplitudeScaleFromPrior: number;
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior: number;
    withinDirectNormalElectricalActivationDurationBracket: boolean;
    stateCountChanged: false;
    hemodynamicOutcomeUsedToDeriveProfile: false;
    parameterSearchOrFitting: false;
  }>;

const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

function profile(
  profileId: MainWireVentricularCalciumActivationDistributionProfileIdV1,
  supportDurationSec: 0.06 | 0.08 | 0.1 | 0.12,
): MainWireVentricularCalciumActivationDistributionProfileV1 {
  const baseShape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    PRIOR.cycleLengthSec,
    PRIOR.ventricular.riseTimeConstantSec,
    PRIOR.ventricular.decayTimeConstantSec,
  );
  const shape =
    measurePeriodicBiexponentialSimpsonActivationDistributionShapeV1(
      PRIOR.cycleLengthSec,
      PRIOR.ventricular.riseTimeConstantSec,
      PRIOR.ventricular.decayTimeConstantSec,
      supportDurationSec,
    );
  return Object.freeze({
    profileId,
    supportDurationSec,
    delaySec: shape.delaySec,
    weight01: shape.weight01,
    unnormalizedMixturePeak01: shape.unnormalizedMixturePeak01,
    effectiveTimeToPeakSec: shape.timeToPeakSec,
    ventricularPeakAmplitudeScaleFromPrior:
      shape.unnormalizedMixturePeak01,
    ventricularSupradiastolicCalciumCycleExposureScaleFromPrior:
      shape.unnormalizedMixturePeak01
      * shape.normalizedMixtureCycleIntegralSec
      / baseShape.normalizedPulseCycleIntegralSec,
    withinDirectNormalElectricalActivationDurationBracket:
      supportDurationSec <= 0.08,
    stateCountChanged: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    parameterSearchOrFitting: false as const,
  });
}

const SUPPORT_DURATION_SEC_BY_PROFILE_ID =
  Object.freeze({
    "ventricular-activation-distribution-simpson-60ms": 0.06,
    "ventricular-activation-distribution-simpson-80ms": 0.08,
    "ventricular-activation-distribution-simpson-100ms": 0.1,
    "ventricular-activation-distribution-simpson-120ms": 0.12,
  } satisfies Readonly<Record<
    MainWireVentricularCalciumActivationDistributionProfileIdV1,
    0.06 | 0.08 | 0.1 | 0.12
  >>);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_ACTIVATION_DISTRIBUTION_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-low-order-unresolved-whole-ventricle-activation-time-closure" as const,
    sourceDoi: "10.1093/europace/euw346" as const,
    sourceNormalActivationEvidence:
      "human-LV-endocardium-about-30ms-transmural-about-35ms-and-complete-ventricular-activation-commonly-62-to-80ms" as const,
    directNormalElectricalSupportDurationBracketSec:
      Object.freeze([0.06, 0.08] as const),
    outsideDirectBracketSensitivitySupportDurationSec:
      Object.freeze([0.1, 0.12] as const),
    unresolvedDistribution: "uniform-local-activation-onset-time" as const,
    quadrature:
      "three-point-Simpson-with-exact-uniform-zeroth-first-second-moments" as const,
    localCellCalciumPulseChanged: false as const,
    effectiveWallInputIsNotClaimedAsOneMeasuredCellTrace: true as const,
    cycleExposurePreservedExactly: true as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export function resolveMainWireVentricularCalciumActivationDistributionProfileV1(
  profileId: MainWireVentricularCalciumActivationDistributionProfileIdV1,
): MainWireVentricularCalciumActivationDistributionProfileV1 {
  const supportDurationSec = SUPPORT_DURATION_SEC_BY_PROFILE_ID[profileId];
  if (supportDurationSec === undefined) {
    throw new Error(
      `unsupported ventricular activation-distribution profile: ${String(profileId)}`,
    );
  }
  return profile(profileId, supportDurationSec);
}

export function resolveMainWireVentricularCalciumActivationDistributionParamsV1(
  profileId: MainWireVentricularCalciumActivationDistributionProfileIdV1,
): FiveWallNormalCalciumDriveParamsV1 {
  const resolved =
    resolveMainWireVentricularCalciumActivationDistributionProfileV1(
      profileId,
    );
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
    ventricularActivationDistribution: Object.freeze({
      shape: "simpson-uniform-activation-distribution-v1" as const,
      supportDurationSec: resolved.supportDurationSec,
      delaySec: resolved.delaySec,
      weight01: resolved.weight01,
      unnormalizedMixturePeak01: resolved.unnormalizedMixturePeak01,
    }),
  });
}

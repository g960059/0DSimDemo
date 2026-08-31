import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID =
  "main-wire-ventricular-calcium-matched-alpha-saturating-heart-rate-law-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_RANGE_V1 =
  Object.freeze({ minimumBpm: 40 as const, maximumBpm: 100 as const });

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1 =
  60 as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1 =
  0.4 as const;

const FIXED_ATRIOVENTRICULAR_DELAY_SEC = 0.12 as const;
const SOURCE = MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1;
const PRIOR = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1 =
  Object.freeze({
    role: "fixed-source-anchored-continuous-heart-rate-calcium-law" as const,
    formula:
      "s=(HR-60)/(HR+60); tau=tau0*exp(-0.4*s)" as const,
    waveformFamily:
      "periodic-normalized-biexponential-exact-alpha-limit" as const,
    publicHeartRateRangeBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_RANGE_V1,
    referenceHeartRateBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1,
    sourceTimeConstantSec: SOURCE.ventricularAlphaTimeConstantSec,
    dimensionlessRateCoefficient:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1,
    riseAndDecayShareOneTimeConstant: true as const,
    ventricularExtremaHeldExactly: true as const,
    ventricularElectricalToCalciumDelaySec:
      SOURCE.ventricularElectricalToCalciumDelaySec,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrialParamsRetainedExactly: true as const,
    periodicCarryRecomputedForCycleLength: true as const,
    forceFrequencyRelationModeled: false as const,
    calciumCyclingStateModeled: false as const,
    dynamicRateHistoryModeled: false as const,
    parameterSearchOrFittingAppliedToRateLaw: false as const,
    hemodynamicOutcomeUsedToSetRateLaw: false as const,
    newContinuousStateAdded: false as const,
    clinicalValidationClaimed: false as const,
  });

/**
 * Resolves the one admitted continuous law. Heart rate is a steady fixture
 * coordinate; dynamic rate-history calcium handling is outside this model.
 */
export function resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
  heartRateBpm: number,
): FiveWallNormalCalciumDriveParamsV1 {
  requireAdmittedHeartRateBpm(heartRateBpm);
  const referenceHeartRateBpm =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1;
  const saturationCoordinate =
    (heartRateBpm - referenceHeartRateBpm)
    / (heartRateBpm + referenceHeartRateBpm);
  const timeConstantSec = SOURCE.ventricularAlphaTimeConstantSec * Math.exp(
    -MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1
      * saturationCoordinate,
  );
  return Object.freeze({
    parameterSetId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    cycleLengthSec: 60 / heartRateBpm,
    atrioventricularDelaySec: FIXED_ATRIOVENTRICULAR_DELAY_SEC,
    atrial: PRIOR.atrial,
    ventricular: Object.freeze({
      diastolicCalciumUM: SOURCE.ventricularDiastolicCalciumUM,
      peakAmplitudeUM:
        SOURCE.ventricularPeakCalciumUM
        - SOURCE.ventricularDiastolicCalciumUM,
      riseTimeConstantSec: timeConstantSec,
      decayTimeConstantSec: timeConstantSec,
      electricalToCalciumDelaySec:
        SOURCE.ventricularElectricalToCalciumDelaySec,
    }),
  });
}

function requireAdmittedHeartRateBpm(heartRateBpm: number): void {
  const range =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_RANGE_V1;
  if (
    !Number.isFinite(heartRateBpm)
    || heartRateBpm < range.minimumBpm
    || heartRateBpm > range.maximumBpm
  ) {
    throw new Error(
      `matched-alpha calcium heart rate must be finite and within ${range.minimumBpm}-${range.maximumBpm} bpm`,
    );
  }
}

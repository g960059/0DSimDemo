import {
  canonicalizeDerivedExactEventCalciumParameterV1,
  EXACT_EVENT_CALCIUM_CANONICAL_SIGNIFICANT_DIGITS_V1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID =
  "main-wire-ventricular-calcium-matched-alpha-exact-persistence-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_CLAIM_V1 =
  Object.freeze({
    sourceContinuousLawId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    scope: "exact-configuration-tau-boundary" as const,
    persistedTauCanonicalSignificantDigits:
      EXACT_EVENT_CALCIUM_CANONICAL_SIGNIFICANT_DIGITS_V1,
    sourceContinuousLawRetainedUnrounded: true as const,
    persistedTauRepresentationIsPiecewiseConstant: true as const,
    cycleLengthEquationRetainedAsIeeeDivision: "T=60/HR" as const,
    calciumExtremaChanged: false as const,
    timingDelaysChanged: false as const,
    newContinuousStateAdded: false as const,
    clinicalValidationClaimed: false as const,
  });

/**
 * Resolves the continuous scientific HR law, then crosses the existing
 * 12-significant-digit boundary only for tau entering exact configuration.
 * The source law and its HR60 anchor remain unchanged and full precision.
 */
export function resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(
  heartRateBpm: number,
): FiveWallNormalCalciumDriveParamsV1 {
  const source =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      heartRateBpm,
    );
  const tau = canonicalizeDerivedExactEventCalciumParameterV1(
    source.ventricular.riseTimeConstantSec,
  );
  if (!(tau > 0)) {
    throw new Error("matched-alpha exact-persistence tau must be positive");
  }
  return Object.freeze({
    parameterSetId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
    cycleLengthSec: source.cycleLengthSec,
    atrioventricularDelaySec: source.atrioventricularDelaySec,
    atrial: source.atrial,
    ventricular: Object.freeze({
      diastolicCalciumUM: source.ventricular.diastolicCalciumUM,
      peakAmplitudeUM: source.ventricular.peakAmplitudeUM,
      riseTimeConstantSec: tau,
      decayTimeConstantSec: tau,
      electricalToCalciumDelaySec:
        source.ventricular.electricalToCalciumDelaySec,
    }),
  });
}

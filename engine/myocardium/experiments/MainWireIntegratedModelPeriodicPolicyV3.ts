import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";

const V3_CYCLE_LENGTH_SEC =
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec;

/** Current V3 step and conservation guards used by every periodic cycle. */
export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 = Object.freeze({
  policyId: "main-wire-integrated-model-numerical-policy-v3" as const,
  cycleLengthSec: V3_CYCLE_LENGTH_SEC,
  maximumAcceptedStepCountPerRun: 1_100,
  invariantTolerance: Object.freeze({
    acceptedOwnerClockSkewSec: 1e-12,
    globalTotalBloodVolumeErrorMl: 1e-8,
    coronaryBloodVolumeLedgerResidualMl: 1e-8,
    dynamicMcsConservationResidualMlPerSec: 1e-12,
  }),
});

const CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V3 = 10;
const CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V3 =
  CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V3
  * NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.responseTimeConstantSec;
const CANONICAL_MAXIMUM_CYCLE_COUNT_V3 =
  CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V3 / V3_CYCLE_LENGTH_SEC;

if (
  !Number.isSafeInteger(CANONICAL_MAXIMUM_CYCLE_COUNT_V3)
  || CANONICAL_MAXIMUM_CYCLE_COUNT_V3 <= 0
) {
  throw new Error(
    "integrated V3 canonical slow-time horizon must contain an exact positive number of sinus cycles",
  );
}

/**
 * Predeclared periodic-classification policy for the current integrated V3
 * lane. Its numbers are unchanged from the policy used to establish the V3
 * baseline; only the obsolete V2 execution model ownership was removed.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 = Object.freeze({
  policyId:
    "integrated-full-accepted-state-periodic-policy-v3-preregistered" as const,
  period1NormalizedTolerance:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period1NormalizedTolerance,
  period2NormalizedTolerance:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles:
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .consecutiveBeats,
  coronaryAutoregulationResponseTimeConstantSec:
    NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.responseTimeConstantSec,
  canonicalSlowTimeConstantMultiples:
    CANONICAL_SLOW_TIME_CONSTANT_MULTIPLES_V3,
  canonicalMaximumPhysicalTimeSec: CANONICAL_MAXIMUM_PHYSICAL_TIME_SEC_V3,
  canonicalSinusCycleLengthSec: V3_CYCLE_LENGTH_SEC,
  defaultMaximumCycleCount: CANONICAL_MAXIMUM_CYCLE_COUNT_V3,
  maximumCycleCount: CANONICAL_MAXIMUM_CYCLE_COUNT_V3,
  boundedSmokeDefaultMaximumCycleCount: 1,
  boundedSmokeMaximumCycleCount: 2,
  minimumNominalDtSec: 0.001,
  maximumNominalDtSec: 0.01,
  referenceScaleSetId:
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3.scaleSetId,
  thresholdProvenance:
    "copied-before-integrated-v3-evaluation-from-the-current-coronary-full-state-periodic-policy-not-fit-to-integrated-output" as const,
  canonicalMaximumHorizonProvenance:
    "ten-times-the-explicit-25-second-coronary-controller-coefficient-divided-by-the-fixed-one-second-sinus-cycle" as const,
});

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawPriorSensitivityProfileIdV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-heart-rate-law-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_STEPS_PER_CYCLE_V1 =
  2_000 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAXIMUM_PHYSICAL_HORIZON_SEC_V1 =
  48 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARM_IDS_V1 =
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARM_IDS_V1 =
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_PROFILE_IDS_V1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMainArmIdV1 =
  MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawMainProfileIdV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawPriorSensitivityArmIdV1 =
  MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawPriorSensitivityProfileIdV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmIdV1 =
  | MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMainArmIdV1
  | MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawPriorSensitivityArmIdV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmIdV1;
    calciumProfileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1;
    designRole: "main-four-heart-rate-design" | "endpoint-prior-sensitivity";
    heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1;
    dimensionlessRateCoefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1;
    cycleLengthSec: number;
    stepsPerCycle: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_STEPS_PER_CYCLE_V1;
    dtSec: number;
    maximumPhysicalHorizonSec: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAXIMUM_PHYSICAL_HORIZON_SEC_V1;
    maximumBeatCount: 40 | 48 | 60 | 72;
    circulatoryLoadPointId: "baseline";
    stressedVenousVolumePointId: "baseline";
    initializationPolicy: "independent-canonical-cold-start";
    periodicTerminationPolicy: "stop-at-first-accepted-classification";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARM_IDS_V1.map(
      (profileId) => arm(profileId),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARMS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARM_IDS_V1.map(
      (profileId) => arm(profileId),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1 =
  Object.freeze([
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1,
    ...MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_SENSITIVITY_ARMS_V1,
  ]);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V10-reference-matched-alpha-saturating-heart-rate-law-experiment" as const,
    referenceNonCalciumAssembly:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    referenceAssemblyIsFullV10CandidateIdentity: false as const,
    baselineLoad:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1,
    mainDesign: Object.freeze({
      role: "primary-fixed-heart-rate-trend-test" as const,
      rateCoefficient: 0.4 as const,
      heartRatesBpm: Object.freeze([50, 60, 75, 90] as const),
      armCount: 4 as const,
    }),
    priorSensitivityDesign: Object.freeze({
      role: "fixed-prior-endpoint-sensitivity-not-an-optimizer" as const,
      rateCoefficients: Object.freeze([0.25, 0.66] as const),
      heartRatesBpm: Object.freeze([50, 90] as const),
      armCount: 4 as const,
    }),
    mainAndPriorSensitivityDesignsRemainDistinct: true as const,
    fullCatalogArmCount: 8 as const,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_STEPS_PER_CYCLE_V1,
    commonMaximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCountsByHeartRateBpm: Object.freeze({
      50: 40,
      60: 48,
      75: 60,
      90: 72,
    } as const),
    independentCanonicalColdStartPerArm: true as const,
    warmStartApplied: false as const,
    stopAtFirstAcceptedPeriodicClassification: true as const,
    fixedPhysicalHorizonContinuationClaimed: false as const,
    sameV10ReferenceNonCalciumAssemblyForEveryArm: true as const,
    ventricularCalciumExtremaHeldExactly: true as const,
    ventricularElectricalToCalciumDelayHeldAtSec: 0.012 as const,
    atrioventricularDelayHeldAtSec: 0.12 as const,
    atrialCalciumParamsHeldExactly: true as const,
    systemicOrBloodVolumeRecalibrationApplied: false as const,
    forceFrequencyRelationModeled: false as const,
    calciumCyclingStateModeled: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    arbitraryNumericHeartRateOrCoefficientInputExposed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveArms: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
  armId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (resolved === undefined) {
    throw new Error(
      `unsupported V10 matched-alpha saturating heart-rate law arm: ${String(armId)}`,
    );
  }
  return resolved;
}

function arm(
  profileId: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1 {
  const profile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      profileId,
    );
  return Object.freeze({
    armId: profileId,
    calciumProfileId: profileId,
    designRole: profile.designRole,
    heartRateBpm: profile.heartRateBpm,
    dimensionlessRateCoefficient: profile.dimensionlessRateCoefficient,
    cycleLengthSec: profile.cycleLengthSec,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_STEPS_PER_CYCLE_V1,
    dtSec:
      profile.cycleLengthSec /
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_STEPS_PER_CYCLE_V1,
    maximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCount: maximumBeatCountAtHeartRate(profile.heartRateBpm),
    circulatoryLoadPointId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1.circulatoryLoadPointId,
    stressedVenousVolumePointId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_BASELINE_LOAD_V1.stressedVenousVolumePointId,
    initializationPolicy: "independent-canonical-cold-start" as const,
    periodicTerminationPolicy: "stop-at-first-accepted-classification" as const,
  });
}

function maximumBeatCountAtHeartRate(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
): 40 | 48 | 60 | 72 {
  switch (heartRateBpm) {
    case 50:
      return 40;
    case 60:
      return 48;
    case 75:
      return 60;
    case 90:
      return 72;
  }
}

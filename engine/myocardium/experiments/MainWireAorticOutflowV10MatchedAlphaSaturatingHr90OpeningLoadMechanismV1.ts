import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-hr90-opening-load-mechanism-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1 =
  "matched-alpha-saturating-hr-law-a040-hr-90" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1 =
  Object.freeze([
    "rsys-baseline__stressed-volume-baseline",
    "rsys-baseline__stressed-volume-high",
    "rsys-low__stressed-volume-baseline",
    "rsys-low__stressed-volume-high",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1;
    calciumProfileId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1;
    heartRateBpm: 90;
    dimensionlessRateCoefficient: 0.4;
    systemicResistanceLevel: "baseline" | "low";
    stressedVenousVolumeLevel: "baseline" | "high";
    systemicResistanceScaleFromBaseline: 1 | 0.75;
    canonicalAdditionalStressedVenousVolumeScale: 1 | 1.3333333333333333;
    circulatoryLoadPointId: Extract<
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
      "baseline" | "systemic-resistance-low"
    >;
    stressedVenousVolumePointId: Extract<
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
      "baseline" | "stressed-venous-volume-high"
    >;
    initializationPolicy: "independent-canonical-cold-start";
  }>;

const SYSTEMIC_RESISTANCE_LEVEL = Object.freeze({
  baseline: Object.freeze({
    scale: 1 as const,
    pointId: "baseline" as const,
  }),
  low: Object.freeze({
    scale: 0.75 as const,
    pointId: "systemic-resistance-low" as const,
  }),
});

const STRESSED_VENOUS_VOLUME_LEVEL = Object.freeze({
  baseline: Object.freeze({
    scale: 1 as const,
    pointId: "baseline" as const,
  }),
  high: Object.freeze({
    scale: 1.3333333333333333 as const,
    pointId: "stressed-venous-volume-high" as const,
  }),
});

function arm(
  armId: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1,
  systemicResistanceLevel: "baseline" | "low",
  stressedVenousVolumeLevel: "baseline" | "high",
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1 {
  const systemicResistance = SYSTEMIC_RESISTANCE_LEVEL[systemicResistanceLevel];
  const stressedVenousVolume =
    STRESSED_VENOUS_VOLUME_LEVEL[stressedVenousVolumeLevel];
  return Object.freeze({
    armId,
    calciumProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1,
    heartRateBpm: 90 as const,
    dimensionlessRateCoefficient: 0.4 as const,
    systemicResistanceLevel,
    stressedVenousVolumeLevel,
    systemicResistanceScaleFromBaseline: systemicResistance.scale,
    canonicalAdditionalStressedVenousVolumeScale: stressedVenousVolume.scale,
    circulatoryLoadPointId: systemicResistance.pointId,
    stressedVenousVolumePointId: stressedVenousVolume.pointId,
    initializationPolicy: "independent-canonical-cold-start" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1 =
  Object.freeze([
    arm(
      "rsys-baseline__stressed-volume-baseline",
      "baseline",
      "baseline",
    ),
    arm("rsys-baseline__stressed-volume-high", "baseline", "high"),
    arm("rsys-low__stressed-volume-baseline", "low", "baseline"),
    arm("rsys-low__stressed-volume-high", "low", "high"),
  ] satisfies readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1[]);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-HR90-matched-alpha-saturating-two-by-two-opening-load-mechanism-ablation" as const,
    calciumProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1,
    heartRateHeldAtBpm: 90 as const,
    dimensionlessRateCoefficientHeldAt: 0.4 as const,
    systemicResistanceLevels: Object.freeze(["baseline", "low"] as const),
    systemicResistanceScalesFromBaseline: Object.freeze([1, 0.75] as const),
    stressedVenousVolumeLevels: Object.freeze(["baseline", "high"] as const),
    canonicalAdditionalStressedVenousVolumeScales:
      Object.freeze([1, 4 / 3] as const),
    circulatoryLoadIdsResolvedThroughAuthoritativeCatalog: true as const,
    stressedVenousVolumeIdsResolvedThroughAuthoritativeCatalog: true as const,
    onlySystemicResistanceRuntimeAxisEligibleToDiffer: true as const,
    onlyCanonicalAdditionalSvVcVolumeEligibleToDiffer: true as const,
    mechanicsValveComplianceAndTrefAssemblyHeldExactly: true as const,
    calciumAndAtrioventricularTimingHeldExactly: true as const,
    totalBloodVolumeFixedWithinEachRun: true as const,
    independentCanonicalColdStartPerArm: true as const,
    fixedFourArmFactorialOnly: true as const,
    arbitraryNumericLoadInputExposed: false as const,
    outcomeTargetedRecalibrationApplied: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveArms: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
  armId: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (resolved === undefined) {
    throw new Error(
      `unsupported V10 matched-alpha saturating HR90 opening-load mechanism arm: ${String(armId)}`,
    );
  }
  return resolved;
}

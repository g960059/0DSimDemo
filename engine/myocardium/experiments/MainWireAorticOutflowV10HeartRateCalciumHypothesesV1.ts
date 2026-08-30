import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1,
  type MainWireVentricularCalciumHeartRateBpmV1,
  type MainWireVentricularCalciumHeartRateHypothesisIdV1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
  type MainWireAorticOutflowPhysiologyCandidateV10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_V1_ID =
  "main-wire-aortic-outflow-v10-heart-rate-calcium-hypotheses-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1 =
  2_000 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_MAXIMUM_PHYSICAL_HORIZON_SEC_V1 =
  48 as const;

export type MainWireAorticOutflowV10HeartRateCalciumReferenceNonCalciumAssemblyV1 =
  Readonly<{
    derivedFromCandidateId: MainWireAorticOutflowPhysiologyCandidateV10["candidateId"];
    kuwProfileId: MainWireAorticOutflowPhysiologyCandidateV10["kuwProfileId"];
    sarcomereReferenceProfileId: MainWireAorticOutflowPhysiologyCandidateV10["sarcomereReferenceProfileId"];
    calciumSensitivityLengthProfileId: MainWireAorticOutflowPhysiologyCandidateV10["calciumSensitivityLengthProfileId"];
    twitchRetentionCandidateId: MainWireAorticOutflowPhysiologyCandidateV10["twitchRetentionCandidateId"];
    trefForceLoadProfileId: MainWireAorticOutflowPhysiologyCandidateV10["trefForceLoadProfileId"];
    sourceVelocityDistortionProfileId: MainWireAorticOutflowPhysiologyCandidateV10["sourceVelocityDistortionProfileId"];
    strongBridgeDeactivationExitProfileId: MainWireAorticOutflowPhysiologyCandidateV10["strongBridgeDeactivationExitProfileId"];
    complianceProfileId: MainWireAorticOutflowPhysiologyCandidateV10["complianceProfileId"];
    characteristicResistancePlacementProfileId: MainWireAorticOutflowPhysiologyCandidateV10["characteristicResistancePlacementProfileId"];
    rootInertanceProfileId: MainWireAorticOutflowPhysiologyCandidateV10["rootInertanceProfileId"];
    pressureRecoveryProfileId: MainWireAorticOutflowPhysiologyCandidateV10["pressureRecoveryProfileId"];
    recoveredRootPortValveProfileId: MainWireAorticOutflowPhysiologyCandidateV10["recoveredRootPortValveProfileId"];
    aorticMaximumForwardEoaCm2: MainWireAorticOutflowPhysiologyCandidateV10["aorticMaximumForwardEoaCm2"];
  }>;

/**
 * This is the V10-derived assembly held fixed around the calcium drive. It is
 * deliberately not a V10 candidate identity: the V10 calcium profile and AV
 * timing profile are omitted because each experimental arm owns those inputs.
 */
export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 =
  Object.freeze({
    derivedFromCandidateId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
    kuwProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.kuwProfileId,
    sarcomereReferenceProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.sarcomereReferenceProfileId,
    calciumSensitivityLengthProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.calciumSensitivityLengthProfileId,
    twitchRetentionCandidateId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.twitchRetentionCandidateId,
    trefForceLoadProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.trefForceLoadProfileId,
    sourceVelocityDistortionProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.sourceVelocityDistortionProfileId,
    strongBridgeDeactivationExitProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.strongBridgeDeactivationExitProfileId,
    complianceProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.complianceProfileId,
    characteristicResistancePlacementProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.characteristicResistancePlacementProfileId,
    rootInertanceProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.rootInertanceProfileId,
    pressureRecoveryProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.pressureRecoveryProfileId,
    recoveredRootPortValveProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.recoveredRootPortValveProfileId,
    aorticMaximumForwardEoaCm2:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.aorticMaximumForwardEoaCm2,
  }) satisfies MainWireAorticOutflowV10HeartRateCalciumReferenceNonCalciumAssemblyV1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1 =
  Object.freeze({
    circulatoryLoadPointId: "baseline" as const,
    stressedVenousVolumePointId: "baseline" as const,
    complianceProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1.complianceProfileId,
    trefForceLoadProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1.trefForceLoadProfileId,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARM_IDS_V1 =
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1;

export type MainWireAorticOutflowV10HeartRateCalciumArmIdV1 =
  MainWireVentricularCalciumHeartRateHypothesisProfileIdV1;

export type MainWireAorticOutflowV10HeartRateCalciumArmV1 = Readonly<{
  armId: MainWireAorticOutflowV10HeartRateCalciumArmIdV1;
  calciumProfileId: MainWireVentricularCalciumHeartRateHypothesisProfileIdV1;
  calciumHypothesisId: MainWireVentricularCalciumHeartRateHypothesisIdV1;
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1;
  cycleLengthSec: number;
  stepsPerCycle: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1;
  dtSec: number;
  maximumPhysicalHorizonSec: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_MAXIMUM_PHYSICAL_HORIZON_SEC_V1;
  maximumBeatCount: 40 | 48 | 60 | 72;
  circulatoryLoadPointId: "baseline";
  stressedVenousVolumePointId: "baseline";
  initializationPolicy: "independent-canonical-cold-start";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARM_IDS_V1.map(
      (profileId) => arm(profileId),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V10-reference-non-calcium-assembly-heart-rate-calcium-timing-hypotheses" as const,
    referenceNonCalciumAssembly:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    referenceAssemblyIsFullV10CandidateIdentity: false as const,
    V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false as const,
    baselineLoad:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1,
    heartRatesBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1,
    fullDesignArmCount: 8 as const,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1,
    commonMaximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCountsByHeartRateBpm: Object.freeze({
      50: 40,
      60: 48,
      75: 60,
      90: 72,
    } as const),
    independentCanonicalColdStartPerArm: true as const,
    warmStartApplied: false as const,
    phaseScaledHypothesis:
      "exact-Coppini-ventricular-source-values-uniformly-mapped-over-each-RR-interval" as const,
    absoluteTimeHypothesis:
      "existing-whole-trace-alpha-fit-rise-and-decay-time-constants-held-in-absolute-seconds" as const,
    atrioventricularElectricalOnsetDelaySec: 0.12 as const,
    phaseScaledHypothesisVentricularElectricalToCalciumDelaySec: 0 as const,
    absoluteTimeHypothesisVentricularElectricalToCalciumDelaySec:
      0.012 as const,
    crossHypothesisVentricularElectricalToCalciumDelayDifferenceSec:
      0.012 as const,
    crossHypothesisLevelComparisonIsPrimary: false as const,
    withinHypothesisHeartRateTrendsArePrimary: true as const,
    intracellularCalciumCyclingDynamicsModeled: false as const,
    calciumRestitutionModeled: false as const,
    forceFrequencyRelationModeled: false as const,
    rateDependentAtrioventricularConductionModeled: false as const,
    baroreflexModeled: false as const,
    physiologicalRateAdaptationClaimed: false as const,
    systemicOrBloodVolumeRecalibrationApplied: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    arbitraryNumericHeartRateOrCalciumInputExposed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveArms: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    nonHr60V3WarmStartEmissionSuppressed: true as const,
    nonHr60V3WarmStartRestoreRejected: true as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10HeartRateCalciumArmV1(
  armId: MainWireAorticOutflowV10HeartRateCalciumArmIdV1,
): MainWireAorticOutflowV10HeartRateCalciumArmV1 {
  const resolved = MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1.find(
    (candidateArm) => candidateArm.armId === armId,
  );
  if (resolved === undefined) {
    throw new Error(`unsupported V10 heart-rate calcium arm: ${String(armId)}`);
  }
  return resolved;
}

function arm(
  profileId: MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
): MainWireAorticOutflowV10HeartRateCalciumArmV1 {
  const profile =
    resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(profileId);
  const maximumBeatCount = maximumBeatCountAtHeartRate(profile.heartRateBpm);
  return Object.freeze({
    armId: profileId,
    calciumProfileId: profileId,
    calciumHypothesisId: profile.hypothesisId,
    heartRateBpm: profile.heartRateBpm,
    cycleLengthSec: profile.cycleLengthSec,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1,
    dtSec:
      profile.cycleLengthSec /
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_STEPS_PER_CYCLE_V1,
    maximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCount,
    circulatoryLoadPointId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1.circulatoryLoadPointId,
    stressedVenousVolumePointId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_BASELINE_LOAD_V1.stressedVenousVolumePointId,
    initializationPolicy: "independent-canonical-cold-start" as const,
  });
}

function maximumBeatCountAtHeartRate(
  heartRateBpm: MainWireVentricularCalciumHeartRateBpmV1,
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

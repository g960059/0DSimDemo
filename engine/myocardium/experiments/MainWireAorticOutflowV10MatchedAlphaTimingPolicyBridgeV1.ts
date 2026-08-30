import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-timing-policy-bridge-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1 =
  2_000 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_MAXIMUM_PHYSICAL_HORIZON_SEC_V1 =
  48 as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARM_IDS_V1 =
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmIdV1 =
  MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmIdV1;
    calciumProfileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1;
    timingPolicy: MainWireVentricularCalciumMatchedAlphaTimingPolicyV1;
    heartRateBpm: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeHeartRateBpmV1;
    cycleLengthSec: number;
    stepsPerCycle: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1;
    dtSec: number;
    maximumPhysicalHorizonSec: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_MAXIMUM_PHYSICAL_HORIZON_SEC_V1;
    maximumBeatCount: 40 | 72;
    initializationPolicy: "independent-canonical-cold-start";
    periodicTerminationPolicy: "stop-at-first-accepted-classification";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARM_IDS_V1.map(
      (profileId) => arm(profileId),
    ),
  );

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V10-reference-matched-alpha-heart-rate-timing-policy-factorial-bridge" as const,
    referenceNonCalciumAssembly:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    referenceAssemblyIsFullV10CandidateIdentity: false as const,
    heartRatesBpm: Object.freeze([50, 90] as const),
    timingPolicies: Object.freeze([
      "fixed-absolute-time",
      "rr-scaled-tau",
    ] as const),
    fullDesignArmCount: 4 as const,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1,
    commonMaximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCountsByHeartRateBpm: Object.freeze({ 50: 40, 90: 72 } as const),
    stopAtFirstAcceptedPeriodicClassification: true as const,
    fixedPhysicalHorizonContinuationClaimed: false as const,
    independentCanonicalColdStartPerArm: true as const,
    warmStartApplied: false as const,
    nonHr60V3WarmStartEmissionSuppressed: true as const,
    waveformFamilyHeldExactly: true as const,
    ventricularCalciumExtremaHeldExactly: true as const,
    ventricularElectricalToCalciumDelayHeldAtSec: 0.012 as const,
    atrioventricularDelayHeldAtSec: 0.12 as const,
    atrialCalciumParamsHeldExactly: true as const,
    onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy:
      true as const,
    primaryEstimand:
      "rr-scaled-tau-HR90-minus-HR50-change-minus-fixed-absolute-time-HR90-minus-HR50-change" as const,
    forceFrequencyRelationModeled: false as const,
    calciumCyclingStateModeled: false as const,
    systemicOrBloodVolumeRecalibrationApplied: false as const,
    fixedDiscreteCandidatesOnly: true as const,
    arbitraryNumericHeartRateOrTimeConstantInputExposed: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveArms: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1(
  armId: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmIdV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (resolved === undefined) {
    throw new Error(
      `unsupported V10 matched-alpha timing-policy bridge arm: ${String(armId)}`,
    );
  }
  return resolved;
}

function arm(
  profileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1 {
  const profile =
    resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
      profileId,
    );
  const maximumBeatCount = profile.heartRateBpm === 50 ? 40 : 72;
  return Object.freeze({
    armId: profileId,
    calciumProfileId: profileId,
    timingPolicy: profile.timingPolicy,
    heartRateBpm: profile.heartRateBpm,
    cycleLengthSec: profile.cycleLengthSec,
    stepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1,
    dtSec:
      profile.cycleLengthSec /
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1,
    maximumPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_MAXIMUM_PHYSICAL_HORIZON_SEC_V1,
    maximumBeatCount,
    initializationPolicy: "independent-canonical-cold-start" as const,
    periodicTerminationPolicy: "stop-at-first-accepted-classification" as const,
  });
}

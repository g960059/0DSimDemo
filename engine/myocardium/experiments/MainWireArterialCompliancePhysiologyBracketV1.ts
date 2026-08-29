import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_V1_ID =
  "main-wire-arterial-compliance-physiology-bracket-v1" as const;

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical",
    "arterial-stiffness-three-halves",
    "arterial-stiffness-twofold",
    "arterial-stiffness-eight-thirds",
    "arterial-stiffness-threefold",
    "arterial-stiffness-fourfold",
  ] as const);

export type MainWireArterialCompliancePhysiologyProfileIdV1 =
  (typeof MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1)[number];

export type MainWireArterialCompliancePhysiologyProfileV1 = Readonly<{
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1;
  arterialStiffnessScaleFromBaseline:
    1 | 1.5 | 2 | 2.6666666666666665 | 3 | 4;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-source-magnitude-informed-systemic-arterial-compliance-bracket" as const,
    changedExactOwner:
      "systemic-arterial-exponential-PV-tangent-stiffness-about-topology-design-pressure" as const,
    affectedNodes: Object.freeze(["Ao", "SA", "Art"] as const),
    pulmonaryArterialNodesHeldAtGlobalRuntimeStiffness: true as const,
    systemicAndPulmonaryArterialStiffnessOwnersSeparated: true as const,
    topologyDesignPressurePreservedAtGlobalLawReferenceVolume: true as const,
    exponentialLawInterceptTranslatedToPreserveReferencePressure: true as const,
    stiffnessScaleAxis:
      Object.freeze([1, 1.5, 2, 8 / 3, 3, 4] as const),
    threeHalvesPointDerivation:
      "pre-existing-twofold-profile-times-three-quarters-load-coordinate" as const,
    externalContext:
      "human-total-arterial-compliance-and-Land-2017-three-element-Windkessel-compliance" as const,
    directEquivalenceOfSummedNodeTangentComplianceAndClinicalTacClaimed:
      false as const,
    physicalColdSeedVolumeAndTotalBloodVolumeChanged: false as const,
    systemicOrPulmonaryResistanceChanged: false as const,
    aorticRootCompliancePartitionChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    mechanicsOrCalciumChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
    clinicalValidationClaimed: false as const,
  });

function profile(
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1,
  arterialStiffnessScaleFromBaseline:
    1 | 1.5 | 2 | 2.6666666666666665 | 3 | 4,
): MainWireArterialCompliancePhysiologyProfileV1 {
  return Object.freeze({
    profileId,
    arterialStiffnessScaleFromBaseline,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}

export const MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILES_V1 =
  Object.freeze({
    canonical: profile("canonical", 1),
    "arterial-stiffness-three-halves": profile(
      "arterial-stiffness-three-halves",
      1.5,
    ),
    "arterial-stiffness-twofold": profile(
      "arterial-stiffness-twofold",
      2,
    ),
    "arterial-stiffness-eight-thirds": profile(
      "arterial-stiffness-eight-thirds",
      2.6666666666666665,
    ),
    "arterial-stiffness-threefold": profile(
      "arterial-stiffness-threefold",
      3,
    ),
    "arterial-stiffness-fourfold": profile(
      "arterial-stiffness-fourfold",
      4,
    ),
  } satisfies Readonly<Record<
    MainWireArterialCompliancePhysiologyProfileIdV1,
    MainWireArterialCompliancePhysiologyProfileV1
  >>);

export function resolveMainWireArterialCompliancePhysiologyProfileV1(
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1,
): MainWireArterialCompliancePhysiologyProfileV1 {
  const resolved =
    MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILES_V1[profileId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported arterial compliance physiology profile: ${String(profileId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireArterialCompliancePhysiologyRuntimeV1(
  profileId: MainWireArterialCompliancePhysiologyProfileIdV1,
): NonCoronaryCirculationRuntimeParamsV1 {
  const profileValue = resolveMainWireArterialCompliancePhysiologyProfileV1(
    profileId,
  );
  const baseline = normalAdultMainWireRuntimeV1();
  return Object.freeze({
    ...baseline,
    vascular: Object.freeze({
      ...baseline.vascular,
      systemicArterialStiffnessScaleFromGlobal:
        profileValue.arterialStiffnessScaleFromBaseline,
    }),
  });
}

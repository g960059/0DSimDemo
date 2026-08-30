import type {
  MainWireAorticRecoveredRootPortValveProfileIdV1,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_V1_ID =
  "main-wire-aortic-outflow-v10-constitutive-ownership-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1 =
  Object.freeze([
    "v9-full-vena-contracta-raw-opening",
    "v9-garcia-recovery-raw-opening",
    "v10-garcia-recovery-local-port-opening",
  ] as const);

export type MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1)[number];

export type MainWireAorticOutflowV10ConstitutiveOwnershipArmV1 = Readonly<{
  armId: MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1;
  candidateId:
    | "main-wire-aortic-outflow-physiology-candidate-v9"
    | "main-wire-aortic-outflow-physiology-candidate-v10";
  pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1 | null;
  recoveredRootPortValveProfileId:
    MainWireAorticRecoveredRootPortValveProfileIdV1 | null;
  openingDrivePressureStation:
    | "LV-minus-Ao-compliance-node"
    | "LV-minus-proximal-constitutive-port";
  exactForwardPortLaw:
    | "full-vena-contracta-drop-plus-characteristic-load"
    | "Garcia-recovered-static-drop-plus-characteristic-load";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARMS_V1 =
  Object.freeze({
    "v9-full-vena-contracta-raw-opening": arm(
      "v9-full-vena-contracta-raw-opening",
      "main-wire-aortic-outflow-physiology-candidate-v9",
      null,
      null,
      "LV-minus-Ao-compliance-node",
      "full-vena-contracta-drop-plus-characteristic-load",
    ),
    "v9-garcia-recovery-raw-opening": arm(
      "v9-garcia-recovery-raw-opening",
      "main-wire-aortic-outflow-physiology-candidate-v9",
      "pressure-recovery-aa-d3p0cm",
      null,
      "LV-minus-Ao-compliance-node",
      "Garcia-recovered-static-drop-plus-characteristic-load",
    ),
    "v10-garcia-recovery-local-port-opening": arm(
      "v10-garcia-recovery-local-port-opening",
      "main-wire-aortic-outflow-physiology-candidate-v10",
      "pressure-recovery-aa-d3p0cm",
      "Land2017-Zc-Garcia-AA-d3p0cm-local-opening",
      "LV-minus-proximal-constitutive-port",
      "Garcia-recovered-static-drop-plus-characteristic-load",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1,
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1
  >>);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-three-arm-exact-constitutive-ownership-ablation" as const,
    independentCanonicalColdStartPerArm: true as const,
    firstContrast:
      "pressure-recovery-at-raw-node-opening-drive" as const,
    secondContrast:
      "local-port-opening-drive-and-exact-energy-ownership-at-fixed-recovery" as const,
    systemicRecalibrationApplied: false as const,
    totalBloodVolumeChanged: false as const,
    aorticValveMaximumEoaChanged: false as const,
    characteristicImpedanceMagnitudeChanged: false as const,
    aorticRootInertanceChanged: false as const,
    ventricularCalciumOrMechanicsChanged: false as const,
    fixedAscendingAorticGeometryChanged: false as const,
    newContinuousStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1(
  armId: MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1,
): MainWireAorticOutflowV10ConstitutiveOwnershipArmV1 {
  return MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARMS_V1[armId];
}

function arm(
  armId: MainWireAorticOutflowV10ConstitutiveOwnershipArmIdV1,
  candidateId: MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["candidateId"],
  pressureRecoveryProfileId:
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["pressureRecoveryProfileId"],
  recoveredRootPortValveProfileId:
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["recoveredRootPortValveProfileId"],
  openingDrivePressureStation:
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["openingDrivePressureStation"],
  exactForwardPortLaw:
    MainWireAorticOutflowV10ConstitutiveOwnershipArmV1["exactForwardPortLaw"],
): MainWireAorticOutflowV10ConstitutiveOwnershipArmV1 {
  return Object.freeze({
    armId,
    candidateId,
    pressureRecoveryProfileId,
    recoveredRootPortValveProfileId,
    openingDrivePressureStation,
    exactForwardPortLaw,
  });
}

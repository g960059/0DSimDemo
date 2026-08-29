import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  MainWireAorticCharacteristicResistancePlacementProfileIdV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-characteristic-resistance-placement-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "canonical-half-resistance-upstream",
    "canonical-all-resistance-upstream",
    "et-candidate",
    "et-candidate-half-resistance-upstream",
    "et-candidate-all-resistance-upstream",
  ] as const);

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1)[number];

export type MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1 =
  Readonly<{
    armId:
      MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1;
    ventricularMaterialPointId: Extract<
      MainWireNormalAdultVentricularMaterialResearchPointIdV1,
      | "baseline"
      | "ventricular-velocity-distortion-threefold-plus-tref-three-halves"
    >;
    placementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileIdV1 | null;
    mechanicsFactor: "canonical" | "et-candidate";
    placementFactor: "canonical" | "half-upstream" | "all-upstream";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-two-mechanics-by-three-characteristic-resistance-placement-ablation" as const,
    mechanicsAxis:
      "canonical-versus-Aeff-threefold-Tref-three-halves" as const,
    placementAxis: Object.freeze([
      "canonical-Ao-SA-resistance-downstream-of-Ao-compliance",
      "half-Ao-SA-resistance-moved-to-AoV-linear-series-term",
      "all-Ao-SA-resistance-moved-to-AoV-linear-series-term",
    ] as const),
    sourceTopologyLinearResistanceSumPreservedExactly: true as const,
    pulsatileCircuitEquivalenceClaimed: false as const,
    independentCanonicalColdStartPerArm: true as const,
    baselineCirculatoryLoadOnly: true as const,
    aorticMaximumForwardEoaChanged: false as const,
    openingModeChanged: false as const,
    pressureRecoveryChanged: false as const,
    localValveInertanceChanged: false as const,
    aorticRootComplianceChanged: false as const,
    aorticRootInertanceChanged: false as const,
    newStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

function arm(
  armId:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
  mechanicsFactor:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1[
      "mechanicsFactor"
    ],
  placementFactor:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1[
      "placementFactor"
    ],
): MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1 {
  const ventricularMaterialPointId = mechanicsFactor === "canonical"
    ? "baseline" as const
    : "ventricular-velocity-distortion-threefold-plus-tref-three-halves" as const;
  const placementProfileId = placementFactor === "canonical"
    ? null
    : placementFactor === "half-upstream"
      ? "half-Ao-SA-resistance-upstream-of-root-compliance" as const
      : "all-Ao-SA-resistance-upstream-of-root-compliance" as const;
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    placementProfileId,
    mechanicsFactor,
    placementFactor,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "canonical", "canonical"),
    "canonical-half-resistance-upstream": arm(
      "canonical-half-resistance-upstream",
      "canonical",
      "half-upstream",
    ),
    "canonical-all-resistance-upstream": arm(
      "canonical-all-resistance-upstream",
      "canonical",
      "all-upstream",
    ),
    "et-candidate": arm("et-candidate", "et-candidate", "canonical"),
    "et-candidate-half-resistance-upstream": arm(
      "et-candidate-half-resistance-upstream",
      "et-candidate",
      "half-upstream",
    ),
    "et-candidate-all-resistance-upstream": arm(
      "et-candidate-all-resistance-upstream",
      "et-candidate",
      "all-upstream",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1
  >>);

export function resolveMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1(
  armId:
    MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmIdV1,
): MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARMS_V1[
      armId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ET/characteristic-resistance placement arm: ${String(armId)}`,
    );
  }
  return resolved;
}

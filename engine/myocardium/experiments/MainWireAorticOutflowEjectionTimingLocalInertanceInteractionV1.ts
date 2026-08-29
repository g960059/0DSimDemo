import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  MainWireAorticValveLocalInertanceProfileIdV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-local-inertance-interaction-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "historical-topology-local-inertance",
    "physical-local-inertance-7cm",
    "et-candidate",
    "et-candidate-plus-historical-topology-local-inertance",
    "et-candidate-plus-physical-local-inertance-7cm",
  ] as const);

export type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1)[number];

export type MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1 =
  Readonly<{
    armId:
      MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1;
    ventricularMaterialPointId: Extract<
      MainWireNormalAdultVentricularMaterialResearchPointIdV1,
      | "baseline"
      | "ventricular-velocity-distortion-threefold-plus-tref-three-halves"
    >;
    localInertanceProfileId:
      MainWireAorticValveLocalInertanceProfileIdV1 | null;
    mechanicsFactor: "canonical" | "et-candidate";
    localInertanceFactor: "off" | "topology" | "physical-7cm";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-two-mechanics-by-three-local-inertance-interaction-ablation" as const,
    mechanicsAxis:
      "canonical-versus-Aeff-threefold-Tref-three-halves" as const,
    localInertanceAxis: Object.freeze([
      "off",
      "graph-owned-AoV-topology-L",
      "rho-times-seven-centimeter-column-over-fixed-d2p3cm-LVOT-area",
    ] as const),
    localInertanceValuesChosenBeforeCombination: true as const,
    independentCanonicalColdStartPerArm: true as const,
    baselineCirculatoryLoadOnly: true as const,
    aorticMaximumForwardEoaChanged: false as const,
    pressureRecoveryChanged: false as const,
    openingModeChanged: false as const,
    newLeafletOpeningStateAdded: false as const,
    localFlowStateOwner:
      "research-runner-external-atomic-promotion-only-when-local-inertance-on" as const,
    canonicalAcceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

function arm(
  armId: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
  mechanicsFactor:
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1[
      "mechanicsFactor"
    ],
  localInertanceFactor:
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1[
      "localInertanceFactor"
    ],
): MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1 {
  const ventricularMaterialPointId = mechanicsFactor === "canonical"
    ? "baseline" as const
    : "ventricular-velocity-distortion-threefold-plus-tref-three-halves" as const;
  const localInertanceProfileId = localInertanceFactor === "off"
    ? null
    : localInertanceFactor === "topology"
      ? "historical-topology-local-inertance" as const
      : "fixed-lvot-d2p3cm-column-l7cm-local-inertance" as const;
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    localInertanceProfileId,
    mechanicsFactor,
    localInertanceFactor,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "canonical", "off"),
    "historical-topology-local-inertance": arm(
      "historical-topology-local-inertance",
      "canonical",
      "topology",
    ),
    "physical-local-inertance-7cm": arm(
      "physical-local-inertance-7cm",
      "canonical",
      "physical-7cm",
    ),
    "et-candidate": arm("et-candidate", "et-candidate", "off"),
    "et-candidate-plus-historical-topology-local-inertance": arm(
      "et-candidate-plus-historical-topology-local-inertance",
      "et-candidate",
      "topology",
    ),
    "et-candidate-plus-physical-local-inertance-7cm": arm(
      "et-candidate-plus-physical-local-inertance-7cm",
      "et-candidate",
      "physical-7cm",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
    MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1
  >>);

export function resolveMainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1(
  armId: MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmIdV1,
): MainWireAorticOutflowEjectionTimingLocalInertanceInteractionArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARMS_V1[
      armId
    ];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ET/local-inertance interaction arm: ${String(armId)}`,
    );
  }
  return resolved;
}

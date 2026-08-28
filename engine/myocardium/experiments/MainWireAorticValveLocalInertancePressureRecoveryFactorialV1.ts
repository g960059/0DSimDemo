import type {
  MainWireAorticValveLocalInertanceProfileIdV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";
import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_V1_ID =
  "main-wire-aortic-valve-local-inertance-pressure-recovery-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "pressure-recovery-aa-d3p0cm",
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance-plus-pressure-recovery-aa-d3p0cm",
  ] as const);

export type MainWireAorticValveLocalInertancePressureRecoveryArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1)[number];

export type MainWireAorticValveLocalInertancePressureRecoveryArmV1 =
  Readonly<{
    armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1;
    localInertanceProfileId: Extract<
      MainWireAorticValveLocalInertanceProfileIdV1,
      "fixed-lvot-d2p3cm-column-l7cm-local-inertance"
    > | null;
    pressureRecoveryProfileId: Extract<
      MainWireAorticValveResearchProfileIdV1,
      "pressure-recovery-aa-d3p0cm"
    > | null;
    localInertanceFactor: "off" | "upper-physical-bracket";
    pressureRecoveryFactor: "off" | "fixed-aa-d3p0cm";
  }>;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_CLAIM_V1 =
  Object.freeze({
    role: "fixed-one-sided-two-by-two-source-research-falsification" as const,
    localInertanceAxis:
      "rho-times-seven-centimeter-effective-column-over-fixed-d2p3cm-LVOT-area" as const,
    localInertanceAxisIsUpperPhysicalBracketNotFit: true as const,
    effectiveColumnLengthIsMechanisticHypothesisNotMeasuredAnatomy: true as const,
    pressureRecoveryAxis:
      "Garcia-ELCo-loss-plus-fixed-d3p0cm-ascending-aortic-kinetic-flux" as const,
    pressureRecoveryAndLocalInertanceOccupyDistinctMomentumTerms: true as const,
    independentCanonicalColdStartPerArm: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    aorticMaximumForwardEoaChanged: false as const,
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
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
  localInertanceProfileId:
    MainWireAorticValveLocalInertancePressureRecoveryArmV1[
      "localInertanceProfileId"
    ],
  pressureRecoveryProfileId:
    MainWireAorticValveLocalInertancePressureRecoveryArmV1[
      "pressureRecoveryProfileId"
    ],
): MainWireAorticValveLocalInertancePressureRecoveryArmV1 {
  return Object.freeze({
    armId,
    localInertanceProfileId,
    pressureRecoveryProfileId,
    localInertanceFactor: localInertanceProfileId === null
      ? "off" as const
      : "upper-physical-bracket" as const,
    pressureRecoveryFactor: pressureRecoveryProfileId === null
      ? "off" as const
      : "fixed-aa-d3p0cm" as const,
  });
}

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", null, null),
    "pressure-recovery-aa-d3p0cm": arm(
      "pressure-recovery-aa-d3p0cm",
      null,
      "pressure-recovery-aa-d3p0cm",
    ),
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance": arm(
      "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
      "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
      null,
    ),
    "fixed-lvot-d2p3cm-column-l7cm-local-inertance-plus-pressure-recovery-aa-d3p0cm":
      arm(
        "fixed-lvot-d2p3cm-column-l7cm-local-inertance-plus-pressure-recovery-aa-d3p0cm",
        "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
        "pressure-recovery-aa-d3p0cm",
      ),
  } satisfies Readonly<Record<
    MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
    MainWireAorticValveLocalInertancePressureRecoveryArmV1
  >>);

export function resolveMainWireAorticValveLocalInertancePressureRecoveryArmV1(
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
): MainWireAorticValveLocalInertancePressureRecoveryArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported AoV local-inertance/pressure-recovery arm: ${String(armId)}`,
    );
  }
  return resolved;
}

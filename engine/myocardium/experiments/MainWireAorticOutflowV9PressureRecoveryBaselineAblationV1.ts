import type {
  MainWireAorticValveResearchProfileIdV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_V1_ID =
  "main-wire-aortic-outflow-v9-pressure-recovery-baseline-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1 =
  Object.freeze([
    "v9-full-vena-contracta-port",
    "v9-garcia-recovered-static-port-aa-d3p0cm",
  ] as const);

export type MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARM_IDS_V1)[number];

export type MainWireAorticOutflowV9PressureRecoveryBaselineArmV1 = Readonly<{
  armId: MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1;
  pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1 | null;
  expectedExactForwardPort:
    | "full-vena-contracta-drop"
    | "garcia-energy-loss-plus-downstream-kinetic-flux";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARMS_V1 =
  Object.freeze({
    "v9-full-vena-contracta-port": arm(
      "v9-full-vena-contracta-port",
      null,
      "full-vena-contracta-drop",
    ),
    "v9-garcia-recovered-static-port-aa-d3p0cm": arm(
      "v9-garcia-recovered-static-port-aa-d3p0cm",
      "pressure-recovery-aa-d3p0cm",
      "garcia-energy-loss-plus-downstream-kinetic-flux",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1,
    MainWireAorticOutflowV9PressureRecoveryBaselineArmV1
  >>);

export const MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-V9-two-arm-exact-combination-ablation" as const,
    changedAxisOnly: "aortic-forward-convective-port-law" as const,
    pressureRecoveryGeometry:
      "fixed-three-centimeter-ascending-aortic-diameter-research-point" as const,
    independentCanonicalColdStartPerArm: true as const,
    systemicRecalibrationApplied: false as const,
    aorticValveAreaChanged: false as const,
    proximalCharacteristicResistancePlacementChanged: false as const,
    aorticRootInertanceChanged: false as const,
    ventricularCalciumOrMechanicsChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    pressureRecoveryAddsContinuousState: false as const,
    combinationIsCandidateFalsificationNotV10Adoption: true as const,
    leafletOpeningDriveStillUsesRawLvMinusReservoirNodePressure:
      true as const,
    characteristicWavePowerRequiresAnalysisSideSeparation: true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireAorticOutflowV9PressureRecoveryBaselineArmV1(
  armId: MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1,
): MainWireAorticOutflowV9PressureRecoveryBaselineArmV1 {
  return MAIN_WIRE_AORTIC_OUTFLOW_V9_PRESSURE_RECOVERY_BASELINE_ARMS_V1[armId];
}

function arm(
  armId: MainWireAorticOutflowV9PressureRecoveryBaselineArmIdV1,
  pressureRecoveryProfileId: MainWireAorticValveResearchProfileIdV1 | null,
  expectedExactForwardPort:
    MainWireAorticOutflowV9PressureRecoveryBaselineArmV1["expectedExactForwardPort"],
): MainWireAorticOutflowV9PressureRecoveryBaselineArmV1 {
  return Object.freeze({
    armId,
    pressureRecoveryProfileId,
    expectedExactForwardPort,
  });
}

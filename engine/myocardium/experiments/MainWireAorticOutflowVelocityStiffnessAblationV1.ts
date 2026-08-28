import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ABLATION_V1_ID =
  "main-wire-aortic-outflow-velocity-stiffness-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-velocity-distortion-high",
    "arterial-stiffness-high",
    "ventricular-velocity-distortion-high-plus-arterial-stiffness-high",
  ] as const);

export type MainWireAorticOutflowVelocityStiffnessArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARM_IDS_V1)[number];

export type MainWireAorticOutflowVelocityStiffnessArmV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    "baseline" | "ventricular-velocity-distortion-high"
  >;
  circulatoryLoadPointId: Extract<
    MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
    "baseline" | "arterial-stiffness-high"
  >;
  velocityDistortionFactor: "baseline" | "high";
  arterialStiffnessFactor: "baseline" | "high";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-existing-mechanism-load-ablation" as const,
    velocityAxis:
      "common-LVFW-SEP-RVFW-Land-Aeff-four-thirds-scale" as const,
    loadAxis:
      "global-Ao-SA-Art-exponential-PV-stiffness-four-thirds-scale" as const,
    complementaryDirectionHypothesis:
      "velocity-distortion-reduces-early-drive-while-stiffness-preserves-loaded-length-and-late-afterload" as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    outcomeInformedFactorCombination: true as const,
    numericParameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowVelocityStiffnessArmV1[
      "ventricularMaterialPointId"
    ],
  circulatoryLoadPointId:
    MainWireAorticOutflowVelocityStiffnessArmV1["circulatoryLoadPointId"],
): MainWireAorticOutflowVelocityStiffnessArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    circulatoryLoadPointId,
    velocityDistortionFactor:
      ventricularMaterialPointId === "ventricular-velocity-distortion-high"
        ? "high" as const
        : "baseline" as const,
    arterialStiffnessFactor:
      circulatoryLoadPointId === "arterial-stiffness-high"
        ? "high" as const
        : "baseline" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "baseline", "baseline"),
    "ventricular-velocity-distortion-high": arm(
      "ventricular-velocity-distortion-high",
      "ventricular-velocity-distortion-high",
      "baseline",
    ),
    "arterial-stiffness-high": arm(
      "arterial-stiffness-high",
      "baseline",
      "arterial-stiffness-high",
    ),
    "ventricular-velocity-distortion-high-plus-arterial-stiffness-high": arm(
      "ventricular-velocity-distortion-high-plus-arterial-stiffness-high",
      "ventricular-velocity-distortion-high",
      "arterial-stiffness-high",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowVelocityStiffnessArmIdV1,
    MainWireAorticOutflowVelocityStiffnessArmV1
  >>);

export function resolveMainWireAorticOutflowVelocityStiffnessArmV1(
  armId: MainWireAorticOutflowVelocityStiffnessArmIdV1,
): MainWireAorticOutflowVelocityStiffnessArmV1 {
  const arm = MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_STIFFNESS_ARMS_V1[armId];
  if (arm === undefined) {
    throw new Error(
      `unsupported aortic outflow velocity/stiffness arm: ${String(armId)}`,
    );
  }
  return arm;
}

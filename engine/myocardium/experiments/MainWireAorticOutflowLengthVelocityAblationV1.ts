import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ABLATION_V1_ID =
  "main-wire-aortic-outflow-length-velocity-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-length-dependence-low",
    "ventricular-velocity-distortion-high",
    "ventricular-length-dependence-low-plus-velocity-distortion-high",
  ] as const);

export type MainWireAorticOutflowLengthVelocityArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARM_IDS_V1)[number];

export type MainWireAorticOutflowLengthVelocityArmV1 = Readonly<{
  armId: MainWireAorticOutflowLengthVelocityArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-length-dependence-low"
    | "ventricular-velocity-distortion-high"
    | "ventricular-length-dependence-low-plus-velocity-distortion-high"
  >;
  lengthDependenceFactor: "baseline" | "low";
  velocityDistortionFactor: "baseline" | "high";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-existing-Land-mechanism-ablation" as const,
    lengthAxis:
      "common-LVFW-SEP-RVFW-beta0-and-beta1-three-quarter-scale" as const,
    velocityAxis:
      "common-LVFW-SEP-RVFW-Aeff-four-thirds-scale" as const,
    fixedLengthInvariant:
      "Aeff-has-zero-drive-at-zero-strain-rate-and-beta-effects-vanish-at-lambda-one" as const,
    existingLandStateCountChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    outcomeInformedFactorSelection: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowLengthVelocityArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowLengthVelocityArmV1["ventricularMaterialPointId"],
): MainWireAorticOutflowLengthVelocityArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    lengthDependenceFactor:
      ventricularMaterialPointId === "ventricular-length-dependence-low"
          || ventricularMaterialPointId
            === "ventricular-length-dependence-low-plus-velocity-distortion-high"
        ? "low" as const
        : "baseline" as const,
    velocityDistortionFactor:
      ventricularMaterialPointId === "ventricular-velocity-distortion-high"
          || ventricularMaterialPointId
            === "ventricular-length-dependence-low-plus-velocity-distortion-high"
        ? "high" as const
        : "baseline" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARMS_V1 = Object.freeze({
  canonical: arm("canonical", "baseline"),
  "ventricular-length-dependence-low": arm(
    "ventricular-length-dependence-low",
    "ventricular-length-dependence-low",
  ),
  "ventricular-velocity-distortion-high": arm(
    "ventricular-velocity-distortion-high",
    "ventricular-velocity-distortion-high",
  ),
  "ventricular-length-dependence-low-plus-velocity-distortion-high": arm(
    "ventricular-length-dependence-low-plus-velocity-distortion-high",
    "ventricular-length-dependence-low-plus-velocity-distortion-high",
  ),
} satisfies Readonly<Record<
  MainWireAorticOutflowLengthVelocityArmIdV1,
  MainWireAorticOutflowLengthVelocityArmV1
>>);

export function resolveMainWireAorticOutflowLengthVelocityArmV1(
  armId: MainWireAorticOutflowLengthVelocityArmIdV1,
): MainWireAorticOutflowLengthVelocityArmV1 {
  const arm = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_VELOCITY_ARMS_V1[armId];
  if (arm === undefined) {
    throw new Error(
      `unsupported aortic outflow length/velocity arm: ${String(armId)}`,
    );
  }
  return arm;
}

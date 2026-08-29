import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ABLATION_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-amplitude-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-velocity-distortion-high",
    "ventricular-velocity-distortion-twofold",
    "ventricular-velocity-distortion-five-halves",
    "ventricular-velocity-distortion-threefold",
    "ventricular-velocity-distortion-fourfold",
  ] as const);

export type MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1)[number];

export type MainWireAorticOutflowVelocityDistortionAmplitudeArmV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-velocity-distortion-high"
    | "ventricular-velocity-distortion-twofold"
    | "ventricular-velocity-distortion-five-halves"
    | "ventricular-velocity-distortion-threefold"
    | "ventricular-velocity-distortion-fourfold"
  >;
  aeffScaleFromBaseline: 1 | 2 | 4 | number;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-Land-Aeff-loaded-shortening-causal-envelope" as const,
    aeffScaleEnvelope: Object.freeze([1, 4 / 3, 2, 2.5, 3, 4]),
    phiHeldExactlyAtBaseline: true as const,
    distortionRecoveryTimeConstantsHeldAtBaseline: true as const,
    fixedLengthIsometricLandTrajectoryUnchanged: true as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    lengthDependenceChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    existingLandStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowVelocityDistortionAmplitudeArmV1[
      "ventricularMaterialPointId"
    ],
  aeffScaleFromBaseline: number,
): MainWireAorticOutflowVelocityDistortionAmplitudeArmV1 {
  return Object.freeze({ armId, ventricularMaterialPointId, aeffScaleFromBaseline });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "baseline", 1),
    "ventricular-velocity-distortion-high": arm(
      "ventricular-velocity-distortion-high",
      "ventricular-velocity-distortion-high",
      4 / 3,
    ),
    "ventricular-velocity-distortion-twofold": arm(
      "ventricular-velocity-distortion-twofold",
      "ventricular-velocity-distortion-twofold",
      2,
    ),
    "ventricular-velocity-distortion-five-halves": arm(
      "ventricular-velocity-distortion-five-halves",
      "ventricular-velocity-distortion-five-halves",
      2.5,
    ),
    "ventricular-velocity-distortion-threefold": arm(
      "ventricular-velocity-distortion-threefold",
      "ventricular-velocity-distortion-threefold",
      3,
    ),
    "ventricular-velocity-distortion-fourfold": arm(
      "ventricular-velocity-distortion-fourfold",
      "ventricular-velocity-distortion-fourfold",
      4,
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
    MainWireAorticOutflowVelocityDistortionAmplitudeArmV1
  >>);

export function resolveMainWireAorticOutflowVelocityDistortionAmplitudeArmV1(
  armId: MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
): MainWireAorticOutflowVelocityDistortionAmplitudeArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported velocity-distortion amplitude arm: ${String(armId)}`,
    );
  }
  return resolved;
}

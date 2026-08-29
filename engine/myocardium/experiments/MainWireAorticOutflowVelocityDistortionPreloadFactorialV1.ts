import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-preload-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_ARM_IDS_V1 =
  Object.freeze([
    "aeff-one-preload-one",
    "aeff-one-preload-high",
    "aeff-five-halves-preload-one",
    "aeff-five-halves-preload-high",
    "aeff-three-preload-one",
    "aeff-three-preload-high",
  ] as const);

export type MainWireAorticOutflowVelocityDistortionPreloadArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_ARM_IDS_V1)[number];

export type MainWireAorticOutflowVelocityDistortionPreloadArmV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityDistortionPreloadArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-velocity-distortion-five-halves"
    | "ventricular-velocity-distortion-threefold"
  >;
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  aeffScaleFromBaseline: number;
  canonicalAdditionalStressedVenousVolumeScale: 1 | number;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_CLAIM_V1 =
  Object.freeze({
    role: "fixed-three-by-two-Aeff-by-preload-factorial" as const,
    aeffScaleAxis: Object.freeze([1, 2.5, 3] as const),
    canonicalAdditionalStressedVenousVolumeScaleAxis:
      Object.freeze([1, 4 / 3] as const),
    fixedTotalBloodVolumeWithinEachRun: true as const,
    initialDistributionPolicyHeldFixed: true as const,
    circulationRuntimeChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowVelocityDistortionPreloadArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowVelocityDistortionPreloadArmV1[
      "ventricularMaterialPointId"
    ],
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
  aeffScaleFromBaseline: number,
  canonicalAdditionalStressedVenousVolumeScale: number,
): MainWireAorticOutflowVelocityDistortionPreloadArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    stressedVenousVolumePointId,
    aeffScaleFromBaseline,
    canonicalAdditionalStressedVenousVolumeScale,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_ARMS_V1 =
  Object.freeze({
    "aeff-one-preload-one": arm(
      "aeff-one-preload-one", "baseline", "baseline", 1, 1,
    ),
    "aeff-one-preload-high": arm(
      "aeff-one-preload-high", "baseline", "stressed-venous-volume-high",
      1, 4 / 3,
    ),
    "aeff-five-halves-preload-one": arm(
      "aeff-five-halves-preload-one",
      "ventricular-velocity-distortion-five-halves", "baseline", 2.5, 1,
    ),
    "aeff-five-halves-preload-high": arm(
      "aeff-five-halves-preload-high",
      "ventricular-velocity-distortion-five-halves",
      "stressed-venous-volume-high", 2.5, 4 / 3,
    ),
    "aeff-three-preload-one": arm(
      "aeff-three-preload-one",
      "ventricular-velocity-distortion-threefold", "baseline", 3, 1,
    ),
    "aeff-three-preload-high": arm(
      "aeff-three-preload-high",
      "ventricular-velocity-distortion-threefold",
      "stressed-venous-volume-high", 3, 4 / 3,
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowVelocityDistortionPreloadArmIdV1,
    MainWireAorticOutflowVelocityDistortionPreloadArmV1
  >>);

export function resolveMainWireAorticOutflowVelocityDistortionPreloadArmV1(
  armId: MainWireAorticOutflowVelocityDistortionPreloadArmIdV1,
): MainWireAorticOutflowVelocityDistortionPreloadArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRELOAD_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported velocity-distortion preload arm: ${String(armId)}`,
    );
  }
  return resolved;
}

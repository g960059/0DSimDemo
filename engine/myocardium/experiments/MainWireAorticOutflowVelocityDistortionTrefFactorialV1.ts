import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-tref-factorial-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1 =
  Object.freeze([
    "aeff-one-tref-one",
    "aeff-one-tref-six-fifths",
    "aeff-one-tref-four-thirds",
    "aeff-five-halves-tref-one",
    "aeff-five-halves-tref-six-fifths",
    "aeff-five-halves-tref-four-thirds",
    "aeff-three-tref-one",
    "aeff-three-tref-six-fifths",
    "aeff-three-tref-four-thirds",
  ] as const);

export type MainWireAorticOutflowVelocityDistortionTrefArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1)[number];

type TrefFactorialMaterialPointIdV1 = Extract<
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
  | "baseline"
  | "ventricular-tref-six-fifths"
  | "ventricular-tref-high"
  | "ventricular-velocity-distortion-five-halves"
  | "ventricular-velocity-distortion-five-halves-plus-tref-six-fifths"
  | "ventricular-velocity-distortion-five-halves-plus-tref-high"
  | "ventricular-velocity-distortion-threefold"
  | "ventricular-velocity-distortion-threefold-plus-tref-six-fifths"
  | "ventricular-velocity-distortion-threefold-plus-tref-high"
>;

export type MainWireAorticOutflowVelocityDistortionTrefArmV1 = Readonly<{
  armId: MainWireAorticOutflowVelocityDistortionTrefArmIdV1;
  ventricularMaterialPointId: TrefFactorialMaterialPointIdV1;
  aeffScaleFromBaseline: 1 | 2.5 | 3;
  trefScaleFromBaseline: 1 | 1.2 | number;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_CLAIM_V1 =
  Object.freeze({
    role: "fixed-three-by-three-Aeff-by-Tref-factorial" as const,
    aeffScaleAxis: Object.freeze([1, 2.5, 3] as const),
    trefScaleAxis: Object.freeze([1, 1.2, 4 / 3] as const),
    purpose:
      "separate ejection-time control from active-force-scale macro recalibration" as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    bloodVolumeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowVelocityDistortionTrefArmIdV1,
  ventricularMaterialPointId: TrefFactorialMaterialPointIdV1,
  aeffScaleFromBaseline: 1 | 2.5 | 3,
  trefScaleFromBaseline: 1 | 1.2 | number,
): MainWireAorticOutflowVelocityDistortionTrefArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    aeffScaleFromBaseline,
    trefScaleFromBaseline,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARMS_V1 =
  Object.freeze({
    "aeff-one-tref-one": arm(
      "aeff-one-tref-one", "baseline", 1, 1,
    ),
    "aeff-one-tref-six-fifths": arm(
      "aeff-one-tref-six-fifths", "ventricular-tref-six-fifths", 1, 1.2,
    ),
    "aeff-one-tref-four-thirds": arm(
      "aeff-one-tref-four-thirds", "ventricular-tref-high", 1, 4 / 3,
    ),
    "aeff-five-halves-tref-one": arm(
      "aeff-five-halves-tref-one",
      "ventricular-velocity-distortion-five-halves", 2.5, 1,
    ),
    "aeff-five-halves-tref-six-fifths": arm(
      "aeff-five-halves-tref-six-fifths",
      "ventricular-velocity-distortion-five-halves-plus-tref-six-fifths",
      2.5, 1.2,
    ),
    "aeff-five-halves-tref-four-thirds": arm(
      "aeff-five-halves-tref-four-thirds",
      "ventricular-velocity-distortion-five-halves-plus-tref-high",
      2.5, 4 / 3,
    ),
    "aeff-three-tref-one": arm(
      "aeff-three-tref-one",
      "ventricular-velocity-distortion-threefold", 3, 1,
    ),
    "aeff-three-tref-six-fifths": arm(
      "aeff-three-tref-six-fifths",
      "ventricular-velocity-distortion-threefold-plus-tref-six-fifths",
      3, 1.2,
    ),
    "aeff-three-tref-four-thirds": arm(
      "aeff-three-tref-four-thirds",
      "ventricular-velocity-distortion-threefold-plus-tref-high",
      3, 4 / 3,
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowVelocityDistortionTrefArmIdV1,
    MainWireAorticOutflowVelocityDistortionTrefArmV1
  >>);

export function resolveMainWireAorticOutflowVelocityDistortionTrefArmV1(
  armId: MainWireAorticOutflowVelocityDistortionTrefArmIdV1,
): MainWireAorticOutflowVelocityDistortionTrefArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported velocity-distortion Tref arm: ${String(armId)}`,
    );
  }
  return resolved;
}

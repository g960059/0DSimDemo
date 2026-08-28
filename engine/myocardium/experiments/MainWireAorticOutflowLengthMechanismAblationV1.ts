import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ABLATION_V1_ID =
  "main-wire-aortic-outflow-length-mechanism-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "peak-tension-length-dependence-low",
    "calcium-sensitivity-length-dependence-low",
    "both-length-dependence-low",
    "peak-tension-length-dependence-half",
    "calcium-sensitivity-length-dependence-half",
    "both-length-dependence-half",
  ] as const);

export type MainWireAorticOutflowLengthMechanismArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARM_IDS_V1)[number];

export type MainWireAorticOutflowLengthMechanismArmV1 = Readonly<{
  armId: MainWireAorticOutflowLengthMechanismArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-peak-tension-length-dependence-low"
    | "ventricular-calcium-sensitivity-length-dependence-low"
    | "ventricular-peak-tension-length-dependence-half"
    | "ventricular-calcium-sensitivity-length-dependence-half"
    | "ventricular-length-dependence-low"
    | "ventricular-length-dependence-half"
  >;
  peakTensionLengthFactor: "baseline" | "low" | "half";
  calciumSensitivityLengthFactor: "baseline" | "low" | "half";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-two-by-two-plus-half-scale-Land-length-mechanism-ablation" as const,
    peakTensionAxis: "common-LVFW-SEP-RVFW-Land-beta0-three-quarters" as const,
    calciumSensitivityAxis:
      "common-LVFW-SEP-RVFW-Land-beta1-three-quarters" as const,
    factorLevelInheritedFromPriorFixedBracket: true as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    splitMechanismScaleEnvelope: Object.freeze([1, 0.75, 0.5] as const),
    referenceLengthIsometricLandValuesUnchanged: true as const,
    sourceLengthDependenceCalibrationPreserved: false as const,
    existingLandStateCountChanged: false as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    velocityDistortionChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowLengthMechanismArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowLengthMechanismArmV1["ventricularMaterialPointId"],
  peakTensionLengthFactor: "baseline" | "low" | "half",
  calciumSensitivityLengthFactor: "baseline" | "low" | "half",
): MainWireAorticOutflowLengthMechanismArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    peakTensionLengthFactor,
    calciumSensitivityLengthFactor,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARMS_V1 = Object.freeze({
  canonical: arm("canonical", "baseline", "baseline", "baseline"),
  "peak-tension-length-dependence-low": arm(
    "peak-tension-length-dependence-low",
    "ventricular-peak-tension-length-dependence-low",
    "low",
    "baseline",
  ),
  "calcium-sensitivity-length-dependence-low": arm(
    "calcium-sensitivity-length-dependence-low",
    "ventricular-calcium-sensitivity-length-dependence-low",
    "baseline",
    "low",
  ),
  "both-length-dependence-low": arm(
    "both-length-dependence-low",
    "ventricular-length-dependence-low",
    "low",
    "low",
  ),
  "peak-tension-length-dependence-half": arm(
    "peak-tension-length-dependence-half",
    "ventricular-peak-tension-length-dependence-half",
    "half",
    "baseline",
  ),
  "calcium-sensitivity-length-dependence-half": arm(
    "calcium-sensitivity-length-dependence-half",
    "ventricular-calcium-sensitivity-length-dependence-half",
    "baseline",
    "half",
  ),
  "both-length-dependence-half": arm(
    "both-length-dependence-half",
    "ventricular-length-dependence-half",
    "half",
    "half",
  ),
} satisfies Readonly<Record<
  MainWireAorticOutflowLengthMechanismArmIdV1,
  MainWireAorticOutflowLengthMechanismArmV1
>>);

export function resolveMainWireAorticOutflowLengthMechanismArmV1(
  armId: MainWireAorticOutflowLengthMechanismArmIdV1,
): MainWireAorticOutflowLengthMechanismArmV1 {
  const arm = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_MECHANISM_ARMS_V1[armId];
  if (arm === undefined) {
    throw new Error(
      `unsupported aortic outflow length-mechanism arm: ${String(armId)}`,
    );
  }
  return arm;
}

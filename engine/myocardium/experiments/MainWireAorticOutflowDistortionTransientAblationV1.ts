import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ABLATION_V1_ID =
  "main-wire-aortic-outflow-distortion-transient-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-velocity-distortion-high",
    "ventricular-distortion-recovery-high",
    "ventricular-velocity-distortion-high-plus-recovery-high",
    "ventricular-distortion-transient-twofold",
    "ventricular-distortion-transient-fourfold",
  ] as const);

export type MainWireAorticOutflowDistortionTransientArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARM_IDS_V1)[number];

export type MainWireAorticOutflowDistortionTransientArmV1 = Readonly<{
  armId: MainWireAorticOutflowDistortionTransientArmIdV1;
  ventricularMaterialPointId: Extract<
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
    | "baseline"
    | "ventricular-velocity-distortion-high"
    | "ventricular-distortion-recovery-high"
    | "ventricular-velocity-distortion-high-plus-recovery-high"
    | "ventricular-distortion-transient-twofold"
    | "ventricular-distortion-transient-fourfold"
  >;
  distortionAmplitudeFactor: "baseline" | "high" | "twofold" | "fourfold";
  distortionRecoveryFactor: "baseline" | "high" | "twofold" | "fourfold";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-two-by-two-plus-proportional-envelope-existing-Land-distortion-transient-ablation" as const,
    amplitudeAxis:
      "common-LVFW-SEP-RVFW-Land-Aeff-four-thirds-scale" as const,
    recoveryAxis:
      "common-LVFW-SEP-RVFW-Land-phi-four-thirds-scale" as const,
    combinedZetaSteadyGainPreservedAtFixedStrainRate: true as const,
    combinedDistortionRecoveryTimeConstantsShortened: true as const,
    quickStretchResponsePreserved: false as const,
    sourceLoadedShorteningCalibrationPreserved: false as const,
    referenceLengthIsometricLandValuesUnchanged: true as const,
    existingLandStateCountChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    proportionalTransientScaleEnvelope:
      Object.freeze([1, 4 / 3, 2, 4] as const),
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    lengthDependenceChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    outcomeInformedFactorSelection: true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowDistortionTransientArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowDistortionTransientArmV1[
      "ventricularMaterialPointId"
    ],
): MainWireAorticOutflowDistortionTransientArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    distortionAmplitudeFactor:
      ventricularMaterialPointId === "ventricular-distortion-transient-twofold"
        ? "twofold" as const
        : ventricularMaterialPointId
          === "ventricular-distortion-transient-fourfold"
          ? "fourfold" as const
          : ventricularMaterialPointId === "ventricular-velocity-distortion-high"
          || ventricularMaterialPointId
            === "ventricular-velocity-distortion-high-plus-recovery-high"
            ? "high" as const
            : "baseline" as const,
    distortionRecoveryFactor:
      ventricularMaterialPointId === "ventricular-distortion-transient-twofold"
        ? "twofold" as const
        : ventricularMaterialPointId
          === "ventricular-distortion-transient-fourfold"
          ? "fourfold" as const
          : ventricularMaterialPointId === "ventricular-distortion-recovery-high"
          || ventricularMaterialPointId
            === "ventricular-velocity-distortion-high-plus-recovery-high"
            ? "high" as const
            : "baseline" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "baseline"),
    "ventricular-velocity-distortion-high": arm(
      "ventricular-velocity-distortion-high",
      "ventricular-velocity-distortion-high",
    ),
    "ventricular-distortion-recovery-high": arm(
      "ventricular-distortion-recovery-high",
      "ventricular-distortion-recovery-high",
    ),
    "ventricular-velocity-distortion-high-plus-recovery-high": arm(
      "ventricular-velocity-distortion-high-plus-recovery-high",
      "ventricular-velocity-distortion-high-plus-recovery-high",
    ),
    "ventricular-distortion-transient-twofold": arm(
      "ventricular-distortion-transient-twofold",
      "ventricular-distortion-transient-twofold",
    ),
    "ventricular-distortion-transient-fourfold": arm(
      "ventricular-distortion-transient-fourfold",
      "ventricular-distortion-transient-fourfold",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowDistortionTransientArmIdV1,
    MainWireAorticOutflowDistortionTransientArmV1
  >>);

export function resolveMainWireAorticOutflowDistortionTransientArmV1(
  armId: MainWireAorticOutflowDistortionTransientArmIdV1,
): MainWireAorticOutflowDistortionTransientArmV1 {
  const arm = MAIN_WIRE_AORTIC_OUTFLOW_DISTORTION_TRANSIENT_ARMS_V1[armId];
  if (arm === undefined) {
    throw new Error(
      `unsupported aortic outflow distortion-transient arm: ${String(armId)}`,
    );
  }
  return arm;
}

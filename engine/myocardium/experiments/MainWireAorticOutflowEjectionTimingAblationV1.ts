import type {
  MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumFixedAmplitudeDecayAblationV1";
import type {
  MainWireNormalAdultVentricularGammaWResearchProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_V1_ID =
  "main-wire-aortic-outflow-ejection-timing-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-calcium-decay-one-and-half-fixed-amplitude",
    "ventricular-calcium-decay-twofold-fixed-amplitude",
    "ventricular-land-gamma-w-half",
    "ventricular-land-gamma-w-three-quarters",
    "ventricular-land-gamma-w-four-thirds",
    "ventricular-land-gamma-w-twofold",
    "ventricular-land-gamma-w-fourfold",
  ] as const);

export type MainWireAorticOutflowEjectionTimingArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1)[number];

export type MainWireAorticOutflowEjectionTimingArmV1 = Readonly<{
  armId: MainWireAorticOutflowEjectionTimingArmIdV1;
  causalAxis: "canonical" | "calcium-decay" | "land-gamma-w";
  calciumProfileId:
    MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1;
  gammaWProfileId:
    MainWireNormalAdultVentricularGammaWResearchProfileIdV1;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-one-axis-at-a-time-ejection-timing-causal-bracket" as const,
    primaryReadout:
      "one-percent-peak-flow-thresholded-aortic-ejection-time" as const,
    calciumAxis:
      "ventricular-decay-scaled-with-rise-and-peak-amplitude-fixed" as const,
    mechanicsAxis:
      "common-ventricular-Land-gammaW-loaded-shortening-deactivation" as const,
    calciumAndMechanicsAxesCombinedInAnyArm: false as const,
    aorticGradientUsedToChooseBracketValues: false as const,
    macroHemodynamicsAreMonitoringReadoutsNotInitialAcceptanceTargets:
      true as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowEjectionTimingArmIdV1,
  causalAxis: MainWireAorticOutflowEjectionTimingArmV1["causalAxis"],
  calciumProfileId:
    MainWireVentricularCalciumFixedAmplitudeDecayProfileIdV1,
  gammaWProfileId:
    MainWireNormalAdultVentricularGammaWResearchProfileIdV1,
): MainWireAorticOutflowEjectionTimingArmV1 {
  return Object.freeze({
    armId,
    causalAxis,
    calciumProfileId,
    gammaWProfileId,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARMS_V1 = Object.freeze({
  canonical: arm("canonical", "canonical", "canonical", "canonical"),
  "ventricular-calcium-decay-one-and-half-fixed-amplitude": arm(
    "ventricular-calcium-decay-one-and-half-fixed-amplitude",
    "calcium-decay",
    "ventricular-calcium-decay-one-and-half-fixed-amplitude",
    "canonical",
  ),
  "ventricular-calcium-decay-twofold-fixed-amplitude": arm(
    "ventricular-calcium-decay-twofold-fixed-amplitude",
    "calcium-decay",
    "ventricular-calcium-decay-twofold-fixed-amplitude",
    "canonical",
  ),
  "ventricular-land-gamma-w-half": arm(
    "ventricular-land-gamma-w-half",
    "land-gamma-w",
    "canonical",
    "ventricular-land-gamma-w-half",
  ),
  "ventricular-land-gamma-w-three-quarters": arm(
    "ventricular-land-gamma-w-three-quarters",
    "land-gamma-w",
    "canonical",
    "ventricular-land-gamma-w-three-quarters",
  ),
  "ventricular-land-gamma-w-four-thirds": arm(
    "ventricular-land-gamma-w-four-thirds",
    "land-gamma-w",
    "canonical",
    "ventricular-land-gamma-w-four-thirds",
  ),
  "ventricular-land-gamma-w-twofold": arm(
    "ventricular-land-gamma-w-twofold",
    "land-gamma-w",
    "canonical",
    "ventricular-land-gamma-w-twofold",
  ),
  "ventricular-land-gamma-w-fourfold": arm(
    "ventricular-land-gamma-w-fourfold",
    "land-gamma-w",
    "canonical",
    "ventricular-land-gamma-w-fourfold",
  ),
} satisfies Readonly<Record<
  MainWireAorticOutflowEjectionTimingArmIdV1,
  MainWireAorticOutflowEjectionTimingArmV1
>>);

export function resolveMainWireAorticOutflowEjectionTimingArmV1(
  armId: MainWireAorticOutflowEjectionTimingArmIdV1,
): MainWireAorticOutflowEjectionTimingArmV1 {
  const resolved = MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported aortic outflow ejection-timing arm: ${String(armId)}`,
    );
  }
  return resolved;
}

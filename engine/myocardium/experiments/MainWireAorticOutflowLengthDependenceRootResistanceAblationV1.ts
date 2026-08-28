import type {
  MainWireAorticRootResistanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootResistanceResearchProfileV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ABLATION_V1_ID =
  "main-wire-aortic-outflow-length-dependence-root-resistance-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-length-dependence-low",
    "aortic-root-resistance-high",
    "ventricular-length-dependence-low-plus-aortic-root-resistance-high",
  ] as const);

export type MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARM_IDS_V1)[number];

export type MainWireAorticOutflowLengthDependenceRootResistanceArmV1 =
  Readonly<{
    armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1;
    ventricularMaterialPointId: Extract<
      MainWireNormalAdultVentricularMaterialResearchPointIdV1,
      "baseline" | "ventricular-length-dependence-low"
    >;
    aorticRootResistanceProfileId:
      MainWireAorticRootResistanceResearchProfileIdV1 | null;
    lengthDependenceFactor: "baseline" | "low";
    rootResistanceFactor: "baseline" | "high";
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-mechanism-research-ablation" as const,
    ventricularAxis:
      "common-LVFW-SEP-RVFW-Land-beta0-and-beta1-fixed-low-point" as const,
    ventricularReferenceLengthInvariant:
      "Land-length-factor-and-CaT50-unchanged-at-lambda-one" as const,
    rootAxis: "graph-owned-Ao-SA-resistance-fixed-high-profile" as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    calciumDriveChanged: false as const,
    ventricularTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowLengthDependenceRootResistanceArmV1[
      "ventricularMaterialPointId"
    ],
  aorticRootResistanceProfileId:
    MainWireAorticOutflowLengthDependenceRootResistanceArmV1[
      "aorticRootResistanceProfileId"
    ],
): MainWireAorticOutflowLengthDependenceRootResistanceArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    aorticRootResistanceProfileId,
    lengthDependenceFactor:
      ventricularMaterialPointId === "baseline"
        ? "baseline" as const
        : "low" as const,
    rootResistanceFactor:
      aorticRootResistanceProfileId === null
        ? "baseline" as const
        : "high" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "baseline", null),
    "ventricular-length-dependence-low": arm(
      "ventricular-length-dependence-low",
      "ventricular-length-dependence-low",
      null,
    ),
    "aortic-root-resistance-high": arm(
      "aortic-root-resistance-high",
      "baseline",
      "aortic-root-resistance-high",
    ),
    "ventricular-length-dependence-low-plus-aortic-root-resistance-high": arm(
      "ventricular-length-dependence-low-plus-aortic-root-resistance-high",
      "ventricular-length-dependence-low",
      "aortic-root-resistance-high",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
    MainWireAorticOutflowLengthDependenceRootResistanceArmV1
  >>);

export function resolveMainWireAorticOutflowLengthDependenceRootResistanceArmV1(
  armId: MainWireAorticOutflowLengthDependenceRootResistanceArmIdV1,
): MainWireAorticOutflowLengthDependenceRootResistanceArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ROOT_RESISTANCE_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      "unsupported aortic outflow length-dependence/root-resistance arm: "
        + String(armId),
    );
  }
  return resolved;
}

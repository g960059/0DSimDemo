import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_V1_ID =
  "main-wire-aortic-outflow-driver-root-ablation-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1 =
  Object.freeze([
    "canonical",
    "ventricular-tref-low",
    "aortic-root-inertance-high",
    "ventricular-tref-low-plus-aortic-root-inertance-high",
  ] as const);

export type MainWireAorticOutflowDriverRootAblationArmIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1)[number];

export type MainWireAorticOutflowDriverRootAblationArmV1 = Readonly<{
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1;
  ventricularMaterialPointId:
    Extract<
      MainWireNormalAdultVentricularMaterialResearchPointIdV1,
      "baseline" | "ventricular-tref-low"
    >;
  aorticRootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null;
  contractileStressFactor: "baseline" | "low";
  rootInertanceFactor: "baseline" | "high";
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1 =
  Object.freeze({
    role: "fixed-two-by-two-source-research-ablation" as const,
    ventricularAxis:
      "common-LVFW-SEP-RVFW-Land-Tref-fixed-low-point" as const,
    rootAxis: "graph-owned-Ao-SA-inertance-fixed-high-profile" as const,
    independentCanonicalColdStartPerArm: true as const,
    oneSidedFactorial: true as const,
    mainEffectsAndInteractionEstimable: true as const,
    aorticValveConstitutiveLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

function arm(
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1,
  ventricularMaterialPointId:
    MainWireAorticOutflowDriverRootAblationArmV1[
      "ventricularMaterialPointId"
    ],
  aorticRootInertanceProfileId:
    MainWireAorticOutflowDriverRootAblationArmV1[
      "aorticRootInertanceProfileId"
    ],
): MainWireAorticOutflowDriverRootAblationArmV1 {
  return Object.freeze({
    armId,
    ventricularMaterialPointId,
    aorticRootInertanceProfileId,
    contractileStressFactor: ventricularMaterialPointId === "baseline"
      ? "baseline" as const
      : "low" as const,
    rootInertanceFactor: aorticRootInertanceProfileId === null
      ? "baseline" as const
      : "high" as const,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARMS_V1 =
  Object.freeze({
    canonical: arm("canonical", "baseline", null),
    "ventricular-tref-low": arm(
      "ventricular-tref-low",
      "ventricular-tref-low",
      null,
    ),
    "aortic-root-inertance-high": arm(
      "aortic-root-inertance-high",
      "baseline",
      "aortic-root-inertance-high",
    ),
    "ventricular-tref-low-plus-aortic-root-inertance-high": arm(
      "ventricular-tref-low-plus-aortic-root-inertance-high",
      "ventricular-tref-low",
      "aortic-root-inertance-high",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowDriverRootAblationArmIdV1,
    MainWireAorticOutflowDriverRootAblationArmV1
  >>);

export function resolveMainWireAorticOutflowDriverRootAblationArmV1(
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1,
): MainWireAorticOutflowDriverRootAblationArmV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARMS_V1[armId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported aortic outflow driver/root ablation arm: ${String(armId)}`,
    );
  }
  return resolved;
}

import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1_ID =
  "main-wire-normal-adult-five-wall-macro-physiology-fixed-points-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "ventricular-passive-low",
    "ventricular-passive-high",
    "ventricular-tref-low",
    "ventricular-tref-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
  ] as const);

export type MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1)[number];

export type MainWireNormalAdultFiveWallMacroPhysiologyAxisV1 =
  | "baseline"
  | "common-ventricular-passive-material"
  | "common-ventricular-land-tref"
  | "stressed-venous-volume";

export type MainWireNormalAdultFiveWallMacroPhysiologyPointV1 = Readonly<{
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1;
  axis: MainWireNormalAdultFiveWallMacroPhysiologyAxisV1;
  level: "baseline" | "low" | "high";
  materialPointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1;
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  changedSemanticOwner:
    | "none"
    | "common-ventricular-passive-material"
    | "common-ventricular-land-tref"
    | "fixed-total-blood-volume-operating-point";
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    fixedPointNotGenericPatch: true;
    oneFactorAtATime: true;
    warmStartAllowed: false;
    patientFitOrOptimization: false;
    independentLvAndRvMaterialClaimed: false;
  }>;
}>;

const CLAIM = Object.freeze({
  sourceResearchRunnerOnly: true as const,
  fixedPointNotGenericPatch: true as const,
  oneFactorAtATime: true as const,
  warmStartAllowed: false as const,
  patientFitOrOptimization: false as const,
  independentLvAndRvMaterialClaimed: false as const,
});

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1 =
  Object.freeze([
    point("baseline", "baseline", "baseline", "baseline", "baseline", "none"),
    point(
      "ventricular-passive-low",
      "common-ventricular-passive-material",
      "low",
      "ventricular-passive-low",
      "baseline",
      "common-ventricular-passive-material",
    ),
    point(
      "ventricular-passive-high",
      "common-ventricular-passive-material",
      "high",
      "ventricular-passive-high",
      "baseline",
      "common-ventricular-passive-material",
    ),
    point(
      "ventricular-tref-low",
      "common-ventricular-land-tref",
      "low",
      "ventricular-tref-low",
      "baseline",
      "common-ventricular-land-tref",
    ),
    point(
      "ventricular-tref-high",
      "common-ventricular-land-tref",
      "high",
      "ventricular-tref-high",
      "baseline",
      "common-ventricular-land-tref",
    ),
    point(
      "stressed-venous-volume-low",
      "stressed-venous-volume",
      "low",
      "baseline",
      "stressed-venous-volume-low",
      "fixed-total-blood-volume-operating-point",
    ),
    point(
      "stressed-venous-volume-high",
      "stressed-venous-volume",
      "high",
      "baseline",
      "stressed-venous-volume-high",
      "fixed-total-blood-volume-operating-point",
    ),
  ] satisfies readonly MainWireNormalAdultFiveWallMacroPhysiologyPointV1[]);

export function resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1(
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
): MainWireNormalAdultFiveWallMacroPhysiologyPointV1 {
  const point = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1
    .find((candidate) => candidate.pointId === pointId);
  if (point === undefined) {
    throw new Error(`unsupported fixed macro physiology point: ${String(pointId)}`);
  }
  return point;
}

function point(
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
  axis: MainWireNormalAdultFiveWallMacroPhysiologyAxisV1,
  level: "baseline" | "low" | "high",
  materialPointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
  changedSemanticOwner: MainWireNormalAdultFiveWallMacroPhysiologyPointV1[
    "changedSemanticOwner"
  ],
): MainWireNormalAdultFiveWallMacroPhysiologyPointV1 {
  return Object.freeze({
    pointId,
    axis,
    level,
    materialPointId,
    stressedVenousVolumePointId,
    changedSemanticOwner,
    claim: CLAIM,
  });
}

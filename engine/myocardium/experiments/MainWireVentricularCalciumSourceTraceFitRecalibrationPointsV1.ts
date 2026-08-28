import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultVentricularMaterialResearchPointIdV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINTS_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-points-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1 =
  Object.freeze([
    "systemic-resistance",
    "pulmonary-resistance",
    "arterial-stiffness",
    "stressed-venous-volume",
    "ventricular-tref",
    "ventricular-passive",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "systemic-resistance-low",
    "systemic-resistance-high",
    "pulmonary-resistance-low",
    "pulmonary-resistance-high",
    "arterial-stiffness-low",
    "arterial-stiffness-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
    "ventricular-tref-low",
    "ventricular-tref-high",
    "ventricular-passive-low",
    "ventricular-passive-high",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1 =
  Readonly<{
    pointId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1;
    axis:
      | "baseline"
      | MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1;
    level: "baseline" | "low" | "high";
    axisScaleFromBaseline: number;
    axisScaleMeaning:
      | "identity"
      | "direct-parameter-scale"
      | "canonical-additional-SV-VC-volume-scale";
    circulatoryLoadPointId:
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    ventricularMaterialPointId:
      MainWireNormalAdultVentricularMaterialResearchPointIdV1;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    changedSemanticOwner:
      | "none"
      | "systemic-resistance"
      | "pulmonary-resistance"
      | "global-arterial-stiffness"
      | "fixed-total-blood-volume-operating-point"
      | "common-ventricular-land-tref"
      | "common-ventricular-passive-material";
    claim: typeof CLAIM;
  }>;

const CLAIM = Object.freeze({
  sourceResearchRunnerOnly: true as const,
  fixedPointNotGenericPatch: true as const,
  lowScale: 0.75 as const,
  highScale: 1.3333333333333333 as const,
  lowAndHighAreReciprocal: true as const,
  oneFactorAtATime: true as const,
  ventricularCalciumProfileHeldFixed: true as const,
  valveConstitutiveLawsHeldFixed: true as const,
  aorticValveAreaHeldFixed: true as const,
  vascularUnstressedVolumesHeldFixed: true as const,
  stressedVenousAxisChangesFixedTbvOperatingPoint: true as const,
  warmStartAllowed: false as const,
  parameterOptimizationOrPatientFit: false as const,
});

const POINTS = Object.freeze([
  point(
    "baseline", "baseline", "baseline", 1, "identity",
    "baseline", "baseline", "baseline", "none",
  ),
  point(
    "systemic-resistance-low", "systemic-resistance", "low", 0.75,
    "direct-parameter-scale", "systemic-resistance-low", "baseline",
    "baseline", "systemic-resistance",
  ),
  point(
    "systemic-resistance-high", "systemic-resistance", "high", 4 / 3,
    "direct-parameter-scale", "systemic-resistance-high", "baseline",
    "baseline", "systemic-resistance",
  ),
  point(
    "pulmonary-resistance-low", "pulmonary-resistance", "low", 0.75,
    "direct-parameter-scale", "pulmonary-resistance-low", "baseline",
    "baseline", "pulmonary-resistance",
  ),
  point(
    "pulmonary-resistance-high", "pulmonary-resistance", "high", 4 / 3,
    "direct-parameter-scale", "pulmonary-resistance-high", "baseline",
    "baseline", "pulmonary-resistance",
  ),
  point(
    "arterial-stiffness-low", "arterial-stiffness", "low", 0.75,
    "direct-parameter-scale", "arterial-stiffness-low", "baseline",
    "baseline", "global-arterial-stiffness",
  ),
  point(
    "arterial-stiffness-high", "arterial-stiffness", "high", 4 / 3,
    "direct-parameter-scale", "arterial-stiffness-high", "baseline",
    "baseline", "global-arterial-stiffness",
  ),
  point(
    "stressed-venous-volume-low", "stressed-venous-volume", "low", 0.75,
    "canonical-additional-SV-VC-volume-scale", "baseline", "baseline",
    "stressed-venous-volume-low", "fixed-total-blood-volume-operating-point",
  ),
  point(
    "stressed-venous-volume-high", "stressed-venous-volume", "high", 4 / 3,
    "canonical-additional-SV-VC-volume-scale", "baseline", "baseline",
    "stressed-venous-volume-high", "fixed-total-blood-volume-operating-point",
  ),
  point(
    "ventricular-tref-low", "ventricular-tref", "low", 0.75,
    "direct-parameter-scale", "baseline", "ventricular-tref-low", "baseline",
    "common-ventricular-land-tref",
  ),
  point(
    "ventricular-tref-high", "ventricular-tref", "high", 4 / 3,
    "direct-parameter-scale", "baseline", "ventricular-tref-high", "baseline",
    "common-ventricular-land-tref",
  ),
  point(
    "ventricular-passive-low", "ventricular-passive", "low", 0.75,
    "direct-parameter-scale", "baseline", "ventricular-passive-low", "baseline",
    "common-ventricular-passive-material",
  ),
  point(
    "ventricular-passive-high", "ventricular-passive", "high", 4 / 3,
    "direct-parameter-scale", "baseline", "ventricular-passive-high", "baseline",
    "common-ventricular-passive-material",
  ),
] satisfies readonly MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1[]);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINTS_V1 =
  POINTS;

export function resolveMainWireVentricularCalciumSourceTraceFitRecalibrationPointV1(
  pointId:
    MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1 {
  const resolved = POINTS.find((candidate) => candidate.pointId === pointId);
  if (resolved === undefined) {
    throw new Error(`unsupported calcium source-trace recalibration point: ${
      String(pointId)}`);
  }
  return resolved;
}

function point(
  pointId: MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
  axis: "baseline" | MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1,
  level: "baseline" | "low" | "high",
  axisScaleFromBaseline: number,
  axisScaleMeaning:
    MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1["axisScaleMeaning"],
  circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  ventricularMaterialPointId:
    MainWireNormalAdultVentricularMaterialResearchPointIdV1,
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
  changedSemanticOwner:
    MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1["changedSemanticOwner"],
): MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1 {
  return Object.freeze({
    pointId,
    axis,
    level,
    axisScaleFromBaseline,
    axisScaleMeaning,
    circulatoryLoadPointId,
    ventricularMaterialPointId,
    stressedVenousVolumePointId,
    changedSemanticOwner,
    claim: CLAIM,
  });
}

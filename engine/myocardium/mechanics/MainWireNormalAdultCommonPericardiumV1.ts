import {
  MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID,
  type MainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumModeV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_V1_ID =
  "main-wire-normal-adult-common-pericardium-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_CASE_IDS_V1 =
  Object.freeze([
    "healthy-slack",
    "effusion-300ml-positive-control",
    "global-capacity-vh0-430ml-positive-control",
  ] as const);
export type MainWireNormalAdultCommonPericardiumCaseV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_CASE_IDS_V1)[number];

export const MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_POLICY_V1 =
  Object.freeze({
    modelId: MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_V1_ID,
    referenceConstruction:
      "phase-consistent-max-of-ED-and-ES-CMR-anchors-plus-five-wall-material-volume" as const,
    referenceReserveFraction: 0.05,
    exponentialPressureScalePa: 500,
    exponentialStiffness: 8,
    healthyBaselineRole:
      "structural-common-constraint-not-a-pressure-or-PV-loop-fit-knob" as const,
    patientFitBoundary:
      "capacity-stiffness-or-effusion-only-with-independent-biventricular-loading-or-effusion-evidence" as const,
    fixedPositiveControls: Object.freeze({
      effusion: Object.freeze({
        caseId: "effusion-300ml-positive-control" as const,
        prescribedPericardialFluidVolumeMl: 300,
        role: "static-fluid-occupancy-mechanism-check-not-a-clinical-fit" as const,
      }),
      globalCapacity: Object.freeze({
        caseId:
          "global-capacity-vh0-430ml-positive-control" as const,
        referenceOccupiedVolumeMl: 430,
        role:
          "global-capacity-mechanism-check-not-regional-constrictive-pericarditis-or-a-clinical-fit" as const,
      }),
    }),
  });

export function createMainWireNormalAdultCommonPericardiumV1(
  mode: MainWireCommonPericardiumModeV1 = "on",
  caseId: MainWireNormalAdultCommonPericardiumCaseV1 = "healthy-slack",
): MainWireCommonPericardiumBindingV1 {
  if (mode !== "on" && mode !== "exact-off") {
    throw new Error("unsupported normal-adult common-pericardium mode");
  }
  if (!MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_CASE_IDS_V1.includes(caseId)) {
    throw new Error("unsupported normal-adult common-pericardium case");
  }
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const wallMaterialVolumesM3 = Object.freeze([
    prior.anatomy.atria.LA.wallMaterialVolumeMl * 1e-6,
    prior.anatomy.triSeg.wallGeometryParameters.LVFW.wallMaterialVolumeM3,
    prior.anatomy.triSeg.wallGeometryParameters.SEP.wallMaterialVolumeM3,
    prior.anatomy.triSeg.wallGeometryParameters.RVFW.wallMaterialVolumeM3,
    prior.anatomy.atria.RA.wallMaterialVolumeMl * 1e-6,
  ]) as readonly [number, number, number, number, number];
  const wallVolumeM3 = wallMaterialVolumesM3.reduce(
    (sum, value) => sum + value,
    0,
  );
  const endDiastolicAnchorHeartVolumeM3 = 1e-6 * (
    prior.anatomy.atria.LA.cavityBloodVolumeMl.minimum
    + prior.anatomy.triSeg.leftVentricularEndDiastolicVolumeMl
    + prior.anatomy.atria.RA.cavityBloodVolumeMl.minimum
    + prior.anatomy.triSeg.rightVentricularEndDiastolicVolumeMl
  ) + wallVolumeM3;
  const endSystolicAnchorHeartVolumeM3 = 1e-6 * (
    prior.anatomy.atria.LA.cavityBloodVolumeMl.maximum
    + prior.anatomy.triSeg.leftVentricularEndSystolicVolumeMl
    + prior.anatomy.atria.RA.cavityBloodVolumeMl.maximum
    + prior.anatomy.triSeg.rightVentricularEndSystolicVolumeMl
  ) + wallVolumeM3;
  const phaseConsistentCmrAnchorHeartVolumeM3 = Math.max(
    endDiastolicAnchorHeartVolumeM3,
    endSystolicAnchorHeartVolumeM3,
  );
  const policy = MAIN_WIRE_NORMAL_ADULT_COMMON_PERICARDIUM_POLICY_V1;
  const referenceOccupiedVolumeM3 = caseId
    === "global-capacity-vh0-430ml-positive-control"
    ? policy.fixedPositiveControls.globalCapacity.referenceOccupiedVolumeMl
      * 1e-6
    : (1 + policy.referenceReserveFraction)
      * phaseConsistentCmrAnchorHeartVolumeM3;
  const prescribedPericardialFluidVolumeMl = caseId
    === "effusion-300ml-positive-control"
    ? policy.fixedPositiveControls.effusion.prescribedPericardialFluidVolumeMl
    : 0;
  return Object.freeze({
    bindingId: MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID,
    parameterSetId: `${policy.modelId}-${caseId}-${mode}`,
    mode,
    parameters: Object.freeze({
      referenceOccupiedVolumeM3,
      exponentialPressureScalePa: policy.exponentialPressureScalePa,
      exponentialStiffness: policy.exponentialStiffness,
    }),
    wallMaterialVolumesM3,
    prescribedPericardialFluidVolumeM3:
      prescribedPericardialFluidVolumeMl * 1e-6,
  });
}

import {
  computeIntrapericardialHeartVolumeM3V1,
  evaluateCommonPericardiumV1,
  type CommonPericardiumParametersV1,
} from "@/engine/myocardium/mechanics/commonPericardiumV1";

const PA_PER_MMHG = 133.322;

export const MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID =
  "main-wire-common-pericardium-binding-v1" as const;

export type MainWireCommonPericardiumModeV1 = "on" | "exact-off";

export type MainWireCommonPericardiumBindingV1 = Readonly<{
  bindingId: typeof MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID;
  parameterSetId: string;
  mode: MainWireCommonPericardiumModeV1;
  parameters: CommonPericardiumParametersV1;
  wallMaterialVolumesM3: readonly [number, number, number, number, number];
  /** Static occupied volume; it is not blood volume and adds no dynamic state. */
  prescribedPericardialFluidVolumeM3: number;
}>;

export type MainWireCommonPericardiumEvaluationV1 = Readonly<{
  bindingId: typeof MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID;
  parameterSetId: string;
  mode: MainWireCommonPericardiumModeV1;
  heartVolumeM3: number;
  prescribedPericardialFluidVolumeM3: number;
  totalOccupiedVolumeM3: number;
  storedEnergyJ: number;
  excessPressurePa: number;
  excessPressureMmHg: number;
  pressureDerivativePaPerM3: number;
  smoothingBranch: "off" | "zero" | "transition" | "linear";
  elasticConstraintEngaged: boolean;
}>;

export function evaluateMainWireCommonPericardiumBindingV1(
  binding: MainWireCommonPericardiumBindingV1,
  chamberBloodVolumesMl: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>,
): MainWireCommonPericardiumEvaluationV1 {
  if (binding.bindingId !== MAIN_WIRE_COMMON_PERICARDIUM_BINDING_V1_ID) {
    throw new Error("unsupported common-pericardium binding");
  }
  const heartVolumeM3 = computeIntrapericardialHeartVolumeM3V1({
    chamberBloodVolumesM3: Object.freeze({
      LA: chamberBloodVolumesMl.LA * 1e-6,
      LV: chamberBloodVolumesMl.LV * 1e-6,
      RA: chamberBloodVolumesMl.RA * 1e-6,
      RV: chamberBloodVolumesMl.RV * 1e-6,
    }),
    wallMaterialVolumesM3: binding.wallMaterialVolumesM3,
  });
  if (
    !Number.isFinite(binding.prescribedPericardialFluidVolumeM3)
    || binding.prescribedPericardialFluidVolumeM3 < 0
  ) {
    throw new Error("prescribedPericardialFluidVolumeM3 must be nonnegative and finite");
  }
  const totalOccupiedVolumeM3 = heartVolumeM3
    + binding.prescribedPericardialFluidVolumeM3;
  if (binding.mode === "exact-off") {
    return Object.freeze({
      bindingId: binding.bindingId,
      parameterSetId: binding.parameterSetId,
      mode: binding.mode,
      heartVolumeM3,
      prescribedPericardialFluidVolumeM3:
        binding.prescribedPericardialFluidVolumeM3,
      totalOccupiedVolumeM3,
      storedEnergyJ: 0,
      excessPressurePa: 0,
      excessPressureMmHg: 0,
      pressureDerivativePaPerM3: 0,
      smoothingBranch: "off" as const,
      elasticConstraintEngaged: false,
    });
  }
  const evaluated = evaluateCommonPericardiumV1(
    binding.parameters,
    totalOccupiedVolumeM3,
  );
  return Object.freeze({
    bindingId: binding.bindingId,
    parameterSetId: binding.parameterSetId,
    mode: binding.mode,
    heartVolumeM3,
    prescribedPericardialFluidVolumeM3:
      binding.prescribedPericardialFluidVolumeM3,
    totalOccupiedVolumeM3,
    storedEnergyJ: evaluated.storedEnergyJ,
    excessPressurePa: evaluated.excessPressurePa,
    excessPressureMmHg: evaluated.excessPressurePa / PA_PER_MMHG,
    pressureDerivativePaPerM3: evaluated.pressureDerivativePaPerM3,
    smoothingBranch: evaluated.smoothingBranch,
    elasticConstraintEngaged:
      evaluated.smoothingBranch !== "zero" || evaluated.excessPressurePa > 0,
  });
}

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  createMaterialKernelsWithMechanicsResearchInputsV1,
  createNormalAdultProviderFromKernels,
  createNormalAdultProviderFromMaterial,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  validateAndOwnMainWireFiveWallMechanicsResearchInputsV1,
  type MainWireFiveWallMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID,
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";

/**
 * Standard68-only provider composition. Keeping this composition outside the
 * historical provider module prevents a successor material from changing the
 * deterministic Standard65/66/67 artifact graphs.
 */
export function createMainWireRoundedEjectionFiveWallProviderV1(
  requestedInputs: MainWireFiveWallMechanicsResearchInputsV1,
): MainWireNormalAdultFiveWallProviderV1 {
  const inputs =
    validateAndOwnMainWireFiveWallMechanicsResearchInputsV1(requestedInputs);
  const materialChanged = (
    [
      ...Object.values(inputs.activeTensionScaleByWall),
      ...Object.values(inputs.passiveStiffnessScaleByWall),
    ] as number[]
  ).some((scale) => scale !== 1);
  if (!materialChanged) {
    return createNormalAdultProviderFromMaterial(
      "on",
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
      `-${MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID}`,
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
    );
  }
  const identity = stableHash(
    sanitizeForStableHash(
      Object.freeze({
        activeTensionScaleByWall: inputs.activeTensionScaleByWall,
        passiveStiffnessScaleByWall: inputs.passiveStiffnessScaleByWall,
      }),
    ),
  );
  return createNormalAdultProviderFromKernels(
    "on",
    createMaterialKernelsWithMechanicsResearchInputsV1(
      inputs,
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_WALL_MATERIAL_V1,
      MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1,
    ),
    `-${MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PROFILE_V1_ID}` +
      `-wall-mechanics-${identity}`,
  );
}

import {
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

/**
 * Standard65-67 were published with arterial-stiffness scale bounded at 1.
 * Keep that exact product boundary immutable when a later model generation
 * widens the shared engine research domain.
 */
export const MAIN_WIRE_INTEGRATED_STUDIO_PRE_STANDARD68_HEMODYNAMIC_RANGES_V1 =
  Object.freeze({
    ...MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
    arterialStiffness: Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.arterialStiffness,
      maximum: 1,
    }),
  });

export function validateAndOwnMainWireIntegratedStudioPreStandard68HemodynamicInputsV1(
  value: unknown,
): MainWireIntegratedModelHemodynamicResearchInputsV3 {
  const owned =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(value);
  if (
    owned.arterialStiffness >
    MAIN_WIRE_INTEGRATED_STUDIO_PRE_STANDARD68_HEMODYNAMIC_RANGES_V1
      .arterialStiffness.maximum
  ) {
    throw new Error(
      "pre-Standard68 arterialStiffness exceeds its published maximum",
    );
  }
  return owned;
}

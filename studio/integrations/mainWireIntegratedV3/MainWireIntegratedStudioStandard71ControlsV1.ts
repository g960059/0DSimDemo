import { MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1 } from "./MainWireIntegratedStudioRoundedEjectionControlsV1";
import { mainWireIntegratedStudioControlValueFromFixtureV3 } from "./MainWireIntegratedStudioFixtureControlProjectionV3";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";

const baseline = { hemodynamicResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  mechanismResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 };

/** Same control domains and semantics; 5 mL TBV resolution represents the
 * exact 4935 mL reference without rounding the physical baseline. */
export const MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1 = Object.freeze(
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1.map(definition => {
    const value = mainWireIntegratedStudioControlValueFromFixtureV3(baseline, definition.controlId);
    if (value.status !== "value") throw new Error(`Standard71 baseline control missing: ${definition.controlId}`);
    return Object.freeze({ ...definition, defaultValue: value.value,
      ...(definition.controlId === "hemodynamics.total-blood-volume-ml" ? { step: 5 } : {}) });
  }),
);

export const MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1: ReadonlyMap<string, typeof MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1[number]> =
  new Map(MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1.map(definition => [definition.controlId, definition]));

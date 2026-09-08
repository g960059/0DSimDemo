import { MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1 } from "./MainWireIntegratedStudioRoundedEjectionControlsV1";
import { MAIN_WIRE_LV_ACTIVE_TENSION_RESEARCH_RANGE_V1 } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { mainWireIntegratedStudioControlValueFromFixtureV3 } from "./MainWireIntegratedStudioFixtureControlProjectionV3";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";

const baseline = { hemodynamicResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  mechanismResearchInputs: MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 };

/** Research LV group reuses the accepted-state atomic operation. The 5 mL TBV
 * resolution represents the 4935 mL reference without rounding. */
export const MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1 = Object.freeze(
  [...MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1, {
    controlId: "myocardium.lv-contractility", valueType: "number" as const,
    unit: "1", ...MAIN_WIRE_LV_ACTIVE_TENSION_RESEARCH_RANGE_V1, defaultValue: 1,
    changeSemantics: "accepted-state-warm-start" as const,
  }].map(definition => {
    const value = mainWireIntegratedStudioControlValueFromFixtureV3(baseline, definition.controlId);
    if (value.status !== "value") throw new Error(`Standard71 baseline control missing: ${definition.controlId}`);
    return Object.freeze({ ...definition, defaultValue: value.value,
      ...(definition.controlId === "hemodynamics.total-blood-volume-ml" ? { step: 5 } : {}) });
  }),
);

export const MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1: ReadonlyMap<string, typeof MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1[number]> =
  new Map(MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1.map(definition => [definition.controlId, definition]));

if (MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1.length !== 53 || MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1.size !== 53)
  throw new Error("Research LV domain requires all 52 inherited controls and one atomic LV group");

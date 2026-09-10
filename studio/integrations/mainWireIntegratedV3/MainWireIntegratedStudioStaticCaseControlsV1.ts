import { MAIN_WIRE_STANDARD71_CONTROL_CATALOG_V1 as inherited } from "./MainWireIntegratedStudioStandard71ControlsV1";
import { MAIN_WIRE_LV_ACTIVE_TENSION_RESEARCH_RANGE_V1 as lvRange } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";

/** Finite-case research domain only. Production72 retains its original bounds. */
export const MAIN_WIRE_STATIC_CASE_CONTROL_CATALOG_V1 = Object.freeze([
  ...inherited.map(control => ["myocardium.active-tension-scale.LVFW", "myocardium.active-tension-scale.SEP"].includes(control.controlId)
    ? Object.freeze({ ...control, ...lvRange }) : control),
  Object.freeze({ controlId: "myocardium.lv-contractility", valueType: "number" as const,
    unit: "1", ...lvRange, defaultValue: 1, changeSemantics: "accepted-state-warm-start" as const }),
]);
export const MAIN_WIRE_STATIC_CASE_CONTROL_BY_ID_V1 = new Map(
  MAIN_WIRE_STATIC_CASE_CONTROL_CATALOG_V1.map(control => [control.controlId, control]),
);

/**
 * Read-only presentation projection from the exact Main Wire V3 fixture into
 * registered Studio controls. Numerical mutation remains owned by the model
 * package; Workbench and Reader share only this initial-value lookup.
 */
const MAIN_WIRE_INPUT_KEY_BY_CONTROL_ID_V3: Readonly<Record<string, string>> =
  Object.freeze({
    "hemodynamics.systemic-resistance": "systemicResistance",
    "hemodynamics.pulmonary-resistance": "pulmonaryResistance",
    "hemodynamics.venous-tone": "venousTone",
    "hemodynamics.arterial-stiffness": "arterialStiffness",
  });

export function mainWireIntegratedStudioControlValueFromFixtureV3(
  fixture: unknown,
  controlId: string,
): number | null {
  if (fixture === null || typeof fixture !== "object" || Array.isArray(fixture)) {
    return null;
  }
  const inputs = (fixture as Record<string, unknown>).hemodynamicResearchInputs;
  if (inputs === null || typeof inputs !== "object" || Array.isArray(inputs)) {
    return null;
  }
  const inputKey = MAIN_WIRE_INPUT_KEY_BY_CONTROL_ID_V3[controlId];
  if (inputKey === undefined) return null;
  const value = (inputs as Record<string, unknown>)[inputKey];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

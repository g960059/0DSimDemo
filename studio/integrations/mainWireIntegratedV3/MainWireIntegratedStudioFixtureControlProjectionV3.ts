import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";

const DIRECT_FIXTURE_PATH_BY_CONTROL_ID_V3: Readonly<
  Record<string, readonly string[]>
> = Object.freeze({
  "hemodynamics.systemic-resistance": [
    "hemodynamicResearchInputs", "systemicResistance",
  ],
  "hemodynamics.pulmonary-resistance": [
    "hemodynamicResearchInputs", "pulmonaryResistance",
  ],
  "hemodynamics.venous-tone": [
    "hemodynamicResearchInputs", "venousTone",
  ],
  "hemodynamics.arterial-stiffness": [
    "hemodynamicResearchInputs", "arterialStiffness",
  ],
  "rhythm.heart-rate-bpm": [
    "hemodynamicResearchInputs", "heartRateBpm",
  ],
  "hemodynamics.total-blood-volume-ml": [
    "hemodynamicResearchInputs", "totalBloodVolumeMl",
  ],
  "ventilation.peep-cm-h2o": [
    "hemodynamicResearchInputs", "peepCmH2O",
  ],
  "oxygen.hemoglobin-g-per-dl": [
    "mechanismResearchInputs", "oxygenTransport", "hemoglobinGPerDl",
  ],
  "oxygen.inspired-oxygen-fraction": [
    "mechanismResearchInputs", "oxygenTransport", "inspiredOxygenFraction01",
  ],
  "oxygen.arterial-carbon-dioxide-pressure-mm-hg": [
    "mechanismResearchInputs", "oxygenTransport",
    "arterialCarbonDioxidePressureMmHg",
  ],
  "oxygen.respiratory-exchange-ratio": [
    "mechanismResearchInputs", "oxygenTransport", "respiratoryExchangeRatio",
  ],
  "oxygen.barometric-pressure-mm-hg": [
    "mechanismResearchInputs", "oxygenTransport", "barometricPressureMmHg",
  ],
  "oxygen.true-shunt-fraction": [
    "mechanismResearchInputs", "oxygenTransport", "trueShuntFraction01",
  ],
  "oxygen.target-consumption-ml-per-min": [
    "mechanismResearchInputs", "oxygenTransport",
    "targetOxygenConsumptionMlPerMin",
  ],
  "pericardium.reference-capacity-scale": [
    "mechanismResearchInputs", "pericardium", "referenceCapacityScale",
  ],
  "pericardium.pressure-scale": [
    "mechanismResearchInputs", "pericardium", "pressureScale",
  ],
  "pericardium.exponential-stiffness-scale": [
    "mechanismResearchInputs", "pericardium", "exponentialStiffnessScale",
  ],
  "pericardium.prescribed-fluid-volume-ml": [
    "mechanismResearchInputs", "pericardium", "prescribedFluidVolumeMl",
  ],
});

const MECHANICS_FIXTURE_FIELD_BY_CONTROL_PREFIX_V3 = Object.freeze({
  "myocardium.active-tension-scale.": "activeTensionScaleByWall",
  "myocardium.passive-stiffness-scale.": "passiveStiffnessScaleByWall",
  "myocardium.calcium-decay-time-scale.": "calciumDecayTimeScaleByWall",
} as const);

const VALVE_FIXTURE_FIELD_BY_CONTROL_PREFIX_V3 = Object.freeze({
  "valve.maximum-forward-eoa-cm2.": "maximumForwardEoaCm2",
  "valve.closed-reverse-eroa-cm2.": "closedReverseEroaCm2",
} as const);

const MAIN_WIRE_WALL_IDS_V3 = new Set(["LA", "LVFW", "SEP", "RVFW", "RA"]);
const MAIN_WIRE_VALVE_IDS_V3 = new Set(["MV", "AoV", "TV", "PV"]);
const MAIN_WIRE_CORONARY_TERRITORY_IDS_V3 = new Set(["LAD", "LCx", "RCA"]);
const MAIN_WIRE_CORONARY_LAYER_IDS_V3 = new Set([
  "subepicardial",
  "subendocardial",
]);

/**
 * Compatibility projection for the currently admitted immutable artifact.
 * Its test applies and reads every registered control, so a future exact
 * control addition cannot silently fall back to a presentation default.
 */
export function mainWireIntegratedStudioControlValueFromFixtureV3(
  fixture: unknown,
  controlId: string,
): number | null {
  const directPath = DIRECT_FIXTURE_PATH_BY_CONTROL_ID_V3[controlId];
  if (directPath !== undefined) {
    return finiteNumberAtPathV3(fixture, directPath);
  }

  if (controlId === "myocardium.contractility") {
    const values = ["LVFW", "SEP", "RVFW"].map((wallId) =>
      finiteNumberAtPathV3(fixture, [
        "mechanismResearchInputs",
        "chamberMechanics",
        "activeTensionScaleByWall",
        wallId,
      ]),
    );
    const common = values[0];
    return common !== null && common !== undefined &&
      values.every((value) => value === common)
      ? common
      : null;
  }

  for (const [prefix, fixtureField] of Object.entries(
    MECHANICS_FIXTURE_FIELD_BY_CONTROL_PREFIX_V3,
  )) {
    if (!controlId.startsWith(prefix)) continue;
    const wallId = controlId.slice(prefix.length);
    if (!MAIN_WIRE_WALL_IDS_V3.has(wallId)) return null;
    return finiteNumberAtPathV3(fixture, [
      "mechanismResearchInputs",
      "chamberMechanics",
      fixtureField,
      wallId,
    ]);
  }

  for (const [prefix, fixtureField] of Object.entries(
    VALVE_FIXTURE_FIELD_BY_CONTROL_PREFIX_V3,
  )) {
    if (!controlId.startsWith(prefix)) continue;
    const valveId = controlId.slice(prefix.length);
    if (!MAIN_WIRE_VALVE_IDS_V3.has(valveId)) return null;
    return finiteNumberAtPathV3(fixture, [
      "mechanismResearchInputs",
      "valveAreas",
      valveId,
      fixtureField,
    ]);
  }

  const focalPrefix = "coronary.focal-diameter-loss-fraction.";
  if (controlId.startsWith(focalPrefix)) {
    const territoryId = controlId.slice(focalPrefix.length);
    if (!MAIN_WIRE_CORONARY_TERRITORY_IDS_V3.has(territoryId)) return null;
    return finiteNumberAtPathV3(fixture, [
      "mechanismResearchInputs",
      "coronaryDisease",
      "focalDiameterLossFraction01ByTerritory",
      territoryId,
    ]);
  }

  const structural = /^coronary\.structural-(r1|rm)-resistance-scale\.([^.]+)\.([^.]+)$/
    .exec(controlId);
  if (structural !== null) {
    const [, resistanceKind, territoryId, layerId] = structural;
    if (
      territoryId === undefined || layerId === undefined ||
      !MAIN_WIRE_CORONARY_TERRITORY_IDS_V3.has(territoryId) ||
      !MAIN_WIRE_CORONARY_LAYER_IDS_V3.has(layerId)
    ) {
      return null;
    }
    return finiteNumberAtPathV3(fixture, [
      "mechanismResearchInputs",
      "coronaryDisease",
      resistanceKind === "r1"
        ? "structuralR1ResistanceScaleByTerritoryLayer"
        : "structuralRmResistanceScaleByTerritoryLayer",
      territoryId,
      layerId,
    ]);
  }

  return null;
}

export const mainWireIntegratedStudioFixtureProjectionV3:
ExactModelFixtureProjectionV1 = Object.freeze({
  controlValue: mainWireIntegratedStudioControlValueFromFixtureV3,
});

function finiteNumberAtPathV3(
  value: unknown,
  path: readonly string[],
): number | null {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" && Number.isFinite(current)
    ? current
    : null;
}

/**
 * Read-only presentation projection from the exact Main Wire V3 fixture into
 * registered Studio controls. Numerical mutation remains owned by the model
 * package; Workbench and Reader share only readback and composite-control
 * presentation reconciliation.
 */
const MAIN_WIRE_INPUT_KEY_BY_CONTROL_ID_V3: Readonly<Record<string, string>> =
  Object.freeze({
    "hemodynamics.systemic-resistance": "systemicResistance",
    "hemodynamics.pulmonary-resistance": "pulmonaryResistance",
    "hemodynamics.venous-tone": "venousTone",
    "hemodynamics.arterial-stiffness": "arterialStiffness",
    "rhythm.heart-rate-bpm": "heartRateBpm",
    "hemodynamics.total-blood-volume-ml": "totalBloodVolumeMl",
    "ventilation.peep-cm-h2o": "peepCmH2O",
  });

const MAIN_WIRE_OXYGEN_INPUT_KEY_BY_CONTROL_ID_V3: Readonly<
  Record<string, string>
> = Object.freeze({
  "oxygen.hemoglobin-g-per-dl": "hemoglobinGPerDl",
  "oxygen.inspired-oxygen-fraction": "inspiredOxygenFraction01",
  "oxygen.arterial-carbon-dioxide-pressure-mm-hg":
    "arterialCarbonDioxidePressureMmHg",
  "oxygen.respiratory-exchange-ratio": "respiratoryExchangeRatio",
  "oxygen.barometric-pressure-mm-hg": "barometricPressureMmHg",
  "oxygen.true-shunt-fraction": "trueShuntFraction01",
  "oxygen.target-consumption-ml-per-min":
    "targetOxygenConsumptionMlPerMin",
});

const MAIN_WIRE_PERICARDIUM_INPUT_KEY_BY_CONTROL_ID_V3: Readonly<
  Record<string, string>
> = Object.freeze({
  "pericardium.reference-capacity-scale": "referenceCapacityScale",
  "pericardium.pressure-scale": "pressureScale",
  "pericardium.exponential-stiffness-scale":
    "exponentialStiffnessScale",
  "pericardium.prescribed-fluid-volume-ml": "prescribedFluidVolumeMl",
});

const MAIN_WIRE_MECHANICS_INPUT_KEY_BY_CONTROL_FAMILY_V3: Readonly<
  Record<string, string>
> = Object.freeze({
  "active-tension-scale": "activeTensionScaleByWall",
  "passive-stiffness-scale": "passiveStiffnessScaleByWall",
  "calcium-decay-time-scale": "calciumDecayTimeScaleByWall",
});

const MAIN_WIRE_VALVE_INPUT_KEY_BY_CONTROL_FAMILY_V3: Readonly<
  Record<string, string>
> = Object.freeze({
  "maximum-forward-eoa-cm2": "maximumForwardEoaCm2",
  "closed-reverse-eroa-cm2": "closedReverseEroaCm2",
});

const MAIN_WIRE_COMMON_VENTRICULAR_ACTIVE_TENSION_CONTROL_ID_V3 =
  "myocardium.contractility" as const;
const MAIN_WIRE_VENTRICULAR_ACTIVE_TENSION_CONTROL_IDS_V3 = Object.freeze([
  "myocardium.active-tension-scale.LVFW",
  "myocardium.active-tension-scale.SEP",
  "myocardium.active-tension-scale.RVFW",
] as const);

export type MainWireIntegratedStudioControlProjectionV3 =
  | Readonly<{ kind: "value"; value: number }>
  | Readonly<{ kind: "mixed" }>
  | Readonly<{ kind: "unavailable" }>;

export type MainWireIntegratedStudioControlValueMapV3 = Readonly<
  Record<string, number | null>
>;

export function mainWireIntegratedStudioControlProjectionFromFixtureV3(
  fixture: unknown,
  controlId: string,
): MainWireIntegratedStudioControlProjectionV3 {
  if (controlId === MAIN_WIRE_COMMON_VENTRICULAR_ACTIVE_TENSION_CONTROL_ID_V3) {
    const values = (["LVFW", "SEP", "RVFW"] as const).map((wallId) =>
      finiteFixtureNumberV3(fixture, [
        "mechanismResearchInputs",
        "chamberMechanics",
        "activeTensionScaleByWall",
        wallId,
      ]),
    );
    const [first] = values;
    if (first === null || values.some((value) => value === null)) {
      return Object.freeze({ kind: "unavailable" as const });
    }
    return values.every((value) => value === first)
      ? Object.freeze({ kind: "value" as const, value: first })
      : Object.freeze({ kind: "mixed" as const });
  }

  const value = mainWireIntegratedStudioScalarControlValueFromFixtureV3(
    fixture,
    controlId,
  );
  return value === null
    ? Object.freeze({ kind: "unavailable" as const })
    : Object.freeze({ kind: "value" as const, value });
}

export function mainWireIntegratedStudioControlValueFromFixtureV3(
  fixture: unknown,
  controlId: string,
): number | null {
  const projection = mainWireIntegratedStudioControlProjectionFromFixtureV3(
    fixture,
    controlId,
  );
  return projection.kind === "value" ? projection.value : null;
}

export function mainWireIntegratedStudioControlValuesFromFixtureV3(
  fixture: unknown,
  controls: readonly Readonly<{ controlId: string; defaultValue: number }>[],
): MainWireIntegratedStudioControlValueMapV3 {
  return Object.freeze(
    Object.fromEntries(
      controls.map((control) => {
        const projection =
          mainWireIntegratedStudioControlProjectionFromFixtureV3(
            fixture,
            control.controlId,
          );
        return [
          control.controlId,
          projection.kind === "value"
            ? projection.value
            : projection.kind === "mixed"
              ? null
              : control.defaultValue,
        ];
      }),
    ),
  );
}

export function mainWireIntegratedStudioControlValuesAfterAssignmentV3(
  current: MainWireIntegratedStudioControlValueMapV3,
  controlId: string,
  value: number,
): MainWireIntegratedStudioControlValueMapV3 {
  const next: Record<string, number | null> = {
    ...current,
    [controlId]: value,
  };
  if (controlId === MAIN_WIRE_COMMON_VENTRICULAR_ACTIVE_TENSION_CONTROL_ID_V3) {
    for (
      const detailedControlId of
      MAIN_WIRE_VENTRICULAR_ACTIVE_TENSION_CONTROL_IDS_V3
    ) {
      next[detailedControlId] = value;
    }
  } else if (
    MAIN_WIRE_VENTRICULAR_ACTIVE_TENSION_CONTROL_IDS_V3.some(
      (detailedControlId) => detailedControlId === controlId,
    )
  ) {
    const detailedValues =
      MAIN_WIRE_VENTRICULAR_ACTIVE_TENSION_CONTROL_IDS_V3.map(
        (detailedControlId) => next[detailedControlId],
      );
    const [first] = detailedValues;
    next[MAIN_WIRE_COMMON_VENTRICULAR_ACTIVE_TENSION_CONTROL_ID_V3] =
      typeof first === "number" &&
      detailedValues.every((candidate) => candidate === first)
        ? first
        : null;
  }
  return Object.freeze(next);
}

function mainWireIntegratedStudioScalarControlValueFromFixtureV3(
  fixture: unknown,
  controlId: string,
): number | null {
  const inputKey = MAIN_WIRE_INPUT_KEY_BY_CONTROL_ID_V3[controlId];
  if (inputKey !== undefined) {
    return finiteFixtureNumberV3(fixture, [
      "hemodynamicResearchInputs",
      inputKey,
    ]);
  }

  const mechanics = controlId.match(
    /^myocardium\.(active-tension-scale|passive-stiffness-scale|calcium-decay-time-scale)\.(LA|LVFW|SEP|RVFW|RA)$/,
  );
  if (mechanics !== null) {
    const family = mechanics[1]!;
    const wallId = mechanics[2]!;
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "chamberMechanics",
      MAIN_WIRE_MECHANICS_INPUT_KEY_BY_CONTROL_FAMILY_V3[family]!,
      wallId,
    ]);
  }

  const valve = controlId.match(
    /^valve\.(maximum-forward-eoa-cm2|closed-reverse-eroa-cm2)\.(MV|AoV|TV|PV)$/,
  );
  if (valve !== null) {
    const family = valve[1]!;
    const valveId = valve[2]!;
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "valveAreas",
      valveId,
      MAIN_WIRE_VALVE_INPUT_KEY_BY_CONTROL_FAMILY_V3[family]!,
    ]);
  }

  const oxygenInputKey =
    MAIN_WIRE_OXYGEN_INPUT_KEY_BY_CONTROL_ID_V3[controlId];
  if (oxygenInputKey !== undefined) {
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "oxygenTransport",
      oxygenInputKey,
    ]);
  }

  const pericardiumInputKey =
    MAIN_WIRE_PERICARDIUM_INPUT_KEY_BY_CONTROL_ID_V3[controlId];
  if (pericardiumInputKey !== undefined) {
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "pericardium",
      pericardiumInputKey,
    ]);
  }

  const focalCoronary = controlId.match(
    /^coronary\.focal-diameter-loss-fraction\.(LAD|LCx|RCA)$/,
  );
  if (focalCoronary !== null) {
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "coronaryDisease",
      "focalDiameterLossFraction01ByTerritory",
      focalCoronary[1]!,
    ]);
  }

  const structuralCoronary = controlId.match(
    /^coronary\.structural-(r1|rm)-resistance-scale\.(LAD|LCx|RCA)\.(subepicardial|subendocardial)$/,
  );
  if (structuralCoronary !== null) {
    const inputFamily =
      structuralCoronary[1] === "r1"
        ? "structuralR1ResistanceScaleByTerritoryLayer"
        : "structuralRmResistanceScaleByTerritoryLayer";
    return finiteFixtureNumberV3(fixture, [
      "mechanismResearchInputs",
      "coronaryDisease",
      inputFamily,
      structuralCoronary[2]!,
      structuralCoronary[3]!,
    ]);
  }

  return null;
}

function finiteFixtureNumberV3(
  root: unknown,
  path: readonly string[],
): number | null {
  let value = root;
  for (const key of path) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

import {
  MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2,
} from "@/engine/coronary/MainWireCoronaryDiseaseResearchInputsV2";
import {
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD68_TO70_HEMODYNAMIC_RANGES_V1 } from
  "./MainWireIntegratedStudioPublishedHemodynamicDomainsV1";
import {
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1,
  type MainWireCommonPericardiumResearchInputKeyV1,
} from "@/engine/myocardium/mechanics/MainWireCommonPericardiumResearchInputsV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  type MainWireFiveWallIdV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1,
  type MainWireFiveWallMechanicsScaleKindV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  OXYGEN_TRANSPORT_INPUT_RANGES_V1,
  type OxygenTransportInputsV1,
} from "@/engine/physiology/oxygenTransportV1";
import {
  MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1,
  MAIN_WIRE_FOUR_VALVE_IDS_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { studioNumericControlValueIssueV2 } from
  "@/studio/contracts/v2/control";
import type { ControlDefinitionV2 } from "@/studio/contracts/v2/model";
import type { StudioFixturePatchV2 } from "@/studio/contracts/v2/runtime";

type OxygenNumericKeyV1 = Exclude<keyof OxygenTransportInputsV1, "inputId">;
type EditableFixtureV1 = Readonly<{
  schemaId: string;
  rhythm: Readonly<{ mode: string }>;
  coronary: Readonly<{ topologyProfile: string }>;
  dynamicMechanicalSupport: Readonly<{ mode: string }>;
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
}>;

const HEMODYNAMIC_CONTROL_BY_INPUT_V1 = Object.freeze({
  systemicResistance: "hemodynamics.systemic-resistance",
  pulmonaryResistance: "hemodynamics.pulmonary-resistance",
  venousTone: "hemodynamics.venous-tone",
  arterialStiffness: "hemodynamics.arterial-stiffness",
  heartRateBpm: "rhythm.heart-rate-bpm",
  totalBloodVolumeMl: "hemodynamics.total-blood-volume-ml",
  peepCmH2O: "ventilation.peep-cm-h2o",
} satisfies Record<MainWireIntegratedModelHemodynamicResearchInputKeyV3, string>);

const MECHANICS_PREFIX_BY_KIND_V1 = Object.freeze({
  activeTensionScaleByWall: "myocardium.active-tension-scale",
  passiveStiffnessScaleByWall: "myocardium.passive-stiffness-scale",
} satisfies Partial<Record<MainWireFiveWallMechanicsScaleKindV1, string>>);

const PERICARDIUM_CONTROL_BY_INPUT_V1 = Object.freeze({
  referenceCapacityScale: "pericardium.reference-capacity-scale",
  pressureScale: "pericardium.pressure-scale",
  exponentialStiffnessScale: "pericardium.exponential-stiffness-scale",
  prescribedFluidVolumeMl: "pericardium.prescribed-fluid-volume-ml",
} satisfies Record<MainWireCommonPericardiumResearchInputKeyV1, string>);

const OXYGEN_CONTROL_BY_INPUT_V1 = Object.freeze({
  hemoglobinGPerDl: "oxygen.hemoglobin-g-per-dl",
  inspiredOxygenFraction01: "oxygen.inspired-oxygen-fraction",
  arterialCarbonDioxidePressureMmHg:
    "oxygen.arterial-carbon-dioxide-pressure-mm-hg",
  respiratoryExchangeRatio: "oxygen.respiratory-exchange-ratio",
  barometricPressureMmHg: "oxygen.barometric-pressure-mm-hg",
  trueShuntFraction01: "oxygen.true-shunt-fraction",
  targetOxygenConsumptionMlPerMin:
    "oxygen.target-consumption-ml-per-min",
} satisfies Record<OxygenNumericKeyV1, string>);

const CORONARY_TERRITORIES_V1 = Object.freeze(["LAD", "LCx", "RCA"] as const);
const CORONARY_LAYERS_V1 = Object.freeze([
  "subepicardial",
  "subendocardial",
] as const);

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1:
  readonly ControlDefinitionV2[] = Object.freeze([
    ...(["heartRateBpm", "totalBloodVolumeMl", "systemicResistance"] as const)
      .map(hemodynamicDefinitionV1),
    definitionV1(
      "myocardium.contractility",
      "1",
      MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1
        .activeTensionScaleByWall,
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
        .chamberMechanics.activeTensionScaleByWall.LVFW,
    ),
    ...(["venousTone", "peepCmH2O", "pulmonaryResistance", "arterialStiffness"] as const)
      .map(hemodynamicDefinitionV1),
    ...Object.entries(MECHANICS_PREFIX_BY_KIND_V1).flatMap(
      ([scaleKind, prefix]) => MAIN_WIRE_FIVE_WALL_IDS_V1.map((wallId) => {
        const kind = scaleKind as Exclude<
          MainWireFiveWallMechanicsScaleKindV1,
          "calciumDecayTimeScaleByWall"
        >;
        return definitionV1(
          `${prefix}.${wallId}`,
          "1",
          MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1[kind],
          MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
            .chamberMechanics[kind][wallId],
        );
      }),
    ),
    ...MAIN_WIRE_FOUR_VALVE_IDS_V1.flatMap((valveId) => [
      definitionV1(
        `valve.maximum-forward-eoa-cm2.${valveId}`,
        "cm2",
        MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1[valveId]
          .maximumForwardEoaCm2,
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
          .valveAreas[valveId].maximumForwardEoaCm2,
      ),
      definitionV1(
        `valve.closed-reverse-eroa-cm2.${valveId}`,
        "cm2",
        MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1[valveId]
          .closedReverseEroaCm2,
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
          .valveAreas[valveId].closedReverseEroaCm2,
      ),
    ]),
    ...Object.entries(OXYGEN_CONTROL_BY_INPUT_V1).map(
      ([inputKey, controlId]) => {
        const key = inputKey as OxygenNumericKeyV1;
        return definitionV1(
          controlId,
          oxygenUnitV1(key),
          OXYGEN_TRANSPORT_INPUT_RANGES_V1[key],
          MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
            .oxygenTransport[key],
        );
      },
    ),
    ...Object.entries(PERICARDIUM_CONTROL_BY_INPUT_V1).map(
      ([inputKey, controlId]) => {
        const key = inputKey as MainWireCommonPericardiumResearchInputKeyV1;
        return definitionV1(
          controlId,
          key === "prescribedFluidVolumeMl" ? "mL" : "1",
          MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1[key],
          MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
            .pericardium[key],
        );
      },
    ),
    ...CORONARY_TERRITORIES_V1.map((territoryId) => definitionV1(
      `coronary.focal-diameter-loss-fraction.${territoryId}`,
      "1",
      MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2
        .focalDiameterLossFraction01,
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
        .coronaryDisease.focalDiameterLossFraction01ByTerritory[territoryId],
    )),
    ...(["r1", "rm"] as const).flatMap((resistanceKind) =>
      CORONARY_TERRITORIES_V1.flatMap((territoryId) =>
        CORONARY_LAYERS_V1.map((layerId) => {
          const field = resistanceKind === "r1"
            ? "structuralR1ResistanceScaleByTerritoryLayer" as const
            : "structuralRmResistanceScaleByTerritoryLayer" as const;
          const range = resistanceKind === "r1"
            ? MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2
              .structuralR1ResistanceScale
            : MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2
              .structuralRmResistanceScale;
          return definitionV1(
            `coronary.structural-${resistanceKind}-resistance-scale.${territoryId}.${layerId}`,
            "1",
            range,
            MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1
              .coronaryDisease[field][territoryId][layerId],
          );
        }),
      ),
    ),
  ]);

const CONTROL_BY_ID_V1 = new Map(
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1.map(
    (definition) => [definition.controlId, definition] as const,
  ),
);

if (
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1.length !== 52
  || CONTROL_BY_ID_V1.size !== 52
) {
  throw new Error("Standard68 must expose exactly 52 non-calcium controls");
}

export function applyMainWireIntegratedStudioRoundedEjectionControlV1<
  TFixture extends EditableFixtureV1,
>(
  fixture: TFixture,
  controlId: string,
  value: number,
): TFixture {
  const definition = CONTROL_BY_ID_V1.get(controlId);
  if (definition === undefined) {
    throw new Error(`Standard68 control is not registered: ${controlId}`);
  }
  const issue = studioNumericControlValueIssueV2(value, definition);
  if (issue !== undefined) {
    throw new Error(`Standard68 control ${controlId} value ${issue}`);
  }
  const hemodynamicEntry = Object.entries(HEMODYNAMIC_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (hemodynamicEntry !== undefined) {
    return Object.freeze({
      ...fixture,
      hemodynamicResearchInputs: Object.freeze({
        ...fixture.hemodynamicResearchInputs,
        [hemodynamicEntry[0]]: value,
      }),
    }) as TFixture;
  }
  const mechanics = fixture.mechanismResearchInputs.chamberMechanics;
  if (controlId === "myocardium.contractility") {
    return withMechanicsV1(fixture, {
      ...mechanics,
      activeTensionScaleByWall: {
        ...mechanics.activeTensionScaleByWall,
        LVFW: value,
        SEP: value,
        RVFW: value,
      },
    });
  }
  for (const [kind, prefix] of Object.entries(MECHANICS_PREFIX_BY_KIND_V1)) {
    if (!controlId.startsWith(`${prefix}.`)) continue;
    const wallId = controlId.slice(prefix.length + 1) as MainWireFiveWallIdV1;
    const scaleKind = kind as Exclude<
      MainWireFiveWallMechanicsScaleKindV1,
      "calciumDecayTimeScaleByWall"
    >;
    return withMechanicsV1(fixture, {
      ...mechanics,
      [scaleKind]: { ...mechanics[scaleKind], [wallId]: value },
    });
  }
  const valve = /^(valve\.(maximum-forward-eoa-cm2|closed-reverse-eroa-cm2))\.(MV|AoV|TV|PV)$/
    .exec(controlId);
  if (valve !== null) {
    const valveId = valve[3] as "MV" | "AoV" | "TV" | "PV";
    const field = valve[2] === "maximum-forward-eoa-cm2"
      ? "maximumForwardEoaCm2" as const
      : "closedReverseEroaCm2" as const;
    return withMechanismV1(fixture, {
      ...fixture.mechanismResearchInputs,
      valveAreas: {
        ...fixture.mechanismResearchInputs.valveAreas,
        [valveId]: {
          ...fixture.mechanismResearchInputs.valveAreas[valveId],
          [field]: value,
        },
      },
    });
  }
  const oxygenEntry = Object.entries(OXYGEN_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (oxygenEntry !== undefined) {
    return withMechanismV1(fixture, {
      ...fixture.mechanismResearchInputs,
      oxygenTransport: {
        ...fixture.mechanismResearchInputs.oxygenTransport,
        [oxygenEntry[0]]: value,
      },
    });
  }
  const pericardiumEntry = Object.entries(PERICARDIUM_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (pericardiumEntry !== undefined) {
    return withMechanismV1(fixture, {
      ...fixture.mechanismResearchInputs,
      pericardium: {
        ...fixture.mechanismResearchInputs.pericardium,
        [pericardiumEntry[0]]: value,
      },
    });
  }
  const focal = /^coronary\.focal-diameter-loss-fraction\.(LAD|LCx|RCA)$/
    .exec(controlId);
  if (focal !== null) {
    const territoryId = focal[1] as "LAD" | "LCx" | "RCA";
    const disease = fixture.mechanismResearchInputs.coronaryDisease;
    return withMechanismV1(fixture, {
      ...fixture.mechanismResearchInputs,
      coronaryDisease: {
        ...disease,
        focalDiameterLossFraction01ByTerritory: {
          ...disease.focalDiameterLossFraction01ByTerritory,
          [territoryId]: value,
        },
      },
    });
  }
  const structural = /^coronary\.structural-(r1|rm)-resistance-scale\.(LAD|LCx|RCA)\.(subepicardial|subendocardial)$/
    .exec(controlId);
  if (structural !== null) {
    const field = structural[1] === "r1"
      ? "structuralR1ResistanceScaleByTerritoryLayer" as const
      : "structuralRmResistanceScaleByTerritoryLayer" as const;
    const territoryId = structural[2] as "LAD" | "LCx" | "RCA";
    const layerId = structural[3] as "subepicardial" | "subendocardial";
    const disease = fixture.mechanismResearchInputs.coronaryDisease;
    return withMechanismV1(fixture, {
      ...fixture.mechanismResearchInputs,
      coronaryDisease: {
        ...disease,
        [field]: {
          ...disease[field],
          [territoryId]: {
            ...disease[field][territoryId],
            [layerId]: value,
          },
        },
      },
    });
  }
  throw new Error(`Standard68 control reducer is unavailable: ${controlId}`);
}

export function reduceMainWireIntegratedStudioRoundedEjectionControlV1<
  TFixture extends EditableFixtureV1,
>(
  fixture: TFixture,
  controlId: string,
  value: number,
): StudioFixturePatchV2 {
  // Applying first keeps path reduction and exact fixture mutation under the
  // same model-owned admissibility contract, including same-value actions.
  applyMainWireIntegratedStudioRoundedEjectionControlV1(
    fixture,
    controlId,
    value,
  );
  const hemodynamic = Object.entries(HEMODYNAMIC_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (hemodynamic !== undefined) {
    return numericPatchV1([
      ["hemodynamicResearchInputs", hemodynamic[0]],
    ], value);
  }
  if (controlId === "myocardium.contractility") {
    return numericPatchV1(
      (["LVFW", "SEP", "RVFW"] as const).map((wallId) => [
        "mechanismResearchInputs",
        "chamberMechanics",
        "activeTensionScaleByWall",
        wallId,
      ]),
      value,
    );
  }
  for (const [kind, prefix] of Object.entries(MECHANICS_PREFIX_BY_KIND_V1)) {
    if (!controlId.startsWith(`${prefix}.`)) continue;
    return numericPatchV1([[
      "mechanismResearchInputs",
      "chamberMechanics",
      kind,
      controlId.slice(prefix.length + 1),
    ]], value);
  }
  const valve = /^(valve\.(maximum-forward-eoa-cm2|closed-reverse-eroa-cm2))\.(MV|AoV|TV|PV)$/
    .exec(controlId);
  if (valve !== null) {
    return numericPatchV1([[
      "mechanismResearchInputs",
      "valveAreas",
      valve[3]!,
      valve[2] === "maximum-forward-eoa-cm2"
        ? "maximumForwardEoaCm2"
        : "closedReverseEroaCm2",
    ]], value);
  }
  const oxygen = Object.entries(OXYGEN_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (oxygen !== undefined) {
    return numericPatchV1([[
      "mechanismResearchInputs",
      "oxygenTransport",
      oxygen[0],
    ]], value);
  }
  const pericardium = Object.entries(PERICARDIUM_CONTROL_BY_INPUT_V1)
    .find(([, id]) => id === controlId);
  if (pericardium !== undefined) {
    return numericPatchV1([[
      "mechanismResearchInputs",
      "pericardium",
      pericardium[0],
    ]], value);
  }
  const focal = /^coronary\.focal-diameter-loss-fraction\.(LAD|LCx|RCA)$/
    .exec(controlId);
  if (focal !== null) {
    return numericPatchV1([[
      "mechanismResearchInputs",
      "coronaryDisease",
      "focalDiameterLossFraction01ByTerritory",
      focal[1]!,
    ]], value);
  }
  const structural = /^coronary\.structural-(r1|rm)-resistance-scale\.(LAD|LCx|RCA)\.(subepicardial|subendocardial)$/
    .exec(controlId);
  if (structural !== null) {
    return numericPatchV1([[
      "mechanismResearchInputs",
      "coronaryDisease",
      structural[1] === "r1"
        ? "structuralR1ResistanceScaleByTerritoryLayer"
        : "structuralRmResistanceScaleByTerritoryLayer",
      structural[2]!,
      structural[3]!,
    ]], value);
  }
  throw new Error(`Standard68 control patch is unavailable: ${controlId}`);
}

function numericPatchV1(
  paths: readonly (readonly [string, ...string[]])[],
  value: number,
): StudioFixturePatchV2 {
  return Object.freeze({
    changes: Object.freeze(paths.map((path) => Object.freeze({
      path: Object.freeze([...path]) as readonly [string, ...string[]],
      value,
    }))),
  });
}

function withMechanicsV1<TFixture extends EditableFixtureV1>(
  fixture: TFixture,
  chamberMechanics:
    MainWireIntegratedModelMechanismResearchInputsV3["chamberMechanics"],
): TFixture {
  return withMechanismV1(fixture, {
    ...fixture.mechanismResearchInputs,
    chamberMechanics,
  });
}

function withMechanismV1<TFixture extends EditableFixtureV1>(
  fixture: TFixture,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
): TFixture {
  return Object.freeze({
    ...fixture,
    mechanismResearchInputs: Object.freeze(mechanismResearchInputs),
  }) as TFixture;
}

function definitionV1(
  controlId: string,
  unit: string,
  range: Readonly<{ minimum: number; maximum: number; step: number }>,
  defaultValue: number,
): ControlDefinitionV2 {
  return Object.freeze({
    controlId,
    valueType: "number" as const,
    unit,
    minimum: range.minimum,
    maximum: range.maximum,
    step: range.step,
    defaultValue,
    changeSemantics: "accepted-state-warm-start" as const,
  });
}

function hemodynamicDefinitionV1(
  key: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): ControlDefinitionV2 {
  return definitionV1(
    HEMODYNAMIC_CONTROL_BY_INPUT_V1[key],
    hemodynamicUnitV1(key),
    MAIN_WIRE_INTEGRATED_STUDIO_STANDARD68_TO70_HEMODYNAMIC_RANGES_V1[key],
    MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1[key],
  );
}

function hemodynamicUnitV1(
  inputKey: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
): string {
  if (inputKey === "heartRateBpm") return "bpm";
  if (inputKey === "totalBloodVolumeMl") return "mL";
  if (inputKey === "peepCmH2O") return "cmH2O";
  return "1";
}

function oxygenUnitV1(inputKey: OxygenNumericKeyV1): string {
  if (inputKey === "hemoglobinGPerDl") return "g/dL";
  if (
    inputKey === "arterialCarbonDioxidePressureMmHg"
    || inputKey === "barometricPressureMmHg"
  ) return "mmHg";
  if (inputKey === "targetOxygenConsumptionMlPerMin") return "mL O2/min";
  return "1";
}

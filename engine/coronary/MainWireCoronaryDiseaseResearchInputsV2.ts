import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  mapFocalDiameterStenosisV2,
  type CoronaryDiseaseInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryLayerRecordV2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";

export const MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUTS_V2_ID =
  "main-wire-coronary-disease-research-inputs-v2" as const;

export type MainWireCoronaryDiseaseResearchInputsV2 = Readonly<{
  inputId: typeof MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUTS_V2_ID;
  focalDiameterLossFraction01ByTerritory: CoronaryTerritoryRecordV2<number>;
  structuralR1ResistanceScaleByTerritoryLayer: CoronaryTerritoryLayerRecordV2<number>;
  structuralRmResistanceScaleByTerritoryLayer: CoronaryTerritoryLayerRecordV2<number>;
}>;

export const MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2 =
  Object.freeze({
    focalDiameterLossFraction01: Object.freeze({
      minimum: 0,
      maximum: 0.85,
      step: 0.01,
    }),
    structuralR1ResistanceScale: Object.freeze({
      minimum: 0.5,
      maximum: 5,
      step: 0.05,
    }),
    structuralRmResistanceScale: Object.freeze({
      minimum: 0.5,
      maximum: 5,
      step: 0.05,
    }),
  });

const unitTerritory = (): CoronaryTerritoryRecordV2<number> =>
  Object.freeze({
    LAD: 0,
    LCx: 0,
    RCA: 0,
  });
const unitLayers = (): CoronaryTerritoryLayerRecordV2<number> =>
  Object.freeze({
    LAD: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
    LCx: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
    RCA: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
  });

export const MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2: MainWireCoronaryDiseaseResearchInputsV2 =
  Object.freeze({
    inputId: MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUTS_V2_ID,
    focalDiameterLossFraction01ByTerritory: unitTerritory(),
    structuralR1ResistanceScaleByTerritoryLayer: unitLayers(),
    structuralRmResistanceScaleByTerritoryLayer: unitLayers(),
  });

export function validateAndOwnMainWireCoronaryDiseaseResearchInputsV2(
  input: unknown,
): MainWireCoronaryDiseaseResearchInputsV2 {
  const record = exactRecordV2(
    input,
    [
      "inputId",
      "focalDiameterLossFraction01ByTerritory",
      "structuralR1ResistanceScaleByTerritoryLayer",
      "structuralRmResistanceScaleByTerritoryLayer",
    ],
    "coronary disease research inputs",
  );
  if (record.inputId !== MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUTS_V2_ID) {
    throw new Error("coronary disease research input identity is invalid");
  }
  return Object.freeze({
    inputId: MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUTS_V2_ID,
    focalDiameterLossFraction01ByTerritory: ownTerritoryRecordV2(
      record.focalDiameterLossFraction01ByTerritory,
      "focal diameter loss",
      MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2.focalDiameterLossFraction01,
    ),
    structuralR1ResistanceScaleByTerritoryLayer: ownLayerRecordV2(
      record.structuralR1ResistanceScaleByTerritoryLayer,
      "structural R1 resistance scale",
      MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2.structuralR1ResistanceScale,
    ),
    structuralRmResistanceScaleByTerritoryLayer: ownLayerRecordV2(
      record.structuralRmResistanceScaleByTerritoryLayer,
      "structural Rm resistance scale",
      MAIN_WIRE_CORONARY_DISEASE_RESEARCH_INPUT_RANGES_V2.structuralRmResistanceScale,
    ),
  });
}

export function createMainWireCoronaryDiseaseInputV2(
  input: MainWireCoronaryDiseaseResearchInputsV2,
): CoronaryDiseaseInputV2 {
  const owned = validateAndOwnMainWireCoronaryDiseaseResearchInputsV2(input);
  return Object.freeze(
    Object.fromEntries(
      CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
        const focal = mapFocalDiameterStenosisV2(
          territoryId,
          owned.focalDiameterLossFraction01ByTerritory[territoryId],
        );
        const normal = NORMAL_CORONARY_DISEASE_INPUT_V2[territoryId];
        return [
          territoryId,
          Object.freeze({
            ...focal,
            layers: Object.freeze(
              Object.fromEntries(
                CORONARY_LAYER_IDS_V2.map((layerId) => [
                  layerId,
                  Object.freeze({
                    structuralR1ResistanceScale:
                      owned.structuralR1ResistanceScaleByTerritoryLayer[
                        territoryId
                      ][layerId],
                    structuralRmResistanceScale:
                      owned.structuralRmResistanceScaleByTerritoryLayer[
                        territoryId
                      ][layerId],
                    vasodilatoryToneMinimumResistanceScale:
                      normal.layers[layerId]
                        .vasodilatoryToneMinimumResistanceScale,
                  }),
                ]),
              ),
            ) as CoronaryLayerRecordV2<
              CoronaryDiseaseInputV2["LAD"]["layers"]["subepicardial"]
            >,
          }),
        ];
      }),
    ),
  ) as CoronaryDiseaseInputV2;
}

type RangeV2 = Readonly<{ minimum: number; maximum: number }>;

function ownTerritoryRecordV2(
  input: unknown,
  label: string,
  range: RangeV2,
): CoronaryTerritoryRecordV2<number> {
  const record = exactRecordV2(input, CORONARY_TERRITORY_IDS_V2, label);
  return Object.freeze({
    LAD: rangedNumberV2(record.LAD, `${label} LAD`, range),
    LCx: rangedNumberV2(record.LCx, `${label} LCx`, range),
    RCA: rangedNumberV2(record.RCA, `${label} RCA`, range),
  });
}

function ownLayerRecordV2(
  input: unknown,
  label: string,
  range: RangeV2,
): CoronaryTerritoryLayerRecordV2<number> {
  const record = exactRecordV2(input, CORONARY_TERRITORY_IDS_V2, label);
  const ownTerritory = (territoryId: "LAD" | "LCx" | "RCA") => {
    const layers = exactRecordV2(
      record[territoryId],
      CORONARY_LAYER_IDS_V2,
      `${label} ${territoryId}`,
    );
    return Object.freeze({
      subepicardial: rangedNumberV2(
        layers.subepicardial,
        `${label} ${territoryId} subepicardial`,
        range,
      ),
      subendocardial: rangedNumberV2(
        layers.subendocardial,
        `${label} ${territoryId} subendocardial`,
        range,
      ),
    });
  };
  return Object.freeze({
    LAD: ownTerritory("LAD"),
    LCx: ownTerritory("LCx"),
    RCA: ownTerritory("RCA"),
  });
}

function rangedNumberV2(value: unknown, label: string, range: RangeV2): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    value < range.minimum ||
    value > range.maximum
  ) {
    throw new RangeError(
      `${label} must lie in [${range.minimum}, ${range.maximum}]`,
    );
  }
  return value;
}

function exactRecordV2(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} fields must match exactly`);
  }
  return input as Record<string, unknown>;
}

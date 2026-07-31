import {
  NORMAL_CORONARY_DISEASE_INPUT_V1,
  type CoronaryDiseaseInputV1,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV1";
import {
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryTerritoryIdV1,
} from "@/engine/coronary/typesV1";

export const CORONARY_DISEASE_RESEARCH_BRACKET_CATALOG_V1_ID =
  "main-wire-coronary-disease-research-brackets-v1" as const;

export const CORONARY_DISEASE_RESEARCH_BRACKET_IDS_V1 = Object.freeze([
  "normal",
  "LAD-diameter-loss-0p50",
  "LAD-diameter-loss-0p70",
  "three-vessel-diameter-loss-0p60",
  "diffuse-microvascular-resistance-2p50",
  "LAD-diameter-loss-0p60-plus-microvascular-resistance-2p00",
] as const);

export type CoronaryDiseaseResearchBracketIdV1 =
  (typeof CORONARY_DISEASE_RESEARCH_BRACKET_IDS_V1)[number];

export type CoronaryDiseaseResearchBracketV1 = Readonly<{
  bracketId: CoronaryDiseaseResearchBracketIdV1;
  parameterSetId: string;
  disease: CoronaryDiseaseInputV1;
  derivedResidualAreaFraction01ByTerritory:
    Readonly<Record<CoronaryTerritoryIdV1, number>>;
  claim: Readonly<{
    quantitativeResearchBracketNotClinicalDiagnosis: true;
    diameterLossNotAreaLoss: true;
    focalAndMicrovascularAxesIndependent: true;
    autoregulatoryToneNotEncodedAsDisease: true;
    patientSpecificFittingClaimed: false;
  }>;
}>;

const CLAIM = Object.freeze({
  quantitativeResearchBracketNotClinicalDiagnosis: true as const,
  diameterLossNotAreaLoss: true as const,
  focalAndMicrovascularAxesIndependent: true as const,
  autoregulatoryToneNotEncodedAsDisease: true as const,
  patientSpecificFittingClaimed: false as const,
});

export const CORONARY_DISEASE_RESEARCH_BRACKETS_V1 = Object.freeze(
  Object.fromEntries(CORONARY_DISEASE_RESEARCH_BRACKET_IDS_V1.map((bracketId) => {
    const disease = diseaseForBracket(bracketId);
    return [bracketId, Object.freeze({
      bracketId,
      parameterSetId:
        `${CORONARY_DISEASE_RESEARCH_BRACKET_CATALOG_V1_ID}:${bracketId}`,
      disease,
      derivedResidualAreaFraction01ByTerritory: Object.freeze(
        Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
          territoryId,
          (1 - disease[territoryId].diameterStenosisFraction01) ** 2,
        ])),
      ) as Readonly<Record<CoronaryTerritoryIdV1, number>>,
      claim: CLAIM,
    })];
  })),
) as Readonly<Record<
  CoronaryDiseaseResearchBracketIdV1,
  CoronaryDiseaseResearchBracketV1
>>;

export function coronaryDiseaseResearchBracketV1(
  bracketId: CoronaryDiseaseResearchBracketIdV1,
): CoronaryDiseaseResearchBracketV1 {
  const bracket = CORONARY_DISEASE_RESEARCH_BRACKETS_V1[bracketId];
  if (bracket === undefined) {
    throw new RangeError("unknown coronary disease research bracket");
  }
  return bracket;
}

function diseaseForBracket(
  bracketId: CoronaryDiseaseResearchBracketIdV1,
): CoronaryDiseaseInputV1 {
  if (bracketId === "normal") return cloneDisease(NORMAL_CORONARY_DISEASE_INPUT_V1);
  if (bracketId === "LAD-diameter-loss-0p50") {
    return withTerritory("LAD", { diameterStenosisFraction01: 0.50 });
  }
  if (bracketId === "LAD-diameter-loss-0p70") {
    return withTerritory("LAD", { diameterStenosisFraction01: 0.70 });
  }
  if (bracketId === "three-vessel-diameter-loss-0p60") {
    return freezeDisease(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
      (territoryId) => [territoryId, Object.freeze({
        diameterStenosisFraction01: 0.60,
        microvascularStructuralResistanceScale: 1,
      })],
    )) as unknown as CoronaryDiseaseInputV1);
  }
  if (bracketId === "diffuse-microvascular-resistance-2p50") {
    return freezeDisease(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
      (territoryId) => [territoryId, Object.freeze({
        diameterStenosisFraction01: 0,
        microvascularStructuralResistanceScale: 2.50,
      })],
    )) as unknown as CoronaryDiseaseInputV1);
  }
  return withTerritory("LAD", {
    diameterStenosisFraction01: 0.60,
    microvascularStructuralResistanceScale: 2,
  });
}

function withTerritory(
  territoryId: CoronaryTerritoryIdV1,
  values: Partial<CoronaryDiseaseInputV1["LAD"]>,
): CoronaryDiseaseInputV1 {
  const disease = cloneDisease(NORMAL_CORONARY_DISEASE_INPUT_V1);
  return freezeDisease({
    ...disease,
    [territoryId]: Object.freeze({ ...disease[territoryId], ...values }),
  });
}

function cloneDisease(disease: CoronaryDiseaseInputV1): CoronaryDiseaseInputV1 {
  return freezeDisease(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
    (territoryId) => [territoryId, Object.freeze({ ...disease[territoryId] })],
  )) as unknown as CoronaryDiseaseInputV1);
}

function freezeDisease(disease: CoronaryDiseaseInputV1): CoronaryDiseaseInputV1 {
  for (const territoryId of CORONARY_TERRITORY_IDS_V1) {
    const value = disease[territoryId];
    if (
      !Number.isFinite(value.diameterStenosisFraction01)
      || value.diameterStenosisFraction01 < 0
      || value.diameterStenosisFraction01 >= 1
    ) throw new RangeError(`${territoryId} diameter loss must lie in [0, 1)`);
    if (
      !Number.isFinite(value.microvascularStructuralResistanceScale)
      || value.microvascularStructuralResistanceScale <= 0
    ) throw new RangeError(`${territoryId} microvascular scale must be positive`);
  }
  return Object.freeze(disease);
}

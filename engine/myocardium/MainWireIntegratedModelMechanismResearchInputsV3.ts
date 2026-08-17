import {
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
  validateAndOwnMainWireFourValveAreaInputsV1,
  type MainWireFourValveAreaInputsV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
  validateAndOwnMainWireFiveWallMechanicsResearchInputsV1,
  type MainWireFiveWallMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
  validateAndOwnOxygenTransportInputsV1,
  type OxygenTransportInputsV1,
} from "@/engine/physiology/oxygenTransportV1";
import {
  MAIN_WIRE_COMMON_PERICARDIUM_DEFAULT_RESEARCH_INPUTS_V1,
  validateAndOwnMainWireCommonPericardiumResearchInputsV1,
  type MainWireCommonPericardiumResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireCommonPericardiumResearchInputsV1";
import {
  MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2,
  validateAndOwnMainWireCoronaryDiseaseResearchInputsV2,
  type MainWireCoronaryDiseaseResearchInputsV2,
} from "@/engine/coronary/MainWireCoronaryDiseaseResearchInputsV2";

export const MAIN_WIRE_INTEGRATED_MODEL_MECHANISM_RESEARCH_INPUTS_V3_ID =
  "main-wire-integrated-model-mechanism-research-inputs-v3" as const;

export type MainWireIntegratedModelMechanismResearchInputsV3 = Readonly<{
  inputId: typeof MAIN_WIRE_INTEGRATED_MODEL_MECHANISM_RESEARCH_INPUTS_V3_ID;
  valveAreas: MainWireFourValveAreaInputsV1;
  chamberMechanics: MainWireFiveWallMechanicsResearchInputsV1;
  pericardium: MainWireCommonPericardiumResearchInputsV1;
  coronaryDisease: MainWireCoronaryDiseaseResearchInputsV2;
  oxygenTransport: OxygenTransportInputsV1;
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3: MainWireIntegratedModelMechanismResearchInputsV3 =
  Object.freeze({
    inputId: MAIN_WIRE_INTEGRATED_MODEL_MECHANISM_RESEARCH_INPUTS_V3_ID,
    valveAreas: MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
    chamberMechanics: MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
    pericardium: MAIN_WIRE_COMMON_PERICARDIUM_DEFAULT_RESEARCH_INPUTS_V1,
    coronaryDisease: MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2,
    oxygenTransport: DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1,
  });

export function validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
  input: unknown,
): MainWireIntegratedModelMechanismResearchInputsV3 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("integrated V3 mechanism inputs must be a plain object");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("integrated V3 mechanism inputs must be a plain object");
  }
  const record = input as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [
    "inputId",
    "valveAreas",
    "chamberMechanics",
    "pericardium",
    "coronaryDisease",
    "oxygenTransport",
  ].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error("integrated V3 mechanism input fields must match exactly");
  }
  if (
    record.inputId !==
    MAIN_WIRE_INTEGRATED_MODEL_MECHANISM_RESEARCH_INPUTS_V3_ID
  ) {
    throw new Error("integrated V3 mechanism input identity is invalid");
  }
  return Object.freeze({
    inputId: MAIN_WIRE_INTEGRATED_MODEL_MECHANISM_RESEARCH_INPUTS_V3_ID,
    valveAreas: validateAndOwnMainWireFourValveAreaInputsV1(record.valveAreas),
    chamberMechanics: validateAndOwnMainWireFiveWallMechanicsResearchInputsV1(
      record.chamberMechanics,
    ),
    pericardium: validateAndOwnMainWireCommonPericardiumResearchInputsV1(
      record.pericardium,
    ),
    coronaryDisease: validateAndOwnMainWireCoronaryDiseaseResearchInputsV2(
      record.coronaryDisease,
    ),
    oxygenTransport: validateAndOwnOxygenTransportInputsV1(
      record.oxygenTransport,
    ),
  });
}

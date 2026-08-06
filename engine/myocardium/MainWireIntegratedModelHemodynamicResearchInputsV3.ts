import { defaultParams } from "@/engine/core/params";

export const MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3 =
  Object.freeze([
    "systemicResistance",
    "pulmonaryResistance",
    "venousTone",
    "arterialStiffness",
    "heartRateBpm",
    "totalBloodVolumeMl",
    "peepCmH2O",
  ] as const);

export type MainWireIntegratedModelHemodynamicResearchInputKeyV3 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3)[number];

export type MainWireIntegratedModelHemodynamicResearchInputsV3 = Readonly<
  Record<MainWireIntegratedModelHemodynamicResearchInputKeyV3, number>
>;

export type MainWireIntegratedModelHemodynamicResearchInputRangeV3 =
  Readonly<{
    minimum: number;
    maximum: number;
    step: number;
  }>;

/**
 * Deliberately narrow research ranges around the canonical construction.
 * They are executable input limits, not clinical reference intervals.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3 =
  Object.freeze({
    systemicResistance: Object.freeze({
      minimum: 0.75,
      maximum: 1.25,
      step: 0.01,
    }),
    pulmonaryResistance: Object.freeze({
      minimum: 0.45,
      maximum: 0.8,
      step: 0.005,
    }),
    venousTone: Object.freeze({
      minimum: 0.1,
      maximum: 0.2,
      step: 0.005,
    }),
    arterialStiffness: Object.freeze({
      minimum: 0.5,
      maximum: 1,
      step: 0.01,
    }),
    heartRateBpm: Object.freeze({
      minimum: 40,
      maximum: 100,
      step: 1,
    }),
    totalBloodVolumeMl: Object.freeze({
      minimum: 4_800,
      maximum: 7_000,
      step: 50,
    }),
    peepCmH2O: Object.freeze({
      minimum: 0,
      maximum: 20,
      step: 1,
    }),
  } satisfies Readonly<Record<
    MainWireIntegratedModelHemodynamicResearchInputKeyV3,
    MainWireIntegratedModelHemodynamicResearchInputRangeV3
  >>);

const DEFAULT_PARAMS_V3 = defaultParams();

export const MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3:
MainWireIntegratedModelHemodynamicResearchInputsV3 = Object.freeze({
  systemicResistance: DEFAULT_PARAMS_V3.systemicResistance,
  pulmonaryResistance: DEFAULT_PARAMS_V3.pulmonaryResistance,
  venousTone: DEFAULT_PARAMS_V3.venousTone,
  arterialStiffness: DEFAULT_PARAMS_V3.arterialStiffness,
  heartRateBpm: 60,
  totalBloodVolumeMl: 5_600,
  peepCmH2O: 0,
});

export function validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
  value: unknown,
): MainWireIntegratedModelHemodynamicResearchInputsV3 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("integrated V3 hemodynamic research inputs must be a plain object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("integrated V3 hemodynamic research inputs must be a plain object");
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [
    ...MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3,
  ].sort();
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(
      "integrated V3 hemodynamic research input fields must match exactly",
    );
  }

  const owned = {} as Record<
    MainWireIntegratedModelHemodynamicResearchInputKeyV3,
    number
  >;
  for (
    const key of MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3
  ) {
    const valueAtKey = record[key];
    const range = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[key];
    if (
      typeof valueAtKey !== "number"
      || !Number.isFinite(valueAtKey)
      || Object.is(valueAtKey, -0)
      || valueAtKey < range.minimum
      || valueAtKey > range.maximum
    ) {
      throw new Error(
        `integrated V3 ${key} must be finite within `
          + `[${range.minimum}, ${range.maximum}]`,
      );
    }
    owned[key] = valueAtKey;
  }
  return Object.freeze(owned) as
    MainWireIntegratedModelHemodynamicResearchInputsV3;
}

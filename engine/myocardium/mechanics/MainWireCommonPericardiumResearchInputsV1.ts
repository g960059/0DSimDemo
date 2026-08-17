import { createMainWireNormalAdultCommonPericardiumV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type { MainWireCommonPericardiumBindingV1 } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";

export const MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID =
  "main-wire-common-pericardium-research-inputs-v1" as const;

export const MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_KEYS_V1 =
  Object.freeze([
    "referenceCapacityScale",
    "pressureScale",
    "exponentialStiffnessScale",
    "prescribedFluidVolumeMl",
  ] as const);

export type MainWireCommonPericardiumResearchInputKeyV1 =
  (typeof MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_KEYS_V1)[number];

export type MainWireCommonPericardiumResearchInputsV1 = Readonly<{
  inputId: typeof MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID;
  referenceCapacityScale: number;
  pressureScale: number;
  exponentialStiffnessScale: number;
  prescribedFluidVolumeMl: number;
}>;

export const MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1 =
  Object.freeze({
    referenceCapacityScale: Object.freeze({
      minimum: 0.75,
      maximum: 1.25,
      step: 0.01,
    }),
    pressureScale: Object.freeze({
      minimum: 0.25,
      maximum: 4,
      step: 0.05,
    }),
    exponentialStiffnessScale: Object.freeze({
      minimum: 0.5,
      maximum: 2,
      step: 0.05,
    }),
    prescribedFluidVolumeMl: Object.freeze({
      minimum: 0,
      maximum: 500,
      step: 10,
    }),
  } satisfies Readonly<
    Record<
      MainWireCommonPericardiumResearchInputKeyV1,
      Readonly<{ minimum: number; maximum: number; step: number }>
    >
  >);

export const MAIN_WIRE_COMMON_PERICARDIUM_DEFAULT_RESEARCH_INPUTS_V1: MainWireCommonPericardiumResearchInputsV1 =
  Object.freeze({
    inputId: MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID,
    referenceCapacityScale: 1,
    pressureScale: 1,
    exponentialStiffnessScale: 1,
    prescribedFluidVolumeMl: 0,
  });

export function validateAndOwnMainWireCommonPericardiumResearchInputsV1(
  input: unknown,
): MainWireCommonPericardiumResearchInputsV1 {
  const record = exactRecordV1(input, [
    "inputId",
    ...MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_KEYS_V1,
  ]);
  if (record.inputId !== MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID) {
    throw new Error("pericardium research input identity is invalid");
  }
  const owned = {} as Record<
    MainWireCommonPericardiumResearchInputKeyV1,
    number
  >;
  for (const key of MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_KEYS_V1) {
    const value = record[key];
    const range = MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUT_RANGES_V1[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      Object.is(value, -0) ||
      value < range.minimum ||
      value > range.maximum
    ) {
      throw new RangeError(
        `pericardium ${key} must lie in [${range.minimum}, ${range.maximum}]`,
      );
    }
    owned[key] = value;
  }
  return Object.freeze({
    inputId: MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID,
    ...owned,
  });
}

export function createMainWireCommonPericardiumWithResearchInputsV1(
  input: MainWireCommonPericardiumResearchInputsV1,
): MainWireCommonPericardiumBindingV1 {
  const owned = validateAndOwnMainWireCommonPericardiumResearchInputsV1(input);
  const baseline = createMainWireNormalAdultCommonPericardiumV1();
  return Object.freeze({
    ...baseline,
    parameterSetId:
      `${MAIN_WIRE_COMMON_PERICARDIUM_RESEARCH_INPUTS_V1_ID}` +
      `-capacity-${owned.referenceCapacityScale}` +
      `-pressure-${owned.pressureScale}` +
      `-stiffness-${owned.exponentialStiffnessScale}` +
      `-fluid-${owned.prescribedFluidVolumeMl}`,
    parameters: Object.freeze({
      ...baseline.parameters,
      referenceHeartVolumeM3:
        baseline.parameters.referenceHeartVolumeM3 *
        owned.referenceCapacityScale,
      exponentialPressureScalePa:
        baseline.parameters.exponentialPressureScalePa * owned.pressureScale,
      exponentialStiffness:
        baseline.parameters.exponentialStiffness *
        owned.exponentialStiffnessScale,
    }),
    prescribedPericardialFluidVolumeM3: owned.prescribedFluidVolumeMl * 1e-6,
  });
}

function exactRecordV1(
  input: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("pericardium research inputs must be a plain object");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("pericardium research inputs must be a plain object");
  }
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error("pericardium research input fields must match exactly");
  }
  return input as Record<string, unknown>;
}

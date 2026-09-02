import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  type MainWireFiveWallIdV1,
  type MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";

export const MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_INPUT_V1_ID =
  "main-wire-five-wall-mechanics-research-input-v1" as const;

export const MAIN_WIRE_FIVE_WALL_MECHANICS_SCALE_KINDS_V1 = Object.freeze([
  "activeTensionScaleByWall",
  "passiveStiffnessScaleByWall",
  "calciumDecayTimeScaleByWall",
] as const);

export type MainWireFiveWallMechanicsScaleKindV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICS_SCALE_KINDS_V1)[number];

export type MainWireFiveWallMechanicsResearchInputsV1 = Readonly<{
  inputId: typeof MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_INPUT_V1_ID;
  /** Multiplies Land Tref independently for each material wall. */
  activeTensionScaleByWall: MainWireFiveWallRecordV1<number>;
  /** Scales equilibrium passive stress/energy/tangent and SLS modulus. */
  passiveStiffnessScaleByWall: MainWireFiveWallRecordV1<number>;
  /** Scales the prescribed calcium-drive decay time; not generic lusitropy. */
  calciumDecayTimeScaleByWall: MainWireFiveWallRecordV1<number>;
}>;

export const MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1 =
  Object.freeze({
    activeTensionScaleByWall: Object.freeze({
      minimum: 0.75,
      maximum: 1.33,
      step: 0.01,
    }),
    passiveStiffnessScaleByWall: Object.freeze({
      minimum: 0.75,
      maximum: 1.33,
      step: 0.01,
    }),
    calciumDecayTimeScaleByWall: Object.freeze({
      minimum: 0.75,
      maximum: 1.5,
      step: 0.01,
    }),
  } satisfies Readonly<
    Record<
      MainWireFiveWallMechanicsScaleKindV1,
      Readonly<{ minimum: number; maximum: number; step: number }>
    >
  >);

const UNIT_WALL_SCALES_V1 = wallRecordV1(() => 1);

export const MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1: MainWireFiveWallMechanicsResearchInputsV1 =
  Object.freeze({
    inputId: MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_INPUT_V1_ID,
    activeTensionScaleByWall: UNIT_WALL_SCALES_V1,
    passiveStiffnessScaleByWall: UNIT_WALL_SCALES_V1,
    calciumDecayTimeScaleByWall: UNIT_WALL_SCALES_V1,
  });

export function validateAndOwnMainWireFiveWallMechanicsResearchInputsV1(
  input: unknown,
): MainWireFiveWallMechanicsResearchInputsV1 {
  const record = exactRecordV1(
    input,
    ["inputId", ...MAIN_WIRE_FIVE_WALL_MECHANICS_SCALE_KINDS_V1],
    "five-wall mechanics research inputs",
  );
  if (record.inputId !== MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_INPUT_V1_ID) {
    throw new Error("five-wall mechanics research input identity is invalid");
  }
  const ownScales = (
    kind: MainWireFiveWallMechanicsScaleKindV1,
  ): MainWireFiveWallRecordV1<number> => {
    const values = exactRecordV1(
      record[kind],
      MAIN_WIRE_FIVE_WALL_IDS_V1,
      `five-wall mechanics ${kind}`,
    );
    const range = MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1[kind];
    return wallRecordV1((wallId) => {
      const value = values[wallId];
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        Object.is(value, -0) ||
        value < range.minimum ||
        value > range.maximum
      ) {
        throw new Error(
          `five-wall mechanics ${kind}.${wallId} must be finite within ` +
            `[${range.minimum}, ${range.maximum}]`,
        );
      }
      return value;
    });
  };
  return Object.freeze({
    inputId: MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_INPUT_V1_ID,
    activeTensionScaleByWall: ownScales("activeTensionScaleByWall"),
    passiveStiffnessScaleByWall: ownScales("passiveStiffnessScaleByWall"),
    calciumDecayTimeScaleByWall: ownScales("calciumDecayTimeScaleByWall"),
  });
}

export function withCommonVentricularActiveTensionScaleV1(
  input: MainWireFiveWallMechanicsResearchInputsV1,
  scale: number,
): MainWireFiveWallMechanicsResearchInputsV1 {
  return validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
    ...input,
    activeTensionScaleByWall: {
      ...input.activeTensionScaleByWall,
      LVFW: scale,
      SEP: scale,
      RVFW: scale,
    },
  });
}

export function withCommonVentricularPassiveStiffnessScaleV1(
  input: MainWireFiveWallMechanicsResearchInputsV1,
  scale: number,
): MainWireFiveWallMechanicsResearchInputsV1 {
  return validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
    ...input,
    passiveStiffnessScaleByWall: {
      ...input.passiveStiffnessScaleByWall,
      LVFW: scale,
      SEP: scale,
      RVFW: scale,
    },
  });
}

function wallRecordV1<T>(
  build: (wallId: MainWireFiveWallIdV1) => T,
): MainWireFiveWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_IDS_V1.map((wallId) => [wallId, build(wallId)]),
    ),
  ) as MainWireFiveWallRecordV1<T>;
}

function exactRecordV1(
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

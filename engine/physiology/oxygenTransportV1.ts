export const OXYGEN_TRANSPORT_V1_ID =
  "whole-body-beat-mean-oxygen-transport-v1" as const;
export const OXYGEN_TRANSPORT_INPUT_V1_ID =
  "whole-body-beat-mean-oxygen-transport-input-v1" as const;

const HUFNER_ML_O2_PER_G_HB = 1.34;
const DISSOLVED_O2_ML_PER_DL_PER_MMHG = 0.0031;
const OXYHEMOGLOBIN_P50_MMHG = 26.8;
const OXYHEMOGLOBIN_HILL_EXPONENT = 2.7;
const WATER_VAPOR_PRESSURE_AT_37C_MMHG = 47;

export type OxygenTransportInputsV1 = Readonly<{
  inputId: typeof OXYGEN_TRANSPORT_INPUT_V1_ID;
  hemoglobinGPerDl: number;
  inspiredOxygenFraction01: number;
  arterialCarbonDioxidePressureMmHg: number;
  respiratoryExchangeRatio: number;
  barometricPressureMmHg: number;
  trueShuntFraction01: number;
  targetOxygenConsumptionMlPerMin: number;
}>;

export const OXYGEN_TRANSPORT_INPUT_RANGES_V1 = Object.freeze({
  hemoglobinGPerDl: Object.freeze({ minimum: 5, maximum: 20, step: 0.1 }),
  inspiredOxygenFraction01: Object.freeze({
    minimum: 0.21,
    maximum: 1,
    step: 0.01,
  }),
  arterialCarbonDioxidePressureMmHg: Object.freeze({
    minimum: 20,
    maximum: 80,
    step: 1,
  }),
  respiratoryExchangeRatio: Object.freeze({
    minimum: 0.7,
    maximum: 1,
    step: 0.01,
  }),
  barometricPressureMmHg: Object.freeze({
    minimum: 500,
    maximum: 800,
    step: 1,
  }),
  trueShuntFraction01: Object.freeze({
    minimum: 0,
    maximum: 0.5,
    step: 0.01,
  }),
  targetOxygenConsumptionMlPerMin: Object.freeze({
    minimum: 100,
    maximum: 600,
    step: 5,
  }),
});

export const DEFAULT_OXYGEN_TRANSPORT_INPUTS_V1: OxygenTransportInputsV1 =
  Object.freeze({
    inputId: OXYGEN_TRANSPORT_INPUT_V1_ID,
    hemoglobinGPerDl: 15,
    inspiredOxygenFraction01: 0.21,
    arterialCarbonDioxidePressureMmHg: 40,
    respiratoryExchangeRatio: 0.8,
    barometricPressureMmHg: 760,
    trueShuntFraction01: 0.02,
    targetOxygenConsumptionMlPerMin: 250,
  });

export type OxygenTransportEvaluationV1 = Readonly<{
  modelId: typeof OXYGEN_TRANSPORT_V1_ID;
  systemicFlowLPerMin: number;
  alveolarOxygenPressureMmHg: number;
  endCapillaryOxygenPressureMmHg: number;
  endCapillaryOxygenSaturation01: number;
  endCapillaryOxygenContentMlPerDl: number;
  arterialOxygenPressureMmHg: number | null;
  arterialOxygenSaturation01: number | null;
  arterialOxygenContentMlPerDl: number | null;
  alveolarArterialOxygenGradientMmHg: number | null;
  requiredMixedVenousOxygenPressureMmHg: number | null;
  requiredMixedVenousOxygenSaturation01: number | null;
  requiredMixedVenousOxygenContentMlPerDl: number | null;
  oxygenDeliveryMlPerMin: number | null;
  targetOxygenConsumptionMlPerMin: number;
  requiredOxygenExtractionRatio01: number | null;
  oxygenDeliveryToConsumptionRatio: number | null;
  fickClosureStatus:
    | "feasible-within-content-domain"
    | "requires-nonpositive-flow"
    | "requires-negative-arterial-content"
    | "requires-negative-venous-content";
  assumptions: readonly string[];
}>;

export function evaluateOxygenTransportV1(
  requestedInputs: OxygenTransportInputsV1,
  systemicFlowLPerMin: number,
): OxygenTransportEvaluationV1 {
  const inputs = validateAndOwnOxygenTransportInputsV1(requestedInputs);
  finiteV1(systemicFlowLPerMin, "systemicFlowLPerMin");
  const alveolarOxygenPressureMmHg = alveolarOxygenPressureMmHgV1(
    inputs.inspiredOxygenFraction01,
    inputs.barometricPressureMmHg,
    inputs.arterialCarbonDioxidePressureMmHg,
    inputs.respiratoryExchangeRatio,
  );
  const endCapillaryOxygenPressureMmHg = alveolarOxygenPressureMmHg;
  const endCapillaryOxygenSaturation01 = oxygenSaturationAtPo2V1(
    endCapillaryOxygenPressureMmHg,
  );
  const endCapillaryOxygenContentMlPerDl = oxygenContentMlPerDlV1(
    inputs.hemoglobinGPerDl,
    endCapillaryOxygenSaturation01,
    endCapillaryOxygenPressureMmHg,
  );
  const unavailable = (
    fickClosureStatus: OxygenTransportEvaluationV1["fickClosureStatus"],
  ): OxygenTransportEvaluationV1 =>
    Object.freeze({
      modelId: OXYGEN_TRANSPORT_V1_ID,
      systemicFlowLPerMin,
      alveolarOxygenPressureMmHg,
      endCapillaryOxygenPressureMmHg,
      endCapillaryOxygenSaturation01,
      endCapillaryOxygenContentMlPerDl,
      arterialOxygenPressureMmHg: null,
      arterialOxygenSaturation01: null,
      arterialOxygenContentMlPerDl: null,
      alveolarArterialOxygenGradientMmHg: null,
      requiredMixedVenousOxygenPressureMmHg: null,
      requiredMixedVenousOxygenSaturation01: null,
      requiredMixedVenousOxygenContentMlPerDl: null,
      oxygenDeliveryMlPerMin: null,
      targetOxygenConsumptionMlPerMin: inputs.targetOxygenConsumptionMlPerMin,
      requiredOxygenExtractionRatio01: null,
      oxygenDeliveryToConsumptionRatio: null,
      fickClosureStatus,
      assumptions: OXYGEN_TRANSPORT_ASSUMPTIONS_V1,
    });
  if (!(systemicFlowLPerMin > 0)) {
    return unavailable("requires-nonpositive-flow");
  }

  const arteriovenousContentDifferenceMlPerDl =
    inputs.targetOxygenConsumptionMlPerMin / (systemicFlowLPerMin * 10);
  const unshuntedFraction = 1 - inputs.trueShuntFraction01;
  const arterialOxygenContentMlPerDl =
    endCapillaryOxygenContentMlPerDl -
    (inputs.trueShuntFraction01 / unshuntedFraction) *
      arteriovenousContentDifferenceMlPerDl;
  if (!(arterialOxygenContentMlPerDl > 0)) {
    return unavailable("requires-negative-arterial-content");
  }
  const requiredMixedVenousOxygenContentMlPerDl =
    arterialOxygenContentMlPerDl - arteriovenousContentDifferenceMlPerDl;
  if (!(requiredMixedVenousOxygenContentMlPerDl >= 0)) {
    return unavailable("requires-negative-venous-content");
  }

  const arterialOxygenPressureMmHg = oxygenPo2FromContentV1(
    arterialOxygenContentMlPerDl,
    inputs.hemoglobinGPerDl,
  );
  const arterialOxygenSaturation01 = oxygenSaturationAtPo2V1(
    arterialOxygenPressureMmHg,
  );
  const requiredMixedVenousOxygenPressureMmHg = oxygenPo2FromContentV1(
    requiredMixedVenousOxygenContentMlPerDl,
    inputs.hemoglobinGPerDl,
  );
  const requiredMixedVenousOxygenSaturation01 = oxygenSaturationAtPo2V1(
    requiredMixedVenousOxygenPressureMmHg,
  );
  const oxygenDeliveryMlPerMin =
    systemicFlowLPerMin * 10 * arterialOxygenContentMlPerDl;
  return Object.freeze({
    modelId: OXYGEN_TRANSPORT_V1_ID,
    systemicFlowLPerMin,
    alveolarOxygenPressureMmHg,
    endCapillaryOxygenPressureMmHg,
    endCapillaryOxygenSaturation01,
    endCapillaryOxygenContentMlPerDl,
    arterialOxygenPressureMmHg,
    arterialOxygenSaturation01,
    arterialOxygenContentMlPerDl,
    alveolarArterialOxygenGradientMmHg:
      alveolarOxygenPressureMmHg - arterialOxygenPressureMmHg,
    requiredMixedVenousOxygenPressureMmHg,
    requiredMixedVenousOxygenSaturation01,
    requiredMixedVenousOxygenContentMlPerDl,
    oxygenDeliveryMlPerMin,
    targetOxygenConsumptionMlPerMin: inputs.targetOxygenConsumptionMlPerMin,
    requiredOxygenExtractionRatio01:
      inputs.targetOxygenConsumptionMlPerMin / oxygenDeliveryMlPerMin,
    oxygenDeliveryToConsumptionRatio:
      oxygenDeliveryMlPerMin / inputs.targetOxygenConsumptionMlPerMin,
    fickClosureStatus: "feasible-within-content-domain" as const,
    assumptions: OXYGEN_TRANSPORT_ASSUMPTIONS_V1,
  });
}

export const OXYGEN_TRANSPORT_ASSUMPTIONS_V1 = Object.freeze([
  "beat-mean well-mixed whole-body oxygen-content balance",
  "systemic tissue flow is the flow basis",
  "alveolar gas equation uses fixed inspired and arterial CO2 boundaries",
  "true shunt mixes end-capillary and required venous blood in content space",
  "required venous content is solved from target VO2 by steady Fick closure",
  "content and PO2 use a fixed adult Hill dissociation curve",
  "no organ partition, diffusion limit, extraction ceiling, oxygen debt, or lactate state",
] as const);

export function validateAndOwnOxygenTransportInputsV1(
  input: unknown,
): OxygenTransportInputsV1 {
  const record = exactRecordV1(
    input,
    [
      "inputId",
      "hemoglobinGPerDl",
      "inspiredOxygenFraction01",
      "arterialCarbonDioxidePressureMmHg",
      "respiratoryExchangeRatio",
      "barometricPressureMmHg",
      "trueShuntFraction01",
      "targetOxygenConsumptionMlPerMin",
    ],
    "oxygen transport inputs",
  );
  if (record.inputId !== OXYGEN_TRANSPORT_INPUT_V1_ID) {
    throw new Error("oxygen transport input identity is invalid");
  }
  const own = (key: keyof typeof OXYGEN_TRANSPORT_INPUT_RANGES_V1): number => {
    const range = OXYGEN_TRANSPORT_INPUT_RANGES_V1[key];
    const value = record[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      Object.is(value, -0) ||
      value < range.minimum ||
      value > range.maximum
    ) {
      throw new Error(
        `oxygen transport ${key} must be finite within ` +
          `[${range.minimum}, ${range.maximum}]`,
      );
    }
    return value;
  };
  const owned = Object.freeze({
    inputId: OXYGEN_TRANSPORT_INPUT_V1_ID,
    hemoglobinGPerDl: own("hemoglobinGPerDl"),
    inspiredOxygenFraction01: own("inspiredOxygenFraction01"),
    arterialCarbonDioxidePressureMmHg: own("arterialCarbonDioxidePressureMmHg"),
    respiratoryExchangeRatio: own("respiratoryExchangeRatio"),
    barometricPressureMmHg: own("barometricPressureMmHg"),
    trueShuntFraction01: own("trueShuntFraction01"),
    targetOxygenConsumptionMlPerMin: own("targetOxygenConsumptionMlPerMin"),
  });
  const minimumDryInspiredPressure =
    owned.inspiredOxygenFraction01 *
    (owned.barometricPressureMmHg - WATER_VAPOR_PRESSURE_AT_37C_MMHG);
  if (
    !(
      minimumDryInspiredPressure >
      owned.arterialCarbonDioxidePressureMmHg / owned.respiratoryExchangeRatio
    )
  ) {
    throw new Error("oxygen transport inputs imply nonpositive alveolar PO2");
  }
  return owned;
}

export function alveolarOxygenPressureMmHgV1(
  inspiredOxygenFraction01: number,
  barometricPressureMmHg: number,
  arterialCarbonDioxidePressureMmHg: number,
  respiratoryExchangeRatio: number,
): number {
  fractionV1(inspiredOxygenFraction01, "inspiredOxygenFraction01");
  positiveFiniteV1(barometricPressureMmHg, "barometricPressureMmHg");
  positiveFiniteV1(
    arterialCarbonDioxidePressureMmHg,
    "arterialCarbonDioxidePressureMmHg",
  );
  positiveFiniteV1(respiratoryExchangeRatio, "respiratoryExchangeRatio");
  const pressure =
    inspiredOxygenFraction01 *
      (barometricPressureMmHg - WATER_VAPOR_PRESSURE_AT_37C_MMHG) -
    arterialCarbonDioxidePressureMmHg / respiratoryExchangeRatio;
  return positiveFiniteV1(pressure, "alveolarOxygenPressureMmHg");
}

export function oxygenContentMlPerDlV1(
  hemoglobinGPerDl: number,
  saturation01: number,
  po2MmHg: number,
): number {
  positiveFiniteV1(hemoglobinGPerDl, "hemoglobinGPerDl");
  fractionV1(saturation01, "saturation01");
  nonnegativeFiniteV1(po2MmHg, "po2MmHg");
  return (
    HUFNER_ML_O2_PER_G_HB * hemoglobinGPerDl * saturation01 +
    DISSOLVED_O2_ML_PER_DL_PER_MMHG * po2MmHg
  );
}

export function oxygenSaturationAtPo2V1(po2MmHg: number): number {
  const po2 = nonnegativeFiniteV1(po2MmHg, "po2MmHg");
  if (po2 === 0) return 0;
  const power = po2 ** OXYHEMOGLOBIN_HILL_EXPONENT;
  return (
    power / (OXYHEMOGLOBIN_P50_MMHG ** OXYHEMOGLOBIN_HILL_EXPONENT + power)
  );
}

export function oxygenPo2FromSaturationV1(saturation01: number): number {
  const saturation = fractionV1(saturation01, "saturation01");
  if (saturation <= 0) return 0;
  if (saturation >= 1) return 2_000;
  return (
    OXYHEMOGLOBIN_P50_MMHG *
    (saturation / (1 - saturation)) ** (1 / OXYHEMOGLOBIN_HILL_EXPONENT)
  );
}

export function oxygenPo2FromContentV1(
  contentMlPerDl: number,
  hemoglobinGPerDl: number,
): number {
  nonnegativeFiniteV1(contentMlPerDl, "contentMlPerDl");
  positiveFiniteV1(hemoglobinGPerDl, "hemoglobinGPerDl");
  let lower = 0;
  let upper = 2_000;
  while (
    oxygenContentMlPerDlV1(
      hemoglobinGPerDl,
      oxygenSaturationAtPo2V1(upper),
      upper,
    ) < contentMlPerDl &&
    upper < 1_000_000
  )
    upper *= 2;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    const midpointContent = oxygenContentMlPerDlV1(
      hemoglobinGPerDl,
      oxygenSaturationAtPo2V1(midpoint),
      midpoint,
    );
    if (midpointContent < contentMlPerDl) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
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

function positiveFiniteV1(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function finiteV1(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function nonnegativeFiniteV1(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function fractionV1(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be within [0, 1]`);
  }
  return value;
}

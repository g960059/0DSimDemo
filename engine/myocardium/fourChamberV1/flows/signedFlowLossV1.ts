export type SignedFlowLossParametersV1 = {
  readonly inertancePaSec2PerM3: number;
  readonly linearResistancePaSecPerM3: number;
  readonly quadraticResistancePaSec2PerM6: number;
  readonly flowSmoothingM3PerSec: number;
};

export type SignedFlowMomentumOutputV1 = {
  readonly pressureGradientPa: number;
  readonly flowM3PerSec: number;
  readonly smoothAbsoluteFlowM3PerSec: number;
  readonly signedLossPressurePa: number;
  readonly dissipationW: number;
  readonly flowAccelerationM3PerSec2: number;
  readonly lossDerivativePaSecPerM3: number;
  readonly kineticEnergyJ: number;
};

export function evaluateSignedFlowMomentumV1(
  parameters: SignedFlowLossParametersV1,
  pressureGradientPa: number,
  flowM3PerSec: number,
): SignedFlowMomentumOutputV1 {
  assertExactKeys(parameters, [
    "inertancePaSec2PerM3",
    "linearResistancePaSecPerM3",
    "quadraticResistancePaSec2PerM6",
    "flowSmoothingM3PerSec",
  ], "parameters");
  const inertance = requirePositiveFinite(parameters.inertancePaSec2PerM3, "inertancePaSec2PerM3");
  const linearResistance = requireNonNegativeFinite(
    parameters.linearResistancePaSecPerM3,
    "linearResistancePaSecPerM3",
  );
  const quadraticResistance = requireNonNegativeFinite(
    parameters.quadraticResistancePaSec2PerM6,
    "quadraticResistancePaSec2PerM6",
  );
  const epsilonFlow = requirePositiveFinite(parameters.flowSmoothingM3PerSec, "flowSmoothingM3PerSec");
  const pressureGradient = requireFinite(pressureGradientPa, "pressureGradientPa");
  const flow = requireFinite(flowM3PerSec, "flowM3PerSec");
  const smoothAbsoluteFlowM3PerSec = Math.hypot(flow, epsilonFlow);
  const nonlinearFlow = flow * smoothAbsoluteFlowM3PerSec;
  const signedLossPressurePa = linearResistance * flow + quadraticResistance * nonlinearFlow;
  const dissipationW = flow * signedLossPressurePa;
  const flowAccelerationM3PerSec2 = (pressureGradient - signedLossPressurePa) / inertance;
  const lossDerivativePaSecPerM3 = linearResistance + quadraticResistance * (
    smoothAbsoluteFlowM3PerSec + flow * flow / smoothAbsoluteFlowM3PerSec
  );
  const kineticEnergyJ = 0.5 * inertance * flow * flow;

  for (const [field, value] of Object.entries({
    smoothAbsoluteFlowM3PerSec,
    signedLossPressurePa,
    dissipationW,
    flowAccelerationM3PerSec2,
    lossDerivativePaSecPerM3,
    kineticEnergyJ,
  })) requireDerivedFinite(value, field);
  if (dissipationW < 0) throw new Error("signed flow loss must not generate energy");

  return Object.freeze({
    pressureGradientPa: pressureGradient,
    flowM3PerSec: flow,
    smoothAbsoluteFlowM3PerSec,
    signedLossPressurePa,
    dissipationW,
    flowAccelerationM3PerSec2,
    lossDerivativePaSecPerM3,
    kineticEnergyJ,
  });
}

export type ValveLossParametersV1 = {
  readonly openAreaM2: number;
  readonly physiologicalRegurgitantAreaM2: number;
  readonly numericalReverseAreaM2: number;
  readonly pressureGateWidthPa: number;
  readonly bloodDynamicViscosityPaSec: number;
  readonly bloodDensityKgPerM3: number;
  readonly viscousEffectiveLengthM: number;
  readonly inertialEffectiveLengthM: number;
  readonly inertialReferenceAreaM2: number;
  readonly flowSmoothingM3PerSec: number;
};

export type ValveLossCoefficientsV1 = {
  readonly pressureGate: number;
  readonly pressureGateDerivativePerPa: number;
  readonly reverseLossAreaM2: number;
  readonly inverseSquareLossPerM4: number;
  readonly inverseSquareLossDerivativePerM4Pa: number;
  readonly diagnosticHydraulicLossAreaM2: number;
  readonly physiologicalEroaLeftCensored: boolean;
  readonly linearResistancePaSecPerM3: number;
  readonly quadraticResistancePaSec2PerM6: number;
  readonly inertancePaSec2PerM3: number;
  readonly flowSmoothingM3PerSec: number;
};

export function evaluateValveLossCoefficientsV1(
  parameters: ValveLossParametersV1,
  pressureGradientPa: number,
): ValveLossCoefficientsV1 {
  assertExactKeys(parameters, [
    "openAreaM2",
    "physiologicalRegurgitantAreaM2",
    "numericalReverseAreaM2",
    "pressureGateWidthPa",
    "bloodDynamicViscosityPaSec",
    "bloodDensityKgPerM3",
    "viscousEffectiveLengthM",
    "inertialEffectiveLengthM",
    "inertialReferenceAreaM2",
    "flowSmoothingM3PerSec",
  ], "parameters");
  const openArea = requirePositiveFinite(parameters.openAreaM2, "openAreaM2");
  const physiologicalEroa = requireNonNegativeFinite(
    parameters.physiologicalRegurgitantAreaM2,
    "physiologicalRegurgitantAreaM2",
  );
  const numericalArea = requirePositiveFinite(parameters.numericalReverseAreaM2, "numericalReverseAreaM2");
  const pressureWidth = requirePositiveFinite(parameters.pressureGateWidthPa, "pressureGateWidthPa");
  const viscosity = requirePositiveFinite(parameters.bloodDynamicViscosityPaSec, "bloodDynamicViscosityPaSec");
  const density = requirePositiveFinite(parameters.bloodDensityKgPerM3, "bloodDensityKgPerM3");
  const viscousLength = requirePositiveFinite(parameters.viscousEffectiveLengthM, "viscousEffectiveLengthM");
  const inertialLength = requirePositiveFinite(parameters.inertialEffectiveLengthM, "inertialEffectiveLengthM");
  const inertialArea = requirePositiveFinite(parameters.inertialReferenceAreaM2, "inertialReferenceAreaM2");
  const flowSmoothing = requirePositiveFinite(parameters.flowSmoothingM3PerSec, "flowSmoothingM3PerSec");
  const pressureGradient = requireFinite(pressureGradientPa, "pressureGradientPa");

  const scaledPressure = pressureGradient / pressureWidth;
  const tanhPressure = Math.tanh(scaledPressure);
  const pressureGate = 0.5 * (1 + tanhPressure);
  const pressureGateDerivativePerPa = 0.5 * (1 - tanhPressure * tanhPressure) / pressureWidth;
  const reverseLossAreaM2 = Math.hypot(physiologicalEroa, numericalArea);
  const openInverseSquare = 1 / (openArea * openArea);
  const reverseInverseSquare = 1 / (reverseLossAreaM2 * reverseLossAreaM2);
  const inverseSquareLossPerM4 = pressureGate * openInverseSquare
    + (1 - pressureGate) * reverseInverseSquare;
  const inverseSquareLossDerivativePerM4Pa = pressureGateDerivativePerPa
    * (openInverseSquare - reverseInverseSquare);
  const diagnosticHydraulicLossAreaM2 = 1 / Math.sqrt(inverseSquareLossPerM4);
  const linearResistancePaSecPerM3 = 8 * Math.PI * viscosity * viscousLength * inverseSquareLossPerM4;
  const quadraticResistancePaSec2PerM6 = 0.5 * density * inverseSquareLossPerM4;
  const inertancePaSec2PerM3 = density * inertialLength / inertialArea;

  for (const [field, value] of Object.entries({
    pressureGate,
    pressureGateDerivativePerPa,
    reverseLossAreaM2,
    inverseSquareLossPerM4,
    inverseSquareLossDerivativePerM4Pa,
    diagnosticHydraulicLossAreaM2,
    linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6,
    inertancePaSec2PerM3,
  })) requireDerivedFinite(value, field);

  return Object.freeze({
    pressureGate,
    pressureGateDerivativePerPa,
    reverseLossAreaM2,
    inverseSquareLossPerM4,
    inverseSquareLossDerivativePerM4Pa,
    diagnosticHydraulicLossAreaM2,
    physiologicalEroaLeftCensored: physiologicalEroa < 10 * numericalArea,
    linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6,
    inertancePaSec2PerM3,
    flowSmoothingM3PerSec: flowSmoothing,
  });
}

export type ValveMomentumOutputV1 = ValveLossCoefficientsV1 & SignedFlowMomentumOutputV1;

export function evaluateValveMomentumV1(
  parameters: ValveLossParametersV1,
  pressureGradientPa: number,
  flowM3PerSec: number,
): ValveMomentumOutputV1 {
  const coefficients = evaluateValveLossCoefficientsV1(parameters, pressureGradientPa);
  const momentum = evaluateSignedFlowMomentumV1({
    inertancePaSec2PerM3: coefficients.inertancePaSec2PerM3,
    linearResistancePaSecPerM3: coefficients.linearResistancePaSecPerM3,
    quadraticResistancePaSec2PerM6: coefficients.quadraticResistancePaSec2PerM6,
    flowSmoothingM3PerSec: coefficients.flowSmoothingM3PerSec,
  }, pressureGradientPa, flowM3PerSec);
  return Object.freeze({ ...coefficients, ...momentum });
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be non-negative and finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
  return value;
}

function requireDerivedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
}

function assertExactKeys(value: object, expected: readonly string[], field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const names = keys as string[];
  const expectedSet = new Set(expected);
  const unknown = names.filter((key) => !expectedSet.has(key));
  const missing = expected.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
}

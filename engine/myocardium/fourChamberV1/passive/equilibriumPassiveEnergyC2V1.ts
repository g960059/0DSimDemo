import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID =
  "equilibrium-passive-c2-logstrain-v1" as const;

export const EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1 = 1e-3 as const;
export const EQUILIBRIUM_PASSIVE_WIDTH_SENSITIVITY_POLICY_V1 = Object.freeze({
  policyId: "equilibrium-passive-transition-width-sensitivity-v1",
  allowedFactors: Object.freeze([0.5, 1, 2] as const),
  diagnosticOnly: true,
  fitAllowed: false,
} as const);
export type EquilibriumPassiveWidthSensitivityFactorV1 =
  (typeof EQUILIBRIUM_PASSIVE_WIDTH_SENSITIVITY_POLICY_V1.allowedFactors)[number];

export type EffectiveOneFiberPassivePriorV1 = {
  readonly priorId: string;
  readonly status: "candidate-prior";
  readonly evidenceClass: "project-synthetic-implementation-verification";
  readonly parameterMeaning: "effective-one-fiber-wall";
  readonly tissueClass: "atrial" | "ventricular";
  readonly APa: number;
  readonly B: number;
  readonly KCompEffPa: number;
  readonly transitionHalfWidthStrain: number;
  readonly supportedFiberLogStrainRange: readonly [number, number];
  readonly stressClippingAllowed: false;
  readonly chamberPressureGainAllowed: false;
  readonly units: {
    readonly A: "Pa";
    readonly B: "1";
    readonly KCompEff: "Pa";
    readonly transitionHalfWidthStrain: "1";
    readonly fiberLogStrain: "1";
  };
};

export const PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1:
  EffectiveOneFiberPassivePriorV1 = deepFreezePassivePrior({
    priorId: "phase-a1-ventricular-project-synthetic-passive-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    parameterMeaning: "effective-one-fiber-wall",
    tissueClass: "ventricular",
    APa: 1_200,
    B: 18,
    KCompEffPa: 1_200,
    transitionHalfWidthStrain: EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1,
    supportedFiberLogStrainRange: [-0.5, 0.5],
    stressClippingAllowed: false,
    chamberPressureGainAllowed: false,
    units: {
      A: "Pa",
      B: "1",
      KCompEff: "Pa",
      transitionHalfWidthStrain: "1",
      fiberLogStrain: "1",
    },
  });

export const PHASE_A1_ATRIAL_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1:
  EffectiveOneFiberPassivePriorV1 = deepFreezePassivePrior({
    priorId: "phase-a1-atrial-project-synthetic-passive-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    parameterMeaning: "effective-one-fiber-wall",
    tissueClass: "atrial",
    APa: 700,
    B: 14,
    KCompEffPa: 700,
    transitionHalfWidthStrain: EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1,
    supportedFiberLogStrainRange: [-0.5, 0.5],
    stressClippingAllowed: false,
    chamberPressureGainAllowed: false,
    units: {
      A: "Pa",
      B: "1",
      KCompEff: "Pa",
      transitionHalfWidthStrain: "1",
      fiberLogStrain: "1",
    },
  });

type NormalizedQuinticCoefficients = readonly [number, number, number, number, number, number];

export type TransitionConvexityAuditV1 = {
  readonly minimumTangentPa: number;
  readonly normalizedCoordinateAtMinimum: number;
  readonly evaluatedCriticalCoordinates: readonly number[];
};

const COMPILED_PASSIVE_PRIOR_BRAND: unique symbol = Symbol("CompiledPassivePriorV1");
const COMPILED_PASSIVE_PRIORS = new WeakSet<object>();

export type CompiledEquilibriumPassivePriorV1 = {
  readonly [COMPILED_PASSIVE_PRIOR_BRAND]: true;
  readonly modelId: typeof EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID;
  readonly prior: EffectiveOneFiberPassivePriorV1;
  readonly centralTangentPa: number;
  readonly compressionTransitionCoefficientsNormalized: NormalizedQuinticCoefficients;
  readonly tensionTransitionCoefficientsNormalized: NormalizedQuinticCoefficients;
  readonly compressionConvexity: TransitionConvexityAuditV1;
  readonly tensionConvexity: TransitionConvexityAuditV1;
  readonly coefficientCoordinateSystem: "normalized-unit-interval";
  readonly parameterizationUse: "canonical-fixed-width" | "diagnostic-width-sensitivity";
  /** Width-policy gate only; whole-model release eligibility is owned elsewhere. */
  readonly canonicalWidthPolicyEligible: boolean;
};

export type EquilibriumPassiveRegionV1 =
  | "compression"
  | "compression-transition"
  | "tension-transition"
  | "tension";

export type EquilibriumPassiveEvaluationV1 = {
  readonly modelId: typeof EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID;
  readonly priorId: string;
  readonly fiberLogStrain: number;
  readonly region: EquilibriumPassiveRegionV1;
  readonly storedEnergyDensityJPerM3: number;
  readonly equilibriumKirchhoffStressPa: number;
  readonly dStressDFiberLogStrainPa: number;
  readonly stressSource: "energy-first-derivative";
  readonly tangentSource: "energy-second-derivative";
  readonly stressClipped: false;
};

export function compileEquilibriumPassivePriorV1(
  source: EffectiveOneFiberPassivePriorV1,
): CompiledEquilibriumPassivePriorV1 {
  return compileEquilibriumPassivePriorInternalV1(source, "canonical-fixed-width");
}

/** Uses the identical normalized-quintic implementation for the required width audit. */
export function compileEquilibriumPassiveWidthSensitivityV1(
  canonicalSource: EffectiveOneFiberPassivePriorV1,
  factor: EquilibriumPassiveWidthSensitivityFactorV1,
): CompiledEquilibriumPassivePriorV1 {
  assertPassivePrior(canonicalSource, EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1);
  if (!EQUILIBRIUM_PASSIVE_WIDTH_SENSITIVITY_POLICY_V1.allowedFactors.includes(factor)) {
    throw new Error("Passive width sensitivity factor must be one of 0.5, 1, or 2");
  }
  const diagnosticSource: EffectiveOneFiberPassivePriorV1 = {
    ...canonicalSource,
    priorId: `${canonicalSource.priorId}:delta-factor-${factor}:diagnostic-only`,
    transitionHalfWidthStrain:
      EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1 * factor,
  };
  return compileEquilibriumPassivePriorInternalV1(
    diagnosticSource,
    "diagnostic-width-sensitivity",
  );
}

function compileEquilibriumPassivePriorInternalV1(
  source: EffectiveOneFiberPassivePriorV1,
  parameterizationUse: CompiledEquilibriumPassivePriorV1["parameterizationUse"],
): CompiledEquilibriumPassivePriorV1 {
  const expectedWidth = parameterizationUse === "canonical-fixed-width"
    ? EQUILIBRIUM_PASSIVE_TRANSITION_HALF_WIDTH_STRAIN_V1
    : source.transitionHalfWidthStrain;
  assertPassivePrior(source, expectedWidth);
  const prior = deepFreezePassivePrior(source);
  const delta = prior.transitionHalfWidthStrain;
  const centralTangentPa = 2 * prior.KCompEffPa * prior.APa
    / (prior.KCompEffPa + prior.APa);
  requirePositiveFinite(centralTangentPa, "centralTangentPa");

  const compressionAtMinusDelta = evaluateCompressionEnergy(-delta, prior.KCompEffPa);
  const compressionTransitionCoefficientsNormalized = quinticHermiteCoefficientsNormalized({
    valueAtZero: compressionAtMinusDelta.energy,
    firstDerivativeAtZero: delta * compressionAtMinusDelta.stress,
    secondDerivativeAtZero: delta * delta * compressionAtMinusDelta.tangent,
    valueAtOne: 0,
    firstDerivativeAtOne: 0,
    secondDerivativeAtOne: delta * delta * centralTangentPa,
  });

  const tensionAtPlusDelta = evaluateTensionEnergy(delta, prior.APa, prior.B);
  const tensionTransitionCoefficientsNormalized = quinticHermiteCoefficientsNormalized({
    valueAtZero: 0,
    firstDerivativeAtZero: 0,
    secondDerivativeAtZero: delta * delta * centralTangentPa,
    valueAtOne: tensionAtPlusDelta.energy,
    firstDerivativeAtOne: delta * tensionAtPlusDelta.stress,
    secondDerivativeAtOne: delta * delta * tensionAtPlusDelta.tangent,
  });

  const compressionConvexity = auditTransitionConvexity(
    compressionTransitionCoefficientsNormalized,
    delta,
  );
  const tensionConvexity = auditTransitionConvexity(
    tensionTransitionCoefficientsNormalized,
    delta,
  );
  if (compressionConvexity.minimumTangentPa <= 0) {
    throw new Error(
      `Compression transition is not strictly convex: minimum tangent ${compressionConvexity.minimumTangentPa} Pa`,
    );
  }
  if (tensionConvexity.minimumTangentPa <= 0) {
    throw new Error(
      `Tension transition is not strictly convex: minimum tangent ${tensionConvexity.minimumTangentPa} Pa`,
    );
  }
  const [minimumSupportedStrain, maximumSupportedStrain] = prior.supportedFiberLogStrainRange;
  Object.entries(evaluateCompressionEnergy(minimumSupportedStrain, prior.KCompEffPa))
    .forEach(([field, value]) => requireFinite(value, `supportedCompression.${field}`));
  Object.entries(evaluateTensionEnergy(maximumSupportedStrain, prior.APa, prior.B))
    .forEach(([field, value]) => requireFinite(value, `supportedTension.${field}`));

  const compiled: CompiledEquilibriumPassivePriorV1 = {
    [COMPILED_PASSIVE_PRIOR_BRAND]: true,
    modelId: EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID,
    prior,
    centralTangentPa,
    compressionTransitionCoefficientsNormalized,
    tensionTransitionCoefficientsNormalized,
    compressionConvexity: freezeConvexityAudit(compressionConvexity),
    tensionConvexity: freezeConvexityAudit(tensionConvexity),
    coefficientCoordinateSystem: "normalized-unit-interval",
    parameterizationUse,
    canonicalWidthPolicyEligible: parameterizationUse === "canonical-fixed-width",
  };
  COMPILED_PASSIVE_PRIORS.add(compiled);
  return Object.freeze(compiled);
}

export function evaluateEquilibriumPassiveEnergyV1(
  fiberLogStrain: number,
  compiled: CompiledEquilibriumPassivePriorV1,
): EquilibriumPassiveEvaluationV1 {
  assertCompiledEquilibriumPassivePriorV1(compiled);
  requireFinite(fiberLogStrain, "fiberLogStrain");
  const [minimumStrain, maximumStrain] = compiled.prior.supportedFiberLogStrainRange;
  if (fiberLogStrain < minimumStrain || fiberLogStrain > maximumStrain) {
    throw new Error(
      `fiberLogStrain ${fiberLogStrain} lies outside the supported range [${minimumStrain}, ${maximumStrain}]`,
    );
  }

  const delta = compiled.prior.transitionHalfWidthStrain;
  let region: EquilibriumPassiveRegionV1;
  let energy: number;
  let stress: number;
  let tangent: number;
  if (fiberLogStrain < -delta) {
    region = "compression";
    ({ energy, stress, tangent } = evaluateCompressionEnergy(
      fiberLogStrain,
      compiled.prior.KCompEffPa,
    ));
  } else if (fiberLogStrain < 0) {
    region = "compression-transition";
    const normalizedCoordinate = (fiberLogStrain + delta) / delta;
    ({ energy, stress, tangent } = evaluateNormalizedQuintic(
      compiled.compressionTransitionCoefficientsNormalized,
      normalizedCoordinate,
      delta,
    ));
  } else if (fiberLogStrain <= delta) {
    region = "tension-transition";
    const normalizedCoordinate = fiberLogStrain / delta;
    ({ energy, stress, tangent } = evaluateNormalizedQuintic(
      compiled.tensionTransitionCoefficientsNormalized,
      normalizedCoordinate,
      delta,
    ));
  } else {
    region = "tension";
    ({ energy, stress, tangent } = evaluateTensionEnergy(
      fiberLogStrain,
      compiled.prior.APa,
      compiled.prior.B,
    ));
  }
  requireFinite(energy, "storedEnergyDensityJPerM3");
  requireFinite(stress, "equilibriumKirchhoffStressPa");
  requirePositiveFinite(tangent, "dStressDFiberLogStrainPa");

  return Object.freeze({
    modelId: EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID,
    priorId: compiled.prior.priorId,
    fiberLogStrain,
    region,
    storedEnergyDensityJPerM3: energy,
    equilibriumKirchhoffStressPa: stress,
    dStressDFiberLogStrainPa: tangent,
    stressSource: "energy-first-derivative",
    tangentSource: "energy-second-derivative",
    stressClipped: false,
  });
}

function assertPassivePrior(
  prior: EffectiveOneFiberPassivePriorV1,
  expectedTransitionHalfWidthStrain: number,
): void {
  assertExactPlainRecordV1(prior, [
    "priorId",
    "status",
    "evidenceClass",
    "parameterMeaning",
    "tissueClass",
    "APa",
    "B",
    "KCompEffPa",
    "transitionHalfWidthStrain",
    "supportedFiberLogStrainRange",
    "stressClippingAllowed",
    "chamberPressureGainAllowed",
    "units",
  ], "passivePrior");
  assertExactPlainRecordV1(prior.units, [
    "A",
    "B",
    "KCompEff",
    "transitionHalfWidthStrain",
    "fiberLogStrain",
  ], "passivePrior.units");
  assertDensePlainArrayV1(
    prior.supportedFiberLogStrainRange,
    2,
    "passivePrior.supportedFiberLogStrainRange",
  );
  requireNonEmpty(prior.priorId, "priorId");
  if (prior.status !== "candidate-prior") {
    throw new Error("Equilibrium passive v1 accepts candidate-prior parameters only in Phase A1");
  }
  if (prior.evidenceClass !== "project-synthetic-implementation-verification") {
    throw new Error("Phase A1 passive prior must remain project-synthetic implementation evidence");
  }
  if (prior.parameterMeaning !== "effective-one-fiber-wall") {
    throw new Error("Passive parameters must be declared as effective one-fiber wall parameters");
  }
  if (prior.tissueClass !== "atrial" && prior.tissueClass !== "ventricular") {
    throw new Error("Passive tissueClass must be atrial or ventricular");
  }
  requirePositiveFinite(prior.APa, "APa");
  requirePositiveFinite(prior.B, "B");
  requirePositiveFinite(prior.KCompEffPa, "KCompEffPa");
  requirePositiveFinite(prior.transitionHalfWidthStrain, "transitionHalfWidthStrain");
  if (prior.transitionHalfWidthStrain !== expectedTransitionHalfWidthStrain) {
    throw new Error(`Passive transition half-width must equal ${expectedTransitionHalfWidthStrain}`);
  }
  const [minimumStrain, maximumStrain] = prior.supportedFiberLogStrainRange;
  requireFinite(minimumStrain, "supportedFiberLogStrainRange[0]");
  requireFinite(maximumStrain, "supportedFiberLogStrainRange[1]");
  if (
    minimumStrain >= -prior.transitionHalfWidthStrain
    || maximumStrain <= prior.transitionHalfWidthStrain
  ) {
    throw new Error("Supported strain range must contain both transition halves and strain zero");
  }
  if (prior.stressClippingAllowed !== false || prior.chamberPressureGainAllowed !== false) {
    throw new Error("Passive v1 forbids stress clipping and chamber pressure gain");
  }
  if (
    prior.units.A !== "Pa"
    || prior.units.B !== "1"
    || prior.units.KCompEff !== "Pa"
    || prior.units.transitionHalfWidthStrain !== "1"
    || prior.units.fiberLogStrain !== "1"
  ) {
    throw new Error("Passive prior units must use the canonical SI/effective one-fiber declaration");
  }
}

export function assertCompiledEquilibriumPassivePriorV1(
  compiled: CompiledEquilibriumPassivePriorV1,
): void {
  if (
    compiled[COMPILED_PASSIVE_PRIOR_BRAND] !== true
    || !COMPILED_PASSIVE_PRIORS.has(compiled)
    || compiled.modelId !== EQUILIBRIUM_PASSIVE_C2_LOGSTRAIN_V1_ID
  ) {
    throw new Error("Equilibrium passive parameters must be compiled and convexity-validated");
  }
}

function evaluateCompressionEnergy(
  fiberLogStrain: number,
  KCompEffPa: number,
): { energy: number; stress: number; tangent: number } {
  return {
    energy: 0.5 * KCompEffPa * fiberLogStrain * fiberLogStrain,
    stress: KCompEffPa * fiberLogStrain,
    tangent: KCompEffPa,
  };
}

function evaluateTensionEnergy(
  fiberLogStrain: number,
  APa: number,
  B: number,
): { energy: number; stress: number; tangent: number } {
  const exponent = B * fiberLogStrain;
  const expMinusOne = Math.expm1(exponent);
  const exponential = expMinusOne + 1;
  return {
    energy: APa / (B * B) * expm1MinusX(exponent),
    stress: APa / B * expMinusOne,
    tangent: APa * exponential,
  };
}

function expm1MinusX(value: number): number {
  if (Math.abs(value) >= 1e-4) {
    return Math.expm1(value) - value;
  }
  let term = 0.5 * value * value;
  let sum = term;
  for (let order = 3; order <= 12; order += 1) {
    term *= value / order;
    sum += term;
  }
  return sum;
}

function quinticHermiteCoefficientsNormalized(values: {
  readonly valueAtZero: number;
  readonly firstDerivativeAtZero: number;
  readonly secondDerivativeAtZero: number;
  readonly valueAtOne: number;
  readonly firstDerivativeAtOne: number;
  readonly secondDerivativeAtOne: number;
}): NormalizedQuinticCoefficients {
  const y0 = values.valueAtZero;
  const d0 = values.firstDerivativeAtZero;
  const s0 = values.secondDerivativeAtZero;
  const y1 = values.valueAtOne;
  const d1 = values.firstDerivativeAtOne;
  const s1 = values.secondDerivativeAtOne;
  const coefficients: NormalizedQuinticCoefficients = [
    y0,
    d0,
    0.5 * s0,
    10 * (y1 - y0) - 6 * d0 - 4 * d1 - 1.5 * s0 + 0.5 * s1,
    15 * (y0 - y1) + 8 * d0 + 7 * d1 + 1.5 * s0 - s1,
    6 * (y1 - y0) - 3 * (d0 + d1) - 0.5 * s0 + 0.5 * s1,
  ];
  coefficients.forEach((coefficient, index) => requireFinite(coefficient, `quinticCoefficient[${index}]`));
  return Object.freeze(coefficients);
}

function evaluateNormalizedQuintic(
  coefficients: NormalizedQuinticCoefficients,
  normalizedCoordinate: number,
  delta: number,
): { energy: number; stress: number; tangent: number } {
  const [c0, c1, c2, c3, c4, c5] = coefficients;
  const u = normalizedCoordinate;
  const energy = c0 + u * (c1 + u * (c2 + u * (c3 + u * (c4 + u * c5))));
  const derivativeU = c1 + u * (2 * c2 + u * (3 * c3 + u * (4 * c4 + u * 5 * c5)));
  const secondDerivativeU = 2 * c2 + u * (6 * c3 + u * (12 * c4 + u * 20 * c5));
  return {
    energy,
    stress: derivativeU / delta,
    tangent: secondDerivativeU / (delta * delta),
  };
}

function auditTransitionConvexity(
  coefficients: NormalizedQuinticCoefficients,
  delta: number,
): TransitionConvexityAuditV1 {
  const [, , , c3, c4, c5] = coefficients;
  const criticalCoordinates = [0, 1, ...quadraticRoots(60 * c5, 24 * c4, 6 * c3)]
    .filter((coordinate) => coordinate >= 0 && coordinate <= 1)
    .sort((left, right) => left - right)
    .filter((coordinate, index, all) => index === 0 || Math.abs(coordinate - all[index - 1]) > 1e-12);
  let minimumTangentPa = Number.POSITIVE_INFINITY;
  let normalizedCoordinateAtMinimum = Number.NaN;
  for (const coordinate of criticalCoordinates) {
    const tangentPa = evaluateNormalizedQuintic(coefficients, coordinate, delta).tangent;
    if (tangentPa < minimumTangentPa) {
      minimumTangentPa = tangentPa;
      normalizedCoordinateAtMinimum = coordinate;
    }
  }
  requireFinite(minimumTangentPa, "minimumTransitionTangentPa");
  return {
    minimumTangentPa,
    normalizedCoordinateAtMinimum,
    evaluatedCriticalCoordinates: criticalCoordinates,
  };
}

function quadraticRoots(a: number, b: number, c: number): number[] {
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (scale === 0) {
    return [];
  }
  const normalizedA = a / scale;
  const normalizedB = b / scale;
  const normalizedC = c / scale;
  const zeroTolerance = 64 * Number.EPSILON;
  if (Math.abs(normalizedA) <= zeroTolerance) {
    return Math.abs(normalizedB) <= zeroTolerance ? [] : [-normalizedC / normalizedB];
  }
  const discriminant = normalizedB * normalizedB - 4 * normalizedA * normalizedC;
  const discriminantTolerance = 64 * Number.EPSILON
    * Math.max(normalizedB * normalizedB, Math.abs(4 * normalizedA * normalizedC));
  if (discriminant < -discriminantTolerance) {
    return [];
  }
  const squareRoot = Math.sqrt(Math.max(0, discriminant));
  const q = -0.5 * (normalizedB + Math.sign(normalizedB || 1) * squareRoot);
  if (q === 0) {
    return [-normalizedB / (2 * normalizedA)];
  }
  return [q / normalizedA, normalizedC / q];
}

function freezeConvexityAudit(audit: TransitionConvexityAuditV1): TransitionConvexityAuditV1 {
  return Object.freeze({
    ...audit,
    evaluatedCriticalCoordinates: Object.freeze([...audit.evaluatedCriticalCoordinates]),
  });
}

function deepFreezePassivePrior(
  source: EffectiveOneFiberPassivePriorV1,
): EffectiveOneFiberPassivePriorV1 {
  return Object.freeze({
    ...source,
    supportedFiberLogStrainRange: Object.freeze([
      source.supportedFiberLogStrainRange[0],
      source.supportedFiberLogStrainRange[1],
    ] as const),
    units: Object.freeze({ ...source.units }),
  });
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}

function requireNonEmpty(value: string, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

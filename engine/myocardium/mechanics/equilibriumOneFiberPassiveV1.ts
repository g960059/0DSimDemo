import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";

export const EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID =
  "equilibrium-one-fiber-passive-log-strain-v1" as const;

export const EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1 = Object.freeze({
  strainMeasure: "fiber-log-strain" as const,
  stressMeasure: "fiber-kirchhoff-stress" as const,
  storedEnergyOwner: true as const,
  stressSource: "stored-energy-first-derivative" as const,
  tangentSource: "stored-energy-second-derivative" as const,
  continuity: "C2" as const,
  strictlyConvex: true as const,
  stressClipped: false as const,
  parallelSlsOwnedHere: false as const,
  activeStressOwnedHere: false as const,
  phasePressureOrFlowInput: false as const,
  pvLoopMorphologyFitAllowed: false as const,
});

export type EquilibriumOneFiberPassiveParamsV1 = Readonly<{
  readonly parameterSetId: string;
  /** Positive lower bound of d2Psi/de2 over the entire finite domain. */
  readonly centralTangentPa: number;
  /** Scale of the recruited exponential tensile energy. */
  readonly tensionScalePa: number;
  readonly tensionExponent: number;
  /** Nonnegative extra compression stiffness; central tangent remains present. */
  readonly compressionAdditionalTangentPa: number;
  /** Constitutive C2 regularization width, never a phase or pressure input. */
  readonly transitionWidthStrain: number;
}>;

export type CompiledEquilibriumOneFiberPassiveV1 = Readonly<{
  readonly modelId: typeof EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly params: EquilibriumOneFiberPassiveParamsV1;
  readonly strictConvexityLowerBoundPa: number;
  readonly claim: typeof EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1;
}>;

export type EquilibriumOneFiberPassiveRegionV1 =
  | "compression"
  | "compression-transition"
  | "origin"
  | "tension-transition"
  | "tension";

export type EquilibriumOneFiberPassiveEvaluationV1 = Readonly<{
  readonly modelId: typeof EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly fiberLogStrain: number;
  readonly region: EquilibriumOneFiberPassiveRegionV1;
  readonly storedEnergyDensityJPerM3: number;
  readonly equilibriumKirchhoffStressPa: number;
  readonly dStressDFiberLogStrainPa: number;
  readonly strictConvexityLowerBoundPa: number;
  readonly stressSource: "stored-energy-first-derivative";
  readonly tangentSource: "stored-energy-second-derivative";
  readonly stressClipped: false;
  readonly finite: true;
  readonly claim: typeof EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1;
}>;

/**
 * One fixed ventricular construction candidate transcribed from the prior
 * normal-adult CMR + TriSeg + Klotz organ-scale center. It is exposed as an
 * immutable API value only: this module contains no fitter, sweep, or runtime
 * selection logic. Klotz constrains an organ EDPVR, not a unique tissue law.
 */
export const KLOTZ_NORMAL_CENTER_VENTRICULAR_PASSIVE_PRIOR_V1 = Object.freeze({
  priorId: "klotz-normal-center-ventricular-one-fiber-passive-v1" as const,
  status: "fixed-construction-candidate" as const,
  tissueClass: "ventricular" as const,
  params: Object.freeze({
    parameterSetId:
      "fixed-klotz-normal-center-ventricular-one-fiber-passive-v1",
    centralTangentPa: 1_200,
    tensionScalePa: 22_345.939695254074,
    tensionExponent: 18,
    compressionAdditionalTangentPa: 0,
    transitionWidthStrain: 0.001,
  }) satisfies EquilibriumOneFiberPassiveParamsV1,
  source: Object.freeze({
    sourceId: "klotz-2006-normalized-edpvr" as const,
    doi: "10.1152/ajpheart.01240.2005" as const,
    normalCenterAnchor: Object.freeze({
      leftVentricularEndDiastolicVolumeMl: 144.4,
      leftVentricularEndDiastolicPressureMmHg: 8,
    }),
    transcription:
      "fixed-tensile-scale-from-prior-energy-conjugate-normal-center-construction" as const,
  }),
  claimBoundary: Object.freeze({
    organScaleEdpvrTargetIsNotDirectTissueLaw: true as const,
    rightVentricularKlotzTargetClaimed: false as const,
    patientSpecificMaterialLawClaimed: false as const,
    physiologicalValidationClaimed: false as const,
    requiresWholeHeartReplayBeforeRuntimeUse: true as const,
  }),
  parameterScanAllowed: false as const,
  pvLoopMorphologyFitAllowed: false as const,
  additionalPassiveBranchAllowed: false as const,
});

type C2PositivePartV1 = Readonly<{
  value: number;
  firstDerivative: number;
  secondDerivative: number;
}>;

const compiledRegistry = new WeakSet<object>();

export function compileEquilibriumOneFiberPassiveV1(
  source: EquilibriumOneFiberPassiveParamsV1,
): CompiledEquilibriumOneFiberPassiveV1 {
  validateParams(source);
  const params = Object.freeze({ ...source });
  const parameterIdentityHash = stableHash(sanitizeForStableHash({
    modelId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    params,
  }));
  const compiled = Object.freeze({
    modelId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    parameterSetId: params.parameterSetId,
    parameterIdentityHash,
    params,
    strictConvexityLowerBoundPa: params.centralTangentPa,
    claim: EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1,
  });
  auditCompiledEquilibriumOneFiberPassiveIdentityV1(compiled);
  compiledRegistry.add(compiled);
  return compiled;
}

export function compileKlotzNormalCenterVentricularPassiveV1():
CompiledEquilibriumOneFiberPassiveV1 {
  return compileEquilibriumOneFiberPassiveV1(
    KLOTZ_NORMAL_CENTER_VENTRICULAR_PASSIVE_PRIOR_V1.params,
  );
}

export function evaluateEquilibriumOneFiberPassiveV1(
  fiberLogStrain: number,
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): EquilibriumOneFiberPassiveEvaluationV1 {
  assertCompiledEquilibriumOneFiberPassiveBrandV1(compiled);
  requireFinite(fiberLogStrain, "fiberLogStrain");
  const { params } = compiled;
  const tension = c2PositivePartV1(
    fiberLogStrain,
    params.transitionWidthStrain,
  );
  const compression = c2PositivePartV1(
    -fiberLogStrain,
    params.transitionWidthStrain,
  );
  const tensionArgument = params.tensionExponent * tension.value;
  const tensionExpMinusOne = Math.expm1(tensionArgument);
  const tensionEnergyDensityJPerM3 = params.tensionScalePa
    / (params.tensionExponent * params.tensionExponent)
    * expm1MinusX(tensionArgument);
  const tensionStressByHingePa = params.tensionScalePa
    / params.tensionExponent
    * tensionExpMinusOne;
  const tensionTangentByHingePa = params.tensionScalePa
    * (tensionExpMinusOne + 1);
  const compressionDerivativeByStrain = -compression.firstDerivative;
  const storedEnergyDensityJPerM3 =
    0.5 * params.centralTangentPa * fiberLogStrain * fiberLogStrain
    + tensionEnergyDensityJPerM3
    + 0.5 * params.compressionAdditionalTangentPa * compression.value ** 2;
  const equilibriumKirchhoffStressPa =
    params.centralTangentPa * fiberLogStrain
    + tensionStressByHingePa * tension.firstDerivative
    + params.compressionAdditionalTangentPa
      * compression.value * compressionDerivativeByStrain;
  const dStressDFiberLogStrainPa =
    params.centralTangentPa
    + tensionTangentByHingePa * tension.firstDerivative ** 2
    + tensionStressByHingePa * tension.secondDerivative
    + params.compressionAdditionalTangentPa * (
      compressionDerivativeByStrain ** 2
      + compression.value * compression.secondDerivative
    );
  for (const [label, value] of Object.entries({
    storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa,
  })) requireFinite(value, label);
  const convexityTolerancePa = 64 * Number.EPSILON * Math.max(
    1,
    params.centralTangentPa,
    Math.abs(dStressDFiberLogStrainPa),
  );
  if (dStressDFiberLogStrainPa
    < compiled.strictConvexityLowerBoundPa - convexityTolerancePa) {
    throw new Error("equilibrium passive tangent violated its convexity lower bound");
  }
  if (storedEnergyDensityJPerM3 < -convexityTolerancePa) {
    throw new Error("equilibrium passive stored energy must be nonnegative");
  }
  return Object.freeze({
    modelId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    parameterSetId: compiled.parameterSetId,
    parameterIdentityHash: compiled.parameterIdentityHash,
    fiberLogStrain,
    region: classifyRegion(fiberLogStrain, params.transitionWidthStrain),
    storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa,
    strictConvexityLowerBoundPa: compiled.strictConvexityLowerBoundPa,
    stressSource: "stored-energy-first-derivative" as const,
    tangentSource: "stored-energy-second-derivative" as const,
    stressClipped: false as const,
    finite: true as const,
    claim: EQUILIBRIUM_ONE_FIBER_PASSIVE_CLAIM_V1,
  });
}

export function assertCompiledEquilibriumOneFiberPassiveV1(
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): void {
  assertCompiledEquilibriumOneFiberPassiveBrandV1(compiled);
  auditCompiledEquilibriumOneFiberPassiveIdentityV1(compiled);
}

/**
 * Performs the complete structural/hash audit without granting kernel
 * provenance. Runtime constitutive evaluation uses the private WeakSet brand
 * gate; callers that need a serialization/checkpoint audit can invoke this
 * deliberately off the hot path.
 */
export function auditCompiledEquilibriumOneFiberPassiveIdentityV1(
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): void {
  if (
    compiled === null
    || typeof compiled !== "object"
    || compiled.params === null
    || typeof compiled.params !== "object"
    || compiled.modelId !== EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID
    || compiled.parameterSetId !== compiled.params.parameterSetId
    || compiled.strictConvexityLowerBoundPa !== compiled.params.centralTangentPa
  ) {
    throw new Error("compiled equilibrium passive identity is invalid");
  }
  validateParams(compiled.params);
  const expectedHash = stableHash(sanitizeForStableHash({
    modelId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    params: compiled.params,
  }));
  if (compiled.parameterIdentityHash !== expectedHash) {
    throw new Error("compiled equilibrium passive parameter hash is stale");
  }
}

function assertCompiledEquilibriumOneFiberPassiveBrandV1(
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): void {
  if (
    compiled === null
    || typeof compiled !== "object"
    || !compiledRegistry.has(compiled)
    || compiled.modelId !== EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID
    || compiled.parameterSetId !== compiled.params.parameterSetId
    || compiled.strictConvexityLowerBoundPa !== compiled.params.centralTangentPa
  ) {
    throw new Error("equilibrium passive parameters must be compiled by this kernel");
  }
}

/** C2 positive part: zero below zero and linear after the transition. */
function c2PositivePartV1(value: number, width: number): C2PositivePartV1 {
  if (value <= 0) {
    return Object.freeze({ value: 0, firstDerivative: 0, secondDerivative: 0 });
  }
  if (value >= width) {
    return Object.freeze({
      value: value - 0.5 * width,
      firstDerivative: 1,
      secondDerivative: 0,
    });
  }
  const normalized = value / width;
  return Object.freeze({
    value: width * (normalized ** 3 - 0.5 * normalized ** 4),
    firstDerivative: 3 * normalized ** 2 - 2 * normalized ** 3,
    secondDerivative: (6 * normalized - 6 * normalized ** 2) / width,
  });
}

function expm1MinusX(value: number): number {
  if (Math.abs(value) >= 1e-4) return Math.expm1(value) - value;
  let term = 0.5 * value * value;
  let sum = term;
  for (let order = 3; order <= 12; order += 1) {
    term *= value / order;
    sum += term;
  }
  return sum;
}

function classifyRegion(
  strain: number,
  transitionWidthStrain: number,
): EquilibriumOneFiberPassiveRegionV1 {
  if (strain < -transitionWidthStrain) return "compression";
  if (strain < 0) return "compression-transition";
  if (strain === 0) return "origin";
  if (strain <= transitionWidthStrain) return "tension-transition";
  return "tension";
}

function validateParams(params: EquilibriumOneFiberPassiveParamsV1): void {
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    throw new Error("parameterSetId must be non-empty");
  }
  requirePositive(params.centralTangentPa, "centralTangentPa");
  requirePositive(params.tensionScalePa, "tensionScalePa");
  requirePositive(params.tensionExponent, "tensionExponent");
  requireNonnegative(
    params.compressionAdditionalTangentPa,
    "compressionAdditionalTangentPa",
  );
  requirePositive(params.transitionWidthStrain, "transitionWidthStrain");
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function requireNonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

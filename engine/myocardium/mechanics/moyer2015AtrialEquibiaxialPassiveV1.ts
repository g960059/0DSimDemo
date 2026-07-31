import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";

export const MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID =
  "moyer-2015-atrial-equibiaxial-passive-v1" as const;

export const MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_CLAIM_V1 = Object.freeze({
  sourceMaterial:
    "moyer-2015-incompressible-transversely-isotropic-human-LA-FE-material" as const,
  reduction:
    "exact-incompressible-equibiaxial-path-with-zero-through-thickness-traction" as const,
  deformationGradient: "diag(lambda,lambda,lambda^-2)" as const,
  fiberLogStrain: "e=ln(lambda)" as const,
  stressMeasure:
    "equibiaxial-generalized-kirchhoff-stress-dWreduced-de-not-a-single-fiber-tensor-component" as const,
  energyStressTangentFromSamePotential: true as const,
  fiberCompressionResponse: "zero-for-lambda-at-or-below-one" as const,
  recruitmentPointTangent: "right-second-derivative" as const,
  strictlyConvexOnSupportedRange: true as const,
  stressClipped: false as const,
  pressureOrPhaseInput: false as const,
  pvLoopMorphologyFitAllowed: false as const,
  fullFiniteElementOrganModelReproduced: false as const,
});

export type Moyer2015AtrialEquibiaxialPassivePriorV1 = Readonly<{
  parameterSetId: string;
  status: "fixed-literature-construction-candidate";
  isotropicC1Pa: number;
  isotropicC2Pa: number;
  fiberC3Pa: number;
  fiberC4: number;
  supportedFiberLogStrainRange: readonly [-0.5, 0.5];
  source: Readonly<{
    title: "Changes in Global and Regional Mechanics Due to Atrial Fibrillation";
    doi: "10.1007/s10439-015-1256-0";
    pmcid: "PMC4497915";
    parameterIdentificationBoundary:
      "porcine-tissue-starting-point-then-human-in-vivo-filling-volume-adjustment";
  }>;
  units: Readonly<{
    isotropicC1: "Pa";
    isotropicC2: "Pa";
    fiberC3: "Pa";
    fiberC4: "1";
    fiberLogStrain: "1";
  }>;
}>;

export type CompiledMoyer2015AtrialEquibiaxialPassiveV1 = Readonly<{
  modelId: typeof MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID;
  parameterSetId: string;
  parameterIdentityHash: string;
  prior: Moyer2015AtrialEquibiaxialPassivePriorV1;
  zeroStrainRightTangentPa: number;
  strictConvexityLowerBoundPa: number;
  claim: typeof MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_CLAIM_V1;
}>;

export type Moyer2015AtrialEquibiaxialPassiveEvaluationV1 = Readonly<{
  modelId: typeof MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID;
  parameterSetId: string;
  parameterIdentityHash: string;
  fiberLogStrain: number;
  fiberStretch: number;
  region: "matrix-compression" | "recruitment-origin" | "matrix-and-fiber-tension";
  storedEnergyDensityJPerM3: number;
  equilibriumKirchhoffStressPa: number;
  dStressDFiberLogStrainPa: number;
  strictConvexityLowerBoundPa: number;
  stressSource: "stored-energy-first-derivative";
  tangentSource: "stored-energy-second-derivative";
  stressClipped: false;
  finite: true;
  claim: typeof MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_CLAIM_V1;
}>;

export const MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1:
Moyer2015AtrialEquibiaxialPassivePriorV1 = deepFreeze({
  parameterSetId: "moyer-2015-normal-human-la-equibiaxial-reduction-v1",
  status: "fixed-literature-construction-candidate",
  isotropicC1Pa: 1_650,
  isotropicC2Pa: 0,
  fiberC3Pa: 15,
  fiberC4: 13.37,
  supportedFiberLogStrainRange: [-0.5, 0.5],
  source: {
    title: "Changes in Global and Regional Mechanics Due to Atrial Fibrillation",
    doi: "10.1007/s10439-015-1256-0",
    pmcid: "PMC4497915",
    parameterIdentificationBoundary:
      "porcine-tissue-starting-point-then-human-in-vivo-filling-volume-adjustment",
  },
  units: {
    isotropicC1: "Pa",
    isotropicC2: "Pa",
    fiberC3: "Pa",
    fiberC4: "1",
    fiberLogStrain: "1",
  },
});

const EULER_MASCHERONI = 0.5772156649015329;
const compiledRegistry = new WeakSet<object>();

/**
 * Compiles only a constitutive identity. No calibration, scan, or chamber
 * observable enters this operation. Strict convexity follows analytically
 * from the C1 matrix term:
 *
 *   8 C1 exp(2e) + 16 C1 exp(-4e) >= 12 C1 cbrt(4) > 0.
 */
export function compileMoyer2015AtrialEquibiaxialPassiveV1(
  source: Moyer2015AtrialEquibiaxialPassivePriorV1 =
    MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
): CompiledMoyer2015AtrialEquibiaxialPassiveV1 {
  validatePrior(source);
  const prior = deepFreeze(clonePrior(source));
  const parameterIdentityHash = stableHash(sanitizeForStableHash({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
    prior,
  }));
  const compiled = Object.freeze({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
    parameterSetId: prior.parameterSetId,
    parameterIdentityHash,
    prior,
    zeroStrainRightTangentPa:
      24 * prior.isotropicC1Pa
      + 24 * prior.isotropicC2Pa
      + prior.fiberC3Pa * prior.fiberC4,
    strictConvexityLowerBoundPa:
      12 * prior.isotropicC1Pa * Math.cbrt(4),
    claim: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_CLAIM_V1,
  });
  auditCompiledMoyer2015AtrialEquibiaxialPassiveIdentityV1(compiled);
  compiledRegistry.add(compiled);
  return compiled;
}

/** Exact constitutive-path reduction; no clipping or extrapolation. */
export function evaluateMoyer2015AtrialEquibiaxialPassiveV1(
  fiberLogStrain: number,
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): Moyer2015AtrialEquibiaxialPassiveEvaluationV1 {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveBrandV1(compiled);
  requireFinite(fiberLogStrain, "fiberLogStrain");
  const [lower, upper] = compiled.prior.supportedFiberLogStrainRange;
  if (fiberLogStrain < lower || fiberLogStrain > upper) {
    throw new Error(
      `fiberLogStrain ${fiberLogStrain} lies outside Moyer support [${lower}, ${upper}]`,
    );
  }

  const fiberStretch = Math.exp(fiberLogStrain);
  const lambda2 = fiberStretch * fiberStretch;
  const lambdaMinus2 = 1 / lambda2;
  const lambdaMinus4 = lambdaMinus2 * lambdaMinus2;
  const { prior } = compiled;
  const fiberExponent = prior.fiberC4 * (fiberStretch - 1);
  const fiberStressPa = fiberLogStrain > 0
    ? prior.fiberC3Pa * Math.expm1(fiberExponent)
    : 0;
  // FEBio's tension-only fiber energy has a right second derivative at lambda=1.
  const fiberTangentPa = fiberLogStrain >= 0
    ? prior.fiberC3Pa * prior.fiberC4
      * fiberStretch * Math.exp(fiberExponent)
    : 0;
  const equilibriumKirchhoffStressPa =
    4 * prior.isotropicC1Pa * (lambda2 - lambdaMinus4)
    + 4 * prior.isotropicC2Pa * (lambda2 * lambda2 - lambdaMinus2)
    + fiberStressPa;
  const dStressDFiberLogStrainPa =
    8 * prior.isotropicC1Pa * lambda2
    + 16 * prior.isotropicC1Pa * lambdaMinus4
    + 16 * prior.isotropicC2Pa * lambda2 * lambda2
    + 8 * prior.isotropicC2Pa * lambdaMinus2
    + fiberTangentPa;
  const storedEnergyDensityJPerM3 = storedEnergyDensity(
    fiberLogStrain,
    fiberStretch,
    prior,
  );
  for (const [label, value] of Object.entries({
    fiberStretch,
    storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa,
  })) requireFinite(value, label);
  const tolerance = 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(storedEnergyDensityJPerM3),
    Math.abs(dStressDFiberLogStrainPa),
  );
  if (storedEnergyDensityJPerM3 < -tolerance) {
    throw new Error("Moyer stored energy must be nonnegative");
  }
  if (dStressDFiberLogStrainPa
    < compiled.strictConvexityLowerBoundPa - tolerance) {
    throw new Error("Moyer tangent violated the analytical convexity lower bound");
  }

  return Object.freeze({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
    parameterSetId: compiled.parameterSetId,
    parameterIdentityHash: compiled.parameterIdentityHash,
    fiberLogStrain,
    fiberStretch,
    region: fiberLogStrain < 0
      ? "matrix-compression" as const
      : fiberLogStrain > 0
        ? "matrix-and-fiber-tension" as const
        : "recruitment-origin" as const,
    storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa,
    strictConvexityLowerBoundPa: compiled.strictConvexityLowerBoundPa,
    stressSource: "stored-energy-first-derivative" as const,
    tangentSource: "stored-energy-second-derivative" as const,
    stressClipped: false as const,
    finite: true as const,
    claim: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_CLAIM_V1,
  });
}

export function assertCompiledMoyer2015AtrialEquibiaxialPassiveV1(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): void {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveBrandV1(compiled);
  auditCompiledMoyer2015AtrialEquibiaxialPassiveIdentityV1(compiled);
}

/**
 * Performs the complete structural/hash audit without granting kernel
 * provenance. Runtime constitutive evaluation uses the private WeakSet brand
 * gate; callers that need a serialization/checkpoint audit can invoke this
 * deliberately off the hot path.
 */
export function auditCompiledMoyer2015AtrialEquibiaxialPassiveIdentityV1(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): void {
  if (
    compiled === null
    || typeof compiled !== "object"
    || compiled.prior === null
    || typeof compiled.prior !== "object"
    || compiled.modelId !== MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID
    || compiled.parameterSetId !== compiled.prior.parameterSetId
  ) {
    throw new Error("compiled Moyer passive identity is invalid");
  }
  validatePrior(compiled.prior);
  const expectedHash = stableHash(sanitizeForStableHash({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
    prior: compiled.prior,
  }));
  if (compiled.parameterIdentityHash !== expectedHash) {
    throw new Error("compiled Moyer passive parameter hash is stale");
  }
  const expectedLowerBound =
    12 * compiled.prior.isotropicC1Pa * Math.cbrt(4);
  if (compiled.strictConvexityLowerBoundPa !== expectedLowerBound) {
    throw new Error("compiled Moyer convexity identity is stale");
  }
}

function assertCompiledMoyer2015AtrialEquibiaxialPassiveBrandV1(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): void {
  if (
    compiled === null
    || typeof compiled !== "object"
    || !compiledRegistry.has(compiled)
    || compiled.modelId !== MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID
    || compiled.parameterSetId !== compiled.prior.parameterSetId
  ) {
    throw new Error("Moyer passive parameters must be compiled by this kernel");
  }
}

function storedEnergyDensity(
  strain: number,
  fiberStretch: number,
  prior: Moyer2015AtrialEquibiaxialPassivePriorV1,
): number {
  if (Math.abs(strain) < 1e-5) return smallStrainEnergy(strain, prior);
  const lambda2 = fiberStretch * fiberStretch;
  const lambdaMinus2 = 1 / lambda2;
  const isotropic = prior.isotropicC1Pa
      * (2 * lambda2 + lambdaMinus2 * lambdaMinus2 - 3)
    + prior.isotropicC2Pa
      * (lambda2 * lambda2 + 2 * lambdaMinus2 - 3);
  const fiber = strain > 0
    ? prior.fiberC3Pa * (
      Math.exp(-prior.fiberC4) * (
        exponentialIntegralPositive(prior.fiberC4 * fiberStretch)
        - exponentialIntegralPositive(prior.fiberC4)
      ) - strain
    )
    : 0;
  return isotropic + fiber;
}

/** Cancellation-safe Taylor form used only around the recruitment origin. */
function smallStrainEnergy(
  strain: number,
  prior: Moyer2015AtrialEquibiaxialPassivePriorV1,
): number {
  const e2 = strain * strain;
  const e3 = e2 * strain;
  const e4 = e3 * strain;
  const e5 = e4 * strain;
  const e6 = e5 * strain;
  const isotropic = prior.isotropicC1Pa
      * (12 * e2 - 8 * e3 + 12 * e4 - 8 * e5 + 88 / 15 * e6)
    + prior.isotropicC2Pa
      * (12 * e2 + 8 * e3 + 12 * e4 + 8 * e5 + 88 / 15 * e6);
  const c4 = prior.fiberC4;
  const fiber = strain > 0
    ? prior.fiberC3Pa * (
      0.5 * c4 * e2
      + c4 * (1 + c4) / 6 * e3
      + c4 * (1 + 3 * c4 + c4 * c4) / 24 * e4
    )
    : 0;
  return isotropic + fiber;
}

function exponentialIntegralPositive(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error("positive exponential-integral argument must be positive and finite");
  }
  let sum = 0;
  let powerOverFactorial = 1;
  for (let order = 1; order <= 256; order += 1) {
    powerOverFactorial *= value / order;
    const term = powerOverFactorial / order;
    sum += term;
    if (order > value && Math.abs(term) <= 4 * Number.EPSILON * Math.abs(sum)) {
      return EULER_MASCHERONI + Math.log(value) + sum;
    }
  }
  throw new Error("positive exponential-integral series did not converge");
}

function validatePrior(prior: Moyer2015AtrialEquibiaxialPassivePriorV1): void {
  assertExactKeys(prior, [
    "parameterSetId",
    "status",
    "isotropicC1Pa",
    "isotropicC2Pa",
    "fiberC3Pa",
    "fiberC4",
    "supportedFiberLogStrainRange",
    "source",
    "units",
  ], "Moyer prior");
  if (typeof prior.parameterSetId !== "string" || prior.parameterSetId.trim() === "") {
    throw new Error("Moyer parameterSetId must be non-empty");
  }
  if (prior.status !== "fixed-literature-construction-candidate") {
    throw new Error("Moyer prior status is invalid");
  }
  requirePositive(prior.isotropicC1Pa, "isotropicC1Pa");
  requireNonnegative(prior.isotropicC2Pa, "isotropicC2Pa");
  requirePositive(prior.fiberC3Pa, "fiberC3Pa");
  requirePositive(prior.fiberC4, "fiberC4");
  if (
    prior.isotropicC1Pa !== 1_650
    || prior.isotropicC2Pa !== 0
    || prior.fiberC3Pa !== 15
    || prior.fiberC4 !== 13.37
  ) throw new Error("Moyer V1 accepts only the exact published construction values");
  if (
    prior.supportedFiberLogStrainRange.length !== 2
    || prior.supportedFiberLogStrainRange[0] !== -0.5
    || prior.supportedFiberLogStrainRange[1] !== 0.5
  ) throw new Error("Moyer support must be exactly [-0.5, 0.5]");
  assertExactKeys(prior.source, [
    "title",
    "doi",
    "pmcid",
    "parameterIdentificationBoundary",
  ], "Moyer source");
  if (
    prior.source.doi !== "10.1007/s10439-015-1256-0"
    || prior.source.pmcid !== "PMC4497915"
  ) throw new Error("Moyer source identity is invalid");
  assertExactKeys(prior.units, [
    "isotropicC1",
    "isotropicC2",
    "fiberC3",
    "fiberC4",
    "fiberLogStrain",
  ], "Moyer units");
}

function clonePrior(
  source: Moyer2015AtrialEquibiaxialPassivePriorV1,
): Moyer2015AtrialEquibiaxialPassivePriorV1 {
  return {
    ...source,
    supportedFiberLogStrainRange: [
      source.supportedFiberLogStrainRange[0],
      source.supportedFiberLogStrainRange[1],
    ],
    source: { ...source.source },
    units: { ...source.units },
  };
}

function assertExactKeys(
  value: object,
  keys: readonly string[],
  label: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a plain record`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys are not the closed schema`);
  }
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}

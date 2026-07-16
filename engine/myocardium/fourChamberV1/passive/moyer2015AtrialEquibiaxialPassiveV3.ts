import {
  type EquilibriumPassiveEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID =
  "moyer-2015-atrial-equibiaxial-passive-v3" as const;

export type Moyer2015AtrialEquibiaxialPassivePriorV3 = Readonly<{
  priorId: string;
  status: "candidate-prior";
  evidenceClass: "primary-human-left-atrial-fe-material-reduced-to-one-fiber";
  isotropicC1Pa: number;
  isotropicC2Pa: number;
  fiberC3Pa: number;
  fiberC4: number;
  supportedFiberLogStrainRange: readonly [number, number];
  source: Readonly<{
    title: "Changes in Global and Regional Mechanics Due to Atrial Fibrillation";
    doi: "10.1007/s10439-015-1256-0";
    pmcid: "PMC4497915";
    sourceMaterialCoordinate: "three-dimensional-incompressible-transversely-isotropic";
    parameterIdentificationBoundary:
      "porcine-tissue-starting-point-then-human-in-vivo-filling-volume-adjustment";
  }>;
  reduction: Readonly<{
    deformationGradient: "diag(lambda,lambda,lambda^-2)";
    fiberStretch: "lambda=exp(e_f)";
    pressureEliminatedBy: "zero-through-thickness-cauchy-traction";
    completeFeOrganModelReproduced: false;
  }>;
  units: Readonly<{
    isotropicC1: "Pa";
    isotropicC2: "Pa";
    fiberC3: "Pa";
    fiberC4: "1";
    fiberLogStrain: "1";
  }>;
}>;

export type CompiledMoyer2015AtrialEquibiaxialPassiveV3 = Readonly<{
  modelId: typeof MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID;
  prior: Moyer2015AtrialEquibiaxialPassivePriorV3;
  zeroStrainTangentPa: number;
  strictlyConvexOnSupportedRange: true;
  minimumSupportedTangentPa: number;
  energyStressTangentFromSamePotential: true;
}>;

const COMPILED = new WeakSet<object>();
const EULER_MASCHERONI = 0.5772156649015329;

export const MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V3:
  Moyer2015AtrialEquibiaxialPassivePriorV3 = deepFreeze({
    priorId: "moyer-2015-normal-human-la-equibiaxial-reduction-v3",
    status: "candidate-prior",
    evidenceClass:
      "primary-human-left-atrial-fe-material-reduced-to-one-fiber",
    isotropicC1Pa: 1_650,
    isotropicC2Pa: 0,
    fiberC3Pa: 15,
    fiberC4: 13.37,
    supportedFiberLogStrainRange: [-0.5, 0.5],
    source: {
      title:
        "Changes in Global and Regional Mechanics Due to Atrial Fibrillation",
      doi: "10.1007/s10439-015-1256-0",
      pmcid: "PMC4497915",
      sourceMaterialCoordinate:
        "three-dimensional-incompressible-transversely-isotropic",
      parameterIdentificationBoundary:
        "porcine-tissue-starting-point-then-human-in-vivo-filling-volume-adjustment",
    },
    reduction: {
      deformationGradient: "diag(lambda,lambda,lambda^-2)",
      fiberStretch: "lambda=exp(e_f)",
      pressureEliminatedBy: "zero-through-thickness-cauchy-traction",
      completeFeOrganModelReproduced: false,
    },
    units: {
      isotropicC1: "Pa",
      isotropicC2: "Pa",
      fiberC3: "Pa",
      fiberC4: "1",
      fiberLogStrain: "1",
    },
  });

/**
 * Exact constitutive-path reduction of Moyer et al.'s 3-D passive law under
 * incompressible equibiaxial shell kinematics. This is not a fit of a chamber
 * PV loop and does not claim to reproduce the complete patient-specific FE
 * geometry, boundary conditions, or regional fibres.
 */
export function compileMoyer2015AtrialEquibiaxialPassiveV3(
  prior: Moyer2015AtrialEquibiaxialPassivePriorV3,
): CompiledMoyer2015AtrialEquibiaxialPassiveV3 {
  assertPrior(prior);
  const zeroStrainTangentPa = 24 * prior.isotropicC1Pa
    + 24 * prior.isotropicC2Pa
    + prior.fiberC3Pa * prior.fiberC4;
  const [lower, upper] = prior.supportedFiberLogStrainRange;
  let minimumSupportedTangentPa = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= 256; index += 1) {
    const strain = lower + (upper - lower) * index / 256;
    minimumSupportedTangentPa = Math.min(
      minimumSupportedTangentPa,
      evaluateStressAndTangent(strain, prior).tangentPa,
    );
  }
  if (!(minimumSupportedTangentPa > 0)) {
    throw new Error("Moyer equibiaxial reduction must be strictly convex");
  }
  const compiled = Object.freeze({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID,
    prior,
    zeroStrainTangentPa,
    strictlyConvexOnSupportedRange: true as const,
    minimumSupportedTangentPa,
    energyStressTangentFromSamePotential: true as const,
  });
  COMPILED.add(compiled);
  return compiled;
}

export function evaluateMoyer2015AtrialEquibiaxialPassiveV3(
  fiberLogStrain: number,
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV3,
): EquilibriumPassiveEvaluationV1 {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV3(compiled);
  requireFinite(fiberLogStrain, "fiberLogStrain");
  const [lower, upper] = compiled.prior.supportedFiberLogStrainRange;
  if (fiberLogStrain < lower || fiberLogStrain > upper) {
    throw new Error(
      `fiberLogStrain ${fiberLogStrain} lies outside the Moyer reduction support [${lower}, ${upper}]`,
    );
  }
  const { stressPa, tangentPa } = evaluateStressAndTangent(
    fiberLogStrain,
    compiled.prior,
  );
  const storedEnergyDensityJPerM3 = evaluateStoredEnergyDensity(
    fiberLogStrain,
    compiled.prior,
  );
  [storedEnergyDensityJPerM3, stressPa, tangentPa].forEach((value, index) =>
    requireFinite(value, `moyerEquibiaxialOutput[${index}]`));
  if (storedEnergyDensityJPerM3 < -1e-10 || !(tangentPa > 0)) {
    throw new Error("Moyer equibiaxial passive evaluation lost convexity");
  }
  return Object.freeze({
    modelId: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V3_ID,
    priorId: compiled.prior.priorId,
    fiberLogStrain,
    region: "moyer-equibiaxial",
    storedEnergyDensityJPerM3,
    equilibriumKirchhoffStressPa: stressPa,
    dStressDFiberLogStrainPa: tangentPa,
    stressSource: "energy-first-derivative",
    tangentSource: "energy-second-derivative",
    stressClipped: false,
  });
}

export function assertCompiledMoyer2015AtrialEquibiaxialPassiveV3(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV3,
): CompiledMoyer2015AtrialEquibiaxialPassiveV3 {
  if (compiled === null || typeof compiled !== "object" || !COMPILED.has(compiled)) {
    throw new Error("Moyer atrial passive law must be a live compiled artifact");
  }
  return compiled;
}

function evaluateStressAndTangent(
  strain: number,
  prior: Moyer2015AtrialEquibiaxialPassivePriorV3,
): Readonly<{ stressPa: number; tangentPa: number }> {
  const lambda = Math.exp(strain);
  const lambda2 = lambda * lambda;
  const lambdaMinus2 = 1 / lambda2;
  const lambdaMinus4 = lambdaMinus2 * lambdaMinus2;
  const fiberExponent = prior.fiberC4 * (lambda - 1);
  const fiberExponential = strain >= 0 ? Math.exp(fiberExponent) : 1;
  const fiberStressPa = strain > 0
    ? prior.fiberC3Pa * Math.expm1(fiberExponent)
    : 0;
  const fiberTangentPa = strain >= 0
    ? prior.fiberC3Pa * prior.fiberC4 * lambda * fiberExponential
    : 0;
  const stressPa = 4 * prior.isotropicC1Pa * (lambda2 - lambdaMinus4)
    + 4 * prior.isotropicC2Pa * (lambda2 * lambda2 - lambdaMinus2)
    + fiberStressPa;
  const tangentPa = 8 * prior.isotropicC1Pa * lambda2
    + 16 * prior.isotropicC1Pa * lambdaMinus4
    + 16 * prior.isotropicC2Pa * lambda2 * lambda2
    + 8 * prior.isotropicC2Pa * lambdaMinus2
    + fiberTangentPa;
  return Object.freeze({ stressPa, tangentPa });
}

function evaluateStoredEnergyDensity(
  strain: number,
  prior: Moyer2015AtrialEquibiaxialPassivePriorV3,
): number {
  if (Math.abs(strain) < 1e-5) {
    return smallStrainEnergy(strain, prior);
  }
  const lambda = Math.exp(strain);
  const lambda2 = lambda * lambda;
  const lambdaMinus2 = 1 / lambda2;
  const isotropic = prior.isotropicC1Pa
      * (2 * lambda2 + lambdaMinus2 * lambdaMinus2 - 3)
    + prior.isotropicC2Pa
      * (lambda2 * lambda2 + 2 * lambdaMinus2 - 3);
  const c4 = prior.fiberC4;
  const fiber = strain > 0
    ? prior.fiberC3Pa * (
      Math.exp(-c4) * (
        exponentialIntegralPositive(c4 * lambda)
        - exponentialIntegralPositive(c4)
      ) - strain
    )
    : 0;
  return isotropic + fiber;
}

function smallStrainEnergy(
  strain: number,
  prior: Moyer2015AtrialEquibiaxialPassivePriorV3,
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
    throw new Error("positive exponential integral argument must be finite and positive");
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
  throw new Error("positive exponential integral series did not converge");
}

function assertPrior(prior: Moyer2015AtrialEquibiaxialPassivePriorV3): void {
  assertExactPlainRecordV1(prior, [
    "priorId",
    "status",
    "evidenceClass",
    "isotropicC1Pa",
    "isotropicC2Pa",
    "fiberC3Pa",
    "fiberC4",
    "supportedFiberLogStrainRange",
    "source",
    "reduction",
    "units",
  ], "Moyer atrial equibiaxial passive prior");
  if (prior.status !== "candidate-prior"
    || prior.evidenceClass
      !== "primary-human-left-atrial-fe-material-reduced-to-one-fiber") {
    throw new Error("Moyer atrial passive prior provenance is invalid");
  }
  requirePositive(prior.isotropicC1Pa, "isotropicC1Pa");
  if (!Number.isFinite(prior.isotropicC2Pa) || prior.isotropicC2Pa < 0) {
    throw new Error("isotropicC2Pa must be finite and nonnegative");
  }
  requirePositive(prior.fiberC3Pa, "fiberC3Pa");
  requirePositive(prior.fiberC4, "fiberC4");
  const [lower, upper] = prior.supportedFiberLogStrainRange;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)
    || !(lower < 0 && upper > 0 && lower < upper)) {
    throw new Error("Moyer passive strain support must straddle zero");
  }
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}

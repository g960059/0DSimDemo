import {
  assertCompiledEquilibriumPassivePriorV1,
  type CompiledEquilibriumPassivePriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const ONE_STATE_ALPHA_V_SLS_V1_ID = "one-state-alpha-v-sls-v1" as const;

export type PassiveSlsTissueClassV1 = "atrial" | "ventricular";

export type OneStateAlphaVSlsEquilibriumReferenceV1 = Readonly<{
  readonly tissueClass: PassiveSlsTissueClassV1;
  readonly equilibriumPassivePriorId: string;
  readonly equilibriumReferenceTangentPa: number;
  readonly equilibriumReferenceTangentSource:
    | "compiled-equilibrium-passive-central-tangent"
    | "moyer-equibiaxial-zero-strain-tangent";
}>;

export type ClassSharedPassiveSlsPriorV1 = {
  readonly priorId: string;
  readonly status: "candidate-prior";
  readonly evidenceClass: "project-synthetic-implementation-verification";
  readonly tissueClass: PassiveSlsTissueClassV1;
  readonly sharedByWalls: readonly string[];
  readonly rClass: number;
  readonly tauSec: number;
  readonly derivedModulusRule: "E_v=r_class*K_0";
  readonly wallWiseFreeFitAllowed: false;
  readonly enabledInCanonical59StateBaseline: true;
  readonly units: {
    readonly rClass: "1";
    readonly tau: "s";
    readonly EDerived: "Pa";
    readonly alphaV: "1";
  };
};

export const PHASE_A1_ATRIAL_CLASS_SHARED_SLS_PRIOR_V1: ClassSharedPassiveSlsPriorV1 =
  deepFreezeSlsPrior({
    priorId: "phase-a1-atrial-project-synthetic-sls-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    tissueClass: "atrial",
    sharedByWalls: ["LA", "RA"],
    rClass: 0.25,
    tauSec: 0.05,
    derivedModulusRule: "E_v=r_class*K_0",
    wallWiseFreeFitAllowed: false,
    enabledInCanonical59StateBaseline: true,
    units: { rClass: "1", tau: "s", EDerived: "Pa", alphaV: "1" },
  });

export const PHASE_A1_VENTRICULAR_CLASS_SHARED_SLS_PRIOR_V1: ClassSharedPassiveSlsPriorV1 =
  deepFreezeSlsPrior({
    priorId: "phase-a1-ventricular-project-synthetic-sls-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    tissueClass: "ventricular",
    sharedByWalls: ["LVFW", "SEP", "RVFW"],
    rClass: 0.35,
    tauSec: 0.08,
    derivedModulusRule: "E_v=r_class*K_0",
    wallWiseFreeFitAllowed: false,
    enabledInCanonical59StateBaseline: true,
    units: { rClass: "1", tau: "s", EDerived: "Pa", alphaV: "1" },
  });

const COMPILED_SLS_BRAND: unique symbol = Symbol("CompiledOneStateAlphaVSlsV1");
const COMPILED_SLS_PARAMETERS = new WeakSet<object>();

export type CompiledOneStateAlphaVSlsV1 = {
  readonly [COMPILED_SLS_BRAND]: true;
  readonly modelId: typeof ONE_STATE_ALPHA_V_SLS_V1_ID;
  readonly prior: ClassSharedPassiveSlsPriorV1;
  readonly equilibriumPassivePriorId: string;
  readonly equilibriumReferenceTangentPa: number;
  readonly equilibriumReferenceTangentSource:
    OneStateAlphaVSlsEquilibriumReferenceV1["equilibriumReferenceTangentSource"];
  /**
   * Backward-compatible name for the reference tangent used to derive E_v.
   * Callers must inspect equilibriumReferenceTangentSource before assigning a
   * constitutive meaning to the reference point.
   */
  readonly equilibriumCentralTangentPa: number;
  readonly EVPa: number;
  readonly tauSec: number;
  readonly dashpotViscosityPaSec: number;
  readonly canonicalState: "alphaV";
  readonly overstressIsAlgebraic: true;
};

export type OneStateAlphaVSlsContinuousInputV1 = {
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly alphaV: number;
};

export type OneStateAlphaVSlsContinuousOutputV1 = {
  readonly modelId: typeof ONE_STATE_ALPHA_V_SLS_V1_ID;
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly alphaV: number;
  readonly alphaVDotPerSec: number;
  readonly overstressPa: number;
  readonly storedEnergyDensityJPerM3: number;
  readonly stressPowerDensityWPerM3: number;
  readonly storedEnergyRateDensityWPerM3: number;
  readonly dissipationDensityWPerM3: number;
  readonly continuousPassivityResidualWPerM3: number;
};

export type OneStateAlphaVSlsBackwardEulerInputV1 = {
  readonly previousFiberLogStrain: number;
  readonly previousAlphaV: number;
  readonly nextFiberLogStrain: number;
  readonly dtSec: number;
};

export type OneStateAlphaVSlsBackwardEulerOutputV1 = {
  readonly modelId: typeof ONE_STATE_ALPHA_V_SLS_V1_ID;
  readonly nextAlphaV: number;
  readonly previousOverstressPa: number;
  readonly nextOverstressPa: number;
  readonly dNextOverstressDNextFiberLogStrainPa: number;
  readonly previousStoredEnergyDensityJPerM3: number;
  readonly nextStoredEnergyDensityJPerM3: number;
  readonly stressWorkIncrementDensityJPerM3: number;
  readonly numericalDissipationIncrementDensityJPerM3: number;
  readonly physicalDissipationIncrementDensityJPerM3: number;
  readonly totalDissipationIncrementDensityJPerM3: number;
  readonly stateResidual: number;
  readonly overstressEliminationResidualPa: number;
  readonly discretePassivityIdentityResidualJPerM3: number;
};

export function compileOneStateAlphaVSlsV1(
  passive: CompiledEquilibriumPassivePriorV1,
  source: ClassSharedPassiveSlsPriorV1,
): CompiledOneStateAlphaVSlsV1 {
  assertCompiledEquilibriumPassivePriorV1(passive);
  return compileOneStateAlphaVSlsFromEquilibriumReferenceV1({
    tissueClass: passive.prior.tissueClass,
    equilibriumPassivePriorId: passive.prior.priorId,
    equilibriumReferenceTangentPa: passive.centralTangentPa,
    equilibriumReferenceTangentSource:
      "compiled-equilibrium-passive-central-tangent",
  }, source);
}

/**
 * Compiles the same passive one-state SLS from a tangent supplied by an
 * independently compiled equilibrium material. The reference carries its
 * tissue class, prior identity, and constitutive tangent source explicitly so
 * a replacement equilibrium law cannot silently retain another law's modulus.
 */
export function compileOneStateAlphaVSlsFromEquilibriumReferenceV1(
  reference: OneStateAlphaVSlsEquilibriumReferenceV1,
  source: ClassSharedPassiveSlsPriorV1,
): CompiledOneStateAlphaVSlsV1 {
  assertExactPlainRecordV1(reference, [
    "tissueClass",
    "equilibriumPassivePriorId",
    "equilibriumReferenceTangentPa",
    "equilibriumReferenceTangentSource",
  ], "slsEquilibriumReference");
  assertSlsPrior(source);
  requireNonEmpty(
    reference.equilibriumPassivePriorId,
    "reference.equilibriumPassivePriorId",
  );
  requirePositiveFinite(
    reference.equilibriumReferenceTangentPa,
    "reference.equilibriumReferenceTangentPa",
  );
  if (
    reference.equilibriumReferenceTangentSource
      !== "compiled-equilibrium-passive-central-tangent"
    && reference.equilibriumReferenceTangentSource
      !== "moyer-equibiaxial-zero-strain-tangent"
  ) {
    throw new Error("Unsupported SLS equilibrium reference tangent source");
  }
  const prior = deepFreezeSlsPrior(source);
  if (reference.tissueClass !== prior.tissueClass) {
    throw new Error(
      `Passive tissue class ${reference.tissueClass} does not match SLS class ${prior.tissueClass}`,
    );
  }
  const EVPa = prior.rClass * reference.equilibriumReferenceTangentPa;
  const dashpotViscosityPaSec = EVPa * prior.tauSec;
  requirePositiveFinite(EVPa, "EVPa");
  requirePositiveFinite(dashpotViscosityPaSec, "dashpotViscosityPaSec");
  const compiled: CompiledOneStateAlphaVSlsV1 = {
    [COMPILED_SLS_BRAND]: true,
    modelId: ONE_STATE_ALPHA_V_SLS_V1_ID,
    prior,
    equilibriumPassivePriorId: reference.equilibriumPassivePriorId,
    equilibriumReferenceTangentPa: reference.equilibriumReferenceTangentPa,
    equilibriumReferenceTangentSource:
      reference.equilibriumReferenceTangentSource,
    equilibriumCentralTangentPa: reference.equilibriumReferenceTangentPa,
    EVPa,
    tauSec: prior.tauSec,
    dashpotViscosityPaSec,
    canonicalState: "alphaV",
    overstressIsAlgebraic: true,
  };
  COMPILED_SLS_PARAMETERS.add(compiled);
  return Object.freeze(compiled);
}

export function evaluateOneStateAlphaVSlsContinuousV1(
  input: OneStateAlphaVSlsContinuousInputV1,
  compiled: CompiledOneStateAlphaVSlsV1,
): OneStateAlphaVSlsContinuousOutputV1 {
  assertCompiledSls(compiled);
  assertExactPlainRecordV1(input, [
    "fiberLogStrain",
    "fiberLogStrainRatePerSec",
    "alphaV",
  ], "continuousSlsInput");
  requireFinite(input.fiberLogStrain, "fiberLogStrain");
  requireFinite(input.fiberLogStrainRatePerSec, "fiberLogStrainRatePerSec");
  requireFinite(input.alphaV, "alphaV");
  const elasticStrain = input.fiberLogStrain - input.alphaV;
  const overstressPa = compiled.EVPa * elasticStrain;
  const alphaVDotPerSec = elasticStrain / compiled.tauSec;
  const storedEnergyDensityJPerM3 = 0.5 * compiled.EVPa * elasticStrain * elasticStrain;
  const stressPowerDensityWPerM3 = overstressPa * input.fiberLogStrainRatePerSec;
  const storedEnergyRateDensityWPerM3 = overstressPa
    * (input.fiberLogStrainRatePerSec - alphaVDotPerSec);
  const dissipationDensityWPerM3 = overstressPa * alphaVDotPerSec;
  const continuousPassivityResidualWPerM3 = stressPowerDensityWPerM3
    - storedEnergyRateDensityWPerM3
    - dissipationDensityWPerM3;
  [
    overstressPa,
    alphaVDotPerSec,
    storedEnergyDensityJPerM3,
    stressPowerDensityWPerM3,
    storedEnergyRateDensityWPerM3,
    dissipationDensityWPerM3,
    continuousPassivityResidualWPerM3,
  ].forEach((value, index) => requireFinite(value, `continuousOutput[${index}]`));

  return Object.freeze({
    modelId: ONE_STATE_ALPHA_V_SLS_V1_ID,
    fiberLogStrain: input.fiberLogStrain,
    fiberLogStrainRatePerSec: input.fiberLogStrainRatePerSec,
    alphaV: input.alphaV,
    alphaVDotPerSec,
    overstressPa,
    storedEnergyDensityJPerM3,
    stressPowerDensityWPerM3,
    storedEnergyRateDensityWPerM3,
    dissipationDensityWPerM3,
    continuousPassivityResidualWPerM3,
  });
}

export function stepOneStateAlphaVSlsBackwardEulerV1(
  input: OneStateAlphaVSlsBackwardEulerInputV1,
  compiled: CompiledOneStateAlphaVSlsV1,
): OneStateAlphaVSlsBackwardEulerOutputV1 {
  assertCompiledSls(compiled);
  assertExactPlainRecordV1(input, [
    "previousFiberLogStrain",
    "previousAlphaV",
    "nextFiberLogStrain",
    "dtSec",
  ], "backwardEulerSlsInput");
  requireFinite(input.previousFiberLogStrain, "previousFiberLogStrain");
  requireFinite(input.previousAlphaV, "previousAlphaV");
  requireFinite(input.nextFiberLogStrain, "nextFiberLogStrain");
  requirePositiveFinite(input.dtSec, "dtSec");

  const timeRatio = input.dtSec / compiled.tauSec;
  const denominator = 1 + timeRatio;
  const nextAlphaV = (input.previousAlphaV + timeRatio * input.nextFiberLogStrain) / denominator;
  const previousOverstressPa = compiled.EVPa
    * (input.previousFiberLogStrain - input.previousAlphaV);
  const nextOverstressPa = compiled.EVPa * (input.nextFiberLogStrain - nextAlphaV);
  const eliminatedNextOverstressPa = (
    previousOverstressPa
    + compiled.EVPa * (input.nextFiberLogStrain - input.previousFiberLogStrain)
  ) / denominator;
  const dNextOverstressDNextFiberLogStrainPa = compiled.EVPa / denominator;
  const previousStoredEnergyDensityJPerM3 = previousOverstressPa * previousOverstressPa
    / (2 * compiled.EVPa);
  const nextStoredEnergyDensityJPerM3 = nextOverstressPa * nextOverstressPa
    / (2 * compiled.EVPa);
  const stressWorkIncrementDensityJPerM3 = nextOverstressPa
    * (input.nextFiberLogStrain - input.previousFiberLogStrain);
  const overstressIncrementPa = nextOverstressPa - previousOverstressPa;
  const numericalDissipationIncrementDensityJPerM3 = overstressIncrementPa * overstressIncrementPa
    / (2 * compiled.EVPa);
  const physicalDissipationIncrementDensityJPerM3 = input.dtSec * nextOverstressPa * nextOverstressPa
    / (compiled.EVPa * compiled.tauSec);
  const totalDissipationIncrementDensityJPerM3 = numericalDissipationIncrementDensityJPerM3
    + physicalDissipationIncrementDensityJPerM3;
  const stateResidual = nextAlphaV - input.previousAlphaV
    - input.dtSec * (input.nextFiberLogStrain - nextAlphaV) / compiled.tauSec;
  const overstressEliminationResidualPa = nextOverstressPa - eliminatedNextOverstressPa;
  const discretePassivityIdentityResidualJPerM3 = stressWorkIncrementDensityJPerM3
    - (nextStoredEnergyDensityJPerM3 - previousStoredEnergyDensityJPerM3)
    - totalDissipationIncrementDensityJPerM3;

  const finiteOutputs = [
    nextAlphaV,
    previousOverstressPa,
    nextOverstressPa,
    dNextOverstressDNextFiberLogStrainPa,
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
    stressWorkIncrementDensityJPerM3,
    numericalDissipationIncrementDensityJPerM3,
    physicalDissipationIncrementDensityJPerM3,
    totalDissipationIncrementDensityJPerM3,
    stateResidual,
    overstressEliminationResidualPa,
    discretePassivityIdentityResidualJPerM3,
  ];
  finiteOutputs.forEach((value, index) => requireFinite(value, `backwardEulerOutput[${index}]`));

  return Object.freeze({
    modelId: ONE_STATE_ALPHA_V_SLS_V1_ID,
    nextAlphaV,
    previousOverstressPa,
    nextOverstressPa,
    dNextOverstressDNextFiberLogStrainPa,
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
    stressWorkIncrementDensityJPerM3,
    numericalDissipationIncrementDensityJPerM3,
    physicalDissipationIncrementDensityJPerM3,
    totalDissipationIncrementDensityJPerM3,
    stateResidual,
    overstressEliminationResidualPa,
    discretePassivityIdentityResidualJPerM3,
  });
}

export function exactOneStateSlsStepStrainRelaxationV1(
  initialOverstressPa: number,
  elapsedSec: number,
  compiled: CompiledOneStateAlphaVSlsV1,
): number {
  assertCompiledSls(compiled);
  requireFinite(initialOverstressPa, "initialOverstressPa");
  if (!Number.isFinite(elapsedSec) || elapsedSec < 0) {
    throw new Error("elapsedSec must be nonnegative and finite");
  }
  const result = initialOverstressPa * Math.exp(-elapsedSec / compiled.tauSec);
  requireFinite(result, "relaxedOverstressPa");
  return result;
}

function assertSlsPrior(prior: ClassSharedPassiveSlsPriorV1): void {
  assertExactPlainRecordV1(prior, [
    "priorId",
    "status",
    "evidenceClass",
    "tissueClass",
    "sharedByWalls",
    "rClass",
    "tauSec",
    "derivedModulusRule",
    "wallWiseFreeFitAllowed",
    "enabledInCanonical59StateBaseline",
    "units",
  ], "slsPrior");
  assertExactPlainRecordV1(prior.units, ["rClass", "tau", "EDerived", "alphaV"], "slsPrior.units");
  requireNonEmpty(prior.priorId, "priorId");
  if (
    prior.status !== "candidate-prior"
    || prior.evidenceClass !== "project-synthetic-implementation-verification"
  ) {
    throw new Error("Phase A1 SLS parameters must remain project-synthetic candidate-prior evidence");
  }
  const expectedWalls = prior.tissueClass === "atrial"
    ? ["LA", "RA"]
    : prior.tissueClass === "ventricular"
      ? ["LVFW", "SEP", "RVFW"]
      : [];
  assertDensePlainArrayV1(prior.sharedByWalls, expectedWalls.length || undefined, "slsPrior.sharedByWalls");
  if (
    expectedWalls.length === 0
    || prior.sharedByWalls.length !== expectedWalls.length
    || prior.sharedByWalls.some((wall, index) => wall !== expectedWalls[index])
  ) {
    throw new Error("SLS v1 must use one class-shared prior for LA/RA or LVFW/SEP/RVFW");
  }
  requirePositiveFinite(prior.rClass, "rClass");
  requirePositiveFinite(prior.tauSec, "tauSec");
  if (
    prior.derivedModulusRule !== "E_v=r_class*K_0"
    || prior.wallWiseFreeFitAllowed !== false
    || prior.enabledInCanonical59StateBaseline !== true
  ) {
    throw new Error("SLS v1 requires a derived class-shared modulus and canonical SLS-on baseline");
  }
  if (
    prior.units.rClass !== "1"
    || prior.units.tau !== "s"
    || prior.units.EDerived !== "Pa"
    || prior.units.alphaV !== "1"
  ) {
    throw new Error("SLS prior units must use the canonical SI/effective one-fiber declaration");
  }
}

function assertCompiledSls(compiled: CompiledOneStateAlphaVSlsV1): void {
  if (
    compiled[COMPILED_SLS_BRAND] !== true
    || !COMPILED_SLS_PARAMETERS.has(compiled)
    || compiled.modelId !== ONE_STATE_ALPHA_V_SLS_V1_ID
  ) {
    throw new Error("One-state alphaV SLS parameters must be compiled from class-shared priors");
  }
}

function deepFreezeSlsPrior(source: ClassSharedPassiveSlsPriorV1): ClassSharedPassiveSlsPriorV1 {
  return Object.freeze({
    ...source,
    sharedByWalls: Object.freeze([...source.sharedByWalls]),
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

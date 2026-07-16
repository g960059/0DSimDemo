import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const ATRIAL_SELF_SIMILAR_ONE_FIBER_GEOMETRY_V1_ID =
  "atrial-self-similar-one-fiber-geometry-v1" as const;

export type AtrialOneFiberGeometryPriorV1 = {
  readonly priorId: string;
  readonly status: "candidate-prior";
  readonly evidenceClass:
    | "project-synthetic-implementation-verification"
    | "literature-informed-anatomy-construction";
  readonly atriumId: "LA" | "RA";
  readonly wallReferenceMaterialVolumeM3: number;
  readonly referenceCavityVolumeM3: number;
  readonly fixedSelfSimilarAreaShapeFactor: number;
  readonly pressureGain: 1;
  readonly extraSphericalLaplaceFactor: false;
  readonly units: {
    readonly wallReferenceMaterialVolume: "m^3";
    readonly referenceCavityVolume: "m^3";
    readonly pressure: "Pa";
    readonly stress: "Pa";
    readonly strain: "1";
  };
};

export type AtrialOneFiberGeometryEvaluationV1 = {
  readonly modelId: typeof ATRIAL_SELF_SIMILAR_ONE_FIBER_GEOMETRY_V1_ID;
  readonly priorId: string;
  readonly atriumId: "LA" | "RA";
  readonly cavityVolumeM3: number;
  readonly wallReferenceMaterialVolumeM3: number;
  readonly midwallEnclosedVolumeM3: number;
  readonly referenceMidwallEnclosedVolumeM3: number;
  readonly midwallAreaM2: number;
  readonly referenceMidwallAreaM2: number;
  readonly fiberLogStrain: number;
  readonly dFiberLogStrainDCavityVolumePerM3: number;
  readonly d2FiberLogStrainDCavityVolume2PerM6: number;
  readonly strainFormula: "one-third-log-midwall-volume-ratio";
  readonly shapeFactorCancelsFromStrain: true;
};

export type AtrialOneFiberPressureEvaluationV1 = AtrialOneFiberGeometryEvaluationV1 & {
  readonly kirchhoffFiberStressPa: number;
  readonly dKirchhoffStressDFiberLogStrainPa: number;
  readonly transmuralPressurePa: number;
  readonly dTransmuralPressureDCavityVolumePaPerM3: number;
  readonly virtualWorkCoefficient: number;
  readonly pressureFormula: "V_wall*tau_f*de_f/dV";
  readonly pressureGain: 1;
  readonly extraSphericalLaplaceFactorApplied: false;
  readonly pressureClipped: false;
};

export type AtrialVirtualWorkFiniteDifferenceOracleV1 = {
  readonly analyticTransmuralPressurePa: number;
  readonly finiteDifferenceTransmuralPressurePa: number;
  readonly analyticStrainDerivativePerM3: number;
  readonly finiteDifferenceStrainDerivativePerM3: number;
  readonly pressureResidualPa: number;
  readonly normalizedPressureResidual: number;
  readonly symmetricVolumeStepM3: number;
};

export const PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1: AtrialOneFiberGeometryPriorV1 =
  deepFreezeAtrialGeometryPrior({
    priorId: "phase-a1-la-project-synthetic-geometry-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    atriumId: "LA",
    wallReferenceMaterialVolumeM3: 18e-6,
    referenceCavityVolumeM3: 55e-6,
    fixedSelfSimilarAreaShapeFactor: 1,
    pressureGain: 1,
    extraSphericalLaplaceFactor: false,
    units: {
      wallReferenceMaterialVolume: "m^3",
      referenceCavityVolume: "m^3",
      pressure: "Pa",
      stress: "Pa",
      strain: "1",
    },
  });

export const PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1: AtrialOneFiberGeometryPriorV1 =
  deepFreezeAtrialGeometryPrior({
    priorId: "phase-a1-ra-project-synthetic-geometry-prior-v1",
    status: "candidate-prior",
    evidenceClass: "project-synthetic-implementation-verification",
    atriumId: "RA",
    wallReferenceMaterialVolumeM3: 15e-6,
    referenceCavityVolumeM3: 65e-6,
    fixedSelfSimilarAreaShapeFactor: 1,
    pressureGain: 1,
    extraSphericalLaplaceFactor: false,
    units: {
      wallReferenceMaterialVolume: "m^3",
      referenceCavityVolume: "m^3",
      pressure: "Pa",
      stress: "Pa",
      strain: "1",
    },
  });

export function evaluateAtrialOneFiberGeometryV1(
  cavityVolumeM3: number,
  prior: AtrialOneFiberGeometryPriorV1,
): AtrialOneFiberGeometryEvaluationV1 {
  assertAtrialGeometryPrior(prior);
  if (!Number.isFinite(cavityVolumeM3) || cavityVolumeM3 < 0) {
    throw new Error("cavityVolumeM3 must be nonnegative and finite");
  }
  const wallVolumeM3 = prior.wallReferenceMaterialVolumeM3;
  const midwallEnclosedVolumeM3 = cavityVolumeM3 + 0.5 * wallVolumeM3;
  const referenceMidwallEnclosedVolumeM3 = prior.referenceCavityVolumeM3 + 0.5 * wallVolumeM3;
  const midwallAreaM2 = prior.fixedSelfSimilarAreaShapeFactor
    * Math.cbrt(36 * Math.PI * midwallEnclosedVolumeM3 * midwallEnclosedVolumeM3);
  const referenceMidwallAreaM2 = prior.fixedSelfSimilarAreaShapeFactor
    * Math.cbrt(36 * Math.PI
      * referenceMidwallEnclosedVolumeM3
      * referenceMidwallEnclosedVolumeM3);
  const fiberLogStrain = Math.log(midwallEnclosedVolumeM3 / referenceMidwallEnclosedVolumeM3) / 3;
  const dFiberLogStrainDCavityVolumePerM3 = 1 / (3 * midwallEnclosedVolumeM3);
  const d2FiberLogStrainDCavityVolume2PerM6 = -1
    / (3 * midwallEnclosedVolumeM3 * midwallEnclosedVolumeM3);
  [
    midwallAreaM2,
    referenceMidwallAreaM2,
    fiberLogStrain,
    dFiberLogStrainDCavityVolumePerM3,
    d2FiberLogStrainDCavityVolume2PerM6,
  ].forEach((value, index) => requireFinite(value, `atrialGeometryOutput[${index}]`));

  return Object.freeze({
    modelId: ATRIAL_SELF_SIMILAR_ONE_FIBER_GEOMETRY_V1_ID,
    priorId: prior.priorId,
    atriumId: prior.atriumId,
    cavityVolumeM3,
    wallReferenceMaterialVolumeM3: wallVolumeM3,
    midwallEnclosedVolumeM3,
    referenceMidwallEnclosedVolumeM3,
    midwallAreaM2,
    referenceMidwallAreaM2,
    fiberLogStrain,
    dFiberLogStrainDCavityVolumePerM3,
    d2FiberLogStrainDCavityVolume2PerM6,
    strainFormula: "one-third-log-midwall-volume-ratio",
    shapeFactorCancelsFromStrain: true,
  });
}

export function evaluateAtrialOneFiberPressureV1(
  input: {
    readonly cavityVolumeM3: number;
    readonly kirchhoffFiberStressPa: number;
    readonly dKirchhoffStressDFiberLogStrainPa: number;
  },
  prior: AtrialOneFiberGeometryPriorV1,
): AtrialOneFiberPressureEvaluationV1 {
  assertExactPlainRecordV1(input, [
    "cavityVolumeM3",
    "kirchhoffFiberStressPa",
    "dKirchhoffStressDFiberLogStrainPa",
  ], "atrialPressureInput");
  requireFinite(input.kirchhoffFiberStressPa, "kirchhoffFiberStressPa");
  requireFinite(
    input.dKirchhoffStressDFiberLogStrainPa,
    "dKirchhoffStressDFiberLogStrainPa",
  );
  const geometry = evaluateAtrialOneFiberGeometryV1(input.cavityVolumeM3, prior);
  const firstDerivative = geometry.dFiberLogStrainDCavityVolumePerM3;
  const virtualWorkCoefficient = geometry.wallReferenceMaterialVolumeM3 * firstDerivative;
  const transmuralPressurePa = virtualWorkCoefficient * input.kirchhoffFiberStressPa;
  const dTransmuralPressureDCavityVolumePaPerM3 = geometry.wallReferenceMaterialVolumeM3
    * (
      input.dKirchhoffStressDFiberLogStrainPa * firstDerivative * firstDerivative
      + input.kirchhoffFiberStressPa * geometry.d2FiberLogStrainDCavityVolume2PerM6
    );
  requireFinite(transmuralPressurePa, "transmuralPressurePa");
  requireFinite(dTransmuralPressureDCavityVolumePaPerM3, "dTransmuralPressureDCavityVolumePaPerM3");

  return Object.freeze({
    ...geometry,
    kirchhoffFiberStressPa: input.kirchhoffFiberStressPa,
    dKirchhoffStressDFiberLogStrainPa: input.dKirchhoffStressDFiberLogStrainPa,
    transmuralPressurePa,
    dTransmuralPressureDCavityVolumePaPerM3,
    virtualWorkCoefficient,
    pressureFormula: "V_wall*tau_f*de_f/dV",
    pressureGain: 1,
    extraSphericalLaplaceFactorApplied: false,
    pressureClipped: false,
  });
}

export function evaluateAtrialVirtualWorkFiniteDifferenceOracleV1(
  input: {
    readonly cavityVolumeM3: number;
    readonly kirchhoffFiberStressPa: number;
    readonly symmetricVolumeStepM3: number;
  },
  prior: AtrialOneFiberGeometryPriorV1,
): AtrialVirtualWorkFiniteDifferenceOracleV1 {
  assertExactPlainRecordV1(input, [
    "cavityVolumeM3",
    "kirchhoffFiberStressPa",
    "symmetricVolumeStepM3",
  ], "atrialVirtualWorkOracleInput");
  requirePositiveFinite(input.symmetricVolumeStepM3, "symmetricVolumeStepM3");
  if (input.cavityVolumeM3 - input.symmetricVolumeStepM3 < 0) {
    throw new Error("Finite-difference volume step must keep cavity volume nonnegative");
  }
  const center = evaluateAtrialOneFiberGeometryV1(input.cavityVolumeM3, prior);
  const lower = evaluateAtrialOneFiberGeometryV1(
    input.cavityVolumeM3 - input.symmetricVolumeStepM3,
    prior,
  );
  const upper = evaluateAtrialOneFiberGeometryV1(
    input.cavityVolumeM3 + input.symmetricVolumeStepM3,
    prior,
  );
  requireFinite(input.kirchhoffFiberStressPa, "kirchhoffFiberStressPa");
  const finiteDifferenceStrainDerivativePerM3 = (upper.fiberLogStrain - lower.fiberLogStrain)
    / (2 * input.symmetricVolumeStepM3);
  const analyticStrainDerivativePerM3 = center.dFiberLogStrainDCavityVolumePerM3;
  const analyticTransmuralPressurePa = prior.wallReferenceMaterialVolumeM3
    * input.kirchhoffFiberStressPa
    * analyticStrainDerivativePerM3;
  const finiteDifferenceTransmuralPressurePa = prior.wallReferenceMaterialVolumeM3
    * input.kirchhoffFiberStressPa
    * finiteDifferenceStrainDerivativePerM3;
  const pressureResidualPa = analyticTransmuralPressurePa - finiteDifferenceTransmuralPressurePa;
  const normalizedPressureResidual = pressureResidualPa
    / Math.max(1, Math.abs(analyticTransmuralPressurePa), Math.abs(finiteDifferenceTransmuralPressurePa));
  [
    finiteDifferenceStrainDerivativePerM3,
    analyticStrainDerivativePerM3,
    analyticTransmuralPressurePa,
    finiteDifferenceTransmuralPressurePa,
    pressureResidualPa,
    normalizedPressureResidual,
  ].forEach((value, index) => requireFinite(value, `atrialVirtualWorkOracleOutput[${index}]`));
  return Object.freeze({
    analyticTransmuralPressurePa,
    finiteDifferenceTransmuralPressurePa,
    analyticStrainDerivativePerM3,
    finiteDifferenceStrainDerivativePerM3,
    pressureResidualPa,
    normalizedPressureResidual,
    symmetricVolumeStepM3: input.symmetricVolumeStepM3,
  });
}

function assertAtrialGeometryPrior(prior: AtrialOneFiberGeometryPriorV1): void {
  assertExactPlainRecordV1(prior, [
    "priorId",
    "status",
    "evidenceClass",
    "atriumId",
    "wallReferenceMaterialVolumeM3",
    "referenceCavityVolumeM3",
    "fixedSelfSimilarAreaShapeFactor",
    "pressureGain",
    "extraSphericalLaplaceFactor",
    "units",
  ], "atrialGeometryPrior");
  assertExactPlainRecordV1(prior.units, [
    "wallReferenceMaterialVolume",
    "referenceCavityVolume",
    "pressure",
    "stress",
    "strain",
  ], "atrialGeometryPrior.units");
  requireNonEmpty(prior.priorId, "priorId");
  if (prior.status !== "candidate-prior") {
    throw new Error("Atrial one-fiber geometry accepts candidate-prior status only");
  }
  if (
    prior.evidenceClass !== "project-synthetic-implementation-verification"
    && prior.evidenceClass !== "literature-informed-anatomy-construction"
  ) {
    throw new Error("Atrial one-fiber geometry evidenceClass is not supported");
  }
  if (prior.atriumId !== "LA" && prior.atriumId !== "RA") {
    throw new Error("atriumId must be LA or RA");
  }
  requirePositiveFinite(prior.wallReferenceMaterialVolumeM3, "wallReferenceMaterialVolumeM3");
  requirePositiveFinite(prior.referenceCavityVolumeM3, "referenceCavityVolumeM3");
  requirePositiveFinite(prior.fixedSelfSimilarAreaShapeFactor, "fixedSelfSimilarAreaShapeFactor");
  if (prior.pressureGain !== 1 || prior.extraSphericalLaplaceFactor !== false) {
    throw new Error("Atrial one-fiber v1 forbids pressure gains and extra spherical-Laplace factors");
  }
  if (
    prior.units.wallReferenceMaterialVolume !== "m^3"
    || prior.units.referenceCavityVolume !== "m^3"
    || prior.units.pressure !== "Pa"
    || prior.units.stress !== "Pa"
    || prior.units.strain !== "1"
  ) {
    throw new Error("Atrial one-fiber geometry must declare canonical SI units");
  }
}

function deepFreezeAtrialGeometryPrior(
  source: AtrialOneFiberGeometryPriorV1,
): AtrialOneFiberGeometryPriorV1 {
  return Object.freeze({ ...source, units: Object.freeze({ ...source.units }) });
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

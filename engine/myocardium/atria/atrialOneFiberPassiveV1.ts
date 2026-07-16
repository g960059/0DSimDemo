import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  assertCompiledEquilibriumOneFiberPassiveV1,
  compileEquilibriumOneFiberPassiveV1,
  evaluateEquilibriumOneFiberPassiveV1,
  type CompiledEquilibriumOneFiberPassiveV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";

export const ATRIAL_ONE_FIBER_PASSIVE_V1_ID =
  "atrial-one-fiber-passive-v1" as const;

export const ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1 = Object.freeze({
  bloodVolumeOwner: "main-wire-cavity-node" as const,
  hiddenBloodVolumeMl: 0 as const,
  geometry: "fixed-wall-self-similar-midwall" as const,
  strain: "one-third-log-midwall-volume-ratio" as const,
  passiveLaw: "energy-first-C2-compression-and-tension" as const,
  pressure: "wall-volume-times-stress-times-strain-volume-derivative" as const,
  pressureGain: 1 as const,
  stressClipped: false as const,
  pressureClipped: false as const,
  phaseTerms: false as const,
  avpdTerms: false as const,
  laaOrBodyCompartments: false as const,
});

export type AtrialOneFiberPassiveParamsV1 = {
  readonly parameterSetId: string;
  readonly atriumId: "LA" | "RA";
  /** Fixed load-bearing reference material volume. It is not blood volume. */
  readonly wallReferenceMaterialVolumeMl: number;
  /** Blood-volume reference for zero fiber log strain. */
  readonly referenceCavityBloodVolumeMl: number;
  /** Strictly positive tangent retained through the strain origin. */
  readonly centralTangentPa: number;
  /** Scale of the energy-first exponential tensile recruitment term. */
  readonly tensionScalePa: number;
  readonly tensionExponent: number;
  /** Extra compression tangent after smooth recruitment. */
  readonly compressionAdditionalTangentPa: number;
  /** Fixed constitutive regularization width, not a phase or pressure term. */
  readonly transitionWidthStrain: number;
};

export type CompiledAtrialOneFiberPassiveV1 = {
  readonly modelId: typeof ATRIAL_ONE_FIBER_PASSIVE_V1_ID;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly params: AtrialOneFiberPassiveParamsV1;
  readonly equilibriumPassive: CompiledEquilibriumOneFiberPassiveV1;
  readonly claim: typeof ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1;
};

export type AtrialOneFiberBaseGeometryV1 = {
  readonly modelId: typeof ATRIAL_ONE_FIBER_PASSIVE_V1_ID;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly atriumId: "LA" | "RA";
  readonly cavityBloodVolumeMl: number;
  readonly hiddenBloodVolumeMl: 0;
  readonly wallReferenceMaterialVolumeMl: number;
  readonly referenceCavityBloodVolumeMl: number;
  readonly midwallEnclosedVolumeMl: number;
  readonly referenceMidwallEnclosedVolumeMl: number;
  readonly fiberLogStrain: number;
  readonly dFiberLogStrainDCavityVolumePerMl: number;
  readonly d2FiberLogStrainDCavityVolume2PerMl2: number;
  readonly claim: typeof ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1;
};

export type AtrialOneFiberPassiveEvaluationV1 = AtrialOneFiberBaseGeometryV1 & {
  /** Constitutive strain; may include a pure externally-owned shape coordinate. */
  readonly effectiveFiberLogStrain: number;
  readonly storedEnergyDensityJPerM3: number;
  readonly storedEnergyJ: number;
  readonly equilibriumKirchhoffStressPa: number;
  readonly dStressDFiberLogStrainPa: number;
  readonly transmuralPressurePa: number;
  readonly transmuralPressureMmHg: number;
  readonly dTransmuralPressureDCavityVolumePaPerMl: number;
  readonly virtualWorkCoefficient: number;
  readonly stressSource: "stored-energy-first-derivative";
  readonly tangentSource: "stored-energy-second-derivative";
  readonly pressureFormula: "V_wall*sigma*de/dV";
  readonly stressClipped: false;
  readonly pressureClipped: false;
  readonly claim: typeof ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1;
};

const PA_PER_MMHG = 133.322;

export function compileAtrialOneFiberPassiveV1(
  source: AtrialOneFiberPassiveParamsV1,
): CompiledAtrialOneFiberPassiveV1 {
  validateParams(source);
  const params = Object.freeze({ ...source });
  const parameterIdentityHash = stableHash(sanitizeForStableHash({
    modelId: ATRIAL_ONE_FIBER_PASSIVE_V1_ID,
    params,
  }));
  const equilibriumPassive = compileEquilibriumOneFiberPassiveV1({
    parameterSetId: params.parameterSetId,
    centralTangentPa: params.centralTangentPa,
    tensionScalePa: params.tensionScalePa,
    tensionExponent: params.tensionExponent,
    compressionAdditionalTangentPa: params.compressionAdditionalTangentPa,
    transitionWidthStrain: params.transitionWidthStrain,
  });
  return Object.freeze({
    modelId: ATRIAL_ONE_FIBER_PASSIVE_V1_ID,
    parameterSetId: params.parameterSetId,
    parameterIdentityHash,
    params,
    equilibriumPassive,
    claim: ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1,
  });
}

/**
 * Pure one-fiber atrial geometry and equilibrium passive material evaluation.
 * The only blood-volume argument is the main-wire cavity volume supplied here.
 */
export function evaluateAtrialOneFiberPassiveV1(
  cavityBloodVolumeMl: number,
  compiled: CompiledAtrialOneFiberPassiveV1,
): AtrialOneFiberPassiveEvaluationV1 {
  const geometry = evaluateAtrialOneFiberBaseGeometryV1(
    cavityBloodVolumeMl,
    compiled,
  );
  return evaluateAtrialOneFiberPassiveAtEffectiveStrainV1(
    geometry,
    geometry.fiberLogStrain,
    compiled,
  );
}

/** Geometry owner: no constitutive strain offset and no shape-coordinate state. */
export function evaluateAtrialOneFiberBaseGeometryV1(
  cavityBloodVolumeMl: number,
  compiled: CompiledAtrialOneFiberPassiveV1,
): AtrialOneFiberBaseGeometryV1 {
  requireNonnegativeFinite(cavityBloodVolumeMl, "cavityBloodVolumeMl");
  validateCompiled(compiled);
  const { params } = compiled;
  const wallVolumeMl = params.wallReferenceMaterialVolumeMl;
  const midwallEnclosedVolumeMl = cavityBloodVolumeMl + 0.5 * wallVolumeMl;
  const referenceMidwallEnclosedVolumeMl =
    params.referenceCavityBloodVolumeMl + 0.5 * wallVolumeMl;
  const fiberLogStrain = Math.log(
    midwallEnclosedVolumeMl / referenceMidwallEnclosedVolumeMl,
  ) / 3;
  const dFiberLogStrainDCavityVolumePerMl =
    1 / (3 * midwallEnclosedVolumeMl);
  const d2FiberLogStrainDCavityVolume2PerMl2 =
    -1 / (3 * midwallEnclosedVolumeMl * midwallEnclosedVolumeMl);
  requireFiniteOutputs({
    midwallEnclosedVolumeMl,
    referenceMidwallEnclosedVolumeMl,
    fiberLogStrain,
    dFiberLogStrainDCavityVolumePerMl,
    d2FiberLogStrainDCavityVolume2PerMl2,
  });
  return Object.freeze({
    modelId: ATRIAL_ONE_FIBER_PASSIVE_V1_ID,
    parameterSetId: compiled.parameterSetId,
    parameterIdentityHash: compiled.parameterIdentityHash,
    atriumId: params.atriumId,
    cavityBloodVolumeMl,
    hiddenBloodVolumeMl: 0,
    wallReferenceMaterialVolumeMl: wallVolumeMl,
    referenceCavityBloodVolumeMl: params.referenceCavityBloodVolumeMl,
    midwallEnclosedVolumeMl,
    referenceMidwallEnclosedVolumeMl,
    fiberLogStrain,
    dFiberLogStrainDCavityVolumePerMl,
    d2FiberLogStrainDCavityVolume2PerMl2,
    claim: ATRIAL_ONE_FIBER_PASSIVE_CLAIM_V1,
  });
}

/**
 * Constitutive response at an effective log strain supplied by a separate
 * shape-coordinate owner. At fixed external coordinate, de_eff/dV=de0/dV, so
 * chamber pressure remains Vwall*sigma(e_eff)*de0/dV. This function owns no q,
 * gain, or state.
 */
export function evaluateAtrialOneFiberPassiveAtEffectiveStrainV1(
  geometry: AtrialOneFiberBaseGeometryV1,
  effectiveFiberLogStrain: number,
  compiled: CompiledAtrialOneFiberPassiveV1,
): AtrialOneFiberPassiveEvaluationV1 {
  validateCompiled(compiled);
  validateGeometryIdentity(geometry, compiled);
  if (!Number.isFinite(effectiveFiberLogStrain)) {
    throw new Error("effectiveFiberLogStrain must be finite");
  }
  const passive = evaluateEquilibriumOneFiberPassiveV1(
    effectiveFiberLogStrain,
    compiled.equilibriumPassive,
  );
  const wallVolumeMl = compiled.params.wallReferenceMaterialVolumeMl;
  const virtualWorkCoefficient =
    wallVolumeMl * geometry.dFiberLogStrainDCavityVolumePerMl;
  const transmuralPressurePa = virtualWorkCoefficient
    * passive.equilibriumKirchhoffStressPa;
  const dTransmuralPressureDCavityVolumePaPerMl = wallVolumeMl * (
    passive.dStressDFiberLogStrainPa
      * geometry.dFiberLogStrainDCavityVolumePerMl ** 2
    + passive.equilibriumKirchhoffStressPa
      * geometry.d2FiberLogStrainDCavityVolume2PerMl2
  );
  const storedEnergyJ = passive.storedEnergyDensityJPerM3
    * wallVolumeMl * 1e-6;
  requireFiniteOutputs({
    effectiveFiberLogStrain,
    storedEnergyJ,
    transmuralPressurePa,
    dTransmuralPressureDCavityVolumePaPerMl,
  });
  return Object.freeze({
    ...geometry,
    effectiveFiberLogStrain,
    storedEnergyDensityJPerM3: passive.storedEnergyDensityJPerM3,
    storedEnergyJ,
    equilibriumKirchhoffStressPa: passive.equilibriumKirchhoffStressPa,
    dStressDFiberLogStrainPa: passive.dStressDFiberLogStrainPa,
    transmuralPressurePa,
    transmuralPressureMmHg: transmuralPressurePa / PA_PER_MMHG,
    dTransmuralPressureDCavityVolumePaPerMl,
    virtualWorkCoefficient,
    stressSource: "stored-energy-first-derivative",
    tangentSource: "stored-energy-second-derivative",
    pressureFormula: "V_wall*sigma*de/dV",
    stressClipped: false,
    pressureClipped: false,
  });
}

function validateCompiled(compiled: CompiledAtrialOneFiberPassiveV1): void {
  if (
    compiled.modelId !== ATRIAL_ONE_FIBER_PASSIVE_V1_ID ||
    compiled.parameterSetId !== compiled.params.parameterSetId
  ) {
    throw new Error("compiled atrial one-fiber passive identity is inconsistent");
  }
  validateParams(compiled.params);
  assertCompiledEquilibriumOneFiberPassiveV1(compiled.equilibriumPassive);
  const material = compiled.equilibriumPassive.params;
  if (
    material.parameterSetId !== compiled.params.parameterSetId
    || material.centralTangentPa !== compiled.params.centralTangentPa
    || material.tensionScalePa !== compiled.params.tensionScalePa
    || material.tensionExponent !== compiled.params.tensionExponent
    || material.compressionAdditionalTangentPa
      !== compiled.params.compressionAdditionalTangentPa
    || material.transitionWidthStrain !== compiled.params.transitionWidthStrain
  ) {
    throw new Error("atrial geometry and equilibrium passive kernel parameters diverged");
  }
  const expectedHash = stableHash(sanitizeForStableHash({
    modelId: ATRIAL_ONE_FIBER_PASSIVE_V1_ID,
    params: compiled.params,
  }));
  if (compiled.parameterIdentityHash !== expectedHash) {
    throw new Error("compiled atrial one-fiber passive parameter hash is stale");
  }
}

function validateGeometryIdentity(
  geometry: AtrialOneFiberBaseGeometryV1,
  compiled: CompiledAtrialOneFiberPassiveV1,
): void {
  if (
    geometry.modelId !== ATRIAL_ONE_FIBER_PASSIVE_V1_ID ||
    geometry.parameterSetId !== compiled.parameterSetId ||
    geometry.parameterIdentityHash !== compiled.parameterIdentityHash ||
    geometry.atriumId !== compiled.params.atriumId ||
    geometry.wallReferenceMaterialVolumeMl !==
      compiled.params.wallReferenceMaterialVolumeMl ||
    geometry.referenceCavityBloodVolumeMl !==
      compiled.params.referenceCavityBloodVolumeMl
  ) {
    throw new Error("atrial base geometry and passive parameters do not share an identity");
  }
}

function validateParams(params: AtrialOneFiberPassiveParamsV1): void {
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    throw new Error("parameterSetId must be non-empty");
  }
  if (params.atriumId !== "LA" && params.atriumId !== "RA") {
    throw new Error("atriumId must be LA or RA");
  }
  requirePositiveFinite(
    params.wallReferenceMaterialVolumeMl,
    "wallReferenceMaterialVolumeMl",
  );
  requirePositiveFinite(
    params.referenceCavityBloodVolumeMl,
    "referenceCavityBloodVolumeMl",
  );
  requirePositiveFinite(params.centralTangentPa, "centralTangentPa");
  requirePositiveFinite(params.tensionScalePa, "tensionScalePa");
  requirePositiveFinite(params.tensionExponent, "tensionExponent");
  requireNonnegativeFinite(
    params.compressionAdditionalTangentPa,
    "compressionAdditionalTangentPa",
  );
  requirePositiveFinite(params.transitionWidthStrain, "transitionWidthStrain");
}

function requireFiniteOutputs(values: Readonly<Record<string, number>>): void {
  for (const [field, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}

function requireNonnegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
}

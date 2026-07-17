import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV1,
  compileMoyer2015AtrialEquibiaxialPassiveV1,
  evaluateMoyer2015AtrialEquibiaxialPassiveV1,
  MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
  type CompiledMoyer2015AtrialEquibiaxialPassiveV1,
  type Moyer2015AtrialEquibiaxialPassiveEvaluationV1,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import type {
  ParallelOneStateSlsParamsV1,
} from "@/engine/myocardium/mechanics/parallelOneStateSlsV1";

export const NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1_ID =
  "normal-adult-atrial-passive-construction-v1" as const;

export const NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_CLAIM_V1 = Object.freeze({
  purpose:
    "single-owner-normal-atrial-geometry-passive-law-and-one-state-SLS-construction" as const,
  equilibriumPassiveOwner:
    "Moyer-2015-exact-incompressible-equibiaxial-reduction" as const,
  atrialClasses: Object.freeze(["LA", "RA"] as const),
  rightAtriumMaterialBoundary:
    "human-LA-material-extrapolated-to-RA" as const,
  slsModes: Object.freeze(["derived-on", "exact-off"] as const),
  slsBranchCount: 1 as const,
  branchModulusRule:
    "E_v=round-to-nearest-Pa((G1/(1-G1))*K_eq_reference)" as const,
  alternatePassiveLawIncluded: false as const,
  parameterScanIncluded: false as const,
  parameterFittingIncluded: false as const,
  pvLoopShapeInputIncluded: false as const,
});

export type NormalAdultAtrialIdV1 = "LA" | "RA";
export type NormalAdultAtrialPassiveSlsModeV1 = "derived-on" | "exact-off";

export type NormalAdultAtrialConstructionV1 = Readonly<{
  atriumId: NormalAdultAtrialIdV1;
  cavityBloodVolumeMl: Readonly<{
    maximum: number;
    preA: number;
    minimum: number;
  }>;
  wallMaterialVolumeMl: number;
  inverseUnloadedReferenceCavityVolumeMl: number;
  baseFiberLogStrain: Readonly<{
    maximum: number;
    preA: number;
    minimum: number;
  }>;
  inverseUnloadingAnchor: Readonly<{
    cavityBloodVolumeMl: number;
    transmuralPressureMmHg: number;
    pressureEvidenceBoundary: string;
  }>;
  patientFitPolicy:
    "replace-volumes-and-wall-mass-from-imaging-and-reference-only-from-independent-pressure-volume-data";
}>;

export type NormalAdultAtrialSlsClassV1 = Readonly<{
  atriumId: NormalAdultAtrialIdV1;
  classId: "normal-adult-atrial-shared-fast-branch-v1";
  referenceFiberLogStrain: 0;
  referenceEquilibriumTangentPa: number;
  sourcePronyCoefficient: 0.13;
  unroundedRelaxationRatio: number;
  unroundedBranchModulusPa: number;
  branchModulusRoundingRule: "round-to-nearest-Pa";
  relaxationTimeSec: 0.3;
  modulusRule:
    "E_v=round-to-nearest-Pa(unroundedRelaxationRatio*K_eq_reference)";
  exactParityBoundary:
    "rounding-policy-replays-the-existing-5947-Pa-branch-modulus";
  derivedOnParams: ParallelOneStateSlsParamsV1;
  exactOffParams: ParallelOneStateSlsParamsV1;
}>;

export type NormalAdultAtrialPassiveConstructionV1 = Readonly<{
  constructionId: typeof NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1_ID;
  status: "fixed-normal-construction-candidate";
  parameterIdentityHash: string;
  equilibriumPassive: Readonly<{
    compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1;
    referenceFiberLogStrain: 0;
    referenceEquilibriumTangentPa: number;
    referenceTangentDefinition:
      "right-second-derivative-at-Moyer-fiber-recruitment-origin";
  }>;
  atria: Readonly<Record<NormalAdultAtrialIdV1, NormalAdultAtrialConstructionV1>>;
  slsByAtrium: Readonly<Record<NormalAdultAtrialIdV1, NormalAdultAtrialSlsClassV1>>;
  claim: typeof NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_CLAIM_V1;
}>;

export type NormalAdultAtrialPassivePressureReplayV1 = Readonly<{
  atriumId: NormalAdultAtrialIdV1;
  cavityBloodVolumeMl: number;
  wallMaterialVolumeMl: number;
  referenceCavityBloodVolumeMl: number;
  fiberLogStrain: number;
  dFiberLogStrainDCavityVolumePerMl: number;
  equilibriumKirchhoffStressPa: number;
  storedEnergyJ: number;
  transmuralPressurePa: number;
  transmuralPressureMmHg: number;
  pressureFormula: "V_wall*sigma*de/dV";
  hiddenBloodVolumeMl: 0;
}>;

export type NormalAdultAtrialPassiveGeometryV1 = Readonly<{
  wallMaterialVolumeM3: number;
  referenceCavityBloodVolumeM3: number;
}>;

const PA_PER_MMHG = 133.322387415;
const constructionRegistry = new WeakSet<object>();

export const NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1:
NormalAdultAtrialPassiveConstructionV1 = buildConstruction();

export function normalAdultAtrialPassiveConstructionHashInputV1(
  construction: Omit<
    NormalAdultAtrialPassiveConstructionV1,
    "parameterIdentityHash"
  >,
): unknown {
  return {
    constructionId: construction.constructionId,
    status: construction.status,
    equilibriumPassive: {
      modelId: construction.equilibriumPassive.compiled.modelId,
      parameterIdentityHash:
        construction.equilibriumPassive.compiled.parameterIdentityHash,
      referenceFiberLogStrain:
        construction.equilibriumPassive.referenceFiberLogStrain,
      referenceEquilibriumTangentPa:
        construction.equilibriumPassive.referenceEquilibriumTangentPa,
      referenceTangentDefinition:
        construction.equilibriumPassive.referenceTangentDefinition,
    },
    atria: construction.atria,
    slsByAtrium: Object.fromEntries(
      (["LA", "RA"] as const).map((atriumId) => {
        const sls = construction.slsByAtrium[atriumId];
        return [atriumId, {
          atriumId: sls.atriumId,
          classId: sls.classId,
          referenceFiberLogStrain: sls.referenceFiberLogStrain,
          referenceEquilibriumTangentPa: sls.referenceEquilibriumTangentPa,
          sourcePronyCoefficient: sls.sourcePronyCoefficient,
          unroundedRelaxationRatio: sls.unroundedRelaxationRatio,
          unroundedBranchModulusPa: sls.unroundedBranchModulusPa,
          branchModulusRoundingRule: sls.branchModulusRoundingRule,
          relaxationTimeSec: sls.relaxationTimeSec,
          modulusRule: sls.modulusRule,
          exactParityBoundary: sls.exactParityBoundary,
          derivedOnParams: sls.derivedOnParams,
          exactOffParams: sls.exactOffParams,
        }];
      }),
    ),
    claim: construction.claim,
  };
}

export function assertNormalAdultAtrialPassiveConstructionV1(
  construction: NormalAdultAtrialPassiveConstructionV1,
): void {
  if (
    construction === null
    || typeof construction !== "object"
    || !constructionRegistry.has(construction)
    || construction.constructionId
      !== NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1_ID
  ) {
    throw new Error(
      "atrial passive construction must be the live immutable fixed bundle",
    );
  }
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV1(
    construction.equilibriumPassive.compiled,
  );
  const expectedHash = stableHash(sanitizeForStableHash(
    normalAdultAtrialPassiveConstructionHashInputV1(construction),
  ));
  if (construction.parameterIdentityHash !== expectedHash) {
    throw new Error("atrial passive construction identity hash is stale");
  }
  validateConstruction(construction);
}

export function evaluateNormalAdultAtrialEquilibriumPassiveV1(
  fiberLogStrain: number,
): Moyer2015AtrialEquibiaxialPassiveEvaluationV1 {
  // The singleton is asserted once when it is built and again when the
  // five-wall provider is constructed. Keep this hot Newton-path evaluator
  // free of stable-hash reconstruction.
  return evaluateMoyer2015AtrialEquibiaxialPassiveV1(
    fiberLogStrain,
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.equilibriumPassive.compiled,
  );
}

export function evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1(
  atriumId: NormalAdultAtrialIdV1,
  cavityBloodVolumeMl: number,
): NormalAdultAtrialPassivePressureReplayV1 {
  assertNormalAdultAtrialPassiveConstructionV1(
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  );
  requireAtriumId(atriumId);
  if (!Number.isFinite(cavityBloodVolumeMl) || cavityBloodVolumeMl < 0) {
    throw new Error("cavityBloodVolumeMl must be finite and nonnegative");
  }
  const anatomy = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.atria[atriumId];
  const wallMaterialVolumeMl = anatomy.wallMaterialVolumeMl;
  const referenceCavityBloodVolumeMl =
    anatomy.inverseUnloadedReferenceCavityVolumeMl;
  const midwallVolumeMl = cavityBloodVolumeMl + 0.5 * wallMaterialVolumeMl;
  const referenceMidwallVolumeMl =
    referenceCavityBloodVolumeMl + 0.5 * wallMaterialVolumeMl;
  const fiberLogStrain = Math.log(midwallVolumeMl / referenceMidwallVolumeMl) / 3;
  const dFiberLogStrainDCavityVolumePerMl = 1 / (3 * midwallVolumeMl);
  const material = evaluateNormalAdultAtrialEquilibriumPassiveV1(fiberLogStrain);
  const transmuralPressurePa = wallMaterialVolumeMl
    * material.equilibriumKirchhoffStressPa
    * dFiberLogStrainDCavityVolumePerMl;
  return Object.freeze({
    atriumId,
    cavityBloodVolumeMl,
    wallMaterialVolumeMl,
    referenceCavityBloodVolumeMl,
    fiberLogStrain,
    dFiberLogStrainDCavityVolumePerMl,
    equilibriumKirchhoffStressPa: material.equilibriumKirchhoffStressPa,
    storedEnergyJ:
      material.storedEnergyDensityJPerM3 * wallMaterialVolumeMl * 1e-6,
    transmuralPressurePa,
    transmuralPressureMmHg: transmuralPressurePa / PA_PER_MMHG,
    pressureFormula: "V_wall*sigma*de/dV" as const,
    hiddenBloodVolumeMl: 0 as const,
  });
}

export function normalAdultAtrialPassiveGeometryV1(
  atriumId: NormalAdultAtrialIdV1,
): NormalAdultAtrialPassiveGeometryV1 {
  assertNormalAdultAtrialPassiveConstructionV1(
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  );
  requireAtriumId(atriumId);
  const anatomy = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.atria[atriumId];
  return Object.freeze({
    wallMaterialVolumeM3: anatomy.wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3:
      anatomy.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
  });
}

export function resolveNormalAdultAtrialParallelSlsParamsV1(
  atriumId: NormalAdultAtrialIdV1,
  mode: NormalAdultAtrialPassiveSlsModeV1,
): ParallelOneStateSlsParamsV1 {
  assertNormalAdultAtrialPassiveConstructionV1(
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  );
  requireAtriumId(atriumId);
  if (mode !== "derived-on" && mode !== "exact-off") {
    throw new Error("atrial SLS mode must be derived-on or exact-off");
  }
  const sls = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.slsByAtrium[atriumId];
  return mode === "derived-on" ? sls.derivedOnParams : sls.exactOffParams;
}

function buildConstruction(): NormalAdultAtrialPassiveConstructionV1 {
  const compiled = compileMoyer2015AtrialEquibiaxialPassiveV1(
    MOYER_2015_NORMAL_HUMAN_LA_EQUIBIAXIAL_PASSIVE_PRIOR_V1,
  );
  const referenceEquilibriumTangentPa = compiled.zeroStrainRightTangentPa;
  const sourcePronyCoefficient = 0.13 as const;
  const unroundedRelaxationRatio =
    sourcePronyCoefficient / (1 - sourcePronyCoefficient);
  const unroundedBranchModulusPa =
    unroundedRelaxationRatio * referenceEquilibriumTangentPa;
  const derivedOnParams = Object.freeze({
    parameterSetId: "fixed-normal-atrial-fast-branch-sls-v1",
    branchModulusPa: Math.round(unroundedBranchModulusPa),
    relaxationTimeSec: 0.3,
  } satisfies ParallelOneStateSlsParamsV1);
  const atria = Object.freeze({
    LA: atrialConstruction({
      atriumId: "LA",
      maximumMl: 80.18,
      preAMl: 57.95,
      minimumMl: 35.72,
      wallMaterialVolumeMl: 25.982905982906,
      referenceCavityVolumeMl: 22.8900425619,
      minimumPressureMmHg: 5,
      pressureEvidenceBoundary:
        "Moyer-human-LA-FE-filling-anchor-interpreted-as-transmural-at-zero-external-pressure",
    }),
    RA: atrialConstruction({
      atriumId: "RA",
      maximumMl: 98.04,
      preAMl: 72.58,
      minimumMl: 47.31,
      wallMaterialVolumeMl: 23.399810066477,
      referenceCavityVolumeMl: 32.5968711181,
      minimumPressureMmHg: 3.5,
      pressureEvidenceBoundary:
        "control-x-descent-intracavitary-pressure-used-as-zero-external-pressure-construction-not-direct-transmural-measurement",
    }),
  });
  const slsByAtrium = Object.freeze({
    LA: slsClass(
      "LA",
      referenceEquilibriumTangentPa,
      unroundedRelaxationRatio,
      unroundedBranchModulusPa,
      derivedOnParams,
    ),
    RA: slsClass(
      "RA",
      referenceEquilibriumTangentPa,
      unroundedRelaxationRatio,
      unroundedBranchModulusPa,
      derivedOnParams,
    ),
  });
  const payload = {
    constructionId: NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1_ID,
    status: "fixed-normal-construction-candidate" as const,
    equilibriumPassive: Object.freeze({
      compiled,
      referenceFiberLogStrain: 0 as const,
      referenceEquilibriumTangentPa,
      referenceTangentDefinition:
        "right-second-derivative-at-Moyer-fiber-recruitment-origin" as const,
    }),
    atria,
    slsByAtrium,
    claim: NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_CLAIM_V1,
  };
  const construction = deepFreeze({
    ...payload,
    parameterIdentityHash: stableHash(sanitizeForStableHash(
      normalAdultAtrialPassiveConstructionHashInputV1(payload),
    )),
  }) as NormalAdultAtrialPassiveConstructionV1;
  constructionRegistry.add(construction);
  validateConstruction(construction);
  return construction;
}

function slsClass(
  atriumId: NormalAdultAtrialIdV1,
  referenceEquilibriumTangentPa: number,
  unroundedRelaxationRatio: number,
  unroundedBranchModulusPa: number,
  derivedOnParams: ParallelOneStateSlsParamsV1,
): NormalAdultAtrialSlsClassV1 {
  const sourcePronyCoefficient = 0.13 as const;
  return deepFreeze({
    atriumId,
    classId: "normal-adult-atrial-shared-fast-branch-v1" as const,
    referenceFiberLogStrain: 0 as const,
    referenceEquilibriumTangentPa,
    sourcePronyCoefficient,
    unroundedRelaxationRatio,
    unroundedBranchModulusPa,
    branchModulusRoundingRule: "round-to-nearest-Pa" as const,
    relaxationTimeSec: 0.3 as const,
    modulusRule:
      "E_v=round-to-nearest-Pa(unroundedRelaxationRatio*K_eq_reference)" as const,
    exactParityBoundary:
      "rounding-policy-replays-the-existing-5947-Pa-branch-modulus" as const,
    derivedOnParams,
    exactOffParams: Object.freeze({
      parameterSetId:
        `${derivedOnParams.parameterSetId}-${atriumId.toLowerCase()}-exact-off`,
      branchModulusPa: 0,
      relaxationTimeSec: derivedOnParams.relaxationTimeSec,
    }),
  });
}

function atrialConstruction(input: Readonly<{
  atriumId: NormalAdultAtrialIdV1;
  maximumMl: number;
  preAMl: number;
  minimumMl: number;
  wallMaterialVolumeMl: number;
  referenceCavityVolumeMl: number;
  minimumPressureMmHg: number;
  pressureEvidenceBoundary: string;
}>): NormalAdultAtrialConstructionV1 {
  const strain = (volumeMl: number) => Math.log(
    (volumeMl + 0.5 * input.wallMaterialVolumeMl)
    / (input.referenceCavityVolumeMl + 0.5 * input.wallMaterialVolumeMl),
  ) / 3;
  return deepFreeze({
    atriumId: input.atriumId,
    cavityBloodVolumeMl: {
      maximum: input.maximumMl,
      preA: input.preAMl,
      minimum: input.minimumMl,
    },
    wallMaterialVolumeMl: input.wallMaterialVolumeMl,
    inverseUnloadedReferenceCavityVolumeMl: input.referenceCavityVolumeMl,
    baseFiberLogStrain: {
      maximum: strain(input.maximumMl),
      preA: strain(input.preAMl),
      minimum: strain(input.minimumMl),
    },
    inverseUnloadingAnchor: {
      cavityBloodVolumeMl: input.minimumMl,
      transmuralPressureMmHg: input.minimumPressureMmHg,
      pressureEvidenceBoundary: input.pressureEvidenceBoundary,
    },
    patientFitPolicy:
      "replace-volumes-and-wall-mass-from-imaging-and-reference-only-from-independent-pressure-volume-data" as const,
  });
}

function validateConstruction(
  construction: NormalAdultAtrialPassiveConstructionV1,
): void {
  const equilibrium = construction.equilibriumPassive;
  if (
    equilibrium.referenceFiberLogStrain !== 0
    || equilibrium.referenceEquilibriumTangentPa
      !== equilibrium.compiled.zeroStrainRightTangentPa
    || !(equilibrium.referenceEquilibriumTangentPa > 0)
  ) throw new Error("atrial passive reference tangent construction is stale");
  for (const atriumId of ["LA", "RA"] as const) {
    const anatomy = construction.atria[atriumId];
    const { maximum, preA, minimum } = anatomy.cavityBloodVolumeMl;
    if (
      anatomy.atriumId !== atriumId
      || !(maximum > preA && preA > minimum)
      || !(anatomy.wallMaterialVolumeMl > 0)
      || !(anatomy.inverseUnloadedReferenceCavityVolumeMl >= 0)
      || !(minimum > anatomy.inverseUnloadedReferenceCavityVolumeMl)
    ) throw new Error(`${atriumId} atrial construction failed its static geometry gate`);
    const strain = (volumeMl: number) => Math.log(
      (volumeMl + 0.5 * anatomy.wallMaterialVolumeMl)
      / (
        anatomy.inverseUnloadedReferenceCavityVolumeMl
        + 0.5 * anatomy.wallMaterialVolumeMl
      ),
    ) / 3;
    for (const key of ["maximum", "preA", "minimum"] as const) {
      if (anatomy.baseFiberLogStrain[key] !== strain(anatomy.cavityBloodVolumeMl[key])) {
        throw new Error(`${atriumId} atrial strain construction is stale`);
      }
    }
    const anchor = anatomy.inverseUnloadingAnchor;
    const anchorStrain = strain(anchor.cavityBloodVolumeMl);
    const anchorMaterial = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
      anchorStrain,
      equilibrium.compiled,
    );
    const anchorMidwallVolumeMl =
      anchor.cavityBloodVolumeMl + 0.5 * anatomy.wallMaterialVolumeMl;
    const anchorPressureMmHg = anatomy.wallMaterialVolumeMl
      * anchorMaterial.equilibriumKirchhoffStressPa
      / (3 * anchorMidwallVolumeMl)
      / PA_PER_MMHG;
    if (
      Math.abs(anchorPressureMmHg - anchor.transmuralPressureMmHg) > 1e-10
    ) throw new Error(`${atriumId} inverse-unloading anchor replay is stale`);
    const sls = construction.slsByAtrium[atriumId];
    if (
      sls.atriumId !== atriumId
      || sls.referenceEquilibriumTangentPa
        !== equilibrium.referenceEquilibriumTangentPa
      || sls.referenceFiberLogStrain !== equilibrium.referenceFiberLogStrain
      || !(sls.unroundedRelaxationRatio > 0)
      || !(sls.relaxationTimeSec > 0)
      || sls.unroundedRelaxationRatio
        !== sls.sourcePronyCoefficient / (1 - sls.sourcePronyCoefficient)
      || sls.unroundedBranchModulusPa
        !== sls.unroundedRelaxationRatio * sls.referenceEquilibriumTangentPa
      || sls.derivedOnParams.branchModulusPa
        !== Math.round(sls.unroundedBranchModulusPa)
      || sls.derivedOnParams.relaxationTimeSec !== sls.relaxationTimeSec
      || sls.exactOffParams.branchModulusPa !== 0
      || sls.exactOffParams.relaxationTimeSec !== sls.relaxationTimeSec
    ) throw new Error(`${atriumId} atrial SLS construction failed its static gate`);
    if (
      Math.abs(
        sls.unroundedBranchModulusPa - sls.derivedOnParams.branchModulusPa,
      ) > 0.5
    ) {
      throw new Error(`${atriumId} atrial SLS rounding boundary was exceeded`);
    }
  }
}

function requireAtriumId(atriumId: NormalAdultAtrialIdV1): void {
  if (atriumId !== "LA" && atriumId !== "RA") {
    throw new Error("atriumId must be LA or RA");
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  evaluateTriSegGeometryV1,
  type TriSegCoordinatesV1,
  type TriSegGeometryV1,
  type TriSegWallGeometryParametersV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  compileKlotzNormalCenterVentricularPassiveV1,
  type CompiledEquilibriumOneFiberPassiveV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  type CompiledMoyer2015AtrialEquibiaxialPassiveV1,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import {
  NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  assertNormalAdultAtrialPassiveConstructionV1,
  evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1,
  type NormalAdultAtrialConstructionV1,
  type NormalAdultAtrialIdV1,
  type NormalAdultAtrialPassivePressureReplayV1,
} from "@/engine/myocardium/mechanics/normalAdultAtrialPassiveConstructionV1";
import type {
  ParallelOneStateSlsParamsV1,
} from "@/engine/myocardium/mechanics/parallelOneStateSlsV1";
import {
  LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1,
} from "@/engine/myocardium/myofilament/land2017/atrialPrior";
import {
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID =
  "normal-adult-five-wall-fixed-prior-v1" as const;

export const NORMAL_ADULT_FIVE_WALL_PRIOR_CLAIM_V1 = Object.freeze({
  purpose: "one-fixed-normal-construction-before-whole-heart-replay" as const,
  wallCount: 5 as const,
  walls: Object.freeze(["LA", "RA", "LVFW", "SEP", "RVFW"] as const),
  parameterScanIncluded: false as const,
  fitterIncluded: false as const,
  pvLoopMorphologyFitIncluded: false as const,
  providerIncluded: false as const,
  modelCoreIncluded: false as const,
  circulationIncluded: false as const,
  laaBodyCompartmentsIncluded: false as const,
  pericardiumIncluded: false as const,
  maxwellBranchCountPerWall: 1 as const,
  additionalMaxwellBranchIncluded: false as const,
});

export type NormalAdultFiveWallIdV1 =
  (typeof NORMAL_ADULT_FIVE_WALL_PRIOR_CLAIM_V1.walls)[number];
export type {
  NormalAdultAtrialConstructionV1,
  NormalAdultAtrialIdV1,
  NormalAdultAtrialPassivePressureReplayV1,
} from "@/engine/myocardium/mechanics/normalAdultAtrialPassiveConstructionV1";

export type NormalAdultFiveWallRecordV1<T> = Readonly<
  Record<NormalAdultFiveWallIdV1, T>
>;

export type NormalAdultFiveWallPriorV1 = Readonly<{
  priorId: typeof NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID;
  status: "fixed-normal-construction-candidate";
  parameterIdentityHash: string;
  bodySurfaceAreaM2: 1.9;
  myocardialDensityKgPerM3: 1053;
  anatomy: Readonly<{
    sources: Readonly<{
      atrialPhasicVolumeDoi: "10.1038/s41598-017-03377-6";
      leftAtrialMassDoi: "10.1016/j.carpath.2020.107265";
      totalAtrialMassBoundary:
        "forensic-sex-neutral-total-atrial-mass-52g-at-BSA-1.9-with-RA-as-residual";
      ventricularCmrDoi: "10.1186/1532-429X-18-S1-O75";
      triSegGeometryDoi: "10.1007/s10439-009-9774-2";
      myocardialDensityDoi: "10.1152/ajpheart.00478.2003";
      identificationBoundary:
        "population-center-construction-not-one-subject-multimodal-measurement";
    }>;
    atria: Readonly<Record<NormalAdultAtrialIdV1, NormalAdultAtrialConstructionV1>>;
    triSeg: Readonly<{
      leftVentricularEndDiastolicVolumeMl: 144.4;
      leftVentricularEndSystolicVolumeMl: 53.2;
      rightVentricularEndDiastolicVolumeMl: 155.8;
      rightVentricularEndSystolicVolumeMl: 66.5;
      wallGeometryParameters: TriSegWallRecordV1<TriSegWallGeometryParametersV1>;
      loadedCoordinates: TriSegCoordinatesV1;
      loadedReferenceGeometry: TriSegGeometryV1;
      targetFiberStretchAtLoadedReference: 1.1;
      targetStretchIdentificationBoundary:
        "construction-prior-not-direct-human-measurement";
    }>;
  }>;
  passive: Readonly<{
    atrial: Readonly<{
      compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1;
      sharedBy: readonly ["LA", "RA"];
      rightAtriumEvidenceBoundary:
        "human-LA-material-extrapolated-to-RA";
    }>;
    ventricular: Readonly<{
      compiled: CompiledEquilibriumOneFiberPassiveV1;
      sharedBy: readonly ["LVFW", "SEP", "RVFW"];
      identificationBoundary:
        "normal-center-Klotz-organ-EDPVR-construction-not-direct-tissue-law";
    }>;
  }>;
  active: Readonly<{
    atrialLand: Land2017SourceParameterSet;
    ventricularLand: Land2017SourceParameterSet;
    atrialWallMaterial: LandSlsWallMaterialParamsV1;
    ventricularWallMaterial: LandSlsWallMaterialParamsV1;
    wallMaterialByWall: NormalAdultFiveWallRecordV1<LandSlsWallMaterialParamsV1>;
  }>;
  sls: Readonly<{
    atrial: ParallelOneStateSlsParamsV1;
    ventricular: ParallelOneStateSlsParamsV1;
    sourceProjection: Readonly<{
      sourceDoi: "10.1016/j.actbio.2022.08.043";
      sourcePreparation: "healthy-adult-ovine-RV-free-wall";
      selectedPronyCoefficient: 0.13;
      selectedPronyTimeSec: 0.3;
      modulusRule: "E_v=G1/(1-G1)*K_eq_reference";
      crossWallEvidenceBoundary:
        "ovine-RV-fast-branch-projected-to-one-shared-branch-per-tissue-class";
    }>;
    removalPolicy:
      "remove-the-state-if-fixed-on-off-ablation-shows-no-material-hysteresis-effect";
  }>;
  parameterPolicy: Readonly<{
    fixedNormal: readonly string[];
    futurePatientFitOnlyWithIndependentData: readonly string[];
    forbiddenJointFits: readonly string[];
  }>;
  excluded: Readonly<{
    laaBodyCompartmentsIncluded: false;
    pericardiumIncluded: false;
    additionalMaxwellBranchesIncluded: false;
    wallWisePressureGainsIncluded: false;
  }>;
  claim: typeof NORMAL_ADULT_FIVE_WALL_PRIOR_CLAIM_V1;
}>;

const fixedPriorRegistry = new WeakSet<object>();

const ATRIAL_LAND_PARAMETER_SET = cloneLandParameterSet(
  LAND2017_HUMAN_ATRIAL_LEWALLE_FORCE_SCALE_PARAMETER_SET_V1,
);

const VENTRICULAR_LAND_PARAMETER_SET = cloneLandParameterSet(
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1,
);

const ATRIAL_SLS_PARAMS: ParallelOneStateSlsParamsV1 =
  NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.slsByAtrium.LA.derivedOnParams;

const VENTRICULAR_SLS_PARAMS: ParallelOneStateSlsParamsV1 = Object.freeze({
  parameterSetId: "fixed-normal-ventricular-fast-branch-sls-v1",
  branchModulusPa: 18_565,
  relaxationTimeSec: 0.3,
});

const ATRIAL_WALL_MATERIAL: LandSlsWallMaterialParamsV1 = Object.freeze({
  parameterSetId: "fixed-normal-atrial-land-moyer-sls-wall-v1",
  landEquationParameters: ATRIAL_LAND_PARAMETER_SET,
  landSlackStretch: 1,
  orientationFraction01: 1,
  viableActiveFraction01: 1,
  sls: ATRIAL_SLS_PARAMS,
});

const VENTRICULAR_WALL_MATERIAL: LandSlsWallMaterialParamsV1 = Object.freeze({
  parameterSetId: "fixed-normal-ventricular-land-klotz-sls-wall-v1",
  landEquationParameters: VENTRICULAR_LAND_PARAMETER_SET,
  landSlackStretch: 1,
  orientationFraction01: 1,
  viableActiveFraction01: 1,
  sls: VENTRICULAR_SLS_PARAMS,
});

export const NORMAL_ADULT_FIVE_WALL_PRIOR_V1: NormalAdultFiveWallPriorV1 =
  buildFixedPrior();

/** Pure reference-volume pressure replay; no activation, SLS, or circulation. */
export function evaluateNormalAdultAtrialPassivePressureReplayV1(
  atriumId: NormalAdultAtrialIdV1,
  cavityBloodVolumeMl: number,
): NormalAdultAtrialPassivePressureReplayV1 {
  assertNormalAdultFiveWallPriorV1(NORMAL_ADULT_FIVE_WALL_PRIOR_V1);
  return evaluateNormalAdultAtrialPassivePressureReplayFromBundleV1(
    atriumId,
    cavityBloodVolumeMl,
  );
}

export function normalAdultFiveWallPriorHashInputV1(
  prior: Omit<NormalAdultFiveWallPriorV1, "parameterIdentityHash">,
): unknown {
  return {
    priorId: prior.priorId,
    status: prior.status,
    bodySurfaceAreaM2: prior.bodySurfaceAreaM2,
    myocardialDensityKgPerM3: prior.myocardialDensityKgPerM3,
    anatomy: prior.anatomy,
    passive: {
      atrialParameterIdentityHash:
        prior.passive.atrial.compiled.parameterIdentityHash,
      atrialSharedBy: prior.passive.atrial.sharedBy,
      atrialEvidenceBoundary: prior.passive.atrial.rightAtriumEvidenceBoundary,
      ventricularParameterIdentityHash:
        prior.passive.ventricular.compiled.parameterIdentityHash,
      ventricularSharedBy: prior.passive.ventricular.sharedBy,
      ventricularEvidenceBoundary:
        prior.passive.ventricular.identificationBoundary,
    },
    active: {
      atrialLandHash: prior.active.atrialLand.parameterSetStableHash,
      ventricularLandHash: prior.active.ventricularLand.parameterSetStableHash,
      atrialWallMaterial: wallMaterialHashInput(prior.active.atrialWallMaterial),
      ventricularWallMaterial:
        wallMaterialHashInput(prior.active.ventricularWallMaterial),
      wallMaterialParameterSetIdByWall: Object.fromEntries(
        NORMAL_ADULT_FIVE_WALL_PRIOR_CLAIM_V1.walls.map((wallId) => [
          wallId,
          prior.active.wallMaterialByWall[wallId].parameterSetId,
        ]),
      ),
    },
    sls: prior.sls,
    parameterPolicy: prior.parameterPolicy,
    excluded: prior.excluded,
    claim: prior.claim,
  };
}

export function assertNormalAdultFiveWallPriorV1(
  prior: NormalAdultFiveWallPriorV1,
): void {
  if (
    prior === null
    || typeof prior !== "object"
    || !fixedPriorRegistry.has(prior)
    || prior.priorId !== NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID
  ) throw new Error("five-wall prior must be the live immutable fixed prior");
  assertNormalAdultAtrialPassiveConstructionV1(
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  );
  const expectedHash = stableHash(sanitizeForStableHash(
    normalAdultFiveWallPriorHashInputV1(prior),
  ));
  if (prior.parameterIdentityHash !== expectedHash) {
    throw new Error("five-wall fixed-prior identity hash is stale");
  }
}

function buildFixedPrior(): NormalAdultFiveWallPriorV1 {
  assertNormalAdultAtrialPassiveConstructionV1(
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1,
  );
  const atria = NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.atria;
  const wallGeometryParameters: TriSegWallRecordV1<TriSegWallGeometryParametersV1> =
    Object.freeze({
      LVFW: Object.freeze({
        wallMaterialVolumeM3: 67.07543664065403e-6,
        referenceMidwallAreaM2: 0.009354352893865039,
      }),
      SEP: Object.freeze({
        wallMaterialVolumeM3: 35.77356620834881e-6,
        referenceMidwallAreaM2: 0.003965081992591075,
      }),
      RVFW: Object.freeze({
        wallMaterialVolumeM3: 36.08736942070275e-6,
        referenceMidwallAreaM2: 0.012911294586037828,
      }),
    });
  const loadedCoordinates: TriSegCoordinatesV1 = Object.freeze({
    septalMidwallCapVolumeM3: 42e-6,
    junctionRadiusM: 0.033,
  });
  const loadedReferenceGeometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: 144.4e-6,
    rightVentricularCavityVolumeM3: 155.8e-6,
    coordinates: loadedCoordinates,
    walls: wallGeometryParameters,
  });
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    if (Math.abs(loadedReferenceGeometry.walls[wallId].geometryStretch - 1.1)
      > 2e-14) {
      throw new Error(`${wallId} fixed reference area does not replay lambda=1.1`);
    }
  }
  const atrialPassive =
    NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.equilibriumPassive.compiled;
  const ventricularPassive = compileKlotzNormalCenterVentricularPassiveV1();
  const wallMaterialByWall = Object.freeze({
    LA: ATRIAL_WALL_MATERIAL,
    RA: ATRIAL_WALL_MATERIAL,
    LVFW: VENTRICULAR_WALL_MATERIAL,
    SEP: VENTRICULAR_WALL_MATERIAL,
    RVFW: VENTRICULAR_WALL_MATERIAL,
  });

  const payload = {
    priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID,
    status: "fixed-normal-construction-candidate" as const,
    bodySurfaceAreaM2: 1.9 as const,
    myocardialDensityKgPerM3: 1053 as const,
    anatomy: {
      sources: {
        atrialPhasicVolumeDoi: "10.1038/s41598-017-03377-6" as const,
        leftAtrialMassDoi: "10.1016/j.carpath.2020.107265" as const,
        totalAtrialMassBoundary:
          "forensic-sex-neutral-total-atrial-mass-52g-at-BSA-1.9-with-RA-as-residual" as const,
        ventricularCmrDoi: "10.1186/1532-429X-18-S1-O75" as const,
        triSegGeometryDoi: "10.1007/s10439-009-9774-2" as const,
        myocardialDensityDoi: "10.1152/ajpheart.00478.2003" as const,
        identificationBoundary:
          "population-center-construction-not-one-subject-multimodal-measurement" as const,
      },
      atria,
      triSeg: {
        leftVentricularEndDiastolicVolumeMl: 144.4 as const,
        leftVentricularEndSystolicVolumeMl: 53.2 as const,
        rightVentricularEndDiastolicVolumeMl: 155.8 as const,
        rightVentricularEndSystolicVolumeMl: 66.5 as const,
        wallGeometryParameters,
        loadedCoordinates,
        loadedReferenceGeometry,
        targetFiberStretchAtLoadedReference: 1.1 as const,
        targetStretchIdentificationBoundary:
          "construction-prior-not-direct-human-measurement" as const,
      },
    },
    passive: {
      atrial: {
        compiled: atrialPassive,
        sharedBy: ["LA", "RA"] as const,
        rightAtriumEvidenceBoundary:
          "human-LA-material-extrapolated-to-RA" as const,
      },
      ventricular: {
        compiled: ventricularPassive,
        sharedBy: ["LVFW", "SEP", "RVFW"] as const,
        identificationBoundary:
          "normal-center-Klotz-organ-EDPVR-construction-not-direct-tissue-law" as const,
      },
    },
    active: {
      atrialLand: ATRIAL_LAND_PARAMETER_SET,
      ventricularLand: VENTRICULAR_LAND_PARAMETER_SET,
      atrialWallMaterial: ATRIAL_WALL_MATERIAL,
      ventricularWallMaterial: VENTRICULAR_WALL_MATERIAL,
      wallMaterialByWall,
    },
    sls: {
      atrial: ATRIAL_SLS_PARAMS,
      ventricular: VENTRICULAR_SLS_PARAMS,
      sourceProjection: {
        sourceDoi: "10.1016/j.actbio.2022.08.043" as const,
        sourcePreparation: "healthy-adult-ovine-RV-free-wall" as const,
        selectedPronyCoefficient: 0.13 as const,
        selectedPronyTimeSec: 0.3 as const,
        modulusRule: "E_v=G1/(1-G1)*K_eq_reference" as const,
        crossWallEvidenceBoundary:
          "ovine-RV-fast-branch-projected-to-one-shared-branch-per-tissue-class" as const,
      },
      removalPolicy:
        "remove-the-state-if-fixed-on-off-ablation-shows-no-material-hysteresis-effect" as const,
    },
    parameterPolicy: {
      fixedNormal: [
        "myocardial-density",
        "Land-kinetic-class",
        "land-slack-stretch",
        "orientation-fraction",
        "numerical-generalized-force-scale",
      ],
      futurePatientFitOnlyWithIndependentData: [
        "blood-volumes-and-wall-mass-from-CMR-or-CT",
        "unloaded-reference-and-passive-scale-from-pressure-volume-data",
        "viable-active-fraction-from-scar-or-LGE",
        "Tref-or-calcium-amplitude-from-independent-contractility-data",
        "SLS-modulus-and-time-from-relaxation-or-strain-rate-data",
      ],
      forbiddenJointFits: [
        "Tref-calcium-amplitude-viability-and-orientation-from-one-PV-loop",
        "unloaded-reference-and-passive-stiffness-from-PV-shape-alone",
      ],
    },
    excluded: {
      laaBodyCompartmentsIncluded: false as const,
      pericardiumIncluded: false as const,
      additionalMaxwellBranchesIncluded: false as const,
      wallWisePressureGainsIncluded: false as const,
    },
    claim: NORMAL_ADULT_FIVE_WALL_PRIOR_CLAIM_V1,
  };

  const prior = deepFreeze({
    ...payload,
    parameterIdentityHash: stableHash(sanitizeForStableHash(
      normalAdultFiveWallPriorHashInputV1(payload),
    )),
  }) as NormalAdultFiveWallPriorV1;
  fixedPriorRegistry.add(prior);
  validateFixedConstruction(prior);
  return prior;
}

function validateFixedConstruction(prior: NormalAdultFiveWallPriorV1): void {
  if (
    prior.anatomy.atria !== NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.atria
    || prior.passive.atrial.compiled
      !== NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.equilibriumPassive.compiled
    || prior.sls.atrial
      !== NORMAL_ADULT_ATRIAL_PASSIVE_CONSTRUCTION_V1.slsByAtrium.LA.derivedOnParams
  ) throw new Error("five-wall prior must re-export the atrial passive bundle");
  for (const material of [
    prior.active.atrialWallMaterial,
    prior.active.ventricularWallMaterial,
  ]) {
    if (
      material.landSlackStretch !== 1
      || material.orientationFraction01 !== 1
      || material.viableActiveFraction01 !== 1
    ) throw new Error("fixed normal wall material must not contain hidden gains");
  }
  if (
    prior.active.atrialWallMaterial.sls !== prior.sls.atrial
    || prior.active.ventricularWallMaterial.sls !== prior.sls.ventricular
  ) throw new Error("five-wall material and SLS class identities diverged");
}

function wallMaterialHashInput(params: LandSlsWallMaterialParamsV1): unknown {
  return {
    parameterSetId: params.parameterSetId,
    landParameterSetStableHash:
      params.landEquationParameters.parameterSetStableHash,
    landSlackStretch: params.landSlackStretch,
    orientationFraction01: params.orientationFraction01,
    viableActiveFraction01: params.viableActiveFraction01,
    sls: params.sls,
  };
}

function cloneLandParameterSet(
  source: Land2017SourceParameterSet,
): Land2017SourceParameterSet {
  return deepFreeze({
    ...source,
    values: { ...source.values },
    derived: { ...source.derived },
    sourceParameters: source.sourceParameters.map((entry) => ({
      ...entry,
      original: { ...entry.original },
      runtime: { ...entry.runtime },
    })),
    derivedParameters: source.derivedParameters.map((entry) => ({ ...entry })),
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
}

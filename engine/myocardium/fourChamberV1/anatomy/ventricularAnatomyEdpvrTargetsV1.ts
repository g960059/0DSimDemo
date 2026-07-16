import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

const CUBIC_METER_PER_MILLILITER = 1e-6;
const KILOGRAM_PER_GRAM = 1e-3;
const SQUARE_METER_PER_SQUARE_CENTIMETER = 1e-4;
const PASCAL_PER_MMHG = 133.322387415;

export const VENTRICULAR_ANATOMY_EDPVR_TARGET_LAYER_V1_ID =
  "ventricular-anatomy-edpvr-target-layer-v1" as const;

export type CenterReferenceIntervalV1 = Readonly<{
  lower: number;
  center: number;
  upper: number;
}>;

export type VentricularAnatomyEvidenceSourceV1 = Readonly<{
  sourceId: string;
  evidenceClass:
    | "pooled-adult-cmr-meta-analysis"
    | "primary-model-initialization-seed"
    | "myocardial-composition-density-prior"
    | "primary-ex-vivo-human-edpvr-study";
  title: string;
  doi: string;
  url: string;
  sourceLocation: string;
  claimBoundary: string;
}>;

export const VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1 = deepFreeze({
  pooledCmr: {
    sourceId: "zhan-2016-pooled-adult-cmr-reference-v1",
    evidenceClass: "pooled-adult-cmr-meta-analysis",
    title: "Derivation of consolidated normal reference values for right and left ventricular quantification by cardiac magnetic resonance using a novel meta-analytic approach",
    doi: "10.1186/1532-429X-18-S1-O75",
    url: "https://doi.org/10.1186/1532-429X-18-S1-O75",
    sourceLocation: "Table 1, pooled mean and lower/upper normal reference limits",
    claimBoundary: "Population imaging anchor; not unloaded geometry, a TriSeg wall parameter set, or a patient-specific fit.",
  },
  triSegInitialization: {
    sourceId: "lumens-2009-triseg-original-initialization-seed-v1",
    evidenceClass: "primary-model-initialization-seed",
    title: "Three-Wall Segment (TriSeg) Model Describing Mechanics and Hemodynamics of Ventricular Interaction",
    doi: "10.1007/s10439-009-9774-2",
    url: "https://doi.org/10.1007/s10439-009-9774-2",
    sourceLocation: "Table 1, parameter values for model initialization",
    claimBoundary: "Published model initialization seed; not a pooled normal-human CMR reference interval.",
  },
  myocardialDensity: {
    sourceId: "vinnakota-bassingthwaighte-2004-myocardial-density-prior-v1",
    evidenceClass: "myocardial-composition-density-prior",
    title: "Myocardial density and composition: a basis for calculating intracellular metabolite concentrations",
    doi: "10.1152/ajpheart.00478.2003",
    url: "https://doi.org/10.1152/ajpheart.00478.2003",
    sourceLocation: "Predicted normal myocardial tissue density",
    claimBoundary: "Composition-model density prior; not a direct CMR measurement and not a disease-invariant biological constant.",
  },
  klotzEdpvr: {
    sourceId: "klotz-2006-normalized-edpvr-v1",
    evidenceClass: "primary-ex-vivo-human-edpvr-study",
    title: "Single-beat estimation of end-diastolic pressure-volume relationship: a novel method with potential for noninvasive application",
    doi: "10.1152/ajpheart.01240.2005",
    url: "https://doi.org/10.1152/ajpheart.01240.2005",
    sourceLocation: "Equations 1-8, normalized EDPVR and single-point V0/V30 estimation",
    claimBoundary: "Group-level normalized LV EDPVR target; not a myocardial constitutive law or an RV EDPVR claim.",
  },
} satisfies Readonly<Record<string, VentricularAnatomyEvidenceSourceV1>>);

export type PooledCmrVentricularIndexReferenceV1 = Readonly<{
  referenceId: "zhan-2016-pooled-adult-cmr-index-reference-si-v1";
  sourceId: string;
  evidenceStatus: "pooled-population-reference-not-model-geometry";
  population: Readonly<{
    species: "human";
    ageRangeYears: readonly [18, 80];
    sexAggregation: "pooled-balanced-male-female";
    trainedAthletesExcluded: true;
  }>;
  leftVentricle: Readonly<{
    endDiastolicVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    endSystolicVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    strokeVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    ejectionFraction: CenterReferenceIntervalV1;
    myocardialMassIndexIncludingSeptumKgPerM2: CenterReferenceIntervalV1;
    massOwnership: "cmr-lv-mass-includes-interventricular-septum";
  }>;
  rightVentricle: Readonly<{
    endDiastolicVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    endSystolicVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    strokeVolumeIndexM3PerM2: CenterReferenceIntervalV1;
    ejectionFraction: CenterReferenceIntervalV1;
    myocardialMassIndexKgPerM2: CenterReferenceIntervalV1;
    triSegMassOwnership: "rv-free-wall-with-septum-owned-by-cmr-lv-mass";
  }>;
  measurementCaveats: readonly string[];
}>;

export const POOLED_CMR_VENTRICULAR_INDEX_REFERENCE_SI_V1:
PooledCmrVentricularIndexReferenceV1 = deepFreeze({
  referenceId: "zhan-2016-pooled-adult-cmr-index-reference-si-v1",
  sourceId: VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1.pooledCmr.sourceId,
  evidenceStatus: "pooled-population-reference-not-model-geometry",
  population: {
    species: "human",
    ageRangeYears: [18, 80],
    sexAggregation: "pooled-balanced-male-female",
    trainedAthletesExcluded: true,
  },
  leftVentricle: {
    endDiastolicVolumeIndexM3PerM2: scaledInterval(53, 76, 99, CUBIC_METER_PER_MILLILITER),
    endSystolicVolumeIndexM3PerM2: scaledInterval(15, 28, 40, CUBIC_METER_PER_MILLILITER),
    strokeVolumeIndexM3PerM2: scaledInterval(35, 49, 63, CUBIC_METER_PER_MILLILITER),
    ejectionFraction: scaledInterval(53, 64, 74, 0.01),
    myocardialMassIndexIncludingSeptumKgPerM2: scaledInterval(39, 57, 75, KILOGRAM_PER_GRAM),
    massOwnership: "cmr-lv-mass-includes-interventricular-septum",
  },
  rightVentricle: {
    endDiastolicVolumeIndexM3PerM2: scaledInterval(57, 82, 108, CUBIC_METER_PER_MILLILITER),
    endSystolicVolumeIndexM3PerM2: scaledInterval(20, 35, 49, CUBIC_METER_PER_MILLILITER),
    strokeVolumeIndexM3PerM2: scaledInterval(33, 47, 62, CUBIC_METER_PER_MILLILITER),
    ejectionFraction: scaledInterval(47, 58, 69, 0.01),
    myocardialMassIndexKgPerM2: scaledInterval(13, 20, 27, KILOGRAM_PER_GRAM),
    triSegMassOwnership: "rv-free-wall-with-septum-owned-by-cmr-lv-mass",
  },
  measurementCaveats: [
    "The source pools rather than sex-stratifies the reference values; it is used here as a sex-neutral construction anchor, not an individual reference interval.",
    "Papillary-muscle contour convention materially changes ventricular mass limits.",
    "CMR end-diastolic cavity geometry is loaded and must not be copied into an unloaded TriSeg reference area.",
  ],
});

export type PooledCmrVentricularBsaAnchorV1 = Readonly<{
  anchorId: "zhan-2016-pooled-adult-cmr-bsa-scaled-anchor-si-v1";
  sourceId: string;
  evidenceStatus: "population-anchor-not-unloaded-geometry-or-wall-parameter-set";
  bodySurfaceAreaM2: number;
  leftVentricle: Readonly<{
    endDiastolicVolumeM3: CenterReferenceIntervalV1;
    endSystolicVolumeM3: CenterReferenceIntervalV1;
    strokeVolumeM3: CenterReferenceIntervalV1;
    ejectionFraction: CenterReferenceIntervalV1;
    myocardialMassIncludingSeptumKg: CenterReferenceIntervalV1;
    massOwnership: "cmr-lv-mass-includes-interventricular-septum";
  }>;
  rightVentricle: Readonly<{
    endDiastolicVolumeM3: CenterReferenceIntervalV1;
    endSystolicVolumeM3: CenterReferenceIntervalV1;
    strokeVolumeM3: CenterReferenceIntervalV1;
    ejectionFraction: CenterReferenceIntervalV1;
    myocardialMassKg: CenterReferenceIntervalV1;
    triSegMassOwnership: "rv-free-wall-with-septum-owned-by-cmr-lv-mass";
  }>;
}>;

export function createPooledCmrVentricularBsaAnchorV1(
  bodySurfaceAreaM2: number,
): PooledCmrVentricularBsaAnchorV1 {
  const bsa = requirePositiveFinite(bodySurfaceAreaM2, "bodySurfaceAreaM2");
  const indexed = POOLED_CMR_VENTRICULAR_INDEX_REFERENCE_SI_V1;
  return deepFreeze({
    anchorId: "zhan-2016-pooled-adult-cmr-bsa-scaled-anchor-si-v1",
    sourceId: indexed.sourceId,
    evidenceStatus: "population-anchor-not-unloaded-geometry-or-wall-parameter-set",
    bodySurfaceAreaM2: bsa,
    leftVentricle: {
      endDiastolicVolumeM3: multiplyInterval(indexed.leftVentricle.endDiastolicVolumeIndexM3PerM2, bsa),
      endSystolicVolumeM3: multiplyInterval(indexed.leftVentricle.endSystolicVolumeIndexM3PerM2, bsa),
      strokeVolumeM3: multiplyInterval(indexed.leftVentricle.strokeVolumeIndexM3PerM2, bsa),
      ejectionFraction: indexed.leftVentricle.ejectionFraction,
      myocardialMassIncludingSeptumKg: multiplyInterval(
        indexed.leftVentricle.myocardialMassIndexIncludingSeptumKgPerM2,
        bsa,
      ),
      massOwnership: indexed.leftVentricle.massOwnership,
    },
    rightVentricle: {
      endDiastolicVolumeM3: multiplyInterval(indexed.rightVentricle.endDiastolicVolumeIndexM3PerM2, bsa),
      endSystolicVolumeM3: multiplyInterval(indexed.rightVentricle.endSystolicVolumeIndexM3PerM2, bsa),
      strokeVolumeM3: multiplyInterval(indexed.rightVentricle.strokeVolumeIndexM3PerM2, bsa),
      ejectionFraction: indexed.rightVentricle.ejectionFraction,
      myocardialMassKg: multiplyInterval(indexed.rightVentricle.myocardialMassIndexKgPerM2, bsa),
      triSegMassOwnership: indexed.rightVentricle.triSegMassOwnership,
    },
  });
}

export const POOLED_CMR_SEX_NEUTRAL_BSA_1P9_ANCHOR_SI_V1 =
  createPooledCmrVentricularBsaAnchorV1(1.9);

export const MYOCARDIAL_DENSITY_PRIOR_SI_V1 = deepFreeze({
  priorId: "vinnakota-bassingthwaighte-2004-myocardial-density-prior-v1",
  sourceId: VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1.myocardialDensity.sourceId,
  evidenceStatus: "composition-model-prior-not-direct-cmr-measurement",
  densityKgPerM3: 1_053,
  originalReportedDensityGramPerMilliliter: 1.053,
  claimBoundary: "Fixed normal-construction conversion prior; disease-specific density variation is outside v1.",
} as const);

export const TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1 = deepFreeze({
  seedId: "lumens-2009-original-triseg-initialization-seed-si-v1",
  sourceId: VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1.triSegInitialization.sourceId,
  evidenceStatus: "published-model-initialization-seed-not-cmr-population-anchor",
  walls: {
    LVFW: {
      sourceWallLabel: "LW",
      wallMaterialVolumeM3: 75 * CUBIC_METER_PER_MILLILITER,
      referenceMidwallAreaM2: 80 * SQUARE_METER_PER_SQUARE_CENTIMETER,
    },
    SEP: {
      sourceWallLabel: "SW",
      wallMaterialVolumeM3: 40 * CUBIC_METER_PER_MILLILITER,
      referenceMidwallAreaM2: 45 * SQUARE_METER_PER_SQUARE_CENTIMETER,
    },
    RVFW: {
      sourceWallLabel: "RW",
      wallMaterialVolumeM3: 30 * CUBIC_METER_PER_MILLILITER,
      referenceMidwallAreaM2: 100 * SQUARE_METER_PER_SQUARE_CENTIMETER,
    },
  },
  coordinates: {
    septalMidwallCapVolumeM3: 42 * CUBIC_METER_PER_MILLILITER,
    junctionRadiusM: 3.3e-2,
    sourceLocation: "Table 1, initial V_m,S and y_m",
  },
  claimBoundary: {
    normalHumanPopulationReference: false,
    unloadedGeometryForBsa1p9Anchor: false,
    directCmrMeasurement: false,
    eligibleAsExplicitInitializationOrPartitionPrior: true,
  },
} as const);

export const TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1 = deepFreeze({
  partitionPriorId: "lumens-2009-initialization-lvfw-septal-volume-ratio-v1",
  sourceId: TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1.sourceId,
  evidenceStatus: "model-seed-ratio-not-population-septal-mass-fraction",
  septalFractionOfCmrLeftVentricularMass:
    TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1.walls.SEP.wallMaterialVolumeM3
    / (
      TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1.walls.LVFW.wallMaterialVolumeM3
      + TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1.walls.SEP.wallMaterialVolumeM3
    ),
  basis: "published-SW-over-LW-plus-SW-initialization-wall-volume",
} as const);

export type CmrInclusiveLvMassPartitionInputV1 = Readonly<{
  leftVentricularMassIncludingSeptumKg: number;
  rightVentricularFreeWallMassKg: number;
  septalFractionOfLeftVentricularMass: number;
  partitionPriorId: string;
}>;

export type TriSegWallMassAndVolumePartitionV1 = Readonly<{
  partitionId: "cmr-inclusive-lv-mass-to-triseg-walls-v1";
  partitionPriorId: string;
  densityPriorId: string;
  myocardialDensityKgPerM3: number;
  cmrMassOwnership: Readonly<{
    leftVentricularInput: "includes-interventricular-septum";
    rightVentricularInput: "rv-free-wall-with-septum-excluded";
  }>;
  wallMassKg: Readonly<Record<"LVFW" | "SEP" | "RVFW", number>>;
  wallMaterialVolumeM3: Readonly<Record<"LVFW" | "SEP" | "RVFW", number>>;
  audit: Readonly<{
    reconstructedLeftVentricularMassIncludingSeptumKg: number;
    inputTotalCmrVentricularMassKg: number;
    triSegWallMassSumKg: number;
    absoluteMassClosureErrorKg: number;
    septumCountedExactlyOnce: true;
  }>;
}>;

/**
 * Partitions the CMR LV mass, which already owns the interventricular septum,
 * into the LV free wall and septum. The RV input is therefore the RV free-wall
 * mass. This API never adds the derived septal mass back to the inclusive CMR
 * LV mass when computing the total.
 */
export function partitionCmrVentricularMassToTriSegWallsV1(
  input: CmrInclusiveLvMassPartitionInputV1,
): TriSegWallMassAndVolumePartitionV1 {
  assertExactPlainRecordV1(input, [
    "leftVentricularMassIncludingSeptumKg",
    "rightVentricularFreeWallMassKg",
    "septalFractionOfLeftVentricularMass",
    "partitionPriorId",
  ], "input");
  const inclusiveLvMassKg = requirePositiveFinite(
    input.leftVentricularMassIncludingSeptumKg,
    "leftVentricularMassIncludingSeptumKg",
  );
  const rvFreeWallMassKg = requirePositiveFinite(
    input.rightVentricularFreeWallMassKg,
    "rightVentricularFreeWallMassKg",
  );
  const septalFraction = requireOpenUnitInterval(
    input.septalFractionOfLeftVentricularMass,
    "septalFractionOfLeftVentricularMass",
  );
  const partitionPriorId = requireNonEmptyString(input.partitionPriorId, "partitionPriorId");
  const densityKgPerM3 = MYOCARDIAL_DENSITY_PRIOR_SI_V1.densityKgPerM3;

  const septalMassKg = inclusiveLvMassKg * septalFraction;
  const lvFreeWallMassKg = inclusiveLvMassKg - septalMassKg;
  const wallMassKg = Object.freeze({
    LVFW: requirePositiveFinite(lvFreeWallMassKg, "derived LVFW mass"),
    SEP: requirePositiveFinite(septalMassKg, "derived SEP mass"),
    RVFW: rvFreeWallMassKg,
  });
  const wallMaterialVolumeM3 = Object.freeze({
    LVFW: wallMassKg.LVFW / densityKgPerM3,
    SEP: wallMassKg.SEP / densityKgPerM3,
    RVFW: wallMassKg.RVFW / densityKgPerM3,
  });
  for (const [wallId, volumeM3] of Object.entries(wallMaterialVolumeM3)) {
    requirePositiveFinite(volumeM3, `derived ${wallId} wallMaterialVolumeM3`);
  }

  const reconstructedInclusiveLvMassKg = wallMassKg.LVFW + wallMassKg.SEP;
  const inputTotalCmrVentricularMassKg = inclusiveLvMassKg + rvFreeWallMassKg;
  const triSegWallMassSumKg = reconstructedInclusiveLvMassKg + wallMassKg.RVFW;
  const absoluteMassClosureErrorKg = Math.abs(
    inputTotalCmrVentricularMassKg - triSegWallMassSumKg,
  );
  const closureToleranceKg = 32 * Number.EPSILON
    * Math.max(1, inputTotalCmrVentricularMassKg, triSegWallMassSumKg);
  if (absoluteMassClosureErrorKg > closureToleranceKg) {
    throw new Error("CMR-to-TriSeg mass partition lost mass closure");
  }

  return deepFreeze({
    partitionId: "cmr-inclusive-lv-mass-to-triseg-walls-v1",
    partitionPriorId,
    densityPriorId: MYOCARDIAL_DENSITY_PRIOR_SI_V1.priorId,
    myocardialDensityKgPerM3: densityKgPerM3,
    cmrMassOwnership: {
      leftVentricularInput: "includes-interventricular-septum",
      rightVentricularInput: "rv-free-wall-with-septum-excluded",
    },
    wallMassKg,
    wallMaterialVolumeM3,
    audit: {
      reconstructedLeftVentricularMassIncludingSeptumKg: reconstructedInclusiveLvMassKg,
      inputTotalCmrVentricularMassKg,
      triSegWallMassSumKg,
      absoluteMassClosureErrorKg,
      septumCountedExactlyOnce: true,
    },
  });
}

export const KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1 = deepFreeze({
  targetId: "klotz-2006-normalized-lv-edpvr-target-si-v1",
  sourceId: VENTRICULAR_ANATOMY_EDPVR_EVIDENCE_SOURCES_V1.klotzEdpvr.sourceId,
  evidenceStatus: "group-normalized-lv-target-not-wall-material-law",
  normalizedPressureScalePa: 28.2 * PASCAL_PER_MMHG,
  normalizedExponent: 2.79,
  sourceV30PressurePa: 30 * PASCAL_PER_MMHG,
  v0MeasuredVolumeIntercept: 0.6,
  v0PressureSlopePerPa: 0.006 / PASCAL_PER_MMHG,
  units: {
    pressure: "Pa",
    volume: "m^3",
    normalizedVolume: "1",
    tangent: "Pa/m^3",
  },
  sourceFormulaCaveat: "V30 is the source normalization-volume name. The least-squares normalized pressure scale is 28.2 mmHg, so normalized volume 1 evaluates to 28.2 rather than exactly 30 mmHg.",
  claimBoundary: {
    leftVentricleOnly: true,
    rightVentricularTargetClaimed: false,
    patientSpecificMaterialLawClaimed: false,
    validSinglePointPressureDomain: "0 < measured EDP < 30 mmHg",
  },
} as const);

export type KlotzSinglePointEdpvrInputV1 = Readonly<{
  measuredEndDiastolicVolumeM3: number;
  measuredEndDiastolicPressurePa: number;
}>;

export type KlotzSinglePointEdpvrInversionV1 = Readonly<{
  inversionId: "klotz-2006-single-point-v0-v30-inversion-si-v1";
  targetId: typeof KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1.targetId;
  sourceId: string;
  measuredEndDiastolicVolumeM3: number;
  measuredEndDiastolicPressurePa: number;
  estimatedZeroPressureVolumeM3: number;
  estimatedV30NormalizationVolumeM3: number;
  normalizedMeasuredVolume: number;
  normalizationVolumeSpanM3: number;
}>;

export type KlotzNormalizedEdpvrEvaluationV1 = Readonly<{
  targetId: typeof KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1.targetId;
  cavityVolumeM3: number;
  normalizedVolume: number;
  pressurePa: number;
  tangentPaPerM3: number;
  withinV30NormalizationVolumeScale: boolean;
}>;

const klotzInversionRegistryV1 = new WeakSet<object>();

export function invertKlotz2006SinglePointEdpvrV1(
  input: KlotzSinglePointEdpvrInputV1,
): KlotzSinglePointEdpvrInversionV1 {
  assertExactPlainRecordV1(input, [
    "measuredEndDiastolicVolumeM3",
    "measuredEndDiastolicPressurePa",
  ], "input");
  const measuredVolumeM3 = requirePositiveFinite(
    input.measuredEndDiastolicVolumeM3,
    "measuredEndDiastolicVolumeM3",
  );
  const measuredPressurePa = requirePositiveFinite(
    input.measuredEndDiastolicPressurePa,
    "measuredEndDiastolicPressurePa",
  );
  const target = KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1;
  if (measuredPressurePa >= target.sourceV30PressurePa) {
    throw new Error("measuredEndDiastolicPressurePa must be below the 30 mmHg Klotz normalization pressure");
  }

  const estimatedZeroPressureVolumeM3 = measuredVolumeM3 * (
    target.v0MeasuredVolumeIntercept
    - target.v0PressureSlopePerPa * measuredPressurePa
  );
  const normalizedMeasuredVolume = Math.pow(
    measuredPressurePa / target.normalizedPressureScalePa,
    1 / target.normalizedExponent,
  );
  const estimatedV30NormalizationVolumeM3 = estimatedZeroPressureVolumeM3
    + (measuredVolumeM3 - estimatedZeroPressureVolumeM3) / normalizedMeasuredVolume;
  const normalizationVolumeSpanM3 = estimatedV30NormalizationVolumeM3
    - estimatedZeroPressureVolumeM3;

  requirePositiveFinite(estimatedZeroPressureVolumeM3, "estimatedZeroPressureVolumeM3");
  requirePositiveFinite(normalizedMeasuredVolume, "normalizedMeasuredVolume");
  requirePositiveFinite(estimatedV30NormalizationVolumeM3, "estimatedV30NormalizationVolumeM3");
  requirePositiveFinite(normalizationVolumeSpanM3, "normalizationVolumeSpanM3");
  if (!(estimatedZeroPressureVolumeM3 < measuredVolumeM3)) {
    throw new Error("Klotz inversion must place V0 below the measured end-diastolic volume");
  }

  const result: KlotzSinglePointEdpvrInversionV1 = Object.freeze({
    inversionId: "klotz-2006-single-point-v0-v30-inversion-si-v1",
    targetId: target.targetId,
    sourceId: target.sourceId,
    measuredEndDiastolicVolumeM3: measuredVolumeM3,
    measuredEndDiastolicPressurePa: measuredPressurePa,
    estimatedZeroPressureVolumeM3,
    estimatedV30NormalizationVolumeM3,
    normalizedMeasuredVolume,
    normalizationVolumeSpanM3,
  });
  klotzInversionRegistryV1.add(result);
  return result;
}

export function evaluateKlotz2006NormalizedEdpvrTargetV1(
  cavityVolumeM3: number,
  inversion: KlotzSinglePointEdpvrInversionV1,
): KlotzNormalizedEdpvrEvaluationV1 {
  assertKlotz2006SinglePointEdpvrInversionProvenanceV1(inversion);
  const volumeM3 = requireFinite(cavityVolumeM3, "cavityVolumeM3");
  if (volumeM3 < inversion.estimatedZeroPressureVolumeM3) {
    throw new Error("cavityVolumeM3 must be at least the Klotz estimated zero-pressure volume");
  }
  const normalizedVolume = (
    volumeM3 - inversion.estimatedZeroPressureVolumeM3
  ) / inversion.normalizationVolumeSpanM3;
  const target = KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1;
  const pressurePa = target.normalizedPressureScalePa
    * Math.pow(normalizedVolume, target.normalizedExponent);
  const tangentPaPerM3 = normalizedVolume === 0
    ? 0
    : target.normalizedPressureScalePa * target.normalizedExponent
      * Math.pow(normalizedVolume, target.normalizedExponent - 1)
      / inversion.normalizationVolumeSpanM3;
  requireNonNegativeFinite(normalizedVolume, "normalizedVolume");
  requireNonNegativeFinite(pressurePa, "pressurePa");
  requireNonNegativeFinite(tangentPaPerM3, "tangentPaPerM3");

  return Object.freeze({
    targetId: target.targetId,
    cavityVolumeM3: volumeM3,
    normalizedVolume,
    pressurePa,
    tangentPaPerM3,
    withinV30NormalizationVolumeScale: normalizedVolume <= 1,
  });
}

export function assertKlotz2006SinglePointEdpvrInversionProvenanceV1(
  inversion: KlotzSinglePointEdpvrInversionV1,
): void {
  if (!klotzInversionRegistryV1.has(inversion)) {
    throw new Error("Klotz EDPVR inversion must be produced by invertKlotz2006SinglePointEdpvrV1");
  }
}

function scaledInterval(
  lower: number,
  center: number,
  upper: number,
  scale: number,
): CenterReferenceIntervalV1 {
  return freezeValidatedInterval({
    lower: lower * scale,
    center: center * scale,
    upper: upper * scale,
  });
}

function multiplyInterval(
  interval: CenterReferenceIntervalV1,
  scale: number,
): CenterReferenceIntervalV1 {
  return freezeValidatedInterval({
    lower: interval.lower * scale,
    center: interval.center * scale,
    upper: interval.upper * scale,
  });
}

function freezeValidatedInterval(
  interval: CenterReferenceIntervalV1,
): CenterReferenceIntervalV1 {
  if (
    !Number.isFinite(interval.lower)
    || !Number.isFinite(interval.center)
    || !Number.isFinite(interval.upper)
    || !(interval.lower < interval.center && interval.center < interval.upper)
  ) {
    throw new Error("reference interval must be finite and strictly ordered lower < center < upper");
  }
  return Object.freeze({ ...interval });
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requireOpenUnitInterval(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new Error(`${field} must be finite and strictly between 0 and 1`);
  }
  return value;
}

function requireNonEmptyString(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}

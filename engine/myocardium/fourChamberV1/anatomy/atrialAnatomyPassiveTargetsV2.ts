import {
  MYOCARDIAL_DENSITY_PRIOR_SI_V1,
} from "@/engine/myocardium/fourChamberV1/anatomy/ventricularAnatomyEdpvrTargetsV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

const CUBIC_METER_PER_MILLILITER = 1e-6;
const KILOGRAM_PER_GRAM = 1e-3;

export const ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID =
  "atrial-anatomy-passive-target-layer-v2" as const;

export type AtrialChamberIdV2 = "LA" | "RA";
export type AtrialPhasicVolumeIdV2 = "maximum" | "preAtrialContraction" | "minimum";
export type AtrialSensitivityCornerV2 = "lower" | "center" | "upper";

export type AtrialCenterReferenceIntervalV2 = Readonly<{
  lower: number;
  center: number;
  upper: number;
}>;

export type AtrialAnatomyEvidenceSourceV2 = Readonly<{
  sourceId: string;
  evidenceClass:
    | "primary-healthy-adult-ssfp-cmr"
    | "primary-autopsy-la-mass-with-normal-echo-volume"
    | "primary-forensic-autopsy-total-atrial-mass"
    | "myocardial-composition-density-prior";
  title: string;
  doi: string | null;
  url: string;
  sourceLocation: string;
  claimBoundary: string;
}>;

export const ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2 = deepFreeze({
  phasicCmr: {
    sourceId: "li-2017-healthy-chinese-atrial-phasic-cmr-v2",
    evidenceClass: "primary-healthy-adult-ssfp-cmr",
    title: "Reference value of left and right atrial size and phasic function by SSFP CMR at 3.0 T in healthy Chinese adults",
    doi: "10.1038/s41598-017-03377-6",
    url: "https://doi.org/10.1038/s41598-017-03377-6",
    sourceLocation: "Tables 3 and 6, short-axis indexed maximum, pre-atrial-contraction, and minimum volumes",
    claimBoundary: "Healthy Chinese population and one CMR contouring protocol; not an unloaded geometry, a universal multi-ethnic reference, or a pressure-volume loop.",
  },
  leftAtrialMass: {
    sourceId: "flink-2020-normal-volume-autopsy-la-mass-v2",
    evidenceClass: "primary-autopsy-la-mass-with-normal-echo-volume",
    title: "Left atrial mass: relationship between gross anatomy and quantitative echocardiography",
    doi: "10.1016/j.carpath.2020.107265",
    url: "https://doi.org/10.1016/j.carpath.2020.107265",
    sourceLocation: "Results, 17 autopsy specimens with normal echocardiographic LA volume; indexed anatomic LA mass 14.4 +/- 3.2 g/m^2",
    claimBoundary: "Small autopsy cohort selected by normal echocardiographic LA volume; the indexed mass is a construction anchor, not a CMR wall segmentation or a disease-invariant mass.",
  },
  totalAtrialMass: {
    sourceId: "gaurilcikas-2007-forensic-total-atrial-mass-v2",
    evidenceClass: "primary-forensic-autopsy-total-atrial-mass",
    title: "Human heart atria and appendages: morphometry and clinical importance",
    doi: null,
    url: "https://hdl.handle.net/20.500.12512/83288",
    sourceLocation: "Abstract, 31 forensic autopsies without known cardiovascular pathology; total atrial-part mass 54 +/- 6.2 g in men and 50 +/- 5.4 g in women",
    claimBoundary: "The source reports total atrial-part mass, including structures whose ownership need not match the LA-mass study; a sex-neutral 52 g midpoint and BSA scaling are explicit model constructions.",
  },
  myocardialDensity: {
    sourceId: MYOCARDIAL_DENSITY_PRIOR_SI_V1.sourceId,
    evidenceClass: "myocardial-composition-density-prior",
    title: "Myocardial density and composition: a basis for calculating intracellular metabolite concentrations",
    doi: "10.1152/ajpheart.00478.2003",
    url: "https://doi.org/10.1152/ajpheart.00478.2003",
    sourceLocation: "Predicted normal myocardial tissue density",
    claimBoundary: "Composition-model density prior used only to convert mass to material volume; atrial- or disease-specific density is not identified.",
  },
} satisfies Readonly<Record<string, AtrialAnatomyEvidenceSourceV2>>);

export type AtrialIndexedPhasicVolumeReferenceV2 = Readonly<{
  referenceId: "li-2017-short-axis-atrial-phasic-volume-index-reference-si-v2";
  sourceId: string;
  evidenceStatus: "healthy-population-cmr-reference-not-model-geometry";
  population: Readonly<{
    species: "human";
    cohortSize: 135;
    ageRangeYears: readonly [23, 83];
    population: "healthy-chinese-adults";
  }>;
  measurement: Readonly<{
    fieldStrengthTesla: 3;
    sequence: "retrospectively-gated-SSFP";
    volumeMethod: "contiguous-short-axis-Simpson";
    sourceLimits: "reported-mean-plus-or-minus-two-standard-deviations";
  }>;
  indexedCavityVolumeM3PerM2ByAtrium: Readonly<Record<
    AtrialChamberIdV2,
    Readonly<Record<AtrialPhasicVolumeIdV2, AtrialCenterReferenceIntervalV2>>
  >>;
  claimBoundary: Readonly<{
    pressureDataIncluded: false;
    passiveMaterialParametersIncluded: false;
    unloadedReferenceVolumeIncluded: false;
    pvLoopMorphologyIncluded: false;
  }>;
}>;

export const LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2:
AtrialIndexedPhasicVolumeReferenceV2 = deepFreeze({
  referenceId: "li-2017-short-axis-atrial-phasic-volume-index-reference-si-v2",
  sourceId: ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2.phasicCmr.sourceId,
  evidenceStatus: "healthy-population-cmr-reference-not-model-geometry",
  population: {
    species: "human",
    cohortSize: 135,
    ageRangeYears: [23, 83],
    population: "healthy-chinese-adults",
  },
  measurement: {
    fieldStrengthTesla: 3,
    sequence: "retrospectively-gated-SSFP",
    volumeMethod: "contiguous-short-axis-Simpson",
    sourceLimits: "reported-mean-plus-or-minus-two-standard-deviations",
  },
  indexedCavityVolumeM3PerM2ByAtrium: {
    LA: {
      maximum: scaledInterval(25.4, 42.2, 59.1, CUBIC_METER_PER_MILLILITER),
      preAtrialContraction: scaledInterval(15.4, 30.5, 45.6, CUBIC_METER_PER_MILLILITER),
      minimum: scaledInterval(9.8, 18.8, 27.8, CUBIC_METER_PER_MILLILITER),
    },
    RA: {
      maximum: scaledInterval(29.6, 51.6, 73.6, CUBIC_METER_PER_MILLILITER),
      preAtrialContraction: scaledInterval(20.2, 38.2, 56.2, CUBIC_METER_PER_MILLILITER),
      minimum: scaledInterval(9.5, 24.9, 40.4, CUBIC_METER_PER_MILLILITER),
    },
  },
  claimBoundary: {
    pressureDataIncluded: false,
    passiveMaterialParametersIncluded: false,
    unloadedReferenceVolumeIncluded: false,
    pvLoopMorphologyIncluded: false,
  },
});

export const ATRIAL_WALL_MASS_CONSTRUCTION_REFERENCE_SI_V2 = deepFreeze({
  referenceId: "flink-la-plus-gaurilcikas-total-atrial-mass-construction-si-v2",
  leftAtrialWallMassIndexKgPerM2:
    scaledInterval(11.2, 14.4, 17.6, KILOGRAM_PER_GRAM),
  leftAtrialMassSensitivityMeaning: "flink-reported-mean-plus-or-minus-one-standard-deviation",
  totalAtrialMassAtReferenceBsaKg:
    scaledInterval(44.6, 52, 60.2, KILOGRAM_PER_GRAM),
  totalAtrialMassSensitivityMeaning:
    "female-mean-minus-reported-spread-to-male-mean-plus-reported-spread-envelope",
  totalAtrialMassReferenceBodySurfaceAreaM2: 1.9,
  rightAtrialMassRule:
    "scaled-total-atrial-part-mass-minus-independently-indexed-left-atrial-mass",
  rightAtrialMassEvidenceStatus:
    "residual-construction-not-direct-right-atrial-mass-measurement",
  myocardialDensityPriorId: MYOCARDIAL_DENSITY_PRIOR_SI_V1.priorId,
  myocardialDensityKgPerM3: MYOCARDIAL_DENSITY_PRIOR_SI_V1.densityKgPerM3,
} as const);

export type AtrialPhasicVolumeIndexInputV2 = Readonly<Record<
  AtrialPhasicVolumeIdV2,
  number
>>;

export type NormalAdultAtrialAnatomyInputV2 = Readonly<{
  bodySurfaceAreaM2: number;
  leftAtrialPhasicVolumeIndexM3PerM2: AtrialPhasicVolumeIndexInputV2;
  rightAtrialPhasicVolumeIndexM3PerM2: AtrialPhasicVolumeIndexInputV2;
  leftAtrialWallMassIndexKgPerM2: number;
  totalAtrialMassAtReferenceBsaKg: number;
}>;

export type NormalAdultAtrialAnatomySensitivityInputV2 = Readonly<{
  bodySurfaceAreaM2: number;
  phasicVolumeCorner: AtrialSensitivityCornerV2;
  leftAtrialWallMassCorner: AtrialSensitivityCornerV2;
  totalAtrialMassCorner: AtrialSensitivityCornerV2;
}>;

export type NormalAdultAtrialAnatomyAnchorV2 = Readonly<{
  anatomyId: typeof ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID;
  anchorId: "normal-adult-atrial-anatomy-anchor-v2";
  evidenceStatus: "literature-informed-normal-construction-not-unloaded-anatomy";
  sourceIds: readonly string[];
  input: NormalAdultAtrialAnatomyInputV2;
  bodySurfaceAreaM2: number;
  phasicCavityVolumeM3ByAtrium: Readonly<Record<
    AtrialChamberIdV2,
    Readonly<Record<AtrialPhasicVolumeIdV2, number>>
  >>;
  wallMassKgByAtrium: Readonly<Record<AtrialChamberIdV2, number>>;
  wallReferenceMaterialVolumeM3ByAtrium: Readonly<Record<AtrialChamberIdV2, number>>;
  myocardialDensityKgPerM3: number;
  massConstruction: Readonly<{
    totalAtrialMassAtRequestedBsaKg: number;
    totalAtrialMassScalingRule: "linear-from-declared-1p9-m2-reference";
    rightAtrialMassRule: "total-minus-left-residual-construction";
    reconstructedTotalAtrialMassKg: number;
    absoluteMassClosureErrorKg: number;
  }>;
  geometryReferenceConvention: Readonly<{
    referenceCavityVolumeM3ByAtrium: Readonly<Record<AtrialChamberIdV2, number>>;
    convention: "reference-cavity-volume-equals-cmr-minimum-cavity-volume";
    stressFreeMeasurementClaimed: false;
    unloadedMeasurementClaimed: false;
  }>;
  audit: Readonly<{
    phasicVolumesStrictlyOrdered: true;
    rightAtrialWallMassPositive: true;
    totalAtrialMassClosed: true;
    bsaScalingApplied: true;
    pass: true;
  }>;
  claimBoundary: Readonly<{
    rightAtrialMassDirectlyMeasured: false;
    minimumCavityVolumeIsStressFreeMeasurement: false;
    pvLoopPathUsed: false;
    patientSpecific: false;
    physiologicalValidationClaimed: false;
  }>;
  units: Readonly<{
    bodySurfaceArea: "m^2";
    indexedCavityVolume: "m^3/m^2";
    cavityVolume: "m^3";
    mass: "kg";
    density: "kg/m^3";
    wallMaterialVolume: "m^3";
  }>;
}>;

const NORMAL_ADULT_ATRIAL_ANATOMY_ANCHORS_V2 = new WeakSet<object>();

export function createNormalAdultAtrialAnatomyInputFromSensitivityCornersV2(
  input: NormalAdultAtrialAnatomySensitivityInputV2,
): NormalAdultAtrialAnatomyInputV2 {
  assertExactPlainRecordV1(input, [
    "bodySurfaceAreaM2",
    "phasicVolumeCorner",
    "leftAtrialWallMassCorner",
    "totalAtrialMassCorner",
  ], "normal-adult atrial anatomy sensitivity input");
  const bodySurfaceAreaM2 = requirePositiveFinite(
    input.bodySurfaceAreaM2,
    "bodySurfaceAreaM2",
  );
  assertCorner(input.phasicVolumeCorner, "phasicVolumeCorner");
  assertCorner(input.leftAtrialWallMassCorner, "leftAtrialWallMassCorner");
  assertCorner(input.totalAtrialMassCorner, "totalAtrialMassCorner");
  const reference = LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2
    .indexedCavityVolumeM3PerM2ByAtrium;
  const volumeCorner = input.phasicVolumeCorner;
  const massReference = ATRIAL_WALL_MASS_CONSTRUCTION_REFERENCE_SI_V2;
  return deepFreeze({
    bodySurfaceAreaM2,
    leftAtrialPhasicVolumeIndexM3PerM2:
      selectPhasicVolumeCorner(reference.LA, volumeCorner),
    rightAtrialPhasicVolumeIndexM3PerM2:
      selectPhasicVolumeCorner(reference.RA, volumeCorner),
    leftAtrialWallMassIndexKgPerM2:
      massReference.leftAtrialWallMassIndexKgPerM2[input.leftAtrialWallMassCorner],
    totalAtrialMassAtReferenceBsaKg:
      massReference.totalAtrialMassAtReferenceBsaKg[input.totalAtrialMassCorner],
  });
}

export function createNormalAdultAtrialAnatomyCenterInputV2(
  input: Readonly<{ bodySurfaceAreaM2: number }>,
): NormalAdultAtrialAnatomyInputV2 {
  assertExactPlainRecordV1(
    input,
    ["bodySurfaceAreaM2"],
    "normal-adult atrial anatomy center input",
  );
  return createNormalAdultAtrialAnatomyInputFromSensitivityCornersV2({
    bodySurfaceAreaM2: input.bodySurfaceAreaM2,
    phasicVolumeCorner: "center",
    leftAtrialWallMassCorner: "center",
    totalAtrialMassCorner: "center",
  });
}

export function buildNormalAdultAtrialAnatomyAnchorV2(
  input: NormalAdultAtrialAnatomyInputV2,
): NormalAdultAtrialAnatomyAnchorV2 {
  assertAnatomyInput(input);
  const bodySurfaceAreaM2 = requirePositiveFinite(
    input.bodySurfaceAreaM2,
    "bodySurfaceAreaM2",
  );
  const leftIndex = validatePhasicVolumeIndexInput(
    input.leftAtrialPhasicVolumeIndexM3PerM2,
    "leftAtrialPhasicVolumeIndexM3PerM2",
    LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2
      .indexedCavityVolumeM3PerM2ByAtrium.LA,
  );
  const rightIndex = validatePhasicVolumeIndexInput(
    input.rightAtrialPhasicVolumeIndexM3PerM2,
    "rightAtrialPhasicVolumeIndexM3PerM2",
    LI_2017_ATRIAL_INDEXED_PHASIC_VOLUME_REFERENCE_SI_V2
      .indexedCavityVolumeM3PerM2ByAtrium.RA,
  );
  const massReference = ATRIAL_WALL_MASS_CONSTRUCTION_REFERENCE_SI_V2;
  const leftAtrialWallMassIndexKgPerM2 = requireWithinInterval(
    input.leftAtrialWallMassIndexKgPerM2,
    massReference.leftAtrialWallMassIndexKgPerM2,
    "leftAtrialWallMassIndexKgPerM2",
  );
  const totalAtrialMassAtReferenceBsaKg = requireWithinInterval(
    input.totalAtrialMassAtReferenceBsaKg,
    massReference.totalAtrialMassAtReferenceBsaKg,
    "totalAtrialMassAtReferenceBsaKg",
  );
  const frozenInput = deepFreeze({
    bodySurfaceAreaM2,
    leftAtrialPhasicVolumeIndexM3PerM2: leftIndex,
    rightAtrialPhasicVolumeIndexM3PerM2: rightIndex,
    leftAtrialWallMassIndexKgPerM2,
    totalAtrialMassAtReferenceBsaKg,
  });
  const phasicCavityVolumeM3ByAtrium = deepFreeze({
    LA: scalePhasicVolumes(leftIndex, bodySurfaceAreaM2),
    RA: scalePhasicVolumes(rightIndex, bodySurfaceAreaM2),
  });
  const leftAtrialMassKg = leftAtrialWallMassIndexKgPerM2 * bodySurfaceAreaM2;
  const totalAtrialMassAtRequestedBsaKg = totalAtrialMassAtReferenceBsaKg
    * bodySurfaceAreaM2
    / massReference.totalAtrialMassReferenceBodySurfaceAreaM2;
  const rightAtrialMassKg = requirePositiveFinite(
    totalAtrialMassAtRequestedBsaKg - leftAtrialMassKg,
    "derived rightAtrialMassKg",
  );
  const wallMassKgByAtrium = Object.freeze({
    LA: leftAtrialMassKg,
    RA: rightAtrialMassKg,
  });
  const densityKgPerM3 = massReference.myocardialDensityKgPerM3;
  const wallReferenceMaterialVolumeM3ByAtrium = Object.freeze({
    LA: leftAtrialMassKg / densityKgPerM3,
    RA: rightAtrialMassKg / densityKgPerM3,
  });
  const reconstructedTotalAtrialMassKg = leftAtrialMassKg + rightAtrialMassKg;
  const absoluteMassClosureErrorKg = Math.abs(
    reconstructedTotalAtrialMassKg - totalAtrialMassAtRequestedBsaKg,
  );
  const massClosureToleranceKg = 64 * Number.EPSILON
    * Math.max(1, reconstructedTotalAtrialMassKg, totalAtrialMassAtRequestedBsaKg);
  if (absoluteMassClosureErrorKg > massClosureToleranceKg) {
    throw new Error("atrial wall-mass residual construction lost total-mass closure");
  }
  const referenceCavityVolumeM3ByAtrium = Object.freeze({
    LA: phasicCavityVolumeM3ByAtrium.LA.minimum,
    RA: phasicCavityVolumeM3ByAtrium.RA.minimum,
  });
  const anchor: NormalAdultAtrialAnatomyAnchorV2 = deepFreeze({
    anatomyId: ATRIAL_ANATOMY_PASSIVE_TARGET_LAYER_V2_ID,
    anchorId: "normal-adult-atrial-anatomy-anchor-v2",
    evidenceStatus: "literature-informed-normal-construction-not-unloaded-anatomy",
    sourceIds: [
      ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2.phasicCmr.sourceId,
      ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2.leftAtrialMass.sourceId,
      ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2.totalAtrialMass.sourceId,
      ATRIAL_ANATOMY_EVIDENCE_SOURCES_V2.myocardialDensity.sourceId,
    ],
    input: frozenInput,
    bodySurfaceAreaM2,
    phasicCavityVolumeM3ByAtrium,
    wallMassKgByAtrium,
    wallReferenceMaterialVolumeM3ByAtrium,
    myocardialDensityKgPerM3: densityKgPerM3,
    massConstruction: {
      totalAtrialMassAtRequestedBsaKg,
      totalAtrialMassScalingRule: "linear-from-declared-1p9-m2-reference",
      rightAtrialMassRule: "total-minus-left-residual-construction",
      reconstructedTotalAtrialMassKg,
      absoluteMassClosureErrorKg,
    },
    geometryReferenceConvention: {
      referenceCavityVolumeM3ByAtrium,
      convention: "reference-cavity-volume-equals-cmr-minimum-cavity-volume",
      stressFreeMeasurementClaimed: false,
      unloadedMeasurementClaimed: false,
    },
    audit: {
      phasicVolumesStrictlyOrdered: true,
      rightAtrialWallMassPositive: true,
      totalAtrialMassClosed: true,
      bsaScalingApplied: true,
      pass: true,
    },
    claimBoundary: {
      rightAtrialMassDirectlyMeasured: false,
      minimumCavityVolumeIsStressFreeMeasurement: false,
      pvLoopPathUsed: false,
      patientSpecific: false,
      physiologicalValidationClaimed: false,
    },
    units: {
      bodySurfaceArea: "m^2",
      indexedCavityVolume: "m^3/m^2",
      cavityVolume: "m^3",
      mass: "kg",
      density: "kg/m^3",
      wallMaterialVolume: "m^3",
    },
  });
  NORMAL_ADULT_ATRIAL_ANATOMY_ANCHORS_V2.add(anchor);
  return anchor;
}

export function assertNormalAdultAtrialAnatomyAnchorV2(
  anchor: NormalAdultAtrialAnatomyAnchorV2,
): NormalAdultAtrialAnatomyAnchorV2 {
  if (
    anchor === null
    || typeof anchor !== "object"
    || !NORMAL_ADULT_ATRIAL_ANATOMY_ANCHORS_V2.has(anchor)
  ) {
    throw new Error("atrial anatomy anchor must be a live canonical artifact");
  }
  return anchor;
}

function assertAnatomyInput(input: NormalAdultAtrialAnatomyInputV2): void {
  assertExactPlainRecordV1(input, [
    "bodySurfaceAreaM2",
    "leftAtrialPhasicVolumeIndexM3PerM2",
    "rightAtrialPhasicVolumeIndexM3PerM2",
    "leftAtrialWallMassIndexKgPerM2",
    "totalAtrialMassAtReferenceBsaKg",
  ], "normal-adult atrial anatomy input");
}

function validatePhasicVolumeIndexInput(
  value: AtrialPhasicVolumeIndexInputV2,
  field: string,
  allowed: Readonly<Record<AtrialPhasicVolumeIdV2, AtrialCenterReferenceIntervalV2>>,
): AtrialPhasicVolumeIndexInputV2 {
  assertExactPlainRecordV1(value, [
    "maximum",
    "preAtrialContraction",
    "minimum",
  ], field);
  const result = Object.freeze({
    maximum: requireWithinInterval(value.maximum, allowed.maximum, `${field}.maximum`),
    preAtrialContraction: requireWithinInterval(
      value.preAtrialContraction,
      allowed.preAtrialContraction,
      `${field}.preAtrialContraction`,
    ),
    minimum: requireWithinInterval(value.minimum, allowed.minimum, `${field}.minimum`),
  });
  if (!(result.maximum > result.preAtrialContraction
    && result.preAtrialContraction > result.minimum)) {
    throw new Error(`${field} must satisfy maximum > preAtrialContraction > minimum`);
  }
  return result;
}

function selectPhasicVolumeCorner(
  intervals: Readonly<Record<AtrialPhasicVolumeIdV2, AtrialCenterReferenceIntervalV2>>,
  corner: AtrialSensitivityCornerV2,
): AtrialPhasicVolumeIndexInputV2 {
  return Object.freeze({
    maximum: intervals.maximum[corner],
    preAtrialContraction: intervals.preAtrialContraction[corner],
    minimum: intervals.minimum[corner],
  });
}

function scalePhasicVolumes(
  indexed: AtrialPhasicVolumeIndexInputV2,
  bodySurfaceAreaM2: number,
): AtrialPhasicVolumeIndexInputV2 {
  return Object.freeze({
    maximum: indexed.maximum * bodySurfaceAreaM2,
    preAtrialContraction: indexed.preAtrialContraction * bodySurfaceAreaM2,
    minimum: indexed.minimum * bodySurfaceAreaM2,
  });
}

function scaledInterval(
  lower: number,
  center: number,
  upper: number,
  scale: number,
): AtrialCenterReferenceIntervalV2 {
  return freezeInterval({
    lower: lower * scale,
    center: center * scale,
    upper: upper * scale,
  });
}

function freezeInterval(
  interval: AtrialCenterReferenceIntervalV2,
): AtrialCenterReferenceIntervalV2 {
  if (
    !Number.isFinite(interval.lower)
    || !Number.isFinite(interval.center)
    || !Number.isFinite(interval.upper)
    || !(interval.lower < interval.center && interval.center < interval.upper)
  ) {
    throw new Error("atrial reference interval must satisfy finite lower < center < upper");
  }
  return Object.freeze({ ...interval });
}

function requireWithinInterval(
  value: number,
  interval: AtrialCenterReferenceIntervalV2,
  field: string,
): number {
  requirePositiveFinite(value, field);
  const tolerance = 16 * Number.EPSILON
    * Math.max(1, Math.abs(interval.lower), Math.abs(interval.upper));
  if (value < interval.lower - tolerance || value > interval.upper + tolerance) {
    throw new Error(
      `${field} must remain within the declared normal-adult sensitivity interval`,
    );
  }
  return value;
}

function assertCorner(value: string, field: string): asserts value is AtrialSensitivityCornerV2 {
  if (value !== "lower" && value !== "center" && value !== "upper") {
    throw new Error(`${field} must be lower, center, or upper`);
  }
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
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

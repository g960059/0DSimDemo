import type {
  BloodCompartmentId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import type {
  LinearVascularComplianceParametersV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

const PASCAL_PER_MMHG = 133.322387415;
const CUBIC_METER_PER_MILLILITER = 1e-6;
const VASCULAR_IDS = Object.freeze(["SA", "SV", "PA", "PV"] as const);
const BLOOD_COMPARTMENT_IDS = Object.freeze([
  "LA", "LV", "SA", "SV", "RA", "RV", "PA", "PV",
] as const);
type VascularId = typeof VASCULAR_IDS[number];

export const PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2_ID =
  "pre-a-operating-point-hemodynamic-construction-prior-v2" as const;

export const PRE_A_OPERATING_POINT_HEMODYNAMIC_EVIDENCE_SOURCES_V2 = deepFreeze({
  heldt2002: {
    sourceId: "heldt-2002-cardiovascular-volume-distribution-v2",
    evidenceClass: "primary-lumped-cardiovascular-model",
    title: "Computational model of cardiovascular response to orthostatic stress",
    doi: "10.1152/japplphysiol.00241.2001",
    url: "https://doi.org/10.1152/japplphysiol.00241.2001",
    sourceLocation:
      "reported total-blood-volume distribution and detailed vascular-compartment initialization",
    roleInConstruction:
      "anchors the 15/69/9/7 percent pool allocation; the PA/PV pair normalizes the detailed-model split to the nine-percent pulmonary pool",
    claimBoundary:
      "Published lumped-model initialization prior; not a direct human measurement, unique normal-human parameter set, or patient fit.",
  },
  magder1998: {
    sourceId: "magder-de-varennes-1998-stressed-volume-context-v2",
    evidenceClass: "primary-clinical-stressed-volume-context",
    title: "Clinical death and the measurement of stressed vascular volume",
    doi: "10.1097/00003246-199806000-00028",
    url: "https://doi.org/10.1097/00003246-199806000-00028",
    sourceLocation: "clinical estimate and interpretation of stressed vascular volume",
    roleInConstruction:
      "broad order-of-magnitude context for volume outside fixed vascular V0 only",
    claimBoundary:
      "Does not identify V0, compliance, pressure, compartment split, or a gate; cardiac blood is not relabeled as stressed vascular volume.",
  },
} as const);

const REFERENCE_TOTAL_BLOOD_VOLUME_M3 = 5_600 * CUBIC_METER_PER_MILLILITER;
const HELDT_POOL_FRACTIONS = deepFreeze({
  systemicArteries: 0.15,
  systemicCapillariesVenulesAndVeins: 0.69,
  pulmonaryCirculation: 0.09,
  heart: 0.07,
});
const TARGET_BLOOD_VOLUME_M3_BY_POOL = deepFreeze({
  systemicArteries: 840 * CUBIC_METER_PER_MILLILITER,
  systemicCapillariesVenulesAndVeins: 3_864 * CUBIC_METER_PER_MILLILITER,
  pulmonaryCirculation: 504 * CUBIC_METER_PER_MILLILITER,
  heart: 392 * CUBIC_METER_PER_MILLILITER,
});
const VASCULAR_TARGET_VOLUME_M3 = deepFreeze({
  SA: 840 * CUBIC_METER_PER_MILLILITER,
  SV: 3_864 * CUBIC_METER_PER_MILLILITER,
  PA: 106 * CUBIC_METER_PER_MILLILITER,
  PV: 398 * CUBIC_METER_PER_MILLILITER,
});
const ABSOLUTE_REFERENCE_PRESSURE_PA = deepFreeze({
  LA: 7.5 * PASCAL_PER_MMHG,
  LV: 5 * PASCAL_PER_MMHG,
  SA: 90 * PASCAL_PER_MMHG,
  SV: 7 * PASCAL_PER_MMHG,
  RA: 5.3 * PASCAL_PER_MMHG,
  RV: 3.5 * PASCAL_PER_MMHG,
  PA: 14 * PASCAL_PER_MMHG,
  PV: 8.5 * PASCAL_PER_MMHG,
} satisfies Record<BloodCompartmentId, number>);
const COMPLIANCE_M3_PER_PA = deepFreeze({
  SA: 11.25e-9,
  SV: 750e-9,
  PA: 30e-9,
  PV: 112.5e-9,
});
const EXTERNAL_PRESSURE_PA = deepFreeze({ SA: 0, SV: 0, PA: 0, PV: 0 });
const REFERENCE_FILLING_PRESSURE_PA = ABSOLUTE_REFERENCE_PRESSURE_PA.SV;
const PRESSURE_SHAPE_PA = deepFreeze(Object.fromEntries(
  BLOOD_COMPARTMENT_IDS.map((id) => [
    id,
    ABSOLUTE_REFERENCE_PRESSURE_PA[id] - REFERENCE_FILLING_PRESSURE_PA,
  ]),
) as Record<BloodCompartmentId, number>);

/*
 * V0 is evaluated once from the fixed reference. There is intentionally no
 * runtime-TBV argument on this path: a preload perturbation must retain V0.
 */
const FIXED_V0_M3 = deepFreeze(Object.fromEntries(VASCULAR_IDS.map((id) => [
  id,
  VASCULAR_TARGET_VOLUME_M3[id] - COMPLIANCE_M3_PER_PA[id]
    * (ABSOLUTE_REFERENCE_PRESSURE_PA[id] - EXTERNAL_PRESSURE_PA[id]),
])) as Record<VascularId, number>);
const VASCULAR_PARAMETERS = deepFreeze(Object.fromEntries(VASCULAR_IDS.map((id) => [
  id,
  {
    unstressedVolumeM3: FIXED_V0_M3[id],
    complianceM3PerPa: COMPLIANCE_M3_PER_PA[id],
    externalPressurePa: EXTERNAL_PRESSURE_PA[id],
  },
])) as Record<VascularId, LinearVascularComplianceParametersV1>);

const REFERENCE_CONSTRUCTION = deepFreeze({
  referenceTotalBloodVolumeM3: REFERENCE_TOTAL_BLOOD_VOLUME_M3,
  heldtPoolFractionByPool: HELDT_POOL_FRACTIONS,
  targetBloodVolumeM3ByPool: TARGET_BLOOD_VOLUME_M3_BY_POOL,
  vascularTargetBloodVolumeM3ByCompartment: VASCULAR_TARGET_VOLUME_M3,
  pulmonarySplitRule:
    "normalize-heldt-detailed-compartment-ratio-to-nine-percent-pulmonary-pool",
  absoluteReferencePressurePaByCompartment: ABSOLUTE_REFERENCE_PRESSURE_PA,
  referenceCardiacPhase:
    "atrial-activation-free-end-diastasis-pre-a-not-post-a-end-diastole",
  postAEndDiastolicPressureUsedAsPreATarget: false,
  meanLeftAtrialPressureUsedAsPreAPointTarget: false,
  referenceCommonFillingPressureOffsetPa: REFERENCE_FILLING_PRESSURE_PA,
  vascularComplianceM3PerPaByCompartment: COMPLIANCE_M3_PER_PA,
  vascularExternalPressurePaByCompartment: EXTERNAL_PRESSURE_PA,
  v0ConstructionRule:
    "V0_i=V_target_i-C_i*(P_reference_i-P_external_i)-evaluated-once",
  runtimeTbvChangeMayRecomputeV0: false,
} as const);
const FIXED_INITIALIZER_INPUTS = deepFreeze({
  referenceTotalBloodVolumeM3: REFERENCE_TOTAL_BLOOD_VOLUME_M3,
  pressureShapePaRelativeToSvByCompartment: PRESSURE_SHAPE_PA,
  vascularComplianceParametersByCompartment: VASCULAR_PARAMETERS,
});

function buildAudit() {
  const fractionSum = sum(Object.values(HELDT_POOL_FRACTIONS));
  const targetSum = sum(Object.values(TARGET_BLOOD_VOLUME_M3_BY_POOL));
  const fractionReplayResiduals = Object.keys(HELDT_POOL_FRACTIONS).map((pool) =>
    TARGET_BLOOD_VOLUME_M3_BY_POOL[pool as keyof typeof HELDT_POOL_FRACTIONS]
    - REFERENCE_TOTAL_BLOOD_VOLUME_M3
      * HELDT_POOL_FRACTIONS[pool as keyof typeof HELDT_POOL_FRACTIONS]);
  const vascularTargetSum = sum(Object.values(VASCULAR_TARGET_VOLUME_M3));
  const fixedV0Sum = sum(Object.values(FIXED_V0_M3));
  const v0Residuals = VASCULAR_IDS.map((id) => FIXED_V0_M3[id] - (
    VASCULAR_TARGET_VOLUME_M3[id] - COMPLIANCE_M3_PER_PA[id]
      * (ABSOLUTE_REFERENCE_PRESSURE_PA[id] - EXTERNAL_PRESSURE_PA[id])
  ));
  const replayResiduals = VASCULAR_IDS.map((id) => FIXED_V0_M3[id]
    + COMPLIANCE_M3_PER_PA[id]
      * (ABSOLUTE_REFERENCE_PRESSURE_PA[id] - EXTERNAL_PRESSURE_PA[id])
    - VASCULAR_TARGET_VOLUME_M3[id]);
  const shapeResiduals = BLOOD_COMPARTMENT_IDS.map((id) => PRESSURE_SHAPE_PA[id]
    + REFERENCE_FILLING_PRESSURE_PA - ABSOLUTE_REFERENCE_PRESSURE_PA[id]);
  const pulmonarySplitDifferenceM3 = VASCULAR_TARGET_VOLUME_M3.PA
    + VASCULAR_TARGET_VOLUME_M3.PV
    - TARGET_BLOOD_VOLUME_M3_BY_POOL.pulmonaryCirculation;
  const cardiacRemainderM3 = REFERENCE_TOTAL_BLOOD_VOLUME_M3 - vascularTargetSum;
  const maximumAbsoluteV0ConstructionResidualM3 = maxAbs(v0Residuals);
  const maximumAbsoluteHeldtFractionReplayResidualM3 = maxAbs(fractionReplayResiduals);
  const maximumAbsoluteReferenceVolumeReplayResidualM3 = maxAbs(replayResiduals);
  const maximumAbsolutePressureShapeResidualPa = maxAbs(shapeResiduals);
  const minimumFixedVascularUnstressedVolumeM3 = Math.min(...Object.values(FIXED_V0_M3));
  if (
    Math.abs(fractionSum - 1) > 1e-15
    || Math.abs(targetSum - REFERENCE_TOTAL_BLOOD_VOLUME_M3) > 1e-15
    || maximumAbsoluteHeldtFractionReplayResidualM3 > 1e-15
    || Math.abs(pulmonarySplitDifferenceM3) > 1e-15
    || Math.abs(cardiacRemainderM3 - TARGET_BLOOD_VOLUME_M3_BY_POOL.heart) > 1e-15
    || maximumAbsoluteV0ConstructionResidualM3 > 1e-15
    || maximumAbsoluteReferenceVolumeReplayResidualM3 > 1e-15
    || maximumAbsolutePressureShapeResidualPa > 1e-9
    || !(minimumFixedVascularUnstressedVolumeM3 > 0)
  ) throw new Error("pre-A hemodynamic construction prior failed its derived audit");
  const outsideFixedV0 = REFERENCE_TOTAL_BLOOD_VOLUME_M3 - fixedV0Sum;
  return deepFreeze({
    heldtPoolFractionSum: fractionSum,
    targetBloodVolumeSumM3: targetSum,
    vascularTargetBloodVolumeSumM3: vascularTargetSum,
    pulmonarySplitDifferenceM3,
    cardiacBloodVolumeRemainderM3: cardiacRemainderM3,
    fixedVascularUnstressedVolumeSumM3: fixedV0Sum,
    vascularStressedVolumeAtReferencePressureM3: vascularTargetSum - fixedV0Sum,
    bloodVolumeOutsideFixedVascularV0AtReferenceM3: outsideFixedV0,
    bloodVolumeOutsideFixedVascularV0Fraction:
      outsideFixedV0 / REFERENCE_TOTAL_BLOOD_VOLUME_M3,
    maximumAbsoluteHeldtFractionReplayResidualM3,
    maximumAbsoluteV0ConstructionResidualM3,
    maximumAbsoluteReferenceVolumeReplayResidualM3,
    maximumAbsolutePressureShapeResidualPa,
    minimumFixedVascularUnstressedVolumeM3,
    fixedV0IndependentOfRuntimeTbv: true,
    magderUsedForQuantitativeIdentification: false,
    pass: true,
  } as const);
}

export const PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2 = deepFreeze({
  priorId: PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2_ID,
  status: "literature-grounded-construction-prior-not-calibration-or-validation",
  units: { volume: "m^3", pressure: "Pa", compliance: "m^3/Pa" },
  evidenceSources: PRE_A_OPERATING_POINT_HEMODYNAMIC_EVIDENCE_SOURCES_V2,
  evidenceBoundary: {
    heldtDistributionUsedAsConstructionPrior: true,
    heldtCompartmentVolumesClaimedAsDirectHumanMeasurements: false,
    pulmonaryArterialVenousSplitClaimedAsDirectReportedPair: false,
    complianceIdentifiedByHeldt: false,
    pressureShapeIdentifiedByHeldt: false,
    magderUsedOnlyAsBroadConsistencyContext: true,
    normalHumanCalibrationClaimed: false,
    physiologicalValidationClaimed: false,
    patientSpecificFitClaimed: false,
    runtimeAdoptionClaimed: false,
  },
  referenceConstruction: REFERENCE_CONSTRUCTION,
  fixedInitializerInputs: FIXED_INITIALIZER_INPUTS,
  audit: buildAudit(),
} as const);

export type PreAOperatingPointHemodynamicConstructionPriorV2 =
  typeof PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2;
export type PreAOperatingPointFixedHemodynamicInitializerInputsV2 =
  typeof FIXED_INITIALIZER_INPUTS;

assertPreAOperatingPointHemodynamicConstructionPriorV2(
  PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2,
);

/**
 * Projection accepted by the pre-A initializer. Callers may override TBV in
 * their initializer input, but this frozen V0 vector must remain unchanged.
 */
export function getPreAOperatingPointFixedHemodynamicInitializerInputsV2():
PreAOperatingPointFixedHemodynamicInitializerInputsV2 {
  return FIXED_INITIALIZER_INPUTS;
}

/** Strict, fail-closed check for a canonical or serialized V2 prior. */
export function assertPreAOperatingPointHemodynamicConstructionPriorV2(
  value: unknown,
): asserts value is PreAOperatingPointHemodynamicConstructionPriorV2 {
  assertExactPlainRecordV1(value, [
    "priorId", "status", "units", "evidenceSources", "evidenceBoundary",
    "referenceConstruction", "fixedInitializerInputs", "audit",
  ], "preAOperatingPointHemodynamicConstructionPriorV2");
  const candidate = value as unknown as PreAOperatingPointHemodynamicConstructionPriorV2;
  if (
    candidate.priorId !== PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2_ID
    || candidate.status
      !== "literature-grounded-construction-prior-not-calibration-or-validation"
  ) throw new Error("pre-A prior identity or status drifted");
  assertSameScalarRecord(candidate.units, {
    volume: "m^3", pressure: "Pa", compliance: "m^3/Pa",
  }, "units");
  assertExactPlainRecordV1(candidate.evidenceSources, ["heldt2002", "magder1998"], "evidenceSources");
  assertSameScalarRecord(
    candidate.evidenceSources.heldt2002,
    PRE_A_OPERATING_POINT_HEMODYNAMIC_EVIDENCE_SOURCES_V2.heldt2002,
    "evidenceSources.heldt2002",
  );
  assertSameScalarRecord(
    candidate.evidenceSources.magder1998,
    PRE_A_OPERATING_POINT_HEMODYNAMIC_EVIDENCE_SOURCES_V2.magder1998,
    "evidenceSources.magder1998",
  );
  assertSameScalarRecord(
    candidate.evidenceBoundary,
    PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2.evidenceBoundary,
    "evidenceBoundary",
  );
  if (
    candidate.evidenceSources.heldt2002.doi !== "10.1152/japplphysiol.00241.2001"
    || candidate.evidenceSources.magder1998.doi !== "10.1097/00003246-199806000-00028"
    || candidate.evidenceBoundary.magderUsedOnlyAsBroadConsistencyContext !== true
    || candidate.evidenceBoundary.normalHumanCalibrationClaimed !== false
    || candidate.evidenceBoundary.physiologicalValidationClaimed !== false
  ) throw new Error("pre-A prior evidence boundary drifted");
  assertExactPlainRecordV1(
    candidate.referenceConstruction,
    Object.keys(REFERENCE_CONSTRUCTION),
    "referenceConstruction",
  );
  if (
    candidate.referenceConstruction.referenceTotalBloodVolumeM3
      !== REFERENCE_TOTAL_BLOOD_VOLUME_M3
    || candidate.referenceConstruction.referenceCommonFillingPressureOffsetPa
      !== REFERENCE_FILLING_PRESSURE_PA
    || candidate.referenceConstruction.pulmonarySplitRule
      !== REFERENCE_CONSTRUCTION.pulmonarySplitRule
    || candidate.referenceConstruction.v0ConstructionRule
      !== REFERENCE_CONSTRUCTION.v0ConstructionRule
  ) throw new Error("pre-A reference construction scalar drifted");
  assertSameScalarRecord(
    candidate.referenceConstruction.heldtPoolFractionByPool,
    HELDT_POOL_FRACTIONS,
    "heldtPoolFractionByPool",
  );
  assertSameScalarRecord(
    candidate.referenceConstruction.targetBloodVolumeM3ByPool,
    TARGET_BLOOD_VOLUME_M3_BY_POOL,
    "targetBloodVolumeM3ByPool",
  );
  assertSameScalarRecord(
    candidate.referenceConstruction.vascularTargetBloodVolumeM3ByCompartment,
    VASCULAR_TARGET_VOLUME_M3,
    "vascularTargetBloodVolumeM3ByCompartment",
  );
  assertSameScalarRecord(
    candidate.referenceConstruction.absoluteReferencePressurePaByCompartment,
    ABSOLUTE_REFERENCE_PRESSURE_PA,
    "absoluteReferencePressurePaByCompartment",
  );
  assertSameScalarRecord(
    candidate.referenceConstruction.vascularComplianceM3PerPaByCompartment,
    COMPLIANCE_M3_PER_PA,
    "vascularComplianceM3PerPaByCompartment",
  );
  assertSameScalarRecord(
    candidate.referenceConstruction.vascularExternalPressurePaByCompartment,
    EXTERNAL_PRESSURE_PA,
    "vascularExternalPressurePaByCompartment",
  );
  assertExactPlainRecordV1(
    candidate.fixedInitializerInputs,
    Object.keys(FIXED_INITIALIZER_INPUTS),
    "fixedInitializerInputs",
  );
  if (
    candidate.fixedInitializerInputs.referenceTotalBloodVolumeM3
      !== REFERENCE_TOTAL_BLOOD_VOLUME_M3
  ) throw new Error("fixed initializer reference TBV drifted");
  assertSameScalarRecord(
    candidate.fixedInitializerInputs.pressureShapePaRelativeToSvByCompartment,
    PRESSURE_SHAPE_PA,
    "pressureShapePaRelativeToSvByCompartment",
  );
  assertExactPlainRecordV1(
    candidate.fixedInitializerInputs.vascularComplianceParametersByCompartment,
    VASCULAR_IDS,
    "vascularComplianceParametersByCompartment",
  );
  for (const id of VASCULAR_IDS) {
    const parameters = candidate.fixedInitializerInputs
      .vascularComplianceParametersByCompartment[id];
    assertExactPlainRecordV1(parameters, [
      "unstressedVolumeM3", "complianceM3PerPa", "externalPressurePa",
    ], `vascularComplianceParametersByCompartment.${id}`);
    if (
      parameters.unstressedVolumeM3 !== FIXED_V0_M3[id]
      || parameters.complianceM3PerPa !== COMPLIANCE_M3_PER_PA[id]
      || parameters.externalPressurePa !== EXTERNAL_PRESSURE_PA[id]
    ) throw new Error(`fixed vascular V0/compliance drifted for ${id}`);
  }
  assertSameScalarRecord(
    candidate.audit,
    PRE_A_OPERATING_POINT_HEMODYNAMIC_CONSTRUCTION_PRIOR_V2.audit,
    "audit",
  );
  if (
    candidate.referenceConstruction.runtimeTbvChangeMayRecomputeV0 !== false
    || candidate.audit.fixedV0IndependentOfRuntimeTbv !== true
    || candidate.audit.magderUsedForQuantitativeIdentification !== false
    || candidate.audit.pass !== true
  ) throw new Error("pre-A prior ownership audit drifted");
}

function assertSameScalarRecord(
  actual: unknown,
  expected: Readonly<Record<string, string | number | boolean>>,
  field: string,
): void {
  const keys = Object.keys(expected);
  assertExactPlainRecordV1(actual, keys, field);
  for (const key of keys) {
    if (actual[key] !== expected[key]) {
      throw new Error(`${field}.${key} differs from the fixed construction prior`);
    }
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function maxAbs(values: readonly number[]): number {
  return Math.max(...values.map((value) => Math.abs(value)));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  }
  return value;
}

import type {
  MainWireHealthyCycleMetricIdV1,
} from "./MainWireCycleMetricContractV1";

export const MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1_ID =
  "main-wire-numerical-integrity-pack-v1" as const;
export const MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1_ID =
  "main-wire-healthy-reference-context-pack-v1" as const;

/**
 * Retained as the stable identity of the release artifact generated before the
 * numerical and biological evidence definitions were separated.
 */
export const MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID =
  "main-wire-healthy-reference-target-pack-v1" as const;

export type MainWireCycleEvidenceGateV1 = Readonly<{
  gateId: string;
  metricId: MainWireHealthyCycleMetricIdV1;
  domain: "physiology-reference" | "numerical-integrity";
  lowerInclusive: number | null;
  upperInclusive: number | null;
  sourceIds: readonly string[];
  interpretation: string;
}>;

const NUMERICAL_INTEGRITY_SOURCE_V1 = Object.freeze({
  sourceId: "circleheart-numerical-contract-v1",
  citation: "CircleHeart scientific runtime numerical-integrity contract V1.",
  url: null,
  role: "engineering tolerances; not a biological reference",
});

const HEALTHY_REFERENCE_SOURCES_V1 = Object.freeze([
  Object.freeze({
    sourceId: "lang-ase-eacvi-2015",
    citation:
      "Lang RM et al. Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults. J Am Soc Echocardiogr. 2015;28:1-39.e14.",
    doi: "10.1016/j.echo.2014.10.003",
    url: "https://doi.org/10.1016/j.echo.2014.10.003",
    role:
      "sex-aware LV volume-index and ejection-fraction reference context",
  }),
  Object.freeze({
    sourceId: "kou-norre-2014",
    citation:
      "Kou S et al. Echocardiographic reference ranges for normal cardiac chamber size: results from the NORRE study. Eur Heart J Cardiovasc Imaging. 2014;15:680-690.",
    doi: "10.1093/ehjci/jet284",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4402333/",
    role:
      "healthy-cohort LV EDVi, ESVi, and ejection-fraction reference intervals",
  }),
  Object.freeze({
    sourceId: "mukherjee-ase-right-heart-2025",
    citation:
      "Mukherjee M et al. Guidelines for the Echocardiographic Assessment of the Right Heart in Adults and Special Considerations in Pulmonary Hypertension. J Am Soc Echocardiogr. 2025;38:141-186.",
    doi: "10.1016/j.echo.2025.01.006",
    url: "https://doi.org/10.1016/j.echo.2025.01.006",
    role:
      "current resting RVSP screening context, used only as a direct-model PA systolic review screen",
  }),
  Object.freeze({
    sourceId: "kovacs-pawp-healthy-meta-2024",
    citation:
      "Zeder K et al. Pulmonary arterial wedge pressure in healthy subjects: a meta-analysis. Eur Respir J. 2024;64:2400967.",
    doi: "10.1183/13993003.00967-2024",
    url: "https://doi.org/10.1183/13993003.00967-2024",
    role:
      "upper reference context for resting supine pulmonary arterial wedge pressure",
  }),
  Object.freeze({
    sourceId: "cardiac-index-clinical-reference",
    citation: "King J, Lowery DR. Physiology, Cardiac Index. StatPearls. Updated 2024.",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK539905/",
    role: "broad resting cardiac-index screening range",
  }),
]);

const HEALTHY_REFERENCE_GATES_V1 = Object.freeze([
  gateV1(
    "healthy.lv.edvi",
    "hemodynamics.lv.edv_index_ml_per_m2",
    "physiology-reference",
    34,
    76,
    ["lang-ase-eacvi-2015", "kou-norre-2014"],
    "Broad sex-neutral 2D-echocardiographic healthy reference screen.",
  ),
  gateV1(
    "healthy.lv.esvi",
    "hemodynamics.lv.esv_index_ml_per_m2",
    "physiology-reference",
    10,
    29,
    ["lang-ase-eacvi-2015", "kou-norre-2014"],
    "Broad sex-neutral 2D-echocardiographic healthy reference screen.",
  ),
  gateV1(
    "healthy.lv.ef",
    "hemodynamics.lv.ejection_fraction_01",
    "physiology-reference",
    0.52,
    0.74,
    ["lang-ase-eacvi-2015", "kou-norre-2014"],
    "Inclusive healthy-adult LVEF screen; not a diagnostic partition.",
  ),
  gateV1(
    "healthy.cardiac_index",
    "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
    "physiology-reference",
    2.5,
    4,
    ["cardiac-index-clinical-reference"],
    "Broad resting output screen normalized to the fixed reference BSA.",
  ),
  gateV1(
    "healthy.pulmonary_artery.systolic",
    "hemodynamics.pressure.pulmonary_artery.systolic_mmhg",
    "physiology-reference",
    10,
    35,
    ["mukherjee-ase-right-heart-2025"],
    "The 2025 ASE RVSP threshold is used only as a direct-model PA systolic review screen; a miss is not labeled as disease.",
  ),
  gateV1(
    "healthy.left_atrium.mean",
    "hemodynamics.pressure.left_atrium.mean_mmhg",
    "physiology-reference",
    2,
    13,
    ["kovacs-pawp-healthy-meta-2024"],
    "LA mean pressure is compared only as a model-side surrogate screen; it is not asserted to equal measured PAWP.",
  ),
]);

const NUMERICAL_INTEGRITY_GATES_V1 = Object.freeze([
  gateV1(
    "numerics.mechanics.residual",
    "numerics.mechanics.maximum_residual_norm",
    "numerical-integrity",
    0,
    1e-7,
    [NUMERICAL_INTEGRITY_SOURCE_V1.sourceId],
    "Maximum accepted-step mechanics residual over the evaluated cycle.",
  ),
  gateV1(
    "numerics.circulation.residual",
    "numerics.circulation.maximum_scaled_residual_infinity_norm",
    "numerical-integrity",
    0,
    1e-7,
    [NUMERICAL_INTEGRITY_SOURCE_V1.sourceId],
    "Maximum accepted-step scaled circulation residual over the evaluated cycle.",
  ),
  gateV1(
    "numerics.continuity.residual",
    "numerics.continuity.maximum_absolute_residual_ml",
    "numerical-integrity",
    0,
    5e-7,
    [NUMERICAL_INTEGRITY_SOURCE_V1.sourceId],
    "Maximum absolute discrete node-continuity residual over the evaluated cycle.",
  ),
  gateV1(
    "numerics.total_blood_volume.error",
    "numerics.total_blood_volume.maximum_absolute_error_ml",
    "numerical-integrity",
    0,
    1e-8,
    [NUMERICAL_INTEGRITY_SOURCE_V1.sourceId],
    "Maximum absolute fixed-TBV conservation error over the evaluated cycle.",
  ),
]);

export const MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1 = Object.freeze({
  packId: MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1_ID,
  schemaVersion: 1 as const,
  domain: "numerical-integrity" as const,
  sources: Object.freeze([NUMERICAL_INTEGRITY_SOURCE_V1]),
  gates: NUMERICAL_INTEGRITY_GATES_V1,
  claim: Object.freeze({
    scenarioIndependent: true as const,
    biologicalReferenceClaimed: false as const,
    passingDoesNotClaimPhysiologicalValidity: true as const,
  }),
});

export const MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1 = Object.freeze({
  packId: MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1_ID,
  schemaVersion: 1 as const,
  domain: "physiology-reference" as const,
  referenceSubject: Object.freeze({
    bodySurfaceAreaM2: 1.9 as const,
    state: "resting-adult-research-reference" as const,
  }),
  sources: HEALTHY_REFERENCE_SOURCES_V1,
  gates: HEALTHY_REFERENCE_GATES_V1,
  deferredAcceptance: Object.freeze([
    "atrial-PV-loop-reservoir-conduit-pump-topology",
    "AV-valve-E-and-A-wave-morphology",
    "HR-preload-afterload-PVR-inotropy-lusitropy-envelope",
    "multi-start-periodic-basin",
    "dt-refinement",
    "intervention-transient",
  ]),
  claim: Object.freeze({
    broadReferenceScreenNotPatientFit: true as const,
    literatureRangesAreNotInterchangeableAcrossModalities: true as const,
    calibrationOrIndependentValidationRoleNotInferred: true as const,
    failingIdentifiesReviewWorkNotDiagnosis: true as const,
    waveformShapeFittingPerformed: false as const,
  }),
});

/**
 * Backward-compatible composite used by the existing release artifact and V1
 * acceptance API. New consumers should select one of the two packs above.
 */
export const MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1 = Object.freeze({
  targetPackId: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
  schemaVersion: 1 as const,
  referenceSubject:
    MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject,
  sources: Object.freeze([
    ...MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.sources,
    ...MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.sources,
  ]),
  gates: Object.freeze([
    ...MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates,
    ...MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates,
  ]),
  deferredAcceptance:
    MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.deferredAcceptance,
  claim: Object.freeze({
    broadReferenceScreenNotPatientFit: true as const,
    literatureRangesAreNotInterchangeableAcrossModalities: true as const,
    passingDoesNotClaimClinicalValidation: true as const,
    failingIdentifiesReviewWorkNotDiagnosis: true as const,
    waveformShapeFittingPerformed: false as const,
    numericalAndPhysiologyDomainsReportedSeparately: true as const,
  }),
});

function gateV1(
  gateId: string,
  metricId: MainWireHealthyCycleMetricIdV1,
  domain: MainWireCycleEvidenceGateV1["domain"],
  lowerInclusive: number | null,
  upperInclusive: number | null,
  sourceIds: readonly string[],
  interpretation: string,
): MainWireCycleEvidenceGateV1 {
  return Object.freeze({
    gateId,
    metricId,
    domain,
    lowerInclusive,
    upperInclusive,
    sourceIds: Object.freeze([...sourceIds]),
    interpretation,
  });
}

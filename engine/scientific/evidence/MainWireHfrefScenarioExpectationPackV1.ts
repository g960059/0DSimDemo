import type {
  ScientificEvidenceReferenceV2,
} from "@/engine/scientific/evidence/ScientificEvidenceContractV2";

export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_ID =
  "main-wire-hfref-scenario-expectation-pack-v1" as const;

export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_VERSION =
  "1" as const;

export const MAIN_WIRE_HFREF_CONSTRUCTION_SPECIFICATION_V1_SOURCE_ID =
  "circleheart-hfref-reduced-contractility-construction-v1" as const;

export type MainWireHfrefScenarioExpectationV1 = Readonly<{
  ruleId: string;
  sourceGateId: string;
  metricId: string;
  expectedDirection: "higher" | "lower";
  interpretation: string;
  activation: "guard-band-and-runtime-binding-required";
}>;

/**
 * A deliberately small construction contract for a future release-bound
 * HFrEF reduced-contractility scenario. These are paired directions, not
 * clinical cutoffs or independent validation targets.
 */
export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATIONS_V1 = Object.freeze([
  Object.freeze({
    ruleId: "hfref.lv.ef.direction-from-healthy-parent",
    sourceGateId: "healthy.lv.ef",
    metricId: "hemodynamics.lv.ejection_fraction_01",
    expectedDirection: "lower" as const,
    interpretation:
      "LV ejection fraction must be lower than the explicitly declared matched healthy parent.",
    activation: "guard-band-and-runtime-binding-required" as const,
  }),
  Object.freeze({
    ruleId: "hfref.lv.esvi.direction-from-healthy-parent",
    sourceGateId: "healthy.lv.esvi",
    metricId: "hemodynamics.lv.esv_index_ml_per_m2",
    expectedDirection: "higher" as const,
    interpretation:
      "LV end-systolic volume index must be higher than the explicitly declared matched healthy parent.",
    activation: "guard-band-and-runtime-binding-required" as const,
  }),
] satisfies readonly MainWireHfrefScenarioExpectationV1[]);

export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_REFERENCES_V1 =
  Object.freeze([
    Object.freeze({
      sourceId: MAIN_WIRE_HFREF_CONSTRUCTION_SPECIFICATION_V1_SOURCE_ID,
      citation:
        "CircleHeart HFrEF reduced-contractility scenario expectation foundation v1.",
      role:
        "Internal construction specification; not empirical validation evidence.",
      href: null,
    }),
    Object.freeze({
      sourceId: "walsh-second-universal-heart-failure-definition-2026",
      citation:
        "Walsh MN et al. AHA/ACC/ESC/WHF Expert Consensus Document: Second Universal Definition of Heart Failure. Eur Heart J. 2026;ehag500.",
      role:
        "Claim-boundary context: reduced EF is not defined by one universal rigid cutoff.",
      href: "https://doi.org/10.1093/eurheartj/ehag500",
    }),
    Object.freeze({
      sourceId: "warriner-heart-failure-pv-loop-meta-analysis-2014",
      citation:
        "Warriner DR et al. Closing the loop: modelling of heart failure progression from health to end-stage using a meta-analysis of left ventricular pressure-volume loops. PLoS One. 2014;9:e114153.",
      role:
        "Context for coarse HFrEF pressure-volume directions; not a validation dataset for this implementation.",
      href: "https://doi.org/10.1371/journal.pone.0114153",
    }),
    Object.freeze({
      sourceId: "jones-model-based-heart-failure-phenotyping-2021",
      citation:
        "Jones E et al. Phenotyping heart failure using model-based analysis and physiology-informed machine learning. J Physiol. 2021;599:4991-5013.",
      role:
        "Mechanistic context for reduced LV active contractility; not a validation dataset for this implementation.",
      href: "https://doi.org/10.1113/JP281845",
    }),
    Object.freeze({
      sourceId: "fda-computational-model-credibility-guidance-2023",
      citation:
        "U.S. Food and Drug Administration. Assessing the Credibility of Computational Modeling and Simulation in Medical Device Submissions. 2023.",
      role:
        "Context-of-use and evidence-separation framework.",
      href:
        "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/assessing-credibility-computational-modeling-and-simulation-medical-device-submissions",
    }),
  ] satisfies readonly ScientificEvidenceReferenceV2[]);

export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_CLAIM_BOUNDARIES_V1 =
  Object.freeze([
    "The profile checks construction conformance only; it is not independent validation.",
    "The profile does not diagnose HFrEF, establish severity, or define a universal LVEF cutoff.",
    "The profile does not establish patient fit or predict treatment response.",
    "The paired directions apply only to an explicitly declared healthy parent under the scenario specification's matched loading, rhythm, body-size, blood-volume, and controller conditions.",
    "LV end-diastolic volume, cardiac output/index, filling pressure, arterial pressure, remodelling, regional wall motion, neurohormonal adaptation, and waveform morphology are outside this V1 contract.",
    "Every direction rule remains inactive until a positive numerical guard band is preregistered by the executable scenario definition.",
  ]);

export const MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1 = Object.freeze({
  packId: MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_ID,
  packVersion: MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_PACK_V1_VERSION,
  activation: "deferred-until-release-bound-scenario" as const,
  expectations: MAIN_WIRE_HFREF_SCENARIO_EXPECTATIONS_V1,
  references: MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_REFERENCES_V1,
  claimBoundaries: MAIN_WIRE_HFREF_SCENARIO_EXPECTATION_CLAIM_BOUNDARIES_V1,
  activationRequirements: Object.freeze([
    "Content-addressed HFrEF and healthy-parent scenario definitions.",
    "A content-addressed matched-context manifest declaring changed owners, held-constant owners, controller state, rhythm, loading, body size, blood volume, and observation phase.",
    "A positive scenario-owned guard band for each direction, preregistered before output inspection and justified by numerical reproducibility or refinement evidence.",
    "The exact complete numerical-verification profile must pass for both runs.",
    "A runtime adapter must resolve and verify every referenced digest; string labels and edit lineage are insufficient.",
  ]),
});

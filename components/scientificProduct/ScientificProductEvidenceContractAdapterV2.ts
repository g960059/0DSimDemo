import {
  SCIENTIFIC_EVIDENCE_CONTRACT_V2_ID,
  assertScientificEvidenceBundleV2,
  type ScientificEvidenceAssessmentRecordV2,
  type ScientificEvidenceAssessmentResultV2,
  type ScientificEvidenceAssessmentRuleV2,
  type ScientificEvidenceBundleV2,
  type ScientificEvidenceMetricDefinitionV2,
  type ScientificEvidenceModalityV2,
  type ScientificEvidenceProfileV2,
  type ScientificEvidenceReferenceV2,
  type ScientificEvidenceRoleV2,
  type ScientificEvidenceSubjectRefV2,
} from "@/engine/scientific/evidence/ScientificEvidenceContractV2";
import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireCycleEvidenceGateV1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1,
  MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";

import type {
  ScientificProductNumericalCycleResultV1,
  ScientificProductReferenceContextResultV1,
  ScientificProductValidationContextV1,
} from "./ScientificProductValidationContextV1";

export type ScientificProductEvidenceContractAdapterInputV2 = Readonly<{
  subjectRef: ScientificEvidenceSubjectRefV2;
  releaseRef: SimulationReleaseRef;
  controlStateSha256: string | null;
  parameterEpoch: number | null;
  validation: ScientificProductValidationContextV1;
}>;

/**
 * Normalizes the V1 Quick Check result without upgrading its scientific claim.
 * Healthy literature comparisons remain exploratory context; only the
 * numerical pack is classified as verification evidence.
 */
export function createScientificProductEvidenceBundleV2(
  input: ScientificProductEvidenceContractAdapterInputV2,
): ScientificEvidenceBundleV2 {
  const subjectRef = Object.freeze({ ...input.subjectRef });
  const releaseRef = Object.freeze({ ...input.releaseRef });
  const allGates = Object.freeze([
    ...MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates,
    ...MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates,
  ]);
  const metricDefinitions = metricDefinitionsV2(allGates, input.validation);
  const profiles = Object.freeze([
    numericalProfileV2(),
    healthyReferenceProfileV2(),
  ]);
  const rules = Object.freeze(allGates.map(ruleV2));
  const records = Object.freeze(allGates.map((gate) => recordV2(
    gate,
    input,
    subjectRef,
    releaseRef,
  )));
  const bundle = Object.freeze({
    contractId: SCIENTIFIC_EVIDENCE_CONTRACT_V2_ID,
    schemaVersion: 2 as const,
    bundleId: bundleIdV2(input),
    subjectRef,
    releaseRef,
    metricDefinitions,
    profiles,
    rules,
    records,
  });
  assertScientificEvidenceBundleV2(bundle);
  return bundle;
}

function metricDefinitionsV2(
  gates: readonly MainWireCycleEvidenceGateV1[],
  validation: ScientificProductValidationContextV1,
): readonly ScientificEvidenceMetricDefinitionV2[] {
  const results = new Map<string, Readonly<{
    label: string;
    unit: string;
  }>>([
    ...validation.numericalResults.map((result) => [result.gateId, result] as const),
    ...validation.referenceResults.map((result) => [result.gateId, result] as const),
  ]);
  const definitions = new Map<string, ScientificEvidenceMetricDefinitionV2>();
  for (const gate of gates) {
    if (definitions.has(gate.metricId)) continue;
    const result = results.get(gate.gateId);
    definitions.set(gate.metricId, Object.freeze({
      metricId: gate.metricId,
      metricVersion: "1",
      label: result?.label ?? metricLabelV2(gate.gateId),
      unit: result?.unit ?? metricUnitV2(gate.metricId),
      description: gate.interpretation,
    }));
  }
  return Object.freeze([...definitions.values()]);
}

function numericalProfileV2(): ScientificEvidenceProfileV2 {
  return Object.freeze({
    profileId: MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId,
    profileVersion: "1",
    domain: "numerical-verification",
    evidenceRole: "numerical-verification",
    title: "Run-level numerical integrity",
    contextOfUse:
      "Checks accepted-step numerical tolerances for a release-bound complete periodic cycle. Passing does not establish physiological validity.",
    ruleRefs: Object.freeze(
      MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates.map(ruleRefV2),
    ),
    references: referencesV2(
      MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.sources,
    ),
    claimBoundaries: Object.freeze([
      "The pack verifies calculation integrity only.",
      "No biological reference, clinical validation, or patient fit is claimed.",
    ]),
  });
}

function healthyReferenceProfileV2(): ScientificEvidenceProfileV2 {
  return Object.freeze({
    profileId: MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId,
    profileVersion: "1",
    domain: "reference-context",
    evidenceRole: "exploratory-context",
    title: "Fixed resting-adult reference context",
    contextOfUse:
      "Exploratory comparison with broad literature ranges for the fixed 1.9 m² reference adult. The profile is not a patient-specific or disease-specific validation target.",
    ruleRefs: Object.freeze(
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.gates.map(ruleRefV2),
    ),
    references: referencesV2(
      MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.sources,
    ),
    claimBoundaries: Object.freeze([
      "A difference from the range is a reference finding, not a diagnosis or scenario-validation failure.",
      "Calibration use and independent-validation use are not inferred from the metric definition.",
      "Reference ranges from different measurement modalities are not treated as interchangeable.",
    ]),
  });
}

function ruleV2(
  gate: MainWireCycleEvidenceGateV1,
): ScientificEvidenceAssessmentRuleV2 {
  return Object.freeze({
    ruleId: gate.gateId,
    ruleVersion: "1",
    metricRef: Object.freeze({
      metricId: gate.metricId,
      metricVersion: "1",
    }),
    profileRef: Object.freeze({
      profileId: gate.domain === "numerical-integrity"
        ? MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId
        : MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.packId,
      profileVersion: "1",
    }),
    domain: gate.domain === "numerical-integrity"
      ? "numerical-verification" as const
      : "reference-context" as const,
    modality: modalityV2(gate),
    scope: "run" as const,
    applicability: Object.freeze({
      kind: "requirements" as const,
      requirements: Object.freeze([Object.freeze({
        requirementId: "validated-complete-periodic-p1-cycle",
        description:
          "A release-bound complete periodic P1 cycle must be available.",
      })]),
    }),
    comparator: Object.freeze({
      kind: "absolute-range" as const,
      lowerInclusive: gate.lowerInclusive,
      upperInclusive: gate.upperInclusive,
    }),
    interpretation: gate.interpretation,
    sourceIds: Object.freeze([...gate.sourceIds]),
  });
}

function recordV2(
  gate: MainWireCycleEvidenceGateV1,
  input: ScientificProductEvidenceContractAdapterInputV2,
  subjectRef: ScientificEvidenceSubjectRefV2,
  releaseRef: SimulationReleaseRef,
): ScientificEvidenceAssessmentRecordV2 {
  const result = gate.domain === "numerical-integrity"
    ? input.validation.numericalResults.find(({ gateId }) => gateId === gate.gateId)
    : input.validation.referenceResults.find(({ gateId }) => gateId === gate.gateId);
  const role: ScientificEvidenceRoleV2 = gate.domain === "numerical-integrity"
    ? "numerical-verification"
    : "exploratory-context";
  return Object.freeze({
    recordId: `${subjectRef.kind}:${subjectRef.subjectId}:${gate.gateId}:${input.controlStateSha256 ?? "unbound"}`,
    subjectRef,
    releaseRef,
    metricRef: Object.freeze({
      metricId: gate.metricId,
      metricVersion: "1",
    }),
    ruleRef: ruleRefV2(gate),
    observedValue: result?.value ?? null,
    unit: result?.unit ?? metricUnitV2(gate.metricId),
    applicability: Object.freeze({ state: "applicable" as const }),
    assessment: assessmentV2(gate, result, input.validation.cycleAvailable),
    evidenceUse: Object.freeze({
      role,
      rationale: role === "numerical-verification"
        ? "The rule checks a declared engineering tolerance over accepted-step evidence."
        : "The comparison is contextual only; calibration use or independent holdout status is not asserted.",
      datasetRefs: Object.freeze([]),
    }),
    sourceIds: Object.freeze([...gate.sourceIds]),
    controlStateSha256: input.controlStateSha256,
    parameterEpoch: input.parameterEpoch,
  });
}

function assessmentV2(
  gate: MainWireCycleEvidenceGateV1,
  result:
    | ScientificProductNumericalCycleResultV1
    | ScientificProductReferenceContextResultV1
    | undefined,
  cycleAvailable: boolean,
): ScientificEvidenceAssessmentResultV2 {
  if (!cycleAvailable) return Object.freeze({
    state: "not-assessed" as const,
    reason: "not-run" as const,
    rationale: "No validated complete periodic P1 cycle was available.",
  });
  if (result === undefined || result.status === "unavailable") {
    return Object.freeze({
      state: "not-assessed" as const,
      reason: "source-unavailable" as const,
      rationale: "The required source signal was unavailable for this cycle.",
    });
  }
  if (gate.domain === "numerical-integrity") {
    const meets = result.status === "pass";
    return Object.freeze({
      state: "assessed" as const,
      outcome: meets ? "meets" as const : "finding" as const,
      severity: meets ? "none" as const : "error" as const,
    });
  }
  const meets = result.status === "within-reference";
  return Object.freeze({
    state: "assessed" as const,
    outcome: meets ? "meets" as const : "finding" as const,
    severity: meets ? "none" as const : "warning" as const,
  });
}

function modalityV2(
  gate: MainWireCycleEvidenceGateV1,
): ScientificEvidenceModalityV2 {
  if (gate.gateId === "numerics.continuity.residual"
    || gate.gateId === "numerics.total_blood_volume.error") {
    return "conservation";
  }
  return "scalar-range";
}

function ruleRefV2(gate: MainWireCycleEvidenceGateV1) {
  return Object.freeze({ ruleId: gate.gateId, ruleVersion: "1" });
}

function referencesV2(
  sources: readonly Readonly<{
    sourceId: string;
    citation: string;
    role: string;
    url: string | null;
  }>[],
): readonly ScientificEvidenceReferenceV2[] {
  return Object.freeze(sources.map((source) => Object.freeze({
    sourceId: source.sourceId,
    citation: source.citation,
    role: source.role,
    href: source.url,
  })));
}

function bundleIdV2(
  input: ScientificProductEvidenceContractAdapterInputV2,
): string {
  return [
    "scientific-evidence-v2",
    input.releaseRef.sha256,
    input.subjectRef.kind,
    input.subjectRef.subjectId,
    input.controlStateSha256 ?? "unbound",
  ].join(":");
}

function metricLabelV2(gateId: string): string {
  const labels: Readonly<Record<string, string>> = Object.freeze({
    "numerics.mechanics.residual": "Mechanics residual",
    "numerics.circulation.residual": "Circulation residual",
    "numerics.continuity.residual": "Continuity residual",
    "numerics.total_blood_volume.error": "Total blood-volume error",
    "healthy.lv.edvi": "LV end-diastolic volume index",
    "healthy.lv.esvi": "LV end-systolic volume index",
    "healthy.lv.ef": "LV ejection fraction",
    "healthy.cardiac_index": "Cardiac index",
    "healthy.pulmonary_artery.systolic": "Pulmonary artery systolic pressure",
    "healthy.left_atrium.mean": "Mean left-atrial pressure",
  });
  return labels[gateId] ?? gateId;
}

function metricUnitV2(metricId: string): string {
  if (metricId.endsWith("_ml_per_m2")) return "mL/m²";
  if (metricId.endsWith("_l_per_min_per_m2")) return "L/min/m²";
  if (metricId.endsWith("_mmhg")) return "mmHg";
  if (metricId.endsWith("_ml")) return "mL";
  return "1";
}

import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 } from
  "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID } from
  "@/analysis/registry/MainWireRestingReferenceProfileV1";

/**
 * Targets are separate from launch selection and search seeds. Changing a
 * suggested input cannot invalidate a saved target or its measured results.
 */
export const MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1 = Object.freeze({
  baseline: Object.freeze({
    referenceId: "baseline" as const,
    label: "baseline" as const,
    target: Object.freeze({
      kind: "construction-corridors" as const,
      evidenceRegistryId: normalReferenceEvidenceV1.registryId,
      evaluationRolePolicyId: normalReferenceEvidenceV1.evaluationPolicyId,
      admissionPolicyId: MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1.policyId,
      comparisonProfileId: MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID,
      referenceOutputsAreTargets: false as const,
    }),
    evidenceRole: "construction" as const,
    clinicalValidationClaimed: false as const,
  }),
});

export function resolveMainWireFittingReferenceV1(referenceId: string) {
  if (referenceId !== "baseline") {
    throw new Error(`unregistered fitting reference: ${referenceId}`);
  }
  return MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1.baseline;
}

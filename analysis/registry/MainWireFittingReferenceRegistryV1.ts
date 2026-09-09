import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-prospective-reference-evidence-v1.json";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 } from
  "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1_ID } from
  "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { MAIN_WIRE_HFREF_REFERENCE_V1, MAIN_WIRE_HFREF_REST_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { MAIN_WIRE_HFREF_DILATED_REFERENCE_V1, MAIN_WIRE_HFREF_DILATED_REST_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";

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
  "hfref-lv-systolic-v1": Object.freeze({
    referenceId: "hfref-lv-systolic-v1" as const,
    label: MAIN_WIRE_HFREF_REFERENCE_V1.label,
    target: Object.freeze({ kind: "source-informed-disease-construction" as const,
      evidence: MAIN_WIRE_HFREF_REFERENCE_V1, policy: MAIN_WIRE_HFREF_REST_POLICY_V1,
      referenceOutputsAreTargets: false as const }),
    evidenceRole: "construction" as const,
    clinicalValidationClaimed: false as const,
  }),
  "hfref-chronic-dilated-v1": Object.freeze({
    referenceId: "hfref-chronic-dilated-v1" as const,
    label: MAIN_WIRE_HFREF_DILATED_REFERENCE_V1.label,
    target: Object.freeze({ kind: "source-informed-disease-construction" as const,
      evidence: MAIN_WIRE_HFREF_DILATED_REFERENCE_V1, policy: MAIN_WIRE_HFREF_DILATED_REST_POLICY_V1,
      referenceOutputsAreTargets: false as const }),
    evidenceRole: "construction" as const,
    clinicalValidationClaimed: false as const,
  }),
});

type Registry = typeof MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1;
export function resolveMainWireFittingReferenceV1<K extends keyof Registry>(referenceId: K): Registry[K];
export function resolveMainWireFittingReferenceV1(referenceId: string): Registry[keyof Registry];
export function resolveMainWireFittingReferenceV1(referenceId: string) {
  if (!Object.hasOwn(MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1, referenceId)) {
    throw new Error(`unregistered fitting reference: ${referenceId}`);
  }
  return MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1[referenceId as keyof Registry];
}

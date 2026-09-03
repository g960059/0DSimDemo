import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1_ID,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationStagePolicyV1";

/**
 * Fitting references are not exact-model registrations. The target policy
 * and the currently selected parameter set are deliberately separate: the
 * latter is a starting point, not an observed or physiological target vector.
 * New models/presets require an explicit binding; there is no latest fallback.
 */
export const MAIN_WIRE_FITTING_REFERENCE_REGISTRY_V1 = Object.freeze({
  baseline: Object.freeze({
    referenceId: "baseline" as const,
    label: "baseline" as const,
    target: Object.freeze({
      kind: "construction-corridors" as const,
      evidenceRegistryId: normalReferenceEvidenceV1.registryId,
      stagePolicyId: MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1_ID,
      referenceOutputsAreTargets: false as const,
    }),
    selectedConstruction: Object.freeze({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
      baselineId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_V1_ID,
      candidateInputs: Object.freeze({
        hemodynamicResearchInputs:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
        mechanismResearchInputs:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
        ventricularContractilityScale: 1,
      }),
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

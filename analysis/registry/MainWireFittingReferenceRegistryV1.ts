import normalReferenceEvidenceV1 from
  "@/data/physiology/main-wire-normal-reference-evidence-v1.json";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import launchBaseline from
  "@/studio/integrations/mainWireIntegratedV3/standard70-launch-baseline.json";
import {
  MAIN_WIRE_BASELINE_CALIBRATION_STAGE_POLICY_V1_ID,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationStagePolicyV1";

// Read selection data only; fitting does not load Studio launch machinery or
// the physiological presentation report to obtain its starting parameters.
if (launchBaseline.schemaId !== "circleheart-standard70-launch-baseline-v1"
  || launchBaseline.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
  || !launchBaseline.baselineId.trim()
  || launchBaseline.candidateInputs.ventricularContractilityScale !== 1) {
  throw new Error("Fitting baseline selection has an incompatible identity");
}

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
      baselineId: launchBaseline.baselineId,
      candidateInputs: Object.freeze({
        hemodynamicResearchInputs:
          validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
            launchBaseline.candidateInputs.hemodynamicResearchInputs),
        mechanismResearchInputs:
          validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
            launchBaseline.candidateInputs.mechanismResearchInputs),
        ventricularContractilityScale: launchBaseline.candidateInputs.ventricularContractilityScale,
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

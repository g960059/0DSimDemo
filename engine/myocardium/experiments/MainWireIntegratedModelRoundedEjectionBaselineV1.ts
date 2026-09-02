import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  withCommonVentricularActiveTensionScaleV1,
  withCommonVentricularPassiveStiffnessScaleV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_V1_ID =
  "main-wire-integrated-model-rounded-ejection-baseline-v1" as const;

/**
 * Standard68's normal-adult operating fixture. The equation/material identity
 * remains unchanged; exposed circulatory and common ventricular-tension
 * inputs place the resting closed loop on the ascending side of its fixed-
 * control preload-response locus while retaining the baseline mint gates.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1 =
  Object.freeze({
    baselineId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_V1_ID,
    selection:
      "staged-release-lattice-and-envelope-qualification" as const,
    totalBloodVolumeMl: 4_900 as const,
    systemicResistanceScale: 0.98 as const,
    arterialStiffnessScale: 1.3 as const,
    heartRateBpm: 60 as const,
    commonVentricularActiveTensionScale: 1.24 as const,
    commonVentricularPassiveStiffnessScale: 0.88 as const,
    equationTopologyChanged: false as const,
    materialPrimitiveChanged: false as const,
    mechanismResearchInputChanged: true as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    totalBloodVolumeMl:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
        .totalBloodVolumeMl,
    systemicResistance:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
        .systemicResistanceScale,
    arterialStiffness:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
        .arterialStiffnessScale,
    heartRateBpm:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
        .heartRateBpm,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    chamberMechanics: withCommonVentricularPassiveStiffnessScaleV1(
      withCommonVentricularActiveTensionScaleV1(
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
          .chamberMechanics,
        MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
          .commonVentricularActiveTensionScale,
      ),
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_CLAIM_V1
        .commonVentricularPassiveStiffnessScale,
    ),
  });

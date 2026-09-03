import {
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_V1_ID =
  "main-wire-integrated-model-standard70-qualified-baseline-v1" as const;

/**
 * Standard69's identified operating point with one exposed 0.01-lattice SVR
 * recentering after removal of PA_PArt momentum memory. Internal calcium,
 * material, valve, volume, compliance, and venous-tone parameters are fixed.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_CLAIM_V1 =
  Object.freeze({
    baselineId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_V1_ID,
    predecessorBaselineId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_V1_ID,
    selection:
      "one-coordinate-exposed-svr-lattice-recentering-and-full-requalification" as const,
    totalBloodVolumeMl:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1.totalBloodVolumeMl,
    systemicResistanceScale: 0.99 as const,
    predecessorSystemicResistanceScale:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .systemicResistanceScale,
    arterialStiffnessScale:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .arterialStiffnessScale,
    heartRateBpm:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1.heartRateBpm,
    commonVentricularActiveTensionScale:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .commonVentricularActiveTensionScale,
    commonVentricularPassiveStiffnessScale:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .commonVentricularPassiveStiffnessScale,
    changedExposedOperatingPointCoordinates: Object.freeze([
      "systemicResistance",
    ] as const),
    internalConstitutiveParameterChanged: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
    systemicResistance:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_CLAIM_V1
        .systemicResistanceScale,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
  );

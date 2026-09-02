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
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_V1_ID =
  "main-wire-integrated-model-standard69-qualified-baseline-v1" as const;

/**
 * Qualified normal-adult operating point for the unchanged rounded-ejection
 * construction. Values lie on exposed control increments and were selected by
 * a bounded max-margin search followed by independent initialization, dt, and
 * fixed-control preload-reserve qualification. This is a construction baseline,
 * not a uniquely identified parameter vector or a clinical reference patient.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1 =
  Object.freeze({
    baselineId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_V1_ID,
    selection: "staged-release-lattice-and-envelope-qualification" as const,
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

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    totalBloodVolumeMl:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .totalBloodVolumeMl,
    systemicResistance:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .systemicResistanceScale,
    arterialStiffness:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
        .arterialStiffnessScale,
    heartRateBpm:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1.heartRateBpm,
  });

const activeScaledMechanics = withCommonVentricularActiveTensionScaleV1(
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
    .chamberMechanics,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
    .commonVentricularActiveTensionScale,
);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1 =
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3({
    ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    chamberMechanics: {
      ...activeScaledMechanics,
      passiveStiffnessScaleByWall: {
        ...activeScaledMechanics.passiveStiffnessScaleByWall,
        LVFW:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
            .commonVentricularPassiveStiffnessScale,
        SEP:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
            .commonVentricularPassiveStiffnessScale,
        RVFW:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_CLAIM_V1
            .commonVentricularPassiveStiffnessScale,
      },
    },
  });

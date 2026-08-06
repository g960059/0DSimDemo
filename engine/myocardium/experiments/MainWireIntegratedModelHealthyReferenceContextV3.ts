/**
 * Broad adult reference ranges used only to review a numerically converged V3
 * terminal cycle. They are construction context, not a durable assessment,
 * patient fit, diagnosis, or claim of physiological validation.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_HEALTHY_REFERENCE_CONTEXT_V3 =
  Object.freeze({
    contextId:
      "main-wire-integrated-model-v3-healthy-reference-context-v1" as const,
    referenceSubject: Object.freeze({
      bodySurfaceAreaM2: 1.9 as const,
      state: "resting-adult-research-reference" as const,
    }),
    gates: Object.freeze([
      gate(
        "healthy.lv.edvi",
        "hemodynamics.lv.edv_index_ml_per_m2",
        34,
        76,
        ["lang-ase-eacvi-2015", "kou-norre-2014"],
      ),
      gate(
        "healthy.lv.esvi",
        "hemodynamics.lv.esv_index_ml_per_m2",
        10,
        29,
        ["lang-ase-eacvi-2015", "kou-norre-2014"],
      ),
      gate(
        "healthy.lv.ef",
        "hemodynamics.lv.ejection_fraction_01",
        0.52,
        0.74,
        ["lang-ase-eacvi-2015", "kou-norre-2014"],
      ),
      gate(
        "healthy.cardiac_index",
        "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
        2.5,
        4,
        ["cardiac-index-clinical-reference"],
      ),
      gate(
        "healthy.pulmonary_artery.systolic",
        "hemodynamics.pressure.pulmonary_artery.systolic_mmhg",
        10,
        35,
        ["mukherjee-ase-right-heart-2025"],
      ),
      gate(
        "healthy.left_atrium.mean",
        "hemodynamics.pressure.left_atrium.mean_mmhg",
        2,
        13,
        ["kovacs-pawp-healthy-meta-2024"],
      ),
    ]),
  });

export type MainWireIntegratedModelHealthyReferenceMetricIdV3 =
  | "hemodynamics.lv.edv_index_ml_per_m2"
  | "hemodynamics.lv.esv_index_ml_per_m2"
  | "hemodynamics.lv.ejection_fraction_01"
  | "hemodynamics.aortic.cardiac_index_l_per_min_per_m2"
  | "hemodynamics.pressure.pulmonary_artery.systolic_mmhg"
  | "hemodynamics.pressure.left_atrium.mean_mmhg";

export type MainWireIntegratedModelHealthyReferenceGateV3 = Readonly<{
  gateId: string;
  metricId: MainWireIntegratedModelHealthyReferenceMetricIdV3;
  lowerInclusive: number;
  upperInclusive: number;
  sourceIds: readonly string[];
}>;

function gate(
  gateId: string,
  metricId: MainWireIntegratedModelHealthyReferenceMetricIdV3,
  lowerInclusive: number,
  upperInclusive: number,
  sourceIds: readonly string[],
): MainWireIntegratedModelHealthyReferenceGateV3 {
  return Object.freeze({
    gateId,
    metricId,
    lowerInclusive,
    upperInclusive,
    sourceIds: Object.freeze([...sourceIds]),
  });
}

import type {
  AvInflowPatternClassV1,
  PhysiologyMorphologyProfileId,
} from "@/engine/diagnostics/morphology/morphologyDecisionV1";

export type ProfileEnforcementScopeV1 = "normal-shadow" | "disease-report-only";

export type PhysiologyMorphologyProfileV1 = {
  readonly id: PhysiologyMorphologyProfileId;
  readonly label: string;
  readonly rhythm: "sinus" | "af" | "paced" | "unknown";
  readonly enforcementScope: ProfileEnforcementScopeV1;
  readonly expectedAvInflowPatterns: readonly AvInflowPatternClassV1[];
  readonly allowedAvInflowPatterns: readonly AvInflowPatternClassV1[];
  readonly forbiddenAvInflowPatterns: readonly AvInflowPatternClassV1[];
  readonly expectedDirectionalityIds: readonly string[];
  readonly notes: readonly string[];
};

export const PHYSIOLOGY_MORPHOLOGY_PROFILES_V1: Record<
  PhysiologyMorphologyProfileId,
  PhysiologyMorphologyProfileV1
> = {
  normal_sinus_central: {
    id: "normal_sinus_central",
    label: "Normal sinus central",
    rhythm: "sinus",
    enforcementScope: "normal-shadow",
    expectedAvInflowPatterns: ["EA_biphasic"],
    allowedAvInflowPatterns: ["EA_biphasic"],
    forbiddenAvInflowPatterns: [
      "ELA_triphasic",
      "multi_peak_unexplained",
      "kink_artifact",
      "valve_chatter",
    ],
    expectedDirectionalityIds: [],
    notes: [
      "Clean E/A biphasic AV inflow is expected.",
      "Extra dominant inflow peaks and kinked waves remain artifact failures.",
    ],
  },
  normal_sinus_low_preload: {
    id: "normal_sinus_low_preload",
    label: "Normal sinus low preload",
    rhythm: "sinus",
    enforcementScope: "normal-shadow",
    expectedAvInflowPatterns: ["EA_biphasic", "A_dominant_impaired_relaxation_like"],
    allowedAvInflowPatterns: ["EA_biphasic", "A_dominant_impaired_relaxation_like"],
    forbiddenAvInflowPatterns: ["ELA_triphasic", "multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: [
      "low-preload-e-peak-or-area-decreases",
      "low-preload-early-filling-fraction-decreases",
      "low-preload-a-contribution-relatively-increases",
    ],
    notes: [
      "Absolute E/A reversal is not required; directionality versus nominal is required.",
      "Too-normal low-preload behavior should be reported.",
    ],
  },
  normal_sinus_high_afterload: {
    id: "normal_sinus_high_afterload",
    label: "Normal sinus high afterload",
    rhythm: "sinus",
    enforcementScope: "normal-shadow",
    expectedAvInflowPatterns: ["EA_biphasic"],
    allowedAvInflowPatterns: ["EA_biphasic", "EA_fused"],
    forbiddenAvInflowPatterns: ["multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["high-afterload-load-response-reported"],
    notes: [
      "Clean reduced output may be a phenotype only when pre-declared and artifact-free.",
      "Output rescue by clamp or reservoir transfer remains forbidden.",
    ],
  },
  normal_sinus_high_hr: {
    id: "normal_sinus_high_hr",
    label: "Normal sinus high HR",
    rhythm: "sinus",
    enforcementScope: "normal-shadow",
    expectedAvInflowPatterns: ["EA_fused", "EA_biphasic"],
    allowedAvInflowPatterns: ["EA_fused", "EA_biphasic", "E_only_or_A_absent"],
    forbiddenAvInflowPatterns: ["ELA_triphasic", "multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["high-hr-ea-fusion-or-short-diastasis-reported"],
    notes: [
      "E/A fusion is allowed at high HR; sawtooth multi-peak flow is not.",
    ],
  },
  bradycardia_sinus: {
    id: "bradycardia_sinus",
    label: "Bradycardia sinus",
    rhythm: "sinus",
    enforcementScope: "normal-shadow",
    expectedAvInflowPatterns: ["EA_biphasic", "ELA_triphasic"],
    allowedAvInflowPatterns: ["EA_biphasic", "ELA_triphasic"],
    forbiddenAvInflowPatterns: ["multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["bradycardia-long-diastasis-reported"],
    notes: [
      "A small smooth L-wave-like component can be physiological only with pressure-gradient support.",
    ],
  },
  hfpef_sinus_report_only: {
    id: "hfpef_sinus_report_only",
    label: "HFpEF sinus report-only",
    rhythm: "sinus",
    enforcementScope: "disease-report-only",
    expectedAvInflowPatterns: [
      "E_dominant_restrictive_like",
      "ELA_triphasic",
    ],
    allowedAvInflowPatterns: [
      "E_dominant_restrictive_like",
      "ELA_triphasic",
      "EA_biphasic",
      "EA_fused",
    ],
    forbiddenAvInflowPatterns: ["multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["hfpef-elevated-filling-pressure-or-e-dominance-reported"],
    notes: [
      "HFpEF morphology is report-only until disease preset validation exists.",
      "L-wave-like filling must be smooth, repeatable, and artifact-free.",
    ],
  },
  atrial_fibrillation_report_only: {
    id: "atrial_fibrillation_report_only",
    label: "Atrial fibrillation report-only",
    rhythm: "af",
    enforcementScope: "disease-report-only",
    expectedAvInflowPatterns: ["E_only_or_A_absent", "EA_fused"],
    allowedAvInflowPatterns: ["E_only_or_A_absent", "EA_fused", "prolonged_diastolic_inflow"],
    forbiddenAvInflowPatterns: ["EA_biphasic", "multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["af-a-wave-absent-or-suppressed"],
    notes: [
      "A regular strong A wave in AF should be reported as too normal or active-source leakage.",
    ],
  },
  mitral_stenosis_report_only: {
    id: "mitral_stenosis_report_only",
    label: "Mitral stenosis report-only",
    rhythm: "sinus",
    enforcementScope: "disease-report-only",
    expectedAvInflowPatterns: ["prolonged_diastolic_inflow"],
    allowedAvInflowPatterns: ["prolonged_diastolic_inflow", "EA_fused", "EA_biphasic"],
    forbiddenAvInflowPatterns: ["multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["ms-prolonged-inflow-or-sustained-gradient-reported"],
    notes: [
      "Moderate/severe MS should not look fully normal without explanation.",
    ],
  },
  mitral_regurgitation_report_only: {
    id: "mitral_regurgitation_report_only",
    label: "Mitral regurgitation report-only",
    rhythm: "sinus",
    enforcementScope: "disease-report-only",
    expectedAvInflowPatterns: ["E_dominant_restrictive_like", "regurgitant_loading_pattern"],
    allowedAvInflowPatterns: ["EA_biphasic", "E_dominant_restrictive_like", "regurgitant_loading_pattern"],
    forbiddenAvInflowPatterns: ["multi_peak_unexplained", "kink_artifact", "valve_chatter"],
    expectedDirectionalityIds: ["mr-regurgitant-loading-explicitly-represented"],
    notes: [
      "Regurgitant loading must come from the valve disease model, not a hidden volume source.",
    ],
  },
};

export function physiologyMorphologyProfile(
  id: PhysiologyMorphologyProfileId,
): PhysiologyMorphologyProfileV1 {
  return PHYSIOLOGY_MORPHOLOGY_PROFILES_V1[id];
}

export function isReportOnlyDiseaseProfile(id: PhysiologyMorphologyProfileId): boolean {
  return PHYSIOLOGY_MORPHOLOGY_PROFILES_V1[id].enforcementScope === "disease-report-only";
}

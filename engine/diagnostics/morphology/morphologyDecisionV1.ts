export type PhysiologyMorphologyProfileId =
  | "normal_sinus_central"
  | "normal_sinus_low_preload"
  | "normal_sinus_high_afterload"
  | "normal_sinus_high_hr"
  | "bradycardia_sinus"
  | "hfpef_sinus_report_only"
  | "atrial_fibrillation_report_only"
  | "mitral_stenosis_report_only"
  | "mitral_regurgitation_report_only";

export type MorphologyAuditModeV1 = "shadow";

export type ArtifactGuardStatusV1 = "pass" | "fail" | "inconclusive";
export type ProfileExpectationStatusV1 = "met" | "warn" | "fail" | "not_applicable";
export type MorphologyFinalDecisionV1 = "report-only" | "pass" | "warn" | "fail";

export type AvInflowPatternClassV1 =
  | "EA_biphasic"
  | "EA_fused"
  | "E_only_or_A_absent"
  | "ELA_triphasic"
  | "A_dominant_impaired_relaxation_like"
  | "E_dominant_restrictive_like"
  | "prolonged_diastolic_inflow"
  | "regurgitant_loading_pattern"
  | "multi_peak_unexplained"
  | "kink_artifact"
  | "valve_chatter"
  | "unknown";

export type ArtifactGuardEvidenceV1 = {
  readonly pressureFlowCausalityOk: boolean;
  readonly valveTransitionOverlap: boolean;
  readonly clampOrLimiterOverlap: boolean;
  readonly reservoirTransferDominance: boolean;
  readonly activeMultiTwitch: boolean;
  readonly hiddenVolumeSource: boolean;
  readonly c1KinkSeverity: number;
  readonly c1KinkLimit: number;
  readonly sharpnessSeverity: number;
  readonly sharpnessLimit: number;
  readonly massLedgerClean: boolean;
  readonly energyCoastingClean: boolean;
  readonly dtHalfShapeParityOk?: boolean;
  readonly beatRepeatabilityOk?: boolean;
};

export type ArtifactGuardDecisionV1 = {
  readonly status: ArtifactGuardStatusV1;
  readonly failedArtifactIds: readonly string[];
  readonly evidence: ArtifactGuardEvidenceV1;
};

export type AvInflowArtifactHintsV1 = {
  readonly pressureFlowCausalityOk?: boolean;
  readonly valveStateSupported?: boolean;
  readonly overlapsValveTransition?: boolean;
  readonly overlapsClampOrLimiter?: boolean;
  readonly overlapsReservoirTransfer?: boolean;
  readonly activeMultiTwitch?: boolean;
  readonly hiddenVolumeSource?: boolean;
  readonly massLedgerClean?: boolean;
  readonly energyCoastingClean?: boolean;
  readonly dtHalfShapeParityOk?: boolean;
  readonly beatRepeatabilityOk?: boolean;
  readonly c1KinkSeverity?: number;
  readonly c1KinkLimit?: number;
  readonly sharpnessSeverity?: number;
  readonly sharpnessLimit?: number;
};

export type AvInflowPatternEvidenceV1 = {
  readonly positivePeakCount: number;
  readonly flowSpecificForwardPeakCount: number;
  readonly dominantShapePeakCount: number;
  readonly ePeakTimeSec?: number;
  readonly lPeakTimeSec?: number;
  readonly aPeakTimeSec?: number;
  readonly ePeakTheta?: number;
  readonly lPeakTheta?: number;
  readonly aPeakTheta?: number;
  readonly ePeakValue?: number;
  readonly lPeakValue?: number;
  readonly aPeakValue?: number;
  readonly eArea?: number;
  readonly lArea?: number;
  readonly aArea?: number;
  readonly totalForwardArea?: number;
  readonly earlyFillingFraction?: number;
  readonly forwardDurationFraction?: number;
  readonly regurgitantFraction?: number;
  readonly eaPeakRatio?: number;
  readonly eaAreaRatio?: number;
  readonly lOverE?: number;
  readonly extraPeakProminenceRatio?: number;
  readonly extraPeakAreaFraction?: number;
  readonly pressureGradientSupported: boolean;
  readonly valveStateSupported: boolean;
  readonly overlapsValveTransition: boolean;
  readonly overlapsClampOrLimiter: boolean;
  readonly overlapsReservoirTransfer: boolean;
  readonly activeMultiTwitch: boolean;
  readonly hiddenVolumeSource: boolean;
  readonly massLedgerClean: boolean;
  readonly energyCoastingClean: boolean;
  readonly c1KinkSeverity: number;
  readonly c1KinkLimit: number;
  readonly sharpnessSeverity: number;
  readonly sharpnessLimit: number;
  readonly phaseAlignedDtParityOk?: boolean;
  readonly beatRepeatabilityOk?: boolean;
  readonly rhythm: "sinus" | "af" | "paced" | "unknown";
  readonly profileId: PhysiologyMorphologyProfileId;
};

export type PatternClassDecisionV1 = {
  readonly status: "classified" | "unknown";
  readonly patternClass: AvInflowPatternClassV1;
  readonly evidence: AvInflowPatternEvidenceV1;
};

export type LowPreloadDirectionalityMetricsV1 = {
  readonly deltaEPeakVsNominal: number | null;
  readonly deltaEAreaVsNominal: number | null;
  readonly deltaEarlyFillingFractionVsNominal: number | null;
  readonly deltaEaAreaRatioVsNominal: number | null;
  readonly deltaAContributionVsNominal: number | null;
};

export type ProfileExpectationDecisionV1 = {
  readonly status: ProfileExpectationStatusV1;
  readonly expectationIdsMet: readonly string[];
  readonly expectationIdsFailed: readonly string[];
  readonly directionalityEvidence?: Record<string, number | string | boolean | null>;
};

export type AvInflowMorphologyDecisionV1 = {
  readonly valve: "MV" | "TV";
  readonly artifactGuard: ArtifactGuardDecisionV1;
  readonly patternClass: PatternClassDecisionV1;
  readonly profileExpectation: ProfileExpectationDecisionV1;
  readonly finalDecision: MorphologyFinalDecisionV1;
  readonly enforcedEquivalentDecision: Exclude<MorphologyFinalDecisionV1, "report-only">;
  readonly canAffectGate: boolean;
  readonly forbiddenRescueFlags: readonly string[];
  readonly warnings: readonly string[];
};

export type MorphologyPhysiologyAuditReportV1 = {
  readonly version: "morphology-physiology-audit-v1";
  readonly mode: MorphologyAuditModeV1;
  readonly profileId: PhysiologyMorphologyProfileId;
  readonly runId: string;
  readonly scenarioId: string;
  readonly strictNormalBaselineEarned: boolean;
  readonly overall: {
    readonly artifactGuard: ArtifactGuardStatusV1;
    readonly profileExpectation: ProfileExpectationStatusV1;
    readonly finalDecision: MorphologyFinalDecisionV1;
    readonly enforcedEquivalentDecision: Exclude<MorphologyFinalDecisionV1, "report-only">;
    readonly canAffectGate: boolean;
  };
  readonly mvf?: AvInflowMorphologyDecisionV1;
  readonly tvf?: AvInflowMorphologyDecisionV1;
  readonly comparisons?: {
    readonly nominalBaselineRunId?: string;
    readonly directionalityMetrics?: Record<string, number | string | boolean | null>;
  };
  readonly warnings: readonly string[];
  readonly forbiddenRescueFlags: readonly string[];
};

export type MorphologyPhysiologyAuditInputV1 = {
  readonly profileId: PhysiologyMorphologyProfileId;
  readonly scenarioId: string;
  readonly runId: string;
  readonly mode?: MorphologyAuditModeV1;
  readonly strictNormalBaselineEarned?: boolean;
  readonly rhythm?: "sinus" | "af" | "paced" | "unknown";
  readonly mvfHints?: AvInflowArtifactHintsV1;
  readonly tvfHints?: AvInflowArtifactHintsV1;
  readonly nominalBaseline?: {
    readonly runId: string;
    readonly mvf?: AvInflowPatternEvidenceV1;
    readonly tvf?: AvInflowPatternEvidenceV1;
  };
};

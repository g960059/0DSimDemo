import {
  isReportOnlyDiseaseProfile,
  physiologyMorphologyProfile,
} from "@/engine/diagnostics/morphology/physiologyProfiles";
import type {
  AvInflowPatternEvidenceV1,
  AvInflowPatternClassV1,
  LowPreloadDirectionalityMetricsV1,
  PatternClassDecisionV1,
  PhysiologyMorphologyProfileId,
  ProfileExpectationDecisionV1,
} from "@/engine/diagnostics/morphology/morphologyDecisionV1";

export function evaluateAvInflowProfileExpectation(
  profileId: PhysiologyMorphologyProfileId,
  pattern: PatternClassDecisionV1,
  nominalBaseline?: AvInflowPatternEvidenceV1,
  valve: "MV" | "TV" = "MV",
): ProfileExpectationDecisionV1 {
  const profile = physiologyMorphologyProfile(profileId);
  const patternClass = pattern.patternClass;
  const met: string[] = [];
  const failed: string[] = [];
  const directionalityEvidence: Record<string, number | string | boolean | null> = {
    profileId,
    patternClass,
    valve,
  };

  if (valve === "TV" && (profileId === "mitral_stenosis_report_only" || profileId === "mitral_regurgitation_report_only")) {
    return {
      status: "not_applicable",
      expectationIdsMet: [],
      expectationIdsFailed: [],
      directionalityEvidence: {
        ...directionalityEvidence,
        reason: "mitral-profile-not-applied-to-tvf",
      },
    };
  }

  if (profile.forbiddenAvInflowPatterns.includes(patternClass)) {
    failed.push(`forbidden-pattern:${patternClass}`);
  }
  if (profile.expectedAvInflowPatterns.includes(patternClass)) {
    met.push(`expected-pattern:${patternClass}`);
  } else if (profile.allowedAvInflowPatterns.includes(patternClass)) {
    met.push(`allowed-pattern:${patternClass}`);
  } else {
    failed.push(`unexpected-pattern:${patternClass}`);
  }

  if (profileId === "normal_sinus_low_preload") {
    const directionality = lowPreloadDirectionality(pattern.evidence, nominalBaseline);
    Object.assign(directionalityEvidence, directionality);
    const hasDirection = Boolean(
      directionality.deltaEPeakVsNominal != null
        && directionality.deltaEAreaVsNominal != null
        && directionality.deltaEarlyFillingFractionVsNominal != null,
    );
    if (!hasDirection) {
      failed.push("low-preload-directionality-missing-nominal-baseline");
    } else {
      const ePeakDown = (directionality.deltaEPeakVsNominal ?? 0) < -0.03;
      const eAreaDown = (directionality.deltaEAreaVsNominal ?? 0) < -0.03;
      const earlyFractionDown = (directionality.deltaEarlyFillingFractionVsNominal ?? 0) < -0.02;
      const aContributionUp = (directionality.deltaAContributionVsNominal ?? 0) > 0.02
        || (directionality.deltaEaAreaRatioVsNominal ?? 0) < -0.03;
      if ((ePeakDown || eAreaDown || earlyFractionDown) && aContributionUp) {
        met.push("low-preload-directionality-met");
      } else {
        failed.push("low-preload-too-normal-or-wrong-direction");
      }
    }
  }

  if (profileId === "normal_sinus_high_hr") {
    if (patternClass === "EA_fused") met.push("high-hr-fusion-reported");
    if (patternClass === "EA_biphasic") met.push("high-hr-clean-biphasic-without-fusion");
  }

  if (profileId === "normal_sinus_high_afterload") {
    failed.push("high-afterload-load-response-evidence-missing");
    directionalityEvidence.reason = "high-afterload-output-pressure-response-not-yet-wired";
  }

  if (profileId === "bradycardia_sinus" && patternClass === "ELA_triphasic") {
    met.push("bradycardia-smooth-l-wave-like-pattern-reported");
  }

  if (profileId === "atrial_fibrillation_report_only") {
    if (patternClass === "EA_biphasic") failed.push("af-too-regular-strong-a-wave");
    if (patternClass === "E_only_or_A_absent") met.push("af-a-wave-absent-or-suppressed");
  }

  if (profileId === "mitral_stenosis_report_only") {
    if (patternClass === "prolonged_diastolic_inflow") met.push("ms-prolonged-inflow-reported");
    if (patternClass === "EA_biphasic") failed.push("ms-too-normal-clean-ea-pattern");
  }

  if (profileId === "hfpef_sinus_report_only") {
    if (patternClass === "E_dominant_restrictive_like" || patternClass === "ELA_triphasic") {
      met.push("hfpef-filling-variant-reported");
    }
    if (patternClass === "EA_biphasic") failed.push("hfpef-too-normal-clean-ea-pattern");
  }

  if (failed.length === 0 && met.length > 0) {
    return {
      status: isReportOnlyDiseaseProfile(profileId) ? "warn" : "met",
      expectationIdsMet: met,
      expectationIdsFailed: failed,
      directionalityEvidence,
    };
  }
  if (failed.length > 0 && met.length > 0) {
    return {
      status: isReportOnlyDiseaseProfile(profileId) ? "warn" : "fail",
      expectationIdsMet: met,
      expectationIdsFailed: failed,
      directionalityEvidence,
    };
  }
  return {
    status: failed.length > 0 ? "fail" : "not_applicable",
    expectationIdsMet: met,
    expectationIdsFailed: failed,
    directionalityEvidence,
  };
}

export function lowPreloadDirectionality(
  evidence: AvInflowPatternEvidenceV1,
  nominalBaseline?: AvInflowPatternEvidenceV1,
): LowPreloadDirectionalityMetricsV1 {
  return {
    deltaEPeakVsNominal: relativeDelta(evidence.ePeakValue, nominalBaseline?.ePeakValue),
    deltaEAreaVsNominal: relativeDelta(evidence.eArea, nominalBaseline?.eArea),
    deltaEarlyFillingFractionVsNominal: nullableDelta(
      evidence.earlyFillingFraction,
      nominalBaseline?.earlyFillingFraction,
    ),
    deltaEaAreaRatioVsNominal: relativeDelta(evidence.eaAreaRatio, nominalBaseline?.eaAreaRatio),
    deltaAContributionVsNominal: relativeDelta(evidence.aArea, nominalBaseline?.aArea),
  };
}

function relativeDelta(value: number | undefined, baseline: number | undefined): number | null {
  if (value == null || baseline == null || Math.abs(baseline) < 1e-9) return null;
  return (value - baseline) / Math.abs(baseline);
}

function nullableDelta(value: number | undefined, baseline: number | undefined): number | null {
  if (value == null || baseline == null) return null;
  return value - baseline;
}

export function patternIsUnexplainedMultiPeak(pattern: AvInflowPatternClassV1): boolean {
  return pattern === "multi_peak_unexplained";
}

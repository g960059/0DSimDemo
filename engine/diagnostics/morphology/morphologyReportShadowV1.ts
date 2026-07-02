import type { SimSample } from "@/engine/protocol";
import { lastCompleteBeat } from "@/engine/verification/shapeMetrics";
import { evaluateAvInflowArtifactGuard, mergeArtifactGuardDecisions } from "@/engine/diagnostics/morphology/artifactGuards";
import { classifyAvInflowPattern } from "@/engine/diagnostics/morphology/avInflowPatternClassifier";
import {
  evaluateAvInflowProfileExpectation,
  patternIsUnexplainedMultiPeak,
} from "@/engine/diagnostics/morphology/profileExpectationEvaluator";
import type {
  AvInflowMorphologyDecisionV1,
  MorphologyFinalDecisionV1,
  MorphologyPhysiologyAuditInputV1,
  MorphologyPhysiologyAuditReportV1,
  ProfileExpectationStatusV1,
} from "@/engine/diagnostics/morphology/morphologyDecisionV1";

export function morphologyPhysiologyAuditReportFromSamples(
  samples: readonly SimSample[],
  input: MorphologyPhysiologyAuditInputV1,
): MorphologyPhysiologyAuditReportV1 {
  const mode = "shadow";
  const strictNormalBaselineEarned = input.strictNormalBaselineEarned ?? false;
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) {
    return emptyReport(input, mode, strictNormalBaselineEarned);
  }
  const mvf = avInflowDecision(beat, "MV", input, input.nominalBaseline?.mvf);
  const tvf = avInflowDecision(beat, "TV", input, input.nominalBaseline?.tvf);
  const artifactGuard = mergeArtifactGuardDecisions([mvf.artifactGuard, tvf.artifactGuard]);
  const profileExpectation = mergeProfileExpectation([mvf.profileExpectation.status, tvf.profileExpectation.status]);
  const enforcedEquivalentDecision = enforcedDecisionFromParts(artifactGuard, profileExpectation, [mvf, tvf]);
  const forbiddenRescueFlags = uniqueStrings([
    ...mvf.forbiddenRescueFlags,
    ...tvf.forbiddenRescueFlags,
  ]);
  const warnings = uniqueStrings([...mvf.warnings, ...tvf.warnings]);
  return {
    version: "morphology-physiology-audit-v1",
    mode,
    profileId: input.profileId,
    runId: input.runId,
    scenarioId: input.scenarioId,
    strictNormalBaselineEarned,
    overall: {
      artifactGuard,
      profileExpectation,
      finalDecision: "report-only",
      enforcedEquivalentDecision,
      canAffectGate: false,
    },
    mvf,
    tvf,
    comparisons: {
      nominalBaselineRunId: input.nominalBaseline?.runId,
      directionalityMetrics: {
        mvfStatus: mvf.profileExpectation.status,
        tvfStatus: tvf.profileExpectation.status,
      },
    },
    warnings,
    forbiddenRescueFlags,
  };
}

function avInflowDecision(
  samples: readonly SimSample[],
  valve: "MV" | "TV",
  input: MorphologyPhysiologyAuditInputV1,
  nominalBaseline: Parameters<typeof evaluateAvInflowProfileExpectation>[2],
): AvInflowMorphologyDecisionV1 {
  const hints = valve === "MV" ? input.mvfHints : input.tvfHints;
  const patternClass = classifyAvInflowPattern(
    samples,
    valve,
    input.profileId,
    hints,
    input.rhythm,
  );
  const artifactGuard = evaluateAvInflowArtifactGuard(patternClass.evidence);
  const profileExpectation = evaluateAvInflowProfileExpectation(input.profileId, patternClass, nominalBaseline, valve);
  const forbiddenRescueFlags = forbiddenFlags(
    artifactGuard.status === "fail",
    patternIsUnexplainedMultiPeak(patternClass.patternClass),
    input.strictNormalBaselineEarned ?? false,
    input.profileId,
  );
  const enforcedEquivalentDecision = enforcedDecisionFromParts(
    artifactGuard.status,
    profileExpectation.status,
    [],
  );
  return {
    valve,
    artifactGuard,
    patternClass,
    profileExpectation,
    finalDecision: "report-only",
    enforcedEquivalentDecision,
    canAffectGate: false,
    forbiddenRescueFlags,
    warnings: warningMessages(forbiddenRescueFlags, profileExpectation.status),
  };
}

function emptyReport(
  input: MorphologyPhysiologyAuditInputV1,
  mode: "shadow",
  strictNormalBaselineEarned: boolean,
): MorphologyPhysiologyAuditReportV1 {
  return {
    version: "morphology-physiology-audit-v1",
    mode,
    profileId: input.profileId,
    runId: input.runId,
    scenarioId: input.scenarioId,
    strictNormalBaselineEarned,
    overall: {
      artifactGuard: "inconclusive",
      profileExpectation: "not_applicable",
      finalDecision: "report-only",
      enforcedEquivalentDecision: "warn",
      canAffectGate: false,
    },
    warnings: ["No complete beat is available for physiology morphology audit."],
    forbiddenRescueFlags: ["profile-relaxation-disabled-until-strict-baseline-earned"],
  };
}

function enforcedDecisionFromParts(
  artifactGuard: "pass" | "fail" | "inconclusive",
  profileExpectation: ProfileExpectationStatusV1,
  decisions: readonly AvInflowMorphologyDecisionV1[],
): Exclude<MorphologyFinalDecisionV1, "report-only"> {
  if (artifactGuard === "fail") return "fail";
  if (decisions.some((decision) => decision.forbiddenRescueFlags.includes("unexplained-multipeak-default-fail"))) {
    return "fail";
  }
  if (profileExpectation === "fail") return "fail";
  if (artifactGuard === "inconclusive" || profileExpectation === "warn" || profileExpectation === "not_applicable") {
    return "warn";
  }
  return "pass";
}

function mergeProfileExpectation(statuses: readonly ProfileExpectationStatusV1[]): ProfileExpectationStatusV1 {
  if (statuses.some((status) => status === "fail")) return "fail";
  if (statuses.some((status) => status === "warn")) return "warn";
  if (statuses.every((status) => status === "met")) return "met";
  return "not_applicable";
}

function forbiddenFlags(
  artifactFailed: boolean,
  unexplainedMultiPeak: boolean,
  strictNormalBaselineEarned: boolean,
  profileId: string,
): string[] {
  const flags: string[] = [];
  if (artifactFailed) flags.push("artifact-fail-cannot-be-rescued-by-profile");
  if (unexplainedMultiPeak) flags.push("unexplained-multipeak-default-fail");
  if (!strictNormalBaselineEarned) flags.push("profile-relaxation-disabled-until-strict-baseline-earned");
  if (profileId !== "normal_sinus_central" && !strictNormalBaselineEarned) {
    flags.push("normal-envelope-residual-not-eligible-for-variant-rescue");
  }
  return flags;
}

function warningMessages(flags: readonly string[], profileExpectation: ProfileExpectationStatusV1): string[] {
  const warnings: string[] = [];
  if (flags.includes("artifact-fail-cannot-be-rescued-by-profile")) {
    warnings.push("Artifact guard failed; profile expectation cannot rescue this waveform.");
  }
  if (flags.includes("profile-relaxation-disabled-until-strict-baseline-earned")) {
    warnings.push("Profile-aware relaxation is report-only until strict normal baseline is earned.");
  }
  if (profileExpectation === "warn") {
    warnings.push("Profile expectation is report-only or mixed; do not use it as current acceptance.");
  }
  return warnings;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

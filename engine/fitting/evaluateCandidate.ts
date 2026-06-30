import { defaultParams } from "@/engine/ModelCore";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { summarizeGates, type GateResult } from "@/engine/verification/gates";
import {
  runVerification,
  type VerificationGateSet,
  type VerificationReport,
} from "@/engine/verification/report";
import type { VerificationMode, VerificationProfile } from "@/engine/verification/profiles";
import { mergeParameterPatch, type CandidatePatch } from "@/engine/fitting/parameterSpace";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import {
  evaluateObjective,
  withObjectiveRejectReason,
  type ObjectiveEvaluation,
  type ObjectiveSpec,
} from "@/engine/fitting/objective";

export type CandidateRejectStage =
  | "none"
  | "settle"
  | "validity"
  | "normal-shape";

export type CandidateEvaluation = {
  id: string;
  accepted: boolean;
  rejectStage: CandidateRejectStage;
  hardFailures: GateResult[];
  softFailures: GateResult[];
  score: number;
  objective: ObjectiveEvaluation;
  report: VerificationReport;
};

export type CandidateEvaluationOptions = {
  profile?: VerificationMode | VerificationProfile;
  gateSet?: VerificationGateSet;
  objective?: ObjectiveSpec;
};

export function evaluateCandidate(
  candidate: CandidatePatch | ParameterPatch,
  baseParams: Partial<CoreRuntimeParams> = defaultParams(),
  options: CandidateEvaluationOptions = {},
): CandidateEvaluation {
  const patch = "patch" in candidate ? candidate.patch : candidate;
  const id = "id" in candidate ? candidate.id : "anonymous-candidate";
  const invalid = invalidPatchGate(patch);
  if (invalid) {
    const profile = resolveVerificationProfile(options.profile ?? "fitFast");
    const report: VerificationReport = {
      profile,
      gateSet: options.gateSet ?? "validityOnly",
      runtimeActiveSourceMode: null,
      generatedAt: new Date().toISOString(),
      summary: summarizeGates([invalid]),
      steady: null,
      settleStatus: null,
      metrics: null,
      shape: null,
      morphology: null,
      gates: [invalid],
      failureLocations: [{
        gateId: invalid.id,
        severity: invalid.severity,
        artifactFile: "report.md",
        panelId: "gates",
        panelTitle: "Gates",
        value: invalid.value,
        threshold: invalid.threshold,
      }],
      measurement: null,
    };
    const objective = withObjectiveRejectReason(evaluateObjective(report, options.objective), "invalid-patch");
    return {
      id,
      accepted: false,
      rejectStage: "validity",
      hardFailures: [invalid],
      softFailures: [],
      score: 0,
      objective,
      report,
    };
  }
  const params = mergeParameterPatch(baseParams, patch);
  const report = runVerification(params, {
    profile: options.profile ?? "fitFast",
    gateSet: options.gateSet ?? "validityOnly",
  });
  const hardFailures = report.gates.filter((gate) => gate.severity === "hard" && gate.status === "fail");
  const softFailures = report.gates.filter((gate) => gate.severity === "soft" && gate.status === "fail");
  return {
    id,
    accepted: hardFailures.length === 0,
    rejectStage: classifyRejectStage(hardFailures),
    hardFailures,
    softFailures,
    score: report.summary.score,
    objective: evaluateObjective(report, options.objective),
    report,
  };
}

export function rankCandidates(evaluations: CandidateEvaluation[]): CandidateEvaluation[] {
  return [...evaluations].sort(compareByLegacyRank);
}

export function rankCandidatesByObjective(evaluations: CandidateEvaluation[]): CandidateEvaluation[] {
  return [...evaluations].sort((a, b) => {
    if (a.objective.ok !== b.objective.ok) return a.objective.ok ? -1 : 1;
    const aLoss = Number.isFinite(a.objective.totalLoss) ? a.objective.totalLoss : Infinity;
    const bLoss = Number.isFinite(b.objective.totalLoss) ? b.objective.totalLoss : Infinity;
    if (aLoss !== bLoss) return aLoss - bLoss;
    return compareByLegacyRank(a, b);
  });
}

function compareByLegacyRank(a: CandidateEvaluation, b: CandidateEvaluation): number {
  if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
  if (a.hardFailures.length !== b.hardFailures.length) return a.hardFailures.length - b.hardFailures.length;
  if (a.softFailures.length !== b.softFailures.length) return a.softFailures.length - b.softFailures.length;
  const aScore = Number.isFinite(a.score) ? a.score : -Infinity;
  const bScore = Number.isFinite(b.score) ? b.score : -Infinity;
  if (aScore !== bScore) return bScore - aScore;
  return a.id.localeCompare(b.id);
}

function classifyRejectStage(hardFailures: GateResult[]): CandidateRejectStage {
  if (hardFailures.length === 0) return "none";
  if (hardFailures.some((gate) => gate.id === "settled")) return "settle";
  if (hardFailures.some((gate) => [
    "finite-samples",
    "health-not-failed",
    "left-right-forward-co-balance",
    "projector-quiet",
  ].includes(gate.id))) return "validity";
  return "normal-shape";
}

function invalidPatchGate(patch: ParameterPatch): GateResult | null {
  const badPaths: string[] = [];
  collectInvalidNumberPaths(patch, "patch", badPaths);
  if (badPaths.length === 0) return null;
  return {
    id: "candidate-patch-finite",
    label: "Candidate patch numeric values are finite",
    severity: "hard",
    status: "fail",
    value: badPaths.slice(0, 5).join(", "),
    threshold: "all numeric candidate values finite",
    score: 0,
    message: "Candidate patch contains NaN or Infinity and was rejected before integration.",
  };
}

function collectInvalidNumberPaths(value: unknown, path: string, out: string[]): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) out.push(path);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectInvalidNumberPaths(child, `${path}.${key}`, out);
  }
}

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
  report: VerificationReport;
};

export type CandidateEvaluationOptions = {
  profile?: VerificationMode | VerificationProfile;
  gateSet?: VerificationGateSet;
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
      generatedAt: new Date().toISOString(),
      summary: summarizeGates([invalid]),
      settleStatus: null,
      metrics: null,
      shape: null,
      gates: [invalid],
      measurement: null,
    };
    return {
      id,
      accepted: false,
      rejectStage: "validity",
      hardFailures: [invalid],
      softFailures: [],
      score: 0,
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
    report,
  };
}

export function rankCandidates(evaluations: CandidateEvaluation[]): CandidateEvaluation[] {
  return [...evaluations].sort((a, b) => {
    if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
    if (a.hardFailures.length !== b.hardFailures.length) return a.hardFailures.length - b.hardFailures.length;
    if (a.softFailures.length !== b.softFailures.length) return a.softFailures.length - b.softFailures.length;
    const aScore = Number.isFinite(a.score) ? a.score : -Infinity;
    const bScore = Number.isFinite(b.score) ? b.score : -Infinity;
    if (aScore !== bScore) return bScore - aScore;
    return a.id.localeCompare(b.id);
  });
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

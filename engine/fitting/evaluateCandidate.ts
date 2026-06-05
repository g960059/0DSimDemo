import { defaultParams } from "@/engine/ModelCore";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { type GateResult } from "@/engine/verification/gates";
import {
  runVerification,
  type VerificationGateSet,
  type VerificationReport,
} from "@/engine/verification/report";
import type { VerificationMode, VerificationProfile } from "@/engine/verification/profiles";
import { mergeParameterPatch, type CandidatePatch } from "@/engine/fitting/parameterSpace";

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
  const params = mergeParameterPatch(baseParams, patch);
  const report = runVerification(params, {
    profile: options.profile ?? "fitFast",
    gateSet: options.gateSet ?? "normalBaseline",
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
    return b.score - a.score;
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

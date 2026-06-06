import type {
  VerificationReport,
  VerificationSteadySummary,
} from "@/engine/verification/report";

export type ObjectiveTargetDirection = "match" | "atLeast" | "atMost";

export type ObjectiveTargetSpec = {
  key: string;
  target: number;
  scale: number;
  /** v1 requires positive weights; zero/negative/non-finite weights fall back to 1. */
  weight?: number;
  direction?: ObjectiveTargetDirection;
};

export type ObjectiveSpec = {
  targets?: ObjectiveTargetSpec[];
  requireProjectorQuiet?: boolean;
};

export type ObjectiveTargetBreakdown = {
  key: string;
  target: number;
  actual: number | null;
  scale: number;
  weight: number;
  direction: ObjectiveTargetDirection;
  loss: number;
  status: "matched" | "missing";
};

export type ObjectiveEvaluation = {
  ok: boolean;
  totalLoss: number;
  targetLoss: number;
  gatePenalty: number;
  convergencePenalty: number;
  residualPenalty: number;
  scoreLoss: number;
  rejectReasons: string[];
  steady: VerificationSteadySummary | null;
  observables: Record<string, number>;
  targetBreakdown: ObjectiveTargetBreakdown[];
};

export type ObjectiveCompactSummary = {
  steadyStatus: VerificationSteadySummary["status"] | null;
  objectiveTotalLoss: number;
  convergencePenalty: number;
  residualPenalty: number;
  paramsHash: string | null;
};

const MAX_LOSS = 1e12;
const MISSING_TARGET_PENALTY = 1e6;

const STATUS_PENALTY: Record<VerificationSteadySummary["status"], number> = {
  converged: 0,
  "projector-not-quiet": 1e3,
  cap: 1e5,
  "forced-trend": 1e5,
  unstable: 1e6,
};

export function evaluateObjective(
  report: VerificationReport,
  spec: ObjectiveSpec = {},
): ObjectiveEvaluation {
  const observables = collectObjectiveObservables(report);
  const rejectReasons: string[] = [];
  const { loss: targetLoss, breakdown } = evaluateTargets(observables, spec.targets ?? [], rejectReasons);
  const gatePenalty = gatePenaltyFor(report, rejectReasons);
  const convergencePenalty = convergencePenaltyFor(report, spec, rejectReasons);
  const residualPenalty = residualPenaltyFor(report.steady);
  // Gate score remains a lightweight tie-break channel separate from hard/soft gate penalties.
  const scoreLoss = finiteLoss(1 - clamp01(finiteOrDefault(report.summary.score, 0)));
  const totalLoss = finiteSum([
    targetLoss,
    gatePenalty,
    convergencePenalty,
    residualPenalty,
    scoreLoss,
  ]);

  return {
    ok: rejectReasons.length === 0 && report.summary.pass && (report.steady?.ok ?? false),
    totalLoss,
    targetLoss,
    gatePenalty,
    convergencePenalty,
    residualPenalty,
    scoreLoss,
    rejectReasons,
    steady: report.steady,
    observables,
    targetBreakdown: breakdown,
  };
}

export function collectObjectiveObservables(report: VerificationReport): Record<string, number> {
  const out: Record<string, number> = {};
  addFiniteObject("metrics", report.metrics, out);
  addFiniteObject("shape", report.shape, out);
  if (report.steady) {
    addFiniteObject("steady.residuals", report.steady.residuals, out);
    addFiniteObject("steady.solverStats", report.steady.solverStats, out);
    addFinite("steady.state.t", report.steady.state.t, out);
    addFinite("steady.state.phi", report.steady.state.phi, out);
    addFinite("steady.state.xLength", report.steady.state.xLength, out);
  }
  return out;
}

export function summarizeObjective(objective: ObjectiveEvaluation): ObjectiveCompactSummary {
  return {
    steadyStatus: objective.steady?.status ?? null,
    objectiveTotalLoss: objective.totalLoss,
    convergencePenalty: objective.convergencePenalty,
    residualPenalty: objective.residualPenalty,
    paramsHash: objective.steady?.state.paramsHash ?? null,
  };
}

export function withObjectiveRejectReason(
  objective: ObjectiveEvaluation,
  reason: string,
): ObjectiveEvaluation {
  if (objective.rejectReasons.includes(reason)) return objective;
  return {
    ...objective,
    ok: false,
    rejectReasons: [reason, ...objective.rejectReasons],
  };
}

function evaluateTargets(
  observables: Record<string, number>,
  targets: ObjectiveTargetSpec[],
  rejectReasons: string[],
): { loss: number; breakdown: ObjectiveTargetBreakdown[] } {
  let loss = 0;
  const breakdown: ObjectiveTargetBreakdown[] = [];
  for (const target of targets) {
    const key = target.key;
    const actual = observables[key];
    const direction = target.direction ?? "match";
    const scale = finitePositiveOrDefault(target.scale, 1);
    const weight = finitePositiveOrDefault(target.weight ?? 1, 1);
    const targetValue = finiteOrNull(target.target);
    if (actual == null || targetValue == null) {
      const itemLoss = finiteLoss(MISSING_TARGET_PENALTY * weight);
      loss = finiteSum([loss, itemLoss]);
      rejectReasons.push(targetValue == null ? `invalid-target:${key}` : `missing-target:${key}`);
      breakdown.push({
        key,
        target: targetValue ?? 0,
        actual: null,
        scale,
        weight,
        direction,
        loss: itemLoss,
        status: "missing",
      });
      continue;
    }
    const normalized = normalizedTargetResidual(actual, targetValue, scale, direction);
    const itemLoss = finiteLoss(weight * normalized * normalized);
    loss = finiteSum([loss, itemLoss]);
    breakdown.push({
      key,
      target: targetValue,
      actual,
      scale,
      weight,
      direction,
      loss: itemLoss,
      status: "matched",
    });
  }
  return { loss: finiteLoss(loss), breakdown };
}

function gatePenaltyFor(report: VerificationReport, rejectReasons: string[]): number {
  let hard = 0;
  let soft = 0;
  for (const gate of report.gates) {
    if (gate.status !== "fail") continue;
    if (gate.severity === "hard") {
      hard += 1;
      rejectReasons.push(`hard-gate:${gate.id}`);
    } else {
      soft += 1;
    }
  }
  return finiteLoss(hard * 1e4 + soft * 1e2);
}

function convergencePenaltyFor(
  report: VerificationReport,
  spec: ObjectiveSpec,
  rejectReasons: string[],
): number {
  const steady = report.steady;
  if (!steady) {
    rejectReasons.push("steady:null");
    return 1e6;
  }
  let penalty = STATUS_PENALTY[steady.status];
  if (steady.status !== "converged") {
    rejectReasons.push(`steady:${steady.status}`);
  }
  const requireProjectorQuiet = spec.requireProjectorQuiet ?? report.profile.requireProjectorQuiet;
  if (requireProjectorQuiet && !steady.residuals.projectorQuiet && steady.status !== "projector-not-quiet") {
    penalty = finiteSum([penalty, 1e3]);
    rejectReasons.push("projector-not-quiet");
  }
  return finiteLoss(penalty);
}

function residualPenaltyFor(steady: VerificationSteadySummary | null): number {
  if (!steady) return 0;
  const residuals = steady.residuals;
  return finiteSum([
    scaledSquare(residuals.leftRightSvMismatchLMin, 0.5),
    residuals.tbvDriftPctPer60s == null ? 0 : scaledSquare(residuals.tbvDriftPctPer60s, 0.1),
    residuals.venousMaxResidualMl == null ? 0 : scaledSquare(residuals.venousMaxResidualMl, 0.05),
  ]);
}

function normalizedTargetResidual(
  actual: number,
  target: number,
  scale: number,
  direction: ObjectiveTargetDirection,
): number {
  if (direction === "atLeast") return actual >= target ? 0 : (target - actual) / scale;
  if (direction === "atMost") return actual <= target ? 0 : (actual - target) / scale;
  return (actual - target) / scale;
}

function scaledSquare(value: number, scale: number): number {
  const finite = finiteOrDefault(value, 0);
  const s = finitePositiveOrDefault(scale, 1);
  return finiteLoss((finite / s) ** 2);
}

function addFiniteObject(prefix: string, value: unknown, out: Record<string, number>): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    addFinite(`${prefix}.${key}`, child, out);
  }
}

function addFinite(key: string, value: unknown, out: Record<string, number>): void {
  if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
}

function finiteSum(values: number[]): number {
  return finiteLoss(values.reduce((sum, value) => sum + finiteOrDefault(value, 0), 0));
}

function finiteLoss(value: number): number {
  if (!Number.isFinite(value)) return MAX_LOSS;
  return Math.max(0, Math.min(MAX_LOSS, value));
}

function finiteOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function finitePositiveOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

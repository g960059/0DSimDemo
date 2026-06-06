import { runToPeriodicSteady } from "@/engine/steadyJob";
import type { CoreRuntimeParams } from "@/engine/protocol";
import type {
  RunToPeriodicSteadyOptions,
  SolverStats,
  SteadyResiduals,
  SteadyResult,
  SteadyStatus,
} from "@/engine/stateContract";
import {
  resolveVerificationProfile,
  type VerificationMode,
  type VerificationProfile,
} from "@/engine/verification/profiles";

export type SteadyCrossCheckSolverKind = "fixed-heun";
export type SteadyCrossCheckCategory = "metrics" | "residuals" | "comparable" | "state";

export type SteadyCrossCheckSolver = {
  id: string;
  kind?: SteadyCrossCheckSolverKind;
  options?: RunToPeriodicSteadyOptions;
};

export type SteadyCrossCheckCase = {
  id: string;
  params: Partial<CoreRuntimeParams>;
  profile?: VerificationMode | VerificationProfile;
  options?: RunToPeriodicSteadyOptions;
};

export type NumericTolerance = {
  abs: number;
  rel: number;
};

export type SteadyCrossCheckTolerances = Record<SteadyCrossCheckCategory, NumericTolerance>;

export type SteadyCrossCheckOptions = {
  solvers?: SteadyCrossCheckSolver[];
  tolerances?: Partial<Record<SteadyCrossCheckCategory, Partial<NumericTolerance>>>;
};

export type SteadyCrossCheckStateMetadata = {
  schemaVersion: SteadyResult["state"]["schemaVersion"];
  modelVersion: SteadyResult["state"]["modelVersion"];
  stateLayoutHash: string;
  paramsHash: string;
  targetParamsHash: string;
  t: number;
  phi: number;
  xLength: number;
};

export type SteadyCrossCheckRun = {
  solverId: string;
  kind: SteadyCrossCheckSolverKind;
  ok: boolean;
  status: SteadyStatus;
  solverStats: SolverStats;
  residuals: SteadyResiduals;
  state: SteadyCrossCheckStateMetadata;
};

export type NumericDelta = {
  key: string;
  abs: number;
  rel: number;
  reference: number;
  candidate: number;
};

export type SteadyCrossCheckMissingKeys = {
  referenceOnly: string[];
  candidateOnly: string[];
};

export type SteadyCrossCheckComparison = {
  referenceSolverId: string;
  candidateSolverId: string;
  pass: boolean;
  statusMismatch: boolean;
  okMismatch: boolean;
  metadataMismatches: string[];
  missingKeys: Record<SteadyCrossCheckCategory, SteadyCrossCheckMissingKeys>;
  worst: Record<SteadyCrossCheckCategory, NumericDelta | null>;
  worstOverall: { category: SteadyCrossCheckCategory; delta: NumericDelta } | null;
  maxNormalizedDelta: number;
  failureReasons: string[];
};

export type SteadyCrossCheckCaseReport = {
  id: string;
  pass: boolean;
  runs: SteadyCrossCheckRun[];
  comparisons: SteadyCrossCheckComparison[];
};

export type SteadyCrossCheckSummary = {
  pass: boolean;
  caseCount: number;
  comparisonCount: number;
  failedCases: number;
  failedComparisons: number;
  maxNormalizedDelta: number;
  worst: {
    caseId: string;
    referenceSolverId: string;
    candidateSolverId: string;
    category: SteadyCrossCheckCategory;
    delta: NumericDelta;
  } | null;
};

export type SteadyCrossCheckReport = {
  summary: SteadyCrossCheckSummary;
  tolerances: SteadyCrossCheckTolerances;
  cases: SteadyCrossCheckCaseReport[];
};

const DEFAULT_SOLVERS: Required<Pick<SteadyCrossCheckSolver, "id" | "kind">>[] = [
  { id: "reference", kind: "fixed-heun" },
  { id: "candidate", kind: "fixed-heun" },
];

const DEFAULT_TOLERANCES: SteadyCrossCheckTolerances = {
  metrics: { abs: 1e-9, rel: 1e-9 },
  residuals: { abs: 1e-9, rel: 1e-9 },
  comparable: { abs: 1e-9, rel: 1e-9 },
  state: { abs: 1e-12, rel: 1e-12 },
};

export function runSteadyCrossCheck(
  cases: SteadyCrossCheckCase[],
  options: SteadyCrossCheckOptions = {},
): SteadyCrossCheckReport {
  if (cases.length === 0) throw new Error("runSteadyCrossCheck requires at least one case");
  const solvers = resolveSolvers(options.solvers);
  const tolerances = resolveTolerances(options.tolerances);
  const caseReports = cases.map((item) => runCase(item, solvers, tolerances));
  return {
    summary: summarize(caseReports),
    tolerances,
    cases: caseReports,
  };
}

function runCase(
  item: SteadyCrossCheckCase,
  solvers: Required<Pick<SteadyCrossCheckSolver, "id" | "kind"> & { options?: RunToPeriodicSteadyOptions }>[],
  tolerances: SteadyCrossCheckTolerances,
): SteadyCrossCheckCaseReport {
  const rawResults = solvers.map((solver) => {
    return {
      solver,
      result: runSolver(item, solver),
    };
  });
  const runs = rawResults.map(({ solver, result }) => compactRun(solver.id, solver.kind, result));
  const reference = rawResults[0];
  const comparisons = rawResults.slice(1).map(({ solver, result }) => {
    return compareResults(reference.solver.id, reference.result, solver.id, result, tolerances);
  });
  return {
    id: item.id,
    pass: comparisons.every((comparison) => comparison.pass),
    runs,
    comparisons,
  };
}

function runSolver(
  item: SteadyCrossCheckCase,
  solver: Required<Pick<SteadyCrossCheckSolver, "id" | "kind"> & { options?: RunToPeriodicSteadyOptions }>,
): SteadyResult {
  if (solver.kind !== "fixed-heun") {
    throw new Error(`Unsupported steady cross-check solver kind: ${solver.kind}`);
  }
  return runToPeriodicSteady(item.params, resolveRunOptions(item, solver.options));
}

function compareResults(
  referenceSolverId: string,
  reference: SteadyResult,
  candidateSolverId: string,
  candidate: SteadyResult,
  tolerances: SteadyCrossCheckTolerances,
): SteadyCrossCheckComparison {
  const failureReasons: string[] = [];
  const statusMismatch = reference.status !== candidate.status;
  const okMismatch = reference.ok !== candidate.ok;
  if (statusMismatch) failureReasons.push(`status:${reference.status}->${candidate.status}`);
  if (okMismatch) failureReasons.push(`ok:${String(reference.ok)}->${String(candidate.ok)}`);

  const metadataMismatches = metadataMismatchesFor(reference, candidate);
  failureReasons.push(...metadataMismatches.map((key) => `metadata:${key}`));

  const metrics = compareNumericMaps(
    numericRecord(reference.metrics),
    numericRecord(candidate.metrics),
    tolerances.metrics,
  );
  const residuals = compareNumericMaps(
    numericRecord(reference.residuals),
    numericRecord(candidate.residuals),
    tolerances.residuals,
  );
  const comparable = compareNumericMaps(
    numericRecord(reference.comparableState.values),
    numericRecord(candidate.comparableState.values),
    tolerances.comparable,
  );
  const state = compareNumericMaps(
    stateNumericRecord(reference),
    stateNumericRecord(candidate),
    tolerances.state,
  );
  const byCategory = { metrics, residuals, comparable, state };
  for (const [category, result] of Object.entries(byCategory) as [SteadyCrossCheckCategory, NumericComparisonResult][]) {
    if (result.referenceOnly.length > 0) failureReasons.push(`${category}:missing-candidate`);
    if (result.candidateOnly.length > 0) failureReasons.push(`${category}:missing-reference`);
    if (!result.pass) failureReasons.push(`${category}:delta`);
  }
  const worstOverall = worstAcrossCategories(byCategory);
  return {
    referenceSolverId,
    candidateSolverId,
    pass: failureReasons.length === 0,
    statusMismatch,
    okMismatch,
    metadataMismatches,
    missingKeys: {
      metrics: missingKeys(metrics),
      residuals: missingKeys(residuals),
      comparable: missingKeys(comparable),
      state: missingKeys(state),
    },
    worst: {
      metrics: metrics.worst,
      residuals: residuals.worst,
      comparable: comparable.worst,
      state: state.worst,
    },
    worstOverall: worstOverall
      ? { category: worstOverall.category, delta: worstOverall.result.worst! }
      : null,
    maxNormalizedDelta: worstOverall?.result.maxNormalizedDelta ?? 0,
    failureReasons,
  };
}

function compactRun(
  solverId: string,
  kind: SteadyCrossCheckSolverKind,
  result: SteadyResult,
): SteadyCrossCheckRun {
  return {
    solverId,
    kind,
    ok: result.ok,
    status: result.status,
    solverStats: compactSolverStats(result.solverStats),
    residuals: result.residuals,
    state: {
      schemaVersion: result.state.schemaVersion,
      modelVersion: result.state.modelVersion,
      stateLayoutHash: result.state.stateLayoutHash,
      paramsHash: result.state.paramsHash,
      targetParamsHash: result.state.targetParamsHash,
      t: result.state.t,
      phi: result.state.phi,
      xLength: result.state.x.length,
    },
  };
}

function compactSolverStats(stats: SolverStats): SolverStats {
  return {
    kind: stats.kind,
    dt: stats.dt,
    sampleHz: stats.sampleHz,
    nSteps: stats.nSteps,
    settleSeconds: stats.settleSeconds,
    measureSeconds: stats.measureSeconds,
  };
}

function resolveRunOptions(
  item: SteadyCrossCheckCase,
  solverOptions: RunToPeriodicSteadyOptions | undefined,
): RunToPeriodicSteadyOptions {
  const profileOptions = item.profile ? measureOptionsFromProfile(item.profile) : {};
  return {
    ...profileOptions,
    ...(item.options ?? {}),
    ...(solverOptions ?? {}),
    includeLastBeatSamples: false,
    includeWallMs: false,
  };
}

function measureOptionsFromProfile(profile: VerificationMode | VerificationProfile): RunToPeriodicSteadyOptions {
  const resolved = resolveVerificationProfile(profile);
  return {
    targetTBV: resolved.targetTBV,
    dt: resolved.dt,
    sampleHz: resolved.sampleHz,
    settlePolicy: resolved.settlePolicy,
    measureBeats: resolved.measureBeats,
    requireProjectorQuiet: resolved.requireProjectorQuiet,
  };
}

function resolveSolvers(
  solvers: SteadyCrossCheckSolver[] | undefined,
): Required<Pick<SteadyCrossCheckSolver, "id" | "kind"> & { options?: RunToPeriodicSteadyOptions }>[] {
  const resolved = (solvers ?? DEFAULT_SOLVERS).map((solver) => ({
    id: solver.id,
    kind: solver.kind ?? "fixed-heun",
    options: solver.options,
  }));
  if (resolved.length < 2) throw new Error("runSteadyCrossCheck requires at least two solver specs");
  const ids = new Set<string>();
  for (const solver of resolved) {
    if (ids.has(solver.id)) throw new Error(`Duplicate steady cross-check solver id: ${solver.id}`);
    ids.add(solver.id);
  }
  return resolved;
}

function resolveTolerances(
  overrides: SteadyCrossCheckOptions["tolerances"],
): SteadyCrossCheckTolerances {
  const tolerances = {
    metrics: { ...DEFAULT_TOLERANCES.metrics, ...(overrides?.metrics ?? {}) },
    residuals: { ...DEFAULT_TOLERANCES.residuals, ...(overrides?.residuals ?? {}) },
    comparable: { ...DEFAULT_TOLERANCES.comparable, ...(overrides?.comparable ?? {}) },
    state: { ...DEFAULT_TOLERANCES.state, ...(overrides?.state ?? {}) },
  };
  for (const [category, item] of Object.entries(tolerances) as [SteadyCrossCheckCategory, NumericTolerance][]) {
    validateTolerance(`${category}.abs`, item.abs);
    validateTolerance(`${category}.rel`, item.rel);
  }
  return tolerances;
}

function validateTolerance(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid steady cross-check tolerance ${label}: expected finite non-negative number`);
  }
}

type NumericComparisonResult = {
  pass: boolean;
  worst: NumericDelta | null;
  maxNormalizedDelta: number;
  referenceOnly: string[];
  candidateOnly: string[];
};

function compareNumericMaps(
  reference: Record<string, number>,
  candidate: Record<string, number>,
  tolerance: NumericTolerance,
): NumericComparisonResult {
  const referenceOnly: string[] = [];
  const candidateOnly: string[] = [];
  let pass = true;
  let worst: NumericDelta | null = null;
  let maxNormalizedDelta = 0;
  const keys = new Set([...Object.keys(reference), ...Object.keys(candidate)]);
  for (const key of [...keys].sort()) {
    if (!(key in reference)) {
      candidateOnly.push(key);
      pass = false;
      continue;
    }
    if (!(key in candidate)) {
      referenceOnly.push(key);
      pass = false;
      continue;
    }
    const delta = numericDelta(key, reference[key], candidate[key]);
    const normalized = normalizedByTolerance(delta, tolerance);
    if (!worst || normalized > maxNormalizedDelta) {
      worst = delta;
      maxNormalizedDelta = normalized;
    }
    if (delta.abs > tolerance.abs && delta.rel > tolerance.rel) pass = false;
  }
  return {
    pass,
    worst,
    maxNormalizedDelta,
    referenceOnly,
    candidateOnly,
  };
}

function numericDelta(key: string, reference: number, candidate: number): NumericDelta {
  const abs = Math.abs(reference - candidate);
  const denom = Math.max(Math.abs(reference), Math.abs(candidate), 1e-12);
  return {
    key,
    abs,
    rel: abs / denom,
    reference,
    candidate,
  };
}

function normalizedByTolerance(delta: NumericDelta, tolerance: NumericTolerance): number {
  const absRatio = tolerance.abs > 0 ? delta.abs / tolerance.abs : delta.abs === 0 ? 0 : Infinity;
  const relRatio = tolerance.rel > 0 ? delta.rel / tolerance.rel : delta.rel === 0 ? 0 : Infinity;
  return Math.min(absRatio, relRatio);
}

function numericRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "number" && Number.isFinite(child)) out[key] = child;
  }
  return out;
}

function stateNumericRecord(result: SteadyResult): Record<string, number> {
  return {
    t: result.state.t,
    phi: result.state.phi,
    xLength: result.state.x.length,
  };
}

function metadataMismatchesFor(reference: SteadyResult, candidate: SteadyResult): string[] {
  const ref = compactRun("reference", "fixed-heun", reference).state;
  const cand = compactRun("candidate", "fixed-heun", candidate).state;
  const fields: (keyof SteadyCrossCheckStateMetadata)[] = [
    "schemaVersion",
    "modelVersion",
    "stateLayoutHash",
    "paramsHash",
    "targetParamsHash",
  ];
  return fields.filter((field) => ref[field] !== cand[field]);
}

function missingKeys(result: NumericComparisonResult): SteadyCrossCheckMissingKeys {
  return {
    referenceOnly: result.referenceOnly,
    candidateOnly: result.candidateOnly,
  };
}

function worstAcrossCategories(
  results: Record<SteadyCrossCheckCategory, NumericComparisonResult>,
): { category: SteadyCrossCheckCategory; result: NumericComparisonResult } | null {
  let best: { category: SteadyCrossCheckCategory; result: NumericComparisonResult } | null = null;
  for (const [category, result] of Object.entries(results) as [SteadyCrossCheckCategory, NumericComparisonResult][]) {
    if (!result.worst) continue;
    if (!best || result.maxNormalizedDelta > best.result.maxNormalizedDelta) {
      best = { category, result };
    }
  }
  return best;
}

function summarize(cases: SteadyCrossCheckCaseReport[]): SteadyCrossCheckSummary {
  let comparisonCount = 0;
  let failedComparisons = 0;
  let worst: SteadyCrossCheckSummary["worst"] = null;
  let maxNormalizedDelta = 0;
  for (const item of cases) {
    for (const comparison of item.comparisons) {
      comparisonCount += 1;
      if (!comparison.pass) failedComparisons += 1;
      if (comparison.worstOverall && comparison.maxNormalizedDelta >= maxNormalizedDelta) {
        maxNormalizedDelta = comparison.maxNormalizedDelta;
        worst = {
          caseId: item.id,
          referenceSolverId: comparison.referenceSolverId,
          candidateSolverId: comparison.candidateSolverId,
          category: comparison.worstOverall.category,
          delta: comparison.worstOverall.delta,
        };
      }
    }
  }
  const failedCases = cases.filter((item) => !item.pass).length;
  return {
    pass: failedCases === 0 && failedComparisons === 0,
    caseCount: cases.length,
    comparisonCount,
    failedCases,
    failedComparisons,
    maxNormalizedDelta,
    worst,
  };
}

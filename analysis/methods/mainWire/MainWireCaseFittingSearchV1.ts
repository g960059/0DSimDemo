import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3 as hemoRanges } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_LV_ACTIVE_TENSION_RESEARCH_RANGE_V1 as lvRange } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { ownMainWireStaticCaseCandidateV1 as ownCandidate, type MainWireStaticCaseCandidateV1 as Candidate,
  type MainWireStaticCaseFittingResultV1 as Saved, type runMainWireStaticCaseFittingV1,
  type MainWireCaseReferenceIdV1 as Reference } from "./MainWireStaticCaseFittingWorkflowV1";

export const MAIN_WIRE_CASE_FITTING_SEARCH_V1_ID = "main-wire-case-bounded-pattern-search-v1";
export const MAIN_WIRE_CASE_FITTING_COORDINATES_V1 = Object.freeze([
  { id: "tbv", unit: "mL", ...hemoRanges.totalBloodVolumeMl, initialStep: 100, affectedInputs: ["totalBloodVolumeMl"] },
  { id: "systemic-resistance", unit: "1", ...hemoRanges.systemicResistance, initialStep: .04, affectedInputs: ["systemicResistance"] },
  { id: "arterial-stiffness", unit: "1", ...hemoRanges.arterialStiffness, initialStep: .1, affectedInputs: ["arterialStiffness"] },
  { id: "lv-active", unit: "1", ...lvRange, initialStep: .05, affectedInputs: ["activeTensionScaleByWall.LVFW", "activeTensionScaleByWall.SEP"] },
] as const);
export type MainWireCaseFittingCoordinateIdV1 = typeof MAIN_WIRE_CASE_FITTING_COORDINATES_V1[number]["id"];
type CoordinateId = MainWireCaseFittingCoordinateIdV1;
type Coordinate = typeof MAIN_WIRE_CASE_FITTING_COORDINATES_V1[number];
type Outcome = Awaited<ReturnType<typeof runMainWireStaticCaseFittingV1>>;
export type MainWireCaseSearchObservationV1 = Readonly<{ metricId: string; actual: number | null; lower: number | null; upper: number; scale: number }>;
export type MainWireCaseSearchScoreV1 = Readonly<{
  status: string; rank: readonly (number | null)[] | null; targetsMet: boolean;
  observations: readonly MainWireCaseSearchObservationV1[]; holds: readonly string[];
}>;

const descriptors = (ids: readonly CoordinateId[]) => {
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error("Select distinct search coordinates");
  return ids.map(id => {
    const d = MAIN_WIRE_CASE_FITTING_COORDINATES_V1.find(d => d.id === id);
    if (!d) throw new Error(`Unsupported search coordinate: ${id}`);
    return d;
  });
};
export function readMainWireCaseSearchCoordinateV1(c: Candidate, id: CoordinateId) {
  if (id === "tbv") return c.hemodynamicResearchInputs.totalBloodVolumeMl;
  if (id === "systemic-resistance") return c.hemodynamicResearchInputs.systemicResistance;
  if (id === "arterial-stiffness") return c.hemodynamicResearchInputs.arterialStiffness;
  const wall = c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall;
  if (id !== "lv-active" || wall.LVFW !== wall.SEP) throw new Error("The LVFW/SEP coordinate requires equal explicit wall scales; it must not overwrite an asymmetric construction");
  return wall.LVFW;
}
export function withMainWireCaseSearchCoordinateV1(c: Candidate, id: CoordinateId, value: number): Candidate {
  const d = descriptors([id])[0]!;
  if (!Number.isFinite(value) || value < d.minimum || value > d.maximum) throw new Error("Search coordinate outside the existing exact research domain");
  readMainWireCaseSearchCoordinateV1(c, id);
  if (id === "lv-active") return { ...c, mechanismResearchInputs: { ...c.mechanismResearchInputs,
    chamberMechanics: { ...c.mechanismResearchInputs.chamberMechanics,
      activeTensionScaleByWall: { ...c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: value, SEP: value } } } };
  const key = id === "tbv" ? "totalBloodVolumeMl" : id === "systemic-resistance" ? "systemicResistance" : "arterialStiffness";
  return { ...c, hemodynamicResearchInputs: { ...c.hemodynamicResearchInputs, [key]: value } };
}

/** Uses CURRENT freshly computed reference assessments. No new normal ranges,
 * point targets, penalties for historical warnings, or missing-value imputation.
 * The existing HFrEF tuple ranks correlated targets jointly, not as likelihoods. */
export function scoreMainWireCaseFittingResultV1(result: Outcome): MainWireCaseSearchScoreV1 {
  const unknown = (status: string, holds: string[]): MainWireCaseSearchScoreV1 => ({ status, rank: null, targetsMet: false, observations: [], holds });
  if (result.status !== "saved-result-ready") return unknown(result.status, [result.message]);
  const rest = result.result.rest;
  if (rest.status === "unavailable") return unknown(rest.status, [rest.issue.code]);
  if (rest.referenceId === "hfref-chronic-dilated-v1") {
    const a = rest.assessment;
    return { status: rest.status, rank: a.ranking, targetsMet: a.screenPassed && a.preferredTargetsMet,
      observations: a.targets.map(t => ({ metricId: t.metricId, actual: t.actual, lower: t.lower, upper: t.upper, scale: t.upper - t.lower })),
      holds: [...a.screen.filter(s => s.status !== "passed").map(s => `screen:${s.metricId}:${s.status}`),
        ...a.targets.filter(s => s.status !== "passed").map(s => `target:${s.metricId}:${s.status}`)] };
  }
  const a = rest.assessment;
  const observations = a.operating.map(t => ({ metricId: t.metricId, actual: t.actual,
    lower: t.lower, upper: t.upper, scale: t.lower === null ? t.upper : t.upper - t.lower }));
  const holds = [...a.invalidOrFailedRetained, ...a.unavailable, ...a.operating.filter(t => t.status !== "passed").map(t => `operating:${t.metricId}:${t.status}`),
    ...(a.anatomyReviewRequired ? ["demographic-method-review-required"] : [])];
  if (a.unavailable.length || a.operating.some(t => t.status === "unresolved")) return { ...unknown(rest.status, holds), observations };
  const violation = Math.max(0, ...observations.map(t => Math.max((t.lower ?? -Infinity) - t.actual!, t.actual! - t.upper, 0) / t.scale));
  return { status: rest.status, rank: [rest.status === "passed" ? 0 : 1, a.invalidOrFailedRetained.length + Number(a.anatomyReviewRequired), violation],
    targetsMet: rest.status === "passed", observations, holds };
}

/** A missing soft component cannot win a tie or stand in for zero. Known
 * higher-priority improvements can still be compared; unresolved lower tiers
 * remain visible and prevent a claim that all targets are met. */
export function mainWireCaseScoreImprovesV1(a: MainWireCaseSearchScoreV1, b: MainWireCaseSearchScoreV1) {
  if (a.rank === null) return false;
  if (b.rank === null) return true;
  for (let i = 0; i < Math.max(a.rank.length, b.rank.length); i++) {
    const av = a.rank[i], bv = b.rank[i];
    if (av == null || bv == null) return false;
    if (Math.abs(av - bv) > 1e-9) return av < bv;
  }
  return false;
}

export type MainWireCaseSearchJobV1 = Readonly<{ id: string; candidateInputs: Candidate; reuse?: Saved }>;
export type MainWireCaseSearchEvaluationV1 = Readonly<{ id: string; candidateInputs: Candidate; score: MainWireCaseSearchScoreV1;
  outcome: Outcome; iteration: number; coordinateId: CoordinateId | null; delta: number }>;
type Evaluation = MainWireCaseSearchEvaluationV1;
type Probe = { candidateInputs: Candidate; coordinate: Coordinate; delta: number };

function localResponse(center: Evaluation, evaluations: readonly Evaluation[], coords: readonly Coordinate[]) {
  const columns = coords.map(d => {
    const minus = evaluations.find(e => e.coordinateId === d.id && e.delta < 0);
    const plus = evaluations.find(e => e.coordinateId === d.id && e.delta > 0);
    const lo = minus ?? center, hi = plus ?? center;
    const span = readMainWireCaseSearchCoordinateV1(hi.candidateInputs, d.id) - readMainWireCaseSearchCoordinateV1(lo.candidateInputs, d.id);
    const rows = center.score.observations.map(t => {
      const a = lo.score.observations.find(x => x.metricId === t.metricId)?.actual;
      const b = hi.score.observations.find(x => x.metricId === t.metricId)?.actual;
      return { metricId: t.metricId, normalizedResponsePerInitialStep: a == null || b == null || span <= 0 ? null : (b - a) / span * d.initialStep / t.scale };
    });
    return { coordinateId: d.id, endpoints: [lo.id, hi.id], stencil: minus && plus ? "two-sided" : minus || plus ? "one-sided" : "unavailable", rows };
  });
  const similarities: { a: CoordinateId; b: CoordinateId; cosine: number | null; commonMetricCount: number }[] = [];
  for (let i = 0; i < columns.length; i++) for (let j = i + 1; j < columns.length; j++) {
    const a = columns[i]!, b = columns[j]!;
    const pairs = a.rows.flatMap(row => {
      const x = row.normalizedResponsePerInitialStep, y = b.rows.find(r => r.metricId === row.metricId)?.normalizedResponsePerInitialStep;
      return x == null || y == null ? [] : [[x, y] as const];
    });
    const norm = Math.hypot(...pairs.map(p => p[0])) * Math.hypot(...pairs.map(p => p[1]));
    similarities.push({ a: a.coordinateId, b: b.coordinateId, commonMetricCount: pairs.length,
      cosine: norm > 1e-12 && pairs.length >= 2 ? pairs.reduce((s, [x, y]) => s + x * y, 0) / norm : null });
  }
  return { centerId: center.id, columns, similarities,
    interpretation: "Local secants of this candidate and these dependent outputs; neither biological identifiability nor an envelope guarantee." };
}

/** Small bounded coordinate-pattern search. One parallel poll per iteration,
 * stable input-order selection, exact-input cache, and nearest settled capture
 * continuation. Final cold/fine-grid/preload and waveform qualifications remain
 * separate; neither a result score nor this search can adopt a baseline/preset. */
export async function searchMainWireCaseFittingV1(request: Readonly<{
  referenceId: Reference; candidateInputs: Candidate; reuse?: Saved;
  coordinateIds?: readonly CoordinateId[]; maximumEvaluations: number; maximumWallTimeMs: number;
  evaluateBatch: (jobs: readonly MainWireCaseSearchJobV1[]) => Promise<readonly Outcome[]>;
  now?: () => number;
}>) {
  const now = request.now ?? (() => performance.now()), started = now();
  if (!Number.isInteger(request.maximumEvaluations) || request.maximumEvaluations < 1 || request.maximumEvaluations > 128
    || !Number.isFinite(request.maximumWallTimeMs) || request.maximumWallTimeMs <= 0 || request.maximumWallTimeMs > 3_600_000)
    throw new Error("Search requires 1–128 evaluations and at most one hour");
  const seed = ownCandidate(request.candidateInputs);
  const coords = descriptors(request.coordinateIds ?? MAIN_WIRE_CASE_FITTING_COORDINATES_V1.map(d => d.id));
  for (const d of coords) readMainWireCaseSearchCoordinateV1(seed, d.id);
  const evaluations: Evaluation[] = [], cache = new Map<string, Evaluation>();
  const iterations: { iteration: number; centerId: string; selectedId: string; stepScale: number; pollComplete: boolean; probes: { id: string; cached: boolean }[];
    response: ReturnType<typeof localResponse> }[] = [];
  const nextId = () => `evaluation-${String(evaluations.length + 1).padStart(3, "0")}`;
  const checkResults = (jobs: readonly MainWireCaseSearchJobV1[], outcomes: readonly Outcome[]) => {
    if (jobs.length !== outcomes.length) throw new Error("Search worker result count differs");
    for (const [i, result] of outcomes.entries()) if (result.status === "saved-result-ready"
      && (canonical(result.result.candidateInputs) !== canonical(jobs[i]!.candidateInputs) || result.result.rest.referenceId !== request.referenceId))
      throw new Error("Search worker result belongs to another candidate/reference");
  };
  const initialJob = { id: nextId(), candidateInputs: seed, ...(request.reuse ? { reuse: request.reuse } : {}) };
  const initialResults = await request.evaluateBatch([initialJob]); checkResults([initialJob], initialResults);
  let best: Evaluation = { id: initialJob.id, candidateInputs: seed, outcome: initialResults[0]!, score: scoreMainWireCaseFittingResultV1(initialResults[0]!),
    iteration: 0, coordinateId: null, delta: 0 };
  evaluations.push(best); cache.set(canonical(seed), best);
  let stepScale = 1, stopReason = "evaluation-budget";
  const nearest = (candidate: Candidate) => {
    let distance = Infinity, saved: Saved | undefined;
    for (const evaluation of evaluations) {
      if (evaluation.outcome.status !== "saved-result-ready") continue;
      const d = coords.reduce((sum, coord) => sum + ((readMainWireCaseSearchCoordinateV1(candidate, coord.id)
        - readMainWireCaseSearchCoordinateV1(evaluation.candidateInputs, coord.id)) / coord.initialStep) ** 2, 0);
      if (d < distance) { distance = d; saved = evaluation.outcome.result; }
    }
    return saved;
  };
  while (evaluations.length < request.maximumEvaluations) {
    if (best.score.targetsMet) { stopReason = "reference-targets-met"; break; }
    if (now() - started >= request.maximumWallTimeMs) { stopReason = "wall-time-budget"; break; }
    if (stepScale < .125) { stopReason = "local-step-exhausted"; break; }
    const iteration = iterations.length + 1, center = best;
    const probes: Probe[] = coords.flatMap(coordinate => [-1, 1].flatMap(sign => {
      const from = readMainWireCaseSearchCoordinateV1(center.candidateInputs, coordinate.id);
      const target = Math.round(Math.max(coordinate.minimum, Math.min(coordinate.maximum,
        from + sign * coordinate.initialStep * stepScale)) * 1e9) / 1e9;
      return Math.abs(target - from) < 1e-10 ? [] : [{ candidateInputs: withMainWireCaseSearchCoordinateV1(center.candidateInputs, coordinate.id, target), coordinate, delta: target - from }];
    }));
    const uncached = probes.filter(p => !cache.has(canonical(p.candidateInputs))).slice(0, request.maximumEvaluations - evaluations.length);
    const jobs = uncached.map((p, i) => ({ id: `evaluation-${String(evaluations.length + i + 1).padStart(3, "0")}`,
      candidateInputs: p.candidateInputs, reuse: nearest(p.candidateInputs) }));
    const outcomes = jobs.length ? await request.evaluateBatch(jobs) : [];
    checkResults(jobs, outcomes);
    for (let i = 0; i < jobs.length; i++) {
      const p = uncached[i]!, job = jobs[i]!, outcome = outcomes[i]!;
      const evaluation = { id: job.id, candidateInputs: job.candidateInputs, outcome, score: scoreMainWireCaseFittingResultV1(outcome), iteration,
        coordinateId: p.coordinate.id, delta: p.delta };
      evaluations.push(evaluation); cache.set(canonical(p.candidateInputs), evaluation);
    }
    const observed = probes.flatMap(p => {
      const e = cache.get(canonical(p.candidateInputs));
      return e === undefined ? [] : [{ ...e, coordinateId: p.coordinate.id, delta: p.delta }];
    });
    for (const e of observed) if (mainWireCaseScoreImprovesV1(e.score, best.score)) best = e;
    iterations.push({ iteration, centerId: center.id, selectedId: best.id, stepScale, pollComplete: observed.length === probes.length,
      probes: observed.map(e => ({ id: e.id, cached: !jobs.some(j => j.id === e.id) })), response: localResponse(center, observed, coords) });
    if (best.id === center.id) stepScale /= 2;
  }
  if (best.score.targetsMet) stopReason = "reference-targets-met";
  return { methodId: MAIN_WIRE_CASE_FITTING_SEARCH_V1_ID, referenceId: request.referenceId,
    scope: "research-periodic-rest-search-only", coordinateDomain: coords.map(d => ({ ...d, boundProvenance: "existing-exact-research-domain-not-clinical-normality" })),
    fixedInputs: "All inputs outside selected coordinates, including HR, anatomy, calcium, Land kinetics, venous tone and other walls, remain fixed.",
    maximumEvaluations: request.maximumEvaluations, maximumWallTimeMs: request.maximumWallTimeMs,
    evaluationCount: evaluations.length, wallTimeMs: now() - started, stopReason, bestId: best.id, bestCandidateInputs: best.candidateInputs,
    bestScore: best.score, evaluations, iterations,
    coordinateHeadroom: coords.map(d => {
      const value = readMainWireCaseSearchCoordinateV1(best.candidateInputs, d.id);
      return { coordinateId: d.id, value, initialStepsToLower: (value - d.minimum) / d.initialStep,
        initialStepsToUpper: (d.maximum - value) / d.initialStep, atBound: value <= d.minimum + 1e-9 || value >= d.maximum - 1e-9 };
    }),
    qualification: { pairedGrid: "not-evaluated", preloadReserve: "not-evaluated", waveformReview: "not-performed",
      clinicalValidationClaimed: false, publicPromotionAuthorized: false } };
}

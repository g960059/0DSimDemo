import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3 as hemoRanges } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_LV_ACTIVE_TENSION_RESEARCH_RANGE_V1 as lvRange } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import { MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1 as valveRanges } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { type MainWireStaticCaseCandidateV1 as Candidate,
  type MainWireStaticCaseFittingResultV1 as Saved, type runMainWireStaticCaseFittingV1,
  type MainWireCaseReferenceIdV1 as Reference } from "./MainWireStaticCaseFittingWorkflowV1";
import { resolveMainWireStaticCaseDefinitionV1 as definition } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { resolveMainWireCaseSearchProfileV1 as profile, scoreMainWireCaseFittingResultV1,
  type MainWireCaseSearchScoreV1 } from "@/analysis/registry/MainWireCaseSearchProfilesV1";
export { scoreMainWireCaseFittingResultV1 };
export type { MainWireCaseSearchScoreV1, MainWireCaseSearchObservationV1 } from "@/analysis/registry/MainWireCaseSearchProfilesV1";

export const MAIN_WIRE_CASE_FITTING_SEARCH_V1_ID = "main-wire-case-bounded-pattern-search-v1";
export const MAIN_WIRE_CASE_FITTING_COORDINATES_V1 = Object.freeze([
  { id: "tbv", unit: "mL", ...hemoRanges.totalBloodVolumeMl, initialStep: 100, affectedInputs: ["totalBloodVolumeMl"] },
  { id: "systemic-resistance", unit: "1", ...hemoRanges.systemicResistance, initialStep: .04, affectedInputs: ["systemicResistance"] },
  { id: "arterial-stiffness", unit: "1", ...hemoRanges.arterialStiffness, initialStep: .1, affectedInputs: ["arterialStiffness"] },
  { id: "lv-active", unit: "1", ...lvRange, initialStep: .05, affectedInputs: ["activeTensionScaleByWall.LVFW", "activeTensionScaleByWall.SEP"] },
  { id: "aortic-area", unit: "cm²", ...valveRanges.AoV.maximumForwardEoaCm2, initialStep: .05, affectedInputs: ["valveAreas.AoV.maximumForwardEoaCm2"] },
] as const);
export type MainWireCaseFittingCoordinateIdV1 = typeof MAIN_WIRE_CASE_FITTING_COORDINATES_V1[number]["id"];
type CoordinateId = MainWireCaseFittingCoordinateIdV1;
type Coordinate = typeof MAIN_WIRE_CASE_FITTING_COORDINATES_V1[number];
type Outcome = Awaited<ReturnType<typeof runMainWireStaticCaseFittingV1>>;
export class MainWireCaseCoordinateInputErrorV1 extends Error {}

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
  if (id === "aortic-area") return c.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2;
  const wall = c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall;
  if (id !== "lv-active" || wall.LVFW !== wall.SEP) throw new MainWireCaseCoordinateInputErrorV1("The LVFW/SEP coordinate requires equal explicit wall scales; it must not overwrite an asymmetric construction");
  return wall.LVFW;
}
/** Cheap preflight before any cold jobs; never silently remove a coordinate. */
export function assertMainWireCaseSearchInputsV1(referenceId: Reference, candidate: Candidate, ids: readonly CoordinateId[] = profile(referenceId).coordinateIds) {
  if (ids.some(id => !profile(referenceId).coordinateIds.includes(id))) throw new Error("Search coordinate is not allowed by this case");
  for (const d of descriptors(ids)) readMainWireCaseSearchCoordinateV1(candidate, d.id);
}
export function withMainWireCaseSearchCoordinateV1(c: Candidate, id: CoordinateId, value: number): Candidate {
  const d = descriptors([id])[0]!;
  if (!Number.isFinite(value) || value < d.minimum || value > d.maximum) throw new Error("Search coordinate outside the existing exact research domain");
  readMainWireCaseSearchCoordinateV1(c, id);
  if (id === "aortic-area") return { ...c, mechanismResearchInputs: { ...c.mechanismResearchInputs,
    valveAreas: { ...c.mechanismResearchInputs.valveAreas, AoV: { ...c.mechanismResearchInputs.valveAreas.AoV, maximumForwardEoaCm2: value } } } };
  if (id === "lv-active") return { ...c, mechanismResearchInputs: { ...c.mechanismResearchInputs,
    chamberMechanics: { ...c.mechanismResearchInputs.chamberMechanics,
      activeTensionScaleByWall: { ...c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: value, SEP: value } } } };
  const key = id === "tbv" ? "totalBloodVolumeMl" : id === "systemic-resistance" ? "systemicResistance" : "arterialStiffness";
  return { ...c, hemodynamicResearchInputs: { ...c.hemodynamicResearchInputs, [key]: value } };
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
export type MainWireCaseFinalDecisionV1 = Readonly<{ status: "accepted" | "rejected" | "held"; issues: readonly string[]; initializationCheck?: unknown }>;
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
 * continuation. Repeated probes select the already recorded observation; they
 * are not fresh executions from a different anchor. Optional final checks are
 * separate executions, never input-cache hits or permission to publish. */
export async function searchMainWireCaseFittingV1(request: Readonly<{
  referenceId: Reference; candidateInputs: Candidate; reuse?: Saved;
  /** Current-run coarse evidence may seed the search without being rerun. */
  initialOutcome?: Outcome;
  coordinateIds?: readonly CoordinateId[]; maximumEvaluations: number; maximumWallTimeMs: number;
  evaluateBatch: (jobs: readonly MainWireCaseSearchJobV1[]) => Promise<readonly Outcome[]>;
  assessFinalCandidate?: (evaluation: Evaluation) => Promise<MainWireCaseFinalDecisionV1>;
  maximumFinalChecks?: number;
  /** Reserved part of the total wall budget, unavailable to new search polls. */
  reservedFinalWallTimeMs?: number;
  /** Named active-time observations allow same-run deterministic replay. */
  timeSnapshot?: (key: string) => Promise<number>;
  now?: () => number;
}>) {
  const now = request.now ?? (() => performance.now());
  const clock = request.timeSnapshot ?? (async (_key: string) => now()), started = await clock("started");
  const reservedFinalWallTimeMs = request.reservedFinalWallTimeMs ?? 0;
  if (!Number.isInteger(request.maximumEvaluations) || request.maximumEvaluations < 1 || request.maximumEvaluations > 128
    || !Number.isFinite(request.maximumWallTimeMs) || request.maximumWallTimeMs <= 0 || request.maximumWallTimeMs > 3_600_000)
    throw new Error("Search requires 1–128 evaluations and at most one hour");
  if (!Number.isFinite(reservedFinalWallTimeMs) || reservedFinalWallTimeMs < 0 || reservedFinalWallTimeMs > request.maximumWallTimeMs)
    throw new Error("Final-time reservation must fit within the total search budget");
  const seed = definition(request.referenceId).ownInputs(request.candidateInputs), policy = profile(request.referenceId);
  const ids = request.coordinateIds ?? policy.coordinateIds;
  const maximumFinalChecks = request.maximumFinalChecks ?? 3;
  if (!Number.isInteger(maximumFinalChecks) || maximumFinalChecks < 1 || maximumFinalChecks > 8)
    throw new Error("Final checks require a budget of 1–8 candidates");
  if (ids.some(id => !policy.coordinateIds.includes(id))) throw new Error("Search coordinate is not allowed by this case");
  if (request.initialOutcome && request.reuse) throw new Error("Select initial evidence or a new checkpoint evaluation, not both");
  const coords = descriptors(ids);
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
  const initialResults = request.initialOutcome ? [request.initialOutcome] : await request.evaluateBatch([initialJob]);
  checkResults([initialJob], initialResults);
  let best: Evaluation = { id: initialJob.id, candidateInputs: seed, outcome: initialResults[0]!, score: scoreMainWireCaseFittingResultV1(initialResults[0]!),
    iteration: 0, coordinateId: null, delta: 0 };
  evaluations.push(best); cache.set(canonical(seed), best);
  let stepScale = 1, stopReason = "evaluation-budget";
  const finalChecks: { evaluationId: string; decision: MainWireCaseFinalDecisionV1 }[] = [];
  let selectedFinalId: string | null = null;
  let finalHeld = false;
  const checkFinalists = async () => {
    if (!request.assessFinalCandidate) return;
    const pending = evaluations.filter(e => e.score.targetsMet && !finalChecks.some(f => f.evaluationId === e.id))
      .sort((a, b) => mainWireCaseScoreImprovesV1(a.score, b.score) ? -1 : mainWireCaseScoreImprovesV1(b.score, a.score) ? 1 : 0);
    for (const e of pending) {
      if (finalChecks.length >= maximumFinalChecks || (await clock(`final-${e.id}`)) - started >= request.maximumWallTimeMs) break;
      const decision = await request.assessFinalCandidate(e);
      if (!["accepted", "rejected", "held"].includes(decision.status) || !Array.isArray(decision.issues)) throw new Error("Invalid final-check decision");
      finalChecks.push({ evaluationId: e.id, decision });
      if (decision.status === "accepted") { selectedFinalId = e.id; break; }
      if (decision.status === "held") { finalHeld = true; break; }
    }
  };
  await checkFinalists();
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
    if (selectedFinalId !== null) { stopReason = "final-checks-passed"; break; }
    if (finalHeld) { stopReason = "final-check-held"; break; }
    if (!request.assessFinalCandidate && best.score.targetsMet) { stopReason = "reference-targets-met"; break; }
    if (request.assessFinalCandidate && finalChecks.length >= maximumFinalChecks) { stopReason = "final-check-budget"; break; }
    const elapsed = (await clock(`poll-${iterations.length + 1}`)) - started;
    if (elapsed >= request.maximumWallTimeMs) { stopReason = "wall-time-budget"; break; }
    if (elapsed >= request.maximumWallTimeMs - reservedFinalWallTimeMs) { stopReason = "final-time-reserved"; break; }
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
    await checkFinalists();
    if (best.id === center.id) stepScale /= 2;
  }
  if (selectedFinalId !== null) stopReason = "final-checks-passed";
  else if (finalHeld) stopReason = "final-check-held";
  else if (!request.assessFinalCandidate && best.score.targetsMet) stopReason = "reference-targets-met";
  else if (request.assessFinalCandidate && finalChecks.length >= maximumFinalChecks) stopReason = "final-check-budget";
  return { methodId: MAIN_WIRE_CASE_FITTING_SEARCH_V1_ID, referenceId: request.referenceId,
    scope: "research-periodic-rest-search-only", coordinateDomain: coords.map(d => ({ ...d, boundProvenance: "existing-exact-research-domain-not-clinical-normality" })),
    fixedInputs: "All inputs outside selected coordinates, including HR, anatomy, calcium, Land kinetics, venous tone and other walls, remain fixed.",
    maximumEvaluations: request.maximumEvaluations, maximumWallTimeMs: request.maximumWallTimeMs,
    reservedFinalWallTimeMs, evaluationCount: evaluations.length, wallTimeMs: (await clock("finished")) - started,
    stopReason, bestId: best.id, bestCandidateInputs: best.candidateInputs,
    bestScore: best.score, evaluations, iterations, selectedFinalId, finalChecks, maximumFinalChecks,
    initialObservation: request.initialOutcome ? "provided-current-run-evidence" : "new-screen-evaluation",
    coordinateHeadroom: coords.map(d => {
      const value = readMainWireCaseSearchCoordinateV1(best.candidateInputs, d.id);
      return { coordinateId: d.id, value, initialStepsToLower: (value - d.minimum) / d.initialStep,
        initialStepsToUpper: (d.maximum - value) / d.initialStep, atBound: value <= d.minimum + 1e-9 || value >= d.maximum - 1e-9 };
    }),
    qualification: { pairedGrid: request.assessFinalCandidate ? "see-final-checks" : "not-evaluated",
      preloadReserve: request.assessFinalCandidate ? "see-case-final-protocol" : "not-evaluated", waveformReview: "not-performed",
      clinicalValidationClaimed: false, publicPromotionAuthorized: false } };
}

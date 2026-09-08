import { canonicalJsonStringify, cloneAndFreezeCanonicalJson, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_STUDIO_HFREF_RESEARCH_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStandardIdentityV1";
import { MAIN_WIRE_STANDARD72_FITTING_SEARCH_POLICY_V1 as policy,
  resolveMainWireStandard72FittingSearchPlanV1 as resolvePlan, scoreMainWireStandard72FittingRestV1 as score,
  type MainWireStandard72FittingSearchOptionsV1 as Options,
  type MainWireStandard72FittingSearchScoreV1 as Score } from "@/analysis/policies/mainWire/MainWireStandard72FittingSearchPolicyV1";
import { applyMainWireBaselineCalibrationParametersV1 as apply,
  readMainWireBaselineCalibrationParameterV1 as read, transformMainWireBaselineCalibrationParameterV1 as transform,
  type MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { runMainWireStandard72FittingWorkflowV1 as run, type MainWireStandard72SavedFittingResultV1 as Saved } from "./MainWireStandard72FittingWorkflowV1";
import { buildMainWireStandard72FittingPolicyIdentityV1 as evaluatorPolicyIdentity } from "./MainWireStandard72BaselineCalibrationEvaluatorV1";

type Evaluation = Awaited<ReturnType<typeof run>>;
export type MainWireStandard72FittingSearchTaskV1 = Omit<NonNullable<Parameters<typeof run>[0]>, "abortSignal">;
type Batch = (tasks: readonly MainWireStandard72FittingSearchTaskV1[], signal?: AbortSignal) => Promise<readonly Evaluation[]>;
type Trial = Readonly<{ trialIndex: number; round: number; candidateInputs: Candidate; candidateSha256: string;
  sourceResultSha256: string | null; evaluationStatus: string; failure: string | null;
  completedCycleCount: number | null; wallTimeMs: number; resultSha256: string | null;
  score: Score; normalizedDistanceFromSeed: number }>;

/** Bounded construction search, not inference. The batch seam permits actual
 * process parallelism; all neighbors in a poll share one immutable incumbent.
 * Failed simulations are categorical, never giant pseudo-residuals. */
export async function runMainWireStandard72FittingSearchV1(request: Readonly<{
  seed: MainWireStandard72FittingSearchTaskV1 & { candidateInputs: Candidate };
  options?: Options;
  abortSignal?: AbortSignal;
}>, evaluateBatch: Batch = async (tasks, signal) => {
  const results: Evaluation[] = [];
  for (const task of tasks) results.push(await run({ ...task, abortSignal: signal }));
  return results;
}) {
  const started = performance.now(), signal = request.abortSignal;
  const owned = cloneAndFreezeCanonicalJson({ seed: request.seed, options: request.options ?? {} }) as { seed: MainWireStandard72FittingSearchTaskV1; options: Options };
  const reference = resolveMainWireFittingReferenceV1("baseline");
  // An explicit seed vector also makes source/checkpoint reuse unambiguous.
  const seedInputs = owned.seed.candidateInputs;
  if (!seedInputs) throw new Error("Search requires an explicit seed candidate vector");
  const plan = resolvePlan(seedInputs, owned.options);
  const evaluatorPolicyIdentitySha256 = await evaluatorPolicyIdentity();
  const policyIdentitySha256 = await sha256CanonicalJsonHex({ policy, evaluatorPolicyIdentitySha256 });
  const context = { modelId, reference, seedCandidateInputs: seedInputs, plan, policy, policyIdentitySha256,
    evaluatorPolicyIdentitySha256, referenceIdentitySha256: await sha256CanonicalJsonHex(reference),
    seedSource: owned.seed.reuse == null ? owned.seed.source?.checkpoint.checkpointSha256 ?? null
      : (owned.seed.reuse as Saved).resultSha256 ?? null };
  const requestIdentitySha256 = await sha256CanonicalJsonHex(context);
  const trials: Trial[] = [], saved = new Map<number, Saved>(), visited = new Set<string>();
  let submittedEvaluations = 0, incumbent: number | null = null, round = 0;
  let step: number = policy.initialStepFraction;
  type Stop = "budget-exhausted" | "mesh-limit" | "seed-excluded" | "interrupted" | "execution-error";
  let stopReason: Stop = "budget-exhausted";
  let operationalError: string | null = null;
  const normalized = (candidate: Candidate) => plan.coordinates.map(c =>
    (transform(c.parameterId, read(candidate, c.parameterId)) - c.lowerTransformed) / (c.upperTransformed - c.lowerTransformed));
  const seedCoordinates = normalized(seedInputs);
  const distance = (candidate: Candidate) => Math.hypot(...normalized(candidate).map((x, i) => x - seedCoordinates[i]!));
  const better = (a: Trial, b: Trial) => {
    if (a.score.status !== "rankable") return false;
    if (b.score.status !== "rankable") return true;
    if (a.score.feasible !== b.score.feasible) return a.score.feasible;
    return a.score.worstMargin > b.score.worstMargin + policy.minimumMarginImprovement;
  };
  const order = (a: Trial, b: Trial) => {
    if (a.score.status !== "rankable" || b.score.status !== "rankable") return a.trialIndex - b.trialIndex;
    return Number(b.score.feasible) - Number(a.score.feasible) || b.score.worstMargin - a.score.worstMargin
      || a.normalizedDistanceFromSeed - b.normalizedDistanceFromSeed || a.trialIndex - b.trialIndex;
  };
  async function poll(tasks: readonly MainWireStandard72FittingSearchTaskV1[]) {
    if (signal?.aborted) { stopReason = "interrupted"; return false; }
    submittedEvaluations += tasks.length;
    let results: readonly Evaluation[];
    try { results = await evaluateBatch(tasks, signal); }
    catch (error) {
      stopReason = signal?.aborted || (error instanceof Error && error.name === "AbortError") ? "interrupted" : "execution-error";
      operationalError = error instanceof Error ? error.message : String(error); return false;
    }
    if (results.length !== tasks.length) throw new Error("Search batch result count differs from its requests");
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!, candidateInputs = task.candidateInputs!, result = cloneAndFreezeCanonicalJson(results[i]!) as Evaluation;
      const e = result.status === "saved-result-ready" ? result.result.evaluation : result.evaluation;
      if (result.status === "saved-result-ready" && (e.status !== "accepted" || e.modelId !== modelId
        || e.policyIdentitySha256 !== evaluatorPolicyIdentitySha256
        || canonicalJsonStringify(e.candidateInputs) !== canonicalJsonStringify(candidateInputs))) throw new Error("Search result is not bound to its candidate/current evaluator");
      const trialIndex = trials.length;
      const ranking = result.status === "saved-result-ready" ? score(result.result.evaluation)
        : { status: "excluded" as const, issues: [result.evaluation.status] };
      const trial: Trial = { trialIndex, round, candidateInputs, candidateSha256: await sha256CanonicalJsonHex(candidateInputs),
        sourceResultSha256: (task.reuse as Saved | undefined)?.resultSha256 ?? null,
        evaluationStatus: e.status, failure: e.status === "accepted" ? null : e.message,
        completedCycleCount: e.status === "accepted" ? e.completedCycleCount : null,
        wallTimeMs: e.wallTimeMs, resultSha256: result.status === "saved-result-ready" ? result.result.resultSha256 : null,
        score: ranking, normalizedDistanceFromSeed: distance(candidateInputs) };
      trials.push(trial); visited.add(canonicalJsonStringify(candidateInputs));
      if (result.status === "saved-result-ready") saved.set(trialIndex, result.result);
    }
    if (signal?.aborted || results.some(r => r.status === "evaluation-failed" && r.evaluation.status === "operational-interrupted")) {
      stopReason = "interrupted"; return false;
    }
    return true;
  }
  if (await poll([{ ...owned.seed, candidateInputs: seedInputs }])) {
    if (trials[0]!.score.status !== "rankable") stopReason = "seed-excluded";
    else {
      incumbent = 0;
      while (submittedEvaluations < plan.maximumEvaluations) {
        if (signal?.aborted) { stopReason = "interrupted"; break; }
        const anchor = saved.get(incumbent)!, base = anchor.evaluation.candidateInputs;
        const point = normalized(base), tasks: MainWireStandard72FittingSearchTaskV1[] = [], keys = new Set<string>();
        for (let j = 0; j < plan.coordinates.length; j++) for (const sign of [-1, 1]) {
          const c = plan.coordinates[j]!, x = Math.min(1, Math.max(0, point[j]! + sign * step));
          const y = c.lowerTransformed + x * (c.upperTransformed - c.lowerTransformed);
          const value = Math.min(c.maximum, Math.max(c.minimum, Number((c.transform === "log" ? Math.exp(y) : y).toPrecision(15))));
          const candidateInputs = apply(base, [{ parameterId: c.parameterId, value }]), key = canonicalJsonStringify(candidateInputs);
          if (!visited.has(key) && !keys.has(key) && value !== read(base, c.parameterId)) {
            tasks.push({ candidateInputs, reuse: anchor }); keys.add(key);
          }
        }
        const remaining = plan.maximumEvaluations - submittedEvaluations;
        // Do not privilege the first coordinate or one direction with a partial
        // final poll. The declared evaluation count is a ceiling, not a quota.
        if (tasks.length > remaining) { stopReason = "budget-exhausted"; break; }
        const start = trials.length; round++;
        if (tasks.length && !await poll(tasks)) break;
        const best = trials.slice(start).filter(t => better(t, trials[incumbent!]!)).sort(order)[0];
        if (best) incumbent = best.trialIndex;
        if (submittedEvaluations >= plan.maximumEvaluations) { stopReason = "budget-exhausted"; break; }
        if (!best) {
          if (step <= policy.minimumStepFraction) { stopReason = "mesh-limit"; break; }
          step = Math.max(policy.minimumStepFraction, step / 2);
        }
      }
    }
  }
  const eligible = trials.filter(t => t.score.status === "rankable" && t.score.feasible).sort(order).slice(0, policy.maximumFinalists);
  const finalists = eligible.map(t => saved.get(t.trialIndex)!);
  const reason = stopReason as Stop; // poll() can also set operational outcomes.
  const body = { schemaId: "main-wire-standard72-fitting-search-report-v1", ...context, requestIdentitySha256,
    status: reason === "interrupted" || reason === "execution-error" ? "interrupted" as const
      : finalists.length ? "candidates-found" as const : "no-admitted-candidate" as const,
    stopReason: reason, operationalError, submittedEvaluations, completedEvaluations: trials.length,
    startedNeighborRounds: round, finalStepFraction: step, incumbentTrialIndex: incumbent, trials,
    finalists: eligible.map(t => ({ trialIndex: t.trialIndex, resultSha256: t.resultSha256, candidateSha256: t.candidateSha256, score: t.score })),
    qualification: { restOnly: true, finalQualificationPerformed: false, publicBaselinePromotionAuthorized: false,
      clinicalValidationClaimed: false, parameterIdentifiabilityClaimed: false, globalOptimumClaimed: false },
    wallTimeMs: performance.now() - started };
  return { report: { ...body, reportSha256: await sha256CanonicalJsonHex(body) }, finalists };
}

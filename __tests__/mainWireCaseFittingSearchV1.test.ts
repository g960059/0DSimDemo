import { describe, it, expect } from "vitest";
import { searchMainWireCaseFittingV1 as search, scoreMainWireCaseFittingResultV1 as score,
  mainWireCaseScoreImprovesV1 as improves, withMainWireCaseSearchCoordinateV1 as update,
  readMainWireCaseSearchCoordinateV1 as read, type MainWireCaseSearchScoreV1 as Score } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/analysis/registry/MainWireStaticCaseFittingSeedV1";
import type { MainWireStaticCaseCandidateV1 as Candidate, runMainWireStaticCaseFittingV1 as run } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";

type Outcome = Awaited<ReturnType<typeof run>>;
// Deliberately synthetic transport stub: tests search arithmetic and scheduling,
// NOT a physiological reference or a rest/checkpoint qualification.
function synthetic(c: Candidate, target = 5235): Outcome {
  const actual = read(c, "tbv"), passed = Math.abs(actual - target) <= 1;
  return { status: "saved-result-ready", result: { candidateInputs: c,
    rest: { referenceId: "baseline", status: passed ? "passed" : "failed", assessment: {
      operating: [{ metricId: "synthetic-volume", lower: target - 1, upper: target + 1, actual, status: passed ? "passed" : "failed" }],
      invalidOrFailedRetained: [], unavailable: [], anatomyReviewRequired: false,
    } }, qualification: { publicPromotionAuthorized: false } } } as unknown as Outcome;
}
const ranked = (rank: Score["rank"]): Score => ({ rank, status: "test", targetsMet: false, holds: [], observations: [] });
const base = () => ({ referenceId: "baseline" as const, candidateInputs: seed("baseline"),
  coordinateIds: ["tbv"] as const, maximumEvaluations: 20, maximumWallTimeMs: 60000 });

describe("bounded case-fitting search", () => {
  it("changes only admitted explicit inputs; preserves RV, atria, calcium, HR and alias", () => {
    const original = seed("hfref-chronic-dilated-v1"), changed = update(original, "lv-active", .4);
    expect(read(changed, "lv-active")).toBe(.4);
    expect(original.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW).toBe(.35);
    expect(changed.hemodynamicResearchInputs).toEqual(original.hemodynamicResearchInputs);
    expect(changed.ventricularContractilityScale).toBe(1);
    expect(changed.mechanismResearchInputs.chamberMechanics.calciumDecayTimeScaleByWall).toEqual(original.mechanismResearchInputs.chamberMechanics.calciumDecayTimeScaleByWall);
    for (const wall of ["RVFW", "LA", "RA"] as const)
      expect(changed.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall[wall]).toBe(original.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall[wall]);
    expect(() => update(original, "lv-active", .24)).toThrow(/domain/);
    expect(() => update(original, "tbv", NaN)).toThrow(/domain/);
    const asymmetric = { ...original, mechanismResearchInputs: { ...original.mechanismResearchInputs,
      chamberMechanics: { ...original.mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: { ...original.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, SEP: .5 } } } };
    expect(() => update(asymmetric, "lv-active", .4)).toThrow(/asymmetric/);
  });

  it("uses lexicographic feasibility, preserves ties and never substitutes zero for an unknown component", () => {
    expect(improves(ranked([0, 0, 5]), ranked([1, .001, 0]))).toBe(true);
    expect(improves(ranked([0, 0, null]), ranked([0, 0, .1]))).toBe(false);
    expect(improves(ranked([0, 0, .1]), ranked([0, 0, null]))).toBe(false);
    expect(improves(ranked([0, 0, null]), ranked([0, 1, 0]))).toBe(true);
    expect(improves(ranked([0, 0]), ranked([0, 0]))).toBe(false);
    expect(improves(ranked(null), ranked([1]))).toBe(false);
    expect(improves(ranked([1]), ranked(null))).toBe(true);
  });

  it("polls in batches, reuses nearest observed candidates, caches repeats and stops inside the reference interval", async () => {
    const called: number[][] = [], reused: number[] = [];
    const result = await search({ ...base(), evaluateBatch: async jobs => {
      called.push(jobs.map(j => read(j.candidateInputs, "tbv")));
      reused.push(...jobs.flatMap(j => j.reuse ? [read(j.reuse.candidateInputs, "tbv")] : []));
      return jobs.map(j => synthetic(j.candidateInputs));
    } });
    expect(result.stopReason).toBe("reference-targets-met");
    expect(read(result.bestCandidateInputs, "tbv")).toBe(5235);
    expect(called[1]).toEqual([4835, 5035]);
    expect(called.flat().length).toBe(new Set(called.flat()).size);
    expect(result.evaluationCount).toBeLessThan(10);
    expect(reused).toContain(5035);
    expect(result.iterations.some(i => i.probes.some(p => p.cached))).toBe(true);
    expect(result.iterations[0]!.response.columns[0]!.stencil).toBe("two-sided");
    expect(result.qualification.publicPromotionAuthorized).toBe(false);
    expect(result.qualification.preloadReserve).toBe("not-evaluated");
    expect(result.evaluations.every(e => !("reuse" in e))).toBe(true);
  });

  it("does not spend remaining budget after the seed already meets the reference", async () => {
    const c = seed("baseline");
    const result = await search({ ...base(), maximumEvaluations: 1,
      evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs, read(c, "tbv"))) });
    expect(result.evaluationCount).toBe(1);
    expect(result.stopReason).toBe("reference-targets-met");
  });

  it("retains unresolved observations/failures without ranking them as a pass", async () => {
    const unavailable = (c: Candidate) => ({ status: "saved-result-ready", result: { candidateInputs: c,
      rest: { referenceId: "baseline", status: "unavailable", issue: { code: "overlapping-valve-flow" } } } }) as unknown as Outcome;
    expect(score(unavailable(seed("baseline"))).rank).toBeNull();
    const failure = { status: "numerical-unresolved", phase: "exact-execution", message: "test", wallTimeMs: 1 } as Outcome;
    expect(score(failure).targetsMet).toBe(false);
    const result = await search({ ...base(), maximumEvaluations: 3,
      evaluateBatch: async jobs => jobs.map(j => unavailable(j.candidateInputs)) });
    expect(result.evaluationCount).toBe(3);
    expect(result.bestScore.rank).toBeNull();
    expect(result.bestScore.holds).toEqual(["overlapping-valve-flow"]);
    expect(result.iterations[0]!.response.columns[0]!.rows).toEqual([]);
  });

  it("reports a partial poll at the evaluation limit and obeys the wall budget", async () => {
    const result = await search({ ...base(), maximumEvaluations: 2,
      evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs)) });
    expect(result.evaluationCount).toBe(2);
    expect(result.iterations[0]!.pollComplete).toBe(false);
    let clock = 0;
    const timed = await search({ ...base(), now: () => clock, maximumWallTimeMs: 1,
      evaluateBatch: async jobs => { clock = 2; return jobs.map(j => synthetic(j.candidateInputs)); } });
    expect(timed.stopReason).toBe("wall-time-budget"); expect(timed.evaluationCount).toBe(1);
  });

  it("stops at the local step budget, keeps bounds and marks bound dependence", async () => {
    const result = await search({ ...base(), candidateInputs: update(seed("baseline"), "tbv", 7000),
      evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs, 7200)) });
    expect(result.stopReason).toBe("local-step-exhausted");
    expect(result.coordinateHeadroom[0]!.atBound).toBe(true);
    expect(result.evaluations.every(e => read(e.candidateInputs, "tbv") <= 7000)).toBe(true);
  });

  it("rejects unknown/duplicate coordinates and mismatched worker evidence", async () => {
    const evaluateBatch = async () => [];
    await expect(search({ ...base(), maximumEvaluations: 0, evaluateBatch })).rejects.toThrow(/1–128/);
    await expect(search({ ...base(), coordinateIds: ["tbv", "tbv"], evaluateBatch })).rejects.toThrow(/distinct/);
    await expect(search({ ...base(), evaluateBatch })).rejects.toThrow(/count/);
    await expect(search({ ...base(), evaluateBatch: async () => [synthetic(update(seed("baseline"), "tbv", 5000))] })).rejects.toThrow(/another candidate/);
  });
});

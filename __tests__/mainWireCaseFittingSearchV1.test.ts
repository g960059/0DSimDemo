import { describe, it, expect } from "vitest";
import { searchMainWireCaseFittingV1 as search, scoreMainWireCaseFittingResultV1 as score,
  mainWireCaseScoreImprovesV1 as improves, withMainWireCaseSearchCoordinateV1 as update,
  readMainWireCaseSearchCoordinateV1 as read, type MainWireCaseSearchScoreV1 as Score } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import type { MainWireStaticCaseCandidateV1 as Candidate, runMainWireStaticCaseFittingV1 as run } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { searchMainWireRegistryCaseV1 as registrySearch } from "../tools/scientific/MainWireRegistryCaseSearchV1";
import { compareMainWireCasePeriodicTracesV1 as compareTraces } from "@/analysis/methods/mainWire/MainWireCaseInitializationAgreementV1";
import { resolveMainWireFittingCoordinatesV1 as cliCoordinates } from "@/tools/scientific/runMainWireCaseFittingV1";
import { resolveMainWireCaseSearchProfileV1 as profile } from "@/analysis/registry/MainWireCaseSearchProfilesV1";

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
  it.each(["baseline", "hfref-chronic-dilated-v1", "as-high-gradient-valve-only-v1", "as-low-flow-reduced-ef-v1"] as const)(
    "uses only %s case-owned coordinates when CLI --coordinates is omitted", reference => {
      expect(cliCoordinates(reference)).toEqual(profile(reference).coordinateIds);
    });
  it("rejects a CLI coordinate from another case before starting a run", () => {
    expect(cliCoordinates("baseline", "tbv")).toEqual(["tbv"]);
    for (const requested of ["aortic-area", "tbv,tbv", "", "not-a-coordinate"])
      expect(() => cliCoordinates("baseline", requested)).toThrow(/allowed by this case/);
  });
  it("compares observable cycles by source-period phase, not absolute time or a fitted peak", () => {
    const trace = (origin: number, offset = 0) => Array.from({ length: 100 }, (_, i) => ({
      acceptedTimeSec: origin + (i + 1) / 100, acceptedDtSec: .01,
      absolutePressureMmHg: { LA: 10, LV: 50 + offset + 40 * Math.sin((i + 1) / 100 * Math.PI * 2), RA: 5, RV: 20, Ao: 80, PA: 15, PVein: 10 },
      transmuralPressureMmHg: { LV: 50, RV: 20 }, chamberVolumeMl: { LA: 40, LV: 120, RA: 40, RV: 120 },
      valveFlowMlPerSec: { MV: 0, AoV: 100, TV: 0, PV: 100 },
    })) as never;
    expect(compareTraces(trace(100), trace(1)).rows.every(r => r.passed)).toBe(true);
    const failed = compareTraces(trace(100, 5), trace(1));
    expect(failed.rows.filter(r => !r.passed).map(r => r.metric)).toEqual(["absolutePressureMmHg.LV"]);
    expect(() => compareTraces([] as never, trace(1))).toThrow(/Incomplete/);
  });
  it("does not hide a single native-step spike between display comparison points", () => {
    const cold = Array.from({ length: 500 }, (_, i) => ({
      acceptedTimeSec: (i + 1) * .002, acceptedDtSec: .002,
      absolutePressureMmHg: { LA: 10, LV: 80, RA: 5, RV: 20, Ao: 80, PA: 15, PVein: 10 },
      transmuralPressureMmHg: { LV: 80, RV: 20 }, chamberVolumeMl: { LA: 40, LV: 120, RA: 40, RV: 120 },
      valveFlowMlPerSec: { MV: 0, AoV: 100, TV: 0, PV: 100 },
    }));
    const warm = structuredClone(cold); warm[2]!.absolutePressureMmHg.LV += 50;
    expect(compareTraces(warm as never, cold as never).rows.find(r => r.metric === "absolutePressureMmHg.LV"))
      .toMatchObject({ maximumAbsoluteDifference: 50, passed: false });
    warm[2]!.absolutePressureMmHg.LV = NaN;
    expect(compareTraces(warm as never, cold as never).rows.find(r => r.metric === "absolutePressureMmHg.LV")?.passed).toBe(false);
  });
  it("holds initialization disagreement before accepting or rejecting a physiological finalist", async () => {
    const c = seed("baseline"); let checks = 0;
    for (const coldTargetsMet of [true, false]) {
      const result = await registrySearch({ ...base(), initialOutcome: synthetic(c), initialFinal: false,
        maximumFinalChecks: 3, assess: async final => ({ status: final ? "review-pending" as const : "held" as const,
          qualification: { issues: [] }, caseTargetIssues: final ? [] : ["operating-target"], searchHoldIssues: [] }),
        evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs)),
        qualify: async () => coldTargetsMet,
        checkInitialization: async () => { checks++; return { status: "held", issues: ["initialization-dependent:LV"] }; } });
      expect(result.reason).toBe("final-check-held");
      expect(result.selected.assessment.status).toBe("held");
      expect(result.search?.finalChecks.at(-1)?.decision).toMatchObject({ status: "held", initializationCheck: { status: "held" } });
    }
    expect(checks).toBe(2);
  });
  it("isolates an incompatible case without silently changing its wall inputs or aborting another case", async () => {
    const source = seed("baseline"), c = { ...source, mechanismResearchInputs: { ...source.mechanismResearchInputs,
      chamberMechanics: { ...source.mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: { ...source.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, SEP: .5 } } } };
    const request = { ...base(), coordinateIds: ["lv-active"] as const, maximumFinalChecks: 1,
      initialFinal: null, assess: async () => ({ status: "review-pending" as const, qualification: { issues: [] }, caseTargetIssues: [], searchHoldIssues: [] }),
      evaluateBatch: async () => { throw new Error("No search expected"); }, qualify: async () => null,
      checkInitialization: async () => ({ status: "passed" as const, issues: [] }) };
    const cases = await Promise.all([c, seed("baseline")].map(candidateInputs => registrySearch({ ...request,
      candidateInputs, initialOutcome: synthetic(candidateInputs, read(candidateInputs, "tbv")) })));
    expect(cases.map(r => r.reason)).toEqual(["search-input-incompatible", "unchanged-input-qualified"]);
    expect(c.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.SEP).toBe(.5);
  });
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

  it("keeps a final-check reserve unavailable to new search polls", async () => {
    const c = seed("baseline"); let time = 0;
    const result = await search({ ...base(), maximumWallTimeMs: 100, reservedFinalWallTimeMs: 40, now: () => time,
      initialOutcome: synthetic(c), evaluateBatch: async jobs => { time = 65; return jobs.map(j => synthetic(j.candidateInputs)); },
      assessFinalCandidate: async () => { throw new Error("No candidate has reached its target"); } });
    expect(result.evaluationCount).toBe(3); expect(result.stopReason).toBe("final-time-reserved");
    expect(result.reservedFinalWallTimeMs).toBe(40); expect(result.selectedFinalId).toBeNull();
    await expect(search({ ...base(), reservedFinalWallTimeMs: 60001, evaluateBatch: async () => [] })).rejects.toThrow(/reservation/);
  });

  it("allows final checks, but not more search, inside the reserved time", async () => {
    const c = seed("baseline"); let time = 0;
    const result = await search({ ...base(), maximumWallTimeMs: 100, reservedFinalWallTimeMs: 40, now: () => time,
      initialOutcome: synthetic(c), evaluateBatch: async jobs => { time = 65; return jobs.map(j => synthetic(j.candidateInputs, read(j.candidateInputs, "tbv"))); },
      assessFinalCandidate: async () => { expect(time).toBe(65); time = 90; return { status: "accepted", issues: [] }; } });
    expect(result.stopReason).toBe("final-checks-passed"); expect(result.finalChecks).toHaveLength(1);
    expect(result.wallTimeMs).toBe(90);
  });

  it("rejects unknown/duplicate coordinates and mismatched worker evidence", async () => {
    const evaluateBatch = async () => [];
    await expect(search({ ...base(), maximumEvaluations: 0, evaluateBatch })).rejects.toThrow(/1–128/);
    await expect(search({ ...base(), coordinateIds: ["tbv", "tbv"], evaluateBatch })).rejects.toThrow(/distinct/);
    await expect(search({ ...base(), evaluateBatch })).rejects.toThrow(/count/);
    await expect(search({ ...base(), evaluateBatch: async () => [synthetic(update(seed("baseline"), "tbv", 5000))] })).rejects.toThrow(/another candidate/);
  });

  it("does not confuse resting targets with final qualification; tries the next candidate on rejection", async () => {
    const c = seed("baseline"), checked: string[] = [];
    const result = await search({ ...base(), initialOutcome: synthetic(c, read(c, "tbv")),
      evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs, read(j.candidateInputs, "tbv"))),
      assessFinalCandidate: async e => { checked.push(e.id);
        return e.id === "evaluation-001" ? { status: "rejected", issues: ["case-target-missed"] } : { status: "accepted", issues: [] }; } });
    expect(checked).toEqual(["evaluation-001", "evaluation-002"]);
    expect(result.stopReason).toBe("final-checks-passed");
    expect(result.selectedFinalId).toBe("evaluation-002");
    // The search incumbent and the independently qualified candidate can differ.
    expect(result.bestId).toBe("evaluation-001");
    expect(result.finalChecks[0]!.decision.issues).toEqual(["case-target-missed"]);
    expect(result.qualification.publicPromotionAuthorized).toBe(false);
  });

  it("preserves the final-check budget even when the initial resting score passes", async () => {
    const c = seed("baseline"); let dispatched = 0;
    const result = await search({ ...base(), maximumFinalChecks: 1,
      initialOutcome: synthetic(c, read(c, "tbv")),
      evaluateBatch: async jobs => { dispatched += jobs.length; return jobs.map(j => synthetic(j.candidateInputs)); },
      assessFinalCandidate: async () => ({ status: "rejected", issues: ["native-grid-check"] }) });
    expect(dispatched).toBe(0);
    expect(result.stopReason).toBe("final-check-budget");
    expect(result.selectedFinalId).toBeNull();
    expect(result.bestScore.targetsMet).toBe(true);
    expect(result.finalChecks).toHaveLength(1);
  });

  it("reuses initial current-run evidence explicitly and enforces the case's input scope", async () => {
    const c = seed("baseline");
    const result = await search({ ...base(), maximumEvaluations: 1, initialOutcome: synthetic(c), evaluateBatch: async () => {
      throw new Error("Initial evidence must not be called a new numerical execution");
    } });
    expect(result.initialObservation).toBe("provided-current-run-evidence");
    expect(result.evaluationCount).toBe(1);
    const h = seed("hfref-chronic-dilated-v1");
    await expect(search({ ...base(), referenceId: "hfref-chronic-dilated-v1", candidateInputs: { ...h,
      hemodynamicResearchInputs: { ...h.hemodynamicResearchInputs, heartRateBpm: 60 } }, evaluateBatch: async () => [] })).rejects.toThrow(/HR70/);
  });

  it("routes a new unsatisfied case through search and independent checks while skipping an already qualified case", async () => {
    const c = seed("baseline"), visited: string[] = [];
    const assess = async (final: { accepted: boolean }) => ({ status: final.accepted ? "review-pending" as const : "held" as const,
      qualification: { issues: final.accepted ? [] : ["test-initial-not-qualified"] }, caseTargetIssues: [], searchHoldIssues: [] });
    const request = { ...base(), maximumFinalChecks: 3, initialOutcome: synthetic(c), initialFinal: { accepted: false }, assess,
      checkInitialization: async () => ({ status: "passed" as const, issues: [] }),
      evaluateBatch: async (jobs: readonly { candidateInputs: Candidate }[]) => jobs.map(j => synthetic(j.candidateInputs)),
      qualify: async (e: { id: string }) => { visited.push(e.id); return { accepted: true }; } };
    const result = await registrySearch(request);
    expect(result.reason).toBe("final-checks-passed");
    expect(visited).toHaveLength(1);
    expect(read(result.selected.candidateInputs, "tbv")).toBe(5235);
    expect(result.selected.assessment.status).toBe("review-pending");
    const skipped = await registrySearch({ ...request, initialOutcome: synthetic(c, read(c, "tbv")), initialFinal: { accepted: true },
      evaluateBatch: async () => { throw new Error("Do not search an already qualified case"); } });
    expect(skipped.reason).toBe("unchanged-input-qualified");
    expect(skipped.search).toBeNull();
    const unrankable = await registrySearch({ ...request, initialOutcome: { status: "numerical-unresolved", message: "bad trace" } as Outcome,
      evaluateBatch: async () => { throw new Error("Undefined observations are not a target direction"); } });
    expect(unrankable.reason).toBe("initial-observation-unrankable");
    expect(unrankable.selected.assessment.status).toBe("held");
  });

  it("keeps failed final checks held rather than returning a merely passing rest score", async () => {
    const c = seed("baseline");
    const result = await registrySearch({ ...base(), maximumEvaluations: 3, maximumFinalChecks: 2,
      initialOutcome: synthetic(c, read(c, "tbv")), initialFinal: "initial",
      checkInitialization: async () => ({ status: "passed" as const, issues: [] }),
      assess: async () => ({ status: "held" as const, qualification: { issues: [] }, caseTargetIssues: ["target-missed"], searchHoldIssues: [] }),
      evaluateBatch: async jobs => jobs.map(j => synthetic(j.candidateInputs, read(j.candidateInputs, "tbv"))),
      qualify: async e => e.id });
    expect(result.reason).toBe("final-check-budget");
    expect(result.selected.assessment.status).toBe("held");
    expect(result.search?.selectedFinalId).toBeNull();
    expect(result.search?.finalChecks).toHaveLength(2);
  });

  it("does not tune parameters to evade a numerical or unknown final-check hold", async () => {
    const c = seed("baseline"); let calls = 0;
    const result = await search({ ...base(), initialOutcome: synthetic(c, read(c, "tbv")),
      evaluateBatch: async () => { calls++; return []; },
      assessFinalCandidate: async () => ({ status: "held", issues: ["paired-grid-sensitivity"] }) });
    expect(calls).toBe(0);
    expect(result.stopReason).toBe("final-check-held");
    expect(result.selectedFinalId).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { MAIN_WIRE_FITTING_SEED_V1 as fittingSeed } from "@/analysis/registry/MainWireFittingSeedV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as profile } from "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as admission } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { resolveMainWireStandard72FittingSearchPlanV1 as plan, scoreMainWireStandard72FittingRestV1 as score,
  MAIN_WIRE_STANDARD72_FITTING_SEARCH_POLICY_V1 as policy } from "@/analysis/policies/mainWire/MainWireStandard72FittingSearchPolicyV1";
import { runMainWireStandard72FittingSearchV1 as search } from "@/analysis/methods/mainWire/MainWireStandard72FittingSearchV1";
import { buildMainWireStandard72FittingPolicyIdentityV1 as evaluatorHash } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import type { MainWireStandard72SavedFittingResultV1 as Saved } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

const reference = resolveMainWireFittingReferenceV1("baseline"), candidate = fittingSeed.candidateInputs;
const tbv = "hemodynamics.total-blood-volume-ml" as const;
const onlyTbv = [{ parameterId: tbv }];
type Result = Awaited<ReturnType<NonNullable<Parameters<typeof search>[1]>>>[number];

// Synthetic objective fixtures exercise the search, not model physiology or
// checkpoint validation. Exact CLI/continuation tests cover the runner boundary.
async function synthetic(input: Candidate = candidate, margin = .2): Promise<Result> {
  const operating = admission.operating.map((r, i) => ({ ...r,
    actual: i === 0 ? r.lower! + margin * (r.upper - r.lower!) : ((r.lower ?? 0) + r.upper) / 2,
    status: i === 0 && margin < 0 ? "failed" : "passed" }));
  const entries = profile.entries.filter(e => e.role === "demographic-comparison").map(r => ({ ...r,
    actual: (Math.max(...r.comparisons.map(c => c.range.lower!)) + Math.min(...r.comparisons.map(c => c.range.upper!))) / 2 }));
  const evaluation = { modelId: fittingSeed.modelId, status: "accepted", candidateInputs: input,
    policyIdentitySha256: await evaluatorHash(), completedCycleCount: 3, wallTimeMs: 1,
    classification: { status: "period1-converged" },
    rest: { status: margin < 0 ? "failed" : "passed", operating, comparison: { entries },
      unavailable: [], invalidOrFailedRetained: [], historicalWarnings: [] } };
  return { status: "saved-result-ready", result: { evaluation,
    resultSha256: await sha256CanonicalJsonHex(input) } as unknown as Saved };
}
function accepted(r: Result) {
  if (r.status !== "saved-result-ready") throw new Error("fixture result missing");
  return r.result;
}

describe("bounded Standard72 search policy", () => {
  it("rejects an overwriting common contractility alias before submitting a trial", async () => {
    const conflicting = { ...candidate, ventricularContractilityScale: 1.1 };
    expect(() => plan(conflicting)).toThrow(/overwriting common alias/);
    let submitted = false;
    await expect(search({ seed: { candidateInputs: conflicting } }, async () => {
      submitted = true; return [];
    })).rejects.toThrow(/overwriting common alias/);
    expect(submitted).toBe(false);
  });
  it("defaults to three hemodynamic coordinates and permits a narrower declared box", () => {
    expect(plan(candidate).coordinates.map(c => c.parameterId)).toEqual(policy.defaultParameters);
    expect(plan(candidate, { parameters: [{ parameterId: tbv, minimum: 4800, maximum: 5200 }] }).coordinates[0])
      .toMatchObject({ minimum: 4800, maximum: 5200, transform: "log", initialValue: 4935, boundProvenance: "existing-exact-research-domain" });
    expect(plan(candidate, { parameters: [{ parameterId: policy.supportedParameters[3] }] }).coordinates).toHaveLength(1);
  });
  it("rejects confounded/locked coordinates, range expansion, duplicates and unknown options", () => {
    for (const parameters of [[], [{ parameterId: "hemodynamics.venous-tone" }],
      [{ parameterId: "myocardium.common-ventricular-passive-stiffness-scale" }], [onlyTbv[0], onlyTbv[0]],
      [{ parameterId: tbv, minimum: 4000 }], [{ parameterId: tbv, minimum: 5000, maximum: 5100 }]]) {
      expect(() => plan(candidate, { parameters } as never)).toThrow();
    }
    expect(() => plan(candidate, { typoBudget: 1 } as never)).toThrow(/fields/);
    for (const maximumEvaluations of [0, 66, 1.5, NaN]) expect(() => plan(candidate, { maximumEvaluations })).toThrow(/budget/);
  });
  it("uses current interval margins without double-counting SVI or inventing lower LV filling pressure", async () => {
    const e = accepted(await synthetic()).evaluation, result = score(e);
    expect(result).toMatchObject({ status: "rankable", feasible: true });
    if (result.status !== "rankable") return;
    expect(result.worstMargin).toBeCloseTo(.2);
    expect(result.margins).toHaveLength(12);
    expect(result.margins.some(r => r.metricId.includes("stroke-volume"))).toBe(false);
    expect(result.margins.find(r => r.metricId.includes("end-filling"))).toMatchObject({ lower: null, upper: 16, scale: 16 });
    expect(result.margins.find(r => r.metricId === "left-ventricle.edv-index")).toMatchObject({ lower: 46, upper: 91 });
  });
  it("ignores warning centers and saved bounds, but excludes unavailable, retained failure and falsified votes", async () => {
    const e = accepted(await synthetic()).evaluation;
    const changed = JSON.parse(JSON.stringify(e));
    changed.rest.historicalWarnings = [{ checkId: "left-ventricle.maximum-dpdt", actual: 2600 }];
    changed.rest.operating[0].lower = 900;
    expect(score(changed)).toEqual(score(e));
    changed.rest.invalidOrFailedRetained = ["waveform.LVP.single-peak-no-ringing"];
    expect(score(changed).status).toBe("excluded");
    changed.rest.invalidOrFailedRetained = []; changed.rest.operating[0].actual = null;
    expect(score(changed).status).toBe("excluded");
    const invalidVote = accepted(await synthetic(candidate, -.1)).evaluation;
    expect(score({ ...invalidVote, rest: { ...invalidVote.rest, status: "passed" } }).status).toBe("excluded");
  });
});

describe("bounded pattern search decisions", () => {
  it("searches toward an interval interior, keeps a feasible set, and binds every poll to one incumbent", async () => {
    const p = plan(candidate, { parameters: onlyTbv });
    const x = (c: Candidate) => (Math.log(c.hemodynamicResearchInputs.totalBloodVolumeMl) - p.coordinates[0]!.lowerTransformed)
      / (p.coordinates[0]!.upperTransformed - p.coordinates[0]!.lowerTransformed);
    const target = x(candidate) + .2, seen: string[] = [];
    const result = await search({ seed: { candidateInputs: candidate }, options: { parameters: onlyTbv, maximumEvaluations: 17 } }, async tasks => {
      if (tasks.length > 1) expect(new Set(tasks.map(t => (t.reuse as Saved).resultSha256)).size).toBe(1);
      return Promise.all(tasks.map(async t => {
        const key = canonicalJsonStringify(t.candidateInputs); expect(seen).not.toContain(key); seen.push(key);
        return synthetic(t.candidateInputs, .3 - Math.abs(x(t.candidateInputs!) - target));
      }));
    });
    expect(result.report.status).toBe("candidates-found");
    expect(result.report.completedEvaluations).toBeLessThanOrEqual(17);
    expect(result.finalists.length).toBeGreaterThan(1);
    expect(x(result.finalists[0]!.evaluation.candidateInputs)).toBeCloseTo(target, 10);
    expect(result.report.qualification).toMatchObject({ finalQualificationPerformed: false, publicBaselinePromotionAuthorized: false,
      clinicalValidationClaimed: false, parameterIdentifiabilityClaimed: false, globalOptimumClaimed: false });
    const { reportSha256, ...body } = result.report;
    expect(await sha256CanonicalJsonHex(body)).toBe(reportSha256);
  });
  it("separates physical/numerical failures from score and does not move to an excluded checkpoint", async () => {
    const result = await search({ seed: { candidateInputs: candidate }, options: { parameters: onlyTbv, maximumEvaluations: 3 } }, async tasks =>
      Promise.all(tasks.map(t => t.candidateInputs!.hemodynamicResearchInputs.totalBloodVolumeMl < 4935
        ? { status: "evaluation-failed" as const, evaluation: { status: "numerical-unresolved", message: "test solver refusal", wallTimeMs: 1 } } as Result
        : synthetic(t.candidateInputs, .2))));
    expect(result.report.stopReason).toBe("budget-exhausted");
    expect(result.report.trials[1]).toMatchObject({ evaluationStatus: "numerical-unresolved", score: { status: "excluded" } });
    expect(result.report.incumbentTrialIndex).toBe(0);
  });
  it("does not apply a giant penalty to a seed held by waveform construction; it stops", async () => {
    const result = await search({ seed: { candidateInputs: candidate } }, async () => {
      const seed = accepted(await synthetic());
      return [{ status: "saved-result-ready", result: { ...seed, evaluation: { ...seed.evaluation,
        rest: { ...seed.evaluation.rest, status: "failed", invalidOrFailedRetained: ["waveform.LVP.single-peak-no-ringing"] } } } }];
    });
    expect(result.report).toMatchObject({ status: "no-admitted-candidate", stopReason: "seed-excluded", completedEvaluations: 1 });
    expect(result.finalists).toEqual([]);
  });
  it("reports an empty feasible set honestly and terminates an uninformative local mesh", async () => {
    const result = await search({ seed: { candidateInputs: candidate }, options: { parameters: onlyTbv } }, async tasks =>
      Promise.all(tasks.map(t => synthetic(t.candidateInputs, -.1))));
    expect(result.report).toMatchObject({ status: "no-admitted-candidate", stopReason: "mesh-limit", completedEvaluations: 9 });
    expect(result.report.trials.every(t => t.score.status === "rankable")).toBe(true);
  });
  it("does not spend a final partial budget on only the first coordinate or direction", async () => {
    const result = await search({ seed: { candidateInputs: candidate }, options: { maximumEvaluations: 6 } }, async tasks =>
      Promise.all(tasks.map(t => synthetic(t.candidateInputs))));
    expect(result.report).toMatchObject({ stopReason: "budget-exhausted", completedEvaluations: 1, submittedEvaluations: 1, startedNeighborRounds: 0 });
  });
  it("retains completed evidence on interruption and does not submit after a pre-abort", async () => {
    const controller = new AbortController(); let calls = 0;
    const result = await search({ seed: { candidateInputs: candidate }, abortSignal: controller.signal }, async tasks => {
      if (++calls === 2) { controller.abort(); throw new DOMException("cancelled", "AbortError"); }
      return Promise.all(tasks.map(t => synthetic(t.candidateInputs)));
    });
    expect(result.report).toMatchObject({ status: "interrupted", stopReason: "interrupted", completedEvaluations: 1, submittedEvaluations: 7 });
    await search({ seed: { candidateInputs: candidate }, abortSignal: controller.signal }, async () => { throw new Error("must not execute"); });
    expect(calls).toBe(2);
  });
  it("rejects reordered/wrong-candidate worker output and owns request options before waiting", async () => {
    await expect(search({ seed: { candidateInputs: candidate }, options: { maximumEvaluations: 1 } }, async () =>
      [await synthetic({ ...candidate, hemodynamicResearchInputs: { ...candidate.hemodynamicResearchInputs, totalBloodVolumeMl: 5000 } })]))
      .rejects.toThrow(/bound/);
    const request = { seed: { candidateInputs: JSON.parse(JSON.stringify(candidate)) }, options: { maximumEvaluations: 1 } };
    const pending = search(request, async tasks => Promise.all(tasks.map(t => synthetic(t.candidateInputs))));
    request.seed.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl = 1;
    request.options.maximumEvaluations = 65;
    expect((await pending).report).toMatchObject({ completedEvaluations: 1, seedCandidateInputs: candidate });
  });
});

import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import raw from "@/data/physiology/main-wire-hfref-dilated-reference-v1.json";
import oldRaw from "@/data/physiology/main-wire-hfref-reference-v1.json";
import { MAIN_WIRE_HFREF_REFERENCE_V1 as oldReference,
  assessMainWireHfrefRestV1 as oldAssess } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 as reference,
  composeMainWireHfrefDilatedReferenceV1 as compose,
  assessMainWireHfrefDilatedRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { measureMainWireRelaxationTauV1 as measure } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { observeMainWireHfrefCaseV2 as observe } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { resolveMainWireFittingReferenceV1 as resolve } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { compareMainWireHfrefResultsV1 as compare } from "@/analysis/methods/mainWire/MainWireStandard72HfrefFittingV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { readHfrefRemodelingAssessmentBatchV1 as reobserve } from "../tools/scientific/reassessHfrefRemodelingV1";

const events = { inletClosureTimeSec: .01, outletOpeningTimeSec: .02, outletClosureTimeSec: .1,
  inletOpeningTimeSec: .25, nextInletClosureTimeSec: .3, atrialCaptureTimeSec: .27, atrialCaptureId: "a" };
function observation(tauSec = .05) {
  const samples = Array.from({ length: 311 }, (_, i) => {
    const t = i * .001, low = 90 * Math.exp(-.15 / tauSec);
    return { acceptedTimeSec: t, acceptedDtSec: .001,
      absolutePressureMmHg: { LV: t <= .1 ? 90 : t <= .25 ? 90 * Math.exp(-(t - .1) / tauSec)
        : low + (10 - low) * (Math.min(t, .3) - .25) / .05 },
      valveFlowMlPerSec: { AoV: t > .02 && t < .1 ? 300 : 0, MV: t > .25 && t < .3 ? 100 : 0 } };
  });
  const tau = measure(samples, events);
  return { tau, values: { lvef: .3, lvedvi: 120, lvesvi: 84, ci: 2.52, svi: 36,
    meanLa: 15, meanRa: 4, meanAo: 90, positiveDpDt: 1100, negativeDpDt: -1000,
    weissTauMs: tau.weiss!.tauMs, glantzTauMs: tau.glantz?.tauMs ?? null } };
}

describe("a coherent source-backed chronic dilated case, not all HFrEF", () => {
  it("reuses source records without rewriting the mechanism control or baseline", () => {
    expect(oldReference).toEqual(oldRaw);
    expect(resolve("hfref-chronic-dilated-v1").target.evidence).toEqual(reference);
    expect(resolve("baseline").target.kind).toBe("construction-corridors");
    expect(reference.referenceId).not.toBe(oldReference.referenceId);
    expect(new Set(reference.sources.map(s => s.sourceId)).size).toBe(reference.sources.length);
    expect(Object.isFrozen(reference.features)).toBe(true);
    expect(oldAssess({ ...observation().values, meanLa: 8, weissTauMs: null }).screenPassed).toBe(true);
    expect(reference.features.map(f => f.featureId)).toEqual([
      "dilated-low-ejection", "resting-forward-output", "pressure-generation", "relaxation-and-filling",
      "passive-accommodation", "pulmonary-and-right-heart", "work-and-efficiency"]);
  });
  it("requires provenance and measurement scope for every feature and standalone preference", () => {
    for (const mutate of [
      (v: typeof raw) => { v.features[0]!.sourceIds = []; },
      (v: typeof raw) => { v.features[0]!.metricIds = ["imaginary-output"]; },
      (v: typeof raw) => { v.features[0]!.limitation = ""; },
      (v: typeof raw) => { v.reuseSourceIds.push("invented-source"); },
      (v: typeof raw) => { v.fittingTargets.at(-1)!.method = ""; },
      (v: typeof raw) => { v.fittingTargets[0]!.upper = .5; },
    ]) { const copy = structuredClone(raw); mutate(copy); expect(() => compose(copy)).toThrow(); }
  });
  it("ranks the joint main phenotype before the accompanying targets without summing dependencies", () => {
    const o = observation();
    expect(assess(o)).toMatchObject({ status: "passed", preferenceStatus: "met", ranking: [0, 0, 0, 0],
      finalQualification: "not-performed", publicPromotionAuthorized: false });
    const a = assess({ ...o, values: { ...o.values, lvedvi: 100, ci: 2, meanAo: 77 } });
    expect(a.screenPassed).toBe(true);
    expect(a.ranking![2]).toBeCloseTo(1 / 3); // worst CI error, not a sum of three errors
    expect(a.ranking![3]).toBe(0);
    const b = assess({ ...o, values: { ...o.values, meanLa: 8 } });
    expect(b.screenPassed).toBe(true); expect(b.ranking![2]).toBe(0); expect(b.ranking![3]).toBe(.5);
  });
  it("never rewards more filling pressure or a longer tau indefinitely", () => {
    const o = observation();
    expect(assess({ ...o, values: { ...o.values, meanLa: 24 } }).ranking![3]).toBe(.5);
    expect(assess(observation(.08)).preferredTargetsMet).toBe(false);
    expect(assess(observation(.045)).ranking).toEqual(assess(observation(.065)).ranking);
  });
  it("leaves a soft measurement failure unresolved without rejecting a valid circulation", () => {
    const o = observation();
    for (const invalid of [null, { ...o.tau, status: "poor-fit" as const, issue: "test-poor-fit" },
      { ...o.tau, methodId: "different-tau-method" as never }]) {
      const r = assess({ ...o, tau: invalid });
      expect(r).toMatchObject({ status: "passed", screenPassed: true, preferredTargetsMet: false,
        preferenceStatus: "unresolved", ranking: [0, 0, 0, null] });
      expect(r.targets.find(t => t.metricId === "weissTauMs")?.actual).toBeNull();
    }
    expect(assess({ ...o, values: { ...o.values, weissTauMs: 88 } }).ranking).toEqual([0, 0, 0, null]);
    expect(assess({ ...o, values: { ...o.values, ci: null } })).toMatchObject({ status: "unresolved", screenPassed: false, ranking: null });
  });
  it("orders availability only after earlier priorities and keeps the comparator transitive", () => {
    const result = (main: number, soft: number | null) => ({ assessment: { ranking: [0, 0, main, soft] } }) as Parameters<typeof compare>[0];
    const unknown = result(0, null), worse = result(0, .5), better = result(0, .1), worsePrimary = result(.1, 0);
    expect([unknown, worse, better, worsePrimary].sort(compare)).toEqual([better, worse, unknown, worsePrimary]);
    expect(compare(unknown, unknown)).toBe(0);
  });
  it("keeps the intended story separate from actual findings and unmeasured facts", () => {
    const o = observation(), baseline = observation(.065), r = assess(o, baseline);
    const relaxation = r.features.find(f => f.featureId === "relaxation-and-filling")!;
    expect(relaxation.descriptionRole).toBe("intended-not-an-achievement-claim");
    expect(relaxation.observations.find(v => v.metricId === "weissTauMs")!.differenceFromBaseline).toBeLessThan(0);
    expect(r.features.find(f => f.featureId === "passive-accommodation")!.observations.every(v => v.actual === null)).toBe(true);
    expect(r.features.find(f => f.featureId === "work-and-efficiency")!.observations.find(v => v.metricId === "formalPva")!.status)
      .toBe("unresolved-or-unmeasured");
  });
  it("does not let a failed contextual E/A silently become a Weiss gate", () => {
    const { beat, samples } = timingFixture();
    const r = observe(beat, samples);
    expect(r.inflow.issue?.code).toBe("unresolved-a-wave");
    expect(r.values.flowEToA).toBeNull();
    expect(r.tau?.status).toBe("measured");
    expect(r.values.weissTauMs).toBeCloseTo(50, 1);
    expect(r.values.ictMs).toBeCloseTo(100, 8);
    expect(r.values.irtMs).toBeCloseTo(200, 8);
    expect(r.relaxationWindowPressures!.startPressureMmHg - r.relaxationWindowPressures!.endPressureMmHg)
      .toBeCloseTo(r.tau!.window!.pressureDropMmHg, 10);
    expect(() => observe(beat, samples.map((s, i) => i === 20
      ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, MV: NaN } } : s))).toThrow();
  });
  it("reobserves sealed traces without changing them and rejects changed or unrepaired inputs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hfref-reassessment-test-"));
    try {
      const fixture = await sealedFixture(directory);
      const bytesBefore = await readFile(join(directory, "case-7.json"));
      const batch = await reobserve(directory);
      expect(batch.cases).toHaveLength(8);
      expect(batch.cases[7]!.assessment.referenceId).toBe(reference.referenceId);
      expect(await readFile(join(directory, "case-7.json"))).toEqual(bytesBefore);
      await writeFile(join(directory, "case-7.json"), Buffer.concat([bytesBefore, Buffer.from(" ")]));
      await expect(reobserve(directory)).rejects.toThrow("Unbound remodeling output: case-7.json");
      await writeFile(join(directory, "case-7.json"), bytesBefore);
      await fixture.bindPlan("unrepaired-remodeling-v1");
      await expect(reobserve(directory)).rejects.toThrow("Not the repaired, sealed remodeling factorial");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});

/** Synthetic sealed trace inventory exercises provenance checks, not physiology. */
async function sealedFixture(directory: string) {
  const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
  const protocol = "hfref-static-lv-septal-remodeling-fixed-coronary-bed-v2", dt = .002;
  const points = [1, .35].flatMap(active => [1, 1.15].flatMap(referenceArea => [1, 1.25].map(wallVolume => ({ active, referenceArea, wallVolume }))));
  const { beat, samples } = timingFixture(), results: { filename: string; sha256: string }[] = [];
  const files: unknown[] = [], sourceSha256 = hash(JSON.stringify(files));
  const bind = async (filename: string, value: unknown) => {
    const bytes = JSON.stringify(value);
    await writeFile(join(directory, filename), bytes);
    const i = results.findIndex(r => r.filename === filename);
    if (i !== -1) results.splice(i, 1);
    results.push({ filename, sha256: hash(bytes) });
  };
  for (const [i, point] of points.entries()) {
    const candidate = { synthetic: true };
    const body = { protocol, dt, point, candidate, status: "observed", classification: { status: "period1-converged" },
      auditClassification: { status: "period1-converged" }, constructionSha256: await sha256CanonicalJsonHex({ protocol, point, candidate }),
      completedBeat: beat, terminalTrace: samples };
    await bind(`case-${i}.json`, { ...body, resultSha256: await sha256CanonicalJsonHex(body) });
  }
  const archive = { filename: "execution.source.tar.gz", sha256: hash("opaque-test-source-archive") };
  await writeFile(join(directory, archive.filename), "opaque-test-source-archive");
  const bindPlan = async (planProtocol: string) => {
    await bind("plan.json", { protocol: planProtocol, dt, points, sourceSha256 });
    await writeFile(join(directory, "execution.source.json"), JSON.stringify({ files, sourceSha256, archive, results }));
  };
  await bindPlan(protocol);
  return { bindPlan };
}

/** Synthetic analysis fixture at HR70, not simulated physiology. */
function timingFixture() {
  type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
  const beat = structuredClone(seed.checkpoint.baseStandardCheckpointV2.completedBeatMetrics) as Mutable<Beat>;
  const end = 6 / 7;
  beat.startTimeSec = 0; beat.endTimeSec = end; beat.durationSec = end; beat.endAtrialCaptureId = "end";
  for (const v of [beat.leftVentricularValveEventMetrics, beat.rightVentricularValveEventMetrics]) {
    v.endDiastolic!.timeSec = .1; v.endSystolic!.timeSec = .4;
  }
  beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec = .2;
  beat.valveForwardPressureGradients.PV.forwardFlowDurationSec = .2;
  const times = [...new Set([...Array.from({ length: 1001 }, (_, i) => i * .001), end])].sort((a, b) => a - b);
  const samples = times.map((t, i) => ({ acceptedTimeSec: t, acceptedDtSec: t - (times[i - 1] ?? -.001),
    acceptedEventIdentity: { atrialCapturedActivationId: t === end ? "end" : null },
    absolutePressureMmHg: { LV: t <= .4 ? 90 : t <= .6 ? 90 * Math.exp(-(t - .4) / .05)
      : 90 * Math.exp(-4) + (10 - 90 * Math.exp(-4)) * (Math.min(t, .95) - .6) / .35 },
    valveFlowMlPerSec: {
      AoV: t > .2 && t < .4 ? 100 : 0, PV: t > .2 && t < .4 ? 100 : 0,
      MV: t > .6 && t < .95 ? t < .7 ? (t - .6) * 100 : 10 * (.95 - t) / .25 : 0,
      TV: t > .6 && t < .95 ? t < .7 ? (t - .6) * 100 : 10 * (.95 - t) / .25 : 0,
    } }));
  return { beat, samples };
}

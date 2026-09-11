import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { runMainWireStaticCaseFittingV1 as run, readMainWireStaticCaseFittingResultV1 as read,
  assessMainWireStaticCaseRestV1 as assess, ownMainWireStaticCaseCandidateV1 as own,
  type MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 as fixtureSchema } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseIdentityV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { mainWireStandard70TimingAndInletObservationTraceV1 as observationTrace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { runMainWireStaticBaselineQualificationGridV1 as qualifyGrid,
  assessMainWireStaticBaselineQualificationV1 as qualifyPair,
  type MainWireStaticBaselineQualificationGridV1 as QualificationGrid } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { observeMainWireBaselineV2 as observeNative } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { measureMainWireRelaxationTauV1 as measureTau } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { reobserveMainWireCaseV1 as reobserve } from "@/tools/scientific/reobserveMainWireCaseV1";
import { compareMainWireCaseEvidenceV1 as compare } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { assessMainWireCaseInitializationAgreementV1 as initializationAgreement } from "@/analysis/methods/mainWire/MainWireCaseInitializationAgreementV1";

// Test token, not a source-authenticated research run. The CLI owns real snapshots.
const sourceSha256 = "a".repeat(64), hfref = "hfref-chronic-dilated-v1";
const originalTier = hotPathIntegrityTierV1();
let baseline: Result, disease: Result;
// Two independent cold fits use the canonical suite's existing hook budget;
// a local-machine timing ceiling is not a scientific acceptance condition.
beforeAll(async () => {
  selectHotPathIntegrityTierV1("hot-path-lean");
  const a = await run({ referenceId: "baseline", candidateInputs: seed("baseline"), sourceSha256 });
  const b = await run({ referenceId: hfref, candidateInputs: seed(hfref), sourceSha256 });
  expect(a.status).toBe("saved-result-ready"); expect(b.status).toBe("saved-result-ready");
  if (a.status !== "saved-result-ready" || b.status !== "saved-result-ready") throw new Error(JSON.stringify({ a, b }));
  baseline = a.result; disease = b.result;
});
afterAll(() => selectHotPathIntegrityTierV1(originalTier));

describe("one finite-case fitting path with independent reference assessment", () => {
  it("does not use healthy final qualification for disease anatomy or promote failed grids", async () => {
    await expect(qualifyGrid({ candidateInputs: seed(hfref), sourceSha256, nominalDtSec: .002 }))
      .rejects.toThrow(/disease anatomy/);
    const failed = await qualifyGrid({ candidateInputs: seed("baseline"), sourceSha256, nominalDtSec: .002,
      abortSignal: AbortSignal.abort() });
    expect(failed.status).toBe("grid-failed");
    const result = await qualifyPair({ coarse: failed, fine: failed });
    expect(result).toMatchObject({ status: "held", publicPromotionAuthorized: false, clinicalNormalityClaimed: false });
    expect(result.issues).toEqual(expect.arrayContaining(["coarse:execution-failed", "fine:execution-failed", "paired-preload-reserve"]));
  });
  it("rejects relabeled coarse traces, stale policies and a request not bound to its numerical grid", async () => {
    const d = baseline.execution.diagnostics, samples = observationTrace(d);
    const relaxation = measureTau(samples, observeNative({ samples, completedBeat: d.completedBeat }).left.events);
    const grid = (result: Result): Extract<QualificationGrid, { status: "grid-evaluated" }> => ({
      qualifierId: "main-wire-static-baseline-paired-qualification-v1", modelId: result.modelId,
      status: "grid-evaluated", result, relaxation, preloadReserve: null, issues: [],
      checkpointRoundtripVerified: true, sourceUnchangedByReserve: true, wallTimeMs: 0 });
    const { resultSha256: _, ...body } = { ...baseline, nominalDtSec: .001 as const };
    const fakeFine = { ...body, resultSha256: await hash(body) };
    const recheck = await qualifyPair({ coarse: grid(baseline), fine: grid(fakeFine) });
    expect(recheck.status).toBe("held");
    expect(recheck.issues).toEqual(expect.arrayContaining(["fine:request-identity", "fine:native-grid-record"]));
    const { resultSha256: __, ...oldBody } = { ...baseline, policyIdentitySha256: "f".repeat(64) };
    const old = { ...oldBody, resultSha256: await hash(oldBody) };
    const stale = await qualifyPair({ coarse: grid(old), fine: grid(old) });
    expect(stale.issues).toContain("coarse:current-policy-binding");
  });
  it("screens both references without imposing the healthy EF corridor on HFrEF", () => {
    expect(baseline.rest).toMatchObject({ referenceId: "baseline", status: "passed" });
    expect(disease.rest).toMatchObject({ referenceId: hfref, status: "passed" });
    const before = JSON.stringify(disease.execution);
    expect(assess("baseline", disease.execution).status).not.toBe("passed");
    expect(JSON.stringify(disease.execution)).toBe(before);
    for (const result of [baseline, disease]) {
      expect(result.execution.classification.status).toBe("period1-converged");
      expect(result.execution.diagnostics.cycleEvidence).toHaveLength(result.execution.completedCycleCount);
      expect(result.qualification).toMatchObject({ pairedGrid: "not-evaluated", preloadReserve: "not-evaluated", publicPromotionAuthorized: false });
      expect(result.execution.diagnostics.completedBeat).toEqual(result.execution.checkpoint.base.completedBeatMetrics);
      expect(result.execution.diagnostics.timingAndInletTrace.at(-1)!.acceptedTimeSec).toBeGreaterThan(result.execution.checkpoint.base.acceptedTimeSec);
      const { completedBeat, terminalTrace } = result.execution.diagnostics;
      const timingAndInletTrace = observationTrace(result.execution.diagnostics);
      expect(timingAndInletTrace[0]!.acceptedTimeSec).toBeLessThanOrEqual(completedBeat.startTimeSec);
      expect(terminalTrace[0]!.acceptedTimeSec).toBeGreaterThan(completedBeat.startTimeSec);
      expect(timingAndInletTrace.some(s => s.acceptedEventIdentity.atrialCapturedActivationId === completedBeat.startAtrialCaptureId)).toBe(true);
      for (let i = 1; i < timingAndInletTrace.length; i++) {
        expect(timingAndInletTrace[i]!.acceptedTimeSec - timingAndInletTrace[i - 1]!.acceptedTimeSec)
          .toBeCloseTo(timingAndInletTrace[i]!.acceptedDtSec, 12);
      }
    }
  });
  it("reopens and reconfirms an own-anatomy checkpoint for three fresh cycles", async () => {
    const before = JSON.stringify(disease), reopened = await read(JSON.parse(before));
    const rerun = await run({ referenceId: hfref, candidateInputs: disease.candidateInputs, sourceSha256, reuse: reopened });
    expect(rerun.status).toBe("saved-result-ready");
    if (rerun.status !== "saved-result-ready") throw new Error(JSON.stringify(rerun));
    expect(rerun.result.initialization.kind).toBe("exact-checkpoint");
    expect(rerun.result.execution.completedCycleCount).toBe(3);
    expect(rerun.result.rest.status).toBe("passed");
    const agreement = await initializationAgreement({ warm: rerun.result, cold: disease });
    expect(agreement.status, JSON.stringify(agreement)).toBe("passed");
    expect(agreement.comparison?.rows).toHaveLength(17);
    expect((await initializationAgreement({ warm: baseline, cold: disease })).status).toBe("held");
    expect(JSON.stringify(disease)).toBe(before);
  }, 20_000);
  it("does not miss inlet reflow in the native beat before the last controller window", () => {
    const d = disease.execution.diagnostics, ed = d.completedBeat.rightVentricularValveEventMetrics.endDiastolic!.timeSec;
    const preceding = d.timingAndInletPrecedingTrace;
    const index = preceding.findIndex(s => s.acceptedTimeSec > ed && s.valveFlowMlPerSec.TV === 0);
    expect(index).toBeGreaterThanOrEqual(0);
    const changed = preceding.map((s, i) => i === index ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, TV: .01 } } : s);
    const observed = assess(hfref, { diagnostics: { ...d, timingAndInletPrecedingTrace: changed } });
    expect(observed).toMatchObject({ status: "held", observation: { measurementReview: { status: "required" } } });
    if (observed.referenceId !== hfref || observed.status === "unavailable") throw new Error("Expected partial HFrEF observation");
    expect(observed.observation.values.ictMs).not.toBeNull();
    expect(observed.observation.measurementReview.issues.some(i => i.side === "right")).toBe(true);
  });
  it("owns request inputs and warm-starts nearby parameters without mutating the anchor", async () => {
    const candidateInputs = { ...structuredClone(disease.candidateInputs),
      hemodynamicResearchInputs: { ...disease.candidateInputs.hemodynamicResearchInputs } }, before = JSON.stringify(disease);
    candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl += 40;
    const expected = structuredClone(candidateInputs);
    const pending = run({ referenceId: hfref, candidateInputs, sourceSha256, reuse: disease });
    candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl += 500;
    const result = await pending;
    expect(result.status).toBe("saved-result-ready");
    if (result.status !== "saved-result-ready") throw new Error(JSON.stringify(result));
    expect(result.result.initialization.kind).toBe("parameter-continuation");
    expect(result.result.candidateInputs).toEqual(expected);
    await expect(read(result.result)).resolves.toEqual(result.result);
    expect(JSON.stringify(disease)).toBe(before);
  }, 60_000);
  it("rejects changed source, anatomy, source checkpoint and forged promotion status", async () => {
    expect(await run({ referenceId: hfref, candidateInputs: disease.candidateInputs, sourceSha256: "b".repeat(64), reuse: disease }))
      .toMatchObject({ status: "invalid-or-physical", message: expect.stringContaining("same source content") });
    expect(await run({ referenceId: "baseline", candidateInputs: baseline.candidateInputs, sourceSha256, reuse: disease }))
      .toMatchObject({ status: "invalid-or-physical", message: expect.stringContaining("static anatomy") });
    for (const change of [
      { candidateInputs: baseline.candidateInputs },
      { qualification: { ...disease.qualification, publicPromotionAuthorized: true } },
      { execution: { ...disease.execution, checkpoint: baseline.execution.checkpoint } },
    ]) {
      const { resultSha256: _, ...body } = { ...disease, ...change };
      await expect(read({ ...body, resultSha256: await hash(body) })).rejects.toThrow();
    }
  });
  it("remeasures old assessment records without rewriting them or treating them as approval", async () => {
    const { resultSha256: _, ...body } = { ...disease, policyIdentitySha256: "f".repeat(64) };
    const old = { ...body, resultSha256: await hash(body) }, before = JSON.stringify(old);
    expect(await read(old)).toEqual(old);
    const rerun = await run({ referenceId: hfref, candidateInputs: old.candidateInputs, sourceSha256, reuse: old });
    if (rerun.status !== "saved-result-ready") throw new Error(JSON.stringify(rerun));
    expect(rerun.result.policyIdentitySha256).toBe(disease.policyIdentitySha256);
    expect(rerun.result.qualification.publicPromotionAuthorized).toBe(false);
    expect(JSON.stringify(old)).toBe(before);
  }, 20_000);
  it("binds offline re-observation separately from the numerical source and executes no new steps", async () => {
    const before = JSON.stringify(disease), analysisSource = "b".repeat(64);
    const result = await reobserve(disease, analysisSource);
    expect(result.numericalSourceSha256).toBe(sourceSha256);
    expect(result.analysisSourceSha256).toBe(analysisSource);
    expect(result.sourceResultSha256).toBe(disease.resultSha256);
    expect(result.checkpointSha256).toBe(disease.execution.checkpoint.checkpointSha256);
    expect(result.previousObservationContext).toEqual(disease.referenceContext);
    expect(result.cycleObservation.methodId).toBe("main-wire-valve-cycle-observation-v3");
    expect(result.numericalStepsExecuted).toBe(0); expect(result.publicPromotionAuthorized).toBe(false);
    const { reobservationSha256, ...body } = result;
    expect(await hash(body)).toBe(reobservationSha256); expect(JSON.stringify(disease)).toBe(before);
    await expect(reobserve(disease, "invented-source")).rejects.toThrow(/digest/);
    await expect(reobserve({ ...disease, resultSha256: "f".repeat(64) }, analysisSource)).rejects.toThrow(/digest/);
  });
  it("reobserves compatible raw evidence after the old model and checkpoint become unrestorable", async () => {
    const { resultSha256: _, ...body } = { ...disease, modelId: "retired-numerical-owner",
      execution: { ...disease.execution, checkpoint: { checkpointSha256: disease.execution.checkpoint.checkpointSha256 } } };
    const old = { ...body, resultSha256: await hash(body) };
    await expect(read(old)).rejects.toThrow(/identity/);
    const observation = await reobserve(old, "b".repeat(64));
    expect(observation.modelId).toBe("retired-numerical-owner");
    expect(observation).toMatchObject({ historicalCheckpointRestored: false, numericalStepsExecuted: 0, publicPromotionAuthorized: false });
    expect(observation.rest).toEqual(disease.rest);
  });
  it("compares baseline and disease history using each case's current measurement method without relabelling old evidence", async () => {
    for (const current of [baseline, disease]) {
      const { resultSha256: _, ...body } = { ...current, modelId: "retired-owner-for-test",
        rest: { ...current.rest, status: "historical-held" },
        execution: { ...current.execution, checkpoint: { intentionallyNotRestorable: true } } };
      const old = { ...body, resultSha256: await hash(body) };
      const result = await compare({ referenceId: current.rest.referenceId, previous: old, current, analysisSourceSha256: "b".repeat(64) });
      expect(result).toMatchObject({ status: "compared", inputChanges: [], sameNominalDt: true,
        numericalStepsExecuted: 0, historicalCheckpointRestored: false, publicPromotionAuthorized: false });
      expect(result.previous.observation?.modelId).toBe("retired-owner-for-test");
      expect(result.previous.observation?.previousRestStatus).toBe("historical-held");
      expect(result.previous.observation?.rest).toEqual(current.rest);
      expect(result.current.observation?.rest).toEqual(current.rest);
      expect(result.rows.length).toBeGreaterThan(15);
      expect(result.rows.every(r => r.delta === 0 || r.previous === null && r.current === null && r.delta === null)).toBe(true);
    }
    const wrongCase = await compare({ referenceId: "baseline", previous: disease, current: baseline, analysisSourceSha256: "b".repeat(64) });
    expect(wrongCase).toMatchObject({ status: "incomplete", rows: [], previous: { status: "unavailable", issue: expect.stringContaining("Different case") } });
  });
  it("can use the fitted checkpoint in the real exact adapter without baseline-state substitution", async () => {
    const c = disease.candidateInputs;
    const direct = await Session.restore(disease.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
    const start = direct.currentAcceptedState().acceptedTimeSec, aligned = Math.ceil((start - 1e-12) / .002) * .002;
    if (aligned > start + 1e-12) direct.advanceToPresentationTimeWithSelectedOutputProjectionV1(aligned, []);
    const checkpoint = await direct.checkpoint(), adapter = release().executables.simulationAdapter;
    const id = { runtimeSessionId: "fitting", scenarioId: "hfref" };
    await adapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId,
      fixture: { ...template, schemaId: fixtureSchema, anatomyId: c.anatomyId, hemodynamicResearchInputs: c.hemodynamicResearchInputs, mechanismResearchInputs: c.mechanismResearchInputs },
      checkpoint: { acceptedRevision: checkpoint.base.revision, acceptedTimeSec: checkpoint.base.acceptedTimeSec, payload: checkpoint as never } }] });
    for (let i = 1; i <= 200; i++) {
      const frame = await adapter.advanceOnePresentationStep(id);
      const directFrame = direct.advanceToPresentationTimeWithStandard70SelectedOutputProjectionV1(frame.acceptedTimeSec, ["hemodynamics.pressure.absolute.LV"]);
      expect(frame.outputs["hemodynamics.pressure.absolute.LV"]).toEqual(directFrame.projectedValues!["hemodynamics.pressure.absolute.LV"]);
    }
    adapter.disposeSession(id.runtimeSessionId);
  }, 15_000);
  it("keeps undeclared aliases, wrong HR/reference scope and unsupported controls out of this fitter", async () => {
    expect(() => own({ ...seed(hfref), ventricularContractilityScale: 1.2 })).toThrow(/alias/);
    expect(() => own({ ...seed(hfref), ignoredGeometry: 1 } as never)).toThrow(/field/);
    const c = seed(hfref);
    expect(await run({ referenceId: hfref, sourceSha256, candidateInputs: { ...c,
      hemodynamicResearchInputs: { ...c.hemodynamicResearchInputs, heartRateBpm: 60 } } }))
      .toMatchObject({ status: "invalid-or-physical", message: expect.stringContaining("HR70-only") });
    expect(await run({ referenceId: hfref, sourceSha256, candidateInputs: c, nominalDtSec: .004 as .002 }))
      .toMatchObject({ status: "invalid-or-physical" });
    expect(await run({ referenceId: hfref, sourceSha256, candidateInputs: c, abortSignal: AbortSignal.abort() }))
      .toMatchObject({ status: "operational-interrupted" });
  });
  it("retains converged raw and valid LV evidence while holding a case with pre-ejection RV reflow", async () => {
    const c = disease.candidateInputs;
    const result = await run({ referenceId: hfref, sourceSha256, reuse: disease,
      candidateInputs: { ...c, hemodynamicResearchInputs: { ...c.hemodynamicResearchInputs, totalBloodVolumeMl: 4785 } } });
    expect(result.status).toBe("saved-result-ready");
    if (result.status !== "saved-result-ready") throw new Error(JSON.stringify(result));
    expect(result.result.execution.classification.status).toBe("period1-converged");
    expect(result.result.rest).toMatchObject({ status: "held", observation: { measurementReview: {
      status: "required", issues: [{ code: "pre-ejection-inlet-reopening", side: "right" }] } } });
    if (result.result.rest.referenceId !== hfref || result.result.rest.status === "unavailable") throw new Error("Expected partial HFrEF observation");
    expect(result.result.rest.observation.values.ictMs).not.toBeNull();
    expect(result.result.rest.observation.values.rvIctMs).not.toBeNull();
    const d = result.result.execution.diagnostics;
    expect(() => observeNative({ completedBeat: d.completedBeat, samples: observationTrace(d) })).toThrow(/recurs/);
    expect(result.result.qualification.publicPromotionAuthorized).toBe(false);
    await expect(read(result.result)).resolves.toEqual(result.result);
    // Assessment may report known measurement failures, not hide programming errors.
    expect(() => assess(hfref, { diagnostics: null } as never)).toThrow();
  }, 60_000);
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import baseline from "@/studio/integrations/mainWireIntegratedV3/standard72-settled-baseline-checkpoint.json";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_CHECKPOINT_V1_ID, type MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as fixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { evaluateMainWireStandard72BaselineCalibrationCandidateV1 as evaluate, collectMainWireStandard72FittingCycleV1 as collect } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import { runMainWireStandard72FittingWorkflowV1 as run, validateMainWireStandard72SavedFittingResultV1 as validate,
  type MainWireStandard72SavedFittingResultV1 as Saved } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";

const previousTier = hotPathIntegrityTierV1();
const reference = resolveMainWireFittingReferenceV1("baseline");
const candidate = reference.selectedConstruction.candidateInputs;
const checkpoint = baseline as unknown as Checkpoint;
let saved: Saved;
beforeAll(async () => {
  selectHotPathIntegrityTierV1("hot-path-lean");
  const result = await run({ source: { checkpoint, candidateInputs: candidate },
    candidateInputs: { ...candidate, hemodynamicResearchInputs: { ...candidate.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } } });
  expect(result.status).toBe("saved-result-ready");
  if (result.status !== "saved-result-ready") throw new Error(JSON.stringify(result));
  saved = result.result;
}, 30_000);
afterAll(() => selectHotPathIntegrityTierV1(previousTier));

describe("current exact72 fitting workflow", () => {
  it("executes a changed candidate and saves its own checkpoint with bounded qualification", () => {
    expect(reference.selectedConstruction.modelId).toMatch(/standard-72$/);
    expect(candidate.hemodynamicResearchInputs).toEqual(descriptor.defaultFixture.hemodynamicResearchInputs);
    expect(candidate.mechanismResearchInputs).toEqual(descriptor.defaultFixture.mechanismResearchInputs);
    expect(saved.evaluation.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl).toBe(4940);
    expect(saved.reference.selectedConstruction.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl).toBe(4935);
    expect(saved.reference.target.referenceOutputsAreTargets).toBe(false);
    expect(saved.evaluation).toMatchObject({ status: "accepted", initializationKind: "standard72-parameter-continuation",
      executionPath: "standard72-selected-output-projection", classification: { status: "period1-converged" },
      rest: { status: "passed" }, checkpoint: { checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_CHECKPOINT_V1_ID },
      qualification: { postFitEnvelopeQualified: false, preloadReserve: "not-evaluated", publicBaselinePromotionAuthorized: false } });
    expect(saved.evaluation.rest.historicalWarnings.length).toBeGreaterThan(0);
  });

  it("reopens JSON and reruns the saved candidate while preserving the target reference", async () => {
    const reopened = await validate(JSON.parse(JSON.stringify(saved)));
    const rerun = await run({ reuse: reopened });
    expect(rerun.status).toBe("saved-result-ready");
    if (rerun.status !== "saved-result-ready") return;
    expect(rerun.result.reference).toEqual(reference);
    expect(rerun.result.evaluation.candidateInputs).toEqual(saved.evaluation.candidateInputs);
    expect(rerun.result.evaluation.initializationKind).toBe("standard72-exact-checkpoint");
    expect(rerun.result.evaluation.completedCycleCount).toBe(3);
    expect(rerun.result.evaluation.rest.status).toBe("passed");
    expect(rerun.result.evaluation.checkpoint.acceptedTimeSec).toBeGreaterThan(saved.evaluation.checkpoint.acceptedTimeSec);
  }, 15_000);

  it("matches uninterrupted selected-projection continuation from a warm predictor checkpoint", async () => {
    const live = await Session.restoreStandard72ExactCheckpoint(checkpoint);
    const start = live.currentAcceptedState().acceptedTimeSec;
    for (let i = 1; i <= 8; i++) live.advanceToPresentationTimeWithSelectedOutputProjectionV1(start + i * .002, []);
    const warm = await live.checkpointStandard72Exact();
    expect(warm.coupledPredictor.historyDepth).toBeGreaterThanOrEqual(3);
    const traced = await Session.restoreStandard72ExactCheckpoint(warm);
    const samples = collect(traced, fixture(), 1);
    for (const sample of samples) {
      const actual = live.advanceToPresentationTimeWithSelectedOutputProjectionV1(sample.acceptedTimeSec, ["hemodynamics.pressure.absolute.LV"]);
      expect(actual.projectedValues?.["hemodynamics.pressure.absolute.LV"].value).toBe(sample.absolutePressureMmHg.LV);
    }
    expect(await traced.checkpointStandard72Exact()).toEqual(await live.checkpointStandard72Exact());
  }, 15_000);

  it("rejects stale records and rehashed candidate/checkpoint mismatches", async () => {
    const edited = JSON.parse(JSON.stringify(saved));
    edited.evaluation.candidateInputs.hemodynamicResearchInputs.totalBloodVolumeMl += 5;
    await expect(validate(edited)).rejects.toThrow(/digest/);
    const { resultSha256: _old, ...body } = edited;
    edited.resultSha256 = await sha256CanonicalJsonHex(body);
    await expect(validate(edited)).rejects.toThrow();
    const stale = JSON.parse(JSON.stringify(saved));
    stale.evaluation.policyIdentitySha256 = "f".repeat(64);
    const { resultSha256: _old2, ...staleBody } = stale;
    stale.resultSha256 = await sha256CanonicalJsonHex(staleBody);
    await expect(validate(stale)).rejects.toThrow(/context/);
  });

  it("rejects an incompatible checkpoint and wrong-tier evaluation before advancing", async () => {
    const corrupt = { ...checkpoint, checkpointId: "circleheart.main-wire-integrated-model-standard70-exact-checkpoint.v1" } as unknown as Checkpoint;
    expect(await evaluate({ initialization: { kind: "standard72-exact-checkpoint", checkpoint: corrupt } }))
      .toMatchObject({ status: "invalid-or-physical", phase: "initialization" });
    selectHotPathIntegrityTierV1("full-invariant");
    try { expect(await evaluate()).toMatchObject({ status: "invalid-or-physical", phase: "request-validation" }); }
    finally { selectHotPathIntegrityTierV1("hot-path-lean"); }
  });

  it("fails closed on invalid HR and honors event-loop interruption", async () => {
    expect(await evaluate({ candidateInputs: { ...candidate, hemodynamicResearchInputs: { ...candidate.hemodynamicResearchInputs, heartRateBpm: 65 } } }))
      .toMatchObject({ status: "invalid-or-physical", phase: "request-validation" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 0);
    try { expect(await evaluate({ abortSignal: controller.signal })).toMatchObject({ status: "operational-interrupted" }); }
    finally { clearTimeout(timer); }
  }, 15_000);
});

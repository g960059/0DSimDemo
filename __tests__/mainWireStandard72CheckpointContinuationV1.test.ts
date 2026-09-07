import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 as OtherModel } from "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_OUTPUT_IDS_V1 as outputs } from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";

const previousTier = hotPathIntegrityTierV1();
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => selectHotPathIntegrityTierV1(previousTier));
function advance(session: Session, time: number) {
  const result = session.advanceToPresentationTimeWithStandard70SelectedOutputProjectionV1(time, outputs);
  expect(result.advance.status).toBe("advanced");
  if (result.advance.status !== "advanced") throw new Error(`advance rejected at ${time}`);
  return { advance: result.advance, outputs: result.projectedValues };
}
async function warm() {
  const source = await Session.create();
  for (let tick = 1; tick <= 5; tick++) advance(source, tick * .002);
  expect(source.coupledPredictorReport().historyDepth).toBe(4);
  return source;
}
async function resign(checkpoint: Checkpoint, patch: Record<string, unknown>) {
  const { checkpointSha256: _, ...payload } = { ...checkpoint, ...patch };
  return { ...payload, checkpointSha256: await sha256CanonicalJsonHex(payload) };
}

describe("Standard72 history-preserving, single durable checkpoint", () => {
  it.each(["hot-path-lean", "full-invariant"] as const)("roundtrips the actual continuation state in %s", async tier => {
    selectHotPathIntegrityTierV1(tier);
    const source = await Session.create();
    for (let tick = 1; tick <= 30; tick++) advance(source, tick * .002);
    const saved = await source.checkpointStandard72Exact();
    // Full-invariant uses the predictor-free path; empty is real state,
    // not missing history to be filled or a lean continuation concession.
    expect(saved.coupledPredictor.historyDepth).toBe(tier === "hot-path-lean" ? 4 : 0);
    expect(saved.modelIdentity.numericalContinuation).toBeTruthy();
    const restored = await Session.restoreStandard72ExactCheckpoint(saved);
    expect(await restored.checkpointStandard72Exact()).toEqual(saved);
    expect(restored.snapshotAcceptedStateBytes()).toEqual(source.snapshotAcceptedStateBytes());
    expect(advance(restored, .062)).toEqual(advance(source, .062));
  }, 30_000);

  it("continues bit-identically from history4 through multiple beats and event boundaries", async () => {
    const source = await warm(), saved = await source.checkpointStandard72Exact();
    const restored = await Session.restoreStandard72ExactCheckpoint(saved);
    expect(saved.coupledPredictor.historyDepth).toBe(4);
    expect(await restored.checkpointStandard72Exact()).toEqual(saved);
    let clippedBoundaries = 0;
    for (let tick = 6; tick <= 1000; tick++) {
      const expected = advance(source, tick * .002), actual = advance(restored, tick * .002);
      expect(actual).toEqual(expected);
      expect(restored.snapshotAcceptedStateBytes()).toEqual(source.snapshotAcceptedStateBytes());
      clippedBoundaries += expected.advance.boundaryClippedSubstepCount;
      if (tick % 100 === 0) {
        // Includes the entire in-progress and completed beat accumulators,
        // not just pressure/volume readbacks or display-decimated samples.
        expect(await restored.checkpointStandard72Exact()).toEqual(await source.checkpointStandard72Exact());
      }
    }
    expect(clippedBoundaries).toBeGreaterThan(0);
    expect(source.observe().completedBeatMetrics).not.toBeNull();
    expect(restored.observe().completedBeatMetrics).toEqual(source.observe().completedBeatMetrics);
  }, 90_000);

  it("captures one epoch before await and has no effect on the source continuation", async () => {
    const source = await warm(), noCapture = await warm();
    const before = source.snapshotAcceptedStateBytes(), predictor = source.coupledPredictorReport();
    const pending = source.checkpointStandard72Exact();
    expect(source.coupledPredictorReport()).toEqual(predictor);
    const next = advance(source, .012);
    expect(next).toEqual(advance(noCapture, .012));
    expect(source.snapshotAcceptedStateBytes()).toEqual(noCapture.snapshotAcceptedStateBytes());
    const captured = await pending;
    expect(captured.acceptedTimeSec).toBe(.01);
    expect(captured.coupledPredictor.expectedBaseAcceptedTimeSec).toBe(.01);
    const restored = await Session.restoreStandard72ExactCheckpoint(captured);
    expect(restored.snapshotAcceptedStateBytes()).toEqual(before);
    expect(advance(restored, .012)).toEqual(next);
    expect(await restored.checkpointStandard72Exact()).toEqual(await source.checkpointStandard72Exact());
  });

  it("owns checkpoint and configuration inputs before restore yields", async () => {
    const source = await warm(), saved = await source.checkpointStandard72Exact();
    const caller = JSON.parse(JSON.stringify(saved));
    const callerInputs = { ...hemodynamics }, callerMechanism = structuredClone(mechanism);
    const pending = Session.restoreStandard72ExactCheckpoint(caller, callerInputs, 1, undefined, callerMechanism);
    caller.coupledPredictor.currentAcceptedMl.fill(0);
    caller.baseStandardCheckpointV2.acceptedTimeSec = 100;
    callerInputs.totalBloodVolumeMl = 5000;
    Object.assign(callerMechanism, { inputId: "changed-after-call" });
    const restored = await pending;
    expect(await restored.checkpointStandard72Exact()).toEqual(saved);
    expect(advance(restored, .012)).toEqual(advance(source, .012));
  });

  it("rejects missing history, changed digests, clocks, and a re-signed but mismatched root", async () => {
    const source = await warm(), saved = await source.checkpointStandard72Exact();
    const { coupledPredictor: _, ...missing } = saved;
    await expect(Session.restoreStandard72ExactCheckpoint(missing)).rejects.toThrow(/field/);
    await expect(Session.restoreStandard72ExactCheckpoint({ ...saved, checkpointSha256: "0".repeat(64) })).rejects.toThrow(/SHA/);
    for (const field of ["expectedBaseRevision", "expectedBaseAcceptedTimeSec"] as const) {
      const tampered = await resign(saved, { coupledPredictor: { ...saved.coupledPredictor,
        [field]: saved.coupledPredictor[field]! + 1 } });
      await expect(Session.restoreStandard72ExactCheckpoint(tampered)).rejects.toThrow(/clock/);
    }
    const currentAcceptedMl = [...saved.coupledPredictor.currentAcceptedMl];
    currentAcceptedMl[0]! += 1e-6;
    await expect(Session.restoreStandard72ExactCheckpoint(await resign(saved, {
      coupledPredictor: { ...saved.coupledPredictor, currentAcceptedMl },
    }))).rejects.toThrow(/root differs/);
    await expect(Session.restoreStandard72ExactCheckpoint(await resign(saved, {
      coupledPredictor: { ...saved.coupledPredictor, historyDepth: 0 },
    }))).rejects.toThrow(/empty.*canonical/);
    expect(await source.checkpointStandard72Exact()).toEqual(saved);
  });

  it("rejects another model and fixture instead of relabeling or filling absent state", async () => {
    const source = await warm(), saved = await source.checkpointStandard72Exact();
    const old = await OtherModel.create();
    await expect(Session.restoreStandard72ExactCheckpoint(await old.checkpointStandard70Exact())).rejects.toThrow(/field|schema/);
    await expect(OtherModel.restoreStandard70ExactCheckpoint(saved)).rejects.toThrow(/field|schema/);
    await expect(Session.restoreStandard72ExactCheckpoint(saved, { ...hemodynamics, totalBloodVolumeMl: 5000 })).rejects.toThrow();
    await expect(source.checkpointStandardExact()).rejects.toThrow(/Standard72/);
    await expect(source.checkpointCanonicalBinary()).rejects.toThrow(/legacy/);
    await expect(Session.restoreCanonicalBinary(new Uint8Array())).rejects.toThrow(/Standard72/);
    expect(canonicalJsonStringify(await source.checkpointStandard72Exact())).toBe(canonicalJsonStringify(saved));
  });

  it("keeps a real empty history on cold starts and parameter/analysis forks, without touching the source", async () => {
    const cold = await Session.create();
    const coldCheckpoint = await cold.checkpointStandard72Exact();
    expect(coldCheckpoint.coupledPredictor.historyDepth).toBe(0);
    expect(await (await Session.restoreStandard72ExactCheckpoint(coldCheckpoint)).checkpointStandard72Exact()).toEqual(coldCheckpoint);
    const source = await warm(), before = await source.checkpointStandard72Exact();
    const changedInputs = { ...hemodynamics, totalBloodVolumeMl: 5000 };
    const changed = await source.warmStartWithHemodynamicResearchInputs(changedInputs, 1, undefined, mechanism);
    for (const fork of [changed, source.forkAtFixedGlobalTotalBloodVolume(5000),
      source.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5000)]) {
      expect(fork).toBeInstanceOf(Session);
      expect(fork.coupledPredictorReport().historyDepth).toBe(0);
      advance(fork, .02);
      expect((await fork.checkpointStandard72Exact()).modelIdentity).toEqual(before.modelIdentity);
    }
    const controlled = await changed.checkpointStandard72Exact();
    const continued = await Session.restoreStandard72ExactCheckpoint(controlled, changedInputs, 1, undefined, mechanism);
    expect(advance(continued, .022)).toEqual(advance(changed, .022));
    expect(await source.checkpointStandard72Exact()).toEqual(before);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Previous } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemodynamics,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type { MainWireStaticCaseCheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";

const previousTier = hotPathIntegrityTierV1();
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => selectHotPathIntegrityTierV1(previousTier));
const inputs = { ...hemodynamics, systemicResistance: 1.2 };
const diseased = { ...mechanism, chamberMechanics: { ...mechanism.chamberMechanics,
  activeTensionScaleByWall: { ...mechanism.chamberMechanics.activeTensionScaleByWall, LVFW: .35, SEP: .35 } } };
const outputIds = ["hemodynamics.pressure.absolute.LV", "hemodynamics.pressure.absolute.RV", "hemodynamics.flow.valve.AoV", "hemodynamics.flow.valve.MV"] as const;
const create = () => Session.create("dilated-lv-v1", inputs, 1, diseased);
const restore = (saved: unknown) => Session.restore(saved, "dilated-lv-v1", inputs, 1, diseased);

function advance(owner: Session | Previous, time: number) {
  const result = owner.advanceToPresentationTimeWithSelectedOutputProjectionV1(time, outputIds);
  expect(result.advance.status).toBe("advanced");
  if (result.advance.status !== "advanced") throw new Error(`Advance failed at ${time}`);
  return { advance: result.advance, values: result.projectedValues };
}
function warm() {
  const owner = create();
  for (let tick = 1; tick <= 20; tick++) advance(owner, tick * .002);
  expect(owner.coupledPredictorReport().historyDepth).toBe(4);
  return owner;
}
async function resign(saved: Checkpoint, patch: Record<string, unknown>) {
  const { checkpointSha256: _, ...payload } = { ...saved, ...patch };
  return { ...payload, checkpointSha256: await sha256CanonicalJsonHex(payload) };
}

describe("anatomy-bearing development continuation (not yet a public preset)", () => {
  it("rejects the superseded research checkpoint schema, even with a recomputed digest", async () => {
    const saved = await create().checkpoint();
    expect(saved.checkpointId).toBe("circleheart.main-wire-static-case-checkpoint.standard-73.v1");
    await expect(restore(await resign(saved, { checkpointId: "circleheart.main-wire-research-static-case-checkpoint.v1" })))
      .rejects.toThrow(/Unsupported static case checkpoint schema/);
  });
  it("preserves baseline stepping and does not expose inherited baseline-only or legacy restore APIs", async () => {
    const source = await Previous.create(), target = Session.create("baseline-v1");
    for (let tick = 1; tick <= 250; tick++) {
      expect(advance(target, tick * .002)).toEqual(advance(source, tick * .002));
      expect(Buffer.from(target.snapshotAcceptedStateBytes()).equals(source.snapshotAcceptedStateBytes())).toBe(true);
    }
    expect(target.anatomy.lvMassG).toBeCloseTo(108.3, 10);
    for (const key of ["restoreCanonicalBinary", "restoreStandardExactCheckpoint", "checkpointStandardExact", "warmStartWithHemodynamicResearchInputs"]) {
      expect(target).not.toHaveProperty(key); expect(Session).not.toHaveProperty(key);
    }
  });

  it.each([.002, .001])("resumes exactly across ejection, relaxation and next-beat events at dt=%s", async dt => {
    const source = create();
    let resumed: Session | null = null, clipped = 0, snapshots = 0;
    const captureTimes = [.15, .35, .66, 1.1];
    for (let tick = 1; tick <= Math.round(1.72 / dt); tick++) {
      const time = tick * dt, expected = advance(source, time);
      clipped += expected.advance.boundaryClippedSubstepCount;
      if (resumed !== null) {
        expect(advance(resumed, time)).toEqual(expected);
        expect(Buffer.from(resumed.snapshotAcceptedStateBytes()).equals(source.snapshotAcceptedStateBytes()), `accepted bytes at ${time}`).toBe(true);
      }
      if (captureTimes.some(t => tick === Math.round(t / dt))) {
        const saved = await source.checkpoint();
        if (resumed !== null) expect(await resumed.checkpoint()).toEqual(saved);
        expect(saved.coupledPredictor.historyDepth).toBe(4);
        // Exercise durable JSON transport, not just an in-memory fork.
        resumed = await restore(JSON.parse(JSON.stringify(saved)));
        expect(await resumed.checkpoint()).toEqual(saved);
        expect(resumed.anatomy.lvMassG).toBeCloseTo(135.375, 10);
        snapshots++;
      }
    }
    expect(snapshots).toBe(4); expect(clipped).toBeGreaterThan(0);
    expect(source.observe().completedBeatMetrics).not.toBeNull();
    expect(resumed!.observe().completedBeatMetrics).toEqual(source.observe().completedBeatMetrics);
    expect(await resumed!.checkpoint()).toEqual(await source.checkpoint());
  }, 30_000);

  it("binds the full resolved anatomy and inputs, rejecting relabeling even after a new outer digest", async () => {
    const source = warm(), saved = await source.checkpoint();
    await expect(Session.restore(saved, "baseline-v1", inputs, 1, diseased)).rejects.toThrow(/construction mismatch/);
    await expect(Session.restore(saved, "dilated-lv-v1", { ...inputs, totalBloodVolumeMl: 5000 }, 1, diseased)).rejects.toThrow(/construction mismatch/);
    for (const field of ["lvMassG", "myocardialDensityKgPerM3"] as const) {
      const anatomy = { ...saved.construction.anatomy, [field]: saved.construction.anatomy[field] + 1e-10 };
      await expect(restore(await resign(saved, { construction: { ...saved.construction, anatomy } }))).rejects.toThrow(/construction mismatch/);
    }
    const normal = await Session.create("baseline-v1", inputs, 1, diseased).checkpoint();
    await expect(Session.restore(await resign(saved, { construction: normal.construction }), "baseline-v1", inputs, 1, diseased)).rejects.toThrow(/identity|mismatch/);
    const previous = await (await Previous.create()).checkpointStandard72Exact();
    await expect(restore(previous)).rejects.toThrow(/field|schema/);
    expect(await source.checkpoint()).toEqual(saved);
  });

  it("rejects missing predictor state, digest changes, clock and re-signed root mismatches", async () => {
    const saved = await warm().checkpoint();
    const { coupledPredictor: _, ...missing } = saved;
    await expect(restore(missing)).rejects.toThrow(/field/);
    await expect(restore({ ...saved, checkpointSha256: "0".repeat(64) })).rejects.toThrow(/SHA/);
    await expect(restore(await resign(saved, { coupledPredictor: { ...saved.coupledPredictor,
      expectedBaseAcceptedTimeSec: saved.coupledPredictor.expectedBaseAcceptedTimeSec! + .01 } }))).rejects.toThrow(/clock/);
    const root = [...saved.coupledPredictor.currentAcceptedMl]; root[0]! += 1e-5;
    await expect(restore(await resign(saved, { coupledPredictor: { ...saved.coupledPredictor, currentAcceptedMl: root } }))).rejects.toThrow(/root differs/);
    await expect(restore(await resign(saved, { coupledPredictor: { ...saved.coupledPredictor, historyDepth: 0 } }))).rejects.toThrow(/empty.*canonical/);
  });

  it("captures one epoch without changing continuation and owns caller inputs before async restore yields", async () => {
    const source = warm(), noCapture = warm();
    const before = source.snapshotAcceptedStateBytes(), pending = source.checkpoint();
    const next = advance(source, .042);
    expect(next).toEqual(advance(noCapture, .042));
    const saved = await pending;
    expect(saved.base.acceptedTimeSec).toBe(.04);
    const caller = JSON.parse(JSON.stringify(saved)), callerInputs = { ...inputs }, callerMechanism = structuredClone(diseased);
    const restoring = Session.restore(caller, "dilated-lv-v1", callerInputs, 1, callerMechanism);
    caller.coupledPredictor.currentAcceptedMl.fill(0);
    caller.construction.anatomy.lvMassG = 1;
    callerInputs.totalBloodVolumeMl = 5000;
    callerMechanism.chamberMechanics.activeTensionScaleByWall.LVFW = .7;
    const resumed = await restoring;
    expect(await resumed.checkpoint()).toEqual(saved);
    expect(resumed.snapshotAcceptedStateBytes()).toEqual(before);
    expect(advance(resumed, .042)).toEqual(next);
  });

  it("keeps the anatomy in warm controls and both analysis forks without mutating the source", async () => {
    const source = warm(), before = await source.checkpoint();
    const changedInputs = { ...inputs, totalBloodVolumeMl: 5000 };
    const changed = source.warmStart(changedInputs);
    const branches = [changed, source.forkAtFixedGlobalTotalBloodVolume(5000),
      source.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5000)];
    for (const branch of branches) {
      expect(branch.anatomy).toBe(source.anatomy);
      expect(branch.coronaryConstruction).toEqual(source.coronaryConstruction);
      expect(branch.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl).toBe(5000);
      expect(branch.coupledPredictorReport().historyDepth).toBe(0);
      advance(branch, .05);
      const saved = await branch.checkpoint();
      expect(saved.construction.anatomy).toEqual(before.construction.anatomy);
      const resumed = await Session.restore(saved, "dilated-lv-v1", branch === changed ? changedInputs : inputs, 1, diseased);
      expect(advance(resumed, .052)).toEqual(advance(branch, .052));
    }
    expect(await source.checkpoint()).toEqual(before);
    const replacement = Session.create("baseline-v1");
    expect(replacement.currentAcceptedState().acceptedTimeSec).toBe(0);
    expect(replacement.coupledPredictorReport().historyDepth).toBe(0);
    expect(source.anatomy.caseId).toBe("dilated-lv-v1");
  });
});

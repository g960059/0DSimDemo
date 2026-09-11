import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as StaticSession } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { mainWireStaticCaseFittingSeedV1 as staticSeed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import {
  wrapMainWirePreloadReserveSessionV1 as wrap,
} from "@/analysis/methods/mainWire/MainWirePreloadReserveSessionV1";

const previousTier = hotPathIntegrityTierV1();
const candidate = staticSeed("baseline");
const Session = StaticSession;
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => {
  vi.restoreAllMocks();
  selectHotPathIntegrityTierV1(previousTier);
});

async function warm() {
  const source = Session.create(candidate.anatomyId, candidate.hemodynamicResearchInputs, 1, candidate.mechanismResearchInputs);
  for (let tick = 1; tick <= 5; tick++) {
    const result = source.advanceToPresentationTimeWithSelectedOutputProjectionV1(tick * .002, []);
    expect(result.advance.status).toBe("advanced");
  }
  expect(source.coupledPredictorReport().historyDepth).toBe(4);
  return source;
}

describe("Current-model preload reserve numerical adapter", () => {
  it.each([.002, .001] as const)("preserves a static disease anatomy recursively at %s s without a baseline factory", async dt => {
    const c = staticSeed("hfref-chronic-dilated-v1");
    const source = StaticSession.create(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
    source.advanceToPresentationTimeWithSelectedOutputProjectionV1(.01, []);
    const before = await source.checkpoint();
    const fixedFork = vi.spyOn(StaticSession.prototype, "forkAtFixedGlobalTotalBloodVolume");
    const responsiveFork = vi.spyOn(StaticSession.prototype, "forkResponsiveStarlingAtFixedGlobalTotalBloodVolume");
    const selected = vi.spyOn(StaticSession.prototype, "advanceToPresentationTimeWithSelectedOutputProjectionV1");
    const branch = wrap(source, dt).forkAtFixedGlobalTotalBloodVolume(4850)
      .forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(4900);
    expect(branch.advanceToPresentationTime(.02).status).toBe("advanced");
    for (const result of [...fixedFork.mock.results, ...responsiveFork.mock.results]) {
      expect((await result.value.checkpoint()).construction.anatomy).toEqual(before.construction.anatomy);
    }
    expect(selected).toHaveBeenCalledTimes(.01 / dt);
    expect(await source.checkpoint()).toEqual(before);
  });
  it.each([.002, .001] as const)("uses %s s selected steps recursively in both forks without changing the source", async dt => {
    const source = await warm();
    const saved = await source.checkpoint();
    const bytes = source.snapshotAcceptedStateBytes();
    const predictor = source.coupledPredictorReport();
    const projection = vi.spyOn(Session.prototype, "advanceToPresentationTimeWithSelectedOutputProjectionV1");
    const publicAdvance = vi.spyOn(Session.prototype, "advanceToPresentationTime");
    const rawStructuralAdvance = vi.spyOn(Session.prototype, "advanceStructuralAnalysisToPresentationTimeV1");
    const tbv = source.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl;
    const wrapped = wrap(source, dt);
    const low = wrapped.forkAtFixedGlobalTotalBloodVolume(tbv * .88);
    const high = wrapped.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(tbv * 1.12);
    const branches = [low, high,
      low.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(tbv * .94),
      high.forkAtFixedGlobalTotalBloodVolume(tbv * 1.06)];
    for (const [index, branch] of branches.entries()) {
      const before = projection.mock.calls.length;
      const advance = index % 2 === 0 ? branch.advanceToPresentationTime(.02)
        : branch.advanceStructuralAnalysisToPresentationTimeV1!(.02);
      expect(advance.status).toBe("advanced");
      if (advance.status !== "advanced") throw new Error("fork did not advance");
      const calls = projection.mock.calls.slice(before);
      expect(calls).toHaveLength(.01 / dt);
      let time = .01;
      for (const [target, outputIds] of calls) {
        expect(target - time).toBeCloseTo(dt, 12);
        expect(outputIds).toEqual([]);
        time = target;
      }
      expect(advance.acceptedTimeSec).toBe(.02);
      expect(advance.acceptedRevisionSpanFromPrevious).toBe(advance.internalAcceptedSubstepCount);
      expect(advance.substeps).toHaveLength(advance.internalAcceptedSubstepCount);
      expect(advance.internalAcceptedSubstepCount).toBeGreaterThanOrEqual(.01 / dt);
      expect(branch.projectCurrentAcceptedValuesV1!(["hemodynamics.pressure.absolute.LV"]))
        .toHaveProperty("hemodynamics.pressure.absolute.LV");
    }
    expect(publicAdvance).not.toHaveBeenCalled();
    expect(rawStructuralAdvance).not.toHaveBeenCalled();
    expect(source.snapshotAcceptedStateBytes()).toEqual(bytes);
    expect(source.coupledPredictorReport()).toEqual(predictor);
    expect(await source.checkpoint()).toEqual(saved);
  }, 15_000);

  it.each([.002, .001] as const)("matches warm selected continuation at %s s across protocol intervals", async dt => {
    const source = await warm();
    const saved = await source.checkpoint();
    const expected = await Session.restore(saved, candidate.anatomyId, candidate.hemodynamicResearchInputs, 1, candidate.mechanismResearchInputs);
    const wrapped = wrap(source, dt);
    for (const target of [.02, .03, .04, .05, .06]) {
      const start = expected.currentAcceptedState().acceptedTimeSec;
      for (let ordinal = 1; ordinal <= Math.round((target - start) / dt); ordinal++) {
        const ordinalTarget = start + ordinal * dt;
        const next = Math.abs(ordinalTarget - target) <= 1e-12 ? target : ordinalTarget;
        expect(expected.advanceToPresentationTimeWithSelectedOutputProjectionV1(next, []).advance.status).toBe("advanced");
      }
      expect(wrapped.advanceToPresentationTime(target).status).toBe("advanced");
      expect(source.snapshotAcceptedStateBytes()).toEqual(expected.snapshotAcceptedStateBytes());
    }
    // Restoring resets execution counters, but the complete durable predictor,
    // beat accumulator, and accepted numerical state must continue identically.
    expect(await source.checkpoint()).toEqual(await expected.checkpoint());
  });

  it("retains all committed substeps and the original request target when a later substep fails", async () => {
    const source = await warm();
    const selected = source.advanceToPresentationTimeWithSelectedOutputProjectionV1.bind(source);
    const projection = vi.spyOn(source, "advanceToPresentationTimeWithSelectedOutputProjectionV1")
      .mockImplementationOnce(selected)
      .mockImplementationOnce(target => ({ advance: {
        status: "failed", reason: "candidate-time-did-not-advance", message: "test numerical failure",
        acceptedTimeSec: source.currentAcceptedState().acceptedTimeSec,
        acceptedRevision: source.currentAcceptedState().revision,
        partiallyAdvanced: false, internalAcceptedSubstepCount: 0,
        requestedPresentationTimeSec: target,
      }, projectedValues: null, outputProjectionDurationMs: 0 }));
    const result = wrap(source, .001).advanceToPresentationTime(.02);
    expect(result).toMatchObject({ status: "failed", message: "test numerical failure",
      partiallyAdvanced: true, requestedPresentationTimeSec: .02,
      acceptedTimeSec: .011, internalAcceptedSubstepCount: 1,
    });
    expect(result.status === "failed" && result.substeps).toHaveLength(1);
    expect(projection).toHaveBeenCalledTimes(2);
  });

  it("rejects unsupported resolution and cancellation before advancing any branch", async () => {
    const source = await warm();
    const saved = await source.checkpoint();
    const controller = new AbortController();
    const wrapped = wrap(source, .001, controller.signal);
    const branch = wrapped.forkAtFixedGlobalTotalBloodVolume(candidate.hemodynamicResearchInputs.totalBloodVolumeMl);
    controller.abort();
    expect(() => branch.advanceToPresentationTime(.02)).toThrow(/interrupted/);
    expect(() => branch.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5000)).toThrow(/interrupted/);
    expect(() => wrap(source, .004 as .002)).toThrow(/nominalDtSec/);
    expect(await source.checkpoint()).toEqual(saved);
  });
});

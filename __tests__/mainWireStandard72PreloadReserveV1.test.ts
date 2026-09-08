import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canonicalJsonStringify } from "@/engine/integrity";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import * as protocol from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  measureMainWireStandard72PreloadReserveV1 as measure,
  wrapMainWireStandard72PreloadReserveSessionV1 as wrap,
} from "@/analysis/methods/mainWire/MainWireStandard72PreloadReserveV1";

const previousTier = hotPathIntegrityTierV1();
const candidate = resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => {
  vi.restoreAllMocks();
  selectHotPathIntegrityTierV1(previousTier);
});

async function warm() {
  const source = await Session.create();
  for (let tick = 1; tick <= 5; tick++) {
    const result = source.advanceToPresentationTimeWithSelectedOutputProjectionV1(tick * .002, []);
    expect(result.advance.status).toBe("advanced");
  }
  expect(source.coupledPredictorReport().historyDepth).toBe(4);
  return source;
}

describe("Standard72 preload reserve numerical adapter", () => {
  it.each([.002, .001] as const)("uses %s s selected steps recursively in both forks without changing the source", async dt => {
    const source = await warm();
    const saved = await source.checkpointStandard72Exact();
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
    expect(await source.checkpointStandard72Exact()).toEqual(saved);
  }, 15_000);

  it.each([.002, .001] as const)("matches warm selected continuation at %s s across protocol intervals", async dt => {
    const source = await warm();
    const saved = await source.checkpointStandard72Exact();
    const expected = await Session.restoreStandard72ExactCheckpoint(saved);
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
    expect(await source.checkpointStandard72Exact()).toEqual(await expected.checkpointStandard72Exact());
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

  it("owns request inputs before restore yields and delegates the unmodified V2 protocol", async () => {
    const source = await warm();
    const saved = await source.checkpointStandard72Exact();
    const before = canonicalJsonStringify(saved);
    const inputs = structuredClone(candidate);
    const callerCheckpoint = structuredClone(saved);
    const stop = new Error("stop after testing protocol delegation");
    const sharedProtocol = vi.spyOn(protocol, "measureMainWireIntegratedModelFormalPreloadReserveV2")
      .mockImplementation(async (session, hemodynamics) => {
        expect(hemodynamics).toEqual(candidate.hemodynamicResearchInputs);
        expect(session.currentAcceptedState().acceptedTimeSec).toBe(saved.acceptedTimeSec);
        const branch = session.forkAtFixedGlobalTotalBloodVolume(hemodynamics.totalBloodVolumeMl);
        expect(branch.advanceToPresentationTime(.02).internalAcceptedSubstepCount).toBe(10);
        throw stop;
      });
    const pending = measure({ candidateInputs: inputs, checkpoint: callerCheckpoint, nominalDtSec: .001 });
    Object.assign(inputs, { hemodynamicResearchInputs: { ...inputs.hemodynamicResearchInputs, totalBloodVolumeMl: 5000 } });
    Object.assign(callerCheckpoint.coupledPredictor, { currentAcceptedMl: Array(callerCheckpoint.coupledPredictor.currentAcceptedMl.length).fill(0) });
    await expect(pending).rejects.toBe(stop);
    expect(sharedProtocol).toHaveBeenCalledTimes(1);
    expect(canonicalJsonStringify(saved)).toBe(before);
    expect(await source.checkpointStandard72Exact()).toEqual(saved);
  });

  it("rejects unsupported resolution and cancellation before advancing any branch", async () => {
    const source = await warm();
    const saved = await source.checkpointStandard72Exact();
    const controller = new AbortController();
    const wrapped = wrap(source, .001, controller.signal);
    const branch = wrapped.forkAtFixedGlobalTotalBloodVolume(candidate.hemodynamicResearchInputs.totalBloodVolumeMl);
    controller.abort();
    expect(() => branch.advanceToPresentationTime(.02)).toThrow(/interrupted/);
    expect(() => branch.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(5000)).toThrow(/interrupted/);
    await expect(measure({ candidateInputs: candidate, checkpoint: saved, nominalDtSec: .001,
      abortSignal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    await expect(measure({ candidateInputs: candidate, checkpoint: saved, nominalDtSec: .004 as .002 }))
      .rejects.toThrow(/nominalDtSec/);
    expect(await source.checkpointStandard72Exact()).toEqual(saved);
  });
});

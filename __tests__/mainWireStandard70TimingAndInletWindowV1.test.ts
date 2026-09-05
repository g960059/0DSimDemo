import { describe, expect, it, vi } from "vitest";
import {
  completeMainWireStandard70TimingAndInletTraceV1,
  mainWireStandard70TimingAndInletObservationTraceV1,
  MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

/** Only the time/flow coordinates consumed by the pure window selector. */
function trace(points: readonly (readonly [number, number, number])[], start = 0): readonly Sample[] {
  return Object.freeze(points.map(([time, mv, tv], index) => Object.freeze({
    acceptedTimeSec: time, acceptedDtSec: time - (points[index - 1]?.[0] ?? start),
    valveFlowMlPerSec: Object.freeze({ MV: mv, TV: tv, AoV: 0, PV: 0 }),
  }) as Sample));
}

describe("Standard70 real timing/inlet observation window", () => {
  it("runs no additional cycle when both real post-capture closures are already retained", () => {
    const terminalTrace = trace([[0.9, 1, 1], [1, 2, 2], [1.1, 0, 0]]);
    const runLookaheadCycle = vi.fn(() => { throw new Error("unnecessary lookahead"); });
    expect(completeMainWireStandard70TimingAndInletTraceV1({
      terminalTrace, completedBeatEndTimeSec: 1, runLookaheadCycle,
    })).toEqual({});
    expect(runLookaheadCycle).not.toHaveBeenCalled();
  });

  it("records a real continuation once, retaining only the prefix ending at both inlet closures", () => {
    const terminalTrace = trace([[0.9, 1, 1], [1, 4, 4], [1.132, 2, 1]]);
    const lookahead = trace([[1.134, 0, 0.5], [1.136, 0, 0], [1.2, 0, 0], [2.132, 2, 1]], 1.132);
    const before = JSON.stringify(terminalTrace);
    const runLookaheadCycle = vi.fn(() => lookahead);
    const window = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: 1, runLookaheadCycle });
    expect(runLookaheadCycle).toHaveBeenCalledTimes(1);
    expect(window.timingAndInletTrace).toEqual([...terminalTrace, ...lookahead.slice(0, 2)]);
    expect(window.timingAndInletTrace![0]).toBe(terminalTrace[0]);
    expect(window.timingAndInletObservationWindow).toEqual({
      policyId: MAIN_WIRE_STANDARD70_TIMING_AND_INLET_WINDOW_POLICY_V1_ID,
      checkpointAcceptedTimeSec: 1.132, observedThroughAcceptedTimeSec: 1.136,
      lookaheadCycleCount: 1, executedLookaheadStepCount: 4, retainedLookaheadStepCount: 2,
    });
    expect(JSON.stringify(terminalTrace)).toBe(before);
    expect(mainWireStandard70TimingAndInletObservationTraceV1({ terminalTrace, ...window }))
      .toBe(window.timingAndInletTrace);
  });

  it("keeps an already observed right closure while waiting only for the missing left closure", () => {
    const terminalTrace = trace([[0.9, 1, 1], [1, 3, 2], [1.132, 1, 0]]);
    const window = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: 1,
      runLookaheadCycle: () => trace([[1.134, 0, 0], [1.136, 0, 0]], 1.132) });
    expect(window.timingAndInletObservationWindow!.retainedLookaheadStepCount).toBe(1);
  });

  it("does not fabricate a closure or count a closure preceding the target capture", () => {
    const terminalTrace = trace([[0.8, 1, 1], [0.9, 0, 0], [1.132, 2, 2]]);
    for (const lookahead of [[], trace([[1.134, 1, 1], [1.136, 0.1, 0.1]], 1.132)]) {
      expect(() => completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
        completedBeatEndTimeSec: 1, runLookaheadCycle: () => lookahead }))
        .toThrow(/no complete post-capture inlet closures/);
    }
  });

  it("rejects gaps and nonfinite flow rather than splicing disconnected endpoints", () => {
    const terminalTrace = trace([[1, 3, 3], [1.132, 2, 2]]);
    expect(() => completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: 1, runLookaheadCycle: () => trace([[1.136, 0, 0]], 1.134) }))
      .toThrow(/contiguous actual accepted/);
    expect(() => completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: 1, runLookaheadCycle: () => trace([[1.134, NaN, 0]], 1.132) }))
      .toThrow(/nonfinite flow/);
  });

  it("rejects detached or relabelled retained suffix evidence on re-observation", () => {
    const terminalTrace = trace([[1, 3, 3], [1.132, 2, 2]]);
    const window = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: 1, runLookaheadCycle: () => trace([[1.134, 0, 0]], 1.132) });
    expect(mainWireStandard70TimingAndInletObservationTraceV1({ terminalTrace })).toBe(terminalTrace);
    expect(() => mainWireStandard70TimingAndInletObservationTraceV1({ terminalTrace,
      timingAndInletTrace: window.timingAndInletTrace })).toThrow(/not bound/);
    expect(() => mainWireStandard70TimingAndInletObservationTraceV1({ terminalTrace, ...window,
      timingAndInletObservationWindow: { ...window.timingAndInletObservationWindow!, retainedLookaheadStepCount: 2 } }))
      .toThrow(/not bound/);
    expect(() => mainWireStandard70TimingAndInletObservationTraceV1({ ...window,
      terminalTrace: trace([[1, 3, 3], [1.132, 20, 2]]) })).toThrow(/not bound/);
  });
});

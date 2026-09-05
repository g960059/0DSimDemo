import { describe, expect, it } from "vitest";

import {
  AcceptedScalarAnalysisWindowStoreV1,
  exactOutputSelectionWithAnalysisV1,
} from "@/analysis/runtime/AcceptedScalarAnalysisWindowV1";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";

const OUTPUT_ID = "signal/test";

describe("accepted scalar analysis window V1", () => {
  it("retains consecutive exact frames without presentation remapping", () => {
    const store = new AcceptedScalarAnalysisWindowStoreV1({
      expectedFrameIntervalSec: 0.002,
      requiredExactOutputIds: [OUTPUT_ID],
      windowSec: 0.02,
    });
    store.appendFrames(Array.from({ length: 21 }, (_, revision) =>
      frameV1(revision, revision * 0.002, revision)));

    const samples = store.getScenarioSamples("scenario/a");
    expect(samples[0]?.acceptedTimeSec).toBeCloseTo(0.018, 12);
    expect(samples.at(-1)).toMatchObject({
      acceptedRevision: 20,
      acceptedTimeSec: 0.04,
      values: { [OUTPUT_ID]: 20 },
    });
    expect(samples.every((sample, index) =>
      index === 0
      || sample.acceptedRevision === samples[index - 1]!.acceptedRevision + 1,
    )).toBe(true);
  });

  it("allows internal revision jumps but fails closed across delivered-frame gaps, epoch changes, and unavailable inputs", () => {
    const store = new AcceptedScalarAnalysisWindowStoreV1({
      expectedFrameIntervalSec: 0.002,
      requiredExactOutputIds: [OUTPUT_ID],
    });
    store.appendFrames([frameV1(1, 0.002, 1), frameV1(2, 0.004, 2)]);
    store.appendFrames([frameV1(4, 0.006, 4)]);
    expect(store.getScenarioSamples("scenario/a").map(
      ({ acceptedRevision }) => acceptedRevision,
    )).toEqual([1, 2, 4]);

    store.appendFrames([frameV1(5, 0.01, 5)]);
    expect(store.getScenarioSamples("scenario/a").map(
      ({ acceptedRevision }) => acceptedRevision,
    )).toEqual([5]);
    store.appendFrames([frameV1(6, 0.012, 6, 2)]);
    expect(store.getScenarioSamples("scenario/a")).toHaveLength(1);
    store.appendFrames([frameV1(7, 0.014, null, 2)]);
    expect(store.getScenarioSamples("scenario/a")).toEqual([]);
  });

  it("unions analysis dependencies without mutating presentation selection", () => {
    const presentation = new Set(["signal/graph"]);
    const selected = exactOutputSelectionWithAnalysisV1(
      presentation,
      [OUTPUT_ID],
    );
    expect([...selected]).toEqual(["signal/graph", OUTPUT_ID]);
    expect([...presentation]).toEqual(["signal/graph"]);
  });

  it("treats an identical terminal-frame notification as a no-op", () => {
    const store = new AcceptedScalarAnalysisWindowStoreV1({
      expectedFrameIntervalSec: 0.002, requiredExactOutputIds: [OUTPUT_ID],
    });
    const frames = [frameV1(1, 0.002, 1), frameV1(2, 0.004, 2)];
    store.appendFrames(frames);
    const snapshot = store.getSnapshot();
    store.appendFrames([frames[1]!]);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(store.getScenarioSamples("scenario/a")).toHaveLength(2);
    store.appendFrames([frameV1(2, 0.004, 99)]);
    expect(store.getScenarioSamples("scenario/a")).toHaveLength(1);
    expect(store.getScenarioSamples("scenario/a")[0]!.values[OUTPUT_ID]).toBe(99);
  });

  it("keeps batch partitioning equivalent and published history immutable", () => {
    const options = { expectedFrameIntervalSec: 0.002,
      requiredExactOutputIds: [OUTPUT_ID], windowSec: 0.02 };
    const batched = new AcceptedScalarAnalysisWindowStoreV1(options);
    const single = new AcceptedScalarAnalysisWindowStoreV1(options);
    const frames = Array.from({ length: 101 }, (_, index) => frameV1(index, index * 0.002, index));
    batched.appendFrames(frames.slice(0, 10));
    const first = batched.getScenarioSamples("scenario/a");
    const saved = JSON.stringify(first);
    batched.appendFrames(frames.slice(10));
    for (const frame of frames) single.appendFrames([frame]);
    expect(batched.getSnapshot()).toEqual(single.getSnapshot());
    expect(first).toHaveLength(10);
    expect(JSON.stringify(first)).toBe(saved);
    expect(Object.isFrozen(first)).toBe(true);
    expect(batched.getScenarioSamples("scenario/a").length).toBeLessThanOrEqual(12);
  });
});

function frameV1(
  acceptedRevision: number,
  acceptedTimeSec: number,
  value: number | null,
  inputEpoch = 1,
): StudioSimulationFrameV2 {
  return Object.freeze({
    modelId: "model/test",
    runtimeSessionId: "runtime/test",
    scenarioId: "scenario/a",
    inputEpoch,
    acceptedRevision,
    acceptedTimeSec,
    outputs: Object.freeze({
      [OUTPUT_ID]: Object.freeze({
        outputId: OUTPUT_ID,
        value,
        availability:
          value === null ? "not-evaluated-at-accepted-state" : "available",
        quality: value === null ? "not-assessed" : "authoritative-state",
      }),
    }),
  });
}

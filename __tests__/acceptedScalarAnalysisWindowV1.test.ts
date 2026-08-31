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

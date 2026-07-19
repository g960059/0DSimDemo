import { describe, expect, it } from "vitest";
import {
  cyclicEligibleWindowMaskV1,
  cyclicIntervalsMaskV1,
  cyclicTransitionIndicesV1,
  elapsedSamplesSinceLatestCyclicEventV1,
  pairOrderedCoronaryValveEventsV1,
} from "@/engine/coronary/coronaryCycleEventSegmentationV1";

describe("cyclic coronary valve-event segmentation", () => {
  it("pairs a wrap-around MVC -> AoVO -> AoVC sequence exactly once", () => {
    const events = pairOrderedCoronaryValveEventsV1(
      100,
      [95],
      [5],
      [30],
    );
    expect(events).toEqual([{
      mitralClosingIndex: 95,
      aorticOpeningIndex: 5,
      aorticClosingIndex: 30,
      mitralToAorticOpeningSamples: 10,
      aorticEjectionSamples: 25,
      mitralToAorticClosureSamples: 35,
    }]);
  });

  it("pairs multiple cycles without reusing events", () => {
    const events = pairOrderedCoronaryValveEventsV1(
      200,
      [10, 110],
      [20, 120],
      [50, 150],
    );
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.aorticOpeningIndex)).toEqual([20, 120]);
    expect(events.map((event) => event.aorticClosingIndex)).toEqual([50, 150]);
  });

  it("does not hide an extra diastatic mitral threshold crossing", () => {
    const mitralOpenMask = [
      true, true, false, false, true, false, false, false,
    ];
    const closingIndices = cyclicTransitionIndicesV1(
      mitralOpenMask,
      true,
      false,
    );
    expect(closingIndices).toEqual([2, 5]);
    const events = pairOrderedCoronaryValveEventsV1(
      mitralOpenMask.length,
      closingIndices,
      [3],
      [4],
    );
    expect(events).toHaveLength(1);
    expect(events.length).not.toBe(closingIndices.length);
  });

  it("rejects AoVC that cannot occur after AoVO before the next MVC", () => {
    expect(pairOrderedCoronaryValveEventsV1(
      100,
      [10],
      [30],
      [20],
    )).toEqual([]);
  });

  it("builds wrap-safe systolic and eligible early-diastolic masks", () => {
    const systole = cyclicIntervalsMaskV1(10, [8], [2]);
    expect(systole).toEqual([
      true, true, false, false, false, false, false, false, true, true,
    ]);
    const diastole = systole.map((value) => !value);
    const early = cyclicEligibleWindowMaskV1(10, [2], 3, diastole);
    expect(early).toEqual([
      false, false, true, true, true, false, false, false, false, false,
    ]);
    expect(elapsedSamplesSinceLatestCyclicEventV1(4, [2], 10)).toBe(2);
    expect(elapsedSamplesSinceLatestCyclicEventV1(1, [2], 10)).toBe(9);
  });
});

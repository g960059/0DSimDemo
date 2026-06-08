import { describe, expect, it } from "vitest";
import { buildPvLoopDrawPlan } from "@/components/pvLoopTransition";
import { buildWaveformDrawPlan, phaseInSegments } from "@/components/waveformPhaseWipe";

describe("chart transition replacement helpers", () => {
  it("uses phase-window segments instead of a single waveform break boundary", () => {
    const plan = buildWaveformDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 18 },
      instanceLatestT: 23,
      timeWindowSec: 10,
    });

    expect(phaseInSegments(9, plan.currentSegments, 10)).toBe(true);
    expect(phaseInSegments(1, plan.currentSegments, 10)).toBe(true);
    expect(phaseInSegments(4, plan.currentSegments, 10)).toBe(false);
    expect(phaseInSegments(4, plan.previousSegments, 10)).toBe(true);
  });

  it("uses PV loop ghost timing independently from waveform sweep completion", () => {
    expect(buildPvLoopDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 14.9,
    }).showPrevious).toBe(true);

    expect(buildPvLoopDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 15,
    }).showPrevious).toBe(false);
  });
});

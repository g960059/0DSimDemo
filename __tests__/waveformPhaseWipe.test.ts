import { describe, expect, it } from "vitest";
import {
  WAVEFORM_ACTIVE_ALPHA,
  WAVEFORM_STALE_ALPHA,
  buildWaveformDrawPlan,
  complementPhaseSegments,
  phaseInSegments,
  phaseSegmentsBetween,
} from "@/components/waveformPhaseWipe";

describe("waveform phase wipe helpers", () => {
  it("builds non-wrapping swept segments", () => {
    expect(phaseSegmentsBetween(12, 15, 10)).toEqual([{ start: 2, end: 5 }]);
    expect(complementPhaseSegments([{ start: 2, end: 5 }], 10)).toEqual([
      { start: 0, end: 2 },
      { start: 5, end: 10 },
    ]);
  });

  it("builds wrapping swept segments", () => {
    const swept = phaseSegmentsBetween(18, 23, 10);

    expect(swept).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 10 },
    ]);
    expect(complementPhaseSegments(swept, 10)).toEqual([{ start: 3, end: 8 }]);
    expect(phaseInSegments(9, swept, 10)).toBe(true);
    expect(phaseInSegments(4, swept, 10)).toBe(false);
  });

  it("marks a full window as complete", () => {
    const plan = buildWaveformDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 20,
      timeWindowSec: 10,
    });

    expect(plan.complete).toBe(true);
    expect(plan.currentAlpha).toBe(WAVEFORM_ACTIVE_ALPHA);
    expect(plan.currentSegments).toEqual([{ start: 0, end: 10 }]);
    expect(plan.previousSegments).toEqual([]);
  });

  it("dims pending current waveform and keeps the marker dim", () => {
    const plan = buildWaveformDrawPlan({
      status: "pending",
      instanceLatestT: 12,
      timeWindowSec: 10,
    });

    expect(plan.currentAlpha).toBe(WAVEFORM_STALE_ALPHA);
    expect(plan.markerAlpha).toBe(WAVEFORM_STALE_ALPHA);
    expect(plan.currentSegments).toEqual([{ start: 0, end: 10 }]);
    expect(plan.previousAlpha).toBe(0);
  });

  it("uses bright current and dim previous during promoted wipe", () => {
    const plan = buildWaveformDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 18 },
      instanceLatestT: 23,
      timeWindowSec: 10,
    });

    expect(plan.complete).toBe(false);
    expect(plan.currentAlpha).toBe(WAVEFORM_ACTIVE_ALPHA);
    expect(plan.previousAlpha).toBe(WAVEFORM_STALE_ALPHA);
    expect(plan.currentSegments).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 10 },
    ]);
    expect(plan.previousSegments).toEqual([{ start: 3, end: 8 }]);
  });
});

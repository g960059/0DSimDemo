import { describe, expect, it } from "vitest";
import {
  pvLoopBufferForDisplay,
  waveformShouldBreakBeforeSample,
} from "@/components/Charts";
import type { SimSample } from "@/engine/protocol";

const sample = (t: number, phi: number): SimSample => ({ t, phi } as SimSample);

describe("phase-aligned replacement chart helpers", () => {
  it("breaks waveform paths only when crossing the replacement boundary", () => {
    const oldSample = sample(1, 10.2);
    const newSample = sample(2, 10.3);

    expect(waveformShouldBreakBeforeSample(null, newSample, 2)).toBe(false);
    expect(waveformShouldBreakBeforeSample(oldSample, newSample, undefined)).toBe(false);
    expect(waveformShouldBreakBeforeSample(oldSample, newSample, 2)).toBe(true);
    expect(waveformShouldBreakBeforeSample(newSample, sample(3, 10.4), 2)).toBe(false);
  });

  it("keeps drawing the old PV loop until a complete new beat is available", () => {
    const oldBeat = [
      sample(0.0, 10.0),
      sample(0.2, 10.4),
      sample(0.4, 10.8),
      sample(0.5, 11.0),
    ];
    const newPartial = [
      sample(0.6, 11.25),
      sample(0.8, 11.5),
    ];

    expect(pvLoopBufferForDisplay([...oldBeat, ...newPartial], 0.6)).toEqual(oldBeat);
  });

  it("switches the PV loop to the new segment once a complete beat is available", () => {
    const oldBeat = [
      sample(0.0, 10.0),
      sample(0.2, 10.4),
      sample(0.4, 10.8),
      sample(0.5, 11.0),
    ];
    const newCompleteBeat = [
      sample(0.6, 11.25),
      sample(0.8, 11.5),
      sample(1.0, 11.9),
      sample(1.1, 12.0),
      sample(1.2, 12.1),
    ];

    expect(pvLoopBufferForDisplay([...oldBeat, ...newCompleteBeat], 0.6)).toEqual(newCompleteBeat);
  });
});

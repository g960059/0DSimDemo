import { describe, expect, it } from "vitest";
import { MainWireFixedToneVolumeClosureV2, MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";

function feed(collector: MainWireFixedToneVolumeClosureV2, cycles: number, periodSec = 1,
  drift: (time: number) => number = () => 0) {
  for (let ordinal = 0; ordinal * 0.01 + 0.003 < cycles * periodSec + 0.008; ordinal++) {
    const timeSec = ordinal * 0.01 + 0.003;
    const move = 10 * Math.sin(2 * Math.PI * timeSec / periodSec) + drift(timeSec / periodSec);
    collector.accept({ timeSec, volumesMl: { pulmonary: 100 + move, systemic: 400 - move, coronary: 10 } },
      Math.floor(timeSec / periodSec) * periodSec);
  }
}

describe("fixed-tone reservoir settlement V2", () => {
  it.each([1, 60 / 70])("compares matching phases despite a non-commensurate observation clock: period %s", (period) => {
    const collector = new MainWireFixedToneVolumeClosureV2();
    feed(collector, 5, period);
    expect(collector.converged()).toBe(true);
    expect(collector.maximumRecentRedistributedVolumeMl()).toBeLessThan(0.002);
  });

  it("does not mistake constant TBV for settlement while blood redistributes", () => {
    const collector = new MainWireFixedToneVolumeClosureV2();
    feed(collector, 5, 1, (time) => 1.3 * time);
    expect(collector.converged()).toBe(false);
    expect(collector.maximumRecentRedistributedVolumeMl()).toBeCloseTo(1.3, 7);
  });

  it("requires three consecutive closed comparisons, not two settled-looking beats", () => {
    const collector = new MainWireFixedToneVolumeClosureV2();
    feed(collector, 3);
    expect(collector.converged()).toBe(false);
    expect(collector.maximumRecentRedistributedVolumeMl()).toBe(Infinity);
  });

  it("rejects a period-2 reservoir state even when two-beat closure is exact", () => {
    const collector = new MainWireFixedToneVolumeClosureV2();
    feed(collector, 6, 1, (time) => Math.cos(Math.PI * time));
    expect(collector.converged()).toBe(false);
    expect(collector.maximumRecentRedistributedVolumeMl()).toBeGreaterThan(1.9);
  });

  it("forgets an early transient only after a closed suffix", () => {
    const collector = new MainWireFixedToneVolumeClosureV2();
    feed(collector, 8, 1, (time) => Math.min(time, 3));
    expect(collector.converged()).toBe(true);
  });

  it("fails closed on missing reservoirs, nonfinite data, clock gaps, or future boundaries", () => {
    for (const sample of [
      { timeSec: 1.01, volumesMl: { a: 1, b: NaN } },
      { timeSec: 1.01, volumesMl: { a: 1 } },
      { timeSec: 1.02, volumesMl: { a: 1, b: 2 } },
      { timeSec: 1, volumesMl: { a: 1, b: 2 } },
    ]) {
      const collector = new MainWireFixedToneVolumeClosureV2();
      collector.accept({ timeSec: 1, volumesMl: { a: 1, b: 2 } }, null);
      expect(() => collector.accept(sample, 1)).toThrow();
    }
    const collector = new MainWireFixedToneVolumeClosureV2();
    collector.accept({ timeSec: 1, volumesMl: { a: 1 } }, null);
    expect(() => collector.accept({ timeSec: 1.01, volumesMl: { a: 1 } }, 2)).toThrow();
  });

  it("keeps the fixed-tone budget shorter than the 60-second control hold", () => {
    expect(MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.maximumMeasurementDurationSec).toBeLessThan(60);
    expect(MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.maximumCompleteBeatCount).toBe(50);
  });
});

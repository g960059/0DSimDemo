import { describe, expect, it } from "vitest";
import { measureMainWireEjectionShapeDiagnosticsV1 as measure, measureMainWirePressureReboundsV1 as rebounds } from "@/analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

function samples(pressure: (x: number) => number): Sample[] {
  return Array.from({ length: 103 }, (_, i) => {
    const x = (i - 1) / 100, p = pressure(x);
    return { acceptedTimeSec: i / 500, valveFlowMlPerSec: { AoV: i === 0 || i === 102 ? 0 : 300 },
      chamberVolumeMl: { LV: 150 - 80 * x }, transmuralPressureMmHg: { LV: p },
      absolutePressureMmHg: { LV: p + 5, Ao: p + 1 } } as Sample;
  });
}
describe("ejection shape diagnostics without a clinical curvature gate", () => {
  it("detects a dip before a higher second/global peak without labelling it abnormal", () => {
    const values = [80, 100, 96, 91, 102, 110, 98, 80];
    const m = rebounds(values.map((pressureMmHg, i) => ({ timeSec: i * .04, pressureMmHg })));
    expect(m.maximumDipAndRecoveryMmHg).toBe(9);
    expect(m.excursions).toHaveLength(1);
    expect(m.excursions[0]!.riseMmHg).toBe(19);
    expect(rebounds([80, 90, 100, 95, 80].map((pressureMmHg, timeSec) => ({ pressureMmHg, timeSec }))).excursions).toEqual([]);
  });
  it("records multiple rebound pairs and flat turning points without merging separate dips", () => {
    const values = [100, 100, 90, 90, 95, 95, 85, 96];
    const m = rebounds(values.map((pressureMmHg, timeSec) => ({ pressureMmHg, timeSec })));
    expect(m.excursions.map(p => p.dipAndRecoveryMmHg)).toEqual([5, 10]);
    expect(m.excursions[0]!.peakTimeSec).toBe(0);
    expect(m.excursions[0]!.valleyTimeSec).toBe(2);
    expect(() => rebounds([{ timeSec: 0, pressureMmHg: NaN }, { timeSec: 1, pressureMmHg: 0 }])).toThrow();
  });
  it("does not report inward sag for an outward dome or a straight upper edge", () => {
    expect(measure(samples(x => 80 + 60 * x * (1 - x))).latePvChordDeficitMmHg).toBe(0);
    expect(measure(samples(x => 110 - 10 * x)).latePvChordDeficitMmHg).toBeLessThan(1e-12);
  });
  it("measures the chord deficit in pressure units without mistaking it for a second peak", () => {
    const m = measure(samples(x => 100 - 5 * x + 10 * (x - .7) ** 2));
    expect(m.latePvChordDeficitMmHg).toBeCloseTo(.4, 12);
    expect(m.policy.clinicalThreshold).toBeNull();
    expect(m.LVP.maximumPostPeakReboundMmHg).toBeGreaterThanOrEqual(0);
  });
  it("is invariant to pressure offset and linear volume scaling", () => {
    const raw = samples(x => 100 - 5 * x + 10 * (x - .7) ** 2);
    const changed = raw.map(s => ({ ...s,
      chamberVolumeMl: { ...s.chamberVolumeMl, LV: 20 + 2 * s.chamberVolumeMl.LV },
      transmuralPressureMmHg: { ...s.transmuralPressureMmHg, LV: s.transmuralPressureMmHg.LV + 31 } }));
    expect(measure(changed).latePvChordDeficitMmHg).toBeCloseTo(measure(raw).latePvChordDeficitMmHg, 12);
  });
  it("retains actual temporal rebound as a distinct observation", () => {
    const m = measure(samples(x => 100 + 8 * Math.sin(3 * Math.PI * x)));
    expect(m.LVP.significantPeakCount).toBe(2);
    expect(m.LVP.maximumPostPeakReboundMmHg).toBeGreaterThan(15);
  });
  it("separates elapsed-time phase from expelled-volume phase on nonuniform accepted steps", () => {
    const raw = samples(x => 80 + 60 * x * (1 - x));
    const changed = raw.map((s, i) => ({ ...s, acceptedTimeSec: i === 0 ? 0 : i === 102 ? 1.1
      : .1 + .9 * ((i - 1) / 100) ** 2 }));
    expect(measure(raw).LVP.peakElapsedTimeFraction).toBeCloseTo(.5, 12);
    const m = measure(changed);
    expect(m.LVP.peakElapsedTimeFraction).toBeCloseTo(.25, 12);
    expect(m.LVP.peakExpelledVolumeFraction).toBeCloseTo(.5, 12);
    expect(m.LVP.centralTimePressureRangeFraction).toBeGreaterThan(measure(raw).LVP.centralTimePressureRangeFraction);
    expect(m.latePvChordDeficitMmHg).toBe(measure(raw).latePvChordDeficitMmHg);
  });
  it("rejects truncated, unordered, multi-episode or nonmonotone-volume data", () => {
    const raw = samples(x => 100 + x);
    expect(() => measure(raw.slice(2))).toThrow(/complete/);
    expect(() => measure([...raw].reverse())).toThrow(/chronological/);
    expect(() => measure(raw.map((s, i) => i !== 50 ? s : { ...s,
      valveFlowMlPerSec: { ...s.valveFlowMlPerSec, AoV: 0 } }))).toThrow(/one complete/);
    expect(() => measure(raw.map((s, i) => i !== 50 ? s : { ...s,
      chamberVolumeMl: { ...s.chamberVolumeMl, LV: 500 } }))).toThrow(/decreasing/);
  });
});

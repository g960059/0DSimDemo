import { describe, expect, it } from "vitest";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { readMainWireBaselinePressureFlowV1 as read } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureFlowReadbackV1";

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
function fixture(): Mutable<Beat> {
  // Only the explicitly consumed completed-beat fields are needed by this unit.
  return { startTimeSec: 10, endTimeSec: 11, durationSec: 1,
    pressureSummaries: Object.fromEntries(Object.entries({ PA: 20, PVein: 13, LA: 10, RA: 4 })
      .map(([key, value]) => [key, { timeWeightedMeanMmHg: value }])),
    valveFlowVolumes: { AoV: { forwardVolumeMl: 100, reverseVolumeMl: 0, netVolumeMl: 100 },
      PV: { forwardVolumeMl: 100, reverseVolumeMl: 0, netVolumeMl: 100 } },
    leftVentricularValveEventMetrics: { endDiastolic: { timeSec: 10.1, valveId: "MV",
      event: "valve-closure-zero-flow-crossing", absolutePressureMmHg: 16, transmuralPressureMmHg: 12 } },
  } as Mutable<Beat>;
}

describe("same-beat baseline pressure/flow readback", () => {
  it("separates mean pressure, event EDP, external pressure and the two pulmonary pressure drops", () => {
    const r = read(fixture(), 2);
    expect(r.netCardiacIndexLPerMinPerM2).toBe(3);
    expect(r.netStrokeVolumeIndexMlPerM2).toBe(50);
    expect(r.lvEndDiastolic).toMatchObject({ absolutePressureMmHg: 16, transmuralPressureMmHg: 12,
      externalPressureMmHg: 4, differenceFromMeanLaMmHg: 6 });
    expect(r.effectivePulmonaryLoadWU).toEqual({ paToPulmonaryVein: 7 / 6, pulmonaryVeinToLa: .5, paToLa: 10 / 6 });
    expect(r.physiologicalNormalityClaimed).toBe(false);
  });

  it("does not equate positive-only output with net output in regurgitation", () => {
    const b = fixture();
    b.valveFlowVolumes.AoV = { ...b.valveFlowVolumes.AoV, reverseVolumeMl: 20, netVolumeMl: 80 };
    const r = read(b, 2);
    expect(r.netCardiacIndexLPerMinPerM2).toBe(2.4);
    expect(r.forwardMinusNetCardiacIndexLPerMinPerM2).toBeCloseTo(.6);
    expect(r.pulmonaryMinusSystemicNetFlowLPerMin).toBeCloseTo(1.2);
    expect(r.effectivePulmonaryLoadWU.paToLa).toBe(10 / 6);
  });

  it("leaves missing landmarks and nonforward pulmonary load unavailable", () => {
    const b = fixture();
    b.leftVentricularValveEventMetrics.endDiastolic = null;
    b.valveFlowVolumes.PV = { ...b.valveFlowVolumes.PV, reverseVolumeMl: 100, netVolumeMl: 0 };
    const r = read(b, 2);
    expect(r.lvEndDiastolic).toBeNull();
    expect(Object.values(r.effectivePulmonaryLoadWU)).toEqual([null, null, null]);
  });

  it("rejects malformed observations instead of returning a reassuring partial result", () => {
    for (const bsa of [0, -1, NaN, Infinity]) expect(() => read(fixture(), bsa)).toThrow();
    const broken = [
      (b: any) => { b.durationSec = NaN; },
      (b: any) => { b.endTimeSec = 12; },
      (b: any) => { b.pressureSummaries.PA.timeWeightedMeanMmHg = NaN; },
      (b: any) => { delete b.valveFlowVolumes.PV.netVolumeMl; },
      (b: any) => { b.valveFlowVolumes.AoV.reverseVolumeMl = -1; },
      (b: any) => { b.valveFlowVolumes.PV.netVolumeMl = 99; },
      (b: any) => { b.leftVentricularValveEventMetrics.endDiastolic.valveId = "AoV"; },
      (b: any) => { b.leftVentricularValveEventMetrics.endDiastolic.timeSec = 12; },
    ];
    for (const corrupt of broken) { const b = fixture(); corrupt(b); expect(() => read(b, 2)).toThrow(); }
  });
});

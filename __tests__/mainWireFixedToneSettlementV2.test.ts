import { describe, expect, it } from "vitest";
import { MainWireFixedToneVolumeClosureV2, MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2,
  validMainWireFixedToneSettlementEvidenceV2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { measureMainWireIntegratedModelFormalPreloadEndDiastolicV2,
  mainWireIntegratedModelFormalPreloadLandmarkClosureScoreV2 } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import type { MainWireIntegratedModelCompletedBeatMetricsV3,
  MainWireIntegratedModelVentricularValveEventMetricsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

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

  it("admits only finite completed V2 settlement evidence within the existing bounds", () => {
    const evidence = Object.freeze({ policyId: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2.policyId,
      completedBeatCount: 4, maximumRecentRedistributedVolumeMl: 0.05,
      maximumRecentNormalizedOutputDelta: 0.1, maximumRecentNormalizedLandmarkDelta: 1,
      measurementDurationSec: 54 });
    expect(validMainWireFixedToneSettlementEvidenceV2(evidence)).toBe(true);
    expect(validMainWireFixedToneSettlementEvidenceV2({ ...evidence, completedBeatCount: 50 })).toBe(true);
    expect(validMainWireFixedToneSettlementEvidenceV2({ ...evidence,
      maximumRecentRedistributedVolumeMl: 0, maximumRecentNormalizedOutputDelta: 0,
      maximumRecentNormalizedLandmarkDelta: 0, measurementDurationSec: 0.1 })).toBe(true);
    for (const invalid of [null, undefined, [], "evidence", {},
      { ...evidence, policyId: "old" }, { ...evidence, completedBeatCount: 3 },
      { ...evidence, completedBeatCount: 51 }, { ...evidence, completedBeatCount: 4.5 },
      { ...evidence, maximumRecentRedistributedVolumeMl: 0.05001 },
      { ...evidence, maximumRecentNormalizedOutputDelta: 0.10001 },
      { ...evidence, maximumRecentNormalizedLandmarkDelta: 1.0001 },
      { ...evidence, measurementDurationSec: 0 }, { ...evidence, measurementDurationSec: 54.001 },
    ]) expect(validMainWireFixedToneSettlementEvidenceV2(invalid)).toBe(false);
    for (const key of ["completedBeatCount", "maximumRecentRedistributedVolumeMl",
      "maximumRecentNormalizedOutputDelta", "maximumRecentNormalizedLandmarkDelta", "measurementDurationSec"]) {
      for (const value of [undefined, null, NaN, Infinity, -0.01, "0"])
        expect(validMainWireFixedToneSettlementEvidenceV2({ ...evidence, [key]: value })).toBe(false);
    }
  });
});

describe("formal preload V2 inlet-closure observations", () => {
  it("reads inlet-closure ED volume and transmural pressure, not the maximum-volume sample", () => {
    const beat = inletClosureBeat();
    const exactLandmarks = structuredClone({ left: beat.leftVentricularPressureVolumeLandmarks,
      right: beat.rightVentricularPressureVolumeLandmarks });
    expect(measureMainWireIntegratedModelFormalPreloadEndDiastolicV2(beat)).toEqual({
      left: { volumeMl: 142, pressureMmHg: 8 }, right: { volumeMl: 150, pressureMmHg: 3 },
    });
    expect(beat.leftVentricularPressureVolumeLandmarks).toEqual(exactLandmarks.left);
    expect(beat.rightVentricularPressureVolumeLandmarks).toEqual(exactLandmarks.right);
    expect(exactLandmarks.left.endDiastolic).toEqual({ event: "maximum-volume", volumeMl: 150, pressureMmHg: 2 });
  });

  it.each(["left", "right"] as const)("fails closed without a valid %s inlet closure, with no maximum-volume fallback", (side) => {
    const beat = inletClosureBeat();
    const key = side === "left" ? "leftVentricularValveEventMetrics" : "rightVentricularValveEventMetrics";
    for (const event of [null,
      { ...beat[key].endDiastolic!, valveId: "AoV" as const },
      { ...beat[key].endDiastolic!, volumeMl: 0 },
      { ...beat[key].endDiastolic!, volumeMl: NaN },
      { ...beat[key].endDiastolic!, transmuralPressureMmHg: Infinity },
      { ...beat[key].endDiastolic!, timeSec: NaN },
      { ...beat[key].endDiastolic!, timeSec: beat.startTimeSec - 0.01 },
      { ...beat[key].endDiastolic!, timeSec: beat.endTimeSec + 0.01 },
    ]) {
      expect(() => measureMainWireIntegratedModelFormalPreloadEndDiastolicV2({
        ...beat, [key]: { ...beat[key], endDiastolic: event },
      })).toThrow(/closure ED landmark/);
    }
    expect(() => measureMainWireIntegratedModelFormalPreloadEndDiastolicV2({
      ...beat, endTimeSec: beat.startTimeSec,
    })).toThrow(/complete beat clock/);
  });

  it.each(["left", "right"] as const)("closes the reported %s inlet ED at the unchanged 1 mL and 1 mmHg tolerances", (side) => {
    const previous = inletClosureBeat();
    const key = side === "left" ? "leftVentricularValveEventMetrics" : "rightVentricularValveEventMetrics";
    const current = { ...previous, startTimeSec: 1, endTimeSec: 2,
      leftVentricularValveEventMetrics: { ...previous.leftVentricularValveEventMetrics,
        endDiastolic: { ...previous.leftVentricularValveEventMetrics.endDiastolic!, timeSec: 1.1 } },
      rightVentricularValveEventMetrics: { ...previous.rightVentricularValveEventMetrics,
        endDiastolic: { ...previous.rightVentricularValveEventMetrics.endDiastolic!, timeSec: 1.1 } },
    };
    expect(mainWireIntegratedModelFormalPreloadLandmarkClosureScoreV2(previous, current)).toBe(0);
    for (const field of ["volumeMl", "transmuralPressureMmHg"] as const) {
      for (const delta of [0.5, 1, 1.5]) {
        const changed = { ...current, [key]: { ...current[key],
          endDiastolic: { ...current[key].endDiastolic,
            [field]: current[key].endDiastolic[field] + delta } } };
        expect(mainWireIntegratedModelFormalPreloadLandmarkClosureScoreV2(previous, changed)).toBe(delta);
      }
    }
    const absoluteOnly = { ...current, [key]: { ...current[key],
      endDiastolic: { ...current[key].endDiastolic, absolutePressureMmHg: 999 } } };
    expect(mainWireIntegratedModelFormalPreloadLandmarkClosureScoreV2(previous, absoluteOnly)).toBe(0);
  });

  it("retains the previous maximum-volume and end-systolic landmark closure checks", () => {
    const previous = inletClosureBeat();
    for (const key of ["leftVentricularPressureVolumeLandmarks", "rightVentricularPressureVolumeLandmarks"] as const) {
      for (const phase of ["endDiastolic", "endSystolic"] as const) {
        const current = { ...previous, [key]: { ...previous[key],
          [phase]: { ...previous[key][phase], pressureMmHg: previous[key][phase].pressureMmHg + 2 } } };
        expect(mainWireIntegratedModelFormalPreloadLandmarkClosureScoreV2(previous, current)).toBe(2);
      }
    }
  });
});

// Pure observed-beat fixture: only fields consumed by these analysis readbacks;
// no exact trajectory is executed or exact checkpoint/model data rewritten.
function inletClosureBeat(): MainWireIntegratedModelCompletedBeatMetricsV3 {
  const eventMetrics = (inletValveId: "MV" | "TV", volumeMl: number,
    transmuralPressureMmHg: number): MainWireIntegratedModelVentricularValveEventMetricsV3 => ({
    pressureBasis: "absolute-and-transmural", inletValveId,
    semilunarValveId: inletValveId === "MV" ? "AoV" : "PV",
    endDiastolic: { event: "valve-closure-zero-flow-crossing", valveId: inletValveId,
      timeSec: 0.1, volumeMl, absolutePressureMmHg: transmuralPressureMmHg + 10, transmuralPressureMmHg },
    endSystolic: null, eventDefinedStrokeVolumeMl: null, eventDefinedEjectionFraction01: null,
  });
  return {
    startTimeSec: 0, endTimeSec: 1, durationSec: 1,
    nativeLeftCardiacOutputLPerMin: 5, nativeRightCardiacOutputLPerMin: 5,
    meanLeftAtrialPressureMmHg: 8, meanRightAtrialPressureMmHg: 3, meanAorticPressureMmHg: 90,
    maximumLeftVentricularVolumeMl: 150, minimumLeftVentricularVolumeMl: 60,
    leftVentricularPressureVolumeLandmarks: { pressureBasis: "transmural",
      endDiastolic: { event: "maximum-volume", volumeMl: 150, pressureMmHg: 2 },
      endSystolic: { event: "semilunar-valve-closure", volumeMl: 60, pressureMmHg: 70 } },
    rightVentricularPressureVolumeLandmarks: { pressureBasis: "transmural",
      endDiastolic: { event: "maximum-volume", volumeMl: 160, pressureMmHg: 1 },
      endSystolic: { event: "semilunar-valve-closure", volumeMl: 70, pressureMmHg: 15 } },
    leftVentricularValveEventMetrics: eventMetrics("MV", 142, 8),
    rightVentricularValveEventMetrics: eventMetrics("TV", 150, 3),
  } as MainWireIntegratedModelCompletedBeatMetricsV3;
}

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1,
  buildMainWireCardiacCycleMetricsV1,
  requireMainWireCardiacCyclePresentationIntervalSecV1,
  type MainWireCardiacCycleAcceptedSampleV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";

const DT_SEC = 0.01;

describe("Main Wire station-aware cardiac-cycle metrics V1", () => {
  it("pins its sampling contract to the exact manifest-owned presentation interval", () => {
    expect(requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.002,
    })).toBe(0.002);
    expect(() => requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.004,
    })).toThrow(/requires the exact 2-ms presentation interval/);
  });

  it("derives station-specific gradients, flow timing, Tei-like index, shape, and windowed pressure rates", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1());

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.methodId).toBe(MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID);
    expect(result.source).toMatchObject({
      cycleStartTimeSec: 1,
      cycleEndTimeSec: 2,
      cycleDurationSec: 1,
      timebase: "every-exact-presentation-boundary-no-resampling",
    });
    expect(result.aorticEjection.positiveFlowDurationSec).toBeCloseTo(0.3, 12);
    expect(result.aorticEjection.thresholdDurationSec).toBeCloseTo(0.297, 12);
    expect(result.aorticEjection.forwardVolumeMl).toBeCloseTo(15, 12);
    expect(result.aorticEjection.shapeFactor).toBeCloseTo(4 / 3, 12);
    expect(result.flowEvents.isovolumicContractionTimeSec).toBeCloseTo(0.02, 12);
    expect(result.flowEvents.isovolumicRelaxationTimeSec).toBeCloseTo(0.08, 12);

    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.aorticMeanLocalGradientMmHg]).toBeCloseTo(4, 12);
    expect(result.values[ids.aorticMeanVenaContractaGradientMmHg]).toBeCloseTo(8, 12);
    expect(result.values[ids.leftVentricularEjectionTimeMs]).toBeCloseTo(300, 12);
    expect(result.values[ids.leftVentricularEjectionTimeThresholdMs]).toBeCloseTo(297, 12);
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeCloseTo(20, 12);
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeCloseTo(80, 12);
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeCloseTo(1 / 3, 12);

    for (const [windowSec, maximumOutputId, minimumOutputId] of [
      [0.005, ids.leftVentricularMaximumPressureRate5Ms, ids.leftVentricularMinimumPressureRate5Ms],
      [0.01, ids.leftVentricularMaximumPressureRate10Ms, ids.leftVentricularMinimumPressureRate10Ms],
      [0.02, ids.leftVentricularMaximumPressureRate20Ms, ids.leftVentricularMinimumPressureRate20Ms],
    ] as const) {
      const expectedMaximum = 40 * Math.sin(Math.PI * windowSec) / windowSec;
      expect(Math.abs(result.values[maximumOutputId]! - expectedMaximum))
        .toBeLessThan(0.3);
      expect(Math.abs(result.values[minimumOutputId]! + expectedMaximum))
        .toBeLessThan(0.3);
    }
    const expectedRvMaximum = 10 * Math.sin(Math.PI * 0.01) / 0.01;
    expect(Math.abs(
      result.values[ids.rightVentricularMaximumPressureRate10Ms]!
        - expectedRvMaximum,
    )).toBeLessThan(0.1);
    expect(Math.abs(
      result.values[ids.rightVentricularMinimumPressureRate10Ms]!
        + expectedRvMaximum,
    )).toBeLessThan(0.1);
  });

  it("keeps timing components nullable instead of inventing missing mitral events", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      mitralFlow: () => 0,
    }));

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeNull();
    expect(result.values[ids.leftVentricularEjectionTimeMs]).toBeCloseTo(300, 12);
  });

  it("fails closed when more than one material forward ejection is present", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      aorticFlow: (phase) =>
        triangularPulseV1(phase, 0.2, 0.35, 0.5, 100)
        + triangularPulseV1(phase, 0.65, 0.7, 0.75, 40),
    }));

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "multiple-material-aortic-forward-ejections",
    });
  });

  it("waits for two complete phase boundaries and rejects mixed epochs", () => {
    expect(buildMainWireCardiacCycleMetricsV1(samplesV1().slice(0, 150)))
      .toMatchObject({
        status: "unavailable",
        reason: "insufficient-complete-regular-sinus-cycles",
      });
    const mixed = [...samplesV1()];
    mixed[mixed.length - 1] = Object.freeze({
      ...mixed.at(-1)!,
      inputEpoch: 2,
    });
    expect(() => buildMainWireCardiacCycleMetricsV1(mixed))
      .toThrow(/cross input epochs/);
  });
});

function samplesV1(overrides: Readonly<{
  aorticFlow?: (phase: number) => number;
  mitralFlow?: (phase: number) => number;
}> = {}): readonly MainWireCardiacCycleAcceptedSampleV1[] {
  const sampleCount = Math.round(2.01 / DT_SEC) + 1;
  return Object.freeze(Array.from({ length: sampleCount }, (_, index) => {
    const acceptedTimeSec = index * DT_SEC;
    const phase = normalizedPhaseV1(acceptedTimeSec);
    const aorticFlow = overrides.aorticFlow?.(phase)
      ?? triangularPulseV1(phase, 0.2, 0.35, 0.5, 100);
    const mitralFlow = overrides.mitralFlow?.(phase)
      ?? (phase < 0.18 || phase >= 0.59 ? 40 : 0);
    const inEjection = phase >= 0.2 && phase <= 0.5;
    return Object.freeze({
      inputEpoch: 1,
      acceptedRevision: index,
      acceptedTimeSec,
      values: Object.freeze({
        "rhythm.phase.regular-sinus": phase,
        "hemodynamics.flow.valve.MV": mitralFlow,
        "hemodynamics.flow.valve.AoV": aorticFlow,
        "hemodynamics.pressure.absolute.LV":
          80 + 20 * Math.sin(2 * Math.PI * phase),
        "hemodynamics.pressure.absolute.RV":
          20 + 5 * Math.sin(2 * Math.PI * phase),
        "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV":
          inEjection ? 4 : 0,
        "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV":
          inEjection ? 8 : 0,
      }),
    });
  }));
}

function normalizedPhaseV1(timeSec: number): number {
  const rounded = Math.round(timeSec * 1e12) / 1e12;
  const phase = Math.round(
    (rounded - Math.floor(rounded)) * 1e12,
  ) / 1e12;
  return phase >= 1 - 1e-12 ? 0 : phase;
}

function triangularPulseV1(
  phase: number,
  start: number,
  peak: number,
  end: number,
  maximum: number,
): number {
  if (phase <= start || phase >= end) return 0;
  return phase <= peak
    ? maximum * (phase - start) / (peak - start)
    : maximum * (end - phase) / (end - peak);
}

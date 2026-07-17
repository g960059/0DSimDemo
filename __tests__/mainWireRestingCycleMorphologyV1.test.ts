import { describe, expect, it } from "vitest";

import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime";
import {
  measureMainWireRestingCycleMorphologyV1,
} from "@/engine/scientific/validation";

describe("main-wire resting cycle morphology V1", () => {
  it("uses explicit AV-flow events and reports two sinus-filling peaks", () => {
    const measured = measureMainWireRestingCycleMorphologyV1(cycle());

    expect(measured.la.availability).toBe("available");
    expect(measured.la.eventEvidence).toMatchObject({
      atrialCalciumOnsetPhase01: 0.852,
      eventOwnership:
        "AV-flow-threshold-transitions-plus-release-fixed-prescribed-Ca-onset",
    });
    expect(measured.la.eventEvidence.avValveOpening?.phase01)
      .toBeGreaterThan(0.33);
    expect(measured.la.eventEvidence.avValveClosure?.phase01)
      .toBeGreaterThan(0.93);
    expect(measured.la.avFlowMorphology).toMatchObject({
      significantForwardPeakCount: 2,
      peakCountAcceptanceThresholdApplied: false,
    });
    expect(measured.claim).toMatchObject({
      shapeFittingPerformed: false,
      prescribedCalciumOnsetIsProtocolTimingNotMeasuredActivation: true,
      morphologyAcceptanceThresholdEstablished: false,
    });
  });

  it("flags a third significant AV-flow peak without claiming a calibrated threshold", () => {
    const measured = measureMainWireRestingCycleMorphologyV1(cycle({
      thirdPeak: true,
    }));

    expect(measured.la.avFlowMorphology?.significantForwardPeakCount).toBe(3);
    expect(measured.la.reviewFlags)
      .toContain("more-than-two-significant-av-flow-peaks");
    expect(measured.interpretationStatus).toBe("review-needed");
    expect(measured.la.avFlowMorphology?.peakCountAcceptanceThresholdApplied)
      .toBe(false);
  });

  it("propagates unavailable chamber pressure instead of fabricating PV data", () => {
    const measured = measureMainWireRestingCycleMorphologyV1(cycle({
      unavailableLaIndex: 100,
    }));

    expect(measured.la).toMatchObject({
      availability: "source-signal-unavailable",
      pvTwoLobeTopology: null,
      reservoirConduitOrder: null,
      avFlowMorphology: null,
    });
    expect(measured.la.reviewFlags)
      .toContain("required-source-signal-unavailable");
    expect(measured.interpretationStatus).toBe("review-needed");
    expect(measured.ra.availability).toBe("available");
  });
});

type CycleOptions = Readonly<{
  thirdPeak?: boolean;
  unavailableLaIndex?: number;
}>;

function cycle(
  options: CycleOptions = {},
): readonly MainWireScientificSessionObservationV1[] {
  return Object.freeze(Array.from({ length: 500 }, (_, index) => {
    const unwrappedPhase = (index + 1) / 500;
    const phase = unwrappedPhase === 1 ? 0 : unwrappedPhase;
    const laAvailable = index !== options.unavailableLaIndex;
    const avFlow = fillingFlow(phase, options.thirdPeak ?? false);
    const pvAngle = 2 * Math.PI * phase;
    return Object.freeze({
      observationId: "main-wire-scientific-session-observation-v1" as const,
      sessionId: "main-wire-scientific-session-v1" as const,
      releaseRef: Object.freeze({
        id: "morphology-test-release",
        version: "1.0.0",
        sha256: "c".repeat(64),
      }),
      revision: index + 1,
      acceptedTimeSec: (index + 1) * 0.002,
      source: "accepted-step" as const,
      chamber: Object.freeze({
        LA: chamber(
          45 + 10 * Math.sin(pvAngle),
          laAvailable ? 8 + 3 * Math.sin(2 * pvAngle) : null,
          laAvailable,
        ),
        RA: chamber(
          42 + 8 * Math.sin(pvAngle),
          3 + 1.5 * Math.sin(2 * pvAngle),
        ),
        LV: chamber(90 + 40 * Math.cos(pvAngle), 65 + 55 * Math.cos(pvAngle)),
        RV: chamber(
          112.5 + 37.5 * Math.cos(pvAngle),
          17 + 13 * Math.cos(pvAngle),
        ),
      }),
      vascularPressure: Object.freeze({
        Ao: pressure(80 + 20 * Math.cos(pvAngle)),
        PA: pressure(20 + 10 * Math.cos(pvAngle)),
        PVein: pressure(9 + 2 * Math.cos(pvAngle)),
      }),
      valve: Object.freeze({
        MV: valve(avFlow),
        AoV: valve(80),
        TV: valve(avFlow * 0.9),
        PV: valve(80),
      }),
      pulmonaryVenousFlowMlPerSec: 80,
      pulmonaryVenousFlowAvailability: "available" as const,
      diagnostics: Object.freeze({
        mechanicsResidualNorm: 1e-10,
        mechanicsIterations: 3,
        circulationScaledResidualInfinityNorm: 2e-10,
        maximumContinuityResidualMl: 2e-9,
        totalBloodVolumeErrorMl: 1e-11,
        mechanicsCallbackCount: 5,
        mechanicsCallbackCacheHits: 2,
        commonPericardialExcessPressureMmHg: 0,
      }),
    });
  }));
}

function fillingFlow(phase: number, thirdPeak: boolean): number {
  if (phase < 0.34 || phase > 0.95) return 0;
  const rampUp = smoothstep((phase - 0.34) / 0.04);
  const rampDown = smoothstep((0.95 - phase) / 0.04);
  const gate = Math.min(rampUp, rampDown);
  const e = 260 * gaussian(phase, 0.47, 0.045);
  const a = 220 * gaussian(phase, 0.89, 0.025);
  const extra = thirdPeak ? 120 * gaussian(phase, 0.68, 0.025) : 0;
  return gate * (12 + e + a + extra);
}

function gaussian(value: number, center: number, sigma: number): number {
  const z = (value - center) / sigma;
  return Math.exp(-0.5 * z * z);
}

function smoothstep(value: number): number {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

function chamber(
  volumeMl: number,
  pressureMmHg: number | null,
  available = true,
) {
  return Object.freeze({
    volumeMl,
    absolutePressureMmHg: pressureMmHg,
    transmuralPressureMmHg: pressureMmHg,
    pressureAvailability: available
      ? "available" as const
      : "not-evaluated-at-accepted-state" as const,
  });
}

function pressure(value: number) {
  return Object.freeze({
    absolutePressureMmHg: value,
    pressureAvailability: "available" as const,
  });
}

function valve(flowMlPerSec: number) {
  return Object.freeze({
    flowMlPerSec,
    openingFraction01: flowMlPerSec > 0 ? 1 : 0,
    flowAvailability: "available" as const,
  });
}

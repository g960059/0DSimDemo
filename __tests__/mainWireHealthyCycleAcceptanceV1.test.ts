import { describe, expect, it } from "vitest";

import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime";
import {
  evaluateMainWireHealthyReferenceAcceptanceV1,
  measureMainWireHealthyCycleMetricsV1,
} from "@/engine/scientific/validation";

describe("main-wire healthy cycle acceptance V1", () => {
  it("derives reproducible one-cycle metrics from accepted observations", () => {
    const metrics = measureMainWireHealthyCycleMetricsV1(healthyCycle());

    expect(metrics.metrics["cycle.sample_count"].value).toBe(500);
    expect(metrics.metrics["cycle.duration_sec"].value).toBeCloseTo(1, 12);
    expect(metrics.metrics[
      "hemodynamics.lv.edv_index_ml_per_m2"
    ].value).toBeCloseTo(130 / 1.9, 10);
    expect(metrics.metrics[
      "hemodynamics.lv.esv_index_ml_per_m2"
    ].value).toBeCloseTo(50 / 1.9, 10);
    expect(metrics.metrics[
      "hemodynamics.lv.ejection_fraction_01"
    ].value).toBeCloseTo(80 / 130, 10);
    expect(metrics.metrics[
      "hemodynamics.aortic.net_stroke_volume_index_ml_per_m2"
    ].value).toBeCloseTo(80 / 1.9, 10);
    expect(metrics.metrics[
      "hemodynamics.aortic.cardiac_index_l_per_min_per_m2"
    ].value).toBeCloseTo(80 * 60 / 1000 / 1.9, 10);
    expect(metrics.evidence).toEqual({
      source: "accepted-scientific-session-observations",
      completeUniformCycleRequired: true,
      smoothingApplied: false,
      parameterFittingPerformed: false,
    });
  });

  it("keeps broad physiology and numerical-integrity results separate", () => {
    const accepted = evaluateMainWireHealthyReferenceAcceptanceV1(
      healthyCycle(),
    );

    expect(accepted.overallStatus).toBe("pass");
    expect(accepted.physiologyStatus).toBe("pass");
    expect(accepted.numericalIntegrityStatus).toBe("pass");
    expect(accepted.gateResults.every(({ status }) => status === "pass"))
      .toBe(true);
    expect(accepted.claim.passingDoesNotClaimClinicalValidation).toBe(true);
    expect(accepted.deferredAcceptance).toContain(
      "HR-preload-afterload-PVR-inotropy-lusitropy-envelope",
    );
  });

  it("flags a reference miss without relabeling numerical integrity", () => {
    const observations = healthyCycle({
      lvVolume: (phase) => 115 + 55 * Math.cos(2 * Math.PI * phase),
      paPressure: (phase) => 25 + 15 * Math.cos(2 * Math.PI * phase),
    });
    const accepted = evaluateMainWireHealthyReferenceAcceptanceV1(
      observations,
    );

    expect(accepted.overallStatus).toBe("fail");
    expect(accepted.physiologyStatus).toBe("fail");
    expect(accepted.numericalIntegrityStatus).toBe("pass");
    expect(gateStatus(accepted, "healthy.lv.edvi")).toBe("fail");
    expect(gateStatus(
      accepted,
      "healthy.pulmonary_artery.systolic",
    )).toBe("fail");
  });

  it("reports unavailable accepted-step signals as incomplete, never zero", () => {
    const observations = healthyCycle({ unavailableLaIndex: 10 });
    const accepted = evaluateMainWireHealthyReferenceAcceptanceV1(
      observations,
    );

    expect(accepted.overallStatus).toBe("incomplete");
    expect(accepted.physiologyStatus).toBe("incomplete");
    expect(accepted.metrics.metrics[
      "hemodynamics.pressure.left_atrium.mean_mmhg"
    ]).toMatchObject({
      value: null,
      availability: "source-signal-unavailable",
    });
    expect(gateStatus(accepted, "healthy.left_atrium.mean"))
      .toBe("unavailable");
  });

  it("rejects structurally incomplete, mixed-release, or nonuniform evidence", () => {
    expect(() => measureMainWireHealthyCycleMetricsV1(healthyCycle().slice(1)))
      .toThrow(/complete 1 s cycle/);

    const mixed = [...healthyCycle()];
    mixed[100] = Object.freeze({
      ...mixed[100]!,
      releaseRef: Object.freeze({
        ...mixed[100]!.releaseRef,
        sha256: "b".repeat(64),
      }),
    });
    expect(() => measureMainWireHealthyCycleMetricsV1(mixed))
      .toThrow(/mix simulation releases/);

    const skipped = [...healthyCycle()];
    skipped[100] = Object.freeze({
      ...skipped[100]!,
      revision: skipped[99]!.revision + 2,
    });
    expect(() => measureMainWireHealthyCycleMetricsV1(skipped))
      .toThrow(/not revision-contiguous/);
  });
});

type CycleOptions = Readonly<{
  lvVolume?: (phase01: number) => number;
  paPressure?: (phase01: number) => number;
  unavailableLaIndex?: number;
}>;

function healthyCycle(
  options: CycleOptions = {},
): readonly MainWireScientificSessionObservationV1[] {
  const dtSec = 0.002;
  return Object.freeze(Array.from({ length: 500 }, (_, index) => {
    const phase01 = (index + 1) / 500;
    const wave = Math.cos(2 * Math.PI * phase01);
    const laAvailable = index !== options.unavailableLaIndex;
    return Object.freeze({
      observationId: "main-wire-scientific-session-observation-v1" as const,
      sessionId: "main-wire-scientific-session-v1" as const,
      releaseRef: Object.freeze({
        id: "test-release",
        version: "1.0.0",
        sha256: "a".repeat(64),
      }),
      revision: index + 1,
      acceptedTimeSec: (index + 1) * dtSec,
      source: "accepted-step" as const,
      chamber: Object.freeze({
        LA: chamber(
          45 + 10 * wave,
          laAvailable ? 8 + 2 * wave : null,
          laAvailable,
        ),
        LV: chamber(
          options.lvVolume?.(phase01) ?? 90 + 40 * wave,
          65 + 55 * wave,
        ),
        RA: chamber(45 + 8 * wave, 3 + wave),
        RV: chamber(112.5 + 37.5 * wave, 17 + 13 * wave),
      }),
      vascularPressure: Object.freeze({
        Ao: pressure(80 + 20 * wave),
        PA: pressure(options.paPressure?.(phase01) ?? 20 + 10 * wave),
        PVein: pressure(9 + 2 * wave),
      }),
      valve: Object.freeze({
        MV: valve(80),
        AoV: valve(80),
        TV: valve(80),
        PV: valve(80),
      }),
      pulmonaryVenousFlowMlPerSec: 80,
      pulmonaryVenousFlowAvailability: "available" as const,
      diagnostics: Object.freeze({
        mechanicsResidualNorm: 1e-10,
        mechanicsIterations: 3,
        circulationScaledResidualInfinityNorm: 2e-10,
        maximumContinuityResidualMl: -2e-9,
        totalBloodVolumeErrorMl: 1e-11,
        mechanicsCallbackCount: 5,
        mechanicsCallbackCacheHits: 2,
        commonPericardialExcessPressureMmHg: 0,
      }),
    });
  }));
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
    openingFraction01: 1,
    flowAvailability: "available" as const,
  });
}

function gateStatus(
  acceptance: ReturnType<typeof evaluateMainWireHealthyReferenceAcceptanceV1>,
  gateId: string,
) {
  return acceptance.gateResults.find((gate) => gate.gateId === gateId)?.status;
}

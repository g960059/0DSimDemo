import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchTerminalCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";
import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1,
  deriveMainWireScientificMetricsV1,
  type MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type MainWireScientificObservableValueV1,
} from "@/engine/scientific/observables";
import type { SimulationReleaseRef } from "@/engine/scientific/release";

const RELEASE = Object.freeze({
  id: "circleheart-main-wire-adult-five-wall-noncoronary",
  version: "0.2.0",
  sha256: "7".repeat(64),
}) satisfies SimulationReleaseRef;

describe("main-wire scientific derived metric registry V1", () => {
  it("publishes immutable versioned derivation, dependency, and unit metadata", () => {
    expect(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1).toMatchObject({
      registryId: "main-wire-scientific-derived-metric-registry-v1",
      schemaVersion: 1,
      derivationVersion: 1,
      inputFrameId: "main-wire-scientific-observable-frame-v1",
      inputCycleContractId: "main-wire-scientific-validated-terminal-cycle-v1",
      unavailableValuePolicy: "null-never-zero",
      availabilityAndQualityAreSeparate: true,
      periodicBoundaryCompletionPolicy: {
        appliesOnlyWhen: "validated-P1-cycle-first-frame-is-exact-checkpoint-restore-and-only-that-accepted-step-readback-is-not-evaluated",
        replacement: "measured-final-accepted-same-phase-sample-from-the-same-validated-cycle",
        interpolationOrSmoothingApplied: false,
      },
    });
    expect(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1).toHaveLength(44);
    expect(new Set(
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => metricId),
    ).size).toBe(44);
    expect(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metricId: "hemodynamics.pressure.mean.LA",
          unit: "mmHg",
          derivationId: "trapezoidal-time-weighted-mean-v1",
          derivationVersion: 1,
          dependencies: ["hemodynamics.pressure.absolute.LA"],
        }),
        expect.objectContaining({
          metricId: "valve.AoV.cycle_volume.forward",
          unit: "mL",
          derivationId: "piecewise-linear-positive-flow-integral-v1",
          dependencies: ["valve.AoV.flow"],
        }),
        expect.objectContaining({
          metricId: "hemodynamics.pressure.systolic.Ao",
          unit: "mmHg",
          derivationId: "cycle-sample-maximum-v1",
          dependencies: ["hemodynamics.pressure.absolute.Ao"],
        }),
        expect.objectContaining({
          metricId: "valve.MV.cycle_volume.reverse",
          unit: "mL",
          derivationId: "piecewise-linear-negative-flow-magnitude-integral-v1",
          dependencies: ["valve.MV.flow"],
        }),
        expect.objectContaining({
          metricId: "valve.TV.regurgitant_fraction",
          unit: "%",
          derivationId: "same-valve-reverse-over-forward-percent-v1",
          dependencies: ["valve.TV.flow"],
        }),
        expect.objectContaining({
          metricId: "valve.PV.gradient.forward_mean",
          unit: "mmHg",
          derivationId: "positive-flow-time-weighted-pressure-gradient-v1",
          dependencies: [
            "valve.PV.flow",
            "hemodynamics.pressure.absolute.RV",
            "hemodynamics.pressure.absolute.PA",
          ],
        }),
      ]),
    );
    expect(Object.isFrozen(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1)).toBe(true);
  });

  it("derives systemic/pulmonary pressure extrema and biventricular EDV/ESV from accepted frames", () => {
    const result = deriveMainWireScientificMetricsV1(validatedCycle());

    expect(result.cycleAvailability).toBe("validated");
    expect(result.releaseRef).toEqual(RELEASE);
    expect(result.values["hemodynamics.pressure.mean.LA"]).toMatchObject({
      value: expect.closeTo(10, 10),
      availability: "available",
      quality: "accepted-derived",
      unavailableReason: null,
    });
    expect(result.values["hemodynamics.pressure.mean.RA"].value).toBeCloseTo(5, 10);
    expect(result.values["hemodynamics.pressure.mean.Ao"].value).toBeCloseTo(90, 10);
    expect(result.values["hemodynamics.pressure.mean.PA"].value).toBeCloseTo(15, 10);
    expect(result.values["hemodynamics.pressure.mean.PVein"].value).toBeCloseTo(12, 10);
    expect(result.values["hemodynamics.pressure.systolic.Ao"].value).toBeCloseTo(100, 10);
    expect(result.values["hemodynamics.pressure.diastolic.Ao"].value).toBeCloseTo(80, 10);
    expect(result.values["hemodynamics.pressure.pulse.Ao"].value).toBeCloseTo(20, 10);
    expect(result.values["hemodynamics.pressure.systolic.PA"].value).toBeCloseTo(20, 10);
    expect(result.values["hemodynamics.pressure.diastolic.PA"].value).toBeCloseTo(10, 10);

    expect(result.values["hemodynamics.volume.end_diastolic.LV"].value).toBeCloseTo(120, 10);
    expect(result.values["hemodynamics.volume.end_systolic.LV"].value).toBeCloseTo(80, 10);
    expect(result.values["hemodynamics.volume.excursion.LV"].value).toBeCloseTo(40, 10);
    expect(result.values["hemodynamics.ejection_fraction.LV"].value).toBeCloseTo(
      100 / 3,
      10,
    );
    expect(result.values["hemodynamics.volume.end_diastolic.RV"].value).toBeCloseTo(130, 10);
    expect(result.values["hemodynamics.volume.end_systolic.RV"].value).toBeCloseTo(100, 10);
    expect(result.values["hemodynamics.volume.excursion.RV"].value).toBeCloseTo(30, 10);
    expect(result.values["hemodynamics.ejection_fraction.RV"].value).toBeCloseTo(
      300 / 13,
      10,
    );

  });

  it("closes only an unevaluated exact-restore boundary with the measured same-phase terminal sample", () => {
    const cycle = validatedCycle();
    const frames = [...cycle.frames];
    const boundaryDependencies = [
      "hemodynamics.pressure.absolute.LA",
      "hemodynamics.pressure.absolute.RA",
      "hemodynamics.pressure.absolute.LV",
      "hemodynamics.pressure.absolute.RV",
      "hemodynamics.pressure.absolute.Ao",
      "hemodynamics.pressure.absolute.PA",
      "hemodynamics.pressure.absolute.PVein",
      "valve.MV.flow",
      "valve.AoV.flow",
      "valve.TV.flow",
      "valve.PV.flow",
    ] as const satisfies readonly MainWireScientificObservableIdV1[];
    for (const observableId of boundaryDependencies) {
      frames[0] = replaceObservable(
        frames[0]!,
        observableId,
        Object.freeze({
          observableId,
          value: null,
          availability: "not-evaluated-at-accepted-state",
          quality: "not-assessed",
        }),
      );
    }

    const result = deriveMainWireScientificMetricsV1({ ...cycle, frames });

    expect(result.values["hemodynamics.pressure.mean.Ao"]).toMatchObject({
      availability: "available",
      value: expect.closeTo(90, 10),
      periodicBoundaryCompletionApplied: true,
    });
    expect(result.values["valve.AoV.cycle_volume.forward"]).toMatchObject({
      availability: "available",
      periodicBoundaryCompletionApplied: true,
    });
    expect(result.values["valve.AoV.gradient.forward_mean"]).toMatchObject({
      availability: "available",
      periodicBoundaryCompletionApplied: true,
    });
    expect(result.values["hemodynamics.volume.end_diastolic.LV"]).toMatchObject({
      availability: "available",
      periodicBoundaryCompletionApplied: false,
    });
  });

  it("does not boundary-complete accepted-state observables or a cycle without explicit P1 evidence", () => {
    const cycle = validatedCycle();
    const frames = [...cycle.frames];
    frames[0] = replaceObservable(
      frames[0]!,
      "hemodynamics.volume.LV",
      Object.freeze({
        observableId: "hemodynamics.volume.LV",
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      }),
    );
    const acceptedStateMissing = deriveMainWireScientificMetricsV1({
      ...cycle,
      frames,
    });
    expect(acceptedStateMissing.values["hemodynamics.volume.end_diastolic.LV"])
      .toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
        periodicBoundaryCompletionApplied: false,
      });

    const unclassified = deriveMainWireScientificMetricsV1({
      ...cycle,
      evidence: {
        ...cycle.evidence,
        periodicOrbitClassifiedP1: false,
      },
    } as unknown as MainWireScientificValidatedTerminalCycleV1);
    expect(unclassified.cycleAvailability).toBe("unavailable");
    expect(unclassified.cycleUnavailableReason).toBe(
      "validated terminal-cycle evidence is incomplete",
    );
  });

  it("integrates forward, reverse, and net volumes and same-valve regurgitant fraction for all four valves", () => {
    const amplitudes = {
      MV: 100,
      AoV: 80,
      TV: 60,
      PV: 40,
    } as const;
    const result = deriveMainWireScientificMetricsV1(validatedCycle(
      Object.fromEntries(Object.entries(amplitudes).map(([valveId, amplitude]) => [
        `valve.${valveId}.flow`,
        (phaseSec: number) => amplitude / 2
          + amplitude * Math.sin(2 * Math.PI * phaseSec),
      ])) as ObservableOverrides,
    ));

    for (const [valveId, amplitude] of Object.entries(amplitudes)) {
      const forward = analyticalPositiveSineOffsetIntegral(amplitude, amplitude / 2);
      const net = amplitude / 2;
      const reverse = forward - net;
      const prefix = `valve.${valveId}` as const;
      expect(result.values[`${prefix}.cycle_volume.forward`].value)
        .toBeCloseTo(forward, 3);
      expect(result.values[`${prefix}.cycle_volume.reverse`].value)
        .toBeCloseTo(reverse, 3);
      expect(result.values[`${prefix}.cycle_volume.net`].value)
        .toBeCloseTo(net, 10);
      expect(result.values[`${prefix}.regurgitant_fraction`].value)
        .toBeCloseTo(100 * reverse / forward, 3);
    }

    expect(result.values["valve.AoV.cardiac_output.net"].value)
      .toBeCloseTo(2.4, 10);
    expect(result.values["valve.PV.cardiac_output.net"].value)
      .toBeCloseTo(1.2, 10);
  });

  it("gates invasive forward gradients by positive flow for all four valves", () => {
    const flow = (phaseSec: number) => 20 + 40 * Math.sin(2 * Math.PI * phaseSec);
    const result = deriveMainWireScientificMetricsV1(validatedCycle({
      "valve.MV.flow": flow,
      "valve.AoV.flow": flow,
      "valve.TV.flow": flow,
      "valve.PV.flow": flow,
      "hemodynamics.pressure.absolute.LA": () => 100,
      "hemodynamics.pressure.absolute.LV": () => 92,
      "hemodynamics.pressure.absolute.Ao": () => 80,
      "hemodynamics.pressure.absolute.RA": () => 29,
      "hemodynamics.pressure.absolute.RV": () => 25,
      "hemodynamics.pressure.absolute.PA": () => 20,
    }));

    for (const [valveId, expectedGradient] of [
      ["MV", 8],
      ["AoV", 12],
      ["TV", 4],
      ["PV", 5],
    ] as const) {
      expect(result.values[`valve.${valveId}.gradient.forward_peak`]).toMatchObject({
        value: expect.closeTo(expectedGradient, 10),
        availability: "available",
        quality: "accepted-derived",
      });
      expect(result.values[`valve.${valveId}.gradient.forward_mean`].value)
        .toBeCloseTo(expectedGradient, 10);
    }
  });

  it("returns null, not a synthetic zero, for every metric without a validated complete cycle", () => {
    const missing = deriveMainWireScientificMetricsV1(null);
    expect(missing.cycleAvailability).toBe("unavailable");
    expect(Object.values(missing.values)).toHaveLength(44);
    expect(Object.values(missing.values).every((entry) => (
      entry.value === null
      && entry.availability === "not-converged"
      && entry.quality === "not-assessed"
      && entry.unavailableReason === "validated-complete-cycle-required"
    ))).toBe(true);

    const cycle = validatedCycle();
    const altered = {
      ...cycle,
      frames: cycle.frames.slice(1),
    } satisfies MainWireScientificValidatedTerminalCycleV1;
    const rejected = deriveMainWireScientificMetricsV1(altered);
    expect(rejected.cycleAvailability).toBe("unavailable");
    expect(rejected.cycleUnavailableReason).toMatch(/expected 501/);
    expect(rejected.values["valve.AoV.cycle_volume.net"].value).toBeNull();
  });

  it("preserves dependency unavailability without suppressing independent metrics", () => {
    const cycle = validatedCycle();
    const frames = [...cycle.frames];
    frames[200] = replaceObservable(
      frames[200]!,
      "valve.AoV.flow",
      Object.freeze({
        observableId: "valve.AoV.flow",
        value: null,
        availability: "not-measurable",
        quality: "not-assessed",
      }),
    );
    const result = deriveMainWireScientificMetricsV1({ ...cycle, frames });

    for (const metricId of [
      "valve.AoV.cycle_volume.forward",
      "valve.AoV.cycle_volume.reverse",
      "valve.AoV.cycle_volume.net",
      "valve.AoV.cardiac_output.net",
      "valve.AoV.regurgitant_fraction",
      "valve.AoV.gradient.forward_peak",
      "valve.AoV.gradient.forward_mean",
    ] as const) {
      expect(result.values[metricId]).toMatchObject({
        value: null,
        availability: "not-measurable",
        quality: "not-assessed",
        unavailableReason: "dependency-unavailable",
        unavailableDependency: "valve.AoV.flow",
      });
    }
    expect(result.values["hemodynamics.pressure.mean.LA"].availability).toBe("available");
    expect(result.values["valve.PV.cardiac_output.net"].availability).toBe("available");
  });

  it("fails only pressure-dependent gradients closed when a pressure dependency is unavailable", () => {
    const cycle = validatedCycle();
    const frames = [...cycle.frames];
    frames[200] = replaceObservable(
      frames[200]!,
      "hemodynamics.pressure.absolute.LV",
      Object.freeze({
        observableId: "hemodynamics.pressure.absolute.LV",
        value: null,
        availability: "not-measurable",
        quality: "not-assessed",
      }),
    );
    const result = deriveMainWireScientificMetricsV1({ ...cycle, frames });

    for (const metricId of [
      "valve.AoV.gradient.forward_peak",
      "valve.AoV.gradient.forward_mean",
    ] as const) {
      expect(result.values[metricId]).toMatchObject({
        value: null,
        availability: "not-measurable",
        quality: "not-assessed",
        unavailableReason: "dependency-unavailable",
        unavailableDependency: "hemodynamics.pressure.absolute.LV",
      });
    }
    expect(result.values["valve.AoV.cycle_volume.forward"].availability)
      .toBe("available");
    expect(result.values["hemodynamics.pressure.mean.Ao"].availability)
      .toBe("available");
  });

  it("reports ratio and gradient metrics as not measurable without forward flow", () => {
    const result = deriveMainWireScientificMetricsV1(validatedCycle({
      "valve.MV.flow": () => -10,
    }));

    expect(result.values["valve.MV.cycle_volume.reverse"]).toMatchObject({
      value: expect.closeTo(10, 10),
      availability: "available",
    });
    for (const metricId of [
      "valve.MV.regurgitant_fraction",
      "valve.MV.gradient.forward_peak",
      "valve.MV.gradient.forward_mean",
    ] as const) {
      expect(result.values[metricId]).toMatchObject({
        value: null,
        availability: "not-measurable",
        quality: "not-assessed",
        unavailableReason: "invalid-derived-denominator",
        unavailableDependency: "valve.MV.flow",
      });
    }
  });

  it("fails a malformed available dependency closed instead of coercing it", () => {
    const cycle = validatedCycle();
    const frames = [...cycle.frames];
    frames[10] = replaceObservable(
      frames[10]!,
      "hemodynamics.pressure.absolute.LA",
      Object.freeze({
        observableId: "hemodynamics.pressure.absolute.LA",
        value: null,
        availability: "available",
        quality: "accepted-derived",
      }),
    );
    const result = deriveMainWireScientificMetricsV1({ ...cycle, frames });
    expect(result.values["hemodynamics.pressure.mean.LA"]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
      quality: "not-assessed",
      unavailableReason: "dependency-contract-invalid",
    });
  });
});

type ObservableValueFactory = (phaseSec: number) => number;
type ObservableOverrides = Partial<Record<
  MainWireScientificObservableIdV1,
  ObservableValueFactory
>>;

function validatedCycle(
  overrides: ObservableOverrides = {},
): ReturnType<typeof assembleScientificWorkbenchTerminalCycleV1> {
  const frames = Array.from(
    { length: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.expectedObservableSampleCount },
    (_, index) => frame(
      10_000 + index,
      20 + index * SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      index === 0 ? "exact-checkpoint-restore" : "accepted-step",
      overrides,
    ),
  );
  return assembleScientificWorkbenchTerminalCycleV1(frames[0]!, frames.slice(1));
}

function frame(
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificObservableFrameV1["source"],
  overrides: ObservableOverrides,
): MainWireScientificObservableFrameV1 {
  const phaseSec = acceptedTimeSec - 20;
  const omega = 2 * Math.PI * phaseSec;
  const sourceValues: Partial<Record<MainWireScientificObservableIdV1, number>> = {
    "hemodynamics.pressure.absolute.LA": 10 + 2 * Math.sin(omega),
    "hemodynamics.pressure.absolute.RA": 5 + Math.sin(omega),
    "hemodynamics.pressure.absolute.LV": 100 + 15 * Math.sin(omega),
    "hemodynamics.pressure.absolute.RV": 25 + 5 * Math.sin(omega),
    "hemodynamics.pressure.absolute.Ao": 90 + 10 * Math.sin(omega),
    "hemodynamics.pressure.absolute.PA": 15 + 5 * Math.sin(omega),
    "hemodynamics.pressure.absolute.PVein": 12 + 2 * Math.sin(omega),
    "hemodynamics.volume.LV": 100 + 20 * Math.cos(omega),
    "hemodynamics.volume.RV": 115 + 15 * Math.cos(omega),
    "valve.MV.flow": 50 + 100 * Math.sin(omega),
    "valve.AoV.flow": 100 * Math.sin(omega),
    "valve.TV.flow": 40 + 80 * Math.sin(omega),
    "valve.PV.flow": 80 + 20 * Math.sin(omega),
  };
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((entry) => {
      const value = overrides[entry.observableId]?.(phaseSec)
        ?? sourceValues[entry.observableId]
        ?? 0;
      return [
        entry.observableId,
        entry.modelingStatus === "not-modeled"
          ? Object.freeze({
              observableId: entry.observableId,
              value: null,
              availability: "not-modeled" as const,
              quality: "not-assessed" as const,
            })
          : Object.freeze({
              observableId: entry.observableId,
              value,
              availability: "available" as const,
              quality: "accepted-derived" as const,
            }),
      ];
    }),
  ) as MainWireScientificObservableFrameV1["values"];
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: RELEASE,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source,
    revision,
    acceptedTimeSec,
    values: Object.freeze(values),
  });
}

function analyticalPositiveSineOffsetIntegral(
  amplitude: number,
  offset: number,
): number {
  const zeroAngle = Math.asin(offset / amplitude);
  return (
    offset * (Math.PI + 2 * zeroAngle)
    + 2 * amplitude * Math.cos(zeroAngle)
  ) / (2 * Math.PI);
}

function replaceObservable(
  frameValue: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
  replacement: MainWireScientificObservableValueV1,
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    ...frameValue,
    values: Object.freeze({
      ...frameValue.values,
      [observableId]: replacement,
    }),
  });
}

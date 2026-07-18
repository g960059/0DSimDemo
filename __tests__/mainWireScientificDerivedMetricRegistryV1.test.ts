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
    });
    expect(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1).toHaveLength(16);
    expect(new Set(
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => metricId),
    ).size).toBe(16);
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
          metricId: "valve.AoV.cycle_volume.net",
          unit: "mL",
          derivationId: "trapezoidal-net-flow-integral-v1",
          dependencies: ["valve.AoV.flow"],
        }),
      ]),
    );
    expect(Object.isFrozen(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1)).toBe(true);
  });

  it("derives pressure, ventricular, and distinct forward/net flow metrics from accepted frames", () => {
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

    expect(result.values["hemodynamics.volume.excursion.LV"].value).toBeCloseTo(40, 10);
    expect(result.values["hemodynamics.ejection_fraction.LV"].value).toBeCloseTo(
      100 / 3,
      10,
    );
    expect(result.values["hemodynamics.volume.excursion.RV"].value).toBeCloseTo(30, 10);
    expect(result.values["hemodynamics.ejection_fraction.RV"].value).toBeCloseTo(
      300 / 13,
      10,
    );

    const aorticForward = result.values["valve.AoV.cycle_volume.forward"];
    const aorticNet = result.values["valve.AoV.cycle_volume.net"];
    expect(aorticForward.value).toBeCloseTo(100 / Math.PI, 3);
    expect(aorticNet.value).toBeCloseTo(0, 10);
    expect(result.values["valve.AoV.cardiac_output.forward"].value).toBeCloseTo(
      6 / Math.PI,
      3,
    );
    expect(result.values["valve.AoV.cardiac_output.net"].value).toBeCloseTo(0, 10);

    expect(result.values["valve.PV.cycle_volume.forward"].value).toBeCloseTo(80, 10);
    expect(result.values["valve.PV.cycle_volume.net"].value).toBeCloseTo(80, 10);
    expect(result.values["valve.PV.cardiac_output.forward"].value).toBeCloseTo(4.8, 10);
    expect(result.values["valve.PV.cardiac_output.net"].value).toBeCloseTo(4.8, 10);
  });

  it("returns null, not a synthetic zero, for every metric without a validated complete cycle", () => {
    const missing = deriveMainWireScientificMetricsV1(null);
    expect(missing.cycleAvailability).toBe("unavailable");
    expect(Object.values(missing.values)).toHaveLength(16);
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
      "valve.AoV.cycle_volume.net",
      "valve.AoV.cardiac_output.forward",
      "valve.AoV.cardiac_output.net",
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

function validatedCycle(): ReturnType<typeof assembleScientificWorkbenchTerminalCycleV1> {
  const frames = Array.from(
    { length: SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.expectedObservableSampleCount },
    (_, index) => frame(
      10_000 + index,
      20 + index * SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      index === 0 ? "exact-checkpoint-restore" : "accepted-step",
    ),
  );
  return assembleScientificWorkbenchTerminalCycleV1(frames[0]!, frames.slice(1));
}

function frame(
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificObservableFrameV1["source"],
): MainWireScientificObservableFrameV1 {
  const phaseSec = acceptedTimeSec - 20;
  const omega = 2 * Math.PI * phaseSec;
  const sourceValues: Partial<Record<MainWireScientificObservableIdV1, number>> = {
    "hemodynamics.pressure.absolute.LA": 10 + 2 * Math.sin(omega),
    "hemodynamics.pressure.absolute.RA": 5 + Math.sin(omega),
    "hemodynamics.pressure.absolute.Ao": 90 + 10 * Math.sin(omega),
    "hemodynamics.pressure.absolute.PA": 15 + 5 * Math.sin(omega),
    "hemodynamics.volume.LV": 100 + 20 * Math.cos(omega),
    "hemodynamics.volume.RV": 115 + 15 * Math.cos(omega),
    "valve.AoV.flow": 100 * Math.sin(omega),
    "valve.PV.flow": 80 + 20 * Math.sin(omega),
  };
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((entry) => {
      const value = sourceValues[entry.observableId] ?? 0;
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

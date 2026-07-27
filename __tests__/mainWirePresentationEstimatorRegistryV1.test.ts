import { describe, expect, it, vi } from "vitest";

import {
  projectRuntimePresentationSampleToMainWireScientificObservableFrameV1,
} from "@/components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1";
import {
  deriveMainWireScientificTransientBeatMetricsV1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  type MainWireScientificCompleteTransientBeatV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import type { SimulationReleaseRef } from "@/engine/scientific/release";
import {
  createMainWirePresentationBeatAccumulatorV1,
  MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_SNAPSHOT_V1,
} from "@/studio/adapters/mainWire";
import type {
  RuntimePresentationSampleV1,
} from "@/studio/contracts/v1";

const RELEASE_V1 = Object.freeze({
  id: "presentation-estimator-parity",
  version: "1.0.0",
  sha256: "e".repeat(64),
}) satisfies SimulationReleaseRef;

const METRIC_DEPENDENCIES_V1 = Object.freeze([
  ...new Set(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.flatMap(
      ({ dependencies }) => dependencies,
    ),
  ),
]);

describe("MainWire presentation estimator registry V1", () => {
  it("matches the prior stride-1 formulas while retaining weaker evidence", () => {
    const onSampleUpdate = vi.fn();
    const onBeatFinalized = vi.fn();
    const accumulator = createMainWirePresentationBeatAccumulatorV1({
      onSampleUpdate,
      onBeatFinalized,
    });
    const samples = Array.from(
      { length: 501 },
      (_, ordinal) => presentationSampleV1(ordinal),
    );

    let estimate = null;
    for (const sample of samples) {
      estimate = accumulator.update(sample);
    }
    expect(estimate).not.toBeNull();

    const exactTestBeat = Object.freeze({
      frames: Object.freeze(samples.map((sample) =>
        projectRuntimePresentationSampleToMainWireScientificObservableFrameV1({
          sample,
          releaseRef: RELEASE_V1,
        }))),
      releaseRef: RELEASE_V1,
      durationSec: 1,
      evidence: Object.freeze({
        exactReleaseRefUniform: true as const,
        revisionsContiguous: true as const,
        cadenceUniform: true as const,
        bothBeatBoundariesMeasured: true as const,
        transientBeatFullyMeasured: true as const,
        smoothingOrInterpolationApplied: false as const,
      }),
    }) satisfies MainWireScientificCompleteTransientBeatV1;
    const prior = deriveMainWireScientificTransientBeatMetricsV1(
      exactTestBeat,
    );

    for (const { metricId } of
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1) {
      const estimatedMetric = estimate!.values[metricId]!;
      const priorMetric = prior.values[metricId];
      expect(estimatedMetric.availability).toBe(priorMetric.availability);
      if (priorMetric.value === null) {
        expect(estimatedMetric.value).toBeNull();
      } else {
        expect(estimatedMetric.value).toBeCloseTo(priorMetric.value, 12);
      }
    }
    expect(estimate).toMatchObject({
      coverage: "decimated-presentation",
      startPresentationOrdinal: 0,
      endPresentationOrdinal: 500,
      retainedSampleCount: 501,
      evidence: {
        bothCanonicalBeatBoundariesRetained: true,
        transientBeatFullyMeasured: false,
        revisionsContiguous: false,
        cadenceUniform: false,
        exportEquivalent: false,
      },
    });
    expect(MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        beatBoundary:
          "canonical-phase-0-to-next-canonical-phase-0",
        exactEvaluatorInputProduced: false,
      });
  });

  it("updates once per sample and finalizes once per canonical beat", () => {
    const onSampleUpdate = vi.fn();
    const onBeatFinalized = vi.fn();
    const accumulator = createMainWirePresentationBeatAccumulatorV1({
      onSampleUpdate,
      onBeatFinalized,
    });

    for (let ordinal = 0; ordinal <= 1_000; ordinal += 1) {
      accumulator.update(presentationSampleV1(ordinal));
    }

    expect(accumulator.getInstrumentationSnapshot()).toEqual({
      sampleUpdateCount: 1_001,
      beatFinalizationCount: 2,
    });
    expect(onSampleUpdate).toHaveBeenCalledTimes(1_001);
    expect(onBeatFinalized).toHaveBeenCalledTimes(2);
    expect(accumulator.getLatestEstimate()).toMatchObject({
      startPresentationOrdinal: 500,
      endPresentationOrdinal: 1_000,
      retainedSampleCount: 501,
    });
  });

  it("cannot finalize across an omitted canonical boundary", () => {
    const accumulator = createMainWirePresentationBeatAccumulatorV1();
    accumulator.update(presentationSampleV1(0));

    expect(() => accumulator.update(Object.freeze({
      ...presentationSampleV1(501),
      presentationOrdinal: 1,
      acceptedStepSpanFromPrevious: 501,
    }))).toThrow(/omitted beat boundary/);
    expect(accumulator.getInstrumentationSnapshot()).toEqual({
      sampleUpdateCount: 1,
      beatFinalizationCount: 0,
    });
    expect(accumulator.getLatestEstimate()).toBeNull();
  });
});

function presentationSampleV1(
  presentationOrdinal: number,
): RuntimePresentationSampleV1 {
  const phaseStep = presentationOrdinal % 500;
  const phase = phaseStep / 500;
  return Object.freeze({
    coverage: "decimated-presentation" as const,
    presentationOrdinal,
    acceptedRevision: presentationOrdinal,
    acceptedTimeSec: presentationOrdinal * 0.002,
    acceptedStepSpanFromPrevious: presentationOrdinal === 0 ? 0 : 1,
    phase,
    values: Object.freeze(Object.fromEntries(
      METRIC_DEPENDENCIES_V1.map((observableId) => [
        observableId,
        dependencyValueV1(observableId, phase),
      ]),
    )),
    retentionReason: presentationOrdinal === 0
      ? "stream-boundary" as const
      : phase === 0
        ? "canonical-beat-boundary" as const
        : "observation-stride" as const,
  });
}

function dependencyValueV1(
  observableId: MainWireScientificObservableIdV1,
  phase: number,
): number {
  const angle = 2 * Math.PI * phase;
  if (observableId.startsWith("valve.")) {
    const offset = observableId.includes("AoV") || observableId.includes("TV")
      ? 0.35
      : -0.2;
    return 55 * Math.sin(angle + offset) - 4;
  }
  if (observableId.includes(".volume.")) {
    const offset = observableId.endsWith(".LV")
      ? 0
      : observableId.endsWith(".RV")
        ? 0.4
        : 0.8;
    return 105 + 35 * Math.cos(angle + offset);
  }
  const baseline = observableId.endsWith(".Ao")
    ? 90
    : observableId.endsWith(".PA")
      ? 24
      : observableId.endsWith(".LV")
        ? 70
        : observableId.endsWith(".RV")
          ? 18
          : 9;
  return baseline + 12 * Math.sin(angle - 0.25);
}

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
  attachMainWireFullRateMetricIntegrationV1,
  createMainWirePresentationBeatAccumulatorV1,
  MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_SNAPSHOT_V1,
} from "@/studio/adapters/mainWire";
import {
  MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
} from "@/engine/scientific/metrics";
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
  it("keeps stride-4 rendering metadata separate from full-rate metric evidence", () => {
    const onSampleUpdate = vi.fn();
    const onBeatFinalized = vi.fn();
    const accumulator = createMainWirePresentationBeatAccumulatorV1({
      onSampleUpdate,
      onBeatFinalized,
    });
    const exactSamples = Array.from(
      { length: 501 },
      (_, ordinal) => presentationSampleV1(ordinal),
    );
    const retainedSteps = boundaryAwareStrideStepsV1(500);
    const samples = retainedSteps.map((acceptedRevision, ordinal) =>
      presentationSampleV1(
        ordinal,
        acceptedRevision,
        ordinal === 0
          ? 0
          : acceptedRevision - retainedSteps[ordinal - 1]!,
      )
    );

    let presentationEstimate = null;
    for (const sample of samples) {
      presentationEstimate = accumulator.update(sample);
    }
    expect(presentationEstimate).not.toBeNull();

    const exactTestBeat = Object.freeze({
      frames: Object.freeze(exactSamples.map((sample) =>
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
    const estimate = attachMainWireFullRateMetricIntegrationV1(
      presentationEstimate!,
      Object.freeze({
        policyId:
          MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
        startAcceptedRevision: 0,
        endAcceptedRevision: 500,
        startAcceptedTimeSec: 0,
        endAcceptedTimeSec: 1,
        acceptedStepSampleCount: 501 as const,
        evaluation: prior,
        evidence: Object.freeze({
          acceptedStepReadbackOnly: true as const,
          bothBeatBoundariesMeasured: true as const,
          revisionsContiguous: true as const,
          cadenceUniform2ms: true as const,
          smoothingOrInterpolationApplied: false as const,
          periodicOrbitClaimed: false as const,
          exactExportEquivalent: false as const,
        }),
      }),
    );

    for (const { metricId } of
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1) {
      const estimatedMetric = estimate.values[metricId]!;
      const priorMetric = prior.values[metricId];
      if (priorMetric.value === null) {
        expect(estimatedMetric.value).toBeNull();
      } else {
        expect(estimatedMetric.availability).toBe("available");
        expect(estimatedMetric.value).toBe(priorMetric.value);
      }
    }
    expect(estimate).toMatchObject({
      coverage: "decimated-presentation",
      startPresentationOrdinal: 0,
      endPresentationOrdinal: 125,
      startAcceptedRevision: 0,
      endAcceptedRevision: 500,
      retainedSampleCount: 126,
      evidence: {
        bothCanonicalBeatBoundariesRetained: true,
        metricIntegration: "full-accepted-step",
        metricIntegrationSampleCount: 501,
        transientBeatFullyMeasured: true,
        revisionsContiguous: true,
        cadenceUniform: true,
        exportEquivalent: false,
      },
    });
    expect(MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        beatBoundary:
          "canonical-phase-0-to-next-canonical-phase-0",
        exactEvaluatorInputProduced: true,
        metricAccumulationLocation:
          "scientific-worker-before-decimation",
        metricAcceptedStepStride: 1,
        rendererRetentionPolicy: "fixed-renderer-geometry-error-v1",
        maximumObservationStride: 4,
        geometryErrorThresholds: {
          absolutePressureMmHg: 0.5,
          chamberVolumeMl: 0.5,
          valveFlowMlPerSec: 5,
          valveOpeningFraction: 0.01,
        },
        baseBoundaryAlignedSampleCount: 126,
        productionHealthyBoundaryAlignedSampleCount: 150,
        productionHealthyTransportedSamplesPerSecond: 149,
        characterization: {
          purpose: "provisional-complete-transient-beat-metrics",
          unavailableQuantityKinds: [],
          supportedMetricRelativeErrorAcceptanceCeilingPercent: 0,
          metricValueParityWithCompleteTransientBeatEvaluator: true,
          generalizedErrorBoundClaimed: false,
          valveDiseaseAccuracyClaimed: false,
          exactExportEquivalent: false,
        },
      });
  });

  it("updates once per sample and finalizes once per canonical beat", () => {
    const onSampleUpdate = vi.fn();
    const onBeatFinalized = vi.fn();
    const accumulator = createMainWirePresentationBeatAccumulatorV1({
      onSampleUpdate,
      onBeatFinalized,
    });

    const retainedSteps = boundaryAwareStrideStepsV1(1_000);
    for (const [ordinal, acceptedRevision] of retainedSteps.entries()) {
      accumulator.update(presentationSampleV1(
        ordinal,
        acceptedRevision,
        ordinal === 0
          ? 0
          : acceptedRevision - retainedSteps[ordinal - 1]!,
      ));
    }

    expect(accumulator.getInstrumentationSnapshot()).toEqual({
      sampleUpdateCount: 251,
      beatFinalizationCount: 2,
    });
    expect(onSampleUpdate).toHaveBeenCalledTimes(251);
    expect(onBeatFinalized).toHaveBeenCalledTimes(2);
    expect(accumulator.getLatestEstimate()).toMatchObject({
      startPresentationOrdinal: 125,
      endPresentationOrdinal: 250,
      retainedSampleCount: 126,
    });
  });

  it("cannot finalize across an omitted canonical boundary", () => {
    const accumulator = createMainWirePresentationBeatAccumulatorV1();
    accumulator.update(presentationSampleV1(0));

    expect(() => accumulator.update(Object.freeze({
      ...presentationSampleV1(1, 501, 501),
      presentationOrdinal: 1,
      acceptedStepSpanFromPrevious: 501,
    }))).toThrow(/discontinuous|omitted beat boundary/);
    expect(accumulator.getInstrumentationSnapshot()).toEqual({
      sampleUpdateCount: 1,
      beatFinalizationCount: 0,
    });
    expect(accumulator.getLatestEstimate()).toBeNull();
  });
});

function presentationSampleV1(
  presentationOrdinal: number,
  acceptedRevision = presentationOrdinal,
  acceptedStepSpanFromPrevious = presentationOrdinal === 0 ? 0 : 1,
): RuntimePresentationSampleV1 {
  const phaseStep = acceptedRevision % 500;
  const phase = phaseStep / 500;
  return Object.freeze({
    coverage: "decimated-presentation" as const,
    presentationOrdinal,
    acceptedRevision,
    acceptedTimeSec: acceptedRevision * 0.002,
    acceptedStepSpanFromPrevious,
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

function boundaryAwareStrideStepsV1(
  finalAcceptedRevision: number,
): readonly number[] {
  return Object.freeze(
    Array.from({ length: finalAcceptedRevision + 1 }, (_, revision) => revision)
      .filter((revision) => revision % 4 === 0 || revision % 500 === 0),
  );
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

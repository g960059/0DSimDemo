import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_CLAIM_V1,
  measureMainWireStandard66AorticOutflowShapeDiagnosticV1,
} from "@/analysis/methods/mainWire/MainWireStandard66AorticOutflowShapeDiagnosticV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
  runMainWireStandard66SelectedTraceV1,
  type MainWireStandard66SelectedTraceEndpointV1,
  type MainWireStandard66SelectedTraceV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

describe("Standard66 aortic outflow-shape/active-EOA diagnostic V1", () => {
  it("separates a configured maximum from exact endpoint-reconstructed active EOA and flow shape", () => {
    const trace = syntheticTraceV1();
    const measured = measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
      trace,
      configuredMaximumForwardEoaCm2: 4,
    });

    expect(measured.configuredMaximumForwardEoa).toEqual({
      areaCm2: 4,
      semantics: "parameter-upper-bound-not-cycle-constant-active-area",
    });
    expect(
      measured.reconstructedActiveEoa.positiveFlowAcceptedEndpointCount,
    ).toBe(3);
    expect(
      measured.reconstructedActiveEoa.maximumAcceptedEndpoint.areaCm2,
    ).toBeCloseTo(2, 14);
    expect(
      measured.reconstructedActiveEoa.maximumAcceptedEndpoint
        .fractionOfConfiguredMaximum01,
    ).toBeCloseTo(0.5, 14);
    expect(measured.reconstructedActiveEoa.flowWeightedMeanAreaCm2).toBeCloseTo(
      2,
      14,
    );
    expect(
      measured.reconstructedActiveEoa
        .flowWeightedMeanFractionOfConfiguredMaximum01,
    ).toBeCloseTo(0.5, 14);
    expect(
      measured.reconstructedActiveEoa.configuredMaximumBoundAudit.passed,
    ).toBe(true);

    expect(measured.forwardFlowShape.positiveFlowDurationSec).toBeCloseTo(
      0.4,
      14,
    );
    expect(measured.forwardFlowShape.strokeVolumeMl).toBeCloseTo(40, 14);
    expect(measured.forwardFlowShape.timeWeightedMeanFlowMlPerSec).toBeCloseTo(
      100,
      14,
    );
    expect(measured.forwardFlowShape.timeWeightedRmsFlowMlPerSec).toBeCloseTo(
      Math.sqrt(40_000 / 3),
      12,
    );
    expect(measured.forwardFlowShape.peakFlowMlPerSec).toBe(200);
    expect(measured.forwardFlowShape.firstPeakActualTimeSec).toBeCloseTo(
      0.3,
      14,
    );
    expect(measured.forwardFlowShape.shapeFactors).toMatchObject({
      peakToMean: 2,
      meanToPeak: 0.5,
    });
    expect(measured.forwardFlowShape.shapeFactors.rmsToMean).toBeCloseTo(
      Math.sqrt(4 / 3),
      12,
    );
    expect(
      measured.forwardFlowShape.strokeVolumePositiveDurationIdentity.passed,
    ).toBe(true);
  });

  it("states the exact positive-flow time weighting of VC mean gradient and keeps nonlinear interpolation visible", () => {
    const activeAreaCm2 = 2;
    const gradientAt100 = gradientFromFlowAndAreaV1(100, activeAreaCm2);
    const measured = measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
      trace: syntheticTraceV1(),
      configuredMaximumForwardEoaCm2: 4,
    });

    expect(
      measured.venaContractaGradientTimeWeighting
        .positiveFlowTimeIntegralMmHgSec,
    ).toBeCloseTo(0.6 * gradientAt100, 14);
    expect(
      measured.venaContractaGradientTimeWeighting.timeWeightedMeanMmHg,
    ).toBeCloseTo(1.5 * gradientAt100, 14);
    expect(
      measured.venaContractaGradientTimeWeighting
        .gradientMeanTimesPositiveDurationIdentity.passed,
    ).toBe(true);
    expect(
      measured.venaContractaGradientTimeWeighting
        .physicalVelocityGradientIdentity.passed,
    ).toBe(true);
    expect(
      measured.sameRetainedFlowConfiguredMaximumEoaCounterfactual
        .acceptedEndpointMetricConventionTimeWeightedMeanGradientMmHg,
    ).toBeCloseTo((1.5 * gradientAt100) / 4, 14);
    expect(
      measured.sameRetainedFlowConfiguredMaximumEoaCounterfactual
        .observedToAcceptedEndpointCounterfactualMeanGradientRatio,
    ).toBeCloseTo(4, 13);
    expect(
      measured.sameRetainedFlowConfiguredMaximumEoaCounterfactual
        .continuousFlowLawTimeWeightedMeanGradientMmHg,
    ).toBeCloseTo(gradientAt100 / 3, 14);
    expect(
      measured.sameRetainedFlowConfiguredMaximumEoaCounterfactual
        .nonlinearInterpolationDifferenceMmHg,
    ).not.toBe(0);
    expect(
      measured.sameRetainedFlowConfiguredMaximumEoaCounterfactual
        .closedLoopFlowOrStateRecomputed,
    ).toBe(false);
  });

  it("uses the timing method's unique aortic episode for peak timing, centroid, and thirds", () => {
    const measured = measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
      trace: syntheticTraceV1(),
      configuredMaximumForwardEoaCm2: 4,
    });

    expect(measured.modelFlowEjectionEpisode.status).toBe("available");
    if (measured.modelFlowEjectionEpisode.status !== "available") return;
    const episode = measured.modelFlowEjectionEpisode;
    expect(episode.opening.timeSec).toBeCloseTo(0.102, 14);
    expect(episode.closure.timeSec).toBeCloseTo(0.498, 14);
    expect(episode.durationSec).toBeCloseTo(0.396, 14);
    expect(episode.firstPeakActualTimeSec).toBeCloseTo(0.3, 14);
    expect(episode.timeFromOpeningToFirstPeakSec).toBeCloseTo(0.198, 14);
    expect(episode.timeFromOpeningToFirstPeakFraction01).toBeCloseTo(0.5, 14);
    expect(episode.flowCentroidFromOpeningSec).toBeCloseTo(0.198, 14);
    expect(episode.flowCentroidFromOpeningFraction01).toBeCloseTo(0.5, 14);
    expect(episode.forwardVolumeFractions.earlyThird).toBeCloseTo(
      episode.forwardVolumeFractions.lateThird,
      14,
    );
    expect(episode.forwardVolumeFractions.sum).toBeCloseTo(1, 14);
    expect(episode.thirdVolumeIdentity.passed).toBe(true);
  });

  it("fails closed for a misaligned accepted chain, impossible VC signal, or mismatched area bound", () => {
    const source = syntheticTraceV1();
    const brokenRevision = mutateEndpointV1(source, 4, (endpoint) => ({
      ...endpoint,
      acceptedRevision: endpoint.acceptedRevision + 2,
    }));
    expect(() =>
      measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
        trace: brokenRevision,
        configuredMaximumForwardEoaCm2: 4,
      }),
    ).toThrow(/accepted-commit chain|not contiguous/);

    const missingGradient = mutateEndpointV1(source, 2, (endpoint) => ({
      ...endpoint,
      signals: Object.freeze({
        ...endpoint.signals,
        aorticVenaContractaBernoulliPressureMmHg: 0,
      }),
    }));
    expect(() =>
      measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
        trace: missingGradient,
        configuredMaximumForwardEoaCm2: 4,
      }),
    ).toThrow(/positive flow lacks positive|gradient must be positive/);

    expect(() =>
      measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
        trace: source,
        configuredMaximumForwardEoaCm2: 1.9,
      }),
    ).toThrow(/exceeds its supplied configured maximum/);
  });

  it("runs on the production-route Standard66 trace without changing a preregistered outcome", async () => {
    const trace = await runMainWireStandard66SelectedTraceV1({
      requestedBoundaryIntervalSec: 0.002,
      recordedBoundaryCount: 680,
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm: 90,
      }),
    });
    const configuredMaximumForwardEoaCm2 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3.valveAreas
        .AoV.maximumForwardEoaCm2;
    const measured = measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
      trace,
      configuredMaximumForwardEoaCm2,
    });

    expect(configuredMaximumForwardEoaCm2).toBe(3.5);
    expect(
      measured.reconstructedActiveEoa.maximumAcceptedEndpoint.areaCm2,
    ).toBeLessThanOrEqual(
      configuredMaximumForwardEoaCm2 +
        measured.reconstructedActiveEoa.configuredMaximumBoundAudit
          .toleranceCm2,
    );
    expect(
      measured.reconstructedActiveEoa.flowWeightedMeanAreaCm2,
    ).toBeGreaterThan(0);
    expect(measured.forwardFlowShape.strokeVolumeMl).toBeGreaterThan(0);
    expect(
      measured.venaContractaGradientTimeWeighting.timeWeightedMeanMmHg,
    ).toBeGreaterThan(0);
    expect(measured.modelFlowEjectionEpisode.status).toBe("available");
    expect(measured.completedBeatAlignmentAudit.status).toBe("cross-checked");
    expect(measured.claim).toBe(
      MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_CLAIM_V1,
    );
    expect(measured.claim).toMatchObject({
      preregisteredOutcomeChanged: false,
      causalAttributionClaimed: false,
      clinicalMeasurementEquivalenceClaimed: false,
    });
  }, 120_000);
});

function syntheticTraceV1(): MainWireStandard66SelectedTraceV1 {
  const flows = [0, 0, 100, 200, 100, 0, 0, 0, 0, 0, 0] as const;
  const mitralFlows = [100, 0, 0, 0, 0, 0, 100, 100, 100, 100, 100] as const;
  const activeAreaCm2 = 2;
  const endpoints = Object.freeze(
    flows.map((flow, index) => {
      const actualTimeSec = index / 10;
      const capture =
        index === 0
          ? syntheticCaptureActivationV1("capture-start", actualTimeSec)
          : index === flows.length - 1
            ? syntheticCaptureActivationV1("capture-end", actualTimeSec)
            : null;
      return Object.freeze({
        endpointIndex: index,
        origin: "accepted-commit" as const,
        actualTimeSec,
        acceptedRevision: 100 + index,
        enclosingRequestedBoundaryOrdinal: index,
        landedOnRequestedBoundary: true,
        clippedByCoronaryWindow: false,
        clippedByRhythmBoundary: capture !== null,
        rhythmBoundaryTimeSec: capture === null ? null : actualTimeSec,
        rhythmBoundaryOwners: Object.freeze([]),
        capturedAtrialActivation: capture,
        signals: Object.freeze({
          mitralValveFlowMlPerSec: mitralFlows[index]!,
          aorticValveFlowMlPerSec: flow,
          absoluteLeftVentricularPressureMmHg: 100,
          absoluteHistoricalAorticNodePressureMmHg: 80,
          absoluteSystemicArterialPressureMmHg: 80,
          leftVentricularVolumeMl: 120,
          aorticProximalConstitutivePortPressureMmHg: 85,
          aorticLocalHydraulicPressureGradientMmHg: gradientFromFlowAndAreaV1(
            flow,
            activeAreaCm2,
          ),
          aorticVenaContractaBernoulliPressureMmHg: gradientFromFlowAndAreaV1(
            flow,
            activeAreaCm2,
          ),
        }),
        latestCompletedBeatMetrics: emptyCompletedBeatMetricsV1(),
      });
    }),
  ) satisfies readonly MainWireStandard66SelectedTraceEndpointV1[];
  return {
    runnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
    endpoints,
    capturedAtrialActivationBoundaries: Object.freeze([
      Object.freeze({
        endpointIndex: 0,
        capturedActivationId: "capture-start",
        activationTimeSec: 0,
        parentSourceImpulseId: "source-start",
        upstreamCapturedActivationId: null,
        sourceKind: "primary-intrinsic",
        sourceId: "source",
        sourceSequence: 1,
        captureOrdinal: 1,
      }),
      Object.freeze({
        endpointIndex: endpoints.length - 1,
        capturedActivationId: "capture-end",
        activationTimeSec: 1,
        parentSourceImpulseId: "source-end",
        upstreamCapturedActivationId: null,
        sourceKind: "primary-intrinsic",
        sourceId: "source",
        sourceSequence: 2,
        captureOrdinal: 2,
      }),
    ]),
  } as unknown as MainWireStandard66SelectedTraceV1;
}

function syntheticCaptureActivationV1(
  capturedActivationId: string,
  activationTimeSec: number,
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    chamber: "atrial" as const,
    capturedActivationId,
    parentSourceImpulseId: `${capturedActivationId}-source-impulse`,
    upstreamCapturedActivationId: null,
    gateInstanceId: "synthetic-atrial-gate",
    activationTimeSec,
    sourceKind: "primary-intrinsic" as const,
    sourceId: "synthetic-primary-source",
    sourceSequence: activationTimeSec === 0 ? 1 : 2,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2["primary-intrinsic"],
    captureOrdinal: activationTimeSec === 0 ? 1 : 2,
    ownerRevision: activationTimeSec === 0 ? 100 : 110,
  });
}

function emptyCompletedBeatMetricsV1(): MainWireStandard66SelectedTraceEndpointV1["latestCompletedBeatMetrics"] {
  return Object.freeze({
    historicalMeanAorticNodePressureMmHg: null,
    meanSystemicArterialPressureMmHg: null,
    extremaLeftVentricularStrokeVolumeMl: null,
    eventDefinedLeftVentricularStrokeVolumeMl: null,
    aorticForwardVolumeMl: null,
    aorticMeanLocalHydraulicForwardGradientMmHg: null,
    aorticPeakLocalHydraulicForwardGradientMmHg: null,
    aorticMeanVenaContractaBernoulliForwardGradientMmHg: null,
    aorticPeakVenaContractaBernoulliForwardGradientMmHg: null,
    aorticPositiveFlowDurationSec: null,
  });
}

function gradientFromFlowAndAreaV1(
  flowMlPerSec: number,
  areaCm2: number,
): number {
  const velocityMPerSec = (0.01 * flowMlPerSec) / areaCm2;
  return (
    (MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 * velocityMPerSec ** 2) /
    (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2)
  );
}

function mutateEndpointV1(
  trace: MainWireStandard66SelectedTraceV1,
  endpointIndex: number,
  mutate: (
    endpoint: MainWireStandard66SelectedTraceEndpointV1,
  ) => MainWireStandard66SelectedTraceEndpointV1,
): MainWireStandard66SelectedTraceV1 {
  return Object.freeze({
    ...trace,
    endpoints: Object.freeze(
      trace.endpoints.map((endpoint) =>
        endpoint.endpointIndex === endpointIndex ? mutate(endpoint) : endpoint,
      ),
    ),
  });
}

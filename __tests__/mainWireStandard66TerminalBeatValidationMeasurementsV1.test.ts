import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_CLAIM_V1,
  measureMainWireStandard66TerminalBeatValidationV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import {
  runMainWireStandard66SelectedTraceV1,
  type MainWireStandard66SelectedTraceV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1,
  deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

let defaultTerminalTracePromise:
  Promise<MainWireStandard66SelectedTraceV1> | null = null;

describe("Standard66 terminal-beat validation measurements V1", () => {
  it("measures one exact terminal beat and binds every preregistered gate without evaluating it", async () => {
    const trace = await terminalTraceV1();
    const measured = measureMainWireStandard66TerminalBeatValidationV1(trace);
    const captures = trace.capturedAtrialActivationBoundaries;
    const startCapture = captures.at(-2)!;
    const endCapture = captures.at(-1)!;

    expect(measured.source).toMatchObject({
      startAtrialCaptureId: startCapture.capturedActivationId,
      endAtrialCaptureId: endCapture.capturedActivationId,
      startTimeSec: startCapture.activationTimeSec,
      endTimeSec: endCapture.activationTimeSec,
      startEndpointIndex: startCapture.endpointIndex,
      endEndpointIndex: endCapture.endpointIndex,
      contiguousAcceptedEndpointCount:
        endCapture.endpointIndex - startCapture.endpointIndex + 1,
    });
    expect(measured.requiredFlowEventMeasurements).toMatchObject({
      aorticEjectionDurationSec: { status: "available" },
      isovolumicContractionDurationSec: { status: "available" },
      isovolumicRelaxationDurationSec: { status: "available" },
      teiLike: { status: "available" },
    });
    expect(measured.flowEventTiming.interpretation).toMatchObject({
      allFourModelFlowEventsAvailable: true,
      strictMvcAvoAvcMvoOrderSatisfied: true,
      eligibleForModelFlowEventTimingInterpretation: true,
      clinicalMeasurementClaimed: false,
    });
    expect(measured.aorticFlowDurationAudit).toEqual({
      positiveFlowDurationSec:
        trace.endpoints[endCapture.endpointIndex]!
          .latestCompletedBeatMetrics.aorticPositiveFlowDurationSec,
      onePercentPeakThresholdEjectionDurationSec:
        measured.requiredFlowEventMeasurements.aorticEjectionDurationSec.value,
      meaningsAreDistinct: true,
    });

    const registeredGateIds =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1
        .map(({ metricId }) => metricId)
        .sort();
    expect(Object.keys(measured.preregisteredDtGateValues).sort())
      .toEqual(registeredGateIds);
    expect(measured.preregisteredDtGateValues["stroke-volume"])
      .toBe(measured.completedBeatMeasurements.primaryStrokeVolumeAoVForwardMl);
    expect(measured.preregisteredDtGateValues["mean-arterial-pressure"])
      .toBe(
        measured.completedBeatMeasurements
          .primaryMeanSystemicArterialPressureMmHg,
      );
    expect(measured.preregisteredDtGateValues["aortic-vmax"])
      .toBe(deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1(
        measured.completedBeatMeasurements
          .aorticVenaContractaBernoulliForwardGradient.peakMmHg,
      ));
    expect(measured.preregisteredDtGateValues["aortic-ejection-time"])
      .toBe(
        measured.requiredFlowEventMeasurements.aorticEjectionDurationSec.value,
      );
    expect(measured.claim).toBe(
      MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_CLAIM_V1,
    );
    expect(measured.claim).toMatchObject({
      nominalAreaFlowVelocitySubstituted: false,
      outcomeThresholdsEvaluated: false,
      clinicalMeasurementEquivalenceClaimed: false,
    });
  }, 120_000);

  it("uses only the same capture-to-capture path for all three absolute-LVP pressure-rate windows", async () => {
    const measured = measureMainWireStandard66TerminalBeatValidationV1(
      await terminalTraceV1(),
    );

    expect(measured.pressureRate.primaryWindowSec).toBe(0.01);
    expect(measured.pressureRate.windows.map((window) => ({
      role: window.role,
      windowSec: window.windowSec,
      availability: window.result.availability,
      basis: window.result.pressureBasis,
    }))).toEqual([
      {
        role: "sensitivity",
        windowSec: 0.005,
        availability: "both-signs",
        basis: "absolute-left-ventricular",
      },
      {
        role: "primary",
        windowSec: 0.01,
        availability: "both-signs",
        basis: "absolute-left-ventricular",
      },
      {
        role: "sensitivity",
        windowSec: 0.02,
        availability: "both-signs",
        basis: "absolute-left-ventricular",
      },
    ]);
    for (const window of measured.pressureRate.windows) {
      expect(window.result.evaluableCenterActualTimeRangeSec[0])
        .toBeCloseTo(measured.source.startTimeSec + window.windowSec / 2, 14);
      expect(window.result.evaluableCenterActualTimeRangeSec[1])
        .toBeCloseTo(measured.source.endTimeSec - window.windowSec / 2, 14);
      expect(window.maximumPositiveMmHgPerSec).toBeGreaterThan(0);
      expect(window.minimumNegativeMmHgPerSec).toBeLessThan(0);
    }
    expect(measured.preregisteredDtGateValues["lv-pressure-maximum-dp-dt"])
      .toBe(measured.pressureRate.windows[1].maximumPositiveMmHgPerSec);
    expect(measured.preregisteredDtGateValues["lv-pressure-minimum-dp-dt"])
      .toBe(measured.pressureRate.windows[1].minimumNegativeMmHgPerSec);
  }, 120_000);

  it("fails closed when end-capture completed-beat outputs do not match the retained exact path", async () => {
    const trace = await terminalTraceV1();
    const endCapture = trace.capturedAtrialActivationBoundaries.at(-1)!;
    const endpoints = trace.endpoints.map((endpoint) =>
      endpoint.endpointIndex !== endCapture.endpointIndex
        ? endpoint
        : Object.freeze({
            ...endpoint,
            latestCompletedBeatMetrics: Object.freeze({
              ...endpoint.latestCompletedBeatMetrics,
              aorticForwardVolumeMl:
                endpoint.latestCompletedBeatMetrics.aorticForwardVolumeMl! + 1,
            }),
          }));
    const misaligned = Object.freeze({
      ...trace,
      endpoints: Object.freeze(endpoints),
    });

    expect(() => measureMainWireStandard66TerminalBeatValidationV1(misaligned))
      .toThrow(/aortic forward volume is not aligned with the end capture/);
  }, 120_000);
});

function terminalTraceV1(): Promise<MainWireStandard66SelectedTraceV1> {
  defaultTerminalTracePromise ??= runMainWireStandard66SelectedTraceV1({
    requestedBoundaryIntervalSec: 0.002,
    recordedBoundaryCount: 680,
    hemodynamicResearchInputs: Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 90,
    }),
  });
  return defaultTerminalTracePromise;
}

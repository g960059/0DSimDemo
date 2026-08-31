import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_CLAIM_V1,
  measureMainWireLeftVentricularFlowEventTimingV1,
  type MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1,
  type MainWireLeftVentricularFlowEventTimingAvailabilityV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";

describe("main-wire LV model-flow event timing V1", () => {
  it("interpolates MVC, AVO, AVC, and MVO on actual irregular timestamps", () => {
    const measured = measure([
      endpoint(0, 20, 0),
      endpoint(0.11, 10, 0),
      endpoint(0.19, 0, 0),
      endpoint(0.27, 0, 2),
      endpoint(0.34, 0, 100),
      endpoint(0.52, 0, 20),
      endpoint(0.66, 0, 0),
      endpoint(0.74, 2, 0),
      endpoint(0.91, 80, 0),
      endpoint(1, 20, 0),
    ]);

    const mvc = available(measured.events.mitralValveClosure);
    const avo = available(measured.events.aorticValveOpening);
    const avc = available(measured.events.aorticValveClosure);
    const mvo = available(measured.events.mitralValveOpening);
    expect(mvc).toMatchObject({
      valveId: "MV",
      transition: "closure",
      leftAcceptedEndpointIndex: 1,
      rightAcceptedEndpointIndex: 2,
    });
    expect(mvc.interpolationFractionFromLeftToRight01).toBeCloseTo(0.92, 12);
    expect(mvc.timeSec).toBeCloseTo(0.1836, 12);
    expect(avo).toMatchObject({
      valveId: "AoV",
      transition: "opening",
      leftAcceptedEndpointIndex: 2,
      rightAcceptedEndpointIndex: 3,
      interpolationFractionFromLeftToRight01: 0.5,
    });
    expect(avo.timeSec).toBeCloseTo(0.23, 12);
    expect(avc.interpolationFractionFromLeftToRight01).toBeCloseTo(0.95, 12);
    expect(avc.timeSec).toBeCloseTo(0.653, 12);
    expect(mvo.interpolationFractionFromLeftToRight01).toBeCloseTo(0.4, 12);
    expect(mvo.timeSec).toBeCloseTo(0.692, 12);

    const et = available(
      measured.metrics.modelFlowEventAorticEjectionDurationSec,
    );
    const ict = available(
      measured.metrics.modelFlowEventIsovolumicContractionDurationSec,
    );
    const ivrt = available(
      measured.metrics.modelFlowEventIsovolumicRelaxationDurationSec,
    );
    const mvcToMvo = available(
      measured.metrics.modelFlowEventMitralClosureToOpeningDurationSec,
    );
    expect(et).toBeCloseTo(0.423, 12);
    expect(ict).toBeCloseTo(0.0464, 12);
    expect(ivrt).toBeCloseTo(0.039, 12);
    expect(mvcToMvo).toBeCloseTo(0.5084, 12);
    expect(available(measured.metrics.modelFlowEventTeiLike)).toBeCloseTo(
      (ict + ivrt) / et,
      12,
    );
    expect(available(measured.metrics.intervalIdentityResidualSec)).toBeCloseTo(
      0,
      12,
    );

    expect(measured.evidence.aortic.threshold).toMatchObject({
      positivePeakFlowMlPerSec: 100,
      thresholdMlPerSec: 1,
      globalPositivePeakAcceptedEndpointIndices: [4],
      thresholdEpisodeCount: 1,
    });
    expect(measured.evidence.aortic.primaryEpisode).toEqual({
      firstActiveAcceptedEndpointIndex: 3,
      lastActiveAcceptedEndpointIndex: 5,
      activeAcceptedEndpointCount: 3,
      containsEveryGlobalPositivePeak: true,
    });
    expect(measured.evidence.mitral.threshold.thresholdMlPerSec).toBe(0.8);
    expect(measured.interpretation).toMatchObject({
      allFourModelFlowEventsAvailable: true,
      strictMvcAvoAvcMvoOrderSatisfied: true,
      exactlyOneAorticThresholdEpisode: true,
      noAorticThresholdActiveEndpointsOutsidePrimaryEpisode: true,
      eligibleForModelFlowEventTimingInterpretation: true,
      clinicalMeasurementClaimed: false,
    });
    expect(MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_CLAIM_V1).toMatchObject(
      {
        fixedTimeStepAssumed: false,
        smoothingApplied: false,
        absoluteFlowFloorApplied: false,
        clinicalLeftVentricularEjectionTimeClaimed: false,
        clinicalIsovolumicIntervalClaimed: false,
        clinicalTeiIndexClaimed: false,
      },
    );
  });

  it("selects the global-peak aortic episode and audits lower extra episodes", () => {
    const measured = measure([
      endpoint(0, 100, 0),
      endpoint(1, 100, 0),
      endpoint(2, 0, 5),
      endpoint(3, 0, 0),
      endpoint(4, 0, 0),
      endpoint(5, 0, 100),
      endpoint(6, 0, 0),
      endpoint(7, 100, 0),
      endpoint(8, 100, 0),
    ]);

    expect(available(measured.events.aorticValveOpening).timeSec).toBeCloseTo(
      4.01,
      12,
    );
    expect(available(measured.events.aorticValveClosure).timeSec).toBeCloseTo(
      5.99,
      12,
    );
    expect(
      available(measured.metrics.modelFlowEventAorticEjectionDurationSec),
    ).toBeCloseTo(1.98, 12);
    expect(measured.evidence.aortic.threshold.thresholdEpisodeCount).toBe(2);
    expect(measured.evidence.aortic.primaryEpisode).toMatchObject({
      firstActiveAcceptedEndpointIndex: 5,
      lastActiveAcceptedEndpointIndex: 5,
      containsEveryGlobalPositivePeak: true,
    });
    expect(
      measured.evidence.aortic
        .extraActiveAcceptedEndpointCountOutsidePrimaryEpisode,
    ).toBe(1);
    expect(
      measured.interpretation.eligibleForModelFlowEventTimingInterpretation,
    ).toBe(false);
  });

  it("fails closed when equal global peaks occupy separate aortic episodes", () => {
    const measured = measure([
      endpoint(0, 0, 0),
      endpoint(1, 0, 100),
      endpoint(2, 0, 0),
      endpoint(3, 0, 0),
      endpoint(4, 0, 100),
      endpoint(5, 0, 0),
    ]);

    expect(unavailableReason(measured.events.aorticValveOpening)).toBe(
      "aortic-global-peak-spans-multiple-threshold-episodes",
    );
    expect(unavailableReason(measured.events.aorticValveClosure)).toBe(
      "aortic-global-peak-spans-multiple-threshold-episodes",
    );
    expect(
      unavailableReason(
        measured.metrics.modelFlowEventAorticEjectionDurationSec,
      ),
    ).toBe("aortic-global-peak-spans-multiple-threshold-episodes");
    expect(measured.evidence.aortic.threshold).toMatchObject({
      globalPositivePeakAcceptedEndpointIndices: [1, 4],
      thresholdEpisodeCount: 2,
    });
    expect(measured.evidence.aortic.primaryEpisode).toBeNull();
  });

  it("does not invent an aortic opening time across a threshold plateau", () => {
    const measured = measure([
      endpoint(0, 0, 0),
      endpoint(1, 0, 1),
      endpoint(2, 0, 1),
      endpoint(3, 0, 100),
      endpoint(4, 0, 0),
    ]);

    expect(unavailableReason(measured.events.aorticValveOpening)).toBe(
      "aortic-opening-threshold-plateau-ambiguous",
    );
    expect(measured.events.aorticValveClosure.status).toBe("available");
    expect(
      unavailableReason(
        measured.metrics.modelFlowEventAorticEjectionDurationSec,
      ),
    ).toBe("aortic-opening-threshold-plateau-ambiguous");
    expect(measured.evidence.aortic.threshold).toMatchObject({
      thresholdMlPerSec: 1,
      thresholdPlateauIntervalCount: 1,
      ambiguousOpeningTransitionCount: 1,
      ambiguousClosingTransitionCount: 0,
    });
  });

  it("does not invent MVC across a mitral threshold plateau", () => {
    const measured = measure([
      endpoint(0, 100, 0),
      endpoint(0.1, 1, 0),
      endpoint(0.2, 1, 0),
      endpoint(0.3, 0, 0),
      endpoint(0.4, 0, 100),
      endpoint(0.6, 0, 100),
      endpoint(0.8, 0, 0),
      endpoint(1, 100, 0),
    ]);

    expect(unavailableReason(measured.events.mitralValveClosure)).toBe(
      "mitral-closure-threshold-plateau-ambiguous",
    );
    expect(measured.events.aorticValveOpening.status).toBe("available");
    expect(measured.events.aorticValveClosure.status).toBe("available");
    expect(measured.events.mitralValveOpening.status).toBe("available");
    expect(
      unavailableReason(
        measured.metrics.modelFlowEventIsovolumicContractionDurationSec,
      ),
    ).toBe("mitral-closure-threshold-plateau-ambiguous");
    expect(
      measured.metrics.modelFlowEventIsovolumicRelaxationDurationSec.status,
    ).toBe("available");
    expect(unavailableReason(measured.metrics.modelFlowEventTeiLike)).toBe(
      "mitral-closure-threshold-plateau-ambiguous",
    );
    expect(measured.evidence.mitral.threshold).toMatchObject({
      thresholdMlPerSec: 1,
      thresholdPlateauIntervalCount: 1,
      ambiguousClosingTransitionCount: 1,
    });
  });

  it("reports partial availability when MVC occurs only after AVO", () => {
    const measured = measure([
      endpoint(0, 100, 0),
      endpoint(1, 100, 0),
      endpoint(2, 100, 0),
      endpoint(3, 100, 100),
      endpoint(4, 0, 100),
      endpoint(5, 0, 0),
      endpoint(6, 100, 0),
      endpoint(7, 100, 0),
    ]);

    expect(unavailableReason(measured.events.mitralValveClosure)).toBe(
      "mitral-closure-before-aortic-opening-not-observed",
    );
    expect(
      measured.evidence.mitral
        .closureCandidateCountAfterCaptureBeforeAorticOpening,
    ).toBe(0);
    expect(measured.events.aorticValveOpening.status).toBe("available");
    expect(measured.events.aorticValveClosure.status).toBe("available");
    expect(measured.events.mitralValveOpening.status).toBe("available");
    expect(
      measured.metrics.modelFlowEventAorticEjectionDurationSec.status,
    ).toBe("available");
    expect(
      measured.metrics.modelFlowEventIsovolumicRelaxationDurationSec.status,
    ).toBe("available");
    expect(
      unavailableReason(
        measured.metrics.modelFlowEventIsovolumicContractionDurationSec,
      ),
    ).toBe("mitral-closure-before-aortic-opening-not-observed");
    expect(unavailableReason(measured.metrics.modelFlowEventTeiLike)).toBe(
      "mitral-closure-before-aortic-opening-not-observed",
    );
  });

  it("reports an unbracketed aortic closure without wrapping the beat", () => {
    const measured = measure([
      endpoint(0, 100, 0),
      endpoint(1, 0, 0),
      endpoint(2, 0, 100),
      endpoint(3, 0, 100),
    ]);

    expect(measured.events.aorticValveOpening.status).toBe("available");
    expect(unavailableReason(measured.events.aorticValveClosure)).toBe(
      "aortic-closure-bracket-not-observed",
    );
    expect(
      unavailableReason(
        measured.metrics.modelFlowEventAorticEjectionDurationSec,
      ),
    ).toBe("aortic-closure-bracket-not-observed");
    expect(unavailableReason(measured.events.mitralValveOpening)).toBe(
      "aortic-closure-bracket-not-observed",
    );
  });

  it("keeps one-percent primary ET distinct from all Q-greater-than-zero time", () => {
    const measured = measure([
      endpoint(0, 0, 0),
      endpoint(0.7, 0, 1),
      endpoint(1.1, 0, 100),
      endpoint(2.6, 0, 1),
      endpoint(3.2, 0, 0),
    ]);

    const thresholdEt = available(
      measured.metrics.modelFlowEventAorticEjectionDurationSec,
    );
    const allStrictlyPositiveFlowDurationSec = 3.2;
    expect(thresholdEt).toBeCloseTo(1.9, 12);
    expect(thresholdEt).not.toBeCloseTo(allStrictlyPositiveFlowDurationSec, 12);
    expect(measured.evidence.aortic.threshold).toMatchObject({
      thresholdMlPerSec: 1,
      thresholdActiveAcceptedEndpointCount: 1,
      thresholdPlateauIntervalCount: 0,
    });
    expect(unavailableReason(measured.events.mitralValveClosure)).toBe(
      "no-positive-mitral-flow-peak",
    );
    expect(
      measured.metrics.modelFlowEventAorticEjectionDurationSec.status,
    ).toBe("available");
    expect(measured.metrics.modelFlowEventTeiLike.status).toBe(
      "not-measurable",
    );
  });

  it("returns explicit no-flow reasons and rejects invalid endpoint clocks", () => {
    const noFlow = measure([
      endpoint(0, 0, 0),
      endpoint(0.4, 0, 0),
      endpoint(1, 0, 0),
    ]);
    expect(unavailableReason(noFlow.events.aorticValveOpening)).toBe(
      "no-positive-aortic-flow-peak",
    );
    expect(unavailableReason(noFlow.events.mitralValveOpening)).toBe(
      "no-positive-mitral-flow-peak",
    );
    expect(noFlow.evidence.aortic.threshold.thresholdMlPerSec).toBeNull();
    expect(noFlow.evidence.mitral.threshold.thresholdMlPerSec).toBeNull();

    expect(() =>
      measureMainWireLeftVentricularFlowEventTimingV1({
        startAtrialCapture: {
          capturedActivationId: "capture/start",
          timeSec: 0,
        },
        endAtrialCapture: {
          capturedActivationId: "capture/end",
          timeSec: 1,
        },
        acceptedEndpoints: [
          endpoint(0, 0, 0),
          endpoint(0.8, 0, 0),
          endpoint(0.7, 0, 0),
          endpoint(1, 0, 0),
        ],
      }),
    ).toThrow("accepted endpoint times must increase strictly");
  });
});

function endpoint(
  timeSec: number,
  mitralValveFlowMlPerSec: number,
  aorticValveFlowMlPerSec: number,
): MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1 {
  return Object.freeze({
    timeSec,
    mitralValveFlowMlPerSec,
    aorticValveFlowMlPerSec,
  });
}

function measure(
  acceptedEndpoints: readonly MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1[],
) {
  return measureMainWireLeftVentricularFlowEventTimingV1({
    startAtrialCapture: Object.freeze({
      capturedActivationId: "capture/start",
      timeSec: acceptedEndpoints[0]!.timeSec,
    }),
    endAtrialCapture: Object.freeze({
      capturedActivationId: "capture/end",
      timeSec: acceptedEndpoints.at(-1)!.timeSec,
    }),
    acceptedEndpoints,
  });
}

function available<T>(
  measurement: MainWireLeftVentricularFlowEventTimingAvailabilityV1<T>,
): T {
  if (measurement.status !== "available") {
    throw new Error(
      `expected available measurement, got ${measurement.reason}`,
    );
  }
  return measurement.value;
}

function unavailableReason<T>(
  measurement: MainWireLeftVentricularFlowEventTimingAvailabilityV1<T>,
) {
  if (measurement.status !== "not-measurable") {
    throw new Error("expected not-measurable measurement");
  }
  return measurement.reason;
}

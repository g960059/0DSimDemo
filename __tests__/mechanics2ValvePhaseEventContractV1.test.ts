import { describe, expect, it } from "vitest";
import {
  detectPeriodicValvePhaseEventsV1,
  detectValvePhaseEventsV1,
  type ValvePhaseEventSampleV1,
} from "@/engine/mechanics2/diagnostics/ValvePhaseEventContractV1";

const CONTRACT_OPTIONS = {
  pressureToleranceMmHg: 0.1,
  forwardFlowThresholdMlPerSec: 1,
  flowToleranceMlPerSec: 0.1,
  sustainDurationSec: 0.015,
  timeToleranceSec: 0.001,
  maxPressureFlowSeparationSec: 0.04,
  conductanceMidpoint01: 0.5,
} as const;

function cleanCycle(offsetSec = 0): ValvePhaseEventSampleV1[] {
  const rows = [
    [0, -2, 0, 0],
    [0.01, -1, 0, 0.1],
    [0.02, 1, 0, 0.3],
    [0.03, 2, 0.5, 0.4],
    [0.04, 2, 1.5, 0.6],
    [0.05, 1, 3, 0.9],
    [0.06, -1, 2, 0.7],
    [0.07, -2, 1.5, 0.6],
    [0.08, -2, 0.5, 0.4],
    [0.09, -2, 0, 0.1],
    [0.1, -2, 0, 0],
  ] as const;
  return rows.map(([timeSec, pressureGradientMmHg, forwardFlowMlPerSec, conductance01]) => ({
    timeSec: timeSec + offsetSec,
    pressureGradientMmHg,
    forwardFlowMlPerSec,
    conductance01,
  }));
}

describe("ValvePhaseEventContractV1", () => {
  it("measures pressure-flow opening and closing with interpolation and uncertainty", () => {
    const result = detectValvePhaseEventsV1(cleanCycle(), CONTRACT_OPTIONS);

    expect(result.inputValidation.status).toBe("valid");
    expect(result.observationMode).toBe("linear");
    expect(result.opening.status).toBe("measurable");
    expect(result.closing.status).toBe("measurable");
    if (result.opening.status !== "measurable" || result.closing.status !== "measurable") return;

    expect(result.opening.event.pressureCrossoverTimeSec).toBeCloseTo(0.015, 12);
    expect(result.opening.event.forwardFlowThresholdTimeSec).toBeCloseTo(0.035, 12);
    expect(result.opening.event.eventTimeSec).toBeCloseTo(0.035, 12);
    expect(result.opening.event.pressureToFlowDelaySec).toBeCloseTo(0.02, 12);
    expect(result.opening.event.eventTimeUncertaintyIntervalSec).toEqual({
      lowerBoundSec: 0.028999999999999998,
      upperBoundSec: 0.041,
    });
    expect(result.opening.event.pressureFlowAssociationIntervalSec).toEqual({
      lowerBoundSec: 0.009000000000000001,
      upperBoundSec: 0.041,
    });

    expect(result.closing.event.pressureCrossoverTimeSec).toBeCloseTo(0.055, 12);
    expect(result.closing.event.forwardFlowThresholdTimeSec).toBeCloseTo(0.075, 12);
    expect(result.conductanceMidpoint).toMatchObject({
      diagnosticName: "conductance-midpoint-crossing",
      anatomicalValveEventClaim: false,
      status: "measurable",
    });
    expect(result.conductanceMidpoint.risingCrossings[0]!.timeSec).toBeCloseTo(0.035, 12);
    expect(result.conductanceMidpoint.fallingCrossings[0]!.timeSec).toBeCloseTo(0.075, 12);
    expect(result.claimBoundary).toEqual({
      reportOnly: true,
      modifiesSolverState: false,
      anatomicalLeafletTimingClaim: false,
    });
  });

  it("derives the same contract from explicit upstream and downstream pressures", () => {
    const samples = cleanCycle().map(({ pressureGradientMmHg, ...sample }) => ({
      ...sample,
      upstreamPressureMmHg: 10 + pressureGradientMmHg!,
      downstreamPressureMmHg: 10,
    }));
    const result = detectValvePhaseEventsV1(samples, CONTRACT_OPTIONS);

    expect(result.opening.status).toBe("measurable");
    expect(result.closing.status).toBe("measurable");
    if (result.opening.status !== "measurable") return;
    expect(result.opening.event.eventTimeSec).toBeCloseTo(0.035, 12);
  });

  it("rejects a transient flow threshold crossing that does not satisfy sustain", () => {
    const samples = cleanCycle().map((sample) =>
      sample.timeSec >= 0.05 ? { ...sample, forwardFlowMlPerSec: 0 } : sample
    );
    const result = detectValvePhaseEventsV1(samples, CONTRACT_OPTIONS);

    expect(result.opening).toEqual({
      kind: "opening",
      status: "no-event",
      reason: "no-sustained-flow-transition",
    });
  });

  it("rejects dead-band lingering as sustained post-transition flow", () => {
    const samples = cleanCycle().map((sample) =>
      sample.timeSec > 0.04 && sample.timeSec <= 0.06
        ? { ...sample, forwardFlowMlPerSec: 1 }
        : sample
    );
    const result = detectValvePhaseEventsV1(samples, CONTRACT_OPTIONS);

    expect(result.opening).toEqual({
      kind: "opening",
      status: "no-event",
      reason: "no-sustained-flow-transition",
    });
  });

  it("accepts sustained flow on the nominal post-transition side inside the dead band", () => {
    const samples = cleanCycle().map((sample) =>
      sample.timeSec === 0.05
        ? { ...sample, forwardFlowMlPerSec: 1.05 }
        : sample
    );
    const result = detectValvePhaseEventsV1(samples, CONTRACT_OPTIONS);

    expect(result.opening.status).toBe("measurable");
  });

  it("tiles one periodic cycle and resolves an event across the phase seam", () => {
    const samples: ValvePhaseEventSampleV1[] = [
      { timeSec: 0.01, pressureGradientMmHg: 1, forwardFlowMlPerSec: 2 },
      { timeSec: 0.02, pressureGradientMmHg: 2, forwardFlowMlPerSec: 2 },
      { timeSec: 0.03, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.04, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.05, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.06, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.07, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.08, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
      { timeSec: 0.09, pressureGradientMmHg: -1, forwardFlowMlPerSec: 0 },
      { timeSec: 0.10, pressureGradientMmHg: -1, forwardFlowMlPerSec: 0 },
    ];
    const linear = detectValvePhaseEventsV1(samples, {
      ...CONTRACT_OPTIONS,
      sustainDurationSec: 0.01,
    });
    const periodic = detectPeriodicValvePhaseEventsV1(samples, 0.1, {
      ...CONTRACT_OPTIONS,
      sustainDurationSec: 0.01,
    });

    expect(linear.opening.status).toBe("censored");
    expect(periodic.observationMode).toBe("periodic-tiled-center-cycle");
    expect(periodic.opening.status).toBe("measurable");
    if (periodic.opening.status !== "measurable") return;
    expect(periodic.opening.event.eventTimeSec).toBeCloseTo(0.005, 12);
    expect(periodic.closing.status).toBe("measurable");
  });

  it("reports left and right censoring instead of inventing point events", () => {
    const leftCensored = detectValvePhaseEventsV1(
      [
        { timeSec: 0, pressureGradientMmHg: 2, forwardFlowMlPerSec: 2 },
        { timeSec: 0.01, pressureGradientMmHg: 2, forwardFlowMlPerSec: 2 },
        { timeSec: 0.02, pressureGradientMmHg: 1, forwardFlowMlPerSec: 2 },
      ],
      { ...CONTRACT_OPTIONS, sustainDurationSec: 0.01 },
    );
    expect(leftCensored.opening).toEqual({
      kind: "opening",
      status: "censored",
      reason: "event-precedes-observation",
      boundary: "left",
      uncertaintyIntervalSec: { lowerBoundSec: null, upperBoundSec: 0.001 },
    });

    const rightCensored = detectValvePhaseEventsV1(
      [
        { timeSec: 0, pressureGradientMmHg: -2, forwardFlowMlPerSec: 0 },
        { timeSec: 0.01, pressureGradientMmHg: 2, forwardFlowMlPerSec: 0 },
        { timeSec: 0.02, pressureGradientMmHg: 2, forwardFlowMlPerSec: 2 },
        { timeSec: 0.025, pressureGradientMmHg: 2, forwardFlowMlPerSec: 2 },
      ],
      { ...CONTRACT_OPTIONS, sustainDurationSec: 0.02 },
    );
    expect(rightCensored.opening.status).toBe("censored");
    expect(rightCensored.opening).toMatchObject({
      reason: "sustain-window-exceeds-observation",
      boundary: "right",
    });
  });

  it("marks multiple qualified events ambiguous and fails closed on invalid samples", () => {
    const first = cleanCycle();
    const second = cleanCycle(0.11);
    const ambiguous = detectValvePhaseEventsV1([...first, ...second], CONTRACT_OPTIONS);
    expect(ambiguous.opening.status).toBe("ambiguous");
    if (ambiguous.opening.status !== "ambiguous") return;
    expect(ambiguous.opening.candidates).toHaveLength(2);

    const invalid = detectValvePhaseEventsV1(
      [
        { timeSec: 0, pressureGradientMmHg: -1, forwardFlowMlPerSec: 0 },
        { timeSec: 0, pressureGradientMmHg: 1, forwardFlowMlPerSec: 2 },
      ],
      CONTRACT_OPTIONS,
    );
    expect(invalid.inputValidation.status).toBe("invalid");
    expect(invalid.opening).toEqual({
      kind: "opening",
      status: "no-event",
      reason: "invalid-input",
    });

    const invalidThreshold = detectValvePhaseEventsV1(cleanCycle(), {
      ...CONTRACT_OPTIONS,
      forwardFlowThresholdMlPerSec: 0.05,
      flowToleranceMlPerSec: 0.1,
    });
    expect(invalidThreshold.inputValidation.status).toBe("invalid");

    const conflictingPressure = detectValvePhaseEventsV1(
      cleanCycle().map((sample) => ({
        ...sample,
        upstreamPressureMmHg: 10,
        downstreamPressureMmHg: 10,
      })),
      CONTRACT_OPTIONS,
    );
    expect(conflictingPressure.inputValidation.status).toBe("invalid");
  });
});

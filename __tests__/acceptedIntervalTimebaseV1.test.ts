import { describe, expect, it } from "vitest";

import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_CLAIM,
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  acceptedIntervalTimeWeightedMeanV1,
  acceptedTimestampDelaySecV1,
  backwardEulerEndpointIntegralV1,
  durationWeightedEndpointLinearRegressionV1,
  validateRetainedAcceptedIntervalWindowV1,
  type AcceptedIntervalV1,
  type RetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";

type Sample = Readonly<{
  signal: number;
  map: number;
  flow: number;
  regressionValue: number;
}>;
type Event = Readonly<{ kind: string }>;

describe("accepted interval diagnostic timebase V1", () => {
  it("integrates a hand-calculated nonuniform accepted trace", () => {
    const window = nonuniformWindow();
    validateRetainedAcceptedIntervalWindowV1(window);

    // BE endpoints: 2*0.2 + (-1)*0.3 + 4*0.5 = 2.1.
    expect(backwardEulerEndpointIntegralV1(window, (s) => s.signal))
      .toEqual({
        signed: 2.1,
        positive: 2.4,
        negative: -0.3,
        negativeMagnitude: 0.3,
        durationSec: 1,
      });
    expect(acceptedTimestampDelaySecV1(
      window.precedingSample,
      window.intervals[2]!.endpointSample,
    )).toBe(1);
    expect(ACCEPTED_INTERVAL_TIMEBASE_V1_CLAIM).toMatchObject({
      addsDynamicState: false,
      intervalOwnership: "open-start-closed-end",
      quadrature: "backward-Euler-endpoint",
    });
  });

  it("is invariant to splitting an interval with the same endpoint signal", () => {
    const unsplit = window([
      interval(0, 1, sample({ signal: 3 })),
    ]);
    const split = window([
      interval(0, 0.25, sample({ signal: 3 })),
      interval(0.25, 1, sample({ signal: 3 })),
    ]);

    const measure = (trace: RetainedAcceptedIntervalWindowV1<Sample, Event>) =>
      backwardEulerEndpointIntegralV1(trace, (s) => s.signal);
    expect(measure(split)).toEqual(measure(unsplit));
    expect(acceptedIntervalTimeWeightedMeanV1(split, (s) => s.signal))
      .toBe(3);
  });

  it("uses duration rather than sample count for mean pressure and flow", () => {
    const trace = nonuniformWindow();
    // MAP = (80*0.2 + 100*0.3 + 70*0.5) / 1 = 81.
    expect(acceptedIntervalTimeWeightedMeanV1(trace, (s) => s.map)).toBe(81);
    // Mean flow = (5*0.2 + 10*0.3 - 2*0.5) / 1 = 3.
    expect(acceptedIntervalTimeWeightedMeanV1(trace, (s) => s.flow)).toBe(3);
  });

  it("owns a shared-boundary event exactly once in (start, end]", () => {
    const trace = window([
      interval(0, 0.4, sample(), [event("boundary", 0.4)]),
      interval(0.4, 1, sample(), [event("later", 0.75)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(trace)).not.toThrow();
    expect(trace.intervals.flatMap((accepted) => accepted.eventsOpenClosed)
      .filter((owned) => owned.eventId === "boundary")).toHaveLength(1);

    const duplicated = window([
      interval(0, 0.4, sample(), [event("same-id", 0.2)]),
      interval(0.4, 1, sample(), [event("same-id", 0.8)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(duplicated))
      .toThrow(/owned more than once/);

    const wronglyOwnedAtOpenStart = window([
      interval(0, 0.4, sample()),
      interval(0.4, 1, sample(), [event("wrong-owner", 0.4)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      wronglyOwnedAtOpenStart,
    )).toThrow(/open interval start/);
  });

  it("rejects duplicate/decreasing/gapped/mismatched/zero-duration traces", () => {
    const duplicateEvent = window([
      interval(0, 0.5, sample(), [event("duplicate", 0.25)]),
      interval(0.5, 1, sample(), [event("duplicate", 0.75)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(duplicateEvent))
      .toThrow(/owned more than once/);

    const decreasingEvents = window([
      interval(0, 1, sample(), [event("later", 0.8), event("earlier", 0.3)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(decreasingEvents))
      .toThrow(/monotone/);

    const duplicateEndpointTime = window([
      interval(0, 0.5, sample()),
      Object.freeze({
        ...interval(0.5, 1, sample()),
        endTimeSec: 0.5,
        durationSec: 0,
        endpointSample: Object.freeze({ timeSec: 0.5, sample: sample() }),
      }),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      duplicateEndpointTime,
    )).toThrow(/greater than zero/);

    const decreasingEndpointTime = window([
      interval(0, 0.5, sample()),
      Object.freeze({
        ...interval(0.5, 1, sample()),
        endTimeSec: 0.4,
        durationSec: -0.1,
        endpointSample: Object.freeze({ timeSec: 0.4, sample: sample() }),
      }),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      decreasingEndpointTime,
    )).toThrow(/greater than zero/);

    const gap = window([
      interval(0, 0.4, sample()),
      interval(0.5, 1, sample()),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(gap))
      .toThrow(/not contiguous/);

    const endMismatch = window([
      Object.freeze({
        ...interval(0, 1, sample()),
        endpointSample: Object.freeze({ timeSec: 0.9, sample: sample() }),
      }),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(endMismatch))
      .toThrow(/endpoint sample does not match/);

    const lastAcceptedEndMismatch = Object.freeze({
      ...window([interval(0, 1, sample())]),
      endTimeSec: 1.1,
      durationSec: 1.1,
    });
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      lastAcceptedEndMismatch,
    )).toThrow(/last accepted endpoint/);

    const windowDurationMismatch = Object.freeze({
      ...window([interval(0, 1, sample())]),
      durationSec: 0.9,
    });
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      windowDurationMismatch,
    )).toThrow(/window duration/);

    const zeroDuration = window([
      Object.freeze({
        ...interval(0, 1, sample()),
        durationSec: 0,
      }),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(zeroDuration))
      .toThrow(/greater than zero/);

    expect(() => acceptedTimestampDelaySecV1(
      { timeSec: 1 },
      { timeSec: 0.9 },
    )).toThrow(/must not precede/);
  });

  it("regresses on actual endpoint time with interval-duration weights", () => {
    const trace = window([
      interval(10, 10.1, sample({ regressionValue: 3 * 10.1 - 7 })),
      interval(10.1, 10.7, sample({ regressionValue: 3 * 10.7 - 7 })),
      interval(10.7, 12, sample({ regressionValue: 3 * 12 - 7 })),
    ]);
    const fit = durationWeightedEndpointLinearRegressionV1(
      trace,
      (s) => s.regressionValue,
    );

    expect(fit.sampleCount).toBe(3);
    expect(fit.totalWeightSec).toBeCloseTo(2, 14);
    expect(fit.weightedMeanTimeSec).toBeCloseTo(
      (0.1 * 10.1 + 0.6 * 10.7 + 1.3 * 12) / 2,
      14,
    );
    expect(fit.slopePerSec).toBeCloseTo(3, 13);
    expect(fit.intercept).toBeCloseTo(-7, 12);
    expect(fit.rSquared).toBeCloseTo(1, 14);
    expect(fit.weightedResidualSumSquares).toBeLessThan(1e-26);
  });
});

function nonuniformWindow(): RetainedAcceptedIntervalWindowV1<Sample, Event> {
  return window([
    interval(0, 0.2, sample({ signal: 2, map: 80, flow: 5 })),
    interval(0.2, 0.5, sample({ signal: -1, map: 100, flow: 10 }), [
      event("event-at-end", 0.5),
    ]),
    interval(0.5, 1, sample({ signal: 4, map: 70, flow: -2 })),
  ]);
}

function window(
  intervals: readonly AcceptedIntervalV1<Sample, Event>[],
): RetainedAcceptedIntervalWindowV1<Sample, Event> {
  const startTimeSec = intervals[0]!.startTimeSec;
  const endTimeSec = intervals.at(-1)!.endTimeSec;
  return Object.freeze({
    timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    precedingSample: Object.freeze({
      timeSec: startTimeSec,
      sample: sample(),
    }),
    intervals,
  });
}

function interval(
  startTimeSec: number,
  endTimeSec: number,
  endpoint: Sample,
  eventsOpenClosed: readonly ReturnType<typeof event>[] = [],
): AcceptedIntervalV1<Sample, Event> {
  return Object.freeze({
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    endpointSample: Object.freeze({ timeSec: endTimeSec, sample: endpoint }),
    eventsOpenClosed,
  });
}

function sample(overrides: Partial<Sample> = {}): Sample {
  return Object.freeze({
    signal: 0,
    map: 0,
    flow: 0,
    regressionValue: 0,
    ...overrides,
  });
}

function event(eventId: string, timeSec: number) {
  return Object.freeze({
    eventId,
    timeSec,
    event: Object.freeze({ kind: eventId }),
  });
}

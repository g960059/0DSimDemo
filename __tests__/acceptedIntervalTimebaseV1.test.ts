import { describe, expect, it } from "vitest";

import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  acceptedIntervalTimeWeightedMeanV1,
  backwardEulerEndpointIntegralV1,
  validateRetainedAcceptedIntervalWindowV1,
  type AcceptedIntervalOpenClosedEventV1,
  type AcceptedIntervalV1,
  type RetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";

type Sample = Readonly<{ signal: number }>;
type Event = Readonly<{ kind: string }>;

describe("accepted-interval timebase V1", () => {
  it("assigns a shared-boundary event only to the closed-left interval", () => {
    const valid = retainedWindow([
      interval(0, 0.4, 2, [event("boundary", 0.4)]),
      interval(0.4, 1, 3),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(valid)).not.toThrow();

    const duplicatedAtOpenStart = retainedWindow([
      interval(0, 0.4, 2),
      interval(0.4, 1, 3, [event("wrong-owner", 0.4)]),
    ]);
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      duplicatedAtOpenStart,
    )).toThrow(/open interval start/);
  });

  it("integrates and averages endpoint values by accepted duration", () => {
    const window = retainedWindow([
      interval(0, 0.2, 10),
      interval(0.2, 0.5, -2),
      interval(0.5, 1, 4),
    ]);
    const integral = backwardEulerEndpointIntegralV1(
      window,
      (sample) => sample.signal,
    );

    expect(integral.signed).toBeCloseTo(3.4, 15);
    expect(integral.positive).toBeCloseTo(4, 15);
    expect(integral.negative).toBeCloseTo(-0.6, 15);
    expect(integral.negativeMagnitude).toBeCloseTo(0.6, 15);
    expect(acceptedIntervalTimeWeightedMeanV1(
      window,
      (sample) => sample.signal,
    )).toBeCloseTo(3.4, 15);
  });
});

function retainedWindow(
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
      sample: Object.freeze({ signal: 0 }),
    }),
    intervals,
  });
}

function interval(
  startTimeSec: number,
  endTimeSec: number,
  signal: number,
  eventsOpenClosed: readonly AcceptedIntervalOpenClosedEventV1<Event>[] = [],
): AcceptedIntervalV1<Sample, Event> {
  return Object.freeze({
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    endpointSample: Object.freeze({
      timeSec: endTimeSec,
      sample: Object.freeze({ signal }),
    }),
    eventsOpenClosed,
  });
}

function event(
  eventId: string,
  timeSec: number,
): AcceptedIntervalOpenClosedEventV1<Event> {
  return Object.freeze({
    eventId,
    timeSec,
    event: Object.freeze({ kind: eventId }),
  });
}

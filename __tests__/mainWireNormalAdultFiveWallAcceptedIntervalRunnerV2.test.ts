import { describe, expect, it } from "vitest";

import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  validateRetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

describe("main-wire normal-adult accepted-interval runner V2", () => {
  it("owns exact-state off-grid events once and completes the second retained window", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      calciumRepresentation: "exact-event-state",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.protocolIdentity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl)
      .toBe(5522.11);
    expect(result.stepsPerBeat).toBe(50);
    expect(result.retainedCompleteBeats).toHaveLength(2);
    const [firstBeat, secondBeat] = result.retainedCompleteBeats;
    expect(firstBeat).toBeDefined();
    expect(secondBeat).toBeDefined();
    for (const [index, beat] of [firstBeat!, secondBeat!].entries()) {
      expect(beat.acceptedIntervalCount).toBe(52);
      expect(beat.samples).toHaveLength(52);
      expect(beat.acceptedIntervalTrace.intervals).toHaveLength(52);
      expect(beat.endRevision - beat.startRevision).toBe(52);
      expect(beat.endTimeSec - beat.startTimeSec).toBeCloseTo(1, 12);
      expect(beat.acceptedIntervalTrace.durationSec).toBeCloseTo(1, 12);
      expect(beat.startRevision).toBe(index * 52);
      expect(beat.endRevision).toBe((index + 1) * 52);
      beat.acceptedIntervalTrace.intervals.forEach((interval, intervalIndex) => {
        expect(interval.endpointSample.sample).toBe(beat.samples[intervalIndex]);
      });
    }
    expect(firstBeat!.acceptedIntervalTrace).toMatchObject({
      timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
      status: "missing-preceding-diagnostic",
      reason: "cold-start",
    });
    expect(firstBeat!.acceptedIntervalTrace)
      .not.toHaveProperty("precedingSample");
    const secondTrace = secondBeat!.acceptedIntervalTrace;
    expect(secondTrace.status).toBe("complete");
    if (secondTrace.status !== "complete") {
      throw new Error("second retained beat must have a complete timebase");
    }
    expect(secondTrace.precedingSample.timeSec)
      .toBeCloseTo(secondBeat!.startTimeSec, 12);
    expect(secondTrace.precedingSample.sample)
      .toBe(firstBeat!.samples.at(-1));
    expect(() => validateRetainedAcceptedIntervalWindowV1(secondTrace))
      .not.toThrow();

    const firstEvents = acceptedEvents(firstBeat!);
    const secondEvents = acceptedEvents(secondBeat!);
    expectEventTimes(firstEvents, [0.012, 0.852]);
    expectEventTimes(secondEvents, [1.012, 1.852]);
    const eventIds = [...firstEvents, ...secondEvents].map(
      (event) => event.eventId,
    );
    expect(new Set(eventIds).size).toBe(4);
    for (const event of [...firstEvents, ...secondEvents]) {
      expect(event.event).toMatchObject({
        source: "accepted-calcium-trial",
        scheduleId: result.protocolIdentity.calciumDrive.eventScheduleId,
        scheduleIdentityHash:
          result.protocolIdentity.calciumDrive.eventScheduleIdentityHash,
      });
      expect(event.eventId)
        .toMatch(/^calcium:[0-9a-f]{8}:r\d+:i\d+:[0-9a-f]{8}$/);
      expect(event.eventId).toBe([
        "calcium",
        event.event.scheduleIdentityHash,
        `r${event.event.acceptedTrialBaseRevision}`,
        `i${event.event.eventIndexWithinAcceptedTrial}`,
        stableHash(sanitizeForStableHash(event.event.calciumEvent)),
      ].join(":"));
      expect(event.timeSec).toBe(event.event.calciumEvent.timeSec);
    }
    expect(result.claim.acceptedIntervalEventsCopiedFromAcceptedCalciumTrial)
      .toBe(true);
    expect(result.claim.retainedIntervalEventScheduleRequeryApplied).toBe(false);
  }, 120_000);

  it("retains analytic accepted intervals without numerical event splitting", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 1,
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
    });

    const beat = result.retainedCompleteBeats[0]!;
    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.protocolIdentity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl)
      .toBe(5522.11);
    expect(beat.acceptedIntervalCount).toBe(50);
    expect(beat.samples).toHaveLength(50);
    expect(beat.acceptedIntervalTrace.intervals).toHaveLength(50);
    expect(beat.endRevision - beat.startRevision).toBe(50);
    expect(beat.acceptedIntervalTrace.intervals.every((interval) =>
      Math.abs(interval.durationSec - 0.02) < 1e-12
    )).toBe(true);
    const endpointTimes = beat.samples.map((sample) => sample.timeSec);
    expect(endpointTimes.some((timeSec) => Math.abs(timeSec - 0.012) < 1e-12))
      .toBe(false);
    expect(endpointTimes.some((timeSec) => Math.abs(timeSec - 0.852) < 1e-12))
      .toBe(false);
    expectEventTimes(acceptedEvents(beat), [0.012, 0.852]);
  }, 60_000);

  it("keeps late-cycle event ownership stable across accumulated beat time", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.004,
      maximumBeatCount: 5,
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.completedBeatCount).toBe(5);
    for (const beat of result.retainedCompleteBeats) {
      expect(beat.acceptedIntervalCount).toBe(250);
      expect(acceptedEvents(beat)).toHaveLength(2);
    }
  }, 60_000);
});

function acceptedEvents(
  beat: ReturnType<
    typeof runMainWireNormalAdultFiveWallPeriodicSteadyV3
  >["retainedCompleteBeats"][number],
) {
  return beat.acceptedIntervalTrace.intervals.flatMap(
    (interval) => interval.eventsOpenClosed,
  );
}

function expectEventTimes(
  events: ReturnType<typeof acceptedEvents>,
  expectedTimesSec: readonly number[],
): void {
  expect(events).toHaveLength(expectedTimesSec.length);
  events.forEach((event, index) => {
    expect(event.timeSec).toBeCloseTo(expectedTimesSec[index]!, 12);
  });
}

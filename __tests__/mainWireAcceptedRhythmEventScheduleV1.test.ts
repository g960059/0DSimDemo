import { describe, expect, it } from "vitest";

import {
  advanceExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  checkpointAcceptedRhythmScheduleStateV1,
  canonicalAcceptedRhythmEventScheduleIdentityV1,
  canonicalAcceptedRhythmEventScheduleJsonV1,
  commitAcceptedRhythmScheduleTrialV1,
  createAcceptedRhythmEventScheduleV1,
  evaluateAcceptedRhythmScheduleTrialV1,
  exactEventCalciumEventsForRhythmTargetV1,
  initializeAcceptedRhythmScheduleStateV1,
  maximumAcceptedRhythmScheduleStepV1,
  restoreAcceptedRhythmScheduleStateV1,
  rollbackAcceptedRhythmScheduleTrialV1,
  sha256AcceptedRhythmEventScheduleIdentityV1,
  type RhythmActivationEventInputV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";

const ACTIVATIONS: readonly RhythmActivationEventInputV1[] = Object.freeze([
  Object.freeze({
    eventId: "beat-1:atria",
    sourceId: "sinus-node",
    sourceSequence: 0,
    priority: 10,
    beatId: "beat-1",
    beatOrdinal: 1,
    morphology: "sinus",
    activationTimeSec: 0.1,
    targetIds: Object.freeze(["RA", "LA"]),
    activationStrength01: 0.8,
  }),
  Object.freeze({
    eventId: "beat-1:ventricles",
    sourceId: "sinus-node",
    sourceSequence: 1,
    priority: 10,
    beatId: "beat-1",
    beatOrdinal: 1,
    morphology: "sinus",
    activationTimeSec: 0.26,
    targetIds: Object.freeze(["RVFW", "LVFW", "SEP"]),
    activationStrength01: 1,
  }),
  Object.freeze({
    eventId: "beat-2:atria",
    sourceId: "sinus-node",
    sourceSequence: 2,
    priority: 10,
    beatId: "beat-2",
    beatOrdinal: 2,
    morphology: "sinus",
    activationTimeSec: 1.1,
    targetIds: Object.freeze(["LA", "RA"]),
    activationStrength01: 0.8,
  }),
  Object.freeze({
    eventId: "beat-3:pvc-a",
    sourceId: "ectopy-a",
    sourceSequence: 0,
    priority: 20,
    beatId: "beat-3",
    beatOrdinal: 3,
    morphology: "pvc",
    activationTimeSec: 1.45,
    targetIds: Object.freeze(["LVFW", "SEP"]),
    activationStrength01: 0.7,
  }),
  Object.freeze({
    eventId: "beat-3:pvc-b",
    sourceId: "ectopy-b",
    sourceSequence: 0,
    priority: 20,
    beatId: "beat-3",
    beatOrdinal: 3,
    morphology: "pvc",
    activationTimeSec: 1.45,
    targetIds: Object.freeze(["LVFW", "RVFW"]),
    activationStrength01: 0.5,
  }),
  // Deliberate pause from the PVC until the next sinus beat.
  Object.freeze({
    eventId: "beat-4:atria",
    sourceId: "sinus-node",
    sourceSequence: 3,
    priority: 10,
    beatId: "beat-4",
    beatOrdinal: 4,
    morphology: "sinus",
    activationTimeSec: 2.8,
    targetIds: Object.freeze(["LA", "RA"]),
    activationStrength01: 0.8,
  }),
  Object.freeze({
    eventId: "beat-4:ventricles",
    sourceId: "sinus-node",
    sourceSequence: 4,
    priority: 10,
    beatId: "beat-4",
    beatOrdinal: 4,
    morphology: "sinus",
    activationTimeSec: 2.96,
    targetIds: Object.freeze(["LVFW", "SEP", "RVFW"]),
    activationStrength01: 1,
  }),
  // An intentionally irregular next sinus arrival.
  Object.freeze({
    eventId: "beat-5:atria",
    sourceId: "sinus-node",
    sourceSequence: 5,
    priority: 10,
    beatId: "beat-5",
    beatOrdinal: 5,
    morphology: "sinus",
    activationTimeSec: 3.47,
    targetIds: Object.freeze(["LA", "RA"]),
    activationStrength01: 0.8,
  }),
]);

describe("accepted rhythm event schedule V1", () => {
  it("requires strict canonical order, unique order keys, and beat identity", () => {
    expect(() => createAcceptedRhythmEventScheduleV1("unordered", [
      ACTIVATIONS[0]!,
      ACTIVATIONS[4]!,
      ACTIVATIONS[3]!,
    ])).toThrow(/strict canonical order/);

    expect(() => createAcceptedRhythmEventScheduleV1("duplicate-key", [
      ACTIVATIONS[3]!,
      Object.freeze({
        ...ACTIVATIONS[3]!,
        eventId: "beat-3:pvc-a-duplicate-key",
      }),
    ])).toThrow(/duplicate canonical order key/);

    expect(() => createAcceptedRhythmEventScheduleV1("duplicate-id", [
      ACTIVATIONS[0]!,
      Object.freeze({
        ...ACTIVATIONS[1]!,
        eventId: ACTIVATIONS[0]!.eventId,
      }),
    ])).toThrow(/duplicate eventId/);

    expect(() => createAcceptedRhythmEventScheduleV1("duplicate-source-sequence", [
      ACTIVATIONS[0]!,
      Object.freeze({
        ...ACTIVATIONS[2]!,
        sourceSequence: ACTIVATIONS[0]!.sourceSequence,
      }),
    ])).toThrow(/duplicate source sequence/);

    expect(() => createAcceptedRhythmEventScheduleV1("mixed-beat", [
      ACTIVATIONS[0]!,
      Object.freeze({ ...ACTIVATIONS[1]!, morphology: "pvc" as const }),
    ])).toThrow(/share ordinal and morphology/);
  });

  it("binds source identity, sequence, and priority into the fingerprint", () => {
    const baseline = createAcceptedRhythmEventScheduleV1(
      "fingerprint-fields",
      [ACTIVATIONS[0]!],
    );
    const variants = [
      Object.freeze({ ...ACTIVATIONS[0]!, sourceId: "sinus-node-b" }),
      Object.freeze({ ...ACTIVATIONS[0]!, sourceSequence: 1 }),
      Object.freeze({ ...ACTIVATIONS[0]!, priority: 11 }),
    ];

    for (const variant of variants) {
      expect(createAcceptedRhythmEventScheduleV1(
        "fingerprint-fields",
        [variant],
      ).scheduleFingerprint).not.toBe(baseline.scheduleFingerprint);
    }
  });

  it("re-audits a deserialized frozen schedule instead of trusting its header", () => {
    const original = createAcceptedRhythmEventScheduleV1(
      "external-schedule-audit",
      [ACTIVATIONS[0]!],
    );
    const forgedEvent = Object.freeze({
      ...original.events[0]!,
      activationStrength01: 0.2,
      calciumEvent: Object.freeze({
        timeSec: original.events[0]!.activationTimeSec,
        strength: 0.2,
      }),
    });
    const forged = Object.freeze({
      ...original,
      events: Object.freeze([forgedEvent]),
    });

    expect(() => initializeAcceptedRhythmScheduleStateV1(forged))
      .toThrow(/fingerprint does not match content/);
  });

  it("owns every event once in open-start, closed-end accepted intervals", () => {
    const schedule = scheduleV1();
    let state = initializeAcceptedRhythmScheduleStateV1(schedule);

    const throughFirstAtrial = evaluateAcceptedRhythmScheduleTrialV1(
      state,
      0.1,
      schedule,
    );
    expect(throughFirstAtrial.activationEvents.map((event) => event.eventId))
      .toEqual(["beat-1:atria"]);
    state = commitAcceptedRhythmScheduleTrialV1(
      state,
      throughFirstAtrial,
      schedule,
    );

    const throughPvc = evaluateAcceptedRhythmScheduleTrialV1(
      state,
      1.45,
      schedule,
    );
    expect(throughPvc.activationEvents.map((event) => event.eventId)).toEqual([
      "beat-1:ventricles",
      "beat-2:atria",
      "beat-3:pvc-a",
      "beat-3:pvc-b",
    ]);
    expect(throughPvc.activationEvents.slice(-2).map((event) => [
      event.activationTimeSec,
      event.sourceId,
    ])).toEqual([
      [1.45, "ectopy-a"],
      [1.45, "ectopy-b"],
    ]);
    state = commitAcceptedRhythmScheduleTrialV1(state, throughPvc, schedule);

    const pause = evaluateAcceptedRhythmScheduleTrialV1(
      state,
      2.7,
      schedule,
    );
    expect(pause.activationEvents).toEqual([]);
    state = commitAcceptedRhythmScheduleTrialV1(state, pause, schedule);

    const irregularResume = evaluateAcceptedRhythmScheduleTrialV1(
      state,
      3.5,
      schedule,
    );
    expect(irregularResume.activationEvents.map((event) => [
      event.beatId,
      event.morphology,
      event.activationTimeSec,
    ])).toEqual([
      ["beat-4", "sinus", 2.8],
      ["beat-4", "sinus", 2.96],
      ["beat-5", "sinus", 3.47],
    ]);
  });

  it("is retry-pure and leaves the cursor unchanged after rollback", () => {
    const schedule = scheduleV1();
    const accepted = initializeAcceptedRhythmScheduleStateV1(schedule);
    const firstTrial = evaluateAcceptedRhythmScheduleTrialV1(
      accepted,
      1.2,
      schedule,
    );
    const retryTrial = evaluateAcceptedRhythmScheduleTrialV1(
      accepted,
      1.2,
      schedule,
    );

    expect(retryTrial).toEqual(firstTrial);
    expect(accepted.cursor).toBe(0);
    expect(rollbackAcceptedRhythmScheduleTrialV1(
      accepted,
      firstTrial,
      schedule,
    )).toBe(accepted);
    expect(accepted.cursor).toBe(0);
    expect(evaluateAcceptedRhythmScheduleTrialV1(
      accepted,
      1.2,
      schedule,
    )).toEqual(firstTrial);
  });

  it("clips a proposed step at the next absolute activation boundary", () => {
    const schedule = scheduleV1();
    let state = initializeAcceptedRhythmScheduleStateV1(schedule);
    const exactBoundary = maximumAcceptedRhythmScheduleStepV1(
      state,
      0.1,
      schedule,
    );
    expect(exactBoundary).toMatchObject({
      maximumStepSec: 0.1,
      candidateTimeSec: 0.1,
      clippedByEvent: false,
      boundaryEventId: "beat-1:atria",
    });

    state = commitAcceptedRhythmScheduleTrialV1(
      state,
      evaluateAcceptedRhythmScheduleTrialV1(
        state,
        exactBoundary.candidateTimeSec,
        schedule,
      ),
      schedule,
    );
    const crossedBoundary = maximumAcceptedRhythmScheduleStepV1(
      state,
      0.5,
      schedule,
    );
    expect(crossedBoundary.maximumStepSec).toBeCloseTo(0.16, 15);
    expect(crossedBoundary.candidateTimeSec).toBe(0.26);
    expect(crossedBoundary.clippedByEvent).toBe(true);
    expect(crossedBoundary.boundaryEventId).toBe("beat-1:ventricles");
  });

  it("clips to a simultaneous batch once and consumes the entire batch", () => {
    const schedule = scheduleV1();
    const cold = initializeAcceptedRhythmScheduleStateV1(schedule);
    const beforeBatch = commitAcceptedRhythmScheduleTrialV1(
      cold,
      evaluateAcceptedRhythmScheduleTrialV1(cold, 1.1, schedule),
      schedule,
    );
    const boundary = maximumAcceptedRhythmScheduleStepV1(
      beforeBatch,
      1,
      schedule,
    );

    expect(boundary).toMatchObject({
      candidateTimeSec: 1.45,
      clippedByEvent: true,
      boundaryEventId: "beat-3:pvc-a",
    });
    const batchTrial = evaluateAcceptedRhythmScheduleTrialV1(
      beforeBatch,
      boundary.candidateTimeSec,
      schedule,
    );
    expect(batchTrial.activationEvents.map((event) => event.eventId)).toEqual([
      "beat-3:pvc-a",
      "beat-3:pvc-b",
    ]);

    const afterBatch = commitAcceptedRhythmScheduleTrialV1(
      beforeBatch,
      batchTrial,
      schedule,
    );
    expect(afterBatch.cursor).toBe(5);
    expect(maximumAcceptedRhythmScheduleStepV1(
      afterBatch,
      2,
      schedule,
    ).candidateTimeSec).toBe(2.8);
  });

  it("returns per-target events ready for the exact-event calcium kernel", () => {
    const schedule = scheduleV1();
    const accepted = initializeAcceptedRhythmScheduleStateV1(schedule);
    const trial = evaluateAcceptedRhythmScheduleTrialV1(
      accepted,
      0.26,
      schedule,
    );
    const lvEvents = exactEventCalciumEventsForRhythmTargetV1(
      trial.activationEvents,
      "LVFW",
    );

    expect(lvEvents).toEqual([Object.freeze({ timeSec: 0.26, strength: 1 })]);
    expect(advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.26,
      lvEvents,
      Object.freeze({
        tauRiseSec: 0.04,
        tauDecaySec: 0.2,
        calciumRestUM: 0.08,
        calciumGainUMPerUnitDrive: 0.5,
      }),
    )).toEqual([1, 1]);
  });

  it("adapts a simultaneous target batch in deterministic canonical order", () => {
    const schedule = scheduleV1();
    const cold = initializeAcceptedRhythmScheduleStateV1(schedule);
    const beforeBatch = commitAcceptedRhythmScheduleTrialV1(
      cold,
      evaluateAcceptedRhythmScheduleTrialV1(cold, 1.1, schedule),
      schedule,
    );
    const batch = evaluateAcceptedRhythmScheduleTrialV1(
      beforeBatch,
      1.45,
      schedule,
    );

    expect(exactEventCalciumEventsForRhythmTargetV1(
      batch.activationEvents,
      "LVFW",
    )).toEqual([
      Object.freeze({ timeSec: 1.45, strength: 0.7 }),
      Object.freeze({ timeSec: 1.45, strength: 0.5 }),
    ]);
  });

  it("cryptographically distinguishes the reported FNV32 collision pair", async () => {
    const make = (eventId: string, activationTimeSec: number) =>
      createAcceptedRhythmEventScheduleV1("collision-demo", [
        Object.freeze({
          eventId,
          sourceId: "s",
          sourceSequence: 0,
          priority: 0,
          beatId: "b",
          beatOrdinal: 1,
          morphology: "sinus" as const,
          activationTimeSec,
          targetIds: Object.freeze(["LA"]),
          activationStrength01: 1,
        }),
      ]);
    const first = make("a-umrlkd-1g0d6u8", 1);
    const second = make("b-1q3bt6k-36m2q7", 2);
    const firstIdentity = canonicalAcceptedRhythmEventScheduleIdentityV1(first);
    const secondIdentity = canonicalAcceptedRhythmEventScheduleIdentityV1(second);

    expect(firstIdentity.events[0]).toMatchObject({
      eventId: "a-umrlkd-1g0d6u8",
      activationTimeSec: 1,
    });
    expect(secondIdentity.events[0]).toMatchObject({
      eventId: "b-1q3bt6k-36m2q7",
      activationTimeSec: 2,
    });
    expect(first.scheduleFingerprint).toBe("35ae52de");
    expect(second.scheduleFingerprint).toBe(first.scheduleFingerprint);
    expect(canonicalAcceptedRhythmEventScheduleJsonV1(second))
      .not.toBe(canonicalAcceptedRhythmEventScheduleJsonV1(first));
    const [firstSha, secondSha] = await Promise.all([
      sha256AcceptedRhythmEventScheduleIdentityV1(first),
      sha256AcceptedRhythmEventScheduleIdentityV1(second),
    ]);
    expect(firstSha).toMatch(/^[0-9a-f]{64}$/);
    expect(secondSha).toMatch(/^[0-9a-f]{64}$/);
    expect(secondSha).not.toBe(firstSha);

    const firstState = initializeAcceptedRhythmScheduleStateV1(first);
    expect(() => maximumAcceptedRhythmScheduleStepV1(
      firstState,
      3,
      second,
    )).toThrow(/live capability for this exact schedule/);
  });

  it("round-trips the minimal accepted cursor checkpoint and rejects tampering", () => {
    const schedule = scheduleV1();
    const cold = initializeAcceptedRhythmScheduleStateV1(schedule);
    const accepted = commitAcceptedRhythmScheduleTrialV1(
      cold,
      evaluateAcceptedRhythmScheduleTrialV1(cold, 1.45, schedule),
      schedule,
    );
    const checkpoint = checkpointAcceptedRhythmScheduleStateV1(
      accepted,
      schedule,
    );
    const restored = restoreAcceptedRhythmScheduleStateV1(
      JSON.parse(JSON.stringify(checkpoint)),
      schedule,
    );

    expect(restored).toEqual(accepted);
    expect(() => restoreAcceptedRhythmScheduleStateV1(
      { ...checkpoint, cursor: checkpoint.cursor - 1 },
      schedule,
    )).toThrow(/cursor does not match/);
  });
});

function scheduleV1() {
  return createAcceptedRhythmEventScheduleV1(
    "sinus-pvc-pause-irregular-v1",
    ACTIVATIONS,
  );
}

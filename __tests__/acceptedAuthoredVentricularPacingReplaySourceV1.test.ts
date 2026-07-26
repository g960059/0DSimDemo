import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1,
  MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1,
  MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1,
  canonicalAcceptedAuthoredVentricularPacingReplaySourceIdentityV1,
  commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1,
  createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1,
  initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  maximumAcceptedAuthoredVentricularPacingReplaySourceStepV1,
  rollbackAcceptedAuthoredVentricularPacingReplaySourceTrialV1,
  sha256AcceptedAuthoredVentricularPacingReplaySourceIdentityV1,
  type AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  type AuthoredVentricularPacingReplayEventInputV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceV1";

describe("accepted authored ventricular pacing replay source V1", () => {
  it("replays synthetic matched-mean regular and irregular schedules as ventricular pacing, never PVC", () => {
    const regularTimes = [0.5, 1, 1.5, 2] as const;
    const irregularTimes = [0.5, 0.8, 1.6, 2] as const;
    expect(meanSuccessiveInterval(regularTimes)).toBeCloseTo(0.5, 15);
    expect(meanSuccessiveInterval(irregularTimes)).toBeCloseTo(0.5, 15);

    for (const [suffix, times] of [
      ["regular", regularTimes],
      ["irregular", irregularTimes],
    ] as const) {
      const configuration = makeConfiguration(eventsAt(times), suffix);
      const trial =
        evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
          initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
            configuration,
          ),
          2,
        );
      expect(trial.sourceImpulses).toHaveLength(4);
      expect(
        trial.sourceImpulses.every(
          (impulse) =>
            impulse.chamber === "ventricular" &&
            impulse.sourceKind === "pacing" &&
            impulse.parentCapturedActivationId === null &&
            impulse.sourceId === configuration.sourceId,
        ),
      ).toBe(true);
      expect(
        trial.sourceImpulses.map(
          (impulse) =>
            trial.metadataBySourceImpulseId[impulse.sourceImpulseId]
              ?.pacingEventId,
        ),
      ).toEqual(times.map((_, index) => `synthetic-pacing-${index}`));
    }

    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.emittedSourceKind,
    ).toBe("pacing");
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.pvcLabelClaimed,
    ).toBe(false);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.matchedMeanEnforcedByOwner,
    ).toBe(false);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.clark1997ReproductionClaimed,
    ).toBe(false);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.patientDataBundled,
    ).toBe(false);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.pacemakerPhysiologyClaimed,
    ).toBe(false);
  });

  it("uses open-start/closed-end ownership, consumes history, and clips at one complete boundary event", () => {
    const configuration = makeConfiguration([
      event("signed-history", 0, -0.1),
      event("initial-boundary", 1, 0),
      event("off-grid", 2, 0.235),
      event("later", 3, 0.4),
    ]);
    const initial =
      initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        configuration,
        0,
      );
    expect(initial.initializedHistoryEventCount).toBe(2);
    expect(initial.cursor).toBe(2);

    const step = maximumAcceptedAuthoredVentricularPacingReplaySourceStepV1(
      initial,
      0.3,
    );
    expect(step.candidateTimeSec).toBe(0.235);
    expect(step.maximumStepSec).toBeCloseTo(0.235, 15);
    expect(step.clippedByEvent).toBe(true);
    expect(step.boundaryPacingEventId).toBe("off-grid");
    expect(step.boundaryBatchEventCount).toBe(1);

    const exact = evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      initial,
      step.candidateTimeSec,
    );
    expect(exact.sourceImpulses).toHaveLength(1);
    expect(exact.sourceImpulses[0]?.activationTimeSec).toBe(0.235);
    const accepted = commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      initial,
      exact,
    );
    const openStart =
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        accepted,
        0.3,
      );
    expect(openStart.sourceImpulses).toEqual([]);
  });

  it("is retry-pure, exact-recompute committed, identity-rollback safe, and chunk invariant", () => {
    const configuration = makeConfiguration([
      event("one", 10, 0.2),
      event("two", 20, 0.3),
      event("three", 30, 0.8),
    ]);
    const initial =
      initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        configuration,
      );
    const oneShot =
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(initial, 1);
    expect(
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(initial, 1),
    ).toEqual(oneShot);
    expect(
      rollbackAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        initial,
        oneShot,
      ),
    ).toBe(initial);

    const forged = jsonClone(oneShot);
    forged.sourceImpulses[0].sourceKind = "authored-ectopy";
    expect(() =>
      commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        initial,
        forged,
      ),
    ).toThrow(/does not match its accepted base/);

    let chunked = initial;
    const chunkedImpulses = [] as (typeof oneShot.sourceImpulses)[number][];
    for (const endTime of [0.21, 0.55, 1]) {
      const trial =
        evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
          chunked,
          endTime,
        );
      chunkedImpulses.push(...trial.sourceImpulses);
      chunked = commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        chunked,
        trial,
      );
    }
    expect(chunkedImpulses).toEqual(oneShot.sourceImpulses);
    expect(chunked.acceptedEmittedImpulseCount).toBe(3);
  });

  it("fails at the per-trial hard bound without truncating or substituting", () => {
    const eventCount =
      MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1 + 1;
    const configuration = makeConfiguration(
      Array.from({ length: eventCount }, (_, index) =>
        event(`bounded-${index}`, index, (index + 1) / 1_000),
      ),
      "hard-bound",
    );
    const initial =
      initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        configuration,
      );
    expect(() =>
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        initial,
        eventCount / 1_000,
      ),
    ).toThrow(
      `hard per-trial impulse bound ${MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1}`,
    );

    const clipped = maximumAcceptedAuthoredVentricularPacingReplaySourceStepV1(
      initial,
      eventCount / 1_000,
    );
    expect(clipped.boundaryBatchEventCount).toBe(1);
    expect(
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        initial,
        clipped.candidateTimeSec,
      ).sourceImpulses,
    ).toHaveLength(1);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1
        .hardFailureBounds.configuredEventCount,
    ).toBe(MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1.hardBoundsArePhysiologicalClaim,
    ).toBe(false);
  });

  it("emits no un-authored pacing after the finite replay ends", () => {
    const configuration = makeConfiguration([event("only", 0, 0.25)]);
    let state =
      initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        configuration,
      );
    const due = evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      state,
      0.25,
    );
    expect(due.sourceImpulses).toHaveLength(1);
    state = commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      state,
      due,
    );
    const after = evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      state,
      100,
    );
    expect(after.sourceImpulses).toEqual([]);
    expect(after.candidateCursor).toBe(1);
  });

  it("binds every authored identity, sequence, time, and source into immutable canonical SHA-256 content", async () => {
    const baseline = makeConfiguration(
      [event("one", 10, 0.2), event("two", 20, 0.4)],
      "identity",
    );
    const changedTime = makeConfiguration(
      [event("one", 10, 0.2), event("two", 20, 0.41)],
      "identity",
    );
    const changedId = makeConfiguration(
      [event("one", 10, 0.2), event("changed", 20, 0.4)],
      "identity",
    );
    const changedSequence = makeConfiguration(
      [event("one", 10, 0.2), event("two", 21, 0.4)],
      "identity",
    );
    const changedSource =
      createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
        configurationId: baseline.configurationId,
        ownerInstanceId: baseline.ownerInstanceId,
        replayId: baseline.replayId,
        sourceId: "different-pacing-source",
        events: [event("one", 10, 0.2), event("two", 20, 0.4)],
      });

    const baselineSha =
      await sha256AcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
        baseline,
      );
    for (const changed of [
      changedTime,
      changedId,
      changedSequence,
      changedSource,
    ]) {
      expect(
        await sha256AcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
          changed,
        ),
      ).not.toBe(baselineSha);
    }
    const identity =
      canonicalAcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
        baseline,
      );
    expect(Object.isFrozen(baseline)).toBe(true);
    expect(Object.isFrozen(baseline.events)).toBe(true);
    expect(Object.isFrozen(baseline.events[0])).toBe(true);
    expect(Object.isFrozen(identity)).toBe(true);
    expect(Object.isFrozen(identity.events)).toBe(true);
  });

  it("rejects duplicate/non-increasing times, sequences, IDs, PVC labels, and malformed values", () => {
    expect(() =>
      makeConfiguration([
        event("one", 0, 0.2),
        event("duplicate-time", 1, 0.2),
      ]),
    ).toThrow(/strictly increasing; duplicate times are invalid/);
    expect(() =>
      makeConfiguration([event("later", 0, 0.3), event("earlier", 1, 0.2)]),
    ).toThrow(/strictly increasing/);
    expect(() =>
      makeConfiguration([event("one", 2, 0.2), event("two", 2, 0.3)]),
    ).toThrow(/source sequences must be strictly increasing/);
    expect(() =>
      makeConfiguration([event("same", 0, 0.2), event("same", 1, 0.3)]),
    ).toThrow(/duplicate pacingEventId/);
    expect(() =>
      makeConfiguration([
        { ...event("pvc-mislabel", 0, 0.2), eventKind: "pvc" } as any,
      ]),
    ).toThrow(/keys are invalid/);
    expect(() => makeConfiguration([event("nan", 0, Number.NaN)])).toThrow(
      /finite/,
    );
    expect(() =>
      initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        makeConfiguration([]),
        -0.1,
      ),
    ).toThrow(/nonnegative/);
    expect(() =>
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
          makeConfiguration([]),
        ),
        0,
      ),
    ).toThrow(/must exceed/);
  });
});

function makeConfiguration(
  events: readonly AuthoredVentricularPacingReplayEventInputV1[],
  suffix = "default",
): AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 {
  return createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
    configurationId: `authored-pacing-replay-configuration:${suffix}`,
    ownerInstanceId: `authored-pacing-replay-owner:${suffix}`,
    replayId: `authored-pacing-replay:${suffix}`,
    sourceId: `validation-ventricular-pacing-source:${suffix}`,
    events,
  });
}

function event(
  pacingEventId: string,
  sourceSequence: number,
  activationTimeSec: number,
): AuthoredVentricularPacingReplayEventInputV1 {
  return Object.freeze({
    pacingEventId,
    sourceSequence,
    activationTimeSec,
  });
}

function eventsAt(
  times: readonly number[],
): readonly AuthoredVentricularPacingReplayEventInputV1[] {
  return times.map((activationTimeSec, index) =>
    event(`synthetic-pacing-${index}`, index, activationTimeSec),
  );
}

function meanSuccessiveInterval(times: readonly number[]): number {
  let sum = 0;
  for (let index = 1; index < times.length; index += 1) {
    sum += times[index]! - times[index - 1]!;
  }
  return sum / (times.length - 1);
}

function jsonClone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

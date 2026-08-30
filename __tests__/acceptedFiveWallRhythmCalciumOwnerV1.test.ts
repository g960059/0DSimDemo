import { describe, expect, it, vi } from "vitest";

import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { evaluateExactEventCalciumV1 } from
  "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  FIVE_WALL_PERIODIC_SINUS_ALPHA_REPLAY_ABS_TOLERANCE_UM_V1,
  FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1,
  checkpointAcceptedFiveWallRhythmCalciumStateV1,
  commitAcceptedFiveWallRhythmCalciumTrialV1,
  createAcceptedFiveWallRhythmCalciumBindingV1,
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
  evaluateAcceptedFiveWallRhythmCalciumTrialV1,
  initializeAcceptedFiveWallRhythmCalciumStateV1,
  maximumAcceptedFiveWallRhythmCalciumStepV1,
  restoreAcceptedFiveWallRhythmCalciumStateV1,
  rollbackAcceptedFiveWallRhythmCalciumTrialV1,
  type PeriodicSinusFiveWallRhythmCalciumReplayV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
import { createAcceptedRhythmEventScheduleV1 } from
  "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";

const WALLS = ["LA", "RA", "LVFW", "SEP", "RVFW"] as const;

describe("accepted five-wall rhythm-calcium owner V1", () => {
  it("is invariant to chunking across exact event boundaries", () => {
    const replay = defaultReplay(1);
    const initialJson = JSON.stringify(replay.acceptedState);
    const direct = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      0.95,
      replay.binding,
      replay.schedule,
    );

    const boundaryTimes = replay.schedule.events
      .map((event) => event.activationTimeSec)
      .filter((time) => time < 0.95);
    const splitTimes = [...new Set([
      boundaryTimes[0]!,
      0.4,
      boundaryTimes[1]!,
      0.95,
    ])].sort((left, right) => left - right);
    let splitState = replay.acceptedState;
    for (const timeSec of splitTimes) {
      const trial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
        splitState,
        timeSec,
        replay.binding,
        replay.schedule,
      );
      splitState = commitAcceptedFiveWallRhythmCalciumTrialV1(
        splitState,
        trial,
        replay.binding,
        replay.schedule,
      );
    }

    for (const wall of WALLS) {
      expect(splitState.calciumStateByWall[wall][0])
        .toBeCloseTo(direct.candidateCalciumStateByWall[wall][0], 14);
      expect(splitState.calciumStateByWall[wall][1])
        .toBeCloseTo(direct.candidateCalciumStateByWall[wall][1], 14);
    }
    expect(splitState.rhythmSchedule.cursor)
      .toBe(direct.rhythmScheduleTrial.candidateCursor);
    expect(JSON.stringify(replay.acceptedState)).toBe(initialJson);
  });

  it("owns a complete simultaneous atrial and ventricular activation batch", () => {
    const params: FiveWallNormalCalciumDriveParamsV1 = Object.freeze({
      ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      parameterSetId: "simultaneous-atria-ventricles-v1",
      atrioventricularDelaySec: 0.125,
      atrial: Object.freeze({
        ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial,
        electricalToCalciumDelaySec: 0.25,
      }),
      ventricular: Object.freeze({
        ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular,
        electricalToCalciumDelaySec: 0.125,
      }),
    });
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(params, {
      scheduleId: "simultaneous-sinus-schedule-v1",
      bindingId: "simultaneous-sinus-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: 0.5,
      revision: 0,
    });
    expect(replay.schedule.events).toHaveLength(2);
    expect(replay.schedule.events.map((event) => event.activationTimeSec))
      .toEqual([0.125, 0.125]);
    expect(replay.schedule.events[0]!.targetIds).toEqual(["LA", "RA"]);
    expect(replay.schedule.events[1]!.targetIds)
      .toEqual(["LVFW", "RVFW", "SEP"]);

    const trial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      0.125,
      replay.binding,
      replay.schedule,
    );
    expect(trial.activationEvents).toHaveLength(2);
    expect(trial.simultaneousBatchCount).toBe(1);
    expect(trial.rhythmScheduleTrial.candidateCursor).toBe(2);
    for (const wall of WALLS) {
      expect(trial.candidateCalciumStateByWall[wall][0])
        .toBeGreaterThan(replay.acceptedState.calciumStateByWall[wall][0]);
    }
  });

  it("keeps retries and rollback pure and failed inputs consume no cursor", () => {
    const replay = defaultReplay(1);
    const accepted = replay.acceptedState;
    const before = JSON.stringify(accepted);
    const first = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      accepted,
      0.4,
      replay.binding,
      replay.schedule,
    );
    const retry = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      accepted,
      0.4,
      replay.binding,
      replay.schedule,
    );

    expect(retry).toEqual(first);
    expect(rollbackAcceptedFiveWallRhythmCalciumTrialV1(
      accepted,
      first,
      replay.binding,
      replay.schedule,
    )).toBe(accepted);
    expect(() => evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      accepted,
      1.000_001,
      replay.binding,
      replay.schedule,
    )).toThrow(/outside the complete schedule coverage/);
    expect(JSON.stringify(accepted)).toBe(before);
    expect(accepted.rhythmSchedule.cursor).toBe(0);
    expect(accepted.revision).toBe(0);
  });

  it("matches the fixed periodic sinus drive over a full cycle", () => {
    const params = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const replay = defaultReplay(params.cycleLengthSec);
    let state = replay.acceptedState;
    let maximumAbsoluteErrorUM = 0;

    for (let index = 1; index <= 1_000; index += 1) {
      const timeSec = index * params.cycleLengthSec / 1_000;
      const trial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
        state,
        timeSec,
        replay.binding,
        replay.schedule,
      );
      const legacy = evaluateFiveWallNormalCalciumDriveV1(timeSec, params);
      for (const wall of WALLS) {
        maximumAbsoluteErrorUM = Math.max(
          maximumAbsoluteErrorUM,
          Math.abs(
            trial.candidateFreeCalciumUMByWall[wall]
              - legacy.freeCalciumUMByWall[wall],
          ),
        );
      }
      state = commitAcceptedFiveWallRhythmCalciumTrialV1(
        state,
        trial,
        replay.binding,
        replay.schedule,
      );
    }

    expect(maximumAbsoluteErrorUM)
      .toBeLessThanOrEqual(FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1);
    expect(replay.compatibility.exactBitParityClaimed).toBe(false);
    expect(replay.timing.atrioventricularElectricalDelaySec)
      .toBe(params.atrioventricularDelaySec);
    expect(replay.timing.atrialEffectiveCalciumOnsetOffsetSec).toBe(
      -params.atrioventricularDelaySec
        + params.atrial.electricalToCalciumDelaySec,
    );
    expect(replay.timing.ventricularEffectiveCalciumOnsetOffsetSec)
      .toBe(params.ventricular.electricalToCalciumDelaySec);
  });

  it("replays and checkpoints the equal-tau periodic owner in two slots", async () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        73.25,
      );
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(params, {
      scheduleId: "matched-alpha-accepted-schedule-v1",
      bindingId: "matched-alpha-accepted-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: params.cycleLengthSec,
      revision: 0,
    });
    expect(replay.compatibility.absoluteToleranceUM).toBe(
      FIVE_WALL_PERIODIC_SINUS_ALPHA_REPLAY_ABS_TOLERANCE_UM_V1,
    );

    const candidateTimeSec = 0.317 * params.cycleLengthSec;
    const trial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      candidateTimeSec,
      replay.binding,
      replay.schedule,
    );
    const direct = evaluateFiveWallNormalCalciumDriveV1(
      candidateTimeSec,
      params,
    );
    for (const wall of WALLS) {
      expect(Math.abs(
        trial.candidateFreeCalciumUMByWall[wall]
          - direct.freeCalciumUMByWall[wall],
      )).toBeLessThanOrEqual(replay.compatibility.absoluteToleranceUM);
    }
    const accepted = commitAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      trial,
      replay.binding,
      replay.schedule,
    );
    const checkpoint = await checkpointAcceptedFiveWallRhythmCalciumStateV1(
      accepted,
      replay.binding,
      replay.schedule,
    );
    expect(checkpoint.schemaVersion).toBe(1);
    expect(WALLS.every((wall) =>
      checkpoint.calciumStateByWall[wall].length === 2)).toBe(true);
    const restored = await restoreAcceptedFiveWallRhythmCalciumStateV1(
      JSON.parse(JSON.stringify(checkpoint)),
      replay.binding,
      replay.schedule,
    );
    expect(restored).toEqual(accepted);
    const continuationTimeSec = 0.733 * params.cycleLengthSec;
    expect(evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      restored,
      continuationTimeSec,
      replay.binding,
      replay.schedule,
    )).toEqual(evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      accepted,
      continuationTimeSec,
      replay.binding,
      replay.schedule,
    ));
  });

  it("analytically seeds an event exactly at initial time as history", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const params: FiveWallNormalCalciumDriveParamsV1 = Object.freeze({
      ...prior,
      parameterSetId: "time-zero-onset-v1",
      atrioventricularDelaySec: 0.125,
      atrial: Object.freeze({
        ...prior.atrial,
        electricalToCalciumDelaySec: 0.125,
      }),
      ventricular: Object.freeze({
        ...prior.ventricular,
        electricalToCalciumDelaySec: 0,
      }),
    });
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(params, {
      scheduleId: "time-zero-schedule-v1",
      bindingId: "time-zero-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: 1.1,
      revision: 7,
    });

    expect(replay.schedule.events[0]!.activationTimeSec).toBe(1);
    expect(replay.schedule.events[1]!.activationTimeSec).toBe(1);
    expect(replay.acceptedState.rhythmSchedule.cursor).toBe(0);
    expect(replay.timing.initialTimeConvention)
      .toMatch(/excluded-from-future-schedule-and-analytically-seeded/);
    const legacy = evaluateFiveWallNormalCalciumDriveV1(0, params);
    for (const wall of WALLS) {
      const seeded = evaluateExactEventCalciumV1(
        replay.acceptedState.calciumStateByWall[wall],
        replay.binding.calciumParametersByWall[wall],
      ).freeCalciumUM;
      expect(Math.abs(seeded - legacy.freeCalciumUMByWall[wall]))
        .toBeLessThanOrEqual(FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1);
    }
  });

  it("includes an analytically exact coverage-end event despite binary rounding", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const params: FiveWallNormalCalciumDriveParamsV1 = Object.freeze({
      ...prior,
      parameterSetId: "coverage-end-roundoff-v1",
      cycleLengthSec: 0.8,
    });
    // Analytically 3 * 0.8 + 0.012 = 2.412, while direct binary arithmetic
    // evaluates slightly above the declared endpoint.
    expect(3 * params.cycleLengthSec
      + params.ventricular.electricalToCalciumDelaySec).toBeGreaterThan(2.412);
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(params, {
      scheduleId: "coverage-end-roundoff-schedule-v1",
      bindingId: "coverage-end-roundoff-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: 2.412,
      revision: 0,
    });
    const terminalEvents = replay.schedule.events.filter(
      (event) => event.activationTimeSec === 2.412,
    );
    expect(terminalEvents).toHaveLength(1);
    expect(terminalEvents[0]!.targetIds).toEqual(["LVFW", "RVFW", "SEP"]);
    expect(replay.schedule.events.every(
      (event) => event.activationTimeSec <= 2.412,
    )).toBe(true);
    const terminal = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      2.412,
      replay.binding,
      replay.schedule,
    );
    expect(terminal.activationEvents.at(-1)?.activationTimeSec).toBe(2.412);
    expect(terminal.rhythmScheduleTrial.candidateCursor)
      .toBe(replay.schedule.eventCount);
  });

  it("does not scan a large immutable schedule to verify a sparse trial batch", () => {
    const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "large-sparse-schedule-v1",
        bindingId: "large-sparse-binding-v1",
        acceptedTimeSec: 0,
        endTimeSec: 10_000,
        revision: 0,
      },
    );
    expect(replay.schedule.eventCount).toBeGreaterThan(19_000);
    // The old terminal-batch audit called schedule.events.filter on every
    // trial. Construction/audit has already completed before the spy starts.
    const filterSpy = vi.spyOn(Array.prototype, "filter");
    const callsBefore = filterSpy.mock.calls.length;
    const trial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      0.001,
      replay.binding,
      replay.schedule,
    );
    const callsAfter = filterSpy.mock.calls.length;
    filterSpy.mockRestore();
    expect(trial.activationEvents).toEqual([]);
    expect(callsAfter).toBe(callsBefore);
  });

  it("restores a mid-interval checkpoint exactly and rejects tampering", async () => {
    const replay = defaultReplay(1.5);
    const firstTrial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      0.437,
      replay.binding,
      replay.schedule,
    );
    const mid = commitAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      firstTrial,
      replay.binding,
      replay.schedule,
    );
    const checkpoint = await checkpointAcceptedFiveWallRhythmCalciumStateV1(
      mid,
      replay.binding,
      replay.schedule,
    );
    const parsed: unknown = JSON.parse(JSON.stringify(checkpoint));
    const restored = await restoreAcceptedFiveWallRhythmCalciumStateV1(
      parsed,
      replay.binding,
      replay.schedule,
    );
    expect(restored).toEqual(mid);

    const uninterrupted = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      mid,
      1.234,
      replay.binding,
      replay.schedule,
    );
    const resumed = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      restored,
      1.234,
      replay.binding,
      replay.schedule,
    );
    expect(resumed).toEqual(uninterrupted);

    const tampered = JSON.parse(JSON.stringify(checkpoint));
    tampered.calciumStateByWall.LA[1] += 0.001;
    await expect(restoreAcceptedFiveWallRhythmCalciumStateV1(
      tampered,
      replay.binding,
      replay.schedule,
    )).rejects.toThrow(/SHA-256 mismatch/);
  });

  it("rejects a checkpoint restore through an FNV32-colliding schedule", async () => {
    const makeSchedule = (eventId: string, activationTimeSec: number) =>
      createAcceptedRhythmEventScheduleV1("collision-demo", [Object.freeze({
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
      })]);
    const firstSchedule = makeSchedule("a-umrlkd-1g0d6u8", 1);
    const secondSchedule = makeSchedule("b-1q3bt6k-36m2q7", 2);
    expect(firstSchedule.scheduleFingerprint).toBe("35ae52de");
    expect(secondSchedule.scheduleFingerprint)
      .toBe(firstSchedule.scheduleFingerprint);
    const periodic = defaultReplay(3);
    const bindingInput = {
      bindingId: "collision-binding-v1",
      scheduleCoverageStartTimeSec: 0,
      scheduleCoverageEndTimeSec: 3,
      calciumParametersByWall: periodic.binding.calciumParametersByWall,
      parameterProvenance: "explicit-exact-event-parameters" as const,
      sourceParameterSetId: null,
    };
    const firstBinding = createAcceptedFiveWallRhythmCalciumBindingV1(
      firstSchedule,
      bindingInput,
    );
    const secondBinding = createAcceptedFiveWallRhythmCalciumBindingV1(
      secondSchedule,
      bindingInput,
    );
    expect(secondBinding).toEqual(firstBinding);
    const state = initializeAcceptedFiveWallRhythmCalciumStateV1(
      firstBinding,
      firstSchedule,
      {
        acceptedTimeSec: 0,
        revision: 0,
        initialization: "explicit-accepted-calcium-state",
        calciumStateByWall: periodic.acceptedState.calciumStateByWall,
      },
    );
    const checkpoint = await checkpointAcceptedFiveWallRhythmCalciumStateV1(
      state,
      firstBinding,
      firstSchedule,
    );

    expect(() => maximumAcceptedFiveWallRhythmCalciumStepV1(
      state,
      2.5,
      firstBinding,
      secondSchedule,
    )).toThrow(/live schedule content mismatch/);
    expect(() => maximumAcceptedFiveWallRhythmCalciumStepV1(
      state,
      2.5,
      secondBinding,
      secondSchedule,
    )).toThrow(/state binding mismatch/);

    await expect(restoreAcceptedFiveWallRhythmCalciumStateV1(
      JSON.parse(JSON.stringify(checkpoint)),
      secondBinding,
      secondSchedule,
    )).rejects.toThrow(/schedule SHA-256 mismatch/);
  });

  it("rejects unknown keys, mixed tissue-class events, and foreign bindings", () => {
    const replay = defaultReplay(1);
    expect(() => createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "extra-key-schedule",
        bindingId: "extra-key-binding",
        acceptedTimeSec: 0,
        endTimeSec: 1,
        revision: 0,
        extra: true,
      } as never,
    )).toThrow(/unexpected field set/);

    const mixed = createAcceptedRhythmEventScheduleV1("mixed-class", [
      Object.freeze({
        eventId: "mixed-event",
        sourceId: "captured-source",
        sourceSequence: 0,
        priority: 10,
        beatId: "mixed-beat",
        beatOrdinal: 1,
        morphology: "other" as const,
        activationTimeSec: 0.5,
        targetIds: Object.freeze(["LA", "LVFW"]),
        activationStrength01: 1,
      }),
    ]);
    expect(() => createAcceptedFiveWallRhythmCalciumBindingV1(mixed, {
      bindingId: "mixed-binding",
      scheduleCoverageStartTimeSec: 0,
      scheduleCoverageEndTimeSec: 1,
      calciumParametersByWall: replay.binding.calciumParametersByWall,
      parameterProvenance: "explicit-exact-event-parameters",
      sourceParameterSetId: null,
    })).toThrow(/only atrial or only ventricular walls/);

    const fibrillatory = createAcceptedRhythmEventScheduleV1(
      "fibrillatory-source",
      [Object.freeze({
        eventId: "fibrillatory-source-1",
        sourceId: "captured-fibrillatory-source",
        sourceSequence: 0,
        priority: 10,
        beatId: "fibrillatory-source-beat-1",
        beatOrdinal: 1,
        morphology: "atrial-fibrillatory" as const,
        activationTimeSec: 0.5,
        targetIds: Object.freeze(["LA", "RA"]),
        activationStrength01: 1,
      })],
    );
    expect(() => createAcceptedFiveWallRhythmCalciumBindingV1(
      fibrillatory,
      {
        bindingId: "fibrillatory-binding",
        scheduleCoverageStartTimeSec: 0,
        scheduleCoverageEndTimeSec: 1,
        calciumParametersByWall: replay.binding.calciumParametersByWall,
        parameterProvenance: "explicit-exact-event-parameters",
        sourceParameterSetId: null,
      },
    )).toThrow(/future spatial or aggregate calcium adapter/);

    const foreignReplay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      {
        scheduleId: "foreign-schedule",
        bindingId: "foreign-binding",
        acceptedTimeSec: 0,
        endTimeSec: 1,
        revision: 0,
      },
    );
    expect(() => evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      replay.acceptedState,
      0.1,
      foreignReplay.binding,
      foreignReplay.schedule,
    )).toThrow(/binding mismatch/);
  });
});

function defaultReplay(
  endTimeSec: number,
): PeriodicSinusFiveWallRhythmCalciumReplayV1 {
  return createPeriodicSinusFiveWallRhythmCalciumReplayV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      scheduleId: `default-sinus-schedule-through-${endTimeSec}`,
      bindingId: `default-sinus-binding-through-${endTimeSec}`,
      acceptedTimeSec: 0,
      endTimeSec,
      revision: 0,
    },
  );
}

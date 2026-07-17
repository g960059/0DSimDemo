import { describe, expect, it } from "vitest";

import {
  cloneFiveWallCalciumAcceptedStateV1,
  commitFiveWallCalciumTrialV1,
  createExplicitFiveWallCalciumEventScheduleV1,
  createFixedSinusFiveWallCalciumEventScheduleV1,
  evaluateFiveWallCalciumOutputV1,
  evaluateFiveWallCalciumTrialV1,
  initializeFiveWallCalciumAcceptedStateV1,
  listFiveWallCalciumEventsOpenClosedV1,
  splitFiveWallCalciumIntervalAtEventsV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

const PARAMS = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

describe("five-wall exact-event calcium transaction drive V1", () => {
  it("preserves the HR60 analytic waveform at all aligned endpoints without fitting", () => {
    const schedule = createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS);
    let analytic = initializeFiveWallCalciumAcceptedStateV1(
      0,
      0,
      "analytic-periodic-control-with-exact-event-shadow",
      PARAMS,
      schedule,
      "regular-periodic-prehistory-from-fixed-prior",
    ).acceptedState;
    let exact = initializeFiveWallCalciumAcceptedStateV1(
      0,
      0,
      "exact-event-state",
      PARAMS,
      schedule,
      "regular-periodic-prehistory-from-fixed-prior",
    ).acceptedState;

    for (let step = 1; step <= 500; step += 1) {
      const candidateTimeSec = step * 0.002;
      const analyticTrial = evaluateFiveWallCalciumTrialV1(
        analytic,
        candidateTimeSec,
        PARAMS,
        schedule,
      );
      const exactTrial = evaluateFiveWallCalciumTrialV1(
        exact,
        candidateTimeSec,
        PARAMS,
        schedule,
      );
      for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
        expect(exactTrial.calciumDrive.freeCalciumUMByWall[wall])
          .toBeCloseTo(analyticTrial.calciumDrive.freeCalciumUMByWall[wall], 14);
      }
      analytic = commitFiveWallCalciumTrialV1(analytic, analyticTrial);
      exact = commitFiveWallCalciumTrialV1(exact, exactTrial);
    }

    expect(exact.acceptedTimeSec).toBe(1);
    expect(exact.stateByWall).toEqual(analytic.stateByWall);
  });

  it("splits an off-grid and late-cycle event exactly once", () => {
    const schedule = createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS);
    expect(splitFiveWallCalciumIntervalAtEventsV1(0.01, 0.02, schedule))
      .toEqual([0.012, 0.02]);
    expect(splitFiveWallCalciumIntervalAtEventsV1(0.84, 0.86, schedule))
      .toEqual([0.852, 0.86]);

    let state = initializeFiveWallCalciumAcceptedStateV1(
      0.84,
      0,
      "exact-event-state",
      PARAMS,
      schedule,
      "regular-periodic-prehistory-from-fixed-prior",
    ).acceptedState;
    for (const endpoint of splitFiveWallCalciumIntervalAtEventsV1(
      0.84,
      0.86,
      schedule,
    )) {
      const trial = evaluateFiveWallCalciumTrialV1(
        state,
        endpoint,
        PARAMS,
        schedule,
      );
      state = commitFiveWallCalciumTrialV1(state, trial);
    }
    expect(state.acceptedTimeSec).toBe(0.86);
    expect(state.revision).toBe(2);
  });

  it("matches manual event splitting and rejects an unsplit exact-state interval", () => {
    const schedule = createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS);
    const exactCold = initializeFiveWallCalciumAcceptedStateV1(
      0.01,
      0,
      "exact-event-state",
      PARAMS,
      schedule,
      "regular-periodic-prehistory-from-fixed-prior",
    ).acceptedState;
    expect(() => evaluateFiveWallCalciumTrialV1(
      exactCold,
      0.02,
      PARAMS,
      schedule,
    )).toThrow(/split the interval at the event/);

    let split = exactCold;
    for (const endpoint of splitFiveWallCalciumIntervalAtEventsV1(
      0.01,
      0.02,
      schedule,
    )) {
      split = commitFiveWallCalciumTrialV1(
        split,
        evaluateFiveWallCalciumTrialV1(split, endpoint, PARAMS, schedule),
      );
    }
    const analyticShadowCold = initializeFiveWallCalciumAcceptedStateV1(
      0.01,
      0,
      "analytic-periodic-control-with-exact-event-shadow",
      PARAMS,
      schedule,
      "regular-periodic-prehistory-from-fixed-prior",
    ).acceptedState;
    const unsplitShadow = commitFiveWallCalciumTrialV1(
      analyticShadowCold,
      evaluateFiveWallCalciumTrialV1(
        analyticShadowCold,
        0.02,
        PARAMS,
        schedule,
      ),
    );
    expect(split.stateByWall).toEqual(unsplitShadow.stateByWall);
  });

  it("supports wall-selective explicit events from an explicit event-free state", () => {
    const schedule = createExplicitFiveWallCalciumEventScheduleV1(
      "wall-selective-test-v1",
      [Object.freeze({
        timeSec: 0.1,
        strengthByWall: Object.freeze({ LA: 1 }),
      })],
    );
    let state = initializeFiveWallCalciumAcceptedStateV1(
      0,
      0,
      "exact-event-state",
      PARAMS,
      schedule,
      "event-free-rest",
    ).acceptedState;
    state = commitFiveWallCalciumTrialV1(
      state,
      evaluateFiveWallCalciumTrialV1(state, 0.1, PARAMS, schedule),
    );
    expect(state.stateByWall.LA).toEqual([1, 1]);
    expect(state.stateByWall.RA).toEqual([0, 0]);
    const eventOutput = evaluateFiveWallCalciumOutputV1(state, PARAMS);
    expect(eventOutput.freeCalciumUMByWall.LA)
      .toBeCloseTo(eventOutput.freeCalciumUMByWall.RA, 15);

    state = commitFiveWallCalciumTrialV1(
      state,
      evaluateFiveWallCalciumTrialV1(state, 0.2, PARAMS, schedule),
    );
    const postEventOutput = evaluateFiveWallCalciumOutputV1(state, PARAMS);
    expect(postEventOutput.freeCalciumUMByWall.LA)
      .toBeGreaterThan(postEventOutput.freeCalciumUMByWall.RA);
  });

  it("hashes explicit schedule content and clones accepted state bit-exactly", () => {
    const first = createExplicitFiveWallCalciumEventScheduleV1("same-id", [{
      timeSec: 0.1,
      strengthByWall: { LA: 1 },
    }]);
    const second = createExplicitFiveWallCalciumEventScheduleV1("same-id", [{
      timeSec: 0.2,
      strengthByWall: { LA: 1 },
    }]);
    expect(first.scheduleIdentityHash).not.toBe(second.scheduleIdentityHash);
    const periodicPrehistoryWithIrregularFuture =
      initializeFiveWallCalciumAcceptedStateV1(
      0,
      0,
      "exact-event-state",
      PARAMS,
      first,
      "regular-periodic-prehistory-from-fixed-prior",
      ).acceptedState;
    const periodicPrehistoryWithSinusFuture =
      initializeFiveWallCalciumAcceptedStateV1(
        0,
        0,
        "exact-event-state",
        PARAMS,
        createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS),
        "regular-periodic-prehistory-from-fixed-prior",
      ).acceptedState;
    expect(periodicPrehistoryWithIrregularFuture.stateByWall)
      .toEqual(periodicPrehistoryWithSinusFuture.stateByWall);
    expect(periodicPrehistoryWithIrregularFuture.scheduleIdentityHash)
      .toBe(first.scheduleIdentityHash);
    let transitioned = commitFiveWallCalciumTrialV1(
      periodicPrehistoryWithIrregularFuture,
      evaluateFiveWallCalciumTrialV1(
        periodicPrehistoryWithIrregularFuture,
        0.1,
        PARAMS,
        first,
      ),
    );
    transitioned = commitFiveWallCalciumTrialV1(
      transitioned,
      evaluateFiveWallCalciumTrialV1(transitioned, 0.15, PARAMS, first),
    );
    expect(evaluateFiveWallCalciumOutputV1(transitioned, PARAMS)
      .freeCalciumUMByWall.LA).toBeGreaterThan(
        evaluateFiveWallCalciumOutputV1(transitioned, PARAMS)
          .freeCalciumUMByWall.RA,
      );
    const state = initializeFiveWallCalciumAcceptedStateV1(
      0,
      0,
      "exact-event-state",
      PARAMS,
      first,
      "event-free-rest",
    ).acceptedState;
    expect(JSON.stringify(cloneFiveWallCalciumAcceptedStateV1(state)))
      .toBe(JSON.stringify(state));
    expect(() => evaluateFiveWallCalciumTrialV1(
      state,
      0.05,
      PARAMS,
      second,
    )).toThrow(/schedule content changed/);
  });

  it("derives dynamics from the hash-owned snapshot rather than an opaque callback", () => {
    const schedule = createFixedSinusFiveWallCalciumEventScheduleV1(PARAMS);
    const forgedCallback = Object.freeze({
      ...schedule,
      listEventsOpenClosed: () => Object.freeze([Object.freeze({
        timeSec: 0.005,
        strengthByWall: Object.freeze({ LA: 999 }),
      })]),
    });
    expect(listFiveWallCalciumEventsOpenClosedV1(
      forgedCallback,
      0,
      0.02,
    )).toEqual(listFiveWallCalciumEventsOpenClosedV1(schedule, 0, 0.02));
    expect(splitFiveWallCalciumIntervalAtEventsV1(0, 0.02, forgedCallback))
      .toEqual([0.012, 0.02]);
  });
});

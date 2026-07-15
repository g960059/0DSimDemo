import { describe, expect, it } from "vitest";
import {
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  runPhaseB1WholeHeartCalciumEventCoordinatorV1,
  type PhaseB1CalciumDriveStateByWallV1,
  type PhaseB1CalciumParametersByWallV1,
  type PhaseB1WallCalciumDriveEventV1,
  type PhaseB1WholeHeartAlgebraicReinitializationCallbackV1,
  type PhaseB1WholeHeartAtomicStepCallbackV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const CALCIUM_BY_WALL = wallRecord((wallId, index) => Object.freeze({
  r: 0.04 + index * 0.01,
  d: 0.18 + index * 0.03,
}));

const PARAMETERS_BY_WALL = wallRecord((wallId, index) => Object.freeze({
  tauRiseSec: 0.025 + index * 0.001,
  tauDecaySec: 0.11 + index * 0.005,
  calciumDiastolicUM: 0.1 + index * 0.002,
  calciumAmplitudeUM: 0.8 + index * 0.01,
  electricalToCalciumDelaySec: 0.01,
  status: "candidate-prior" as const,
  evidenceId: `whole-heart-${wallId}-prior`,
}));

const MULTI_WALL_EVENTS = Object.freeze([
  event("RA", "ra", 0.3),
  event("LA", "z", 0.2),
  event("SEP", "sep", 0.4),
  event("LA", "a", 0.35),
  event("RVFW", "rv", 0.1),
]);

describe("Phase B1 whole-heart exact-calcium event coordinator", () => {
  it("propagates five sentinel pairs, solves once, and commits one multi-wall batch", () => {
    let atomicCalls = 0;
    let reinitializationCalls = 0;
    const input = baseInput("on", MULTI_WALL_EVENTS);
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...input,
      atomicStep: (step) => {
        atomicCalls += 1;
        expect(step.slsMode).toBe("on");
        expect(step.nonCalciumDifferentialStateAtStart).toHaveLength(49);
        expect(step.algebraicStateAtStart).toHaveLength(2);
        expect(step.newtonUnknownLabels).toHaveLength(51);
        expect(step.newtonUnknownLabels.some((label) => label.includes(".calcium.")))
          .toBe(false);
        for (const wallId of WALL_IDS) {
          const expected = propagateExactEventCalciumV1(
            exact(CALCIUM_BY_WALL[wallId]),
            0.1,
            PARAMETERS_BY_WALL[wallId],
          );
          expectPair(step.calciumDriveStateByWallAtEndLeftLimit[wallId], expected);
          expect(step.knownFreeCalciumUMByWallAtEndLeftLimit[wallId]).toBeCloseTo(
            evaluateExactEventCalciumV1(expected, PARAMETERS_BY_WALL[wallId])
              .freeCalciumUM,
            14,
          );
        }
        return acceptedAtomic(step.nonCalciumDifferentialStateAtStart, step.algebraicStateAtStart);
      },
      reinitializeAlgebraicState: (reinit) => {
        reinitializationCalls += 1;
        expect(reinit.eventKeys).toEqual([
          "LA:a",
          "LA:z",
          "RA:ra",
          "SEP:sep",
          "RVFW:rv",
        ]);
        expect(reinit.eventCountByWall).toEqual({
          LA: 2,
          RA: 1,
          LVFW: 0,
          SEP: 1,
          RVFW: 1,
        });
        expect(reinit.aggregateEventStrengthByWall).toEqual({
          LA: 0.55,
          RA: 0.3,
          LVFW: 0,
          SEP: 0.4,
          RVFW: 0.1,
        });
        for (const wallId of WALL_IDS) {
          const delta = reinit.aggregateEventStrengthByWall[wallId];
          expect(
            reinit.calciumDriveStateByWallAfterEventBatch[wallId].r
              - reinit.calciumDriveStateByWallAtEndLeftLimit[wallId].r,
          ).toBeCloseTo(delta, 15);
          expect(
            reinit.calciumDriveStateByWallAfterEventBatch[wallId].d
              - reinit.calciumDriveStateByWallAtEndLeftLimit[wallId].d,
          ).toBeCloseTo(delta, 15);
        }
        return {
          accepted: true,
          algebraicStateAfterReinitialization:
            reinit.algebraicStateAtEndLeftLimit.map((value) => value + 1),
        };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected whole-heart transaction success");
    expect(atomicCalls).toBe(1);
    expect(reinitializationCalls).toBe(1);
    expect(result.eventBatchMode).toBe("wall-partitioned-simultaneous-jump");
    expect(result.eventBatchCommitted).toBe(true);
    expect(result.atomicStepCallCount).toBe(1);
    expect(result.algebraicReinitializationCallCount).toBe(1);
    expect(result.nonCalciumDifferentialStateCount).toBe(49);
    expect(result.newtonUnknownCount).toBe(51);
    expect(result.algebraicStateAfterReinitialization).toEqual([1.45, 1.55]);
    expect(result.rollbackSnapshotReturned).toBe(false);
    for (const wallId of WALL_IDS) {
      expect(result.freeCalciumUMByWallAfterEventBatch[wallId]).toBeCloseTo(
        result.knownFreeCalciumUMByWallAtEndLeftLimit[wallId],
        14,
      );
    }
  });

  it("is invariant to input ordering while partitioning coincident events by wall", () => {
    const forward = runSuccessful("off", [...MULTI_WALL_EVENTS]);
    const reverse = runSuccessful("off", [...MULTI_WALL_EVENTS].reverse());
    expect(forward).toEqual(reverse);
    expect(forward.ok).toBe(true);
    if (forward.ok !== true) throw new Error("expected order-invariant success");
    expect(forward.nonCalciumDifferentialStateCount).toBe(44);
    expect(forward.newtonUnknownCount).toBe(46);
  });

  it.each([
    ["on", 49, 51],
    ["off", 44, 46],
  ] as const)(
    "binds SLS-%s to %i non-calcium and %i Newton unknowns",
    (mode, differentialCount, newtonCount) => {
      const result = runSuccessful(mode, [event("LVFW", "lv", 0.2)]);
      expect(result.ok).toBe(true);
      expect(result.nonCalciumDifferentialStateCount).toBe(differentialCount);
      expect(result.newtonUnknownCount).toBe(newtonCount);
      expect(result.nonCalciumDifferentialLabels).toHaveLength(differentialCount);
      expect(result.algebraicLabels).toEqual([
        "algebraic.triseg.V_m_S",
        "algebraic.triseg.y_m",
      ]);

      const invalid = baseInput(mode, [event("LVFW", "lv", 0.2)]);
      expect(() => runPhaseB1WholeHeartCalciumEventCoordinatorV1({
        ...invalid,
        nonCalciumDifferentialStateAtStart:
          invalid.nonCalciumDifferentialStateAtStart.slice(1),
      })).toThrow(new RegExp(`length ${differentialCount}`));
    },
  );

  it("returns all ten calcium values and both topology vectors on failure", () => {
    let reinitializationCalls = 0;
    const atomicFailure = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...baseInput("off", MULTI_WALL_EVENTS),
      atomicStep: () => ({ accepted: false, failureReason: "Newton rejected" }),
      reinitializeAlgebraicState: () => {
        reinitializationCalls += 1;
        return { accepted: true, algebraicStateAfterReinitialization: [0, 0] };
      },
    });
    expect(atomicFailure.ok).toBe(false);
    if (atomicFailure.ok !== false) throw new Error("expected atomic failure");
    expect(atomicFailure.failureStage).toBe("atomic-step");
    expect(atomicFailure.calciumDriveStateByWallRollbackSnapshot)
      .toEqual(CALCIUM_BY_WALL);
    expect(Object.values(atomicFailure.calciumDriveStateByWallRollbackSnapshot)
      .flatMap((state) => [state.r, state.d])).toHaveLength(10);
    expect(atomicFailure.nonCalciumDifferentialStateRollbackSnapshot).toHaveLength(44);
    expect(atomicFailure.algebraicStateRollbackSnapshot).toEqual([0.2, 0.3]);
    expect(atomicFailure.atomicStepCallCount).toBe(1);
    expect(atomicFailure.algebraicReinitializationCallCount).toBe(0);
    expect(atomicFailure.rollbackSnapshotReturned).toBe(true);
    expect(reinitializationCalls).toBe(0);

    const reinitFailure = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...baseInput("on", MULTI_WALL_EVENTS),
      reinitializeAlgebraicState: () => {
        throw new Error("reinitialization rejected");
      },
    });
    expect(reinitFailure.ok).toBe(false);
    if (reinitFailure.ok !== false) throw new Error("expected reinitialization failure");
    expect(reinitFailure.failureStage).toBe("algebraic-reinitialization");
    expect(reinitFailure.eventBatchCommitted).toBe(false);
    expect(reinitFailure.calciumDriveStateByWallRollbackSnapshot)
      .toEqual(CALCIUM_BY_WALL);
    expect(reinitFailure.nonCalciumDifferentialStateRollbackSnapshot).toHaveLength(49);
    expect(reinitFailure.algebraicStateRollbackSnapshot).toEqual([0.2, 0.3]);
    expect(reinitFailure.atomicStepCallCount).toBe(1);
    expect(reinitFailure.algebraicReinitializationCallCount).toBe(1);
    expect(reinitFailure.rollbackSnapshotReturned).toBe(true);
  });

  it("preflights event-state addition overflow before the atomic callback and returns a deep rollback snapshot", () => {
    const mutableCalciumState = Object.fromEntries(WALL_IDS.map((wallId) => [
      wallId,
      { ...CALCIUM_BY_WALL[wallId] },
    ])) as Record<FourChamberWallId, { r: number; d: number }>;
    mutableCalciumState.LA = { r: Number.MAX_VALUE, d: Number.MAX_VALUE };
    const mutableDifferential = Array.from(
      { length: 44 },
      (_, index) => index + 0.25,
    );
    const mutableAlgebraic = [0.2, 0.3];
    let atomicCalls = 0;
    let reinitializationCalls = 0;

    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...baseInput("off", [event("LA", "overflow", Number.MAX_VALUE)]),
      calciumDriveStateByWallAtStart: mutableCalciumState,
      nonCalciumDifferentialStateAtStart: mutableDifferential,
      algebraicStateAtStart: mutableAlgebraic,
      atomicStep: () => {
        atomicCalls += 1;
        return acceptedAtomic(mutableDifferential, mutableAlgebraic);
      },
      reinitializeAlgebraicState: () => {
        reinitializationCalls += 1;
        return { accepted: true, algebraicStateAfterReinitialization: [0, 0] };
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected event-batch preparation failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.failureReason).toMatch(/state must remain finite/);
    expect(result.atomicStepCallCount).toBe(0);
    expect(result.algebraicReinitializationCallCount).toBe(0);
    expect(atomicCalls).toBe(0);
    expect(reinitializationCalls).toBe(0);

    mutableCalciumState.LA.r = 0;
    mutableCalciumState.LA.d = 0;
    mutableDifferential[0] = -1;
    mutableAlgebraic[0] = -1;
    expect(result.calciumDriveStateByWallRollbackSnapshot.LA).toEqual({
      r: Number.MAX_VALUE,
      d: Number.MAX_VALUE,
    });
    expect(result.nonCalciumDifferentialStateRollbackSnapshot[0]).toBe(0.25);
    expect(result.algebraicStateRollbackSnapshot).toEqual([0.2, 0.3]);
    expect(Object.isFrozen(result.calciumDriveStateByWallRollbackSnapshot)).toBe(true);
    expect(Object.isFrozen(result.calciumDriveStateByWallRollbackSnapshot.LA)).toBe(true);
    expect(Object.isFrozen(result.nonCalciumDifferentialStateRollbackSnapshot)).toBe(true);
    expect(Object.isFrozen(result.algebraicStateRollbackSnapshot)).toBe(true);
  });

  it("preflights post-jump free-calcium finiteness before the atomic callback", () => {
    const endTimeSec = Number.MIN_VALUE;
    const calciumState = wallRecord((wallId) => wallId === "LA"
      ? Object.freeze({ r: 1, d: 1 + Number.EPSILON })
      : CALCIUM_BY_WALL[wallId]);
    const parameters = wallRecord((wallId) => Object.freeze({
      ...PARAMETERS_BY_WALL[wallId],
      calciumAmplitudeUM: wallId === "LA"
        ? Number.MAX_VALUE
        : PARAMETERS_BY_WALL[wallId].calciumAmplitudeUM,
    }));
    let atomicCalls = 0;
    const input = baseInput("off", []);
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...input,
      endTimeSec,
      calciumDriveStateByWallAtStart: calciumState,
      calciumParametersByWall: parameters,
      coincidentEventsAtEnd: [{
        wallId: "LA",
        eventId: "free-calcium-overflow",
        calciumDriveTimeSec: endTimeSec,
        strength: 1e16,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      }],
      atomicStep: () => {
        atomicCalls += 1;
        return acceptedAtomic(
          input.nonCalciumDifferentialStateAtStart,
          input.algebraicStateAtStart,
        );
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected event-batch preparation failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.failureReason).toMatch(/calcium evaluation must remain finite/i);
    expect(result.atomicStepCallCount).toBe(0);
    expect(result.algebraicReinitializationCallCount).toBe(0);
    expect(atomicCalls).toBe(0);
  });

  it("returns rollback when finite event strengths overflow during wall aggregation", () => {
    let atomicCalls = 0;
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...baseInput("off", [
        event("LA", "overflow-a", Number.MAX_VALUE),
        event("LA", "overflow-b", Number.MAX_VALUE),
      ]),
      atomicStep: () => {
        atomicCalls += 1;
        return acceptedAtomicCallback({} as never);
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected aggregation failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.failureReason).toMatch(/aggregate event strength/);
    expect(result.aggregateEventStrengthByWall).toBeNull();
    expect(result.calciumDriveStateByWallAtEndLeftLimit).toBeNull();
    expect(result.atomicStepCallCount).toBe(0);
    expect(atomicCalls).toBe(0);
  });

  it("returns rollback when left-limit free-calcium evaluation overflows", () => {
    const input = baseInput("off", []);
    const calciumState = wallRecord((wallId) => wallId === "LA"
      ? Object.freeze({ r: 0, d: Number.MAX_VALUE })
      : CALCIUM_BY_WALL[wallId]);
    let atomicCalls = 0;
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...input,
      endTimeSec: Number.MIN_VALUE,
      calciumDriveStateByWallAtStart: calciumState,
      atomicStep: () => {
        atomicCalls += 1;
        return acceptedAtomic(
          input.nonCalciumDifferentialStateAtStart,
          input.algebraicStateAtStart,
        );
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected left-limit failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.failureReason).toMatch(/calcium evaluation must remain finite/i);
    expect(result.aggregateEventStrengthByWall).toEqual({
      LA: 0,
      RA: 0,
      LVFW: 0,
      SEP: 0,
      RVFW: 0,
    });
    expect(result.knownFreeCalciumUMByWallAtEndLeftLimit).toBeNull();
    expect(result.atomicStepCallCount).toBe(0);
    expect(atomicCalls).toBe(0);
  });

  it("rejects an equal jump that loses free-calcium continuity to floating-point rounding", () => {
    const endTimeSec = Number.MIN_VALUE;
    const calciumState = wallRecord((wallId) => wallId === "LA"
      ? Object.freeze({ r: 1, d: 1 + Number.EPSILON })
      : CALCIUM_BY_WALL[wallId]);
    const input = baseInput("off", []);
    let atomicCalls = 0;
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...input,
      endTimeSec,
      calciumDriveStateByWallAtStart: calciumState,
      coincidentEventsAtEnd: [{
        wallId: "LA",
        eventId: "rounding-discontinuity",
        calciumDriveTimeSec: endTimeSec,
        strength: 1e16,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      }],
      atomicStep: () => {
        atomicCalls += 1;
        return acceptedAtomic(
          input.nonCalciumDifferentialStateAtStart,
          input.algebraicStateAtStart,
        );
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected continuity failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.failureReason).toMatch(/free-calcium continuity/);
    expect(result.atomicStepCallCount).toBe(0);
    expect(atomicCalls).toBe(0);
  });

  it("skips whole-heart algebraic reinitialization for an empty event batch", () => {
    let reinitializationCalls = 0;
    const result = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      ...baseInput("off", []),
      reinitializeAlgebraicState: () => {
        reinitializationCalls += 1;
        return { accepted: true, algebraicStateAfterReinitialization: [9, 9] };
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected empty-batch success");
    expect(reinitializationCalls).toBe(0);
    expect(result.eventBatchCommitted).toBe(false);
    expect(result.algebraicReinitializationCallCount).toBe(0);
    expect(result.algebraicStateAfterReinitialization)
      .toEqual(result.algebraicStateAtEndLeftLimit);
  });
});

function baseInput(
  mode: "on" | "off",
  events: readonly PhaseB1WallCalciumDriveEventV1[],
) {
  return {
    startTimeSec: 0,
    endTimeSec: 0.1,
    slsMode: mode,
    calciumDriveStateByWallAtStart: CALCIUM_BY_WALL,
    calciumParametersByWall: PARAMETERS_BY_WALL,
    nonCalciumDifferentialStateAtStart: Array.from(
      { length: mode === "on" ? 49 : 44 },
      (_, index) => index + 0.25,
    ),
    algebraicStateAtStart: [0.2, 0.3],
    coincidentEventsAtEnd: [...events],
    atomicStep: acceptedAtomicCallback,
    reinitializeAlgebraicState: acceptedReinitializationCallback,
  } as const;
}

function runSuccessful(
  mode: "on" | "off",
  events: readonly PhaseB1WallCalciumDriveEventV1[],
) {
  return runPhaseB1WholeHeartCalciumEventCoordinatorV1(baseInput(mode, events));
}

const acceptedAtomicCallback: PhaseB1WholeHeartAtomicStepCallbackV1 = (input) =>
  acceptedAtomic(
    input.nonCalciumDifferentialStateAtStart,
    input.algebraicStateAtStart,
  );

function acceptedAtomic(
  differential: readonly number[],
  algebraic: readonly number[],
) {
  return {
    accepted: true as const,
    nonCalciumDifferentialStateAtEndLeftLimit:
      differential.map((value) => value + 0.1),
    algebraicStateAtEndLeftLimit: algebraic.map((value) => value + 0.25),
  };
}

const acceptedReinitializationCallback:
PhaseB1WholeHeartAlgebraicReinitializationCallbackV1 = (input) => ({
  accepted: true,
  algebraicStateAfterReinitialization:
    input.algebraicStateAtEndLeftLimit.map((value) => value + 1),
});

function event(
  wallId: FourChamberWallId,
  eventId: string,
  strength: number,
): PhaseB1WallCalciumDriveEventV1 {
  return Object.freeze({
    wallId,
    eventId,
    calciumDriveTimeSec: 0.1,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function exact(
  state: Readonly<{ r: number; d: number }>,
): readonly [number, number] {
  return [state.r, state.d];
}

function expectPair(
  actual: Readonly<{ r: number; d: number }>,
  expected: readonly [number, number],
): void {
  expect(actual.r).toBeCloseTo(expected[0], 15);
  expect(actual.d).toBeCloseTo(expected[1], 15);
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId, index: number) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId, index) => [
    wallId,
    build(wallId, index),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

void (CALCIUM_BY_WALL satisfies PhaseB1CalciumDriveStateByWallV1);
void (PARAMETERS_BY_WALL satisfies PhaseB1CalciumParametersByWallV1);
void (PARAMETERS_BY_WALL.LA satisfies ExactEventCalciumParametersV1);

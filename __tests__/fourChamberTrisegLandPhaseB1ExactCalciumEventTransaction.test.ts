import { describe, expect, it } from "vitest";
import {
  applyExactCalciumDriveEventV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  type CalciumDriveEventV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
  runPhaseB1ExactCalciumEventTransactionV1,
  type PhaseB1AlgebraicReinitializationCallbackV1,
  type PhaseB1AtomicStepCallbackV1,
  type PhaseB1ExactCalciumEventTransactionInputV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/exactCalciumEventTransactionV1";

const PARAMETERS: Readonly<ExactEventCalciumParametersV1> = Object.freeze({
  tauRiseSec: 0.03,
  tauDecaySec: 0.12,
  calciumDiastolicUM: 0.11,
  calciumAmplitudeUM: 0.89,
  electricalToCalciumDelaySec: 0.012,
  status: "candidate-prior",
  evidenceId: "phase-b1-event-transaction-test-prior",
});

describe("Phase B1 per-wall exact-calcium event transaction component", () => {
  it("solves an endpoint event from the pre-jump left-limit and reinitializes once", () => {
    const startState: ExactEventCalciumStateV1 = [0.2, 0.4];
    const differential = [1, 2];
    const algebraic = [3, 4];
    const event = calciumEvent("endpoint", 0.25, 0.7);
    const expectedPre = propagateExactEventCalciumV1(
      startState,
      0.05,
      PARAMETERS,
    );
    const expectedPost = applyExactCalciumDriveEventV1(expectedPre, event);
    let atomicCalls = 0;
    let reinitializationCalls = 0;

    const result = runPhaseB1ExactCalciumEventTransactionV1({
      startTimeSec: 0.2,
      endTimeSec: 0.25,
      calciumDriveStateAtStart: startState,
      nonCalciumDifferentialStateAtStart: differential,
      algebraicStateAtStart: algebraic,
      coincidentEventsAtEnd: [event],
      calciumParameters: PARAMETERS,
      atomicStep: (input) => {
        atomicCalls += 1;
        expect(input.forcingSide).toBe(PHASE_B1_PRE_JUMP_FORCING_SIDE_V1);
        expectStateClose(input.calciumDriveStateAtEndLeftLimit, expectedPre);
        expect(input.knownFreeCalciumUMAtEndLeftLimit).toBeCloseTo(
          evaluateExactEventCalciumV1(expectedPre, PARAMETERS).freeCalciumUM,
          14,
        );
        expect(Object.isFrozen(input)).toBe(true);
        expect(Object.isFrozen(input.nonCalciumDifferentialStateAtStart)).toBe(true);
        return {
          accepted: true,
          nonCalciumDifferentialStateAtEndLeftLimit: [1.1, 2.2],
          algebraicStateAtEndLeftLimit: [3.3, 4.4],
        };
      },
      reinitializeAlgebraicState: (input) => {
        reinitializationCalls += 1;
        expect(input.eventIds).toEqual(["endpoint"]);
        expectStateClose(input.calciumDriveStateAtEndLeftLimit, expectedPre);
        expectStateClose(input.calciumDriveStateAfterEventBatch, expectedPost);
        expect(input.nonCalciumDifferentialStateAtAcceptedEnd).toEqual([1.1, 2.2]);
        expect(Object.isFrozen(input)).toBe(true);
        return {
          accepted: true,
          algebraicStateAfterReinitialization: [3.5, 4.6],
        };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected endpoint transaction success");
    expect(atomicCalls).toBe(1);
    expect(reinitializationCalls).toBe(1);
    expect(result.forcingSide).toBe("pre-jump-left-limit");
    expect(result.scope).toBe("single-wall-calcium-pair");
    expect(result.callbackContract).toBe("side-effect-free-candidate-evaluation");
    expect(result.eventIds).toEqual(["endpoint"]);
    expectStateClose(result.calciumDriveStateAtEndLeftLimit, expectedPre);
    expectStateClose(result.calciumDriveStateAfterEventBatch, expectedPost);
    expect(result.nonCalciumDifferentialStateAtEndLeftLimit).toEqual([1.1, 2.2]);
    expect(result.nonCalciumDifferentialStateAfterEventBatch).toEqual([1.1, 2.2]);
    expect(result.nonCalciumDifferentialStateChangedByEventBatch).toBe(false);
    expect(result.algebraicStateAfterReinitialization).toEqual([3.5, 4.6]);
    expect(result.atomicStepCallCount).toBe(1);
    expect(result.algebraicReinitializationCallCount).toBe(1);
    expect(result.rollbackSnapshotReturned).toBe(false);
    expect(result.monolithicSlsOnUnknownCount51Implemented).toBe(false);
    expect(result.monolithicSlsOffUnknownCount46Implemented).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(differential).toEqual([1, 2]);
    expect(algebraic).toEqual([3, 4]);
  });

  it("applies coincident events as one canonical order-invariant batch", () => {
    const events = [
      calciumEvent("z-event", 0.1, 0.2),
      calciumEvent("a-event", 0.1, 0.35),
      calciumEvent("m-event", 0.1, 0.15),
    ] as const;
    const forward = runSuccessful([...events]);
    const reverse = runSuccessful([...events].reverse());

    expect(forward).toEqual(reverse);
    if (!forward.ok || !reverse.ok) throw new Error("coincident event transaction failed");
    expect(forward.eventIds).toEqual(["a-event", "m-event", "z-event"]);
    expect(forward.aggregateEventStrength).toBeCloseTo(0.7, 15);
    expect(forward.eventBatchMode).toBe("single-aggregate-jump");
    expect(forward.calciumDriveStateAfterEventBatch[0]
      - forward.calciumDriveStateAtEndLeftLimit[0]).toBeCloseTo(0.7, 15);
    expect(forward.calciumDriveStateAfterEventBatch[1]
      - forward.calciumDriveStateAtEndLeftLimit[1]).toBeCloseTo(0.7, 15);
    expect(forward.algebraicReinitializationCallCount).toBe(1);
  });

  it("keeps empty-batch algebraics at left-limit parity without reinitializing", () => {
    let atomicCalls = 0;
    let reinitializationCalls = 0;
    const result = runSuccessful([], {
      atomicStep: (input) => {
        atomicCalls += 1;
        return acceptedAtomic(input);
      },
      reinitializeAlgebraicState: (input) => {
        reinitializationCalls += 1;
        return {
          accepted: true,
          algebraicStateAfterReinitialization:
            input.algebraicStateAtEndLeftLimit.map((value) => value + 1),
        };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected empty-batch transaction success");
    expect(atomicCalls).toBe(1);
    expect(reinitializationCalls).toBe(0);
    expect(result.eventIds).toEqual([]);
    expect(result.eventBatchMode).toBe("empty-batch-no-jump");
    expect(result.eventBatchCommitted).toBe(false);
    expect(result.algebraicReinitializationCallCount).toBe(0);
    expect(result.calciumDriveStateAfterEventBatch)
      .toEqual(result.calciumDriveStateAtEndLeftLimit);
    expect(result.algebraicStateAfterReinitialization)
      .toEqual(result.algebraicStateAtEndLeftLimit);
  });

  it("matches an explicit manual split at the endpoint and at t plus delta", () => {
    const events = [
      calciumEvent("one", 0.1, 0.4),
      calciumEvent("two", 0.1, 0.25),
    ];
    const result = runSuccessful(events);
    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected manual-split transaction success");

    const manualPre = propagateExactEventCalciumV1([0.1, 0.25], 0.1, PARAMETERS);
    const manualPost = applyExactCalciumDriveEventV1(
      manualPre,
      calciumEvent("manual-aggregate", 0.1, 0.65),
    );
    expectStateClose(result.calciumDriveStateAtEndLeftLimit, manualPre);
    expectStateClose(result.calciumDriveStateAfterEventBatch, manualPost);

    const deltaSec = 1e-5;
    const transactionAtDelta = propagateExactEventCalciumV1(
      result.calciumDriveStateAfterEventBatch,
      deltaSec,
      PARAMETERS,
    );
    const manualAtDelta = propagateExactEventCalciumV1(
      manualPost,
      deltaSec,
      PARAMETERS,
    );
    expectStateClose(transactionAtDelta, manualAtDelta);
    expect(evaluateExactEventCalciumV1(transactionAtDelta, PARAMETERS).freeCalciumUM)
      .toBeCloseTo(
        evaluateExactEventCalciumV1(manualAtDelta, PARAMETERS).freeCalciumUM,
        14,
      );
  });

  it("never exposes the post-jump drive state as retrospective atomic-step forcing", () => {
    const event = calciumEvent("endpoint", 0.1, 0.8);
    const expectedLeftLimit = propagateExactEventCalciumV1(
      [0.1, 0.25],
      0.1,
      PARAMETERS,
    );
    let driveSeenByAtomicStep: readonly number[] | undefined;
    const result = runSuccessful([event], {
      atomicStep: (input) => {
        driveSeenByAtomicStep = [...input.calciumDriveStateAtEndLeftLimit];
        return {
          accepted: true,
          nonCalciumDifferentialStateAtEndLeftLimit: [
            input.calciumDriveStateAtEndLeftLimit[0],
            input.calciumDriveStateAtEndLeftLimit[1],
          ],
          algebraicStateAtEndLeftLimit: [...input.algebraicStateAtStart],
        };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok !== true) throw new Error("expected forcing-provenance transaction success");
    expect(driveSeenByAtomicStep).toEqual(expectedLeftLimit);
    expect(driveSeenByAtomicStep).not.toEqual(result.calciumDriveStateAfterEventBatch);
    expect(result.nonCalciumDifferentialStateAtEndLeftLimit)
      .toEqual(expectedLeftLimit);
    expect(result.calciumDriveStateAfterEventBatch[0])
      .toBeGreaterThan(expectedLeftLimit[0]);
    // The scalar calcium is continuous at the instant; drive-state provenance is decisive.
    expect(result.freeCalciumUMAfterEventBatch)
      .toBeCloseTo(result.knownFreeCalciumUMAtEndLeftLimit, 14);
  });

  it("returns start-state rollback snapshots when either callback rejects or throws", () => {
    const differential = [2, 3];
    const algebraic = [5, 7];
    const startCalcium: ExactEventCalciumStateV1 = [0.1, 0.25];
    const event = calciumEvent("rollback", 0.1, 0.5);
    let reinitializationCallsAfterAtomicRejection = 0;
    const rejectedAtomic = runPhaseB1ExactCalciumEventTransactionV1({
      ...baseInput([event]),
      calciumDriveStateAtStart: startCalcium,
      nonCalciumDifferentialStateAtStart: differential,
      algebraicStateAtStart: algebraic,
      atomicStep: () => ({ accepted: false, failureReason: "Newton rejected" }),
      reinitializeAlgebraicState: () => {
        reinitializationCallsAfterAtomicRejection += 1;
        return { accepted: true, algebraicStateAfterReinitialization: [0, 0] };
      },
    });
    expect(rejectedAtomic.ok).toBe(false);
    if (rejectedAtomic.ok !== false) throw new Error("expected atomic rejection");
    expect(rejectedAtomic.failureStage).toBe("atomic-step");
    expect(rejectedAtomic.eventBatchCommitted).toBe(false);
    expect(rejectedAtomic.calciumDriveStateRollbackSnapshot).toEqual(startCalcium);
    expect(rejectedAtomic.nonCalciumDifferentialStateRollbackSnapshot)
      .toEqual(differential);
    expect(rejectedAtomic.algebraicStateRollbackSnapshot).toEqual(algebraic);
    expect(rejectedAtomic.rollbackSnapshotReturned).toBe(true);
    expect(rejectedAtomic.algebraicReinitializationCallCount).toBe(0);
    expect(reinitializationCallsAfterAtomicRejection).toBe(0);

    let algebraicCalls = 0;
    const failedReinitialization = runPhaseB1ExactCalciumEventTransactionV1({
      ...baseInput([event]),
      calciumDriveStateAtStart: startCalcium,
      nonCalciumDifferentialStateAtStart: differential,
      algebraicStateAtStart: algebraic,
      atomicStep: () => ({
        accepted: true,
        nonCalciumDifferentialStateAtEndLeftLimit: [20, 30],
        algebraicStateAtEndLeftLimit: [50, 70],
      }),
      reinitializeAlgebraicState: () => {
        algebraicCalls += 1;
        throw new Error("algebraic reinitialization failed");
      },
    });
    expect(failedReinitialization.ok).toBe(false);
    if (failedReinitialization.ok !== false) {
      throw new Error("expected reinitialization failure");
    }
    expect(failedReinitialization.failureStage).toBe("algebraic-reinitialization");
    expect(failedReinitialization.eventBatchCommitted).toBe(false);
    expect(failedReinitialization.calciumDriveStateRollbackSnapshot).toEqual(startCalcium);
    expect(failedReinitialization.nonCalciumDifferentialStateRollbackSnapshot)
      .toEqual(differential);
    expect(failedReinitialization.algebraicStateRollbackSnapshot).toEqual(algebraic);
    expect(failedReinitialization.rollbackSnapshotReturned).toBe(true);
    expect(failedReinitialization.algebraicReinitializationCallCount).toBe(1);
    expect(algebraicCalls).toBe(1);
    expect(startCalcium).toEqual([0.1, 0.25]);
    expect(differential).toEqual([2, 3]);
    expect(algebraic).toEqual([5, 7]);
  });

  it("rejects open records and never mutates caller-owned arrays", () => {
    const input = baseInput([calciumEvent("strict", 0.1, 0.2)]);
    expect(() => runPhaseB1ExactCalciumEventTransactionV1({
      ...input,
      undeclared: true,
    } as never)).toThrow(/must contain exactly/);
    expect(() => runPhaseB1ExactCalciumEventTransactionV1({
      ...input,
      coincidentEventsAtEnd: [{
        ...input.coincidentEventsAtEnd[0],
        undeclared: true,
      } as never],
    })).toThrow(/must contain exactly/);

    const mutableDifferential = [1, 2];
    const mutableAlgebraic = [3, 4];
    const mutableParameters: ExactEventCalciumParametersV1 = { ...PARAMETERS };
    const result = runPhaseB1ExactCalciumEventTransactionV1({
      ...input,
      nonCalciumDifferentialStateAtStart: mutableDifferential,
      algebraicStateAtStart: mutableAlgebraic,
      calciumParameters: mutableParameters,
      atomicStep: (callbackInput) => {
        expect(callbackInput.nonCalciumDifferentialStateAtStart)
          .not.toBe(mutableDifferential);
        expect(callbackInput.algebraicStateAtStart).not.toBe(mutableAlgebraic);
        return acceptedAtomic(callbackInput);
      },
    });
    expect(result.ok).toBe(true);
    expect(mutableDifferential).toEqual([1, 2]);
    expect(mutableAlgebraic).toEqual([3, 4]);
    expect(Object.isFrozen(mutableParameters)).toBe(false);
    expect(mutableParameters).toEqual(PARAMETERS);
  });
});

function runSuccessful(
  events: readonly CalciumDriveEventV1[],
  overrides: Readonly<{
    atomicStep?: PhaseB1AtomicStepCallbackV1;
    reinitializeAlgebraicState?: PhaseB1AlgebraicReinitializationCallbackV1;
  }> = {},
) {
  return runPhaseB1ExactCalciumEventTransactionV1({
    ...baseInput(events),
    atomicStep: overrides.atomicStep ?? acceptedAtomic,
    reinitializeAlgebraicState:
      overrides.reinitializeAlgebraicState ?? acceptedReinitialization,
  });
}

function baseInput(
  events: readonly CalciumDriveEventV1[],
): PhaseB1ExactCalciumEventTransactionInputV1 {
  return {
    startTimeSec: 0,
    endTimeSec: 0.1,
    calciumDriveStateAtStart: [0.1, 0.25],
    nonCalciumDifferentialStateAtStart: [1, 2],
    algebraicStateAtStart: [3, 4],
    coincidentEventsAtEnd: [...events],
    calciumParameters: PARAMETERS,
    atomicStep: acceptedAtomic,
    reinitializeAlgebraicState: acceptedReinitialization,
  };
}

const acceptedAtomic: PhaseB1AtomicStepCallbackV1 = (input) => ({
  accepted: true,
  nonCalciumDifferentialStateAtEndLeftLimit:
    input.nonCalciumDifferentialStateAtStart.map((value) => value + 0.1),
  algebraicStateAtEndLeftLimit:
    input.algebraicStateAtStart.map((value) => value + 0.2),
});

const acceptedReinitialization: PhaseB1AlgebraicReinitializationCallbackV1 =
  (input) => ({
    accepted: true,
    algebraicStateAfterReinitialization:
      input.algebraicStateAtEndLeftLimit.map((value) => value + 0.3),
  });

function calciumEvent(
  eventId: string,
  calciumDriveTimeSec: number,
  strength: number,
): Readonly<CalciumDriveEventV1> {
  return {
    eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  };
}

function expectStateClose(
  actual: ExactEventCalciumStateV1,
  expected: ExactEventCalciumStateV1,
): void {
  expect(actual[0]).toBeCloseTo(expected[0], 15);
  expect(actual[1]).toBeCloseTo(expected[1], 15);
}

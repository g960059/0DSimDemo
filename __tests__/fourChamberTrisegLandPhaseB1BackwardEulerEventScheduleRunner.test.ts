import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1,
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_SLS_AUDIT_FAILURE_PROBE_V1_ID,
  classifyPhaseB1EventNominalGridBoundaryCoalescenceV1,
  classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1,
  isPhaseB1RunEndNominalGridBoundaryCoalescenceEligibleV1,
  runPhaseB1BackwardEulerEventScheduleFailureProbeV1,
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
  runPhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1,
  type PhaseB1BackwardEulerEventScheduleRunnerInputV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import type {
  PhaseB1WallCalciumDriveEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  createPhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
  type PhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import type {
  FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 explicit backward-Euler event schedule runner", () => {
  const candidateOff = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "off",
    sha256,
  );

  it("preflights the closed input and ordered (start,end] event schedule", () => {
    const base = scheduleInput(candidateOff, 0.25e-3, 0.25e-3, []);
    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      executor: "not-a-production-input-field",
    } as never)).toThrow();

    const sparseEvents = new Array(1) as PhaseB1WallCalciumDriveEventV1[];
    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      orderedEvents: sparseEvents,
    })).toThrow(/dense|hole/i);

    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      orderedEvents: [{
        ...event("LA", "extra-field", 0.1e-3),
        callback: "forbidden",
      } as never],
    })).toThrow();

    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      orderedEvents: [event("LA", "at-open-start", 0)],
    })).toThrow(/\(start,end\]/);

    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      orderedEvents: [
        event("LA", "later", 0.2e-3),
        event("RA", "earlier", 0.1e-3),
      ],
    })).toThrow(/nondecreasing/);

    expect(() => runPhaseB1BackwardEulerEventScheduleRunnerV1({
      ...base,
      orderedEvents: [
        event("LA", "duplicate", 0.1e-3),
        event("LA", "duplicate", 0.2e-3),
      ],
    })).toThrow(/duplicate wall\/event key/);
  });

  it("splits at one off-grid coincident event batch and then returns to the original nominal grid", () => {
    const sourceRegistry = candidateOff.model.newtonScaleRegistry;
    const result = runPhaseB1BackwardEulerEventScheduleRunnerV1(scheduleInput(
      candidateOff,
      0.5e-3,
      0.25e-3,
      [
        event("LVFW", "lv-off-grid", 0.125e-3, 0.02),
        event("LA", "la-off-grid", 0.125e-3, 0.01),
      ],
    ));
    if (result.completed === false) {
      throw new Error(`${result.failureStage}: ${result.failureReason}`);
    }

    expect(result.requestedSegments.map((segment) => segment.endTimeSec))
      .toEqual([0.125e-3, 0.25e-3, 0.5e-3]);
    expect(result.requestedSegments.map((segment) =>
      segment.nominalGridBoundaryTimeSec))
      .toEqual([0.25e-3, 0.25e-3, 0.5e-3]);
    expect(result.requestedSegments.map((segment) =>
      segment.offGridEventSplit))
      .toEqual([true, false, false]);
    expect(result.requestedSegments.map((segment) =>
      segment.endedAtNominalGridBoundary))
      .toEqual([false, true, true]);
    expect(result.requestedSegments[0].eventKeysAtEnd)
      .toEqual(["LA:la-off-grid", "LVFW:lv-off-grid"]);
    expect(result.requestedSegments.slice(1).every((segment) =>
      segment.eventKeysAtEnd.length === 0)).toBe(true);
    expect(result.requestedSegmentCount).toBe(3);
    expect(result.acceptedTransactionCount).toBe(3);
    expect(result.attemptedTransactionCount).toBe(3);
    expect(result.eventBoundaryCount).toBe(1);
    expect(result.offGridEventSplitCount).toBe(1);
    expect(result.allOrderedEventsCommittedExactlyOnce).toBe(true);
    expect(result.registryObjectReusedAcrossAllAttempts).toBe(true);
    expect(result.modelObjectAtRunStart).toBe(candidateOff.model);
    expect(result.wallMaterialBindingObjectAtRunStart)
      .toBe(candidateOff.wallMaterialBinding);
    expect(result.newtonScaleRegistryObjectAtRunStart).toBe(sourceRegistry);
    expect(result.attempts.every((attempt) =>
      attempt.registryObjectIdentityAtInvocation)).toBe(true);
    expect(result.expectedNewtonUnknownCount).toBe(46);
    expect(result.everyAcceptedTransactionHasExpectedNewtonTopology).toBe(true);
    expect(result.everyAcceptedTransactionProjectionClippingClampAndFallbackFree)
      .toBe(true);
    expect(result.everyAcceptedTransactionContractAuditPass).toBe(true);
    expect(result
      .acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity)
      .toBe(true);
    expect(result
      .acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity)
      .toBe(true);
    expect(result.uncommittedAcceptedAttemptTransactionCount).toBe(0);
    expect(result.committedTransactionProvenanceAuditPass).toBe(true);
    expect(result.eventScheduleComponentPass).toBe(true);
    expect(result.originalNominalGridRetainedAcrossEventSplits).toBe(true);
    expect(result.hiddenSubdivisionUsed).toBe(false);
    expect(result.adaptiveRescalingApplied).toBe(false);
    expect(result.fullBeatAcceptancePass).toBe(false);
    expect(result.periodicityAcceptancePass).toBe(false);
    expect(result.physiologicalValidationPass).toBe(false);
    expect(result.phaseB1AcceptancePass).toBe(false);
    expect(result.modelCoreIntegration).toBe(false);
    expect(result.browserRuntimeAdopted).toBe(false);
    expect(result.releaseRuntimeReachable).toBe(false);
    expect(result.testOnly).toBe(true);
  }, 60_000);

  it.each([
    {
      label: "event is the immediate predecessor at 0.03 + 0.012",
      startTimeSec: 0.041,
      eventTimeSec: 0.03 + 0.012,
      expectedRawMinimum: true,
      expectedDirection: "event-immediate-predecessor" as const,
      expectedCoalescenceCount: 1,
    },
    {
      label: "event is the immediate successor at 0.17 + 0.012",
      startTimeSec: 0.181,
      eventTimeSec: 0.17 + 0.012,
      expectedRawMinimum: false,
      expectedDirection: "event-immediate-successor" as const,
      expectedCoalescenceCount: 1,
    },
    {
      label: "event and nominal boundary are exactly equal at 0.16 + 0.012",
      startTimeSec: 0.171,
      eventTimeSec: 0.16 + 0.012,
      expectedRawMinimum: true,
      expectedDirection: null,
      expectedCoalescenceCount: 0,
    },
  ])(
    "avoids a binary64 nominal sliver when $label",
    ({
      startTimeSec,
      eventTimeSec,
      expectedRawMinimum,
      expectedDirection,
      expectedCoalescenceCount,
    }) => {
      const nominalDtSec = 0.001;
      const previousEndpoint = createPhaseB1EndpointStateV1({
        timeSec: startTimeSec,
        differentialState: candidateOff.warmStart.endpoint.differentialState,
        triSegCoordinates: candidateOff.warmStart.endpoint.triSegCoordinates,
      });
      const endTimeSec = startTimeSec + 2 * nominalDtSec;
      const result = runPhaseB1BackwardEulerEventScheduleRunnerV1({
        model: candidateOff.model,
        wallMaterialBinding: candidateOff.wallMaterialBinding,
        previousEndpoint,
        endTimeSec,
        nominalDtSec,
        orderedEvents: [event(
          "LA",
          "binary64-adjacent-event",
          eventTimeSec,
        )],
      });
      if (result.completed === false) {
        throw new Error(`${result.failureStage}: ${result.failureReason}`);
      }

      const firstNominalBoundary = startTimeSec + nominalDtSec;
      expect(Object.is(result.requestedSegments[0].endTimeSec, eventTimeSec))
        .toBe(true);
      expect(result.requestedSegments.map((segment) => segment.endTimeSec))
        .toEqual([eventTimeSec, endTimeSec]);
      expect(result.requestedSegments).toHaveLength(2);
      expect(result.acceptedTransactions).toHaveLength(2);
      expect(result.requestedSegments[0].rawMinimumBoundaryTimeSec)
        .toBe(Math.min(firstNominalBoundary, eventTimeSec, endTimeSec));
      expect(result.requestedSegments[0].requestedEndIsRawMinimumBoundary)
        .toBe(expectedRawMinimum);
      expect(result.requestedSegments[0]
        .oneUlpNominalGridBoundaryCoalescenceDirection)
        .toBe(expectedDirection);
      expect(result.requestedSegments[0]
        .oneUlpNominalGridBoundaryCoalesced)
        .toBe(expectedCoalescenceCount === 1);
      expect(result.oneUlpNominalGridBoundaryCoalescenceCount)
        .toBe(expectedCoalescenceCount);
      expect(result.requestedSegments.every((segment) =>
        segment.requestedEndBoundarySelectionPolicyPass)).toBe(true);
      expect(result.everyRequestedSegmentBoundarySelectionPolicyPass)
        .toBe(true);
      expect(result.eventTimeSnappingApplied).toBe(false);
      expect(result.epsilonBoundaryToleranceApplied).toBe(false);
      expect(result.eventScheduleComponentPass).toBe(true);
    },
    60_000,
  );

  it("coalesces only exact run-end/grid neighbours and inventories canonical schedule offsets plus absolute addition", () => {
    const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      sha256,
    );
    const supportedDtSec = [0.001, 0.0005, 0.00025] as const;
    for (const nominalDtSec of supportedDtSec) {
      let exactRunEndCount = 0;
      let adjacentRunEndCount = 0;
      let exactEventCount = 0;
      let adjacentEventCount = 0;
      const nominalStepsPerCycle = Math.round(
        schedule.cycleLengthSec / nominalDtSec,
      );
      for (let cycleIndex = 0; cycleIndex < 100; cycleIndex += 1) {
        const startTimeSec = cycleIndex * schedule.cycleLengthSec;
        const endTimeSec = (cycleIndex + 1) * schedule.cycleLengthSec;
        const finalNominalGridBoundaryTimeSec = startTimeSec
          + nominalStepsPerCycle * nominalDtSec;
        const runEndDirection =
          classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
            finalNominalGridBoundaryTimeSec,
            endTimeSec,
          );
        if (Object.is(finalNominalGridBoundaryTimeSec, endTimeSec)) {
          exactRunEndCount += 1;
          expect(runEndDirection).toBeNull();
        } else {
          adjacentRunEndCount += 1;
          expect(runEndDirection).not.toBeNull();
        }
        const selectedFinalBoundaryTimeSec = runEndDirection === null
          ? Math.min(finalNominalGridBoundaryTimeSec, endTimeSec)
          : endTimeSec;
        expect(Object.is(selectedFinalBoundaryTimeSec, endTimeSec)).toBe(true);

        for (const scheduledEvent of schedule.events) {
          const eventTimeSec = startTimeSec
            + scheduledEvent.calciumDriveOffsetWithinCycleSec;
          const nearestNominalGridBoundaryTimeSec = startTimeSec
            + Math.round(
              scheduledEvent.calciumDriveOffsetWithinCycleSec / nominalDtSec,
            ) * nominalDtSec;
          const eventDirection =
            classifyPhaseB1EventNominalGridBoundaryCoalescenceV1(
              nearestNominalGridBoundaryTimeSec,
              eventTimeSec,
            );
          if (Object.is(eventTimeSec, nearestNominalGridBoundaryTimeSec)) {
            exactEventCount += 1;
            expect(eventDirection).toBeNull();
          } else {
            adjacentEventCount += 1;
            expect(eventDirection).not.toBeNull();
          }
        }
      }
      expect({ exactRunEndCount, adjacentRunEndCount }).toEqual({
        exactRunEndCount: 73,
        adjacentRunEndCount: 27,
      });
      expect({ exactEventCount, adjacentEventCount }).toEqual({
        exactEventCount: 497,
        adjacentEventCount: 3,
      });
    }

    const bugCycleStartTimeSec = 5 * schedule.cycleLengthSec;
    const bugCycleEndTimeSec = 6 * schedule.cycleLengthSec;
    const bugLastNominalGridBoundaryTimeSec = bugCycleStartTimeSec
      + 800 * 0.001;
    expect(bugLastNominalGridBoundaryTimeSec).toBe(4.8);
    expect(bugCycleEndTimeSec).toBe(4.800000000000001);
    expect(classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
      bugLastNominalGridBoundaryTimeSec,
      bugCycleEndTimeSec,
    )).toBe("run-end-immediate-predecessor");
  });

  it.each([
    {
      label: "run end has the nominal grid as its immediate predecessor",
      endTimeSec: nextUp(0.002),
      expectedDirection: "run-end-immediate-predecessor" as const,
      expectedCoalesced: true,
    },
    {
      label: "run end has the nominal grid as its immediate successor",
      endTimeSec: nextDown(0.002),
      expectedDirection: "run-end-immediate-successor" as const,
      expectedCoalesced: true,
    },
    {
      label: "run end exactly equals the nominal grid",
      endTimeSec: 0.002,
      expectedDirection: null,
      expectedCoalesced: false,
    },
  ])(
    "selects the exact run end without moving its endpoint event when $label",
    ({ endTimeSec, expectedDirection, expectedCoalesced }) => {
      const result = runPhaseB1BackwardEulerEventScheduleRunnerV1(
        scheduleInput(candidateOff, endTimeSec, 0.001, [
          event("LA", "exact-run-end-event", endTimeSec),
        ]),
      );
      if (result.completed === false) {
        throw new Error(`${result.failureStage}: ${result.failureReason}`);
      }
      expect(result.requestedSegments.map((segment) => segment.endTimeSec))
        .toEqual([0.001, endTimeSec]);
      const terminalSegment = result.requestedSegments.at(-1)!;
      expect(terminalSegment.nominalGridBoundaryTimeSec).toBe(0.002);
      expect(terminalSegment.endedAtRunBoundary).toBe(true);
      expect(terminalSegment.endedAtEventBoundary).toBe(true);
      expect(terminalSegment.eventKeysAtEnd)
        .toEqual(["LA:exact-run-end-event"]);
      expect(terminalSegment
        .oneUlpRunEndNominalGridBoundaryCoalescenceDirection)
        .toBe(expectedDirection);
      expect(terminalSegment.oneUlpRunEndNominalGridBoundaryCoalesced)
        .toBe(expectedCoalesced);
      expect(result.oneUlpRunEndNominalGridBoundaryCoalescenceCount)
        .toBe(expectedCoalesced ? 1 : 0);
      expect(result.runEndTimeSnappingApplied).toBe(false);
      expect(Object.is(result.finalEndpoint.timeSec, endTimeSec)).toBe(true);
      expect(result.allOrderedEventsCommittedExactlyOnce).toBe(true);
      expect(result.eventScheduleComponentPass).toBe(true);
    },
    60_000,
  );

  it("rejects equal and two-ULP run-end/grid gaps from the coalescence classifier", () => {
    const gridTimeSec = 4.8;
    expect(classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
      gridTimeSec,
      gridTimeSec,
    )).toBeNull();
    expect(classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
      gridTimeSec,
      nextUp(nextUp(gridTimeSec)),
    )).toBeNull();
    expect(classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
      gridTimeSec,
      nextDown(nextDown(gridTimeSec)),
    )).toBeNull();
    const adjacentRunEndTimeSec = nextUp(gridTimeSec);
    expect(isPhaseB1RunEndNominalGridBoundaryCoalescenceEligibleV1(
      gridTimeSec,
      adjacentRunEndTimeSec,
      gridTimeSec,
    )).toBe(false);
    expect(isPhaseB1RunEndNominalGridBoundaryCoalescenceEligibleV1(
      gridTimeSec,
      adjacentRunEndTimeSec,
      adjacentRunEndTimeSec,
    )).toBe(true);
  });

  it("commits an earlier event at its exact time before coalescing the final run end", () => {
    const endTimeSec = nextUp(0.002);
    const eventTimeSec = 0.0015;
    const result = runPhaseB1BackwardEulerEventScheduleRunnerV1(
      scheduleInput(candidateOff, endTimeSec, 0.001, [
        event("RA", "earlier-event-before-run-end", eventTimeSec),
      ]),
    );
    if (result.completed === false) {
      throw new Error(`${result.failureStage}: ${result.failureReason}`);
    }
    expect(result.requestedSegments.map((segment) => segment.endTimeSec))
      .toEqual([0.001, eventTimeSec, endTimeSec]);
    expect(result.requestedSegments[1].eventKeysAtEnd)
      .toEqual(["RA:earlier-event-before-run-end"]);
    expect(result.requestedSegments[1]
      .oneUlpRunEndNominalGridBoundaryCoalescenceEligible).toBe(false);
    expect(result.requestedSegments[2]
      .oneUlpRunEndNominalGridBoundaryCoalesced).toBe(true);
    expect(result.eventBoundaryCount).toBe(1);
    expect(result.allOrderedEventsCommittedExactlyOnce).toBe(true);
    expect(result.eventScheduleComponentPass).toBe(true);
  }, 60_000);

  it.each([
    ["on", 51],
    ["off", 46],
  ] as const)(
    "retains the exact SLS-%s whole-heart Newton topology (%i)",
    (slsMode, expectedUnknownCount) => {
      const candidate = slsMode === "off"
        ? candidateOff
        : buildPhaseB1SyntheticEventFreeMonolithicCaseV1("on", sha256);
      const result = runPhaseB1BackwardEulerEventScheduleRunnerV1(
        scheduleInput(candidate, 0.125e-3, 0.125e-3, []),
      );
      if (result.completed === false) {
        throw new Error(`${result.failureStage}: ${result.failureReason}`);
      }
      expect(result.expectedNewtonUnknownCount).toBe(expectedUnknownCount);
      expect(result.acceptedTransactions).toHaveLength(1);
      expect(result.acceptedTransactions[0].leftLimitStep.unknownCount)
        .toBe(expectedUnknownCount);
      expect(result.acceptedTransactions[0].leftLimitStep.residualCount)
        .toBe(expectedUnknownCount);
      expect(result.acceptedTransactions[0].leftLimitStep
        .calciumNewtonUnknownCount).toBe(0);
      expect(result.acceptedTransactions[0].leftLimitStep.calciumResidualCount)
        .toBe(0);
      expect(result.eventScheduleComponentPass).toBe(true);
    },
    60_000,
  );

  it("records a root failure and commits its two successful retry children with the event only on the right child", () => {
    const result = runPhaseB1BackwardEulerEventScheduleFailureProbeV1(
      scheduleInput(candidateOff, 0.25e-3, 0.25e-3, [
        event("LVFW", "retry-endpoint", 0.25e-3, 0.02),
      ]),
      {
        probeId:
          PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
        failAttemptKeys: ["0:root"],
      },
    );
    if (result.completed === false) {
      throw new Error(`${result.failureStage}: ${result.failureReason}`);
    }

    expect(result.attempts.map((attempt) => attempt.binaryPath))
      .toEqual(["root", "L", "R"]);
    expect(result.attempts.map((attempt) => attempt.retryDepth))
      .toEqual([0, 1, 1]);
    expect(result.attempts.map((attempt) => attempt.refinementFactor))
      .toEqual([1, 2, 2]);
    expect(result.attempts.map((attempt) => attempt.accepted))
      .toEqual([false, true, true]);
    expect(result.attempts.map((attempt) =>
      attempt.committedToCompletedPrefix))
      .toEqual([false, true, true]);
    expect(result.attempts.map((attempt) => attempt.eventKeysAtEnd))
      .toEqual([
        ["LVFW:retry-endpoint"],
        [],
        ["LVFW:retry-endpoint"],
      ]);
    expect(result.attempts[0].testFailureInjected).toBe(true);
    expect(result.attempts[0].rollbackEndpointMatchesAttemptEntryExact)
      .toBe(true);
    expect(result.requestedSegments[0].acceptedTransactions).toHaveLength(2);
    expect(result.acceptedTransactionCount).toBe(2);
    expect(result.solverRetrySubdivisionCount).toBe(1);
    expect(result.solverRetryAttemptCount).toBe(2);
    expect(result.maximumRetryDepthUsed).toBe(1);
    expect(result.explicitSolverRetryUsed).toBe(true);
    expect(result.endpointEventsAssignedToFinalRightRetryChildOnly).toBe(true);
    expect(result.hiddenSubdivisionUsed).toBe(false);
    expect(result.registryObjectReusedAcrossAllAttempts).toBe(true);
    expect(result.acceptedTransactions).toEqual([
      result.attempts[1].acceptedTransaction,
      result.attempts[2].acceptedTransaction,
    ]);
    expect(result
      .acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity)
      .toBe(true);
    expect(result
      .acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity)
      .toBe(true);
    expect(result.uncommittedAcceptedAttemptTransactionCount).toBe(0);
    expect(result.committedTransactionProvenanceAuditPass).toBe(true);
    expect(result.eventScheduleComponentPass).toBe(true);
  }, 60_000);

  it("routes a deterministic root SLS pre-commit audit rejection to two passing explicit retry children", () => {
    const candidateOn = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const result = runPhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1(
      scheduleInput(candidateOn, 1e-3, 1e-3, [
        event("LVFW", "sls-audit-retry-endpoint", 1e-3, 0.02),
      ]),
      {
        probeId:
          PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_SLS_AUDIT_FAILURE_PROBE_V1_ID,
        failAttemptKeys: ["0:root"],
      },
    );
    if (result.completed === false) {
      throw new Error(`${result.failureStage}: ${result.failureReason}`);
    }

    expect(result.attempts.map((attempt) => attempt.binaryPath))
      .toEqual(["root", "L", "R"]);
    expect(result.attempts.map((attempt) => attempt.accepted))
      .toEqual([false, true, true]);
    expect(result.attempts.map((attempt) => attempt.committedToCompletedPrefix))
      .toEqual([false, true, true]);
    expect(result.attempts.map((attempt) => attempt.eventKeysAtEnd))
      .toEqual([
        ["LVFW:sls-audit-retry-endpoint"],
        [],
        ["LVFW:sls-audit-retry-endpoint"],
      ]);
    const root = result.attempts[0];
    expect(root.failureStage).toBe("sls-backward-euler-identity-audit");
    expect(root.testFailureInjected).toBe(true);
    expect(root.failedTransaction?.slsBackwardEulerPreCommitAudit)
      .not.toBeNull();
    expect(root.failedTransaction?.slsBackwardEulerPreCommitGatePass)
      .toBe(false);
    expect(root.failedTransaction?.coordinator?.eventBatchCommitted).toBe(false);
    expect(root.rollbackEndpointMatchesAttemptEntryExact).toBe(true);
    for (const transaction of result.acceptedTransactions) {
      expect(transaction.slsBackwardEulerPreCommitGatePass).toBe(true);
      expect(transaction.slsBackwardEulerPreCommitAudit
        .normalizedIdentityAccepted).toBe(true);
      expect(transaction.testSlsBackwardEulerAuditFailureInjected).toBe(false);
      expect(transaction.actualCommittedDurationSec).toBe(0.5e-3);
    }
    expect(result.acceptedTransactions).toEqual([
      result.attempts[1].acceptedTransaction,
      result.attempts[2].acceptedTransaction,
    ]);
    expect(result.solverRetrySubdivisionCount).toBe(1);
    expect(result.maximumRetryDepthUsed).toBe(1);
    expect(result.explicitSolverRetryUsed).toBe(true);
    expect(result.hiddenSubdivisionUsed).toBe(false);
    expect(result.testFailureProbeUsed).toBe(true);
    expect(result.committedTransactionProvenanceAuditPass).toBe(true);
    expect(result.eventScheduleComponentPass).toBe(true);
  }, 60_000);

  it("retains a completed prefix but discards all successful partial retry children when the right branch exhausts depth 3", () => {
    const result = runPhaseB1BackwardEulerEventScheduleFailureProbeV1(
      scheduleInput(candidateOff, 0.5e-3, 0.25e-3, [
        event("RVFW", "failed-segment-endpoint", 0.5e-3, 0.02),
      ]),
      {
        probeId:
          PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
        failAttemptKeys: ["1:root", "1:R", "1:RR", "1:RRR"],
      },
    );
    expect(result.completed).toBe(false);
    if (result.completed !== false) throw new Error("expected schedule failure");

    expect(result.completedRequestedSegmentCount).toBe(1);
    expect(result.completedTransactionCount).toBe(1);
    expect(result.completedRequestedSegments).toHaveLength(1);
    expect(result.completedTransactionsBeforeFailure).toHaveLength(1);
    expect(result.lastAcceptedEndpoint.timeSec).toBe(0.25e-3);
    expect(result.rollbackEndpoint).not.toBe(result.lastAcceptedEndpoint);
    expect(result.rollbackEndpoint).toEqual(result.lastAcceptedEndpoint);
    expect(result.completedRequestedSegments[0].exitEndpoint)
      .toBe(result.lastAcceptedEndpoint);
    expect(result.rollbackToFailedRequestedSegmentEntryExact).toBe(true);
    expect(result.partialRetryChildrenCommitted).toBe(false);
    expect(result.failedRequestedSegment.rollbackEndpoint)
      .toEqual(result.failedRequestedSegment.entryEndpoint);
    expect(result.failedRequestedSegment.rollbackEndpoint)
      .not.toBe(result.failedRequestedSegment.entryEndpoint);
    expect(result.failedRequestedSegment
      .rollbackToRequestedSegmentEntryExact).toBe(true);
    expect(result.failedRequestedSegment.attempts.map((attempt) =>
      attempt.binaryPath))
      .toEqual(["root", "L", "R", "RL", "RR", "RRL", "RRR"]);
    expect(result.attempts.map((attempt) => attempt.attemptIndex))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result.failedRequestedSegment.attempts.map((attempt) =>
      attempt.attemptIndexWithinRequestedSegment))
      .toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(result.failedRequestedSegment.attempts.filter((attempt) =>
      attempt.accepted).map((attempt) => attempt.binaryPath))
      .toEqual(["L", "RL", "RRL"]);
    expect(result.failedRequestedSegment.attempts.filter((attempt) =>
      attempt.accepted).every((attempt) =>
      attempt.committedToCompletedPrefix === false)).toBe(true);
    expect(result.failedRequestedSegment.attempts.filter((attempt) =>
      attempt.endpointEventBatchPresent).map((attempt) => attempt.binaryPath))
      .toEqual(["root", "R", "RR", "RRR"]);
    expect(result.failedRequestedSegment.failedAttempt.binaryPath).toBe("RRR");
    expect(result.failedRequestedSegment.failedAttempt.retryDepth).toBe(3);
    expect(result.failedRequestedSegment.failedAttempt.refinementFactor).toBe(8);
    expect(result.failedRequestedSegment
      .discardedProvisionalAcceptedTransactionCount).toBe(3);
    expect(result.failedRequestedSegment.solverRetrySubdivisionCount).toBe(3);
    expect(result.failedRequestedSegment.maximumRetryDepthUsed).toBe(3);
    expect(result.failedRequestedSegment.failureStage)
      .toBe("test-injected-transaction-failure");
    expect(result.committedEventBoundaryCount).toBe(0);
    expect(result.eventScheduleComponentPass).toBe(false);
    expect(result.fullBeatAcceptancePass).toBe(false);
    expect(result.periodicityAcceptancePass).toBe(false);
    expect(result.physiologicalValidationPass).toBe(false);
    expect(result.phaseB1AcceptancePass).toBe(false);
    expect(result.releaseRuntimeReachable).toBe(false);
  }, 60_000);

  it("publishes the fixed retry depth/refinement policy", () => {
    expect(PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1)
      .toEqual([0, 1, 2, 3]);
    expect(PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1)
      .toEqual([1, 2, 4, 8]);
    expect(PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1
      .oneUlpRunEndNominalBoundaryCoalescence)
      .toContain("immediately-adjacent-binary64");
    expect(PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1
      .runEndTimeSnappingAllowed).toBe(false);
    expect(PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1
      .epsilonBoundaryToleranceAllowed).toBe(false);
  });
});

function scheduleInput(
  candidate: PhaseB1SyntheticEventFreeMonolithicCaseV1,
  endTimeSec: number,
  nominalDtSec: number,
  orderedEvents: readonly PhaseB1WallCalciumDriveEventV1[],
): PhaseB1BackwardEulerEventScheduleRunnerInputV1 {
  return {
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    endTimeSec,
    nominalDtSec,
    orderedEvents,
  };
}

function event(
  wallId: FourChamberWallId,
  eventId: string,
  calciumDriveTimeSec: number,
  strength = 0,
): PhaseB1WallCalciumDriveEventV1 {
  return Object.freeze({
    wallId,
    eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function nextUp(value: number): number {
  return adjacentBinary64(value, 1n);
}

function nextDown(value: number): number {
  return adjacentBinary64(value, -1n);
}

function adjacentBinary64(value: number, bitDelta: 1n | -1n): number {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  view.setBigUint64(0, view.getBigUint64(0, false) + bitDelta, false);
  return view.getFloat64(0, false);
}

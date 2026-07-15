import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildPhaseB1BackwardEulerCommittedIntervalLedgerV1,
  PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
  runPhaseB1BackwardEulerEventScheduleFailureProbeV1,
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import type {
  PhaseB1WallCalciumDriveEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
  type PhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  BLOOD_COMPARTMENT_IDS,
  DIRECTED_CLOSED_LOOP_EDGES,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

type Fixture = Readonly<{
  candidate: PhaseB1SyntheticEventFreeMonolithicCaseV1;
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
}>;

describe("four-chamber Phase B1 committed backward-Euler interval ledger", () => {
  let fixtureByMode: Readonly<Record<"on" | "off", Fixture>>;

  beforeAll(() => {
    fixtureByMode = Object.freeze({
      on: buildShortHorizonFixture("on"),
      off: buildShortHorizonFixture("off"),
    });
  }, 120_000);

  it.each([
    ["on", 51],
    ["off", 46],
  ] as const)(
    "integrates all eight canonical endpoint flows and audits the SLS-%s chain",
    (slsMode, expectedUnknownCount) => {
      const fixture = fixtureByMode[slsMode];
      const ledger = ledgerForFixture(fixture);

      expect(ledger.edgeOrder).toEqual(
        DIRECTED_CLOSED_LOOP_EDGES.map((edge) => edge.flowId),
      );
      expect(Object.keys(ledger.integratedEdgeVolumeByFlow)).toHaveLength(8);
      for (const edge of DIRECTED_CLOSED_LOOP_EDGES) {
        const volume = ledger.integratedEdgeVolumeByFlow[edge.flowId];
        expect(volume.upstream).toBe(edge.upstream);
        expect(volume.downstream).toBe(edge.downstream);
        expect(volume.forwardVolumeM3).toBeGreaterThanOrEqual(0);
        expect(volume.regurgitantVolumeM3).toBeGreaterThanOrEqual(0);
        expect(volume.signedVolumeM3).toBeCloseTo(
          volume.forwardVolumeM3 - volume.regurgitantVolumeM3,
          22,
        );
      }
      expect(ledger.maximumAbsoluteSignedDecompositionResidualM3)
        .toBeLessThan(1e-20);
      expect(Object.keys(ledger.compartmentClosureByCompartment))
        .toEqual([...BLOOD_COMPARTMENT_IDS]);
      for (const compartmentId of BLOOD_COMPARTMENT_IDS) {
        const closure = ledger.compartmentClosureByCompartment[compartmentId];
        expect(closure.closureResidualM3).toBeCloseTo(
          closure.integratedAcceptedStepResidualM3,
          20,
        );
        expect(closure.registryDerivedClosureAccepted).toBe(true);
      }
      expect(ledger.everyCompartmentRegistryDerivedClosureAccepted).toBe(true);
      expect(ledger.maximumRelativeTotalBloodVolumeDrift).toBeLessThan(
        PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_TOTAL_BLOOD_VOLUME_RELATIVE_TOLERANCE_V1,
      );
      expect(ledger.committedIntervalTotalBloodVolumeConservationGatePass)
        .toBe(true);
      expect(ledger.allAcceptedEndpointBloodVolumesPositive).toBe(true);
      expect(ledger.expectedNewtonUnknownCount).toBe(expectedUnknownCount);
      expect(ledger.expectedNewtonResidualCount).toBe(expectedUnknownCount);
      expect(ledger.everyStepExpectedNewtonTopology).toBe(true);
      expect(ledger.everyStepCalciumNewtonUnknownAndResidualCountZero)
        .toBe(true);
      expect(ledger.everyStepRegistryScaledNewtonToleranceAccepted).toBe(true);
      expect(ledger.minimumLandSimplexMargin).toBeGreaterThan(0);
      expect(ledger.everyStepSlsBackwardEulerIdentityAccepted).toBe(true);
      expect(ledger.slsBackwardEulerAudits).toHaveLength(2);
      expect(ledger.slsBackwardEulerAuditsConsumedFromCommittedTransactionsOnly)
        .toBe(true);
      expect(ledger.everyCommittedTransactionSlsAuditSourceBindingAuthenticated)
        .toBe(true);
      expect(ledger.slsBackwardEulerAudits).toEqual(
        fixture.scheduleRun.acceptedTransactions.map((transaction) =>
          transaction.slsBackwardEulerPreCommitAudit),
      );
      ledger.slsBackwardEulerAudits.forEach((audit, index) => {
        expect(audit).toBe(
          fixture.scheduleRun.acceptedTransactions[index]
            .slsBackwardEulerPreCommitAudit,
        );
      });
      expect(ledger.slsBackwardEulerAudits.every((audit) =>
        audit.mode === slsMode)).toBe(true);
      if (slsMode === "on") {
        expect(ledger.maximizingSlsIdentityTransactionIndex)
          .toBeGreaterThanOrEqual(0);
        expect(ledger.maximizingSlsIdentityTransactionIndex)
          .toBeLessThan(ledger.committedTransactionCount);
        expect(ledger.maximizingSlsIdentityEndTimeSec)
          .toBeGreaterThan(ledger.startTimeSec);
        expect(["LA", "RA", "LVFW", "SEP", "RVFW"])
          .toContain(ledger.maximizingSlsIdentityWallId);
      } else {
        expect(ledger.maximizingSlsIdentityTransactionIndex).toBeNull();
        expect(ledger.maximizingSlsIdentityEndTimeSec).toBeNull();
        expect(ledger.maximizingSlsIdentityWallId).toBeNull();
      }
      expect(ledger.slsStatePhysicallyAbsentInOffMode)
        .toBe(slsMode === "off");
      expect(ledger.everyStepProjectionClippingClampAndFallbackFree)
        .toBe(true);
      expect(ledger.maximumAbsoluteFlowChangeFromInitialM3PerSec)
        .toBeGreaterThan(0);
      expect(ledger.maximumAbsoluteBloodVolumeChangeFromInitialM3)
        .toBeGreaterThan(0);
      expect(ledger.responseExcursionDiagnosticsAreNotAcceptanceGates)
        .toBe(true);
      expect(ledger.structuralAndNumericalIntervalLedgerGatesPass).toBe(true);
      expect(ledger.intervalEnergyAcceptancePass).toBe(false);
      expect(ledger.temporalScope)
        .toBe("runner-committed-interval-not-cycle-certified");
      expect(ledger.sourceRunnerSuccessAuthenticatedInProcess).toBe(true);
      expect(ledger.runnerCommittedTransactionProvenanceVerified).toBe(true);
      expect(ledger.uncommittedOrFailedAttemptTransactionCountConsumed).toBe(0);
      expect(ledger.sourceTestFailureProbeUsed).toBe(false);
      expect(ledger.sourceRunEndTimeSnappingApplied).toBe(false);
      expect(ledger.sourceOneUlpRunEndNominalBoundaryCoalescencePolicy)
        .toBe(fixture.scheduleRun.oneUlpRunEndNominalBoundaryCoalescence);
      expect(ledger.runEndNominalGridBoundaryCoalescenceCount).toBe(0);
      expect(ledger.runEndNominalGridBoundaryCoalescenceTrace).toEqual([]);
      expect(ledger.nonProbeEvidenceEligibilityPass).toBe(true);
      expect(ledger.supercycleSemanticsEvaluatedByLedger).toBe(false);
      expect(ledger.fullBeatAcceptancePass).toBe(false);
      expect(ledger.periodicityAcceptancePass).toBe(false);
      expect(ledger.physiologicalValidationPass).toBe(false);
      expect(ledger.phaseB1AcceptancePass).toBe(false);
      expect(ledger.releaseRuntimeReachable).toBe(false);
      expect(Object.isFrozen(ledger)).toBe(true);
      expect(Object.isFrozen(ledger.integratedEdgeVolumeByFlow.Q_MV)).toBe(true);
      expect(Object.isFrozen(ledger.wallResponseByWall.LVFW)).toBe(true);
      expectRecursivelyFrozen(ledger);
    },
    120_000,
  );

  it("rejects open input and shape-compatible but unauthenticated runner clones", () => {
    const fixture = fixtureByMode.off;
    const validInput = inputForFixture(fixture);
    expect(() => buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      ...validInput,
      callback: () => undefined,
    } as never)).toThrow(/keys|exactly/i);

    const reconstructed = Object.freeze({
      ...fixture.scheduleRun,
    }) as PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    expect(() => buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun: reconstructed,
    })).toThrow(/live committed result|canonical runner/i);

    expect(() => buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun: fixture.scheduleRun,
      model: fixture.candidate.model,
    } as never)).toThrow(/keys|exactly/i);
  });

  it("consumes only the two committed retry children and never the failed root", () => {
    const candidate = fixtureByMode.off.candidate;
    const scheduleRun = runPhaseB1BackwardEulerEventScheduleFailureProbeV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.0005,
      nominalDtSec: 0.0005,
      orderedEvents: [event("LVFW", 0.0005)],
    }, {
      probeId:
        PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
      failAttemptKeys: ["0:root"],
    });
    if (scheduleRun.completed === false) {
      throw new Error(`${scheduleRun.failureStage}: ${scheduleRun.failureReason}`);
    }
    const ledger = buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun,
    });

    expect(scheduleRun.attempts.map((attempt) =>
      attempt.committedToCompletedPrefix)).toEqual([false, true, true]);
    expect(scheduleRun.acceptedTransactions[0])
      .toBe(scheduleRun.attempts[1].acceptedTransaction);
    expect(scheduleRun.acceptedTransactions[1])
      .toBe(scheduleRun.attempts[2].acceptedTransaction);
    expect(ledger.committedTransactionCount).toBe(2);
    expect(ledger.uncommittedOrFailedAttemptTransactionCountConsumed).toBe(0);
    expect(ledger.runnerCommittedTransactionProvenanceVerified).toBe(true);
    expect(ledger.sourceTestFailureProbeUsed).toBe(true);
    expect(ledger.nonProbeEvidenceEligibilityPass).toBe(false);
    expect(ledger.structuralAndNumericalIntervalLedgerGatesPass).toBe(false);
  }, 60_000);

  it("retains the exact authenticated run-end/grid coalescence trace", () => {
    const candidate = fixtureByMode.off.candidate;
    const endTimeSec = nextUp(0.002);
    const scheduleRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec,
      nominalDtSec: 0.001,
      orderedEvents: [event("LVFW", endTimeSec)],
    });
    if (scheduleRun.completed === false) {
      throw new Error(`${scheduleRun.failureStage}: ${scheduleRun.failureReason}`);
    }
    const ledger = buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun,
    });
    expect(scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount).toBe(1);
    expect(ledger.sourceRunEndTimeSnappingApplied).toBe(false);
    expect(ledger.runEndNominalGridBoundaryCoalescenceCount).toBe(1);
    expect(ledger.runEndNominalGridBoundaryCoalescenceTrace).toEqual([{
      requestedSegmentIndex: 1,
      nominalGridIndex: 1,
      originalNominalGridBoundaryTimeSec: 0.002,
      selectedRunEndTimeSec: endTimeSec,
      direction: "run-end-immediate-predecessor",
    }]);
  }, 60_000);

  it("rejects a failed runner result even when it contains provisional successful children", () => {
    const candidate = fixtureByMode.off.candidate;
    const failed = runPhaseB1BackwardEulerEventScheduleFailureProbeV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.0005,
      nominalDtSec: 0.0005,
      orderedEvents: [event("LVFW", 0.0005)],
    }, {
      probeId:
        PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID,
      failAttemptKeys: ["0:root", "0:R", "0:RR", "0:RRR"],
    });
    expect(failed.completed).toBe(false);
    if (!("failedRequestedSegment" in failed)) {
      throw new Error("failure probe unexpectedly passed");
    }
    expect(failed.failedRequestedSegment
      .discardedProvisionalAcceptedTransactionCount).toBeGreaterThan(0);

    expect(() => buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
      scheduleRun:
        failed as unknown as PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
    })).toThrow(/live committed result|canonical runner/i);
  }, 60_000);
});

function buildShortHorizonFixture(
  slsMode: "on" | "off",
): Fixture {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const scheduleRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    endTimeSec: 0.001,
    nominalDtSec: 0.0005,
    orderedEvents: [event("LVFW", 0.0005)],
  });
  if (scheduleRun.completed === false) {
    throw new Error(
      `${scheduleRun.failureStage}: ${scheduleRun.failureReason}`,
    );
  }
  return Object.freeze({
    candidate,
    scheduleRun,
  });
}

function ledgerForFixture(fixture: Fixture) {
  return buildPhaseB1BackwardEulerCommittedIntervalLedgerV1(
    inputForFixture(fixture),
  );
}

function inputForFixture(fixture: Fixture) {
  return {
    scheduleRun: fixture.scheduleRun,
  } as const;
}

function event(
  wallId: "LVFW",
  calciumDriveTimeSec: number,
): PhaseB1WallCalciumDriveEventV1 {
  return Object.freeze({
    wallId,
    eventId: "phase-b1-committed-interval-ledger-lvfw",
    calciumDriveTimeSec,
    strength: 0.2,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function nextUp(value: number): number {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  view.setBigUint64(0, view.getBigUint64(0, false) + 1n, false);
  return view.getFloat64(0, false);
}

function expectRecursivelyFrozen(
  value: unknown,
  visited: WeakSet<object> = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectRecursivelyFrozen(child, visited);
  }
}

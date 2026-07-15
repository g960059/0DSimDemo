import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID,
  PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1,
  runPhaseB1EventIntegratedMonolithicTransactionV1,
  runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

describe("four-chamber Phase B1 event-integrated monolithic transaction", () => {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "off",
    sha256,
  );

  it("keeps both production and test-probe inputs strictly closed", () => {
    const input = {
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [],
    } as const;
    expect(() => runPhaseB1EventIntegratedMonolithicTransactionV1({
      ...input,
      slsAuditFailureProbe: true,
    } as never)).toThrow(/keys|exactly/i);
    expect(() =>
      runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1(
        input,
        {
          probeId: PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID,
          callback: () => false,
        } as never,
      )).toThrow(/keys|exactly/i);
  });

  it("solves t-, commits one wall-partitioned jump, and reinitializes TriSeg once", () => {
    const result = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [{
        wallId: "LVFW",
        eventId: "lv-onset",
        calciumDriveTimeSec: 0.25e-3,
        strength: 0.2,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      }],
    });
    if (result.ok === false) {
      throw new Error(`${result.failureStage}: ${result.failureReason}`);
    }
    expect(result.leftLimitStep.unknownCount).toBe(46);
    expect(result.leftLimitStep.calciumResidualCount).toBe(0);
    expect(result.preJumpForcingParityVerified).toBe(true);
    expect(result.calciumParametersOwnedByWallBinding).toBe(true);
    expect(result.eventFreeMonolithicAtomicStepIntegrated).toBe(true);
    expect(result.aggregateEventBatchCommittedOnce).toBe(true);
    expect(result.coordinator.atomicStepCallCount).toBe(1);
    expect(result.coordinator.algebraicReinitializationCallCount).toBe(1);
    expect(result.postEventTriSegReinitialization).not.toBeNull();
    expect(result.postEventTriSegReinitialization?.converged).toBe(true);
    expect(result.postEventTriSegReinitialization
      ?.semismoothConstitutiveLinearizationUsed).toBe(true);
    expect(result.nextEndpoint.timeSec).toBe(0.25e-3);
    expect(result.nextEndpoint.differentialState.calciumByWall.LVFW)
      .toEqual({ r: 0.2, d: 0.2 });
    expect(result.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW)
      .toBe(result.coordinator.knownFreeCalciumUMByWallAtEndLeftLimit.LVFW);
    const leftVectors = encodePhaseB1EndpointTopologyVectorsV1(
      result.leftLimitStep.nextEndpointLeftLimit,
    );
    const finalVectors = encodePhaseB1EndpointTopologyVectorsV1(
      result.nextEndpoint,
    );
    expect(finalVectors.nonCalciumDifferentialState)
      .toEqual(leftVectors.nonCalciumDifferentialState);
    expect(result.rollbackSnapshotReturned).toBe(false);
    expect(result.projectionApplied).toBe(false);
    expect(result.hiddenStateClippingApplied).toBe(false);
  });

  it("returns a deep immutable start snapshot when atomic validation fails", () => {
    const mutableEndpoint = structuredClone(
      candidate.warmStart.endpoint,
    ) as PhaseB1EndpointStateV1;
    const originalLaVolume = mutableEndpoint.differentialState
      .bloodVolumesM3.LA;
    const runtime = candidate.wallMaterialBinding.runtimeByWall;
    const swappedBinding = {
      ...candidate.wallMaterialBinding,
      runtimeByWall: {
        ...runtime,
        LA: runtime.LVFW,
        LVFW: runtime.LA,
      },
    };
    const result = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: swappedBinding,
      previousEndpoint: mutableEndpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected transaction failure");
    expect(result.failureStage).toBe("integration-contract");
    expect(result.eventBatchCommitted).toBe(false);
    expect(result.rollbackSnapshotReturned).toBe(true);
    expect(result.leftLimitStep).toBeNull();
    expect(result.coordinator).toBeNull();
    expect(result.failureReason).toMatch(/canonical compiled binding/);
    (mutableEndpoint.differentialState.bloodVolumesM3 as { LA: number }).LA = 1;
    expect(result.rollbackEndpoint.differentialState.bloodVolumesM3.LA)
      .toBe(originalLaVolume);
    expect(Object.isFrozen(result.rollbackEndpoint)).toBe(true);
    expect(Object.isFrozen(
      result.rollbackEndpoint.differentialState.bloodVolumesM3,
    )).toBe(true);
  });

  it("rejects an accessor-forged binding without evaluating its getter", () => {
    let accessorReadCount = 0;
    const accessorBinding = Object.freeze(Object.defineProperty(
      { ...candidate.wallMaterialBinding },
      "runtimeByWall",
      {
        enumerable: true,
        configurable: false,
        get: () => {
          accessorReadCount += 1;
          return candidate.wallMaterialBinding.runtimeByWall;
        },
      },
    ));
    const result = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: accessorBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected binding rejection");
    expect(result.failureStage).toBe("integration-contract");
    expect(result.coordinator).toBeNull();
    expect(result.leftLimitStep).toBeNull();
    expect(accessorReadCount).toBe(0);
  });

  it("preflights an overflowing event batch before the monolithic callback", () => {
    const endpoint = structuredClone(
      candidate.warmStart.endpoint,
    ) as PhaseB1EndpointStateV1;
    const calcium = endpoint.differentialState.calciumByWall.LVFW as {
      r: number;
      d: number;
    };
    calcium.r = Number.MAX_VALUE;
    calcium.d = Number.MAX_VALUE;
    const result = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [
        calciumEvent("LVFW", "overflow", Number.MAX_VALUE),
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected event-batch failure");
    expect(result.failureStage).toBe("event-batch-preparation");
    expect(result.coordinator.ok).toBe(false);
    if (result.coordinator.ok !== false) {
      throw new Error("expected coordinator failure");
    }
    expect(result.coordinator.atomicStepCallCount).toBe(0);
    expect(result.leftLimitStep).toBeNull();
    expect(result.postEventTriSegReinitialization).toBeNull();
    expect(result.rollbackEndpoint.differentialState.calciumByWall.LVFW)
      .toEqual({ r: Number.MAX_VALUE, d: Number.MAX_VALUE });
    expect(Object.isFrozen(
      result.rollbackEndpoint.differentialState.calciumByWall.LVFW,
    )).toBe(true);
  });

  it.each(["on", "off"] as const)(
    "executes one atomic SLS-%s left-limit solve and no reinitialization for an empty batch",
    (slsMode) => {
      const topologyCandidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const result = runPhaseB1EventIntegratedMonolithicTransactionV1({
        model: topologyCandidate.model,
        wallMaterialBinding: topologyCandidate.wallMaterialBinding,
        previousEndpoint: topologyCandidate.warmStart.endpoint,
        endTimeSec: 0.25e-3,
        coincidentEventsAtEnd: [],
      });
      if (result.ok === false) {
        throw new Error(`${result.failureStage}: ${result.failureReason}`);
      }
      expect(result.leftLimitStep.unknownCount).toBe(slsMode === "on" ? 51 : 46);
      expect(result.actualCommittedDurationSec).toBe(0.25e-3);
      expect(result.slsBackwardEulerPreCommitPolicyId).toBe(
        PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
      );
      expect(result.slsBackwardEulerPreCommitGatePass).toBe(true);
      expect(result.slsBackwardEulerAuditCompletedBeforeEventCommit).toBe(true);
      expect(result.testSlsBackwardEulerAuditFailureInjected).toBe(false);
      expect(result.slsBackwardEulerPreCommitAudit.mode).toBe(slsMode);
      expect(result.slsBackwardEulerPreCommitAudit.normalizedIdentityAccepted)
        .toBe(true);
      expect(result.slsBackwardEulerPreCommitAudit.slsStatePhysicallyAbsent)
        .toBe(slsMode === "off");
      expect(result.coordinator.atomicStepCallCount).toBe(1);
      expect(result.coordinator.eventBatchCommitted).toBe(false);
      expect(result.coordinator.algebraicReinitializationCallCount).toBe(0);
      expect(result.postEventTriSegReinitialization).toBeNull();
      expect(result.nextEndpoint).toEqual(
        result.leftLimitStep.nextEndpointLeftLimit,
      );
    },
  );

  it("rolls back a dedicated pre-commit SLS audit rejection before the endpoint event", () => {
    const slsOnCandidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const result =
      runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1({
        model: slsOnCandidate.model,
        wallMaterialBinding: slsOnCandidate.wallMaterialBinding,
        previousEndpoint: slsOnCandidate.warmStart.endpoint,
        endTimeSec: 0.25e-3,
        coincidentEventsAtEnd: [
          calciumEvent("LVFW", "precommit-audit-rejection", 0.2),
        ],
      }, {
        probeId: PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID,
      });
    expect(result.ok).toBe(false);
    if (result.ok !== false) throw new Error("expected SLS audit rejection");
    expect(result.failureStage).toBe("sls-backward-euler-identity-audit");
    expect(result.failureReason).toContain(
      "whole-heart SLS backward-Euler pre-commit audit rejected",
    );
    expect(result.failureReason).toContain("testFailureInjected=true");
    expect(result.leftLimitStep?.converged).toBe(true);
    expect(result.slsBackwardEulerPreCommitAudit).not.toBeNull();
    expect(result.slsBackwardEulerPreCommitAudit?.normalizedIdentityAccepted)
      .toBe(true);
    expect(result.slsBackwardEulerPreCommitGatePass).toBe(false);
    expect(result.slsBackwardEulerAuditCompletedBeforeEventCommit).toBe(true);
    expect(result.testSlsBackwardEulerAuditFailureInjected).toBe(true);
    expect(result.coordinator?.ok).toBe(false);
    expect(result.coordinator?.eventBatchCommitted).toBe(false);
    expect(result.postEventTriSegReinitialization).toBeNull();
    expect(result.eventBatchCommitted).toBe(false);
    expect(result.rollbackEndpoint).toEqual(slsOnCandidate.warmStart.endpoint);
    expect(result.rollbackSnapshotReturned).toBe(true);
    expect(result.projectionApplied).toBe(false);
    expect(result.hiddenStateClippingApplied).toBe(false);
  });

  it("commits one exact endpoint event in SLS-on mode and uses its post-jump calcium only on the following interval", () => {
    const slsOnCandidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const first = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: slsOnCandidate.model,
      wallMaterialBinding: slsOnCandidate.wallMaterialBinding,
      previousEndpoint: slsOnCandidate.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [
        calciumEvent("LVFW", "sls-on-lv-onset", 0.2),
      ],
    });
    if (first.ok === false) {
      throw new Error(`${first.failureStage}: ${first.failureReason}`);
    }
    expect(first.leftLimitStep.unknownCount).toBe(51);
    expect(first.leftLimitStep.calciumNewtonUnknownCount).toBe(0);
    expect(first.coordinator.eventKeys).toEqual(["LVFW:sls-on-lv-onset"]);
    expect(first.coordinator.eventCount).toBe(1);
    expect(first.coordinator.aggregateEventStrengthByWall.LVFW).toBe(0.2);
    expect(first.coordinator.atomicStepCallCount).toBe(1);
    expect(first.coordinator.eventBatchCommitted).toBe(true);
    expect(first.aggregateEventBatchCommittedOnce).toBe(true);
    expect(first.coordinator.algebraicReinitializationCallCount).toBe(1);
    expect(first.algebraicReinitializationCallCount).toBeLessThanOrEqual(1);
    expect(first.postEventTriSegReinitialization?.converged).toBe(true);
    expect(first.nextEndpoint.differentialState.calciumByWall.LVFW)
      .toEqual({ r: 0.2, d: 0.2 });
    expect(first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW)
      .toBe(first.coordinator.knownFreeCalciumUMByWallAtEndLeftLimit.LVFW);
    const landAtJump = first.nextEndpoint.differentialState.landByWall.LVFW;

    const second = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: slsOnCandidate.model,
      wallMaterialBinding: slsOnCandidate.wallMaterialBinding,
      previousEndpoint: first.nextEndpoint,
      endTimeSec: 0.5e-3,
      coincidentEventsAtEnd: [],
    });
    if (second.ok === false) {
      throw new Error(`${second.failureStage}: ${second.failureReason}`);
    }
    expect(second.leftLimitStep.unknownCount).toBe(51);
    expect(second.leftLimitStep.nextEvaluation.freeCalciumUMByWall.LVFW)
      .toBeGreaterThan(
        first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW,
      );
    expect(second.nextEndpoint.differentialState.landByWall.LVFW)
      .not.toEqual(landAtJump);
    expect(second.coordinator.eventBatchCommitted).toBe(false);
    expect(second.coordinator.algebraicReinitializationCallCount).toBe(0);
  });

  it("aggregates an order-invariant five-wall event batch before one TriSeg reinitialization", () => {
    const events = WALL_IDS.flatMap((wallId, wallIndex) => [
      calciumEvent(wallId, `${wallId}-b`, 0.02 * (wallIndex + 1)),
      calciumEvent(wallId, `${wallId}-a`, 0.01 * (wallIndex + 1)),
    ]);
    const run = (orderedEvents: typeof events) =>
      runPhaseB1EventIntegratedMonolithicTransactionV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        endTimeSec: 0.25e-3,
        coincidentEventsAtEnd: orderedEvents,
      });
    const forward = run(events);
    const reverse = run([...events].reverse());
    if (forward.ok === false) {
      throw new Error(`${forward.failureStage}: ${forward.failureReason}`);
    }
    if (reverse.ok === false) {
      throw new Error(`${reverse.failureStage}: ${reverse.failureReason}`);
    }
    expect(forward.coordinator.eventKeys).toEqual(
      WALL_IDS.flatMap((wallId) => [`${wallId}:${wallId}-a`, `${wallId}:${wallId}-b`]),
    );
    expect(forward.coordinator.eventKeys).toEqual(reverse.coordinator.eventKeys);
    expect(forward.coordinator.aggregateEventStrengthByWall).toEqual(
      reverse.coordinator.aggregateEventStrengthByWall,
    );
    expect(forward.nextEndpoint).toEqual(reverse.nextEndpoint);
    expect(forward.coordinator.atomicStepCallCount).toBe(1);
    expect(forward.coordinator.algebraicReinitializationCallCount).toBe(1);
    expect(forward.postEventTriSegReinitialization?.converged).toBe(true);
    for (const [wallIndex, wallId] of WALL_IDS.entries()) {
      const aggregate = 0.03 * (wallIndex + 1);
      expect(forward.nextEndpoint.differentialState.calciumByWall[wallId].r)
        .toBeCloseTo(aggregate, 15);
      expect(forward.nextEndpoint.differentialState.calciumByWall[wallId].d)
        .toBeCloseTo(aggregate, 15);
    }
  });

  it("uses a boundary jump only on the following interval, then drives calcium and Land", () => {
    const first = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.25e-3,
      coincidentEventsAtEnd: [calciumEvent("LVFW", "lv-onset", 0.2)],
    });
    if (first.ok === false) {
      throw new Error(`${first.failureStage}: ${first.failureReason}`);
    }
    expect(first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW)
      .toBe(first.coordinator.knownFreeCalciumUMByWallAtEndLeftLimit.LVFW);
    const landAtJump = first.nextEndpoint.differentialState.landByWall.LVFW;

    const second = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: first.nextEndpoint,
      endTimeSec: 0.5e-3,
      coincidentEventsAtEnd: [],
    });
    if (second.ok === false) {
      throw new Error(`${second.failureStage}: ${second.failureReason}`);
    }
    expect(second.leftLimitStep.nextEvaluation.freeCalciumUMByWall.LVFW)
      .toBeGreaterThan(
        first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW,
      );
    expect(second.nextEndpoint.differentialState.landByWall.LVFW)
      .not.toEqual(landAtJump);
    expect(second.coordinator.eventBatchCommitted).toBe(false);
    expect(second.coordinator.algebraicReinitializationCallCount).toBe(0);
  });
});

function calciumEvent(
  wallId: FourChamberWallId,
  eventId: string,
  strength: number,
) {
  return Object.freeze({
    wallId,
    eventId,
    calciumDriveTimeSec: 0.25e-3,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay" as const,
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  runPhaseB1EventIntegratedMonolithicTransactionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  evaluatePhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1,
  type PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1,
  type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  auditPhaseB1WholeHeartMechanicalEnergyV1,
  evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1,
  type PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import {
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
} from "@/tools/myocardium/phaseB1LivePeriodicTerminalEvidenceSummaryV1";

describe("four-chamber Phase B1 committed-cycle mechanical energy audit", () => {
  it.each(["on", "off"] as const)(
    "retains a builder-issued SLS-%s accepted-stage snapshot without repeating the global Jacobian audit",
    (slsMode) => {
      const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
        slsMode,
        sha256,
      );
      const dtSec = 0.25e-3;
      const transaction = runPhaseB1EventIntegratedMonolithicTransactionV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: candidate.warmStart.endpoint,
        endTimeSec: candidate.warmStart.endpoint.timeSec + dtSec,
        coincidentEventsAtEnd: Object.freeze([]),
      });
      if (transaction.ok === false) {
        throw new Error(transaction.failureReason);
      }
      const snapshot =
        assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1({
          snapshot: transaction.mechanicalEnergyStageSnapshot,
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          acceptedStep: transaction.leftLimitStep,
          dtSec,
        });
      expect(snapshot.acceptedNewtonBaseJacobianRowsReused).toBe(true);
      expect(snapshot.fullGlobalJacobianAuditRepeatedForSnapshot).toBe(false);
      expect(snapshot.genericNewtonPolicyChanged).toBe(false);
      expect(snapshot.numericalResultChangedBySnapshot).toBe(false);
      expect(snapshot.kinematics.laggedEndpointStrainDifferenceUsed).toBe(false);
      expect(snapshot.correctedStageLedgerAccepted).toBe(true);
      for (const wallId of WALL_IDS) {
        expect(snapshot.activeMechanicalOutputPowerByWallW[wallId]).toBe(
          -snapshot.activeStressPowerByWallW[wallId],
        );
      }

      const independent = auditPhaseB1WholeHeartMechanicalEnergyV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: transaction.previousEndpoint,
        nextEndpointLeftLimit: transaction.leftLimitStep.nextEndpointLeftLimit,
        dtSec,
      });
      expect(snapshot.stage.continuousMechanicalEnergyResidualW).toBeCloseTo(
        independent.stage.continuousMechanicalEnergyResidualW,
        11,
      );
      expect(snapshot.stage.normalizedResidual).toBeCloseTo(
        independent.stage.normalizedResidual,
        11,
      );
      expect(snapshot.endpointStoredEnergy.deltaJ).toBeCloseTo(
        independent.endpointStoredEnergyJ.delta,
        14,
      );

      expect(() =>
        assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1({
          snapshot: Object.freeze({ ...snapshot }) as
            PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1,
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          acceptedStep: transaction.leftLimitStep,
          dtSec,
        })).toThrow(/forged or source-unbound/);
    },
  );

  it("keeps the equal-drive endpoint event mechanically energy-continuous", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "off",
      sha256,
    );
    const dtSec = 0.25e-3;
    const transaction = runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: candidate.warmStart.endpoint.timeSec + dtSec,
      coincidentEventsAtEnd: Object.freeze([{
        wallId: "LVFW" as const,
        eventId: "energy-continuity",
        calciumDriveTimeSec: candidate.warmStart.endpoint.timeSec + dtSec,
        strength: 1,
        timingOwner:
          "tissue-manifest-electrical-to-calcium-delay" as const,
      }]),
    });
    if (transaction.ok === false) throw new Error(transaction.failureReason);
    const left = transaction.mechanicalEnergyStageSnapshot
      .endpointStoredEnergy.nextLeftLimit.totalJ;
    const post =
      evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
        evaluatePhaseB1EventFreeEndpointV1(
          candidate.model,
          candidate.wallMaterialBinding,
          transaction.nextEndpoint,
        ),
      ).totalJ;
    expect(post).toBe(left);
  });

  it("uses actual committed durations without requiring binary64 equality to 0.8 seconds", () => {
    const startTimeSec = 2 * 0.8;
    const midTimeSec = 2;
    const endTimeSec = 3 * 0.8;
    const result = diagnostic({
      nominalDtSec: 0.4,
      nominalCycleLengthSec: 0.8,
      startTimeSec,
      endTimeSec,
      stages: [
        stage(0, startTimeSec, midTimeSec),
        stage(1, midTimeSec, endTimeSec),
      ],
    });
    expect(result.quadrature.actualCommittedDurationSecByTransaction).toEqual([
      midTimeSec - startTimeSec,
      endTimeSec - midTimeSec,
    ]);
    expect(result.quadrature.quadratureDurationSec).toBe(
      endTimeSec - startTimeSec,
    );
    expect(result.quadrature.quadratureDurationSec).not.toBe(0.8);
    expect(result.quadrature.durationPartitionRoundoffPass).toBe(true);
    expect(result.quadrature.nominalCycleLengthStrictEqualityRequired)
      .toBe(false);
  });

  it("preserves active, external, and Taylor-defect signs in the official residual", () => {
    const result = diagnostic({
      nominalDtSec: 1,
      nominalCycleLengthSec: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      stages: [stage(0, 0, 1, {
        flowDissipationW: 2,
        slsDissipationW: 3,
        activeMechanicalOutputPowerW: 4,
        prescribedExternalEnvironmentPowerW: 5,
        publishedTaylorGeometryPowerResidualW: 6,
        publishedTaylorGeometryNormalizationDenominatorW: 7,
        sourceCorrectedStageLedgerAccepted: false,
      })],
    });
    expect(result.officialCycleBalance.signedResidualJ).toBe(-10);
    expect(result.integratedTermsJ).toMatchObject({
      flowDissipation: 2,
      slsDissipation: 3,
      activeMechanicalOutput: 4,
      prescribedExternalEnvironment: 5,
      publishedTaylorGeometryPowerResidual: 6,
    });
    expect(result.publishedTaylorGeometryDiagnostics.workConjugacyAccepted)
      .toBe(false);
  });

  it("reports cancellation with L1 diagnostics without replacing the signed official gate", () => {
    const result = diagnostic({
      nominalDtSec: 1,
      nominalCycleLengthSec: 2,
      startTimeSec: 0,
      endTimeSec: 2,
      stages: [
        stage(0, 0, 1, {
          flowDissipationW: 1,
          sourceCorrectedStageLedgerAccepted: false,
        }),
        stage(1, 1, 2, {
          activeMechanicalOutputPowerW: 1,
          sourceCorrectedStageLedgerAccepted: false,
        }),
      ],
    });
    expect(result.officialCycleBalance.signedResidualJ).toBe(0);
    expect(result.cancellationDiagnostics.backwardEulerStepBalanceL1J).toBe(2);
    expect(result.cancellationDiagnostics.signedResidualSurvivalFraction).toBe(0);
    expect(result.cancellationDiagnostics.signedCancellationFraction).toBe(1);
    expect(result.cancellationDiagnostics.diagnosticOnlyNotAcceptanceGate)
      .toBe(true);
    expect(result.stageAudit.stageGatePass).toBe(false);
  });

  it("uses Neumaier summation for the official top-level signed balance", () => {
    const result = diagnostic({
      nominalDtSec: 1,
      nominalCycleLengthSec: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      stages: [stage(0, 0, 1, {
        nextLeftLimitStoredEnergyJ: 1e16,
        nextPostEventStoredEnergyJ: 1e16,
        flowDissipationW: 1,
        activeMechanicalOutputPowerW: 1e16,
        sourceCorrectedStageLedgerAccepted: false,
      })],
    });
    expect(1e16 + 1 - 1e16).toBe(0);
    expect(result.officialCycleBalance.signedResidualJ).toBe(1);
    expect(result.officialCycleBalance.normalizedResidual).toBeGreaterThan(0);
    expect(result.quadrature.summationPolicy).toBe(
      "Neumaier-binary64-in-canonical-accepted-transaction-order-v1",
    );

    const denominatorResult = diagnostic({
      nominalDtSec: 1,
      nominalCycleLengthSec: 1,
      startTimeSec: 0,
      endTimeSec: 1,
      stages: [stage(0, 0, 1, {
        nextLeftLimitStoredEnergyJ: 1e16,
        nextPostEventStoredEnergyJ: 1e16,
        flowDissipationW: 1,
        slsDissipationW: 1,
        sourceCorrectedStageLedgerAccepted: false,
      })],
    });
    expect(1e16 + 1 + 1).toBe(1e16);
    expect(denominatorResult.officialCycleBalance.normalizationDenominatorJ)
      .toBe(1e16 + 2);
  });

  it("keeps the quarter-millisecond gate closed for a nonzero event-energy jump even when the official residual cancels", () => {
    const dtSec = 0.00025;
    const result = diagnostic({
      nominalDtSec: dtSec,
      nominalCycleLengthSec: dtSec,
      startTimeSec: 0,
      endTimeSec: dtSec,
      stages: [stage(0, 0, dtSec, {
        eventAtEnd: true,
        nextLeftLimitStoredEnergyJ: 1,
        nextPostEventStoredEnergyJ: 2,
        storedEnergyRateW: 8_000,
        activeMechanicalOutputPowerW: 8_000,
      })],
    });
    expect(result.officialCycleBalance.signedResidualJ).toBe(0);
    expect(result.stageAudit.stageGatePass).toBe(true);
    expect(result.quadrature.durationPartitionRoundoffPass).toBe(true);
    expect(result.endpointStoredEnergyJ.partitionClosureRoundoffPass).toBe(true);
    expect(result.eventJumpAudit.everyEventStoredEnergyJumpRoundoffZero)
      .toBe(false);
    expect(result.quarterMillisecondSingleCycleEnergyGatePass).toBe(false);
  });

  it("keeps the quarter-millisecond gate closed when duration closure fails", () => {
    const dtSec = 0.00025;
    const result = diagnostic({
      nominalDtSec: dtSec,
      nominalCycleLengthSec: 2 * dtSec,
      startTimeSec: 0,
      endTimeSec: dtSec,
      stages: [stage(0, 0, dtSec)],
    });
    expect(result.quarterMillisecondSingleCycleEligibility).toBe(true);
    expect(result.officialCycleBalance.signedResidualJ).toBe(0);
    expect(result.stageAudit.stageGatePass).toBe(true);
    expect(result.endpointStoredEnergyJ.partitionClosureRoundoffPass).toBe(true);
    expect(result.eventJumpAudit.everyEventStoredEnergyJumpRoundoffZero)
      .toBe(true);
    expect(result.quadrature.durationPartitionRoundoffPass).toBe(false);
    expect(result.quarterMillisecondSingleCycleEnergyGatePass).toBe(false);
  });

  it("keeps the quarter-millisecond gate closed when endpoint partition closure fails", () => {
    const dtSec = 0.00025;
    const halfDtSec = dtSec / 2;
    const chainDriftJ = 128 * Number.EPSILON;
    const cancellationPowerW = chainDriftJ / halfDtSec;
    const result = diagnostic({
      nominalDtSec: dtSec,
      nominalCycleLengthSec: dtSec,
      startTimeSec: 0,
      endTimeSec: dtSec,
      stages: [
        stage(0, 0, halfDtSec),
        stage(1, halfDtSec, dtSec, {
          previousStoredEnergyJ: chainDriftJ,
          nextLeftLimitStoredEnergyJ: chainDriftJ,
          nextPostEventStoredEnergyJ: chainDriftJ,
          storedEnergyRateW: cancellationPowerW,
          activeMechanicalOutputPowerW: cancellationPowerW,
        }),
      ],
    });
    expect(result.officialCycleBalance.signedResidualJ).toBe(0);
    expect(result.stageAudit.stageGatePass).toBe(true);
    expect(result.quadrature.durationPartitionRoundoffPass).toBe(true);
    expect(result.eventJumpAudit.everyEventStoredEnergyJumpRoundoffZero)
      .toBe(true);
    expect(result.endpointStoredEnergyJ.partitionClosureRoundoffPass)
      .toBe(false);
    expect(result.quarterMillisecondSingleCycleEnergyGatePass).toBe(false);
  });

  it("opens only the downstream quarter-millisecond single-cycle gate", () => {
    const quarter = diagnostic({
      nominalDtSec: 0.00025,
      nominalCycleLengthSec: 0.00025,
      startTimeSec: 0,
      endTimeSec: 0.00025,
      stages: [stage(0, 0, 0.00025)],
    });
    expect(quarter.quarterMillisecondSingleCycleEnergyGatePass).toBe(true);
    expect(quarter.wholeHeartBackwardEulerEnergyAcceptancePass).toBe(false);
    expect(quarter.timestepConvergenceAcceptancePass).toBe(false);
    const half = diagnostic({
      nominalDtSec: 0.0005,
      nominalCycleLengthSec: 0.0005,
      startTimeSec: 0,
      endTimeSec: 0.0005,
      stages: [stage(0, 0, 0.0005)],
    });
    const one = diagnostic({
      nominalDtSec: 0.001,
      nominalCycleLengthSec: 0.001,
      startTimeSec: 0,
      endTimeSec: 0.001,
      stages: [stage(0, 0, 0.001)],
    });
    expect(half.quarterMillisecondSingleCycleEnergyGatePass).toBe(false);
    expect(one.quarterMillisecondSingleCycleEnergyGatePass).toBe(false);
    expect(half.oneOrHalfMillisecondOverallEnergyAcceptancePass).toBe(false);
    expect(one.oneOrHalfMillisecondOverallEnergyAcceptancePass).toBe(false);
  });

  it("rejects caller-reconstructed capsules and audit objects", () => {
    expect(() => buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1({
      terminalCycleCapsule: Object.freeze({}) as
        PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
      sha256Hex: sha256,
    })).toThrow(/not builder-issued/);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
        Object.freeze({}) as
          PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
        sha256,
      )).toThrow(/not builder-issued/);
  });

  // This is intentionally outside the ordinary heavy suite: a real 0.25 ms
  // terminal-attractor run may require several complete 0.8 s supercycles.
  // It must never be replaced with a forged or caller-reconstructed capsule.
  it.skipIf(
    process.env.CIRCLEHEART_TERMINAL_ENERGY_HEAVY_TESTS !== "1",
  )(
    "builds and reauthenticates cycle energy only from a live terminal capsule",
    () => {
      const parentManifest =
        buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
      const parentNumericalEvidence =
        buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
          parentManifest,
          sha256,
        );
      const schedule =
        buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
      let controller = initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
        sourceCase: parentNumericalEvidence.results.off.eventFreeCase,
        schedule,
        nominalDtSec: 0.00025,
        sha256Hex: sha256,
      });
      let terminal: ReturnType<
        typeof finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1
      > | null = null;
      while (terminal === null) {
        const retainedSourceCase = controller.sourceCase;
        const advanced = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
          controller,
          sha256Hex: sha256,
        });
        if (advanced.completedCycle === false) {
          throw new Error(
            `${advanced.failure.failureStage}: ${advanced.failure.failureReason}`,
          );
        }
        if (advanced.terminalResult !== null) {
          terminal =
            finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
              parentManifest,
              parentNumericalEvidence,
              schedule,
              sourceCase: retainedSourceCase,
              terminalResult: advanced.terminalResult,
              finalCommittedSupercycleAudit:
                advanced.committedSupercycleAudit,
              finalPeriodicCheckpoint: advanced.periodicCheckpoint,
              finalCycleEvidence: advanced.cycleEvidence,
              sha256Hex: sha256,
            });
        } else if (advanced.controller !== null) {
          controller = advanced.controller;
        } else {
          throw new Error("live periodic run lost both successor and terminal");
        }
      }
      if (terminal.completed === false) {
        throw new Error(
          `${terminal.failure.failureKind}: ${terminal.failure.contentSha256}`,
        );
      }
      const capsule = terminal.capsule;
      expect(
        assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
          capsule,
          sha256,
        ),
      ).toBe(capsule);
      expect(() =>
        finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          // The parent wrapper is content-equivalent but is not the exact
          // reconstructed source retained by the consumed controller.
          sourceCase: parentNumericalEvidence.results.off.eventFreeCase,
          terminalResult: capsule.terminalResult,
          finalCommittedSupercycleAudit:
            capsule.finalCommittedSupercycleAudit,
          finalPeriodicCheckpoint: capsule.finalPeriodicCheckpoint,
          finalCycleEvidence: capsule.finalCycleEvidence,
          sha256Hex: sha256,
        })).toThrow(/artifact authentication failed/i);
      expect(() =>
        finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          sourceCase: capsule.sourceCase,
          terminalResult: JSON.parse(JSON.stringify(capsule.terminalResult)),
          finalCommittedSupercycleAudit:
            capsule.finalCommittedSupercycleAudit,
          finalPeriodicCheckpoint: capsule.finalPeriodicCheckpoint,
          finalCycleEvidence: capsule.finalCycleEvidence,
          sha256Hex: sha256,
        })).toThrow(/not builder-issued/i);
      const audit =
        buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1({
          terminalCycleCapsule: capsule,
          sha256Hex: sha256,
        });
      expect(
        assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
          audit,
          sha256,
        ),
      ).toBe(audit);
      expect(audit.sourceTerminalCycleCapsule).toBe(capsule);
      expect(audit.stageTrace.stages).toHaveLength(
        capsule.sourceScheduleRun.acceptedTransactions.length,
      );
      expect(audit.aggregation.transactionCount).toBe(
        capsule.sourceScheduleRun.acceptedTransactions.length,
      );
      expect(audit.failedOrProvisionalTransactionsConsumed).toBe(0);
      expect(audit.sourceRunnerAttemptTraceContentSha256).toBe(
        capsule.sourceScheduleRunnerAttemptTraceContentSha256,
      );
      expect(audit.sourceCommittedIntervalLedgerSummaryContentSha256).toBe(
        capsule.committedIntervalLedgerSummaryContentSha256,
      );
      expect(audit.sourceInitialEndpointContentSha256).toBe(
        capsule.initialEndpointContentSha256,
      );
      expect(audit.sourceFinalEndpointContentSha256).toBe(
        capsule.finalEndpointContentSha256,
      );
      expect(audit.quarterMillisecondSingleCycleEnergyGatePass).toBe(
        audit.aggregation.quarterMillisecondSingleCycleEnergyGatePass,
      );
      expect(audit.cycleEnergyAcceptancePass).toBe(false);
      const summary = buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1({
        terminalCycleCapsule: capsule,
        committedCycleMechanicalEnergyAudit: audit,
        sha256Hex: sha256,
      });
      expect(
        assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
          summary,
          sha256,
        ),
      ).toBe(summary);
      expect(summary.terminalCycleCapsuleContentSha256).toBe(
        capsule.contentSha256,
      );
      expect(summary.committedCycleMechanicalEnergyAuditContentSha256).toBe(
        audit.contentSha256,
      );
      expect(summary.acceptedTransactionCount).toBe(
        capsule.sourceScheduleRun.acceptedTransactions.length,
      );
      expect(summary.numericalCycleRerunPerformed).toBe(false);
      expect(summary.cycleEnergyAcceptancePass).toBe(false);
      expect(() =>
        assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
          JSON.parse(JSON.stringify(summary)),
          sha256,
        )).toThrow(/not builder-issued/i);
    },
    14_400_000,
  );
});

function diagnostic(input: Readonly<{
  nominalDtSec: number;
  nominalCycleLengthSec: number;
  startTimeSec: number;
  endTimeSec: number;
  stages: readonly PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1[];
}>) {
  return evaluatePhaseB1BackwardEulerCommittedCycleMechanicalEnergyAggregationDiagnosticV1({
    ...input,
    initialStoredEnergyJ: input.stages[0].previousStoredEnergyJ,
    finalStoredEnergyJ:
      input.stages[input.stages.length - 1].nextPostEventStoredEnergyJ,
  });
}

function stage(
  transactionIndex: number,
  startTimeSec: number,
  endTimeSec: number,
  overrides: Partial<PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1> = {},
): PhaseB1BackwardEulerMechanicalEnergyAggregationStageV1 {
  const publishedTaylorGeometryPowerResidualW =
    overrides.publishedTaylorGeometryPowerResidualW ?? 0;
  return Object.freeze({
    transactionIndex,
    startTimeSec,
    endTimeSec,
    actualCommittedDurationSec: endTimeSec - startTimeSec,
    eventAtEnd: false,
    previousStoredEnergyJ: 0,
    nextLeftLimitStoredEnergyJ: 0,
    nextPostEventStoredEnergyJ: 0,
    storedEnergyRateW: 0,
    flowDissipationW: 0,
    slsDissipationW: 0,
    activeMechanicalOutputPowerW: 0,
    prescribedExternalEnvironmentPowerW: 0,
    triSegGeometryRuntimeAssembly:
      "published-taylor-2009-with-explicit-defect-correction" as const,
    triSegBendingStoredEnergyRateW: 0,
    geometryWorkConjugacyNormalizationDenominatorW:
      overrides.geometryWorkConjugacyNormalizationDenominatorW
        ?? overrides.publishedTaylorGeometryNormalizationDenominatorW
        ?? 1,
    geometryWorkConjugacyAccepted: false,
    publishedTaylorGeometryPowerResidualW,
    publishedTaylorGeometryNormalizationDenominatorW: 1,
    sourceCorrectedStageLedgerAccepted: true,
    sourceLandAdapterWorkClosureAccepted: true,
    sourceSlsBackwardEulerIdentityAccepted: true,
    ...overrides,
    geometryPowerBalanceCorrectionW:
      overrides.geometryPowerBalanceCorrectionW
        ?? publishedTaylorGeometryPowerResidualW,
    geometryWorkConjugacyResidualW:
      overrides.geometryWorkConjugacyResidualW
        ?? publishedTaylorGeometryPowerResidualW,
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

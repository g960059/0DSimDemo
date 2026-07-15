import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicFailureV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  validatePhaseB1NormalSinusBePeriodicCheckpointV1,
  type PhaseB1NormalSinusBePeriodicCheckpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  type PhaseB1LivePeriodicTerminalEvidenceSummaryV1,
} from "@/tools/myocardium/phaseB1LivePeriodicTerminalEvidenceSummaryV1";

export const PHASE_B1_LIVE_PERIODIC_RETAINED_MODE_RUN_V1_ID =
  "phase-b1-live-periodic-retained-mode-run-v1" as const;

export type PhaseB1LivePeriodicRetainedModeCycleRecordV1 = Readonly<{
  recordId: "phase-b1-live-periodic-retained-mode-cycle-record-v1";
  mode: "off" | "on";
  nominalDtSec: number;
  definitionContentSha256: string;
  scheduleContentSha256: string;
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  cycleElapsedSec: number;
  committedSupercycleAuditContentSha256: string;
  periodicCheckpointContentSha256: string;
  cycleEvidenceContentSha256: string;
  previousCycleEvidenceContentSha256: string | null;
  runnerAttemptTraceContentSha256: string;
  committedIntervalLedgerSummaryContentSha256: string;
  initialEndpointContentSha256: string;
  finalEndpointContentSha256: string;
  acceptedTransactionCount: number;
  attemptedTransactionCount: number;
  solverRetrySubdivisionCount: number;
  solverRetryAttemptCount: number;
  maximumRetryDepthUsed: number;
  oneUlpRunEndNominalGridBoundaryCoalescenceCount: number;
  maximumScaledResidualInfinityNorm: number;
  maximumScaledUpdateInfinityNorm: number;
  minimumLandSimplexMargin: number;
  maximumSlsNormalizedIdentityResidual: number;
  maximumSlsAbsoluteAlphaMismatch: number;
  cycleFinalTotalBloodVolumeM3: number;
  cumulativeRelativeTotalBloodVolumeDrift: number;
  adjacentMaximumNormalizedDistance: number;
  streakWindowMaximumNormalizedDistance: number;
  adjacentMaximumSlsNormalizedDistance: number | null;
  streakWindowMaximumSlsNormalizedDistance: number | null;
  systemicNetFlowUsableAsRelativeDenominator: boolean;
  maximumRelativeSignedNetFlowMismatch: number | null;
  maximumSignedDecompositionRelativeResidual: number;
  structuralAndNumericalIntervalLedgerGatesPass: boolean;
  upstreamPass: boolean;
  cycleLocalPass: boolean;
  streakWindowPass: boolean;
  consecutivePassingSupercycles: number;
  completedSupercycleCount: number;
  terminalStatus:
    | "running"
    | "converged"
    | "maximum-supercycles-exhausted";
  periodicConvergenceCriterionPass: boolean;
  singleStartPeriodOneCriterionPass: boolean;
  authenticatedInProcessBeforeSerialization: true;
  builderIssuedAuthenticationSurvivesSerialization: false;
  claimBoundary: ReturnType<
    typeof assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1
  >["claimBoundary"];
}>;

export type PhaseB1LivePeriodicRetainedModeRunSuccessV1 = Readonly<{
  completed: true;
  mode: "off" | "on";
  terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
  committedCycleMechanicalEnergyAudit:
    PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1;
  terminalEvidenceSummary: PhaseB1LivePeriodicTerminalEvidenceSummaryV1;
  livePeriodicFailure: null;
  terminalCycleCapsuleFailure: null;
}>;

export type PhaseB1LivePeriodicRetainedModeRunFailureV1 = Readonly<{
  completed: false;
  mode: "off" | "on";
  failureKind:
    | "live-periodic-cycle-failure"
    | "maximum-supercycles-exhausted";
  livePeriodicFailure: PhaseB1NormalSinusBeLivePeriodicFailureV1 | null;
  terminalCycleCapsuleFailure:
    PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1 | null;
}>;

export type PhaseB1LivePeriodicRetainedModeRunResultV1 =
  | PhaseB1LivePeriodicRetainedModeRunSuccessV1
  | PhaseB1LivePeriodicRetainedModeRunFailureV1;

export type RunPhaseB1LivePeriodicRetainedModeV1Input = Readonly<{
  parentManifest: PhaseB1QuiescentReferenceEvidenceManifestV1;
  parentNumericalEvidence:
    PhaseB1QuiescentReferenceNumericalEvidenceBundleV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  initialController: PhaseB1NormalSinusBeLivePeriodicControllerV1;
  emitCycleRecord: (record: PhaseB1LivePeriodicRetainedModeCycleRecordV1) => void;
  sha256Hex: CanonicalSha256HexProvider;
}>;

/**
 * Advances one already-initialized controller to its terminal boundary.
 * Successful cycles are streamed before terminal capsule/energy/summary
 * finalization. No numerical cycle is rerun, and a live failure is deliberately
 * returned without manufacturing the private terminal-capsule failure union.
 */
export function runPhaseB1LivePeriodicRetainedModeV1(
  input: RunPhaseB1LivePeriodicRetainedModeV1Input,
): PhaseB1LivePeriodicRetainedModeRunResultV1 {
  assertExactPlainRecordV1(input, [
    "parentManifest",
    "parentNumericalEvidence",
    "schedule",
    "initialController",
    "emitCycleRecord",
    "sha256Hex",
  ], "Phase B1 live-periodic retained mode run input");
  if (typeof input.emitCycleRecord !== "function") {
    throw new Error("retained mode run requires a cycle-record emitter");
  }
  if (typeof input.sha256Hex !== "function") {
    throw new Error("retained mode run requires a SHA-256 provider");
  }
  const parentManifest =
    assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
      input.parentManifest,
    );
  const parentNumericalEvidence =
    assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
      input.parentNumericalEvidence,
      parentManifest,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  let controller = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
    input.initialController,
  );
  const mode = controller.slsMode;
  const sourceCase = controller.sourceCase;
  if (
    !Object.is(controller.schedule, schedule)
    || !Object.is(
      sourceCase.inverse,
      parentNumericalEvidence.results[mode].eventFreeCase.inverse,
    )
  ) {
    throw new Error("retained mode controller differs from its paired parent");
  }

  while (true) {
    if (
      controller.completedCycleEvidenceCount
        >= controller.definition.maximumSupercycles
    ) {
      throw new Error("retained mode controller remained live at its fixed cap");
    }
    const cycleStartedAtMs = performance.now();
    const advanced = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
      controller,
      sha256Hex: input.sha256Hex,
    });
    const cycleElapsedSec = (performance.now() - cycleStartedAtMs) / 1000;
    if (advanced.completedCycle === false) {
      const failure =
        assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
          advanced.failure,
          input.sha256Hex,
        );
      return Object.freeze({
        completed: false as const,
        mode,
        failureKind: "live-periodic-cycle-failure" as const,
        livePeriodicFailure: failure,
        terminalCycleCapsuleFailure: null,
      });
    }

    const audit =
      assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
        advanced.committedSupercycleAudit,
        input.sha256Hex,
      );
    const evidence =
      assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
        advanced.cycleEvidence,
        input.sha256Hex,
      );
    const scheduleRun =
      assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
        audit.sourceScheduleRun,
      );
    const checkpoint = validatePhaseB1NormalSinusBePeriodicCheckpointV1(
      advanced.periodicCheckpoint,
      controller.definition,
      controller.periodicState.lastCheckpoint,
      input.sha256Hex,
    );
    assertCycleCrossLinks(controller, audit, checkpoint, evidence);
    input.emitCycleRecord(Object.freeze({
      recordId:
        "phase-b1-live-periodic-retained-mode-cycle-record-v1" as const,
      mode,
      nominalDtSec: controller.nominalDtSec,
      definitionContentSha256: controller.definition.contentSha256,
      scheduleContentSha256: controller.schedule.contentSha256,
      cycleIndex: audit.cycleIndex,
      startTimeSec: audit.startTimeSec,
      endTimeSec: audit.endTimeSec,
      cycleElapsedSec,
      committedSupercycleAuditContentSha256: audit.contentSha256,
      periodicCheckpointContentSha256: checkpoint.contentSha256,
      cycleEvidenceContentSha256: evidence.contentSha256,
      previousCycleEvidenceContentSha256:
        evidence.previousCycleEvidenceContentSha256,
      runnerAttemptTraceContentSha256:
        evidence.runnerAttemptTraceContentSha256,
      committedIntervalLedgerSummaryContentSha256:
        evidence.committedIntervalLedgerSummaryContentSha256,
      initialEndpointContentSha256: evidence.initialEndpointContentSha256,
      finalEndpointContentSha256: evidence.finalEndpointContentSha256,
      acceptedTransactionCount: scheduleRun.acceptedTransactionCount,
      attemptedTransactionCount: scheduleRun.attemptedTransactionCount,
      solverRetrySubdivisionCount: scheduleRun.solverRetrySubdivisionCount,
      solverRetryAttemptCount: scheduleRun.solverRetryAttemptCount,
      maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
      oneUlpRunEndNominalGridBoundaryCoalescenceCount:
        scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount,
      maximumScaledResidualInfinityNorm:
        audit.committedIntervalLedger.maximumScaledResidualInfinityNorm,
      maximumScaledUpdateInfinityNorm:
        audit.committedIntervalLedger.maximumScaledUpdateInfinityNorm,
      minimumLandSimplexMargin:
        audit.committedIntervalLedger.minimumLandSimplexMargin,
      maximumSlsNormalizedIdentityResidual:
        audit.committedIntervalLedger.maximumSlsNormalizedIdentityResidual,
      maximumSlsAbsoluteAlphaMismatch:
        audit.committedIntervalLedger.maximumSlsAbsoluteAlphaMismatch,
      cycleFinalTotalBloodVolumeM3:
        checkpoint.totalBloodVolume.cycleFinalTotalBloodVolumeM3,
      cumulativeRelativeTotalBloodVolumeDrift:
        checkpoint.totalBloodVolume.cumulativeRelativeTotalBloodVolumeDrift,
      adjacentMaximumNormalizedDistance:
        checkpoint.adjacentMetric.maximumNormalizedDistance,
      streakWindowMaximumNormalizedDistance:
        checkpoint.streakWindowMetric.maximumNormalizedDistance,
      adjacentMaximumSlsNormalizedDistance:
        checkpoint.adjacentMetric.maximumSlsNormalizedDistance,
      streakWindowMaximumSlsNormalizedDistance:
        checkpoint.streakWindowMetric.maximumSlsNormalizedDistance,
      systemicNetFlowUsableAsRelativeDenominator:
        checkpoint.flow.systemicNetFlowUsableAsRelativeDenominator,
      maximumRelativeSignedNetFlowMismatch:
        checkpoint.flow.maximumRelativeSignedNetFlowMismatch,
      maximumSignedDecompositionRelativeResidual:
        checkpoint.flow.maximumSignedDecompositionRelativeResidual,
      structuralAndNumericalIntervalLedgerGatesPass:
        audit.committedIntervalLedger
          .structuralAndNumericalIntervalLedgerGatesPass,
      upstreamPass: checkpoint.gates.upstreamPass,
      cycleLocalPass: checkpoint.gates.cycleLocalPass,
      streakWindowPass: checkpoint.gates.streakWindowPass,
      consecutivePassingSupercycles:
        checkpoint.consecutivePassingSupercycles,
      completedSupercycleCount: checkpoint.completedSupercycleCount,
      terminalStatus: checkpoint.terminalStatus,
      periodicConvergenceCriterionPass:
        checkpoint.periodicConvergenceCriterionPass,
      singleStartPeriodOneCriterionPass:
        checkpoint.singleStartPeriodOneCriterionPass,
      authenticatedInProcessBeforeSerialization: true as const,
      builderIssuedAuthenticationSurvivesSerialization: false as const,
      claimBoundary: evidence.claimBoundary,
    }));

    if (advanced.terminalResult !== null) {
      if (advanced.controller !== null) {
        throw new Error("retained mode cycle issued terminal and successor");
      }
      const terminal =
        assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
          advanced.terminalResult,
          input.sha256Hex,
        );
      assertTerminalCrossLinks(terminal, checkpoint, evidence);
      const finalized =
        finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
          parentManifest,
          parentNumericalEvidence,
          schedule,
          sourceCase,
          terminalResult: terminal,
          finalCommittedSupercycleAudit: audit,
          finalPeriodicCheckpoint: checkpoint,
          finalCycleEvidence: evidence,
          sha256Hex: input.sha256Hex,
        });
      if (finalized.completed === false) {
        const failure =
          assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
            finalized.failure,
            input.sha256Hex,
          );
        if (failure.failureKind !== "maximum-supercycles-exhausted") {
          throw new Error("retained terminal finalizer returned a live failure");
        }
        return Object.freeze({
          completed: false as const,
          mode,
          failureKind: "maximum-supercycles-exhausted" as const,
          livePeriodicFailure: null,
          terminalCycleCapsuleFailure: failure,
        });
      }
      const terminalCycleCapsule =
        assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
          finalized.capsule,
          input.sha256Hex,
        );
      const committedCycleMechanicalEnergyAudit =
        assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
          buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1({
            terminalCycleCapsule,
            sha256Hex: input.sha256Hex,
          }),
          input.sha256Hex,
        );
      const terminalEvidenceSummary =
        assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
          buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1({
            terminalCycleCapsule,
            committedCycleMechanicalEnergyAudit,
            sha256Hex: input.sha256Hex,
          }),
          input.sha256Hex,
        );
      if (
        terminalEvidenceSummary.exitDecision.exitCode !== 0
        || !Object.is(
          committedCycleMechanicalEnergyAudit.sourceTerminalCycleCapsule,
          terminalCycleCapsule,
        )
      ) {
        throw new Error("retained mode terminal evidence is not successful");
      }
      return Object.freeze({
        completed: true as const,
        mode,
        terminalCycleCapsule,
        committedCycleMechanicalEnergyAudit,
        terminalEvidenceSummary,
        livePeriodicFailure: null,
        terminalCycleCapsuleFailure: null,
      });
    }
    if (advanced.controller === null) {
      throw new Error("retained nonterminal cycle lost its successor");
    }
    const successor = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
      advanced.controller,
    );
    if (
      successor.completedCycleEvidenceCount
        !== checkpoint.completedSupercycleCount
      || successor.cycleEvidenceChainHeadContentSha256
        !== evidence.contentSha256
      || !Object.is(successor.lastCycleEvidence, evidence)
      || !Object.is(successor.sourceCase, sourceCase)
      || !Object.is(successor.schedule, schedule)
    ) {
      throw new Error("retained successor cycle-evidence chain differs");
    }
    controller = successor;
  }
}

function assertCycleCrossLinks(
  controller: PhaseB1NormalSinusBeLivePeriodicControllerV1,
  audit: PhaseB1NormalSinusCommittedSupercycleAuditV1,
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
  evidence: ReturnType<
    typeof assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1
  >,
): void {
  if (
    audit.definitionContentSha256 !== controller.definition.contentSha256
    || checkpoint.definitionContentSha256
      !== controller.definition.contentSha256
    || evidence.definitionContentSha256
      !== controller.definition.contentSha256
    || audit.scheduleContentSha256 !== controller.schedule.contentSha256
    || evidence.scheduleContentSha256 !== controller.schedule.contentSha256
    || audit.cycleIndex !== checkpoint.cycleIndex
    || evidence.cycleIndex !== checkpoint.cycleIndex
    || checkpoint.completedSupercycleCount !== checkpoint.cycleIndex + 1
    || audit.startTimeSec !== checkpoint.startTimeSec
    || audit.endTimeSec !== checkpoint.endTimeSec
    || audit.slsMode !== controller.slsMode
    || evidence.slsMode !== controller.slsMode
    || audit.nominalDtSec !== controller.nominalDtSec
    || evidence.nominalDtSec !== controller.nominalDtSec
    || evidence.previousCycleEvidenceContentSha256
      !== controller.cycleEvidenceChainHeadContentSha256
    || checkpoint.previousCheckpointContentSha256
      !== (controller.periodicState.lastCheckpoint?.contentSha256 ?? null)
    || evidence.committedSupercycleAuditContentSha256 !== audit.contentSha256
    || evidence.periodicCheckpointContentSha256 !== checkpoint.contentSha256
    || evidence.runnerAttemptTraceContentSha256
      !== audit.runnerAttemptTraceContentSha256
    || evidence.committedIntervalLedgerSummaryContentSha256
      !== audit.committedIntervalLedgerSummaryContentSha256
    || evidence.initialEndpointContentSha256
      !== audit.initialEndpointContentSha256
    || evidence.finalEndpointContentSha256
      !== audit.finalEndpointContentSha256
    || checkpoint.initialEndpointContentSha256
      !== audit.initialEndpointContentSha256
    || checkpoint.finalEndpointContentSha256
      !== audit.finalEndpointContentSha256
  ) {
    throw new Error("retained mode cycle digest or chain cross-link differs");
  }
}

function assertTerminalCrossLinks(
  terminal: ReturnType<
    typeof assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1
  >,
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
  evidence: ReturnType<
    typeof assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1
  >,
): void {
  if (
    terminal.completedSupercycleCount !== checkpoint.completedSupercycleCount
    || terminal.cycleEvidenceChainHeadContentSha256
      !== evidence.contentSha256
    || terminal.finalPeriodicCheckpointContentSha256
      !== checkpoint.contentSha256
    || !Object.is(terminal.lastCycleEvidence, evidence)
  ) throw new Error("retained terminal cycle-evidence chain differs");
}

import { createHash } from "node:crypto";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
  type PhaseB1BackwardEulerEventScheduleRunnerResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CLAIM_POLICY_V1,
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  type PhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  validatePhaseB1NormalSinusBePeriodicCheckpointV1,
  type PhaseB1NormalSinusBePeriodicCheckpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  parsePhaseB1LivePeriodicDiagnosticConfigV1,
  phaseB1LivePeriodicDiagnosticConfigInputFromEnvV1,
} from "@/tools/myocardium/phaseB1LivePeriodicDiagnosticConfigV1";
import {
  assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  decidePhaseB1LivePeriodicTerminalExitV1,
  type PhaseB1LivePeriodicTerminalEvidenceSummaryV1,
} from "@/tools/myocardium/phaseB1LivePeriodicTerminalEvidenceSummaryV1";

const DIAGNOSTIC_ID =
  "phase-b1-normal-sinus-be-live-periodic-stream-diagnostic-v1" as const;

const CLAIM_BOUNDARY =
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CLAIM_POLICY_V1;

let jsonlSequence = 0;

runDiagnostic();

function runDiagnostic(): void {
  const startedAtMs = performance.now();
  try {
    const config = parsePhaseB1LivePeriodicDiagnosticConfigV1(
      phaseB1LivePeriodicDiagnosticConfigInputFromEnvV1(process.env),
    );
    print({
      stage: "start",
      mode: config.mode,
      nominalDtMs: config.nominalDtMs,
      nominalDtSec: config.nominalDtSec,
      maximumSupercycles: 100,
      requiredConsecutivePassingSupercycles: 3,
      singleStartOnly: true,
      elapsedSec: elapsedSec(startedAtMs),
      authenticatedInProcessBeforeSerialization: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
      claimBoundary: CLAIM_BOUNDARY,
    });

    const parentStartedAtMs = performance.now();
    const manifest =
      assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
        buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256),
      );
    const numerical =
      assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
        buildPhaseB1QuiescentReferenceNumericalEvidenceV1(manifest, sha256),
        manifest,
      );
    const schedule =
      buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
    print({
      stage: "parent-ready",
      mode: config.mode,
      nominalDtSec: config.nominalDtSec,
      stageElapsedSec: elapsedSec(parentStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      parentManifestContentSha256: manifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      acceptedQuiescentParentBuiltOnce: true,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      fullBeatAcceptancePass: false,
      physiologicalValidationPass: false,
      phaseB1AcceptancePass: false,
      releaseRuntimeReachable: false,
      claimBoundary: CLAIM_BOUNDARY,
    });

    const controllerStartedAtMs = performance.now();
    let controller = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
      initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
        sourceCase: numerical.results[config.mode].eventFreeCase,
        schedule,
        nominalDtSec: config.nominalDtSec,
        sha256Hex: sha256,
      }),
    );
    print({
      stage: "controller-ready",
      mode: config.mode,
      nominalDtSec: config.nominalDtSec,
      stageElapsedSec: elapsedSec(controllerStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      definitionContentSha256: controller.definition.contentSha256,
      scheduleContentSha256: controller.schedule.contentSha256,
      sourceWallMaterialBindingContentSha256:
        controller.sourceCase.wallMaterialBinding.contentSha256,
      newtonScaleRegistryContentSha256:
        controller.sourceCase.destinationRegistry.registryContentSha256,
      completedSupercycleCount: 0,
      terminalStatus: "running",
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      claimBoundary: controller.claimBoundary,
    });

    while (true) {
      if (
        controller.completedCycleEvidenceCount
          >= controller.definition.maximumSupercycles
      ) {
        throw new Error(
          "live controller remained running at or beyond the fixed cycle cap",
        );
      }
      const cycleStartedAtMs = performance.now();
      const advanced = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
        controller,
        sha256Hex: sha256,
      });
      const cycleElapsedSec = elapsedSec(cycleStartedAtMs);
      if (advanced.completedCycle === false) {
        const failure =
          assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
            advanced.failure,
            sha256,
        );
        print({
          stage: "cycle-failure",
          mode: config.mode,
          nominalDtSec: config.nominalDtSec,
          cycleIndex: failure.cycleIndex,
          startTimeSec: failure.startTimeSec,
          endTimeSec: failure.endTimeSec,
          cycleElapsedSec,
          elapsedSec: elapsedSec(startedAtMs),
          failureContentSha256: failure.contentSha256,
          previousCycleEvidenceContentSha256:
            failure.previousCycleEvidenceContentSha256,
          failureStage: failure.failureStage,
          failureReason: failure.failureReason,
          unboundRunnerDiagnostics: summarizeRunner(failure.scheduleRun),
          runnerDiagnosticsExcludedFromFailureContentHash: true,
          terminalStatus: "failure",
          authenticatedInProcessBeforeSerialization: true,
          builderIssuedAuthenticationSurvivesSerialization: false,
          liveSingleStartPeriodOneCriterionPass: false,
          fullBeatAcceptancePass: false,
          normalSinusMultiStartAcceptancePass: false,
          timestepConvergenceAcceptancePass: false,
          cycleEnergyAcceptancePass: false,
          physiologicalValidationPass: false,
          phaseB1AcceptancePass: false,
          modelCoreIntegration: false,
          browserRuntimeAdopted: false,
          releaseRuntimeReachable: false,
          claimBoundary: failure.claimBoundary,
        });
        process.exitCode = 1;
        return;
      }

      const audit =
        assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
          advanced.committedSupercycleAudit,
          sha256,
        );
      const evidence =
        assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
          advanced.cycleEvidence,
          sha256,
        );
      const scheduleRun =
        assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
          audit.sourceScheduleRun,
        );
      const ledger = audit.committedIntervalLedger;
      const checkpoint = validatePhaseB1NormalSinusBePeriodicCheckpointV1(
        advanced.periodicCheckpoint,
        controller.definition,
        controller.periodicState.lastCheckpoint,
        sha256,
      );
      assertCycleCrossLinks(controller, audit, checkpoint, evidence);
      let successor: PhaseB1NormalSinusBeLivePeriodicControllerV1 | null = null;
      let terminal:
        PhaseB1NormalSinusBeLivePeriodicTerminalResultV1 | null = null;
      if (advanced.controller !== null) {
        if (advanced.terminalResult !== null) {
          throw new Error("completed cycle issued both successor and terminal");
        }
        successor = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
          advanced.controller,
        );
        if (
          successor.completedCycleEvidenceCount
            !== checkpoint.completedSupercycleCount
          || successor.cycleEvidenceChainHeadContentSha256
            !== evidence.contentSha256
          || !Object.is(successor.lastCycleEvidence, evidence)
        ) throw new Error("successor controller cycle-evidence chain differs");
      } else {
        if (advanced.terminalResult === null) {
          throw new Error("completed cycle issued neither successor nor terminal");
        }
        terminal =
          assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
            advanced.terminalResult,
            sha256,
          );
        if (
          terminal.completedSupercycleCount
            !== checkpoint.completedSupercycleCount
          || terminal.cycleEvidenceChainHeadContentSha256
            !== evidence.contentSha256
          || terminal.finalPeriodicCheckpointContentSha256
            !== checkpoint.contentSha256
          || !Object.is(terminal.lastCycleEvidence, evidence)
        ) throw new Error("terminal result cycle-evidence chain differs");
      }
      // Preserve the authenticated numerical hash chain even if terminal
      // capsule finalization or the downstream energy diagnostic rejects.
      print({
        stage: "cycle-complete",
        mode: config.mode,
        nominalDtSec: config.nominalDtSec,
        cycleIndex: audit.cycleIndex,
        startTimeSec: audit.startTimeSec,
        endTimeSec: audit.endTimeSec,
        cycleElapsedSec,
        elapsedSec: elapsedSec(startedAtMs),
        hashes: {
          definitionContentSha256: controller.definition.contentSha256,
          scheduleContentSha256: controller.schedule.contentSha256,
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
        },
        state: summarizeState(checkpoint),
        flow: summarizeFlow(checkpoint),
        totalBloodVolume: checkpoint.totalBloodVolume,
        sls: {
          mode: ledger.slsMode,
          statePhysicallyAbsent: checkpoint.adjacentMetric.slsStatePhysicallyAbsent,
          adjacentMaximumNormalizedDistance:
            checkpoint.adjacentMetric.maximumSlsNormalizedDistance,
          streakWindowMaximumNormalizedDistance:
            checkpoint.streakWindowMetric.maximumSlsNormalizedDistance,
          maximumBackwardEulerIdentityNormalizedResidual:
            ledger.maximumSlsNormalizedIdentityResidual,
          maximumAbsoluteAlphaMismatch:
            ledger.maximumSlsAbsoluteAlphaMismatch,
          maximumAbsoluteExpandedIdentityResidualJDiagnostic:
            ledger.maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic,
          maximizingTransactionIndex:
            ledger.maximizingSlsIdentityTransactionIndex,
          maximizingEndTimeSec: ledger.maximizingSlsIdentityEndTimeSec,
          maximizingWallId: ledger.maximizingSlsIdentityWallId,
          everyStepBackwardEulerIdentityAccepted:
            ledger.everyStepSlsBackwardEulerIdentityAccepted,
        },
        newton: {
          expectedUnknownCount: ledger.expectedNewtonUnknownCount,
          maximumScaledResidualInfinityNorm:
            ledger.maximumScaledResidualInfinityNorm,
          maximumScaledUpdateInfinityNorm:
            ledger.maximumScaledUpdateInfinityNorm,
          scaledResidualInfinityTolerance:
            ledger.globalScaledResidualInfinityTolerance,
          scaledUpdateInfinityTolerance:
            ledger.globalScaledUpdateInfinityTolerance,
          everyStepRegistryScaledToleranceAccepted:
            ledger.everyStepRegistryScaledNewtonToleranceAccepted,
          minimumLandSimplexMargin: ledger.minimumLandSimplexMargin,
          everyAcceptedEndpointStrictlyInsideLandSimplex:
            ledger.everyAcceptedEndpointStrictlyInsideLandSimplex,
          adaptiveNewtonRescalingApplied:
            ledger.adaptiveNewtonRescalingApplied,
        },
        retry: summarizeRetry(scheduleRun),
        committedSupercycleAuditPass: audit.committedSupercycleAuditPass,
        structuralAndNumericalIntervalLedgerGatesPass:
          ledger.structuralAndNumericalIntervalLedgerGatesPass,
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
        authenticatedInProcessBeforeSerialization: true,
        builderIssuedAuthenticationSurvivesSerialization: false,
        liveRunnerAndLedgerProvenanceBound:
          evidence.liveRunnerAndLedgerProvenanceBound,
        fullBeatAcceptancePass: false,
        normalSinusMultiStartAcceptancePass: false,
        timestepConvergenceAcceptancePass: false,
        cycleEnergyAcceptancePass: false,
        physiologicalValidationPass: false,
        phaseB1AcceptancePass: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
        claimBoundary: evidence.claimBoundary,
      });

      if (terminal !== null) {
        let terminalEvidenceSummary:
          PhaseB1LivePeriodicTerminalEvidenceSummaryV1 | null = null;
        let terminalFinalizationFailure:
          PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1 | null = null;
        const finalized =
          finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
            parentManifest: manifest,
            parentNumericalEvidence: numerical,
            schedule,
            // This must be the exact reconstructed source retained by the
            // consumed live controller. Reusing the parent wrapper would lose
            // runner/model/registry object identity.
            sourceCase: controller.sourceCase,
            terminalResult: terminal,
            finalCommittedSupercycleAudit: audit,
            finalPeriodicCheckpoint: checkpoint,
            finalCycleEvidence: evidence,
            sha256Hex: sha256,
          });
        if (finalized.completed === false) {
          terminalFinalizationFailure =
            assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
              finalized.failure,
              sha256,
            );
        } else {
          const capsule =
            assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
              finalized.capsule,
              sha256,
            );
          const energy =
            assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
              buildPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1({
                terminalCycleCapsule: capsule,
                sha256Hex: sha256,
              }),
              sha256,
            );
          terminalEvidenceSummary =
            assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
              buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1({
                terminalCycleCapsule: capsule,
                committedCycleMechanicalEnergyAudit: energy,
                sha256Hex: sha256,
              }),
              sha256,
            );
        }
        if (terminalFinalizationFailure !== null) {
          const exitDecision = decidePhaseB1LivePeriodicTerminalExitV1({
            terminalStatus: terminal.terminalStatus,
            terminalCycleCapsuleFinalized: true,
            committedCycleMechanicalEnergyAuditBuilt: false,
            terminalEvidenceSummaryBuilt: false,
          });
          print({
            stage: "terminal-retained-evidence-failure",
            mode: config.mode,
            nominalDtSec: config.nominalDtSec,
            elapsedSec: elapsedSec(startedAtMs),
            failureContentSha256: terminalFinalizationFailure.contentSha256,
            failureKind: terminalFinalizationFailure.failureKind,
            terminalCycleCapsuleContentSha256:
              terminalFinalizationFailure
                .terminalCycleCapsuleContentSha256,
            terminalResultContentSha256:
              terminalFinalizationFailure.terminalResultContentSha256,
            terminalStatus: terminal.terminalStatus,
            capExhaustionAcceptedAsSuccess: false,
            committedCycleMechanicalEnergyAuditBuilt: false,
            numericalCycleRerunPerformed: false,
            authenticatedInProcessBeforeSerialization: true,
            builderIssuedAuthenticationSurvivesSerialization: false,
            liveSingleStartPeriodOneCriterionPass: false,
            fullBeatAcceptancePass: false,
            normalSinusMultiStartAcceptancePass: false,
            timestepConvergenceAcceptancePass: false,
            cycleEnergyAcceptancePass: false,
            physiologicalValidationPass: false,
            phaseB1AcceptancePass: false,
            modelCoreIntegration: false,
            browserRuntimeAdopted: false,
            releaseRuntimeReachable: false,
            exitDecision,
            claimBoundary: terminalFinalizationFailure.claimBoundary,
          });
          process.exitCode = exitDecision.exitCode;
          return;
        }
        if (terminalEvidenceSummary === null) {
          throw new Error("terminal convergence lost its retained evidence summary");
        }
        const exitDecision = terminalEvidenceSummary.exitDecision;
        print({
          ...terminalEvidenceSummary,
          elapsedSec: elapsedSec(startedAtMs),
        });
        process.exitCode = exitDecision.exitCode;
        return;
      }
      if (successor === null) {
        throw new Error("nonterminal cycle did not issue a successor controller");
      }
      controller = successor;
    }
  } catch (error) {
    print({
      stage: "diagnostic-tool-failure",
      elapsedSec: elapsedSec(startedAtMs),
      failureReason: error instanceof Error ? error.message : String(error),
      authenticatedInProcessBeforeSerialization: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
      liveSingleStartPeriodOneCriterionPass: false,
      fullBeatAcceptancePass: false,
      normalSinusMultiStartAcceptancePass: false,
      timestepConvergenceAcceptancePass: false,
      cycleEnergyAcceptancePass: false,
      physiologicalValidationPass: false,
      phaseB1AcceptancePass: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
      claimBoundary: CLAIM_BOUNDARY,
    });
    process.exitCode = 1;
  }
}

function assertCycleCrossLinks(
  controller: PhaseB1NormalSinusBeLivePeriodicControllerV1 | null,
  audit: PhaseB1NormalSinusCommittedSupercycleAuditV1,
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
  evidence: PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
): void {
  if (
    controller === null
    || audit.definitionContentSha256 !== controller.definition.contentSha256
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
  ) throw new Error("live periodic cycle digest or chain cross-link differs");
}

function summarizeState(
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
) {
  return {
    adjacentMaximumNormalizedDistance:
      checkpoint.adjacentMetric.maximumNormalizedDistance,
    adjacentMaximizingScalarLabel:
      checkpoint.adjacentMetric.maximizingScalarLabel,
    adjacentMaximumLandNormalizedDistance:
      checkpoint.adjacentMetric.maximumLandNormalizedDistance,
    streakWindowMaximumNormalizedDistance:
      checkpoint.streakWindowMetric.maximumNormalizedDistance,
    streakWindowMaximizingScalarLabel:
      checkpoint.streakWindowMetric.maximizingScalarLabel,
    streakWindowMaximumLandNormalizedDistance:
      checkpoint.streakWindowMetric.maximumLandNormalizedDistance,
    previousStreakWindowRejectedAndRestartedAtCurrentCycle:
      checkpoint.previousStreakWindowRejectedAndRestartedAtCurrentCycle,
  };
}

function summarizeFlow(
  checkpoint: PhaseB1NormalSinusBePeriodicCheckpointV1,
) {
  return {
    systemicMeanSignedNetFlowM3PerSec:
      checkpoint.flow.systemicMeanSignedNetFlowM3PerSec,
    systemicNetFlowUsableAsRelativeDenominator:
      checkpoint.flow.systemicNetFlowUsableAsRelativeDenominator,
    maximumRelativeSignedNetFlowMismatch:
      checkpoint.flow.maximumRelativeSignedNetFlowMismatch,
    maximizingFlowId: checkpoint.flow.maximizingFlowId,
    maximumSignedDecompositionRelativeResidual:
      checkpoint.flow.maximumSignedDecompositionRelativeResidual,
    signedFlowAgreementPass: checkpoint.flow.signedFlowAgreementPass,
    signedDecompositionPass: checkpoint.flow.signedDecompositionPass,
    byFlow: Object.fromEntries(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
        const item = checkpoint.flow.byFlow[flowId];
        return [flowId, {
          signedVolumeM3: item.signedVolumeM3,
          forwardVolumeM3: item.forwardVolumeM3,
          regurgitantVolumeM3: item.regurgitantVolumeM3,
          meanSignedFlowM3PerSec: item.meanSignedFlowM3PerSec,
          relativeMismatchFromSystemicNetFlow:
            item.relativeMismatchFromSystemicNetFlow,
        }];
      }),
    ),
  };
}

function summarizeRunner(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerResultV1,
) {
  const common = {
    completed: scheduleRun.completed,
    attemptedTransactionCount: scheduleRun.attemptedTransactionCount,
    solverRetrySubdivisionCount: scheduleRun.solverRetrySubdivisionCount,
    solverRetryAttemptCount: scheduleRun.solverRetryAttemptCount,
    maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
    explicitSolverRetryUsed: scheduleRun.explicitSolverRetryUsed,
    oneUlpRunEndNominalGridBoundaryCoalescenceCount:
      "lastAcceptedEndpoint" in scheduleRun
        ? scheduleRun
          .committedOneUlpRunEndNominalGridBoundaryCoalescenceCount
        : scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount,
    testFailureProbeUsed: scheduleRun.testFailureProbeUsed,
  };
  if (!("lastAcceptedEndpoint" in scheduleRun)) {
    return {
      ...common,
      requestedSegmentCount: scheduleRun.requestedSegmentCount,
      acceptedTransactionCount: scheduleRun.acceptedTransactionCount,
      eventBoundaryCount: scheduleRun.eventBoundaryCount,
      committedTransactionProvenanceAuditPass:
        scheduleRun.committedTransactionProvenanceAuditPass,
    };
  }
  return {
    ...common,
    completedRequestedSegmentCount:
      scheduleRun.completedRequestedSegmentCount,
    completedTransactionCount: scheduleRun.completedTransactionCount,
    committedEventBoundaryCount: scheduleRun.committedEventBoundaryCount,
    lastAcceptedTimeSec: scheduleRun.lastAcceptedEndpoint.timeSec,
    rollbackToFailedRequestedSegmentEntryExact:
      scheduleRun.rollbackToFailedRequestedSegmentEntryExact,
  };
}

function summarizeRetry(
  scheduleRun: ReturnType<
    typeof assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1
  >,
) {
  return {
    requestedSegmentCount: scheduleRun.requestedSegmentCount,
    acceptedTransactionCount: scheduleRun.acceptedTransactionCount,
    attemptedTransactionCount: scheduleRun.attemptedTransactionCount,
    eventBoundaryCount: scheduleRun.eventBoundaryCount,
    offGridEventSplitCount: scheduleRun.offGridEventSplitCount,
    oneUlpNominalGridBoundaryCoalescenceCount:
      scheduleRun.oneUlpNominalGridBoundaryCoalescenceCount,
    oneUlpRunEndNominalGridBoundaryCoalescenceCount:
      scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount,
    runEndTimeSnappingApplied: scheduleRun.runEndTimeSnappingApplied,
    solverRetrySubdivisionCount: scheduleRun.solverRetrySubdivisionCount,
    solverRetryAttemptCount: scheduleRun.solverRetryAttemptCount,
    maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
    explicitSolverRetryUsed: scheduleRun.explicitSolverRetryUsed,
    committedTransactionProvenanceAuditPass:
      scheduleRun.committedTransactionProvenanceAuditPass,
  };
}

function elapsedSec(startedAtMs: number): number {
  return (performance.now() - startedAtMs) / 1000;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function print(value: unknown): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    schemaId: DIAGNOSTIC_ID,
    sequence: jsonlSequence,
    ...(value as Record<string, unknown>),
    testOnly: true,
  }));
  jsonlSequence += 1;
}

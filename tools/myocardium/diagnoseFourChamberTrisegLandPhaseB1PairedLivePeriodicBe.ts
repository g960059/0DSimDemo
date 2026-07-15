import { createHash } from "node:crypto";
import {
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicControllerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_POLICY_V1,
  assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1,
  buildPhaseB1NormalSinusBePairedSourceParityAuditV1,
  finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1,
  type PhaseB1NormalSinusBePairedSourceParityAuditV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  buildPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
  type PhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
  type PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1,
  decidePhaseB1PairedLivePeriodicModeDispositionV1,
  type PhaseB1PairedLivePeriodicModeV1,
} from "@/tools/myocardium/phaseB1PairedLivePeriodicDiagnosticConfigV1";
import {
  runPhaseB1LivePeriodicRetainedModeV1,
  type PhaseB1LivePeriodicRetainedModeRunSuccessV1,
} from "@/tools/myocardium/phaseB1LivePeriodicRetainedModeRunV1";
import {
  buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1,
  buildPhaseB1PairedAtrialPvMorphologyAnalysisManifestV1,
  buildPhaseB1PairedAtrialPvMorphologyArtifactV1,
  serializePhaseB1PairedAtrialPvMorphologyArtifactV1,
  type PhaseB1AtrialPvMorphologyCoordinateScaleV1,
  type PhaseB1AtrialPvMorphologyTerminalObservationProjectionV1,
} from "@/tools/myocardium/phaseB1PairedAtrialPvMorphologyArtifactV1";
import {
  PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1,
  buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionAdapterV1";
import {
  buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
  buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionV1";
import {
  buildPhaseB1PairedTerminalWaveformArtifactV1,
  serializePhaseB1PairedTerminalWaveformArtifactV1,
} from "@/tools/myocardium/phaseB1PairedTerminalWaveformArtifactV1";

const DIAGNOSTIC_ID =
  "phase-b1-normal-sinus-be-paired-live-periodic-stream-diagnostic-v1" as const;
const MORPHOLOGY_OUTPUT_ENV =
  "PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_OUTPUT" as const;
const DEFAULT_MORPHOLOGY_OUTPUT =
  "docs/myocardium/verification/four-chamber-triseg-land-phase-b1-paired-live-periodic-atrial-pv-morphology-1ms.json" as const;
const PAIRED_WAVEFORM_OUTPUT_ENV =
  "PHASE_B1_PAIRED_TERMINAL_WAVEFORM_OUTPUT" as const;
const DEFAULT_PAIRED_WAVEFORM_OUTPUT =
  "docs/myocardium/verification/four-chamber-triseg-land-phase-b1-paired-live-periodic-terminal-waveform-1ms.json" as const;
const MATCHED_VOLUME_OUTPUT_ENV =
  "PHASE_B1_PAIRED_MATCHED_VOLUME_OUTPUT" as const;
const DEFAULT_MATCHED_VOLUME_OUTPUT =
  "docs/myocardium/verification/four-chamber-triseg-land-phase-b1-paired-live-periodic-atrial-matched-volume-pressure-attribution-1ms.json" as const;

const CONFIG = PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1;
const CLAIM_BOUNDARY =
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_POLICY_V1;

let jsonlSequence = 0;

runDiagnostic();

function runDiagnostic(): void {
  const startedAtMs = performance.now();
  try {
    const outputPaths = resolveOutputPaths(
      process.argv.slice(2),
      process.env,
    );
    const morphologyOutputPath = outputPaths.morphologyOutputPath;
    const pairedWaveformOutputPath = outputPaths.pairedWaveformOutputPath;
    const matchedVolumeOutputPath = outputPaths.matchedVolumeOutputPath;
    print({
      stage: "start",
      configId: CONFIG.configId,
      modeOrder: CONFIG.modeOrder,
      executionOrder: CONFIG.executionOrder,
      nominalDtMs: CONFIG.nominalDtMs,
      nominalDtSec: CONFIG.nominalDtSec,
      maximumSupercycles: CONFIG.maximumSupercycles,
      requiredConsecutivePassingSupercycles:
        CONFIG.requiredConsecutivePassingSupercycles,
      environmentOverridesAccepted: CONFIG.environmentOverridesAccepted,
      numericalEnvironmentOverridesAccepted: false,
      outputPathEnvironmentOverridesAccepted: true,
      parentAndScheduleBuiltOnce: CONFIG.parentAndScheduleBuiltOnce,
      bothControllersInitializedBeforeFirstAdvance:
        CONFIG.bothControllersInitializedBeforeFirstAdvance,
      stopOnFirstModeFailure: CONFIG.stopOnFirstModeFailure,
      externalPairedFailureRecompositionAllowed:
        CONFIG.externalPairedFailureRecompositionAllowed,
      morphologyOutputPath,
      pairedWaveformOutputPath,
      matchedVolumeOutputPath,
      elapsedSec: elapsedSec(startedAtMs),
      authenticatedInProcessBeforeSerialization: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass: false,
      ...broadFalseClaims(),
      claimBoundary: CLAIM_BOUNDARY,
    });

    const comparisonManifest =
      assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
        buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
          sha256Hex: sha256,
        }),
      );
    print({
      stage: "comparison-manifest-ready-before-mode-advance",
      comparisonManifestContentSha256: comparisonManifest.contentSha256,
      comparisonPolicyContentSha256:
        comparisonManifest.bindings.comparisonPolicyContentSha256,
      numericalThreeGridComparisonExecuted: false,
      morphologyOutputPath,
      elapsedSec: elapsedSec(startedAtMs),
      ...broadFalseClaims(),
      claimBoundary: comparisonManifest.claimBoundary,
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
      stageElapsedSec: elapsedSec(parentStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      parentManifestContentSha256: manifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      acceptedQuiescentParentBuiltOnce: true,
      scheduleBuiltOnce: true,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass: false,
      ...broadFalseClaims(),
      claimBoundary: CLAIM_BOUNDARY,
    });

    const parityStartedAtMs = performance.now();
    const initialSourceParityAudit =
      assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
        buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
          parentManifest: manifest,
          parentNumericalEvidence: numerical,
          schedule,
          sha256Hex: sha256,
        }),
        sha256,
      );
    assertInitialParityBinding(initialSourceParityAudit, manifest, numerical,
      schedule);
    print({
      stage: "initial-source-parity-audit",
      stageElapsedSec: elapsedSec(parityStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      initialSourceParityAuditContentSha256:
        initialSourceParityAudit.contentSha256,
      parentManifestContentSha256: manifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      comparedCommonScalarCount:
        initialSourceParityAudit.comparedCommonScalarCount,
      maximumNormalizedDistance:
        initialSourceParityAudit.maximumNormalizedDistance,
      maximumNormalizedDistanceTolerance:
        initialSourceParityAudit.maximumNormalizedDistanceTolerance,
      maximizingScalarLabel:
        initialSourceParityAudit.maximizingScalarLabel,
      allEightInitialFlowsExactlyEqualAndZero:
        initialSourceParityAudit.allEightInitialFlowsExactlyEqualAndZero,
      exactSlsTopologyInventoryVerified:
        initialSourceParityAudit.exactSlsTopologyInventoryVerified,
      initialCommonCoordinateParityPass:
        initialSourceParityAudit.initialCommonCoordinateParityPass,
      nonSlsClosedLoopParametersParityClaimed: false,
      causalEffectOfSlsEstablished: false,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass: false,
      ...broadFalseClaims(),
      claimBoundary: initialSourceParityAudit.claimBoundary,
    });

    const controllersStartedAtMs = performance.now();
    const initialControllers = Object.freeze({
      off: initializeController("off", numerical.results.off.eventFreeCase,
        schedule),
      on: initializeController("on", numerical.results.on.eventFreeCase,
        schedule),
    });
    assertPairedControllerInitialization(
      initialControllers,
      initialSourceParityAudit,
      numerical,
      schedule,
    );
    const morphologyScaleAudit =
      buildPreOutcomeAtrialPvMorphologyScaleAudit(
        initialControllers.off.sourceCase.destinationRegistry,
        initialControllers.on.sourceCase.destinationRegistry,
      );
    const morphologyAnalysisManifest =
      buildPhaseB1PairedAtrialPvMorphologyAnalysisManifestV1({
        coordinateScaleByAtrium:
          morphologyScaleAudit.coordinateScaleByAtrium,
        sha256Hex: sha256,
      });
    const matchedVolumeAnalysisManifest =
      buildPhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1({
        phaseWindows:
          PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1,
        normalizedGridPointCount: 21,
        reconstructionAbsoluteTolerancePa: 1e-6,
        reconstructionRelativeTolerance: 1e-12,
        sha256Hex: sha256,
      });
    print({
      stage: "both-controllers-ready",
      stageElapsedSec: elapsedSec(controllersStartedAtMs),
      elapsedSec: elapsedSec(startedAtMs),
      modeOrder: CONFIG.modeOrder,
      parentManifestContentSha256: manifest.contentSha256,
      parentNumericalEvidenceContentSha256:
        numerical.certificate.contentSha256,
      scheduleContentSha256: schedule.contentSha256,
      initialSourceParityAuditContentSha256:
        initialSourceParityAudit.contentSha256,
      slsOffDefinitionContentSha256:
        initialControllers.off.definition.contentSha256,
      slsOnDefinitionContentSha256:
        initialControllers.on.definition.contentSha256,
      bothControllersInitializedBeforeFirstAdvance: true,
      bothControllersUnadvancedAtRecordTime: true,
      sameScheduleObjectIdentity: true,
      exactParentModeSourceSelection: true,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass: false,
      ...broadFalseClaims(),
      claimBoundary: CLAIM_BOUNDARY,
    });
    print({
      stage: "paired-atrial-pv-morphology-analysis-manifest-ready-before-mode-advance",
      elapsedSec: elapsedSec(startedAtMs),
      morphologyOutputPath,
      morphologyAnalysisManifestContentSha256:
        morphologyAnalysisManifest.contentSha256,
      slsOffNewtonScaleRegistryContentSha256:
        morphologyScaleAudit.slsOffNewtonScaleRegistryContentSha256,
      slsOnNewtonScaleRegistryContentSha256:
        morphologyScaleAudit.slsOnNewtonScaleRegistryContentSha256,
      fullRegistryContentSha256ParityPass:
        morphologyScaleAudit.fullRegistryContentSha256ParityPass,
      selectedAtrialPvScaleParityPass:
        morphologyScaleAudit.selectedAtrialPvScaleParityPass,
      coordinateScaleByAtrium:
        morphologyAnalysisManifest.coordinateScaleByAtrium,
      scalesSelectedBeforeAnyModeAdvance: true,
      postOutcomeRescalingPerformed: false,
      morphologyOutcomeUsedAsAcceptanceGate: false,
      morphologyReportCompletenessIsOnlyGate: true,
      fullRequiredSlsAblationReportComplete: false,
      ...broadFalseClaims(),
      claimBoundary: morphologyAnalysisManifest.claimBoundary,
    });
    print({
      stage:
        "paired-atrial-matched-volume-analysis-manifest-ready-before-mode-advance",
      elapsedSec: elapsedSec(startedAtMs),
      matchedVolumeOutputPath,
      matchedVolumeAnalysisManifestContentSha256:
        matchedVolumeAnalysisManifest.contentSha256,
      phaseWindows: matchedVolumeAnalysisManifest.phaseWindows,
      normalizedGridPointCount:
        matchedVolumeAnalysisManifest.normalizedGridPointCount,
      reconstructionAbsoluteTolerancePa:
        matchedVolumeAnalysisManifest.reconstructionAbsoluteTolerancePa,
      reconstructionRelativeTolerance:
        matchedVolumeAnalysisManifest.reconstructionRelativeTolerance,
      phaseSemanticsPredeclaredBeforeModeAdvance: true,
      actualPhaseBoundariesAreResultDependent: true,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      slsOffFigureEightTopologyRequired: false,
      fullRequiredSlsAblationReportComplete: false,
      ...broadFalseClaims(),
      claimBoundary: matchedVolumeAnalysisManifest.claimBoundary,
    });

    let slsOff: PhaseB1NormalSinusBeTerminalCycleCapsuleV1 | null = null;
    let slsOn: PhaseB1NormalSinusBeTerminalCycleCapsuleV1 | null = null;
    let slsOffOutcome: PhaseB1LivePeriodicRetainedModeRunSuccessV1 | null =
      null;
    let slsOnOutcome: PhaseB1LivePeriodicRetainedModeRunSuccessV1 | null =
      null;

    for (
      let modeIndex = 0;
      modeIndex < PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1.length;
      modeIndex += 1
    ) {
      const mode = PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1[
        modeIndex
      ];
      const modeStartedAtMs = performance.now();
      print({
        stage: "mode-start",
        mode,
        modeIndex,
        nominalDtSec: CONFIG.nominalDtSec,
        elapsedSec: elapsedSec(startedAtMs),
        parentManifestContentSha256: manifest.contentSha256,
        parentNumericalEvidenceContentSha256:
          numerical.certificate.contentSha256,
        scheduleContentSha256: schedule.contentSha256,
        initialSourceParityAuditContentSha256:
          initialSourceParityAudit.contentSha256,
        previousModeTerminalCapsuleRetained: mode === "on",
        pairedOneMillisecondPeriodicEvidencePass: false,
        ...broadFalseClaims(),
        claimBoundary: CLAIM_BOUNDARY,
      });

      const outcome = runPhaseB1LivePeriodicRetainedModeV1({
        parentManifest: manifest,
        parentNumericalEvidence: numerical,
        schedule,
        initialController: initialControllers[mode],
        emitCycleRecord: (record) => print({
          stage: "cycle-complete",
          modeIndex,
          ...record,
          elapsedSec: elapsedSec(startedAtMs),
          parentManifestContentSha256: manifest.contentSha256,
          parentNumericalEvidenceContentSha256:
            numerical.certificate.contentSha256,
          initialSourceParityAuditContentSha256:
            initialSourceParityAudit.contentSha256,
          pairedOneMillisecondPeriodicEvidencePass: false,
          ...broadFalseClaims(),
        }),
        sha256Hex: sha256,
      });

      if (outcome.completed === false) {
        const disposition =
          decidePhaseB1PairedLivePeriodicModeDispositionV1({
            mode,
            classification: outcome.failureKind,
          });
        const failure = outcome.livePeriodicFailure
          ?? outcome.terminalCycleCapsuleFailure;
        if (failure === null) {
          throw new Error("failed paired mode lost its builder-issued failure");
        }
        print({
          stage: outcome.failureKind === "live-periodic-cycle-failure"
            ? "mode-live-periodic-cycle-failure"
            : "mode-maximum-supercycles-exhausted",
          mode,
          modeIndex,
          nominalDtSec: CONFIG.nominalDtSec,
          modeElapsedSec: elapsedSec(modeStartedAtMs),
          elapsedSec: elapsedSec(startedAtMs),
          failureKind: outcome.failureKind,
          failureContentSha256: failure.contentSha256,
          parentManifestContentSha256: manifest.contentSha256,
          parentNumericalEvidenceContentSha256:
            numerical.certificate.contentSha256,
          scheduleContentSha256: schedule.contentSha256,
          initialSourceParityAuditContentSha256:
            initialSourceParityAudit.contentSha256,
          failureStage: outcome.livePeriodicFailure?.failureStage ?? null,
          failureReason: outcome.livePeriodicFailure?.failureReason ?? null,
          failureCycleIndex: outcome.livePeriodicFailure?.cycleIndex ?? null,
          runnerDiagnostics: outcome.livePeriodicFailure === null
            ? null
            : summarizeRunnerFailure(outcome.livePeriodicFailure.scheduleRun),
          terminalCycleCapsuleContentSha256:
            outcome.terminalCycleCapsuleFailure
              ?.terminalCycleCapsuleContentSha256 ?? null,
          capExhaustionAcceptedAsSuccess: false,
          numericalCycleRerunPerformed: false,
          authenticatedInProcessBeforeSerialization: true,
          builderIssuedAuthenticationSurvivesSerialization: false,
          pairedOneMillisecondPeriodicEvidencePass: false,
          ...broadFalseClaims(),
          disposition,
          claimBoundary: failure.claimBoundary,
        });
        printPairedEvidenceNotIssued({
          mode,
          failureKind: outcome.failureKind,
          failureContentSha256: failure.contentSha256,
          otherModeStatus: mode === "off"
            ? "initialized-unadvanced"
            : "converged-capsule-retained",
          retainedOffCapsuleContentSha256: slsOff?.contentSha256 ?? null,
          parentManifestContentSha256: manifest.contentSha256,
          parentNumericalEvidenceContentSha256:
            numerical.certificate.contentSha256,
          scheduleContentSha256: schedule.contentSha256,
          initialSourceParityAuditContentSha256:
            initialSourceParityAudit.contentSha256,
          startedAtMs,
          disposition,
        });
        process.exitCode = 1;
        return;
      }

      assertSuccessfulModeBinding(outcome, mode, manifest, numerical, schedule);
      if (mode === "off") {
        slsOff = outcome.terminalCycleCapsule;
        slsOffOutcome = outcome;
      } else {
        slsOn = outcome.terminalCycleCapsule;
        slsOnOutcome = outcome;
      }
      const disposition = decidePhaseB1PairedLivePeriodicModeDispositionV1({
        mode,
        classification: "converged",
      });
      print({
        stage: "mode-terminal-retained-evidence",
        mode,
        modeIndex,
        nominalDtSec: CONFIG.nominalDtSec,
        modeElapsedSec: elapsedSec(modeStartedAtMs),
        elapsedSec: elapsedSec(startedAtMs),
        terminalCycleCapsuleContentSha256:
          outcome.terminalCycleCapsule.contentSha256,
        parentManifestContentSha256: manifest.contentSha256,
        parentNumericalEvidenceContentSha256:
          numerical.certificate.contentSha256,
        scheduleContentSha256: schedule.contentSha256,
        initialSourceParityAuditContentSha256:
          initialSourceParityAudit.contentSha256,
        terminalResultContentSha256:
          outcome.terminalCycleCapsule.terminalResultContentSha256,
        finalCycleEvidenceContentSha256:
          outcome.terminalCycleCapsule.finalCycleEvidenceContentSha256,
        committedCycleMechanicalEnergyAuditContentSha256:
          outcome.committedCycleMechanicalEnergyAudit.contentSha256,
        terminalEvidenceSummaryContentSha256:
          outcome.terminalEvidenceSummary.contentSha256,
        completedSupercycleCount:
          outcome.terminalCycleCapsule.completedSupercycleCount,
        terminalStatus: outcome.terminalCycleCapsule.terminalStatus,
        acceptedTransactionCount:
          outcome.terminalEvidenceSummary.acceptedTransactionCount,
        energyStageCount: outcome.terminalEvidenceSummary.energyStageCount,
        terminalArtifactsHashAndObjectCrossLinksVerified: true,
        energyCapsuleHashAndObjectCrossLinksVerified: true,
        numericalCycleRerunPerformed: false,
        authenticatedInProcessBeforeSerialization: true,
        builderIssuedAuthenticationSurvivesSerialization: false,
        liveSingleStartPeriodOneCriterionPass: true,
        terminalCommittedCycleMechanicalEnergyAuditCompleted: true,
        pairedOneMillisecondPeriodicEvidencePass: false,
        ...broadFalseClaims(),
        disposition,
        claimBoundary: outcome.terminalEvidenceSummary.claimBoundary,
      });
    }

    if (
      slsOff === null
      || slsOn === null
      || slsOffOutcome === null
      || slsOnOutcome === null
    ) {
      throw new Error("paired success lost a retained terminal capsule");
    }
    const paired =
      assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1(
        finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1(
          {
            parentManifest: manifest,
            parentNumericalEvidence: numerical,
            schedule,
            initialSourceParityAudit,
            slsOff,
            slsOn,
            sha256Hex: sha256,
          },
        ),
        sha256,
      );
    if (
      !Object.is(paired.parentManifest, manifest)
      || !Object.is(paired.parentNumericalEvidence, numerical)
      || !Object.is(paired.schedule, schedule)
      || !Object.is(paired.initialSourceParityAudit, initialSourceParityAudit)
      || !Object.is(paired.slsOff, slsOff)
      || !Object.is(paired.slsOn, slsOn)
      || paired.slsOffTerminalCycleCapsuleContentSha256
        !== slsOff.contentSha256
      || paired.slsOnTerminalCycleCapsuleContentSha256 !== slsOn.contentSha256
    ) {
      throw new Error("paired retained evidence object cross-links differ");
    }
    print({
      stage: "paired-evidence",
      elapsedSec: elapsedSec(startedAtMs),
      modeOrder: paired.modeOrder,
      nominalDtSec: paired.nominalDtSec,
      pairedPeriodicEvidenceContentSha256: paired.contentSha256,
      parentManifestContentSha256: paired.parentManifestContentSha256,
      parentNumericalEvidenceContentSha256:
        paired.parentNumericalEvidenceContentSha256,
      scheduleContentSha256: paired.scheduleContentSha256,
      initialSourceParityAuditContentSha256:
        paired.initialSourceParityAuditContentSha256,
      slsOffTerminalCycleCapsuleContentSha256:
        paired.slsOffTerminalCycleCapsuleContentSha256,
      slsOnTerminalCycleCapsuleContentSha256:
        paired.slsOnTerminalCycleCapsuleContentSha256,
      slsOffTerminalResultContentSha256:
        paired.slsOffTerminalResultContentSha256,
      slsOnTerminalResultContentSha256:
        paired.slsOnTerminalResultContentSha256,
      slsOffCompletedSupercycleCount: slsOff.completedSupercycleCount,
      slsOnCompletedSupercycleCount: slsOn.completedSupercycleCount,
      sameParentManifestObjectIdentity:
        paired.sameParentManifestObjectIdentity,
      sameParentNumericalEvidenceObjectIdentity:
        paired.sameParentNumericalEvidenceObjectIdentity,
      sameScheduleObjectIdentity: paired.sameScheduleObjectIdentity,
      retainedCapsuleObjectIdentityCrossLinksVerified: true,
      pairedEvidenceIssuedOnlyAfterBothModeEnergySummaries: true,
      pairedCanonicalParentAndInitialCommonCoordinateParityPass:
        paired.pairedCanonicalParentAndInitialCommonCoordinateParityPass,
      bothSingleStartPeriodOneCriteriaPass:
        paired.bothSingleStartPeriodOneCriteriaPass,
      pairedOneMillisecondPeriodicEvidencePass:
        paired.pairedOneMillisecondPeriodicEvidencePass,
      causalEffectOfSlsEstablished: false,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      ...broadFalseClaims(),
      claimBoundary: paired.claimBoundary,
    });

    const terminalObservationByMode = Object.freeze({
      off: assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
        buildPhaseB1NormalSinusBeTerminalTimestepObservationV1({
          comparisonManifest,
          initialSourceParityAudit,
          terminalCycleCapsule: slsOffOutcome.terminalCycleCapsule,
          committedCycleEnergyAudit:
            slsOffOutcome.committedCycleMechanicalEnergyAudit,
          sha256Hex: sha256,
        }),
        sha256,
      ),
      on: assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
        buildPhaseB1NormalSinusBeTerminalTimestepObservationV1({
          comparisonManifest,
          initialSourceParityAudit,
          terminalCycleCapsule: slsOnOutcome.terminalCycleCapsule,
          committedCycleEnergyAudit:
            slsOnOutcome.committedCycleMechanicalEnergyAudit,
          sha256Hex: sha256,
        }),
        sha256,
      ),
    });
    assertTerminalObservationMorphologyScaleBinding(
      terminalObservationByMode.off,
      morphologyScaleAudit.slsOffNewtonScaleRegistryContentSha256,
      morphologyAnalysisManifest.coordinateScaleByAtrium,
    );
    assertTerminalObservationMorphologyScaleBinding(
      terminalObservationByMode.on,
      morphologyScaleAudit.slsOnNewtonScaleRegistryContentSha256,
      morphologyAnalysisManifest.coordinateScaleByAtrium,
    );
    const morphologyProjectionByMode: Readonly<Record<
      PhaseB1PairedLivePeriodicModeV1,
      PhaseB1AtrialPvMorphologyTerminalObservationProjectionV1
    >> = Object.freeze({
      off: buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1({
        terminalObservation: terminalObservationByMode.off,
        sha256Hex: sha256,
      }),
      on: buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1({
        terminalObservation: terminalObservationByMode.on,
        sha256Hex: sha256,
      }),
    });
    const morphologyArtifact =
      buildPhaseB1PairedAtrialPvMorphologyArtifactV1({
        analysisManifest: morphologyAnalysisManifest,
        seriesByMode: {
          off: morphologyProjectionByMode.off.seriesByAtrium,
          on: morphologyProjectionByMode.on.seriesByAtrium,
        },
        sha256Hex: sha256,
      });
    const pairedWaveformArtifact =
      buildPhaseB1PairedTerminalWaveformArtifactV1({
        slsOffTerminalObservation: terminalObservationByMode.off,
        slsOnTerminalObservation: terminalObservationByMode.on,
        sha256Hex: sha256,
      });
    const matchedVolumeAdapter =
      buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1({
        analysisManifest: matchedVolumeAnalysisManifest,
        slsOffTerminalObservation: terminalObservationByMode.off,
        slsOnTerminalObservation: terminalObservationByMode.on,
        sha256Hex: sha256,
      });
    const matchedVolumeArtifact =
      buildPhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1({
        analysisManifest: matchedVolumeAnalysisManifest,
        sourceProvenanceByMode: matchedVolumeAdapter.sourceProvenanceByMode,
        seriesByMode: matchedVolumeAdapter.seriesByMode,
        sha256Hex: sha256,
      });
    const serializedMorphology =
      serializePhaseB1PairedAtrialPvMorphologyArtifactV1(
        morphologyArtifact,
        sha256,
      );
    const serializedPairedWaveform =
      serializePhaseB1PairedTerminalWaveformArtifactV1(
        pairedWaveformArtifact,
        sha256,
      );
    const serializedMatchedVolume =
      serializePhaseB1PairedAtrialMatchedVolumePressureAttributionArtifactV1(
        matchedVolumeArtifact,
        sha256,
      );
    writeAtomically(morphologyOutputPath, serializedMorphology);
    writeAtomically(pairedWaveformOutputPath, serializedPairedWaveform);
    writeAtomically(matchedVolumeOutputPath, serializedMatchedVolume);

    print({
      stage: "paired-visual-artifacts-final",
      elapsedSec: elapsedSec(startedAtMs),
      morphologyOutputPath,
      morphologyArtifactContentSha256: morphologyArtifact.contentSha256,
      morphologyAnalysisManifestContentSha256:
        morphologyAnalysisManifest.contentSha256,
      morphologyClassificationByMode: {
        off: {
          LA: morphologyArtifact.morphologyByMode.off.LA.classification,
          RA: morphologyArtifact.morphologyByMode.off.RA.classification,
        },
        on: {
          LA: morphologyArtifact.morphologyByMode.on.LA.classification,
          RA: morphologyArtifact.morphologyByMode.on.RA.classification,
        },
      },
      pairedMorphologyOutcomeByAtrium:
        morphologyArtifact.pairedOutcomeByAtrium,
      morphologyProjectedSampleCountByMode: {
        off: morphologyProjectionByMode.off.projectedPeriodicSampleCount,
        on: morphologyProjectionByMode.on.projectedPeriodicSampleCount,
      },
      duplicatedCycleEndPointDroppedByMode: {
        off: morphologyProjectionByMode.off.duplicatedCycleEndPointDropped,
        on: morphologyProjectionByMode.on.duplicatedCycleEndPointDropped,
      },
      slsOffTerminalObservationContentSha256:
        terminalObservationByMode.off.contentSha256,
      slsOnTerminalObservationContentSha256:
        terminalObservationByMode.on.contentSha256,
      pairedWaveformOutputPath,
      pairedWaveformArtifactContentSha256:
        pairedWaveformArtifact.contentSha256,
      pairedWaveformSelectedSampleCountByMode: {
        off: pairedWaveformArtifact.modeDiagnostics.off.selectedSampleCount,
        on: pairedWaveformArtifact.modeDiagnostics.on.selectedSampleCount,
      },
      matchedVolumeOutputPath,
      matchedVolumeArtifactContentSha256:
        matchedVolumeArtifact.contentSha256,
      matchedVolumeArtifactStatus: matchedVolumeArtifact.status,
      matchedVolumeAnalysisManifestContentSha256:
        matchedVolumeAnalysisManifest.contentSha256,
      matchedVolumeArtifactIntegrityGatePass:
        matchedVolumeArtifact.gateAudit.artifactIntegrityGatePass,
      matchedVolumePhaseStatusByAtrium: {
        LA: matchedVolumeArtifact.attributionByAtrium.LA.map((phase) => ({
          phaseId: phase.phaseId,
          status: phase.status,
          measuredWindowByMode: phase.measuredWindowByMode,
        })),
        RA: matchedVolumeArtifact.attributionByAtrium.RA.map((phase) => ({
          phaseId: phase.phaseId,
          status: phase.status,
          measuredWindowByMode: phase.measuredWindowByMode,
        })),
      },
      matchedVolumeMaximumAbsoluteSourceReconstructionResidualPa:
        matchedVolumeAdapter.audit
          .maximumAbsoluteSourceReconstructionResidualPa,
      matchedVolumeSlsOffNearZeroAuditPass:
        matchedVolumeAdapter.audit.slsOffNearZeroAuditPass,
      matchedVolumeSourceObservationsAuthenticatedInProcess:
        matchedVolumeAdapter.sourceObservationsAuthenticatedInProcess,
      morphologyReportCompletenessGatePass:
        morphologyArtifact.morphologyReportCompletenessGatePass,
      morphologyOutcomeUsedAsAcceptanceGate: false,
      morphologyClassificationAffectsExitCode: false,
      pairedWaveformOutcomeUsedAsPassFailGate: false,
      matchedVolumeArtifactIntegrityAffectsExitCode: false,
      pressureDeltaSignUsedAsAcceptanceGate: false,
      slsOffNearZeroAuditUsedAsAcceptanceGate: false,
      slsOffFigureEightTopologyRequired: false,
      fullRequiredSlsAblationReportComplete: false,
      reservoirConduitPumpPhaseOwnershipIncluded: true,
      matchedVolumePressureAttributionIncluded: true,
      waveformAmplitudeDeltasIncluded: false,
      causalEffectOfSlsEstablished: false,
      authenticatedInProcessBeforeSerialization: true,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass:
        paired.pairedOneMillisecondPeriodicEvidencePass,
      ...broadFalseClaims(),
      claimBoundary: CLAIM_BOUNDARY,
      claimBoundaryByArtifact: {
        morphology: morphologyArtifact.claimBoundary,
        pairedWaveform: pairedWaveformArtifact.interpretationBoundary,
        matchedVolume: matchedVolumeArtifact.claimBoundary,
      },
    });
    process.exitCode = 0;
  } catch (error) {
    print({
      stage: "diagnostic-tool-failure",
      elapsedSec: elapsedSec(startedAtMs),
      failureReason: error instanceof Error ? error.message : String(error),
      pairedPeriodicEvidenceIssued: false,
      externalPairedFailureRecompositionPerformed: false,
      authenticatedInProcessBeforeSerialization: false,
      builderIssuedAuthenticationSurvivesSerialization: false,
      pairedOneMillisecondPeriodicEvidencePass: false,
      ...broadFalseClaims(),
      claimBoundary: CLAIM_BOUNDARY,
    });
    process.exitCode = 1;
  }
}

function initializeController(
  mode: PhaseB1PairedLivePeriodicModeV1,
  sourceCase: Parameters<
    typeof initializePhaseB1NormalSinusBeLivePeriodicControllerV1
  >[0]["sourceCase"],
  schedule: Parameters<
    typeof initializePhaseB1NormalSinusBeLivePeriodicControllerV1
  >[0]["schedule"],
): PhaseB1NormalSinusBeLivePeriodicControllerV1 {
  const controller = assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
    initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
      sourceCase,
      schedule,
      nominalDtSec: CONFIG.nominalDtSec,
      sha256Hex: sha256,
    }),
  );
  if (controller.slsMode !== mode) {
    throw new Error("paired controller mode differs from requested parent mode");
  }
  return controller;
}

function assertInitialParityBinding(
  audit: PhaseB1NormalSinusBePairedSourceParityAuditV1,
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numerical: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
): void {
  if (
    !Object.is(audit.parentManifest, manifest)
    || !Object.is(audit.parentNumericalEvidence, numerical)
    || !Object.is(audit.schedule, schedule)
    || audit.initialCommonCoordinateParityPass !== true
    || audit.allEightInitialFlowsExactlyEqualAndZero !== true
  ) throw new Error("paired initial source parity binding differs");
}

function assertPairedControllerInitialization(
  controllers: Readonly<{
    off: PhaseB1NormalSinusBeLivePeriodicControllerV1;
    on: PhaseB1NormalSinusBeLivePeriodicControllerV1;
  }>,
  parity: PhaseB1NormalSinusBePairedSourceParityAuditV1,
  numerical: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
): void {
  for (const mode of CONFIG.modeOrder) {
    const controller = controllers[mode];
    const parentSource = numerical.results[mode].eventFreeCase;
    const paritySource = mode === "off"
      ? parity.slsOffSourceCase
      : parity.slsOnSourceCase;
    if (
      controller.slsMode !== mode
      || controller.nominalDtSec !== CONFIG.nominalDtSec
      || controller.completedCycleEvidenceCount !== 0
      || controller.lastCycleEvidence !== null
      || controller.cycleEvidenceChainHeadContentSha256 !== null
      || !Object.is(controller.schedule, schedule)
      || !Object.is(controller.sourceCase.inverse, parentSource.inverse)
      || !Object.is(
        controller.sourceCase.referenceEndpoint,
        paritySource.referenceEndpoint,
      )
    ) throw new Error("paired initial controller binding differs");
  }
}

function assertSuccessfulModeBinding(
  outcome: PhaseB1LivePeriodicRetainedModeRunSuccessV1,
  mode: PhaseB1PairedLivePeriodicModeV1,
  manifest: PhaseB1QuiescentReferenceEvidenceManifestV1,
  numerical: PhaseB1QuiescentReferenceNumericalEvidenceBundleV1,
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
): void {
  const capsule = outcome.terminalCycleCapsule;
  if (
    outcome.mode !== mode
    || capsule.slsMode !== mode
    || capsule.nominalDtSec !== CONFIG.nominalDtSec
    || capsule.terminalStatus !== "converged"
    || capsule.terminalCycleConvergencePass !== true
    || capsule.liveSingleStartPeriodOneCriterionPass !== true
    || !Object.is(capsule.parentManifest, manifest)
    || !Object.is(capsule.parentNumericalEvidence, numerical)
    || !Object.is(capsule.schedule, schedule)
    || !Object.is(
      outcome.committedCycleMechanicalEnergyAudit
        .sourceTerminalCycleCapsule,
      capsule,
    )
    || outcome.terminalEvidenceSummary.terminalCycleCapsuleContentSha256
      !== capsule.contentSha256
  ) throw new Error("successful paired mode retained binding differs");
}

function printPairedEvidenceNotIssued(input: Readonly<{
  mode: PhaseB1PairedLivePeriodicModeV1;
  failureKind: "live-periodic-cycle-failure" | "maximum-supercycles-exhausted";
  failureContentSha256: string;
  otherModeStatus: "initialized-unadvanced" | "converged-capsule-retained";
  retainedOffCapsuleContentSha256: string | null;
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  initialSourceParityAuditContentSha256: string;
  startedAtMs: number;
  disposition: ReturnType<
    typeof decidePhaseB1PairedLivePeriodicModeDispositionV1
  >;
}>): void {
  print({
    stage: "paired-evidence-not-issued",
    failedMode: input.mode,
    failureKind: input.failureKind,
    failureContentSha256: input.failureContentSha256,
    otherModeStatus: input.otherModeStatus,
    retainedOffCapsuleContentSha256:
      input.retainedOffCapsuleContentSha256,
    parentManifestContentSha256: input.parentManifestContentSha256,
    parentNumericalEvidenceContentSha256:
      input.parentNumericalEvidenceContentSha256,
    scheduleContentSha256: input.scheduleContentSha256,
    initialSourceParityAuditContentSha256:
      input.initialSourceParityAuditContentSha256,
    elapsedSec: elapsedSec(input.startedAtMs),
    stopOnFirstModeFailure: true,
    pairedPeriodicEvidenceIssued: false,
    externalPairedFailureRecompositionPerformed: false,
    pairedOneMillisecondPeriodicEvidencePass: false,
    capExhaustionAcceptedAsSuccess: false,
    authenticatedInProcessBeforeSerialization: false,
    builderIssuedAuthenticationSurvivesSerialization: false,
    ...broadFalseClaims(),
    disposition: input.disposition,
    claimBoundary: CLAIM_BOUNDARY,
  });
}

function summarizeRunnerFailure(
  scheduleRun: Readonly<{
    completed: boolean;
    attemptedTransactionCount: number;
    solverRetrySubdivisionCount: number;
    solverRetryAttemptCount: number;
    maximumRetryDepthUsed: number;
    explicitSolverRetryUsed: boolean;
    testFailureProbeUsed: boolean;
  }>,
) {
  return Object.freeze({
    completed: scheduleRun.completed,
    attemptedTransactionCount: scheduleRun.attemptedTransactionCount,
    solverRetrySubdivisionCount: scheduleRun.solverRetrySubdivisionCount,
    solverRetryAttemptCount: scheduleRun.solverRetryAttemptCount,
    maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
    explicitSolverRetryUsed: scheduleRun.explicitSolverRetryUsed,
    testFailureProbeUsed: scheduleRun.testFailureProbeUsed,
  });
}

type MorphologyDestinationRegistryV1 =
  PhaseB1NormalSinusBeTerminalTimestepObservationV1[
    "terminalCycleCapsule"
  ]["sourceCase"]["destinationRegistry"];

function buildPreOutcomeAtrialPvMorphologyScaleAudit(
  slsOffRegistry: MorphologyDestinationRegistryV1,
  slsOnRegistry: MorphologyDestinationRegistryV1,
) {
  if (
    slsOffRegistry.fixedBeforeRun !== true
    || slsOnRegistry.fixedBeforeRun !== true
    || slsOffRegistry.adaptiveRescaling !== false
    || slsOnRegistry.adaptiveRescaling !== false
  ) {
    throw new Error(
      "paired atrial PV morphology scales must come from two fixed pre-outcome registries",
    );
  }
  const selectedScalePairs = [
    [
      slsOffRegistry.unknownScales.bloodVolumeM3.LA,
      slsOnRegistry.unknownScales.bloodVolumeM3.LA,
    ],
    [
      slsOffRegistry.unknownScales.bloodVolumeM3.RA,
      slsOnRegistry.unknownScales.bloodVolumeM3.RA,
    ],
    [
      slsOffRegistry.residualScales.pressurePa,
      slsOnRegistry.residualScales.pressurePa,
    ],
  ] as const;
  if (selectedScalePairs.some(([off, on]) =>
    !Number.isFinite(off)
    || !(off > 0)
    || !Number.isFinite(on)
    || !(on > 0)
    || !Object.is(off, on))) {
    throw new Error(
      "SLS-off/on pre-outcome atrial PV morphology scales differ",
    );
  }
  const pressureScale = slsOffRegistry.residualScales.pressurePa;
  const coordinateScaleByAtrium = Object.freeze({
    LA: Object.freeze({
      volumeM3: slsOffRegistry.unknownScales.bloodVolumeM3.LA,
      cavityPressurePa: pressureScale,
    }),
    RA: Object.freeze({
      volumeM3: slsOffRegistry.unknownScales.bloodVolumeM3.RA,
      cavityPressurePa: pressureScale,
    }),
  });
  return Object.freeze({
    coordinateScaleByAtrium,
    slsOffNewtonScaleRegistryContentSha256:
      slsOffRegistry.registryContentSha256,
    slsOnNewtonScaleRegistryContentSha256:
      slsOnRegistry.registryContentSha256,
    fullRegistryContentSha256ParityPass:
      slsOffRegistry.registryContentSha256
        === slsOnRegistry.registryContentSha256,
    selectedAtrialPvScaleParityPass: true as const,
  });
}

function assertTerminalObservationMorphologyScaleBinding(
  observation: PhaseB1NormalSinusBeTerminalTimestepObservationV1,
  expectedRegistryContentSha256: string,
  coordinateScaleByAtrium: Readonly<Record<
    "LA" | "RA",
    PhaseB1AtrialPvMorphologyCoordinateScaleV1
  >>,
): void {
  const registry = observation.terminalCycleCapsule.sourceCase
    .destinationRegistry;
  if (
    observation.sourceNewtonScaleRegistryContentSha256
      !== expectedRegistryContentSha256
    || registry.registryContentSha256 !== expectedRegistryContentSha256
    || !Object.is(
      registry.unknownScales.bloodVolumeM3.LA,
      coordinateScaleByAtrium.LA.volumeM3,
    )
    || !Object.is(
      registry.unknownScales.bloodVolumeM3.RA,
      coordinateScaleByAtrium.RA.volumeM3,
    )
    || !Object.is(
      registry.residualScales.pressurePa,
      coordinateScaleByAtrium.LA.cavityPressurePa,
    )
    || !Object.is(
      registry.residualScales.pressurePa,
      coordinateScaleByAtrium.RA.cavityPressurePa,
    )
    || registry.fixedBeforeRun !== true
    || registry.adaptiveRescaling !== false
  ) {
    throw new Error(
      "terminal observation drifted from the pre-outcome paired atrial PV morphology scales",
    );
  }
}

function resolveOutputPaths(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): Readonly<{
  morphologyOutputPath: string;
  pairedWaveformOutputPath: string;
  matchedVolumeOutputPath: string;
}> {
  let morphologyCliValue: string | undefined;
  let pairedWaveformCliValue: string | undefined;
  let matchedVolumeCliValue: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--morphology-output") {
      if (morphologyCliValue !== undefined || index + 1 >= argv.length) {
        throw new Error(
          "--morphology-output must be supplied exactly once with a path",
        );
      }
      morphologyCliValue = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--morphology-output=")) {
      if (morphologyCliValue !== undefined) {
        throw new Error("--morphology-output must be supplied at most once");
      }
      morphologyCliValue = argument.slice("--morphology-output=".length);
    } else if (argument === "--paired-waveform-output") {
      if (pairedWaveformCliValue !== undefined || index + 1 >= argv.length) {
        throw new Error(
          "--paired-waveform-output must be supplied exactly once with a path",
        );
      }
      pairedWaveformCliValue = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--paired-waveform-output=")) {
      if (pairedWaveformCliValue !== undefined) {
        throw new Error(
          "--paired-waveform-output must be supplied at most once",
        );
      }
      pairedWaveformCliValue = argument.slice(
        "--paired-waveform-output=".length,
      );
    } else if (argument === "--matched-volume-output") {
      if (matchedVolumeCliValue !== undefined || index + 1 >= argv.length) {
        throw new Error(
          "--matched-volume-output must be supplied exactly once with a path",
        );
      }
      matchedVolumeCliValue = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--matched-volume-output=")) {
      if (matchedVolumeCliValue !== undefined) {
        throw new Error(
          "--matched-volume-output must be supplied at most once",
        );
      }
      matchedVolumeCliValue = argument.slice(
        "--matched-volume-output=".length,
      );
    } else {
      throw new Error(`unsupported argument ${argument}`);
    }
  }
  const morphologyOutputPath = resolveOutputPathValue(
    morphologyCliValue ?? env[MORPHOLOGY_OUTPUT_ENV]
      ?? DEFAULT_MORPHOLOGY_OUTPUT,
    "paired atrial PV morphology output",
  );
  const pairedWaveformOutputPath = resolveOutputPathValue(
    pairedWaveformCliValue ?? env[PAIRED_WAVEFORM_OUTPUT_ENV]
      ?? DEFAULT_PAIRED_WAVEFORM_OUTPUT,
    "paired terminal waveform output",
  );
  const matchedVolumeOutputPath = resolveOutputPathValue(
    matchedVolumeCliValue ?? env[MATCHED_VOLUME_OUTPUT_ENV]
      ?? DEFAULT_MATCHED_VOLUME_OUTPUT,
    "paired atrial matched-volume pressure attribution output",
  );
  if (new Set([
    morphologyOutputPath,
    pairedWaveformOutputPath,
    matchedVolumeOutputPath,
  ]).size !== 3) {
    throw new Error(
      "paired visual and matched-volume outputs must use distinct paths",
    );
  }
  return Object.freeze({
    morphologyOutputPath,
    pairedWaveformOutputPath,
    matchedVolumeOutputPath,
  });
}

function resolveOutputPathValue(raw: string, label: string): string {
  if (raw.trim().length === 0 || raw.includes("\0")) {
    throw new Error(`${label} path must be non-empty`);
  }
  return path.resolve(process.cwd(), raw);
}

function writeAtomically(outputPath: string, serialized: string): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, serialized, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    renameSync(temporaryPath, outputPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

function broadFalseClaims() {
  return {
    fullBeatAcceptancePass: false as const,
    normalSinusMultiStartAcceptancePass: false as const,
    timestepConvergenceAcceptancePass: false as const,
    cycleEnergyAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
  };
}

function elapsedSec(startedAtMs: number): number {
  return (performance.now() - startedAtMs) / 1000;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function print(value: unknown): void {
  // JSONL is a diagnostic projection only. Builder-issued WeakSet
  // authentication is intentionally not claimed after serialization.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    schemaId: DIAGNOSTIC_ID,
    sequence: jsonlSequence,
    ...(value as Record<string, unknown>),
    testOnly: true,
  }));
  jsonlSequence += 1;
}

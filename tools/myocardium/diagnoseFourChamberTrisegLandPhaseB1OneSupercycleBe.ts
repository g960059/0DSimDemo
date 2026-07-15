import { createHash } from "node:crypto";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  runPhaseB1ProjectSyntheticOneSupercycleBeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticOneSupercycleBeV1";

const mode = requireMode(process.env.PHASE_B1_ONE_SUPERCYCLE_MODE ?? "off");
const nominalDtSec = requireTimeStep(
  process.env.PHASE_B1_ONE_SUPERCYCLE_DT_SEC ?? "0.001",
);
const startedAtMs = performance.now();

try {
  const manifest = buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  const numerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
    manifest,
    sha256,
  );
  const schedule =
    buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const parentReadyAtMs = performance.now();
  const result = runPhaseB1ProjectSyntheticOneSupercycleBeV1({
    sourceCase: numerical.results[mode].eventFreeCase,
    schedule,
    nominalDtSec,
    sha256Hex: sha256,
  });
  const finishedAtMs = performance.now();
  if (result.completed === false) {
    const scheduleRun = result.scheduleRun;
    const scheduleItselfFailed = "lastAcceptedEndpoint" in scheduleRun;
    const lastAcceptedTimeSec = scheduleItselfFailed
      ? scheduleRun.lastAcceptedEndpoint.timeSec
      : scheduleRun.finalEndpoint.timeSec;
    const completedRequestedSegmentCount = scheduleItselfFailed
      ? scheduleRun.completedRequestedSegmentCount
      : scheduleRun.requestedSegmentCount;
    const completedTransactionCount = scheduleItselfFailed
      ? scheduleRun.completedTransactionCount
      : scheduleRun.acceptedTransactionCount;
    print({
      pass: false,
      mode,
      nominalDtSec,
      parentBuildElapsedSec: (parentReadyAtMs - startedAtMs) / 1000,
      integrationElapsedSec: (finishedAtMs - parentReadyAtMs) / 1000,
      failureStage: result.failureStage,
      failureReason: result.failureReason,
      lastAcceptedTimeSec,
      completedRequestedSegmentCount,
      completedTransactionCount,
      attemptedTransactionCount: scheduleRun.attemptedTransactionCount,
      maximumRetryDepthUsed: scheduleRun.maximumRetryDepthUsed,
      explicitSolverRetryUsed: scheduleRun.explicitSolverRetryUsed,
      orderedAttemptTraceSha256: result.orderedAttemptTraceSha256,
      fullBeatAcceptancePass: false,
      periodicityAcceptancePass: false,
      phaseB1AcceptancePass: false,
    });
    process.exitCode = 1;
  } else {
    print({
      pass: result.projectSyntheticOneSupercycleBeExecutionPass
        && (
          !result.fiveWallResponseProtocolRequiredForThisRun
          || result.referenceDtFiveWallResponsePass
        ),
      mode,
      nominalDtSec,
      parentBuildElapsedSec: (parentReadyAtMs - startedAtMs) / 1000,
      integrationElapsedSec: (finishedAtMs - parentReadyAtMs) / 1000,
      requestedSegmentCount: result.scheduleRun.requestedSegmentCount,
      acceptedTransactionCount: result.scheduleRun.acceptedTransactionCount,
      attemptedTransactionCount: result.scheduleRun.attemptedTransactionCount,
      eventBoundaryCount: result.scheduleRun.eventBoundaryCount,
      offGridEventSplitCount: result.scheduleRun.offGridEventSplitCount,
      oneUlpNominalGridBoundaryCoalescenceCount:
        result.scheduleRun.oneUlpNominalGridBoundaryCoalescenceCount,
      oneUlpRunEndNominalGridBoundaryCoalescenceCount:
        result.scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount,
      runEndTimeSnappingApplied:
        result.scheduleRun.runEndTimeSnappingApplied,
      solverRetrySubdivisionCount:
        result.scheduleRun.solverRetrySubdivisionCount,
      maximumRetryDepthUsed: result.scheduleRun.maximumRetryDepthUsed,
      completeEndpointDistance:
        result.completeEndpointMetric.maximumNormalizedDistance,
      maximumRelativeTotalBloodVolumeDrift:
        result.committedIntervalLedger.maximumRelativeTotalBloodVolumeDrift,
      maximumAbsoluteCompartmentClosureResidualM3:
        result.committedIntervalLedger
          .maximumAbsoluteCompartmentClosureResidualM3,
      maximumScaledResidualInfinityNorm:
        result.committedIntervalLedger.maximumScaledResidualInfinityNorm,
      maximumScaledUpdateInfinityNorm:
        result.committedIntervalLedger.maximumScaledUpdateInfinityNorm,
      maximumSlsNormalizedIdentityResidual:
        result.committedIntervalLedger.maximumSlsNormalizedIdentityResidual,
      maximizingSlsIdentityTransactionIndex:
        result.committedIntervalLedger.maximizingSlsIdentityTransactionIndex,
      maximizingSlsIdentityEndTimeSec:
        result.committedIntervalLedger.maximizingSlsIdentityEndTimeSec,
      maximizingSlsIdentityWallId:
        result.committedIntervalLedger.maximizingSlsIdentityWallId,
      maximumSlsAbsoluteAlphaMismatch:
        result.committedIntervalLedger.maximumSlsAbsoluteAlphaMismatch,
      maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic:
        result.committedIntervalLedger
          .maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic,
      minimumLandSimplexMargin:
        result.committedIntervalLedger.minimumLandSimplexMargin,
      wallResponseExcursionDiagnostics:
        result.committedIntervalLedger.wallResponseByWall,
      maximumAbsoluteFlowChangeFromInitialM3PerSec:
        result.committedIntervalLedger
          .maximumAbsoluteFlowChangeFromInitialM3PerSec,
      maximumAbsoluteBloodVolumeChangeFromInitialM3:
        result.committedIntervalLedger
          .maximumAbsoluteBloodVolumeChangeFromInitialM3,
      oneSupercycleIntervalAudit: result.oneSupercycleIntervalAudit,
      fiveWallScaleSeparatedResponseDetected:
        result.fiveWallScaleSeparatedResponseDetected,
      projectSyntheticOneSupercycleBeExecutionPass:
        result.projectSyntheticOneSupercycleBeExecutionPass,
      referenceDtFiveWallResponsePass:
        result.referenceDtFiveWallResponsePass,
      responseEvidenceBindingPolicyPass:
        result.responseEvidenceBindingPolicyPass,
      oneSupercycleEvidenceBundleContentSha256:
        result.oneSupercycleEvidenceBundleContentSha256,
      fiveWallResponseProtocolContentSha256:
        result.fiveWallResponseProtocol?.contentSha256 ?? null,
      fiveWallResponse:
        result.fiveWallResponseProtocol?.response ?? null,
      committedTransactionProvenanceAuditPass:
        result.scheduleRun.committedTransactionProvenanceAuditPass,
      integratedEdgeVolumeByFlow:
        result.committedIntervalLedger.integratedEdgeVolumeByFlow,
      traceBindings: result.traceBindings,
      fullBeatAcceptancePass: result.fullBeatAcceptancePass,
      periodicityAcceptancePass: result.periodicityAcceptancePass,
      cycleEnergyAcceptancePass: result.cycleEnergyAcceptancePass,
      physiologicalValidationPass: result.physiologicalValidationPass,
      phaseB1AcceptancePass: result.phaseB1AcceptancePass,
      releaseRuntimeReachable: result.releaseRuntimeReachable,
    });
    if (
      !result.projectSyntheticOneSupercycleBeExecutionPass
      || (
        result.fiveWallResponseProtocolRequiredForThisRun
        && !result.referenceDtFiveWallResponsePass
      )
    ) process.exitCode = 1;
  }
} catch (error) {
  print({
    pass: false,
    mode,
    nominalDtSec,
    failureStage: "diagnostic-tool",
    failureReason: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}

function requireMode(value: string): "on" | "off" {
  if (value !== "on" && value !== "off") {
    throw new Error("PHASE_B1_ONE_SUPERCYCLE_MODE must be on or off");
  }
  return value;
}

function requireTimeStep(value: string): 0.001 | 0.0005 | 0.00025 {
  const parsed = Number(value);
  if (parsed !== 0.001 && parsed !== 0.0005 && parsed !== 0.00025) {
    throw new Error(
      "PHASE_B1_ONE_SUPERCYCLE_DT_SEC must be 0.001, 0.0005, or 0.00025",
    );
  }
  return parsed;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function print(value: unknown): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(value, null, 2));
}

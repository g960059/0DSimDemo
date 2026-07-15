import { createHash } from "node:crypto";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  runPhaseB1ProjectSyntheticOneSupercycleBeV1,
  type PhaseB1ProjectSyntheticOneSupercycleBeResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticOneSupercycleBeV1";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";

const nominalDtSec = requireTimeStep(
  process.env.PHASE_B1_ONE_SUPERCYCLE_DT_SEC ?? "0.001",
);
const startedAtMs = performance.now();

try {
  const parentManifest =
    buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
  const parentNumerical = buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
    parentManifest,
    sha256,
  );
  const schedule =
    buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const parentReadyAtMs = performance.now();
  print({
    stage: "parent-ready",
    parentBuildElapsedSec: (parentReadyAtMs - startedAtMs) / 1000,
    parentManifestSha256: parentManifest.contentSha256,
    parentNumericalEvidenceSha256:
      parentNumerical.certificate.contentSha256,
    scheduleSha256: schedule.contentSha256,
    nominalDtSec,
  });

  let allPassed = true;
  for (const mode of ["off", "on"] as const) {
    const integrationStartedAtMs = performance.now();
    const result = runPhaseB1ProjectSyntheticOneSupercycleBeV1({
      sourceCase: parentNumerical.results[mode].eventFreeCase,
      schedule,
      nominalDtSec,
      sha256Hex: sha256,
    });
    const integrationElapsedSec =
      (performance.now() - integrationStartedAtMs) / 1000;
    const summary = summarize(mode, result, integrationElapsedSec);
    print(summary);
    allPassed &&= summary.pass;
  }
  print({
    stage: "paired-complete",
    pass: allPassed,
    totalElapsedSec: (performance.now() - startedAtMs) / 1000,
    periodicityAcceptancePass: false,
    fullBeatAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
  });
  if (!allPassed) process.exitCode = 1;
} catch (error) {
  print({
    stage: "paired-diagnostic-tool",
    pass: false,
    failureReason: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}

function summarize(
  mode: "on" | "off",
  result: PhaseB1ProjectSyntheticOneSupercycleBeResultV1,
  integrationElapsedSec: number,
) {
  if (result.completed === false) {
    return {
      stage: "mode-complete" as const,
      pass: false,
      mode,
      nominalDtSec,
      integrationElapsedSec,
      failureStage: result.failureStage,
      failureReason: result.failureReason,
      orderedAttemptTraceSha256: result.orderedAttemptTraceSha256,
    };
  }
  return {
    stage: "mode-complete" as const,
    pass: result.projectSyntheticOneSupercycleBeExecutionPass
      && (
        !result.fiveWallResponseProtocolRequiredForThisRun
        || result.referenceDtFiveWallResponsePass
      ),
    mode,
    nominalDtSec,
    integrationElapsedSec,
    requestedSegmentCount: result.scheduleRun.requestedSegmentCount,
    oneUlpRunEndNominalGridBoundaryCoalescenceCount:
      result.scheduleRun.oneUlpRunEndNominalGridBoundaryCoalescenceCount,
    runEndTimeSnappingApplied: result.scheduleRun.runEndTimeSnappingApplied,
    acceptedTransactionCount: result.scheduleRun.acceptedTransactionCount,
    attemptedTransactionCount: result.scheduleRun.attemptedTransactionCount,
    eventTransactionCount: result.traceBindings.eventTransactionCount,
    solverRetrySubdivisionCount:
      result.scheduleRun.solverRetrySubdivisionCount,
    maximumRetryDepthUsed: result.scheduleRun.maximumRetryDepthUsed,
    committedTransactionProvenanceAuditPass:
      result.scheduleRun.committedTransactionProvenanceAuditPass,
    exactOneScheduleSupercycleVerified:
      result.oneSupercycleIntervalAudit.exactOneScheduleSupercycleVerified,
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
    completeEndpointDistance:
      result.completeEndpointMetric.maximumNormalizedDistance,
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
    fiveWallResponse: result.fiveWallResponseProtocol?.response ?? null,
    traceBundleContentSha256:
      result.traceBindings.traceBundleContentSha256,
    periodicityAcceptancePass: result.periodicityAcceptancePass,
    fullBeatAcceptancePass: result.fullBeatAcceptancePass,
    physiologicalValidationPass: result.physiologicalValidationPass,
    phaseB1AcceptancePass: result.phaseB1AcceptancePass,
  };
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
  console.log(JSON.stringify(value));
}

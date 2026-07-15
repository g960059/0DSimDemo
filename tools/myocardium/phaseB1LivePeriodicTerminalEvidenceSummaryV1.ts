import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
  type PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID =
  "phase-b1-live-periodic-terminal-evidence-summary-v1" as const;

export const PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_POLICY_V1 =
  deepFreeze({
    retainedBuilderIssuedTerminalArtifactsRequired: true,
    retainedLiveControllerSourceCaseRequired: true,
    numericalCycleRerunAllowed: false,
    committedCycleEnergyAuditRequiredBeforeTerminalEvidenceSerialization: true,
    builderIssuedAuthenticationSurvivesSerialization: false,
    fullBeatAcceptanceClaimed: false,
    multiStartAcceptanceClaimed: false,
    timestepConvergenceClaimed: false,
    cycleEnergyAcceptanceClaimed: false,
    physiologicalValidationClaimed: false,
    phaseB1AcceptanceClaimed: false,
    modelCoreOrBrowserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
  } as const);

const BUILDER_ISSUED_SUMMARIES = new WeakSet<object>();

export type PhaseB1LivePeriodicTerminalEvidenceSummaryPayloadV1 = Readonly<{
  summaryId: typeof PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID;
  stage: "terminal-retained-evidence";
  parentManifestContentSha256: string;
  parentNumericalEvidenceContentSha256: string;
  scheduleContentSha256: string;
  slsMode: "on" | "off";
  nominalDtSec: number;
  completedSupercycleCount: number;
  finalCycleIndex: number;
  terminalStatus: "converged";
  terminalCycleCapsuleContentSha256: string;
  terminalResultContentSha256: string;
  finalCommittedSupercycleAuditContentSha256: string;
  finalPeriodicCheckpointContentSha256: string;
  finalCycleEvidenceContentSha256: string;
  sourceScheduleRunnerAttemptTraceContentSha256: string;
  committedIntervalLedgerSummaryContentSha256: string;
  initialEndpointContentSha256: string;
  finalEndpointContentSha256: string;
  committedCycleMechanicalEnergyAuditContentSha256: string;
  committedCycleMechanicalEnergyStageTraceContentSha256: string;
  energySourceTerminalCycleCapsuleContentSha256: string;
  energySourceFinalCommittedSupercycleAuditContentSha256: string;
  acceptedTransactionCount: number;
  committedIntervalLedgerTransactionCount: number;
  energyStageCount: number;
  energyAggregationTransactionCount: number;
  terminalArtifactsHashAndObjectCrossLinksVerified: true;
  energyCapsuleHashAndObjectCrossLinksVerified: true;
  retainedLiveControllerSourceCaseConsumed: true;
  numericalCycleRerunPerformed: false;
  authenticatedInProcessBeforeSerialization: true;
  builderIssuedAuthenticationSurvivesSerialization: false;
  liveSingleStartPeriodOneCriterionPass: true;
  terminalCommittedCycleMechanicalEnergyAuditCompleted: true;
  quarterMillisecondSingleCycleEnergyGatePass: boolean;
  fullBeatAcceptancePass: false;
  normalSinusMultiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  wholeHeartBackwardEulerEnergyAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  exitDecision: PhaseB1LivePeriodicTerminalExitDecisionV1;
  testOnly: true;
  claimBoundary:
    typeof PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_POLICY_V1;
}>;

export type PhaseB1LivePeriodicTerminalEvidenceSummaryV1 =
  PhaseB1LivePeriodicTerminalEvidenceSummaryPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type PhaseB1LivePeriodicTerminalExitDecisionV1 = Readonly<{
  classification: "terminal-evidence-success" | "terminal-evidence-failure";
  exitCode: 0 | 1;
  terminalStatus: "converged" | "maximum-supercycles-exhausted";
  terminalCycleCapsuleFinalized: true;
  committedCycleMechanicalEnergyAuditBuilt: boolean;
  terminalEvidenceSummaryBuilt: boolean;
}>;

export function decidePhaseB1LivePeriodicTerminalExitV1(
  input: Readonly<{
    terminalStatus: "converged" | "maximum-supercycles-exhausted";
    terminalCycleCapsuleFinalized: boolean;
    committedCycleMechanicalEnergyAuditBuilt: boolean;
    terminalEvidenceSummaryBuilt: boolean;
  }>,
): PhaseB1LivePeriodicTerminalExitDecisionV1 {
  assertExactPlainRecordV1(input, [
    "terminalStatus",
    "terminalCycleCapsuleFinalized",
    "committedCycleMechanicalEnergyAuditBuilt",
    "terminalEvidenceSummaryBuilt",
  ], "Phase B1 live-periodic terminal exit input");
  if (
    input.terminalStatus !== "converged"
    && input.terminalStatus !== "maximum-supercycles-exhausted"
  ) throw new Error("terminal exit requires a closed terminal status");
  if (input.terminalCycleCapsuleFinalized !== true) {
    throw new Error("terminal exit requires capsule finalization");
  }
  if (
    input.terminalStatus === "maximum-supercycles-exhausted"
    && (
      input.committedCycleMechanicalEnergyAuditBuilt
      || input.terminalEvidenceSummaryBuilt
    )
  ) throw new Error("cap exhaustion cannot carry successful energy evidence");
  const success = input.terminalStatus === "converged"
    && input.committedCycleMechanicalEnergyAuditBuilt
    && input.terminalEvidenceSummaryBuilt;
  return Object.freeze({
    classification: success
      ? "terminal-evidence-success" as const
      : "terminal-evidence-failure" as const,
    exitCode: success ? 0 as const : 1 as const,
    terminalStatus: input.terminalStatus,
    terminalCycleCapsuleFinalized: true as const,
    committedCycleMechanicalEnergyAuditBuilt:
      input.committedCycleMechanicalEnergyAuditBuilt,
    terminalEvidenceSummaryBuilt: input.terminalEvidenceSummaryBuilt,
  });
}

export function buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
  input: Readonly<{
    terminalCycleCapsule: PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
    committedCycleMechanicalEnergyAudit:
      PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1LivePeriodicTerminalEvidenceSummaryV1 {
  assertExactPlainRecordV1(input, [
    "terminalCycleCapsule",
    "committedCycleMechanicalEnergyAudit",
    "sha256Hex",
  ], "Phase B1 live-periodic terminal evidence summary input");
  requireSha256Provider(input.sha256Hex);
  const capsule =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
      input.terminalCycleCapsule,
      input.sha256Hex,
    );
  const energy =
    assertBuilderIssuedPhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1(
      input.committedCycleMechanicalEnergyAudit,
      input.sha256Hex,
    );
  const acceptedTransactionCount =
    capsule.sourceScheduleRun.acceptedTransactions.length;
  const committedIntervalLedgerTransactionCount =
    capsule.committedIntervalLedger.committedTransactionCount;
  const energyStageCount = energy.stageTrace.stages.length;
  const energyAggregationTransactionCount =
    energy.aggregation.transactionCount;
  if (
    capsule.terminalStatus !== "converged"
    || capsule.terminalCycleConvergencePass !== true
    || capsule.liveSingleStartPeriodOneCriterionPass !== true
    || !Object.is(energy.sourceTerminalCycleCapsule, capsule)
    || energy.sourceTerminalCycleCapsuleContentSha256 !== capsule.contentSha256
    || energy.sourceFinalCommittedSupercycleAuditContentSha256
      !== capsule.finalCommittedSupercycleAuditContentSha256
    || energy.sourceRunnerAttemptTraceContentSha256
      !== capsule.sourceScheduleRunnerAttemptTraceContentSha256
    || energy.sourceCommittedIntervalLedgerSummaryContentSha256
      !== capsule.committedIntervalLedgerSummaryContentSha256
    || energy.sourceInitialEndpointContentSha256
      !== capsule.initialEndpointContentSha256
    || energy.sourceFinalEndpointContentSha256
      !== capsule.finalEndpointContentSha256
    || acceptedTransactionCount !== committedIntervalLedgerTransactionCount
    || acceptedTransactionCount !== energyStageCount
    || acceptedTransactionCount !== energyAggregationTransactionCount
    || energy.terminalCommittedCycleMechanicalEnergyAuditCompleted !== true
    || energy.cycleEnergyAcceptancePass !== false
    || energy.wholeHeartBackwardEulerEnergyAcceptancePass !== false
    || energy.physiologicalValidationPass !== false
    || energy.phaseB1AcceptancePass !== false
    || energy.releaseRuntimeReachable !== false
  ) throw new Error("terminal capsule and energy evidence cross-links differ");
  const exitDecision = decidePhaseB1LivePeriodicTerminalExitV1({
    terminalStatus: "converged",
    terminalCycleCapsuleFinalized: true,
    committedCycleMechanicalEnergyAuditBuilt: true,
    terminalEvidenceSummaryBuilt: true,
  });

  const payload = deepFreeze<PhaseB1LivePeriodicTerminalEvidenceSummaryPayloadV1>({
    summaryId: PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID,
    stage: "terminal-retained-evidence",
    parentManifestContentSha256: capsule.parentManifestContentSha256,
    parentNumericalEvidenceContentSha256:
      capsule.parentNumericalEvidenceContentSha256,
    scheduleContentSha256: capsule.scheduleContentSha256,
    slsMode: capsule.slsMode,
    nominalDtSec: capsule.nominalDtSec,
    completedSupercycleCount: capsule.completedSupercycleCount,
    finalCycleIndex: capsule.finalCycleIndex,
    terminalStatus: "converged",
    terminalCycleCapsuleContentSha256: capsule.contentSha256,
    terminalResultContentSha256: capsule.terminalResultContentSha256,
    finalCommittedSupercycleAuditContentSha256:
      capsule.finalCommittedSupercycleAuditContentSha256,
    finalPeriodicCheckpointContentSha256:
      capsule.finalPeriodicCheckpointContentSha256,
    finalCycleEvidenceContentSha256: capsule.finalCycleEvidenceContentSha256,
    sourceScheduleRunnerAttemptTraceContentSha256:
      capsule.sourceScheduleRunnerAttemptTraceContentSha256,
    committedIntervalLedgerSummaryContentSha256:
      capsule.committedIntervalLedgerSummaryContentSha256,
    initialEndpointContentSha256: capsule.initialEndpointContentSha256,
    finalEndpointContentSha256: capsule.finalEndpointContentSha256,
    committedCycleMechanicalEnergyAuditContentSha256: energy.contentSha256,
    committedCycleMechanicalEnergyStageTraceContentSha256:
      energy.stageTraceContentSha256,
    energySourceTerminalCycleCapsuleContentSha256:
      energy.sourceTerminalCycleCapsuleContentSha256,
    energySourceFinalCommittedSupercycleAuditContentSha256:
      energy.sourceFinalCommittedSupercycleAuditContentSha256,
    acceptedTransactionCount,
    committedIntervalLedgerTransactionCount,
    energyStageCount,
    energyAggregationTransactionCount,
    terminalArtifactsHashAndObjectCrossLinksVerified: true,
    energyCapsuleHashAndObjectCrossLinksVerified: true,
    retainedLiveControllerSourceCaseConsumed: true,
    numericalCycleRerunPerformed: false,
    authenticatedInProcessBeforeSerialization: true,
    builderIssuedAuthenticationSurvivesSerialization: false,
    liveSingleStartPeriodOneCriterionPass: true,
    terminalCommittedCycleMechanicalEnergyAuditCompleted: true,
    quarterMillisecondSingleCycleEnergyGatePass:
      energy.quarterMillisecondSingleCycleEnergyGatePass,
    fullBeatAcceptancePass: false,
    normalSinusMultiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    wholeHeartBackwardEulerEnergyAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    exitDecision,
    testOnly: true,
    claimBoundary:
      PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_POLICY_V1,
  });
  const summary = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  BUILDER_ISSUED_SUMMARIES.add(summary);
  return assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
    summary,
    input.sha256Hex,
  );
}

export function assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
  value: PhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1LivePeriodicTerminalEvidenceSummaryV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_SUMMARIES.has(value)
    || value.summaryId
      !== PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID
  ) throw new Error("terminal evidence summary is not builder-issued");
  const { contentSha256, ...payload } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("terminal evidence summary content hash drifted");
  }
  return value;
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("terminal evidence summary requires a SHA-256 provider");
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

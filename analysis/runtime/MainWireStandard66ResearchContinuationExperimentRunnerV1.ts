import {
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
  MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
  confirmMainWireStandard66P1OnLiveSessionV1,
  readMainWireStandard66P1SettlingExactBoundarySuffixV1,
  runMainWireStandard66P1SettlingOnLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_PHASE_SCREEN_RUNNER_V1_ID,
  runMainWireStandard66ResearchContinuationPhaseScreenV1,
  type MainWireStandard66ResearchContinuationPhaseScreenResultV1,
} from "@/analysis/runtime/MainWireStandard66ResearchContinuationPhaseScreenRunnerV1";
import {
  MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID,
  createMainWireStandard66ResearchContinuationLiveSessionV1,
  createMainWireStandard66SelectedTraceLiveSessionV1,
  readMainWireStandard66ResearchContinuationConstructionV1,
  readMainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTraceLiveSessionConstructionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  sha256BytesHex,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type { MainWireIntegratedModelStandard66ValidationClockArmIdV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_RUNNER_V1_ID =
  "main-wire-standard66-verified-source-research-continuation-experiment-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_CLAIM_V1 =
  Object.freeze({
    purpose: "research-lane-continuation-feasibility" as const,
    sourceColdStart: true as const,
    sourceResearchP1CandidateRequired: true as const,
    sourceFreshP1ConfirmationRequired: true as const,
    sourcePrivateLiveSessionBindingVerified: true as const,
    sourceConfirmationEvidenceStateBound: true as const,
    continuationStartsAtConfirmedExactEmptyCoronaryBoundary: true as const,
    continuationHeartRatePreserved: true as const,
    lowLevelDeclaredEvidencePromotedToFormalProof: false as const,
    exactModelMutation: false as const,
    acceptedStatesPersisted: false as const,
    wallClockTimingDescriptiveOnly: true as const,
    wallClockTimingExcludedFromRunIdentity: true as const,
    formalValidationOutcomeProduced: false as const,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });

export type MainWireStandard66ResearchContinuationExperimentResultV1 =
  Readonly<{
    runnerId:
      typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_RUNNER_V1_ID;
    runIdentity: Readonly<{
      runnerId:
        typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_RUNNER_V1_ID;
      clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
      sourceConstruction:
        MainWireStandard66SelectedTraceLiveSessionConstructionV1;
      sourceSettlingProtocolIdentityHash: string;
      sourceConfirmationProtocolIdentityHash: string;
      sourceConfirmationEvidenceIdentityHash: string;
      continuationConstructionId:
        typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID;
      continuationPhaseScreenRunIdentityHash: string;
    }>;
    runIdentityHash: string;
    sourceQualification: Readonly<{
      verifiedByThisRunner: true;
      settling: Readonly<{
        runnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
        protocolIdentityHash: string;
        status: "research-period1-candidate";
        terminalAcceptedTimeSec: number;
        terminalAcceptedRevision: number;
        diagnosticConsecutivePeriod1Closures: number;
        exactBoundarySuffixCount: 4;
        terminalWindowIndex: number;
      }>;
      freshConfirmation: Readonly<{
        runnerId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID;
        protocolIdentityHash: string;
        status: "period1-confirmed";
        terminalAcceptedTimeSec: number;
        terminalAcceptedRevision: number;
        comparisonCount: number;
        consecutivePeriod1Closures: number;
        acceptedStateIdentitySha256: string;
        evidenceIdentityHash: string;
      }>;
    }>;
    continuation:
      MainWireStandard66ResearchContinuationPhaseScreenResultV1;
    formalProtocolEligibility: false;
    numericalPeriodicityEstablished: false;
    executionTiming: Readonly<{
      clock: "performance-now-monotonic-wall-clock";
      interpretation: "descriptive-host-performance-only";
      excludedFromRunIdentity: true;
      sourceQualificationWallSeconds: number;
      continuationWallSeconds: number;
      totalRunnerWallSeconds: number;
    }>;
    claim:
      typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_CLAIM_V1;
  }>;

export async function runMainWireStandard66ResearchContinuationExperimentV1(
  input: Readonly<{
    sourceHemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    targetHemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
    ventricularContractilityScale?: number;
    clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    maximumContinuationDurationSec?: number;
  }>,
): Promise<MainWireStandard66ResearchContinuationExperimentResultV1> {
  if (
    input.sourceHemodynamicResearchInputs.heartRateBpm
      !== input.targetHemodynamicResearchInputs.heartRateBpm
  ) {
    throw new Error(
      "Standard66 continuation experiment requires source and target to have the same heart rate",
    );
  }
  const runnerStartedAtMs = globalThis.performance.now();
  const sourceLiveSession =
    await createMainWireStandard66SelectedTraceLiveSessionV1({
      hemodynamicResearchInputs: input.sourceHemodynamicResearchInputs,
      mechanismResearchInputs: input.mechanismResearchInputs,
      ventricularContractilityScale: input.ventricularContractilityScale,
    });
  const sourceConstruction =
    readMainWireStandard66SelectedTraceLiveSessionConstructionV1(
      sourceLiveSession,
    );
  const settling = await runMainWireStandard66P1SettlingOnLiveSessionV1({
    liveSession: sourceLiveSession,
    clockArmId: input.clockArmId,
    executionPurpose: "research-eager",
  });
  if (
    settling.status !== "research-period1-candidate"
    || settling.failure !== null
    || settling.numericalPeriod1Established
  ) {
    throw new Error(
      `Standard66 continuation source did not reach a research P1 candidate: ${settling.status}`,
    );
  }
  const exactBoundarySuffix =
    readMainWireStandard66P1SettlingExactBoundarySuffixV1({
      liveSession: sourceLiveSession,
      settling,
    });
  if (exactBoundarySuffix.length !== 4) {
    throw new Error(
      "Standard66 continuation source exact-boundary suffix is incomplete",
    );
  }
  const sourceConfirmation =
    await confirmMainWireStandard66P1OnLiveSessionV1({
      liveSession: sourceLiveSession,
      settled: settling,
    });
  if (
    sourceConfirmation.status !== "period1-confirmed"
    || sourceConfirmation.failure !== null
    || !sourceConfirmation.numericalPeriod1Confirmed
  ) {
    throw new Error(
      `Standard66 continuation source fresh confirmation failed: ${sourceConfirmation.status}`,
    );
  }
  const confirmedSourceState =
    sourceLiveSession.session.currentAcceptedState();
  if (
    confirmedSourceState.acceptedTimeSec
      !== sourceConfirmation.terminalAcceptedTimeSec
    || confirmedSourceState.revision
      !== sourceConfirmation.terminalAcceptedRevision
  ) {
    throw new Error(
      "Standard66 continuation source moved after fresh confirmation",
    );
  }
  const sourceAcceptedStateIdentitySha256 = await sha256BytesHex(
    sourceLiveSession.session.snapshotAcceptedStateBytes(),
  );
  const sourceAfterIdentity = sourceLiveSession.session.currentAcceptedState();
  if (
    sourceAfterIdentity.acceptedTimeSec
      !== confirmedSourceState.acceptedTimeSec
    || sourceAfterIdentity.revision !== confirmedSourceState.revision
  ) {
    throw new Error(
      "Standard66 continuation source moved during confirmation evidence capture",
    );
  }
  const sourceConfirmationEvidence = Object.freeze({
    runnerId: sourceConfirmation.runnerId,
    protocolIdentityHash: sourceConfirmation.protocolIdentityHash,
    status: sourceConfirmation.status,
    terminalAcceptedTimeSec: sourceConfirmation.terminalAcceptedTimeSec,
    terminalAcceptedRevision: sourceConfirmation.terminalAcceptedRevision,
    comparisonCount: sourceConfirmation.freshSuffix.comparisonCount,
    consecutivePeriod1Closures:
      sourceConfirmation.freshSuffix.consecutivePeriod1Closures,
    acceptedStateIdentitySha256: sourceAcceptedStateIdentitySha256,
  });
  const sourceConfirmationEvidenceIdentityHash =
    await sha256CanonicalJsonHex(sourceConfirmationEvidence);
  const sourceQualificationFinishedAtMs = globalThis.performance.now();

  const continuationLiveSession =
    await createMainWireStandard66ResearchContinuationLiveSessionV1({
      sourceLiveSession,
      hemodynamicResearchInputs: input.targetHemodynamicResearchInputs,
      sourceEvidenceReference: Object.freeze({
        kind: "research-p1-confirmed" as const,
        evidenceRunnerId: MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
        evidenceIdentityHash: sourceConfirmationEvidenceIdentityHash,
        evidenceStatus: sourceConfirmation.status,
      }),
    });
  const continuationConstruction =
    readMainWireStandard66ResearchContinuationConstructionV1(
      continuationLiveSession,
    );
  if (
    continuationConstruction.sourceEpoch.acceptedStateIdentitySha256
      !== sourceAcceptedStateIdentitySha256
    || continuationConstruction.sourceEpoch.declaredEvidence
      .evidenceIdentityHash !== sourceConfirmationEvidenceIdentityHash
  ) {
    throw new Error(
      "Standard66 continuation construction is not bound to its confirmed source evidence",
    );
  }
  const continuation =
    await runMainWireStandard66ResearchContinuationPhaseScreenV1({
      liveSession: continuationLiveSession,
      clockArmId: input.clockArmId,
      maximumContinuationDurationSec:
        input.maximumContinuationDurationSec,
    });
  const continuationFinishedAtMs = globalThis.performance.now();
  const terminalBoundary = exactBoundarySuffix.at(-1)!;
  const sourceQualification = Object.freeze({
    verifiedByThisRunner: true as const,
    settling: Object.freeze({
      runnerId: settling.runnerId,
      protocolIdentityHash: settling.protocolIdentityHash,
      status: settling.status,
      terminalAcceptedTimeSec: settling.terminalAcceptedTimeSec,
      terminalAcceptedRevision: settling.terminalAcceptedRevision,
      diagnosticConsecutivePeriod1Closures:
        settling.diagnosticConsecutivePeriod1Closures,
      exactBoundarySuffixCount: 4 as const,
      terminalWindowIndex: terminalBoundary.windowIndex,
    }),
    freshConfirmation: Object.freeze({
      runnerId: sourceConfirmation.runnerId,
      protocolIdentityHash: sourceConfirmation.protocolIdentityHash,
      status: sourceConfirmation.status,
      terminalAcceptedTimeSec:
        sourceConfirmation.terminalAcceptedTimeSec,
      terminalAcceptedRevision:
        sourceConfirmation.terminalAcceptedRevision,
      comparisonCount: sourceConfirmation.freshSuffix.comparisonCount,
      consecutivePeriod1Closures:
        sourceConfirmation.freshSuffix.consecutivePeriod1Closures,
      acceptedStateIdentitySha256: sourceAcceptedStateIdentitySha256,
      evidenceIdentityHash: sourceConfirmationEvidenceIdentityHash,
    }),
  });
  const runIdentity = Object.freeze({
    runnerId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_RUNNER_V1_ID,
    clockArmId: input.clockArmId,
    sourceConstruction,
    sourceSettlingProtocolIdentityHash: settling.protocolIdentityHash,
    sourceConfirmationProtocolIdentityHash:
      sourceConfirmation.protocolIdentityHash,
    sourceConfirmationEvidenceIdentityHash,
    continuationConstructionId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID,
    continuationPhaseScreenRunIdentityHash: continuation.runIdentityHash,
  });
  const runIdentityHash = await sha256CanonicalJsonHex(runIdentity);
  const runnerFinishedAtMs = globalThis.performance.now();
  return Object.freeze({
    runnerId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_RUNNER_V1_ID,
    runIdentity,
    runIdentityHash,
    sourceQualification,
    continuation,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    executionTiming: Object.freeze({
      clock: "performance-now-monotonic-wall-clock" as const,
      interpretation: "descriptive-host-performance-only" as const,
      excludedFromRunIdentity: true as const,
      sourceQualificationWallSeconds:
        (sourceQualificationFinishedAtMs - runnerStartedAtMs) / 1_000,
      continuationWallSeconds:
        (continuationFinishedAtMs - sourceQualificationFinishedAtMs) / 1_000,
      totalRunnerWallSeconds:
        (runnerFinishedAtMs - runnerStartedAtMs) / 1_000,
    }),
    claim: MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_EXPERIMENT_CLAIM_V1,
  });
}

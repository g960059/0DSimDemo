import {
  FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1,
  runFourChamberSmoothReservoirDynamicsReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirDynamicsReviewBench";
import {
  FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_ID_V1,
  runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSourceDtInputNormalizedAssembledReviewBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SOURCE_RESERVOIR_CONTRACT_REVIEW_REPORT_ID_V1 =
  "four-chamber-source-reservoir-contract-review-report-v1" as const;

type ContractResidualV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawDtHalfFailureReasons: readonly string[];
  readonly removedDtHalfFailureReasons: readonly string[];
  readonly effectiveDtHalfFailureReasons: readonly string[];
  readonly normalizedLedgerClean: boolean;
  readonly owner: "status-rate-source-surface-preserved-raw-failure";
};

export type FourChamberSourceReservoirContractReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SOURCE_RESERVOIR_CONTRACT_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSourceReservoirContractReviewV1";
  readonly inputs: {
    readonly smoothReservoirDynamicsReportId: typeof FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1;
    readonly sourceDtInputNormalizedAssembledReportId:
      typeof FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_ID_V1;
    readonly requiredRawDtHalfFailureProfiles: readonly FourChamberSubsystemProfileIdV1[];
  };
  readonly preservedRawResiduals: readonly ContractResidualV1[];
  readonly summary: {
    readonly smoothDynamicsPass: boolean;
    readonly stressRepeatable: boolean;
    readonly stressPassCount: number;
    readonly smoothHardLimiterFree: boolean;
    readonly smoothFeedbackDissipative: boolean;
    readonly normalizedAssembledSignal: boolean;
    readonly effectiveEnvelopePassCount: number;
    readonly effectiveEnvelopeTotal: 21;
    readonly dtHalfReservoirParityPassCount: number;
    readonly dtHalfReservoirParityTotal: 7;
    readonly normalizedLedgerStatusesCleanCount: number;
    readonly rawDtHalfFailureProfiles: readonly FourChamberSubsystemProfileIdV1[];
    readonly effectiveDtHalfFailureProfiles: readonly FourChamberSubsystemProfileIdV1[];
    readonly rawStatusFailuresPreserved: boolean;
    readonly assembledHardLimiterFree: boolean;
    readonly sourceReservoirContractPass: boolean;
  };
  readonly decision: {
    readonly sourceReservoirContractStatus:
      | "source-reservoir-contract-review-signal"
      | "source-reservoir-contract-review-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirBroadRetuning: false;
    readonly directPvOutflowTransfer: false;
    readonly atrialFiberPackImplementation: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const REQUIRED_RAW_DTHALF_FAILURE_PROFILES: readonly FourChamberSubsystemProfileIdV1[] = [
  "preload-low",
  "afterload-high",
  "contractility-low",
];

export function runFourChamberSourceReservoirContractReviewBenchV1():
FourChamberSourceReservoirContractReviewReportV1 {
  const smooth = runFourChamberSmoothReservoirDynamicsReviewBenchV1();
  const normalized = runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1();
  const stressPoints = smooth.dynamicsPoints.filter((point) => String(point.scenarioId).startsWith("stress"));
  const rawFailureProfiles = normalized.summary.rawDtHalfFailureProfiles;
  const rawStatusFailuresPreserved = sameStrings(rawFailureProfiles, REQUIRED_RAW_DTHALF_FAILURE_PROFILES);
  const preservedRawResiduals = normalized.profileParity
    .filter((profile) => rawFailureProfiles.includes(profile.profileId))
    .map((profile): ContractResidualV1 => ({
      profileId: profile.profileId,
      rawDtHalfFailureReasons: profile.dtHalfRawFailureReasons,
      removedDtHalfFailureReasons: profile.dtHalfRemovedFailureReasons,
      effectiveDtHalfFailureReasons: profile.dtHalfEffectiveFailureReasons,
      normalizedLedgerClean: profile.dtHalfLedgerStatusesClean,
      owner: "status-rate-source-surface-preserved-raw-failure",
    }));
  const smoothDynamicsPass = smooth.decision.smoothReservoirDynamicsStatus === "smooth-reservoir-dynamics-review-pass";
  const normalizedAssembledSignal =
    normalized.decision.sourceDtInputNormalizedAssembledStatus
    === "source-dt-input-normalized-assembled-review-signal";
  const sourceReservoirContractPass =
    smoothDynamicsPass
    && smooth.summary.stressRepeatable
    && stressPoints.length === 3
    && stressPoints.every((point) => point.effectiveStatus === "pass")
    && smooth.summary.hardLimiterFree
    && smooth.summary.feedbackDissipative
    && normalizedAssembledSignal
    && normalized.summary.effectiveEnvelopePassCount === 21
    && normalized.summary.dtHalfReservoirParityPassCount === 7
    && normalized.summary.dtHalfReservoirParityFailedProfiles.length === 0
    && normalized.summary.effectiveDtHalfFailureProfiles.length === 0
    && normalized.summary.normalizedLedgerStatusesCleanCount === 7
    && normalized.summary.hardLimiterFree
    && rawStatusFailuresPreserved
    && preservedRawResiduals.every((residual) => residual.normalizedLedgerClean);

  return {
    reportId: FOUR_CHAMBER_SOURCE_RESERVOIR_CONTRACT_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSourceReservoirContractReviewV1",
    inputs: {
      smoothReservoirDynamicsReportId: smooth.reportId,
      sourceDtInputNormalizedAssembledReportId: normalized.reportId,
      requiredRawDtHalfFailureProfiles: REQUIRED_RAW_DTHALF_FAILURE_PROFILES,
    },
    preservedRawResiduals,
    summary: {
      smoothDynamicsPass,
      stressRepeatable: smooth.summary.stressRepeatable,
      stressPassCount: stressPoints.filter((point) => point.effectiveStatus === "pass").length,
      smoothHardLimiterFree: smooth.summary.hardLimiterFree,
      smoothFeedbackDissipative: smooth.summary.feedbackDissipative,
      normalizedAssembledSignal,
      effectiveEnvelopePassCount: normalized.summary.effectiveEnvelopePassCount,
      effectiveEnvelopeTotal: 21,
      dtHalfReservoirParityPassCount: normalized.summary.dtHalfReservoirParityPassCount,
      dtHalfReservoirParityTotal: 7,
      normalizedLedgerStatusesCleanCount: normalized.summary.normalizedLedgerStatusesCleanCount,
      rawDtHalfFailureProfiles: rawFailureProfiles,
      effectiveDtHalfFailureProfiles: normalized.summary.effectiveDtHalfFailureProfiles,
      rawStatusFailuresPreserved,
      assembledHardLimiterFree: normalized.summary.hardLimiterFree,
      sourceReservoirContractPass,
    },
    decision: {
      sourceReservoirContractStatus: sourceReservoirContractPass
        ? "source-reservoir-contract-review-signal"
        : "source-reservoir-contract-review-blocked",
      nextAction: sourceReservoirContractPass
        ? "Use this as the source/reservoir closure signal for an AtrialFiberPack-without-AV-plane readiness review. Do not unlock runtime, AV-plane, LandAtrial, or reservoir broad retuning."
        : "Keep source/reservoir closure blocked. Classify the failed smooth dynamics, normalized assembled parity, or raw failure-preservation condition before atrial work.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-broad-retuning",
        "direct-pv-outflow-transfer",
        "atrial-fiber-pack-implementation",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirBroadRetuning: false,
      directPvOutflowTransfer: false,
      atrialFiberPackImplementation: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

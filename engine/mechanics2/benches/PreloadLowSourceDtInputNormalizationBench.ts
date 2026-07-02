import {
  SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
  runSelectedSmoothReservoirProfileV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import type {
  FourChamberSubsystemProfileIdV1,
  FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const PRELOAD_LOW_SOURCE_DT_INPUT_NORMALIZATION_REPORT_ID_V1 =
  "preload-low-source-dt-input-normalization-report-v1" as const;

type VariantIdV1 =
  | "nominal-status-rate-ledger"
  | "dt-half-status-rate-ledger"
  | "dt-half-canonical-ledger-input";

type VariantResultV1 = {
  readonly variantId: VariantIdV1;
  readonly scenarioId: "nominal" | "dt-half";
  readonly sourceLedgerSampleRateDivisor: number | null;
  readonly rawStatus: FourChamberSubsystemRunV1["status"];
  readonly rawFailureReasons: readonly string[];
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly sourceLedgerLeftStatus: string | null;
  readonly sourceLedgerRightStatus: string | null;
  readonly statusLeftAovEjectedVolumeMl: number | null;
  readonly statusRightPvEjectedVolumeMl: number | null;
  readonly ledgerLeftAovEjectedVolumeMl: number | null;
  readonly ledgerRightPvEjectedVolumeMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly feedbackDutyFraction: number;
  readonly hardLimiterDutyFraction: number;
};

export type PreloadLowSourceDtInputNormalizationReportV1 = {
  readonly reportId: typeof PRELOAD_LOW_SOURCE_DT_INPUT_NORMALIZATION_REPORT_ID_V1;
  readonly gateId: "preloadLowSourceDtInputNormalizationV1";
  readonly inputs: {
    readonly selectedSmoothReservoirCandidateId: typeof SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1;
    readonly profileId: "preload-low";
    readonly leftPointId: "left-heart-preload-low";
    readonly rightPointId: "right-heart-preload-low";
  };
  readonly variants: readonly VariantResultV1[];
  readonly summary: {
    readonly rawDtHalfDeltaMl: number;
    readonly normalizedDtHalfDeltaMl: number;
    readonly rawDtHalfFeedbackDutyFraction: number;
    readonly normalizedDtHalfFeedbackDutyFraction: number;
    readonly rawDtHalfHardLimiterDutyFraction: number;
    readonly normalizedDtHalfHardLimiterDutyFraction: number;
    readonly normalizedLedgerStatusesClean: boolean;
    readonly statusRateFailuresPreserved: boolean;
  };
  readonly decision: {
    readonly sourceDtInputNormalizationStatus:
      | "source-dt-input-normalization-signal"
      | "source-dt-input-normalization-no-go";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirRetuning: false;
    readonly directPvOutflowTransfer: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const PROFILE_ID: FourChamberSubsystemProfileIdV1 = "preload-low";

export function runPreloadLowSourceDtInputNormalizationBenchV1():
PreloadLowSourceDtInputNormalizationReportV1 {
  const nominal = variant("nominal-status-rate-ledger", "nominal", 1, null);
  const rawDtHalf = variant("dt-half-status-rate-ledger", "dt-half", 2, null);
  const normalizedDtHalf = variant("dt-half-canonical-ledger-input", "dt-half", 2, 2);
  const rawDtHalfDeltaMl = deltaFrom(nominal, rawDtHalf);
  const normalizedDtHalfDeltaMl = deltaFrom(nominal, normalizedDtHalf);
  const normalizedLedgerStatusesClean =
    normalizedDtHalf.sourceLedgerLeftStatus === "pass"
    && normalizedDtHalf.sourceLedgerRightStatus === "pass";
  const statusRateFailuresPreserved =
    normalizedDtHalf.leftStatus === "fail"
    && normalizedDtHalf.rightStatus === "fail";
  const hasSignal =
    rawDtHalfDeltaMl > 15
    && normalizedDtHalfDeltaMl <= 0.25
    && rawDtHalf.feedbackDutyFraction === 0
    && normalizedDtHalf.feedbackDutyFraction === 0
    && rawDtHalf.hardLimiterDutyFraction === 0
    && normalizedDtHalf.hardLimiterDutyFraction === 0
    && normalizedLedgerStatusesClean
    && statusRateFailuresPreserved;

  return {
    reportId: PRELOAD_LOW_SOURCE_DT_INPUT_NORMALIZATION_REPORT_ID_V1,
    gateId: "preloadLowSourceDtInputNormalizationV1",
    inputs: {
      selectedSmoothReservoirCandidateId: SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
      profileId: "preload-low",
      leftPointId: "left-heart-preload-low",
      rightPointId: "right-heart-preload-low",
    },
    variants: [nominal, rawDtHalf, normalizedDtHalf],
    summary: {
      rawDtHalfDeltaMl,
      normalizedDtHalfDeltaMl,
      rawDtHalfFeedbackDutyFraction: rawDtHalf.feedbackDutyFraction,
      normalizedDtHalfFeedbackDutyFraction: normalizedDtHalf.feedbackDutyFraction,
      rawDtHalfHardLimiterDutyFraction: rawDtHalf.hardLimiterDutyFraction,
      normalizedDtHalfHardLimiterDutyFraction: normalizedDtHalf.hardLimiterDutyFraction,
      normalizedLedgerStatusesClean,
      statusRateFailuresPreserved,
    },
    decision: {
      sourceDtInputNormalizationStatus: hasSignal
        ? "source-dt-input-normalization-signal"
        : "source-dt-input-normalization-no-go",
      nextAction: hasSignal
        ? "Promote source-ledger input normalization to an assembled numerics review candidate. Keep status-rate source failures visible and do not retune reservoir feedback or directly transfer the standalone PV outflow lead."
        : "Do not proceed to runtime, AV-plane, or LandAtrial. Classify source-side magnitude parity before changing the reservoir law.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-retuning",
        "direct-pv-outflow-transfer",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirRetuning: false,
      directPvOutflowTransfer: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function variant(
  variantId: VariantIdV1,
  scenarioId: "nominal" | "dt-half",
  sampleRateMultiplier: number,
  sourceLedgerSampleRateDivisor: number | null,
): VariantResultV1 {
  const run = runSelectedSmoothReservoirProfileV1({
    scenarioId,
    sampleRateMultiplier,
    epochs: 14,
    profileId: PROFILE_ID,
    leftPointId: "left-heart-preload-low",
    rightPointId: "right-heart-preload-low",
    sourceLedgerSampleRateDivisor: sourceLedgerSampleRateDivisor ?? undefined,
  });
  const finalEpoch = run.epochHistory.at(-1);
  if (finalEpoch == null) throw new Error(`Missing final epoch for ${variantId}`);
  const hardLimiterHitCount = run.epochHistory.filter((epoch) =>
    epoch.reservoirVolumeOwnershipLimiterActive).length;
  const feedbackActiveCount = run.epochHistory.filter((epoch) =>
    Math.abs(epoch.reservoirVolumeOwnershipFeedbackMl ?? 0) > 1e-9).length;
  return {
    variantId,
    scenarioId,
    sourceLedgerSampleRateDivisor,
    rawStatus: run.status,
    rawFailureReasons: run.failureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    sourceLedgerLeftStatus: finalEpoch.sourceLedgerLeftStatus ?? null,
    sourceLedgerRightStatus: finalEpoch.sourceLedgerRightStatus ?? null,
    statusLeftAovEjectedVolumeMl: finalEpoch.statusLeftAovEjectedVolumeMl ?? null,
    statusRightPvEjectedVolumeMl: finalEpoch.statusRightPvEjectedVolumeMl ?? null,
    ledgerLeftAovEjectedVolumeMl: finalEpoch.leftAovEjectedVolumeMl,
    ledgerRightPvEjectedVolumeMl: finalEpoch.rightPvEjectedVolumeMl,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    feedbackDutyFraction: round(feedbackActiveCount / Math.max(run.epochHistory.length, 1)),
    hardLimiterDutyFraction: round(hardLimiterHitCount / Math.max(run.epochHistory.length, 1)),
  };
}

function deltaFrom(reference: VariantResultV1, candidate: VariantResultV1): number {
  return round(Math.abs(reference.maxAbsReservoirVolumeMl - candidate.maxAbsReservoirVolumeMl));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

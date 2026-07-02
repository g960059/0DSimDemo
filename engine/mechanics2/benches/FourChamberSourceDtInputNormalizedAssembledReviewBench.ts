import {
  SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
  runFourChamberSmoothReservoirOwnershipBenchV1,
  runSelectedSmoothReservoirProfileV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import type {
  FourChamberSubsystemProfileIdV1,
  FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_ID_V1 =
  "four-chamber-source-dt-input-normalized-assembled-review-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type DynamicsPointV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawStatus: FourChamberSubsystemRunV1["status"];
  readonly effectiveStatus: "pass" | "fail";
  readonly rawFailureReasons: readonly string[];
  readonly effectiveFailureReasons: readonly string[];
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly sourceLedgerSampleRateDivisor: number | null;
  readonly sourceLedgerLeftStatus: string | null;
  readonly sourceLedgerRightStatus: string | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly feedbackDutyFraction: number;
  readonly hardLimiterDutyFraction: number;
};

type ProfileParityV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly nominalMaxAbsReservoirVolumeMl: number;
  readonly dtHalfMaxAbsReservoirVolumeMl: number;
  readonly longEpochMaxAbsReservoirVolumeMl: number;
  readonly dtHalfMaxReservoirDeltaMl: number;
  readonly dtHalfReservoirParityOk: boolean;
  readonly dtHalfRawStatus: FourChamberSubsystemRunV1["status"];
  readonly dtHalfEffectiveStatus: "pass" | "fail";
  readonly dtHalfRawFailureReasons: readonly string[];
  readonly dtHalfLedgerStatusesClean: boolean;
};

export type FourChamberSourceDtInputNormalizedAssembledReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSourceDtInputNormalizedAssembledReviewV1";
  readonly inputs: {
    readonly selectedSmoothReservoirCandidateId: typeof SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1;
    readonly dtHalfSourceLedgerSampleRateDivisor: 2;
    readonly dtHalfReservoirParityToleranceMl: 8;
  };
  readonly dynamicsPoints: readonly DynamicsPointV1[];
  readonly profileParity: readonly ProfileParityV1[];
  readonly summary: {
    readonly effectiveEnvelopePassCount: number;
    readonly effectiveEnvelopeTotal: 21;
    readonly dtHalfReservoirParityPassCount: number;
    readonly dtHalfReservoirParityTotal: 7;
    readonly dtHalfReservoirParityFailedProfiles: readonly FourChamberSubsystemProfileIdV1[];
    readonly rawDtHalfFailureProfiles: readonly FourChamberSubsystemProfileIdV1[];
    readonly normalizedLedgerStatusesCleanCount: number;
    readonly feedbackDutyFree: boolean;
    readonly hardLimiterFree: boolean;
  };
  readonly decision: {
    readonly sourceDtInputNormalizedAssembledStatus:
      | "source-dt-input-normalized-assembled-review-signal"
      | "source-dt-input-normalized-assembled-review-blocked";
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

const DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML = 8;

const PROFILE_MAP: readonly {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
}[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const SCENARIOS: readonly {
  readonly scenarioId: ScenarioIdV1;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
  readonly sourceLedgerSampleRateDivisor?: 2;
}[] = [
  { scenarioId: "nominal", sampleRateMultiplier: 1, epochs: 14 },
  { scenarioId: "dt-half", sampleRateMultiplier: 2, epochs: 14, sourceLedgerSampleRateDivisor: 2 },
  { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 22 },
];

export function runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1():
FourChamberSourceDtInputNormalizedAssembledReviewReportV1 {
  const ownership = runFourChamberSmoothReservoirOwnershipBenchV1();
  const dynamicsPoints = SCENARIOS.flatMap((scenario) =>
    PROFILE_MAP.map((profile) => dynamicsPoint(ownership, scenario, profile))
  );
  const profileParity = PROFILE_MAP.map((profile) => parityForProfile(dynamicsPoints, profile.profileId));
  const effectiveEnvelopePassCount = dynamicsPoints.filter((point) => point.effectiveStatus === "pass").length;
  const dtHalfReservoirParityFailedProfiles = profileParity
    .filter((profile) => !profile.dtHalfReservoirParityOk)
    .map((profile) => profile.profileId);
  const rawDtHalfFailureProfiles = profileParity
    .filter((profile) => profile.dtHalfRawStatus !== "pass")
    .map((profile) => profile.profileId);
  const normalizedLedgerStatusesCleanCount = profileParity.filter((profile) =>
    profile.dtHalfLedgerStatusesClean).length;
  const feedbackDutyFree = dynamicsPoints.every((point) => point.feedbackDutyFraction === 0);
  const hardLimiterFree = dynamicsPoints.every((point) => point.hardLimiterDutyFraction === 0);
  const hasSignal =
    effectiveEnvelopePassCount === 21
    && dtHalfReservoirParityFailedProfiles.length === 0
    && rawDtHalfFailureProfiles.length > 0
    && normalizedLedgerStatusesCleanCount === 7
    && hardLimiterFree;

  return {
    reportId: FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSourceDtInputNormalizedAssembledReviewV1",
    inputs: {
      selectedSmoothReservoirCandidateId: SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
      dtHalfSourceLedgerSampleRateDivisor: 2,
      dtHalfReservoirParityToleranceMl: DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML,
    },
    dynamicsPoints,
    profileParity,
    summary: {
      effectiveEnvelopePassCount,
      effectiveEnvelopeTotal: 21,
      dtHalfReservoirParityPassCount: profileParity.filter((profile) =>
        profile.dtHalfReservoirParityOk).length,
      dtHalfReservoirParityTotal: 7,
      dtHalfReservoirParityFailedProfiles,
      rawDtHalfFailureProfiles,
      normalizedLedgerStatusesCleanCount,
      feedbackDutyFree,
      hardLimiterFree,
    },
    decision: {
      sourceDtInputNormalizedAssembledStatus: hasSignal
        ? "source-dt-input-normalized-assembled-review-signal"
        : "source-dt-input-normalized-assembled-review-blocked",
      nextAction: hasSignal
        ? "Promote source-ledger input normalization to the next source/reservoir contract review. Keep raw status-rate failures reported and do not use this as runtime, AV-plane, or LandAtrial unlock evidence."
        : "Do not proceed to runtime, AV-plane, or LandAtrial. Classify why source-ledger input normalization did not preserve the assembled envelope.",
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

function dynamicsPoint(
  ownership: ReturnType<typeof runFourChamberSmoothReservoirOwnershipBenchV1>,
  scenario: (typeof SCENARIOS)[number],
  profile: (typeof PROFILE_MAP)[number],
): DynamicsPointV1 {
  const run = runSelectedSmoothReservoirProfileV1({
    ...scenario,
    ...profile,
  });
  const effectiveFailureReasons = effectiveFailureReasonsFor(ownership, scenario.scenarioId, profile.profileId);
  const finalEpoch = run.epochHistory.at(-1);
  if (finalEpoch == null) throw new Error(`Missing final epoch for ${scenario.scenarioId}/${profile.profileId}`);
  const hardLimiterHitCount = run.epochHistory.filter((epoch) =>
    epoch.reservoirVolumeOwnershipLimiterActive).length;
  const feedbackActiveCount = run.epochHistory.filter((epoch) =>
    Math.abs(epoch.reservoirVolumeOwnershipFeedbackMl ?? 0) > 1e-9).length;
  return {
    scenarioId: scenario.scenarioId,
    profileId: profile.profileId,
    rawStatus: run.status,
    effectiveStatus: effectiveFailureReasons.length === 0 ? "pass" : "fail",
    rawFailureReasons: run.failureReasons,
    effectiveFailureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    sourceLedgerSampleRateDivisor: scenario.sourceLedgerSampleRateDivisor ?? null,
    sourceLedgerLeftStatus: finalEpoch.sourceLedgerLeftStatus ?? null,
    sourceLedgerRightStatus: finalEpoch.sourceLedgerRightStatus ?? null,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    feedbackDutyFraction: round(feedbackActiveCount / Math.max(run.epochHistory.length, 1)),
    hardLimiterDutyFraction: round(hardLimiterHitCount / Math.max(run.epochHistory.length, 1)),
  };
}

function parityForProfile(
  points: readonly DynamicsPointV1[],
  profileId: FourChamberSubsystemProfileIdV1,
): ProfileParityV1 {
  const nominal = requirePoint(points, "nominal", profileId);
  const dtHalf = requirePoint(points, "dt-half", profileId);
  const longEpoch = requirePoint(points, "long-epochs", profileId);
  const dtHalfMaxReservoirDeltaMl = round(
    Math.abs(nominal.maxAbsReservoirVolumeMl - dtHalf.maxAbsReservoirVolumeMl)
  );
  return {
    profileId,
    nominalMaxAbsReservoirVolumeMl: nominal.maxAbsReservoirVolumeMl,
    dtHalfMaxAbsReservoirVolumeMl: dtHalf.maxAbsReservoirVolumeMl,
    longEpochMaxAbsReservoirVolumeMl: longEpoch.maxAbsReservoirVolumeMl,
    dtHalfMaxReservoirDeltaMl,
    dtHalfReservoirParityOk: dtHalfMaxReservoirDeltaMl <= DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML,
    dtHalfRawStatus: dtHalf.rawStatus,
    dtHalfEffectiveStatus: dtHalf.effectiveStatus,
    dtHalfRawFailureReasons: dtHalf.rawFailureReasons,
    dtHalfLedgerStatusesClean: dtHalf.sourceLedgerLeftStatus === "pass"
      && dtHalf.sourceLedgerRightStatus === "pass",
  };
}

function requirePoint(
  points: readonly DynamicsPointV1[],
  scenarioId: ScenarioIdV1,
  profileId: FourChamberSubsystemProfileIdV1,
): DynamicsPointV1 {
  const point = points.find((entry) =>
    entry.scenarioId === scenarioId && entry.profileId === profileId);
  if (point == null) throw new Error(`Missing normalized source point ${scenarioId}/${profileId}`);
  return point;
}

function effectiveFailureReasonsFor(
  ownership: ReturnType<typeof runFourChamberSmoothReservoirOwnershipBenchV1>,
  scenarioId: ScenarioIdV1,
  profileId: FourChamberSubsystemProfileIdV1,
): readonly string[] {
  const point = ownership.pointResults.find((entry) =>
    entry.candidateId === SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1
    && entry.scenarioId === scenarioId
    && entry.profileId === profileId
  );
  if (point == null) throw new Error(`Missing selected ownership point ${scenarioId}/${profileId}`);
  return point.effectiveFailureReasons;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runFourChamberSourceAwareResidualReviewBenchV1,
  type FourChamberSourceAwareResidualReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareResidualReviewBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1 =
  "four-chamber-smooth-reservoir-ownership-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type ScenarioSpecV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
};

type ProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type CandidateSpecV1 = {
  readonly candidateId:
    | "hard-bound24"
    | "smooth-feedback-gain002-bound24"
    | "smooth-knee20-gain020-bound24"
    | "smooth-knee20-gain035-bound24"
    | "smooth-knee20-gain050-bound24";
  readonly mode: "hard-bound" | "smooth-feedback-bound" | "smooth-knee-feedback-bound";
  readonly reservoirVolumeOwnershipBoundMl: 24;
  readonly reservoirVolumeFeedbackGain01?: number;
  readonly reservoirVolumeFeedbackKneeMl?: number;
};

type CandidatePointResultV1 = {
  readonly candidateId: CandidateSpecV1["candidateId"];
  readonly scenarioId: ScenarioIdV1;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawStatus: FourChamberSubsystemRunV1["status"];
  readonly effectiveStatus: "pass" | "fail";
  readonly rawFailureReasons: readonly string[];
  readonly removedFailureReasons: readonly string[];
  readonly effectiveFailureReasons: readonly string[];
  readonly appliedOwners: readonly string[];
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly reservoirVolumeOwnershipLimiterHitCount: number;
  readonly maxAbsReservoirVolumeOwnershipRejectedTransferMl: number | null;
  readonly maxAbsReservoirVolumeOwnershipFeedbackMl: number | null;
  readonly leftStatus: string;
  readonly rightStatus: string;
};

type CandidateSummaryV1 = {
  readonly candidateId: CandidateSpecV1["candidateId"];
  readonly rawPassCount: number;
  readonly effectivePassCount: number;
  readonly total: 21;
  readonly nominalEffectivePassCount: number;
  readonly dtHalfEffectivePassCount: number;
  readonly longEpochEffectivePassCount: number;
  readonly fullEnvelopeLimiterHitCount: number;
  readonly fullEnvelopeEpochCount: number;
  readonly fullEnvelopeLimiterDutyFraction: number;
  readonly maxAbsReservoirVolumeMl: number | null;
  readonly maxAbsReservoirVolumeOwnershipRejectedTransferMl: number | null;
  readonly maxAbsReservoirVolumeOwnershipFeedbackMl: number | null;
  readonly preloadLowStressProbe: {
    readonly epochs: 56;
    readonly rawStatus: FourChamberSubsystemRunV1["status"];
    readonly effectiveStatus: "pass" | "fail";
    readonly failureReasons: readonly string[];
    readonly effectiveFailureReasons: readonly string[];
    readonly leftStatus: string;
    readonly rightStatus: string;
    readonly maxAbsReservoirVolumeMl: number;
    readonly finalReservoirStepMl: number | null;
    readonly limiterHitCount: number;
    readonly limiterDutyFraction: number;
    readonly maxAbsReservoirVolumeOwnershipRejectedTransferMl: number | null;
    readonly maxAbsReservoirVolumeOwnershipFeedbackMl: number | null;
  };
};

export type FourChamberSmoothReservoirOwnershipReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1;
  readonly gateId: "fourChamberSmoothReservoirOwnershipV1";
  readonly inputs: {
    readonly sourceAwareResidualReviewReportId: FourChamberSourceAwareResidualReviewReportV1["reportId"];
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly candidates: readonly CandidateSpecV1[];
  };
  readonly pointResults: readonly CandidatePointResultV1[];
  readonly candidateSummaries: readonly CandidateSummaryV1[];
  readonly selectedCandidate: CandidateSummaryV1 | null;
  readonly decision: {
    readonly smoothReservoirOwnershipStatus:
      | "smooth-reservoir-ownership-signal"
      | "smooth-reservoir-ownership-no-go";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirBroadRetuning: false;
    readonly hardBoundFinalLaw: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const CANDIDATES: readonly CandidateSpecV1[] = [
  {
    candidateId: "hard-bound24",
    mode: "hard-bound",
    reservoirVolumeOwnershipBoundMl: 24,
  },
  {
    candidateId: "smooth-feedback-gain002-bound24",
    mode: "smooth-feedback-bound",
    reservoirVolumeOwnershipBoundMl: 24,
    reservoirVolumeFeedbackGain01: 0.02,
  },
  {
    candidateId: "smooth-knee20-gain020-bound24",
    mode: "smooth-knee-feedback-bound",
    reservoirVolumeOwnershipBoundMl: 24,
    reservoirVolumeFeedbackGain01: 0.20,
    reservoirVolumeFeedbackKneeMl: 20,
  },
  {
    candidateId: "smooth-knee20-gain035-bound24",
    mode: "smooth-knee-feedback-bound",
    reservoirVolumeOwnershipBoundMl: 24,
    reservoirVolumeFeedbackGain01: 0.35,
    reservoirVolumeFeedbackKneeMl: 20,
  },
  {
    candidateId: "smooth-knee20-gain050-bound24",
    mode: "smooth-knee-feedback-bound",
    reservoirVolumeOwnershipBoundMl: 24,
    reservoirVolumeFeedbackGain01: 0.50,
    reservoirVolumeFeedbackKneeMl: 20,
  },
];

const SCENARIOS: readonly ScenarioSpecV1[] = [
  { scenarioId: "nominal", sampleRateMultiplier: 1, epochs: 14 },
  { scenarioId: "dt-half", sampleRateMultiplier: 2, epochs: 14 },
  { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 22 },
];

const PROFILE_MAP: readonly ProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

export function runFourChamberSmoothReservoirOwnershipBenchV1():
FourChamberSmoothReservoirOwnershipReportV1 {
  const sourceAware = runFourChamberSourceAwareResidualReviewBenchV1();
  const pointResults = CANDIDATES.flatMap((candidate) =>
    SCENARIOS.flatMap((scenario) =>
      PROFILE_MAP.map((profile) => runCandidatePoint(sourceAware, candidate, scenario, profile))
    )
  );
  const candidateSummaries = CANDIDATES.map((candidate) =>
    summarizeCandidate(sourceAware, candidate, pointResults)
  );
  const selectedCandidate = selectCandidate(candidateSummaries);
  const hasSignal = selectedCandidate != null
    && selectedCandidate.candidateId !== "hard-bound24"
    && selectedCandidate.effectivePassCount === 21
    && selectedCandidate.preloadLowStressProbe.effectiveStatus === "pass"
    && selectedCandidate.preloadLowStressProbe.limiterDutyFraction < hardBaseline(candidateSummaries)
      .preloadLowStressProbe.limiterDutyFraction;
  return {
    reportId: FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1,
    gateId: "fourChamberSmoothReservoirOwnershipV1",
    inputs: {
      sourceAwareResidualReviewReportId: sourceAware.reportId,
      leftVariantId: LEFT_VARIANT_ID,
      candidates: CANDIDATES,
    },
    pointResults,
    candidateSummaries,
    selectedCandidate,
    decision: {
      smoothReservoirOwnershipStatus: hasSignal
        ? "smooth-reservoir-ownership-signal"
        : "smooth-reservoir-ownership-no-go",
      nextAction: hasSignal
        ? "Promote the selected smooth-feedback reservoir ownership surface to a full dynamics review with hard-limiter fallback duty treated as a safety metric; do not unlock runtime, AV-plane, or LandAtrial."
        : "Do not promote smooth reservoir ownership from this candidate set; classify why hard-bound fallback remains dominant before any reservoir or atrial expansion.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-broad-retuning",
        "hard-bound-final-law",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirBroadRetuning: false,
      hardBoundFinalLaw: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runCandidatePoint(
  sourceAware: FourChamberSourceAwareResidualReviewReportV1,
  candidate: CandidateSpecV1,
  scenario: ScenarioSpecV1,
  profile: ProfileMapV1,
): CandidatePointResultV1 {
  const run = runCandidateProfile(candidate, scenario, profile);
  const sourceAwareClassification = sourceAware.residualClassifications.find((classification) =>
    classification.scenarioId === scenario.scenarioId && classification.profileId === profile.profileId);
  const removedFailureReasons = sourceAwareClassification == null
    ? []
    : removedReasonsFor(sourceAwareClassification);
  const effectiveFailureReasons = run.failureReasons.filter((reason) =>
    !removedFailureReasons.includes(reason));
  return {
    candidateId: candidate.candidateId,
    scenarioId: scenario.scenarioId,
    profileId: profile.profileId,
    rawStatus: run.status,
    effectiveStatus: effectiveFailureReasons.length === 0 ? "pass" : "fail",
    rawFailureReasons: run.failureReasons,
    removedFailureReasons,
    effectiveFailureReasons,
    appliedOwners: sourceAwareClassification?.owners ?? [],
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    reservoirVolumeOwnershipLimiterHitCount: limiterHitCount(run),
    maxAbsReservoirVolumeOwnershipRejectedTransferMl: maxEpochAbsOrNull(run, "reservoirVolumeOwnershipRejectedTransferMl"),
    maxAbsReservoirVolumeOwnershipFeedbackMl: maxEpochAbsOrNull(run, "reservoirVolumeOwnershipFeedbackMl"),
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
  };
}

function summarizeCandidate(
  sourceAware: FourChamberSourceAwareResidualReviewReportV1,
  candidate: CandidateSpecV1,
  pointResults: readonly CandidatePointResultV1[],
): CandidateSummaryV1 {
  const points = pointResults.filter((point) => point.candidateId === candidate.candidateId);
  const fullEnvelopeEpochCount = points.reduce((sum, point) => sum + scenarioEpochs(point.scenarioId), 0);
  const fullEnvelopeLimiterHitCount = points.reduce((sum, point) =>
    sum + point.reservoirVolumeOwnershipLimiterHitCount, 0);
  const stressRun = runCandidateProfile(
    candidate,
    { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 56 },
    { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  );
  const stressSourceAware = sourceAware.residualClassifications.find((classification) =>
    classification.scenarioId === "long-epochs" && classification.profileId === "preload-low");
  const stressRemovedFailureReasons = stressSourceAware == null
    ? []
    : removedReasonsFor(stressSourceAware);
  const stressEffectiveFailureReasons = stressRun.failureReasons.filter((reason) =>
    !stressRemovedFailureReasons.includes(reason));
  return {
    candidateId: candidate.candidateId,
    rawPassCount: points.filter((point) => point.rawStatus === "pass").length,
    effectivePassCount: points.filter((point) => point.effectiveStatus === "pass").length,
    total: 21,
    nominalEffectivePassCount: passCount(points, "nominal"),
    dtHalfEffectivePassCount: passCount(points, "dt-half"),
    longEpochEffectivePassCount: passCount(points, "long-epochs"),
    fullEnvelopeLimiterHitCount,
    fullEnvelopeEpochCount,
    fullEnvelopeLimiterDutyFraction: round(fullEnvelopeLimiterHitCount / Math.max(fullEnvelopeEpochCount, 1)),
    maxAbsReservoirVolumeMl: maxOrNull(points.map((point) => point.maxAbsReservoirVolumeMl)),
    maxAbsReservoirVolumeOwnershipRejectedTransferMl:
      maxOrNull(points.map((point) => point.maxAbsReservoirVolumeOwnershipRejectedTransferMl)),
    maxAbsReservoirVolumeOwnershipFeedbackMl:
      maxOrNull(points.map((point) => point.maxAbsReservoirVolumeOwnershipFeedbackMl)),
    preloadLowStressProbe: {
      epochs: 56,
      rawStatus: stressRun.status,
      effectiveStatus: stressEffectiveFailureReasons.length === 0 ? "pass" : "fail",
      failureReasons: stressRun.failureReasons,
      effectiveFailureReasons: stressEffectiveFailureReasons,
      leftStatus: stressRun.finalState.leftStatus,
      rightStatus: stressRun.finalState.rightStatus,
      maxAbsReservoirVolumeMl: stressRun.finalState.maxAbsReservoirVolumeMl,
      finalReservoirStepMl: stressRun.finalState.finalReservoirStepMl,
      limiterHitCount: limiterHitCount(stressRun),
      limiterDutyFraction: round(limiterHitCount(stressRun) / 56),
      maxAbsReservoirVolumeOwnershipRejectedTransferMl:
        maxEpochAbsOrNull(stressRun, "reservoirVolumeOwnershipRejectedTransferMl"),
      maxAbsReservoirVolumeOwnershipFeedbackMl:
        maxEpochAbsOrNull(stressRun, "reservoirVolumeOwnershipFeedbackMl"),
    },
  };
}

function selectCandidate(
  summaries: readonly CandidateSummaryV1[],
): CandidateSummaryV1 | null {
  const viable = summaries.filter((summary) =>
    summary.effectivePassCount === 21
    && summary.preloadLowStressProbe.effectiveStatus === "pass"
  );
  if (viable.length === 0) return null;
  return [...viable].sort((a, b) =>
    a.preloadLowStressProbe.limiterDutyFraction - b.preloadLowStressProbe.limiterDutyFraction
    || a.fullEnvelopeLimiterDutyFraction - b.fullEnvelopeLimiterDutyFraction
    || (a.maxAbsReservoirVolumeOwnershipFeedbackMl ?? Number.POSITIVE_INFINITY)
      - (b.maxAbsReservoirVolumeOwnershipFeedbackMl ?? Number.POSITIVE_INFINITY)
  )[0] ?? null;
}

function hardBaseline(summaries: readonly CandidateSummaryV1[]): CandidateSummaryV1 {
  const hard = summaries.find((summary) => summary.candidateId === "hard-bound24");
  if (hard == null) throw new Error("Missing hard-bound24 summary");
  return hard;
}

function runCandidateProfile(
  candidate: CandidateSpecV1,
  scenario: ScenarioSpecV1,
  profile: ProfileMapV1,
): FourChamberSubsystemRunV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  return runFourChamberSubsystemV1({
    profileId: profile.profileId,
    left: requiredPoint(leftParams, profile.leftPointId),
    right: requiredPoint(rightParams, profile.rightPointId),
    reservoir: {
      epochs: scenario.epochs,
      transferGain01: 0.14,
      maxTransferPerEpochMl: 3.5,
      pulmonaryVenousComplianceMlPerMmHg: 80,
      systemicVenousComplianceMlPerMmHg: 160,
      pulmonaryPressureAdjustmentBoundMmHg: 1.4,
      systemicPressureAdjustmentBoundMmHg: 1.1,
      persistentReservoirVolumeBoundMl: 28,
      repeatabilityMismatchDeltaMl: 1.2,
      repeatabilityReservoirStepMl: 4,
      reservoirVolumeOwnershipMode: candidate.mode,
      reservoirVolumeOwnershipBoundMl: candidate.reservoirVolumeOwnershipBoundMl,
      reservoirVolumeFeedbackGain01: candidate.reservoirVolumeFeedbackGain01,
      reservoirVolumeFeedbackKneeMl: candidate.reservoirVolumeFeedbackKneeMl,
    },
  });
}

function removedReasonsFor(
  classification: FourChamberSourceAwareResidualReviewReportV1["residualClassifications"][number],
): readonly string[] {
  const removed = new Set<string>();
  if (classification.owners.some((owner) =>
    owner === "left-source-phase-aligned-sampling-parity"
    || owner === "left-source-load-conditioned-output-reserve"
  )) {
    removed.add("left-surface-not-preserved");
  }
  if (classification.owners.includes("right-source-pv-outflow-lead-not-directly-transferable")) {
    removed.add("right-surface-not-preserved");
  }
  if (classification.owners.includes("right-low-output-phenotype-scope-under-coupling")) {
    removed.add("right-surface-not-preserved");
    removed.add("unexpected-accepted-phenotype");
  }
  return Array.from(removed);
}

function applySelectedRightScaffold(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: 0.47,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function withSampleRate<T extends { readonly sampleRateHz: number }>(point: T, multiplier: number): T {
  return { ...point, sampleRateHz: point.sampleRateHz * multiplier };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing smooth reservoir ownership profile ${fixtureId}`);
  return point;
}

function limiterHitCount(run: FourChamberSubsystemRunV1): number {
  return run.epochHistory.filter((epoch) =>
    epoch.reservoirVolumeOwnershipLimiterActive).length;
}

function maxEpochAbsOrNull(
  run: FourChamberSubsystemRunV1,
  field: "reservoirVolumeOwnershipRejectedTransferMl" | "reservoirVolumeOwnershipFeedbackMl",
): number | null {
  return maxOrNull(run.epochHistory.map((epoch) =>
    Math.abs(epoch[field] ?? Number.NaN)));
}

function passCount(points: readonly CandidatePointResultV1[], scenarioId: ScenarioIdV1): number {
  return points.filter((point) =>
    point.scenarioId === scenarioId && point.effectiveStatus === "pass").length;
}

function scenarioEpochs(scenarioId: ScenarioIdV1): number {
  return scenarioId === "long-epochs" ? 22 : 14;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

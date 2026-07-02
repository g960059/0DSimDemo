import {
  FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1,
  SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
  runFourChamberSmoothReservoirOwnershipBenchV1,
  runSelectedSmoothReservoirProfileV1,
  type FourChamberSmoothReservoirCandidateIdV1,
  type FourChamberSmoothReservoirOwnershipReportV1,
  type FourChamberSmoothReservoirProfileSpecV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import type {
  FourChamberSubsystemEpochV1,
  FourChamberSubsystemProfileIdV1,
  FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1 =
  "four-chamber-smooth-reservoir-dynamics-review-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type DynamicsPointV1 = {
  readonly scenarioId: ScenarioIdV1 | "stress-56" | "stress-84" | "stress-112";
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly epochs: number;
  readonly status: FourChamberSubsystemRunV1["status"];
  readonly failureReasons: readonly string[];
  readonly effectiveStatus: "pass" | "fail";
  readonly effectiveFailureReasons: readonly string[];
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly hardLimiterHitCount: number;
  readonly hardLimiterDutyFraction: number;
  readonly feedbackActiveCount: number;
  readonly feedbackDutyFraction: number;
  readonly nonDissipativeFeedbackCount: number;
  readonly preKneeFeedbackCount: number;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsFeedbackMl: number | null;
  readonly maxAbsRejectedTransferMl: number | null;
  readonly maxPositiveFeedbackWorkProxyMl2: number;
};

export type FourChamberSmoothReservoirDynamicsReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSmoothReservoirDynamicsReviewV1";
  readonly inputs: {
    readonly ownershipReportId: typeof FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1;
    readonly selectedCandidateId: FourChamberSmoothReservoirCandidateIdV1;
    readonly stressEpochs: readonly [56, 84, 112];
    readonly feedbackKneeMl: 20;
  };
  readonly ownershipSummary: {
    readonly ownershipStatus: FourChamberSmoothReservoirOwnershipReportV1["decision"]["smoothReservoirOwnershipStatus"];
    readonly selectedEffectivePassCount: number | null;
    readonly selectedFullEnvelopeLimiterDutyFraction: number | null;
    readonly selectedStressLimiterDutyFraction: number | null;
  };
  readonly dynamicsPoints: readonly DynamicsPointV1[];
  readonly summary: {
    readonly fullEnvelopeReviewedCount: number;
    readonly stressReviewedCount: 3;
    readonly allReviewedPass: boolean;
    readonly hardLimiterFree: boolean;
    readonly feedbackDissipative: boolean;
    readonly feedbackKneeClean: boolean;
    readonly stressRepeatable: boolean;
    readonly maxAbsReservoirVolumeMl: number;
    readonly maxAbsFeedbackMl: number | null;
    readonly maxPositiveFeedbackWorkProxyMl2: number;
  };
  readonly decision: {
    readonly smoothReservoirDynamicsStatus:
      | "smooth-reservoir-dynamics-review-pass"
      | "smooth-reservoir-dynamics-review-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirBroadRetuning: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const FEEDBACK_KNEE_ML = 20;

const FULL_ENVELOPE_SPECS: readonly FourChamberSmoothReservoirProfileSpecV1[] = [
  ...profileSpecs("nominal", 1, 14),
  ...profileSpecs("dt-half", 2, 14),
  ...profileSpecs("long-epochs", 1, 22),
];

export function runFourChamberSmoothReservoirDynamicsReviewBenchV1():
FourChamberSmoothReservoirDynamicsReviewReportV1 {
  const ownership = runFourChamberSmoothReservoirOwnershipBenchV1();
  const fullEnvelopeDynamics = FULL_ENVELOPE_SPECS.map((spec) =>
    dynamicsPoint(
      spec.scenarioId,
      runSelectedSmoothReservoirProfileV1(spec),
      effectiveFailureReasonsFor(ownership, spec.scenarioId, spec.profileId),
    )
  );
  const stressDynamics = ([56, 84, 112] as const).map((epochs) =>
    dynamicsPoint(`stress-${epochs}`, runSelectedSmoothReservoirProfileV1({
      scenarioId: "long-epochs",
      sampleRateMultiplier: 1,
      epochs,
      profileId: "preload-low",
      leftPointId: "left-heart-preload-low",
      rightPointId: "right-heart-preload-low",
    }), [])
  );
  const dynamicsPoints = [...fullEnvelopeDynamics, ...stressDynamics];
  const selected = ownership.selectedCandidate;
  const hardLimiterFree = dynamicsPoints.every((point) => point.hardLimiterHitCount === 0);
  const feedbackDissipative = dynamicsPoints.every((point) => point.nonDissipativeFeedbackCount === 0);
  const feedbackKneeClean = dynamicsPoints.every((point) => point.preKneeFeedbackCount === 0);
  const stressRepeatable = stressDynamics.every((point) =>
    point.status === "pass" && (point.finalReservoirStepMl ?? Number.POSITIVE_INFINITY) <= 0.05);
  const allReviewedPass = dynamicsPoints.every((point) => point.effectiveStatus === "pass");
  const reviewPass =
    ownership.decision.smoothReservoirOwnershipStatus === "smooth-reservoir-ownership-signal"
    && selected?.candidateId === SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1
    && allReviewedPass
    && hardLimiterFree
    && feedbackDissipative
    && feedbackKneeClean
    && stressRepeatable;
  return {
    reportId: FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSmoothReservoirDynamicsReviewV1",
    inputs: {
      ownershipReportId: FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_ID_V1,
      selectedCandidateId: SELECTED_SMOOTH_RESERVOIR_CANDIDATE_ID_V1,
      stressEpochs: [56, 84, 112],
      feedbackKneeMl: FEEDBACK_KNEE_ML,
    },
    ownershipSummary: {
      ownershipStatus: ownership.decision.smoothReservoirOwnershipStatus,
      selectedEffectivePassCount: selected?.effectivePassCount ?? null,
      selectedFullEnvelopeLimiterDutyFraction: selected?.fullEnvelopeLimiterDutyFraction ?? null,
      selectedStressLimiterDutyFraction: selected?.preloadLowStressProbe.limiterDutyFraction ?? null,
    },
    dynamicsPoints,
    summary: {
      fullEnvelopeReviewedCount: fullEnvelopeDynamics.length,
      stressReviewedCount: 3,
      allReviewedPass,
      hardLimiterFree,
      feedbackDissipative,
      feedbackKneeClean,
      stressRepeatable,
      maxAbsReservoirVolumeMl: Math.max(...dynamicsPoints.map((point) => point.maxAbsReservoirVolumeMl)),
      maxAbsFeedbackMl: maxOrNull(dynamicsPoints.map((point) => point.maxAbsFeedbackMl)),
      maxPositiveFeedbackWorkProxyMl2:
        Math.max(...dynamicsPoints.map((point) => point.maxPositiveFeedbackWorkProxyMl2)),
    },
    decision: {
      smoothReservoirDynamicsStatus: reviewPass
        ? "smooth-reservoir-dynamics-review-pass"
        : "smooth-reservoir-dynamics-review-blocked",
      nextAction: reviewPass
        ? "Treat the smooth-knee reservoir surface as the current MechanicsCore2 four-chamber reservoir scaffold and move to assembled-system source/reservoir numerics review before any runtime, AV-plane, or LandAtrial unlock."
        : "Do not promote the smooth reservoir surface beyond diagnostics. Classify failed dynamics before more reservoir or atrial work.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-broad-retuning",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirBroadRetuning: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function profileSpecs(
  scenarioId: ScenarioIdV1,
  sampleRateMultiplier: number,
  epochs: number,
): readonly FourChamberSmoothReservoirProfileSpecV1[] {
  return [
    { scenarioId, sampleRateMultiplier, epochs, profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
    { scenarioId, sampleRateMultiplier, epochs, profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
  ];
}

function dynamicsPoint(
  scenarioId: DynamicsPointV1["scenarioId"],
  run: FourChamberSubsystemRunV1,
  effectiveFailureReasons: readonly string[],
): DynamicsPointV1 {
  const hardLimiterHitCount = run.epochHistory.filter((epoch) =>
    epoch.reservoirVolumeOwnershipLimiterActive).length;
  const feedbackActiveCount = run.epochHistory.filter((epoch) =>
    Math.abs(epoch.reservoirVolumeOwnershipFeedbackMl ?? 0) > 1e-9).length;
  const feedbackWork = run.epochHistory.map(feedbackWorkProxy);
  return {
    scenarioId,
    profileId: run.profileId,
    epochs: run.epochHistory.length,
    status: run.status,
    failureReasons: run.failureReasons,
    effectiveStatus: effectiveFailureReasons.length === 0 ? "pass" : "fail",
    effectiveFailureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    hardLimiterHitCount,
    hardLimiterDutyFraction: round(hardLimiterHitCount / Math.max(run.epochHistory.length, 1)),
    feedbackActiveCount,
    feedbackDutyFraction: round(feedbackActiveCount / Math.max(run.epochHistory.length, 1)),
    nonDissipativeFeedbackCount: feedbackWork.filter((value) => value > 1e-9).length,
    preKneeFeedbackCount: run.epochHistory.filter((epoch) =>
      Math.abs(reservoirImbalanceMl(epoch)) <= FEEDBACK_KNEE_ML + 1e-9
      && Math.abs(epoch.reservoirVolumeOwnershipFeedbackMl ?? 0) > 1e-9
    ).length,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsFeedbackMl: maxEpochAbsOrNull(run, "reservoirVolumeOwnershipFeedbackMl"),
    maxAbsRejectedTransferMl: maxEpochAbsOrNull(run, "reservoirVolumeOwnershipRejectedTransferMl"),
    maxPositiveFeedbackWorkProxyMl2: round(Math.max(0, ...feedbackWork)),
  };
}

function effectiveFailureReasonsFor(
  ownership: FourChamberSmoothReservoirOwnershipReportV1,
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

function reservoirImbalanceMl(epoch: FourChamberSubsystemEpochV1): number {
  return (epoch.systemicVenousReservoirVolumeMl - epoch.pulmonaryVenousReservoirVolumeMl) / 2;
}

function feedbackWorkProxy(epoch: FourChamberSubsystemEpochV1): number {
  return round((epoch.reservoirVolumeOwnershipFeedbackMl ?? 0) * reservoirImbalanceMl(epoch));
}

function maxEpochAbsOrNull(
  run: FourChamberSubsystemRunV1,
  field: "reservoirVolumeOwnershipRejectedTransferMl" | "reservoirVolumeOwnershipFeedbackMl",
): number | null {
  return maxOrNull(run.epochHistory.map((epoch) =>
    Math.abs(epoch[field] ?? Number.NaN)));
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

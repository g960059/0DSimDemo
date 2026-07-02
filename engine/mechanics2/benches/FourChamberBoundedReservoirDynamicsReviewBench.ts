import {
  runFourChamberBoundedReservoirContractSmokeBenchV1,
  type FourChamberBoundedReservoirContractSmokeReportV1,
} from "@/engine/mechanics2/benches/FourChamberBoundedReservoirContractSmokeBench";

export const FOUR_CHAMBER_BOUNDED_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1 =
  "four-chamber-bounded-reservoir-dynamics-review-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type LimiterDutyV1 = {
  readonly limiterHitCount: number;
  readonly epochCount: number;
  readonly dutyFraction: number;
};

type ActiveLimiterPointV1 = {
  readonly scenarioId: ScenarioIdV1 | "stress";
  readonly profileId: string;
  readonly limiterHitCount: number;
  readonly epochCount: number;
  readonly dutyFraction: number;
  readonly maxAbsRejectedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
};

export type FourChamberBoundedReservoirDynamicsReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_BOUNDED_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberBoundedReservoirDynamicsReviewV1";
  readonly inputs: {
    readonly contractSmokeReportId: FourChamberBoundedReservoirContractSmokeReportV1["reportId"];
    readonly reservoirVolumeOwnershipBoundMl: 24;
  };
  readonly limiterDuty: {
    readonly fullEnvelope: LimiterDutyV1;
    readonly preloadLowStressProbe: LimiterDutyV1;
    readonly combined: LimiterDutyV1;
  };
  readonly activeLimiterPoints: readonly ActiveLimiterPointV1[];
  readonly summary: {
    readonly contractSmokePass: boolean;
    readonly fullEnvelopeLimiterSparse: boolean;
    readonly stressProbeLimiterDominant: boolean;
    readonly maxAbsRejectedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number;
  };
  readonly decision: {
    readonly dynamicsReviewStatus:
      | "bounded-reservoir-smoke-pass-limiter-duty-acceptable"
      | "bounded-reservoir-smoke-pass-stress-limiter-dominant"
      | "bounded-reservoir-smoke-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly hardBoundFinalLaw: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runFourChamberBoundedReservoirDynamicsReviewBenchV1():
FourChamberBoundedReservoirDynamicsReviewReportV1 {
  const smoke = runFourChamberBoundedReservoirContractSmokeBenchV1();
  const fullEnvelopeEpochCount = smoke.pointResults
    .reduce((sum, point) => sum + scenarioEpochs(point.scenarioId), 0);
  const fullEnvelopeHitCount = smoke.pointResults
    .reduce((sum, point) => sum + point.reservoirVolumeOwnershipLimiterHitCount, 0);
  const stressHitCount = smoke.preloadLowStressProbe.volumeOwnershipLimiterHitCount;
  const stressEpochCount = smoke.preloadLowStressProbe.epochs;
  const activeLimiterPoints = [
    ...smoke.pointResults
      .filter((point) => point.reservoirVolumeOwnershipLimiterHitCount > 0)
      .map((point): ActiveLimiterPointV1 => ({
        scenarioId: point.scenarioId,
        profileId: point.profileId,
        limiterHitCount: point.reservoirVolumeOwnershipLimiterHitCount,
        epochCount: scenarioEpochs(point.scenarioId),
        dutyFraction: round(point.reservoirVolumeOwnershipLimiterHitCount / scenarioEpochs(point.scenarioId)),
        maxAbsRejectedTransferMl: point.maxAbsReservoirVolumeOwnershipRejectedTransferMl,
        maxAbsReservoirVolumeMl: point.maxAbsReservoirVolumeMl,
        finalReservoirStepMl: point.finalReservoirStepMl,
      })),
    {
      scenarioId: "stress" as const,
      profileId: "preload-low",
      limiterHitCount: stressHitCount,
      epochCount: stressEpochCount,
      dutyFraction: round(stressHitCount / stressEpochCount),
      maxAbsRejectedTransferMl: null,
      maxAbsReservoirVolumeMl: smoke.preloadLowStressProbe.maxAbsReservoirVolumeMl,
      finalReservoirStepMl: smoke.preloadLowStressProbe.finalReservoirStepMl,
    },
  ].filter((point) => point.limiterHitCount > 0);
  const contractSmokePass =
    smoke.decision.boundedReservoirContractSmokeStatus ===
    "source-aware-bounded-reservoir-contract-smoke-pass";
  const fullEnvelopeDuty = duty(fullEnvelopeHitCount, fullEnvelopeEpochCount);
  const stressDuty = duty(stressHitCount, stressEpochCount);
  const combinedDuty = duty(fullEnvelopeHitCount + stressHitCount, fullEnvelopeEpochCount + stressEpochCount);
  const fullEnvelopeLimiterSparse = fullEnvelopeDuty.dutyFraction <= 0.05;
  const stressProbeLimiterDominant = stressDuty.dutyFraction >= 0.5;
  const dynamicsReviewStatus = !contractSmokePass
    ? "bounded-reservoir-smoke-blocked"
    : stressProbeLimiterDominant
      ? "bounded-reservoir-smoke-pass-stress-limiter-dominant"
      : fullEnvelopeLimiterSparse
        ? "bounded-reservoir-smoke-pass-limiter-duty-acceptable"
        : "bounded-reservoir-smoke-pass-stress-limiter-dominant";
  return {
    reportId: FOUR_CHAMBER_BOUNDED_RESERVOIR_DYNAMICS_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberBoundedReservoirDynamicsReviewV1",
    inputs: {
      contractSmokeReportId: smoke.reportId,
      reservoirVolumeOwnershipBoundMl: 24,
    },
    limiterDuty: {
      fullEnvelope: fullEnvelopeDuty,
      preloadLowStressProbe: stressDuty,
      combined: combinedDuty,
    },
    activeLimiterPoints,
    summary: {
      contractSmokePass,
      fullEnvelopeLimiterSparse,
      stressProbeLimiterDominant,
      maxAbsRejectedTransferMl: smoke.summary.maxAbsReservoirVolumeOwnershipRejectedTransferMl,
      maxAbsReservoirVolumeMl: smoke.summary.maxAbsReservoirVolumeMl ?? 0,
    },
    decision: {
      dynamicsReviewStatus,
      nextAction: dynamicsReviewStatus === "bounded-reservoir-smoke-pass-limiter-duty-acceptable"
        ? "Proceed to a bounded reservoir dynamics/numerics review before any runtime or atrial unlock."
        : dynamicsReviewStatus === "bounded-reservoir-smoke-pass-stress-limiter-dominant"
          ? "Keep bounded reservoir-volume ownership as the current scaffold, but replace the diagnostic hard bound with a smoother compatibility/energy ownership law before runtime, AV-plane, or LandAtrial work."
          : "Do not promote bounded reservoir-volume ownership; reclassify full-envelope blockers first.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "hard-bound-final-law",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      hardBoundFinalLaw: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function scenarioEpochs(scenarioId: ScenarioIdV1): number {
  return scenarioId === "long-epochs" ? 22 : 14;
}

function duty(limiterHitCount: number, epochCount: number): LimiterDutyV1 {
  return {
    limiterHitCount,
    epochCount,
    dutyFraction: epochCount > 0 ? round(limiterHitCount / epochCount) : 0,
  };
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

import {
  runFourChamberSmoothReservoirDynamicsReviewBenchV1,
  type FourChamberSmoothReservoirDynamicsReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirDynamicsReviewBench";

export const PRELOAD_LOW_DTHALF_RESERVOIR_PARITY_ATTRIBUTION_REPORT_ID_V1 =
  "preload-low-dthalf-reservoir-parity-attribution-report-v1" as const;

export type PreloadLowDtHalfReservoirParityAttributionReportV1 = {
  readonly reportId: typeof PRELOAD_LOW_DTHALF_RESERVOIR_PARITY_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "preloadLowDtHalfReservoirParityAttributionV1";
  readonly inputs: {
    readonly dynamicsReviewReportId: FourChamberSmoothReservoirDynamicsReviewReportV1["reportId"];
    readonly profileId: "preload-low";
  };
  readonly preloadLowParity: {
    readonly nominalMaxAbsReservoirVolumeMl: number;
    readonly dtHalfMaxAbsReservoirVolumeMl: number;
    readonly dtHalfMaxReservoirDeltaMl: number;
    readonly nominalFeedbackDutyFraction: number;
    readonly dtHalfFeedbackDutyFraction: number;
    readonly nominalHardLimiterDutyFraction: number;
    readonly dtHalfHardLimiterDutyFraction: number;
    readonly dtHalfSourceOwnedRawResidual: boolean;
  };
  readonly attribution: {
    readonly owner:
      | "source-surface-dt-input-not-reservoir-feedback"
      | "reservoir-feedback-or-limiter"
      | "unclassified";
    readonly reasons: readonly string[];
  };
  readonly decision: {
    readonly attributionStatus:
      | "preload-low-dthalf-reservoir-parity-classified"
      | "preload-low-dthalf-reservoir-parity-unclassified";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirRetuning: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runPreloadLowDtHalfReservoirParityAttributionBenchV1():
PreloadLowDtHalfReservoirParityAttributionReportV1 {
  const dynamics = runFourChamberSmoothReservoirDynamicsReviewBenchV1();
  const nominal = requireDynamicsPoint(dynamics, "nominal");
  const dtHalf = requireDynamicsPoint(dynamics, "dt-half");
  const dtHalfMaxReservoirDeltaMl = round(
    Math.abs(nominal.maxAbsReservoirVolumeMl - dtHalf.maxAbsReservoirVolumeMl)
  );
  const parity = {
    nominalMaxAbsReservoirVolumeMl: nominal.maxAbsReservoirVolumeMl,
    dtHalfMaxAbsReservoirVolumeMl: dtHalf.maxAbsReservoirVolumeMl,
    dtHalfMaxReservoirDeltaMl,
    nominalFeedbackDutyFraction: nominal.feedbackDutyFraction,
    dtHalfFeedbackDutyFraction: dtHalf.feedbackDutyFraction,
    nominalHardLimiterDutyFraction: nominal.hardLimiterDutyFraction,
    dtHalfHardLimiterDutyFraction: dtHalf.hardLimiterDutyFraction,
    dtHalfSourceOwnedRawResidual: dtHalf.status !== "pass" && dtHalf.effectiveStatus === "pass",
  };
  const attribution = classify(parity);
  const classified = attribution.owner !== "unclassified";
  return {
    reportId: PRELOAD_LOW_DTHALF_RESERVOIR_PARITY_ATTRIBUTION_REPORT_ID_V1,
    gateId: "preloadLowDtHalfReservoirParityAttributionV1",
    inputs: {
      dynamicsReviewReportId: dynamics.reportId,
      profileId: "preload-low",
    },
    preloadLowParity: parity,
    attribution,
    decision: {
      attributionStatus: classified
        ? "preload-low-dthalf-reservoir-parity-classified"
        : "preload-low-dthalf-reservoir-parity-unclassified",
      nextAction: attribution.owner === "source-surface-dt-input-not-reservoir-feedback"
        ? "Do not retune reservoir feedback. Target preload-low source-surface dt input parity / normalization before runtime, AV-plane, or LandAtrial unlock."
        : "Do not proceed to runtime, AV-plane, or LandAtrial. Add epoch-level attribution before changing the reservoir scaffold.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-retuning",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirRetuning: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function classify(input: PreloadLowDtHalfReservoirParityAttributionReportV1["preloadLowParity"]):
PreloadLowDtHalfReservoirParityAttributionReportV1["attribution"] {
  if (
    input.dtHalfMaxReservoirDeltaMl > 8
    && input.nominalFeedbackDutyFraction === 0
    && input.dtHalfFeedbackDutyFraction === 0
    && input.nominalHardLimiterDutyFraction === 0
    && input.dtHalfHardLimiterDutyFraction === 0
    && input.dtHalfSourceOwnedRawResidual
  ) {
    return {
      owner: "source-surface-dt-input-not-reservoir-feedback",
      reasons: [
        "preload-low-dthalf-reservoir-magnitude-delta-exceeds-parity-tolerance",
        "nominal-and-dthalf-feedback-duty-zero",
        "nominal-and-dthalf-hard-limiter-duty-zero",
        "dthalf-raw-residual-is-source-owned-effective-pass",
      ],
    };
  }
  if (input.nominalFeedbackDutyFraction > 0 || input.dtHalfFeedbackDutyFraction > 0) {
    return {
      owner: "reservoir-feedback-or-limiter",
      reasons: ["reservoir-feedback-active-on-compared-points"],
    };
  }
  return {
    owner: "unclassified",
    reasons: ["preload-low-dthalf-parity-needs-epoch-history-attribution"],
  };
}

function requireDynamicsPoint(
  dynamics: FourChamberSmoothReservoirDynamicsReviewReportV1,
  scenarioId: "nominal" | "dt-half",
): FourChamberSmoothReservoirDynamicsReviewReportV1["dynamicsPoints"][number] {
  const point = dynamics.dynamicsPoints.find((entry) =>
    entry.scenarioId === scenarioId && entry.profileId === "preload-low");
  if (point == null) throw new Error(`Missing ${scenarioId} preload-low dynamics point`);
  return point;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

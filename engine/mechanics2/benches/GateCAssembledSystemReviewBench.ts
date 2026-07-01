import {
  runReservoirStateContractBenchWithRightParamsAndVariantsV1,
  type ReservoirStateContractPointResultV1,
  type ReservoirStateContractReportV1,
  type ReservoirStateVariantSpecV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const GATE_C_ASSEMBLED_SYSTEM_REVIEW_REPORT_ID_V1 =
  "gate-c-assembled-system-review-report-v1" as const;

type ReviewScaffoldSpecV1 = {
  readonly scaffoldId: string;
  readonly label: "center" | "best-neighborhood";
  readonly rightUpperPressureContribution01: number;
  readonly reservoirTransferGain01: number;
  readonly reservoirTransferCapMl: number;
};

type ReviewPointSummaryV1 = {
  readonly profileId: string;
  readonly status: ReservoirStateContractPointResultV1["status"];
  readonly cleanGateCPoint: boolean;
  readonly noUnexpectedPhenotype: boolean;
  readonly transferLimiterHitCount: number;
  readonly finalAbsMismatchMl: number | null;
  readonly finalAcceptedTransferMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
  readonly failureReasons: readonly string[];
  readonly leftAcceptedPhenotypeReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
};

type ScaffoldReviewResultV1 = {
  readonly scaffold: ReviewScaffoldSpecV1;
  readonly reservoirStatus: ReservoirStateContractReportV1["decision"]["reservoirStateStatus"];
  readonly bestVariantId: string;
  readonly passCount: number;
  readonly allProfilesClean: boolean;
  readonly noTransferLimiterReliance: boolean;
  readonly noUnexpectedPhenotypes: boolean;
  readonly boundedTransferAndState: boolean;
  readonly meanAbsMismatchMl: number | null;
  readonly maxAbsMismatchMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number | null;
  readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
  readonly maxSystemicPressureAdjustmentMmHg: number | null;
  readonly pointSummaries: readonly ReviewPointSummaryV1[];
  readonly reviewStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type GateCAssembledSystemReviewReportV1 = {
  readonly reportId: typeof GATE_C_ASSEMBLED_SYSTEM_REVIEW_REPORT_ID_V1;
  readonly gateId: "gateCAssembledSystemReviewV1";
  readonly reviewedScaffolds: readonly ScaffoldReviewResultV1[];
  readonly summary: {
    readonly totalReviewedScaffolds: number;
    readonly passCount: number;
    readonly passedScaffoldIds: readonly string[];
    readonly failedScaffoldIds: readonly string[];
    readonly maxPassingAcceptedTransferMl: number | null;
    readonly maxPassingReservoirVolumeMl: number | null;
    readonly maxPassingPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxPassingSystemicPressureAdjustmentMmHg: number | null;
  };
  readonly decision: {
    readonly assembledReviewStatus:
      | "gate-c-assembled-review-pass"
      | "gate-c-assembled-review-mixed"
      | "gate-c-assembled-review-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberCoupling: false;
    readonly morphologyAcceptance: false;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const REVIEW_SCAFFOLDS: readonly ReviewScaffoldSpecV1[] = [
  {
    scaffoldId: "center-pressure045-gain012-cap4",
    label: "center",
    rightUpperPressureContribution01: 0.45,
    reservoirTransferGain01: 0.12,
    reservoirTransferCapMl: 4,
  },
  {
    scaffoldId: "best-neighborhood-pressure047-gain014-cap35",
    label: "best-neighborhood",
    rightUpperPressureContribution01: 0.47,
    reservoirTransferGain01: 0.14,
    reservoirTransferCapMl: 3.5,
  },
];

export function runGateCAssembledSystemReviewBenchV1(): GateCAssembledSystemReviewReportV1 {
  const reviewedScaffolds = REVIEW_SCAFFOLDS.map(runScaffoldReview);
  const passing = reviewedScaffolds.filter((result) => result.reviewStatus === "pass");
  const assembledReviewStatus = passing.length === reviewedScaffolds.length
    ? "gate-c-assembled-review-pass"
    : passing.length > 0
      ? "gate-c-assembled-review-mixed"
      : "gate-c-assembled-review-blocked";
  return {
    reportId: GATE_C_ASSEMBLED_SYSTEM_REVIEW_REPORT_ID_V1,
    gateId: "gateCAssembledSystemReviewV1",
    reviewedScaffolds,
    summary: {
      totalReviewedScaffolds: reviewedScaffolds.length,
      passCount: passing.length,
      passedScaffoldIds: passing.map((result) => result.scaffold.scaffoldId),
      failedScaffoldIds: reviewedScaffolds
        .filter((result) => result.reviewStatus !== "pass")
        .map((result) => result.scaffold.scaffoldId),
      maxPassingAcceptedTransferMl: maxOrNull(passing.map((result) => result.maxAbsAcceptedTransferMl)),
      maxPassingReservoirVolumeMl: maxOrNull(passing.map((result) => result.maxAbsReservoirVolumeMl)),
      maxPassingPulmonaryVenousPressureAdjustmentMmHg:
        maxOrNull(passing.map((result) => result.maxPulmonaryVenousPressureAdjustmentMmHg)),
      maxPassingSystemicPressureAdjustmentMmHg:
        maxOrNull(passing.map((result) => result.maxSystemicPressureAdjustmentMmHg)),
    },
    decision: {
      assembledReviewStatus,
      nextAction: assembledReviewStatus === "gate-c-assembled-review-pass"
        ? "Gate C passes the first assembled-system review. Next, define the actual four-chamber assembly contract before implementing four-chamber, AV-plane, or LandAtrial work."
        : "Keep MechanicsCore2 at Gate C. Do not unlock four-chamber, AV-plane, or LandAtrial until assembled review is clean.",
      blockedClaims: [
        "four-chamber-unlock",
        "AV-plane-unlock",
        "LandAtrial-unlock",
        "runtime-wiring",
        "morphology-acceptance",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberCoupling: false,
      morphologyAcceptance: false,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runScaffoldReview(scaffold: ReviewScaffoldSpecV1): ScaffoldReviewResultV1 {
  const report = runReservoirStateContractBenchWithRightParamsAndVariantsV1(
    buildRightHeartStrategicEnvelopeV1().map((point) => applyRightScaffold(point, scaffold)),
    `gate-c-assembled-review:${scaffold.scaffoldId}`,
    [openReservoirReference(), reservoirVariant(scaffold)],
  );
  const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId) ?? null;
  const pointSummaries = best?.pointResults.map(summarizePoint) ?? [];
  const allProfilesClean = pointSummaries.length === 7
    && pointSummaries.every((point) => point.status === "pass" && point.cleanGateCPoint);
  const noTransferLimiterReliance = pointSummaries.every((point) => point.transferLimiterHitCount === 0);
  const noUnexpectedPhenotypes = pointSummaries.every((point) => point.noUnexpectedPhenotype);
  const boundedTransferAndState = pointSummaries.every((point) =>
    (point.maxAbsAcceptedTransferMl ?? 1e9) <= 2
    && point.maxAbsReservoirVolumeMl <= 25
    && Math.abs(point.pulmonaryVenousPressureAdjustmentMmHg) <= 0.3
    && Math.abs(point.systemicPressureAdjustmentMmHg) <= 0.15
  );
  const failureReasons = [
    ...allProfilesClean ? [] : ["profile-not-clean"],
    ...noTransferLimiterReliance ? [] : ["transfer-limiter-reliance"],
    ...noUnexpectedPhenotypes ? [] : ["unexpected-phenotype"],
    ...boundedTransferAndState ? [] : ["transfer-or-reservoir-state-unbounded"],
  ];
  return {
    scaffold,
    reservoirStatus: report.decision.reservoirStateStatus,
    bestVariantId: report.decision.bestVariantId,
    passCount: report.decision.bestPassCount,
    allProfilesClean,
    noTransferLimiterReliance,
    noUnexpectedPhenotypes,
    boundedTransferAndState,
    meanAbsMismatchMl: report.decision.bestMeanAbsMismatchMl,
    maxAbsMismatchMl: best?.summary.maxFinalAbsMismatchMl ?? null,
    maxAbsAcceptedTransferMl: best?.summary.maxAbsAcceptedTransferMl ?? null,
    maxAbsReservoirVolumeMl: best?.summary.maxAbsReservoirVolumeMl ?? null,
    maxPulmonaryVenousPressureAdjustmentMmHg: best?.summary.maxPulmonaryVenousPressureAdjustmentMmHg ?? null,
    maxSystemicPressureAdjustmentMmHg: best?.summary.maxSystemicPressureAdjustmentMmHg ?? null,
    pointSummaries,
    reviewStatus: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function summarizePoint(point: ReservoirStateContractPointResultV1): ReviewPointSummaryV1 {
  const transferLimiterHitCount = point.epochHistory.filter((epoch) => epoch.transferLimiterActive).length;
  return {
    profileId: point.profileId,
    status: point.status,
    cleanGateCPoint: point.classifications.cleanGateCPoint,
    noUnexpectedPhenotype: noUnexpectedPhenotype(point),
    transferLimiterHitCount,
    finalAbsMismatchMl: point.finalState.absMismatchMl,
    finalAcceptedTransferMl: point.finalState.finalAcceptedTransferMl,
    maxAbsAcceptedTransferMl: point.finalState.maxAbsAcceptedTransferMl,
    maxAbsReservoirVolumeMl: point.finalState.maxAbsReservoirVolumeMl,
    pulmonaryVenousPressureAdjustmentMmHg: point.finalState.pulmonaryVenousPressureAdjustmentMmHg,
    systemicPressureAdjustmentMmHg: point.finalState.systemicPressureAdjustmentMmHg,
    failureReasons: point.failureReasons,
    leftAcceptedPhenotypeReasons: point.finalState.leftAcceptedPhenotypeReasons,
    rightAcceptedPhenotypeReasons: point.finalState.rightAcceptedPhenotypeReasons,
  };
}

function noUnexpectedPhenotype(point: ReservoirStateContractPointResultV1): boolean {
  const expected = point.profileId === "contractility-low"
    ? ["clean-low-contractility-low-output-phenotype"]
    : [];
  return sameStringSet(point.finalState.leftAcceptedPhenotypeReasons, expected)
    && sameStringSet(point.finalState.rightAcceptedPhenotypeReasons, expected);
}

function sameStringSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  scaffold: ReviewScaffoldSpecV1,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: scaffold.rightUpperPressureContribution01,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function reservoirVariant(scaffold: ReviewScaffoldSpecV1): ReservoirStateVariantSpecV1 {
  return {
    variantId: `${scaffold.scaffoldId}-reservoir`,
    description: `Assembled review reservoir for ${scaffold.scaffoldId}.`,
    epochs: 14,
    transferGain01: scaffold.reservoirTransferGain01,
    maxTransferPerEpochMl: scaffold.reservoirTransferCapMl,
    pulmonaryVenousComplianceMlPerMmHg: 80,
    systemicVenousComplianceMlPerMmHg: 160,
    pulmonaryPressureAdjustmentBoundMmHg: 1.4,
    systemicPressureAdjustmentBoundMmHg: 1.1,
    persistentReservoirVolumeBoundMl: 28,
    repeatabilityMismatchDeltaMl: 1.2,
    repeatabilityReservoirStepMl: 4,
  };
}

function openReservoirReference(): ReservoirStateVariantSpecV1 {
  return {
    variantId: "open-reservoir-reference",
    description: "No reservoir transfer; records the open-boundary mismatch for the assembled review.",
    epochs: 1,
    transferGain01: 0,
    maxTransferPerEpochMl: 0,
    pulmonaryVenousComplianceMlPerMmHg: 80,
    systemicVenousComplianceMlPerMmHg: 160,
    pulmonaryPressureAdjustmentBoundMmHg: 0,
    systemicPressureAdjustmentBoundMmHg: 0,
    persistentReservoirVolumeBoundMl: 0,
    repeatabilityMismatchDeltaMl: 0,
    repeatabilityReservoirStepMl: 0,
  };
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

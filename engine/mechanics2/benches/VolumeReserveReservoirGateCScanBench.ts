import {
  runReservoirStateContractBenchWithRightParamsAndVariantsV1,
  type ReservoirStateContractReportV1,
  type ReservoirStateVariantSpecV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const VOLUME_RESERVE_RESERVOIR_GATE_C_SCAN_REPORT_ID_V1 =
  "volume-reserve-reservoir-gate-c-scan-report-v1" as const;

type RightVolumeReserveCandidateV1 = {
  readonly candidateId: string;
  readonly lowContractilityTrefPa: number;
  readonly maxRvVolumeMl: number;
  readonly absoluteMaxRvVolumeMl: number;
  readonly upperSafetyGainMultiplier: number;
  readonly upperPressureContribution01: number;
};

export type VolumeReserveReservoirGateCScanReportV1 = {
  readonly reportId: typeof VOLUME_RESERVE_RESERVOIR_GATE_C_SCAN_REPORT_ID_V1;
  readonly gateId: "volumeReserveReservoirGateCScanV1";
  readonly candidateResults: readonly VolumeReserveReservoirCandidateResultV1[];
  readonly bestCandidateResult: VolumeReserveReservoirCandidateResultV1;
  readonly summary: {
    readonly reservoirStatus: ReservoirStateContractReportV1["decision"]["reservoirStateStatus"];
    readonly bestVariantId: string;
    readonly bestPassCount: number;
    readonly bestMeanAbsMismatchMl: number | null;
    readonly remainingBlockers: readonly string[];
    readonly scannedVariantCount: number;
  };
  readonly decision: {
    readonly volumeReserveReservoirStatus:
      | "volume-reserve-reservoir-pass"
      | "volume-reserve-reservoir-mixed-signal"
      | "volume-reserve-reservoir-blocked";
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

type VolumeReserveReservoirCandidateResultV1 = {
  readonly rightCandidate: RightVolumeReserveCandidateV1;
  readonly reservoirStatus: ReservoirStateContractReportV1["decision"]["reservoirStateStatus"];
  readonly bestVariantId: string;
  readonly passCount: number;
  readonly bestMeanAbsMismatchMl: number | null;
  readonly remainingBlockers: readonly string[];
  readonly bestVariantSummary: ReservoirStateContractReportV1["variantResults"][number]["summary"] | null;
  readonly bestVariantPointSummaries: readonly {
    readonly profileId: string;
    readonly status: string;
    readonly absMismatchMl: number | null;
    readonly pulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly systemicPressureAdjustmentMmHg: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly failureReasons: readonly string[];
    readonly leftAcceptedPhenotypeReasons: readonly string[];
    readonly rightAcceptedPhenotypeReasons: readonly string[];
  }[];
};

const RIGHT_VOLUME_RESERVE_CANDIDATES: readonly RightVolumeReserveCandidateV1[] = [
  volumeReserveCandidate(0.35),
  volumeReserveCandidate(0.40),
  volumeReserveCandidate(0.45),
  volumeReserveCandidate(0.50),
];

const RESERVOIR_VARIANTS: readonly ReservoirStateVariantSpecV1[] = [
  {
    variantId: "open-reservoir-reference",
    description: "No stateful reservoir transfer; records the volume-reserve right-surface open-boundary mismatch.",
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
  },
  reservoirVariant("vr-soft-cap3-gain008-comp80", 14, 0.08, 3, 80, 160, 1.2, 1.0, 24, 3),
  reservoirVariant("vr-soft-cap4-gain012-comp80", 14, 0.12, 4, 80, 160, 1.4, 1.1, 28, 4),
  reservoirVariant("vr-soft-cap6-gain012-comp100", 14, 0.12, 6, 100, 200, 1.6, 1.2, 32, 5),
  reservoirVariant("vr-soft-cap6-gain018-comp100", 14, 0.18, 6, 100, 200, 1.8, 1.4, 36, 6),
  reservoirVariant("vr-balanced-cap8-gain018-comp80", 12, 0.18, 8, 80, 160, 2.0, 1.6, 40, 7),
  reservoirVariant("vr-balanced-cap10-gain018-comp120", 12, 0.18, 10, 120, 240, 2.2, 1.8, 44, 8),
  reservoirVariant("vr-wide-cap12-gain025-comp120", 12, 0.25, 12, 120, 240, 2.8, 2.2, 48, 10),
  reservoirVariant("vr-wide-cap16-gain025-comp160", 12, 0.25, 16, 160, 320, 3.2, 2.6, 55, 12),
];

export function runVolumeReserveReservoirGateCScanBenchV1(): VolumeReserveReservoirGateCScanReportV1 {
  const candidateResults = RIGHT_VOLUME_RESERVE_CANDIDATES.map(runCandidate);
  const bestCandidateResult = [...candidateResults].sort((a, b) =>
    b.passCount - a.passCount
    || (a.bestMeanAbsMismatchMl ?? 1e9) - (b.bestMeanAbsMismatchMl ?? 1e9)
  )[0]!;
  const reservoirStatus = bestCandidateResult.reservoirStatus;
  const volumeReserveReservoirStatus = reservoirStatus === "stateful-reservoir-pass"
    ? "volume-reserve-reservoir-pass"
    : reservoirStatus === "stateful-reservoir-mixed-signal"
      ? "volume-reserve-reservoir-mixed-signal"
      : "volume-reserve-reservoir-blocked";
  return {
    reportId: VOLUME_RESERVE_RESERVOIR_GATE_C_SCAN_REPORT_ID_V1,
    gateId: "volumeReserveReservoirGateCScanV1",
    candidateResults,
    bestCandidateResult,
    summary: {
      reservoirStatus,
      bestVariantId: bestCandidateResult.bestVariantId,
      bestPassCount: bestCandidateResult.passCount,
      bestMeanAbsMismatchMl: bestCandidateResult.bestMeanAbsMismatchMl,
      remainingBlockers: bestCandidateResult.remainingBlockers,
      scannedVariantCount: RESERVOIR_VARIANTS.length,
    },
    decision: {
      volumeReserveReservoirStatus,
      nextAction: volumeReserveReservoirStatus === "volume-reserve-reservoir-pass"
        ? "Treat this as a Gate C reservoir scaffold signal and run a broader assembled-system review before any four-chamber or AV-plane work."
        : "Keep Gate C on reservoir feedback compatibility. Do not unlock four-chamber, AV-plane, or LandAtrial from this scan.",
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

function runCandidate(candidate: RightVolumeReserveCandidateV1): VolumeReserveReservoirCandidateResultV1 {
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map((point) => applyRightVolumeReserveCandidate(point, candidate));
  const reservoirReport = runReservoirStateContractBenchWithRightParamsAndVariantsV1(
    rightParams,
    `right-volume-reserve:${candidate.candidateId}`,
    RESERVOIR_VARIANTS,
  );
  const bestVariant = reservoirReport.variantResults.find((variant) =>
    variant.variantId === reservoirReport.decision.bestVariantId
  ) ?? null;
  return {
    rightCandidate: candidate,
    reservoirStatus: reservoirReport.decision.reservoirStateStatus,
    bestVariantId: reservoirReport.decision.bestVariantId,
    passCount: reservoirReport.decision.bestPassCount,
    bestMeanAbsMismatchMl: reservoirReport.decision.bestMeanAbsMismatchMl,
    remainingBlockers: reservoirReport.decision.remainingBlockers,
    bestVariantSummary: bestVariant?.summary ?? null,
    bestVariantPointSummaries: bestVariant?.pointResults.map((point) => ({
      profileId: point.profileId,
      status: point.status,
      absMismatchMl: point.finalState.absMismatchMl,
      pulmonaryVenousPressureAdjustmentMmHg: point.finalState.pulmonaryVenousPressureAdjustmentMmHg,
      systemicPressureAdjustmentMmHg: point.finalState.systemicPressureAdjustmentMmHg,
      maxAbsAcceptedTransferMl: point.finalState.maxAbsAcceptedTransferMl,
      maxAbsReservoirVolumeMl: point.finalState.maxAbsReservoirVolumeMl,
      failureReasons: point.failureReasons,
      leftAcceptedPhenotypeReasons: point.finalState.leftAcceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: point.finalState.rightAcceptedPhenotypeReasons,
    })) ?? [],
  };
}

function applyRightVolumeReserveCandidate(
  point: RightHeartSubsystemParamsV2,
  candidate: RightVolumeReserveCandidateV1,
): RightHeartSubsystemParamsV2 {
  const lowContractilityTref = point.fixtureId === "right-heart-contractility-low"
    ? candidate.lowContractilityTrefPa
    : point.rv.fiber.trefPa;
  return {
    ...point,
    maxRvVolumeMl: candidate.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: candidate.absoluteMaxRvVolumeMl,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * candidate.upperSafetyGainMultiplier,
    rvUpperSoftLimitPressureContribution01: candidate.upperPressureContribution01,
    rv: {
      ...point.rv,
      fiber: { ...point.rv.fiber, trefPa: lowContractilityTref },
    },
  };
}

function reservoirVariant(
  variantId: string,
  epochs: number,
  transferGain01: number,
  maxTransferPerEpochMl: number,
  pulmonaryCompliance: number,
  systemicCompliance: number,
  pulmonaryBound: number,
  systemicBound: number,
  persistentBound: number,
  repeatabilityReservoirStepMl: number,
): ReservoirStateVariantSpecV1 {
  return {
    variantId,
    description: `Volume-reserve reservoir scan: gain ${transferGain01}, cap ${maxTransferPerEpochMl} mL, compliance ${pulmonaryCompliance}/${systemicCompliance}.`,
    epochs,
    transferGain01,
    maxTransferPerEpochMl,
    pulmonaryVenousComplianceMlPerMmHg: pulmonaryCompliance,
    systemicVenousComplianceMlPerMmHg: systemicCompliance,
    pulmonaryPressureAdjustmentBoundMmHg: pulmonaryBound,
    systemicPressureAdjustmentBoundMmHg: systemicBound,
    persistentReservoirVolumeBoundMl: persistentBound,
    repeatabilityMismatchDeltaMl: 1.2,
    repeatabilityReservoirStepMl,
  };
}

function volumeReserveCandidate(upperPressureContribution01: number): RightVolumeReserveCandidateV1 {
  return {
    candidateId: `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-${upperPressureContribution01}`,
    lowContractilityTrefPa: 26_000,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    upperSafetyGainMultiplier: 0.25,
    upperPressureContribution01,
  };
}

import {
  runReservoirStateContractBenchWithRightParamsAndVariantsV1,
  type ReservoirStateContractReportV1,
  type ReservoirStateVariantSpecV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const GATE_C_SCAFFOLD_ROBUSTNESS_REPORT_ID_V1 =
  "gate-c-scaffold-robustness-report-v1" as const;

type RightScaffoldSpecV1 = {
  readonly candidateId: string;
  readonly lowContractilityTrefPa: number;
  readonly maxRvVolumeMl: number;
  readonly absoluteMaxRvVolumeMl: number;
  readonly upperSafetyGainMultiplier: number;
  readonly upperPressureContribution01: number;
};

type ReservoirScaffoldSpecV1 = {
  readonly variantId: string;
  readonly transferGain01: number;
  readonly maxTransferPerEpochMl: number;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly systemicVenousComplianceMlPerMmHg: number;
};

type GateCNeighborhoodPointV1 = {
  readonly scaffoldId: string;
  readonly rightCandidateId: string;
  readonly reservoirVariantId: string;
  readonly reservoirStatus: ReservoirStateContractReportV1["decision"]["reservoirStateStatus"];
  readonly passCount: number;
  readonly meanAbsMismatchMl: number | null;
  readonly maxFinalAbsMismatchMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number | null;
  readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
  readonly maxSystemicPressureAdjustmentMmHg: number | null;
  readonly remainingBlockers: readonly string[];
  readonly pass: boolean;
};

export type GateCScaffoldRobustnessReportV1 = {
  readonly reportId: typeof GATE_C_SCAFFOLD_ROBUSTNESS_REPORT_ID_V1;
  readonly gateId: "gateCScaffoldRobustnessV1";
  readonly centerScaffoldId: string;
  readonly neighborhoodResults: readonly GateCNeighborhoodPointV1[];
  readonly summary: {
    readonly totalNeighborhoodPoints: number;
    readonly passCount: number;
    readonly centerPass: boolean;
    readonly passScaffoldIds: readonly string[];
    readonly failedScaffoldIds: readonly string[];
    readonly bestPassScaffoldId: string | null;
    readonly bestPassMeanAbsMismatchMl: number | null;
    readonly minPassingPressureContribution01: number | null;
    readonly maxPassingPressureContribution01: number | null;
    readonly distinctPassingRightCandidateCount: number;
    readonly distinctPassingReservoirVariantCount: number;
    readonly maxPassingAcceptedTransferMl: number | null;
    readonly maxPassingReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly robustnessStatus:
      | "gate-c-neighborhood-robust-signal"
      | "gate-c-center-only-signal"
      | "gate-c-robustness-blocked";
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

const CENTER_RIGHT_PRESSURE_CONTRIBUTION = 0.45;
const RIGHT_PRESSURE_CONTRIBUTIONS = [0.43, 0.45, 0.47] as const;
const RESERVOIR_GAINS = [0.10, 0.12, 0.14] as const;
const RESERVOIR_TRANSFER_CAPS_ML = [3.5, 4, 4.5] as const;

export function runGateCScaffoldRobustnessBenchV1(): GateCScaffoldRobustnessReportV1 {
  const rightScaffolds = RIGHT_PRESSURE_CONTRIBUTIONS.map((pressureContribution) =>
    rightScaffold(pressureContribution)
  );
  const reservoirScaffolds = RESERVOIR_GAINS.flatMap((gain) =>
    RESERVOIR_TRANSFER_CAPS_ML.map((cap) => reservoirScaffold(gain, cap))
  );
  const neighborhoodResults = rightScaffolds.flatMap((right) =>
    reservoirScaffolds.map((reservoir) => runNeighborhoodPoint(right, reservoir))
  );
  const passing = neighborhoodResults.filter((point) => point.pass);
  const centerScaffoldId = scaffoldId(
    rightScaffold(CENTER_RIGHT_PRESSURE_CONTRIBUTION),
    reservoirScaffold(0.12, 4),
  );
  const centerPass = neighborhoodResults.some((point) => point.scaffoldId === centerScaffoldId && point.pass);
  const bestPass = [...passing].sort((a, b) =>
    (a.meanAbsMismatchMl ?? 1e9) - (b.meanAbsMismatchMl ?? 1e9)
    || (a.maxAbsAcceptedTransferMl ?? 1e9) - (b.maxAbsAcceptedTransferMl ?? 1e9)
  )[0] ?? null;
  const passingPressureContributions = passing.map((point) =>
    Number(point.rightCandidateId.split("-pressure-").at(-1))
  ).filter((value) => Number.isFinite(value));
  const robustnessStatus = passing.length >= 5 && centerPass
    ? "gate-c-neighborhood-robust-signal"
    : centerPass
      ? "gate-c-center-only-signal"
      : "gate-c-robustness-blocked";

  return {
    reportId: GATE_C_SCAFFOLD_ROBUSTNESS_REPORT_ID_V1,
    gateId: "gateCScaffoldRobustnessV1",
    centerScaffoldId,
    neighborhoodResults,
    summary: {
      totalNeighborhoodPoints: neighborhoodResults.length,
      passCount: passing.length,
      centerPass,
      passScaffoldIds: passing.map((point) => point.scaffoldId),
      failedScaffoldIds: neighborhoodResults.filter((point) => !point.pass).map((point) => point.scaffoldId),
      bestPassScaffoldId: bestPass?.scaffoldId ?? null,
      bestPassMeanAbsMismatchMl: bestPass?.meanAbsMismatchMl ?? null,
      minPassingPressureContribution01: passingPressureContributions.length === 0
        ? null
        : round(Math.min(...passingPressureContributions)),
      maxPassingPressureContribution01: passingPressureContributions.length === 0
        ? null
        : round(Math.max(...passingPressureContributions)),
      distinctPassingRightCandidateCount: new Set(passing.map((point) => point.rightCandidateId)).size,
      distinctPassingReservoirVariantCount: new Set(passing.map((point) => point.reservoirVariantId)).size,
      maxPassingAcceptedTransferMl: maxOrNull(passing.map((point) => point.maxAbsAcceptedTransferMl)),
      maxPassingReservoirVolumeMl: maxOrNull(passing.map((point) => point.maxAbsReservoirVolumeMl)),
    },
    decision: {
      robustnessStatus,
      nextAction: robustnessStatus === "gate-c-neighborhood-robust-signal"
        ? "Treat Gate C as a broader scaffold signal and run assembled-system review before any four-chamber or AV-plane work."
        : robustnessStatus === "gate-c-center-only-signal"
          ? "Keep Gate C on scaffold robustness. The center passes, but the neighborhood is too narrow for four-chamber, AV-plane, or LandAtrial work."
          : "Do not proceed to four-chamber, AV-plane, or LandAtrial. The Gate C center scaffold is not robust under local perturbation.",
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

function runNeighborhoodPoint(
  right: RightScaffoldSpecV1,
  reservoir: ReservoirScaffoldSpecV1,
): GateCNeighborhoodPointV1 {
  const rightParams = buildRightHeartStrategicEnvelopeV1().map((point) =>
    applyRightScaffold(point, right)
  );
  const report = runReservoirStateContractBenchWithRightParamsAndVariantsV1(
    rightParams,
    `gate-c-neighborhood:${right.candidateId}`,
    [openReservoirReference(), reservoirVariant(reservoir)],
  );
  const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId) ?? null;
  const summary = best?.summary ?? null;
  const pass = report.decision.reservoirStateStatus === "stateful-reservoir-pass"
    && report.decision.bestPassCount === 7;
  return {
    scaffoldId: scaffoldId(right, reservoir),
    rightCandidateId: right.candidateId,
    reservoirVariantId: reservoir.variantId,
    reservoirStatus: report.decision.reservoirStateStatus,
    passCount: report.decision.bestPassCount,
    meanAbsMismatchMl: report.decision.bestMeanAbsMismatchMl,
    maxFinalAbsMismatchMl: summary?.maxFinalAbsMismatchMl ?? null,
    maxAbsAcceptedTransferMl: summary?.maxAbsAcceptedTransferMl ?? null,
    maxAbsReservoirVolumeMl: summary?.maxAbsReservoirVolumeMl ?? null,
    maxPulmonaryVenousPressureAdjustmentMmHg: summary?.maxPulmonaryVenousPressureAdjustmentMmHg ?? null,
    maxSystemicPressureAdjustmentMmHg: summary?.maxSystemicPressureAdjustmentMmHg ?? null,
    remainingBlockers: report.decision.remainingBlockers,
    pass,
  };
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  candidate: RightScaffoldSpecV1,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: candidate.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: candidate.absoluteMaxRvVolumeMl,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * candidate.upperSafetyGainMultiplier,
    rvUpperSoftLimitPressureContribution01: candidate.upperPressureContribution01,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low"
          ? candidate.lowContractilityTrefPa
          : point.rv.fiber.trefPa,
      },
    },
  };
}

function rightScaffold(upperPressureContribution01: number): RightScaffoldSpecV1 {
  return {
    candidateId: `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-${upperPressureContribution01}`,
    lowContractilityTrefPa: 26_000,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    upperSafetyGainMultiplier: 0.25,
    upperPressureContribution01,
  };
}

function reservoirScaffold(gain: number, cap: number): ReservoirScaffoldSpecV1 {
  return {
    variantId: `vr-neighborhood-cap${cap}-gain${gain}-comp80`,
    transferGain01: gain,
    maxTransferPerEpochMl: cap,
    pulmonaryVenousComplianceMlPerMmHg: 80,
    systemicVenousComplianceMlPerMmHg: 160,
  };
}

function reservoirVariant(scaffold: ReservoirScaffoldSpecV1): ReservoirStateVariantSpecV1 {
  return {
    variantId: scaffold.variantId,
    description: `Gate C scaffold neighborhood: gain ${scaffold.transferGain01}, cap ${scaffold.maxTransferPerEpochMl} mL.`,
    epochs: 14,
    transferGain01: scaffold.transferGain01,
    maxTransferPerEpochMl: scaffold.maxTransferPerEpochMl,
    pulmonaryVenousComplianceMlPerMmHg: scaffold.pulmonaryVenousComplianceMlPerMmHg,
    systemicVenousComplianceMlPerMmHg: scaffold.systemicVenousComplianceMlPerMmHg,
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
    description: "No reservoir transfer; records the open-boundary mismatch for the scaffold point.",
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

function scaffoldId(right: RightScaffoldSpecV1, reservoir: ReservoirScaffoldSpecV1): string {
  return `${right.candidateId}__${reservoir.variantId}`;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

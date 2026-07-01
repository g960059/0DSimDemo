import {
  runReservoirStateContractBenchWithRightParamsAndVariantsV1,
  type ReservoirStateContractPointResultV1,
  type ReservoirStateVariantSpecV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1,
  buildFourChamberAssemblyLedgerV1,
  fourChamberAssemblyPointFailuresV1,
} from "@/engine/mechanics2/core/FourChamberAssemblyContractV1";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_ASSEMBLY_SMOKE_REPORT_ID_V1 =
  "four-chamber-assembly-smoke-report-v1" as const;

type SmokeScaffoldSpecV1 = {
  readonly scaffoldId: string;
  readonly rightUpperPressureContribution01: number;
  readonly reservoirTransferGain01: number;
  readonly reservoirTransferCapMl: number;
};

type SmokeProfileResultV1 = {
  readonly profileId: string;
  readonly status: "pass" | "fail";
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly absForwardMismatchMl: number | null;
  readonly relativeForwardMismatch: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
  readonly transferLimiterHitCount: number;
  readonly acceptedPhenotypeReasons: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  readonly failureReasons: readonly string[];
};

type SmokeScaffoldResultV1 = {
  readonly scaffold: SmokeScaffoldSpecV1;
  readonly reservoirBestVariantId: string;
  readonly profileResults: readonly SmokeProfileResultV1[];
  readonly summary: {
    readonly profileCount: number;
    readonly passCount: number;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly meanAbsForwardMismatchMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicPressureAdjustmentMmHg: number | null;
  };
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type FourChamberAssemblySmokeReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_ASSEMBLY_SMOKE_REPORT_ID_V1;
  readonly gateId: "fourChamberAssemblySmokeV1";
  readonly contractId: typeof FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1.contractId;
  readonly scaffoldResults: readonly SmokeScaffoldResultV1[];
  readonly selectedScaffold: SmokeScaffoldResultV1 | null;
  readonly summary: {
    readonly totalScaffolds: number;
    readonly passCount: number;
    readonly selectedScaffoldId: string | null;
    readonly selectedMeanAbsForwardMismatchMl: number | null;
    readonly selectedMaxAcceptedTransferMl: number | null;
    readonly selectedMaxReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly smokeStatus:
      | "four-chamber-assembly-smoke-pass"
      | "four-chamber-assembly-smoke-mixed"
      | "four-chamber-assembly-smoke-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const SMOKE_SCAFFOLDS: readonly SmokeScaffoldSpecV1[] = [
  {
    scaffoldId: "center-pressure045-gain012-cap4",
    rightUpperPressureContribution01: 0.45,
    reservoirTransferGain01: 0.12,
    reservoirTransferCapMl: 4,
  },
  {
    scaffoldId: "best-neighborhood-pressure047-gain014-cap35",
    rightUpperPressureContribution01: 0.47,
    reservoirTransferGain01: 0.14,
    reservoirTransferCapMl: 3.5,
  },
];

export function runFourChamberAssemblySmokeBenchV1(): FourChamberAssemblySmokeReportV1 {
  const scaffoldResults = SMOKE_SCAFFOLDS.map(runSmokeScaffold);
  const passing = scaffoldResults.filter((result) => result.status === "pass");
  const selectedScaffold = [...passing].sort((a, b) =>
    (a.summary.meanAbsForwardMismatchMl ?? 1e9) - (b.summary.meanAbsForwardMismatchMl ?? 1e9)
    || (a.summary.maxAbsAcceptedTransferMl ?? 1e9) - (b.summary.maxAbsAcceptedTransferMl ?? 1e9)
  )[0] ?? null;
  const smokeStatus = passing.length === scaffoldResults.length
    ? "four-chamber-assembly-smoke-pass"
    : passing.length > 0
      ? "four-chamber-assembly-smoke-mixed"
      : "four-chamber-assembly-smoke-blocked";
  return {
    reportId: FOUR_CHAMBER_ASSEMBLY_SMOKE_REPORT_ID_V1,
    gateId: "fourChamberAssemblySmokeV1",
    contractId: FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1.contractId,
    scaffoldResults,
    selectedScaffold,
    summary: {
      totalScaffolds: scaffoldResults.length,
      passCount: passing.length,
      selectedScaffoldId: selectedScaffold?.scaffold.scaffoldId ?? null,
      selectedMeanAbsForwardMismatchMl: selectedScaffold?.summary.meanAbsForwardMismatchMl ?? null,
      selectedMaxAcceptedTransferMl: selectedScaffold?.summary.maxAbsAcceptedTransferMl ?? null,
      selectedMaxReservoirVolumeMl: selectedScaffold?.summary.maxAbsReservoirVolumeMl ?? null,
    },
    decision: {
      smokeStatus,
      nextAction: smokeStatus === "four-chamber-assembly-smoke-pass"
        ? "Use the selected scaffold for the first time-domain sidecar four-chamber subsystem smoke. Keep runtime, AV-plane, and LandAtrial blocked."
        : "Keep the lane at four-chamber assembly smoke. Do not proceed to time-domain four-chamber subsystem work until this smoke passes.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runSmokeScaffold(scaffold: SmokeScaffoldSpecV1): SmokeScaffoldResultV1 {
  const report = runReservoirStateContractBenchWithRightParamsAndVariantsV1(
    buildRightHeartStrategicEnvelopeV1().map((point) => applyRightScaffold(point, scaffold)),
    `four-chamber-assembly-smoke:${scaffold.scaffoldId}`,
    [openReservoirReference(), reservoirVariant(scaffold)],
  );
  const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId);
  const profileResults = best?.pointResults.map(toSmokeProfile) ?? [];
  const failureReasons = profileResults
    .filter((profile) => profile.status !== "pass")
    .map((profile) => `${profile.profileId}: ${profile.failureReasons.join(",")}`);
  return {
    scaffold,
    reservoirBestVariantId: report.decision.bestVariantId,
    profileResults,
    summary: summarizeProfiles(profileResults),
    status: profileResults.length === 7 && failureReasons.length === 0 ? "pass" : "fail",
    failureReasons: profileResults.length === 7 ? failureReasons : ["missing-profile-results", ...failureReasons],
  };
}

function toSmokeProfile(point: ReservoirStateContractPointResultV1): SmokeProfileResultV1 {
  const ledger = buildFourChamberAssemblyLedgerV1(point);
  const failureReasons = fourChamberAssemblyPointFailuresV1(ledger);
  return {
    profileId: point.profileId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    leftAovEjectedVolumeMl: ledger.leftAovEjectedVolumeMl,
    rightPvEjectedVolumeMl: ledger.rightPvEjectedVolumeMl,
    absForwardMismatchMl: ledger.absForwardMismatchMl,
    relativeForwardMismatch: ledger.relativeForwardMismatch,
    maxAbsAcceptedTransferMl: ledger.maxAbsAcceptedTransferMl,
    maxAbsReservoirVolumeMl: ledger.maxAbsReservoirVolumeMl,
    pulmonaryVenousPressureAdjustmentMmHg: ledger.pulmonaryVenousPressureAdjustmentMmHg,
    systemicPressureAdjustmentMmHg: ledger.systemicPressureAdjustmentMmHg,
    transferLimiterHitCount: ledger.transferLimiterHitCount,
    acceptedPhenotypeReasons: {
      left: ledger.leftAcceptedPhenotypeReasons,
      right: ledger.rightAcceptedPhenotypeReasons,
    },
    failureReasons,
  };
}

function summarizeProfiles(
  profileResults: readonly SmokeProfileResultV1[],
): SmokeScaffoldResultV1["summary"] {
  return {
    profileCount: profileResults.length,
    passCount: profileResults.filter((profile) => profile.status === "pass").length,
    maxAbsForwardMismatchMl: maxOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    meanAbsForwardMismatchMl: meanOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    maxAbsAcceptedTransferMl: maxOrNull(profileResults.map((profile) => profile.maxAbsAcceptedTransferMl)),
    maxAbsReservoirVolumeMl: maxOrNull(profileResults.map((profile) => profile.maxAbsReservoirVolumeMl)),
    maxPulmonaryVenousPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.pulmonaryVenousPressureAdjustmentMmHg))),
    maxSystemicPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.systemicPressureAdjustmentMmHg))),
  };
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  scaffold: SmokeScaffoldSpecV1,
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

function reservoirVariant(scaffold: SmokeScaffoldSpecV1): ReservoirStateVariantSpecV1 {
  return {
    variantId: `${scaffold.scaffoldId}-reservoir`,
    description: `Four-chamber assembly smoke reservoir for ${scaffold.scaffoldId}.`,
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
    description: "No reservoir transfer; records the open-boundary mismatch for the assembly smoke.",
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

function meanOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

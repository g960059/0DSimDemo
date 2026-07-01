import {
  runReservoirStateContractBenchWithRightParamsAndVariantsV1,
  type ReservoirStateContractReportV1,
  type ReservoirStateVariantSpecV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1,
  buildFourChamberAssemblyLedgerV1,
  fourChamberAssemblyPointFailuresV1,
  type FourChamberAssemblyLedgerV1,
} from "@/engine/mechanics2/core/FourChamberAssemblyContractV1";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_ASSEMBLY_CONTRACT_REPORT_ID_V1 =
  "four-chamber-assembly-contract-report-v1" as const;

type AssemblyScaffoldSpecV1 = {
  readonly scaffoldId: string;
  readonly label: "center" | "best-neighborhood";
  readonly rightUpperPressureContribution01: number;
  readonly reservoirTransferGain01: number;
  readonly reservoirTransferCapMl: number;
};

type AssemblyPointResultV1 = {
  readonly profileId: string;
  readonly status: "pass" | "fail";
  readonly ledger: FourChamberAssemblyLedgerV1;
  readonly failureReasons: readonly string[];
};

type AssemblyScaffoldResultV1 = {
  readonly scaffold: AssemblyScaffoldSpecV1;
  readonly reservoirStatus: ReservoirStateContractReportV1["decision"]["reservoirStateStatus"];
  readonly reservoirBestVariantId: string;
  readonly pointResults: readonly AssemblyPointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicPressureAdjustmentMmHg: number | null;
  };
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type FourChamberAssemblyContractReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_ASSEMBLY_CONTRACT_REPORT_ID_V1;
  readonly gateId: "fourChamberAssemblyContractV1";
  readonly contract: typeof FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1;
  readonly scaffoldResults: readonly AssemblyScaffoldResultV1[];
  readonly summary: {
    readonly reviewedScaffoldCount: number;
    readonly passCount: number;
    readonly passedScaffoldIds: readonly string[];
    readonly failedScaffoldIds: readonly string[];
    readonly maxPassingAbsForwardMismatchMl: number | null;
    readonly maxPassingAcceptedTransferMl: number | null;
    readonly maxPassingReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly assemblyContractStatus:
      | "four-chamber-assembly-contract-pass"
      | "four-chamber-assembly-contract-mixed"
      | "four-chamber-assembly-contract-blocked";
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

const ASSEMBLY_SCAFFOLDS: readonly AssemblyScaffoldSpecV1[] = [
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

export function runFourChamberAssemblyContractBenchV1(): FourChamberAssemblyContractReportV1 {
  const scaffoldResults = ASSEMBLY_SCAFFOLDS.map(runScaffold);
  const passing = scaffoldResults.filter((result) => result.status === "pass");
  const assemblyContractStatus = passing.length === scaffoldResults.length
    ? "four-chamber-assembly-contract-pass"
    : passing.length > 0
      ? "four-chamber-assembly-contract-mixed"
      : "four-chamber-assembly-contract-blocked";
  return {
    reportId: FOUR_CHAMBER_ASSEMBLY_CONTRACT_REPORT_ID_V1,
    gateId: "fourChamberAssemblyContractV1",
    contract: FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1,
    scaffoldResults,
    summary: {
      reviewedScaffoldCount: scaffoldResults.length,
      passCount: passing.length,
      passedScaffoldIds: passing.map((result) => result.scaffold.scaffoldId),
      failedScaffoldIds: scaffoldResults
        .filter((result) => result.status !== "pass")
        .map((result) => result.scaffold.scaffoldId),
      maxPassingAbsForwardMismatchMl: maxOrNull(passing.map((result) => result.summary.maxAbsForwardMismatchMl)),
      maxPassingAcceptedTransferMl: maxOrNull(passing.map((result) => result.summary.maxAbsAcceptedTransferMl)),
      maxPassingReservoirVolumeMl: maxOrNull(passing.map((result) => result.summary.maxAbsReservoirVolumeMl)),
    },
    decision: {
      assemblyContractStatus,
      nextAction: assemblyContractStatus === "four-chamber-assembly-contract-pass"
        ? "Proceed to a sidecar four-chamber assembly smoke that implements this contract. Do not wire runtime, AV-plane, or LandAtrial yet."
        : "Keep MechanicsCore2 at Gate C. Do not implement four-chamber assembly until the contract report passes.",
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

function runScaffold(scaffold: AssemblyScaffoldSpecV1): AssemblyScaffoldResultV1 {
  const reservoirReport = runReservoirStateContractBenchWithRightParamsAndVariantsV1(
    buildRightHeartStrategicEnvelopeV1().map((point) => applyRightScaffold(point, scaffold)),
    `four-chamber-assembly-contract:${scaffold.scaffoldId}`,
    [openReservoirReference(), reservoirVariant(scaffold)],
  );
  const best = reservoirReport.variantResults.find((variant) =>
    variant.variantId === reservoirReport.decision.bestVariantId
  );
  const pointResults = best?.pointResults.map((point): AssemblyPointResultV1 => {
    const ledger = buildFourChamberAssemblyLedgerV1(point);
    const failureReasons = fourChamberAssemblyPointFailuresV1(ledger);
    return {
      profileId: point.profileId,
      status: failureReasons.length === 0 ? "pass" : "fail",
      ledger,
      failureReasons,
    };
  }) ?? [];
  const failureReasons = scaffoldFailures(pointResults);
  return {
    scaffold,
    reservoirStatus: reservoirReport.decision.reservoirStateStatus,
    reservoirBestVariantId: reservoirReport.decision.bestVariantId,
    pointResults,
    summary: summarizeAssemblyPoints(pointResults),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function scaffoldFailures(pointResults: readonly AssemblyPointResultV1[]): readonly string[] {
  const failures: string[] = [];
  if (pointResults.length !== 7) failures.push("missing-profile-results");
  const failedProfiles = pointResults.filter((point) => point.status !== "pass");
  if (failedProfiles.length > 0) failures.push(...failedProfiles.map((point) =>
    `${point.profileId}: ${point.failureReasons.join(",")}`
  ));
  return failures;
}

function summarizeAssemblyPoints(
  pointResults: readonly AssemblyPointResultV1[],
): AssemblyScaffoldResultV1["summary"] {
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status !== "pass").length,
    maxAbsForwardMismatchMl: maxOrNull(pointResults.map((point) => point.ledger.absForwardMismatchMl)),
    maxAbsAcceptedTransferMl: maxOrNull(pointResults.map((point) => point.ledger.maxAbsAcceptedTransferMl)),
    maxAbsReservoirVolumeMl: maxOrNull(pointResults.map((point) => point.ledger.maxAbsReservoirVolumeMl)),
    maxPulmonaryVenousPressureAdjustmentMmHg:
      maxOrNull(pointResults.map((point) => Math.abs(point.ledger.pulmonaryVenousPressureAdjustmentMmHg))),
    maxSystemicPressureAdjustmentMmHg:
      maxOrNull(pointResults.map((point) => Math.abs(point.ledger.systemicPressureAdjustmentMmHg))),
  };
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  scaffold: AssemblyScaffoldSpecV1,
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

function reservoirVariant(scaffold: AssemblyScaffoldSpecV1): ReservoirStateVariantSpecV1 {
  return {
    variantId: `${scaffold.scaffoldId}-reservoir`,
    description: `Four-chamber assembly contract reservoir for ${scaffold.scaffoldId}.`,
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
    description: "No reservoir transfer; records the open-boundary mismatch for the assembly contract.",
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

import type {
  ReservoirStateContractPointResultV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";

export type FourChamberAssemblyChamberIdV1 = "LA" | "LV" | "RA" | "RV";
export type FourChamberAssemblyValveIdV1 = "MV" | "AoV" | "TV" | "PV";
export type FourChamberAssemblyReservoirIdV1 = "pulmonaryVenous" | "systemicVenous";

export type FourChamberAssemblyContractV1 = {
  readonly contractId: "four-chamber-assembly-contract-v1";
  readonly chambers: readonly FourChamberAssemblyChamberIdV1[];
  readonly valves: readonly FourChamberAssemblyValveIdV1[];
  readonly reservoirs: readonly FourChamberAssemblyReservoirIdV1[];
  readonly requiredLedgers: readonly string[];
  readonly blockedClaims: readonly string[];
};

export type FourChamberAssemblyLedgerV1 = {
  readonly profileId: string;
  readonly chamberSetComplete: boolean;
  readonly valveSetComplete: boolean;
  readonly reservoirSetComplete: boolean;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedForwardMismatchMl: number | null;
  readonly absForwardMismatchMl: number | null;
  readonly relativeForwardMismatch: number | null;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly totalReservoirVolumeResidualMl: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly transferLimiterHitCount: number;
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly leftAcceptedPhenotypeReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
};

export const FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1: FourChamberAssemblyContractV1 = {
  contractId: "four-chamber-assembly-contract-v1",
  chambers: ["LA", "LV", "RA", "RV"],
  valves: ["MV", "AoV", "TV", "PV"],
  reservoirs: ["pulmonaryVenous", "systemicVenous"],
  requiredLedgers: [
    "left-forward-ejection",
    "right-forward-ejection",
    "forward-ejection-mismatch",
    "pulmonary-venous-reservoir-volume",
    "systemic-venous-reservoir-volume",
    "reservoir-volume-residual",
    "reservoir-pressure-adjustments",
    "accepted-transfer",
    "accepted-phenotypes",
  ],
  blockedClaims: [
    "runtime-wiring",
    "true-four-chamber-dynamics",
    "morphology-acceptance",
    "AV-plane-unlock",
    "LandAtrial-unlock",
  ],
};

export function buildFourChamberAssemblyLedgerV1(
  point: ReservoirStateContractPointResultV1,
): FourChamberAssemblyLedgerV1 {
  const transferLimiterHitCount = point.epochHistory.filter((epoch) => epoch.transferLimiterActive).length;
  return {
    profileId: point.profileId,
    chamberSetComplete: true,
    valveSetComplete: true,
    reservoirSetComplete: true,
    leftAovEjectedVolumeMl: point.finalState.leftAovEjectedVolumeMl,
    rightPvEjectedVolumeMl: point.finalState.rightPvEjectedVolumeMl,
    signedForwardMismatchMl: point.finalState.signedMismatchMl,
    absForwardMismatchMl: point.finalState.absMismatchMl,
    relativeForwardMismatch: point.finalState.relativeMismatch,
    pulmonaryVenousReservoirVolumeMl: point.finalState.pulmonaryVenousReservoirVolumeMl,
    systemicVenousReservoirVolumeMl: point.finalState.systemicVenousReservoirVolumeMl,
    totalReservoirVolumeResidualMl: point.finalState.totalReservoirVolumeResidualMl,
    pulmonaryVenousPressureAdjustmentMmHg: point.finalState.pulmonaryVenousPressureAdjustmentMmHg,
    systemicPressureAdjustmentMmHg: point.finalState.systemicPressureAdjustmentMmHg,
    maxAbsAcceptedTransferMl: point.finalState.maxAbsAcceptedTransferMl,
    maxAbsReservoirVolumeMl: point.finalState.maxAbsReservoirVolumeMl,
    transferLimiterHitCount,
    leftStatus: point.finalState.leftStatus,
    rightStatus: point.finalState.rightStatus,
    leftAcceptedPhenotypeReasons: point.finalState.leftAcceptedPhenotypeReasons,
    rightAcceptedPhenotypeReasons: point.finalState.rightAcceptedPhenotypeReasons,
  };
}

export function fourChamberAssemblyPointFailuresV1(
  ledger: FourChamberAssemblyLedgerV1,
): readonly string[] {
  const failures: string[] = [];
  if (!ledger.chamberSetComplete) failures.push("missing-chamber-set");
  if (!ledger.valveSetComplete) failures.push("missing-valve-set");
  if (!ledger.reservoirSetComplete) failures.push("missing-reservoir-set");
  if (ledger.leftStatus !== "pass") failures.push("left-surface-not-preserved");
  if (ledger.rightStatus !== "pass") failures.push("right-surface-not-preserved");
  if (!forwardMismatchBalanced(ledger)) failures.push("forward-ejection-mismatch");
  if (Math.abs(ledger.totalReservoirVolumeResidualMl) > 1e-6) failures.push("reservoir-ledger-residual");
  if ((ledger.maxAbsAcceptedTransferMl ?? 1e9) > 2) failures.push("accepted-transfer-unbounded");
  if (ledger.maxAbsReservoirVolumeMl > 25) failures.push("reservoir-volume-unbounded");
  if (Math.abs(ledger.pulmonaryVenousPressureAdjustmentMmHg) > 0.3) {
    failures.push("pulmonary-pressure-adjustment-unbounded");
  }
  if (Math.abs(ledger.systemicPressureAdjustmentMmHg) > 0.15) {
    failures.push("systemic-pressure-adjustment-unbounded");
  }
  if (ledger.transferLimiterHitCount > 0) failures.push("transfer-limiter-reliance");
  if (!acceptedPhenotypeScopeOk(ledger)) failures.push("unexpected-accepted-phenotype");
  return failures;
}

function forwardMismatchBalanced(ledger: FourChamberAssemblyLedgerV1): boolean {
  return ledger.absForwardMismatchMl != null
    && ledger.relativeForwardMismatch != null
    && (ledger.absForwardMismatchMl <= 8 || ledger.relativeForwardMismatch <= 0.18);
}

function acceptedPhenotypeScopeOk(ledger: FourChamberAssemblyLedgerV1): boolean {
  const expected = ledger.profileId === "contractility-low"
    ? ["clean-low-contractility-low-output-phenotype"]
    : [];
  return sameStringSet(ledger.leftAcceptedPhenotypeReasons, expected)
    && sameStringSet(ledger.rightAcceptedPhenotypeReasons, expected);
}

function sameStringSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}

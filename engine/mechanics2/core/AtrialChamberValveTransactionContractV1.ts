import type { AVPlaneGeometryReadbackV1 } from "@/engine/mechanics2/core/AVPlaneGeometryStateV1";

export type AtrialChamberValveTransactionEvidenceV1 = {
  readonly atrialFigureEight: {
    readonly currentPressureLobeQualityPass: number;
    readonly atrialFiberLobeQualityPass: number;
    readonly totalRows: number;
  };
  readonly statefulChamberPressure: {
    readonly selectedSourceSurfacePass: number;
    readonly selectedContractPass: number;
    readonly selectedLaPvLobeQualityPass: number;
    readonly totalProfiles: number;
  };
  readonly avValveCyclicReplay: {
    readonly bestFixedPass: number;
    readonly bestFixedForwardVolumeParityCount: number;
    readonly bestOraclePass: number;
    readonly totalRows: number;
  };
  readonly avPlaneReadbacks: readonly AVPlaneGeometryReadbackV1[];
};

export type AtrialChamberValveTransactionReadinessV1 = {
  readonly status:
    | "atrial-chamber-valve-transaction-ready"
    | "atrial-chamber-valve-transaction-blocked";
  readonly requiredOwners: readonly string[];
  readonly blockedClaims: readonly string[];
};

export function classifyAtrialChamberValveTransactionReadinessV1(
  evidence: AtrialChamberValveTransactionEvidenceV1,
): AtrialChamberValveTransactionReadinessV1 {
  const hasFigureEightQuality =
    evidence.atrialFigureEight.currentPressureLobeQualityPass === evidence.atrialFigureEight.totalRows
    && evidence.atrialFigureEight.atrialFiberLobeQualityPass === evidence.atrialFigureEight.totalRows;
  const hasStatefulChamberContract =
    evidence.statefulChamberPressure.selectedSourceSurfacePass === evidence.statefulChamberPressure.totalProfiles
    && evidence.statefulChamberPressure.selectedContractPass === evidence.statefulChamberPressure.totalProfiles
    && evidence.statefulChamberPressure.selectedLaPvLobeQualityPass === evidence.statefulChamberPressure.totalProfiles;
  const hasValveEnergyContract =
    evidence.avValveCyclicReplay.bestFixedPass === evidence.avValveCyclicReplay.totalRows
    && evidence.avValveCyclicReplay.bestFixedForwardVolumeParityCount === evidence.avValveCyclicReplay.totalRows;
  const hasAVPlaneVelocityReadbacks = evidence.avPlaneReadbacks.every((readback) =>
    readback.enabled
    && readback.aPrimeProxyCmPerSec != null
    && readback.hiddenBloodVolumeSourceMl === 0
  );
  const requiredOwners: string[] = [];
  if (!hasFigureEightQuality) requiredOwners.push("atrial-pv-figure-eight-lobe-quality");
  if (!hasStatefulChamberContract) requiredOwners.push("stateful-atrial-chamber-pressure-volume-contract");
  if (!hasValveEnergyContract) requiredOwners.push("same-step-av-valve-pressure-flow-energy-contract");
  if (!hasAVPlaneVelocityReadbacks) requiredOwners.push("av-plane-position-velocity-readbacks");
  return {
    status: requiredOwners.length === 0
      ? "atrial-chamber-valve-transaction-ready"
      : "atrial-chamber-valve-transaction-blocked",
    requiredOwners,
    blockedClaims: [
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "a-prime-readback",
      "LandAtrial-unlock",
    ],
  };
}

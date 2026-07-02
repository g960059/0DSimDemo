import {
  runAtrialFigureEightQualityAuditBenchV1,
} from "@/engine/mechanics2/benches/AtrialFigureEightQualityAuditBench";
import {
  runAvValveCyclicStateReplayBenchV1,
} from "@/engine/mechanics2/benches/AvValveCyclicStateReplayBench";
import {
  runStatefulLaChamberContractSmokeBenchV1,
} from "@/engine/mechanics2/benches/StatefulLaChamberContractSmokeBench";
import {
  classifyAtrialChamberValveTransactionReadinessV1,
  type AtrialChamberValveTransactionEvidenceV1,
  type AtrialChamberValveTransactionReadinessV1,
} from "@/engine/mechanics2/core/AtrialChamberValveTransactionContractV1";
import {
  disabledAVPlaneGeometryReadbackV1,
  initialDisabledAVPlaneGeometryStateV1,
} from "@/engine/mechanics2/core/AVPlaneGeometryStateV1";

export const ATRIAL_CHAMBER_VALVE_TRANSACTION_READINESS_REPORT_ID_V1 =
  "atrial-chamber-valve-transaction-readiness-report-v1" as const;

export type AtrialChamberValveTransactionReadinessReportV1 = {
  readonly reportId: typeof ATRIAL_CHAMBER_VALVE_TRANSACTION_READINESS_REPORT_ID_V1;
  readonly gateId: "atrialChamberValveTransactionReadinessV1";
  readonly readinessMode:
    "readiness-contract-synthesis-no-runtime-no-AV-plane-enable";
  readonly evidence: AtrialChamberValveTransactionEvidenceV1;
  readonly readiness: AtrialChamberValveTransactionReadinessV1;
  readonly summary: {
    readonly requiredOwnerCount: number;
    readonly currentPressureLobeQualityPass: number;
    readonly atrialFiberLobeQualityPass: number;
    readonly statefulLaSourceSurfacePass: number;
    readonly statefulLaContractPass: number;
    readonly avValveBestFixedPass: number;
    readonly avValveBestOraclePass: number;
    readonly avPlaneReadbackCount: number;
    readonly avPlaneEnabledCount: number;
    readonly aPrimeReadbackPresentCount: number;
  };
  readonly decision: {
    readonly atrialChamberValveTransactionReadinessStatus:
      | "atrial-chamber-valve-transaction-ready"
      | "atrial-chamber-valve-transaction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimeReadback: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runAtrialChamberValveTransactionReadinessBenchV1():
AtrialChamberValveTransactionReadinessReportV1 {
  const figureEight = runAtrialFigureEightQualityAuditBenchV1();
  const chamber = runStatefulLaChamberContractSmokeBenchV1();
  const valve = runAvValveCyclicStateReplayBenchV1();
  const avPlaneReadbacks = [
    disabledAVPlaneGeometryReadbackV1(initialDisabledAVPlaneGeometryStateV1("left")),
    disabledAVPlaneGeometryReadbackV1(initialDisabledAVPlaneGeometryStateV1("right")),
  ];
  const evidence: AtrialChamberValveTransactionEvidenceV1 = {
    atrialFigureEight: {
      currentPressureLobeQualityPass: figureEight.summary.currentLobeQualityPass,
      atrialFiberLobeQualityPass: figureEight.summary.fiberLobeQualityPass,
      totalRows: figureEight.summary.total,
    },
    statefulChamberPressure: {
      selectedSourceSurfacePass: chamber.summary.selectedSourceSurfacePass,
      selectedContractPass: chamber.summary.selectedContractPass,
      selectedLaPvLobeQualityPass: chamber.summary.selectedLaPvLobeQualityPass,
      totalProfiles: chamber.summary.totalProfiles,
    },
    avValveCyclicReplay: {
      bestFixedPass: valve.summary.bestFixedPass,
      bestFixedForwardVolumeParityCount: valve.summary.bestFixedForwardVolumeParityCount,
      bestOraclePass: valve.summary.bestOraclePass,
      totalRows: valve.summary.total,
    },
    avPlaneReadbacks,
  };
  const readiness = classifyAtrialChamberValveTransactionReadinessV1(evidence);
  return {
    reportId: ATRIAL_CHAMBER_VALVE_TRANSACTION_READINESS_REPORT_ID_V1,
    gateId: "atrialChamberValveTransactionReadinessV1",
    readinessMode: "readiness-contract-synthesis-no-runtime-no-AV-plane-enable",
    evidence,
    readiness,
    summary: {
      requiredOwnerCount: readiness.requiredOwners.length,
      currentPressureLobeQualityPass: evidence.atrialFigureEight.currentPressureLobeQualityPass,
      atrialFiberLobeQualityPass: evidence.atrialFigureEight.atrialFiberLobeQualityPass,
      statefulLaSourceSurfacePass: evidence.statefulChamberPressure.selectedSourceSurfacePass,
      statefulLaContractPass: evidence.statefulChamberPressure.selectedContractPass,
      avValveBestFixedPass: evidence.avValveCyclicReplay.bestFixedPass,
      avValveBestOraclePass: evidence.avValveCyclicReplay.bestOraclePass,
      avPlaneReadbackCount: avPlaneReadbacks.length,
      avPlaneEnabledCount: avPlaneReadbacks.filter((readback) => readback.enabled).length,
      aPrimeReadbackPresentCount: avPlaneReadbacks.filter((readback) =>
        readback.aPrimeProxyCmPerSec != null).length,
    },
    decision: {
      atrialChamberValveTransactionReadinessStatus: readiness.status,
      nextAction: readiness.status === "atrial-chamber-valve-transaction-ready"
        ? "Proceed only to a measured same-step atrial chamber/AV valve transaction smoke."
        : "Do not enable AV-plane, a-prime, runtime, or LandAtrial. Implement a measured same-step atrial chamber/AV valve pressure-flow transaction that owns the listed residual owners.",
      blockedClaims: readiness.blockedClaims,
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimeReadback: false,
      LandAtrialUnlock: false,
    },
  };
}

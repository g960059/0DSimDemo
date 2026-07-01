import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1,
  runReservoirSolverBridgeBenchV1,
} from "@/engine/mechanics2/benches/ReservoirSolverBridgeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RESERVOIR_SOLVER_ATTRIBUTION_REPORT_ID_V1 =
  "reservoir-solver-attribution-report-v1" as const;

type TransferCandidateV1 = {
  readonly transferMl: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicVenousPressureAdjustmentMmHg: number;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  readonly morphologyPreserved: boolean;
  readonly flowBalanced: boolean;
  readonly pressureAdjustmentBounded: boolean;
};

type TransferScanV1 = {
  readonly scanId: "accepted-bound" | "wide-diagnostic";
  readonly transferBoundMl: number;
  readonly pulmonaryPressureBoundMmHg: number;
  readonly systemicPressureBoundMmHg: number;
  readonly sampleCount: number;
  readonly bestMorphologyPreserving: TransferCandidateV1 | null;
  readonly bestFlowBalanced: TransferCandidateV1 | null;
  readonly candidates: readonly TransferCandidateV1[];
};

type AcceptedTransferProfileV1 = {
  readonly profileId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly transferMl: number | null;
  readonly meanForwardEjectionMl: number | null;
  readonly transferToForwardRatio: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number | null;
  readonly systemicVenousPressureAdjustmentMmHg: number | null;
  readonly largeTransfer: boolean;
  readonly failureReasons: readonly string[];
};

export type ReservoirSolverAttributionReportV1 = {
  readonly reportId: typeof RESERVOIR_SOLVER_ATTRIBUTION_REPORT_ID_V1;
  readonly sourceReportId: typeof RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1;
  readonly bestVariantId: "same-step-high-compliance-bound2";
  readonly acceptedTransferProfiles: readonly AcceptedTransferProfileV1[];
  readonly acceptedTransferSummary: {
    readonly total: number;
    readonly largeTransferCount: number;
    readonly maxAcceptedAbsTransferMl: number | null;
    readonly maxTransferToForwardRatio: number | null;
  };
  readonly contractilityLowAttribution: {
    readonly referenceLeftAovEjectedVolumeMl: number | null;
    readonly referenceRightPvEjectedVolumeMl: number | null;
    readonly acceptedLeftAovEjectedVolumeMl: number | null;
    readonly acceptedRightPvEjectedVolumeMl: number | null;
    readonly acceptedAbsMismatchMl: number | null;
    readonly acceptedRelativeMismatch: number | null;
    readonly acceptedTransferMl: number | null;
    readonly acceptedFailureReasons: readonly string[];
    readonly scans: readonly TransferScanV1[];
    readonly classification: "profile-severity-mismatch" | "large-transfer-required" | "inconclusive";
  };
  readonly decision: {
    readonly attributionStatus: "stateful-reservoir-required";
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

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const BEST_VARIANT_ID = "same-step-high-compliance-bound2" as const;
const LARGE_TRANSFER_RATIO_THRESHOLD = 0.5;

export function runReservoirSolverAttributionBenchV1(): ReservoirSolverAttributionReportV1 {
  const solverReport = runReservoirSolverBridgeBenchV1();
  const best = solverReport.variantResults.find((variant) => variant.variantId === BEST_VARIANT_ID);
  if (best == null) throw new Error(`Missing reservoir solver variant ${BEST_VARIANT_ID}`);

  const acceptedTransferProfiles = best.pointResults.map((point): AcceptedTransferProfileV1 => {
    const accepted = point.accepted;
    const meanForwardEjectionMl = accepted?.leftAovEjectedVolumeMl != null && accepted.rightPvEjectedVolumeMl != null
      ? (Math.abs(accepted.leftAovEjectedVolumeMl) + Math.abs(accepted.rightPvEjectedVolumeMl)) / 2
      : null;
    const transferToForwardRatio = accepted?.transferMl != null && meanForwardEjectionMl != null && meanForwardEjectionMl > 1e-9
      ? Math.abs(accepted.transferMl) / meanForwardEjectionMl
      : null;
    return {
      profileId: point.profileId,
      status: point.status,
      transferMl: accepted?.transferMl ?? null,
      meanForwardEjectionMl: roundOrNull(meanForwardEjectionMl),
      transferToForwardRatio: roundOrNull(transferToForwardRatio),
      absMismatchMl: accepted?.absMismatchMl ?? null,
      relativeMismatch: accepted?.relativeMismatch ?? null,
      pulmonaryVenousPressureAdjustmentMmHg: accepted?.pulmonaryVenousPressureAdjustmentMmHg ?? null,
      systemicVenousPressureAdjustmentMmHg: accepted?.systemicVenousPressureAdjustmentMmHg ?? null,
      largeTransfer: transferToForwardRatio != null && transferToForwardRatio > LARGE_TRANSFER_RATIO_THRESHOLD,
      failureReasons: point.failureReasons,
    };
  });

  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const contractilityLowLeft = requiredLeft(leftParams, "left-heart-contractility-low");
  const contractilityLowRight = requiredRight(rightParams, "right-heart-contractility-low");
  const contractilityLowPoint = best.pointResults.find((point) => point.profileId === "contractility-low");
  if (contractilityLowPoint == null) throw new Error("Missing contractility-low point");

  const acceptedBoundScan = scanContractilityLowTransfer(contractilityLowLeft, contractilityLowRight, {
    scanId: "accepted-bound",
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureBoundMmHg: 2,
    systemicPressureBoundMmHg: 1.5,
    sampleCount: 41,
  });
  const wideScan = scanContractilityLowTransfer(contractilityLowLeft, contractilityLowRight, {
    scanId: "wide-diagnostic",
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureBoundMmHg: 4,
    systemicPressureBoundMmHg: 2,
    sampleCount: 81,
  });
  const wideBestFlowBalanced = wideScan.bestFlowBalanced;
  const classification = wideBestFlowBalanced == null
    ? "profile-severity-mismatch"
    : Math.abs(wideBestFlowBalanced.transferMl) > 50 ? "large-transfer-required" : "inconclusive";

  return {
    reportId: RESERVOIR_SOLVER_ATTRIBUTION_REPORT_ID_V1,
    sourceReportId: RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1,
    bestVariantId: BEST_VARIANT_ID,
    acceptedTransferProfiles,
    acceptedTransferSummary: {
      total: acceptedTransferProfiles.length,
      largeTransferCount: acceptedTransferProfiles.filter((profile) => profile.largeTransfer).length,
      maxAcceptedAbsTransferMl: finiteMaxOrNull(acceptedTransferProfiles.map((profile) =>
        Math.abs(profile.transferMl ?? Number.NaN)
      )),
      maxTransferToForwardRatio: finiteMaxOrNull(acceptedTransferProfiles.map((profile) =>
        profile.transferToForwardRatio ?? Number.NaN
      )),
    },
    contractilityLowAttribution: {
      referenceLeftAovEjectedVolumeMl: contractilityLowPoint.reference.leftAovEjectedVolumeMl,
      referenceRightPvEjectedVolumeMl: contractilityLowPoint.reference.rightPvEjectedVolumeMl,
      acceptedLeftAovEjectedVolumeMl: contractilityLowPoint.accepted?.leftAovEjectedVolumeMl ?? null,
      acceptedRightPvEjectedVolumeMl: contractilityLowPoint.accepted?.rightPvEjectedVolumeMl ?? null,
      acceptedAbsMismatchMl: contractilityLowPoint.accepted?.absMismatchMl ?? null,
      acceptedRelativeMismatch: contractilityLowPoint.accepted?.relativeMismatch ?? null,
      acceptedTransferMl: contractilityLowPoint.accepted?.transferMl ?? null,
      acceptedFailureReasons: contractilityLowPoint.failureReasons,
      scans: [acceptedBoundScan, wideScan],
      classification,
    },
    decision: {
      attributionStatus: "stateful-reservoir-required",
      nextAction: "Do not promote the scalar solver. Build a stateful reservoir/mass-ledger contract and keep contractility-low mismatch plus large transfer magnitude as explicit Gate C blockers.",
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

function scanContractilityLowTransfer(
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  spec: {
    readonly scanId: TransferScanV1["scanId"];
    readonly pulmonaryVenousComplianceMlPerMmHg: number;
    readonly systemicVenousComplianceMlPerMmHg: number;
    readonly pulmonaryPressureBoundMmHg: number;
    readonly systemicPressureBoundMmHg: number;
    readonly sampleCount: number;
  },
): TransferScanV1 {
  const transferBoundMl = Math.min(
    spec.pulmonaryPressureBoundMmHg * spec.pulmonaryVenousComplianceMlPerMmHg,
    spec.systemicPressureBoundMmHg * spec.systemicVenousComplianceMlPerMmHg,
  );
  const candidates: TransferCandidateV1[] = [];
  for (let index = 0; index < spec.sampleCount; index++) {
    const fraction = spec.sampleCount === 1 ? 0.5 : index / (spec.sampleCount - 1);
    const transferMl = -transferBoundMl + fraction * transferBoundMl * 2;
    candidates.push(evaluateTransfer(leftBase, rightBase, {
      transferMl,
      pulmonaryVenousComplianceMlPerMmHg: spec.pulmonaryVenousComplianceMlPerMmHg,
      systemicVenousComplianceMlPerMmHg: spec.systemicVenousComplianceMlPerMmHg,
      pulmonaryPressureBoundMmHg: spec.pulmonaryPressureBoundMmHg,
      systemicPressureBoundMmHg: spec.systemicPressureBoundMmHg,
    }));
  }
  const morphologyPreserving = candidates.filter((candidate) => candidate.morphologyPreserved);
  const flowBalanced = morphologyPreserving.filter((candidate) => candidate.flowBalanced);
  return {
    scanId: spec.scanId,
    transferBoundMl: round(transferBoundMl),
    pulmonaryPressureBoundMmHg: spec.pulmonaryPressureBoundMmHg,
    systemicPressureBoundMmHg: spec.systemicPressureBoundMmHg,
    sampleCount: spec.sampleCount,
    bestMorphologyPreserving: bestByAbsMismatch(morphologyPreserving),
    bestFlowBalanced: bestByAbsMismatch(flowBalanced),
    candidates,
  };
}

function evaluateTransfer(
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  spec: {
    readonly transferMl: number;
    readonly pulmonaryVenousComplianceMlPerMmHg: number;
    readonly systemicVenousComplianceMlPerMmHg: number;
    readonly pulmonaryPressureBoundMmHg: number;
    readonly systemicPressureBoundMmHg: number;
  },
): TransferCandidateV1 {
  const pulmonaryAdjustment = -spec.transferMl / spec.pulmonaryVenousComplianceMlPerMmHg;
  const systemicAdjustment = spec.transferMl / spec.systemicVenousComplianceMlPerMmHg;
  const left = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(
    leftBase,
    leftPulmonaryPressure(leftBase) + pulmonaryAdjustment,
  ));
  const right = runRightHeartStrategicPointV1({
    ...rightBase,
    systemicVenousPressureMmHg: rightBase.systemicVenousPressureMmHg + systemicAdjustment,
  });
  const mismatch = summarizeMismatch(left, right);
  const morphologyPreserved = left.status === "pass" && right.status === "pass";
  const flowBalanced =
    mismatch.absMismatch != null
    && mismatch.relativeMismatch != null
    && (mismatch.absMismatch <= 8 || mismatch.relativeMismatch <= 0.18);
  return {
    transferMl: round(spec.transferMl),
    pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryAdjustment),
    systemicVenousPressureAdjustmentMmHg: round(systemicAdjustment),
    leftAovEjectedVolumeMl: mismatch.leftEjected,
    rightPvEjectedVolumeMl: mismatch.rightEjected,
    signedMismatchMl: mismatch.signedMismatch,
    absMismatchMl: mismatch.absMismatch,
    relativeMismatch: mismatch.relativeMismatch,
    leftStatus: left.status,
    rightStatus: right.status,
    morphologyPreserved,
    flowBalanced,
    pressureAdjustmentBounded:
      Math.abs(pulmonaryAdjustment) <= spec.pulmonaryPressureBoundMmHg + 1e-9
      && Math.abs(systemicAdjustment) <= spec.systemicPressureBoundMmHg + 1e-9,
  };
}

function summarizeMismatch(
  left: LeftHeartDynamicReservePointResultV1,
  right: RightHeartStrategicSmokePointResultV1,
): {
  readonly leftEjected: number | null;
  readonly rightEjected: number | null;
  readonly signedMismatch: number | null;
  readonly absMismatch: number | null;
  readonly relativeMismatch: number | null;
} {
  const leftEjected = left.finalBeat?.aovEjectedVolumeMl ?? null;
  const rightEjected = right.finalBeat?.pvEjectedVolumeMl ?? null;
  if (leftEjected == null || rightEjected == null) {
    return {
      leftEjected,
      rightEjected,
      signedMismatch: null,
      absMismatch: null,
      relativeMismatch: null,
    };
  }
  const signedMismatch = leftEjected - rightEjected;
  const absMismatch = Math.abs(signedMismatch);
  const meanForward = (Math.abs(leftEjected) + Math.abs(rightEjected)) / 2;
  return {
    leftEjected: round(leftEjected),
    rightEjected: round(rightEjected),
    signedMismatch: round(signedMismatch),
    absMismatch: round(absMismatch),
    relativeMismatch: meanForward > 1e-9 ? round(absMismatch / meanForward) : null,
  };
}

function bestByAbsMismatch(candidates: readonly TransferCandidateV1[]): TransferCandidateV1 | null {
  return [...candidates]
    .sort((a, b) => (a.absMismatchMl ?? 1e9) - (b.absMismatchMl ?? 1e9))[0] ?? null;
}

function requiredLeft(
  params: readonly LeftHeartSubsystemParamsV2[],
  fixtureId: string,
): LeftHeartSubsystemParamsV2 {
  const match = params.find((candidate) => candidate.fixtureId === fixtureId);
  if (match == null) throw new Error(`Missing left fixture ${fixtureId}`);
  return match;
}

function requiredRight(
  params: readonly RightHeartSubsystemParamsV2[],
  fixtureId: string,
): RightHeartSubsystemParamsV2 {
  const match = params.find((candidate) => candidate.fixtureId === fixtureId);
  if (match == null) throw new Error(`Missing right fixture ${fixtureId}`);
  return match;
}

function withLeftPulmonaryPressure(
  params: LeftHeartSubsystemParamsV2,
  pressureMmHg: number,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    pulmonaryVenousPressureMmHg: pressureMmHg,
    pulmonaryVenousInitialPressureMmHg: pressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pressureMmHg,
  };
}

function leftPulmonaryPressure(params: LeftHeartSubsystemParamsV2): number {
  return params.pulmonaryVenousBoundaryMode === "fixed-pressure"
    ? params.pulmonaryVenousPressureMmHg
    : params.pulmonaryVenousSourcePressureMmHg;
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function roundOrNull(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : round(value);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

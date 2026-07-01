import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RESERVOIR_BRIDGE_SMOKE_REPORT_ID_V1 =
  "reservoir-bridge-smoke-report-v1" as const;

type ProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "preload-low"
  | "preload-high"
  | "afterload-high"
  | "contractility-low"
  | "contractility-high";

type ReservoirBridgeVariantIdV1 =
  | "open-reservoir-reference"
  | "ledger-high-compliance-gain015"
  | "ledger-high-compliance-gain025"
  | "ledger-high-compliance-gain035"
  | "ledger-balanced-compliance-gain050"
  | "ledger-low-compliance-gain030";

type PairedProfileV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type ReservoirBridgeVariantSpecV1 = {
  readonly variantId: ReservoirBridgeVariantIdV1;
  readonly description: string;
  readonly epochs: number;
  readonly transferGain01: number;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly systemicVenousComplianceMlPerMmHg: number;
  readonly pulmonaryPressureAdjustmentBoundMmHg: number;
  readonly systemicPressureAdjustmentBoundMmHg: number;
};

type ReservoirBridgeEpochV1 = {
  readonly epoch: number;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly totalReservoirVolumeResidualMl: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly systemicVenousPressureMmHg: number;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
};

export type ReservoirBridgeSmokePointResultV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly reference: {
    readonly leftAovEjectedVolumeMl: number | null;
    readonly rightPvEjectedVolumeMl: number | null;
    readonly signedMismatchMl: number | null;
    readonly absMismatchMl: number | null;
    readonly relativeMismatch: number | null;
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"] | "missing";
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"] | "missing";
  };
  readonly bridge: {
    readonly leftAovEjectedVolumeMl: number | null;
    readonly rightPvEjectedVolumeMl: number | null;
    readonly signedMismatchMl: number | null;
    readonly absMismatchMl: number | null;
    readonly relativeMismatch: number | null;
    readonly pulmonaryVenousReservoirVolumeMl: number;
    readonly systemicVenousReservoirVolumeMl: number;
    readonly totalReservoirVolumeResidualMl: number;
    readonly pulmonaryVenousPressureMmHg: number;
    readonly systemicVenousPressureMmHg: number;
    readonly pulmonaryVenousPressureAdjustmentMmHg: number;
    readonly systemicVenousPressureAdjustmentMmHg: number;
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"] | "missing";
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"] | "missing";
    readonly leftFailureReasons: readonly string[];
    readonly rightFailureReasons: readonly string[];
    readonly leftAcceptedPhenotypeReasons: readonly string[];
    readonly rightAcceptedPhenotypeReasons: readonly string[];
  };
  readonly classifications: {
    readonly leftMorphologyPreserved: boolean;
    readonly rightMorphologyPreserved: boolean;
    readonly morphologyPreserved: boolean;
    readonly flowBalanced: boolean;
    readonly mismatchImproved: boolean;
    readonly pressureAdjustmentBounded: boolean;
    readonly reservoirLedgerClean: boolean;
    readonly cleanBridgePoint: boolean;
  };
  readonly epochHistory: readonly ReservoirBridgeEpochV1[];
  readonly failureReasons: readonly string[];
};

export type ReservoirBridgeSmokeVariantResultV1 = {
  readonly variantId: ReservoirBridgeVariantIdV1;
  readonly description: string;
  readonly intervention: Omit<ReservoirBridgeVariantSpecV1, "variantId" | "description">;
  readonly pointResults: readonly ReservoirBridgeSmokePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly morphologyPreservedCount: number;
    readonly flowBalancedCount: number;
    readonly mismatchImprovedCount: number;
    readonly pressureAdjustmentBoundedCount: number;
    readonly reservoirLedgerCleanCount: number;
    readonly meanReferenceAbsMismatchMl: number | null;
    readonly meanBridgeAbsMismatchMl: number | null;
    readonly maxBridgeAbsMismatchMl: number | null;
    readonly meanAbsMismatchImprovementMl: number | null;
    readonly maxTotalReservoirVolumeResidualMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicVenousPressureAdjustmentMmHg: number | null;
  };
};

export type ReservoirBridgeSmokeReportV1 = {
  readonly reportId: typeof RESERVOIR_BRIDGE_SMOKE_REPORT_ID_V1;
  readonly gateId: "reservoirBridgeSmokeGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: "right-heart-strategic-smoke-report-v1";
  };
  readonly variantResults: readonly ReservoirBridgeSmokeVariantResultV1[];
  readonly decision: {
    readonly reservoirBridgeStatus: "reservoir-bridge-pass" | "promising-mixed-signal" | "no-go";
    readonly bestVariantId: ReservoirBridgeVariantIdV1;
    readonly bestPassCount: number;
    readonly referenceMeanAbsMismatchMl: number | null;
    readonly bestMeanAbsMismatchMl: number | null;
    readonly remainingBlockers: readonly string[];
    readonly nextAction: string;
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

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const PROFILES: readonly PairedProfileV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const VARIANTS: readonly ReservoirBridgeVariantSpecV1[] = [
  {
    variantId: "open-reservoir-reference",
    description: "No reservoir transfer; records the open-boundary paired mismatch.",
    epochs: 0,
    transferGain01: 0,
    pulmonaryVenousComplianceMlPerMmHg: 24,
    systemicVenousComplianceMlPerMmHg: 42,
    pulmonaryPressureAdjustmentBoundMmHg: 0,
    systemicPressureAdjustmentBoundMmHg: 0,
  },
  {
    variantId: "ledger-high-compliance-gain015",
    description: "Very conservative reservoir ledger to test morphology-preserving mass feedback.",
    epochs: 6,
    transferGain01: 0.15,
    pulmonaryVenousComplianceMlPerMmHg: 32,
    systemicVenousComplianceMlPerMmHg: 64,
    pulmonaryPressureAdjustmentBoundMmHg: 3,
    systemicPressureAdjustmentBoundMmHg: 2.5,
  },
  {
    variantId: "ledger-high-compliance-gain025",
    description: "Conservative reservoir ledger between the reference and gain035 surface.",
    epochs: 6,
    transferGain01: 0.25,
    pulmonaryVenousComplianceMlPerMmHg: 30,
    systemicVenousComplianceMlPerMmHg: 60,
    pulmonaryPressureAdjustmentBoundMmHg: 3.8,
    systemicPressureAdjustmentBoundMmHg: 3,
  },
  {
    variantId: "ledger-high-compliance-gain035",
    description: "Conservative reservoir ledger: high compliance and partial beat-to-beat transfer.",
    epochs: 6,
    transferGain01: 0.35,
    pulmonaryVenousComplianceMlPerMmHg: 28,
    systemicVenousComplianceMlPerMmHg: 56,
    pulmonaryPressureAdjustmentBoundMmHg: 4.5,
    systemicPressureAdjustmentBoundMmHg: 3.5,
  },
  {
    variantId: "ledger-balanced-compliance-gain050",
    description: "Balanced reservoir ledger with moderate compliance and transfer.",
    epochs: 6,
    transferGain01: 0.50,
    pulmonaryVenousComplianceMlPerMmHg: 22,
    systemicVenousComplianceMlPerMmHg: 40,
    pulmonaryPressureAdjustmentBoundMmHg: 6,
    systemicPressureAdjustmentBoundMmHg: 4.5,
  },
  {
    variantId: "ledger-low-compliance-gain030",
    description: "Lower-compliance reservoir ledger to test stronger pressure response without direct source-pressure feedback.",
    epochs: 6,
    transferGain01: 0.30,
    pulmonaryVenousComplianceMlPerMmHg: 14,
    systemicVenousComplianceMlPerMmHg: 28,
    pulmonaryPressureAdjustmentBoundMmHg: 7,
    systemicPressureAdjustmentBoundMmHg: 5,
  },
];

export function runReservoirBridgeSmokeBenchV1(): ReservoirBridgeSmokeReportV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const variants = VARIANTS.map((variant) => runVariant(variant, leftParams, rightParams));
  const reference = requiredVariant(variants, "open-reservoir-reference");
  const best = [...variants].filter((variant) => variant.variantId !== "open-reservoir-reference")
    .sort((a, b) =>
      b.summary.pass - a.summary.pass
      || b.summary.morphologyPreservedCount - a.summary.morphologyPreservedCount
      || b.summary.flowBalancedCount - a.summary.flowBalancedCount
      || b.summary.mismatchImprovedCount - a.summary.mismatchImprovedCount
      || (a.summary.meanBridgeAbsMismatchMl ?? 1e9) - (b.summary.meanBridgeAbsMismatchMl ?? 1e9),
    )[0] ?? reference;
  const narrowMixedSignal =
    best.summary.pass >= 6
    && best.summary.flowBalancedCount >= 6
    && best.summary.pressureAdjustmentBoundedCount === best.summary.total
    && best.summary.reservoirLedgerCleanCount === best.summary.total;
  const broadMixedSignal =
    best.summary.morphologyPreservedCount === best.summary.total
    && best.summary.flowBalancedCount >= 6
    && best.summary.mismatchImprovedCount >= 5;
  const reservoirBridgeStatus = best.summary.pass === best.summary.total
    ? "reservoir-bridge-pass"
    : narrowMixedSignal || broadMixedSignal ? "promising-mixed-signal" : "no-go";
  return {
    reportId: RESERVOIR_BRIDGE_SMOKE_REPORT_ID_V1,
    gateId: "reservoirBridgeSmokeGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId: "right-heart-strategic-smoke-report-v1",
    },
    variantResults: variants,
    decision: {
      reservoirBridgeStatus,
      bestVariantId: best.variantId,
      bestPassCount: best.summary.pass,
      referenceMeanAbsMismatchMl: reference.summary.meanReferenceAbsMismatchMl,
      bestMeanAbsMismatchMl: best.summary.meanBridgeAbsMismatchMl,
      remainingBlockers: best.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.profileId}: ${point.failureReasons.join(",")}`),
      nextAction: reservoirBridgeStatus === "reservoir-bridge-pass"
        ? "Use this reservoir ledger as the next MechanicsCore2 four-chamber bridge scaffold; still do not unlock runtime, AV-plane, or LandAtrial."
        : reservoirBridgeStatus === "promising-mixed-signal"
          ? "Continue reservoir/mass-ledger bridge work and add true same-step coupling before four-chamber, AV-plane, or LandAtrial work."
          : "Do not proceed to four-chamber, AV-plane, or LandAtrial. The reservoir bridge does not yet preserve morphology and flow balance across the envelope.",
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

function runVariant(
  variant: ReservoirBridgeVariantSpecV1,
  leftParams: readonly LeftHeartSubsystemParamsV2[],
  rightParams: readonly RightHeartSubsystemParamsV2[],
): ReservoirBridgeSmokeVariantResultV1 {
  const pointResults = PROFILES.map((profile) => {
    const left = leftParams.find((params) => params.fixtureId === profile.leftPointId);
    const right = rightParams.find((params) => params.fixtureId === profile.rightPointId);
    return left == null || right == null
      ? missingPoint(profile, left, right)
      : runPoint(profile, left, right, variant);
  });
  return {
    variantId: variant.variantId,
    description: variant.description,
    intervention: {
      epochs: variant.epochs,
      transferGain01: variant.transferGain01,
      pulmonaryVenousComplianceMlPerMmHg: variant.pulmonaryVenousComplianceMlPerMmHg,
      systemicVenousComplianceMlPerMmHg: variant.systemicVenousComplianceMlPerMmHg,
      pulmonaryPressureAdjustmentBoundMmHg: variant.pulmonaryPressureAdjustmentBoundMmHg,
      systemicPressureAdjustmentBoundMmHg: variant.systemicPressureAdjustmentBoundMmHg,
    },
    pointResults,
    summary: summarizeVariant(pointResults),
  };
}

function runPoint(
  profile: PairedProfileV1,
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  variant: ReservoirBridgeVariantSpecV1,
): ReservoirBridgeSmokePointResultV1 {
  const referenceLeft = runLeftHeartDynamicReservePointV1(leftBase);
  const referenceRight = runRightHeartStrategicPointV1(rightBase);
  const leftBasePressure = leftPulmonaryPressure(leftBase);
  const rightBasePressure = rightBase.systemicVenousPressureMmHg;
  let pulmonaryVenousReservoirVolumeMl = 0;
  let systemicVenousReservoirVolumeMl = 0;
  let bridgeLeft = referenceLeft;
  let bridgeRight = referenceRight;
  const epochHistory: ReservoirBridgeEpochV1[] = [];
  for (let epoch = 0; epoch <= variant.epochs; epoch++) {
    const pulmonaryPressure = leftBasePressure
      + pulmonaryVenousReservoirVolumeMl / Math.max(variant.pulmonaryVenousComplianceMlPerMmHg, 1e-9);
    const systemicPressure = rightBasePressure
      + systemicVenousReservoirVolumeMl / Math.max(variant.systemicVenousComplianceMlPerMmHg, 1e-9);
    bridgeLeft = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(leftBase, pulmonaryPressure));
    bridgeRight = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(rightBase, systemicPressure));
    const mismatch = summarizeMismatch(bridgeLeft, bridgeRight);
    epochHistory.push({
      epoch,
      pulmonaryVenousReservoirVolumeMl: round(pulmonaryVenousReservoirVolumeMl),
      systemicVenousReservoirVolumeMl: round(systemicVenousReservoirVolumeMl),
      totalReservoirVolumeResidualMl: round(pulmonaryVenousReservoirVolumeMl + systemicVenousReservoirVolumeMl),
      pulmonaryVenousPressureMmHg: round(pulmonaryPressure),
      systemicVenousPressureMmHg: round(systemicPressure),
      leftAovEjectedVolumeMl: mismatch.leftEjected,
      rightPvEjectedVolumeMl: mismatch.rightEjected,
      signedMismatchMl: mismatch.signedMismatch,
      absMismatchMl: mismatch.absMismatch,
      relativeMismatch: mismatch.relativeMismatch,
      leftStatus: bridgeLeft.status,
      rightStatus: bridgeRight.status,
    });
    if (epoch === variant.epochs || mismatch.signedMismatch == null) break;
    const transferMl = mismatch.signedMismatch * variant.transferGain01;
    systemicVenousReservoirVolumeMl += transferMl;
    pulmonaryVenousReservoirVolumeMl -= transferMl;
  }
  const reference = summarizeMismatch(referenceLeft, referenceRight);
  const bridge = summarizeMismatch(bridgeLeft, bridgeRight);
  const finalEpoch = epochHistory.at(-1)!;
  const pulmonaryAdjustment = finalEpoch.pulmonaryVenousPressureMmHg - leftBasePressure;
  const systemicAdjustment = finalEpoch.systemicVenousPressureMmHg - rightBasePressure;
  const classifications = classifyPoint({
    reference,
    bridge,
    bridgeLeft,
    bridgeRight,
    finalEpoch,
    pulmonaryAdjustment,
    systemicAdjustment,
    variant,
  });
  const failureReasons = failureReasonsFor(classifications);
  return {
    profileId: profile.profileId,
    leftPointId: profile.leftPointId,
    rightPointId: profile.rightPointId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    reference: {
      leftAovEjectedVolumeMl: reference.leftEjected,
      rightPvEjectedVolumeMl: reference.rightEjected,
      signedMismatchMl: reference.signedMismatch,
      absMismatchMl: reference.absMismatch,
      relativeMismatch: reference.relativeMismatch,
      leftStatus: referenceLeft.status,
      rightStatus: referenceRight.status,
    },
    bridge: {
      leftAovEjectedVolumeMl: bridge.leftEjected,
      rightPvEjectedVolumeMl: bridge.rightEjected,
      signedMismatchMl: bridge.signedMismatch,
      absMismatchMl: bridge.absMismatch,
      relativeMismatch: bridge.relativeMismatch,
      pulmonaryVenousReservoirVolumeMl: finalEpoch.pulmonaryVenousReservoirVolumeMl,
      systemicVenousReservoirVolumeMl: finalEpoch.systemicVenousReservoirVolumeMl,
      totalReservoirVolumeResidualMl: finalEpoch.totalReservoirVolumeResidualMl,
      pulmonaryVenousPressureMmHg: finalEpoch.pulmonaryVenousPressureMmHg,
      systemicVenousPressureMmHg: finalEpoch.systemicVenousPressureMmHg,
      pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryAdjustment),
      systemicVenousPressureAdjustmentMmHg: round(systemicAdjustment),
      leftStatus: bridgeLeft.status,
      rightStatus: bridgeRight.status,
      leftFailureReasons: bridgeLeft.failureReasons,
      rightFailureReasons: bridgeRight.failureReasons,
      leftAcceptedPhenotypeReasons: bridgeLeft.acceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: bridgeRight.acceptedPhenotypeReasons,
    },
    classifications,
    epochHistory,
    failureReasons,
  };
}

function classifyPoint(input: {
  readonly reference: ReturnType<typeof summarizeMismatch>;
  readonly bridge: ReturnType<typeof summarizeMismatch>;
  readonly bridgeLeft: LeftHeartDynamicReservePointResultV1;
  readonly bridgeRight: RightHeartStrategicSmokePointResultV1;
  readonly finalEpoch: ReservoirBridgeEpochV1;
  readonly pulmonaryAdjustment: number;
  readonly systemicAdjustment: number;
  readonly variant: ReservoirBridgeVariantSpecV1;
}): ReservoirBridgeSmokePointResultV1["classifications"] {
  const leftMorphologyPreserved = input.bridgeLeft.status === "pass";
  const rightMorphologyPreserved = input.bridgeRight.status === "pass";
  const morphologyPreserved = leftMorphologyPreserved && rightMorphologyPreserved;
  const flowBalanced =
    input.bridge.absMismatch != null
    && input.bridge.relativeMismatch != null
    && (input.bridge.absMismatch <= 8 || input.bridge.relativeMismatch <= 0.18);
  const mismatchImproved =
    input.variant.variantId === "open-reservoir-reference"
      ? false
      : input.reference.absMismatch != null
        && input.bridge.absMismatch != null
        && input.bridge.absMismatch < input.reference.absMismatch - 0.5;
  const pressureAdjustmentBounded =
    Math.abs(input.pulmonaryAdjustment) <= input.variant.pulmonaryPressureAdjustmentBoundMmHg + 1e-9
    && Math.abs(input.systemicAdjustment) <= input.variant.systemicPressureAdjustmentBoundMmHg + 1e-9;
  const reservoirLedgerClean = Math.abs(input.finalEpoch.totalReservoirVolumeResidualMl) <= 1e-6;
  return {
    leftMorphologyPreserved,
    rightMorphologyPreserved,
    morphologyPreserved,
    flowBalanced,
    mismatchImproved,
    pressureAdjustmentBounded,
    reservoirLedgerClean,
    cleanBridgePoint: morphologyPreserved && flowBalanced && pressureAdjustmentBounded && reservoirLedgerClean,
  };
}

function failureReasonsFor(
  classifications: ReservoirBridgeSmokePointResultV1["classifications"],
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.leftMorphologyPreserved) failures.push("left-surface-not-preserved");
  if (!classifications.rightMorphologyPreserved) failures.push("right-surface-not-preserved");
  if (!classifications.flowBalanced) failures.push("left-right-forward-ejection-mismatch");
  if (!classifications.pressureAdjustmentBounded) failures.push("reservoir-pressure-adjustment-unbounded");
  if (!classifications.reservoirLedgerClean) failures.push("reservoir-ledger-residual");
  return failures;
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

function summarizeVariant(
  pointResults: readonly ReservoirBridgeSmokePointResultV1[],
): ReservoirBridgeSmokeVariantResultV1["summary"] {
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    morphologyPreservedCount: pointResults.filter((point) => point.classifications.morphologyPreserved).length,
    flowBalancedCount: pointResults.filter((point) => point.classifications.flowBalanced).length,
    mismatchImprovedCount: pointResults.filter((point) => point.classifications.mismatchImproved).length,
    pressureAdjustmentBoundedCount: pointResults.filter((point) => point.classifications.pressureAdjustmentBounded).length,
    reservoirLedgerCleanCount: pointResults.filter((point) => point.classifications.reservoirLedgerClean).length,
    meanReferenceAbsMismatchMl: finiteMeanOrNull(pointResults.map((point) => point.reference.absMismatchMl ?? Number.NaN)),
    meanBridgeAbsMismatchMl: finiteMeanOrNull(pointResults.map((point) => point.bridge.absMismatchMl ?? Number.NaN)),
    maxBridgeAbsMismatchMl: finiteMaxOrNull(pointResults.map((point) => point.bridge.absMismatchMl ?? Number.NaN)),
    meanAbsMismatchImprovementMl: finiteMeanOrNull(pointResults.map((point) => {
      const reference = point.reference.absMismatchMl;
      const bridge = point.bridge.absMismatchMl;
      return reference != null && bridge != null ? reference - bridge : Number.NaN;
    })),
    maxTotalReservoirVolumeResidualMl: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.bridge.totalReservoirVolumeResidualMl)
    )),
    maxPulmonaryVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.bridge.pulmonaryVenousPressureAdjustmentMmHg)
    )),
    maxSystemicVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.bridge.systemicVenousPressureAdjustmentMmHg)
    )),
  };
}

function missingPoint(
  profile: PairedProfileV1,
  left: LeftHeartSubsystemParamsV2 | undefined,
  right: RightHeartSubsystemParamsV2 | undefined,
): ReservoirBridgeSmokePointResultV1 {
  return {
    profileId: profile.profileId,
    leftPointId: profile.leftPointId,
    rightPointId: profile.rightPointId,
    status: "inconclusive",
    reference: {
      leftAovEjectedVolumeMl: null,
      rightPvEjectedVolumeMl: null,
      signedMismatchMl: null,
      absMismatchMl: null,
      relativeMismatch: null,
      leftStatus: left == null ? "missing" : "inconclusive",
      rightStatus: right == null ? "missing" : "inconclusive",
    },
    bridge: {
      leftAovEjectedVolumeMl: null,
      rightPvEjectedVolumeMl: null,
      signedMismatchMl: null,
      absMismatchMl: null,
      relativeMismatch: null,
      pulmonaryVenousReservoirVolumeMl: 0,
      systemicVenousReservoirVolumeMl: 0,
      totalReservoirVolumeResidualMl: 0,
      pulmonaryVenousPressureMmHg: left != null ? leftPulmonaryPressure(left) : Number.NaN,
      systemicVenousPressureMmHg: right?.systemicVenousPressureMmHg ?? Number.NaN,
      pulmonaryVenousPressureAdjustmentMmHg: 0,
      systemicVenousPressureAdjustmentMmHg: 0,
      leftStatus: left == null ? "missing" : "inconclusive",
      rightStatus: right == null ? "missing" : "inconclusive",
      leftFailureReasons: left == null ? ["missing-left-point"] : [],
      rightFailureReasons: right == null ? ["missing-right-point"] : [],
      leftAcceptedPhenotypeReasons: [],
      rightAcceptedPhenotypeReasons: [],
    },
    classifications: {
      leftMorphologyPreserved: false,
      rightMorphologyPreserved: false,
      morphologyPreserved: false,
      flowBalanced: false,
      mismatchImproved: false,
      pressureAdjustmentBounded: false,
      reservoirLedgerClean: false,
      cleanBridgePoint: false,
    },
    epochHistory: [],
    failureReasons: [
      ...(left == null ? ["missing-left-point"] : []),
      ...(right == null ? ["missing-right-point"] : []),
    ],
  };
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

function withRightSystemicVenousPressure(
  params: RightHeartSubsystemParamsV2,
  pressureMmHg: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...params,
    systemicVenousPressureMmHg: pressureMmHg,
  };
}

function leftPulmonaryPressure(params: LeftHeartSubsystemParamsV2): number {
  return params.pulmonaryVenousBoundaryMode === "fixed-pressure"
    ? params.pulmonaryVenousPressureMmHg
    : params.pulmonaryVenousSourcePressureMmHg;
}

function requiredVariant(
  variants: readonly ReservoirBridgeSmokeVariantResultV1[],
  variantId: ReservoirBridgeVariantIdV1,
): ReservoirBridgeSmokeVariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing reservoir bridge variant ${variantId}`);
  return variant;
}

function finiteMeanOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

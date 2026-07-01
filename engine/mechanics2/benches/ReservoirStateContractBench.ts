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

export const RESERVOIR_STATE_CONTRACT_REPORT_ID_V1 =
  "reservoir-state-contract-report-v1" as const;

type ProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "preload-low"
  | "preload-high"
  | "afterload-high"
  | "contractility-low"
  | "contractility-high";

type ReservoirStateVariantIdV1 = string;

type PairedProfileV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

export type ReservoirStateVariantSpecV1 = {
  readonly variantId: ReservoirStateVariantIdV1;
  readonly description: string;
  readonly epochs: number;
  readonly transferGain01: number;
  readonly maxTransferPerEpochMl: number;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly systemicVenousComplianceMlPerMmHg: number;
  readonly pulmonaryPressureAdjustmentBoundMmHg: number;
  readonly systemicPressureAdjustmentBoundMmHg: number;
  readonly persistentReservoirVolumeBoundMl: number;
  readonly repeatabilityMismatchDeltaMl: number;
  readonly repeatabilityReservoirStepMl: number;
};

type ReservoirStateEpochV1 = {
  readonly epoch: number;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly totalReservoirVolumeResidualMl: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly systemicVenousPressureMmHg: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicVenousPressureAdjustmentMmHg: number;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly proposedTransferMl: number | null;
  readonly acceptedTransferMl: number | null;
  readonly transferLimiterActive: boolean;
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
};

export type ReservoirStateContractPointResultV1 = {
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
  readonly finalState: {
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
    readonly systemicPressureAdjustmentMmHg: number;
    readonly finalAcceptedTransferMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number;
    readonly finalReservoirStepMl: number | null;
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
    readonly perEpochTransferBounded: boolean;
    readonly persistentReservoirBounded: boolean;
    readonly repeatableFinalState: boolean;
    readonly cleanGateCPoint: boolean;
  };
  readonly epochHistory: readonly ReservoirStateEpochV1[];
  readonly failureReasons: readonly string[];
};

export type ReservoirStateContractVariantResultV1 = {
  readonly variantId: ReservoirStateVariantIdV1;
  readonly description: string;
  readonly intervention: Omit<ReservoirStateVariantSpecV1, "variantId" | "description">;
  readonly pointResults: readonly ReservoirStateContractPointResultV1[];
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
    readonly perEpochTransferBoundedCount: number;
    readonly persistentReservoirBoundedCount: number;
    readonly repeatableFinalStateCount: number;
    readonly meanReferenceAbsMismatchMl: number | null;
    readonly meanFinalAbsMismatchMl: number | null;
    readonly maxFinalAbsMismatchMl: number | null;
    readonly meanAbsMismatchImprovementMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxTotalReservoirVolumeResidualMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicPressureAdjustmentMmHg: number | null;
  };
};

export type ReservoirStateContractReportV1 = {
  readonly reportId: typeof RESERVOIR_STATE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "reservoirStateContractGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: string;
  };
  readonly variantResults: readonly ReservoirStateContractVariantResultV1[];
  readonly decision: {
    readonly reservoirStateStatus: "stateful-reservoir-pass" | "stateful-reservoir-mixed-signal" | "no-go";
    readonly bestVariantId: ReservoirStateVariantIdV1;
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

const VARIANTS: readonly ReservoirStateVariantSpecV1[] = [
  {
    variantId: "open-reservoir-reference",
    description: "No stateful reservoir transfer; records the open-boundary paired mismatch.",
    epochs: 1,
    transferGain01: 0,
    maxTransferPerEpochMl: 0,
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureAdjustmentBoundMmHg: 0,
    systemicPressureAdjustmentBoundMmHg: 0,
    persistentReservoirVolumeBoundMl: 0,
    repeatabilityMismatchDeltaMl: 0,
    repeatabilityReservoirStepMl: 0,
  },
  {
    variantId: "stateful-high-compliance-cap6-gain018",
    description: "Explicit reservoir volume state with conservative transfer cap and high venous compliance.",
    epochs: 10,
    transferGain01: 0.18,
    maxTransferPerEpochMl: 6,
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureAdjustmentBoundMmHg: 2,
    systemicPressureAdjustmentBoundMmHg: 1.5,
    persistentReservoirVolumeBoundMl: 45,
    repeatabilityMismatchDeltaMl: 1.5,
    repeatabilityReservoirStepMl: 6,
  },
  {
    variantId: "stateful-high-compliance-cap6-gain018-epochs18",
    description: "Longer conservative stateful reservoir run to separate slow convergence from persistent shuttle.",
    epochs: 18,
    transferGain01: 0.18,
    maxTransferPerEpochMl: 6,
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureAdjustmentBoundMmHg: 2,
    systemicPressureAdjustmentBoundMmHg: 1.5,
    persistentReservoirVolumeBoundMl: 45,
    repeatabilityMismatchDeltaMl: 1.5,
    repeatabilityReservoirStepMl: 6,
  },
  {
    variantId: "stateful-high-compliance-cap10-gain025",
    description: "Explicit reservoir volume state near the scalar-solver compliance but with per-epoch transfer ownership.",
    epochs: 10,
    transferGain01: 0.25,
    maxTransferPerEpochMl: 10,
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureAdjustmentBoundMmHg: 2,
    systemicPressureAdjustmentBoundMmHg: 1.5,
    persistentReservoirVolumeBoundMl: 45,
    repeatabilityMismatchDeltaMl: 1.5,
    repeatabilityReservoirStepMl: 8,
  },
  {
    variantId: "stateful-balanced-compliance-cap14-gain030",
    description: "Balanced compliance reservoir state with stronger transfer to test convergence versus shuttle size.",
    epochs: 10,
    transferGain01: 0.30,
    maxTransferPerEpochMl: 14,
    pulmonaryVenousComplianceMlPerMmHg: 28,
    systemicVenousComplianceMlPerMmHg: 56,
    pulmonaryPressureAdjustmentBoundMmHg: 3,
    systemicPressureAdjustmentBoundMmHg: 2.2,
    persistentReservoirVolumeBoundMl: 45,
    repeatabilityMismatchDeltaMl: 1.5,
    repeatabilityReservoirStepMl: 10,
  },
  {
    variantId: "stateful-wide-compliance-cap20-gain025",
    description: "Wider pressure-bound diagnostic reservoir state; not promotable if it needs persistent large shuttles.",
    epochs: 10,
    transferGain01: 0.25,
    maxTransferPerEpochMl: 20,
    pulmonaryVenousComplianceMlPerMmHg: 30,
    systemicVenousComplianceMlPerMmHg: 60,
    pulmonaryPressureAdjustmentBoundMmHg: 3.8,
    systemicPressureAdjustmentBoundMmHg: 3,
    persistentReservoirVolumeBoundMl: 55,
    repeatabilityMismatchDeltaMl: 1.5,
    repeatabilityReservoirStepMl: 12,
  },
];

export function runReservoirStateContractBenchV1(): ReservoirStateContractReportV1 {
  return runReservoirStateContractBenchWithRightParamsV1(
    buildRightHeartStrategicEnvelopeV1(),
    "right-heart-strategic-smoke-report-v1",
  );
}

export function runReservoirStateContractBenchWithRightParamsV1(
  rightParams: readonly RightHeartSubsystemParamsV2[],
  rightReportId: string,
): ReservoirStateContractReportV1 {
  return runReservoirStateContractBenchWithRightParamsAndVariantsV1(rightParams, rightReportId, VARIANTS);
}

export function runReservoirStateContractBenchWithRightParamsAndVariantsV1(
  rightParams: readonly RightHeartSubsystemParamsV2[],
  rightReportId: string,
  variants: readonly ReservoirStateVariantSpecV1[],
): ReservoirStateContractReportV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const variantResults = variants.map((variant) => runVariant(variant, leftParams, rightParams));
  const reference = requiredVariant(variantResults, "open-reservoir-reference");
  const best = [...variantResults].filter((variant) => variant.variantId !== "open-reservoir-reference")
    .sort((a, b) =>
      b.summary.pass - a.summary.pass
      || b.summary.morphologyPreservedCount - a.summary.morphologyPreservedCount
      || b.summary.flowBalancedCount - a.summary.flowBalancedCount
      || b.summary.persistentReservoirBoundedCount - a.summary.persistentReservoirBoundedCount
      || b.summary.repeatableFinalStateCount - a.summary.repeatableFinalStateCount
      || (a.summary.meanFinalAbsMismatchMl ?? 1e9) - (b.summary.meanFinalAbsMismatchMl ?? 1e9),
    )[0] ?? reference;
  const mixedSignal =
    best.summary.morphologyPreservedCount === best.summary.total
    && best.summary.reservoirLedgerCleanCount === best.summary.total
    && best.summary.pressureAdjustmentBoundedCount === best.summary.total
    && best.summary.flowBalancedCount >= 5
    && (best.summary.meanFinalAbsMismatchMl ?? 1e9) < (reference.summary.meanReferenceAbsMismatchMl ?? 0);
  const reservoirStateStatus = best.summary.pass === best.summary.total
    ? "stateful-reservoir-pass"
    : mixedSignal ? "stateful-reservoir-mixed-signal" : "no-go";
  return {
    reportId: RESERVOIR_STATE_CONTRACT_REPORT_ID_V1,
    gateId: "reservoirStateContractGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId,
    },
    variantResults,
    decision: {
      reservoirStateStatus,
      bestVariantId: best.variantId,
      bestPassCount: best.summary.pass,
      referenceMeanAbsMismatchMl: reference.summary.meanReferenceAbsMismatchMl,
      bestMeanAbsMismatchMl: best.summary.meanFinalAbsMismatchMl,
      remainingBlockers: best.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.profileId}: ${point.failureReasons.join(",")}`),
      nextAction: reservoirStateStatus === "stateful-reservoir-pass"
        ? "Use this stateful reservoir contract as the next MechanicsCore2 Gate C scaffold; still do not unlock runtime, AV-plane, or LandAtrial."
        : reservoirStateStatus === "stateful-reservoir-mixed-signal"
          ? "Continue stateful reservoir/mass-ledger work and classify persistent transfer or low-contractility mismatch before four-chamber, AV-plane, or LandAtrial work."
          : "Do not proceed to four-chamber, AV-plane, or LandAtrial. The stateful reservoir contract does not yet preserve morphology, flow balance, and bounded reservoir state across the envelope.",
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
  variant: ReservoirStateVariantSpecV1,
  leftParams: readonly LeftHeartSubsystemParamsV2[],
  rightParams: readonly RightHeartSubsystemParamsV2[],
): ReservoirStateContractVariantResultV1 {
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
      maxTransferPerEpochMl: variant.maxTransferPerEpochMl,
      pulmonaryVenousComplianceMlPerMmHg: variant.pulmonaryVenousComplianceMlPerMmHg,
      systemicVenousComplianceMlPerMmHg: variant.systemicVenousComplianceMlPerMmHg,
      pulmonaryPressureAdjustmentBoundMmHg: variant.pulmonaryPressureAdjustmentBoundMmHg,
      systemicPressureAdjustmentBoundMmHg: variant.systemicPressureAdjustmentBoundMmHg,
      persistentReservoirVolumeBoundMl: variant.persistentReservoirVolumeBoundMl,
      repeatabilityMismatchDeltaMl: variant.repeatabilityMismatchDeltaMl,
      repeatabilityReservoirStepMl: variant.repeatabilityReservoirStepMl,
    },
    pointResults,
    summary: summarizeVariant(pointResults),
  };
}

function runPoint(
  profile: PairedProfileV1,
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  variant: ReservoirStateVariantSpecV1,
): ReservoirStateContractPointResultV1 {
  const referenceLeft = runLeftHeartDynamicReservePointV1(leftBase);
  const referenceRight = runRightHeartStrategicPointV1(rightBase);
  const reference = summarizeMismatch(referenceLeft, referenceRight);
  const leftBasePressure = leftPulmonaryPressure(leftBase);
  const rightBasePressure = rightBase.systemicVenousPressureMmHg;
  let pulmonaryVenousReservoirVolumeMl = 0;
  let systemicVenousReservoirVolumeMl = 0;
  let finalLeft = referenceLeft;
  let finalRight = referenceRight;
  const epochHistory: ReservoirStateEpochV1[] = [];

  for (let epoch = 0; epoch < variant.epochs; epoch++) {
    const pulmonaryPressure = leftBasePressure
      + pulmonaryVenousReservoirVolumeMl / Math.max(variant.pulmonaryVenousComplianceMlPerMmHg, 1e-9);
    const systemicPressure = rightBasePressure
      + systemicVenousReservoirVolumeMl / Math.max(variant.systemicVenousComplianceMlPerMmHg, 1e-9);
    finalLeft = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(leftBase, pulmonaryPressure));
    finalRight = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(rightBase, systemicPressure));
    const mismatch = summarizeMismatch(finalLeft, finalRight);
    const proposedTransfer = mismatch.signedMismatch == null
      ? null
      : mismatch.signedMismatch * variant.transferGain01;
    const acceptedTransfer = proposedTransfer == null
      ? null
      : clamp(proposedTransfer, -variant.maxTransferPerEpochMl, variant.maxTransferPerEpochMl);
    epochHistory.push({
      epoch,
      pulmonaryVenousReservoirVolumeMl: round(pulmonaryVenousReservoirVolumeMl),
      systemicVenousReservoirVolumeMl: round(systemicVenousReservoirVolumeMl),
      totalReservoirVolumeResidualMl: round(pulmonaryVenousReservoirVolumeMl + systemicVenousReservoirVolumeMl),
      pulmonaryVenousPressureMmHg: round(pulmonaryPressure),
      systemicVenousPressureMmHg: round(systemicPressure),
      pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryPressure - leftBasePressure),
      systemicVenousPressureAdjustmentMmHg: round(systemicPressure - rightBasePressure),
      leftAovEjectedVolumeMl: mismatch.leftEjected,
      rightPvEjectedVolumeMl: mismatch.rightEjected,
      signedMismatchMl: mismatch.signedMismatch,
      absMismatchMl: mismatch.absMismatch,
      relativeMismatch: mismatch.relativeMismatch,
      proposedTransferMl: roundOrNull(proposedTransfer),
      acceptedTransferMl: roundOrNull(acceptedTransfer),
      transferLimiterActive: proposedTransfer != null && acceptedTransfer != null
        && Math.abs(proposedTransfer - acceptedTransfer) > 1e-9,
      leftStatus: finalLeft.status,
      rightStatus: finalRight.status,
    });
    if (acceptedTransfer == null) break;
    systemicVenousReservoirVolumeMl += acceptedTransfer;
    pulmonaryVenousReservoirVolumeMl -= acceptedTransfer;
  }

  const finalEpoch = epochHistory.at(-1);
  if (finalEpoch == null) return missingPoint(profile, leftBase, rightBase);
  const final = {
    leftEjected: finalEpoch.leftAovEjectedVolumeMl,
    rightEjected: finalEpoch.rightPvEjectedVolumeMl,
    signedMismatch: finalEpoch.signedMismatchMl,
    absMismatch: finalEpoch.absMismatchMl,
    relativeMismatch: finalEpoch.relativeMismatch,
  };
  const classifications = classifyPoint({
    reference,
    final,
    finalLeft,
    finalRight,
    finalEpoch,
    epochHistory,
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
    finalState: {
      leftAovEjectedVolumeMl: final.leftEjected,
      rightPvEjectedVolumeMl: final.rightEjected,
      signedMismatchMl: final.signedMismatch,
      absMismatchMl: final.absMismatch,
      relativeMismatch: final.relativeMismatch,
      pulmonaryVenousReservoirVolumeMl: finalEpoch.pulmonaryVenousReservoirVolumeMl,
      systemicVenousReservoirVolumeMl: finalEpoch.systemicVenousReservoirVolumeMl,
      totalReservoirVolumeResidualMl: finalEpoch.totalReservoirVolumeResidualMl,
      pulmonaryVenousPressureMmHg: finalEpoch.pulmonaryVenousPressureMmHg,
      systemicVenousPressureMmHg: finalEpoch.systemicVenousPressureMmHg,
      pulmonaryVenousPressureAdjustmentMmHg: finalEpoch.pulmonaryVenousPressureAdjustmentMmHg,
      systemicPressureAdjustmentMmHg: finalEpoch.systemicVenousPressureAdjustmentMmHg,
      finalAcceptedTransferMl: finalEpoch.acceptedTransferMl,
      maxAbsAcceptedTransferMl: finiteMaxOrNull(epochHistory.map((epoch) =>
        Math.abs(epoch.acceptedTransferMl ?? Number.NaN)
      )),
      maxAbsReservoirVolumeMl: round(Math.max(
        ...epochHistory.flatMap((epoch) => [
          Math.abs(epoch.pulmonaryVenousReservoirVolumeMl),
          Math.abs(epoch.systemicVenousReservoirVolumeMl),
        ]),
      )),
      finalReservoirStepMl: finalReservoirStep(epochHistory),
      leftStatus: finalLeft.status,
      rightStatus: finalRight.status,
      leftFailureReasons: finalLeft.failureReasons,
      rightFailureReasons: finalRight.failureReasons,
      leftAcceptedPhenotypeReasons: finalLeft.acceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: finalRight.acceptedPhenotypeReasons,
    },
    classifications,
    epochHistory,
    failureReasons,
  };
}

function classifyPoint(input: {
  readonly reference: ReturnType<typeof summarizeMismatch>;
  readonly final: ReturnType<typeof summarizeMismatch>;
  readonly finalLeft: LeftHeartDynamicReservePointResultV1;
  readonly finalRight: RightHeartStrategicSmokePointResultV1;
  readonly finalEpoch: ReservoirStateEpochV1;
  readonly epochHistory: readonly ReservoirStateEpochV1[];
  readonly variant: ReservoirStateVariantSpecV1;
}): ReservoirStateContractPointResultV1["classifications"] {
  const leftMorphologyPreserved = input.finalLeft.status === "pass";
  const rightMorphologyPreserved = input.finalRight.status === "pass";
  const morphologyPreserved = leftMorphologyPreserved && rightMorphologyPreserved;
  const flowBalanced =
    input.final.absMismatch != null
    && input.final.relativeMismatch != null
    && (input.final.absMismatch <= 8 || input.final.relativeMismatch <= 0.18);
  const mismatchImproved =
    input.variant.variantId === "open-reservoir-reference"
      ? false
      : input.reference.absMismatch != null
        && input.final.absMismatch != null
        && input.final.absMismatch < input.reference.absMismatch - 0.5;
  const pressureAdjustmentBounded =
    Math.abs(input.finalEpoch.pulmonaryVenousPressureAdjustmentMmHg)
      <= input.variant.pulmonaryPressureAdjustmentBoundMmHg + 1e-9
    && Math.abs(input.finalEpoch.systemicVenousPressureAdjustmentMmHg)
      <= input.variant.systemicPressureAdjustmentBoundMmHg + 1e-9;
  const reservoirLedgerClean = Math.abs(input.finalEpoch.totalReservoirVolumeResidualMl) <= 1e-6;
  const maxTransfer = finiteMaxOrNull(input.epochHistory.map((epoch) =>
    Math.abs(epoch.acceptedTransferMl ?? Number.NaN)
  ));
  const maxReservoirVolume = Math.max(...input.epochHistory.flatMap((epoch) => [
    Math.abs(epoch.pulmonaryVenousReservoirVolumeMl),
    Math.abs(epoch.systemicVenousReservoirVolumeMl),
  ]));
  const finalStep = finalReservoirStep(input.epochHistory);
  const last = input.epochHistory.at(-1);
  const previous = input.epochHistory.at(-2);
  const mismatchDelta = last?.absMismatchMl != null && previous?.absMismatchMl != null
    ? Math.abs(last.absMismatchMl - previous.absMismatchMl)
    : null;
  const perEpochTransferBounded = maxTransfer != null
    && maxTransfer <= input.variant.maxTransferPerEpochMl + 1e-9;
  const persistentReservoirBounded =
    maxReservoirVolume <= input.variant.persistentReservoirVolumeBoundMl + 1e-9;
  const repeatableFinalState =
    input.variant.variantId === "open-reservoir-reference"
      ? true
      : mismatchDelta != null && finalStep != null
        && mismatchDelta <= input.variant.repeatabilityMismatchDeltaMl
        && finalStep <= input.variant.repeatabilityReservoirStepMl;
  return {
    leftMorphologyPreserved,
    rightMorphologyPreserved,
    morphologyPreserved,
    flowBalanced,
    mismatchImproved,
    pressureAdjustmentBounded,
    reservoirLedgerClean,
    perEpochTransferBounded,
    persistentReservoirBounded,
    repeatableFinalState,
    cleanGateCPoint: morphologyPreserved
      && flowBalanced
      && pressureAdjustmentBounded
      && reservoirLedgerClean
      && perEpochTransferBounded
      && persistentReservoirBounded
      && repeatableFinalState,
  };
}

function failureReasonsFor(
  classifications: ReservoirStateContractPointResultV1["classifications"],
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.leftMorphologyPreserved) failures.push("left-surface-not-preserved");
  if (!classifications.rightMorphologyPreserved) failures.push("right-surface-not-preserved");
  if (!classifications.flowBalanced) failures.push("left-right-forward-ejection-mismatch");
  if (!classifications.pressureAdjustmentBounded) failures.push("reservoir-pressure-adjustment-unbounded");
  if (!classifications.reservoirLedgerClean) failures.push("reservoir-ledger-residual");
  if (!classifications.perEpochTransferBounded) failures.push("reservoir-transfer-limit-violation");
  if (!classifications.persistentReservoirBounded) failures.push("persistent-large-reservoir-shuttle");
  if (!classifications.repeatableFinalState) failures.push("reservoir-state-not-repeatable");
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
  pointResults: readonly ReservoirStateContractPointResultV1[],
): ReservoirStateContractVariantResultV1["summary"] {
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
    perEpochTransferBoundedCount: pointResults.filter((point) => point.classifications.perEpochTransferBounded).length,
    persistentReservoirBoundedCount: pointResults.filter((point) => point.classifications.persistentReservoirBounded).length,
    repeatableFinalStateCount: pointResults.filter((point) => point.classifications.repeatableFinalState).length,
    meanReferenceAbsMismatchMl: finiteMeanOrNull(pointResults.map((point) =>
      point.reference.absMismatchMl ?? Number.NaN
    )),
    meanFinalAbsMismatchMl: finiteMeanOrNull(pointResults.map((point) =>
      point.finalState.absMismatchMl ?? Number.NaN
    )),
    maxFinalAbsMismatchMl: finiteMaxOrNull(pointResults.map((point) =>
      point.finalState.absMismatchMl ?? Number.NaN
    )),
    meanAbsMismatchImprovementMl: finiteMeanOrNull(pointResults.map((point) => {
      const reference = point.reference.absMismatchMl;
      const final = point.finalState.absMismatchMl;
      return reference != null && final != null ? reference - final : Number.NaN;
    })),
    maxAbsAcceptedTransferMl: finiteMaxOrNull(pointResults.map((point) =>
      point.finalState.maxAbsAcceptedTransferMl ?? Number.NaN
    )),
    maxAbsReservoirVolumeMl: finiteMaxOrNull(pointResults.map((point) =>
      point.finalState.maxAbsReservoirVolumeMl
    )),
    maxTotalReservoirVolumeResidualMl: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.finalState.totalReservoirVolumeResidualMl)
    )),
    maxPulmonaryVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.finalState.pulmonaryVenousPressureAdjustmentMmHg)
    )),
    maxSystemicPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.finalState.systemicPressureAdjustmentMmHg)
    )),
  };
}

function missingPoint(
  profile: PairedProfileV1,
  left: LeftHeartSubsystemParamsV2 | undefined,
  right: RightHeartSubsystemParamsV2 | undefined,
): ReservoirStateContractPointResultV1 {
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
    finalState: {
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
      systemicPressureAdjustmentMmHg: 0,
      finalAcceptedTransferMl: null,
      maxAbsAcceptedTransferMl: null,
      maxAbsReservoirVolumeMl: 0,
      finalReservoirStepMl: null,
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
      perEpochTransferBounded: false,
      persistentReservoirBounded: false,
      repeatableFinalState: false,
      cleanGateCPoint: false,
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
  variants: readonly ReservoirStateContractVariantResultV1[],
  variantId: ReservoirStateVariantIdV1,
): ReservoirStateContractVariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing reservoir state contract variant ${variantId}`);
  return variant;
}

function finalReservoirStep(epochHistory: readonly ReservoirStateEpochV1[]): number | null {
  const last = epochHistory.at(-1);
  const previous = epochHistory.at(-2);
  if (last == null || previous == null) return null;
  return round(Math.max(
    Math.abs(last.pulmonaryVenousReservoirVolumeMl - previous.pulmonaryVenousReservoirVolumeMl),
    Math.abs(last.systemicVenousReservoirVolumeMl - previous.systemicVenousReservoirVolumeMl),
  ));
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

function roundOrNull(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : round(value);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

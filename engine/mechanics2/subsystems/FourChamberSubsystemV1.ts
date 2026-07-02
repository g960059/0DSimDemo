import {
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export type FourChamberSubsystemProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "preload-low"
  | "preload-high"
  | "afterload-high"
  | "contractility-low"
  | "contractility-high";

export type FourChamberSubsystemReservoirParamsV1 = {
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
  readonly reservoirVolumeOwnershipBoundMl?: number;
};

export type FourChamberSubsystemParamsV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly left: LeftHeartSubsystemParamsV2;
  readonly right: RightHeartSubsystemParamsV2;
  readonly reservoir: FourChamberSubsystemReservoirParamsV1;
};

export type FourChamberSubsystemForwardMismatchV1 = {
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
};

export type FourChamberSubsystemEpochV1 = FourChamberSubsystemForwardMismatchV1 & {
  readonly epoch: number;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly totalReservoirVolumeResidualMl: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly systemicVenousPressureMmHg: number;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
  readonly proposedTransferMl: number | null;
  readonly acceptedTransferMl: number | null;
  readonly transferLimiterActive: boolean;
  readonly reservoirVolumeOwnershipLimiterActive?: boolean;
  readonly reservoirVolumeOwnershipRejectedTransferMl?: number | null;
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  readonly leftAcceptedPhenotypeReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
};

export type FourChamberSubsystemRunV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly reference: FourChamberSubsystemForwardMismatchV1 & {
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  };
  readonly finalState: FourChamberSubsystemForwardMismatchV1 & {
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
    readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
    readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
    readonly leftFailureReasons: readonly string[];
    readonly rightFailureReasons: readonly string[];
    readonly leftAcceptedPhenotypeReasons: readonly string[];
    readonly rightAcceptedPhenotypeReasons: readonly string[];
  };
  readonly classifications: {
    readonly leftSurfacePreserved: boolean;
    readonly rightSurfacePreserved: boolean;
    readonly morphologyPreserved: boolean;
    readonly flowBalanced: boolean;
    readonly pressureAdjustmentBounded: boolean;
    readonly reservoirLedgerClean: boolean;
    readonly perEpochTransferBounded: boolean;
    readonly persistentReservoirBounded: boolean;
    readonly repeatableFinalState: boolean;
    readonly phenotypeScopeOk: boolean;
    readonly cleanSubsystemPoint: boolean;
  };
  readonly epochHistory: readonly FourChamberSubsystemEpochV1[];
  readonly failureReasons: readonly string[];
};

export function runFourChamberSubsystemV1(
  params: FourChamberSubsystemParamsV1,
): FourChamberSubsystemRunV1 {
  const referenceLeft = runLeftHeartDynamicReservePointV1(params.left);
  const referenceRight = runRightHeartStrategicPointV1(params.right);
  const referenceMismatch = summarizeMismatch(referenceLeft, referenceRight);
  const pulmonaryBasePressure = leftPulmonaryPressure(params.left);
  const systemicBasePressure = params.right.systemicVenousPressureMmHg;
  let pulmonaryVenousReservoirVolumeMl = 0;
  let systemicVenousReservoirVolumeMl = 0;
  let finalLeft = referenceLeft;
  let finalRight = referenceRight;
  const epochHistory: FourChamberSubsystemEpochV1[] = [];

  for (let epoch = 0; epoch < params.reservoir.epochs; epoch++) {
    const pulmonaryPressure = pulmonaryBasePressure
      + pulmonaryVenousReservoirVolumeMl
        / Math.max(params.reservoir.pulmonaryVenousComplianceMlPerMmHg, 1e-9);
    const systemicPressure = systemicBasePressure
      + systemicVenousReservoirVolumeMl
        / Math.max(params.reservoir.systemicVenousComplianceMlPerMmHg, 1e-9);
    finalLeft = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(params.left, pulmonaryPressure));
    finalRight = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(params.right, systemicPressure));
    const mismatch = summarizeMismatch(finalLeft, finalRight);
    const proposedTransfer = mismatch.signedMismatchMl == null
      ? null
      : mismatch.signedMismatchMl * params.reservoir.transferGain01;
    const transferLimited = proposedTransfer == null
      ? null
      : clamp(proposedTransfer, -params.reservoir.maxTransferPerEpochMl, params.reservoir.maxTransferPerEpochMl);
    const volumeOwnedTransfer = transferLimited == null
      ? { acceptedTransferMl: null, rejectedTransferMl: null, limiterActive: false }
      : applyReservoirVolumeOwnership({
        transferLimitedMl: transferLimited,
        pulmonaryVenousReservoirVolumeMl,
        systemicVenousReservoirVolumeMl,
        reservoirVolumeOwnershipBoundMl: params.reservoir.reservoirVolumeOwnershipBoundMl,
      });
    const acceptedTransfer = volumeOwnedTransfer.acceptedTransferMl;
    epochHistory.push({
      epoch,
      pulmonaryVenousReservoirVolumeMl: round(pulmonaryVenousReservoirVolumeMl),
      systemicVenousReservoirVolumeMl: round(systemicVenousReservoirVolumeMl),
      totalReservoirVolumeResidualMl: round(pulmonaryVenousReservoirVolumeMl + systemicVenousReservoirVolumeMl),
      pulmonaryVenousPressureMmHg: round(pulmonaryPressure),
      systemicVenousPressureMmHg: round(systemicPressure),
      pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryPressure - pulmonaryBasePressure),
      systemicPressureAdjustmentMmHg: round(systemicPressure - systemicBasePressure),
      ...mismatch,
      proposedTransferMl: roundOrNull(proposedTransfer),
      acceptedTransferMl: roundOrNull(acceptedTransfer),
      transferLimiterActive: proposedTransfer != null
        && transferLimited != null
        && Math.abs(proposedTransfer - transferLimited) > 1e-9,
      reservoirVolumeOwnershipLimiterActive: params.reservoir.reservoirVolumeOwnershipBoundMl == null
        ? undefined
        : volumeOwnedTransfer.limiterActive,
      reservoirVolumeOwnershipRejectedTransferMl: params.reservoir.reservoirVolumeOwnershipBoundMl == null
        ? undefined
        : roundOrNull(volumeOwnedTransfer.rejectedTransferMl),
      leftStatus: finalLeft.status,
      rightStatus: finalRight.status,
      leftAcceptedPhenotypeReasons: finalLeft.acceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: finalRight.acceptedPhenotypeReasons,
    });
    if (acceptedTransfer == null) break;
    systemicVenousReservoirVolumeMl += acceptedTransfer;
    pulmonaryVenousReservoirVolumeMl -= acceptedTransfer;
  }

  const finalEpoch = epochHistory.at(-1);
  if (finalEpoch == null) return inconclusiveRun(params, referenceLeft, referenceRight, referenceMismatch);
  const classifications = classifyRun({
    profileId: params.profileId,
    finalEpoch,
    finalLeft,
    finalRight,
    epochHistory,
    reservoir: params.reservoir,
  });
  const failureReasons = failureReasonsFor(classifications);
  return {
    profileId: params.profileId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    reference: {
      ...referenceMismatch,
      leftStatus: referenceLeft.status,
      rightStatus: referenceRight.status,
    },
    finalState: {
      leftAovEjectedVolumeMl: finalEpoch.leftAovEjectedVolumeMl,
      rightPvEjectedVolumeMl: finalEpoch.rightPvEjectedVolumeMl,
      signedMismatchMl: finalEpoch.signedMismatchMl,
      absMismatchMl: finalEpoch.absMismatchMl,
      relativeMismatch: finalEpoch.relativeMismatch,
      pulmonaryVenousReservoirVolumeMl: finalEpoch.pulmonaryVenousReservoirVolumeMl,
      systemicVenousReservoirVolumeMl: finalEpoch.systemicVenousReservoirVolumeMl,
      totalReservoirVolumeResidualMl: finalEpoch.totalReservoirVolumeResidualMl,
      pulmonaryVenousPressureMmHg: finalEpoch.pulmonaryVenousPressureMmHg,
      systemicVenousPressureMmHg: finalEpoch.systemicVenousPressureMmHg,
      pulmonaryVenousPressureAdjustmentMmHg: finalEpoch.pulmonaryVenousPressureAdjustmentMmHg,
      systemicPressureAdjustmentMmHg: finalEpoch.systemicPressureAdjustmentMmHg,
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

function summarizeMismatch(
  left: LeftHeartDynamicReservePointResultV1,
  right: RightHeartStrategicSmokePointResultV1,
): FourChamberSubsystemForwardMismatchV1 {
  const leftAovEjectedVolumeMl = left.finalBeat?.aovEjectedVolumeMl ?? null;
  const rightPvEjectedVolumeMl = right.finalBeat?.pvEjectedVolumeMl ?? null;
  if (leftAovEjectedVolumeMl == null || rightPvEjectedVolumeMl == null) {
    return {
      leftAovEjectedVolumeMl,
      rightPvEjectedVolumeMl,
      signedMismatchMl: null,
      absMismatchMl: null,
      relativeMismatch: null,
    };
  }
  const signedMismatch = leftAovEjectedVolumeMl - rightPvEjectedVolumeMl;
  const absMismatch = Math.abs(signedMismatch);
  const meanForward = (Math.abs(leftAovEjectedVolumeMl) + Math.abs(rightPvEjectedVolumeMl)) / 2;
  return {
    leftAovEjectedVolumeMl: round(leftAovEjectedVolumeMl),
    rightPvEjectedVolumeMl: round(rightPvEjectedVolumeMl),
    signedMismatchMl: round(signedMismatch),
    absMismatchMl: round(absMismatch),
    relativeMismatch: meanForward > 1e-9 ? round(absMismatch / meanForward) : null,
  };
}

function classifyRun(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly finalEpoch: FourChamberSubsystemEpochV1;
  readonly finalLeft: LeftHeartDynamicReservePointResultV1;
  readonly finalRight: RightHeartStrategicSmokePointResultV1;
  readonly epochHistory: readonly FourChamberSubsystemEpochV1[];
  readonly reservoir: FourChamberSubsystemReservoirParamsV1;
}): FourChamberSubsystemRunV1["classifications"] {
  const leftSurfacePreserved = input.finalLeft.status === "pass";
  const rightSurfacePreserved = input.finalRight.status === "pass";
  const flowBalanced =
    input.finalEpoch.absMismatchMl != null
    && input.finalEpoch.relativeMismatch != null
    && (input.finalEpoch.absMismatchMl <= 8 || input.finalEpoch.relativeMismatch <= 0.18);
  const pressureAdjustmentBounded =
    Math.abs(input.finalEpoch.pulmonaryVenousPressureAdjustmentMmHg)
      <= input.reservoir.pulmonaryPressureAdjustmentBoundMmHg + 1e-9
    && Math.abs(input.finalEpoch.systemicPressureAdjustmentMmHg)
      <= input.reservoir.systemicPressureAdjustmentBoundMmHg + 1e-9;
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
    && maxTransfer <= input.reservoir.maxTransferPerEpochMl + 1e-9;
  const persistentReservoirBounded =
    maxReservoirVolume <= input.reservoir.persistentReservoirVolumeBoundMl + 1e-9;
  const repeatableFinalState =
    mismatchDelta != null && finalStep != null
    && mismatchDelta <= input.reservoir.repeatabilityMismatchDeltaMl
    && finalStep <= input.reservoir.repeatabilityReservoirStepMl;
  const phenotypeScopeOk = acceptedPhenotypeScopeOk({
    profileId: input.profileId,
    leftAcceptedPhenotypeReasons: input.finalLeft.acceptedPhenotypeReasons,
    rightAcceptedPhenotypeReasons: input.finalRight.acceptedPhenotypeReasons,
  });
  return {
    leftSurfacePreserved,
    rightSurfacePreserved,
    morphologyPreserved: leftSurfacePreserved && rightSurfacePreserved,
    flowBalanced,
    pressureAdjustmentBounded,
    reservoirLedgerClean,
    perEpochTransferBounded,
    persistentReservoirBounded,
    repeatableFinalState,
    phenotypeScopeOk,
    cleanSubsystemPoint: leftSurfacePreserved
      && rightSurfacePreserved
      && flowBalanced
      && pressureAdjustmentBounded
      && reservoirLedgerClean
      && perEpochTransferBounded
      && persistentReservoirBounded
      && repeatableFinalState
      && phenotypeScopeOk,
  };
}

function failureReasonsFor(
  classifications: FourChamberSubsystemRunV1["classifications"],
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.leftSurfacePreserved) failures.push("left-surface-not-preserved");
  if (!classifications.rightSurfacePreserved) failures.push("right-surface-not-preserved");
  if (!classifications.flowBalanced) failures.push("left-right-forward-ejection-mismatch");
  if (!classifications.pressureAdjustmentBounded) failures.push("reservoir-pressure-adjustment-unbounded");
  if (!classifications.reservoirLedgerClean) failures.push("reservoir-ledger-residual");
  if (!classifications.perEpochTransferBounded) failures.push("reservoir-transfer-limit-violation");
  if (!classifications.persistentReservoirBounded) failures.push("persistent-large-reservoir-shuttle");
  if (!classifications.repeatableFinalState) failures.push("reservoir-state-not-repeatable");
  if (!classifications.phenotypeScopeOk) failures.push("unexpected-accepted-phenotype");
  return failures;
}

function inconclusiveRun(
  params: FourChamberSubsystemParamsV1,
  left: LeftHeartDynamicReservePointResultV1,
  right: RightHeartStrategicSmokePointResultV1,
  referenceMismatch: FourChamberSubsystemForwardMismatchV1,
): FourChamberSubsystemRunV1 {
  return {
    profileId: params.profileId,
    status: "inconclusive",
    reference: {
      ...referenceMismatch,
      leftStatus: left.status,
      rightStatus: right.status,
    },
    finalState: {
      ...referenceMismatch,
      pulmonaryVenousReservoirVolumeMl: 0,
      systemicVenousReservoirVolumeMl: 0,
      totalReservoirVolumeResidualMl: 0,
      pulmonaryVenousPressureMmHg: leftPulmonaryPressure(params.left),
      systemicVenousPressureMmHg: params.right.systemicVenousPressureMmHg,
      pulmonaryVenousPressureAdjustmentMmHg: 0,
      systemicPressureAdjustmentMmHg: 0,
      finalAcceptedTransferMl: null,
      maxAbsAcceptedTransferMl: null,
      maxAbsReservoirVolumeMl: 0,
      finalReservoirStepMl: null,
      leftStatus: left.status,
      rightStatus: right.status,
      leftFailureReasons: left.failureReasons,
      rightFailureReasons: right.failureReasons,
      leftAcceptedPhenotypeReasons: left.acceptedPhenotypeReasons,
      rightAcceptedPhenotypeReasons: right.acceptedPhenotypeReasons,
    },
    classifications: {
      leftSurfacePreserved: false,
      rightSurfacePreserved: false,
      morphologyPreserved: false,
      flowBalanced: false,
      pressureAdjustmentBounded: false,
      reservoirLedgerClean: false,
      perEpochTransferBounded: false,
      persistentReservoirBounded: false,
      repeatableFinalState: false,
      phenotypeScopeOk: false,
      cleanSubsystemPoint: false,
    },
    epochHistory: [],
    failureReasons: ["missing-epoch-history"],
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

function finalReservoirStep(epochHistory: readonly FourChamberSubsystemEpochV1[]): number | null {
  const last = epochHistory.at(-1);
  const previous = epochHistory.at(-2);
  if (last == null || previous == null) return null;
  return round(Math.max(
    Math.abs(last.pulmonaryVenousReservoirVolumeMl - previous.pulmonaryVenousReservoirVolumeMl),
    Math.abs(last.systemicVenousReservoirVolumeMl - previous.systemicVenousReservoirVolumeMl),
  ));
}

function acceptedPhenotypeScopeOk(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftAcceptedPhenotypeReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
}): boolean {
  const expected = input.profileId === "contractility-low"
    ? ["clean-low-contractility-low-output-phenotype"]
    : [];
  return sameStringSet(input.leftAcceptedPhenotypeReasons, expected)
    && sameStringSet(input.rightAcceptedPhenotypeReasons, expected);
}

function sameStringSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
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

function applyReservoirVolumeOwnership(input: {
  readonly transferLimitedMl: number;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly reservoirVolumeOwnershipBoundMl: number | undefined;
}): {
  readonly acceptedTransferMl: number;
  readonly rejectedTransferMl: number;
  readonly limiterActive: boolean;
} {
  if (input.reservoirVolumeOwnershipBoundMl == null) {
    return {
      acceptedTransferMl: input.transferLimitedMl,
      rejectedTransferMl: 0,
      limiterActive: false,
    };
  }
  const bound = Math.max(input.reservoirVolumeOwnershipBoundMl, 0);
  const lower = Math.max(
    -bound - input.systemicVenousReservoirVolumeMl,
    input.pulmonaryVenousReservoirVolumeMl - bound,
  );
  const upper = Math.min(
    bound - input.systemicVenousReservoirVolumeMl,
    bound + input.pulmonaryVenousReservoirVolumeMl,
  );
  const acceptedTransferMl = clamp(input.transferLimitedMl, lower, upper);
  return {
    acceptedTransferMl,
    rejectedTransferMl: input.transferLimitedMl - acceptedTransferMl,
    limiterActive: Math.abs(input.transferLimitedMl - acceptedTransferMl) > 1e-9,
  };
}

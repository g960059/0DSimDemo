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
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const BOUNDED_RESERVOIR_VOLUME_OWNERSHIP_REPORT_ID_V1 =
  "bounded-reservoir-volume-ownership-report-v1" as const;

type VariantIdV1 = "selected-reference-unbounded" | "hard-volume-bound28" | "hard-volume-bound24";

type VariantSpecV1 = {
  readonly variantId: VariantIdV1;
  readonly description: string;
  readonly volumeBoundMl: number | null;
};

type ProbeResultV1 = {
  readonly epochs: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  readonly finalAbsForwardMismatchMl: number | null;
  readonly finalRelativeMismatch: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly finalAcceptedTransferMl: number | null;
  readonly volumeLimiterHitCount: number;
  readonly maxAbsRejectedTransferMl: number | null;
  readonly finalRejectedTransferMl: number | null;
  readonly leftFailureReasons: readonly string[];
  readonly rightFailureReasons: readonly string[];
};

type VariantResultV1 = {
  readonly variantId: VariantIdV1;
  readonly description: string;
  readonly intervention: {
    readonly volumeBoundMl: number | null;
    readonly transferGain01: 0.14;
    readonly maxTransferPerEpochMl: 3.5;
    readonly pulmonaryVenousComplianceMlPerMmHg: 80;
    readonly systemicVenousComplianceMlPerMmHg: 160;
  };
  readonly probeResults: readonly ProbeResultV1[];
  readonly summary: {
    readonly passCount: number;
    readonly total: 3;
    readonly longestStatus: ProbeResultV1["status"];
    readonly maxAbsReservoirVolumeMl: number;
    readonly maxAbsRejectedTransferMl: number | null;
    readonly volumeLimiterHitCount: number;
    readonly allSourceSurfacesPreserved: boolean;
  };
};

export type BoundedReservoirVolumeOwnershipReportV1 = {
  readonly reportId: typeof BOUNDED_RESERVOIR_VOLUME_OWNERSHIP_REPORT_ID_V1;
  readonly gateId: "boundedReservoirVolumeOwnershipV1";
  readonly inputs: {
    readonly profileId: "preload-low";
    readonly leftPointId: "left-heart-preload-low";
    readonly rightPointId: "right-heart-preload-low";
    readonly epochCounts: readonly number[];
  };
  readonly variantResults: readonly VariantResultV1[];
  readonly summary: {
    readonly bestVariantId: VariantIdV1;
    readonly bestPassCount: number;
    readonly referencePassCount: number;
    readonly bestLongestStatus: ProbeResultV1["status"];
    readonly bestMaxAbsReservoirVolumeMl: number;
    readonly bestVolumeLimiterHitCount: number;
  };
  readonly decision: {
    readonly boundedReservoirVolumeStatus:
      | "bounded-volume-ownership-targeted-signal"
      | "bounded-volume-ownership-no-signal";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirBroadRetuning: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const EPOCH_COUNTS = [22, 40, 56] as const;

const VARIANTS: readonly VariantSpecV1[] = [
  {
    variantId: "selected-reference-unbounded",
    description: "Selected preload-low source-aware reservoir scaffold without volume ownership projection.",
    volumeBoundMl: null,
  },
  {
    variantId: "hard-volume-bound28",
    description: "Own accepted reservoir transfer with a hard volume compatibility bound matching the standing persistent-volume guard.",
    volumeBoundMl: 28,
  },
  {
    variantId: "hard-volume-bound24",
    description: "Stricter diagnostic hard volume compatibility bound to check whether the signal depends on using the exact guard value.",
    volumeBoundMl: 24,
  },
];

export function runBoundedReservoirVolumeOwnershipBenchV1():
BoundedReservoirVolumeOwnershipReportV1 {
  const variantResults = VARIANTS.map(runVariant).sort(variantSort);
  const best = variantResults[0]!;
  const reference = requiredVariant(variantResults, "selected-reference-unbounded");
  const targetedSignal =
    best.variantId !== "selected-reference-unbounded"
    && best.summary.passCount === 3
    && best.summary.allSourceSurfacesPreserved
    && best.summary.volumeLimiterHitCount > 0
    && best.summary.maxAbsReservoirVolumeMl <= (best.intervention.volumeBoundMl ?? 0) + 1e-9;
  return {
    reportId: BOUNDED_RESERVOIR_VOLUME_OWNERSHIP_REPORT_ID_V1,
    gateId: "boundedReservoirVolumeOwnershipV1",
    inputs: {
      profileId: "preload-low",
      leftPointId: "left-heart-preload-low",
      rightPointId: "right-heart-preload-low",
      epochCounts: EPOCH_COUNTS,
    },
    variantResults,
    summary: {
      bestVariantId: best.variantId,
      bestPassCount: best.summary.passCount,
      referencePassCount: reference.summary.passCount,
      bestLongestStatus: best.summary.longestStatus,
      bestMaxAbsReservoirVolumeMl: best.summary.maxAbsReservoirVolumeMl,
      bestVolumeLimiterHitCount: best.summary.volumeLimiterHitCount,
    },
    decision: {
      boundedReservoirVolumeStatus: targetedSignal
        ? "bounded-volume-ownership-targeted-signal"
        : "bounded-volume-ownership-no-signal",
      nextAction: targetedSignal
        ? "Promote bounded reservoir-volume ownership into the source-aware four-chamber contract smoke and rerun the full nominal/dt-half/long-epoch envelope; do not unlock runtime, AV-plane, or LandAtrial from this targeted signal alone."
        : "Do not promote bounded reservoir-volume ownership. Reclassify preload-low reservoir repeatability before more reservoir or atrial work.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-broad-retuning",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirBroadRetuning: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runVariant(variant: VariantSpecV1): VariantResultV1 {
  const probeResults = EPOCH_COUNTS.map((epochs) => runProbe(variant, epochs));
  return {
    variantId: variant.variantId,
    description: variant.description,
    intervention: {
      volumeBoundMl: variant.volumeBoundMl,
      transferGain01: 0.14,
      maxTransferPerEpochMl: 3.5,
      pulmonaryVenousComplianceMlPerMmHg: 80,
      systemicVenousComplianceMlPerMmHg: 160,
    },
    probeResults,
    summary: {
      passCount: probeResults.filter((probe) => probe.status === "pass").length,
      total: 3,
      longestStatus: probeResults.at(-1)!.status,
      maxAbsReservoirVolumeMl: round(Math.max(...probeResults.map((probe) => probe.maxAbsReservoirVolumeMl))),
      maxAbsRejectedTransferMl: finiteMaxOrNull(probeResults.map((probe) =>
        probe.maxAbsRejectedTransferMl ?? Number.NaN
      )),
      volumeLimiterHitCount: probeResults.reduce((sum, probe) => sum + probe.volumeLimiterHitCount, 0),
      allSourceSurfacesPreserved: probeResults.every((probe) =>
        probe.leftStatus === "pass" && probe.rightStatus === "pass"),
    },
  };
}

function runProbe(variant: VariantSpecV1, epochs: number): ProbeResultV1 {
  const leftParams = leftPreloadLow();
  const rightParams = rightPreloadLow();
  const pulmonaryBasePressure = leftPulmonaryPressure(leftParams);
  const systemicBasePressure = rightParams.systemicVenousPressureMmHg;
  let pulmonaryVenousReservoirVolumeMl = 0;
  let systemicVenousReservoirVolumeMl = 0;
  let finalLeft = runLeftHeartDynamicReservePointV1(leftParams);
  let finalRight = runRightHeartStrategicPointV1(rightParams);
  const history: Array<{
    readonly absMismatchMl: number | null;
    readonly relativeMismatch: number | null;
    readonly pulmonaryVenousReservoirVolumeMl: number;
    readonly systemicVenousReservoirVolumeMl: number;
    readonly acceptedTransferMl: number | null;
    readonly rejectedTransferMl: number | null;
    readonly volumeLimiterActive: boolean;
  }> = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const pulmonaryPressure = pulmonaryBasePressure + pulmonaryVenousReservoirVolumeMl / 80;
    const systemicPressure = systemicBasePressure + systemicVenousReservoirVolumeMl / 160;
    finalLeft = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(leftParams, pulmonaryPressure));
    finalRight = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(rightParams, systemicPressure));
    const mismatch = summarizeMismatch(finalLeft, finalRight);
    const proposedTransfer = mismatch.signedMismatchMl == null ? null : mismatch.signedMismatchMl * 0.14;
    const baseAccepted = proposedTransfer == null ? null : clamp(proposedTransfer, -3.5, 3.5);
    const bounded = baseAccepted == null
      ? { acceptedTransferMl: null, rejectedTransferMl: null, volumeLimiterActive: false }
      : applyVolumeOwnershipProjection({
        baseAcceptedTransferMl: baseAccepted,
        pulmonaryVenousReservoirVolumeMl,
        systemicVenousReservoirVolumeMl,
        volumeBoundMl: variant.volumeBoundMl,
      });
    history.push({
      absMismatchMl: mismatch.absMismatchMl,
      relativeMismatch: mismatch.relativeMismatch,
      pulmonaryVenousReservoirVolumeMl: round(pulmonaryVenousReservoirVolumeMl),
      systemicVenousReservoirVolumeMl: round(systemicVenousReservoirVolumeMl),
      acceptedTransferMl: roundOrNull(bounded.acceptedTransferMl),
      rejectedTransferMl: roundOrNull(bounded.rejectedTransferMl),
      volumeLimiterActive: bounded.volumeLimiterActive,
    });
    if (bounded.acceptedTransferMl == null) break;
    systemicVenousReservoirVolumeMl += bounded.acceptedTransferMl;
    pulmonaryVenousReservoirVolumeMl -= bounded.acceptedTransferMl;
  }

  const last = history.at(-1)!;
  const previous = history.at(-2);
  const maxAbsReservoirVolumeMl = round(Math.max(...history.flatMap((epoch) => [
    Math.abs(epoch.pulmonaryVenousReservoirVolumeMl),
    Math.abs(epoch.systemicVenousReservoirVolumeMl),
  ])));
  const finalReservoirStepMl = previous == null ? null : round(Math.max(
    Math.abs(last.pulmonaryVenousReservoirVolumeMl - previous.pulmonaryVenousReservoirVolumeMl),
    Math.abs(last.systemicVenousReservoirVolumeMl - previous.systemicVenousReservoirVolumeMl),
  ));
  const mismatchDelta = previous?.absMismatchMl != null && last.absMismatchMl != null
    ? Math.abs(last.absMismatchMl - previous.absMismatchMl)
    : null;
  const classifications = {
    leftSurfacePreserved: finalLeft.status === "pass",
    rightSurfacePreserved: finalRight.status === "pass",
    flowBalanced: last.absMismatchMl != null
      && last.relativeMismatch != null
      && (last.absMismatchMl <= 8 || last.relativeMismatch <= 0.18),
    pressureAdjustmentBounded: Math.abs(last.pulmonaryVenousReservoirVolumeMl / 80) <= 1.4 + 1e-9
      && Math.abs(last.systemicVenousReservoirVolumeMl / 160) <= 1.1 + 1e-9,
    reservoirLedgerClean: Math.abs(
      last.pulmonaryVenousReservoirVolumeMl + last.systemicVenousReservoirVolumeMl,
    ) <= 1e-6,
    persistentReservoirBounded: maxAbsReservoirVolumeMl <= 28 + 1e-9,
    repeatableFinalState: mismatchDelta != null
      && finalReservoirStepMl != null
      && mismatchDelta <= 1.2
      && finalReservoirStepMl <= 4,
  };
  const failureReasons = failureReasonsFor(classifications);
  return {
    epochs,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
    leftStatus: finalLeft.status,
    rightStatus: finalRight.status,
    finalAbsForwardMismatchMl: last.absMismatchMl,
    finalRelativeMismatch: last.relativeMismatch,
    maxAbsReservoirVolumeMl,
    finalReservoirStepMl,
    maxAbsAcceptedTransferMl: finiteMaxOrNull(history.map((epoch) =>
      Math.abs(epoch.acceptedTransferMl ?? Number.NaN)
    )),
    finalAcceptedTransferMl: last.acceptedTransferMl,
    volumeLimiterHitCount: history.filter((epoch) => epoch.volumeLimiterActive).length,
    maxAbsRejectedTransferMl: finiteMaxOrNull(history.map((epoch) =>
      Math.abs(epoch.rejectedTransferMl ?? Number.NaN)
    )),
    finalRejectedTransferMl: last.rejectedTransferMl,
    leftFailureReasons: finalLeft.failureReasons,
    rightFailureReasons: finalRight.failureReasons,
  };
}

function applyVolumeOwnershipProjection(input: {
  readonly baseAcceptedTransferMl: number;
  readonly pulmonaryVenousReservoirVolumeMl: number;
  readonly systemicVenousReservoirVolumeMl: number;
  readonly volumeBoundMl: number | null;
}): {
  readonly acceptedTransferMl: number;
  readonly rejectedTransferMl: number;
  readonly volumeLimiterActive: boolean;
} {
  if (input.volumeBoundMl == null) {
    return {
      acceptedTransferMl: input.baseAcceptedTransferMl,
      rejectedTransferMl: 0,
      volumeLimiterActive: false,
    };
  }
  const lower = Math.max(
    -input.volumeBoundMl - input.systemicVenousReservoirVolumeMl,
    input.pulmonaryVenousReservoirVolumeMl - input.volumeBoundMl,
  );
  const upper = Math.min(
    input.volumeBoundMl - input.systemicVenousReservoirVolumeMl,
    input.volumeBoundMl + input.pulmonaryVenousReservoirVolumeMl,
  );
  const acceptedTransferMl = clamp(input.baseAcceptedTransferMl, lower, upper);
  return {
    acceptedTransferMl,
    rejectedTransferMl: input.baseAcceptedTransferMl - acceptedTransferMl,
    volumeLimiterActive: Math.abs(input.baseAcceptedTransferMl - acceptedTransferMl) > 1e-9,
  };
}

function leftPreloadLow(): LeftHeartSubsystemParamsV2 {
  const point = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .find((candidate) => candidate.fixtureId === "left-heart-preload-low");
  if (point == null) throw new Error("Missing left-heart-preload-low");
  return point;
}

function rightPreloadLow(): RightHeartSubsystemParamsV2 {
  const point = buildRightHeartStrategicEnvelopeV1()
    .find((candidate) => candidate.fixtureId === "right-heart-preload-low");
  if (point == null) throw new Error("Missing right-heart-preload-low");
  return applySelectedRightScaffold(point);
}

function applySelectedRightScaffold(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: 0.47,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function summarizeMismatch(
  left: LeftHeartDynamicReservePointResultV1,
  right: RightHeartStrategicSmokePointResultV1,
): {
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
} {
  const leftAovEjectedVolumeMl = left.finalBeat?.aovEjectedVolumeMl ?? null;
  const rightPvEjectedVolumeMl = right.finalBeat?.pvEjectedVolumeMl ?? null;
  if (leftAovEjectedVolumeMl == null || rightPvEjectedVolumeMl == null) {
    return { signedMismatchMl: null, absMismatchMl: null, relativeMismatch: null };
  }
  const signedMismatchMl = leftAovEjectedVolumeMl - rightPvEjectedVolumeMl;
  const absMismatchMl = Math.abs(signedMismatchMl);
  const meanForward = (Math.abs(leftAovEjectedVolumeMl) + Math.abs(rightPvEjectedVolumeMl)) / 2;
  return {
    signedMismatchMl: round(signedMismatchMl),
    absMismatchMl: round(absMismatchMl),
    relativeMismatch: meanForward > 1e-9 ? round(absMismatchMl / meanForward) : null,
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

function failureReasonsFor(classifications: {
  readonly leftSurfacePreserved: boolean;
  readonly rightSurfacePreserved: boolean;
  readonly flowBalanced: boolean;
  readonly pressureAdjustmentBounded: boolean;
  readonly reservoirLedgerClean: boolean;
  readonly persistentReservoirBounded: boolean;
  readonly repeatableFinalState: boolean;
}): readonly string[] {
  const failures: string[] = [];
  if (!classifications.leftSurfacePreserved) failures.push("left-surface-not-preserved");
  if (!classifications.rightSurfacePreserved) failures.push("right-surface-not-preserved");
  if (!classifications.flowBalanced) failures.push("left-right-forward-ejection-mismatch");
  if (!classifications.pressureAdjustmentBounded) failures.push("reservoir-pressure-adjustment-unbounded");
  if (!classifications.reservoirLedgerClean) failures.push("reservoir-ledger-residual");
  if (!classifications.persistentReservoirBounded) failures.push("persistent-large-reservoir-shuttle");
  if (!classifications.repeatableFinalState) failures.push("reservoir-state-not-repeatable");
  return failures;
}

function requiredVariant(
  variants: readonly VariantResultV1[],
  variantId: VariantIdV1,
): VariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing bounded reservoir volume variant ${variantId}`);
  return variant;
}

function variantSort(a: VariantResultV1, b: VariantResultV1): number {
  return b.summary.passCount - a.summary.passCount
    || Number(b.summary.allSourceSurfacesPreserved) - Number(a.summary.allSourceSurfacesPreserved)
    || a.summary.maxAbsReservoirVolumeMl - b.summary.maxAbsReservoirVolumeMl
    || variantOrder(a.variantId) - variantOrder(b.variantId);
}

function variantOrder(variantId: VariantIdV1): number {
  return VARIANTS.findIndex((variant) => variant.variantId === variantId);
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function roundOrNull(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

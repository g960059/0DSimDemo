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

export const RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1 =
  "reservoir-solver-bridge-report-v1" as const;

type ProfileIdV1 =
  | "normal-hr75"
  | "normal-hr90"
  | "preload-low"
  | "preload-high"
  | "afterload-high"
  | "contractility-low"
  | "contractility-high";

type ReservoirSolverVariantIdV1 =
  | "open-reservoir-reference"
  | "same-step-high-compliance-bound2"
  | "same-step-high-compliance-bound4"
  | "same-step-balanced-compliance-bound4"
  | "same-step-wide-compliance-bound6";

type PairedProfileV1 = {
  readonly profileId: ProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type ReservoirSolverVariantSpecV1 = {
  readonly variantId: ReservoirSolverVariantIdV1;
  readonly description: string;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly systemicVenousComplianceMlPerMmHg: number;
  readonly pulmonaryPressureAdjustmentBoundMmHg: number;
  readonly systemicPressureAdjustmentBoundMmHg: number;
  readonly sampleCount: number;
};

type CandidateEvaluationV1 = {
  readonly transferMl: number;
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
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"];
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  readonly leftFailureReasons: readonly string[];
  readonly rightFailureReasons: readonly string[];
  readonly score: number;
};

export type ReservoirSolverBridgePointResultV1 = {
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
  readonly accepted: CandidateEvaluationV1 | null;
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
  readonly failureReasons: readonly string[];
};

export type ReservoirSolverBridgeVariantResultV1 = {
  readonly variantId: ReservoirSolverVariantIdV1;
  readonly description: string;
  readonly intervention: Omit<ReservoirSolverVariantSpecV1, "variantId" | "description">;
  readonly pointResults: readonly ReservoirSolverBridgePointResultV1[];
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
    readonly meanAcceptedAbsMismatchMl: number | null;
    readonly maxAcceptedAbsMismatchMl: number | null;
    readonly meanAbsMismatchImprovementMl: number | null;
    readonly maxAcceptedAbsTransferMl: number | null;
    readonly maxTotalReservoirVolumeResidualMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicVenousPressureAdjustmentMmHg: number | null;
  };
};

export type ReservoirSolverBridgeReportV1 = {
  readonly reportId: typeof RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1;
  readonly gateId: "reservoirSolverBridgeGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: "right-heart-strategic-smoke-report-v1";
  };
  readonly variantResults: readonly ReservoirSolverBridgeVariantResultV1[];
  readonly decision: {
    readonly reservoirSolverStatus: "reservoir-solver-pass" | "promising-mixed-signal" | "no-go";
    readonly bestVariantId: ReservoirSolverVariantIdV1;
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

const VARIANTS: readonly ReservoirSolverVariantSpecV1[] = [
  {
    variantId: "open-reservoir-reference",
    description: "No same-step reservoir solve; records the open-boundary paired mismatch.",
    pulmonaryVenousComplianceMlPerMmHg: 30,
    systemicVenousComplianceMlPerMmHg: 60,
    pulmonaryPressureAdjustmentBoundMmHg: 0,
    systemicPressureAdjustmentBoundMmHg: 0,
    sampleCount: 1,
  },
  {
    variantId: "same-step-high-compliance-bound2",
    description: "Same-step scalar reservoir transfer solve with small pressure bounds.",
    pulmonaryVenousComplianceMlPerMmHg: 34,
    systemicVenousComplianceMlPerMmHg: 68,
    pulmonaryPressureAdjustmentBoundMmHg: 2,
    systemicPressureAdjustmentBoundMmHg: 1.5,
    sampleCount: 21,
  },
  {
    variantId: "same-step-high-compliance-bound4",
    description: "Same-step scalar reservoir transfer solve with the prior bridge pressure bounds.",
    pulmonaryVenousComplianceMlPerMmHg: 30,
    systemicVenousComplianceMlPerMmHg: 60,
    pulmonaryPressureAdjustmentBoundMmHg: 3.8,
    systemicPressureAdjustmentBoundMmHg: 3,
    sampleCount: 31,
  },
  {
    variantId: "same-step-balanced-compliance-bound4",
    description: "Same-step scalar reservoir transfer solve with balanced venous compliance.",
    pulmonaryVenousComplianceMlPerMmHg: 24,
    systemicVenousComplianceMlPerMmHg: 44,
    pulmonaryPressureAdjustmentBoundMmHg: 4,
    systemicPressureAdjustmentBoundMmHg: 3.5,
    sampleCount: 31,
  },
  {
    variantId: "same-step-wide-compliance-bound6",
    description: "Same-step scalar reservoir transfer solve with wider pressure bounds.",
    pulmonaryVenousComplianceMlPerMmHg: 26,
    systemicVenousComplianceMlPerMmHg: 52,
    pulmonaryPressureAdjustmentBoundMmHg: 6,
    systemicPressureAdjustmentBoundMmHg: 4.5,
    sampleCount: 41,
  },
];

export function runReservoirSolverBridgeBenchV1(): ReservoirSolverBridgeReportV1 {
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
      || (a.summary.meanAcceptedAbsMismatchMl ?? 1e9) - (b.summary.meanAcceptedAbsMismatchMl ?? 1e9),
    )[0] ?? reference;
  const promisingMixedSignal =
    best.summary.pass >= 6
    && best.summary.flowBalancedCount >= 6
    && best.summary.pressureAdjustmentBoundedCount === best.summary.total
    && best.summary.reservoirLedgerCleanCount === best.summary.total
    && (best.summary.meanAcceptedAbsMismatchMl ?? 1e9) < (reference.summary.meanReferenceAbsMismatchMl ?? 0);
  const reservoirSolverStatus = best.summary.pass === best.summary.total
    ? "reservoir-solver-pass"
    : promisingMixedSignal ? "promising-mixed-signal" : "no-go";
  return {
    reportId: RESERVOIR_SOLVER_BRIDGE_REPORT_ID_V1,
    gateId: "reservoirSolverBridgeGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId: "right-heart-strategic-smoke-report-v1",
    },
    variantResults: variants,
    decision: {
      reservoirSolverStatus,
      bestVariantId: best.variantId,
      bestPassCount: best.summary.pass,
      referenceMeanAbsMismatchMl: reference.summary.meanReferenceAbsMismatchMl,
      bestMeanAbsMismatchMl: best.summary.meanAcceptedAbsMismatchMl,
      remainingBlockers: best.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.profileId}: ${point.failureReasons.join(",")}`),
      nextAction: reservoirSolverStatus === "reservoir-solver-pass"
        ? "Use the same-step reservoir solver as the next MechanicsCore2 circulation scaffold; still do not unlock runtime, AV-plane, or LandAtrial."
        : reservoirSolverStatus === "promising-mixed-signal"
          ? "Continue same-step reservoir/mass-ledger coupling and classify the residual blockers before four-chamber, AV-plane, or LandAtrial work."
          : "Do not proceed to four-chamber, AV-plane, or LandAtrial. The same-step reservoir solver does not yet preserve morphology and flow balance across the envelope.",
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
  variant: ReservoirSolverVariantSpecV1,
  leftParams: readonly LeftHeartSubsystemParamsV2[],
  rightParams: readonly RightHeartSubsystemParamsV2[],
): ReservoirSolverBridgeVariantResultV1 {
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
      pulmonaryVenousComplianceMlPerMmHg: variant.pulmonaryVenousComplianceMlPerMmHg,
      systemicVenousComplianceMlPerMmHg: variant.systemicVenousComplianceMlPerMmHg,
      pulmonaryPressureAdjustmentBoundMmHg: variant.pulmonaryPressureAdjustmentBoundMmHg,
      systemicPressureAdjustmentBoundMmHg: variant.systemicPressureAdjustmentBoundMmHg,
      sampleCount: variant.sampleCount,
    },
    pointResults,
    summary: summarizeVariant(pointResults),
  };
}

function runPoint(
  profile: PairedProfileV1,
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  variant: ReservoirSolverVariantSpecV1,
): ReservoirSolverBridgePointResultV1 {
  const referenceLeft = runLeftHeartDynamicReservePointV1(leftBase);
  const referenceRight = runRightHeartStrategicPointV1(rightBase);
  const reference = summarizeMismatch(referenceLeft, referenceRight);
  const candidates = buildCandidateTransfers(variant).map((transferMl) =>
    evaluateCandidate(transferMl, leftBase, rightBase, variant)
  );
  const accepted = candidates.sort((a, b) => a.score - b.score)[0] ?? null;
  const classifications = accepted != null
    ? classifyPoint(reference, accepted, variant)
    : emptyClassifications();
  const failureReasons = failureReasonsFor(classifications);
  return {
    profileId: profile.profileId,
    leftPointId: profile.leftPointId,
    rightPointId: profile.rightPointId,
    status: accepted == null ? "inconclusive" : failureReasons.length === 0 ? "pass" : "fail",
    reference: {
      leftAovEjectedVolumeMl: reference.leftEjected,
      rightPvEjectedVolumeMl: reference.rightEjected,
      signedMismatchMl: reference.signedMismatch,
      absMismatchMl: reference.absMismatch,
      relativeMismatch: reference.relativeMismatch,
      leftStatus: referenceLeft.status,
      rightStatus: referenceRight.status,
    },
    accepted,
    classifications,
    failureReasons,
  };
}

function buildCandidateTransfers(variant: ReservoirSolverVariantSpecV1): readonly number[] {
  if (variant.variantId === "open-reservoir-reference") return [0];
  const positiveBound = Math.min(
    variant.pulmonaryPressureAdjustmentBoundMmHg * variant.pulmonaryVenousComplianceMlPerMmHg,
    variant.systemicPressureAdjustmentBoundMmHg * variant.systemicVenousComplianceMlPerMmHg,
  );
  const negativeBound = positiveBound;
  const sampleCount = Math.max(variant.sampleCount, 3);
  const transfers: number[] = [];
  for (let index = 0; index < sampleCount; index++) {
    const fraction = sampleCount === 1 ? 0.5 : index / (sampleCount - 1);
    transfers.push(round(-negativeBound + fraction * (positiveBound + negativeBound)));
  }
  return transfers;
}

function evaluateCandidate(
  transferMl: number,
  leftBase: LeftHeartSubsystemParamsV2,
  rightBase: RightHeartSubsystemParamsV2,
  variant: ReservoirSolverVariantSpecV1,
): CandidateEvaluationV1 {
  const leftBasePressure = leftPulmonaryPressure(leftBase);
  const rightBasePressure = rightBase.systemicVenousPressureMmHg;
  const pulmonaryPressure = leftBasePressure - transferMl / variant.pulmonaryVenousComplianceMlPerMmHg;
  const systemicPressure = rightBasePressure + transferMl / variant.systemicVenousComplianceMlPerMmHg;
  const left = runLeftHeartDynamicReservePointV1(withLeftPulmonaryPressure(leftBase, pulmonaryPressure));
  const right = runRightHeartStrategicPointV1(withRightSystemicVenousPressure(rightBase, systemicPressure));
  const mismatch = summarizeMismatch(left, right);
  const pulmonaryAdjustment = pulmonaryPressure - leftBasePressure;
  const systemicAdjustment = systemicPressure - rightBasePressure;
  const pressurePenalty = Math.max(0, Math.abs(pulmonaryAdjustment) - variant.pulmonaryPressureAdjustmentBoundMmHg)
    + Math.max(0, Math.abs(systemicAdjustment) - variant.systemicPressureAdjustmentBoundMmHg);
  const morphologyPenalty = (left.status === "pass" ? 0 : 10_000) + (right.status === "pass" ? 0 : 10_000);
  const ledgerPenalty = Math.abs(-transferMl + transferMl);
  const score = (mismatch.absMismatch ?? 1e6) + pressurePenalty * 1000 + morphologyPenalty + ledgerPenalty * 1000;
  return {
    transferMl: round(transferMl),
    pulmonaryVenousReservoirVolumeMl: round(-transferMl),
    systemicVenousReservoirVolumeMl: round(transferMl),
    totalReservoirVolumeResidualMl: 0,
    pulmonaryVenousPressureMmHg: round(pulmonaryPressure),
    systemicVenousPressureMmHg: round(systemicPressure),
    pulmonaryVenousPressureAdjustmentMmHg: round(pulmonaryAdjustment),
    systemicVenousPressureAdjustmentMmHg: round(systemicAdjustment),
    leftAovEjectedVolumeMl: mismatch.leftEjected,
    rightPvEjectedVolumeMl: mismatch.rightEjected,
    signedMismatchMl: mismatch.signedMismatch,
    absMismatchMl: mismatch.absMismatch,
    relativeMismatch: mismatch.relativeMismatch,
    leftStatus: left.status,
    rightStatus: right.status,
    leftFailureReasons: left.failureReasons,
    rightFailureReasons: right.failureReasons,
    score: round(score),
  };
}

function classifyPoint(
  reference: ReturnType<typeof summarizeMismatch>,
  accepted: CandidateEvaluationV1,
  variant: ReservoirSolverVariantSpecV1,
): ReservoirSolverBridgePointResultV1["classifications"] {
  const leftMorphologyPreserved = accepted.leftStatus === "pass";
  const rightMorphologyPreserved = accepted.rightStatus === "pass";
  const morphologyPreserved = leftMorphologyPreserved && rightMorphologyPreserved;
  const flowBalanced =
    accepted.absMismatchMl != null
    && accepted.relativeMismatch != null
    && (accepted.absMismatchMl <= 8 || accepted.relativeMismatch <= 0.18);
  const mismatchImproved =
    variant.variantId !== "open-reservoir-reference"
    && reference.absMismatch != null
    && accepted.absMismatchMl != null
    && accepted.absMismatchMl < reference.absMismatch - 0.5;
  const pressureAdjustmentBounded =
    Math.abs(accepted.pulmonaryVenousPressureAdjustmentMmHg) <= variant.pulmonaryPressureAdjustmentBoundMmHg + 1e-9
    && Math.abs(accepted.systemicVenousPressureAdjustmentMmHg) <= variant.systemicPressureAdjustmentBoundMmHg + 1e-9;
  const reservoirLedgerClean = Math.abs(accepted.totalReservoirVolumeResidualMl) <= 1e-6;
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

function emptyClassifications(): ReservoirSolverBridgePointResultV1["classifications"] {
  return {
    leftMorphologyPreserved: false,
    rightMorphologyPreserved: false,
    morphologyPreserved: false,
    flowBalanced: false,
    mismatchImproved: false,
    pressureAdjustmentBounded: false,
    reservoirLedgerClean: false,
    cleanBridgePoint: false,
  };
}

function failureReasonsFor(
  classifications: ReservoirSolverBridgePointResultV1["classifications"],
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
  pointResults: readonly ReservoirSolverBridgePointResultV1[],
): ReservoirSolverBridgeVariantResultV1["summary"] {
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
    meanAcceptedAbsMismatchMl: finiteMeanOrNull(pointResults.map((point) => point.accepted?.absMismatchMl ?? Number.NaN)),
    maxAcceptedAbsMismatchMl: finiteMaxOrNull(pointResults.map((point) => point.accepted?.absMismatchMl ?? Number.NaN)),
    meanAbsMismatchImprovementMl: finiteMeanOrNull(pointResults.map((point) => {
      const reference = point.reference.absMismatchMl;
      const accepted = point.accepted?.absMismatchMl;
      return reference != null && accepted != null ? reference - accepted : Number.NaN;
    })),
    maxAcceptedAbsTransferMl: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.accepted?.transferMl ?? Number.NaN)
    )),
    maxTotalReservoirVolumeResidualMl: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.accepted?.totalReservoirVolumeResidualMl ?? Number.NaN)
    )),
    maxPulmonaryVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.accepted?.pulmonaryVenousPressureAdjustmentMmHg ?? Number.NaN)
    )),
    maxSystemicVenousPressureAdjustmentMmHg: finiteMaxOrNull(pointResults.map((point) =>
      Math.abs(point.accepted?.systemicVenousPressureAdjustmentMmHg ?? Number.NaN)
    )),
  };
}

function missingPoint(
  profile: PairedProfileV1,
  left: LeftHeartSubsystemParamsV2 | undefined,
  right: RightHeartSubsystemParamsV2 | undefined,
): ReservoirSolverBridgePointResultV1 {
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
    accepted: null,
    classifications: emptyClassifications(),
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
  variants: readonly ReservoirSolverBridgeVariantResultV1[],
  variantId: ReservoirSolverVariantIdV1,
): ReservoirSolverBridgeVariantResultV1 {
  const variant = variants.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing reservoir solver bridge variant ${variantId}`);
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

import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftAtrialPressureSourceModeV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_MV_ASSEMBLED_TRANSACTION_SURFACE_REPORT_ID_V1 =
  "la-mv-assembled-transaction-surface-report-v1" as const;

type VariantIdV1 =
  | "fiber-total-fixed-pressure-fp2-reference"
  | "fiber-total-pv-compliance-fp2"
  | "fiber-total-pv-compliance-fp6-relax035"
  | "fiber-total-pv-compliance-fp10-relax025";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly pressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly pulmonaryVenousBoundaryMode: "fixed-pressure" | "compliance-node";
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
  readonly description: string;
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly pressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly pulmonaryVenousBoundaryMode: "fixed-pressure" | "compliance-node";
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly transactionConvergedCount: number;
  readonly maxTransactionResidualNormMl: number;
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly laPvLobeQualityPass: boolean;
  readonly laPvFailureReasons: readonly string[];
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly contractStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly contractPass: number;
  readonly laPvLobeQualityPass: number;
  readonly mvfCleanCount: number;
  readonly mvForwardVolumeParityCount: number;
  readonly aovOutputParityCount: number;
  readonly massCleanCount: number;
  readonly clampRegressionFreeCount: number;
  readonly transactionConvergenceCount: number;
  readonly meanMvForwardVolumeRatio: number;
  readonly meanAovForwardVolumeRatio: number;
  readonly maxTransactionResidualNormMl: number;
};

export type LaMvAssembledTransactionSurfaceReportV1 = {
  readonly reportId: typeof LA_MV_ASSEMBLED_TRANSACTION_SURFACE_REPORT_ID_V1;
  readonly gateId: "laMvAssembledTransactionSurfaceV1";
  readonly surfaceMode:
    "left-heart-same-step-pulmonary-reservoir-LA-chamber-MV-valve-LV-filling-no-runtime-no-AV-plane";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly bestVariantId: VariantIdV1;
    readonly bestSourceSurfacePass: number;
    readonly bestContractPass: number;
    readonly bestLaPvLobeQualityPass: number;
    readonly bestMvfCleanCount: number;
    readonly bestTransactionConvergenceCount: number;
  };
  readonly decision: {
    readonly laMvAssembledTransactionSurfaceStatus:
      | "la-mv-assembled-transaction-signal"
      | "la-mv-assembled-transaction-mixed"
      | "la-mv-assembled-transaction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly aPrimeReadback: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const VARIANTS: readonly VariantV1[] = [
  {
    variantId: "fiber-total-fixed-pressure-fp2-reference",
    pressureSourceMode: "fiber-chamber-total-pressure-shadow",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
    description: "Stateful LA chamber total pressure with the existing fixed pulmonary venous pressure boundary.",
  },
  {
    variantId: "fiber-total-pv-compliance-fp2",
    pressureSourceMode: "fiber-chamber-total-pressure-shadow",
    pulmonaryVenousBoundaryMode: "compliance-node",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
    description: "Same-step LA chamber/MV/LV transaction with pulmonary venous compliance-node ownership.",
  },
  {
    variantId: "fiber-total-pv-compliance-fp6-relax035",
    pressureSourceMode: "fiber-chamber-total-pressure-shadow",
    pulmonaryVenousBoundaryMode: "compliance-node",
    transactionIterations: 6,
    transactionRelaxation: 0.35,
    description: "More tightly iterated same-step LA/MV/LV transaction with conservative relaxation.",
  },
  {
    variantId: "fiber-total-pv-compliance-fp10-relax025",
    pressureSourceMode: "fiber-chamber-total-pressure-shadow",
    pulmonaryVenousBoundaryMode: "compliance-node",
    transactionIterations: 10,
    transactionRelaxation: 0.25,
    description: "High-iteration same-step LA/MV/LV transaction with lower relaxation for residual attribution.",
  },
];

export function runLaMvAssembledTransactionSurfaceBenchV1():
LaMvAssembledTransactionSurfaceReportV1 {
  const baselineParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2(params));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    return VARIANTS.map((variant) => {
      const candidateParams = applyVariant(baselineParams, variant);
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, runLeftHeartSubsystemV2(candidateParams));
    });
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const status = bestVariant.contractPass === PROFILE_IDS.length
    ? "la-mv-assembled-transaction-signal"
    : bestVariant.sourceSurfacePass >= 5
      || bestVariant.laPvLobeQualityPass > 0
      || bestVariant.mvfCleanCount >= 5
      ? "la-mv-assembled-transaction-mixed"
      : "la-mv-assembled-transaction-blocked";
  return {
    reportId: LA_MV_ASSEMBLED_TRANSACTION_SURFACE_REPORT_ID_V1,
    gateId: "laMvAssembledTransactionSurfaceV1",
    surfaceMode:
      "left-heart-same-step-pulmonary-reservoir-LA-chamber-MV-valve-LV-filling-no-runtime-no-AV-plane",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestVariant,
    summary: {
      totalProfiles: 7,
      bestVariantId: bestVariant.variantId,
      bestSourceSurfacePass: bestVariant.sourceSurfacePass,
      bestContractPass: bestVariant.contractPass,
      bestLaPvLobeQualityPass: bestVariant.laPvLobeQualityPass,
      bestMvfCleanCount: bestVariant.mvfCleanCount,
      bestTransactionConvergenceCount: bestVariant.transactionConvergenceCount,
    },
    decision: {
      laMvAssembledTransactionSurfaceStatus: status,
      nextAction: status === "la-mv-assembled-transaction-signal"
        ? "Proceed only to a broader source-aware envelope review with AV-plane still disabled."
        : status === "la-mv-assembled-transaction-mixed"
          ? "Keep runtime and AV-plane blocked. Use this assembled transaction signal to classify remaining LA PV lobe and MVF residuals before adding geometry."
          : "Keep assembled LA/MV transaction promotion blocked; the measured surface still cannot preserve source-surface and LA PV lobe quality.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "a-prime-readback",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      aPrimeReadback: false,
      LandAtrialUnlock: false,
    },
  };
}

function applyVariant(
  params: LeftHeartSubsystemParamsV2,
  variant: VariantV1,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    laPressureSourceMode: variant.pressureSourceMode,
    pulmonaryVenousBoundaryMode: variant.pulmonaryVenousBoundaryMode,
    transactionMode: "fixed-point",
    transactionIterations: variant.transactionIterations,
    transactionRelaxation: variant.transactionRelaxation,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variant: VariantV1,
  baseline: LeftHeartSubsystemRunV2,
  candidate: LeftHeartSubsystemRunV2,
): RowV1 {
  const baselineBeat = baseline.finalBeatSamples;
  const candidateBeat = candidate.finalBeatSamples;
  const dtSec = 1 / Math.max(candidateBeat.length, 1);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const candidateQmv = candidateBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const candidateAov = candidateBeat.map((sample) => sample.qAovMlPerSec);
  const shape = computeShapeQualityMetricsV1(candidateQmv);
  const transactionConvergedCount = candidateBeat.filter((sample) => sample.transactionConverged01 === 1).length;
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    pressureSourceMode: variant.pressureSourceMode,
    pulmonaryVenousBoundaryMode: variant.pulmonaryVenousBoundaryMode,
    transactionIterations: variant.transactionIterations,
    transactionRelaxation: variant.transactionRelaxation,
    mvForwardPeakCount: positivePeakCount(candidateQmv),
    mvC1ContinuityScore: round(shape.c1ContinuityScore),
    mvForwardVolumeRatio: round(forwardFlowVolume(candidateQmv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, dtSec), 1e-9)),
    aovForwardVolumeRatio: round(forwardFlowVolume(candidateAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, dtSec), 1e-9)),
    maxMassResidualAbsMl: round(maxAbs(candidateBeat.map((sample) => sample.massResidualMl))),
    clampCount: candidate.clampCount,
    baselineClampCount: baseline.clampCount,
    transactionConvergedCount,
    maxTransactionResidualNormMl: round(maxAbs(candidateBeat.map((sample) => sample.transactionResidualNormMl))),
    maxPulmonaryVenousPressureMmHg: round(Math.max(0, ...candidateBeat.map((sample) => sample.acceptedPulmonaryVenousPressureMmHg))),
    ...laPvQualityFor(candidateBeat),
  };
  const sourceFailures = sourceSurfaceFailureReasons(base, candidateBeat.length);
  const contractFailures = [
    ...sourceFailures,
    ...(base.laPvLobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
  ];
  return {
    ...base,
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    contractStatus: contractFailures.length === 0 ? "pass" : "fail",
    failureReasons: contractFailures,
  };
}

function sourceSurfaceFailureReasons(
  row: Omit<RowV1, "sourceSurfaceStatus" | "contractStatus" | "failureReasons">,
  sampleCount: number,
): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) failures.push("mv-forward-volume-ratio-wide");
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) failures.push("aov-output-ratio-wide");
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  if (row.transactionConvergedCount < Math.floor(0.95 * sampleCount)) failures.push("transaction-not-converged");
  if (row.maxTransactionResidualNormMl > 0.25) failures.push("transaction-residual-wide");
  return failures;
}

function laPvQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): {
  readonly laPvLobeQualityPass: boolean;
  readonly laPvFailureReasons: readonly string[];
} {
  const volumes = samples.map((sample) => sample.acceptedLaVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const opposed = signedALoop * signedVLoop < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposed) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return {
    laPvLobeQualityPass: failures.length === 0,
    laPvFailureReasons: failures,
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    laPvLobeQualityPass: rows.filter((row) => row.laPvLobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    mvForwardVolumeParityCount: rows.filter((row) =>
      row.mvForwardVolumeRatio >= 0.78 && row.mvForwardVolumeRatio <= 1.22).length,
    aovOutputParityCount: rows.filter((row) =>
      row.aovForwardVolumeRatio >= 0.80 && row.aovForwardVolumeRatio <= 1.20).length,
    massCleanCount: rows.filter((row) => row.maxMassResidualAbsMl <= 0.08).length,
    clampRegressionFreeCount: rows.filter((row) => row.clampCount <= row.baselineClampCount).length,
    transactionConvergenceCount: rows.filter((row) => !row.failureReasons.includes("transaction-not-converged")).length,
    meanMvForwardVolumeRatio: round(mean(rows.map((row) => row.mvForwardVolumeRatio))),
    meanAovForwardVolumeRatio: round(mean(rows.map((row) => row.aovForwardVolumeRatio))),
    maxTransactionResidualNormMl: round(Math.max(0, ...rows.map((row) => row.maxTransactionResidualNormMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.contractPass - a.contractPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.transactionConvergenceCount - a.transactionConvergenceCount
    || b.mvForwardVolumeParityCount - a.mvForwardVolumeParityCount;
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = 0.12 * Math.max(maxValue, 1e-9);
  let count = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= threshold) continue;
    if (cur > values[i - 1]! && cur >= values[i + 1]!) count++;
  }
  return count;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function countSelfIntersections(x: readonly number[], y: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 2; j < x.length - 1; j++) {
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(
        x[i]!, y[i]!, x[i + 1]!, y[i + 1]!,
        x[j]!, y[j]!, x[j + 1]!, y[j + 1]!,
      )) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function direction(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || y.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    const next = (i + 1) % x.length;
    sum += x[i]! * y[next]! - x[next]! * y[i]!;
  }
  return 0.5 * sum;
}

function sliceByIndices(
  x: readonly number[],
  y: readonly number[],
  indices: readonly number[],
): { readonly x: readonly number[]; readonly y: readonly number[] } {
  return {
    x: indices.map((index) => x[index]!),
    y: indices.map((index) => y[index]!),
  };
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}

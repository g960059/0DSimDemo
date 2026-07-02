import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_ACTIVE_PRESSURE_ADDITIVE_SOURCE_REPORT_ID_V1 =
  "la-active-pressure-additive-source-report-v1" as const;

type VariantIdV1 =
  | "fiber-active-additive-gain025"
  | "fiber-active-additive-gain050"
  | "fiber-active-additive-gain075"
  | "fiber-active-additive-gain100";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly activePressureGain: number;
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly activePressureGain: number;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxMassResidualAbsMl: number;
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
  readonly clampRegressionFreeCount: number;
  readonly massCleanCount: number;
  readonly meanMvForwardVolumeRatio: number;
  readonly meanAovForwardVolumeRatio: number;
};

export type LaActivePressureAdditiveSourceReportV1 = {
  readonly reportId: typeof LA_ACTIVE_PRESSURE_ADDITIVE_SOURCE_REPORT_ID_V1;
  readonly gateId: "laActivePressureAdditiveSourceV1";
  readonly sourceMode:
    "left-heart-LA-fiber-active-pressure-additive-shadow-no-runtime-no-AV-plane";
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
  };
  readonly decision: {
    readonly laActivePressureAdditiveSourceStatus:
      | "la-active-pressure-additive-source-signal"
      | "la-active-pressure-additive-source-mixed"
      | "la-active-pressure-additive-source-blocked";
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
  { variantId: "fiber-active-additive-gain025", activePressureGain: 0.25 },
  { variantId: "fiber-active-additive-gain050", activePressureGain: 0.50 },
  { variantId: "fiber-active-additive-gain075", activePressureGain: 0.75 },
  { variantId: "fiber-active-additive-gain100", activePressureGain: 1.00 },
];

export function runLaActivePressureAdditiveSourceBenchV1():
LaActivePressureAdditiveSourceReportV1 {
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = paramsByProfile.map((params) => runLeftHeartSubsystemV2(params));
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = paramsByProfile[index]!;
    const baseline = baselineRuns[index]!;
    return VARIANTS.map((variant) => {
      const candidateParams: LeftHeartSubsystemParamsV2 = {
        ...baselineParams,
        laPressureSourceMode: "fiber-active-pressure-additive-shadow",
        laFiberActivePressureGain: variant.activePressureGain,
      };
      return rowForRun(profileId, baselineParams.fixtureId, variant, baseline, runLeftHeartSubsystemV2(candidateParams));
    });
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestVariant = [...variantSummaries].sort(compareSummaries)[0]!;
  const status = bestVariant.contractPass === PROFILE_IDS.length
    ? "la-active-pressure-additive-source-signal"
    : bestVariant.sourceSurfacePass >= 5 || bestVariant.laPvLobeQualityPass > 0
      ? "la-active-pressure-additive-source-mixed"
      : "la-active-pressure-additive-source-blocked";
  return {
    reportId: LA_ACTIVE_PRESSURE_ADDITIVE_SOURCE_REPORT_ID_V1,
    gateId: "laActivePressureAdditiveSourceV1",
    sourceMode: "left-heart-LA-fiber-active-pressure-additive-shadow-no-runtime-no-AV-plane",
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
    },
    decision: {
      laActivePressureAdditiveSourceStatus: status,
      nextAction: status === "la-active-pressure-additive-source-signal"
        ? "Proceed only to a full chamber/valve transaction review with AV-plane still disabled."
        : status === "la-active-pressure-additive-source-mixed"
          ? "Keep runtime and AV-plane blocked. Additive active pressure is only a component signal; classify remaining source-surface and LA PV lobe residuals before promotion."
          : "Keep additive active-pressure source promotion blocked; direct source-surface pressure changes are still insufficient.",
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
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    activePressureGain: variant.activePressureGain,
    mvForwardPeakCount: positivePeakCount(candidateQmv),
    mvC1ContinuityScore: round(shape.c1ContinuityScore),
    mvForwardVolumeRatio: round(forwardFlowVolume(candidateQmv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, dtSec), 1e-9)),
    aovForwardVolumeRatio: round(forwardFlowVolume(candidateAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, dtSec), 1e-9)),
    clampCount: candidate.clampCount,
    baselineClampCount: baseline.clampCount,
    maxMassResidualAbsMl: round(maxAbs(candidateBeat.map((sample) => sample.massResidualMl))),
    ...laPvQualityFor(candidateBeat),
  };
  const sourceFailures = sourceSurfaceFailureReasons(base);
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
): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) failures.push("mv-forward-volume-ratio-wide");
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) failures.push("aov-output-ratio-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
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
    clampRegressionFreeCount: rows.filter((row) => row.clampCount <= row.baselineClampCount).length,
    massCleanCount: rows.filter((row) => row.maxMassResidualAbsMl <= 0.08).length,
    meanMvForwardVolumeRatio: round(mean(rows.map((row) => row.mvForwardVolumeRatio))),
    meanAovForwardVolumeRatio: round(mean(rows.map((row) => row.aovForwardVolumeRatio))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.contractPass - a.contractPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.mvfCleanCount - a.mvfCleanCount
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

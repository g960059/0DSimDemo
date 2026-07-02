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

export const STATEFUL_ATRIAL_GEOMETRY_TRANSACTION_REPORT_ID_V1 =
  "stateful-atrial-geometry-transaction-report-v1" as const;

type VariantIdV1 =
  | "no-geometry-fixed-pressure"
  | "stretch-geometry-gain06-fixed-pressure"
  | "stretch-geometry-gain12-fixed-pressure"
  | "stretch-geometry-gain18-fixed-pressure"
  | "capacity-geometry-gain06-fixed-pressure"
  | "capacity-geometry-gain12-fixed-pressure"
  | "capacity-geometry-gain18-fixed-pressure"
  | "capacity-geometry-gain12-pv-compliance-fp6"
  | "phase-reservoir-capacity-gain06-fixed-pressure"
  | "phase-reservoir-capacity-gain12-fixed-pressure"
  | "phase-reservoir-capacity-gain18-fixed-pressure";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly geometryGainMl: number;
  readonly geometryCoupling: "none" | "stretch" | "capacity" | "phase-reservoir-capacity";
  readonly pulmonaryVenousBoundaryMode: "fixed-pressure" | "compliance-node";
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly geometryGainMl: number;
  readonly geometryCoupling: "none" | "stretch" | "capacity" | "phase-reservoir-capacity";
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly transactionConvergedCount: number;
  readonly maxTransactionResidualNormMl: number;
  readonly maxAtrialGeometryDeltaMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly aPrimePeakAbsCmPerSec: number;
  readonly laPvLobeQualityPass: boolean;
  readonly laPvSelfIntersections: number;
  readonly laPvALoopArea: number;
  readonly laPvVLoopArea: number;
  readonly laPvLobesOpposed: boolean;
  readonly laPvVolumeSeparationMl: number;
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
  readonly hiddenVolumeCleanCount: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly laPvSelfIntersectionCount: number;
  readonly laPvOpposedLobeCount: number;
  readonly maxLaPvALoopArea: number;
  readonly maxLaPvVLoopArea: number;
  readonly maxLaPvVolumeSeparationMl: number;
  readonly meanMaxAtrialGeometryDeltaMl: number;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxTransactionResidualNormMl: number;
};

export type StatefulAtrialGeometryTransactionReportV1 = {
  readonly reportId: typeof STATEFUL_ATRIAL_GEOMETRY_TRANSACTION_REPORT_ID_V1;
  readonly gateId: "statefulAtrialGeometryTransactionV1";
  readonly transactionMode:
    "left-heart-stateful-effective-geometry-transaction-no-runtime";
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
    readonly bestHiddenVolumeCleanCount: number;
    readonly bestAPrimeReadbackPresentCount: number;
  };
  readonly decision: {
    readonly statefulAtrialGeometryTransactionStatus:
      | "stateful-atrial-geometry-transaction-signal"
      | "stateful-atrial-geometry-transaction-mixed"
      | "stateful-atrial-geometry-transaction-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimePhysiologyClaim: false;
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
    variantId: "no-geometry-fixed-pressure",
    geometryGainMl: 0,
    geometryCoupling: "none",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "stretch-geometry-gain06-fixed-pressure",
    geometryGainMl: 6,
    geometryCoupling: "stretch",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "stretch-geometry-gain12-fixed-pressure",
    geometryGainMl: 12,
    geometryCoupling: "stretch",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "stretch-geometry-gain18-fixed-pressure",
    geometryGainMl: 18,
    geometryCoupling: "stretch",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "capacity-geometry-gain06-fixed-pressure",
    geometryGainMl: 6,
    geometryCoupling: "capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "capacity-geometry-gain12-fixed-pressure",
    geometryGainMl: 12,
    geometryCoupling: "capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "capacity-geometry-gain18-fixed-pressure",
    geometryGainMl: 18,
    geometryCoupling: "capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "capacity-geometry-gain12-pv-compliance-fp6",
    geometryGainMl: 12,
    geometryCoupling: "capacity",
    pulmonaryVenousBoundaryMode: "compliance-node",
    transactionIterations: 6,
    transactionRelaxation: 0.35,
  },
  {
    variantId: "phase-reservoir-capacity-gain06-fixed-pressure",
    geometryGainMl: 6,
    geometryCoupling: "phase-reservoir-capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "phase-reservoir-capacity-gain12-fixed-pressure",
    geometryGainMl: 12,
    geometryCoupling: "phase-reservoir-capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
  {
    variantId: "phase-reservoir-capacity-gain18-fixed-pressure",
    geometryGainMl: 18,
    geometryCoupling: "phase-reservoir-capacity",
    pulmonaryVenousBoundaryMode: "fixed-pressure",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
  },
];

export function runStatefulAtrialGeometryTransactionBenchV1():
StatefulAtrialGeometryTransactionReportV1 {
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
    ? "stateful-atrial-geometry-transaction-signal"
    : bestVariant.laPvLobeQualityPass > 1 || bestVariant.sourceSurfacePass >= 5
      ? "stateful-atrial-geometry-transaction-mixed"
      : "stateful-atrial-geometry-transaction-blocked";
  return {
    reportId: STATEFUL_ATRIAL_GEOMETRY_TRANSACTION_REPORT_ID_V1,
    gateId: "statefulAtrialGeometryTransactionV1",
    transactionMode: "left-heart-stateful-effective-geometry-transaction-no-runtime",
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
      bestHiddenVolumeCleanCount: bestVariant.hiddenVolumeCleanCount,
      bestAPrimeReadbackPresentCount: bestVariant.aPrimeReadbackPresentCount,
    },
    decision: {
      statefulAtrialGeometryTransactionStatus: status,
      nextAction: status === "stateful-atrial-geometry-transaction-signal"
        ? "Proceed only to source-aware four-chamber review. Runtime and physiology claims remain blocked."
        : status === "stateful-atrial-geometry-transaction-mixed"
          ? "Keep runtime blocked. Use this geometry transaction signal to classify lobe-quality and MVF residuals before any broader AV-plane claim."
          : "Keep AV-plane/runtime promotion blocked; this geometry transaction surface is still insufficient.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      LandAtrialUnlock: false,
    },
  };
}

function applyVariant(params: LeftHeartSubsystemParamsV2, variant: VariantV1): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow",
    laEffectiveGeometryMode: variant.geometryCoupling === "stretch"
      ? "lv-shortening-stretch-volume-shadow"
      : variant.geometryCoupling === "capacity"
        ? "lv-shortening-capacity-volume-shadow"
        : variant.geometryCoupling === "phase-reservoir-capacity"
          ? "phase-reservoir-capacity-volume-shadow"
          : "none",
    laEffectiveGeometryGainMl: variant.geometryGainMl,
    laEffectiveGeometryVelocityScaleCmPerSec: 1.5,
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
  const aPrimeValues = candidateBeat
    .map((sample) => sample.laAPrimeProxyCmPerSec)
    .filter((value): value is number => value != null);
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    geometryGainMl: variant.geometryGainMl,
    geometryCoupling: variant.geometryCoupling,
    mvForwardPeakCount: positivePeakCount(candidateQmv),
    mvC1ContinuityScore: round(shape.c1ContinuityScore),
    mvForwardVolumeRatio: round(forwardFlowVolume(candidateQmv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, dtSec), 1e-9)),
    aovForwardVolumeRatio: round(forwardFlowVolume(candidateAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, dtSec), 1e-9)),
    maxMassResidualAbsMl: round(maxAbs(candidateBeat.map((sample) => sample.massResidualMl))),
    clampCount: candidate.clampCount,
    baselineClampCount: baseline.clampCount,
    transactionConvergedCount: candidateBeat.filter((sample) => sample.transactionConverged01 === 1).length,
    maxTransactionResidualNormMl: round(maxAbs(candidateBeat.map((sample) => sample.transactionResidualNormMl))),
    maxAtrialGeometryDeltaMl: round(Math.max(0, ...candidateBeat.map((sample) => sample.laEffectiveGeometryDeltaMl))),
    maxHiddenBloodVolumeSourceMl: round(maxAbs(candidateBeat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl))),
    aPrimeReadbackPresent: aPrimeValues.length > 0,
    aPrimePeakAbsCmPerSec: round(maxAbs(aPrimeValues)),
    ...laPvQualityFor(candidateBeat),
  };
  const sourceFailures = sourceSurfaceFailureReasons(base, candidateBeat.length);
  const contractFailures = [
    ...sourceFailures,
    ...(base.laPvLobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(base.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
    ...(variant.geometryGainMl === 0 || base.aPrimeReadbackPresent ? [] : ["missing-a-prime-readback"]),
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
  readonly laPvSelfIntersections: number;
  readonly laPvALoopArea: number;
  readonly laPvVLoopArea: number;
  readonly laPvLobesOpposed: boolean;
  readonly laPvVolumeSeparationMl: number;
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
    laPvSelfIntersections: selfIntersections,
    laPvALoopArea: round(aLoopArea),
    laPvVLoopArea: round(vLoopArea),
    laPvLobesOpposed: opposed,
    laPvVolumeSeparationMl: round(volumeSeparation),
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
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    laPvSelfIntersectionCount: rows.filter((row) => row.laPvSelfIntersections >= 1).length,
    laPvOpposedLobeCount: rows.filter((row) => row.laPvLobesOpposed).length,
    maxLaPvALoopArea: round(Math.max(0, ...rows.map((row) => row.laPvALoopArea))),
    maxLaPvVLoopArea: round(Math.max(0, ...rows.map((row) => row.laPvVLoopArea))),
    maxLaPvVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.laPvVolumeSeparationMl))),
    meanMaxAtrialGeometryDeltaMl: round(mean(rows.map((row) => row.maxAtrialGeometryDeltaMl))),
    maxAPrimePeakAbsCmPerSec: round(Math.max(0, ...rows.map((row) => row.aPrimePeakAbsCmPerSec))),
    maxTransactionResidualNormMl: round(Math.max(0, ...rows.map((row) => row.maxTransactionResidualNormMl))),
  };
}

function compareSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.contractPass - a.contractPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.laPvLobeQualityPass - a.laPvLobeQualityPass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.hiddenVolumeCleanCount - a.hiddenVolumeCleanCount;
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

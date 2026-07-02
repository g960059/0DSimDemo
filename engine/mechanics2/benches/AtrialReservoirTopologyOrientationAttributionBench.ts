import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  applyAtrialTwoStateReservoirTransactionVariantV1,
  ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1,
  type AtrialTwoStateReservoirTransactionVariantIdV1,
} from "@/engine/mechanics2/benches/AtrialTwoStateReservoirTransactionBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_RESERVOIR_TOPOLOGY_ORIENTATION_ATTRIBUTION_REPORT_ID_V1 =
  "atrial-reservoir-topology-orientation-attribution-report-v1" as const;

type OrientationAxisIdV1 =
  | "blood-volume"
  | "cavity-plus-capacity"
  | "effective-stretch-minus-capacity";

type OrientationAxisMetricV1 = {
  readonly axisId: OrientationAxisIdV1;
  readonly selfIntersections: number;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly signedALoopArea: number;
  readonly signedVLoopArea: number;
  readonly opposedSignedLobes: boolean;
  readonly volumeSeparationMl: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: AtrialTwoStateReservoirTransactionVariantIdV1;
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly sourceFailureReasons: readonly string[];
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly hiddenVolumeClean: boolean;
  readonly maxGeometryDeltaMl: number;
  readonly maxReservoirRecoilPressureMmHg: number;
  readonly bloodVolumeAxis: OrientationAxisMetricV1;
  readonly cavityPlusCapacityAxis: OrientationAxisMetricV1;
  readonly effectiveStretchAxis: OrientationAxisMetricV1;
};

type VariantSummaryV1 = {
  readonly variantId: AtrialTwoStateReservoirTransactionVariantIdV1;
  readonly sourceSurfacePass: number;
  readonly hiddenVolumeCleanCount: number;
  readonly bloodOpposedCount: number;
  readonly cavityPlusCapacityOpposedCount: number;
  readonly effectiveStretchOpposedCount: number;
  readonly sourcePreservingEffectiveStretchOpposedCount: number;
  readonly bloodSelfIntersectionCount: number;
  readonly effectiveStretchSelfIntersectionCount: number;
  readonly maxBloodVLoopArea: number;
  readonly maxEffectiveStretchVLoopArea: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxReservoirRecoilPressureMmHg: number;
};

export type AtrialReservoirTopologyOrientationAttributionReportV1 = {
  readonly reportId: typeof ATRIAL_RESERVOIR_TOPOLOGY_ORIENTATION_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "atrialReservoirTopologyOrientationAttributionV1";
  readonly mode: "left-heart-atrial-reservoir-topology-orientation-attribution-no-runtime";
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly summary: {
    readonly totalRows: number;
    readonly bloodOpposedCount: number;
    readonly cavityPlusCapacityOpposedCount: number;
    readonly effectiveStretchOpposedCount: number;
    readonly sourcePreservingBloodOpposedCount: number;
    readonly sourcePreservingEffectiveStretchOpposedCount: number;
    readonly topologyGapRows: number;
    readonly bestEffectiveStretchVariantId: AtrialTwoStateReservoirTransactionVariantIdV1;
    readonly bestEffectiveStretchOpposedCount: number;
    readonly bestEffectiveStretchSourcePreservingOpposedCount: number;
    readonly bestBloodOpposedCount: number;
    readonly maxBloodVLoopArea: number;
    readonly maxEffectiveStretchVLoopArea: number;
  };
  readonly decision: {
    readonly atrialReservoirTopologyOrientationStatus:
      | "atrial-reservoir-topology-orientation-axis-signal"
      | "atrial-reservoir-topology-orientation-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly hiddenBloodVolumeSource: false;
    readonly relaxAtrialPvGate: false;
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

export function runAtrialReservoirTopologyOrientationAttributionBenchV1():
AtrialReservoirTopologyOrientationAttributionReportV1 {
  const rawParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1[0]!;
  const baselineRuns = rawParamsByProfile.map((params) =>
    runLeftHeartSubsystemV2(applyAtrialTwoStateReservoirTransactionVariantV1(params, baselineVariant))
  );
  const rows = PROFILE_IDS.flatMap((profileId, profileIndex) => {
    const baselineRun = baselineRuns[profileIndex]!;
    return ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1.map((variant) => {
      const run = variant.variantId === "compliance-node-no-avplane"
        ? baselineRun
        : runLeftHeartSubsystemV2(
          applyAtrialTwoStateReservoirTransactionVariantV1(rawParamsByProfile[profileIndex]!, variant),
        );
      return rowForRun(profileId, variant.variantId, baselineRun, run);
    });
  });
  const variantSummaries = ATRIAL_TWO_STATE_RESERVOIR_TRANSACTION_VARIANTS_V1.map((variant) =>
    summarizeVariant(variant.variantId, rows.filter((row) => row.variantId === variant.variantId))
  );
  const bloodOpposedCount = rows.filter((row) => row.bloodVolumeAxis.opposedSignedLobes).length;
  const cavityPlusCapacityOpposedCount =
    rows.filter((row) => row.cavityPlusCapacityAxis.opposedSignedLobes).length;
  const effectiveStretchOpposedCount =
    rows.filter((row) => row.effectiveStretchAxis.opposedSignedLobes).length;
  const sourcePreservingBloodOpposedCount =
    rows.filter((row) => row.sourceSurfaceStatus === "pass" && row.bloodVolumeAxis.opposedSignedLobes).length;
  const sourcePreservingEffectiveStretchOpposedCount =
    rows.filter((row) =>
      row.sourceSurfaceStatus === "pass"
      && row.hiddenVolumeClean
      && row.effectiveStretchAxis.opposedSignedLobes
    ).length;
  const topologyGapRows = rows.filter((row) =>
    !row.bloodVolumeAxis.opposedSignedLobes
    && row.effectiveStretchAxis.opposedSignedLobes
  ).length;
  const bestEffectiveStretch = [...variantSummaries].sort((a, b) =>
    b.sourcePreservingEffectiveStretchOpposedCount - a.sourcePreservingEffectiveStretchOpposedCount
    || b.effectiveStretchOpposedCount - a.effectiveStretchOpposedCount
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.maxEffectiveStretchVLoopArea - a.maxEffectiveStretchVLoopArea
  )[0]!;
  const bestBlood = [...variantSummaries].sort((a, b) =>
    b.bloodOpposedCount - a.bloodOpposedCount
    || b.sourceSurfacePass - a.sourceSurfacePass
  )[0]!;
  const status = bloodOpposedCount === 0 && sourcePreservingEffectiveStretchOpposedCount > 0
    ? "atrial-reservoir-topology-orientation-axis-signal"
    : "atrial-reservoir-topology-orientation-blocked";
  return {
    reportId: ATRIAL_RESERVOIR_TOPOLOGY_ORIENTATION_ATTRIBUTION_REPORT_ID_V1,
    gateId: "atrialReservoirTopologyOrientationAttributionV1",
    mode: "left-heart-atrial-reservoir-topology-orientation-attribution-no-runtime",
    rows,
    variantSummaries,
    summary: {
      totalRows: rows.length,
      bloodOpposedCount,
      cavityPlusCapacityOpposedCount,
      effectiveStretchOpposedCount,
      sourcePreservingBloodOpposedCount,
      sourcePreservingEffectiveStretchOpposedCount,
      topologyGapRows,
      bestEffectiveStretchVariantId: bestEffectiveStretch.variantId,
      bestEffectiveStretchOpposedCount: bestEffectiveStretch.effectiveStretchOpposedCount,
      bestEffectiveStretchSourcePreservingOpposedCount:
        bestEffectiveStretch.sourcePreservingEffectiveStretchOpposedCount,
      bestBloodOpposedCount: bestBlood.bloodOpposedCount,
      maxBloodVLoopArea: round(Math.max(...variantSummaries.map((summary) => summary.maxBloodVLoopArea))),
      maxEffectiveStretchVLoopArea:
        round(Math.max(...variantSummaries.map((summary) => summary.maxEffectiveStretchVLoopArea))),
    },
    decision: {
      atrialReservoirTopologyOrientationStatus: status,
      nextAction: status === "atrial-reservoir-topology-orientation-axis-signal"
        ? "Do not relax the blood-volume LA PV gate. The two-state AV-plane surface creates opposed orientation in an effective wall-stretch coordinate but not in accepted blood volume, so the next design must co-evolve explicit atrial cavity/blood-volume reservoir state instead of adding more pressure/recoil scalars."
        : "Keep atrial promotion blocked and classify the missing v-loop outside simple axis ownership before any AV-plane enablement.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "hidden-blood-volume-source",
        "relax-atrial-pv-gate",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      hiddenBloodVolumeSource: false,
      relaxAtrialPvGate: false,
      LandAtrialUnlock: false,
    },
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantId: AtrialTwoStateReservoirTransactionVariantIdV1,
  baselineRun: ReturnType<typeof runLeftHeartSubsystemV2>,
  run: ReturnType<typeof runLeftHeartSubsystemV2>,
): RowV1 {
  const beat = run.finalBeatSamples;
  const baselineBeat = baselineRun.finalBeatSamples;
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baselineRun.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const core = {
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio: round(
      forwardFlowVolume(qMv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, baselineDtSec), 1e-9),
    ),
    aovForwardVolumeRatio: round(
      forwardFlowVolume(qAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, baselineDtSec), 1e-9),
    ),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baselineRun.clampCount,
  };
  const sourceFailureReasons = sourceSurfaceFailureReasons(core);
  return {
    profileId,
    variantId,
    ...core,
    sourceSurfaceStatus: sourceFailureReasons.length === 0 ? "pass" : "fail",
    sourceFailureReasons,
    hiddenVolumeClean: maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl)) === 0,
    maxGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laReservoirGeometryDeltaMl))),
    maxReservoirRecoilPressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.laReservoirRecoilPressureMmHg))),
    bloodVolumeAxis: orientationAxisMetric("blood-volume", beat, (sample) => sample.acceptedLaVolumeMl),
    cavityPlusCapacityAxis: orientationAxisMetric(
      "cavity-plus-capacity",
      beat,
      (sample) => sample.acceptedLaVolumeMl + sample.laReservoirGeometryDeltaMl,
    ),
    effectiveStretchAxis: orientationAxisMetric(
      "effective-stretch-minus-capacity",
      beat,
      (sample) => sample.acceptedLaVolumeMl - sample.laReservoirGeometryDeltaMl,
    ),
  };
}

function sourceSurfaceFailureReasons(row: Pick<RowV1,
  | "mvForwardPeakCount"
  | "mvC1ContinuityScore"
  | "mvForwardVolumeRatio"
  | "aovForwardVolumeRatio"
  | "maxMassResidualAbsMl"
  | "clampCount"
  | "baselineClampCount"
>): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) {
    failures.push("mv-forward-volume-ratio-wide");
  }
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) {
    failures.push("aov-output-ratio-wide");
  }
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function summarizeVariant(
  variantId: AtrialTwoStateReservoirTransactionVariantIdV1,
  rows: readonly RowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    hiddenVolumeCleanCount: rows.filter((row) => row.hiddenVolumeClean).length,
    bloodOpposedCount: rows.filter((row) => row.bloodVolumeAxis.opposedSignedLobes).length,
    cavityPlusCapacityOpposedCount:
      rows.filter((row) => row.cavityPlusCapacityAxis.opposedSignedLobes).length,
    effectiveStretchOpposedCount:
      rows.filter((row) => row.effectiveStretchAxis.opposedSignedLobes).length,
    sourcePreservingEffectiveStretchOpposedCount:
      rows.filter((row) =>
        row.sourceSurfaceStatus === "pass"
        && row.hiddenVolumeClean
        && row.effectiveStretchAxis.opposedSignedLobes
      ).length,
    bloodSelfIntersectionCount: rows.filter((row) => row.bloodVolumeAxis.selfIntersections > 0).length,
    effectiveStretchSelfIntersectionCount:
      rows.filter((row) => row.effectiveStretchAxis.selfIntersections > 0).length,
    maxBloodVLoopArea: round(Math.max(0, ...rows.map((row) => row.bloodVolumeAxis.vLoopArea))),
    maxEffectiveStretchVLoopArea:
      round(Math.max(0, ...rows.map((row) => row.effectiveStretchAxis.vLoopArea))),
    maxGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxGeometryDeltaMl))),
    maxReservoirRecoilPressureMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxReservoirRecoilPressureMmHg))),
  };
}

function orientationAxisMetric(
  axisId: OrientationAxisIdV1,
  samples: readonly LeftHeartSubsystemSampleV2[],
  axis: (sample: LeftHeartSubsystemSampleV2) => number,
): OrientationAxisMetricV1 {
  const volumes = samples.map(axis);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failureReasons: string[] = [];
  if (selfIntersections < 1) failureReasons.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failureReasons.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failureReasons.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failureReasons.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failureReasons.push("v-loop-not-higher-volume-than-a-loop");
  return {
    axisId,
    selfIntersections,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparation),
    failureReasons,
  };
}

function positivePeakCount(values: readonly number[]): number {
  let count = 0;
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(maxValue * 0.18, 1e-6);
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i]! > threshold && values[i]! >= values[i - 1]! && values[i]! > values[i + 1]!) count++;
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
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(x[i]!, y[i]!, x[i + 1]!, y[i + 1]!, x[j]!, y[j]!, x[j + 1]!, y[j + 1]!)) count++;
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
  const d1 = orientation(ax, ay, bx, by, cx, cy);
  const d2 = orientation(ax, ay, bx, by, dx, dy);
  const d3 = orientation(cx, cy, dx, dy, ax, ay);
  const d4 = orientation(cx, cy, dx, dy, bx, by);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
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

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return 0.5 * area;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

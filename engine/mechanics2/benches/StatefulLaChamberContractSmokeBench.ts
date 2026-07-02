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

export const STATEFUL_LA_CHAMBER_CONTRACT_SMOKE_REPORT_ID_V1 =
  "stateful-la-chamber-contract-smoke-report-v1" as const;

type VariantIdV1 =
  | "baseline-empirical-a-wave"
  | "fiber-active-a-window-gated-shadow"
  | "fiber-chamber-total-pressure-shadow";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly pressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly description: string;
};

type LaPvLobeQualityV1 = {
  readonly selfIntersections: number;
  readonly aLoopAreaProxyMmHgMl: number;
  readonly vLoopAreaProxyMmHgMl: number;
  readonly signedALoopAreaMmHgMl: number;
  readonly signedVLoopAreaMmHgMl: number;
  readonly opposedSignedLobes: boolean;
  readonly vMeanVolumeMinusAMeanVolumeMl: number;
  readonly pressurePulseMmHg: number;
  readonly lobeQualityPass: boolean;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: VariantIdV1;
  readonly pressureSourceMode: LeftAtrialPressureSourceModeV2;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeMl: number;
  readonly baselineMvForwardVolumeMl: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeMl: number;
  readonly baselineAovForwardVolumeMl: number;
  readonly aovForwardVolumeRatio: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxMassResidualAbsMl: number;
  readonly laPvQuality: LaPvLobeQualityV1;
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

export type StatefulLaChamberContractSmokeReportV1 = {
  readonly reportId: typeof STATEFUL_LA_CHAMBER_CONTRACT_SMOKE_REPORT_ID_V1;
  readonly gateId: "statefulLaChamberContractSmokeV1";
  readonly smokeMode:
    "left-heart-stateful-LA-chamber-pressure-source-no-AV-plane-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly selectedVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly selectedVariantId: VariantIdV1;
    readonly selectedSourceSurfacePass: number;
    readonly selectedContractPass: number;
    readonly selectedLaPvLobeQualityPass: number;
    readonly baselineContractPass: number;
    readonly activePulseContractPass: number;
    readonly avPlaneVelocityReadbackPresent: 0;
  };
  readonly decision: {
    readonly statefulLaChamberContractSmokeStatus:
      | "stateful-la-chamber-contract-smoke-signal"
      | "stateful-la-chamber-contract-smoke-mixed"
      | "stateful-la-chamber-contract-smoke-blocked";
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
const SELECTED_VARIANT_ID = "fiber-chamber-total-pressure-shadow" as const;
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
    variantId: "baseline-empirical-a-wave",
    pressureSourceMode: "empirical-a-wave",
    description: "Reference left-heart source surface with empirical LA A-wave pressure.",
  },
  {
    variantId: "fiber-active-a-window-gated-shadow",
    pressureSourceMode: "fiber-active-a-window-gated-shadow",
    description: "Prior active-pulse shadow pressure source that keeps the empirical LA compliance baseline.",
  },
  {
    variantId: SELECTED_VARIANT_ID,
    pressureSourceMode: "fiber-chamber-total-pressure-shadow",
    description: "Stateful LA chamber pressure source: LA volume and fiber wall pressure co-evolve inside the left-heart step, with AV-plane disabled.",
  },
];

export function runStatefulLaChamberContractSmokeBenchV1():
StatefulLaChamberContractSmokeReportV1 {
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = paramsByProfile.map((params) => runLeftHeartSubsystemV2({
    ...params,
    laPressureSourceMode: "empirical-a-wave",
  }));
  const rows = PROFILE_IDS.flatMap((profileId, profileIndex) => {
    const baselineParams = paramsByProfile[profileIndex]!;
    const baselineRun = baselineRuns[profileIndex]!;
    return VARIANTS.map((variant) => {
      const params: LeftHeartSubsystemParamsV2 = {
        ...baselineParams,
        laPressureSourceMode: variant.pressureSourceMode,
      };
      const run = variant.variantId === "baseline-empirical-a-wave"
        ? baselineRun
        : runLeftHeartSubsystemV2(params);
      return rowForRun(profileId, baselineParams.fixtureId, variant, baselineRun, run);
    });
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const selectedVariant = requiredVariantSummary(variantSummaries, SELECTED_VARIANT_ID);
  const baseline = requiredVariantSummary(variantSummaries, "baseline-empirical-a-wave");
  const activePulse = requiredVariantSummary(variantSummaries, "fiber-active-a-window-gated-shadow");
  const status = selectedVariant.contractPass === PROFILE_IDS.length
    ? "stateful-la-chamber-contract-smoke-signal"
    : selectedVariant.sourceSurfacePass >= 5 || selectedVariant.laPvLobeQualityPass > baseline.laPvLobeQualityPass
      ? "stateful-la-chamber-contract-smoke-mixed"
      : "stateful-la-chamber-contract-smoke-blocked";
  return {
    reportId: STATEFUL_LA_CHAMBER_CONTRACT_SMOKE_REPORT_ID_V1,
    gateId: "statefulLaChamberContractSmokeV1",
    smokeMode: "left-heart-stateful-LA-chamber-pressure-source-no-AV-plane-no-runtime",
    variants: VARIANTS,
    rows,
    variantSummaries,
    selectedVariant,
    summary: {
      totalProfiles: 7,
      selectedVariantId: SELECTED_VARIANT_ID,
      selectedSourceSurfacePass: selectedVariant.sourceSurfacePass,
      selectedContractPass: selectedVariant.contractPass,
      selectedLaPvLobeQualityPass: selectedVariant.laPvLobeQualityPass,
      baselineContractPass: baseline.contractPass,
      activePulseContractPass: activePulse.contractPass,
      avPlaneVelocityReadbackPresent: 0,
    },
    decision: {
      statefulLaChamberContractSmokeStatus: status,
      nextAction: status === "stateful-la-chamber-contract-smoke-signal"
        ? "Proceed only to a same-step AV valve/chamber transaction review with AV-plane readback slots still disabled."
        : status === "stateful-la-chamber-contract-smoke-mixed"
          ? "Keep runtime and AV-plane enablement blocked. Use this mixed stateful chamber evidence to classify source-surface versus LA PV lobe residuals before adding AV-plane geometry."
          : "Keep stateful LA chamber pressure-source promotion blocked. The next atrial surface needs explicit chamber/valve co-ownership rather than pressure substitution or AV-plane tuning.",
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
  run: LeftHeartSubsystemRunV2,
): RowV1 {
  const baselineBeat = baseline.finalBeatSamples;
  const beat = run.finalBeatSamples;
  const dtSec = 1 / Math.max(beat.length, 1);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardVolume = forwardFlowVolume(qMv, dtSec);
  const baselineMvForwardVolume = forwardFlowVolume(baselineQmv, dtSec);
  const aovForwardVolume = forwardFlowVolume(qAov, dtSec);
  const baselineAovForwardVolume = forwardFlowVolume(baselineAov, dtSec);
  const base = {
    profileId,
    sourcePointId,
    variantId: variant.variantId,
    pressureSourceMode: variant.pressureSourceMode,
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeMl: round(mvForwardVolume),
    baselineMvForwardVolumeMl: round(baselineMvForwardVolume),
    mvForwardVolumeRatio: round(mvForwardVolume / Math.max(baselineMvForwardVolume, 1e-9)),
    aovForwardVolumeMl: round(aovForwardVolume),
    baselineAovForwardVolumeMl: round(baselineAovForwardVolume),
    aovForwardVolumeRatio: round(aovForwardVolume / Math.max(baselineAovForwardVolume, 1e-9)),
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    laPvQuality: laPvQualityFor(beat),
  };
  const sourceFailures = sourceSurfaceFailureReasons(base);
  const contractFailures = [
    ...sourceFailures,
    ...(base.laPvQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
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

function laPvQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): LaPvLobeQualityV1 {
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
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const pressurePulse = Math.max(...pressures) - Math.min(...pressures);
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const lobeQualityPass = selfIntersections >= 1
    && pressurePulse >= 1.2
    && aLoopArea >= 1.8
    && vLoopArea >= 1.8
    && volumeSeparation >= 1.2
    && opposedSignedLobes;
  const base = {
    selfIntersections,
    aLoopAreaProxyMmHgMl: round(aLoopArea),
    vLoopAreaProxyMmHgMl: round(vLoopArea),
    signedALoopAreaMmHgMl: round(signedALoop),
    signedVLoopAreaMmHgMl: round(signedVLoop),
    opposedSignedLobes,
    vMeanVolumeMinusAMeanVolumeMl: round(volumeSeparation),
    pressurePulseMmHg: round(pressurePulse),
    lobeQualityPass,
  };
  return { ...base, failureReasons: laPvFailureReasons(base) };
}

function laPvFailureReasons(quality: Omit<LaPvLobeQualityV1, "failureReasons">): readonly string[] {
  const failures: string[] = [];
  if (quality.selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (quality.pressurePulseMmHg < 1.2) failures.push("pressure-pulse-too-small");
  if (quality.aLoopAreaProxyMmHgMl < 1.8) failures.push("a-loop-area-too-small");
  if (quality.vLoopAreaProxyMmHgMl < 1.8) failures.push("v-loop-area-too-small");
  if (!quality.opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (quality.vMeanVolumeMinusAMeanVolumeMl < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return failures;
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    laPvLobeQualityPass: rows.filter((row) => row.laPvQuality.lobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    mvForwardVolumeParityCount: rows.filter((row) =>
      row.mvForwardVolumeRatio >= 0.78 && row.mvForwardVolumeRatio <= 1.22
    ).length,
    aovOutputParityCount: rows.filter((row) =>
      row.aovForwardVolumeRatio >= 0.80 && row.aovForwardVolumeRatio <= 1.20
    ).length,
    clampRegressionFreeCount: rows.filter((row) => row.clampCount <= row.baselineClampCount).length,
    massCleanCount: rows.filter((row) => row.maxMassResidualAbsMl <= 0.08).length,
    meanMvForwardVolumeRatio: round(mean(rows.map((row) => row.mvForwardVolumeRatio))),
    meanAovForwardVolumeRatio: round(mean(rows.map((row) => row.aovForwardVolumeRatio))),
  };
}

function requiredVariantSummary(summaries: readonly VariantSummaryV1[], variantId: VariantIdV1): VariantSummaryV1 {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (summary == null) throw new Error(`Missing variant summary ${variantId}`);
  return summary;
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

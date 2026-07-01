import {
  runLeftHeartSubsystemStrategicSmokeV1,
} from "@/engine/mechanics2/benches/LeftHeartSubsystemStrategicSmoke";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  defaultLeftHeartSubsystemParamsV2,
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import { defaultLeftHeartSubsystemParamsV1 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV1";

export const LEFT_HEART_ARCHITECTURE_COMPARISON_REPORT_ID_V1 =
  "left-heart-architecture-comparison-report-v1" as const;

export type LeftHeartArchitecturePointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly sampleCount: number;
  readonly lvPvStatus: "ok" | "fail";
  readonly mvfStatus: "ok" | "fail";
  readonly outputStatus: "ok" | "fail";
  readonly lvpPeakMmHg: number | null;
  readonly lvEdvMl: number | null;
  readonly lvEsvMl: number | null;
  readonly strokeVolumeMl: number | null;
  readonly qMvPeakMlPerSec: number | null;
  readonly mvForwardPeakCount: number;
  readonly maxAbsMassResidualMl: number | null;
  readonly clampCount: number;
  readonly maxTransactionResidualNormMl: number | null;
  readonly meanTransactionIterationsUsed: number | null;
  readonly maxSafetyPressureMmHg: number | null;
  readonly lvpShape: ShapeQualityMetricsV1;
  readonly qMvShape: ShapeQualityMetricsV1;
  readonly failureReasons: readonly string[];
};

export type LeftHeartArchitectureVariantResultV1 = {
  readonly variantId: string;
  readonly description: string;
  readonly params: {
    readonly transactionMode: LeftHeartSubsystemParamsV2["transactionMode"];
    readonly transactionIterations: number;
    readonly transactionRelaxation: number;
    readonly volumeSafetyMode: LeftHeartSubsystemParamsV2["volumeSafetyMode"];
  };
  readonly pointResults: readonly LeftHeartArchitecturePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly lvPvOkCount: number;
    readonly mvfOkCount: number;
    readonly outputOkCount: number;
    readonly maxTransactionResidualNormMl: number | null;
    readonly maxSafetyPressureMmHg: number | null;
  };
};

export type LeftHeartArchitectureComparisonReportV1 = {
  readonly reportId: typeof LEFT_HEART_ARCHITECTURE_COMPARISON_REPORT_ID_V1;
  readonly gateId: "leftHeartArchitectureComparisonGateV1";
  readonly baselineV1Summary: ReturnType<typeof runLeftHeartSubsystemStrategicSmokeV1>["summary"];
  readonly variantResults: readonly LeftHeartArchitectureVariantResultV1[];
  readonly decision: {
    readonly architectureSignal: "architecture-scaffold" | "promising" | "no-go";
    readonly requiresOwnerVisualReview: true;
    readonly reason: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly fullMechanicsCore2Investment: false;
    readonly CircAdaptEquivalence: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runLeftHeartArchitectureComparisonBenchV1(): LeftHeartArchitectureComparisonReportV1 {
  const baseline = runLeftHeartSubsystemStrategicSmokeV1();
  const variants = [
    runVariant("v2-explicit-hard", "V2 transaction readbacks with one explicit accepted-state commit and hard safety bounds.", {
      transactionMode: "explicit-single",
      transactionIterations: 1,
      transactionRelaxation: 0.5,
      volumeSafetyMode: "hard-clamp",
    }),
    runVariant("v2-fixed2-hard", "Two-iteration same-step fixed-point candidate/accepted transaction with hard safety bounds.", {
      transactionMode: "fixed-point",
      transactionIterations: 2,
      transactionRelaxation: 0.5,
      volumeSafetyMode: "hard-clamp",
    }),
    runVariant("v2-fixed2-soft", "Two-iteration same-step fixed-point transaction with soft pressure safety and absolute emergency bounds.", {
      transactionMode: "fixed-point",
      transactionIterations: 2,
      transactionRelaxation: 0.5,
      volumeSafetyMode: "soft-pressure",
    }),
  ];
  const bestPass = Math.max(...variants.map((variant) => variant.summary.pass));
  const bestMvf = Math.max(...variants.map((variant) => variant.summary.mvfOkCount));
  const architectureSignal = bestPass >= 5 && bestMvf >= 5 ? "promising" : "architecture-scaffold";
  return {
    reportId: LEFT_HEART_ARCHITECTURE_COMPARISON_REPORT_ID_V1,
    gateId: "leftHeartArchitectureComparisonGateV1",
    baselineV1Summary: baseline.summary,
    variantResults: variants,
    decision: {
      architectureSignal,
      requiresOwnerVisualReview: true,
      reason: architectureSignal === "promising"
        ? "At least one V2 architecture surface improved the deterministic sidecar envelope enough to justify owner visual review."
        : "V2 records the chamber/valve/load ownership contract and exposes residuals, but it has not yet produced morphology acceptance evidence.",
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      fullMechanicsCore2Investment: false,
      CircAdaptEquivalence: false,
      LandAtrialUnlock: false,
    },
  };
}

function runVariant(
  variantId: string,
  description: string,
  overrides: Pick<LeftHeartSubsystemParamsV2, "transactionMode" | "transactionIterations" | "transactionRelaxation" | "volumeSafetyMode">,
): LeftHeartArchitectureVariantResultV1 {
  const pointResults = buildEnvelope(overrides).map(runPoint);
  const pass = pointResults.filter((point) => point.status === "pass").length;
  const fail = pointResults.filter((point) => point.status === "fail").length;
  const inconclusive = pointResults.filter((point) => point.status === "inconclusive").length;
  const lvPvOkCount = pointResults.filter((point) => point.lvPvStatus === "ok").length;
  const mvfOkCount = pointResults.filter((point) => point.mvfStatus === "ok").length;
  const outputOkCount = pointResults.filter((point) => point.outputStatus === "ok").length;
  return {
    variantId,
    description,
    params: overrides,
    pointResults,
    summary: {
      total: pointResults.length,
      pass,
      fail,
      inconclusive,
      lvPvOkCount,
      mvfOkCount,
      outputOkCount,
      maxTransactionResidualNormMl: finiteMaxOrNull(pointResults.map((point) => point.maxTransactionResidualNormMl ?? Number.NaN)),
      maxSafetyPressureMmHg: finiteMaxOrNull(pointResults.map((point) => point.maxSafetyPressureMmHg ?? Number.NaN)),
    },
  };
}

function buildEnvelope(
  overrides: Pick<LeftHeartSubsystemParamsV2, "transactionMode" | "transactionIterations" | "transactionRelaxation" | "volumeSafetyMode">,
): readonly LeftHeartSubsystemParamsV2[] {
  const base = defaultLeftHeartSubsystemParamsV1();
  return [
    defaultLeftHeartSubsystemParamsV2({ ...overrides, fixtureId: "left-heart-normal-hr75", heartRateBpm: 75 }),
    defaultLeftHeartSubsystemParamsV2({ ...overrides, fixtureId: "left-heart-normal-hr90", heartRateBpm: 90 }),
    defaultLeftHeartSubsystemParamsV2({
      ...overrides,
      fixtureId: "left-heart-preload-low",
      laPressureBaselineMmHg: 6,
      laAWaveMmHg: 1.7,
      initialLaVolumeMl: 50,
      initialLvVolumeMl: 112,
      pulmonaryVenousPressureMmHg: 12,
    }),
    defaultLeftHeartSubsystemParamsV2({
      ...overrides,
      fixtureId: "left-heart-preload-high",
      laPressureBaselineMmHg: 10,
      laAWaveMmHg: 2.6,
      initialLaVolumeMl: 66,
      initialLvVolumeMl: 138,
      pulmonaryVenousPressureMmHg: 17,
    }),
    defaultLeftHeartSubsystemParamsV2({
      ...overrides,
      fixtureId: "left-heart-afterload-high",
      rootInitialPressureMmHg: 96,
      rootDownstreamPressureMmHg: 88,
      rootOutResistanceMmHgSecPerMl: 1.25,
    }),
    defaultLeftHeartSubsystemParamsV2({
      ...overrides,
      fixtureId: "left-heart-contractility-low",
      lv: { pressureScale: 0.48, fiber: { ...base.lv.fiber, trefPa: 56_000 } },
    }),
    defaultLeftHeartSubsystemParamsV2({
      ...overrides,
      fixtureId: "left-heart-contractility-high",
      lv: { pressureScale: 0.72, fiber: { ...base.lv.fiber, trefPa: 84_000 } },
    }),
  ];
}

function runPoint(params: LeftHeartSubsystemParamsV2): LeftHeartArchitecturePointResultV1 {
  const run = runLeftHeartSubsystemV2(params);
  const beat = run.finalBeatSamples;
  if (beat.length < 16) return emptyPoint(params.fixtureId, "inconclusive", ["too-few-final-beat-samples"]);
  const lvp = beat.map((sample) => sample.lvpMmHg);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const volumes = beat.map((sample) => sample.lvVolumeMl);
  const safety = beat.map((sample) => Math.max(Math.abs(sample.lvpSafetyMmHg), Math.abs(sample.lapSafetyMmHg)));
  const lvpShape = computeShapeQualityMetricsV1(lvp);
  const qMvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const clampCount = beat.reduce((sum, sample) => sum + sample.volumeClampHit01, 0);
  const edv = finiteMaxOrNull(volumes);
  const esv = finiteMinOrNull(volumes);
  const strokeVolumeMl = edv != null && esv != null ? round(edv - esv) : null;
  const result = {
    pointId: params.fixtureId,
    status: "pass" as const,
    sampleCount: beat.length,
    lvPvStatus: "ok" as const,
    mvfStatus: "ok" as const,
    outputStatus: "ok" as const,
    lvpPeakMmHg: finiteMaxOrNull(lvp),
    lvEdvMl: edv,
    lvEsvMl: esv,
    strokeVolumeMl,
    qMvPeakMlPerSec: finiteMaxOrNull(qMv),
    mvForwardPeakCount,
    maxAbsMassResidualMl: finiteMaxOrNull(beat.map((sample) => Math.abs(sample.massResidualMl))),
    clampCount,
    maxTransactionResidualNormMl: finiteMaxOrNull(beat.map((sample) => sample.transactionResidualNormMl)),
    meanTransactionIterationsUsed: finiteMeanOrNull(beat.map((sample) => sample.transactionIterationsUsed)),
    maxSafetyPressureMmHg: finiteMaxOrNull(safety),
    lvpShape,
    qMvShape,
    failureReasons: [],
  };
  const failureReasons = failureReasonsFor(result);
  return {
    ...result,
    lvPvStatus: failureReasons.some((reason) => reason.startsWith("lv-pv") || reason.startsWith("lvp-")) ? "fail" : "ok",
    mvfStatus: failureReasons.some((reason) => reason.startsWith("mvf-")) ? "fail" : "ok",
    outputStatus: failureReasons.some((reason) => reason.startsWith("output-") || reason === "volume-clamp-hit")
      ? "fail"
      : "ok",
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(
  result: Omit<LeftHeartArchitecturePointResultV1, "status" | "failureReasons" | "lvPvStatus" | "mvfStatus" | "outputStatus">,
): readonly string[] {
  const failures: string[] = [];
  if ((result.lvpPeakMmHg ?? 0) < 70) failures.push("output-lvp-too-low");
  if ((result.lvpPeakMmHg ?? 999) > 190) failures.push("output-lvp-too-high");
  if ((result.strokeVolumeMl ?? 0) < 35) failures.push("output-stroke-volume-too-low");
  if ((result.strokeVolumeMl ?? 999) > 110) failures.push("output-stroke-volume-too-high");
  if (result.lvpShape.dominantPeakCount > 1) failures.push("lvp-multipeak");
  if ((result.lvpShape.fwhmFractionOfWindow ?? 0) < 0.08) failures.push("lvp-too-narrow");
  if (result.lvpShape.c1ContinuityScore > 0.35) failures.push("lvp-c1-rough");
  if (result.lvpShape.positiveCurvatureBurden > 0.22) failures.push("lv-pv-positive-curvature-burden");
  if (result.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (result.qMvShape.c1ContinuityScore > 0.38) failures.push("mvf-c1-kink");
  if ((result.maxAbsMassResidualMl ?? 999) > 1e-6) failures.push("output-mass-residual");
  if (result.clampCount > 0) failures.push("volume-clamp-hit");
  return failures;
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(8, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, 10).length;
}

function mergeNearbyPeaks(indices: readonly number[], minSeparation: number): readonly number[] {
  const out: number[] = [];
  for (const index of indices) {
    const last = out.at(-1);
    if (last == null || index - last > minSeparation) out.push(index);
    else if (index > last) out[out.length - 1] = index;
  }
  return out;
}

function emptyPoint(
  pointId: string,
  status: LeftHeartArchitecturePointResultV1["status"],
  failureReasons: readonly string[],
): LeftHeartArchitecturePointResultV1 {
  const emptyShape = computeShapeQualityMetricsV1([]);
  return {
    pointId,
    status,
    sampleCount: 0,
    lvPvStatus: "fail",
    mvfStatus: "fail",
    outputStatus: "fail",
    lvpPeakMmHg: null,
    lvEdvMl: null,
    lvEsvMl: null,
    strokeVolumeMl: null,
    qMvPeakMlPerSec: null,
    mvForwardPeakCount: 0,
    maxAbsMassResidualMl: null,
    clampCount: 0,
    maxTransactionResidualNormMl: null,
    meanTransactionIterationsUsed: null,
    maxSafetyPressureMmHg: null,
    lvpShape: emptyShape,
    qMvShape: emptyShape,
    failureReasons,
  };
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function finiteMinOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.min(...finite)) : null;
}

function finiteMeanOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(finite.reduce((sum, value) => sum + value, 0) / finite.length) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

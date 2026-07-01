import {
  defaultLeftHeartSubsystemParamsV1,
  runLeftHeartSubsystemV1,
  type LeftHeartSubsystemParamsV1,
  type LeftHeartSubsystemSampleV1,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV1";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";

export const LEFT_HEART_SUBSYSTEM_STRATEGIC_SMOKE_REPORT_ID_V1 =
  "left-heart-subsystem-strategic-smoke-report-v1" as const;

export type LeftHeartStrategicSmokePointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly sampleCount: number;
  readonly lvPvStatus: "ok" | "fail";
  readonly mvfStatus: "ok" | "fail";
  readonly outputStatus: "ok" | "fail";
  readonly lvpPeakMmHg: number | null;
  readonly lvpMinMmHg: number | null;
  readonly lvEdvMl: number | null;
  readonly lvEsvMl: number | null;
  readonly strokeVolumeMl: number | null;
  readonly rootPeakMmHg: number | null;
  readonly rootMinMmHg: number | null;
  readonly qMvPeakMlPerSec: number | null;
  readonly qAovPeakMlPerSec: number | null;
  readonly mvForwardPeakCount: number;
  readonly maxAbsMassResidualMl: number | null;
  readonly clampCount: number;
  readonly lvpShape: ShapeQualityMetricsV1;
  readonly qMvShape: ShapeQualityMetricsV1;
  readonly failureReasons: readonly string[];
};

export type LeftHeartSubsystemStrategicSmokeReportV1 = {
  readonly reportId: typeof LEFT_HEART_SUBSYSTEM_STRATEGIC_SMOKE_REPORT_ID_V1;
  readonly gateId: "leftHeartSubsystemStrategicSmokeGateV1";
  readonly pointResults: readonly LeftHeartStrategicSmokePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly lvPvOkCount: number;
    readonly mvfOkCount: number;
    readonly outputOkCount: number;
  };
  readonly decision: {
    readonly strategicSignal: "promising" | "no-go" | "inconclusive";
    readonly requiresOwnerVisualReview: true;
    readonly reason: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly fullMechanicsCore2Investment: false;
    readonly patientScaleCalibration: false;
  };
};

export function runLeftHeartSubsystemStrategicSmokeV1(): LeftHeartSubsystemStrategicSmokeReportV1 {
  const points = buildEnvelope().map(runPoint);
  const pass = points.filter((point) => point.status === "pass").length;
  const fail = points.filter((point) => point.status === "fail").length;
  const inconclusive = points.filter((point) => point.status === "inconclusive").length;
  const lvPvOkCount = points.filter((point) => point.lvPvStatus === "ok").length;
  const mvfOkCount = points.filter((point) => point.mvfStatus === "ok").length;
  const outputOkCount = points.filter((point) => point.outputStatus === "ok").length;
  const strategicSignal = pass >= 5 && lvPvOkCount >= 6 && mvfOkCount >= 5
    ? "promising"
    : fail === points.length
      ? "no-go"
      : "inconclusive";
  return {
    reportId: LEFT_HEART_SUBSYSTEM_STRATEGIC_SMOKE_REPORT_ID_V1,
    gateId: "leftHeartSubsystemStrategicSmokeGateV1",
    pointResults: points,
    summary: {
      total: points.length,
      pass,
      fail,
      inconclusive,
      lvPvOkCount,
      mvfOkCount,
      outputOkCount,
    },
    decision: {
      strategicSignal,
      requiresOwnerVisualReview: true,
      reason: strategicSignal === "promising"
        ? "LeftHeartSubsystemV1 produced a promising deterministic smoke signal; owner visual review is still required before broad investment."
        : strategicSignal === "no-go"
          ? "LeftHeartSubsystemV1 failed the deterministic smoke envelope."
          : "LeftHeartSubsystemV1 produced a mixed smoke signal requiring attribution before broad investment.",
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      fullMechanicsCore2Investment: false,
      patientScaleCalibration: false,
    },
  };
}

function buildEnvelope(): readonly LeftHeartSubsystemParamsV1[] {
  return [
    defaultLeftHeartSubsystemParamsV1({ fixtureId: "left-heart-normal-hr75", heartRateBpm: 75 }),
    defaultLeftHeartSubsystemParamsV1({ fixtureId: "left-heart-normal-hr90", heartRateBpm: 90 }),
    defaultLeftHeartSubsystemParamsV1({
      fixtureId: "left-heart-preload-low",
      laPressureBaselineMmHg: 6,
      laAWaveMmHg: 1.7,
      initialLaVolumeMl: 50,
      initialLvVolumeMl: 112,
      pulmonaryVenousInflowMlPerSec: 74,
    }),
    defaultLeftHeartSubsystemParamsV1({
      fixtureId: "left-heart-preload-high",
      laPressureBaselineMmHg: 10,
      laAWaveMmHg: 2.6,
      initialLaVolumeMl: 66,
      initialLvVolumeMl: 138,
      pulmonaryVenousInflowMlPerSec: 104,
    }),
    defaultLeftHeartSubsystemParamsV1({
      fixtureId: "left-heart-afterload-high",
      rootInitialPressureMmHg: 96,
      rootDownstreamPressureMmHg: 88,
      rootOutResistanceMmHgSecPerMl: 1.25,
    }),
    defaultLeftHeartSubsystemParamsV1({
      fixtureId: "left-heart-contractility-low",
      lv: { pressureScale: 0.48, fiber: { ...defaultLeftHeartSubsystemParamsV1().lv.fiber, trefPa: 56_000 } },
    }),
    defaultLeftHeartSubsystemParamsV1({
      fixtureId: "left-heart-contractility-high",
      lv: { pressureScale: 0.72, fiber: { ...defaultLeftHeartSubsystemParamsV1().lv.fiber, trefPa: 84_000 } },
    }),
  ];
}

function runPoint(params: LeftHeartSubsystemParamsV1): LeftHeartStrategicSmokePointResultV1 {
  const run = runLeftHeartSubsystemV1(params);
  const beat = run.finalBeatSamples;
  if (beat.length < 16) return emptyPoint(params.fixtureId, "inconclusive", ["too-few-final-beat-samples"]);
  const lvp = beat.map((sample) => sample.lvpMmHg);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const volumes = beat.map((sample) => sample.lvVolumeMl);
  const root = beat.map((sample) => sample.rootPressureMmHg);
  const lvpShape = computeShapeQualityMetricsV1(lvp);
  const qMvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const clampCount = beat.reduce((sum, sample) => sum + sample.volumeClampHit01, 0);
  const edv = finiteMaxOrNull(volumes);
  const esv = finiteMinOrNull(volumes);
  const strokeVolumeMl = edv != null && esv != null ? round(edv - esv) : null;
  const maxAbsMassResidualMl = finiteMaxOrNull(beat.map((sample) => Math.abs(sample.massResidualMl)));
  const result = {
    pointId: params.fixtureId,
    status: "pass" as const,
    sampleCount: beat.length,
    lvPvStatus: "ok" as const,
    mvfStatus: "ok" as const,
    outputStatus: "ok" as const,
    lvpPeakMmHg: finiteMaxOrNull(lvp),
    lvpMinMmHg: finiteMinOrNull(lvp),
    lvEdvMl: edv,
    lvEsvMl: esv,
    strokeVolumeMl,
    rootPeakMmHg: finiteMaxOrNull(root),
    rootMinMmHg: finiteMinOrNull(root),
    qMvPeakMlPerSec: finiteMaxOrNull(qMv),
    qAovPeakMlPerSec: finiteMaxOrNull(beat.map((sample) => sample.qAovMlPerSec)),
    mvForwardPeakCount,
    maxAbsMassResidualMl,
    clampCount,
    lvpShape,
    qMvShape,
    failureReasons: [],
  };
  const failureReasons = failureReasonsFor(result);
  const lvPvStatus = failureReasons.some((reason) => reason.startsWith("lv-pv") || reason.startsWith("lvp-"))
    ? "fail"
    : "ok";
  const mvfStatus = failureReasons.some((reason) => reason.startsWith("mvf-")) ? "fail" : "ok";
  const outputStatus = failureReasons.some((reason) => reason.startsWith("output-") || reason === "volume-clamp-hit")
    ? "fail"
    : "ok";
  return {
    ...result,
    lvPvStatus,
    mvfStatus,
    outputStatus,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(
  result: Omit<LeftHeartStrategicSmokePointResultV1, "status" | "failureReasons" | "lvPvStatus" | "mvfStatus" | "outputStatus">,
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
  status: LeftHeartStrategicSmokePointResultV1["status"],
  failureReasons: readonly string[],
): LeftHeartStrategicSmokePointResultV1 {
  const emptyShape = computeShapeQualityMetricsV1([]);
  return {
    pointId,
    status,
    sampleCount: 0,
    lvPvStatus: "fail",
    mvfStatus: "fail",
    outputStatus: "fail",
    lvpPeakMmHg: null,
    lvpMinMmHg: null,
    lvEdvMl: null,
    lvEsvMl: null,
    strokeVolumeMl: null,
    rootPeakMmHg: null,
    rootMinMmHg: null,
    qMvPeakMlPerSec: null,
    qAovPeakMlPerSec: null,
    mvForwardPeakCount: 0,
    maxAbsMassResidualMl: null,
    clampCount: 0,
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

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

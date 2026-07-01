import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  defaultRightHeartSubsystemParamsV2,
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RIGHT_HEART_STRATEGIC_SMOKE_REPORT_ID_V1 =
  "right-heart-strategic-smoke-report-v1" as const;

type BeatSummaryV1 = {
  readonly beat: number;
  readonly strokeVolumeMl: number | null;
  readonly pvEjectedVolumeMl: number | null;
  readonly tvForwardVolumeMl: number | null;
  readonly rvpPeakMmHg: number | null;
  readonly rvpPositiveCurvatureBurden: number | null;
  readonly rvpC1ContinuityScore: number | null;
  readonly qTvPeakMlPerSec: number | null;
  readonly tvForwardPeakCount: number;
  readonly tvC1ContinuityScore: number;
  readonly rvpShape: ShapeQualityMetricsV1;
  readonly qTvShape: ShapeQualityMetricsV1;
  readonly clampCount: number;
  readonly raClampCount: number;
  readonly rvClampCount: number;
  readonly maxSafetyPressureMmHg: number | null;
  readonly maxTvClosureDrive01: number | null;
  readonly tvClosureDriveDutyFraction: number;
  readonly maxPaOutflowStatefulDrive01: number | null;
  readonly maxPaOutResistanceEffectiveMmHgSecPerMl: number | null;
};

export type RightHeartStrategicSmokePointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly finalBeat: BeatSummaryV1 | null;
  readonly previousBeat: BeatSummaryV1 | null;
  readonly dtHalfFinalBeat: BeatSummaryV1 | null;
  readonly repeatability: {
    readonly pvEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly clampDelta: number | null;
    readonly ok: boolean;
  };
  readonly dtSensitivity: {
    readonly pvEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly tvC1ContinuityDelta: number | null;
    readonly outputParityOk: boolean;
    readonly shapeParityOk: boolean;
    readonly ok: boolean;
  };
  readonly classifications: {
    readonly rvPvOk: boolean;
    readonly tvfOk: boolean;
    readonly outputOk: boolean;
    readonly flowCoupled: boolean;
    readonly clampFree: boolean;
    readonly safetyWorkBounded: boolean;
    readonly morphologyOk: boolean;
    readonly cleanLowOutputReserve: boolean;
    readonly highDriveArtifact: boolean;
  };
  readonly rawFailureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly failureReasons: readonly string[];
};

export type RightHeartStrategicSmokeReportV1 = {
  readonly reportId: typeof RIGHT_HEART_STRATEGIC_SMOKE_REPORT_ID_V1;
  readonly gateId: "rightHeartStrategicSmokeGateV1";
  readonly pointResults: readonly RightHeartStrategicSmokePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly rvPvOkCount: number;
    readonly tvfOkCount: number;
    readonly outputOkCount: number;
    readonly repeatabilityOkCount: number;
    readonly dtStableCount: number;
    readonly flowCoupledCount: number;
    readonly clampFreeCount: number;
    readonly safetyWorkBoundedCount: number;
    readonly morphologyOkCount: number;
    readonly phenotypeAcceptedCount: number;
    readonly highDriveArtifactCount: number;
    readonly maxTvClosureDrive01: number | null;
    readonly maxPaOutflowStatefulDrive01: number | null;
  };
  readonly decision: {
    readonly rightHeartGateBStatus: "right-heart-strategic-smoke-pass" | "mixed-signal" | "no-go";
    readonly nextAction: string;
    readonly remainingBlockers: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runRightHeartStrategicSmokeBenchV1(): RightHeartStrategicSmokeReportV1 {
  const pointResults = buildRightHeartStrategicEnvelopeV1().map(runPoint);
  const summary = summarize(pointResults);
  const rightHeartGateBStatus = summary.pass === summary.total
    ? "right-heart-strategic-smoke-pass"
    : summary.pass >= 4 && summary.rvPvOkCount >= 5 && summary.tvfOkCount >= 4
      ? "mixed-signal"
      : "no-go";
  return {
    reportId: RIGHT_HEART_STRATEGIC_SMOKE_REPORT_ID_V1,
    gateId: "rightHeartStrategicSmokeGateV1",
    pointResults,
    summary,
    decision: {
      rightHeartGateBStatus,
      nextAction: rightHeartGateBStatus === "right-heart-strategic-smoke-pass"
        ? "Proceed to a paired left/right MechanicsCore2 smoke before any four-chamber or LandAtrial work."
        : "Stay on right-heart strategic smoke and classify RV PV, TVF, output, clamp, and safety residuals before any four-chamber or LandAtrial work.",
      remainingBlockers: pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.pointId}: ${point.failureReasons.join(",")}`),
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

export function buildRightHeartStrategicEnvelopeV1(): readonly RightHeartSubsystemParamsV2[] {
  const base = defaultRightHeartSubsystemParamsV2();
  return [
    defaultRightHeartSubsystemParamsV2({ fixtureId: "right-heart-normal-hr75", heartRateBpm: 75 }),
    defaultRightHeartSubsystemParamsV2({ fixtureId: "right-heart-normal-hr90", heartRateBpm: 90 }),
    defaultRightHeartSubsystemParamsV2({
      fixtureId: "right-heart-preload-low",
      raPressureBaselineMmHg: 2.8,
      raAWaveMmHg: 1.1,
      initialRaVolumeMl: 40,
      initialRvVolumeMl: 126,
      systemicVenousPressureMmHg: 6.2,
    }),
    defaultRightHeartSubsystemParamsV2({
      fixtureId: "right-heart-preload-high",
      raPressureBaselineMmHg: 5.0,
      raAWaveMmHg: 1.9,
      initialRaVolumeMl: 60,
      initialRvVolumeMl: 158,
      systemicVenousPressureMmHg: 9.2,
    }),
    defaultRightHeartSubsystemParamsV2({
      fixtureId: "right-heart-pulmonary-afterload-high",
      paInitialPressureMmHg: 22,
      paDownstreamPressureMmHg: 14,
      paOutResistanceMmHgSecPerMl: 0.55,
      paOutflowStatefulResistanceGain: 0,
    }),
    defaultRightHeartSubsystemParamsV2({
      fixtureId: "right-heart-contractility-low",
      rv: { pressureScale: 0.40, fiber: { ...base.rv.fiber, trefPa: 42_000 } },
    }),
    defaultRightHeartSubsystemParamsV2({
      fixtureId: "right-heart-contractility-high",
      rv: { pressureScale: 0.48, fiber: { ...base.rv.fiber, trefPa: 60_000 } },
    }),
  ];
}

function runPoint(params: RightHeartSubsystemParamsV2): RightHeartStrategicSmokePointResultV1 {
  const run = runRightHeartSubsystemV2(params);
  const dtHalfRun = runRightHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
  const finalBeatIndex = params.beats - 2;
  const previousBeatIndex = params.beats - 3;
  const finalBeat = summarizeBeat(finalBeatIndex, run.samples.filter((sample) => sample.beat === finalBeatIndex));
  const previousBeat = summarizeBeat(previousBeatIndex, run.samples.filter((sample) => sample.beat === previousBeatIndex));
  const dtHalfFinalBeat = summarizeBeat(finalBeatIndex, dtHalfRun.samples.filter((sample) => sample.beat === finalBeatIndex));
  if (finalBeat == null || previousBeat == null || dtHalfFinalBeat == null) {
    return emptyPoint(params.fixtureId, finalBeat, previousBeat, dtHalfFinalBeat);
  }
  const pvEjectionDeltaMl = Math.abs((finalBeat.pvEjectedVolumeMl ?? 0) - (previousBeat.pvEjectedVolumeMl ?? 0));
  const strokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (previousBeat.strokeVolumeMl ?? 0));
  const clampDelta = Math.abs(finalBeat.clampCount - previousBeat.clampCount);
  const dtPvEjectionDeltaMl = Math.abs((finalBeat.pvEjectedVolumeMl ?? 0) - (dtHalfFinalBeat.pvEjectedVolumeMl ?? 0));
  const dtStrokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (dtHalfFinalBeat.strokeVolumeMl ?? 0));
  const dtTvC1ContinuityDelta = Math.abs(finalBeat.tvC1ContinuityScore - dtHalfFinalBeat.tvC1ContinuityScore);
  const repeatabilityOk = pvEjectionDeltaMl <= 16 && strokeVolumeDeltaMl <= 16 && clampDelta === 0;
  const dtOutputParityOk = dtPvEjectionDeltaMl <= 10 && dtStrokeVolumeDeltaMl <= 10;
  const dtShapeParityOk = dtTvC1ContinuityDelta <= 0.20;
  const classifications = classify(params.fixtureId, finalBeat, repeatabilityOk, dtOutputParityOk && dtShapeParityOk);
  const rawFailureReasons = failureReasonsFor(classifications, finalBeat, repeatabilityOk, dtOutputParityOk, dtShapeParityOk);
  const acceptedPhenotypeReasons = acceptedPhenotypeReasonsFor(classifications);
  const failureReasons = acceptedPhenotypeReasons.length > 0 ? [] : rawFailureReasons;
  return {
    pointId: params.fixtureId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      pvEjectionDeltaMl: round(pvEjectionDeltaMl),
      strokeVolumeDeltaMl: round(strokeVolumeDeltaMl),
      clampDelta,
      ok: repeatabilityOk,
    },
    dtSensitivity: {
      pvEjectionDeltaMl: round(dtPvEjectionDeltaMl),
      strokeVolumeDeltaMl: round(dtStrokeVolumeDeltaMl),
      tvC1ContinuityDelta: round(dtTvC1ContinuityDelta),
      outputParityOk: dtOutputParityOk,
      shapeParityOk: dtShapeParityOk,
      ok: dtOutputParityOk && dtShapeParityOk,
    },
    classifications,
    rawFailureReasons,
    acceptedPhenotypeReasons,
    failureReasons,
  };
}

function summarizeBeat(beat: number, samples: readonly RightHeartSubsystemSampleV2[]): BeatSummaryV1 | null {
  if (samples.length < 16) return null;
  const rvp = samples.map((sample) => sample.rvpMmHg);
  const qTv = samples.map((sample) => sample.qTvMlPerSec);
  const volumes = samples.map((sample) => sample.rvVolumeMl);
  const rvpShape = computeShapeQualityMetricsV1(rvp);
  const qTvShape = computeShapeQualityMetricsV1(qTv);
  return {
    beat,
    strokeVolumeMl: finiteRangeOrNull(volumes),
    pvEjectedVolumeMl: flowIntegral(samples, (sample) => sample.qPvMlPerSec),
    tvForwardVolumeMl: flowIntegral(samples, (sample) => sample.qTvMlPerSec),
    rvpPeakMmHg: finiteMaxOrNull(rvp),
    rvpPositiveCurvatureBurden: round(rvpShape.positiveCurvatureBurden),
    rvpC1ContinuityScore: round(rvpShape.c1ContinuityScore),
    qTvPeakMlPerSec: finiteMaxOrNull(qTv),
    tvForwardPeakCount: positivePeakCount(qTv),
    tvC1ContinuityScore: round(qTvShape.c1ContinuityScore),
    rvpShape,
    qTvShape,
    clampCount: samples.reduce((sum, sample) => sum + sample.volumeClampHit01, 0),
    raClampCount: samples.reduce((sum, sample) => sum + sample.raVolumeClampHit01, 0),
    rvClampCount: samples.reduce((sum, sample) => sum + sample.rvVolumeClampHit01, 0),
    maxSafetyPressureMmHg: finiteMaxOrNull(samples.map((sample) => Math.max(
      Math.abs(sample.rvpSafetyMmHg),
      Math.abs(sample.rapSafetyMmHg),
    ))),
    maxTvClosureDrive01: finiteMaxOrNull(samples.map((sample) => sample.tv.closureDrive01)),
    tvClosureDriveDutyFraction: round(
      samples.filter((sample) => sample.tv.closureDrive01 > 0.05).length / Math.max(samples.length, 1),
    ),
    maxPaOutflowStatefulDrive01: finiteMaxOrNull(samples.map((sample) => sample.paOutflowStatefulDrive01)),
    maxPaOutResistanceEffectiveMmHgSecPerMl: finiteMaxOrNull(samples.map((sample) => sample.paOutResistanceEffectiveMmHgSecPerMl)),
  };
}

function classify(
  pointId: string,
  beat: BeatSummaryV1,
  repeatabilityOk: boolean,
  dtStable: boolean,
): RightHeartStrategicSmokePointResultV1["classifications"] {
  const strokeVolume = beat.strokeVolumeMl ?? 0;
  const pvEjected = beat.pvEjectedVolumeMl ?? 0;
  const rvPvOk =
    (beat.rvpPeakMmHg ?? 0) >= 15
    && (beat.rvpPeakMmHg ?? 999) <= 55
    && beat.rvpShape.dominantPeakCount <= 1
    && (beat.rvpShape.fwhmFractionOfWindow ?? 0) >= 0.07
    && beat.rvpShape.c1ContinuityScore <= 0.42
    && beat.rvpShape.positiveCurvatureBurden <= 0.30;
  const tvfOk =
    (beat.tvForwardPeakCount === 1 || beat.tvForwardPeakCount === 2)
    && beat.tvC1ContinuityScore <= 0.48;
  const outputOk = strokeVolume >= 25 && strokeVolume <= 110 && pvEjected >= 25;
  const flowCoupled = Math.abs(strokeVolume - pvEjected) <= 18;
  const clampFree = beat.clampCount === 0;
  const safetyWorkBounded = (beat.maxSafetyPressureMmHg ?? 999) <= 3.0;
  const morphologyOk = rvPvOk && tvfOk && dtStable && flowCoupled && clampFree && safetyWorkBounded;
  const cleanLowOutputReserve =
    pointId === "right-heart-contractility-low"
    && morphologyOk
    && repeatabilityOk
    && !outputOk
    && pvEjected >= 6;
  const highDriveArtifact =
    pointId === "right-heart-contractility-high"
    && (!rvPvOk || !tvfOk || !flowCoupled || !clampFree || !safetyWorkBounded || !dtStable);
  return {
    rvPvOk,
    tvfOk,
    outputOk,
    flowCoupled,
    clampFree,
    safetyWorkBounded,
    morphologyOk,
    cleanLowOutputReserve,
    highDriveArtifact,
  };
}

function failureReasonsFor(
  classifications: RightHeartStrategicSmokePointResultV1["classifications"],
  beat: BeatSummaryV1,
  repeatabilityOk: boolean,
  dtOutputParityOk: boolean,
  dtShapeParityOk: boolean,
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.rvPvOk) failures.push("rv-pv-shape-or-pressure");
  if (!classifications.tvfOk) failures.push("tvf-shape");
  if (!classifications.outputOk) {
    if ((beat.strokeVolumeMl ?? 0) < 25) failures.push("output-stroke-volume-too-low");
    if ((beat.pvEjectedVolumeMl ?? 0) < 25) failures.push("output-pv-ejected-volume-too-low");
    if ((beat.strokeVolumeMl ?? 999) > 110) failures.push("output-stroke-volume-too-high");
  }
  if (!repeatabilityOk) failures.push("beat-repeatability-failed");
  if (!dtOutputParityOk) failures.push("dt-half-output-parity-failed");
  if (!dtShapeParityOk) failures.push("dt-half-shape-parity-failed");
  if (!classifications.flowCoupled) failures.push("volume-stroke-pv-flow-decoupled");
  if (!classifications.clampFree) failures.push("volume-clamp-hit");
  if (!classifications.safetyWorkBounded) failures.push("safety-pressure-dominant");
  return failures;
}

function acceptedPhenotypeReasonsFor(
  classifications: RightHeartStrategicSmokePointResultV1["classifications"],
): readonly string[] {
  return classifications.cleanLowOutputReserve
    ? ["clean-low-contractility-low-output-phenotype"]
    : [];
}

function summarize(
  pointResults: readonly RightHeartStrategicSmokePointResultV1[],
): RightHeartStrategicSmokeReportV1["summary"] {
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    rvPvOkCount: pointResults.filter((point) => point.classifications.rvPvOk).length,
    tvfOkCount: pointResults.filter((point) => point.classifications.tvfOk).length,
    outputOkCount: pointResults.filter((point) => point.classifications.outputOk).length,
    repeatabilityOkCount: pointResults.filter((point) => point.repeatability.ok).length,
    dtStableCount: pointResults.filter((point) => point.dtSensitivity.ok).length,
    flowCoupledCount: pointResults.filter((point) => point.classifications.flowCoupled).length,
    clampFreeCount: pointResults.filter((point) => point.classifications.clampFree).length,
    safetyWorkBoundedCount: pointResults.filter((point) => point.classifications.safetyWorkBounded).length,
    morphologyOkCount: pointResults.filter((point) => point.classifications.morphologyOk).length,
    phenotypeAcceptedCount: pointResults.filter((point) => point.acceptedPhenotypeReasons.length > 0).length,
    highDriveArtifactCount: pointResults.filter((point) => point.classifications.highDriveArtifact).length,
    maxTvClosureDrive01: finiteMaxOrNull(pointResults.map((point) => point.finalBeat?.maxTvClosureDrive01 ?? Number.NaN)),
    maxPaOutflowStatefulDrive01: finiteMaxOrNull(pointResults.map((point) => point.finalBeat?.maxPaOutflowStatefulDrive01 ?? Number.NaN)),
  };
}

function emptyPoint(
  pointId: string,
  finalBeat: BeatSummaryV1 | null,
  previousBeat: BeatSummaryV1 | null,
  dtHalfFinalBeat: BeatSummaryV1 | null,
): RightHeartStrategicSmokePointResultV1 {
  return {
    pointId,
    status: "inconclusive",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      pvEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      clampDelta: null,
      ok: false,
    },
    dtSensitivity: {
      pvEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      tvC1ContinuityDelta: null,
      outputParityOk: false,
      shapeParityOk: false,
      ok: false,
    },
    classifications: {
      rvPvOk: false,
      tvfOk: false,
      outputOk: false,
      flowCoupled: false,
      clampFree: false,
      safetyWorkBounded: false,
      morphologyOk: false,
      cleanLowOutputReserve: false,
      highDriveArtifact: true,
    },
    rawFailureReasons: ["too-few-beat-samples"],
    acceptedPhenotypeReasons: [],
    failureReasons: ["too-few-beat-samples"],
  };
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(6, 0.12 * maxValue);
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

function flowIntegral(samples: readonly RightHeartSubsystemSampleV2[], accessor: (sample: RightHeartSubsystemSampleV2) => number): number | null {
  if (samples.length < 2) return null;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i]!.tSec - samples[i - 1]!.tSec;
    total += Math.max(0, accessor(samples[i]!)) * Math.max(0, dt);
  }
  return round(total);
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function finiteRangeOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite) - Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

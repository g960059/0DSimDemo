import type { SimSample } from "@/engine/protocol";
import {
  atrialLoopShape,
  lastCompleteBeat,
  localExtrema,
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";

export type MorphologyCheckStatus = "ok" | "warning" | "failed" | "pending";

export const NORMAL_SINUS_MORPHOLOGY_PROFILE_ID = "normal_sinus_default" as const;

export type MorphologyProfileId = typeof NORMAL_SINUS_MORPHOLOGY_PROFILE_ID;

export type MorphologyBadgeId =
  | "lvPv"
  | "rvPv"
  | "laPv"
  | "raPv"
  | "mvf"
  | "tvf"
  | "lapWaveform"
  | "rapWaveform";

export type MorphologyCheckId =
  | "lv-pv-loop"
  | "rv-pv-loop"
  | "la-pv-loop"
  | "ra-pv-loop"
  | "mvf"
  | "tvf"
  | "lap-waveform"
  | "rap-waveform";

export type MorphologyCheckResult = {
  readonly id: MorphologyCheckId;
  readonly label: string;
  readonly status: MorphologyCheckStatus;
  readonly value: number | string | null;
  readonly threshold: string;
  readonly message: string;
  readonly metrics: Record<string, number | null>;
};

export type MorphologyBadgeSummary = Record<MorphologyBadgeId, MorphologyCheckStatus>;

export type MorphologyCheckSummary = {
  readonly version: "morphology-check-v1";
  readonly morphologyProfileId: MorphologyProfileId;
  readonly status: MorphologyCheckStatus;
  readonly checkedBeatSampleCount: number;
  readonly okCount: number;
  readonly warningCount: number;
  readonly failedCount: number;
  readonly badges: MorphologyBadgeSummary;
  readonly results: readonly MorphologyCheckResult[];
};

export type MorphologyCheckOptions = {
  readonly profileId?: MorphologyProfileId;
};

type VentricularSide = "LV" | "RV";
type AtrialSide = "LA" | "RA";
type AvValveSide = "MV" | "TV";

export function morphologyCheckSummaryFromSamples(
  samples: readonly SimSample[],
  options: MorphologyCheckOptions = {},
): MorphologyCheckSummary {
  const profileId = options.profileId ?? NORMAL_SINUS_MORPHOLOGY_PROFILE_ID;
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) {
    const pendingResult: MorphologyCheckResult = {
      id: "lv-pv-loop",
      label: "LV PV loop",
      status: "pending",
      value: null,
      threshold: "one complete beat",
      message: "No complete beat is available for morphology checks.",
      metrics: {},
    };
    return {
      version: "morphology-check-v1",
      morphologyProfileId: profileId,
      status: "pending",
      checkedBeatSampleCount: 0,
      okCount: 0,
      warningCount: 0,
      failedCount: 0,
      badges: badgesFromResults([pendingResult]),
      results: [pendingResult],
    };
  }
  const results: MorphologyCheckResult[] = [
    ventricularPvLoopCheck(beat, "LV"),
    ventricularPvLoopCheck(beat, "RV"),
    atrialPvLoopCheck(beat, "LA"),
    atrialPvLoopCheck(beat, "RA"),
    atrioventricularFlowCheck(beat, "MV"),
    atrioventricularFlowCheck(beat, "TV"),
    atrialPressureTimingCheck(beat, "LA"),
    atrialPressureTimingCheck(beat, "RA"),
  ];
  const failedCount = results.filter((result) => result.status === "failed").length;
  const warningCount = results.filter((result) => result.status === "warning").length;
  const okCount = results.filter((result) => result.status === "ok").length;
  return {
    version: "morphology-check-v1",
    morphologyProfileId: profileId,
    status: failedCount > 0 ? "failed" : warningCount > 0 ? "warning" : "ok",
    checkedBeatSampleCount: beat.length,
    okCount,
    warningCount,
    failedCount,
    badges: badgesFromResults(results),
    results,
  };
}

export function conciseMorphologyMessages(summary: MorphologyCheckSummary): readonly string[] {
  if (summary.status === "ok") return ["Morphology check OK."];
  if (summary.status === "pending") return ["Morphology check pending: complete beat not available."];
  return summary.results
    .filter((result) => result.status !== "ok")
    .map((result) => `${result.label}: ${result.message}`);
}

function ventricularPvLoopCheck(samples: readonly SimSample[], side: VentricularSide): MorphologyCheckResult {
  const id = side === "LV" ? "lv-pv-loop" : "rv-pv-loop";
  const pressureKey = side === "LV" ? "LVP" : "RVP";
  const volumeKey = side === "LV" ? "VLV" : "VRV";
  const flowKey = side === "LV" ? "QAo" : "QPV";
  const flowMax = Math.max(0, ...samples.map((sample) => sample[flowKey]));
  const ejectionThreshold = Math.max(10, 0.08 * flowMax);
  const ejection = samples.filter((sample) => sample[flowKey] > ejectionThreshold);
  if (ejection.length < 8) {
    return {
      id,
      label: `${side} PV loop`,
      status: "failed",
      value: ejection.length,
      threshold: ">= 8 ejection samples",
      message: `${side} ejection segment is too sparse for systolic dome morphology.`,
      metrics: { ejectionSampleCount: ejection.length, ejectionPeakCount: null, ejectionTroughCount: null },
    };
  }

  const pressureSpan = valueRange(ejection.map((sample) => sample[pressureKey]));
  const volumeSpan = valueRange(samples.map((sample) => sample[volumeKey]));
  const prominence = Math.max(side === "LV" ? 4 : 1.2, 0.10 * pressureSpan);
  const ejectionPeakCount = prominentExtremaCount(ejection, pressureKey, "max", prominence);
  const ejectionTroughCount = prominentExtremaCount(ejection, pressureKey, "min", prominence);
  const ejectionRoughness = totalVariation(ejection.map((sample) => sample[pressureKey])) / Math.max(pressureSpan, 1e-6);
  const domeOk = ejectionPeakCount <= 1 && ejectionTroughCount === 0 && ejectionRoughness < 2.4;
  const status: MorphologyCheckStatus = domeOk ? "ok" : "failed";
  return {
    id,
    label: `${side} PV loop`,
    status,
    value: `peaks=${ejectionPeakCount}, troughs=${ejectionTroughCount}, roughness=${round(ejectionRoughness)}`,
    threshold: "systolic pressure dome has <=1 prominent peak, 0 prominent troughs, roughness < 2.4",
    message: domeOk
      ? `${side} systolic PV-loop dome is single-peaked.`
      : `${side} systolic PV-loop dome is not single-peaked; this can produce a double-humped systolic loop.`,
    metrics: {
      ejectionSampleCount: ejection.length,
      ejectionPeakCount,
      ejectionTroughCount,
      ejectionRoughness: round(ejectionRoughness),
      pressureSpan: round(pressureSpan),
      volumeSpan: round(volumeSpan),
    },
  };
}

function atrialPvLoopCheck(samples: readonly SimSample[], side: AtrialSide): MorphologyCheckResult {
  const shape = atrialLoopShape([...samples], side);
  const isLeft = side === "LA";
  const areaMin = isLeft ? 20 : 30;
  const spreadMin = isLeft ? 1.5 : 2;
  const ok = shape.selfIntersections >= 1 && shape.absArea > areaMin && shape.midVolumePressureSpread > spreadMin;
  return {
    id: isLeft ? "la-pv-loop" : "ra-pv-loop",
    label: `${side} PV loop`,
    status: ok ? "ok" : "failed",
    value: `intersections=${shape.selfIntersections}, area=${round(shape.absArea)}`,
    threshold: `intersection >= 1, area > ${areaMin}, mid-volume pressure spread > ${spreadMin}`,
    message: ok
      ? `${side} PV loop has a readable reservoir/booster loop.`
      : `${side} PV loop is not yet a reliable raw figure-eight loop.`,
    metrics: {
      selfIntersections: shape.selfIntersections,
      absArea: round(shape.absArea),
      midVolumePressureSpread: round(shape.midVolumePressureSpread),
    },
  };
}

function atrioventricularFlowCheck(samples: readonly SimSample[], valve: AvValveSide): MorphologyCheckResult {
  const key = valve === "MV" ? "QMV" : "QTV";
  const peaks = positiveValvePeaksDetailed([...samples], key, 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75));
  const aPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08));
  const ePeak = maxPeak(ePeaks);
  const aPeak = maxPeak(aPeaks);
  const extraCount = Math.max(0, diastolic.length - 2);
  const extraPeaks = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value);
  const extraPeak = extraPeaks[0] ?? null;
  const extraPeakRatio = extraPeak && ePeak && ePeak.value > 1e-9 ? extraPeak.value / ePeak.value : null;
  const aOverE = ePeak && aPeak && ePeak.value > 1e-9 ? aPeak.value / ePeak.value : null;
  const ok = Boolean(ePeak && aPeak) && extraCount === 0;
  return {
    id: valve === "MV" ? "mvf" : "tvf",
    label: valve === "MV" ? "MVF" : "TVF",
    status: ok ? "ok" : "failed",
    value: `peaks=${diastolic.length}, extra=${extraCount}, A/E=${aOverE == null ? "n/a" : round(aOverE)}`,
    threshold: "normal sinus AV inflow has one E wave, one A wave, and no third forward wave",
    message: ok
      ? `${valve} inflow is biphasic with E and A waves.`
      : `${valve} inflow is not cleanly biphasic; extra or missing waves are present.`,
    metrics: {
      diastolicPeakCount: diastolic.length,
      ePeakTheta: ePeak?.theta == null ? null : round(ePeak.theta),
      aPeakTheta: aPeak?.theta == null ? null : round(aPeak.theta),
      ePeak: ePeak?.value == null ? null : round(ePeak.value),
      aPeak: aPeak?.value == null ? null : round(aPeak.value),
      aOverE: aOverE == null ? null : round(aOverE),
      extraPeakCount: extraCount,
      extraPeakTheta: extraPeak?.theta == null ? null : round(extraPeak.theta),
      extraPeakProminenceRatio: extraPeakRatio == null ? null : round(extraPeakRatio),
    },
  };
}

function atrialPressureTimingCheck(samples: readonly SimSample[], side: AtrialSide): MorphologyCheckResult {
  const isLeft = side === "LA";
  const pressureKey = isLeft ? "LAP" : "RAP";
  const activeKey = isLeft ? "aLA" : "aRA";
  const id = isLeft ? "lap-waveform" : "rap-waveform";
  const pressureRange = valueRange(samples.map((sample) => sample[pressureKey]));
  const prominence = Math.max(isLeft ? 0.35 : 0.45, 0.12 * pressureRange);
  const pressurePeaks = localExtrema([...samples], pressureKey, "max", prominence);
  const pressureTroughs = localExtrema([...samples], pressureKey, "min", prominence);
  const aWave = maxPeak(pressurePeaks.filter((peak) => phaseInWindow(peak.theta, 0.82, 0.10)));
  const vWave = maxPeak(pressurePeaks.filter((peak) => phaseInWindow(peak.theta, 0.28, 0.68)));
  const xDescent = minPeak(pressureTroughs.filter((peak) => phaseInWindow(peak.theta, 0.18, 0.58)));
  const yDescent = minPeak(pressureTroughs.filter((peak) => phaseInWindow(peak.theta, 0.52, 0.86)));
  const activePeak = samples.reduce((best, sample) => sample[activeKey] > best[activeKey] ? sample : best, samples[0]);
  const activePeakTheta = phaseOf(activePeak);
  const activeTimingOk = phaseInWindow(activePeakTheta, 0.80, 0.10);
  const pressureReadable = Boolean(aWave && vWave && xDescent && yDescent);
  const extremaOk = pressurePeaks.length <= 3 && pressureTroughs.length <= 3;
  const ok = activeTimingOk && pressureReadable && extremaOk;
  return {
    id,
    label: `${side} pressure timing`,
    status: ok ? "ok" : "failed",
    value: `active=${round(activePeakTheta)}, peaks=${pressurePeaks.length}, troughs=${pressureTroughs.length}`,
    threshold: "atrial active peak in theta 0.80-0.10, readable a/v waves and x/y descents, <=3 prominent peaks/troughs",
    message: ok
      ? `${side} pressure timing has readable a/v waves and atrial kick timing.`
      : `${side} pressure timing is not physiologic enough: atrial kick timing or a/v/x/y morphology is off.`,
    metrics: {
      activePeakTheta: round(activePeakTheta),
      aWaveTheta: aWave?.theta == null ? null : round(aWave.theta),
      vWaveTheta: vWave?.theta == null ? null : round(vWave.theta),
      xDescentTheta: xDescent?.theta == null ? null : round(xDescent.theta),
      yDescentTheta: yDescent?.theta == null ? null : round(yDescent.theta),
      pressurePeakCount: pressurePeaks.length,
      pressureTroughCount: pressureTroughs.length,
      pressureRange: round(pressureRange),
    },
  };
}

function prominentExtremaCount(
  samples: readonly SimSample[],
  key: keyof SimSample,
  mode: "max" | "min",
  prominence: number,
): number {
  return localExtrema([...samples], key, mode, prominence).length;
}

function maxPeak(peaks: readonly { theta: number; value: number }[]): { theta: number; value: number } | null {
  return peaks.length === 0
    ? null
    : peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function minPeak(peaks: readonly { theta: number; value: number }[]): { theta: number; value: number } | null {
  return peaks.length === 0
    ? null
    : peaks.reduce((best, peak) => peak.value < best.value ? peak : best, peaks[0]);
}

function valueRange(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.max(...finite) - Math.min(...finite);
}

function totalVariation(values: readonly number[]): number {
  let out = 0;
  for (let i = 1; i < values.length; i++) out += Math.abs(values[i] - values[i - 1]);
  return out;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function badgesFromResults(results: readonly MorphologyCheckResult[]): MorphologyBadgeSummary {
  const defaultStatus: MorphologyCheckStatus = "pending";
  const byId = new Map(results.map((result) => [result.id, result.status]));
  return {
    lvPv: byId.get("lv-pv-loop") ?? defaultStatus,
    rvPv: byId.get("rv-pv-loop") ?? defaultStatus,
    laPv: byId.get("la-pv-loop") ?? defaultStatus,
    raPv: byId.get("ra-pv-loop") ?? defaultStatus,
    mvf: byId.get("mvf") ?? defaultStatus,
    tvf: byId.get("tvf") ?? defaultStatus,
    lapWaveform: byId.get("lap-waveform") ?? defaultStatus,
    rapWaveform: byId.get("rap-waveform") ?? defaultStatus,
  };
}

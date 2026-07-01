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
  | "rap-waveform"
  | "left-av-delay"
  | "right-av-delay";

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
    atrioventricularDelayCheck(beat, "LA"),
    atrioventricularDelayCheck(beat, "RA"),
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
  const domeShape = systolicDomeShape(ejection, pressureKey, volumeKey, side);
  const domeOk = ejectionPeakCount <= 1
    && ejectionTroughCount === 0
    && ejectionRoughness < 2.4
    && domeShape.lateReboundMmHg <= domeShape.lateReboundLimitMmHg
    && domeShape.positiveCurvatureFraction <= domeShape.positiveCurvatureLimit;
  const status: MorphologyCheckStatus = domeOk ? "ok" : "failed";
  return {
    id,
    label: `${side} PV loop`,
    status,
    value: `peaks=${ejectionPeakCount}, troughs=${ejectionTroughCount}, roughness=${round(ejectionRoughness)}, rebound=${round(domeShape.lateReboundMmHg)}mmHg`,
    threshold:
      "systolic pressure dome has <=1 prominent peak, 0 prominent troughs, roughness < 2.4, and no broad mid-ejection valley/rebound",
    message: domeOk
      ? `${side} systolic PV-loop dome is single-peaked without broad rebound.`
      : `${side} systolic PV-loop dome is not a smooth dome; prominent peaks, broad valley/rebound, or positive-curvature segments are present.`,
    metrics: {
      ejectionSampleCount: ejection.length,
      ejectionPeakCount,
      ejectionTroughCount,
      ejectionRoughness: round(ejectionRoughness),
      ejectionLateReboundMmHg: round(domeShape.lateReboundMmHg),
      ejectionLateReboundLimitMmHg: round(domeShape.lateReboundLimitMmHg),
      ejectionLateReboundFraction: round(domeShape.lateReboundFraction),
      ejectionPositiveCurvatureFraction: round(domeShape.positiveCurvatureFraction),
      ejectionPositiveCurvatureLimit: round(domeShape.positiveCurvatureLimit),
      ejectionDomeCoreSampleCount: domeShape.coreSampleCount,
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

function atrioventricularDelayCheck(samples: readonly SimSample[], side: AtrialSide): MorphologyCheckResult {
  const isLeft = side === "LA";
  const id = isLeft ? "left-av-delay" : "right-av-delay";
  const activeKey = isLeft ? "aLA" : "aRA";
  const atrialPressureKey = isLeft ? "LAP" : "RAP";
  const ventricularPressureKey = isLeft ? "LVP" : "RVP";
  const ventricularLabel = isLeft ? "LV" : "RV";
  const beatSeconds = beatDurationSeconds(samples);
  const activePeak = samples.reduce((best, sample) => sample[activeKey] > best[activeKey] ? sample : best, samples[0]);
  const ventricularUpstroke = maxDpDtSample(samples, ventricularPressureKey);
  const atrialPressurePeak = atrialPressureAPeakSample(samples, atrialPressureKey);
  const activeLeadMs = ventricularUpstroke
    ? circularLeadMs(phaseOf(activePeak), phaseOf(ventricularUpstroke), beatSeconds)
    : null;
  const pressureLeadMs = atrialPressurePeak && ventricularUpstroke
    ? circularLeadMs(phaseOf(atrialPressurePeak), phaseOf(ventricularUpstroke), beatSeconds)
    : null;
  const activeLeadOk = activeLeadMs != null && activeLeadMs >= 45 && activeLeadMs <= 240;
  const pressureLeadOk = pressureLeadMs == null || (pressureLeadMs >= 10 && pressureLeadMs <= 260);
  const ok = activeLeadOk && pressureLeadOk;
  return {
    id,
    label: `${side}-${ventricularLabel} AV delay`,
    status: ok ? "ok" : "failed",
    value: `activeLeadMs=${activeLeadMs == null ? "n/a" : round(activeLeadMs)}, pressureLeadMs=${
      pressureLeadMs == null ? "n/a" : round(pressureLeadMs)
    }`,
    threshold:
      "normal sinus atrial active peak leads ventricular pressure upstroke by 45-240 ms; pressure a-wave lead, if measurable, is 10-260 ms",
    message: ok
      ? `${side} kick is coupled to the ${ventricularLabel} pressure upstroke with plausible AV timing.`
      : `${side} kick is not correctly timed to the ${ventricularLabel} pressure upstroke; AV delay is too short, too long, or not measurable.`,
    metrics: {
      activePeakTheta: round(phaseOf(activePeak)),
      ventricularUpstrokeTheta: ventricularUpstroke ? round(phaseOf(ventricularUpstroke)) : null,
      atrialPressureAPeakTheta: atrialPressurePeak ? round(phaseOf(atrialPressurePeak)) : null,
      activeToVentricularUpstrokeLeadMs: activeLeadMs == null ? null : round(activeLeadMs),
      pressureAToVentricularUpstrokeLeadMs: pressureLeadMs == null ? null : round(pressureLeadMs),
      beatDurationMs: round(beatSeconds * 1000),
    },
  };
}

type DomeShapeMetrics = {
  readonly coreSampleCount: number;
  readonly lateReboundMmHg: number;
  readonly lateReboundLimitMmHg: number;
  readonly lateReboundFraction: number;
  readonly positiveCurvatureFraction: number;
  readonly positiveCurvatureLimit: number;
};

function systolicDomeShape(
  ejection: readonly SimSample[],
  pressureKey: "LVP" | "RVP",
  volumeKey: "VLV" | "VRV",
  side: VentricularSide,
): DomeShapeMetrics {
  const firstVolume = ejection[0]?.[volumeKey] ?? 0;
  const lastVolume = ejection[ejection.length - 1]?.[volumeKey] ?? firstVolume;
  const ejectedVolume = Math.abs(firstVolume - lastVolume);
  const pressureValues = ejection.map((sample) => sample[pressureKey]).filter(Number.isFinite);
  const pressureSpan = valueRange(pressureValues);
  const lateReboundLimitMmHg = Math.max(side === "LV" ? 2.5 : 0.9, 0.035 * pressureSpan);
  const positiveCurvatureLimit = side === "LV" ? 0.16 : 0.20;

  if (ejectedVolume < 1e-6 || ejection.length < 10 || pressureSpan < 1e-6) {
    return {
      coreSampleCount: 0,
      lateReboundMmHg: 0,
      lateReboundLimitMmHg,
      lateReboundFraction: 0,
      positiveCurvatureFraction: 0,
      positiveCurvatureLimit,
    };
  }

  const core = ejection
    .map((sample) => {
      const u = Math.abs(firstVolume - sample[volumeKey]) / ejectedVolume;
      return { u, p: sample[pressureKey] };
    })
    .filter((point) => Number.isFinite(point.u) && Number.isFinite(point.p) && point.u >= 0.08 && point.u <= 0.92)
    .sort((a, b) => a.u - b.u);

  if (core.length < 8) {
    return {
      coreSampleCount: core.length,
      lateReboundMmHg: 0,
      lateReboundLimitMmHg,
      lateReboundFraction: 0,
      positiveCurvatureFraction: 0,
      positiveCurvatureLimit,
    };
  }

  const smoothed = smoothPressureByU(core);
  let lateReboundMmHg = 0;
  for (let i = 0; i < smoothed.length - 2; i++) {
    const point = smoothed[i];
    if (point.u < 0.28 || point.u > 0.82) continue;
    const later = smoothed.slice(i + 1).filter((candidate) => candidate.u >= point.u + 0.08 && candidate.u <= 0.92);
    if (later.length === 0) continue;
    const postMax = Math.max(...later.map((candidate) => candidate.p));
    lateReboundMmHg = Math.max(lateReboundMmHg, postMax - point.p);
  }

  const resampled = resamplePressure(smoothed, 25);
  let positiveCurvature = 0;
  let totalCurvature = 0;
  const curvatureEpsilon = 0.004 * pressureSpan;
  for (let i = 1; i < resampled.length - 1; i++) {
    const secondDiff = resampled[i + 1] - 2 * resampled[i] + resampled[i - 1];
    totalCurvature += Math.abs(secondDiff);
    positiveCurvature += Math.max(0, secondDiff - curvatureEpsilon);
  }
  const positiveCurvatureFraction = positiveCurvature / Math.max(totalCurvature, pressureSpan, 1e-6);

  return {
    coreSampleCount: core.length,
    lateReboundMmHg: Math.max(0, lateReboundMmHg),
    lateReboundLimitMmHg,
    lateReboundFraction: Math.max(0, lateReboundMmHg) / Math.max(pressureSpan, 1e-6),
    positiveCurvatureFraction,
    positiveCurvatureLimit,
  };
}

function smoothPressureByU(points: readonly { readonly u: number; readonly p: number }[]): readonly { readonly u: number; readonly p: number }[] {
  return points.map((point, index) => {
    const start = Math.max(0, index - 2);
    const end = Math.min(points.length, index + 3);
    const window = points.slice(start, end);
    return {
      u: point.u,
      p: window.reduce((sum, entry) => sum + entry.p, 0) / window.length,
    };
  });
}

function resamplePressure(points: readonly { readonly u: number; readonly p: number }[], count: number): readonly number[] {
  if (points.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const target = 0.08 + (0.84 * i) / Math.max(count - 1, 1);
    out.push(interpolatedPressure(points, target));
  }
  return out;
}

function interpolatedPressure(points: readonly { readonly u: number; readonly p: number }[], targetU: number): number {
  if (targetU <= points[0].u) return points[0].p;
  for (let i = 1; i < points.length; i++) {
    const left = points[i - 1];
    const right = points[i];
    if (targetU > right.u) continue;
    const denom = Math.max(right.u - left.u, 1e-9);
    const w = (targetU - left.u) / denom;
    return left.p + w * (right.p - left.p);
  }
  return points[points.length - 1].p;
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

function beatDurationSeconds(samples: readonly SimSample[]): number {
  const ratios: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    const dPhi = samples[i].phi - samples[i - 1].phi;
    if (dt > 0 && dPhi > 1e-9) ratios.push(dt / dPhi);
  }
  if (ratios.length === 0) return 60 / 75;
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 2)];
}

function maxDpDtSample(samples: readonly SimSample[], key: "LVP" | "RVP"): SimSample | null {
  if (samples.length < 2) return null;
  let bestSample: SimSample | null = null;
  let best = -Infinity;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt <= 0) continue;
    const dpdt = (samples[i][key] - samples[i - 1][key]) / dt;
    if (dpdt > best) {
      best = dpdt;
      bestSample = samples[i];
    }
  }
  return bestSample;
}

function atrialPressureAPeakSample(samples: readonly SimSample[], key: "LAP" | "RAP"): SimSample | null {
  const candidates = samples.filter((sample) => phaseInWindow(phaseOf(sample), 0.65, 0.15));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, sample) => sample[key] > best[key] ? sample : best, candidates[0]);
}

function circularLeadMs(fromTheta: number, toTheta: number, beatSeconds: number): number {
  const delta = (toTheta - fromTheta + 1) % 1;
  return delta * beatSeconds * 1000;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function badgesFromResults(results: readonly MorphologyCheckResult[]): MorphologyBadgeSummary {
  const defaultStatus: MorphologyCheckStatus = "pending";
  const byId = new Map(results.map((result) => [result.id, result.status]));
  const combinedStatus = (ids: readonly MorphologyCheckId[]): MorphologyCheckStatus => {
    const statuses = ids.map((id) => byId.get(id) ?? defaultStatus);
    if (statuses.includes("failed")) return "failed";
    if (statuses.includes("warning")) return "warning";
    if (statuses.includes("pending")) return "pending";
    return "ok";
  };
  return {
    lvPv: byId.get("lv-pv-loop") ?? defaultStatus,
    rvPv: byId.get("rv-pv-loop") ?? defaultStatus,
    laPv: byId.get("la-pv-loop") ?? defaultStatus,
    raPv: byId.get("ra-pv-loop") ?? defaultStatus,
    mvf: byId.get("mvf") ?? defaultStatus,
    tvf: byId.get("tvf") ?? defaultStatus,
    lapWaveform: combinedStatus(["lap-waveform", "left-av-delay"]),
    rapWaveform: combinedStatus(["rap-waveform", "right-av-delay"]),
  };
}

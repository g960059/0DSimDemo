import type { SimSample } from "@/engine/protocol";

export type Point = { x: number; y: number };
export type FlowKey = "QMV" | "QAo" | "QTV" | "QPV" | "PVF";
export type ValveFlowKey = "QMV" | "QAo" | "QTV" | "QPV";
export type AtrioventricularFlowKey = "QMV" | "QTV";
export type Peak = { theta: number; value: number };
export type GradientStats = { n: number; mean: number; peak: number };

export type InflowShapeMetrics = {
  ePeak: Peak | null;
  aPeak: Peak | null;
  aOverE: number | null;
  minFlow: number;
  regurgitantFraction: number;
};

export type PulmonaryVenousShapeMetrics = {
  sPeak: Peak | null;
  dPeak: Peak | null;
  arTrough: Peak | null;
  sForwardVolume: number;
  dForwardVolume: number;
  forwardVolume: number;
  reverseVolume: number;
  sFraction: number | null;
  sOverD: number | null;
  reverseFraction: number | null;
};

export type LoopShapeMetrics = {
  selfIntersections: number;
  signedArea: number;
  absArea: number;
  midVolumePressureSpread: number;
};

export type ElastanceShapeMetrics = {
  activePeakTheta: number | null;
  timeVaryingPeakTheta: number | null;
  activeHalfMaxDurationSec: number;
  activeMin: number;
  activeMax: number;
  timeVaryingMax: number;
};

export type LeftFillingRingingMetrics = {
  qmvPeakCount: number;
  qmvEPeakCount: number;
  qmvAPeakCount: number;
  qmvExtraPeakCount: number;
  lapProminentPeakCount: number;
  lapProminentTroughCount: number;
  lapOscillationIndex: number;
  lvFillingEdgeRoughness: number;
  lvFillingEdgeExcess: number;
  lvFillingEdgeCurvature: number;
  lvFillingEdgeReversalCount: number;
};

export function phaseOf(sample: SimSample): number {
  return sample.phi - Math.floor(sample.phi);
}

export function phaseInWindow(theta: number, lo: number, hi: number): boolean {
  return lo <= hi ? theta >= lo && theta < hi : theta >= lo || theta < hi;
}

export function lastCompleteBeat(samples: SimSample[]): SimSample[] {
  const last = samples.at(-1);
  if (!last) return [];
  const beat = Math.floor(last.phi) - 1;
  return samples.filter((sample) => Math.floor(sample.phi) === beat);
}

export function meanOf(samples: SimSample[], key: keyof SimSample): number {
  return samples.reduce((acc, s) => acc + Number(s[key]), 0) / Math.max(samples.length, 1);
}

export function maxSampleBy(samples: SimSample[], key: keyof SimSample): SimSample | null {
  if (samples.length === 0) return null;
  return samples.reduce((best, sample) => Number(sample[key]) > Number(best[key]) ? sample : best, samples[0]);
}

export function sampleInWindowBy(
  samples: SimSample[],
  key: "PVF",
  lo: number,
  hi: number,
  mode: "max" | "min",
): SimSample | null {
  const selected = samples.filter((sample) => phaseInWindow(phaseOf(sample), lo, hi));
  if (selected.length === 0) return null;
  return selected.reduce((best, sample) => {
    return mode === "max"
      ? sample[key] > best[key] ? sample : best
      : sample[key] < best[key] ? sample : best;
  }, selected[0]);
}

export function positiveValvePeaks(samples: SimSample[], key: AtrioventricularFlowKey): Peak[] {
  const peaks: Peak[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1][key];
    const cur = samples[i][key];
    const next = samples[i + 1][key];
    if (cur <= 5 || cur < prev || cur <= next) continue;
    const theta = phaseOf(samples[i]);
    const last = peaks.at(-1);
    if (!last || Math.abs(theta - last.theta) > 0.07) {
      peaks.push({ theta, value: cur });
    } else if (cur > last.value) {
      last.theta = theta;
      last.value = cur;
    }
  }
  return peaks.sort((a, b) => b.value - a.value);
}

export function positiveValvePeakInWindow(
  samples: SimSample[],
  key: AtrioventricularFlowKey,
  lo: number,
  hi: number,
): Peak | null {
  const peaks = positiveValvePeaks(samples, key).filter((peak) => phaseInWindow(peak.theta, lo, hi));
  return peaks.length > 0 ? peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]) : null;
}

export function atrioventricularInflowShape(
  samples: SimSample[],
  key: AtrioventricularFlowKey,
): InflowShapeMetrics {
  const ePeak = positiveValvePeakInWindow(samples, key, 0.30, 0.75);
  const aPeak = positiveValvePeakInWindow(samples, key, 0.85, 0.08);
  return {
    ePeak,
    aPeak,
    aOverE: ePeak && aPeak ? aPeak.value / ePeak.value : null,
    minFlow: Math.min(...samples.map((s) => s[key])),
    regurgitantFraction: regurgitantFraction(samples, key),
  };
}

export function leftFillingRingingShape(samples: SimSample[]): LeftFillingRingingMetrics {
  const qmvPeaks = positiveValvePeaksDetailed(samples, "QMV", 0.12, 20);
  const qmvEPeakCount = qmvPeaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)).length;
  const qmvAPeakCount = qmvPeaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)).length;
  const qmvDiastolicPeakCount = qmvPeaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12)).length;
  const lapRange = valueRange(samples, "LAP");
  const lapProminence = Math.max(0.35, 0.12 * lapRange);
  const lapProminentPeakCount = localExtrema(samples, "LAP", "max", lapProminence).length;
  const lapProminentTroughCount = localExtrema(samples, "LAP", "min", lapProminence).length;
  return {
    qmvPeakCount: qmvDiastolicPeakCount,
    qmvEPeakCount,
    qmvAPeakCount,
    qmvExtraPeakCount: Math.max(0, qmvDiastolicPeakCount - 2),
    lapProminentPeakCount,
    lapProminentTroughCount,
    lapOscillationIndex: oscillationIndex(samples, "LAP"),
    ...lvFillingEdgeShape(samples),
  };
}

export function pulmonaryVenousShape(samples: SimSample[]): PulmonaryVenousShapeMetrics {
  const sSample = sampleInWindowBy(samples, "PVF", 0.05, 0.45, "max");
  const dSample = sampleInWindowBy(samples, "PVF", 0.45, 0.80, "max");
  const arSample = sampleInWindowBy(samples, "PVF", 0.84, 0.98, "min");
  const sForwardVolume = integrateFlow(
    samples.filter((s) => phaseInWindow(phaseOf(s), 0.05, 0.45)),
    "PVF",
    (q) => Math.max(0, q),
  );
  const dForwardVolume = integrateFlow(
    samples.filter((s) => phaseInWindow(phaseOf(s), 0.45, 0.80)),
    "PVF",
    (q) => Math.max(0, q),
  );
  const forwardVolume = integrateFlow(samples, "PVF", (q) => Math.max(0, q));
  const reverseVolume = integrateFlow(samples, "PVF", (q) => Math.max(0, -q));
  const sPlusD = sForwardVolume + dForwardVolume;
  return {
    sPeak: sSample ? { theta: phaseOf(sSample), value: sSample.PVF } : null,
    dPeak: dSample ? { theta: phaseOf(dSample), value: dSample.PVF } : null,
    arTrough: arSample ? { theta: phaseOf(arSample), value: arSample.PVF } : null,
    sForwardVolume,
    dForwardVolume,
    forwardVolume,
    reverseVolume,
    sFraction: sPlusD > 1e-9 ? sForwardVolume / sPlusD : null,
    sOverD: dForwardVolume > 1e-9 ? sForwardVolume / dForwardVolume : null,
    reverseFraction: forwardVolume > 1e-9 ? reverseVolume / forwardVolume : null,
  };
}

export function atrialLoopShape(
  samples: SimSample[],
  side: "LA" | "RA",
): LoopShapeMetrics {
  const volumeKey = side === "LA" ? "VLA" : "VRA";
  const pressureKey = side === "LA" ? "LAP" : "RAP";
  const points = samples.map((s) => ({ x: s[volumeKey], y: s[pressureKey] }));
  const signedArea = loopSignedArea(points);
  return {
    selfIntersections: countSelfIntersections(points),
    signedArea,
    absArea: Math.abs(signedArea),
    midVolumePressureSpread: midVolumePressureSpread(samples, volumeKey, pressureKey),
  };
}

export function elastanceShape(samples: SimSample[], side: "LV" | "RV"): ElastanceShapeMetrics {
  const activeKey = side === "LV" ? "ELV_active" : "ERV_active";
  const timeVaryingKey = side === "LV" ? "ELV_timeVarying" : "ERV_timeVarying";
  const activePeak = maxSampleBy(samples, activeKey);
  const timeVaryingPeak = maxSampleBy(samples, timeVaryingKey);
  const activeValues = samples.map((s) => Number(s[activeKey]));
  const tvValues = samples.map((s) => Number(s[timeVaryingKey]));
  return {
    activePeakTheta: activePeak ? phaseOf(activePeak) : null,
    timeVaryingPeakTheta: timeVaryingPeak ? phaseOf(timeVaryingPeak) : null,
    activeHalfMaxDurationSec: halfMaxDuration(samples, activeKey),
    activeMin: Math.min(...activeValues),
    activeMax: Math.max(...activeValues),
    timeVaryingMax: Math.max(...tvValues),
  };
}

export function transmitralGradientStats(samples: SimSample[], lo: number, hi: number): GradientStats {
  const gradients = samples
    .filter((s) => s.QMV > 5 && phaseInWindow(phaseOf(s), lo, hi))
    .map((s) => Math.max(0, s.LAP - s.LVP));
  if (gradients.length === 0) return { n: 0, mean: 0, peak: 0 };
  return {
    n: gradients.length,
    mean: gradients.reduce((acc, value) => acc + value, 0) / gradients.length,
    peak: Math.max(...gradients),
  };
}

export function preSystolicRvEdp(samples: SimSample[]): number {
  const candidates = samples.filter((s) => phaseInWindow(phaseOf(s), 0.92, 0.04));
  const source = candidates.length > 0 ? candidates : samples;
  return source.reduce((best, s) => s.VRV > best.VRV ? s : best, source[0]).RVP;
}

export function rangeOf(samples: SimSample[], key: "VRV" | "VRA" | "RVP"): [number, number] {
  const values = samples.map((s) => s[key]);
  return [Math.min(...values), Math.max(...values)];
}

export function regurgitantFraction(samples: SimSample[], key: ValveFlowKey): number {
  const forward = integrateFlow(samples, key, (q) => Math.max(0, q));
  const reverse = integrateFlow(samples, key, (q) => Math.max(0, -q));
  return reverse / Math.max(forward, 1e-9);
}

export function integrateFlow(samples: SimSample[], key: FlowKey, transform: (q: number) => number): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (transform(samples[i - 1][key]) + transform(samples[i][key]));
  }
  return area;
}

export function positiveValvePeaksDetailed(
  samples: SimSample[],
  key: AtrioventricularFlowKey,
  relativeThreshold: number,
  absoluteThreshold: number,
): Peak[] {
  const maxFlow = Math.max(0, ...samples.map((s) => s[key]));
  const threshold = Math.max(absoluteThreshold, relativeThreshold * maxFlow);
  const raw: Peak[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1][key];
    const cur = samples[i][key];
    const next = samples[i + 1][key];
    if (cur <= threshold || cur < prev || cur <= next) continue;
    raw.push({ theta: phaseOf(samples[i]), value: cur });
  }
  return mergeNearbyPeaks(raw, 0.045);
}

function mergeNearbyPeaks(peaks: Peak[], minSeparationTheta: number): Peak[] {
  const out: Peak[] = [];
  for (const peak of peaks.sort((a, b) => a.theta - b.theta)) {
    const last = out.at(-1);
    if (!last || Math.abs(peak.theta - last.theta) > minSeparationTheta) {
      out.push({ ...peak });
    } else if (peak.value > last.value) {
      last.theta = peak.theta;
      last.value = peak.value;
    }
  }
  return out;
}

export function localExtrema(samples: SimSample[], key: keyof SimSample, mode: "max" | "min", prominence: number): Peak[] {
  const values = samples.map((s) => Number(s[key]));
  const window = 4;
  const extrema: Peak[] = [];
  for (let i = window; i < samples.length - window; i++) {
    const prev = values[i - 1];
    const cur = values[i];
    const next = values[i + 1];
    const isExtremum = mode === "max" ? cur > prev && cur >= next : cur < prev && cur <= next;
    if (!isExtremum) continue;
    const left = values.slice(i - window, i);
    const right = values.slice(i + 1, i + 1 + window);
    const localProminence = mode === "max"
      ? cur - Math.max(Math.min(...left), Math.min(...right))
      : Math.min(Math.max(...left), Math.max(...right)) - cur;
    if (localProminence < prominence) continue;
    extrema.push({ theta: phaseOf(samples[i]), value: cur });
  }
  return mergeNearbyPeaks(extrema, 0.035);
}

function oscillationIndex(samples: SimSample[], key: keyof SimSample): number {
  if (samples.length < 3) return 0;
  let variation = 0;
  for (let i = 1; i < samples.length; i++) {
    variation += Math.abs(Number(samples[i][key]) - Number(samples[i - 1][key]));
  }
  return variation / Math.max(valueRange(samples, key), 1e-6);
}

function lvFillingEdgeShape(samples: SimSample[]): Pick<LeftFillingRingingMetrics, "lvFillingEdgeRoughness" | "lvFillingEdgeExcess" | "lvFillingEdgeCurvature" | "lvFillingEdgeReversalCount"> {
  const runs = contiguousFillingRuns(samples).filter((run) => run.length >= 5);
  if (runs.length === 0) {
    return {
      lvFillingEdgeRoughness: 0,
      lvFillingEdgeExcess: 0,
      lvFillingEdgeCurvature: 0,
      lvFillingEdgeReversalCount: 0,
    };
  }
  const metrics = runs.map(fillingRunShape);
  return {
    lvFillingEdgeRoughness: Math.max(...metrics.map((m) => m.lvFillingEdgeRoughness)),
    lvFillingEdgeExcess: Math.max(...metrics.map((m) => m.lvFillingEdgeExcess)),
    lvFillingEdgeCurvature: metrics.reduce((acc, m) => acc + m.lvFillingEdgeCurvature, 0),
    lvFillingEdgeReversalCount: metrics.reduce((acc, m) => acc + m.lvFillingEdgeReversalCount, 0),
  };
}

export function contiguousFillingRuns(samples: SimSample[]): SimSample[][] {
  const runs: SimSample[][] = [];
  let current: SimSample[] = [];
  for (const sample of samples) {
    if (sample.QMV > 10 && sample.LVP < 25) {
      current.push(sample);
      continue;
    }
    if (current.length > 0) runs.push(current);
    current = [];
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

function fillingRunShape(filling: SimSample[]): Pick<LeftFillingRingingMetrics, "lvFillingEdgeRoughness" | "lvFillingEdgeExcess" | "lvFillingEdgeCurvature" | "lvFillingEdgeReversalCount"> {
  let pressureVariation = 0;
  let pathLength = 0;
  let curvature = 0;
  let reversalCount = 0;
  let previousSign = 0;
  for (let i = 1; i < filling.length; i++) {
    const dV = filling[i].VLV - filling[i - 1].VLV;
    const dP = filling[i].LVP - filling[i - 1].LVP;
    pressureVariation += Math.abs(dP);
    pathLength += Math.hypot(dV, dP);
    const sign = Math.abs(dP) < 0.05 ? 0 : Math.sign(dP);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) reversalCount++;
    if (sign !== 0) previousSign = sign;
  }
  for (let i = 1; i < filling.length - 1; i++) {
    const ax = filling[i].VLV - filling[i - 1].VLV;
    const ay = filling[i].LVP - filling[i - 1].LVP;
    const bx = filling[i + 1].VLV - filling[i].VLV;
    const by = filling[i + 1].LVP - filling[i].LVP;
    const aLen = Math.hypot(ax, ay);
    const bLen = Math.hypot(bx, by);
    if (aLen < 1e-6 || bLen < 1e-6) continue;
    const cos = clampUnit((ax * bx + ay * by) / (aLen * bLen));
    curvature += Math.acos(cos);
  }
  const pressureSpan = valueRange(filling, "LVP");
  const chordLength = Math.hypot(
    filling.at(-1)!.VLV - filling[0].VLV,
    filling.at(-1)!.LVP - filling[0].LVP,
  );
  return {
    lvFillingEdgeRoughness: pressureVariation / Math.max(pressureSpan, 1e-6),
    lvFillingEdgeExcess: pathLength / Math.max(chordLength, 1e-6),
    lvFillingEdgeCurvature: curvature,
    lvFillingEdgeReversalCount: reversalCount,
  };
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function valueRange(samples: SimSample[], key: keyof SimSample): number {
  const values = samples.map((s) => Number(s[key])).filter(Number.isFinite);
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function halfMaxDuration(samples: SimSample[], key: keyof SimSample): number {
  const values = samples.map((s) => Number(s[key]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const half = min + 0.5 * (max - min);
  let duration = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    const onPrev = Number(Number(samples[i - 1][key]) >= half);
    const onCur = Number(Number(samples[i][key]) >= half);
    duration += 0.5 * (onPrev + onCur) * dt;
  }
  return duration;
}

export function loopSignedArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return 0.5 * area;
}

export function midVolumePressureSpread(
  samples: SimSample[],
  volumeKey: "VLA" | "VRA",
  pressureKey: "LAP" | "RAP",
): number {
  const [vMin, vMax] = [
    Math.min(...samples.map((s) => s[volumeKey])),
    Math.max(...samples.map((s) => s[volumeKey])),
  ];
  const mid = 0.5 * (vMin + vMax);
  const band = 0.12 * Math.max(vMax - vMin, 1e-6);
  const near = samples.filter((s) => Math.abs(s[volumeKey] - mid) <= band);
  const source = near.length >= 2 ? near : samples;
  return Math.max(...source.map((s) => s[pressureKey])) - Math.min(...source.map((s) => s[pressureKey]));
}

export function countSelfIntersections(points: Point[]): number {
  let count = 0;
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue;
      if (segmentsIntersect(
        points[i].x, points[i].y,
        points[i + 1].x, points[i + 1].y,
        points[j].x, points[j].y,
        points[j + 1].x, points[j + 1].y,
      )) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): boolean {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

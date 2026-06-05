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

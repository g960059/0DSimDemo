import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";
import type { SimSample } from "@/engine/protocol";

describe("baseline valve timing", () => {
  const result = runScenario(DEFAULT_PARAMS);
  const beat = lastCompleteBeat(result.samples);

  it("keeps semilunar valve timing independent of MV deadband tuning", () => {
    expect(beat.length).toBeGreaterThan(80);

    const aov = forwardInterval(beat, "QAo", "xiAoV");
    const pv = forwardInterval(beat, "QPV", "xiPV");

    expect(aov.start).toBeGreaterThan(0.10);
    expect(aov.start).toBeLessThan(0.22);
    expect(aov.end).toBeGreaterThan(0.22);
    expect(aov.end).toBeLessThan(0.35);
    expect(aov.peakTheta).toBeGreaterThan(aov.start);
    expect(aov.peakTheta).toBeLessThan(aov.end);
    expect(aov.xiMax).toBeGreaterThan(0.75);
    expect(aov.xiMin).toBeLessThan(0.10);
    expect(regurgitantFraction(beat, "QAo")).toBeLessThan(0.001);

    expect(pv.start).toBeGreaterThan(0.08);
    expect(pv.start).toBeLessThan(0.20);
    expect(pv.end).toBeGreaterThan(0.22);
    expect(pv.end).toBeLessThan(0.36);
    expect(pv.peakTheta).toBeGreaterThan(pv.start);
    expect(pv.peakTheta).toBeLessThan(pv.end);
    expect(pv.xiMax).toBeGreaterThan(0.75);
    expect(pv.xiMin).toBeLessThan(0.10);
    expect(regurgitantFraction(beat, "QPV")).toBeLessThan(0.001);
  });

  it("keeps tricuspid inflow biphasic without MV-deadband-like extra peaks", () => {
    const peaks = positiveValvePeaksDetailed(beat, "QTV", 0.12, 20);
    const ePeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75));
    const aPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08));
    const diastolicPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));

    expect(ePeaks.length).toBe(1);
    expect(aPeaks.length).toBe(1);
    expect(diastolicPeaks.length).toBe(2);
    expect(ePeaks[0].value).toBeGreaterThan(100);
    expect(aPeaks[0].value).toBeGreaterThan(80);
    expect(aPeaks[0].value / ePeaks[0].value).toBeGreaterThan(0.35);
    expect(aPeaks[0].value / ePeaks[0].value).toBeLessThan(1.30);
    expect(regurgitantFraction(beat, "QTV")).toBeLessThan(0.005);
  });

  it("debug observables mirror right-sided valve timing signals", () => {
    const sample = result.core.sample();
    const observables = result.core.debugObservables();

    expect(observables.Q_TV).toBeCloseTo(sample.QTV, 9);
    expect(observables.Q_PV).toBeCloseTo(sample.QPV, 9);
    expect(observables.xiTV).toBeCloseTo(sample.xiTV, 9);
    expect(observables.xiPV).toBeCloseTo(sample.xiPV, 9);
    expect(observables.dP_TV).toBeCloseTo(sample.dP_TV, 9);
    expect(observables.dP_PV).toBeCloseTo(sample.dP_PV, 9);

    const seen = {
      tvMin: Infinity,
      tvMax: -Infinity,
      pvMin: Infinity,
      pvMax: -Infinity,
    };
    for (let i = 0; i < 1200; i++) {
      result.core.step(0.001);
      const o = result.core.debugObservables();
      seen.tvMin = Math.min(seen.tvMin, o.xiTV);
      seen.tvMax = Math.max(seen.tvMax, o.xiTV);
      seen.pvMin = Math.min(seen.pvMin, o.xiPV);
      seen.pvMax = Math.max(seen.pvMax, o.xiPV);
    }

    expect(seen.tvMin).toBeLessThan(0.10);
    expect(seen.tvMax).toBeGreaterThan(0.70);
    expect(seen.pvMin).toBeLessThan(0.10);
    expect(seen.pvMax).toBeGreaterThan(0.70);
  });
});

function phaseOf(sample: SimSample): number {
  return sample.phi - Math.floor(sample.phi);
}

function phaseInWindow(theta: number, lo: number, hi: number): boolean {
  return lo <= hi ? theta >= lo && theta < hi : theta >= lo || theta < hi;
}

function lastCompleteBeat(samples: SimSample[]): SimSample[] {
  const last = samples.at(-1);
  if (!last) return [];
  const beat = Math.floor(last.phi) - 1;
  return samples.filter((sample) => Math.floor(sample.phi) === beat);
}

function forwardInterval(
  samples: SimSample[],
  flowKey: "QAo" | "QPV",
  xiKey: "xiAoV" | "xiPV",
): { start: number; end: number; peakTheta: number; xiMax: number; xiMin: number } {
  const forward = samples.filter((sample) => sample[flowKey] > 5 || sample[xiKey] >= 0.5);
  expect(forward.length).toBeGreaterThan(4);
  const peak = samples.reduce((best, sample) => sample[flowKey] > best[flowKey] ? sample : best, samples[0]);
  return {
    start: phaseOf(forward[0]),
    end: phaseOf(forward.at(-1)!),
    peakTheta: phaseOf(peak),
    xiMax: Math.max(...samples.map((sample) => sample[xiKey])),
    xiMin: Math.min(...samples.map((sample) => sample[xiKey])),
  };
}

function positiveValvePeaksDetailed(
  samples: SimSample[],
  key: "QTV",
  relativeThreshold: number,
  absoluteThreshold: number,
): Array<{ theta: number; value: number }> {
  const maxFlow = Math.max(0, ...samples.map((sample) => sample[key]));
  const threshold = Math.max(absoluteThreshold, relativeThreshold * maxFlow);
  const raw: Array<{ theta: number; value: number }> = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1][key];
    const cur = samples[i][key];
    const next = samples[i + 1][key];
    if (cur <= threshold || cur < prev || cur <= next) continue;
    raw.push({ theta: phaseOf(samples[i]), value: cur });
  }
  return mergeNearbyPeaks(raw, 0.045);
}

function mergeNearbyPeaks(
  peaks: Array<{ theta: number; value: number }>,
  minSeparationTheta: number,
): Array<{ theta: number; value: number }> {
  const out: Array<{ theta: number; value: number }> = [];
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

function regurgitantFraction(samples: SimSample[], key: "QAo" | "QTV" | "QPV"): number {
  const forward = integrateFlow(samples, key, (q) => Math.max(0, q));
  const reverse = integrateFlow(samples, key, (q) => Math.max(0, -q));
  return reverse / Math.max(forward, 1e-9);
}

function integrateFlow(
  samples: SimSample[],
  key: "QAo" | "QTV" | "QPV",
  transform: (q: number) => number,
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (transform(samples[i - 1][key]) + transform(samples[i][key]));
  }
  return area;
}

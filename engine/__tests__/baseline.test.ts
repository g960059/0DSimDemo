import { describe, expect, it } from "vitest";
import { recordValveExtremes, runScenario, summarize } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";
import type { SimSample } from "@/engine/protocol";

/**
 * S0 — Baseline freeze (M0).
 *
 * Captures the current `DEFAULT_PARAMS` (active-stress default) behavior as a
 * change-detector and asserts the §6 invariants. This freezes *current
 * behavior*, not physiological validity (that is M12). See docs/ROADMAP.md.
 */
describe("baseline freeze (active-stress default)", () => {
  const result = runScenario(DEFAULT_PARAMS);
  const { metrics, health, samples } = result;

  it("produces only finite state across the run", () => {
    // numericalStability scans the full state vector (engine/ModelCore.ts);
    // the per-sample loop additionally covers the observable outputs.
    expect(health.numericalStability).toBe("ok");
    for (const s of samples) {
      for (const [k, v] of Object.entries(s)) {
        if (typeof v === "number") expect(Number.isFinite(v), `non-finite ${k}`).toBe(true);
        else expect(typeof v, `unexpected sample field type ${k}`).toBe("string");
      }
    }
  });

  it("conserves total blood volume with the projection controller OFF (< 0.1% / 60s)", () => {
    // The default scenario re-pins TBV every step (projectTBV), which would make
    // a drift check vacuous. Turning the controller OFF exercises the raw
    // integrator's mass conservation — the actual §6 invariant.
    const free = runScenario({ ...DEFAULT_PARAMS, projectTBV: false });
    expect(Math.abs(free.driftPctPer60s)).toBeLessThan(0.1);
  });

  it("opens and closes every valve (dynamics, not just the [0,1] clamp)", () => {
    // Reading post-clamp xi only proves sanitizeState clamps to [0,1]. Instead
    // record min/max over ~2.5 beats and require each valve to actually open
    // and close, which exercises the valve dynamics.
    const ext = recordValveExtremes(result.core, 2.0);
    for (const [name, { min, max }] of Object.entries(ext)) {
      expect(max, `${name} should fully open`).toBeGreaterThan(0.7);
      expect(min, `${name} should fully close`).toBeLessThan(0.1);
      expect(min, `${name} xi >= 0`).toBeGreaterThanOrEqual(0);
      expect(max, `${name} xi <= 1`).toBeLessThanOrEqual(1);
    }
  });

  it("matches long-term left/right flow balance", () => {
    expect(health.leftRightFlowMismatchLMin).toBeLessThan(1.0);
  });

  it("the DEFAULT baseline is roughly physiological (sanity check on defaults only)", () => {
    // NOTE: this is a sanity bound on the *default* scenario, NOT a model
    // invariant — abnormal/pathological scenarios are a primary use case and are
    // expected (and allowed) to fall well outside these ranges.
    expect(metrics.AoPMean).toBeGreaterThan(80);
    expect(metrics.AoPMean).toBeLessThan(100);
    expect(metrics.AoPSys).toBeLessThan(130);
    expect(metrics.AoPDia).toBeLessThan(85);
    expect(metrics.CO_L).toBeGreaterThan(4);
    expect(metrics.CO_L).toBeLessThan(7);
    expect(metrics.PAPMean).toBeGreaterThan(14);
    expect(metrics.PAPMean).toBeLessThan(22);
    expect(metrics.RAPMean).toBeGreaterThan(2);
    expect(metrics.RAPMean).toBeLessThan(5);
    expect(metrics.LAPMean).toBeGreaterThan(6);
    expect(metrics.LAPMean).toBeLessThan(12);
  });

  it("does not present as AS-like in the normal LV/Ao waveform and valve-loss terms", () => {
    const beat = lastCompleteBeat(samples);
    expect(beat.length).toBeGreaterThan(80);

    const lvpPeak = Math.max(...beat.map((s) => s.LVP));
    const aopPeak = Math.max(...beat.map((s) => s.AoP));
    expect(Math.abs(lvpPeak - aopPeak)).toBeLessThan(8);

    const ejection = beat.filter((s) => s.QAo > 50 && s.xiAoV > 0.8);
    expect(ejection.length).toBeGreaterThan(4);
    expect(meanOf(ejection, "xiAoV")).toBeGreaterThan(0.9);
    expect(meanOf(ejection, "AoV_loss_R") + meanOf(ejection, "AoV_loss_B")).toBeLessThan(5);
    expect(metrics.AoVPeakGradient).toBeLessThan(40);
  });

  it("keeps LV passive EDPVR points physiological and avoids pressure-floor diastole", () => {
    const beat = lastCompleteBeat(samples);
    const passive = (v: number) => result.core.passivePressureAt("LV", v);
    expect(passive(60)).toBeGreaterThanOrEqual(0);
    expect(passive(60)).toBeLessThan(2);
    expect(passive(100)).toBeGreaterThan(2);
    expect(passive(100)).toBeLessThan(6);
    expect(passive(120)).toBeGreaterThan(8);
    expect(passive(120)).toBeLessThan(12);
    expect(passive(140)).toBeGreaterThan(18);
    expect(passive(140)).toBeLessThan(28);
    expect(metrics.LVEDPApprox).toBeGreaterThan(8);
    expect(metrics.LVEDPApprox).toBeLessThan(14);
    const lvpMin = Math.min(...beat.map((s) => s.LVP));
    expect(lvpMin).toBeGreaterThan(3);
    expect(lvpMin).toBeLessThan(8);
    expect(beat.reduce((acc, s) => acc + s.LVPressureFloorHit01, 0)).toBe(0);
  });

  it("keeps RV passive EDPVR points in a normal low-pressure corridor", () => {
    const passive = (v: number) => result.core.passivePressureAt("RV", v);
    expect(passive(100)).toBeGreaterThan(0.5);
    expect(passive(100)).toBeLessThan(2.0);
    expect(passive(120)).toBeGreaterThan(1.5);
    expect(passive(120)).toBeLessThan(4.0);
    expect(passive(135)).toBeGreaterThan(2.5);
    expect(passive(135)).toBeLessThan(5.0);
    expect(passive(150)).toBeGreaterThan(3.5);
    expect(passive(150)).toBeLessThan(7.0);
    expect(passive(190)).toBeGreaterThan(7.0);
    expect(passive(190)).toBeLessThan(13.0);
  });

  it("keeps baseline valvular regurgitation negligible across all four valves", () => {
    const beat = lastCompleteBeat(samples);
    expect(regurgitantFraction(beat, "QMV")).toBeLessThan(0.005);
    expect(regurgitantFraction(beat, "QAo")).toBeLessThan(0.001);
    expect(regurgitantFraction(beat, "QTV")).toBeLessThan(0.005);
    expect(regurgitantFraction(beat, "QPV")).toBeLessThan(0.001);
  });

  it("exposes finite active-stress and time-varying reference PV elastance waveforms", () => {
    const beat = lastCompleteBeat(samples);
    for (const key of ["ELV_active", "ERV_active", "ELV_timeVarying", "ERV_timeVarying"] as const) {
      expect(Math.min(...beat.map((s) => s[key]))).toBeGreaterThanOrEqual(0);
      expect(Math.max(...beat.map((s) => s[key]))).toBeGreaterThan(0.05);
      expect(Math.max(...beat.map((s) => s[key]))).toBeLessThan(10);
    }
    const activePeak = maxSampleBy(beat, "ELV_active");
    const tvePeak = maxSampleBy(beat, "ELV_timeVarying");
    expect(phaseOf(activePeak)).toBeGreaterThan(0.26);
    expect(phaseOf(tvePeak) - phaseOf(activePeak)).toBeLessThan(0.20);
    expect(halfMaxDuration(beat, "ELV_active")).toBeGreaterThan(0.12);
    expect(Math.min(...beat.map((s) => s.ELV_active))).toBeGreaterThan(0.035);
    expect(Math.abs(meanOf(beat, "ELV_active") - meanOf(beat, "ELV_timeVarying"))).toBeGreaterThan(0.03);
  });

  it("shows a figure-eight LA PV loop and biphasic MV inflow", () => {
    // SHAPE gate (primary): the LA reservoir reconstruction must yield a
    // clinical figure-8 PV loop (reservoir V-loop + booster A-loop, >=1 self
    // crossing) and a biphasic mitral inflow (E and A waves, no fused single
    // peak), matching Sci Rep 2024 (s41598-024-52327-6) Fig.11. Guards against
    // regressing back to the artificial reservoir-branch loop / 3-peak MVF.
    const beat = lastCompleteBeat(samples);
    expect(beat.length).toBeGreaterThan(80);
    expect(countSelfIntersections(beat.map((s) => ({ x: s.VLA, y: s.LAP })))).toBeGreaterThanOrEqual(1);
    expect(Math.abs(loopSignedArea(beat.map((s) => ({ x: s.VLA, y: s.LAP }))))).toBeGreaterThan(20);
    expect(midVolumePressureSpread(beat, "VLA", "LAP")).toBeGreaterThan(1.5);

    const ePeak = positiveValvePeakInWindow(beat, "QMV", 0.30, 0.75);
    const aPeak = positiveValvePeakInWindow(beat, "QMV", 0.85, 0.08);
    expect(ePeak?.value).toBeGreaterThan(100);
    expect(aPeak?.value).toBeGreaterThan(80);
    expect((aPeak?.value ?? 0) / (ePeak?.value ?? Infinity)).toBeGreaterThan(0.35);
    // no gross mitral regurgitation: only a tiny closure transient remains.
    expect(Math.min(...beat.map((s) => s.QMV))).toBeGreaterThan(-11);
  });

  it("keeps pulmonary venous flow readable as S/D/Ar with limited atrial reversal", () => {
    const beat = lastCompleteBeat(samples);
    expect(beat.length).toBeGreaterThan(80);

    const sPeak = sampleInWindowBy(beat, "PVF", 0.05, 0.45, "max");
    const dPeak = sampleInWindowBy(beat, "PVF", 0.45, 0.80, "max");
    const arTrough = sampleInWindowBy(beat, "PVF", 0.80, 0.10, "min");
    const sTheta = phaseOf(sPeak);
    const dTheta = phaseOf(dPeak);
    const arTheta = phaseOf(arTrough);
    expect(sTheta).toBeGreaterThan(0.15);
    expect(sTheta).toBeLessThan(0.35);
    expect(dTheta).toBeGreaterThan(0.55);
    expect(dTheta).toBeLessThan(0.75);
    expect(phaseInWindow(arTheta, 0.84, 0.96)).toBe(true);

    expect(sPeak.PVF).toBeGreaterThan(120);
    expect(dPeak.PVF).toBeGreaterThan(180);
    expect(dPeak.PVF / sPeak.PVF).toBeLessThan(2.1);
    expect(arTrough.PVF).toBeLessThan(-20);
    // PVF is an integrated model flow, not Doppler velocity. Keep Ar present but
    // bounded by reverse/forward volume below, rather than over-fitting a velocity
    // cutoff to mL/s units.
    expect(arTrough.PVF).toBeGreaterThan(-130);

    const sVolume = integrateFlow(beat.filter((s) => phaseInWindow(phaseOf(s), 0.05, 0.45)), "PVF", (q) => Math.max(0, q));
    const dVolume = integrateFlow(beat.filter((s) => phaseInWindow(phaseOf(s), 0.45, 0.80)), "PVF", (q) => Math.max(0, q));
    const forward = integrateFlow(beat, "PVF", (q) => Math.max(0, q));
    const reverse = integrateFlow(beat, "PVF", (q) => Math.max(0, -q));
    // Normal pulmonary venous S/D balance is condition-dependent; require an S
    // component with a D-dominant baseline while keeping peak and reverse gates.
    expect(sVolume / dVolume).toBeGreaterThan(0.50);
    // Keep atrial reversal visible but minor relative to forward pulmonary
    // venous return; the exact Doppler Ar cutoff is not transferable to mL/s.
    expect(reverse / forward).toBeLessThan(0.075);
  });

  it("keeps normal transmitral gradients low during E and A filling", () => {
    const beat = lastCompleteBeat(samples);
    const allForward = transmitralGradientStats(beat, 0, 1);
    const eWave = transmitralGradientStats(beat, 0.30, 0.75);
    const aWave = transmitralGradientStats(beat, 0.85, 0.08);

    expect(allForward.n).toBeGreaterThan(20);
    expect(allForward.mean).toBeLessThan(3);
    expect(eWave.n).toBeGreaterThan(10);
    expect(eWave.mean).toBeLessThan(4);
    expect(eWave.peak).toBeLessThan(6);
    expect(aWave.n).toBeGreaterThan(5);
    expect(aWave.mean).toBeLessThan(3);
    expect(aWave.peak).toBeLessThan(5);
  });

  it("keeps right-heart baseline physiology in range", () => {
    const beat = lastCompleteBeat(samples);
    expect(beat.length).toBeGreaterThan(80);
    const [rvMin, rvMax] = rangeOf(beat, "VRV");
    const [raMin, raMax] = rangeOf(beat, "VRA");
    const [, rvpMax] = rangeOf(beat, "RVP");

    // metrics.RVEDPApprox is max-volume anchored and can land during early
    // upstroke. The physiology gate uses the pre-systolic window instead.
    expect(preSystolicRvEdp(beat)).toBeGreaterThan(2);
    expect(preSystolicRvEdp(beat)).toBeLessThan(8);
    expect((rvMax - rvMin) / rvMax).toBeGreaterThan(0.45);
    expect(rvpMax).toBeLessThan(45);

    expect(raMax).toBeLessThan(85);
    expect(raMin).toBeGreaterThan(25);
    expect((raMax - raMin) / raMax).toBeGreaterThan(0.44);
  });

  it("shows a figure-eight RA PV loop, biphasic TV inflow, and minimal PV regurgitation", () => {
    const beat = lastCompleteBeat(samples);
    expect(beat.length).toBeGreaterThan(80);
    expect(countSelfIntersections(beat.map((s) => ({ x: s.VRA, y: s.RAP })))).toBeGreaterThanOrEqual(1);
    expect(Math.abs(loopSignedArea(beat.map((s) => ({ x: s.VRA, y: s.RAP }))))).toBeGreaterThan(30);
    expect(midVolumePressureSpread(beat, "VRA", "RAP")).toBeGreaterThan(2);

    const ePeak = positiveValvePeakInWindow(beat, "QTV", 0.30, 0.75);
    const aPeak = positiveValvePeakInWindow(beat, "QTV", 0.85, 0.08);
    expect(ePeak?.value).toBeGreaterThan(100);
    expect(aPeak?.value).toBeGreaterThan(80);
    expect((aPeak?.value ?? 0) / (ePeak?.value ?? Infinity)).toBeGreaterThan(0.35);

    const pvForward = integrateFlow(beat, "QPV", (q) => Math.max(0, q));
    const pvReverse = integrateFlow(beat, "QPV", (q) => Math.max(0, -q));
    expect(pvForward).toBeGreaterThan(40);
    expect(pvReverse / pvForward).toBeLessThan(0.001);
  });

  it("matches the frozen baseline summary", () => {
    const summary = summarize(result);
    // Visible in CI logs for quick inspection of any drift.
    // eslint-disable-next-line no-console
    console.log("BASELINE_SUMMARY", JSON.stringify(summary));
    expect(summary).toMatchSnapshot();
  });
});

function phaseOf(sample: SimSample): number {
  return sample.phi - Math.floor(sample.phi);
}

function lastCompleteBeat(samples: SimSample[]): SimSample[] {
  const last = samples.at(-1);
  if (!last) return [];
  const beat = Math.floor(last.phi) - 1;
  return samples.filter((sample) => Math.floor(sample.phi) === beat);
}

function positiveValvePeaks(samples: SimSample[], key: "QMV" | "QTV"): Array<{ theta: number; value: number }> {
  const peaks: Array<{ theta: number; value: number }> = [];
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

function positiveValvePeakInWindow(
  samples: SimSample[],
  key: "QMV" | "QTV",
  lo: number,
  hi: number,
): { theta: number; value: number } | null {
  const peaks = positiveValvePeaks(samples, key).filter((peak) => phaseInWindow(peak.theta, lo, hi));
  return peaks.length > 0 ? peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]) : null;
}

function phaseInWindow(theta: number, lo: number, hi: number): boolean {
  return lo <= hi ? theta >= lo && theta < hi : theta >= lo || theta < hi;
}

function rangeOf(samples: SimSample[], key: "VRV" | "VRA" | "RVP"): [number, number] {
  const values = samples.map((s) => s[key]);
  return [Math.min(...values), Math.max(...values)];
}

function meanOf(samples: SimSample[], key: keyof SimSample): number {
  return samples.reduce((acc, s) => acc + Number(s[key]), 0) / Math.max(samples.length, 1);
}

function maxSampleBy(samples: SimSample[], key: keyof SimSample): SimSample {
  return samples.reduce((best, sample) => Number(sample[key]) > Number(best[key]) ? sample : best, samples[0]);
}

function sampleInWindowBy(
  samples: SimSample[],
  key: "PVF",
  lo: number,
  hi: number,
  mode: "max" | "min",
): SimSample {
  const selected = samples.filter((sample) => phaseInWindow(phaseOf(sample), lo, hi));
  expect(selected.length).toBeGreaterThan(0);
  return selected.reduce((best, sample) => {
    return mode === "max"
      ? sample[key] > best[key] ? sample : best
      : sample[key] < best[key] ? sample : best;
  }, selected[0]);
}

function halfMaxDuration(samples: SimSample[], key: keyof SimSample): number {
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

function preSystolicRvEdp(samples: SimSample[]): number {
  const candidates = samples.filter((s) => phaseInWindow(phaseOf(s), 0.92, 0.04));
  const source = candidates.length > 0 ? candidates : samples;
  return source.reduce((best, s) => s.VRV > best.VRV ? s : best, source[0]).RVP;
}

function transmitralGradientStats(samples: SimSample[], lo: number, hi: number): { n: number; mean: number; peak: number } {
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

function loopSignedArea(points: Array<{ x: number; y: number }>): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return 0.5 * area;
}

function midVolumePressureSpread(
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

function regurgitantFraction(samples: SimSample[], key: "QMV" | "QAo" | "QTV" | "QPV"): number {
  const forward = integrateFlow(samples, key, (q) => Math.max(0, q));
  const reverse = integrateFlow(samples, key, (q) => Math.max(0, -q));
  return reverse / Math.max(forward, 1e-9);
}

function integrateFlow(samples: SimSample[], key: "QMV" | "QAo" | "QTV" | "QPV" | "PVF", transform: (q: number) => number): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (transform(samples[i - 1][key]) + transform(samples[i][key]));
  }
  return area;
}

function countSelfIntersections(points: Array<{ x: number; y: number }>): number {
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

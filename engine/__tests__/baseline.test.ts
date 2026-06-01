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
    expect(metrics.AoPMean).toBeGreaterThan(55);
    expect(metrics.AoPMean).toBeLessThan(125);
    expect(metrics.CO_L).toBeGreaterThan(2);
    expect(metrics.CO_L).toBeLessThan(10);
    expect(metrics.PAPMean).toBeGreaterThan(5);
    expect(metrics.PAPMean).toBeLessThan(35);
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

    const peaks = positiveMvPeaks(beat);
    expect(peaks.length).toBeGreaterThanOrEqual(2);
    expect(peaks[0].value).toBeGreaterThan(100);
    expect(peaks[1].value).toBeGreaterThan(80);
    expect(peaks[1].value / peaks[0].value).toBeGreaterThan(0.35);
    // no gross mitral regurgitation: only the brief transient closure backflow.
    expect(Math.min(...beat.map((s) => s.QMV))).toBeGreaterThan(-60);
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

function positiveMvPeaks(samples: SimSample[]): Array<{ theta: number; value: number }> {
  const peaks: Array<{ theta: number; value: number }> = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1].QMV;
    const cur = samples[i].QMV;
    const next = samples[i + 1].QMV;
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

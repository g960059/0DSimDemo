import { describe, expect, it } from "vitest";
import { recordValveExtremes, runScenario, summarize } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";

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

  it("matches the frozen baseline summary", () => {
    const summary = summarize(result);
    // Visible in CI logs for quick inspection of any drift.
    // eslint-disable-next-line no-console
    console.log("BASELINE_SUMMARY", JSON.stringify(summary));
    expect(summary).toMatchSnapshot();
  });
});

import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";

/** A0 / M0bs — observability for Phase A acceptance (Pmsf, stressed/unstressed, etc.). */
describe("M0bs observability", () => {
  it("exposes finite, physiologically-ordered systemic filling observables", () => {
    const { core, metrics } = runScenario(DEFAULT_PARAMS);
    const o = core.debugObservables();

    for (const [k, v] of Object.entries(o)) {
      expect(Number.isFinite(v), `non-finite ${k}`).toBe(true);
    }
    // Mean systemic filling pressure: positive and modest.
    expect(o.Pmsf).toBeGreaterThan(2);
    expect(o.Pmsf).toBeLessThan(25);
    // Venous return is driven by Pmsf exceeding RA pressure.
    expect(o.Pmsf).toBeGreaterThan(o.RAP);
    expect(o.vrGradient).toBeGreaterThan(0);
    // metrics() surfaces the same instantaneous Pmsf.
    expect(metrics.Pmsf).toBeCloseTo(o.Pmsf, 6);
    // The systemic venous reservoir holds a real stressed volume.
    expect(o.venousStressedVolume).toBeGreaterThan(0);
  });

  it("Pmsf rises when venous tone increases (unstressed -> stressed redistribution)", () => {
    const low = runScenario({ ...DEFAULT_PARAMS, venousTone: 0.1 });
    const high = runScenario({ ...DEFAULT_PARAMS, venousTone: 0.6 });
    expect(high.core.debugObservables().Pmsf).toBeGreaterThan(low.core.debugObservables().Pmsf);
  });
});

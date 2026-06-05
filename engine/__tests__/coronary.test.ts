import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";

const FAST_OPTIONS = { settleSeconds: 35, measureSeconds: 6 };

describe("coronary circulation", () => {
  it("adds a finite 3-territory coronary bed with resting flow in the expected range", () => {
    const result = runScenario(DEFAULT_PARAMS, FAST_OPTIONS);
    const m = result.metrics;
    const o = result.core.debugObservables();

    expect(result.health.numericalStability).toBe("ok");
    expect(m.CorFlowTotalMlMin).toBeGreaterThan(200);
    expect(m.CorFlowTotalMlMin).toBeLessThan(350);
    expect(m.CorPctCO).toBeGreaterThan(3);
    expect(m.CorPctCO).toBeLessThan(7);
    expect(m.CorFlowLADMlMin).toBeGreaterThan(m.CorFlowLCxMlMin);
    expect(m.CorFlowLADMlMin).toBeGreaterThan(m.CorFlowRCAMlMin);

    expect(m.CorDiastolicFractionLAD).toBeGreaterThan(0.6);
    expect(m.CorDiastolicFractionLAD).toBeGreaterThan(m.CorDiastolicFractionRCA + 0.12);
    expect(m.FFR_LAD).toBeGreaterThan(0.9);
    expect(m.FFR_LCx).toBeGreaterThan(0.9);
    expect(m.FFR_RCA).toBeGreaterThan(0.9);
    expect(o.PimLAD).toBeGreaterThan(o.PimRCA);
  });

  it("can disable the added pathway without leaking appreciable aortic runoff", () => {
    const disabled = runScenario({ ...DEFAULT_PARAMS, coronaryEnabled: false }, FAST_OPTIONS);
    expect(disabled.metrics.CorFlowTotalMlMin).toBeLessThan(0.01);
    expect(Math.abs(disabled.core.debugObservables().Q_Cor_total)).toBeLessThan(0.001);
    expect(disabled.health.numericalStability).toBe("ok");
  });

  it("vasodilates under hyperemia and lowers distal pressure with LAD stenosis", () => {
    const hyperemia = runScenario({ ...DEFAULT_PARAMS, coronaryVasodilator: 1 }, FAST_OPTIONS);
    const stenosis = runScenario({
      ...DEFAULT_PARAMS,
      coronaryVasodilator: 1,
      LADStenosis: 0.8,
    }, FAST_OPTIONS);

    expect(hyperemia.metrics.CorFlowTotalMlMin).toBeGreaterThan(450);
    expect(stenosis.metrics.FFR_LAD).toBeLessThan(hyperemia.metrics.FFR_LAD - 0.3);
    expect(stenosis.metrics.CorFlowLADMlMin).toBeLessThan(hyperemia.metrics.CorFlowLADMlMin * 0.2);
    expect(stenosis.metrics.FFR_LCx).toBeGreaterThan(stenosis.metrics.FFR_LAD + 0.5);
    expect(stenosis.health.numericalStability).toBe("ok");
  });

  it("makes the right coronary waveform more diastolic during RV pressure overload", () => {
    const base = runScenario(DEFAULT_PARAMS, FAST_OPTIONS);
    const overload = runScenario({
      ...DEFAULT_PARAMS,
      pulmonaryResistance: DEFAULT_PARAMS.pulmonaryResistance * 6,
    }, FAST_OPTIONS);

    // The refit lowers RV output under fixed PVR loading; keep the load clearly
    // present while the coronary waveform gates verify the RCA response shape.
    expect(overload.metrics.PAPMean).toBeGreaterThan(base.metrics.PAPMean + 4);
    expect(overload.metrics.CorDiastolicFractionRCA).toBeGreaterThan(base.metrics.CorDiastolicFractionRCA + 0.02);
    expect(overload.metrics.CorFlowRCAMlMin).toBeLessThan(base.metrics.CorFlowRCAMlMin);
    expect(overload.health.numericalStability).toBe("ok");
  });
});

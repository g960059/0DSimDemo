import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { ModelCore } from "@/engine/ModelCore";
import { DEFAULT_PARAMS } from "@/constants";

/** M5a — hemorrhage / fluid via the expected-TBV ledger + projector. */
describe("M5a hemorrhage / fluid", () => {
  it("hemorrhage lowers TBV, Pmsf and CO, and is NOT flagged as a mass-conservation failure", () => {
    const base = runScenario(DEFAULT_PARAMS);
    const bleed = runScenario({ ...DEFAULT_PARAMS, bleedRate: 600 }); // mL/min

    // TBV actually falls (the loss is real, the projector follows the ledger).
    expect(bleed.metrics.TBV).toBeLessThan(base.metrics.TBV - 100);
    // Preload and output fall.
    expect(bleed.core.debugObservables().Pmsf).toBeLessThan(base.core.debugObservables().Pmsf);
    expect(bleed.metrics.CO_L).toBeLessThan(base.metrics.CO_L);
    // Intended blood loss must NOT read as a model/numerical failure.
    expect(bleed.health.massConservation).not.toBe("failed");
  });

  it("fluid raises TBV and preload", () => {
    const base = runScenario(DEFAULT_PARAMS);
    const fluid = runScenario({ ...DEFAULT_PARAMS, fluidRate: 600 });

    expect(fluid.metrics.TBV).toBeGreaterThan(base.metrics.TBV + 100);
    expect(fluid.core.debugObservables().Pmsf).toBeGreaterThan(base.core.debugObservables().Pmsf);
  });

  it("the setTargetParameters() API path also drives hemorrhage", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(5, 0.001, 120);
    const tbv0 = core.metrics().TBV;
    core.setTargetParameters({ bleedRate: 600 });
    core.runFor(30, 0.001, 120);
    expect(core.metrics().TBV).toBeLessThan(tbv0 - 100);
  });

  it("a bare step() loop with bleed keeps mass conservation ok (no stale-sample false drift)", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.setImmediateParameters({ bleedRate: 600 });
    for (let i = 0; i < 3000; i++) core.step(0.001); // 3s, never sample()
    expect(core.health().massConservation).not.toBe("failed");
  });

  it("projectTBV=false makes bleed a coherent no-op (no false drift failure)", () => {
    const core = new ModelCore({ ...DEFAULT_PARAMS, projectTBV: false });
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(5, 0.001, 120);
    const tbv0 = core.metrics().TBV;
    core.setImmediateParameters({ bleedRate: 600 });
    core.runFor(20, 0.001, 120);
    // No projector -> bleed cannot act -> TBV conserved, and not flagged as drift.
    expect(Math.abs(core.metrics().TBV - tbv0)).toBeLessThan(50);
    expect(core.health().massConservation).not.toBe("failed");
  });
});

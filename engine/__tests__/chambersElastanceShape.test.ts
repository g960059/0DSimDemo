import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";

describe("ChamberModel elastance shape integration", () => {
  it("elastance fallback keeps the LV pressure loop free of a gross mid-systolic notch", () => {
    const result = runScenario(
      { ...DEFAULT_PARAMS, heartModel: "elastance" },
      { settleSeconds: 30, measureSeconds: 2, sampleHz: 400 },
    );
    const samples = result.samples;
    const beatEnd = Math.floor(samples.at(-1)?.phi ?? 0);
    const beat = samples.filter((s) => s.phi >= beatEnd - 1 && s.phi < beatEnd);
    const systolic = beat.filter((s) => s.LVP > 40);
    let topDip = 0;
    for (let i = 1; i < systolic.length - 1; i++) {
      const before = Math.max(...systolic.slice(0, i).map((s) => s.LVP));
      const after = Math.max(...systolic.slice(i + 1).map((s) => s.LVP));
      topDip = Math.max(topDip, Math.min(before, after) - systolic[i].LVP);
    }

    expect(result.metrics.AoPSys).toBeGreaterThan(100);
    expect(result.metrics.AoPDia).toBeGreaterThan(70);
    expect(result.metrics.EF_LApprox).toBeGreaterThan(0.50);
    expect(topDip).toBeLessThan(8);
  });
});

import { describe, expect, it } from "vitest";
import {
  applyKnobs,
  clampKnobs,
  KNOB_MAPPING_VERSION,
  KNOB_RESOLVERS,
  neutralKnobs,
  resolveKnobsToParams,
} from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";

/**
 * M4-lite clinical knob layer (milestone #2). The engine-owned, version-pinned
 * knob->raw vocabulary that the app UI, caseOps, and MCP all resolve through.
 */
describe("clinical knob layer", () => {
  it("neutral knobs resolve back to the untouched baseline (no clinical deviation)", () => {
    const base = defaultParams();
    expect(applyKnobs(base, neutralKnobs(base))).toEqual(base);
  });

  it("the current KNOB_MAPPING_VERSION is registered", () => {
    expect(KNOB_RESOLVERS[KNOB_MAPPING_VERSION]).toBeTypeOf("function");
  });

  it("refuses an unknown knobMappingVersion (no silent fallback)", () => {
    const base = defaultParams();
    expect(() => resolveKnobsToParams(neutralKnobs(base), base, "knobmap-9.9-bogus")).toThrow(/Unknown knobMappingVersion/);
  });

  it("clamps out-of-range knob values before resolving", () => {
    const base = defaultParams();
    const k = { ...neutralKnobs(base), contractility: 99, HR: 5 };
    expect(clampKnobs(k).contractility).toBe(2.5); // KNOB_RANGES cap
    expect(clampKnobs(k).HR).toBe(30);             // KNOB_RANGES floor
  });

  it("multiplier knobs compose with the baseline value", () => {
    const base = defaultParams();
    const k = { ...neutralKnobs(base), contractility: 1.5, afterload: 0.8, contractilityRV: 1.4 };
    const patch = resolveKnobsToParams(k, base);
    expect(patch.contractility).toBeCloseTo(base.contractility * 1.5, 9);
    expect(patch.systemicResistance).toBeCloseTo(base.systemicResistance * 0.8, 9);
    expect(patch.rvTmaxScale).toBeCloseTo(base.rvTmaxScale * 1.4, 9);
  });

  it("diastolicStiffness and baroreflex are documented-unmapped (no spurious raw keys, no throw)", () => {
    const base = defaultParams();
    const k = { ...neutralKnobs(base), diastolicStiffness: 2.5, baroreflexEnabled: true };
    const patch = resolveKnobsToParams(k, base);
    // No valve/lesion keys leaked, and resolution did not error.
    expect(patch.AoV_Amax).toBeUndefined();
    expect((patch as Record<string, unknown>).b_pas).toBeUndefined();
  });
});

describe("valve-lesion knobs are not no-ops through the full pipeline", () => {
  it("aortic stenosis via the knob lowers aortic systolic pressure", () => {
    const base = defaultParams();
    const neutral = applyKnobs(base, neutralKnobs(base));
    const as = applyKnobs(base, { ...neutralKnobs(base), aorticStenosis: 0.7 });
    // The lesion survives sanitize.
    expect(as.AoV_Amax).toBeLessThan(neutral.AoV_Amax * 0.5);

    const baseRun = runScenario(neutral, { settleMode: "converge", measureSeconds: 4 });
    const asRun = runScenario(as, { settleMode: "converge", measureSeconds: 4 });
    expect(baseRun.metrics.AoPSys - asRun.metrics.AoPSys).toBeGreaterThan(3);
  });

  it("mitral regurgitation via the knob opens a leak area that survives sanitize", () => {
    const base = defaultParams();
    const mr = applyKnobs(base, { ...neutralKnobs(base), mitralRegurgitation: 0.6 });
    // A healthy MV has a near-zero leak; the regurgitant knob opens a real one.
    expect(mr.MV_Aleak).toBeGreaterThan(base.MV_Aleak);
    expect(mr.MV_Aleak).toBeCloseTo(base.MV_Amax * 0.3 * 0.6, 9);
  });
});

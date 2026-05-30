import { describe, expect, it } from "vitest";
import { NEUTRAL_PARAMS, sanitizeParams, type CoreRuntimeParams } from "@/engine/protocol";
import { ModelCore, defaultParams } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";

/**
 * caseOps engine-contract MVP (milestone #1). These guard the engine surface
 * that the knob-primary save/share/MCP op-stack (caseOps.ts) depends on:
 *   - sanitizeParams() must PRESERVE valve params / overrides (or valvular
 *     interventions silently no-op — the documented landmine).
 *   - metrics() must be stop-phase independent (deterministic fingerprints).
 */

const VALVE_KEYS: (keyof CoreRuntimeParams)[] = [
  "MV_Amax", "MV_Aleak", "MV_kOpen", "MV_tauOpen", "MV_tauClose", "MV_R", "MV_L",
  "AoV_Amax", "AoV_Aleak", "AoV_kOpen", "AoV_tauOpen", "AoV_tauClose", "AoV_R", "AoV_L",
  "TV_Amax", "TV_Aleak", "TV_kOpen", "TV_tauOpen", "TV_tauClose", "TV_R", "TV_L",
  "PV_Amax", "PV_Aleak", "PV_kOpen", "PV_tauOpen", "PV_tauClose", "PV_R", "PV_L",
];

describe("sanitizeParams (engine contract boundary)", () => {
  it("NEUTRAL_PARAMS stays in lock-step with defaultParams()", () => {
    // The fallback table is duplicated (so sanitize has no engine import); this
    // guard makes a silent divergence impossible.
    expect(NEUTRAL_PARAMS).toEqual(defaultParams());
  });

  it("is a no-op on already-valid default params", () => {
    expect(sanitizeParams(defaultParams())).toEqual(defaultParams());
  });

  it("PRESERVES every valve key (the valvular-intervention landmine)", () => {
    const base = defaultParams();
    // A severe aortic-stenosis patch in raw space (what resolveKnobsToParams emits).
    const patched = { ...base, AoV_Amax: base.AoV_Amax * 0.25, AoV_R: base.AoV_R * 6 };
    const clean = sanitizeParams(patched as CoreRuntimeParams);
    for (const k of VALVE_KEYS) expect(clean[k], `valve key ${k} dropped`).toBeTypeOf("number");
    // The intervention survives intact (not reset to the default open area).
    expect(clean.AoV_Amax).toBeCloseTo(base.AoV_Amax * 0.25, 9);
    expect(clean.AoV_R).toBeCloseTo(base.AoV_R * 6, 9);
    expect(clean.AoV_Amax).toBeLessThan(base.AoV_Amax);
  });

  it("preserves node/edge overrides (researcher tier) and drops unknown junk", () => {
    const withExtras = {
      ...defaultParams(),
      nodeOverrides: { LV: { Ees: 3.1 } },
      edgeOverrides: { AoV: { R: 0.02 } },
      bogusKey: 999,
    };
    const clean = sanitizeParams(withExtras as unknown as CoreRuntimeParams);
    expect(clean.nodeOverrides).toEqual({ LV: { Ees: 3.1 } });
    expect(clean.edgeOverrides).toEqual({ AoV: { R: 0.02 } });
    expect((clean as Record<string, unknown>).bogusKey).toBeUndefined();
  });

  it("clamps out-of-range core knobs and coerces non-finite to neutral", () => {
    const bad = {
      ...defaultParams(),
      HR: 9999,                 // above hard clamp 180
      contractility: -5,        // below hard clamp 0.25
      systemicResistance: NaN,  // non-finite -> neutral 1.25
      AoV_Amax: -3,             // valve area must be >= 0
      AoV_tauClose: 0,          // tau must be >= 1e-4 (no divide-by-zero)
    };
    const clean = sanitizeParams(bad as CoreRuntimeParams);
    expect(clean.HR).toBe(180);
    expect(clean.contractility).toBe(0.25);
    expect(clean.systemicResistance).toBe(NEUTRAL_PARAMS.systemicResistance);
    expect(clean.AoV_Amax).toBe(0);
    expect(clean.AoV_tauClose).toBe(1e-4);
  });
});

describe("valvular intervention is NOT a no-op after sanitize (end-to-end)", () => {
  it("aortic stenosis lowers aortic systolic pressure through the full pipeline", () => {
    const base = defaultParams();
    // Moderate-severe AS via the resolveKnobsToParams formulas (severity 0.7).
    const sev = 0.7;
    const asRaw = {
      ...base,
      AoV_Amax: base.AoV_Amax * (1 - 0.75 * sev),
      AoV_R: base.AoV_R * (1 + 5 * sev),
    };
    const asParams = sanitizeParams(asRaw as CoreRuntimeParams);
    // Guard: the lesion survived the final sanitize step.
    expect(asParams.AoV_Amax).toBeLessThan(base.AoV_Amax * 0.5);

    const baseRun = runScenario(base, { settleMode: "converge", measureSeconds: 4 });
    const asRun = runScenario(asParams, { settleMode: "converge", measureSeconds: 4 });

    // The hallmark of AS: a transvalvular gradient — aortic systolic falls well
    // below the unobstructed case. If sanitize had erased the valve keys this
    // delta would be ~0 (a silent no-op), which is exactly what we guard against.
    expect(baseRun.metrics.AoPSys - asRun.metrics.AoPSys).toBeGreaterThan(3);
  });
});

describe("metrics() is stop-phase independent (deterministic fingerprints)", () => {
  it("returns bit-identical metrics at every stop phase within one beat", () => {
    const dt = 0.001;
    const sampleHz = 120;
    const core = new ModelCore(defaultParams());
    core.initializeVenousPressuresForTargetTBV(5600);
    core.settleToSteady(undefined, dt, sampleHz);
    core.runFor(0.1, dt, sampleHz); // land mid-beat

    const beat0 = Math.floor(core.sample().phi);
    const sv: number[] = [];
    const sys: number[] = [];
    let guard = 0;
    // Sample metrics at successive stop phases WITHIN a single in-progress beat.
    // The phi-aligned window points at the last *completed* beat, whose samples
    // are frozen, so every reading must be identical. A t-anchored window would
    // drift as the in-progress beat accumulates samples.
    while (Math.floor(core.sample().phi) === beat0 && guard < 100) {
      const m = core.metrics();
      sv.push(m.SV_L);
      sys.push(m.AoPSys);
      core.runFor(0.02, dt, sampleHz);
      guard++;
    }

    expect(sv.length).toBeGreaterThan(3); // genuinely visited several stop phases
    expect(Math.max(...sv) - Math.min(...sv)).toBeLessThan(1e-9);
    expect(Math.max(...sys) - Math.min(...sys)).toBeLessThan(1e-9);
  });
});

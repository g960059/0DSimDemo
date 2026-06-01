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
  "MV_Amax", "MV_Aleak", "MV_kOpen", "MV_tauOpen", "MV_tauClose", "MV_R", "MV_L", "MV_B",
  "AoV_Amax", "AoV_Aleak", "AoV_kOpen", "AoV_tauOpen", "AoV_tauClose", "AoV_R", "AoV_L", "AoV_B",
  "TV_Amax", "TV_Aleak", "TV_kOpen", "TV_tauOpen", "TV_tauClose", "TV_R", "TV_L", "TV_B",
  "PV_Amax", "PV_Aleak", "PV_kOpen", "PV_tauOpen", "PV_tauClose", "PV_R", "PV_L", "PV_B",
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

  it("has exactly the CoreRuntimeParams key-set on valid defaults (none dropped/added)", () => {
    const a = Object.keys(sanitizeParams(defaultParams())).sort();
    const b = Object.keys(defaultParams()).sort();
    expect(a).toEqual(b);
  });

  it("preserves valid overrides but drops non-finite leaves / null / arrays", () => {
    const withExtras = {
      ...defaultParams(),
      nodeOverrides: { LV: { Ees: 3.1, beta: NaN } }, // beta NaN must be dropped (would poison the solver)
      edgeOverrides: { AoV: { R: 0.02 } },
      bogusKey: 999,
    };
    const clean = sanitizeParams(withExtras as unknown as CoreRuntimeParams);
    expect(clean.nodeOverrides).toEqual({ LV: { Ees: 3.1 } }); // beta dropped, Ees kept
    expect(clean.edgeOverrides).toEqual({ AoV: { R: 0.02 } });
    expect((clean as Record<string, unknown>).bogusKey).toBeUndefined();

    // null / array override blocks are rejected entirely (key omitted).
    const bad = sanitizeParams({ ...defaultParams(), nodeOverrides: null, edgeOverrides: [1, 2] } as unknown as CoreRuntimeParams);
    expect("nodeOverrides" in bad).toBe(false);
    expect("edgeOverrides" in bad).toBe(false);
  });

  it("PRESERVES a nested active-chamber override (b_pas) — the diastolic-stiffness path", () => {
    // ModelCore deep-merges nodeOverrides.LV.active onto the chamber model; if
    // sanitize stripped this nested block, diastolicStiffness/chamber overrides
    // would silently no-op (same class of bug as the valve landmine).
    const clean = sanitizeParams({
      ...defaultParams(),
      nodeOverrides: { LV: { active: { bPas: 22, sigmaPas0: NaN } }, RV: { active: { bPas: 18 } } },
    } as unknown as CoreRuntimeParams);
    const lvActive = clean.nodeOverrides?.LV?.active as Record<string, number> | undefined;
    expect(lvActive?.bPas).toBe(22);          // nested finite leaf preserved
    expect(lvActive?.sigmaPas0).toBeUndefined(); // nested non-finite leaf dropped
    expect((clean.nodeOverrides?.RV?.active as Record<string, number>)?.bPas).toBe(18);
  });

  it("DROPS wrong-shaped (object-where-number) overrides — nesting only under `active`", () => {
    // A stray object where the integrator expects a number must never reach
    // ModelCore arithmetic. Nesting is allowed ONLY under a node's `active`.
    const clean = sanitizeParams({
      ...defaultParams(),
      nodeOverrides: { LV: { V0: { x: 1 } as unknown as number, active: { bPas: 15 } } },
      edgeOverrides: { Ao_SA: { R: { x: 1 } as unknown as number } },
    } as unknown as CoreRuntimeParams);
    expect(clean.nodeOverrides?.LV?.V0).toBeUndefined();            // non-active nested dropped
    expect((clean.nodeOverrides?.LV?.active as Record<string, number>)?.bPas).toBe(15); // active kept
    expect("edgeOverrides" in clean).toBe(false);                  // edge nesting dropped -> empty -> omitted
  });

  it("coerces non-boolean projectTBV/useChiResistance to neutral, not false", () => {
    const clean = sanitizeParams({ ...defaultParams(), projectTBV: 1, useChiResistance: "yes" } as unknown as CoreRuntimeParams);
    expect(clean.projectTBV).toBe(NEUTRAL_PARAMS.projectTBV); // true, NOT false
    expect(clean.useChiResistance).toBe(NEUTRAL_PARAMS.useChiResistance);
  });

  it("clamps out-of-range core knobs and coerces non-finite to neutral", () => {
    const bad = {
      ...defaultParams(),
      HR: 9999,                 // above hard clamp 180
      contractility: -5,        // below hard clamp 0.25
      systemicResistance: NaN,  // non-finite -> neutral 1.25
      AoV_Amax: -3,             // valve area must be >= 0
      AoV_tauClose: 0,          // tau must be >= 1e-4 (no divide-by-zero)
      MV_B: -1,                 // quadratic loss must be >= 0
    };
    const clean = sanitizeParams(bad as CoreRuntimeParams);
    expect(clean.HR).toBe(180);
    expect(clean.contractility).toBe(0.25);
    expect(clean.systemicResistance).toBe(NEUTRAL_PARAMS.systemicResistance);
    expect(clean.AoV_Amax).toBe(0);
    expect(clean.AoV_tauClose).toBe(1e-4);
    expect(clean.MV_B).toBe(0);
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
    // Guard: BOTH lesion params survive the final sanitize step (a partial
    // erosion — e.g. orifice survives but resistance is reset — would be a
    // silent half-no-op).
    expect(asParams.AoV_Amax).toBeCloseTo(base.AoV_Amax * (1 - 0.75 * sev), 9);
    expect(asParams.AoV_R).toBeCloseTo(base.AoV_R * (1 + 5 * sev), 9);

    const baseRun = runScenario(base, { settleMode: "converge", measureSeconds: 4 });
    const asRun = runScenario(asParams, { settleMode: "converge", measureSeconds: 4 });

    // The hallmark of AS: a transvalvular gradient — aortic systolic falls well
    // below the unobstructed case. If sanitize had erased the valve keys this
    // delta would be ~0 (a silent no-op), which is exactly what we guard against.
    expect(baseRun.metrics.AoPSys - asRun.metrics.AoPSys).toBeGreaterThan(3);
  });
});

describe("metrics() is stop-phase independent (deterministic fingerprints)", () => {
  it("returns bit-identical values for EVERY metric field across stop phases in one beat", () => {
    const dt = 0.001;
    const sampleHz = 120;
    const core = new ModelCore(defaultParams());
    core.initializeVenousPressuresForTargetTBV(5600);
    core.settleToSteady(undefined, dt, sampleHz);
    core.runFor(0.1, dt, sampleHz); // land mid-beat

    const beat0 = Math.floor(core.sample().phi);
    const readings: Record<string, number>[] = [];
    let guard = 0;
    // Sample metrics at successive stop phases WITHIN a single in-progress beat.
    // The phi-aligned window points at the last *completed* beat (and the
    // observables snapshot is taken at that beat boundary), so every field —
    // including the previously stop-phase-dependent Pmsf/vrGradient/volumes —
    // must be identical. A t-anchored window would drift as samples accumulate.
    while (Math.floor(core.sample().phi) === beat0 && guard < 100) {
      readings.push({ ...core.metrics() } as unknown as Record<string, number>);
      core.runFor(0.02, dt, sampleHz);
      guard++;
    }

    expect(readings.length).toBeGreaterThan(3); // genuinely visited several stop phases
    for (const key of Object.keys(readings[0])) {
      const vals = readings.map((r) => r[key]);
      const spread = Math.max(...vals) - Math.min(...vals);
      expect(spread, `metric "${key}" jitters across stop phases (${spread})`).toBeLessThan(1e-9);
    }
  });
});

describe("grounding: settleStatus is exposed and settled on a converged run", () => {
  it("converge runs report settled===true so grounded metrics are trustworthy", () => {
    const r = runScenario(defaultParams(), { settleMode: "converge", measureSeconds: 2 });
    expect(r.settleStatus).toBeDefined();
    expect(r.settleStatus?.settled).toBe(true);
  });
});

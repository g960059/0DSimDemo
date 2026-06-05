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
import { ActiveStressChamberModel, defaultActiveLV, type ChamberCtx } from "@/engine/chambers";
import { sanitizeParams } from "@/engine/protocol";
import { runScenario } from "@/engine/harness";

/**
 * M4-lite clinical knob layer (milestone #2). The engine-owned, version-pinned
 * knob->raw vocabulary the app UI, caseOps, and MCP all resolve through.
 */
const V = KNOB_MAPPING_VERSION;

describe("clinical knob layer", () => {
  it("neutral knobs resolve back to the untouched baseline (default base)", () => {
    const base = defaultParams();
    expect(applyKnobs(base, neutralKnobs(base), V)).toEqual(base);
  });

  it("neutral knobs round-trip to a NON-default baseline too", () => {
    const base = sanitizeParams({
      ...defaultParams(),
      lvTmaxScale: 1.4, rvTmaxScale: 1.6, venousTone: 0.45, PEEP: 8, arterialStiffness: 1.7,
    } as ReturnType<typeof defaultParams>);
    expect(applyKnobs(base, neutralKnobs(base), V)).toEqual(base);
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
    expect(clampKnobs(k).contractility).toBe(2.5);
    expect(clampKnobs(k).HR).toBe(30);
  });

  it("maps LV and RV contractility to INDEPENDENT force scales (no global coupling)", () => {
    const base = defaultParams();
    const lvDown = resolveKnobsToParams({ ...neutralKnobs(base), contractility: 0.5 }, base, V);
    expect(lvDown.lvTmaxScale).toBeCloseTo(base.lvTmaxScale * 0.5, 9);
    expect(lvDown.rvTmaxScale).toBeCloseTo(base.rvTmaxScale, 9); // RV force untouched
    const rvUp = resolveKnobsToParams({ ...neutralKnobs(base), contractilityRV: 1.6 }, base, V);
    expect(rvUp.rvTmaxScale).toBeCloseTo(base.rvTmaxScale * 1.6, 9);
    expect(rvUp.lvTmaxScale).toBeCloseTo(base.lvTmaxScale, 9); // LV force untouched
    // Crucially, neither touches the GLOBAL `contractility` raw param (which the
    // active-stress model applies to BOTH ventricles) — that was the coupling bug.
    expect(lvDown.contractility).toBeUndefined();
    expect(rvUp.contractility).toBeUndefined();
  });

  it("afterload composes with the baseline SVR independent of arterialStiffness", () => {
    const base = defaultParams();
    const patch = resolveKnobsToParams({ ...neutralKnobs(base), afterload: 0.8, arterialStiffness: 1.5 }, base, V);
    expect(patch.systemicResistance).toBeCloseTo(base.systemicResistance * 0.8, 9);
    expect(patch.arterialStiffness).toBeCloseTo(base.arterialStiffness * 1.5, 9);
  });

  it("v0.3 mitral stenosis uses A/Aref semantics with a small R supplement while v0.2 is preserved", () => {
    const base = defaultParams();
    const severity = 0.6;
    const k = { ...neutralKnobs(base), mitralStenosis: severity };

    const v02 = resolveKnobsToParams(k, base, "knobmap-0.2-activestress");
    expect(v02.MV_Amax).toBeCloseTo(base.MV_Amax * (1 - 0.75 * severity), 9);
    expect(v02.MV_R).toBeCloseTo(base.MV_R * (1 + 5 * severity), 9);

    const v03 = resolveKnobsToParams(k, base, "knobmap-0.3-activestress");
    expect(v03.MV_Amax).toBeCloseTo(base.MV_Amax * (1 - 0.75 * severity), 9);
    expect(v03.MV_R).toBeCloseTo(base.MV_R * (1 + 2 * severity), 9);
  });

  it("current resolver output is frozen (editing the mapping must bump the version)", () => {
    const base = defaultParams();
    const k = { ...neutralKnobs(base), contractility: 1.4, afterload: 1.3, aorticStenosis: 0.5, diastolicStiffness: 1.8 };
    expect(resolveKnobsToParams(k, base, V)).toMatchSnapshot();
  });
});

describe("clinical knobs drive the expected hemodynamics end-to-end", () => {
  const base = defaultParams();
  const neutral = applyKnobs(base, neutralKnobs(base), V);
  const run = (p: ReturnType<typeof defaultParams>) => runScenario(p, { settleMode: "converge", measureSeconds: 4 });

  it("LV contractility down depresses LV pump function (cardiogenic-shock direction)", () => {
    const weak = applyKnobs(base, { ...neutralKnobs(base), contractility: 0.5 }, V);
    expect(run(neutral).metrics.CO_L - run(weak).metrics.CO_L).toBeGreaterThan(0.3);
  });

  it("aortic stenosis lowers aortic systolic pressure", () => {
    const as = applyKnobs(base, { ...neutralKnobs(base), aorticStenosis: 0.7 }, V);
    expect(as.AoV_Amax).toBeLessThan(neutral.AoV_Amax * 0.5); // lesion survives sanitize
    expect(run(neutral).metrics.AoPSys - run(as).metrics.AoPSys).toBeGreaterThan(3);
  });

  it("aortic regurgitation drops aortic diastolic pressure (diastolic run-off)", () => {
    const ar = applyKnobs(base, { ...neutralKnobs(base), aorticRegurgitation: 0.6 }, V);
    expect(ar.AoV_Aleak).toBeGreaterThan(base.AoV_Aleak);
    expect(run(neutral).metrics.AoPDia - run(ar).metrics.AoPDia).toBeGreaterThan(3);
  });

  it("mitral regurgitation raises left atrial pressure", () => {
    const mr = applyKnobs(base, { ...neutralKnobs(base), mitralRegurgitation: 1.0 }, V); // severe ~0.5 cm2 EROA
    expect(mr.MV_Aleak).toBeGreaterThan(base.MV_Aleak);
    expect(run(mr).metrics.LAPMean - run(neutral).metrics.LAPMean).toBeGreaterThan(1);
  });

  it("diastolicStiffness stiffens the EDPVR (chamber law) and reduces filling/output", () => {
    const stiff = applyKnobs(base, { ...neutralKnobs(base), diastolicStiffness: 2.5 }, V);
    // (a) the b_pas override survived sanitize and reached the chamber model.
    const lvActive = stiff.nodeOverrides?.LV?.active as Record<string, number> | undefined;
    expect(lvActive?.bPas).toBeCloseTo(defaultActiveLV.bPas * 2.5, 9);

    // (b) the stiffening reaches pressure() — assert on the CHAMBER LAW at a fixed
    // volume (an engine invariant). NB: closed-loop LVEDP is a poor probe at the
    // M12-lite under-filled operating point (EDV ~97 / LVEDP ~1.7): the exponential
    // EDPVR is flat on the low-filling limb, and a stiffer chamber simply fills LESS
    // (the operating point slides down the curve) so LVEDP barely moves (~0.15 mmHg).
    // That is faithful physiology (diastolic dysfunction is unmasked by loading) and
    // resolves when the M12-proper preload fix raises EDV/LAP. See
    // docs/research/m12-lite-calibration-journal.md.
    const ctx: ChamberCtx = {
      HR: 75, contractility: 1, relaxation: 1, phi: 0,
      tmaxScale: 1, geomScale: 1, caReleaseScale: 1,
    };
    const dia = { c: 0, a: 0, r: 0 }; // a=0 -> active stress zero, so this probes sigma_pas only
    const soft = new ActiveStressChamberModel(defaultActiveLV);
    const stiffModel = new ActiveStressChamberModel({ ...defaultActiveLV, bPas: defaultActiveLV.bPas * 2.5 });
    const dPassive = stiffModel.pressure(100, dia, ctx) - soft.pressure(100, dia, ctx);
    expect(dPassive).toBeGreaterThan(5); // passive pressure at fixed V=100 mL rises markedly with ×2.5 bPas

    // (c) end-to-end teaching consequence at the normal operating point: a stiffer
    // EDPVR reduces filling, so stroke volume and cardiac output fall.
    expect(run(neutral).metrics.CO_L - run(stiff).metrics.CO_L).toBeGreaterThan(0.5);
  });
});

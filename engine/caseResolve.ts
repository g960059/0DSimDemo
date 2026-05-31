// Engine-pure case resolution (milestone #3-a). The PHYSIOLOGY half of the
// caseOps design: turn a portable, knob-primary CaseInstanceSpec into concrete,
// integrator-ready params. NO React / Firebase / UI dependency — the app-layer
// CaseDocument (panels, notes, persistence, the SimInstance bridge) wraps this.
//
// The clinical-knob vocabulary itself lives in engine/knobs.ts (single source of
// truth) — this module IMPORTS it, never redefines it.

import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { sanitizeParams } from "@/engine/protocol";
import {
  applyKnobs,
  clampKnobs,
  KNOB_MAPPING_VERSION,
  type ClinicalKnobs,
  type KnobKey,
  mergeNodeOverrides,
  neutralKnobs,
  resolveKnobMappingVersion,
} from "@/engine/knobs";

/** A named full-parameter starting point a case is authored on top of. */
export interface BaselineDef {
  params: CoreRuntimeParams;
  targetVolume: number; // default total blood volume [mL]
  label?: string;
}

// ----- Interventions: first-class, named, dose-adjustable transforms ---------
// Expressed in KNOB space via a tiny DSL: "*k" | "+d" | "=v". Volume effects
// fold into the targetVolume layer via volumeDelta.

export type KnobTransform = Partial<Record<KnobKey, string>>;

export interface InterventionEffect {
  knobs?: KnobTransform;
  volumeDelta?: number; // mL added to targetVolume
}

export interface InterventionArgSpec {
  min?: number;
  max?: number;
  default?: number;
  unit?: string;
  enum?: string[];
}

export interface InterventionDef {
  id: string;
  label: string;
  category: "inotrope" | "vasopressor" | "inodilator" | "chronotrope" | "vasodilator" | "volume" | "ischemia" | "valve";
  tier: "teaching" | "review";
  args: Record<string, InterventionArgSpec>;
  apply: (args: Record<string, number | string>) => InterventionEffect;
  note: string;
}

/** An intervention instance placed on a case (registry id + concrete args). */
export interface AppliedIntervention {
  uid: string;
  id: string;
  args: Record<string, number | string>;
}

/** The portable, version-robust physiology spec of one case instance. */
export interface CaseInstanceSpec {
  baseline: string;
  /** Authored deviation FROM the named baseline that forms the resolution base
   *  the clinical knobs then multiply over (the app's raw advanced edits, which
   *  go to the knob-baseline, serialize here). Distinct from rawPatch. */
  baselinePatch?: ParameterPatch;
  knobs: Partial<ClinicalKnobs>;
  interventions: AppliedIntervention[];
  rawPatch: ParameterPatch; // researcher absolute override, post-knob (wins over knobs)
  targetVolume?: number;
}

const N = (v: number | string | undefined, d: number): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? parseFloat(v) : d;
  return Number.isFinite(n) ? n : d; // a malformed arg falls back to the default, never NaN
};

const SEV: Record<string, number> = { mild: 0.33, moderate: 0.66, severe: 1.0 };

export const INTERVENTIONS: Record<string, InterventionDef> = {
  dobutamine: {
    id: "dobutamine", label: "Dobutamine", category: "inotrope", tier: "teaching",
    args: { dose: { min: 2, max: 20, default: 5, unit: "µg/kg/min" } },
    apply: (a) => { const d = N(a.dose, 5); return { knobs: {
      contractility: `*${1 + 0.05 * d}`, relaxation: `*${1 + 0.02 * d}`,
      afterload: `*${1 - 0.01 * d}`, HR: `+${1.5 * d}` } }; },
    note: "β1-dominant. Positive inotropy/lusitropy with mild afterload reduction and tachycardia.",
  },
  norepinephrine: {
    id: "norepinephrine", label: "Norepinephrine", category: "vasopressor", tier: "teaching",
    args: { dose: { min: 0.02, max: 0.5, default: 0.1, unit: "µg/kg/min" } },
    apply: (a) => { const d = N(a.dose, 0.1); return { knobs: {
      afterload: `*${1 + 1.4 * d}`, venousTone: `+${0.3 * d}`, contractility: `*${1 + 0.3 * d}` } }; },
    note: "α-dominant + mild β1. Raises SVR and venous return (preload).",
  },
  milrinone: {
    id: "milrinone", label: "Milrinone", category: "inodilator", tier: "teaching",
    args: { dose: { min: 0.125, max: 0.75, default: 0.375, unit: "µg/kg/min" } },
    apply: (a) => { const d = N(a.dose, 0.375); return { knobs: {
      contractility: `*${1 + 0.8 * d}`, relaxation: `*${1 + 0.6 * d}`,
      afterload: `*${1 - 0.5 * d}`, pulmonaryResistance: `*${1 - 0.6 * d}` } }; },
    note: "PDE3 inhibitor. Inotropy plus systemic and pulmonary afterload reduction; useful in RV failure.",
  },
  betaBlocker: {
    id: "betaBlocker", label: "Beta blocker", category: "chronotrope", tier: "teaching",
    args: { intensity: { min: 0, max: 1, default: 0.5 } },
    apply: (a) => { const i = N(a.intensity, 0.5); return { knobs: {
      HR: `*${1 - 0.35 * i}`, contractility: `*${1 - 0.25 * i}`, relaxation: `*${1 - 0.1 * i}` } }; },
    note: "Negative chronotropy and inotropy.",
  },
  vasodilator: {
    id: "vasodilator", label: "Vasodilator", category: "vasodilator", tier: "teaching",
    args: { intensity: { min: 0, max: 1, default: 0.5 }, bias: { enum: ["arterial", "venous", "balanced"] } },
    apply: (a) => {
      const i = N(a.intensity, 0.5); const bias = (a.bias as string) || "balanced";
      const knobs: KnobTransform = {};
      if (bias !== "venous") { knobs.afterload = `*${1 - 0.4 * i}`; knobs.arterialStiffness = `*${1 - 0.2 * i}`; }
      if (bias !== "arterial") { knobs.venousTone = `+${-0.15 * i}`; }
      return { knobs };
    },
    note: "Nitrate (venous) — nicardipine (arterial) — nitroprusside (balanced).",
  },
  fluidBolus: {
    id: "fluidBolus", label: "Fluid bolus", category: "volume", tier: "teaching",
    args: { mL: { min: 100, max: 2000, default: 500, unit: "mL" } },
    apply: (a) => { const mL = N(a.mL, 500); return { volumeDelta: mL, knobs: { venousTone: `+${0.0001 * mL}` } }; },
    note: "Increases preload. Also the manual building block for a Starling sweep.",
  },
  diuresis: {
    id: "diuresis", label: "Diuresis", category: "volume", tier: "teaching",
    args: { mL: { min: 200, max: 3000, default: 1000, unit: "mL" } },
    apply: (a) => ({ volumeDelta: -N(a.mL, 1000) }),
    note: "Decreases preload; relieves congestion.",
  },
  lvPumpFailure: {
    id: "lvPumpFailure", label: "LV pump failure", category: "ischemia", tier: "teaching",
    args: { severity: { min: 0, max: 1, default: 0.5 } },
    apply: (a) => { const s = N(a.severity, 0.5); return { knobs: {
      contractility: `*${1 - 0.6 * s}`, relaxation: `*${1 - 0.35 * s}`,
      afterload: `*${1 + 0.3 * s}`, HR: `+${15 * s}` } }; },
    note: "Global LV pump depression (e.g. large anterior AMI) with reflex vasoconstriction and tachycardia. NB: 0D model cannot represent regional wall-motion abnormality.",
  },
  aorticStenosis: {
    id: "aorticStenosis", label: "Aortic stenosis", category: "valve", tier: "teaching",
    args: { severity: { enum: ["mild", "moderate", "severe"] } },
    apply: (a) => ({ knobs: { aorticStenosis: `=${SEV[String(a.severity)] ?? SEV.moderate}` } }),
    note: "Raises ejection impedance: increased LV afterload and a systolic pressure gradient.",
  },
  mitralRegurgitation: {
    id: "mitralRegurgitation", label: "Mitral regurgitation", category: "valve", tier: "teaching",
    args: { severity: { enum: ["mild", "moderate", "severe"] } },
    apply: (a) => ({ knobs: { mitralRegurgitation: `=${SEV[String(a.severity)] ?? SEV.moderate}` } }),
    note: "Systolic regurgitation into the LA: reduced forward output, raised LAP (v-wave).",
  },
};

function applyKnobTransform(current: number, t: string): number {
  const op = t[0];
  const n = parseFloat(t.slice(1));
  if (op === "*") return current * n;
  if (op === "+") return current + n;
  if (op === "=") return n;
  return parseFloat(t);
}

/** Knob overrides + ordered intervention transforms, clamped. Pure. */
export function effectiveKnobs(inst: CaseInstanceSpec, base: CoreRuntimeParams): ClinicalKnobs {
  const k: ClinicalKnobs = { ...neutralKnobs(base), ...inst.knobs };
  for (const iv of inst.interventions) {
    const eff = INTERVENTIONS[iv.id]?.apply(iv.args);
    if (!eff?.knobs) continue;
    for (const key of Object.keys(eff.knobs) as KnobKey[]) {
      const t = eff.knobs[key];
      if (typeof t === "string" && typeof k[key] === "number") {
        const next = applyKnobTransform(k[key] as number, t);
        // A malformed transform must never poison the returned knobs (which the
        // app bridge/UI consume directly, beyond sanitizeParams' reach).
        if (Number.isFinite(next)) (k as unknown as Record<KnobKey, number>)[key] = next;
      }
    }
  }
  return clampKnobs(k);
}

/**
 * Resolve a case instance into integrator-ready params + targetVolume + the
 * effective knobs. Version is REQUIRED and threaded from the CaseDocument:
 * resolveKnobMappingVersion throws on an unknown version (NO silent fallback),
 * and an unknown baseline throws too — an old/foreign case can never be silently
 * resolved with the wrong map or a substitute baseline.
 */
export function resolveInstance(
  inst: CaseInstanceSpec,
  baselines: Record<string, BaselineDef>,
  version: string,
): { params: CoreRuntimeParams; targetVolume: number; knobs: ClinicalKnobs; base: CoreRuntimeParams } {
  const b = baselines[inst.baseline];
  if (!b) {
    throw new Error(`Unknown baseline "${inst.baseline}". Known: ${Object.keys(baselines).join(", ") || "(none)"}.`);
  }
  resolveKnobMappingVersion(version); // throws on unknown version — no silent fallback

  // The resolution base = the named baseline + any authored baselinePatch
  // (the knobs multiply over THIS). Shallow-merge is correct here because the
  // named baselines carry no override blocks; applyKnobs then deep-merges the
  // knob-driven overrides on top.
  const base = inst.baselinePatch && Object.keys(inst.baselinePatch).length > 0
    ? sanitizeParams({ ...b.params, ...inst.baselinePatch } as CoreRuntimeParams)
    : b.params;
  const knobs = effectiveKnobs(inst, base);
  let params = applyKnobs(base, knobs, version);
  // Researcher raw override is absolute and wins over the resolved knobs — but
  // at the LEAF level. A flat key replaces; the structured override blocks are
  // DEEP-merged (rawPatch leaves win) so a rawPatch node/edge override does not
  // clobber a knob-driven one (e.g. diastolicStiffness's b_pas). Mirrors the
  // care applyKnobs already takes; without this, rawPatch reintroduces the
  // nodeOverrides-clobber bug.
  if (inst.rawPatch && Object.keys(inst.rawPatch).length > 0) {
    const merged = { ...params, ...inst.rawPatch } as CoreRuntimeParams;
    if (inst.rawPatch.nodeOverrides) {
      merged.nodeOverrides = mergeNodeOverrides(params.nodeOverrides, inst.rawPatch.nodeOverrides);
    }
    if (inst.rawPatch.edgeOverrides) {
      merged.edgeOverrides = mergeNodeOverrides(params.edgeOverrides, inst.rawPatch.edgeOverrides) as CoreRuntimeParams["edgeOverrides"];
    }
    const result = sanitizeParams(merged);
    // Preserve the explicit override clear-sentinels applyKnobs adds (sanitize
    // strips undefined keys) so the live per-frame merge still clears overrides.
    if (!("nodeOverrides" in result)) (result as { nodeOverrides?: unknown }).nodeOverrides = undefined;
    if (!("edgeOverrides" in result)) (result as { edgeOverrides?: unknown }).edgeOverrides = undefined;
    params = result;
  }

  let targetVolume = inst.targetVolume ?? b.targetVolume;
  for (const iv of inst.interventions) {
    const eff = INTERVENTIONS[iv.id]?.apply(iv.args);
    if (eff?.volumeDelta) targetVolume += eff.volumeDelta;
  }

  return { params, targetVolume, knobs, base };
}

/** The mapping version newly-authored cases are stamped with. Re-exported so
 *  the app layer stamps documents without importing knobs.ts directly. */
export { KNOB_MAPPING_VERSION };

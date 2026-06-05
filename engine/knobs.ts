// =============================================================================
// Clinical knob layer (M4-lite) — the portable, version-robust control
// vocabulary that sits ABOVE raw CoreRuntimeParams.
//
// This is the CANONICAL home of the knob->raw mapping (the app's M4 UI, the
// caseOps save/share op-stack, and future MCP authoring all resolve through
// here, so there is one source of truth). A knob-primary CaseDocument stores
// knobs + a knobMappingVersion; resolution is pinned by that version so old
// cases keep resolving with the map they were authored against.
//
// Resolution pipeline (all pure, deterministic):
//   base    = baselines[id].params                     // full raw start point
//   patch   = resolveKnobsToParams(knobs, base, ver)   // KNOB -> RAW, versioned
//   params  = sanitizeParams({ ...base, ...patch })    // authoritative final gate
// =============================================================================

import type { CoreRuntimeParams, OverrideBlock, ParameterPatch } from "@/engine/protocol";
import { sanitizeParams } from "@/engine/protocol";
import { defaultActiveLV, defaultActiveRV } from "@/engine/chambers";

/**
 * Semantics per field:
 *   multiplier knobs (1.0 == baseline): contractility, contractilityRV,
 *     relaxation, diastolicStiffness, afterload, arterialStiffness,
 *     pulmonaryResistance
 *   absolute knobs: HR [bpm], venousTone [0..1], peep [cmH2O]
 *   severity knobs [0..1] (0 == no lesion): the six valve lesions
 *   boolean: baroreflexEnabled
 */
export interface ClinicalKnobs {
  HR: number;
  contractility: number;
  contractilityRV: number;
  relaxation: number;
  diastolicStiffness: number;
  afterload: number;
  arterialStiffness: number;
  pulmonaryResistance: number;
  venousTone: number;
  peep: number;
  aorticStenosis: number;
  aorticRegurgitation: number;
  mitralStenosis: number;
  mitralRegurgitation: number;
  tricuspidRegurgitation: number;
  pulmonicStenosis: number;
  baroreflexEnabled: boolean;
}

export type KnobKey = keyof ClinicalKnobs;

/** Hard clamp for concrete knob values (applied before resolution). */
export const KNOB_RANGES: Partial<Record<KnobKey, [number, number]>> = {
  HR: [30, 180],
  contractility: [0.25, 2.5],
  contractilityRV: [0.25, 2.5],
  relaxation: [0.25, 2.5],
  diastolicStiffness: [0.5, 3.0],
  afterload: [0.2, 3.5],
  arterialStiffness: [0.4, 3.0],
  pulmonaryResistance: [0.2, 4.0],
  venousTone: [0, 1],
  peep: [0, 25],
  aorticStenosis: [0, 1],
  aorticRegurgitation: [0, 1],
  mitralStenosis: [0, 1],
  mitralRegurgitation: [0, 1],
  tricuspidRegurgitation: [0, 1],
  pulmonicStenosis: [0, 1],
};

/** Narrower teaching band; automated knob edits outside it should be reviewed. */
export const KNOB_TEACHING_SAFE: Partial<Record<KnobKey, [number, number]>> = {
  HR: [40, 140],
  contractility: [0.4, 1.8],
  contractilityRV: [0.4, 1.8],
  afterload: [0.4, 2.5],
  arterialStiffness: [0.6, 2.0],
  pulmonaryResistance: [0.4, 2.5],
  peep: [0, 18],
};

/** Neutral knob state = "baseline as authored" (no clinical deviation). */
export function neutralKnobs(base: CoreRuntimeParams): ClinicalKnobs {
  return {
    HR: base.HR,
    contractility: 1,
    contractilityRV: 1,
    relaxation: 1,
    diastolicStiffness: 1,
    afterload: 1,
    arterialStiffness: 1,
    pulmonaryResistance: 1,
    venousTone: base.venousTone,
    peep: base.PEEP,
    aorticStenosis: 0,
    aorticRegurgitation: 0,
    mitralStenosis: 0,
    mitralRegurgitation: 0,
    tricuspidRegurgitation: 0,
    pulmonicStenosis: 0,
    baroreflexEnabled: false,
  };
}

export function clampKnobs(k: ClinicalKnobs): ClinicalKnobs {
  const out = { ...k };
  for (const key of Object.keys(KNOB_RANGES) as KnobKey[]) {
    const r = KNOB_RANGES[key];
    const v = out[key];
    if (r && typeof v === "number") {
      (out as unknown as Record<KnobKey, number>)[key] = Math.min(r[1], Math.max(r[0], v));
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// KNOB -> RAW mappings, keyed by knobMappingVersion. NEVER edit a published
// mapping in place — add a NEW version so old cases keep resolving identically.
// Coefficients are calibration targets (math-model roadmap M12); tune against
// the engine, not by eye.
// -----------------------------------------------------------------------------

export type KnobResolver = (k: ClinicalKnobs, base: CoreRuntimeParams) => ParameterPatch;

/** EDPVR beta (b_pas) the chamber model uses, honoring a baseline override. */
function baseBPas(base: CoreRuntimeParams, chamber: "LV" | "RV"): number {
  const active = base.nodeOverrides?.[chamber]?.active;
  if (active && typeof active === "object" && typeof active.bPas === "number") return active.bPas;
  return chamber === "LV" ? defaultActiveLV.bPas : defaultActiveRV.bPas;
}

/**
 * v0.2 — active-stress default engine. LV inotropy maps to `lvTmaxScale` and RV
 * to `rvTmaxScale` — the per-chamber force scales — so LV and RV contractility
 * are INDEPENDENT (the global `contractility` raw param hits both ventricles, so
 * mapping a clinical "LV contractility" onto it would silently move the RV too;
 * lvTmaxScale is the engine's designated contractility slider). diastolic
 * stiffness scales b_pas (EDPVR beta) per ventricle via the active-chamber
 * override. Valve lesions and the stiffness/inotropy deviations emit keys ONLY
 * when the knob departs from neutral, so a neutral knob set reproduces the
 * baseline byte-for-byte (leak area is a fraction of the valve's own orifice).
 */
const resolveActiveStress_0_2: KnobResolver = (k, base) => {
  const p: ParameterPatch = {
    HR: k.HR,
    lvTmaxScale: base.lvTmaxScale * k.contractility,
    rvTmaxScale: base.rvTmaxScale * k.contractilityRV,
    relaxation: base.relaxation * k.relaxation,
    systemicResistance: base.systemicResistance * k.afterload,
    arterialStiffness: base.arterialStiffness * k.arterialStiffness,
    pulmonaryResistance: base.pulmonaryResistance * k.pulmonaryResistance,
    venousTone: k.venousTone,
    PEEP: k.peep,
  };

  // diastolicStiffness -> b_pas (EDPVR beta), scaled per ventricle. Emitted only
  // off-neutral so neutral knobs leave the baseline overrides untouched.
  // baroreflexEnabled -> M8 remains unmapped (documented model limitation).
  if (k.diastolicStiffness !== 1) {
    p.nodeOverrides = {
      LV: { active: { bPas: baseBPas(base, "LV") * k.diastolicStiffness } },
      RV: { active: { bPas: baseBPas(base, "RV") * k.diastolicStiffness } },
    };
  }

  if (k.aorticStenosis > 0) {
    p.AoV_Amax = base.AoV_Amax * (1 - 0.75 * k.aorticStenosis);
    p.AoV_R = base.AoV_R * (1 + 5 * k.aorticStenosis);
  }
  // Regurgitant leak area = fraction of the valve's own max orifice. Coefficients
  // calibrated (docs/research/valve-lesions.md) so severity 1.0 lands a clinically
  // SEVERE effective regurgitant orifice (~0.35–0.6 cm²): MR 5·0.11=0.55, AR 3.5·0.083≈0.29,
  // TR 8·0.06≈0.48. The previous 0.25–0.3 coefficients were ~3× too aggressive (even
  // "mild" exceeded a severe EROA and a large leak pinned the LV at its 3 mL floor).
  if (k.aorticRegurgitation > 0) {
    p.AoV_Aleak = base.AoV_Amax * (0.083 * k.aorticRegurgitation);
  }
  if (k.mitralStenosis > 0) {
    p.MV_Amax = base.MV_Amax * (1 - 0.75 * k.mitralStenosis);
    p.MV_R = base.MV_R * (1 + 5 * k.mitralStenosis);
  }
  if (k.mitralRegurgitation > 0) {
    p.MV_Aleak = base.MV_Amax * (0.11 * k.mitralRegurgitation);
  }
  if (k.tricuspidRegurgitation > 0) {
    p.TV_Aleak = base.TV_Amax * (0.06 * k.tricuspidRegurgitation);
  }
  if (k.pulmonicStenosis > 0) {
    p.PV_Amax = base.PV_Amax * (1 - 0.75 * k.pulmonicStenosis);
    p.PV_R = base.PV_R * (1 + 5 * k.pulmonicStenosis);
  }

  return p;
};

/**
 * v0.3 — same clinical vocabulary as v0.2, but stenosis uses the new A/Aref
 * valve-area semantics. Since Amax now directly increases R/B loss when reduced,
 * the explicit R multiplier becomes a roughness/jet-loss supplement rather than
 * the whole stenosis mechanism.
 */
const resolveActiveStress_0_3: KnobResolver = (k, base) => {
  const p = resolveActiveStress_0_2(k, base);
  if (k.aorticStenosis > 0) {
    p.AoV_R = base.AoV_R * (1 + 2 * k.aorticStenosis);
  }
  if (k.mitralStenosis > 0) {
    p.MV_R = base.MV_R * (1 + 2 * k.mitralStenosis);
  }
  if (k.pulmonicStenosis > 0) {
    p.PV_R = base.PV_R * (1 + 2 * k.pulmonicStenosis);
  }
  return p;
};

/** The versioned registry. Add new entries; never mutate a shipped one. */
export const KNOB_RESOLVERS: Readonly<Record<string, KnobResolver>> = {
  "knobmap-0.2-activestress": resolveActiveStress_0_2,
  "knobmap-0.3-activestress": resolveActiveStress_0_3,
};

/** Current mapping version stamped into newly-authored cases. */
export const KNOB_MAPPING_VERSION = "knobmap-0.3-activestress";

/**
 * Look up a resolver by version. NO SILENT FALLBACK: an unknown version throws,
 * so a case authored against a future/older map can never be mis-resolved with
 * the wrong coefficients (which would silently distort the physiology).
 */
export function resolveKnobMappingVersion(version: string): KnobResolver {
  const r = KNOB_RESOLVERS[version];
  if (!r) {
    throw new Error(
      `Unknown knobMappingVersion "${version}". Known: ${Object.keys(KNOB_RESOLVERS).join(", ")}. ` +
      `Refusing to resolve (no silent fallback) — upgrade the engine or migrate the case.`,
    );
  }
  return r;
}

/**
 * Clamp knobs, then resolve to a raw ParameterPatch via the named mapping.
 * `version` is REQUIRED (no default): authoring passes KNOB_MAPPING_VERSION
 * explicitly, while a case loader MUST pass the document's own
 * knobMappingVersion — so an old/foreign case can never be silently resolved
 * with the current coefficients.
 */
export function resolveKnobsToParams(
  k: ClinicalKnobs,
  base: CoreRuntimeParams,
  version: string,
): ParameterPatch {
  return resolveKnobMappingVersion(version)(clampKnobs(k), base);
}

/** Deep-merge two node-override blocks (one level into the `active` sub-block);
 *  `b` wins at the leaf. Exported so the case-resolution layer can layer a raw
 *  patch's overrides over the knob-driven ones without clobbering them. */
export function mergeNodeOverrides(a: OverrideBlock | undefined, b: OverrideBlock | undefined): OverrideBlock | undefined {
  if (!a) return b;
  if (!b) return a;
  const out: OverrideBlock = {};
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const fa = a[node] ?? {};
    const fb = b[node] ?? {};
    const fields: Record<string, number | Record<string, number>> = { ...fa };
    for (const [key, vb] of Object.entries(fb)) {
      const va = fields[key];
      if (va && typeof va === "object" && vb && typeof vb === "object") {
        fields[key] = { ...va, ...vb }; // merge nested (e.g. active) sub-blocks
      } else {
        fields[key] = vb;
      }
    }
    out[node] = fields;
  }
  return out;
}

/**
 * Full resolution to integrator-ready params: base <- patch (node overrides
 * deep-merged so a knob-driven b_pas does not clobber baseline chamber
 * overrides), then the authoritative sanitize gate. This is what the app/case
 * loader feeds ModelCore. `version` is REQUIRED — see resolveKnobsToParams.
 */
export function applyKnobs(
  base: CoreRuntimeParams,
  k: ClinicalKnobs,
  version: string,
): CoreRuntimeParams {
  const patch = resolveKnobsToParams(k, base, version);
  const merged = { ...base, ...patch } as CoreRuntimeParams;
  const mergedNodes = mergeNodeOverrides(base.nodeOverrides, patch.nodeOverrides);
  if (mergedNodes) merged.nodeOverrides = mergedNodes;
  const result = sanitizeParams(merged);
  // Carry the override keys EXPLICITLY (present even when undefined). The live
  // preview applies this full param set every frame via setImmediateParameters,
  // which MERGES — so an absent key would leave a stale override in the core
  // (e.g. returning diastolicStiffness to neutral would not un-stiffen the
  // chamber, because its b_pas override would never be cleared).
  if (!("nodeOverrides" in result)) (result as { nodeOverrides?: unknown }).nodeOverrides = undefined;
  if (!("edgeOverrides" in result)) (result as { edgeOverrides?: unknown }).edgeOverrides = undefined;
  return result;
}

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

import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";
import { sanitizeParams } from "@/engine/protocol";

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

/**
 * v0.2 — active-stress default engine. LV inotropy rides the global
 * `contractility` multiplier; RV gets an additional `rvTmaxScale` trim. Valve
 * lesions emit keys ONLY when present, so a healthy valve keeps its exact
 * baseline parameters (leak area is a fraction of the valve's own max orifice).
 */
const resolveActiveStress_0_2: KnobResolver = (k, base) => {
  const p: ParameterPatch = {
    HR: k.HR,
    contractility: base.contractility * k.contractility,
    relaxation: base.relaxation * k.relaxation,
    systemicResistance: base.systemicResistance * k.afterload,
    arterialStiffness: base.arterialStiffness * k.arterialStiffness,
    pulmonaryResistance: base.pulmonaryResistance * k.pulmonaryResistance,
    venousTone: k.venousTone,
    PEEP: k.peep,
    rvTmaxScale: base.rvTmaxScale * k.contractilityRV,
  };

  // diastolicStiffness -> b_pas (EDPVR beta) and baroreflexEnabled -> M8 are
  // intentionally UNMAPPED in v0.2 (documented model limitation): the engine has
  // no CoreRuntimeParams field for either yet. diastolicStiffness is the next
  // focused step (b_pas plumbing in the active-stress chamber model).

  if (k.aorticStenosis > 0) {
    p.AoV_Amax = base.AoV_Amax * (1 - 0.75 * k.aorticStenosis);
    p.AoV_R = base.AoV_R * (1 + 5 * k.aorticStenosis);
  }
  if (k.aorticRegurgitation > 0) {
    p.AoV_Aleak = base.AoV_Amax * (0.25 * k.aorticRegurgitation);
  }
  if (k.mitralStenosis > 0) {
    p.MV_Amax = base.MV_Amax * (1 - 0.75 * k.mitralStenosis);
    p.MV_R = base.MV_R * (1 + 5 * k.mitralStenosis);
  }
  if (k.mitralRegurgitation > 0) {
    p.MV_Aleak = base.MV_Amax * (0.3 * k.mitralRegurgitation);
  }
  if (k.tricuspidRegurgitation > 0) {
    p.TV_Aleak = base.TV_Amax * (0.3 * k.tricuspidRegurgitation);
  }
  if (k.pulmonicStenosis > 0) {
    p.PV_Amax = base.PV_Amax * (1 - 0.75 * k.pulmonicStenosis);
    p.PV_R = base.PV_R * (1 + 5 * k.pulmonicStenosis);
  }

  return p;
};

/** The versioned registry. Add new entries; never mutate a shipped one. */
export const KNOB_RESOLVERS: Readonly<Record<string, KnobResolver>> = {
  "knobmap-0.2-activestress": resolveActiveStress_0_2,
};

/** Current mapping version stamped into newly-authored cases. */
export const KNOB_MAPPING_VERSION = "knobmap-0.2-activestress";

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

/** Clamp knobs, then resolve to a raw ParameterPatch via the pinned version. */
export function resolveKnobsToParams(
  k: ClinicalKnobs,
  base: CoreRuntimeParams,
  version: string = KNOB_MAPPING_VERSION,
): ParameterPatch {
  return resolveKnobMappingVersion(version)(clampKnobs(k), base);
}

/**
 * Full resolution to integrator-ready params: base <- patch, then the
 * authoritative sanitize gate. This is what the app/case loader feeds ModelCore.
 */
export function applyKnobs(
  base: CoreRuntimeParams,
  k: ClinicalKnobs,
  version: string = KNOB_MAPPING_VERSION,
): CoreRuntimeParams {
  const patch = resolveKnobsToParams(k, base, version);
  return sanitizeParams({ ...base, ...patch } as CoreRuntimeParams);
}

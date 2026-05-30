// Pure reducers for the knob-primary instance state used by the Workbench UI.
// Extracted from React so the (subtle) compose semantics are unit-testable:
//   - an instance is "knob-primary" once it has `knobs` + `knobBaseline`;
//   - live `params` are DERIVED via applyKnobs(knobBaseline, knobs);
//   - a raw (advanced) edit updates the authored baseline so the clinical knobs
//     multiply on top — EXCEPT for the absolute knobs (HR/venousTone/PEEP),
//     which the resolver overwrites, so a raw edit to those must update the KNOB
//     or it would be a silent no-op.

import type { CoreRuntimeParams } from "@/engine/protocol";
import { applyKnobs, KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";

export type KnobState = {
  params: CoreRuntimeParams;
  knobs?: ClinicalKnobs;
  knobBaseline?: CoreRuntimeParams;
};

/**
 * Raw param keys the clinical knobs own ABSOLUTELY (resolveKnobsToParams sets
 * params[key] = knob value, ignoring the baseline). A raw edit to one of these
 * on a knob-primary instance is routed to the knob instead of the baseline.
 */
export const ABSOLUTE_KNOB_KEYS: Partial<Record<keyof CoreRuntimeParams, keyof ClinicalKnobs>> = {
  HR: "HR",
  venousTone: "venousTone",
  PEEP: "peep",
};

/** Clinical-knob edit: makes the instance knob-primary, deriving params. */
export function resolveKnobEdit(
  state: KnobState,
  newKnobs: ClinicalKnobs,
  version: string = KNOB_MAPPING_VERSION,
): KnobState {
  const knobBaseline = state.knobBaseline ?? state.params;
  return { knobs: newKnobs, knobBaseline, params: applyKnobs(knobBaseline, newKnobs, version) };
}

/** Raw (advanced) param edit. Legacy until the instance is knob-primary. */
export function resolveRawEdit(
  state: KnobState,
  patch: Partial<CoreRuntimeParams>,
  version: string = KNOB_MAPPING_VERSION,
): KnobState {
  // Legacy raw-only instance: edit params directly (unchanged behavior).
  if (!state.knobs || !state.knobBaseline) {
    return { ...state, params: { ...state.params, ...patch } as CoreRuntimeParams };
  }
  // Knob-primary: split the edit. Absolute-knob keys go to the knob (else the
  // resolver re-pins them and the slider is dead); everything else edits the
  // authored baseline, which the clinical knobs then multiply on top.
  let knobs = state.knobs;
  const baselinePatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const knobKey = ABSOLUTE_KNOB_KEYS[key as keyof CoreRuntimeParams];
    if (knobKey && typeof value === "number") {
      knobs = { ...knobs, [knobKey]: value };
    } else {
      baselinePatch[key] = value;
    }
  }
  const knobBaseline = { ...state.knobBaseline, ...baselinePatch } as CoreRuntimeParams;
  return { knobs, knobBaseline, params: applyKnobs(knobBaseline, knobs, version) };
}

/**
 * The values the RAW advanced sliders should display on a knob-primary instance:
 * the authored baseline (what they edit), but with the absolute-knob params taken
 * from the live derived params (= the knob value), so no slider shows a value
 * different from what an edit would set.
 */
export function rawDisplayParams(state: KnobState): CoreRuntimeParams {
  if (!state.knobs || !state.knobBaseline) return state.params;
  const view = { ...state.knobBaseline } as CoreRuntimeParams;
  for (const pKey of Object.keys(ABSOLUTE_KNOB_KEYS) as (keyof CoreRuntimeParams)[]) {
    (view as Record<string, unknown>)[pKey as string] = state.params[pKey];
  }
  return view;
}

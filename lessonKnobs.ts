import type { LessonStep, NumericKnobKey } from "@/lessonDoc";
import type { SimInstance } from "@/types";
import { clampKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { resolveKnobEdit } from "@/engine/instanceKnobs";

export function applyExposedKnob(inst: SimInstance, key: NumericKnobKey, value: number): SimInstance {
  const current = inst.knobs ?? neutralKnobs(inst.knobBaseline ?? inst.params);
  const nextKnobs = clampKnobs({ ...current, [key]: value });
  const next = resolveKnobEdit(
    { params: inst.params, knobs: inst.knobs, knobBaseline: inst.knobBaseline },
    nextKnobs,
    KNOB_MAPPING_VERSION,
  );
  return {
    ...inst,
    params: next.params,
    knobs: next.knobs,
    knobBaseline: next.knobBaseline,
  };
}

export function resolveKnobTarget(step: LessonStep | undefined, ids: string[]): string | undefined {
  if (!step) return undefined;
  const validIds = new Set(ids);
  const visibleIds = new Set(step.stage.visibleInstances);
  const requested = step.stage.knobInstanceId;
  if (requested && validIds.has(requested) && visibleIds.has(requested)) return requested;
  const firstVisible = step.stage.visibleInstances[0];
  return firstVisible && validIds.has(firstVisible) ? firstVisible : undefined;
}

export function deriveStepInstances(baseInstances: SimInstance[], step: LessonStep | undefined): SimInstance[] {
  const targetId = resolveKnobTarget(step, baseInstances.map((inst) => inst.id));
  if (!targetId || !step?.stage.initialState) return baseInstances;

  const entries = Object.entries(step.stage.initialState) as [NumericKnobKey, number][];
  if (entries.length === 0) return baseInstances;

  return baseInstances.map((inst) => {
    if (inst.id !== targetId) return inst;
    return entries.reduce((current, [key, value]) => applyExposedKnob(current, key, value), inst);
  });
}

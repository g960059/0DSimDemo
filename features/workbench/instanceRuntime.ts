import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs, type ClinicalKnobs } from "@/engine/knobs";
import { resolveKnobEdit, resolveRawEdit } from "@/engine/instanceKnobs";
import type { SimInstance, SimulationParams } from "@/types";

export type RequestSteadyTransition = (id: string, nextInstances: SimInstance[]) => void;

export function updateRuntimeInstanceParams(
  instances: readonly SimInstance[],
  id: string,
  newParams: Partial<SimulationParams>,
): SimInstance[] {
  return instances.map((instance) =>
    instance.id === id
      ? { ...instance, ...resolveRawEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newParams) }
      : instance
  );
}

export function updateRuntimeInstanceKnobs(
  instances: readonly SimInstance[],
  id: string,
  newKnobs: ClinicalKnobs,
  requestSteadyTransition: RequestSteadyTransition,
): SimInstance[] {
  const next = instances.map((instance) =>
    instance.id === id
      ? { ...instance, ...resolveKnobEdit({ params: instance.params, knobs: instance.knobs, knobBaseline: instance.knobBaseline }, newKnobs) }
      : instance
  );
  requestSteadyTransition(id, next);
  return next;
}

export function updateRuntimeInstanceVolume(
  instances: readonly SimInstance[],
  id: string,
  volume: number,
  requestSteadyTransition: RequestSteadyTransition,
): SimInstance[] {
  const next = instances.map((instance) => (
    instance.id === id ? { ...instance, targetVolume: volume } : instance
  ));
  requestSteadyTransition(id, next);
  return next;
}

export function toggleRuntimeScenarioGlobalVisibility(
  instances: readonly SimInstance[],
  id: string,
): SimInstance[] {
  return instances.map((instance) => (
    instance.id === id ? { ...instance, isVisible: instance.isVisible === false } : instance
  ));
}

export function resetRuntimeInstanceKnobs(
  instances: readonly SimInstance[],
  id: string,
  requestSteadyTransition: RequestSteadyTransition,
): SimInstance[] {
  let changed = false;
  const next = instances.map((instance) => {
    if (instance.id !== id || !instance.knobBaseline) return instance;
    changed = true;
    const knobs = neutralKnobs(instance.knobBaseline);
    return {
      ...instance,
      knobs,
      params: applyKnobs(instance.knobBaseline, knobs, KNOB_MAPPING_VERSION),
    };
  });
  if (changed) requestSteadyTransition(id, next);
  return next;
}

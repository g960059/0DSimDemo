import { useCallback, useEffect, useState } from "react";
import { caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import type { ClinicalKnobs } from "@/engine/knobs";
import type { SimInstance, SimulationParams } from "@/types";
import {
  resetRuntimeInstanceKnobs,
  toggleRuntimeScenarioGlobalVisibility,
  updateRuntimeInstanceKnobs,
  updateRuntimeInstanceParams,
  updateRuntimeInstanceVolume,
  type RequestSteadyTransition,
} from "@/features/workbench/instanceRuntime";
import { resolveAuthorActiveInstanceId } from "@/features/workbench/hooks/useWorkbenchScene";
import { useWorkbenchSimulation } from "@/features/workbench/hooks/useWorkbenchSimulation";

const noopInstancesAdded = (_ids: string[]): void => {};

export type PreviewRuntimeInitialState = {
  instances: SimInstance[];
  activeInstanceId: string;
};

export function createPreviewRuntimeInitialState(doc: CaseDocument): PreviewRuntimeInitialState {
  const instances = caseDocumentToSimInstances(doc);
  return {
    instances,
    activeInstanceId: resolveAuthorActiveInstanceId(instances, instances[0]?.id ?? "", doc.initialActiveScenarioId),
  };
}

export const updatePreviewInstanceParams = updateRuntimeInstanceParams;
export const updatePreviewInstanceKnobs = updateRuntimeInstanceKnobs;
export const updatePreviewInstanceVolume = updateRuntimeInstanceVolume;
export const togglePreviewScenarioGlobalVisibility = toggleRuntimeScenarioGlobalVisibility;
export const resetPreviewInstanceKnobs = resetRuntimeInstanceKnobs;

export function usePreviewRuntime(doc: CaseDocument) {
  const [state, setState] = useState<PreviewRuntimeInitialState>(() => createPreviewRuntimeInitialState(doc));
  // STABLE noop: useWorkbenchSimulation's setup effect depends on onInstancesAdded and calls
  // setState internally; an inline `() => {}` (new ref each render) would re-run it every render
  // and trigger "Maximum update depth exceeded". Preview never adds instances, so a fixed noop is fine.
  const simulation = useWorkbenchSimulation(state.instances, noopInstancesAdded);

  useEffect(() => {
    setState(createPreviewRuntimeInitialState(doc));
  }, [doc]);

  const setActiveInstanceId = useCallback((id: string) => {
    setState((prev) => prev.instances.some((instance) => instance.id === id)
      ? { ...prev, activeInstanceId: id }
      : prev);
  }, []);

  const updateInstances = useCallback((
    updater: (instances: readonly SimInstance[], requestSteadyTransition: RequestSteadyTransition) => SimInstance[],
  ) => {
    setState((prev) => ({
      ...prev,
      instances: updater(prev.instances, simulation.requestSteadyTransition),
    }));
  }, [simulation.requestSteadyTransition]);

  const updateInstanceParams = useCallback((id: string, params: Partial<SimulationParams>) => {
    updateInstances((instances) => updatePreviewInstanceParams(instances, id, params));
  }, [updateInstances]);

  const updateInstanceKnobs = useCallback((id: string, knobs: ClinicalKnobs) => {
    updateInstances((instances, requestSteadyTransition) => updatePreviewInstanceKnobs(instances, id, knobs, requestSteadyTransition));
  }, [updateInstances]);

  const updateInstanceVolume = useCallback((id: string, volume: number) => {
    updateInstances((instances, requestSteadyTransition) => updatePreviewInstanceVolume(instances, id, volume, requestSteadyTransition));
  }, [updateInstances]);

  const toggleScenarioGlobalVisibility = useCallback((id: string) => {
    updateInstances((instances) => togglePreviewScenarioGlobalVisibility(instances, id));
  }, [updateInstances]);

  const resetInstanceKnobs = useCallback((id: string) => {
    updateInstances((instances, requestSteadyTransition) => resetPreviewInstanceKnobs(instances, id, requestSteadyTransition));
  }, [updateInstances]);

  const reset = useCallback(() => {
    const next = createPreviewRuntimeInitialState(doc);
    setState(next);
    next.instances.forEach((instance) => simulation.requestSteadyTransition(instance.id, next.instances));
  }, [doc, simulation]);

  return {
    instances: state.instances,
    activeInstanceId: state.activeInstanceId,
    setActiveInstanceId,
    setActive: setActiveInstanceId,
    toggleVisibility: toggleScenarioGlobalVisibility,
    toggleScenarioGlobalVisibility,
    updateInstanceParams,
    updateInstanceKnobs,
    updateInstanceVolume,
    resetInstanceKnobs,
    reset,
    simulation,
  };
}

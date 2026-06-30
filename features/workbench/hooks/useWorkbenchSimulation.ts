import { useCallback, useEffect, useRef, useState } from "react";
import { HealthToast } from "@/components/HealthIndicators";
import type { SimulationHealth } from "@/engine/protocol";
import { PreviewController, type SteadyUpdateStatusMap } from "@/engine/previewController";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import type { SimInstance } from "@/types";

export function useWorkbenchSimulation(
  instances: SimInstance[],
  onInstancesAdded: (ids: string[]) => void,
) {
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [instanceHealth, setInstanceHealth] = useState<Record<string, SimulationHealth>>({});
  const [instanceMorphology, setInstanceMorphology] = useState<Record<string, MorphologyCheckSummary>>({});
  const [steadyUpdateStatuses, setSteadyUpdateStatuses] = useState<SteadyUpdateStatusMap>({});
  const [healthToasts, setHealthToasts] = useState<HealthToast[]>([]);
  const controllerRef = useRef<PreviewController | null>(null);
  const controller = (controllerRef.current ??= new PreviewController());
  const pendingSteadyTransitionIdsRef = useRef<Set<string>>(new Set());
  const physicsRefs = useRef(controller.refs);

  const dismissToast = useCallback((id: string) => {
    setHealthToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushWarningToast = useCallback((name: string, message: string) => {
    const toast: HealthToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      status: "warning",
      message,
    };
    setHealthToasts((prev) => [...prev, toast].slice(-3));
  }, []);

  useEffect(() => {
    controller.onHealthChange = (map) => setInstanceHealth(map);
    controller.onToasts = (toasts) => setHealthToasts((prev) => [...prev, ...toasts].slice(-3));
    controller.onInstancesAdded = onInstancesAdded;
    controller.onSteadyUpdateStatusChange = setSteadyUpdateStatuses;
    setSteadyUpdateStatuses(controller.getSteadyUpdateStatuses());
    controller.start();
    return () => {
      controller.onHealthChange = undefined;
      controller.onToasts = undefined;
      controller.onInstancesAdded = undefined;
      controller.onSteadyUpdateStatusChange = undefined;
      controller.stop();
    };
  }, [controller, onInstancesAdded]);

  useEffect(() => {
    const steadyTransitionIds = [...pendingSteadyTransitionIdsRef.current];
    pendingSteadyTransitionIdsRef.current.clear();
    controller.setInstances(instances, steadyTransitionIds.length > 0 ? { steadyTransitionIds } : undefined);
  }, [controller, instances]);

  useEffect(() => {
    controller.setTimeScale(timeScale);
  }, [controller, timeScale]);

  useEffect(() => {
    controller.setPlaying(isPlaying);
  }, [controller, isPlaying]);

  useEffect(() => {
    const updateMorphology = () => {
      const next: Record<string, MorphologyCheckSummary> = {};
      for (const inst of instances) {
        const phys = controller.refs.get(inst.id);
        if (!phys || phys.buffer.length === 0) continue;
        next[inst.id] = morphologyCheckSummaryFromSamples(phys.buffer);
      }
      setInstanceMorphology((prev) => (
        morphologyMapSignature(prev) === morphologyMapSignature(next) ? prev : next
      ));
    };
    updateMorphology();
    const timer = window.setInterval(updateMorphology, 1000);
    return () => window.clearInterval(timer);
  }, [controller, instances]);

  const requestSteadyTransition = useCallback((id: string, nextInstances: SimInstance[]) => {
    const target = nextInstances.find((instance) => instance.id === id);
    pendingSteadyTransitionIdsRef.current.add(id);
    controller.setInstances(nextInstances, { steadyTransitionIds: [id] });
    if (target) controller.requestNextSteady(target);
  }, [controller]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const getLiveHealth = useCallback((id: string) => (
    controller.getLiveHealth(id)
  ), [controller]);

  return {
    controller,
    physicsRefs,
    timeScale,
    setTimeScale,
    isPlaying,
    setIsPlaying,
    togglePlay,
    instanceHealth,
    instanceMorphology,
    steadyUpdateStatuses,
    healthToasts,
    dismissToast,
    pushWarningToast,
    requestSteadyTransition,
    getLiveHealth,
  };
}

export type WorkbenchSimulationState = ReturnType<typeof useWorkbenchSimulation>;

function morphologyMapSignature(map: Record<string, MorphologyCheckSummary>): string {
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, summary]) => {
      const results = summary.results
        .map((result) => `${result.id}:${result.status}:${String(result.value)}`)
        .join(",");
      return `${id}:${summary.status}:${summary.checkedBeatSampleCount}:${results}`;
    })
    .join("|");
}

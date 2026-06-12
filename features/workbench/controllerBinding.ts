import type { SimInstance } from "@/types";
import type { ScenarioBinding } from "@/features/workbench/viewSpec";

export function resolveControllerTargetId(
  binding: ScenarioBinding | undefined,
  activeInstanceId: string | undefined,
  instances: readonly SimInstance[],
): string {
  const activeTarget = instances.some((instance) => instance.id === activeInstanceId)
    ? activeInstanceId!
    : instances[0]?.id ?? "";

  if (binding && "scenarioId" in binding && instances.some((instance) => instance.id === binding.scenarioId)) {
    return binding.scenarioId;
  }

  return activeTarget;
}

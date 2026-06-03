import type { PanelDef, PanelInstanceConfig, PanelViewConfig, SimInstance } from "./types";

function remapViewInstanceIds(view: PanelViewConfig | undefined, idMap: Map<string, string>): PanelViewConfig | undefined {
  if (!view || !("instances" in view) || !view.instances) return view;
  return {
    ...view,
    instances: Object.fromEntries(
      Object.entries(view.instances).map(([id, cfg]) => [idMap.get(id) ?? id, cfg]),
    ),
  } as PanelViewConfig;
}

export function remapWorkbenchLoadIds(
  instances: SimInstance[],
  panels: PanelDef[],
  nonce: string,
): {
  instances: SimInstance[];
  panels: PanelDef[];
  activeInstanceId: string;
  idMap: Map<string, string>;
} {
  const idMap = new Map<string, string>();
  const remappedInstances = instances.map((inst, i) => {
    const id = `c${nonce}_${i + 1}`;
    idMap.set(inst.id, id);
    return { ...inst, id };
  });
  const remappedPanels = panels.map((panel) => ({
    ...panel,
    config: Object.fromEntries(
      Object.entries(panel.config).map(([id, cfg]) => [idMap.get(id) ?? id, { ...cfg }]),
    ) as Record<string, PanelInstanceConfig>,
    view: remapViewInstanceIds(panel.view, idMap),
  }));

  return {
    instances: remappedInstances,
    panels: remappedPanels,
    activeInstanceId: remappedInstances[0]?.id ?? "1",
    idMap,
  };
}

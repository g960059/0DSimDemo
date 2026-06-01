import type { PanelDef, PanelInstanceConfig } from "./types";
import { flowPack } from "./layoutPresets";
import { roleOf } from "./paneRole";

function cloneConfig(config: Record<string, PanelInstanceConfig>): Record<string, PanelInstanceConfig> {
  return Object.fromEntries(
    Object.entries(config).map(([id, entry]) => [
      id,
      {
        ...entry,
        selectedSignals: [...entry.selectedSignals],
        ...(entry.customSignalColors ? { customSignalColors: { ...entry.customSignalColors } } : {}),
        ...(entry.customSignalNames ? { customSignalNames: { ...entry.customSignalNames } } : {}),
      },
    ]),
  );
}

function clonePanel(panel: PanelDef): PanelDef {
  return {
    ...panel,
    role: panel.role ?? roleOf(panel.type),
    config: cloneConfig(panel.config),
  };
}

export function applyPreset(_panels: PanelDef[], preset: PanelDef[]): PanelDef[] {
  return flowPack(preset.map(clonePanel));
}

export function addPane(panels: PanelDef[], pane: PanelDef): PanelDef[] {
  return flowPack([...panels.map(clonePanel), clonePanel(pane)]);
}

export function removePane(panels: PanelDef[], id: string): PanelDef[] {
  return panels.filter((panel) => panel.id !== id).map(clonePanel);
}

export function movePane(panels: PanelDef[], id: string, x: number, y: number): PanelDef[] {
  return panels.map((panel) => (
    panel.id === id
      ? { ...clonePanel(panel), x: Math.max(0, Math.floor(x)), y: Math.max(0, Math.floor(y)) }
      : clonePanel(panel)
  ));
}

export function resizePane(panels: PanelDef[], id: string, w: number, h: number): PanelDef[] {
  return panels.map((panel) => (
    panel.id === id
      ? { ...clonePanel(panel), w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) }
      : clonePanel(panel)
  ));
}

export function setPaneSignals(
  panels: PanelDef[],
  panelId: string,
  instanceId: string,
  selectedSignals: string[],
): PanelDef[] {
  return panels.map((panel) => {
    if (panel.id !== panelId) return clonePanel(panel);
    const next = clonePanel(panel);
    const previous = next.config[instanceId];
    next.config = {
      ...next.config,
      [instanceId]: {
        ...(previous ?? { visible: true }),
        selectedSignals: [...selectedSignals],
      },
    };
    return next;
  });
}

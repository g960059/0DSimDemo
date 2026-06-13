import { workspaceForPanels } from "@/caseDoc";
import { addPane } from "@/layoutOps";
import type { NoteContent } from "@/noteTypes";
import { defaultZoneOf } from "@/paneZone";
import type { PanelDef, PanelInstanceConfig, PanelType, SimInstance, WorkbenchWorkspace, WorkbenchZoneId } from "@/types";
import { mainDockviewViewStatesOnly } from "@/features/workbench/p1aStructuralHosts";
import { EMPTY_NOTE_SPINE, defaultSignalsForPanelType } from "./workbenchDefaults";

export function createDefaultPanelConfig(
  type: PanelType,
  instances: SimInstance[],
): Record<string, PanelInstanceConfig> {
  return Object.fromEntries(instances.map((instance) => [
    instance.id,
    { visible: type !== "NOTE", selectedSignals: defaultSignalsForPanelType(type) },
  ]));
}

export function titleForPanelType(type: PanelType): string {
  if (type === "PVLOOP") return "PV Loop";
  if (type === "WAVEFORM") return "Waveforms";
  if (type === "METRICS") return "Metrics";
  if (type === "SCENARIOS") return "Scenarios";
  if (type === "CONTROLS") return "Controls";
  if (type === "NOTE") return "Notes";
  if (type === "GUYTON_LEFT") return "Guyton Left";
  if (type === "GUYTON_RIGHT") return "Guyton Right";
  return "Guyton";
}

export function createPanelDef(
  type: PanelType,
  config: Record<string, PanelInstanceConfig>,
  zone: WorkbenchZoneId = defaultZoneOf(type),
  id = Date.now().toString(),
): PanelDef {
  return {
    id,
    type,
    zone,
    title: titleForPanelType(type),
    w: type === "NOTE" ? 6 : type === "METRICS" ? 4 : type === "CONTROLS" || type === "SCENARIOS" ? 4 : 6,
    h: type === "NOTE" ? 10 : type === "METRICS" ? 6 : type === "CONTROLS" ? 10 : type === "SCENARIOS" ? 4 : 8,
    config,
    isSettingsOpen: false,
    showGuides: type === "PVLOOP",
    timeWindow: type === "WAVEFORM" ? 5000 : undefined,
  };
}

export function workspaceAfterPanelsChanged(
  panels: PanelDef[],
  workspace: WorkbenchWorkspace,
): WorkbenchWorkspace {
  return mainDockviewViewStatesOnly(workspaceForPanels(panels, workspace));
}

export function notesAfterPanelAdded(
  notes: Record<string, NoteContent>,
  panel: PanelDef,
): Record<string, NoteContent> {
  return panel.type === "NOTE" ? { ...notes, [panel.id]: EMPTY_NOTE_SPINE } : notes;
}

export function noteModesAfterPanelAdded(
  noteModes: Record<string, "read" | "edit">,
  panel: PanelDef,
): Record<string, "read" | "edit"> {
  return panel.type === "NOTE" ? { ...noteModes, [panel.id]: "edit" } : noteModes;
}

export function notesAfterPanelRemoved(
  notes: Record<string, NoteContent>,
  panelId: string,
): Record<string, NoteContent> {
  if (!(panelId in notes)) return notes;
  const next = { ...notes };
  delete next[panelId];
  return next;
}

export function noteModesAfterPanelRemoved(
  noteModes: Record<string, "read" | "edit">,
  panelId: string,
): Record<string, "read" | "edit"> {
  if (!(panelId in noteModes)) return noteModes;
  const next = { ...noteModes };
  delete next[panelId];
  return next;
}

export function ensureNotePanelForDrawer({
  panels,
  instances,
  notes,
  noteModes,
  id = Date.now().toString(),
}: {
  panels: PanelDef[];
  instances: SimInstance[];
  notes: Record<string, NoteContent>;
  noteModes: Record<string, "read" | "edit">;
  id?: string;
}): {
  panels: PanelDef[];
  notes: Record<string, NoteContent>;
  noteModes: Record<string, "read" | "edit">;
  panel: PanelDef;
  created: boolean;
} {
  const existing = panels.find((panel) => panel.type === "NOTE");
  if (existing) {
    return { panels, notes, noteModes, panel: existing, created: false };
  }

  const panel = createPanelDef("NOTE", createDefaultPanelConfig("NOTE", instances), "caseRail", id);
  const nextPanels = addPane(panels, panel);
  return {
    panels: nextPanels,
    notes: notesAfterPanelAdded(notes, panel),
    noteModes: noteModesAfterPanelAdded(noteModes, panel),
    panel,
    created: true,
  };
}

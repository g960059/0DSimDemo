import { describe, expect, it } from "vitest";
import { workspaceForPanels } from "@/caseDoc";
import { layoutStateFromWorkspace } from "@/features/workbench/workbenchDefaults";
import type { PanelDef, WorkbenchWorkspace } from "@/types";

const panels: PanelDef[] = [
  { id: "note", type: "NOTE", title: "Note", w: 4, h: 8, config: {}, isSettingsOpen: false },
  { id: "pv", type: "PVLOOP", title: "PV", w: 6, h: 8, config: {}, isSettingsOpen: false },
  { id: "metrics", type: "METRICS", title: "Metrics", w: 4, h: 4, config: {}, isSettingsOpen: false },
  { id: "scenarios", type: "SCENARIOS", title: "Scenarios", w: 4, h: 4, config: {}, isSettingsOpen: false },
  { id: "controls", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: {}, isSettingsOpen: false },
];

function workspaceWithVisibility(visibility: {
  noteOpen: boolean;
  metricsOpen: boolean;
  rightRailVisible: boolean;
}): WorkbenchWorkspace {
  const workspace = workspaceForPanels(panels);
  return workspaceForPanels(panels, {
    ...workspace,
    regions: {
      ...workspace.regions,
      note: { ...workspace.regions.note, visible: visibility.noteOpen },
      output: { ...workspace.regions.output, visible: visibility.metricsOpen ? "compact" : false },
      control: { ...workspace.regions.control, visible: visibility.rightRailVisible },
    },
  });
}

describe("workbench defaults", () => {
  it.each([
    { noteOpen: false, metricsOpen: false, rightRailVisible: false },
    { noteOpen: true, metricsOpen: true, rightRailVisible: true },
  ])("round-trips host visibility through workspace state: %o", (visibility) => {
    const restored = layoutStateFromWorkspace(workspaceWithVisibility(visibility));

    expect(restored.noteOpen).toBe(visibility.noteOpen);
    expect(restored.metricsOpen).toBe(visibility.metricsOpen);
    expect(restored.rightRailVisible).toBe(visibility.rightRailVisible);
  });

  it("defaults missing right rail visibility to visible", () => {
    const workspace = workspaceForPanels(panels);
    const { visible: _visible, ...control } = workspace.regions.control ?? {};

    expect(layoutStateFromWorkspace({
      ...workspace,
      regions: { ...workspace.regions, control },
    }).rightRailVisible).toBe(true);
  });

  it("treats compact right rail visibility as visible", () => {
    const workspace = workspaceForPanels(panels);

    expect(layoutStateFromWorkspace({
      ...workspace,
      regions: {
        ...workspace.regions,
        control: { ...workspace.regions.control, visible: "compact" },
      },
    }).rightRailVisible).toBe(true);
  });
});

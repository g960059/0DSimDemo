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
  scenarioListCollapsed?: boolean;
  metricsSpan?: "main" | "full";
}): WorkbenchWorkspace {
  const workspace = workspaceForPanels(panels);
  return workspaceForPanels(panels, {
    ...workspace,
    hosts: {
      ...workspace.hosts,
      note: { open: visibility.noteOpen },
      metrics: {
        open: visibility.metricsOpen,
        ...(visibility.metricsSpan === "full" ? { span: "full" } : {}),
      },
      rightRail: {
        open: visibility.rightRailVisible,
        ...(visibility.scenarioListCollapsed ? { scenarioListCollapsed: true } : {}),
      },
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

  it("reads optional host state and supplies defaults when absent", () => {
    const restored = layoutStateFromWorkspace(workspaceWithVisibility({
      noteOpen: true,
      metricsOpen: true,
      rightRailVisible: true,
      scenarioListCollapsed: true,
      metricsSpan: "full",
    }));

    expect(restored.scenarioListCollapsed).toBe(true);
    expect(restored.metricsSpan).toBe("full");
    expect(layoutStateFromWorkspace(undefined).rightRailVisible).toBe(true);
    expect(layoutStateFromWorkspace(undefined).scenarioListCollapsed).toBe(false);
    expect(layoutStateFromWorkspace(undefined).metricsSpan).toBe("main");
  });

  it("strips default optional host values before layout restore", () => {
    const workspace = workspaceWithVisibility({
      noteOpen: true,
      metricsOpen: true,
      rightRailVisible: true,
      scenarioListCollapsed: false,
      metricsSpan: "main",
    });

    expect(workspace.hosts.rightRail).toEqual({ open: true });
    expect(workspace.hosts.metrics).toEqual({ open: true });
    expect(layoutStateFromWorkspace(workspace).scenarioListCollapsed).toBe(false);
    expect(layoutStateFromWorkspace(workspace).metricsSpan).toBe("main");
  });
});

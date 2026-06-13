import { describe, expect, it } from "vitest";
import { defaultWorkspaceForPanels, workspaceForPanels } from "@/caseDoc";
import { LESSONS, lessonToCaseDocument } from "@/lessonDoc";
import type { DockviewViewState, PanelDef, WorkbenchWorkspace } from "@/types";

const panels: PanelDef[] = [
  { id: "note", type: "NOTE", title: "Note", w: 4, h: 8, config: {}, isSettingsOpen: false },
  { id: "pv", type: "PVLOOP", title: "PV", w: 6, h: 8, config: {}, isSettingsOpen: false },
  { id: "wave", type: "WAVEFORM", title: "Wave", w: 6, h: 8, config: {}, isSettingsOpen: false },
  { id: "metrics", type: "METRICS", title: "Metrics", w: 4, h: 4, config: {}, isSettingsOpen: false },
  { id: "scenarios", type: "SCENARIOS", title: "Scenarios", w: 4, h: 4, config: {}, isSettingsOpen: false },
  { id: "controls", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: {}, isSettingsOpen: false },
];

describe("semantic workspace", () => {
  it("derives deterministic v2 host state", () => {
    const workspace = defaultWorkspaceForPanels(panels);

    expect(workspace.schemaVersion).toBe(2);
    expect("mode" in workspace).toBe(false);
    expect("regions" in workspace).toBe(false);
    expect(workspace.hosts).toEqual({
      note: { open: true },
      rightRail: { open: true },
      metrics: { open: true },
      main: {},
    });
  });

  it("embeds a lesson layer into a canonical case document", () => {
    const doc = lessonToCaseDocument(LESSONS[0]);

    expect(doc?.kind).toBe("lesson");
    expect(doc?.meta.id).toBe(LESSONS[0].meta.id);
    expect(doc?.lesson?.noteSpine).toEqual(LESSONS[0].noteSpine);
    expect(doc?.panels.length).toBeGreaterThan(0);
    expect(doc?.instances.length).toBeGreaterThan(0);
  });

  it("preserves main Dockview state while stripping default host fields", () => {
    const dockviewState: DockviewViewState = {
      library: "dockview" as const,
      schemaVersion: 1 as const,
      state: { panels: { pv: {} }, grid: { root: {}, height: 100, width: 100, orientation: "HORIZONTAL" } },
      updatedAt: 10,
    };
    const previous: WorkbenchWorkspace = {
      schemaVersion: 2,
      hosts: {
        note: { open: true },
        rightRail: { open: false, scenarioListCollapsed: false },
        metrics: { open: true, span: "main" },
        main: { dockviewState },
      },
      learnerLocked: false,
    };
    const next = workspaceForPanels(panels.filter((panel) => panel.id !== "wave"), previous);

    expect(next.hosts.main.dockviewState).toBe(dockviewState);
    expect(next.hosts.rightRail).toEqual({ open: false });
    expect(next.hosts.metrics).toEqual({ open: true });
    expect(next.learnerLocked).toBe(false);
    expect("mode" in next).toBe(false);
  });

  it("clamps note and metrics hosts to defaults when backing panels disappear", () => {
    const previous: WorkbenchWorkspace = {
      schemaVersion: 2,
      hosts: {
        note: { open: true },
        rightRail: { open: false, scenarioListCollapsed: true },
        metrics: { open: true, span: "full" },
        main: {},
      },
      learnerLocked: true,
    };
    const next = workspaceForPanels(panels.filter((panel) => panel.id !== "note" && panel.id !== "metrics"), previous);

    expect(next.hosts.note.open).toBe(false);
    expect(next.hosts.metrics).toEqual({ open: false, span: "full" });
    expect(next.hosts.rightRail).toEqual({ open: false, scenarioListCollapsed: true });
  });

  it("rebuilds a default v2 workspace for old-shaped workspace blobs", () => {
    const oldDocWorkspace = {
      schemaVersion: 1,
      regions: {
        control: { visible: false, position: "left", panelIds: ["controls"] },
        note: { visible: false, position: "right", panelIds: ["note"] },
        output: { visible: false, position: "bottom", panelIds: ["metrics"] },
      },
    };

    expect(workspaceForPanels(panels, oldDocWorkspace as unknown as WorkbenchWorkspace)).toEqual(defaultWorkspaceForPanels(panels));
  });

  it("rebuilds a default v2 workspace for a malformed v2 workspace (hosts without boolean open)", () => {
    const malformed = {
      schemaVersion: 2,
      hosts: { note: {}, rightRail: {}, metrics: {}, main: {} },
    };

    expect(workspaceForPanels(panels, malformed as unknown as WorkbenchWorkspace)).toEqual(defaultWorkspaceForPanels(panels));
  });
});

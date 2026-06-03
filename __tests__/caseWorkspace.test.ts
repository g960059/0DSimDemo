import { describe, expect, it } from "vitest";
import { defaultWorkspaceForPanels, workspaceForPanels } from "@/caseDoc";
import { LESSONS, lessonToCaseDocument } from "@/lessonDoc";
import type { PanelDef } from "@/types";

const panels: PanelDef[] = [
  { id: "note", type: "NOTE", title: "Note", w: 4, h: 8, config: {}, isSettingsOpen: false },
  { id: "pv", type: "PVLOOP", title: "PV", w: 6, h: 8, config: {}, isSettingsOpen: false },
  { id: "wave", type: "WAVEFORM", title: "Wave", w: 6, h: 8, config: {}, isSettingsOpen: false },
  { id: "metrics", type: "METRICS", title: "Metrics", w: 4, h: 4, config: {}, isSettingsOpen: false },
  { id: "controls", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: {}, isSettingsOpen: false },
];

describe("semantic workspace", () => {
  it("groups panels into deterministic role regions", () => {
    const workspace = defaultWorkspaceForPanels(panels, "compare");

    expect(workspace.schemaVersion).toBe(1);
    expect(workspace.mode).toBe("compare");
    expect(workspace.regions.graph?.panelIds).toEqual(["pv", "wave"]);
    expect(workspace.regions.graph?.activePanelId).toBe("pv");
    expect(workspace.regions.output?.visible).toBe("compact");
    expect(workspace.regions.control?.position).toBe("left");
    expect(workspace.regions.note?.position).toBe("right");
    expect(workspace.regions.scenarios?.visible).toBe(true);
  });

  it("embeds a lesson layer into a canonical case document", () => {
    const doc = lessonToCaseDocument(LESSONS[0]);

    expect(doc?.kind).toBe("lesson");
    expect(doc?.meta.id).toBe(LESSONS[0].meta.id);
    expect(doc?.lesson?.noteSpine).toEqual(LESSONS[0].noteSpine);
    expect(doc?.panels.length).toBeGreaterThan(0);
    expect(doc?.instances.length).toBeGreaterThan(0);
  });

  it("preserves Dockview state while recalculating semantic panel regions", () => {
    const viewState = {
      library: "dockview" as const,
      schemaVersion: 1 as const,
      state: { panels: { pv: {} }, grid: { root: {}, height: 100, width: 100, orientation: "HORIZONTAL" } },
      updatedAt: 10,
    };
    const previous = {
      ...defaultWorkspaceForPanels(panels, "custom"),
      regions: {
        ...defaultWorkspaceForPanels(panels, "custom").regions,
        graph: { visible: true, position: "center" as const, panelIds: ["pv", "wave"], activePanelId: "wave" },
      },
      viewState,
    };
    const next = workspaceForPanels(panels.filter((panel) => panel.id !== "wave"), previous);

    expect(next.viewState).toBe(viewState);
    expect(next.regions.graph?.panelIds).toEqual(["pv"]);
    expect(next.regions.graph?.activePanelId).toBe("pv");
    expect(next.mode).toBe("custom");
  });
});

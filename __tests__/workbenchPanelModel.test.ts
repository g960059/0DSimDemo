import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  createDefaultPanelConfig,
  createPanelDef,
  ensureNotePanelForDrawer,
  noteModesAfterPanelAdded,
  noteModesAfterPanelRemoved,
  notesAfterPanelAdded,
  notesAfterPanelRemoved,
  titleForPanelType,
} from "@/features/workbench/panelModel";
import { EMPTY_NOTE_SPINE } from "@/features/workbench/workbenchDefaults";
import type { PanelDef, SimInstance } from "@/types";

function instance(id: string): SimInstance {
  return {
    id,
    name: `Heart ${id}`,
    color: "#ffffff",
    params: { ...DEFAULT_PARAMS },
    targetVolume: 5600,
    isVisible: true,
  };
}

describe("workbench panel model", () => {
  it("creates default panel config for every instance", () => {
    const config = createDefaultPanelConfig("WAVEFORM", [instance("1"), instance("2")]);

    expect(config).toEqual({
      "1": { visible: true, selectedSignals: ["LVP", "AoP"] },
      "2": { visible: true, selectedSignals: ["LVP", "AoP"] },
    });
  });

  it("hides note panels by default while keeping instance entries", () => {
    const config = createDefaultPanelConfig("NOTE", [instance("1"), instance("2")]);

    expect(config).toEqual({
      "1": { visible: false, selectedSignals: [] },
      "2": { visible: false, selectedSignals: [] },
    });
  });

  it("keeps current title, size, zone, guide, and time-window defaults", () => {
    expect(titleForPanelType("PVLOOP")).toBe("PV Loop");
    expect(titleForPanelType("GUYTON_3D")).toBe("Guyton");

    expect(createPanelDef("PVLOOP", {}, "main", "pv")).toMatchObject({
      id: "pv",
      type: "PVLOOP",
      zone: "main",
      title: "PV Loop",
      w: 6,
      h: 8,
      isSettingsOpen: false,
      showGuides: true,
    });
    expect(createPanelDef("WAVEFORM", {}, undefined, "wave")).toMatchObject({
      id: "wave",
      zone: "main",
      timeWindow: 5000,
    });
    expect(createPanelDef("NOTE", {}, undefined, "note")).toMatchObject({
      id: "note",
      zone: "caseRail",
      w: 6,
      h: 10,
    });
  });

  it("adds and removes note bookkeeping only for note panels", () => {
    const notePanel: PanelDef = createPanelDef("NOTE", {}, "caseRail", "note");
    const graphPanel: PanelDef = createPanelDef("PVLOOP", {}, "main", "pv");
    const notes = notesAfterPanelAdded({}, notePanel);
    const modes = noteModesAfterPanelAdded({}, notePanel);

    expect(notes).toEqual({ note: EMPTY_NOTE_SPINE });
    expect(modes).toEqual({ note: "edit" });
    expect(notesAfterPanelAdded(notes, graphPanel)).toBe(notes);
    expect(noteModesAfterPanelAdded(modes, graphPanel)).toBe(modes);
    expect(notesAfterPanelRemoved(notes, "note")).toEqual({});
    expect(noteModesAfterPanelRemoved(modes, "note")).toEqual({});
  });

  it("creates a drawer note with note content and edit mode when missing", () => {
    const graphPanel: PanelDef = createPanelDef("PVLOOP", {}, "main", "pv");
    const result = ensureNotePanelForDrawer({
      panels: [graphPanel],
      instances: [instance("1")],
      notes: {},
      noteModes: {},
      id: "drawer-note",
    });

    expect(result.created).toBe(true);
    expect(result.panel).toMatchObject({ id: "drawer-note", type: "NOTE", zone: "caseRail" });
    expect(result.panels.some((panel) => panel.id === "drawer-note")).toBe(true);
    expect(result.notes).toEqual({ "drawer-note": EMPTY_NOTE_SPINE });
    expect(result.noteModes).toEqual({ "drawer-note": "edit" });

    const second = ensureNotePanelForDrawer({
      panels: result.panels,
      instances: [instance("1")],
      notes: result.notes,
      noteModes: result.noteModes,
      id: "other",
    });

    expect(second.created).toBe(false);
    expect(second.panel.id).toBe("drawer-note");
    expect(second.panels).toBe(result.panels);
  });
});

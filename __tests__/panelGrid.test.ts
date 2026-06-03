import React from "react";
import { Writable } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PanelGrid, getDockviewPaneTitle, resolveControlsPaneTarget, type PanelGridMode } from "@/components/workbench/PanelGrid";
import { getDockviewStructureSignature } from "@/components/workbench/WorkbenchDockview";
import { addHiddenInstanceConfigsToPanels } from "@/WorkbenchPage";
import type { PanelDef, SimInstance } from "@/types";

// These tests cover layout shell behavior, not BlockNote behavior. Keeping NotePanel
// stubbed avoids cross-file BlockNote schema registration in shared workers.
vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  return {
    NotePanel: () => React.createElement("div", { "data-note-panel-stub": "true" }),
  };
});

const noop = () => {};

function renderPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], instances: SimInstance[] = []) {
  return renderToStaticMarkup(
    createPanelGrid(mode, panels, instances),
  );
}

function createPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], instances: SimInstance[] = []) {
  return React.createElement(PanelGrid, {
    authoringMode: false,
    publishedLesson: null,
    copyShareUrl: noop,
    instances,
    stepsDraft: [],
    setStepsDraft: noop,
    panels,
    dockviewLayoutKey: "test",
    dockviewViewStates: undefined,
    onDockviewViewStateChange: noop,
    mode,
    isMobile: false,
    noteModes: {},
    setNoteModes: noop,
    physicsRefs: { current: new Map() },
    instanceHealth: {},
    activeInstanceId: "",
    setActiveInstanceId: noop,
    updateInstanceParams: noop,
    updateInstanceKnobs: noop,
    updateInstanceVolume: noop,
    updateInstanceColor: noop,
    addInstance: noop,
    removeInstance: noop,
    timeScale: 1,
    setTimeScale: noop,
    isPlaying: true,
    togglePlay: noop,
    addPanel: noop,
    removePanel: noop,
    updatePanelTitle: noop,
    toggleShowLegend: noop,
    updatePanelInstanceColor: noop,
    updatePanelInstanceName: noop,
    updatePanelSignalColor: noop,
    updatePanelSignalName: noop,
    toggleSettings: noop,
    toggleInstanceVisibility: noop,
    updateInstanceSignals: noop,
    toggleGuides: noop,
    updateTimeWindow: noop,
    noteCaseKey: "test",
    notes: {},
    onNoteChange: noop,
    chambers: [],
    signals: [],
    metrics: [],
    controlGroups: [],
  });
}

function renderPanelGridAllReady(mode: PanelGridMode, panels: PanelDef[] = [], instances: SimInstance[] = []) {
  return new Promise<string>((resolve, reject) => {
    let html = "";
    let settled = false;
    let stream: ReturnType<typeof renderToPipeableStream> | undefined;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stream?.abort();
      reject(new Error("Timed out rendering PanelGrid."));
    }, 5000);

    stream = renderToPipeableStream(
      createPanelGrid(mode, panels, instances),
      {
        onAllReady() {
          const writable = new Writable({
            write(chunk, _encoding, callback) {
              html += chunk.toString();
              callback();
            },
            final(callback) {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                resolve(html);
              }
              callback();
            },
          });
          stream?.pipe(writable);
        },
        onError(error) {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          }
        },
      },
    );
  });
}

const normalInstance: SimInstance = {
  id: "normal",
  name: "Normal",
  color: "#a855f7",
  params: {} as SimInstance["params"],
  targetVolume: 5000,
  isVisible: true,
};

const copiedInstance: SimInstance = {
  ...normalInstance,
  id: "copy",
  name: "Heart B",
  color: "#f472b6",
};

const hiddenInstance: SimInstance = {
  ...normalInstance,
  id: "hidden",
  name: "Heart C",
  color: "#22c55e",
};

const pvLoopPanel: PanelDef = {
  id: "pv",
  type: "PVLOOP",
  title: "PV Loop",
  zone: "main",
  w: 6,
  h: 8,
  config: { normal: { visible: true, selectedSignals: ["LV"] } },
  isSettingsOpen: false,
  showGuides: true,
};

describe("PanelGrid Dockview layout", () => {
  it.each(["learner", "author", "sandbox"] as const)("does not render a separate layout edit toolbar in %s mode", (mode) => {
    const html = renderPanelGrid(mode);

    expect(html).not.toContain("Edit layout");
    expect(html).not.toContain("Done editing");
    expect(html).not.toContain("Loading layout editor");
    expect(html).not.toContain("panel-grid-editor");
  });

  it.each(["learner", "author", "sandbox"] as const)("renders the workbench layout for %s mode", async (mode) => {
    const html = await renderPanelGridAllReady(mode);

    expect(html).toContain("No panels");
  });

  it("keeps add controls available in empty editable zones", () => {
    const html = renderPanelGrid("sandbox");

    expect(html).toContain("Add Main pane");
    expect(html).toContain("Add Controls pane");
    expect(html).toContain("Add Outputs pane");
  });

  it("hides add and pane settings chrome for learner mode", () => {
    const html = renderPanelGrid("learner", [pvLoopPanel], [normalInstance]);

    expect(html).not.toContain("Add Main pane");
    expect(html).not.toContain("pane settings");
  });

  it("renders pane-local settings as the pane body for editable Dockview panes", () => {
    const html = renderPanelGrid("sandbox", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).toContain("Back to PV Loop");
    expect(html).toContain("Customizations");
    expect(html).toContain("Title:");
  });

  it("does not render pane-local settings for learner mode even if state is open", () => {
    const html = renderPanelGrid("learner", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).not.toContain("Back to PV Loop");
    expect(html).not.toContain("Customizations");
  });

  it("uses pane titles only for Dockview tab labels", () => {
    expect(getDockviewPaneTitle({
      ...pvLoopPanel,
      title: "Renamed PV",
      config: {
        normal: { visible: true, selectedSignals: ["LV"], customName: "Heart A" },
        copy: { visible: true, selectedSignals: ["LV"], customName: "Heart B" },
      },
    })).toBe("Renamed PV");
  });

  it("does not treat pane title edits as Dockview structural layout changes", () => {
    expect(getDockviewStructureSignature([{ ...pvLoopPanel, title: "PV Loop" }]))
      .toBe(getDockviewStructureSignature([{ ...pvLoopPanel, title: "Renamed PV" }]));
  });

  it("adds new instances to existing pane configs as hidden by default", () => {
    const panels = addHiddenInstanceConfigsToPanels([
      pvLoopPanel,
      {
        id: "controls",
        type: "CONTROLS",
        title: "Controls",
        zone: "sideRail",
        w: 4,
        h: 8,
        config: { normal: { visible: true, selectedSignals: ["clinical"] } },
        isSettingsOpen: false,
      },
    ], ["copy"]);

    expect(panels[0].config.normal.visible).toBe(true);
    expect(panels[0].config.copy).toEqual({ visible: false, selectedSignals: ["LV"] });
    expect(panels[1].config.normal.visible).toBe(true);
    expect(panels[1].config.copy).toEqual({ visible: false, selectedSignals: ["clinical", "Global", "ventricles", "fluids"] });
  });

  it("keeps the current controls target when a hidden scenario is added", () => {
    const config = {
      normal: { visible: true, selectedSignals: ["clinical"] },
      copy: { visible: true, selectedSignals: ["clinical"] },
      hidden: { visible: false, selectedSignals: ["clinical"] },
    };

    expect(resolveControlsPaneTarget([normalInstance, copiedInstance, hiddenInstance], config, "copy")?.id).toBe("copy");
  });

  it("does not target globally hidden instances in Dockview controls panes", () => {
    const config = {
      normal: { visible: true, selectedSignals: ["clinical"] },
      hidden: { visible: true, selectedSignals: ["clinical"] },
    };

    expect(resolveControlsPaneTarget([
      normalInstance,
      { ...hiddenInstance, isVisible: false },
    ], config, "hidden")?.id).toBe("normal");
  });
});

import React from "react";
import { Writable } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ChartLegend, shouldEnableLegendInteractions } from "@/components/Charts";
import { PanelGrid, getActiveSettingsSectionId, getDockviewPaneTitle, openPanelSettingsIfClosed, type PanelGridMode } from "@/components/workbench/PanelGrid";
import { getDockviewStructureSignature, getDockviewTabMenuPosition } from "@/components/workbench/WorkbenchDockview";
import { addHiddenInstanceConfigsToPanels } from "@/WorkbenchPage";
import { DEFAULT_PARAMS } from "@/constants";
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

function renderPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], instances: SimInstance[] = [], controlGroups: string[] = []) {
  return renderToStaticMarkup(
    createPanelGrid(mode, panels, instances, controlGroups),
  );
}

function createPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], instances: SimInstance[] = [], controlGroups: string[] = []) {
  return React.createElement(PanelGrid, {
    authoringMode: false,
    publishedLesson: null,
    copyShareUrl: noop,
    instances,
    stepsDraft: [],
    setStepsDraft: noop,
    panels,
    layoutState: {
      controlsSide: "left",
      controlsWidth: 320,
      caseRailWidth: 260,
      outputHeight: 190,
    },
    onLayoutStateChange: noop,
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
    updateInstanceName: noop,
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
    updatePanelControllerItems: noop,
    updatePanelLegendPosition: noop,
    noteCaseKey: "test",
    notes: {},
    onNoteChange: noop,
    chambers: [],
    signals: [],
    metrics: [],
    controlGroups,
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

const controlsPanel: PanelDef = {
  id: "controls",
  type: "CONTROLS",
  title: "Controls",
  zone: "sideRail",
  w: 4,
  h: 8,
  config: { normal: { visible: true, selectedSignals: ["clinical"] } },
  isSettingsOpen: true,
  view: {
    kind: "control",
    groups: ["clinical"],
    controllerItems: [{ paramKey: "contractility", kind: "slider", label: "LV Focus" }],
  },
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

  it("enables graph legend settings only for configurable studio panes", () => {
    expect(shouldEnableLegendInteractions({ canConfigure: true })).toBe(true);
    expect(shouldEnableLegendInteractions({ canConfigure: true, presentationMode: "studio" })).toBe(true);
    expect(shouldEnableLegendInteractions({ canConfigure: false })).toBe(false);
    expect(shouldEnableLegendInteractions({ canConfigure: true, presentationMode: "reading" })).toBe(false);
  });

  it("renders an inert graph legend without settings controls by default", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
    }));

    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain("Open pane settings");
  });

  it("renders graph legend settings gear when interactive", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: true,
      onOpenSettings: noop,
    }));

    expect(html).toContain("pointer-events-auto");
    expect(html).toContain("aria-label=\"Open pane settings\"");
    expect(html).toContain("title=\"Open pane settings\"");
  });

  it("renders a drag grip for configurable legends with a position callback", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: true,
      onOpenSettings: noop,
      onLegendPositionChange: noop,
    }));

    expect(html).toContain("aria-label=\"Drag legend\"");
    expect(html).toContain("cursor-grab");
  });

  it("renders stored legend positions with inline placement and reset control", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: true,
      onOpenSettings: noop,
      legendPosition: { xPct: 0.25, yPct: 0.4 },
      onLegendPositionChange: noop,
    }));

    expect(html).toContain("style=\"left:0px;top:0px\"");
    expect(html).not.toContain("top-2 right-2");
    expect(html).toContain("aria-label=\"Reset legend position\"");
  });

  it("keeps inert legends without drag or reset controls", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: false,
      legendPosition: { xPct: 0.25, yPct: 0.4 },
      onLegendPositionChange: noop,
    }));

    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain("aria-label=\"Drag legend\"");
    expect(html).not.toContain("aria-label=\"Reset legend position\"");
  });

  it("opens pane settings idempotently from chart legend actions", () => {
    const toggleSettings = vi.fn();

    openPanelSettingsIfClosed({ id: "pv", isSettingsOpen: false }, "pv", toggleSettings);
    openPanelSettingsIfClosed({ id: "pv", isSettingsOpen: true }, "pv", toggleSettings);
    openPanelSettingsIfClosed({ id: "pv", isSettingsOpen: false }, "other", toggleSettings);

    expect(toggleSettings).toHaveBeenCalledTimes(1);
    expect(toggleSettings).toHaveBeenCalledWith("pv");
  });

  it("keeps Dockview tab menus rendered and hover-enabled for inactive tabs", () => {
    const css = readFileSync(resolve(process.cwd(), "index.css"), "utf8");
    const dockviewSource = readFileSync(resolve(process.cwd(), "components/workbench/WorkbenchDockview.tsx"), "utf8");

    expect(dockviewSource).toContain("workbench-dock-tab-menu-button inline-flex h-5 w-5");
    expect(dockviewSource).toContain("event.stopPropagation();");
    expect(css).toContain(".workbench-dock-tab-menu-button");
    expect(css).toContain(".workbench-dock-tab:hover .workbench-dock-tab-menu-button");
    expect(css).toContain("@media (hover: none)");
    expect(css).toContain(".dv-tab.dv-active-tab .workbench-dock-tab-menu-button");
  });

  it("renders pane-local settings as the pane body for editable Dockview panes", () => {
    const html = renderPanelGrid("sandbox", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).toContain("Back to PV Loop");
    expect(html).toContain("Pane title");
    expect(html).toContain("Signals");
    expect(html).toContain("Instances");
    expect(html).toContain("Display");
    expect(html).toContain("@min-[760px]:grid");
    expect(html).toContain("sticky top-0");
    expect(html).toContain("overflow-hidden px-1 pb-2");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Instance keys");
  });

  it("does not render pane-local settings for learner mode even if state is open", () => {
    const html = renderPanelGrid("learner", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).not.toContain("Back to PV Loop");
    expect(html).not.toContain("Customizations");
  });

  it("shows custom controls settings for authorable controller panes", () => {
    const html = renderPanelGrid("sandbox", [controlsPanel], [{ ...normalInstance, params: { ...DEFAULT_PARAMS } }]);

    expect(html).toContain("Custom controls");
    expect(html).toContain("Custom controls replace the default Clinical Knobs");
    expect(html).toContain("LV Focus");
    expect(html).toContain("Cardiac Function");
    expect(html).toContain("Preview");
    expect(html).toContain("type=\"range\"");
  });

  it("hides custom controls settings in learner mode", () => {
    const html = renderPanelGrid("learner", [controlsPanel], [{ ...normalInstance, params: { ...DEFAULT_PARAMS } }]);

    expect(html).not.toContain("Back to Controls");
    expect(html).not.toContain("Controller pane");
    expect(html).not.toContain("Pane title");
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

  it("renders controller settings as pane-local target and item bindings", () => {
    const controlsPanel: PanelDef = {
      id: "controls",
      type: "CONTROLS",
      title: "Controls",
      zone: "sideRail",
      w: 4,
      h: 8,
      config: {
        normal: { visible: true, selectedSignals: ["clinical", "Global"] },
        copy: { visible: false, selectedSignals: ["clinical", "Global"] },
      },
      isSettingsOpen: true,
    };

    const html = renderPanelGrid("sandbox", [controlsPanel], [normalInstance, copiedInstance]);

    expect(html).toContain("Back to Controls");
    expect(html).toContain("Targets");
    expect(html).toContain("Sections");
    expect(html).toContain("Display");
    expect(html).toContain("Clinical knobs");
    expect(html).toContain("Pane title");
    expect(html).toContain("@min-[760px]:grid");
    expect(html).toContain("sticky top-0");
    expect(html).toContain("overflow-hidden px-1 pb-2");
    // Unnecessary count-meta badges removed from controller settings.
    expect(html).not.toContain("Controller scope");
    expect(html).not.toContain("Target shortcut");
    expect(html).not.toContain("item groups");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Target keys");
    expect(html).not.toContain("Target enabled");
    expect(html).not.toContain("Target hidden");
  });

  it("keeps advanced controller groups out of pane-local settings", () => {
    const controlsPanel: PanelDef = {
      id: "controls",
      type: "CONTROLS",
      title: "Controls",
      zone: "sideRail",
      w: 4,
      h: 8,
      config: {
        normal: { visible: true, selectedSignals: ["clinical", "advanced"] },
      },
      isSettingsOpen: true,
    };

    const html = renderPanelGrid("sandbox", [controlsPanel], [normalInstance], ["clinical", "advanced", "ventricles"]);

    expect(html).toContain("Clinical knobs");
    expect(html).toContain("Ventricular mechanics");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Advanced engine");
  });

  it("renders controller target shortcuts only for pane-enabled targets", () => {
    const controlsPanel: PanelDef = {
      id: "controls",
      type: "CONTROLS",
      title: "Controls",
      zone: "sideRail",
      w: 4,
      h: 8,
      config: {
        normal: { visible: true, selectedSignals: ["clinical"] },
        copy: { visible: true, selectedSignals: ["clinical"] },
        hidden: { visible: false, selectedSignals: ["clinical"] },
      },
      isSettingsOpen: false,
    };

    const html = renderPanelGrid("sandbox", [controlsPanel], [
      { ...normalInstance, params: { ...DEFAULT_PARAMS } },
      { ...copiedInstance, params: { ...DEFAULT_PARAMS } },
      { ...hiddenInstance, params: { ...DEFAULT_PARAMS } },
    ]);

    expect(html).toContain("Heart B");
    expect(html).not.toContain("Heart C");
    expect(html).not.toContain("Pause simulation");
    expect(html).not.toContain("0.5x");
  });
});

describe("PanelGrid settings scroll spy", () => {
  it("selects the section crossing the scroll marker", () => {
    expect(getActiveSettingsSectionId(
      ["targets", "items", "display"],
      {
        targets: { top: -260, bottom: 8 },
        items: { top: 8, bottom: 360 },
        display: { top: 360, bottom: 620 },
      },
      48,
    )).toBe("items");
  });

  it("keeps the latest preceding section active between sections", () => {
    expect(getActiveSettingsSectionId(
      ["signals", "instances", "display"],
      {
        signals: { top: -320, bottom: -20 },
        instances: { top: 92, bottom: 360 },
        display: { top: 360, bottom: 620 },
      },
      48,
    )).toBe("signals");
  });
});

describe("WorkbenchDockview tab menu positioning", () => {
  it("anchors keyboard-triggered tab context menus to the tab instead of the viewport corner", () => {
    expect(getDockviewTabMenuPosition({
      point: { x: 0, y: 0 },
      anchorRect: { left: 320, bottom: 91 },
      viewportWidth: 1200,
      viewportHeight: 800,
    })).toEqual({ x: 320, y: 95 });
  });

  it("keeps pointer-triggered tab context menus inside the viewport", () => {
    expect(getDockviewTabMenuPosition({
      point: { x: 1198, y: 790 },
      viewportWidth: 1200,
      viewportHeight: 800,
    })).toEqual({ x: 1048, y: 672 });
  });
});

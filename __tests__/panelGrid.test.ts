import React from "react";
import { Writable } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { ChartLegend, shouldEnableLegendInteractions } from "@/components/Charts";
import { PanelGrid, getActiveSettingsSectionId, getDockviewPaneTitle, openPanelSettingsIfClosed, type PanelGridMode, type WorkbenchLayoutState } from "@/components/workbench/PanelGrid";
import { ScenarioPane } from "@/components/workbench/ScenarioPane";
import { getDockviewStructureSignature, getDockviewTabMenuPosition, shouldReapplyDockviewLayout } from "@/components/workbench/WorkbenchDockview";
import { addHiddenInstanceConfigsToPanels } from "@/WorkbenchPage";
import { DEFAULT_PARAMS } from "@/constants";
import type { SteadyUpdateStatusMap } from "@/engine/previewController";
import type { PanelDef, SimInstance } from "@/types";

// These tests cover layout shell behavior, not BlockNote behavior. Keeping NotePanel
// stubbed avoids cross-file BlockNote schema registration in shared workers.
vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  return {
    NotePanel: () => React.createElement("div", { "data-note-panel-stub": "true" }),
  };
});

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

const noop = () => {};

function rootClassName(html: string): string {
  return html.match(/^<div class="([^"]*)"/)?.[1] ?? "";
}

function rootPaddingClasses(html: string): string[] {
  return rootClassName(html)
    .split(" ")
    .filter((className) => /^(p|px|py|pl|pr|pt|pb)-/.test(className));
}

function renderPanelGrid(
  mode: PanelGridMode,
  panels: PanelDef[] = [],
  instances: SimInstance[] = [],
  controlGroups: string[] = [],
  steadyUpdateStatuses: SteadyUpdateStatusMap = {},
  isMobile = false,
  layoutOverrides: Partial<WorkbenchLayoutState> = {},
) {
  return renderToStaticMarkup(
    createPanelGrid(mode, panels, instances, controlGroups, steadyUpdateStatuses, isMobile, layoutOverrides),
  );
}

function createPanelGrid(
  mode: PanelGridMode,
  panels: PanelDef[] = [],
  instances: SimInstance[] = [],
  controlGroups: string[] = [],
  steadyUpdateStatuses: SteadyUpdateStatusMap = {},
  isMobile = false,
  layoutOverrides: Partial<WorkbenchLayoutState> = {},
) {
  return React.createElement(PanelGrid, {
    authoringMode: false,
    publishedLesson: null,
    copyShareUrl: noop,
    instances,
    stepsDraft: [],
    setStepsDraft: noop,
    panels,
    layoutState: {
      controlsSide: "right",
      controlsWidth: 320,
      caseRailWidth: 400,
      outputHeight: 190,
      noteOpen: false,
      metricsOpen: false,
      rightRailVisible: true,
      rightRailView: "scenarios",
      scenarioListCollapsed: false,
      scenarioListMaxRatio: 0.4,
      metricsSpan: "main",
      ...layoutOverrides,
    },
    onLayoutStateChange: noop,
    dockviewLayoutKey: "test",
    dockviewViewStates: undefined,
    onDockviewViewStateChange: noop,
    createControllerView: (title: string, items = []) => ({
      id: "controller-test",
      title,
      kind: "controller" as const,
      items,
      binding: { slot: "active" as const },
    }),
    createMetricsView: (title: string, metrics = []) => ({
      id: "metrics-test",
      title,
      kind: "metrics" as const,
      metrics,
      membership: {},
    }),
    updateAuthoredView: noop,
    renameAuthoredView: noop,
    duplicateAuthoredView: () => undefined,
    deleteAuthoredView: noop,
    mode,
    isMobile,
    noteModes: {},
    setNoteModes: noop,
    physicsRefs: { current: new Map() },
    instanceHealth: {},
    steadyUpdateStatuses,
    activeInstanceId: instances[0]?.id ?? "",
    setActiveInstanceId: noop,
    updateInstanceParams: noop,
    updateInstanceKnobs: noop,
    updateInstanceVolume: noop,
    updateInstanceColor: noop,
    updateInstanceName: noop,
    toggleScenarioGlobalVisibility: noop,
    resetInstanceKnobs: noop,
    addInstance: noop,
    removeInstance: noop,
    timeScale: 1,
    setTimeScale: noop,
    isPlaying: true,
    togglePlay: noop,
    addPanel: noop,
    duplicatePanel: () => undefined,
    removePanel: noop,
    updatePanelTitle: noop,
    toggleShowLegend: noop,
    updatePanelInstanceColor: noop,
    updatePanelInstanceName: noop,
    updatePanelSignalColor: noop,
    updatePanelSignalName: noop,
    toggleSettings: noop,
    togglePaneMembership: noop,
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
    metrics: ["ABP"],
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
  params: { ...DEFAULT_PARAMS },
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

const scenariosPanel: PanelDef = {
  id: "scenarios",
  type: "SCENARIOS",
  title: "Scenarios",
  zone: "sideRail",
  w: 4,
  h: 6,
  config: { normal: { visible: true, selectedSignals: [] } },
  isSettingsOpen: false,
};

const notePanel: PanelDef = {
  id: "note",
  type: "NOTE",
  title: "Note",
  zone: "caseRail",
  w: 6,
  h: 10,
  config: { normal: { visible: false, selectedSignals: [] } },
  isSettingsOpen: false,
};

const metricsPanel: PanelDef = {
  id: "metrics",
  type: "METRICS",
  title: "Metrics",
  zone: "bottomPanel",
  w: 4,
  h: 4,
  config: { normal: { visible: true, selectedSignals: ["ABP"] } },
  isSettingsOpen: false,
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

  it("keeps add controls available only in the main graph board", () => {
    const html = renderPanelGrid("sandbox");

    expect(html).toContain("Add Main pane");
    expect(html).not.toContain("Add Controls pane");
    expect(html).not.toContain("Add Outputs pane");
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
    expect(html).not.toContain("Drag to move");
    expect(html).not.toContain("cursor-grab");
    expect(html).not.toContain("hover:ring");
    expect(html).not.toContain("<button");
  });

  it("renders zero-footprint hover affordances when interactive", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: true,
      onOpenSettings: noop,
      onLegendPositionChange: noop,
    }));

    expect(html).toContain("pointer-events-auto");
    expect(html).toContain("cursor-grab");
    expect(html).toContain("hover:ring-1");
    expect(html).toContain("hover:ring-sky-400/40");
    expect(html).toContain("title=\"Drag to move · double-click to edit\"");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("aria-label=\"Open pane settings\"");
    expect(html).not.toContain("aria-label=\"Drag legend\"");
  });

  it("keeps interactive legend rest padding identical to inert legends", () => {
    const inert = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
    }));
    const interactive = renderToStaticMarkup(React.createElement(ChartLegend, {
      instances: [normalInstance],
      config: pvLoopPanel.config,
      showLegend: true,
      panelId: "pv",
      legendInteractive: true,
      onOpenSettings: noop,
      onLegendPositionChange: noop,
    }));

    expect(rootPaddingClasses(inert)).toEqual(["p-1.5"]);
    expect(rootPaddingClasses(interactive)).toEqual(["p-1.5"]);
    expect(interactive).not.toContain("px-5");
    expect(interactive).not.toContain("pl-5");
    expect(interactive).not.toContain("pr-5");
  });

  it("renders stored legend positions with inline placement", () => {
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

    expect(html).toContain("left:0px;top:0px");
    expect(html).toContain("touch-action:none");
    expect(html).not.toContain("top-2 right-2");
    expect(html).not.toContain("aria-label=\"Reset legend position\"");
  });

  it("renders steady recompute indicators beside scenario labels", () => {
    const html = renderToStaticMarkup(React.createElement(ScenarioPane, {
      instances: [normalInstance, copiedInstance, hiddenInstance],
      addInstance: noop,
      removeInstance: noop,
      updateInstanceName: noop,
      updateInstanceColor: noop,
      steadyUpdateStatuses: {
        normal: "computing",
        copy: "updated",
        hidden: "failed",
      },
    }));

    expect(html).toContain("Recomputing steady state");
    expect(html).toContain("Steady state updated");
    expect(html).toContain("Steady update failed");
    expect(html).toContain("Heart B");
  });

  it("passes steady recompute statuses from PanelGrid into the scenario pane", () => {
    const html = renderPanelGrid(
      "sandbox",
      [scenariosPanel],
      [normalInstance],
      [],
      { normal: "computing" },
    );

    expect(html).toContain("Recomputing steady state");
    expect(html).toContain("Normal");
  });

  it("keeps reading and learner legends inert without drag affordances", () => {
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
    expect(html).not.toContain("cursor-grab");
    expect(html).not.toContain("touch-action:none");
    expect(html).not.toContain("Drag to move");
    expect(html).not.toContain("hover:ring");
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
    expect(dockviewSource).toContain("workbench-dock-tab-close-button inline-flex h-5 w-5");
    expect(dockviewSource).toContain("workbench.panelGrid.closePanelAria");
    expect(dockviewSource).toContain("event.stopPropagation();");
    expect(css).toContain(".workbench-dock-tab-menu-button");
    expect(css).toContain(".workbench-dock-tab-close-button");
    expect(css).toContain(".workbench-dock-tab:hover .workbench-dock-tab-menu-button");
    expect(css).toContain("@media (hover: none)");
    expect(css).toContain(".dv-tab.dv-active-tab .workbench-dock-tab-menu-button");
  });

  it("keeps the add-pane action next to tabs and the split action at the far header edge", () => {
    const css = readFileSync(resolve(process.cwd(), "index.css"), "utf8");
    const dockviewSource = readFileSync(resolve(process.cwd(), "components/workbench/WorkbenchDockview.tsx"), "utf8");

    expect(dockviewSource).toContain("leftHeaderActionsComponent={WorkbenchDockHeaderLeftActions}");
    expect(dockviewSource).toContain("rightHeaderActionsComponent={WorkbenchDockHeaderRightActions}");
    expect(dockviewSource).toContain("<Columns2 className=\"h-3.5 w-3.5\"");
    expect(dockviewSource).toContain("<Rows2 className=\"h-3.5 w-3.5\"");
    expect(dockviewSource).not.toContain("Split } from 'lucide-react'");
    expect(css).toContain("margin-left: auto;");
    expect(css).toContain("flex: 1 1 auto;");
  });

  it("lets Dockview tabs scroll horizontally while header actions stay outside the scroll area", () => {
    const css = readFileSync(resolve(process.cwd(), "index.css"), "utf8");

    expect(css).toContain(".workbench-dockview .dv-scrollable");
    expect(css).toContain("overflow-x: auto;");
    expect(css).toContain(".workbench-dockview .dv-scrollable > .dv-tabs-container");
    expect(css).toContain("overflow: visible;");
  });

  it("renders pane settings as a modal for editable Dockview panes", () => {
    const html = renderPanelGrid("sandbox", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).toContain("role=\"dialog\"");
    expect(html).toContain("aria-modal=\"true\"");
    expect(html).toContain("tabindex=\"-1\"");
    expect(html).toContain("Pane settings");
    expect(html).toContain("PV Loop · PV loop pane");
    expect(html).toContain("Done");
    expect(html).toContain("Pane title");
    expect(html).toContain("Signals");
    expect(html).toContain("Scenarios");
    expect(html).toContain("Display");
    expect(html).toContain("@min-[760px]:grid");
    expect(html).toContain("sticky top-0");
    expect(html).toContain("overflow-hidden p-3");
    expect(html).not.toContain("Back to PV Loop");
    expect(html).not.toContain("w-[min(42rem,calc(100vw-2rem))]");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Instance keys");
  });

  it("keeps pane settings modal focus and scroll behavior explicit", () => {
    const panelGridSource = readFileSync(resolve(process.cwd(), "components/workbench/PanelGrid.tsx"), "utf8");

    expect(panelGridSource).toContain("paneSettingsFocusRestoreTarget");
    expect(panelGridSource).toContain("dialogRef.current?.focus({ preventScroll: true })");
    expect(panelGridSource).toContain("document.body.style.overflow = 'hidden'");
  });

  it("does not render pane-local settings for learner mode even if state is open", () => {
    const html = renderPanelGrid("learner", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance]);

    expect(html).not.toContain("Back to PV Loop");
    expect(html).not.toContain("Pane settings");
    expect(html).not.toContain("Customizations");
  });

  it("renders the fixed inspector from built-in clinical controls", () => {
    const html = renderPanelGrid("sandbox", [controlsPanel], [{ ...normalInstance, params: { ...DEFAULT_PARAMS } }], [], {}, false, {
      rightRailView: "inspector",
    });

    expect(html).toContain("Cardiac Function");
    expect(html).toContain("type=\"range\"");
    expect(html).not.toContain("Custom controls replace the default Clinical Knobs");
    expect(html).not.toContain("LV Focus");
  });

  it("hides custom controls settings in learner mode", () => {
    const html = renderPanelGrid("learner", [controlsPanel], [{ ...normalInstance, params: { ...DEFAULT_PARAMS } }]);

    expect(html).not.toContain("Back to Controls");
    expect(html).not.toContain("Pane settings");
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

  it("does not render pane-local controller settings for the fixed inspector", () => {
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

    const html = renderPanelGrid("sandbox", [controlsPanel], [
      { ...normalInstance, params: { ...DEFAULT_PARAMS } },
      { ...copiedInstance, params: { ...DEFAULT_PARAMS } },
    ]);

    expect(html).not.toContain("role=\"dialog\"");
    expect(html).not.toContain("Pane settings");
    expect(html).not.toContain("Controls · Controller pane");
    expect(html).toContain("Scenarios");
    expect(html).toContain("Clinical parameters (standard)");
    expect(html).not.toContain("Back to Controls");
    // Unnecessary count-meta badges removed from controller settings.
    expect(html).not.toContain("Controller scope");
    expect(html).not.toContain("Target shortcut");
    expect(html).not.toContain("item groups");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Target keys");
    expect(html).not.toContain("Target enabled");
    expect(html).not.toContain("Target hidden");
  });

  it("uses the same settings modal for mobile active settings state", () => {
    const html = renderPanelGrid("sandbox", [{ ...pvLoopPanel, isSettingsOpen: true }], [normalInstance], [], {}, true);

    expect(html).toContain("role=\"dialog\"");
    expect(html).toContain("Pane settings");
    expect(html).toContain("PV Loop · PV loop pane");
    expect(html).toContain("h-dvh");
    expect(html).not.toContain("Back to PV Loop");
    expect(html).not.toContain("w-[min(42rem,calc(100vw-2rem))]");
  });

  it("keeps the fixed inspector on built-in clinical controls even when legacy controller panes select advanced groups", () => {
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

    const html = renderPanelGrid("sandbox", [controlsPanel], [{ ...normalInstance, params: { ...DEFAULT_PARAMS } }], ["clinical", "advanced", "ventricles"], {}, false, {
      rightRailView: "inspector",
    });

    expect(html).toContain("Cardiac Function");
    expect(html).not.toContain("Clinical Knobs");
    expect(html).not.toContain("Advanced");
    expect(html).not.toContain("Advanced engine");
  });

  it("shows hidden scenarios above the fixed inspector while the inspector targets the active scenario only", () => {
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

    const scenarioHtml = renderPanelGrid("sandbox", [controlsPanel], [
      { ...normalInstance, params: { ...DEFAULT_PARAMS } },
      { ...copiedInstance, params: { ...DEFAULT_PARAMS } },
      { ...hiddenInstance, params: { ...DEFAULT_PARAMS } },
    ]);

    expect(scenarioHtml).toContain("Heart B");
    expect(scenarioHtml).toContain("Heart C");

    const inspectorHtml = renderPanelGrid("sandbox", [controlsPanel], [
      { ...normalInstance, params: { ...DEFAULT_PARAMS } },
      { ...copiedInstance, params: { ...DEFAULT_PARAMS } },
      { ...hiddenInstance, params: { ...DEFAULT_PARAMS } },
    ], [], {}, false, { rightRailView: "inspector" });

    expect(inspectorHtml).toContain("Scenarios (3)");
    expect(inspectorHtml).toContain("Heart B");
    expect(inspectorHtml).toContain("Heart C");
    expect(inspectorHtml).toContain("Editing:");
    expect(inspectorHtml).not.toContain("Pause simulation");
    expect(inspectorHtml).not.toContain("0.5x");
  });

  it("renders the scenario-list resize sash whenever the list is expanded", () => {
    const expandedHtml = renderPanelGrid("sandbox", [], [normalInstance, copiedInstance]);
    const collapsedHtml = renderPanelGrid("sandbox", [], [normalInstance, copiedInstance], [], {}, false, {
      scenarioListCollapsed: true,
    });

    expect(expandedHtml).toContain("role=\"separator\"");
    expect(expandedHtml).toContain("aria-label=\"Resize scenario list\"");
    expect(expandedHtml).toContain("cursor-row-resize");
    expect(collapsedHtml).not.toContain("aria-label=\"Resize scenario list\"");
  });

  it("renders keyboard-addressable sashes for note, right rail, metrics, and scenario tiers", () => {
    const html = renderPanelGrid("sandbox", [notePanel, pvLoopPanel, metricsPanel], [normalInstance, copiedInstance], [], {}, false, {
      noteOpen: true,
      metricsOpen: true,
      rightRailVisible: true,
      metricsSpan: "main",
    });

    expect(html).toContain("aria-label=\"Resize note drawer\"");
    expect(html).toContain("aria-label=\"Resize right rail\"");
    expect(html).toContain("aria-label=\"Resize metrics host\"");
    expect(html).toContain("aria-label=\"Resize scenario list\"");
    expect(html.match(/role=\"separator\"/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(html).toContain("tabindex=\"0\"");
    expect(html).toContain("aria-valuenow=\"400\"");
  });

  it("keeps scenario deletion available only when a second scenario exists", () => {
    const scenarioPaneSource = readFileSync(resolve(process.cwd(), "components/workbench/ScenarioPane.tsx"), "utf8");

    expect(scenarioPaneSource).toContain("removeInstance(instance.id)");
    expect(scenarioPaneSource).toContain("disabled={instances.length <= 1}");
    expect(scenarioPaneSource).toContain("{t('common.delete')}");
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

describe("WorkbenchDockview layout reapply guard", () => {
  it("skips stale serialized-layout replay after an imperative split has already added the pane", () => {
    expect(shouldReapplyDockviewLayout({
      livePanelIds: ["pv", "wave"],
      statePanelIds: ["wave", "pv"],
      layoutIdentityChanged: false,
      imperativePanelChangePending: true,
      forceGraphBoardLayout: false,
    })).toBe(false);
  });

  it("lets an imperative split guard win over a stale forced graph-board layout prop", () => {
    expect(shouldReapplyDockviewLayout({
      livePanelIds: ["pv", "wave"],
      statePanelIds: ["wave", "pv"],
      layoutIdentityChanged: false,
      imperativePanelChangePending: true,
      forceGraphBoardLayout: true,
    })).toBe(false);
  });

  it("reapplies when panes diverge, a case or locale key changes, or an explicit layout command arrives", () => {
    expect(shouldReapplyDockviewLayout({
      livePanelIds: ["pv"],
      statePanelIds: ["pv", "wave"],
      layoutIdentityChanged: false,
      imperativePanelChangePending: true,
      forceGraphBoardLayout: false,
    })).toBe(true);
    expect(shouldReapplyDockviewLayout({
      livePanelIds: ["pv", "wave"],
      statePanelIds: ["pv", "wave"],
      layoutIdentityChanged: true,
      imperativePanelChangePending: true,
      forceGraphBoardLayout: false,
    })).toBe(true);
    expect(shouldReapplyDockviewLayout({
      livePanelIds: ["pv", "wave"],
      statePanelIds: ["pv", "wave"],
      layoutIdentityChanged: false,
      imperativePanelChangePending: false,
      forceGraphBoardLayout: true,
    })).toBe(true);
  });
});

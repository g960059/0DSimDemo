import { describe, expect, it } from "vitest";
import {
  builtInMetricsConfig,
  deriveBuiltInMetricsTabs,
  effectiveGlobalConfig,
  graphPanelsOnly,
  mainDockviewViewStatesOnly,
  metricsHostTabs,
} from "@/features/workbench/p1aStructuralHosts";
import type { DockviewViewState, PanelDef, SimInstance, WorkbenchWorkspace } from "@/types";
import type { MetricsViewSpec } from "@/features/workbench/viewSpec";

const wave: PanelDef = { id: "wave", type: "WAVEFORM", title: "Wave", zone: "main", w: 4, h: 4, config: {}, isSettingsOpen: false };
const pv: PanelDef = { id: "pv", type: "PVLOOP", title: "PV", zone: "main", w: 4, h: 4, config: {}, isSettingsOpen: false };
const controls: PanelDef = { id: "controls", type: "CONTROLS", title: "Controls", zone: "sideRail", w: 4, h: 4, config: {}, isSettingsOpen: false };
const metrics: PanelDef = { id: "metrics", type: "METRICS", title: "Custom metrics", zone: "bottomPanel", w: 4, h: 4, config: {}, isSettingsOpen: false };
const metricsView: MetricsViewSpec = {
  id: "metrics-view",
  title: "Custom metrics",
  kind: "metrics",
  metrics: ["ABP"],
  membership: { visible: ["ABP"] },
};

const visibleInstance: SimInstance = {
  id: "visible",
  name: "Visible",
  color: "#22c55e",
  params: {} as SimInstance["params"],
  targetVolume: 5000,
  isVisible: true,
};

const hiddenInstance: SimInstance = {
  ...visibleInstance,
  id: "hidden",
  name: "Hidden",
  isVisible: false,
};

describe("P1a structural host helpers", () => {
  it("limits Dockview-hosted panes to graph panel types", () => {
    expect(graphPanelsOnly([controls, wave, metrics, pv]).map((panel) => panel.id)).toEqual(["wave", "pv"]);
  });

  it("derives fixed built-in metrics categories from available metrics", () => {
    expect(deriveBuiltInMetricsTabs(["ABP", "CO", "LVEF", "COR", "FFR_LAD"]).map((tab) => ({
      id: tab.id,
      metrics: tab.metrics,
    }))).toEqual([
      { id: "pressure", metrics: ["ABP"] },
      { id: "flowVolume", metrics: ["CO"] },
      { id: "function", metrics: ["LVEF"] },
      { id: "coronary", metrics: ["COR", "FFR_LAD"] },
    ]);
  });

  it("adds authored metrics views after built-in metrics categories", () => {
    expect(metricsHostTabs(["ABP"], [metricsView]).map((tab) => tab.kind === "authored" ? tab.title : tab.id))
      .toEqual(["pressure", "Custom metrics"]);
  });

  it("intersects panel membership with global scenario visibility at render time", () => {
    const config = effectiveGlobalConfig({
      visible: { visible: true, selectedSignals: ["ABP"] },
      hidden: { visible: true, selectedSignals: ["ABP"] },
    }, [visibleInstance, hiddenInstance]);

    expect(config.visible.visible).toBe(true);
    expect(config.hidden.visible).toBe(false);
    expect(config.hidden.selectedSignals).toEqual(["ABP"]);
  });

  it("builds built-in metrics config from global visibility", () => {
    expect(builtInMetricsConfig([visibleInstance, hiddenInstance], ["ABP", "CO"])).toEqual({
      visible: { visible: true, selectedSignals: ["ABP", "CO"] },
      hidden: { visible: false, selectedSignals: ["ABP", "CO"] },
    });
  });

  it("keeps only main Dockview viewState when saving P1a workspace state", () => {
    const main: DockviewViewState = { library: "dockview", schemaVersion: 1, zone: "main", state: { panels: {}, grid: {} } };
    const side: DockviewViewState = { library: "dockview", schemaVersion: 1, zone: "sideRail", state: { panels: {}, grid: {} } };
    const workspace: WorkbenchWorkspace = {
      schemaVersion: 1,
      regions: {},
      viewStates: { main, sideRail: side },
    };

    expect(mainDockviewViewStatesOnly(workspace).viewStates).toEqual({ main });
  });

  it("converts legacy singular Dockview viewState into the main cache", () => {
    const main: DockviewViewState = { library: "dockview", schemaVersion: 1, zone: "main", state: { panels: {}, grid: {} } };
    const workspace: WorkbenchWorkspace = {
      schemaVersion: 1,
      regions: {},
      viewState: main,
    };

    expect(mainDockviewViewStatesOnly(workspace)).toEqual({
      schemaVersion: 1,
      regions: {},
      viewStates: { main },
    });
  });
});

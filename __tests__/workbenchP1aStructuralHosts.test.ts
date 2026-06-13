import { describe, expect, it } from "vitest";
import {
  deriveBuiltInMetricsTabs,
  effectiveGlobalConfig,
  graphPanelsOnly,
  metricsHostTabs,
} from "@/features/workbench/p1aStructuralHosts";
import type { PanelDef, SimInstance } from "@/types";
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

  it("exposes authored metrics views only for the live metrics host", () => {
    expect(metricsHostTabs(["ABP"], [metricsView]).map((tab) => tab.title))
      .toEqual(["Custom metrics"]);
    expect(metricsHostTabs(["ABP"], [])).toEqual([]);
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
});

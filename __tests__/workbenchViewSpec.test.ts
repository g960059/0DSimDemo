import { describe, expect, it } from "vitest";
import {
  effectiveScenarioIds,
  effectiveVisibility,
  migratePanelsToViewSpecs,
  normalizeGraphBoardLayout,
  remapGraphBoardLayoutViewIds,
  remapViewSpecIds,
  validateGraphBoardLayout,
  type GraphBoardLayout,
  type ViewSpec,
} from "@/features/workbench/viewSpec";
import type { PanelDef } from "@/types";

const panels: PanelDef[] = [
  {
    id: "pv",
    type: "PVLOOP",
    title: "PV Loop",
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["LV", "LV", "RV"] },
      ami: { visible: false, selectedSignals: ["LV"] },
    },
    isSettingsOpen: false,
    showGuides: true,
    pvDebugOverlay: true,
    pvDebugTraceMode: "resampled",
    pvHistoryBeats: 8,
    pvHistoryMode: "fade",
  },
  {
    id: "wave",
    type: "WAVEFORM",
    title: "Waveforms",
    x: 6,
    y: 0,
    w: 6,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["LVP", "AoP"] },
      ami: { visible: true, selectedSignals: ["AoP"] },
    },
    isSettingsOpen: false,
    timeWindow: 5000,
  },
  {
    id: "metrics",
    type: "METRICS",
    title: "Metrics",
    w: 4,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["ABP", "CO"] },
      ami: { visible: true, selectedSignals: ["CO"] },
    },
    isSettingsOpen: false,
  },
  {
    id: "controls",
    type: "CONTROLS",
    title: "Controls",
    w: 4,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["clinical"] },
    },
    view: {
      kind: "control",
      controllerItems: [{ paramKey: "contractility", kind: "slider", label: "Contractility" }],
    },
    isSettingsOpen: false,
  },
  {
    id: "scenario-list",
    type: "SCENARIOS",
    title: "Scenarios",
    w: 4,
    h: 4,
    config: {},
    isSettingsOpen: false,
  },
  {
    id: "note",
    type: "NOTE",
    title: "Note",
    w: 4,
    h: 4,
    config: {},
    isSettingsOpen: false,
  },
];

describe("Workbench ViewSpec model", () => {
  it("migrates legacy panels into the new ViewSpec layer without scenario or note views", () => {
    const migrated = migratePanelsToViewSpecs(panels);

    expect(migrated.views.map((view) => [view.id, view.kind])).toEqual([
      ["pv", "graph"],
      ["wave", "graph"],
      ["metrics", "metrics"],
      ["controls", "controller"],
    ]);
    expect(migrated.views.some((view) => view.id === "scenario-list" || view.id === "note")).toBe(false);

    const pv = migrated.views.find((view) => view.id === "pv");
    expect(pv).toMatchObject({
      kind: "graph",
      graphType: "pvloop",
      membership: { normal: ["LV", "RV"] },
      aspect: { ratio: 1, fit: "lock" },
      presentation: {
        showGuides: true,
        pvDebugOverlay: true,
        pvDebugTraceMode: "resampled",
        pvHistoryBeats: 8,
        pvHistoryMode: "fade",
      },
    });

    const wave = migrated.views.find((view) => view.id === "wave");
    expect(wave).toMatchObject({
      kind: "graph",
      graphType: "waveform",
      membership: { normal: ["LVP", "AoP"], ami: ["AoP"] },
      presentation: { timeWindow: 5000 },
    });

    const metrics = migrated.views.find((view) => view.id === "metrics");
    expect(metrics).toMatchObject({
      kind: "metrics",
      metrics: ["ABP", "CO"],
      membership: { normal: ["ABP", "CO"], ami: ["CO"] },
    });

    const controls = migrated.views.find((view) => view.id === "controls");
    expect(controls).toMatchObject({
      kind: "controller",
      binding: { kind: "active" },
      items: [{ paramKey: "contractility", kind: "slider", label: "Contractility" }],
    });
  });

  it("derives a semantic graph board layout from panel grid rectangles", () => {
    const migrated = migratePanelsToViewSpecs(panels);

    expect(migrated.graphBoardLayout).toEqual({
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "pv" },
        { type: "leaf", graphViewId: "wave" },
      ],
      sizes: [0.5, 0.5],
    });
  });

  it("retains pane-local legend position in graph presentation migration", () => {
    const migrated = migratePanelsToViewSpecs([{
      ...panels[0],
      view: {
        kind: "graph",
        graphType: "pvloop",
        legendPosition: { xPct: 0.2, yPct: 0.3 },
      },
    }]);

    expect(migrated.views[0]).toMatchObject({
      kind: "graph",
      presentation: {
        legendPosition: { xPct: 0.2, yPct: 0.3 },
      },
    });
  });

  it("validates graph board invariants and normalizes single-child splits", () => {
    const invalid: GraphBoardLayout = {
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "pv" },
        { type: "leaf", graphViewId: "pv" },
        { type: "leaf", graphViewId: "missing" },
      ],
      sizes: [1, 0, 1],
    };

    expect(validateGraphBoardLayout(invalid, { graphViewIds: ["pv", "wave"] })).toEqual([
      "layout.sizes[1]: size must be a positive finite ratio.",
      'layout.children[1]: duplicate leaf graphViewId "pv".',
      'layout.children[2]: leaf graphViewId "missing" is not resolvable.',
    ]);

    const normalized = normalizeGraphBoardLayout({
      type: "split",
      direction: "column",
      children: [{ type: "leaf", graphViewId: "wave" }],
      sizes: [3],
    }, { graphViewIds: ["wave"] });

    expect(normalized).toEqual({ layout: { type: "leaf", graphViewId: "wave" }, errors: [] });
  });

  it("normalizes split ratios to positive proportions", () => {
    const normalized = normalizeGraphBoardLayout({
      type: "split",
      direction: "column",
      children: [
        { type: "leaf", graphViewId: "pv" },
        { type: "leaf", graphViewId: "wave" },
      ],
      sizes: [2, 6],
    }, { graphViewIds: ["pv", "wave"] });

    expect(normalized.layout).toEqual({
      type: "split",
      direction: "column",
      children: [
        { type: "leaf", graphViewId: "pv" },
        { type: "leaf", graphViewId: "wave" },
      ],
      sizes: [0.25, 0.75],
    });
  });

  it("computes effective visibility as membership intersected with global visibility", () => {
    const membership = {
      normal: ["LV", "RV"],
      ami: ["LV"],
      hidden: ["RV"],
    };

    expect(effectiveVisibility(membership, { normal: true, ami: false, hidden: true })).toEqual({
      normal: ["LV", "RV"],
      hidden: ["RV"],
    });
    expect(effectiveScenarioIds(membership, new Set(["ami"]))).toEqual(["ami"]);
  });

  it("remaps scenario ids in views and view ids in graph board layouts", () => {
    const view: ViewSpec = {
      id: "pv",
      kind: "graph",
      graphType: "pvloop",
      membership: { old: ["LV"] },
    };
    const layout: GraphBoardLayout = { type: "leaf", graphViewId: "pv" };

    expect(remapViewSpecIds(view, {
      scenarioIdMap: new Map([["old", "new"]]),
      viewIdMap: new Map([["pv", "pv2"]]),
    })).toMatchObject({
      id: "pv2",
      membership: { new: ["LV"] },
    });
    expect(remapGraphBoardLayoutViewIds(layout, new Map([["pv", "pv2"]]))).toEqual({ type: "leaf", graphViewId: "pv2" });
  });
});

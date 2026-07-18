import { describe, expect, it } from "vitest";
import {
  addVisibleScenariosToMetricsViews,
  authoredViewsForLoad,
  createControllerViewSpec,
  createGraphViewSpec,
  createMetricsViewSpec,
  deleteAuthoredView,
  duplicateAuthoredView,
  metricsViewConfig,
  removeScenariosFromAuthoredViews,
  serializableAuthoredViews,
  standardAuthoredViews,
  upsertAuthoredView,
} from "@/features/workbench/authoredViews";
import type { GraphViewSpec, MetricsViewSpec, ViewSpec } from "@/features/workbench/viewSpec";
import type { PanelDef, SimInstance } from "@/types";

const instances: SimInstance[] = [
  { id: "normal", name: "Normal", color: "#38bdf8", params: {} as SimInstance["params"], targetVolume: 5000, isVisible: true },
  { id: "hidden", name: "Hidden", color: "#f97316", params: {} as SimInstance["params"], targetVolume: 5000, isVisible: false },
];

function testIdFactory() {
  let next = 0;
  return (kind: "controller" | "metrics") => `${kind}-${next++}`;
}

const legacyPanels: PanelDef[] = [
  {
    id: "controls",
    type: "CONTROLS",
    title: "Curated controls",
    w: 4,
    h: 4,
    config: { normal: { visible: true, selectedSignals: ["clinical"] } },
    view: {
      kind: "control",
      controllerItems: [{ paramKey: "contractility", kind: "slider", label: "LV contractility" }],
    },
    isSettingsOpen: false,
  },
  {
    id: "metrics",
    type: "METRICS",
    title: "Teaching metrics",
    w: 4,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["ABP", "CO"] },
      hidden: { visible: false, selectedSignals: ["CO"] },
    },
    isSettingsOpen: false,
  },
  {
    id: "built-in-pressure",
    type: "METRICS",
    title: "Pressures",
    w: 4,
    h: 4,
    config: {
      normal: { visible: true, selectedSignals: ["ABP", "CVP", "PAP", "PCWP"] },
    },
    isSettingsOpen: false,
  },
];

describe("P2a authored view helpers", () => {
  it("keeps graph specs as first-class serializable authored views", () => {
    const views: ViewSpec[] = [
      { id: "graph", kind: "graph", graphType: "pvloop", membership: { normal: ["LV"] } },
      createControllerViewSpec("controller", "Controller", [{ paramKey: "HR", kind: "slider", label: "HR" }]),
      createMetricsViewSpec("metrics", "Metrics", ["ABP"], instances),
    ];

    expect(serializableAuthoredViews(views).map((view) => [view.id, view.kind])).toEqual([
      ["graph", "graph"],
      ["controller", "controller"],
      ["metrics", "metrics"],
    ]);
    expect(serializableAuthoredViews(undefined)).toEqual([]);
  });

  it("creates a semantic graph view independently of pane identity", () => {
    const semanticViewId = "view-la-pv-loop";
    const paneId = "dock-pane-17";
    const graph = createGraphViewSpec(
      semanticViewId,
      "Left atrium PV loop",
      "pvloop",
      { normal: ["LA"] },
      {
        aspect: { ratio: 1, fit: "lock" },
        presentation: { showGuides: false, showLegend: true },
      },
    );

    expect(graph).toEqual({
      id: semanticViewId,
      title: "Left atrium PV loop",
      kind: "graph",
      graphType: "pvloop",
      membership: { normal: ["LA"] },
      aspect: { ratio: 1, fit: "lock" },
      presentation: { showGuides: false, showLegend: true },
    });
    expect(graph.id).not.toBe(paneId);

    const copy = duplicateAuthoredView(graph, "view-la-pv-loop-copy", "") as GraphViewSpec;
    expect(copy).toMatchObject({ id: "view-la-pv-loop-copy", title: "Graph view copy", kind: "graph" });

    const normalized = upsertAuthoredView([], {
      ...graph,
      membership: { normal: ["LA", "LA", ""] },
    });
    expect((normalized[0] as GraphViewSpec).membership).toEqual({ normal: ["LA"] });
  });

  it("creates, updates, duplicates, and deletes authored views with normalized payloads", () => {
    const controller = createControllerViewSpec("controller-a", "Controller A", [
      { paramKey: "HR", kind: "slider", label: "Heart rate" },
      { paramKey: "HR", kind: "slider", label: "Duplicate" },
    ]);
    expect(controller.items).toHaveLength(1);
    expect(controller.binding).toEqual({ kind: "active" });

    const metrics = createMetricsViewSpec("metrics-a", "Metrics A", ["ABP", "ABP", "CO"], instances);
    expect(metrics.metrics).toEqual(["ABP", "CO"]);
    expect(metrics.membership).toEqual({
      normal: ["ABP", "CO"],
      hidden: ["ABP", "CO"],
    });

    const copy = duplicateAuthoredView(controller, "controller-b", "Controller B");
    expect(copy).toMatchObject({ id: "controller-b", title: "Controller B", kind: "controller" });

    const upserted = upsertAuthoredView([controller] as ReturnType<typeof createControllerViewSpec>[], copy);
    expect(upserted.map((view) => view.id)).toEqual(["controller-a", "controller-b"]);
    expect(deleteAuthoredView(upserted, "controller-a").map((view) => view.id)).toEqual(["controller-b"]);
  });

  it("seeds standard views and migrates legacy panels only when doc.views is undefined", () => {
    const loaded = authoredViewsForLoad(undefined, legacyPanels, {
      idFactory: testIdFactory(),
      instances,
      locale: "en",
    });

    expect(loaded.map((view) => [view.kind, view.title])).toEqual([
      ["controller", "Clinical parameters (standard)"],
      ["metrics", "Pressures"],
      ["metrics", "Flow / volume"],
      ["metrics", "Function"],
      ["metrics", "Coronary"],
      ["controller", "Curated controls"],
      ["metrics", "Teaching metrics"],
    ]);
    expect(loaded.filter((view) => view.kind === "controller").map((view) => view.binding))
      .toEqual([{ kind: "active" }, { kind: "active" }]);
  });

  it("respects doc.views arrays exactly, including legacy panels and empty arrays", () => {
    const existing: MetricsViewSpec = createMetricsViewSpec("metrics", "Existing metrics", ["SV"], instances);
    const loaded = authoredViewsForLoad([
      existing,
      { id: "graph", kind: "graph", graphType: "waveform", membership: { normal: ["LVP"] } },
    ], legacyPanels, {
      idFactory: testIdFactory(),
      instances,
      locale: "en",
    });

    expect(loaded.map((view) => [view.id, view.kind, view.title])).toEqual([
      ["metrics", "metrics", "Existing metrics"],
      ["graph", "graph", undefined],
    ]);
    expect(authoredViewsForLoad([], legacyPanels, {
      idFactory: testIdFactory(),
      instances,
      locale: "en",
    })).toEqual([]);
  });

  it("creates localized standard document views", () => {
    const views = standardAuthoredViews(testIdFactory(), instances, "ja");
    expect(views.map((view) => [view.id, view.kind, view.title])).toEqual([
      ["controller-0", "controller", "臨床パラメータ（標準）"],
      ["metrics-1", "metrics", "圧"],
      ["metrics-2", "metrics", "流量 / 容積"],
      ["metrics-3", "metrics", "機能"],
      ["metrics-4", "metrics", "冠循環"],
    ]);
    expect(views[0]).toMatchObject({
      kind: "controller",
      binding: { kind: "active" },
      items: expect.arrayContaining([expect.objectContaining({ paramKey: "contractility", labelKey: "contractility" })]),
    });
  });

  it("derives a metrics render config from view membership", () => {
    const view: MetricsViewSpec = {
      id: "teaching",
      title: "Teaching",
      kind: "metrics",
      metrics: ["ABP", "CO"],
      membership: { normal: ["ABP"], hidden: ["CO"] },
    };

    expect(metricsViewConfig(view, instances)).toEqual({
      normal: { visible: true, selectedSignals: ["ABP"] },
      hidden: { visible: true, selectedSignals: ["CO"] },
    });
  });

  it("adds new scenarios to authored metrics view membership as visible", () => {
    const views = [
      createControllerViewSpec("controller", "Controller", []),
      createMetricsViewSpec("metrics", "Metrics", ["ABP", "CO"], [instances[0]]),
    ];

    const next = addVisibleScenariosToMetricsViews(views, ["copy"]);
    expect(next[0]).toBe(views[0]);
    expect(next[1]).toMatchObject({
      kind: "metrics",
      membership: {
        normal: ["ABP", "CO"],
        copy: ["ABP", "CO"],
      },
    });
    expect(metricsViewConfig(next[1] as MetricsViewSpec, [...instances, { ...instances[0], id: "copy" }]).copy.visible).toBe(true);
  });

  it("removes deleted scenarios from every authored reference without disturbing survivors", () => {
    const graph = createGraphViewSpec("graph", "Graph", "waveform", {
      normal: ["LVP"],
      copy: ["AoP"],
    });
    const metrics = createMetricsViewSpec("metrics", "Metrics", ["ABP"], [instances[0]]);
    metrics.membership.copy = ["CO"];
    const pinnedDeleted = {
      ...createControllerViewSpec("controller-copy", "Copy controls", []),
      binding: { kind: "scenario" as const, scenarioId: "copy" },
    };
    const pinnedSurvivor = {
      ...createControllerViewSpec("controller-normal", "Normal controls", []),
      binding: { kind: "scenario" as const, scenarioId: "normal" },
    };
    const active = createControllerViewSpec("controller-active", "Active controls", []);

    const next = removeScenariosFromAuthoredViews(
      [graph, metrics, pinnedDeleted, pinnedSurvivor, active],
      ["copy"],
    );

    expect(next[0]).toMatchObject({ kind: "graph", membership: { normal: ["LVP"] } });
    expect(next[1]).toMatchObject({ kind: "metrics", membership: { normal: ["ABP"] } });
    expect(next[2]).toMatchObject({ kind: "controller", binding: { kind: "active" } });
    expect(next[3]).toBe(pinnedSurvivor);
    expect(next[4]).toBe(active);
    expect(graph.membership).toEqual({ normal: ["LVP"], copy: ["AoP"] });
  });
});

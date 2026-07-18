import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InteractiveGraphLegend, shouldEnableLegendInteractions } from "@/components/InteractiveGraphLegend";
import { clampLegendFraction, defaultLegendFraction, exceededDragThreshold, fractionToPx, isNearDefaultLegendCorner, magnetizeLegendPosition, pxToFraction } from "@/components/legendPosition";
import { ScientificWorkbenchChartLegendV1 } from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";
import { mergePanelLegendPosition } from "@/WorkbenchPage";
import type { PanelDef } from "@/types";

function graphPanel(extras: Partial<PanelDef> = {}): PanelDef {
  return {
    id: "wave",
    type: "WAVEFORM",
    title: "Waveforms",
    w: 6,
    h: 8,
    config: { normal: { visible: true, selectedSignals: ["LVP", "AoP"] } },
    isSettingsOpen: false,
    timeWindow: 5000,
    ...extras,
  };
}

const noop = () => undefined;

describe("InteractiveGraphLegend", () => {
  it("exposes single-click and keyboard settings semantics without extra chrome", () => {
    const html = renderToStaticMarkup(React.createElement(
      InteractiveGraphLegend,
      {
        panelId: "lv-pv",
        interactive: true,
        onOpenSettings: noop,
        onPositionChange: noop,
        ariaLabel: "Open LV PV pane settings",
        className: "p-1.5",
      },
      React.createElement("span", null, "LV"),
    ));

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Open LV PV pane settings"');
    expect(html).toContain('title="Drag to move · click to edit"');
    expect(html).toContain('data-legend-placement="default"');
    expect(html).toContain('data-legend-magnet="free"');
    expect(html).toContain("pointer-events-auto");
    expect(html).toContain("cursor-grab");
    expect(html).not.toContain("double-click");
    expect(html).not.toContain("<button");
  });

  it("keeps reading and non-configurable legends inert", () => {
    expect(shouldEnableLegendInteractions({
      canConfigure: true,
      presentationMode: "studio",
    })).toBe(true);
    expect(shouldEnableLegendInteractions({
      canConfigure: true,
      presentationMode: "reading",
    })).toBe(false);
    expect(shouldEnableLegendInteractions({
      canConfigure: false,
      presentationMode: "studio",
    })).toBe(false);

    const html = renderToStaticMarkup(React.createElement(
      InteractiveGraphLegend,
      {
        panelId: "lv-pv",
        interactive: false,
        onOpenSettings: noop,
        onPositionChange: noop,
      },
      "LV",
    ));
    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain("cursor-grab");
  });

  it("uses the shared interaction surface for scientific chart entries", () => {
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkbenchChartLegendV1,
      {
        entries: [{
          key: "healthy-lv",
          color: "#38bdf8",
          modelName: "Healthy",
          signalName: "Left ventricle",
        }],
        interaction: {
          panelId: "lv-pv",
          interactive: true,
          onOpenSettings: noop,
          onLegendPositionChange: noop,
          legendPosition: { xPct: 0.25, yPct: 0.4 },
        },
      },
    ));

    expect(html).toContain('data-testid="scientific-workbench-chart-legend-v1"');
    expect(html).toContain('data-legend-placement="custom"');
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-label="Healthy, Left ventricle"');
    expect(html).toContain(">Left ventricle</span>");
  });
});

describe("legend position helpers", () => {
  it("round-trips between normalized fractions and pixels", () => {
    const container = { width: 400, height: 250 };
    const pos = { xPct: 0.25, yPct: 0.4 };
    const px = fractionToPx(pos, container);

    expect(px).toEqual({ left: 100, top: 100 });
    expect(pxToFraction(px, container)).toEqual(pos);
  });

  it("clamps to the visible legend bounds", () => {
    expect(clampLegendFraction(
      { xPct: 0.95, yPct: -0.2 },
      { width: 400, height: 200 },
      { width: 100, height: 50 },
    )).toEqual({ xPct: 0.75, yPct: 0 });
  });

  it("returns top-left for zero-size containers", () => {
    expect(clampLegendFraction(
      { xPct: 0.5, yPct: 0.5 },
      { width: 0, height: 200 },
      { width: 40, height: 40 },
    )).toEqual({ xPct: 0, yPct: 0 });
  });

  it("pins to top-left when the legend is at least as large as the container", () => {
    expect(clampLegendFraction(
      { xPct: 0.5, yPct: 0.5 },
      { width: 100, height: 80 },
      { width: 100, height: 90 },
    )).toEqual({ xPct: 0, yPct: 0 });
  });

  it("treats net moves at or under the drag threshold as non-drags", () => {
    const start = { x: 10, y: 20 };

    expect(exceededDragThreshold(start, { x: 13, y: 24 })).toBe(false);
    expect(exceededDragThreshold(start, { x: 15, y: 20 })).toBe(false);
  });

  it("detects net moves over the drag threshold", () => {
    expect(exceededDragThreshold({ x: 10, y: 20 }, { x: 16, y: 20 })).toBe(true);
  });

  it("detects positions near the default top-right legend corner", () => {
    const container = { width: 400, height: 250 };
    const legend = { width: 100, height: 50 };
    const defaultPoint = { left: 292, top: 8 };

    expect(isNearDefaultLegendCorner(
      pxToFraction(defaultPoint, container),
      container,
      legend,
    )).toBe(true);
    expect(isNearDefaultLegendCorner(
      pxToFraction({ left: defaultPoint.left - 15.999, top: defaultPoint.top }, container),
      container,
      legend,
    )).toBe(true);
    expect(isNearDefaultLegendCorner(
      pxToFraction({ left: defaultPoint.left - 16.001, top: defaultPoint.top }, container),
      container,
      legend,
    )).toBe(false);
  });

  it("does not treat zero-size or non-finite dimensions as near the default corner", () => {
    const pos = { xPct: 0.5, yPct: 0.5 };
    const container = { width: 400, height: 250 };
    const legend = { width: 100, height: 50 };

    expect(isNearDefaultLegendCorner(pos, { width: 0, height: 250 }, legend)).toBe(false);
    expect(isNearDefaultLegendCorner(pos, container, { width: 0, height: 50 })).toBe(false);
    expect(isNearDefaultLegendCorner(pos, { width: Number.NaN, height: 250 }, legend)).toBe(false);
    expect(isNearDefaultLegendCorner(pos, { width: 400, height: Number.POSITIVE_INFINITY }, legend)).toBe(false);
    expect(isNearDefaultLegendCorner(pos, container, { width: Number.POSITIVE_INFINITY, height: 50 })).toBe(false);
    expect(isNearDefaultLegendCorner(pos, container, { width: 100, height: Number.NaN })).toBe(false);
  });

  it("magnetizes live movement to the default corner with release hysteresis", () => {
    const container = { width: 400, height: 250 };
    const legend = { width: 100, height: 50 };
    const defaultPosition = defaultLegendFraction(container, legend);
    const near = pxToFraction({ left: 274, top: 8 }, container);
    const betweenEnterAndExit = pxToFraction({ left: 267, top: 8 }, container);
    const outsideExit = pxToFraction({ left: 259, top: 8 }, container);

    expect(magnetizeLegendPosition(
      near,
      container,
      legend,
      false,
    )).toEqual({ position: defaultPosition, snapped: true });
    expect(magnetizeLegendPosition(
      betweenEnterAndExit,
      container,
      legend,
      true,
    )).toEqual({ position: defaultPosition, snapped: true });
    expect(magnetizeLegendPosition(
      betweenEnterAndExit,
      container,
      legend,
      false,
    )).toEqual({ position: betweenEnterAndExit, snapped: false });
    expect(magnetizeLegendPosition(
      outsideExit,
      container,
      legend,
      true,
    )).toEqual({ position: outsideExit, snapped: false });
  });
});

describe("mergePanelLegendPosition", () => {
  it("preserves existing graph-view fields and sets legendPosition", () => {
    const panel = graphPanel({
      view: {
        kind: "graph",
        graphType: "waveform",
        signals: ["LVP"],
        showLegend: true,
        labels: { LVP: "LV pressure" },
      },
    });

    const merged = mergePanelLegendPosition(panel, { xPct: 0.2, yPct: 0.3 });

    expect(merged.view).toMatchObject({
      kind: "graph",
      graphType: "waveform",
      signals: ["LVP"],
      showLegend: true,
      labels: { LVP: "LV pressure" },
      legendPosition: { xPct: 0.2, yPct: 0.3 },
    });
  });

  it("builds a graph view when panel.view is absent", () => {
    const merged = mergePanelLegendPosition(graphPanel({ view: undefined }), { xPct: 0.1, yPct: 0.2 });

    expect(merged.view).toMatchObject({
      kind: "graph",
      graphType: "waveform",
      signals: ["LVP", "AoP"],
      timeWindow: 5000,
      legendPosition: { xPct: 0.1, yPct: 0.2 },
    });
  });

  it("leaves non-graph panels unchanged", () => {
    const panel: PanelDef = {
      id: "controls",
      type: "CONTROLS",
      title: "Controls",
      w: 4,
      h: 4,
      config: { normal: { visible: true, selectedSignals: ["clinical"] } },
      isSettingsOpen: false,
      view: { kind: "control", groups: ["clinical"], editable: true },
    };

    expect(mergePanelLegendPosition(panel, { xPct: 0.2, yPct: 0.3 })).toBe(panel);
  });

  it("omits legendPosition when clearing", () => {
    const merged = mergePanelLegendPosition(graphPanel({
      view: {
        kind: "graph",
        graphType: "waveform",
        signals: ["LVP"],
        legendPosition: { xPct: 0.2, yPct: 0.3 },
      },
    }), undefined);

    expect(merged.view?.kind).toBe("graph");
    expect(merged.view).not.toHaveProperty("legendPosition");
    expect(Object.prototype.hasOwnProperty.call(merged.view, "legendPosition")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { clampLegendFraction, fractionToPx, pxToFraction } from "@/components/legendPosition";
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

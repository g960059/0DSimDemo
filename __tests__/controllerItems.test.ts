import { describe, expect, it } from "vitest";
import { groupControllerItemsByCategory, normalizeControllerItems } from "@/controllerItems";
import { mergePanelControllerItems } from "@/WorkbenchPage";
import { readingToStudioZones } from "@/readingConversion";
import type { ControllerItem, PanelDef } from "@/types";

function controlPanel(extras: Partial<PanelDef> = {}): PanelDef {
  return {
    id: "controls",
    type: "CONTROLS",
    title: "Controls",
    w: 4,
    h: 4,
    config: { normal: { visible: true, selectedSignals: ["clinical", "Global"] } },
    isSettingsOpen: false,
    ...extras,
  };
}

describe("normalizeControllerItems", () => {
  it("clamps to knob ranges and keeps an author step override", () => {
    const { items } = normalizeControllerItems([
      { paramKey: "contractility", kind: "slider", label: "  LV  ", min: -10, max: 99, step: 0.001 },
      { paramKey: "HR", kind: "buttonGroup", label: "Rate", options: [{ label: "A", value: 41.4 }, { label: "B", value: 180.4 }] },
    ]);

    expect(items[0]).toMatchObject({ min: 0.25, max: 2.5, step: 0.001, label: "LV" });
    expect(items[1].options).toEqual([{ label: "A", value: 41 }, { label: "B", value: 180 }]);
  });

  it("keeps cataloged raw parameters with default slider metadata", () => {
    const { items, warnings } = normalizeControllerItems([
      { paramKey: "lvGeomScale", kind: "slider", label: "LV size" },
    ]);

    expect(items).toEqual([
      expect.objectContaining({ paramKey: "lvGeomScale", label: "LV size", min: 0.5, max: 2.5, step: 0.05 }),
    ]);
    expect(warnings).toEqual([]);
  });

  it("allows authors to narrow raw ranges within the engine hard range", () => {
    const { items } = normalizeControllerItems([
      { paramKey: "pericardialFluidMl", kind: "slider", label: "Effusion", min: 100, max: 300, step: 10 },
    ]);

    expect(items[0]).toMatchObject({ min: 100, max: 300, step: 10 });
  });

  it("clamps author raw ranges to the engine hard range", () => {
    const { items } = normalizeControllerItems([
      { paramKey: "pericardialFluidMl", kind: "slider", label: "Effusion", min: -50, max: 2000, step: 10 },
    ]);

    expect(items[0]).toMatchObject({ min: 0, max: 1000, step: 10 });
  });

  it("dedups items, drops unknown keys, trims labels, and falls back to catalog labels", () => {
    const { items, warnings } = normalizeControllerItems([
      { paramKey: "contractility", kind: "slider", label: "   " },
      { paramKey: "notARealKnob", kind: "slider", label: "Nope" },
      { paramKey: "contractility", kind: "slider", label: "Duplicate" },
    ]);

    expect(items).toEqual([expect.objectContaining({ paramKey: "contractility", label: "LV Contractility" })]);
    expect(warnings.join("\n")).toContain("unknown");
    expect(warnings.join("\n")).toContain("duplicate");
  });

  it("coerces non-string labels before empty fallback", () => {
    const { items } = normalizeControllerItems([
      { paramKey: "contractility", kind: "slider", label: null },
      {
        paramKey: "HR",
        kind: "buttonGroup",
        label: 123,
        options: [{ label: 456, value: 60 }, { label: null, value: 100 }],
      },
    ] as any);

    expect(items[0].label).toBe("LV Contractility");
    expect(items[1].label).toBe("123");
    expect(items[1].options).toEqual([{ label: "456", value: 60 }, { label: "100", value: 100 }]);
  });

  it("coerces invalid kinds to slider", () => {
    const { items, warnings } = normalizeControllerItems([
      { paramKey: "afterload", kind: "bad" as ControllerItem["kind"], label: "Afterload" },
    ]);

    expect(items[0].kind).toBe("slider");
    expect(warnings.join("\n")).toContain("invalid kind");
  });

  it("dedups button options by normalized value, caps at 3, and keeps valid buttons", () => {
    const { items, warnings } = normalizeControllerItems([
      {
        paramKey: "aorticStenosis",
        kind: "buttonGroup",
        label: "AS",
        options: [
          { label: "None", value: 0 },
          { label: "Duplicate none", value: 0.01 },
          { label: "Mild", value: 0.25 },
          { label: "Moderate", value: 0.5 },
          { label: "Severe", value: 1 },
        ],
      },
    ]);

    expect(items[0].kind).toBe("buttonGroup");
    expect(items[0].options).toEqual([
      { label: "None", value: 0 },
      { label: "Mild", value: 0.25 },
      { label: "Moderate", value: 0.5 },
    ]);
    expect(warnings.join("\n")).toContain("Capped");
  });

  it("coerces button groups with fewer than 2 distinct values to slider without options", () => {
    const { items, warnings } = normalizeControllerItems([
      {
        paramKey: "venousTone",
        kind: "buttonGroup",
        label: "Tone",
        options: [{ label: "Same", value: 0.5 }, { label: "Same again", value: 0.5 }],
      },
    ]);

    expect(items[0].kind).toBe("slider");
    expect(items[0].options).toBeUndefined();
    expect(warnings.join("\n")).toContain("fewer than 2");
  });
});

describe("groupControllerItemsByCategory", () => {
  it("keeps small curated views as one flat group even with multiple categories", () => {
    const items: ControllerItem[] = [
      { paramKey: "contractility", kind: "slider" },
      { paramKey: "HR", kind: "slider" },
      { paramKey: "aorticStenosis", kind: "slider" },
    ];

    expect(groupControllerItemsByCategory(items)).toEqual([
      { category: "Cardiac Function", items },
    ]);
  });

  it("keeps long single-category views as one flat group", () => {
    const items: ControllerItem[] = [
      { paramKey: "contractility", kind: "slider" },
      { paramKey: "contractilityRV", kind: "slider" },
      { paramKey: "relaxation", kind: "slider" },
      { paramKey: "diastolicStiffness", kind: "slider" },
      { paramKey: "contractility", kind: "buttonGroup" },
      { paramKey: "relaxation", kind: "buttonGroup" },
      { paramKey: "diastolicStiffness", kind: "buttonGroup" },
    ];

    expect(groupControllerItemsByCategory(items)).toEqual([
      { category: "Cardiac Function", items },
    ]);
  });

  it("groups consecutive items for long multi-category views using clinical, raw, then other categories", () => {
    const items: ControllerItem[] = [
      { paramKey: "contractility", kind: "slider" },
      { paramKey: "contractilityRV", kind: "slider" },
      { paramKey: "HR", kind: "slider" },
      { paramKey: "afterload", kind: "slider" },
      { paramKey: "lvGeomScale", kind: "slider" },
      { paramKey: "aorticStenosis", kind: "slider" },
      { paramKey: "unknownParameter", kind: "slider" },
      { paramKey: "relaxation", kind: "slider" },
    ];

    const groups = groupControllerItemsByCategory(items);

    expect(groups.map((group) => [group.category, group.items.map((item) => item.paramKey)])).toEqual([
      ["Cardiac Function", ["contractility", "contractilityRV"]],
      ["Load & Rate", ["HR", "afterload"]],
      ["geometry", ["lvGeomScale"]],
      ["Valve Lesions", ["aorticStenosis"]],
      ["other", ["unknownParameter"]],
      ["Cardiac Function", ["relaxation"]],
    ]);
  });
});

describe("mergePanelControllerItems", () => {
  it("preserves existing control-view fields and sets normalized controllerItems", () => {
    const panel = controlPanel({
      view: {
        kind: "control",
        groups: ["clinical"],
        knobs: ["HR"],
        editable: false,
        labels: { HR: "Rate" },
        instances: { normal: { visible: true, label: "Normal" } },
      },
    });

    const merged = mergePanelControllerItems(panel, [{ paramKey: "contractility", kind: "slider", label: "  Custom LV  " }]);

    expect(merged.view).toMatchObject({
      kind: "control",
      groups: ["clinical"],
      knobs: ["HR"],
      editable: false,
      labels: { HR: "Rate" },
      instances: { normal: { visible: true, label: "Normal" } },
      controllerItems: [expect.objectContaining({ paramKey: "contractility", label: "Custom LV" })],
    });
  });

  it("builds a valid control view when panel.view is absent", () => {
    const merged = mergePanelControllerItems(controlPanel({ view: undefined }), [{ paramKey: "HR", kind: "slider" }]);

    expect(merged.view).toMatchObject({
      kind: "control",
      groups: ["clinical", "Global"],
      editable: true,
      controllerItems: [expect.objectContaining({ paramKey: "HR" })],
    });
  });

  it("uses a runtime-specific normalizer instead of dropping scientific controller IDs", () => {
    const scientificItem: ControllerItem = {
      paramKey: "circulation.systemic-vascular-resistance-scale",
      kind: "slider",
      min: 0.75,
      max: 4 / 3,
      step: 1 / 12,
      options: [
        { label: "0.75×", value: 0.75 },
        { label: "1.00×", value: 1 },
        { label: "1.33×", value: 4 / 3 },
      ],
    };
    const merged = mergePanelControllerItems(
      controlPanel({ view: undefined }),
      [scientificItem],
      (items) => items,
    );

    expect(merged.view).toMatchObject({
      kind: "control",
      controllerItems: [scientificItem],
    });
  });

  it("does not spread a non-control view into the control view", () => {
    const merged = mergePanelControllerItems(controlPanel({
      view: { kind: "graph", graphType: "waveform", signals: ["LVP"], showLegend: false },
    }), [{ paramKey: "HR", kind: "slider" }]);

    expect(merged.view?.kind).toBe("control");
    expect(merged.view).not.toHaveProperty("graphType");
    expect(merged.view).not.toHaveProperty("signals");
    expect(merged.view).not.toHaveProperty("showLegend");
  });

  it("leaves non-control panels unchanged", () => {
    const panel: PanelDef = {
      id: "pv",
      type: "PVLOOP",
      title: "PV Loop",
      w: 6,
      h: 8,
      config: { normal: { visible: true, selectedSignals: ["LV"] } },
      isSettingsOpen: false,
      view: { kind: "graph", graphType: "pvloop", chambers: ["LV"], showLegend: false },
    };

    const merged = mergePanelControllerItems(panel, [{ paramKey: "HR", kind: "slider" }]);

    expect(merged).toBe(panel);
  });

  it("preserves controllerItems across reading-to-studio panel cloning", () => {
    const panels = [
      controlPanel({
        view: {
          kind: "control",
          groups: ["clinical"],
          controllerItems: [{ paramKey: "relaxation", kind: "slider", label: "Relaxation focus" }],
        },
      }),
    ];

    const studio = readingToStudioZones(panels);

    expect(studio[0].view).toEqual(panels[0].view);
    expect(studio[0].view).not.toBe(panels[0].view);
  });
});

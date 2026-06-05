import { describe, expect, it } from "vitest";
import type { CaseExposedController } from "@/caseDoc";
import { KNOB_LABELS, KNOB_STEPS, knobControllerMetadata } from "@/knobMetadata";
import { READ_PRESET } from "@/layoutPresets";
import { defaultZoneOf } from "@/paneZone";
import type { PanelDef, PanelRole, PanelType } from "@/types";
import {
  deriveDefaultReadingColumn,
  exposedKnobsToControllerItems,
  knobsToControllerItems,
  READING_ROLE_ORDER,
  readingToStudioZones,
  studioToReadingColumn,
} from "@/readingConversion";

function panel(id: string, type: PanelType, extras: Partial<PanelDef> = {}): PanelDef {
  return {
    id,
    type,
    title: id,
    w: 4,
    h: 2,
    config: {},
    isSettingsOpen: false,
    ...extras,
  };
}

describe("readingConversion", () => {
  it("defines a numeric rank for every PanelRole", () => {
    for (const role of ["note", "graph", "output", "control"] satisfies PanelRole[]) {
      expect(typeof READING_ROLE_ORDER[role]).toBe("number");
      expect(Number.isFinite(READING_ROLE_ORDER[role])).toBe(true);
    }
  });

  it("studioToReadingColumn preserves READ_PRESET array order", () => {
    const entries = studioToReadingColumn(READ_PRESET);

    expect(entries).toHaveLength(READ_PRESET.length);
    entries.forEach((entry, index) => {
      const source = READ_PRESET[index];
      if (source.type === "NOTE") {
        expect(entry).toEqual({ kind: "noteRef", noteId: source.id });
      } else {
        expect(entry).toEqual({ kind: "paneRef", panelId: source.id });
      }
    });
  });

  it("studioToReadingColumn keeps interleaved notes in place", () => {
    const panels = [
      panel("noteA", "NOTE"),
      panel("waveform", "WAVEFORM"),
      panel("noteB", "NOTE"),
      panel("metrics", "METRICS"),
    ];

    expect(studioToReadingColumn(panels)).toEqual([
      { kind: "noteRef", noteId: "noteA" },
      { kind: "paneRef", panelId: "waveform" },
      { kind: "noteRef", noteId: "noteB" },
      { kind: "paneRef", panelId: "metrics" },
    ]);
  });

  it("deriveDefaultReadingColumn role-groups notes first and is idempotent for the same panels", () => {
    const panels = [
      panel("noteA", "NOTE"),
      panel("waveform", "WAVEFORM"),
      panel("noteB", "NOTE"),
      panel("metrics", "METRICS"),
      panel("controls", "CONTROLS"),
    ];

    const first = deriveDefaultReadingColumn(panels);
    expect(first).toEqual([
      { kind: "noteRef", noteId: "noteA" },
      { kind: "noteRef", noteId: "noteB" },
      { kind: "paneRef", panelId: "waveform", generated: true },
      { kind: "paneRef", panelId: "metrics", generated: true },
      { kind: "paneRef", panelId: "controls", generated: true },
    ]);
    expect(deriveDefaultReadingColumn(panels)).toEqual(first);
  });

  it("readingToStudioZones fills role and default zone without mutating input", () => {
    const panels = [
      panel("waveform", "WAVEFORM", {
        zone: "bottomPanel",
        x: 9,
        y: 7,
        config: { normal: { visible: true, selectedSignals: ["LVP", "AoP"] } },
      }),
      panel("metrics", "METRICS", { role: "output", config: { normal: { visible: true, selectedSignals: ["ABP"] } } }),
    ];
    const before = JSON.parse(JSON.stringify(panels));

    const studio = readingToStudioZones(panels);

    expect(panels).toEqual(before);
    expect(studio).not.toBe(panels);
    studio.forEach((entry, index) => {
      expect(entry).not.toBe(panels[index]);
      expect(entry.zone).toBe(defaultZoneOf(entry.type));
      expect(entry.role).toBe(index === 0 ? "graph" : "output");
    });
    expect(studio[0].config.normal.selectedSignals).toEqual(["LVP", "AoP"]);
  });

  it("studio->reading->studio preserves pane identity, types, selected signals, and note presence", () => {
    const panels = [
      panel("note", "NOTE", { view: { kind: "note", noteId: "case-note" } }),
      panel("waveform", "WAVEFORM", { config: { normal: { visible: true, selectedSignals: ["LVP"] } }, x: 1, y: 2 }),
      panel("metrics", "METRICS", { config: { normal: { visible: true, selectedSignals: ["ABP", "CO"] } }, x: 3, y: 4 }),
    ];
    const column = studioToReadingColumn(panels);
    const studio = readingToStudioZones(panels);

    expect(column).toEqual([
      { kind: "noteRef", noteId: "case-note" },
      { kind: "paneRef", panelId: "waveform" },
      { kind: "paneRef", panelId: "metrics" },
    ]);
    expect(studio.map((entry) => [entry.id, entry.type])).toEqual(panels.map((entry) => [entry.id, entry.type]));
    expect(studio[1].config.normal.selectedSignals).toEqual(["LVP"]);
    expect(studio[2].config.normal.selectedSignals).toEqual(["ABP", "CO"]);
    expect(studio.some((entry) => entry.type === "NOTE")).toBe(true);
  });

  it("reading->studio->reading column order is stable", () => {
    const readingPanels = [
      panel("noteA", "NOTE"),
      panel("waveform", "WAVEFORM"),
      panel("noteB", "NOTE"),
      panel("controls", "CONTROLS"),
    ];

    expect(studioToReadingColumn(readingToStudioZones(readingPanels))).toEqual(studioToReadingColumn(readingPanels));
  });

  it("converts knobs to slider controller items with metadata and fallbacks", () => {
    const items = knobsToControllerItems(["HR", "contractility", "relaxation", "baroreflexEnabled", "notARealKnob" as never]);

    expect(items[0]).toMatchObject({ paramKey: "HR", kind: "slider", label: "Heart rate", min: 30, max: 180, step: 1 });
    expect(items[1]).toMatchObject({ paramKey: "contractility", kind: "slider", label: "LV contractility", min: 0.25, max: 2.5, step: 0.05 });
    expect(items[2]).toMatchObject({ paramKey: "relaxation", kind: "slider", label: "Relaxation", min: 0.25, max: 2.5, step: 0.05 });
    expect(items[0].options).toBeUndefined();
    expect(items[1].options).toBeUndefined();
    expect(items[2].options).toBeUndefined();
    expect(items.map((entry) => entry.paramKey)).toEqual(["HR", "contractility", "relaxation", "baroreflexEnabled", "notARealKnob"]);
    expect(items[3]).toEqual({ paramKey: "baroreflexEnabled", kind: "slider", label: "baroreflexEnabled" });
    expect(items[4]).toEqual({ paramKey: "notARealKnob", kind: "slider", label: "notARealKnob" });
  });

  it("exposedKnobsToControllerItems delegates with parity", () => {
    expect(exposedKnobsToControllerItems(["HR", "contractility"])).toEqual(knobsToControllerItems(["HR", "contractility"]));
  });

  it("accepts a well-formed CaseExposedController fixture", () => {
    const controller: CaseExposedController = {
      items: knobsToControllerItems(["HR"]),
      targetPolicy: "fixedInstance",
      instanceId: "normal",
      defaultOpen: true,
    };

    expect(controller).toEqual({
      items: [expect.objectContaining({ paramKey: "HR", kind: "slider" })],
      targetPolicy: "fixedInstance",
      instanceId: "normal",
      defaultOpen: true,
    });
  });

  it("readingToStudioZones output can be mutated without leaking into the source", () => {
    const panels = [
      panel("waveform", "WAVEFORM", {
        config: { normal: { visible: true, selectedSignals: ["LVP", "AoP"] } },
      }),
    ];

    const studio = readingToStudioZones(panels);
    // mutate the converted output's nested content
    studio[0].config.normal.selectedSignals.push("LAP");
    (studio[0].config.normal as { visible: boolean }).visible = false;

    // source must be untouched (deep clone, not aliased)
    expect(panels[0].config.normal.selectedSignals).toEqual(["LVP", "AoP"]);
    expect(panels[0].config.normal.visible).toBe(true);
    expect(studio[0].config).not.toBe(panels[0].config);
  });

  it("deriveDefaultReadingColumn keeps array order stable within the same role", () => {
    const panels = [
      panel("pv", "PVLOOP"),
      panel("waveA", "WAVEFORM"),
      panel("note", "NOTE"),
      panel("waveB", "WAVEFORM"),
    ];

    expect(deriveDefaultReadingColumn(panels)).toEqual([
      { kind: "noteRef", noteId: "note" },
      { kind: "paneRef", panelId: "pv", generated: true },
      { kind: "paneRef", panelId: "waveA", generated: true },
      { kind: "paneRef", panelId: "waveB", generated: true },
    ]);
  });

  it("knobControllerMetadata reads the single-source KNOB_LABELS/KNOB_STEPS table", () => {
    for (const key of Object.keys(KNOB_STEPS) as (keyof typeof KNOB_STEPS)[]) {
      const meta = knobControllerMetadata(key);
      expect(meta?.label).toBe(KNOB_LABELS[key]);
      expect(meta?.step).toBe(KNOB_STEPS[key]);
    }
    expect(knobControllerMetadata("baroreflexEnabled")).toBeUndefined();
  });
});

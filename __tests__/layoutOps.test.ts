import { describe, expect, it } from "vitest";
import { addPane, applyPreset, movePane, removePane, resizePane, setPaneSignals } from "@/layoutOps";
import { COMPARE_PRESET, flowPack, LAYOUT_PRESETS } from "@/layoutPresets";
import { roleOf } from "@/paneRole";
import type { PanelDef, PanelType } from "@/types";

function panel(id: string, type: PanelType, w = 4, h = 2): PanelDef {
  return {
    id,
    type,
    title: id,
    w,
    h,
    config: { heart: { visible: true, selectedSignals: ["LVP"] } },
    isSettingsOpen: false,
  };
}

describe("pane roles", () => {
  it("maps panel types into mobile/preset roles", () => {
    expect(roleOf("WAVEFORM")).toBe("graph");
    expect(roleOf("PVLOOP")).toBe("graph");
    expect(roleOf("GUYTON_3D")).toBe("graph");
    expect(roleOf("METRICS")).toBe("output");
    expect(roleOf("CONTROLS")).toBe("control");
    expect(roleOf("NOTE")).toBe("note");
  });
});

describe("layout presets and flowPack", () => {
  it("exports role-tagged Read/Compare/Tweak/Focus presets with complete geometry", () => {
    expect(Object.keys(LAYOUT_PRESETS)).toEqual(["Read", "Compare", "Tweak", "Focus"]);
    for (const preset of Object.values(LAYOUT_PRESETS)) {
      expect(preset.length).toBeGreaterThan(0);
      for (const pane of preset) {
        expect(pane.role).toBe(roleOf(pane.type));
        expect(Number.isInteger(pane.x)).toBe(true);
        expect(Number.isInteger(pane.y)).toBe(true);
        expect(pane.w).toBeGreaterThan(0);
        expect(pane.h).toBeGreaterThan(0);
        expect((pane.x ?? 0) + pane.w).toBeLessThanOrEqual(12);
      }
    }
  });

  it("flow-packs legacy ordered panels without mutating the input", () => {
    const legacy = [panel("a", "NOTE", 4, 2), panel("b", "WAVEFORM", 8, 2), panel("c", "METRICS", 4, 1)];
    const packed = flowPack(legacy);

    expect(legacy.every((entry) => entry.x === undefined && entry.role === undefined)).toBe(true);
    expect(packed.map((entry) => [entry.id, entry.x, entry.y, entry.role])).toEqual([
      ["a", 0, 0, "note"],
      ["b", 4, 0, "graph"],
      ["c", 0, 2, "output"],
    ]);
  });

  it("flow-packs around existing explicit geometry", () => {
    const packed = flowPack([
      { ...panel("fixed", "WAVEFORM", 6, 2), x: 0, y: 0 },
      panel("next", "PVLOOP", 6, 2),
      panel("wrap", "METRICS", 4, 1),
    ]);

    expect(packed.map((entry) => [entry.id, entry.x, entry.y])).toEqual([
      ["fixed", 0, 0],
      ["next", 6, 0],
      ["wrap", 0, 2],
    ]);
  });
});

describe("layout ops", () => {
  it("applyPreset replaces the doc with a cloned, flow-packed preset", () => {
    const applied = applyPreset([panel("old", "NOTE")], COMPARE_PRESET);
    expect(applied.map((entry) => entry.id)).toEqual(COMPARE_PRESET.map((entry) => entry.id));
    expect(applied).toEqual(COMPARE_PRESET);
    expect(applied).not.toBe(COMPARE_PRESET);
  });

  it("add/remove/move/resize are pure panel-document transforms", () => {
    const start = flowPack([panel("a", "NOTE"), panel("b", "WAVEFORM")]);
    const added = addPane(start, panel("c", "CONTROLS", 3, 2));
    const moved = movePane(added, "c", 6.8, 3.2);
    const resized = resizePane(moved, "c", 5.9, 4.1);
    const removed = removePane(resized, "a");

    expect(start.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(added.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(moved.find((entry) => entry.id === "c")).toMatchObject({ x: 6, y: 3 });
    expect(resized.find((entry) => entry.id === "c")).toMatchObject({ w: 5, h: 4 });
    expect(removed.map((entry) => entry.id)).toEqual(["b", "c"]);
  });

  it("setPaneSignals immutably updates pane content for one instance", () => {
    const start = flowPack([panel("wave", "WAVEFORM")]);
    const updated = setPaneSignals(start, "wave", "heart", ["AoP", "LAP"]);

    expect(updated[0].config.heart.selectedSignals).toEqual(["AoP", "LAP"]);
    expect(start[0].config.heart.selectedSignals).toEqual(["LVP"]);
    expect(updated[0].config.heart).not.toBe(start[0].config.heart);
  });
});

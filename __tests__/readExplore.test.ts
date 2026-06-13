import { describe, expect, it } from "vitest";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import { canUseReadExplore, deriveReadExploreEntryMode, hasCaseReadingContent, switchReadExplorePresentation } from "@/features/workbench/readExplore";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef } from "@/types";

function panel(id: string, type: PanelDef["type"] = "WAVEFORM"): PanelDef {
  return {
    id,
    type,
    title: id,
    w: 4,
    h: 4,
    config: {},
    isSettingsOpen: false,
  };
}

function note(text: string): NoteContent {
  return [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }];
}

function caseDoc(extras: Partial<CaseDocument> = {}): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: { id: "case", title: "Case", createdAt: 0, updatedAt: 0 },
    spec: { modelLimitations: ["test"] },
    instances: [],
    panels: [panel("wave")],
    ...extras,
  };
}

describe("Read/Explore entry derivation", () => {
  it("opens read-only shared cases with explicit reading in Reading", () => {
    const doc = caseDoc({
      notes: { intro: note("Intro") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    });

    expect(hasCaseReadingContent(doc)).toBe(true);
    expect(canUseReadExplore(doc)).toBe(true);
    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("read");
  });

  it("opens read-only shared cases with non-empty notes in Reading", () => {
    const doc = caseDoc({
      panels: [panel("note", "NOTE"), panel("wave")],
      notes: { note: note("A useful reading note") },
    });

    expect(hasCaseReadingContent(doc)).toBe(true);
    expect(canUseReadExplore(doc)).toBe(true);
    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("read");
  });

  it("opens cases without reading content in Explore and leaves authoring cases in Explore", () => {
    const doc = caseDoc({ notes: { empty: note("   ") } });

    expect(hasCaseReadingContent(doc)).toBe(false);
    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("explore");
    expect(deriveReadExploreEntryMode(caseDoc({ reading: { schemaVersion: 1, column: [{ kind: "paneRef", panelId: "wave" }] } }), { readOnly: false })).toBe("explore");
  });

  it("honors defaultEntry read when reading is available", () => {
    const doc = caseDoc({
      defaultEntry: "read",
      notes: { intro: note("Intro") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    });

    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("read");
  });

  it("falls back to Explore for defaultEntry read when reading is unavailable", () => {
    const doc = caseDoc({
      defaultEntry: "read",
      notes: { empty: note("   ") },
    });

    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("explore");
  });

  it("honors defaultEntry explore even when reading is available", () => {
    const doc = caseDoc({
      defaultEntry: "explore",
      notes: { intro: note("Intro") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    });

    expect(deriveReadExploreEntryMode(doc, { readOnly: true })).toBe("explore");
  });

  it("keeps undefined defaultEntry behavior derived from reading availability", () => {
    const readable = caseDoc({
      notes: { intro: note("Intro") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    });
    const unreadable = caseDoc({ notes: { empty: note("   ") } });

    expect(deriveReadExploreEntryMode(readable, { readOnly: true })).toBe("read");
    expect(deriveReadExploreEntryMode(unreadable, { readOnly: true })).toBe("explore");
  });
});

describe("Read/Explore runtime carry", () => {
  it("changes only the presentation flag and preserves runtime/layout references", () => {
    const runtime = {
      instances: [{ id: "a", params: { heartRate: 77 } }],
      activeScenarioId: "a",
      visibility: { a: true },
      controller: { seededAt: 1 },
    };
    const layout = { mainSize: 640, rightRailVisible: true };
    const state = { presentation: "read" as const, runtime, layout };

    const next = switchReadExplorePresentation(state, "explore");

    expect(next).toEqual({ presentation: "explore", runtime, layout });
    expect(next.runtime).toBe(runtime);
    expect(next.layout).toBe(layout);
    expect(next.runtime.controller).toBe(runtime.controller);
  });
});

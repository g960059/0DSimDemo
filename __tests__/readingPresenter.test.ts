import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import type { Lesson } from "@/lessonDoc";
import { deriveDefaultReadingColumn, resolveReadingColumn } from "@/readingConversion";
import { ReadingColumn } from "@/components/reading/ReadingColumn";
import { shouldUseReading } from "@/components/reading/LessonReadingRoute";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef } from "@/types";

vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  return {
    NotePanel: ({ content }: { content?: NoteContent }) => React.createElement("div", { "data-note-panel-stub": "true" }, JSON.stringify(content ?? [])),
  };
});

function panel(id: string, type: PanelDef["type"], extras: Partial<PanelDef> = {}): PanelDef {
  return {
    id,
    type,
    title: id,
    w: 4,
    h: 4,
    config: {},
    isSettingsOpen: false,
    ...extras,
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
    panels: [panel("wave", "WAVEFORM")],
    ...extras,
  };
}

function lesson(extras: Partial<Lesson> = {}): Lesson {
  return {
    meta: { id: "lesson", title: "Lesson" },
    noteSpine: [],
    ...extras,
  };
}

describe("resolveReadingColumn", () => {
  it("preserves explicit reading column order", () => {
    const doc = caseDoc({
      panels: [panel("wave", "WAVEFORM"), panel("metrics", "METRICS")],
      notes: { intro: note("Intro note") },
      reading: {
        schemaVersion: 1,
        column: [
          { kind: "paneRef", panelId: "metrics" },
          { kind: "noteRef", noteId: "intro" },
          { kind: "paneRef", panelId: "wave" },
        ],
      },
    });

    expect(resolveReadingColumn(doc)).toEqual({
      column: [
        { kind: "paneRef", panelId: "metrics" },
        { kind: "noteRef", noteId: "intro" },
        { kind: "paneRef", panelId: "wave" },
      ],
    });
  });

  it("derives the default reading column when no reading manifest is present", () => {
    const panels = [panel("controls", "CONTROLS"), panel("wave", "WAVEFORM"), panel("metrics", "METRICS")];
    const doc = caseDoc({ panels });

    expect(resolveReadingColumn(doc)).toEqual({ column: deriveDefaultReadingColumn(panels) });
  });

  it("excludes non-reading-renderable panes from a derived default column", () => {
    const doc = caseDoc({
      panels: [
        panel("scenario", "SCENARIOS"),
        panel("wave", "WAVEFORM"),
        panel("controls", "CONTROLS"),
      ],
    });

    expect(resolveReadingColumn(doc)).toEqual({
      column: [
        { kind: "paneRef", panelId: "wave", generated: true },
        { kind: "paneRef", panelId: "controls", generated: true },
      ],
    });
  });

  it("falls back for explicit reading columns with unsupported pane refs", () => {
    expect(resolveReadingColumn(caseDoc({
      panels: [panel("scenario", "SCENARIOS")],
      reading: { schemaVersion: 1, column: [{ kind: "paneRef", panelId: "scenario" }] },
    }))).toEqual({ fallback: "unsupported_pane" });
  });

  it("returns fallback reasons for missing pane refs and empty panels", () => {
    expect(resolveReadingColumn(caseDoc({
      panels: [panel("wave", "WAVEFORM")],
      reading: { schemaVersion: 1, column: [{ kind: "paneRef", panelId: "missing" }] },
    }))).toEqual({ fallback: "missing_panel" });

    expect(resolveReadingColumn(caseDoc({ panels: [] }))).toEqual({ fallback: "empty_panels" });
  });

  it("returns a fallback reason for missing note refs", () => {
    expect(resolveReadingColumn(caseDoc({
      panels: [panel("wave", "WAVEFORM")],
      notes: {},
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "missing-note" }] },
    }))).toEqual({ fallback: "missing_note" });
  });
});

describe("shouldUseReading", () => {
  it("allows stepless lessons with a valid case", () => {
    expect(shouldUseReading(lesson(), caseDoc())).toBe(true);
  });

  it("rejects stepped lessons and cases with no panels", () => {
    expect(shouldUseReading(lesson({
      steps: [{ id: "step", note: [], stage: { visibleInstances: [] } }],
    }), caseDoc())).toBe(false);

    expect(shouldUseReading(lesson(), caseDoc({ panels: [] }))).toBe(false);
  });
});

describe("ReadingColumn", () => {
  it("SSR-renders entries in column order and expands the first controller", () => {
    const panels = [
      panel("wave", "WAVEFORM", { title: "Wave Marker" }),
      panel("controlsA", "CONTROLS", { title: "Controls A" }),
      panel("controlsB", "CONTROLS", { title: "Controls B" }),
    ];
    const html = renderToString(React.createElement(ReadingColumn, {
      column: [
        { kind: "noteRef", noteId: "intro" },
        { kind: "paneRef", panelId: "wave" },
        { kind: "paneRef", panelId: "controlsA" },
        { kind: "paneRef", panelId: "controlsB" },
      ],
      panels,
      notes: { intro: note("First note text") },
      paneCtx: {
        instances: [],
        physicsRefs: { current: new Map() },
        activeInstanceId: "",
        updateInstanceParams: () => {},
        updateInstanceKnobs: () => {},
        updateInstanceVolume: () => {},
      },
    }));

    expect(html.indexOf("First note text")).toBeLessThan(html.indexOf("Wave Marker"));
    expect(html.indexOf("Wave Marker")).toBeLessThan(html.indexOf("Controls A"));
    expect(html.indexOf("Controls A")).toBeLessThan(html.indexOf("Controls B"));
    expect(html).toContain("Hide controls");
    expect(html).toContain("Adjust the model");
  });
});

describe("NotePanel bare read rendering", () => {
  it("SSR-renders bare read notes without card chrome while non-bare read keeps it", async () => {
    const { NotePanel: RealNotePanel } = await vi.importActual<typeof import("@/components/NotePanel")>("@/components/NotePanel");

    const bareHtml = renderToString(React.createElement(RealNotePanel, {
      mode: "read",
      bare: true,
      content: note("Bare note text"),
    }));
    const boxedHtml = renderToString(React.createElement(RealNotePanel, {
      mode: "read",
      content: note("Boxed note text"),
    }));

    expect(bareHtml).not.toContain("bg-[#0B1120]");
    expect(bareHtml).not.toContain("rounded-b-xl");
    expect(boxedHtml).toContain("bg-[#0B1120]");
    expect(boxedHtml).toContain("rounded-b-xl");
  });
});

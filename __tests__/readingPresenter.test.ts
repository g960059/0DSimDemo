import React from "react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/i18n";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import type { Lesson } from "@/lessonDoc";
import { deriveDefaultReadingColumn, resolveReadingColumn } from "@/readingConversion";
import { ReadingPresenter } from "@/components/reading/ReadingPresenter";
import { ReadingColumn } from "@/components/reading/ReadingColumn";
import { ReadingPaneCard } from "@/components/reading/ReadingPaneCard";
import { shouldUseReading } from "@/components/reading/LessonReadingRoute";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef } from "@/types";

vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  const textOf = (content: unknown): string => {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    return content.map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      const inline = item as { type?: unknown; text?: unknown; content?: unknown };
      if (inline.type === "text" && typeof inline.text === "string") return inline.text;
      return textOf(inline.content);
    }).join("");
  };
  return {
    deriveHeadingAnchors: (content: NoteContent) => {
      const seen = new Map<string, number>();
      return (content ?? []).filter((block) => block.type === "heading").map((block) => {
        const text = textOf(block.content);
        const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
        const count = (seen.get(baseId) ?? 0) + 1;
        seen.set(baseId, count);
        return {
          id: count === 1 ? baseId : `${baseId}-${count}`,
          text,
          level: 1,
        };
      });
    },
    NotePanel: ({ content }: { content?: NoteContent }) => React.createElement("div", { "data-note-panel-stub": "true" }, JSON.stringify(content ?? [])),
  };
});

beforeAll(async () => {
  await i18n.changeLanguage("en");
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

function readingRuntime() {
  return {
    instances: [],
    physicsRefs: { current: new Map() },
    activeInstanceId: "",
    updateInstanceParams: () => {},
    updateInstanceKnobs: () => {},
    updateInstanceVolume: () => {},
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

  it("renders reading manifest view refs through authored views and dangling placeholders", () => {
    const html = renderToString(React.createElement(ReadingColumn, {
      column: [
        { kind: "viewRef", viewId: "controller-a" },
        { kind: "viewRef", viewId: "missing-view" },
      ],
      panels: [],
      notes: {},
      paneCtx: {
        instances: [],
        physicsRefs: { current: new Map() },
        activeInstanceId: "",
        updateInstanceParams: () => {},
        updateInstanceKnobs: () => {},
        updateInstanceVolume: () => {},
        authoredViews: [
          { id: "controller-a", title: "Curated Controller", kind: "controller", items: [], binding: { slot: "active" } },
        ],
      },
    }));

    expect(html).toContain("Curated Controller");
    expect(html).toContain(i18n.t("notes.viewRef.missingTitle"));
    expect(html).toContain("missing-view");
  });
});

describe("ReadingPaneCard", () => {
  it("renders semantic figure chrome with title figcaption and type-aware sizing", () => {
    const html = renderToString(React.createElement(ReadingPaneCard, {
      panel: panel("pv", "PVLOOP", { title: "PV Loop" }),
      title: "PV Loop",
      children: React.createElement("div", null, "chart"),
    }));

    expect(html).toContain("<figure");
    expect(html).toContain("<figcaption");
    expect(html).toContain("PV Loop");
    expect(html).not.toContain("Figure:");
    expect(html).toContain("relative h-[380px] sm:h-[460px]");
  });

  it("uses waveform bleed and height classes", () => {
    const html = renderToString(React.createElement(ReadingPaneCard, {
      panel: panel("wave", "WAVEFORM", { title: "Waveforms" }),
      title: "Waveforms",
      children: React.createElement("div", null, "chart"),
    }));

    expect(html).toContain("sm:-mx-8");
    expect(html).toContain("relative h-[320px] sm:h-[360px]");
  });
});

describe("ReadingPresenter chrome", () => {
  it("renders title/meta/TOC in a centered article shell", () => {
    const doc = caseDoc({
      panels: [panel("controls", "CONTROLS")],
      notes: {
        intro: [
          { type: "heading", content: [{ type: "text", text: "First Heading", styles: {} }] },
          { type: "heading", content: [{ type: "text", text: "First Heading", styles: {} }] },
        ],
      },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    });

    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(ReadingPresenter, {
      lessonTitle: "Reading Title",
      lessonLevel: "Beginner",
      objective: "Read the figures.",
      caseDoc: doc,
      column: doc.reading!.column,
      runtime: readingRuntime(),
    })));

    expect(html).toContain("max-w-[860px]");
    expect(html).toContain("text-3xl font-bold text-wb-text sm:text-[34px]");
    expect(html).toContain("Beginner");
    expect(html).toContain("min read");
    expect(html).toContain(i18n.t("reading.interactive"));
    expect(html).toContain(i18n.t("reading.tableOfContents"));
    expect(html).toContain('href="#first-heading"');
    expect(html).toContain('href="#first-heading-2"');
    expect(html).toContain("h-0.5 bg-wb-accent");
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
    expect(boxedHtml).toContain("bg-wb-aux");
    expect(boxedHtml).toContain("rounded-b-xl");
  });
});

import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import { deriveHeadingAnchors } from "@/components/NotePanel";
import { ReadingPresenter } from "@/components/reading/ReadingPresenter";
import type { NoteContent } from "@/noteTypes";

vi.mock("@blocknote/mantine", async () => {
  const React = await import("react");
  return {
    BlockNoteView: () => React.createElement("div", { "data-blocknote-view": "true" }),
  };
});

vi.mock("@blocknote/react", () => ({
  createReactBlockSpec: () => () => ({}),
  getDefaultReactSlashMenuItems: () => [],
  SuggestionMenuController: () => null,
  useCreateBlockNote: () => ({ document: [] }),
}));

vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: () => ({}) },
  defaultBlockSpecs: {},
}));

vi.mock("@blocknote/core/extensions", () => ({
  filterSuggestionItems: (items: unknown[]) => items,
  insertOrUpdateBlockForSlashMenu: () => ({}),
}));

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

function heading(text: string, children: NoteContent = []): Record<string, unknown> {
  return {
    type: "heading",
    content: [{ type: "text", text, styles: {} }],
    children,
  };
}

function caseDoc(notes: Record<string, NoteContent>): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: { id: "case", title: "Case", createdAt: 0, updatedAt: 0 },
    spec: { modelLimitations: ["test"] },
    instances: [],
    panels: [],
    notes,
  };
}

function matches(pattern: RegExp, html: string): string[] {
  return [...html.matchAll(pattern)].map((match) => match[1]);
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

describe("ReadingPresenter with the real NotePanel static renderer", () => {
  it("renders every TOC href with a matching article heading id, including nested duplicates", () => {
    const note: NoteContent = [
      heading("Flow", [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Nested body", styles: {} }],
          children: [heading("Flow")],
        },
      ]),
      heading("Valve"),
      heading("Flow"),
    ];
    const doc = caseDoc({ intro: note });

    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(ReadingPresenter, {
      lessonTitle: "Real TOC",
      caseDoc: doc,
      column: [{ kind: "noteRef", noteId: "intro" }],
      runtime: readingRuntime(),
    })));

    const expectedIds = deriveHeadingAnchors(note).map((anchor) => anchor.id);
    const tocIds = matches(/href="#([^"]+)"/g, html);
    const renderedHeadingIds = matches(/<h[1-3][^>]* id="([^"]+)"/g, html);

    expect(expectedIds).toEqual(["flow", "flow-2", "valve", "flow-3"]);
    expect(tocIds).toEqual(expectedIds);
    expect(renderedHeadingIds).toEqual(expectedIds);
    expect(tocIds.every((id) => renderedHeadingIds.includes(id))).toBe(true);
  });

  it("renders note view_ref blocks against authored views and leaves dangling refs as placeholders", () => {
    const doc = {
      ...caseDoc({
        intro: [
          { type: "view_ref", props: { viewId: "controller-a" } },
          { type: "view_ref", props: { viewId: "missing-view" } },
        ],
      }),
      views: [
        { id: "controller-a", title: "Inline Controller", kind: "controller" as const, items: [], binding: { kind: "active" as const } },
      ],
    };

    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(ReadingPresenter, {
      lessonTitle: "View refs",
      caseDoc: doc,
      column: [{ kind: "noteRef", noteId: "intro" }],
      runtime: readingRuntime(),
    })));

    expect(html).toContain("Inline Controller");
    expect(html).toContain("Referenced view unavailable");
    expect(html).toContain("missing-view");
  });
});

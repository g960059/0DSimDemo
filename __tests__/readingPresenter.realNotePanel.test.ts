import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
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
  useCreateBlockNote: () => ({ document: [] }),
}));

vi.mock("@blocknote/core", () => ({
  BlockNoteSchema: { create: () => ({}) },
  defaultBlockSpecs: {},
}));

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
    })));

    const expectedIds = deriveHeadingAnchors(note).map((anchor) => anchor.id);
    const tocIds = matches(/href="#([^"]+)"/g, html);
    const renderedHeadingIds = matches(/<h[1-3][^>]* id="([^"]+)"/g, html);

    expect(expectedIds).toEqual(["flow", "flow-2", "valve", "flow-3"]);
    expect(tocIds).toEqual(expectedIds);
    expect(renderedHeadingIds).toEqual(expectedIds);
    expect(tocIds.every((id) => renderedHeadingIds.includes(id))).toBe(true);
  });
});

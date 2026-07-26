import { describe, expect, it } from "vitest";
import { collectNoteViewRefIds, remapNoteViewRefIds, viewRefUsageForDeletion } from "@/features/workbench/noteViewRefs";
import type { CaseDocument, CaseI18nContent } from "@/caseDoc";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION } from "@/caseDoc";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import type { NoteContent } from "@/noteTypes";

function viewRef(viewId: string, children: NoteContent = []): Record<string, unknown> {
  return { type: "view_ref", props: { viewId }, children };
}

describe("note view_ref helpers", () => {
  it("collects, scans deletion usage, and remaps nested view_ref blocks", () => {
    const notes: Record<string, NoteContent> = {
      intro: [
        { type: "paragraph", children: [viewRef("controller-a")] },
        viewRef("metrics-a"),
      ],
      other: [viewRef("controller-a")],
    };

    expect([...collectNoteViewRefIds(notes)].sort()).toEqual(["controller-a", "metrics-a"]);
    expect(viewRefUsageForDeletion("controller-a", notes, {
      schemaVersion: 1,
      column: [{ kind: "viewRef", viewId: "controller-a" }],
    })).toEqual({ notes: ["intro", "other"], reading: true });

    expect(remapNoteViewRefIds(notes, new Map([["controller-a", "controller-b"]]))?.intro).toEqual([
      { type: "paragraph", children: [viewRef("controller-b")] },
      viewRef("metrics-a"),
    ]);
  });

});

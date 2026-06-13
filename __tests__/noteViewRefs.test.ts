import { describe, expect, it } from "vitest";
import { remapCaseDocumentViewIds, remapCaseI18nContentIds } from "@/workbenchLoad";
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

  it("remaps document, reading manifest, and localized note view refs on load", () => {
    const doc: CaseDocument = {
      schemaVersion: CASE_SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      knobMappingVersion: KNOB_MAPPING_VERSION,
      solver: DEFAULT_SOLVER,
      meta: { id: "case", title: "Case", createdAt: 0, updatedAt: 0 },
      spec: { modelLimitations: ["test"] },
      instances: [],
      panels: [],
      notes: { intro: [viewRef("old-view")] },
      reading: { schemaVersion: 1, column: [{ kind: "viewRef", viewId: "old-view" }] },
      views: [{ id: "old-view", title: "Old", kind: "controller", items: [], binding: { kind: "active" } }],
    };
    const viewIdMap = new Map([["old-view", "new-view"]]);

    expect(remapCaseDocumentViewIds(doc, {
      instanceIdMap: new Map(),
      viewIdMap,
    })).toMatchObject({
      notes: { intro: [viewRef("new-view")] },
      reading: { column: [{ kind: "viewRef", viewId: "new-view" }] },
      views: [{ id: "new-view" }],
    });

    const i18n: Record<string, CaseI18nContent> = {
      ja: { notes: { intro: [viewRef("old-view")] } },
    };
    expect(remapCaseI18nContentIds(i18n, {
      instanceIdMap: new Map(),
      viewIdMap,
    })?.ja.notes?.intro).toEqual([viewRef("new-view")]);
  });
});

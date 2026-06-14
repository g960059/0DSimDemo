import { describe, expect, it } from "vitest";
import { simInstancesToCaseDocument, type CaseDocument } from "@/caseDoc";
import { DEFAULT_PARAMS } from "@/constants";
import {
  deriveInitialPublishDialogDraft,
  derivePublishDialogState,
} from "@/features/workbench/publish/publishDialogState";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef, SimInstance } from "@/types";

const instance: SimInstance = {
  id: "s1",
  name: "Scenario 1",
  color: "#38bdf8",
  params: { ...DEFAULT_PARAMS },
  targetVolume: 5600,
  isVisible: true,
};

function note(text: string): NoteContent {
  return [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }];
}

function notePanel(id = "note"): PanelDef {
  return {
    id,
    type: "NOTE",
    title: "Note",
    w: 4,
    h: 4,
    config: {},
    view: { kind: "note", noteId: id },
    isSettingsOpen: false,
  };
}

function doc(overrides: Partial<CaseDocument> = {}): CaseDocument {
  return {
    ...simInstancesToCaseDocument([instance], [notePanel()], {
      id: "publish-dialog",
      title: "Publish dialog",
      createdAt: 1,
      updatedAt: 2,
      spec: { title: "Publish dialog", modelLimitations: ["0D model."] },
      notes: { note: note("Reader note") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "note" }] },
      initialActiveScenarioId: "s1",
    }),
    ...overrides,
  };
}

describe("publishDialogState", () => {
  it("defaults visibility from the current published document", () => {
    expect(deriveInitialPublishDialogDraft(doc(), { status: "published", visibility: "public" }).visibility).toBe("public");
    expect(deriveInitialPublishDialogDraft(doc(), { status: "draft", visibility: "public" }).visibility).toBe("unlisted");
  });

  it("defaults entry from doc.defaultEntry before deriving", () => {
    expect(deriveInitialPublishDialogDraft(doc({ defaultEntry: "explore" })).defaultEntry).toBe("explore");
    expect(deriveInitialPublishDialogDraft(doc()).defaultEntry).toBe("read");
  });

  it("disables Read when reading content is unavailable", () => {
    const state = derivePublishDialogState(doc({ notes: {}, reading: undefined, defaultEntry: "read" }), {
      visibility: "unlisted",
      defaultEntry: "read",
    });

    expect(state.readDisabled).toBe(true);
    expect(state.draft.defaultEntry).toBe("explore");
    expect(state.reviewEnabled).toBe(true);
  });

  it("keeps Review enabled with blockers and validates the draft-applied doc", () => {
    const baseDoc = doc({ spec: { title: "", modelLimitations: ["0D model."] } });
    const state = derivePublishDialogState({
      ...baseDoc,
      meta: { ...baseDoc.meta, title: "" },
    }, {
      visibility: "public",
      defaultEntry: "read",
    });

    expect(state.reviewEnabled).toBe(true);
    expect(state.reviewDoc.status).toBe("published");
    expect(state.reviewDoc.visibility).toBe("public");
    expect(state.blockers.map((issue) => issue.code)).toContain("publish.blocker.missing-title");
  });
});

import { describe, expect, it } from "vitest";
import {
  caseDocFields,
  caseDocumentWithTrustedCloudFields,
  docContentToCaseDocument,
} from "@/caseCloud";
import { parseCaseDocument, serializeCaseDocument } from "@/casePersist";
import { simInstancesToCaseDocument, type CaseDocument } from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import {
  applyPublishDraft,
  derivePublishDefaultEntry,
  isPublishable,
  validatePublishableCase,
  type PublishIssue,
} from "@/features/workbench/casePublish";
import { officialCaseById } from "@/officialCases";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef, SimInstance } from "@/types";

const baseParams = defaultParams();
const knobs = neutralKnobs(baseParams);
const instance: SimInstance = {
  id: "s1",
  name: "Scenario 1",
  color: "#38bdf8",
  isVisible: true,
  knobBaseline: baseParams,
  knobs,
  params: applyKnobs(baseParams, knobs, KNOB_MAPPING_VERSION),
  targetVolume: 5600,
};

function note(text: string): NoteContent {
  return [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }];
}

function notePanel(id = "p_note", noteId = "intro"): PanelDef {
  return {
    id,
    type: "NOTE",
    title: "Note",
    w: 4,
    h: 4,
    config: {},
    view: { kind: "note", noteId },
    isSettingsOpen: false,
  };
}

function graphPanel(id = "p_graph"): PanelDef {
  return {
    id,
    type: "WAVEFORM",
    title: "Waveform",
    w: 6,
    h: 4,
    config: { s1: { visible: true, selectedSignals: ["AoP"] } },
    isSettingsOpen: false,
  };
}

function cleanDoc(overrides: Partial<CaseDocument> = {}): CaseDocument {
  return {
    ...simInstancesToCaseDocument([instance], [notePanel()], {
      id: "publish-case",
      title: "Publishable case",
      createdAt: 1,
      updatedAt: 2,
      spec: { title: "Publishable case", modelLimitations: ["0D model."] },
      initialActiveScenarioId: "s1",
      notes: { intro: note("Reader note") },
      reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "intro" }] },
    }),
    ...overrides,
  };
}

function codes(issues: PublishIssue[]): string[] {
  return issues.map((issue) => issue.code);
}

// Asserts the EXACT set of blocker-severity codes (deduped). Incidental warnings are
// tolerated — isolation that matters for a referential-integrity validator is that no
// OTHER blocker leaks in alongside the one under test.
function expectBlockers(doc: CaseDocument, expected: string[]): void {
  const blockers = [...new Set(
    validatePublishableCase(doc).filter((i) => i.severity === "blocker").map((i) => i.code),
  )].sort();
  expect(blockers).toEqual([...expected].sort());
}

// Asserts a warning code is present and NO blocker fired (the doc is publishable).
function expectWarningOnly(doc: CaseDocument, code: string): void {
  const issues = validatePublishableCase(doc);
  expect(codes(issues)).toContain(code);
  expect(issues.some((i) => i.severity === "blocker")).toBe(false);
}

describe("validatePublishableCase", () => {
  it("returns no issues for a clean crafted case", () => {
    const doc = cleanDoc();

    expect(validatePublishableCase(doc)).toEqual([]);
  });

  it("returns no issues for the clean afterload official case", () => {
    expect(validatePublishableCase(officialCaseById("afterload-acute-hypertension")!)).toEqual([]);
  });

  it("reports missing title", () => {
    expectBlockers(cleanDoc({ meta: { ...cleanDoc().meta, title: "   " } }), ["publish.blocker.missing-title"]);
  });

  it("reports missing scenarios", () => {
    // drop initialActiveScenarioId too, else it would also dangle — isolate no-scenarios
    expectBlockers(cleanDoc({ instances: [], initialActiveScenarioId: undefined }), ["publish.blocker.no-scenarios"]);
  });

  it("reports dangling initial active scenario", () => {
    expectBlockers(cleanDoc({ initialActiveScenarioId: "missing" }), ["publish.blocker.dangling-initial-active"]);
  });

  it("reports invalid graph board layout — missing layout", () => {
    expectBlockers(cleanDoc({ panels: [notePanel(), graphPanel()], graphBoardLayout: undefined }), ["publish.blocker.invalid-graph-layout"]);
  });

  it("reports invalid graph board layout — leaf not a graph panel id", () => {
    expectBlockers(cleanDoc({
      panels: [notePanel(), graphPanel("p_graph")],
      graphBoardLayout: { type: "leaf", graphViewId: "missing-panel" },
    }), ["publish.blocker.invalid-graph-layout"]);
  });

  it("reports invalid graph board layout — duplicate leaves", () => {
    expectBlockers(cleanDoc({
      panels: [notePanel(), graphPanel("p_graph")],
      graphBoardLayout: {
        type: "split",
        direction: "row",
        children: [
          { type: "leaf", graphViewId: "p_graph" },
          { type: "leaf", graphViewId: "p_graph" },
        ],
        sizes: [1, 1],
      },
    }), ["publish.blocker.invalid-graph-layout"]);
  });

  it("reports dangling reading references", () => {
    expectBlockers(cleanDoc({
      reading: {
        schemaVersion: 1,
        column: [
          { kind: "noteRef", noteId: "missing-note" },
          { kind: "paneRef", panelId: "missing-panel" },
          { kind: "viewRef", viewId: "missing-view" },
        ],
      },
    }), ["publish.blocker.dangling-reading-ref"]);
  });

  it("reports dangling note view references", () => {
    expectBlockers(cleanDoc({
      notes: { intro: [{ type: "view_ref", props: { viewId: "missing-view" } }] as NoteContent },
    }), ["publish.blocker.dangling-note-view-ref"]);
  });

  it("reports dangling controller pins", () => {
    expectBlockers(cleanDoc({
      views: [{
        id: "controls",
        title: "Controls",
        kind: "controller",
        items: [{ kind: "slider", paramKey: "HR" }],
        binding: { kind: "scenario", scenarioId: "missing" },
      }],
    }), ["publish.blocker.dangling-controller-pin"]);
  });

  it("reports dangling metrics memberships", () => {
    expectBlockers(cleanDoc({
      views: [{
        id: "metrics",
        title: "Metrics",
        kind: "metrics",
        metrics: ["ABP"],
        membership: { missing: ["ABP"] },
      }],
    }), ["publish.blocker.dangling-membership"]);
  });

  it("reports dangling graph-view memberships", () => {
    expectBlockers(cleanDoc({
      views: [{
        id: "graph",
        title: "Graph",
        kind: "graph",
        graphType: "waveform",
        membership: { missing: ["AoP"] },
      }],
    }), ["publish.blocker.dangling-membership"]);
  });

  it("reports missing reading content as a warning", () => {
    expectWarningOnly(cleanDoc({ notes: undefined, reading: undefined }), "publish.warning.no-reading-content");
  });

  it("reports hidden initial active scenario as a warning", () => {
    expectWarningOnly(cleanDoc({
      instances: [{ ...cleanDoc().instances[0], isVisible: false }],
    }), "publish.warning.active-scenario-hidden");
  });

  it("reports an empty metrics view as a warning", () => {
    expectWarningOnly(cleanDoc({
      views: [{ id: "metrics", title: "Metrics", kind: "metrics", metrics: [], membership: {} }],
    }), "publish.warning.empty-view");
  });

  it("reports an empty controller view as a warning", () => {
    expectWarningOnly(cleanDoc({
      views: [{ id: "controls", title: "Controls", kind: "controller", items: [], binding: { kind: "active" } }],
    }), "publish.warning.empty-view");
  });

  it("reports empty model limitations as a warning", () => {
    expectWarningOnly(cleanDoc({ spec: { title: "Publishable case", modelLimitations: ["  "] } }), "publish.warning.model-limitations-empty");
  });

  it("reports pinned controller bindings as a warning", () => {
    expectWarningOnly(cleanDoc({
      views: [{
        id: "controls",
        title: "Controls",
        kind: "controller",
        items: [{ kind: "slider", paramKey: "HR" }],
        binding: { kind: "scenario", scenarioId: "s1" },
      }],
    }), "publish.warning.pinned-binding-used");
  });

  it("treats blockers as unpublishable and warnings-only as publishable", () => {
    expect(isPublishable(validatePublishableCase(cleanDoc({ meta: { ...cleanDoc().meta, title: "" } })))).toBe(false);
    expect(isPublishable(validatePublishableCase(cleanDoc({ notes: undefined, reading: undefined })))).toBe(true);
  });
});

describe("publish defaults and draft transition", () => {
  it("derives read for docs with usable note content and explore without notes", () => {
    expect(derivePublishDefaultEntry(cleanDoc())).toBe("read");
    expect(derivePublishDefaultEntry(cleanDoc({ panels: [], notes: undefined, reading: undefined }))).toBe("explore");
  });

  it("omits defaultEntry when the draft matches the derived default", () => {
    const doc = cleanDoc();
    const published = applyPublishDraft(doc, { status: "published", visibility: "public", defaultEntry: "read" });
    const republished = applyPublishDraft(published, { status: "published", visibility: "public", defaultEntry: "read" });

    expect(published.status).toBe("published");
    expect(published.visibility).toBe("public");
    expect(published.defaultEntry).toBeUndefined();
    expect(republished).toEqual(published);
  });

  it("writes an override defaultEntry without mutating the input", () => {
    const doc = cleanDoc();
    const published = applyPublishDraft(doc, { status: "published", visibility: "unlisted", defaultEntry: "explore" });

    expect(published.defaultEntry).toBe("explore");
    expect(published.visibility).toBe("unlisted");
    expect(doc.defaultEntry).toBeUndefined();
    expect(published).not.toBe(doc);
  });
});

describe("defaultEntry persistence", () => {
  it("survives local and cloud content round trips", () => {
    const doc = cleanDoc({ defaultEntry: "explore" });
    const local = parseCaseDocument(serializeCaseDocument(doc));
    const fields = caseDocFields(doc, "u1");
    const parsedCloud = docContentToCaseDocument(fields.content, doc.meta.id);
    const trustedCloud = caseDocumentWithTrustedCloudFields(parsedCloud!, {
      kind: fields.kind,
      status: fields.status,
      visibility: fields.visibility,
      ownerId: fields.ownerId,
    });

    expect(local.defaultEntry).toBe("explore");
    expect(parsedCloud?.defaultEntry).toBe("explore");
    expect(trustedCloud.defaultEntry).toBe("explore");
  });
});

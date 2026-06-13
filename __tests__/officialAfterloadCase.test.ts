import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances, isCaseDisplayable, simInstancesToCaseDocument, type CaseDocument } from "@/caseDoc";
import { collectNoteViewRefIds } from "@/features/workbench/noteViewRefs";
import { deriveReadExploreEntryMode } from "@/features/workbench/readExplore";
import { validateGraphBoardLayout, type GraphBoardLayout } from "@/features/workbench/viewSpec";
import { officialCaseById } from "@/officialCases";

function collectGraphBoardLeafIds(layout: GraphBoardLayout | undefined): string[] {
  if (!layout) return [];
  if (layout.type === "leaf") return [layout.graphViewId];
  return layout.children.flatMap(collectGraphBoardLeafIds);
}

function expectInternalReferencesToResolve(doc: CaseDocument): void {
  const panelIds = new Set(doc.panels.map((panel) => panel.id));
  const noteIds = new Set(Object.keys(doc.notes ?? {}));
  const viewIds = new Set((doc.views ?? []).map((view) => view.id));
  const graphViewIds = new Set((doc.views ?? []).filter((view) => view.kind === "graph").map((view) => view.id));
  const instanceIds = new Set(doc.instances.map((instance) => instance.id));

  for (const entry of doc.reading?.column ?? []) {
    if (entry.kind === "noteRef") expect(noteIds.has(entry.noteId), `reading noteRef ${entry.noteId}`).toBe(true);
    if (entry.kind === "viewRef") expect(viewIds.has(entry.viewId), `reading viewRef ${entry.viewId}`).toBe(true);
    if (entry.kind === "paneRef") expect(panelIds.has(entry.panelId), `reading paneRef ${entry.panelId}`).toBe(true);
  }

  for (const graphViewId of collectGraphBoardLeafIds(doc.graphBoardLayout)) {
    expect(graphViewIds.has(graphViewId), `graphBoardLayout leaf ${graphViewId}`).toBe(true);
  }

  for (const viewId of collectNoteViewRefIds(doc.notes)) {
    expect(viewIds.has(viewId), `note view_ref ${viewId}`).toBe(true);
  }

  for (const view of doc.views ?? []) {
    if (view.kind === "controller") {
      if ("scenarioId" in view.binding) expect(instanceIds.has(view.binding.scenarioId), `controller binding ${view.id}`).toBe(true);
      continue;
    }
    for (const scenarioId of Object.keys(view.membership)) {
      expect(instanceIds.has(scenarioId), `view membership ${view.id}:${scenarioId}`).toBe(true);
    }
  }

  expect(validateGraphBoardLayout(doc.graphBoardLayout, { graphViewIds })).toEqual([]);
}

describe("Afterload official dogfood case", () => {
  it("is a valid ADR-0007 CaseDocument with resolvable reading/view/layout references", () => {
    const doc = officialCaseById("afterload-acute-hypertension");
    expect(doc).toBeDefined();
    expect(doc?.meta.title).toBe("Afterload — normal vs acute hypertension");
    expect(doc && isCaseDisplayable(doc)).toBe(true);

    expect(doc?.instances.map((instance) => [instance.id, instance.name, instance.knobs])).toEqual([
      ["1", "Normal", {}],
      ["2", "Hypertensive", { afterload: 1.6 }],
    ]);
    expect(doc?.views?.map((view) => [view.id, view.kind])).toEqual([
      ["v_afterload_demo_controls", "controller"],
      ["v_afterload_pressure_output", "metrics"],
      ["p2", "graph"],
      ["p1", "graph"],
    ]);
    expect(doc?.reading?.column).toEqual([
      { kind: "noteRef", noteId: "p_note" },
      { kind: "viewRef", viewId: "v_afterload_demo_controls" },
      { kind: "paneRef", panelId: "p2" },
    ]);
    expect(doc?.graphBoardLayout).toEqual({
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "p2" },
        { type: "leaf", graphViewId: "p1" },
      ],
      sizes: [1, 1],
    });
    expect(doc?.initialActiveScenarioId).toBe("1");

    expectInternalReferencesToResolve(doc!);
    expect(caseDocumentToSimInstances(doc!)).toHaveLength(2);
    expect(deriveReadExploreEntryMode(doc!, { readOnly: true })).toBe("read");
  });

  it("preserves ADR-0007 authoring fields through the CaseDocument round trip bridge", () => {
    const doc = officialCaseById("afterload-acute-hypertension")!;
    const instances = caseDocumentToSimInstances(doc);
    const roundTripped = simInstancesToCaseDocument(instances, doc.panels, {
      id: doc.meta.id,
      title: doc.meta.title,
      author: doc.meta.author,
      createdAt: doc.meta.createdAt,
      updatedAt: doc.meta.updatedAt,
      spec: doc.spec,
      solver: doc.solver,
      views: doc.views,
      graphBoardLayout: doc.graphBoardLayout,
      initialActiveScenarioId: doc.initialActiveScenarioId,
      notes: doc.notes,
      reading: doc.reading,
      defaultLocale: doc.defaultLocale,
      availableLocales: doc.availableLocales,
      i18n: doc.i18n,
    });

    expect(roundTripped.views).toEqual(doc.views);
    expect(roundTripped.reading).toEqual(doc.reading);
    expect(roundTripped.graphBoardLayout).toEqual(doc.graphBoardLayout);
    expect(roundTripped.initialActiveScenarioId).toBe(doc.initialActiveScenarioId);
    expectInternalReferencesToResolve(roundTripped);
  });
});

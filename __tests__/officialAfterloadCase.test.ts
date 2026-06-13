import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances, isCaseDisplayable, simInstancesToCaseDocument, workspaceForPanels, type CaseDocument } from "@/caseDoc";
import { defaultParams } from "@/engine/ModelCore";
import { collectNoteViewRefIds } from "@/features/workbench/noteViewRefs";
import { deriveReadExploreEntryMode } from "@/features/workbench/readExplore";
import { workspaceForPanelStateReplacement } from "@/features/workbench/hooks/useWorkbenchPanels";
import { validateGraphBoardLayout, type GraphBoardLayout, type ViewSpec } from "@/features/workbench/viewSpec";
import { graphPanelsOnly } from "@/features/workbench/p1aStructuralHosts";
import { officialCaseById } from "@/officialCases";
import type { DockviewViewState, SimInstance, WorkbenchWorkspace } from "@/types";

function collectGraphBoardLeafIds(layout: GraphBoardLayout | undefined): string[] {
  if (!layout) return [];
  if (layout.type === "leaf") return [layout.graphViewId];
  return layout.children.flatMap(collectGraphBoardLeafIds);
}

function expectInternalReferencesToResolve(doc: CaseDocument): void {
  const panelIds = new Set(doc.panels.map((panel) => panel.id));
  const noteIds = new Set(Object.keys(doc.notes ?? {}));
  const viewIds = new Set((doc.views ?? []).map((view) => view.id));
  // Graph board leaves resolve against graph PANEL ids (the runtime drops graph
  // ViewSpecs via authoredViewsOnly; useWorkbenchPersistence normalizes the layout
  // against graphPanelsOnly(panels)), not against persisted graph ViewSpecs.
  const graphViewIds = new Set(graphPanelsOnly(doc.panels).map((panel) => panel.id));
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
      if (view.binding.kind === "scenario") expect(instanceIds.has(view.binding.scenarioId), `controller binding ${view.id}`).toBe(true);
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
    ]);
    expect(doc?.reading?.column).toEqual([
      { kind: "noteRef", noteId: "p_note" },
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
    expect(doc?.workspace).toEqual({
      schemaVersion: 2,
      hosts: {
        note: { open: false },
        rightRail: { open: true },
        metrics: { open: true },
        main: {},
      },
      learnerLocked: true,
    });
    expect(doc?.views?.find((view) => view.kind === "controller")).toMatchObject({
      binding: { kind: "active" },
    });

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

  it("keeps authored workspace/view/reading fields byte-stable across the second real save-load-save pass", () => {
    const doc = officialCaseById("afterload-acute-hypertension")!;
    const params = defaultParams();
    const instances: SimInstance[] = doc.instances.map((instance) => ({
      id: instance.id,
      name: instance.name,
      color: instance.color,
      isVisible: instance.isVisible,
      params,
      targetVolume: instance.targetVolume,
    }));
    const dockviewState: DockviewViewState = {
      library: "dockview",
      schemaVersion: 1,
      zone: "main",
      state: { panels: { p2: {}, p1: {} }, grid: { root: {}, width: 800, height: 500, orientation: "HORIZONTAL" } },
      updatedAt: 123,
    };
    const workspace: WorkbenchWorkspace = workspaceForPanels(doc.panels, {
      ...doc.workspace!,
      hosts: {
        ...doc.workspace!.hosts,
        rightRail: { open: true, scenarioListCollapsed: true },
        metrics: { open: true, span: "full" },
        main: { dockviewState },
      },
    });
    const views: ViewSpec[] = (doc.views ?? []).map((view) => (
      view.kind === "controller"
        ? { ...view, binding: { kind: "scenario", scenarioId: "2" } }
        : view
    ));

    function saveWith(input: { workspace: WorkbenchWorkspace; views: ViewSpec[] }): CaseDocument {
      return simInstancesToCaseDocument(instances, doc.panels, {
        id: doc.meta.id,
        title: doc.meta.title,
        author: doc.meta.author,
        createdAt: doc.meta.createdAt,
        updatedAt: doc.meta.updatedAt,
        spec: doc.spec,
        solver: doc.solver,
        workspace: input.workspace,
        views: input.views,
        graphBoardLayout: doc.graphBoardLayout,
        initialActiveScenarioId: doc.initialActiveScenarioId,
        notes: doc.notes,
        reading: doc.reading,
        defaultLocale: doc.defaultLocale,
        availableLocales: doc.availableLocales,
        i18n: doc.i18n,
      });
    }
    function loadWorkspace(saved: CaseDocument): WorkbenchWorkspace {
      return workspaceForPanelStateReplacement({
        panels: saved.panels,
        workspace: saved.workspace,
      });
    }
    function pickCanonical(saved: CaseDocument) {
      return {
        views: saved.views,
        graphBoardLayout: saved.graphBoardLayout,
        initialActiveScenarioId: saved.initialActiveScenarioId,
        reading: saved.reading,
        notes: saved.notes,
        workspace: saved.workspace,
      };
    }

    const first = saveWith({ workspace, views });
    const second = saveWith({ workspace: loadWorkspace(first), views: first.views ?? [] });
    const third = saveWith({ workspace: loadWorkspace(second), views: second.views ?? [] });

    expect(JSON.stringify(pickCanonical(second), null, 2)).toBe(JSON.stringify(pickCanonical(third), null, 2));
    expect(second.workspace?.hosts.metrics).toEqual({ open: true, span: "full" });
    expect(second.workspace?.hosts.rightRail).toEqual({ open: true, scenarioListCollapsed: true });
    expect(second.views?.find((view) => view.kind === "controller")).toMatchObject({
      binding: { kind: "scenario", scenarioId: "2" },
    });
    expect(second.notes?.p_note).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "view_ref", props: { viewId: "v_afterload_demo_controls" } }),
    ]));

    const mainSpanWorkspace = workspaceForPanelStateReplacement({
      panels: second.panels,
      workspace: {
        ...second.workspace!,
        hosts: {
          ...second.workspace!.hosts,
          metrics: { ...second.workspace!.hosts.metrics, span: "main" },
        },
      },
    });
    const savedAfterMainToggle = saveWith({ workspace: mainSpanWorkspace, views: second.views ?? [] });
    expect("span" in savedAfterMainToggle.workspace!.hosts.metrics).toBe(false);
  });
});

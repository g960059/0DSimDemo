import type { PanelDef, PanelInstanceConfig, PanelViewConfig, SimInstance } from "./types";
import type { CaseDocument, CaseI18nContent } from "./caseDoc";
import { remapGraphBoardLayoutViewIds, remapViewSpecIds } from "./features/workbench/viewSpec";
import { remapNoteViewRefIds } from "./features/workbench/noteViewRefs";

function remapViewInstanceIds(view: PanelViewConfig | undefined, idMap: Map<string, string>): PanelViewConfig | undefined {
  if (!view || !("instances" in view) || !view.instances) return view;
  return {
    ...view,
    instances: Object.fromEntries(
      Object.entries(view.instances).map(([id, cfg]) => [idMap.get(id) ?? id, cfg]),
    ),
  } as PanelViewConfig;
}

export function remapWorkbenchLoadIds(
  instances: SimInstance[],
  panels: PanelDef[],
  nonce: string,
): {
  instances: SimInstance[];
  panels: PanelDef[];
  activeInstanceId: string;
  idMap: Map<string, string>;
} {
  const idMap = new Map<string, string>();
  const remappedInstances = instances.map((inst, i) => {
    const id = `c${nonce}_${i + 1}`;
    idMap.set(inst.id, id);
    return { ...inst, id };
  });
  const remappedPanels = panels.map((panel) => ({
    ...panel,
    config: Object.fromEntries(
      Object.entries(panel.config).map(([id, cfg]) => [idMap.get(id) ?? id, { ...cfg }]),
    ) as Record<string, PanelInstanceConfig>,
    view: remapViewInstanceIds(panel.view, idMap),
  }));

  return {
    instances: remappedInstances,
    panels: remappedPanels,
    activeInstanceId: remappedInstances[0]?.id ?? "1",
    idMap,
  };
}

function remapRecordKeys<T>(record: Record<string, T> | undefined, idMap: Map<string, string>): Record<string, T> | undefined {
  if (!record) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([id, value]) => [idMap.get(id) ?? id, value]),
  );
}

export function remapCaseI18nContentIds(
  i18n: Record<string, CaseI18nContent> | undefined,
  maps: {
    instanceIdMap: Map<string, string>;
    panelIdMap?: Map<string, string>;
    viewIdMap?: Map<string, string>;
  },
): Record<string, CaseI18nContent> | undefined {
  if (!i18n) return undefined;
  const panelIdMap = maps.panelIdMap ?? new Map<string, string>();
  const viewIdMap = maps.viewIdMap ?? panelIdMap;
  return Object.fromEntries(
    Object.entries(i18n).map(([locale, content]) => [locale, {
      ...content,
      ...(content.instances ? { instances: remapRecordKeys(content.instances, maps.instanceIdMap) } : {}),
      ...(content.panels ? { panels: remapRecordKeys(content.panels, panelIdMap) } : {}),
      ...(content.notes ? { notes: remapNoteViewRefIds(remapRecordKeys(content.notes, panelIdMap), viewIdMap) } : {}),
    }]),
  );
}

export function remapCaseDocumentViewIds(
  doc: CaseDocument,
  maps: {
    instanceIdMap: Map<string, string>;
    panelIdMap?: Map<string, string>;
    viewIdMap?: Map<string, string>;
  },
): CaseDocument {
  const panelIdMap = maps.panelIdMap ?? new Map<string, string>();
  const viewIdMap = maps.viewIdMap ?? panelIdMap;
  return {
    ...doc,
    ...(doc.notes ? { notes: remapNoteViewRefIds(doc.notes, viewIdMap) } : {}),
    ...(doc.reading ? {
      reading: {
        ...doc.reading,
        column: doc.reading.column.map((entry) => (
          entry.kind === "paneRef"
            ? { ...entry, panelId: panelIdMap.get(entry.panelId) ?? entry.panelId }
            : entry.kind === "noteRef"
              ? { ...entry, noteId: panelIdMap.get(entry.noteId) ?? entry.noteId }
              : { ...entry, viewId: viewIdMap.get(entry.viewId) ?? entry.viewId }
        )),
      },
    } : {}),
    ...(doc.exposedControllers ? {
      exposedControllers: doc.exposedControllers.map((controller) => ({
        ...controller,
        ...(controller.instanceId ? { instanceId: maps.instanceIdMap.get(controller.instanceId) ?? controller.instanceId } : {}),
      })),
    } : {}),
    ...(doc.views ? {
      views: doc.views.map((view) => remapViewSpecIds(view, {
        scenarioIdMap: maps.instanceIdMap,
        viewIdMap,
      })),
    } : {}),
    ...(doc.graphBoardLayout ? {
      graphBoardLayout: remapGraphBoardLayoutViewIds(doc.graphBoardLayout, viewIdMap),
    } : {}),
    ...(doc.initialActiveScenarioId ? {
      initialActiveScenarioId: maps.instanceIdMap.get(doc.initialActiveScenarioId) ?? doc.initialActiveScenarioId,
    } : {}),
  };
}

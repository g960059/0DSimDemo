// Content-preserving / layout-regenerating per ADR-0005. Converts PanelDef content + reading order only; regenerating the Dockview workspace/viewStates on reading->studio is the CALLER's job (defaultWorkspaceForPanels in caseDoc.ts). Geometry is intentionally NOT idempotent.
import type { CaseDocument, ReadingColumnEntry } from "./caseDoc";
import type { PanelDef, PanelRole, PanelType, ControllerItem } from "./types";
import { roleOf } from "./paneRole";
import { defaultZoneOf } from "./paneZone";
import { type KnobKey } from "./engine/knobs";
import type { NumericKnobKey } from "./lessonDoc";
import { knobControllerMetadata } from "./knobMetadata";

export const READING_ROLE_ORDER: Record<PanelRole, number> = { note: 0, graph: 1, output: 2, control: 3 };
export const READING_RENDERABLE_PANEL_TYPES = new Set<PanelType>(['PVLOOP','WAVEFORM','GUYTON_LEFT','GUYTON_RIGHT','METRICS','CONTROLS','NOTE']);

function isNotePanel(panel: PanelDef): boolean {
  return (panel.role ?? roleOf(panel.type)) === "note";
}

export function studioToReadingColumn(panels: PanelDef[]): ReadingColumnEntry[] {
  return panels.map((panel) => {
    if (isNotePanel(panel)) {
      return { kind: "noteRef", noteId: panel.view?.kind === "note" && panel.view.noteId ? panel.view.noteId : panel.id };
    }
    return { kind: "paneRef", panelId: panel.id };
  });
}

export function deriveDefaultReadingColumn(panels: PanelDef[]): ReadingColumnEntry[] {
  return panels
    .map((panel, index) => ({ panel, index, role: panel.role ?? roleOf(panel.type) }))
    .sort((a, b) => READING_ROLE_ORDER[a.role] - READING_ROLE_ORDER[b.role] || a.index - b.index)
    .map(({ panel, role }) => {
      if (role === "note") {
        return { kind: "noteRef", noteId: panel.view?.kind === "note" && panel.view.noteId ? panel.view.noteId : panel.id };
      }
      return { kind: "paneRef", panelId: panel.id, generated: true };
    });
}

export type ReadingColumnFallbackReason = "empty_panels" | "missing_panel" | "missing_note" | "unsupported_pane";
export type ResolvedReadingColumn =
  | { column: ReadingColumnEntry[] }
  | { fallback: ReadingColumnFallbackReason };

export function resolveReadingColumn(doc: Pick<CaseDocument, "panels" | "notes" | "reading">): ResolvedReadingColumn {
  if (doc.panels.length === 0) return { fallback: "empty_panels" };

  const panelsById = new Map(doc.panels.map((panel) => [panel.id, panel]));
  const noteIds = new Set(Object.keys(doc.notes ?? {}));
  const isExplicitColumn = Array.isArray(doc.reading?.column);
  const column = isExplicitColumn
    ? doc.reading!.column
    : deriveDefaultReadingColumn(doc.panels).filter((entry) => {
        if (entry.kind !== "paneRef") return true;
        const panel = panelsById.get(entry.panelId);
        return panel ? READING_RENDERABLE_PANEL_TYPES.has(panel.type) : false;
      });

  if (column.length === 0) return { fallback: "empty_panels" };

  for (const entry of column) {
    if (entry.kind === "paneRef") {
      const panel = panelsById.get(entry.panelId);
      if (!panel) return { fallback: "missing_panel" };
      if (isExplicitColumn && !READING_RENDERABLE_PANEL_TYPES.has(panel.type)) {
        return { fallback: "unsupported_pane" };
      }
    }
    if (entry.kind === "noteRef" && !noteIds.has(entry.noteId)) {
      return { fallback: "missing_note" };
    }
  }

  return { column };
}

export function readingToStudioZones(panels: PanelDef[]): PanelDef[] {
  // Shallow-clone the panel and deep-clone its mutable content (config/view) so
  // later studio edits cannot leak back into the reading source. Zone/role are
  // regenerated; Dockview workspace/viewState regeneration is the caller's job.
  return panels.map((panel) => ({
    ...panel,
    config: panel.config ? structuredClone(panel.config) : panel.config,
    view: panel.view ? structuredClone(panel.view) : panel.view,
    zone: defaultZoneOf(panel.type),
    role: panel.role ?? roleOf(panel.type),
  }));
}

export function knobsToControllerItems(knobs: KnobKey[]): ControllerItem[] {
  return knobs.map((key) => {
    const m = knobControllerMetadata(key);
    return {
      paramKey: key,
      kind: "slider",
      label: m?.label ?? key,
      ...(m?.min != null ? { min: m.min } : {}),
      ...(m?.max != null ? { max: m.max } : {}),
      ...(m?.step != null ? { step: m.step } : {}),
    };
  });
}

export function exposedKnobsToControllerItems(keys: NumericKnobKey[]): ControllerItem[] {
  return knobsToControllerItems(keys as KnobKey[]);
}

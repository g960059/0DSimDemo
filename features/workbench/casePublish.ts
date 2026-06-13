import type { CaseDocument, CaseVisibility } from "@/caseDoc";
import { collectNoteViewRefIds } from "@/features/workbench/noteViewRefs";
import { graphPanelsOnly } from "@/features/workbench/p1aStructuralHosts";
import { canUseReadExplore, hasCaseReadingContent, type ReadExploreMode } from "@/features/workbench/readExplore";
import { validateGraphBoardLayout } from "@/features/workbench/viewSpec";

export type PublishIssueSeverity = "blocker" | "warning";

export interface PublishIssue {
  severity: PublishIssueSeverity;
  code: string;
  path?: string;
}

export interface PublishDraft {
  status: "published";
  visibility: Extract<CaseVisibility, "unlisted" | "public">;
  defaultEntry: ReadExploreMode;
}

function issue(severity: PublishIssueSeverity, code: string, path?: string): PublishIssue {
  return path ? { severity, code, path } : { severity, code };
}

export function derivePublishDefaultEntry(doc: CaseDocument): ReadExploreMode {
  return canUseReadExplore(doc) ? "read" : "explore";
}

export function validatePublishableCase(doc: CaseDocument): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const panelIds = new Set(doc.panels.map((panel) => panel.id));
  const noteIds = new Set(Object.keys(doc.notes ?? {}));
  const viewIds = new Set((doc.views ?? []).map((view) => view.id));
  const graphPanelIds = graphPanelsOnly(doc.panels).map((panel) => panel.id);
  const instanceIds = new Set(doc.instances.map((instance) => instance.id));

  // The saved title falls back to spec.title || meta.title (cloud summary), so validate
  // against the same effective value to avoid a false-positive on docs that only set spec.title.
  if ((doc.spec.title || doc.meta.title || "").trim().length === 0) {
    issues.push(issue("blocker", "publish.blocker.missing-title", "meta.title"));
  }

  if (doc.instances.length < 1) {
    issues.push(issue("blocker", "publish.blocker.no-scenarios", "instances"));
  }

  if (doc.initialActiveScenarioId && !instanceIds.has(doc.initialActiveScenarioId)) {
    issues.push(issue("blocker", "publish.blocker.dangling-initial-active", `initialActiveScenarioId:${doc.initialActiveScenarioId}`));
  }

  if (graphPanelIds.length > 0 || doc.graphBoardLayout) {
    const layoutErrors = validateGraphBoardLayout(doc.graphBoardLayout, { graphViewIds: graphPanelIds });
    if (layoutErrors.length > 0) {
      issues.push(issue("blocker", "publish.blocker.invalid-graph-layout", "graphBoardLayout"));
    }
  }

  for (const [index, entry] of (doc.reading?.column ?? []).entries()) {
    if (entry.kind === "noteRef" && !noteIds.has(entry.noteId)) {
      issues.push(issue("blocker", "publish.blocker.dangling-reading-ref", `reading.column[${index}].noteRef:${entry.noteId}`));
    }
    if (entry.kind === "paneRef" && !panelIds.has(entry.panelId)) {
      issues.push(issue("blocker", "publish.blocker.dangling-reading-ref", `reading.column[${index}].paneRef:${entry.panelId}`));
    }
    if (entry.kind === "viewRef" && !viewIds.has(entry.viewId)) {
      issues.push(issue("blocker", "publish.blocker.dangling-reading-ref", `reading.column[${index}].viewRef:${entry.viewId}`));
    }
  }

  for (const viewId of collectNoteViewRefIds(doc.notes)) {
    if (!viewIds.has(viewId)) {
      issues.push(issue("blocker", "publish.blocker.dangling-note-view-ref", `notes.view_ref:${viewId}`));
    }
  }

  for (const view of doc.views ?? []) {
    if (view.kind === "controller") {
      if (view.binding.kind === "scenario" && !instanceIds.has(view.binding.scenarioId)) {
        issues.push(issue("blocker", "publish.blocker.dangling-controller-pin", `views.${view.id}.binding:${view.binding.scenarioId}`));
      }
      continue;
    }

    for (const scenarioId of Object.keys(view.membership)) {
      if (!instanceIds.has(scenarioId)) {
        issues.push(issue("blocker", "publish.blocker.dangling-membership", `views.${view.id}.membership:${scenarioId}`));
      }
    }
  }

  if (!hasCaseReadingContent(doc)) {
    issues.push(issue("warning", "publish.warning.no-reading-content", "reading"));
  }

  const initialActiveScenario = doc.initialActiveScenarioId
    ? doc.instances.find((instance) => instance.id === doc.initialActiveScenarioId)
    : undefined;
  if (initialActiveScenario?.isVisible === false) {
    issues.push(issue("warning", "publish.warning.active-scenario-hidden", `initialActiveScenarioId:${initialActiveScenario.id}`));
  }

  for (const view of doc.views ?? []) {
    if (view.kind === "metrics" && view.metrics.length === 0) {
      issues.push(issue("warning", "publish.warning.empty-view", `views.${view.id}`));
    }
    if (view.kind === "controller") {
      if (view.items.length === 0) {
        issues.push(issue("warning", "publish.warning.empty-view", `views.${view.id}`));
      }
      if (view.binding.kind === "scenario") {
        issues.push(issue("warning", "publish.warning.pinned-binding-used", `views.${view.id}.binding:${view.binding.scenarioId}`));
      }
    }
  }

  // BLOCKER, not warning: isCaseDisplayable gates display on modelLimitations.length > 0
  // (caseDoc.ts), so a published doc without them would be publishable-but-undisplayable.
  if (!doc.spec?.modelLimitations?.length || doc.spec.modelLimitations.every((value) => value.trim().length === 0)) {
    issues.push(issue("blocker", "publish.blocker.model-limitations-empty", "spec.modelLimitations"));
  }

  return issues;
}

export const isPublishable = (issues: PublishIssue[]) => !issues.some((item) => item.severity === "blocker");

export function applyPublishDraft(doc: CaseDocument, draft: PublishDraft): CaseDocument {
  const derivedDefaultEntry = derivePublishDefaultEntry(doc);
  const { defaultEntry: _defaultEntry, ...withoutDefaultEntry } = doc;
  return {
    ...withoutDefaultEntry,
    status: draft.status,
    visibility: draft.visibility,
    ...(draft.defaultEntry === derivedDefaultEntry ? {} : { defaultEntry: draft.defaultEntry }),
  };
}

import * as React from "react";
import { createPortal } from "react-dom";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { authorPreviewHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type { PanelDef } from "@/types";
import type {
  ExperimentRevisionV1,
  ReaderBriefV1,
  StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1";
import {
  useStudioAuthorPreviewV1,
} from "@/components/studio/StudioAuthorPreviewProviderV1";
import {
  captureStudioGraphPaneSpecV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import {
  ScientificWorkbenchBriefingComposerV1,
} from "./ScientificWorkbenchBriefingComposerV1";

export type ScientificWorkbenchBriefingControlV1Props = Readonly<{
  panels: readonly PanelDef[];
  registry: ScientificProductRuntimeRegistryPortV1;
  activeScenarioId: string;
  target: Readonly<{
    experimentId: string;
    briefId: string;
    scenarioId: string;
  }>;
}>;

/**
 * Workbench → Studio author-draft bridge for the session-only vertical slice.
 *
 * The control is the only authoring affordance that remains while compose is
 * closed. Captures are immutable presentation copies owned by ReaderBriefV1.
 */
export function ScientificWorkbenchBriefingControlV1({
  panels,
  registry,
  activeScenarioId,
  target: targetRef,
}: ScientificWorkbenchBriefingControlV1Props) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const ja = i18n.language.toLowerCase().startsWith("ja");
  const {
    draft,
    replaceReaderBriefGraphPanes,
  } = useStudioAuthorPreviewV1();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const target = readerBriefTargetV1(draft.experiments, targetRef);
  const capturedPanes = target?.brief.graphPanes ?? [];

  const capturePanels = React.useCallback((
    panelIds: readonly string[],
    mode: "append" | "update" | "replace-all",
  ) => {
    if (target === null) {
      setError("The session draft has no Reader Brief target.");
      return;
    }
    if (activeScenarioId.length === 0) {
      setError("The active Workbench scenario cannot be mapped to the article.");
      return;
    }
    try {
      const scenarioIdMap = new Map([
        [activeScenarioId, targetRef.scenarioId],
      ]);
      const captures = panelIds.map((panelId) => {
        const panel = panels.find(({ id }) => id === panelId);
        if (panel === undefined) {
          throw new Error(`Unknown Workbench pane ${panelId}`);
        }
        return captureStudioGraphPaneSpecV1({
          panel,
          registry,
          scenarioIdMap,
        });
      });
      const next = mergeCapturedPanesV1(
        target.brief.graphPanes,
        captures,
        mode,
      );
      replaceReaderBriefGraphPanes({
        expectedRevision: draft.revision,
        experimentId: target.experiment.experimentId,
        briefId: target.brief.briefId,
        graphPanes: next,
      });
      setError(null);
    } catch (captureError) {
      setError(errorMessageV1(captureError));
    }
  }, [
    activeScenarioId,
    draft.revision,
    panels,
    registry,
    replaceReaderBriefGraphPanes,
    target,
    targetRef.scenarioId,
  ]);

  const removePane = React.useCallback((paneId: string) => {
    if (target === null) return;
    try {
      replaceReaderBriefGraphPanes({
        expectedRevision: draft.revision,
        experimentId: target.experiment.experimentId,
        briefId: target.brief.briefId,
        graphPanes: target.brief.graphPanes.filter(
          (pane) => pane.paneId !== paneId,
        ),
      });
      setError(null);
    } catch (removeError) {
      setError(errorMessageV1(removeError));
    }
  }, [draft.revision, replaceReaderBriefGraphPanes, target]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-wb-line bg-wb-panel px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98]"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="scientific-workbench-open-briefing-v1"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        <span className="hidden md:inline">
          {ja ? "Briefing" : "Briefing"}
        </span>
        {capturedPanes.length > 0 && (
          <span className="rounded-full bg-wb-active px-1.5 py-0.5 text-[10px] text-wb-text">
            {capturedPanes.length}
          </span>
        )}
      </button>
      {error !== null && !open && (
        <span className="sr-only" role="alert">{error}</span>
      )}
      {open && typeof document !== "undefined" && createPortal(
        <>
          <ScientificWorkbenchBriefingComposerV1
            open
            panels={panels}
            capturedPanes={capturedPanes}
            onClose={() => setOpen(false)}
            onCapture={(panelId) => capturePanels([panelId], "append")}
            onUpdate={(panelId) => capturePanels([panelId], "update")}
            onRemove={removePane}
            onCaptureAll={(panelIds) =>
              capturePanels(panelIds, "replace-all")}
            onOpenDocumentEditor={() => {
              setOpen(false);
              navigate(authorPreviewHref(locale));
            }}
          />
          {error !== null && (
            <div
              role="alert"
              className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-lg border border-red-400/30 bg-red-950 px-4 py-3 text-xs leading-5 text-red-100 shadow-xl"
            >
              {error}
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );
}

function readerBriefTargetV1(
  experiments: readonly ExperimentRevisionV1[],
  target: ScientificWorkbenchBriefingControlV1Props["target"],
): Readonly<{
  experiment: ExperimentRevisionV1;
  brief: ReaderBriefV1;
}> | null {
  const experiment = experiments.find(
    ({ experimentId }) => experimentId === target.experimentId,
  );
  if (
    experiment === undefined
    || !experiment.scenarios.some(
      ({ scenarioId }) => scenarioId === target.scenarioId,
    )
  ) return null;
  const brief = experiment.readerBriefs.find(
    ({ briefId }) => briefId === target.briefId,
  );
  return brief === undefined ? null : { experiment, brief };
}

function mergeCapturedPanesV1(
  current: readonly StudioGraphPaneSpecV1[],
  captures: readonly StudioGraphPaneSpecV1[],
  mode: "append" | "update" | "replace-all",
): readonly StudioGraphPaneSpecV1[] {
  if (mode === "replace-all") return Object.freeze([...captures]);
  const byId = new Map(captures.map((pane) => [pane.paneId, pane]));
  const retained = current.map((pane) => byId.get(pane.paneId) ?? pane);
  const existingIds = new Set(current.map(({ paneId }) => paneId));
  const additions = captures.filter(({ paneId }) => !existingIds.has(paneId));
  if (mode === "append") return Object.freeze([...retained, ...additions]);
  return Object.freeze([...retained, ...additions]);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

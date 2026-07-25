import * as React from "react";
import {
  ArrowLeft,
  Eye,
  PanelsTopLeft,
  Pencil,
  Redo2,
  Undo2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { homeHref, workbenchHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { useWorkbenchTheme } from "@/features/workbench/hooks/useWorkbenchTheme";
import type { StudioDocumentBlockV1 } from "@/studio/contracts/v1";

import { useStudioAuthorPreviewV1 } from "./StudioAuthorPreviewProviderV1";
import {
  useStudioReaderPlacementRuntimesV1,
} from "./StudioReaderPlacementRuntimesV1";
import {
  StudioDocumentSurfaceV1,
  type StudioDocumentCapabilityV1,
} from "./StudioDocumentSurfaceV1";

/**
 * The single Studio document destination.
 *
 * Reading and composing are one surface under a capability toggle, not two
 * routes: an author writes directly on the output a reader will see. The
 * numerical session is bound to the runtime sources referenced by the
 * document, so editing prose never reopens a Worker session.
 */
export default function StudioDocumentRouteV1() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const { workbenchTheme } = useWorkbenchTheme();
  const {
    draft,
    resolvedDocument,
    replaceDocumentContentLatest,
    canUndoDocumentContent,
    canRedoDocumentContent,
    undoDocumentContent,
    redoDocumentContent,
    materializePreview,
  } = useStudioAuthorPreviewV1();
  const [capability, setCapability] =
    React.useState<StudioDocumentCapabilityV1>("compose");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  /**
   * Only the referenced runtime sources decide the session. Prose and brief
   * presentation edits must not tear down and re-open a numerical session.
   */
  const runtimeSignature = React.useMemo(
    () =>
      JSON.stringify(
        draft.document.blocks
          .filter((block) => block.kind === "experiment-placement")
          .map((block) => {
            const experiment = draft.experiments.find(({ experimentId }) =>
              experimentId === block.experimentId);
            return [
              block.experimentId,
              block.readerBriefId,
              (experiment?.scenarios ?? []).map((scenario) => [
                scenario.scenarioId,
                scenario.runtimeSource.kind,
                scenario.runtimeSource.sourceId,
                scenario.runtimeSource.qualification,
              ]),
            ];
          }),
      ),
    [draft],
  );

  const [previewId, setPreviewId] = React.useState<string | null>(null);
  React.useEffect(() => {
    // Only the preview identity is settled here. Numerical sessions belong to
    // the placements that need them, and are opened as a reader approaches.
    try {
      const manifest = materializePreview();
      setErrorMessage(null);
      setPreviewId(manifest.previewId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
      setPreviewId(null);
    }
  }, [materializePreview, runtimeSignature]);

  const commitContent = React.useCallback((
    title: string,
    blocks: readonly StudioDocumentBlockV1[],
    expectedRevision: number,
  ): number | null => {
    try {
      const next = replaceDocumentContentLatest(title, blocks, expectedRevision);
      setErrorMessage(null);
      return next.document.revision;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }, [replaceDocumentContentLatest]);

  React.useEffect(() => {
    if (capability !== "compose") return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") {
        return;
      }
      // Inside a text field ⌘Z means "undo what I just typed", which only the
      // browser can do: the editor buffer has not been committed yet, so
      // stepping document history here would restore an older revision behind
      // a dirty buffer and conflict on every later commit.
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (target.isContentEditable
          || target instanceof HTMLInputElement
          || target instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) redoDocumentContent();
      else undoDocumentContent();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capability, redoDocumentContent, undoDocumentContent]);

  const insertableExperiment = React.useMemo(() => {
    const experiment = draft.experiments[0];
    const brief = experiment?.readerBriefs[0];
    return experiment === undefined || brief === undefined
      ? null
      : Object.freeze({
        experimentId: experiment.experimentId,
        readerBriefId: brief.briefId,
      });
  }, [draft.experiments]);

  const runtimeForPlacement = useStudioReaderPlacementRuntimesV1({
    previewId,
    placements: resolvedDocument.placements,
    autoLive: capability === "read",
  });

  return (
    <div
      className={`workbench-root flex h-full w-full flex-col overflow-hidden bg-wb-app font-sans text-wb-text ${
        capability === "compose"
          ? "shadow-[inset_0_0_0_2px_var(--wb-pick-soft)]"
          : ""
      }`}
      data-workbench-theme={workbenchTheme}
      data-testid="studio-document-route-v1"
      data-studio-capability={capability}
      data-draft-revision={draft.revision}
    >
      <header className="z-20 flex min-h-12 shrink-0 items-center gap-2 px-3 sm:px-5">
        <button
          type="button"
          onClick={() => navigate(homeHref(locale))}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("studioAuthorPreview.author.backHome")}
          </span>
        </button>
        {capability === "compose" && (
          <span
            className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--wb-pick-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--wb-pick)]"
            data-testid="studio-compose-mode-badge-v1"
          >
            <Pencil className="h-3 w-3" />
            {t("studioAuthorPreview.surface.composeBadge")}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {capability === "compose" && (
            <span className="mr-1 inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={undoDocumentContent}
                disabled={!canUndoDocumentContent}
                data-testid="studio-document-undo-v1"
                aria-label={t("studioAuthorPreview.surface.undo")}
                title={`${t("studioAuthorPreview.surface.undo")} (⌘Z)`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={redoDocumentContent}
                disabled={!canRedoDocumentContent}
                data-testid="studio-document-redo-v1"
                aria-label={t("studioAuthorPreview.surface.redo")}
                title={`${t("studioAuthorPreview.surface.redo")} (⇧⌘Z)`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate(workbenchHref(locale))}
            data-testid="studio-author-open-workbench-v1"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text"
          >
            <PanelsTopLeft className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("studioAuthorPreview.author.openWorkbench")}
            </span>
          </button>
          <div
            role="group"
            aria-label={t("studioAuthorPreview.surface.capability")}
            className="inline-flex rounded-md bg-wb-soft p-0.5"
          >
            <button
              type="button"
              aria-pressed={capability === "compose"}
              onClick={() => setCapability("compose")}
              data-testid="studio-capability-compose-v1"
              className={`inline-flex min-h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-bold transition-colors ${
                capability === "compose"
                  ? "bg-wb-active text-wb-text"
                  : "text-wb-subtle hover:text-wb-text"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("studioAuthorPreview.surface.compose")}
            </button>
            <button
              type="button"
              aria-pressed={capability === "read"}
              onClick={() => setCapability("read")}
              data-testid="studio-capability-read-v1"
              className={`inline-flex min-h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-bold transition-colors ${
                capability === "read"
                  ? "bg-wb-active text-wb-text"
                  : "text-wb-subtle hover:text-wb-text"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              {t("studioAuthorPreview.surface.read")}
            </button>
          </div>
        </span>
      </header>

      {errorMessage !== null && (
        <p
          role="alert"
          className="mx-auto w-full max-w-[46rem] px-5 text-xs leading-6 text-wb-danger sm:px-8"
        >
          {errorMessage}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <StudioDocumentSurfaceV1
          document={resolvedDocument}
          capability={capability}
          edit={{ onCommit: commitContent, insertableExperiment }}
          runtimeForPlacement={runtimeForPlacement}
        />
      </div>
    </div>
  );
}

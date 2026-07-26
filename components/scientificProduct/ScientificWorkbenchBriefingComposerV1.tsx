import * as React from "react";
import {
  Camera,
  Check,
  ClipboardList,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import type { PanelDef } from "@/types";
import type { StudioGraphPaneSpecV1 } from "@/studio/contracts/v1";
import {
  isCapturableStudioGraphPanelV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";

export type ScientificWorkbenchBriefingComposerV1Props = Readonly<{
  open: boolean;
  panels: readonly PanelDef[];
  capturedPanes: readonly StudioGraphPaneSpecV1[];
  onClose(): void;
  onCapture(panelId: string): void;
  onUpdate(panelId: string): void;
  onRemove(paneId: string): void;
  onCaptureAll(panelIds: readonly string[]): void;
  onOpenDocumentEditor(): void;
}>;

/**
 * Explicit Presentation Compose layer for the clinical Workbench.
 *
 * It deliberately adds no controls to graph panes themselves. Closing this
 * layer returns the Workbench to its ordinary clinical surface.
 */
export function ScientificWorkbenchBriefingComposerV1({
  open,
  panels,
  capturedPanes,
  onClose,
  onCapture,
  onUpdate,
  onRemove,
  onCaptureAll,
  onOpenDocumentEditor,
}: ScientificWorkbenchBriefingComposerV1Props) {
  const { t } = useTranslation();
  const graphPanels = React.useMemo(
    () => {
      const representedPaneIds = new Set<string>();
      return panels.filter((panel) => {
        if (!isCapturableStudioGraphPanelV1(panel)) return false;
        const paneId = panel.sourceViewId ?? panel.id;
        if (representedPaneIds.has(paneId)) return false;
        representedPaneIds.add(paneId);
        return true;
      });
    },
    [panels],
  );
  const capturedByPaneId = React.useMemo(
    () => new Map(capturedPanes.map((pane) => [pane.paneId, pane])),
    [capturedPanes],
  );

  if (!open) return null;
  return (
    <div
      className="pointer-events-none fixed inset-y-0 right-0 z-[80] flex justify-end"
      data-testid="scientific-workbench-briefing-compose-v1"
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="scientific-briefing-title-v1"
        aria-describedby="scientific-briefing-description-v1"
        className="pointer-events-auto flex h-full w-screen max-w-md flex-col border-l border-wb-line bg-wb-app text-wb-text shadow-2xl"
      >
        <header className="flex items-start gap-3 border-b border-wb-line px-5 py-4">
          <span className="rounded-md bg-wb-active p-2 text-wb-accent">
            <ClipboardList className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="scientific-briefing-title-v1"
              className="text-sm font-bold"
            >
              {t("studioAuthorPreview.briefing.title")}
            </h2>
            <p
              id="scientific-briefing-description-v1"
              className="mt-1 text-xs leading-5 text-wb-muted"
            >
              {t("studioAuthorPreview.briefing.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.97]"
            aria-label={t("studioAuthorPreview.briefing.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-wb-subtle">
              {t("studioAuthorPreview.briefing.graphPanes")}
            </p>
            <button
              type="button"
              disabled={graphPanels.length === 0}
              onClick={() => onCaptureAll(graphPanels.map(({ id }) => id))}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-wb-line px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {t("studioAuthorPreview.briefing.captureAll")}
            </button>
          </div>

          {graphPanels.length > 1 && (
            <p
              className={`mb-3 rounded-md border px-3 py-2 text-[11px] leading-5 ${
                capturedPanes.length > 1
                  ? "border-amber-400/35 bg-amber-400/10 text-amber-100"
                  : "border-wb-line bg-wb-panel text-wb-muted"
              }`}
              data-testid="scientific-briefing-inflow-graph-limit-v1"
              role={capturedPanes.length > 1 ? "alert" : undefined}
            >
              {capturedPanes.length > 1
                ? t("studioAuthorPreview.briefing.inflowLimitExceeded", {
                    count: capturedPanes.length,
                  })
                : t("studioAuthorPreview.briefing.inflowLimitNotice", {
                    count: graphPanels.length,
                  })}
            </p>
          )}

          <div className="grid gap-2.5">
            {graphPanels.map((panel) => {
              const paneId = panel.sourceViewId ?? panel.id;
              const captured = capturedByPaneId.get(paneId);
              return (
                <section
                  key={panel.id}
                  className="rounded-lg border border-wb-line bg-wb-panel p-3"
                  data-briefing-source-panel-id={panel.id}
                  data-briefing-captured={String(captured !== undefined)}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-wb-text">
                        {panel.title}
                      </p>
                      <p className="mt-1 text-[11px] text-wb-subtle">
                        {paneKindLabelV1(panel.type, t)}
                        {panel.type === "WAVEFORM" && (
                          <> · {(panel.timeWindow ?? 2_000) / 1_000}s</>
                        )}
                      </p>
                    </div>
                    {captured !== undefined && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <Check className="h-3 w-3" />
                        {t("studioAuthorPreview.briefing.captured")}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-1.5">
                    {captured === undefined ? (
                      <button
                        type="button"
                        onClick={() => onCapture(panel.id)}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-wb-primary px-2.5 text-xs font-bold text-white hover:bg-wb-primary-hover active:scale-[0.98]"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {t("studioAuthorPreview.briefing.capture")}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdate(panel.id)}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-wb-line px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {t("studioAuthorPreview.briefing.updateCapture")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(paneId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-subtle hover:bg-red-500/10 hover:text-red-300 active:scale-[0.97]"
                          aria-label={t(
                            "studioAuthorPreview.briefing.removeCapture",
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-wb-line px-5 py-3">
          <p className="text-[11px] leading-5 text-wb-subtle">
            {t("studioAuthorPreview.briefing.paneCount", {
              count: capturedPanes.length,
            })}
          </p>
          <button
            type="button"
            onClick={onOpenDocumentEditor}
            className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover active:scale-[0.98]"
            data-testid="scientific-workbench-open-document-editor-v1"
          >
            {t("studioAuthorPreview.briefing.editArticle")}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function paneKindLabelV1(
  type: PanelDef["type"],
  t: TFunction,
): string {
  switch (type) {
    case "WAVEFORM":
      return t("studioAuthorPreview.briefing.paneKinds.waveform");
    case "PVLOOP":
      return t("studioAuthorPreview.briefing.paneKinds.pvLoop");
    case "GUYTON_LEFT":
      return t("studioAuthorPreview.briefing.paneKinds.guytonLeft");
    case "GUYTON_RIGHT":
      return t("studioAuthorPreview.briefing.paneKinds.guytonRight");
    default:
      return type;
  }
}

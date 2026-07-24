import * as React from "react";
import {
  Camera,
  Check,
  ClipboardList,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
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
  const { i18n } = useTranslation();
  const ja = i18n.language.toLowerCase().startsWith("ja");
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
      className="fixed inset-0 z-[80] flex justify-end bg-black/45"
      data-testid="scientific-workbench-briefing-compose-v1"
    >
      <button
        type="button"
        className="min-w-0 flex-1 cursor-default"
        aria-label={ja ? "Briefingを閉じる" : "Close briefing"}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="scientific-briefing-title-v1"
        className="flex h-full w-full max-w-md flex-col border-l border-wb-line bg-wb-app text-wb-text shadow-2xl"
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
              {ja ? "Briefingを構成" : "Compose briefing"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-wb-muted">
              {ja
                ? "現在のwindow・色・凡例位置を記事へコピーします。後のpane変更は、更新するまでReaderへ反映されません。"
                : "Copy the current window, colors, and legend position into the article. Later pane changes stay detached until you update the capture."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.97]"
            aria-label={ja ? "閉じる" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-wb-subtle">
              {ja ? "Graph panes" : "Graph panes"}
            </p>
            <button
              type="button"
              disabled={graphPanels.length === 0}
              onClick={() => onCaptureAll(graphPanels.map(({ id }) => id))}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-wb-line px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {ja ? "すべてcapture" : "Capture all"}
            </button>
          </div>

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
                        {paneKindLabelV1(panel.type)}
                        {panel.type === "WAVEFORM" && (
                          <> · {(panel.timeWindow ?? 2_000) / 1_000}s</>
                        )}
                      </p>
                    </div>
                    {captured !== undefined && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <Check className="h-3 w-3" />
                        {ja ? "capture済み" : "Captured"}
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
                        {ja ? "Capture" : "Capture"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdate(panel.id)}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-wb-line px-2.5 text-xs font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.98]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {ja ? "現在設定で更新" : "Update capture"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(paneId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-subtle hover:bg-red-500/10 hover:text-red-300 active:scale-[0.97]"
                          aria-label={ja ? "captureを削除" : "Remove capture"}
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
            {ja
              ? `${capturedPanes.length} paneをReader Briefに保存中（session draft）`
              : `${capturedPanes.length} pane${capturedPanes.length === 1 ? "" : "s"} in the Reader Brief session draft`}
          </p>
          <button
            type="button"
            onClick={onOpenDocumentEditor}
            className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover active:scale-[0.98]"
            data-testid="scientific-workbench-open-document-editor-v1"
          >
            {ja ? "記事を編集" : "Edit article"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function paneKindLabelV1(type: PanelDef["type"]): string {
  switch (type) {
    case "WAVEFORM":
      return "Waveform";
    case "PVLOOP":
      return "PV loop";
    case "GUYTON_LEFT":
      return "Guyton / Starling · left";
    case "GUYTON_RIGHT":
      return "Guyton / Starling · right";
    default:
      return type;
  }
}

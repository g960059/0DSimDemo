import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  RefreshCw,
  Smartphone,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PanelDef } from "@/types";
import type {
  ReaderBriefExtentV1,
  ReaderControlSpecV1,
  ReaderInstantaneousReadbackSpecV1,
  StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1";
import {
  panelFromStudioGraphPaneSpecV1,
  type StudioGraphPaneCaptureDriftV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";
import {
  createScientificWorkbenchDisplayClockV1,
} from "./ScientificWorkbenchDisplayClockV1";
import {
  ScientificProductGraphPaneV1,
} from "./ScientificWorkbenchRuntimeRendererV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";

/** In-flow keeps the article readable; peek is the wider companion surface. */
const INFLOW_GRAPH_SOFT_LIMIT_V1 = 1;
const PEEK_GRAPH_SOFT_LIMIT_V1 = 4;

export type ScientificWorkbenchBriefingComposerV1Props = Readonly<{
  open: boolean;
  panels: readonly PanelDef[];
  pinnedPanes: readonly StudioGraphPaneSpecV1[];
  /** Drift of each pinned pane against its live Workbench source. */
  driftByPaneId: ReadonlyMap<string, StudioGraphPaneCaptureDriftV1>;
  /**
   * Why a pinned pane cannot be removed, keyed by pane id. A brief stays
   * referentially closed, so the reason is shown before the author acts.
   */
  unpinBlockedByPaneId: ReadonlyMap<string, string>;
  registry: ScientificProductRuntimeRegistryPortV1;
  /** Article scenario id → live Workbench scenario id, for the preview. */
  previewScenarioIdMap: ReadonlyMap<string, string>;
  readbacks: readonly ReaderInstantaneousReadbackSpecV1[];
  controls: readonly ReaderControlSpecV1[];
  extent: ReaderBriefExtentV1;
  /** Records the companion surface this brief is authored for. */
  onExtentChange(extent: ReaderBriefExtentV1): void;
  onClose(): void;
  onPin(panelId: string): void;
  onUnpin(paneId: string): void;
  onSync(paneId: string): void;
  onMove(paneId: string, direction: -1 | 1): void;
  onOpenDocumentEditor(): void;
}>;

/**
 * Presentation Compose layer for the clinical Workbench.
 *
 * The surface shows the artifact being authored — the Reader cell — and
 * treats the Workbench as the palette it is pinned from. It deliberately adds
 * no controls to the graph panes themselves, and closing it returns the
 * Workbench to its ordinary clinical surface with no authoring trace.
 */
export function ScientificWorkbenchBriefingComposerV1({
  open,
  panels,
  pinnedPanes,
  driftByPaneId,
  unpinBlockedByPaneId,
  registry,
  previewScenarioIdMap,
  readbacks,
  controls,
  extent,
  onClose,
  onPin,
  onUnpin,
  onSync,
  onMove,
  onOpenDocumentEditor,
  onExtentChange,
}: ScientificWorkbenchBriefingComposerV1Props) {
  const { t } = useTranslation();
  // The brief owns the extent; this surface only shows and changes it.
  const previewExtent = extent;
  const [narrowPreview, setNarrowPreview] = React.useState(false);


  /**
   * A pin appends, so the newest graph can land outside the extent's cut. The
   * preview stays truthful about what the reader sees; instead of promoting
   * the new pane, bring wherever it actually landed into view.
   */
  const previousPaneIdsRef = React.useRef<readonly string[]>([]);
  const trackedPinsRef = React.useRef(false);
  React.useEffect(() => {
    const previous = new Set(previousPaneIdsRef.current);
    const paneIds = pinnedPanes.map(({ paneId }) => paneId);
    const added = paneIds.filter((paneId) => !previous.has(paneId));
    previousPaneIdsRef.current = paneIds;
    if (!trackedPinsRef.current) {
      trackedPinsRef.current = true;
      return;
    }
    const paneId = added.at(-1);
    if (paneId === undefined) return;
    document
      .querySelector(`[data-briefing-pane-id=${JSON.stringify(paneId)}]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pinnedPanes]);

  if (!open) return null;

  const softLimit = previewExtent === "inflow"
    ? INFLOW_GRAPH_SOFT_LIMIT_V1
    : previewExtent === "peek"
    ? PEEK_GRAPH_SOFT_LIMIT_V1
    // A full screen has room for everything the author pinned, so nothing
    // there overflows.
    : pinnedPanes.length;
  const visiblePanes = pinnedPanes.slice(0, softLimit);
  const overflowPanes = pinnedPanes.slice(visiblePanes.length);

  return (
    <div
      className="pointer-events-none fixed inset-y-0 right-0 z-[80] flex justify-end"
      data-testid="scientific-workbench-briefing-compose-v1"
      data-briefing-preview-extent={previewExtent}
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="scientific-briefing-title-v1"
        aria-describedby="scientific-briefing-description-v1"
        className="pointer-events-auto flex h-full w-screen max-w-[min(100vw,820px)] flex-col border-l border-wb-line bg-wb-app text-wb-text shadow-2xl sm:w-[45vw] sm:min-w-[560px]"
      >
        <header className="flex items-start gap-3 border-b border-wb-line px-5 py-4">
          <span className="rounded-md bg-wb-active p-2 text-wb-accent">
            <ClipboardList className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="scientific-briefing-title-v1" className="text-sm font-bold">
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

        <div className="flex flex-wrap items-center gap-2 border-b border-wb-line px-4 py-2.5">
          <div
            role="tablist"
            aria-label={t("studioAuthorPreview.briefing.extentTablist")}
            className="inline-flex rounded-md border border-wb-line p-0.5"
          >
            {(["inflow", "peek", "fullscreen"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={previewExtent === candidate}
                onClick={() => onExtentChange(candidate)}
                data-testid={`scientific-briefing-extent-${candidate}-v1`}
                className={`min-h-8 rounded px-3 text-xs font-bold transition-colors ${
                  previewExtent === candidate
                    ? "bg-wb-active text-wb-text"
                    : "text-wb-muted hover:text-wb-text"
                }`}
              >
                {t(`studioAuthorPreview.briefing.extentName.${candidate}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={narrowPreview}
            onClick={() => setNarrowPreview((value) => !value)}
            data-testid="scientific-briefing-narrow-preview-v1"
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border border-wb-line px-2.5 text-xs font-bold transition-colors ${
              narrowPreview
                ? "bg-wb-active text-wb-text"
                : "text-wb-muted hover:text-wb-text"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            {t("studioAuthorPreview.briefing.narrowPreview")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section
            className="border-b border-wb-line bg-wb-soft px-4 py-4"
            aria-label={t("studioAuthorPreview.briefing.previewLabel")}
          >
            <p className="mb-3 text-[11px] leading-5 text-wb-subtle">
              {t("studioAuthorPreview.briefing.previewNotice")}
            </p>
            <div
              className={narrowPreview ? "mx-auto max-w-[390px]" : ""}
              data-testid="scientific-briefing-preview-v1"
              data-briefing-preview-graph-count={visiblePanes.length}
            >
              {pinnedPanes.length === 0
                ? (
                  <BriefingEmptyStateV1 />
                )
                : (
                  <div className="grid gap-4">
                    {visiblePanes.map((pane, index) => (
                      <BriefingPreviewPaneV1
                        key={pane.paneId}
                        pane={pane}
                        index={index}
                        total={pinnedPanes.length}
                        drift={driftByPaneId.get(pane.paneId)}
                        unpinBlockedReason={
                          unpinBlockedByPaneId.get(pane.paneId)
                        }
                        registry={registry}
                        previewScenarioIdMap={previewScenarioIdMap}
                        onUnpin={onUnpin}
                        onSync={onSync}
                        onMove={onMove}
                      />
                    ))}

                    {readbacks.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                        {readbacks.map((readback) => (
                          <div key={readback.readbackId}>
                            <p className="text-[11px] font-semibold text-wb-accent">
                              {readback.label}
                            </p>
                            <p className="mt-1 font-mono text-lg text-wb-text">
                              —
                            </p>
                            <p className="text-[10px] text-wb-subtle">
                              {readback.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {controls.map((control) => (
                      <div key={control.controlId}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[11px] font-semibold text-wb-muted">
                            {control.label}
                          </span>
                          <span className="font-mono text-xs text-wb-text">
                            {control.initialValue}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, control.allowedValues.length - 1)}
                          step={1}
                          value={Math.max(
                            0,
                            control.allowedValues.indexOf(control.initialValue),
                          )}
                          readOnly
                          disabled
                          aria-label={control.label}
                          className="mt-1.5 h-1.5 w-full accent-wb-accent"
                        />
                      </div>
                    ))}

                    {overflowPanes.length > 0 && (
                      <div
                        role="alert"
                        data-testid="scientific-briefing-overflow-v1"
                        className="rounded-lg border border-amber-400/35 bg-amber-400/10 p-3 text-[11px] leading-5 text-amber-100"
                      >
                        <p className="flex items-start gap-2 font-bold">
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {t("studioAuthorPreview.briefing.overflowTitle", {
                            count: overflowPanes.length,
                            extent: t(
                              `studioAuthorPreview.briefing.extentName.${previewExtent}`,
                            ),
                          })}
                        </p>
                        <p className="mt-1 text-amber-100/80">
                          {t("studioAuthorPreview.briefing.overflowHelp")}
                        </p>
                        <ul className="mt-2 grid gap-1.5">
                          {overflowPanes.map((pane) => (
                            <li
                              key={pane.paneId}
                              data-briefing-pane-id={pane.paneId}
                              className="flex items-center justify-between gap-2 rounded border border-amber-400/20 bg-wb-panel px-2.5 py-1.5"
                            >
                              <span className="min-w-0 truncate text-wb-text">
                                {pane.title}
                              </span>
                              <span className="flex shrink-0 gap-1">
                                <PaneActionV1
                                  label={t(
                                    "studioAuthorPreview.briefing.moveUp",
                                  )}
                                  onClick={() => onMove(pane.paneId, -1)}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </PaneActionV1>
                                <PaneActionV1
                                  label={unpinBlockedByPaneId.get(pane.paneId)
                                    ?? t(
                                      "studioAuthorPreview.briefing.unpin",
                                    )}
                                  disabled={unpinBlockedByPaneId.has(
                                    pane.paneId,
                                  )}
                                  danger
                                  onClick={() => onUnpin(pane.paneId)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </PaneActionV1>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-wb-line px-5 py-3">
          <p className="text-[11px] leading-5 text-wb-subtle">
            {t("studioAuthorPreview.briefing.sessionDraft", {
              count: pinnedPanes.length,
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

function BriefingPreviewPaneV1({
  pane,
  index,
  total,
  drift,
  unpinBlockedReason,
  registry,
  previewScenarioIdMap,
  onUnpin,
  onSync,
  onMove,
}: Readonly<{
  pane: StudioGraphPaneSpecV1;
  index: number;
  total: number;
  drift: StudioGraphPaneCaptureDriftV1 | undefined;
  unpinBlockedReason: string | undefined;
  registry: ScientificProductRuntimeRegistryPortV1;
  previewScenarioIdMap: ReadonlyMap<string, string>;
  onUnpin(paneId: string): void;
  onSync(paneId: string): void;
  onMove(paneId: string, direction: -1 | 1): void;
}>) {
  const { t } = useTranslation();
  const clock = React.useMemo(
    () => createScientificWorkbenchDisplayClockV1(true, 1),
    [],
  );
  const panel = React.useMemo(
    () =>
      panelFromStudioGraphPaneSpecV1(pane, {
        scenarioIdMap: previewScenarioIdMap,
        panelId: `briefing-preview:${pane.paneId}`,
      }),
    [pane, previewScenarioIdMap],
  );
  const firstScenarioId = pane.scenarios[0]?.scenarioId;
  const activeInstanceId = firstScenarioId === undefined
    ? undefined
    : previewScenarioIdMap.get(firstScenarioId) ?? firstScenarioId;

  return (
    <section
      className="overflow-hidden rounded-lg border border-wb-line bg-wb-panel"
      data-testid="scientific-briefing-preview-pane-v1"
      data-briefing-pane-id={pane.paneId}
      data-briefing-pane-drift={drift?.kind ?? "unknown"}
    >
      <header className="flex items-center gap-2 border-b border-wb-line px-3 py-2">
        {index === 0 && (
          <span className="rounded bg-wb-active px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wb-accent">
            {t("studioAuthorPreview.briefing.primary")}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-wb-text">
          {pane.title}
        </span>
        <PaneActionV1
          label={t("studioAuthorPreview.briefing.moveUp")}
          disabled={index === 0}
          onClick={() => onMove(pane.paneId, -1)}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </PaneActionV1>
        <PaneActionV1
          label={t("studioAuthorPreview.briefing.moveDown")}
          disabled={index === total - 1}
          onClick={() => onMove(pane.paneId, 1)}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </PaneActionV1>
        <PaneActionV1
          label={unpinBlockedReason
            ?? t("studioAuthorPreview.briefing.unpin")}
          disabled={unpinBlockedReason !== undefined}
          danger
          onClick={() => onUnpin(pane.paneId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </PaneActionV1>
      </header>

      {drift?.kind === "drifted" && (
        <button
          type="button"
          onClick={() => onSync(pane.paneId)}
          data-testid="scientific-briefing-sync-v1"
          className="flex w-full items-center gap-2 border-b border-amber-400/25 bg-amber-400/10 px-3 py-2 text-left text-[11px] leading-5 text-amber-100 hover:bg-amber-400/15"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            {t("studioAuthorPreview.briefing.driftNotice")}
          </span>
          <span className="shrink-0 font-bold underline">
            {t("studioAuthorPreview.briefing.sync")}
          </span>
        </button>
      )}
      {drift?.kind === "uncapturable" && (
        <p
          role="alert"
          data-testid="scientific-briefing-uncapturable-v1"
          className="border-b border-wb-line bg-wb-soft px-3 py-2 text-[11px] leading-5 text-wb-muted"
        >
          {t("studioAuthorPreview.briefing.uncapturableNotice")}
        </p>
      )}

      <div
        className={pane.kind === "waveform"
          ? "relative h-[220px] min-h-0"
          : "relative h-[300px] min-h-0"}
      >
        <ScientificProductGraphPaneV1
          panel={panel}
          registry={registry}
          clock={clock}
          renderContext={{
            instances: [],
            activeInstanceId,
            presentationMode: "reading",
            canConfigure: false,
          }}
        />
      </div>
    </section>
  );
}

/**
 * Compose starts empty because nothing has been chosen yet, so the empty
 * state teaches the gesture rather than reporting the absence.
 */
function BriefingEmptyStateV1() {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-lg border border-dashed border-wb-line bg-wb-panel p-5"
      data-testid="scientific-briefing-empty-v1"
    >
      <p className="text-sm font-bold text-wb-text">
        {t("studioAuthorPreview.briefing.emptyTitle")}
      </p>
      <p className="mt-2 text-xs leading-5 text-wb-muted">
        {t("studioAuthorPreview.briefing.emptyDescription")}
      </p>
      <ul className="mt-4 grid gap-2 text-xs leading-5 text-wb-muted">
        {(["graph", "signal", "metric", "control"] as const).map((kind) => (
          <li key={kind} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 rounded-[3px] border border-dashed border-[var(--wb-pick-idle)]"
            />
            {t(`studioAuthorPreview.briefing.emptyHint.${kind}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaneActionV1({
  label,
  disabled = false,
  danger = false,
  onClick,
  children,
}: Readonly<{
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick(): void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-wb-subtle hover:bg-red-500/10 hover:text-red-300"
          : "text-wb-subtle hover:bg-wb-hover hover:text-wb-text"
      }`}
    >
      {children}
    </button>
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

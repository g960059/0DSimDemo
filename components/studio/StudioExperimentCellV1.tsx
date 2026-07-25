import * as React from "react";
import { Maximize2, Play, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ScientificProductReaderExperimentControllerV1,
  ScientificProductReaderExperimentSnapshotV1,
} from "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";
import {
  ScientificProductGraphPaneV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import {
  createScientificWorkbenchDisplayClockV1,
} from "@/components/scientificProduct/ScientificWorkbenchDisplayClockV1";
import {
  panelFromStudioGraphPaneSpecV1,
} from "@/components/studio/StudioGraphPaneProjectionV1";
import type {
  ResolvedReaderExperimentPlacementV1,
} from "@/studio/contracts/v1";

/**
 * In-flow shows the primary graph only; focus is where the rest of the brief
 * is meant to be readable, so it never truncates what the author pinned.
 */
const INFLOW_GRAPH_LIMIT_V1 = 1;

export type StudioExperimentCellV1Props = Readonly<{
  placement: ResolvedReaderExperimentPlacementV1;
  controller: ScientificProductReaderExperimentControllerV1;
  registry: ScientificProductRuntimeRegistryPortV1;
  /**
   * Composing is writing, not exploring. An author sees the canonical point
   * and the real presentation; integration starts only on request, so a long
   * editing session never pays for a live lane it is not watching.
   */
  autoPlay: boolean;
}>;

/**
 * One experiment as it reads inside an article.
 *
 * The cell carries no frame: it is part of the prose column, not a widget
 * dropped onto it. Only the placement's `inlineMode` decides whether the
 * runtime starts on its own, and `launch` never mounts a graph until asked.
 */
export function StudioExperimentCellV1({
  placement,
  controller,
  registry,
  autoPlay,
}: StudioExperimentCellV1Props) {
  const { t } = useTranslation();
  const snapshot = React.useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [controlError, setControlError] = React.useState<string | null>(null);
  const [focusOpen, setFocusOpen] = React.useState(false);
  const [activated, setActivated] = React.useState(
    autoPlay && placement.inlineMode === "live",
  );
  const clock = React.useMemo(
    () => createScientificWorkbenchDisplayClockV1(true, 1),
    [],
  );

  React.useEffect(() => {
    // Leaving compose hands the cell to a reader, so a `live` placement starts
    // without remounting. Returning to compose keeps whatever was started by
    // hand: stopping it would discard the reader state an author just set up.
    if (autoPlay && placement.inlineMode === "live") setActivated(true);
  }, [autoPlay, placement.inlineMode]);

  React.useEffect(() => {
    if (!activated) return;
    // The nested frame boundary guarantees the canonical one-point snapshot
    // reaches an actual paint before live publication can replace it.
    let firstFrameId: number | null = null;
    let secondFrameId: number | null = null;
    firstFrameId = window.requestAnimationFrame(() => {
      firstFrameId = null;
      secondFrameId = window.requestAnimationFrame(() => {
        secondFrameId = null;
        controller.startPresentation();
      });
    });
    return () => {
      if (firstFrameId !== null) window.cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== null) window.cancelAnimationFrame(secondFrameId);
      controller.stopPresentation();
    };
  }, [activated, controller]);

  const activate = React.useCallback(() => setActivated(true), []);
  const panes = placement.readerBrief.graphPanes;
  const inflowPanes = panes.slice(0, INFLOW_GRAPH_LIMIT_V1);
  const canFocus = panes.length > inflowPanes.length;
  const scenarioId = placement.experiment.scenarios[0]?.scenarioId;

  const commitControl = React.useCallback((
    parameterKey: string,
    value: number,
  ) => {
    activate();
    try {
      controller.commitControl(parameterKey, value);
      setControlError(null);
    } catch (error) {
      setControlError(error instanceof Error ? error.message : String(error));
    }
  }, [activate, controller]);

  if (placement.inlineMode === "launch" && !focusOpen) {
    return (
      <figure
        className="my-8"
        data-testid="studio-reader-experiment-cell-v1"
        data-studio-runtime="true"
        data-reader-inline-mode={placement.inlineMode}
        data-reader-time-scale={snapshot.timeScale}
      >
        <button
          type="button"
          onClick={() => {
            // Launch defers integration until asked; opening it is the ask.
            activate();
            setFocusOpen(true);
          }}
          data-testid="studio-reader-launch-v1"
          className="flex w-full items-center gap-3 rounded-lg bg-wb-soft px-4 py-3.5 text-left transition-colors hover:bg-wb-hover"
        >
          <span className="rounded-md bg-wb-active p-2 text-wb-accent">
            <Play className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-wb-text">
              {placement.localCaption
                ?? t("studioAuthorPreview.reader.interactiveExperiment")}
            </span>
            <span className="mt-0.5 block text-xs text-wb-muted">
              {t("studioAuthorPreview.reader.launchHint")}
            </span>
          </span>
          <Maximize2 className="h-4 w-4 shrink-0 text-wb-subtle" />
        </button>
        {focusOpen && null}
      </figure>
    );
  }

  return (
    <>
      <figure
        className="my-9"
        data-testid="studio-reader-experiment-cell-v1"
        data-studio-runtime="true"
        data-reader-inline-mode={placement.inlineMode}
        data-reader-activated={String(activated)}
        data-reader-time-scale={snapshot.timeScale}
        data-reader-started-from-one-point={String(
          snapshot.startedFromOnePoint,
        )}
        data-reader-canonical-seed-point-count={
          snapshot.canonicalSeedPointCount
        }
        data-reader-frame-count={snapshot.selectedSignalSeries.points.length}
        data-reader-target-generation={snapshot.targetGeneration}
        data-reader-strict-activity={snapshot.strictActivity}
        data-reader-evidence={snapshot.evidence}
        data-reader-phase={snapshot.phase}
      >
        <StudioExperimentControlsV1
          snapshot={snapshot}
          scope={`inflow-${placement.placementBlockId}`}
          onCommit={commitControl}
        />

        <div
          className="mt-4 grid gap-6"
          data-testid="studio-reader-shared-graph-panes-v1"
        >
          {inflowPanes.map((pane) => (
            <StudioExperimentPaneV1
              key={pane.paneId}
              pane={pane}
              registry={registry}
              clock={clock}
              scenarioId={scenarioId}
            />
          ))}
        </div>

        <StudioExperimentReadbacksV1 snapshot={snapshot} />

        <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <span className="min-w-0 text-xs leading-6 text-wb-muted">
            {placement.localCaption}
          </span>
          <span className="flex shrink-0 items-center gap-4">
            {!activated && (
              <button
                type="button"
                onClick={activate}
                data-testid="studio-reader-activate-v1"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-wb-accent hover:underline"
              >
                <Play className="h-3.5 w-3.5" />
                {t("studioAuthorPreview.reader.activate")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                try {
                  controller.resetPresentation();
                  setControlError(null);
                } catch (error) {
                  setControlError(
                    error instanceof Error ? error.message : String(error),
                  );
                }
              }}
              data-testid="studio-reader-reset-v1"
              title={t("studioAuthorPreview.reader.resetDescription")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-wb-subtle transition-colors hover:text-wb-text"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("studioAuthorPreview.reader.reset")}
            </button>
            {canFocus && (
              <button
                type="button"
                onClick={() => {
                  activate();
                  setFocusOpen(true);
                }}
                data-testid="studio-reader-open-focus-v1"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-wb-accent hover:underline"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {t("studioAuthorPreview.reader.openFocus")}
              </button>
            )}
          </span>
        </figcaption>

        {(snapshot.errorMessage ?? controlError) !== null && (
          <p
            role="alert"
            className="mt-3 text-xs leading-6 text-wb-danger"
          >
            {snapshot.errorMessage ?? controlError}
          </p>
        )}
      </figure>

      {focusOpen && (
        <StudioExperimentFocusV1
          placement={placement}
          panes={panes}
          registry={registry}
          clock={clock}
          scenarioId={scenarioId}
          snapshot={snapshot}
          onCommit={commitControl}
          onClose={() => setFocusOpen(false)}
        />
      )}
    </>
  );
}

function StudioExperimentPaneV1({
  pane,
  registry,
  clock,
  scenarioId,
  height,
}: Readonly<{
  pane: ResolvedReaderExperimentPlacementV1["readerBrief"]["graphPanes"][number];
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ReturnType<typeof createScientificWorkbenchDisplayClockV1>;
  scenarioId: string | undefined;
  height?: string;
}>) {
  const panel = React.useMemo(
    () => panelFromStudioGraphPaneSpecV1(pane),
    [pane],
  );
  return (
    <div
      data-studio-reader-pane-kind={pane.kind}
      data-studio-reader-time-window-ms={pane.presentation.timeWindowMs ?? "none"}
      data-studio-reader-legend-position={pane.presentation.legendPosition === null
        ? "default"
        : `${pane.presentation.legendPosition.xPct},`
          + `${pane.presentation.legendPosition.yPct}`}
    >
      <div
        className={`relative min-h-0 ${
          height ?? (pane.kind === "waveform" ? "h-[300px]" : "h-[380px]")
        }`}
      >
        <ScientificProductGraphPaneV1
          panel={panel}
          registry={registry}
          clock={clock}
          renderContext={{
            instances: [],
            activeInstanceId: scenarioId,
            presentationMode: "reading",
            canConfigure: false,
          }}
        />
      </div>
    </div>
  );
}

function StudioExperimentControlsV1({
  snapshot,
  scope,
  onCommit,
}: Readonly<{
  snapshot: ScientificProductReaderExperimentSnapshotV1;
  /** Distinguishes the in-flow controls from the focus copy of the same brief. */
  scope: string;
  onCommit(parameterKey: string, value: number): void;
}>) {
  if (snapshot.allowedControls.length === 0) return null;
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {snapshot.allowedControls.map((control) => {
        const selectedIndex = Math.max(
          0,
          control.allowedValues.findIndex((value) => value === control.value),
        );
        return (
          <div key={control.controlId}>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={`reader-control-${scope}-${control.controlId}`}
                className="text-xs font-semibold text-wb-muted"
              >
                {control.label}
              </label>
              <output className="font-mono text-sm font-bold text-wb-text">
                {formatNumberV1(control.value)}
              </output>
            </div>
            <input
              id={`reader-control-${scope}-${control.controlId}`}
              type="range"
              min={0}
              max={Math.max(1, control.allowedValues.length - 1)}
              step={1}
              value={selectedIndex}
              aria-label={control.label}
              onChange={(event) => {
                const next = control.allowedValues[Number(event.target.value)];
                if (next !== undefined) onCommit(control.parameterKey, next);
              }}
              className="mt-2 h-1.5 w-full cursor-pointer accent-wb-accent"
            />
          </div>
        );
      })}
    </div>
  );
}

function StudioExperimentReadbacksV1({
  snapshot,
}: Readonly<{ snapshot: ScientificProductReaderExperimentSnapshotV1 }>) {
  if (snapshot.instantaneousReadbacks.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
      {snapshot.instantaneousReadbacks.map((readback) => (
        <div key={readback.readbackId}>
          <p className="text-xs font-semibold text-wb-accent">
            {readback.label}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-wb-text">
            {readback.value === null ? "—" : formatNumberV1(readback.value)}
          </p>
          <p className="mt-0.5 text-[11px] text-wb-subtle">{readback.unit}</p>
        </div>
      ))}
    </div>
  );
}

function StudioExperimentFocusV1({
  placement,
  panes,
  registry,
  clock,
  scenarioId,
  snapshot,
  onCommit,
  onClose,
}: Readonly<{
  placement: ResolvedReaderExperimentPlacementV1;
  panes: ResolvedReaderExperimentPlacementV1["readerBrief"]["graphPanes"];
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ReturnType<typeof createScientificWorkbenchDisplayClockV1>;
  scenarioId: string | undefined;
  snapshot: ScientificProductReaderExperimentSnapshotV1;
  onCommit(parameterKey: string, value: number): void;
  onClose(): void;
}>) {
  const { t } = useTranslation();
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-black/20"
      data-testid="studio-reader-focus-v1"
    >
      <button
        type="button"
        aria-label={t("studioAuthorPreview.reader.closeFocus")}
        onClick={onClose}
        className="hidden flex-1 cursor-default sm:block"
      />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={placement.localCaption
          ?? t("studioAuthorPreview.reader.interactiveExperiment")}
        className="flex h-full w-full flex-col bg-wb-app text-wb-text shadow-2xl sm:w-[min(100vw,clamp(560px,54vw,960px))]"
      >
        <header className="flex items-center gap-3 px-5 py-3.5">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">
            {placement.localCaption
              ?? t("studioAuthorPreview.reader.interactiveExperiment")}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-wb-subtle">
            1×
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("studioAuthorPreview.reader.closeFocus")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text active:scale-[0.97]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <StudioExperimentControlsV1
            snapshot={snapshot}
            scope={`focus-${placement.placementBlockId}`}
            onCommit={onCommit}
          />
          <div className="mt-5 grid gap-6">
            {panes.map((pane) => (
              <StudioExperimentPaneV1
                key={pane.paneId}
                pane={pane}
                registry={registry}
                clock={clock}
                scenarioId={scenarioId}
                height="h-[260px]"
              />
            ))}
          </div>
          <StudioExperimentReadbacksV1 snapshot={snapshot} />
        </div>
      </aside>
    </div>
  );
}

function formatNumberV1(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
  }).format(value);
}

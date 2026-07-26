import * as React from "react";
import { Activity, FlaskConical, RotateCcw } from "lucide-react";
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
  ResolvedReaderDocumentV1,
  ResolvedReaderExperimentPlacementV1,
} from "@/studio/contracts/v1";

export type StudioDocumentReaderV1Props = Readonly<{
  document: ResolvedReaderDocumentV1;
  controllerForPlacement(
    placementBlockId: string,
  ): ScientificProductReaderExperimentControllerV1 | null;
  registryForPlacement(
    placementBlockId: string,
  ): ScientificProductRuntimeRegistryPortV1 | null;
}>;

/**
 * Shared Reader renderer seam.
 *
 * Draft Preview supplies a resolved document through the preview resolver.
 * A future PublicationManifest resolver must feed this same component rather
 * than introducing a second published-only Reader implementation.
 */
export function StudioDocumentReaderV1({
  document,
  controllerForPlacement,
  registryForPlacement,
}: StudioDocumentReaderV1Props) {
  const placements = React.useMemo(
    () => new Map(document.placements.map((placement) => [
      placement.placementBlockId,
      placement,
    ])),
    [document],
  );

  return (
    <article
      className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16"
      lang={document.document.locale}
      data-testid="studio-document-reader-v1"
    >
      <header className="mx-auto max-w-3xl border-b border-slate-200 pb-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          CircleHeart Studio
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          {document.document.title}
        </h1>
      </header>

      <div className="mx-auto mt-9 max-w-3xl">
        {document.document.blocks.map((block) => {
          if (block.kind === "heading") {
            const className =
              "mb-4 mt-10 text-2xl font-bold tracking-tight text-slate-950";
            return block.level === 2 ? (
              <h2 key={block.blockId} className={className}>
                {block.text}
              </h2>
            ) : (
              <h3
                key={block.blockId}
                className="mb-3 mt-8 text-xl font-bold text-slate-950"
              >
                {block.text}
              </h3>
            );
          }
          if (block.kind === "paragraph") {
            return (
              <p
                key={block.blockId}
                className="mb-6 text-[17px] leading-8 text-slate-700"
              >
                {block.text}
              </p>
            );
          }
          const placement = placements.get(block.blockId);
          const controller = controllerForPlacement(block.blockId);
          const registry = registryForPlacement(block.blockId);
          if (
            placement === undefined
            || controller === null
            || registry === null
          ) {
            return (
              <section
                key={block.blockId}
                role="alert"
                className="my-9 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800"
              >
                This experiment placement could not be resolved.
              </section>
            );
          }
          return (
            <StudioExperimentCellV1
              key={block.blockId}
              placement={placement}
              controller={controller}
              registry={registry}
            />
          );
        })}
      </div>
    </article>
  );
}

function StudioExperimentCellV1({
  placement,
  controller,
  registry,
}: Readonly<{
  placement: ResolvedReaderExperimentPlacementV1;
  controller: ScientificProductReaderExperimentControllerV1;
  registry: ScientificProductRuntimeRegistryPortV1;
}>) {
  const { t } = useTranslation();
  const snapshot = React.useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [controlError, setControlError] = React.useState<string | null>(null);
  const displayClock = React.useMemo(
    () => createScientificWorkbenchDisplayClockV1(true, 1),
    [],
  );

  React.useEffect(() => {
    // The nested frame boundary guarantees that the canonical one-point
    // snapshot reaches an actual paint before live publication can replace it.
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
      if (firstFrameId !== null) {
        window.cancelAnimationFrame(firstFrameId);
      }
      if (secondFrameId !== null) {
        window.cancelAnimationFrame(secondFrameId);
      }
      controller.stopPresentation();
    };
  }, [controller]);

  const scenario = placement.experiment.scenarios[0];
  const presentationStatus = readerPresentationStatusV1(
    snapshot,
    controlError !== null,
    t,
  );
  return (
    <section
      className="workbench-root my-10 overflow-hidden rounded-3xl border border-wb-line bg-wb-panel text-wb-text shadow-xl shadow-slate-300/35"
      data-workbench-theme="light"
      data-testid="studio-reader-experiment-cell-v1"
      data-studio-runtime="true"
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
      data-reader-presentation-status={presentationStatus.kind}
    >
      <header className="flex flex-col gap-4 border-b border-wb-line px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
              {t("studioAuthorPreview.reader.interactiveExperiment")}
            </p>
            <h2 className="mt-1 text-lg font-bold text-wb-text">
              {t("studioAuthorPreview.reader.experimentTitle")}
            </h2>
            <p className="mt-1 text-xs text-wb-muted">
              {scenario?.label ?? placement.experiment.experimentId}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              try {
                controller.resetPresentation();
                setControlError(null);
              } catch (error) {
                setControlError(errorMessageV1(error));
              }
            }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-wb-line bg-wb-panel px-2.5 text-[11px] font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text active:scale-[0.97]"
            data-testid="studio-reader-reset-v1"
            title={t("studioAuthorPreview.reader.resetDescription")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("studioAuthorPreview.reader.reset")}
          </button>
          <span className="rounded-full border border-wb-line bg-wb-soft px-2.5 py-1 text-[11px] font-bold text-wb-muted">
            1×
          </span>
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${presentationStatus.badgeClassName}`}
          >
            <Activity className="h-3.5 w-3.5" />
            {presentationStatus.label}
          </span>
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6">
        <div
          className="grid gap-5"
          data-testid="studio-reader-shared-graph-panes-v1"
        >
          {placement.readerBrief.graphPanes.map((pane) => {
            const panel = panelFromStudioGraphPaneSpecV1(pane);
            return (
              <section
                key={pane.paneId}
                className="overflow-hidden rounded-2xl border border-wb-line bg-wb-soft"
                data-studio-reader-pane-kind={pane.kind}
                data-studio-reader-time-window-ms={
                  pane.presentation.timeWindowMs ?? "none"
                }
                data-studio-reader-legend-position={
                  pane.presentation.legendPosition === null
                    ? "default"
                    : `${pane.presentation.legendPosition.xPct},`
                      + `${pane.presentation.legendPosition.yPct}`
                }
              >
                <header className="border-b border-wb-line px-4 py-3">
                  <h3 className="text-sm font-bold text-wb-text">
                    {pane.title}
                  </h3>
                </header>
                <div
                  className={
                    pane.kind === "waveform"
                      ? "relative h-[280px] min-h-0"
                      : "relative h-[420px] min-h-0"
                  }
                >
                  <ScientificProductGraphPaneV1
                    panel={panel}
                    registry={registry}
                    clock={displayClock}
                    renderContext={{
                      instances: [],
                      activeInstanceId:
                        placement.experiment.scenarios[0]?.scenarioId,
                      presentationMode: "reading",
                      canConfigure: false,
                    }}
                  />
                </div>
              </section>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.instantaneousReadbacks.map((readback) => (
            <div
              key={readback.readbackId}
              className="rounded-xl border border-wb-line bg-wb-soft p-4"
            >
              <p className="text-xs font-semibold text-wb-muted">
                {readback.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-wb-text">
                {readback.value === null
                  ? "—"
                  : formatNumberV1(readback.value)}
                <span className="ml-1.5 text-xs font-medium text-wb-subtle">
                  {readback.unit}
                </span>
              </p>
              {readback.value === null && (
                <p className="mt-1 text-[11px] text-wb-subtle">
                  {t("studioAuthorPreview.reader.notEvaluated")}
                </p>
              )}
            </div>
          ))}
        </div>

        {snapshot.allowedControls.map((control) => {
          const selectedIndex = Math.max(
            0,
            control.allowedValues.findIndex((value) =>
              value === control.value),
          );
          return (
            <div
              key={control.controlId}
              className="rounded-2xl border border-wb-line bg-wb-soft p-4 sm:p-5"
            >
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <label
                  htmlFor={`reader-control-${control.controlId}`}
                  className="text-sm font-bold text-wb-text"
                >
                  {control.label}
                </label>
                <output className="font-mono text-sm font-bold text-sky-700">
                  {formatNumberV1(control.value)}
                </output>
              </div>
              <input
                id={`reader-control-${control.controlId}`}
                type="range"
                min={0}
                max={control.allowedValues.length - 1}
                step={1}
                value={selectedIndex}
                aria-label={control.label}
                onChange={(event) => {
                  const next =
                    control.allowedValues[Number(event.target.value)];
                  if (next === undefined) return;
                  try {
                    controller.commitControl(control.parameterKey, next);
                    setControlError(null);
                  } catch (error) {
                    setControlError(errorMessageV1(error));
                  }
                }}
                className="h-2 w-full cursor-pointer accent-sky-400"
              />
              <div
                className="mt-2 flex justify-between font-mono text-[10px] text-wb-subtle"
                aria-hidden="true"
              >
                {control.allowedValues.map((value) => (
                  <span key={value}>{formatNumberV1(value)}</span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-wb-subtle">
                {t("studioAuthorPreview.reader.controlUnit", {
                  unit: control.unit,
                })}
              </p>
            </div>
          );
        })}

        <div
          className={`rounded-xl border px-4 py-3 ${presentationStatus.panelClassName}`}
        >
          <p className="text-xs leading-5">
            {presentationStatus.message}
          </p>
        </div>

        {(snapshot.errorMessage ?? controlError) !== null && (
          <p
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
          >
            {snapshot.errorMessage ?? controlError}
          </p>
        )}
      </div>
    </section>
  );
}

type ReaderPresentationStatusKindV1 =
  | "seed"
  | "running"
  | "updating"
  | "paused"
  | "control-failed"
  | "strict-failed"
  | "failed";

type ReaderPresentationStatusV1 = Readonly<{
  kind: ReaderPresentationStatusKindV1;
  label: string;
  message: string;
  badgeClassName: string;
  panelClassName: string;
}>;

function readerPresentationStatusV1(
  snapshot: ScientificProductReaderExperimentSnapshotV1,
  hasControlError: boolean,
  t: ReturnType<typeof useTranslation>["t"],
): ReaderPresentationStatusV1 {
  const kind: ReaderPresentationStatusKindV1 =
    snapshot.phase === "failed"
      || snapshot.errorMessage !== null
      ? "failed"
      : hasControlError
        ? "control-failed"
        : snapshot.strictActivity === "failed"
          ? "strict-failed"
          : snapshot.phase === "paused"
            ? "paused"
            : snapshot.phase === "updating"
              || snapshot.strictActivity === "running"
              ? "updating"
              : snapshot.phase === "seed"
                ? "seed"
                : "running";
  switch (kind) {
    case "seed":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.seed"),
        message: t("studioAuthorPreview.reader.seedStatus"),
        badgeClassName:
          "border-violet-300 bg-violet-50 text-violet-700",
        panelClassName:
          "border-violet-200 bg-violet-50 text-violet-900",
      });
    case "updating":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.updating"),
        message: t("studioAuthorPreview.reader.updatingStatus"),
        badgeClassName:
          "border-sky-300 bg-sky-50 text-sky-700",
        panelClassName:
          "border-sky-200 bg-sky-50 text-sky-900",
      });
    case "paused":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.paused"),
        message: t("studioAuthorPreview.reader.pausedStatus"),
        badgeClassName:
          "border-amber-300 bg-amber-50 text-amber-800",
        panelClassName:
          "border-amber-200 bg-amber-50 text-amber-900",
      });
    case "strict-failed":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.strictFailed"),
        message: t("studioAuthorPreview.reader.strictFailedStatus"),
        badgeClassName:
          "border-amber-300 bg-amber-50 text-amber-800",
        panelClassName:
          "border-amber-200 bg-amber-50 text-amber-900",
      });
    case "control-failed":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.controlRejected"),
        message: t("studioAuthorPreview.reader.controlRejectedStatus"),
        badgeClassName:
          "border-amber-300 bg-amber-50 text-amber-800",
        panelClassName:
          "border-amber-200 bg-amber-50 text-amber-900",
      });
    case "failed":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.runtimeFailed"),
        message: t("studioAuthorPreview.reader.runtimeFailedStatus"),
        badgeClassName:
          "border-red-300 bg-red-50 text-red-700",
        panelClassName:
          "border-red-200 bg-red-50 text-red-900",
      });
    case "running":
      return Object.freeze({
        kind,
        label: t("studioAuthorPreview.reader.running"),
        message: t("studioAuthorPreview.reader.runningStatus"),
        badgeClassName:
          "border-emerald-300 bg-emerald-50 text-emerald-700",
        panelClassName:
          "border-emerald-200 bg-emerald-50 text-emerald-900",
      });
  }
}

function formatNumberV1(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1,
  }).format(value);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

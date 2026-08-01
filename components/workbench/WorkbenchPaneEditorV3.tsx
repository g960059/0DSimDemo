import React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Trash2,
  X,
} from "lucide-react";

import type {
  ExperimentSurfaceControlItemV2,
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceGraphSeriesV2,
  ExperimentSurfaceOutputItemV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import type {
  GraphDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  controlLabelV3,
  graphSeriesColorV3,
  graphSeriesLabelV3,
  graphTitleV3,
  outputLabelV3,
  WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3,
  WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3,
} from "./WorkbenchSurfaceV3";

const FOCUSABLE_SELECTOR_V3 = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const CANONICAL_COLOR_HEX_V3 = /^#[0-9a-f]{6}$/;

export type WorkbenchPaneIdentityV3 = Readonly<{
  kind: "graph" | "output" | "control";
  paneId: string;
}>;

export type WorkbenchPaneEditorStringsV3 = Readonly<{
  close: string;
  color: string;
  controlCatalog: string;
  deletePane: string;
  emptyCatalog: string;
  graphCatalog: string;
  label: string;
  noConfigurableSeries: string;
  outputCatalog: string;
  paneKinds: Readonly<Record<WorkbenchPaneIdentityV3["kind"], string>>;
  seriesCatalog: string;
  title: string;
  windowSec: string;
  windowSecHint: string;
}>;

export const DEFAULT_WORKBENCH_PANE_EDITOR_STRINGS_V3:
WorkbenchPaneEditorStringsV3 = Object.freeze({
  close: "Close pane settings",
  color: "Color",
  controlCatalog: "Parameters",
  deletePane: "Delete pane",
  emptyCatalog: "No registered items are available.",
  graphCatalog: "Graph",
  label: "Label",
  noConfigurableSeries: "This graph owns its structural axes and has no configurable series.",
  outputCatalog: "Outputs",
  paneKinds: Object.freeze({
    control: "Parameter pane",
    graph: "Waveform pane",
    output: "Output pane",
  }),
  seriesCatalog: "Waveform series",
  title: "Pane settings",
  windowSec: "Waveform window",
  windowSecHint: "1–6 seconds in 0.5 second steps",
});

type AnySurfacePaneV3 =
  | ExperimentSurfaceGraphPaneV2
  | ExperimentSurfaceOutputPaneV2
  | ExperimentSurfaceControlPaneV2;

export function canonicalWorkbenchColorHexV3(
  value: string,
  fallback = "#64748b",
): string {
  const candidate = value.toLowerCase();
  return CANONICAL_COLOR_HEX_V3.test(candidate)
    ? candidate
    : fallback.toLowerCase();
}

export function findWorkbenchSurfacePaneV3(
  surface: ExperimentSurfaceV2,
  selectedPane: WorkbenchPaneIdentityV3,
): AnySurfacePaneV3 | undefined {
  return paneCollectionV3(surface, selectedPane.kind)
    .find(({ paneId }) => paneId === selectedPane.paneId);
}

export function updateWorkbenchSurfacePaneV3(
  surface: ExperimentSurfaceV2,
  selectedPane: WorkbenchPaneIdentityV3,
  update: (pane: AnySurfacePaneV3) => AnySurfacePaneV3,
): ExperimentSurfaceV2 {
  const key = paneCollectionKeyV3(selectedPane.kind);
  const collection = surface[key];
  let found = false;
  const nextCollection = collection.map((pane) => {
    if (pane.paneId !== selectedPane.paneId) return pane;
    found = true;
    return update(pane as AnySurfacePaneV3) as never;
  });
  if (!found) return surface;
  return {
    ...surface,
    [key]: nextCollection,
  };
}

export function selectWorkbenchGraphV3(
  surface: ExperimentSurfaceV2,
  paneId: string,
  graphId: string,
  contract: ModelContractV2,
): ExperimentSurfaceV2 {
  const graph = contract.graphCatalog.find((candidate) =>
    candidate.graphId === graphId);
  if (graph === undefined) return surface;
  return updateWorkbenchSurfacePaneV3(
    surface,
    { kind: "graph", paneId },
    (pane) => {
      if (pane.role !== "graph") return pane;
      const { windowSec: _previousWindowSec, ...basePane } = pane;
      const previousDefaultLabel = graphTitleV3(pane.graphId);
      return {
        ...basePane,
        label: pane.label === previousDefaultLabel
          ? graphTitleV3(graph.graphId)
          : pane.label,
        graphId: graph.graphId,
        ...(graph.renderer === "sweep"
          ? { windowSec: WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3 }
          : {}),
        series: defaultSeriesForGraphV3(graph, contract),
      };
    },
  );
}

export function addWorkbenchSurfacePaneV3(
  surface: ExperimentSurfaceV2,
  kind: WorkbenchPaneIdentityV3["kind"],
  contract: ModelContractV2,
): Readonly<{
  surface: ExperimentSurfaceV2;
  selectedPane: WorkbenchPaneIdentityV3 | null;
}> {
  const existingPaneIds = new Set([
    ...surface.graphPanes.map(({ paneId }) => paneId),
    ...surface.outputPanes.map(({ paneId }) => paneId),
    ...surface.controlPanes.map(({ paneId }) => paneId),
  ]);
  const paneId = nextPaneIdV3(existingPaneIds, kind);
  const collection = paneCollectionV3(surface, kind);
  const order = nextOrderV3(collection);
  const priority = collection.reduce(
    (highest, pane) => Math.max(highest, pane.priority),
    kind === "graph" ? 50 : kind === "output" ? 40 : 30,
  );

  if (kind === "graph") {
    const graph = preferredNewGraphV3(contract);
    if (graph === undefined) return { surface, selectedPane: null };
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId,
      role: "graph",
      label: graphTitleV3(graph.graphId),
      order,
      priority,
      graphId: graph.graphId,
      ...(graph.renderer === "sweep"
        ? { windowSec: WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3 }
        : {}),
      series: defaultSeriesForGraphV3(graph, contract),
    };
    return {
      surface: { ...surface, graphPanes: [...surface.graphPanes, pane] },
      selectedPane: { kind, paneId },
    };
  }

  if (kind === "output") {
    const pane: ExperimentSurfaceOutputPaneV2 = {
      paneId,
      role: "output",
      label: "Outputs",
      order,
      priority,
      items: contract.outputCatalog.slice(0, 1).map((output) => ({
        outputId: output.outputId,
        label: outputLabelV3(output.outputId),
        order: 0,
      })),
    };
    return {
      surface: { ...surface, outputPanes: [...surface.outputPanes, pane] },
      selectedPane: { kind, paneId },
    };
  }

  const pane: ExperimentSurfaceControlPaneV2 = {
    paneId,
    role: "control",
    label: "Parameters",
    order,
    priority,
    items: contract.controlCatalog.slice(0, 1).map((control) => ({
      controlId: control.controlId,
      label: controlLabelV3(control.controlId),
      order: 0,
    })),
  };
  return {
    surface: { ...surface, controlPanes: [...surface.controlPanes, pane] },
    selectedPane: { kind, paneId },
  };
}

export function deleteWorkbenchSurfacePaneV3(
  surface: ExperimentSurfaceV2,
  selectedPane: WorkbenchPaneIdentityV3,
): Readonly<{
  deleted: boolean;
  surface: ExperimentSurfaceV2;
  nextSelectedPane: WorkbenchPaneIdentityV3 | null;
}> {
  const key = paneCollectionKeyV3(selectedPane.kind);
  const collection = surface[key];
  const remaining = collection.filter(({ paneId }) =>
    paneId !== selectedPane.paneId);
  if (remaining.length === collection.length) {
    return { deleted: false, surface, nextSelectedPane: selectedPane };
  }
  const nextPane = [...remaining].sort(comparePaneOrderV3)[0];
  return {
    deleted: true,
    surface: { ...surface, [key]: remaining },
    nextSelectedPane: nextPane === undefined
      ? null
      : { kind: selectedPane.kind, paneId: nextPane.paneId },
  };
}

export function WorkbenchPaneEditorV3({
  open,
  selectedPane,
  contract,
  surface,
  strings,
  onChange,
  onClose,
  onSelectedPaneChange,
}: Readonly<{
  open: boolean;
  selectedPane: WorkbenchPaneIdentityV3;
  contract: ModelContractV2;
  surface: ExperimentSurfaceV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (surface: ExperimentSurfaceV2) => void;
  onClose: () => void;
  onSelectedPaneChange?: (selectedPane: WorkbenchPaneIdentityV3) => void;
}>) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = window.requestAnimationFrame(() => {
      const initialFocus = dialogRef.current?.querySelector<HTMLElement>(
        "[data-pane-editor-initial-focus]",
      );
      (initialFocus ?? dialogRef.current)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (dialog === null) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR_V3),
      ).filter((element) => !element.hidden && element.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const pane = findWorkbenchSurfacePaneV3(surface, selectedPane);

  const updateSelectedPane = (
    update: (candidate: AnySurfacePaneV3) => AnySurfacePaneV3,
  ) => onChange(updateWorkbenchSurfacePaneV3(surface, selectedPane, update));

  const deletePane = () => {
    const result = deleteWorkbenchSurfacePaneV3(surface, selectedPane);
    if (!result.deleted) return;
    onChange(result.surface);
    if (result.nextSelectedPane === null) {
      onClose();
    } else if (onSelectedPaneChange !== undefined) {
      onSelectedPaneChange(result.nextSelectedPane);
    } else {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 sm:items-center sm:p-4"
      data-testid="workbench-pane-editor-v3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="workbench-sheet-enter flex max-h-[min(88dvh,48rem)] w-full flex-col overflow-hidden rounded-t-2xl bg-wb-panel text-wb-text shadow-2xl outline-none sm:max-w-xl sm:rounded-xl sm:ring-1 sm:ring-wb-line"
      >
        <header className="flex min-h-14 shrink-0 items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-semibold">
              {strings.title}
            </h2>
            <p id={descriptionId} className="text-[11px] text-wb-subtle">
              {strings.paneKinds[selectedPane.kind]}
            </p>
          </div>
          <button
            type="button"
            data-pane-editor-initial-focus
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-wb-muted transition-colors duration-150 hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-5">
          {pane !== undefined && (
            <div className="space-y-6">
              <PanePresentationEditorV3
                label={pane.label}
                strings={strings}
                onLabelChange={(label) => updateSelectedPane((candidate) => ({
                  ...candidate,
                  label,
                }))}
              />

              {pane.role === "graph" && (
                <GraphPaneEditorV3
                  contract={contract}
                  pane={pane}
                  strings={strings}
                  onChange={(nextPane) => updateSelectedPane(() => nextPane)}
                  onSelectGraph={(graphId) => onChange(selectWorkbenchGraphV3(
                    surface,
                    pane.paneId,
                    graphId,
                    contract,
                  ))}
                />
              )}
              {pane.role === "output" && (
                <OutputPaneEditorV3
                  contract={contract}
                  pane={pane}
                  strings={strings}
                  onChange={(nextPane) => updateSelectedPane(() => nextPane)}
                />
              )}
              {pane.role === "control" && (
                <ControlPaneEditorV3
                  contract={contract}
                  pane={pane}
                  strings={strings}
                  onChange={(nextPane) => updateSelectedPane(() => nextPane)}
                />
              )}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end border-t border-wb-line px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-xs font-medium text-wb-muted hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={pane === undefined}
            title={strings.deletePane}
            onClick={deletePane}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {strings.deletePane}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function PanePresentationEditorV3({
  label,
  strings,
  onLabelChange,
}: Readonly<{
  label: string;
  strings: WorkbenchPaneEditorStringsV3;
  onLabelChange: (label: string) => void;
}>) {
  return (
    <div className="grid grid-cols-1">
      <CommitTextInputV3
        label={strings.label}
        value={label}
        onCommit={onLabelChange}
      />
    </div>
  );
}

function GraphPaneEditorV3({
  contract,
  pane,
  strings,
  onChange,
  onSelectGraph,
}: Readonly<{
  contract: ModelContractV2;
  pane: ExperimentSurfaceGraphPaneV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
  onSelectGraph: (graphId: string) => void;
}>) {
  const graph = contract.graphCatalog.find(({ graphId }) =>
    graphId === pane.graphId);
  return (
    <section className="space-y-4">
      <EditorSectionHeadingV3>{strings.graphCatalog}</EditorSectionHeadingV3>
      <select
        value={pane.graphId}
        className="min-h-10 w-full rounded-lg bg-wb-soft px-3 text-sm outline-none ring-1 ring-transparent focus:ring-wb-accent"
        onChange={(event) => onSelectGraph(event.target.value)}
      >
        {contract.graphCatalog.map((definition) => (
          <option key={definition.graphId} value={definition.graphId}>
            {graphTitleV3(definition.graphId)}
          </option>
        ))}
      </select>

      {graph !== undefined && graph.renderer !== "structural-return" ? (
        <>
          {graph.renderer === "sweep" && (
            <div className="grid gap-1.5">
              <CommitNumberInputV3
                label={strings.windowSec}
                value={pane.windowSec ?? WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3}
                minimum={WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3}
                maximum={WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3}
                step={WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3}
                onCommit={(windowSec) => onChange({ ...pane, windowSec })}
              />
              <p className="text-[10px] text-wb-subtle">{strings.windowSecHint}</p>
            </div>
          )}
          <CatalogSelectionV3
            title={strings.seriesCatalog}
            emptyText={strings.emptyCatalog}
            entries={graph.seriesCatalog.map((series) => {
              const selectedItem = pane.series.find(({ seriesId }) =>
                seriesId === series.seriesId);
              return {
                id: series.seriesId,
                defaultLabel: graphSeriesLabelV3(series.seriesId),
                label: selectedItem?.label,
                colorHex: selectedItem?.colorHex,
                selected: selectedItem !== undefined,
                disableDeselect: selectedItem !== undefined
                  && pane.series.length === 1,
              };
            })}
            strings={strings}
            onToggle={(seriesId) => {
              const existing = pane.series.find((series) =>
                series.seriesId === seriesId);
              if (existing !== undefined) {
                if (pane.series.length === 1) return;
                onChange({
                  ...pane,
                  series: pane.series.filter((series) =>
                    series.seriesId !== seriesId),
                });
                return;
              }
              const next: ExperimentSurfaceGraphSeriesV2 = {
                seriesId,
                label: graphSeriesLabelV3(seriesId),
                colorHex: graphSeriesColorV3(seriesId),
                order: nextOrderV3(pane.series),
              };
              onChange({ ...pane, series: [...pane.series, next] });
            }}
            onLabelChange={(seriesId, label) => onChange({
              ...pane,
              series: pane.series.map((series) => series.seriesId === seriesId
                ? { ...series, label }
                : series),
            })}
            onColorChange={(seriesId, colorHex) => onChange({
              ...pane,
              series: pane.series.map((series) => series.seriesId === seriesId
                ? { ...series, colorHex }
                : series),
            })}
          />
        </>
      ) : (
        <p className="rounded-lg bg-wb-soft px-3 py-3 text-xs leading-5 text-wb-muted">
          {strings.noConfigurableSeries}
        </p>
      )}
    </section>
  );
}

function OutputPaneEditorV3({
  contract,
  pane,
  strings,
  onChange,
}: Readonly<{
  contract: ModelContractV2;
  pane: ExperimentSurfaceOutputPaneV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceOutputPaneV2) => void;
}>) {
  return (
    <CatalogSelectionV3
      title={strings.outputCatalog}
      emptyText={strings.emptyCatalog}
      entries={contract.outputCatalog.map((output) => {
        const selectedItem = pane.items.find(({ outputId }) =>
          outputId === output.outputId);
        return {
          id: output.outputId,
          defaultLabel: outputLabelV3(output.outputId),
          label: selectedItem?.label,
          selected: selectedItem !== undefined,
          disableDeselect: false,
        };
      })}
      strings={strings}
      onToggle={(outputId) => {
        const existing = pane.items.find((item) => item.outputId === outputId);
        if (existing !== undefined) {
          onChange({
            ...pane,
            items: pane.items.filter((item) => item.outputId !== outputId),
          });
          return;
        }
        const next: ExperimentSurfaceOutputItemV2 = {
          outputId,
          label: outputLabelV3(outputId),
          order: nextOrderV3(pane.items),
        };
        onChange({ ...pane, items: [...pane.items, next] });
      }}
      onLabelChange={(outputId, label) => onChange({
        ...pane,
        items: pane.items.map((item) => item.outputId === outputId
          ? { ...item, label }
          : item),
      })}
    />
  );
}

function ControlPaneEditorV3({
  contract,
  pane,
  strings,
  onChange,
}: Readonly<{
  contract: ModelContractV2;
  pane: ExperimentSurfaceControlPaneV2;
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: ExperimentSurfaceControlPaneV2) => void;
}>) {
  return (
    <CatalogSelectionV3
      title={strings.controlCatalog}
      emptyText={strings.emptyCatalog}
      entries={contract.controlCatalog.map((control) => {
        const selectedItem = pane.items.find(({ controlId }) =>
          controlId === control.controlId);
        return {
          id: control.controlId,
          defaultLabel: controlLabelV3(control.controlId),
          label: selectedItem?.label,
          selected: selectedItem !== undefined,
          disableDeselect: false,
        };
      })}
      strings={strings}
      onToggle={(controlId) => {
        const existing = pane.items.find((item) => item.controlId === controlId);
        if (existing !== undefined) {
          onChange({
            ...pane,
            items: pane.items.filter((item) => item.controlId !== controlId),
          });
          return;
        }
        const next: ExperimentSurfaceControlItemV2 = {
          controlId,
          label: controlLabelV3(controlId),
          order: nextOrderV3(pane.items),
        };
        onChange({ ...pane, items: [...pane.items, next] });
      }}
      onLabelChange={(controlId, label) => onChange({
        ...pane,
        items: pane.items.map((item) => item.controlId === controlId
          ? { ...item, label }
          : item),
      })}
    />
  );
}

type CatalogSelectionEntryV3 = Readonly<{
  id: string;
  defaultLabel: string;
  label: string | undefined;
  colorHex?: string;
  selected: boolean;
  disableDeselect: boolean;
}>;

function CatalogSelectionV3({
  title,
  emptyText,
  entries,
  strings,
  onToggle,
  onLabelChange,
  onColorChange,
}: Readonly<{
  title: string;
  emptyText: string;
  entries: readonly CatalogSelectionEntryV3[];
  strings: WorkbenchPaneEditorStringsV3;
  onToggle: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
  onColorChange?: (id: string, colorHex: string) => void;
}>) {
  return (
    <section className="space-y-2">
      <EditorSectionHeadingV3>{title}</EditorSectionHeadingV3>
      {entries.length === 0 ? (
        <p className="rounded-lg bg-wb-soft px-3 py-3 text-xs text-wb-muted">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg px-2 py-2 transition-colors ${
                entry.selected ? "bg-wb-active" : "hover:bg-wb-hover"
              }`}
            >
              <div className="flex min-h-9 items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={entry.selected}
                  aria-label={entry.label ?? entry.defaultLabel}
                  disabled={entry.disableDeselect}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-wb-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-not-allowed"
                  onClick={() => onToggle(entry.id)}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                      entry.selected
                        ? "border-wb-accent bg-wb-accent text-white"
                        : "border-wb-line-strong text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                  disabled={entry.disableDeselect}
                  onClick={() => onToggle(entry.id)}
                >
                  <span className="block truncate text-xs font-medium">
                    {entry.label ?? entry.defaultLabel}
                  </span>
                  <span className="block truncate font-mono text-[9px] text-wb-subtle">
                    {entry.id}
                  </span>
                </button>
              </div>
              {entry.selected && entry.label !== undefined && (
                <div className={entry.colorHex !== undefined
                  && onColorChange !== undefined
                  ? "mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pl-10"
                  : "mt-2 grid grid-cols-1 pl-10"}
                >
                  <CommitTextInputV3
                    label={strings.label}
                    value={entry.label}
                    onCommit={(label) => onLabelChange(entry.id, label)}
                  />
                  {entry.colorHex !== undefined && onColorChange !== undefined && (
                    <ColorInputV3
                      label={strings.color}
                      value={entry.colorHex}
                      onChange={(colorHex) => onColorChange(entry.id, colorHex)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommitTextInputV3({
  label,
  value,
  onCommit,
}: Readonly<{
  label: string;
  value: string;
  onCommit: (value: string) => void;
}>) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const nextValue = draft.trim();
    if (nextValue.length === 0) {
      setDraft(value);
      return;
    }
    setDraft(nextValue);
    if (nextValue !== value) onCommit(nextValue);
  };
  return (
    <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <input
        type="text"
        value={draft}
        className="min-h-9 min-w-0 rounded-md bg-wb-soft px-2.5 text-xs text-wb-text outline-none ring-1 ring-transparent focus:ring-wb-accent"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.stopPropagation();
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function CommitNumberInputV3({
  label,
  value,
  minimum,
  maximum,
  step,
  onCommit,
}: Readonly<{
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  onCommit: (value: number) => void;
}>) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const candidate = Number(draft);
    if (!Number.isFinite(candidate)) {
      setDraft(String(value));
      return;
    }
    const steps = Math.round((candidate - minimum) / step);
    const normalized = Math.min(
      maximum,
      Math.max(minimum, minimum + steps * step),
    );
    setDraft(String(normalized));
    if (normalized !== value) onCommit(normalized);
  };
  return (
    <label className="grid min-w-0 gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <input
        type="number"
        min={minimum}
        max={maximum}
        step={step}
        value={draft}
        className="min-h-9 min-w-0 rounded-md bg-wb-soft px-2.5 font-mono text-xs text-wb-text outline-none ring-1 ring-transparent focus:ring-wb-accent"
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            event.stopPropagation();
            setDraft(String(value));
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function ColorInputV3({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  const canonicalValue = canonicalWorkbenchColorHexV3(value);
  return (
    <label className="grid gap-1 text-[10px] font-medium text-wb-subtle">
      <span>{label}</span>
      <span className="flex min-h-9 items-center gap-2 rounded-md bg-wb-soft px-2">
        <input
          type="color"
          value={canonicalValue}
          className="h-5 w-5 cursor-pointer appearance-none overflow-hidden rounded border-0 bg-transparent p-0"
          onChange={(event) => onChange(canonicalWorkbenchColorHexV3(
            event.target.value,
            canonicalValue,
          ))}
        />
        <span className="font-mono text-[10px] text-wb-muted">
          {canonicalValue}
        </span>
      </span>
    </label>
  );
}

function EditorSectionHeadingV3({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
      {children}
    </h3>
  );
}

function defaultSeriesForGraphV3(
  graph: GraphDefinitionV2,
  _contract: ModelContractV2,
): readonly ExperimentSurfaceGraphSeriesV2[] {
  if (graph.renderer === "structural-return") return [];
  return graph.defaultSeriesIds.map((seriesId, order) => ({
    seriesId,
    label: graphSeriesLabelV3(seriesId),
    colorHex: graphSeriesColorV3(seriesId),
    order,
  }));
}

function preferredNewGraphV3(
  contract: ModelContractV2,
): GraphDefinitionV2 | undefined {
  const hasScalarOutput = contract.outputCatalog.some(({ shape }) =>
    shape === "scalar");
  return contract.graphCatalog.find((graph) =>
    graph.renderer === "structural-return"
    || graph.renderer === "pressure-volume"
    || hasScalarOutput);
}

function nextPaneIdV3(
  existingPaneIds: ReadonlySet<string>,
  kind: WorkbenchPaneIdentityV3["kind"],
): string {
  let suffix = 1;
  while (existingPaneIds.has(`${kind}-custom-${suffix}`)) suffix += 1;
  return `${kind}-custom-${suffix}`;
}

function nextOrderV3(items: readonly Readonly<{ order: number }>[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.order), -1) + 1;
}

function paneCollectionKeyV3(
  kind: WorkbenchPaneIdentityV3["kind"],
): "graphPanes" | "outputPanes" | "controlPanes" {
  if (kind === "graph") return "graphPanes";
  if (kind === "output") return "outputPanes";
  return "controlPanes";
}

function paneCollectionV3(
  surface: ExperimentSurfaceV2,
  kind: WorkbenchPaneIdentityV3["kind"],
): readonly AnySurfacePaneV3[] {
  return surface[paneCollectionKeyV3(kind)];
}

function comparePaneOrderV3(
  left: Readonly<{ paneId: string; order: number }>,
  right: Readonly<{ paneId: string; order: number }>,
): number {
  if (left.order !== right.order) return left.order - right.order;
  return left.paneId.localeCompare(right.paneId);
}

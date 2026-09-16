import React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useAppTheme } from "@/appTheme";
import type {
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import type {
  GraphDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import { STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1 } from "@/studio/presentation/StudioItemPresentationCatalogV1";
import {
  CommitTextInputV3,
  ControlItemPresentationEditorV3,
  ControlItemPreviewV3,
  updateWorkbenchGraphTraceCustomColorV3,
  type WorkbenchPaneEditorStringsV3,
} from "./WorkbenchPaneEditorV3";
import { WorkbenchPaneBindingEditorV3 } from "./WorkbenchPaneBindingV3";
import type { WorkbenchPaneSelectionEntryV3 } from "./WorkbenchPaneSelectionV3";
import { changeWorkbenchOutputMethodV3 } from "./WorkbenchPaneSelectionV3";
import { studioOutputMeasurementFamilyV1 } from "@/studio/presentation/StudioOutputMeasurementMethodsV1";
import type { WorkbenchSurfacePaneV3 } from "./WorkbenchSurfacePaneOperationsV3";
import { resolveWorkbenchGraphTraceStyleV3 } from "./presentation/WorkbenchGraphColorV3";
import { WorkbenchItemDescriptionPopoverV3 } from "./presentation/WorkbenchItemDescriptionPopoverV3";

const iconClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-25";
const memberIds = (id: string) =>
  STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.find((s) => s.presentationId === id)
    ?.memberOutputIds ?? [id];

export function renameWorkbenchPaneItemV3(
  pane: WorkbenchSurfacePaneV3,
  id: string,
  label: string,
): WorkbenchSurfacePaneV3 {
  if (pane.role === "graph")
    return {
      ...pane,
      series: pane.series.map((item) =>
        item.seriesId === id ? { ...item, label } : item,
      ),
    };
  if (pane.role === "control")
    return {
      ...pane,
      items: pane.items.map((item) =>
        item.controlId === id ? { ...item, label } : item,
      ),
    };
  return {
    ...pane,
    items: pane.items.map((item) =>
      memberIds(id).includes(item.outputId) ? { ...item, label } : item,
    ),
  };
}

export function reorderWorkbenchPaneItemsV3(
  pane: WorkbenchSurfacePaneV3,
  ids: readonly string[],
): WorkbenchSurfacePaneV3 {
  const order = <T extends { order: number }>(
    items: readonly T[],
    keys: readonly string[],
    key: (item: T) => string,
  ) =>
    [...items]
      .sort((a, b) => keys.indexOf(key(a)) - keys.indexOf(key(b)))
      .map((item, index) => ({ ...item, order: index }));
  if (pane.role === "graph")
    return {
      ...pane,
      series: order(pane.series, ids, (item) => item.seriesId),
    };
  if (pane.role === "control")
    return { ...pane, items: order(pane.items, ids, (item) => item.controlId) };
  return {
    ...pane,
    items: order(pane.items, ids.flatMap(memberIds), (item) => item.outputId),
  };
}

/** One row vocabulary across panes; only graph rows own trace color/visibility. */
export function WorkbenchPaneItemRowsV3({
  pane,
  contract,
  entries,
  scenarios,
  surface,
  strings,
  locale,
  onChange,
  onRemove,
  onAddMethod,
  onAdd,
}: Readonly<{
  pane: WorkbenchSurfacePaneV3;
  contract: ModelContractV2;
  entries: readonly WorkbenchPaneSelectionEntryV3[];
  scenarios: readonly {
    scenarioId: string;
    label: string;
    visible?: boolean;
  }[];
  surface: ExperimentSurfaceV2;
  strings: WorkbenchPaneEditorStringsV3;
  locale: "en" | "ja";
  onChange: (pane: WorkbenchSurfacePaneV3) => void;
  onRemove: (id: string) => void;
  onAddMethod: (id: string) => void;
  onAdd: () => void;
}>) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const dragged = React.useRef<string | null>(null);
  const selected = entries
    .filter((e) => e.selected)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const move = (id: string, targetId: string) => {
    const ids = selected.map((e) => e.id),
      from = ids.indexOf(id),
      to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    onChange(reorderWorkbenchPaneItemsV3(pane, ids));
  };
  const graph =
    pane.role === "graph"
      ? contract.graphCatalog.find((g) => g.graphId === pane.graphId)
      : undefined;
  return (
    <div className="space-y-1" data-testid="pane-selected-items-v3">
      {selected.map((entry, index) => {
        const open = expanded === entry.id;
        const family = pane.role === "output" ? studioOutputMeasurementFamilyV1(entry.id) : undefined;
        const methods = family?.methods.filter(method => contract.outputCatalog.some(output => output.outputId === method.outputId)) ?? [];
        const alternative = pane.role === "output" ? methods.find(method => !pane.items.some(item => item.outputId === method.outputId)) : undefined;
        const control =
          pane.role === "control"
            ? pane.items.find((item) => item.controlId === entry.id)
            : undefined;
        const definition = contract.controlCatalog.find(
          (item) => item.controlId === entry.id,
        );
        const trigger = {
          "aria-expanded": open,
          "aria-controls": `pane-item-detail-${pane.paneId}-${entry.id}`,
          className:
            "flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded px-1 text-left text-sm focus-visible:ring-2 focus-visible:ring-wb-accent",
          onClick: () => setExpanded(open ? null : entry.id),
        };
        const title = (
          <>
            <span className="min-w-0 flex-1 break-words">
              {entry.label}
              {entry.detail && (
                <span className="ml-2 text-[10px] text-wb-subtle">
                  {entry.detail}
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-wb-subtle ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </>
        );
        return (
          <section
            key={entry.id}
            data-selected-item-id={entry.id}
            className="rounded-lg border border-wb-line/60"
            onDragOver={(event) => {
              if (dragged.current) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged.current) move(dragged.current, entry.id);
              dragged.current = null;
            }}
          >
            <div className="flex min-h-11 items-center gap-0.5 px-1">
              <span
                draggable
                onDragStart={(event) => {
                  dragged.current = entry.id;
                  event.dataTransfer.setData("text/plain", entry.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  dragged.current = null;
                }}
                className="cursor-grab px-1 text-wb-subtle"
                title={strings.reorderItem}
              >
                <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {entry.presentation.description ? (
                <WorkbenchItemDescriptionPopoverV3
                  ariaLabel={
                    entry.detail
                      ? `${entry.label} (${entry.detail})`
                      : entry.label
                  }
                  description={entry.presentation.description}
                  triggerProps={trigger}
                >
                  {title}
                </WorkbenchItemDescriptionPopoverV3>
              ) : (
                <button type="button" {...trigger}>
                  {title}
                </button>
              )}
              <button
                type="button"
                className={iconClass}
                aria-label={`${strings.moveUp}: ${entry.label}`}
                disabled={index === 0}
                onClick={() => move(entry.id, selected[index - 1]!.id)}
              >
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconClass}
                aria-label={`${strings.moveDown}: ${entry.label}`}
                disabled={index === selected.length - 1}
                onClick={() => move(entry.id, selected[index + 1]!.id)}
              >
                <ArrowDown className="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconClass}
                aria-label={`${strings.removeItem}: ${entry.label}`}
                onClick={() => {
                  onRemove(entry.id);
                  if (open) setExpanded(null);
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            {open && (
              <div
                id={`pane-item-detail-${pane.paneId}-${entry.id}`}
                className="space-y-3 border-t border-wb-line/60 bg-wb-soft/40 p-3"
              >
                <CommitTextInputV3
                  label={strings.label}
                  value={entry.label}
                  onCommit={(label) =>
                    onChange(renameWorkbenchPaneItemV3(pane, entry.id, label))
                  }
                />
                {pane.role === "output" && family && methods.length > 1 && (
                  <div className="space-y-2" data-testid="output-method-settings-v3">
                    <label className="block space-y-1 text-xs text-wb-muted">
                      <span>{family.settingLabel[locale]}</span>
                      <select
                        id={`pane-output-method-${pane.paneId}-${entry.id}`}
                        value={entry.id}
                        className="block min-h-10 w-full rounded-md border border-wb-line bg-wb-panel px-2 text-base text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent sm:text-sm"
                        onChange={event => {
                          const nextId = event.target.value;
                          onChange(changeWorkbenchOutputMethodV3(pane, entry.id, nextId));
                          setExpanded(nextId);
                          requestAnimationFrame(() => document.getElementById(`pane-output-method-${pane.paneId}-${nextId}`)?.focus({ preventScroll: true }));
                        }}
                      >
                        {methods.map(method => <option key={method.outputId} value={method.outputId}
                          disabled={method.outputId !== entry.id && pane.items.some(item => item.outputId === method.outputId)}>
                          {method.label[locale]}
                        </option>)}
                      </select>
                    </label>
                    <p className="text-xs leading-relaxed text-wb-muted">{entry.presentation.description}</p>
                    {alternative && <button type="button"
                      className="inline-flex min-h-9 items-center gap-1 rounded px-1 text-left text-xs text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
                      onClick={() => onAddMethod(alternative.outputId)}>
                      <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {locale === "ja" ? `「${alternative.label.ja}」も追加して比較` : `Also compare ${alternative.label.en.toLowerCase()}`}
                    </button>}
                  </div>
                )}
                {pane.role === "graph" && graph && (
                  <WorkbenchTraceRowsV3
                    pane={pane}
                    graph={graph}
                    seriesId={entry.id}
                    scenarios={scenarios}
                    surface={surface}
                    strings={strings}
                    locale={locale}
                    onChange={onChange}
                  />
                )}
                {pane.role === "control" && control && definition && (
                  <>
                    <ControlItemPresentationEditorV3
                      definition={definition}
                      item={control}
                      strings={strings}
                      onChange={(item) =>
                        onChange({
                          ...pane,
                          items: pane.items.map((old) =>
                            old.controlId === item.controlId ? item : old,
                          ),
                        })
                      }
                    />
                    <div className="space-y-2">
                      <p className="text-[10px] text-wb-subtle">
                        {strings.preview}
                      </p>
                      <ControlItemPreviewV3
                        definition={definition}
                        item={control}
                        label={entry.label}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {strings.addCatalogItem}
      </button>
    </div>
  );
}

export function WorkbenchTraceRowsV3({
  pane,
  graph,
  seriesId,
  scenarios,
  surface,
  strings,
  locale,
  onChange,
}: Readonly<{
  pane: ExperimentSurfaceGraphPaneV2;
  graph: GraphDefinitionV2;
  seriesId: string | null;
  scenarios: readonly {
    scenarioId: string;
    label: string;
    visible?: boolean;
  }[];
  surface: ExperimentSurfaceV2;
  strings: WorkbenchPaneEditorStringsV3;
  locale: "en" | "ja";
  onChange: (pane: ExperimentSurfaceGraphPaneV2) => void;
}>) {
  const { appTheme } = useAppTheme();
  const colorInputRefs = React.useRef(new Map<string, HTMLInputElement>());
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))",
      }}
      role="group"
      aria-label={
        locale === "ja"
          ? "Scenarioごとの表示と色"
          : "Visibility and color by scenario"
      }
      data-testid="pane-trace-rows-v3"
    >
      {scenarios.map((scenario, scenarioIndex) => {
        const trace = pane.traceColors?.find(
          (trace) =>
            trace.scenarioId === scenario.scenarioId &&
            trace.seriesId === seriesId,
        );
        const color = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface,
          renderer: graph.renderer,
          authoredScenarioCount: scenarios.length,
          scenarioId: scenario.scenarioId,
          scenarioIndex,
          seriesId,
          seriesIndex: [...pane.series]
            .sort((a, b) => a.order - b.order)
            .findIndex((s) => s.seriesId === seriesId),
          appTheme,
        }).color;
        const excluded = pane.excludedTraces.some(
          (trace) =>
            trace.scenarioId === scenario.scenarioId &&
            trace.seriesId === seriesId,
        );
        const globallyHidden = scenario.visible === false;
        return (
          <div
            key={scenario.scenarioId}
            data-scenario-id={scenario.scenarioId}
            className="flex min-w-0 items-center gap-0.5 rounded-md border border-wb-line px-1"
          >
            <button
              type="button"
              aria-pressed={!excluded}
              aria-label={`${scenario.label}: ${locale === "ja" ? "この項目を表示" : "Show this item"}`}
              title={scenario.label}
              className={`flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded py-1 text-left text-xs hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent ${excluded ? "text-wb-subtle" : "text-wb-text"}`}
              onClick={() => {
                const retained = pane.excludedTraces.filter(
                  (trace) =>
                    trace.scenarioId !== scenario.scenarioId ||
                    trace.seriesId !== seriesId,
                );
                onChange({
                  ...pane,
                  excludedTraces: excluded
                    ? retained
                    : [
                        ...retained,
                        { scenarioId: scenario.scenarioId, seriesId },
                      ],
                });
              }}
            >
              {excluded ? (
                <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Eye
                  className="h-3.5 w-3.5 shrink-0 text-wb-subtle"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 break-words">
                <span
                  className={`line-clamp-2 ${excluded ? "line-through" : ""}`}
                >
                  {scenario.label}
                </span>
                {globallyHidden && (
                  <span className="block text-[10px] text-wb-subtle">
                    {locale === "ja"
                      ? "全グラフで非表示"
                      : "Hidden in all graphs"}
                  </span>
                )}
              </span>
            </button>
            <label className="relative inline-flex h-9 w-7 shrink-0 items-center justify-center rounded hover:bg-wb-hover focus-within:ring-2 focus-within:ring-wb-accent">
              <span
                className="h-4 w-4 rounded-full border border-wb-line"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <input
                type="color"
                ref={(element) => {
                  if (element)
                    colorInputRefs.current.set(scenario.scenarioId, element);
                  else colorInputRefs.current.delete(scenario.scenarioId);
                }}
                aria-label={`${scenario.label}: ${locale === "ja" ? "色" : "Color"}`}
                value={color}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(event) =>
                  onChange(
                    updateWorkbenchGraphTraceCustomColorV3(pane, {
                      scenarioId: scenario.scenarioId,
                      seriesId,
                      colorHex: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <span className="w-7 shrink-0">
              {trace?.customColorHex !== undefined && (
                <button
                  type="button"
                  className="flex h-9 w-7 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text focus-visible:ring-2 focus-visible:ring-wb-accent"
                  aria-label={`${strings.resetColor}: ${scenario.label}`}
                  onClick={() => {
                    onChange(
                      updateWorkbenchGraphTraceCustomColorV3(pane, {
                        scenarioId: scenario.scenarioId,
                        seriesId,
                        colorHex: null,
                      }),
                    );
                    colorInputRefs.current
                      .get(scenario.scenarioId)
                      ?.focus({ preventScroll: true });
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function WorkbenchPaneTargetV3({
  pane,
  scenarios,
  strings,
  onChange,
}: Readonly<{
  pane: Exclude<WorkbenchSurfacePaneV3, ExperimentSurfaceGraphPaneV2>;
  scenarios: readonly { scenarioId: string; label: string }[];
  strings: WorkbenchPaneEditorStringsV3;
  onChange: (pane: WorkbenchSurfacePaneV3) => void;
}>) {
  return (
    <WorkbenchPaneBindingEditorV3
      activeLabel={strings.activeSlotBinding}
      fixedLabel={strings.fixedBinding}
      groupLabel={strings.bindingSection}
      activeDescription={
        pane.role === "output"
          ? strings.outputActiveSlotBindingHint
          : strings.activeSlotBindingHint
      }
      fixedDescription={
        pane.role === "output"
          ? strings.outputFixedBindingHint
          : strings.fixedBindingHint
      }
      allowMultipleFixed={pane.role === "control"}
      mode={pane.binding.mode}
      scenarios={scenarios}
      fixedScenarioIds={
        pane.binding.mode === "fixed"
          ? "scenarioId" in pane.binding
            ? [pane.binding.scenarioId]
            : pane.binding.scenarioIds
          : []
      }
      onChange={(mode, ids) =>
        onChange(
          pane.role === "output"
            ? {
                ...pane,
                binding:
                  mode === "active-slot"
                    ? { mode }
                    : { mode, scenarioId: ids[0]! },
              }
            : {
                ...pane,
                binding:
                  mode === "active-slot"
                    ? { mode }
                    : { mode, scenarioIds: ids },
              },
        )
      }
    />
  );
}

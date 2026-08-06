import React from "react";

export type WorkbenchScenarioTraceIdentityV3 = Readonly<{
  scenarioId: string;
  scenarioLabel: string;
  scenarioStatus?: string;
  scenarioColor?: string;
  /** Stable ordinal in the Experiment Scenario order. */
  scenarioStyleIndex?: number;
}>;

export type WorkbenchTraceLegendDescriptorV3 = Readonly<{
  traceKey: string;
  scenarioId: string;
  scenarioLabel: string;
  itemId: string;
  itemLabel: string;
  color: string;
}>;

export type WorkbenchChartLegendSelectionV3 =
  | Readonly<{ kind: "scenario"; scenarioId: string }>
  | Readonly<{ kind: "item"; itemId: string }>
  | Readonly<{ kind: "trace"; traceKey: string }>;

export type WorkbenchTraceLegendModelV3 = Readonly<{
  mode: "items" | "scenarios" | "groups";
  scenarios: readonly Readonly<{
    scenarioId: string;
    label: string;
    color: string;
  }>[];
  items: readonly Readonly<{
    itemId: string;
    label: string;
  }>[];
  traces: readonly WorkbenchTraceLegendDescriptorV3[];
}>;

export function workbenchHistoryAlphaV3(
  historyIndex: number,
  historyCount: number,
): number {
  if (
    !Number.isSafeInteger(historyIndex)
    || !Number.isSafeInteger(historyCount)
    || historyCount <= 0
    || historyIndex < 0
    || historyIndex >= historyCount
  ) return 0;
  const recency01 = historyCount === 1
    ? 1
    : historyIndex / (historyCount - 1);
  return 0.08 + recency01 * 0.12;
}

export function workbenchTraceLegendKeyV3(
  scenarioId: string,
  itemId: string,
): string {
  return `${scenarioId}\u001f${itemId}`;
}

export function buildWorkbenchTraceLegendModelV3(
  descriptors: readonly WorkbenchTraceLegendDescriptorV3[],
): WorkbenchTraceLegendModelV3 {
  const seenTraceKeys = new Set<string>();
  const traces = descriptors.filter(({ traceKey }) => {
    if (seenTraceKeys.has(traceKey)) return false;
    seenTraceKeys.add(traceKey);
    return true;
  });
  const scenarioById = new Map<
    string,
    WorkbenchTraceLegendModelV3["scenarios"][number]
  >();
  const itemById = new Map<
    string,
    WorkbenchTraceLegendModelV3["items"][number]
  >();
  for (const trace of traces) {
    if (!scenarioById.has(trace.scenarioId)) {
      scenarioById.set(trace.scenarioId, Object.freeze({
        scenarioId: trace.scenarioId,
        label: trace.scenarioLabel,
        color: trace.color,
      }));
    }
    if (!itemById.has(trace.itemId)) {
      itemById.set(trace.itemId, Object.freeze({
        itemId: trace.itemId,
        label: trace.itemLabel,
      }));
    }
  }
  const scenarios = Object.freeze([...scenarioById.values()]);
  const items = Object.freeze([...itemById.values()]);
  const mode = scenarios.length <= 1
    ? "items"
    : items.length <= 1
      ? "scenarios"
      : "groups";
  return Object.freeze({
    mode,
    scenarios,
    items,
    traces: Object.freeze(traces),
  });
}

export function workbenchLegendSelectionMatchesTraceV3(
  selection: WorkbenchChartLegendSelectionV3 | null,
  trace: WorkbenchTraceLegendDescriptorV3,
): boolean {
  if (selection === null) return true;
  if (selection.kind === "scenario") {
    return selection.scenarioId === trace.scenarioId;
  }
  if (selection.kind === "item") return selection.itemId === trace.itemId;
  return selection.traceKey === trace.traceKey;
}

export function workbenchLegendTraceAlphaV3(
  selection: WorkbenchChartLegendSelectionV3 | null,
  trace: WorkbenchTraceLegendDescriptorV3,
): number {
  return workbenchLegendSelectionMatchesTraceV3(selection, trace) ? 1 : 0.28;
}

export function workbenchLegendTraceHiddenV3(
  hiddenSelections: readonly WorkbenchChartLegendSelectionV3[],
  trace: WorkbenchTraceLegendDescriptorV3,
): boolean {
  return hiddenSelections.some((selection) =>
    workbenchLegendSelectionMatchesTraceV3(selection, trace));
}

export function WorkbenchChartLegendV3({
  model,
  hiddenSelections = [],
  selection,
  onHoverSelection,
  onToggleSelection,
  onToggleVisibility,
}: Readonly<{
  model: WorkbenchTraceLegendModelV3;
  hiddenSelections?: readonly WorkbenchChartLegendSelectionV3[];
  selection: WorkbenchChartLegendSelectionV3 | null;
  onHoverSelection: (selection: WorkbenchChartLegendSelectionV3 | null) => void;
  onToggleSelection: (selection: WorkbenchChartLegendSelectionV3) => void;
  onToggleVisibility?: (selection: WorkbenchChartLegendSelectionV3) => void;
}>) {
  if (model.traces.length === 0) return null;
  const traceByPair = new Map(model.traces.map((trace) => [
    workbenchTraceLegendKeyV3(trace.scenarioId, trace.itemId),
    trace,
  ]));
  const commonClassName =
    "pointer-events-auto inline-flex min-h-5 items-center gap-1 whitespace-nowrap rounded-sm px-0.5 text-[11px] leading-4 text-wb-muted outline-none transition-[color,opacity] duration-150 hover:text-wb-text focus-visible:ring-1 focus-visible:ring-wb-accent";
  const selectionClassName = (candidate: WorkbenchChartLegendSelectionV3) =>
    selection === null || legendSelectionsEqualV3(selection, candidate)
      ? "opacity-100"
      : "opacity-45";
  const visibilityClassName = (candidate: WorkbenchChartLegendSelectionV3) =>
    hiddenSelections.some((hidden) => legendSelectionsEqualV3(hidden, candidate))
      ? "line-through opacity-40"
      : "";
  const interactionProps = (candidate: WorkbenchChartLegendSelectionV3) => ({
    onPointerEnter: () => onHoverSelection(candidate),
    onFocus: () => onHoverSelection(candidate),
    onBlur: () => onHoverSelection(null),
    onClick: () => onToggleVisibility === undefined
      ? onToggleSelection(candidate)
      : onToggleVisibility(candidate),
    "aria-pressed": onToggleVisibility === undefined
      ? selection !== null && legendSelectionsEqualV3(selection, candidate)
      : hiddenSelections.some((hidden) =>
          legendSelectionsEqualV3(hidden, candidate)),
  });

  if (model.mode === "items") {
    const scenario = model.scenarios[0];
    return (
      <div
        className="pointer-events-none flex min-h-7 flex-none flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pt-1.5"
        data-chart-legend="items"
        onPointerLeave={() => onHoverSelection(null)}
      >
        {model.items.map((item) => {
          const trace = scenario === undefined
            ? undefined
            : traceByPair.get(
                workbenchTraceLegendKeyV3(scenario.scenarioId, item.itemId),
              );
          if (trace === undefined) return null;
          const candidate = Object.freeze({
            kind: "item" as const,
            itemId: item.itemId,
          });
          return (
            <button
              key={trace.traceKey}
              type="button"
              className={`${commonClassName} ${selectionClassName(candidate)} ${visibilityClassName(candidate)}`}
              {...interactionProps(candidate)}
            >
              <LegendLineV3 color={trace.color} />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (model.mode === "scenarios") {
    const item = model.items[0];
    return (
      <div
        className="pointer-events-none flex min-h-7 flex-none flex-wrap items-center gap-x-3 gap-y-0.5 px-3 pt-1.5"
        data-chart-legend="scenarios"
        onPointerLeave={() => onHoverSelection(null)}
      >
        {model.scenarios.map((scenario) => {
          const trace = item === undefined
            ? undefined
            : traceByPair.get(
                workbenchTraceLegendKeyV3(scenario.scenarioId, item.itemId),
              );
          if (trace === undefined) return null;
          const candidate = Object.freeze({
            kind: "scenario" as const,
            scenarioId: scenario.scenarioId,
          });
          return (
            <button
              key={scenario.scenarioId}
              type="button"
              className={`${commonClassName} ${selectionClassName(candidate)} ${visibilityClassName(candidate)}`}
              {...interactionProps(candidate)}
            >
              <LegendLineV3 color={trace.color} />
              {scenario.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none flex flex-none flex-wrap items-center gap-x-5 gap-y-1 px-3 pt-1.5 text-[11px] leading-4 text-wb-muted"
      data-chart-legend="groups"
      onPointerLeave={() => onHoverSelection(null)}
    >
      {model.scenarios.map((scenario) => {
          const scenarioSelection = Object.freeze({
            kind: "scenario" as const,
            scenarioId: scenario.scenarioId,
          });
          return (
            <div
              key={scenario.scenarioId}
              className="pointer-events-auto inline-flex min-w-0 items-center gap-2"
            >
            <button
              type="button"
              className={`${commonClassName} min-w-0 max-w-36 justify-start ${selectionClassName(scenarioSelection)} ${visibilityClassName(scenarioSelection)}`}
              {...interactionProps(scenarioSelection)}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />
              <span className="truncate">{scenario.label}</span>
            </button>
            <span aria-hidden="true" className="text-wb-muted/60">·</span>
            {model.items.map((item) => {
              const trace = traceByPair.get(
                workbenchTraceLegendKeyV3(scenario.scenarioId, item.itemId),
              );
              if (trace === undefined) return null;
              const traceSelection = Object.freeze({
                kind: "item" as const,
                itemId: item.itemId,
              });
              return (
                <button
                  key={trace.traceKey}
                  type="button"
                  aria-label={`${scenario.label}, ${item.label}`}
                  title={`${scenario.label} · ${item.label}`}
                  className={`${commonClassName} justify-center ${selectionClassName(traceSelection)} ${visibilityClassName(traceSelection)}`}
                  {...interactionProps(traceSelection)}
                >
                  <LegendLineV3 color={trace.color} />
                  {item.label}
                </button>
              );
            })}
            </div>
          );
        })}
    </div>
  );
}

function LegendLineV3({ color }: Readonly<{ color: string }>) {
  return (
    <span
      aria-hidden="true"
      className="h-0.5 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function legendSelectionsEqualV3(
  left: WorkbenchChartLegendSelectionV3,
  right: WorkbenchChartLegendSelectionV3,
): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "scenario" && right.kind === "scenario") {
    return left.scenarioId === right.scenarioId;
  }
  if (left.kind === "item" && right.kind === "item") {
    return left.itemId === right.itemId;
  }
  return left.kind === "trace"
    && right.kind === "trace"
    && left.traceKey === right.traceKey;
}

import React from "react";

import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
} from "@/studio/contracts/v2/content";

export const WORKBENCH_SCENARIO_LINE_DASHES_V3 = Object.freeze([
  Object.freeze([]),
  Object.freeze([7, 4]),
  Object.freeze([2, 3]),
  Object.freeze([8, 3, 2, 3]),
] as const);

export type WorkbenchScenarioTraceIdentityV3 = Readonly<{
  scenarioId: string;
  scenarioLabel: string;
  scenarioStatus?: string;
  /**
   * Stable ordinal in the Experiment Scenario order. Omit only when the
   * descriptor order itself is stable (the first Scenario is rendered solid).
   */
  scenarioStyleIndex?: number;
}>;

export type WorkbenchScenarioLegendItemV3 = Readonly<{
  scenarioId: string;
  label: string;
  status?: string;
  styleIndex: number;
  lineDash: readonly number[];
}>;

export type WorkbenchTraceColorLegendItemV3 = Readonly<{
  colorKey: string;
  label: string;
  color: string;
}>;

export function workbenchScenarioLineDashV3(
  scenarioStyleIndex: number,
): readonly number[] {
  if (
    !Number.isSafeInteger(scenarioStyleIndex)
    || scenarioStyleIndex < 0
    || scenarioStyleIndex >= STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
  ) {
    throw new RangeError(
      `Scenario style index must be between 0 and ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2 - 1}`,
    );
  }
  return WORKBENCH_SCENARIO_LINE_DASHES_V3[scenarioStyleIndex]!;
}

/**
 * Builds one deterministic Scenario style per Scenario. Explicit Experiment
 * ordinals survive filtering/reordering; otherwise first appearance defines
 * the ordinal so the baseline/first Scenario remains solid.
 */
export function buildWorkbenchScenarioLegendItemsV3(
  traces: readonly WorkbenchScenarioTraceIdentityV3[],
): readonly WorkbenchScenarioLegendItemV3[] {
  const seen = new Set<string>();
  const items: WorkbenchScenarioLegendItemV3[] = [];
  for (const trace of traces) {
    if (seen.has(trace.scenarioId)) continue;
    seen.add(trace.scenarioId);
    const styleIndex = Number.isSafeInteger(trace.scenarioStyleIndex)
      && (trace.scenarioStyleIndex ?? -1) >= 0
      ? trace.scenarioStyleIndex!
      : items.length;
    items.push(Object.freeze({
      scenarioId: trace.scenarioId,
      label: trace.scenarioLabel,
      ...(trace.scenarioStatus === undefined
        ? {}
        : { status: trace.scenarioStatus }),
      styleIndex,
      lineDash: workbenchScenarioLineDashV3(styleIndex),
    }));
  }
  return Object.freeze(items);
}

export function buildWorkbenchTraceColorLegendItemsV3(
  traces: readonly WorkbenchTraceColorLegendItemV3[],
): readonly WorkbenchTraceColorLegendItemV3[] {
  const seen = new Set<string>();
  const items: WorkbenchTraceColorLegendItemV3[] = [];
  for (const trace of traces) {
    if (seen.has(trace.colorKey)) continue;
    seen.add(trace.colorKey);
    items.push(Object.freeze({ ...trace }));
  }
  return Object.freeze(items);
}

export function WorkbenchChartTwoAxisLegendV3({
  colorAxisLabel,
  colorItems,
  scenarioItems,
}: Readonly<{
  colorAxisLabel: string;
  colorItems: readonly WorkbenchTraceColorLegendItemV3[];
  scenarioItems: readonly WorkbenchScenarioLegendItemV3[];
}>) {
  if (colorItems.length === 0 && scenarioItems.length === 0) return null;
  return (
    <div
      className="pointer-events-none absolute left-12 top-2 flex max-w-[calc(100%-4rem)] flex-wrap items-center gap-x-3 gap-y-1 text-[10px] leading-3 text-wb-muted"
      data-chart-legend="color-and-scenario"
    >
      {colorItems.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-wb-subtle">{colorAxisLabel}</span>
          {colorItems.map((item) => (
            <span
              key={item.colorKey}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span
                aria-hidden="true"
                className="h-0.5 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </span>
      )}
      {scenarioItems.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-wb-subtle">Scenario</span>
          {scenarioItems.map((item) => (
            <span
              key={item.scenarioId}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              <WorkbenchLegendDashV3 dash={item.lineDash} />
              <span>{item.label}</span>
              {item.status !== undefined && item.status.length > 0 && (
                <span className="text-wb-subtle">· {item.status}</span>
              )}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function WorkbenchLegendDashV3({
  dash,
}: Readonly<{ dash: readonly number[] }>) {
  return (
    <svg
      aria-hidden="true"
      className="h-2 w-5 shrink-0 overflow-visible"
      viewBox="0 0 20 8"
    >
      <line
        x1="0"
        x2="20"
        y1="4"
        y2="4"
        stroke="currentColor"
        strokeDasharray={dash.length === 0 ? undefined : dash.join(" ")}
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

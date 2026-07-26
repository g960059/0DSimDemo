import type {
  LegendPosition,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
} from "@/types";
import {
  DEFAULT_PV_LOOP_HISTORY_BEATS,
  DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT,
} from "@/types";
import {
  STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
  type StudioGraphPaneKindV1,
  type StudioGraphPaneSpecV1,
} from "@/studio/contracts/v1";
import {
  scientificObservableShortLabelV1,
  scientificObservableUnitV1,
  scientificSeriesColorV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";
import {
  resolveScientificProductPvTrajectoryV1,
} from "@/components/scientificProduct/ScientificProductPvTrajectoryCatalogV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";

const OBSERVABLE_IDS_V1 = new Set<string>(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
);

export type CaptureStudioGraphPaneSpecV1Input = Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  /**
   * Maps the ephemeral Workbench scenario to the portable Experiment scenario.
   * Only mapped, visible scenarios enter the captured pane.
   */
  scenarioIdMap: ReadonlyMap<string, string>;
}>;

/**
 * Resolves a live Workbench pane into a detached portable presentation.
 *
 * This intentionally captures effective labels and colors instead of the
 * lossy GraphViewSpec membership projection.
 */
export function captureStudioGraphPaneSpecV1({
  panel,
  registry,
  scenarioIdMap,
}: CaptureStudioGraphPaneSpecV1Input): StudioGraphPaneSpecV1 {
  const kind = studioGraphPaneKindForPanelV1(panel.type);
  if (kind === null) {
    throw new Error(`Panel ${panel.id} is not a capturable graph pane`);
  }
  const unmappedVisibleScenarioIds = Object.entries(panel.config).flatMap(
    ([sourceScenarioId, config]) => {
      const runtime = registry.getPresentation(sourceScenarioId);
      return config.visible === true
          && runtime?.descriptor.isVisible === true
          && !scenarioIdMap.has(sourceScenarioId)
        ? [sourceScenarioId]
        : [];
    },
  );
  if (unmappedVisibleScenarioIds.length > 0) {
    throw new Error(
      `Panel ${panel.id} has visible scenarios without article mappings: `
      + unmappedVisibleScenarioIds.join(", "),
    );
  }
  const scenarios = Object.entries(panel.config).flatMap(
    ([sourceScenarioId, config]) => {
      const targetScenarioId = scenarioIdMap.get(sourceScenarioId);
      const runtime = registry.getPresentation(sourceScenarioId);
      if (
        targetScenarioId === undefined
        || runtime === null
        || !runtime.descriptor.isVisible
        || config.visible !== true
      ) return [];
      const label = config.customName ?? runtime.descriptor.name;
      const color = config.customBaseColor ?? runtime.descriptor.color;
      const items = kind === "guyton-left" || kind === "guyton-right"
        ? []
        : config.selectedSignals.map((itemId, index) => {
          const pvTrajectory = kind === "pv-loop"
            ? resolveScientificProductPvTrajectoryV1(
                runtime.workspaceDocument,
                itemId,
              )
            : null;
          if (kind === "pv-loop" && pvTrajectory === null) {
            throw new Error(
              `Panel ${panel.id} PV-loop item ${itemId} is not supported `
              + `by scenario ${sourceScenarioId}'s workspace`,
            );
          }
          if (kind === "waveform" && !OBSERVABLE_IDS_V1.has(itemId)) {
            throw new Error(
              `Panel ${panel.id} waveform item ${itemId} is not in the `
              + "scientific observable catalog",
            );
          }
          return {
            itemId,
            label:
              config.customSignalNames?.[itemId]
              ?? pvTrajectory?.label
              ?? effectiveItemLabelV1(kind, itemId, config),
            unit: observableUnitV1(itemId),
            color: scientificSeriesColorV1(
              color,
              `${itemId}:${index}`,
              config.customSignalColors?.[itemId],
            ),
          };
        });
      return [{
        scenarioId: targetScenarioId,
        label,
        color,
        items,
      }];
    },
  );
  if (scenarios.length === 0) {
    throw new Error(`Panel ${panel.id} has no capturable visible scenario`);
  }
  const graphView =
    panel.view?.kind === "graph" ? panel.view : undefined;
  const legendPosition = graphView?.legendPosition;
  const parameterHistoryCount =
    (
      panel as PanelDef & Readonly<{ pvParameterHistoryCount?: number }>
    ).pvParameterHistoryCount
    ?? (
      graphView as typeof graphView
        & Readonly<{ pvParameterHistoryCount?: number }>
    )?.pvParameterHistoryCount;

  return deepFreezeStudioPaneV1({
    schemaId: STUDIO_GRAPH_PANE_V1_SCHEMA_ID,
    paneId: panel.sourceViewId ?? panel.id,
    title: panel.title,
    kind,
    scenarios,
    presentation: {
      showLegend: panel.showLegend
        ?? graphView?.showLegend
        ?? true,
      legendPosition: legendPosition === undefined
        ? null
        : normalizedLegendPositionV1(legendPosition),
      showGuides: panel.showGuides
        ?? graphView?.showGuides
        ?? (kind === "pv-loop"),
      timeWindowMs: kind === "waveform"
        ? panel.timeWindow ?? graphView?.timeWindow ?? 2_000
        : null,
      pvBeatHistoryCount: kind === "pv-loop"
        ? panel.pvHistoryBeats
          ?? graphView?.pvHistoryBeats
          ?? DEFAULT_PV_LOOP_HISTORY_BEATS
        : null,
      pvBeatHistoryMode: kind === "pv-loop"
        ? panel.pvHistoryMode ?? graphView?.pvHistoryMode ?? "fade"
        : null,
      pvParameterHistoryCount: kind === "pv-loop"
        ? parameterHistoryCount ?? DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT
        : null,
      pvRelationDisplayMode: kind === "pv-loop"
        ? panel.pvRelationDisplayMode
          ?? graphView?.pvRelationDisplayMode
          ?? "off"
        : null,
      pvRelationPressureBasis: kind === "pv-loop"
        ? panel.pvRelationPressureBasis
          ?? graphView?.pvRelationPressureBasis
          ?? "intracavitary"
        : null,
      pvRelationShowSamplePoints: kind === "pv-loop"
        ? panel.pvRelationShowSamplePoints
          ?? graphView?.pvRelationShowSamplePoints
          ?? false
        : null,
      hemodynamicDetailMode:
        kind === "guyton-left" || kind === "guyton-right"
          ? panel.hemodynamicDetailMode
            ?? graphView?.hemodynamicDetailMode
            ?? "compare"
          : null,
      hemodynamicParameterHistoryCount:
        kind === "guyton-left" || kind === "guyton-right"
          ? panel.hemodynamicParameterHistoryCount
            ?? graphView?.hemodynamicParameterHistoryCount
            ?? 5
          : null,
      hemodynamicAllowNegativeFillingPressure:
        kind === "guyton-left" || kind === "guyton-right"
          ? panel.hemodynamicAllowNegativeFillingPressure
            ?? graphView?.hemodynamicAllowNegativeFillingPressure
            ?? false
          : null,
    },
  });
}

/** Reconstructs the exact read-only pane consumed by the shared renderer. */
export function panelFromStudioGraphPaneSpecV1(
  pane: StudioGraphPaneSpecV1,
): PanelDef {
  const type = panelTypeForStudioGraphPaneKindV1(pane.kind);
  const config = Object.fromEntries(pane.scenarios.map((scenario) => [
    scenario.scenarioId,
    {
      visible: true,
      selectedSignals: scenario.items.map(({ itemId }) => itemId),
      customBaseColor: scenario.color,
      customName: scenario.label,
      customSignalColors: Object.fromEntries(
        scenario.items.map(({ itemId, color }) => [itemId, color]),
      ),
      customSignalNames: Object.fromEntries(
        scenario.items.map(({ itemId, label }) => [itemId, label]),
      ),
    } satisfies PanelInstanceConfig,
  ]));
  const graphType = pane.kind === "pv-loop"
    ? "pvloop"
    : pane.kind;
  const panel: PanelDef & { pvParameterHistoryCount?: number } = {
    id: pane.paneId,
    sourceViewId: pane.paneId,
    type,
    title: pane.title,
    role: "graph",
    zone: "main",
    w: 12,
    h: pane.kind === "waveform" ? 5 : 8,
    config,
    view: {
      kind: "graph",
      graphType,
      showLegend: pane.presentation.showLegend,
      ...(pane.presentation.legendPosition === null
        ? {}
        : { legendPosition: { ...pane.presentation.legendPosition } }),
      showGuides: pane.presentation.showGuides,
      ...(pane.presentation.timeWindowMs === null
        ? {}
        : { timeWindow: pane.presentation.timeWindowMs }),
      ...(pane.presentation.pvBeatHistoryCount === null
        ? {}
        : { pvHistoryBeats: pane.presentation.pvBeatHistoryCount }),
      ...(pane.presentation.pvBeatHistoryMode === null
        ? {}
        : { pvHistoryMode: pane.presentation.pvBeatHistoryMode }),
      ...(pane.presentation.pvRelationDisplayMode === null
        ? {}
        : { pvRelationDisplayMode: pane.presentation.pvRelationDisplayMode }),
      ...(pane.presentation.pvRelationPressureBasis === null
        ? {}
        : {
          pvRelationPressureBasis:
            pane.presentation.pvRelationPressureBasis,
        }),
      ...(pane.presentation.pvRelationShowSamplePoints === null
        ? {}
        : {
          pvRelationShowSamplePoints:
            pane.presentation.pvRelationShowSamplePoints,
        }),
      ...(pane.presentation.hemodynamicDetailMode === null
        ? {}
        : {
          hemodynamicDetailMode:
            pane.presentation.hemodynamicDetailMode,
        }),
      ...(pane.presentation.hemodynamicParameterHistoryCount === null
        ? {}
        : {
          hemodynamicParameterHistoryCount:
            pane.presentation.hemodynamicParameterHistoryCount,
        }),
      ...(pane.presentation.hemodynamicAllowNegativeFillingPressure === null
        ? {}
        : {
          hemodynamicAllowNegativeFillingPressure:
            pane.presentation.hemodynamicAllowNegativeFillingPressure,
        }),
    },
    isSettingsOpen: false,
    showLegend: pane.presentation.showLegend,
    showGuides: pane.presentation.showGuides,
    ...(pane.presentation.timeWindowMs === null
      ? {}
      : { timeWindow: pane.presentation.timeWindowMs }),
    ...(pane.presentation.pvBeatHistoryCount === null
      ? {}
      : { pvHistoryBeats: pane.presentation.pvBeatHistoryCount }),
    ...(pane.presentation.pvBeatHistoryMode === null
      ? {}
      : { pvHistoryMode: pane.presentation.pvBeatHistoryMode }),
    ...(pane.presentation.pvRelationDisplayMode === null
      ? {}
      : { pvRelationDisplayMode: pane.presentation.pvRelationDisplayMode }),
    ...(pane.presentation.pvRelationPressureBasis === null
      ? {}
      : {
        pvRelationPressureBasis: pane.presentation.pvRelationPressureBasis,
      }),
    ...(pane.presentation.pvRelationShowSamplePoints === null
      ? {}
      : {
        pvRelationShowSamplePoints:
          pane.presentation.pvRelationShowSamplePoints,
      }),
    ...(pane.presentation.hemodynamicDetailMode === null
      ? {}
      : {
        hemodynamicDetailMode:
          pane.presentation.hemodynamicDetailMode,
      }),
    ...(pane.presentation.hemodynamicParameterHistoryCount === null
      ? {}
      : {
        hemodynamicParameterHistoryCount:
          pane.presentation.hemodynamicParameterHistoryCount,
      }),
    ...(pane.presentation.hemodynamicAllowNegativeFillingPressure === null
      ? {}
      : {
        hemodynamicAllowNegativeFillingPressure:
          pane.presentation.hemodynamicAllowNegativeFillingPressure,
      }),
  };
  if (pane.presentation.pvParameterHistoryCount !== null) {
    panel.pvParameterHistoryCount =
      pane.presentation.pvParameterHistoryCount;
    (
      panel.view as typeof panel.view
        & { pvParameterHistoryCount?: number }
    ).pvParameterHistoryCount =
      pane.presentation.pvParameterHistoryCount;
  }
  return panel;
}

export function isCapturableStudioGraphPanelV1(
  panel: PanelDef,
): boolean {
  return studioGraphPaneKindForPanelV1(panel.type) !== null;
}

function studioGraphPaneKindForPanelV1(
  type: PanelType,
): StudioGraphPaneKindV1 | null {
  switch (type) {
    case "WAVEFORM":
      return "waveform";
    case "PVLOOP":
      return "pv-loop";
    case "GUYTON_LEFT":
      return "guyton-left";
    case "GUYTON_RIGHT":
      return "guyton-right";
    default:
      return null;
  }
}

function panelTypeForStudioGraphPaneKindV1(
  kind: StudioGraphPaneKindV1,
): PanelType {
  switch (kind) {
    case "waveform":
      return "WAVEFORM";
    case "pv-loop":
      return "PVLOOP";
    case "guyton-left":
      return "GUYTON_LEFT";
    case "guyton-right":
      return "GUYTON_RIGHT";
  }
}

function effectiveItemLabelV1(
  kind: StudioGraphPaneKindV1,
  itemId: string,
  config: PanelInstanceConfig,
): string {
  const custom = config.customSignalNames?.[itemId];
  if (custom !== undefined) return custom;
  if (kind === "waveform" && OBSERVABLE_IDS_V1.has(itemId)) {
    return scientificObservableShortLabelV1(
      itemId as MainWireScientificObservableIdV1,
    );
  }
  return itemId === "lv"
    ? "LV pressure–volume loop"
    : itemId === "rv"
      ? "RV pressure–volume loop"
      : itemId === "la"
        ? "LA pressure–volume loop"
        : itemId === "ra"
          ? "RA pressure–volume loop"
          : itemId;
}

function observableUnitV1(itemId: string): string | null {
  return OBSERVABLE_IDS_V1.has(itemId)
    ? scientificObservableUnitV1(
      itemId as MainWireScientificObservableIdV1,
    )
    : null;
}

function normalizedLegendPositionV1(
  value: LegendPosition,
): LegendPosition {
  return {
    xPct: Math.min(1, Math.max(0, value.xPct)),
    yPct: Math.min(1, Math.max(0, value.yPct)),
  };
}

function deepFreezeStudioPaneV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) {
      deepFreezeStudioPaneV1(child);
    }
    Object.freeze(value);
  }
  return value;
}

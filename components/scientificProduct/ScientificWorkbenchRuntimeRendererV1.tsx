import React from "react";

import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import {
  deriveMainWireScientificMetricsV1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  type MainWireScientificDerivedMetricIdV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificWorkspacePressureVolumeTrajectoryV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import type { AuthoredViewSpec } from "@/features/workbench/authoredViews";
import type {
  WorkbenchRuntimeRenderContext,
  WorkbenchRuntimeRenderer,
} from "@/features/workbench/runtime/WorkbenchRuntimeRenderer";
import type {
  ControllerViewSpec,
  GraphViewSpec,
  MetricsViewSpec,
} from "@/features/workbench/viewSpec";
import type {
  ControllerItem,
  PanelDef,
  PanelInstanceConfig,
  PanelType,
} from "@/types";

import {
  ScientificWorkbenchPvLoopCanvasV1,
  ScientificWorkbenchWaveformCanvasV1,
  scientificObservableShortLabelV1,
  scientificSeriesColorV1,
  type ScientificWorkbenchChartScenarioV1,
  type ScientificWorkbenchPvSeriesV1,
  type ScientificWorkbenchWaveformSeriesV1,
} from "./ScientificWorkbenchAnimatedChartsV1";
import type {
  ScientificWorkbenchDisplayClockV1,
} from "./ScientificWorkbenchDisplayClockV1";
import {
  isScientificControlScaleV1,
  type ScientificProductScenarioPresentationV1,
  type ScientificProductScenarioRegistryV1,
} from "./ScientificProductScenarioRegistryV1";

const OBSERVABLE_IDS = new Set<string>(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1);

const WAVEFORM_ALIASES: Readonly<Record<string,
MainWireScientificObservableIdV1>> = Object.freeze({
  LAP: "hemodynamics.pressure.absolute.LA",
  RAP: "hemodynamics.pressure.absolute.RA",
  LVP: "hemodynamics.pressure.absolute.LV",
  RVP: "hemodynamics.pressure.absolute.RV",
  AoP: "hemodynamics.pressure.absolute.Ao",
  PAP: "hemodynamics.pressure.absolute.PA",
  QMV: "valve.MV.flow",
  QAo: "valve.AoV.flow",
  QTV: "valve.TV.flow",
  QPV: "valve.PV.flow",
  QPA: "valve.PV.flow",
  PVF: "hemodynamics.flow.pulmonary_venous",
  xiMV: "valve.MV.opening_fraction",
  xiAoV: "valve.AoV.opening_fraction",
  xiTV: "valve.TV.opening_fraction",
  xiPV: "valve.PV.opening_fraction",
  Pperi: "pericardium.excess_pressure",
});

const CHAMBERS = Object.freeze(["LA", "RA", "LV", "RV"] as const);
type ScientificChamberV1 = (typeof CHAMBERS)[number];

const METRIC_LABELS: Readonly<Record<MainWireScientificDerivedMetricIdV1,
string>> = Object.freeze({
  "hemodynamics.pressure.mean.LA": "Mean LA pressure",
  "hemodynamics.pressure.mean.RA": "Mean RA pressure",
  "hemodynamics.pressure.mean.Ao": "Mean aortic pressure",
  "hemodynamics.pressure.mean.PA": "Mean pulmonary artery pressure",
  "hemodynamics.volume.excursion.LV": "LV volume excursion",
  "hemodynamics.ejection_fraction.LV": "LV ejection fraction",
  "hemodynamics.volume.excursion.RV": "RV volume excursion",
  "hemodynamics.ejection_fraction.RV": "RV ejection fraction",
  "valve.AoV.cycle_volume.forward": "Aortic forward cycle volume",
  "valve.AoV.cycle_volume.net": "Aortic net cycle volume",
  "valve.AoV.cardiac_output.forward": "Aortic forward cardiac output",
  "valve.AoV.cardiac_output.net": "Aortic net cardiac output",
  "valve.PV.cycle_volume.forward": "Pulmonary forward cycle volume",
  "valve.PV.cycle_volume.net": "Pulmonary net cycle volume",
  "valve.PV.cardiac_output.forward": "Pulmonary forward cardiac output",
  "valve.PV.cardiac_output.net": "Pulmonary net cardiac output",
});

export const SCIENTIFIC_CONTROL_SYSTEMIC_V1 =
  "circulation.systemic-vascular-resistance-scale" as const;
export const SCIENTIFIC_CONTROL_PULMONARY_V1 =
  "circulation.pulmonary-vascular-resistance-scale" as const;

const SCIENTIFIC_CONTROL_SCALE_OPTIONS_V1 = Object.freeze(
  [0.75, 1, 4 / 3].map((value) => Object.freeze({
    value,
    label: `${value.toFixed(2)}×`,
  })),
);

const SCIENTIFIC_CONTROLLER_ITEM_LIST_V1: ControllerItem[] = [
    {
      paramKey: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
      kind: "buttonGroup" as const,
      label: "Systemic vascular resistance",
      options: SCIENTIFIC_CONTROL_SCALE_OPTIONS_V1.map((option) => ({ ...option })),
    },
    {
      paramKey: SCIENTIFIC_CONTROL_PULMONARY_V1,
      kind: "buttonGroup" as const,
      label: "Pulmonary vascular resistance",
      options: SCIENTIFIC_CONTROL_SCALE_OPTIONS_V1.map((option) => ({ ...option })),
    },
  ];
export const SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1:
readonly ControllerItem[] = Object.freeze(SCIENTIFIC_CONTROLLER_ITEM_LIST_V1);

/**
 * The current release exposes three validated, enumerated resistance scales.
 * Authored presentation documents may be older or hand-edited, so the runtime
 * repeats the authoring constraint at the execution surface instead of
 * rendering a continuous slider whose intermediate values the release rejects.
 */
export function scientificControllerItemForReleaseV1(
  item: ControllerItem,
): ControllerItem {
  if (scientificControlKindV1(item.paramKey) === null) return item;
  return {
    ...item,
    kind: "buttonGroup",
    min: 0.75,
    max: 4 / 3,
    step: 1 / 12,
    options: SCIENTIFIC_CONTROL_SCALE_OPTIONS_V1.map((option) => ({ ...option })),
  };
}

/** A new target/descriptor must own a fresh local slider interaction. */
export function scientificControllerInteractionKeyV1(
  scenarioId: string,
  releaseSha256: string,
  item: ControllerItem,
): string {
  return JSON.stringify([
    scenarioId,
    releaseSha256,
    item.paramKey,
    item.kind,
    item.min ?? null,
    item.max ?? null,
    item.step ?? null,
    item.options?.map(({ value }) => value) ?? null,
  ]);
}

export type ScientificWorkbenchRuntimeRendererV1Options = Readonly<{
  registry: ScientificProductScenarioRegistryV1;
  clock: ScientificWorkbenchDisplayClockV1;
}>;

export function createScientificWorkbenchRuntimeRendererV1({
  registry,
  clock,
}: ScientificWorkbenchRuntimeRendererV1Options): WorkbenchRuntimeRenderer {
  const renderPanel = (
    panel: PanelDef,
    context: WorkbenchRuntimeRenderContext,
  ): React.ReactNode | undefined => {
    if (panel.type === "SCENARIOS") return undefined;
    if (panel.type === "CONTROLS") {
      const items = panel.view?.kind === "control"
        ? panel.view.controllerItems ?? []
        : [];
      return (
        <ScientificControllerPanelV1
          registry={registry}
          items={items}
          targetScenarioId={context.activeInstanceId}
        />
      );
    }
    if (panel.type === "METRICS") {
      return (
        <ScientificMetricsPanelV1
          registry={registry}
          selections={metricSelectionsFromPanelV1(panel)}
        />
      );
    }
    if (panel.type === "WAVEFORM" || panel.type === "PVLOOP") {
      return (
        <ScientificGraphPanelV1
          panel={panel}
          registry={registry}
          clock={clock}
        />
      );
    }
    if (
      panel.type === "GUYTON_LEFT"
      || panel.type === "GUYTON_RIGHT"
      || panel.type === "GUYTON_3D"
    ) {
      return (
        <ScientificUnavailablePanelV1
          title="Unavailable for this release"
          detail="The Guyton/Starling release-bound observable contract is not implemented. No legacy Worker is started."
        />
      );
    }
    return undefined;
  };

  return Object.freeze({
    runtimeId: "main-wire-scientific-workbench-runtime-v1",
    renderPanel,
    renderAuthoredView: (
      view: AuthoredViewSpec,
      context: WorkbenchRuntimeRenderContext,
    ): React.ReactNode | undefined => {
      if (view.kind === "controller") {
        return (
          <ScientificControllerPanelV1
            registry={registry}
            items={view.items}
            targetScenarioId={controllerTargetScenarioV1(view, context)}
          />
        );
      }
      if (view.kind === "metrics") {
        return (
          <ScientificMetricsPanelV1
            registry={registry}
            selections={metricSelectionsFromViewV1(view)}
          />
        );
      }
      if (view.kind === "graph") return renderPanel(graphViewToPanel(view), context);
      return undefined;
    },
  });
}

export const SCIENTIFIC_WORKBENCH_SIGNAL_OPTIONS_V1 = Object.freeze([
  "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.RA",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.RV",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.PA",
  "valve.MV.flow",
  "valve.AoV.flow",
  "valve.TV.flow",
  "valve.PV.flow",
  "hemodynamics.flow.pulmonary_venous",
  "valve.MV.opening_fraction",
  "valve.AoV.opening_fraction",
  "valve.TV.opening_fraction",
  "valve.PV.opening_fraction",
  "pericardium.excess_pressure",
] as const);

export const SCIENTIFIC_WORKBENCH_METRIC_OPTIONS_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => metricId),
);

function ScientificGraphPanelV1({
  panel,
  registry,
  clock,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductScenarioRegistryV1;
  clock: ScientificWorkbenchDisplayClockV1;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry);
  const effective = presentations.filter((presentation) =>
    presentation.descriptor.isVisible
    && panel.config[presentation.descriptor.id]?.visible === true);

  if (panel.type === "WAVEFORM") {
    const series = effective.flatMap((presentation) =>
      waveformSeriesForScenarioV1(
        presentation,
        panel.config[presentation.descriptor.id]!,
      ));
    if (series.length === 0) return <NoScientificSelectionV1 />;
    return (
      <div
        className="relative h-full min-h-0 w-full overflow-hidden"
        data-testid={`scientific-workbench-pane-${panel.id}`}
        data-panel-kind="time-series"
      >
        <ScientificWorkbenchWaveformCanvasV1
          series={series}
          timeWindowMs={panel.timeWindow ?? 2_000}
          clock={clock}
          showLegend={panel.showLegend !== false}
        />
      </div>
    );
  }

  const series = effective.flatMap((presentation) =>
    pvSeriesForScenarioV1(
      presentation,
      panel.config[presentation.descriptor.id]!,
    ));
  if (series.length === 0) return <NoScientificSelectionV1 />;
  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden"
      data-testid={`scientific-workbench-pane-${panel.id}`}
      data-panel-kind="pressure-volume"
    >
      <ScientificWorkbenchPvLoopCanvasV1
        series={series}
        clock={clock}
        showLegend={panel.showLegend !== false}
      />
    </div>
  );
}

function ScientificMetricsPanelV1({
  registry,
  selections,
}: Readonly<{
  registry: ScientificProductScenarioRegistryV1;
  selections: Readonly<Record<string, readonly string[]>>;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry)
    .filter(({ descriptor }) => descriptor.isVisible && selections[descriptor.id]);
  const requestedCount = Object.values(selections).flat().length;
  if (requestedCount === 0) {
    return (
      <ScientificUnavailablePanelV1
        title="No metrics selected"
        detail="Add metrics to this view. Empty views remain empty and are never replaced by an implicit default set."
      />
    );
  }
  if (presentations.length === 0) return <NoScientificSelectionV1 />;
  return (
    <div
      className="grid h-full content-start gap-2 overflow-auto p-3 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="scientific-workbench-metrics-v1"
    >
      {presentations.flatMap((presentation) => {
        const evaluation = deriveMainWireScientificMetricsV1(
          presentation.validatedCycle,
        );
        const ids = [...new Set((selections[presentation.descriptor.id] ?? [])
          .map(scientificMetricId)
          .filter((id): id is MainWireScientificDerivedMetricIdV1 => id !== null))];
        return ids.map((metricId) => {
          const definition = MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1
            .find((entry) => entry.metricId === metricId)!;
          const metric = evaluation.values[metricId];
          return (
            <article
              key={`${presentation.descriptor.id}:${metricId}`}
              className="rounded-md border border-wb-line bg-wb-input px-3 py-2"
              data-scenario-id={presentation.descriptor.id}
              data-metric-id={metricId}
              data-availability={metric.availability}
            >
              <p className="truncate text-[10px] font-semibold" style={{ color: presentation.descriptor.color }}>
                {presentation.descriptor.name}
              </p>
              <p className="text-[11px] font-medium text-wb-subtle">
                {METRIC_LABELS[metricId]}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-wb-text">
                {metric.value === null ? "—" : formatMetric(metric.value)}
                {metric.value === null ? "" : ` ${definition.unit}`}
              </p>
              {metric.value === null && (
                <p className="mt-1 text-[10px] text-wb-subtle">
                  {metric.unavailableReason ?? evaluation.cycleUnavailableReason}
                </p>
              )}
            </article>
          );
        });
      })}
    </div>
  );
}

function ScientificControllerPanelV1({
  registry,
  items,
  targetScenarioId,
}: Readonly<{
  registry: ScientificProductScenarioRegistryV1;
  items: readonly ControllerItem[];
  targetScenarioId?: string;
}>) {
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const descriptor = targetScenarioId === undefined
    ? descriptors[0]
    : descriptors.find(({ id }) => id === targetScenarioId);
  const runtime = descriptor === undefined ? null : registry.getRuntime(descriptor.id);
  const snapshot = React.useSyncExternalStore(
    runtime?.controlStore.subscribe ?? EMPTY_SUBSCRIBE,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
  );

  if (descriptor === undefined) {
    return targetScenarioId === undefined
      ? <NoScientificSelectionV1 />
      : (
          <ScientificUnavailablePanelV1
            title="Controller target unavailable"
            detail={`Scenario ${targetScenarioId} is not present. The controller was not rebound to another scenario.`}
          />
        );
  }
  if (runtime === null || snapshot === null) {
    return (
      <ScientificUnavailablePanelV1
        title={descriptor.lifecycle === "failed" ? "Scenario failed" : "Scenario is loading"}
        detail={descriptor.statusMessage}
      />
    );
  }
  if (items.length === 0) {
    return (
      <ScientificUnavailablePanelV1
        title="No controller items"
        detail="Add release-bound controller items to this view. Empty controller views remain empty and are never replaced by implicit controls."
      />
    );
  }
  const actions = runtime.controlStore.actions;
  return (
    <div
      className="absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-transparent"
      data-testid="scientific-transition-controller-v1"
      data-controller-scenario-id={descriptor.id}
      data-phase={snapshot.phase}
      data-mode={snapshot.mode}
      data-owner-connected={String(snapshot.ownerConnected)}
      data-displayed-evidence={snapshot.provenance.displayedEvidence}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-wb-line px-2 py-1.5 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: descriptor.color }} />
        <span className="min-w-0 flex-1 truncate font-semibold text-wb-text">{descriptor.name}</span>
        <span className="truncate text-wb-subtle">{compactPhaseLabelV1(snapshot.phase)}</span>
      </div>
      <div
        className="shrink-0 border-b border-wb-line bg-wb-strip px-2 py-2"
        data-testid="scientific-product-transition-mode-v1"
      >
        <span className="mb-1 block text-[10px] font-semibold text-wb-subtle">
          Transition behavior
        </span>
        <div className="flex gap-1" role="group" aria-label="Transition mode">
          {(["live", "steady"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => actions.setMode(mode)}
              disabled={snapshot.busy || !snapshot.ownerConnected}
              aria-pressed={snapshot.mode === mode}
              className={`flex-1 rounded border px-2 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${snapshot.mode === mode ? "border-wb-accent bg-wb-active text-wb-text" : "border-wb-line text-wb-subtle"}`}
            >
              {mode === "live" ? "Live transition" : "Next steady state"}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="grid gap-2">
          {items.map((item) => {
            const control = scientificControlKindV1(item.paramKey);
            if (control === null) {
              return (
                <div key={item.paramKey} className="rounded border border-dashed border-wb-line px-2 py-1.5 text-[10px] text-wb-subtle">
                  {item.label ?? item.paramKey}: unavailable in release 0.2.0
                </div>
              );
            }
            const value = control === "systemic"
              ? snapshot.draft.systemic
              : snapshot.draft.pulmonary;
            const setDraftScale = control === "systemic"
              ? actions.setSystemicScale
              : actions.setPulmonaryScale;
            const commitScale = control === "systemic"
              ? actions.commitSystemicScale
              : actions.commitPulmonaryScale;
            const releaseItem = scientificControllerItemForReleaseV1(item);
            return (
              <ControllerItemControl
                key={scientificControllerInteractionKeyV1(
                  descriptor.id,
                  descriptor.source.releaseSha256,
                  item,
                )}
                item={releaseItem}
                value={value}
                baseline={1}
                unit="×"
                onChange={(next) => {
                  if (!isScientificControlScaleV1(next)) return;
                  setDraftScale(next);
                }}
                onCommit={(next) => {
                  if (!isScientificControlScaleV1(next)) return;
                  commitScale(next);
                }}
                onOptionCommit={(next) => {
                  if (!isScientificControlScaleV1(next)) return;
                  commitScale(next);
                }}
                onReset={() => {
                  commitScale(1);
                }}
                disabled={snapshot.busy || !snapshot.ownerConnected}
              />
            );
          })}
        </div>
      </div>
      {(snapshot.steadyActive || snapshot.liveActive || snapshot.phase === "failed") && (
        <div className="shrink-0 border-t border-wb-line bg-wb-strip px-2 py-2">
          <div className="flex gap-1">
          {snapshot.steadyActive && (
            <button
              type="button"
              onClick={actions.cancelSteady}
              className="min-h-7 rounded border border-wb-line px-2 text-[11px] text-wb-muted"
            >
              Cancel
            </button>
          )}
          {snapshot.liveActive && (
            <button
              type="button"
              onClick={snapshot.phase === "live-paused" ? actions.resumeLive : actions.pauseLive}
              className="min-h-7 rounded border border-wb-line px-2 text-[11px] text-wb-muted"
            >
              {snapshot.phase === "live-paused" ? "Resume" : "Pause"}
            </button>
          )}
          {(snapshot.liveActive || snapshot.phase === "failed") && (
            <button
              type="button"
              onClick={actions.resetLiveOrFailure}
              className="min-h-7 rounded border border-wb-line px-2 text-[11px] text-wb-muted"
            >
              Reset
            </button>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

function useScientificScenarioPresentationsV1(
  registry: ScientificProductScenarioRegistryV1,
): readonly ScientificProductScenarioPresentationV1[] {
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  React.useSyncExternalStore(
    registry.subscribeFrames,
    registry.getFrameVersionSnapshot,
    registry.getFrameVersionSnapshot,
  );
  return descriptors.flatMap((descriptor) => {
    const presentation = registry.getPresentation(descriptor.id);
    return presentation === null ? [] : [presentation];
  });
}

function waveformSeriesForScenarioV1(
  presentation: ScientificProductScenarioPresentationV1,
  config: PanelInstanceConfig,
): ScientificWorkbenchWaveformSeriesV1[] {
  const observableIds = selectedWaveformObservables(config.selectedSignals ?? []);
  return observableIds.map((observableId, index) => {
    const modelName = config.customName ?? presentation.descriptor.name;
    const signalName = config.customSignalNames?.[observableId]
      ?? scientificObservableShortLabelV1(observableId);
    const color = scientificSeriesColorV1(
      config.customBaseColor ?? presentation.descriptor.color,
      `${observableId}:${index}`,
      config.customSignalColors?.[observableId],
    );
    return {
      key: `${presentation.descriptor.id}:${observableId}`,
      scenario: chartScenarioV1(presentation, modelName),
      observableId,
      signalName,
      color,
    };
  });
}

function pvSeriesForScenarioV1(
  presentation: ScientificProductScenarioPresentationV1,
  config: PanelInstanceConfig,
): ScientificWorkbenchPvSeriesV1[] {
  const catalog = trajectoryCatalogV1(presentation.workspaceDocument);
  const trajectories = selectedPvTrajectories(config.selectedSignals ?? [], catalog);
  return trajectories.map((trajectory, index) => {
    const modelName = config.customName ?? presentation.descriptor.name;
    const signalName = config.customSignalNames?.[trajectory.trajectoryId]
      ?? trajectory.label;
    const color = scientificSeriesColorV1(
      config.customBaseColor ?? presentation.descriptor.color,
      `${trajectory.trajectoryId}:${index}`,
      config.customSignalColors?.[trajectory.trajectoryId],
    );
    return {
      key: `${presentation.descriptor.id}:${trajectory.trajectoryId}`,
      scenario: chartScenarioV1(presentation, modelName),
      volumeObservableId: trajectory.volumeObservableId,
      pressureObservableId: trajectory.pressureObservableId,
      signalName,
      color,
    };
  });
}

function chartScenarioV1(
  presentation: ScientificProductScenarioPresentationV1,
  modelName: string,
): ScientificWorkbenchChartScenarioV1 {
  return Object.freeze({
    id: presentation.descriptor.id,
    name: modelName,
    color: presentation.descriptor.color,
    isVisible: presentation.descriptor.isVisible,
    frames: presentation.frames,
    periodicCycleFrames: presentation.periodicCycleFrames,
    cycleDurationSec: presentation.cycleDurationSec,
    transientOriginAcceptedTimeSec:
      presentation.transientOriginAcceptedTimeSec,
    displayedEvidence: presentation.displayedEvidence,
  });
}

function metricSelectionsFromPanelV1(
  panel: PanelDef,
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(Object.entries(panel.config)
    .filter(([, config]) => config.visible)
    .map(([scenarioId, config]) => [scenarioId, config.selectedSignals ?? []]));
}

function metricSelectionsFromViewV1(
  view: MetricsViewSpec,
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(Object.entries(view.membership).map(
    ([scenarioId, metrics]) => [scenarioId, metrics.length > 0 ? metrics : view.metrics],
  ));
}

function selectedWaveformObservables(
  selected: readonly string[],
): MainWireScientificObservableIdV1[] {
  return [...new Set(selected.flatMap((candidate) => {
    const alias = WAVEFORM_ALIASES[candidate];
    if (alias !== undefined) return [alias];
    return OBSERVABLE_IDS.has(candidate)
      ? [candidate as MainWireScientificObservableIdV1]
      : [];
  }))];
}

function selectedPvTrajectories(
  selected: readonly string[],
  workspaceTrajectories: ReadonlyMap<
  string,
  MainWireScientificWorkspacePressureVolumeTrajectoryV1
  >,
): MainWireScientificWorkspacePressureVolumeTrajectoryV1[] {
  return [...new Map(selected.flatMap((candidate) => {
    const fromWorkspace = workspaceTrajectories.get(candidate);
    if (fromWorkspace !== undefined) {
      return [[fromWorkspace.trajectoryId, fromWorkspace] as const];
    }
    const chamber = CHAMBERS.find((value) => value === candidate.toUpperCase());
    if (chamber === undefined) return [];
    const trajectory = chamberTrajectory(chamber);
    return [[trajectory.trajectoryId, trajectory] as const];
  })).values()];
}

function chamberTrajectory(
  chamber: ScientificChamberV1,
): MainWireScientificWorkspacePressureVolumeTrajectoryV1 {
  return Object.freeze({
    trajectoryId: `${chamber.toLowerCase()}-pressure-volume`,
    label: `${chamber} pressure–volume loop`,
    volumeObservableId: `hemodynamics.volume.${chamber}`,
    pressureObservableId: `hemodynamics.pressure.absolute.${chamber}`,
  });
}

function trajectoryCatalogV1(
  workspace: ScientificProductScenarioPresentationV1["workspaceDocument"],
): ReadonlyMap<string, MainWireScientificWorkspacePressureVolumeTrajectoryV1> {
  return new Map(workspace.content.panels.flatMap(({ view }) =>
    view.kind === "pressure-volume"
      ? view.trajectories.map((trajectory) => [trajectory.trajectoryId, trajectory] as const)
      : []));
}

function graphViewToPanel(view: GraphViewSpec): PanelDef {
  const panelType: PanelType = view.graphType === "pvloop"
    ? "PVLOOP"
    : view.graphType === "waveform"
      ? "WAVEFORM"
      : view.graphType === "guyton-left"
        ? "GUYTON_LEFT"
        : view.graphType === "guyton-right"
          ? "GUYTON_RIGHT"
          : "GUYTON_3D";
  return {
    id: view.id,
    sourceViewId: view.id,
    type: panelType,
    title: view.title ?? "Graph view",
    role: "graph",
    zone: "main",
    w: 4,
    h: 4,
    config: Object.fromEntries(Object.entries(view.membership).map(
      ([scenarioId, selectedSignals]) => [scenarioId, {
        visible: true,
        selectedSignals,
      }],
    )),
    view: {
      kind: "graph",
      graphType: view.graphType,
      showGuides: view.presentation?.showGuides,
      timeWindow: view.presentation?.timeWindow,
      showLegend: view.presentation?.showLegend,
    },
    isSettingsOpen: false,
    showGuides: view.presentation?.showGuides,
    timeWindow: view.presentation?.timeWindow,
    showLegend: view.presentation?.showLegend,
  };
}

function controllerTargetScenarioV1(
  view: ControllerViewSpec,
  context: WorkbenchRuntimeRenderContext,
): string | undefined {
  return view.binding.kind === "scenario"
    ? view.binding.scenarioId
    : context.activeInstanceId ?? context.instances[0]?.id;
}

function scientificControlKindV1(
  paramKey: string,
): "systemic" | "pulmonary" | null {
  if (
    paramKey === SCIENTIFIC_CONTROL_SYSTEMIC_V1
    || paramKey === "systemicVascularResistanceScale"
  ) return "systemic";
  if (
    paramKey === SCIENTIFIC_CONTROL_PULMONARY_V1
    || paramKey === "pulmonaryVascularResistanceScale"
  ) return "pulmonary";
  return null;
}

function scientificMetricId(
  candidate: string,
): MainWireScientificDerivedMetricIdV1 | null {
  const aliases: Readonly<Record<string, MainWireScientificDerivedMetricIdV1>> = {
    ABP: "hemodynamics.pressure.mean.Ao",
    CVP: "hemodynamics.pressure.mean.RA",
    PAP: "hemodynamics.pressure.mean.PA",
    SV: "valve.AoV.cycle_volume.forward",
    CO: "valve.AoV.cardiac_output.forward",
    LVEF: "hemodynamics.ejection_fraction.LV",
    RVEF: "hemodynamics.ejection_fraction.RV",
  };
  if (aliases[candidate] !== undefined) return aliases[candidate];
  return MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.some(
    ({ metricId }) => metricId === candidate,
  ) ? candidate as MainWireScientificDerivedMetricIdV1 : null;
}

function compactPhaseLabelV1(phase: string): string {
  if (phase === "idle") return "Ready";
  if (phase.includes("paused")) return "Live paused";
  if (phase.startsWith("live")) return "Live transition";
  if (phase.startsWith("steady")) return "Finding steady state";
  if (phase === "failed" || phase === "reload-required") return "Attention required";
  return phase;
}

function formatMetric(value: number): string {
  const magnitude = Math.abs(value);
  return value.toFixed(magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2);
}

function ScientificUnavailablePanelV1({
  title,
  detail,
}: Readonly<{ title: string; detail: string }>) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center p-4">
      <div className="max-w-md rounded-md border border-dashed border-wb-line bg-wb-strip px-4 py-3 text-sm">
        <p className="font-semibold text-wb-muted">{title}</p>
        <p className="mt-1 text-xs leading-5 text-wb-subtle">{detail}</p>
      </div>
    </div>
  );
}

function NoScientificSelectionV1() {
  return (
    <ScientificUnavailablePanelV1
      title="No visible scientific signal"
      detail="Enable a scenario for this pane and choose a release-bound signal. Unavailable values are never replaced with zero."
    />
  );
}

const EMPTY_SUBSCRIBE = (_listener: () => void): (() => void) => () => undefined;
const EMPTY_CONTROL_SNAPSHOT = () => null;

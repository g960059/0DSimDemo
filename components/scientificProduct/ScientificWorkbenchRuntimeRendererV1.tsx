import React from "react";
import { useTranslation } from "react-i18next";

import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import { shouldEnableLegendInteractions } from "@/components/InteractiveGraphLegend";
import {
  deriveMainWireScientificMetricsV1,
  deriveMainWireScientificTransientBeatMetricsV1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  type MainWireScientificCompleteTransientBeatV1,
  type MainWireScientificDerivedMetricEvaluationV1,
  type MainWireScientificDerivedMetricIdV1,
  type MainWireScientificValidatedTerminalCycleV1,
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
import type {
  ScientificWorkbenchResearchControlDraftV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";

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
  type ScientificProductScenarioPresentationV1,
  type ScientificProductHemodynamicProtocolKindV1,
  type ScientificProductHemodynamicProtocolPresentationV1,
  type ScientificProductScenarioRegistryV1,
} from "./ScientificProductScenarioRegistryV1";
import {
  ScientificGuytonLeftPaneV1,
  ScientificGuytonRightPaneV1,
  ScientificPvRelationPaneV1,
  type ScientificGuytonStarlingPaneDataV1,
  type ScientificGuytonSweepPointV1,
  type ScientificPvRelationPaneDataV1,
  type ScientificPvPointV1,
} from "./ScientificHemodynamicProtocolPanesV1";
import type {
  MainWireScientificGuytonStarlingProtocolResultV1,
  MainWireScientificPvRelationsProtocolResultV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type {
  MainWireScientificGuytonStarlingProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  scientificWorkbenchMetricPresentationV1,
} from "./ScientificWorkbenchMetricPresentationV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  type MainWireScientificResearchControlIdV0,
} from "@/engine/scientific/controls";

const OBSERVABLE_IDS = new Set<string>(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_IDS_V1);
const METRIC_EVALUATION_BY_CYCLE_V1 = new WeakMap<
  object,
  MainWireScientificDerivedMetricEvaluationV1
>();

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

export const SCIENTIFIC_CONTROL_SYSTEMIC_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[0];
export const SCIENTIFIC_CONTROL_PULMONARY_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[1];
export const SCIENTIFIC_CONTROL_VENOUS_TONE_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[2];
export const SCIENTIFIC_CONTROL_ARTERIAL_STIFFNESS_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[3];
export const SCIENTIFIC_CONTROL_PEEP_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[4];
export const SCIENTIFIC_CONTROL_PERICARDIAL_FLUID_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[5];

export const SCIENTIFIC_CONTROL_SCALE_OPTIONS_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.map((value) => Object.freeze({
    value,
    label: `${value.toFixed(2)}×`,
  })),
);
const SCIENTIFIC_CONTROL_PRESENTATION_V1 = Object.freeze({
  [SCIENTIFIC_CONTROL_SYSTEMIC_V1]: Object.freeze({
    label: "Systemic resistance scale",
    description:
      "Scales the grouped systemic-circulation resistance edges in this model; it is not a directly measured SVR value.",
    unit: "×",
    optionLabel: (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}×`,
  }),
  [SCIENTIFIC_CONTROL_PULMONARY_V1]: Object.freeze({
    label: "Pulmonary resistance scale",
    description:
      "Scales the grouped pulmonary-circulation resistance edges in this model; it is a dimensionless model factor, not PVR in Wood units or a pulmonary-hypertension diagnosis.",
    unit: "×",
    optionLabel: (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}×`,
  }),
  [SCIENTIFIC_CONTROL_VENOUS_TONE_V1]: Object.freeze({
    label: "Venous tone",
    description:
      "Shifts the systemic venous compartments' unstressed volume; it is not a direct central-venous-pressure setting.",
    unit: "",
    optionLabel: (value: number) => String(value),
  }),
  [SCIENTIFIC_CONTROL_ARTERIAL_STIFFNESS_V1]: Object.freeze({
    label: "Arterial PV stiffness",
    description:
      "Scales the systemic and pulmonary arterial pressure–volume stiffness coefficients; it is not a direct pulse-wave-velocity measurement.",
    unit: "",
    optionLabel: (value: number) => String(value),
  }),
  [SCIENTIFIC_CONTROL_PEEP_V1]: Object.freeze({
    label: "PEEP boundary",
    description:
      "Applies a static positive airway-pressure boundary to the circulation model; it is not a full ventilator simulation.",
    unit: "cmH₂O",
    optionLabel: (value: number) => `${value}`,
  }),
  [SCIENTIFIC_CONTROL_PERICARDIAL_FLUID_V1]: Object.freeze({
    label: "Pericardial occupancy",
    description:
      "Adds a fixed pericardial occupancy volume against the model's fixed healthy pericardial capacity; it does not simulate accumulation rate, remodeling, or diagnose tamponade.",
    unit: "mL",
    optionLabel: (value: number) => `${value}`,
  }),
} satisfies Readonly<Record<MainWireScientificResearchControlIdV0,
Readonly<{
  label: string;
  description: string;
  unit: string;
  optionLabel: (value: number) => string;
}>>>);

const SCIENTIFIC_CONTROLLER_ITEM_LIST_V1: ControllerItem[] =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.map((controlId) =>
    controllerItemForControlIdV1(controlId));
export const SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1:
readonly ControllerItem[] = Object.freeze(SCIENTIFIC_CONTROLLER_ITEM_LIST_V1);
export const SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1:
readonly ControllerItem[] = Object.freeze(
  SCIENTIFIC_CONTROLLER_ITEM_LIST_V1.slice(0, 4),
);
export const SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1:
readonly ControllerItem[] = Object.freeze(
  SCIENTIFIC_CONTROLLER_ITEM_LIST_V1.slice(4),
);

/**
 * The current release exposes only catalog-enumerated, release-bound values.
 * Authored presentation documents may be older or hand-edited, so the runtime
 * repeats the authoring constraint at the execution surface. Each slider uses
 * the catalog's exact research anchors and never emits an unowned intermediate
 * runtime value.
 */
export function scientificControllerItemForReleaseV1(
  item: ControllerItem,
): ControllerItem {
  const controlId = scientificControlKindV1(item.paramKey);
  return controlId === null ? item : controllerItemForControlIdV1(controlId);
}

function controllerItemForControlIdV1(
  controlId: MainWireScientificResearchControlIdV0,
): ControllerItem {
  const domain = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
    controlId
  ];
  const presentation = SCIENTIFIC_CONTROL_PRESENTATION_V1[controlId];
  const values = domain.allowedValues as readonly number[];
  return {
    paramKey: controlId,
    kind: "slider",
    label: presentation.label,
    min: values[0]!,
    max: values.at(-1)!,
    step: minimumPositiveGapV1(values),
    options: values.map((value) => ({
      value,
      label: presentation.optionLabel(value),
    })),
  };
}

function minimumPositiveGapV1(values: readonly number[]): number {
  let result = Infinity;
  for (let index = 1; index < values.length; index += 1) {
    result = Math.min(result, values[index]! - values[index - 1]!);
  }
  return Number.isFinite(result) && result > 0 ? result : 1;
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
          renderContext={context}
        />
      );
    }
    if (
      panel.type === "GUYTON_LEFT"
      || panel.type === "GUYTON_RIGHT"
      || panel.type === "PV_RELATIONS"
    ) {
      return (
        <ScientificHemodynamicProtocolPanelV1
          panel={panel}
          registry={registry}
          activeScenarioId={context.activeInstanceId}
        />
      );
    }
    if (
      panel.type === "GUYTON_3D"
    ) {
      return (
        <ScientificUnavailablePanelV1
          title="A TBV-only surface would be misleading"
          detail="Total blood volume defines a one-dimensional preload locus, not a CVP–PCWP surface. A future surface requires a second independently controlled coordinate such as venous tone."
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
  renderContext,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductScenarioRegistryV1;
  clock: ScientificWorkbenchDisplayClockV1;
  renderContext: WorkbenchRuntimeRenderContext;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry);
  const effective = presentations.filter((presentation) =>
    presentation.descriptor.isVisible
    && panel.config[presentation.descriptor.id]?.visible === true);
  const legendInteraction = {
    panelId: panel.id,
    interactive: shouldEnableLegendInteractions({
      canConfigure: renderContext.canConfigure,
      presentationMode: renderContext.presentationMode,
    }),
    onOpenSettings: renderContext.onOpenSettings,
    legendPosition: renderContext.legendPosition
      ?? (panel.view?.kind === "graph" ? panel.view.legendPosition : undefined),
    onLegendPositionChange: renderContext.onLegendPositionChange,
    ariaLabel: `Open ${panel.title} pane settings`,
  };

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
          legendInteraction={legendInteraction}
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
        historyBeats={panel.pvHistoryBeats ?? (panel.view?.kind === "graph" ? panel.view.pvHistoryBeats : undefined) ?? 8}
        historyMode={panel.pvHistoryMode ?? (panel.view?.kind === "graph" ? panel.view.pvHistoryMode : undefined) ?? "fade"}
        legendInteraction={legendInteraction}
      />
    </div>
  );
}

function ScientificHemodynamicProtocolPanelV1({
  panel,
  registry,
  activeScenarioId,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductScenarioRegistryV1;
  activeScenarioId?: string;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry);
  const eligible = presentations.filter(({ descriptor }) =>
    descriptor.isVisible && panel.config[descriptor.id]?.visible === true);
  const selected = eligible.find(({ descriptor }) =>
    descriptor.id === activeScenarioId) ?? eligible[0];
  const kind: ScientificProductHemodynamicProtocolKindV1 =
    panel.type === "PV_RELATIONS" ? "pv-relations" : "guyton-starling";
  const protocol = useScientificHemodynamicProtocolV1(
    registry,
    selected?.descriptor.id ?? null,
    kind,
  );
  const periodicSourceAvailable = selected !== undefined
    && selected.displayedEvidence !== "open-transient-no-periodic-claim";
  const latestDisplayedFrame = selected?.frames.at(-1);
  const protocolMatchesDisplayedSource = protocol.sourceIdentity !== null
    && latestDisplayedFrame !== undefined
    && protocol.sourceIdentity.revision === latestDisplayedFrame.revision
    && Math.abs(
      protocol.sourceIdentity.acceptedTimeSec
      - latestDisplayedFrame.acceptedTimeSec,
    ) <= 1e-10;
  React.useEffect(() => {
    if (
      selected === undefined
      || !periodicSourceAvailable
      || protocol.status === "error"
    ) return;
    registry.requestHemodynamicProtocol(selected.descriptor.id, kind);
  }, [kind, periodicSourceAvailable, protocol.status, registry, selected]);

  if (selected === undefined) return <NoScientificSelectionV1 />;
  if (!periodicSourceAvailable) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center p-5">
        <div className="max-w-lg text-center">
          <p className="text-sm font-semibold text-wb-text">
            Protocol waits for a periodic source
          </p>
          <p className="mt-2 text-xs leading-5 text-wb-subtle">
            The live transition remains visible in ordinary waveforms. This
            multi-beat protocol starts after the next accepted periodic state,
            so transient frames are not relabelled as steady evidence.
          </p>
        </div>
      </div>
    );
  }
  if (
    protocol.status === "complete"
    && !protocolMatchesDisplayedSource
  ) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center p-5 text-center text-xs text-wb-subtle">
        Updating the protocol for the new periodic source…
      </div>
    );
  }
  const rerun = () => registry.requestHemodynamicProtocol(
    selected.descriptor.id,
    kind,
  );
  if (protocol.status === "error") {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center p-5">
        <div className="max-w-lg text-center">
          <p className="text-sm font-semibold text-rose-300">
            Hemodynamic protocol did not complete
          </p>
          <p className="mt-2 text-xs leading-5 text-wb-subtle">
            {protocol.errorMessage ?? "Unknown protocol error."}
          </p>
          <button
            type="button"
            onClick={rerun}
            className="mt-4 rounded border border-wb-accent/50 bg-wb-accent/10 px-3 py-1.5 text-xs font-semibold text-wb-accent hover:bg-wb-accent/15"
          >
            Run again
          </button>
        </div>
      </div>
    );
  }

  const scenarioName = selected.descriptor.name;
  if (kind === "guyton-starling") {
    const result = protocol.result?.protocolId
      === "main-wire-scientific-guyton-starling-protocol-v1"
      || protocol.result?.protocolId
        === "main-wire-scientific-guyton-starling-protocol-v2"
      ? protocol.result as MainWireScientificGuytonStarlingProtocolResultV1
        | MainWireScientificGuytonStarlingProtocolResultV2
      : null;
    const data = guytonPaneDataV1(
      panel.type === "GUYTON_LEFT" ? "left" : "right",
      scenarioName,
      protocol,
      result,
    );
    return panel.type === "GUYTON_LEFT"
      ? <ScientificGuytonLeftPaneV1 data={data} />
      : <ScientificGuytonRightPaneV1 data={data} />;
  }
  const result = protocol.result?.protocolId
    === "main-wire-scientific-pv-relations-protocol-v1"
    ? protocol.result as MainWireScientificPvRelationsProtocolResultV1
    : null;
  return (
    <ScientificPvRelationPaneV1
      data={pvRelationPaneDataV1(scenarioName, protocol, result)}
    />
  );
}

function useScientificHemodynamicProtocolV1(
  registry: ScientificProductScenarioRegistryV1,
  scenarioId: string | null,
  kind: ScientificProductHemodynamicProtocolKindV1,
): ScientificProductHemodynamicProtocolPresentationV1 {
  return React.useSyncExternalStore(
    registry.subscribeHemodynamicProtocols,
    () => scenarioId === null
      ? EMPTY_PROTOCOL_PRESENTATION_BY_KIND_V1[kind]
      : registry.getHemodynamicProtocol(scenarioId, kind),
    () => EMPTY_PROTOCOL_PRESENTATION_BY_KIND_V1[kind],
  );
}

const EMPTY_PROTOCOL_PRESENTATION_BY_KIND_V1 = Object.freeze({
  "guyton-starling": Object.freeze({
    kind: "guyton-starling" as const,
    status: "idle" as const,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  }),
  "pv-relations": Object.freeze({
    kind: "pv-relations" as const,
    status: "idle" as const,
    sourceIdentity: null,
    result: null,
    jobSnapshot: null,
    errorMessage: null,
  }),
}) satisfies Readonly<Record<
  ScientificProductHemodynamicProtocolKindV1,
  ScientificProductHemodynamicProtocolPresentationV1
>>;

function guytonPaneDataV1(
  side: "right" | "left",
  scenarioName: string,
  protocol: ScientificProductHemodynamicProtocolPresentationV1,
  result: MainWireScientificGuytonStarlingProtocolResultV1
    | MainWireScientificGuytonStarlingProtocolResultV2
    | null,
): ScientificGuytonStarlingPaneDataV1 {
  const partial = protocol.jobSnapshot;
  const vascularSource = result ?? partial;
  if (vascularSource === null) {
    return Object.freeze({
      side,
      title: `${scenarioName} · ${side === "right" ? "Right" : "Left"} Guyton / Starling`,
      vascularReturnCurve: Object.freeze([]),
      cardiacPreloadLocus: Object.freeze([]),
      cardiacPreloadSegments: Object.freeze([]),
      sweepPoints: Object.freeze([]),
      status: Object.freeze({
        status: "running" as const,
        label: "Running full-Land protocol…",
        phase: "Cycle-mean vascular snapshot and independent fixed-TBV P1/P2 points",
        qc: Object.freeze({
          level: "pending" as const,
          summary: "The source scenario remains unchanged while the Worker runs.",
        }),
      }),
    });
  }
  const vascular = side === "right"
    ? vascularSource.rightVascularFunction
    : vascularSource.leftVascularFunction;
  const allV2Evidence = result !== null && "preloadPointEvidence" in result
    ? result.preloadPointEvidence
    : partial?.preloadPointEvidence ?? null;
  const v2Evidence = allV2Evidence?.filter(({ provenance }) =>
    provenance.direction !== "independent-audit") ?? null;
  const operatingRows = v2Evidence !== null
    ? v2Evidence.map(({ point, provenance }) => Object.freeze({
      point,
      pointId: provenance.pointId,
      auditStatus: provenance.auditStatus,
      auditMaximumNormalizedStateDelta:
        provenance.auditMaximumNormalizedStateDelta,
    }))
    : (result?.preloadOperatingPoints ?? []).map((point) => Object.freeze({
      point,
      pointId: `tbv-${point.targetScale.toFixed(6)}`,
      auditStatus: "not-scheduled" as const,
      auditMaximumNormalizedStateDelta: null,
    }));
  const operatingPoints = operatingRows.map(({ point }) => point);
  const baselinePeriodicity = result?.baselinePeriodicity
    ?? partial?.baselinePeriodicity
    ?? "not-converged";
  const pressure = (point: MainWireScientificGuytonStarlingProtocolResultV1[
    "preloadOperatingPoints"
  ][number]) => side === "right"
    ? point.meanRapTransmuralMmHg
    : point.meanLapTransmuralMmHg;
  const p1Rows = operatingRows.filter(({ point }) =>
    point.acceptedForPeriod1Locus
    && pressure(point) !== null
    && point.netCardiacOutputLMin !== null);
  const p1ByTargetScale = new Map(p1Rows.map((row) => [
    row.point.targetScale,
    row,
  ]));
  const orderedTargetScales = [...new Set(operatingPoints.map((point) =>
    point.targetScale))].sort((a, b) => a - b);
  const cardiacPreloadSegments = orderedTargetScales.reduce<
    Array<Array<(typeof p1Rows)[number]>>
  >((segments, targetScale) => {
    const row = p1ByTargetScale.get(targetScale);
    if (row === undefined) {
      if (segments.at(-1)?.length) segments.push([]);
      return segments;
    }
    if (row.auditStatus === "path-dependence-suspect") {
      if (segments.at(-1)?.length) segments.push([]);
      segments.push([row], []);
      return segments;
    }
    const current = segments.at(-1);
    if (current === undefined) segments.push([row]);
    else current.push(row);
    return segments;
  }, []).filter((segment) => segment.length > 0);
  const orderedP1Rows = [...p1Rows].sort((left, right) =>
    left.point.targetScale - right.point.targetScale);
  const rejectedCount = operatingPoints.length - p1Rows.length;
  const baseline = p1Rows.find(({ point }) => point.targetScale === 1)?.point;
  const auditedReferences = operatingRows.filter(({ auditStatus }) =>
    auditStatus !== "not-scheduled" && auditStatus !== "pending");
  const auditMatchedCount = auditedReferences.filter(({ auditStatus }) =>
    auditStatus === "matched").length;
  const auditWarningCount = auditedReferences.length - auditMatchedCount;
  return Object.freeze({
    side,
    title: `${scenarioName} · ${side === "right" ? "Right" : "Left"} Guyton / Starling`,
    vascularReturnCurve: Object.freeze(vascular.points.map((point) =>
      Object.freeze({
        pressureMmHg: point.pressureTransmuralMmHg,
        flowLPerMin: point.flowLMin,
      }))),
    cardiacPreloadLocus: Object.freeze(orderedP1Rows.map(({ point }) => Object.freeze({
      pressureMmHg: pressure(point)!,
      flowLPerMin: point.netCardiacOutputLMin!,
    }))),
    cardiacPreloadSegments: Object.freeze(cardiacPreloadSegments.map((segment) =>
      Object.freeze(segment.map(({ point }) => Object.freeze({
        pressureMmHg: pressure(point)!,
        flowLPerMin: point.netCardiacOutputLMin!,
      }))))),
    sweepPoints: Object.freeze(operatingRows.flatMap<ScientificGuytonSweepPointV1>(({
      point,
      pointId,
      auditStatus,
      auditMaximumNormalizedStateDelta,
    }) => {
      if (point.status === "period2-suspect" && point.period2Branches !== null) {
        return point.period2Branches.map((branch) => Object.freeze({
          id: `${pointId}-${branch.branchId}`,
          pressureMmHg: side === "right"
            ? branch.meanRapTransmuralMmHg
            : branch.meanLapTransmuralMmHg,
          flowLPerMin: branch.netCardiacOutputLMin,
          totalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
          classification: "period2" as const,
          reason: `${branch.branchId} branch of a settled period-2-suspect orbit; excluded`,
        }));
      }
      const x = pressure(point);
      const y = point.netCardiacOutputLMin;
      if (x === null || y === null) return [];
      return [Object.freeze({
        id: pointId,
        pressureMmHg: x,
        flowLPerMin: y,
        totalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
        classification: point.status === "period1-converged"
          ? auditStatus === "path-dependence-suspect"
            || auditStatus === "audit-failed"
            ? "audit-suspect" as const
            : "period1" as const
          : point.status === "period2-suspect"
            ? "period2" as const
            : "rejected" as const,
        reason: auditStatus === "path-dependence-suspect"
          ? `Independent source audit converged to a materially different accepted state${auditMaximumNormalizedStateDelta === null ? "" : ` (maximum normalized delta ${auditMaximumNormalizedStateDelta.toExponential(2)})`}.`
          : auditStatus === "audit-failed"
            ? "Independent source audit did not provide a matched P1 checkpoint."
            : point.failureReason ?? undefined,
      })];
    })),
    operatingPoint: baseline === undefined ? undefined : Object.freeze({
      pressureMmHg: pressure(baseline)!,
      flowLPerMin: baseline.netCardiacOutputLMin!,
      label: "Source operating point",
    }),
    vascularCurveLabel: "Fixed-volume vascular function (PV-law derived)",
    cardiacCurveLabel: v2Evidence === null
      ? "Independent-TBV net aortic-output locus (P1 only)"
      : "Bidirectional-continuation net aortic-output locus (P1 only)",
    status: Object.freeze({
      status: protocol.status === "running"
        ? "running" as const
        : protocol.status === "error"
          ? "error" as const
        : rejectedCount === 0 ? "complete" as const : "partial" as const,
      label: protocol.status === "running"
        ? "Exploring preload envelope…"
        : protocol.status === "error"
          ? "Protocol stopped"
        : "Protocol complete",
      phase: protocol.status === "running"
        ? `${partial?.progress.completedPointCount ?? operatingPoints.length} settled/classified points · ${partial?.progress.completedBeatCount ?? 0} beats · ${partial?.progress.activeDirections.join(" + ") || "finalizing"}`
        : result !== null && "exploration" in result
          ? `Envelope ${result.exploration.normalizedTotalBloodVolumeEnvelope.join("–")}× TBV · lower ${result.exploration.lowerBoundaryStatus} · higher ${result.exploration.higherBoundaryStatus} · ${partial?.progress.completedBeatCount ?? 0} beats`
          : undefined,
      progress: protocol.status === "running" && partial !== null
        ? Object.freeze({
          completed: partial.progress.completedPointCount,
          total: partial.progress.plannedPointCountLowerBound,
        })
        : undefined,
      qc: Object.freeze({
        level: protocol.status === "running"
          ? "pending" as const
          : protocol.status === "error"
            ? "fail" as const
          : baselinePeriodicity === "period1-converged"
          ? rejectedCount === 0 && auditWarningCount === 0
            ? "pass" as const
            : "warning" as const
          : "fail" as const,
        summary: protocol.status === "running"
          ? "The structural vascular curve is ready; steady preload points appear as each branch converges."
          : protocol.status === "error"
            ? protocol.errorMessage ?? "The preload protocol stopped before completion."
          : baselinePeriodicity === "period1-converged"
          ? `${p1Rows.length} P1 point${p1Rows.length === 1 ? "" : "s"}; ${rejectedCount} P2-suspect/blocked attempt${rejectedCount === 1 ? "" : "s"}; ${auditMatchedCount} matched audit${auditMatchedCount === 1 ? "" : "s"}; ${auditWarningCount} audit warning${auditWarningCount === 1 ? "" : "s"}.`
          : "The source beat did not reproduce period-1 closure.",
        details: Object.freeze([
          "TBV sweep is a one-dimensional closed-loop preload locus, not a Guyton pump experiment or a surface.",
          "Settled period-2-suspect branches are shown separately and never averaged into the P1 curve.",
          "An audit-warning marker remains P1 continuation evidence, but it is isolated from the curve when the independent source audit indicates path dependence.",
        ]),
      }),
    }),
  });
}

function pvRelationPaneDataV1(
  scenarioName: string,
  protocol: ScientificProductHemodynamicProtocolPresentationV1,
  result: MainWireScientificPvRelationsProtocolResultV1 | null,
): ScientificPvRelationPaneDataV1 {
  if (protocol.status === "running" || result === null) {
    return Object.freeze({
      title: `${scenarioName} · LV ESPVR / EDPVR`,
      chamberLabel: "LV",
      beats: Object.freeze([]),
      espvr: Object.freeze({ status: "not-run" as const }),
      edpvr: Object.freeze({ status: "not-run" as const }),
      prsw: Object.freeze({ status: "not-run" as const }),
      status: Object.freeze({
        status: "running" as const,
        label: "Running fixed-TBV IVC-like protocol…",
        phase: "8 loading beats, valve-event extraction, recovery and fit QC",
        qc: Object.freeze({
          level: "pending" as const,
          summary: "Transmural LV pressure is used; the source session is read-only.",
        }),
      }),
    });
  }
  const analysis = result.analysis;
  const volumeValues = result.rampBeats.flatMap((beat) => [
    beat.endDiastolic?.volumeMl,
    beat.endSystolic?.volumeMl,
  ].filter((value): value is number => value !== undefined));
  const volumeMin = volumeValues.length > 0 ? Math.min(...volumeValues) : 0;
  const volumeMax = volumeValues.length > 0 ? Math.max(...volumeValues) : 1;
  const volumes = Array.from({ length: 64 }, (_, index) =>
    volumeMin + (volumeMax - volumeMin) * index / 63);
  const linear = analysis.espvr.fit;
  const quadratic = analysis.quadraticEspvrSensitivity;
  const edpvr = analysis.edpvr.fit;
  const rejectSummary = (reasons: readonly Readonly<{ message: string }>[]) =>
    reasons.map(({ message }) => message).join(" ");
  return Object.freeze({
    title: `${scenarioName} · LV ESPVR / EDPVR`,
    chamberLabel: "LV",
    beats: Object.freeze(result.rampBeats.map((beat) => Object.freeze({
      id: `ivc-beat-${beat.beatIndex}`,
      points: Object.freeze(beat.samples.map((sample) => Object.freeze({
        volumeMl: sample.lvVolumeMl,
        transmuralPressureMmHg: sample.lvTransmuralPressureMmHg,
      }))),
      classification: beat.classification,
      endDiastolic: beat.endDiastolic === null ? undefined : Object.freeze({
        event: "end-diastole" as const,
        volumeMl: beat.endDiastolic.volumeMl,
        transmuralPressureMmHg: beat.endDiastolic.pressureTransmuralMmHg,
      }),
      endSystolic: beat.endSystolic === null ? undefined : Object.freeze({
        event: "end-systole" as const,
        volumeMl: beat.endSystolic.volumeMl,
        transmuralPressureMmHg: beat.endSystolic.pressureTransmuralMmHg,
      }),
      rejectionReason: beat.rejectionReason ?? undefined,
    }))),
    espvr: linear !== null
      ? Object.freeze({
        status: analysis.espvr.status === "accepted"
          ? "valid" as const
          : "invalid" as const,
        linear: Object.freeze({
          points: pvFitPoints(volumes, (volumeMl) =>
            linear.endSystolicElastanceMmHgPerMl
              * (volumeMl - linear.volumeAxisInterceptMl)),
          rSquared: linear.diagnostics.r2,
          rmseMmHg: linear.diagnostics.rmse,
          endSystolicElastanceMmHgPerMl:
            linear.endSystolicElastanceMmHgPerMl,
          volumeAxisInterceptMl: linear.volumeAxisInterceptMl,
        }),
        quadraticSensitivity: quadratic === null ? undefined : Object.freeze({
          points: pvFitPoints(volumes, (volumeMl) =>
            quadratic.quadraticCoefficientMmHgPerMl2 * volumeMl ** 2
            + quadratic.linearCoefficientMmHgPerMl * volumeMl
            + quadratic.interceptMmHg),
          rSquared: quadratic.diagnostics.r2,
          rmseMmHg: quadratic.diagnostics.rmse,
          rmseImprovementPercent:
            100 * quadratic.rmseImprovementFractionOverLinear,
          localSlopeVariationPercent:
            100 * quadratic.localSlopeVariationFraction,
        }),
        invalidReason: analysis.espvr.status === "accepted"
          ? undefined
          : rejectSummary(analysis.espvr.rejectReasons),
      })
      : Object.freeze({
        status: "invalid" as const,
        invalidReason: rejectSummary(analysis.espvr.rejectReasons),
      }),
    edpvr: analysis.edpvr.status === "accepted" && edpvr !== null
      ? Object.freeze({
        status: "valid" as const,
        exponential: Object.freeze({
          points: pvFitPoints(volumes, (volumeMl) =>
            edpvr.referencePressureMmHg + edpvr.alphaMmHg
              * (Math.exp(edpvr.betaPerMl
                * (volumeMl - edpvr.referenceVolumeMl)) - 1)),
          rSquared: edpvr.diagnostics.r2,
          rmseMmHg: edpvr.diagnostics.rmse,
          pressureOffsetMmHg: edpvr.referencePressureMmHg,
          alphaMmHg: edpvr.alphaMmHg,
          betaPerMl: edpvr.betaPerMl,
          referenceVolumeMl: edpvr.referenceVolumeMl,
          baselineTangentStiffnessMmHgPerMl:
            edpvr.tangentStiffnessAtBaselineMmHgPerMl,
        }),
      })
      : Object.freeze({
        status: "invalid" as const,
        invalidReason: rejectSummary(analysis.edpvr.rejectReasons),
      }),
    prsw: analysis.prsw.status === "accepted" && analysis.prsw.fit !== null
      ? Object.freeze({
        status: "valid" as const,
        slopeMmHg:
          analysis.prsw.fit.preloadRecruitableStrokeWorkSlopeMmHg,
        volumeAxisInterceptMl: analysis.prsw.fit.volumeAxisInterceptMl,
        rSquared: analysis.prsw.fit.diagnostics.r2,
      })
      : Object.freeze({
        status: "invalid" as const,
        invalidReason: rejectSummary(analysis.prsw.rejectReasons),
      }),
    status: Object.freeze({
      status: analysis.overallStatus === "accepted"
        ? "complete" as const
        : "invalid" as const,
      label: analysis.overallStatus === "accepted"
        ? "Protocol and fits accepted"
        : "Raw loops retained; one or more fits withheld",
      qc: Object.freeze({
        level: analysis.overallStatus === "accepted"
          ? "pass" as const
          : "warning" as const,
        summary: analysis.overallStatus === "accepted"
          ? `${analysis.includedFitEligiblePointIds.length} fixed-TBV transient loading beats passed QC.`
          : "QC withholds one or more relation claims; raw evidence remains visible.",
        details: Object.freeze([
          `Baseline: ${result.baselinePeriodicity}`,
          `Recovery: ${result.recovery.status}; baseline-state delta ${result.recovery.maximumRelativeBaselineStateDelta.toExponential(2)}`,
          `EDPVR V₀ prior: Klotz-informed ${result.edpvrReference.referenceVolumeMl.toFixed(1)} mL; the multi-beat curve is an operating envelope, not a passive material test.`,
        ]),
      }),
    }),
  });
}

function pvFitPoints(
  volumes: readonly number[],
  pressure: (volumeMl: number) => number,
): readonly ScientificPvPointV1[] {
  return Object.freeze(volumes.map((volumeMl) => Object.freeze({
    volumeMl,
    transmuralPressureMmHg: pressure(volumeMl),
  })));
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
      className="@container h-full content-start overflow-auto px-3 py-1 custom-scrollbar"
      data-testid="scientific-workbench-metrics-v1"
    >
      {presentations.map((presentation) => {
        const evaluation = metricEvaluationForPresentationV1(presentation);
        const ids = [...new Set((selections[presentation.descriptor.id] ?? [])
          .map(scientificMetricId)
          .filter((id): id is MainWireScientificDerivedMetricIdV1 => id !== null))];
        return (
          <section
            key={presentation.descriptor.id}
            className="grid gap-2 border-b border-wb-line/70 py-2.5 last:border-b-0 @min-[700px]:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)] @min-[700px]:gap-4"
            data-scenario-id={presentation.descriptor.id}
            data-testid="scientific-metrics-scenario-v1"
            data-metric-evidence={presentation.metricEvidence}
            data-metric-cycle-final-revision={evaluation.finalRevision ?? ""}
          >
            <header className="flex min-w-0 items-start gap-2 @min-[700px]:pt-0.5">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: presentation.descriptor.color }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h3 className="truncate text-[11px] font-semibold leading-4 text-wb-text">
                  {presentation.descriptor.name}
                </h3>
                {presentation.metricEvidence === "retained-periodic-source" && (
                  <p className="truncate text-[10px] leading-4 text-wb-subtle">
                    Live · previous complete beat
                  </p>
                )}
                {presentation.metricEvidence === "provisional-complete-transient-beat" && (
                  <p className="truncate text-[10px] leading-4 text-wb-subtle">
                    Live · provisional complete beat
                  </p>
                )}
                {evaluation.cycleAvailability === "unavailable" && (
                  <p className="truncate text-[10px] leading-4 text-wb-subtle">
                    Awaiting a complete cycle
                  </p>
                )}
              </div>
            </header>
            <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 @min-[280px]:grid-cols-2 @min-[520px]:grid-cols-3 @min-[840px]:grid-cols-4 @min-[1120px]:grid-cols-6">
              {ids.map((metricId) => {
                const metricPresentation =
                  scientificWorkbenchMetricPresentationV1(metricId);
                const metric = evaluation.values[metricId];
                const unavailableReason = metric.unavailableReason
                  ?? evaluation.cycleUnavailableReason
                  ?? undefined;
                return (
                  <div
                    key={`${presentation.descriptor.id}:${metricId}`}
                    className="min-w-0 py-0.5"
                    data-metric-id={metricId}
                    data-availability={metric.availability}
                    data-periodic-boundary-completion={String(
                      metric.periodicBoundaryCompletionApplied,
                    )}
                    title={metric.value === null
                      ? unavailableReason
                      : metric.periodicBoundaryCompletionApplied
                        ? `${metricPresentation.label} · periodic boundary completed from the measured terminal sample`
                        : metricPresentation.label}
                  >
                    <dt
                      className="truncate text-[10px] font-medium leading-4 text-wb-subtle"
                      title={metricPresentation.label}
                    >
                      <span aria-hidden="true">
                        {metricPresentation.shortLabel}
                      </span>
                      <span className="sr-only">
                        {metricPresentation.label}
                      </span>
                    </dt>
                    <dd className="flex min-w-0 items-baseline gap-1 tabular-nums text-wb-text">
                      <span className="truncate text-base font-semibold leading-5">
                        {metric.value === null
                          ? "—"
                          : formatMetric(
                            metric.value,
                            metricPresentation.decimals,
                          )}
                      </span>
                      {metric.value !== null && (
                        <span className="shrink-0 text-[9px] font-medium text-wb-subtle">
                          {metricPresentation.unit}
                        </span>
                      )}
                      {metric.value === null && unavailableReason !== undefined && (
                        <span className="sr-only">
                          {`Unavailable: ${unavailableReason}`}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function metricEvaluationForPresentationV1(
  presentation: ScientificProductScenarioPresentationV1,
): MainWireScientificDerivedMetricEvaluationV1 {
  const cycle = presentation.metricCycle;
  if (cycle === null) return deriveMainWireScientificMetricsV1(null);
  const cached = METRIC_EVALUATION_BY_CYCLE_V1.get(cycle as object);
  if (cached !== undefined) return cached;
  const evaluation = "periodicOrbitClassifiedP1" in cycle.evidence
    ? deriveMainWireScientificMetricsV1(
      cycle as MainWireScientificValidatedTerminalCycleV1,
    )
    : deriveMainWireScientificTransientBeatMetricsV1(
      cycle as MainWireScientificCompleteTransientBeatV1,
    );
  METRIC_EVALUATION_BY_CYCLE_V1.set(cycle as object, evaluation);
  return evaluation;
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
  const controlsEditable = snapshot.ownerConnected
    && (snapshot.phase === "idle" || snapshot.phase.startsWith("live-"))
    && !snapshot.requestCapacityExhausted;
  return (
    <div
      className="absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-transparent"
      data-testid="scientific-transition-controller-v1"
      data-controller-scenario-id={descriptor.id}
      data-phase={snapshot.phase}
      data-mode={snapshot.mode}
      data-owner-connected={String(snapshot.ownerConnected)}
      data-displayed-evidence={snapshot.provenance.displayedEvidence}
      data-target-control-sha={snapshot.targetControlStateSha256 ?? ""}
      data-displayed-parameter-epoch={snapshot.provenance.displayedParameterEpoch}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-wb-line px-2 py-1.5 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: descriptor.color }} />
        <span className="min-w-0 flex-1 truncate font-semibold text-wb-text">{descriptor.name}</span>
        <span className="truncate text-wb-subtle">{compactPhaseLabelV1(snapshot.phase)}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="grid gap-2">
          {items.map((item) => {
            const controlId = scientificControlKindV1(item.paramKey);
            if (controlId === null) {
              return (
                <div key={item.paramKey} className="rounded border border-dashed border-wb-line px-2 py-1.5 text-[10px] text-wb-subtle">
                  {item.label ?? item.paramKey}: unavailable in release 0.2.0
                </div>
              );
            }
            const value = scientificDraftValueV1(snapshot.draft, controlId);
            const domain =
              MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
                controlId
              ];
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
                baseline={domain.baseline}
                unit={SCIENTIFIC_CONTROL_PRESENTATION_V1[controlId].unit}
                description={
                  SCIENTIFIC_CONTROL_PRESENTATION_V1[controlId].description
                }
                onChange={(next) => {
                  if (!isScientificControlValueV1(controlId, next)) return;
                  actions.setControlValue(controlId, next);
                }}
                onCommit={(next) => {
                  if (!isScientificControlValueV1(controlId, next)) return;
                  actions.commitControlValue(controlId, next);
                }}
                onOptionCommit={(next) => {
                  if (!isScientificControlValueV1(controlId, next)) return;
                  actions.commitControlValue(controlId, next);
                }}
                onReset={() => {
                  actions.commitControlValue(controlId, domain.baseline);
                }}
                disabled={!controlsEditable}
              />
            );
          })}
        </div>
      </div>
      {snapshot.steadyActive && (
        <div className="shrink-0 border-t border-wb-line bg-wb-strip px-2 py-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={actions.cancelSteady}
              className="min-h-7 rounded border border-wb-line px-2 text-[11px] text-wb-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScientificProductTransitionBehaviorSettingsV1({
  registry,
  activeScenarioId,
}: Readonly<{
  registry: ScientificProductScenarioRegistryV1;
  activeScenarioId: string;
}>) {
  const { t } = useTranslation();
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const descriptor = descriptors.find(({ id }) => id === activeScenarioId);
  const runtime = descriptor === undefined ? null : registry.getRuntime(descriptor.id);
  const snapshot = React.useSyncExternalStore(
    runtime?.controlStore.subscribe ?? EMPTY_SUBSCRIBE,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
  );
  if (descriptor === undefined || snapshot === null) return null;
  const modeEditable = snapshot.ownerConnected && snapshot.phase === "idle";
  return (
    <section
      className="space-y-3 border-t border-wb-line pt-4"
      data-testid="scientific-product-transition-mode-v1"
      data-scenario-id={descriptor.id}
    >
      <div>
        <h3 className="text-[11px] font-medium text-wb-subtle">
          {t("workbench.sidePanel.settings.transitionBehavior.title")}
        </h3>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs font-bold text-wb-text">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: descriptor.color }} />
          <span className="truncate">{descriptor.name}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-wb-muted">
          {t("workbench.sidePanel.settings.transitionBehavior.description")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1" role="group" aria-label="Transition mode">
        {(["live", "steady"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => runtime!.controlStore.actions.setMode(mode)}
            disabled={!modeEditable}
            aria-pressed={snapshot.mode === mode}
            className={`min-h-9 rounded border px-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${snapshot.mode === mode ? "border-wb-accent bg-wb-active text-wb-text" : "border-wb-line bg-wb-input text-wb-muted hover:text-wb-text"}`}
          >
            {t(`workbench.sidePanel.settings.transitionBehavior.${mode}`)}
          </button>
        ))}
      </div>
      {!modeEditable && (
        <p className="text-[10px] leading-4 text-wb-subtle">
          {t("workbench.sidePanel.settings.transitionBehavior.locked")}
        </p>
      )}
    </section>
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

export function graphViewToPanel(view: GraphViewSpec): PanelDef {
  const panelType: PanelType = view.graphType === "pvloop"
    ? "PVLOOP"
    : view.graphType === "waveform"
      ? "WAVEFORM"
      : view.graphType === "guyton-left"
        ? "GUYTON_LEFT"
      : view.graphType === "guyton-right"
          ? "GUYTON_RIGHT"
          : view.graphType === "pv-relations"
            ? "PV_RELATIONS"
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
      legendPosition: view.presentation?.legendPosition,
      pvHistoryBeats: view.presentation?.pvHistoryBeats,
      pvHistoryMode: view.presentation?.pvHistoryMode,
    },
    isSettingsOpen: false,
    showGuides: view.presentation?.showGuides,
    timeWindow: view.presentation?.timeWindow,
    showLegend: view.presentation?.showLegend,
    pvHistoryBeats: view.presentation?.pvHistoryBeats,
    pvHistoryMode: view.presentation?.pvHistoryMode,
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
): MainWireScientificResearchControlIdV0 | null {
  return (MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0 as readonly string[])
    .includes(paramKey)
    ? paramKey as MainWireScientificResearchControlIdV0
    : null;
}

function isScientificControlValueV1(
  controlId: MainWireScientificResearchControlIdV0,
  value: number,
): boolean {
  return Number.isFinite(value)
    && (MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
      controlId
    ].allowedValues as readonly number[]).includes(value);
}

function scientificDraftValueV1(
  draft: ScientificWorkbenchResearchControlDraftV0,
  controlId: MainWireScientificResearchControlIdV0,
): number {
  switch (controlId) {
    case "circulation.systemic-vascular-resistance-scale":
      return draft.systemic;
    case "circulation.pulmonary-vascular-resistance-scale":
      return draft.pulmonary;
    case "circulation.venous-tone":
      return draft.venousTone;
    case "circulation.arterial-stiffness":
      return draft.arterialStiffness;
    case "ventilation.peep-cm-h2o":
      return draft.peepCmH2O;
    case "pericardium.prescribed-fluid-volume-ml":
      return draft.pericardialFluidVolumeMl;
  }
}

function scientificMetricId(
  candidate: string,
): MainWireScientificDerivedMetricIdV1 | null {
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

function formatMetric(value: number, decimals: number): string {
  return value.toFixed(decimals);
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

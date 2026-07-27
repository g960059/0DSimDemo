import React from "react";
import { useTranslation } from "react-i18next";

import { ControllerItemControl } from "@/components/controls/ControllerItemControl";
import {
  StudioBriefingPickBoxV1,
  studioBriefingPickedEdgeClassV1,
  useStudioBriefingPickV1,
} from "./ScientificWorkbenchBriefingPickV1";
import { shouldEnableLegendInteractions } from "@/components/InteractiveGraphLegend";
import {
  deriveMainWireScientificMetricsV1,
  deriveMainWireScientificTransientBeatMetricsV1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  type MainWireScientificCompleteTransientBeatV1,
  type MainWireScientificDerivedMetricEvaluationV1,
  type MainWireScientificDerivedMetricIdV1,
  type MainWireScientificDerivedMetricValueV1,
  type MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import type {
  RuntimePresentationBeatEstimateV1,
} from "@/studio/contracts/v1";
import type { MainWireScientificWorkspacePressureVolumeTrajectoryV1 } from "@/engine/scientific/documents";
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
  DEFAULT_HEMODYNAMIC_ALLOW_NEGATIVE_FILLING_PRESSURE,
  DEFAULT_HEMODYNAMIC_DETAIL_MODE,
  DEFAULT_HEMODYNAMIC_PARAMETER_HISTORY_COUNT,
  DEFAULT_PV_LOOP_HISTORY_BEATS,
  DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT,
  DEFAULT_PV_RELATION_DISPLAY_MODE,
  DEFAULT_PV_RELATION_PRESSURE_BASIS,
  type HemodynamicDetailMode,
  type PvLoopHistoryMode,
  type PvRelationDisplayMode,
  type PvRelationPressureBasis,
} from "@/types";
import type { ScientificWorkbenchResearchControlDraftV0 } from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";

import {
  ScientificWorkbenchPvLoopCanvasV1,
  ScientificWorkbenchWaveformCanvasV1,
  scientificObservableShortLabelV1,
  scientificSeriesColorV1,
  type ScientificWorkbenchChartScenarioV1,
  type ScientificWorkbenchLegendInteractionV1,
  type ScientificWorkbenchPvRelationOverlayV1,
  type ScientificWorkbenchPvSeriesV1,
  type ScientificWorkbenchWaveformSeriesV1,
} from "./ScientificWorkbenchAnimatedChartsV1";
import {
  normalizeScientificPvHistoryBeatsV1,
  scientificPvHistoryAlphaV1,
} from "./ScientificPvHistoryPresentationV1";
import {
  buildScientificPvBoundaryGuidesV1,
  type ScientificPvBoundaryGuideV1,
} from "./ScientificPvBoundaryGuidesV1";
import { buildScientificPvProgressiveBoundaryGuideV1 } from "./ScientificPvProgressiveBoundaryGuidesV1";
import type { ScientificWorkbenchDisplayClockV1 } from "./ScientificWorkbenchDisplayClockV1";
import {
  type ScientificProductScenarioPresentationV1,
  type ScientificProductHemodynamicProtocolGenerationV1,
  type ScientificProductHemodynamicProtocolKindV1,
  type ScientificProductHemodynamicProtocolPresentationV1,
  type ScientificProductHemodynamicProtocolSeriesV1,
  type ScientificProductPvRelationProtocolSeriesV1,
} from "./ScientificProductScenarioRegistryV1";
import {
  resolveScientificProductPvTrajectoryV1,
} from "./ScientificProductPvTrajectoryCatalogV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import {
  ScientificCardiacOutputFillingPressurePaneV1,
  type ScientificGuytonCurvePointV1,
  type ScientificGuytonStarlingPaneDataV1,
  type ScientificGuytonSweepPointV1,
  type ScientificHemodynamicProtocolStatusV1,
  type ScientificHemodynamicResponseDisplayModeV1,
  type ScientificHemodynamicResponseGenerationV1,
  type ScientificHemodynamicResponseScenarioV1,
} from "./ScientificHemodynamicProtocolPanesV1";
import type { MainWireScientificGuytonStarlingProtocolResultV1 } from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type { MainWireScientificGuytonStarlingProtocolResultV2 } from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  buildMainWireScientificPvRelationOverlayCurvesV2,
  type MainWireScientificPvRelationBeatV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import type {
  MainWireScientificPvRelationBeatV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";
import { scientificWorkbenchMetricPresentationV1 } from "./ScientificWorkbenchMetricPresentationV1";
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
const METRIC_EVALUATION_BY_PRESENTATION_ESTIMATE_V1 = new WeakMap<
  object,
  ScientificProductPresentationMetricEvaluationV1
>();

export type ScientificProductPresentationMetricEvaluationV1 = Readonly<{
  registryId: "main-wire-presentation-estimator-registry-v1";
  schemaVersion: 1;
  inputCycleContractId: "main-wire-presentation-beat-estimate-v1";
  cycleAvailability: "estimate";
  cycleInterpretation: "presentation-beat-estimate";
  cycleUnavailableReason: null;
  releaseRef: null;
  firstRevision: number;
  finalRevision: number;
  firstAcceptedTimeSec: number;
  finalAcceptedTimeSec: number;
  durationSec: number;
  values: Readonly<Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >>;
}>;

export type ScientificProductMetricEvaluationV1 =
  | MainWireScientificDerivedMetricEvaluationV1
  | ScientificProductPresentationMetricEvaluationV1;

const WAVEFORM_ALIASES: Readonly<
  Record<string, MainWireScientificObservableIdV1>
> = Object.freeze({
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
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.map((value) =>
    Object.freeze({
      value,
      label: `${value.toFixed(2)}×`,
    }),
  ),
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
} satisfies Readonly<
  Record<
    MainWireScientificResearchControlIdV0,
    Readonly<{
      label: string;
      description: string;
      unit: string;
      optionLabel: (value: number) => string;
    }>
  >
>);

const SCIENTIFIC_CONTROLLER_ITEM_LIST_V1: ControllerItem[] =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.map((controlId) =>
    controllerItemForControlIdV1(controlId),
  );
export const SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1: readonly ControllerItem[] =
  Object.freeze(SCIENTIFIC_CONTROLLER_ITEM_LIST_V1);
export const SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1: readonly ControllerItem[] =
  Object.freeze(SCIENTIFIC_CONTROLLER_ITEM_LIST_V1.slice(0, 4));
export const SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1: readonly ControllerItem[] =
  Object.freeze(SCIENTIFIC_CONTROLLER_ITEM_LIST_V1.slice(4));

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
  const domain =
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[controlId];
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
  registry: ScientificProductRuntimeRegistryPortV1;
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
      const items =
        panel.view?.kind === "control"
          ? (panel.view.controllerItems ?? [])
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
    if (
      panel.type === "WAVEFORM"
      || panel.type === "PVLOOP"
      || panel.type === "GUYTON_LEFT"
      || panel.type === "GUYTON_RIGHT"
    ) {
      return (
        <ScientificProductGraphPaneV1
          panel={panel}
          registry={registry}
          clock={clock}
          renderContext={context}
        />
      );
    }
    if (panel.type === "GUYTON_3D") {
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
      if (view.kind === "graph")
        return renderPanel(graphViewToPanel(view), context);
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
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(
    ({ metricId }) => metricId,
  ),
);

/**
 * Shared scientific graph-pane renderer used by Workbench and Reader.
 *
 * Reader passes a reconstructed portable pane and a reading render context;
 * Workbench passes its live pane and studio context. Scientific projection,
 * fixed windows, legend placement, PV history and protocol demand therefore
 * have one owner.
 */
export function ScientificProductGraphPaneV1(props: Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ScientificWorkbenchDisplayClockV1;
  renderContext: WorkbenchRuntimeRenderContext;
}>) {
  const pick = useStudioBriefingPickV1();
  // Reading surfaces render the pane itself; only compose adds a pick layer.
  // The wrapper is unconditional: switching the element type at this position
  // would unmount the pane inside its Dockview host on every compose toggle.
  const picking = pick !== null
    && props.renderContext.presentationMode !== "reading";
  const paneId = props.panel.sourceViewId ?? props.panel.id;
  const picked = picking && pick !== null && pick.isGraphPinned(paneId);
  return (
    <div
      className={`relative h-full min-h-0 w-full ${
        studioBriefingPickedEdgeClassV1(picked)
      }`}
    >
      <ScientificProductGraphPaneBodyV1 {...props} />
      {picking && pick !== null && (
        <StudioBriefingPickBoxV1
          kind="graph"
          placement="corner"
          pickKey={paneId}
          picked={pick.isGraphPinned(paneId)}
          label={props.panel.title}
          onToggle={() => pick.toggleGraph(props.panel.id, paneId)}
        />
      )}
    </div>
  );
}

function ScientificProductGraphPaneBodyV1({
  panel,
  registry,
  clock,
  renderContext,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ScientificWorkbenchDisplayClockV1;
  renderContext: WorkbenchRuntimeRenderContext;
}>) {
  if (panel.type === "WAVEFORM" || panel.type === "PVLOOP") {
    return (
      <ScientificGraphPanelV1
        panel={panel}
        registry={registry}
        clock={clock}
        renderContext={renderContext}
      />
    );
  }
  if (panel.type === "GUYTON_LEFT" || panel.type === "GUYTON_RIGHT") {
    if (registry.capabilities?.guytonLoadSeries === false) {
      return (
        <ScientificUnavailablePanelV1
          title="Studio load-series analysis is not connected yet"
          detail="The live trace and automatic strict settlement use the Studio runtime. This advanced protocol will return after it has its own Studio analysis port."
        />
      );
    }
    return (
      <ScientificHemodynamicProtocolPanelV1
        panel={panel}
        registry={registry}
        renderContext={renderContext}
      />
    );
  }
  return <NoScientificSelectionV1 />;
}

function ScientificGraphPanelV1({
  panel,
  registry,
  clock,
  renderContext,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ScientificWorkbenchDisplayClockV1;
  renderContext: WorkbenchRuntimeRenderContext;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry);
  const effective = presentations.filter(
    (presentation) =>
      presentation.descriptor.isVisible &&
      panel.config[presentation.descriptor.id]?.visible === true,
  );
  const legendInteraction = {
    panelId: panel.id,
    interactive: shouldEnableLegendInteractions({
      canConfigure: renderContext.canConfigure,
      presentationMode: renderContext.presentationMode,
    }),
    onOpenSettings: renderContext.onOpenSettings,
    legendPosition:
      renderContext.legendPosition ??
      (panel.view?.kind === "graph" ? panel.view.legendPosition : undefined),
    onLegendPositionChange: renderContext.onLegendPositionChange,
    ariaLabel: `Open ${panel.title} pane settings`,
  };

  if (panel.type === "WAVEFORM") {
    const series = effective.flatMap((presentation) =>
      waveformSeriesForScenarioV1(
        presentation,
        panel.config[presentation.descriptor.id]!,
      ),
    );
    if (series.length === 0) return <NoScientificSelectionV1 />;
    return (
      <div
        className="relative h-full min-h-0 w-full overflow-hidden"
        data-testid={`scientific-workbench-pane-${panel.id}`}
        data-panel-kind="time-series"
        data-scientific-frame-count={Math.max(
          0,
          ...effective.map((presentation) => presentation.frames.length),
        )}
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

  return (
    <ScientificPvGraphPanelV1
      panel={panel}
      registry={registry}
      clock={clock}
      presentations={effective}
      legendInteraction={legendInteraction}
    />
  );
}

function ScientificPvGraphPanelV1({
  panel,
  registry,
  clock,
  presentations,
  legendInteraction,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  clock: ScientificWorkbenchDisplayClockV1;
  presentations: readonly ScientificProductScenarioPresentationV1[];
  legendInteraction: ScientificWorkbenchLegendInteractionV1;
}>) {
  const demandScopeId = React.useId();
  const pvRelationProtocolSnapshot = React.useSyncExternalStore(
    registry.subscribeHemodynamicProtocols,
    registry.getPvRelationProtocolSeriesSnapshot,
    registry.getPvRelationProtocolSeriesSnapshot,
  );
  const displayMode = scientificPvRelationDisplayModeV1(panel);
  const pvAnalysisAvailable = registry.capabilities?.pvRelations !== false;
  const configuredPressureBasis = scientificPvRelationPressureBasisV1(panel);
  // Pressure-basis selection belongs to the opt-in research analysis. When it
  // is off, keep the beginner-facing loop and its textbook guides on ordinary
  // chamber pressure even if a prior advanced session used transmural pressure.
  const pressureBasis = displayMode === "off"
    ? DEFAULT_PV_RELATION_PRESSURE_BASIS
    : configuredPressureBasis;
  const showSamplePoints = panel.pvRelationShowSamplePoints ??
    (panel.view?.kind === "graph"
      ? panel.view.pvRelationShowSamplePoints
      : undefined) ??
    false;
  const historyBeats = panel.pvHistoryBeats ??
    (panel.view?.kind === "graph" ? panel.view.pvHistoryBeats : undefined) ??
    DEFAULT_PV_LOOP_HISTORY_BEATS;
  const historyMode = panel.pvHistoryMode ??
    (panel.view?.kind === "graph" ? panel.view.pvHistoryMode : undefined) ??
    "fade";
  const parameterHistoryCount = panel.pvParameterHistoryCount ??
    (panel.view?.kind === "graph"
      ? panel.view.pvParameterHistoryCount
      : undefined) ??
    DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT;
  const series = presentations.flatMap((presentation) =>
    pvSeriesForScenarioV1(
      presentation,
      panel.config[presentation.descriptor.id]!,
      pressureBasis,
    ),
  );
  const fallbackBoundaryGuides = React.useMemo(
    () => panel.showGuides === false
      ? Object.freeze([])
      : buildScientificPvBoundaryGuidesV1(series),
    [panel.showGuides, series],
  );
  const boundaryGuides = React.useMemo(
    () => !pvAnalysisAvailable
      ? fallbackBoundaryGuides
      : fallbackBoundaryGuides.flatMap((fallbackGuide) => {
        const presentation = presentations.find(({ descriptor }) =>
          descriptor.id === fallbackGuide.scenarioId);
        return scientificPvProgressiveBoundaryGuidesForScenarioV1({
          fallbackGuide,
          series: registry.getPvRelationProtocolSeries(
            fallbackGuide.scenarioId,
          ),
          historyCount: historyBeats,
          historyMode,
          currentAcceptedTimeSec:
            presentation?.frames.at(-1)?.acceptedTimeSec ?? null,
          cycleDurationSec: presentation?.cycleDurationSec ?? null,
        });
      }),
    [
      fallbackBoundaryGuides,
      historyBeats,
      historyMode,
      presentations,
      pvRelationProtocolSnapshot,
      registry,
      pvAnalysisAvailable,
    ],
  );
  const analysisPresentations = !pvAnalysisAvailable
    ? Object.freeze([])
    : presentations.filter((presentation) =>
      scientificPvAnalysisDemandEnabledV1({
        displayMode,
        showGuides: panel.showGuides,
        selectsLv: scientificPvPanelSelectsLvV1(
          presentation,
          panel.config[presentation.descriptor.id]!,
        ),
      }));
  const relationPresentations = analysisPresentations.filter(() =>
    displayMode !== "off");
  const relations = relationPresentations.flatMap((presentation) => {
    const scenarioSeries = registry.getPvRelationProtocolSeries(
      presentation.descriptor.id,
    );
    const lvSeries = series.find((candidate) =>
      candidate.scenario.id === presentation.descriptor.id
      && candidate.volumeObservableId === "hemodynamics.volume.LV");
    return scientificPvRelationOverlaysForScenarioV1({
      scenarioId: presentation.descriptor.id,
      scenarioName: presentation.descriptor.name,
      color: lvSeries?.color ?? presentation.descriptor.color,
      series: scenarioSeries,
      displayMode,
      pressureBasis,
      showSamplePoints: displayMode === "research" && showSamplePoints,
      displayedEvidence: presentation.displayedEvidence,
      // Previous relations are a visual companion to the previous PV loop,
      // so both obey the same beat-history horizon and fade mode.
      historyCount: normalizeScientificPvHistoryBeatsV1(historyBeats),
      historyBeats,
      historyMode,
      currentAcceptedTimeSec:
        presentation.frames.at(-1)?.acceptedTimeSec ?? null,
      cycleDurationSec: presentation.cycleDurationSec,
    });
  });

  if (series.length === 0) return <NoScientificSelectionV1 />;
  return (
    <>
      {analysisPresentations.map(({ descriptor }) => (
        <ScientificPvRelationProtocolDemandV1
          key={descriptor.id}
          registry={registry}
          demandId={`${demandScopeId}:${descriptor.id}`}
          scenarioId={descriptor.id}
          sourceIdentityKey={scientificHemodynamicDemandIdentityV1(
            registry,
            descriptor.id,
          )}
        />
      ))}
      <div
        className="relative h-full min-h-0 w-full overflow-hidden"
        data-testid={`scientific-workbench-pane-${panel.id}`}
        data-panel-kind="pressure-volume"
        data-scientific-frame-count={Math.max(
          0,
          ...presentations.map((presentation) => presentation.frames.length),
        )}
        data-pv-relation-mode={displayMode}
        data-pv-pressure-basis={pressureBasis}
        data-pv-analysis-available={String(pvAnalysisAvailable)}
      >
        <ScientificWorkbenchPvLoopCanvasV1
          series={series}
          boundaryGuides={boundaryGuides}
          relations={relations}
          clock={clock}
          showLegend={panel.showLegend !== false}
          historyBeats={historyBeats}
          historyMode={historyMode}
          parameterHistoryCount={parameterHistoryCount}
          legendInteraction={legendInteraction}
        />
        {!pvAnalysisAvailable && displayMode !== "off" && (
          <p
            className="pointer-events-none absolute bottom-2 left-2 right-2 rounded border border-wb-line bg-wb-panel/95 px-2 py-1.5 text-[10px] leading-4 text-wb-muted shadow-sm"
            data-testid="scientific-studio-pv-analysis-unavailable-v1"
          >
            Studio load-series analysis is not connected yet. The live PV loop
            remains available.
          </p>
        )}
      </div>
    </>
  );
}

/**
 * The beginner-facing textbook guides progressively refine from the same PV
 * analysis as the opt-in research overlay. A selected LV therefore owns
 * analysis demand whenever either visual is enabled; hiding both must release
 * the worker demand completely.
 */
export function scientificPvAnalysisDemandEnabledV1(input: Readonly<{
  displayMode: PvRelationDisplayMode;
  showGuides?: boolean;
  selectsLv: boolean;
}>): boolean {
  return input.selectsLv
    && (input.showGuides !== false || input.displayMode !== "off");
}

export function scientificPvProgressiveBoundaryGuidesForScenarioV1(
  input: Readonly<{
    fallbackGuide: ScientificPvBoundaryGuideV1;
    series: ScientificProductPvRelationProtocolSeriesV1;
    historyCount?: number;
    historyMode?: PvLoopHistoryMode;
    currentAcceptedTimeSec?: number | null;
    cycleDurationSec?: number | null;
  }>,
): readonly ScientificPvBoundaryGuideV1[] {
  const historyBeats = normalizeScientificPvHistoryBeatsV1(
    input.historyCount ?? DEFAULT_PV_LOOP_HISTORY_BEATS,
  );
  const historyCount = Math.min(5, historyBeats);
  const historyMode = input.historyMode ?? "fade";
  const current = input.series.current;
  if (current === null || current.snapshot === null) {
    const pending = input.series.pending;
    const pendingSnapshot = pending?.snapshot ?? null;
    const job = pendingSnapshot?.jobSnapshot ?? null;
    const guide = buildScientificPvProgressiveBoundaryGuideV1({
      fallbackGuide: input.fallbackGuide,
      generationId: pending?.generationId
        ?? `${input.fallbackGuide.key}:acquiring`,
      generationSequence: pending?.sequence ?? 0,
      generationAge: 0,
      generationStatus: pending?.status ?? "running",
      sourceRole: pending === null
        || pending.source.sourceIdentity.calculationSource
          === "visible-period1-source"
        ? "visible-current"
        : "target-preview",
      replacementPending: false,
      progress: job?.researchProgressV3 ?? null,
      result: pendingSnapshot?.researchResultV3
        ?? job?.researchResultV3
        ?? null,
    });
    return Object.freeze([Object.freeze({
      ...guide,
      opacityMultiplier: 1,
    })]);
  }
  const generations = [
    Object.freeze({
      generation: current,
      generationAge: 0,
      sourceRole: current.source.sourceIdentity.calculationSource
        === "visible-period1-source"
        ? "visible-current" as const
        : "target-preview" as const,
      replacementPending: input.series.pending !== null,
    }),
    ...input.series.history.slice(0, historyCount).map(
      (generation, index) => Object.freeze({
        generation,
        generationAge: index + 1,
        sourceRole: "history" as const,
        replacementPending: false,
      }),
    ),
  ];
  return Object.freeze(generations.flatMap((entry) => {
    const snapshot = entry.generation.snapshot!;
    const job = snapshot.jobSnapshot;
    const historyAgeBeats = entry.generationAge === 0
      ? 0
      : scientificPvAcceptedTimeHistoryAgeV1({
        fallbackAge: entry.generationAge,
        sourceAcceptedTimeSec:
          entry.generation.source.sourceIdentity.acceptedTimeSec,
        currentAcceptedTimeSec: input.currentAcceptedTimeSec ?? null,
        cycleDurationSec: input.cycleDurationSec ?? null,
      });
    const opacityMultiplier = entry.replacementPending
      ? 1
      : scientificPvHistoryAlphaV1(
        historyAgeBeats,
        historyBeats,
        historyMode,
      );
    if (entry.generationAge > 0 && opacityMultiplier <= 0) return [];
    const guide = buildScientificPvProgressiveBoundaryGuideV1({
      fallbackGuide: input.fallbackGuide,
      generationId: entry.generation.generationId,
      generationSequence: entry.generation.sequence,
      generationAge: entry.generationAge,
      generationStatus: entry.generation.status,
      sourceRole: entry.sourceRole,
      replacementPending: entry.replacementPending,
      progress: job?.researchProgressV3 ?? null,
      result: snapshot.researchResultV3
        ?? job?.researchResultV3
        ?? null,
    });
    return [Object.freeze({
      ...guide,
      historyAgeBeats,
      opacityMultiplier,
    })];
  }));
}

function scientificPvAcceptedTimeHistoryAgeV1(input: Readonly<{
  fallbackAge: number;
  sourceAcceptedTimeSec: number;
  currentAcceptedTimeSec: number | null;
  cycleDurationSec: number | null;
}>): number {
  if (
    input.currentAcceptedTimeSec !== null
    && input.cycleDurationSec !== null
    && Number.isFinite(input.sourceAcceptedTimeSec)
    && Number.isFinite(input.currentAcceptedTimeSec)
    && input.currentAcceptedTimeSec >= input.sourceAcceptedTimeSec
    && input.cycleDurationSec > 0
  ) {
    return (
      input.currentAcceptedTimeSec - input.sourceAcceptedTimeSec
    ) / input.cycleDurationSec;
  }
  return Math.max(0, input.fallbackAge);
}

function ScientificHemodynamicProtocolPanelV1({
  panel,
  registry,
  renderContext,
}: Readonly<{
  panel: PanelDef;
  registry: ScientificProductRuntimeRegistryPortV1;
  renderContext: WorkbenchRuntimeRenderContext;
}>) {
  const presentations = useScientificScenarioPresentationsV1(registry);
  const eligible = presentations.filter(
    ({ descriptor }) =>
      descriptor.isVisible && panel.config[descriptor.id]?.visible === true,
  );
  const kind: ScientificProductHemodynamicProtocolKindV1 = "guyton-starling";
  const demandScopeId = React.useId();
  React.useSyncExternalStore(
    registry.subscribeHemodynamicProtocols,
    registry.getHemodynamicProtocolSeriesSnapshot,
    registry.getHemodynamicProtocolSeriesSnapshot,
  );
  const detailMode = scientificHemodynamicDetailModeV1(panel);
  const displayMode = scientificHemodynamicDisplayModeV1(detailMode);
  const historyCount = scientificHemodynamicHistoryCountV1(panel);
  const allowNegativePressure =
    panel.hemodynamicAllowNegativeFillingPressure ??
    (panel.view?.kind === "graph"
      ? panel.view.hemodynamicAllowNegativeFillingPressure
      : undefined) ??
    DEFAULT_HEMODYNAMIC_ALLOW_NEGATIVE_FILLING_PRESSURE;
  const showLegend =
    panel.showLegend ??
    (panel.view?.kind === "graph" ? panel.view.showLegend : undefined) ??
    true;
  const legendInteraction: ScientificWorkbenchLegendInteractionV1 = {
    panelId: panel.id,
    interactive: shouldEnableLegendInteractions({
      canConfigure: renderContext.canConfigure,
      presentationMode: renderContext.presentationMode,
    }),
    onOpenSettings: renderContext.onOpenSettings,
    legendPosition:
      renderContext.legendPosition ??
      (panel.view?.kind === "graph" ? panel.view.legendPosition : undefined),
    onLegendPositionChange: renderContext.onLegendPositionChange,
    ariaLabel: `Open ${panel.title} pane settings`,
  };
  if (eligible.length === 0) return <NoScientificSelectionV1 />;
  const side = panel.type === "GUYTON_LEFT" ? "left" : "right";
  const entries = eligible.map((presentation) => {
    const config = panel.config[presentation.descriptor.id]!;
    const effectivePresentation: ScientificProductScenarioPresentationV1 =
      Object.freeze({
        ...presentation,
        descriptor: Object.freeze({
          ...presentation.descriptor,
          name: config.customName ?? presentation.descriptor.name,
          color: config.customBaseColor ?? presentation.descriptor.color,
        }),
      });
    return Object.freeze({
      presentation: effectivePresentation,
      series: registry.getHemodynamicProtocolSeries(
        presentation.descriptor.id,
        kind,
      ),
      displayedSourceIdentity: displayedHemodynamicSourceIdentityV1(
        registry,
        presentation.descriptor.id,
      ),
    });
  });
  const scenarios = entries.map(({
    presentation,
    series,
    displayedSourceIdentity,
  }) =>
    scientificHemodynamicResponseScenarioV1(
      side,
      presentation,
      series,
      historyCount,
      displayedSourceIdentity,
    ));
  const status = scientificHemodynamicAggregateStatusV1(side, entries);
  return (
    <>
      {eligible.map(({ descriptor }) => (
        <ScientificHemodynamicProtocolDemandV1
          key={descriptor.id}
          registry={registry}
          demandId={`${demandScopeId}:${descriptor.id}`}
          scenarioId={descriptor.id}
          kind={kind}
          detailMode={detailMode}
          sourceIdentityKey={scientificHemodynamicDemandIdentityV1(
            registry,
            descriptor.id,
          )}
        />
      ))}
      <ScientificCardiacOutputFillingPressurePaneV1
        data={Object.freeze({
          side,
          title: panel.title,
          scenarios: Object.freeze(scenarios),
          displayMode,
          showLegend,
          allowNegativePressure,
          historicalGenerationCount: historyCount,
          status,
        })}
        legendInteraction={legendInteraction}
      />
    </>
  );
}

export type ScientificQuickResponseQualityV1 = Readonly<{
  status: "complete" | "partial";
  qcLevel: "pass" | "warning";
  summary: string;
}>;

/**
 * A finished short-horizon calculation is not automatically near steady.
 * Keep completion, convergence evidence, and unavailable targets separate so
 * the clinical default cannot acquire an implicit periodic-state claim.
 */
export function scientificQuickResponseQualityV1(input: Readonly<{
  nearSteadyPointCount: number;
  provisionalPointCount: number;
  failureCount: number;
}>): ScientificQuickResponseQualityV1 {
  const nearSteadyPointCount = Math.max(0, Math.floor(input.nearSteadyPointCount));
  const provisionalPointCount = Math.max(0, Math.floor(input.provisionalPointCount));
  const failureCount = Math.max(0, Math.floor(input.failureCount));
  const pointCount = nearSteadyPointCount + provisionalPointCount;
  const hasQualityNotice = provisionalPointCount > 0 || failureCount > 0;
  return Object.freeze({
    status: hasQualityNotice ? "partial" : "complete",
    qcLevel: hasQualityNotice ? "warning" : "pass",
    summary: `${pointCount} quick-response point${pointCount === 1 ? "" : "s"}: ${nearSteadyPointCount} passed the provisional near-steady screen, ${provisionalPointCount} remain provisional, and ${failureCount} target${failureCount === 1 ? " is" : "s are"} unavailable. This is a directional response curve, not a periodic steady-state claim.`,
  });
}

function ScientificHemodynamicProtocolDemandV1({
  registry,
  demandId,
  scenarioId,
  kind,
  detailMode,
  sourceIdentityKey,
}: Readonly<{
  registry: ScientificProductRuntimeRegistryPortV1;
  demandId: string;
  scenarioId: string;
  kind: ScientificProductHemodynamicProtocolKindV1;
  detailMode: HemodynamicDetailMode;
  sourceIdentityKey: string;
}>) {
  React.useEffect(() => {
    registry.setHemodynamicProtocolDemand(demandId, Object.freeze({
      scenarioId,
      kind,
      detailMode,
    }));
    return () => registry.setHemodynamicProtocolDemand(demandId, null);
  }, [demandId, detailMode, kind, registry, scenarioId, sourceIdentityKey]);
  return null;
}

function ScientificPvRelationProtocolDemandV1({
  registry,
  demandId,
  scenarioId,
  sourceIdentityKey,
}: Readonly<{
  registry: ScientificProductRuntimeRegistryPortV1;
  demandId: string;
  scenarioId: string;
  sourceIdentityKey: string;
}>) {
  React.useEffect(() => {
    registry.setPvRelationProtocolDemand(demandId, Object.freeze({
      scenarioId,
    }));
    return () => registry.setPvRelationProtocolDemand(demandId, null);
  }, [demandId, registry, scenarioId, sourceIdentityKey]);
  return null;
}

function scientificHemodynamicDemandIdentityV1(
  registry: ScientificProductRuntimeRegistryPortV1,
  scenarioId: string,
): string {
  const snapshot = registry.getRuntime(scenarioId)?.controlStore.getSnapshot();
  if (snapshot === undefined) return "unavailable";
  return [
    snapshot.provenance.displayedFrameOwner,
    snapshot.provenance.displayedParameterEpoch,
    snapshot.provenance.displayedControlStateSha256,
    snapshot.targetControlStateSha256 ?? "no-target",
    snapshot.candidate?.sessionId ?? "source",
  ].join(":");
}

function scientificPvRelationDisplayModeV1(
  panel: PanelDef,
): PvRelationDisplayMode {
  return panel.pvRelationDisplayMode ??
    (panel.view?.kind === "graph"
      ? panel.view.pvRelationDisplayMode
      : undefined) ??
    DEFAULT_PV_RELATION_DISPLAY_MODE;
}

function scientificPvRelationPressureBasisV1(
  panel: PanelDef,
): PvRelationPressureBasis {
  return panel.pvRelationPressureBasis ??
    (panel.view?.kind === "graph"
      ? panel.view.pvRelationPressureBasis
      : undefined) ??
    DEFAULT_PV_RELATION_PRESSURE_BASIS;
}

type ScientificPvRelationGenerationV1 = NonNullable<
  ScientificProductPvRelationProtocolSeriesV1["current"]
>;

export type ScientificProductPvRelationOverlayPresentationV1 =
  ScientificWorkbenchPvRelationOverlayV1 & Readonly<{
    generationSequence: number;
    generationRole: "pending" | "current" | "history";
    targetPreview: boolean;
  }>;

export function scientificPvRelationOverlaysForScenarioV1(input: Readonly<{
  scenarioId: string;
  scenarioName?: string;
  color: string;
  series: ScientificProductPvRelationProtocolSeriesV1;
  displayMode: PvRelationDisplayMode;
  pressureBasis: PvRelationPressureBasis;
  showSamplePoints: boolean;
  historyCount: number;
  historyBeats?: number;
  historyMode?: PvLoopHistoryMode;
  currentAcceptedTimeSec?: number | null;
  cycleDurationSec?: number | null;
  displayedEvidence?: ScientificProductScenarioPresentationV1["displayedEvidence"];
}>): readonly ScientificProductPvRelationOverlayPresentationV1[] {
  if (input.displayMode === "off") return Object.freeze([]);
  const displayMode: Exclude<PvRelationDisplayMode, "off"> =
    input.displayMode;
  const hasPending = input.series.pending !== null;
  const generations = [
    ...(input.series.current === null
      ? []
      : [Object.freeze({
          generation: input.series.current,
          age: hasPending
            ? scientificPvAcceptedTimeHistoryAgeV1({
              fallbackAge: 1,
              sourceAcceptedTimeSec:
                input.series.current.source.sourceIdentity.acceptedTimeSec,
              currentAcceptedTimeSec:
                input.currentAcceptedTimeSec ?? null,
              cycleDurationSec: input.cycleDurationSec ?? null,
            })
            : 0,
          role: "current" as const,
        })]),
    ...input.series.history.slice(0, Math.max(0, input.historyCount)).map(
      (generation, index) => Object.freeze({
        generation,
        age: scientificPvAcceptedTimeHistoryAgeV1({
          fallbackAge: index + (hasPending ? 2 : 1),
          sourceAcceptedTimeSec:
            generation.source.sourceIdentity.acceptedTimeSec,
          currentAcceptedTimeSec: input.currentAcceptedTimeSec ?? null,
          cycleDurationSec: input.cycleDurationSec ?? null,
        }),
        role: "history" as const,
      }),
    ),
  ];
  const overlays = generations.flatMap(({ generation, age, role }) => {
    const overlay = scientificPvRelationGenerationOverlayV1({
      generation,
      scenarioId: input.scenarioId,
      scenarioName: input.scenarioName,
      color: input.color,
      displayMode,
      pressureBasis: input.pressureBasis,
      showSamplePoints: input.showSamplePoints,
      generationAge: age,
      generationRole: role,
    });
    return overlay === null ? [] : [overlay];
  });
  if (input.series.pending !== null) {
    const pending = scientificPvRelationGenerationOverlayV1({
      generation: input.series.pending,
      scenarioId: input.scenarioId,
      scenarioName: input.scenarioName,
      color: input.color,
      displayMode,
      pressureBasis: input.pressureBasis,
      showSamplePoints: input.showSamplePoints,
      generationAge: 0,
      generationRole: "pending",
    });
    overlays.unshift(pending ?? Object.freeze({
      key: `${input.scenarioId}:${input.series.pending.generationId}:pending`,
      scenarioId: input.scenarioId,
      scenarioName: input.scenarioName,
      color: input.color,
      status: "running" as const,
      pressureBasis: input.pressureBasis,
      completedBeatCount: 0,
      maximumBeatCount: 8,
      generationAge: 0,
      generationSequence: input.series.pending.sequence,
      generationRole: "pending" as const,
      targetPreview: pvRelationGenerationTargetsPreviewV1(
        input.series.pending,
      ),
      espvr: Object.freeze([]),
      edpvr: Object.freeze([]),
    }));
  }
  const latestFailure = input.series.lastFailure;
  if (latestFailure !== null) {
    const currentIndex = overlays.findIndex(({ generationAge }) =>
      (generationAge ?? 0) === 0);
    if (currentIndex >= 0) {
      overlays[currentIndex] = Object.freeze({
        ...overlays[currentIndex]!,
        status: "error" as const,
        errorMessage: latestFailure.errorMessage,
      });
    } else {
      overlays.unshift(Object.freeze({
        key: `${input.scenarioId}:${latestFailure.generationId}:error`,
        scenarioId: input.scenarioId,
        scenarioName: input.scenarioName,
        color: input.color,
        status: "error" as const,
        errorMessage: latestFailure.errorMessage,
        pressureBasis: input.pressureBasis,
        completedBeatCount: 0,
        maximumBeatCount: 8,
        generationAge: 0,
        generationSequence: latestFailure.sequence,
        generationRole: "pending" as const,
        targetPreview:
          latestFailure.source === null
          || latestFailure.source.sourceIdentity.calculationSource !==
            "visible-period1-source",
        espvr: Object.freeze([]),
        edpvr: Object.freeze([]),
      }));
    }
  } else if (
    input.displayedEvidence === "open-transient-no-periodic-claim"
    && input.series.pending === null
  ) {
    const currentIndex = overlays.findIndex(({ generationAge }) =>
      (generationAge ?? 0) === 0);
    if (currentIndex >= 0) {
      overlays[currentIndex] = Object.freeze({
        ...overlays[currentIndex]!,
        status: "stale" as const,
      });
    } else {
      overlays.unshift(Object.freeze({
        key: `${input.scenarioId}:awaiting-settlement`,
        scenarioId: input.scenarioId,
        scenarioName: input.scenarioName,
        color: input.color,
        status: "stale" as const,
        pressureBasis: input.pressureBasis,
        completedBeatCount: 0,
        maximumBeatCount: 8,
        generationAge: 0,
        generationSequence: 0,
        generationRole: "pending" as const,
        targetPreview: true,
        espvr: Object.freeze([]),
        edpvr: Object.freeze([]),
      }));
    }
  }
  const historyBeats = normalizeScientificPvHistoryBeatsV1(
    input.historyBeats ?? input.historyCount,
  );
  const historyMode = input.historyMode ?? "fade";
  return Object.freeze(overlays.filter((overlay) => {
    const age = Math.max(0, overlay.generationAge ?? 0);
    return age === 0 || scientificPvHistoryAlphaV1(
      age,
      historyBeats,
      historyMode,
    ) > 0;
  }));
}

function scientificPvRelationGenerationOverlayV1(input: Readonly<{
  generation: ScientificPvRelationGenerationV1;
  scenarioId: string;
  scenarioName?: string;
  color: string;
  displayMode: Exclude<PvRelationDisplayMode, "off">;
  pressureBasis: PvRelationPressureBasis;
  showSamplePoints: boolean;
  generationAge: number;
  generationRole: "pending" | "current" | "history";
}>): ScientificProductPvRelationOverlayPresentationV1 | null {
  const presentation = input.generation.snapshot;
  if (presentation === null) return null;
  const job = presentation.jobSnapshot;
  const protocol = presentation.result;
  const researchProtocol = presentation.researchResultV3
    ?? job?.researchResultV3
    ?? null;
  const progress = job?.progress ?? null;
  const beats = protocol?.beats ?? job?.beats ?? progress?.beats ?? [];
  const fitPointSelection = protocol?.fitPointSelection
    ?? progress?.fitPointSelection
    ?? null;
  const analysis = protocol?.analysis ?? progress?.provisionalAnalysis ?? null;
  const completedBeatCount = job?.researchProgressV3?.completedUniqueBeatCount
    ?? researchProtocol?.beats.length
    ?? progress?.completedBeatCount
    ?? beats.length;
  const maximumBeatCount = researchProtocol === null
    ? protocol?.policy.maximumTotalBeatCount
    ?? progress?.maximumTotalBeatCount
    ?? 8
    : researchProtocol.policy.lowerLoading.maximumTotalBeatCount
      + researchProtocol.policy.higherLoading.maximumTotalBeatCount - 1;
  if (fitPointSelection === null || analysis === null) {
    if (presentation.status !== "running") return null;
    return Object.freeze({
      key: `${input.scenarioId}:${input.generation.generationId}`,
      scenarioId: input.scenarioId,
      scenarioName: input.scenarioName,
      color: input.color,
      status: "running" as const,
      pressureBasis: input.pressureBasis,
      completedBeatCount,
      maximumBeatCount,
      generationAge: input.generationAge,
      generationSequence: input.generation.sequence,
      generationRole: input.generationRole,
      targetPreview: pvRelationGenerationTargetsPreviewV1(input.generation),
      espvr: Object.freeze([]),
      edpvr: Object.freeze([]),
    });
  }
  const curves = buildMainWireScientificPvRelationOverlayCurvesV2({
    beats,
    fitPointSelection,
    analysis,
  });
  const basisCurves = input.pressureBasis === "transmural"
    ? curves.transmural
    : curves.intracavitaryAbsolute;
  const selectedBeatIds = new Set(fitPointSelection.includedBeatIds);
  const selectedBeats = beats.filter((beat) =>
    selectedBeatIds.has(`ivc-beat-${beat.beatIndex}`));
  const esSamples = scientificPvRelationEndpointSamplesV1(
    selectedBeats,
    "endSystolic",
    input.pressureBasis,
  );
  const edSamples = scientificPvRelationEndpointSamplesV1(
    selectedBeats,
    "endDiastolic",
    input.pressureBasis,
  );
  const higherLoading = researchProtocol?.lanes.higherLoading ?? null;
  const selectedHigherBeatIds = new Set(
    higherLoading?.fitPointSelection.includedBeatIds ?? [],
  );
  const selectedHigherBeats = higherLoading?.achievedDeclaredEdvDirection
    ? higherLoading.beats.filter((beat) =>
        beat.valid && selectedHigherBeatIds.has(beat.beatId))
    : [];
  const candidateHigherEs = scientificPvRelationEndpointSamplesV1(
    selectedHigherBeats,
    "endSystolic",
    input.pressureBasis,
  );
  const candidateHigherEd = scientificPvRelationEndpointSamplesV1(
    selectedHigherBeats,
    "endDiastolic",
    input.pressureBasis,
  );
  const hasRenderableHigherLane = candidateHigherEs.length >= 2
    && candidateHigherEd.length >= 2;
  const higherEsObserved = hasRenderableHigherLane
    ? candidateHigherEs
    : Object.freeze([]);
  const higherEdObserved = hasRenderableHigherLane
    ? candidateHigherEd
    : Object.freeze([]);
  const espvr = scientificPvRelationDisplayCurveV1({
    fitted: basisCurves.espvr,
    observed: esSamples,
    displayMode: input.displayMode,
  });
  const edpvr = scientificPvRelationDisplayCurveV1({
    fitted: basisCurves.edpvr,
    observed: edSamples,
    displayMode: input.displayMode,
  });
  const hasLimitedFit = analysis.espvr.status === "rejected"
    || analysis.edpvr.status === "rejected"
    || protocol?.failureReason !== null && protocol?.failureReason !== undefined
    || higherLoading !== null
      && higherLoading.acquisitionStatus !== "accepted";
  const unsupportedLeftRegurgitation =
    protocol?.terminationReason ===
      "unsupported-mitral-or-aortic-regurgitation";
  const status = unsupportedLeftRegurgitation
    ? "error" as const
    : presentation.status === "running"
    ? "running" as const
    : presentation.status === "error"
      ? "error" as const
      : hasLimitedFit || espvr.length < 2 || edpvr.length < 2
        ? "limited" as const
        : "complete" as const;
  return Object.freeze({
    key: `${input.scenarioId}:${input.generation.generationId}`,
    scenarioId: input.scenarioId,
    scenarioName: input.scenarioName,
    color: input.color,
    status,
    pressureBasis: input.pressureBasis,
    completedBeatCount,
    maximumBeatCount,
    generationAge: input.generationAge,
    generationSequence: input.generation.sequence,
    generationRole: input.generationRole,
    targetPreview: pvRelationGenerationTargetsPreviewV1(input.generation),
    espvr,
    edpvr,
    espvrQuality: analysis.espvr.status === "accepted"
      ? "accepted" as const
      : espvr.length >= 2 ? "limited" as const : "unavailable" as const,
    edpvrQuality: analysis.edpvr.status === "accepted"
      ? "accepted" as const
      : edpvr.length >= 2 ? "limited" as const : "unavailable" as const,
    ...(higherLoading === null
      ? {}
      : {
          higherLoadingEndSystolicObserved: higherEsObserved,
          higherLoadingEndDiastolicObserved: higherEdObserved,
          higherLoadingQuality: higherLoading.acquisitionStatus === "accepted"
            ? "accepted" as const
            : hasRenderableHigherLane
              ? "limited" as const
              : "unavailable" as const,
        }),
    ...(unsupportedLeftRegurgitation && protocol?.failureReason
      ? { errorMessage: protocol.failureReason }
      : {}),
    domainAnchorPoints: Object.freeze([
      ...esSamples,
      ...edSamples,
      ...higherEsObserved,
      ...higherEdObserved,
    ]),
    ...(input.showSamplePoints
      ? {
          endSystolicSamples: esSamples,
          endDiastolicSamples: edSamples,
        }
      : {}),
  });
}

function pvRelationGenerationTargetsPreviewV1(
  generation: ScientificPvRelationGenerationV1,
): boolean {
  const calculationSource = generation.snapshot?.calculationSource
    ?? generation.source.sourceIdentity.calculationSource;
  return calculationSource !== "visible-period1-source";
}

function scientificPvRelationDisplayCurveV1(input: Readonly<{
  fitted: ReturnType<
    typeof buildMainWireScientificPvRelationOverlayCurvesV2
  >["transmural"]["espvr"];
  observed: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[];
  displayMode: Exclude<PvRelationDisplayMode, "off">;
}>): readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[] {
  if (
    input.displayMode === "standard"
    && (
      input.fitted === null
      || input.fitted.formalFitStatus === "rejected"
    )
  ) {
    return Object.freeze([...input.observed].sort(
      (left, right) => left.volumeMl - right.volumeMl,
    ));
  }
  if (input.fitted === null) return Object.freeze([]);
  return input.fitted.points;
}

function scientificPvRelationEndpointSamplesV1(
  beats: readonly (
    MainWireScientificPvRelationBeatV2 | MainWireScientificPvRelationBeatV3
  )[],
  endpoint: "endSystolic" | "endDiastolic",
  pressureBasis: PvRelationPressureBasis,
): readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[] {
  return Object.freeze(beats.flatMap((beat) => {
    const point = beat[endpoint];
    return point === null
      ? []
      : [Object.freeze({
          volumeMl: point.volumeMl,
          pressureMmHg: pressureBasis === "transmural"
            ? point.transmuralPressureMmHg
            : point.absolutePressureMmHg,
        })];
  }));
}

type ScientificHemodynamicSeriesEntryV1 = Readonly<{
  presentation: ScientificProductScenarioPresentationV1;
  series: ScientificProductHemodynamicProtocolSeriesV1;
  displayedSourceIdentity:
    ScientificHemodynamicDisplayedSourceIdentityV1 | null;
}>;

type ScientificHemodynamicDisplayedSourceIdentityV1 = Readonly<{
  parameterEpoch: number;
  controlStateSha256: string;
}>;

function scientificHemodynamicDetailModeV1(
  panel: PanelDef,
): HemodynamicDetailMode {
  return panel.hemodynamicDetailMode ??
    (panel.view?.kind === "graph"
      ? panel.view.hemodynamicDetailMode
      : undefined) ??
    DEFAULT_HEMODYNAMIC_DETAIL_MODE;
}

export function scientificHemodynamicDisplayModeV1(
  detailMode: HemodynamicDetailMode,
): ScientificHemodynamicResponseDisplayModeV1 {
  if (detailMode === "settled-reference") return "settled";
  if (detailMode === "compare") return "both";
  return "estimated";
}

function scientificHemodynamicHistoryCountV1(panel: PanelDef): number {
  return panel.hemodynamicParameterHistoryCount ??
    (panel.view?.kind === "graph"
      ? panel.view.hemodynamicParameterHistoryCount
      : undefined) ??
    DEFAULT_HEMODYNAMIC_PARAMETER_HISTORY_COUNT;
}

function scientificHemodynamicResponseScenarioV1(
  side: "right" | "left",
  presentation: ScientificProductScenarioPresentationV1,
  series: ScientificProductHemodynamicProtocolSeriesV1,
  historyCount: number,
  displayedSourceIdentity:
    ScientificHemodynamicDisplayedSourceIdentityV1 | null,
): ScientificHemodynamicResponseScenarioV1 {
  const current = scientificHemodynamicResponseGenerationV1(
    side,
    presentation.descriptor.name,
    series.current,
    Object.freeze({
      displayedSourceIdentity,
      history: false,
    }),
  );
  const history = series.history.slice(0, historyCount).flatMap((generation) => {
    const converted = scientificHemodynamicResponseGenerationV1(
      side,
      presentation.descriptor.name,
      generation,
      Object.freeze({
        displayedSourceIdentity,
        history: true,
      }),
    );
    return converted === null ? [] : [converted];
  });
  const warnings = [
    ...(series.lastFailure === null
      ? []
      : [`The latest response-curve update was not completed: ${series.lastFailure.errorMessage}`]),
  ];
  return Object.freeze({
    id: presentation.descriptor.id,
    name: presentation.descriptor.name,
    color: presentation.descriptor.color,
    current,
    history: Object.freeze(history),
    visible: true,
    warnings: Object.freeze(warnings),
  });
}

export function scientificHemodynamicResponseGenerationV1(
  side: "right" | "left",
  scenarioName: string,
  generation: ScientificProductHemodynamicProtocolGenerationV1 | null,
  context: Readonly<{
    displayedSourceIdentity:
      ScientificHemodynamicDisplayedSourceIdentityV1 | null;
    history: boolean;
  }> = Object.freeze({
    displayedSourceIdentity: null,
    history: false,
  }),
): ScientificHemodynamicResponseGenerationV1 | null {
  const protocol = generation?.snapshot;
  if (generation === null || protocol === null || protocol === undefined) {
    return null;
  }
  const data = guytonPaneDataV1(
    side,
    scenarioName,
    protocol,
    scientificHemodynamicResultV1(protocol),
  );
  const estimatedPoints = data.sweepPoints.filter(({ classification }) =>
    classification === "estimated" || classification === "unclassified");
  const settledPoints = data.sweepPoints.filter(({ classification }) =>
    classification !== "estimated" && classification !== "unclassified");
  const warnings =
    data.status.qc.level === "warning" || data.status.qc.level === "fail"
      ? [data.status.qc.summary, ...(data.status.qc.details ?? [])]
      : [];
  const calculationSource =
    generation.source.sourceIdentity.calculationSource;
  const parameterStateRole = context.history
    ? "history" as const
    : calculationSource === "automatic-strict-candidate"
      ? "target-preview" as const
      : context.displayedSourceIdentity !== null
        && !sameHemodynamicDisplayedSourceIdentityV1(
          generation,
          context.displayedSourceIdentity,
        )
        ? "previous" as const
        : calculationSource === "visible-period1-source"
          ? "visible-current" as const
          : "target-preview" as const;
  return Object.freeze({
    id: generation.generationId,
    label: parameterStateRole === "history"
      || parameterStateRole === "previous"
      ? "Previous parameter state"
      : calculationSource === "automatic-strict-candidate"
        ? generation.status === "complete"
          ? "Automatic strict candidate"
          : "Computing strict candidate"
        : calculationSource ===
            "independent-case-source-warm-continuation"
          ? "Calculated target preview"
          : generation.status === "complete"
            ? "Completed parameter state"
            : "Current parameter state",
    calculationSource,
    parameterStateRole,
    vascularReturnCurve: data.vascularReturnCurve,
    estimatedCardiacSegments: data.estimatedCardiacSegments ?? [],
    settledCardiacSegments: data.cardiacPreloadSegments ?? [],
    estimatedPoints: Object.freeze(estimatedPoints),
    settledPoints: Object.freeze(settledPoints),
    operatingPoint: data.operatingPoint,
    warnings: Object.freeze(warnings),
  });
}

function scientificHemodynamicResultV1(
  protocol: ScientificProductHemodynamicProtocolPresentationV1,
):
  | MainWireScientificGuytonStarlingProtocolResultV1
  | MainWireScientificGuytonStarlingProtocolResultV2
  | null {
  return protocol.result?.protocolId ===
      "main-wire-scientific-guyton-starling-protocol-v1" ||
    protocol.result?.protocolId ===
      "main-wire-scientific-guyton-starling-protocol-v2"
    ? protocol.result
    : null;
}

export function scientificHemodynamicAggregateStatusV1(
  side: "right" | "left",
  entries: readonly ScientificHemodynamicSeriesEntryV1[],
): ScientificHemodynamicProtocolStatusV1 {
  const pending = entries.filter(({ series }) => series.pending !== null);
  if (pending.length > 0) {
    const progress = pending.flatMap(({ series }) => {
      const value = series.pending?.snapshot?.jobSnapshot?.progress;
      return value === undefined || value === null ? [] : [value];
    });
    const completed = progress.reduce(
      (total, value) => total + value.fastPreviewCompletedPointCount,
      0,
    );
    const total = progress.reduce(
      (sum, value) => sum + value.fastPreviewPlannedPointCount,
      0,
    );
    return Object.freeze({
      status: "running" as const,
      label: pending.length === 1
        ? "Updating curve…"
        : `Updating ${pending.length} scenarios…`,
      phase: total > 0 ? `${completed}/${total} standard points` : undefined,
      progress: total > 0 ? Object.freeze({ completed, total }) : undefined,
      qc: Object.freeze({
        level: "pending" as const,
        summary:
          "Previous parameter curves remain visible until the updated curve is ready.",
      }),
    });
  }

  const failures = entries.flatMap(({ series }) =>
    series.lastFailure === null ? [] : [series.lastFailure.errorMessage]);
  if (failures.length > 0) {
    const retainsPrevious = entries.some(({ series }) =>
      series.current !== null);
    return Object.freeze({
      status: "error" as const,
      label: retainsPrevious ? "Curve update failed" : "Curve unavailable",
      qc: Object.freeze({
        level: "fail" as const,
        summary: failures.join(" "),
      }),
    });
  }

  const identityMismatches = entries.filter(
    ({ series, displayedSourceIdentity }) =>
    series.current !== null
    && displayedSourceIdentity !== null
    && !sameHemodynamicDisplayedSourceIdentityV1(
      series.current,
      displayedSourceIdentity,
    ),
  );
  const retainedPrevious = identityMismatches.filter(({ series }) =>
    series.current?.source.sourceIdentity.calculationSource
      !== "automatic-strict-candidate"
  );
  if (retainedPrevious.length > 0) {
    return Object.freeze({
      status: "running" as const,
      label: "Waiting for settled curve…",
      qc: Object.freeze({
        level: "pending" as const,
        summary:
          "Previous parameter curves remain visible while automatic strict settlement prepares the new source.",
      }),
    });
  }

  const strictTargetPreviews = identityMismatches.filter(({ series }) =>
    series.current?.source.sourceIdentity.calculationSource
      === "automatic-strict-candidate"
  );
  if (strictTargetPreviews.length > 0) {
    const allComplete = strictTargetPreviews.every(({ series }) =>
      series.current?.status === "complete"
    );
    return Object.freeze({
      status: "running" as const,
      label: allComplete
        ? "Strict target preview ready"
        : "Computing strict target preview…",
      qc: Object.freeze({
        level: "pending" as const,
        summary: allComplete
          ? "A settled strict candidate for the target is ready while the live transition catches up."
          : "The strict target preview is updating while the live transition catches up.",
      }),
    });
  }

  const currentStatuses = entries.flatMap(({ presentation, series }) => {
    const protocol = series.current?.snapshot;
    if (protocol === null || protocol === undefined) return [];
    return [guytonPaneDataV1(
      side,
      presentation.descriptor.name,
      protocol,
      scientificHemodynamicResultV1(protocol),
    ).status];
  });
  if (currentStatuses.length === 1) return currentStatuses[0]!;
  if (currentStatuses.length > 1) {
    return Object.freeze({
      status: currentStatuses.some(({ status }) => status === "running")
        ? ("running" as const)
        : currentStatuses.some(({ status }) => status === "partial")
          ? ("partial" as const)
          : ("complete" as const),
      label: `${currentStatuses.length} scenarios`,
      qc: Object.freeze({
        level: "pass" as const,
        summary:
          "Quality notices are shown beside the corresponding scenario.",
      }),
    });
  }

  return Object.freeze({
    status: "running" as const,
    label: "Preparing curves…",
    qc: Object.freeze({
      level: "pending" as const,
      summary: "The first parameter curve is being prepared.",
    }),
  });
}

function displayedHemodynamicSourceIdentityV1(
  registry: ScientificProductRuntimeRegistryPortV1,
  scenarioId: string,
): ScientificHemodynamicDisplayedSourceIdentityV1 | null {
  const snapshot = registry.getRuntime(scenarioId)?.controlStore.getSnapshot();
  if (snapshot === undefined) return null;
  return Object.freeze({
    parameterEpoch: snapshot.provenance.displayedParameterEpoch,
    controlStateSha256:
      snapshot.provenance.displayedControlStateSha256,
  });
}

function sameHemodynamicDisplayedSourceIdentityV1(
  generation: ScientificProductHemodynamicProtocolGenerationV1,
  displayed: ScientificHemodynamicDisplayedSourceIdentityV1,
): boolean {
  return generation.source.sourceIdentity.parameterEpoch
      === displayed.parameterEpoch
    && generation.source.sourceIdentity.controlStateSha256
      === displayed.controlStateSha256;
}

/**
 * Builds a display-only quick-response locus without changing scientific
 * eligibility. Every finite observation is connected in requested TBV order;
 * a requested target with no finite observation remains an explicit gap.
 */
export function scientificQuickResponseDisplaySegmentsV1(
  orderedTargetScales: readonly number[],
  observations: readonly Readonly<{
    targetScale: number;
    point: ScientificGuytonCurvePointV1;
  }>[],
  baselinePoint?: ScientificGuytonCurvePointV1,
): readonly (readonly ScientificGuytonCurvePointV1[])[] {
  const pointByScale = new Map(
    observations
      .filter(({ targetScale, point }) => Number.isFinite(targetScale)
        && Number.isFinite(point.pressureMmHg)
        && Number.isFinite(point.flowLPerMin))
      .map(({ targetScale, point }) => [targetScale, point] as const),
  );
  const segments = orderedTargetScales.reduce<ScientificGuytonCurvePointV1[][]>(
    (currentSegments, targetScale) => {
      const point = targetScale === 1 && baselinePoint !== undefined
        ? baselinePoint
        : pointByScale.get(targetScale) ?? null;
      if (point === null) {
        if (currentSegments.at(-1)?.length) currentSegments.push([]);
        return currentSegments;
      }
      const current = currentSegments.at(-1);
      if (current === undefined) currentSegments.push([point]);
      else current.push(point);
      return currentSegments;
    },
    [],
  );
  return Object.freeze(segments
    .filter((segment) => segment.length > 0)
    .map((segment) => Object.freeze(segment)));
}

function guytonPaneDataV1(
  side: "right" | "left",
  scenarioName: string,
  protocol: ScientificProductHemodynamicProtocolPresentationV1,
  result:
    | MainWireScientificGuytonStarlingProtocolResultV1
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
      estimatedCardiacSegments: Object.freeze([]),
      sweepPoints: Object.freeze([]),
      status: Object.freeze({
        status: "running" as const,
        label: "Preparing curve…",
        phase:
          "Vascular response and cardiac-output points",
        qc: Object.freeze({
          level: "pending" as const,
          summary:
            "The source scenario remains unchanged while the Worker runs.",
        }),
      }),
    });
  }
  const vascular =
    side === "right"
      ? vascularSource.rightVascularFunction
      : vascularSource.leftVascularFunction;
  const allV2Evidence =
    result !== null && "preloadPointEvidence" in result
      ? result.preloadPointEvidence
      : (partial?.preloadPointEvidence ?? null);
  const v2Evidence =
    allV2Evidence?.filter(
      ({ provenance }) => provenance.direction !== "independent-audit",
    ) ?? null;
  const operatingRows =
    v2Evidence !== null
      ? v2Evidence.map(({ point, provenance }) =>
          Object.freeze({
            point,
            pointId: provenance.pointId,
            auditStatus: provenance.auditStatus,
            auditMaximumNormalizedStateDelta:
              provenance.auditMaximumNormalizedStateDelta,
          }),
        )
      : (result?.preloadOperatingPoints ?? []).map((point) =>
          Object.freeze({
            point,
            pointId: `tbv-${point.targetScale.toFixed(6)}`,
            auditStatus: "not-scheduled" as const,
            auditMaximumNormalizedStateDelta: null,
          }),
        );
  const operatingPoints = operatingRows.map(({ point }) => point);
  const fastPreview =
    result !== null && "fastPreloadPreview" in result
      ? result.fastPreloadPreview
      : (partial?.fastPreloadPreview ?? null);
  const fastEvidence = fastPreview?.evidence ?? [];
  const rapidEstimateCount = fastEvidence.filter(
    (evidence) =>
      evidence.evidenceClass === "near-period1-estimate" ||
      evidence.evidenceClass === "finite-hold-unclassified",
  ).length;
  const nearPeriod1EstimateCount = fastEvidence.filter(
    (evidence) => evidence.evidenceClass === "near-period1-estimate",
  ).length;
  const finiteHoldUnclassifiedCount = fastEvidence.filter(
    (evidence) => evidence.evidenceClass === "finite-hold-unclassified",
  ).length;
  const fastFailureCount = fastEvidence.filter(
    (evidence) => evidence.evidenceClass === "failure",
  ).length;
  const isQuickOverview = protocol.detailMode === "standard"
    && result === null;
  const quickResponseQuality = scientificQuickResponseQualityV1({
    nearSteadyPointCount: nearPeriod1EstimateCount,
    provisionalPointCount: finiteHoldUnclassifiedCount,
    failureCount: fastFailureCount,
  });
  const baselinePeriodicity =
    result?.baselinePeriodicity ??
    partial?.baselinePeriodicity ??
    "not-converged";
  const pressure = (
    point: MainWireScientificGuytonStarlingProtocolResultV1["preloadOperatingPoints"][number],
  ) =>
    side === "right"
      ? point.meanRapTransmuralMmHg
      : point.meanLapTransmuralMmHg;
  const p1Rows = operatingRows.filter(
    ({ point }) =>
      point.acceptedForPeriod1Locus &&
      pressure(point) !== null &&
      point.netCardiacOutputLMin !== null,
  );
  const p1ByTargetScale = new Map(
    p1Rows.map((row) => [row.point.targetScale, row]),
  );
  const orderedTargetScales = [
    ...new Set(operatingPoints.map((point) => point.targetScale)),
  ].sort((a, b) => a - b);
  const cardiacPreloadSegments = orderedTargetScales
    .reduce<Array<Array<(typeof p1Rows)[number]>>>((segments, targetScale) => {
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
    }, [])
    .filter((segment) => segment.length > 0);
  const orderedP1Rows = [...p1Rows].sort(
    (left, right) => left.point.targetScale - right.point.targetScale,
  );
  const rejectedCount = operatingPoints.length - p1Rows.length;
  const baseline = p1Rows.find(({ point }) => point.targetScale === 1)?.point;
  const estimatedRows = fastEvidence.flatMap((evidence) => {
    if (
      evidence.evidenceClass !== "near-period1-estimate" &&
      evidence.evidenceClass !== "finite-hold-unclassified"
    )
      return [];
    return [
      Object.freeze({
        targetScale: evidence.acquisition.target.targetScale,
        evidence,
        point: Object.freeze({
          pressureMmHg:
            side === "right"
              ? evidence.observation.meanRapTransmuralMmHg
              : evidence.observation.meanLapTransmuralMmHg,
          flowLPerMin: evidence.observation.netCardiacOutputLMin,
          ...(evidence.observation.lvPressureVolume === null
            ? {}
            : {
                lvPressureVolumeObservation: Object.freeze({
                  endDiastolicVolumeMl:
                    evidence.observation.lvPressureVolume.endDiastolicVolumeMl,
                  endDiastolicTransmuralPressureMmHg:
                    evidence.observation.lvPressureVolume
                      .endDiastolicTransmuralPressureMmHg,
                  endSystolicVolumeMl:
                    evidence.observation.lvPressureVolume.endSystolicVolumeMl,
                  endSystolicTransmuralPressureMmHg:
                    evidence.observation.lvPressureVolume
                      .endSystolicTransmuralPressureMmHg,
                  strokeWorkMmHgMl:
                    evidence.observation.lvPressureVolume.strokeWorkMmHgMl,
                  evidenceRole: "tbv-operating-point-observation-only" as const,
                  crossPointFitEligible: false as const,
                }),
              }),
        }),
      }),
    ];
  });
  const estimatedScales = [
    ...new Set([
      ...fastEvidence.map(
        (evidence) => evidence.acquisition.target.targetScale,
      ),
      ...(baseline === undefined ? [] : [1]),
    ]),
  ].sort((left, right) => left - right);
  const baselineDisplayPoint = baseline === undefined
    ? undefined
    : Object.freeze({
        pressureMmHg: pressure(baseline)!,
        flowLPerMin: baseline.netCardiacOutputLMin!,
      });
  const estimatedCardiacSegments = scientificQuickResponseDisplaySegmentsV1(
    estimatedScales,
    estimatedRows.map(({ targetScale, point }) => ({ targetScale, point })),
    baselineDisplayPoint,
  );
  const auditedReferences = operatingRows.filter(
    ({ auditStatus }) =>
      auditStatus !== "not-scheduled" && auditStatus !== "pending",
  );
  const auditMatchedCount = auditedReferences.filter(
    ({ auditStatus }) => auditStatus === "matched",
  ).length;
  const auditWarningCount = auditedReferences.length - auditMatchedCount;
  return Object.freeze({
    side,
    title: `${scenarioName} · ${side === "right" ? "Right" : "Left"} Guyton / Starling`,
    vascularReturnCurve: Object.freeze(
      vascular.points.map((point) =>
        Object.freeze({
          pressureMmHg: point.pressureTransmuralMmHg,
          flowLPerMin: point.flowLMin,
        }),
      ),
    ),
    cardiacPreloadLocus: Object.freeze(
      orderedP1Rows.map(({ point }) =>
        Object.freeze({
          pressureMmHg: pressure(point)!,
          flowLPerMin: point.netCardiacOutputLMin!,
        }),
      ),
    ),
    cardiacPreloadSegments: Object.freeze(
      cardiacPreloadSegments.map((segment) =>
        Object.freeze(
          segment.map(({ point }) =>
            Object.freeze({
              pressureMmHg: pressure(point)!,
              flowLPerMin: point.netCardiacOutputLMin!,
            }),
          ),
        ),
      ),
    ),
    estimatedCardiacSegments: Object.freeze(
      estimatedCardiacSegments.map((segment) => Object.freeze(segment)),
    ),
    sweepPoints: Object.freeze([
      ...estimatedRows.map(({ evidence, point }) =>
        Object.freeze({
          id: evidence.evidenceId,
          ...point,
          totalBloodVolumeMl: evidence.acquisition.target.totalBloodVolumeMl,
          classification:
            evidence.evidenceClass === "near-period1-estimate"
              ? ("estimated" as const)
              : ("unclassified" as const),
          reason:
            evidence.evidenceClass === "near-period1-estimate"
              ? `Predictor-assisted ${evidence.acquisition.completedNaturalBeatCountAfterPrediction}-beat estimate; residual ${evidence.closure.latestPeriod1MaximumNormalizedDelta.toExponential(2)}; canonical P1 not established.`
              : `${evidence.reason}; residual ${evidence.closure.latestPeriod1MaximumNormalizedDelta.toExponential(2)}; contraction ratio ${evidence.closure.residualRatio.toFixed(2)}; canonical P1 not established.`,
        }),
      ),
      ...operatingRows.flatMap<ScientificGuytonSweepPointV1>(
        ({ point, pointId, auditStatus, auditMaximumNormalizedStateDelta }) => {
          if (
            point.status === "period2-suspect" &&
            point.period2Branches !== null
          ) {
            return point.period2Branches.map((branch) =>
              Object.freeze({
                id: `${pointId}-${branch.branchId}`,
                pressureMmHg:
                  side === "right"
                    ? branch.meanRapTransmuralMmHg
                    : branch.meanLapTransmuralMmHg,
                flowLPerMin: branch.netCardiacOutputLMin,
                totalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
                classification: "period2" as const,
                reason: `${branch.branchId} branch of a settled period-2-suspect orbit; excluded`,
              }),
            );
          }
          const x = pressure(point);
          const y = point.netCardiacOutputLMin;
          if (x === null || y === null) return [];
          return [
            Object.freeze({
              id: pointId,
              pressureMmHg: x,
              flowLPerMin: y,
              totalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
              ...(point.lvPressureVolumeObservation === null
                ? {}
                : {
                    lvPressureVolumeObservation: Object.freeze({
                      endDiastolicVolumeMl:
                        point.lvPressureVolumeObservation.endDiastolic.volumeMl,
                      endDiastolicTransmuralPressureMmHg:
                        point.lvPressureVolumeObservation.endDiastolic
                          .transmuralPressureMmHg,
                      endSystolicVolumeMl:
                        point.lvPressureVolumeObservation.endSystolic.volumeMl,
                      endSystolicTransmuralPressureMmHg:
                        point.lvPressureVolumeObservation.endSystolic
                          .transmuralPressureMmHg,
                      strokeWorkMmHgMl:
                        point.lvPressureVolumeObservation.strokeWorkMmHgMl,
                      evidenceRole:
                        "tbv-operating-point-observation-only" as const,
                      crossPointFitEligible: false as const,
                    }),
                  }),
              classification:
                point.status === "period1-converged"
                  ? auditStatus === "path-dependence-suspect" ||
                    auditStatus === "audit-failed"
                    ? ("audit-suspect" as const)
                    : ("period1" as const)
                  : point.status === "period2-suspect"
                    ? ("period2" as const)
                    : ("rejected" as const),
              reason:
                auditStatus === "path-dependence-suspect"
                  ? `Independent source audit converged to a materially different accepted state${auditMaximumNormalizedStateDelta === null ? "" : ` (maximum normalized delta ${auditMaximumNormalizedStateDelta.toExponential(2)})`}.`
                  : auditStatus === "audit-failed"
                    ? "Independent source audit did not provide a matched P1 checkpoint."
                    : (point.failureReason ?? undefined),
            }),
          ];
        },
      ),
    ]),
    operatingPoint:
      baseline === undefined
        ? undefined
        : Object.freeze({
            pressureMmHg: pressure(baseline)!,
            flowLPerMin: baseline.netCardiacOutputLMin!,
            label: "Source operating point",
          }),
    vascularCurveLabel: "Fixed-volume vascular function (PV-law derived)",
    cardiacCurveLabel:
      v2Evidence === null
        ? "Independent-TBV net aortic-output locus (P1 only)"
        : "Bidirectional-continuation net aortic-output locus (P1 only)",
    status: Object.freeze({
      status:
        protocol.status === "running"
          ? ("running" as const)
          : protocol.status === "error"
            ? ("error" as const)
            : isQuickOverview
              ? quickResponseQuality.status
              : rejectedCount === 0 && fastFailureCount === 0
                ? ("complete" as const)
                : ("partial" as const),
      label:
        protocol.status === "running"
          ? isQuickOverview
            ? "Updating quick response…"
            : "Calculating steady-state reference…"
          : protocol.status === "error"
            ? "Curve unavailable"
            : isQuickOverview
              ? "Quick response ready"
              : "Steady-state reference ready",
      phase:
        protocol.status === "running"
          ? `${partial?.progress.fastPreviewCompletedPointCount ?? fastEvidence.length}/${partial?.progress.fastPreviewPlannedPointCount ?? 9} standard points · ${partial?.progress.completedPointCount ?? operatingPoints.length} detailed references · ${partial?.progress.completedBeatCount ?? 0} beats`
          : result !== null && "exploration" in result
            ? `Envelope ${result.exploration.normalizedTotalBloodVolumeEnvelope.join("–")}× TBV · lower ${result.exploration.lowerBoundaryStatus} · higher ${result.exploration.higherBoundaryStatus} · ${partial?.progress.completedBeatCount ?? 0} beats`
            : undefined,
      progress:
        protocol.status === "running" && partial !== null
          ? Object.freeze({
              completed: partial.progress.completedPointCount,
              total: partial.progress.plannedPointCountLowerBound,
            })
          : undefined,
      qc: Object.freeze({
        level:
          protocol.status === "running"
            ? ("pending" as const)
            : protocol.status === "error"
              ? ("fail" as const)
              : baselinePeriodicity === "period1-converged"
                ? isQuickOverview
                  ? quickResponseQuality.qcLevel
                  : rejectedCount === 0
                      && auditWarningCount === 0
                      && fastFailureCount === 0
                    ? ("pass" as const)
                    : ("warning" as const)
                : ("fail" as const),
        summary:
          protocol.status === "running"
            ? `${rapidEstimateCount} standard estimate${rapidEstimateCount === 1 ? "" : "s"}; ${nearPeriod1EstimateCount} passed the provisional near-steady residual screen. Detailed reference points replace them as they converge.`
            : protocol.status === "error"
              ? (protocol.errorMessage ??
                "The preload protocol stopped before completion.")
              : baselinePeriodicity === "period1-converged"
                ? isQuickOverview
                  ? quickResponseQuality.summary
                  : `${p1Rows.length} P1 point${p1Rows.length === 1 ? "" : "s"}; ${rejectedCount} P2-suspect/blocked attempt${rejectedCount === 1 ? "" : "s"}; ${auditMatchedCount} matched audit${auditMatchedCount === 1 ? "" : "s"}; ${auditWarningCount} audit warning${auditWarningCount === 1 ? "" : "s"}.`
                : "The source beat did not reproduce period-1 closure.",
        details: Object.freeze([
          "TBV sweep is a one-dimensional closed-loop preload locus, not a Guyton pump experiment or a surface.",
          "Settled period-2-suspect branches are shown separately and never averaged into the P1 curve.",
          "Quick-response points use three natural beats after predictor initialization and never enter settled P1/P2 evidence or relation fits.",
          "An audit-warning marker remains P1 continuation evidence, but it is isolated from the curve when the independent source audit indicates path dependence.",
        ]),
      }),
    }),
  });
}

function ScientificMetricsPanelV1({
  registry,
  selections,
}: Readonly<{
  registry: ScientificProductRuntimeRegistryPortV1;
  selections: Readonly<Record<string, readonly string[]>>;
}>) {
  const pick = useStudioBriefingPickV1();
  const presentations = useScientificScenarioPresentationsV1(registry).filter(
    ({ descriptor }) => descriptor.isVisible && selections[descriptor.id],
  );
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
        const ids = [
          ...new Set(
            (selections[presentation.descriptor.id] ?? [])
              .map(scientificMetricId)
              .filter(
                (id): id is MainWireScientificDerivedMetricIdV1 => id !== null,
              ),
          ),
        ];
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
                {presentation.metricEvidence ===
                  "provisional-complete-transient-beat" && (
                  <p className="truncate text-[10px] leading-4 text-wb-subtle">
                    Live · provisional complete beat
                  </p>
                )}
                {presentation.metricEvidence ===
                  "presentation-beat-estimate" && (
                  <p className="truncate text-[10px] leading-4 text-wb-subtle">
                    Live · beat estimate
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
                const unavailableReason =
                  metric.unavailableReason ??
                  evaluation.cycleUnavailableReason ??
                  undefined;
                return (
                  <div
                    key={`${presentation.descriptor.id}:${metricId}`}
                    className={`min-w-0 rounded py-0.5 ${
                      pick !== null && pick.isBeatMetricPinned(metricId)
                        ? `pl-1.5 ${studioBriefingPickedEdgeClassV1(true)}`
                        : ""
                    }`}
                    data-metric-id={metricId}
                    data-availability={metric.availability}
                    data-periodic-boundary-completion={String(
                      metric.periodicBoundaryCompletionApplied,
                    )}
                    title={
                      metric.value === null
                        ? unavailableReason
                        : metric.periodicBoundaryCompletionApplied
                          ? `${metricPresentation.label} · periodic boundary completed from the measured terminal sample`
                          : metricPresentation.label
                    }
                  >
                    <dt
                      className="flex items-center gap-1.5 truncate text-[10px] font-medium leading-4 text-wb-subtle"
                      title={metricPresentation.label}
                    >
                      {pick !== null && (
                        <StudioBriefingPickBoxV1
                          kind="metric"
                          size="sm"
                          pickKey={metricId}
                          picked={pick.isBeatMetricPinned(metricId)}
                          label={metricPresentation.label}
                          onToggle={() => pick.toggleBeatMetric(
                            metricId,
                            metricPresentation.label,
                            metricPresentation.unit,
                          )}
                        />
                      )}
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
                      {metric.value === null &&
                        unavailableReason !== undefined && (
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

export function metricEvaluationForPresentationV1(
  presentation: ScientificProductScenarioPresentationV1,
): ScientificProductMetricEvaluationV1 {
  const estimate = presentation.presentationBeatEstimate;
  if (estimate !== null) {
    const cached =
      METRIC_EVALUATION_BY_PRESENTATION_ESTIMATE_V1.get(estimate as object);
    if (cached !== undefined) return cached;
    const evaluation = presentationMetricEvaluationFromEstimateV1(estimate);
    METRIC_EVALUATION_BY_PRESENTATION_ESTIMATE_V1.set(
      estimate as object,
      evaluation,
    );
    return evaluation;
  }
  const cycle = presentation.metricCycle;
  if (cycle === null) return deriveMainWireScientificMetricsV1(null);
  const cached = METRIC_EVALUATION_BY_CYCLE_V1.get(cycle as object);
  if (cached !== undefined) return cached;
  const evaluation =
    "periodicOrbitClassifiedP1" in cycle.evidence
      ? deriveMainWireScientificMetricsV1(
          cycle as MainWireScientificValidatedTerminalCycleV1,
        )
      : deriveMainWireScientificTransientBeatMetricsV1(
          cycle as MainWireScientificCompleteTransientBeatV1,
        );
  METRIC_EVALUATION_BY_CYCLE_V1.set(cycle as object, evaluation);
  return evaluation;
}

function presentationMetricEvaluationFromEstimateV1(
  estimate: RuntimePresentationBeatEstimateV1,
): ScientificProductPresentationMetricEvaluationV1 {
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => {
      const metric = estimate.values[metricId];
      if (metric === undefined) {
        return [metricId, Object.freeze({
          metricId,
          value: null,
          availability: "not-evaluated-at-accepted-state" as const,
          quality: "not-assessed" as const,
          unavailableReason: "dependency-unavailable" as const,
          unavailableDependency: null,
          periodicBoundaryCompletionApplied: false,
        })];
      }
      return [metricId, Object.freeze({
        metricId,
        value: metric.value,
        availability: metric.availability,
        quality: metric.availability === "available"
          ? "accepted-derived" as const
          : "not-assessed" as const,
        unavailableReason: metric.unavailableReason,
        unavailableDependency:
          metric.unavailableDependency as MainWireScientificObservableIdV1
            | null,
        periodicBoundaryCompletionApplied: false,
      })];
    }),
  ) as Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >;
  return Object.freeze({
    registryId: "main-wire-presentation-estimator-registry-v1",
    schemaVersion: 1,
    inputCycleContractId: "main-wire-presentation-beat-estimate-v1",
    cycleAvailability: "estimate",
    cycleInterpretation: "presentation-beat-estimate",
    cycleUnavailableReason: null,
    releaseRef: null,
    firstRevision: estimate.startAcceptedRevision,
    finalRevision: estimate.endAcceptedRevision,
    firstAcceptedTimeSec: estimate.startAcceptedTimeSec,
    finalAcceptedTimeSec: estimate.endAcceptedTimeSec,
    durationSec: estimate.durationSec,
    values: Object.freeze(values),
  });
}

function ScientificControllerPanelV1({
  registry,
  items,
  targetScenarioId,
}: Readonly<{
  registry: ScientificProductRuntimeRegistryPortV1;
  items: readonly ControllerItem[];
  targetScenarioId?: string;
}>) {
  const pick = useStudioBriefingPickV1();
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const descriptor =
    targetScenarioId === undefined
      ? descriptors[0]
      : descriptors.find(({ id }) => id === targetScenarioId);
  const runtime =
    descriptor === undefined ? null : registry.getRuntime(descriptor.id);
  const snapshot = React.useSyncExternalStore(
    runtime?.controlStore.subscribe ?? EMPTY_SUBSCRIBE,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
  );

  if (descriptor === undefined) {
    return targetScenarioId === undefined ? (
      <NoScientificSelectionV1 />
    ) : (
      <ScientificUnavailablePanelV1
        title="Controller target unavailable"
        detail={`Scenario ${targetScenarioId} is not present. The controller was not rebound to another scenario.`}
      />
    );
  }
  if (runtime === null || snapshot === null) {
    return (
      <ScientificUnavailablePanelV1
        title={
          descriptor.lifecycle === "failed"
            ? "Scenario failed"
            : "Scenario is loading"
        }
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
  const controlsEditable =
    snapshot.ownerConnected &&
    (snapshot.phase === "idle" || snapshot.phase.startsWith("live-")) &&
    !snapshot.requestCapacityExhausted;
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
      data-displayed-parameter-epoch={
        snapshot.provenance.displayedParameterEpoch
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-wb-line px-2 py-1.5 text-[11px]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: descriptor.color }}
        />
        <span className="min-w-0 flex-1 truncate font-semibold text-wb-text">
          {descriptor.name}
        </span>
        <span className="truncate text-wb-subtle">
          {compactPhaseLabelV1(snapshot.phase)}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="grid gap-2">
          {items.map((item) => {
            const controlId = scientificControlKindV1(item.paramKey);
            if (controlId === null) {
              return (
                <div
                  key={item.paramKey}
                  className="rounded border border-dashed border-wb-line px-2 py-1.5 text-[10px] text-wb-subtle"
                >
                  {item.label ?? item.paramKey}: unavailable in release 0.2.0
                </div>
              );
            }
            const value = scientificDraftValueV1(snapshot.draft, controlId);
            const domain =
              MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[controlId];
            const releaseItem = scientificControllerItemForReleaseV1(item);
            const controlPick = pick === null
              ? null
              : {
                picked: pick.isControlPinned(controlId),
                toggle: () => pick.toggleControl(controlId),
              };
            return (
              <div
                key={`pick:${scientificControllerInteractionKeyV1(
                  descriptor.id,
                  descriptor.source.releaseSha256,
                  item,
                )}`}
                className={controlPick === null
                  ? undefined
                  : `flex items-start gap-2 rounded ${
                    studioBriefingPickedEdgeClassV1(controlPick.picked)
                  } ${controlPick.picked ? "pl-2" : "pl-0"}`}
              >
              {controlPick !== null && (
                <span className="pt-2">
                  <StudioBriefingPickBoxV1
                    kind="control"
                    pickKey={controlId}
                    picked={controlPick.picked}
                    label={releaseItem.label ?? controlId}
                    onToggle={controlPick.toggle}
                  />
                </span>
              )}
              <div className="min-w-0 flex-1">
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
              </div>
              </div>
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
  registry: ScientificProductRuntimeRegistryPortV1;
  activeScenarioId: string;
}>) {
  const { t } = useTranslation();
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const descriptor = descriptors.find(({ id }) => id === activeScenarioId);
  const runtime =
    descriptor === undefined ? null : registry.getRuntime(descriptor.id);
  const snapshot = React.useSyncExternalStore(
    runtime?.controlStore.subscribe ?? EMPTY_SUBSCRIBE,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT,
  );
  if (descriptor === undefined || snapshot === null) return null;
  const studio = registry.getStudioStatus?.(descriptor.id) ?? null;
  const candidateReady = studio?.strictCandidateAvailable === true;
  const promotionInFlight = studio?.promotionInFlight === true;
  const pinInFlight = studio?.pinInFlight === true;
  const candidatePinned = studio?.strictCandidatePinned === true;
  const strictStatus = studio?.strictPhase === "source-settled"
    ? t("workbench.sidePanel.settings.studioRuntime.sourceSettled")
    : studio?.strictPhase === "candidate-ready"
      ? t("workbench.sidePanel.settings.studioRuntime.candidateReady")
      : studio?.strictPhase === "settled-in-use"
        ? t("workbench.sidePanel.settings.studioRuntime.settledInUse")
        : studio?.strictPhase === "failed"
          ? t("workbench.sidePanel.settings.studioRuntime.failed")
          : t("workbench.sidePanel.settings.studioRuntime.runningAutomatically");
  return (
    <section
      className="space-y-3 border-t border-wb-line pt-4"
      data-testid="scientific-product-transition-mode-v1"
      data-scenario-id={descriptor.id}
      data-studio-runtime="true"
      data-strict-candidate-available={String(candidateReady)}
    >
      <div>
        <h3 className="text-[11px] font-medium text-wb-subtle">
          {t("workbench.sidePanel.settings.studioRuntime.title")}
        </h3>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs font-bold text-wb-text">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: descriptor.color }}
          />
          <span className="truncate">{descriptor.name}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-wb-muted">
          {t("workbench.sidePanel.settings.studioRuntime.description")}
        </p>
      </div>
      <dl className="space-y-1.5 rounded-md border border-wb-line bg-wb-input px-2.5 py-2 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wb-subtle">
            {t("workbench.sidePanel.settings.studioRuntime.liveTrace")}
          </dt>
          <dd className="font-medium text-wb-text">
            {studio?.livePlayback === "suspended"
              ? t("workbench.sidePanel.settings.studioRuntime.paused")
              : snapshot.inFlight
                ? t("workbench.sidePanel.settings.studioRuntime.applyingTarget")
                : t("workbench.sidePanel.settings.studioRuntime.running")}
          </dd>
        </div>
        {studio !== null && studio.livePlayback === "running" && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-wb-subtle">
              {t("workbench.sidePanel.settings.studioRuntime.livePacing")}
            </dt>
            <dd
              className={studio.livePacing.mode === "degraded"
                ? "font-medium text-wb-warning"
                : "font-medium text-wb-text"}
            >
              {studio.livePacing.mode === "realtime-1x"
                ? t("workbench.sidePanel.settings.studioRuntime.pacingRealtime")
                : studio.livePacing.recentAchievedRate === null
                  ? t(
                    "workbench.sidePanel.settings.studioRuntime"
                    + ".pacingDegradedUnknown",
                  )
                  : t(
                    "workbench.sidePanel.settings.studioRuntime"
                    + ".pacingDegradedRate",
                    { rate: studio.livePacing.recentAchievedRate.toFixed(2) },
                  )}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wb-subtle">
            {t("workbench.sidePanel.settings.studioRuntime.strictSettlement")}
          </dt>
          <dd className="font-medium text-wb-text">
            {strictStatus}
          </dd>
        </div>
        {studio !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-wb-subtle">
              {t("workbench.sidePanel.settings.studioRuntime.targetGeneration")}
            </dt>
            <dd className="font-mono text-wb-muted">
              {studio.targetGeneration}
            </dd>
          </div>
        )}
      </dl>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => {
            void registry.promoteStudioSteadyCandidate?.(descriptor.id)
              .catch(() => undefined);
          }}
          disabled={!candidateReady || promotionInFlight || pinInFlight}
          className="min-h-9 rounded border border-wb-accent bg-wb-active px-2 text-xs font-bold text-wb-text disabled:cursor-not-allowed disabled:border-wb-line disabled:bg-wb-input disabled:text-wb-subtle"
        >
          {promotionInFlight
            ? t("workbench.sidePanel.settings.studioRuntime.using")
            : t("workbench.sidePanel.settings.studioRuntime.useSettledState")}
        </button>
        <button
          type="button"
          onClick={() => {
            void registry.pinStudioSteadyCandidate?.(descriptor.id)
              .catch(() => undefined);
          }}
          disabled={
            !candidateReady
            || promotionInFlight
            || pinInFlight
            || candidatePinned
          }
          className="min-h-9 rounded border border-wb-line bg-wb-input px-2 text-xs font-bold text-wb-muted disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pinInFlight
            ? t("workbench.sidePanel.settings.studioRuntime.pinning")
            : candidatePinned
              ? t("workbench.sidePanel.settings.studioRuntime.pinned")
              : t("workbench.sidePanel.settings.studioRuntime.pinRun")}
        </button>
      </div>
      {!candidateReady && (
        <p className="text-[10px] leading-4 text-wb-subtle">
          {t("workbench.sidePanel.settings.studioRuntime.candidateHint")}
        </p>
      )}
      {candidateReady && !candidatePinned && (
        <p className="text-[10px] leading-4 text-wb-subtle">
          {t("workbench.sidePanel.settings.studioRuntime.pinBeforeUse")}
        </p>
      )}
      {studio !== null && studio.pinnedRunCount > 0 && (
        <p className="text-[10px] leading-4 text-wb-subtle">
          {t("workbench.sidePanel.settings.studioRuntime.pinnedRuns", {
            count: studio.pinnedRunCount,
          })}
        </p>
      )}
      {(studio?.strictPhase === "failed"
        || studio?.lastFailure?.lane === "live"
        || studio?.lastFailure?.lane === "presentation") && (
        <button
          type="button"
          onClick={snapshot.actions.resetLiveOrFailure}
          disabled={snapshot.inFlight || promotionInFlight || pinInFlight}
          className="min-h-8 w-full rounded border border-wb-line bg-wb-input px-2 text-xs font-bold text-wb-muted disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t("workbench.sidePanel.settings.studioRuntime.retryTarget")}
        </button>
      )}
      {(studio?.lastActionError
        ?? studio?.lastFailure?.message
        ?? snapshot.errorMessage) !== null && (
        <p className="text-[10px] leading-4 text-wb-danger" role="alert">
          {studio?.lastActionError
            ?? studio?.lastFailure?.message
            ?? snapshot.errorMessage}
        </p>
      )}
    </section>
  );
}

function useScientificScenarioPresentationsV1(
  registry: ScientificProductRuntimeRegistryPortV1,
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
  const observableIds = selectedWaveformObservables(
    config.selectedSignals ?? [],
  );
  return observableIds.map((observableId, index) => {
    const modelName = config.customName ?? presentation.descriptor.name;
    const signalName =
      config.customSignalNames?.[observableId] ??
      scientificObservableShortLabelV1(observableId);
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
  pressureBasis: PvRelationPressureBasis = "intracavitary",
): ScientificWorkbenchPvSeriesV1[] {
  const trajectories = selectedPvTrajectories(
    config.selectedSignals ?? [],
    presentation.workspaceDocument,
  );
  return trajectories.map((trajectory, index) => {
    const modelName = config.customName ?? presentation.descriptor.name;
    const signalName =
      config.customSignalNames?.[trajectory.trajectoryId] ?? trajectory.label;
    const color = scientificSeriesColorV1(
      config.customBaseColor ?? presentation.descriptor.color,
      `${trajectory.trajectoryId}:${index}`,
      config.customSignalColors?.[trajectory.trajectoryId],
    );
    return {
      key: `${presentation.descriptor.id}:${trajectory.trajectoryId}`,
      scenario: chartScenarioV1(presentation, modelName),
      volumeObservableId: trajectory.volumeObservableId,
      pressureObservableId:
        pressureBasis === "transmural"
        && trajectory.volumeObservableId === "hemodynamics.volume.LV"
          ? "hemodynamics.pressure.transmural.LV"
          : trajectory.pressureObservableId,
      signalName,
      color,
    };
  });
}

function scientificPvPanelSelectsLvV1(
  presentation: ScientificProductScenarioPresentationV1,
  config: PanelInstanceConfig,
): boolean {
  return selectedPvTrajectories(
    config.selectedSignals ?? [],
    presentation.workspaceDocument,
  ).some(({ volumeObservableId }) =>
    volumeObservableId === "hemodynamics.volume.LV");
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
    parameterGenerationHistory: presentation.parameterGenerationHistory,
    guideCycleFrames: presentation.metricCycle?.frames ?? null,
    periodicCycleFrames: presentation.periodicCycleFrames,
    cycleDurationSec: presentation.cycleDurationSec,
    transientOriginAcceptedTimeSec: presentation.transientOriginAcceptedTimeSec,
    displayedEvidence: presentation.displayedEvidence,
  });
}

function metricSelectionsFromPanelV1(
  panel: PanelDef,
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(
    Object.entries(panel.config)
      .filter(([, config]) => config.visible)
      .map(([scenarioId, config]) => [
        scenarioId,
        config.selectedSignals ?? [],
      ]),
  );
}

function metricSelectionsFromViewV1(
  view: MetricsViewSpec,
): Readonly<Record<string, readonly string[]>> {
  return Object.fromEntries(
    Object.entries(view.membership).map(([scenarioId, metrics]) => [
      scenarioId,
      metrics.length > 0 ? metrics : view.metrics,
    ]),
  );
}

function selectedWaveformObservables(
  selected: readonly string[],
): MainWireScientificObservableIdV1[] {
  return [
    ...new Set(
      selected.flatMap((candidate) => {
        const alias = WAVEFORM_ALIASES[candidate];
        if (alias !== undefined) return [alias];
        return OBSERVABLE_IDS.has(candidate)
          ? [candidate as MainWireScientificObservableIdV1]
          : [];
      }),
    ),
  ];
}

function selectedPvTrajectories(
  selected: readonly string[],
  workspace:
    ScientificProductScenarioPresentationV1["workspaceDocument"],
): MainWireScientificWorkspacePressureVolumeTrajectoryV1[] {
  return [
    ...new Map(
      selected.flatMap((candidate) => {
        const trajectory = resolveScientificProductPvTrajectoryV1(
          workspace,
          candidate,
        );
        if (trajectory === null) return [];
        return [[trajectory.trajectoryId, trajectory] as const];
      }),
    ).values(),
  ];
}

export function graphViewToPanel(view: GraphViewSpec): PanelDef {
  const panelType: PanelType =
    view.graphType === "pvloop"
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
    config: Object.fromEntries(
      Object.entries(view.membership).map(([scenarioId, selectedSignals]) => [
        scenarioId,
        {
          visible: true,
          selectedSignals,
        },
      ]),
    ),
    view: {
      kind: "graph",
      graphType: view.graphType,
      showGuides: view.presentation?.showGuides,
      timeWindow: view.presentation?.timeWindow,
      showLegend: view.presentation?.showLegend,
      legendPosition: view.presentation?.legendPosition,
      pvHistoryBeats: view.presentation?.pvHistoryBeats,
      pvHistoryMode: view.presentation?.pvHistoryMode,
      pvParameterHistoryCount: view.presentation?.pvParameterHistoryCount,
      pvRelationDisplayMode: view.presentation?.pvRelationDisplayMode,
      pvRelationPressureBasis: view.presentation?.pvRelationPressureBasis,
      pvRelationShowSamplePoints:
        view.presentation?.pvRelationShowSamplePoints,
      hemodynamicDetailMode: view.presentation?.hemodynamicDetailMode,
      hemodynamicParameterHistoryCount:
        view.presentation?.hemodynamicParameterHistoryCount,
      hemodynamicAllowNegativeFillingPressure:
        view.presentation?.hemodynamicAllowNegativeFillingPressure,
    },
    isSettingsOpen: false,
    showGuides: view.presentation?.showGuides,
    timeWindow: view.presentation?.timeWindow,
    showLegend: view.presentation?.showLegend,
    pvHistoryBeats: view.presentation?.pvHistoryBeats,
    pvHistoryMode: view.presentation?.pvHistoryMode,
    pvParameterHistoryCount: view.presentation?.pvParameterHistoryCount,
    pvRelationDisplayMode: view.presentation?.pvRelationDisplayMode,
    pvRelationPressureBasis: view.presentation?.pvRelationPressureBasis,
    pvRelationShowSamplePoints:
      view.presentation?.pvRelationShowSamplePoints,
    hemodynamicDetailMode: view.presentation?.hemodynamicDetailMode,
    hemodynamicParameterHistoryCount:
      view.presentation?.hemodynamicParameterHistoryCount,
    hemodynamicAllowNegativeFillingPressure:
      view.presentation?.hemodynamicAllowNegativeFillingPressure,
  };
}

function controllerTargetScenarioV1(
  view: ControllerViewSpec,
  context: WorkbenchRuntimeRenderContext,
): string | undefined {
  return view.binding.kind === "scenario"
    ? view.binding.scenarioId
    : (context.activeInstanceId ?? context.instances[0]?.id);
}

function scientificControlKindV1(
  paramKey: string,
): MainWireScientificResearchControlIdV0 | null {
  return (
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0 as readonly string[]
  ).includes(paramKey)
    ? (paramKey as MainWireScientificResearchControlIdV0)
    : null;
}

function isScientificControlValueV1(
  controlId: MainWireScientificResearchControlIdV0,
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    (
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[controlId]
        .allowedValues as readonly number[]
    ).includes(value)
  );
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
  )
    ? (candidate as MainWireScientificDerivedMetricIdV1)
    : null;
}

function compactPhaseLabelV1(phase: string): string {
  if (phase === "idle") return "Ready";
  if (phase.includes("paused")) return "Live paused";
  if (phase.startsWith("live")) return "Live transition";
  if (phase.startsWith("steady")) return "Finding steady state";
  if (phase === "failed" || phase === "reload-required")
    return "Attention required";
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

const EMPTY_SUBSCRIBE =
  (_listener: () => void): (() => void) =>
  () =>
    undefined;
const EMPTY_CONTROL_SNAPSHOT = () => null;

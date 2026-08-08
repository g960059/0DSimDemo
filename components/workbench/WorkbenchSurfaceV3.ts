import type {
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import { reconcileWorkbenchGraphColorsV3 } from "./v3/WorkbenchGraphColorV3";
import {
  STUDIO_GRAPH_HISTORY_DEFAULT_DEPTH_V2,
  STUDIO_GRAPH_HISTORY_MAX_DEPTH_V2,
  STUDIO_GRAPH_HISTORY_MIN_DEPTH_V2,
  STUDIO_SWEEP_WINDOW_DEFAULT_SEC_V2,
  STUDIO_SWEEP_WINDOW_MAX_SEC_V2,
  STUDIO_SWEEP_WINDOW_MIN_SEC_V2,
  STUDIO_SWEEP_WINDOW_STEP_SEC_V2,
} from "@/studio/contracts/v2/content";
import type {
  GraphDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";

export const WORKBENCH_SCENARIO_ID_V3 = "workbench-live-default";
export const WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3 =
  STUDIO_SWEEP_WINDOW_DEFAULT_SEC_V2;
export const WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3 = STUDIO_SWEEP_WINDOW_MIN_SEC_V2;
export const WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3 = STUDIO_SWEEP_WINDOW_MAX_SEC_V2;
export const WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3 =
  STUDIO_SWEEP_WINDOW_STEP_SEC_V2;
export const WORKBENCH_GRAPH_HISTORY_DEFAULT_DEPTH_V3 =
  STUDIO_GRAPH_HISTORY_DEFAULT_DEPTH_V2;
export const WORKBENCH_GRAPH_HISTORY_MIN_DEPTH_V3 =
  STUDIO_GRAPH_HISTORY_MIN_DEPTH_V2;
export const WORKBENCH_GRAPH_HISTORY_MAX_DEPTH_V3 =
  STUDIO_GRAPH_HISTORY_MAX_DEPTH_V2;
export const WORKBENCH_PRESSURE_VOLUME_ANALYSIS_DEFAULT_MODE_V3 =
  "responsive-preview" as const;

/**
 * The Workbench exposes graph constructors, not registry graph presets. Each
 * constructor owns one axis-unit family so any compatible series can be mixed
 * without asking the author to choose a left/right catalog fragment first.
 */
export const WORKBENCH_GRAPH_PANE_OPTIONS_V3 = Object.freeze([
  Object.freeze({
    optionId: "hemodynamics.pressure-volume",
    graphId: "hemodynamics.pressure-volume",
    kind: "pressure-volume" as const,
  }),
  Object.freeze({
    optionId: "hemodynamics.pressure.waveform",
    graphId: "hemodynamics.pressure.waveform",
    kind: "pressure-waveform" as const,
  }),
  Object.freeze({
    optionId: "hemodynamics.flow.waveform",
    graphId: "hemodynamics.flow.waveform",
    kind: "flow-waveform" as const,
  }),
  Object.freeze({
    optionId: "hemodynamics.guyton-starling/systemic",
    graphId: "hemodynamics.guyton-starling",
    kind: "guyton-starling-systemic" as const,
    structuralSide: "right" as const,
  }),
  Object.freeze({
    optionId: "hemodynamics.guyton-starling/pulmonary",
    graphId: "hemodynamics.guyton-starling",
    kind: "guyton-starling-pulmonary" as const,
    structuralSide: "left" as const,
  }),
] as const);

export type WorkbenchGraphPaneKindV3 =
  (typeof WORKBENCH_GRAPH_PANE_OPTIONS_V3)[number]["kind"];

export function workbenchGraphIdForPaneKindV3(
  kind: WorkbenchGraphPaneKindV3,
): string {
  const option = WORKBENCH_GRAPH_PANE_OPTIONS_V3.find(
    (candidate) => candidate.kind === kind,
  );
  if (option === undefined) {
    throw new Error(`Unknown Workbench graph pane kind: ${kind}`);
  }
  return option.graphId;
}

export function workbenchDefaultGraphSeriesIdsV3(
  graph: GraphDefinitionV2,
): readonly string[] {
  return graph.renderer === "structural-return"
    ? Object.freeze([])
    : graph.defaultSeriesIds;
}

const OUTPUT_COLOR_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  // Chamber hue stays stable while quantity/measurement uses a tonal step.
  "hemodynamics.volume.LA": "#b34b82",
  "hemodynamics.volume.LV": "#b64b65",
  "hemodynamics.volume.RA": "#277f85",
  "hemodynamics.volume.RV": "#3f6fc1",
  "hemodynamics.pressure.absolute.LA": "#c43f7c",
  "hemodynamics.pressure.absolute.LV": "#cf405a",
  "hemodynamics.pressure.absolute.RA": "#16858b",
  "hemodynamics.pressure.absolute.RV": "#3472c4",
  "hemodynamics.pressure.transmural.LA": "#b23c75",
  "hemodynamics.pressure.transmural.LV": "#c13a53",
  "hemodynamics.pressure.transmural.RA": "#167a82",
  "hemodynamics.pressure.transmural.RV": "#346fc0",
  "hemodynamics.pressure.absolute.Ao": "#167db8",
  "hemodynamics.pressure.absolute.SA": "#2d70ac",
  "hemodynamics.pressure.absolute.PA": "#6a61b6",
  "hemodynamics.pressure.absolute.PVein": "#8d52a7",
  "hemodynamics.pressure.absolute.VC": "#247c71",
  "hemodynamics.flow.valve.MV": "#b23e78",
  "hemodynamics.flow.valve.AoV": "#1d7cad",
  "hemodynamics.flow.valve.TV": "#26806f",
  "hemodynamics.flow.valve.PV": "#6d64bd",
  "hemodynamics.flow.systemic.SA_Art": "#167db8",
  "hemodynamics.flow.pulmonary.PA_PArt": "#6a61b6",
  "hemodynamics.flow.venous.VC_RA": "#247c71",
  "hemodynamics.flow.venous.PVein_LA": "#8d52a7",
  "pericardium.pressure.excess": "#a96c08",
  "respiration.pressure.pleural": "#66717b",
  "respiration.pressure.alveolar": "#23818a",
  // A mid-slate total remains visible on both paper and near-black canvases.
  "coronary.flow.total": "#66717b",
  "coronary.flow.inlet.LAD": "#c43f55",
  "coronary.flow.inlet.LCx": "#247d59",
  "coronary.flow.inlet.RCA": "#3472c4",
  "device.LVAD.flow": "#a96c08",
  "rhythm.phase.regular-sinus": "#66717b",
});

const OUTPUT_LABEL_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  "hemodynamics.volume.LA": "LA volume",
  "hemodynamics.volume.LV": "LV volume",
  "hemodynamics.volume.RA": "RA volume",
  "hemodynamics.volume.RV": "RV volume",
  "hemodynamics.pressure.absolute.LA": "LA pressure",
  "hemodynamics.pressure.absolute.LV": "LV pressure",
  "hemodynamics.pressure.absolute.RA": "RA pressure",
  "hemodynamics.pressure.absolute.RV": "RV pressure",
  "hemodynamics.pressure.transmural.LA": "LA transmural pressure",
  "hemodynamics.pressure.transmural.LV": "LV transmural pressure",
  "hemodynamics.pressure.transmural.RA": "RA transmural pressure",
  "hemodynamics.pressure.transmural.RV": "RV transmural pressure",
  "hemodynamics.pressure.absolute.Ao": "Ao pressure",
  "hemodynamics.pressure.absolute.SA": "Systemic arterial pressure",
  "hemodynamics.pressure.absolute.PA": "Pulmonary arterial pressure",
  "hemodynamics.pressure.absolute.PVein": "Pulmonary venous pressure",
  "hemodynamics.pressure.absolute.VC": "Vena cava pressure",
  "hemodynamics.flow.valve.MV": "Mitral flow",
  "hemodynamics.flow.valve.AoV": "Aortic valve flow",
  "hemodynamics.flow.valve.TV": "Tricuspid flow",
  "hemodynamics.flow.valve.PV": "Pulmonary valve flow",
  "hemodynamics.flow.systemic.SA_Art": "Systemic tissue flow",
  "hemodynamics.flow.pulmonary.PA_PArt": "Pulmonary arterial flow",
  "hemodynamics.flow.venous.VC_RA": "Systemic venous return",
  "hemodynamics.flow.venous.PVein_LA": "Pulmonary venous return",
  "pericardium.pressure.excess": "Pericardial pressure",
  "respiration.pressure.pleural": "Pleural pressure",
  "respiration.pressure.alveolar": "Alveolar pressure",
  "rhythm.heart-rate.instantaneous": "Heart rate",
  "coronary.flow.total": "Total coronary flow",
  "coronary.flow.inlet.LAD": "LAD flow",
  "coronary.flow.inlet.LCx": "LCx flow",
  "coronary.flow.inlet.RCA": "RCA flow",
  "device.LVAD.flow": "LVAD flow",
  "rhythm.phase.regular-sinus": "Sinus cycle phase",
  "hemodynamics.pressure.mean.Ao": "Mean arterial pressure",
  "hemodynamics.pressure.systolic.Ao": "Systolic arterial pressure",
  "hemodynamics.pressure.diastolic.Ao": "Diastolic arterial pressure",
  "hemodynamics.pressure.pulse.Ao": "Pulse pressure",
  "hemodynamics.pressure.mean.PA": "Mean pulmonary arterial pressure",
  "hemodynamics.pressure.mean.LA": "Mean left atrial pressure",
  "hemodynamics.pressure.mean.RA": "Mean right atrial pressure",
  "hemodynamics.volume.maximum.LV": "Maximum LV volume",
  "hemodynamics.volume.minimum.LV": "Minimum LV volume",
  "hemodynamics.stroke-volume.LV-extrema": "LV stroke volume (extrema)",
  "hemodynamics.ejection-fraction.LV-extrema": "LV ejection fraction (extrema)",
  "hemodynamics.output.native-left": "Native left cardiac output",
  "hemodynamics.output.systemic-tissue": "Systemic tissue output",
  "hemodynamics.output.pulmonary": "Pulmonary output",
});

export function createDefaultExperimentSurfaceV3(
  contract: ModelContractV2,
  initialScenarioId: string = WORKBENCH_SCENARIO_ID_V3,
): ExperimentSurfaceV2 {
  const defaultGraphIds = Object.freeze([
    "hemodynamics.pressure.waveform",
    "hemodynamics.pressure-volume",
  ]);
  const graphPanes = defaultGraphIds.flatMap((graphId, index) => {
    const graph = contract.graphCatalog.find(
      (candidate) => candidate.graphId === graphId,
    );
    return graph === undefined ? [] : [createDefaultGraphPaneV3(graph, index)];
  });
  const defaultOutputIds = Object.freeze([
    "rhythm.heart-rate.instantaneous",
    "hemodynamics.output.native-left",
    "hemodynamics.pressure.mean.Ao",
    "hemodynamics.ejection-fraction.LV-extrema",
    "hemodynamics.pressure.mean.LA",
  ]);
  const defaultOutputs = defaultOutputIds.flatMap((outputId) => {
    const output = contract.outputCatalog.find(
      (candidate) => candidate.outputId === outputId,
    );
    return output === undefined ? [] : [output];
  });
  const outputPane: ExperimentSurfaceOutputPaneV2 = Object.freeze({
    paneId: "outputs-primary",
    role: "output",
    label: "Outputs",
    order: 0,
    priority: 40,
    binding: Object.freeze({ mode: "active-slot" as const }),
    items: Object.freeze(
      defaultOutputs.map((output, index) =>
        Object.freeze({
          outputId: output.outputId,
          label: outputLabelV3(output.outputId),
          order: index,
        }),
      ),
    ),
  });
  const defaultControlIds = Object.freeze([
    "rhythm.heart-rate-bpm",
    "hemodynamics.total-blood-volume-ml",
    "hemodynamics.systemic-resistance",
    "myocardium.contractility",
    "hemodynamics.venous-tone",
    "ventilation.peep-cm-h2o",
  ]);
  const defaultControls = defaultControlIds.flatMap((controlId) => {
    const control = contract.controlCatalog.find(
      (candidate) => candidate.controlId === controlId,
    );
    return control === undefined ? [] : [control];
  });
  const controlPane: ExperimentSurfaceControlPaneV2 = Object.freeze({
    paneId: "controls-primary",
    role: "control",
    label: "Parameters",
    order: 0,
    priority: 30,
    binding: Object.freeze({ mode: "active-slot" as const }),
    items: Object.freeze(
      defaultControls.map((control, index) =>
        Object.freeze({
          controlId: control.controlId,
          label: controlLabelV3(control.controlId),
          order: index,
          presentation: Object.freeze({ kind: "slider" as const }),
        }),
      ),
    ),
  });
  const surface: ExperimentSurfaceV2 = Object.freeze({
    graphPanes: Object.freeze(graphPanes),
    outputPanes: Object.freeze([outputPane]),
    controlPanes: Object.freeze([controlPane]),
    note: Object.freeze({ text: "" }),
  });
  // Single-Scenario waveforms start with familiar item semantics. Structural
  // and PV panes use the Scenario seed from their first allocation because
  // Scenario identity is their primary visual distinction.
  return reconcileWorkbenchGraphColorsV3(
    surface,
    Object.freeze([Object.freeze({ scenarioId: initialScenarioId })]),
    "series",
  );
}

function createDefaultGraphPaneV3(
  graph: GraphDefinitionV2,
  index: number,
): ExperimentSurfaceGraphPaneV2 {
  return Object.freeze({
    paneId: `graph-${index + 1}`,
    role: "graph",
    label: graphTitleV3(
      graph.graphId,
      graph.renderer === "structural-return"
        ? graph.side === "both"
          ? "right"
          : graph.side
        : undefined,
    ),
    order: index,
    priority: Math.max(50, 100 - index),
    graphId: graph.graphId,
    scenarioScope: Object.freeze({ mode: "visible-scenarios" as const }),
    excludedTraces: Object.freeze([]),
    ...(graph.renderer === "sweep"
      ? { windowSec: WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3 }
      : {
          historyDepth: WORKBENCH_GRAPH_HISTORY_DEFAULT_DEPTH_V3,
          ...(graph.renderer === "pressure-volume"
            ? {
                pressureVolumeAnalysisMode:
                  WORKBENCH_PRESSURE_VOLUME_ANALYSIS_DEFAULT_MODE_V3,
              }
            : {}),
          ...(graph.renderer === "structural-return"
            ? { structuralSide: graph.side === "both" ? "right" : graph.side }
            : {}),
        }),
    traceColors: Object.freeze([]),
    series: Object.freeze(
      graph.renderer === "structural-return"
        ? []
        : graph.defaultSeriesIds.map((seriesId, seriesIndex) =>
            Object.freeze({
              seriesId,
              label: graphSeriesLabelV3(seriesId),
              order: seriesIndex,
            }),
          ),
    ),
  });
}

/**
 * Reconciles pane-level Scenario policies after add/delete/restore.
 *
 * A fixed policy that loses every target falls back to the Workbench's
 * dynamic policy instead of retaining an invalid empty binding. Trace colors
 * are reconciled in the same transaction, while exclusions and fixed targets
 * are retained only when their referenced Scenario/series still exists.
 */
export function reconcileWorkbenchSurfaceScenariosV3(
  surface: ExperimentSurfaceV2,
  scenarios: readonly Readonly<{ scenarioId: string }>[],
): ExperimentSurfaceV2 {
  const scenarioIds = new Set(scenarios.map(({ scenarioId }) => scenarioId));
  const graphPanes = surface.graphPanes.map((pane) => {
    const fixedScenarioIds = pane.scenarioScope.mode === "fixed"
      ? pane.scenarioScope.scenarioIds.filter((scenarioId) =>
          scenarioIds.has(scenarioId))
      : [];
    const selectedSeriesIds = new Set(pane.series.map(({ seriesId }) => seriesId));
    return Object.freeze({
      ...pane,
      scenarioScope:
        pane.scenarioScope.mode === "fixed" && fixedScenarioIds.length > 0
          ? Object.freeze({
              mode: "fixed" as const,
              scenarioIds: Object.freeze(fixedScenarioIds),
            })
          : Object.freeze({ mode: "visible-scenarios" as const }),
      excludedTraces: Object.freeze(
        pane.excludedTraces.filter((trace) =>
          scenarioIds.has(trace.scenarioId) &&
          (trace.seriesId === null || selectedSeriesIds.has(trace.seriesId))),
      ),
    });
  });
  const controlPanes = surface.controlPanes.map((pane) => {
    const fixedScenarioIds = pane.binding.mode === "fixed"
      ? pane.binding.scenarioIds.filter((scenarioId) =>
          scenarioIds.has(scenarioId))
      : [];
    return Object.freeze({
      ...pane,
      binding:
        pane.binding.mode === "fixed" && fixedScenarioIds.length > 0
          ? Object.freeze({
              mode: "fixed" as const,
              scenarioIds: Object.freeze(fixedScenarioIds),
            })
          : Object.freeze({ mode: "active-slot" as const }),
    });
  });
  const outputPanes = surface.outputPanes.map((pane) => {
    // Re-materialize the durable pane instead of spreading the live UI value.
    // This keeps transient/Fast Refresh fields out of persistence and gives a
    // pre-save Session created before the binding cutover the current default.
    const candidateBinding = (
      pane as ExperimentSurfaceOutputPaneV2 & Readonly<{
        binding?: ExperimentSurfaceOutputPaneV2["binding"];
      }>
    ).binding;
    const binding =
      candidateBinding?.mode === "fixed" &&
        scenarioIds.has(candidateBinding.scenarioId)
        ? Object.freeze({
            mode: "fixed" as const,
            scenarioId: candidateBinding.scenarioId,
          })
        : Object.freeze({ mode: "active-slot" as const });
    return Object.freeze({
      paneId: pane.paneId,
      role: "output" as const,
      label: pane.label,
      order: pane.order,
      priority: pane.priority,
      binding,
      items: Object.freeze(pane.items.map((item) => Object.freeze({
        outputId: item.outputId,
        label: item.label,
        order: item.order,
      }))),
    });
  });
  return reconcileWorkbenchGraphColorsV3(
    Object.freeze({ ...surface, graphPanes, outputPanes, controlPanes }),
    scenarios,
  );
}

/** Resolve the durable graph-pane policy against the currently available UI scope. */
export function resolveWorkbenchGraphScenarioIdsV3(
  pane: ExperimentSurfaceGraphPaneV2,
  visibleScenarioIds: readonly string[],
): readonly string[] {
  if (pane.scenarioScope.mode === "visible-scenarios") {
    return visibleScenarioIds;
  }
  const visible = new Set(visibleScenarioIds);
  return Object.freeze(
    pane.scenarioScope.scenarioIds.filter((scenarioId) =>
      visible.has(scenarioId)),
  );
}

/** Exact trace exclusions are durable Pane Settings, not transient legend state. */
export function isWorkbenchGraphTraceExcludedV3(
  pane: ExperimentSurfaceGraphPaneV2,
  scenarioId: string,
  seriesId: string | null,
): boolean {
  return pane.excludedTraces.some((trace) =>
    trace.scenarioId === scenarioId && trace.seriesId === seriesId);
}

/** Resolve one controller pane's single binding context. */
export function resolveWorkbenchControlPaneScenarioIdsV3(
  pane: ExperimentSurfaceControlPaneV2,
  activeScenarioId: string | null,
  scenarios: readonly Readonly<{ scenarioId: string }>[],
): readonly string[] {
  const available = new Set(scenarios.map(({ scenarioId }) => scenarioId));
  if (pane.binding.mode === "active-slot") {
    return activeScenarioId !== null && available.has(activeScenarioId)
      ? Object.freeze([activeScenarioId])
      : Object.freeze([]);
  }
  return Object.freeze(
    pane.binding.scenarioIds.filter((scenarioId) => available.has(scenarioId)),
  );
}

/** Resolve one output pane's single Scenario binding context. */
export function resolveWorkbenchOutputPaneScenarioIdV3(
  pane: ExperimentSurfaceOutputPaneV2,
  activeScenarioId: string | null,
  scenarios: readonly Readonly<{ scenarioId: string }>[],
): string | null {
  const available = new Set(scenarios.map(({ scenarioId }) => scenarioId));
  if (pane.binding.mode === "active-slot") {
    return activeScenarioId !== null && available.has(activeScenarioId)
      ? activeScenarioId
      : null;
  }
  return available.has(pane.binding.scenarioId)
    ? pane.binding.scenarioId
    : null;
}

export function allSurfacePanesV3(
  surface: ExperimentSurfaceV2,
): readonly (
  | ExperimentSurfaceGraphPaneV2
  | ExperimentSurfaceOutputPaneV2
  | ExperimentSurfaceControlPaneV2
)[] {
  return Object.freeze([
    ...surface.graphPanes,
    ...surface.outputPanes,
    ...surface.controlPanes,
  ]);
}

export function graphTitleV3(
  graphId: string,
  structuralSide?: "left" | "right",
): string {
  if (graphId === "hemodynamics.pressure.waveform") return "Pressure waveforms";
  if (graphId === "hemodynamics.flow.waveform") return "Flow waveforms";
  if (graphId === "hemodynamics.guyton-starling") {
    if (structuralSide === "right") return "Systemic Guyton / Starling";
    if (structuralSide === "left") return "Pulmonary Guyton / Starling";
    return "Guyton / Starling";
  }
  if (graphId === "hemodynamics.pressure-volume") return "PV loop";
  return humanizeCatalogIdV3(graphId);
}

export function graphSeriesLabelV3(seriesId: string): string {
  const labels: Readonly<Record<string, string>> = {
    LVP: "LVP",
    LAP: "LAP",
    AoP: "AoP",
    RAP: "RAP",
    RVP: "RVP",
    PAP: "PAP",
    PVeinP: "Pulmonary vein pressure",
    VCP: "Vena cava pressure",
    Pperi: "Pericardial pressure",
    Ppl: "Pleural pressure",
    Palv: "Alveolar pressure",
    MV: "MV",
    AoV: "AoV",
    TV: "TV",
    PV: "PV",
    LAD: "LAD",
    LCx: "LCx",
    RCA: "RCA",
    Coronary: "Coronary",
    LVAD: "LVAD",
    SA_Art: "Systemic tissue flow",
    PA_PArt: "Pulmonary arterial flow",
    VC_RA: "Systemic venous return",
    PVein_LA: "Pulmonary venous return",
    LV: "LV",
    RV: "RV",
    RA: "RA",
    LA: "LA",
  };
  return labels[seriesId] ?? humanizeCatalogIdV3(seriesId);
}

export function outputLabelV3(outputId: string): string {
  return OUTPUT_LABEL_BY_ID_V3[outputId] ?? humanizeCatalogIdV3(outputId);
}

export function controlLabelV3(controlId: string): string {
  const labels: Readonly<Record<string, string>> = {
    "hemodynamics.systemic-resistance": "Systemic resistance",
    "hemodynamics.pulmonary-resistance": "Pulmonary resistance",
    "hemodynamics.venous-tone": "Venous tone",
    "hemodynamics.arterial-stiffness": "Arterial stiffness",
    "rhythm.heart-rate-bpm": "Heart rate",
    "hemodynamics.total-blood-volume-ml": "Total blood volume",
    "ventilation.peep-cm-h2o": "PEEP",
  };
  return labels[controlId] ?? humanizeCatalogIdV3(controlId);
}

export function outputColorV3(outputId: string): string {
  if (OUTPUT_COLOR_BY_ID_V3[outputId] !== undefined) {
    return OUTPUT_COLOR_BY_ID_V3[outputId]!;
  }
  // All fallback colors keep at least 3:1 contrast against both application
  // canvases. The authored Surface stores the chosen hex, so a later theme
  // switch never remaps or overrides a user's custom color.
  const palette = [
    "#167db8",
    "#c43f7c",
    "#6a61b6",
    "#247d59",
    "#a96c08",
    "#c43f55",
  ];
  let hash = 0;
  for (let index = 0; index < outputId.length; index += 1) {
    hash = ((hash << 5) - hash + outputId.charCodeAt(index)) | 0;
  }
  return palette[Math.abs(hash) % palette.length]!;
}

function humanizeCatalogIdV3(value: string): string {
  const token = value.split(".").at(-1) ?? value;
  return token
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

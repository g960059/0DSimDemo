import type {
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import {
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
export const WORKBENCH_SWEEP_WINDOW_MIN_SEC_V3 =
  STUDIO_SWEEP_WINDOW_MIN_SEC_V2;
export const WORKBENCH_SWEEP_WINDOW_MAX_SEC_V3 =
  STUDIO_SWEEP_WINDOW_MAX_SEC_V2;
export const WORKBENCH_SWEEP_WINDOW_STEP_SEC_V3 =
  STUDIO_SWEEP_WINDOW_STEP_SEC_V2;

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
  "coronary.flow.total": "Total coronary flow",
  "coronary.flow.inlet.LAD": "LAD flow",
  "coronary.flow.inlet.LCx": "LCx flow",
  "coronary.flow.inlet.RCA": "RCA flow",
  "device.LVAD.flow": "LVAD flow",
  "rhythm.phase.regular-sinus": "Sinus cycle phase",
});

export function createDefaultExperimentSurfaceV3(
  contract: ModelContractV2,
  _initialScenarioId: string = WORKBENCH_SCENARIO_ID_V3,
): ExperimentSurfaceV2 {
  const defaultGraphIds = Object.freeze([
    "hemodynamics.pressure.left-heart",
    "hemodynamics.pressure-volume",
  ]);
  const graphPanes = defaultGraphIds.flatMap((graphId, index) => {
    const graph = contract.graphCatalog.find((candidate) =>
      candidate.graphId === graphId);
    return graph === undefined
      ? []
      : [createDefaultGraphPaneV3(graph, index)];
  });
  const outputPane: ExperimentSurfaceOutputPaneV2 = Object.freeze({
    paneId: "outputs-primary",
    role: "output",
    label: "Outputs",
    order: 0,
    priority: 40,
    items: Object.freeze(contract.outputCatalog.map((output, index) =>
      Object.freeze({
        outputId: output.outputId,
        label: outputLabelV3(output.outputId),
        order: index,
      }))),
  });
  const controlPane: ExperimentSurfaceControlPaneV2 = Object.freeze({
    paneId: "controls-primary",
    role: "control",
    label: "Parameters",
    order: 0,
    priority: 30,
    items: Object.freeze(contract.controlCatalog.map((control, index) =>
      Object.freeze({
        controlId: control.controlId,
        label: controlLabelV3(control.controlId),
        order: index,
      }))),
  });
  return Object.freeze({
    graphPanes: Object.freeze(graphPanes),
    outputPanes: Object.freeze([outputPane]),
    controlPanes: Object.freeze([controlPane]),
    note: Object.freeze({ text: "" }),
  });
}

function createDefaultGraphPaneV3(
  graph: GraphDefinitionV2,
  index: number,
): ExperimentSurfaceGraphPaneV2 {
  return Object.freeze({
    paneId: `graph-${index + 1}`,
    role: "graph",
    label: graphTitleV3(graph.graphId),
    order: index,
    priority: Math.max(50, 100 - index),
    graphId: graph.graphId,
    ...(graph.renderer === "sweep"
      ? { windowSec: WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3 }
      : {}),
    series: Object.freeze(graph.renderer === "structural-return"
      ? []
      : graph.defaultSeriesIds.map((seriesId, seriesIndex) => Object.freeze({
        seriesId,
        label: graphSeriesLabelV3(seriesId),
        colorHex: graphSeriesColorV3(seriesId),
        order: seriesIndex,
      }))),
  });
}

export function allSurfacePanesV3(surface: ExperimentSurfaceV2): readonly (
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

export function graphTitleV3(graphId: string): string {
  if (graphId === "hemodynamics.pressure.left-heart") return "Left-heart pressure";
  if (graphId === "hemodynamics.pressure.right-heart") return "Right-heart pressure";
  if (graphId === "hemodynamics.flow.valves") return "Valve flows";
  if (graphId === "coronary.flow.inlet-territories") return "Coronary territory flow";
  if (graphId === "hemodynamics.structural-return.systemic") {
    return "Systemic venous-return orientation";
  }
  if (graphId === "hemodynamics.structural-return.pulmonary") {
    return "Pulmonary venous-return orientation";
  }
  if (graphId === "hemodynamics.pressure-volume") return "Pressure-volume loops";
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
    MV: "MV",
    AoV: "AoV",
    TV: "TV",
    PV: "PV",
    LAD: "LAD",
    LCx: "LCx",
    RCA: "RCA",
    LV: "LV",
    RV: "RV",
    RA: "RA",
    LA: "LA",
  };
  return labels[seriesId] ?? humanizeCatalogIdV3(seriesId);
}

export function graphSeriesColorV3(seriesId: string): string {
  const colors: Readonly<Record<string, string>> = {
    LVP: "#cf405a",
    LAP: "#c43f7c",
    AoP: "#167db8",
    RAP: "#16858b",
    RVP: "#3472c4",
    PAP: "#6a61b6",
    LV: "#cf405a",
    LA: "#c43f7c",
    RV: "#3472c4",
    RA: "#16858b",
    MV: "#b23e78",
    AoV: "#1d7cad",
    TV: "#26806f",
    PV: "#6d64bd",
    LAD: "#c43f55",
    LCx: "#247d59",
    RCA: "#3472c4",
  };
  return colors[seriesId] ?? outputColorV3(seriesId);
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
  const palette = ["#167db8", "#c43f7c", "#6a61b6", "#247d59", "#a96c08", "#c43f55"];
  let hash = 0;
  for (let index = 0; index < outputId.length; index += 1) {
    hash = ((hash << 5) - hash + outputId.charCodeAt(index)) | 0;
  }
  return palette[Math.abs(hash) % palette.length]!;
}

function humanizeCatalogIdV3(value: string): string {
  const token = value.split(".").at(-1) ?? value;
  return token.replaceAll("-", " ").replace(/\b\w/g, (character) =>
    character.toUpperCase());
}

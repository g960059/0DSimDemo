import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  type MainWireScientificDerivedMetricIdV1,
  type MainWireScientificDerivedMetricUnitV1,
} from "@/engine/scientific/metrics";

export type ScientificWorkbenchMetricCategoryV1 =
  | "pressure"
  | "ventricular"
  | "valve";

export type ScientificWorkbenchMetricPresentationV1 = Readonly<{
  metricId: MainWireScientificDerivedMetricIdV1;
  label: string;
  shortLabel: string;
  category: ScientificWorkbenchMetricCategoryV1;
  unit: MainWireScientificDerivedMetricUnitV1;
  decimals: number;
}>;

type PresentationSeedV1 = Omit<ScientificWorkbenchMetricPresentationV1, "unit">;

const STATIC_PRESENTATION_SEEDS_V1: readonly PresentationSeedV1[] = [
  seed("hemodynamics.pressure.systolic.Ao", "Systolic aortic pressure", "SBP", "pressure", 0),
  seed("hemodynamics.pressure.diastolic.Ao", "Diastolic aortic pressure", "DBP", "pressure", 0),
  seed("hemodynamics.pressure.mean.Ao", "Mean aortic pressure", "MAP", "pressure", 0),
  seed("hemodynamics.pressure.pulse.Ao", "Aortic pulse pressure", "Pulse pressure", "pressure", 0),
  seed("hemodynamics.pressure.mean.LA", "Mean left atrial pressure", "Mean LAP", "pressure", 1),
  seed("hemodynamics.pressure.mean.RA", "Mean right atrial pressure", "Mean RAP", "pressure", 1),
  seed("hemodynamics.pressure.systolic.PA", "Systolic pulmonary artery pressure", "sPAP", "pressure", 0),
  seed("hemodynamics.pressure.diastolic.PA", "Diastolic pulmonary artery pressure", "dPAP", "pressure", 0),
  seed("hemodynamics.pressure.mean.PA", "Mean pulmonary artery pressure", "mPAP", "pressure", 1),
  seed("hemodynamics.pressure.mean.PVein", "Mean pulmonary venous pressure", "Mean PV pressure", "pressure", 1),
  seed("hemodynamics.volume.end_diastolic.LV", "Left ventricular cycle maximum volume", "LV Vmax", "ventricular", 0),
  seed("hemodynamics.volume.end_systolic.LV", "Left ventricular cycle minimum volume", "LV Vmin", "ventricular", 0),
  seed("hemodynamics.volume.excursion.LV", "Left ventricular total volume excursion", "LV total SV", "ventricular", 0),
  seed("hemodynamics.ejection_fraction.LV", "Left ventricular ejection fraction", "LVEF", "ventricular", 0),
  seed("hemodynamics.volume.end_diastolic.RV", "Right ventricular cycle maximum volume", "RV Vmax", "ventricular", 0),
  seed("hemodynamics.volume.end_systolic.RV", "Right ventricular cycle minimum volume", "RV Vmin", "ventricular", 0),
  seed("hemodynamics.volume.excursion.RV", "Right ventricular total volume excursion", "RV total SV", "ventricular", 0),
  seed("hemodynamics.ejection_fraction.RV", "Right ventricular ejection fraction", "RVEF", "ventricular", 0),
  seed("valve.AoV.cardiac_output.net", "Effective aortic cardiac output", "Cardiac output", "ventricular", 1),
  seed("valve.PV.cardiac_output.net", "Net pulmonary cardiac output", "RV output", "ventricular", 1),
] as const;

const VALVE_PRESENTATION_SEEDS_V1 = ([
  ["MV", "Mitral"],
  ["AoV", "Aortic"],
  ["TV", "Tricuspid"],
  ["PV", "Pulmonary"],
] as const).flatMap(([valveId, valveName]) => [
  seed(`valve.${valveId}.cycle_volume.forward`, `${valveName} forward cycle volume`, `${valveName} forward V`, "valve", 0),
  seed(`valve.${valveId}.cycle_volume.reverse`, `${valveName} reverse cycle volume`, `${valveName} regurg V`, "valve", 0),
  seed(`valve.${valveId}.cycle_volume.net`, `${valveName} net cycle volume`, `${valveName} net V`, "valve", 0),
  seed(`valve.${valveId}.regurgitant_fraction`, `${valveName} same-valve regurgitant fraction`, `${valveId} same-valve RF`, "valve", 0),
  seed(`valve.${valveId}.gradient.forward_peak`, `${valveName} maximum instantaneous invasive forward gradient`, `${valveId} max instant ΔP`, "valve", 1),
  seed(`valve.${valveId}.gradient.forward_mean`, `${valveName} mean invasive forward gradient`, `${valveName} mean gradient`, "valve", 1),
] as const);

const PRESENTATION_SEEDS_V1 = Object.freeze([
  ...STATIC_PRESENTATION_SEEDS_V1,
  ...VALVE_PRESENTATION_SEEDS_V1,
]);

const PRESENTATION_SEED_BY_ID_V1 = new Map(
  PRESENTATION_SEEDS_V1.map((entry) => [entry.metricId, entry] as const),
);

if (PRESENTATION_SEED_BY_ID_V1.size !== PRESENTATION_SEEDS_V1.length) {
  throw new Error("scientific metric presentation catalog contains duplicate IDs");
}

export const SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1 =
  Object.freeze(MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map((definition) => {
    const seedEntry = PRESENTATION_SEED_BY_ID_V1.get(definition.metricId);
    if (seedEntry === undefined) {
      throw new Error(
        `scientific metric ${definition.metricId} lacks presentation metadata`,
      );
    }
    return Object.freeze({
      ...seedEntry,
      unit: definition.unit,
    }) satisfies ScientificWorkbenchMetricPresentationV1;
  }));

const PRESENTATION_BY_ID_V1 = new Map(
  SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1.map((entry) =>
    [entry.metricId, entry] as const),
);

export function scientificWorkbenchMetricPresentationV1(
  metricId: MainWireScientificDerivedMetricIdV1,
): ScientificWorkbenchMetricPresentationV1 {
  const presentation = PRESENTATION_BY_ID_V1.get(metricId);
  if (presentation === undefined) {
    throw new Error(`unknown scientific metric presentation ${metricId}`);
  }
  return presentation;
}

export const SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1 = Object.freeze([
  "hemodynamics.pressure.systolic.Ao",
  "hemodynamics.pressure.diastolic.Ao",
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.mean.RA",
  "hemodynamics.pressure.systolic.PA",
  "hemodynamics.pressure.mean.PA",
  "hemodynamics.pressure.mean.LA",
] as const satisfies readonly MainWireScientificDerivedMetricIdV1[]);

export const SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1 = Object.freeze([
  "valve.AoV.cardiac_output.net",
  "valve.AoV.cycle_volume.net",
  "hemodynamics.ejection_fraction.LV",
  "hemodynamics.volume.end_diastolic.LV",
  "hemodynamics.volume.end_systolic.LV",
  "hemodynamics.ejection_fraction.RV",
  "hemodynamics.volume.end_diastolic.RV",
  "hemodynamics.volume.end_systolic.RV",
] as const satisfies readonly MainWireScientificDerivedMetricIdV1[]);

export const SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1 = Object.freeze([
  ...defaultValveMetrics("MV"),
  ...defaultValveMetrics("AoV"),
  ...defaultValveMetrics("TV"),
  ...defaultValveMetrics("PV"),
]);

function defaultValveMetrics<
  TValveId extends "MV" | "AoV" | "TV" | "PV",
>(valveId: TValveId) {
  return [
    `valve.${valveId}.gradient.forward_peak`,
    `valve.${valveId}.gradient.forward_mean`,
    `valve.${valveId}.regurgitant_fraction`,
  ] as const satisfies readonly MainWireScientificDerivedMetricIdV1[];
}

function seed<TMetricId extends MainWireScientificDerivedMetricIdV1>(
  metricId: TMetricId,
  label: string,
  shortLabel: string,
  category: ScientificWorkbenchMetricCategoryV1,
  decimals: number,
): PresentationSeedV1 & Readonly<{ metricId: TMetricId }> {
  return Object.freeze({ metricId, label, shortLabel, category, decimals });
}

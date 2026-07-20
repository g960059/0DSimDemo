import type {
  SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID =
  "main-wire-healthy-cycle-metrics-v1" as const;

export const MAIN_WIRE_HEALTHY_CYCLE_METRIC_IDS_V1 = Object.freeze([
  "cycle.duration_sec",
  "cycle.sample_count",
  "cycle.dt_sec",
  "hemodynamics.lv.edv_index_ml_per_m2",
  "hemodynamics.lv.esv_index_ml_per_m2",
  "hemodynamics.lv.ejection_fraction_01",
  "hemodynamics.rv.ejection_fraction_01",
  "hemodynamics.aortic.net_stroke_volume_index_ml_per_m2",
  "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
  "hemodynamics.pressure.aortic.systolic_mmhg",
  "hemodynamics.pressure.aortic.diastolic_mmhg",
  "hemodynamics.pressure.aortic.mean_mmhg",
  "hemodynamics.pressure.pulmonary_artery.systolic_mmhg",
  "hemodynamics.pressure.left_atrium.mean_mmhg",
  "hemodynamics.pressure.right_atrium.mean_mmhg",
  "hemodynamics.pressure.pulmonary_vein.mean_mmhg",
  "numerics.mechanics.maximum_residual_norm",
  "numerics.circulation.maximum_scaled_residual_infinity_norm",
  "numerics.continuity.maximum_absolute_residual_ml",
  "numerics.total_blood_volume.maximum_absolute_error_ml",
] as const);

export type MainWireHealthyCycleMetricIdV1 =
  (typeof MAIN_WIRE_HEALTHY_CYCLE_METRIC_IDS_V1)[number];

export type MainWireHealthyCycleMetricAvailabilityV1 =
  | "available"
  | "source-signal-unavailable";

export type MainWireHealthyCycleMetricV1 = Readonly<{
  metricId: MainWireHealthyCycleMetricIdV1;
  value: number | null;
  unit: "s" | "count" | "mL/m2" | "1" | "L/min/m2" | "mmHg" | "mL";
  availability: MainWireHealthyCycleMetricAvailabilityV1;
}>;

export type MainWireHealthyCycleMetricsV1 = Readonly<{
  metricsId: typeof MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID;
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  referenceBodySurfaceAreaM2: number;
  acceptedTimeRangeSec: readonly [number, number];
  metrics: Readonly<Record<
    MainWireHealthyCycleMetricIdV1,
    MainWireHealthyCycleMetricV1
  >>;
  evidence: Readonly<{
    source: "accepted-scientific-session-observations";
    completeUniformCycleRequired: true;
    smoothingApplied: false;
    parameterFittingPerformed: false;
  }>;
}>;

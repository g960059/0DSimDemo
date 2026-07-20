import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime";
import {
  MAIN_WIRE_HEALTHY_CYCLE_METRIC_IDS_V1,
  MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID,
  type MainWireHealthyCycleMetricIdV1,
  type MainWireHealthyCycleMetricsV1,
  type MainWireHealthyCycleMetricV1,
} from "./MainWireCycleMetricContractV1";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
  type MainWireCycleEvidenceGateV1,
} from "./MainWireEvidencePacksV1";

export {
  MAIN_WIRE_HEALTHY_CYCLE_METRIC_IDS_V1,
  MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
};
export type {
  MainWireHealthyCycleMetricAvailabilityV1,
  MainWireHealthyCycleMetricIdV1,
  MainWireHealthyCycleMetricsV1,
  MainWireHealthyCycleMetricV1,
} from "./MainWireCycleMetricContractV1";

/** @deprecated Use MainWireCycleEvidenceGateV1 from MainWireEvidencePacksV1. */
export type MainWireHealthyReferenceGateV1 = MainWireCycleEvidenceGateV1;

export type MainWireHealthyReferenceGateResultV1 = Readonly<{
  gateId: string;
  metricId: MainWireHealthyCycleMetricIdV1;
  domain: MainWireHealthyReferenceGateV1["domain"];
  status: "pass" | "fail" | "unavailable";
  value: number | null;
  unit: MainWireHealthyCycleMetricV1["unit"];
  lowerInclusive: number | null;
  upperInclusive: number | null;
  sourceIds: readonly string[];
  interpretation: string;
}>;

export type MainWireHealthyReferenceAcceptanceV1 = Readonly<{
  acceptanceId: "main-wire-healthy-reference-acceptance-v1";
  schemaVersion: 1;
  targetPackId: typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID;
  metrics: MainWireHealthyCycleMetricsV1;
  overallStatus: "pass" | "fail" | "incomplete";
  physiologyStatus: "pass" | "fail" | "incomplete";
  numericalIntegrityStatus: "pass" | "fail" | "incomplete";
  gateResults: readonly MainWireHealthyReferenceGateResultV1[];
  deferredAcceptance: readonly string[];
  claim: typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.claim;
}>;

export function measureMainWireHealthyCycleMetricsV1(
  observations: readonly MainWireScientificSessionObservationV1[],
  referenceBodySurfaceAreaM2 =
    MAIN_WIRE_HEALTHY_REFERENCE_CONTEXT_PACK_V1.referenceSubject
      .bodySurfaceAreaM2,
): MainWireHealthyCycleMetricsV1 {
  const cadence = validateCompleteUniformCycle(
    observations,
    referenceBodySurfaceAreaM2,
  );
  const first = observations[0]!;
  const last = observations.at(-1)!;
  const metrics = {} as Record<
    MainWireHealthyCycleMetricIdV1,
    MainWireHealthyCycleMetricV1
  >;
  const set = (
    metricId: MainWireHealthyCycleMetricIdV1,
    value: number | null,
    unit: MainWireHealthyCycleMetricV1["unit"],
  ): void => {
    metrics[metricId] = Object.freeze({
      metricId,
      value,
      unit,
      availability: value === null
        ? "source-signal-unavailable"
        : "available",
    });
  };

  set("cycle.duration_sec", cadence.dtSec * observations.length, "s");
  set("cycle.sample_count", observations.length, "count");
  set("cycle.dt_sec", cadence.dtSec, "s");

  const lvVolumes = observations.map((sample) => sample.chamber.LV.volumeMl);
  const rvVolumes = observations.map((sample) => sample.chamber.RV.volumeMl);
  const lvEdv = maximum(lvVolumes);
  const lvEsv = minimum(lvVolumes);
  const rvEdv = maximum(rvVolumes);
  const rvEsv = minimum(rvVolumes);
  set(
    "hemodynamics.lv.edv_index_ml_per_m2",
    lvEdv / referenceBodySurfaceAreaM2,
    "mL/m2",
  );
  set(
    "hemodynamics.lv.esv_index_ml_per_m2",
    lvEsv / referenceBodySurfaceAreaM2,
    "mL/m2",
  );
  set(
    "hemodynamics.lv.ejection_fraction_01",
    (lvEdv - lvEsv) / lvEdv,
    "1",
  );
  set(
    "hemodynamics.rv.ejection_fraction_01",
    (rvEdv - rvEsv) / rvEdv,
    "1",
  );

  const aorticFlow = availableValues(observations, (sample) => ({
    value: sample.valve.AoV.flowMlPerSec,
    available: sample.valve.AoV.flowAvailability === "available",
  }));
  const netStrokeVolumeMl = aorticFlow === null
    ? null
    : sum(aorticFlow) * cadence.dtSec;
  set(
    "hemodynamics.aortic.net_stroke_volume_index_ml_per_m2",
    netStrokeVolumeMl === null
      ? null
      : netStrokeVolumeMl / referenceBodySurfaceAreaM2,
    "mL/m2",
  );
  set(
    "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
    netStrokeVolumeMl === null
      ? null
      : netStrokeVolumeMl * 60 / 1000 / referenceBodySurfaceAreaM2,
    "L/min/m2",
  );

  const aorticPressure = pressureValues(
    observations,
    (sample) => sample.vascularPressure.Ao,
  );
  set(
    "hemodynamics.pressure.aortic.systolic_mmhg",
    aorticPressure === null ? null : maximum(aorticPressure),
    "mmHg",
  );
  set(
    "hemodynamics.pressure.aortic.diastolic_mmhg",
    aorticPressure === null ? null : minimum(aorticPressure),
    "mmHg",
  );
  set(
    "hemodynamics.pressure.aortic.mean_mmhg",
    aorticPressure === null ? null : mean(aorticPressure),
    "mmHg",
  );
  setPressureMetric(
    metrics,
    "hemodynamics.pressure.pulmonary_artery.systolic_mmhg",
    pressureValues(observations, (sample) => sample.vascularPressure.PA),
    maximum,
  );
  setPressureMetric(
    metrics,
    "hemodynamics.pressure.left_atrium.mean_mmhg",
    pressureValues(observations, (sample) => sample.chamber.LA),
    mean,
  );
  setPressureMetric(
    metrics,
    "hemodynamics.pressure.right_atrium.mean_mmhg",
    pressureValues(observations, (sample) => sample.chamber.RA),
    mean,
  );
  setPressureMetric(
    metrics,
    "hemodynamics.pressure.pulmonary_vein.mean_mmhg",
    pressureValues(observations, (sample) => sample.vascularPressure.PVein),
    mean,
  );

  setDiagnosticMaximum(
    metrics,
    "numerics.mechanics.maximum_residual_norm",
    observations.map((sample) => sample.diagnostics.mechanicsResidualNorm),
  );
  setDiagnosticMaximum(
    metrics,
    "numerics.circulation.maximum_scaled_residual_infinity_norm",
    observations.map((sample) =>
      sample.diagnostics.circulationScaledResidualInfinityNorm),
  );
  setDiagnosticMaximum(
    metrics,
    "numerics.continuity.maximum_absolute_residual_ml",
    observations.map((sample) =>
      absoluteOrNull(sample.diagnostics.maximumContinuityResidualMl)),
    "mL",
  );
  setDiagnosticMaximum(
    metrics,
    "numerics.total_blood_volume.maximum_absolute_error_ml",
    observations.map((sample) =>
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl)),
    "mL",
  );

  for (const metricId of MAIN_WIRE_HEALTHY_CYCLE_METRIC_IDS_V1) {
    if (metrics[metricId] === undefined) {
      throw new Error(`healthy cycle metric ${metricId} was not measured`);
    }
  }
  return Object.freeze({
    metricsId: MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID,
    schemaVersion: 1 as const,
    releaseRef: first.releaseRef,
    referenceBodySurfaceAreaM2,
    acceptedTimeRangeSec: Object.freeze([
      first.acceptedTimeSec,
      last.acceptedTimeSec,
    ] as [number, number]),
    metrics: Object.freeze(metrics),
    evidence: Object.freeze({
      source: "accepted-scientific-session-observations" as const,
      completeUniformCycleRequired: true as const,
      smoothingApplied: false as const,
      parameterFittingPerformed: false as const,
    }),
  });
}

export function evaluateMainWireHealthyReferenceAcceptanceV1(
  observations: readonly MainWireScientificSessionObservationV1[],
): MainWireHealthyReferenceAcceptanceV1 {
  const metrics = measureMainWireHealthyCycleMetricsV1(observations);
  const gateResults = MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.gates.map(
    (target): MainWireHealthyReferenceGateResultV1 => {
      const metric = metrics.metrics[target.metricId];
      const outsideTarget = metric.value !== null
        && ((target.lowerInclusive !== null
          && metric.value < target.lowerInclusive)
          || (target.upperInclusive !== null
            && metric.value > target.upperInclusive));
      const status = metric.availability !== "available" || metric.value === null
        ? "unavailable"
        : outsideTarget
        ? "fail"
        : "pass";
      return Object.freeze({
        ...target,
        status,
        value: metric.value,
        unit: metric.unit,
      });
    },
  );
  const physiologyStatus = domainStatus(gateResults, "physiology-reference");
  const numericalIntegrityStatus = domainStatus(
    gateResults,
    "numerical-integrity",
  );
  const overallStatus = physiologyStatus === "incomplete"
      || numericalIntegrityStatus === "incomplete"
    ? "incomplete"
    : physiologyStatus === "fail" || numericalIntegrityStatus === "fail"
    ? "fail"
    : "pass";
  return Object.freeze({
    acceptanceId: "main-wire-healthy-reference-acceptance-v1" as const,
    schemaVersion: 1 as const,
    targetPackId: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
    metrics,
    overallStatus,
    physiologyStatus,
    numericalIntegrityStatus,
    gateResults: Object.freeze(gateResults),
    deferredAcceptance:
      MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance,
    claim: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.claim,
  });
}

function validateCompleteUniformCycle(
  observations: readonly MainWireScientificSessionObservationV1[],
  referenceBodySurfaceAreaM2: number,
): Readonly<{ dtSec: number }> {
  if (!Number.isFinite(referenceBodySurfaceAreaM2)
    || referenceBodySurfaceAreaM2 <= 0) {
    throw new Error("referenceBodySurfaceAreaM2 must be positive and finite");
  }
  if (observations.length < 2) {
    throw new Error("healthy cycle metrics require at least two observations");
  }
  const first = observations[0]!;
  if (first.source !== "accepted-step") {
    throw new Error("healthy cycle metrics require accepted-step observations");
  }
  const dtSec = observations[1]!.acceptedTimeSec - first.acceptedTimeSec;
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    throw new Error("healthy cycle cadence must be positive and finite");
  }
  for (let index = 0; index < observations.length; index += 1) {
    const sample = observations[index]!;
    if (sample.source !== "accepted-step") {
      throw new Error("healthy cycle metrics require accepted-step observations");
    }
    if (!sameSimulationReleaseRef(first.releaseRef, sample.releaseRef)) {
      throw new Error("healthy cycle observations mix simulation releases");
    }
    if (index === 0) continue;
    const previous = observations[index - 1]!;
    if (sample.revision !== previous.revision + 1) {
      throw new Error("healthy cycle observations are not revision-contiguous");
    }
    const sampleDt = sample.acceptedTimeSec - previous.acceptedTimeSec;
    if (Math.abs(sampleDt - dtSec) > Math.max(1e-12, dtSec * 1e-9)) {
      throw new Error("healthy cycle observations do not have uniform cadence");
    }
  }
  const durationSec = dtSec * observations.length;
  if (Math.abs(durationSec - 1) > Math.max(1e-9, dtSec * 1e-6)) {
    throw new Error(
      `healthy target pack V1 requires one complete 1 s cycle; received ${durationSec}`,
    );
  }
  return Object.freeze({ dtSec });
}

function pressureValues<T extends Readonly<{
  absolutePressureMmHg: number | null;
  pressureAvailability: string;
}>>(
  observations: readonly MainWireScientificSessionObservationV1[],
  select: (sample: MainWireScientificSessionObservationV1) => T,
): number[] | null {
  return availableValues(observations, (sample) => {
    const pressure = select(sample);
    return {
      value: pressure.absolutePressureMmHg,
      available: pressure.pressureAvailability === "available",
    };
  });
}

function availableValues(
  observations: readonly MainWireScientificSessionObservationV1[],
  select: (sample: MainWireScientificSessionObservationV1) => Readonly<{
    value: number | null;
    available: boolean;
  }>,
): number[] | null {
  const output: number[] = [];
  for (const sample of observations) {
    const selected = select(sample);
    if (!selected.available || selected.value === null
      || !Number.isFinite(selected.value)) return null;
    output.push(selected.value);
  }
  return output;
}

function setPressureMetric(
  metrics: Record<MainWireHealthyCycleMetricIdV1, MainWireHealthyCycleMetricV1>,
  metricId: MainWireHealthyCycleMetricIdV1,
  values: readonly number[] | null,
  aggregate: (values: readonly number[]) => number,
): void {
  const value = values === null ? null : aggregate(values);
  metrics[metricId] = Object.freeze({
    metricId,
    value,
    unit: "mmHg",
    availability: value === null
      ? "source-signal-unavailable"
      : "available",
  });
}

function setDiagnosticMaximum(
  metrics: Record<MainWireHealthyCycleMetricIdV1, MainWireHealthyCycleMetricV1>,
  metricId: MainWireHealthyCycleMetricIdV1,
  values: readonly (number | null)[],
  unit: MainWireHealthyCycleMetricV1["unit"] = "1",
): void {
  const available = values.every((value) =>
    value !== null && Number.isFinite(value));
  const value = available ? maximum(values as number[]) : null;
  metrics[metricId] = Object.freeze({
    metricId,
    value,
    unit,
    availability: value === null
      ? "source-signal-unavailable"
      : "available",
  });
}

function absoluteOrNull(value: number | null): number | null {
  return value === null ? null : Math.abs(value);
}

function domainStatus(
  results: readonly MainWireHealthyReferenceGateResultV1[],
  domain: MainWireHealthyReferenceGateV1["domain"],
): "pass" | "fail" | "incomplete" {
  const domainResults = results.filter((result) => result.domain === domain);
  if (domainResults.some((result) => result.status === "unavailable")) {
    return "incomplete";
  }
  return domainResults.some((result) => result.status === "fail")
    ? "fail"
    : "pass";
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}

function mean(values: readonly number[]): number {
  return sum(values) / values.length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

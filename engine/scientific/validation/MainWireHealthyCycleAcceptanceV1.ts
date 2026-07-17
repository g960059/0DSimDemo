import {
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime";

export const MAIN_WIRE_HEALTHY_CYCLE_METRICS_V1_ID =
  "main-wire-healthy-cycle-metrics-v1" as const;
export const MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID =
  "main-wire-healthy-reference-target-pack-v1" as const;

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

export type MainWireHealthyReferenceGateV1 = Readonly<{
  gateId: string;
  metricId: MainWireHealthyCycleMetricIdV1;
  domain: "physiology-reference" | "numerical-integrity";
  lowerInclusive: number | null;
  upperInclusive: number | null;
  sourceIds: readonly string[];
  interpretation: string;
}>;

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

export const MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1 = Object.freeze({
  targetPackId: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
  schemaVersion: 1 as const,
  referenceSubject: Object.freeze({
    bodySurfaceAreaM2: 1.9 as const,
    state: "resting-adult-research-reference" as const,
  }),
  sources: Object.freeze([
    Object.freeze({
      sourceId: "lang-ase-eacvi-2015",
      citation:
        "Lang RM et al. Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults. J Am Soc Echocardiogr. 2015;28:1-39.e14.",
      doi: "10.1016/j.echo.2014.10.003",
      url: "https://doi.org/10.1016/j.echo.2014.10.003",
      role:
        "sex-aware LV volume-index and ejection-fraction reference context",
    }),
    Object.freeze({
      sourceId: "kou-norre-2014",
      citation:
        "Kou S et al. Echocardiographic reference ranges for normal cardiac chamber size: results from the NORRE study. Eur Heart J Cardiovasc Imaging. 2014;15:680-690.",
      doi: "10.1093/ehjci/jet284",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4402333/",
      role:
        "healthy-cohort LV EDVi, ESVi, and ejection-fraction reference intervals",
    }),
    Object.freeze({
      sourceId: "mukherjee-ase-right-heart-2025",
      citation:
        "Mukherjee M et al. Guidelines for the Echocardiographic Assessment of the Right Heart in Adults and Special Considerations in Pulmonary Hypertension. J Am Soc Echocardiogr. 2025;38:141-186.",
      doi: "10.1016/j.echo.2025.01.006",
      url: "https://doi.org/10.1016/j.echo.2025.01.006",
      role:
        "current resting RVSP screening context, used only as a direct-model PA systolic review screen",
    }),
    Object.freeze({
      sourceId: "kovacs-pawp-healthy-meta-2024",
      citation:
        "Zeder K et al. Pulmonary arterial wedge pressure in healthy subjects: a meta-analysis. Eur Respir J. 2024;64:2400967.",
      doi: "10.1183/13993003.00967-2024",
      url: "https://doi.org/10.1183/13993003.00967-2024",
      role:
        "upper reference context for resting supine pulmonary arterial wedge pressure",
    }),
    Object.freeze({
      sourceId: "cardiac-index-clinical-reference",
      citation:
        "King J, Lowery DR. Physiology, Cardiac Index. StatPearls. Updated 2024.",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK539905/",
      role: "broad resting cardiac-index screening range",
    }),
    Object.freeze({
      sourceId: "circleheart-numerical-contract-v1",
      citation:
        "CircleHeart scientific runtime numerical-integrity contract V1.",
      url: null,
      role: "engineering tolerances; not a biological reference",
    }),
  ]),
  gates: Object.freeze([
    gate(
      "healthy.lv.edvi",
      "hemodynamics.lv.edv_index_ml_per_m2",
      "physiology-reference",
      34,
      76,
      ["lang-ase-eacvi-2015", "kou-norre-2014"],
      "Broad sex-neutral 2D-echocardiographic healthy reference screen.",
    ),
    gate(
      "healthy.lv.esvi",
      "hemodynamics.lv.esv_index_ml_per_m2",
      "physiology-reference",
      10,
      29,
      ["lang-ase-eacvi-2015", "kou-norre-2014"],
      "Broad sex-neutral 2D-echocardiographic healthy reference screen.",
    ),
    gate(
      "healthy.lv.ef",
      "hemodynamics.lv.ejection_fraction_01",
      "physiology-reference",
      0.52,
      0.74,
      ["lang-ase-eacvi-2015", "kou-norre-2014"],
      "Inclusive healthy-adult LVEF screen; not a diagnostic partition.",
    ),
    gate(
      "healthy.cardiac_index",
      "hemodynamics.aortic.cardiac_index_l_per_min_per_m2",
      "physiology-reference",
      2.5,
      4,
      ["cardiac-index-clinical-reference"],
      "Broad resting output screen normalized to the fixed reference BSA.",
    ),
    gate(
      "healthy.pulmonary_artery.systolic",
      "hemodynamics.pressure.pulmonary_artery.systolic_mmhg",
      "physiology-reference",
      10,
      35,
      ["mukherjee-ase-right-heart-2025"],
      "The 2025 ASE RVSP threshold is used only as a direct-model PA systolic review screen; a miss is not labeled as disease.",
    ),
    gate(
      "healthy.left_atrium.mean",
      "hemodynamics.pressure.left_atrium.mean_mmhg",
      "physiology-reference",
      2,
      13,
      ["kovacs-pawp-healthy-meta-2024"],
      "LA mean pressure is compared only as a model-side surrogate screen; it is not asserted to equal measured PAWP.",
    ),
    gate(
      "numerics.mechanics.residual",
      "numerics.mechanics.maximum_residual_norm",
      "numerical-integrity",
      0,
      1e-7,
      ["circleheart-numerical-contract-v1"],
      "Maximum accepted-step mechanics residual over the evaluated cycle.",
    ),
    gate(
      "numerics.circulation.residual",
      "numerics.circulation.maximum_scaled_residual_infinity_norm",
      "numerical-integrity",
      0,
      1e-7,
      ["circleheart-numerical-contract-v1"],
      "Maximum accepted-step scaled circulation residual over the evaluated cycle.",
    ),
    gate(
      "numerics.continuity.residual",
      "numerics.continuity.maximum_absolute_residual_ml",
      "numerical-integrity",
      0,
      5e-7,
      ["circleheart-numerical-contract-v1"],
      "Maximum absolute discrete node-continuity residual over the evaluated cycle.",
    ),
    gate(
      "numerics.total_blood_volume.error",
      "numerics.total_blood_volume.maximum_absolute_error_ml",
      "numerical-integrity",
      0,
      1e-8,
      ["circleheart-numerical-contract-v1"],
      "Maximum absolute fixed-TBV conservation error over the evaluated cycle.",
    ),
  ]),
  deferredAcceptance: Object.freeze([
    "atrial-PV-loop-reservoir-conduit-pump-topology",
    "AV-valve-E-and-A-wave-morphology",
    "HR-preload-afterload-PVR-inotropy-lusitropy-envelope",
    "multi-start-periodic-basin",
    "dt-refinement",
    "intervention-transient",
  ]),
  claim: Object.freeze({
    broadReferenceScreenNotPatientFit: true as const,
    literatureRangesAreNotInterchangeableAcrossModalities: true as const,
    passingDoesNotClaimClinicalValidation: true as const,
    failingIdentifiesReviewWorkNotDiagnosis: true as const,
    waveformShapeFittingPerformed: false as const,
    numericalAndPhysiologyDomainsReportedSeparately: true as const,
  }),
});

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
    MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject
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

function gate(
  gateId: string,
  metricId: MainWireHealthyCycleMetricIdV1,
  domain: MainWireHealthyReferenceGateV1["domain"],
  lowerInclusive: number | null,
  upperInclusive: number | null,
  sourceIds: readonly string[],
  interpretation: string,
): MainWireHealthyReferenceGateV1 {
  return Object.freeze({
    gateId,
    metricId,
    domain,
    lowerInclusive,
    upperInclusive,
    sourceIds: Object.freeze([...sourceIds]),
    interpretation,
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

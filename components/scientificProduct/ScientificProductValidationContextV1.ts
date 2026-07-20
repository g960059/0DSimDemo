import {
  deriveMainWireScientificMetricsV1,
  type MainWireScientificDerivedMetricEvaluationV1,
  type MainWireScientificDerivedMetricIdV1,
  type MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics/MainWireScientificDerivedMetricRegistryV1";
import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
  type MainWireHealthyReferenceGateV1,
} from "@/engine/scientific/validation/MainWireHealthyCycleAcceptanceV1";

export type ScientificProductReferenceContextStatusV1 =
  | "within-reference"
  | "outside-reference"
  | "unavailable";

export type ScientificProductReferenceContextResultV1 = Readonly<{
  gateId: string;
  label: string;
  value: number | null;
  unit: string;
  lowerInclusive: number | null;
  upperInclusive: number | null;
  status: ScientificProductReferenceContextStatusV1;
  interpretation: string;
  sourceIds: readonly string[];
}>;

export type ScientificProductNumericalCycleResultV1 = Readonly<{
  gateId: string;
  label: string;
  value: number | null;
  unit: string;
  lowerInclusive: number | null;
  upperInclusive: number | null;
  status: "pass" | "error" | "unavailable";
  interpretation: string;
}>;

export type ScientificProductValveFlowSummaryV1 = Readonly<{
  valveId: "AoV" | "MV" | "TV" | "PV";
  forwardVolumeMl: number | null;
  reverseVolumeMl: number | null;
  regurgitantFractionPercent: number | null;
  peakGradientMmHg: number | null;
  meanGradientMmHg: number | null;
}>;

export type ScientificProductWaveformAvailabilityV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  label: string;
  availableFrameCount: number;
  totalFrameCount: number;
  complete: boolean;
}>;

export type ScientificProductValidationContextV1 = Readonly<{
  cycleAvailable: boolean;
  cycleEvidence: "validated-periodic-P1" | "unavailable";
  referenceSubject: typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject;
  referenceResults: readonly ScientificProductReferenceContextResultV1[];
  numericalResults: readonly ScientificProductNumericalCycleResultV1[];
  valveFlow: readonly ScientificProductValveFlowSummaryV1[];
  waveformAvailability: readonly ScientificProductWaveformAvailabilityV1[];
  references: typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources;
  deferredAcceptance: typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance;
}>;

const EMPTY_VALIDATION_CONTEXT_V1: ScientificProductValidationContextV1 =
  Object.freeze({
    cycleAvailable: false,
    cycleEvidence: "unavailable" as const,
    referenceSubject: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject,
    referenceResults: Object.freeze([]),
    numericalResults: Object.freeze([]),
    valveFlow: Object.freeze([]),
    waveformAvailability: Object.freeze([]),
    references: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources,
    deferredAcceptance:
      MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance,
  });

export function createScientificProductValidationContextV1(
  cycle: MainWireScientificValidatedTerminalCycleV1 | null,
): ScientificProductValidationContextV1 {
  if (cycle === null) return EMPTY_VALIDATION_CONTEXT_V1;
  const derived = deriveMainWireScientificMetricsV1(cycle);
  if (derived.cycleAvailability !== "validated") {
    return EMPTY_VALIDATION_CONTEXT_V1;
  }
  const referenceResults = MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.gates
    .filter(({ domain }) => domain === "physiology-reference")
    .map((gate) => referenceResultV1(gate, derived));
  const numericalResults = MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.gates
    .filter(({ domain }) => domain === "numerical-integrity")
    .map((gate) => numericalResultV1(gate, cycle.frames));
  return Object.freeze({
    cycleAvailable: true,
    cycleEvidence: "validated-periodic-P1" as const,
    referenceSubject: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject,
    referenceResults: Object.freeze(referenceResults),
    numericalResults: Object.freeze(numericalResults),
    valveFlow: Object.freeze(
      (["AoV", "MV", "TV", "PV"] as const).map((valveId) =>
        valveSummaryV1(valveId, derived)),
    ),
    waveformAvailability: Object.freeze([
      waveformAvailabilityV1(
        cycle.frames,
        "hemodynamics.pressure.absolute.Ao",
        "Aortic pressure",
      ),
      waveformAvailabilityV1(
        cycle.frames,
        "hemodynamics.pressure.absolute.LV",
        "LV pressure",
      ),
      waveformAvailabilityV1(
        cycle.frames,
        "hemodynamics.pressure.absolute.LA",
        "LA pressure",
      ),
      waveformAvailabilityV1(cycle.frames, "valve.MV.flow", "Mitral flow"),
      waveformAvailabilityV1(cycle.frames, "valve.AoV.flow", "Aortic flow"),
      waveformAvailabilityV1(cycle.frames, "valve.TV.flow", "Tricuspid flow"),
      waveformAvailabilityV1(cycle.frames, "valve.PV.flow", "Pulmonary flow"),
    ]),
    references: MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources,
    deferredAcceptance:
      MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.deferredAcceptance,
  });
}

function referenceResultV1(
  gate: MainWireHealthyReferenceGateV1,
  derived: MainWireScientificDerivedMetricEvaluationV1,
): ScientificProductReferenceContextResultV1 {
  const projected = projectedReferenceMetricV1(gate.metricId, derived);
  const outside = projected.value !== null
    && ((gate.lowerInclusive !== null && projected.value < gate.lowerInclusive)
      || (gate.upperInclusive !== null && projected.value > gate.upperInclusive));
  return Object.freeze({
    gateId: gate.gateId,
    label: referenceLabelV1(gate.gateId),
    value: projected.value,
    unit: projected.unit,
    lowerInclusive: gate.lowerInclusive,
    upperInclusive: gate.upperInclusive,
    status: projected.value === null
      ? "unavailable" as const
      : outside
        ? "outside-reference" as const
        : "within-reference" as const,
    interpretation: gate.interpretation,
    sourceIds: gate.sourceIds,
  });
}

function numericalResultV1(
  gate: MainWireHealthyReferenceGateV1,
  frames: readonly MainWireScientificObservableFrameV1[],
): ScientificProductNumericalCycleResultV1 {
  const observableId = numericalObservableIdV1(gate.metricId);
  const assessedFrames = frames.filter(({ source }) => source === "accepted-step");
  const rawValues = observableId === null
    ? []
    : assessedFrames.flatMap((frame) => {
      const observable = frame.values[observableId];
      return observable !== undefined
        && observable.observableId === observableId
        && observable.availability === "available"
        && observable.value !== null
        && Number.isFinite(observable.value)
        && observable.quality !== "not-assessed"
        ? [observable.value]
        : [];
    });
  const value = rawValues.length === assessedFrames.length
      && rawValues.length > 0
    ? Math.max(...rawValues.map(Math.abs))
    : null;
  const negativeNormObserved = numericalNormMetricV1(gate.metricId)
    && rawValues.some((candidate) => candidate < 0);
  return Object.freeze({
    gateId: gate.gateId,
    label: numericalLabelV1(gate.gateId),
    value,
    unit: gate.metricId.includes("residual_ml")
      || gate.metricId.includes("error_ml")
      ? "mL"
      : "1",
    lowerInclusive: gate.lowerInclusive,
    upperInclusive: gate.upperInclusive,
    status: value === null
      ? "unavailable" as const
      : negativeNormObserved
        || (gate.lowerInclusive !== null && value < gate.lowerInclusive)
        || (gate.upperInclusive !== null && value > gate.upperInclusive)
        ? "error" as const
        : "pass" as const,
    interpretation: gate.interpretation,
  });
}

function numericalNormMetricV1(
  metricId: MainWireHealthyReferenceGateV1["metricId"],
): boolean {
  return metricId === "numerics.mechanics.maximum_residual_norm"
    || metricId
      === "numerics.circulation.maximum_scaled_residual_infinity_norm";
}

function projectedReferenceMetricV1(
  metricId: MainWireHealthyReferenceGateV1["metricId"],
  derived: MainWireScientificDerivedMetricEvaluationV1,
): Readonly<{ value: number | null; unit: string }> {
  const bsa = MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject
    .bodySurfaceAreaM2;
  switch (metricId) {
    case "hemodynamics.lv.edv_index_ml_per_m2":
      return projectedDerivedV1(
        derived,
        "hemodynamics.volume.end_diastolic.LV",
        "mL/m²",
        (value) => value / bsa,
      );
    case "hemodynamics.lv.esv_index_ml_per_m2":
      return projectedDerivedV1(
        derived,
        "hemodynamics.volume.end_systolic.LV",
        "mL/m²",
        (value) => value / bsa,
      );
    case "hemodynamics.lv.ejection_fraction_01":
      return projectedDerivedV1(
        derived,
        "hemodynamics.ejection_fraction.LV",
        "fraction",
        (value) => value / 100,
      );
    case "hemodynamics.aortic.cardiac_index_l_per_min_per_m2":
      return projectedDerivedV1(
        derived,
        "valve.AoV.cardiac_output.net",
        "L/min/m²",
        (value) => value / bsa,
      );
    case "hemodynamics.pressure.pulmonary_artery.systolic_mmhg":
      return projectedDerivedV1(
        derived,
        "hemodynamics.pressure.systolic.PA",
        "mmHg",
      );
    case "hemodynamics.pressure.left_atrium.mean_mmhg":
      return projectedDerivedV1(
        derived,
        "hemodynamics.pressure.mean.LA",
        "mmHg",
      );
    default:
      return Object.freeze({ value: null, unit: "" });
  }
}

function projectedDerivedV1(
  derived: MainWireScientificDerivedMetricEvaluationV1,
  metricId: MainWireScientificDerivedMetricIdV1,
  unit: string,
  transform: (value: number) => number = (value) => value,
): Readonly<{ value: number | null; unit: string }> {
  const result = derived.values[metricId];
  return Object.freeze({
    value: result.availability === "available" && result.value !== null
      ? transform(result.value)
      : null,
    unit,
  });
}

function valveSummaryV1(
  valveId: ScientificProductValveFlowSummaryV1["valveId"],
  derived: MainWireScientificDerivedMetricEvaluationV1,
): ScientificProductValveFlowSummaryV1 {
  return Object.freeze({
    valveId,
    forwardVolumeMl: derivedMetricValueV1(
      derived,
      `valve.${valveId}.cycle_volume.forward`,
    ),
    reverseVolumeMl: derivedMetricValueV1(
      derived,
      `valve.${valveId}.cycle_volume.reverse`,
    ),
    regurgitantFractionPercent: derivedMetricValueV1(
      derived,
      `valve.${valveId}.regurgitant_fraction`,
    ),
    peakGradientMmHg: derivedMetricValueV1(
      derived,
      `valve.${valveId}.gradient.forward_peak`,
    ),
    meanGradientMmHg: derivedMetricValueV1(
      derived,
      `valve.${valveId}.gradient.forward_mean`,
    ),
  });
}

function derivedMetricValueV1(
  derived: MainWireScientificDerivedMetricEvaluationV1,
  metricId: string,
): number | null {
  const result = derived.values[
    metricId as MainWireScientificDerivedMetricIdV1
  ];
  return result?.availability === "available" && result.value !== null
    ? result.value
    : null;
}

function waveformAvailabilityV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  observableId: MainWireScientificObservableIdV1,
  label: string,
): ScientificProductWaveformAvailabilityV1 {
  const availableFrameCount = frames.filter((frame) => {
    const observable = frame.values[observableId];
    return observable !== undefined
      && observable.observableId === observableId
      && observable.availability === "available"
      && observable.value !== null
      && Number.isFinite(observable.value)
      && observable.quality !== "not-assessed";
  }).length;
  return Object.freeze({
    observableId,
    label,
    availableFrameCount,
    totalFrameCount: frames.length,
    complete: availableFrameCount === frames.length && frames.length > 0,
  });
}

function numericalObservableIdV1(
  metricId: MainWireHealthyReferenceGateV1["metricId"],
): MainWireScientificObservableIdV1 | null {
  switch (metricId) {
    case "numerics.mechanics.maximum_residual_norm":
      return "solver.mechanics.residual_norm";
    case "numerics.circulation.maximum_scaled_residual_infinity_norm":
      return "solver.circulation.scaled_residual_infinity_norm";
    case "numerics.continuity.maximum_absolute_residual_ml":
      return "solver.continuity.maximum_residual";
    case "numerics.total_blood_volume.maximum_absolute_error_ml":
      return "conservation.total_blood_volume.error";
    default:
      return null;
  }
}

function referenceLabelV1(gateId: string): string {
  const labels: Readonly<Record<string, string>> = Object.freeze({
    "healthy.lv.edvi": "LV end-diastolic volume index",
    "healthy.lv.esvi": "LV end-systolic volume index",
    "healthy.lv.ef": "LV ejection fraction",
    "healthy.cardiac_index": "Cardiac index",
    "healthy.pulmonary_artery.systolic": "Pulmonary artery systolic pressure",
    "healthy.left_atrium.mean": "Mean left-atrial pressure",
  });
  return labels[gateId] ?? gateId;
}

function numericalLabelV1(gateId: string): string {
  const labels: Readonly<Record<string, string>> = Object.freeze({
    "numerics.mechanics.residual": "Mechanics residual",
    "numerics.circulation.residual": "Circulation residual",
    "numerics.continuity.residual": "Continuity residual",
    "numerics.total_blood_volume.error": "Total blood-volume error",
  });
  return labels[gateId] ?? gateId;
}

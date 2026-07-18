import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type ScientificObservableAvailabilityV1,
  type ScientificObservableQualityV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID =
  "main-wire-scientific-derived-metric-registry-v1" as const;
export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION =
  1 as const;
export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1 =
  1 as const;
export const MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID =
  "main-wire-scientific-validated-terminal-cycle-v1" as const;

const TERMINAL_CYCLE_SAMPLE_COUNT_V1 = 501;
const TERMINAL_CYCLE_DURATION_SEC_V1 = 1;
const TERMINAL_CYCLE_DT_SEC_V1 = 0.002;
const TIME_TOLERANCE_SEC_V1 = 1e-10;

export type MainWireScientificDerivedMetricUnitV1 =
  | "mmHg"
  | "mL"
  | "%"
  | "L/min";

export type MainWireScientificDerivedMetricQuantityKindV1 =
  | "time-weighted-mean-pressure"
  | "volume-excursion"
  | "ejection-fraction"
  | "forward-cycle-volume"
  | "net-cycle-volume"
  | "forward-cardiac-output"
  | "net-cardiac-output";

export type MainWireScientificMetricDerivationIdV1 =
  | "trapezoidal-time-weighted-mean-v1"
  | "cycle-extrema-excursion-v1"
  | "cycle-extrema-ejection-fraction-v1"
  | "piecewise-linear-positive-flow-integral-v1"
  | "trapezoidal-net-flow-integral-v1"
  | "piecewise-linear-positive-flow-output-v1"
  | "trapezoidal-net-flow-output-v1";

export type MainWireScientificDerivedMetricDefinitionV1<
  TId extends string = string,
> = Readonly<{
  metricId: TId;
  quantityKind: MainWireScientificDerivedMetricQuantityKindV1;
  unit: MainWireScientificDerivedMetricUnitV1;
  derivationId: MainWireScientificMetricDerivationIdV1;
  derivationVersion:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1;
  dependencies: readonly MainWireScientificObservableIdV1[];
  definition: string;
}>;

export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1 = Object.freeze([
  definition(
    "hemodynamics.pressure.mean.LA",
    "time-weighted-mean-pressure",
    "mmHg",
    "trapezoidal-time-weighted-mean-v1",
    ["hemodynamics.pressure.absolute.LA"],
    "Time-weighted mean absolute left-atrial pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.mean.RA",
    "time-weighted-mean-pressure",
    "mmHg",
    "trapezoidal-time-weighted-mean-v1",
    ["hemodynamics.pressure.absolute.RA"],
    "Time-weighted mean absolute right-atrial pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.mean.Ao",
    "time-weighted-mean-pressure",
    "mmHg",
    "trapezoidal-time-weighted-mean-v1",
    ["hemodynamics.pressure.absolute.Ao"],
    "Time-weighted mean absolute aortic pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.mean.PA",
    "time-weighted-mean-pressure",
    "mmHg",
    "trapezoidal-time-weighted-mean-v1",
    ["hemodynamics.pressure.absolute.PA"],
    "Time-weighted mean absolute pulmonary-artery pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.volume.excursion.LV",
    "volume-excursion",
    "mL",
    "cycle-extrema-excursion-v1",
    ["hemodynamics.volume.LV"],
    "Maximum minus minimum left-ventricular volume over one validated cycle.",
  ),
  definition(
    "hemodynamics.ejection_fraction.LV",
    "ejection-fraction",
    "%",
    "cycle-extrema-ejection-fraction-v1",
    ["hemodynamics.volume.LV"],
    "One hundred times left-ventricular volume excursion divided by maximum cycle volume.",
  ),
  definition(
    "hemodynamics.volume.excursion.RV",
    "volume-excursion",
    "mL",
    "cycle-extrema-excursion-v1",
    ["hemodynamics.volume.RV"],
    "Maximum minus minimum right-ventricular volume over one validated cycle.",
  ),
  definition(
    "hemodynamics.ejection_fraction.RV",
    "ejection-fraction",
    "%",
    "cycle-extrema-ejection-fraction-v1",
    ["hemodynamics.volume.RV"],
    "One hundred times right-ventricular volume excursion divided by maximum cycle volume.",
  ),
  definition(
    "valve.AoV.cycle_volume.forward",
    "forward-cycle-volume",
    "mL",
    "piecewise-linear-positive-flow-integral-v1",
    ["valve.AoV.flow"],
    "Integral of the positive part of aortic-valve flow over one validated cycle.",
  ),
  definition(
    "valve.AoV.cycle_volume.net",
    "net-cycle-volume",
    "mL",
    "trapezoidal-net-flow-integral-v1",
    ["valve.AoV.flow"],
    "Signed integral of aortic-valve flow over one validated cycle.",
  ),
  definition(
    "valve.AoV.cardiac_output.forward",
    "forward-cardiac-output",
    "L/min",
    "piecewise-linear-positive-flow-output-v1",
    ["valve.AoV.flow"],
    "Aortic forward cycle volume divided by cycle duration and converted to litres per minute.",
  ),
  definition(
    "valve.AoV.cardiac_output.net",
    "net-cardiac-output",
    "L/min",
    "trapezoidal-net-flow-output-v1",
    ["valve.AoV.flow"],
    "Aortic signed cycle volume divided by cycle duration and converted to litres per minute.",
  ),
  definition(
    "valve.PV.cycle_volume.forward",
    "forward-cycle-volume",
    "mL",
    "piecewise-linear-positive-flow-integral-v1",
    ["valve.PV.flow"],
    "Integral of the positive part of pulmonary-valve flow over one validated cycle.",
  ),
  definition(
    "valve.PV.cycle_volume.net",
    "net-cycle-volume",
    "mL",
    "trapezoidal-net-flow-integral-v1",
    ["valve.PV.flow"],
    "Signed integral of pulmonary-valve flow over one validated cycle.",
  ),
  definition(
    "valve.PV.cardiac_output.forward",
    "forward-cardiac-output",
    "L/min",
    "piecewise-linear-positive-flow-output-v1",
    ["valve.PV.flow"],
    "Pulmonary forward cycle volume divided by cycle duration and converted to litres per minute.",
  ),
  definition(
    "valve.PV.cardiac_output.net",
    "net-cardiac-output",
    "L/min",
    "trapezoidal-net-flow-output-v1",
    ["valve.PV.flow"],
    "Pulmonary signed cycle volume divided by cycle duration and converted to litres per minute.",
  ),
] as const);

export type MainWireScientificDerivedMetricIdV1 =
  (typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1)[number]["metricId"];

export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_IDS_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => metricId),
) as readonly MainWireScientificDerivedMetricIdV1[];

export type MainWireScientificDerivedMetricUnavailableReasonV1 =
  | "validated-complete-cycle-required"
  | "dependency-unavailable"
  | "dependency-contract-invalid"
  | "invalid-derived-denominator"
  | "derived-value-non-finite";

export type MainWireScientificDerivedMetricValueV1 = Readonly<{
  metricId: MainWireScientificDerivedMetricIdV1;
  value: number | null;
  availability: ScientificObservableAvailabilityV1;
  quality: ScientificObservableQualityV1;
  unavailableReason: MainWireScientificDerivedMetricUnavailableReasonV1 | null;
  unavailableDependency: MainWireScientificObservableIdV1 | null;
}>;

/**
 * Structural subset shared by official-checkpoint and research-P1 terminal
 * cycles. Callers must pass the validated cycle object, not an arbitrary frame
 * history. Runtime checks fail closed if its proof or frame sequence is altered.
 */
export type MainWireScientificValidatedTerminalCycleV1 = Readonly<{
  frames: readonly MainWireScientificObservableFrameV1[];
  releaseRef: SimulationReleaseRef;
  durationSec: number;
  evidence: Readonly<{
    exactReleaseRefUniform: true;
    revisionsContiguous: true;
    cadenceUniform: true;
    bothCycleBoundariesRetained: true;
    smoothingOrInterpolationApplied: false;
  }>;
}>;

export type MainWireScientificDerivedMetricEvaluationV1 = Readonly<{
  registryId: typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID;
  schemaVersion:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION;
  derivationVersion:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1;
  inputCycleContractId:
    typeof MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID;
  cycleAvailability: "validated" | "unavailable";
  cycleUnavailableReason: string | null;
  releaseRef: SimulationReleaseRef | null;
  firstRevision: number | null;
  finalRevision: number | null;
  firstAcceptedTimeSec: number | null;
  finalAcceptedTimeSec: number | null;
  durationSec: number | null;
  values: Readonly<Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >>;
}>;

export const MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_SNAPSHOT_V1 =
  Object.freeze({
    registryId: MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION,
    derivationVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
    inputFrameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    inputCycleContractId:
      MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID,
    catalog: MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
    integrationPolicy: Object.freeze({
      timeWeightedMean: "trapezoidal-over-accepted-frame-time" as const,
      netFlow: "signed-trapezoidal-over-accepted-frame-time" as const,
      forwardFlow:
        "positive-part-of-piecewise-linear-flow-with-exact-zero-crossing" as const,
      cardiacOutput: "cycle-volume-over-duration-times-0.06-L-min-per-mL-s" as const,
    }),
    extremaPolicy: "raw-validated-cycle-samples-no-interpolation" as const,
  });

/**
 * Derives metrics solely from release-bound scientific observable frames.
 * It never projects into legacy SimSample/PhysicsRefState and never substitutes
 * zero for an unavailable cycle or dependency.
 */
export function deriveMainWireScientificMetricsV1(
  cycle: MainWireScientificValidatedTerminalCycleV1 | null | undefined,
): MainWireScientificDerivedMetricEvaluationV1 {
  const cycleIssue = validatedCycleIssue(cycle);
  if (cycle === null || cycle === undefined || cycleIssue !== null) {
    return evaluation(
      "unavailable",
      cycleIssue ?? "validated terminal cycle was not supplied",
      null,
      unavailableValuesForCycle(),
    );
  }

  const frames = cycle.frames;
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map((entry) => [
      entry.metricId,
      deriveMetric(entry, frames, cycle.durationSec),
    ]),
  ) as Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >;

  return evaluation("validated", null, cycle, Object.freeze(values));
}

function definition<
  TId extends string,
  TDependencies extends readonly MainWireScientificObservableIdV1[],
>(
  metricId: TId,
  quantityKind: MainWireScientificDerivedMetricQuantityKindV1,
  unit: MainWireScientificDerivedMetricUnitV1,
  derivationId: MainWireScientificMetricDerivationIdV1,
  dependencies: TDependencies,
  metricDefinition: string,
): MainWireScientificDerivedMetricDefinitionV1<TId> & Readonly<{
  dependencies: TDependencies;
}> {
  return Object.freeze({
    metricId,
    quantityKind,
    unit,
    derivationId,
    derivationVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
    dependencies: Object.freeze([...dependencies]) as unknown as TDependencies,
    definition: metricDefinition,
  });
}

function validatedCycleIssue(
  cycle: MainWireScientificValidatedTerminalCycleV1 | null | undefined,
): string | null {
  if (cycle === null || cycle === undefined) {
    return "validated terminal cycle was not supplied";
  }
  if (
    cycle.evidence.exactReleaseRefUniform !== true
    || cycle.evidence.revisionsContiguous !== true
    || cycle.evidence.cadenceUniform !== true
    || cycle.evidence.bothCycleBoundariesRetained !== true
    || cycle.evidence.smoothingOrInterpolationApplied !== false
  ) {
    return "validated terminal-cycle evidence is incomplete";
  }
  if (cycle.frames.length !== TERMINAL_CYCLE_SAMPLE_COUNT_V1) {
    return `expected ${TERMINAL_CYCLE_SAMPLE_COUNT_V1} terminal-cycle frames`;
  }
  if (
    !Number.isFinite(cycle.durationSec)
    || Math.abs(cycle.durationSec - TERMINAL_CYCLE_DURATION_SEC_V1)
      > TIME_TOLERANCE_SEC_V1
  ) {
    return "terminal-cycle duration is not one second";
  }

  const first = cycle.frames[0]!;
  if (!validFrameEnvelope(first)) {
    return "first terminal-cycle frame has an invalid envelope";
  }
  if (
    first.source !== "exact-checkpoint-restore"
    && first.source !== "accepted-step"
  ) {
    return "first terminal-cycle frame is not a validated cycle boundary";
  }
  if (!sameSimulationReleaseRef(cycle.releaseRef, first.releaseRef)) {
    return "cycle release does not match its first frame";
  }

  for (let index = 1; index < cycle.frames.length; index += 1) {
    const previous = cycle.frames[index - 1]!;
    const current = cycle.frames[index]!;
    if (!validFrameEnvelope(current)) {
      return `terminal-cycle frame ${index} has an invalid envelope`;
    }
    if (current.source !== "accepted-step") {
      return `terminal-cycle frame ${index} is not an accepted step`;
    }
    if (!sameSimulationReleaseRef(first.releaseRef, current.releaseRef)) {
      return `terminal-cycle frame ${index} has a different release`;
    }
    if (current.revision !== previous.revision + 1) {
      return `terminal-cycle frame ${index} is not revision-contiguous`;
    }
    const dtSec = current.acceptedTimeSec - previous.acceptedTimeSec;
    if (
      !Number.isFinite(dtSec)
      || Math.abs(dtSec - TERMINAL_CYCLE_DT_SEC_V1)
        > TIME_TOLERANCE_SEC_V1
    ) {
      return `terminal-cycle frame ${index} does not preserve 2 ms cadence`;
    }
  }

  const last = cycle.frames.at(-1)!;
  if (
    Math.abs(
      last.acceptedTimeSec - first.acceptedTimeSec - cycle.durationSec,
    ) > TIME_TOLERANCE_SEC_V1
  ) {
    return "terminal-cycle frame span does not match cycle duration";
  }
  return null;
}

function validFrameEnvelope(frame: MainWireScientificObservableFrameV1): boolean {
  return frame.frameId === MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
    && frame.registryId === MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
    && frame.schemaVersion
      === MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
    && Number.isSafeInteger(frame.revision)
    && frame.revision >= 0
    && Number.isFinite(frame.acceptedTimeSec)
    && frame.acceptedTimeSec >= 0;
}

function deriveMetric(
  definitionEntry:
    (typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1)[number],
  frames: readonly MainWireScientificObservableFrameV1[],
  durationSec: number,
): MainWireScientificDerivedMetricValueV1 {
  const dependency = definitionEntry.dependencies[0]!;
  const series = dependencySeries(frames, dependency);
  if (series.available === false) {
    return unavailableMetric(
      definitionEntry.metricId,
      series.availability,
      series.reason,
      dependency,
    );
  }

  let value: number;
  switch (definitionEntry.quantityKind) {
    case "time-weighted-mean-pressure":
      value = integrateTrapezoidal(series.values, frames) / durationSec;
      break;
    case "volume-excursion":
      value = extrema(series.values).excursion;
      break;
    case "ejection-fraction": {
      const volumeExtrema = extrema(series.values);
      if (volumeExtrema.maximum <= 0) {
        return unavailableMetric(
          definitionEntry.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependency,
        );
      }
      value = 100 * volumeExtrema.excursion / volumeExtrema.maximum;
      break;
    }
    case "forward-cycle-volume":
      value = integratePositivePiecewiseLinear(series.values, frames);
      break;
    case "net-cycle-volume":
      value = integrateTrapezoidal(series.values, frames);
      break;
    case "forward-cardiac-output":
      value = integratePositivePiecewiseLinear(series.values, frames)
        / durationSec * 0.06;
      break;
    case "net-cardiac-output":
      value = integrateTrapezoidal(series.values, frames)
        / durationSec * 0.06;
      break;
  }

  if (!Number.isFinite(value)) {
    return unavailableMetric(
      definitionEntry.metricId,
      "not-evaluated-at-accepted-state",
      "derived-value-non-finite",
      dependency,
    );
  }
  return availableMetric(definitionEntry.metricId, value);
}

type AvailableDependencySeries = Readonly<{
  available: true;
  values: readonly number[];
}>;
type UnavailableDependencySeries = Readonly<{
  available: false;
  availability: Exclude<ScientificObservableAvailabilityV1, "available">;
  reason:
    | "dependency-unavailable"
    | "dependency-contract-invalid";
}>;

function dependencySeries(
  frames: readonly MainWireScientificObservableFrameV1[],
  observableId: MainWireScientificObservableIdV1,
): AvailableDependencySeries | UnavailableDependencySeries {
  const values: number[] = [];
  for (const frame of frames) {
    const sample = frame.values[observableId];
    if (
      sample === undefined
      || sample.observableId !== observableId
      || (sample.availability === "available"
        && (sample.value === null
          || !Number.isFinite(sample.value)
          || sample.quality === "not-assessed"))
      || (sample.availability !== "available"
        && (sample.value !== null || sample.quality !== "not-assessed"))
    ) {
      return Object.freeze({
        available: false as const,
        availability: "not-evaluated-at-accepted-state" as const,
        reason: "dependency-contract-invalid" as const,
      });
    }
    if (sample.availability !== "available") {
      return Object.freeze({
        available: false as const,
        availability: sample.availability,
        reason: "dependency-unavailable" as const,
      });
    }
    values.push(sample.value!);
  }
  return Object.freeze({
    available: true as const,
    values: Object.freeze(values),
  });
}

function integrateTrapezoidal(
  values: readonly number[],
  frames: readonly MainWireScientificObservableFrameV1[],
): number {
  let area = 0;
  for (let index = 1; index < values.length; index += 1) {
    const dtSec = frames[index]!.acceptedTimeSec
      - frames[index - 1]!.acceptedTimeSec;
    area += 0.5 * (values[index - 1]! + values[index]!) * dtSec;
  }
  return area;
}

function integratePositivePiecewiseLinear(
  values: readonly number[],
  frames: readonly MainWireScientificObservableFrameV1[],
): number {
  let area = 0;
  for (let index = 1; index < values.length; index += 1) {
    const left = values[index - 1]!;
    const right = values[index]!;
    const dtSec = frames[index]!.acceptedTimeSec
      - frames[index - 1]!.acceptedTimeSec;
    if (left >= 0 && right >= 0) {
      area += 0.5 * (left + right) * dtSec;
      continue;
    }
    if (left <= 0 && right <= 0) continue;

    const crossingFraction = -left / (right - left);
    if (left > 0) {
      area += 0.5 * left * crossingFraction * dtSec;
    } else {
      area += 0.5 * right * (1 - crossingFraction) * dtSec;
    }
  }
  return area;
}

function extrema(values: readonly number[]): Readonly<{
  maximum: number;
  minimum: number;
  excursion: number;
}> {
  let maximum = -Infinity;
  let minimum = Infinity;
  for (const value of values) {
    if (value > maximum) maximum = value;
    if (value < minimum) minimum = value;
  }
  return Object.freeze({ maximum, minimum, excursion: maximum - minimum });
}

function availableMetric(
  metricId: MainWireScientificDerivedMetricIdV1,
  value: number,
): MainWireScientificDerivedMetricValueV1 {
  return Object.freeze({
    metricId,
    value,
    availability: "available" as const,
    quality: "accepted-derived" as const,
    unavailableReason: null,
    unavailableDependency: null,
  });
}

function unavailableMetric(
  metricId: MainWireScientificDerivedMetricIdV1,
  availability: Exclude<ScientificObservableAvailabilityV1, "available">,
  unavailableReason: MainWireScientificDerivedMetricUnavailableReasonV1,
  unavailableDependency: MainWireScientificObservableIdV1 | null,
): MainWireScientificDerivedMetricValueV1 {
  return Object.freeze({
    metricId,
    value: null,
    availability,
    quality: "not-assessed" as const,
    unavailableReason,
    unavailableDependency,
  });
}

function unavailableValuesForCycle(): Readonly<Record<
  MainWireScientificDerivedMetricIdV1,
  MainWireScientificDerivedMetricValueV1
>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(({ metricId }) => [
      metricId,
      unavailableMetric(
        metricId,
        "not-converged",
        "validated-complete-cycle-required",
        null,
      ),
    ]),
  )) as Readonly<Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >>;
}

function evaluation(
  cycleAvailability: "validated" | "unavailable",
  cycleUnavailableReason: string | null,
  cycle: MainWireScientificValidatedTerminalCycleV1 | null,
  values: Readonly<Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >>,
): MainWireScientificDerivedMetricEvaluationV1 {
  const first = cycle?.frames[0] ?? null;
  const last = cycle?.frames.at(-1) ?? null;
  return Object.freeze({
    registryId: MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION,
    derivationVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
    inputCycleContractId:
      MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID,
    cycleAvailability,
    cycleUnavailableReason,
    releaseRef: cycle === null ? null : Object.freeze({ ...cycle.releaseRef }),
    firstRevision: first?.revision ?? null,
    finalRevision: last?.revision ?? null,
    firstAcceptedTimeSec: first?.acceptedTimeSec ?? null,
    finalAcceptedTimeSec: last?.acceptedTimeSec ?? null,
    durationSec: cycle?.durationSec ?? null,
    values,
  });
}

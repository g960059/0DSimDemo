import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
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
export const MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID =
  "main-wire-scientific-complete-transient-beat-v1" as const;

const TERMINAL_CYCLE_SAMPLE_COUNT_V1 = 501;
const TERMINAL_CYCLE_DURATION_SEC_V1 = 1;
const TERMINAL_CYCLE_DT_SEC_V1 = 0.002;
const TIME_TOLERANCE_SEC_V1 = 1e-10;
const ACCEPTED_STEP_READBACK_OBSERVABLE_IDS_V1 = new Set<
  MainWireScientificObservableIdV1
>(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1
  .filter(({ sourceKind }) => sourceKind === "accepted-step-readback")
  .map(({ observableId }) => observableId));

export type MainWireScientificDerivedMetricUnitV1 =
  | "mmHg"
  | "mL"
  | "%"
  | "L/min";

export type MainWireScientificDerivedMetricQuantityKindV1 =
  | "time-weighted-mean-pressure"
  | "cycle-maximum-pressure"
  | "cycle-minimum-pressure"
  | "pressure-excursion"
  | "end-diastolic-volume"
  | "end-systolic-volume"
  | "volume-excursion"
  | "ejection-fraction"
  | "forward-cycle-volume"
  | "reverse-cycle-volume"
  | "net-cycle-volume"
  | "same-valve-regurgitant-fraction"
  | "net-cardiac-output"
  | "forward-flow-peak-gradient"
  | "forward-flow-time-mean-gradient";

export type MainWireScientificMetricDerivationIdV1 =
  | "trapezoidal-time-weighted-mean-v1"
  | "cycle-sample-maximum-v1"
  | "cycle-sample-minimum-v1"
  | "cycle-extrema-excursion-v1"
  | "cycle-extrema-ejection-fraction-v1"
  | "piecewise-linear-positive-flow-integral-v1"
  | "piecewise-linear-negative-flow-magnitude-integral-v1"
  | "trapezoidal-net-flow-integral-v1"
  | "same-valve-reverse-over-forward-percent-v1"
  | "trapezoidal-net-flow-output-v1"
  | "positive-flow-gated-peak-pressure-gradient-v1"
  | "positive-flow-time-weighted-pressure-gradient-v1";

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
    "hemodynamics.pressure.mean.PVein",
    "time-weighted-mean-pressure",
    "mmHg",
    "trapezoidal-time-weighted-mean-v1",
    ["hemodynamics.pressure.absolute.PVein"],
    "Time-weighted mean absolute pulmonary-venous pressure over one validated cycle; this is not labeled as pulmonary-capillary wedge pressure.",
  ),
  definition(
    "hemodynamics.pressure.systolic.Ao",
    "cycle-maximum-pressure",
    "mmHg",
    "cycle-sample-maximum-v1",
    ["hemodynamics.pressure.absolute.Ao"],
    "Maximum sampled absolute aortic pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.diastolic.Ao",
    "cycle-minimum-pressure",
    "mmHg",
    "cycle-sample-minimum-v1",
    ["hemodynamics.pressure.absolute.Ao"],
    "Minimum sampled absolute aortic pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.pulse.Ao",
    "pressure-excursion",
    "mmHg",
    "cycle-extrema-excursion-v1",
    ["hemodynamics.pressure.absolute.Ao"],
    "Maximum minus minimum sampled absolute aortic pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.systolic.PA",
    "cycle-maximum-pressure",
    "mmHg",
    "cycle-sample-maximum-v1",
    ["hemodynamics.pressure.absolute.PA"],
    "Maximum sampled absolute pulmonary-artery pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.pressure.diastolic.PA",
    "cycle-minimum-pressure",
    "mmHg",
    "cycle-sample-minimum-v1",
    ["hemodynamics.pressure.absolute.PA"],
    "Minimum sampled absolute pulmonary-artery pressure over one validated cycle.",
  ),
  definition(
    "hemodynamics.volume.end_diastolic.LV",
    "end-diastolic-volume",
    "mL",
    "cycle-sample-maximum-v1",
    ["hemodynamics.volume.LV"],
    "Maximum sampled left-ventricular volume over one validated cycle.",
  ),
  definition(
    "hemodynamics.volume.end_systolic.LV",
    "end-systolic-volume",
    "mL",
    "cycle-sample-minimum-v1",
    ["hemodynamics.volume.LV"],
    "Minimum sampled left-ventricular volume over one validated cycle.",
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
    "hemodynamics.volume.end_diastolic.RV",
    "end-diastolic-volume",
    "mL",
    "cycle-sample-maximum-v1",
    ["hemodynamics.volume.RV"],
    "Maximum sampled right-ventricular volume over one validated cycle.",
  ),
  definition(
    "hemodynamics.volume.end_systolic.RV",
    "end-systolic-volume",
    "mL",
    "cycle-sample-minimum-v1",
    ["hemodynamics.volume.RV"],
    "Minimum sampled right-ventricular volume over one validated cycle.",
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
    "valve.AoV.cycle_volume.reverse",
    "reverse-cycle-volume",
    "mL",
    "piecewise-linear-negative-flow-magnitude-integral-v1",
    ["valve.AoV.flow"],
    "Magnitude of the negative part of aortic-valve flow integrated over one validated cycle.",
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
    "valve.AoV.cardiac_output.net",
    "net-cardiac-output",
    "L/min",
    "trapezoidal-net-flow-output-v1",
    ["valve.AoV.flow"],
    "Aortic signed cycle volume divided by cycle duration and converted to litres per minute.",
  ),
  definition(
    "valve.AoV.regurgitant_fraction",
    "same-valve-regurgitant-fraction",
    "%",
    "same-valve-reverse-over-forward-percent-v1",
    ["valve.AoV.flow"],
    "One hundred times aortic reverse cycle volume divided by same-valve forward cycle volume.",
  ),
  valveGradientDefinition("AoV", "LV", "Ao", "peak"),
  valveGradientDefinition("AoV", "LV", "Ao", "mean"),
  ...valveVolumeDefinitions("MV", "LA", "LV"),
  ...valveVolumeDefinitions("TV", "RA", "RV"),
  definition(
    "valve.PV.cycle_volume.forward",
    "forward-cycle-volume",
    "mL",
    "piecewise-linear-positive-flow-integral-v1",
    ["valve.PV.flow"],
    "Integral of the positive part of pulmonary-valve flow over one validated cycle.",
  ),
  definition(
    "valve.PV.cycle_volume.reverse",
    "reverse-cycle-volume",
    "mL",
    "piecewise-linear-negative-flow-magnitude-integral-v1",
    ["valve.PV.flow"],
    "Magnitude of the negative part of pulmonary-valve flow integrated over one validated cycle.",
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
    "valve.PV.cardiac_output.net",
    "net-cardiac-output",
    "L/min",
    "trapezoidal-net-flow-output-v1",
    ["valve.PV.flow"],
    "Pulmonary signed cycle volume divided by cycle duration and converted to litres per minute.",
  ),
  definition(
    "valve.PV.regurgitant_fraction",
    "same-valve-regurgitant-fraction",
    "%",
    "same-valve-reverse-over-forward-percent-v1",
    ["valve.PV.flow"],
    "One hundred times pulmonary reverse cycle volume divided by same-valve forward cycle volume.",
  ),
  valveGradientDefinition("PV", "RV", "PA", "peak"),
  valveGradientDefinition("PV", "RV", "PA", "mean"),
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
  /** True only when an unevaluated exact-restore boundary was closed with the
   * measured same-phase final sample of the validated periodic cycle. */
  periodicBoundaryCompletionApplied: boolean;
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
    periodicOrbitClassifiedP1: true;
    smoothingOrInterpolationApplied: false;
  }>;
}>;

/**
 * A fully measured one-second beat from an accepted transient trajectory.
 * Unlike a validated terminal cycle, this contract makes no periodic-orbit
 * claim and never completes an unevaluated restore boundary from the final
 * sample. Every frame, including both integration boundaries, must be an
 * accepted-step observation.
 */
export type MainWireScientificCompleteTransientBeatV1 = Readonly<{
  frames: readonly MainWireScientificObservableFrameV1[];
  releaseRef: SimulationReleaseRef;
  durationSec: number;
  evidence: Readonly<{
    exactReleaseRefUniform: true;
    revisionsContiguous: true;
    cadenceUniform: true;
    bothBeatBoundariesMeasured: true;
    transientBeatFullyMeasured: true;
    smoothingOrInterpolationApplied: false;
  }>;
}>;

export type MainWireScientificMetricCycleV1 =
  | MainWireScientificValidatedTerminalCycleV1
  | MainWireScientificCompleteTransientBeatV1;

export type MainWireScientificDerivedMetricEvaluationV1 = Readonly<{
  registryId: typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID;
  schemaVersion:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION;
  derivationVersion:
    typeof MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1;
  inputCycleContractId:
    | typeof MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID
    | typeof MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID;
  cycleAvailability: "validated" | "provisional" | "unavailable";
  cycleInterpretation:
    | "validated-periodic-P1"
    | "provisional-complete-transient-beat"
    | null;
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
      reverseFlow:
        "magnitude-of-negative-part-with-exact-zero-crossing" as const,
      cardiacOutput: "cycle-volume-over-duration-times-0.06-L-min-per-mL-s" as const,
      regurgitantFraction:
        "same-valve-reverse-volume-over-forward-volume-percent" as const,
      invasiveValveGradient:
        "upstream-minus-downstream-pressure-while-forward-flow-positive" as const,
    }),
    periodicBoundaryCompletionPolicy: Object.freeze({
      appliesOnlyWhen:
        "validated-P1-cycle-first-frame-is-exact-checkpoint-restore-and-only-that-accepted-step-readback-is-not-evaluated" as const,
      replacement:
        "measured-final-accepted-same-phase-sample-from-the-same-validated-cycle" as const,
      interpolationOrSmoothingApplied: false as const,
    }),
    transientBeatPolicy: Object.freeze({
      inputCycleContractId:
        MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID,
      cadence: "501 accepted-step frames spanning one measured second" as const,
      periodicOrbitClaimed: false as const,
      boundaryCompletionApplied: false as const,
      displaySemantics:
        "provisional-last-complete-beat-during-live-transition" as const,
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
      null,
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

  return evaluation(
    "validated",
    "validated-periodic-P1",
    null,
    cycle,
    Object.freeze(values),
  );
}

/**
 * Derives provisional metrics from the last fully measured transient beat.
 * Callers should retain the previous complete beat while a new beat is still
 * open; this function deliberately rejects partial or sliding windows.
 */
export function deriveMainWireScientificTransientBeatMetricsV1(
  beat: MainWireScientificCompleteTransientBeatV1 | null | undefined,
): MainWireScientificDerivedMetricEvaluationV1 {
  const beatIssue = completeTransientBeatIssue(beat);
  if (beat === null || beat === undefined || beatIssue !== null) {
    return evaluation(
      "unavailable",
      null,
      beatIssue ?? "complete transient beat was not supplied",
      null,
      unavailableValuesForCycle(),
      MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID,
    );
  }
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map((entry) => [
      entry.metricId,
      deriveMetric(entry, beat.frames, beat.durationSec),
    ]),
  ) as Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >;
  return evaluation(
    "provisional",
    "provisional-complete-transient-beat",
    null,
    beat,
    Object.freeze(values),
    MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID,
  );
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

type MainWireScientificValveIdV1 = "MV" | "AoV" | "TV" | "PV";
type MainWireScientificPressureNodeIdV1 =
  | "LA" | "LV" | "RA" | "RV" | "Ao" | "PA";

function valveVolumeDefinitions<
  TValve extends MainWireScientificValveIdV1,
  TUpstream extends MainWireScientificPressureNodeIdV1,
  TDownstream extends MainWireScientificPressureNodeIdV1,
>(
  valveId: TValve,
  upstreamNodeId: TUpstream,
  downstreamNodeId: TDownstream,
) {
  const flowId = `valve.${valveId}.flow` as MainWireScientificObservableIdV1;
  return [
    definition(
      `valve.${valveId}.cycle_volume.forward`,
      "forward-cycle-volume",
      "mL",
      "piecewise-linear-positive-flow-integral-v1",
      [flowId],
      `Integral of the positive part of ${valveId} flow over one validated cycle.`,
    ),
    definition(
      `valve.${valveId}.cycle_volume.reverse`,
      "reverse-cycle-volume",
      "mL",
      "piecewise-linear-negative-flow-magnitude-integral-v1",
      [flowId],
      `Magnitude of the negative part of ${valveId} flow integrated over one validated cycle.`,
    ),
    definition(
      `valve.${valveId}.cycle_volume.net`,
      "net-cycle-volume",
      "mL",
      "trapezoidal-net-flow-integral-v1",
      [flowId],
      `Signed integral of ${valveId} flow over one validated cycle.`,
    ),
    definition(
      `valve.${valveId}.regurgitant_fraction`,
      "same-valve-regurgitant-fraction",
      "%",
      "same-valve-reverse-over-forward-percent-v1",
      [flowId],
      `One hundred times ${valveId} reverse cycle volume divided by same-valve forward cycle volume.`,
    ),
    valveGradientDefinition(
      valveId,
      upstreamNodeId,
      downstreamNodeId,
      "peak",
    ),
    valveGradientDefinition(
      valveId,
      upstreamNodeId,
      downstreamNodeId,
      "mean",
    ),
  ] as const;
}

function valveGradientDefinition<
  TValve extends MainWireScientificValveIdV1,
  TUpstream extends MainWireScientificPressureNodeIdV1,
  TDownstream extends MainWireScientificPressureNodeIdV1,
>(
  valveId: TValve,
  upstreamNodeId: TUpstream,
  downstreamNodeId: TDownstream,
  statistic: "peak" | "mean",
) {
  const quantityKind = statistic === "peak"
    ? "forward-flow-peak-gradient" as const
    : "forward-flow-time-mean-gradient" as const;
  const derivationId = statistic === "peak"
    ? "positive-flow-gated-peak-pressure-gradient-v1" as const
    : "positive-flow-time-weighted-pressure-gradient-v1" as const;
  return definition(
    `valve.${valveId}.gradient.forward_${statistic}`,
    quantityKind,
    "mmHg",
    derivationId,
    [
      `valve.${valveId}.flow`,
      `hemodynamics.pressure.absolute.${upstreamNodeId}`,
      `hemodynamics.pressure.absolute.${downstreamNodeId}`,
    ] as readonly MainWireScientificObservableIdV1[],
    statistic === "peak"
      ? `Maximum instantaneous invasive upstream-minus-downstream ${valveId} pressure gradient while forward flow is positive; this is not a peak-to-peak gradient.`
      : `Time-weighted mean invasive upstream-minus-downstream ${valveId} pressure gradient while forward flow is positive.`,
  );
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
    || cycle.evidence.periodicOrbitClassifiedP1 !== true
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

function completeTransientBeatIssue(
  beat: MainWireScientificCompleteTransientBeatV1 | null | undefined,
): string | null {
  if (beat === null || beat === undefined) {
    return "complete transient beat was not supplied";
  }
  if (
    beat.evidence.exactReleaseRefUniform !== true
    || beat.evidence.revisionsContiguous !== true
    || beat.evidence.cadenceUniform !== true
    || beat.evidence.bothBeatBoundariesMeasured !== true
    || beat.evidence.transientBeatFullyMeasured !== true
    || beat.evidence.smoothingOrInterpolationApplied !== false
  ) {
    return "complete transient-beat evidence is incomplete";
  }
  if (beat.frames.length !== TERMINAL_CYCLE_SAMPLE_COUNT_V1) {
    return `expected ${TERMINAL_CYCLE_SAMPLE_COUNT_V1} transient-beat frames`;
  }
  if (
    !Number.isFinite(beat.durationSec)
    || Math.abs(beat.durationSec - TERMINAL_CYCLE_DURATION_SEC_V1)
      > TIME_TOLERANCE_SEC_V1
  ) {
    return "transient-beat duration is not one second";
  }

  const first = beat.frames[0]!;
  if (!validFrameEnvelope(first) || first.source !== "accepted-step") {
    return "first transient-beat frame is not an accepted-step observation";
  }
  if (!sameSimulationReleaseRef(beat.releaseRef, first.releaseRef)) {
    return "transient beat release does not match its first frame";
  }
  for (let index = 1; index < beat.frames.length; index += 1) {
    const previous = beat.frames[index - 1]!;
    const current = beat.frames[index]!;
    if (!validFrameEnvelope(current) || current.source !== "accepted-step") {
      return `transient-beat frame ${index} is not an accepted-step observation`;
    }
    if (!sameSimulationReleaseRef(first.releaseRef, current.releaseRef)) {
      return `transient-beat frame ${index} has a different release`;
    }
    if (current.revision !== previous.revision + 1) {
      return `transient-beat frame ${index} is not revision-contiguous`;
    }
    const dtSec = current.acceptedTimeSec - previous.acceptedTimeSec;
    if (
      !Number.isFinite(dtSec)
      || Math.abs(dtSec - TERMINAL_CYCLE_DT_SEC_V1)
        > TIME_TOLERANCE_SEC_V1
    ) {
      return `transient-beat frame ${index} does not preserve 2 ms cadence`;
    }
  }
  const last = beat.frames.at(-1)!;
  if (
    Math.abs(last.acceptedTimeSec - first.acceptedTimeSec - beat.durationSec)
      > TIME_TOLERANCE_SEC_V1
  ) {
    return "transient-beat frame span does not match beat duration";
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
  const dependencySeriesList: AvailableDependencySeries[] = [];
  for (const dependency of definitionEntry.dependencies) {
    const series = dependencySeries(frames, dependency);
    if (series.available === false) {
      return unavailableMetric(
        definitionEntry.metricId,
        series.availability,
        series.reason,
        dependency,
      );
    }
    dependencySeriesList.push(series);
  }
  const dependency = definitionEntry.dependencies[0]!;
  const series = dependencySeriesList[0]!;
  const periodicBoundaryCompletionApplied = dependencySeriesList.some(
    (dependencySeriesEntry) =>
      dependencySeriesEntry.periodicBoundaryCompletionApplied,
  );

  let value: number;
  switch (definitionEntry.quantityKind) {
    case "time-weighted-mean-pressure":
      value = integrateTrapezoidal(series.values, frames) / durationSec;
      break;
    case "cycle-maximum-pressure":
    case "end-diastolic-volume":
      value = extrema(series.values).maximum;
      break;
    case "cycle-minimum-pressure":
    case "end-systolic-volume":
      value = extrema(series.values).minimum;
      break;
    case "pressure-excursion":
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
    case "reverse-cycle-volume":
      value = integrateNegativeMagnitudePiecewiseLinear(series.values, frames);
      break;
    case "net-cycle-volume":
      value = integrateTrapezoidal(series.values, frames);
      break;
    case "net-cardiac-output":
      value = integrateTrapezoidal(series.values, frames)
        / durationSec * 0.06;
      break;
    case "same-valve-regurgitant-fraction": {
      const forwardVolumeMl = integratePositivePiecewiseLinear(
        series.values,
        frames,
      );
      if (!(forwardVolumeMl > 1e-12)) {
        return unavailableMetric(
          definitionEntry.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependency,
        );
      }
      value = 100 * integrateNegativeMagnitudePiecewiseLinear(
        series.values,
        frames,
      ) / forwardVolumeMl;
      break;
    }
    case "forward-flow-peak-gradient":
    case "forward-flow-time-mean-gradient": {
      const upstream = dependencySeriesList[1];
      const downstream = dependencySeriesList[2];
      if (upstream === undefined || downstream === undefined) {
        return unavailableMetric(
          definitionEntry.metricId,
          "not-evaluated-at-accepted-state",
          "dependency-contract-invalid",
          dependency,
        );
      }
      const gradient = upstream.values.map(
        (upstreamPressure, index) =>
          upstreamPressure - downstream.values[index]!,
      );
      const gated = summarizeValueWhileGatePositive(
        series.values,
        gradient,
        frames,
      );
      if (!(gated.durationSec > 1e-12)) {
        return unavailableMetric(
          definitionEntry.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependency,
        );
      }
      value = definitionEntry.quantityKind === "forward-flow-peak-gradient"
        ? gated.peakValue
        : gated.timeIntegral / gated.durationSec;
      break;
    }
  }

  if (!Number.isFinite(value)) {
    return unavailableMetric(
      definitionEntry.metricId,
      "not-evaluated-at-accepted-state",
      "derived-value-non-finite",
      dependency,
    );
  }
  return availableMetric(
    definitionEntry.metricId,
    value,
    periodicBoundaryCompletionApplied,
  );
}

type AvailableDependencySeries = Readonly<{
  available: true;
  values: readonly number[];
  periodicBoundaryCompletionApplied: boolean;
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
  let periodicBoundaryCompletionApplied = false;
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
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
      const terminalSample = frames.at(-1)?.values[observableId];
      if (
        index === 0
        && frame.source === "exact-checkpoint-restore"
        && ACCEPTED_STEP_READBACK_OBSERVABLE_IDS_V1.has(observableId)
        && sample.availability === "not-evaluated-at-accepted-state"
        && terminalSample?.observableId === observableId
        && terminalSample.availability === "available"
        && terminalSample.value !== null
        && Number.isFinite(terminalSample.value)
        && terminalSample.quality !== "not-assessed"
      ) {
        values.push(terminalSample.value);
        periodicBoundaryCompletionApplied = true;
        continue;
      }
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
    periodicBoundaryCompletionApplied,
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

function integrateNegativeMagnitudePiecewiseLinear(
  values: readonly number[],
  frames: readonly MainWireScientificObservableFrameV1[],
): number {
  return integratePositivePiecewiseLinear(
    values.map((value) => -value),
    frames,
  );
}

function summarizeValueWhileGatePositive(
  gateValues: readonly number[],
  sampledValues: readonly number[],
  frames: readonly MainWireScientificObservableFrameV1[],
): Readonly<{
  durationSec: number;
  timeIntegral: number;
  peakValue: number;
}> {
  let durationSec = 0;
  let timeIntegral = 0;
  let peakValue = -Infinity;
  for (let index = 1; index < gateValues.length; index += 1) {
    const leftGate = gateValues[index - 1]!;
    const rightGate = gateValues[index]!;
    if (leftGate <= 0 && rightGate <= 0) continue;

    let activeStart = 0;
    let activeEnd = 1;
    if (leftGate <= 0) {
      activeStart = -leftGate / (rightGate - leftGate);
    } else if (rightGate <= 0) {
      activeEnd = -leftGate / (rightGate - leftGate);
    }
    const intervalFraction = activeEnd - activeStart;
    if (!(intervalFraction > 0)) continue;

    const leftValue = sampledValues[index - 1]!;
    const rightValue = sampledValues[index]!;
    const valueAtStart = leftValue
      + (rightValue - leftValue) * activeStart;
    const valueAtEnd = leftValue
      + (rightValue - leftValue) * activeEnd;
    const intervalSec = frames[index]!.acceptedTimeSec
      - frames[index - 1]!.acceptedTimeSec;
    const activeDurationSec = intervalSec * intervalFraction;
    durationSec += activeDurationSec;
    timeIntegral += 0.5 * (valueAtStart + valueAtEnd) * activeDurationSec;
    peakValue = Math.max(peakValue, valueAtStart, valueAtEnd);
  }
  return Object.freeze({ durationSec, timeIntegral, peakValue });
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
  periodicBoundaryCompletionApplied: boolean,
): MainWireScientificDerivedMetricValueV1 {
  return Object.freeze({
    metricId,
    value,
    availability: "available" as const,
    quality: "accepted-derived" as const,
    unavailableReason: null,
    unavailableDependency: null,
    periodicBoundaryCompletionApplied,
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
    periodicBoundaryCompletionApplied: false,
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
  cycleAvailability: "validated" | "provisional" | "unavailable",
  cycleInterpretation:
    | "validated-periodic-P1"
    | "provisional-complete-transient-beat"
    | null,
  cycleUnavailableReason: string | null,
  cycle: MainWireScientificMetricCycleV1 | null,
  values: Readonly<Record<
    MainWireScientificDerivedMetricIdV1,
    MainWireScientificDerivedMetricValueV1
  >>,
  inputCycleContractId:
    | typeof MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID
    | typeof MAIN_WIRE_SCIENTIFIC_COMPLETE_TRANSIENT_BEAT_V1_ID =
      MAIN_WIRE_SCIENTIFIC_VALIDATED_TERMINAL_CYCLE_V1_ID,
): MainWireScientificDerivedMetricEvaluationV1 {
  const first = cycle?.frames[0] ?? null;
  const last = cycle?.frames.at(-1) ?? null;
  return Object.freeze({
    registryId: MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_SCHEMA_VERSION,
    derivationVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
    inputCycleContractId,
    cycleAvailability,
    cycleInterpretation,
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

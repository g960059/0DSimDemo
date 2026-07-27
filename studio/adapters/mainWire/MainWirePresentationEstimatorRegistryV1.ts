import {
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID,
  type MainWireScientificDerivedMetricDefinitionV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import {
  RUNTIME_PRESENTATION_COVERAGE_V1,
  RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1,
  RUNTIME_PRESENTATION_DT_SEC_V1,
  RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
  runtimePresentationCanonicalPhaseV1,
  type RuntimePresentationBeatEstimateV1,
  type RuntimePresentationMetricEstimateValueV1,
  type RuntimePresentationSampleV1,
} from "@/studio/contracts/v1";

const BEAT_DURATION_TOLERANCE_SEC_V1 = 1e-10;

export const MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_V1_ID =
  "main-wire-presentation-estimator-registry-v1" as const;

export const MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_SNAPSHOT_V1 =
  Object.freeze({
    registryId: MAIN_WIRE_PRESENTATION_ESTIMATOR_REGISTRY_V1_ID,
    schemaVersion: 1 as const,
    coverage: RUNTIME_PRESENTATION_COVERAGE_V1,
    beatBoundary: "canonical-phase-0-to-next-canonical-phase-0" as const,
    formulaCatalogId:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_REGISTRY_V1_ID,
    formulaDerivationVersion:
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_DERIVATION_VERSION_V1,
    metricIds: Object.freeze(
      MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map(
        ({ metricId }) => metricId,
      ),
    ),
    exactEvaluatorInputProduced: false as const,
    fixedObservationStride: RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
    expectedBoundaryAlignedSampleCount:
      1 + Math.ceil(
        RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1
          / RUNTIME_PRESENTATION_DT_SEC_V1
          / RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
      ),
    characterization: Object.freeze({
      reference:
        "production-kernel-official-healthy-periodic-checkpoint-stride-1" as const,
      purpose: "live-screening-estimate-only" as const,
      supportedQuantityKinds: Object.freeze([
        "time-weighted-mean-pressure",
        "cycle-maximum-pressure",
        "cycle-minimum-pressure",
        "pressure-excursion",
        "end-diastolic-volume",
        "end-systolic-volume",
        "volume-excursion",
        "ejection-fraction",
        "forward-cycle-volume",
        "net-cycle-volume",
        "net-cardiac-output",
      ] as const),
      unavailableQuantityKinds: Object.freeze([
        "reverse-cycle-volume",
        "same-valve-regurgitant-fraction",
        "forward-flow-peak-gradient",
        "forward-flow-time-mean-gradient",
      ] as const),
      supportedMetricRelativeErrorAcceptanceCeilingPercent:
        8 as const,
      generalizedErrorBoundClaimed: false as const,
      valveDiseaseAccuracyClaimed: false as const,
      exactExportEquivalent: false as const,
    }),
  });

export type MainWirePresentationEstimatorInstrumentationV1 = Readonly<{
  onSampleUpdate?(): void;
  onBeatFinalized?(): void;
}>;

export type MainWirePresentationBeatAccumulatorV1 = Readonly<{
  update(sample: RuntimePresentationSampleV1):
    RuntimePresentationBeatEstimateV1 | null;
  getLatestEstimate(): RuntimePresentationBeatEstimateV1 | null;
  getInstrumentationSnapshot(): Readonly<{
    sampleUpdateCount: number;
    beatFinalizationCount: number;
  }>;
}>;

/**
 * Creates one branch-local, constant-space presentation accumulator.
 *
 * A sample updates the accumulator once. A phase-0 endpoint closes the active
 * beat and is retained internally as the next beat's starting boundary without
 * a second update. No observable frame history or exact beat contract is
 * reconstructed.
 */
export function createMainWirePresentationBeatAccumulatorV1(
  instrumentation: MainWirePresentationEstimatorInstrumentationV1 = {},
): MainWirePresentationBeatAccumulatorV1 {
  let active: ActiveBeatV1 | null = null;
  let previousSample: RuntimePresentationSampleV1 | null = null;
  let latestEstimate: RuntimePresentationBeatEstimateV1 | null = null;
  let sampleUpdateCount = 0;
  let beatFinalizationCount = 0;

  const update = (
    sample: RuntimePresentationSampleV1,
  ): RuntimePresentationBeatEstimateV1 | null => {
    assertEstimatorSampleV1(previousSample, sample);
    previousSample = sample;
    sampleUpdateCount += 1;
    instrumentation.onSampleUpdate?.();

    if (active === null) {
      if (isCanonicalBeatBoundaryV1(sample.phase)) {
        active = startBeatV1(sample);
      }
      return null;
    }

    updateBeatV1(active, sample);
    if (!isCanonicalBeatBoundaryV1(sample.phase)) return null;

    const durationSec = sample.acceptedTimeSec
      - active.start.acceptedTimeSec;
    if (
      Math.abs(
        durationSec - RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1,
      ) > BEAT_DURATION_TOLERANCE_SEC_V1
    ) {
      // A malformed or out-of-domain boundary cannot support an estimate.
      // Seed a fresh boundary and wait for the next complete canonical beat.
      active = startBeatV1(sample);
      return null;
    }

    latestEstimate = finalizeBeatV1(active, sample, durationSec);
    beatFinalizationCount += 1;
    instrumentation.onBeatFinalized?.();
    active = startBeatV1(sample);
    return latestEstimate;
  };

  return Object.freeze({
    update,
    getLatestEstimate: () => latestEstimate,
    getInstrumentationSnapshot: () => Object.freeze({
      sampleUpdateCount,
      beatFinalizationCount,
    }),
  });
}

type DependencyAggregateV1 = {
  available: boolean;
  latestValue: number;
  minimum: number;
  maximum: number;
  trapezoidalIntegral: number;
  positiveIntegral: number;
  negativeMagnitudeIntegral: number;
};

type GatedGradientAggregateV1 = {
  available: boolean;
  durationSec: number;
  timeIntegral: number;
  peakValue: number;
};

type ActiveBeatV1 = {
  start: RuntimePresentationSampleV1;
  previous: RuntimePresentationSampleV1;
  retainedSampleCount: number;
  dependencies: Map<MainWireScientificObservableIdV1, DependencyAggregateV1>;
  gatedGradients: Map<string, GatedGradientAggregateV1>;
};

const DEPENDENCY_IDS_V1 = Object.freeze([
  ...new Set(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.flatMap(
      ({ dependencies }) => dependencies,
    ),
  ),
]);

const GATED_GRADIENT_DEFINITIONS_V1 =
  MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.filter(({ quantityKind }) =>
    quantityKind === "forward-flow-peak-gradient"
    || quantityKind === "forward-flow-time-mean-gradient"
  );

function startBeatV1(sample: RuntimePresentationSampleV1): ActiveBeatV1 {
  const dependencies = new Map<
    MainWireScientificObservableIdV1,
    DependencyAggregateV1
  >();
  for (const dependency of DEPENDENCY_IDS_V1) {
    const value = sample.values[dependency];
    const available = typeof value === "number" && Number.isFinite(value);
    dependencies.set(dependency, {
      available,
      latestValue: available ? value : 0,
      minimum: available ? value : Infinity,
      maximum: available ? value : -Infinity,
      trapezoidalIntegral: 0,
      positiveIntegral: 0,
      negativeMagnitudeIntegral: 0,
    });
  }
  return {
    start: sample,
    previous: sample,
    retainedSampleCount: 1,
    dependencies,
    gatedGradients: new Map(
      GATED_GRADIENT_DEFINITIONS_V1.map(({ metricId }) => [
        metricId,
        {
          available: true,
          durationSec: 0,
          timeIntegral: 0,
          peakValue: -Infinity,
        },
      ]),
    ),
  };
}

function updateBeatV1(
  beat: ActiveBeatV1,
  sample: RuntimePresentationSampleV1,
): void {
  const dtSec = sample.acceptedTimeSec - beat.previous.acceptedTimeSec;
  for (const [dependency, aggregate] of beat.dependencies) {
    const right = sample.values[dependency];
    if (
      !aggregate.available
      || typeof right !== "number"
      || !Number.isFinite(right)
      || !(dtSec > 0)
    ) {
      aggregate.available = false;
      continue;
    }
    const left = aggregate.latestValue;
    aggregate.minimum = Math.min(aggregate.minimum, right);
    aggregate.maximum = Math.max(aggregate.maximum, right);
    aggregate.trapezoidalIntegral += 0.5 * (left + right) * dtSec;
    aggregate.positiveIntegral += positivePiecewiseLinearAreaV1(
      left,
      right,
      dtSec,
    );
    aggregate.negativeMagnitudeIntegral += positivePiecewiseLinearAreaV1(
      -left,
      -right,
      dtSec,
    );
    aggregate.latestValue = right;
  }

  for (const definition of GATED_GRADIENT_DEFINITIONS_V1) {
    const aggregate = beat.gatedGradients.get(definition.metricId)!;
    if (!aggregate.available) continue;
    const [gateId, upstreamId, downstreamId] = definition.dependencies;
    const leftGate = beat.previous.values[gateId!];
    const rightGate = sample.values[gateId!];
    const leftUpstream = beat.previous.values[upstreamId!];
    const rightUpstream = sample.values[upstreamId!];
    const leftDownstream = beat.previous.values[downstreamId!];
    const rightDownstream = sample.values[downstreamId!];
    if (
      !finiteValuesV1([
        leftGate,
        rightGate,
        leftUpstream,
        rightUpstream,
        leftDownstream,
        rightDownstream,
        dtSec,
      ])
      || !(dtSec > 0)
    ) {
      aggregate.available = false;
      continue;
    }
    updateGatedGradientV1(
      aggregate,
      leftGate!,
      rightGate!,
      leftUpstream! - leftDownstream!,
      rightUpstream! - rightDownstream!,
      dtSec,
    );
  }

  beat.previous = sample;
  beat.retainedSampleCount += 1;
}

function finalizeBeatV1(
  beat: ActiveBeatV1,
  end: RuntimePresentationSampleV1,
  durationSec: number,
): RuntimePresentationBeatEstimateV1 {
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_DERIVED_METRIC_CATALOG_V1.map((definition) => [
      definition.metricId,
      finalizeMetricV1(definition, beat, durationSec),
    ]),
  );
  return Object.freeze({
    coverage: RUNTIME_PRESENTATION_COVERAGE_V1,
    startPresentationOrdinal: beat.start.presentationOrdinal,
    endPresentationOrdinal: end.presentationOrdinal,
    startAcceptedRevision: beat.start.acceptedRevision,
    endAcceptedRevision: end.acceptedRevision,
    startAcceptedTimeSec: beat.start.acceptedTimeSec,
    endAcceptedTimeSec: end.acceptedTimeSec,
    durationSec,
    retainedSampleCount: beat.retainedSampleCount,
    values: Object.freeze(values),
    evidence: Object.freeze({
      bothCanonicalBeatBoundariesRetained: true as const,
      transientBeatFullyMeasured: false as const,
      revisionsContiguous: false as const,
      cadenceUniform: false as const,
      exportEquivalent: false as const,
    }),
  });
}

function finalizeMetricV1(
  definition: MainWireScientificDerivedMetricDefinitionV1,
  beat: ActiveBeatV1,
  durationSec: number,
): RuntimePresentationMetricEstimateValueV1 {
  const dependencyId = definition.dependencies[0]!;
  if (
    RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1 > 1
    && (
      definition.quantityKind === "reverse-cycle-volume"
      || definition.quantityKind === "same-valve-regurgitant-fraction"
      || definition.quantityKind === "forward-flow-peak-gradient"
      || definition.quantityKind === "forward-flow-time-mean-gradient"
    )
  ) {
    return unavailableMetricV1(
      definition.metricId,
      "not-measurable",
      "presentation-decimation-unsupported",
      dependencyId,
    );
  }
  const dependency = beat.dependencies.get(dependencyId);
  if (dependency === undefined || !dependency.available) {
    return unavailableMetricV1(
      definition.metricId,
      "not-evaluated-at-accepted-state",
      "dependency-unavailable",
      dependencyId,
    );
  }

  let value: number;
  switch (definition.quantityKind) {
    case "time-weighted-mean-pressure":
      value = dependency.trapezoidalIntegral / durationSec;
      break;
    case "cycle-maximum-pressure":
    case "end-diastolic-volume":
      value = dependency.maximum;
      break;
    case "cycle-minimum-pressure":
    case "end-systolic-volume":
      value = dependency.minimum;
      break;
    case "pressure-excursion":
    case "volume-excursion":
      value = dependency.maximum - dependency.minimum;
      break;
    case "ejection-fraction":
      if (!(dependency.maximum > 0)) {
        return unavailableMetricV1(
          definition.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependencyId,
        );
      }
      value = 100 * (dependency.maximum - dependency.minimum)
        / dependency.maximum;
      break;
    case "forward-cycle-volume":
      value = dependency.positiveIntegral;
      break;
    case "reverse-cycle-volume":
      value = dependency.negativeMagnitudeIntegral;
      break;
    case "net-cycle-volume":
      value = dependency.trapezoidalIntegral;
      break;
    case "net-cardiac-output":
      value = dependency.trapezoidalIntegral / durationSec * 0.06;
      break;
    case "same-valve-regurgitant-fraction":
      if (!(dependency.positiveIntegral > 1e-12)) {
        return unavailableMetricV1(
          definition.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependencyId,
        );
      }
      value = 100 * dependency.negativeMagnitudeIntegral
        / dependency.positiveIntegral;
      break;
    case "forward-flow-peak-gradient":
    case "forward-flow-time-mean-gradient": {
      const gated = beat.gatedGradients.get(definition.metricId);
      if (gated === undefined || !gated.available) {
        return unavailableMetricV1(
          definition.metricId,
          "not-evaluated-at-accepted-state",
          "dependency-unavailable",
          firstUnavailableDependencyV1(definition, beat) ?? dependencyId,
        );
      }
      if (!(gated.durationSec > 1e-12)) {
        return unavailableMetricV1(
          definition.metricId,
          "not-measurable",
          "invalid-derived-denominator",
          dependencyId,
        );
      }
      value = definition.quantityKind === "forward-flow-peak-gradient"
        ? gated.peakValue
        : gated.timeIntegral / gated.durationSec;
      break;
    }
  }
  if (!Number.isFinite(value)) {
    return unavailableMetricV1(
      definition.metricId,
      "not-evaluated-at-accepted-state",
      "derived-value-non-finite",
      dependencyId,
    );
  }
  return Object.freeze({
    metricId: definition.metricId,
    value,
    availability: "available" as const,
    unavailableReason: null,
    unavailableDependency: null,
  });
}

function positivePiecewiseLinearAreaV1(
  left: number,
  right: number,
  dtSec: number,
): number {
  if (left >= 0 && right >= 0) return 0.5 * (left + right) * dtSec;
  if (left <= 0 && right <= 0) return 0;
  const crossingFraction = -left / (right - left);
  return left > 0
    ? 0.5 * left * crossingFraction * dtSec
    : 0.5 * right * (1 - crossingFraction) * dtSec;
}

function updateGatedGradientV1(
  aggregate: GatedGradientAggregateV1,
  leftGate: number,
  rightGate: number,
  leftValue: number,
  rightValue: number,
  dtSec: number,
): void {
  if (leftGate <= 0 && rightGate <= 0) return;
  let activeStart = 0;
  let activeEnd = 1;
  if (leftGate <= 0) {
    activeStart = -leftGate / (rightGate - leftGate);
  } else if (rightGate <= 0) {
    activeEnd = -leftGate / (rightGate - leftGate);
  }
  const intervalFraction = activeEnd - activeStart;
  if (!(intervalFraction > 0)) return;
  const valueAtStart = leftValue + (rightValue - leftValue) * activeStart;
  const valueAtEnd = leftValue + (rightValue - leftValue) * activeEnd;
  const activeDurationSec = dtSec * intervalFraction;
  aggregate.durationSec += activeDurationSec;
  aggregate.timeIntegral +=
    0.5 * (valueAtStart + valueAtEnd) * activeDurationSec;
  aggregate.peakValue = Math.max(
    aggregate.peakValue,
    valueAtStart,
    valueAtEnd,
  );
}

function firstUnavailableDependencyV1(
  definition: MainWireScientificDerivedMetricDefinitionV1,
  beat: ActiveBeatV1,
): MainWireScientificObservableIdV1 | null {
  return definition.dependencies.find((dependency) =>
    beat.dependencies.get(dependency)?.available !== true
  ) ?? null;
}

function unavailableMetricV1(
  metricId: string,
  availability:
    RuntimePresentationMetricEstimateValueV1["availability"],
  unavailableReason: Exclude<
    RuntimePresentationMetricEstimateValueV1["unavailableReason"],
    null
  >,
  unavailableDependency: string,
): RuntimePresentationMetricEstimateValueV1 {
  return Object.freeze({
    metricId,
    value: null,
    availability,
    unavailableReason,
    unavailableDependency,
  });
}

function finiteValuesV1(
  values: readonly (number | undefined)[],
): values is readonly number[] {
  return values.every((value) =>
    typeof value === "number" && Number.isFinite(value)
  );
}

function isCanonicalBeatBoundaryV1(phase: number): boolean {
  return phase === 0;
}

function assertEstimatorSampleV1(
  previous: RuntimePresentationSampleV1 | null,
  sample: RuntimePresentationSampleV1,
): void {
  const expectedPhase = runtimePresentationCanonicalPhaseV1(
    sample.acceptedRevision,
  );
  if (
    sample.coverage !== RUNTIME_PRESENTATION_COVERAGE_V1
    || !Number.isSafeInteger(sample.presentationOrdinal)
    || sample.presentationOrdinal < 0
    || !Number.isSafeInteger(sample.acceptedRevision)
    || sample.acceptedRevision < 0
    || !Number.isFinite(sample.acceptedTimeSec)
    || sample.acceptedTimeSec < 0
    || !Number.isSafeInteger(sample.acceptedStepSpanFromPrevious)
    || sample.acceptedStepSpanFromPrevious < 0
    || !Number.isFinite(sample.phase)
    || sample.phase < 0
    || sample.phase >= 1
    || Math.abs(sample.phase - expectedPhase) > 1e-10
  ) {
    throw new Error("presentation estimator received an invalid sample");
  }
  if (previous === null) {
    if (
      sample.presentationOrdinal !== 0
      || sample.acceptedStepSpanFromPrevious !== 0
      || sample.retentionReason !== "stream-boundary"
    ) {
      throw new Error(
        "presentation estimator must start at a stream-boundary sample",
      );
    }
    return;
  }

  const span = sample.acceptedStepSpanFromPrevious;
  const timeSpanSec = sample.acceptedTimeSec - previous.acceptedTimeSec;
  if (
    sample.presentationOrdinal !== previous.presentationOrdinal + 1
    || span < 1
    || sample.acceptedRevision - previous.acceptedRevision !== span
    || Math.abs(timeSpanSec - span * RUNTIME_PRESENTATION_DT_SEC_V1) > 1e-10
    || (
      sample.phase === 0
        ? sample.retentionReason !== "canonical-beat-boundary"
        : sample.retentionReason !== "observation-stride"
    )
  ) {
    throw new Error(
      "presentation estimator received a discontinuous sample",
    );
  }
  const phaseStep = Math.round(
    previous.phase / RUNTIME_PRESENTATION_DT_SEC_V1,
  );
  const stepsPerBeat = Math.round(
    RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1
      / RUNTIME_PRESENTATION_DT_SEC_V1,
  );
  const stepsToNextBoundary = phaseStep === 0
    ? stepsPerBeat
    : stepsPerBeat - phaseStep;
  if (span > stepsToNextBoundary) {
    throw new Error(
      "presentation estimator received a sample after an omitted beat boundary",
    );
  }
  if (span > RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1) {
    throw new Error(
      "presentation estimator received a span over the fixed observation stride",
    );
  }
}

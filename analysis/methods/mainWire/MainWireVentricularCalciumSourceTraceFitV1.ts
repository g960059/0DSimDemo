import land2017Figure6Trace from
  "@/data/myocardium/source-traces/land2017-figure6-coppini-calcium-trace-v1.json";
import {
  evaluateNormalizedPeriodicBiexponentialCalciumPulseV1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_CLAIM_V1 =
  Object.freeze({
    role: "offline-whole-trace-low-order-source-fit" as const,
    sourceTraceId: land2017Figure6Trace.traceId,
    sourceDoi: land2017Figure6Trace.source.doi,
    sourceFigure: land2017Figure6Trace.source.figure,
    sourceEvidence:
      "Figure-centerline-digitization-not-author-supplied-numeric-trace" as const,
    modelFamily:
      "periodic-normalized-biexponential-with-analytic-alpha-limit" as const,
    fittedNonlinearParameters: Object.freeze([
      "geometric-mean-time-constant",
      "rise-to-decay-log-ratio",
      "source-trace-onset-offset",
    ] as const),
    amplitudePoliciesCharacterized: Object.freeze([
      "source-digitized-extrema-locked",
      "unconstrained-linear-least-squares-sensitivity",
    ] as const),
    preferredAmplitudePolicy:
      "source-digitized-extrema-locked-until-measurement-uncertainty-is-available" as const,
    objective: "unweighted-whole-trace-squared-error" as const,
    optimization:
      "deterministic-bounded-coarse-grid-plus-pattern-refinement" as const,
    sourceMeasurementCovarianceAvailable: false as const,
    smoothingApplied: false as const,
    hemodynamicOutcomeUsed: false as const,
    landTensionOutcomeUsed: false as const,
    electricalToCalciumDelayIdentified: false as const,
    exactModelStateAdded: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitParametersV1 = Readonly<{
  diastolicCalciumUM: number;
  peakAmplitudeUM: number;
  riseTimeConstantSec: number;
  decayTimeConstantSec: number;
  /** Figure time zero precedes the fitted analytic pulse onset by this value. */
  sourceTraceOnsetOffsetSec: number;
}>;

export type MainWireVentricularCalciumSourceTraceApproximationMetricsV1 =
  Readonly<{
    sampleIntervalSec: number;
    sampleCount: number;
    rootMeanSquareErrorUM: number;
    normalizedRootMeanSquareErrorBySourceAmplitude: number;
    maximumAbsoluteErrorUM: number;
    meanErrorUM: number;
    sourceMinimumCalciumUM: number;
    sourceMaximumCalciumUM: number;
    analyticMinimumCalciumUM: number;
    analyticMaximumCalciumUM: number;
    sourceTimeToMaximumSec: number;
    analyticTimeToMaximumSec: number;
    sourceSupraminimumCycleExposureUMSec: number;
    analyticSupradiastolicCycleExposureUMSec: number;
    relativeExposureError: number;
  }>;

export type MainWireVentricularCalciumSourceTraceFitV1 = Readonly<{
  fitId: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_V1_ID;
  source: Readonly<{
    traceId: string;
    sampleIntervalSec: number;
    sampleCount: number;
    cycleLengthSec: number;
    originalNumericTraceUsed: false;
    figureDigitizationUsed: true;
  }>;
  parameters: MainWireVentricularCalciumSourceTraceFitParametersV1;
  shape: ReturnType<typeof measurePeriodicBiexponentialCalciumPulseShapeV1>;
  approximation: MainWireVentricularCalciumSourceTraceApproximationMetricsV1;
  optimization: Readonly<{
    amplitudePolicy:
      | "source-digitized-extrema-locked"
      | "unconstrained-linear-least-squares-sensitivity";
    nonlinearEvaluationCount: number;
    coarseCandidateCount: number;
    refinementIterationCount: number;
    convergedByStepTolerance: boolean;
    nearEqualTimeConstantsCollapsedToExactAlphaLimit: boolean;
    finalSteps: Readonly<{
      logGeometricMeanTimeConstant: number;
      logTimeConstantRatio: number;
      sourceTraceOnsetOffsetSec: number;
    }>;
    bounds: Readonly<{
      minimumRiseTimeConstantSec: number;
      maximumDecayTimeConstantSec: number;
      maximumLogTimeConstantRatio: number;
      sourceTraceOnsetOffsetSec: readonly [number, number];
    }>;
  }>;
  claim: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_CLAIM_V1;
}>;

type NonlinearCoordinates = Readonly<{
  logGeometricMeanTimeConstant: number;
  logTimeConstantRatio: number;
  sourceTraceOnsetOffsetSec: number;
}>;

type Candidate = Readonly<{
  coordinates: NonlinearCoordinates;
  parameters: MainWireVentricularCalciumSourceTraceFitParametersV1;
  squaredError: number;
}>;

type AmplitudePolicy = MainWireVentricularCalciumSourceTraceFitV1[
  "optimization"
]["amplitudePolicy"];

const SAMPLE_INTERVAL_SEC =
  land2017Figure6Trace.digitization.uniformSampleIntervalSec;
const CYCLE_LENGTH_SEC =
  land2017Figure6Trace.digitization.periodicCycleLengthSec;
const SOURCE_SAMPLES_UM = Object.freeze([
  ...land2017Figure6Trace.freeCalciumUM,
]);
const BOUNDS = Object.freeze({
  minimumRiseTimeConstantSec: 0.02,
  maximumDecayTimeConstantSec: 0.4,
  maximumLogTimeConstantRatio: Math.log(8),
  sourceTraceOnsetOffsetSec: Object.freeze([-0.03, 0.05] as const),
});
const COARSE_CENTER_COUNT = 25;
const COARSE_LOG_RATIOS = Object.freeze([
  0,
  0.02,
  0.05,
  0.1,
  0.2,
  0.4,
  0.7,
  1.1,
] as const);
const COARSE_ONSET_OFFSETS_SEC = Object.freeze(
  Array.from({ length: 21 }, (_, index) => -0.01 + index * 0.002),
);
const STEP_TOLERANCES = Object.freeze({
  logGeometricMeanTimeConstant: 1e-10,
  logTimeConstantRatio: 1e-10,
  sourceTraceOnsetOffsetSec: 1e-10,
});

const cachedFits = new Map<AmplitudePolicy,
  MainWireVentricularCalciumSourceTraceFitV1>();

/** Deterministic source-only fit; the cached result has no simulator input. */
export function fitMainWireVentricularCalciumSourceTraceV1():
  MainWireVentricularCalciumSourceTraceFitV1 {
  return fitSourceTraceWithAmplitudePolicy(
    "source-digitized-extrema-locked",
  );
}

export function fitMainWireVentricularCalciumSourceTraceUnconstrainedAmplitudeSensitivityV1():
  MainWireVentricularCalciumSourceTraceFitV1 {
  return fitSourceTraceWithAmplitudePolicy(
    "unconstrained-linear-least-squares-sensitivity",
  );
}

function fitSourceTraceWithAmplitudePolicy(
  amplitudePolicy: AmplitudePolicy,
): MainWireVentricularCalciumSourceTraceFitV1 {
  const cached = cachedFits.get(amplitudePolicy);
  if (cached !== undefined) return cached;
  validateSourceTrace();
  let nonlinearEvaluationCount = 0;
  let best: Candidate | null = null;
  const minimumLogCenter = Math.log(0.04);
  const maximumLogCenter = Math.log(0.26);
  for (let centerIndex = 0; centerIndex < COARSE_CENTER_COUNT; centerIndex += 1) {
    const fraction = centerIndex / (COARSE_CENTER_COUNT - 1);
    const logGeometricMeanTimeConstant = minimumLogCenter
      + fraction * (maximumLogCenter - minimumLogCenter);
    for (const logTimeConstantRatio of COARSE_LOG_RATIOS) {
      for (const sourceTraceOnsetOffsetSec of COARSE_ONSET_OFFSETS_SEC) {
        const candidate = evaluateCandidate({
          logGeometricMeanTimeConstant,
          logTimeConstantRatio,
          sourceTraceOnsetOffsetSec,
        }, amplitudePolicy);
        nonlinearEvaluationCount += 1;
        if (
          candidate !== null
          && (best === null || candidate.squaredError < best.squaredError)
        ) best = candidate;
      }
    }
  }
  if (best === null) throw new Error("source calcium coarse fit found no candidate");

  let steps = {
    logGeometricMeanTimeConstant: 0.08,
    logTimeConstantRatio: 0.04,
    sourceTraceOnsetOffsetSec: 0.001,
  };
  let refinementIterationCount = 0;
  let convergedByStepTolerance = false;
  for (let iteration = 0; iteration < 500; iteration += 1) {
    refinementIterationCount += 1;
    let improved = false;
    for (const coordinate of [
      "logGeometricMeanTimeConstant",
      "logTimeConstantRatio",
      "sourceTraceOnsetOffsetSec",
    ] as const) {
      for (const direction of [-1, 1] as const) {
        const coordinates = {
          ...best.coordinates,
          [coordinate]: best.coordinates[coordinate]
            + direction * steps[coordinate],
        };
        const candidate = evaluateCandidate(coordinates, amplitudePolicy);
        nonlinearEvaluationCount += 1;
        if (candidate !== null && candidate.squaredError < best.squaredError) {
          best = candidate;
          improved = true;
        }
      }
    }
    if (!improved) {
      steps = {
        logGeometricMeanTimeConstant:
          0.5 * steps.logGeometricMeanTimeConstant,
        logTimeConstantRatio: 0.5 * steps.logTimeConstantRatio,
        sourceTraceOnsetOffsetSec:
          0.5 * steps.sourceTraceOnsetOffsetSec,
      };
    }
    if (
      steps.logGeometricMeanTimeConstant
        <= STEP_TOLERANCES.logGeometricMeanTimeConstant
      && steps.logTimeConstantRatio
        <= STEP_TOLERANCES.logTimeConstantRatio
      && steps.sourceTraceOnsetOffsetSec
        <= STEP_TOLERANCES.sourceTraceOnsetOffsetSec
    ) {
      convergedByStepTolerance = true;
      break;
    }
  }
  const preliminaryShape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    CYCLE_LENGTH_SEC,
    best.parameters.riseTimeConstantSec,
    best.parameters.decayTimeConstantSec,
  );
  const nearEqualTimeConstantsCollapsedToExactAlphaLimit =
    preliminaryShape.shapeRegime === "alpha-limit";
  const parameters = nearEqualTimeConstantsCollapsedToExactAlphaLimit
    ? Object.freeze({
      ...best.parameters,
      riseTimeConstantSec: 0.5 * (
        best.parameters.riseTimeConstantSec
        + best.parameters.decayTimeConstantSec
      ),
      decayTimeConstantSec: 0.5 * (
        best.parameters.riseTimeConstantSec
        + best.parameters.decayTimeConstantSec
      ),
    })
    : best.parameters;
  const shape = measurePeriodicBiexponentialCalciumPulseShapeV1(
    CYCLE_LENGTH_SEC,
    parameters.riseTimeConstantSec,
    parameters.decayTimeConstantSec,
  );
  const fit = Object.freeze({
    fitId: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_V1_ID,
    source: Object.freeze({
      traceId: land2017Figure6Trace.traceId,
      sampleIntervalSec: SAMPLE_INTERVAL_SEC,
      sampleCount: SOURCE_SAMPLES_UM.length,
      cycleLengthSec: CYCLE_LENGTH_SEC,
      originalNumericTraceUsed: false as const,
      figureDigitizationUsed: true as const,
    }),
    parameters,
    shape,
    approximation: measureSourceTraceApproximationV1(parameters),
    optimization: Object.freeze({
      amplitudePolicy,
      nonlinearEvaluationCount,
      coarseCandidateCount:
        COARSE_CENTER_COUNT
        * COARSE_LOG_RATIOS.length
        * COARSE_ONSET_OFFSETS_SEC.length,
      refinementIterationCount,
      convergedByStepTolerance,
      nearEqualTimeConstantsCollapsedToExactAlphaLimit,
      finalSteps: Object.freeze({ ...steps }),
      bounds: BOUNDS,
    }),
    claim: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_CLAIM_V1,
  });
  cachedFits.set(amplitudePolicy, fit);
  return fit;
}

export function measureMainWireVentricularCalciumParamsAgainstSourceTraceV1(
  params: FiveWallNormalCalciumDriveParamsV1,
  sourceTraceOnsetOffsetSec = 0,
): MainWireVentricularCalciumSourceTraceApproximationMetricsV1 {
  return measureSourceTraceApproximationV1(Object.freeze({
    diastolicCalciumUM: params.ventricular.diastolicCalciumUM,
    peakAmplitudeUM: params.ventricular.peakAmplitudeUM,
    riseTimeConstantSec: params.ventricular.riseTimeConstantSec,
    decayTimeConstantSec: params.ventricular.decayTimeConstantSec,
    sourceTraceOnsetOffsetSec,
  }));
}

function evaluateCandidate(
  coordinates: NonlinearCoordinates,
  amplitudePolicy: AmplitudePolicy,
): Candidate | null {
  const center = Math.exp(coordinates.logGeometricMeanTimeConstant);
  const logRatio = coordinates.logTimeConstantRatio;
  if (
    !(logRatio >= 0 && logRatio <= BOUNDS.maximumLogTimeConstantRatio)
    || coordinates.sourceTraceOnsetOffsetSec
      < BOUNDS.sourceTraceOnsetOffsetSec[0]
    || coordinates.sourceTraceOnsetOffsetSec
      > BOUNDS.sourceTraceOnsetOffsetSec[1]
  ) return null;
  const riseTimeConstantSec = center * Math.exp(-0.5 * logRatio);
  const decayTimeConstantSec = center * Math.exp(0.5 * logRatio);
  if (
    riseTimeConstantSec < BOUNDS.minimumRiseTimeConstantSec
    || decayTimeConstantSec > BOUNDS.maximumDecayTimeConstantSec
  ) return null;

  let sumX = 0;
  let sumXX = 0;
  let sumY = 0;
  let sumXY = 0;
  const pulses = new Array<number>(SOURCE_SAMPLES_UM.length);
  for (let index = 0; index < SOURCE_SAMPLES_UM.length; index += 1) {
    const sourceTimeSec = index * SAMPLE_INTERVAL_SEC;
    const pulse = evaluateNormalizedPeriodicBiexponentialCalciumPulseV1(
      sourceTimeSec - coordinates.sourceTraceOnsetOffsetSec,
      CYCLE_LENGTH_SEC,
      riseTimeConstantSec,
      decayTimeConstantSec,
    );
    const source = SOURCE_SAMPLES_UM[index]!;
    pulses[index] = pulse;
    sumX += pulse;
    sumXX += pulse * pulse;
    sumY += source;
    sumXY += pulse * source;
  }
  const count = SOURCE_SAMPLES_UM.length;
  const denominator = count * sumXX - sumX * sumX;
  if (!(denominator > 0) || !Number.isFinite(denominator)) return null;
  const sourceMinimum = minimum(SOURCE_SAMPLES_UM);
  const sourceMaximum = maximum(SOURCE_SAMPLES_UM);
  const peakAmplitudeUM = amplitudePolicy
      === "source-digitized-extrema-locked"
    ? sourceMaximum - sourceMinimum
    : (count * sumXY - sumX * sumY) / denominator;
  const diastolicCalciumUM = amplitudePolicy
      === "source-digitized-extrema-locked"
    ? sourceMinimum
    : (sumY - peakAmplitudeUM * sumX) / count;
  if (!(peakAmplitudeUM > 0) || !(diastolicCalciumUM >= 0)) return null;
  let squaredError = 0;
  for (let index = 0; index < count; index += 1) {
    const prediction = diastolicCalciumUM + peakAmplitudeUM * pulses[index]!;
    const error = prediction - SOURCE_SAMPLES_UM[index]!;
    squaredError += error * error;
  }
  if (!Number.isFinite(squaredError)) return null;
  return Object.freeze({
    coordinates: Object.freeze({ ...coordinates }),
    parameters: Object.freeze({
      diastolicCalciumUM,
      peakAmplitudeUM,
      riseTimeConstantSec,
      decayTimeConstantSec,
      sourceTraceOnsetOffsetSec: coordinates.sourceTraceOnsetOffsetSec,
    }),
    squaredError,
  });
}

function measureSourceTraceApproximationV1(
  parameters: MainWireVentricularCalciumSourceTraceFitParametersV1,
): MainWireVentricularCalciumSourceTraceApproximationMetricsV1 {
  let squaredErrorSum = 0;
  let maximumAbsoluteErrorUM = 0;
  let errorSum = 0;
  let sourceExposure = 0;
  let analyticExposure = 0;
  let analyticMinimum = Number.POSITIVE_INFINITY;
  let analyticMaximum = Number.NEGATIVE_INFINITY;
  let analyticMaximumIndex = 0;
  const sourceMinimum = minimum(SOURCE_SAMPLES_UM);
  const sourceMaximum = maximum(SOURCE_SAMPLES_UM);
  for (let index = 0; index < SOURCE_SAMPLES_UM.length; index += 1) {
    const sourceTimeSec = index * SAMPLE_INTERVAL_SEC;
    const analytic = parameters.diastolicCalciumUM
      + parameters.peakAmplitudeUM
        * evaluateNormalizedPeriodicBiexponentialCalciumPulseV1(
          sourceTimeSec - parameters.sourceTraceOnsetOffsetSec,
          CYCLE_LENGTH_SEC,
          parameters.riseTimeConstantSec,
          parameters.decayTimeConstantSec,
        );
    const source = SOURCE_SAMPLES_UM[index]!;
    const error = analytic - source;
    squaredErrorSum += error * error;
    errorSum += error;
    maximumAbsoluteErrorUM = Math.max(maximumAbsoluteErrorUM, Math.abs(error));
    sourceExposure += Math.max(0, source - sourceMinimum) * SAMPLE_INTERVAL_SEC;
    analyticExposure += Math.max(
      0,
      analytic - parameters.diastolicCalciumUM,
    ) * SAMPLE_INTERVAL_SEC;
    analyticMinimum = Math.min(analyticMinimum, analytic);
    if (analytic > analyticMaximum) {
      analyticMaximum = analytic;
      analyticMaximumIndex = index;
    }
  }
  const rootMeanSquareErrorUM = Math.sqrt(
    squaredErrorSum / SOURCE_SAMPLES_UM.length,
  );
  return Object.freeze({
    sampleIntervalSec: SAMPLE_INTERVAL_SEC,
    sampleCount: SOURCE_SAMPLES_UM.length,
    rootMeanSquareErrorUM,
    normalizedRootMeanSquareErrorBySourceAmplitude:
      rootMeanSquareErrorUM / (sourceMaximum - sourceMinimum),
    maximumAbsoluteErrorUM,
    meanErrorUM: errorSum / SOURCE_SAMPLES_UM.length,
    sourceMinimumCalciumUM: sourceMinimum,
    sourceMaximumCalciumUM: sourceMaximum,
    analyticMinimumCalciumUM: analyticMinimum,
    analyticMaximumCalciumUM: analyticMaximum,
    sourceTimeToMaximumSec:
      SOURCE_SAMPLES_UM.indexOf(sourceMaximum) * SAMPLE_INTERVAL_SEC,
    analyticTimeToMaximumSec: analyticMaximumIndex * SAMPLE_INTERVAL_SEC,
    sourceSupraminimumCycleExposureUMSec: sourceExposure,
    analyticSupradiastolicCycleExposureUMSec: analyticExposure,
    relativeExposureError: analyticExposure / sourceExposure - 1,
  });
}

function validateSourceTrace(): void {
  if (
    land2017Figure6Trace.schemaVersion !== 1
    || SAMPLE_INTERVAL_SEC !== 0.001
    || CYCLE_LENGTH_SEC !== 1
    || SOURCE_SAMPLES_UM.length !== 1000
    || land2017Figure6Trace.digitization.sampleCount
      !== SOURCE_SAMPLES_UM.length
    || SOURCE_SAMPLES_UM.some((value) => !(value > 0) || !Number.isFinite(value))
  ) throw new Error("Land Figure-6 calcium trace identity is invalid");
}

function minimum(values: readonly number[]): number {
  let current = Number.POSITIVE_INFINITY;
  for (const value of values) current = Math.min(current, value);
  if (!Number.isFinite(current)) throw new Error("minimum requires values");
  return current;
}

function maximum(values: readonly number[]): number {
  let current = Number.NEGATIVE_INFINITY;
  for (const value of values) current = Math.max(current, value);
  if (!Number.isFinite(current)) throw new Error("maximum requires values");
  return current;
}

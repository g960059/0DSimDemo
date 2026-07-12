import {
  initialEventDrivenContractileActivationStateV1,
  stepEventDrivenContractileActivationV1,
  validateEventDrivenContractileActivationParamsV1,
  type ActivationTimingSampleV1,
  type ElectricalEventReferenceV1,
  type EventDrivenContractileActivationParamsV1,
} from "@/engine/mechanics2/activation/EventDrivenContractileActivationV1";

/**
 * Observable contractile-state phenotype for one event in a periodic train.
 *
 * Every amplitude below is measured on the final bounded activation state
 * a(t), never on the Ca-like kernel or its Hill-transformed drive.  The
 * pre-event baseline is the periodic state immediately before the event.
 */
export type ContractileActivationPhenotypeV1 = {
  readonly eventReference: ElectricalEventReferenceV1;
  /** Causal Ca-like onset relative to the referenced event. */
  readonly effectiveOnsetDelaySec: number;
  readonly timeFromEventToPeakSec: number;
  /** Falling-limb time from the activation peak to 50% excursion. */
  readonly relaxationTimeTo50Sec: number;
  /** peak(a) - periodic pre-event a. */
  readonly peakExcursion01: number;
  /** Integral of max(a(t) - periodic pre-event a, 0) over one cycle. */
  readonly excursionIntegralSec: number;
  readonly referenceCycleLengthSec: number;
  readonly baselineDefinition: "periodic-pre-event";
};

export type PeriodicActivationPhenotypeReadbackV1 = {
  readonly phenotype: ContractileActivationPhenotypeV1;
  readonly baselineActivation01: number;
  readonly peakActivation01: number;
  readonly peakTimeSec: number;
  readonly halfRelaxationActivation01: number;
  readonly halfRelaxationTimeSec: number;
  readonly sampleIntervalSec: number;
  readonly historicalEventCount: number;
};

/**
 * Sample-derived portion of a periodic phenotype readback.  Unlike
 * `PeriodicActivationPhenotypeReadbackV1`, it carries no claim about how many
 * historical events were used to create the supplied trace.
 */
export type SampledPeriodicActivationPhenotypeReadbackV1 = Omit<
  PeriodicActivationPhenotypeReadbackV1,
  "historicalEventCount"
>;

export type PeriodicActivationPhenotypeSampleContextV1 = {
  /** Time of the event at the left endpoint of the supplied periodic trace. */
  readonly eventTimeSec: number;
  readonly eventReference: ElectricalEventReferenceV1;
  readonly effectiveOnsetDelaySec: number;
  readonly referenceCycleLengthSec: number;
};

export type ContractileActivationCalibrationBoundsV1 = {
  readonly riseTauSec: readonly [number, number];
  readonly decayTauSec: readonly [number, number];
  readonly onRatePerSec: readonly [number, number];
  readonly offRatePerSec: readonly [number, number];
};

export type ContractileActivationPhenotypeResidualsV1 = {
  readonly timeFromEventToPeakSec: number;
  readonly relaxationTimeTo50Sec: number;
  readonly peakExcursion01: number;
  readonly excursionIntegralSec: number;
  readonly normalizedRms: number;
  readonly normalizedMaximumAbsolute: number;
};

export type ContractileActivationPhenotypeCalibrationStatusV1 =
  | "converged"
  | "ill-conditioned"
  | "non-converged"
  | "unmeasurable-seed";

export type ContractileActivationPhenotypeCalibrationOptionsV1 = {
  /** Configuration-time trace resolution. Runtime stepping is untouched. */
  readonly sampleIntervalSec?: number;
  readonly maxIterations?: number;
  readonly normalizedResidualTolerance?: number;
  /** Maximum scaled-log-coordinate local condition estimate; defaults to 1e4. */
  readonly maximumJacobianCondition?: number;
  readonly finiteDifferenceLogStep?: number;
  readonly bounds?: ContractileActivationCalibrationBoundsV1;
};

export type ContractileActivationPhenotypeCalibrationResultV1 = {
  readonly status: ContractileActivationPhenotypeCalibrationStatusV1;
  /** Null unless both the phenotype fit and local numerical-conditioning checks pass. */
  readonly internalParams: EventDrivenContractileActivationParamsV1 | null;
  /** Diagnostic-only best candidate; callers must not install it on failure. */
  readonly candidateInternalParams: EventDrivenContractileActivationParamsV1;
  readonly realizedPhenotype: PeriodicActivationPhenotypeReadbackV1 | null;
  readonly targetResiduals: ContractileActivationPhenotypeResidualsV1 | null;
  /**
   * Infinity-norm condition estimate of the target-scaled phenotype Jacobian
   * with respect to log raw coordinates.  This is a local numerical
   * conditioning diagnostic, not a parameter-identifiability result.  Null
   * means unavailable or non-finite and is safe to serialize as JSON.
   */
  readonly localJacobianCondition: number | null;
  readonly iterations: number;
  readonly calibrationManifold: "log-rise-decay-on-off-4d";
  readonly message: string;
};

type ShapeVector = readonly [number, number, number, number];
type MutableMatrix4 = [number[], number[], number[], number[]];

const DEFAULT_MAX_ITERATIONS = 32;
const DEFAULT_RESIDUAL_TOLERANCE = 0.01;
const DEFAULT_MAXIMUM_JACOBIAN_CONDITION = 1e4;
const DEFAULT_FINITE_DIFFERENCE_LOG_STEP = 2e-3;

/**
 * Measures a periodic activation phenotype without changing or normalizing the
 * runtime state.  A discretized one-cycle affine map is solved for its unique
 * periodic fixed point, then that fixed point is sampled for one cycle.
 */
export function measurePeriodicContractileActivationPhenotypeV1(
  params: EventDrivenContractileActivationParamsV1,
  referenceCycleLengthSec: number,
  sampleIntervalSec = Math.min(0.001, referenceCycleLengthSec / 800),
): PeriodicActivationPhenotypeReadbackV1 | null {
  validateEventDrivenContractileActivationParamsV1(params);
  assertPositiveFinite("referenceCycleLengthSec", referenceCycleLengthSec);
  assertPositiveFinite("sampleIntervalSec", sampleIntervalSec);
  if (params.electricalToCalciumDelaySec >= referenceCycleLengthSec) {
    return null;
  }

  const numberOfSteps = Math.max(64, Math.ceil(referenceCycleLengthSec / sampleIntervalSec));
  const dtSec = referenceCycleLengthSec / numberOfSteps;
  const historicalEventCount = Math.max(
    8,
    Math.ceil(24 * params.calciumKernel.decayTauSec / referenceCycleLengthSec) + 1,
  );
  if (historicalEventCount > 256) return null;
  const events = Array.from(
    { length: historicalEventCount + 1 },
    (_, index) => ({ timeSec: -index * referenceCycleLengthSec }),
  ).reverse();

  const endFromZero = advanceOneCycle(0, dtSec, numberOfSteps, events, params);
  const endFromOne = advanceOneCycle(1, dtSec, numberOfSteps, events, params);
  const cycleMemory = endFromOne - endFromZero;
  const denominator = 1 - cycleMemory;
  if (
    !Number.isFinite(cycleMemory) ||
    cycleMemory < 0 ||
    cycleMemory >= 1 ||
    !Number.isFinite(denominator) ||
    denominator <= 1e-12
  ) {
    return null;
  }
  const periodicPreEventActivation01 = endFromZero / denominator;
  if (
    !Number.isFinite(periodicPreEventActivation01) ||
    periodicPreEventActivation01 < 0 ||
    periodicPreEventActivation01 > 1
  ) {
    return null;
  }

  let state = initialEventDrivenContractileActivationStateV1(
    periodicPreEventActivation01,
  );
  const samples: ActivationTimingSampleV1[] = [
    { timeSec: 0, activation01: state.activation01 },
  ];
  for (let stepIndex = 0; stepIndex < numberOfSteps; stepIndex += 1) {
    const output = stepEventDrivenContractileActivationV1(
      state,
      {
        stepStartTimeSec: stepIndex * dtSec,
        dtSec,
        events,
      },
      params,
    );
    state = output.state;
    samples.push({
      timeSec: (stepIndex + 1) * dtSec,
      activation01: state.activation01,
    });
  }

  const measured = measurePeriodicContractileActivationPhenotypeFromSamplesV1(
    samples,
    {
      eventTimeSec: 0,
      eventReference: params.electricalEventReference,
      effectiveOnsetDelaySec: params.electricalToCalciumDelaySec,
      referenceCycleLengthSec,
    },
  );
  return measured === null ? null : { ...measured, historicalEventCount };
}

/**
 * Measures the same phenotype as the configuration-time periodic mapper from
 * an externally generated, event-centered one-cycle trace.  Samples must be
 * equally spaced and include both the event-time left endpoint and the
 * next-event right endpoint.  This makes periodic wrap ownership explicit and
 * keeps peak refinement identical between mapped and coupled traces.
 */
export function measurePeriodicContractileActivationPhenotypeFromSamplesV1(
  samples: readonly ActivationTimingSampleV1[],
  context: PeriodicActivationPhenotypeSampleContextV1,
): SampledPeriodicActivationPhenotypeReadbackV1 | null {
  if (samples.length < 3) {
    throw new RangeError("samples must contain at least three points");
  }
  assertFinite("eventTimeSec", context.eventTimeSec);
  assertNonNegativeFinite(
    "effectiveOnsetDelaySec",
    context.effectiveOnsetDelaySec,
  );
  assertPositiveFinite(
    "referenceCycleLengthSec",
    context.referenceCycleLengthSec,
  );
  if (context.effectiveOnsetDelaySec >= context.referenceCycleLengthSec) {
    return null;
  }

  for (let index = 0; index < samples.length; index += 1) {
    assertFinite(`samples[${index}].timeSec`, samples[index]!.timeSec);
    assertUnitInterval(
      `samples[${index}].activation01`,
      samples[index]!.activation01,
    );
    if (index > 0 && samples[index]!.timeSec <= samples[index - 1]!.timeSec) {
      throw new RangeError("sample times must be strictly increasing");
    }
  }
  const firstTimeSec = samples[0]!.timeSec;
  const lastTimeSec = samples.at(-1)!.timeSec;
  const sampleIntervalSec = (lastTimeSec - firstTimeSec) /
    (samples.length - 1);
  assertPositiveFinite("sampleIntervalSec", sampleIntervalSec);
  const expectedLastTimeSec = context.eventTimeSec +
    context.referenceCycleLengthSec;
  assertFinite("eventTimeSec + referenceCycleLengthSec", expectedLastTimeSec);
  const timeScaleSec = Math.max(
    1,
    Math.abs(context.eventTimeSec),
    Math.abs(expectedLastTimeSec),
  );
  const timeToleranceSec = Math.max(
    1e-12,
    32 * Number.EPSILON * timeScaleSec,
  );
  if (Math.abs(firstTimeSec - context.eventTimeSec) > timeToleranceSec) {
    throw new RangeError("the first sample must be at eventTimeSec");
  }
  if (Math.abs(lastTimeSec - expectedLastTimeSec) > timeToleranceSec) {
    throw new RangeError(
      "the last sample must be one reference cycle after eventTimeSec",
    );
  }
  for (let index = 1; index < samples.length; index += 1) {
    const expectedTimeSec = firstTimeSec + index * sampleIntervalSec;
    if (Math.abs(samples[index]!.timeSec - expectedTimeSec) > timeToleranceSec) {
      throw new RangeError("sample times must be equally spaced");
    }
  }

  const baselineActivation01 = samples[0]!.activation01;
  const peakIndex = findPeakIndex(samples);
  if (peakIndex <= 0 || peakIndex >= samples.length - 1) return null;
  const peak = refineEquallySpacedPeak(samples, peakIndex, sampleIntervalSec);
  const timeFromEventToPeakSec = peak.timeSec - context.eventTimeSec;
  if (
    !Number.isFinite(peak.activation01) ||
    peak.activation01 > 1 ||
    timeFromEventToPeakSec <= context.effectiveOnsetDelaySec ||
    timeFromEventToPeakSec >= context.referenceCycleLengthSec
  ) {
    return null;
  }
  const peakExcursion01 = peak.activation01 - baselineActivation01;
  if (!Number.isFinite(peakExcursion01) || peakExcursion01 <= 0) return null;

  const halfRelaxationActivation01 = baselineActivation01 +
    0.5 * peakExcursion01;
  const halfRelaxationTimeSec = findFallingCrossingTime(
    samples,
    peakIndex,
    halfRelaxationActivation01,
  );
  if (
    halfRelaxationTimeSec === null ||
    halfRelaxationTimeSec <= peak.timeSec ||
    halfRelaxationTimeSec >= expectedLastTimeSec
  ) {
    return null;
  }

  let excursionIntegralSec = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previousExcursion = Math.max(
      0,
      samples[index - 1]!.activation01 - baselineActivation01,
    );
    const currentExcursion = Math.max(
      0,
      samples[index]!.activation01 - baselineActivation01,
    );
    excursionIntegralSec += 0.5 *
      (previousExcursion + currentExcursion) * sampleIntervalSec;
  }
  if (!Number.isFinite(excursionIntegralSec) || excursionIntegralSec <= 0) {
    return null;
  }

  return {
    phenotype: {
      eventReference: context.eventReference,
      effectiveOnsetDelaySec: context.effectiveOnsetDelaySec,
      timeFromEventToPeakSec,
      relaxationTimeTo50Sec: halfRelaxationTimeSec - peak.timeSec,
      peakExcursion01,
      excursionIntegralSec,
      referenceCycleLengthSec: context.referenceCycleLengthSec,
      baselineDefinition: "periodic-pre-event",
    },
    baselineActivation01,
    peakActivation01: peak.activation01,
    peakTimeSec: peak.timeSec,
    halfRelaxationActivation01,
    halfRelaxationTimeSec,
    sampleIntervalSec,
  };
}

/**
 * Configuration-time phenotype mapper.  The four positive raw shape
 * parameters are solved in log space; electrical delay and event semantics
 * are copied directly from the requested phenotype.  No future trace is used
 * during runtime, and a failed/ill-conditioned fit returns null installable
 * parameters.
 */
export function calibrateEventDrivenActivationPhenotypeV1(
  target: ContractileActivationPhenotypeV1,
  seedInternalParams: EventDrivenContractileActivationParamsV1,
  options: ContractileActivationPhenotypeCalibrationOptionsV1 = {},
): ContractileActivationPhenotypeCalibrationResultV1 {
  validatePhenotype(target);
  validateEventDrivenContractileActivationParamsV1(seedInternalParams);
  if (seedInternalParams.electricalEventReference !== target.eventReference) {
    throw new RangeError("seed event reference must match target.eventReference");
  }
  if (
    target.eventReference === "prescribed-calcium-onset" &&
    target.effectiveOnsetDelaySec !== 0
  ) {
    throw new RangeError(
      "effectiveOnsetDelaySec must be zero for prescribed-calcium-onset",
    );
  }

  const sampleIntervalSec = options.sampleIntervalSec ?? Math.min(
    0.001,
    target.referenceCycleLengthSec / 800,
  );
  assertPositiveFinite("sampleIntervalSec", sampleIntervalSec);
  const effectiveSampleIntervalSec = target.referenceCycleLengthSec / Math.max(
    64,
    Math.ceil(target.referenceCycleLengthSec / sampleIntervalSec),
  );
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  if (!Number.isInteger(maxIterations) || maxIterations < 0) {
    throw new RangeError("maxIterations must be a non-negative integer");
  }
  const residualTolerance = options.normalizedResidualTolerance ??
    DEFAULT_RESIDUAL_TOLERANCE;
  assertPositiveFinite("normalizedResidualTolerance", residualTolerance);
  const maximumCondition = options.maximumJacobianCondition ??
    DEFAULT_MAXIMUM_JACOBIAN_CONDITION;
  assertPositiveFinite("maximumJacobianCondition", maximumCondition);
  const finiteDifferenceLogStep = options.finiteDifferenceLogStep ??
    DEFAULT_FINITE_DIFFERENCE_LOG_STEP;
  assertPositiveFinite("finiteDifferenceLogStep", finiteDifferenceLogStep);

  const bounds = options.bounds ?? defaultBounds(
    target.referenceCycleLengthSec,
    effectiveSampleIntervalSec,
  );
  validateBounds(bounds);
  const lowerLog: ShapeVector = [
    Math.log(bounds.riseTauSec[0]),
    Math.log(bounds.decayTauSec[0]),
    Math.log(bounds.onRatePerSec[0]),
    Math.log(bounds.offRatePerSec[0]),
  ];
  const upperLog: ShapeVector = [
    Math.log(bounds.riseTauSec[1]),
    Math.log(bounds.decayTauSec[1]),
    Math.log(bounds.onRatePerSec[1]),
    Math.log(bounds.offRatePerSec[1]),
  ];
  let logShape = paramsToLogShape(seedInternalParams);
  for (let index = 0; index < 4; index += 1) {
    if (logShape[index] < lowerLog[index] || logShape[index] > upperLog[index]) {
      throw new RangeError("seed internal parameters must lie within calibration bounds");
    }
  }

  const buildParams = (candidate: ShapeVector): EventDrivenContractileActivationParamsV1 => ({
    electricalEventReference: target.eventReference,
    electricalToCalciumDelaySec: target.effectiveOnsetDelaySec,
    calciumKernel: {
      riseTauSec: Math.exp(candidate[0]),
      decayTauSec: Math.exp(candidate[1]),
    },
    contractileKinetics: {
      onRatePerSec: Math.exp(candidate[2]),
      offRatePerSec: Math.exp(candidate[3]),
    },
  });
  const evaluate = (candidate: ShapeVector) => {
    const params = buildParams(candidate);
    const readback = measurePeriodicContractileActivationPhenotypeV1(
      params,
      target.referenceCycleLengthSec,
      effectiveSampleIntervalSec,
    );
    if (readback === null) return null;
    const residuals = buildContractileActivationPhenotypeResidualsV1(
      readback.phenotype,
      target,
      effectiveSampleIntervalSec,
    );
    return {
      params,
      readback,
      residuals,
      normalized: residualVector(
        readback.phenotype,
        target,
        effectiveSampleIntervalSec,
      ),
    };
  };

  let current = evaluate(logShape);
  if (current === null) {
    const candidateInternalParams = buildParams(logShape);
    return failedResult(
      "unmeasurable-seed",
      candidateInternalParams,
      null,
      null,
      null,
      0,
      "The seed did not produce a bounded periodic trace with an interior peak and falling RT50.",
    );
  }

  let damping = 1e-3;
  let iterations = 0;
  for (; iterations < maxIterations; iterations += 1) {
    if (current.residuals.normalizedMaximumAbsolute <= residualTolerance) break;
    const jacobian = finiteDifferenceJacobian(
      logShape,
      current.normalized,
      lowerLog,
      upperLog,
      finiteDifferenceLogStep,
      evaluate,
    );
    if (jacobian === null) break;
    const normal = normalEquations(jacobian, current.normalized, damping);
    const step = solveLinearSystem4(normal.matrix, normal.rhs);
    if (step === null) break;
    const maximumStep = Math.max(...step.map((value) => Math.abs(value)));
    const scale = maximumStep > 0.8 ? 0.8 / maximumStep : 1;
    let accepted = false;
    for (const lineScale of [1, 0.5, 0.25, 0.125, 0.0625]) {
      const candidate = clampShapeVector(
        [
          logShape[0] + scale * lineScale * step[0]!,
          logShape[1] + scale * lineScale * step[1]!,
          logShape[2] + scale * lineScale * step[2]!,
          logShape[3] + scale * lineScale * step[3]!,
        ],
        lowerLog,
        upperLog,
      );
      const evaluated = evaluate(candidate);
      if (
        evaluated !== null &&
        evaluated.residuals.normalizedRms < current.residuals.normalizedRms
      ) {
        logShape = candidate;
        current = evaluated;
        damping = Math.max(1e-8, damping * 0.3);
        accepted = true;
        break;
      }
    }
    if (!accepted) {
      damping = Math.min(1e8, damping * 10);
      if (damping >= 1e8) break;
    }
  }

  const finalJacobian = finiteDifferenceJacobian(
    logShape,
    current.normalized,
    lowerLog,
    upperLog,
    finiteDifferenceLogStep,
    evaluate,
  );
  const rawLocalJacobianCondition = finalJacobian === null
    ? null
    : matrixInfinityCondition4(finalJacobian);
  const localJacobianCondition = rawLocalJacobianCondition !== null &&
      Number.isFinite(rawLocalJacobianCondition)
    ? rawLocalJacobianCondition
    : null;
  const fitted = current.residuals.normalizedMaximumAbsolute <= residualTolerance;
  if (!fitted) {
    return failedResult(
      "non-converged",
      current.params,
      current.readback,
      current.residuals,
      localJacobianCondition,
      iterations,
      "This bounded single-seed local log-space solve did not meet the phenotype residual tolerance; this result does not establish that the target lies outside the model family.",
    );
  }
  if (
    localJacobianCondition === null || localJacobianCondition > maximumCondition
  ) {
    return failedResult(
      "ill-conditioned",
      current.params,
      current.readback,
      current.residuals,
      localJacobianCondition,
      iterations,
      "The target-scaled phenotype Jacobian in log raw coordinates is unavailable or exceeds the requested local numerical-conditioning limit; this is not a parameter-identifiability claim.",
    );
  }
  return {
    status: "converged",
    internalParams: current.params,
    candidateInternalParams: current.params,
    realizedPhenotype: current.readback,
    targetResiduals: current.residuals,
    localJacobianCondition,
    iterations,
    calibrationManifold: "log-rise-decay-on-off-4d",
    message:
      "Phenotype residual and scaled-log-coordinate local numerical-conditioning checks passed; no parameter-identifiability claim is made.",
  };
}

function failedResult(
  status: Exclude<ContractileActivationPhenotypeCalibrationStatusV1, "converged">,
  candidateInternalParams: EventDrivenContractileActivationParamsV1,
  realizedPhenotype: PeriodicActivationPhenotypeReadbackV1 | null,
  targetResiduals: ContractileActivationPhenotypeResidualsV1 | null,
  localJacobianCondition: number | null,
  iterations: number,
  message: string,
): ContractileActivationPhenotypeCalibrationResultV1 {
  return {
    status,
    internalParams: null,
    candidateInternalParams,
    realizedPhenotype,
    targetResiduals,
    localJacobianCondition,
    iterations,
    calibrationManifold: "log-rise-decay-on-off-4d",
    message,
  };
}

function advanceOneCycle(
  initialActivation01: number,
  dtSec: number,
  numberOfSteps: number,
  events: readonly { readonly timeSec: number }[],
  params: EventDrivenContractileActivationParamsV1,
): number {
  let state = initialEventDrivenContractileActivationStateV1(initialActivation01);
  for (let stepIndex = 0; stepIndex < numberOfSteps; stepIndex += 1) {
    state = stepEventDrivenContractileActivationV1(
      state,
      { stepStartTimeSec: stepIndex * dtSec, dtSec, events },
      params,
    ).state;
  }
  return state.activation01;
}

function findPeakIndex(samples: readonly ActivationTimingSampleV1[]): number {
  let peakIndex = 0;
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index]!.activation01 > samples[peakIndex]!.activation01) {
      peakIndex = index;
    }
  }
  return peakIndex;
}

function refineEquallySpacedPeak(
  samples: readonly ActivationTimingSampleV1[],
  peakIndex: number,
  dtSec: number,
): { readonly timeSec: number; readonly activation01: number } {
  const previous = samples[peakIndex - 1]!.activation01;
  const center = samples[peakIndex]!.activation01;
  const next = samples[peakIndex + 1]!.activation01;
  const curvature = previous - 2 * center + next;
  if (!Number.isFinite(curvature) || curvature >= -1e-15) {
    return samples[peakIndex]!;
  }
  const offsetInSteps = Math.max(
    -1,
    Math.min(1, 0.5 * (previous - next) / curvature),
  );
  const unconstrainedActivation01 = center +
    0.5 * offsetInSteps * (next - previous) +
    0.5 * offsetInSteps * offsetInSteps * curvature;
  // The sampled state is physically bounded. A local parabola can overshoot
  // one at a sharp/plateau edge (notably the legacy rectangular drive), so the
  // sub-sample estimate must preserve the same [sample peak, 1] state bounds.
  const activation01 = Math.max(
    center,
    Math.min(1, unconstrainedActivation01),
  );
  return {
    timeSec: samples[peakIndex]!.timeSec + offsetInSteps * dtSec,
    activation01,
  };
}

function findFallingCrossingTime(
  samples: readonly ActivationTimingSampleV1[],
  peakIndex: number,
  threshold: number,
): number | null {
  for (let index = peakIndex + 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (previous.activation01 >= threshold && current.activation01 <= threshold) {
      const delta = current.activation01 - previous.activation01;
      return delta === 0
        ? current.timeSec
        : previous.timeSec + (current.timeSec - previous.timeSec) *
          (threshold - previous.activation01) / delta;
    }
  }
  return null;
}

function defaultBounds(
  cycleLengthSec: number,
  sampleIntervalSec: number,
): ContractileActivationCalibrationBoundsV1 {
  const minimumTauSec = Math.max(sampleIntervalSec, 1e-5);
  return {
    riseTauSec: [minimumTauSec, 0.75 * cycleLengthSec],
    decayTauSec: [minimumTauSec, 2 * cycleLengthSec],
    onRatePerSec: [0.1 / cycleLengthSec, 2_000 / cycleLengthSec],
    offRatePerSec: [0.1 / cycleLengthSec, 2_000 / cycleLengthSec],
  };
}

function validateBounds(bounds: ContractileActivationCalibrationBoundsV1): void {
  for (const [name, pair] of Object.entries(bounds)) {
    if (
      pair.length !== 2 ||
      !Number.isFinite(pair[0]) ||
      !Number.isFinite(pair[1]) ||
      pair[0] <= 0 ||
      pair[1] <= pair[0]
    ) {
      throw new RangeError(`${name} bounds must be finite, positive, and increasing`);
    }
  }
}

function validatePhenotype(phenotype: ContractileActivationPhenotypeV1): void {
  assertNonNegativeFinite("effectiveOnsetDelaySec", phenotype.effectiveOnsetDelaySec);
  assertPositiveFinite("timeFromEventToPeakSec", phenotype.timeFromEventToPeakSec);
  assertPositiveFinite("relaxationTimeTo50Sec", phenotype.relaxationTimeTo50Sec);
  assertPositiveFinite("peakExcursion01", phenotype.peakExcursion01);
  assertPositiveFinite("excursionIntegralSec", phenotype.excursionIntegralSec);
  assertPositiveFinite("referenceCycleLengthSec", phenotype.referenceCycleLengthSec);
  if (phenotype.baselineDefinition !== "periodic-pre-event") {
    throw new RangeError("baselineDefinition must be periodic-pre-event");
  }
  if (phenotype.peakExcursion01 > 1) {
    throw new RangeError("peakExcursion01 must not exceed one");
  }
  if (phenotype.effectiveOnsetDelaySec >= phenotype.referenceCycleLengthSec) {
    throw new RangeError("effectiveOnsetDelaySec must lie within the reference cycle");
  }
  if (phenotype.timeFromEventToPeakSec >= phenotype.referenceCycleLengthSec) {
    throw new RangeError("timeFromEventToPeakSec must lie within the reference cycle");
  }
  if (phenotype.timeFromEventToPeakSec <= phenotype.effectiveOnsetDelaySec) {
    throw new RangeError("activation peak must follow the effective onset");
  }
  if (
    phenotype.timeFromEventToPeakSec + phenotype.relaxationTimeTo50Sec >=
      phenotype.referenceCycleLengthSec
  ) {
    throw new RangeError("activation RT50 must be reached before the next event");
  }
  if (
    phenotype.excursionIntegralSec >
      phenotype.peakExcursion01 * phenotype.referenceCycleLengthSec
  ) {
    throw new RangeError("excursionIntegralSec exceeds the bounded-excursion maximum");
  }
}

/**
 * Builds the mapper's target-scaled residual contract for any measured
 * phenotype, including a coupled event-centered periodic trace.
 */
export function buildContractileActivationPhenotypeResidualsV1(
  realized: ContractileActivationPhenotypeV1,
  target: ContractileActivationPhenotypeV1,
  sampleIntervalSec: number,
): ContractileActivationPhenotypeResidualsV1 {
  validatePhenotype(realized);
  validatePhenotype(target);
  assertPositiveFinite("sampleIntervalSec", sampleIntervalSec);
  if (realized.eventReference !== target.eventReference) {
    throw new RangeError("realized and target eventReference must match");
  }
  if (realized.effectiveOnsetDelaySec !== target.effectiveOnsetDelaySec) {
    throw new RangeError(
      "realized and target effectiveOnsetDelaySec must match",
    );
  }
  if (realized.referenceCycleLengthSec !== target.referenceCycleLengthSec) {
    throw new RangeError(
      "realized and target referenceCycleLengthSec must match",
    );
  }
  const normalized = residualVector(realized, target, sampleIntervalSec);
  return {
    timeFromEventToPeakSec:
      realized.timeFromEventToPeakSec - target.timeFromEventToPeakSec,
    relaxationTimeTo50Sec:
      realized.relaxationTimeTo50Sec - target.relaxationTimeTo50Sec,
    peakExcursion01: realized.peakExcursion01 - target.peakExcursion01,
    excursionIntegralSec:
      realized.excursionIntegralSec - target.excursionIntegralSec,
    normalizedRms: Math.sqrt(
      normalized.reduce((sum, value) => sum + value * value, 0) / normalized.length,
    ),
    normalizedMaximumAbsolute: Math.max(...normalized.map((value) => Math.abs(value))),
  };
}

function residualVector(
  realized: ContractileActivationPhenotypeV1,
  target: ContractileActivationPhenotypeV1,
  sampleIntervalSec: number,
): ShapeVector {
  return [
    (realized.timeFromEventToPeakSec - target.timeFromEventToPeakSec) /
      Math.max(target.timeFromEventToPeakSec, 2 * sampleIntervalSec),
    (realized.relaxationTimeTo50Sec - target.relaxationTimeTo50Sec) /
      Math.max(target.relaxationTimeTo50Sec, 2 * sampleIntervalSec),
    (realized.peakExcursion01 - target.peakExcursion01) /
      Math.max(target.peakExcursion01, 0.02),
    (realized.excursionIntegralSec - target.excursionIntegralSec) /
      Math.max(target.excursionIntegralSec, 2 * sampleIntervalSec * target.peakExcursion01),
  ];
}

function paramsToLogShape(params: EventDrivenContractileActivationParamsV1): ShapeVector {
  return [
    Math.log(params.calciumKernel.riseTauSec),
    Math.log(params.calciumKernel.decayTauSec),
    Math.log(params.contractileKinetics.onRatePerSec),
    Math.log(params.contractileKinetics.offRatePerSec),
  ];
}

function clampShapeVector(
  values: ShapeVector,
  lower: ShapeVector,
  upper: ShapeVector,
): ShapeVector {
  return [
    clamp(values[0], lower[0], upper[0]),
    clamp(values[1], lower[1], upper[1]),
    clamp(values[2], lower[2], upper[2]),
    clamp(values[3], lower[3], upper[3]),
  ];
}

function finiteDifferenceJacobian(
  center: ShapeVector,
  centerResidual: ShapeVector,
  lower: ShapeVector,
  upper: ShapeVector,
  logStep: number,
  evaluate: (candidate: ShapeVector) => { readonly normalized: ShapeVector } | null,
): MutableMatrix4 | null {
  const jacobian: MutableMatrix4 = [[], [], [], []];
  for (let column = 0; column < 4; column += 1) {
    const canGoLower = center[column]! - logStep >= lower[column]!;
    const canGoUpper = center[column]! + logStep <= upper[column]!;
    if (!canGoLower && !canGoUpper) return null;
    const lowerPoint = [...center] as number[];
    const upperPoint = [...center] as number[];
    if (canGoLower) lowerPoint[column] -= logStep;
    if (canGoUpper) upperPoint[column] += logStep;
    const lowerEvaluation = canGoLower
      ? evaluate(lowerPoint as unknown as ShapeVector)
      : null;
    const upperEvaluation = canGoUpper
      ? evaluate(upperPoint as unknown as ShapeVector)
      : null;
    if ((canGoLower && lowerEvaluation === null) || (canGoUpper && upperEvaluation === null)) {
      return null;
    }
    for (let row = 0; row < 4; row += 1) {
      if (canGoLower && canGoUpper) {
        jacobian[row]![column] =
          (upperEvaluation!.normalized[row]! - lowerEvaluation!.normalized[row]!) /
          (2 * logStep);
      } else if (canGoUpper) {
        jacobian[row]![column] =
          (upperEvaluation!.normalized[row]! - centerResidual[row]!) / logStep;
      } else {
        jacobian[row]![column] =
          (centerResidual[row]! - lowerEvaluation!.normalized[row]!) / logStep;
      }
    }
  }
  return jacobian;
}

function normalEquations(
  jacobian: MutableMatrix4,
  residual: ShapeVector,
  damping: number,
): { readonly matrix: MutableMatrix4; readonly rhs: number[] } {
  const matrix: MutableMatrix4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const rhs = [0, 0, 0, 0];
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      rhs[column] -= jacobian[row]![column]! * residual[row]!;
      for (let other = 0; other < 4; other += 1) {
        matrix[column]![other] += jacobian[row]![column]! * jacobian[row]![other]!;
      }
    }
    matrix[column]![column] += damping;
  }
  return { matrix, rhs };
}

function solveLinearSystem4(matrix: MutableMatrix4, rhs: readonly number[]): number[] | null {
  const augmented = matrix.map((row, index) => [...row, rhs[index]!]);
  for (let pivot = 0; pivot < 4; pivot += 1) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < 4; row += 1) {
      if (Math.abs(augmented[row]![pivot]!) > Math.abs(augmented[pivotRow]![pivot]!)) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow]![pivot]!) < 1e-14) return null;
    [augmented[pivot], augmented[pivotRow]] = [augmented[pivotRow]!, augmented[pivot]!];
    const divisor = augmented[pivot]![pivot]!;
    for (let column = pivot; column <= 4; column += 1) {
      augmented[pivot]![column] /= divisor;
    }
    for (let row = 0; row < 4; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row]![pivot]!;
      for (let column = pivot; column <= 4; column += 1) {
        augmented[row]![column] -= factor * augmented[pivot]![column]!;
      }
    }
  }
  const solution = augmented.map((row) => row[4]!);
  return solution.every(Number.isFinite) ? solution : null;
}

function matrixInfinityCondition4(matrix: MutableMatrix4): number {
  const norm = Math.max(...matrix.map((row) => row.reduce(
    (sum, value) => sum + Math.abs(value),
    0,
  )));
  let inverseNorm = 0;
  const inverseColumns: number[][] = [];
  for (let column = 0; column < 4; column += 1) {
    const unit = [0, 0, 0, 0];
    unit[column] = 1;
    const solution = solveLinearSystem4(
      matrix.map((row) => [...row]) as MutableMatrix4,
      unit,
    );
    if (solution === null) return Number.POSITIVE_INFINITY;
    inverseColumns.push(solution);
  }
  for (let row = 0; row < 4; row += 1) {
    let rowSum = 0;
    for (let column = 0; column < 4; column += 1) {
      rowSum += Math.abs(inverseColumns[column]![row]!);
    }
    inverseNorm = Math.max(inverseNorm, rowSum);
  }
  return norm * inverseNorm;
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be finite and greater than zero`);
  }
}

function assertNonNegativeFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative`);
  }
}

function assertUnitInterval(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be finite and within [0, 1]`);
  }
}

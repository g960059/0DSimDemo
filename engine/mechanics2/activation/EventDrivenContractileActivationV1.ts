/**
 * Reference carried by an electrical event time.
 *
 * The reference is explicit because a delay measured from surface P-wave onset
 * is not interchangeable with a delay measured from local depolarization.
 */
export type ElectricalEventReferenceV1 =
  | "surface-p-wave-onset"
  | "local-atrial-depolarization"
  | "prescribed-effective-sidecar-event"
  | "prescribed-calcium-onset";

export const ELECTRICAL_EVENT_REFERENCE_SEMANTICS_V1: Readonly<
  Record<ElectricalEventReferenceV1, string>
> = {
  "surface-p-wave-onset":
    "Event time is surface-ECG P-wave onset; delay includes conduction and excitation-contraction latency.",
  "local-atrial-depolarization":
    "Event time is local atrial depolarization; delay is local excitation-contraction latency.",
  "prescribed-effective-sidecar-event":
    "Event time is an artificial sidecar timing reference; it is neither surface ECG nor measured local depolarization.",
  "prescribed-calcium-onset":
    "Event time is the prescribed onset of the Ca-like kernel; electrical-to-calcium delay must be zero.",
};

export type ElectricalActivationEventV1 = {
  readonly timeSec: number;
};

/**
 * This module deliberately excludes active-stress amplitude. It only maps
 * event timing to a bounded contractile activation state.
 */
export type EventDrivenContractileActivationParamsV1 = {
  readonly electricalEventReference: ElectricalEventReferenceV1;
  readonly electricalToCalciumDelaySec: number;
  readonly calciumKernel: {
    readonly riseTauSec: number;
    readonly decayTauSec: number;
  };
  readonly contractileKinetics: {
    readonly onRatePerSec: number;
    readonly offRatePerSec: number;
  };
};

export type EventDrivenContractileActivationStateV1 = {
  readonly activation01: number;
};

export type EventDrivenContractileActivationStepInputV1 = {
  readonly stepStartTimeSec: number;
  readonly dtSec: number;
  readonly events: readonly ElectricalActivationEventV1[];
};

export type EventDrivenContractileActivationStepOutputV1 = {
  readonly state: EventDrivenContractileActivationStateV1;
  readonly stepStartTimeSec: number;
  readonly stepEndTimeSec: number;
  /** Midpoint at which the time-varying drive is frozen for this exact update. */
  readonly driveSampleTimeSec: number;
  /** Dimensionless event sum. It is non-negative but can exceed one. */
  readonly calciumDrive: number;
  readonly hillDrive01: number;
  readonly constantDriveEquilibriumActivation01: number;
  readonly activationRateAtStepStartPerSec: number;
};

export type CalciumKernelTimingReadbackV1 = {
  readonly timeToPeakSec: number;
  /** Elapsed time from the kernel peak until its falling limb reaches 50%. */
  readonly relaxationTimeTo50Sec: number;
  readonly halfRelaxationTimeSinceOnsetSec: number;
  readonly peakValue: 1;
};

export type ActivationTimingSampleV1 = {
  readonly timeSec: number;
  readonly activation01: number;
};

export type ActivationTimingReadbackV1 = {
  readonly electricalEventReference: ElectricalEventReferenceV1;
  readonly electricalEventTimeSec: number;
  readonly calciumOnsetTimeSec: number;
  readonly baselineActivation01: number;
  readonly peakActivation01: number;
  readonly peakTimeSec: number;
  readonly timeFromElectricalEventToPeakSec: number;
  readonly timeFromCalciumOnsetToPeakSec: number;
  /** Half of the peak excursion above the event-time baseline. */
  readonly halfRelaxationActivation01: number;
  readonly halfRelaxationTimeSec: number | null;
  readonly relaxationTimeTo50Sec: number | null;
  readonly reachedHalfRelaxation: boolean;
};

/**
 * Fixed transduction avoids a non-identifiable pulse-amplitude/Hill/Tmax triplet.
 * The Ca-like drive is dimensionless; these are model constants, not calcium
 * concentration measurements.
 */
export const FIXED_CONTRACTILE_HILL_MAPPING_V1 = {
  halfMaxCalciumDrive: 0.5,
  coefficient: 2,
} as const;

const ELECTRICAL_EVENT_REFERENCES_V1: readonly ElectricalEventReferenceV1[] = [
  "surface-p-wave-onset",
  "local-atrial-depolarization",
  "prescribed-effective-sidecar-event",
  "prescribed-calcium-onset",
];

export function initialEventDrivenContractileActivationStateV1(
  activation01 = 0,
): EventDrivenContractileActivationStateV1 {
  assertUnitInterval("activation01", activation01);
  return { activation01 };
}

export function validateEventDrivenContractileActivationParamsV1(
  params: EventDrivenContractileActivationParamsV1,
): void {
  if (!ELECTRICAL_EVENT_REFERENCES_V1.includes(params.electricalEventReference)) {
    throw new RangeError(
      `electricalEventReference must be one of ${ELECTRICAL_EVENT_REFERENCES_V1.join(", ")}`,
    );
  }
  assertNonNegativeFinite(
    "electricalToCalciumDelaySec",
    params.electricalToCalciumDelaySec,
  );
  if (
    params.electricalEventReference === "prescribed-calcium-onset" &&
    params.electricalToCalciumDelaySec !== 0
  ) {
    throw new RangeError(
      "electricalToCalciumDelaySec must be zero for prescribed-calcium-onset events",
    );
  }
  assertPositiveFinite("calciumKernel.riseTauSec", params.calciumKernel.riseTauSec);
  assertPositiveFinite("calciumKernel.decayTauSec", params.calciumKernel.decayTauSec);
  assertPositiveFinite(
    "contractileKinetics.onRatePerSec",
    params.contractileKinetics.onRatePerSec,
  );
  assertPositiveFinite(
    "contractileKinetics.offRatePerSec",
    params.contractileKinetics.offRatePerSec,
  );

  const timeToPeakSec = calciumKernelTimeToPeakSecV1(params.calciumKernel);
  if (!Number.isFinite(timeToPeakSec) || timeToPeakSec <= 0) {
    throw new RangeError("calciumKernel parameters must produce a finite positive time to peak");
  }
}

/**
 * Analytic C1 Ca-like kernel
 *   N (1 - exp(-s / tauRise))^2 exp(-s / tauDecay), s >= 0.
 * N makes a single event peak exactly one (to floating-point precision).
 */
export function normalizedCalciumKernelV1(
  timeSinceCalciumOnsetSec: number,
  params: EventDrivenContractileActivationParamsV1["calciumKernel"],
): number {
  assertFinite("timeSinceCalciumOnsetSec", timeSinceCalciumOnsetSec);
  assertPositiveFinite("calciumKernel.riseTauSec", params.riseTauSec);
  assertPositiveFinite("calciumKernel.decayTauSec", params.decayTauSec);
  if (timeSinceCalciumOnsetSec <= 0) return 0;

  const timeToPeakSec = calciumKernelTimeToPeakSecV1(params);
  const logValue = calciumKernelLogUnnormalized(
    timeSinceCalciumOnsetSec,
    params.riseTauSec,
    params.decayTauSec,
  );
  const logPeak = calciumKernelLogUnnormalized(
    timeToPeakSec,
    params.riseTauSec,
    params.decayTauSec,
  );
  const value = Math.exp(logValue - logPeak);
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("calcium kernel evaluation must be finite and non-negative");
  }
  return value;
}

export function calciumKernelTimeToPeakSecV1(
  params: EventDrivenContractileActivationParamsV1["calciumKernel"],
): number {
  assertPositiveFinite("calciumKernel.riseTauSec", params.riseTauSec);
  assertPositiveFinite("calciumKernel.decayTauSec", params.decayTauSec);
  const ratio = 2 * params.decayTauSec / params.riseTauSec;
  const timeToPeakSec = params.riseTauSec * Math.log1p(ratio);
  if (!Number.isFinite(timeToPeakSec) || timeToPeakSec <= 0) {
    throw new RangeError("calciumKernel parameters must produce a finite positive time to peak");
  }
  return timeToPeakSec;
}

export function readCalciumKernelTimingV1(
  params: EventDrivenContractileActivationParamsV1["calciumKernel"],
): CalciumKernelTimingReadbackV1 {
  const timeToPeakSec = calciumKernelTimeToPeakSecV1(params);
  let lowerSec = timeToPeakSec;
  let upperSec = timeToPeakSec + Math.max(params.riseTauSec, params.decayTauSec);
  let expansionCount = 0;
  while (normalizedCalciumKernelV1(upperSec, params) > 0.5) {
    upperSec = timeToPeakSec + 2 * (upperSec - timeToPeakSec);
    expansionCount += 1;
    if (!Number.isFinite(upperSec) || expansionCount > 128) {
      throw new RangeError("calcium kernel half-relaxation time is not representable");
    }
  }
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpointSec = 0.5 * (lowerSec + upperSec);
    if (normalizedCalciumKernelV1(midpointSec, params) > 0.5) {
      lowerSec = midpointSec;
    } else {
      upperSec = midpointSec;
    }
  }
  const halfRelaxationTimeSinceOnsetSec = 0.5 * (lowerSec + upperSec);
  return {
    timeToPeakSec,
    relaxationTimeTo50Sec: halfRelaxationTimeSinceOnsetSec - timeToPeakSec,
    halfRelaxationTimeSinceOnsetSec,
    peakValue: 1,
  };
}

/** Sum all causal event tails. There is no cycle modulo and no beat reset. */
export function calciumDriveFromEventsV1(
  timeSec: number,
  events: readonly ElectricalActivationEventV1[],
  params: EventDrivenContractileActivationParamsV1,
): number {
  validateEventDrivenContractileActivationParamsV1(params);
  assertFinite("timeSec", timeSec);
  let calciumDrive = 0;
  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex]!;
    assertFinite(`events[${eventIndex}].timeSec`, event.timeSec);
    const calciumOnsetTimeSec = event.timeSec + params.electricalToCalciumDelaySec;
    if (!Number.isFinite(calciumOnsetTimeSec)) {
      throw new RangeError(`events[${eventIndex}] produces a non-finite calcium onset time`);
    }
    calciumDrive += normalizedCalciumKernelV1(
      timeSec - calciumOnsetTimeSec,
      params.calciumKernel,
    );
    if (!Number.isFinite(calciumDrive)) {
      throw new RangeError("summed calcium drive must remain finite");
    }
  }
  return calciumDrive;
}

/** Fixed, numerically stable Hill transduction of a non-negative drive. */
export function fixedContractileHillDriveV1(calciumDrive: number): number {
  assertNonNegativeFinite("calciumDrive", calciumDrive);
  if (calciumDrive === 0) return 0;
  const logRatio = FIXED_CONTRACTILE_HILL_MAPPING_V1.coefficient * Math.log(
    calciumDrive / FIXED_CONTRACTILE_HILL_MAPPING_V1.halfMaxCalciumDrive,
  );
  const hillDrive01 = logRatio >= 0
    ? 1 / (1 + Math.exp(-logRatio))
    : Math.exp(logRatio) / (1 + Math.exp(logRatio));
  assertUnitInterval("hillDrive01", hillDrive01);
  return hillDrive01;
}

/**
 * Exact solution for a step on which hillDrive01 is held constant:
 *   da/dt = kon h (1-a) - koff (1-h) a.
 *
 * No clipping is used: valid inputs make the update a convex combination of
 * the previous state and the constant-drive equilibrium.
 */
export function advanceContractileActivationExactV1(
  previous: EventDrivenContractileActivationStateV1,
  dtSec: number,
  hillDrive01: number,
  kinetics: EventDrivenContractileActivationParamsV1["contractileKinetics"],
): EventDrivenContractileActivationStateV1 {
  assertUnitInterval("previous.activation01", previous.activation01);
  assertPositiveFinite("dtSec", dtSec);
  assertUnitInterval("hillDrive01", hillDrive01);
  assertPositiveFinite("contractileKinetics.onRatePerSec", kinetics.onRatePerSec);
  assertPositiveFinite("contractileKinetics.offRatePerSec", kinetics.offRatePerSec);

  const onRate = kinetics.onRatePerSec * hillDrive01;
  const offRate = kinetics.offRatePerSec * (1 - hillDrive01);
  const totalRate = onRate + offRate;
  const equilibriumActivation01 = onRate / totalRate;
  const memory = Math.exp(-totalRate * dtSec);
  const activation01 = equilibriumActivation01 +
    (previous.activation01 - equilibriumActivation01) * memory;
  assertUnitInterval("activation01", activation01);
  return { activation01 };
}

/**
 * Event-to-state convenience step. The event drive is sampled at the midpoint,
 * then the bounded state is advanced exactly for that frozen drive.
 */
export function stepEventDrivenContractileActivationV1(
  previous: EventDrivenContractileActivationStateV1,
  input: EventDrivenContractileActivationStepInputV1,
  params: EventDrivenContractileActivationParamsV1,
): EventDrivenContractileActivationStepOutputV1 {
  validateEventDrivenContractileActivationParamsV1(params);
  assertUnitInterval("previous.activation01", previous.activation01);
  assertFinite("stepStartTimeSec", input.stepStartTimeSec);
  assertPositiveFinite("dtSec", input.dtSec);
  const stepEndTimeSec = input.stepStartTimeSec + input.dtSec;
  const driveSampleTimeSec = input.stepStartTimeSec + 0.5 * input.dtSec;
  if (!Number.isFinite(stepEndTimeSec) || !Number.isFinite(driveSampleTimeSec)) {
    throw new RangeError("step times must remain finite");
  }
  const calciumDrive = calciumDriveFromEventsV1(
    driveSampleTimeSec,
    input.events,
    params,
  );
  const hillDrive01 = fixedContractileHillDriveV1(calciumDrive);
  const onRate = params.contractileKinetics.onRatePerSec * hillDrive01;
  const offRate = params.contractileKinetics.offRatePerSec * (1 - hillDrive01);
  const totalRate = onRate + offRate;
  const constantDriveEquilibriumActivation01 = onRate / totalRate;
  const activationRateAtStepStartPerSec = onRate * (1 - previous.activation01) -
    offRate * previous.activation01;
  const state = advanceContractileActivationExactV1(
    previous,
    input.dtSec,
    hillDrive01,
    params.contractileKinetics,
  );
  return {
    state,
    stepStartTimeSec: input.stepStartTimeSec,
    stepEndTimeSec,
    driveSampleTimeSec,
    calciumDrive,
    hillDrive01,
    constantDriveEquilibriumActivation01,
    activationRateAtStepStartPerSec,
  };
}

/**
 * TTP/RT50 readback from a sampled contractile-state trace.
 * RT50 is measured relative to the interpolated event-time baseline, which
 * remains meaningful when an earlier event has not fully relaxed.
 */
export function measureActivationTimingV1(
  samples: readonly ActivationTimingSampleV1[],
  event: ElectricalActivationEventV1,
  params: Pick<
    EventDrivenContractileActivationParamsV1,
    "electricalEventReference" | "electricalToCalciumDelaySec"
  >,
): ActivationTimingReadbackV1 {
  if (samples.length < 2) {
    throw new RangeError("samples must contain at least two points");
  }
  assertFinite("event.timeSec", event.timeSec);
  if (!ELECTRICAL_EVENT_REFERENCES_V1.includes(params.electricalEventReference)) {
    throw new RangeError("electricalEventReference is invalid");
  }
  assertNonNegativeFinite(
    "electricalToCalciumDelaySec",
    params.electricalToCalciumDelaySec,
  );
  if (
    params.electricalEventReference === "prescribed-calcium-onset" &&
    params.electricalToCalciumDelaySec !== 0
  ) {
    throw new RangeError(
      "electricalToCalciumDelaySec must be zero for prescribed-calcium-onset events",
    );
  }
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!;
    assertFinite(`samples[${index}].timeSec`, sample.timeSec);
    assertUnitInterval(`samples[${index}].activation01`, sample.activation01);
    if (index > 0 && sample.timeSec <= samples[index - 1]!.timeSec) {
      throw new RangeError("sample times must be strictly increasing");
    }
  }
  const firstTimeSec = samples[0]!.timeSec;
  const lastTimeSec = samples[samples.length - 1]!.timeSec;
  if (event.timeSec < firstTimeSec || event.timeSec > lastTimeSec) {
    throw new RangeError("event.timeSec must lie within the sampled interval");
  }
  const baselineActivation01 = interpolateActivationAtTime(samples, event.timeSec);
  let peakIndex = samples.findIndex((sample) => sample.timeSec >= event.timeSec);
  for (let index = peakIndex + 1; index < samples.length; index += 1) {
    if (samples[index]!.activation01 > samples[peakIndex]!.activation01) {
      peakIndex = index;
    }
  }
  const peak = samples[peakIndex]!;
  if (peak.activation01 <= baselineActivation01) {
    throw new RangeError("samples must contain a positive post-event activation excursion");
  }
  const calciumOnsetTimeSec = event.timeSec + params.electricalToCalciumDelaySec;
  if (peak.timeSec < calciumOnsetTimeSec) {
    throw new RangeError("activation peak cannot precede calcium onset");
  }
  const halfRelaxationActivation01 = baselineActivation01 +
    0.5 * (peak.activation01 - baselineActivation01);
  let halfRelaxationTimeSec: number | null = null;
  for (let index = peakIndex + 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (
      previous.activation01 >= halfRelaxationActivation01 &&
      current.activation01 <= halfRelaxationActivation01
    ) {
      const activationDelta = current.activation01 - previous.activation01;
      halfRelaxationTimeSec = activationDelta === 0
        ? current.timeSec
        : previous.timeSec + (current.timeSec - previous.timeSec) *
          (halfRelaxationActivation01 - previous.activation01) / activationDelta;
      break;
    }
  }
  return {
    electricalEventReference: params.electricalEventReference,
    electricalEventTimeSec: event.timeSec,
    calciumOnsetTimeSec,
    baselineActivation01,
    peakActivation01: peak.activation01,
    peakTimeSec: peak.timeSec,
    timeFromElectricalEventToPeakSec: peak.timeSec - event.timeSec,
    timeFromCalciumOnsetToPeakSec: peak.timeSec - calciumOnsetTimeSec,
    halfRelaxationActivation01,
    halfRelaxationTimeSec,
    relaxationTimeTo50Sec: halfRelaxationTimeSec === null
      ? null
      : halfRelaxationTimeSec - peak.timeSec,
    reachedHalfRelaxation: halfRelaxationTimeSec !== null,
  };
}

function calciumKernelLogUnnormalized(
  timeSinceOnsetSec: number,
  riseTauSec: number,
  decayTauSec: number,
): number {
  const rise = -Math.expm1(-timeSinceOnsetSec / riseTauSec);
  return 2 * Math.log(rise) - timeSinceOnsetSec / decayTauSec;
}

function interpolateActivationAtTime(
  samples: readonly ActivationTimingSampleV1[],
  timeSec: number,
): number {
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index]!;
    if (current.timeSec === timeSec) return current.activation01;
    if (current.timeSec > timeSec) {
      const previous = samples[index - 1]!;
      const fraction = (timeSec - previous.timeSec) /
        (current.timeSec - previous.timeSec);
      return previous.activation01 +
        fraction * (current.activation01 - previous.activation01);
    }
  }
  return samples[samples.length - 1]!.activation01;
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

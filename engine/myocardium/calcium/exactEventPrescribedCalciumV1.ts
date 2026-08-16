export const EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID =
  "exact-event-two-decay-prescribed-calcium-v1" as const;

export const EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY_V1 = Object.freeze({
  prescribedTransient: true as const,
  exactBetweenEvents: true as const,
  additiveEvents: true as const,
  calciumCyclingClaimed: false as const,
  restitutionClaimed: false as const,
  refractorinessClaimed: false as const,
  pvLoopMorphologyFitAllowed: false as const,
});

/**
 * Both state components receive the same instantaneous event increment. Their
 * difference, and therefore the reported free calcium, is continuous across
 * an event. Between events each component follows its exact exponential flow.
 */
export type ExactEventCalciumStateV1 = readonly [
  riseDrive: number,
  decayDrive: number,
];

export type ExactEventCalciumParametersV1 = Readonly<{
  tauRiseSec: number;
  tauDecaySec: number;
  /** Calcium approached after a sufficiently long event-free interval. */
  calciumRestUM: number;
  /** Affine output gain multiplying decayDrive - riseDrive. */
  calciumGainUMPerUnitDrive: number;
}>;

export type ExactEventCalciumEventV1 = Readonly<{
  timeSec: number;
  strength: number;
}>;

export type ExactEventCalciumEvaluationV1 = Readonly<{
  freeCalciumUM: number;
  driveDifference: number;
  claimBoundary: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY_V1;
}>;

/**
 * Structural input accepted from the existing periodic biexponential driver.
 * Electrical-to-calcium delay is deliberately absent: the future event
 * scheduler, rather than this material kernel, owns event timing.
 */
export type PeriodicBiexponentialCalciumForExactEventConversionV1 = Readonly<{
  diastolicCalciumUM: number;
  peakAmplitudeUM: number;
  riseTimeConstantSec: number;
  decayTimeConstantSec: number;
}>;

export type PeriodicBiexponentialExactEventConversionV1 = Readonly<{
  parameters: ExactEventCalciumParametersV1;
  /** Period-one state immediately after the unit event at phase zero. */
  periodicStateImmediatelyAfterEvent: ExactEventCalciumStateV1;
  reference: Readonly<{
    cycleLengthSec: number;
    timeToPeakSec: number;
    eventTroughDriveDifference: number;
    peakDriveDifference: number;
    peakToTroughDriveExcursion: number;
  }>;
}>;

/**
 * Canonical precision for transcendental-derived persisted parameters.
 *
 * ECMAScript permits small implementation differences in Math.exp/log/expm1.
 * Values that become part of an exact checkpoint configuration therefore
 * cross a decimal significant-digit boundary before they are persisted or
 * hashed. Twelve digits retain far more precision than the physiological
 * priors justify while absorbing observed cross-runtime ULP differences.
 */
export const EXACT_EVENT_CALCIUM_CANONICAL_SIGNIFICANT_DIGITS_V1 = 12;

export function canonicalizeDerivedExactEventCalciumParameterV1(
  value: number,
): number {
  const finite = requireNonnegativeFinite(value, "derived calcium parameter");
  const canonical = Number(
    finite.toPrecision(EXACT_EVENT_CALCIUM_CANONICAL_SIGNIFICANT_DIGITS_V1),
  );
  return Object.is(canonical, -0) ? 0 : canonical;
}

export function zeroExactEventCalciumStateV1(): ExactEventCalciumStateV1 {
  return frozenState(0, 0);
}

export function propagateExactEventCalciumV1(
  state: ExactEventCalciumStateV1,
  durationSec: number,
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumStateV1 {
  const [riseDrive, decayDrive] = validateState(state, "state");
  const duration = requireNonnegativeFinite(durationSec, "durationSec");
  validateParameters(parameters);
  return frozenState(
    riseDrive * Math.exp(-duration / parameters.tauRiseSec),
    decayDrive * Math.exp(-duration / parameters.tauDecaySec),
  );
}

export function applyExactEventCalciumStimulusV1(
  stateBeforeEvent: ExactEventCalciumStateV1,
  strength: number,
): ExactEventCalciumStateV1 {
  const [riseDrive, decayDrive] = validateState(
    stateBeforeEvent,
    "stateBeforeEvent",
  );
  const increment = requireNonnegativeFinite(strength, "strength");
  return frozenState(riseDrive + increment, decayDrive + increment);
}

/**
 * The interval-start state is right-continuous, so this function owns events
 * in (startTimeSec, endTimeSec]. Coincident events are reduced to one
 * deterministic additive increment; their input order cannot affect output.
 */
export function advanceExactEventCalciumV1(
  stateAtStart: ExactEventCalciumStateV1,
  startTimeSec: number,
  endTimeSec: number,
  events: readonly ExactEventCalciumEventV1[],
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumStateV1 {
  let state = validateState(stateAtStart, "stateAtStart");
  const start = requireNonnegativeFinite(startTimeSec, "startTimeSec");
  const end = requireNonnegativeFinite(endTimeSec, "endTimeSec");
  if (end < start) {
    throw new Error(
      "endTimeSec must be greater than or equal to startTimeSec",
    );
  }
  validateParameters(parameters);
  validateDenseArray(events, "events");

  let cursor = start;
  let eventIndex = 0;
  while (eventIndex < events.length) {
    const event = validateEvent(events[eventIndex], `events[${eventIndex}]`);
    if (event.timeSec <= start || event.timeSec > end) {
      throw new Error(
        "advanceExactEventCalciumV1 requires event times in "
          + "(startTimeSec, endTimeSec]",
      );
    }
    if (event.timeSec < cursor) {
      throw new Error("events must be ordered by nondecreasing timeSec");
    }

    state = propagateExactEventCalciumV1(
      state,
      event.timeSec - cursor,
      parameters,
    );
    const coincidentStrengths: number[] = [];
    const coincidentTimeSec = event.timeSec;
    while (eventIndex < events.length) {
      const coincident = validateEvent(
        events[eventIndex],
        `events[${eventIndex}]`,
      );
      if (coincident.timeSec !== coincidentTimeSec) break;
      coincidentStrengths.push(coincident.strength);
      eventIndex += 1;
    }
    state = applyExactEventCalciumStimulusV1(
      state,
      deterministicNonnegativeSum(coincidentStrengths),
    );
    cursor = coincidentTimeSec;
  }

  return propagateExactEventCalciumV1(state, end - cursor, parameters);
}

export function evaluateExactEventCalciumV1(
  state: ExactEventCalciumStateV1,
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumEvaluationV1 {
  const [riseDrive, decayDrive] = validateState(state, "state");
  validateParameters(parameters);
  const driveDifference = decayDrive - riseDrive;
  const freeCalciumUM = parameters.calciumRestUM
    + parameters.calciumGainUMPerUnitDrive * driveDifference;
  if (!Number.isFinite(freeCalciumUM) || freeCalciumUM < 0) {
    throw new Error("freeCalciumUM must remain nonnegative and finite");
  }
  return Object.freeze({
    freeCalciumUM,
    driveDifference,
    claimBoundary: EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY_V1,
  });
}

/**
 * Analytically embeds the existing regular-period biexponential waveform in
 * the event-state coordinates. No parameter search is performed.
 *
 * The old "diastolic calcium" is the trough under its reference periodic
 * schedule. The event kernel instead owns a true event-free asymptote. The
 * affine output offset below converts between those two meanings while
 * preserving the complete reference waveform to the canonical derived-
 * parameter precision used by exact cross-runtime checkpoints.
 */
export function convertPeriodicBiexponentialToExactEventCalciumV1(
  periodic: PeriodicBiexponentialCalciumForExactEventConversionV1,
  cycleLengthSec: number,
): PeriodicBiexponentialExactEventConversionV1 {
  validatePeriodicInput(periodic);
  const cycle = requirePositiveFinite(cycleLengthSec, "cycleLengthSec");
  const tauRiseSec = periodic.riseTimeConstantSec;
  const tauDecaySec = periodic.decayTimeConstantSec;
  const riseCarry = 1 / -Math.expm1(-cycle / tauRiseSec);
  const decayCarry = 1 / -Math.expm1(-cycle / tauDecaySec);
  const periodicStateImmediatelyAfterEvent = frozenState(riseCarry, decayCarry);
  const timeToPeakSec = Math.log(
    (riseCarry / tauRiseSec) / (decayCarry / tauDecaySec),
  ) / (1 / tauRiseSec - 1 / tauDecaySec);
  if (
    !(timeToPeakSec >= 0 && timeToPeakSec <= cycle)
    || !Number.isFinite(timeToPeakSec)
  ) {
    throw new Error(
      "periodic biexponential peak must lie within the reference cycle",
    );
  }
  const eventTroughDriveDifference = decayCarry - riseCarry;
  const peakState = frozenState(
    riseCarry * Math.exp(-timeToPeakSec / tauRiseSec),
    decayCarry * Math.exp(-timeToPeakSec / tauDecaySec),
  );
  const peakDriveDifference = peakState[1] - peakState[0];
  const peakToTroughDriveExcursion = peakDriveDifference
    - eventTroughDriveDifference;
  if (
    !(peakToTroughDriveExcursion > 0)
    || !Number.isFinite(peakToTroughDriveExcursion)
  ) {
    throw new Error(
      "periodic biexponential must have a positive peak-to-trough excursion",
    );
  }
  const calciumGainUMPerUnitDrive =
    canonicalizeDerivedExactEventCalciumParameterV1(
      periodic.peakAmplitudeUM / peakToTroughDriveExcursion,
    );
  const calciumRestUM = canonicalizeDerivedExactEventCalciumParameterV1(
    periodic.diastolicCalciumUM
      - calciumGainUMPerUnitDrive * eventTroughDriveDifference,
  );
  if (calciumRestUM < 0 || !Number.isFinite(calciumRestUM)) {
    throw new Error(
      "exact periodic conversion would require negative event-free resting calcium",
    );
  }
  const parameters = Object.freeze({
    tauRiseSec,
    tauDecaySec,
    calciumRestUM,
    calciumGainUMPerUnitDrive,
  });
  validateParameters(parameters);
  return Object.freeze({
    parameters,
    periodicStateImmediatelyAfterEvent,
    reference: Object.freeze({
      cycleLengthSec: cycle,
      timeToPeakSec,
      eventTroughDriveDifference,
      peakDriveDifference,
      peakToTroughDriveExcursion,
    }),
  });
}

function validateParameters(parameters: ExactEventCalciumParametersV1): void {
  requirePositiveFinite(parameters.tauRiseSec, "parameters.tauRiseSec");
  requirePositiveFinite(parameters.tauDecaySec, "parameters.tauDecaySec");
  if (!(parameters.tauDecaySec > parameters.tauRiseSec)) {
    throw new Error("parameters.tauDecaySec must exceed parameters.tauRiseSec");
  }
  requireNonnegativeFinite(parameters.calciumRestUM, "parameters.calciumRestUM");
  requireNonnegativeFinite(
    parameters.calciumGainUMPerUnitDrive,
    "parameters.calciumGainUMPerUnitDrive",
  );
}

function validatePeriodicInput(
  periodic: PeriodicBiexponentialCalciumForExactEventConversionV1,
): void {
  requireNonnegativeFinite(
    periodic.diastolicCalciumUM,
    "periodic.diastolicCalciumUM",
  );
  requireNonnegativeFinite(periodic.peakAmplitudeUM, "periodic.peakAmplitudeUM");
  requirePositiveFinite(
    periodic.riseTimeConstantSec,
    "periodic.riseTimeConstantSec",
  );
  requirePositiveFinite(
    periodic.decayTimeConstantSec,
    "periodic.decayTimeConstantSec",
  );
  if (!(periodic.decayTimeConstantSec > periodic.riseTimeConstantSec)) {
    throw new Error(
      "periodic.decayTimeConstantSec must exceed periodic.riseTimeConstantSec",
    );
  }
}

function validateState(
  state: ExactEventCalciumStateV1,
  field: string,
): ExactEventCalciumStateV1 {
  validateDenseArray(state, field);
  if (state.length !== 2) {
    throw new Error(`${field} must contain [riseDrive, decayDrive]`);
  }
  const riseDrive = requireNonnegativeFinite(state[0], `${field}[0]`);
  const decayDrive = requireNonnegativeFinite(state[1], `${field}[1]`);
  if (decayDrive < riseDrive) {
    throw new Error(`${field} must satisfy decayDrive >= riseDrive`);
  }
  return frozenState(riseDrive, decayDrive);
}

function validateEvent(
  event: ExactEventCalciumEventV1,
  field: string,
): ExactEventCalciumEventV1 {
  if (event === null || typeof event !== "object" || Array.isArray(event)) {
    throw new Error(`${field} must be an object`);
  }
  const keys = Object.keys(event);
  if (keys.length !== 2 || !keys.includes("timeSec") || !keys.includes("strength")) {
    throw new Error(`${field} must contain exactly timeSec and strength`);
  }
  requireNonnegativeFinite(event.timeSec, `${field}.timeSec`);
  requireNonnegativeFinite(event.strength, `${field}.strength`);
  return event;
}

function deterministicNonnegativeSum(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right);
  let sum = 0;
  let compensation = 0;
  for (const value of ordered) {
    const corrected = value - compensation;
    const next = sum + corrected;
    compensation = (next - sum) - corrected;
    sum = next;
  }
  return requireNonnegativeFinite(sum, "coincident event strength sum");
}

function frozenState(
  riseDrive: number,
  decayDrive: number,
): ExactEventCalciumStateV1 {
  if (!Number.isFinite(riseDrive) || !Number.isFinite(decayDrive)) {
    throw new Error("exact-event calcium state must remain finite");
  }
  return Object.freeze([riseDrive, decayDrive] as [number, number]);
}

function validateDenseArray(value: readonly unknown[], field: string): void {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new Error(`${field} must not contain holes`);
    }
  }
}

function requirePositiveFinite(value: number, field: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: number, field: string): number {
  if (value < 0 || !Number.isFinite(value)) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

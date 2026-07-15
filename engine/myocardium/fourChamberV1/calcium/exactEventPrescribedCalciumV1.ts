export const EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID =
  "event-two-exponential-prescribed-calcium-v1" as const;
export const EXACT_EVENT_PRESCRIBED_CALCIUM_EQUATIONS_V1 =
  "exact-event-two-state-dimensional-calcium-v1" as const;
export const EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY =
  "prescribed-measured-transient-not-conserved-calcium-cycling" as const;

export type ExactEventCalciumParametersV1 = {
  readonly tauRiseSec: number;
  readonly tauDecaySec: number;
  readonly calciumDiastolicUM: number;
  readonly calciumAmplitudeUM: number;
  readonly electricalToCalciumDelaySec: number;
  readonly status: "candidate-prior";
  readonly evidenceId: string;
};

export type ExactEventCalciumStateV1 = readonly [riseDrive: number, decayDrive: number];

export type ElectricalActivationEventV1 = {
  readonly eventId: string;
  readonly electricalTimeSec: number;
  readonly strength: number;
};

export type CalciumDriveEventV1 = {
  readonly eventId: string;
  readonly calciumDriveTimeSec: number;
  readonly strength: number;
  readonly timingOwner: "tissue-manifest-electrical-to-calcium-delay";
};

export type ExactEventCalciumEvaluationV1 = {
  readonly riseDrive: number;
  readonly decayDrive: number;
  readonly normalizedTransient: number;
  readonly freeCalciumUM: number;
  readonly isolatedUnitPeakTimeSec: number;
  readonly normalization: number;
  readonly claimBoundary: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY;
};

/**
 * The state at an interval start is right-continuous: every event at that time
 * has already been applied. This routine therefore owns events in (start, end].
 */
export function advanceExactEventCalciumV1(
  stateAtStart: ExactEventCalciumStateV1,
  startTimeSec: number,
  endTimeSec: number,
  events: readonly CalciumDriveEventV1[],
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumStateV1 {
  validateExactEventCalciumParametersV1(parameters);
  let state = validateCalciumState(stateAtStart, "stateAtStart");
  const start = requireNonNegativeFinite(startTimeSec, "startTimeSec");
  const end = requireNonNegativeFinite(endTimeSec, "endTimeSec");
  if (end < start) throw new Error("endTimeSec must be greater than or equal to startTimeSec");
  validateClosedDenseArray(events, "events");

  let cursor = start;
  let previousEventTime = start;
  const eventIds = new Set<string>();
  for (let index = 0; index < events.length; index += 1) {
    const event = validateCalciumDriveEvent(events[index], `events[${index}]`);
    if (eventIds.has(event.eventId)) throw new Error(`events contains duplicate eventId ${event.eventId}`);
    eventIds.add(event.eventId);
    if (event.calciumDriveTimeSec <= start || event.calciumDriveTimeSec > end) {
      throw new Error("advanceExactEventCalciumV1 requires every event time to lie in (startTimeSec, endTimeSec]");
    }
    if (event.calciumDriveTimeSec < previousEventTime) {
      throw new Error("events must be ordered by nondecreasing calciumDriveTimeSec");
    }
    state = propagateExactEventCalciumV1(
      state,
      event.calciumDriveTimeSec - cursor,
      parameters,
    );
    state = applyExactCalciumDriveEventV1(state, event);
    cursor = event.calciumDriveTimeSec;
    previousEventTime = event.calciumDriveTimeSec;
  }
  return propagateExactEventCalciumV1(state, end - cursor, parameters);
}

export function propagateExactEventCalciumV1(
  state: ExactEventCalciumStateV1,
  durationSec: number,
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumStateV1 {
  validateExactEventCalciumParametersV1(parameters);
  const [riseDrive, decayDrive] = validateCalciumState(state, "state");
  const duration = requireNonNegativeFinite(durationSec, "durationSec");
  return frozenState(
    riseDrive * Math.exp(-duration / parameters.tauRiseSec),
    decayDrive * Math.exp(-duration / parameters.tauDecaySec),
  );
}

export function applyExactCalciumDriveEventV1(
  stateBeforeEvent: ExactEventCalciumStateV1,
  event: CalciumDriveEventV1,
): ExactEventCalciumStateV1 {
  const [riseDrive, decayDrive] = validateCalciumState(stateBeforeEvent, "stateBeforeEvent");
  const validated = validateCalciumDriveEvent(event, "event");
  return frozenState(riseDrive + validated.strength, decayDrive + validated.strength);
}

export function calciumDriveEventFromElectricalV1(
  electricalEvent: ElectricalActivationEventV1,
  parameters: ExactEventCalciumParametersV1,
): Readonly<CalciumDriveEventV1> {
  validateExactEventCalciumParametersV1(parameters);
  assertExactKeys(
    electricalEvent,
    ["eventId", "electricalTimeSec", "strength"],
    "electricalEvent",
  );
  const eventId = requireNonEmptyString(electricalEvent.eventId, "electricalEvent.eventId");
  const electricalTimeSec = requireNonNegativeFinite(
    electricalEvent.electricalTimeSec,
    "electricalEvent.electricalTimeSec",
  );
  const strength = requireNonNegativeFinite(electricalEvent.strength, "electricalEvent.strength");
  const calciumDriveTimeSec = electricalTimeSec + parameters.electricalToCalciumDelaySec;
  if (!Number.isFinite(calciumDriveTimeSec)) throw new Error("calciumDriveTimeSec must be finite");
  return Object.freeze({
    eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

export function evaluateExactEventCalciumV1(
  state: ExactEventCalciumStateV1,
  parameters: ExactEventCalciumParametersV1,
): Readonly<ExactEventCalciumEvaluationV1> {
  validateExactEventCalciumParametersV1(parameters);
  const [riseDrive, decayDrive] = validateCalciumState(state, "state");
  const { peakTimeSec, normalization } = exactEventCalciumNormalizationV1(parameters);
  const normalizedTransient = (decayDrive - riseDrive) / normalization;
  const freeCalciumUM = parameters.calciumDiastolicUM
    + parameters.calciumAmplitudeUM * normalizedTransient;
  if (!Number.isFinite(normalizedTransient) || !Number.isFinite(freeCalciumUM)) {
    throw new Error("Exact event calcium evaluation must remain finite");
  }
  if (freeCalciumUM <= 0) {
    throw new Error("Exact event calcium freeCalciumUM must remain positive");
  }
  return Object.freeze({
    riseDrive,
    decayDrive,
    normalizedTransient,
    freeCalciumUM,
    isolatedUnitPeakTimeSec: peakTimeSec,
    normalization,
    claimBoundary: EXACT_EVENT_PRESCRIBED_CALCIUM_CLAIM_BOUNDARY,
  });
}

export function exactEventCalciumNormalizationV1(
  parameters: ExactEventCalciumParametersV1,
): Readonly<{ peakTimeSec: number; normalization: number }> {
  validateExactEventCalciumParametersV1(parameters);
  const { tauRiseSec, tauDecaySec } = parameters;
  const relativeSeparation = (tauDecaySec - tauRiseSec) / tauRiseSec;
  const peakTimeSec = (tauDecaySec / relativeSeparation) * Math.log1p(relativeSeparation);
  const decayAtPeak = Math.exp(-peakTimeSec / tauDecaySec);
  const exponentDifference = -peakTimeSec * relativeSeparation / tauDecaySec;
  const normalization = decayAtPeak * -Math.expm1(exponentDifference);
  if (!(peakTimeSec > 0) || !(normalization > 0)
    || !Number.isFinite(peakTimeSec) || !Number.isFinite(normalization)) {
    throw new Error("Exact event calcium normalization must be positive and finite");
  }
  return Object.freeze({ peakTimeSec, normalization });
}

export function validateExactEventCalciumParametersV1(
  parameters: ExactEventCalciumParametersV1,
): ExactEventCalciumParametersV1 {
  assertExactKeys(parameters, [
    "tauRiseSec",
    "tauDecaySec",
    "calciumDiastolicUM",
    "calciumAmplitudeUM",
    "electricalToCalciumDelaySec",
    "status",
    "evidenceId",
  ], "parameters");
  const tauRiseSec = requirePositiveFinite(parameters.tauRiseSec, "parameters.tauRiseSec");
  const tauDecaySec = requirePositiveFinite(parameters.tauDecaySec, "parameters.tauDecaySec");
  if (tauRiseSec >= tauDecaySec) throw new Error("parameters requires 0 < tauRiseSec < tauDecaySec");
  requirePositiveFinite(parameters.calciumDiastolicUM, "parameters.calciumDiastolicUM");
  requireNonNegativeFinite(parameters.calciumAmplitudeUM, "parameters.calciumAmplitudeUM");
  requireNonNegativeFinite(
    parameters.electricalToCalciumDelaySec,
    "parameters.electricalToCalciumDelaySec",
  );
  if (parameters.status !== "candidate-prior") throw new Error("parameters.status must be candidate-prior");
  requireNonEmptyString(parameters.evidenceId, "parameters.evidenceId");
  return parameters;
}

export function zeroExactEventCalciumStateV1(): ExactEventCalciumStateV1 {
  return frozenState(0, 0);
}

function validateCalciumDriveEvent(event: CalciumDriveEventV1, field: string): CalciumDriveEventV1 {
  assertExactKeys(event, ["eventId", "calciumDriveTimeSec", "strength", "timingOwner"], field);
  requireNonEmptyString(event.eventId, `${field}.eventId`);
  requireNonNegativeFinite(event.calciumDriveTimeSec, `${field}.calciumDriveTimeSec`);
  requireNonNegativeFinite(event.strength, `${field}.strength`);
  if (event.timingOwner !== "tissue-manifest-electrical-to-calcium-delay") {
    throw new Error(`${field}.timingOwner is invalid`);
  }
  return event;
}

function validateCalciumState(state: ExactEventCalciumStateV1, field: string): ExactEventCalciumStateV1 {
  validateClosedDenseArray(state, field);
  if (state.length !== 2) throw new Error(`${field} must contain exactly [riseDrive, decayDrive]`);
  const riseDrive = requireNonNegativeFinite(state[0], `${field}[0]`);
  const decayDrive = requireNonNegativeFinite(state[1], `${field}[1]`);
  if (decayDrive < riseDrive) {
    throw new Error(`${field} must satisfy the reachable-domain invariant decayDrive >= riseDrive`);
  }
  return frozenState(riseDrive, decayDrive);
}

function frozenState(riseDrive: number, decayDrive: number): ExactEventCalciumStateV1 {
  if (!Number.isFinite(riseDrive) || !Number.isFinite(decayDrive)) {
    throw new Error("Exact event calcium state must remain finite");
  }
  return Object.freeze([riseDrive, decayDrive] as [number, number]);
}

function assertExactKeys(value: object, keys: readonly string[], field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const expected = new Set(keys);
  const actual = ownKeys as string[];
  const unknown = actual.filter((key) => !expected.has(key));
  const missing = keys.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
}

function validateClosedDenseArray(value: readonly unknown[], field: string): void {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${field} must be a plain array`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${field} must not contain symbol keys`);
    if (key === "length") continue;
    if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) {
      throw new Error(`${field} contains an extra array property ${key}`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}[${key}] must be an enumerable data property`);
    }
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${field} must not contain sparse-array holes`);
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be non-negative and finite`);
  }
  return value;
}

import {
  applyExactCalciumDriveEventV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  validateExactEventCalciumParametersV1,
  type CalciumDriveEventV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID =
  "phase-b1-exact-calcium-event-transaction-component-v1" as const;

export const PHASE_B1_PRE_JUMP_FORCING_SIDE_V1 =
  "pre-jump-left-limit" as const;

export type PhaseB1AtomicStepInputV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  forcingSide: typeof PHASE_B1_PRE_JUMP_FORCING_SIDE_V1;
  calciumDriveStateAtStart: ExactEventCalciumStateV1;
  calciumDriveStateAtEndLeftLimit: ExactEventCalciumStateV1;
  knownFreeCalciumUMAtEndLeftLimit: number;
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicStateAtStart: readonly number[];
}>;

export type PhaseB1AtomicStepResultV1 =
  | Readonly<{
    accepted: true;
    nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
    algebraicStateAtEndLeftLimit: readonly number[];
  }>
  | Readonly<{
    accepted: false;
    failureReason: string;
  }>;

/**
 * Candidate evaluation only. The callback MUST be side-effect-free with
 * respect to model and solver state; this component can return a rollback
 * snapshot, but cannot undo mutations of callback-owned external state.
 */
export type PhaseB1AtomicStepCallbackV1 = (
  input: PhaseB1AtomicStepInputV1,
) => PhaseB1AtomicStepResultV1;

export type PhaseB1AlgebraicReinitializationInputV1 = Readonly<{
  timeSec: number;
  eventIds: readonly string[];
  eventCount: number;
  aggregateEventStrength: number;
  calciumDriveStateAtEndLeftLimit: ExactEventCalciumStateV1;
  calciumDriveStateAfterEventBatch: ExactEventCalciumStateV1;
  freeCalciumUMAfterEventBatch: number;
  nonCalciumDifferentialStateAtAcceptedEnd: readonly number[];
  algebraicStateAtEndLeftLimit: readonly number[];
}>;

export type PhaseB1AlgebraicReinitializationResultV1 =
  | Readonly<{
    accepted: true;
    algebraicStateAfterReinitialization: readonly number[];
  }>
  | Readonly<{
    accepted: false;
    failureReason: string;
  }>;

/**
 * Candidate evaluation only. The callback MUST be side-effect-free with
 * respect to model and solver state. Commit occurs only after this result has
 * passed closed-record and finite-vector validation.
 */
export type PhaseB1AlgebraicReinitializationCallbackV1 = (
  input: PhaseB1AlgebraicReinitializationInputV1,
) => PhaseB1AlgebraicReinitializationResultV1;

export type PhaseB1ExactCalciumEventTransactionInputV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  calciumDriveStateAtStart: ExactEventCalciumStateV1;
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicStateAtStart: readonly number[];
  coincidentEventsAtEnd: readonly CalciumDriveEventV1[];
  calciumParameters: ExactEventCalciumParametersV1;
  atomicStep: PhaseB1AtomicStepCallbackV1;
  reinitializeAlgebraicState: PhaseB1AlgebraicReinitializationCallbackV1;
}>;

type PhaseB1ExactCalciumEventTransactionCommonV1 = Readonly<{
  componentId: typeof PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID;
  implementationStatus:
    "single-wall-pair-event-component-not-whole-heart-monolithic-phase-b1";
  scope: "single-wall-calcium-pair";
  callbackContract: "side-effect-free-candidate-evaluation";
  forcingSide: typeof PHASE_B1_PRE_JUMP_FORCING_SIDE_V1;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  eventIds: readonly string[];
  eventCount: number;
  aggregateEventStrength: number;
  calciumDriveStateAtStart: ExactEventCalciumStateV1;
  calciumDriveStateAtEndLeftLimit: ExactEventCalciumStateV1;
  knownFreeCalciumUMAtEndLeftLimit: number;
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicStateAtStart: readonly number[];
  monolithicSlsOnUnknownCount51Implemented: false;
  monolithicSlsOffUnknownCount46Implemented: false;
}>;

export type PhaseB1ExactCalciumEventTransactionSuccessV1 =
  PhaseB1ExactCalciumEventTransactionCommonV1 & Readonly<{
    ok: true;
    eventBatchMode: "single-aggregate-jump" | "empty-batch-no-jump";
    eventBatchCommitted: boolean;
    calciumDriveStateAfterEventBatch: ExactEventCalciumStateV1;
    freeCalciumUMAfterEventBatch: number;
    nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
    nonCalciumDifferentialStateAfterEventBatch: readonly number[];
    nonCalciumDifferentialStateChangedByEventBatch: false;
    algebraicStateAtEndLeftLimit: readonly number[];
    algebraicStateAfterReinitialization: readonly number[];
    atomicStepCallCount: 1;
    algebraicReinitializationCallCount: 0 | 1;
    rollbackSnapshotReturned: false;
  }>;

export type PhaseB1ExactCalciumEventTransactionFailureV1 =
  PhaseB1ExactCalciumEventTransactionCommonV1 & Readonly<{
    ok: false;
    failureStage: "atomic-step" | "algebraic-reinitialization";
    failureReason: string;
    eventBatchCommitted: false;
    calciumDriveStateRollbackSnapshot: ExactEventCalciumStateV1;
    nonCalciumDifferentialStateRollbackSnapshot: readonly number[];
    algebraicStateRollbackSnapshot: readonly number[];
    atomicStepCallCount: 1;
    algebraicReinitializationCallCount: 0 | 1;
    rollbackSnapshotReturned: true;
  }>;

export type PhaseB1ExactCalciumEventTransactionResultV1 =
  | PhaseB1ExactCalciumEventTransactionSuccessV1
  | PhaseB1ExactCalciumEventTransactionFailureV1;

/**
 * Executes one event-free implicit substep for one wall calcium pair through
 * the left limit, accepts it, then applies that pair's coincident endpoint
 * event batch and reinitializes only the algebraic state. Empty batches skip
 * reinitialization and preserve the accepted left-limit algebraic state.
 *
 * Both callbacks MUST be side-effect-free candidate evaluations. A failure
 * returns immutable start-state snapshots; it cannot undo callback-owned
 * external mutations. No whole-heart five-wall transaction, residual, or
 * 51/46-unknown solve is provided here.
 */
export function runPhaseB1ExactCalciumEventTransactionV1(
  input: PhaseB1ExactCalciumEventTransactionInputV1,
): PhaseB1ExactCalciumEventTransactionResultV1 {
  const validated = validateTransactionInput(input);
  const calciumDriveStateAtEndLeftLimit = propagateExactEventCalciumV1(
    validated.calciumDriveStateAtStart,
    validated.durationSec,
    validated.calciumParameters,
  );
  const leftLimitEvaluation = evaluateExactEventCalciumV1(
    calciumDriveStateAtEndLeftLimit,
    validated.calciumParameters,
  );
  const common = commonResultFields(
    validated,
    calciumDriveStateAtEndLeftLimit,
    leftLimitEvaluation.freeCalciumUM,
  );
  const atomicStepInput = deepFreeze({
    startTimeSec: validated.startTimeSec,
    endTimeSec: validated.endTimeSec,
    durationSec: validated.durationSec,
    forcingSide: PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
    calciumDriveStateAtStart: validated.calciumDriveStateAtStart,
    calciumDriveStateAtEndLeftLimit,
    knownFreeCalciumUMAtEndLeftLimit: leftLimitEvaluation.freeCalciumUM,
    nonCalciumDifferentialStateAtStart:
      validated.nonCalciumDifferentialStateAtStart,
    algebraicStateAtStart: validated.algebraicStateAtStart,
  } satisfies PhaseB1AtomicStepInputV1);

  let atomicRaw: PhaseB1AtomicStepResultV1;
  try {
    atomicRaw = validated.atomicStep(atomicStepInput);
  } catch (error) {
    return callbackFailure(common, validated, "atomic-step", errorMessage(error), 0);
  }
  let atomic: Readonly<{
    nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
    algebraicStateAtEndLeftLimit: readonly number[];
  }>;
  try {
    atomic = validateAcceptedAtomicResult(
      atomicRaw,
      validated.nonCalciumDifferentialStateAtStart.length,
      validated.algebraicStateAtStart.length,
    );
  } catch (error) {
    return callbackFailure(common, validated, "atomic-step", errorMessage(error), 0);
  }

  if (validated.events.length === 0) {
    return deepFreeze({
      ...common,
      ok: true,
      eventBatchMode: "empty-batch-no-jump",
      eventBatchCommitted: false,
      calciumDriveStateAfterEventBatch: calciumDriveStateAtEndLeftLimit,
      freeCalciumUMAfterEventBatch: leftLimitEvaluation.freeCalciumUM,
      nonCalciumDifferentialStateAtEndLeftLimit:
        atomic.nonCalciumDifferentialStateAtEndLeftLimit,
      nonCalciumDifferentialStateAfterEventBatch:
        atomic.nonCalciumDifferentialStateAtEndLeftLimit,
      nonCalciumDifferentialStateChangedByEventBatch: false,
      algebraicStateAtEndLeftLimit: atomic.algebraicStateAtEndLeftLimit,
      algebraicStateAfterReinitialization: atomic.algebraicStateAtEndLeftLimit,
      atomicStepCallCount: 1,
      algebraicReinitializationCallCount: 0,
      rollbackSnapshotReturned: false,
    } satisfies PhaseB1ExactCalciumEventTransactionSuccessV1);
  }

  const calciumDriveStateAfterEventBatch = applyValidatedEventBatch(
    calciumDriveStateAtEndLeftLimit,
    validated,
  );
  const postBatchEvaluation = evaluateExactEventCalciumV1(
    calciumDriveStateAfterEventBatch,
    validated.calciumParameters,
  );
  const reinitializationInput = deepFreeze({
    timeSec: validated.endTimeSec,
    eventIds: validated.eventIds,
    eventCount: validated.events.length,
    aggregateEventStrength: validated.aggregateEventStrength,
    calciumDriveStateAtEndLeftLimit,
    calciumDriveStateAfterEventBatch,
    freeCalciumUMAfterEventBatch: postBatchEvaluation.freeCalciumUM,
    nonCalciumDifferentialStateAtAcceptedEnd:
      atomic.nonCalciumDifferentialStateAtEndLeftLimit,
    algebraicStateAtEndLeftLimit: atomic.algebraicStateAtEndLeftLimit,
  } satisfies PhaseB1AlgebraicReinitializationInputV1);

  let reinitializationRaw: PhaseB1AlgebraicReinitializationResultV1;
  try {
    reinitializationRaw = validated.reinitializeAlgebraicState(
      reinitializationInput,
    );
  } catch (error) {
    return callbackFailure(
      common,
      validated,
      "algebraic-reinitialization",
      errorMessage(error),
      1,
    );
  }
  let algebraicStateAfterReinitialization: readonly number[];
  try {
    algebraicStateAfterReinitialization = validateAcceptedReinitializationResult(
      reinitializationRaw,
      validated.algebraicStateAtStart.length,
    );
  } catch (error) {
    return callbackFailure(
      common,
      validated,
      "algebraic-reinitialization",
      errorMessage(error),
      1,
    );
  }

  return deepFreeze({
    ...common,
    ok: true,
    eventBatchMode: "single-aggregate-jump",
    eventBatchCommitted: true,
    calciumDriveStateAfterEventBatch,
    freeCalciumUMAfterEventBatch: postBatchEvaluation.freeCalciumUM,
    nonCalciumDifferentialStateAtEndLeftLimit:
      atomic.nonCalciumDifferentialStateAtEndLeftLimit,
    nonCalciumDifferentialStateAfterEventBatch:
      atomic.nonCalciumDifferentialStateAtEndLeftLimit,
    nonCalciumDifferentialStateChangedByEventBatch: false,
    algebraicStateAtEndLeftLimit: atomic.algebraicStateAtEndLeftLimit,
    algebraicStateAfterReinitialization,
    atomicStepCallCount: 1,
    algebraicReinitializationCallCount: 1,
    rollbackSnapshotReturned: false,
  } satisfies PhaseB1ExactCalciumEventTransactionSuccessV1);
}

type ValidatedTransactionInputV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  calciumDriveStateAtStart: ExactEventCalciumStateV1;
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicStateAtStart: readonly number[];
  events: readonly Readonly<CalciumDriveEventV1>[];
  eventIds: readonly string[];
  aggregateEventStrength: number;
  calciumParameters: ExactEventCalciumParametersV1;
  atomicStep: PhaseB1AtomicStepCallbackV1;
  reinitializeAlgebraicState: PhaseB1AlgebraicReinitializationCallbackV1;
}>;

function validateTransactionInput(
  input: PhaseB1ExactCalciumEventTransactionInputV1,
): ValidatedTransactionInputV1 {
  assertExactPlainRecordV1(input, [
    "startTimeSec",
    "endTimeSec",
    "calciumDriveStateAtStart",
    "nonCalciumDifferentialStateAtStart",
    "algebraicStateAtStart",
    "coincidentEventsAtEnd",
    "calciumParameters",
    "atomicStep",
    "reinitializeAlgebraicState",
  ], "Phase B1 exact-calcium event transaction input");
  const startTimeSec = requireNonNegativeFinite(input.startTimeSec, "startTimeSec");
  const endTimeSec = requireNonNegativeFinite(input.endTimeSec, "endTimeSec");
  if (endTimeSec <= startTimeSec) {
    throw new Error("endTimeSec must be greater than startTimeSec");
  }
  const calciumDriveStateAtStart = validateCalciumStateCopy(
    input.calciumDriveStateAtStart,
    "calciumDriveStateAtStart",
  );
  const nonCalciumDifferentialStateAtStart = finiteVectorCopy(
    input.nonCalciumDifferentialStateAtStart,
    "nonCalciumDifferentialStateAtStart",
  );
  const algebraicStateAtStart = finiteVectorCopy(
    input.algebraicStateAtStart,
    "algebraicStateAtStart",
  );
  validateExactEventCalciumParametersV1(input.calciumParameters);
  const calciumParameters: ExactEventCalciumParametersV1 = Object.freeze({
    tauRiseSec: input.calciumParameters.tauRiseSec,
    tauDecaySec: input.calciumParameters.tauDecaySec,
    calciumDiastolicUM: input.calciumParameters.calciumDiastolicUM,
    calciumAmplitudeUM: input.calciumParameters.calciumAmplitudeUM,
    electricalToCalciumDelaySec:
      input.calciumParameters.electricalToCalciumDelaySec,
    status: input.calciumParameters.status,
    evidenceId: input.calciumParameters.evidenceId,
  });
  if (typeof input.atomicStep !== "function") {
    throw new Error("atomicStep must be a function");
  }
  if (typeof input.reinitializeAlgebraicState !== "function") {
    throw new Error("reinitializeAlgebraicState must be a function");
  }
  assertDensePlainArrayV1(
    input.coincidentEventsAtEnd,
    undefined,
    "coincidentEventsAtEnd",
  );
  const events = input.coincidentEventsAtEnd.map((event, index) =>
    validateEventCopy(event, endTimeSec, `coincidentEventsAtEnd[${index}]`));
  const eventIdsSeen = new Set<string>();
  for (const event of events) {
    if (eventIdsSeen.has(event.eventId)) {
      throw new Error(`coincidentEventsAtEnd contains duplicate eventId ${event.eventId}`);
    }
    eventIdsSeen.add(event.eventId);
  }
  const canonicalEvents = Object.freeze(
    [...events].sort((left, right) =>
      left.eventId < right.eventId ? -1 : left.eventId > right.eventId ? 1 : 0),
  );
  let aggregateEventStrength = 0;
  for (const event of canonicalEvents) {
    aggregateEventStrength += event.strength;
    if (!Number.isFinite(aggregateEventStrength)) {
      throw new Error("aggregate event strength must remain finite");
    }
  }
  return deepFreeze({
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    calciumDriveStateAtStart,
    nonCalciumDifferentialStateAtStart,
    algebraicStateAtStart,
    events: canonicalEvents,
    eventIds: canonicalEvents.map((event) => event.eventId),
    aggregateEventStrength,
    calciumParameters,
    atomicStep: input.atomicStep,
    reinitializeAlgebraicState: input.reinitializeAlgebraicState,
  } satisfies ValidatedTransactionInputV1);
}

function applyValidatedEventBatch(
  stateAtEndLeftLimit: ExactEventCalciumStateV1,
  input: ValidatedTransactionInputV1,
): ExactEventCalciumStateV1 {
  if (input.events.length === 0) return frozenCalciumState(stateAtEndLeftLimit);
  return applyExactCalciumDriveEventV1(stateAtEndLeftLimit, {
    eventId: "phase-b1-coincident-aggregate-event",
    calciumDriveTimeSec: input.endTimeSec,
    strength: input.aggregateEventStrength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function commonResultFields(
  input: ValidatedTransactionInputV1,
  calciumDriveStateAtEndLeftLimit: ExactEventCalciumStateV1,
  knownFreeCalciumUMAtEndLeftLimit: number,
): PhaseB1ExactCalciumEventTransactionCommonV1 {
  return deepFreeze({
    componentId: PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID,
    implementationStatus:
      "single-wall-pair-event-component-not-whole-heart-monolithic-phase-b1",
    scope: "single-wall-calcium-pair",
    callbackContract: "side-effect-free-candidate-evaluation",
    forcingSide: PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
    startTimeSec: input.startTimeSec,
    endTimeSec: input.endTimeSec,
    durationSec: input.durationSec,
    eventIds: input.eventIds,
    eventCount: input.events.length,
    aggregateEventStrength: input.aggregateEventStrength,
    calciumDriveStateAtStart: input.calciumDriveStateAtStart,
    calciumDriveStateAtEndLeftLimit,
    knownFreeCalciumUMAtEndLeftLimit,
    nonCalciumDifferentialStateAtStart:
      input.nonCalciumDifferentialStateAtStart,
    algebraicStateAtStart: input.algebraicStateAtStart,
    monolithicSlsOnUnknownCount51Implemented: false,
    monolithicSlsOffUnknownCount46Implemented: false,
  });
}

function callbackFailure(
  common: PhaseB1ExactCalciumEventTransactionCommonV1,
  input: ValidatedTransactionInputV1,
  failureStage: "atomic-step" | "algebraic-reinitialization",
  failureReason: string,
  algebraicReinitializationCallCount: 0 | 1,
): PhaseB1ExactCalciumEventTransactionFailureV1 {
  return deepFreeze({
    ...common,
    ok: false,
    failureStage,
    failureReason: requireNonEmptyString(failureReason, "callback failureReason"),
    eventBatchCommitted: false,
    calciumDriveStateRollbackSnapshot: input.calciumDriveStateAtStart,
    nonCalciumDifferentialStateRollbackSnapshot:
      input.nonCalciumDifferentialStateAtStart,
    algebraicStateRollbackSnapshot: input.algebraicStateAtStart,
    atomicStepCallCount: 1,
    algebraicReinitializationCallCount,
    rollbackSnapshotReturned: true,
  });
}

function validateAcceptedAtomicResult(
  result: PhaseB1AtomicStepResultV1,
  differentialStateLength: number,
  algebraicStateLength: number,
): Readonly<{
  nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
  algebraicStateAtEndLeftLimit: readonly number[];
}> {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("atomicStep result must be a plain record");
  }
  if ((result as PhaseB1AtomicStepResultV1).accepted === false) {
    assertExactPlainRecordV1(
      result,
      ["accepted", "failureReason"],
      "atomicStep rejected result",
    );
    const rejected = result as Extract<
      PhaseB1AtomicStepResultV1,
      { readonly accepted: false }
    >;
    throw new Error(requireNonEmptyString(
      rejected.failureReason,
      "atomicStep failureReason",
    ));
  }
  assertExactPlainRecordV1(
    result,
    [
      "accepted",
      "nonCalciumDifferentialStateAtEndLeftLimit",
      "algebraicStateAtEndLeftLimit",
    ],
    "atomicStep accepted result",
  );
  if (result.accepted !== true) {
    throw new Error("atomicStep accepted result requires accepted=true");
  }
  return deepFreeze({
    nonCalciumDifferentialStateAtEndLeftLimit: finiteVectorCopy(
      result.nonCalciumDifferentialStateAtEndLeftLimit,
      "atomicStep nonCalciumDifferentialStateAtEndLeftLimit",
      differentialStateLength,
    ),
    algebraicStateAtEndLeftLimit: finiteVectorCopy(
      result.algebraicStateAtEndLeftLimit,
      "atomicStep algebraicStateAtEndLeftLimit",
      algebraicStateLength,
    ),
  });
}

function validateAcceptedReinitializationResult(
  result: PhaseB1AlgebraicReinitializationResultV1,
  algebraicStateLength: number,
): readonly number[] {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("algebraic reinitialization result must be a plain record");
  }
  if ((result as PhaseB1AlgebraicReinitializationResultV1).accepted === false) {
    assertExactPlainRecordV1(
      result,
      ["accepted", "failureReason"],
      "algebraic reinitialization rejected result",
    );
    const rejected = result as Extract<
      PhaseB1AlgebraicReinitializationResultV1,
      { readonly accepted: false }
    >;
    throw new Error(requireNonEmptyString(
      rejected.failureReason,
      "algebraic reinitialization failureReason",
    ));
  }
  assertExactPlainRecordV1(
    result,
    ["accepted", "algebraicStateAfterReinitialization"],
    "algebraic reinitialization accepted result",
  );
  if (result.accepted !== true) {
    throw new Error("algebraic reinitialization accepted result requires accepted=true");
  }
  return finiteVectorCopy(
    result.algebraicStateAfterReinitialization,
    "algebraicStateAfterReinitialization",
    algebraicStateLength,
  );
}

function validateEventCopy(
  event: CalciumDriveEventV1,
  endTimeSec: number,
  field: string,
): Readonly<CalciumDriveEventV1> {
  assertExactPlainRecordV1(
    event,
    ["eventId", "calciumDriveTimeSec", "strength", "timingOwner"],
    field,
  );
  const eventId = requireNonEmptyString(event.eventId, `${field}.eventId`);
  const calciumDriveTimeSec = requireNonNegativeFinite(
    event.calciumDriveTimeSec,
    `${field}.calciumDriveTimeSec`,
  );
  if (calciumDriveTimeSec !== endTimeSec) {
    throw new Error(`${field}.calciumDriveTimeSec must equal endTimeSec`);
  }
  const strength = requireNonNegativeFinite(event.strength, `${field}.strength`);
  if (event.timingOwner !== "tissue-manifest-electrical-to-calcium-delay") {
    throw new Error(`${field}.timingOwner is invalid`);
  }
  return Object.freeze({
    eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function validateCalciumStateCopy(
  state: ExactEventCalciumStateV1,
  field: string,
): ExactEventCalciumStateV1 {
  assertDensePlainArrayV1(state, 2, field);
  const riseDrive = requireNonNegativeFinite(state[0], `${field}[0]`);
  const decayDrive = requireNonNegativeFinite(state[1], `${field}[1]`);
  if (decayDrive < riseDrive) {
    throw new Error(`${field} requires decayDrive >= riseDrive`);
  }
  return Object.freeze([riseDrive, decayDrive] as [number, number]);
}

function frozenCalciumState(
  state: ExactEventCalciumStateV1,
): ExactEventCalciumStateV1 {
  return Object.freeze([state[0], state[1]] as [number, number]);
}

function finiteVectorCopy(
  state: readonly number[],
  field: string,
  expectedLength?: number,
): readonly number[] {
  assertDensePlainArrayV1(state, expectedLength, field);
  const copy = state.map((value, index) => requireFinite(value, `${field}[${index}]`));
  return Object.freeze(copy);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be non-negative`);
  return finite;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "callback failed without an Error message";
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

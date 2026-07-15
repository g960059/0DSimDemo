import {
  applyExactCalciumDriveEventV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  validateExactEventCalciumParametersV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/exactCalciumEventTransactionV1";
import {
  PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
  buildPhaseB1NewtonUnknownLabelsV1,
  type PhaseB1PrescribedCalciumStateV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID =
  "phase-b1-whole-heart-five-wall-exact-calcium-event-coordinator-v1" as const;

export type PhaseB1WallCalciumDriveEventV1 = Readonly<{
  wallId: FourChamberWallId;
  eventId: string;
  calciumDriveTimeSec: number;
  strength: number;
  timingOwner: "tissue-manifest-electrical-to-calcium-delay";
}>;

export type PhaseB1CalciumDriveStateByWallV1 = Readonly<
  Record<FourChamberWallId, PhaseB1PrescribedCalciumStateV1>
>;

export type PhaseB1CalciumParametersByWallV1 = Readonly<
  Record<FourChamberWallId, ExactEventCalciumParametersV1>
>;

export type PhaseB1FreeCalciumByWallV1 = Readonly<
  Record<FourChamberWallId, number>
>;

export type PhaseB1WholeHeartAtomicStepInputV1 = Readonly<{
  topologySchemaId: typeof PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  forcingSide: typeof PHASE_B1_PRE_JUMP_FORCING_SIDE_V1;
  calciumDriveStateByWallAtStart: PhaseB1CalciumDriveStateByWallV1;
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumDriveStateByWallV1;
  knownFreeCalciumUMByWallAtEndLeftLimit: PhaseB1FreeCalciumByWallV1;
  nonCalciumDifferentialLabels: readonly string[];
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicLabels: readonly string[];
  algebraicStateAtStart: readonly number[];
  newtonUnknownLabels: readonly string[];
}>;

export type PhaseB1WholeHeartAtomicStepResultV1 =
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
 * Candidate evaluation only. The callback MUST NOT mutate model, solver, or
 * caller-owned external state; commit occurs only after every event and the
 * algebraic candidate have passed validation.
 */
export type PhaseB1WholeHeartAtomicStepCallbackV1 = (
  input: PhaseB1WholeHeartAtomicStepInputV1,
) => PhaseB1WholeHeartAtomicStepResultV1;

export type PhaseB1WholeHeartAlgebraicReinitializationInputV1 = Readonly<{
  topologySchemaId: typeof PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  timeSec: number;
  eventKeys: readonly string[];
  eventCount: number;
  eventCountByWall: Readonly<Record<FourChamberWallId, number>>;
  aggregateEventStrengthByWall: Readonly<Record<FourChamberWallId, number>>;
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumDriveStateByWallV1;
  calciumDriveStateByWallAfterEventBatch: PhaseB1CalciumDriveStateByWallV1;
  freeCalciumUMByWallAfterEventBatch: PhaseB1FreeCalciumByWallV1;
  nonCalciumDifferentialLabels: readonly string[];
  nonCalciumDifferentialStateAtAcceptedEnd: readonly number[];
  algebraicLabels: readonly string[];
  algebraicStateAtEndLeftLimit: readonly number[];
}>;

export type PhaseB1WholeHeartAlgebraicReinitializationResultV1 =
  | Readonly<{
    accepted: true;
    algebraicStateAfterReinitialization: readonly number[];
  }>
  | Readonly<{
    accepted: false;
    failureReason: string;
  }>;

/** Side-effect-free candidate evaluation under the same contract as atomicStep. */
export type PhaseB1WholeHeartAlgebraicReinitializationCallbackV1 = (
  input: PhaseB1WholeHeartAlgebraicReinitializationInputV1,
) => PhaseB1WholeHeartAlgebraicReinitializationResultV1;

export type PhaseB1WholeHeartCalciumEventCoordinatorInputV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  slsMode: PhaseB1SlsModeV1;
  calciumDriveStateByWallAtStart: PhaseB1CalciumDriveStateByWallV1;
  calciumParametersByWall: PhaseB1CalciumParametersByWallV1;
  nonCalciumDifferentialStateAtStart: readonly number[];
  algebraicStateAtStart: readonly number[];
  coincidentEventsAtEnd: readonly PhaseB1WallCalciumDriveEventV1[];
  atomicStep: PhaseB1WholeHeartAtomicStepCallbackV1;
  reinitializeAlgebraicState:
    PhaseB1WholeHeartAlgebraicReinitializationCallbackV1;
}>;

type WholeHeartStaticResultV1 = Readonly<{
  componentId: typeof PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID;
  implementationStatus:
    "five-wall-event-transaction-topology-component-not-monolithic-residual";
  callbackContract: "side-effect-free-candidate-evaluation";
  topologySchemaId: typeof PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  forcingSide: typeof PHASE_B1_PRE_JUMP_FORCING_SIDE_V1;
  eventKeys: readonly string[];
  eventCount: number;
  eventCountByWall: Readonly<Record<FourChamberWallId, number>>;
  calciumDriveStateByWallAtStart: PhaseB1CalciumDriveStateByWallV1;
  nonCalciumDifferentialLabels: readonly string[];
  nonCalciumDifferentialStateAtStart: readonly number[];
  nonCalciumDifferentialStateCount: 49 | 44;
  algebraicLabels: readonly string[];
  algebraicStateAtStart: readonly number[];
  algebraicStateCount: 2;
  newtonUnknownLabels: readonly string[];
  newtonUnknownCount: 51 | 46;
  monolithicResidualImplemented: false;
}>

type WholeHeartPreparedResultV1 = WholeHeartStaticResultV1 & Readonly<{
  aggregateEventStrengthByWall: Readonly<Record<FourChamberWallId, number>>;
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumDriveStateByWallV1;
  knownFreeCalciumUMByWallAtEndLeftLimit: PhaseB1FreeCalciumByWallV1;
}>;

export type PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1 =
  WholeHeartPreparedResultV1 & Readonly<{
    ok: true;
    eventBatchMode: "wall-partitioned-simultaneous-jump" | "empty-batch-no-jump";
    eventBatchCommitted: boolean;
    calciumDriveStateByWallAfterEventBatch: PhaseB1CalciumDriveStateByWallV1;
    freeCalciumUMByWallAfterEventBatch: PhaseB1FreeCalciumByWallV1;
    nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
    nonCalciumDifferentialStateAfterEventBatch: readonly number[];
    nonCalciumDifferentialStateChangedByEventBatch: false;
    algebraicStateAtEndLeftLimit: readonly number[];
    algebraicStateAfterReinitialization: readonly number[];
    atomicStepCallCount: 1;
    algebraicReinitializationCallCount: 0 | 1;
    rollbackSnapshotReturned: false;
  }>;

export type PhaseB1WholeHeartCalciumEventCoordinatorFailureV1 =
  WholeHeartStaticResultV1 & Readonly<{
    ok: false;
    failureStage:
      | "event-batch-preparation"
      | "atomic-step"
      | "algebraic-reinitialization";
    failureReason: string;
    aggregateEventStrengthByWall:
      Readonly<Record<FourChamberWallId, number>> | null;
    calciumDriveStateByWallAtEndLeftLimit:
      PhaseB1CalciumDriveStateByWallV1 | null;
    knownFreeCalciumUMByWallAtEndLeftLimit:
      PhaseB1FreeCalciumByWallV1 | null;
    eventBatchCommitted: false;
    calciumDriveStateByWallRollbackSnapshot: PhaseB1CalciumDriveStateByWallV1;
    nonCalciumDifferentialStateRollbackSnapshot: readonly number[];
    algebraicStateRollbackSnapshot: readonly number[];
    atomicStepCallCount: 0 | 1;
    algebraicReinitializationCallCount: 0 | 1;
    rollbackSnapshotReturned: true;
  }>;

export type PhaseB1WholeHeartCalciumEventCoordinatorResultV1 =
  | PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1
  | PhaseB1WholeHeartCalciumEventCoordinatorFailureV1;

/**
 * Coordinates the exact endpoint event transaction over all five v1 walls.
 * All five calcium pairs are propagated to the left limit before one atomic
 * step callback. Coincident events are aggregated only within their owning
 * wall. The complete jump and its free-calcium values are preflighted before
 * the callback, then committed as one whole-heart batch and followed by at
 * most one algebraic reinitialization.
 *
 * Callbacks MUST be side-effect-free. Failure returns immutable snapshots of
 * all ten calcium values, 49/44 non-calcium differential values, and the two
 * algebraic values; it cannot reverse callback-owned external mutations.
 */
export function runPhaseB1WholeHeartCalciumEventCoordinatorV1(
  input: PhaseB1WholeHeartCalciumEventCoordinatorInputV1,
): PhaseB1WholeHeartCalciumEventCoordinatorResultV1 {
  const validated = validateInput(input);
  const staticCommon = staticFields(validated);
  let aggregateEventStrengthByWall:
    Readonly<Record<FourChamberWallId, number>> | null = null;
  let calciumDriveStateByWallAtEndLeftLimit:
    PhaseB1CalciumDriveStateByWallV1 | null = null;
  let knownFreeCalciumUMByWallAtEndLeftLimit:
    PhaseB1FreeCalciumByWallV1 | null = null;
  let preparedEventBatch: Readonly<{
    calciumDriveStateByWallAfterEventBatch:
      PhaseB1CalciumDriveStateByWallV1;
    freeCalciumUMByWallAfterEventBatch: PhaseB1FreeCalciumByWallV1;
  }>;
  try {
    aggregateEventStrengthByWall = mapWallRecord((wallId) => {
      let sum = 0;
      for (const event of validated.events) {
        if (event.wallId !== wallId) continue;
        sum += event.strength;
        if (!Number.isFinite(sum)) {
          throw new Error(
            `aggregate event strength for ${wallId} must remain finite`,
          );
        }
      }
      return sum;
    });
    calciumDriveStateByWallAtEndLeftLimit = mapWallRecord((wallId) =>
      exactStateToRecord(propagateExactEventCalciumV1(
        calciumRecordToExact(validated.calciumDriveStateByWallAtStart[wallId]),
        validated.durationSec,
        validated.calciumParametersByWall[wallId],
      )));
    knownFreeCalciumUMByWallAtEndLeftLimit = mapWallRecord((wallId) =>
      evaluateExactEventCalciumV1(
        calciumRecordToExact(calciumDriveStateByWallAtEndLeftLimit![wallId]),
        validated.calciumParametersByWall[wallId],
      ).freeCalciumUM);
    const calciumDriveStateByWallAfterEventBatch = mapWallRecord((wallId) => {
      const strength = aggregateEventStrengthByWall![wallId];
      const left = calciumRecordToExact(
        calciumDriveStateByWallAtEndLeftLimit![wallId],
      );
      if (strength === 0) return exactStateToRecord(left);
      return exactStateToRecord(applyExactCalciumDriveEventV1(left, {
        eventId: `phase-b1-whole-heart-aggregate-${wallId}`,
        calciumDriveTimeSec: validated.endTimeSec,
        strength,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      }));
    });
    const freeCalciumUMByWallAfterEventBatch = mapWallRecord((wallId) =>
      evaluateExactEventCalciumV1(
        calciumRecordToExact(calciumDriveStateByWallAfterEventBatch[wallId]),
        validated.calciumParametersByWall[wallId],
      ).freeCalciumUM);
    for (const wallId of WALL_IDS) {
      assertRoundoffEqual(
        freeCalciumUMByWallAfterEventBatch[wallId],
        knownFreeCalciumUMByWallAtEndLeftLimit[wallId],
        `${wallId} equal calcium-drive jump free-calcium continuity`,
      );
    }
    preparedEventBatch = deepFreeze({
      calciumDriveStateByWallAfterEventBatch,
      freeCalciumUMByWallAfterEventBatch,
    });
  } catch (error) {
    return preparationFailure(
      staticCommon,
      validated,
      aggregateEventStrengthByWall,
      calciumDriveStateByWallAtEndLeftLimit,
      knownFreeCalciumUMByWallAtEndLeftLimit,
      errorMessage(error),
    );
  }
  if (
    aggregateEventStrengthByWall === null
    || calciumDriveStateByWallAtEndLeftLimit === null
    || knownFreeCalciumUMByWallAtEndLeftLimit === null
  ) {
    throw new Error("successful calcium preparation lost its prepared state");
  }
  const common = preparedFields(
    staticCommon,
    aggregateEventStrengthByWall,
    calciumDriveStateByWallAtEndLeftLimit,
    knownFreeCalciumUMByWallAtEndLeftLimit,
  );
  const atomicInput = deepFreeze({
    topologySchemaId: PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
    slsMode: validated.slsMode,
    startTimeSec: validated.startTimeSec,
    endTimeSec: validated.endTimeSec,
    durationSec: validated.durationSec,
    forcingSide: PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
    calciumDriveStateByWallAtStart:
      validated.calciumDriveStateByWallAtStart,
    calciumDriveStateByWallAtEndLeftLimit,
    knownFreeCalciumUMByWallAtEndLeftLimit,
    nonCalciumDifferentialLabels: validated.nonCalciumDifferentialLabels,
    nonCalciumDifferentialStateAtStart:
      validated.nonCalciumDifferentialStateAtStart,
    algebraicLabels: validated.algebraicLabels,
    algebraicStateAtStart: validated.algebraicStateAtStart,
    newtonUnknownLabels: validated.newtonUnknownLabels,
  } satisfies PhaseB1WholeHeartAtomicStepInputV1);

  let atomicRaw: PhaseB1WholeHeartAtomicStepResultV1;
  try {
    atomicRaw = validated.atomicStep(atomicInput);
  } catch (error) {
    return failure(common, validated, "atomic-step", errorMessage(error), 1, 0);
  }
  let atomic: Readonly<{
    nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
    algebraicStateAtEndLeftLimit: readonly number[];
  }>;
  try {
    atomic = validateAtomicResult(
      atomicRaw,
      validated.nonCalciumDifferentialStateCount,
    );
  } catch (error) {
    return failure(common, validated, "atomic-step", errorMessage(error), 1, 0);
  }

  if (validated.events.length === 0) {
    return deepFreeze({
      ...common,
      ok: true,
      eventBatchMode: "empty-batch-no-jump",
      eventBatchCommitted: false,
      calciumDriveStateByWallAfterEventBatch:
        calciumDriveStateByWallAtEndLeftLimit,
      freeCalciumUMByWallAfterEventBatch:
        knownFreeCalciumUMByWallAtEndLeftLimit,
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
    } satisfies PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1);
  }

  const {
    calciumDriveStateByWallAfterEventBatch,
    freeCalciumUMByWallAfterEventBatch,
  } = preparedEventBatch;
  const reinitializationInput = deepFreeze({
    topologySchemaId: PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
    slsMode: validated.slsMode,
    timeSec: validated.endTimeSec,
    eventKeys: validated.eventKeys,
    eventCount: validated.events.length,
    eventCountByWall: validated.eventCountByWall,
    aggregateEventStrengthByWall: common.aggregateEventStrengthByWall,
    calciumDriveStateByWallAtEndLeftLimit,
    calciumDriveStateByWallAfterEventBatch,
    freeCalciumUMByWallAfterEventBatch,
    nonCalciumDifferentialLabels: validated.nonCalciumDifferentialLabels,
    nonCalciumDifferentialStateAtAcceptedEnd:
      atomic.nonCalciumDifferentialStateAtEndLeftLimit,
    algebraicLabels: validated.algebraicLabels,
    algebraicStateAtEndLeftLimit: atomic.algebraicStateAtEndLeftLimit,
  } satisfies PhaseB1WholeHeartAlgebraicReinitializationInputV1);
  let reinitializationRaw: PhaseB1WholeHeartAlgebraicReinitializationResultV1;
  try {
    reinitializationRaw = validated.reinitializeAlgebraicState(
      reinitializationInput,
    );
  } catch (error) {
    return failure(
      common,
      validated,
      "algebraic-reinitialization",
      errorMessage(error),
      1,
      1,
    );
  }
  let algebraicStateAfterReinitialization: readonly number[];
  try {
    algebraicStateAfterReinitialization = validateReinitializationResult(
      reinitializationRaw,
    );
  } catch (error) {
    return failure(
      common,
      validated,
      "algebraic-reinitialization",
      errorMessage(error),
      1,
      1,
    );
  }
  return deepFreeze({
    ...common,
    ok: true,
    eventBatchMode: "wall-partitioned-simultaneous-jump",
    eventBatchCommitted: true,
    calciumDriveStateByWallAfterEventBatch,
    freeCalciumUMByWallAfterEventBatch,
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
  } satisfies PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1);
}

type ValidatedInputV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  slsMode: PhaseB1SlsModeV1;
  calciumDriveStateByWallAtStart: PhaseB1CalciumDriveStateByWallV1;
  calciumParametersByWall: PhaseB1CalciumParametersByWallV1;
  nonCalciumDifferentialStateAtStart: readonly number[];
  nonCalciumDifferentialStateCount: 49 | 44;
  algebraicStateAtStart: readonly number[];
  events: readonly PhaseB1WallCalciumDriveEventV1[];
  eventKeys: readonly string[];
  eventCountByWall: Readonly<Record<FourChamberWallId, number>>;
  nonCalciumDifferentialLabels: readonly string[];
  algebraicLabels: readonly string[];
  newtonUnknownLabels: readonly string[];
  newtonUnknownCount: 51 | 46;
  atomicStep: PhaseB1WholeHeartAtomicStepCallbackV1;
  reinitializeAlgebraicState:
    PhaseB1WholeHeartAlgebraicReinitializationCallbackV1;
}>;

function validateInput(
  input: PhaseB1WholeHeartCalciumEventCoordinatorInputV1,
): ValidatedInputV1 {
  assertExactPlainRecordV1(input, [
    "startTimeSec",
    "endTimeSec",
    "slsMode",
    "calciumDriveStateByWallAtStart",
    "calciumParametersByWall",
    "nonCalciumDifferentialStateAtStart",
    "algebraicStateAtStart",
    "coincidentEventsAtEnd",
    "atomicStep",
    "reinitializeAlgebraicState",
  ], "Phase B1 whole-heart calcium event coordinator input");
  const startTimeSec = requireNonNegativeFinite(input.startTimeSec, "startTimeSec");
  const endTimeSec = requireNonNegativeFinite(input.endTimeSec, "endTimeSec");
  if (endTimeSec <= startTimeSec) {
    throw new Error("endTimeSec must be greater than startTimeSec");
  }
  const slsMode = requireSlsMode(input.slsMode);
  const newtonUnknownLabels = Object.freeze([
    ...buildPhaseB1NewtonUnknownLabelsV1(slsMode),
  ]);
  const newtonUnknownCount = (slsMode === "on" ? 51 : 46) as 51 | 46;
  const nonCalciumDifferentialStateCount = (
    slsMode === "on" ? 49 : 44
  ) as 49 | 44;
  if (newtonUnknownLabels.length !== newtonUnknownCount) {
    throw new Error("Phase B1 Newton topology label count drifted");
  }
  const nonCalciumDifferentialLabels = Object.freeze(
    newtonUnknownLabels.slice(0, nonCalciumDifferentialStateCount),
  );
  const algebraicLabels = Object.freeze(
    newtonUnknownLabels.slice(nonCalciumDifferentialStateCount),
  );
  if (
    algebraicLabels.length !== 2
    || algebraicLabels[0] !== "algebraic.triseg.V_m_S"
    || algebraicLabels[1] !== "algebraic.triseg.y_m"
  ) {
    throw new Error("Phase B1 Newton topology must end with two TriSeg coordinates");
  }
  const nonCalciumDifferentialStateAtStart = finiteVectorCopy(
    input.nonCalciumDifferentialStateAtStart,
    nonCalciumDifferentialStateCount,
    "nonCalciumDifferentialStateAtStart",
  );
  const algebraicStateAtStart = finiteVectorCopy(
    input.algebraicStateAtStart,
    2,
    "algebraicStateAtStart",
  );
  const calciumDriveStateByWallAtStart = copyCalciumStateByWall(
    input.calciumDriveStateByWallAtStart,
  );
  const calciumParametersByWall = copyCalciumParametersByWall(
    input.calciumParametersByWall,
  );
  assertDensePlainArrayV1(
    input.coincidentEventsAtEnd,
    undefined,
    "coincidentEventsAtEnd",
  );
  const events = input.coincidentEventsAtEnd.map((event, index) =>
    copyEvent(event, endTimeSec, `coincidentEventsAtEnd[${index}]`));
  const wallIndex = new Map(WALL_IDS.map((wallId, index) => [wallId, index]));
  const canonicalEvents = Object.freeze([...events].sort((left, right) => {
    const wallDifference = wallIndex.get(left.wallId)! - wallIndex.get(right.wallId)!;
    if (wallDifference !== 0) return wallDifference;
    return left.eventId < right.eventId ? -1 : left.eventId > right.eventId ? 1 : 0;
  }));
  const keys = new Set<string>();
  for (const event of canonicalEvents) {
    const key = eventKey(event);
    if (keys.has(key)) throw new Error(`duplicate wall/event key ${key}`);
    keys.add(key);
  }
  const eventCountByWall = mapWallRecord((wallId) =>
    canonicalEvents.filter((event) => event.wallId === wallId).length);
  if (typeof input.atomicStep !== "function") throw new Error("atomicStep must be a function");
  if (typeof input.reinitializeAlgebraicState !== "function") {
    throw new Error("reinitializeAlgebraicState must be a function");
  }
  return deepFreeze({
    startTimeSec,
    endTimeSec,
    durationSec: endTimeSec - startTimeSec,
    slsMode,
    calciumDriveStateByWallAtStart,
    calciumParametersByWall,
    nonCalciumDifferentialStateAtStart,
    nonCalciumDifferentialStateCount,
    algebraicStateAtStart,
    events: canonicalEvents,
    eventKeys: canonicalEvents.map(eventKey),
    eventCountByWall,
    nonCalciumDifferentialLabels,
    algebraicLabels,
    newtonUnknownLabels,
    newtonUnknownCount,
    atomicStep: input.atomicStep,
    reinitializeAlgebraicState: input.reinitializeAlgebraicState,
  } satisfies ValidatedInputV1);
}

function staticFields(
  input: ValidatedInputV1,
): WholeHeartStaticResultV1 {
  return deepFreeze({
    componentId: PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID,
    implementationStatus:
      "five-wall-event-transaction-topology-component-not-monolithic-residual",
    callbackContract: "side-effect-free-candidate-evaluation",
    topologySchemaId: PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
    slsMode: input.slsMode,
    startTimeSec: input.startTimeSec,
    endTimeSec: input.endTimeSec,
    durationSec: input.durationSec,
    forcingSide: PHASE_B1_PRE_JUMP_FORCING_SIDE_V1,
    eventKeys: input.eventKeys,
    eventCount: input.events.length,
    eventCountByWall: input.eventCountByWall,
    calciumDriveStateByWallAtStart: input.calciumDriveStateByWallAtStart,
    nonCalciumDifferentialLabels: input.nonCalciumDifferentialLabels,
    nonCalciumDifferentialStateAtStart:
      input.nonCalciumDifferentialStateAtStart,
    nonCalciumDifferentialStateCount: input.nonCalciumDifferentialStateCount,
    algebraicLabels: input.algebraicLabels,
    algebraicStateAtStart: input.algebraicStateAtStart,
    algebraicStateCount: 2,
    newtonUnknownLabels: input.newtonUnknownLabels,
    newtonUnknownCount: input.newtonUnknownCount,
    monolithicResidualImplemented: false,
  });
}

function preparedFields(
  common: WholeHeartStaticResultV1,
  aggregateEventStrengthByWall: Readonly<Record<FourChamberWallId, number>>,
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumDriveStateByWallV1,
  knownFreeCalciumUMByWallAtEndLeftLimit: PhaseB1FreeCalciumByWallV1,
): WholeHeartPreparedResultV1 {
  return deepFreeze({
    ...common,
    aggregateEventStrengthByWall,
    calciumDriveStateByWallAtEndLeftLimit,
    knownFreeCalciumUMByWallAtEndLeftLimit,
  });
}

function failure(
  common: WholeHeartPreparedResultV1,
  input: ValidatedInputV1,
  failureStage:
    | "event-batch-preparation"
    | "atomic-step"
    | "algebraic-reinitialization",
  failureReason: string,
  atomicStepCallCount: 0 | 1,
  algebraicReinitializationCallCount: 0 | 1,
): PhaseB1WholeHeartCalciumEventCoordinatorFailureV1 {
  return deepFreeze({
    ...common,
    ok: false,
    failureStage,
    failureReason: requireNonEmptyString(failureReason, "failureReason"),
    eventBatchCommitted: false,
    calciumDriveStateByWallRollbackSnapshot:
      input.calciumDriveStateByWallAtStart,
    nonCalciumDifferentialStateRollbackSnapshot:
      input.nonCalciumDifferentialStateAtStart,
    algebraicStateRollbackSnapshot: input.algebraicStateAtStart,
    atomicStepCallCount,
    algebraicReinitializationCallCount,
    rollbackSnapshotReturned: true,
  });
}

function preparationFailure(
  common: WholeHeartStaticResultV1,
  input: ValidatedInputV1,
  aggregateEventStrengthByWall:
    Readonly<Record<FourChamberWallId, number>> | null,
  calciumDriveStateByWallAtEndLeftLimit:
    PhaseB1CalciumDriveStateByWallV1 | null,
  knownFreeCalciumUMByWallAtEndLeftLimit:
    PhaseB1FreeCalciumByWallV1 | null,
  failureReason: string,
): PhaseB1WholeHeartCalciumEventCoordinatorFailureV1 {
  return deepFreeze({
    ...common,
    ok: false,
    failureStage: "event-batch-preparation",
    failureReason: requireNonEmptyString(failureReason, "failureReason"),
    aggregateEventStrengthByWall,
    calciumDriveStateByWallAtEndLeftLimit,
    knownFreeCalciumUMByWallAtEndLeftLimit,
    eventBatchCommitted: false,
    calciumDriveStateByWallRollbackSnapshot:
      input.calciumDriveStateByWallAtStart,
    nonCalciumDifferentialStateRollbackSnapshot:
      input.nonCalciumDifferentialStateAtStart,
    algebraicStateRollbackSnapshot: input.algebraicStateAtStart,
    atomicStepCallCount: 0,
    algebraicReinitializationCallCount: 0,
    rollbackSnapshotReturned: true,
  });
}

function validateAtomicResult(
  result: PhaseB1WholeHeartAtomicStepResultV1,
  nonCalciumCount: 49 | 44,
): Readonly<{
  nonCalciumDifferentialStateAtEndLeftLimit: readonly number[];
  algebraicStateAtEndLeftLimit: readonly number[];
}> {
  if ((result as PhaseB1WholeHeartAtomicStepResultV1)?.accepted === false) {
    assertExactPlainRecordV1(result, ["accepted", "failureReason"], "atomicStep result");
    throw new Error(requireNonEmptyString(
      (result as Extract<PhaseB1WholeHeartAtomicStepResultV1, { accepted: false }>).failureReason,
      "atomicStep failureReason",
    ));
  }
  assertExactPlainRecordV1(result, [
    "accepted",
    "nonCalciumDifferentialStateAtEndLeftLimit",
    "algebraicStateAtEndLeftLimit",
  ], "atomicStep result");
  if (result.accepted !== true) throw new Error("atomicStep result requires accepted=true");
  return deepFreeze({
    nonCalciumDifferentialStateAtEndLeftLimit: finiteVectorCopy(
      result.nonCalciumDifferentialStateAtEndLeftLimit,
      nonCalciumCount,
      "atomicStep nonCalciumDifferentialStateAtEndLeftLimit",
    ),
    algebraicStateAtEndLeftLimit: finiteVectorCopy(
      result.algebraicStateAtEndLeftLimit,
      2,
      "atomicStep algebraicStateAtEndLeftLimit",
    ),
  });
}

function validateReinitializationResult(
  result: PhaseB1WholeHeartAlgebraicReinitializationResultV1,
): readonly number[] {
  if ((result as PhaseB1WholeHeartAlgebraicReinitializationResultV1)?.accepted === false) {
    assertExactPlainRecordV1(
      result,
      ["accepted", "failureReason"],
      "algebraic reinitialization result",
    );
    throw new Error(requireNonEmptyString(
      (result as Extract<
        PhaseB1WholeHeartAlgebraicReinitializationResultV1,
        { accepted: false }
      >).failureReason,
      "algebraic reinitialization failureReason",
    ));
  }
  assertExactPlainRecordV1(
    result,
    ["accepted", "algebraicStateAfterReinitialization"],
    "algebraic reinitialization result",
  );
  if (result.accepted !== true) {
    throw new Error("algebraic reinitialization result requires accepted=true");
  }
  return finiteVectorCopy(
    result.algebraicStateAfterReinitialization,
    2,
    "algebraicStateAfterReinitialization",
  );
}

function copyCalciumStateByWall(
  value: unknown,
): PhaseB1CalciumDriveStateByWallV1 {
  assertExactPlainRecordV1(value, WALL_IDS, "calciumDriveStateByWallAtStart");
  return mapWallRecord((wallId) => {
    const field = `calciumDriveStateByWallAtStart.${wallId}`;
    const state = value[wallId];
    assertExactPlainRecordV1(state, ["r", "d"], field);
    const r = requireNonNegativeFinite(state.r, `${field}.r`);
    const d = requireNonNegativeFinite(state.d, `${field}.d`);
    if (d < r) throw new Error(`${field} requires d >= r`);
    return Object.freeze({ r, d });
  });
}

function copyCalciumParametersByWall(
  value: unknown,
): PhaseB1CalciumParametersByWallV1 {
  assertExactPlainRecordV1(value, WALL_IDS, "calciumParametersByWall");
  return mapWallRecord((wallId) => {
    const parameters = value[wallId] as ExactEventCalciumParametersV1;
    validateExactEventCalciumParametersV1(parameters);
    return Object.freeze({
      tauRiseSec: parameters.tauRiseSec,
      tauDecaySec: parameters.tauDecaySec,
      calciumDiastolicUM: parameters.calciumDiastolicUM,
      calciumAmplitudeUM: parameters.calciumAmplitudeUM,
      electricalToCalciumDelaySec: parameters.electricalToCalciumDelaySec,
      status: parameters.status,
      evidenceId: parameters.evidenceId,
    });
  });
}

function copyEvent(
  value: unknown,
  endTimeSec: number,
  field: string,
): PhaseB1WallCalciumDriveEventV1 {
  assertExactPlainRecordV1(value, [
    "wallId",
    "eventId",
    "calciumDriveTimeSec",
    "strength",
    "timingOwner",
  ], field);
  if (!WALL_IDS.includes(value.wallId as FourChamberWallId)) {
    throw new Error(`${field}.wallId is invalid`);
  }
  const calciumDriveTimeSec = requireNonNegativeFinite(
    value.calciumDriveTimeSec,
    `${field}.calciumDriveTimeSec`,
  );
  if (calciumDriveTimeSec !== endTimeSec) {
    throw new Error(`${field}.calciumDriveTimeSec must equal endTimeSec`);
  }
  if (value.timingOwner !== "tissue-manifest-electrical-to-calcium-delay") {
    throw new Error(`${field}.timingOwner is invalid`);
  }
  return Object.freeze({
    wallId: value.wallId as FourChamberWallId,
    eventId: requireNonEmptyString(value.eventId, `${field}.eventId`),
    calciumDriveTimeSec,
    strength: requireNonNegativeFinite(value.strength, `${field}.strength`),
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function calciumRecordToExact(
  state: PhaseB1PrescribedCalciumStateV1,
): ExactEventCalciumStateV1 {
  return Object.freeze([state.r, state.d] as [number, number]);
}

function exactStateToRecord(
  state: ExactEventCalciumStateV1,
): PhaseB1PrescribedCalciumStateV1 {
  return Object.freeze({ r: state[0], d: state[1] });
}

function eventKey(event: PhaseB1WallCalciumDriveEventV1): string {
  return `${event.wallId}:${event.eventId}`;
}

function mapWallRecord<Value>(
  map: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    map(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function finiteVectorCopy(
  value: unknown,
  expectedLength: number,
  field: string,
): readonly number[] {
  assertDensePlainArrayV1(value, expectedLength, field);
  return Object.freeze(value.map((entry, index) =>
    requireFinite(entry, `${field}[${index}]`)));
}

function requireSlsMode(value: unknown): PhaseB1SlsModeV1 {
  if (value !== "on" && value !== "off") throw new Error("slsMode must be on or off");
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  const tolerance = 64 * Number.EPSILON
    * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} mismatch`);
  }
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

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

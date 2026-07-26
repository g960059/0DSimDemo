import type {
  FiveWallCalciumValuesV1,
  FiveWallNormalCalciumDriveParamsV1,
  PeriodicBiexponentialCalciumClassV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { evaluateFiveWallNormalCalciumDriveV1 } from
  "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
  advanceExactEventCalciumV1,
  convertPeriodicBiexponentialToExactEventCalciumV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID,
  checkpointAcceptedRhythmScheduleStateV1,
  commitAcceptedRhythmScheduleTrialV1,
  createAcceptedRhythmEventScheduleV1,
  evaluateAcceptedRhythmScheduleTrialV1,
  exactEventCalciumEventsForRhythmTargetV1,
  initializeAcceptedRhythmScheduleStateV1,
  maximumAcceptedRhythmScheduleStepV1,
  restoreAcceptedRhythmScheduleStateV1,
  rollbackAcceptedRhythmScheduleTrialV1,
  sha256AcceptedRhythmEventScheduleIdentityV1,
  type AcceptedRhythmActivationEventV1,
  type AcceptedRhythmEventScheduleV1,
  type AcceptedRhythmMaximumStepV1,
  type AcceptedRhythmScheduleCheckpointV1,
  type AcceptedRhythmScheduleStateV1,
  type AcceptedRhythmScheduleTrialV1,
  type RhythmActivationEventInputV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";

export const ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID =
  "accepted-five-wall-rhythm-calcium-owner-v1" as const;

export const ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID =
  "accepted-five-wall-rhythm-calcium-state-v1" as const;

export const ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID =
  "accepted-five-wall-rhythm-calcium-trial-v1" as const;

export const ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID =
  "circleheart.accepted-five-wall-rhythm-calcium-checkpoint.v1" as const;

/**
 * The replay and legacy implementations are algebraically equivalent, but
 * bit identity is not claimed: the exact-event conversion uses expm1 for the
 * periodic carry and chunked exact propagation changes floating-point
 * multiplication grouping. This bound is in micromolar calcium.
 */
export const FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1 =
  2e-12 as const;

export const FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1 = Object.freeze([
  "LA",
  "RA",
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type FiveWallRhythmCalciumWallIdV1 =
  (typeof FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1)[number];

export type FiveWallExactEventCalciumParametersV1 = Readonly<{
  LA: ExactEventCalciumParametersV1;
  RA: ExactEventCalciumParametersV1;
  LVFW: ExactEventCalciumParametersV1;
  SEP: ExactEventCalciumParametersV1;
  RVFW: ExactEventCalciumParametersV1;
}>;

export type FiveWallExactEventCalciumStatesV1 = Readonly<{
  LA: ExactEventCalciumStateV1;
  RA: ExactEventCalciumStateV1;
  LVFW: ExactEventCalciumStateV1;
  SEP: ExactEventCalciumStateV1;
  RVFW: ExactEventCalciumStateV1;
}>;

export const ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1 = Object.freeze({
  acceptedOwner:
    "clock-revision-rhythm-cursor-and-five-exact-calcium-states" as const,
  trialInterval: "open-start-closed-end" as const,
  simultaneousEventBatchCompleteness: true as const,
  rejectedTrialConsumesScheduleCursor: false as const,
  calciumPropagation: "exact-between-events-additive-at-events" as const,
  targetPartition: Object.freeze({
    atrial: Object.freeze(["LA", "RA"] as const),
    ventricular: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    mixedClassSingleEventAllowed: false as const,
  }),
  periodicSinusReplayTiming:
    "effective-calcium-onset-from-electrical-time-plus-class-delay" as const,
  initialTimeConvention:
    "events-at-or-before-start-are-historical-and-calcium-state-is-post-history" as const,
  capturedActivationReplayOnly: true as const,
  atrialFibrillatoryImpulseInterpretation:
    "captured-source-impulse-not-coherent-atrial-calcium" as const,
  atrialFibrillatoryEventsAcceptedByFiveWallCalciumOwner: false as const,
  coherentAtrialFibrillatoryCalciumClaimed: false as const,
  checkpointIntegrity: "sha-256-over-canonical-json-payload" as const,
  checkpointScheduleIdentity:
    "sha-256-over-complete-canonical-rhythm-schedule" as const,
  rhythmGenerationPhysiologyClaimed: false as const,
  calciumCyclingPhysiologyClaimed: false as const,
  atrialFibrillationClaimed: false as const,
  avNodePhysiologyClaimed: false as const,
});

export type AcceptedFiveWallRhythmCalciumParameterProvenanceV1 =
  | "explicit-exact-event-parameters"
  | "five-wall-normal-periodic-analytic-conversion";

export type AcceptedFiveWallRhythmCalciumBindingInputV1 = Readonly<{
  bindingId: string;
  scheduleCoverageStartTimeSec: number;
  scheduleCoverageEndTimeSec: number;
  calciumParametersByWall: FiveWallExactEventCalciumParametersV1;
  parameterProvenance: AcceptedFiveWallRhythmCalciumParameterProvenanceV1;
  sourceParameterSetId: string | null;
}>;

export type AcceptedFiveWallRhythmCalciumBindingV1 = Readonly<{
  ownerId: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID;
  bindingId: string;
  scheduleType: typeof ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID;
  scheduleId: string;
  scheduleFingerprint: string;
  scheduleEventCount: number;
  scheduleCoverageStartTimeSec: number;
  scheduleCoverageEndTimeSec: number;
  calciumModelId: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID;
  calciumParametersByWall: FiveWallExactEventCalciumParametersV1;
  parameterProvenance: AcceptedFiveWallRhythmCalciumParameterProvenanceV1;
  sourceParameterSetId: string | null;
  targetPartition: Readonly<{
    atrial: readonly ["LA", "RA"];
    ventricular: readonly ["LVFW", "SEP", "RVFW"];
  }>;
}>;

export type AcceptedFiveWallRhythmCalciumInitializationV1 =
  | "explicit-accepted-calcium-state"
  | "periodic-sinus-analytic-state";

export type AcceptedFiveWallRhythmCalciumStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID;
  schemaVersion: 1;
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  initialization: AcceptedFiveWallRhythmCalciumInitializationV1;
  revision: number;
  acceptedTimeSec: number;
  rhythmSchedule: AcceptedRhythmScheduleStateV1;
  calciumStateByWall: FiveWallExactEventCalciumStatesV1;
}>;

export type AcceptedFiveWallRhythmCalciumStateInputV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
  initialization: AcceptedFiveWallRhythmCalciumInitializationV1;
  calciumStateByWall: FiveWallExactEventCalciumStatesV1;
}>;

export type AcceptedFiveWallRhythmCalciumTrialV1 = Readonly<{
  trialSchemaId: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID;
  schemaVersion: 1;
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  baseRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  rhythmScheduleTrial: AcceptedRhythmScheduleTrialV1;
  activationEvents: readonly AcceptedRhythmActivationEventV1[];
  simultaneousBatchCount: number;
  candidateCalciumStateByWall: FiveWallExactEventCalciumStatesV1;
  candidateFreeCalciumUMByWall: FiveWallCalciumValuesV1;
}>;

export type AcceptedFiveWallRhythmCalciumMaximumStepV1 = Readonly<{
  schedule: AcceptedRhythmMaximumStepV1;
  coverageClipped: boolean;
  maximumStepSec: number;
  candidateTimeSec: number;
}>;

export type AcceptedFiveWallRhythmCalciumCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID;
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  initialization: AcceptedFiveWallRhythmCalciumInitializationV1;
  revision: number;
  acceptedTimeSec: number;
  rhythmSchedule: AcceptedRhythmScheduleCheckpointV1;
  scheduleIdentitySha256: string;
  calciumStateByWall: FiveWallExactEventCalciumStatesV1;
  exactResumeClaim: typeof ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1;
}>;

export type AcceptedFiveWallRhythmCalciumCheckpointV1 =
  AcceptedFiveWallRhythmCalciumCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

export type PeriodicSinusFiveWallRhythmCalciumReplayOptionsV1 = Readonly<{
  scheduleId: string;
  bindingId: string;
  acceptedTimeSec: number;
  endTimeSec: number;
  revision: number;
}>;

export type PeriodicSinusFiveWallRhythmCalciumReplayV1 = Readonly<{
  schedule: AcceptedRhythmEventScheduleV1;
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  acceptedState: AcceptedFiveWallRhythmCalciumStateV1;
  timing: Readonly<{
    cycleLengthSec: number;
    atrialEffectiveCalciumOnsetOffsetSec: number;
    ventricularEffectiveCalciumOnsetOffsetSec: number;
    atrioventricularElectricalDelaySec: number;
    atrialElectricalToCalciumDelaySec: number;
    ventricularElectricalToCalciumDelaySec: number;
    initialTimeConvention:
      "events-at-start-are-excluded-from-future-schedule-and-analytically-seeded";
  }>;
  compatibility: Readonly<{
    referenceDriveId: "five-wall-normal-prescribed-calcium-drive-v1";
    exactBitParityClaimed: false;
    absoluteToleranceUM:
      typeof FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1;
    floatingPointDifferenceSources: readonly [
      "expm1-versus-one-minus-exp-periodic-carry",
      "chunk-dependent-exponential-multiplication-grouping",
    ];
  }>;
}>;

const TARGET_PARTITION = deepFreeze({
  atrial: ["LA", "RA"] as const,
  ventricular: ["LVFW", "SEP", "RVFW"] as const,
});

const WALL_IDS = FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1;
const ATRIAL_IDS = new Set<FiveWallRhythmCalciumWallIdV1>(["LA", "RA"]);
const VENTRICULAR_IDS = new Set<FiveWallRhythmCalciumWallIdV1>([
  "LVFW",
  "SEP",
  "RVFW",
]);
const MAX_PERIODIC_REPLAY_EVENTS = 1_000_000;
/** Immutable schedule class/target audit cache; never simulation state. */
const VERIFIED_FIVE_WALL_SCHEDULES = new WeakSet<object>();
/**
 * Live bindings are capability objects, not caller-declared digest strings.
 * The factory records the complete immutable schedule object that created a
 * binding. Exact detached copies may be admitted after one full canonical
 * comparison; an FNV32-colliding substitute can therefore never change a
 * running cursor or event boundary.
 */
const SCHEDULE_CAPABILITY_BY_BINDING = new WeakMap<
  AcceptedFiveWallRhythmCalciumBindingV1,
  Readonly<{
    ownedSchedule: AcceptedRhythmEventScheduleV1;
    verifiedSchedules: WeakSet<object>;
  }>
>();

export function createAcceptedFiveWallRhythmCalciumBindingV1(
  schedule: AcceptedRhythmEventScheduleV1,
  input: AcceptedFiveWallRhythmCalciumBindingInputV1,
): AcceptedFiveWallRhythmCalciumBindingV1 {
  assertCanonicalSchedule(schedule);
  const record = requirePlainRecord(input, "binding input");
  requireExactKeys(record, [
    "bindingId",
    "scheduleCoverageStartTimeSec",
    "scheduleCoverageEndTimeSec",
    "calciumParametersByWall",
    "parameterProvenance",
    "sourceParameterSetId",
  ], "binding input");
  const coverageStart = requireNonnegativeFinite(
    input.scheduleCoverageStartTimeSec,
    "binding input.scheduleCoverageStartTimeSec",
  );
  const coverageEnd = requireNonnegativeFinite(
    input.scheduleCoverageEndTimeSec,
    "binding input.scheduleCoverageEndTimeSec",
  );
  if (!(coverageEnd > coverageStart)) {
    throw new Error("schedule coverage end must exceed its start");
  }
  const parameterProvenance = requireParameterProvenance(
    input.parameterProvenance,
    "binding input.parameterProvenance",
  );
  const sourceParameterSetId = input.sourceParameterSetId === null
    ? null
    : requireNonemptyString(
      input.sourceParameterSetId,
      "binding input.sourceParameterSetId",
    );
  if (
    parameterProvenance === "five-wall-normal-periodic-analytic-conversion"
    && sourceParameterSetId === null
  ) {
    throw new Error("periodic analytic conversion requires sourceParameterSetId");
  }
  const calciumParametersByWall = copyAndValidateParametersByWall(
    input.calciumParametersByWall,
    "binding input.calciumParametersByWall",
  );
  const binding = deepFreeze({
    ownerId: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID,
    bindingId: requireNonemptyString(input.bindingId, "binding input.bindingId"),
    scheduleType: ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID,
    scheduleId: schedule.scheduleId,
    scheduleFingerprint: schedule.scheduleFingerprint,
    scheduleEventCount: schedule.eventCount,
    scheduleCoverageStartTimeSec: coverageStart,
    scheduleCoverageEndTimeSec: coverageEnd,
    calciumModelId: EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
    calciumParametersByWall,
    parameterProvenance,
    sourceParameterSetId,
    targetPartition: TARGET_PARTITION,
  });
  const verifiedSchedules = new WeakSet<object>();
  verifiedSchedules.add(schedule);
  SCHEDULE_CAPABILITY_BY_BINDING.set(binding, Object.freeze({
    ownedSchedule: schedule,
    verifiedSchedules,
  }));
  return binding;
}

export function initializeAcceptedFiveWallRhythmCalciumStateV1(
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
  input: AcceptedFiveWallRhythmCalciumStateInputV1,
): AcceptedFiveWallRhythmCalciumStateV1 {
  assertBindingMatchesSchedule(binding, schedule);
  const record = requirePlainRecord(input, "state input");
  requireExactKeys(record, [
    "acceptedTimeSec",
    "revision",
    "initialization",
    "calciumStateByWall",
  ], "state input");
  const acceptedTimeSec = requireTimeWithinCoverage(
    input.acceptedTimeSec,
    binding,
    "state input.acceptedTimeSec",
  );
  const revision = requireNonnegativeInteger(
    input.revision,
    "state input.revision",
  );
  const initialization = requireInitialization(
    input.initialization,
    "state input.initialization",
  );
  const calciumStateByWall = copyAndValidateStatesByWall(
    input.calciumStateByWall,
    binding.calciumParametersByWall,
    "state input.calciumStateByWall",
  );
  const rhythmSchedule = initializeAcceptedRhythmScheduleStateV1(
    schedule,
    acceptedTimeSec,
    revision,
  );
  return freezeAcceptedState({
    binding,
    initialization,
    revision,
    acceptedTimeSec,
    rhythmSchedule,
    calciumStateByWall,
  });
}

/** Public context-bound validation seam for enclosing atomic transactions. */
export function validateAcceptedFiveWallRhythmCalciumStateV1(
  state: AcceptedFiveWallRhythmCalciumStateV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertAcceptedState(state, binding, schedule);
}

/** Read-only current accepted drive; it advances neither calcium nor cursor. */
export function evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1(
  state: AcceptedFiveWallRhythmCalciumStateV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): MainWireFiveWallFreeCalciumDriveV1 {
  assertAcceptedState(state, binding, schedule);
  return deepFreeze({
    freeCalciumUMByWall: mapWalls((wall) =>
      evaluateExactEventCalciumV1(
        state.calciumStateByWall[wall],
        binding.calciumParametersByWall[wall],
      ).freeCalciumUM),
  });
}

/** Pure candidate evaluation over (acceptedTimeSec, candidateTimeSec]. */
export function evaluateAcceptedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedFiveWallRhythmCalciumStateV1,
  candidateTimeSec: number,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedFiveWallRhythmCalciumTrialV1 {
  assertAcceptedState(previous, binding, schedule);
  const candidate = requireTimeWithinCoverage(
    candidateTimeSec,
    binding,
    "candidateTimeSec",
  );
  if (!(candidate > previous.acceptedTimeSec)) {
    throw new Error("candidateTimeSec must exceed acceptedTimeSec");
  }
  const rhythmScheduleTrial = evaluateAcceptedRhythmScheduleTrialV1(
    previous.rhythmSchedule,
    candidate,
    schedule,
  );
  const activationEvents = rhythmScheduleTrial.activationEvents;
  assertCompleteTerminalEventBatch(activationEvents, candidate, schedule);
  const candidateCalciumStateByWall = mapWalls((wall) =>
    advanceExactEventCalciumV1(
      previous.calciumStateByWall[wall],
      previous.acceptedTimeSec,
      candidate,
      exactEventCalciumEventsForRhythmTargetV1(activationEvents, wall),
      binding.calciumParametersByWall[wall],
    ));
  const candidateFreeCalciumUMByWall = deepFreeze(mapWalls((wall) =>
    evaluateExactEventCalciumV1(
      candidateCalciumStateByWall[wall],
      binding.calciumParametersByWall[wall],
    ).freeCalciumUM));
  return deepFreeze({
    trialSchemaId: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID,
    schemaVersion: 1 as const,
    binding,
    baseRevision: previous.revision,
    startTimeSec: previous.acceptedTimeSec,
    candidateTimeSec: candidate,
    rhythmScheduleTrial,
    activationEvents,
    simultaneousBatchCount: countEventBatches(activationEvents),
    candidateCalciumStateByWall,
    candidateFreeCalciumUMByWall,
  });
}

export function commitAcceptedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedFiveWallRhythmCalciumStateV1,
  trial: AcceptedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedFiveWallRhythmCalciumStateV1 {
  assertTrialBase(previous, trial, binding, schedule);
  const expected = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
    previous,
    trial.candidateTimeSec,
    binding,
    schedule,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error("five-wall rhythm-calcium trial does not match reevaluation");
  }
  const rhythmSchedule = commitAcceptedRhythmScheduleTrialV1(
    previous.rhythmSchedule,
    trial.rhythmScheduleTrial,
    schedule,
  );
  return freezeAcceptedState({
    binding,
    initialization: previous.initialization,
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    rhythmSchedule,
    calciumStateByWall: trial.candidateCalciumStateByWall,
  });
}

/** Rejection is identity: neither the event cursor nor calcium state advances. */
export function rollbackAcceptedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedFiveWallRhythmCalciumStateV1,
  trial: AcceptedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedFiveWallRhythmCalciumStateV1 {
  assertTrialBase(previous, trial, binding, schedule);
  rollbackAcceptedRhythmScheduleTrialV1(
    previous.rhythmSchedule,
    trial.rhythmScheduleTrial,
    schedule,
  );
  return previous;
}

export function maximumAcceptedFiveWallRhythmCalciumStepV1(
  previous: AcceptedFiveWallRhythmCalciumStateV1,
  requestedStepSec: number,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedFiveWallRhythmCalciumMaximumStepV1 {
  assertAcceptedState(previous, binding, schedule);
  const scheduleStep = maximumAcceptedRhythmScheduleStepV1(
    previous.rhythmSchedule,
    requestedStepSec,
    schedule,
  );
  const coverageRemaining = binding.scheduleCoverageEndTimeSec
    - previous.acceptedTimeSec;
  if (!(coverageRemaining > 0)) {
    throw new Error("accepted state is already at the schedule coverage end");
  }
  const maximumStepSec = Math.min(scheduleStep.maximumStepSec, coverageRemaining);
  return Object.freeze({
    schedule: scheduleStep,
    coverageClipped: coverageRemaining < scheduleStep.maximumStepSec,
    maximumStepSec,
    candidateTimeSec: previous.acceptedTimeSec + maximumStepSec,
  });
}

export async function checkpointAcceptedFiveWallRhythmCalciumStateV1(
  state: AcceptedFiveWallRhythmCalciumStateV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): Promise<AcceptedFiveWallRhythmCalciumCheckpointV1> {
  assertAcceptedState(state, binding, schedule);
  const scheduleIdentitySha256 =
    await sha256AcceptedRhythmEventScheduleIdentityV1(schedule);
  const payload = deepFreeze({
    checkpointId: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID,
    binding,
    initialization: state.initialization,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    rhythmSchedule: checkpointAcceptedRhythmScheduleStateV1(
      state.rhythmSchedule,
      schedule,
    ),
    scheduleIdentitySha256,
    calciumStateByWall: state.calciumStateByWall,
    exactResumeClaim: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1,
  }) satisfies AcceptedFiveWallRhythmCalciumCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreAcceptedFiveWallRhythmCalciumStateV1(
  candidate: unknown,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): Promise<AcceptedFiveWallRhythmCalciumStateV1> {
  assertBindingMatchesSchedule(binding, schedule);
  const checkpoint = requirePlainRecord(candidate, "rhythm-calcium checkpoint");
  requireExactKeys(checkpoint, [
    "checkpointId",
    "schemaVersion",
    "stateSchemaId",
    "binding",
    "initialization",
    "revision",
    "acceptedTimeSec",
    "rhythmSchedule",
    "scheduleIdentitySha256",
    "calciumStateByWall",
    "exactResumeClaim",
    "checkpointSha256",
  ], "rhythm-calcium checkpoint");
  if (
    checkpoint.checkpointId
      !== ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.stateSchemaId
      !== ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID
  ) throw new Error("unsupported rhythm-calcium checkpoint schema");
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) throw new Error("rhythm-calcium checkpoint SHA-256 is invalid");
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("rhythm-calcium checkpoint SHA-256 mismatch");
  }
  if (
    typeof checkpoint.scheduleIdentitySha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.scheduleIdentitySha256)
    || await sha256AcceptedRhythmEventScheduleIdentityV1(schedule)
      !== checkpoint.scheduleIdentitySha256
  ) throw new Error("rhythm-calcium checkpoint schedule SHA-256 mismatch");
  if (canonicalJsonStringify(checkpoint.binding)
    !== canonicalJsonStringify(binding)) {
    throw new Error("rhythm-calcium checkpoint binding mismatch");
  }
  if (canonicalJsonStringify(checkpoint.exactResumeClaim)
    !== canonicalJsonStringify(ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1)) {
    throw new Error("rhythm-calcium checkpoint claim mismatch");
  }
  const rhythmSchedule = restoreAcceptedRhythmScheduleStateV1(
    checkpoint.rhythmSchedule,
    schedule,
  );
  const revision = requireNonnegativeInteger(
    checkpoint.revision,
    "checkpoint.revision",
  );
  const acceptedTimeSec = requireTimeWithinCoverage(
    checkpoint.acceptedTimeSec,
    binding,
    "checkpoint.acceptedTimeSec",
  );
  if (
    rhythmSchedule.revision !== revision
    || rhythmSchedule.acceptedTimeSec !== acceptedTimeSec
  ) throw new Error("rhythm-calcium checkpoint clock tuple mismatch");
  return freezeAcceptedState({
    binding,
    initialization: requireInitialization(
      checkpoint.initialization,
      "checkpoint.initialization",
    ),
    revision,
    acceptedTimeSec,
    rhythmSchedule,
    calciumStateByWall: copyAndValidateStatesByWall(
      checkpoint.calciumStateByWall,
      binding.calciumParametersByWall,
      "checkpoint.calciumStateByWall",
    ),
  });
}

/**
 * Constructs a finite, deterministic sinus replay schedule and the analytic
 * periodic calcium state at its accepted start. Schedule times are effective
 * calcium-onset times because the V1 schedule adapter has no pending-delay
 * queue. The electrical-to-calcium and AV delays are nevertheless preserved
 * exactly in the two onset formulas recorded in `timing`.
 */
export function createPeriodicSinusFiveWallRhythmCalciumReplayV1(
  params: FiveWallNormalCalciumDriveParamsV1,
  options: PeriodicSinusFiveWallRhythmCalciumReplayOptionsV1,
): PeriodicSinusFiveWallRhythmCalciumReplayV1 {
  validateFiveWallNormalParams(params);
  const optionRecord = requirePlainRecord(options, "periodic replay options");
  requireExactKeys(optionRecord, [
    "scheduleId",
    "bindingId",
    "acceptedTimeSec",
    "endTimeSec",
    "revision",
  ], "periodic replay options");
  const acceptedTimeSec = requireNonnegativeFinite(
    options.acceptedTimeSec,
    "periodic replay options.acceptedTimeSec",
  );
  const endTimeSec = requireNonnegativeFinite(
    options.endTimeSec,
    "periodic replay options.endTimeSec",
  );
  if (!(endTimeSec > acceptedTimeSec)) {
    throw new Error("periodic replay endTimeSec must exceed acceptedTimeSec");
  }
  const revision = requireNonnegativeInteger(
    options.revision,
    "periodic replay options.revision",
  );
  // Exercise the current public evaluator as an additional compatibility
  // guard before translating its parameter structure.
  evaluateFiveWallNormalCalciumDriveV1(acceptedTimeSec, params);

  const cycle = params.cycleLengthSec;
  const atrialOffset = -params.atrioventricularDelaySec
    + params.atrial.electricalToCalciumDelaySec;
  const ventricularOffset = params.ventricular.electricalToCalciumDelaySec;
  const events = periodicSinusEventInputs(
    params,
    acceptedTimeSec,
    endTimeSec,
    atrialOffset,
    ventricularOffset,
  );
  const schedule = createAcceptedRhythmEventScheduleV1(
    requireNonemptyString(options.scheduleId, "periodic replay options.scheduleId"),
    events,
  );

  const convertedByWall = mapWalls((wall) => {
    const tissueClass = ATRIAL_IDS.has(wall) ? params.atrial : params.ventricular;
    return convertPeriodicBiexponentialToExactEventCalciumV1({
      diastolicCalciumUM: tissueClass.diastolicCalciumUM,
      peakAmplitudeUM: tissueClass.peakAmplitudeUM * amplitudeScale(params, wall),
      riseTimeConstantSec: tissueClass.riseTimeConstantSec,
      decayTimeConstantSec: tissueClass.decayTimeConstantSec,
    }, cycle);
  });
  const calciumParametersByWall = deepFreeze(mapWalls((wall) =>
    convertedByWall[wall].parameters));
  const calciumStateByWall = deepFreeze(mapWalls((wall) => {
    const offset = ATRIAL_IDS.has(wall) ? atrialOffset : ventricularOffset;
    const phaseSinceOnsetSec = positiveModulo(acceptedTimeSec - offset, cycle);
    return propagateExactEventCalciumV1(
      convertedByWall[wall].periodicStateImmediatelyAfterEvent,
      phaseSinceOnsetSec,
      convertedByWall[wall].parameters,
    );
  }));
  const binding = createAcceptedFiveWallRhythmCalciumBindingV1(schedule, {
    bindingId: requireNonemptyString(
      options.bindingId,
      "periodic replay options.bindingId",
    ),
    scheduleCoverageStartTimeSec: acceptedTimeSec,
    scheduleCoverageEndTimeSec: endTimeSec,
    calciumParametersByWall,
    parameterProvenance: "five-wall-normal-periodic-analytic-conversion",
    sourceParameterSetId: params.parameterSetId,
  });
  const acceptedState = initializeAcceptedFiveWallRhythmCalciumStateV1(
    binding,
    schedule,
    {
      acceptedTimeSec,
      revision,
      initialization: "periodic-sinus-analytic-state",
      calciumStateByWall,
    },
  );
  return deepFreeze({
    schedule,
    binding,
    acceptedState,
    timing: {
      cycleLengthSec: cycle,
      atrialEffectiveCalciumOnsetOffsetSec: atrialOffset,
      ventricularEffectiveCalciumOnsetOffsetSec: ventricularOffset,
      atrioventricularElectricalDelaySec: params.atrioventricularDelaySec,
      atrialElectricalToCalciumDelaySec:
        params.atrial.electricalToCalciumDelaySec,
      ventricularElectricalToCalciumDelaySec:
        params.ventricular.electricalToCalciumDelaySec,
      initialTimeConvention:
        "events-at-start-are-excluded-from-future-schedule-and-analytically-seeded",
    },
    compatibility: {
      referenceDriveId: "five-wall-normal-prescribed-calcium-drive-v1",
      exactBitParityClaimed: false,
      absoluteToleranceUM:
        FIVE_WALL_PERIODIC_SINUS_REPLAY_ABS_TOLERANCE_UM_V1,
      floatingPointDifferenceSources: [
        "expm1-versus-one-minus-exp-periodic-carry",
        "chunk-dependent-exponential-multiplication-grouping",
      ],
    },
  });
}

function periodicSinusEventInputs(
  params: FiveWallNormalCalciumDriveParamsV1,
  startTimeSec: number,
  endTimeSec: number,
  atrialOffsetSec: number,
  ventricularOffsetSec: number,
): readonly RhythmActivationEventInputV1[] {
  type Raw = Readonly<{
    beatIndex: number;
    tissue: "atria" | "ventricles";
    timeSec: number;
    priority: number;
    targets: readonly string[];
  }>;
  const raw: Raw[] = [];
  appendPeriodicEvents(raw, {
    startTimeSec,
    endTimeSec,
    cycleLengthSec: params.cycleLengthSec,
    offsetSec: atrialOffsetSec,
    tissue: "atria",
    priority: 10,
    targets: TARGET_PARTITION.atrial,
  });
  appendPeriodicEvents(raw, {
    startTimeSec,
    endTimeSec,
    cycleLengthSec: params.cycleLengthSec,
    offsetSec: ventricularOffsetSec,
    tissue: "ventricles",
    priority: 20,
    targets: TARGET_PARTITION.ventricular,
  });
  raw.sort((left, right) =>
    left.timeSec - right.timeSec
    || left.priority - right.priority
    || left.beatIndex - right.beatIndex);
  if (raw.length > MAX_PERIODIC_REPLAY_EVENTS) {
    throw new Error("periodic replay exceeds the finite event safety limit");
  }
  const beatIndices = [...new Set(raw.map((event) => event.beatIndex))]
    .sort((left, right) => left - right);
  const beatOrdinal = new Map(beatIndices.map((beat, index) => [beat, index + 1]));
  return Object.freeze(raw.map((event, sourceSequence) => {
    const beatToken = event.beatIndex < 0
      ? `m${Math.abs(event.beatIndex)}`
      : `p${event.beatIndex}`;
    return Object.freeze({
      eventId: `periodic-sinus:${beatToken}:${event.tissue}`,
      sourceId: `periodic-sinus-replay:${params.parameterSetId}`,
      sourceSequence,
      priority: event.priority,
      beatId: `periodic-sinus:${beatToken}`,
      beatOrdinal: beatOrdinal.get(event.beatIndex)!,
      morphology: "sinus" as const,
      activationTimeSec: event.timeSec,
      targetIds: event.targets,
      activationStrength01: 1,
    });
  }));
}

function appendPeriodicEvents(
  output: Array<Readonly<{
    beatIndex: number;
    tissue: "atria" | "ventricles";
    timeSec: number;
    priority: number;
    targets: readonly string[];
  }>>,
  input: Readonly<{
    startTimeSec: number;
    endTimeSec: number;
    cycleLengthSec: number;
    offsetSec: number;
    tissue: "atria" | "ventricles";
    priority: number;
    targets: readonly string[];
  }>,
): void {
  let beatIndex = Math.floor(
    (input.startTimeSec - input.offsetSec) / input.cycleLengthSec,
  ) + 1;
  let timeSec = canonicalizePeriodicEndpoint(
    beatIndex * input.cycleLengthSec + input.offsetSec,
    input.startTimeSec,
    input.endTimeSec,
    input.cycleLengthSec,
  );
  while (!(timeSec > input.startTimeSec)) {
    beatIndex += 1;
    timeSec = canonicalizePeriodicEndpoint(
      beatIndex * input.cycleLengthSec + input.offsetSec,
      input.startTimeSec,
      input.endTimeSec,
      input.cycleLengthSec,
    );
  }
  while (timeSec <= input.endTimeSec) {
    output.push(Object.freeze({
      beatIndex,
      tissue: input.tissue,
      timeSec,
      priority: input.priority,
      targets: input.targets,
    }));
    if (output.length > MAX_PERIODIC_REPLAY_EVENTS) {
      throw new Error("periodic replay exceeds the finite event safety limit");
    }
    beatIndex += 1;
    timeSec = canonicalizePeriodicEndpoint(
      beatIndex * input.cycleLengthSec + input.offsetSec,
      input.startTimeSec,
      input.endTimeSec,
      input.cycleLengthSec,
    );
  }
}

/**
 * Snaps only round-off-neighbouring analytic grid points to a declared
 * coverage boundary. The 64-ulp scale cannot admit a genuinely later event,
 * while avoiding loss of e.g. 3 * 0.8 + 0.012 at an exact 2.412 endpoint.
 */
function canonicalizePeriodicEndpoint(
  timeSec: number,
  startTimeSec: number,
  endTimeSec: number,
  cycleLengthSec: number,
): number {
  const scale = Math.max(
    1,
    Math.abs(timeSec),
    Math.abs(startTimeSec),
    Math.abs(endTimeSec),
    Math.abs(cycleLengthSec),
  );
  const tolerance = 64 * Number.EPSILON * scale;
  if (Math.abs(timeSec - startTimeSec) <= tolerance) return startTimeSec;
  if (Math.abs(timeSec - endTimeSec) <= tolerance) return endTimeSec;
  return timeSec;
}

function assertCanonicalSchedule(schedule: AcceptedRhythmEventScheduleV1): void {
  // The schedule owner performs and caches its complete structural/fingerprint
  // audit. This call is O(log events) after the first immutable-object audit.
  initializeAcceptedRhythmScheduleStateV1(schedule, 0, 0);
  if (VERIFIED_FIVE_WALL_SCHEDULES.has(schedule)) return;
  const scheduleRecord = requirePlainRecord(schedule, "schedule");
  requireExactKeys(scheduleRecord, [
    "scheduleType",
    "scheduleId",
    "scheduleFingerprint",
    "temporalSemantics",
    "eventCount",
    "events",
  ], "schedule");
  if (!Array.isArray(schedule.events)) throw new Error("schedule.events must be an array");
  requireDenseArray(schedule.events, "schedule.events");
  const reconstructed = createAcceptedRhythmEventScheduleV1(
    schedule.scheduleId,
    schedule.events.map((event, index) => {
      const record = requirePlainRecord(event, `schedule.events[${index}]`);
      requireExactKeys(record, [
        "eventId",
        "sourceId",
        "sourceSequence",
        "priority",
        "beatId",
        "beatOrdinal",
        "morphology",
        "activationTimeSec",
        "targetIds",
        "activationStrength01",
        "calciumEvent",
      ], `schedule.events[${index}]`);
      const calciumEvent = requirePlainRecord(
        event.calciumEvent,
        `schedule.events[${index}].calciumEvent`,
      );
      requireExactKeys(calciumEvent, ["timeSec", "strength"],
        `schedule.events[${index}].calciumEvent`);
      if (
        event.calciumEvent.timeSec !== event.activationTimeSec
        || event.calciumEvent.strength !== event.activationStrength01
      ) throw new Error("schedule calcium event adapter is inconsistent");
      assertClassPureTargets(event, `schedule.events[${index}]`);
      return {
        eventId: event.eventId,
        sourceId: event.sourceId,
        sourceSequence: event.sourceSequence,
        priority: event.priority,
        beatId: event.beatId,
        beatOrdinal: event.beatOrdinal,
        morphology: event.morphology,
        activationTimeSec: event.activationTimeSec,
        targetIds: event.targetIds,
        activationStrength01: event.activationStrength01,
      };
    }),
  );
  if (
    schedule.scheduleType !== reconstructed.scheduleType
    || schedule.scheduleId !== reconstructed.scheduleId
    || schedule.scheduleFingerprint !== reconstructed.scheduleFingerprint
    || schedule.eventCount !== reconstructed.eventCount
    || canonicalJsonStringify(schedule.temporalSemantics)
      !== canonicalJsonStringify(reconstructed.temporalSemantics)
  ) throw new Error("rhythm schedule identity is not canonical");
  VERIFIED_FIVE_WALL_SCHEDULES.add(schedule);
}

function assertClassPureTargets(
  event: AcceptedRhythmActivationEventV1,
  field: string,
): void {
  const atrial = event.targetIds.every((target) => ATRIAL_IDS.has(
    target as FiveWallRhythmCalciumWallIdV1,
  ));
  const ventricular = event.targetIds.every((target) => VENTRICULAR_IDS.has(
    target as FiveWallRhythmCalciumWallIdV1,
  ));
  if (!atrial && !ventricular) {
    throw new Error(`${field} must target only atrial or only ventricular walls`);
  }
  if (event.morphology === "atrial-fibrillatory") {
    throw new Error(
      `${field} atrial-fibrillatory source impulses require a future `
      + "spatial or aggregate calcium adapter",
    );
  }
}

function assertBindingMatchesSchedule(
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertCanonicalSchedule(schedule);
  const capability = SCHEDULE_CAPABILITY_BY_BINDING.get(binding);
  if (capability === undefined) {
    throw new Error(
      "five-wall rhythm-calcium binding mismatch: not a live factory capability",
    );
  }
  if (!capability.verifiedSchedules.has(schedule)) {
    if (canonicalJsonStringify(schedule)
      !== canonicalJsonStringify(capability.ownedSchedule)) {
      throw new Error("five-wall rhythm-calcium live schedule content mismatch");
    }
    capability.verifiedSchedules.add(schedule);
  }
  const record = requirePlainRecord(binding, "binding");
  requireExactKeys(record, [
    "ownerId",
    "bindingId",
    "scheduleType",
    "scheduleId",
    "scheduleFingerprint",
    "scheduleEventCount",
    "scheduleCoverageStartTimeSec",
    "scheduleCoverageEndTimeSec",
    "calciumModelId",
    "calciumParametersByWall",
    "parameterProvenance",
    "sourceParameterSetId",
    "targetPartition",
  ], "binding");
  if (
    binding.ownerId !== ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID
    || binding.scheduleType !== ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID
    || binding.scheduleId !== schedule.scheduleId
    || binding.scheduleFingerprint !== schedule.scheduleFingerprint
    || binding.scheduleEventCount !== schedule.eventCount
    || binding.calciumModelId !== EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID
    || canonicalJsonStringify(binding.targetPartition)
      !== canonicalJsonStringify(TARGET_PARTITION)
  ) throw new Error("five-wall rhythm-calcium binding mismatch");
  requireNonemptyString(binding.bindingId, "binding.bindingId");
  const start = requireNonnegativeFinite(
    binding.scheduleCoverageStartTimeSec,
    "binding.scheduleCoverageStartTimeSec",
  );
  const end = requireNonnegativeFinite(
    binding.scheduleCoverageEndTimeSec,
    "binding.scheduleCoverageEndTimeSec",
  );
  if (!(end > start)) throw new Error("binding schedule coverage is invalid");
  requireParameterProvenance(
    binding.parameterProvenance,
    "binding.parameterProvenance",
  );
  if (binding.sourceParameterSetId !== null) {
    requireNonemptyString(
      binding.sourceParameterSetId,
      "binding.sourceParameterSetId",
    );
  }
  copyAndValidateParametersByWall(
    binding.calciumParametersByWall,
    "binding.calciumParametersByWall",
  );
}

function assertAcceptedState(
  state: AcceptedFiveWallRhythmCalciumStateV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertBindingMatchesSchedule(binding, schedule);
  const record = requirePlainRecord(state, "accepted state");
  requireExactKeys(record, [
    "stateSchemaId",
    "schemaVersion",
    "binding",
    "initialization",
    "revision",
    "acceptedTimeSec",
    "rhythmSchedule",
    "calciumStateByWall",
  ], "accepted state");
  if (
    state.stateSchemaId !== ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID
    || state.schemaVersion !== 1
    || state.binding !== binding
  ) throw new Error("accepted rhythm-calcium state binding mismatch");
  requireInitialization(state.initialization, "state.initialization");
  requireNonnegativeInteger(state.revision, "state.revision");
  requireTimeWithinCoverage(state.acceptedTimeSec, binding, "state.acceptedTimeSec");
  const scheduleState = initializeAcceptedRhythmScheduleStateV1(
    schedule,
    state.acceptedTimeSec,
    state.revision,
  );
  if (canonicalJsonStringify(scheduleState)
    !== canonicalJsonStringify(state.rhythmSchedule)) {
    throw new Error("accepted rhythm-calcium schedule tuple mismatch");
  }
  copyAndValidateStatesByWall(
    state.calciumStateByWall,
    binding.calciumParametersByWall,
    "state.calciumStateByWall",
  );
}

function assertTrialBase(
  previous: AcceptedFiveWallRhythmCalciumStateV1,
  trial: AcceptedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertAcceptedState(previous, binding, schedule);
  const record = requirePlainRecord(trial, "trial");
  requireExactKeys(record, [
    "trialSchemaId",
    "schemaVersion",
    "binding",
    "baseRevision",
    "startTimeSec",
    "candidateTimeSec",
    "rhythmScheduleTrial",
    "activationEvents",
    "simultaneousBatchCount",
    "candidateCalciumStateByWall",
    "candidateFreeCalciumUMByWall",
  ], "trial");
  if (
    trial.trialSchemaId !== ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID
    || trial.schemaVersion !== 1
    || canonicalJsonStringify(trial.binding) !== canonicalJsonStringify(binding)
    || trial.baseRevision !== previous.revision
    || trial.startTimeSec !== previous.acceptedTimeSec
    || !(trial.candidateTimeSec > previous.acceptedTimeSec)
  ) throw new Error("stale or foreign five-wall rhythm-calcium trial");
}

function assertCompleteTerminalEventBatch(
  trialEvents: readonly AcceptedRhythmActivationEventV1[],
  candidateTimeSec: number,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  const scheduledStart = lowerBoundActivationTime(
    schedule.events,
    candidateTimeSec,
  );
  const scheduledEnd = upperBoundActivationTime(
    schedule.events,
    candidateTimeSec,
  );
  let trialStart = trialEvents.length;
  while (
    trialStart > 0
    && trialEvents[trialStart - 1]!.activationTimeSec === candidateTimeSec
  ) trialStart -= 1;
  const scheduledCount = scheduledEnd - scheduledStart;
  const trialCount = trialEvents.length - trialStart;
  if (scheduledCount !== trialCount) {
    throw new Error("candidate event boundary contains an incomplete batch");
  }
  for (let index = 0; index < scheduledCount; index += 1) {
    if (schedule.events[scheduledStart + index]
      !== trialEvents[trialStart + index]) {
      throw new Error("candidate event boundary contains an incomplete batch");
    }
  }
}

function lowerBoundActivationTime(
  events: readonly AcceptedRhythmActivationEventV1[],
  timeSec: number,
): number {
  let lower = 0;
  let upper = events.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (events[middle]!.activationTimeSec < timeSec) lower = middle + 1;
    else upper = middle;
  }
  return lower;
}

function upperBoundActivationTime(
  events: readonly AcceptedRhythmActivationEventV1[],
  timeSec: number,
): number {
  let lower = 0;
  let upper = events.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (events[middle]!.activationTimeSec <= timeSec) lower = middle + 1;
    else upper = middle;
  }
  return lower;
}

function freezeAcceptedState(input: Readonly<{
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  initialization: AcceptedFiveWallRhythmCalciumInitializationV1;
  revision: number;
  acceptedTimeSec: number;
  rhythmSchedule: AcceptedRhythmScheduleStateV1;
  calciumStateByWall: FiveWallExactEventCalciumStatesV1;
}>): AcceptedFiveWallRhythmCalciumStateV1 {
  if (
    input.rhythmSchedule.revision !== input.revision
    || input.rhythmSchedule.acceptedTimeSec !== input.acceptedTimeSec
  ) throw new Error("accepted rhythm-calcium clock tuple is inconsistent");
  return deepFreeze({
    stateSchemaId: ACCEPTED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID,
    schemaVersion: 1 as const,
    binding: input.binding,
    initialization: input.initialization,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    rhythmSchedule: input.rhythmSchedule,
    calciumStateByWall: input.calciumStateByWall,
  });
}

function copyAndValidateParametersByWall(
  input: unknown,
  field: string,
): FiveWallExactEventCalciumParametersV1 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, WALL_IDS, field);
  return deepFreeze(mapWalls((wall) => {
    const parameterField = `${field}.${wall}`;
    const parameters = requirePlainRecord(record[wall], parameterField);
    requireExactKeys(parameters, [
      "tauRiseSec",
      "tauDecaySec",
      "calciumRestUM",
      "calciumGainUMPerUnitDrive",
    ], parameterField);
    const copied = Object.freeze({
      tauRiseSec: requirePositiveFinite(parameters.tauRiseSec,
        `${parameterField}.tauRiseSec`),
      tauDecaySec: requirePositiveFinite(parameters.tauDecaySec,
        `${parameterField}.tauDecaySec`),
      calciumRestUM: requireNonnegativeFinite(parameters.calciumRestUM,
        `${parameterField}.calciumRestUM`),
      calciumGainUMPerUnitDrive: requireNonnegativeFinite(
        parameters.calciumGainUMPerUnitDrive,
        `${parameterField}.calciumGainUMPerUnitDrive`,
      ),
    });
    // The public evaluator validates the time-constant ordering and output.
    evaluateExactEventCalciumV1(Object.freeze([0, 0]), copied);
    return copied;
  }));
}

function copyAndValidateStatesByWall(
  input: unknown,
  parameters: FiveWallExactEventCalciumParametersV1,
  field: string,
): FiveWallExactEventCalciumStatesV1 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, WALL_IDS, field);
  return deepFreeze(mapWalls((wall) => {
    const stateField = `${field}.${wall}`;
    if (!Array.isArray(record[wall]) || record[wall].length !== 2) {
      throw new Error(`${stateField} must contain [riseDrive, decayDrive]`);
    }
    requireDenseArray(record[wall], stateField);
    const state = Object.freeze([
      requireNonnegativeFinite(record[wall][0], `${stateField}[0]`),
      requireNonnegativeFinite(record[wall][1], `${stateField}[1]`),
    ]) as ExactEventCalciumStateV1;
    evaluateExactEventCalciumV1(state, parameters[wall]);
    return state;
  }));
}

function validateFiveWallNormalParams(
  params: FiveWallNormalCalciumDriveParamsV1,
): void {
  const record = requirePlainRecord(params, "five-wall normal calcium params");
  const allowed = [
    "parameterSetId",
    "cycleLengthSec",
    "atrioventricularDelaySec",
    "atrial",
    "ventricular",
    ...(Object.hasOwn(record, "peakAmplitudeScaleByWall")
      ? ["peakAmplitudeScaleByWall"]
      : []),
  ];
  requireExactKeys(record, allowed, "five-wall normal calcium params");
  requireNonemptyString(params.parameterSetId, "params.parameterSetId");
  const cycle = requirePositiveFinite(params.cycleLengthSec, "params.cycleLengthSec");
  const avDelay = requirePositiveFinite(
    params.atrioventricularDelaySec,
    "params.atrioventricularDelaySec",
  );
  if (!(avDelay < cycle)) throw new Error("params AV delay must be shorter than cycle");
  validatePeriodicClass(params.atrial, cycle, "params.atrial");
  validatePeriodicClass(params.ventricular, cycle, "params.ventricular");
  if (params.peakAmplitudeScaleByWall !== undefined) {
    const scales = requirePlainRecord(
      params.peakAmplitudeScaleByWall,
      "params.peakAmplitudeScaleByWall",
    );
    for (const key of Object.keys(scales)) {
      if (!WALL_IDS.includes(key as FiveWallRhythmCalciumWallIdV1)) {
        throw new Error("params.peakAmplitudeScaleByWall has an unexpected wall");
      }
      requireNonnegativeFinite(scales[key], `params.peakAmplitudeScaleByWall.${key}`);
    }
  }
}

function validatePeriodicClass(
  value: PeriodicBiexponentialCalciumClassV1,
  cycleLengthSec: number,
  field: string,
): void {
  const record = requirePlainRecord(value, field);
  requireExactKeys(record, [
    "diastolicCalciumUM",
    "peakAmplitudeUM",
    "riseTimeConstantSec",
    "decayTimeConstantSec",
    "electricalToCalciumDelaySec",
  ], field);
  requireNonnegativeFinite(value.diastolicCalciumUM, `${field}.diastolicCalciumUM`);
  requireNonnegativeFinite(value.peakAmplitudeUM, `${field}.peakAmplitudeUM`);
  const rise = requirePositiveFinite(value.riseTimeConstantSec,
    `${field}.riseTimeConstantSec`);
  const decay = requirePositiveFinite(value.decayTimeConstantSec,
    `${field}.decayTimeConstantSec`);
  if (!(decay > rise)) throw new Error(`${field} decay must exceed rise`);
  const delay = requireNonnegativeFinite(value.electricalToCalciumDelaySec,
    `${field}.electricalToCalciumDelaySec`);
  if (!(delay < cycleLengthSec)) throw new Error(`${field} delay must be shorter than cycle`);
}

function mapWalls<T>(
  mapper: (wall: FiveWallRhythmCalciumWallIdV1) => T,
): { LA: T; RA: T; LVFW: T; SEP: T; RVFW: T } {
  return {
    LA: mapper("LA"),
    RA: mapper("RA"),
    LVFW: mapper("LVFW"),
    SEP: mapper("SEP"),
    RVFW: mapper("RVFW"),
  };
}

function amplitudeScale(
  params: FiveWallNormalCalciumDriveParamsV1,
  wall: FiveWallRhythmCalciumWallIdV1,
): number {
  return params.peakAmplitudeScaleByWall?.[wall] ?? 1;
}

function countEventBatches(
  events: readonly AcceptedRhythmActivationEventV1[],
): number {
  let count = 0;
  let previousTime: number | null = null;
  for (const event of events) {
    if (event.activationTimeSec !== previousTime) {
      count += 1;
      previousTime = event.activationTimeSec;
    }
  }
  return count;
}

function requireTimeWithinCoverage(
  value: unknown,
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  field: string,
): number {
  const time = requireNonnegativeFinite(value, field);
  if (
    time < binding.scheduleCoverageStartTimeSec
    || time > binding.scheduleCoverageEndTimeSec
  ) throw new Error(`${field} lies outside the complete schedule coverage`);
  return time;
}

function requireInitialization(
  value: unknown,
  field: string,
): AcceptedFiveWallRhythmCalciumInitializationV1 {
  if (
    value !== "explicit-accepted-calcium-state"
    && value !== "periodic-sinus-analytic-state"
  ) throw new Error(`${field} is unsupported`);
  return value;
}

function requireParameterProvenance(
  value: unknown,
  field: string,
): AcceptedFiveWallRhythmCalciumParameterProvenanceV1 {
  if (
    value !== "explicit-exact-event-parameters"
    && value !== "five-wall-normal-periodic-analytic-conversion"
  ) throw new Error(`${field} is unsupported`);
  return value;
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) throw new Error(`${field} must be a plain object`);
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  field: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) throw new Error(`${field} has an unexpected field set`);
}

function requireDenseArray(value: readonly unknown[], field: string): void {
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${field} must not contain holes`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireNonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative integer`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

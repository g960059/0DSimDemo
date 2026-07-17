import type { ExactEventCalciumStateV1 } from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  FIVE_WALL_CALCIUM_REPRESENTATIONS_V1,
  FIVE_WALL_CALCIUM_WALL_IDS_V1,
  FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
  assertFiveWallCalciumEventScheduleProviderV1,
  cloneFiveWallCalciumAcceptedStateV1,
  fiveWallCalciumParameterIdentityHashV1,
  sameFiveWallCalciumScheduleTemporalSemanticsV1,
  type FiveWallCalciumAcceptedStateV1,
  type FiveWallCalciumEventScheduleProviderV1,
  type FiveWallCalciumInitializationV1,
  type FiveWallCalciumRepresentationV1,
  type FiveWallCalciumScheduleIdentitySnapshotV1,
  type FiveWallCalciumScheduleTemporalSemanticsV1,
  type FiveWallExactEventCalciumStateByWallV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  exactFiniteJsonCanonicalStringV1,
  exactFiniteJsonFingerprintV1,
  requireCheckpointRecordV1,
  requireExactCheckpointKeysV1,
} from "@/engine/core/exactFiniteJsonCheckpointV1";

export const FIVE_WALL_CALCIUM_CHECKPOINT_V2_ID =
  "five-wall-calcium-checkpoint-v2" as const;

export type FiveWallCalciumCheckpointV2 = Readonly<{
  checkpointId: typeof FIVE_WALL_CALCIUM_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  stateSchemaId: typeof FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID;
  stateSchemaVersion: 1;
  representation: FiveWallCalciumRepresentationV1;
  initializationId: FiveWallCalciumInitializationV1;
  schedule: Readonly<{
    scheduleId: string;
    scheduleIdentityHash: string;
    identitySnapshot: FiveWallCalciumScheduleIdentitySnapshotV1;
    temporalSemantics: FiveWallCalciumScheduleTemporalSemanticsV1;
  }>;
  parameters: Readonly<{
    parameterSetId: string;
    parameterIdentityHash: string;
    parameterSnapshot: FiveWallNormalCalciumDriveParamsV1;
  }>;
  revision: number;
  acceptedTimeSec: number;
  stateByWall: FiveWallExactEventCalciumStateByWallV1;
  fingerprint: string;
}>;

export function checkpointFiveWallCalciumAcceptedStateV2(
  state: FiveWallCalciumAcceptedStateV1,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
): FiveWallCalciumCheckpointV2 {
  const cloned = cloneFiveWallCalciumAcceptedStateV1(state);
  assertFiveWallCalciumEventScheduleProviderV1(schedule);
  assertCalciumCheckpointIdentityMatchesRuntime(cloned, params, schedule);
  const payload = Object.freeze({
    checkpointId: FIVE_WALL_CALCIUM_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: cloned.stateSchemaId,
    stateSchemaVersion: cloned.stateSchemaVersion,
    representation: cloned.representation,
    initializationId: cloned.initializationId,
    schedule: Object.freeze({
      scheduleId: cloned.scheduleId,
      scheduleIdentityHash: cloned.scheduleIdentityHash,
      identitySnapshot: freezeScheduleIdentitySnapshot(schedule.identitySnapshot),
      temporalSemantics: freezeTemporalSemantics(
        cloned.scheduleTemporalSemantics,
      ),
    }),
    parameters: Object.freeze({
      parameterSetId: cloned.parameterSetId,
      parameterIdentityHash: cloned.parameterIdentityHash,
      parameterSnapshot: deepFreezeCheckpointJson(
        params,
      ) as FiveWallNormalCalciumDriveParamsV1,
    }),
    revision: cloned.revision,
    acceptedTimeSec: cloned.acceptedTimeSec,
    stateByWall: freezeStateByWallStrict(cloned.stateByWall),
  });
  return Object.freeze({
    ...payload,
    fingerprint: exactFiniteJsonFingerprintV1(payload),
  });
}

/** Exact-time resume only. No time or revision rebase is accepted here. */
export function restoreFiveWallCalciumAcceptedStateV2(
  candidate: unknown,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
): FiveWallCalciumAcceptedStateV1 {
  const checkpoint = parseFiveWallCalciumCheckpointV2(candidate);
  assertFiveWallCalciumEventScheduleProviderV1(schedule);
  const expectedParameterHash = fiveWallCalciumParameterIdentityHashV1(params);
  if (
    checkpoint.schedule.scheduleId !== schedule.scheduleId
    || checkpoint.schedule.scheduleIdentityHash !== schedule.scheduleIdentityHash
    || checkpoint.parameters.parameterSetId !== params.parameterSetId
    || checkpoint.parameters.parameterIdentityHash !== expectedParameterHash
    || checkpoint.parameters.parameterIdentityHash
      !== fiveWallCalciumParameterIdentityHashV1(
        checkpoint.parameters.parameterSnapshot,
      )
    || exactFiniteJsonCanonicalStringV1(
      checkpoint.parameters.parameterSnapshot,
    ) !== exactFiniteJsonCanonicalStringV1(params)
    || checkpoint.schedule.scheduleIdentityHash
      !== stableHash(checkpoint.schedule.identitySnapshot)
    || exactFiniteJsonCanonicalStringV1(checkpoint.schedule.identitySnapshot)
      !== exactFiniteJsonCanonicalStringV1(schedule.identitySnapshot)
    || !sameFiveWallCalciumScheduleTemporalSemanticsV1(
      checkpoint.schedule.temporalSemantics,
      schedule.temporalSemantics,
    )
  ) throw new Error("five-wall calcium checkpoint runtime identity mismatch");
  return cloneFiveWallCalciumAcceptedStateV1(Object.freeze({
    stateSchemaId: checkpoint.stateSchemaId,
    stateSchemaVersion: checkpoint.stateSchemaVersion,
    representation: checkpoint.representation,
    initializationId: checkpoint.initializationId,
    scheduleId: checkpoint.schedule.scheduleId,
    scheduleIdentityHash: checkpoint.schedule.scheduleIdentityHash,
    scheduleTemporalSemantics: checkpoint.schedule.temporalSemantics,
    parameterSetId: checkpoint.parameters.parameterSetId,
    parameterIdentityHash: checkpoint.parameters.parameterIdentityHash,
    revision: checkpoint.revision,
    acceptedTimeSec: checkpoint.acceptedTimeSec,
    stateByWall: checkpoint.stateByWall,
  }));
}

/** Fixed-periodic phase-boundary restart; revision is always reset to zero. */
export function restoreFiveWallCalciumAtFixedPeriodicCycleWithRevisionResetV2(
  candidate: unknown,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
  targetAcceptedTimeSec: number,
): FiveWallCalciumAcceptedStateV1 {
  const source = restoreFiveWallCalciumAcceptedStateV2(
    candidate,
    params,
    schedule,
  );
  requireNonnegativeFinite(targetAcceptedTimeSec, "targetAcceptedTimeSec");
  const semantics = schedule.temporalSemantics;
  if (
    semantics.kind !== "fixed-periodic"
    || semantics.integerPeriodTranslationInvariant !== true
  ) throw new Error("calcium cycle translation requires a fixed-periodic schedule");
  const cycleShift = (targetAcceptedTimeSec - source.acceptedTimeSec)
    / semantics.periodSec;
  if (!nearlyInteger(cycleShift)) {
    throw new Error("calcium cycle translation must be an integer-period shift");
  }
  if (
    !atPeriodicPhaseBoundary(
      source.acceptedTimeSec,
      semantics.periodSec,
      semantics.phaseOriginSec,
    )
    || !atPeriodicPhaseBoundary(
      targetAcceptedTimeSec,
      semantics.periodSec,
      semantics.phaseOriginSec,
    )
  ) throw new Error("calcium cycle translation requires source and target phase boundaries");
  return cloneFiveWallCalciumAcceptedStateV1(Object.freeze({
    ...source,
    revision: 0,
    acceptedTimeSec: targetAcceptedTimeSec,
  }));
}

function assertCalciumCheckpointIdentityMatchesRuntime(
  state: FiveWallCalciumAcceptedStateV1,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
): void {
  if (
    state.scheduleId !== schedule.scheduleId
    || state.scheduleIdentityHash !== schedule.scheduleIdentityHash
    || !sameFiveWallCalciumScheduleTemporalSemanticsV1(
      state.scheduleTemporalSemantics,
      schedule.temporalSemantics,
    )
    || state.parameterSetId !== params.parameterSetId
    || state.parameterIdentityHash !== fiveWallCalciumParameterIdentityHashV1(params)
  ) throw new Error("accepted calcium state does not match checkpoint runtime identity");
}

function parseFiveWallCalciumCheckpointV2(
  candidate: unknown,
): FiveWallCalciumCheckpointV2 {
  const record = requireCheckpointRecordV1(candidate, "calcium checkpoint");
  if (
    record.checkpointId !== FIVE_WALL_CALCIUM_CHECKPOINT_V2_ID
    || record.schemaVersion !== 2
  ) throw new Error("unsupported calcium checkpoint schema; schema V2 is required");
  requireExactCheckpointKeysV1(record, [
    "checkpointId",
    "schemaVersion",
    "stateSchemaId",
    "stateSchemaVersion",
    "representation",
    "initializationId",
    "schedule",
    "parameters",
    "revision",
    "acceptedTimeSec",
    "stateByWall",
    "fingerprint",
  ], "calcium checkpoint");
  if (typeof record.fingerprint !== "string" || !/^[0-9a-f]{8}$/.test(record.fingerprint)) {
    throw new Error("calcium checkpoint fingerprint is invalid");
  }
  const { fingerprint, ...payload } = record;
  if (exactFiniteJsonFingerprintV1(payload) !== fingerprint) {
    throw new Error("calcium checkpoint fingerprint mismatch");
  }
  if (
    record.stateSchemaId !== FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID
    || record.stateSchemaVersion !== 1
  ) throw new Error("calcium checkpoint accepted-state schema mismatch");
  if (!FIVE_WALL_CALCIUM_REPRESENTATIONS_V1.includes(
    record.representation as FiveWallCalciumRepresentationV1,
  )) throw new Error("unsupported calcium checkpoint representation");
  if (
    record.initializationId !== "regular-periodic-prehistory-from-fixed-prior"
    && record.initializationId !== "event-free-rest"
  ) throw new Error("unsupported calcium checkpoint initialization owner");
  if (
    record.representation === "analytic-periodic-control-with-exact-event-shadow"
    && record.initializationId === "event-free-rest"
  ) throw new Error("event-free calcium checkpoint cannot drive analytic-periodic output");
  if (!Number.isInteger(record.revision) || (record.revision as number) < 0) {
    throw new Error("calcium checkpoint revision must be a nonnegative integer");
  }
  requireNonnegativeFinite(record.acceptedTimeSec, "checkpoint acceptedTimeSec");
  const schedule = requireCheckpointRecordV1(record.schedule, "checkpoint schedule");
  requireExactCheckpointKeysV1(schedule, [
    "scheduleId",
    "scheduleIdentityHash",
    "identitySnapshot",
    "temporalSemantics",
  ], "checkpoint schedule");
  const parameters = requireCheckpointRecordV1(
    record.parameters,
    "checkpoint parameters",
  );
  requireExactCheckpointKeysV1(parameters, [
    "parameterSetId",
    "parameterIdentityHash",
    "parameterSnapshot",
  ], "checkpoint parameters");
  if (
    typeof schedule.scheduleId !== "string"
    || schedule.scheduleId.trim() === ""
    || typeof schedule.scheduleIdentityHash !== "string"
    || !/^[0-9a-f]{8}$/.test(schedule.scheduleIdentityHash)
    || typeof parameters.parameterSetId !== "string"
    || parameters.parameterSetId.trim() === ""
    || typeof parameters.parameterIdentityHash !== "string"
    || !/^[0-9a-f]{8}$/.test(parameters.parameterIdentityHash)
  ) throw new Error("calcium checkpoint schedule or parameter identity is invalid");
  const temporalSemantics = freezeTemporalSemantics(
    schedule.temporalSemantics as FiveWallCalciumScheduleTemporalSemanticsV1,
  );
  const stateByWallRecord = requireCheckpointRecordV1(
    record.stateByWall,
    "checkpoint stateByWall",
  );
  const stateByWall = freezeStateByWallStrict(
    stateByWallRecord as Record<string, ExactEventCalciumStateV1>,
  );
  const identitySnapshot = freezeScheduleIdentitySnapshot(
    schedule.identitySnapshot as FiveWallCalciumScheduleIdentitySnapshotV1,
  );
  const parameterSnapshot = deepFreezeCheckpointJson(
    parameters.parameterSnapshot,
  ) as FiveWallNormalCalciumDriveParamsV1;
  exactFiniteJsonCanonicalStringV1(parameterSnapshot);
  return Object.freeze({
    checkpointId: FIVE_WALL_CALCIUM_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
    stateSchemaVersion: 1 as const,
    representation: record.representation as FiveWallCalciumRepresentationV1,
    initializationId:
      record.initializationId as FiveWallCalciumInitializationV1,
    schedule: Object.freeze({
      scheduleId: schedule.scheduleId,
      scheduleIdentityHash: schedule.scheduleIdentityHash,
      identitySnapshot,
      temporalSemantics,
    }),
    parameters: Object.freeze({
      parameterSetId: parameters.parameterSetId,
      parameterIdentityHash: parameters.parameterIdentityHash,
      parameterSnapshot,
    }),
    revision: record.revision as number,
    acceptedTimeSec: record.acceptedTimeSec as number,
    stateByWall,
    fingerprint,
  });
}

function freezeStateByWallStrict(
  value: Readonly<Record<string, ExactEventCalciumStateV1>>,
): FiveWallExactEventCalciumStateByWallV1 {
  const actual = Object.keys(value).sort();
  const expected = [...FIVE_WALL_CALCIUM_WALL_IDS_V1].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) throw new Error("five-wall calcium state must contain exactly five wall states");
  const frozen = Object.fromEntries(FIVE_WALL_CALCIUM_WALL_IDS_V1.map((wall) => {
    const wallState = value[wall];
    if (!Array.isArray(wallState) || wallState.length !== 2) {
      throw new Error(`missing two-state calcium value for ${wall}`);
    }
    const rise = requireNonnegativeFinite(wallState[0], `${wall}.riseDrive`);
    const decay = requireNonnegativeFinite(wallState[1], `${wall}.decayDrive`);
    if (decay < rise) throw new Error(`${wall} decayDrive must be >= riseDrive`);
    return [wall, Object.freeze([rise, decay] as const)];
  }));
  return Object.freeze(frozen) as FiveWallExactEventCalciumStateByWallV1;
}

function freezeTemporalSemantics(
  value: FiveWallCalciumScheduleTemporalSemanticsV1,
): FiveWallCalciumScheduleTemporalSemanticsV1 {
  sameFiveWallCalciumScheduleTemporalSemanticsV1(value, value);
  return Object.freeze({ ...value });
}

function freezeScheduleIdentitySnapshot(
  value: FiveWallCalciumScheduleIdentitySnapshotV1,
): FiveWallCalciumScheduleIdentitySnapshotV1 {
  exactFiniteJsonCanonicalStringV1(value);
  return deepFreezeCheckpointJson(value) as FiveWallCalciumScheduleIdentitySnapshotV1;
}

function deepFreezeCheckpointJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((child) => deepFreezeCheckpointJson(child)));
  }
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(
      ([key, child]) => [key, deepFreezeCheckpointJson(child)],
    )));
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function nearlyInteger(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - Math.round(value))
    <= 64 * Number.EPSILON * Math.max(1, Math.abs(value));
}

function atPeriodicPhaseBoundary(
  timeSec: number,
  periodSec: number,
  phaseOriginSec: number,
): boolean {
  return nearlyInteger((timeSec - phaseOriginSec) / periodSec);
}

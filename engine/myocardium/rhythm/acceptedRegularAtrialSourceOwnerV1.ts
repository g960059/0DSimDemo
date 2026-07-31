import {
  createSourceImpulseV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/integrity";

/**
 * Minimal regular atrial source clock used by the composed rhythm boundary.
 * It is deliberately a source owner only: capture, AV conduction, calcium,
 * and the meaning of a PAC reset are resolved by the enclosing transaction.
 */

export const REGULAR_ATRIAL_SOURCE_CONFIGURATION_V1_ID =
  "regular-atrial-source-configuration-v1" as const;
export const ACCEPTED_REGULAR_ATRIAL_SOURCE_STATE_V1_ID =
  "accepted-regular-atrial-source-state-v1" as const;
export const ACCEPTED_REGULAR_ATRIAL_SOURCE_CANDIDATE_V1_ID =
  "accepted-regular-atrial-source-candidate-v1" as const;

export const ACCEPTED_REGULAR_ATRIAL_SOURCE_CLAIM_V1 = deepFreeze({
  scope: "minimal-regular-atrial-electrical-source-clock" as const,
  rhythmClasses: Object.freeze(["sinus", "flutter"] as const),
  timing: "explicit-cycle-length-and-explicit-first-future-time" as const,
  sourceAttemptRule:
    "a-due-source-impulse-advances-the-clock-whether-or-not-it-captures" as const,
  pacResetRule:
    "only-an-enclosing-composition-confirmed-captured-PAC-may-reset-a-sinus-clock" as const,
  pacPreserveRule:
    "captured-PAC-preserve-metadata-leaves-the-next-sinus-due-time-unchanged" as const,
  flutterPacResetClaimed: false as const,
  captureClaimed: false as const,
  avConductionClaimed: false as const,
  coordinatedAtrialCalciumClaimed: false as const,
  parameterDefaultsProvided: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
});

export type RegularAtrialRhythmClassV1 = "sinus" | "flutter";
export type CapturedPacSinusClockPolicyV1 = "reset" | "preserve" | null;

export type RegularAtrialSourceConfigurationInputV1 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  sourceId: string;
  rhythmClass: RegularAtrialRhythmClassV1;
  cycleLengthSec: number;
}>;

export type RegularAtrialSourceConfigurationV1 = Readonly<{
  configurationSchemaId: typeof REGULAR_ATRIAL_SOURCE_CONFIGURATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  sourceId: string;
  rhythmClass: RegularAtrialRhythmClassV1;
  cycleLengthSec: number;
}>;

export type AcceptedRegularAtrialSourceInitialStateInputV1 = Readonly<{
  acceptedTimeSec: number;
  firstFutureActivationTimeSec: number;
  firstSourceSequence: number;
}>;

export type AcceptedRegularAtrialSourceStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_REGULAR_ATRIAL_SOURCE_STATE_V1_ID;
  schemaVersion: 1;
  configuration: RegularAtrialSourceConfigurationV1;
  initialAcceptedTimeSec: number;
  initialFirstFutureActivationTimeSec: number;
  initialFirstSourceSequence: number;
  revision: number;
  acceptedTimeSec: number;
  nextActivationTimeSec: number;
  nextSourceSequence: number;
  emittedSourceImpulseCount: number;
  capturedPacResetCount: number;
  capturedPacPreserveCount: number;
}>;

export type AcceptedRegularAtrialSourceCandidateV1 = Readonly<{
  candidateSchemaId: typeof ACCEPTED_REGULAR_ATRIAL_SOURCE_CANDIDATE_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  sourceImpulse: SourceImpulseV2 | null;
  capturedPacSinusClockPolicy: CapturedPacSinusClockPolicyV1;
  candidateState: AcceptedRegularAtrialSourceStateV1;
}>;

const CONFIG_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "sourceId",
  "rhythmClass",
  "cycleLengthSec",
] as const);

export function createRegularAtrialSourceConfigurationV1(
  input: RegularAtrialSourceConfigurationInputV1,
): RegularAtrialSourceConfigurationV1 {
  requireExactKeys(requirePlainRecord(input, "regular atrial source configuration input"), CONFIG_INPUT_KEYS, "regular atrial source configuration input");
  return Object.freeze({
    configurationSchemaId: REGULAR_ATRIAL_SOURCE_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(input.configurationId, "configurationId"),
    ownerInstanceId: requireNonemptyString(input.ownerInstanceId, "ownerInstanceId"),
    sourceId: requireNonemptyString(input.sourceId, "sourceId"),
    rhythmClass: requireRhythmClass(input.rhythmClass),
    cycleLengthSec: requirePositiveFinite(input.cycleLengthSec, "cycleLengthSec"),
  });
}

export function validateRegularAtrialSourceConfigurationV1(
  configuration: RegularAtrialSourceConfigurationV1,
): void {
  const record = requirePlainRecord(configuration, "regular atrial source configuration");
  requireExactKeys(record, ["configurationSchemaId", "schemaVersion", ...CONFIG_INPUT_KEYS], "regular atrial source configuration");
  if (configuration.configurationSchemaId !== REGULAR_ATRIAL_SOURCE_CONFIGURATION_V1_ID || configuration.schemaVersion !== 1) {
    throw new Error("regular atrial source configuration schema is invalid");
  }
  if (!Object.isFrozen(configuration)) throw new Error("regular atrial source configuration must be immutable");
  const rebuilt = createRegularAtrialSourceConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    sourceId: configuration.sourceId,
    rhythmClass: configuration.rhythmClass,
    cycleLengthSec: configuration.cycleLengthSec,
  });
  if (canonicalJsonStringify(configuration) !== canonicalJsonStringify(rebuilt)) {
    throw new Error("regular atrial source configuration is not canonical");
  }
}

export function initializeAcceptedRegularAtrialSourceStateV1(
  configuration: RegularAtrialSourceConfigurationV1,
  input: AcceptedRegularAtrialSourceInitialStateInputV1,
): AcceptedRegularAtrialSourceStateV1 {
  validateRegularAtrialSourceConfigurationV1(configuration);
  requireExactKeys(requirePlainRecord(input, "regular atrial source initial input"), ["acceptedTimeSec", "firstFutureActivationTimeSec", "firstSourceSequence"], "regular atrial source initial input");
  const acceptedTimeSec = requireNonnegativeFinite(input.acceptedTimeSec, "acceptedTimeSec");
  const firstFutureActivationTimeSec = requireNonnegativeFinite(input.firstFutureActivationTimeSec, "firstFutureActivationTimeSec");
  if (!(firstFutureActivationTimeSec > acceptedTimeSec)) {
    throw new Error("first regular atrial activation must be strictly future");
  }
  const firstSourceSequence = requireNonnegativeSafeInteger(input.firstSourceSequence, "firstSourceSequence");
  return Object.freeze({
    stateSchemaId: ACCEPTED_REGULAR_ATRIAL_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration,
    initialAcceptedTimeSec: acceptedTimeSec,
    initialFirstFutureActivationTimeSec: firstFutureActivationTimeSec,
    initialFirstSourceSequence: firstSourceSequence,
    revision: 0,
    acceptedTimeSec,
    nextActivationTimeSec: firstFutureActivationTimeSec,
    nextSourceSequence: firstSourceSequence,
    emittedSourceImpulseCount: 0,
    capturedPacResetCount: 0,
    capturedPacPreserveCount: 0,
  });
}

export function evaluateAcceptedRegularAtrialSourceCandidateV1(
  state: AcceptedRegularAtrialSourceStateV1,
  candidateTimeSec: number,
  capturedPacSinusClockPolicy: CapturedPacSinusClockPolicyV1,
): AcceptedRegularAtrialSourceCandidateV1 {
  validateAcceptedRegularAtrialSourceStateV1(state);
  const candidateTime = requireNonnegativeFinite(candidateTimeSec, "candidateTimeSec");
  if (!(candidateTime > state.acceptedTimeSec)) throw new Error("regular atrial candidate must advance time");
  if (candidateTime > state.nextActivationTimeSec) throw new Error("regular atrial candidate may not cross its next activation");
  if (capturedPacSinusClockPolicy !== null && state.configuration.rhythmClass !== "sinus") {
    throw new Error("PAC sinus-clock policy cannot mutate a flutter source clock");
  }
  if (capturedPacSinusClockPolicy !== null && capturedPacSinusClockPolicy !== "reset" && capturedPacSinusClockPolicy !== "preserve") {
    throw new Error("captured PAC sinus-clock policy is invalid");
  }
  for (const [value, field] of [[state.revision, "revision"], [state.emittedSourceImpulseCount, "emittedSourceImpulseCount"], [state.nextSourceSequence, "nextSourceSequence"], [state.capturedPacResetCount, "capturedPacResetCount"], [state.capturedPacPreserveCount, "capturedPacPreserveCount"]] as const) {
    if (value === Number.MAX_SAFE_INTEGER) throw new Error(`${field} cannot increment safely`);
  }
  const due = candidateTime === state.nextActivationTimeSec;
  const sourceImpulse = due ? createSourceImpulseV2({
    sourceImpulseId: framedId("regular-atrial-source-v1", [state.configuration.configurationId, state.configuration.ownerInstanceId, state.nextSourceSequence]),
    parentCapturedActivationId: null,
    chamber: "atrial",
    sourceKind: "primary-intrinsic",
    sourceId: state.configuration.sourceId,
    sourceSequence: state.nextSourceSequence,
    activationTimeSec: candidateTime,
  }) : null;
  let nextActivationTimeSec = due
    ? safeFutureTime(candidateTime, state.configuration.cycleLengthSec, "next regular atrial activation")
    : state.nextActivationTimeSec;
  if (capturedPacSinusClockPolicy === "reset") {
    nextActivationTimeSec = safeFutureTime(candidateTime, state.configuration.cycleLengthSec, "PAC-reset regular atrial activation");
  }
  const candidateState = Object.freeze({
    stateSchemaId: ACCEPTED_REGULAR_ATRIAL_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: state.configuration,
    initialAcceptedTimeSec: state.initialAcceptedTimeSec,
    initialFirstFutureActivationTimeSec: state.initialFirstFutureActivationTimeSec,
    initialFirstSourceSequence: state.initialFirstSourceSequence,
    revision: state.revision + 1,
    acceptedTimeSec: candidateTime,
    nextActivationTimeSec,
    nextSourceSequence: state.nextSourceSequence + (due ? 1 : 0),
    emittedSourceImpulseCount: state.emittedSourceImpulseCount + (due ? 1 : 0),
    capturedPacResetCount: state.capturedPacResetCount + (capturedPacSinusClockPolicy === "reset" ? 1 : 0),
    capturedPacPreserveCount: state.capturedPacPreserveCount + (capturedPacSinusClockPolicy === "preserve" ? 1 : 0),
  }) satisfies AcceptedRegularAtrialSourceStateV1;
  return Object.freeze({
    candidateSchemaId: ACCEPTED_REGULAR_ATRIAL_SOURCE_CANDIDATE_V1_ID,
    schemaVersion: 1 as const,
    configurationId: state.configuration.configurationId,
    ownerInstanceId: state.configuration.ownerInstanceId,
    baseRevision: state.revision,
    candidateRevision: state.revision + 1,
    startTimeSec: state.acceptedTimeSec,
    candidateTimeSec: candidateTime,
    sourceImpulse,
    capturedPacSinusClockPolicy,
    candidateState,
  });
}

export function commitAcceptedRegularAtrialSourceCandidateV1(
  state: AcceptedRegularAtrialSourceStateV1,
  candidate: AcceptedRegularAtrialSourceCandidateV1,
): AcceptedRegularAtrialSourceStateV1 {
  const expected = evaluateAcceptedRegularAtrialSourceCandidateV1(state, candidate.candidateTimeSec, candidate.capturedPacSinusClockPolicy);
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) throw new Error("regular atrial candidate does not match accepted base");
  return expected.candidateState;
}

export function maximumAcceptedRegularAtrialSourceStepV1(
  state: AcceptedRegularAtrialSourceStateV1,
  requestedStepSec: number,
): number {
  validateAcceptedRegularAtrialSourceStateV1(state);
  const requested = requirePositiveFinite(requestedStepSec, "requestedStepSec");
  return Math.min(requested, state.nextActivationTimeSec - state.acceptedTimeSec);
}

export function validateAcceptedRegularAtrialSourceStateV1(
  state: AcceptedRegularAtrialSourceStateV1,
): void {
  const record = requirePlainRecord(state, "accepted regular atrial source state");
  requireExactKeys(record, ["stateSchemaId", "schemaVersion", "configuration", "initialAcceptedTimeSec", "initialFirstFutureActivationTimeSec", "initialFirstSourceSequence", "revision", "acceptedTimeSec", "nextActivationTimeSec", "nextSourceSequence", "emittedSourceImpulseCount", "capturedPacResetCount", "capturedPacPreserveCount"], "accepted regular atrial source state");
  if (state.stateSchemaId !== ACCEPTED_REGULAR_ATRIAL_SOURCE_STATE_V1_ID || state.schemaVersion !== 1 || !Object.isFrozen(state)) throw new Error("accepted regular atrial source state schema or immutability is invalid");
  validateRegularAtrialSourceConfigurationV1(state.configuration);
  const initial = requireNonnegativeFinite(state.initialAcceptedTimeSec, "initialAcceptedTimeSec");
  const accepted = requireNonnegativeFinite(state.acceptedTimeSec, "acceptedTimeSec");
  const first = requireNonnegativeFinite(state.initialFirstFutureActivationTimeSec, "initialFirstFutureActivationTimeSec");
  if (!(first > initial) || accepted < initial) throw new Error("regular atrial source initial clock is invalid");
  const revision = requireNonnegativeSafeInteger(state.revision, "revision");
  const firstSequence = requireNonnegativeSafeInteger(state.initialFirstSourceSequence, "initialFirstSourceSequence");
  const nextSequence = requireNonnegativeSafeInteger(state.nextSourceSequence, "nextSourceSequence");
  const emitted = requireNonnegativeSafeInteger(state.emittedSourceImpulseCount, "emittedSourceImpulseCount");
  requireNonnegativeSafeInteger(state.capturedPacResetCount, "capturedPacResetCount");
  requireNonnegativeSafeInteger(state.capturedPacPreserveCount, "capturedPacPreserveCount");
  if (revision < emitted || nextSequence !== firstSequence + emitted) throw new Error("regular atrial source counters are inconsistent");
  if (!(requireNonnegativeFinite(state.nextActivationTimeSec, "nextActivationTimeSec") > accepted)) throw new Error("next regular atrial activation must remain future");
}

function framedId(namespace: string, fields: readonly (string | number)[]): string {
  return `${namespace}:${fields.map((field) => `${String(field).length}:${String(field)}`).join("")}`;
}

function safeFutureTime(timeSec: number, durationSec: number, field: string): number {
  const next = timeSec + durationSec;
  if (!Number.isFinite(next) || !(next > timeSec)) throw new Error(`${field} must be strictly future and finite`);
  return next;
}

function requireRhythmClass(value: unknown): RegularAtrialRhythmClassV1 {
  if (value !== "sinus" && value !== "flutter") throw new Error("rhythmClass is invalid");
  return value;
}

function requirePlainRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be a plain object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, expected: readonly string[], field: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new Error(`${field} keys are invalid`);
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${field} must be a nonempty string`);
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) throw new Error(`${field} must be positive finite`);
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`${field} must be nonnegative finite`);
  return value;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${field} must be a nonnegative safe integer`);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

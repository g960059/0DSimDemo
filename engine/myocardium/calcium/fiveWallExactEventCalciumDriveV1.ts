import {
  advanceExactEventCalciumV1,
  convertPeriodicBiexponentialToExactEventCalciumV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  type ExactEventCalciumEventV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallCalciumValuesV1,
  type FiveWallNormalCalciumDriveParamsV1,
  type PeriodicBiexponentialCalciumClassV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

export const FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID =
  "five-wall-exact-event-calcium-2state-per-wall-v1" as const;

export const FIXED_SINUS_FIVE_WALL_CALCIUM_EVENT_SCHEDULE_V1_ID =
  "fixed-sinus-five-wall-calcium-event-schedule-v1" as const;

export const FIVE_WALL_CALCIUM_REPRESENTATIONS_V1 = Object.freeze([
  "analytic-periodic-control-with-exact-event-shadow",
  "exact-event-state",
] as const);

export type FiveWallCalciumRepresentationV1 =
  (typeof FIVE_WALL_CALCIUM_REPRESENTATIONS_V1)[number];

export type FiveWallCalciumInitializationV1 =
  | "regular-periodic-prehistory-from-fixed-prior"
  | "event-free-rest";

export const FIVE_WALL_CALCIUM_WALL_IDS_V1 = Object.freeze([
  "LA",
  "RA",
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type FiveWallCalciumWallIdV1 =
  (typeof FIVE_WALL_CALCIUM_WALL_IDS_V1)[number];

export type FiveWallExactEventCalciumStateByWallV1 = Readonly<Record<
  FiveWallCalciumWallIdV1,
  ExactEventCalciumStateV1
>>;

/**
 * The event owns only timing, strength, and wall selection. The calcium
 * material kernel owns neither the sinus clock nor any future arrhythmia
 * schedule.
 */
export type FiveWallCalciumEventV1 = Readonly<{
  timeSec: number;
  strengthByWall: Readonly<Partial<Record<FiveWallCalciumWallIdV1, number>>>;
}>;

export type FiveWallCalciumEventScheduleProviderV1 = Readonly<{
  scheduleId: string;
  scheduleIdentityHash: string;
  timingOwner: "event-schedule-provider";
  listEventsOpenClosed: (
    startTimeSec: number,
    endTimeSec: number,
  ) => readonly FiveWallCalciumEventV1[];
}>;

export type FiveWallCalciumAcceptedStateV1 = Readonly<{
  stateSchemaId: typeof FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID;
  stateSchemaVersion: 1;
  representation: FiveWallCalciumRepresentationV1;
  initializationId: FiveWallCalciumInitializationV1;
  scheduleId: string;
  scheduleIdentityHash: string;
  parameterSetId: string;
  revision: number;
  acceptedTimeSec: number;
  stateByWall: FiveWallExactEventCalciumStateByWallV1;
}>;

export type FiveWallCalciumTrialV1 = Readonly<{
  stateSchemaId: typeof FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID;
  baseRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  events: readonly FiveWallCalciumEventV1[];
  candidateStateByWall: FiveWallExactEventCalciumStateByWallV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
}>;

export type FiveWallExactEventCalciumParameterBundleV1 = Readonly<{
  atrial: ExactEventCalciumParametersV1;
  ventricular: ExactEventCalciumParametersV1;
}>;

export const FIVE_WALL_EXACT_EVENT_CALCIUM_CLAIM_V1 = Object.freeze({
  stateCount: 10 as const,
  statePerWall: Object.freeze(["riseDrive", "decayDrive"] as const),
  outputRepresentations: FIVE_WALL_CALCIUM_REPRESENTATIONS_V1,
  analyticControlCarriesExactEventShadowState: true as const,
  eventTimingOwnedByKernel: false as const,
  fixedSinusScheduleIsFirstProviderNotKernelLogic: true as const,
  wallSelectiveEventsSupported: true as const,
  calciumCyclingClaimed: false as const,
  restitutionClaimed: false as const,
  refractorinessClaimed: false as const,
  parameterFittingUsed: false as const,
});

export function createFixedSinusFiveWallCalciumEventScheduleV1(
  params: FiveWallNormalCalciumDriveParamsV1,
): FiveWallCalciumEventScheduleProviderV1 {
  validateDriveParamsForEvents(params);
  const cycle = params.cycleLengthSec;
  const ventricularPhaseSec = positiveModulo(
    params.ventricular.electricalToCalciumDelaySec,
    cycle,
  );
  const atrialPhaseSec = positiveModulo(
    cycle - params.atrioventricularDelaySec
      + params.atrial.electricalToCalciumDelaySec,
    cycle,
  );
  const scheduleId = [
    FIXED_SINUS_FIVE_WALL_CALCIUM_EVENT_SCHEDULE_V1_ID,
    `cycle=${cycle}`,
    `avDelay=${params.atrioventricularDelaySec}`,
    `atrialCaDelay=${params.atrial.electricalToCalciumDelaySec}`,
    `ventricularCaDelay=${params.ventricular.electricalToCalciumDelaySec}`,
  ].join(":");
  const scheduleIdentityHash = stableHash(sanitizeForStableHash({
    scheduleType: FIXED_SINUS_FIVE_WALL_CALCIUM_EVENT_SCHEDULE_V1_ID,
    cycleLengthSec: cycle,
    atrioventricularDelaySec: params.atrioventricularDelaySec,
    atrialElectricalToCalciumDelaySec:
      params.atrial.electricalToCalciumDelaySec,
    ventricularElectricalToCalciumDelaySec:
      params.ventricular.electricalToCalciumDelaySec,
    atrialWallStrengths: { LA: 1, RA: 1 },
    ventricularWallStrengths: { LVFW: 1, SEP: 1, RVFW: 1 },
  }));
  return Object.freeze({
    scheduleId,
    scheduleIdentityHash,
    timingOwner: "event-schedule-provider" as const,
    listEventsOpenClosed: (startTimeSec: number, endTimeSec: number) => {
      validateInterval(startTimeSec, endTimeSec);
      const events = [
        ...periodicEventsOpenClosed(
          startTimeSec,
          endTimeSec,
          cycle,
          ventricularPhaseSec,
          Object.freeze({ LVFW: 1, SEP: 1, RVFW: 1 }),
        ),
        ...periodicEventsOpenClosed(
          startTimeSec,
          endTimeSec,
          cycle,
          atrialPhaseSec,
          Object.freeze({ LA: 1, RA: 1 }),
        ),
      ].sort((left, right) => left.timeSec - right.timeSec);
      return Object.freeze(events);
    },
  });
}

/** A finite explicit schedule is the minimal irregular/wall-selective API. */
export function createExplicitFiveWallCalciumEventScheduleV1(
  scheduleId: string,
  events: readonly FiveWallCalciumEventV1[],
): FiveWallCalciumEventScheduleProviderV1 {
  if (scheduleId.trim() === "") throw new Error("scheduleId must be non-empty");
  const validated = freezeAndValidateEvents(events);
  const scheduleIdentityHash = stableHash(sanitizeForStableHash({
    scheduleType: "explicit-five-wall-calcium-event-schedule-v1",
    scheduleId,
    events: validated,
  }));
  return Object.freeze({
    scheduleId,
    scheduleIdentityHash,
    timingOwner: "event-schedule-provider" as const,
    listEventsOpenClosed: (startTimeSec: number, endTimeSec: number) => {
      validateInterval(startTimeSec, endTimeSec);
      return Object.freeze(validated.filter((event) =>
        event.timeSec > startTimeSec && event.timeSec <= endTimeSec));
    },
  });
}

export function initializeFiveWallCalciumAcceptedStateV1(
  timeSec: number,
  revision: number,
  representation: FiveWallCalciumRepresentationV1,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
  initializationId: FiveWallCalciumInitializationV1,
): Readonly<{
  acceptedState: FiveWallCalciumAcceptedStateV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
}> {
  requireNonnegativeFinite(timeSec, "timeSec");
  if (!Number.isInteger(revision) || revision < 0) {
    throw new Error("revision must be a nonnegative integer");
  }
  validateRepresentation(representation);
  validateSchedule(schedule);
  validateInitialization(initializationId);
  if (
    initializationId === "event-free-rest"
    && representation === "analytic-periodic-control-with-exact-event-shadow"
  ) {
    throw new Error("event-free calcium initialization requires exact-event output");
  }
  const stateByWall = initializationId
      === "regular-periodic-prehistory-from-fixed-prior"
    ? initialPeriodicStateByWall(timeSec, params)
    : zeroStateByWall();
  const acceptedState = freezeAcceptedState({
    representation,
    initializationId,
    scheduleId: schedule.scheduleId,
    scheduleIdentityHash: schedule.scheduleIdentityHash,
    parameterSetId: params.parameterSetId,
    revision,
    acceptedTimeSec: timeSec,
    stateByWall,
  });
  return Object.freeze({
    acceptedState,
    calciumDrive: evaluateFiveWallCalciumOutputV1(acceptedState, params),
  });
}

export function evaluateFiveWallCalciumTrialV1(
  previous: FiveWallCalciumAcceptedStateV1,
  candidateTimeSec: number,
  params: FiveWallNormalCalciumDriveParamsV1,
  schedule: FiveWallCalciumEventScheduleProviderV1,
): FiveWallCalciumTrialV1 {
  validateAcceptedState(previous);
  validateSchedule(schedule);
  if (schedule.scheduleId !== previous.scheduleId) {
    throw new Error("calcium event schedule identity changed within a transaction");
  }
  if (schedule.scheduleIdentityHash !== previous.scheduleIdentityHash) {
    throw new Error("calcium event schedule content changed within a transaction");
  }
  if (params.parameterSetId !== previous.parameterSetId) {
    throw new Error("calcium parameter identity changed within a transaction");
  }
  requireNonnegativeFinite(candidateTimeSec, "candidateTimeSec");
  if (!(candidateTimeSec > previous.acceptedTimeSec)) {
    throw new Error("candidateTimeSec must exceed the accepted calcium time");
  }
  const events = freezeAndValidateEvents(
    schedule.listEventsOpenClosed(previous.acceptedTimeSec, candidateTimeSec),
    previous.acceptedTimeSec,
    candidateTimeSec,
  );
  const endpointToleranceSec = timeComparisonToleranceSec(
    previous.acceptedTimeSec,
    candidateTimeSec,
  );
  const internalEvent = events.find((event) =>
    event.timeSec < candidateTimeSec - endpointToleranceSec);
  if (
    internalEvent !== undefined
    && previous.representation === "exact-event-state"
  ) {
    throw new Error(
      `calcium event at ${internalEvent.timeSec} s lies inside the mechanics interval; split the interval at the event`,
    );
  }
  const parameters = convertFiveWallParameters(params);
  const candidateStateByWall = freezeStateByWall(Object.fromEntries(
    FIVE_WALL_CALCIUM_WALL_IDS_V1.map((wall) => {
      const wallEvents: ExactEventCalciumEventV1[] = [];
      for (const event of events) {
        const strength = event.strengthByWall[wall];
        if (strength !== undefined) {
          wallEvents.push(Object.freeze({ timeSec: event.timeSec, strength }));
        }
      }
      const state = advanceExactEventCalciumV1(
        previous.stateByWall[wall],
        previous.acceptedTimeSec,
        candidateTimeSec,
        wallEvents,
        parametersForWall(wall, parameters),
      );
      return [wall, state] as const;
    }),
  ));
  const candidateAcceptedShape = freezeAcceptedState({
    representation: previous.representation,
    initializationId: previous.initializationId,
    scheduleId: previous.scheduleId,
    scheduleIdentityHash: previous.scheduleIdentityHash,
    parameterSetId: previous.parameterSetId,
    revision: previous.revision + 1,
    acceptedTimeSec: candidateTimeSec,
    stateByWall: candidateStateByWall,
  });
  return Object.freeze({
    stateSchemaId: FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
    baseRevision: previous.revision,
    startTimeSec: previous.acceptedTimeSec,
    candidateTimeSec,
    events,
    candidateStateByWall,
    calciumDrive: evaluateFiveWallCalciumOutputV1(candidateAcceptedShape, params),
  });
}

export function commitFiveWallCalciumTrialV1(
  previous: FiveWallCalciumAcceptedStateV1,
  trial: FiveWallCalciumTrialV1,
): FiveWallCalciumAcceptedStateV1 {
  validateAcceptedState(previous);
  if (
    trial.stateSchemaId !== previous.stateSchemaId
    || trial.baseRevision !== previous.revision
    || trial.startTimeSec !== previous.acceptedTimeSec
    || !(trial.candidateTimeSec > previous.acceptedTimeSec)
  ) throw new Error("calcium trial identity does not match accepted state");
  return freezeAcceptedState({
    representation: previous.representation,
    initializationId: previous.initializationId,
    scheduleId: previous.scheduleId,
    scheduleIdentityHash: previous.scheduleIdentityHash,
    parameterSetId: previous.parameterSetId,
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    stateByWall: trial.candidateStateByWall,
  });
}

export function cloneFiveWallCalciumAcceptedStateV1(
  state: FiveWallCalciumAcceptedStateV1,
): FiveWallCalciumAcceptedStateV1 {
  validateAcceptedState(state);
  return freezeAcceptedState({
    representation: state.representation,
    initializationId: state.initializationId,
    scheduleId: state.scheduleId,
    scheduleIdentityHash: state.scheduleIdentityHash,
    parameterSetId: state.parameterSetId,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    stateByWall: state.stateByWall,
  });
}

export function evaluateFiveWallCalciumOutputV1(
  state: FiveWallCalciumAcceptedStateV1,
  params: FiveWallNormalCalciumDriveParamsV1,
): MainWireFiveWallFreeCalciumDriveV1 {
  validateAcceptedState(state);
  if (params.parameterSetId !== state.parameterSetId) {
    throw new Error("calcium output parameter identity mismatch");
  }
  if (state.representation === "analytic-periodic-control-with-exact-event-shadow") {
    const analytic = evaluateFiveWallNormalCalciumDriveV1(
      state.acceptedTimeSec,
      params,
    );
    return Object.freeze({ freeCalciumUMByWall: analytic.freeCalciumUMByWall });
  }
  const parameters = convertFiveWallParameters(params);
  const values = Object.fromEntries(FIVE_WALL_CALCIUM_WALL_IDS_V1.map((wall) => [
    wall,
    evaluateExactEventCalciumV1(
      state.stateByWall[wall],
      parametersForWall(wall, parameters),
    ).freeCalciumUM,
  ])) as Record<FiveWallCalciumWallIdV1, number>;
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze(values) as FiveWallCalciumValuesV1,
  });
}

/**
 * Returns deterministic subinterval endpoints. Each event strictly inside the
 * requested interval becomes a mechanics boundary; the requested end is
 * always the final endpoint.
 */
export function splitFiveWallCalciumIntervalAtEventsV1(
  startTimeSec: number,
  endTimeSec: number,
  schedule: FiveWallCalciumEventScheduleProviderV1,
): readonly number[] {
  validateInterval(startTimeSec, endTimeSec);
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("split interval must have positive duration");
  }
  validateSchedule(schedule);
  const events = freezeAndValidateEvents(
    schedule.listEventsOpenClosed(startTimeSec, endTimeSec),
    startTimeSec,
    endTimeSec,
  );
  const endpoints: number[] = [];
  for (const event of events) {
    if (
      event.timeSec < endTimeSec
        - timeComparisonToleranceSec(startTimeSec, endTimeSec)
      && endpoints.at(-1) !== event.timeSec
    ) {
      endpoints.push(event.timeSec);
    }
  }
  endpoints.push(endTimeSec);
  return Object.freeze(endpoints);
}

export function convertFiveWallExactEventCalciumParametersV1(
  params: FiveWallNormalCalciumDriveParamsV1,
): FiveWallExactEventCalciumParameterBundleV1 {
  return convertFiveWallParameters(params);
}

function initialPeriodicStateByWall(
  timeSec: number,
  params: FiveWallNormalCalciumDriveParamsV1,
): FiveWallExactEventCalciumStateByWallV1 {
  validateDriveParamsForEvents(params);
  const conversions = {
    atrial: conversion(params.atrial, params.cycleLengthSec),
    ventricular: conversion(params.ventricular, params.cycleLengthSec),
  };
  const ventricularOnsetSec = positiveModulo(
    params.ventricular.electricalToCalciumDelaySec,
    params.cycleLengthSec,
  );
  const atrialOnsetSec = positiveModulo(
    params.cycleLengthSec - params.atrioventricularDelaySec
      + params.atrial.electricalToCalciumDelaySec,
    params.cycleLengthSec,
  );
  const atrialAgeSec = positiveModulo(
    timeSec - atrialOnsetSec,
    params.cycleLengthSec,
  );
  const ventricularAgeSec = positiveModulo(
    timeSec - ventricularOnsetSec,
    params.cycleLengthSec,
  );
  return freezeStateByWall({
    LA: propagateExactEventCalciumV1(
      conversions.atrial.periodicStateImmediatelyAfterEvent,
      atrialAgeSec,
      conversions.atrial.parameters,
    ),
    RA: propagateExactEventCalciumV1(
      conversions.atrial.periodicStateImmediatelyAfterEvent,
      atrialAgeSec,
      conversions.atrial.parameters,
    ),
    LVFW: propagateExactEventCalciumV1(
      conversions.ventricular.periodicStateImmediatelyAfterEvent,
      ventricularAgeSec,
      conversions.ventricular.parameters,
    ),
    SEP: propagateExactEventCalciumV1(
      conversions.ventricular.periodicStateImmediatelyAfterEvent,
      ventricularAgeSec,
      conversions.ventricular.parameters,
    ),
    RVFW: propagateExactEventCalciumV1(
      conversions.ventricular.periodicStateImmediatelyAfterEvent,
      ventricularAgeSec,
      conversions.ventricular.parameters,
    ),
  });
}

function convertFiveWallParameters(
  params: FiveWallNormalCalciumDriveParamsV1,
): FiveWallExactEventCalciumParameterBundleV1 {
  validateDriveParamsForEvents(params);
  return Object.freeze({
    atrial: conversion(params.atrial, params.cycleLengthSec).parameters,
    ventricular: conversion(params.ventricular, params.cycleLengthSec).parameters,
  });
}

function conversion(
  value: PeriodicBiexponentialCalciumClassV1,
  cycleLengthSec: number,
) {
  return convertPeriodicBiexponentialToExactEventCalciumV1({
    diastolicCalciumUM: value.diastolicCalciumUM,
    peakAmplitudeUM: value.peakAmplitudeUM,
    riseTimeConstantSec: value.riseTimeConstantSec,
    decayTimeConstantSec: value.decayTimeConstantSec,
  }, cycleLengthSec);
}

function parametersForWall(
  wall: FiveWallCalciumWallIdV1,
  parameters: FiveWallExactEventCalciumParameterBundleV1,
): ExactEventCalciumParametersV1 {
  return wall === "LA" || wall === "RA"
    ? parameters.atrial
    : parameters.ventricular;
}

function periodicEventsOpenClosed(
  startTimeSec: number,
  endTimeSec: number,
  cycleLengthSec: number,
  phaseSec: number,
  strengthByWall: FiveWallCalciumEventV1["strengthByWall"],
): FiveWallCalciumEventV1[] {
  const events: FiveWallCalciumEventV1[] = [];
  let cycleIndex = Math.floor((startTimeSec - phaseSec) / cycleLengthSec) + 1;
  while (true) {
    const timeSec = phaseSec + cycleIndex * cycleLengthSec;
    if (timeSec > endTimeSec) break;
    if (timeSec >= 0 && timeSec > startTimeSec) {
      events.push(Object.freeze({ timeSec, strengthByWall }));
    }
    cycleIndex += 1;
  }
  return events;
}

function freezeAcceptedState(input: Readonly<{
  representation: FiveWallCalciumRepresentationV1;
  initializationId: FiveWallCalciumInitializationV1;
  scheduleId: string;
  scheduleIdentityHash: string;
  parameterSetId: string;
  revision: number;
  acceptedTimeSec: number;
  stateByWall: FiveWallExactEventCalciumStateByWallV1;
}>): FiveWallCalciumAcceptedStateV1 {
  return Object.freeze({
    stateSchemaId: FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID,
    stateSchemaVersion: 1 as const,
    representation: input.representation,
    initializationId: input.initializationId,
    scheduleId: input.scheduleId,
    scheduleIdentityHash: input.scheduleIdentityHash,
    parameterSetId: input.parameterSetId,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    stateByWall: freezeStateByWall(input.stateByWall),
  });
}

function freezeStateByWall(
  value: Readonly<Record<string, ExactEventCalciumStateV1>>,
): FiveWallExactEventCalciumStateByWallV1 {
  const state = Object.fromEntries(FIVE_WALL_CALCIUM_WALL_IDS_V1.map((wall) => {
    const wallState = value[wall];
    if (wallState === undefined || wallState.length !== 2) {
      throw new Error(`missing two-state calcium value for ${wall}`);
    }
    const rise = requireNonnegativeFinite(wallState[0], `${wall}.riseDrive`);
    const decay = requireNonnegativeFinite(wallState[1], `${wall}.decayDrive`);
    if (decay < rise) throw new Error(`${wall} decayDrive must be >= riseDrive`);
    return [wall, Object.freeze([rise, decay] as [number, number])] as const;
  }));
  return Object.freeze(state) as FiveWallExactEventCalciumStateByWallV1;
}

function validateAcceptedState(state: FiveWallCalciumAcceptedStateV1): void {
  if (
    state.stateSchemaId !== FIVE_WALL_EXACT_EVENT_CALCIUM_STATE_SCHEMA_V1_ID
    || state.stateSchemaVersion !== 1
    || !Number.isInteger(state.revision)
    || state.revision < 0
  ) throw new Error("invalid accepted five-wall calcium state identity");
  requireNonnegativeFinite(state.acceptedTimeSec, "acceptedTimeSec");
  validateRepresentation(state.representation);
  validateInitialization(state.initializationId);
  if (
    state.scheduleId.trim() === ""
    || !/^[0-9a-f]{8}$/.test(state.scheduleIdentityHash)
    || state.parameterSetId.trim() === ""
  ) {
    throw new Error("accepted calcium schedule and parameter identities must be non-empty");
  }
  freezeStateByWall(state.stateByWall);
}

function validateRepresentation(value: FiveWallCalciumRepresentationV1): void {
  if (!FIVE_WALL_CALCIUM_REPRESENTATIONS_V1.includes(value)) {
    throw new Error(`unsupported calcium representation: ${String(value)}`);
  }
}

function validateSchedule(schedule: FiveWallCalciumEventScheduleProviderV1): void {
  if (
    schedule.scheduleId.trim() === ""
    || !/^[0-9a-f]{8}$/.test(schedule.scheduleIdentityHash)
    || schedule.timingOwner !== "event-schedule-provider"
    || typeof schedule.listEventsOpenClosed !== "function"
  ) throw new Error("invalid calcium event schedule provider");
}

function validateInitialization(value: FiveWallCalciumInitializationV1): void {
  if (
    value !== "regular-periodic-prehistory-from-fixed-prior"
    && value !== "event-free-rest"
  ) throw new Error("unsupported calcium initialization owner");
}

function zeroStateByWall(): FiveWallExactEventCalciumStateByWallV1 {
  return freezeStateByWall(Object.fromEntries(
    FIVE_WALL_CALCIUM_WALL_IDS_V1.map((wall) => [
      wall,
      Object.freeze([0, 0] as const),
    ]),
  ));
}

function freezeAndValidateEvents(
  events: readonly FiveWallCalciumEventV1[],
  startTimeSec?: number,
  endTimeSec?: number,
): readonly FiveWallCalciumEventV1[] {
  if (!Array.isArray(events)) throw new Error("calcium events must be an array");
  let previousTimeSec = -Infinity;
  return Object.freeze(events.map((event, index) => {
    requireNonnegativeFinite(event.timeSec, `events[${index}].timeSec`);
    if (event.timeSec < previousTimeSec) {
      throw new Error("calcium events must be ordered by time");
    }
    previousTimeSec = event.timeSec;
    if (
      startTimeSec !== undefined
      && endTimeSec !== undefined
      && (!(event.timeSec > startTimeSec) || event.timeSec > endTimeSec)
    ) throw new Error("schedule returned an event outside (start,end]");
    const entries = Object.entries(event.strengthByWall);
    if (entries.length === 0) throw new Error("calcium event must select at least one wall");
    const strengths: Partial<Record<FiveWallCalciumWallIdV1, number>> = {};
    for (const [wall, strength] of entries) {
      if (!FIVE_WALL_CALCIUM_WALL_IDS_V1.includes(wall as FiveWallCalciumWallIdV1)) {
        throw new Error(`unsupported calcium event wall: ${wall}`);
      }
      strengths[wall as FiveWallCalciumWallIdV1] = requireNonnegativeFinite(
        strength as number,
        `events[${index}].strengthByWall.${wall}`,
      );
    }
    return Object.freeze({
      timeSec: event.timeSec,
      strengthByWall: Object.freeze(strengths),
    });
  }));
}

function validateDriveParamsForEvents(
  params: FiveWallNormalCalciumDriveParamsV1,
): void {
  if (params.parameterSetId.trim() === "") {
    throw new Error("calcium parameterSetId must be non-empty");
  }
  requirePositiveFinite(params.cycleLengthSec, "cycleLengthSec");
  requirePositiveFinite(params.atrioventricularDelaySec, "atrioventricularDelaySec");
  if (!(params.atrioventricularDelaySec < params.cycleLengthSec)) {
    throw new Error("atrioventricularDelaySec must be shorter than cycle");
  }
}

function validateInterval(startTimeSec: number, endTimeSec: number): void {
  requireNonnegativeFinite(startTimeSec, "startTimeSec");
  requireNonnegativeFinite(endTimeSec, "endTimeSec");
  if (endTimeSec < startTimeSec) throw new Error("endTimeSec must be >= startTimeSec");
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
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

function timeComparisonToleranceSec(left: number, right: number): number {
  return 64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right));
}

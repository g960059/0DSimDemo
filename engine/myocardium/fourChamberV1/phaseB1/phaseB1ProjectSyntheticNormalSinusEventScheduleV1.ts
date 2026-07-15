import {
  calciumDriveEventFromElectricalV1,
  type ElectricalActivationEventV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import type {
  PhaseB1WallCalciumDriveEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
  type PhaseB1WallTissueClassV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID =
  "phase-b1-project-synthetic-normal-sinus-five-wall-event-schedule-v1" as const;

export const PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_SCHEMA_V1_ID =
  "phase-b1-project-synthetic-normal-sinus-event-schedule-schema-v1" as const;

export const PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1 =
  Object.freeze(["RA", "LA", "SEP", "RVFW", "LVFW"] as const);

export const PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_HEART_RATE_BPM_V1 = 75 as const;
export const PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1 = 0.8 as const;

const EVENT_STRENGTH = 1 as const;
const TISSUE_MANIFEST_TIMING_OWNER =
  "tissue-manifest-electrical-to-calcium-delay" as const;

const ELECTRICAL_OFFSET_SEC_BY_WALL = deepFreeze({
  LA: 0.030,
  RA: 0,
  LVFW: 0.180,
  SEP: 0.160,
  RVFW: 0.170,
} as const);

const LITERATURE_CONTEXT = deepFreeze({
  atrial: {
    doi: "10.3389/fphys.2017.00965",
    pmcId: "PMC5650557",
    role: "atrial-activation-sequence-literature-context-only",
  },
  ventricular: {
    doi: "10.3389/fphys.2016.01337",
    pmcId: "PMC5225966",
    role: "ventricular-activation-sequence-literature-context-only",
  },
  valueDerivation:
    "project-reduction-not-direct-calibration-from-cited-literature",
} as const);

const CLAIM_BOUNDARY = deepFreeze({
  candidatePrior: true,
  projectSynthetic: true,
  citedLiteratureIsContextOnly: true,
  valuesDirectlyCalibratedFromCitedLiterature: false,
  physiologicalAcceptanceClaimed: false,
  fullBeatAcceptanceClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
} as const);

const INTERVAL_OWNERSHIP = deepFreeze({
  interval: "(start,end]",
  startBoundaryIncluded: false,
  endBoundaryIncluded: true,
  stateAtStart:
    "right-continuous-events-at-start-have-already-been-applied",
} as const);

const REPEAT_POLICY = deepFreeze({
  cycleIndexOrigin: 0,
  repeatPeriodSec: PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
  absoluteTimeRule:
    "cycle-index-times-cycle-length-plus-within-cycle-offset",
  eventKeyRule: "wall-id-colon-schedule-id-colon-cycle-index-colon-wall-id",
} as const);

export type PhaseB1ProjectSyntheticNormalSinusTimingSourceV1 = Readonly<{
  tissueClass: PhaseB1WallTissueClassV1;
  tissueManifestSha256: string;
  prescribedCalciumEvidenceId: string;
  electricalToCalciumDelaySec: number;
}>;

export type PhaseB1ProjectSyntheticNormalSinusScheduledEventV1 = Readonly<{
  eventKey: string;
  cycleIndex: number;
  wallId: FourChamberWallId;
  tissueClass: PhaseB1WallTissueClassV1;
  electricalOffsetWithinCycleSec: number;
  calciumDriveOffsetWithinCycleSec: number;
  electricalEvent: Readonly<ElectricalActivationEventV1>;
  calciumDriveEvent: PhaseB1WallCalciumDriveEventV1;
}>;

export type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1 = Readonly<{
  schemaId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_SCHEMA_V1_ID;
  scheduleId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID;
  status:
    "candidate-prior-project-reduction-not-physiological-acceptance";
  rhythm: "normal-sinus-project-synthetic";
  heartRateBpm:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_HEART_RATE_BPM_V1;
  cycleLengthSec:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1;
  activationOrder:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1;
  intervalOwnership: typeof INTERVAL_OWNERSHIP;
  repeatPolicy: typeof REPEAT_POLICY;
  sourceBindings: Readonly<{
    phaseA1TissueManifestBundleSha256: string;
    phaseB1WallMaterialBindingSha256: string;
    calciumTimingOwner: typeof TISSUE_MANIFEST_TIMING_OWNER;
    timingByWall: Readonly<
      Record<FourChamberWallId, PhaseB1ProjectSyntheticNormalSinusTimingSourceV1>
    >;
  }>;
  literatureContext: typeof LITERATURE_CONTEXT;
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[];
  claimBoundary: typeof CLAIM_BOUNDARY;
  hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  contentSha256: string;
}>;

export type PhaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1 =
  Omit<PhaseB1ProjectSyntheticNormalSinusEventScheduleV1, "contentSha256">;

export function buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticNormalSinusEventScheduleV1 {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256Hex);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256Hex);
  const payload = deepFreeze<PhaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1>({
    schemaId:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_SCHEMA_V1_ID,
    scheduleId: PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
    status: "candidate-prior-project-reduction-not-physiological-acceptance",
    rhythm: "normal-sinus-project-synthetic",
    heartRateBpm:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_HEART_RATE_BPM_V1,
    cycleLengthSec:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    activationOrder:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
    intervalOwnership: INTERVAL_OWNERSHIP,
    repeatPolicy: REPEAT_POLICY,
    sourceBindings: buildSourceBindings(bundle.contentSha256, binding),
    literatureContext: LITERATURE_CONTEXT,
    events: buildCycleEvents(binding, 0),
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  });
  const schedule = deepFreeze<PhaseB1ProjectSyntheticNormalSinusEventScheduleV1>({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  return validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    schedule,
    sha256Hex,
  );
}

export function phaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
): PhaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = schedule;
  return payload;
}

export function validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
  value: unknown,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticNormalSinusEventScheduleV1 {
  assertScheduleSchema(value);
  const schedule = value as PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  assertRecursivelyFrozen(schedule, "schedule");
  assertScheduleConstants(schedule);

  const bundle = buildPhaseA1TissueManifestBundleV1(sha256Hex);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256Hex);
  validateSourceBindings(schedule, bundle.contentSha256, binding);
  validateEvents(schedule.events, binding);
  assertCanonicalSha256(
    phaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1(schedule),
    schedule.contentSha256,
    sha256Hex,
  );
  return schedule;
}

export function generatePhaseB1ProjectSyntheticNormalSinusCycleEventsV1(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  cycleIndex: number,
  sha256Hex: CanonicalSha256HexProvider,
): readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[] {
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    schedule,
    sha256Hex,
  );
  const validatedCycleIndex = requireNonNegativeInteger(
    cycleIndex,
    "cycleIndex",
  );
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256Hex);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256Hex);
  return buildCycleEvents(binding, validatedCycleIndex);
}

/**
 * Generates the repeated normal-sinus event train owned by (startTimeSec,
 * endTimeSec]. An event exactly at start is excluded because the start state
 * is right-continuous; an event exactly at end is included.
 */
export function generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  startTimeSec: number,
  endTimeSec: number,
  sha256Hex: CanonicalSha256HexProvider,
): readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[] {
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    schedule,
    sha256Hex,
  );
  const start = requireNonNegativeFinite(startTimeSec, "startTimeSec");
  const end = requireNonNegativeFinite(endTimeSec, "endTimeSec");
  if (end < start) throw new Error("endTimeSec must be greater than or equal to startTimeSec");
  if (end === start) return Object.freeze([]);

  const maximumWithinCycleOffset = Math.max(
    ...schedule.events.map((event) => event.calciumDriveOffsetWithinCycleSec),
  );
  const firstCycleIndex = Math.max(
    0,
    Math.floor((start - maximumWithinCycleOffset) / schedule.cycleLengthSec),
  );
  const lastCycleIndex = Math.floor(end / schedule.cycleLengthSec);
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256Hex);
  const binding = buildPhaseB1WallMaterialBindingV1(bundle, sha256Hex);
  const selected: PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[] = [];
  for (let cycleIndex = firstCycleIndex; cycleIndex <= lastCycleIndex; cycleIndex += 1) {
    for (const event of buildCycleEvents(binding, cycleIndex)) {
      const time = event.calciumDriveEvent.calciumDriveTimeSec;
      if (time > start && time <= end) selected.push(event);
    }
  }
  assertStrictEventOrderAndUniqueKeys(selected, "generatedEvents");
  return deepFreeze(selected);
}

function buildSourceBindings(
  bundleSha256: string,
  binding: PhaseB1WallMaterialBindingV1,
): PhaseB1ProjectSyntheticNormalSinusEventScheduleHashPayloadV1["sourceBindings"] {
  const timingEntries = WALL_IDS.map((wallId) => {
    const runtime = binding.runtimeByWall[wallId];
    return [wallId, deepFreeze<PhaseB1ProjectSyntheticNormalSinusTimingSourceV1>({
      tissueClass: runtime.tissueClass,
      tissueManifestSha256: runtime.passiveSls.tissueManifestSha256,
      prescribedCalciumEvidenceId:
        runtime.prescribedCalciumParameters.evidenceId,
      electricalToCalciumDelaySec:
        runtime.prescribedCalciumParameters.electricalToCalciumDelaySec,
    })] as const;
  });
  const timingByWall = deepFreeze(Object.fromEntries(timingEntries)) as
    Readonly<Record<FourChamberWallId, PhaseB1ProjectSyntheticNormalSinusTimingSourceV1>>;
  return deepFreeze({
    phaseA1TissueManifestBundleSha256: bundleSha256,
    phaseB1WallMaterialBindingSha256: binding.contentSha256,
    calciumTimingOwner: TISSUE_MANIFEST_TIMING_OWNER,
    timingByWall,
  });
}

function buildCycleEvents(
  binding: PhaseB1WallMaterialBindingV1,
  cycleIndex: number,
): readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[] {
  const cycleStartTimeSec = cycleIndex
    * PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1;
  const events = PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1
    .map((wallId) => {
      const runtime = binding.runtimeByWall[wallId];
      const electricalOffsetWithinCycleSec =
        ELECTRICAL_OFFSET_SEC_BY_WALL[wallId];
      const eventId = eventIdFor(cycleIndex, wallId);
      // Convert the canonical within-cycle electrical event first. Repeated
      // absolute times then have exactly one evaluation order,
      // cycleIndex * T + offset, as declared by REPEAT_POLICY. Converting an
      // already absolute electrical time would make the recovered offset and
      // right-inclusive window ownership cycle-index dependent through
      // floating-point cancellation.
      const canonicalElectricalEvent =
        deepFreeze<Readonly<ElectricalActivationEventV1>>({
          eventId,
          electricalTimeSec: electricalOffsetWithinCycleSec,
          strength: EVENT_STRENGTH,
        });
      const convertedWithinCycle = calciumDriveEventFromElectricalV1(
        canonicalElectricalEvent,
        runtime.prescribedCalciumParameters,
      );
      const calciumDriveOffsetWithinCycleSec =
        convertedWithinCycle.calciumDriveTimeSec;
      const electricalEvent = deepFreeze<Readonly<ElectricalActivationEventV1>>({
        eventId,
        electricalTimeSec:
          cycleStartTimeSec + electricalOffsetWithinCycleSec,
        strength: EVENT_STRENGTH,
      });
      const calciumDriveEvent = deepFreeze<PhaseB1WallCalciumDriveEventV1>({
        wallId,
        eventId: convertedWithinCycle.eventId,
        calciumDriveTimeSec:
          cycleStartTimeSec + calciumDriveOffsetWithinCycleSec,
        strength: convertedWithinCycle.strength,
        timingOwner: convertedWithinCycle.timingOwner,
      });
      return deepFreeze<PhaseB1ProjectSyntheticNormalSinusScheduledEventV1>({
        eventKey: `${wallId}:${eventId}`,
        cycleIndex,
        wallId,
        tissueClass: runtime.tissueClass,
        electricalOffsetWithinCycleSec,
        calciumDriveOffsetWithinCycleSec,
        electricalEvent,
        calciumDriveEvent,
      });
    });
  assertStrictEventOrderAndUniqueKeys(events, `cycleEvents[${cycleIndex}]`);
  return deepFreeze(events);
}

function eventIdFor(cycleIndex: number, wallId: FourChamberWallId): string {
  return `${PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID}`
    + `:cycle-${cycleIndex}:${wallId}`;
}

function assertScheduleSchema(value: unknown): void {
  assertExactPlainRecordV1(value, [
    "schemaId",
    "scheduleId",
    "status",
    "rhythm",
    "heartRateBpm",
    "cycleLengthSec",
    "activationOrder",
    "intervalOwnership",
    "repeatPolicy",
    "sourceBindings",
    "literatureContext",
    "events",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "schedule");
  assertDensePlainArrayV1(value.activationOrder, 5, "schedule.activationOrder");
  assertExactPlainRecordV1(value.intervalOwnership, [
    "interval",
    "startBoundaryIncluded",
    "endBoundaryIncluded",
    "stateAtStart",
  ], "schedule.intervalOwnership");
  assertExactPlainRecordV1(value.repeatPolicy, [
    "cycleIndexOrigin",
    "repeatPeriodSec",
    "absoluteTimeRule",
    "eventKeyRule",
  ], "schedule.repeatPolicy");
  assertExactPlainRecordV1(value.sourceBindings, [
    "phaseA1TissueManifestBundleSha256",
    "phaseB1WallMaterialBindingSha256",
    "calciumTimingOwner",
    "timingByWall",
  ], "schedule.sourceBindings");
  assertExactPlainRecordV1(
    value.sourceBindings.timingByWall,
    WALL_IDS,
    "schedule.sourceBindings.timingByWall",
  );
  for (const wallId of WALL_IDS) {
    assertExactPlainRecordV1(
      value.sourceBindings.timingByWall[wallId],
      [
        "tissueClass",
        "tissueManifestSha256",
        "prescribedCalciumEvidenceId",
        "electricalToCalciumDelaySec",
      ],
      `schedule.sourceBindings.timingByWall.${wallId}`,
    );
  }
  assertExactPlainRecordV1(value.literatureContext, [
    "atrial",
    "ventricular",
    "valueDerivation",
  ], "schedule.literatureContext");
  for (const tissueClass of ["atrial", "ventricular"] as const) {
    assertExactPlainRecordV1(value.literatureContext[tissueClass], [
      "doi",
      "pmcId",
      "role",
    ], `schedule.literatureContext.${tissueClass}`);
  }
  assertDensePlainArrayV1(value.events, 5, "schedule.events");
  for (let index = 0; index < value.events.length; index += 1) {
    const event = value.events[index];
    const field = `schedule.events[${index}]`;
    assertExactPlainRecordV1(event, [
      "eventKey",
      "cycleIndex",
      "wallId",
      "tissueClass",
      "electricalOffsetWithinCycleSec",
      "calciumDriveOffsetWithinCycleSec",
      "electricalEvent",
      "calciumDriveEvent",
    ], field);
    assertExactPlainRecordV1(event.electricalEvent, [
      "eventId",
      "electricalTimeSec",
      "strength",
    ], `${field}.electricalEvent`);
    assertExactPlainRecordV1(event.calciumDriveEvent, [
      "wallId",
      "eventId",
      "calciumDriveTimeSec",
      "strength",
      "timingOwner",
    ], `${field}.calciumDriveEvent`);
  }
  assertExactPlainRecordV1(value.claimBoundary, [
    "candidatePrior",
    "projectSynthetic",
    "citedLiteratureIsContextOnly",
    "valuesDirectlyCalibratedFromCitedLiterature",
    "physiologicalAcceptanceClaimed",
    "fullBeatAcceptanceClaimed",
    "phaseB1AcceptanceClaimed",
    "modelCoreOrBrowserRuntimeAdopted",
    "releaseRuntimeReachable",
  ], "schedule.claimBoundary");
}

function assertScheduleConstants(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
): void {
  if (schedule.schemaId
    !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_SCHEMA_V1_ID) {
    throw new Error("schedule.schemaId is invalid");
  }
  if (schedule.scheduleId
    !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID) {
    throw new Error("schedule.scheduleId is invalid");
  }
  if (schedule.status
    !== "candidate-prior-project-reduction-not-physiological-acceptance") {
    throw new Error("schedule.status is invalid");
  }
  if (schedule.rhythm !== "normal-sinus-project-synthetic") {
    throw new Error("schedule.rhythm is invalid");
  }
  if (schedule.heartRateBpm
    !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_HEART_RATE_BPM_V1) {
    throw new Error("schedule.heartRateBpm must be 75");
  }
  if (schedule.cycleLengthSec
    !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1) {
    throw new Error("schedule.cycleLengthSec must be 0.8");
  }
  if (schedule.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM) {
    throw new Error("schedule.hashAlgorithm is invalid");
  }
  assertExactArray(
    schedule.activationOrder,
    PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
    "schedule.activationOrder",
  );
  assertExactObjectValues(
    schedule.intervalOwnership,
    INTERVAL_OWNERSHIP,
    "schedule.intervalOwnership",
  );
  assertExactObjectValues(
    schedule.repeatPolicy,
    REPEAT_POLICY,
    "schedule.repeatPolicy",
  );
  assertExactObjectValues(
    schedule.literatureContext.atrial,
    LITERATURE_CONTEXT.atrial,
    "schedule.literatureContext.atrial",
  );
  assertExactObjectValues(
    schedule.literatureContext.ventricular,
    LITERATURE_CONTEXT.ventricular,
    "schedule.literatureContext.ventricular",
  );
  if (schedule.literatureContext.valueDerivation
    !== LITERATURE_CONTEXT.valueDerivation) {
    throw new Error("schedule.literatureContext.valueDerivation is invalid");
  }
  assertExactObjectValues(
    schedule.claimBoundary,
    CLAIM_BOUNDARY,
    "schedule.claimBoundary",
  );
}

function validateSourceBindings(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  bundleSha256: string,
  binding: PhaseB1WallMaterialBindingV1,
): void {
  const source = schedule.sourceBindings;
  if (source.phaseA1TissueManifestBundleSha256 !== bundleSha256) {
    throw new Error("schedule source has the wrong Phase A1 tissue bundle hash");
  }
  if (source.phaseB1WallMaterialBindingSha256 !== binding.contentSha256) {
    throw new Error("schedule source has the wrong Phase B1 wall binding hash");
  }
  if (source.calciumTimingOwner !== TISSUE_MANIFEST_TIMING_OWNER) {
    throw new Error("schedule source has a duplicate or invalid calcium timing owner");
  }
  for (const wallId of WALL_IDS) {
    const actual = source.timingByWall[wallId];
    const runtime = binding.runtimeByWall[wallId];
    if (actual.tissueClass !== runtime.tissueClass
      || actual.tissueManifestSha256 !== runtime.passiveSls.tissueManifestSha256
      || actual.prescribedCalciumEvidenceId
        !== runtime.prescribedCalciumParameters.evidenceId
      || actual.electricalToCalciumDelaySec
        !== runtime.prescribedCalciumParameters.electricalToCalciumDelaySec) {
      throw new Error(`schedule source timing for ${wallId} is not manifest-owned`);
    }
    if (actual.electricalToCalciumDelaySec !== 0.012) {
      throw new Error(`schedule source timing for ${wallId} must retain the 0.012 s candidate prior`);
    }
  }
}

function validateEvents(
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  binding: PhaseB1WallMaterialBindingV1,
): void {
  assertStrictEventOrderAndUniqueKeys(events, "schedule.events");
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const wallId = PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1[index];
    const runtime = binding.runtimeByWall[wallId];
    const expectedEventId = eventIdFor(0, wallId);
    const expectedElectricalEvent = deepFreeze<Readonly<ElectricalActivationEventV1>>({
      eventId: expectedEventId,
      electricalTimeSec: ELECTRICAL_OFFSET_SEC_BY_WALL[wallId],
      strength: EVENT_STRENGTH,
    });
    const expectedCalciumEvent = calciumDriveEventFromElectricalV1(
      expectedElectricalEvent,
      runtime.prescribedCalciumParameters,
    );
    if (event.cycleIndex !== 0
      || event.wallId !== wallId
      || event.tissueClass !== runtime.tissueClass
      || event.electricalOffsetWithinCycleSec
        !== ELECTRICAL_OFFSET_SEC_BY_WALL[wallId]
      || event.calciumDriveOffsetWithinCycleSec
        !== expectedCalciumEvent.calciumDriveTimeSec
      || event.eventKey !== `${wallId}:${expectedEventId}`) {
      throw new Error(`schedule.events[${index}] is not the canonical ${wallId} event`);
    }
    assertExactObjectValues(
      event.electricalEvent,
      expectedElectricalEvent,
      `schedule.events[${index}].electricalEvent`,
    );
    assertExactObjectValues(
      event.calciumDriveEvent,
      { wallId, ...expectedCalciumEvent },
      `schedule.events[${index}].calciumDriveEvent`,
    );
  }
}

function assertStrictEventOrderAndUniqueKeys(
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  field: string,
): void {
  const eventKeys = new Set<string>();
  const eventIds = new Set<string>();
  let previousTime = -Infinity;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const time = requireNonNegativeFinite(
      event.calciumDriveEvent.calciumDriveTimeSec,
      `${field}[${index}].calciumDriveEvent.calciumDriveTimeSec`,
    );
    if (time <= previousTime) throw new Error(`${field} must be in strict calcium-drive time order`);
    if (eventKeys.has(event.eventKey)) throw new Error(`${field} contains duplicate eventKey ${event.eventKey}`);
    if (eventIds.has(event.calciumDriveEvent.eventId)) {
      throw new Error(`${field} contains duplicate eventId ${event.calciumDriveEvent.eventId}`);
    }
    if (event.calciumDriveEvent.eventId !== event.electricalEvent.eventId) {
      throw new Error(`${field}[${index}] must preserve eventId through calcium conversion`);
    }
    if (event.calciumDriveEvent.timingOwner !== TISSUE_MANIFEST_TIMING_OWNER) {
      throw new Error(`${field}[${index}] has an invalid calcium timing owner`);
    }
    eventKeys.add(event.eventKey);
    eventIds.add(event.calciumDriveEvent.eventId);
    previousTime = time;
  }
}

function assertExactArray(
  actual: readonly unknown[],
  expected: readonly unknown[],
  field: string,
): void {
  if (actual.length !== expected.length) throw new Error(`${field} has the wrong length`);
  for (let index = 0; index < expected.length; index += 1) {
    if (!Object.is(actual[index], expected[index])) {
      throw new Error(`${field}[${index}] is invalid`);
    }
  }
}

function assertExactObjectValues(
  actual: Readonly<Record<string, unknown>>,
  expected: Readonly<Record<string, unknown>>,
  field: string,
): void {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (!Object.is(actual[key], expectedValue)) {
      throw new Error(`${field}.${key} is invalid`);
    }
  }
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be finite and nonnegative`);
  }
  return value;
}

function requireNonNegativeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function assertRecursivelyFrozen(
  value: unknown,
  field: string,
  seen = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new Error(`${field} must not contain cycles`);
  if (!Object.isFrozen(value)) throw new Error(`${field} must be recursively frozen`);
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (key === "length" && Array.isArray(value)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) {
      assertRecursivelyFrozen(descriptor.value, `${field}.${String(key)}`, seen);
    }
  }
  seen.delete(value);
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) throw new Error("Cannot recursively freeze a cyclic value");
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (key === "length" && Array.isArray(value)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  seen.delete(value);
  return Object.freeze(value);
}

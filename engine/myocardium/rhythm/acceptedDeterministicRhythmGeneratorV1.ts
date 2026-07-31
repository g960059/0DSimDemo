import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import type {
  AcceptedRhythmActivationEventV1,
  RhythmBeatMorphologyV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";
import {
  commitRecoveryConcealmentAvGateCandidateDecisionV1,
  evaluateRecoveryConcealmentAvGateCandidateDecisionV1,
  initializeRecoveryConcealmentAvGateStateV1,
  validateRecoveryConcealmentAvGateParametersV1,
  validateRecoveryConcealmentAvGateStateV1,
  type RecoveryConcealmentAvGateAcceptedStateV1,
  type RecoveryConcealmentAvGateCandidateDecisionV1,
  type RecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID =
  "accepted-deterministic-rhythm-generator-v1" as const;

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CONFIG_V1_ID =
  "accepted-deterministic-rhythm-generator-config-v1" as const;

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID =
  "accepted-deterministic-rhythm-generator-state-v1" as const;

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_TRIAL_V1_ID =
  "accepted-deterministic-rhythm-generator-trial-v1" as const;

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CHECKPOINT_V1_ID =
  "circleheart.accepted-deterministic-rhythm-generator-checkpoint.v1" as const;

/** Hard failure bounds, not truncation policies. */
export const MAX_DETERMINISTIC_SOURCE_IMPULSES_PER_TRIAL_V1 = 100_000 as const;
export const MAX_DETERMINISTIC_PENDING_ACTIVATIONS_V1 = 200_000 as const;

export const ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1 = deepFreeze({
  scope: "regular-deterministic-sinus-or-atrial-flutter-source" as const,
  acceptedClock: "absolute-accepted-time" as const,
  trialInterval: "open-start-closed-end" as const,
  sourceTiming: "anchor-plus-integer-index-times-period" as const,
  sourceAnchorAndHistoryEventTimes: "signed-finite" as const,
  acceptedOwnerClock: "nonnegative-finite" as const,
  sourceTimingIndependentOf: Object.freeze([
    "solver-dt",
    "accepted-chunk-size",
    "trial-retry-count",
  ] as const),
  everySourceImpulseUses:
    "recovery-concealment-av-gate-v1" as const,
  sinusAtrialCalcium: "coherent-biatrial-effective-activation" as const,
  flutterAtrialCalcium: "not-emitted" as const,
  ventricularCalcium:
    "conducted-av-output-plus-electrical-to-calcium-delay" as const,
  outputActivationTimeMeaning:
    "effective-calcium-onset-not-electrical-activation" as const,
  pendingQueue:
    "canonical-effective-activations-strictly-after-accepted-time" as const,
  simultaneousEventBatchCompleteness: true as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
  checkpointIntegrity: "sha-256-over-complete-config-and-state" as const,
  revisionMeaning: "accepted-generator-interval-count" as const,
  finiteHistoryInitialization:
    "replay-index-zero-through-accepted-start-and-retain-only-future-effective-events" as const,
  finiteHistorySteadyStateClaimed: false as const,
  atrialFlutterSteadyAvHistoryClaimed: false as const,
  hardFailureEventBounds: Object.freeze({
    sourceImpulsesPerTrial:
      MAX_DETERMINISTIC_SOURCE_IMPULSES_PER_TRIAL_V1,
    pendingEffectiveActivations:
      MAX_DETERMINISTIC_PENDING_ACTIVATIONS_V1,
  }),
  atrialFibrillationClaimed: false as const,
  ecgClaimed: false as const,
  clinicalValidityClaimed: false as const,
  patientCalibrationClaimed: false as const,
  iabpTriggerSynchronizationClaimed: false as const,
  iabpTriggerRequirement:
    "separate-accepted-actuator-queue-from-av-decision-ventricular-electrical-time" as const,
});

export type DeterministicRhythmSourceModeV1 =
  | "regular-sinus"
  | "regular-atrial-flutter";

export type AcceptedDeterministicRhythmGeneratorConfigInputV1 = Readonly<{
  generatorConfigId: string;
  generatorInstanceId: string;
  sourceId: string;
  sourceMode: DeterministicRhythmSourceModeV1;
  /** Signed absolute time of source index zero. */
  sourceAnchorTimeSec: number;
  sourcePeriodSec: number;
  atrialElectricalToCalciumDelaySec: number;
  ventricularElectricalToCalciumDelaySec: number;
  atrialActivationStrength01: number;
  ventricularActivationStrength01: number;
  avGateParameters: RecoveryConcealmentAvGateParametersV1;
}>;

export type AcceptedDeterministicRhythmGeneratorConfigV1 = Readonly<{
  configSchemaId:
    typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CONFIG_V1_ID;
  schemaVersion: 1;
  generatorConfigId: string;
  generatorInstanceId: string;
  sourceId: string;
  sourceMode: DeterministicRhythmSourceModeV1;
  sourceAnchorTimeSec: number;
  sourcePeriodSec: number;
  atrialElectricalToCalciumDelaySec: number;
  ventricularElectricalToCalciumDelaySec: number;
  atrialActivationStrength01: number;
  ventricularActivationStrength01: number;
  avGateParameters: RecoveryConcealmentAvGateParametersV1;
}>;

export type AcceptedDeterministicRhythmGeneratorInitialStateInputV1 =
  Readonly<{
    acceptedTimeSec: number;
    revision: 0;
    nextSourceIndex: 0;
    /** Must equal config.sourceAnchorTimeSec and exceed acceptedTimeSec. */
    nextSourceActivationTimeSec: number;
  }>;

export type AcceptedDeterministicRhythmGeneratorFiniteHistoryInputV1 =
  Readonly<{
    acceptedTimeSec: number;
    revision: 0;
  }>;

export type AcceptedDeterministicRhythmGeneratorStateV1 = Readonly<{
  stateSchemaId:
    typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedDeterministicRhythmGeneratorConfigV1;
  revision: number;
  acceptedTimeSec: number;
  nextSourceIndex: number;
  nextSourceActivationTimeSec: number;
  avGateState: RecoveryConcealmentAvGateAcceptedStateV1;
  pendingActivationEvents: readonly AcceptedRhythmActivationEventV1[];
}>;

export type AcceptedDeterministicRhythmSourceImpulseV1 = Readonly<{
  sourceIndex: number;
  sourceSequence: number;
  sourceImpulseId: string;
  sourceActivationTimeSec: number;
  morphology: "sinus" | "atrial-flutter";
  avGateDecision: RecoveryConcealmentAvGateCandidateDecisionV1;
}>;

export type AcceptedDeterministicRhythmGeneratorTrialV1 = Readonly<{
  trialSchemaId:
    typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_TRIAL_V1_ID;
  schemaVersion: 1;
  generatorConfigId: string;
  generatorInstanceId: string;
  baseRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  processedSourceImpulseCount: number;
  sourceImpulses: readonly AcceptedDeterministicRhythmSourceImpulseV1[];
  activationEvents: readonly AcceptedRhythmActivationEventV1[];
  simultaneousBatchCount: number;
  candidateState: AcceptedDeterministicRhythmGeneratorStateV1;
}>;

export type AcceptedDeterministicRhythmGeneratorMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedByEffectiveActivation: boolean;
  boundaryEventId: string | null;
  boundaryActivationTimeSec: number | null;
  boundaryBatchSize: number;
}>;

export type AcceptedDeterministicRhythmGeneratorCheckpointPayloadV1 =
  Readonly<{
    checkpointId:
      typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CHECKPOINT_V1_ID;
    schemaVersion: 1;
    generatorId: typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID;
    stateSchemaId:
      typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID;
    configuration: AcceptedDeterministicRhythmGeneratorConfigV1;
    revision: number;
    acceptedTimeSec: number;
    nextSourceIndex: number;
    nextSourceActivationTimeSec: number;
    avGateState: RecoveryConcealmentAvGateAcceptedStateV1;
    pendingActivationEvents: readonly AcceptedRhythmActivationEventV1[];
    exactResumeClaim:
      typeof ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1;
  }>;

export type AcceptedDeterministicRhythmGeneratorCheckpointV1 =
  AcceptedDeterministicRhythmGeneratorCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

const CONFIG_INPUT_KEYS = Object.freeze([
  "generatorConfigId",
  "generatorInstanceId",
  "sourceId",
  "sourceMode",
  "sourceAnchorTimeSec",
  "sourcePeriodSec",
  "atrialElectricalToCalciumDelaySec",
  "ventricularElectricalToCalciumDelaySec",
  "atrialActivationStrength01",
  "ventricularActivationStrength01",
  "avGateParameters",
] as const);

const CONFIG_KEYS = Object.freeze([
  "configSchemaId",
  "schemaVersion",
  ...CONFIG_INPUT_KEYS,
] as const);

const INITIAL_STATE_KEYS = Object.freeze([
  "acceptedTimeSec",
  "revision",
  "nextSourceIndex",
  "nextSourceActivationTimeSec",
] as const);

const FINITE_HISTORY_KEYS = Object.freeze([
  "acceptedTimeSec",
  "revision",
] as const);

const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "revision",
  "acceptedTimeSec",
  "nextSourceIndex",
  "nextSourceActivationTimeSec",
  "avGateState",
  "pendingActivationEvents",
] as const);

const TRIAL_KEYS = Object.freeze([
  "trialSchemaId",
  "schemaVersion",
  "generatorConfigId",
  "generatorInstanceId",
  "baseRevision",
  "startTimeSec",
  "candidateTimeSec",
  "processedSourceImpulseCount",
  "sourceImpulses",
  "activationEvents",
  "simultaneousBatchCount",
  "candidateState",
] as const);

const EVENT_KEYS = Object.freeze([
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
] as const);

const CHECKPOINT_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "generatorId",
  "stateSchemaId",
  "configuration",
  "revision",
  "acceptedTimeSec",
  "nextSourceIndex",
  "nextSourceActivationTimeSec",
  "avGateState",
  "pendingActivationEvents",
  "exactResumeClaim",
  "checkpointSha256",
] as const);

const ATRIAL_TARGET_IDS = Object.freeze(["LA", "RA"] as const);
const VENTRICULAR_TARGET_IDS = Object.freeze([
  "LVFW",
  "RVFW",
  "SEP",
] as const);
const ATRIAL_PRIORITY = 10;
const VENTRICULAR_PRIORITY = 20;
const MAX_SOURCE_INDEX = Math.floor((Number.MAX_SAFE_INTEGER - 1) / 2);

export function createAcceptedDeterministicRhythmGeneratorConfigV1(
  input: AcceptedDeterministicRhythmGeneratorConfigInputV1,
): AcceptedDeterministicRhythmGeneratorConfigV1 {
  const record = requirePlainRecord(input, "generator config input");
  requireExactKeys(record, CONFIG_INPUT_KEYS, "generator config input");
  validateRecoveryConcealmentAvGateParametersV1(input.avGateParameters);
  return deepFreeze({
    configSchemaId: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CONFIG_V1_ID,
    schemaVersion: 1 as const,
    generatorConfigId: requireNonemptyString(
      input.generatorConfigId,
      "generator config input.generatorConfigId",
    ),
    generatorInstanceId: requireNonemptyString(
      input.generatorInstanceId,
      "generator config input.generatorInstanceId",
    ),
    sourceId: requireNonemptyString(
      input.sourceId,
      "generator config input.sourceId",
    ),
    sourceMode: requireSourceMode(input.sourceMode),
    sourceAnchorTimeSec: requireFinite(
      input.sourceAnchorTimeSec,
      "generator config input.sourceAnchorTimeSec",
    ),
    sourcePeriodSec: requirePositiveFinite(
      input.sourcePeriodSec,
      "generator config input.sourcePeriodSec",
    ),
    atrialElectricalToCalciumDelaySec: requireNonnegativeFinite(
      input.atrialElectricalToCalciumDelaySec,
      "generator config input.atrialElectricalToCalciumDelaySec",
    ),
    ventricularElectricalToCalciumDelaySec: requireNonnegativeFinite(
      input.ventricularElectricalToCalciumDelaySec,
      "generator config input.ventricularElectricalToCalciumDelaySec",
    ),
    atrialActivationStrength01: requireUnitInterval(
      input.atrialActivationStrength01,
      "generator config input.atrialActivationStrength01",
    ),
    ventricularActivationStrength01: requireUnitInterval(
      input.ventricularActivationStrength01,
      "generator config input.ventricularActivationStrength01",
    ),
    avGateParameters: copyAvGateParameters(input.avGateParameters),
  });
}

export function validateAcceptedDeterministicRhythmGeneratorConfigV1(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
): void {
  const record = requirePlainRecord(config, "generator config");
  requireExactKeys(record, CONFIG_KEYS, "generator config");
  if (
    config.configSchemaId
      !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CONFIG_V1_ID
    || config.schemaVersion !== 1
  ) throw new Error("unsupported deterministic rhythm generator config schema");
  requireNonemptyString(config.generatorConfigId, "config.generatorConfigId");
  requireNonemptyString(config.generatorInstanceId, "config.generatorInstanceId");
  requireNonemptyString(config.sourceId, "config.sourceId");
  requireSourceMode(config.sourceMode);
  requireFinite(config.sourceAnchorTimeSec, "config.sourceAnchorTimeSec");
  requirePositiveFinite(config.sourcePeriodSec, "config.sourcePeriodSec");
  requireNonnegativeFinite(
    config.atrialElectricalToCalciumDelaySec,
    "config.atrialElectricalToCalciumDelaySec",
  );
  requireNonnegativeFinite(
    config.ventricularElectricalToCalciumDelaySec,
    "config.ventricularElectricalToCalciumDelaySec",
  );
  requireUnitInterval(
    config.atrialActivationStrength01,
    "config.atrialActivationStrength01",
  );
  requireUnitInterval(
    config.ventricularActivationStrength01,
    "config.ventricularActivationStrength01",
  );
  validateRecoveryConcealmentAvGateParametersV1(config.avGateParameters);
}

/**
 * Fresh initialization deliberately has no hidden source or AV history. The
 * first future source is index zero, and must lie strictly after the accepted
 * start. Historical calcium needed at t0 is seeded by the enclosing owner.
 */
export function initializeAcceptedDeterministicRhythmGeneratorStateV1(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  input: AcceptedDeterministicRhythmGeneratorInitialStateInputV1,
): AcceptedDeterministicRhythmGeneratorStateV1 {
  const ownedConfig = copyConfiguration(config);
  const record = requirePlainRecord(input, "generator initial state input");
  requireExactKeys(record, INITIAL_STATE_KEYS, "generator initial state input");
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "generator initial state input.acceptedTimeSec",
  );
  if (input.revision !== 0 || input.nextSourceIndex !== 0) {
    throw new Error("fresh generator initialization requires revision and next source index zero");
  }
  const nextSourceActivationTimeSec = requireNonnegativeFinite(
    input.nextSourceActivationTimeSec,
    "generator initial state input.nextSourceActivationTimeSec",
  );
  if (nextSourceActivationTimeSec !== ownedConfig.sourceAnchorTimeSec) {
    throw new Error("initial next source time must equal config source anchor time");
  }
  if (!(nextSourceActivationTimeSec > acceptedTimeSec)) {
    throw new Error("initial next source time must exceed accepted start time");
  }
  return freezeState({
    configuration: ownedConfig,
    revision: 0,
    acceptedTimeSec,
    nextSourceIndex: 0,
    nextSourceActivationTimeSec,
    avGateState: initializeRecoveryConcealmentAvGateStateV1(
      ownedConfig.avGateParameters,
      {
        gateInstanceId: `${ownedConfig.generatorInstanceId}:av-gate`,
        acceptedTimeSec,
      },
    ),
    pendingActivationEvents: Object.freeze([]),
  });
}

/**
 * Builds a finite, explicit pre-start history. Source/AV decisions from index
 * zero through acceptedTimeSec are replayed in canonical order. Effective
 * activations at or before the accepted start are historical and discarded;
 * delayed activations after the start become the normal pending queue.
 *
 * This is a finite-history construction, not a general steady-state claim.
 */
export function initializeAcceptedDeterministicRhythmGeneratorFiniteHistoryStateV1(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  input: AcceptedDeterministicRhythmGeneratorFiniteHistoryInputV1,
): AcceptedDeterministicRhythmGeneratorStateV1 {
  const ownedConfig = copyConfiguration(config);
  const record = requirePlainRecord(input, "generator finite history input");
  requireExactKeys(record, FINITE_HISTORY_KEYS, "generator finite history input");
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "generator finite history input.acceptedTimeSec",
  );
  if (input.revision !== 0) {
    throw new Error("finite history initialization requires revision zero");
  }
  if (ownedConfig.sourceAnchorTimeSec > acceptedTimeSec) {
    throw new Error("finite history source anchor must be at or before accepted start");
  }

  let avGateState = initializeRecoveryConcealmentAvGateStateV1(
    ownedConfig.avGateParameters,
    {
      gateInstanceId: `${ownedConfig.generatorInstanceId}:av-gate`,
      acceptedTimeSec: ownedConfig.sourceAnchorTimeSec,
    },
  );
  let sourceIndex = 0;
  let sourceTimeSec = ownedConfig.sourceAnchorTimeSec;
  const pending: AcceptedRhythmActivationEventV1[] = [];
  while (sourceTimeSec <= acceptedTimeSec) {
    if (sourceIndex >= MAX_DETERMINISTIC_SOURCE_IMPULSES_PER_TRIAL_V1) {
      throw new Error("deterministic rhythm finite history exceeds source impulse safety cap");
    }
    if (sourceIndex > MAX_SOURCE_INDEX) {
      throw new Error("deterministic rhythm source index exceeds safe event identity range");
    }
    const avDecision = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      avGateState,
      {
        activationId: sourceImpulseIdFor(ownedConfig, sourceIndex),
        atrialActivationTimeSec: sourceTimeSec,
      },
    );
    avGateState = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      avGateState,
      avDecision,
    );
    if (ownedConfig.sourceMode === "regular-sinus") {
      const atrialEvent = buildEffectiveActivationEvent({
        config: ownedConfig,
        sourceIndex,
        eventClass: "atria",
        activationTimeSec: finiteSum(
          sourceTimeSec,
          ownedConfig.atrialElectricalToCalciumDelaySec,
          "historical atrial effective activation time",
        ),
      });
      if (atrialEvent.activationTimeSec > acceptedTimeSec) {
        pending.push(atrialEvent);
      }
    }
    if (avDecision.conducted) {
      const ventricularEvent = buildEffectiveActivationEvent({
        config: ownedConfig,
        sourceIndex,
        eventClass: "ventricles",
        activationTimeSec: finiteSum(
          avDecision.ventricularActivationTimeSec!,
          ownedConfig.ventricularElectricalToCalciumDelaySec,
          "historical ventricular effective activation time",
        ),
      });
      if (ventricularEvent.activationTimeSec > acceptedTimeSec) {
        pending.push(ventricularEvent);
      }
    }
    if (pending.length > MAX_DETERMINISTIC_PENDING_ACTIVATIONS_V1) {
      throw new Error("deterministic rhythm finite-history pending queue exceeds safety cap");
    }
    sourceIndex += 1;
    sourceTimeSec = sourceTimeForIndex(ownedConfig, sourceIndex);
  }
  pending.sort(compareActivationOrderKey);
  assertStrictCanonicalEventOrder(pending, "finite-history pending activation queue");
  const state = freezeState({
    configuration: ownedConfig,
    revision: 0,
    acceptedTimeSec,
    nextSourceIndex: sourceIndex,
    nextSourceActivationTimeSec: sourceTimeSec,
    avGateState,
    pendingActivationEvents: Object.freeze(pending),
  });
  validateAcceptedDeterministicRhythmGeneratorStateV1(state);
  return state;
}

/** Pure evaluation over (acceptedTimeSec, candidateTimeSec]. */
export function evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
  previous: AcceptedDeterministicRhythmGeneratorStateV1,
  candidateTimeSec: number,
): AcceptedDeterministicRhythmGeneratorTrialV1 {
  validateAcceptedDeterministicRhythmGeneratorStateV1(previous);
  const candidateTime = requireNonnegativeFinite(
    candidateTimeSec,
    "candidateTimeSec",
  );
  if (!(candidateTime > previous.acceptedTimeSec)) {
    throw new Error("candidateTimeSec must exceed acceptedTimeSec");
  }
  if (previous.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("generator revision cannot be incremented safely");
  }

  const config = previous.configuration;
  const pending = [...previous.pendingActivationEvents];
  const sourceImpulses: AcceptedDeterministicRhythmSourceImpulseV1[] = [];
  let avGateState = previous.avGateState;
  let sourceIndex = previous.nextSourceIndex;
  let sourceTimeSec = previous.nextSourceActivationTimeSec;

  while (sourceTimeSec <= candidateTime) {
    if (
      sourceImpulses.length
        >= MAX_DETERMINISTIC_SOURCE_IMPULSES_PER_TRIAL_V1
    ) {
      throw new Error("deterministic rhythm trial exceeds source impulse safety cap");
    }
    if (sourceIndex > MAX_SOURCE_INDEX) {
      throw new Error("deterministic rhythm source index exceeds safe event identity range");
    }
    const sourceImpulseId = sourceImpulseIdFor(config, sourceIndex);
    const avDecision = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      avGateState,
      {
        activationId: sourceImpulseId,
        atrialActivationTimeSec: sourceTimeSec,
      },
    );
    avGateState = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      avGateState,
      avDecision,
    );
    const morphology = morphologyFor(config.sourceMode);
    sourceImpulses.push(Object.freeze({
      sourceIndex,
      sourceSequence: sourceIndex,
      sourceImpulseId,
      sourceActivationTimeSec: sourceTimeSec,
      morphology,
      avGateDecision: avDecision,
    }));

    if (config.sourceMode === "regular-sinus") {
      pending.push(buildEffectiveActivationEvent({
        config,
        sourceIndex,
        eventClass: "atria",
        activationTimeSec: finiteSum(
          sourceTimeSec,
          config.atrialElectricalToCalciumDelaySec,
          "atrial effective activation time",
        ),
      }));
    }
    if (avDecision.conducted) {
      pending.push(buildEffectiveActivationEvent({
        config,
        sourceIndex,
        eventClass: "ventricles",
        activationTimeSec: finiteSum(
          avDecision.ventricularActivationTimeSec!,
          config.ventricularElectricalToCalciumDelaySec,
          "ventricular effective activation time",
        ),
      }));
    }
    if (pending.length > MAX_DETERMINISTIC_PENDING_ACTIVATIONS_V1) {
      throw new Error("deterministic rhythm pending queue exceeds safety cap");
    }
    sourceIndex += 1;
    sourceTimeSec = sourceTimeForIndex(config, sourceIndex);
  }

  pending.sort(compareActivationOrderKey);
  assertStrictCanonicalEventOrder(pending, "candidate activation queue");
  let drainCount = 0;
  while (
    drainCount < pending.length
    && pending[drainCount]!.activationTimeSec <= candidateTime
  ) drainCount += 1;
  const activationEvents = Object.freeze(pending.slice(0, drainCount));
  const candidatePending = Object.freeze(pending.slice(drainCount));
  const candidateState = freezeState({
    configuration: config,
    revision: previous.revision + 1,
    acceptedTimeSec: candidateTime,
    nextSourceIndex: sourceIndex,
    nextSourceActivationTimeSec: sourceTimeSec,
    avGateState,
    pendingActivationEvents: candidatePending,
  });

  return deepFreeze({
    trialSchemaId: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_TRIAL_V1_ID,
    schemaVersion: 1 as const,
    generatorConfigId: config.generatorConfigId,
    generatorInstanceId: config.generatorInstanceId,
    baseRevision: previous.revision,
    startTimeSec: previous.acceptedTimeSec,
    candidateTimeSec: candidateTime,
    processedSourceImpulseCount: sourceImpulses.length,
    sourceImpulses: Object.freeze(sourceImpulses),
    activationEvents,
    simultaneousBatchCount: countDistinctActivationTimes(activationEvents),
    candidateState,
  });
}

/**
 * Clips a proposed mechanics step to the first effective-calcium onset. The
 * requested-end trial discovers both already-pending events and events made
 * by future source/AV decisions. Its event owns the generator-computed binary
 * time; the requested step is never repeatedly accumulated to reconstruct it.
 */
export function maximumAcceptedDeterministicRhythmGeneratorStepV1(
  previous: AcceptedDeterministicRhythmGeneratorStateV1,
  requestedStepSec: number,
): AcceptedDeterministicRhythmGeneratorMaximumStepV1 {
  validateAcceptedDeterministicRhythmGeneratorStateV1(previous);
  const requestedStep = requirePositiveFinite(
    requestedStepSec,
    "requestedStepSec",
  );
  const requestedEndTimeSec = previous.acceptedTimeSec + requestedStep;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error("requested deterministic rhythm step end must remain finite");
  }
  const requestedTrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
    previous,
    requestedEndTimeSec,
  );
  const boundary = requestedTrial.activationEvents[0] ?? null;
  if (boundary === null) {
    return Object.freeze({
      requestedStepSec: requestedStep,
      requestedEndTimeSec,
      maximumStepSec: requestedStep,
      candidateTimeSec: requestedEndTimeSec,
      clippedByEffectiveActivation: false,
      boundaryEventId: null,
      boundaryActivationTimeSec: null,
      boundaryBatchSize: 0,
    });
  }
  const boundaryActivationTimeSec = boundary.activationTimeSec;
  const maximumStepSec = boundaryActivationTimeSec - previous.acceptedTimeSec;
  if (!(maximumStepSec > 0)) {
    throw new Error("effective activation boundary must follow accepted time");
  }
  let boundaryBatchSize = 0;
  while (
    boundaryBatchSize < requestedTrial.activationEvents.length
    && requestedTrial.activationEvents[boundaryBatchSize]!.activationTimeSec
      === boundaryActivationTimeSec
  ) boundaryBatchSize += 1;
  return Object.freeze({
    requestedStepSec: requestedStep,
    requestedEndTimeSec,
    maximumStepSec,
    candidateTimeSec: boundaryActivationTimeSec,
    clippedByEffectiveActivation:
      boundaryActivationTimeSec < requestedEndTimeSec,
    boundaryEventId: boundary.eventId,
    boundaryActivationTimeSec,
    boundaryBatchSize,
  });
}

/** Validates an untrusted trial by exact recomputation from its accepted base. */
export function commitAcceptedDeterministicRhythmGeneratorTrialV1(
  previous: AcceptedDeterministicRhythmGeneratorStateV1,
  trial: AcceptedDeterministicRhythmGeneratorTrialV1,
): AcceptedDeterministicRhythmGeneratorStateV1 {
  validateTrialBase(previous, trial);
  const expected = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
    previous,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error("deterministic rhythm trial does not match exact recomputation");
  }
  return expected.candidateState;
}

export function rollbackAcceptedDeterministicRhythmGeneratorTrialV1(
  previous: AcceptedDeterministicRhythmGeneratorStateV1,
  trial: AcceptedDeterministicRhythmGeneratorTrialV1,
): AcceptedDeterministicRhythmGeneratorStateV1 {
  validateTrialBase(previous, trial);
  const expected = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
    previous,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error("deterministic rhythm trial does not match exact recomputation");
  }
  return previous;
}

export function validateAcceptedDeterministicRhythmGeneratorStateV1(
  state: AcceptedDeterministicRhythmGeneratorStateV1,
): void {
  const record = requirePlainRecord(state, "generator accepted state");
  requireExactKeys(record, STATE_KEYS, "generator accepted state");
  if (
    state.stateSchemaId
      !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID
    || state.schemaVersion !== 1
  ) throw new Error("unsupported deterministic rhythm generator state schema");
  if (!Object.isFrozen(state)) throw new Error("generator accepted state must be immutable");
  validateAcceptedDeterministicRhythmGeneratorConfigV1(state.configuration);
  if (!isDeeplyFrozenConfiguration(state.configuration)) {
    throw new Error("generator configuration must be recursively immutable");
  }
  requireNonnegativeSafeInteger(state.revision, "state.revision");
  const acceptedTimeSec = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "state.acceptedTimeSec",
  );
  const nextSourceIndex = requireNonnegativeSafeInteger(
    state.nextSourceIndex,
    "state.nextSourceIndex",
  );
  if (nextSourceIndex > MAX_SOURCE_INDEX + 1) {
    throw new Error("state.nextSourceIndex exceeds safe event identity range");
  }
  const nextSourceActivationTimeSec = requireNonnegativeFinite(
    state.nextSourceActivationTimeSec,
    "state.nextSourceActivationTimeSec",
  );
  if (
    nextSourceActivationTimeSec
      !== sourceTimeForIndex(state.configuration, nextSourceIndex)
  ) throw new Error("state next source time does not match anchor/index/period");
  if (!(nextSourceActivationTimeSec > acceptedTimeSec)) {
    throw new Error("state next source time must exceed accepted time");
  }
  validateRecoveryConcealmentAvGateStateV1(state.avGateState);
  if (
    !Object.isFrozen(state.avGateState)
    || !Object.isFrozen(state.avGateState.parameters)
    || !Object.isFrozen(state.avGateState.parameters.parameterProvenance)
  ) throw new Error("state AV gate owner must be recursively immutable");
  if (
    state.avGateState.gateInstanceId
      !== `${state.configuration.generatorInstanceId}:av-gate`
    || canonicalJsonStringify(state.avGateState.parameters)
      !== canonicalJsonStringify(state.configuration.avGateParameters)
  ) throw new Error("state AV gate does not match generator configuration");
  if (state.avGateState.acceptedActivationCount !== nextSourceIndex) {
    throw new Error("state AV accepted count must equal next source index");
  }
  const expectedAvTime = nextSourceIndex === 0
    ? state.avGateState.acceptedTimeSec
    : sourceTimeForIndex(state.configuration, nextSourceIndex - 1);
  if (
    nextSourceIndex > 0
    && state.avGateState.acceptedTimeSec !== expectedAvTime
  ) throw new Error("state AV clock does not match last processed source impulse");
  if (state.avGateState.acceptedTimeSec > acceptedTimeSec) {
    throw new Error("state AV clock cannot exceed generator accepted time");
  }
  validatePendingQueue(
    state.pendingActivationEvents,
    state.configuration,
    acceptedTimeSec,
    nextSourceIndex,
  );
}

export async function checkpointAcceptedDeterministicRhythmGeneratorStateV1(
  state: AcceptedDeterministicRhythmGeneratorStateV1,
): Promise<AcceptedDeterministicRhythmGeneratorCheckpointV1> {
  validateAcceptedDeterministicRhythmGeneratorStateV1(state);
  const payload = deepFreeze({
    checkpointId:
      ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    generatorId: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID,
    stateSchemaId: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID,
    configuration: state.configuration,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    nextSourceIndex: state.nextSourceIndex,
    nextSourceActivationTimeSec: state.nextSourceActivationTimeSec,
    avGateState: state.avGateState,
    pendingActivationEvents: state.pendingActivationEvents,
    exactResumeClaim: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1,
  }) satisfies AcceptedDeterministicRhythmGeneratorCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreAcceptedDeterministicRhythmGeneratorStateV1(
  candidate: unknown,
  expectedConfig: AcceptedDeterministicRhythmGeneratorConfigV1,
): Promise<AcceptedDeterministicRhythmGeneratorStateV1> {
  validateAcceptedDeterministicRhythmGeneratorConfigV1(expectedConfig);
  const checkpoint = requirePlainRecord(candidate, "generator checkpoint");
  requireExactKeys(checkpoint, CHECKPOINT_KEYS, "generator checkpoint");
  if (
    checkpoint.checkpointId
      !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.generatorId !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID
    || checkpoint.stateSchemaId
      !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID
  ) throw new Error("unsupported deterministic rhythm generator checkpoint schema");
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) throw new Error("generator checkpoint SHA-256 is invalid");
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("generator checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1)
  ) throw new Error("generator checkpoint claim mismatch");
  const checkpointConfig = detachedFrozenCopy<
    AcceptedDeterministicRhythmGeneratorConfigV1
  >(checkpoint.configuration);
  validateAcceptedDeterministicRhythmGeneratorConfigV1(checkpointConfig);
  if (
    canonicalJsonStringify(checkpointConfig)
      !== canonicalJsonStringify(expectedConfig)
  ) throw new Error("generator checkpoint configuration mismatch");

  const restored = freezeState({
    configuration: copyConfiguration(expectedConfig),
    revision: requireNonnegativeSafeInteger(
      checkpoint.revision,
      "checkpoint.revision",
    ),
    acceptedTimeSec: requireNonnegativeFinite(
      checkpoint.acceptedTimeSec,
      "checkpoint.acceptedTimeSec",
    ),
    nextSourceIndex: requireNonnegativeSafeInteger(
      checkpoint.nextSourceIndex,
      "checkpoint.nextSourceIndex",
    ),
    nextSourceActivationTimeSec: requireNonnegativeFinite(
      checkpoint.nextSourceActivationTimeSec,
      "checkpoint.nextSourceActivationTimeSec",
    ),
    avGateState: detachedFrozenCopy<
      RecoveryConcealmentAvGateAcceptedStateV1
    >(checkpoint.avGateState),
    pendingActivationEvents: detachedFrozenCopy<
      readonly AcceptedRhythmActivationEventV1[]
    >(checkpoint.pendingActivationEvents),
  });
  validateAcceptedDeterministicRhythmGeneratorStateV1(restored);
  return restored;
}

function freezeState(input: Readonly<{
  configuration: AcceptedDeterministicRhythmGeneratorConfigV1;
  revision: number;
  acceptedTimeSec: number;
  nextSourceIndex: number;
  nextSourceActivationTimeSec: number;
  avGateState: RecoveryConcealmentAvGateAcceptedStateV1;
  pendingActivationEvents: readonly AcceptedRhythmActivationEventV1[];
}>): AcceptedDeterministicRhythmGeneratorStateV1 {
  return Object.freeze({
    stateSchemaId: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: input.configuration,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    nextSourceIndex: input.nextSourceIndex,
    nextSourceActivationTimeSec: input.nextSourceActivationTimeSec,
    avGateState: input.avGateState,
    pendingActivationEvents: Object.freeze([...input.pendingActivationEvents]),
  });
}

function buildEffectiveActivationEvent(input: Readonly<{
  config: AcceptedDeterministicRhythmGeneratorConfigV1;
  sourceIndex: number;
  eventClass: "atria" | "ventricles";
  activationTimeSec: number;
}>): AcceptedRhythmActivationEventV1 {
  const isAtrial = input.eventClass === "atria";
  const sourceSequence = input.sourceIndex * 2 + (isAtrial ? 0 : 1);
  const activationStrength01 = isAtrial
    ? input.config.atrialActivationStrength01
    : input.config.ventricularActivationStrength01;
  const calciumEvent = Object.freeze({
    timeSec: input.activationTimeSec,
    strength: activationStrength01,
  });
  return Object.freeze({
    eventId: effectiveEventIdFor(
      input.config,
      input.sourceIndex,
      input.eventClass,
    ),
    sourceId: input.config.sourceId,
    sourceSequence,
    priority: isAtrial ? ATRIAL_PRIORITY : VENTRICULAR_PRIORITY,
    beatId: beatIdFor(input.config, input.sourceIndex),
    beatOrdinal: input.sourceIndex + 1,
    morphology: morphologyFor(input.config.sourceMode),
    activationTimeSec: input.activationTimeSec,
    targetIds: isAtrial ? ATRIAL_TARGET_IDS : VENTRICULAR_TARGET_IDS,
    activationStrength01,
    calciumEvent,
  });
}

function validatePendingQueue(
  events: readonly AcceptedRhythmActivationEventV1[],
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  acceptedTimeSec: number,
  nextSourceIndex: number,
): void {
  validateDenseArray(events, "state.pendingActivationEvents");
  if (!Object.isFrozen(events)) throw new Error("pending activation queue must be immutable");
  if (events.length > MAX_DETERMINISTIC_PENDING_ACTIVATIONS_V1) {
    throw new Error("pending activation queue exceeds safety cap");
  }
  const eventIds = new Set<string>();
  const sourceSequences = new Set<number>();
  events.forEach((event, position) => {
    const field = `state.pendingActivationEvents[${position}]`;
    const record = requirePlainRecord(event, field);
    requireExactKeys(record, EVENT_KEYS, field);
    if (
      !Object.isFrozen(event)
      || !Object.isFrozen(event.targetIds)
      || !Object.isFrozen(event.calciumEvent)
    ) throw new Error(`${field} must be recursively immutable`);
    const sourceSequence = requireNonnegativeSafeInteger(
      event.sourceSequence,
      `${field}.sourceSequence`,
    );
    if (eventIds.has(event.eventId) || sourceSequences.has(sourceSequence)) {
      throw new Error(`${field} duplicates a deterministic pending activation`);
    }
    eventIds.add(event.eventId);
    sourceSequences.add(sourceSequence);
    const sourceIndex = Math.floor(sourceSequence / 2);
    const isAtrial = sourceSequence % 2 === 0;
    if (sourceIndex >= nextSourceIndex) {
      throw new Error(`${field} refers to an unprocessed source impulse`);
    }
    if (config.sourceMode === "regular-atrial-flutter" && isAtrial) {
      throw new Error("regular atrial flutter must not queue coherent atrial calcium");
    }
    const eventClass = isAtrial ? "atria" as const : "ventricles" as const;
    const sourceTime = sourceTimeForIndex(config, sourceIndex);
    const expectedStrength = isAtrial
      ? config.atrialActivationStrength01
      : config.ventricularActivationStrength01;
    const expectedTargets = isAtrial ? ATRIAL_TARGET_IDS : VENTRICULAR_TARGET_IDS;
    if (
      event.eventId !== effectiveEventIdFor(config, sourceIndex, eventClass)
      || event.sourceId !== config.sourceId
      || event.priority !== (isAtrial ? ATRIAL_PRIORITY : VENTRICULAR_PRIORITY)
      || event.beatId !== beatIdFor(config, sourceIndex)
      || event.beatOrdinal !== sourceIndex + 1
      || event.morphology !== morphologyFor(config.sourceMode)
      || event.activationStrength01 !== expectedStrength
      || !arraysExactlyEqual(event.targetIds, expectedTargets)
      || event.calciumEvent.timeSec !== event.activationTimeSec
      || event.calciumEvent.strength !== event.activationStrength01
    ) throw new Error(`${field} does not match deterministic event identity`);
    requireNonnegativeFinite(event.activationTimeSec, `${field}.activationTimeSec`);
    if (!(event.activationTimeSec > acceptedTimeSec)) {
      throw new Error(`${field} is stale at the accepted clock`);
    }
    if (
      isAtrial
      && event.activationTimeSec !== sourceTime
        + config.atrialElectricalToCalciumDelaySec
    ) throw new Error(`${field} atrial delay does not match configuration`);
    if (!isAtrial && !(event.activationTimeSec > sourceTime)) {
      throw new Error(`${field} ventricular activation must follow its source impulse`);
    }
  });
  assertStrictCanonicalEventOrder(events, "pending activation queue");
}

function validateTrialBase(
  previous: AcceptedDeterministicRhythmGeneratorStateV1,
  trial: AcceptedDeterministicRhythmGeneratorTrialV1,
): void {
  validateAcceptedDeterministicRhythmGeneratorStateV1(previous);
  const record = requirePlainRecord(trial, "generator trial");
  requireExactKeys(record, TRIAL_KEYS, "generator trial");
  if (
    trial.trialSchemaId
      !== ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_TRIAL_V1_ID
    || trial.schemaVersion !== 1
    || trial.generatorConfigId
      !== previous.configuration.generatorConfigId
    || trial.generatorInstanceId
      !== previous.configuration.generatorInstanceId
    || trial.baseRevision !== previous.revision
    || trial.startTimeSec !== previous.acceptedTimeSec
    || !(trial.candidateTimeSec > previous.acceptedTimeSec)
  ) throw new Error("stale or foreign deterministic rhythm generator trial");
  requireNonnegativeSafeInteger(
    trial.processedSourceImpulseCount,
    "trial.processedSourceImpulseCount",
  );
  requireNonnegativeSafeInteger(
    trial.simultaneousBatchCount,
    "trial.simultaneousBatchCount",
  );
  validateDenseArray(trial.sourceImpulses, "trial.sourceImpulses");
  validateDenseArray(trial.activationEvents, "trial.activationEvents");
}

function sourceTimeForIndex(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  sourceIndex: number,
): number {
  const time = config.sourceAnchorTimeSec + sourceIndex * config.sourcePeriodSec;
  if (!Number.isFinite(time)) {
    throw new Error("computed deterministic source time is outside finite seconds domain");
  }
  return time;
}

function morphologyFor(
  sourceMode: DeterministicRhythmSourceModeV1,
): Extract<RhythmBeatMorphologyV1, "sinus" | "atrial-flutter"> {
  return sourceMode === "regular-sinus" ? "sinus" : "atrial-flutter";
}

function sourceImpulseIdFor(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  sourceIndex: number,
): string {
  return `${config.generatorInstanceId}:source:${sourceIndex}:atrial-electrical`;
}

function beatIdFor(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  sourceIndex: number,
): string {
  return `${config.generatorInstanceId}:beat:${sourceIndex}`;
}

function effectiveEventIdFor(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
  sourceIndex: number,
  eventClass: "atria" | "ventricles",
): string {
  return `${config.generatorInstanceId}:source:${sourceIndex}:${eventClass}-calcium`;
}

function countDistinctActivationTimes(
  events: readonly AcceptedRhythmActivationEventV1[],
): number {
  let count = 0;
  let previous: number | null = null;
  for (const event of events) {
    if (previous === null || event.activationTimeSec !== previous) {
      count += 1;
      previous = event.activationTimeSec;
    }
  }
  return count;
}

function assertStrictCanonicalEventOrder(
  events: readonly AcceptedRhythmActivationEventV1[],
  field: string,
): void {
  for (let index = 1; index < events.length; index += 1) {
    if (compareActivationOrderKey(events[index - 1]!, events[index]!) >= 0) {
      throw new Error(`${field} is not in strict canonical order`);
    }
  }
}

function compareActivationOrderKey(
  left: AcceptedRhythmActivationEventV1,
  right: AcceptedRhythmActivationEventV1,
): number {
  if (left.activationTimeSec !== right.activationTimeSec) {
    return left.activationTimeSec < right.activationTimeSec ? -1 : 1;
  }
  if (left.priority !== right.priority) return left.priority - right.priority;
  if (left.sourceId !== right.sourceId) return left.sourceId < right.sourceId ? -1 : 1;
  return left.sourceSequence - right.sourceSequence;
}

function copyConfiguration(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
): AcceptedDeterministicRhythmGeneratorConfigV1 {
  validateAcceptedDeterministicRhythmGeneratorConfigV1(config);
  return detachedFrozenCopy<AcceptedDeterministicRhythmGeneratorConfigV1>(config);
}

function copyAvGateParameters(
  parameters: RecoveryConcealmentAvGateParametersV1,
): RecoveryConcealmentAvGateParametersV1 {
  return detachedFrozenCopy<RecoveryConcealmentAvGateParametersV1>(parameters);
}

function isDeeplyFrozenConfiguration(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
): boolean {
  return Object.isFrozen(config)
    && Object.isFrozen(config.avGateParameters)
    && Object.isFrozen(config.avGateParameters.parameterProvenance);
}

function detachedFrozenCopy<T>(value: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(value)) as T);
}

function finiteSum(left: number, right: number, field: string): number {
  const value = left + right;
  if (!Number.isFinite(value)) {
    throw new Error(`${field} is outside finite seconds domain`);
  }
  return value;
}

function arraysExactlyEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function requireSourceMode(value: unknown): DeterministicRhythmSourceModeV1 {
  if (value !== "regular-sinus" && value !== "regular-atrial-flutter") {
    throw new Error("source mode must be regular-sinus or regular-atrial-flutter");
  }
  return value;
}

function requirePlainRecord(value: unknown, field: string): Record<string, unknown> {
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
  expected: readonly string[],
  field: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) throw new Error(`${field} must contain exactly: ${required.join(", ")}`);
}

function validateDenseArray(value: readonly unknown[], field: string): void {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${field} must not contain holes`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be finite and greater than or equal to zero`);
  }
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be finite and greater than zero`);
  }
  return value;
}

function requireUnitInterval(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > 1
  ) throw new Error(`${field} must lie in [0, 1]`);
  return value;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

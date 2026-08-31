import { canonicalJsonStringify } from "@/engine/integrity";

/**
 * Minimal accepted electrical-capture composition layer.
 *
 * This module deliberately owns neither a source generator nor AV conduction.
 * An enclosing scheduler supplies a complete same-time impulse batch. Candidate
 * evaluation is pure; commit exactly recomputes the candidate from its accepted
 * base, and rollback returns the accepted object identity.
 */

export const SOURCE_IMPULSE_V2_ID = "source-impulse-v2" as const;
export const CAPTURE_DECISION_V2_ID = "capture-decision-v2" as const;
export const CAPTURED_ELECTRICAL_ACTIVATION_V2_ID =
  "captured-electrical-activation-v2" as const;
export const ELECTRICAL_CAPTURE_GATE_CONFIGURATION_V2_ID =
  "electrical-capture-gate-configuration-v2" as const;
export const ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CONFIGURATION_V2_ID =
  "accepted-electrical-capture-owner-configuration-v2" as const;
export const ACCEPTED_ELECTRICAL_CAPTURE_GATE_STATE_V2_ID =
  "accepted-electrical-capture-gate-state-v2" as const;
export const ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID =
  "accepted-electrical-capture-owner-state-v2" as const;
export const ACCEPTED_ELECTRICAL_CAPTURE_BATCH_CANDIDATE_V2_ID =
  "accepted-electrical-capture-batch-candidate-v2" as const;

/** Hard failure bound for one exact-time batch; events are never truncated. */
export const MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2 = 4_096 as const;

export const ELECTRICAL_CAPTURE_PRIORITY_V2 = Object.freeze({
  "authored-ectopy": 10,
  "primary-intrinsic": 20,
  "av-output": 20,
  escape: 25,
  pacing: 30,
} as const);

export const ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CLAIM_V2 = Object.freeze({
  scope: "minimal-two-chamber-electrical-capture-composition" as const,
  absoluteElectricalTimes: "signed-finite" as const,
  acceptedOwnerTime: "nonnegative-finite" as const,
  sameTimeBatchRequirement:
    "complete-batch-arbitrated-before-candidate-state-construction" as const,
  chambers: "atrial-and-ventricular-independent" as const,
  captureOrdering:
    "capturePriority-ascending-then-sourceId-code-unit-then-sourceSequence" as const,
  endogenousVentricularBackupBeforePacing:
    "escape-is-arbitrated-before-pacing-at-exact-time" as const,
  priorities: ELECTRICAL_CAPTURE_PRIORITY_V2,
  refractoryRule: "time-strictly-less-than-refractoryUntil-is-blocked" as const,
  refractoryBoundaryEqualityCaptures: true as const,
  availableChamberOutcome:
    "one-winner-captured-and-other-same-time-proposals-coincident-suppressed" as const,
  refractoryChamberOutcome: "all-proposals-refractory-blocked" as const,
  configuredStimuli: "suprathreshold-by-construction" as const,
  sourceRouteSemantics: Object.freeze({
    primaryIntrinsic: "atrial-myocardium-only" as const,
    avOutput:
      "ventricular-myocardium-with-required-parent-atrial-capture" as const,
    escape: "ventricular-myocardium-only" as const,
    authoredEctopyAndPacing: "atrial-or-ventricular" as const,
  }),
  upstreamLineageResolution:
    "enclosing-composition-must-resolve-parent-id" as const,
  hardFailureBatchBound: MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2,
  fusionClaimed: false as const,
  stimulusThresholdModelClaimed: false as const,
  regionalActivationClaimed: false as const,
  ecgClaimed: false as const,
  sourceGeneratorClaimed: false as const,
  avConductionClaimed: false as const,
  atrialFibrillationClaimed: false as const,
  clinicalValidityClaimed: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
});

export type ElectricalCaptureChamberV2 = "atrial" | "ventricular";

export type ElectricalImpulseSourceKindV2 =
  | "authored-ectopy"
  | "primary-intrinsic"
  | "av-output"
  | "pacing"
  | "escape";

export type ElectricalCapturePriorityV2 =
  (typeof ELECTRICAL_CAPTURE_PRIORITY_V2)[ElectricalImpulseSourceKindV2];

export type SourceImpulseInputV2 = Readonly<{
  sourceImpulseId: string;
  /** Optional upstream activation, for example the atrial parent of AV output. */
  parentCapturedActivationId: string | null;
  chamber: ElectricalCaptureChamberV2;
  sourceKind: ElectricalImpulseSourceKindV2;
  sourceId: string;
  sourceSequence: number;
  /** Signed finite absolute electrical time, in seconds. */
  activationTimeSec: number;
}>;

export type SourceImpulseV2 = Readonly<{
  impulseSchemaId: typeof SOURCE_IMPULSE_V2_ID;
  schemaVersion: 2;
  sourceImpulseId: string;
  parentCapturedActivationId: string | null;
  chamber: ElectricalCaptureChamberV2;
  sourceKind: ElectricalImpulseSourceKindV2;
  capturePriority: ElectricalCapturePriorityV2;
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type HistoricalCapturedElectricalActivationSeedV2 = Readonly<{
  /** Canonical signed-time source whose capture is asserted by initial history. */
  sourceImpulse: SourceImpulseV2;
  /** Positive ordinal in the historical capture owner's lineage. */
  captureOrdinal: number;
  /** Positive revision in the historical capture owner's lineage. */
  ownerRevision: number;
}>;

export const HISTORICAL_CAPTURED_ELECTRICAL_ACTIVATION_SEED_CLAIM_V2 =
  Object.freeze({
    scope: "explicit-initial-history-lineage-construction" as const,
    signedSourceActivationTimeAllowed: true as const,
    sourceImpulseValidatedCanonically: true as const,
    captureIdentityFramingMatchesLiveOwner: true as const,
    acceptedOwnerStateMutated: false as const,
    captureArbitrationReplayed: false as const,
    historyAssertedByInitializingModel: true as const,
  });

export type CaptureDecisionOutcomeV2 =
  | "captured"
  | "coincident-suppressed"
  | "refractory-blocked";

export type CaptureDecisionV2 = Readonly<{
  decisionSchemaId: typeof CAPTURE_DECISION_V2_ID;
  schemaVersion: 2;
  decisionId: string;
  /** Every decision has exactly one parent in candidate.sourceImpulses. */
  parentSourceImpulseId: string;
  chamber: ElectricalCaptureChamberV2;
  gateInstanceId: string;
  sourceId: string;
  sourceSequence: number;
  capturePriority: ElectricalCapturePriorityV2;
  activationTimeSec: number;
  outcome: CaptureDecisionOutcomeV2;
  winnerSourceImpulseId: string | null;
  capturedActivationId: string | null;
  refractoryUntilBeforeSec: number;
  refractoryUntilAfterSec: number;
}>;

export type CapturedElectricalActivationV2 = Readonly<{
  activationSchemaId: typeof CAPTURED_ELECTRICAL_ACTIVATION_V2_ID;
  schemaVersion: 2;
  capturedActivationId: string;
  /** Exactly one winning source impulse owns this activation. */
  parentSourceImpulseId: string;
  /** Preserved external lineage carried by the source impulse. */
  upstreamCapturedActivationId: string | null;
  chamber: ElectricalCaptureChamberV2;
  gateInstanceId: string;
  activationTimeSec: number;
  sourceKind: ElectricalImpulseSourceKindV2;
  sourceId: string;
  sourceSequence: number;
  capturePriority: ElectricalCapturePriorityV2;
  captureOrdinal: number;
  ownerRevision: number;
}>;

export type ElectricalCaptureGateConfigurationInputV2 = Readonly<{
  gateInstanceId: string;
  refractoryPeriodSec: number;
}>;

export type ElectricalCaptureGateConfigurationV2 = Readonly<{
  gateConfigurationSchemaId:
    typeof ELECTRICAL_CAPTURE_GATE_CONFIGURATION_V2_ID;
  schemaVersion: 2;
  gateInstanceId: string;
  chamber: ElectricalCaptureChamberV2;
  refractoryPeriodSec: number;
}>;

export type AcceptedElectricalCaptureOwnerConfigurationInputV2 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  atrialGate: ElectricalCaptureGateConfigurationInputV2;
  ventricularGate: ElectricalCaptureGateConfigurationInputV2;
}>;

export type AcceptedElectricalCaptureOwnerConfigurationV2 = Readonly<{
  configurationSchemaId:
    typeof ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CONFIGURATION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  atrialGate: ElectricalCaptureGateConfigurationV2;
  ventricularGate: ElectricalCaptureGateConfigurationV2;
}>;

export type PriorCapturedElectricalActivationV2 = Readonly<{
  capturedActivationId: string;
  /** May be negative; it is an absolute finite history time. */
  activationTimeSec: number;
}>;

export type AcceptedElectricalCaptureOwnerInitialStateInputV2 = Readonly<{
  acceptedTimeSec: number;
  atrialPriorCapture: PriorCapturedElectricalActivationV2 | null;
  ventricularPriorCapture: PriorCapturedElectricalActivationV2 | null;
}>;

export type AcceptedElectricalCaptureGateStateV2 = Readonly<{
  gateStateSchemaId: typeof ACCEPTED_ELECTRICAL_CAPTURE_GATE_STATE_V2_ID;
  schemaVersion: 2;
  gateInstanceId: string;
  chamber: ElectricalCaptureChamberV2;
  /** Counts nonempty accepted batches presented to this chamber. */
  revision: number;
  acceptedBatchCount: number;
  processedImpulseCount: number;
  capturedActivationCount: number;
  coincidentSuppressedCount: number;
  refractoryBlockedCount: number;
  lastCapturedActivationId: string | null;
  lastCapturedActivationTimeSec: number | null;
  refractoryUntilSec: number;
}>;

export type AcceptedElectricalCaptureOwnerStateV2 = Readonly<{
  stateSchemaId: typeof ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID;
  schemaVersion: 2;
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2;
  /** Counts nonempty accepted same-time batches, not numerical time chunks. */
  revision: number;
  acceptedTimeSec: number;
  acceptedImpulseBatchCount: number;
  lastAcceptedImpulseBatchTimeSec: number | null;
  atrialGate: AcceptedElectricalCaptureGateStateV2;
  ventricularGate: AcceptedElectricalCaptureGateStateV2;
}>;

export type AcceptedElectricalCaptureBatchInputV2 = Readonly<{
  /** Nonnegative owner time; all supplied impulses must occur exactly here. */
  candidateTimeSec: number;
  sourceImpulses: readonly SourceImpulseV2[];
}>;

export type AcceptedElectricalCaptureBatchCandidateV2 = Readonly<{
  candidateSchemaId:
    typeof ACCEPTED_ELECTRICAL_CAPTURE_BATCH_CANDIDATE_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  sourceImpulses: readonly SourceImpulseV2[];
  decisions: readonly CaptureDecisionV2[];
  capturedActivations: readonly CapturedElectricalActivationV2[];
  candidateState: AcceptedElectricalCaptureOwnerStateV2;
}>;

const SOURCE_IMPULSE_INPUT_KEYS = Object.freeze([
  "sourceImpulseId",
  "parentCapturedActivationId",
  "chamber",
  "sourceKind",
  "sourceId",
  "sourceSequence",
  "activationTimeSec",
] as const);

const SOURCE_IMPULSE_KEYS = Object.freeze([
  "impulseSchemaId",
  "schemaVersion",
  ...SOURCE_IMPULSE_INPUT_KEYS.slice(0, 4),
  "capturePriority",
  ...SOURCE_IMPULSE_INPUT_KEYS.slice(4),
] as const);

const GATE_CONFIGURATION_INPUT_KEYS = Object.freeze([
  "gateInstanceId",
  "refractoryPeriodSec",
] as const);

const GATE_CONFIGURATION_KEYS = Object.freeze([
  "gateConfigurationSchemaId",
  "schemaVersion",
  "gateInstanceId",
  "chamber",
  "refractoryPeriodSec",
] as const);

const OWNER_CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "atrialGate",
  "ventricularGate",
] as const);

const OWNER_CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  ...OWNER_CONFIGURATION_INPUT_KEYS,
] as const);

const INITIAL_STATE_INPUT_KEYS = Object.freeze([
  "acceptedTimeSec",
  "atrialPriorCapture",
  "ventricularPriorCapture",
] as const);

const PRIOR_CAPTURE_KEYS = Object.freeze([
  "capturedActivationId",
  "activationTimeSec",
] as const);

const GATE_STATE_KEYS = Object.freeze([
  "gateStateSchemaId",
  "schemaVersion",
  "gateInstanceId",
  "chamber",
  "revision",
  "acceptedBatchCount",
  "processedImpulseCount",
  "capturedActivationCount",
  "coincidentSuppressedCount",
  "refractoryBlockedCount",
  "lastCapturedActivationId",
  "lastCapturedActivationTimeSec",
  "refractoryUntilSec",
] as const);

const OWNER_STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "revision",
  "acceptedTimeSec",
  "acceptedImpulseBatchCount",
  "lastAcceptedImpulseBatchTimeSec",
  "atrialGate",
  "ventricularGate",
] as const);

const BATCH_INPUT_KEYS = Object.freeze([
  "candidateTimeSec",
  "sourceImpulses",
] as const);

const CANDIDATE_KEYS = Object.freeze([
  "candidateSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "baseRevision",
  "candidateRevision",
  "startTimeSec",
  "candidateTimeSec",
  "sourceImpulses",
  "decisions",
  "capturedActivations",
  "candidateState",
] as const);

const HISTORICAL_CAPTURE_SEED_KEYS = Object.freeze([
  "sourceImpulse",
  "captureOrdinal",
  "ownerRevision",
] as const);

export function createSourceImpulseV2(
  input: SourceImpulseInputV2,
): SourceImpulseV2 {
  const record = requirePlainRecord(input, "source impulse input");
  requireExactKeys(record, SOURCE_IMPULSE_INPUT_KEYS, "source impulse input");
  const sourceKind = requireSourceKind(
    input.sourceKind,
    "source impulse input.sourceKind",
  );
  const parentCapturedActivationId = requireNullableNonemptyString(
    input.parentCapturedActivationId,
    "source impulse input.parentCapturedActivationId",
  );
  const chamber = requireChamber(
    input.chamber,
    "source impulse input.chamber",
  );
  validateSourceRoute(sourceKind, chamber, parentCapturedActivationId);
  return Object.freeze({
    impulseSchemaId: SOURCE_IMPULSE_V2_ID,
    schemaVersion: 2 as const,
    sourceImpulseId: requireNonemptyString(
      input.sourceImpulseId,
      "source impulse input.sourceImpulseId",
    ),
    parentCapturedActivationId,
    chamber,
    sourceKind,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind],
    sourceId: requireNonemptyString(
      input.sourceId,
      "source impulse input.sourceId",
    ),
    sourceSequence: requireNonnegativeSafeInteger(
      input.sourceSequence,
      "source impulse input.sourceSequence",
    ),
    activationTimeSec: normalizeFinite(
      input.activationTimeSec,
      "source impulse input.activationTimeSec",
    ),
  });
}

export function validateSourceImpulseV2(impulse: SourceImpulseV2): void {
  const record = requirePlainRecord(impulse, "source impulse");
  requireExactKeys(record, SOURCE_IMPULSE_KEYS, "source impulse");
  if (impulse.impulseSchemaId !== SOURCE_IMPULSE_V2_ID) {
    throw new Error("source impulse schema id is invalid");
  }
  if (impulse.schemaVersion !== 2) {
    throw new Error("source impulse schemaVersion must be 2");
  }
  requireNonemptyString(impulse.sourceImpulseId, "source impulse id");
  const parentCapturedActivationId = requireNullableNonemptyString(
    impulse.parentCapturedActivationId,
    "source impulse parent captured activation id",
  );
  const chamber = requireChamber(impulse.chamber, "source impulse chamber");
  const sourceKind = requireSourceKind(impulse.sourceKind, "source impulse kind");
  validateSourceRoute(sourceKind, chamber, parentCapturedActivationId);
  if (impulse.capturePriority !== ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind]) {
    throw new Error("source impulse capture priority does not match source kind");
  }
  requireNonemptyString(impulse.sourceId, "source impulse source id");
  requireNonnegativeSafeInteger(
    impulse.sourceSequence,
    "source impulse source sequence",
  );
  requireFinite(impulse.activationTimeSec, "source impulse activation time");
}

/**
 * Constructs an explicit capture record for signed-time initial history.
 *
 * This is not a hidden replay through the nonnegative accepted-time owner. The
 * initializing model supplies a canonical historical source and explicitly
 * asserts its successful capture lineage. Live candidate evaluation remains
 * the sole owner of captures at nonnegative simulation time.
 */
export function createHistoricalCapturedElectricalActivationV2(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
  seed: HistoricalCapturedElectricalActivationSeedV2,
): CapturedElectricalActivationV2 {
  validateConfiguration(configuration);
  const record = requirePlainRecord(seed, "historical capture seed");
  requireExactKeys(
    record,
    HISTORICAL_CAPTURE_SEED_KEYS,
    "historical capture seed",
  );
  const source = copySourceImpulse(seed.sourceImpulse);
  const captureOrdinal = requirePositiveSafeInteger(
    seed.captureOrdinal,
    "historical capture seed.captureOrdinal",
  );
  const ownerRevision = requirePositiveSafeInteger(
    seed.ownerRevision,
    "historical capture seed.ownerRevision",
  );
  if (captureOrdinal > ownerRevision) {
    throw new Error(
      "historical capture seed.captureOrdinal cannot exceed ownerRevision",
    );
  }
  const gate = source.chamber === "atrial"
    ? configuration.atrialGate
    : configuration.ventricularGate;
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: buildCapturedActivationId(
      configuration.ownerInstanceId,
      ownerRevision,
      source,
    ),
    parentSourceImpulseId: source.sourceImpulseId,
    upstreamCapturedActivationId: source.parentCapturedActivationId,
    chamber: source.chamber,
    gateInstanceId: gate.gateInstanceId,
    activationTimeSec: source.activationTimeSec,
    sourceKind: source.sourceKind,
    sourceId: source.sourceId,
    sourceSequence: source.sourceSequence,
    capturePriority: source.capturePriority,
    captureOrdinal,
    ownerRevision,
  });
}

export function createAcceptedElectricalCaptureOwnerConfigurationV2(
  input: AcceptedElectricalCaptureOwnerConfigurationInputV2,
): AcceptedElectricalCaptureOwnerConfigurationV2 {
  const record = requirePlainRecord(input, "capture owner configuration input");
  requireExactKeys(
    record,
    OWNER_CONFIGURATION_INPUT_KEYS,
    "capture owner configuration input",
  );
  const atrialGate = createGateConfiguration(
    input.atrialGate,
    "atrial",
    "capture owner configuration input.atrialGate",
  );
  const ventricularGate = createGateConfiguration(
    input.ventricularGate,
    "ventricular",
    "capture owner configuration input.ventricularGate",
  );
  if (atrialGate.gateInstanceId === ventricularGate.gateInstanceId) {
    throw new Error("atrial and ventricular gate instance ids must differ");
  }
  return Object.freeze({
    configurationSchemaId:
      ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CONFIGURATION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "capture owner configuration input.configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "capture owner configuration input.ownerInstanceId",
    ),
    atrialGate,
    ventricularGate,
  });
}

export function initializeAcceptedElectricalCaptureOwnerStateV2(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
  input: AcceptedElectricalCaptureOwnerInitialStateInputV2,
): AcceptedElectricalCaptureOwnerStateV2 {
  const ownedConfiguration = copyConfiguration(configuration);
  const record = requirePlainRecord(input, "capture owner initial state input");
  requireExactKeys(
    record,
    INITIAL_STATE_INPUT_KEYS,
    "capture owner initial state input",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "capture owner initial state input.acceptedTimeSec",
  );
  const atrialPrior = copyPriorCapture(
    input.atrialPriorCapture,
    acceptedTimeSec,
    "capture owner initial state input.atrialPriorCapture",
  );
  const ventricularPrior = copyPriorCapture(
    input.ventricularPriorCapture,
    acceptedTimeSec,
    "capture owner initial state input.ventricularPriorCapture",
  );

  return Object.freeze({
    stateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: ownedConfiguration,
    revision: 0,
    acceptedTimeSec,
    acceptedImpulseBatchCount: 0,
    lastAcceptedImpulseBatchTimeSec: null,
    atrialGate: initializeGateState(
      ownedConfiguration.atrialGate,
      atrialPrior,
      acceptedTimeSec,
    ),
    ventricularGate: initializeGateState(
      ownedConfiguration.ventricularGate,
      ventricularPrior,
      acceptedTimeSec,
    ),
  });
}

/**
 * Purely arbitrates one complete same-time batch before constructing any
 * candidate state. An empty batch is a clock-only advance and does not alter
 * revisions or chamber capture state.
 */
export function evaluateAcceptedElectricalCaptureBatchCandidateV2(
  acceptedState: AcceptedElectricalCaptureOwnerStateV2,
  input: AcceptedElectricalCaptureBatchInputV2,
): AcceptedElectricalCaptureBatchCandidateV2 {
  validateAcceptedElectricalCaptureOwnerStateV2(acceptedState);
  const record = requirePlainRecord(input, "capture batch input");
  requireExactKeys(record, BATCH_INPUT_KEYS, "capture batch input");
  const candidateTimeSec = requireNonnegativeFinite(
    input.candidateTimeSec,
    "capture batch input.candidateTimeSec",
  );
  if (candidateTimeSec < acceptedState.acceptedTimeSec) {
    throw new Error("capture batch candidate time precedes accepted owner time");
  }
  if (!Array.isArray(input.sourceImpulses)) {
    throw new Error("capture batch sourceImpulses must be an array");
  }
  if (
    input.sourceImpulses.length
      > MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2
  ) {
    throw new Error("capture batch exceeds its hard source-impulse bound");
  }

  const copied = input.sourceImpulses.map(copySourceImpulse);
  for (const impulse of copied) {
    if (impulse.activationTimeSec !== candidateTimeSec) {
      throw new Error(
        "every source impulse must occur exactly at the batch candidate time",
      );
    }
  }
  requireUniqueSourceImpulseIds(copied);
  requireUnambiguousArbitrationKeys(copied);
  if (
    copied.length > 0
    && acceptedState.lastAcceptedImpulseBatchTimeSec !== null
    && candidateTimeSec <= acceptedState.lastAcceptedImpulseBatchTimeSec
  ) {
    throw new Error("nonempty capture batch times must be strictly increasing");
  }
  if (copied.length > 0 && acceptedState.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("capture owner revision cannot be incremented safely");
  }

  const canonicalImpulses = Object.freeze([...copied].sort(compareGlobally));
  const atrialImpulses = canonicalImpulses.filter(
    (impulse) => impulse.chamber === "atrial",
  );
  const ventricularImpulses = canonicalImpulses.filter(
    (impulse) => impulse.chamber === "ventricular",
  );
  const candidateRevision = acceptedState.revision
    + (canonicalImpulses.length > 0 ? 1 : 0);

  // Both chamber decisions are completed from the same accepted snapshot.
  const atrial = arbitrateChamber(
    acceptedState,
    acceptedState.atrialGate,
    acceptedState.configuration.atrialGate,
    atrialImpulses,
    candidateTimeSec,
    candidateRevision,
  );
  const ventricular = arbitrateChamber(
    acceptedState,
    acceptedState.ventricularGate,
    acceptedState.configuration.ventricularGate,
    ventricularImpulses,
    candidateTimeSec,
    candidateRevision,
  );

  const candidateState: AcceptedElectricalCaptureOwnerStateV2 = Object.freeze({
    stateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: acceptedState.configuration,
    revision: candidateRevision,
    acceptedTimeSec: candidateTimeSec,
    acceptedImpulseBatchCount: acceptedState.acceptedImpulseBatchCount
      + (canonicalImpulses.length > 0 ? 1 : 0),
    lastAcceptedImpulseBatchTimeSec: canonicalImpulses.length > 0
      ? candidateTimeSec
      : acceptedState.lastAcceptedImpulseBatchTimeSec,
    atrialGate: atrial.candidateGateState,
    ventricularGate: ventricular.candidateGateState,
  });

  return Object.freeze({
    candidateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_BATCH_CANDIDATE_V2_ID,
    schemaVersion: 2 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    baseRevision: acceptedState.revision,
    candidateRevision,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec,
    sourceImpulses: canonicalImpulses,
    decisions: Object.freeze([...atrial.decisions, ...ventricular.decisions]),
    capturedActivations: Object.freeze([
      ...atrial.capturedActivations,
      ...ventricular.capturedActivations,
    ]),
    candidateState,
  });
}

export function commitAcceptedElectricalCaptureBatchCandidateV2(
  acceptedState: AcceptedElectricalCaptureOwnerStateV2,
  candidate: AcceptedElectricalCaptureBatchCandidateV2,
): AcceptedElectricalCaptureOwnerStateV2 {
  validateAcceptedElectricalCaptureOwnerStateV2(acceptedState);
  validateCandidateShape(candidate);
  const expected = evaluateAcceptedElectricalCaptureBatchCandidateV2(
    acceptedState,
    Object.freeze({
      candidateTimeSec: candidate.candidateTimeSec,
      sourceImpulses: candidate.sourceImpulses,
    }),
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("capture batch candidate does not match its accepted base");
  }
  return expected.candidateState;
}

export function rollbackAcceptedElectricalCaptureBatchCandidateV2(
  acceptedState: AcceptedElectricalCaptureOwnerStateV2,
  candidate: AcceptedElectricalCaptureBatchCandidateV2,
): AcceptedElectricalCaptureOwnerStateV2 {
  validateAcceptedElectricalCaptureOwnerStateV2(acceptedState);
  validateCandidateShape(candidate);
  const expected = evaluateAcceptedElectricalCaptureBatchCandidateV2(
    acceptedState,
    Object.freeze({
      candidateTimeSec: candidate.candidateTimeSec,
      sourceImpulses: candidate.sourceImpulses,
    }),
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("capture batch candidate does not match its accepted base");
  }
  return acceptedState;
}

export function validateAcceptedElectricalCaptureOwnerStateV2(
  state: AcceptedElectricalCaptureOwnerStateV2,
): void {
  const record = requirePlainRecord(state, "accepted capture owner state");
  requireExactKeys(record, OWNER_STATE_KEYS, "accepted capture owner state");
  if (state.stateSchemaId !== ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID) {
    throw new Error("accepted capture owner state schema id is invalid");
  }
  if (state.schemaVersion !== 2) {
    throw new Error("accepted capture owner state schemaVersion must be 2");
  }
  if (
    !Object.isFrozen(state)
    || !Object.isFrozen(state.configuration)
    || !Object.isFrozen(state.configuration.atrialGate)
    || !Object.isFrozen(state.configuration.ventricularGate)
    || !Object.isFrozen(state.atrialGate)
    || !Object.isFrozen(state.ventricularGate)
  ) {
    throw new Error("accepted capture owner state must be recursively immutable");
  }
  validateConfiguration(state.configuration);
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "accepted capture owner state revision",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "accepted capture owner state accepted time",
  );
  const batchCount = requireNonnegativeSafeInteger(
    state.acceptedImpulseBatchCount,
    "accepted capture owner state accepted batch count",
  );
  if (revision !== batchCount) {
    throw new Error("capture owner revision must equal accepted impulse batch count");
  }
  const lastBatchTime = requireNullableNonnegativeFinite(
    state.lastAcceptedImpulseBatchTimeSec,
    "accepted capture owner state last batch time",
  );
  if ((lastBatchTime === null) !== (batchCount === 0)) {
    throw new Error("last accepted batch time must agree with batch count");
  }
  if (lastBatchTime !== null && lastBatchTime > acceptedTimeSec) {
    throw new Error("last accepted batch time exceeds accepted owner time");
  }
  validateGateState(
    state.atrialGate,
    state.configuration.atrialGate,
    acceptedTimeSec,
  );
  validateGateState(
    state.ventricularGate,
    state.configuration.ventricularGate,
    acceptedTimeSec,
  );
  validateOwnerGateCounterCoupling(state);
}

type ChamberArbitration = Readonly<{
  decisions: readonly CaptureDecisionV2[];
  capturedActivations: readonly CapturedElectricalActivationV2[];
  candidateGateState: AcceptedElectricalCaptureGateStateV2;
}>;

function arbitrateChamber(
  ownerState: AcceptedElectricalCaptureOwnerStateV2,
  gateState: AcceptedElectricalCaptureGateStateV2,
  gateConfiguration: ElectricalCaptureGateConfigurationV2,
  impulses: readonly SourceImpulseV2[],
  candidateTimeSec: number,
  candidateOwnerRevision: number,
): ChamberArbitration {
  if (impulses.length === 0) {
    return Object.freeze({
      decisions: Object.freeze([]),
      capturedActivations: Object.freeze([]),
      candidateGateState: gateState,
    });
  }
  if (
    gateState.revision === Number.MAX_SAFE_INTEGER
    || gateState.processedImpulseCount > Number.MAX_SAFE_INTEGER - impulses.length
  ) {
    throw new Error("capture gate counters cannot be incremented safely");
  }

  const available = candidateTimeSec >= gateState.refractoryUntilSec;
  const winner = available ? impulses[0]! : null;
  const captureOrdinal = gateState.capturedActivationCount + (available ? 1 : 0);
  if (captureOrdinal > Number.MAX_SAFE_INTEGER) {
    throw new Error("capture ordinal cannot be incremented safely");
  }
  const capturedActivation = winner === null
    ? null
    : buildCapturedActivation(
      ownerState,
      gateState,
      winner,
      captureOrdinal,
      candidateOwnerRevision,
    );
  const refractoryUntilAfterSec = capturedActivation === null
    ? gateState.refractoryUntilSec
    : requireComputedFinite(
      candidateTimeSec + gateConfiguration.refractoryPeriodSec,
      "candidate refractory boundary",
    );

  const decisions = Object.freeze(impulses.map((impulse, index) => {
    const outcome: CaptureDecisionOutcomeV2 = !available
      ? "refractory-blocked"
      : index === 0
        ? "captured"
        : "coincident-suppressed";
    return Object.freeze({
      decisionSchemaId: CAPTURE_DECISION_V2_ID,
      schemaVersion: 2 as const,
      decisionId: buildDecisionId(
        ownerState.configuration.ownerInstanceId,
        candidateOwnerRevision,
        impulse,
      ),
      parentSourceImpulseId: impulse.sourceImpulseId,
      chamber: impulse.chamber,
      gateInstanceId: gateState.gateInstanceId,
      sourceId: impulse.sourceId,
      sourceSequence: impulse.sourceSequence,
      capturePriority: impulse.capturePriority,
      activationTimeSec: impulse.activationTimeSec,
      outcome,
      winnerSourceImpulseId: available ? winner!.sourceImpulseId : null,
      capturedActivationId: available
        ? capturedActivation!.capturedActivationId
        : null,
      refractoryUntilBeforeSec: gateState.refractoryUntilSec,
      refractoryUntilAfterSec,
    });
  }));

  const candidateGateState: AcceptedElectricalCaptureGateStateV2 =
    Object.freeze({
      gateStateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_GATE_STATE_V2_ID,
      schemaVersion: 2 as const,
      gateInstanceId: gateState.gateInstanceId,
      chamber: gateState.chamber,
      revision: gateState.revision + 1,
      acceptedBatchCount: gateState.acceptedBatchCount + 1,
      processedImpulseCount: gateState.processedImpulseCount + impulses.length,
      capturedActivationCount: captureOrdinal,
      coincidentSuppressedCount: gateState.coincidentSuppressedCount
        + (available ? impulses.length - 1 : 0),
      refractoryBlockedCount: gateState.refractoryBlockedCount
        + (available ? 0 : impulses.length),
      lastCapturedActivationId: capturedActivation?.capturedActivationId
        ?? gateState.lastCapturedActivationId,
      lastCapturedActivationTimeSec: capturedActivation?.activationTimeSec
        ?? gateState.lastCapturedActivationTimeSec,
      refractoryUntilSec: refractoryUntilAfterSec,
    });

  return Object.freeze({
    decisions,
    capturedActivations: capturedActivation === null
      ? Object.freeze([])
      : Object.freeze([capturedActivation]),
    candidateGateState,
  });
}

function buildCapturedActivation(
  ownerState: AcceptedElectricalCaptureOwnerStateV2,
  gateState: AcceptedElectricalCaptureGateStateV2,
  impulse: SourceImpulseV2,
  captureOrdinal: number,
  ownerRevision: number,
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: buildCapturedActivationId(
      ownerState.configuration.ownerInstanceId,
      ownerRevision,
      impulse,
    ),
    parentSourceImpulseId: impulse.sourceImpulseId,
    upstreamCapturedActivationId: impulse.parentCapturedActivationId,
    chamber: impulse.chamber,
    gateInstanceId: gateState.gateInstanceId,
    activationTimeSec: impulse.activationTimeSec,
    sourceKind: impulse.sourceKind,
    sourceId: impulse.sourceId,
    sourceSequence: impulse.sourceSequence,
    capturePriority: impulse.capturePriority,
    captureOrdinal,
    ownerRevision,
  });
}

function createGateConfiguration(
  input: ElectricalCaptureGateConfigurationInputV2,
  chamber: ElectricalCaptureChamberV2,
  field: string,
): ElectricalCaptureGateConfigurationV2 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, GATE_CONFIGURATION_INPUT_KEYS, field);
  return Object.freeze({
    gateConfigurationSchemaId: ELECTRICAL_CAPTURE_GATE_CONFIGURATION_V2_ID,
    schemaVersion: 2 as const,
    gateInstanceId: requireNonemptyString(input.gateInstanceId, `${field}.gateInstanceId`),
    chamber,
    refractoryPeriodSec: requirePositiveFinite(
      input.refractoryPeriodSec,
      `${field}.refractoryPeriodSec`,
    ),
  });
}

function initializeGateState(
  configuration: ElectricalCaptureGateConfigurationV2,
  prior: PriorCapturedElectricalActivationV2 | null,
  acceptedTimeSec: number,
): AcceptedElectricalCaptureGateStateV2 {
  return Object.freeze({
    gateStateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_GATE_STATE_V2_ID,
    schemaVersion: 2 as const,
    gateInstanceId: configuration.gateInstanceId,
    chamber: configuration.chamber,
    revision: 0,
    acceptedBatchCount: 0,
    processedImpulseCount: 0,
    capturedActivationCount: 0,
    coincidentSuppressedCount: 0,
    refractoryBlockedCount: 0,
    lastCapturedActivationId: prior?.capturedActivationId ?? null,
    lastCapturedActivationTimeSec: prior?.activationTimeSec ?? null,
    refractoryUntilSec: prior === null
      ? acceptedTimeSec
      : requireComputedFinite(
        prior.activationTimeSec + configuration.refractoryPeriodSec,
        "initial refractory boundary",
      ),
  });
}

function copyPriorCapture(
  input: PriorCapturedElectricalActivationV2 | null,
  acceptedTimeSec: number,
  field: string,
): PriorCapturedElectricalActivationV2 | null {
  if (input === null) return null;
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, PRIOR_CAPTURE_KEYS, field);
  const activationTimeSec = normalizeFinite(
    input.activationTimeSec,
    `${field}.activationTimeSec`,
  );
  if (activationTimeSec > acceptedTimeSec) {
    throw new Error(`${field}.activationTimeSec exceeds accepted owner time`);
  }
  return Object.freeze({
    capturedActivationId: requireNonemptyString(
      input.capturedActivationId,
      `${field}.capturedActivationId`,
    ),
    activationTimeSec,
  });
}

function copySourceImpulse(impulse: SourceImpulseV2): SourceImpulseV2 {
  validateSourceImpulseV2(impulse);
  return Object.freeze({
    impulseSchemaId: impulse.impulseSchemaId,
    schemaVersion: impulse.schemaVersion,
    sourceImpulseId: impulse.sourceImpulseId,
    parentCapturedActivationId: impulse.parentCapturedActivationId,
    chamber: impulse.chamber,
    sourceKind: impulse.sourceKind,
    capturePriority: impulse.capturePriority,
    sourceId: impulse.sourceId,
    sourceSequence: impulse.sourceSequence,
    activationTimeSec: normalizeFinite(
      impulse.activationTimeSec,
      "source impulse activation time",
    ),
  });
}

function copyConfiguration(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
): AcceptedElectricalCaptureOwnerConfigurationV2 {
  validateConfiguration(configuration);
  return Object.freeze({
    configurationSchemaId: configuration.configurationSchemaId,
    schemaVersion: configuration.schemaVersion,
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    atrialGate: Object.freeze({ ...configuration.atrialGate }),
    ventricularGate: Object.freeze({ ...configuration.ventricularGate }),
  });
}

function validateConfiguration(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
): void {
  const record = requirePlainRecord(configuration, "capture owner configuration");
  requireExactKeys(record, OWNER_CONFIGURATION_KEYS, "capture owner configuration");
  if (
    configuration.configurationSchemaId
    !== ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CONFIGURATION_V2_ID
  ) {
    throw new Error("capture owner configuration schema id is invalid");
  }
  if (configuration.schemaVersion !== 2) {
    throw new Error("capture owner configuration schemaVersion must be 2");
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(configuration.ownerInstanceId, "owner instance id");
  validateGateConfiguration(configuration.atrialGate, "atrial");
  validateGateConfiguration(configuration.ventricularGate, "ventricular");
  if (
    configuration.atrialGate.gateInstanceId
    === configuration.ventricularGate.gateInstanceId
  ) {
    throw new Error("atrial and ventricular gate instance ids must differ");
  }
}

function validateGateConfiguration(
  configuration: ElectricalCaptureGateConfigurationV2,
  chamber: ElectricalCaptureChamberV2,
): void {
  const record = requirePlainRecord(configuration, `${chamber} gate configuration`);
  requireExactKeys(record, GATE_CONFIGURATION_KEYS, `${chamber} gate configuration`);
  if (
    configuration.gateConfigurationSchemaId
    !== ELECTRICAL_CAPTURE_GATE_CONFIGURATION_V2_ID
  ) {
    throw new Error(`${chamber} gate configuration schema id is invalid`);
  }
  if (configuration.schemaVersion !== 2 || configuration.chamber !== chamber) {
    throw new Error(`${chamber} gate configuration identity is invalid`);
  }
  requireNonemptyString(configuration.gateInstanceId, `${chamber} gate id`);
  requirePositiveFinite(
    configuration.refractoryPeriodSec,
    `${chamber} gate refractory period`,
  );
}

function validateGateState(
  state: AcceptedElectricalCaptureGateStateV2,
  configuration: ElectricalCaptureGateConfigurationV2,
  acceptedTimeSec: number,
): void {
  const record = requirePlainRecord(state, `${configuration.chamber} gate state`);
  requireExactKeys(record, GATE_STATE_KEYS, `${configuration.chamber} gate state`);
  if (state.gateStateSchemaId !== ACCEPTED_ELECTRICAL_CAPTURE_GATE_STATE_V2_ID) {
    throw new Error(`${configuration.chamber} gate state schema id is invalid`);
  }
  if (
    state.schemaVersion !== 2
    || state.gateInstanceId !== configuration.gateInstanceId
    || state.chamber !== configuration.chamber
  ) {
    throw new Error(`${configuration.chamber} gate state identity is invalid`);
  }
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    `${state.chamber} gate revision`,
  );
  const acceptedBatchCount = requireNonnegativeSafeInteger(
    state.acceptedBatchCount,
    `${state.chamber} gate accepted batch count`,
  );
  if (revision !== acceptedBatchCount) {
    throw new Error(`${state.chamber} gate revision must equal accepted batch count`);
  }
  const processed = requireNonnegativeSafeInteger(
    state.processedImpulseCount,
    `${state.chamber} gate processed impulse count`,
  );
  const captured = requireNonnegativeSafeInteger(
    state.capturedActivationCount,
    `${state.chamber} gate captured activation count`,
  );
  const suppressed = requireNonnegativeSafeInteger(
    state.coincidentSuppressedCount,
    `${state.chamber} gate coincident suppressed count`,
  );
  const blocked = requireNonnegativeSafeInteger(
    state.refractoryBlockedCount,
    `${state.chamber} gate refractory blocked count`,
  );
  if (captured + suppressed + blocked !== processed) {
    throw new Error(`${state.chamber} gate outcome counters must sum to inputs`);
  }
  const lastId = requireNullableNonemptyString(
    state.lastCapturedActivationId,
    `${state.chamber} gate last captured activation id`,
  );
  const lastTime = requireNullableFinite(
    state.lastCapturedActivationTimeSec,
    `${state.chamber} gate last captured activation time`,
  );
  if ((lastId === null) !== (lastTime === null)) {
    throw new Error(`${state.chamber} gate last capture id and time must agree`);
  }
  if (lastTime !== null) {
    if (lastTime > acceptedTimeSec) {
      throw new Error(`${state.chamber} gate last capture exceeds accepted time`);
    }
    const expectedBoundary = requireComputedFinite(
      lastTime + configuration.refractoryPeriodSec,
      `${state.chamber} gate expected refractory boundary`,
    );
    if (state.refractoryUntilSec !== expectedBoundary) {
      throw new Error(`${state.chamber} gate refractory boundary is inconsistent`);
    }
  } else {
    const refractoryUntilSec = requireFinite(
      state.refractoryUntilSec,
      `${state.chamber} gate refractory boundary`,
    );
    if (refractoryUntilSec > acceptedTimeSec) {
      throw new Error(
        `${state.chamber} gate without capture cannot be refractory in the future`,
      );
    }
    if (processed !== 0 || revision !== 0) {
      throw new Error(
        `${state.chamber} gate with accepted proposals must have a captured history`,
      );
    }
  }
}

function validateOwnerGateCounterCoupling(
  state: AcceptedElectricalCaptureOwnerStateV2,
): void {
  const ownerBatchCount = state.acceptedImpulseBatchCount;
  const atrialBatchCount = state.atrialGate.acceptedBatchCount;
  const ventricularBatchCount = state.ventricularGate.acceptedBatchCount;
  if (
    atrialBatchCount > ownerBatchCount
    || ventricularBatchCount > ownerBatchCount
  ) {
    throw new Error("chamber batch counts cannot exceed owner batch count");
  }
  if (
    ownerBatchCount > atrialBatchCount
    && ownerBatchCount - atrialBatchCount > ventricularBatchCount
  ) {
    throw new Error("every owner batch must be represented by a chamber batch");
  }
  for (const gate of [state.atrialGate, state.ventricularGate]) {
    if (gate.capturedActivationCount > gate.acceptedBatchCount) {
      throw new Error(`${gate.chamber} captures cannot exceed chamber batches`);
    }
    if (gate.processedImpulseCount < gate.acceptedBatchCount) {
      throw new Error(`${gate.chamber} chamber batches cannot be empty`);
    }
    const maximumExactlyRepresentableBatchCount = Math.floor(
      Number.MAX_SAFE_INTEGER / MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2,
    );
    if (
      gate.acceptedBatchCount <= maximumExactlyRepresentableBatchCount
      && gate.processedImpulseCount
        > gate.acceptedBatchCount
          * MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2
    ) {
      throw new Error(`${gate.chamber} processed count exceeds hard batch bounds`);
    }
  }
  const lastBatchTime = state.lastAcceptedImpulseBatchTimeSec;
  if (lastBatchTime !== null) {
    for (const gate of [state.atrialGate, state.ventricularGate]) {
      if (
        gate.lastCapturedActivationTimeSec !== null
        && gate.lastCapturedActivationTimeSec > lastBatchTime
      ) {
        throw new Error(`${gate.chamber} last capture exceeds last owner batch time`);
      }
    }
  }
}

function validateCandidateShape(
  candidate: AcceptedElectricalCaptureBatchCandidateV2,
): void {
  const record = requirePlainRecord(candidate, "capture batch candidate");
  requireExactKeys(record, CANDIDATE_KEYS, "capture batch candidate");
  if (
    candidate.candidateSchemaId
    !== ACCEPTED_ELECTRICAL_CAPTURE_BATCH_CANDIDATE_V2_ID
  ) {
    throw new Error("capture batch candidate schema id is invalid");
  }
  if (candidate.schemaVersion !== 2) {
    throw new Error("capture batch candidate schemaVersion must be 2");
  }
  requireNonemptyString(candidate.configurationId, "candidate configuration id");
  requireNonemptyString(candidate.ownerInstanceId, "candidate owner id");
  requireNonnegativeSafeInteger(candidate.baseRevision, "candidate base revision");
  requireNonnegativeSafeInteger(
    candidate.candidateRevision,
    "candidate revision",
  );
  requireNonnegativeFinite(candidate.startTimeSec, "candidate start time");
  requireNonnegativeFinite(candidate.candidateTimeSec, "candidate time");
  if (!Array.isArray(candidate.sourceImpulses)) {
    throw new Error("candidate sourceImpulses must be an array");
  }
  candidate.sourceImpulses.forEach(validateSourceImpulseV2);
  if (!Array.isArray(candidate.decisions)) {
    throw new Error("candidate decisions must be an array");
  }
  if (!Array.isArray(candidate.capturedActivations)) {
    throw new Error("candidate capturedActivations must be an array");
  }
  validateAcceptedElectricalCaptureOwnerStateV2(candidate.candidateState);
  // Fail closed on functions, accessors, nonfinite values, cycles, and aliases
  // outside the serializable JSON data model before exact recomputation.
  canonicalJsonStringify(candidate);
}

function requireUniqueSourceImpulseIds(impulses: readonly SourceImpulseV2[]): void {
  const ids = new Set<string>();
  for (const impulse of impulses) {
    if (ids.has(impulse.sourceImpulseId)) {
      throw new Error("source impulse ids must be unique within a batch");
    }
    ids.add(impulse.sourceImpulseId);
  }
}

function requireUnambiguousArbitrationKeys(
  impulses: readonly SourceImpulseV2[],
): void {
  const keys = new Set<string>();
  for (const impulse of impulses) {
    const key = canonicalJsonStringify([
      impulse.chamber,
      impulse.capturePriority,
      impulse.sourceId,
      impulse.sourceSequence,
    ]);
    if (keys.has(key)) {
      throw new Error(
        "same-chamber impulses must not share the complete arbitration key",
      );
    }
    keys.add(key);
  }
}

function compareGlobally(left: SourceImpulseV2, right: SourceImpulseV2): number {
  if (left.chamber !== right.chamber) {
    return left.chamber === "atrial" ? -1 : 1;
  }
  return compareCapturePriority(left, right);
}

function compareCapturePriority(left: SourceImpulseV2, right: SourceImpulseV2): number {
  if (left.capturePriority !== right.capturePriority) {
    return left.capturePriority - right.capturePriority;
  }
  const sourceIdOrder = compareCodeUnits(left.sourceId, right.sourceId);
  if (sourceIdOrder !== 0) return sourceIdOrder;
  return left.sourceSequence - right.sourceSequence;
}

function compareCodeUnits(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function buildDecisionId(
  ownerInstanceId: string,
  ownerRevision: number,
  impulse: SourceImpulseV2,
): string {
  return `${ownerInstanceId}:batch:${ownerRevision}:${impulse.chamber}:decision:${impulse.sourceImpulseId}`;
}

function buildCapturedActivationId(
  ownerInstanceId: string,
  ownerRevision: number,
  impulse: SourceImpulseV2,
): string {
  return `${ownerInstanceId}:batch:${ownerRevision}:${impulse.chamber}:capture:${impulse.sourceImpulseId}`;
}

function requireChamber(value: unknown, field: string): ElectricalCaptureChamberV2 {
  if (value !== "atrial" && value !== "ventricular") {
    throw new Error(`${field} must be atrial or ventricular`);
  }
  return value;
}

function requireSourceKind(
  value: unknown,
  field: string,
): ElectricalImpulseSourceKindV2 {
  if (
    value !== "authored-ectopy"
    && value !== "primary-intrinsic"
    && value !== "av-output"
    && value !== "pacing"
    && value !== "escape"
  ) {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

function validateSourceRoute(
  sourceKind: ElectricalImpulseSourceKindV2,
  chamber: ElectricalCaptureChamberV2,
  parentCapturedActivationId: string | null,
): void {
  if (sourceKind === "primary-intrinsic" && chamber !== "atrial") {
    throw new Error("primary intrinsic impulses must enter atrial myocardium");
  }
  if (sourceKind === "av-output") {
    if (chamber !== "ventricular") {
      throw new Error("AV output impulses must enter ventricular myocardium");
    }
    if (parentCapturedActivationId === null) {
      throw new Error("AV output impulses require a parent atrial capture id");
    }
  }
  if (sourceKind === "escape" && chamber !== "ventricular") {
    throw new Error("escape impulses must enter ventricular myocardium");
  }
}

function requirePlainRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
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
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a nonempty string`);
  }
  return value;
}

function requireNullableNonemptyString(
  value: unknown,
  field: string,
): string | null {
  return value === null ? null : requireNonemptyString(value, field);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function normalizeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  return Object.is(finite, -0) ? 0 : finite;
}

function requireComputedFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} is not finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  const finite = normalizeFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function requireNullableFinite(value: unknown, field: string): number | null {
  return value === null ? null : requireFinite(value, field);
}

function requireNullableNonnegativeFinite(
  value: unknown,
  field: string,
): number | null {
  return value === null ? null : requireNonnegativeFinite(value, field);
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value as number;
}

function requirePositiveSafeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value as number;
}

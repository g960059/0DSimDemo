import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  createSourceImpulseV2,
  validateSourceImpulseV2,
  type CapturedElectricalActivationV2,
  type ElectricalImpulseSourceKindV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/integrity";
import {
  validationStampIssuanceEligibleV1,
  validationStampReuseEligibleV1,
} from "@/engine/validationStampModeV1";

/**
 * Accepted ventricular backup-source clock for intrinsic escape and simple VVI.
 *
 * This owner proposes source impulses and consumes capture feedback. It never
 * decides or claims myocardial capture. An enclosing composition previews the
 * complete non-VVI batch from one accepted capture-owner base. Only when that
 * preview contains no accepted ventricular capture may the conditional VVI
 * impulse be added and the complete batch recomputed from the same base.
 */

export const VENTRICULAR_BACKUP_PARAMETER_PROVENANCE_V2_ID =
  "ventricular-backup-parameter-provenance-v2" as const;
export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CONFIGURATION_V2_ID =
  "accepted-ventricular-backup-source-configuration-v2" as const;
export const VENTRICULAR_BACKUP_INITIAL_CAPTURE_SEED_V2_ID =
  "ventricular-backup-initial-capture-seed-v2" as const;
export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID =
  "accepted-ventricular-backup-source-state-v2" as const;
export const VENTRICULAR_BACKUP_SOURCE_PROPOSAL_V2_ID =
  "ventricular-backup-source-proposal-v2" as const;
export const VENTRICULAR_BACKUP_SOURCE_ATTEMPT_RESULT_V2_ID =
  "ventricular-backup-source-attempt-result-v2" as const;
export const VENTRICULAR_BACKUP_SOURCE_RESOLUTION_V2_ID =
  "ventricular-backup-source-resolution-v2" as const;
export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CANDIDATE_V2_ID =
  "accepted-ventricular-backup-source-candidate-v2" as const;

export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2 = deepFreeze({
  scope: "intrinsic-ventricular-escape-plus-simple-vvi-source-clock" as const,
  parameters: "explicit-only-with-no-hidden-clinical-defaults" as const,
  acceptedOwnerTime: "nonnegative-finite" as const,
  initialCaptureHistoryTime: "signed-finite" as const,
  intrinsicEscapeRule:
    "accepted-ventricular-capture-resets-due-and-each-due-attempt-advances-one-explicit-escape-cycle-even-without-capture" as const,
  vviLowerRateRule:
    "lower-rate-interval-seconds-equals-60-divided-by-explicit-lower-rate-limit-per-minute" as const,
  vviTimerRule:
    "accepted-ventricular-capture-senses-and-resets-due-and-each-due-pacing-attempt-advances-one-lower-rate-interval-even-without-capture" as const,
  sameTimeComposition: Object.freeze({
    first:
      "preview-complete-non-vvi-batch-including-escape-from-one-accepted-capture-owner-base" as const,
    second:
      "if-and-only-if-preview-has-no-accepted-ventricular-capture-add-conditional-vvi-and-exactly-recompute-complete-batch-from-same-base" as const,
    commit: "commit-capture-owner-at-most-once-at-the-boundary" as const,
    endogenousBeforeVvi: true as const,
  }),
  captureFeedback:
    "accepted-ventricular-activation-plus-parent-source-impulse-lineage" as const,
  ownerImpulseIdentityFeedback: Object.freeze({
    namespaceReservation:
      "all-current-stale-and-replayed-framed-owner-identities" as const,
    acceptedEscape:
      "exact-current-due-escape-lineage-only" as const,
    acceptedVvi:
      "exact-current-due-conditional-vvi-lineage-only" as const,
  }),
  externalPacingFeedback: Object.freeze({
    acceptedAsNonVviCapture: true as const,
    distinguishedFromOwnedConditionalVviBy:
      "exact-parent-source-impulse-lineage-not-source-kind-alone" as const,
    ownedConditionalVviMayNotMasqueradeAsNonVvi: true as const,
    externalPacingPacemakerPhysiologyClaimed: false as const,
  }),
  sourceAttemptFeedback:
    "one-result-per-presented-owner-impulse-keyed-by-source-impulse-and-optional-captured-activation" as const,
  failedAttemptSemantics:
    "advances-own-timer-without-being-counted-as-capture" as const,
  timerBoundaryEqualityIsDue: true as const,
  eventStepRequirement:
    "candidate-may-not-cross-earliest-owner-due-time" as const,
  boundaryEndpointContract:
    "absolute-candidate-time-only-never-derived-duration-readdition" as const,
  constructionEvidence: Object.freeze({
    intrinsicEscape:
      "Kennelly-and-Lane-1978-PMID-87278-is-rate-plausibility-context-only;-rate-is-an-explicit-scenario-parameter" as const,
    simpleVvi:
      "FDA-P150033D-clinician-manual-supports-lower-rate-interval-construction-only;not-a-device-firmware-model" as const,
  }),
  validationLimit:
    "no-population-default-or-patient-level-prediction-is-claimed" as const,
  captureClaimed: false as const,
  sensingWindowsClaimed: false as const,
  blankingClaimed: false as const,
  hysteresisClaimed: false as const,
  rateResponseClaimed: false as const,
  stimulusThresholdClaimed: false as const,
  batteryClaimed: false as const,
  fusionClaimed: false as const,
  vaConductionClaimed: false as const,
  ecgClaimed: false as const,
  calciumDepositionClaimed: false as const,
  downstreamMechanicalActivationRule:
    "only-enclosing-capture-owner-accepted-ventricular-activation-may-reach-calcium-or-mechanics" as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
});

export type VentricularBackupParameterProvenanceKindV2 =
  | "authored"
  | "literature-construction";

export type VentricularBackupParameterProvenanceInputV2 = Readonly<{
  kind: VentricularBackupParameterProvenanceKindV2;
  sourceId: string;
}>;

export type VentricularBackupParameterProvenanceV2 = Readonly<{
  provenanceSchemaId: typeof VENTRICULAR_BACKUP_PARAMETER_PROVENANCE_V2_ID;
  schemaVersion: 2;
  kind: VentricularBackupParameterProvenanceKindV2;
  sourceId: string;
}>;

export type AcceptedVentricularBackupSourceConfigurationInputV2 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  parameterProvenance: VentricularBackupParameterProvenanceInputV2;
  intrinsicEscapeSourceId: string;
  intrinsicEscapeCycleLengthSec: number;
  vviPacingSourceId: string;
  vviLowerRateLimitPerMin: number;
}>;

export type AcceptedVentricularBackupSourceConfigurationV2 = Readonly<{
  configurationSchemaId:
    typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CONFIGURATION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  parameterProvenance: VentricularBackupParameterProvenanceV2;
  intrinsicEscapeSourceId: string;
  intrinsicEscapeCycleLengthSec: number;
  vviPacingSourceId: string;
  vviLowerRateLimitPerMin: number;
  /** Exactly 60 / vviLowerRateLimitPerMin. */
  vviLowerRateIntervalSec: number;
}>;

export type VentricularBackupInitialCaptureSeedInputV2 = Readonly<{
  capturedActivationId: string;
  parentSourceImpulseId: string;
  sourceKind: Exclude<ElectricalImpulseSourceKindV2, "primary-intrinsic">;
  sourceId: string;
  sourceSequence: number;
  /** Signed finite absolute history time. */
  activationTimeSec: number;
}>;

export type VentricularBackupInitialCaptureSeedV2 = Readonly<{
  seedSchemaId: typeof VENTRICULAR_BACKUP_INITIAL_CAPTURE_SEED_V2_ID;
  schemaVersion: 2;
  capturedActivationId: string;
  parentSourceImpulseId: string;
  sourceKind: Exclude<ElectricalImpulseSourceKindV2, "primary-intrinsic">;
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type AcceptedVentricularBackupSourceInitialStateInputV2 = Readonly<{
  acceptedTimeSec: number;
  /**
   * Explicit accepted capture used only to seed both future timers. Its two
   * derived due times must lie strictly after acceptedTimeSec; history is not
   * silently replayed or synthesized.
   */
  priorAcceptedVentricularCapture: VentricularBackupInitialCaptureSeedInputV2;
}>;

export type VentricularBackupSourceAttemptOutcomeV2 =
  | "captured"
  | "not-captured";

export type VentricularBackupSourceAttemptResultV2 = Readonly<{
  resultSchemaId: typeof VENTRICULAR_BACKUP_SOURCE_ATTEMPT_RESULT_V2_ID;
  schemaVersion: 2;
  sourceImpulseId: string;
  sourceKind: "escape" | "pacing";
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
  outcome: VentricularBackupSourceAttemptOutcomeV2;
  capturedActivationId: string | null;
}>;

export type AcceptedVentricularBackupSourceStateV2 = Readonly<{
  stateSchemaId: typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID;
  schemaVersion: 2;
  configuration: AcceptedVentricularBackupSourceConfigurationV2;
  initialAcceptedTimeSec: number;
  initialCaptureSeed: VentricularBackupInitialCaptureSeedV2;
  revision: number;
  acceptedTimeSec: number;
  nextIntrinsicEscapeDueTimeSec: number;
  nextVviPaceDueTimeSec: number;
  intrinsicEscapeAttemptCount: number;
  vviPacingAttemptCount: number;
  intrinsicEscapeCapturedCount: number;
  vviPacingCapturedCount: number;
  acceptedVentricularCaptureFeedbackCount: number;
  lastAcceptedVentricularActivation:
    CapturedElectricalActivationV2 | null;
  lastIntrinsicEscapeAttemptResult:
    VentricularBackupSourceAttemptResultV2 | null;
  lastVviPacingAttemptResult:
    VentricularBackupSourceAttemptResultV2 | null;
}>;

export type VentricularBackupSourceProposalV2 = Readonly<{
  proposalSchemaId: typeof VENTRICULAR_BACKUP_SOURCE_PROPOSAL_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  intrinsicEscapeDue: boolean;
  vviPaceDue: boolean;
  /** Add this complete slice to the enclosing non-VVI batch. */
  sourceImpulsesForNonVviBatch: readonly SourceImpulseV2[];
  /** Present only after the non-VVI preview has no accepted V capture. */
  conditionalVviPacingSourceImpulse: SourceImpulseV2 | null;
  /** Reserved current-sequence identity, present even when VVI is not due. */
  reservedConditionalVviPacingSourceImpulseId: string;
  compositionInstruction:
    "non-vvi-preview-then-conditional-vvi-exact-recompute-from-same-base";
}>;

export type VentricularBackupSourceResolutionInputV2 = Readonly<{
  nonVviAcceptedVentricularActivation:
    CapturedElectricalActivationV2 | null;
  conditionalVviPacingAcceptedVentricularActivation:
    CapturedElectricalActivationV2 | null;
}>;

export type VentricularBackupAcceptedCapturePhaseV2 =
  | "non-vvi"
  | "conditional-vvi"
  | null;

export type VentricularBackupSourceResolutionV2 = Readonly<{
  resolutionSchemaId: typeof VENTRICULAR_BACKUP_SOURCE_RESOLUTION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateTimeSec: number;
  nonVviAcceptedVentricularActivation:
    CapturedElectricalActivationV2 | null;
  conditionalVviPacingAttempted: boolean;
  conditionalVviPacingAcceptedVentricularActivation:
    CapturedElectricalActivationV2 | null;
  acceptedCapturePhase: VentricularBackupAcceptedCapturePhaseV2;
  acceptedVentricularActivation: CapturedElectricalActivationV2 | null;
  sourceAttemptResults: readonly VentricularBackupSourceAttemptResultV2[];
}>;

export type AcceptedVentricularBackupSourceCandidateV2 = Readonly<{
  candidateSchemaId:
    typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CANDIDATE_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  proposal: VentricularBackupSourceProposalV2;
  resolution: VentricularBackupSourceResolutionV2;
  candidateState: AcceptedVentricularBackupSourceStateV2;
}>;

export type AcceptedVentricularBackupCandidateTimeLimitV2 = Readonly<{
  requestedCandidateTimeSec: number;
  candidateTimeSec: number;
  clippedByDueTime: boolean;
  boundaryDueTimeSec: number | null;
  intrinsicEscapeDueAtBoundary: boolean;
  vviPaceDueAtBoundary: boolean;
}>;

const PROVENANCE_INPUT_KEYS = Object.freeze(["kind", "sourceId"] as const);
const PROVENANCE_KEYS = Object.freeze([
  "provenanceSchemaId",
  "schemaVersion",
  ...PROVENANCE_INPUT_KEYS,
] as const);
const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "parameterProvenance",
  "intrinsicEscapeSourceId",
  "intrinsicEscapeCycleLengthSec",
  "vviPacingSourceId",
  "vviLowerRateLimitPerMin",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  ...CONFIGURATION_INPUT_KEYS,
  "vviLowerRateIntervalSec",
] as const);
const INITIAL_CAPTURE_INPUT_KEYS = Object.freeze([
  "capturedActivationId",
  "parentSourceImpulseId",
  "sourceKind",
  "sourceId",
  "sourceSequence",
  "activationTimeSec",
] as const);
const INITIAL_CAPTURE_KEYS = Object.freeze([
  "seedSchemaId",
  "schemaVersion",
  ...INITIAL_CAPTURE_INPUT_KEYS,
] as const);
const INITIAL_STATE_INPUT_KEYS = Object.freeze([
  "acceptedTimeSec",
  "priorAcceptedVentricularCapture",
] as const);
const ATTEMPT_RESULT_KEYS = Object.freeze([
  "resultSchemaId",
  "schemaVersion",
  "sourceImpulseId",
  "sourceKind",
  "sourceId",
  "sourceSequence",
  "activationTimeSec",
  "outcome",
  "capturedActivationId",
] as const);
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initialAcceptedTimeSec",
  "initialCaptureSeed",
  "revision",
  "acceptedTimeSec",
  "nextIntrinsicEscapeDueTimeSec",
  "nextVviPaceDueTimeSec",
  "intrinsicEscapeAttemptCount",
  "vviPacingAttemptCount",
  "intrinsicEscapeCapturedCount",
  "vviPacingCapturedCount",
  "acceptedVentricularCaptureFeedbackCount",
  "lastAcceptedVentricularActivation",
  "lastIntrinsicEscapeAttemptResult",
  "lastVviPacingAttemptResult",
] as const);

const VALIDATED_VENTRICULAR_BACKUP_CONFIGURATIONS_V2 =
  new WeakSet<AcceptedVentricularBackupSourceConfigurationV2>();
const VALIDATED_VENTRICULAR_BACKUP_STATES_V2 =
  new WeakSet<AcceptedVentricularBackupSourceStateV2>();
const PROPOSAL_KEYS = Object.freeze([
  "proposalSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "baseRevision",
  "startTimeSec",
  "candidateTimeSec",
  "intrinsicEscapeDue",
  "vviPaceDue",
  "sourceImpulsesForNonVviBatch",
  "conditionalVviPacingSourceImpulse",
  "reservedConditionalVviPacingSourceImpulseId",
  "compositionInstruction",
] as const);
const RESOLUTION_INPUT_KEYS = Object.freeze([
  "nonVviAcceptedVentricularActivation",
  "conditionalVviPacingAcceptedVentricularActivation",
] as const);
const RESOLUTION_KEYS = Object.freeze([
  "resolutionSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "baseRevision",
  "candidateTimeSec",
  "nonVviAcceptedVentricularActivation",
  "conditionalVviPacingAttempted",
  "conditionalVviPacingAcceptedVentricularActivation",
  "acceptedCapturePhase",
  "acceptedVentricularActivation",
  "sourceAttemptResults",
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
  "proposal",
  "resolution",
  "candidateState",
] as const);
const CAPTURED_ACTIVATION_KEYS = Object.freeze([
  "activationSchemaId",
  "schemaVersion",
  "capturedActivationId",
  "parentSourceImpulseId",
  "upstreamCapturedActivationId",
  "chamber",
  "gateInstanceId",
  "activationTimeSec",
  "sourceKind",
  "sourceId",
  "sourceSequence",
  "capturePriority",
  "captureOrdinal",
  "ownerRevision",
] as const);

const COMPOSITION_INSTRUCTION =
  "non-vvi-preview-then-conditional-vvi-exact-recompute-from-same-base" as const;

export function createAcceptedVentricularBackupSourceConfigurationV2(
  input: AcceptedVentricularBackupSourceConfigurationInputV2,
): AcceptedVentricularBackupSourceConfigurationV2 {
  canonicalJsonStringify(input);
  const record = requirePlainRecord(input, "ventricular backup configuration input");
  requireExactKeys(record, CONFIGURATION_INPUT_KEYS, "ventricular backup configuration input");
  const provenanceRecord = requirePlainRecord(
    input.parameterProvenance,
    "ventricular backup parameter provenance input",
  );
  requireExactKeys(
    provenanceRecord,
    PROVENANCE_INPUT_KEYS,
    "ventricular backup parameter provenance input",
  );
  const lowerRateLimit = requirePositiveFinite(
    input.vviLowerRateLimitPerMin,
    "VVI lower-rate limit per minute",
  );
  const lowerRateInterval = 60 / lowerRateLimit;
  if (!Number.isFinite(lowerRateInterval) || !(lowerRateInterval > 0)) {
    throw new Error("derived VVI lower-rate interval must be positive finite");
  }
  const configuration = deepFreeze({
    configurationSchemaId:
      ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CONFIGURATION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: requireNonemptyString(input.configurationId, "configuration id"),
    ownerInstanceId: requireNonemptyString(input.ownerInstanceId, "owner instance id"),
    parameterProvenance: {
      provenanceSchemaId: VENTRICULAR_BACKUP_PARAMETER_PROVENANCE_V2_ID,
      schemaVersion: 2 as const,
      kind: requireProvenanceKind(input.parameterProvenance.kind),
      sourceId: requireNonemptyString(
        input.parameterProvenance.sourceId,
        "parameter provenance source id",
      ),
    },
    intrinsicEscapeSourceId: requireNonemptyString(
      input.intrinsicEscapeSourceId,
      "intrinsic escape source id",
    ),
    intrinsicEscapeCycleLengthSec: requirePositiveFinite(
      input.intrinsicEscapeCycleLengthSec,
      "intrinsic escape cycle length",
    ),
    vviPacingSourceId: requireNonemptyString(
      input.vviPacingSourceId,
      "VVI pacing source id",
    ),
    vviLowerRateLimitPerMin: lowerRateLimit,
    vviLowerRateIntervalSec: lowerRateInterval,
  }) satisfies AcceptedVentricularBackupSourceConfigurationV2;
  canonicalJsonStringify(configuration);
  return configuration;
}

export function validateAcceptedVentricularBackupSourceConfigurationV2(
  configuration: AcceptedVentricularBackupSourceConfigurationV2,
): void {
  if (
    validationStampReuseEligibleV1()
    && VALIDATED_VENTRICULAR_BACKUP_CONFIGURATIONS_V2.has(configuration)
  ) return;
  const record = requirePlainRecord(configuration, "ventricular backup configuration");
  requireExactKeys(record, CONFIGURATION_KEYS, "ventricular backup configuration");
  if (
    configuration.configurationSchemaId
      !== ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CONFIGURATION_V2_ID
    || configuration.schemaVersion !== 2
  ) throw new Error("ventricular backup configuration schema is invalid");
  if (!Object.isFrozen(configuration) || !Object.isFrozen(configuration.parameterProvenance)) {
    throw new Error("ventricular backup configuration must be recursively immutable");
  }
  const provenance = requirePlainRecord(
    configuration.parameterProvenance,
    "ventricular backup parameter provenance",
  );
  requireExactKeys(provenance, PROVENANCE_KEYS, "ventricular backup parameter provenance");
  if (
    configuration.parameterProvenance.provenanceSchemaId
      !== VENTRICULAR_BACKUP_PARAMETER_PROVENANCE_V2_ID
    || configuration.parameterProvenance.schemaVersion !== 2
  ) throw new Error("ventricular backup parameter provenance schema is invalid");
  const rebuilt = createAcceptedVentricularBackupSourceConfigurationV2({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    intrinsicEscapeSourceId: configuration.intrinsicEscapeSourceId,
    intrinsicEscapeCycleLengthSec: configuration.intrinsicEscapeCycleLengthSec,
    vviPacingSourceId: configuration.vviPacingSourceId,
    vviLowerRateLimitPerMin: configuration.vviLowerRateLimitPerMin,
  });
  if (canonicalJsonStringify(configuration) !== canonicalJsonStringify(rebuilt)) {
    throw new Error("ventricular backup configuration is not canonical");
  }
  if (validationStampIssuanceEligibleV1(configuration)) {
    VALIDATED_VENTRICULAR_BACKUP_CONFIGURATIONS_V2.add(configuration);
  }
}

export function initializeAcceptedVentricularBackupSourceStateV2(
  configuration: AcceptedVentricularBackupSourceConfigurationV2,
  input: AcceptedVentricularBackupSourceInitialStateInputV2,
): AcceptedVentricularBackupSourceStateV2 {
  const ownedConfiguration = copyConfiguration(configuration);
  canonicalJsonStringify(input);
  const record = requirePlainRecord(input, "ventricular backup initial state input");
  requireExactKeys(record, INITIAL_STATE_INPUT_KEYS, "ventricular backup initial state input");
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "ventricular backup initial accepted time",
  );
  const initialCaptureSeed = createInitialCaptureSeed(
    input.priorAcceptedVentricularCapture,
  );
  if (initialCaptureSeed.activationTimeSec > acceptedTimeSec) {
    throw new Error("initial accepted ventricular capture cannot follow accepted time");
  }
  const nextIntrinsicEscapeDueTimeSec = safeFutureTime(
    initialCaptureSeed.activationTimeSec,
    ownedConfiguration.intrinsicEscapeCycleLengthSec,
    "initial intrinsic escape due time",
  );
  const nextVviPaceDueTimeSec = safeFutureTime(
    initialCaptureSeed.activationTimeSec,
    ownedConfiguration.vviLowerRateIntervalSec,
    "initial VVI due time",
  );
  if (
    !(nextIntrinsicEscapeDueTimeSec > acceptedTimeSec)
    || !(nextVviPaceDueTimeSec > acceptedTimeSec)
  ) {
    throw new Error(
      "explicit prior capture must seed both owner due times after accepted time",
    );
  }
  return Object.freeze({
    stateSchemaId: ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: ownedConfiguration,
    initialAcceptedTimeSec: acceptedTimeSec,
    initialCaptureSeed,
    revision: 0,
    acceptedTimeSec,
    nextIntrinsicEscapeDueTimeSec,
    nextVviPaceDueTimeSec,
    intrinsicEscapeAttemptCount: 0,
    vviPacingAttemptCount: 0,
    intrinsicEscapeCapturedCount: 0,
    vviPacingCapturedCount: 0,
    acceptedVentricularCaptureFeedbackCount: 0,
    lastAcceptedVentricularActivation: null,
    lastIntrinsicEscapeAttemptResult: null,
    lastVviPacingAttemptResult: null,
  });
}

/** Pure proposal; the candidate may stop before, but never cross, a due time. */
export function evaluateVentricularBackupSourceProposalV2(
  acceptedState: AcceptedVentricularBackupSourceStateV2,
  candidateTimeSec: number,
): VentricularBackupSourceProposalV2 {
  validateAcceptedVentricularBackupSourceStateV2(acceptedState);
  const candidateTime = requireNonnegativeFinite(
    candidateTimeSec,
    "ventricular backup proposal candidate time",
  );
  if (!(candidateTime > acceptedState.acceptedTimeSec)) {
    throw new Error("ventricular backup proposal time must exceed accepted time");
  }
  const earliestDue = Math.min(
    acceptedState.nextIntrinsicEscapeDueTimeSec,
    acceptedState.nextVviPaceDueTimeSec,
  );
  if (candidateTime > earliestDue) {
    throw new Error("ventricular backup proposal may not cross earliest due time");
  }
  const intrinsicEscapeDue = candidateTime
    === acceptedState.nextIntrinsicEscapeDueTimeSec;
  const vviPaceDue = candidateTime === acceptedState.nextVviPaceDueTimeSec;
  const escapeImpulse = intrinsicEscapeDue
    ? sourceImpulse(
      acceptedState,
      "escape",
      acceptedState.intrinsicEscapeAttemptCount,
      candidateTime,
    )
    : null;
  const reservedPacingImpulse = sourceImpulse(
    acceptedState,
    "pacing",
    acceptedState.vviPacingAttemptCount,
    candidateTime,
  );
  const pacingImpulse = vviPaceDue ? reservedPacingImpulse : null;
  return Object.freeze({
    proposalSchemaId: VENTRICULAR_BACKUP_SOURCE_PROPOSAL_V2_ID,
    schemaVersion: 2 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    baseRevision: acceptedState.revision,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec: candidateTime,
    intrinsicEscapeDue,
    vviPaceDue,
    sourceImpulsesForNonVviBatch: Object.freeze(
      escapeImpulse === null ? [] : [escapeImpulse],
    ),
    conditionalVviPacingSourceImpulse: pacingImpulse,
    reservedConditionalVviPacingSourceImpulseId:
      reservedPacingImpulse.sourceImpulseId,
    compositionInstruction: COMPOSITION_INSTRUCTION,
  });
}

/**
 * Builds exact source-attempt feedback from accepted activation lineage.
 * Absence of a matching accepted activation is an explicit failed attempt,
 * never a capture surrogate.
 */
export function createVentricularBackupSourceResolutionV2(
  proposal: VentricularBackupSourceProposalV2,
  input: VentricularBackupSourceResolutionInputV2,
): VentricularBackupSourceResolutionV2 {
  validateProposalEnvelope(proposal);
  canonicalJsonStringify(input);
  const record = requirePlainRecord(input, "ventricular backup resolution input");
  requireExactKeys(record, RESOLUTION_INPUT_KEYS, "ventricular backup resolution input");
  const nonVvi = copyOptionalCapturedActivation(
    input.nonVviAcceptedVentricularActivation,
    proposal.candidateTimeSec,
    "non-VVI accepted ventricular activation",
  );
  const conditional = copyOptionalCapturedActivation(
    input.conditionalVviPacingAcceptedVentricularActivation,
    proposal.candidateTimeSec,
    "conditional VVI accepted ventricular activation",
  );
  const escapeImpulse = proposal.sourceImpulsesForNonVviBatch[0] ?? null;
  const pacingImpulse = proposal.conditionalVviPacingSourceImpulse;
  const pacingAttempted = proposal.vviPaceDue && nonVvi === null;
  if (
    nonVvi !== null
    && claimsVentricularBackupOwnerImpulseNamespace(
      proposal,
      "pacing",
      nonVvi.parentSourceImpulseId,
    )
  ) {
    throw new Error(
      "current, stale, or replayed owner VVI activation cannot masquerade as non-VVI feedback",
    );
  }
  if (
    nonVvi !== null
    && (
      nonVvi.sourceKind === "escape"
      || claimsVentricularBackupOwnerImpulseNamespace(
        proposal,
        "escape",
        nonVvi.parentSourceImpulseId,
      )
    )
  ) {
    if (escapeImpulse === null) {
      throw new Error(
        "current, stale, or replayed owner escape activation requires the exact due escape impulse",
      );
    }
    assertActivationMatchesImpulseLineage(
      nonVvi,
      escapeImpulse,
      "intrinsic escape captured activation",
    );
  }
  if (nonVvi !== null && conditional !== null) {
    throw new Error("conditional VVI cannot capture after a non-VVI capture");
  }
  if (!pacingAttempted && conditional !== null) {
    throw new Error("conditional VVI capture requires a due pacing attempt");
  }
  if (pacingAttempted && pacingImpulse === null) {
    throw new Error("due conditional VVI attempt is missing its source impulse");
  }
  if (conditional !== null) {
    if (escapeImpulse !== null) {
      throw new Error(
        "conditional VVI cannot capture when the same-time escape proposal failed",
      );
    }
    assertActivationMatchesImpulseLineage(
      conditional,
      pacingImpulse!,
      "conditional VVI captured activation",
    );
  }
  const acceptedActivation = nonVvi ?? conditional;
  const attemptResults: VentricularBackupSourceAttemptResultV2[] = [];
  if (escapeImpulse !== null) {
    attemptResults.push(attemptResult(
      escapeImpulse,
      acceptedActivation?.parentSourceImpulseId === escapeImpulse.sourceImpulseId
        ? acceptedActivation
        : null,
    ));
  }
  if (pacingAttempted) {
    attemptResults.push(attemptResult(pacingImpulse!, conditional));
  }
  return Object.freeze({
    resolutionSchemaId: VENTRICULAR_BACKUP_SOURCE_RESOLUTION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: proposal.configurationId,
    ownerInstanceId: proposal.ownerInstanceId,
    baseRevision: proposal.baseRevision,
    candidateTimeSec: proposal.candidateTimeSec,
    nonVviAcceptedVentricularActivation: nonVvi,
    conditionalVviPacingAttempted: pacingAttempted,
    conditionalVviPacingAcceptedVentricularActivation: conditional,
    acceptedCapturePhase: nonVvi !== null
      ? "non-vvi"
      : conditional !== null
        ? "conditional-vvi"
        : null,
    acceptedVentricularActivation: acceptedActivation,
    sourceAttemptResults: Object.freeze(attemptResults),
  });
}

/** Pure accepted-state candidate using externally supplied capture feedback. */
export function evaluateAcceptedVentricularBackupSourceCandidateV2(
  acceptedState: AcceptedVentricularBackupSourceStateV2,
  proposal: VentricularBackupSourceProposalV2,
  resolution: VentricularBackupSourceResolutionV2,
): AcceptedVentricularBackupSourceCandidateV2 {
  validateAcceptedVentricularBackupSourceStateV2(acceptedState);
  if (acceptedState.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("ventricular backup revision cannot be incremented safely");
  }
  const expectedProposal = evaluateVentricularBackupSourceProposalV2(
    acceptedState,
    proposal.candidateTimeSec,
  );
  if (canonicalJsonStringify(proposal) !== canonicalJsonStringify(expectedProposal)) {
    throw new Error("ventricular backup proposal does not match accepted base");
  }
  validateResolutionEnvelope(resolution);
  const expectedResolution = createVentricularBackupSourceResolutionV2(
    expectedProposal,
    {
      nonVviAcceptedVentricularActivation:
        resolution.nonVviAcceptedVentricularActivation,
      conditionalVviPacingAcceptedVentricularActivation:
        resolution.conditionalVviPacingAcceptedVentricularActivation,
    },
  );
  if (canonicalJsonStringify(resolution) !== canonicalJsonStringify(expectedResolution)) {
    throw new Error("ventricular backup resolution is not exact lineage feedback");
  }

  const candidateTime = expectedProposal.candidateTimeSec;
  const escapeResult = expectedResolution.sourceAttemptResults.find(
    (result) => result.sourceKind === "escape",
  ) ?? null;
  const pacingResult = expectedResolution.sourceAttemptResults.find(
    (result) => result.sourceKind === "pacing",
  ) ?? null;
  const acceptedActivation = expectedResolution.acceptedVentricularActivation;
  const escapeAttemptCount = safeCounterAdd(
    acceptedState.intrinsicEscapeAttemptCount,
    escapeResult === null ? 0 : 1,
    "intrinsic escape attempt count",
  );
  const pacingAttemptCount = safeCounterAdd(
    acceptedState.vviPacingAttemptCount,
    pacingResult === null ? 0 : 1,
    "VVI pacing attempt count",
  );
  const escapeCapturedCount = safeCounterAdd(
    acceptedState.intrinsicEscapeCapturedCount,
    escapeResult?.outcome === "captured" ? 1 : 0,
    "intrinsic escape captured count",
  );
  const pacingCapturedCount = safeCounterAdd(
    acceptedState.vviPacingCapturedCount,
    pacingResult?.outcome === "captured" ? 1 : 0,
    "VVI pacing captured count",
  );
  const captureFeedbackCount = safeCounterAdd(
    acceptedState.acceptedVentricularCaptureFeedbackCount,
    acceptedActivation === null ? 0 : 1,
    "accepted ventricular capture feedback count",
  );

  let nextEscapeDue = acceptedState.nextIntrinsicEscapeDueTimeSec;
  let nextVviDue = acceptedState.nextVviPaceDueTimeSec;
  if (escapeResult !== null) {
    nextEscapeDue = safeFutureTime(
      candidateTime,
      acceptedState.configuration.intrinsicEscapeCycleLengthSec,
      "next intrinsic escape due time",
    );
  }
  if (pacingResult !== null) {
    nextVviDue = safeFutureTime(
      candidateTime,
      acceptedState.configuration.vviLowerRateIntervalSec,
      "next VVI due time",
    );
  }
  if (acceptedActivation !== null) {
    nextEscapeDue = safeFutureTime(
      candidateTime,
      acceptedState.configuration.intrinsicEscapeCycleLengthSec,
      "capture-reset intrinsic escape due time",
    );
    nextVviDue = safeFutureTime(
      candidateTime,
      acceptedState.configuration.vviLowerRateIntervalSec,
      "capture-reset VVI due time",
    );
  }

  const candidateState = Object.freeze({
    stateSchemaId: ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: acceptedState.configuration,
    initialAcceptedTimeSec: acceptedState.initialAcceptedTimeSec,
    initialCaptureSeed: acceptedState.initialCaptureSeed,
    revision: acceptedState.revision + 1,
    acceptedTimeSec: candidateTime,
    nextIntrinsicEscapeDueTimeSec: nextEscapeDue,
    nextVviPaceDueTimeSec: nextVviDue,
    intrinsicEscapeAttemptCount: escapeAttemptCount,
    vviPacingAttemptCount: pacingAttemptCount,
    intrinsicEscapeCapturedCount: escapeCapturedCount,
    vviPacingCapturedCount: pacingCapturedCount,
    acceptedVentricularCaptureFeedbackCount: captureFeedbackCount,
    lastAcceptedVentricularActivation:
      acceptedActivation ?? acceptedState.lastAcceptedVentricularActivation,
    lastIntrinsicEscapeAttemptResult:
      escapeResult ?? acceptedState.lastIntrinsicEscapeAttemptResult,
    lastVviPacingAttemptResult:
      pacingResult ?? acceptedState.lastVviPacingAttemptResult,
  }) satisfies AcceptedVentricularBackupSourceStateV2;

  return Object.freeze({
    candidateSchemaId: ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CANDIDATE_V2_ID,
    schemaVersion: 2 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    baseRevision: acceptedState.revision,
    candidateRevision: acceptedState.revision + 1,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec: candidateTime,
    proposal: expectedProposal,
    resolution: expectedResolution,
    candidateState,
  });
}

export function commitAcceptedVentricularBackupSourceCandidateV2(
  acceptedState: AcceptedVentricularBackupSourceStateV2,
  candidate: AcceptedVentricularBackupSourceCandidateV2,
): AcceptedVentricularBackupSourceStateV2 {
  validateCandidateEnvelope(candidate);
  const expected = evaluateAcceptedVentricularBackupSourceCandidateV2(
    acceptedState,
    candidate.proposal,
    candidate.resolution,
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("ventricular backup candidate does not match accepted base");
  }
  return expected.candidateState;
}

export function rollbackAcceptedVentricularBackupSourceCandidateV2(
  acceptedState: AcceptedVentricularBackupSourceStateV2,
  candidate: AcceptedVentricularBackupSourceCandidateV2,
): AcceptedVentricularBackupSourceStateV2 {
  validateCandidateEnvelope(candidate);
  const expected = evaluateAcceptedVentricularBackupSourceCandidateV2(
    acceptedState,
    candidate.proposal,
    candidate.resolution,
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("ventricular backup candidate does not match accepted base");
  }
  return acceptedState;
}

/**
 * Limits an absolute requested endpoint to the next owner due time.
 *
 * candidateTimeSec is the sole executable endpoint. A derived duration is
 * deliberately not returned: subtracting this endpoint and adding that
 * duration back to acceptedTimeSec need not reproduce the due time in binary
 * floating-point arithmetic.
 */
export function limitAcceptedVentricularBackupSourceCandidateTimeV2(
  acceptedState: AcceptedVentricularBackupSourceStateV2,
  requestedCandidateTimeSec: number,
): AcceptedVentricularBackupCandidateTimeLimitV2 {
  validateAcceptedVentricularBackupSourceStateV2(acceptedState);
  const requestedCandidateTime = requireNonnegativeFinite(
    requestedCandidateTimeSec,
    "ventricular backup requested candidate time",
  );
  if (!(requestedCandidateTime > acceptedState.acceptedTimeSec)) {
    throw new Error("ventricular backup requested candidate time must advance");
  }
  const boundary = Math.min(
    acceptedState.nextIntrinsicEscapeDueTimeSec,
    acceptedState.nextVviPaceDueTimeSec,
  );
  if (boundary <= requestedCandidateTime) {
    return Object.freeze({
      requestedCandidateTimeSec: requestedCandidateTime,
      candidateTimeSec: boundary,
      clippedByDueTime: boundary < requestedCandidateTime,
      boundaryDueTimeSec: boundary,
      intrinsicEscapeDueAtBoundary:
        acceptedState.nextIntrinsicEscapeDueTimeSec === boundary,
      vviPaceDueAtBoundary: acceptedState.nextVviPaceDueTimeSec === boundary,
    });
  }
  return Object.freeze({
    requestedCandidateTimeSec: requestedCandidateTime,
    candidateTimeSec: requestedCandidateTime,
    clippedByDueTime: false,
    boundaryDueTimeSec: null,
    intrinsicEscapeDueAtBoundary: false,
    vviPaceDueAtBoundary: false,
  });
}

export function validateAcceptedVentricularBackupSourceStateV2(
  state: AcceptedVentricularBackupSourceStateV2,
): void {
  if (
    validationStampReuseEligibleV1()
    && VALIDATED_VENTRICULAR_BACKUP_STATES_V2.has(state)
  ) return;
  const record = requirePlainRecord(state, "accepted ventricular backup state");
  requireExactKeys(record, STATE_KEYS, "accepted ventricular backup state");
  if (
    state.stateSchemaId !== ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID
    || state.schemaVersion !== 2
  ) throw new Error("accepted ventricular backup state schema is invalid");
  if (!Object.isFrozen(state) || !Object.isFrozen(state.initialCaptureSeed)) {
    throw new Error("accepted ventricular backup state must be recursively immutable");
  }
  validateAcceptedVentricularBackupSourceConfigurationV2(state.configuration);
  validateInitialCaptureSeed(state.initialCaptureSeed);
  const initialTime = requireNonnegativeFinite(
    state.initialAcceptedTimeSec,
    "ventricular backup initial accepted time",
  );
  const acceptedTime = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "ventricular backup accepted time",
  );
  if (acceptedTime < initialTime) throw new Error("ventricular backup accepted time precedes initialization");
  if (state.initialCaptureSeed.activationTimeSec > initialTime) {
    throw new Error("initial capture seed follows initial accepted time");
  }
  if (
    !(safeFutureTime(
      state.initialCaptureSeed.activationTimeSec,
      state.configuration.intrinsicEscapeCycleLengthSec,
      "seed-derived intrinsic escape due time",
    ) > initialTime)
    || !(safeFutureTime(
      state.initialCaptureSeed.activationTimeSec,
      state.configuration.vviLowerRateIntervalSec,
      "seed-derived VVI due time",
    ) > initialTime)
  ) throw new Error("initial capture seed must place both due times after initialization");
  const revision = requireNonnegativeSafeInteger(state.revision, "ventricular backup revision");
  const escapeAttempts = requireNonnegativeSafeInteger(
    state.intrinsicEscapeAttemptCount,
    "intrinsic escape attempt count",
  );
  const paceAttempts = requireNonnegativeSafeInteger(
    state.vviPacingAttemptCount,
    "VVI pacing attempt count",
  );
  const escapeCaptured = requireNonnegativeSafeInteger(
    state.intrinsicEscapeCapturedCount,
    "intrinsic escape captured count",
  );
  const paceCaptured = requireNonnegativeSafeInteger(
    state.vviPacingCapturedCount,
    "VVI pacing captured count",
  );
  const feedbackCount = requireNonnegativeSafeInteger(
    state.acceptedVentricularCaptureFeedbackCount,
    "accepted ventricular capture feedback count",
  );
  if (escapeCaptured > escapeAttempts || paceCaptured > paceAttempts) {
    throw new Error("captured source count cannot exceed source attempt count");
  }
  if (escapeCaptured + paceCaptured > feedbackCount) {
    throw new Error("owner-source captures cannot exceed accepted capture feedback");
  }
  if (
    escapeAttempts > revision
    || paceAttempts > revision
    || feedbackCount > revision
  ) throw new Error("ventricular backup event counters cannot exceed revision");
  const nextEscape = requireFinite(
    state.nextIntrinsicEscapeDueTimeSec,
    "next intrinsic escape due time",
  );
  const nextVvi = requireFinite(state.nextVviPaceDueTimeSec, "next VVI pace due time");
  if (!(nextEscape > acceptedTime) || !(nextVvi > acceptedTime)) {
    throw new Error("ventricular backup next due times must follow accepted time");
  }
  validateOptionalCapturedActivation(
    state.lastAcceptedVentricularActivation,
    acceptedTime,
    "last accepted ventricular activation",
    true,
  );
  if ((state.lastAcceptedVentricularActivation === null) !== (feedbackCount === 0)) {
    throw new Error("last accepted ventricular activation must agree with feedback count");
  }
  if (
    state.lastAcceptedVentricularActivation !== null
    && !(state.lastAcceptedVentricularActivation.activationTimeSec > initialTime)
  ) throw new Error("runtime ventricular capture feedback must follow initialization");
  validateOptionalAttemptResult(
    state.lastIntrinsicEscapeAttemptResult,
    "escape",
    escapeAttempts,
    acceptedTime,
  );
  if (
    state.lastIntrinsicEscapeAttemptResult !== null
    && !(state.lastIntrinsicEscapeAttemptResult.activationTimeSec > initialTime)
  ) throw new Error("runtime intrinsic escape attempt must follow initialization");
  if (
    state.lastVviPacingAttemptResult !== null
    && !(state.lastVviPacingAttemptResult.activationTimeSec > initialTime)
  ) throw new Error("runtime VVI pacing attempt must follow initialization");
  validateOptionalAttemptResult(
    state.lastVviPacingAttemptResult,
    "pacing",
    paceAttempts,
    acceptedTime,
  );
  const escapeResetTime = Math.max(
    state.initialCaptureSeed.activationTimeSec,
    state.lastAcceptedVentricularActivation?.activationTimeSec ?? -Infinity,
    state.lastIntrinsicEscapeAttemptResult?.activationTimeSec ?? -Infinity,
  );
  const vviResetTime = Math.max(
    state.initialCaptureSeed.activationTimeSec,
    state.lastAcceptedVentricularActivation?.activationTimeSec ?? -Infinity,
    state.lastVviPacingAttemptResult?.activationTimeSec ?? -Infinity,
  );
  if (
    nextEscape !== safeFutureTime(
      escapeResetTime,
      state.configuration.intrinsicEscapeCycleLengthSec,
      "state-derived intrinsic escape due time",
    )
    || nextVvi !== safeFutureTime(
      vviResetTime,
      state.configuration.vviLowerRateIntervalSec,
      "state-derived VVI due time",
    )
  ) throw new Error("ventricular backup due times do not match last reset lineage");
  if (revision === 0) {
    if (acceptedTime !== initialTime) throw new Error("unadvanced ventricular backup state changed time");
    const initialEscape = safeFutureTime(
      state.initialCaptureSeed.activationTimeSec,
      state.configuration.intrinsicEscapeCycleLengthSec,
      "initial intrinsic escape due time",
    );
    const initialVvi = safeFutureTime(
      state.initialCaptureSeed.activationTimeSec,
      state.configuration.vviLowerRateIntervalSec,
      "initial VVI due time",
    );
    if (
      nextEscape !== initialEscape
      || nextVvi !== initialVvi
      || escapeAttempts !== 0
      || paceAttempts !== 0
      || feedbackCount !== 0
    ) throw new Error("unadvanced ventricular backup state does not match initial seed");
  } else if (!(acceptedTime > initialTime)) {
    throw new Error("advanced ventricular backup state must advance time");
  }
  if (validationStampIssuanceEligibleV1(state)) {
    VALIDATED_VENTRICULAR_BACKUP_STATES_V2.add(state);
  }
}

function sourceImpulse(
  state: AcceptedVentricularBackupSourceStateV2,
  kind: "escape" | "pacing",
  sequence: number,
  activationTimeSec: number,
): SourceImpulseV2 {
  requireNonnegativeSafeInteger(sequence, `${kind} source sequence`);
  const sourceId = kind === "escape"
    ? state.configuration.intrinsicEscapeSourceId
    : state.configuration.vviPacingSourceId;
  return createSourceImpulseV2({
    sourceImpulseId: framedId(`ventricular-backup-${kind}-source-impulse-v2`, [
      state.configuration.configurationId,
      state.configuration.ownerInstanceId,
      sourceId,
      String(sequence),
    ]),
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: kind,
    sourceId,
    sourceSequence: sequence,
    activationTimeSec,
  });
}

function claimsVentricularBackupOwnerImpulseNamespace(
  proposal: VentricularBackupSourceProposalV2,
  kind: "escape" | "pacing",
  sourceImpulseId: string,
): boolean {
  const namespace = `ventricular-backup-${kind}-source-impulse-v2`;
  const ownerPrefix = `${framedId(namespace, [
    proposal.configurationId,
    proposal.ownerInstanceId,
  ])}:`;
  return sourceImpulseId.startsWith(ownerPrefix);
}

function attemptResult(
  impulse: SourceImpulseV2,
  capturedActivation: CapturedElectricalActivationV2 | null,
): VentricularBackupSourceAttemptResultV2 {
  if (impulse.sourceKind !== "escape" && impulse.sourceKind !== "pacing") {
    throw new Error("ventricular backup attempt source kind is invalid");
  }
  if (capturedActivation !== null) {
    assertActivationMatchesImpulseLineage(
      capturedActivation,
      impulse,
      "ventricular backup source attempt",
    );
  }
  return Object.freeze({
    resultSchemaId: VENTRICULAR_BACKUP_SOURCE_ATTEMPT_RESULT_V2_ID,
    schemaVersion: 2 as const,
    sourceImpulseId: impulse.sourceImpulseId,
    sourceKind: impulse.sourceKind,
    sourceId: impulse.sourceId,
    sourceSequence: impulse.sourceSequence,
    activationTimeSec: impulse.activationTimeSec,
    outcome: capturedActivation === null ? "not-captured" : "captured",
    capturedActivationId: capturedActivation?.capturedActivationId ?? null,
  });
}

function createInitialCaptureSeed(
  input: VentricularBackupInitialCaptureSeedInputV2,
): VentricularBackupInitialCaptureSeedV2 {
  const record = requirePlainRecord(input, "ventricular backup initial capture seed input");
  requireExactKeys(record, INITIAL_CAPTURE_INPUT_KEYS, "ventricular backup initial capture seed input");
  const sourceKind = requireVentricularSourceKind(input.sourceKind, "initial capture source kind");
  return Object.freeze({
    seedSchemaId: VENTRICULAR_BACKUP_INITIAL_CAPTURE_SEED_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: requireNonemptyString(input.capturedActivationId, "initial captured activation id"),
    parentSourceImpulseId: requireNonemptyString(input.parentSourceImpulseId, "initial parent source impulse id"),
    sourceKind,
    sourceId: requireNonemptyString(input.sourceId, "initial capture source id"),
    sourceSequence: requireNonnegativeSafeInteger(input.sourceSequence, "initial capture source sequence"),
    activationTimeSec: normalizeFinite(input.activationTimeSec, "initial capture activation time"),
  });
}

function validateInitialCaptureSeed(seed: VentricularBackupInitialCaptureSeedV2): void {
  const record = requirePlainRecord(seed, "ventricular backup initial capture seed");
  requireExactKeys(record, INITIAL_CAPTURE_KEYS, "ventricular backup initial capture seed");
  if (
    seed.seedSchemaId !== VENTRICULAR_BACKUP_INITIAL_CAPTURE_SEED_V2_ID
    || seed.schemaVersion !== 2
  ) throw new Error("ventricular backup initial capture seed schema is invalid");
  if (!Object.isFrozen(seed)) throw new Error("ventricular backup initial capture seed must be immutable");
  const rebuilt = createInitialCaptureSeed({
    capturedActivationId: seed.capturedActivationId,
    parentSourceImpulseId: seed.parentSourceImpulseId,
    sourceKind: seed.sourceKind,
    sourceId: seed.sourceId,
    sourceSequence: seed.sourceSequence,
    activationTimeSec: seed.activationTimeSec,
  });
  if (canonicalJsonStringify(seed) !== canonicalJsonStringify(rebuilt)) {
    throw new Error("ventricular backup initial capture seed is not canonical");
  }
}

function validateProposalEnvelope(proposal: VentricularBackupSourceProposalV2): void {
  const record = requirePlainRecord(proposal, "ventricular backup source proposal");
  requireExactKeys(record, PROPOSAL_KEYS, "ventricular backup source proposal");
  canonicalJsonStringify(record);
  if (
    proposal.proposalSchemaId !== VENTRICULAR_BACKUP_SOURCE_PROPOSAL_V2_ID
    || proposal.schemaVersion !== 2
    || proposal.compositionInstruction !== COMPOSITION_INSTRUCTION
  ) throw new Error("ventricular backup source proposal schema is invalid");
  requireNonemptyString(proposal.configurationId, "proposal configuration id");
  requireNonemptyString(proposal.ownerInstanceId, "proposal owner instance id");
  requireNonnegativeSafeInteger(proposal.baseRevision, "proposal base revision");
  requireNonnegativeFinite(proposal.startTimeSec, "proposal start time");
  requireNonnegativeFinite(proposal.candidateTimeSec, "proposal candidate time");
  if (!Array.isArray(proposal.sourceImpulsesForNonVviBatch)) {
    throw new Error("proposal non-VVI source impulses must be an array");
  }
  proposal.sourceImpulsesForNonVviBatch.forEach(validateSourceImpulseV2);
  if (proposal.conditionalVviPacingSourceImpulse !== null) {
    validateSourceImpulseV2(proposal.conditionalVviPacingSourceImpulse);
    if (
      proposal.conditionalVviPacingSourceImpulse.sourceImpulseId
        !== proposal.reservedConditionalVviPacingSourceImpulseId
    ) {
      throw new Error(
        "conditional VVI impulse does not match its reserved owner identity",
      );
    }
  }
  requireNonemptyString(
    proposal.reservedConditionalVviPacingSourceImpulseId,
    "reserved conditional VVI source impulse id",
  );
}

function validateResolutionEnvelope(resolution: VentricularBackupSourceResolutionV2): void {
  const record = requirePlainRecord(resolution, "ventricular backup source resolution");
  requireExactKeys(record, RESOLUTION_KEYS, "ventricular backup source resolution");
  canonicalJsonStringify(record);
  if (
    resolution.resolutionSchemaId !== VENTRICULAR_BACKUP_SOURCE_RESOLUTION_V2_ID
    || resolution.schemaVersion !== 2
  ) throw new Error("ventricular backup source resolution schema is invalid");
  if (!Array.isArray(resolution.sourceAttemptResults)) {
    throw new Error("ventricular backup source attempt results must be an array");
  }
  resolution.sourceAttemptResults.forEach((result) => validateAttemptResult(result));
}

function validateCandidateEnvelope(candidate: AcceptedVentricularBackupSourceCandidateV2): void {
  const record = requirePlainRecord(candidate, "accepted ventricular backup candidate");
  requireExactKeys(record, CANDIDATE_KEYS, "accepted ventricular backup candidate");
  canonicalJsonStringify(record);
  if (
    candidate.candidateSchemaId !== ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CANDIDATE_V2_ID
    || candidate.schemaVersion !== 2
  ) throw new Error("accepted ventricular backup candidate schema is invalid");
  validateProposalEnvelope(candidate.proposal);
  validateResolutionEnvelope(candidate.resolution);
  validateAcceptedVentricularBackupSourceStateV2(candidate.candidateState);
}

function validateAttemptResult(result: VentricularBackupSourceAttemptResultV2): void {
  const record = requirePlainRecord(result, "ventricular backup source attempt result");
  requireExactKeys(record, ATTEMPT_RESULT_KEYS, "ventricular backup source attempt result");
  if (
    result.resultSchemaId !== VENTRICULAR_BACKUP_SOURCE_ATTEMPT_RESULT_V2_ID
    || result.schemaVersion !== 2
  ) throw new Error("ventricular backup source attempt result schema is invalid");
  if (result.sourceKind !== "escape" && result.sourceKind !== "pacing") {
    throw new Error("ventricular backup source attempt result kind is invalid");
  }
  requireNonemptyString(result.sourceImpulseId, "attempt result source impulse id");
  requireNonemptyString(result.sourceId, "attempt result source id");
  requireNonnegativeSafeInteger(result.sourceSequence, "attempt result source sequence");
  requireNonnegativeFinite(result.activationTimeSec, "attempt result activation time");
  if (result.outcome !== "captured" && result.outcome !== "not-captured") {
    throw new Error("ventricular backup source attempt result outcome is invalid");
  }
  const captureId = requireNullableNonemptyString(
    result.capturedActivationId,
    "attempt result captured activation id",
  );
  if ((captureId === null) !== (result.outcome === "not-captured")) {
    throw new Error("attempt result capture lineage does not match outcome");
  }
}

function validateOptionalAttemptResult(
  result: VentricularBackupSourceAttemptResultV2 | null,
  kind: "escape" | "pacing",
  count: number,
  acceptedTimeSec: number,
): void {
  if ((result === null) !== (count === 0)) {
    throw new Error(`last ${kind} attempt result must agree with attempt count`);
  }
  if (result === null) return;
  if (!Object.isFrozen(result)) throw new Error(`last ${kind} attempt result must be immutable`);
  validateAttemptResult(result);
  if (result.sourceKind !== kind || result.sourceSequence !== count - 1) {
    throw new Error(`last ${kind} attempt result does not match source counter`);
  }
  if (result.activationTimeSec > acceptedTimeSec) {
    throw new Error(`last ${kind} attempt result follows accepted time`);
  }
}

function copyOptionalCapturedActivation(
  activation: CapturedElectricalActivationV2 | null,
  candidateTimeSec: number,
  field: string,
): CapturedElectricalActivationV2 | null {
  if (activation === null) return null;
  validateCapturedActivation(activation, field);
  if (activation.activationTimeSec !== candidateTimeSec) {
    throw new Error(`${field} must occur exactly at candidate time`);
  }
  return Object.freeze({ ...activation });
}

function validateOptionalCapturedActivation(
  activation: CapturedElectricalActivationV2 | null,
  maximumTimeSec: number,
  field: string,
  requireFrozen: boolean,
): void {
  if (activation === null) return;
  validateCapturedActivation(activation, field);
  if (requireFrozen && !Object.isFrozen(activation)) {
    throw new Error(`${field} must be immutable`);
  }
  if (activation.activationTimeSec > maximumTimeSec) {
    throw new Error(`${field} follows accepted owner time`);
  }
}

function validateCapturedActivation(
  activation: CapturedElectricalActivationV2,
  field: string,
): void {
  const record = requirePlainRecord(activation, field);
  requireExactKeys(record, CAPTURED_ACTIVATION_KEYS, field);
  canonicalJsonStringify(record);
  if (
    activation.activationSchemaId !== CAPTURED_ELECTRICAL_ACTIVATION_V2_ID
    || activation.schemaVersion !== 2
    || activation.chamber !== "ventricular"
  ) throw new Error(`${field} schema or chamber is invalid`);
  requireNonemptyString(activation.capturedActivationId, `${field} captured activation id`);
  requireNonemptyString(activation.parentSourceImpulseId, `${field} parent source impulse id`);
  requireNullableNonemptyString(activation.upstreamCapturedActivationId, `${field} upstream activation id`);
  requireNonemptyString(activation.gateInstanceId, `${field} gate instance id`);
  requireNonnegativeFinite(activation.activationTimeSec, `${field} activation time`);
  const sourceKind = requireVentricularSourceKind(activation.sourceKind, `${field} source kind`);
  requireNonemptyString(activation.sourceId, `${field} source id`);
  requireNonnegativeSafeInteger(activation.sourceSequence, `${field} source sequence`);
  if (activation.capturePriority !== ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind]) {
    throw new Error(`${field} capture priority does not match source kind`);
  }
  if (!Number.isSafeInteger(activation.captureOrdinal) || activation.captureOrdinal < 1) {
    throw new Error(`${field} capture ordinal must be a positive safe integer`);
  }
  if (!Number.isSafeInteger(activation.ownerRevision) || activation.ownerRevision < 1) {
    throw new Error(`${field} owner revision must be a positive safe integer`);
  }
  if (sourceKind === "av-output" && activation.upstreamCapturedActivationId === null) {
    throw new Error(`${field} AV output requires upstream atrial lineage`);
  }
}

function assertActivationMatchesImpulseLineage(
  activation: CapturedElectricalActivationV2,
  impulse: SourceImpulseV2,
  field: string,
): void {
  if (
    activation.parentSourceImpulseId !== impulse.sourceImpulseId
    || activation.chamber !== impulse.chamber
    || activation.sourceKind !== impulse.sourceKind
    || activation.sourceId !== impulse.sourceId
    || activation.sourceSequence !== impulse.sourceSequence
    || activation.activationTimeSec !== impulse.activationTimeSec
    || activation.capturePriority !== impulse.capturePriority
    || activation.upstreamCapturedActivationId
      !== impulse.parentCapturedActivationId
  ) throw new Error(`${field} does not match source-impulse lineage`);
}

function copyConfiguration(
  configuration: AcceptedVentricularBackupSourceConfigurationV2,
): AcceptedVentricularBackupSourceConfigurationV2 {
  validateAcceptedVentricularBackupSourceConfigurationV2(configuration);
  return createAcceptedVentricularBackupSourceConfigurationV2({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    intrinsicEscapeSourceId: configuration.intrinsicEscapeSourceId,
    intrinsicEscapeCycleLengthSec: configuration.intrinsicEscapeCycleLengthSec,
    vviPacingSourceId: configuration.vviPacingSourceId,
    vviLowerRateLimitPerMin: configuration.vviLowerRateLimitPerMin,
  });
}

function requireVentricularSourceKind(
  value: unknown,
  field: string,
): Exclude<ElectricalImpulseSourceKindV2, "primary-intrinsic"> {
  if (
    value !== "authored-ectopy"
    && value !== "av-output"
    && value !== "pacing"
    && value !== "escape"
  ) throw new Error(`${field} is not a ventricular source kind`);
  return value;
}

function requireProvenanceKind(value: unknown): VentricularBackupParameterProvenanceKindV2 {
  if (value !== "authored" && value !== "literature-construction") {
    throw new Error("ventricular backup parameter provenance kind is invalid");
  }
  return value;
}

function safeCounterAdd(value: number, increment: 0 | 1, field: string): number {
  requireNonnegativeSafeInteger(value, field);
  const result = value + increment;
  if (!Number.isSafeInteger(result)) throw new Error(`${field} cannot be incremented safely`);
  return result;
}

function safeFutureTime(timeSec: number, intervalSec: number, field: string): number {
  const result = timeSec + intervalSec;
  if (!Number.isFinite(result) || !(result > timeSec)) {
    throw new Error(`${field} must advance to a finite time`);
  }
  return Object.is(result, -0) ? 0 : result;
}

function framedId(prefix: string, fields: readonly string[]): string {
  return `${prefix}:${fields.map((field) => `${field.length}:${field}`).join(":")}`;
}

function normalizeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  return Object.is(finite, -0) ? 0 : finite;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return Object.is(finite, -0) ? 0 : finite;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireNullableNonemptyString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return requireNonemptyString(value, field);
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
  const actual = Object.keys(value).sort(compareCodeUnit);
  const required = [...expected].sort(compareCodeUnit);
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) throw new Error(`${field} keys are invalid`);
}

function compareCodeUnit(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

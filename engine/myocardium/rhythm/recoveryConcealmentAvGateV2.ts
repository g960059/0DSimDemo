import { canonicalJsonStringify } from "@/engine/integrity";

/**
 * Accepted proximal-AV recovery/concealment owner.
 *
 * The owner consumes one externally ordered atrial activation and may propose
 * one strictly-future proximal AV output. That output is not ventricular
 * activation; distal conduction and ventricular capture remain downstream.
 */

export const RECOVERY_CONCEALMENT_AV_GATE_V2_ID =
  "recovery-concealment-proximal-av-owner-v2" as const;
export const RECOVERY_CONCEALMENT_AV_GATE_CONFIGURATION_V2_ID =
  "recovery-concealment-proximal-av-owner-configuration-v2" as const;
export const RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V2_ID =
  "recovery-concealment-proximal-av-owner-provenance-v2" as const;
export const RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID =
  "accepted-recovery-concealment-proximal-av-owner-state-v2" as const;
export const RECOVERY_CONCEALMENT_AV_GATE_DECISION_V2_ID =
  "recovery-concealment-proximal-av-owner-candidate-decision-v2" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM = deepFreeze({
  scope: "isolated-accepted-proximal-av-recovery-concealment-owner" as const,
  input:
    "one-externally-ordered-accepted-atrial-activation" as const,
  acceptedClock:
    "accepted-atrial-activation-time-not-future-proximal-av-output-time" as const,
  acceptedClockOrdering:
    "monotone-non-decreasing-with-externally-ordered-coincident-inputs" as const,
  proximalAvReadinessCriterion:
    "atrial-activation-time-greater-than-or-equal-to-proximal-av-refractory-until" as const,
  proximalAvBlockingCriterion:
    "atrial-activation-time-strictly-less-than-proximal-av-refractory-until" as const,
  exactBoundaryEqualityConducts: true as const,
  physiologicalComparisonToleranceUsed: false as const,
  delayEquation:
    "D=Dmin+alpha*exp(-recovery-beyond-proximal-av-refractory/tau)" as const,
  initiallyFullyRecoveredDelay: "Dmin" as const,
  conductedProximalAvOutputEquation:
    "proximalAvOutputTime=A+D" as const,
  conductedRefractoryUpdate:
    "proximalAvRefractoryUntil=proximalAvOutputTime+theta" as const,
  concealedRefractoryUpdate:
    "proximalAvRefractoryUntil=previous-proximalAvRefractoryUntil+delta-c" as const,
  concealmentSimplification:
    "constant-delta-c-independent-of-blocked-activation-timing" as const,
  conductedOutputStrictlyFutureOfAtrialInput: true as const,
  outputSemantics:
    "proximal-av-output-proposal-not-ventricular-activation" as const,
  completeConfigurationBinding:
    "embedded-recursively-immutable-canonical-content-not-id-only" as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-canonical-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
  v1EquationAndDecisionShadowCompatibility:
    "matched-explicit-inputs-with-semantic-name-remapping-only" as const,
  parameterDefaultsProvided: false as const,
  rhythmGeneratorClaimed: false as const,
  ventricularActivationClaimed: false as const,
  hisPurkinjePhysiologyClaimed: false as const,
  wholeAvNodePhysiologyClaimed: false as const,
  concealmentConsensusClaimed: false as const,
  jorgensenEndToEndReproductionClaimed: false as const,
  atrialFibrillationClaimed: false as const,
  patientCalibrationClaimed: false as const,
  clinicalValidityClaimed: false as const,
});

export type RecoveryConcealmentAvGateProvenanceKindV2 =
  | "explicit-research-parameters"
  | "literature-component-reproduction";

export type RecoveryConcealmentAvGateProvenanceInputV2 = Readonly<{
  kind: RecoveryConcealmentAvGateProvenanceKindV2;
  sourceId: string;
}>;

export type RecoveryConcealmentAvGateProvenanceV2 = Readonly<{
  provenanceSchemaId:
    typeof RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V2_ID;
  schemaVersion: 2;
  kind: RecoveryConcealmentAvGateProvenanceKindV2;
  sourceId: string;
}>;

export type RecoveryConcealmentAvGateConfigurationInputV2 = Readonly<{
  configurationId: string;
  proximalAvOwnerInstanceId: string;
  parameterProvenance: RecoveryConcealmentAvGateProvenanceInputV2;
  /** Dmin: asymptotic fully recovered atrial-to-proximal-AV-output delay. */
  minimumProximalAvConductionDelaySec: number;
  /** alpha: recovery-dependent proximal-AV delay amplitude. */
  proximalAvRecoveryDelayAmplitudeSec: number;
  /** tau: recovery time constant. */
  proximalAvRecoveryTimeConstantSec: number;
  /** theta: refractory duration beginning at the proximal AV output. */
  postProximalAvOutputRefractorySec: number;
  /** delta_c: refractory extension after a concealed blocked input. */
  concealedProximalAvRefractoryExtensionSec: number;
}>;

export type RecoveryConcealmentAvGateConfigurationV2 = Readonly<{
  configurationSchemaId:
    typeof RECOVERY_CONCEALMENT_AV_GATE_CONFIGURATION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  proximalAvOwnerInstanceId: string;
  parameterProvenance: RecoveryConcealmentAvGateProvenanceV2;
  minimumProximalAvConductionDelaySec: number;
  proximalAvRecoveryDelayAmplitudeSec: number;
  proximalAvRecoveryTimeConstantSec: number;
  postProximalAvOutputRefractorySec: number;
  concealedProximalAvRefractoryExtensionSec: number;
}>;

export type RecoveryConcealmentAvGateInitialStateInputV2 = Readonly<{
  /** Signed finite clock of the fully recovered input owner. */
  acceptedAtrialActivationTimeSec: number;
}>;

export type RecoveryConcealmentAvGateAcceptedStateV2 = Readonly<{
  stateSchemaId: typeof RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID;
  schemaVersion: 2;
  configuration: RecoveryConcealmentAvGateConfigurationV2;
  initialAcceptedAtrialActivationTimeSec: number;
  revision: number;
  /** Last accepted input time; never advanced to a future AV output. */
  acceptedAtrialActivationTimeSec: number;
  acceptedAtrialActivationCount: number;
  conductedAtrialActivationCount: number;
  blockedAtrialActivationCount: number;
  hasPriorProximalAvOutput: boolean;
  /** Absolute input-readiness boundary; exact equality conducts. */
  proximalAvRefractoryUntilSec: number;
  lastConductedAtrialActivationTimeSec: number | null;
  /** AV-node boundary output, explicitly not ventricular activation. */
  lastProximalAvOutputTimeSec: number | null;
}>;

export type RecoveryConcealmentAvGateActivationInputV2 = Readonly<{
  atrialActivationId: string;
  atrialActivationTimeSec: number;
}>;

export type RecoveryConcealmentAvGateOutcomeV2 = "conducted" | "blocked";

export type RecoveryConcealmentAvGateCandidateDecisionV2 = Readonly<{
  decisionSchemaId: typeof RECOVERY_CONCEALMENT_AV_GATE_DECISION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  proximalAvOwnerInstanceId: string;
  atrialActivationId: string;
  atrialActivationOrdinal: number;
  baseRevision: number;
  candidateRevision: number;
  atrialActivationTimeSec: number;
  proximalAvRefractoryUntilBeforeSec: number;
  outcome: RecoveryConcealmentAvGateOutcomeV2;
  conductedToProximalAvOutput: boolean;
  /** Null for the deliberately fully recovered first conduction or a block. */
  recoveryBeyondProximalAvRefractorySec: number | null;
  proximalAvConductionDelaySec: number | null;
  /** Strictly future when conducted; null when blocked. */
  proximalAvOutputTimeSec: number | null;
  proximalAvRefractoryUntilAfterSec: number;
  candidateState: RecoveryConcealmentAvGateAcceptedStateV2;
}>;

const PROVENANCE_INPUT_KEYS = Object.freeze(["kind", "sourceId"] as const);
const PROVENANCE_KEYS = Object.freeze([
  "provenanceSchemaId",
  "schemaVersion",
  ...PROVENANCE_INPUT_KEYS,
] as const);
const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "proximalAvOwnerInstanceId",
  "parameterProvenance",
  "minimumProximalAvConductionDelaySec",
  "proximalAvRecoveryDelayAmplitudeSec",
  "proximalAvRecoveryTimeConstantSec",
  "postProximalAvOutputRefractorySec",
  "concealedProximalAvRefractoryExtensionSec",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  ...CONFIGURATION_INPUT_KEYS,
] as const);
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initialAcceptedAtrialActivationTimeSec",
  "revision",
  "acceptedAtrialActivationTimeSec",
  "acceptedAtrialActivationCount",
  "conductedAtrialActivationCount",
  "blockedAtrialActivationCount",
  "hasPriorProximalAvOutput",
  "proximalAvRefractoryUntilSec",
  "lastConductedAtrialActivationTimeSec",
  "lastProximalAvOutputTimeSec",
] as const);
const ACTIVATION_INPUT_KEYS = Object.freeze([
  "atrialActivationId",
  "atrialActivationTimeSec",
] as const);
const DECISION_KEYS = Object.freeze([
  "decisionSchemaId",
  "schemaVersion",
  "configurationId",
  "proximalAvOwnerInstanceId",
  "atrialActivationId",
  "atrialActivationOrdinal",
  "baseRevision",
  "candidateRevision",
  "atrialActivationTimeSec",
  "proximalAvRefractoryUntilBeforeSec",
  "outcome",
  "conductedToProximalAvOutput",
  "recoveryBeyondProximalAvRefractorySec",
  "proximalAvConductionDelaySec",
  "proximalAvOutputTimeSec",
  "proximalAvRefractoryUntilAfterSec",
  "candidateState",
] as const);

export function createRecoveryConcealmentAvGateConfigurationV2(
  input: RecoveryConcealmentAvGateConfigurationInputV2,
): RecoveryConcealmentAvGateConfigurationV2 {
  const record = requirePlainRecord(input, "proximal AV configuration input");
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "proximal AV configuration input",
  );
  return deepFreeze({
    configurationSchemaId:
      RECOVERY_CONCEALMENT_AV_GATE_CONFIGURATION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "proximal AV configuration input.configurationId",
    ),
    proximalAvOwnerInstanceId: requireNonemptyString(
      input.proximalAvOwnerInstanceId,
      "proximal AV configuration input.proximalAvOwnerInstanceId",
    ),
    parameterProvenance: copyProvenanceInput(input.parameterProvenance),
    minimumProximalAvConductionDelaySec: requirePositiveFinite(
      input.minimumProximalAvConductionDelaySec,
      "proximal AV configuration input.minimumProximalAvConductionDelaySec",
    ),
    proximalAvRecoveryDelayAmplitudeSec: requireNonnegativeFinite(
      input.proximalAvRecoveryDelayAmplitudeSec,
      "proximal AV configuration input.proximalAvRecoveryDelayAmplitudeSec",
    ),
    proximalAvRecoveryTimeConstantSec: requirePositiveFinite(
      input.proximalAvRecoveryTimeConstantSec,
      "proximal AV configuration input.proximalAvRecoveryTimeConstantSec",
    ),
    postProximalAvOutputRefractorySec: requirePositiveFinite(
      input.postProximalAvOutputRefractorySec,
      "proximal AV configuration input.postProximalAvOutputRefractorySec",
    ),
    concealedProximalAvRefractoryExtensionSec: requireNonnegativeFinite(
      input.concealedProximalAvRefractoryExtensionSec,
      "proximal AV configuration input.concealedProximalAvRefractoryExtensionSec",
    ),
  });
}

export function initializeRecoveryConcealmentAvGateStateV2(
  configuration: RecoveryConcealmentAvGateConfigurationV2,
  input: RecoveryConcealmentAvGateInitialStateInputV2,
): RecoveryConcealmentAvGateAcceptedStateV2 {
  const ownedConfiguration = detachedValidatedConfiguration(configuration);
  const record = requirePlainRecord(input, "proximal AV initial state input");
  requireExactKeys(
    record,
    ["acceptedAtrialActivationTimeSec"],
    "proximal AV initial state input",
  );
  const acceptedTime = requireFinite(
    input.acceptedAtrialActivationTimeSec,
    "proximal AV initial accepted atrial activation time",
  );
  return Object.freeze({
    stateSchemaId: RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: ownedConfiguration,
    initialAcceptedAtrialActivationTimeSec: acceptedTime,
    revision: 0,
    acceptedAtrialActivationTimeSec: acceptedTime,
    acceptedAtrialActivationCount: 0,
    conductedAtrialActivationCount: 0,
    blockedAtrialActivationCount: 0,
    hasPriorProximalAvOutput: false,
    proximalAvRefractoryUntilSec: acceptedTime,
    lastConductedAtrialActivationTimeSec: null,
    lastProximalAvOutputTimeSec: null,
  });
}

/** Pure candidate evaluation; the accepted state is never mutated. */
export function evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV2,
  input: RecoveryConcealmentAvGateActivationInputV2,
): RecoveryConcealmentAvGateCandidateDecisionV2 {
  validateRecoveryConcealmentAvGateStateV2(acceptedState);
  const record = requirePlainRecord(input, "proximal AV activation input");
  requireExactKeys(record, ACTIVATION_INPUT_KEYS, "proximal AV activation input");
  const atrialActivationId = requireNonemptyString(
    input.atrialActivationId,
    "proximal AV activation input.atrialActivationId",
  );
  const atrialActivationTimeSec = requireFinite(
    input.atrialActivationTimeSec,
    "proximal AV activation input.atrialActivationTimeSec",
  );
  if (atrialActivationTimeSec
      < acceptedState.acceptedAtrialActivationTimeSec) {
    throw new Error(
      "atrial activation time must be monotone non-decreasing in accepted input time",
    );
  }
  requireIncrementable(acceptedState.revision, "proximal AV state revision");
  requireIncrementable(
    acceptedState.acceptedAtrialActivationCount,
    "accepted atrial activation count",
  );
  return buildCandidateDecision(
    acceptedState,
    atrialActivationId,
    atrialActivationTimeSec,
  );
}

/** Exact canonical recomputation binds the candidate to the complete base. */
export function commitRecoveryConcealmentAvGateCandidateDecisionV2(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV2,
  candidate: RecoveryConcealmentAvGateCandidateDecisionV2,
): RecoveryConcealmentAvGateAcceptedStateV2 {
  validateRecoveryConcealmentAvGateStateV2(acceptedState);
  validateRecoveryConcealmentAvGateCandidateDecisionV2(candidate);
  const expected = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
    acceptedState,
    {
      atrialActivationId: candidate.atrialActivationId,
      atrialActivationTimeSec: candidate.atrialActivationTimeSec,
    },
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "proximal AV candidate does not match its complete accepted base",
    );
  }
  return expected.candidateState;
}

/** Validates the trial and returns the original accepted object identity. */
export function rollbackRecoveryConcealmentAvGateCandidateDecisionV2(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV2,
  candidate: RecoveryConcealmentAvGateCandidateDecisionV2,
): RecoveryConcealmentAvGateAcceptedStateV2 {
  validateRecoveryConcealmentAvGateStateV2(acceptedState);
  validateRecoveryConcealmentAvGateCandidateDecisionV2(candidate);
  const expected = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
    acceptedState,
    {
      atrialActivationId: candidate.atrialActivationId,
      atrialActivationTimeSec: candidate.atrialActivationTimeSec,
    },
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "proximal AV candidate does not match its complete accepted base",
    );
  }
  return acceptedState;
}

export function validateRecoveryConcealmentAvGateConfigurationV2(
  configuration: RecoveryConcealmentAvGateConfigurationV2,
): void {
  const record = requirePlainRecord(configuration, "proximal AV configuration");
  requireExactKeys(record, CONFIGURATION_KEYS, "proximal AV configuration");
  if (configuration.configurationSchemaId
      !== RECOVERY_CONCEALMENT_AV_GATE_CONFIGURATION_V2_ID
    || configuration.schemaVersion !== 2) {
    throw new Error("proximal AV configuration schema is invalid");
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(
    configuration.proximalAvOwnerInstanceId,
    "proximal AV owner instance id",
  );
  validateProvenance(configuration.parameterProvenance);
  requirePositiveFinite(
    configuration.minimumProximalAvConductionDelaySec,
    "minimum proximal AV conduction delay",
  );
  requireNonnegativeFinite(
    configuration.proximalAvRecoveryDelayAmplitudeSec,
    "proximal AV recovery delay amplitude",
  );
  requirePositiveFinite(
    configuration.proximalAvRecoveryTimeConstantSec,
    "proximal AV recovery time constant",
  );
  requirePositiveFinite(
    configuration.postProximalAvOutputRefractorySec,
    "post-proximal-AV-output refractory duration",
  );
  requireNonnegativeFinite(
    configuration.concealedProximalAvRefractoryExtensionSec,
    "concealed proximal AV refractory extension",
  );
}

export function validateRecoveryConcealmentAvGateStateV2(
  state: RecoveryConcealmentAvGateAcceptedStateV2,
): void {
  const record = requirePlainRecord(state, "accepted proximal AV state");
  requireExactKeys(record, STATE_KEYS, "accepted proximal AV state");
  if (state.stateSchemaId !== RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID
    || state.schemaVersion !== 2) {
    throw new Error("accepted proximal AV state schema is invalid");
  }
  validateRecoveryConcealmentAvGateConfigurationV2(state.configuration);
  const initialTime = requireFinite(
    state.initialAcceptedAtrialActivationTimeSec,
    "initial accepted atrial activation time",
  );
  const acceptedTime = requireFinite(
    state.acceptedAtrialActivationTimeSec,
    "accepted atrial activation time",
  );
  if (acceptedTime < initialTime) {
    throw new Error("accepted atrial activation time precedes its initial clock");
  }
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "proximal AV state revision",
  );
  const acceptedCount = requireNonnegativeSafeInteger(
    state.acceptedAtrialActivationCount,
    "accepted atrial activation count",
  );
  const conductedCount = requireNonnegativeSafeInteger(
    state.conductedAtrialActivationCount,
    "conducted atrial activation count",
  );
  const blockedCount = requireNonnegativeSafeInteger(
    state.blockedAtrialActivationCount,
    "blocked atrial activation count",
  );
  if (revision !== acceptedCount) {
    throw new Error("state revision must equal accepted atrial activation count");
  }
  if (conductedCount + blockedCount !== acceptedCount) {
    throw new Error("proximal AV outcome counters must sum to accepted count");
  }
  if (acceptedCount === 0 && acceptedTime !== initialTime) {
    throw new Error("an unprocessed proximal AV owner retains its initial clock");
  }
  if (typeof state.hasPriorProximalAvOutput !== "boolean"
    || state.hasPriorProximalAvOutput !== (conductedCount > 0)) {
    throw new Error(
      "hasPriorProximalAvOutput must agree with the conducted count",
    );
  }
  const refractoryUntil = requireFinite(
    state.proximalAvRefractoryUntilSec,
    "proximal AV refractory boundary",
  );
  if (!state.hasPriorProximalAvOutput) {
    if (acceptedCount !== 0
      || state.lastConductedAtrialActivationTimeSec !== null
      || state.lastProximalAvOutputTimeSec !== null
      || refractoryUntil !== initialTime) {
      throw new Error("fully recovered proximal AV initial state is inconsistent");
    }
    return;
  }
  const lastAtrial = requireFinite(
    state.lastConductedAtrialActivationTimeSec,
    "last conducted atrial activation time",
  );
  const lastOutput = requireFinite(
    state.lastProximalAvOutputTimeSec,
    "last proximal AV output time",
  );
  if (lastAtrial > acceptedTime) {
    throw new Error("last conducted atrial activation exceeds accepted clock");
  }
  if (!(lastOutput > lastAtrial)) {
    throw new Error("proximal AV output must be strictly future of its atrial input");
  }
  const minimumRefractoryUntil = lastOutput
    + state.configuration.postProximalAvOutputRefractorySec;
  requireComputedFinite(minimumRefractoryUntil, "minimum refractory boundary");
  if (refractoryUntil < minimumRefractoryUntil) {
    throw new Error("proximal AV refractory boundary precedes conducted update");
  }
}

export function validateRecoveryConcealmentAvGateCandidateDecisionV2(
  candidate: RecoveryConcealmentAvGateCandidateDecisionV2,
): void {
  const record = requirePlainRecord(candidate, "proximal AV candidate decision");
  requireExactKeys(record, DECISION_KEYS, "proximal AV candidate decision");
  if (candidate.decisionSchemaId
      !== RECOVERY_CONCEALMENT_AV_GATE_DECISION_V2_ID
    || candidate.schemaVersion !== 2) {
    throw new Error("proximal AV candidate decision schema is invalid");
  }
  requireNonemptyString(candidate.configurationId, "candidate configuration id");
  requireNonemptyString(
    candidate.proximalAvOwnerInstanceId,
    "candidate proximal AV owner instance id",
  );
  requireNonemptyString(
    candidate.atrialActivationId,
    "candidate atrial activation id",
  );
  requirePositiveSafeInteger(
    candidate.atrialActivationOrdinal,
    "candidate atrial activation ordinal",
  );
  requireNonnegativeSafeInteger(candidate.baseRevision, "candidate base revision");
  requirePositiveSafeInteger(
    candidate.candidateRevision,
    "candidate revision",
  );
  requireFinite(candidate.atrialActivationTimeSec, "candidate atrial input time");
  requireFinite(
    candidate.proximalAvRefractoryUntilBeforeSec,
    "candidate refractory boundary before",
  );
  requireFinite(
    candidate.proximalAvRefractoryUntilAfterSec,
    "candidate refractory boundary after",
  );
  if (candidate.outcome !== "conducted" && candidate.outcome !== "blocked") {
    throw new Error("candidate outcome must be conducted or blocked");
  }
  if (typeof candidate.conductedToProximalAvOutput !== "boolean"
    || candidate.conductedToProximalAvOutput
      !== (candidate.outcome === "conducted")) {
    throw new Error("candidate conduction flag and outcome differ");
  }
  requireNullableNonnegativeFinite(
    candidate.recoveryBeyondProximalAvRefractorySec,
    "candidate recovery beyond refractory",
  );
  requireNullablePositiveFinite(
    candidate.proximalAvConductionDelaySec,
    "candidate proximal AV conduction delay",
  );
  requireNullableFinite(
    candidate.proximalAvOutputTimeSec,
    "candidate proximal AV output time",
  );
  if (candidate.conductedToProximalAvOutput) {
    if (candidate.proximalAvConductionDelaySec === null
      || candidate.proximalAvOutputTimeSec === null
      || !(candidate.proximalAvOutputTimeSec
        > candidate.atrialActivationTimeSec)) {
      throw new Error("conducted candidate requires a strictly-future AV output");
    }
  } else if (candidate.proximalAvConductionDelaySec !== null
    || candidate.proximalAvOutputTimeSec !== null
    || candidate.recoveryBeyondProximalAvRefractorySec !== null) {
    throw new Error("blocked candidate cannot own conducted-output fields");
  }
  validateRecoveryConcealmentAvGateStateV2(candidate.candidateState);
  const configuration = candidate.candidateState.configuration;
  if (candidate.configurationId !== configuration.configurationId
    || candidate.proximalAvOwnerInstanceId
      !== configuration.proximalAvOwnerInstanceId) {
    throw new Error("candidate top-level and complete configuration binding differ");
  }
  if (candidate.candidateRevision !== candidate.baseRevision + 1
    || candidate.candidateState.revision !== candidate.candidateRevision
    || candidate.candidateState.acceptedAtrialActivationCount
      !== candidate.atrialActivationOrdinal
    || candidate.candidateState.acceptedAtrialActivationTimeSec
      !== candidate.atrialActivationTimeSec
    || candidate.candidateState.proximalAvRefractoryUntilSec
      !== candidate.proximalAvRefractoryUntilAfterSec) {
    throw new Error("candidate outer and accepted-state clocks differ");
  }
  if (candidate.conductedToProximalAvOutput) {
    const expectedOutput = candidate.atrialActivationTimeSec
      + candidate.proximalAvConductionDelaySec!;
    const expectedRefractory = candidate.proximalAvOutputTimeSec!
      + configuration.postProximalAvOutputRefractorySec;
    const firstConduction = candidate.candidateState
      .conductedAtrialActivationCount === 1;
    const expectedRecovery = firstConduction
      ? null
      : candidate.atrialActivationTimeSec
        - candidate.proximalAvRefractoryUntilBeforeSec;
    const expectedDelay = firstConduction
      ? configuration.minimumProximalAvConductionDelaySec
      : configuration.minimumProximalAvConductionDelaySec
        + configuration.proximalAvRecoveryDelayAmplitudeSec * Math.exp(
          -expectedRecovery!
            / configuration.proximalAvRecoveryTimeConstantSec,
        );
    if (candidate.proximalAvOutputTimeSec !== expectedOutput
      || candidate.proximalAvRefractoryUntilAfterSec !== expectedRefractory
      || candidate.recoveryBeyondProximalAvRefractorySec !== expectedRecovery
      || candidate.proximalAvConductionDelaySec !== expectedDelay) {
      throw new Error("conducted candidate proximal AV equations are inconsistent");
    }
  } else {
    const expectedRefractory = candidate.proximalAvRefractoryUntilBeforeSec
      + configuration.concealedProximalAvRefractoryExtensionSec;
    if (candidate.proximalAvRefractoryUntilAfterSec !== expectedRefractory) {
      throw new Error("blocked candidate concealed refractory update differs");
    }
  }
}

function buildCandidateDecision(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV2,
  atrialActivationId: string,
  atrialActivationTimeSec: number,
): RecoveryConcealmentAvGateCandidateDecisionV2 {
  const configuration = acceptedState.configuration;
  const conducted = atrialActivationTimeSec
    >= acceptedState.proximalAvRefractoryUntilSec;
  const candidateRevision = acceptedState.revision + 1;
  let recoveryBeyondRefractory: number | null = null;
  let delay: number | null = null;
  let proximalAvOutputTime: number | null = null;
  let refractoryUntilAfter: number;

  if (conducted) {
    if (!acceptedState.hasPriorProximalAvOutput) {
      delay = configuration.minimumProximalAvConductionDelaySec;
    } else {
      recoveryBeyondRefractory = atrialActivationTimeSec
        - acceptedState.proximalAvRefractoryUntilSec;
      delay = configuration.minimumProximalAvConductionDelaySec
        + configuration.proximalAvRecoveryDelayAmplitudeSec * Math.exp(
          -recoveryBeyondRefractory
            / configuration.proximalAvRecoveryTimeConstantSec,
        );
    }
    requireComputedPositiveFinite(delay, "computed proximal AV delay");
    proximalAvOutputTime = atrialActivationTimeSec + delay;
    requireComputedFinite(proximalAvOutputTime, "computed proximal AV output");
    if (!(proximalAvOutputTime > atrialActivationTimeSec)) {
      throw new Error("computed proximal AV output is not strictly future");
    }
    refractoryUntilAfter = proximalAvOutputTime
      + configuration.postProximalAvOutputRefractorySec;
  } else {
    refractoryUntilAfter = acceptedState.proximalAvRefractoryUntilSec
      + configuration.concealedProximalAvRefractoryExtensionSec;
  }
  requireComputedFinite(refractoryUntilAfter, "computed refractory boundary");

  const candidateState = deepFreeze({
    stateSchemaId: RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration,
    initialAcceptedAtrialActivationTimeSec:
      acceptedState.initialAcceptedAtrialActivationTimeSec,
    revision: candidateRevision,
    acceptedAtrialActivationTimeSec: atrialActivationTimeSec,
    acceptedAtrialActivationCount:
      acceptedState.acceptedAtrialActivationCount + 1,
    conductedAtrialActivationCount:
      acceptedState.conductedAtrialActivationCount + (conducted ? 1 : 0),
    blockedAtrialActivationCount:
      acceptedState.blockedAtrialActivationCount + (conducted ? 0 : 1),
    hasPriorProximalAvOutput:
      acceptedState.hasPriorProximalAvOutput || conducted,
    proximalAvRefractoryUntilSec: refractoryUntilAfter,
    lastConductedAtrialActivationTimeSec: conducted
      ? atrialActivationTimeSec
      : acceptedState.lastConductedAtrialActivationTimeSec,
    lastProximalAvOutputTimeSec: conducted
      ? proximalAvOutputTime
      : acceptedState.lastProximalAvOutputTimeSec,
  }) satisfies RecoveryConcealmentAvGateAcceptedStateV2;

  return deepFreeze({
    decisionSchemaId: RECOVERY_CONCEALMENT_AV_GATE_DECISION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: configuration.configurationId,
    proximalAvOwnerInstanceId: configuration.proximalAvOwnerInstanceId,
    atrialActivationId,
    atrialActivationOrdinal: candidateState.acceptedAtrialActivationCount,
    baseRevision: acceptedState.revision,
    candidateRevision,
    atrialActivationTimeSec,
    proximalAvRefractoryUntilBeforeSec:
      acceptedState.proximalAvRefractoryUntilSec,
    outcome: conducted ? "conducted" as const : "blocked" as const,
    conductedToProximalAvOutput: conducted,
    recoveryBeyondProximalAvRefractorySec: recoveryBeyondRefractory,
    proximalAvConductionDelaySec: delay,
    proximalAvOutputTimeSec: proximalAvOutputTime,
    proximalAvRefractoryUntilAfterSec: refractoryUntilAfter,
    candidateState,
  });
}

function detachedValidatedConfiguration(
  configuration: RecoveryConcealmentAvGateConfigurationV2,
): RecoveryConcealmentAvGateConfigurationV2 {
  validateRecoveryConcealmentAvGateConfigurationV2(configuration);
  return createRecoveryConcealmentAvGateConfigurationV2({
    configurationId: configuration.configurationId,
    proximalAvOwnerInstanceId: configuration.proximalAvOwnerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    minimumProximalAvConductionDelaySec:
      configuration.minimumProximalAvConductionDelaySec,
    proximalAvRecoveryDelayAmplitudeSec:
      configuration.proximalAvRecoveryDelayAmplitudeSec,
    proximalAvRecoveryTimeConstantSec:
      configuration.proximalAvRecoveryTimeConstantSec,
    postProximalAvOutputRefractorySec:
      configuration.postProximalAvOutputRefractorySec,
    concealedProximalAvRefractoryExtensionSec:
      configuration.concealedProximalAvRefractoryExtensionSec,
  });
}

function copyProvenanceInput(
  input: RecoveryConcealmentAvGateProvenanceInputV2,
): RecoveryConcealmentAvGateProvenanceV2 {
  const record = requirePlainRecord(input, "proximal AV provenance input");
  requireExactKeys(record, PROVENANCE_INPUT_KEYS, "proximal AV provenance input");
  return Object.freeze({
    provenanceSchemaId: RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V2_ID,
    schemaVersion: 2 as const,
    kind: requireProvenanceKind(input.kind, "proximal AV provenance kind"),
    sourceId: requireNonemptyString(
      input.sourceId,
      "proximal AV provenance source id",
    ),
  });
}

function validateProvenance(
  provenance: RecoveryConcealmentAvGateProvenanceV2,
): void {
  const record = requirePlainRecord(provenance, "proximal AV provenance");
  requireExactKeys(record, PROVENANCE_KEYS, "proximal AV provenance");
  if (provenance.provenanceSchemaId
      !== RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V2_ID
    || provenance.schemaVersion !== 2) {
    throw new Error("proximal AV provenance schema is invalid");
  }
  requireProvenanceKind(provenance.kind, "proximal AV provenance kind");
  requireNonemptyString(provenance.sourceId, "proximal AV provenance source id");
}

function requireProvenanceKind(
  value: unknown,
  field: string,
): RecoveryConcealmentAvGateProvenanceKindV2 {
  if (value !== "explicit-research-parameters"
    && value !== "literature-component-reproduction") {
    throw new Error(`${field} is invalid`);
  }
  return value;
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
  if (actual.length !== required.length
    || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${field} keys are invalid`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
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
  return finite;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
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

function requireNullablePositiveFinite(
  value: unknown,
  field: string,
): number | null {
  return value === null ? null : requirePositiveFinite(value, field);
}

function requireComputedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} is nonfinite`);
}

function requireComputedPositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be finite and positive`);
  }
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requirePositiveSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value;
}

function requireIncrementable(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0
    || value >= Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} cannot be incremented safely`);
  }
}

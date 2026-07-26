/**
 * Isolated accepted-event atrioventricular recovery/concealment gate.
 *
 * The kernel owns no rhythm generator and processes exactly one externally
 * ordered atrial activation at a time. All times and durations are seconds.
 * A candidate is pure until explicitly committed by its enclosing owner.
 */

export const RECOVERY_CONCEALMENT_AV_GATE_V1_ID =
  "recovery-concealment-av-gate-v1" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_PARAMETERS_V1_ID =
  "recovery-concealment-av-gate-parameters-v1" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_STATE_V1_ID =
  "accepted-recovery-concealment-av-gate-state-v1" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_DECISION_V1_ID =
  "recovery-concealment-av-gate-candidate-decision-v1" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V1_ID =
  "recovery-concealment-av-gate-parameter-provenance-v1" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM = Object.freeze({
  scope: "isolated-av-recovery-and-concealment-component" as const,
  timeUnit: "second" as const,
  absoluteEventAndStateTimes: "signed-finite" as const,
  acceptedInput: "one-externally-ordered-atrial-activation" as const,
  acceptedClock:
    "monotone-non-decreasing-with-ordered-coincident-activations" as const,
  conductionCriterion: "atrial-activation-time-greater-than-or-equal-to-R" as const,
  blockingCriterion: "atrial-activation-time-strictly-less-than-R" as const,
  boundaryEqualityConducts: true as const,
  conductionDelayEquation:
    "D=Dmin+alpha*exp(-recovery-beyond-R/tau)" as const,
  initiallyFullyRecoveredDelay: "Dmin" as const,
  conductedRefractoryUpdate: "R=A+D+theta" as const,
  concealedRefractoryUpdate: "R=R+delta-c" as const,
  concealedRefractoryReference:
    "last-conducted-V-plus-theta-plus-accepted-extensions" as const,
  concealmentSimplification:
    "constant-delta-c-independent-of-blocked-activation-timing" as const,
  concealmentConsensusClaimed: false as const,
  literatureUse:
    "construction-and-component-reproduction-not-independent-validation" as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  failedOrRepeatedTrialMutatesAcceptedState: false as const,
  exactBoundaryComparisonWithoutPhysiologicalTolerance: true as const,
  rhythmGeneratorClaimed: false as const,
  wholeAvNodePhysiologyClaimed: false as const,
  atrialFibrillationClaimed: false as const,
  patientCalibrationClaimed: false as const,
  clinicalValidityClaimed: false as const,
});

export type RecoveryConcealmentAvGateParameterProvenanceKindV1 =
  | "explicit-research-parameters"
  | "literature-component-reproduction";

export type RecoveryConcealmentAvGateParameterProvenanceV1 = Readonly<{
  provenanceSchemaId:
    typeof RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V1_ID;
  schemaVersion: 1;
  kind: RecoveryConcealmentAvGateParameterProvenanceKindV1;
  /** Stable citation, protocol, or research-input identifier. */
  sourceId: string;
}>;

export type RecoveryConcealmentAvGateParameterProvenanceInputV1 = Readonly<{
  kind: RecoveryConcealmentAvGateParameterProvenanceKindV1;
  sourceId: string;
}>;

export type RecoveryConcealmentAvGateParametersInputV1 = Readonly<{
  parameterSetId: string;
  parameterProvenance: RecoveryConcealmentAvGateParameterProvenanceInputV1;
  /** Dmin: asymptotic fully recovered conduction delay. */
  minimumConductionDelaySec: number;
  /** alpha: recovery-dependent delay amplitude. */
  recoveryDelayAmplitudeSec: number;
  /** tau: recovery time constant. */
  recoveryTimeConstantSec: number;
  /** theta: refractory duration beginning at the conducted ventricular event. */
  postConductionRefractorySec: number;
  /** delta_c: refractory extension caused by a concealed blocked activation. */
  concealedRefractoryExtensionSec: number;
}>;

export type RecoveryConcealmentAvGateParametersV1 = Readonly<{
  parameterSchemaId:
    typeof RECOVERY_CONCEALMENT_AV_GATE_PARAMETERS_V1_ID;
  schemaVersion: 1;
  parameterSetId: string;
  parameterProvenance: RecoveryConcealmentAvGateParameterProvenanceV1;
  minimumConductionDelaySec: number;
  recoveryDelayAmplitudeSec: number;
  recoveryTimeConstantSec: number;
  postConductionRefractorySec: number;
  concealedRefractoryExtensionSec: number;
}>;

export type RecoveryConcealmentAvGateInitialStateInputV1 = Readonly<{
  gateInstanceId: string;
  acceptedTimeSec: number;
}>;

export type RecoveryConcealmentAvGateAcceptedStateV1 = Readonly<{
  stateSchemaId: typeof RECOVERY_CONCEALMENT_AV_GATE_STATE_V1_ID;
  schemaVersion: 1;
  gateInstanceId: string;
  parameters: RecoveryConcealmentAvGateParametersV1;
  revision: number;
  acceptedTimeSec: number;
  acceptedActivationCount: number;
  conductedActivationCount: number;
  blockedActivationCount: number;
  hasPriorConduction: boolean;
  /** Absolute accepted time before which an activation is blocked. */
  refractoryUntilSec: number;
  lastConductedAtrialActivationTimeSec: number | null;
  lastVentricularActivationTimeSec: number | null;
}>;

export type RecoveryConcealmentAvGateActivationInputV1 = Readonly<{
  activationId: string;
  atrialActivationTimeSec: number;
}>;

export type RecoveryConcealmentAvGateOutcomeV1 = "conducted" | "blocked";

export type RecoveryConcealmentAvGateCandidateDecisionV1 = Readonly<{
  decisionSchemaId: typeof RECOVERY_CONCEALMENT_AV_GATE_DECISION_V1_ID;
  schemaVersion: 1;
  gateInstanceId: string;
  parameterSetId: string;
  activationId: string;
  activationOrdinal: number;
  baseRevision: number;
  candidateRevision: number;
  atrialActivationTimeSec: number;
  refractoryUntilBeforeSec: number;
  outcome: RecoveryConcealmentAvGateOutcomeV1;
  conducted: boolean;
  /** Null denotes the deliberately fully recovered initial condition or block. */
  recoveryBeyondRefractorySec: number | null;
  conductionDelaySec: number | null;
  ventricularActivationTimeSec: number | null;
  refractoryUntilAfterSec: number;
  candidateState: RecoveryConcealmentAvGateAcceptedStateV1;
}>;

const PARAMETER_INPUT_KEYS = Object.freeze([
  "parameterSetId",
  "parameterProvenance",
  "minimumConductionDelaySec",
  "recoveryDelayAmplitudeSec",
  "recoveryTimeConstantSec",
  "postConductionRefractorySec",
  "concealedRefractoryExtensionSec",
] as const);

const PARAMETER_KEYS = Object.freeze([
  "parameterSchemaId",
  "schemaVersion",
  ...PARAMETER_INPUT_KEYS,
] as const);

const PROVENANCE_INPUT_KEYS = Object.freeze(["kind", "sourceId"] as const);
const PROVENANCE_KEYS = Object.freeze([
  "provenanceSchemaId",
  "schemaVersion",
  ...PROVENANCE_INPUT_KEYS,
] as const);

const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "gateInstanceId",
  "parameters",
  "revision",
  "acceptedTimeSec",
  "acceptedActivationCount",
  "conductedActivationCount",
  "blockedActivationCount",
  "hasPriorConduction",
  "refractoryUntilSec",
  "lastConductedAtrialActivationTimeSec",
  "lastVentricularActivationTimeSec",
] as const);

const DECISION_KEYS = Object.freeze([
  "decisionSchemaId",
  "schemaVersion",
  "gateInstanceId",
  "parameterSetId",
  "activationId",
  "activationOrdinal",
  "baseRevision",
  "candidateRevision",
  "atrialActivationTimeSec",
  "refractoryUntilBeforeSec",
  "outcome",
  "conducted",
  "recoveryBeyondRefractorySec",
  "conductionDelaySec",
  "ventricularActivationTimeSec",
  "refractoryUntilAfterSec",
  "candidateState",
] as const);

export function createRecoveryConcealmentAvGateParametersV1(
  input: RecoveryConcealmentAvGateParametersInputV1,
): RecoveryConcealmentAvGateParametersV1 {
  const record = requirePlainRecord(input, "parameter input");
  requireExactKeys(record, PARAMETER_INPUT_KEYS, "parameter input");
  const provenance = copyAndValidateProvenanceInput(
    input.parameterProvenance,
  );
  return Object.freeze({
    parameterSchemaId: RECOVERY_CONCEALMENT_AV_GATE_PARAMETERS_V1_ID,
    schemaVersion: 1 as const,
    parameterSetId: requireNonemptyString(
      input.parameterSetId,
      "parameter input.parameterSetId",
    ),
    parameterProvenance: provenance,
    minimumConductionDelaySec: requirePositiveFinite(
      input.minimumConductionDelaySec,
      "parameter input.minimumConductionDelaySec",
    ),
    recoveryDelayAmplitudeSec: requireNonnegativeFinite(
      input.recoveryDelayAmplitudeSec,
      "parameter input.recoveryDelayAmplitudeSec",
    ),
    recoveryTimeConstantSec: requirePositiveFinite(
      input.recoveryTimeConstantSec,
      "parameter input.recoveryTimeConstantSec",
    ),
    postConductionRefractorySec: requirePositiveFinite(
      input.postConductionRefractorySec,
      "parameter input.postConductionRefractorySec",
    ),
    concealedRefractoryExtensionSec: requireNonnegativeFinite(
      input.concealedRefractoryExtensionSec,
      "parameter input.concealedRefractoryExtensionSec",
    ),
  });
}

/** Creates the unique fully recovered initial state; its first delay is Dmin. */
export function initializeRecoveryConcealmentAvGateStateV1(
  parameters: RecoveryConcealmentAvGateParametersV1,
  input: RecoveryConcealmentAvGateInitialStateInputV1,
): RecoveryConcealmentAvGateAcceptedStateV1 {
  const ownedParameters = copyValidatedParameters(parameters);
  const record = requirePlainRecord(input, "initial state input");
  requireExactKeys(
    record,
    ["gateInstanceId", "acceptedTimeSec"],
    "initial state input",
  );
  const acceptedTimeSec = requireFinite(
    input.acceptedTimeSec,
    "initial state input.acceptedTimeSec",
  );
  return Object.freeze({
    stateSchemaId: RECOVERY_CONCEALMENT_AV_GATE_STATE_V1_ID,
    schemaVersion: 1 as const,
    gateInstanceId: requireNonemptyString(
      input.gateInstanceId,
      "initial state input.gateInstanceId",
    ),
    parameters: ownedParameters,
    revision: 0,
    acceptedTimeSec,
    acceptedActivationCount: 0,
    conductedActivationCount: 0,
    blockedActivationCount: 0,
    hasPriorConduction: false,
    refractoryUntilSec: acceptedTimeSec,
    lastConductedAtrialActivationTimeSec: null,
    lastVentricularActivationTimeSec: null,
  });
}

/** Pure candidate evaluation. Equality at the refractory boundary conducts. */
export function evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV1,
  activation: RecoveryConcealmentAvGateActivationInputV1,
): RecoveryConcealmentAvGateCandidateDecisionV1 {
  validateRecoveryConcealmentAvGateStateV1(acceptedState);
  const inputRecord = requirePlainRecord(activation, "activation input");
  requireExactKeys(
    inputRecord,
    ["activationId", "atrialActivationTimeSec"],
    "activation input",
  );
  const activationId = requireNonemptyString(
    activation.activationId,
    "activation input.activationId",
  );
  const atrialActivationTimeSec = requireFinite(
    activation.atrialActivationTimeSec,
    "activation input.atrialActivationTimeSec",
  );
  if (atrialActivationTimeSec < acceptedState.acceptedTimeSec) {
    throw new Error(
      "atrial activation time must be monotone non-decreasing in accepted time",
    );
  }
  if (acceptedState.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("accepted state revision cannot be incremented safely");
  }
  return buildCandidateDecision(
    acceptedState,
    activationId,
    atrialActivationTimeSec,
  );
}

/**
 * Validates an untrusted candidate against its exact accepted base and returns
 * a freshly recomputed accepted state. The supplied accepted state is untouched.
 */
export function commitRecoveryConcealmentAvGateCandidateDecisionV1(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV1,
  candidate: RecoveryConcealmentAvGateCandidateDecisionV1,
): RecoveryConcealmentAvGateAcceptedStateV1 {
  validateRecoveryConcealmentAvGateStateV1(acceptedState);
  validateCandidateDecisionShape(candidate);
  const expected = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
    acceptedState,
    Object.freeze({
      activationId: candidate.activationId,
      atrialActivationTimeSec: candidate.atrialActivationTimeSec,
    }),
  );
  if (!candidateDecisionsExactlyEqual(candidate, expected)) {
    throw new Error("candidate decision does not match its accepted base state");
  }
  return expected.candidateState;
}

/** Explicit rollback seam for an enclosing atomic transaction. */
export function rollbackRecoveryConcealmentAvGateCandidateDecisionV1(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV1,
  candidate: RecoveryConcealmentAvGateCandidateDecisionV1,
): RecoveryConcealmentAvGateAcceptedStateV1 {
  validateRecoveryConcealmentAvGateStateV1(acceptedState);
  validateCandidateDecisionShape(candidate);
  const expected = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
    acceptedState,
    Object.freeze({
      activationId: candidate.activationId,
      atrialActivationTimeSec: candidate.atrialActivationTimeSec,
    }),
  );
  if (!candidateDecisionsExactlyEqual(candidate, expected)) {
    throw new Error("candidate decision does not match its accepted base state");
  }
  return acceptedState;
}

export function validateRecoveryConcealmentAvGateParametersV1(
  parameters: RecoveryConcealmentAvGateParametersV1,
): void {
  const record = requirePlainRecord(parameters, "parameters");
  requireExactKeys(record, PARAMETER_KEYS, "parameters");
  if (
    parameters.parameterSchemaId
    !== RECOVERY_CONCEALMENT_AV_GATE_PARAMETERS_V1_ID
  ) {
    throw new Error("parameters.parameterSchemaId is invalid");
  }
  if (parameters.schemaVersion !== 1) {
    throw new Error("parameters.schemaVersion must be 1");
  }
  requireNonemptyString(parameters.parameterSetId, "parameters.parameterSetId");
  validateParameterProvenance(parameters.parameterProvenance);
  requirePositiveFinite(
    parameters.minimumConductionDelaySec,
    "parameters.minimumConductionDelaySec",
  );
  requireNonnegativeFinite(
    parameters.recoveryDelayAmplitudeSec,
    "parameters.recoveryDelayAmplitudeSec",
  );
  requirePositiveFinite(
    parameters.recoveryTimeConstantSec,
    "parameters.recoveryTimeConstantSec",
  );
  requirePositiveFinite(
    parameters.postConductionRefractorySec,
    "parameters.postConductionRefractorySec",
  );
  requireNonnegativeFinite(
    parameters.concealedRefractoryExtensionSec,
    "parameters.concealedRefractoryExtensionSec",
  );
}

export function validateRecoveryConcealmentAvGateStateV1(
  state: RecoveryConcealmentAvGateAcceptedStateV1,
): void {
  const record = requirePlainRecord(state, "accepted state");
  requireExactKeys(record, STATE_KEYS, "accepted state");
  if (state.stateSchemaId !== RECOVERY_CONCEALMENT_AV_GATE_STATE_V1_ID) {
    throw new Error("accepted state.stateSchemaId is invalid");
  }
  if (state.schemaVersion !== 1) {
    throw new Error("accepted state.schemaVersion must be 1");
  }
  requireNonemptyString(state.gateInstanceId, "accepted state.gateInstanceId");
  validateRecoveryConcealmentAvGateParametersV1(state.parameters);
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "accepted state.revision",
  );
  const acceptedTimeSec = requireFinite(
    state.acceptedTimeSec,
    "accepted state.acceptedTimeSec",
  );
  const acceptedCount = requireNonnegativeSafeInteger(
    state.acceptedActivationCount,
    "accepted state.acceptedActivationCount",
  );
  const conductedCount = requireNonnegativeSafeInteger(
    state.conductedActivationCount,
    "accepted state.conductedActivationCount",
  );
  const blockedCount = requireNonnegativeSafeInteger(
    state.blockedActivationCount,
    "accepted state.blockedActivationCount",
  );
  if (revision !== acceptedCount) {
    throw new Error("accepted state revision must equal accepted activation count");
  }
  if (conductedCount + blockedCount !== acceptedCount) {
    throw new Error("conducted and blocked counters must sum to accepted count");
  }
  if (typeof state.hasPriorConduction !== "boolean") {
    throw new Error("accepted state.hasPriorConduction must be boolean");
  }
  if (state.hasPriorConduction !== (conductedCount > 0)) {
    throw new Error("hasPriorConduction must agree with conducted count");
  }
  const refractoryUntilSec = requireFinite(
    state.refractoryUntilSec,
    "accepted state.refractoryUntilSec",
  );
  if (!state.hasPriorConduction) {
    if (acceptedCount !== 0) {
      throw new Error("an unactivated gate cannot own accepted decisions");
    }
    if (
      state.lastConductedAtrialActivationTimeSec !== null
      || state.lastVentricularActivationTimeSec !== null
    ) {
      throw new Error("a fully recovered initial state has no prior events");
    }
    if (refractoryUntilSec !== acceptedTimeSec) {
      throw new Error("initial refractory boundary must equal accepted time");
    }
    return;
  }
  const lastAtrial = requireFinite(
    state.lastConductedAtrialActivationTimeSec,
    "accepted state.lastConductedAtrialActivationTimeSec",
  );
  const lastVentricular = requireFinite(
    state.lastVentricularActivationTimeSec,
    "accepted state.lastVentricularActivationTimeSec",
  );
  if (lastAtrial > acceptedTimeSec) {
    throw new Error("last conducted atrial time cannot exceed accepted time");
  }
  if (lastVentricular < lastAtrial) {
    throw new Error("last ventricular time cannot precede its atrial activation");
  }
  const minimumRefractoryUntil = lastVentricular
    + state.parameters.postConductionRefractorySec;
  requireComputedFinite(minimumRefractoryUntil, "minimum refractory boundary");
  if (refractoryUntilSec < minimumRefractoryUntil) {
    throw new Error("refractory boundary precedes the last conducted update");
  }
}

function buildCandidateDecision(
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV1,
  activationId: string,
  atrialActivationTimeSec: number,
): RecoveryConcealmentAvGateCandidateDecisionV1 {
  const parameters = copyValidatedParameters(acceptedState.parameters);
  const conducted = atrialActivationTimeSec >= acceptedState.refractoryUntilSec;
  const candidateRevision = acceptedState.revision + 1;
  let recoveryBeyondRefractorySec: number | null = null;
  let conductionDelaySec: number | null = null;
  let ventricularActivationTimeSec: number | null = null;
  let refractoryUntilAfterSec: number;

  if (conducted) {
    if (!acceptedState.hasPriorConduction) {
      conductionDelaySec = parameters.minimumConductionDelaySec;
    } else {
      recoveryBeyondRefractorySec =
        atrialActivationTimeSec - acceptedState.refractoryUntilSec;
      conductionDelaySec = parameters.minimumConductionDelaySec
        + parameters.recoveryDelayAmplitudeSec * Math.exp(
          -recoveryBeyondRefractorySec / parameters.recoveryTimeConstantSec,
        );
    }
    requireFiniteComputed(conductionDelaySec, "candidate conduction delay");
    ventricularActivationTimeSec = atrialActivationTimeSec + conductionDelaySec;
    requireComputedFinite(
      ventricularActivationTimeSec,
      "candidate ventricular activation time",
    );
    refractoryUntilAfterSec = ventricularActivationTimeSec
      + parameters.postConductionRefractorySec;
  } else {
    refractoryUntilAfterSec = acceptedState.refractoryUntilSec
      + parameters.concealedRefractoryExtensionSec;
  }
  requireComputedFinite(
    refractoryUntilAfterSec,
    "candidate refractory boundary",
  );

  const candidateState: RecoveryConcealmentAvGateAcceptedStateV1 =
    Object.freeze({
      stateSchemaId: RECOVERY_CONCEALMENT_AV_GATE_STATE_V1_ID,
      schemaVersion: 1 as const,
      gateInstanceId: acceptedState.gateInstanceId,
      parameters,
      revision: candidateRevision,
      acceptedTimeSec: atrialActivationTimeSec,
      acceptedActivationCount: acceptedState.acceptedActivationCount + 1,
      conductedActivationCount: acceptedState.conductedActivationCount
        + (conducted ? 1 : 0),
      blockedActivationCount: acceptedState.blockedActivationCount
        + (conducted ? 0 : 1),
      hasPriorConduction: acceptedState.hasPriorConduction || conducted,
      refractoryUntilSec: refractoryUntilAfterSec,
      lastConductedAtrialActivationTimeSec: conducted
        ? atrialActivationTimeSec
        : acceptedState.lastConductedAtrialActivationTimeSec,
      lastVentricularActivationTimeSec: conducted
        ? ventricularActivationTimeSec
        : acceptedState.lastVentricularActivationTimeSec,
    });

  return Object.freeze({
    decisionSchemaId: RECOVERY_CONCEALMENT_AV_GATE_DECISION_V1_ID,
    schemaVersion: 1 as const,
    gateInstanceId: acceptedState.gateInstanceId,
    parameterSetId: parameters.parameterSetId,
    activationId,
    activationOrdinal: candidateState.acceptedActivationCount,
    baseRevision: acceptedState.revision,
    candidateRevision,
    atrialActivationTimeSec,
    refractoryUntilBeforeSec: acceptedState.refractoryUntilSec,
    outcome: conducted ? "conducted" as const : "blocked" as const,
    conducted,
    recoveryBeyondRefractorySec,
    conductionDelaySec,
    ventricularActivationTimeSec,
    refractoryUntilAfterSec,
    candidateState,
  });
}

function copyAndValidateProvenanceInput(
  input: RecoveryConcealmentAvGateParameterProvenanceInputV1,
): RecoveryConcealmentAvGateParameterProvenanceV1 {
  const record = requirePlainRecord(input, "parameter provenance input");
  requireExactKeys(
    record,
    PROVENANCE_INPUT_KEYS,
    "parameter provenance input",
  );
  const kind = requireProvenanceKind(
    input.kind,
    "parameter provenance input.kind",
  );
  return Object.freeze({
    provenanceSchemaId: RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V1_ID,
    schemaVersion: 1 as const,
    kind,
    sourceId: requireNonemptyString(
      input.sourceId,
      "parameter provenance input.sourceId",
    ),
  });
}

function copyValidatedParameters(
  parameters: RecoveryConcealmentAvGateParametersV1,
): RecoveryConcealmentAvGateParametersV1 {
  validateRecoveryConcealmentAvGateParametersV1(parameters);
  return Object.freeze({
    parameterSchemaId: parameters.parameterSchemaId,
    schemaVersion: parameters.schemaVersion,
    parameterSetId: parameters.parameterSetId,
    parameterProvenance: Object.freeze({
      provenanceSchemaId: parameters.parameterProvenance.provenanceSchemaId,
      schemaVersion: parameters.parameterProvenance.schemaVersion,
      kind: parameters.parameterProvenance.kind,
      sourceId: parameters.parameterProvenance.sourceId,
    }),
    minimumConductionDelaySec: parameters.minimumConductionDelaySec,
    recoveryDelayAmplitudeSec: parameters.recoveryDelayAmplitudeSec,
    recoveryTimeConstantSec: parameters.recoveryTimeConstantSec,
    postConductionRefractorySec: parameters.postConductionRefractorySec,
    concealedRefractoryExtensionSec:
      parameters.concealedRefractoryExtensionSec,
  });
}

function validateParameterProvenance(
  provenance: RecoveryConcealmentAvGateParameterProvenanceV1,
): void {
  const record = requirePlainRecord(provenance, "parameter provenance");
  requireExactKeys(record, PROVENANCE_KEYS, "parameter provenance");
  if (
    provenance.provenanceSchemaId
    !== RECOVERY_CONCEALMENT_AV_GATE_PROVENANCE_V1_ID
  ) {
    throw new Error("parameter provenance schema id is invalid");
  }
  if (provenance.schemaVersion !== 1) {
    throw new Error("parameter provenance schemaVersion must be 1");
  }
  requireProvenanceKind(provenance.kind, "parameter provenance.kind");
  requireNonemptyString(provenance.sourceId, "parameter provenance.sourceId");
}

function validateCandidateDecisionShape(
  candidate: RecoveryConcealmentAvGateCandidateDecisionV1,
): void {
  const record = requirePlainRecord(candidate, "candidate decision");
  requireExactKeys(record, DECISION_KEYS, "candidate decision");
  if (candidate.decisionSchemaId !== RECOVERY_CONCEALMENT_AV_GATE_DECISION_V1_ID) {
    throw new Error("candidate decision schema id is invalid");
  }
  if (candidate.schemaVersion !== 1) {
    throw new Error("candidate decision schemaVersion must be 1");
  }
  requireNonemptyString(candidate.gateInstanceId, "candidate.gateInstanceId");
  requireNonemptyString(candidate.parameterSetId, "candidate.parameterSetId");
  requireNonemptyString(candidate.activationId, "candidate.activationId");
  requirePositiveSafeInteger(candidate.activationOrdinal, "candidate.activationOrdinal");
  requireNonnegativeSafeInteger(candidate.baseRevision, "candidate.baseRevision");
  requirePositiveSafeInteger(candidate.candidateRevision, "candidate.candidateRevision");
  requireFinite(
    candidate.atrialActivationTimeSec,
    "candidate.atrialActivationTimeSec",
  );
  requireFinite(
    candidate.refractoryUntilBeforeSec,
    "candidate.refractoryUntilBeforeSec",
  );
  requireFinite(
    candidate.refractoryUntilAfterSec,
    "candidate.refractoryUntilAfterSec",
  );
  if (candidate.outcome !== "conducted" && candidate.outcome !== "blocked") {
    throw new Error("candidate.outcome must be conducted or blocked");
  }
  if (typeof candidate.conducted !== "boolean") {
    throw new Error("candidate.conducted must be boolean");
  }
  if (candidate.conducted !== (candidate.outcome === "conducted")) {
    throw new Error("candidate conducted flag must agree with outcome");
  }
  requireNullableNonnegativeFinite(
    candidate.recoveryBeyondRefractorySec,
    "candidate.recoveryBeyondRefractorySec",
  );
  requireNullableNonnegativeFinite(
    candidate.conductionDelaySec,
    "candidate.conductionDelaySec",
  );
  requireNullableFinite(
    candidate.ventricularActivationTimeSec,
    "candidate.ventricularActivationTimeSec",
  );
  validateRecoveryConcealmentAvGateStateV1(candidate.candidateState);
}

function candidateDecisionsExactlyEqual(
  left: RecoveryConcealmentAvGateCandidateDecisionV1,
  right: RecoveryConcealmentAvGateCandidateDecisionV1,
): boolean {
  for (const key of DECISION_KEYS) {
    if (key === "candidateState") continue;
    if (left[key] !== right[key]) return false;
  }
  return acceptedStatesExactlyEqual(left.candidateState, right.candidateState);
}

function acceptedStatesExactlyEqual(
  left: RecoveryConcealmentAvGateAcceptedStateV1,
  right: RecoveryConcealmentAvGateAcceptedStateV1,
): boolean {
  for (const key of STATE_KEYS) {
    if (key === "parameters") continue;
    if (left[key] !== right[key]) return false;
  }
  return parametersExactlyEqual(left.parameters, right.parameters);
}

function parametersExactlyEqual(
  left: RecoveryConcealmentAvGateParametersV1,
  right: RecoveryConcealmentAvGateParametersV1,
): boolean {
  for (const key of PARAMETER_KEYS) {
    if (key === "parameterProvenance") continue;
    if (left[key] !== right[key]) return false;
  }
  for (const key of PROVENANCE_KEYS) {
    if (left.parameterProvenance[key] !== right.parameterProvenance[key]) {
      return false;
    }
  }
  return true;
}

function requireProvenanceKind(
  value: unknown,
  field: string,
): RecoveryConcealmentAvGateParameterProvenanceKindV1 {
  if (
    value !== "explicit-research-parameters"
    && value !== "literature-component-reproduction"
  ) {
    throw new Error(`${field} is invalid`);
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
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} must contain exactly: ${required.join(", ")}`);
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
    throw new Error(`${field} must be a finite number greater than or equal to zero`);
  }
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a finite number greater than zero`);
  }
  return value;
}

function requireNullableNonnegativeFinite(value: unknown, field: string): void {
  if (value !== null) requireNonnegativeFinite(value, field);
}

function requireNullableFinite(value: unknown, field: string): void {
  if (value !== null) requireFinite(value, field);
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function requirePositiveSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value;
}

function requireFiniteComputed(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} is outside the finite seconds domain`);
  }
}

function requireComputedFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} is outside the finite seconds domain`);
  }
}

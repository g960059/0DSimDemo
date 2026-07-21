import {
  createSourceImpulseV2,
  validateSourceImpulseV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/scientific/release";

/**
 * Minimal accepted distal (His-Purkinje boundary) conduction gate.
 *
 * The gate consumes exactly one externally ordered, already accepted proximal
 * AV output. A passing decision emits only a ventricular source-impulse
 * proposal for a downstream capture owner; it never fabricates capture.
 */

export const DISTAL_CONDUCTION_GATE_CONFIGURATION_V1_ID =
  "distal-conduction-gate-configuration-v1" as const;
export const DISTAL_CONDUCTION_GATE_PROVENANCE_V1_ID =
  "distal-conduction-gate-parameter-provenance-v1" as const;
export const ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID =
  "accepted-distal-conduction-gate-state-v1" as const;
export const DISTAL_CONDUCTION_GATE_DECISION_V1_ID =
  "distal-conduction-gate-candidate-decision-v1" as const;

export const ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1 = deepFreeze({
  scope: "minimal-distal-conduction-event-gate" as const,
  acceptedInput: "one-externally-ordered-accepted-proximal-av-output" as const,
  absoluteTimes: "signed-finite-seconds" as const,
  acceptedClock:
    "monotone-non-decreasing-with-externally-ordered-coincident-arrivals" as const,
  passEquation: "tV=tH+HV" as const,
  distalReadinessCriterion: "tH-greater-than-or-equal-to-distalReadyAt" as const,
  distalRefractoryCriterion: "tH-strictly-less-than-distalReadyAt" as const,
  boundaryEqualityPasses: true as const,
  passedReadinessUpdate: "distalReadyAt=tH+ERP_H" as const,
  droppedReadinessUpdate: "unchanged" as const,
  passMode: "ERP_H-exactly-zero-and-no-mode-drop" as const,
  refractoryMode: "distal-readiness-filter" as const,
  authoredMaskMode:
    "immutable-complete-pattern-advanced-on-every-proximal-arrival" as const,
  authoredMaskDecisionOrder:
    "mask-false-drop-first-mask-true-then-distal-readiness-filter" as const,
  finiteMaskExhaustion: "explicit-fail-closed-without-wrap" as const,
  disconnectMode: "drop-every-proximal-arrival" as const,
  output:
    "av-output-source-impulse-proposal-for-downstream-ventricular-capture" as const,
  upstreamLineage:
    "externally-resolved-parent-captured-activation-preserved" as const,
  captureSuccessClaimed: false as const,
  concealmentClaimed: false as const,
  anatomyOrBlockLocalizationClaimed: false as const,
  mobitzDiagnosisClaimed: false as const,
  ecgClaimed: false as const,
  parameterDefaultsProvided: false as const,
  clinicalValidityClaimed: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
});

export type DistalConductionGateModeV1 =
  | "pass"
  | "refractory"
  | "authored-mask"
  | "disconnect";

export type AuthoredDistalMaskRepeatPolicyV1 =
  | "repeat"
  | "finite-fail-closed";

export type DistalConductionGateParameterProvenanceKindV1 =
  | "explicit-research-parameters"
  | "literature-component-reproduction";

export type DistalConductionGateParameterProvenanceInputV1 = Readonly<{
  kind: DistalConductionGateParameterProvenanceKindV1;
  /** Stable research-input or citation identifier; never a hidden default. */
  sourceId: string;
}>;

export type DistalConductionGateParameterProvenanceV1 = Readonly<{
  provenanceSchemaId: typeof DISTAL_CONDUCTION_GATE_PROVENANCE_V1_ID;
  schemaVersion: 1;
  kind: DistalConductionGateParameterProvenanceKindV1;
  sourceId: string;
}>;

export type DistalConductionGateModeConfigurationInputV1 =
  | Readonly<{ mode: "pass" }>
  | Readonly<{ mode: "refractory" }>
  | Readonly<{
    mode: "authored-mask";
    pattern: readonly boolean[];
    repeatPolicy: AuthoredDistalMaskRepeatPolicyV1;
  }>
  | Readonly<{ mode: "disconnect" }>;

export type DistalConductionGateModeConfigurationV1 =
  DistalConductionGateModeConfigurationInputV1;

export type DistalConductionGateConfigurationInputV1 = Readonly<{
  configurationId: string;
  gateInstanceId: string;
  parameterProvenance: DistalConductionGateParameterProvenanceInputV1;
  /** Fixed His-to-ventricular source delay HV. */
  hvConductionDelaySec: number;
  /** Effective distal refractory period ERP_H, measured from tH. */
  distalEffectiveRefractoryPeriodSec: number;
  modeConfiguration: DistalConductionGateModeConfigurationInputV1;
}>;

export type DistalConductionGateConfigurationV1 = Readonly<{
  configurationSchemaId: typeof DISTAL_CONDUCTION_GATE_CONFIGURATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  gateInstanceId: string;
  parameterProvenance: DistalConductionGateParameterProvenanceV1;
  hvConductionDelaySec: number;
  distalEffectiveRefractoryPeriodSec: number;
  modeConfiguration: DistalConductionGateModeConfigurationV1;
}>;

export type AcceptedDistalConductionGateInitialStateInputV1 = Readonly<{
  /** Fully recovered initial clock; signed finite absolute time. */
  acceptedTimeSec: number;
}>;

export type AcceptedDistalConductionGateStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID;
  schemaVersion: 1;
  configuration: DistalConductionGateConfigurationV1;
  initialAcceptedTimeSec: number;
  revision: number;
  acceptedTimeSec: number;
  acceptedProximalArrivalCount: number;
  passedArrivalCount: number;
  distalRefractoryDropCount: number;
  authoredMaskDropCount: number;
  authoredMaskExhaustedDropCount: number;
  disconnectedDropCount: number;
  /** Absolute tH readiness boundary; equality passes. */
  distalReadyAtSec: number;
  /** Number of consumed mask positions; zero outside authored-mask mode. */
  authoredMaskPosition: number;
  lastPassedProximalArrivalTimeSec: number | null;
  lastVentricularImpulseTimeSec: number | null;
}>;

export type DistalConductionGateProximalArrivalInputV1 = Readonly<{
  /** Lineage ID of the accepted proximal AV output presented to this gate. */
  proximalAvOutputId: string;
  /** Required upstream captured activation lineage for downstream capture. */
  parentCapturedActivationId: string;
  proximalArrivalTimeSec: number;
}>;

export type DistalConductionGateOutcomeV1 =
  | "passed"
  | "distal-refractory-drop"
  | "authored-mask-drop"
  | "authored-mask-exhausted-drop"
  | "disconnected-drop";

export type DistalConductionGateCandidateDecisionV1 = Readonly<{
  decisionSchemaId: typeof DISTAL_CONDUCTION_GATE_DECISION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  gateInstanceId: string;
  mode: DistalConductionGateModeV1;
  proximalAvOutputId: string;
  parentCapturedActivationId: string;
  arrivalOrdinal: number;
  baseRevision: number;
  candidateRevision: number;
  proximalArrivalTimeSec: number;
  distalReadyAtBeforeSec: number;
  distalReadyAtAfterSec: number;
  authoredMaskPositionBefore: number;
  authoredMaskPositionAfter: number;
  authoredMaskValue: boolean | null;
  outcome: DistalConductionGateOutcomeV1;
  passed: boolean;
  /** A capture proposal, never evidence that ventricular capture succeeded. */
  ventricularSourceImpulse: SourceImpulseV2 | null;
  candidateState: AcceptedDistalConductionGateStateV1;
}>;

const PROVENANCE_INPUT_KEYS = Object.freeze(["kind", "sourceId"] as const);
const PROVENANCE_KEYS = Object.freeze([
  "provenanceSchemaId",
  "schemaVersion",
  ...PROVENANCE_INPUT_KEYS,
] as const);
const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "gateInstanceId",
  "parameterProvenance",
  "hvConductionDelaySec",
  "distalEffectiveRefractoryPeriodSec",
  "modeConfiguration",
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
  "initialAcceptedTimeSec",
  "revision",
  "acceptedTimeSec",
  "acceptedProximalArrivalCount",
  "passedArrivalCount",
  "distalRefractoryDropCount",
  "authoredMaskDropCount",
  "authoredMaskExhaustedDropCount",
  "disconnectedDropCount",
  "distalReadyAtSec",
  "authoredMaskPosition",
  "lastPassedProximalArrivalTimeSec",
  "lastVentricularImpulseTimeSec",
] as const);
const ARRIVAL_INPUT_KEYS = Object.freeze([
  "proximalAvOutputId",
  "parentCapturedActivationId",
  "proximalArrivalTimeSec",
] as const);
const DECISION_KEYS = Object.freeze([
  "decisionSchemaId",
  "schemaVersion",
  "configurationId",
  "gateInstanceId",
  "mode",
  "proximalAvOutputId",
  "parentCapturedActivationId",
  "arrivalOrdinal",
  "baseRevision",
  "candidateRevision",
  "proximalArrivalTimeSec",
  "distalReadyAtBeforeSec",
  "distalReadyAtAfterSec",
  "authoredMaskPositionBefore",
  "authoredMaskPositionAfter",
  "authoredMaskValue",
  "outcome",
  "passed",
  "ventricularSourceImpulse",
  "candidateState",
] as const);

export function createDistalConductionGateConfigurationV1(
  input: DistalConductionGateConfigurationInputV1,
): DistalConductionGateConfigurationV1 {
  const record = requirePlainRecord(input, "distal gate configuration input");
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "distal gate configuration input",
  );
  const modeConfiguration = copyModeConfiguration(
    input.modeConfiguration,
    "distal gate configuration input.modeConfiguration",
  );
  const distalEffectiveRefractoryPeriodSec = requireNonnegativeFinite(
    input.distalEffectiveRefractoryPeriodSec,
    "distal gate configuration input.distalEffectiveRefractoryPeriodSec",
  );
  if (modeConfiguration.mode === "pass"
    && distalEffectiveRefractoryPeriodSec !== 0) {
    throw new Error("pass mode requires ERP_H to equal zero exactly");
  }
  if (modeConfiguration.mode === "refractory"
    && !(distalEffectiveRefractoryPeriodSec > 0)) {
    throw new Error("refractory mode requires positive ERP_H");
  }
  return deepFreeze({
    configurationSchemaId: DISTAL_CONDUCTION_GATE_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "distal gate configuration input.configurationId",
    ),
    gateInstanceId: requireNonemptyString(
      input.gateInstanceId,
      "distal gate configuration input.gateInstanceId",
    ),
    parameterProvenance: copyProvenanceInput(input.parameterProvenance),
    hvConductionDelaySec: requirePositiveFinite(
      input.hvConductionDelaySec,
      "distal gate configuration input.hvConductionDelaySec",
    ),
    distalEffectiveRefractoryPeriodSec,
    modeConfiguration,
  });
}

export function initializeAcceptedDistalConductionGateStateV1(
  configuration: DistalConductionGateConfigurationV1,
  input: AcceptedDistalConductionGateInitialStateInputV1,
): AcceptedDistalConductionGateStateV1 {
  const ownedConfiguration = detachedConfiguration(configuration);
  const record = requirePlainRecord(input, "distal gate initial state input");
  requireExactKeys(
    record,
    ["acceptedTimeSec"],
    "distal gate initial state input",
  );
  const acceptedTimeSec = requireFinite(
    input.acceptedTimeSec,
    "distal gate initial state input.acceptedTimeSec",
  );
  return Object.freeze({
    stateSchemaId: ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: ownedConfiguration,
    initialAcceptedTimeSec: acceptedTimeSec,
    revision: 0,
    acceptedTimeSec,
    acceptedProximalArrivalCount: 0,
    passedArrivalCount: 0,
    distalRefractoryDropCount: 0,
    authoredMaskDropCount: 0,
    authoredMaskExhaustedDropCount: 0,
    disconnectedDropCount: 0,
    distalReadyAtSec: acceptedTimeSec,
    authoredMaskPosition: 0,
    lastPassedProximalArrivalTimeSec: null,
    lastVentricularImpulseTimeSec: null,
  });
}

/** Purely evaluates one externally ordered accepted proximal AV output. */
export function evaluateDistalConductionGateCandidateDecisionV1(
  acceptedState: AcceptedDistalConductionGateStateV1,
  input: DistalConductionGateProximalArrivalInputV1,
): DistalConductionGateCandidateDecisionV1 {
  validateAcceptedDistalConductionGateStateV1(acceptedState);
  const record = requirePlainRecord(input, "distal gate proximal arrival input");
  requireExactKeys(record, ARRIVAL_INPUT_KEYS, "distal gate proximal arrival input");
  const proximalAvOutputId = requireNonemptyString(
    input.proximalAvOutputId,
    "distal gate proximal arrival input.proximalAvOutputId",
  );
  const parentCapturedActivationId = requireNonemptyString(
    input.parentCapturedActivationId,
    "distal gate proximal arrival input.parentCapturedActivationId",
  );
  const proximalArrivalTimeSec = requireFinite(
    input.proximalArrivalTimeSec,
    "distal gate proximal arrival input.proximalArrivalTimeSec",
  );
  if (proximalArrivalTimeSec < acceptedState.acceptedTimeSec) {
    throw new Error(
      "proximal arrival time must be monotone non-decreasing in accepted time",
    );
  }
  requireIncrementable(
    acceptedState.revision,
    "accepted distal gate revision",
  );
  requireIncrementable(
    acceptedState.acceptedProximalArrivalCount,
    "accepted proximal arrival count",
  );
  if (acceptedState.configuration.modeConfiguration.mode === "authored-mask") {
    requireIncrementable(
      acceptedState.authoredMaskPosition,
      "authored mask position",
    );
  }
  return buildCandidateDecision(
    acceptedState,
    proximalAvOutputId,
    parentCapturedActivationId,
    proximalArrivalTimeSec,
  );
}

/** Exact deterministic recomputation from the accepted base. */
export function commitDistalConductionGateCandidateDecisionV1(
  acceptedState: AcceptedDistalConductionGateStateV1,
  candidate: DistalConductionGateCandidateDecisionV1,
): AcceptedDistalConductionGateStateV1 {
  validateAcceptedDistalConductionGateStateV1(acceptedState);
  validateCandidateDecision(candidate);
  const expected = evaluateDistalConductionGateCandidateDecisionV1(
    acceptedState,
    {
      proximalAvOutputId: candidate.proximalAvOutputId,
      parentCapturedActivationId: candidate.parentCapturedActivationId,
      proximalArrivalTimeSec: candidate.proximalArrivalTimeSec,
    },
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("distal gate candidate does not match its accepted base");
  }
  return expected.candidateState;
}

/** Validates the candidate and returns the exact accepted object identity. */
export function rollbackDistalConductionGateCandidateDecisionV1(
  acceptedState: AcceptedDistalConductionGateStateV1,
  candidate: DistalConductionGateCandidateDecisionV1,
): AcceptedDistalConductionGateStateV1 {
  validateAcceptedDistalConductionGateStateV1(acceptedState);
  validateCandidateDecision(candidate);
  const expected = evaluateDistalConductionGateCandidateDecisionV1(
    acceptedState,
    {
      proximalAvOutputId: candidate.proximalAvOutputId,
      parentCapturedActivationId: candidate.parentCapturedActivationId,
      proximalArrivalTimeSec: candidate.proximalArrivalTimeSec,
    },
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error("distal gate candidate does not match its accepted base");
  }
  return acceptedState;
}

export function validateDistalConductionGateConfigurationV1(
  configuration: DistalConductionGateConfigurationV1,
): void {
  const record = requirePlainRecord(configuration, "distal gate configuration");
  requireExactKeys(record, CONFIGURATION_KEYS, "distal gate configuration");
  if (configuration.configurationSchemaId
    !== DISTAL_CONDUCTION_GATE_CONFIGURATION_V1_ID) {
    throw new Error("distal gate configuration schema id is invalid");
  }
  if (configuration.schemaVersion !== 1) {
    throw new Error("distal gate configuration schemaVersion must be 1");
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(configuration.gateInstanceId, "gate instance id");
  validateProvenance(configuration.parameterProvenance);
  requirePositiveFinite(
    configuration.hvConductionDelaySec,
    "configuration HV delay",
  );
  const erp = requireNonnegativeFinite(
    configuration.distalEffectiveRefractoryPeriodSec,
    "configuration ERP_H",
  );
  const mode = validateModeConfiguration(configuration.modeConfiguration);
  if (mode === "pass" && erp !== 0) {
    throw new Error("pass mode requires ERP_H to equal zero exactly");
  }
  if (mode === "refractory" && !(erp > 0)) {
    throw new Error("refractory mode requires positive ERP_H");
  }
}

export function validateAcceptedDistalConductionGateStateV1(
  state: AcceptedDistalConductionGateStateV1,
): void {
  const record = requirePlainRecord(state, "accepted distal gate state");
  requireExactKeys(record, STATE_KEYS, "accepted distal gate state");
  if (state.stateSchemaId !== ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID) {
    throw new Error("accepted distal gate state schema id is invalid");
  }
  if (state.schemaVersion !== 1) {
    throw new Error("accepted distal gate state schemaVersion must be 1");
  }
  validateDistalConductionGateConfigurationV1(state.configuration);
  const initialTime = requireFinite(
    state.initialAcceptedTimeSec,
    "accepted distal gate initial time",
  );
  const acceptedTime = requireFinite(
    state.acceptedTimeSec,
    "accepted distal gate time",
  );
  if (acceptedTime < initialTime) {
    throw new Error("accepted distal gate time precedes its initial time");
  }
  const revision = requireNonnegativeSafeInteger(state.revision, "state revision");
  const acceptedCount = requireNonnegativeSafeInteger(
    state.acceptedProximalArrivalCount,
    "accepted proximal arrival count",
  );
  const passedCount = requireNonnegativeSafeInteger(
    state.passedArrivalCount,
    "passed arrival count",
  );
  const refractoryDropCount = requireNonnegativeSafeInteger(
    state.distalRefractoryDropCount,
    "distal refractory drop count",
  );
  const maskDropCount = requireNonnegativeSafeInteger(
    state.authoredMaskDropCount,
    "authored mask drop count",
  );
  const exhaustedDropCount = requireNonnegativeSafeInteger(
    state.authoredMaskExhaustedDropCount,
    "authored mask exhausted drop count",
  );
  const disconnectedDropCount = requireNonnegativeSafeInteger(
    state.disconnectedDropCount,
    "disconnected drop count",
  );
  if (revision !== acceptedCount) {
    throw new Error("state revision must equal accepted proximal arrival count");
  }
  if (acceptedCount === 0 && acceptedTime !== initialTime) {
    throw new Error("an unprocessed distal gate retains its initial clock");
  }
  if (passedCount + refractoryDropCount + maskDropCount
    + exhaustedDropCount + disconnectedDropCount !== acceptedCount) {
    throw new Error("distal gate outcome counters must sum to accepted count");
  }
  const maskPosition = requireNonnegativeSafeInteger(
    state.authoredMaskPosition,
    "authored mask position",
  );
  const modeConfiguration = state.configuration.modeConfiguration;
  if (modeConfiguration.mode === "authored-mask") {
    if (maskPosition !== acceptedCount) {
      throw new Error("authored mask position must advance on every arrival");
    }
    if (disconnectedDropCount !== 0) {
      throw new Error("authored-mask mode cannot own disconnected drops");
    }
    const expectedMaskDropCount = countAuthoredFalseEntries(
      modeConfiguration.pattern,
      acceptedCount,
      modeConfiguration.repeatPolicy,
    );
    if (maskDropCount !== expectedMaskDropCount) {
      throw new Error("authored mask drop count does not match the pattern");
    }
    const expectedExhaustedDropCount = modeConfiguration.repeatPolicy === "repeat"
      ? 0
      : Math.max(0, acceptedCount - modeConfiguration.pattern.length);
    if (exhaustedDropCount !== expectedExhaustedDropCount) {
      throw new Error("authored mask exhausted count does not match the policy");
    }
  } else {
    if (maskPosition !== 0 || maskDropCount !== 0 || exhaustedDropCount !== 0) {
      throw new Error("non-mask modes cannot own mask state or mask drops");
    }
  }
  if (modeConfiguration.mode === "pass") {
    if (passedCount !== acceptedCount || refractoryDropCount !== 0
      || disconnectedDropCount !== 0) {
      throw new Error("pass mode must pass every accepted arrival");
    }
  } else if (modeConfiguration.mode === "refractory") {
    if (disconnectedDropCount !== 0) {
      throw new Error("refractory mode cannot own disconnected drops");
    }
  } else if (modeConfiguration.mode === "disconnect") {
    if (disconnectedDropCount !== acceptedCount || passedCount !== 0
      || refractoryDropCount !== 0) {
      throw new Error("disconnect mode must drop every accepted arrival");
    }
  }

  const readyAt = requireFinite(state.distalReadyAtSec, "distal ready time");
  if (passedCount === 0) {
    if (state.lastPassedProximalArrivalTimeSec !== null
      || state.lastVentricularImpulseTimeSec !== null) {
      throw new Error("a never-passed state cannot own prior pass times");
    }
    if (readyAt !== initialTime) {
      throw new Error("a never-passed state retains its initial ready time");
    }
  } else {
    const lastPassed = requireFinite(
      state.lastPassedProximalArrivalTimeSec,
      "last passed proximal arrival time",
    );
    const lastVentricular = requireFinite(
      state.lastVentricularImpulseTimeSec,
      "last ventricular impulse time",
    );
    if (lastPassed > acceptedTime) {
      throw new Error("last passed proximal arrival exceeds accepted time");
    }
    if (modeConfiguration.mode === "pass" && lastPassed !== acceptedTime) {
      throw new Error("pass mode last pass must equal accepted time");
    }
    const expectedReadyAt = requireComputedFinite(
      lastPassed + state.configuration.distalEffectiveRefractoryPeriodSec,
      "expected distal ready time",
    );
    const expectedVentricular = requireComputedFinite(
      lastPassed + state.configuration.hvConductionDelaySec,
      "expected ventricular impulse time",
    );
    if (readyAt !== expectedReadyAt) {
      throw new Error("distal ready time is inconsistent with the last pass");
    }
    if (lastVentricular !== expectedVentricular) {
      throw new Error("ventricular impulse time is inconsistent with HV");
    }
  }
}

function countAuthoredFalseEntries(
  pattern: readonly boolean[],
  acceptedCount: number,
  repeatPolicy: AuthoredDistalMaskRepeatPolicyV1,
): number {
  const consideredCount = repeatPolicy === "repeat"
    ? acceptedCount
    : Math.min(acceptedCount, pattern.length);
  if (consideredCount === 0) return 0;
  const falsePerPattern = pattern.reduce(
    (count, value) => count + (value ? 0 : 1),
    0,
  );
  const fullPatternCount = Math.floor(consideredCount / pattern.length);
  const remainderCount = consideredCount % pattern.length;
  let count = fullPatternCount * falsePerPattern;
  for (let index = 0; index < remainderCount; index += 1) {
    if (!pattern[index]) count += 1;
  }
  if (!Number.isSafeInteger(count)) {
    throw new Error("authored mask drop count cannot be represented safely");
  }
  return count;
}

function buildCandidateDecision(
  state: AcceptedDistalConductionGateStateV1,
  proximalAvOutputId: string,
  parentCapturedActivationId: string,
  proximalArrivalTimeSec: number,
): DistalConductionGateCandidateDecisionV1 {
  const modeConfiguration = state.configuration.modeConfiguration;
  const mode = modeConfiguration.mode;
  const maskPositionBefore = state.authoredMaskPosition;
  const maskPositionAfter = mode === "authored-mask"
    ? maskPositionBefore + 1
    : maskPositionBefore;
  let authoredMaskValue: boolean | null = null;
  let outcome: DistalConductionGateOutcomeV1;

  if (mode === "disconnect") {
    outcome = "disconnected-drop";
  } else if (mode === "authored-mask") {
    const patternIndex = modeConfiguration.repeatPolicy === "repeat"
      ? maskPositionBefore % modeConfiguration.pattern.length
      : maskPositionBefore;
    if (patternIndex >= modeConfiguration.pattern.length) {
      outcome = "authored-mask-exhausted-drop";
    } else {
      authoredMaskValue = modeConfiguration.pattern[patternIndex]!;
      if (!authoredMaskValue) {
        outcome = "authored-mask-drop";
      } else if (proximalArrivalTimeSec < state.distalReadyAtSec) {
        outcome = "distal-refractory-drop";
      } else {
        outcome = "passed";
      }
    }
  } else if (proximalArrivalTimeSec < state.distalReadyAtSec) {
    outcome = "distal-refractory-drop";
  } else {
    outcome = "passed";
  }

  const passed = outcome === "passed";
  const arrivalOrdinal = state.acceptedProximalArrivalCount + 1;
  const candidateRevision = state.revision + 1;
  const distalReadyAtAfterSec = passed
    ? requireComputedFinite(
      proximalArrivalTimeSec
        + state.configuration.distalEffectiveRefractoryPeriodSec,
      "candidate distal ready time",
    )
    : state.distalReadyAtSec;
  const ventricularImpulseTimeSec = passed
    ? requireComputedFinite(
      proximalArrivalTimeSec + state.configuration.hvConductionDelaySec,
      "candidate ventricular impulse time",
    )
    : null;
  const ventricularSourceImpulse = ventricularImpulseTimeSec === null
    ? null
    : createSourceImpulseV2({
      sourceImpulseId:
        `${state.configuration.gateInstanceId}:distal-arrival:${arrivalOrdinal}`,
      parentCapturedActivationId,
      chamber: "ventricular",
      sourceKind: "av-output",
      sourceId: state.configuration.gateInstanceId,
      sourceSequence: arrivalOrdinal,
      activationTimeSec: ventricularImpulseTimeSec,
    });

  const outcomeCount = outcomeCounterValue(state, outcome);
  requireIncrementable(outcomeCount, `${outcome} count`);
  const candidateState: AcceptedDistalConductionGateStateV1 = Object.freeze({
    stateSchemaId: ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: state.configuration,
    initialAcceptedTimeSec: state.initialAcceptedTimeSec,
    revision: candidateRevision,
    acceptedTimeSec: proximalArrivalTimeSec,
    acceptedProximalArrivalCount: arrivalOrdinal,
    passedArrivalCount: state.passedArrivalCount + (passed ? 1 : 0),
    distalRefractoryDropCount: state.distalRefractoryDropCount
      + (outcome === "distal-refractory-drop" ? 1 : 0),
    authoredMaskDropCount: state.authoredMaskDropCount
      + (outcome === "authored-mask-drop" ? 1 : 0),
    authoredMaskExhaustedDropCount: state.authoredMaskExhaustedDropCount
      + (outcome === "authored-mask-exhausted-drop" ? 1 : 0),
    disconnectedDropCount: state.disconnectedDropCount
      + (outcome === "disconnected-drop" ? 1 : 0),
    distalReadyAtSec: distalReadyAtAfterSec,
    authoredMaskPosition: maskPositionAfter,
    lastPassedProximalArrivalTimeSec: passed
      ? proximalArrivalTimeSec
      : state.lastPassedProximalArrivalTimeSec,
    lastVentricularImpulseTimeSec: passed
      ? ventricularImpulseTimeSec
      : state.lastVentricularImpulseTimeSec,
  });

  return Object.freeze({
    decisionSchemaId: DISTAL_CONDUCTION_GATE_DECISION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: state.configuration.configurationId,
    gateInstanceId: state.configuration.gateInstanceId,
    mode,
    proximalAvOutputId,
    parentCapturedActivationId,
    arrivalOrdinal,
    baseRevision: state.revision,
    candidateRevision,
    proximalArrivalTimeSec,
    distalReadyAtBeforeSec: state.distalReadyAtSec,
    distalReadyAtAfterSec,
    authoredMaskPositionBefore: maskPositionBefore,
    authoredMaskPositionAfter: maskPositionAfter,
    authoredMaskValue,
    outcome,
    passed,
    ventricularSourceImpulse,
    candidateState,
  });
}

function outcomeCounterValue(
  state: AcceptedDistalConductionGateStateV1,
  outcome: DistalConductionGateOutcomeV1,
): number {
  switch (outcome) {
    case "passed": return state.passedArrivalCount;
    case "distal-refractory-drop": return state.distalRefractoryDropCount;
    case "authored-mask-drop": return state.authoredMaskDropCount;
    case "authored-mask-exhausted-drop":
      return state.authoredMaskExhaustedDropCount;
    case "disconnected-drop": return state.disconnectedDropCount;
  }
}

function validateCandidateDecision(
  candidate: DistalConductionGateCandidateDecisionV1,
): void {
  const record = requirePlainRecord(candidate, "distal gate candidate");
  requireExactKeys(record, DECISION_KEYS, "distal gate candidate");
  if (candidate.decisionSchemaId !== DISTAL_CONDUCTION_GATE_DECISION_V1_ID
    || candidate.schemaVersion !== 1) {
    throw new Error("distal gate candidate schema is invalid");
  }
  requireNonemptyString(candidate.configurationId, "candidate configuration id");
  requireNonemptyString(candidate.gateInstanceId, "candidate gate id");
  requireMode(candidate.mode, "candidate mode");
  requireNonemptyString(candidate.proximalAvOutputId, "candidate proximal id");
  requireNonemptyString(
    candidate.parentCapturedActivationId,
    "candidate parent captured activation id",
  );
  requirePositiveSafeInteger(candidate.arrivalOrdinal, "candidate arrival ordinal");
  requireNonnegativeSafeInteger(candidate.baseRevision, "candidate base revision");
  requirePositiveSafeInteger(candidate.candidateRevision, "candidate revision");
  requireFinite(candidate.proximalArrivalTimeSec, "candidate proximal time");
  requireFinite(candidate.distalReadyAtBeforeSec, "candidate ready-before time");
  requireFinite(candidate.distalReadyAtAfterSec, "candidate ready-after time");
  requireNonnegativeSafeInteger(
    candidate.authoredMaskPositionBefore,
    "candidate mask position before",
  );
  requireNonnegativeSafeInteger(
    candidate.authoredMaskPositionAfter,
    "candidate mask position after",
  );
  if (candidate.authoredMaskValue !== null
    && typeof candidate.authoredMaskValue !== "boolean") {
    throw new Error("candidate authored mask value is invalid");
  }
  requireOutcome(candidate.outcome, "candidate outcome");
  if (typeof candidate.passed !== "boolean"
    || candidate.passed !== (candidate.outcome === "passed")) {
    throw new Error("candidate passed flag must agree with outcome");
  }
  if (candidate.ventricularSourceImpulse === null) {
    if (candidate.passed) {
      throw new Error("a passing candidate requires a source impulse");
    }
  } else {
    validateSourceImpulseV2(candidate.ventricularSourceImpulse);
    if (!candidate.passed) {
      throw new Error("a dropped candidate cannot emit a source impulse");
    }
  }
  validateAcceptedDistalConductionGateStateV1(candidate.candidateState);
  canonicalJsonStringify(candidate);
}

function detachedConfiguration(
  configuration: DistalConductionGateConfigurationV1,
): DistalConductionGateConfigurationV1 {
  validateDistalConductionGateConfigurationV1(configuration);
  return createDistalConductionGateConfigurationV1({
    configurationId: configuration.configurationId,
    gateInstanceId: configuration.gateInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    hvConductionDelaySec: configuration.hvConductionDelaySec,
    distalEffectiveRefractoryPeriodSec:
      configuration.distalEffectiveRefractoryPeriodSec,
    modeConfiguration: configuration.modeConfiguration.mode === "authored-mask"
      ? {
        mode: "authored-mask",
        pattern: configuration.modeConfiguration.pattern,
        repeatPolicy: configuration.modeConfiguration.repeatPolicy,
      }
      : { mode: configuration.modeConfiguration.mode },
  });
}

function copyProvenanceInput(
  input: DistalConductionGateParameterProvenanceInputV1,
): DistalConductionGateParameterProvenanceV1 {
  const record = requirePlainRecord(input, "distal gate provenance input");
  requireExactKeys(record, PROVENANCE_INPUT_KEYS, "distal gate provenance input");
  return Object.freeze({
    provenanceSchemaId: DISTAL_CONDUCTION_GATE_PROVENANCE_V1_ID,
    schemaVersion: 1 as const,
    kind: requireProvenanceKind(input.kind, "distal gate provenance input.kind"),
    sourceId: requireNonemptyString(
      input.sourceId,
      "distal gate provenance input.sourceId",
    ),
  });
}

function validateProvenance(
  provenance: DistalConductionGateParameterProvenanceV1,
): void {
  const record = requirePlainRecord(provenance, "distal gate provenance");
  requireExactKeys(record, PROVENANCE_KEYS, "distal gate provenance");
  if (provenance.provenanceSchemaId !== DISTAL_CONDUCTION_GATE_PROVENANCE_V1_ID
    || provenance.schemaVersion !== 1) {
    throw new Error("distal gate provenance schema is invalid");
  }
  requireProvenanceKind(provenance.kind, "distal gate provenance.kind");
  requireNonemptyString(provenance.sourceId, "distal gate provenance.sourceId");
}

function copyModeConfiguration(
  input: DistalConductionGateModeConfigurationInputV1,
  field: string,
): DistalConductionGateModeConfigurationV1 {
  const record = requirePlainRecord(input, field);
  const mode = requireMode(input.mode, `${field}.mode`);
  if (input.mode !== "authored-mask") {
    requireExactKeys(record, ["mode"], field);
    if (input.mode === "pass") return Object.freeze({ mode: "pass" as const });
    if (input.mode === "refractory") {
      return Object.freeze({ mode: "refractory" as const });
    }
    return Object.freeze({ mode: "disconnect" as const });
  }
  requireExactKeys(record, ["mode", "pattern", "repeatPolicy"], field);
  if (!Array.isArray(input.pattern) || input.pattern.length === 0) {
    throw new Error(`${field}.pattern must be a nonempty complete boolean array`);
  }
  const pattern = input.pattern.map((value, index) => {
    if (typeof value !== "boolean") {
      throw new Error(`${field}.pattern[${index}] must be boolean`);
    }
    return value;
  });
  if (input.repeatPolicy !== "repeat"
    && input.repeatPolicy !== "finite-fail-closed") {
    throw new Error(`${field}.repeatPolicy is invalid`);
  }
  return Object.freeze({
    mode,
    pattern: Object.freeze(pattern),
    repeatPolicy: input.repeatPolicy,
  });
}

function validateModeConfiguration(
  input: DistalConductionGateModeConfigurationV1,
): DistalConductionGateModeV1 {
  return copyModeConfiguration(input, "distal gate mode configuration").mode;
}

function requireMode(value: unknown, field: string): DistalConductionGateModeV1 {
  if (value !== "pass" && value !== "refractory"
    && value !== "authored-mask" && value !== "disconnect") {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

function requireOutcome(
  value: unknown,
  field: string,
): DistalConductionGateOutcomeV1 {
  if (value !== "passed" && value !== "distal-refractory-drop"
    && value !== "authored-mask-drop"
    && value !== "authored-mask-exhausted-drop"
    && value !== "disconnected-drop") {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

function requireProvenanceKind(
  value: unknown,
  field: string,
): DistalConductionGateParameterProvenanceKindV1 {
  if (value !== "explicit-research-parameters"
    && value !== "literature-component-reproduction") {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

function requireIncrementable(value: number, field: string): void {
  if (value === Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} cannot be incremented safely`);
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
  if (actual.length !== required.length
    || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${field} keys are invalid`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a nonempty string`);
  }
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function requireComputedFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must remain finite`);
  return Object.is(value, -0) ? 0 : value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const numberValue = requireFinite(value, field);
  if (!(numberValue > 0)) throw new Error(`${field} must be positive`);
  return numberValue;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  const numberValue = requireFinite(value, field);
  if (numberValue < 0) throw new Error(`${field} must be nonnegative`);
  return numberValue;
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

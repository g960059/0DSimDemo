import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
  type ElectricalImpulseSourceKindV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/scientific/release";

/**
 * Standalone accepted-event IABP actuator owner.
 *
 * This owner deliberately does not replace evaluateIabpV1. It only converts
 * accepted ventricular-capture and aortic-valve-closure lineage into a smooth
 * aortic displacement-volume command. It owns no pressure, flow, valve,
 * coronary, pneumatic, sensing, ECG, or patient-physiology model.
 */

export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CONFIGURATION_V1_ID =
  "accepted-event-triggered-iabp-actuator-configuration-v1" as const;
export const ACCEPTED_AORTIC_VALVE_CLOSURE_EVENT_V1_ID =
  "accepted-aortic-valve-closure-event-v1" as const;
export const ACCEPTED_EVENT_TRIGGERED_IABP_TRANSITION_MEMORY_V1_ID =
  "accepted-event-triggered-iabp-transition-memory-v1" as const;
export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID =
  "accepted-event-triggered-iabp-actuator-state-v1" as const;
export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CANDIDATE_V1_ID =
  "accepted-event-triggered-iabp-actuator-candidate-v1" as const;
export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_EVALUATION_V1_ID =
  "accepted-event-triggered-iabp-actuator-evaluation-v1" as const;

export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1 = deepFreeze({
  scope:
    "standalone-accepted-event-triggered-iabp-aortic-displacement-actuator" as const,
  existingPhaseBasedEvaluateIabpV1Replaced: false as const,
  mainWireOrCirculationIntegrated: false as const,
  triggerSemantics: Object.freeze({
    deflation:
      "start-at-accepted-captured-ventricular-activation" as const,
    inflation:
      "start-at-accepted-aortic-valve-closure-with-exact-current-beat-parent-lineage" as const,
    sameTimeOrder:
      "current-beat-aortic-closure-before-next-ventricular-activation" as const,
    missedClosurePolicy:
      "reject-next-ventricular-activation-before-current-beat-closure" as const,
  }),
  assistRatios: Object.freeze([1, 2, 3] as const),
  firstAcceptedBeatAssisted: true as const,
  transitionLaw:
    "finite-duration-cubic-smoothstep-between-current-and-target-activation" as const,
  aorticDisplacementLaw:
    "SA-excluded-volume-ml-equals-explicit-balloon-volume-ml-times-activation01-as-existing-iabp-v1-law" as const,
  parameters: "explicit-only-with-no-hidden-defaults" as const,
  literatureConstruction: Object.freeze([
    Object.freeze({
      sourceId: "Sun-1991" as const,
      doi: "10.1152/ajpheart.1991.261.4.H1300" as const,
      citationUrl:
        "https://doi.org/10.1152/ajpheart.1991.261.4.H1300" as const,
      role:
        "dynamic-lv-iabp-and-volume-timing-construction-context-only" as const,
    }),
    Object.freeze({
      sourceId: "Schampaert-et-al" as const,
      pmid: "23263334" as const,
      citationUrl: "https://pubmed.ncbi.nlm.nih.gov/23263334/" as const,
      role: "iabp-timing-model-comparison-context-only" as const,
    }),
    Object.freeze({
      sourceId: "Kern-et-al-1999" as const,
      pmid: "10347342" as const,
      citationUrl: "https://pubmed.ncbi.nlm.nih.gov/10347342/" as const,
      role: "deflation-timing-comparison-context-only" as const,
    }),
    Object.freeze({
      sourceId: "Sakamoto-et-al-1995" as const,
      pmid: "8573871" as const,
      citationUrl: "https://pubmed.ncbi.nlm.nih.gov/8573871/" as const,
      role: "deflation-timing-comparison-context-only" as const,
    }),
  ] as const),
  literatureComponentReproductionClaimed: false as const,
  validatedPatientModelClaimed: false as const,
  pneumaticDriveModelClaimed: false as const,
  ecgOrAutoTimingAlgorithmClaimed: false as const,
  balloonComplianceClaimed: false as const,
  occlusivityClaimed: false as const,
  coronaryBenefitClaimed: false as const,
  patientPhysiologyClaimed: false as const,
  pressureOrFlowEffectClaimed: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
});

export type AcceptedEventTriggeredIabpAssistRatioV1 = 1 | 2 | 3;

export type AcceptedEventTriggeredIabpActuatorConfigurationInputV1 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  assistRatio: AcceptedEventTriggeredIabpAssistRatioV1;
  balloonVolumeMl: number;
  inflationTransitionDurationSec: number;
  deflationTransitionDurationSec: number;
  placementNode: "SA";
}>;

export type AcceptedEventTriggeredIabpActuatorConfigurationV1 = Readonly<{
  configurationSchemaId:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CONFIGURATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  assistRatio: AcceptedEventTriggeredIabpAssistRatioV1;
  balloonVolumeMl: number;
  inflationTransitionDurationSec: number;
  deflationTransitionDurationSec: number;
  placementNode: "SA";
}>;

export type AcceptedAorticValveClosureEventInputV1 = Readonly<{
  closureEventId: string;
  parentCapturedVentricularActivationId: string;
  closureTimeSec: number;
  valveId: "AoV";
}>;

export type AcceptedAorticValveClosureEventV1 = Readonly<{
  eventSchemaId: typeof ACCEPTED_AORTIC_VALVE_CLOSURE_EVENT_V1_ID;
  schemaVersion: 1;
  closureEventId: string;
  parentCapturedVentricularActivationId: string;
  closureTimeSec: number;
  valveId: "AoV";
}>;

export type AcceptedEventTriggeredIabpTransitionKindV1 =
  | "initialized-deflated"
  | "inflation"
  | "deflation";

export type AcceptedEventTriggeredIabpTransitionMemoryV1 = Readonly<{
  memorySchemaId:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_TRANSITION_MEMORY_V1_ID;
  schemaVersion: 1;
  transitionId: string;
  transitionKind: AcceptedEventTriggeredIabpTransitionKindV1;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  startActivation01: number;
  targetActivation01: 0 | 1;
  parentCapturedVentricularActivationId: string | null;
  parentAorticValveClosureEventId: string | null;
}>;

export type AcceptedEventTriggeredIabpActuatorStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1;
  initialAcceptedTimeSec: number;
  revision: number;
  acceptedTimeSec: number;
  acceptedVentricularActivationCount: number;
  currentCapturedVentricularActivation:
    CapturedElectricalActivationV2 | null;
  lastAcceptedAorticValveClosure:
    AcceptedAorticValveClosureEventV1 | null;
  transitionMemory: AcceptedEventTriggeredIabpTransitionMemoryV1;
}>;

export type AcceptedEventTriggeredIabpActuatorInitialStateInputV1 = Readonly<{
  acceptedTimeSec: number;
}>;

export type AcceptedEventTriggeredIabpActuatorCandidateInputV1 = Readonly<{
  candidateTimeSec: number;
  capturedVentricularActivations:
    readonly CapturedElectricalActivationV2[];
  aorticValveClosures: readonly AcceptedAorticValveClosureEventV1[];
}>;

export type AcceptedEventTriggeredIabpActuatorEvaluationV1 = Readonly<{
  evaluationSchemaId:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_EVALUATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  evaluationTimeSec: number;
  activation01: number;
  balloonVolumeMl: number;
  aorticExcludedVolumeMl: number;
  placementNode: "SA";
  acceptedVentricularActivationCount: number;
  currentBeatAssisted: boolean;
  transitionKind: AcceptedEventTriggeredIabpTransitionKindV1;
}>;

export type AcceptedEventTriggeredIabpActuatorCandidateV1 = Readonly<{
  candidateSchemaId:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CANDIDATE_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  capturedVentricularActivation: CapturedElectricalActivationV2 | null;
  aorticValveClosure: AcceptedAorticValveClosureEventV1 | null;
  closureProcessedBeforeVentricularActivation: boolean;
  inflationTransitionStarted: boolean;
  deflationTransitionStarted: boolean;
  evaluation: AcceptedEventTriggeredIabpActuatorEvaluationV1;
  candidateState: AcceptedEventTriggeredIabpActuatorStateV1;
}>;

export type AcceptedEventTriggeredIabpActuatorMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  maximumStepSec: number;
  candidateTimeSec: number;
  boundaryTimeSec: number | null;
  boundaryOwners: readonly (
    | "accepted-input-event"
    | "inflation-transition-end"
    | "deflation-transition-end"
  )[];
}>;

const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "assistRatio",
  "balloonVolumeMl",
  "inflationTransitionDurationSec",
  "deflationTransitionDurationSec",
  "placementNode",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  ...CONFIGURATION_INPUT_KEYS,
] as const);
const CLOSURE_INPUT_KEYS = Object.freeze([
  "closureEventId",
  "parentCapturedVentricularActivationId",
  "closureTimeSec",
  "valveId",
] as const);
const CLOSURE_KEYS = Object.freeze([
  "eventSchemaId",
  "schemaVersion",
  ...CLOSURE_INPUT_KEYS,
] as const);
const TRANSITION_KEYS = Object.freeze([
  "memorySchemaId",
  "schemaVersion",
  "transitionId",
  "transitionKind",
  "startTimeSec",
  "endTimeSec",
  "durationSec",
  "startActivation01",
  "targetActivation01",
  "parentCapturedVentricularActivationId",
  "parentAorticValveClosureEventId",
] as const);
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initialAcceptedTimeSec",
  "revision",
  "acceptedTimeSec",
  "acceptedVentricularActivationCount",
  "currentCapturedVentricularActivation",
  "lastAcceptedAorticValveClosure",
  "transitionMemory",
] as const);
const INITIAL_INPUT_KEYS = Object.freeze(["acceptedTimeSec"] as const);
const CANDIDATE_INPUT_KEYS = Object.freeze([
  "candidateTimeSec",
  "capturedVentricularActivations",
  "aorticValveClosures",
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

const VERIFIED_CONFIGURATIONS = new WeakSet<object>();

export function createAcceptedEventTriggeredIabpActuatorConfigurationV1(
  input: AcceptedEventTriggeredIabpActuatorConfigurationInputV1,
): AcceptedEventTriggeredIabpActuatorConfigurationV1 {
  canonicalJsonStringify(input);
  requireExactKeys(
    requirePlainRecord(input, "event-triggered IABP configuration input"),
    CONFIGURATION_INPUT_KEYS,
    "event-triggered IABP configuration input",
  );
  const assistRatio = requireAssistRatio(input.assistRatio);
  const configuration = deepFreeze({
    configurationSchemaId:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "event-triggered IABP configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "event-triggered IABP ownerInstanceId",
    ),
    assistRatio,
    balloonVolumeMl: requireNonnegativeFinite(
      input.balloonVolumeMl,
      "event-triggered IABP balloonVolumeMl",
    ),
    inflationTransitionDurationSec: requirePositiveFinite(
      input.inflationTransitionDurationSec,
      "event-triggered IABP inflationTransitionDurationSec",
    ),
    deflationTransitionDurationSec: requirePositiveFinite(
      input.deflationTransitionDurationSec,
      "event-triggered IABP deflationTransitionDurationSec",
    ),
    placementNode: requirePlacementNode(input.placementNode),
  }) satisfies AcceptedEventTriggeredIabpActuatorConfigurationV1;
  VERIFIED_CONFIGURATIONS.add(configuration);
  return configuration;
}

export function validateAcceptedEventTriggeredIabpActuatorConfigurationV1(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): void {
  const record = requirePlainRecord(
    configuration,
    "event-triggered IABP configuration",
  );
  requireExactKeys(
    record,
    CONFIGURATION_KEYS,
    "event-triggered IABP configuration",
  );
  canonicalJsonStringify(record);
  if (
    configuration.configurationSchemaId
      !== ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CONFIGURATION_V1_ID
    || configuration.schemaVersion !== 1
    || !Object.isFrozen(configuration)
  ) {
    throw new Error(
      "event-triggered IABP configuration schema or immutability is invalid",
    );
  }
  requireNonemptyString(configuration.configurationId, "configurationId");
  requireNonemptyString(configuration.ownerInstanceId, "ownerInstanceId");
  requireAssistRatio(configuration.assistRatio);
  requireNonnegativeFinite(configuration.balloonVolumeMl, "balloonVolumeMl");
  requirePositiveFinite(
    configuration.inflationTransitionDurationSec,
    "inflationTransitionDurationSec",
  );
  requirePositiveFinite(
    configuration.deflationTransitionDurationSec,
    "deflationTransitionDurationSec",
  );
  requirePlacementNode(configuration.placementNode);
  if (VERIFIED_CONFIGURATIONS.has(configuration)) return;
  const rebuilt = createAcceptedEventTriggeredIabpActuatorConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    assistRatio: configuration.assistRatio,
    balloonVolumeMl: configuration.balloonVolumeMl,
    inflationTransitionDurationSec:
      configuration.inflationTransitionDurationSec,
    deflationTransitionDurationSec:
      configuration.deflationTransitionDurationSec,
    placementNode: configuration.placementNode,
  });
  assertCanonicalEqual(
    configuration,
    rebuilt,
    "event-triggered IABP configuration is not canonical",
  );
  VERIFIED_CONFIGURATIONS.add(configuration);
}

export function createAcceptedAorticValveClosureEventV1(
  input: AcceptedAorticValveClosureEventInputV1,
): AcceptedAorticValveClosureEventV1 {
  canonicalJsonStringify(input);
  requireExactKeys(
    requirePlainRecord(input, "accepted aortic valve closure input"),
    CLOSURE_INPUT_KEYS,
    "accepted aortic valve closure input",
  );
  return Object.freeze({
    eventSchemaId: ACCEPTED_AORTIC_VALVE_CLOSURE_EVENT_V1_ID,
    schemaVersion: 1 as const,
    closureEventId: requireNonemptyString(
      input.closureEventId,
      "aortic valve closureEventId",
    ),
    parentCapturedVentricularActivationId: requireNonemptyString(
      input.parentCapturedVentricularActivationId,
      "aortic valve closure parent activation id",
    ),
    closureTimeSec: requireNonnegativeFinite(
      input.closureTimeSec,
      "aortic valve closure time",
    ),
    valveId: requireAorticValveId(input.valveId),
  });
}

export function validateAcceptedAorticValveClosureEventV1(
  event: AcceptedAorticValveClosureEventV1,
): void {
  const record = requirePlainRecord(event, "accepted aortic valve closure");
  requireExactKeys(record, CLOSURE_KEYS, "accepted aortic valve closure");
  canonicalJsonStringify(record);
  if (
    event.eventSchemaId !== ACCEPTED_AORTIC_VALVE_CLOSURE_EVENT_V1_ID
    || event.schemaVersion !== 1
    || !Object.isFrozen(event)
  ) {
    throw new Error(
      "accepted aortic valve closure schema or immutability is invalid",
    );
  }
  requireNonemptyString(event.closureEventId, "closureEventId");
  requireNonemptyString(
    event.parentCapturedVentricularActivationId,
    "closure parent activation id",
  );
  requireNonnegativeFinite(event.closureTimeSec, "closureTimeSec");
  requireAorticValveId(event.valveId);
}

export function initializeAcceptedEventTriggeredIabpActuatorStateV1(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
  input: AcceptedEventTriggeredIabpActuatorInitialStateInputV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  const ownedConfiguration = copyConfiguration(configuration);
  requireExactKeys(
    requirePlainRecord(input, "event-triggered IABP initial state input"),
    INITIAL_INPUT_KEYS,
    "event-triggered IABP initial state input",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "event-triggered IABP initial accepted time",
  );
  const state = deepFreeze({
    stateSchemaId: ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: ownedConfiguration,
    initialAcceptedTimeSec: acceptedTimeSec,
    revision: 0,
    acceptedTimeSec,
    acceptedVentricularActivationCount: 0,
    currentCapturedVentricularActivation: null,
    lastAcceptedAorticValveClosure: null,
    transitionMemory: initializedTransition(
      ownedConfiguration,
      acceptedTimeSec,
    ),
  }) satisfies AcceptedEventTriggeredIabpActuatorStateV1;
  validateAcceptedEventTriggeredIabpActuatorStateV1(state);
  return state;
}

export function evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
  acceptedState: AcceptedEventTriggeredIabpActuatorStateV1,
  input: AcceptedEventTriggeredIabpActuatorCandidateInputV1,
): AcceptedEventTriggeredIabpActuatorCandidateV1 {
  validateAcceptedEventTriggeredIabpActuatorStateV1(acceptedState);
  canonicalJsonStringify(input);
  requireExactKeys(
    requirePlainRecord(input, "event-triggered IABP candidate input"),
    CANDIDATE_INPUT_KEYS,
    "event-triggered IABP candidate input",
  );
  if (acceptedState.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("event-triggered IABP revision cannot increment safely");
  }
  const candidateTimeSec = requireNonnegativeFinite(
    input.candidateTimeSec,
    "event-triggered IABP candidate time",
  );
  if (!(candidateTimeSec > acceptedState.acceptedTimeSec)) {
    throw new Error("event-triggered IABP candidate must advance time");
  }
  const internalBoundary = nextTransitionBoundaryTime(acceptedState);
  if (internalBoundary !== null && candidateTimeSec > internalBoundary) {
    throw new Error(
      "event-triggered IABP candidate may not cross a transition boundary",
    );
  }
  validateDenseArray(
    input.capturedVentricularActivations,
    "candidate captured ventricular activations",
  );
  validateDenseArray(
    input.aorticValveClosures,
    "candidate aortic valve closures",
  );
  if (input.capturedVentricularActivations.length > 1) {
    throw new Error(
      "event-triggered IABP same-time batch may contain at most one ventricular activation",
    );
  }
  if (input.aorticValveClosures.length > 1) {
    throw new Error(
      "event-triggered IABP same-time batch may contain at most one aortic closure",
    );
  }
  const capturedVentricularActivation =
    input.capturedVentricularActivations[0] === undefined
      ? null
      : copyCapturedVentricularActivation(
        input.capturedVentricularActivations[0],
        "candidate captured ventricular activation",
      );
  const aorticValveClosure = input.aorticValveClosures[0] === undefined
    ? null
    : copyAorticValveClosure(input.aorticValveClosures[0]);
  if (
    capturedVentricularActivation !== null
    && capturedVentricularActivation.activationTimeSec !== candidateTimeSec
  ) {
    throw new Error(
      "captured ventricular activation must occur at candidate time",
    );
  }
  if (
    aorticValveClosure !== null
    && aorticValveClosure.closureTimeSec !== candidateTimeSec
  ) {
    throw new Error("aortic valve closure must occur at candidate time");
  }

  let currentCapturedVentricularActivation =
    acceptedState.currentCapturedVentricularActivation;
  let lastAcceptedAorticValveClosure =
    acceptedState.lastAcceptedAorticValveClosure;
  let acceptedVentricularActivationCount =
    acceptedState.acceptedVentricularActivationCount;
  let transitionMemory = acceptedState.transitionMemory;
  const activationAtBoundary = activationForTransition(
    transitionMemory,
    candidateTimeSec,
  );
  let inflationTransitionStarted = false;
  let deflationTransitionStarted = false;

  // A valid same-time batch closes the current beat before the next accepted
  // ventricular activation starts and forces deflation.
  if (aorticValveClosure !== null) {
    if (currentCapturedVentricularActivation === null) {
      throw new Error(
        "aortic valve closure requires a current captured ventricular activation",
      );
    }
    if (
      aorticValveClosure.parentCapturedVentricularActivationId
        !== currentCapturedVentricularActivation.capturedActivationId
    ) {
      throw new Error(
        "aortic valve closure parent does not match the current beat",
      );
    }
    if (
      !(aorticValveClosure.closureTimeSec
        > currentCapturedVentricularActivation.activationTimeSec)
    ) {
      throw new Error(
        "aortic valve closure must strictly follow its ventricular activation",
      );
    }
    if (
      lastAcceptedAorticValveClosure
        ?.parentCapturedVentricularActivationId
        === currentCapturedVentricularActivation.capturedActivationId
    ) {
      throw new Error("duplicate aortic valve closure for current beat");
    }
    if (
      lastAcceptedAorticValveClosure?.closureEventId
        === aorticValveClosure.closureEventId
    ) {
      throw new Error("duplicate aortic valve closure event id");
    }
    lastAcceptedAorticValveClosure = aorticValveClosure;
    if (isAssistedBeat(
      acceptedVentricularActivationCount,
      acceptedState.configuration.assistRatio,
    )) {
      transitionMemory = transitionForEvent(
        acceptedState.configuration,
        "inflation",
        candidateTimeSec,
        activationAtBoundary,
        currentCapturedVentricularActivation.capturedActivationId,
        aorticValveClosure.closureEventId,
      );
      inflationTransitionStarted = true;
    }
  }

  if (capturedVentricularActivation !== null) {
    if (currentCapturedVentricularActivation !== null) {
      if (
        capturedVentricularActivation.capturedActivationId
          === currentCapturedVentricularActivation.capturedActivationId
      ) {
        throw new Error("duplicate captured ventricular activation id");
      }
      if (
        !(capturedVentricularActivation.activationTimeSec
          > currentCapturedVentricularActivation.activationTimeSec)
      ) {
        throw new Error(
          "captured ventricular activations must be strictly time ordered",
        );
      }
      if (
        lastAcceptedAorticValveClosure
          ?.parentCapturedVentricularActivationId
          !== currentCapturedVentricularActivation.capturedActivationId
      ) {
        throw new Error(
          "new ventricular activation encountered before current beat aortic closure",
        );
      }
    }
    acceptedVentricularActivationCount = safeCounterAdd(
      acceptedVentricularActivationCount,
      1,
      "accepted ventricular activation count",
    );
    currentCapturedVentricularActivation = capturedVentricularActivation;
    transitionMemory = transitionForEvent(
      acceptedState.configuration,
      "deflation",
      candidateTimeSec,
      activationAtBoundary,
      capturedVentricularActivation.capturedActivationId,
      null,
    );
    deflationTransitionStarted = true;
  }

  const candidateState = deepFreeze({
    stateSchemaId: ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: acceptedState.configuration,
    initialAcceptedTimeSec: acceptedState.initialAcceptedTimeSec,
    revision: acceptedState.revision + 1,
    acceptedTimeSec: candidateTimeSec,
    acceptedVentricularActivationCount,
    currentCapturedVentricularActivation,
    lastAcceptedAorticValveClosure,
    transitionMemory,
  }) satisfies AcceptedEventTriggeredIabpActuatorStateV1;
  validateAcceptedEventTriggeredIabpActuatorStateV1(candidateState);
  const evaluation = evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
    candidateState,
    candidateTimeSec,
  );
  return deepFreeze({
    candidateSchemaId:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CANDIDATE_V1_ID,
    schemaVersion: 1 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    baseRevision: acceptedState.revision,
    candidateRevision: acceptedState.revision + 1,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec,
    capturedVentricularActivation,
    aorticValveClosure,
    closureProcessedBeforeVentricularActivation:
      aorticValveClosure !== null && capturedVentricularActivation !== null,
    inflationTransitionStarted,
    deflationTransitionStarted,
    evaluation,
    candidateState,
  });
}

export function commitAcceptedEventTriggeredIabpActuatorCandidateV1(
  acceptedState: AcceptedEventTriggeredIabpActuatorStateV1,
  candidate: AcceptedEventTriggeredIabpActuatorCandidateV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  const expected = evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
    acceptedState,
    {
      candidateTimeSec: candidate.candidateTimeSec,
      capturedVentricularActivations:
        candidate.capturedVentricularActivation === null
          ? []
          : [candidate.capturedVentricularActivation],
      aorticValveClosures: candidate.aorticValveClosure === null
        ? []
        : [candidate.aorticValveClosure],
    },
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "event-triggered IABP candidate does not match its accepted base",
    );
  }
  return expected.candidateState;
}

export function rollbackAcceptedEventTriggeredIabpActuatorCandidateV1(
  acceptedState: AcceptedEventTriggeredIabpActuatorStateV1,
  candidate: AcceptedEventTriggeredIabpActuatorCandidateV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  commitAcceptedEventTriggeredIabpActuatorCandidateV1(
    acceptedState,
    candidate,
  );
  return acceptedState;
}

export function evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  evaluationTimeSec = state.acceptedTimeSec,
): AcceptedEventTriggeredIabpActuatorEvaluationV1 {
  validateAcceptedEventTriggeredIabpActuatorStateV1(state);
  const time = requireNonnegativeFinite(
    evaluationTimeSec,
    "event-triggered IABP evaluation time",
  );
  if (time < state.acceptedTimeSec) {
    throw new Error(
      "event-triggered IABP evaluation time precedes accepted time",
    );
  }
  const activation01 = activationForTransition(state.transitionMemory, time);
  const balloonVolumeMl = evaluateIabpAorticExcludedVolumeLawV1(
    state.configuration.balloonVolumeMl,
    activation01,
  );
  return Object.freeze({
    evaluationSchemaId:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_EVALUATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: state.configuration.configurationId,
    ownerInstanceId: state.configuration.ownerInstanceId,
    evaluationTimeSec: time,
    activation01,
    balloonVolumeMl,
    aorticExcludedVolumeMl: balloonVolumeMl,
    placementNode: state.configuration.placementNode,
    acceptedVentricularActivationCount:
      state.acceptedVentricularActivationCount,
    currentBeatAssisted: isAssistedBeat(
      state.acceptedVentricularActivationCount,
      state.configuration.assistRatio,
    ),
    transitionKind: state.transitionMemory.transitionKind,
  });
}

/** Exact existing V1 excluded-volume law, separated from phase timing. */
export function evaluateIabpAorticExcludedVolumeLawV1(
  balloonVolumeMl: number,
  activation01: number,
): number {
  const volume = requireNonnegativeFinite(
    balloonVolumeMl,
    "IABP balloon volume",
  );
  const activation = requireUnitInterval(
    activation01,
    "IABP activation",
  );
  return volume * activation;
}

export function maximumAcceptedEventTriggeredIabpActuatorStepV1(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  requestedStepSec: number,
  nextAcceptedInputEventTimeSec: number | null,
): AcceptedEventTriggeredIabpActuatorMaximumStepV1 {
  validateAcceptedEventTriggeredIabpActuatorStateV1(state);
  const requested = requirePositiveFinite(
    requestedStepSec,
    "event-triggered IABP requested step",
  );
  const requestedEndTimeSec = safeFutureTime(
    state.acceptedTimeSec,
    requested,
    "event-triggered IABP requested end time",
  );
  const boundaries: Array<{
    owner: AcceptedEventTriggeredIabpActuatorMaximumStepV1["boundaryOwners"][number];
    timeSec: number;
  }> = [];
  const transitionBoundary = nextTransitionBoundaryTime(state);
  if (transitionBoundary !== null) {
    boundaries.push({
      owner: state.transitionMemory.transitionKind === "inflation"
        ? "inflation-transition-end"
        : "deflation-transition-end",
      timeSec: transitionBoundary,
    });
  }
  if (nextAcceptedInputEventTimeSec !== null) {
    const eventTime = requireNonnegativeFinite(
      nextAcceptedInputEventTimeSec,
      "next accepted IABP input event time",
    );
    if (!(eventTime > state.acceptedTimeSec)) {
      throw new Error("next accepted IABP input event must be future");
    }
    boundaries.push({ owner: "accepted-input-event", timeSec: eventTime });
  }
  const candidateTimeSec = Math.min(
    requestedEndTimeSec,
    ...boundaries.map((boundary) => boundary.timeSec),
  );
  const boundaryOwners = boundaries
    .filter((boundary) => boundary.timeSec === candidateTimeSec)
    .map((boundary) => boundary.owner)
    .sort();
  return Object.freeze({
    requestedStepSec: requested,
    requestedEndTimeSec,
    maximumStepSec: candidateTimeSec - state.acceptedTimeSec,
    candidateTimeSec,
    boundaryTimeSec: boundaryOwners.length === 0 ? null : candidateTimeSec,
    boundaryOwners: Object.freeze(boundaryOwners),
  });
}

export function validateAcceptedEventTriggeredIabpActuatorStateV1(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
): void {
  const record = requirePlainRecord(state, "event-triggered IABP state");
  requireExactKeys(record, STATE_KEYS, "event-triggered IABP state");
  canonicalJsonStringify(record);
  if (
    state.stateSchemaId !== ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID
    || state.schemaVersion !== 1
    || !Object.isFrozen(state)
  ) {
    throw new Error(
      "event-triggered IABP state schema or immutability is invalid",
    );
  }
  validateAcceptedEventTriggeredIabpActuatorConfigurationV1(
    state.configuration,
  );
  const initialTime = requireNonnegativeFinite(
    state.initialAcceptedTimeSec,
    "event-triggered IABP initial accepted time",
  );
  const acceptedTime = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "event-triggered IABP accepted time",
  );
  if (acceptedTime < initialTime) {
    throw new Error("event-triggered IABP accepted time precedes initialization");
  }
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "event-triggered IABP revision",
  );
  const count = requireNonnegativeSafeInteger(
    state.acceptedVentricularActivationCount,
    "event-triggered IABP ventricular activation count",
  );
  if (count > revision) {
    throw new Error(
      "event-triggered IABP activation count cannot exceed revision",
    );
  }
  if ((count === 0) !== (state.currentCapturedVentricularActivation === null)) {
    throw new Error(
      "event-triggered IABP current activation must agree with activation count",
    );
  }
  if (state.currentCapturedVentricularActivation !== null) {
    validateCapturedVentricularActivation(
      state.currentCapturedVentricularActivation,
      "event-triggered IABP current ventricular activation",
      true,
    );
    if (
      state.currentCapturedVentricularActivation.activationTimeSec
        > acceptedTime
    ) {
      throw new Error(
        "event-triggered IABP current activation follows accepted time",
      );
    }
  }
  if (state.lastAcceptedAorticValveClosure !== null) {
    validateAcceptedAorticValveClosureEventV1(
      state.lastAcceptedAorticValveClosure,
    );
    if (
      state.lastAcceptedAorticValveClosure.closureTimeSec > acceptedTime
    ) {
      throw new Error("event-triggered IABP closure follows accepted time");
    }
    if (state.currentCapturedVentricularActivation === null) {
      throw new Error(
        "event-triggered IABP closure requires activation history",
      );
    }
    if (
      state.lastAcceptedAorticValveClosure
        .parentCapturedVentricularActivationId
        === state.currentCapturedVentricularActivation.capturedActivationId
    ) {
      if (
        !(state.lastAcceptedAorticValveClosure.closureTimeSec
          > state.currentCapturedVentricularActivation.activationTimeSec)
      ) {
        throw new Error(
          "event-triggered IABP current-beat closure is out of order",
        );
      }
    } else if (
      state.lastAcceptedAorticValveClosure.closureTimeSec
        > state.currentCapturedVentricularActivation.activationTimeSec
    ) {
      throw new Error(
        "event-triggered IABP prior-beat closure follows current activation",
      );
    }
  }
  validateTransitionMemory(state.transitionMemory, state.configuration);
  if (state.transitionMemory.startTimeSec > acceptedTime) {
    throw new Error("event-triggered IABP transition starts after accepted time");
  }
  validateTransitionLineage(state);
}

function validateTransitionLineage(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
): void {
  const memory = state.transitionMemory;
  if (memory.transitionKind === "initialized-deflated") {
    if (
      state.acceptedVentricularActivationCount !== 0
      || memory.startTimeSec !== state.initialAcceptedTimeSec
      || memory.parentCapturedVentricularActivationId !== null
      || memory.parentAorticValveClosureEventId !== null
    ) {
      throw new Error(
        "initialized IABP transition cannot contain event lineage",
      );
    }
    return;
  }
  const current = state.currentCapturedVentricularActivation;
  if (
    current === null
    || memory.parentCapturedVentricularActivationId
      !== current.capturedActivationId
  ) {
    throw new Error(
      "event-triggered IABP transition ventricular lineage is split",
    );
  }
  if (memory.transitionKind === "deflation") {
    if (
      memory.startTimeSec !== current.activationTimeSec
      || memory.parentAorticValveClosureEventId !== null
    ) {
      throw new Error("IABP deflation transition cannot have closure lineage");
    }
    return;
  }
  const closure = state.lastAcceptedAorticValveClosure;
  if (
    closure === null
    || closure.parentCapturedVentricularActivationId
      !== current.capturedActivationId
    || memory.parentAorticValveClosureEventId !== closure.closureEventId
    || memory.startTimeSec !== closure.closureTimeSec
  ) {
    throw new Error("IABP inflation transition closure lineage is split");
  }
}

function initializedTransition(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
  acceptedTimeSec: number,
): AcceptedEventTriggeredIabpTransitionMemoryV1 {
  return Object.freeze({
    memorySchemaId: ACCEPTED_EVENT_TRIGGERED_IABP_TRANSITION_MEMORY_V1_ID,
    schemaVersion: 1 as const,
    transitionId: framedId("event-triggered-iabp-initialized-v1", [
      configuration.configurationId,
      configuration.ownerInstanceId,
      String(acceptedTimeSec),
    ]),
    transitionKind: "initialized-deflated" as const,
    startTimeSec: acceptedTimeSec,
    endTimeSec: acceptedTimeSec,
    durationSec: 0,
    startActivation01: 0,
    targetActivation01: 0 as const,
    parentCapturedVentricularActivationId: null,
    parentAorticValveClosureEventId: null,
  });
}

function transitionForEvent(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
  transitionKind: "inflation" | "deflation",
  startTimeSec: number,
  startActivation01: number,
  parentCapturedVentricularActivationId: string,
  parentAorticValveClosureEventId: string | null,
): AcceptedEventTriggeredIabpTransitionMemoryV1 {
  const durationSec = transitionKind === "inflation"
    ? configuration.inflationTransitionDurationSec
    : configuration.deflationTransitionDurationSec;
  const targetActivation01 = transitionKind === "inflation" ? 1 : 0;
  const endTimeSec = safeFutureTime(
    startTimeSec,
    durationSec,
    `event-triggered IABP ${transitionKind} end time`,
  );
  return Object.freeze({
    memorySchemaId: ACCEPTED_EVENT_TRIGGERED_IABP_TRANSITION_MEMORY_V1_ID,
    schemaVersion: 1 as const,
    transitionId: framedId(`event-triggered-iabp-${transitionKind}-v1`, [
      configuration.configurationId,
      configuration.ownerInstanceId,
      parentCapturedVentricularActivationId,
      parentAorticValveClosureEventId ?? "",
    ]),
    transitionKind,
    startTimeSec,
    endTimeSec,
    durationSec,
    startActivation01: requireUnitInterval(
      startActivation01,
      `${transitionKind} start activation`,
    ),
    targetActivation01,
    parentCapturedVentricularActivationId,
    parentAorticValveClosureEventId,
  });
}

function validateTransitionMemory(
  memory: AcceptedEventTriggeredIabpTransitionMemoryV1,
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): void {
  const record = requirePlainRecord(memory, "event-triggered IABP transition");
  requireExactKeys(record, TRANSITION_KEYS, "event-triggered IABP transition");
  canonicalJsonStringify(record);
  if (
    memory.memorySchemaId
      !== ACCEPTED_EVENT_TRIGGERED_IABP_TRANSITION_MEMORY_V1_ID
    || memory.schemaVersion !== 1
    || !Object.isFrozen(memory)
  ) {
    throw new Error("event-triggered IABP transition schema is invalid");
  }
  requireNonemptyString(memory.transitionId, "IABP transitionId");
  const start = requireNonnegativeFinite(memory.startTimeSec, "transition start");
  const end = requireNonnegativeFinite(memory.endTimeSec, "transition end");
  const duration = requireNonnegativeFinite(
    memory.durationSec,
    "transition duration",
  );
  requireUnitInterval(memory.startActivation01, "transition start activation");
  if (memory.targetActivation01 !== 0 && memory.targetActivation01 !== 1) {
    throw new Error("IABP transition target activation must be zero or one");
  }
  requireNullableNonemptyString(
    memory.parentCapturedVentricularActivationId,
    "transition parent ventricular activation id",
  );
  requireNullableNonemptyString(
    memory.parentAorticValveClosureEventId,
    "transition parent closure event id",
  );
  if (memory.transitionKind === "initialized-deflated") {
    if (
      duration !== 0
      || start !== end
      || memory.startActivation01 !== 0
      || memory.targetActivation01 !== 0
    ) {
      throw new Error("initialized IABP transition must be exactly deflated");
    }
    const expectedId = framedId("event-triggered-iabp-initialized-v1", [
      configuration.configurationId,
      configuration.ownerInstanceId,
      String(start),
    ]);
    if (memory.transitionId !== expectedId) {
      throw new Error("initialized IABP transition id is not canonical");
    }
    return;
  }
  if (memory.transitionKind !== "inflation"
      && memory.transitionKind !== "deflation") {
    throw new Error("IABP transition kind is invalid");
  }
  const expectedDuration = memory.transitionKind === "inflation"
    ? configuration.inflationTransitionDurationSec
    : configuration.deflationTransitionDurationSec;
  const expectedTarget = memory.transitionKind === "inflation" ? 1 : 0;
  if (
    duration !== expectedDuration
    || end !== start + duration
    || memory.targetActivation01 !== expectedTarget
  ) {
    throw new Error("IABP transition does not match explicit configuration");
  }
  const parentActivationId = requireNonemptyString(
    memory.parentCapturedVentricularActivationId,
    "transition parent ventricular activation id",
  );
  if (
    memory.transitionKind === "inflation"
      && memory.parentAorticValveClosureEventId === null
  ) {
    throw new Error("IABP inflation transition requires closure lineage");
  }
  if (
    memory.transitionKind === "deflation"
      && memory.parentAorticValveClosureEventId !== null
  ) {
    throw new Error("IABP deflation transition cannot have closure lineage");
  }
  const expectedId = framedId(
    `event-triggered-iabp-${memory.transitionKind}-v1`,
    [
      configuration.configurationId,
      configuration.ownerInstanceId,
      parentActivationId,
      memory.parentAorticValveClosureEventId ?? "",
    ],
  );
  if (memory.transitionId !== expectedId) {
    throw new Error("event-triggered IABP transition id is not canonical");
  }
}

function activationForTransition(
  memory: AcceptedEventTriggeredIabpTransitionMemoryV1,
  timeSec: number,
): number {
  const time = requireNonnegativeFinite(timeSec, "IABP transition evaluation time");
  if (time < memory.startTimeSec) {
    throw new Error("IABP transition evaluation precedes transition start");
  }
  if (memory.durationSec === 0 || time >= memory.endTimeSec) {
    return memory.targetActivation01;
  }
  const progress01 = (time - memory.startTimeSec) / memory.durationSec;
  const eased = smoothstep01(progress01);
  return memory.startActivation01
    + (memory.targetActivation01 - memory.startActivation01) * eased;
}

function nextTransitionBoundaryTime(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
): number | null {
  return state.transitionMemory.transitionKind !== "initialized-deflated"
      && state.transitionMemory.endTimeSec > state.acceptedTimeSec
    ? state.transitionMemory.endTimeSec
    : null;
}

function isAssistedBeat(
  acceptedVentricularActivationCount: number,
  assistRatio: AcceptedEventTriggeredIabpAssistRatioV1,
): boolean {
  requireNonnegativeSafeInteger(
    acceptedVentricularActivationCount,
    "accepted ventricular activation count",
  );
  if (acceptedVentricularActivationCount === 0) return false;
  return (acceptedVentricularActivationCount - 1) % assistRatio === 0;
}

function copyConfiguration(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): AcceptedEventTriggeredIabpActuatorConfigurationV1 {
  validateAcceptedEventTriggeredIabpActuatorConfigurationV1(configuration);
  return createAcceptedEventTriggeredIabpActuatorConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    assistRatio: configuration.assistRatio,
    balloonVolumeMl: configuration.balloonVolumeMl,
    inflationTransitionDurationSec:
      configuration.inflationTransitionDurationSec,
    deflationTransitionDurationSec:
      configuration.deflationTransitionDurationSec,
    placementNode: configuration.placementNode,
  });
}

function copyAorticValveClosure(
  event: AcceptedAorticValveClosureEventV1,
): AcceptedAorticValveClosureEventV1 {
  validateAcceptedAorticValveClosureEventV1(event);
  return createAcceptedAorticValveClosureEventV1({
    closureEventId: event.closureEventId,
    parentCapturedVentricularActivationId:
      event.parentCapturedVentricularActivationId,
    closureTimeSec: event.closureTimeSec,
    valveId: event.valveId,
  });
}

function copyCapturedVentricularActivation(
  activation: CapturedElectricalActivationV2,
  field: string,
): CapturedElectricalActivationV2 {
  validateCapturedVentricularActivation(activation, field, false);
  return Object.freeze({ ...activation });
}

function validateCapturedVentricularActivation(
  activation: CapturedElectricalActivationV2,
  field: string,
  requireFrozen: boolean,
): void {
  const record = requirePlainRecord(activation, field);
  requireExactKeys(record, CAPTURED_ACTIVATION_KEYS, field);
  canonicalJsonStringify(record);
  if (
    activation.activationSchemaId !== CAPTURED_ELECTRICAL_ACTIVATION_V2_ID
    || activation.schemaVersion !== 2
    || activation.chamber !== "ventricular"
  ) {
    throw new Error(`${field} schema or chamber is invalid`);
  }
  if (requireFrozen && !Object.isFrozen(activation)) {
    throw new Error(`${field} must be immutable`);
  }
  requireNonemptyString(activation.capturedActivationId, `${field} id`);
  requireNonemptyString(
    activation.parentSourceImpulseId,
    `${field} parent source impulse id`,
  );
  requireNullableNonemptyString(
    activation.upstreamCapturedActivationId,
    `${field} upstream activation id`,
  );
  requireNonemptyString(activation.gateInstanceId, `${field} gate instance id`);
  requireNonnegativeFinite(activation.activationTimeSec, `${field} time`);
  const sourceKind = requireVentricularSourceKind(
    activation.sourceKind,
    `${field} source kind`,
  );
  requireNonemptyString(activation.sourceId, `${field} source id`);
  requireNonnegativeSafeInteger(
    activation.sourceSequence,
    `${field} source sequence`,
  );
  if (activation.capturePriority !== ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind]) {
    throw new Error(`${field} capture priority does not match source kind`);
  }
  if (!Number.isSafeInteger(activation.captureOrdinal)
      || activation.captureOrdinal < 1) {
    throw new Error(`${field} capture ordinal must be a positive safe integer`);
  }
  if (!Number.isSafeInteger(activation.ownerRevision)
      || activation.ownerRevision < 1) {
    throw new Error(`${field} owner revision must be a positive safe integer`);
  }
  if (sourceKind === "av-output"
      && activation.upstreamCapturedActivationId === null) {
    throw new Error(`${field} AV output requires upstream atrial lineage`);
  }
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
  ) {
    throw new Error(`${field} is not a ventricular source kind`);
  }
  return value;
}

function smoothstep01(value: number): number {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

function safeCounterAdd(value: number, increment: 1, field: string): number {
  requireNonnegativeSafeInteger(value, field);
  const result = value + increment;
  if (!Number.isSafeInteger(result)) {
    throw new Error(`${field} cannot be incremented safely`);
  }
  return result;
}

function safeFutureTime(timeSec: number, durationSec: number, field: string): number {
  const future = timeSec + durationSec;
  if (!Number.isFinite(future) || !(future > timeSec)) {
    throw new Error(`${field} must advance to a finite time`);
  }
  return future;
}

function framedId(prefix: string, fields: readonly string[]): string {
  return `${prefix}:${fields.map((field) => `${field.length}:${field}`).join(":")}`;
}

function assertCanonicalEqual(
  actual: unknown,
  expected: unknown,
  message: string,
): void {
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw new Error(message);
  }
}

function validateDenseArray(value: unknown, field: string): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new Error(`${field} must be dense`);
    }
  }
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
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
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function requireAssistRatio(
  value: unknown,
): AcceptedEventTriggeredIabpAssistRatioV1 {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new Error("event-triggered IABP assistRatio must be 1, 2, or 3");
  }
  return value;
}

function requirePlacementNode(value: unknown): "SA" {
  if (value !== "SA") {
    throw new Error("event-triggered IABP placementNode must be SA");
  }
  return value;
}

function requireAorticValveId(value: unknown): "AoV" {
  if (value !== "AoV") throw new Error("closure valveId must be AoV");
  return value;
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a nonempty string`);
  }
  return value;
}

function requireNullableNonemptyString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return requireNonemptyString(value, field);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return Object.is(value, -0) ? 0 : value;
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

function requireUnitInterval(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0 || finite > 1) {
    throw new Error(`${field} must be in [0, 1]`);
  }
  return finite;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
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

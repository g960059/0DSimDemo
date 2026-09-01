import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
  type ElectricalImpulseSourceKindV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { canonicalJsonStringify } from "@/engine/integrity";

/**
 * One-state accepted-ventricular interval-strength boundary.
 *
 * The owner consumes only a downstream CapturedElectricalActivationV2. It
 * returns lineage-bound relative-strength metadata for a future exact-event
 * calcium deposit, but it neither owns nor mutates a calcium state.
 */

export const VENTRICULAR_INTERVAL_STRENGTH_PARAMETER_PROVENANCE_V1_ID =
  "ventricular-interval-strength-parameter-provenance-v1" as const;
export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CONFIGURATION_V1_ID =
  "accepted-ventricular-interval-strength-configuration-v1" as const;
export const VENTRICULAR_INTERVAL_STRENGTH_STEADY_REFERENCE_V1_ID =
  "ventricular-interval-strength-steady-reference-v1" as const;
export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID =
  "accepted-ventricular-interval-strength-state-v1" as const;
export const VENTRICULAR_INTERVAL_STRENGTH_DEPOSIT_METADATA_V1_ID =
  "ventricular-interval-strength-deposit-metadata-v1" as const;
export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CANDIDATE_V1_ID =
  "accepted-ventricular-interval-strength-candidate-v1" as const;

/**
 * Canonical precision for transcendental-derived interval-strength values.
 *
 * `Math.expm1` may differ by a few ULPs across ECMAScript hosts. Recovery
 * fractions are persisted inside exact checkpoint metadata and are later
 * recomputed during admission, so they cross a model-owned decimal boundary
 * before entering that exact identity. Twelve significant digits retain much
 * more precision than the component priors justify while making the persisted
 * equation portable between Node, Chromium, and Safari.
 */
export const VENTRICULAR_INTERVAL_STRENGTH_CANONICAL_SIGNIFICANT_DIGITS_V1 = 12;

export function canonicalizeDerivedVentricularIntervalStrengthValueV1(
  value: number,
): number {
  const finite = requireNonnegativeFinite(
    value,
    "derived interval-strength value",
  );
  const canonical = Number(
    finite.toPrecision(
      VENTRICULAR_INTERVAL_STRENGTH_CANONICAL_SIGNIFICANT_DIGITS_V1,
    ),
  );
  return Object.is(canonical, -0) ? 0 : canonical;
}

export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1 = deepFreeze({
  scope: "one-scalar-accepted-ventricular-interval-strength-memory" as const,
  equation: Object.freeze({
    recovery: "a=1-exp(-deltaT/tau)" as const,
    release: "R=a*beta*S_previous" as const,
    intervalInflux: "I=gamma*(1-h*a)" as const,
    stateUpdate: "S_new=S_previous-R+r*R+I" as const,
    normalizedGamma:
      "gamma=(1-r)/(1-h*a_reference)" as const,
    normalizedReferenceLoad: "S_reference=1/(a_reference*beta)" as const,
  }),
  acceptedInput:
    "one-actually-captured-ventricular-CapturedElectricalActivationV2" as const,
  rejectedSourceImpulsesConsumed: false as const,
  refractoryBlockedSourceImpulsesConsumed: false as const,
  coincidentSuppressedSourceImpulsesConsumed: false as const,
  acceptedOwnerTime: "nonnegative-finite-seconds" as const,
  priorCapturedVentricularHistoryTime: "signed-finite-seconds" as const,
  eventBoundary:
    "capture-time-at-or-after-owner-clock-and-strictly-after-prior-capture" as const,
  output:
    "lineage-bound-relative-strength-metadata-for-future-exact-calcium-deposit" as const,
  calciumStateMutationPerformed: false as const,
  parameterDefaultsProvided: false as const,
  parameterPolicy: "all-five-numeric-parameters-explicit" as const,
  referenceFixedPoint:
    "repeated-reference-cycle-deposits-exactly-one-and-retains-reference-load" as const,
  evidenceRoles: Object.freeze({
    equationConstruction: Object.freeze([
      "doi:10.1152/ajpheart.2000.278.3.H913",
      "doi:10.1113/jphysiol.1986.sp016167",
    ] as const),
    inspectedHumanTissueContext:
      "doi:10.1172/JCI114611" as const,
    evidenceBoundary:
      "Rice-and-Wier-Yue-ferret-cellular-work-is-construction;Gwathmey-human-tissue-was-inspected-before-profile-parameter-freeze-and-is-not-held-out" as const,
    independentHumanTissueValidationEstablished: false as const,
  }),
  absoluteHumanCellularCalciumClaimed: false as const,
  heartFailureOrRemodelingClaimed: false as const,
  alternansGuaranteeClaimed: false as const,
  patientCalibrationClaimed: false as const,
  clinicalValidityClaimed: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
});

export type VentricularIntervalStrengthParameterProvenanceKindV1 =
  | "explicit-research-parameters"
  | "literature-component-reproduction";

export type VentricularIntervalStrengthParameterProvenanceInputV1 = Readonly<{
  kind: VentricularIntervalStrengthParameterProvenanceKindV1;
  /** Stable authored-input or citation-set identifier, never a hidden default. */
  sourceId: string;
}>;

export type VentricularIntervalStrengthParameterProvenanceV1 = Readonly<{
  provenanceSchemaId:
    typeof VENTRICULAR_INTERVAL_STRENGTH_PARAMETER_PROVENANCE_V1_ID;
  schemaVersion: 1;
  kind: VentricularIntervalStrengthParameterProvenanceKindV1;
  sourceId: string;
}>;

export type AcceptedVentricularIntervalStrengthConfigurationInputV1 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  parameterProvenance: VentricularIntervalStrengthParameterProvenanceInputV1;
  /** tau > 0, seconds. */
  recoveryTimeConstantSec: number;
  /** 0 < beta <= 1. */
  releaseFractionBeta: number;
  /** 0 <= r < 1. */
  releasedLoadReturnFractionR: number;
  /** 0 <= h < 1. */
  intervalInfluxInhibitionFractionH: number;
  /** Explicit normalization cycle length T_reference > 0, seconds. */
  referenceCycleLengthSec: number;
}>;

export type AcceptedVentricularIntervalStrengthConfigurationV1 = Readonly<{
  configurationSchemaId:
    typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CONFIGURATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  parameterProvenance: VentricularIntervalStrengthParameterProvenanceV1;
  recoveryTimeConstantSec: number;
  releaseFractionBeta: number;
  releasedLoadReturnFractionR: number;
  intervalInfluxInhibitionFractionH: number;
  referenceCycleLengthSec: number;
  /** a_reference = 1 - exp(-T_reference / tau). */
  referenceRecoveryFractionA: number;
  /** S_reference = 1 / (a_reference * beta). */
  referenceNormalizedSrLoadState: number;
  /** gamma = (1-r) / (1-h*a_reference). */
  normalizedIntervalInfluxGamma: number;
}>;

export type VentricularIntervalStrengthSteadyReferenceV1 = Readonly<{
  steadyReferenceSchemaId:
    typeof VENTRICULAR_INTERVAL_STRENGTH_STEADY_REFERENCE_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  referenceCycleLengthSec: number;
  referenceRecoveryFractionA: number;
  referenceNormalizedSrLoadState: number;
  normalizedIntervalInfluxGamma: number;
  depositedRelativeStrength: 1;
  intervalInfluxRelativeLoad: number;
  nextNormalizedSrLoadState: number;
}>;

export type AcceptedVentricularIntervalStrengthInitialStateInputV1 = Readonly<{
  /** Nonnegative owner clock. */
  acceptedTimeSec: number;
  /** Explicit positive finite normalized SR-load scalar. */
  initialNormalizedSrLoadState: number;
  /** Full accepted lineage; activationTimeSec may be negative history. */
  priorAcceptedVentricularActivation: CapturedElectricalActivationV2;
}>;

export type VentricularIntervalStrengthDepositMetadataV1 = Readonly<{
  metadataSchemaId:
    typeof VENTRICULAR_INTERVAL_STRENGTH_DEPOSIT_METADATA_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  ownerRevision: number;
  acceptedVentricularCaptureOrdinal: number;
  previousCapturedActivationId: string;
  previousCapturedActivationTimeSec: number;
  capturedVentricularActivation: CapturedElectricalActivationV2;
  intervalSec: number;
  recoveryFractionA: number;
  normalizedSrLoadBefore: number;
  releasedRelativeStrengthR: number;
  returnedReleasedRelativeLoad: number;
  intervalInfluxRelativeLoad: number;
  normalizedSrLoadAfter: number;
  /** The scale to apply to the future existing exact-event Ca deposit. */
  futureExactCalciumDepositRelativeStrength: number;
  calciumStateMutation: "none-metadata-only";
}>;

export type AcceptedVentricularIntervalStrengthStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1;
  initialAcceptedTimeSec: number;
  initialNormalizedSrLoadState: number;
  initialPriorAcceptedVentricularActivation:
    CapturedElectricalActivationV2;
  revision: number;
  acceptedTimeSec: number;
  acceptedVentricularCaptureCount: number;
  normalizedSrLoadState: number;
  lastAcceptedVentricularActivation: CapturedElectricalActivationV2;
  lastDepositMetadata: VentricularIntervalStrengthDepositMetadataV1 | null;
}>;

export type AcceptedVentricularIntervalStrengthCandidateInputV1 = Readonly<{
  acceptedVentricularActivation: CapturedElectricalActivationV2;
}>;

export type AcceptedVentricularIntervalStrengthCandidateV1 = Readonly<{
  candidateSchemaId:
    typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CANDIDATE_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  depositMetadata: VentricularIntervalStrengthDepositMetadataV1;
  candidateState: AcceptedVentricularIntervalStrengthStateV1;
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
  "recoveryTimeConstantSec",
  "releaseFractionBeta",
  "releasedLoadReturnFractionR",
  "intervalInfluxInhibitionFractionH",
  "referenceCycleLengthSec",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  ...CONFIGURATION_INPUT_KEYS,
  "referenceRecoveryFractionA",
  "referenceNormalizedSrLoadState",
  "normalizedIntervalInfluxGamma",
] as const);
const INITIAL_STATE_INPUT_KEYS = Object.freeze([
  "acceptedTimeSec",
  "initialNormalizedSrLoadState",
  "priorAcceptedVentricularActivation",
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
const DEPOSIT_METADATA_KEYS = Object.freeze([
  "metadataSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "ownerRevision",
  "acceptedVentricularCaptureOrdinal",
  "previousCapturedActivationId",
  "previousCapturedActivationTimeSec",
  "capturedVentricularActivation",
  "intervalSec",
  "recoveryFractionA",
  "normalizedSrLoadBefore",
  "releasedRelativeStrengthR",
  "returnedReleasedRelativeLoad",
  "intervalInfluxRelativeLoad",
  "normalizedSrLoadAfter",
  "futureExactCalciumDepositRelativeStrength",
  "calciumStateMutation",
] as const);
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initialAcceptedTimeSec",
  "initialNormalizedSrLoadState",
  "initialPriorAcceptedVentricularActivation",
  "revision",
  "acceptedTimeSec",
  "acceptedVentricularCaptureCount",
  "normalizedSrLoadState",
  "lastAcceptedVentricularActivation",
  "lastDepositMetadata",
] as const);
const CANDIDATE_INPUT_KEYS = Object.freeze([
  "acceptedVentricularActivation",
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
  "depositMetadata",
  "candidateState",
] as const);

export function createAcceptedVentricularIntervalStrengthConfigurationV1(
  input: AcceptedVentricularIntervalStrengthConfigurationInputV1,
): AcceptedVentricularIntervalStrengthConfigurationV1 {
  const record = requirePlainRecord(input, "interval-strength configuration input");
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "interval-strength configuration input",
  );
  const provenance = copyParameterProvenanceInput(input.parameterProvenance);
  const recoveryTimeConstantSec = requirePositiveFinite(
    input.recoveryTimeConstantSec,
    "interval-strength recoveryTimeConstantSec",
  );
  const releaseFractionBeta = requireOpenClosedUnitInterval(
    input.releaseFractionBeta,
    "interval-strength releaseFractionBeta",
  );
  const releasedLoadReturnFractionR = requireClosedOpenUnitInterval(
    input.releasedLoadReturnFractionR,
    "interval-strength releasedLoadReturnFractionR",
  );
  const intervalInfluxInhibitionFractionH = requireClosedOpenUnitInterval(
    input.intervalInfluxInhibitionFractionH,
    "interval-strength intervalInfluxInhibitionFractionH",
  );
  const referenceCycleLengthSec = requirePositiveFinite(
    input.referenceCycleLengthSec,
    "interval-strength referenceCycleLengthSec",
  );
  const derived = deriveReferenceValues(
    recoveryTimeConstantSec,
    releaseFractionBeta,
    releasedLoadReturnFractionR,
    intervalInfluxInhibitionFractionH,
    referenceCycleLengthSec,
  );

  return Object.freeze({
    configurationSchemaId:
      ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "interval-strength configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "interval-strength ownerInstanceId",
    ),
    parameterProvenance: provenance,
    recoveryTimeConstantSec,
    releaseFractionBeta,
    releasedLoadReturnFractionR,
    intervalInfluxInhibitionFractionH,
    referenceCycleLengthSec,
    referenceRecoveryFractionA: derived.referenceRecoveryFractionA,
    referenceNormalizedSrLoadState:
      derived.referenceNormalizedSrLoadState,
    normalizedIntervalInfluxGamma: derived.normalizedIntervalInfluxGamma,
  });
}

/** Returns the exact normalized fixed point; it does not choose parameters. */
export function deriveVentricularIntervalStrengthSteadyReferenceV1(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
): VentricularIntervalStrengthSteadyReferenceV1 {
  validateAcceptedVentricularIntervalStrengthConfigurationV1(configuration);
  return Object.freeze({
    steadyReferenceSchemaId:
      VENTRICULAR_INTERVAL_STRENGTH_STEADY_REFERENCE_V1_ID,
    schemaVersion: 1 as const,
    configurationId: configuration.configurationId,
    referenceCycleLengthSec: configuration.referenceCycleLengthSec,
    referenceRecoveryFractionA: configuration.referenceRecoveryFractionA,
    referenceNormalizedSrLoadState:
      configuration.referenceNormalizedSrLoadState,
    normalizedIntervalInfluxGamma:
      configuration.normalizedIntervalInfluxGamma,
    depositedRelativeStrength: 1 as const,
    intervalInfluxRelativeLoad:
      1 - configuration.releasedLoadReturnFractionR,
    nextNormalizedSrLoadState:
      configuration.referenceNormalizedSrLoadState,
  });
}

export function initializeAcceptedVentricularIntervalStrengthStateV1(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
  input: AcceptedVentricularIntervalStrengthInitialStateInputV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  const ownedConfiguration = copyConfiguration(configuration);
  const record = requirePlainRecord(input, "interval-strength initial state input");
  requireExactKeys(
    record,
    INITIAL_STATE_INPUT_KEYS,
    "interval-strength initial state input",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "interval-strength initial acceptedTimeSec",
  );
  const initialNormalizedSrLoadState = requirePositiveFinite(
    input.initialNormalizedSrLoadState,
    "interval-strength initial normalized SR load",
  );
  const prior = copyCapturedVentricularActivation(
    input.priorAcceptedVentricularActivation,
    "interval-strength prior accepted ventricular activation",
  );
  if (prior.activationTimeSec > acceptedTimeSec) {
    throw new Error(
      "prior accepted ventricular activation exceeds accepted owner time",
    );
  }

  const state = Object.freeze({
    stateSchemaId: ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: ownedConfiguration,
    initialAcceptedTimeSec: acceptedTimeSec,
    initialNormalizedSrLoadState,
    initialPriorAcceptedVentricularActivation: prior,
    revision: 0,
    acceptedTimeSec,
    acceptedVentricularCaptureCount: 0,
    normalizedSrLoadState: initialNormalizedSrLoadState,
    lastAcceptedVentricularActivation: prior,
    lastDepositMetadata: null,
  });
  validateAcceptedVentricularIntervalStrengthStateV1(state);
  return state;
}

/** Convenience initializer at S_reference; all timing and lineage stay explicit. */
export function initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
  input: Readonly<{
    acceptedTimeSec: number;
    priorAcceptedVentricularActivation: CapturedElectricalActivationV2;
  }>,
): AcceptedVentricularIntervalStrengthStateV1 {
  const record = requirePlainRecord(
    input,
    "interval-strength steady-reference initial input",
  );
  requireExactKeys(
    record,
    ["acceptedTimeSec", "priorAcceptedVentricularActivation"],
    "interval-strength steady-reference initial input",
  );
  const reference = deriveVentricularIntervalStrengthSteadyReferenceV1(
    configuration,
  );
  return initializeAcceptedVentricularIntervalStrengthStateV1(configuration, {
    acceptedTimeSec: input.acceptedTimeSec,
    initialNormalizedSrLoadState: reference.referenceNormalizedSrLoadState,
    priorAcceptedVentricularActivation:
      input.priorAcceptedVentricularActivation,
  });
}

/**
 * Rebinds only the cycle-length reference normalization at one accepted
 * boundary. Capture lineage, counters, and clock are retained. The current
 * normalized SR-load is retained to the nearest target-coordinate Float64,
 * and the last-transition audit is expressed in that target normalization so
 * the rebound state remains independently exact-validatable.
 */
export function rebindAcceptedVentricularIntervalStrengthReferenceV1(
  state: AcceptedVentricularIntervalStrengthStateV1,
  targetConfiguration: AcceptedVentricularIntervalStrengthConfigurationV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  validateAcceptedVentricularIntervalStrengthStateV1(state);
  validateAcceptedVentricularIntervalStrengthConfigurationV1(
    targetConfiguration,
  );
  assertReferenceOnlyRebindV1(state.configuration, targetConfiguration);
  if (
    canonicalJsonStringify(state.configuration)
      === canonicalJsonStringify(targetConfiguration)
  ) {
    return state;
  }

  const ownedTarget = copyConfiguration(targetConfiguration);
  if (state.lastDepositMetadata === null) {
    const rebound = Object.freeze({
      ...state,
      configuration: ownedTarget,
    });
    validateAcceptedVentricularIntervalStrengthStateV1(rebound);
    return rebound;
  }

  const sourceMetadata = state.lastDepositMetadata;
  const currentLoad = state.normalizedSrLoadState;
  const intervalSec = requirePositiveComputedFinite(
    sourceMetadata.capturedVentricularActivation.activationTimeSec
      - sourceMetadata.previousCapturedActivationTimeSec,
    "interval-strength rebound captured interval",
  );
  const recoveryFractionA = computeRecoveryFraction(
    intervalSec,
    ownedTarget.recoveryTimeConstantSec,
    "interval-strength rebound recovery fraction",
  );
  const retainedLoadGain = requirePositiveComputedFinite(
    1 - (1 - ownedTarget.releasedLoadReturnFractionR)
      * recoveryFractionA * ownedTarget.releaseFractionBeta,
    "interval-strength rebound retained-load gain",
  );
  const intervalInflux = requirePositiveComputedFinite(
    ownedTarget.normalizedIntervalInfluxGamma
      * (1 - ownedTarget.intervalInfluxInhibitionFractionH
        * recoveryFractionA),
    "interval-strength rebound interval influx",
  );
  let normalizedSrLoadBefore = requirePositiveComputedFinite(
    (currentLoad - intervalInflux) / retainedLoadGain,
    "interval-strength rebound prior normalized SR load",
  );
  let reboundMetadata = buildDepositMetadataFromPriorLineage(
    ownedTarget,
    state.revision,
    state.acceptedVentricularCaptureCount,
    sourceMetadata.previousCapturedActivationId,
    sourceMetadata.previousCapturedActivationTimeSec,
    state.lastAcceptedVentricularActivation,
    normalizedSrLoadBefore,
  );
  for (
    let correction = 0;
    reboundMetadata.normalizedSrLoadAfter !== currentLoad && correction < 8;
    correction += 1
  ) {
    normalizedSrLoadBefore = requirePositiveComputedFinite(
      normalizedSrLoadBefore
        + (currentLoad - reboundMetadata.normalizedSrLoadAfter)
          / retainedLoadGain,
      "interval-strength rebound corrected prior normalized SR load",
    );
    reboundMetadata = buildDepositMetadataFromPriorLineage(
      ownedTarget,
      state.revision,
      state.acceptedVentricularCaptureCount,
      sourceMetadata.previousCapturedActivationId,
      sourceMetadata.previousCapturedActivationTimeSec,
      state.lastAcceptedVentricularActivation,
      normalizedSrLoadBefore,
    );
  }
  let lowerBefore = normalizedSrLoadBefore;
  let upperBefore = normalizedSrLoadBefore;
  for (
    let adjacent = 0;
    reboundMetadata.normalizedSrLoadAfter !== currentLoad && adjacent < 64;
    adjacent += 1
  ) {
    lowerBefore = adjacentFiniteFloat64V1(lowerBefore, -1);
    upperBefore = adjacentFiniteFloat64V1(upperBefore, 1);
    for (const candidateBefore of [lowerBefore, upperBefore]) {
      if (!(candidateBefore > 0)) continue;
      const candidateMetadata = buildDepositMetadataFromPriorLineage(
        ownedTarget,
        state.revision,
        state.acceptedVentricularCaptureCount,
        sourceMetadata.previousCapturedActivationId,
        sourceMetadata.previousCapturedActivationTimeSec,
        state.lastAcceptedVentricularActivation,
        candidateBefore,
      );
      if (candidateMetadata.normalizedSrLoadAfter === currentLoad) {
        normalizedSrLoadBefore = candidateBefore;
        reboundMetadata = candidateMetadata;
        break;
      }
    }
  }
  const reboundLoad = reboundMetadata.normalizedSrLoadAfter;
  const reboundLoadTolerance = 8 * Number.EPSILON
    * Math.max(1, Math.abs(currentLoad), Math.abs(reboundLoad));
  if (Math.abs(reboundLoad - currentLoad) > reboundLoadTolerance) {
    throw new Error(
      "interval-strength reference rebind cannot retain the accepted SR load",
    );
  }

  const rebound = Object.freeze({
    ...state,
    configuration: ownedTarget,
    normalizedSrLoadState: reboundLoad,
    lastDepositMetadata: reboundMetadata,
  });
  validateAcceptedVentricularIntervalStrengthStateV1(rebound);
  return rebound;
}

export function evaluateAcceptedVentricularIntervalStrengthCandidateV1(
  acceptedState: AcceptedVentricularIntervalStrengthStateV1,
  input: AcceptedVentricularIntervalStrengthCandidateInputV1,
): AcceptedVentricularIntervalStrengthCandidateV1 {
  validateAcceptedVentricularIntervalStrengthStateV1(acceptedState);
  const record = requirePlainRecord(input, "interval-strength candidate input");
  requireExactKeys(record, CANDIDATE_INPUT_KEYS, "interval-strength candidate input");
  if (acceptedState.revision === Number.MAX_SAFE_INTEGER) {
    throw new Error("interval-strength revision cannot be incremented safely");
  }
  const captured = copyCapturedVentricularActivation(
    input.acceptedVentricularActivation,
    "interval-strength accepted ventricular activation",
  );
  const candidateTimeSec = requireNonnegativeFinite(
    captured.activationTimeSec,
    "interval-strength candidate activation time",
  );
  if (candidateTimeSec < acceptedState.acceptedTimeSec) {
    throw new Error(
      "interval-strength candidate time precedes accepted owner time",
    );
  }
  const previous = acceptedState.lastAcceptedVentricularActivation;
  if (candidateTimeSec <= previous.activationTimeSec) {
    throw new Error(
      "accepted ventricular activation must be strictly after prior capture",
    );
  }
  if (captured.capturedActivationId === previous.capturedActivationId) {
    throw new Error("accepted ventricular activation id must not repeat");
  }

  const candidateRevision = acceptedState.revision + 1;
  const depositMetadata = buildDepositMetadata(
    acceptedState.configuration,
    candidateRevision,
    acceptedState.acceptedVentricularCaptureCount + 1,
    previous,
    captured,
    acceptedState.normalizedSrLoadState,
  );
  const candidateState = Object.freeze({
    stateSchemaId: ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: acceptedState.configuration,
    initialAcceptedTimeSec: acceptedState.initialAcceptedTimeSec,
    initialNormalizedSrLoadState:
      acceptedState.initialNormalizedSrLoadState,
    initialPriorAcceptedVentricularActivation:
      acceptedState.initialPriorAcceptedVentricularActivation,
    revision: candidateRevision,
    acceptedTimeSec: candidateTimeSec,
    acceptedVentricularCaptureCount:
      acceptedState.acceptedVentricularCaptureCount + 1,
    normalizedSrLoadState: depositMetadata.normalizedSrLoadAfter,
    lastAcceptedVentricularActivation: captured,
    lastDepositMetadata: depositMetadata,
  });

  const candidate = Object.freeze({
    candidateSchemaId:
      ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CANDIDATE_V1_ID,
    schemaVersion: 1 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    baseRevision: acceptedState.revision,
    candidateRevision,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec,
    depositMetadata,
    candidateState,
  });
  validateAcceptedVentricularIntervalStrengthStateV1(candidateState);
  return candidate;
}

export function commitAcceptedVentricularIntervalStrengthCandidateV1(
  acceptedState: AcceptedVentricularIntervalStrengthStateV1,
  candidate: AcceptedVentricularIntervalStrengthCandidateV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  validateAcceptedVentricularIntervalStrengthStateV1(acceptedState);
  validateCandidateShape(candidate);
  const expected = evaluateAcceptedVentricularIntervalStrengthCandidateV1(
    acceptedState,
    Object.freeze({
      acceptedVentricularActivation:
        candidate.depositMetadata.capturedVentricularActivation,
    }),
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "interval-strength candidate does not match its accepted base",
    );
  }
  return expected.candidateState;
}

export function rollbackAcceptedVentricularIntervalStrengthCandidateV1(
  acceptedState: AcceptedVentricularIntervalStrengthStateV1,
  candidate: AcceptedVentricularIntervalStrengthCandidateV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  validateAcceptedVentricularIntervalStrengthStateV1(acceptedState);
  validateCandidateShape(candidate);
  const expected = evaluateAcceptedVentricularIntervalStrengthCandidateV1(
    acceptedState,
    Object.freeze({
      acceptedVentricularActivation:
        candidate.depositMetadata.capturedVentricularActivation,
    }),
  );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "interval-strength candidate does not match its accepted base",
    );
  }
  return acceptedState;
}

export function validateAcceptedVentricularIntervalStrengthConfigurationV1(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
): void {
  const record = requirePlainRecord(configuration, "interval-strength configuration");
  requireExactKeys(record, CONFIGURATION_KEYS, "interval-strength configuration");
  if (
    configuration.configurationSchemaId
      !== ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CONFIGURATION_V1_ID
    || configuration.schemaVersion !== 1
  ) {
    throw new Error("interval-strength configuration identity is invalid");
  }
  if (!Object.isFrozen(configuration)
    || !Object.isFrozen(configuration.parameterProvenance)) {
    throw new Error("interval-strength configuration must be recursively immutable");
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(configuration.ownerInstanceId, "owner instance id");
  validateParameterProvenance(configuration.parameterProvenance);
  const tau = requirePositiveFinite(
    configuration.recoveryTimeConstantSec,
    "configuration recoveryTimeConstantSec",
  );
  const beta = requireOpenClosedUnitInterval(
    configuration.releaseFractionBeta,
    "configuration releaseFractionBeta",
  );
  const r = requireClosedOpenUnitInterval(
    configuration.releasedLoadReturnFractionR,
    "configuration releasedLoadReturnFractionR",
  );
  const h = requireClosedOpenUnitInterval(
    configuration.intervalInfluxInhibitionFractionH,
    "configuration intervalInfluxInhibitionFractionH",
  );
  const referenceCycle = requirePositiveFinite(
    configuration.referenceCycleLengthSec,
    "configuration referenceCycleLengthSec",
  );
  const expected = deriveReferenceValues(tau, beta, r, h, referenceCycle);
  if (
    configuration.referenceRecoveryFractionA
      !== expected.referenceRecoveryFractionA
    || configuration.referenceNormalizedSrLoadState
      !== expected.referenceNormalizedSrLoadState
    || configuration.normalizedIntervalInfluxGamma
      !== expected.normalizedIntervalInfluxGamma
  ) {
    throw new Error("interval-strength derived reference values are inconsistent");
  }
}

export function validateAcceptedVentricularIntervalStrengthStateV1(
  state: AcceptedVentricularIntervalStrengthStateV1,
): void {
  const record = requirePlainRecord(state, "accepted interval-strength state");
  requireExactKeys(record, STATE_KEYS, "accepted interval-strength state");
  if (
    state.stateSchemaId
      !== ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID
    || state.schemaVersion !== 1
  ) {
    throw new Error("accepted interval-strength state identity is invalid");
  }
  if (!Object.isFrozen(state)
    || !Object.isFrozen(state.initialPriorAcceptedVentricularActivation)
    || !Object.isFrozen(state.lastAcceptedVentricularActivation)
    || (state.lastDepositMetadata !== null
      && (!Object.isFrozen(state.lastDepositMetadata)
        || !Object.isFrozen(
          state.lastDepositMetadata.capturedVentricularActivation,
        )))) {
    throw new Error("accepted interval-strength state must be recursively immutable");
  }
  validateAcceptedVentricularIntervalStrengthConfigurationV1(
    state.configuration,
  );
  const initialAcceptedTimeSec = requireNonnegativeFinite(
    state.initialAcceptedTimeSec,
    "interval-strength initial accepted time",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "interval-strength accepted time",
  );
  if (acceptedTimeSec < initialAcceptedTimeSec) {
    throw new Error("interval-strength accepted clock precedes its initial clock");
  }
  const initialLoad = requirePositiveFinite(
    state.initialNormalizedSrLoadState,
    "interval-strength initial normalized SR load",
  );
  const load = requirePositiveFinite(
    state.normalizedSrLoadState,
    "interval-strength normalized SR load",
  );
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "interval-strength revision",
  );
  const count = requireNonnegativeSafeInteger(
    state.acceptedVentricularCaptureCount,
    "interval-strength accepted ventricular capture count",
  );
  if (revision !== count) {
    throw new Error(
      "interval-strength revision must equal accepted capture count",
    );
  }
  const initialPrior = copyCapturedVentricularActivation(
    state.initialPriorAcceptedVentricularActivation,
    "interval-strength initial prior activation",
  );
  const last = copyCapturedVentricularActivation(
    state.lastAcceptedVentricularActivation,
    "interval-strength last accepted ventricular activation",
  );
  if (initialPrior.activationTimeSec > initialAcceptedTimeSec) {
    throw new Error("initial prior activation exceeds initial accepted clock");
  }
  if (last.activationTimeSec > acceptedTimeSec) {
    throw new Error("last accepted ventricular activation exceeds owner clock");
  }

  if (count === 0) {
    if (acceptedTimeSec !== initialAcceptedTimeSec
      || load !== initialLoad
      || canonicalJsonStringify(last) !== canonicalJsonStringify(initialPrior)
      || state.lastDepositMetadata !== null) {
      throw new Error("unadvanced interval-strength state is inconsistent");
    }
    return;
  }
  if (state.lastDepositMetadata === null) {
    throw new Error("advanced interval-strength state requires deposit metadata");
  }
  if (last.activationTimeSec !== acceptedTimeSec) {
    throw new Error(
      "advanced interval-strength owner clock must equal last capture time",
    );
  }
  validateDepositMetadata(state.lastDepositMetadata, state.configuration);
  const metadata = state.lastDepositMetadata;
  if (metadata.ownerRevision !== revision
    || metadata.acceptedVentricularCaptureOrdinal !== count
    || metadata.normalizedSrLoadAfter !== load
    || canonicalJsonStringify(metadata.capturedVentricularActivation)
      !== canonicalJsonStringify(last)) {
    throw new Error("interval-strength state and last deposit metadata split");
  }
}

function buildDepositMetadata(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
  ownerRevision: number,
  ordinal: number,
  previous: CapturedElectricalActivationV2,
  captured: CapturedElectricalActivationV2,
  normalizedSrLoadBefore: number,
): VentricularIntervalStrengthDepositMetadataV1 {
  return buildDepositMetadataFromPriorLineage(
    configuration,
    ownerRevision,
    ordinal,
    previous.capturedActivationId,
    previous.activationTimeSec,
    captured,
    normalizedSrLoadBefore,
  );
}

function buildDepositMetadataFromPriorLineage(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
  ownerRevision: number,
  ordinal: number,
  previousCapturedActivationId: string,
  previousCapturedActivationTimeSec: number,
  captured: CapturedElectricalActivationV2,
  normalizedSrLoadBefore: number,
): VentricularIntervalStrengthDepositMetadataV1 {
  const intervalSec = requirePositiveComputedFinite(
    captured.activationTimeSec - previousCapturedActivationTimeSec,
    "interval-strength captured interval",
  );
  const isExactReferenceFixedPoint =
    intervalSec === configuration.referenceCycleLengthSec
    && normalizedSrLoadBefore
      === configuration.referenceNormalizedSrLoadState;
  const recoveryFractionA = isExactReferenceFixedPoint
    ? configuration.referenceRecoveryFractionA
    : computeRecoveryFraction(
      intervalSec,
      configuration.recoveryTimeConstantSec,
      "interval-strength recovery fraction",
    );
  const releasedRelativeStrengthR = isExactReferenceFixedPoint
    ? 1
    : requirePositiveComputedFinite(
      recoveryFractionA
        * configuration.releaseFractionBeta
        * normalizedSrLoadBefore,
      "interval-strength released relative strength",
    );
  const returnedReleasedRelativeLoad = requireNonnegativeComputedFinite(
    configuration.releasedLoadReturnFractionR
      * releasedRelativeStrengthR,
    "interval-strength returned released load",
  );
  const intervalInfluxRelativeLoad = isExactReferenceFixedPoint
    ? 1 - configuration.releasedLoadReturnFractionR
    : requirePositiveComputedFinite(
      configuration.normalizedIntervalInfluxGamma
        * (1 - configuration.intervalInfluxInhibitionFractionH
          * recoveryFractionA),
      "interval-strength interval influx",
    );
  const normalizedSrLoadAfter = isExactReferenceFixedPoint
    ? configuration.referenceNormalizedSrLoadState
    : requirePositiveComputedFinite(
      normalizedSrLoadBefore
        - releasedRelativeStrengthR
        + returnedReleasedRelativeLoad
        + intervalInfluxRelativeLoad,
      "interval-strength updated normalized SR load",
    );

  return Object.freeze({
    metadataSchemaId: VENTRICULAR_INTERVAL_STRENGTH_DEPOSIT_METADATA_V1_ID,
    schemaVersion: 1 as const,
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    ownerRevision,
    acceptedVentricularCaptureOrdinal: ordinal,
    previousCapturedActivationId,
    previousCapturedActivationTimeSec,
    capturedVentricularActivation: captured,
    intervalSec,
    recoveryFractionA,
    normalizedSrLoadBefore,
    releasedRelativeStrengthR,
    returnedReleasedRelativeLoad,
    intervalInfluxRelativeLoad,
    normalizedSrLoadAfter,
    futureExactCalciumDepositRelativeStrength: releasedRelativeStrengthR,
    calciumStateMutation: "none-metadata-only" as const,
  });
}

function assertReferenceOnlyRebindV1(
  source: AcceptedVentricularIntervalStrengthConfigurationV1,
  target: AcceptedVentricularIntervalStrengthConfigurationV1,
): void {
  const allowedTarget = createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: source.configurationId,
    ownerInstanceId: source.ownerInstanceId,
    parameterProvenance: {
      kind: source.parameterProvenance.kind,
      sourceId: source.parameterProvenance.sourceId,
    },
    recoveryTimeConstantSec: source.recoveryTimeConstantSec,
    releaseFractionBeta: source.releaseFractionBeta,
    releasedLoadReturnFractionR: source.releasedLoadReturnFractionR,
    intervalInfluxInhibitionFractionH:
      source.intervalInfluxInhibitionFractionH,
    referenceCycleLengthSec: target.referenceCycleLengthSec,
  });
  if (canonicalJsonStringify(allowedTarget) !== canonicalJsonStringify(target)) {
    throw new Error(
      "interval-strength warm start changed more than reference-cycle normalization",
    );
  }
}

function validateDepositMetadata(
  metadata: VentricularIntervalStrengthDepositMetadataV1,
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
): void {
  const record = requirePlainRecord(metadata, "interval-strength deposit metadata");
  requireExactKeys(record, DEPOSIT_METADATA_KEYS, "interval-strength deposit metadata");
  if (metadata.metadataSchemaId
      !== VENTRICULAR_INTERVAL_STRENGTH_DEPOSIT_METADATA_V1_ID
    || metadata.schemaVersion !== 1
    || metadata.configurationId !== configuration.configurationId
    || metadata.ownerInstanceId !== configuration.ownerInstanceId
    || metadata.calciumStateMutation !== "none-metadata-only") {
    throw new Error("interval-strength deposit metadata identity is invalid");
  }
  const revision = requirePositiveSafeInteger(
    metadata.ownerRevision,
    "interval-strength metadata owner revision",
  );
  const ordinal = requirePositiveSafeInteger(
    metadata.acceptedVentricularCaptureOrdinal,
    "interval-strength metadata capture ordinal",
  );
  requireNonemptyString(
    metadata.previousCapturedActivationId,
    "interval-strength metadata previous capture id",
  );
  const previousTime = requireFinite(
    metadata.previousCapturedActivationTimeSec,
    "interval-strength metadata previous capture time",
  );
  const captured = copyCapturedVentricularActivation(
    metadata.capturedVentricularActivation,
    "interval-strength metadata captured activation",
  );
  const before = requirePositiveFinite(
    metadata.normalizedSrLoadBefore,
    "interval-strength metadata load before",
  );
  const syntheticPrevious = Object.freeze({
    ...captured,
    capturedActivationId: metadata.previousCapturedActivationId,
    activationTimeSec: previousTime,
  });
  const expected = buildDepositMetadata(
    configuration,
    revision,
    ordinal,
    syntheticPrevious,
    captured,
    before,
  );
  if (canonicalJsonStringify(metadata) !== canonicalJsonStringify(expected)) {
    throw new Error("interval-strength deposit metadata equation is inconsistent");
  }
}

function validateCandidateShape(
  candidate: AcceptedVentricularIntervalStrengthCandidateV1,
): void {
  const record = requirePlainRecord(candidate, "interval-strength candidate");
  requireExactKeys(record, CANDIDATE_KEYS, "interval-strength candidate");
  if (candidate.candidateSchemaId
      !== ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CANDIDATE_V1_ID
    || candidate.schemaVersion !== 1) {
    throw new Error("interval-strength candidate identity is invalid");
  }
  requireNonemptyString(candidate.configurationId, "candidate configuration id");
  requireNonemptyString(candidate.ownerInstanceId, "candidate owner instance id");
  requireNonnegativeSafeInteger(candidate.baseRevision, "candidate base revision");
  requirePositiveSafeInteger(candidate.candidateRevision, "candidate revision");
  requireNonnegativeFinite(candidate.startTimeSec, "candidate start time");
  requireNonnegativeFinite(candidate.candidateTimeSec, "candidate time");
  validateAcceptedVentricularIntervalStrengthStateV1(candidate.candidateState);
  validateDepositMetadata(
    candidate.depositMetadata,
    candidate.candidateState.configuration,
  );
  canonicalJsonStringify(candidate);
}

function copyConfiguration(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
): AcceptedVentricularIntervalStrengthConfigurationV1 {
  validateAcceptedVentricularIntervalStrengthConfigurationV1(configuration);
  return createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    recoveryTimeConstantSec: configuration.recoveryTimeConstantSec,
    releaseFractionBeta: configuration.releaseFractionBeta,
    releasedLoadReturnFractionR:
      configuration.releasedLoadReturnFractionR,
    intervalInfluxInhibitionFractionH:
      configuration.intervalInfluxInhibitionFractionH,
    referenceCycleLengthSec: configuration.referenceCycleLengthSec,
  });
}

function copyParameterProvenanceInput(
  input: VentricularIntervalStrengthParameterProvenanceInputV1,
): VentricularIntervalStrengthParameterProvenanceV1 {
  const record = requirePlainRecord(input, "interval-strength parameter provenance input");
  requireExactKeys(record, PROVENANCE_INPUT_KEYS, "interval-strength parameter provenance input");
  if (input.kind !== "explicit-research-parameters"
    && input.kind !== "literature-component-reproduction") {
    throw new Error("interval-strength parameter provenance kind is invalid");
  }
  return Object.freeze({
    provenanceSchemaId:
      VENTRICULAR_INTERVAL_STRENGTH_PARAMETER_PROVENANCE_V1_ID,
    schemaVersion: 1 as const,
    kind: input.kind,
    sourceId: requireNonemptyString(
      input.sourceId,
      "interval-strength parameter provenance sourceId",
    ),
  });
}

function validateParameterProvenance(
  provenance: VentricularIntervalStrengthParameterProvenanceV1,
): void {
  const record = requirePlainRecord(provenance, "interval-strength parameter provenance");
  requireExactKeys(record, PROVENANCE_KEYS, "interval-strength parameter provenance");
  if (provenance.provenanceSchemaId
      !== VENTRICULAR_INTERVAL_STRENGTH_PARAMETER_PROVENANCE_V1_ID
    || provenance.schemaVersion !== 1
    || (provenance.kind !== "explicit-research-parameters"
      && provenance.kind !== "literature-component-reproduction")) {
    throw new Error("interval-strength parameter provenance is invalid");
  }
  requireNonemptyString(provenance.sourceId, "parameter provenance sourceId");
}

function copyCapturedVentricularActivation(
  input: CapturedElectricalActivationV2,
  field: string,
): CapturedElectricalActivationV2 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, CAPTURED_ACTIVATION_KEYS, field);
  if (input.activationSchemaId !== CAPTURED_ELECTRICAL_ACTIVATION_V2_ID
    || input.schemaVersion !== 2) {
    throw new Error(`${field} schema is invalid`);
  }
  if (input.chamber !== "ventricular") {
    throw new Error(`${field} must be ventricular`);
  }
  const sourceKind = requireVentricularSourceKind(input.sourceKind, `${field}.sourceKind`);
  const upstreamCapturedActivationId = requireNullableNonemptyString(
    input.upstreamCapturedActivationId,
    `${field}.upstreamCapturedActivationId`,
  );
  if (sourceKind === "av-output" && upstreamCapturedActivationId === null) {
    throw new Error(`${field} AV output requires upstream capture lineage`);
  }
  if (input.capturePriority !== ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind]) {
    throw new Error(`${field} capture priority does not match source kind`);
  }
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: requireNonemptyString(
      input.capturedActivationId,
      `${field}.capturedActivationId`,
    ),
    parentSourceImpulseId: requireNonemptyString(
      input.parentSourceImpulseId,
      `${field}.parentSourceImpulseId`,
    ),
    upstreamCapturedActivationId,
    chamber: "ventricular" as const,
    gateInstanceId: requireNonemptyString(
      input.gateInstanceId,
      `${field}.gateInstanceId`,
    ),
    activationTimeSec: normalizeFinite(
      input.activationTimeSec,
      `${field}.activationTimeSec`,
    ),
    sourceKind,
    sourceId: requireNonemptyString(input.sourceId, `${field}.sourceId`),
    sourceSequence: requireNonnegativeSafeInteger(
      input.sourceSequence,
      `${field}.sourceSequence`,
    ),
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind],
    captureOrdinal: requirePositiveSafeInteger(
      input.captureOrdinal,
      `${field}.captureOrdinal`,
    ),
    ownerRevision: requirePositiveSafeInteger(
      input.ownerRevision,
      `${field}.ownerRevision`,
    ),
  });
}

function requireVentricularSourceKind(
  value: unknown,
  field: string,
): Exclude<ElectricalImpulseSourceKindV2, "primary-intrinsic"> {
  if (value !== "authored-ectopy"
    && value !== "av-output"
    && value !== "pacing"
    && value !== "escape") {
    throw new Error(`${field} is not a ventricular capture source kind`);
  }
  return value;
}

function deriveReferenceValues(
  tauSec: number,
  beta: number,
  r: number,
  h: number,
  referenceCycleLengthSec: number,
): Readonly<{
  referenceRecoveryFractionA: number;
  referenceNormalizedSrLoadState: number;
  normalizedIntervalInfluxGamma: number;
}> {
  const referenceRecoveryFractionA = computeRecoveryFraction(
    referenceCycleLengthSec,
    tauSec,
    "reference recovery fraction",
  );
  const referenceNormalizedSrLoadState = requirePositiveComputedFinite(
    1 / (referenceRecoveryFractionA * beta),
    "reference normalized SR load",
  );
  const normalizedIntervalInfluxGamma = requirePositiveComputedFinite(
    (1 - r) / (1 - h * referenceRecoveryFractionA),
    "normalized interval influx gamma",
  );
  return Object.freeze({
    referenceRecoveryFractionA,
    referenceNormalizedSrLoadState,
    normalizedIntervalInfluxGamma,
  });
}

function computeRecoveryFraction(
  intervalSec: number,
  tauSec: number,
  field: string,
): number {
  const ratio = intervalSec / tauSec;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error(`${field} ratio must be positive and finite`);
  }
  return requirePositiveComputedFinite(
    canonicalizeDerivedVentricularIntervalStrengthValueV1(
      -Math.expm1(-ratio),
    ),
    field,
  );
}

function adjacentFiniteFloat64V1(value: number, direction: -1 | 1): number {
  if (!Number.isFinite(value)) {
    throw new Error("adjacent float64 source must be finite");
  }
  if (value === 0) return direction > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  const nextBits = value > 0
    ? bits + BigInt(direction)
    : bits - BigInt(direction);
  view.setBigUint64(0, nextBits, false);
  const adjacent = view.getFloat64(0, false);
  if (!Number.isFinite(adjacent)) {
    throw new Error("adjacent float64 result must be finite");
  }
  return adjacent;
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

function requireNullableNonemptyString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return requireNonemptyString(value, field);
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
  const finite = normalizeFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return finite;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = normalizeFinite(value, field);
  if (finite <= 0) throw new Error(`${field} must be positive`);
  return finite;
}

function requireOpenClosedUnitInterval(value: unknown, field: string): number {
  const finite = normalizeFinite(value, field);
  if (finite <= 0 || finite > 1) {
    throw new Error(`${field} must satisfy 0 < value <= 1`);
  }
  return finite;
}

function requireClosedOpenUnitInterval(value: unknown, field: string): number {
  const finite = normalizeFinite(value, field);
  if (finite < 0 || finite >= 1) {
    throw new Error(`${field} must satisfy 0 <= value < 1`);
  }
  return finite;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value as number;
}

function requirePositiveSafeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value as number;
}

function requirePositiveComputedFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} computation must be positive and finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function requireNonnegativeComputedFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} computation must be nonnegative and finite`);
  }
  return Object.is(value, -0) ? 0 : value;
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

import {
  advanceExactEventCalciumV1,
  convertPeriodicBiexponentialToExactEventCalciumV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import type {
  FiveWallCalciumValuesV1,
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID,
  checkpointAcceptedDeterministicRhythmGeneratorStateV1,
  commitAcceptedDeterministicRhythmGeneratorTrialV1,
  createAcceptedDeterministicRhythmGeneratorConfigV1,
  evaluateAcceptedDeterministicRhythmGeneratorTrialV1,
  initializeAcceptedDeterministicRhythmGeneratorStateV1,
  initializeAcceptedDeterministicRhythmGeneratorFiniteHistoryStateV1,
  maximumAcceptedDeterministicRhythmGeneratorStepV1,
  restoreAcceptedDeterministicRhythmGeneratorStateV1,
  rollbackAcceptedDeterministicRhythmGeneratorTrialV1,
  validateAcceptedDeterministicRhythmGeneratorConfigV1,
  validateAcceptedDeterministicRhythmGeneratorStateV1,
  type AcceptedDeterministicRhythmGeneratorConfigV1,
  type AcceptedDeterministicRhythmGeneratorMaximumStepV1,
  type AcceptedDeterministicRhythmGeneratorStateV1,
  type AcceptedDeterministicRhythmGeneratorTrialV1,
} from "@/engine/myocardium/rhythm/acceptedDeterministicRhythmGeneratorV1";
import {
  createRecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
import type {
  AcceptedRhythmActivationEventV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID =
  "accepted-generated-five-wall-rhythm-calcium-owner-v1" as const;

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_BINDING_V1_ID =
  "accepted-generated-five-wall-rhythm-calcium-binding-v1" as const;

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID =
  "accepted-generated-five-wall-rhythm-calcium-state-v1" as const;

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID =
  "accepted-generated-five-wall-rhythm-calcium-trial-v1" as const;

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID =
  "circleheart.accepted-generated-five-wall-rhythm-calcium-checkpoint.v1" as const;

export const GENERATED_FIVE_WALL_PERIODIC_SINUS_ABS_TOLERANCE_UM_V1 =
  2e-12 as const;

export const ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1 = deepFreeze({
  owner:
    "one-accepted-clock-revision-generator-state-and-five-calcium-states" as const,
  generator: ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_V1_ID,
  trialInterval: "open-start-closed-end" as const,
  calciumModel: "exact-event-two-decay-prescribed-calcium-v1" as const,
  effectiveActivationOwnership:
    "deterministic-generator-emitted-events" as const,
  simultaneousEventBatchCompleteness: true as const,
  generatedModes: Object.freeze([
    "regular-sinus",
    "regular-atrial-flutter",
  ] as const),
  bindingIdentity:
    "complete-generator-config-and-five-wall-calcium-parameters" as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
  checkpointIntegrity:
    "outer-sha-256-and-complete-nested-generator-checkpoint" as const,
  periodicSinusInitialization:
    "finite-signed-history-and-analytic-prior-event-calcium-state" as const,
  periodicSinusCompatibility:
    "construction-against-existing-periodic-biexponential-drive" as const,
  flutterPeriodicAtrialStateFabricated: false as const,
  prescribedCalcium: true as const,
  calciumCyclingClaimed: false as const,
  atrialFibrillationClaimed: false as const,
  ecgClaimed: false as const,
  clinicalValidityClaimed: false as const,
  patientCalibrationClaimed: false as const,
  iabpTriggerSynchronizationClaimed: false as const,
});

export const GENERATED_FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1 = Object.freeze([
  "LA",
  "RA",
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type GeneratedFiveWallRhythmCalciumWallIdV1 =
  (typeof GENERATED_FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1)[number];

export type GeneratedFiveWallExactEventCalciumParametersV1 = Readonly<{
  LA: ExactEventCalciumParametersV1;
  RA: ExactEventCalciumParametersV1;
  LVFW: ExactEventCalciumParametersV1;
  SEP: ExactEventCalciumParametersV1;
  RVFW: ExactEventCalciumParametersV1;
}>;

export type GeneratedFiveWallExactEventCalciumStatesV1 = Readonly<{
  LA: ExactEventCalciumStateV1;
  RA: ExactEventCalciumStateV1;
  LVFW: ExactEventCalciumStateV1;
  SEP: ExactEventCalciumStateV1;
  RVFW: ExactEventCalciumStateV1;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumParameterProvenanceV1 =
  | "explicit-exact-event-parameters"
  | "five-wall-normal-periodic-analytic-conversion";

export type AcceptedGeneratedFiveWallRhythmCalciumBindingInputV1 = Readonly<{
  bindingId: string;
  generatorConfig: AcceptedDeterministicRhythmGeneratorConfigV1;
  calciumParametersByWall: GeneratedFiveWallExactEventCalciumParametersV1;
  parameterProvenance:
    AcceptedGeneratedFiveWallRhythmCalciumParameterProvenanceV1;
  sourceParameterSetId: string | null;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumBindingV1 = Readonly<{
  bindingSchemaId:
    typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_BINDING_V1_ID;
  schemaVersion: 1;
  ownerId: typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID;
  bindingId: string;
  generatorConfig: AcceptedDeterministicRhythmGeneratorConfigV1;
  calciumParametersByWall: GeneratedFiveWallExactEventCalciumParametersV1;
  parameterProvenance:
    AcceptedGeneratedFiveWallRhythmCalciumParameterProvenanceV1;
  sourceParameterSetId: string | null;
  targetPartition: Readonly<{
    atrial: readonly ["LA", "RA"];
    ventricular: readonly ["LVFW", "RVFW", "SEP"];
  }>;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumInitializationV1 =
  | "explicit-accepted-calcium-state"
  | "periodic-sinus-analytic-state";

export type AcceptedGeneratedFiveWallRhythmCalciumInitialStateInputV1 =
  Readonly<{
    acceptedTimeSec: number;
    revision: 0;
    nextSourceIndex: 0;
    nextSourceActivationTimeSec: number;
    calciumStateByWall: GeneratedFiveWallExactEventCalciumStatesV1;
  }>;

export type AcceptedGeneratedFiveWallRhythmCalciumStateV1 = Readonly<{
  stateSchemaId:
    typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID;
  schemaVersion: 1;
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
  initialization: AcceptedGeneratedFiveWallRhythmCalciumInitializationV1;
  revision: number;
  acceptedTimeSec: number;
  generatorState: AcceptedDeterministicRhythmGeneratorStateV1;
  calciumStateByWall: GeneratedFiveWallExactEventCalciumStatesV1;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumTrialV1 = Readonly<{
  trialSchemaId:
    typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID;
  schemaVersion: 1;
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
  baseRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  generatorTrial: AcceptedDeterministicRhythmGeneratorTrialV1;
  activationEvents: readonly AcceptedRhythmActivationEventV1[];
  simultaneousBatchCount: number;
  candidateCalciumStateByWall: GeneratedFiveWallExactEventCalciumStatesV1;
  candidateFreeCalciumUMByWall: FiveWallCalciumValuesV1;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumMaximumStepV1 = Readonly<{
  generator: AcceptedDeterministicRhythmGeneratorMaximumStepV1;
  maximumStepSec: number;
  candidateTimeSec: number;
}>;

export type GeneratedPeriodicSinusFiveWallRhythmCalciumOptionsV1 = Readonly<{
  bindingId: string;
  generatorConfigId: string;
  generatorInstanceId: string;
  sourceId: string;
}>;

export type GeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1 = Readonly<{
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
  acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1;
  timing: Readonly<{
    acceptedStartTimeSec: 0;
    cycleLengthSec: number;
    sourceAnchorTimeSec: number;
    firstFutureAtrialElectricalTimeSec: number;
    atrioventricularMinimumConductionDelaySec: number;
    historicalVentricularElectricalTimeSec: 0;
    atrialElectricalToCalciumDelaySec: number;
    ventricularElectricalToCalciumDelaySec: number;
    firstPendingVentricularCalciumTimeSec: number;
    initialization:
      "finite-history-through-t0-and-analytic-calcium-from-prior-events-only";
  }>;
  compatibility: Readonly<{
    referenceDriveId: "five-wall-normal-prescribed-calcium-drive-v1";
    sourceParameterSetId: string;
    exactBitParityClaimed: false;
    absoluteToleranceUM:
      typeof GENERATED_FIVE_WALL_PERIODIC_SINUS_ABS_TOLERANCE_UM_V1;
  }>;
}>;

export type AcceptedGeneratedFiveWallRhythmCalciumCheckpointPayloadV1 =
  Readonly<{
    checkpointId:
      typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID;
    schemaVersion: 1;
    stateSchemaId:
      typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID;
    binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
    initialization: AcceptedGeneratedFiveWallRhythmCalciumInitializationV1;
    revision: number;
    acceptedTimeSec: number;
    generatorCheckpoint: Awaited<ReturnType<
      typeof checkpointAcceptedDeterministicRhythmGeneratorStateV1
    >>;
    calciumStateByWall: GeneratedFiveWallExactEventCalciumStatesV1;
    exactResumeClaim:
      typeof ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1;
  }>;

export type AcceptedGeneratedFiveWallRhythmCalciumCheckpointV1 =
  AcceptedGeneratedFiveWallRhythmCalciumCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

const WALL_IDS = GENERATED_FIVE_WALL_RHYTHM_CALCIUM_WALL_IDS_V1;
const TARGET_PARTITION = deepFreeze({
  atrial: ["LA", "RA"] as const,
  ventricular: ["LVFW", "RVFW", "SEP"] as const,
});

const BINDING_INPUT_KEYS = Object.freeze([
  "bindingId",
  "generatorConfig",
  "calciumParametersByWall",
  "parameterProvenance",
  "sourceParameterSetId",
] as const);

const BINDING_KEYS = Object.freeze([
  "bindingSchemaId",
  "schemaVersion",
  "ownerId",
  ...BINDING_INPUT_KEYS,
  "targetPartition",
] as const);

const INITIAL_STATE_KEYS = Object.freeze([
  "acceptedTimeSec",
  "revision",
  "nextSourceIndex",
  "nextSourceActivationTimeSec",
  "calciumStateByWall",
] as const);

const PERIODIC_SINUS_OPTION_KEYS = Object.freeze([
  "bindingId",
  "generatorConfigId",
  "generatorInstanceId",
  "sourceId",
] as const);

const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "binding",
  "initialization",
  "revision",
  "acceptedTimeSec",
  "generatorState",
  "calciumStateByWall",
] as const);

const TRIAL_KEYS = Object.freeze([
  "trialSchemaId",
  "schemaVersion",
  "binding",
  "baseRevision",
  "startTimeSec",
  "candidateTimeSec",
  "generatorTrial",
  "activationEvents",
  "simultaneousBatchCount",
  "candidateCalciumStateByWall",
  "candidateFreeCalciumUMByWall",
] as const);

const CHECKPOINT_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "binding",
  "initialization",
  "revision",
  "acceptedTimeSec",
  "generatorCheckpoint",
  "calciumStateByWall",
  "exactResumeClaim",
  "checkpointSha256",
] as const);

export function createAcceptedGeneratedFiveWallRhythmCalciumBindingV1(
  input: AcceptedGeneratedFiveWallRhythmCalciumBindingInputV1,
): AcceptedGeneratedFiveWallRhythmCalciumBindingV1 {
  const record = requirePlainRecord(input, "generated binding input");
  requireExactKeys(record, BINDING_INPUT_KEYS, "generated binding input");
  validateAcceptedDeterministicRhythmGeneratorConfigV1(input.generatorConfig);
  const parameterProvenance = requireParameterProvenance(
    input.parameterProvenance,
    "generated binding input.parameterProvenance",
  );
  const sourceParameterSetId = input.sourceParameterSetId === null
    ? null
    : requireNonemptyString(
      input.sourceParameterSetId,
      "generated binding input.sourceParameterSetId",
    );
  if (
    parameterProvenance === "five-wall-normal-periodic-analytic-conversion"
    && sourceParameterSetId === null
  ) throw new Error("periodic analytic conversion requires sourceParameterSetId");
  if (
    parameterProvenance === "five-wall-normal-periodic-analytic-conversion"
    && input.generatorConfig.sourceMode !== "regular-sinus"
  ) throw new Error("periodic analytic calcium initialization is sinus-only");
  return deepFreeze({
    bindingSchemaId:
      ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_BINDING_V1_ID,
    schemaVersion: 1 as const,
    ownerId: ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID,
    bindingId: requireNonemptyString(input.bindingId, "binding input.bindingId"),
    generatorConfig: detachedFrozenCopy(input.generatorConfig),
    calciumParametersByWall: copyAndValidateParametersByWall(
      input.calciumParametersByWall,
      "generated binding input.calciumParametersByWall",
    ),
    parameterProvenance,
    sourceParameterSetId,
    targetPartition: TARGET_PARTITION,
  });
}

/** Fresh generic initializer for either supported generator mode. */
export function initializeAcceptedGeneratedFiveWallRhythmCalciumStateV1(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  input: AcceptedGeneratedFiveWallRhythmCalciumInitialStateInputV1,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  assertBinding(binding);
  const record = requirePlainRecord(input, "generated state input");
  requireExactKeys(record, INITIAL_STATE_KEYS, "generated state input");
  if (input.revision !== 0 || input.nextSourceIndex !== 0) {
    throw new Error("fresh generated owner requires revision and next source index zero");
  }
  const generatorState = initializeAcceptedDeterministicRhythmGeneratorStateV1(
    binding.generatorConfig,
    {
      acceptedTimeSec: requireNonnegativeFinite(
        input.acceptedTimeSec,
        "generated state input.acceptedTimeSec",
      ),
      revision: 0,
      nextSourceIndex: 0,
      nextSourceActivationTimeSec: requireNonnegativeFinite(
        input.nextSourceActivationTimeSec,
        "generated state input.nextSourceActivationTimeSec",
      ),
    },
  );
  return freezeAcceptedState({
    binding,
    initialization: "explicit-accepted-calcium-state",
    revision: 0,
    acceptedTimeSec: generatorState.acceptedTimeSec,
    generatorState,
    calciumStateByWall: copyAndValidateStatesByWall(
      input.calciumStateByWall,
      binding.calciumParametersByWall,
      "generated state input.calciumStateByWall",
    ),
  });
}

/**
 * Analytic t0 bridge for the existing regular-period sinus construction.
 * Source index zero is the signed-time atrial impulse at -AV delay. Its
 * ventricular electrical output is t=0 and its delayed ventricular calcium
 * onset remains pending at t=ventricular delay. Calcium state at t0 includes
 * only effective events at or before t0.
 */
export function createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(
  params: FiveWallNormalCalciumDriveParamsV1,
  options: GeneratedPeriodicSinusFiveWallRhythmCalciumOptionsV1,
): GeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1 {
  // Exercises the public validator and anchors compatibility to its current
  // interpretation before any analytic translation is constructed.
  evaluateFiveWallNormalCalciumDriveV1(0, params);
  const optionRecord = requirePlainRecord(options, "generated periodic sinus options");
  requireExactKeys(
    optionRecord,
    PERIODIC_SINUS_OPTION_KEYS,
    "generated periodic sinus options",
  );
  const cycleLengthSec = requirePositiveFinite(
    params.cycleLengthSec,
    "params.cycleLengthSec",
  );
  const avDelaySec = requirePositiveFinite(
    params.atrioventricularDelaySec,
    "params.atrioventricularDelaySec",
  );
  if (!(avDelaySec < cycleLengthSec)) {
    throw new Error("periodic sinus AV delay must be shorter than its cycle");
  }
  const atrialDelaySec = requireNonnegativeFinite(
    params.atrial.electricalToCalciumDelaySec,
    "params.atrial.electricalToCalciumDelaySec",
  );
  const ventricularDelaySec = requireNonnegativeFinite(
    params.ventricular.electricalToCalciumDelaySec,
    "params.ventricular.electricalToCalciumDelaySec",
  );
  const sourceAnchorTimeSec = -avDelaySec;
  const firstFutureAtrialElectricalTimeSec = cycleLengthSec - avDelaySec;
  // This refractory value is a deterministic regular-sinus construction: it
  // lies strictly inside the available V-to-next-A interval and therefore
  // does not create block in the reference train. It is not a patient or
  // literature AV refractory calibration.
  const postConductionRefractorySec = (cycleLengthSec - avDelaySec) / 2;
  const avGateParameters = createRecoveryConcealmentAvGateParametersV1({
    parameterSetId: `${params.parameterSetId}:generated-sinus-av-gate-v1`,
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: `${params.parameterSetId}:atrioventricular-delay-construction`,
    },
    minimumConductionDelaySec: avDelaySec,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: cycleLengthSec,
    postConductionRefractorySec,
    concealedRefractoryExtensionSec: 0,
  });
  const generatorConfig = createAcceptedDeterministicRhythmGeneratorConfigV1({
    generatorConfigId: requireNonemptyString(
      options.generatorConfigId,
      "options.generatorConfigId",
    ),
    generatorInstanceId: requireNonemptyString(
      options.generatorInstanceId,
      "options.generatorInstanceId",
    ),
    sourceId: requireNonemptyString(options.sourceId, "options.sourceId"),
    sourceMode: "regular-sinus",
    sourceAnchorTimeSec,
    sourcePeriodSec: cycleLengthSec,
    atrialElectricalToCalciumDelaySec: atrialDelaySec,
    ventricularElectricalToCalciumDelaySec: ventricularDelaySec,
    atrialActivationStrength01: 1,
    ventricularActivationStrength01: 1,
    avGateParameters,
  });
  const generatorState =
    initializeAcceptedDeterministicRhythmGeneratorFiniteHistoryStateV1(
      generatorConfig,
      { acceptedTimeSec: 0, revision: 0 },
    );

  const conversions = mapWalls((wall) => {
    const tissue = wall === "LA" || wall === "RA"
      ? params.atrial
      : params.ventricular;
    return convertPeriodicBiexponentialToExactEventCalciumV1({
      diastolicCalciumUM: tissue.diastolicCalciumUM,
      peakAmplitudeUM: tissue.peakAmplitudeUM * amplitudeScale(params, wall),
      riseTimeConstantSec: tissue.riseTimeConstantSec,
      decayTimeConstantSec: tissue.decayTimeConstantSec,
    }, cycleLengthSec);
  });
  const calciumParametersByWall = deepFreeze(mapWalls((wall) =>
    conversions[wall].parameters));
  const atrialEffectiveOffsetSec = sourceAnchorTimeSec + atrialDelaySec;
  const ventricularEffectiveOffsetSec = ventricularDelaySec;
  const calciumStateByWall = deepFreeze(mapWalls((wall) => {
    const effectiveOffset = wall === "LA" || wall === "RA"
      ? atrialEffectiveOffsetSec
      : ventricularEffectiveOffsetSec;
    const phaseSinceMostRecentHistoricalEventSec = positiveModulo(
      -effectiveOffset,
      cycleLengthSec,
    );
    return propagateExactEventCalciumV1(
      conversions[wall].periodicStateImmediatelyAfterEvent,
      phaseSinceMostRecentHistoricalEventSec,
      conversions[wall].parameters,
    );
  }));
  const binding = createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
    bindingId: requireNonemptyString(options.bindingId, "options.bindingId"),
    generatorConfig,
    calciumParametersByWall,
    parameterProvenance: "five-wall-normal-periodic-analytic-conversion",
    sourceParameterSetId: params.parameterSetId,
  });
  const acceptedState = freezeAcceptedState({
    binding,
    initialization: "periodic-sinus-analytic-state",
    revision: 0,
    acceptedTimeSec: 0,
    generatorState,
    calciumStateByWall,
  });
  assertAcceptedState(acceptedState, binding);
  return deepFreeze({
    binding,
    acceptedState,
    timing: {
      acceptedStartTimeSec: 0 as const,
      cycleLengthSec,
      sourceAnchorTimeSec,
      firstFutureAtrialElectricalTimeSec,
      atrioventricularMinimumConductionDelaySec: avDelaySec,
      historicalVentricularElectricalTimeSec: 0 as const,
      atrialElectricalToCalciumDelaySec: atrialDelaySec,
      ventricularElectricalToCalciumDelaySec: ventricularDelaySec,
      firstPendingVentricularCalciumTimeSec: ventricularDelaySec,
      initialization:
        "finite-history-through-t0-and-analytic-calcium-from-prior-events-only" as const,
    },
    compatibility: {
      referenceDriveId: "five-wall-normal-prescribed-calcium-drive-v1" as const,
      sourceParameterSetId: params.parameterSetId,
      exactBitParityClaimed: false as const,
      absoluteToleranceUM:
        GENERATED_FIVE_WALL_PERIODIC_SINUS_ABS_TOLERANCE_UM_V1,
    },
  });
}

export function validateAcceptedGeneratedFiveWallRhythmCalciumStateV1(
  state: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): void {
  assertAcceptedState(state, binding);
}

export function evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1(
  state: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): MainWireFiveWallFreeCalciumDriveV1 {
  assertAcceptedState(state, binding);
  return deepFreeze({
    freeCalciumUMByWall: mapWalls((wall) =>
      evaluateExactEventCalciumV1(
        state.calciumStateByWall[wall],
        binding.calciumParametersByWall[wall],
      ).freeCalciumUM),
  });
}

/** Pure generated-rhythm and exact-calcium candidate over (start,end]. */
export function evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  candidateTimeSec: number,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): AcceptedGeneratedFiveWallRhythmCalciumTrialV1 {
  assertAcceptedState(previous, binding);
  const candidate = requireNonnegativeFinite(candidateTimeSec, "candidateTimeSec");
  if (!(candidate > previous.acceptedTimeSec)) {
    throw new Error("candidateTimeSec must exceed acceptedTimeSec");
  }
  const generatorTrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
    previous.generatorState,
    candidate,
  );
  const activationEvents = generatorTrial.activationEvents;
  const candidateCalciumStateByWall = deepFreeze(mapWalls((wall) =>
    advanceExactEventCalciumV1(
      previous.calciumStateByWall[wall],
      previous.acceptedTimeSec,
      candidate,
      activationEvents
        .filter((event) => event.targetIds.includes(wall))
        .map((event) => event.calciumEvent),
      binding.calciumParametersByWall[wall],
    )));
  const candidateFreeCalciumUMByWall = deepFreeze(mapWalls((wall) =>
    evaluateExactEventCalciumV1(
      candidateCalciumStateByWall[wall],
      binding.calciumParametersByWall[wall],
    ).freeCalciumUM));
  return deepFreeze({
    trialSchemaId: ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID,
    schemaVersion: 1 as const,
    binding,
    baseRevision: previous.revision,
    startTimeSec: previous.acceptedTimeSec,
    candidateTimeSec: candidate,
    generatorTrial,
    activationEvents,
    simultaneousBatchCount: generatorTrial.simultaneousBatchCount,
    candidateCalciumStateByWall,
    candidateFreeCalciumUMByWall,
  });
}

export function commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  trial: AcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  assertTrialBase(previous, trial, binding);
  const expected = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
    previous,
    trial.candidateTimeSec,
    binding,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error("generated five-wall rhythm-calcium trial does not match exact recomputation");
  }
  const generatorState = commitAcceptedDeterministicRhythmGeneratorTrialV1(
    previous.generatorState,
    trial.generatorTrial,
  );
  return freezeAcceptedState({
    binding,
    initialization: previous.initialization,
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    generatorState,
    calciumStateByWall: trial.candidateCalciumStateByWall,
  });
}

export function rollbackAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
  previous: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  trial: AcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  assertTrialBase(previous, trial, binding);
  const expected = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
    previous,
    trial.candidateTimeSec,
    binding,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error("generated five-wall rhythm-calcium trial does not match exact recomputation");
  }
  rollbackAcceptedDeterministicRhythmGeneratorTrialV1(
    previous.generatorState,
    trial.generatorTrial,
  );
  return previous;
}

export function maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1(
  previous: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  requestedStepSec: number,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): AcceptedGeneratedFiveWallRhythmCalciumMaximumStepV1 {
  assertAcceptedState(previous, binding);
  const generator = maximumAcceptedDeterministicRhythmGeneratorStepV1(
    previous.generatorState,
    requestedStepSec,
  );
  return Object.freeze({
    generator,
    maximumStepSec: generator.maximumStepSec,
    candidateTimeSec: generator.candidateTimeSec,
  });
}

export async function checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1(
  state: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): Promise<AcceptedGeneratedFiveWallRhythmCalciumCheckpointV1> {
  assertAcceptedState(state, binding);
  const payload = deepFreeze({
    checkpointId:
      ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID,
    binding,
    initialization: state.initialization,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    generatorCheckpoint:
      await checkpointAcceptedDeterministicRhythmGeneratorStateV1(
        state.generatorState,
      ),
    calciumStateByWall: state.calciumStateByWall,
    exactResumeClaim: ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1,
  }) satisfies AcceptedGeneratedFiveWallRhythmCalciumCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
  candidate: unknown,
  expectedBinding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): Promise<AcceptedGeneratedFiveWallRhythmCalciumStateV1> {
  assertBinding(expectedBinding);
  const checkpoint = requirePlainRecord(candidate, "generated owner checkpoint");
  requireExactKeys(checkpoint, CHECKPOINT_KEYS, "generated owner checkpoint");
  if (
    checkpoint.checkpointId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.stateSchemaId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID
  ) throw new Error("unsupported generated five-wall rhythm-calcium checkpoint schema");
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) throw new Error("generated owner checkpoint SHA-256 is invalid");
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("generated owner checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1,
      )
  ) throw new Error("generated owner checkpoint claim mismatch");
  if (
    canonicalJsonStringify(checkpoint.binding)
      !== canonicalJsonStringify(expectedBinding)
  ) throw new Error("generated owner checkpoint binding mismatch");
  const generatorState =
    await restoreAcceptedDeterministicRhythmGeneratorStateV1(
      checkpoint.generatorCheckpoint,
      expectedBinding.generatorConfig,
    );
  const restored = freezeAcceptedState({
    binding: expectedBinding,
    initialization: requireInitialization(
      checkpoint.initialization,
      "checkpoint.initialization",
    ),
    revision: requireNonnegativeSafeInteger(
      checkpoint.revision,
      "checkpoint.revision",
    ),
    acceptedTimeSec: requireNonnegativeFinite(
      checkpoint.acceptedTimeSec,
      "checkpoint.acceptedTimeSec",
    ),
    generatorState,
    calciumStateByWall: copyAndValidateStatesByWall(
      checkpoint.calciumStateByWall,
      expectedBinding.calciumParametersByWall,
      "checkpoint.calciumStateByWall",
    ),
  });
  assertAcceptedState(restored, expectedBinding);
  return restored;
}

function freezeAcceptedState(input: Readonly<{
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
  initialization: AcceptedGeneratedFiveWallRhythmCalciumInitializationV1;
  revision: number;
  acceptedTimeSec: number;
  generatorState: AcceptedDeterministicRhythmGeneratorStateV1;
  calciumStateByWall: GeneratedFiveWallExactEventCalciumStatesV1;
}>): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  if (
    input.generatorState.revision !== input.revision
    || input.generatorState.acceptedTimeSec !== input.acceptedTimeSec
  ) throw new Error("generated owner clock/revision tuple is inconsistent");
  return deepFreeze({
    stateSchemaId: ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID,
    schemaVersion: 1 as const,
    binding: input.binding,
    initialization: input.initialization,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    generatorState: input.generatorState,
    calciumStateByWall: input.calciumStateByWall,
  });
}

function assertBinding(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): void {
  const record = requirePlainRecord(binding, "generated binding");
  requireExactKeys(record, BINDING_KEYS, "generated binding");
  if (
    binding.bindingSchemaId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_BINDING_V1_ID
    || binding.schemaVersion !== 1
    || binding.ownerId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_OWNER_V1_ID
  ) throw new Error("unsupported generated five-wall binding schema");
  if (!isRecursivelyFrozen(binding)) {
    throw new Error("generated binding must be recursively immutable");
  }
  requireNonemptyString(binding.bindingId, "binding.bindingId");
  validateAcceptedDeterministicRhythmGeneratorConfigV1(binding.generatorConfig);
  copyAndValidateParametersByWall(
    binding.calciumParametersByWall,
    "binding.calciumParametersByWall",
  );
  const provenance = requireParameterProvenance(
    binding.parameterProvenance,
    "binding.parameterProvenance",
  );
  if (binding.sourceParameterSetId !== null) {
    requireNonemptyString(binding.sourceParameterSetId, "binding.sourceParameterSetId");
  }
  if (
    provenance === "five-wall-normal-periodic-analytic-conversion"
    && (
      binding.sourceParameterSetId === null
      || binding.generatorConfig.sourceMode !== "regular-sinus"
    )
  ) throw new Error("periodic analytic binding requires sinus and source parameter set");
  if (canonicalJsonStringify(binding.targetPartition)
    !== canonicalJsonStringify(TARGET_PARTITION)) {
    throw new Error("generated binding target partition is invalid");
  }
}

function assertAcceptedState(
  state: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): void {
  assertBinding(binding);
  const record = requirePlainRecord(state, "generated accepted state");
  requireExactKeys(record, STATE_KEYS, "generated accepted state");
  if (
    state.stateSchemaId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_STATE_V1_ID
    || state.schemaVersion !== 1
    || canonicalJsonStringify(state.binding) !== canonicalJsonStringify(binding)
  ) throw new Error("generated accepted state binding mismatch");
  if (!Object.isFrozen(state)) throw new Error("generated accepted state must be immutable");
  const initialization = requireInitialization(
    state.initialization,
    "state.initialization",
  );
  if (
    initialization === "periodic-sinus-analytic-state"
    && binding.generatorConfig.sourceMode !== "regular-sinus"
  ) throw new Error("flutter cannot own fabricated periodic atrial calcium state");
  const revision = requireNonnegativeSafeInteger(state.revision, "state.revision");
  const acceptedTimeSec = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "state.acceptedTimeSec",
  );
  validateAcceptedDeterministicRhythmGeneratorStateV1(state.generatorState);
  if (
    revision !== state.generatorState.revision
    || acceptedTimeSec !== state.generatorState.acceptedTimeSec
    || canonicalJsonStringify(state.generatorState.configuration)
      !== canonicalJsonStringify(binding.generatorConfig)
  ) throw new Error("generated accepted state clock/config tuple mismatch");
  copyAndValidateStatesByWall(
    state.calciumStateByWall,
    binding.calciumParametersByWall,
    "state.calciumStateByWall",
  );
  if (
    !Object.isFrozen(state.calciumStateByWall)
    || WALL_IDS.some((wall) => !Object.isFrozen(state.calciumStateByWall[wall]))
  ) throw new Error("generated accepted calcium states must be immutable");
}

function assertTrialBase(
  previous: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  trial: AcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): void {
  assertAcceptedState(previous, binding);
  const record = requirePlainRecord(trial, "generated owner trial");
  requireExactKeys(record, TRIAL_KEYS, "generated owner trial");
  if (
    trial.trialSchemaId
      !== ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_TRIAL_V1_ID
    || trial.schemaVersion !== 1
    || canonicalJsonStringify(trial.binding) !== canonicalJsonStringify(binding)
    || trial.baseRevision !== previous.revision
    || trial.startTimeSec !== previous.acceptedTimeSec
    || !(trial.candidateTimeSec > previous.acceptedTimeSec)
  ) throw new Error("stale or foreign generated five-wall rhythm-calcium trial");
}

function copyAndValidateParametersByWall(
  input: unknown,
  field: string,
): GeneratedFiveWallExactEventCalciumParametersV1 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, WALL_IDS, field);
  return deepFreeze(mapWalls((wall) => {
    const parameterField = `${field}.${wall}`;
    const value = requirePlainRecord(record[wall], parameterField);
    requireExactKeys(value, [
      "tauRiseSec",
      "tauDecaySec",
      "calciumRestUM",
      "calciumGainUMPerUnitDrive",
    ], parameterField);
    const parameters = Object.freeze({
      tauRiseSec: requirePositiveFinite(value.tauRiseSec, `${parameterField}.tauRiseSec`),
      tauDecaySec: requirePositiveFinite(value.tauDecaySec, `${parameterField}.tauDecaySec`),
      calciumRestUM: requireNonnegativeFinite(
        value.calciumRestUM,
        `${parameterField}.calciumRestUM`,
      ),
      calciumGainUMPerUnitDrive: requireNonnegativeFinite(
        value.calciumGainUMPerUnitDrive,
        `${parameterField}.calciumGainUMPerUnitDrive`,
      ),
    });
    evaluateExactEventCalciumV1(Object.freeze([0, 0]), parameters);
    return parameters;
  }));
}

function copyAndValidateStatesByWall(
  input: unknown,
  parameters: GeneratedFiveWallExactEventCalciumParametersV1,
  field: string,
): GeneratedFiveWallExactEventCalciumStatesV1 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, WALL_IDS, field);
  return deepFreeze(mapWalls((wall) => {
    const stateField = `${field}.${wall}`;
    const value = record[wall];
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error(`${stateField} must contain [riseDrive, decayDrive]`);
    }
    validateDenseArray(value, stateField);
    const state = Object.freeze([
      requireNonnegativeFinite(value[0], `${stateField}[0]`),
      requireNonnegativeFinite(value[1], `${stateField}[1]`),
    ]) as ExactEventCalciumStateV1;
    evaluateExactEventCalciumV1(state, parameters[wall]);
    return state;
  }));
}

function mapWalls<T>(
  map: (wall: GeneratedFiveWallRhythmCalciumWallIdV1) => T,
): Record<GeneratedFiveWallRhythmCalciumWallIdV1, T> {
  return {
    LA: map("LA"),
    RA: map("RA"),
    LVFW: map("LVFW"),
    SEP: map("SEP"),
    RVFW: map("RVFW"),
  };
}

function amplitudeScale(
  params: FiveWallNormalCalciumDriveParamsV1,
  wall: GeneratedFiveWallRhythmCalciumWallIdV1,
): number {
  return requireNonnegativeFinite(
    params.peakAmplitudeScaleByWall?.[wall] ?? 1,
    `params.peakAmplitudeScaleByWall.${wall}`,
  );
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function requireParameterProvenance(
  value: unknown,
  field: string,
): AcceptedGeneratedFiveWallRhythmCalciumParameterProvenanceV1 {
  if (
    value !== "explicit-exact-event-parameters"
    && value !== "five-wall-normal-periodic-analytic-conversion"
  ) throw new Error(`${field} is invalid`);
  return value;
}

function requireInitialization(
  value: unknown,
  field: string,
): AcceptedGeneratedFiveWallRhythmCalciumInitializationV1 {
  if (
    value !== "explicit-accepted-calcium-state"
    && value !== "periodic-sinus-analytic-state"
  ) throw new Error(`${field} is invalid`);
  return value;
}

function detachedFrozenCopy<T>(value: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(value)) as T);
}

function isRecursivelyFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>)
    .every((child) => isRecursivelyFrozen(child));
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

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be finite and greater than zero`);
  }
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

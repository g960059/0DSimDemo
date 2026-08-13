/**
 * Joint four-chamber mechanics boundary intended for host integration.
 *
 * This contract does not by itself establish ModelCore runtime wiring.
 *
 * Main wire owns blood/vascular nodes, edges, and valves. One mechanics
 * provider jointly maps the four candidate chamber volumes to four transmural
 * pressures while owning all coupled Land/passive/Maxwell/TriSeg internal
 * history. Trials are pure; only an explicitly accepted trial advances state.
 */

import {
  fullHotPathInvariantsEnabledV1,
} from "@/engine/hotPathIntegrityTierV1";

export const WHOLE_HEART_MECHANICS_CONTRACT_V1_ID =
  "whole-heart-mechanics-contract-v1" as const;

export const WHOLE_HEART_MECHANICS_PREPARED_STEP_V1_ID =
  "whole-heart-mechanics-prepared-step-v1" as const;

export const WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID =
  "whole-heart-mechanics-candidate-probe-v1" as const;

export const WHOLE_HEART_MECHANICS_OWNERSHIP_V1 = Object.freeze({
  evaluationScope: "joint-LA-LV-RA-RV" as const,
  mainWireOwns: Object.freeze([
    "vascular-node-state",
    "vascular-edge-state",
    "valve-state-and-law",
    "blood-volume-ledger",
  ] as const),
  providerOwns: Object.freeze([
    "four-chamber-transmural-pressure",
    "Land-passive-Maxwell-material-state",
    "TriSeg-state",
  ] as const),
  trialSemantics: "pure-candidate-evaluation" as const,
  commitSemantics: "explicit-accepted-trial-promotion" as const,
});

export type WholeHeartMechanicsChamberValuesV1 = {
  readonly LA: number;
  readonly LV: number;
  readonly RA: number;
  readonly RV: number;
};

/**
 * Row = transmural chamber pressure, column = chamber blood volume.
 * Every entry is expressed in mmHg/mL. External/common pericardial pressure is
 * outside this mechanics contract and must not be included here.
 */
export type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1 = Readonly<{
  LA: WholeHeartMechanicsChamberValuesV1;
  LV: WholeHeartMechanicsChamberValuesV1;
  RA: WholeHeartMechanicsChamberValuesV1;
  RV: WholeHeartMechanicsChamberValuesV1;
}>;

export type WholeHeartMechanicsSerializableValueV1 =
  | null
  | boolean
  | number
  | string
  | readonly WholeHeartMechanicsSerializableValueV1[]
  | { readonly [key: string]: WholeHeartMechanicsSerializableValueV1 };

/** Allows efficient internal arrays without exposing their layout to the host. */
export type WholeHeartMechanicsStateCodecV1<TState> = {
  clone(state: TState): TState;
  encode(state: TState): WholeHeartMechanicsSerializableValueV1;
  decode(encoded: WholeHeartMechanicsSerializableValueV1): TState;
};

export type WholeHeartMechanicsDiagnosticsV1 = {
  readonly converged: boolean;
  readonly finite: boolean;
  readonly iterationCount: number;
  readonly residualNorm: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly readback: WholeHeartMechanicsSerializableValueV1 | null;
};

export type WholeHeartMechanicsAcceptedStateV1<TState> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly revision: number;
  readonly acceptedTimeSec: number;
  readonly acceptedVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly materialState: TState;
  /** Detects mutation of arrays/objects exposed through the public snapshot. */
  readonly materialStateFingerprint: string;
};

export type WholeHeartMechanicsColdInputV1<TDrive> = {
  readonly timeSec: number;
  readonly volumesMl: WholeHeartMechanicsChamberValuesV1;
  /** Calcium/excitation/environment input; never valve or vascular state. */
  readonly drivingInputs: TDrive;
};

export type WholeHeartMechanicsProviderEvaluationV1<TState> = {
  readonly materialState: TState;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly transmuralPressureVolumeTangentMmHgPerMl?:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsTrialInputV1<TState, TDrive> = {
  /** Defensive clone of the last accepted whole-heart state. */
  readonly previousAcceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
  readonly candidateTimeSec: number;
  readonly stepDtSec: number;
  readonly candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly drivingInputs: TDrive;
};

/** One provider, not four chamber-local providers sharing hidden mutable state. */
export type WholeHeartMechanicsProviderV1<TState, TDrive> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  /**
   * Human-readable prior/case identity plus a provider-defined stable
   * configuration hash. The provider must document whether provenance-only
   * metadata is included; this generic contract does not call it a physics hash.
   */
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly stateCodec: WholeHeartMechanicsStateCodecV1<TState>;
  /**
   * Optional trusted hot-path capability. The default supplies a defensive
   * clone to every callback. A provider may opt into the private prepared-step
   * snapshot only after proving that it never mutates the accepted aggregate;
   * its inner constitutive candidates must still isolate mutable wall state.
   */
  readonly acceptedStateInputMode?:
    "defensive-clone" | "trusted-read-only-prepared-snapshot";
  /**
   * Optional ownership capability for the probe -> seal hot path.
   *
   * The default preserves the original contract: each provider result is
   * snapshotted immediately before another candidate may be evaluated. A
   * provider may opt into `exclusive-result` only when every evaluateTrial
   * call returns material state, diagnostics, and readback that it will never
   * reuse or mutate after return.
   */
  readonly evaluationResultOwnershipMode?:
    "defensive-snapshot-required" | "exclusive-result";
  /**
   * Optional isolation hook for mutable/future drive payloads. Prepared steps
   * call it once when capturing the outer-step input and again for every
   * provider callback. Without it, both caller and provider must treat the
   * drive as deeply immutable; the current calcium drive satisfies that rule.
   */
  readonly cloneDrivingInputs?: (drivingInputs: TDrive) => TDrive;
  initializeCold(
    input: WholeHeartMechanicsColdInputV1<TDrive>,
  ): WholeHeartMechanicsProviderEvaluationV1<TState>;
  /** Pure candidate evaluation; result ownership follows the capability above. */
  evaluateTrial(
    input: WholeHeartMechanicsTrialInputV1<TState, TDrive>,
  ): WholeHeartMechanicsProviderEvaluationV1<TState>;
};

export type WholeHeartMechanicsColdResultV1<TState> = {
  readonly acceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly transmuralPressureVolumeTangentMmHgPerMl?:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsTrialV1<TState> = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly baseRevision: number;
  readonly baseAcceptedTimeSec: number;
  readonly candidateTimeSec: number;
  readonly stepDtSec: number;
  readonly candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly candidateMaterialState: TState;
  readonly candidateMaterialStateFingerprint: string;
  readonly transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  readonly transmuralPressureVolumeTangentMmHgPerMl?:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
  readonly diagnostics: WholeHeartMechanicsDiagnosticsV1;
};

export type WholeHeartMechanicsCheckpointV1 = {
  readonly contractId: typeof WHOLE_HEART_MECHANICS_CONTRACT_V1_ID;
  readonly providerId: string;
  readonly parameterSetId: string;
  readonly parameterIdentityHash: string;
  readonly stateSchemaVersion: number;
  readonly revision: number;
  readonly acceptedTimeSec: number;
  readonly acceptedVolumesMl: WholeHeartMechanicsChamberValuesV1;
  readonly materialState: WholeHeartMechanicsSerializableValueV1;
  readonly materialStateFingerprint: string;
};

/**
 * Short-lived, checked mechanics boundary for one outer circulation step.
 *
 * The accepted state and provider are fully audited when this context is
 * prepared. Its private baseline snapshot is then reused across the Newton
 * candidate evaluations belonging to that one step. The context intentionally
 * exposes no material state and cannot be reconstructed from serialized data.
 * Prepare a new context after every accepted step or parameter/provider change.
 */
export type WholeHeartMechanicsPreparedStepV1<TState, TDrive> = Readonly<{
  contextId: typeof WHOLE_HEART_MECHANICS_PREPARED_STEP_V1_ID;
  providerId: string;
  parameterSetId: string;
  parameterIdentityHash: string;
  stateSchemaVersion: number;
  baseRevision: number;
  baseAcceptedTimeSec: number;
  candidateTimeSec: number;
  stepDtSec: number;
  /** Type-only witness; the runtime context keeps both values private. */
  typeWitness?: Readonly<{ state: TState; drive: TDrive }>;
}>;

/**
 * Minimal, short-lived candidate view used inside a coupled nonlinear solve.
 *
 * Material state, rich readback, and its serialized fingerprint deliberately
 * remain private until the circulation solver selects this exact candidate.
 * The public trial/checkpoint boundary is unchanged: a selected probe must be
 * sealed into WholeHeartMechanicsTrialV1 before it can be committed or exposed.
 */
export type WholeHeartMechanicsCandidateProbeV1<TState, TDrive> = Readonly<{
  probeId: typeof WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID;
  providerId: string;
  parameterSetId: string;
  parameterIdentityHash: string;
  stateSchemaVersion: number;
  baseRevision: number;
  baseAcceptedTimeSec: number;
  candidateTimeSec: number;
  stepDtSec: number;
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
  transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  transmuralPressureVolumeTangentMmHgPerMl?:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
  diagnostics: Readonly<Omit<WholeHeartMechanicsDiagnosticsV1, "readback">>;
  /** Type-only witness; no state or drive is exposed at runtime. */
  typeWitness?: Readonly<{ state: TState; drive: TDrive }>;
}>;

type PreparedWholeHeartMechanicsStepInternalV1<TState, TDrive> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>;
  previousAcceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
  candidateTimeSec: number;
  stepDtSec: number;
  drivingInputs: TDrive;
}>;

type WholeHeartMechanicsCandidateProbeInternalV1<TState, TDrive> = Readonly<{
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>;
  /** Exclusively owned provider result; defensive snapshot is deferred. */
  candidateMaterialState: TState;
  readback: WholeHeartMechanicsSerializableValueV1 | null;
}>;

const PREPARED_WHOLE_HEART_MECHANICS_STEP_INTERNALS_V1 =
  new WeakMap<object, object>();

const WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_INTERNALS_V1 =
  new WeakMap<object, object>();

/**
 * Prepared trials are capabilities issued by exactly one live context. Public
 * trial fields intentionally remain serializable/readable, but matching those
 * fields is not authority to commit through the prepared fast path.
 */
const PREPARED_WHOLE_HEART_MECHANICS_TRIAL_CONTEXTS_V1 =
  new WeakMap<object, object>();

/** A successful prepared commit consumes its one-step capability. */
const CONSUMED_PREPARED_WHOLE_HEART_MECHANICS_STEPS_V1 =
  new WeakSet<object>();

export function initializeWholeHeartMechanicsColdV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: WholeHeartMechanicsColdInputV1<TDrive>,
): WholeHeartMechanicsColdResultV1<TState> {
  validateProvider(provider);
  validateTime(input.timeSec, "timeSec");
  validateVolumes(input.volumesMl, "volumesMl");
  const result = provider.initializeCold({
    ...input,
    volumesMl: copyChambers(input.volumesMl),
  });
  assertReady(result, "cold initialization");
  return Object.freeze({
    acceptedState: acceptedState(provider, {
      revision: 0,
      timeSec: input.timeSec,
      volumesMl: input.volumesMl,
      materialState: result.materialState,
    }),
    transmuralPressuresMmHg: copyChambers(result.transmuralPressuresMmHg),
    ...(result.transmuralPressureVolumeTangentMmHgPerMl === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          copyPressureVolumeTangent(
            result.transmuralPressureVolumeTangentMmHgPerMl,
          ),
      }),
    diagnostics: copyDiagnosticsWithReadbackSnapshot(result.diagnostics),
  });
}

export function evaluateWholeHeartMechanicsTrialV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: WholeHeartMechanicsTrialInputV1<TState, TDrive>,
): WholeHeartMechanicsTrialV1<TState> {
  const preparedStep = prepareWholeHeartMechanicsStepV1(provider, {
    previousAcceptedState: input.previousAcceptedState,
    candidateTimeSec: input.candidateTimeSec,
    stepDtSec: input.stepDtSec,
    drivingInputs: input.drivingInputs,
  });
  return evaluatePreparedWholeHeartMechanicsTrialV1(
    preparedStep,
    input.candidateVolumesMl,
  );
}

/**
 * Performs the checked public-boundary audit once for one outer solver step.
 * Candidate evaluation and final promotion may then use the trusted helpers
 * below without re-auditing the same accepted material state.
 *
 * The audit always clones, re-encodes and re-fingerprints accepted material in
 * both integrity tiers. Accepted state is public boundary data even when this
 * module minted the wrapper: callers can write through typed-array elements,
 * which JavaScript cannot freeze. The provider still never receives the object
 * the caller holds.
 */
export function prepareWholeHeartMechanicsStepV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: Readonly<{
    previousAcceptedState: WholeHeartMechanicsAcceptedStateV1<TState>;
    candidateTimeSec: number;
    stepDtSec: number;
    drivingInputs: TDrive;
  }>,
): WholeHeartMechanicsPreparedStepV1<TState, TDrive> {
  validateProvider(provider);
  const auditedPrevious = auditAcceptedState(provider, input.previousAcceptedState);
  validatePositive(input.stepDtSec, "stepDtSec");
  validateTime(input.candidateTimeSec, "candidateTimeSec");
  validateCandidateTime(
    auditedPrevious.state,
    input.candidateTimeSec,
    input.stepDtSec,
  );
  const preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive> =
    Object.freeze({
      contextId: WHOLE_HEART_MECHANICS_PREPARED_STEP_V1_ID,
      providerId: provider.providerId,
      parameterSetId: provider.parameterSetId,
      parameterIdentityHash: provider.parameterIdentityHash,
      stateSchemaVersion: provider.stateSchemaVersion,
      baseRevision: auditedPrevious.state.revision,
      baseAcceptedTimeSec: auditedPrevious.state.acceptedTimeSec,
      candidateTimeSec: input.candidateTimeSec,
      stepDtSec: input.stepDtSec,
    });
  PREPARED_WHOLE_HEART_MECHANICS_STEP_INTERNALS_V1.set(
    preparedStep,
    Object.freeze({
      provider,
      previousAcceptedState: auditedPrevious.state,
      candidateTimeSec: input.candidateTimeSec,
      stepDtSec: input.stepDtSec,
      drivingInputs: cloneDrivingInputsForPreparedStep(
        provider,
        input.drivingInputs,
      ),
    } satisfies PreparedWholeHeartMechanicsStepInternalV1<TState, TDrive>),
  );
  return preparedStep;
}

/** Trusted candidate path: the provider and accepted baseline were audited by prepare. */
export function evaluatePreparedWholeHeartMechanicsTrialV1<TState, TDrive>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
): WholeHeartMechanicsTrialV1<TState> {
  const context = preparedStepInternal(preparedStep);
  if (context.provider.evaluationResultOwnershipMode !== "exclusive-result") {
    return evaluatePreparedWholeHeartMechanicsTrialEagerV1(
      preparedStep,
      context,
      candidateVolumesMl,
    );
  }
  const probe = evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
    preparedStep,
    candidateVolumesMl,
  );
  return sealPreparedWholeHeartMechanicsCandidateProbeV1(
    preparedStep,
    probe,
  );
}

/**
 * Evaluates one nonlinear-solver candidate without serializing material state
 * or recursively validating rich provider readback. Exclusive provider-result
 * ownership preserves isolation while the state stays private. Discarded
 * probes are reclaimed with their WeakMap entry and cannot be committed.
 */
export function evaluatePreparedWholeHeartMechanicsCandidateProbeV1<
  TState,
  TDrive,
>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
): WholeHeartMechanicsCandidateProbeV1<TState, TDrive> {
  const context = preparedStepInternal(preparedStep);
  if (context.provider.evaluationResultOwnershipMode !== "exclusive-result") {
    throw new Error(
      "whole-heart mechanics candidate probes require provider exclusive-result ownership",
    );
  }
  validateVolumes(candidateVolumesMl, "candidateVolumesMl");
  const candidateVolumes = copyChambers(candidateVolumesMl);
  const result = context.provider.evaluateTrial({
    previousAcceptedState: acceptedStateForPreparedEvaluation(
      context.provider,
      context.previousAcceptedState,
    ),
    candidateTimeSec: context.candidateTimeSec,
    stepDtSec: context.stepDtSec,
    candidateVolumesMl: candidateVolumes,
    drivingInputs: cloneDrivingInputsForPreparedStep(
      context.provider,
      context.drivingInputs,
    ),
  });
  validateProbeDiagnostics(result.diagnostics);
  const candidateMaterialState = result.materialState;
  const probe: WholeHeartMechanicsCandidateProbeV1<TState, TDrive> =
    Object.freeze({
      probeId: WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID,
      providerId: preparedStep.providerId,
      parameterSetId: preparedStep.parameterSetId,
      parameterIdentityHash: preparedStep.parameterIdentityHash,
      stateSchemaVersion: preparedStep.stateSchemaVersion,
      baseRevision: preparedStep.baseRevision,
      baseAcceptedTimeSec: preparedStep.baseAcceptedTimeSec,
      candidateTimeSec: preparedStep.candidateTimeSec,
      stepDtSec: preparedStep.stepDtSec,
      candidateVolumesMl: candidateVolumes,
      transmuralPressuresMmHg: copyChambers(result.transmuralPressuresMmHg),
      ...(result.transmuralPressureVolumeTangentMmHgPerMl === undefined
        ? {}
        : {
          transmuralPressureVolumeTangentMmHgPerMl:
            copyPressureVolumeTangent(
              result.transmuralPressureVolumeTangentMmHgPerMl,
            ),
        }),
      diagnostics: copyProbeDiagnostics(result.diagnostics),
    });
  WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_INTERNALS_V1.set(
    probe,
    Object.freeze({
      preparedStep,
      candidateMaterialState,
      readback: result.diagnostics.readback,
    } satisfies WholeHeartMechanicsCandidateProbeInternalV1<TState, TDrive>),
  );
  return probe;
}

/**
 * Compatibility path for providers that have not proved exclusive ownership.
 * The provider result is copied and serialized before this function returns,
 * so a later callback may safely reuse mutable scratch storage.
 */
function evaluatePreparedWholeHeartMechanicsTrialEagerV1<TState, TDrive>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  context: PreparedWholeHeartMechanicsStepInternalV1<TState, TDrive>,
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
): WholeHeartMechanicsTrialV1<TState> {
  validateVolumes(candidateVolumesMl, "candidateVolumesMl");
  const candidateVolumes = copyChambers(candidateVolumesMl);
  const result = context.provider.evaluateTrial({
    previousAcceptedState: acceptedStateForPreparedEvaluation(
      context.provider,
      context.previousAcceptedState,
    ),
    candidateTimeSec: context.candidateTimeSec,
    stepDtSec: context.stepDtSec,
    candidateVolumesMl: candidateVolumes,
    drivingInputs: cloneDrivingInputsForPreparedStep(
      context.provider,
      context.drivingInputs,
    ),
  });
  validateDiagnostics(result.diagnostics);
  const candidateSnapshot = snapshotMaterialState(
    context.provider,
    result.materialState,
    "candidate material state",
  );
  const trial = Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: preparedStep.providerId,
    parameterSetId: preparedStep.parameterSetId,
    parameterIdentityHash: preparedStep.parameterIdentityHash,
    stateSchemaVersion: preparedStep.stateSchemaVersion,
    baseRevision: preparedStep.baseRevision,
    baseAcceptedTimeSec: preparedStep.baseAcceptedTimeSec,
    candidateTimeSec: preparedStep.candidateTimeSec,
    stepDtSec: preparedStep.stepDtSec,
    candidateVolumesMl: candidateVolumes,
    candidateMaterialState: candidateSnapshot.materialState,
    candidateMaterialStateFingerprint: candidateSnapshot.fingerprint,
    transmuralPressuresMmHg: copyChambers(result.transmuralPressuresMmHg),
    ...(result.transmuralPressureVolumeTangentMmHgPerMl === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          copyPressureVolumeTangent(
            result.transmuralPressureVolumeTangentMmHgPerMl,
          ),
      }),
    diagnostics: copyDiagnosticsWithReadbackSnapshot(result.diagnostics),
  });
  PREPARED_WHOLE_HEART_MECHANICS_TRIAL_CONTEXTS_V1.set(
    trial,
    preparedStep,
  );
  return trial;
}

function livePreparedWholeHeartMechanicsCandidateProbeInternalV1<
  TState,
  TDrive,
>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  probe: WholeHeartMechanicsCandidateProbeV1<TState, TDrive>,
): WholeHeartMechanicsCandidateProbeInternalV1<TState, TDrive> {
  preparedStepInternal(preparedStep);
  if (
    probe.probeId !== WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID
    || probe.providerId !== preparedStep.providerId
    || probe.parameterSetId !== preparedStep.parameterSetId
    || probe.parameterIdentityHash !== preparedStep.parameterIdentityHash
    || probe.stateSchemaVersion !== preparedStep.stateSchemaVersion
    || probe.baseRevision !== preparedStep.baseRevision
    || !nearlyEqual(
      probe.baseAcceptedTimeSec,
      preparedStep.baseAcceptedTimeSec,
    )
    || !nearlyEqual(probe.candidateTimeSec, preparedStep.candidateTimeSec)
    || !nearlyEqual(probe.stepDtSec, preparedStep.stepDtSec)
  ) {
    throw new Error("whole-heart mechanics candidate probe identity mismatch");
  }
  const internal = WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_INTERNALS_V1.get(
    probe,
  ) as WholeHeartMechanicsCandidateProbeInternalV1<TState, TDrive>
    | undefined;
  if (!internal) {
    throw new Error(
      "whole-heart mechanics candidate probe is not live or was already sealed",
    );
  }
  if (internal.preparedStep !== preparedStep) {
    throw new Error(
      "whole-heart mechanics candidate probe does not belong to prepared step",
    );
  }
  return internal;
}

/**
 * Reads one still-private provider readback for model-owned candidate coupling.
 * The provider's exclusive-result capability keeps it immutable for the live
 * probe lifetime. Generic recursive validation and serialization remain
 * deferred until the selected probe is sealed; every field consumed before
 * that boundary must be validated by its model-owned typed adapter.
 */
export function inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1<
  TState,
  TDrive,
>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  probe: WholeHeartMechanicsCandidateProbeV1<TState, TDrive>,
): WholeHeartMechanicsSerializableValueV1 | null {
  return livePreparedWholeHeartMechanicsCandidateProbeInternalV1(
    preparedStep,
    probe,
  ).readback;
}

/**
 * Materializes the one selected candidate into the unchanged public trial.
 * A probe is live for exactly one successful seal and is bound to the exact
 * prepared-step object that created it; foreign or already-sealed probes fail.
 */
export function sealPreparedWholeHeartMechanicsCandidateProbeV1<
  TState,
  TDrive,
>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  probe: WholeHeartMechanicsCandidateProbeV1<TState, TDrive>,
): WholeHeartMechanicsTrialV1<TState> {
  const context = preparedStepInternal(preparedStep);
  const internal = livePreparedWholeHeartMechanicsCandidateProbeInternalV1(
    preparedStep,
    probe,
  );
  const diagnostics = Object.freeze({
    ...probe.diagnostics,
    readback: internal.readback,
  });
  validateDiagnostics(diagnostics);
  const candidateSnapshot = snapshotMaterialState(
    context.provider,
    internal.candidateMaterialState,
    "candidate material state",
  );
  const trial: WholeHeartMechanicsTrialV1<TState> = Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: probe.providerId,
    parameterSetId: probe.parameterSetId,
    parameterIdentityHash: probe.parameterIdentityHash,
    stateSchemaVersion: probe.stateSchemaVersion,
    baseRevision: probe.baseRevision,
    baseAcceptedTimeSec: probe.baseAcceptedTimeSec,
    candidateTimeSec: probe.candidateTimeSec,
    stepDtSec: probe.stepDtSec,
    candidateVolumesMl: probe.candidateVolumesMl,
    candidateMaterialState: candidateSnapshot.materialState,
    candidateMaterialStateFingerprint: candidateSnapshot.fingerprint,
    transmuralPressuresMmHg: probe.transmuralPressuresMmHg,
    ...(probe.transmuralPressureVolumeTangentMmHgPerMl === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          probe.transmuralPressureVolumeTangentMmHgPerMl,
      }),
    diagnostics: copyDiagnosticsWithReadbackSnapshot(diagnostics),
  });
  PREPARED_WHOLE_HEART_MECHANICS_TRIAL_CONTEXTS_V1.set(
    trial,
    preparedStep,
  );
  WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_INTERNALS_V1.delete(probe);
  return trial;
}

/** Pure state promotion: no provider callback is allowed during commit. */
export function commitWholeHeartMechanicsTrialV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  previous: WholeHeartMechanicsAcceptedStateV1<TState>,
  trial: WholeHeartMechanicsTrialV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  const auditedPrevious = auditAcceptedState(provider, previous);
  return commitWholeHeartMechanicsTrialAgainstPreparedBaseline(
    provider,
    auditedPrevious.state,
    trial,
  );
}

/**
 * Trusted final promotion for a prepared outer step. The accepted baseline is
 * not re-audited; the externally visible trial is checked in full — identity,
 * staleness, candidate time, candidate volumes, readiness — and its material
 * state is re-encoded and fingerprinted at this public boundary before being
 * cloned into the promoted accepted state, so the two never alias.
 */
export function commitPreparedWholeHeartMechanicsTrialV1<TState, TDrive>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
  trial: WholeHeartMechanicsTrialV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  const context = preparedStepInternal(preparedStep);
  if (
    PREPARED_WHOLE_HEART_MECHANICS_TRIAL_CONTEXTS_V1.get(trial)
      !== preparedStep
  ) {
    throw new Error(
      "whole-heart mechanics trial was not issued by this prepared step",
    );
  }
  if (
    !nearlyEqual(trial.candidateTimeSec, context.candidateTimeSec) ||
    !nearlyEqual(trial.stepDtSec, context.stepDtSec)
  ) throw new Error("whole-heart mechanics trial does not belong to prepared step");
  const committed = commitWholeHeartMechanicsTrialAgainstPreparedBaseline(
    context.provider,
    context.previousAcceptedState,
    trial,
  );
  CONSUMED_PREPARED_WHOLE_HEART_MECHANICS_STEPS_V1.add(preparedStep);
  return committed;
}

function commitWholeHeartMechanicsTrialAgainstPreparedBaseline<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  previous: WholeHeartMechanicsAcceptedStateV1<TState>,
  trial: WholeHeartMechanicsTrialV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  if (
    trial.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    trial.providerId !== provider.providerId ||
    trial.parameterSetId !== provider.parameterSetId ||
    trial.parameterIdentityHash !== provider.parameterIdentityHash ||
    trial.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("whole-heart mechanics trial identity mismatch");
  if (
    trial.baseRevision !== previous.revision ||
    !nearlyEqual(trial.baseAcceptedTimeSec, previous.acceptedTimeSec)
  ) throw new Error("stale whole-heart mechanics trial cannot be committed");
  validateCandidateTime(previous, trial.candidateTimeSec, trial.stepDtSec);
  validateVolumes(trial.candidateVolumesMl, "trial.candidateVolumesMl");
  const candidateSnapshot = snapshotMaterialState(
    provider,
    trial.candidateMaterialState,
    "candidate material state",
  );
  if (candidateSnapshot.fingerprint !== trial.candidateMaterialStateFingerprint) {
    throw new Error(
      "candidate material state fingerprint mismatch; snapshot was mutated or decoded inconsistently",
    );
  }
  assertReady({
    materialState: candidateSnapshot.materialState,
    transmuralPressuresMmHg: trial.transmuralPressuresMmHg,
    ...(trial.transmuralPressureVolumeTangentMmHgPerMl === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          trial.transmuralPressureVolumeTangentMmHgPerMl,
      }),
    diagnostics: trial.diagnostics,
  }, "trial commit");
  return acceptedStateFromOwnedSnapshot(provider, {
    revision: previous.revision + 1,
    timeSec: trial.candidateTimeSec,
    volumesMl: trial.candidateVolumesMl,
    materialState: candidateSnapshot.materialState,
    materialStateFingerprint: candidateSnapshot.fingerprint,
  });
}

export function cloneWholeHeartMechanicsAcceptedStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  return auditAcceptedState(provider, state).state;
}

/**
 * Transfers one accepted mechanics state between two parameterizations of the
 * same provider and state schema without changing its accepted clock or
 * material memory.
 *
 * This is the explicit accepted-boundary seam for a warm parameter change.
 * The source is fully audited with its owning provider, serialized through the
 * source codec, decoded through the target codec, and then re-stamped with the
 * target provider identity. A different provider implementation or state
 * schema is never treated as warm-start compatible.
 */
export function rebindWholeHeartMechanicsAcceptedStateV1<TState, TDrive>(
  sourceProvider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  targetProvider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(sourceProvider);
  validateProvider(targetProvider);
  if (
    sourceProvider.providerId !== targetProvider.providerId
    || sourceProvider.stateSchemaVersion !== targetProvider.stateSchemaVersion
  ) {
    throw new Error(
      "whole-heart mechanics warm rebind requires one provider and state schema",
    );
  }
  const source = auditAcceptedState(sourceProvider, state);
  return acceptedState(targetProvider, {
    revision: source.state.revision,
    timeSec: source.state.acceptedTimeSec,
    volumesMl: source.state.acceptedVolumesMl,
    materialState: targetProvider.stateCodec.decode(
      source.encodedMaterialState,
    ),
  });
}

/** JSON.stringify(checkpoint) is the stable contract snapshot payload. */
export function checkpointWholeHeartMechanicsStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsCheckpointV1 {
  validateProvider(provider);
  const audited = auditAcceptedState(provider, state);
  const materialState = audited.encodedMaterialState;
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: audited.state.providerId,
    parameterSetId: audited.state.parameterSetId,
    parameterIdentityHash: audited.state.parameterIdentityHash,
    stateSchemaVersion: audited.state.stateSchemaVersion,
    revision: audited.state.revision,
    acceptedTimeSec: audited.state.acceptedTimeSec,
    acceptedVolumesMl: copyChambers(audited.state.acceptedVolumesMl),
    materialState,
    materialStateFingerprint: audited.state.materialStateFingerprint,
  });
}

export function restoreWholeHeartMechanicsStateV1<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  checkpoint: WholeHeartMechanicsCheckpointV1,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateProvider(provider);
  if (
    checkpoint.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    checkpoint.providerId !== provider.providerId ||
    checkpoint.parameterSetId !== provider.parameterSetId ||
    checkpoint.parameterIdentityHash !== provider.parameterIdentityHash ||
    checkpoint.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("whole-heart mechanics checkpoint identity mismatch");
  validateInteger(checkpoint.revision, "checkpoint revision");
  validateTime(checkpoint.acceptedTimeSec, "checkpoint acceptedTimeSec");
  validateVolumes(checkpoint.acceptedVolumesMl, "checkpoint acceptedVolumesMl");
  validateSerializable(checkpoint.materialState, "checkpoint material state");
  if (fingerprintSerializable(checkpoint.materialState) !== checkpoint.materialStateFingerprint) {
    throw new Error("checkpoint material state fingerprint mismatch");
  }
  return acceptedState(provider, {
    revision: checkpoint.revision,
    timeSec: checkpoint.acceptedTimeSec,
    volumesMl: checkpoint.acceptedVolumesMl,
    materialState: provider.stateCodec.decode(checkpoint.materialState),
  });
}

function acceptedState<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: {
    revision: number;
    timeSec: number;
    volumesMl: WholeHeartMechanicsChamberValuesV1;
    materialState: TState;
  },
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateInteger(input.revision, "revision");
  validateTime(input.timeSec, "acceptedTimeSec");
  validateVolumes(input.volumesMl, "acceptedVolumesMl");
  const snapshot = snapshotMaterialState(provider, input.materialState, "material state");
  return acceptedStateFromOwnedSnapshot(provider, {
    ...input,
    materialState: snapshot.materialState,
    materialStateFingerprint: snapshot.fingerprint,
  });
}

function acceptedStateFromOwnedSnapshot<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  input: {
    revision: number;
    timeSec: number;
    volumesMl: WholeHeartMechanicsChamberValuesV1;
    materialState: TState;
    materialStateFingerprint: string;
  },
): WholeHeartMechanicsAcceptedStateV1<TState> {
  validateInteger(input.revision, "revision");
  validateTime(input.timeSec, "acceptedTimeSec");
  validateVolumes(input.volumesMl, "acceptedVolumesMl");
  const state = Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
    revision: input.revision,
    acceptedTimeSec: input.timeSec,
    acceptedVolumesMl: copyChambers(input.volumesMl),
    materialState: input.materialState,
    materialStateFingerprint: input.materialStateFingerprint,
  });
  return state;
}

function assertReady<TState>(
  result: WholeHeartMechanicsProviderEvaluationV1<TState>,
  label: string,
): void {
  validateDiagnostics(result.diagnostics);
  if (result.transmuralPressureVolumeTangentMmHgPerMl !== undefined) {
    validatePressureVolumeTangent(
      result.transmuralPressureVolumeTangentMmHgPerMl,
      "transmuralPressureVolumeTangentMmHgPerMl",
    );
  }
  if (
    !result.diagnostics.converged ||
    !result.diagnostics.finite ||
    result.diagnostics.errors.length > 0 ||
    !chamberNumbers(result.transmuralPressuresMmHg).every(Number.isFinite)
  ) throw new Error(`${label} is not ready`);
}

function validateProvider<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
): void {
  if (provider.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID) {
    throw new Error("whole-heart mechanics provider contractId mismatch");
  }
  if (!provider.providerId.trim()) throw new Error("providerId must be non-empty");
  if (!provider.parameterSetId.trim()) throw new Error("parameterSetId must be non-empty");
  if (!provider.parameterIdentityHash.trim()) {
    throw new Error("parameterIdentityHash must be non-empty");
  }
  if (
    provider.cloneDrivingInputs !== undefined
    && typeof provider.cloneDrivingInputs !== "function"
  ) {
    throw new Error("cloneDrivingInputs must be a function when provided");
  }
  if (
    provider.acceptedStateInputMode !== undefined
    && provider.acceptedStateInputMode !== "defensive-clone"
    && provider.acceptedStateInputMode !== "trusted-read-only-prepared-snapshot"
  ) {
    throw new Error("acceptedStateInputMode is unsupported");
  }
  if (
    provider.evaluationResultOwnershipMode !== undefined
    && provider.evaluationResultOwnershipMode !== "defensive-snapshot-required"
    && provider.evaluationResultOwnershipMode !== "exclusive-result"
  ) {
    throw new Error("evaluationResultOwnershipMode is unsupported");
  }
  validateInteger(provider.stateSchemaVersion, "stateSchemaVersion");
}

function auditAcceptedState<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): Readonly<{
  state: WholeHeartMechanicsAcceptedStateV1<TState>;
  encodedMaterialState: WholeHeartMechanicsSerializableValueV1;
}> {
  if (
    state.contractId !== WHOLE_HEART_MECHANICS_CONTRACT_V1_ID ||
    state.providerId !== provider.providerId ||
    state.parameterSetId !== provider.parameterSetId ||
    state.parameterIdentityHash !== provider.parameterIdentityHash ||
    state.stateSchemaVersion !== provider.stateSchemaVersion
  ) throw new Error("accepted whole-heart mechanics state identity mismatch");
  validateInteger(state.revision, "accepted revision");
  validateTime(state.acceptedTimeSec, "acceptedTimeSec");
  validateVolumes(state.acceptedVolumesMl, "acceptedVolumesMl");
  const snapshot = snapshotMaterialState(
    provider,
    state.materialState,
    "accepted material state",
  );
  if (snapshot.fingerprint !== state.materialStateFingerprint) {
    throw new Error(
      "accepted material state fingerprint mismatch; snapshot was mutated or decoded inconsistently",
    );
  }
  return Object.freeze({
    state: acceptedStateFromOwnedSnapshot(provider, {
      revision: state.revision,
      timeSec: state.acceptedTimeSec,
      volumesMl: state.acceptedVolumesMl,
      materialState: snapshot.materialState,
      materialStateFingerprint: snapshot.fingerprint,
    }),
    encodedMaterialState: snapshot.encoded,
  });
}

function cloneAcceptedStateWithoutAudit<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  return Object.freeze({
    contractId: state.contractId,
    providerId: state.providerId,
    parameterSetId: state.parameterSetId,
    parameterIdentityHash: state.parameterIdentityHash,
    stateSchemaVersion: state.stateSchemaVersion,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    acceptedVolumesMl: copyChambers(state.acceptedVolumesMl),
    materialState: provider.stateCodec.clone(state.materialState),
    materialStateFingerprint: state.materialStateFingerprint,
  });
}

function acceptedStateForPreparedEvaluation<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: WholeHeartMechanicsAcceptedStateV1<TState>,
): WholeHeartMechanicsAcceptedStateV1<TState> {
  const usesTrustedSnapshot = provider.acceptedStateInputMode ===
    "trusted-read-only-prepared-snapshot";
  return usesTrustedSnapshot
    ? state
    : cloneAcceptedStateWithoutAudit(provider, state);
}

function preparedStepInternal<TState, TDrive>(
  preparedStep: WholeHeartMechanicsPreparedStepV1<TState, TDrive>,
): PreparedWholeHeartMechanicsStepInternalV1<TState, TDrive> {
  if (
    preparedStep.contextId !== WHOLE_HEART_MECHANICS_PREPARED_STEP_V1_ID
  ) throw new Error("whole-heart mechanics prepared step identity mismatch");
  if (CONSUMED_PREPARED_WHOLE_HEART_MECHANICS_STEPS_V1.has(preparedStep)) {
    throw new Error("whole-heart mechanics prepared step was already consumed");
  }
  const context = PREPARED_WHOLE_HEART_MECHANICS_STEP_INTERNALS_V1.get(
    preparedStep,
  );
  if (!context) {
    throw new Error(
      "whole-heart mechanics prepared step is not a live checked context",
    );
  }
  return context as PreparedWholeHeartMechanicsStepInternalV1<TState, TDrive>;
}

function cloneDrivingInputsForPreparedStep<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  drivingInputs: TDrive,
): TDrive {
  return provider.cloneDrivingInputs === undefined
    ? drivingInputs
    : provider.cloneDrivingInputs(drivingInputs);
}

function validateCandidateTime<TState>(
  previous: WholeHeartMechanicsAcceptedStateV1<TState>,
  candidateTimeSec: number,
  stepDtSec: number,
): void {
  validatePositive(stepDtSec, "stepDtSec");
  const expected = previous.acceptedTimeSec + stepDtSec;
  if (!nearlyEqual(candidateTimeSec, expected)) {
    throw new Error(`candidateTimeSec must equal ${expected}`);
  }
}

function validateDiagnostics(value: WholeHeartMechanicsDiagnosticsV1): void {
  validateProbeDiagnostics(value);
  validateSerializable(value.readback, "diagnostics.readback");
}

function validateProbeDiagnostics(
  value: Omit<WholeHeartMechanicsDiagnosticsV1, "readback">
    & Partial<Pick<WholeHeartMechanicsDiagnosticsV1, "readback">>,
): void {
  validateInteger(value.iterationCount, "diagnostics.iterationCount");
  if (!Number.isFinite(value.residualNorm) || value.residualNorm < 0) {
    throw new Error("diagnostics.residualNorm must be finite and nonnegative");
  }
  if (!value.errors.every((entry) => typeof entry === "string")) {
    throw new Error("diagnostics.errors must contain strings");
  }
  if (!value.warnings.every((entry) => typeof entry === "string")) {
    throw new Error("diagnostics.warnings must contain strings");
  }
}

function validateVolumes(
  value: WholeHeartMechanicsChamberValuesV1,
  label: string,
): void {
  if (!value || typeof value !== "object") throw new Error(`${label} is required`);
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    const volume = value[chamber];
    if (!Number.isFinite(volume) || volume < 0) {
      throw new Error(`${label}.${chamber} must be finite and nonnegative`);
    }
  }
}

function validateSerializable(value: unknown, label: string): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateSerializable(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    Object.entries(value).forEach(([key, item]) => validateSerializable(item, `${label}.${key}`));
    return;
  }
  throw new Error(`${label} is not JSON-serializable`);
}

function snapshotMaterialState<TState, TDrive>(
  provider: WholeHeartMechanicsProviderV1<TState, TDrive>,
  state: TState,
  label: string,
): Readonly<{
  materialState: TState;
  encoded: WholeHeartMechanicsSerializableValueV1;
  fingerprint: string;
}> {
  const materialState = provider.stateCodec.clone(state);
  // Encode a separate clone: codecs remain unable to mutate the owned snapshot
  // even if an implementation accidentally treats encode as a consuming pass.
  // Both the extra clone and the serializability walk guard against a
  // misbehaving codec rather than producing a value, so they belong to the
  // full-invariant tier; see engine/hotPathIntegrityTierV1.ts.
  if (fullHotPathInvariantsEnabledV1()) {
    const encoded = provider.stateCodec.encode(
      provider.stateCodec.clone(materialState),
    );
    validateSerializable(encoded, label);
    return Object.freeze({
      materialState,
      encoded,
      fingerprint: fingerprintSerializable(encoded),
    });
  }
  const encoded = provider.stateCodec.encode(materialState);
  return Object.freeze({
    materialState,
    encoded,
    fingerprint: fingerprintSerializable(encoded),
  });
}

function fingerprintSerializable(value: WholeHeartMechanicsSerializableValueV1): string {
  const text = canonicalSerializableString(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalSerializableString(
  value: WholeHeartMechanicsSerializableValueV1,
): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("cannot fingerprint a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalSerializableString).join(",")}]`;
  }
  const record = value as { readonly [key: string]: WholeHeartMechanicsSerializableValueV1 };
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalSerializableString(record[key]!)}`
  ).join(",")}}`;
}

function copyChambers(
  value: WholeHeartMechanicsChamberValuesV1,
): WholeHeartMechanicsChamberValuesV1 {
  return Object.freeze({ LA: value.LA, LV: value.LV, RA: value.RA, RV: value.RV });
}

function copyPressureVolumeTangent(
  value: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
): WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1 {
  validatePressureVolumeTangent(
    value,
    "transmuralPressureVolumeTangentMmHgPerMl",
  );
  return Object.freeze({
    LA: copyChambers(value.LA),
    LV: copyChambers(value.LV),
    RA: copyChambers(value.RA),
    RV: copyChambers(value.RV),
  });
}

function validatePressureVolumeTangent(
  value: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  label: string,
): void {
  if (!value || typeof value !== "object") throw new Error(`${label} is required`);
  for (const pressureChamber of ["LA", "LV", "RA", "RV"] as const) {
    const row = value[pressureChamber];
    if (!row || typeof row !== "object") {
      throw new Error(`${label}.${pressureChamber} is required`);
    }
    for (const volumeChamber of ["LA", "LV", "RA", "RV"] as const) {
      if (!Number.isFinite(row[volumeChamber])) {
        throw new Error(
          `${label}.${pressureChamber}.${volumeChamber} must be finite`,
        );
      }
    }
  }
}

function copyDiagnostics(
  value: WholeHeartMechanicsDiagnosticsV1,
): WholeHeartMechanicsDiagnosticsV1 {
  return Object.freeze({
    ...value,
    errors: Object.freeze([...value.errors]),
    warnings: Object.freeze([...value.warnings]),
  });
}

/**
 * Deep-copies the provider's diagnostic readback so a provider that reuses
 * scratch storage cannot mutate a published trial's diagnostics.
 *
 * The copy is defensive only: the readback is opaque to this contract, never
 * enters an accepted value, a pressure, a tangent or a checkpoint, and its
 * contents are identical either way. It therefore belongs to the full-invariant
 * tier; see engine/hotPathIntegrityTierV1.ts. In the lean tier the provider's
 * readback is published by reference, which is the same guarantee the contract
 * already gives for `evaluation` payloads it does not own.
 */
function copyDiagnosticsWithReadbackSnapshot(
  value: WholeHeartMechanicsDiagnosticsV1,
): WholeHeartMechanicsDiagnosticsV1 {
  return Object.freeze({
    ...copyDiagnostics(value),
    readback: fullHotPathInvariantsEnabledV1()
      ? cloneSerializableValue(value.readback)
      : value.readback,
  });
}

function cloneSerializableValue(
  value: WholeHeartMechanicsSerializableValueV1,
): WholeHeartMechanicsSerializableValueV1 {
  if (
    value === null
    || typeof value === "boolean"
    || typeof value === "number"
    || typeof value === "string"
  ) return value;
  if (Array.isArray(value)) {
    return Object.freeze(value.map(cloneSerializableValue));
  }
  return Object.freeze(Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      cloneSerializableValue(child),
    ]),
  ));
}

function copyProbeDiagnostics(
  value: WholeHeartMechanicsDiagnosticsV1,
): Readonly<Omit<WholeHeartMechanicsDiagnosticsV1, "readback">> {
  return Object.freeze({
    converged: value.converged,
    finite: value.finite,
    iterationCount: value.iterationCount,
    residualNorm: value.residualNorm,
    errors: Object.freeze([...value.errors]),
    warnings: Object.freeze([...value.warnings]),
  });
}

function chamberNumbers(value: WholeHeartMechanicsChamberValuesV1): number[] {
  return [value.LA, value.LV, value.RA, value.RV];
}

function validateInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
}

function validateTime(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be finite and nonnegative`);
}

function validatePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be finite and positive`);
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}

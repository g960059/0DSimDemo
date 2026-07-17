import {
  checkpointNonCoronaryCirculationStateV2,
  commitNonCoronaryCirculationTrialV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  restoreNonCoronaryCirculationStateV2,
  type NonCoronaryCirculationCheckpointV2,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
  type NonCoronaryCirculationTrialFailureReasonV1,
  type NonCoronaryCirculationTrialFailureV1,
  type NonCoronaryCirculationTrialSuccessV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  respiratoryExternalPressureForKindV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  cloneFiveWallCalciumAcceptedStateV1,
  commitFiveWallCalciumTrialV1,
  createFixedSinusFiveWallCalciumEventScheduleV1,
  evaluateFiveWallCalciumTrialV1,
  initializeFiveWallCalciumAcceptedStateV1,
  type FiveWallCalciumAcceptedStateV1,
  type FiveWallCalciumEventScheduleProviderV1,
  type FiveWallCalciumInitializationV1,
  type FiveWallCalciumRepresentationV1,
  type FiveWallCalciumTrialV1,
} from "@/engine/myocardium/calcium/fiveWallExactEventCalciumDriveV1";
import {
  checkpointFiveWallCalciumAcceptedStateV2,
  restoreFiveWallCalciumAcceptedStateV2,
  restoreFiveWallCalciumAtFixedPeriodicCycleWithRevisionResetV2,
  type FiveWallCalciumCheckpointV2,
} from "@/engine/myocardium/checkpoint/fiveWallCalciumCheckpointV2";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  isCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumEvaluationV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  checkpointWholeHeartMechanicsStateV1,
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsCheckpointV1,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  exactFiniteJsonCanonicalStringV1,
  exactFiniteJsonFingerprintV1,
  requireCheckpointRecordV1,
  requireExactCheckpointKeysV1,
} from "@/engine/core/exactFiniteJsonCheckpointV1";
import { stableHash } from "@/engine/myocardium/kinematics/stableHash";

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID =
  "main-wire-five-wall-noncoronary-transaction-v1" as const;

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_CHECKPOINT_V2_ID =
  "main-wire-five-wall-noncoronary-checkpoint-v2" as const;

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_PROTOCOL_BINDING_V2_ID =
  "main-wire-five-wall-noncoronary-protocol-binding-v2" as const;

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1 =
  Object.freeze({
    circulationOwner:
      "main-wire-derived-noncoronary-experimental-transaction" as const,
    modelCoreRuntimeAdopted: false as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    chamberPressureInterface: "transmural-provider-to-absolute-node" as const,
    commonIntrathoracicPressureAppliedOnce: true as const,
    calciumStateOwner: "five-wall-two-state-exact-event-driver" as const,
    circulationMechanicsAndCalciumCommit:
      "atomic-after-all-trials-succeed" as const,
    failureSemantics: "rollback-all-three-accepted-states" as const,
    pericardialConstraintInterface:
      "required-conservative-common-pressure-binding" as const,
    pericardialPressureAppliedOnceToFourAbsoluteChamberPressures: true as const,
    pericardialPressureAppliedToTriSegInternalForce: false as const,
    pericardialFluidOwnedAsBloodVolume: false as const,
    checkpointSchema: 2 as const,
    checkpointRestore: "exact-time-by-default" as const,
    revisionSemantics:
      "accepted-coupled-subinterval-count-not-nominal-grid-step-count" as const,
    cycleTranslation:
      "canonical-fixed-periodic-phase-boundary-with-revision-reset-only" as const,
    laaBodyCompartmentsApplied: false as const,
    coronaryCirculationIncluded: false as const,
    parameterFittingOwnedHere: false as const,
  });

export type MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  circulation: NonCoronaryCirculationAcceptedStateV1;
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>;
  calcium: FiveWallCalciumAcceptedStateV1;
}>;

export type MainWireFiveWallNonCoronaryProtocolBindingV2 = Readonly<{
  bindingId: typeof MAIN_WIRE_FIVE_WALL_NONCORONARY_PROTOCOL_BINDING_V2_ID;
  circulationRuntimeSnapshot: NonCoronaryCirculationRuntimeParamsV1;
  circulationRuntimeStableHash: string;
  commonPericardiumBindingSnapshot: MainWireCommonPericardiumBindingV1;
  commonPericardiumBindingStableHash: string;
}>;

export type MainWireFiveWallNonCoronaryCheckpointV2 = Readonly<{
  checkpointId: typeof MAIN_WIRE_FIVE_WALL_NONCORONARY_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  transactionId: typeof MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  protocolBinding: MainWireFiveWallNonCoronaryProtocolBindingV2;
  circulation: NonCoronaryCirculationCheckpointV2;
  mechanics: WholeHeartMechanicsCheckpointV1;
  calcium: FiveWallCalciumCheckpointV2;
  fingerprint: string;
}>;

export type MainWireFiveWallNonCoronaryInitializeInputV1<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  calciumRepresentation?: FiveWallCalciumRepresentationV1;
  calciumInitialization?: FiveWallCalciumInitializationV1;
  calciumEventSchedule?: FiveWallCalciumEventScheduleProviderV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  circulationInitial?: Omit<
    NonCoronaryCirculationInitialStateInputV1,
    "timeSec" | "runtime"
  >;
  timeSec?: number;
}>;

export type MainWireFiveWallNonCoronaryColdResultV1<TWallState> = Readonly<{
  acceptedState: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  transmuralPressuresMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
}>;

export type MainWireFiveWallNonCoronaryStepSuccessV1<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>;
  circulationTrial: NonCoronaryCirculationTrialSuccessV1<
    WholeHeartMechanicsTrialV1<TWallState>
  >;
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  calciumTrial: FiveWallCalciumTrialV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
}>;

export type MainWireFiveWallNonCoronaryStepFailureV1<TWallState> = Readonly<{
  converged: false;
  reason: "circulation-or-mechanics-trial-failed";
  message: string;
  rollbackState: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>;
  circulationFailureReason: NonCoronaryCirculationTrialFailureReasonV1;
  lastAcceptedCandidateNodeVolumesMl:
    NonCoronaryCirculationTrialFailureV1["lastAcceptedCandidateNodeVolumesMl"];
  circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  circulationCommitted: false;
  calciumCommitted: false;
}>;

export type MainWireFiveWallNonCoronaryStepResultV1<TWallState> =
  | MainWireFiveWallNonCoronaryStepSuccessV1<TWallState>
  | MainWireFiveWallNonCoronaryStepFailureV1<TWallState>;

export function initializeMainWireFiveWallNonCoronaryV1<TWallState>(
  input: MainWireFiveWallNonCoronaryInitializeInputV1<TWallState>,
): MainWireFiveWallNonCoronaryColdResultV1<TWallState> {
  const timeSec = input.timeSec ?? 0;
  const circulation = createInitialNonCoronaryCirculationStateV1({
    ...input.circulationInitial,
    timeSec,
    runtime: input.runtime,
  });
  const calciumEventSchedule = input.calciumEventSchedule
    ?? createFixedSinusFiveWallCalciumEventScheduleV1(input.calciumDriveParams);
  const calciumInitialization = input.calciumInitialization
    ?? (input.calciumEventSchedule === undefined
      ? "regular-periodic-prehistory-from-fixed-prior"
      : (() => {
        throw new Error(
          "a custom calcium event schedule requires an explicit calciumInitialization",
        );
      })());
  const calciumCold = initializeFiveWallCalciumAcceptedStateV1(
    timeSec,
    0,
    input.calciumRepresentation
      ?? "analytic-periodic-control-with-exact-event-shadow",
    input.calciumDriveParams,
    calciumEventSchedule,
    calciumInitialization,
  );
  const calciumDrive = calciumCold.calciumDrive;
  const mechanicsCold = initializeWholeHeartMechanicsColdV1(input.provider, {
    timeSec,
    volumesMl: chamberVolumes(circulation),
    drivingInputs: calciumDrive,
  });
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(circulation),
  );
  const acceptedState = acceptedPair(
    0,
    circulation,
    mechanicsCold.acceptedState,
    calciumCold.acceptedState,
  );
  return Object.freeze({
    acceptedState,
    calciumDrive,
    transmuralPressuresMmHg: Object.freeze({
      ...mechanicsCold.transmuralPressuresMmHg,
    }),
    commonIntrathoracicPressureMmHg: commonIntrathoracicPressureMmHg(
      timeSec,
      input.runtime,
    ),
    pericardium,
  });
}

export function checkpointMainWireFiveWallNonCoronaryStateV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  state: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
  input: Readonly<{
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    calciumEventSchedule: FiveWallCalciumEventScheduleProviderV1;
    pericardium: MainWireCommonPericardiumBindingV1;
  }>,
): MainWireFiveWallNonCoronaryCheckpointV2 {
  validateAcceptedPair(state);
  evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(state.circulation),
  );
  const protocolBinding = createProtocolBindingV2(
    input.runtime,
    input.pericardium,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_FIVE_WALL_NONCORONARY_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    protocolBinding,
    circulation: checkpointNonCoronaryCirculationStateV2(state.circulation),
    mechanics: checkpointWholeHeartMechanicsStateV1(provider, state.mechanics),
    calcium: checkpointFiveWallCalciumAcceptedStateV2(
      state.calcium,
      input.calciumDriveParams,
      input.calciumEventSchedule,
    ),
  });
  return Object.freeze({
    ...payload,
    fingerprint: exactFiniteJsonFingerprintV1(payload),
  });
}

/** Exact same-time/same-revision resume. This API never rebases time. */
export function restoreMainWireFiveWallNonCoronaryStateV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  candidate: unknown,
  input: Readonly<{
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    calciumEventSchedule: FiveWallCalciumEventScheduleProviderV1;
    pericardium: MainWireCommonPericardiumBindingV1;
  }>,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  const checkpoint = parseMainWireFiveWallNonCoronaryCheckpointV2(candidate);
  return restoreExactCheckpointComponentsV2(provider, checkpoint, input);
}

/**
 * Canonical-only cycle-boundary translation. The exact checkpoint is first
 * validated against the same runtime/protocol. The returned transaction starts
 * at revision zero; arbitrary time rebase and absolute schedules are
 * intentionally unavailable.
 */
export function restoreMainWireFiveWallNonCoronaryAtFixedPeriodicCycleWithRevisionResetV2<
  TWallState,
>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  candidate: unknown,
  input: Readonly<{
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    calciumEventSchedule: FiveWallCalciumEventScheduleProviderV1;
    pericardium: MainWireCommonPericardiumBindingV1;
    targetAcceptedTimeSec: number;
  }>,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  const checkpoint = parseMainWireFiveWallNonCoronaryCheckpointV2(candidate);
  const source = restoreExactCheckpointComponentsV2(provider, checkpoint, input);
  if (!isCanonicalMainWireNormalAdultFiveWallProviderV1(provider)) {
    throw new Error(
      "cycle translation requires a factory-issued canonical autonomous five-wall provider",
    );
  }
  assertNoTimeVaryingRespirationV2(input.runtime);
  const translatedCalcium =
    restoreFiveWallCalciumAtFixedPeriodicCycleWithRevisionResetV2(
      checkpoint.calcium,
      input.calciumDriveParams,
      input.calciumEventSchedule,
      input.targetAcceptedTimeSec,
    );
  const translatedCirculation = createInitialNonCoronaryCirculationStateV1({
    timeSec: input.targetAcceptedTimeSec,
    runtime: input.runtime,
    nodeVolumesMl: source.circulation.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: source.circulation.dynamicEdgeFlowsMlPerSec,
    valveStates: source.circulation.valveStates,
  });
  const translatedMechanicsCheckpoint: WholeHeartMechanicsCheckpointV1 =
    Object.freeze({
      ...checkpoint.mechanics,
      revision: 0,
      acceptedTimeSec: input.targetAcceptedTimeSec,
    });
  const translatedMechanics = restoreWholeHeartMechanicsStateV1(
    provider,
    translatedMechanicsCheckpoint,
  );
  return acceptedPair(
    0,
    translatedCirculation,
    translatedMechanics,
    translatedCalcium,
  );
}

export function stepMainWireFiveWallNonCoronaryV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
  input: Readonly<{
    dtSec: number;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    calciumEventSchedule?: FiveWallCalciumEventScheduleProviderV1;
    pericardium: MainWireCommonPericardiumBindingV1;
  }>,
): MainWireFiveWallNonCoronaryStepResultV1<TWallState> {
  validateAcceptedPair(previous);
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const calciumEventSchedule = input.calciumEventSchedule
    ?? createFixedSinusFiveWallCalciumEventScheduleV1(input.calciumDriveParams);
  const calciumTrial = evaluateFiveWallCalciumTrialV1(
    previous.calcium,
    candidateTimeSec,
    input.calciumDriveParams,
    calciumEventSchedule,
  );
  const calciumDrive = calciumTrial.calciumDrive;
  const pthMmHg = commonIntrathoracicPressureMmHg(
    candidateTimeSec,
    input.runtime,
  );
  const circulationTrial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
    previousAcceptedState: previous.circulation,
    dtSec: input.dtSec,
    runtime: input.runtime,
    evaluateCandidateMechanics: (volumesMl) => {
      const mechanicsTrial = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: previous.mechanics,
        candidateTimeSec,
        stepDtSec: input.dtSec,
        candidateVolumesMl: volumesMl,
        drivingInputs: calciumDrive,
      });
      if (!mechanicsTrial.diagnostics.converged ||
          !mechanicsTrial.diagnostics.finite ||
          mechanicsTrial.diagnostics.errors.length > 0) {
        throw new Error(
          `five-wall mechanics trial failed: ${
            mechanicsTrial.diagnostics.errors.join("; ") ||
            "provider reported not-ready diagnostics"
          }`,
        );
      }
      const pericardium = evaluateMainWireCommonPericardiumBindingV1(
        input.pericardium,
        volumesMl,
      );
      return Object.freeze({
        absolutePressuresMmHg: Object.freeze({
          LA: mechanicsTrial.transmuralPressuresMmHg.LA + pthMmHg
            + pericardium.excessPressureMmHg,
          LV: mechanicsTrial.transmuralPressuresMmHg.LV + pthMmHg
            + pericardium.excessPressureMmHg,
          RA: mechanicsTrial.transmuralPressuresMmHg.RA + pthMmHg
            + pericardium.excessPressureMmHg,
          RV: mechanicsTrial.transmuralPressuresMmHg.RV + pthMmHg
            + pericardium.excessPressureMmHg,
        }),
        evaluation: mechanicsTrial,
      });
    },
  });
  if (circulationTrial.converged === false) {
    return Object.freeze({
      converged: false as const,
      reason: "circulation-or-mechanics-trial-failed" as const,
      message: circulationTrial.message,
      rollbackState: rollbackPair(provider, previous, circulationTrial.rollbackState),
      circulationFailureReason: circulationTrial.reason,
      lastAcceptedCandidateNodeVolumesMl:
        circulationTrial.lastAcceptedCandidateNodeVolumesMl,
      circulationDiagnostics: circulationTrial.diagnostics,
      mechanicsCommitted: false as const,
      circulationCommitted: false as const,
      calciumCommitted: false as const,
    });
  }
  const mechanicsTrial = circulationTrial.candidateMechanicsEvaluation;
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    circulationTrial.candidateNodeVolumesMl,
  );
  validateCoupledTrial(previous, circulationTrial, mechanicsTrial, calciumTrial);
  const nextCirculation = commitNonCoronaryCirculationTrialV1(
    previous.circulation,
    circulationTrial,
  );
  const nextMechanics = commitWholeHeartMechanicsTrialV1(
    provider,
    previous.mechanics,
    mechanicsTrial,
  );
  const nextCalcium = commitFiveWallCalciumTrialV1(
    previous.calcium,
    calciumTrial,
  );
  const acceptedState = acceptedPair(
    previous.revision + 1,
    nextCirculation,
    nextMechanics,
    nextCalcium,
  );
  return Object.freeze({
    converged: true as const,
    acceptedState,
    circulationTrial,
    mechanicsTrial,
    calciumTrial,
    calciumDrive,
    commonIntrathoracicPressureMmHg: pthMmHg,
    pericardium,
  });
}

function validateCoupledTrial<TWallState>(
  previous: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
  circulation: NonCoronaryCirculationTrialSuccessV1<
    WholeHeartMechanicsTrialV1<TWallState>
  >,
  mechanics: WholeHeartMechanicsTrialV1<TWallState>,
  calcium: FiveWallCalciumTrialV1,
): void {
  if (circulation.baseRevision !== previous.circulation.revision ||
      mechanics.baseRevision !== previous.mechanics.revision ||
      calcium.baseRevision !== previous.calcium.revision ||
      circulation.candidateTimeSec !== mechanics.candidateTimeSec ||
      circulation.candidateTimeSec !== calcium.candidateTimeSec ||
      circulation.dtSec !== mechanics.stepDtSec) {
    throw new Error("coupled circulation/mechanics/calcium trial identity mismatch");
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (circulation.candidateNodeVolumesMl[chamber] !==
        mechanics.candidateVolumesMl[chamber]) {
      throw new Error(`coupled ${chamber} candidate volume mismatch`);
    }
  }
}

function rollbackPair<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
  circulationRollback: NonCoronaryCirculationAcceptedStateV1,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  return acceptedPair(
    previous.revision,
    circulationRollback,
    cloneWholeHeartMechanicsAcceptedStateV1(provider, previous.mechanics),
    cloneFiveWallCalciumAcceptedStateV1(previous.calcium),
  );
}

function acceptedPair<TWallState>(
  revision: number,
  circulation: NonCoronaryCirculationAcceptedStateV1,
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>,
  calcium: FiveWallCalciumAcceptedStateV1,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  if (circulation.acceptedTimeSec !== mechanics.acceptedTimeSec ||
      circulation.acceptedTimeSec !== calcium.acceptedTimeSec ||
      circulation.revision !== mechanics.revision ||
      circulation.revision !== calcium.revision ||
      circulation.revision !== revision) {
    throw new Error("accepted circulation/mechanics/calcium revisions or times differ");
  }
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision,
    acceptedTimeSec: circulation.acceptedTimeSec,
    circulation,
    mechanics,
    calcium,
  });
}

function validateAcceptedPair<TWallState>(
  state: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID ||
      state.revision !== state.circulation.revision ||
      state.revision !== state.mechanics.revision ||
      state.revision !== state.calcium.revision ||
      state.acceptedTimeSec !== state.circulation.acceptedTimeSec ||
      state.acceptedTimeSec !== state.mechanics.acceptedTimeSec ||
      state.acceptedTimeSec !== state.calcium.acceptedTimeSec) {
    throw new Error("accepted coupled transaction state is inconsistent");
  }
}

function chamberVolumes(
  circulation: NonCoronaryCirculationAcceptedStateV1,
): Readonly<{ LA: number; LV: number; RA: number; RV: number }> {
  return Object.freeze({
    LA: circulation.nodeVolumesMl.LA,
    LV: circulation.nodeVolumesMl.LV,
    RA: circulation.nodeVolumesMl.RA,
    RV: circulation.nodeVolumesMl.RV,
  });
}

function commonIntrathoracicPressureMmHg(
  timeSec: number,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  return respiratoryExternalPressureForKindV1(
    "pth",
    timeSec,
    runtime.respiratory,
  );
}

function restoreExactCheckpointComponentsV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  checkpoint: MainWireFiveWallNonCoronaryCheckpointV2,
  input: Readonly<{
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    calciumEventSchedule: FiveWallCalciumEventScheduleProviderV1;
    pericardium: MainWireCommonPericardiumBindingV1;
  }>,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  assertProtocolBindingMatchesV2(
    checkpoint.protocolBinding,
    input.runtime,
    input.pericardium,
  );
  const circulation = restoreNonCoronaryCirculationStateV2(
    checkpoint.circulation,
  );
  const mechanics = restoreWholeHeartMechanicsStateV1(
    provider,
    checkpoint.mechanics,
  );
  if (
    exactFiniteJsonCanonicalStringV1(
      checkpointWholeHeartMechanicsStateV1(provider, mechanics),
    ) !== exactFiniteJsonCanonicalStringV1(checkpoint.mechanics)
  ) throw new Error("mechanics checkpoint contains noncanonical nested state");
  const calcium = restoreFiveWallCalciumAcceptedStateV2(
    checkpoint.calcium,
    input.calciumDriveParams,
    input.calciumEventSchedule,
  );
  if (
    checkpoint.revision !== circulation.revision
    || checkpoint.revision !== mechanics.revision
    || checkpoint.revision !== calcium.revision
    || checkpoint.acceptedTimeSec !== circulation.acceptedTimeSec
    || checkpoint.acceptedTimeSec !== mechanics.acceptedTimeSec
    || checkpoint.acceptedTimeSec !== calcium.acceptedTimeSec
  ) throw new Error("coupled checkpoint revision/time alignment mismatch");
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (circulation.nodeVolumesMl[chamber] !== mechanics.acceptedVolumesMl[chamber]) {
      throw new Error(`coupled checkpoint ${chamber} volume alignment mismatch`);
    }
  }
  evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(circulation),
  );
  return acceptedPair(
    checkpoint.revision,
    circulation,
    mechanics,
    calcium,
  );
}

function parseMainWireFiveWallNonCoronaryCheckpointV2(
  candidate: unknown,
): MainWireFiveWallNonCoronaryCheckpointV2 {
  const record = requireCheckpointRecordV1(candidate, "coupled checkpoint");
  if (
    record.checkpointId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_CHECKPOINT_V2_ID
    || record.schemaVersion !== 2
  ) throw new Error("unsupported coupled checkpoint schema; schema V2 is required");
  requireExactCheckpointKeysV1(record, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "protocolBinding",
    "circulation",
    "mechanics",
    "calcium",
    "fingerprint",
  ], "coupled checkpoint");
  if (
    record.transactionId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID
  ) throw new Error("coupled checkpoint transaction identity mismatch");
  if (typeof record.fingerprint !== "string" || !/^[0-9a-f]{8}$/.test(record.fingerprint)) {
    throw new Error("coupled checkpoint fingerprint is invalid");
  }
  const { fingerprint, ...payload } = record;
  if (exactFiniteJsonFingerprintV1(payload) !== fingerprint) {
    throw new Error("coupled checkpoint fingerprint mismatch");
  }
  if (!Number.isInteger(record.revision) || (record.revision as number) < 0) {
    throw new Error("coupled checkpoint revision must be nonnegative integer");
  }
  if (
    typeof record.acceptedTimeSec !== "number"
    || !Number.isFinite(record.acceptedTimeSec)
    || record.acceptedTimeSec < 0
  ) throw new Error("coupled checkpoint acceptedTimeSec is invalid");
  const protocol = parseProtocolBindingV2(record.protocolBinding);
  const mechanics = requireCheckpointRecordV1(
    record.mechanics,
    "coupled checkpoint mechanics",
  );
  requireExactCheckpointKeysV1(mechanics, [
    "contractId",
    "providerId",
    "parameterSetId",
    "parameterIdentityHash",
    "stateSchemaVersion",
    "revision",
    "acceptedTimeSec",
    "acceptedVolumesMl",
    "materialState",
    "materialStateFingerprint",
  ], "coupled checkpoint mechanics");
  const mechanicsVolumes = requireCheckpointRecordV1(
    mechanics.acceptedVolumesMl,
    "coupled checkpoint mechanics.acceptedVolumesMl",
  );
  requireExactCheckpointKeysV1(
    mechanicsVolumes,
    ["LA", "LV", "RA", "RV"],
    "coupled checkpoint mechanics.acceptedVolumesMl",
  );
  requireCheckpointRecordV1(record.circulation, "coupled checkpoint circulation");
  requireCheckpointRecordV1(record.calcium, "coupled checkpoint calcium");
  return Object.freeze({
    checkpointId: MAIN_WIRE_FIVE_WALL_NONCORONARY_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: record.revision as number,
    acceptedTimeSec: record.acceptedTimeSec,
    protocolBinding: protocol,
    circulation:
      record.circulation as NonCoronaryCirculationCheckpointV2,
    mechanics: mechanics as WholeHeartMechanicsCheckpointV1,
    calcium: record.calcium as FiveWallCalciumCheckpointV2,
    fingerprint,
  });
}

function createProtocolBindingV2(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pericardium: MainWireCommonPericardiumBindingV1,
): MainWireFiveWallNonCoronaryProtocolBindingV2 {
  exactFiniteJsonCanonicalStringV1(runtime);
  exactFiniteJsonCanonicalStringV1(pericardium);
  const circulationRuntimeSnapshot = deepFreezeCheckpointValue(
    runtime,
  ) as NonCoronaryCirculationRuntimeParamsV1;
  const commonPericardiumBindingSnapshot = deepFreezeCheckpointValue(
    pericardium,
  ) as MainWireCommonPericardiumBindingV1;
  return Object.freeze({
    bindingId: MAIN_WIRE_FIVE_WALL_NONCORONARY_PROTOCOL_BINDING_V2_ID,
    circulationRuntimeSnapshot,
    circulationRuntimeStableHash: stableHash(circulationRuntimeSnapshot),
    commonPericardiumBindingSnapshot,
    commonPericardiumBindingStableHash:
      stableHash(commonPericardiumBindingSnapshot),
  });
}

function parseProtocolBindingV2(
  candidate: unknown,
): MainWireFiveWallNonCoronaryProtocolBindingV2 {
  const record = requireCheckpointRecordV1(
    candidate,
    "coupled checkpoint protocolBinding",
  );
  requireExactCheckpointKeysV1(record, [
    "bindingId",
    "circulationRuntimeSnapshot",
    "circulationRuntimeStableHash",
    "commonPericardiumBindingSnapshot",
    "commonPericardiumBindingStableHash",
  ], "coupled checkpoint protocolBinding");
  if (
    record.bindingId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_PROTOCOL_BINDING_V2_ID
    || typeof record.circulationRuntimeStableHash !== "string"
    || !/^[0-9a-f]{8}$/.test(record.circulationRuntimeStableHash)
    || typeof record.commonPericardiumBindingStableHash !== "string"
    || !/^[0-9a-f]{8}$/.test(record.commonPericardiumBindingStableHash)
    || stableHash(record.circulationRuntimeSnapshot)
      !== record.circulationRuntimeStableHash
    || stableHash(record.commonPericardiumBindingSnapshot)
      !== record.commonPericardiumBindingStableHash
  ) throw new Error("coupled checkpoint protocol binding identity mismatch");
  exactFiniteJsonCanonicalStringV1(record.circulationRuntimeSnapshot);
  exactFiniteJsonCanonicalStringV1(record.commonPericardiumBindingSnapshot);
  return Object.freeze({
    bindingId: MAIN_WIRE_FIVE_WALL_NONCORONARY_PROTOCOL_BINDING_V2_ID,
    circulationRuntimeSnapshot: deepFreezeCheckpointValue(
      record.circulationRuntimeSnapshot,
    ) as NonCoronaryCirculationRuntimeParamsV1,
    circulationRuntimeStableHash: record.circulationRuntimeStableHash,
    commonPericardiumBindingSnapshot: deepFreezeCheckpointValue(
      record.commonPericardiumBindingSnapshot,
    ) as MainWireCommonPericardiumBindingV1,
    commonPericardiumBindingStableHash:
      record.commonPericardiumBindingStableHash,
  });
}

function assertProtocolBindingMatchesV2(
  actual: MainWireFiveWallNonCoronaryProtocolBindingV2,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pericardium: MainWireCommonPericardiumBindingV1,
): void {
  const expected = createProtocolBindingV2(runtime, pericardium);
  if (
    actual.bindingId !== expected.bindingId
    || actual.circulationRuntimeStableHash
      !== expected.circulationRuntimeStableHash
    || actual.commonPericardiumBindingStableHash
      !== expected.commonPericardiumBindingStableHash
    || exactFiniteJsonCanonicalStringV1(actual.circulationRuntimeSnapshot)
      !== exactFiniteJsonCanonicalStringV1(expected.circulationRuntimeSnapshot)
    || exactFiniteJsonCanonicalStringV1(
      actual.commonPericardiumBindingSnapshot,
    ) !== exactFiniteJsonCanonicalStringV1(
      expected.commonPericardiumBindingSnapshot,
    )
  ) throw new Error("coupled checkpoint protocol binding differs from runtime");
}

function assertNoTimeVaryingRespirationV2(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): void {
  if (
    runtime.respiratory.respAmpTh !== 0
    || runtime.respiratory.respAmpAlv !== 0
    || runtime.respiratory.respRate !== 0
  ) throw new Error("cycle translation requires time-invariant respiration");
}

function deepFreezeCheckpointValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((child) => deepFreezeCheckpointValue(child)));
  }
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(
      ([key, child]) => [key, deepFreezeCheckpointValue(child)],
    )));
  }
  return value;
}

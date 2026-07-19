import {
  commitNonCoronaryCirculationTrialV1,
  checkpointNonCoronaryCirculationStateV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  resolveNonCoronaryCirculationColdSeedV1,
  restoreNonCoronaryCirculationStateV1,
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationCheckpointV1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationNewtonOptionsV1,
  type NonCoronaryProtocolResistanceScaleByEdgeV1,
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
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumEvaluationV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  cloneWholeHeartMechanicsAcceptedStateV1,
  checkpointWholeHeartMechanicsStateV1,
  commitPreparedWholeHeartMechanicsTrialV1,
  evaluatePreparedWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  prepareWholeHeartMechanicsStepV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsCheckpointV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID =
  "main-wire-five-wall-noncoronary-transaction-v1" as const;

const PA_PER_MMHG = 133.322;

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1 =
  Object.freeze({
    circulationOwner:
      "main-wire-derived-noncoronary-experimental-transaction" as const,
    modelCoreRuntimeAdopted: false as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    chamberPressureInterface: "transmural-provider-to-absolute-node" as const,
    chamberPressureTangentInterface:
      "transmural-provider-plus-one-common-pericardium-rank-one-to-absolute-node" as const,
    commonIntrathoracicPressureAppliedOnce: true as const,
    circulationAndMechanicsCommit: "atomic-after-both-trials-succeed" as const,
    failureSemantics: "rollback-both-accepted-states" as const,
    pericardialConstraintInterface:
      "required-conservative-common-pressure-binding" as const,
    pericardialPressureWorkCountedAsPrescribedExternalWork: false as const,
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
}>;

export type MainWireFiveWallNonCoronaryCheckpointV1 = Readonly<{
  checkpointId: "main-wire-five-wall-noncoronary-checkpoint-v1";
  schemaVersion: 1;
  transactionId: typeof MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  circulation: NonCoronaryCirculationCheckpointV1;
  mechanics: WholeHeartMechanicsCheckpointV1;
  checkpointFingerprint: string;
}>;

export type MainWireFiveWallNonCoronaryInitializeInputV1<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
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
}>;

export type MainWireFiveWallNonCoronaryStepResultV1<TWallState> =
  | MainWireFiveWallNonCoronaryStepSuccessV1<TWallState>
  | MainWireFiveWallNonCoronaryStepFailureV1<TWallState>;

export function checkpointMainWireFiveWallNonCoronaryV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  state: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
): MainWireFiveWallNonCoronaryCheckpointV1 {
  validateAcceptedPair(state);
  const checkpoint = {
    checkpointId: "main-wire-five-wall-noncoronary-checkpoint-v1" as const,
    schemaVersion: 1 as const,
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    circulation: checkpointNonCoronaryCirculationStateV1(state.circulation),
    mechanics: checkpointWholeHeartMechanicsStateV1(provider, state.mechanics),
  };
  return Object.freeze({
    ...checkpoint,
    checkpointFingerprint: fingerprintJsonValueV1(checkpoint),
  });
}

export function restoreMainWireFiveWallNonCoronaryV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  checkpoint: MainWireFiveWallNonCoronaryCheckpointV1,
  rebase?: Readonly<{ revision: number; acceptedTimeSec: number }>,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  if (
    checkpoint.checkpointId !== "main-wire-five-wall-noncoronary-checkpoint-v1"
    || checkpoint.schemaVersion !== 1
    || checkpoint.transactionId
      !== MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID
    || checkpoint.revision !== checkpoint.circulation.state.revision
    || checkpoint.revision !== checkpoint.mechanics.revision
    || checkpoint.acceptedTimeSec !== checkpoint.circulation.state.acceptedTimeSec
    || checkpoint.acceptedTimeSec !== checkpoint.mechanics.acceptedTimeSec
  ) throw new Error("five-wall checkpoint transaction identity mismatch");
  const { checkpointFingerprint, ...fingerprinted } = checkpoint;
  if (fingerprintJsonValueV1(fingerprinted) !== checkpointFingerprint) {
    throw new Error("five-wall checkpoint fingerprint mismatch");
  }
  const revision = rebase?.revision ?? checkpoint.revision;
  const acceptedTimeSec = rebase?.acceptedTimeSec ?? checkpoint.acceptedTimeSec;
  const circulation = restoreNonCoronaryCirculationStateV1(
    checkpoint.circulation,
    { revision, acceptedTimeSec },
  );
  const mechanics = restoreWholeHeartMechanicsStateV1(provider, Object.freeze({
    ...checkpoint.mechanics,
    revision,
    acceptedTimeSec,
  }));
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (circulation.nodeVolumesMl[chamber] !== mechanics.acceptedVolumesMl[chamber]) {
      throw new Error(`five-wall checkpoint ${chamber} volume mismatch`);
    }
  }
  return acceptedPair(revision, circulation, mechanics);
}

export function initializeMainWireFiveWallNonCoronaryV1<TWallState>(
  input: MainWireFiveWallNonCoronaryInitializeInputV1<TWallState>,
): MainWireFiveWallNonCoronaryColdResultV1<TWallState> {
  const timeSec = input.timeSec ?? 0;
  const circulationInitial = input.circulationInitial
    ?? resolveNonCoronaryCirculationColdSeedV1(input.runtime);
  const circulation = createInitialNonCoronaryCirculationStateV1({
    ...circulationInitial,
    timeSec,
    runtime: input.runtime,
  });
  const calciumEvaluation = evaluateFiveWallNormalCalciumDriveV1(
    timeSec,
    input.calciumDriveParams,
  );
  const calciumDrive = Object.freeze({
    freeCalciumUMByWall: calciumEvaluation.freeCalciumUMByWall,
  });
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
    pericardium: MainWireCommonPericardiumBindingV1;
    /** Optional numerical/audit controls; not a physiological case parameter. */
    circulationNewtonOptions?: NonCoronaryCirculationNewtonOptionsV1;
    /** Protocol-only transient occlusion; never persisted as a case parameter. */
    protocolResistanceScaleByEdge?:
      NonCoronaryProtocolResistanceScaleByEdgeV1;
  }>,
): MainWireFiveWallNonCoronaryStepResultV1<TWallState> {
  validateAcceptedPair(previous);
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const calciumEvaluation = evaluateFiveWallNormalCalciumDriveV1(
    candidateTimeSec,
    input.calciumDriveParams,
  );
  const calciumDrive = Object.freeze({
    freeCalciumUMByWall: calciumEvaluation.freeCalciumUMByWall,
  });
  const pthMmHg = commonIntrathoracicPressureMmHg(
    candidateTimeSec,
    input.runtime,
  );
  const mechanicsStep = prepareWholeHeartMechanicsStepV1(provider, {
    previousAcceptedState: previous.mechanics,
    candidateTimeSec,
    stepDtSec: input.dtSec,
    drivingInputs: calciumDrive,
  });
  const circulationTrial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
    previousAcceptedState: previous.circulation,
    dtSec: input.dtSec,
    runtime: input.runtime,
    options: input.circulationNewtonOptions,
    protocolResistanceScaleByEdge:
      input.protocolResistanceScaleByEdge,
    evaluateCandidateMechanics: (volumesMl) => {
      const mechanicsTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
        mechanicsStep,
        volumesMl,
      );
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
        ...(mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl
          === undefined
          ? {}
          : {
            absolutePressureTangent: absoluteChamberPressureTangent(
              mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl,
              pericardium,
            ),
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
    });
  }
  const mechanicsTrial = circulationTrial.candidateMechanicsEvaluation;
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    circulationTrial.candidateNodeVolumesMl,
  );
  validateCoupledTrial(previous, circulationTrial, mechanicsTrial);
  const nextCirculation = commitNonCoronaryCirculationTrialV1(
    previous.circulation,
    circulationTrial,
  );
  const nextMechanics = commitPreparedWholeHeartMechanicsTrialV1(
    mechanicsStep,
    mechanicsTrial,
  );
  const acceptedState = acceptedPair(
    previous.revision + 1,
    nextCirculation,
    nextMechanics,
  );
  return Object.freeze({
    converged: true as const,
    acceptedState,
    circulationTrial,
    mechanicsTrial,
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
): void {
  if (circulation.baseRevision !== previous.circulation.revision ||
      mechanics.baseRevision !== previous.mechanics.revision ||
      circulation.candidateTimeSec !== mechanics.candidateTimeSec ||
      circulation.dtSec !== mechanics.stepDtSec) {
    throw new Error("coupled circulation/mechanics trial identity mismatch");
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
  );
}

function acceptedPair<TWallState>(
  revision: number,
  circulation: NonCoronaryCirculationAcceptedStateV1,
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>,
): MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState> {
  if (circulation.acceptedTimeSec !== mechanics.acceptedTimeSec ||
      circulation.revision !== mechanics.revision ||
      circulation.revision !== revision) {
    throw new Error("accepted circulation/mechanics revisions or times differ");
  }
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision,
    acceptedTimeSec: circulation.acceptedTimeSec,
    circulation,
    mechanics,
  });
}

function validateAcceptedPair<TWallState>(
  state: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID ||
      state.revision !== state.circulation.revision ||
      state.revision !== state.mechanics.revision ||
      state.acceptedTimeSec !== state.circulation.acceptedTimeSec ||
      state.acceptedTimeSec !== state.mechanics.acceptedTimeSec) {
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

function absoluteChamberPressureTangent(
  transmural:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  pericardium: MainWireCommonPericardiumEvaluationV1,
): NonCoronaryAbsoluteChamberPressureTangentV1 {
  const commonPericardiumTangentMmHgPerMl =
    pericardium.pressureDerivativePaPerM3 * 1e-6 / PA_PER_MMHG;
  if (!Number.isFinite(commonPericardiumTangentMmHgPerMl)) {
    throw new Error("common pericardium pressure tangent must be finite");
  }
  const matrix = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
    (pressureChamber) => Object.freeze(
      NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map((volumeChamber) => {
        const intrinsic = transmural[pressureChamber][volumeChamber];
        if (!Number.isFinite(intrinsic)) {
          throw new Error(
            `${pressureChamber}/${volumeChamber} transmural pressure tangent must be finite`,
          );
        }
        return intrinsic + commonPericardiumTangentMmHgPerMl;
      }),
    ),
  ) as unknown as NonCoronaryAbsoluteChamberPressureTangentV1[
    "dPressureDVolumeMmHgPerMl"
  ];
  return Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: matrix,
  });
}

function fingerprintJsonValueV1(value: unknown): string {
  const text = canonicalJsonValueV1(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalJsonValueV1(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("checkpoint contains non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonValueV1).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJsonValueV1(record[key])}`
    ).join(",")}}`;
  }
  throw new Error("checkpoint contains unsupported value");
}

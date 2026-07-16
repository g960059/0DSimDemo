import {
  commitNonCoronaryCirculationTrialV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
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
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID =
  "main-wire-five-wall-noncoronary-transaction-v1" as const;

export const MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_CLAIM_V1 =
  Object.freeze({
    circulationOwner: "authoritative-main-wire-noncoronary-graph" as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    chamberPressureInterface: "transmural-provider-to-absolute-node" as const,
    commonIntrathoracicPressureAppliedOnce: true as const,
    circulationAndMechanicsCommit: "atomic-after-both-trials-succeed" as const,
    failureSemantics: "rollback-both-accepted-states" as const,
    pericardialConstraintApplied: false as const,
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

export type MainWireFiveWallNonCoronaryInitializeInputV1<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
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
}>;

export type MainWireFiveWallNonCoronaryStepFailureV1<TWallState> = Readonly<{
  converged: false;
  reason: "circulation-or-mechanics-trial-failed";
  message: string;
  rollbackState: MainWireFiveWallNonCoronaryAcceptedStateV1<TWallState>;
  circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  circulationCommitted: false;
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
      return Object.freeze({
        absolutePressuresMmHg: Object.freeze({
          LA: mechanicsTrial.transmuralPressuresMmHg.LA + pthMmHg,
          LV: mechanicsTrial.transmuralPressuresMmHg.LV + pthMmHg,
          RA: mechanicsTrial.transmuralPressuresMmHg.RA + pthMmHg,
          RV: mechanicsTrial.transmuralPressuresMmHg.RV + pthMmHg,
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
      circulationDiagnostics: circulationTrial.diagnostics,
      mechanicsCommitted: false as const,
      circulationCommitted: false as const,
    });
  }
  const mechanicsTrial = circulationTrial.candidateMechanicsEvaluation;
  validateCoupledTrial(previous, circulationTrial, mechanicsTrial);
  const nextCirculation = commitNonCoronaryCirculationTrialV1(
    previous.circulation,
    circulationTrial,
  );
  const nextMechanics = commitWholeHeartMechanicsTrialV1(
    provider,
    previous.mechanics,
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

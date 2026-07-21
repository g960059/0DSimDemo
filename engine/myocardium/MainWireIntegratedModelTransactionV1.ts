import type {
  NonCoronaryDynamicMechanicalSupportInputV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  createDynamicMechanicalSupportAcceptedStateV1,
  validateDynamicMechanicalSupportAcceptedStateV1,
  validateDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportHydraulicEvaluationV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import { validateMechanicalSupportConfigV1 } from
  "@/engine/devices/networkV1";
import {
  ROTARY_SUPPORT_DEVICE_IDS_V1,
  type MechanicalSupportConfigV1,
  type RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";
import {
  initializeMainWireFiveWallCoronaryV3,
  maximumMainWireFiveWallCoronaryStepDurationV3,
  stepMainWireFiveWallCoronaryV3,
  validateMainWireFiveWallCoronaryAcceptedStateV3,
  type MainWireFiveWallCoronaryAcceptedStateV3,
  type MainWireFiveWallCoronaryColdResultV3,
  type MainWireFiveWallCoronaryInitializeInputV3,
  type MainWireFiveWallCoronaryStepInputV3,
  type MainWireFiveWallCoronaryStepResultV3,
  type MainWireFiveWallCoronaryStepSuccessV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  commitAcceptedFiveWallRhythmCalciumTrialV1,
  evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1,
  evaluateAcceptedFiveWallRhythmCalciumTrialV1,
  maximumAcceptedFiveWallRhythmCalciumStepV1,
  validateAcceptedFiveWallRhythmCalciumStateV1,
  type AcceptedFiveWallRhythmCalciumBindingV1,
  type AcceptedFiveWallRhythmCalciumMaximumStepV1,
  type AcceptedFiveWallRhythmCalciumStateV1,
  type AcceptedFiveWallRhythmCalciumTrialV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
import type {
  AcceptedRhythmEventScheduleV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID =
  "main-wire-base-coronary-v3-dynamic-mcs-rhythm-transaction-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V1 = Object.freeze({
  acceptedTuple:
    "coronary-v3-plus-accepted-rhythm-calcium-plus-model-bound-dynamic-mcs-flow-state" as const,
  commitSemantics:
    "all-three-owners-promote-once-only-after-one-successful-candidate" as const,
  rollbackSemantics:
    "any-validation-trial-or-promotion-failure-returns-identical-previous-tuple" as const,
  calciumCoupling:
    "candidate-rhythm-calcium-drive-injected-into-coronary-v3-mechanics-candidate" as const,
  dynamicMcsCoupling:
    "same-previous-q-profile-and-command-for-every-outer-newton-fd-and-line-search-probe" as const,
  dynamicMcsAcceptedBinding:
    "full-inertance-profile-and-structural-rotary-hydraulic-projection" as const,
  dynamicMcsRuntimeCommands:
    "enabled-clamp-speed-and-impella-performance-level-provisional-external-input" as const,
  legacyAlgebraicMcsAcceptedInIntegratedLane: false as const,
  maximumStepBoundary:
    "minimum-of-request-coronary-window-next-rhythm-batch-and-schedule-coverage" as const,
  boundaryCrossing: "fail-closed" as const,
  iabpTiming:
    "heart-rate-phase-derived-provisional-not-accepted-rhythm-event-synchronized" as const,
  iabpRhythmSynchronizationClaimed: false as const,
  syntheticInertanceProfiles: "test-only-not-release-approved" as const,
  releaseApprovedDynamicInertanceProfileIncluded: false as const,
  dynamicMcsClinicalValidationClaimed: false as const,
  checkpointOwnedHere: false as const,
  simulationReady: false as const,
});

export type MainWireIntegratedRhythmContextV1 = Readonly<{
  binding: AcceptedFiveWallRhythmCalciumBindingV1;
  schedule: AcceptedRhythmEventScheduleV1;
}>;

export type MainWireIntegratedDynamicMechanicalSupportContextV1 = Readonly<{
  config: MechanicalSupportConfigV1;
  heartRateBpm: number;
  profile: DynamicMechanicalSupportInertanceProfileV1;
}>;

export type MainWireIntegratedDynamicMechanicalSupportInitializeV1 =
  MainWireIntegratedDynamicMechanicalSupportContextV1 & Readonly<{
    initialAcceptedFlowMlPerSec?: Readonly<Record<
      RotarySupportDeviceIdV1,
      number
    >>;
  }>;

export type MainWireIntegratedModelAcceptedStateV1<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>;
  rhythmCalcium: AcceptedFiveWallRhythmCalciumStateV1;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
}>;

export type MainWireIntegratedModelInitializeInputV1<TWallState> = Readonly<{
  coronary: Omit<
    MainWireFiveWallCoronaryInitializeInputV3<TWallState>,
    "calciumDriveOverride"
  >;
  rhythm: MainWireIntegratedRhythmContextV1 & Readonly<{
    acceptedState: AcceptedFiveWallRhythmCalciumStateV1;
  }>;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportInitializeV1;
}>;

export type MainWireIntegratedModelColdResultV1<TWallState> = Readonly<{
  acceptedState: MainWireIntegratedModelAcceptedStateV1<TWallState>;
  coronaryCold: MainWireFiveWallCoronaryColdResultV3<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
}>;

export type MainWireIntegratedModelCoronaryStepInputV1 = Omit<
  MainWireFiveWallCoronaryStepInputV3,
  | "dtSec"
  | "calciumDriveOverride"
  | "mechanicalSupport"
  | "dynamicMechanicalSupport"
>;

export type MainWireIntegratedModelStepInputV1 = Readonly<{
  dtSec: number;
  coronary: MainWireIntegratedModelCoronaryStepInputV1;
  rhythm: MainWireIntegratedRhythmContextV1;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportContextV1;
}>;

export type MainWireIntegratedModelMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  coronaryWindowMaximumStepSec: number;
  rhythm: AcceptedFiveWallRhythmCalciumMaximumStepV1;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmEvent: boolean;
  clippedByScheduleCoverage: boolean;
}>;

export type MainWireIntegratedModelStepSuccessV1<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireIntegratedModelAcceptedStateV1<TWallState>;
  coronaryStep: MainWireFiveWallCoronaryStepSuccessV3<TWallState>;
  rhythmTrial: AcceptedFiveWallRhythmCalciumTrialV1;
  dynamicMechanicalSupportTrial:
    DynamicMechanicalSupportHydraulicEvaluationV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  maximumStep: MainWireIntegratedModelMaximumStepV1;
  mechanicsCommitted: true;
  circulationCommitted: true;
  coronaryCommitted: true;
  mvcReferenceCommitted: true;
  autoregulationCommitted: true;
  rhythmCalciumCommitted: true;
  dynamicMechanicalSupportCommitted: true;
}>;

export type MainWireIntegratedModelStepFailureReasonV1 =
  | "outer-input-clock-profile-or-boundary-rejected"
  | "coronary-v3-candidate-failed"
  | "integrated-promotion-rejected";

export type MainWireIntegratedModelStepFailureV1<TWallState> = Readonly<{
  converged: false;
  reason: MainWireIntegratedModelStepFailureReasonV1;
  message: string;
  rollbackState: MainWireIntegratedModelAcceptedStateV1<TWallState>;
  coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
  rhythmTrial?: AcceptedFiveWallRhythmCalciumTrialV1;
  maximumStep?: MainWireIntegratedModelMaximumStepV1;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
  autoregulationCommitted: false;
  rhythmCalciumCommitted: false;
  dynamicMechanicalSupportCommitted: false;
}>;

export type MainWireIntegratedModelStepResultV1<TWallState> =
  | MainWireIntegratedModelStepSuccessV1<TWallState>
  | MainWireIntegratedModelStepFailureV1<TWallState>;

export function initializeMainWireIntegratedModelV1<TWallState>(
  input: MainWireIntegratedModelInitializeInputV1<TWallState>,
): MainWireIntegratedModelColdResultV1<TWallState> {
  assertExactKeys(input, [
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "integrated cold input");
  assertRhythmInitializeContext(input.rhythm);
  assertDynamicInitializeContext(input.dynamicMechanicalSupport);
  assertCoronaryColdInput(input.coronary);
  rejectExternallyOwnedColdInputs(input.coronary);
  validateAcceptedFiveWallRhythmCalciumStateV1(
    input.rhythm.acceptedState,
    input.rhythm.binding,
    input.rhythm.schedule,
  );
  if (
    input.rhythm.acceptedState.revision !== 0
    || input.rhythm.acceptedState.acceptedTimeSec
      !== (input.coronary.timeSec ?? 0)
  ) {
    throw new Error(
      "integrated cold rhythm must be revision zero at the coronary cold time",
    );
  }
  assertPeriodicSourceParameterBinding(
    input.rhythm.binding,
    input.coronary.calciumDriveParams.parameterSetId,
  );
  const calciumDrive = evaluateAcceptedFiveWallRhythmCalciumCurrentDriveV1(
    input.rhythm.acceptedState,
    input.rhythm.binding,
    input.rhythm.schedule,
  );
  const coronaryCold = initializeMainWireFiveWallCoronaryV3({
    ...input.coronary,
    calciumDriveOverride: calciumDrive,
  });
  const dynamicMechanicalSupport = createDynamicMechanicalSupportAcceptedStateV1(
    input.dynamicMechanicalSupport.profile,
    input.dynamicMechanicalSupport.config,
    input.dynamicMechanicalSupport.initialAcceptedFlowMlPerSec,
  );
  const acceptedState = wrapMainWireIntegratedModelAcceptedStateV1(
    coronaryCold.acceptedState,
    input.rhythm.acceptedState,
    dynamicMechanicalSupport,
    Object.freeze({
      binding: input.rhythm.binding,
      schedule: input.rhythm.schedule,
    }),
    input.dynamicMechanicalSupport.profile,
    input.dynamicMechanicalSupport.config,
  );
  return Object.freeze({
    acceptedState,
    coronaryCold,
    calciumDrive,
  });
}

/**
 * Resolves the legal candidate endpoint for a requested step. A caller may
 * retry exactly at `maximumStepSec`; the step function rejects any crossing.
 */
export function maximumMainWireIntegratedModelStepDurationV1<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV1<TWallState>,
  requestedStepSec: number,
  rhythm: MainWireIntegratedRhythmContextV1,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelMaximumStepV1 {
  validateMainWireIntegratedModelAcceptedStateV1(
    previous,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  const requested = requirePositiveFinite(requestedStepSec, "requestedStepSec");
  const requestedEndTimeSec = previous.acceptedTimeSec + requested;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error("integrated requested endpoint must remain finite");
  }
  const coronaryWindowMaximumStepSec =
    maximumMainWireFiveWallCoronaryStepDurationV3(previous.coronary);
  const rhythmMaximum = maximumAcceptedFiveWallRhythmCalciumStepV1(
    previous.rhythmCalcium,
    requested,
    rhythm.binding,
    rhythm.schedule,
  );
  const maximumStepSec = Math.min(
    requested,
    coronaryWindowMaximumStepSec,
    rhythmMaximum.maximumStepSec,
  );
  if (!(maximumStepSec > 0) || !Number.isFinite(maximumStepSec)) {
    throw new Error("integrated maximum step must be positive and finite");
  }
  const tolerance = clockTolerance(previous.acceptedTimeSec, requested);
  return Object.freeze({
    requestedStepSec: requested,
    requestedEndTimeSec,
    coronaryWindowMaximumStepSec,
    rhythm: rhythmMaximum,
    maximumStepSec,
    candidateTimeSec: previous.acceptedTimeSec + maximumStepSec,
    clippedByCoronaryWindow:
      coronaryWindowMaximumStepSec < requested - tolerance,
    clippedByRhythmEvent: rhythmMaximum.schedule.clippedByEvent,
    clippedByScheduleCoverage: rhythmMaximum.coverageClipped,
  });
}

export function stepMainWireIntegratedModelV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireIntegratedModelAcceptedStateV1<TWallState>,
  input: MainWireIntegratedModelStepInputV1,
): MainWireIntegratedModelStepResultV1<TWallState> {
  let maximumStep: MainWireIntegratedModelMaximumStepV1 | undefined;
  let rhythmTrial: AcceptedFiveWallRhythmCalciumTrialV1 | undefined;
  let coronaryStep: MainWireFiveWallCoronaryStepResultV3<TWallState> | undefined;
  try {
    assertStepInput(input);
    validateMainWireIntegratedModelAcceptedStateV1(
      previous,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    maximumStep = maximumMainWireIntegratedModelStepDurationV1(
      previous,
      input.dtSec,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    if (input.dtSec > maximumStep.maximumStepSec) {
      throw new RangeError(
        "integrated step crosses a coronary, rhythm-event, or coverage boundary",
      );
    }
    const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
    rhythmTrial = evaluateAcceptedFiveWallRhythmCalciumTrialV1(
      previous.rhythmCalcium,
      candidateTimeSec,
      input.rhythm.binding,
      input.rhythm.schedule,
    );
    const calciumDrive = calciumDriveFromTrial(rhythmTrial);
    const dynamicMechanicalSupport = Object.freeze({
      config: input.dynamicMechanicalSupport.config,
      heartRateBpm: input.dynamicMechanicalSupport.heartRateBpm,
      profile: input.dynamicMechanicalSupport.profile,
      previousAcceptedState: previous.dynamicMechanicalSupport,
    }) satisfies NonCoronaryDynamicMechanicalSupportInputV1;
    coronaryStep = stepMainWireFiveWallCoronaryV3(
      provider,
      previous.coronary,
      {
        ...input.coronary,
        dtSec: input.dtSec,
        calciumDriveOverride: calciumDrive,
        dynamicMechanicalSupport,
      },
    );
    if (coronaryStep.converged === false) {
      return failure(
        previous,
        "coronary-v3-candidate-failed",
        coronaryStep.message,
        { coronaryStep, rhythmTrial, maximumStep },
      );
    }
    const dynamicTrial = coronaryStep.baseStep.circulationTrial
      .dynamicMechanicalSupport;
    if (dynamicTrial === undefined) {
      throw new Error("coronary candidate omitted dynamic MCS readback");
    }
    validateDynamicMechanicalSupportAcceptedStateV1(
      dynamicTrial.candidateAcceptedState,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    const rhythmCalcium = commitAcceptedFiveWallRhythmCalciumTrialV1(
      previous.rhythmCalcium,
      rhythmTrial,
      input.rhythm.binding,
      input.rhythm.schedule,
    );
    const acceptedState = wrapMainWireIntegratedModelAcceptedStateV1(
      coronaryStep.acceptedState,
      rhythmCalcium,
      dynamicTrial.candidateAcceptedState,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    return Object.freeze({
      converged: true as const,
      acceptedState,
      coronaryStep,
      rhythmTrial,
      dynamicMechanicalSupportTrial: dynamicTrial,
      calciumDrive,
      maximumStep,
      mechanicsCommitted: true as const,
      circulationCommitted: true as const,
      coronaryCommitted: true as const,
      mvcReferenceCommitted: true as const,
      autoregulationCommitted: true as const,
      rhythmCalciumCommitted: true as const,
      dynamicMechanicalSupportCommitted: true as const,
    });
  } catch (error) {
    return failure(
      previous,
      coronaryStep?.converged === true
        ? "integrated-promotion-rejected"
        : "outer-input-clock-profile-or-boundary-rejected",
      error instanceof Error ? error.message : String(error),
      { coronaryStep, rhythmTrial, maximumStep },
    );
  }
}

/** Public validation seam for checkpoint and session owners. */
export function validateMainWireIntegratedModelAcceptedStateV1<TWallState>(
  state: MainWireIntegratedModelAcceptedStateV1<TWallState>,
  rhythm: MainWireIntegratedRhythmContextV1,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): void {
  assertRhythmContext(rhythm);
  validateDynamicMechanicalSupportInertanceProfileV1(dynamicProfile);
  assertExactKeys(state, [
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "coronary",
    "rhythmCalcium",
    "dynamicMechanicalSupport",
  ], "integrated accepted state");
  if (state.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID) {
    throw new Error("integrated accepted state transaction identity mismatch");
  }
  requireNonnegativeInteger(state.revision, "state.revision");
  requireNonnegativeFinite(state.acceptedTimeSec, "state.acceptedTimeSec");
  validateMainWireFiveWallCoronaryAcceptedStateV3(state.coronary);
  validateAcceptedFiveWallRhythmCalciumStateV1(
    state.rhythmCalcium,
    rhythm.binding,
    rhythm.schedule,
  );
  validateDynamicMechanicalSupportAcceptedStateV1(
    state.dynamicMechanicalSupport,
    dynamicProfile,
    dynamicConfig,
  );
  if (
    state.coronary.revision !== state.revision
    || state.rhythmCalcium.revision !== state.revision
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || state.rhythmCalcium.acceptedTimeSec !== state.acceptedTimeSec
  ) throw new Error("integrated accepted owner clocks differ");
}

/**
 * Exact outer wrapper used by cold initialization, promotion, and the separate
 * checkpoint owner. It accepts no legacy algebraic device state.
 */
export function wrapMainWireIntegratedModelAcceptedStateV1<TWallState>(
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
  rhythmCalcium: AcceptedFiveWallRhythmCalciumStateV1,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
  rhythm: MainWireIntegratedRhythmContextV1,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelAcceptedStateV1<TWallState> {
  const state = Object.freeze({
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID,
    revision: coronary.revision,
    acceptedTimeSec: coronary.acceptedTimeSec,
    coronary,
    rhythmCalcium,
    dynamicMechanicalSupport,
  });
  validateMainWireIntegratedModelAcceptedStateV1(
    state,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  return state;
}

function calciumDriveFromTrial(
  trial: AcceptedFiveWallRhythmCalciumTrialV1,
): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze({
      LA: trial.candidateFreeCalciumUMByWall.LA,
      LVFW: trial.candidateFreeCalciumUMByWall.LVFW,
      SEP: trial.candidateFreeCalciumUMByWall.SEP,
      RVFW: trial.candidateFreeCalciumUMByWall.RVFW,
      RA: trial.candidateFreeCalciumUMByWall.RA,
    }),
  });
}

function failure<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV1<TWallState>,
  reason: MainWireIntegratedModelStepFailureReasonV1,
  message: string,
  details: Readonly<{
    coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
    rhythmTrial?: AcceptedFiveWallRhythmCalciumTrialV1;
    maximumStep?: MainWireIntegratedModelMaximumStepV1;
  }>,
): MainWireIntegratedModelStepFailureV1<TWallState> {
  return Object.freeze({
    converged: false as const,
    reason,
    message,
    rollbackState: previous,
    ...(details.coronaryStep === undefined
      ? {}
      : { coronaryStep: details.coronaryStep }),
    ...(details.rhythmTrial === undefined
      ? {}
      : { rhythmTrial: details.rhythmTrial }),
    ...(details.maximumStep === undefined
      ? {}
      : { maximumStep: details.maximumStep }),
    mechanicsCommitted: false as const,
    circulationCommitted: false as const,
    coronaryCommitted: false as const,
    mvcReferenceCommitted: false as const,
    autoregulationCommitted: false as const,
    rhythmCalciumCommitted: false as const,
    dynamicMechanicalSupportCommitted: false as const,
  });
}

function assertStepInput(input: MainWireIntegratedModelStepInputV1): void {
  assertExactKeys(input, [
    "dtSec",
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "integrated step input");
  requirePositiveFinite(input.dtSec, "input.dtSec");
  assertRhythmContext(input.rhythm);
  assertDynamicContext(input.dynamicMechanicalSupport);
  assertCoronaryStepInput(input.coronary);
  rejectExternallyOwnedStepInputs(input.coronary);
  assertPeriodicSourceParameterBinding(
    input.rhythm.binding,
    input.coronary.calciumDriveParams.parameterSetId,
  );
}

function assertRhythmContext(
  context: MainWireIntegratedRhythmContextV1,
): void {
  assertExactKeys(context, ["binding", "schedule"], "integrated rhythm context");
}

function assertRhythmInitializeContext(
  context: MainWireIntegratedRhythmContextV1 & Readonly<{
    acceptedState: AcceptedFiveWallRhythmCalciumStateV1;
  }>,
): void {
  assertExactKeys(
    context,
    ["binding", "schedule", "acceptedState"],
    "integrated cold rhythm context",
  );
  assertRhythmContext({
    binding: context.binding,
    schedule: context.schedule,
  });
}

function assertDynamicContext(
  context: MainWireIntegratedDynamicMechanicalSupportContextV1,
): void {
  assertExactKeys(context, [
    "config",
    "heartRateBpm",
    "profile",
  ], "integrated dynamic MCS context");
  validateMechanicalSupportConfigV1(context.config);
  requirePositiveFinite(context.heartRateBpm, "dynamic MCS heartRateBpm");
  validateDynamicMechanicalSupportInertanceProfileV1(context.profile);
}

function assertDynamicInitializeContext(
  context: MainWireIntegratedDynamicMechanicalSupportInitializeV1,
): void {
  assertAllowedKeys(context, [
    "config",
    "heartRateBpm",
    "profile",
    "initialAcceptedFlowMlPerSec",
  ], "integrated dynamic MCS cold context");
  assertDynamicContext({
    config: context.config,
    heartRateBpm: context.heartRateBpm,
    profile: context.profile,
  });
  if (context.initialAcceptedFlowMlPerSec !== undefined) {
    assertExactKeys(
      context.initialAcceptedFlowMlPerSec,
      ROTARY_SUPPORT_DEVICE_IDS_V1,
      "initialAcceptedFlowMlPerSec",
    );
    for (const deviceId of ROTARY_SUPPORT_DEVICE_IDS_V1) {
      requireFinite(
        context.initialAcceptedFlowMlPerSec[deviceId],
        `initialAcceptedFlowMlPerSec.${deviceId}`,
      );
    }
  }
}

function assertCoronaryColdInput(input: object): void {
  assertAllowedKeys(input, [
    "provider",
    "runtime",
    "calciumDriveParams",
    "pericardium",
    "coronaryInitial",
    "coronaryPrior",
    "coronaryDisease",
    "collapseHydraulics",
    "impMechanism",
    "shorteningImpPrior",
    "fixedGlobalTotalBloodVolumeMl",
    "timeSec",
    "autoregulationWindow",
    "calciumDriveOverride",
    "mechanicalSupport",
    "dynamicMechanicalSupport",
  ], "integrated coronary cold input");
  requireOwnKeys(input, [
    "provider",
    "runtime",
    "calciumDriveParams",
    "pericardium",
  ], "integrated coronary cold input");
}

function assertCoronaryStepInput(input: object): void {
  assertAllowedKeys(input, [
    "runtime",
    "calciumDriveParams",
    "pericardium",
    "coronaryPrior",
    "coronaryDisease",
    "collapseHydraulics",
    "impMechanism",
    "shorteningImpPrior",
    "coronarySolverOptions",
    "circulationNewtonOptions",
    "protocolResistanceScaleByEdge",
    "coronaryAutoregulationDrive",
    "dtSec",
    "calciumDriveOverride",
    "mechanicalSupport",
    "dynamicMechanicalSupport",
  ], "integrated coronary step input");
  requireOwnKeys(input, [
    "runtime",
    "calciumDriveParams",
    "pericardium",
  ], "integrated coronary step input");
}

function rejectExternallyOwnedColdInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error("integrated cold owns calciumDriveOverride");
  }
  if (Object.hasOwn(input, "mechanicalSupport")
    || Object.hasOwn(input, "dynamicMechanicalSupport")) {
    throw new Error("integrated cold does not accept embedded MCS inputs");
  }
}

function rejectExternallyOwnedStepInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error("integrated step owns calciumDriveOverride");
  }
  if (Object.hasOwn(input, "mechanicalSupport")) {
    throw new Error("integrated lane rejects legacy algebraic mechanicalSupport");
  }
  if (Object.hasOwn(input, "dynamicMechanicalSupport")) {
    throw new Error("integrated step owns dynamicMechanicalSupport");
  }
}

function assertPeriodicSourceParameterBinding(
  binding: AcceptedFiveWallRhythmCalciumBindingV1,
  calciumParameterSetId: string,
): void {
  if (
    binding.parameterProvenance
      === "five-wall-normal-periodic-analytic-conversion"
    && binding.sourceParameterSetId !== calciumParameterSetId
  ) throw new Error("periodic rhythm and coronary calcium parameter sets differ");
}

function clockTolerance(acceptedTimeSec: number, stepSec: number): number {
  return 64 * Number.EPSILON
    * Math.max(1, Math.abs(acceptedTimeSec), Math.abs(stepSec));
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  field: string,
): void {
  assertPlainRecord(value, field);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) throw new Error(`${field} has an unexpected field set`);
}

function assertAllowedKeys(
  value: object,
  allowedKeys: readonly string[],
  field: string,
): void {
  assertPlainRecord(value, field);
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error(`${field} has an unexpected field`);
  }
}

function requireOwnKeys(
  value: object,
  requiredKeys: readonly string[],
  field: string,
): void {
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) throw new Error(`${field} is missing ${key}`);
  }
}

function assertPlainRecord(value: unknown, field: string): void {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) throw new Error(`${field} must be a plain object`);
}

function requireNonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative integer`);
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

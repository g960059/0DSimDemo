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
import {
  commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1,
  validateAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  type AcceptedGeneratedFiveWallRhythmCalciumMaximumStepV1,
  type AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type AcceptedGeneratedFiveWallRhythmCalciumTrialV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import type {
  WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID =
  "main-wire-base-coronary-v3-dynamic-mcs-generated-rhythm-transaction-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V2 = Object.freeze({
  staticRhythmV1ShadowPreserved: true as const,
  acceptedTuple:
    "coronary-v3-plus-generated-rhythm-calcium-plus-current-bound-dynamic-mcs-state" as const,
  clockTuple:
    "outer-coronary-generated-owner-and-nested-generator-exact" as const,
  commitSemantics:
    "all-owners-promote-once-only-after-coronary-and-dynamic-mcs-success" as const,
  rollbackSemantics:
    "all-failures-return-identical-previous-tuple-with-all-flags-false" as const,
  calciumCoupling:
    "one-pure-generated-trial-candidate-drive-injected-into-coronary-v3" as const,
  maximumStepOrder:
    "coronary-window-cap-before-generated-effective-event-search" as const,
  effectiveEventBoundary:
    "open-start-closed-end-complete-simultaneous-batch" as const,
  coldPendingQueuePreserved: true as const,
  dynamicMcsAcceptedBinding:
    "complete-inertance-profile-snapshot-and-structural-hydraulic-projection" as const,
  dynamicMcsRuntimeCommands:
    "enabled-clamp-speed-and-impella-performance-level-may-change" as const,
  legacyAlgebraicMcsAcceptedInIntegratedLane: false as const,
  iabpTiming:
    "heart-rate-phase-derived-provisional-not-generated-rhythm-synchronized" as const,
  iabpRhythmSynchronizationClaimed: false as const,
  checkpointOwnedHere: false as const,
  releaseReady: false as const,
  clinicalValidationClaimed: false as const,
});

export type MainWireIntegratedGeneratedRhythmContextV2 = Readonly<{
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1;
}>;

export type MainWireIntegratedDynamicMechanicalSupportContextV2 = Readonly<{
  config: MechanicalSupportConfigV1;
  heartRateBpm: number;
  profile: DynamicMechanicalSupportInertanceProfileV1;
}>;

export type MainWireIntegratedDynamicMechanicalSupportInitializeV2 =
  MainWireIntegratedDynamicMechanicalSupportContextV2 & Readonly<{
    initialAcceptedFlowMlPerSec?: Readonly<Record<
      RotarySupportDeviceIdV1,
      number
    >>;
  }>;

export type MainWireIntegratedModelAcceptedStateV2<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>;
  generatedRhythmCalcium: AcceptedGeneratedFiveWallRhythmCalciumStateV1;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
}>;

export type MainWireIntegratedModelInitializeInputV2<TWallState> = Readonly<{
  coronary: Omit<
    MainWireFiveWallCoronaryInitializeInputV3<TWallState>,
    "calciumDriveOverride"
  >;
  rhythm: MainWireIntegratedGeneratedRhythmContextV2 & Readonly<{
    acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1;
  }>;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportInitializeV2;
}>;

export type MainWireIntegratedModelColdResultV2<TWallState> = Readonly<{
  acceptedState: MainWireIntegratedModelAcceptedStateV2<TWallState>;
  coronaryCold: MainWireFiveWallCoronaryColdResultV3<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
}>;

export type MainWireIntegratedModelCoronaryStepInputV2 = Omit<
  MainWireFiveWallCoronaryStepInputV3,
  | "dtSec"
  | "calciumDriveOverride"
  | "mechanicalSupport"
  | "dynamicMechanicalSupport"
>;

export type MainWireIntegratedModelStepInputV2 = Readonly<{
  dtSec: number;
  coronary: MainWireIntegratedModelCoronaryStepInputV2;
  rhythm: MainWireIntegratedGeneratedRhythmContextV2;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportContextV2;
}>;

export type MainWireIntegratedModelMaximumStepV2 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  coronaryWindowMaximumStepSec: number;
  coronaryCappedStepSec: number;
  coronaryCappedEndTimeSec: number;
  rhythm: AcceptedGeneratedFiveWallRhythmCalciumMaximumStepV1;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmEvent: boolean;
  effectiveActivationBoundaryEventId: string | null;
  effectiveActivationBoundaryTimeSec: number | null;
  effectiveActivationBoundaryBatchSize: number;
  coronaryWindowAndEffectiveBatchTie: boolean;
}>;

export type MainWireIntegratedModelStepSuccessV2<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireIntegratedModelAcceptedStateV2<TWallState>;
  coronaryStep: MainWireFiveWallCoronaryStepSuccessV3<TWallState>;
  generatedRhythmTrial: AcceptedGeneratedFiveWallRhythmCalciumTrialV1;
  dynamicMechanicalSupportTrial:
    DynamicMechanicalSupportHydraulicEvaluationV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  maximumStep: MainWireIntegratedModelMaximumStepV2;
  mechanicsCommitted: true;
  circulationCommitted: true;
  coronaryCommitted: true;
  mvcReferenceCommitted: true;
  autoregulationCommitted: true;
  generatedRhythmCalciumCommitted: true;
  dynamicMechanicalSupportCommitted: true;
}>;

export type MainWireIntegratedModelStepFailureReasonV2 =
  | "outer-input-clock-binding-or-boundary-rejected"
  | "coronary-v3-candidate-failed"
  | "integrated-promotion-rejected";

export type MainWireIntegratedModelStepFailureV2<TWallState> = Readonly<{
  converged: false;
  reason: MainWireIntegratedModelStepFailureReasonV2;
  message: string;
  rollbackState: MainWireIntegratedModelAcceptedStateV2<TWallState>;
  coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
  generatedRhythmTrial?: AcceptedGeneratedFiveWallRhythmCalciumTrialV1;
  maximumStep?: MainWireIntegratedModelMaximumStepV2;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
  autoregulationCommitted: false;
  generatedRhythmCalciumCommitted: false;
  dynamicMechanicalSupportCommitted: false;
}>;

export type MainWireIntegratedModelStepResultV2<TWallState> =
  | MainWireIntegratedModelStepSuccessV2<TWallState>
  | MainWireIntegratedModelStepFailureV2<TWallState>;

export function initializeMainWireIntegratedModelV2<TWallState>(
  input: MainWireIntegratedModelInitializeInputV2<TWallState>,
): MainWireIntegratedModelColdResultV2<TWallState> {
  assertExactKeys(input, [
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "generated integrated cold input");
  assertRhythmInitializeContext(input.rhythm);
  assertDynamicInitializeContext(input.dynamicMechanicalSupport);
  assertCoronaryColdInput(input.coronary);
  rejectExternallyOwnedColdInputs(input.coronary);
  validateAcceptedGeneratedFiveWallRhythmCalciumStateV1(
    input.rhythm.acceptedState,
    input.rhythm.binding,
  );
  const coldTimeSec = input.coronary.timeSec ?? 0;
  if (
    input.rhythm.acceptedState.revision !== 0
    || input.rhythm.acceptedState.generatorState.revision !== 0
    || input.rhythm.acceptedState.acceptedTimeSec !== coldTimeSec
    || input.rhythm.acceptedState.generatorState.acceptedTimeSec !== coldTimeSec
  ) {
    throw new Error(
      "generated integrated cold rhythm must own one revision-zero clock",
    );
  }
  assertPeriodicSourceParameterBinding(
    input.rhythm.binding,
    input.coronary.calciumDriveParams.parameterSetId,
  );
  assertColdRhythmCoronaryWindowPolicy(
    input.rhythm.binding,
    input.rhythm.acceptedState,
    input.coronary.calciumDriveParams.cycleLengthSec,
    input.coronary.autoregulationWindow,
  );
  const calciumDrive =
    evaluateAcceptedGeneratedFiveWallRhythmCalciumCurrentDriveV1(
      input.rhythm.acceptedState,
      input.rhythm.binding,
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
  const acceptedState = wrapMainWireIntegratedModelAcceptedStateV2(
    coronaryCold.acceptedState,
    input.rhythm.acceptedState,
    dynamicMechanicalSupport,
    Object.freeze({ binding: input.rhythm.binding }),
    input.dynamicMechanicalSupport.profile,
    input.dynamicMechanicalSupport.config,
  );
  return Object.freeze({ acceptedState, coronaryCold, calciumDrive });
}

/** Coronary window cap is resolved before generated event discovery. */
export function maximumMainWireIntegratedModelStepDurationV2<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV2<TWallState>,
  requestedStepSec: number,
  rhythm: MainWireIntegratedGeneratedRhythmContextV2,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelMaximumStepV2 {
  validateMainWireIntegratedModelAcceptedStateV2(
    previous,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  const requested = requirePositiveFinite(requestedStepSec, "requestedStepSec");
  const requestedEndTimeSec = previous.acceptedTimeSec + requested;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error("generated integrated requested endpoint must remain finite");
  }
  const coronaryWindowMaximumStepSec =
    maximumMainWireFiveWallCoronaryStepDurationV3(previous.coronary);
  const coronaryCappedStepSec = Math.min(
    requested,
    coronaryWindowMaximumStepSec,
  );
  if (!(coronaryCappedStepSec > 0)) {
    throw new Error("generated integrated coronary-capped step must be positive");
  }
  const coronaryCappedEndTimeSec = previous.acceptedTimeSec
    + coronaryCappedStepSec;
  const rhythmMaximum = maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1(
    previous.generatedRhythmCalcium,
    coronaryCappedStepSec,
    rhythm.binding,
  );
  const maximumStepSec = rhythmMaximum.maximumStepSec;
  const candidateTimeSec = rhythmMaximum.candidateTimeSec;
  if (!(maximumStepSec > 0) || !Number.isFinite(maximumStepSec)) {
    throw new Error("generated integrated maximum step must be positive and finite");
  }
  const boundary = rhythmMaximum.generator;
  const boundaryTime = boundary.boundaryActivationTimeSec;
  const tolerance = clockTolerance(previous.acceptedTimeSec, requested);
  return Object.freeze({
    requestedStepSec: requested,
    requestedEndTimeSec,
    coronaryWindowMaximumStepSec,
    coronaryCappedStepSec,
    coronaryCappedEndTimeSec,
    rhythm: rhythmMaximum,
    maximumStepSec,
    candidateTimeSec,
    clippedByCoronaryWindow:
      coronaryWindowMaximumStepSec < requested - tolerance,
    clippedByRhythmEvent: boundary.clippedByEffectiveActivation,
    effectiveActivationBoundaryEventId: boundary.boundaryEventId,
    effectiveActivationBoundaryTimeSec: boundaryTime,
    effectiveActivationBoundaryBatchSize: boundary.boundaryBatchSize,
    coronaryWindowAndEffectiveBatchTie:
      boundaryTime !== null
      && boundaryTime === coronaryCappedEndTimeSec
      && coronaryWindowMaximumStepSec <= requested + tolerance,
  });
}

export function stepMainWireIntegratedModelV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireIntegratedModelAcceptedStateV2<TWallState>,
  input: MainWireIntegratedModelStepInputV2,
): MainWireIntegratedModelStepResultV2<TWallState> {
  let maximumStep: MainWireIntegratedModelMaximumStepV2 | undefined;
  let generatedRhythmTrial:
    AcceptedGeneratedFiveWallRhythmCalciumTrialV1 | undefined;
  let coronaryStep: MainWireFiveWallCoronaryStepResultV3<TWallState> | undefined;
  try {
    assertStepInput(input);
    validateMainWireIntegratedModelAcceptedStateV2(
      previous,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    assertStepRhythmCoronaryWindowPolicy(
      input.rhythm.binding,
      input.coronary.calciumDriveParams.cycleLengthSec,
      previous.coronary.coronaryAutoregulationBinding.windowPolicy,
    );
    maximumStep = maximumMainWireIntegratedModelStepDurationV2(
      previous,
      input.dtSec,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    if (
      input.dtSec - maximumStep.maximumStepSec
        > clockTolerance(previous.acceptedTimeSec, input.dtSec)
    ) {
      throw new RangeError(
        "generated integrated step crosses a coronary or effective-event boundary",
      );
    }
    const candidateTimeSec = maximumStep.candidateTimeSec;
    const candidateDtSec = candidateTimeSec - previous.acceptedTimeSec;
    generatedRhythmTrial =
      evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        previous.generatedRhythmCalcium,
        candidateTimeSec,
        input.rhythm.binding,
      );
    const calciumDrive = calciumDriveFromGeneratedTrial(generatedRhythmTrial);
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
        dtSec: candidateDtSec,
        calciumDriveOverride: calciumDrive,
        dynamicMechanicalSupport,
      },
    );
    if (coronaryStep.converged === false) {
      return failure(
        previous,
        "coronary-v3-candidate-failed",
        coronaryStep.message,
        { coronaryStep, generatedRhythmTrial, maximumStep },
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
    const generatedRhythmCalcium =
      commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        previous.generatedRhythmCalcium,
        generatedRhythmTrial,
        input.rhythm.binding,
      );
    const acceptedState = wrapMainWireIntegratedModelAcceptedStateV2(
      coronaryStep.acceptedState,
      generatedRhythmCalcium,
      dynamicTrial.candidateAcceptedState,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    return Object.freeze({
      converged: true as const,
      acceptedState,
      coronaryStep,
      generatedRhythmTrial,
      dynamicMechanicalSupportTrial: dynamicTrial,
      calciumDrive,
      maximumStep,
      mechanicsCommitted: true as const,
      circulationCommitted: true as const,
      coronaryCommitted: true as const,
      mvcReferenceCommitted: true as const,
      autoregulationCommitted: true as const,
      generatedRhythmCalciumCommitted: true as const,
      dynamicMechanicalSupportCommitted: true as const,
    });
  } catch (error) {
    return failure(
      previous,
      coronaryStep?.converged === true
        ? "integrated-promotion-rejected"
        : "outer-input-clock-binding-or-boundary-rejected",
      error instanceof Error ? error.message : String(error),
      { coronaryStep, generatedRhythmTrial, maximumStep },
    );
  }
}

export function validateMainWireIntegratedModelAcceptedStateV2<TWallState>(
  state: MainWireIntegratedModelAcceptedStateV2<TWallState>,
  rhythm: MainWireIntegratedGeneratedRhythmContextV2,
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
    "generatedRhythmCalcium",
    "dynamicMechanicalSupport",
  ], "generated integrated accepted state");
  if (state.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID) {
    throw new Error("generated integrated accepted state identity mismatch");
  }
  requireNonnegativeInteger(state.revision, "state.revision");
  requireNonnegativeFinite(state.acceptedTimeSec, "state.acceptedTimeSec");
  validateMainWireFiveWallCoronaryAcceptedStateV3(state.coronary);
  validateAcceptedGeneratedFiveWallRhythmCalciumStateV1(
    state.generatedRhythmCalcium,
    rhythm.binding,
  );
  validateDynamicMechanicalSupportAcceptedStateV1(
    state.dynamicMechanicalSupport,
    dynamicProfile,
    dynamicConfig,
  );
  assertAcceptedRhythmCoronaryWindowPolicy(
    rhythm.binding,
    state.generatedRhythmCalcium,
    state.coronary.coronaryAutoregulationBinding.windowPolicy,
  );
  const generated = state.generatedRhythmCalcium;
  if (
    state.coronary.revision !== state.revision
    || generated.revision !== state.revision
    || generated.generatorState.revision !== state.revision
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || generated.acceptedTimeSec !== state.acceptedTimeSec
    || generated.generatorState.acceptedTimeSec !== state.acceptedTimeSec
  ) throw new Error("generated integrated accepted owner clocks differ");
}

export function wrapMainWireIntegratedModelAcceptedStateV2<TWallState>(
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
  generatedRhythmCalcium: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
  rhythm: MainWireIntegratedGeneratedRhythmContextV2,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelAcceptedStateV2<TWallState> {
  const state = Object.freeze({
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
    revision: coronary.revision,
    acceptedTimeSec: coronary.acceptedTimeSec,
    coronary,
    generatedRhythmCalcium,
    dynamicMechanicalSupport,
  });
  validateMainWireIntegratedModelAcceptedStateV2(
    state,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  return state;
}

function calciumDriveFromGeneratedTrial(
  trial: AcceptedGeneratedFiveWallRhythmCalciumTrialV1,
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
  previous: MainWireIntegratedModelAcceptedStateV2<TWallState>,
  reason: MainWireIntegratedModelStepFailureReasonV2,
  message: string,
  details: Readonly<{
    coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
    generatedRhythmTrial?: AcceptedGeneratedFiveWallRhythmCalciumTrialV1;
    maximumStep?: MainWireIntegratedModelMaximumStepV2;
  }>,
): MainWireIntegratedModelStepFailureV2<TWallState> {
  return Object.freeze({
    converged: false as const,
    reason,
    message,
    rollbackState: previous,
    ...(details.coronaryStep === undefined
      ? {}
      : { coronaryStep: details.coronaryStep }),
    ...(details.generatedRhythmTrial === undefined
      ? {}
      : { generatedRhythmTrial: details.generatedRhythmTrial }),
    ...(details.maximumStep === undefined
      ? {}
      : { maximumStep: details.maximumStep }),
    mechanicsCommitted: false as const,
    circulationCommitted: false as const,
    coronaryCommitted: false as const,
    mvcReferenceCommitted: false as const,
    autoregulationCommitted: false as const,
    generatedRhythmCalciumCommitted: false as const,
    dynamicMechanicalSupportCommitted: false as const,
  });
}

function assertStepInput(input: MainWireIntegratedModelStepInputV2): void {
  assertExactKeys(input, [
    "dtSec",
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "generated integrated step input");
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
  context: MainWireIntegratedGeneratedRhythmContextV2,
): void {
  assertExactKeys(context, ["binding"], "generated integrated rhythm context");
}

function assertRhythmInitializeContext(
  context: MainWireIntegratedGeneratedRhythmContextV2 & Readonly<{
    acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1;
  }>,
): void {
  assertExactKeys(
    context,
    ["binding", "acceptedState"],
    "generated integrated cold rhythm context",
  );
  assertRhythmContext({ binding: context.binding });
}

function assertDynamicContext(
  context: MainWireIntegratedDynamicMechanicalSupportContextV2,
): void {
  assertExactKeys(context, [
    "config",
    "heartRateBpm",
    "profile",
  ], "generated integrated dynamic MCS context");
  validateMechanicalSupportConfigV1(context.config);
  requirePositiveFinite(context.heartRateBpm, "dynamic MCS heartRateBpm");
  validateDynamicMechanicalSupportInertanceProfileV1(context.profile);
}

function assertDynamicInitializeContext(
  context: MainWireIntegratedDynamicMechanicalSupportInitializeV2,
): void {
  assertAllowedKeys(context, [
    "config",
    "heartRateBpm",
    "profile",
    "initialAcceptedFlowMlPerSec",
  ], "generated integrated dynamic MCS cold context");
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
  ], "generated integrated coronary cold input");
  requireOwnKeys(input, [
    "provider",
    "runtime",
    "calciumDriveParams",
    "pericardium",
  ], "generated integrated coronary cold input");
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
  ], "generated integrated coronary step input");
  requireOwnKeys(input, [
    "runtime",
    "calciumDriveParams",
    "pericardium",
  ], "generated integrated coronary step input");
}

function rejectExternallyOwnedColdInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error("generated integrated cold owns calciumDriveOverride");
  }
  if (
    Object.hasOwn(input, "mechanicalSupport")
    || Object.hasOwn(input, "dynamicMechanicalSupport")
  ) throw new Error("generated integrated cold rejects embedded MCS inputs");
}

function rejectExternallyOwnedStepInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error("generated integrated step owns calciumDriveOverride");
  }
  if (Object.hasOwn(input, "mechanicalSupport")) {
    throw new Error(
      "generated integrated lane rejects legacy algebraic mechanicalSupport",
    );
  }
  if (Object.hasOwn(input, "dynamicMechanicalSupport")) {
    throw new Error("generated integrated step owns dynamicMechanicalSupport");
  }
}

function assertPeriodicSourceParameterBinding(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  calciumParameterSetId: string,
): void {
  if (
    binding.parameterProvenance
      === "five-wall-normal-periodic-analytic-conversion"
    && binding.sourceParameterSetId !== calciumParameterSetId
  ) throw new Error("generated rhythm and coronary calcium parameter sets differ");
}

function assertColdRhythmCoronaryWindowPolicy(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  coronaryCalciumCycleLengthSec: number,
  requestedWindow: Readonly<{
    durationSec?: number;
    interpretation?:
      | "periodic-sinus-cycle-aligned"
      | "irregular-rhythm-stationary";
  }> | undefined,
): void {
  const sourceMode = binding.generatorConfig.sourceMode;
  if (
    sourceMode === "regular-atrial-flutter"
    && requestedWindow?.interpretation !== "irregular-rhythm-stationary"
  ) {
    throw new Error(
      "generated atrial flutter requires an explicit irregular-rhythm-stationary coronary window",
    );
  }
  const interpretation = requestedWindow?.interpretation
    ?? "periodic-sinus-cycle-aligned";
  if (interpretation === "periodic-sinus-cycle-aligned") {
    if (
      binding.generatorConfig.sourcePeriodSec
        !== coronaryCalciumCycleLengthSec
    ) {
      throw new Error(
        "periodic sinus rhythm period and coronary calcium cycle differ",
      );
    }
    if (
      requestedWindow?.durationSec !== undefined
      && requestedWindow.durationSec !== coronaryCalciumCycleLengthSec
    ) {
      throw new Error(
        "periodic sinus coronary window duration must equal the calcium cycle",
      );
    }
  }
  if (
    binding.parameterProvenance
      === "five-wall-normal-periodic-analytic-conversion"
    && acceptedState.initialization !== "periodic-sinus-analytic-state"
  ) {
    throw new Error(
      "periodic analytic generated binding requires periodic analytic accepted initialization",
    );
  }
}

function assertAcceptedRhythmCoronaryWindowPolicy(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  acceptedState: AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  windowPolicy: Readonly<{
    interpretation:
      | "periodic-sinus-cycle-aligned"
      | "irregular-rhythm-stationary";
    durationSec: number;
  }>,
): void {
  if (
    binding.generatorConfig.sourceMode === "regular-atrial-flutter"
    && windowPolicy.interpretation !== "irregular-rhythm-stationary"
  ) {
    throw new Error(
      "generated atrial flutter requires an irregular-rhythm-stationary accepted coronary window",
    );
  }
  if (
    windowPolicy.interpretation === "periodic-sinus-cycle-aligned"
    && binding.generatorConfig.sourcePeriodSec !== windowPolicy.durationSec
  ) {
    throw new Error(
      "generated sinus period and accepted coronary window duration differ",
    );
  }
  if (
    binding.parameterProvenance
      === "five-wall-normal-periodic-analytic-conversion"
    && acceptedState.initialization !== "periodic-sinus-analytic-state"
  ) {
    throw new Error(
      "periodic analytic generated binding requires periodic analytic accepted initialization",
    );
  }
}

function assertStepRhythmCoronaryWindowPolicy(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  coronaryCalciumCycleLengthSec: number,
  windowPolicy: Readonly<{
    interpretation:
      | "periodic-sinus-cycle-aligned"
      | "irregular-rhythm-stationary";
    durationSec: number;
  }>,
): void {
  if (
    windowPolicy.interpretation === "periodic-sinus-cycle-aligned"
    && (
      binding.generatorConfig.sourcePeriodSec
        !== coronaryCalciumCycleLengthSec
      || windowPolicy.durationSec !== coronaryCalciumCycleLengthSec
    )
  ) {
    throw new Error(
      "periodic sinus rhythm, coronary calcium cycle, and accepted window differ",
    );
  }
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

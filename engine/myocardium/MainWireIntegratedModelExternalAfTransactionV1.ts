import type { MechanicalSupportConfigV1 } from "@/engine/devices/typesV1";
import type { DynamicMechanicalSupportInertanceProfileV1 } from "@/engine/devices/dynamicNetworkV1";
import {
  initializeMainWireIntegratedModelV3,
  maximumMainWireIntegratedModelStepDurationV3,
  stepMainWireIntegratedModelV3,
  validateMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmContextV3,
  type MainWireIntegratedDynamicMechanicalSupportContextV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelColdResultV3,
  type MainWireIntegratedModelCoronaryStepInputV3,
  type MainWireIntegratedModelInitializeInputV3,
  type MainWireIntegratedModelMaximumStepV3,
  type MainWireIntegratedModelStepFailureV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireFiveWallFreeCalciumDriveV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  commitAcceptedAfAtrialSourceTrialV1,
  evaluateAcceptedAfAtrialSourceTrialV1,
  initializeAcceptedAfAtrialSourceStateV1,
  maximumAcceptedAfAtrialSourceStepV1,
  rollbackAcceptedAfAtrialSourceTrialV1,
  validateAcceptedAfAtrialSourceConfigurationV1,
  validateAcceptedAfAtrialSourceStateV1,
  type AcceptedAfAtrialSourceConfigurationV1,
  type AcceptedAfAtrialSourceInitialStateInputV1,
  type AcceptedAfAtrialSourceMaximumStepV1,
  type AcceptedAfAtrialSourceStateV1,
  type AcceptedAfAtrialSourceTrialV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";
import {
  validateAcceptedComposedRhythmTransactionConfigurationV2,
  type ComposedRhythmExternalAtrialSourceBatchV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { canonicalJsonStringify } from "@/engine/scientific/release";
import type { WholeHeartMechanicsProviderV1 } from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID =
  "main-wire-integrated-model-external-af-wrapper-transaction-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1 =
  deepFreeze({
    acceptedTuple:
      "accepted-AF-source-owner-v1-plus-main-wire-integrated-model-v3" as const,
    clockTuple:
      "outer-AF-source-and-integrated-model-clock-and-revision-exact" as const,
    configurationBinding:
      "complete-AF-configuration-plus-complete-composed-rhythm-configuration-with-external-af-owner-instance-match" as const,
    maximumStep:
      "minimum-of-AF-source-boundary-and-V3-maximum-with-the-same-AF-owner-boundary" as const,
    externalBatch:
      "complete-owner-produced-atrial-primary-intrinsic-batch-at-one-candidate-time" as const,
    commitSemantics:
      "AF-and-V3-promote-once-only-after-V3-success-and-exact-AF-recomputation" as const,
    rollbackSemantics:
      "every-failure-returns-identical-previous-AF-and-V3-owner-tuple" as const,
    coordinatedAfAtrialCalciumClaimed: false as const,
    patientFittingClaimed: false as const,
    newPhysiologicalValidationClaimed: false as const,
    clinicalValidityClaimed: false as const,
    longTermStabilityEstablished: false as const,
    acceptedStateImmutable: true as const,
    candidateEvaluationPure: true as const,
    checkpointOwnedSeparately: true as const,
    releaseReady: false as const,
  });

export type MainWireIntegratedModelExternalAfBindingContextV1 = Readonly<{
  afSourceConfiguration: AcceptedAfAtrialSourceConfigurationV1;
  rhythm: MainWireIntegratedComposedRhythmContextV3;
  dynamicMechanicalSupportProfile: DynamicMechanicalSupportInertanceProfileV1;
  dynamicMechanicalSupportConfig: MechanicalSupportConfigV1;
}>;

export type MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState> =
  Readonly<{
    transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID;
    revision: number;
    acceptedTimeSec: number;
    afSource: AcceptedAfAtrialSourceStateV1;
    integratedModel: MainWireIntegratedModelAcceptedStateV3<TWallState>;
  }>;

export type MainWireIntegratedModelExternalAfInitializeInputV1<TWallState> =
  Readonly<{
    afSource: Readonly<{
      configuration: AcceptedAfAtrialSourceConfigurationV1;
      initialState: AcceptedAfAtrialSourceInitialStateInputV1;
    }>;
    integratedModel: MainWireIntegratedModelInitializeInputV3<TWallState>;
  }>;

export type MainWireIntegratedModelExternalAfColdResultV1<TWallState> =
  Readonly<{
    acceptedState: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>;
    afSourceInitialState: AcceptedAfAtrialSourceStateV1;
    integratedModelCold: MainWireIntegratedModelColdResultV3<TWallState>;
  }>;

export type MainWireIntegratedModelExternalAfStepInputV1 = Readonly<{
  dtSec: number;
  afSourceConfiguration: AcceptedAfAtrialSourceConfigurationV1;
  coronary: MainWireIntegratedModelCoronaryStepInputV3;
  rhythm: MainWireIntegratedComposedRhythmContextV3;
  dynamicMechanicalSupport: MainWireIntegratedDynamicMechanicalSupportContextV3;
}>;

export type MainWireIntegratedModelExternalAfMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  afSource: AcceptedAfAtrialSourceMaximumStepV1;
  integratedModel: MainWireIntegratedModelMaximumStepV3;
  maximumStepSec: number;
  candidateTimeSec: number;
  externalAfNextBoundaryTimeSec: number;
  clippedByAfSourceBoundary: boolean;
  clippedByIntegratedModelBoundary: boolean;
  afSourceAndIntegratedModelBoundaryTie: boolean;
}>;

export type MainWireIntegratedModelExternalAfStepSuccessV1<TWallState> =
  Readonly<{
    converged: true;
    acceptedState: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>;
    afSourceTrial: AcceptedAfAtrialSourceTrialV1;
    externalAtrialSourceBatch: ComposedRhythmExternalAtrialSourceBatchV2;
    integratedModelStep: MainWireIntegratedModelStepSuccessV3<TWallState>;
    maximumStep: MainWireIntegratedModelExternalAfMaximumStepV1;
    afSourceCommitted: true;
    integratedModelCommitted: true;
  }>;

export type MainWireIntegratedModelExternalAfStepFailureReasonV1 =
  | "outer-binding-or-boundary-rejected"
  | "integrated-model-v3-candidate-failed"
  | "atomic-promotion-rejected";

export type MainWireIntegratedModelExternalAfStepFailureV1<TWallState> =
  Readonly<{
    converged: false;
    reason: MainWireIntegratedModelExternalAfStepFailureReasonV1;
    message: string;
    rollbackState: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>;
    afSourceTrial?: AcceptedAfAtrialSourceTrialV1;
    integratedModelFailure?: MainWireIntegratedModelStepFailureV3<TWallState>;
    maximumStep?: MainWireIntegratedModelExternalAfMaximumStepV1;
    afSourceCommitted: false;
    integratedModelCommitted: false;
  }>;

export type MainWireIntegratedModelExternalAfStepResultV1<TWallState> =
  | MainWireIntegratedModelExternalAfStepSuccessV1<TWallState>
  | MainWireIntegratedModelExternalAfStepFailureV1<TWallState>;

export function initializeMainWireIntegratedModelExternalAfV1<TWallState>(
  input: MainWireIntegratedModelExternalAfInitializeInputV1<TWallState>,
): MainWireIntegratedModelExternalAfColdResultV1<TWallState> {
  assertExactKeys(
    input,
    ["afSource", "integratedModel"],
    "external-AF integrated cold input",
  );
  assertExactKeys(
    input.afSource,
    ["configuration", "initialState"],
    "external-AF source cold input",
  );
  validateAcceptedAfAtrialSourceConfigurationV1(input.afSource.configuration);
  assertExternalAfConfigurationBinding(
    input.afSource.configuration,
    input.integratedModel.rhythm.configuration,
  );
  const afSourceInitialState = initializeAcceptedAfAtrialSourceStateV1(
    input.afSource.configuration,
    input.afSource.initialState,
  );
  const integratedModelCold = initializeMainWireIntegratedModelV3(
    input.integratedModel,
  );
  const acceptedState = wrapMainWireIntegratedModelExternalAfAcceptedStateV1(
    afSourceInitialState,
    integratedModelCold.acceptedState,
    {
      afSourceConfiguration: input.afSource.configuration,
      rhythm: { configuration: input.integratedModel.rhythm.configuration },
      dynamicMechanicalSupportProfile:
        input.integratedModel.dynamicMechanicalSupport.profile,
      dynamicMechanicalSupportConfig:
        input.integratedModel.dynamicMechanicalSupport.config,
    },
  );
  return Object.freeze({
    acceptedState,
    afSourceInitialState,
    integratedModelCold,
  });
}

export function maximumMainWireIntegratedModelExternalAfStepDurationV1<
  TWallState,
>(
  previous: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
  requestedStepSec: number,
  context: MainWireIntegratedModelExternalAfBindingContextV1,
): MainWireIntegratedModelExternalAfMaximumStepV1 {
  validateMainWireIntegratedModelExternalAfAcceptedStateV1(previous, context);
  const requested = requirePositiveFinite(
    requestedStepSec,
    "external-AF integrated requestedStepSec",
  );
  const requestedEndTimeSec = safeFutureTime(
    previous.acceptedTimeSec,
    requested,
    "external-AF integrated requested endpoint",
  );
  const afSource = maximumAcceptedAfAtrialSourceStepV1(
    previous.afSource,
    requested,
  );
  const externalAfNextBoundaryTimeSec =
    previous.afSource.nextSourceActivationTimeSec;
  const integratedModel = maximumMainWireIntegratedModelStepDurationV3(
    previous.integratedModel,
    requested,
    {
      configuration: context.rhythm.configuration,
      externalAfNextBoundaryTimeSec,
    },
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  const useIntegrated =
    integratedModel.maximumStepSec <= afSource.maximumStepSec;
  const maximumStepSec = Math.min(
    afSource.maximumStepSec,
    integratedModel.maximumStepSec,
  );
  const candidateTimeSec = useIntegrated
    ? integratedModel.candidateTimeSec
    : afSource.candidateTimeSec;
  if (
    !(maximumStepSec > 0) ||
    !Number.isFinite(maximumStepSec) ||
    !Number.isFinite(candidateTimeSec) ||
    !(candidateTimeSec > previous.acceptedTimeSec)
  ) {
    throw new Error(
      "external-AF integrated maximum-step owner clocks are inconsistent",
    );
  }
  const clippedByAfSourceBoundary =
    afSource.clippedBySourceImpulse &&
    candidateTimeSec === afSource.boundaryActivationTimeSec;
  const clippedByIntegratedModelBoundary =
    candidateTimeSec === integratedModel.candidateTimeSec &&
    integratedModel.maximumStepSec < requested;
  return Object.freeze({
    requestedStepSec: requested,
    requestedEndTimeSec,
    afSource,
    integratedModel,
    maximumStepSec,
    candidateTimeSec,
    externalAfNextBoundaryTimeSec,
    clippedByAfSourceBoundary,
    clippedByIntegratedModelBoundary,
    afSourceAndIntegratedModelBoundaryTie:
      afSource.maximumStepSec === integratedModel.maximumStepSec &&
      afSource.clippedBySourceImpulse,
  });
}

export function stepMainWireIntegratedModelExternalAfV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
  input: MainWireIntegratedModelExternalAfStepInputV1,
): MainWireIntegratedModelExternalAfStepResultV1<TWallState> {
  let maximumStep: MainWireIntegratedModelExternalAfMaximumStepV1 | undefined;
  let afSourceTrial: AcceptedAfAtrialSourceTrialV1 | undefined;
  try {
    assertExternalAfStepInput(input);
    const context = bindingContextFromStepInput(input);
    validateMainWireIntegratedModelExternalAfAcceptedStateV1(previous, context);
    maximumStep = maximumMainWireIntegratedModelExternalAfStepDurationV1(
      previous,
      input.dtSec,
      context,
    );
    if (
      input.dtSec - maximumStep.maximumStepSec >
      clockTolerance(previous.acceptedTimeSec, input.dtSec)
    ) {
      throw new RangeError(
        "external-AF integrated step crosses an AF, coronary, or rhythm boundary",
      );
    }
    const candidateTimeSec = maximumStep.candidateTimeSec;
    afSourceTrial = evaluateAcceptedAfAtrialSourceTrialV1(
      previous.afSource,
      candidateTimeSec,
    );
    assertCompleteAfCandidateBatch(
      afSourceTrial,
      candidateTimeSec,
      previous.afSource.nextSourceActivationTimeSec,
    );
    const externalAtrialSourceBatch = deepFreeze({
      sourceClass: "atrial-fibrillation" as const,
      ownerInstanceId: previous.afSource.configuration.ownerInstanceId,
      candidateTimeSec,
      sourceImpulses: afSourceTrial.sourceImpulses,
      coordinatedAtrialCalcium: "forbidden" as const,
    }) satisfies ComposedRhythmExternalAtrialSourceBatchV2;
    const integratedModelStep = stepMainWireIntegratedModelV3(
      provider,
      previous.integratedModel,
      {
        dtSec: candidateTimeSec - previous.acceptedTimeSec,
        coronary: input.coronary,
        rhythm: {
          configuration: input.rhythm.configuration,
          externalAfNextBoundaryTimeSec:
            maximumStep.externalAfNextBoundaryTimeSec,
          externalAtrialSourceBatch,
        },
        dynamicMechanicalSupport: input.dynamicMechanicalSupport,
      },
    );
    if (integratedModelStep.converged === false) {
      assertIdentityRollback(previous, afSourceTrial, integratedModelStep);
      return failure(
        previous,
        "integrated-model-v3-candidate-failed",
        integratedModelStep.message,
        {
          afSourceTrial,
          integratedModelFailure: integratedModelStep,
          maximumStep,
        },
      );
    }
    const afSource = commitAcceptedAfAtrialSourceTrialV1(
      previous.afSource,
      afSourceTrial,
    );
    const acceptedState = wrapMainWireIntegratedModelExternalAfAcceptedStateV1(
      afSource,
      integratedModelStep.acceptedState,
      context,
    );
    return Object.freeze({
      converged: true as const,
      acceptedState,
      afSourceTrial,
      externalAtrialSourceBatch,
      integratedModelStep,
      maximumStep,
      afSourceCommitted: true as const,
      integratedModelCommitted: true as const,
    });
  } catch (error) {
    if (afSourceTrial !== undefined) {
      const rolledBack = rollbackAcceptedAfAtrialSourceTrialV1(
        previous.afSource,
        afSourceTrial,
      );
      if (rolledBack !== previous.afSource) {
        return failure(
          previous,
          "atomic-promotion-rejected",
          "external-AF source rollback did not preserve accepted identity",
          { afSourceTrial, maximumStep },
        );
      }
    }
    return failure(
      previous,
      afSourceTrial === undefined
        ? "outer-binding-or-boundary-rejected"
        : "atomic-promotion-rejected",
      error instanceof Error ? error.message : String(error),
      { afSourceTrial, maximumStep },
    );
  }
}

export function validateMainWireIntegratedModelExternalAfAcceptedStateV1<
  TWallState,
>(
  state: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
  context: MainWireIntegratedModelExternalAfBindingContextV1,
): void {
  assertBindingContext(context);
  assertExactKeys(
    state,
    [
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "afSource",
      "integratedModel",
    ],
    "external-AF integrated accepted state",
  );
  if (
    state.transactionId !==
    MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID
  ) {
    throw new Error("external-AF integrated accepted state identity mismatch");
  }
  if (!Object.isFrozen(state)) {
    throw new Error("external-AF integrated accepted state must be immutable");
  }
  requireNonnegativeSafeInteger(state.revision, "external-AF revision");
  requireNonnegativeFinite(
    state.acceptedTimeSec,
    "external-AF acceptedTimeSec",
  );
  validateAcceptedAfAtrialSourceStateV1(state.afSource);
  validateMainWireIntegratedModelAcceptedStateV3(
    state.integratedModel,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  assertExternalAfConfigurationBinding(
    context.afSourceConfiguration,
    context.rhythm.configuration,
  );
  if (
    canonicalJsonStringify(state.afSource.configuration) !==
    canonicalJsonStringify(context.afSourceConfiguration)
  ) {
    throw new Error(
      "external-AF integrated accepted state AF configuration mismatch",
    );
  }
  if (
    canonicalJsonStringify(
      state.integratedModel.composedRhythm.configuration,
    ) !== canonicalJsonStringify(context.rhythm.configuration)
  ) {
    throw new Error(
      "external-AF integrated accepted state rhythm configuration mismatch",
    );
  }
  if (
    state.revision !== state.afSource.revision ||
    state.revision !== state.integratedModel.revision ||
    state.acceptedTimeSec !== state.afSource.acceptedTimeSec ||
    state.acceptedTimeSec !== state.integratedModel.acceptedTimeSec
  ) {
    throw new Error("external-AF integrated accepted owner clocks differ");
  }
}

export function wrapMainWireIntegratedModelExternalAfAcceptedStateV1<
  TWallState,
>(
  afSource: AcceptedAfAtrialSourceStateV1,
  integratedModel: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  context: MainWireIntegratedModelExternalAfBindingContextV1,
): MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState> {
  const state = Object.freeze({
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID,
    revision: afSource.revision,
    acceptedTimeSec: afSource.acceptedTimeSec,
    afSource,
    integratedModel,
  });
  validateMainWireIntegratedModelExternalAfAcceptedStateV1(state, context);
  return state;
}

function assertExternalAfConfigurationBinding(
  afConfiguration: AcceptedAfAtrialSourceConfigurationV1,
  rhythmConfiguration: MainWireIntegratedComposedRhythmContextV3["configuration"],
): void {
  validateAcceptedAfAtrialSourceConfigurationV1(afConfiguration);
  validateAcceptedComposedRhythmTransactionConfigurationV2(rhythmConfiguration);
  if (rhythmConfiguration.atrialSource.mode !== "external-af") {
    throw new Error(
      "external-AF integrated wrapper requires composed rhythm external-af mode",
    );
  }
  if (
    rhythmConfiguration.atrialSource.externalAfOwnerInstanceId !==
    afConfiguration.ownerInstanceId
  ) {
    throw new Error(
      "external-AF integrated wrapper ownerInstanceId binding mismatch",
    );
  }
}

function assertBindingContext(
  context: MainWireIntegratedModelExternalAfBindingContextV1,
): void {
  assertExactKeys(
    context,
    [
      "afSourceConfiguration",
      "rhythm",
      "dynamicMechanicalSupportProfile",
      "dynamicMechanicalSupportConfig",
    ],
    "external-AF integrated binding context",
  );
  assertExactKeys(
    context.rhythm,
    ["configuration"],
    "external-AF integrated rhythm context",
  );
  assertExternalAfConfigurationBinding(
    context.afSourceConfiguration,
    context.rhythm.configuration,
  );
}

function assertExternalAfStepInput(
  input: MainWireIntegratedModelExternalAfStepInputV1,
): void {
  assertExactKeys(
    input,
    [
      "dtSec",
      "afSourceConfiguration",
      "coronary",
      "rhythm",
      "dynamicMechanicalSupport",
    ],
    "external-AF integrated step input",
  );
  requirePositiveFinite(input.dtSec, "external-AF integrated input.dtSec");
  assertExactKeys(
    input.rhythm,
    ["configuration"],
    "external-AF integrated step rhythm context",
  );
  assertExternalAfConfigurationBinding(
    input.afSourceConfiguration,
    input.rhythm.configuration,
  );
}

function bindingContextFromStepInput(
  input: MainWireIntegratedModelExternalAfStepInputV1,
): MainWireIntegratedModelExternalAfBindingContextV1 {
  return Object.freeze({
    afSourceConfiguration: input.afSourceConfiguration,
    rhythm: input.rhythm,
    dynamicMechanicalSupportProfile: input.dynamicMechanicalSupport.profile,
    dynamicMechanicalSupportConfig: input.dynamicMechanicalSupport.config,
  });
}

function assertCompleteAfCandidateBatch(
  trial: AcceptedAfAtrialSourceTrialV1,
  candidateTimeSec: number,
  nextSourceActivationTimeSec: number,
): void {
  const expectedImpulseCount =
    candidateTimeSec === nextSourceActivationTimeSec ? 1 : 0;
  if (
    trial.candidateTimeSec !== candidateTimeSec ||
    trial.processedSourceImpulseCount !== expectedImpulseCount ||
    trial.sourceImpulses.length !== expectedImpulseCount ||
    trial.sourceImpulses.some(
      (impulse) =>
        impulse.activationTimeSec !== candidateTimeSec ||
        impulse.chamber !== "atrial" ||
        impulse.sourceKind !== "primary-intrinsic" ||
        impulse.parentCapturedActivationId !== null,
    )
  ) {
    throw new Error(
      "external-AF owner trial did not produce the complete candidate-time atrial batch",
    );
  }
}

function assertIdentityRollback<TWallState>(
  previous: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
  afSourceTrial: AcceptedAfAtrialSourceTrialV1,
  integratedFailure: MainWireIntegratedModelStepFailureV3<TWallState>,
): void {
  if (
    rollbackAcceptedAfAtrialSourceTrialV1(previous.afSource, afSourceTrial) !==
      previous.afSource ||
    integratedFailure.rollbackState !== previous.integratedModel
  ) {
    throw new Error(
      "external-AF integrated failure did not preserve both accepted owner identities",
    );
  }
}

function failure<TWallState>(
  previous: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
  reason: MainWireIntegratedModelExternalAfStepFailureReasonV1,
  message: string,
  details: Readonly<{
    afSourceTrial?: AcceptedAfAtrialSourceTrialV1;
    integratedModelFailure?: MainWireIntegratedModelStepFailureV3<TWallState>;
    maximumStep?: MainWireIntegratedModelExternalAfMaximumStepV1;
  }>,
): MainWireIntegratedModelExternalAfStepFailureV1<TWallState> {
  return Object.freeze({
    converged: false as const,
    reason,
    message,
    rollbackState: previous,
    ...(details.afSourceTrial === undefined
      ? {}
      : { afSourceTrial: details.afSourceTrial }),
    ...(details.integratedModelFailure === undefined
      ? {}
      : { integratedModelFailure: details.integratedModelFailure }),
    ...(details.maximumStep === undefined
      ? {}
      : { maximumStep: details.maximumStep }),
    afSourceCommitted: false as const,
    integratedModelCommitted: false as const,
  });
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be positive finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function safeFutureTime(
  acceptedTimeSec: number,
  stepSec: number,
  field: string,
): number {
  const future = acceptedTimeSec + stepSec;
  if (!Number.isFinite(future) || !(future > acceptedTimeSec)) {
    throw new Error(`${field} must advance to a finite time`);
  }
  return future;
}

function clockTolerance(timeSec: number, stepSec: number): number {
  return 64 * Number.EPSILON * Math.max(1, Math.abs(timeSec), stepSec);
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  field: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    throw new Error(`${field} contains a non-string key`);
  }
  const actual = (keys as string[]).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
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

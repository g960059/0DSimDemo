import type {
  NonCoronaryAcceptedNumericalSourceV1,
  NonCoronaryBackwardEulerScratchWorkspaceV1,
  NonCoronaryDynamicMechanicalSupportInputV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import type {
  CoronaryBackwardEulerScratchWorkspaceV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  fullHotPathInvariantsEnabledV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  validationStampIssuanceEligibleV1,
  validationStampReuseEligibleV1,
} from "@/engine/validationStampModeV1";
import {
  createDynamicMechanicalSupportAcceptedStateV1,
  validateDynamicMechanicalSupportAcceptedStateV1,
  validateDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportHydraulicEvaluationV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  mechanicalSupportConservationToleranceMlPerSecV1,
  mechanicalSupportNodeRatesAreConservativeV1,
} from "@/engine/devices/mechanicalSupportConservationV1";
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
import { evaluateExactEventCalciumV1 } from
  "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  commitAcceptedComposedRhythmTransactionCandidateV2,
  createNoExternalAtrialSourceBatchV2,
  evaluateAcceptedComposedRhythmTransactionCandidateV2,
  limitAcceptedComposedRhythmTransactionCandidateTimeV2,
  validateAcceptedComposedRhythmTransactionConfigurationV2,
  validateAcceptedComposedRhythmTransactionBoundaryV2,
  validateAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionCandidateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionCandidateTimeLimitV2,
  type AcceptedComposedRhythmTransactionStateV2,
  type ComposedRhythmExternalAtrialSourceBatchV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { canonicalJsonStringify } from "@/engine/integrity";
import type {
  WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID =
  "main-wire-base-coronary-v3-dynamic-mcs-composed-rhythm-transaction-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_CLAIM_V3 = deepFreeze({
  acceptedTuple:
    "coronary-v3-plus-accepted-composed-rhythm-v2-plus-current-bound-dynamic-mcs-state" as const,
  acceptedTupleValidation:
    "once-per-internally-issued-state-and-exact-frozen-rhythm-profile-config-triple" as const,
  clockTuple: "outer-coronary-and-composed-rhythm-exact" as const,
  commitSemantics:
    "all-owners-promote-once-only-after-composed-rhythm-coronary-and-dynamic-mcs-success" as const,
  rollbackSemantics:
    "all-failures-return-identical-previous-tuple-with-all-flags-false" as const,
  calciumOwnership: Object.freeze({
    soleAcceptedOwner: "AcceptedComposedRhythmTransactionV2" as const,
    mechanicsInput:
      "five-current-exact-event-calcium-states-at-the-same-candidate-time" as const,
    legacyFixedPeriodicOwnerActive: false as const,
    generatedPeriodicOwnerActive: false as const,
    dualCalciumDriveAccepted: false as const,
    coronaryCalciumDriveOverride:
      "privately-injected-once-by-this-transaction" as const,
    legacyCalciumParameterObjectRole:
      "material-compatibility-and-periodic-window-duration-only-not-a-live-calcium-source" as const,
  }),
  maximumStepOrder:
    "coronary-window-cap-before-composed-rhythm-owned-and-external-boundary-search" as const,
  eventBoundary:
    "open-start-closed-end-complete-same-time-rhythm-and-calcium-batches" as const,
  sameCandidateTime:
    "composed-rhythm-calcium-coronary-mechanics-circulation-and-dynamic-mcs" as const,
  dynamicMcsAcceptedBinding:
    "complete-inertance-profile-snapshot-and-structural-hydraulic-projection" as const,
  phaseIabpClock: Object.freeze({
    userAuthoredHeartRateAccepted: false as const,
    regularSinusHeartRate:
      "derived-from-composed-rhythm-cycle-length" as const,
    externalAfOrNonSinusWhenIabpEnabled:
      "rejected-until-accepted-ventricular-event-triggered-owner-is-integrated" as const,
  }),
  algebraicMechanicalSupportAccepted: false as const,
  fixedGlobalBloodVolumeConservationInheritedFromCoronaryV3: true as const,
  dynamicMcsNodeRateConservationRequired: true as const,
  externalAfSeam: Object.freeze({
    typedSourceBatchPreserved: true as const,
    afOwnerStateOwnedHere: false as const,
    afWrapperIntegrated: true as const,
    wrapperTransactionId:
      "main-wire-integrated-model-external-af-wrapper-transaction-v1" as const,
    browserSessionPathIntegrated: false as const,
    coordinatedAfAtrialCalciumClaimed: false as const,
    coordinatedAfAtrialCalciumBlockerScope:
      "separate-standing-limitation-not-owner-wrapper-or-joint-checkpoint" as const,
  }),
  proximalAvGateV2DirectlyOwnedByComposedRhythm: true as const,
  releaseBlockers: Object.freeze({
    afOwnerWrapperAndJointCheckpoint: "closed" as const,
    iabpAcceptedVentricularSynchronization: "open" as const,
  }),
  checkpointOwnedHere: false as const,
  longTermPhysiologicalValidationEstablished: false as const,
  releaseReady: false as const,
  clinicalValidationClaimed: false as const,
});

export type MainWireIntegratedComposedRhythmContextV3 = Readonly<{
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
}>;

export type MainWireIntegratedComposedRhythmBoundaryContextV3 =
  MainWireIntegratedComposedRhythmContextV3 & Readonly<{
    /** Required only in external-AF mode; that owner remains outside V3. */
    externalAfNextBoundaryTimeSec: number | null;
  }>;

export type MainWireIntegratedComposedRhythmStepContextV3 =
  MainWireIntegratedComposedRhythmBoundaryContextV3 & Readonly<{
    /** Null in regular mode; explicit owner-produced batch in external-AF mode. */
    externalAtrialSourceBatch:
      ComposedRhythmExternalAtrialSourceBatchV2 | null;
  }>;

export type MainWireIntegratedDynamicMechanicalSupportContextV3 = Readonly<{
  config: MechanicalSupportConfigV1;
  profile: DynamicMechanicalSupportInertanceProfileV1;
}>;

export type MainWireIntegratedDynamicMechanicalSupportInitializeV3 =
  MainWireIntegratedDynamicMechanicalSupportContextV3 & Readonly<{
    initialAcceptedFlowMlPerSec?: Readonly<Record<
      RotarySupportDeviceIdV1,
      number
    >>;
  }>;

export type MainWireIntegratedModelAcceptedStateV3<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID;
  revision: number;
  acceptedTimeSec: number;
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>;
  composedRhythm: AcceptedComposedRhythmTransactionStateV2;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
}>;

type MainWireIntegratedModelValidationStampV3<TWallState> = Readonly<{
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>;
  rhythmConfiguration:
    AcceptedComposedRhythmTransactionConfigurationV2;
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1;
  dynamicConfig: MechanicalSupportConfigV1;
}>;

export type MainWireIntegratedConstructorFaultForTestV1 =
  | "outer-accepted-time-ahead-of-owners"
  | "dynamic-candidate-nan-flow";

let constructorFaultForTestV1:
  MainWireIntegratedConstructorFaultForTestV1 | null = null;

/**
 * Synchronously injects one constructor-output defect for a regression test.
 * The callback scope and non-nesting guard prevent the fault from leaking into
 * another transaction or an asynchronous continuation.
 */
export function withMainWireIntegratedConstructorFaultForTestV1<T>(
  fault: MainWireIntegratedConstructorFaultForTestV1,
  body: () => T,
): T {
  if (constructorFaultForTestV1 !== null) {
    throw new Error("integrated constructor fault injection cannot nest");
  }
  constructorFaultForTestV1 = fault;
  try {
    const result = body();
    if (
      typeof result === "object"
      && result !== null
      && "then" in result
    ) {
      throw new Error("integrated constructor fault injection must be synchronous");
    }
    return result;
  } finally {
    constructorFaultForTestV1 = null;
  }
}

/**
 * Only internally constructed accepted states receive entries here.
 * A hit requires the exact rhythm-configuration, dynamic-profile, and
 * dynamic-config object triple, and entries are created only when all three
 * graphs are transitively frozen plain data. Replacing any member of the triple
 * misses; changing one in place is impossible after the stamp is created.
 * Deserialised and hand-built states have no entry and each exported boundary
 * either performs complete validation or observes this exact private
 * constructor/context stamp. This proof is independent of the hot-path tier.
 */
const internalValidationStampsByAcceptedStateV3 = new WeakMap<
  object,
  readonly MainWireIntegratedModelValidationStampV3<unknown>[]
>();

export type MainWireIntegratedModelCoronaryInitializeInputV3<TWallState> =
  Omit<
    MainWireFiveWallCoronaryInitializeInputV3<TWallState>,
    "calciumDriveOverride" | "mechanicalSupport" | "dynamicMechanicalSupport"
  >;

export type MainWireIntegratedModelInitializeInputV3<TWallState> = Readonly<{
  coronary: MainWireIntegratedModelCoronaryInitializeInputV3<TWallState>;
  rhythm: MainWireIntegratedComposedRhythmContextV3 & Readonly<{
    acceptedState: AcceptedComposedRhythmTransactionStateV2;
  }>;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportInitializeV3;
}>;

export type MainWireIntegratedModelColdResultV3<TWallState> = Readonly<{
  acceptedState: MainWireIntegratedModelAcceptedStateV3<TWallState>;
  coronaryCold: MainWireFiveWallCoronaryColdResultV3<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
}>;

export type MainWireIntegratedModelCoronaryStepInputV3 = Omit<
  MainWireFiveWallCoronaryStepInputV3,
  | "dtSec"
  | "calciumDriveOverride"
  | "mechanicalSupport"
  | "dynamicMechanicalSupport"
>;

export type MainWireIntegratedModelStepInputV3 = Readonly<{
  candidateTimeSec: number;
  coronary: MainWireIntegratedModelCoronaryStepInputV3;
  rhythm: MainWireIntegratedComposedRhythmStepContextV3;
  dynamicMechanicalSupport:
    MainWireIntegratedDynamicMechanicalSupportContextV3;
}>;

export type MainWireIntegratedModelCandidateTimeLimitV3 = Readonly<{
  requestedCandidateTimeSec: number;
  coronaryWindowMaximumStepSec: number;
  coronaryCappedEndTimeSec: number;
  rhythm: AcceptedComposedRhythmTransactionCandidateTimeLimitV2;
  candidateTimeSec: number;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
  coronaryWindowAndRhythmBoundaryTie: boolean;
}>;

export type MainWireIntegratedModelStepSuccessV3<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireIntegratedModelAcceptedStateV3<TWallState>;
  coronaryStep: MainWireFiveWallCoronaryStepSuccessV3<TWallState>;
  composedRhythmCandidate: AcceptedComposedRhythmTransactionCandidateV2;
  dynamicMechanicalSupportTrial:
    DynamicMechanicalSupportHydraulicEvaluationV1;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  candidateTimeLimit: MainWireIntegratedModelCandidateTimeLimitV3;
  mechanicsCommitted: true;
  circulationCommitted: true;
  coronaryCommitted: true;
  mvcReferenceCommitted: true;
  autoregulationCommitted: true;
  composedRhythmCommitted: true;
  dynamicMechanicalSupportCommitted: true;
}>;

export type MainWireIntegratedModelStepFailureReasonV3 =
  | "outer-input-clock-binding-or-boundary-rejected"
  | "coronary-v3-candidate-failed"
  | "integrated-promotion-rejected";

export type MainWireIntegratedModelStepFailureV3<TWallState> = Readonly<{
  converged: false;
  reason: MainWireIntegratedModelStepFailureReasonV3;
  message: string;
  rollbackState: MainWireIntegratedModelAcceptedStateV3<TWallState>;
  coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
  composedRhythmCandidate?: AcceptedComposedRhythmTransactionCandidateV2;
  candidateTimeLimit?: MainWireIntegratedModelCandidateTimeLimitV3;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
  autoregulationCommitted: false;
  composedRhythmCommitted: false;
  dynamicMechanicalSupportCommitted: false;
}>;

export type MainWireIntegratedModelStepResultV3<TWallState> =
  | MainWireIntegratedModelStepSuccessV3<TWallState>
  | MainWireIntegratedModelStepFailureV3<TWallState>;

export function initializeMainWireIntegratedModelV3<TWallState>(
  input: MainWireIntegratedModelInitializeInputV3<TWallState>,
): MainWireIntegratedModelColdResultV3<TWallState> {
  assertExactKeys(input, [
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "composed integrated cold input");
  assertRhythmInitializeContext(input.rhythm);
  assertDynamicInitializeContext(input.dynamicMechanicalSupport);
  dynamicMechanicalSupportHeartRateBpm(
    input.rhythm.configuration,
    input.dynamicMechanicalSupport.config,
  );
  rejectExternallyOwnedColdInputs(input.coronary);
  assertCoronaryColdInput(input.coronary);
  validateAcceptedComposedRhythmTransactionBoundaryV2(
    input.rhythm.acceptedState,
  );
  assertExpectedRhythmConfiguration(
    input.rhythm.acceptedState,
    input.rhythm.configuration,
  );
  const coldTimeSec = input.coronary.timeSec ?? 0;
  if (
    input.rhythm.acceptedState.revision !== 0
    || input.rhythm.acceptedState.acceptedTimeSec !== coldTimeSec
  ) {
    throw new Error(
      "composed integrated cold rhythm must own one revision-zero clock",
    );
  }
  assertColdRhythmCoronaryWindowPolicy(
    input.rhythm.acceptedState,
    input.coronary.calciumDriveParams.cycleLengthSec,
    input.coronary.autoregulationWindow,
  );
  const calciumDrive = calciumDriveFromComposedState(
    input.rhythm.acceptedState,
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
  const acceptedState = wrapInternalMainWireIntegratedModelAcceptedStateV3(
    coronaryCold.acceptedState,
    input.rhythm.acceptedState,
    dynamicMechanicalSupport,
    { configuration: input.rhythm.configuration },
    input.dynamicMechanicalSupport.profile,
    input.dynamicMechanicalSupport.config,
  );
  return Object.freeze({ acceptedState, coronaryCold, calciumDrive });
}

/** Coronary window cap is resolved before composed rhythm event discovery. */
export function limitMainWireIntegratedModelCandidateTimeV3<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  requestedCandidateTimeSec: number,
  rhythm: MainWireIntegratedComposedRhythmBoundaryContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelCandidateTimeLimitV3 {
  validateMainWireIntegratedBoundaryV3(
    previous,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  return limitMainWireIntegratedModelCandidateTimeFromValidatedStateV3(
    previous,
    requestedCandidateTimeSec,
    rhythm,
  );
}

function limitMainWireIntegratedModelCandidateTimeFromValidatedStateV3<
  TWallState,
>(
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  requestedCandidateTimeSec: number,
  rhythm: MainWireIntegratedComposedRhythmBoundaryContextV3,
): MainWireIntegratedModelCandidateTimeLimitV3 {
  assertRhythmBoundaryContext(rhythm);
  const requestedCandidateTime = requireNonnegativeFinite(
    requestedCandidateTimeSec,
    "requestedCandidateTimeSec",
  );
  if (!(requestedCandidateTime > previous.acceptedTimeSec)) {
    throw new Error("composed integrated requested endpoint must advance");
  }
  const requestedStepSec =
    requestedCandidateTime - previous.acceptedTimeSec;
  const coronaryWindowMaximumStepSec =
    maximumMainWireFiveWallCoronaryStepDurationV3(previous.coronary);
  const tolerance = clockTolerance(
    previous.acceptedTimeSec,
    requestedStepSec,
  );
  const clippedByCoronaryWindow =
    coronaryWindowMaximumStepSec < requestedStepSec - tolerance;
  const coronaryCappedEndTimeSec = clippedByCoronaryWindow
    ? previous.acceptedTimeSec + coronaryWindowMaximumStepSec
    : requestedCandidateTime;
  if (!(coronaryCappedEndTimeSec > previous.acceptedTimeSec)) {
    throw new Error("composed integrated coronary-capped step must be positive");
  }
  const rhythmLimit = limitAcceptedComposedRhythmTransactionCandidateTimeV2(
    previous.composedRhythm,
    coronaryCappedEndTimeSec,
    rhythm.externalAfNextBoundaryTimeSec,
  );
  const candidateTimeSec = rhythmLimit.candidateTimeSec;
  const boundaryTime = rhythmLimit.boundaryTimeSec;
  return Object.freeze({
    requestedCandidateTimeSec: requestedCandidateTime,
    coronaryWindowMaximumStepSec,
    coronaryCappedEndTimeSec,
    rhythm: rhythmLimit,
    candidateTimeSec,
    clippedByCoronaryWindow,
    clippedByRhythmBoundary:
      boundaryTime !== null
      && boundaryTime < coronaryCappedEndTimeSec - tolerance,
    rhythmBoundaryTimeSec: boundaryTime,
    rhythmBoundaryOwners: rhythmLimit.boundaryOwners,
    coronaryWindowAndRhythmBoundaryTie:
      boundaryTime !== null
      && boundaryTime === coronaryCappedEndTimeSec
      && coronaryWindowMaximumStepSec <= requestedStepSec + tolerance,
  });
}

export function stepMainWireIntegratedModelV3<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  input: MainWireIntegratedModelStepInputV3,
  coronaryScratchWorkspace?: CoronaryBackwardEulerScratchWorkspaceV2,
  nonCoronaryScratchWorkspace?:
    NonCoronaryBackwardEulerScratchWorkspaceV1,
  previousAcceptedNumericalSource?: NonCoronaryAcceptedNumericalSourceV1,
): MainWireIntegratedModelStepResultV3<TWallState> {
  let candidateTimeLimit:
    MainWireIntegratedModelCandidateTimeLimitV3 | undefined;
  let composedRhythmCandidate:
    AcceptedComposedRhythmTransactionCandidateV2 | undefined;
  let coronaryStep: MainWireFiveWallCoronaryStepResultV3<TWallState> | undefined;
  try {
    assertStepInput(input);
    validateMainWireIntegratedBoundaryV3(
      previous,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    assertAcceptedRhythmCoronaryWindowPolicy(
      previous.composedRhythm,
      previous.coronary.coronaryAutoregulationBinding.windowPolicy,
      input.coronary.calciumDriveParams.cycleLengthSec,
    );
    candidateTimeLimit =
      limitMainWireIntegratedModelCandidateTimeFromValidatedStateV3(
        previous,
        input.candidateTimeSec,
        {
          configuration: input.rhythm.configuration,
          externalAfNextBoundaryTimeSec:
            input.rhythm.externalAfNextBoundaryTimeSec,
        },
      );
    if (candidateTimeLimit.candidateTimeSec !== input.candidateTimeSec) {
      throw new RangeError(
        "composed integrated step crosses a coronary or rhythm boundary",
      );
    }
    const candidateTimeSec = candidateTimeLimit.candidateTimeSec;
    const candidateDtSec = candidateTimeSec - previous.acceptedTimeSec;
    const externalAtrialSourceBatch = externalBatchForCandidate(
      previous,
      input.rhythm,
      candidateTimeSec,
    );
    composedRhythmCandidate =
      evaluateAcceptedComposedRhythmTransactionCandidateV2(
        previous.composedRhythm,
        { candidateTimeSec, externalAtrialSourceBatch },
      );
    const calciumDrive = calciumDriveFromComposedState(
      composedRhythmCandidate.candidateState,
    );
    const dynamicMechanicalSupport = Object.freeze({
      config: input.dynamicMechanicalSupport.config,
      heartRateBpm: dynamicMechanicalSupportHeartRateBpm(
        input.rhythm.configuration,
        input.dynamicMechanicalSupport.config,
      ),
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
      coronaryScratchWorkspace,
      nonCoronaryScratchWorkspace,
      previousAcceptedNumericalSource,
    );
    if (coronaryStep.converged === false) {
      return failure(
        previous,
        "coronary-v3-candidate-failed",
        coronaryStep.message,
        { coronaryStep, composedRhythmCandidate, candidateTimeLimit },
      );
    }
    const dynamicTrial = coronaryStep.baseStep.circulationTrial
      .dynamicMechanicalSupport;
    if (dynamicTrial === undefined) {
      throw new Error("coronary candidate omitted dynamic MCS readback");
    }
    if (!mechanicalSupportNodeRatesAreConservativeV1(
      dynamicTrial.nodeNetVolumeRateMlPerSec,
      dynamicTrial.conservationResidualMlPerSec,
    )) {
      const toleranceMlPerSec =
        mechanicalSupportConservationToleranceMlPerSecV1(
          dynamicTrial.nodeNetVolumeRateMlPerSec,
        );
      throw new Error(
        "dynamic MCS node-rate conservation residual "
          + `${dynamicTrial.conservationResidualMlPerSec} mL/s exceeds `
          + `the scale-aware ${toleranceMlPerSec} mL/s tolerance`,
      );
    }
    validateDynamicMechanicalSupportAcceptedStateV1(
      dynamicTrial.candidateAcceptedState,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    const composedRhythm =
      commitAcceptedComposedRhythmTransactionCandidateV2(
        previous.composedRhythm,
        composedRhythmCandidate,
      );
    const acceptedState = wrapInternalMainWireIntegratedModelAcceptedStateV3(
      coronaryStep.acceptedState,
      composedRhythm,
      dynamicTrial.candidateAcceptedState,
      input.rhythm,
      input.dynamicMechanicalSupport.profile,
      input.dynamicMechanicalSupport.config,
    );
    return Object.freeze({
      converged: true as const,
      acceptedState,
      coronaryStep,
      composedRhythmCandidate,
      dynamicMechanicalSupportTrial: dynamicTrial,
      calciumDrive,
      candidateTimeLimit,
      mechanicsCommitted: true as const,
      circulationCommitted: true as const,
      coronaryCommitted: true as const,
      mvcReferenceCommitted: true as const,
      autoregulationCommitted: true as const,
      composedRhythmCommitted: true as const,
      dynamicMechanicalSupportCommitted: true as const,
    });
  } catch (error) {
    return failure(
      previous,
      coronaryStep?.converged === true
        ? "integrated-promotion-rejected"
        : "outer-input-clock-binding-or-boundary-rejected",
      error instanceof Error ? error.message : String(error),
      { coronaryStep, composedRhythmCandidate, candidateTimeLimit },
    );
  }
}

export function validateMainWireIntegratedModelAcceptedStateV3<TWallState>(
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  rhythm: MainWireIntegratedComposedRhythmContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): void {
  assertRhythmContext({ configuration: rhythm.configuration });
  validateDynamicMechanicalSupportInertanceProfileV1(dynamicProfile);
  validateMechanicalSupportConfigV1(dynamicConfig);
  assertExactKeys(state, [
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "coronary",
    "composedRhythm",
    "dynamicMechanicalSupport",
  ], "composed integrated accepted state");
  if (state.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID) {
    throw new Error("composed integrated accepted state identity mismatch");
  }
  requireNonnegativeInteger(state.revision, "state.revision");
  requireNonnegativeFinite(state.acceptedTimeSec, "state.acceptedTimeSec");
  validateMainWireFiveWallCoronaryAcceptedStateV3(state.coronary);
  validateAcceptedComposedRhythmTransactionBoundaryV2(state.composedRhythm);
  assertExpectedRhythmConfiguration(
    state.composedRhythm,
    rhythm.configuration,
  );
  validateDynamicMechanicalSupportAcceptedStateV1(
    state.dynamicMechanicalSupport,
    dynamicProfile,
    dynamicConfig,
  );
  assertAcceptedRhythmCoronaryWindowPolicy(
    state.composedRhythm,
    state.coronary.coronaryAutoregulationBinding.windowPolicy,
    state.coronary.coronaryAutoregulationBinding.windowPolicy.durationSec,
    false,
  );
  if (
    state.coronary.revision !== state.revision
    || state.composedRhythm.revision !== state.revision
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || state.composedRhythm.acceptedTimeSec !== state.acceptedTimeSec
  ) {
    throw new Error("composed integrated accepted owner clocks differ");
  }
}

/**
 * Re-admits one accepted state at the next model-owned transaction boundary.
 * Internally constructed states may reuse their exact private state/context
 * proof; restored, copied, hand-built, context-rebound, and stamp-disabled
 * states still take the complete exported validator above.
 *
 * This is deliberately a read-only proof consumer. It cannot mint validation
 * provenance for an arbitrary state.
 */
export function validateMainWireIntegratedModelAcceptedBoundaryV3<TWallState>(
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  rhythm: MainWireIntegratedComposedRhythmContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): void {
  validateMainWireIntegratedBoundaryV3(
    state,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
}

export function wrapMainWireIntegratedModelAcceptedStateV3<TWallState>(
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
  composedRhythm: AcceptedComposedRhythmTransactionStateV2,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
  rhythm: MainWireIntegratedComposedRhythmContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelAcceptedStateV3<TWallState> {
  const state = constructMainWireIntegratedModelAcceptedStateV3(
    coronary,
    composedRhythm,
    dynamicMechanicalSupport,
  );
  validateMainWireIntegratedModelAcceptedStateV3(
    state,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  return state;
}

function wrapInternalMainWireIntegratedModelAcceptedStateV3<TWallState>(
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
  composedRhythm: AcceptedComposedRhythmTransactionStateV2,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
  rhythm: MainWireIntegratedComposedRhythmContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelAcceptedStateV3<TWallState> {
  const state = constructMainWireIntegratedModelAcceptedStateV3(
    coronary,
    composedRhythm,
    dynamicMechanicalSupport,
  );
  if (fullHotPathInvariantsEnabledV1()) {
    validateMainWireIntegratedModelAcceptedStateV3(
      state,
      rhythm,
      dynamicProfile,
      dynamicConfig,
    );
  }
  // Lean narrows only the immediate re-proof of this private wrapper output.
  // Its three owner states were produced/accepted by their owning transactions,
  // and this constructor derives the outer identity and clocks directly from
  // them. Exported wraps, restored/hand-built states, and a different context
  // triple still take complete validation; only this exact state/context stamp
  // can be reused.
  stampInternalMainWireIntegratedModelValidationV3(Object.freeze({
    state,
    rhythmConfiguration: rhythm.configuration,
    dynamicProfile,
    dynamicConfig,
  }));
  return state;
}

function constructMainWireIntegratedModelAcceptedStateV3<TWallState>(
  coronary: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
  composedRhythm: AcceptedComposedRhythmTransactionStateV2,
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1,
): MainWireIntegratedModelAcceptedStateV3<TWallState> {
  const acceptedTimeSec =
    constructorFaultForTestV1 === "outer-accepted-time-ahead-of-owners"
      ? coronary.acceptedTimeSec + 0.001
      : coronary.acceptedTimeSec;
  const publishedDynamicMechanicalSupport =
    constructorFaultForTestV1 === "dynamic-candidate-nan-flow"
      ? Object.freeze({
        ...dynamicMechanicalSupport,
        acceptedFlowMlPerSec: Object.freeze({
          ...dynamicMechanicalSupport.acceptedFlowMlPerSec,
          LVAD: Number.NaN,
        }),
      }) as DynamicMechanicalSupportAcceptedStateV1
      : dynamicMechanicalSupport;
  const state = Object.freeze({
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
    revision: coronary.revision,
    acceptedTimeSec,
    coronary,
    composedRhythm,
    dynamicMechanicalSupport: publishedDynamicMechanicalSupport,
  });
  return state;
}

function validateMainWireIntegratedBoundaryV3<TWallState>(
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  rhythm: MainWireIntegratedComposedRhythmContextV3,
  dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicConfig: MechanicalSupportConfigV1,
): void {
  const existing = internalValidationStampsByAcceptedStateV3.get(state) as
    | readonly MainWireIntegratedModelValidationStampV3<TWallState>[]
    | undefined;
  const matching = validationStampReuseEligibleV1()
    ? existing?.find((stamp) =>
      stamp.rhythmConfiguration === rhythm.configuration
      && stamp.dynamicProfile === dynamicProfile
      && stamp.dynamicConfig === dynamicConfig)
    : undefined;
  if (matching !== undefined) return;

  validateMainWireIntegratedModelAcceptedStateV3(
    state,
    rhythm,
    dynamicProfile,
    dynamicConfig,
  );
  // A state enters the reusable cache only through the private internal wrap.
  // Once there, an additional fully validated frozen context triple is safe to
  // remember as well (for example, an equivalent external wrapper context).
  if (existing !== undefined) {
    stampInternalMainWireIntegratedModelValidationV3(Object.freeze({
      state,
      rhythmConfiguration: rhythm.configuration,
      dynamicProfile,
      dynamicConfig,
    }));
  }
}

function stampInternalMainWireIntegratedModelValidationV3<TWallState>(
  stamp: MainWireIntegratedModelValidationStampV3<TWallState>,
): void {
  if (!validationStampIssuanceEligibleV1(
    stamp.rhythmConfiguration,
    stamp.dynamicProfile,
    stamp.dynamicConfig,
  )) {
    return;
  }
  const existing =
    internalValidationStampsByAcceptedStateV3.get(stamp.state) ?? [];
  if (existing.some((candidate) =>
    candidate.rhythmConfiguration === stamp.rhythmConfiguration
    && candidate.dynamicProfile === stamp.dynamicProfile
    && candidate.dynamicConfig === stamp.dynamicConfig)) {
    return;
  }
  internalValidationStampsByAcceptedStateV3.set(
    stamp.state,
    Object.freeze([
      ...existing,
      stamp as MainWireIntegratedModelValidationStampV3<unknown>,
    ]),
  );
}

export function evaluateMainWireIntegratedModelCalciumDriveV3(
  state: AcceptedComposedRhythmTransactionStateV2,
): MainWireFiveWallFreeCalciumDriveV1 {
  validateAcceptedComposedRhythmTransactionStateV2(state);
  return calciumDriveFromComposedState(state);
}

function calciumDriveFromComposedState(
  state: AcceptedComposedRhythmTransactionStateV2,
): MainWireFiveWallFreeCalciumDriveV1 {
  const values = Object.fromEntries(
    (["LA", "LVFW", "SEP", "RVFW", "RA"] as const).map((wall) => [
      wall,
      evaluateExactEventCalciumV1(
        state.calciumStateByWall[wall],
        state.configuration.calciumParametersByWall[wall],
      ).freeCalciumUM,
    ]),
  ) as MainWireFiveWallFreeCalciumDriveV1["freeCalciumUMByWall"];
  return Object.freeze({ freeCalciumUMByWall: Object.freeze(values) });
}

function externalBatchForCandidate<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  rhythm: MainWireIntegratedComposedRhythmStepContextV3,
  candidateTimeSec: number,
): ComposedRhythmExternalAtrialSourceBatchV2 {
  if (previous.composedRhythm.configuration.atrialSource.mode === "regular") {
    if (
      rhythm.externalAfNextBoundaryTimeSec !== null
      || rhythm.externalAtrialSourceBatch !== null
    ) {
      throw new Error("regular composed rhythm rejects external AF inputs");
    }
    return createNoExternalAtrialSourceBatchV2(candidateTimeSec);
  }
  if (rhythm.externalAtrialSourceBatch === null) {
    throw new Error("external AF mode requires an explicit typed source batch");
  }
  return rhythm.externalAtrialSourceBatch;
}

function failure<TWallState>(
  previous: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  reason: MainWireIntegratedModelStepFailureReasonV3,
  message: string,
  details: Readonly<{
    coronaryStep?: MainWireFiveWallCoronaryStepResultV3<TWallState>;
    composedRhythmCandidate?: AcceptedComposedRhythmTransactionCandidateV2;
    candidateTimeLimit?: MainWireIntegratedModelCandidateTimeLimitV3;
  }>,
): MainWireIntegratedModelStepFailureV3<TWallState> {
  return Object.freeze({
    converged: false as const,
    reason,
    message,
    rollbackState: previous,
    ...(details.coronaryStep === undefined
      ? {}
      : { coronaryStep: details.coronaryStep }),
    ...(details.composedRhythmCandidate === undefined
      ? {}
      : { composedRhythmCandidate: details.composedRhythmCandidate }),
    ...(details.candidateTimeLimit === undefined
      ? {}
      : { candidateTimeLimit: details.candidateTimeLimit }),
    mechanicsCommitted: false as const,
    circulationCommitted: false as const,
    coronaryCommitted: false as const,
    mvcReferenceCommitted: false as const,
    autoregulationCommitted: false as const,
    composedRhythmCommitted: false as const,
    dynamicMechanicalSupportCommitted: false as const,
  });
}

function assertStepInput(input: MainWireIntegratedModelStepInputV3): void {
  assertExactKeys(input, [
    "candidateTimeSec",
    "coronary",
    "rhythm",
    "dynamicMechanicalSupport",
  ], "composed integrated step input");
  requireNonnegativeFinite(input.candidateTimeSec, "input.candidateTimeSec");
  assertRhythmStepContext(input.rhythm);
  assertDynamicContext(input.dynamicMechanicalSupport);
  rejectExternallyOwnedStepInputs(input.coronary);
  assertCoronaryStepInput(input.coronary);
}

function assertRhythmContext(
  context: MainWireIntegratedComposedRhythmContextV3,
): void {
  assertExactKeys(context, ["configuration"], "composed rhythm context");
  validateAcceptedComposedRhythmTransactionConfigurationV2(
    context.configuration,
  );
}

function assertRhythmBoundaryContext(
  context: MainWireIntegratedComposedRhythmBoundaryContextV3,
): void {
  assertExactKeys(
    context,
    ["configuration", "externalAfNextBoundaryTimeSec"],
    "composed rhythm boundary context",
  );
  // The exact configuration object is covered by the validation proof passed
  // to the only caller. Re-running its deep validator here would recreate the
  // accepted-tuple validation subtree this transaction deliberately removes.
}

function assertRhythmStepContext(
  context: MainWireIntegratedComposedRhythmStepContextV3,
): void {
  assertExactKeys(
    context,
    [
      "configuration",
      "externalAfNextBoundaryTimeSec",
      "externalAtrialSourceBatch",
    ],
    "composed rhythm step context",
  );
  assertRhythmContext({ configuration: context.configuration });
}

function assertRhythmInitializeContext(
  context: MainWireIntegratedComposedRhythmContextV3 & Readonly<{
    acceptedState: AcceptedComposedRhythmTransactionStateV2;
  }>,
): void {
  assertExactKeys(
    context,
    ["configuration", "acceptedState"],
    "composed integrated cold rhythm context",
  );
  assertRhythmContext({ configuration: context.configuration });
}

function assertDynamicContext(
  context: MainWireIntegratedDynamicMechanicalSupportContextV3,
): void {
  assertExactKeys(context, [
    "config",
    "profile",
  ], "composed integrated dynamic MCS context");
  validateMechanicalSupportConfigV1(context.config);
  validateDynamicMechanicalSupportInertanceProfileV1(context.profile);
}

function assertDynamicInitializeContext(
  context: MainWireIntegratedDynamicMechanicalSupportInitializeV3,
): void {
  assertAllowedKeys(context, [
    "config",
    "profile",
    "initialAcceptedFlowMlPerSec",
  ], "composed integrated dynamic MCS cold context");
  assertDynamicContext({
    config: context.config,
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
    "provider", "runtime", "calciumDriveParams", "pericardium",
    "coronaryInitial", "coronaryPrior", "coronaryDisease",
    "collapseHydraulics", "impMechanism", "shorteningImpPrior",
    "fixedGlobalTotalBloodVolumeMl", "timeSec", "autoregulationWindow",
  ], "composed integrated coronary cold input");
  requireOwnKeys(input, [
    "provider", "runtime", "calciumDriveParams", "pericardium",
  ], "composed integrated coronary cold input");
}

function assertCoronaryStepInput(input: object): void {
  assertAllowedKeys(input, [
    "runtime", "calciumDriveParams", "pericardium", "coronaryPrior",
    "coronaryDisease", "collapseHydraulics", "impMechanism",
    "shorteningImpPrior", "coronarySolverOptions",
    "circulationNewtonOptions", "protocolResistanceScaleByEdge",
    "coronaryAutoregulationDrive", "evaluationCounterCollection",
  ], "composed integrated coronary step input");
  requireOwnKeys(input, [
    "runtime", "calciumDriveParams", "pericardium",
  ], "composed integrated coronary step input");
}

function rejectExternallyOwnedColdInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error(
      "composed integrated cold rejects a second calciumDriveOverride",
    );
  }
  if (
    Object.hasOwn(input, "mechanicalSupport")
    || Object.hasOwn(input, "dynamicMechanicalSupport")
  ) {
    throw new Error("composed integrated cold rejects embedded MCS inputs");
  }
}

function rejectExternallyOwnedStepInputs(input: object): void {
  if (Object.hasOwn(input, "calciumDriveOverride")) {
    throw new Error(
      "composed integrated step rejects a second calciumDriveOverride",
    );
  }
  if (Object.hasOwn(input, "mechanicalSupport")) {
    throw new Error(
      "integrated V3 transaction rejects algebraic mechanicalSupport",
    );
  }
  if (Object.hasOwn(input, "dynamicMechanicalSupport")) {
    throw new Error("composed integrated step owns dynamicMechanicalSupport");
  }
}

function assertColdRhythmCoronaryWindowPolicy(
  rhythm: AcceptedComposedRhythmTransactionStateV2,
  coronaryCalciumCycleLengthSec: number,
  requestedWindow: Readonly<{
    durationSec?: number;
    interpretation?:
      | "periodic-sinus-cycle-aligned"
      | "irregular-rhythm-stationary";
  }> | undefined,
): void {
  const irregularRequired = composedRhythmRequiresIrregularWindow(rhythm);
  if (
    irregularRequired
    && requestedWindow?.interpretation !== "irregular-rhythm-stationary"
  ) {
    throw new Error(
      "flutter, external AF, or authored ectopy requires an explicit irregular-rhythm-stationary coronary window",
    );
  }
  const interpretation = requestedWindow?.interpretation
    ?? "periodic-sinus-cycle-aligned";
  if (interpretation === "periodic-sinus-cycle-aligned") {
    const cycle = regularSinusCycleLength(rhythm);
    if (cycle === null || cycle !== coronaryCalciumCycleLengthSec) {
      throw new Error(
        "periodic sinus rhythm period and coronary calcium cycle differ",
      );
    }
    if (
      requestedWindow?.durationSec !== undefined
      && requestedWindow.durationSec !== cycle
    ) {
      throw new Error(
        "periodic sinus coronary window duration must equal the rhythm cycle",
      );
    }
  }
}

function assertAcceptedRhythmCoronaryWindowPolicy(
  rhythm: AcceptedComposedRhythmTransactionStateV2,
  windowPolicy: Readonly<{
    interpretation:
      | "periodic-sinus-cycle-aligned"
      | "irregular-rhythm-stationary";
    durationSec: number;
  }>,
  coronaryCalciumCycleLengthSec: number,
  checkLegacyCycle = true,
): void {
  if (
    composedRhythmRequiresIrregularWindow(rhythm)
    && windowPolicy.interpretation !== "irregular-rhythm-stationary"
  ) {
    throw new Error(
      "accepted composed rhythm requires an irregular coronary window",
    );
  }
  if (windowPolicy.interpretation === "periodic-sinus-cycle-aligned") {
    const cycle = regularSinusCycleLength(rhythm);
    if (
      cycle === null
      || windowPolicy.durationSec !== cycle
      || (checkLegacyCycle && coronaryCalciumCycleLengthSec !== cycle)
    ) {
      throw new Error("accepted periodic sinus coronary window is inconsistent");
    }
  }
}

function composedRhythmRequiresIrregularWindow(
  state: AcceptedComposedRhythmTransactionStateV2,
): boolean {
  return state.configuration.atrialSource.mode !== "regular"
    || state.configuration.atrialSource.regularSourceConfiguration.rhythmClass
      !== "sinus"
    || state.configuration.authoredEctopySchedule.eventCount > 0
    || (state.configuration.authoredVentricularPacingReplay?.eventCount ?? 0)
      > 0;
}

function regularSinusCycleLength(
  state: AcceptedComposedRhythmTransactionStateV2,
): number | null {
  const source = state.configuration.atrialSource;
  return source.mode === "regular"
      && source.regularSourceConfiguration.rhythmClass === "sinus"
    ? source.regularSourceConfiguration.cycleLengthSec
    : null;
}

function dynamicMechanicalSupportHeartRateBpm(
  rhythm: AcceptedComposedRhythmTransactionConfigurationV2,
  config: MechanicalSupportConfigV1,
): number {
  const atrialSource = rhythm.atrialSource;
  if (atrialSource.mode === "regular") {
    if (
      config.iabp.enabled
      && atrialSource.regularSourceConfiguration.rhythmClass !== "sinus"
    ) {
      throw new Error(
        "phase-derived IABP requires regular sinus rhythm until an "
          + "accepted ventricular event-triggered owner is integrated",
      );
    }
    return 60
      / atrialSource.regularSourceConfiguration.cycleLengthSec;
  }
  if (config.iabp.enabled) {
    throw new Error(
      "phase-derived IABP is unavailable for external AF until an accepted "
        + "ventricular event-triggered owner is integrated",
    );
  }
  // The circulation contract still carries a scalar, but disabled IABP never
  // consumes it. No user-authored heart-rate value can enter this lane.
  return 60;
}

function assertExpectedRhythmConfiguration(
  state: AcceptedComposedRhythmTransactionStateV2,
  expected: AcceptedComposedRhythmTransactionConfigurationV2,
): void {
  if (state.configuration === expected) {
    // Both callers validate the state and expected context before reaching this
    // comparison. Exact identity is therefore the complete equality proof for
    // the lane-owned frozen constant and avoids using canonical JSON as an
    // equality operator. Different boundary objects retain the deep path.
    return;
  }
  validateAcceptedComposedRhythmTransactionConfigurationV2(expected);
  if (
    canonicalJsonStringify(state.configuration)
      !== canonicalJsonStringify(expected)
  ) {
    throw new Error("composed integrated rhythm configuration mismatch");
  }
}

function clockTolerance(timeSec: number, dtSec: number): number {
  return 64 * Number.EPSILON
    * Math.max(1, Math.abs(timeSec), Math.abs(dtSec));
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative integer`);
  }
  return value;
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  field: string,
): void {
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== "string")) {
    throw new Error(`${field} contains a non-string key`);
  }
  const actualStrings = (actual as string[]).sort();
  const expectedStrings = [...expected].sort();
  if (
    actualStrings.length !== expectedStrings.length
    || actualStrings.some((key, index) => key !== expectedStrings[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function assertAllowedKeys(
  value: object,
  allowed: readonly string[],
  field: string,
): void {
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) =>
      typeof key !== "string" || !allowed.includes(key))
  ) {
    throw new Error(`${field} contains an unsupported field`);
  }
}

function requireOwnKeys(
  value: object,
  required: readonly string[],
  field: string,
): void {
  for (const key of required) {
    if (!Object.hasOwn(value, key)) {
      throw new Error(`${field} is missing ${key}`);
    }
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

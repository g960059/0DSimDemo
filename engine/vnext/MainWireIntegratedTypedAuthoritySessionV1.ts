import { respiratoryExternalPressuresV1 } from "@/engine/core/circulationGraphKernelV1";
import { fullHotPathInvariantsEnabledV1 } from "@/engine/hotPathIntegrityTierV1";
import type {
  AcceptedStateAuthorityV1,
  AcceptedStateValidatorV1,
} from "@/engine/core/acceptedStateAuthorityV1";
import { restoreDynamicMechanicalSupportAcceptedStateV1 } from "@/engine/devices/dynamicNetworkV1";
import {
  createCoronaryBackwardEulerScratchWorkspaceV2,
  type CoronaryBackwardEulerScratchWorkspaceV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  createNonCoronaryBackwardEulerScratchWorkspaceV1,
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  type NonCoronaryAcceptedNumericalSourceV1,
  type NonCoronaryBackwardEulerScratchWorkspaceV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { buildCoronaryTopologyV2 } from "@/engine/coronary/topologyPriorV2";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  createMainWireFiveWallCoupledResidualWorkspaceV1,
  type MainWireFiveWallCoupledResidualWorkspaceV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type {
  CoronaryAcceptedAutoregulationStateV3,
  CoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  advanceMainWireFiveWallCoronaryAutoregulationOwnerFromPackedV3,
  advanceMainWireFiveWallCoronaryAutoregulationFromPackedV3,
  mainWireFiveWallCoronaryBaseStateV2,
  type MainWireFiveWallCoronaryAutoregulationAcceptedOwnerV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
  projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1,
  type MainWireIntegratedModelOutputIdV3,
  type MainWireIntegratedModelOutputValueV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  createMainWireIntegratedModelRuntimeV3,
  mainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM,
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
  type MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRelaxationProfileV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3,
  type MainWireIntegratedModelObservationV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
  type MainWireIntegratedModelSubstepRecordV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  checkpointMainWireIntegratedModelStandardV2,
  restoreMainWireIntegratedModelStandardV2,
  type MainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  validateMainWireIntegratedModelAcceptedBoundaryV3,
  validateMainWireIntegratedModelAcceptedStateV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmStepContextV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepFailureReasonV3,
  type MainWireIntegratedModelStepResultV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { warmStartMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type { MainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  decodeCanonicalFlatCheckpointV1,
  encodeCanonicalFlatDataIntoV1,
  encodeCanonicalFlatCheckpointV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  createMainWireAcceptedTypedBoundaryBindingV1,
  createMainWireAcceptedTypedNonCoronaryNumericalSourceV1,
  limitMainWireAcceptedTypedCandidateTimeV1,
  readMainWireAcceptedTypedClockV1,
  readMainWireAcceptedTypedPresentationStateV1,
  stageMainWireAcceptedTypedAuthoredScheduleCandidateV1,
  stageMainWireAcceptedTypedCalciumCandidateV1,
  stageMainWireAcceptedTypedClockCandidateV1,
  stageMainWireAcceptedTypedContinuousOwnerCandidateV1,
  stageMainWireAcceptedTypedOrdinaryPostSolverCandidateV1,
  stageMainWireAcceptedTypedRegularAtrialCandidateV1,
  stageMainWireAcceptedTypedResolvedCandidateV1,
  type MainWireAcceptedTypedBoundaryBindingV1,
  type MainWireAcceptedTypedClockV1,
} from "@/engine/vnext/MainWireAcceptedTypedBoundaryV1";
import {
  MainWireAcceptedTypedStateAuthorityV1,
  type MainWireAcceptedTypedStateAuthorityReportV1,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import {
  bindExecutionPlanAcceptedTypedStateV1,
  type ExecutionPlanAcceptedTypedStateBindingV1,
} from "@/engine/vnext/ExecutionPlanAcceptedTypedStateBindingV1";
import type { BoundExecutionPlanV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  createMainWireAcceptedTypedHemodynamicBindingV1,
  createMainWireAcceptedTypedHemodynamicDestinationV1,
  materializeMainWireAcceptedTypedCoupledSolverAdapterV1,
  readMainWireAcceptedTypedHemodynamicIntoV1,
  stageMainWireAcceptedTypedCoupledCandidateV1,
  type MainWireAcceptedTypedHemodynamicBindingV1,
} from "@/engine/vnext/MainWireAcceptedTypedHemodynamicV1";
import {
  assertMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  createMainWireFiveWallCoupledNewtonShadowWorkspaceV1,
  type MainWireFiveWallCoupledNewtonShadowWorkspaceV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  checkpointMainWireFiveWallCoupledPredictorV1,
  createMainWireFiveWallCoupledPredictorWorkspaceV1,
  recordAcceptedMainWireFiveWallCoupledSolutionV1,
  reportMainWireFiveWallCoupledPredictorV1,
  resetMainWireFiveWallCoupledPredictorV1,
  restoreMainWireFiveWallCoupledPredictorV1,
  type MainWireFiveWallCoupledPredictorCheckpointV2,
  type MainWireFiveWallCoupledPredictorReportV1,
  type MainWireFiveWallCoupledPredictorWorkspaceV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import {
  solveMainWireFiveWallCoupledCandidateV1,
  stepMainWireIntegratedModelCoupledV1,
} from "@/engine/vnext/coupled/MainWireIntegratedCoupledStepV1";
import type {
  TransactionalTypedStateCandidateCursorV1,
  TransactionalTypedStateCompletionPlanV1,
  TransactionalTypedStateCurrentCursorV1,
  TransactionalTypedStatePromotionPlanV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";
import {
  MainWireSelectedAorticPortSessionExtensionV1,
  type MainWireSelectedAorticPortSessionTicketV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

export const MAIN_WIRE_INTEGRATED_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-typed-authority-session-v1" as const;
export const MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_CHECKPOINT_V2_ID =
  "circleheart-main-wire-flat-authoritative-reference-checkpoint-v2" as const;

type MainWireFlatAuthoritativeReferenceCheckpointV2 = Readonly<{
  checkpointId: typeof MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  standardCheckpoint: MainWireIntegratedModelStandardCheckpointV2;
  coupledPredictor: MainWireFiveWallCoupledPredictorCheckpointV2;
}>;

export type MainWireFlatCoupledSolverProfileV1 = Readonly<{
  solveCount: number;
  convergedSolveCount: number;
  iterationCount: number;
  residualEvaluationCount: number;
  jacobianEvaluationCount: number;
  lineSearchBacktrackCount: number;
  jacobianResidualEvaluationCount: number;
}>;

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;
type SessionRuntime =
  | MainWireIntegratedModelRuntimeV3
  | MainWireIntegratedModelSelectedAorticOutflowFixtureV1;
type AdvanceFailureReason =
  | MainWireIntegratedModelStepFailureReasonV3
  | "substep-budget-exhausted"
  | "candidate-time-did-not-advance";

export type MainWireFlatReferenceAcceptedStateAuthorityFactoryV1 = (
  initialState: AcceptedState,
  validate: AcceptedStateValidatorV1<AcceptedState>,
  ownDecoded: AcceptedStateValidatorV1<AcceptedState>,
  admitCompletedMirror: AcceptedStateValidatorV1<AcceptedState>,
) => AcceptedStateAuthorityV1<AcceptedState>;

type WithoutObservation<T> =
  T extends Readonly<{ observation: unknown }> ? Omit<T, "observation"> : T;

export type MainWireFlatModelOwnedProjectionAdvanceV1 =
  WithoutObservation<MainWireIntegratedModelPresentationAdvanceV3>;

export type MainWireFlatSelectedOutputProjectionAdvanceV1 = Readonly<{
  advance: MainWireFlatModelOwnedProjectionAdvanceV1;
  projectedValues: ReturnType<
    typeof projectMainWireIntegratedModelSelectedValuesV3
  > | null;
  outputProjectionDurationMs: number;
}>;

type ExactBeatState = Readonly<{
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

export type MainWireTypedExecutionPlanInitializationV1 = Readonly<{
  boundExecutionPlan: BoundExecutionPlanV1;
  coupledNewtonWorkspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1;
}>;

type MainWireExecutionPlanStateInitializationV1 = Readonly<{
  acceptedStateBinding: ExecutionPlanAcceptedTypedStateBindingV1;
  hemodynamicBinding: MainWireAcceptedTypedHemodynamicBindingV1;
}>;

function createExecutionPlanStateInitializationV1(
  boundExecutionPlan: BoundExecutionPlanV1,
  typedAuthority: MainWireAcceptedTypedStateAuthorityV1 | null,
): MainWireExecutionPlanStateInitializationV1 {
  if (typedAuthority === null) {
    throw new Error(
      "Main Wire execution plan requires typed accepted-state authority",
    );
  }
  const acceptedStateBinding = bindExecutionPlanAcceptedTypedStateV1(
    boundExecutionPlan,
    typedAuthority.manifest(),
  );
  return Object.freeze({
    acceptedStateBinding,
    hemodynamicBinding: createMainWireAcceptedTypedHemodynamicBindingV1(
      typedAuthority.manifest(),
      acceptedStateBinding,
    ),
  });
}

/**
 * Typed-authority Session for the integrated model. It owns the accepted
 * transaction loop and avoids materializing the public accepted object on
 * each ordinary presentation tick.
 *
 * The component solver still exposes a compact private adapter and a
 * synchronous selected-root borrow. Strictly ordinary lean-tier projection
 * ticks stage that borrow and the remaining continuous owners directly into
 * the inactive typed image, then promote it without public-state finalization.
 * Event/full-invariant transactions retain the independent public path.
 * Public rehydration is reserved for observations, checkpoints, restores,
 * analysis, and those cold/event boundaries. This is an authority/runtime
 * cutover over the established equations, not a different physiological
 * model.
 */
export class MainWireIntegratedTypedAuthoritySessionV1 {
  readonly sessionId = MAIN_WIRE_INTEGRATED_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #runtime: SessionRuntime;
  readonly #provider: MainWireNormalAdultFiveWallProviderV1;
  readonly #rhythmInput: MainWireIntegratedComposedRhythmStepContextV3;
  readonly #dynamicMechanicalSupportConfig: MainWireIntegratedModelRuntimeV3["config"];
  readonly #authority: AcceptedStateAuthorityV1<AcceptedState>;
  readonly #typedAuthority: MainWireAcceptedTypedStateAuthorityV1 | null;
  readonly #typedBoundaryBinding: MainWireAcceptedTypedBoundaryBindingV1 | null;
  #typedHemodynamicBinding: MainWireAcceptedTypedHemodynamicBindingV1 | null;
  readonly #typedHemodynamicScratch: Float64Array;
  readonly #acceptedNumericalReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  readonly #candidateNumericalReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  #acceptedNumericalReadbackAvailable = false;
  #coupledNewtonWorkspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1;
  #installedExecutionPlanCoupledNewtonWorkspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1 | null =
    null;
  #installedExecutionPlan: BoundExecutionPlanV1 | null = null;
  #executionPlanAcceptedTypedStateBinding: ExecutionPlanAcceptedTypedStateBindingV1 | null =
    null;
  #executionPlanWorkspaceInstallationClosed = false;
  readonly #coupledResidualWorkspace: MainWireFiveWallCoupledResidualWorkspaceV1;
  readonly #coupledPredictorWorkspace: MainWireFiveWallCoupledPredictorWorkspaceV1;
  readonly #nonCoronaryAcceptedNumericalSource:
    NonCoronaryAcceptedNumericalSourceV1 | undefined;
  readonly #directCompletionPlan: TransactionalTypedStateCompletionPlanV1 | null;
  readonly #modelOwnedPromotionPlan: TransactionalTypedStatePromotionPlanV1 | null;
  readonly #coronaryScratchWorkspace: CoronaryBackwardEulerScratchWorkspaceV2;
  readonly #nonCoronaryScratchWorkspace: NonCoronaryBackwardEulerScratchWorkspaceV1;
  readonly #coupledAcceptedAdapterTemplate: ReturnType<
    typeof mainWireFiveWallCoronaryBaseStateV2<WallState>
  >;
  #autoregulationOwner: MainWireFiveWallCoronaryAutoregulationAcceptedOwnerV3;
  #acceptedState: AcceptedState;
  #lastAcceptedStep: SuccessfulStep | null;
  #lastPresentationObservation: MainWireIntegratedModelObservationV3 | null;
  #lastPresentationSource: MainWireIntegratedModelObservationV3["source"];
  #lastPresentationRevision: number;
  #beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  #completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  readonly #selectedAorticPortExtension:
    MainWireSelectedAorticPortSessionExtensionV1 | null;
  #terminalPoison: Error | null = null;
  readonly #coupledSolverProfile = {
    solveCount: 0,
    convergedSolveCount: 0,
    iterationCount: 0,
    residualEvaluationCount: 0,
    jacobianEvaluationCount: 0,
    lineSearchBacktrackCount: 0,
    jacobianResidualEvaluationCount: 0,
  };

  protected constructor(
    runtime: SessionRuntime,
    acceptedState: AcceptedState,
    observationSource: MainWireIntegratedModelObservationV3["source"],
    authorityFactory: MainWireFlatReferenceAcceptedStateAuthorityFactoryV1 | null,
    exactBeatState?: ExactBeatState,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    selectedAorticPortExtension:
      MainWireSelectedAorticPortSessionExtensionV1 | null = null,
  ) {
    const validateAcceptedState: AcceptedStateValidatorV1<AcceptedState> = (
      candidate,
    ) => {
      const acceptedCandidate = candidate as AcceptedState;
      validateMainWireIntegratedModelAcceptedStateV3(
        acceptedCandidate,
        { configuration: runtime.rhythm.configuration },
        runtime.profile,
        runtime.config,
      );
      return acceptedCandidate;
    };
    const ownDecodedAcceptedState: AcceptedStateValidatorV1<AcceptedState> = (
      candidate,
    ) => {
      const decoded = candidate as AcceptedState;
      const dynamicMechanicalSupport =
        restoreDynamicMechanicalSupportAcceptedStateV1(
          decoded.dynamicMechanicalSupport,
          runtime.cold.acceptedState.dynamicMechanicalSupport,
        );
      return wrapMainWireIntegratedModelAcceptedStateV3(
        decoded.coronary,
        decoded.composedRhythm,
        dynamicMechanicalSupport,
        { configuration: runtime.rhythm.configuration },
        runtime.profile,
        runtime.config,
      );
    };
    const admitCompletedMirror: AcceptedStateValidatorV1<AcceptedState> = (
      candidate,
    ) => {
      const acceptedCandidate = candidate as AcceptedState;
      validateMainWireIntegratedModelAcceptedBoundaryV3(
        acceptedCandidate,
        { configuration: runtime.rhythm.configuration },
        runtime.profile,
        runtime.config,
      );
      return acceptedCandidate;
    };
    const selectedRuntimeMarker =
      hasSelectedAorticOutflowRuntimeMarkerV1(runtime);
    const selectedRuntime = isSelectedAorticOutflowRuntimeV1(runtime);
    if (selectedRuntimeMarker && !selectedRuntime) {
      throw new Error(
        "selected aortic runtime marker does not match the fixed assembly",
      );
    }
    if (selectedAorticPortExtension !== null && !selectedRuntime) {
      throw new Error(
        "selected aortic Session extension requires typed authority and the fixed selected runtime",
      );
    }
    if (selectedRuntime && selectedAorticPortExtension === null) {
      throw new Error(
        "fixed selected aortic runtime requires its Session extension owner",
      );
    }
    validateAcceptedState(acceptedState);
    this.#runtime = runtime;
    this.#provider = runtime.provider;
    this.#coronaryScratchWorkspace =
      createCoronaryBackwardEulerScratchWorkspaceV2(
        buildCoronaryTopologyV2(runtime.coronaryStepInput.coronaryPrior),
      );
    this.#nonCoronaryScratchWorkspace =
      createNonCoronaryBackwardEulerScratchWorkspaceV1();
    this.#coupledAcceptedAdapterTemplate = mainWireFiveWallCoronaryBaseStateV2(
      acceptedState.coronary,
    );
    this.#autoregulationOwner =
      autoregulationOwnerFromAcceptedState(acceptedState);
    this.#rhythmInput = Object.freeze({
      configuration: runtime.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    });
    this.#dynamicMechanicalSupportConfig = runtime.config;
    this.#authority = (
      authorityFactory ?? typedAuthorityFactory(runtime.cold.acceptedState)
    )(
      acceptedState,
      validateAcceptedState,
      ownDecodedAcceptedState,
      admitCompletedMirror,
    );
    this.#typedAuthority =
      this.#authority instanceof MainWireAcceptedTypedStateAuthorityV1
        ? this.#authority
        : null;
    if (
      selectedAorticPortExtension !== null
      && this.#typedAuthority === null
    ) {
      throw new Error(
        "selected aortic Session extension requires typed authority and the fixed selected runtime",
      );
    }
    if (selectedAorticPortExtension !== null) {
      if (selectedAorticPortExtension.acceptedReadbackClockV1() !== null) {
        throw new Error(
          "selected aortic Session extension must start without instantaneous accepted readback",
        );
      }
    }
    this.#selectedAorticPortExtension = selectedAorticPortExtension;
    this.#typedBoundaryBinding =
      this.#typedAuthority === null
        ? null
        : createMainWireAcceptedTypedBoundaryBindingV1(
            this.#typedAuthority.manifest(),
          );
    const executionPlanStateInitialization =
      executionPlanInitialization === undefined
        ? null
        : createExecutionPlanStateInitializationV1(
            executionPlanInitialization.boundExecutionPlan,
            this.#typedAuthority,
          );
    this.#typedHemodynamicBinding =
      this.#typedAuthority === null
        ? null
        : (executionPlanStateInitialization?.hemodynamicBinding ??
          createMainWireAcceptedTypedHemodynamicBindingV1(
            this.#typedAuthority.manifest(),
          ));
    if (
      executionPlanStateInitialization !== null &&
      executionPlanInitialization !== undefined
    ) {
      this.#installedExecutionPlan =
        executionPlanInitialization.boundExecutionPlan;
      this.#executionPlanAcceptedTypedStateBinding =
        executionPlanStateInitialization.acceptedStateBinding;
    }
    this.#typedHemodynamicScratch =
      createMainWireAcceptedTypedHemodynamicDestinationV1();
    this.#coupledNewtonWorkspace =
      executionPlanInitialization?.coupledNewtonWorkspace ??
      createMainWireFiveWallCoupledNewtonShadowWorkspaceV1();
    if (executionPlanInitialization !== undefined) {
      this.installExecutionPlanCoupledNewtonWorkspaceV1(
        executionPlanInitialization.coupledNewtonWorkspace,
        executionPlanInitialization.boundExecutionPlan,
      );
    }
    this.#coupledResidualWorkspace =
      createMainWireFiveWallCoupledResidualWorkspaceV1();
    this.#coupledPredictorWorkspace =
      createMainWireFiveWallCoupledPredictorWorkspaceV1();
    this.#nonCoronaryAcceptedNumericalSource =
      this.#typedAuthority === null || this.#typedBoundaryBinding === null
        ? undefined
        : createMainWireAcceptedTypedNonCoronaryNumericalSourceV1(
            this.#typedAuthority.currentCursor(),
            this.#typedBoundaryBinding,
          );
    const directRetainedContinuousSlots =
      this.#typedBoundaryBinding === null
        ? Object.freeze([])
        : Object.freeze(
            Array.from(
              new Set([
                ...this.#typedBoundaryBinding.directContinuousSlots,
                ...(runtime.rhythm.configuration
                  .authoredVentricularPacingReplay === null
                  ? []
                  : this.#typedBoundaryBinding
                      .authoredVentricularPacingContinuousSlots),
                ...(runtime.rhythm.configuration.atrialSource.mode === "regular"
                  ? this.#typedBoundaryBinding
                      .regularAtrialSourceContinuousSlots
                  : []),
                ...this.#typedBoundaryBinding.postSolverContinuousSlots,
                ...(this.#typedHemodynamicBinding
                  ?.solverRetainedContinuousSlots ?? []),
              ]),
            ),
          );
    this.#directCompletionPlan =
      this.#typedAuthority === null
        ? null
        : this.#typedAuthority.createDirectCompletionPlan({
            continuous: directRetainedContinuousSlots,
            booleans:
              this.#typedHemodynamicBinding?.solverRetainedBooleanSlots ?? [],
          });
    this.#modelOwnedPromotionPlan =
      this.#typedAuthority === null
        ? null
        : this.#typedAuthority.createModelOwnedPromotionPlan({
            continuous: directRetainedContinuousSlots,
            booleans:
              this.#typedHemodynamicBinding?.solverRetainedBooleanSlots ?? [],
            strings:
              this.#typedHemodynamicBinding === null
                ? []
                : [
                    this.#typedHemodynamicBinding
                      .mechanicsMaterialFingerprintStringSlot,
                  ],
          });
    this.#acceptedState = this.#authority.current();
    this.#lastAcceptedStep = null;
    this.#beatAccumulator =
      exactBeatState?.beatAccumulator ??
      new MainWireIntegratedModelBeatAccumulatorV3();
    this.#completedBeatMetrics = exactBeatState?.completedBeatMetrics ?? null;
    if (selectedAorticPortExtension !== null) {
      assertSynchronizedSelectedAorticBeatRestoreV1(
        acceptedState.acceptedTimeSec,
        this.#beatAccumulator,
        this.#completedBeatMetrics,
        selectedAorticPortExtension,
      );
    }
    this.#lastPresentationSource = observationSource;
    this.#lastPresentationRevision = acceptedState.revision;
    this.#lastPresentationObservation = observation(
      observationSource,
      this.#authority.snapshot(),
      null,
      runtime,
      this.#completedBeatMetrics,
    );
  }

  static async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedTypedAuthoritySessionV1> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    return new MainWireIntegratedTypedAuthoritySessionV1(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      typedAuthorityFactory(runtime.cold.acceptedState),
      undefined,
      executionPlanInitialization,
    );
  }

  /**
   * Restores the public Standard checkpoint into the typed accepted-state
   * authority. Predictor history is deliberately empty: this checkpoint does
   * not encode it, so the first ordinary solve restarts from the model-owned
   * context seed before rebuilding admitted history.
   */
  static async restoreStandardExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedTypedAuthoritySessionV1> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const restored = await restoreMainWireIntegratedModelStandardV2(
      mainWireIntegratedModelCheckpointContextV3(
        runtime,
        runtime.cold.acceptedState,
      ),
      checkpoint,
    );
    return new MainWireIntegratedTypedAuthoritySessionV1(
      runtime,
      restored.acceptedState,
      "standard-exact-checkpoint-restore",
      typedAuthorityFactory(runtime.cold.acceptedState),
      restored,
      executionPlanInitialization,
    );
  }

  /** Test-only failure seam kept entirely outside the registered model. */
  static async createWithAcceptedStateAuthorityForTestV1(
    authorityFactory: MainWireFlatReferenceAcceptedStateAuthorityFactoryV1,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedTypedAuthoritySessionV1> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    return new MainWireIntegratedTypedAuthoritySessionV1(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      authorityFactory,
    );
  }

  static async restoreCanonicalBinary(
    checkpointBytes: Uint8Array,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
  ): Promise<MainWireIntegratedTypedAuthoritySessionV1> {
    const checkpoint = validateReferenceCheckpointV2(
      await decodeCanonicalFlatCheckpointV1(checkpointBytes),
    );
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const restored = await restoreMainWireIntegratedModelStandardV2(
      mainWireIntegratedModelCheckpointContextV3(
        runtime,
        runtime.cold.acceptedState,
      ),
      checkpoint.standardCheckpoint,
    );
    const session = new MainWireIntegratedTypedAuthoritySessionV1(
      runtime,
      restored.acceptedState,
      "standard-exact-checkpoint-restore",
      typedAuthorityFactory(runtime.cold.acceptedState),
      restored,
      executionPlanInitialization,
    );
    restoreMainWireFiveWallCoupledPredictorV1(
      checkpoint.coupledPredictor,
      Object.freeze({
        revision: restored.acceptedState.revision,
        acceptedTimeSec: restored.acceptedState.acceptedTimeSec,
        unknownsMl: coupledUnknownsFromAcceptedStateV1(restored.acceptedState),
      }),
      session.#coupledPredictorWorkspace,
    );
    return session;
  }

  currentAcceptedState(): AcceptedState {
    this.assertSessionUsableV1();
    return this.#authority.snapshot();
  }

  /**
   * Binds compiler-owned state identities before the first synchronization.
   * Repeating the same plan is idempotent; replacing it is fail-closed.
   */
  installExecutionPlanAcceptedStateBindingV1(
    boundExecutionPlan: BoundExecutionPlanV1,
  ): void {
    this.assertSessionUsableV1();
    if (
      this.#installedExecutionPlan === boundExecutionPlan &&
      this.#executionPlanAcceptedTypedStateBinding !== null
    ) {
      return;
    }
    if (
      this.#installedExecutionPlan !== null ||
      this.#executionPlanWorkspaceInstallationClosed
    ) {
      throw new Error("Main Wire execution plan cannot be replaced");
    }
    if (
      this.#typedAuthority === null ||
      this.#typedHemodynamicBinding === null
    ) {
      throw new Error(
        "Main Wire execution plan requires typed accepted-state authority",
      );
    }
    const { acceptedStateBinding, hemodynamicBinding } =
      createExecutionPlanStateInitializationV1(
        boundExecutionPlan,
        this.#typedAuthority,
      );
    if (
      this.#typedHemodynamicBinding.mvcActiveBooleanSlot !==
        hemodynamicBinding.mvcActiveBooleanSlot ||
      this.#typedHemodynamicBinding.canonicalContinuousSlots.some(
        (slot, index) =>
          slot !== hemodynamicBinding.canonicalContinuousSlots[index],
      )
    ) {
      throw new Error(
        "Main Wire execution-plan typed-authority projection drifted",
      );
    }
    this.#installedExecutionPlan = boundExecutionPlan;
    this.#executionPlanAcceptedTypedStateBinding = acceptedStateBinding;
    this.#typedHemodynamicBinding = hemodynamicBinding;
  }

  /**
   * Installs compiler-owned solver scratch before the first numerical advance.
   * Repeating the same binding is idempotent; replacing it is fail-closed.
   */
  installExecutionPlanCoupledNewtonWorkspaceV1(
    workspace: MainWireFiveWallCoupledNewtonShadowWorkspaceV1,
    boundExecutionPlan: BoundExecutionPlanV1,
  ): void {
    this.assertSessionUsableV1();
    assertMainWireFiveWallCoupledNewtonShadowWorkspaceV1(workspace);
    if (
      this.#installedExecutionPlanCoupledNewtonWorkspace === workspace &&
      this.#installedExecutionPlan === boundExecutionPlan
    ) {
      return;
    }
    if (this.#installedExecutionPlan !== boundExecutionPlan) {
      throw new Error(
        "Main Wire execution-plan state binding must be installed first",
      );
    }
    if (
      this.#installedExecutionPlanCoupledNewtonWorkspace !== null ||
      this.#executionPlanWorkspaceInstallationClosed
    ) {
      throw new Error(
        "Main Wire execution-plan Newton workspace cannot be replaced",
      );
    }
    this.#coupledNewtonWorkspace = workspace;
    this.#installedExecutionPlanCoupledNewtonWorkspace = workspace;
  }

  /**
   * Starts a new authored-input epoch at the exact current accepted clock.
   * The new runtime receives a fresh typed authority and predictor history;
   * failure cannot mutate this source Session.
   */
  async warmStartWithHemodynamicResearchInputs(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedTypedAuthoritySessionV1> {
    this.assertSessionUsableV1();
    this.assertLegacySessionOperationAvailableV1("hemodynamic warm start");
    const targetRuntime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const acceptedState = warmStartMainWireIntegratedModelV3({
      source: this.#authority.snapshot(),
      sourceRuntime: this.requiredLegacyRuntimeV1(),
      targetRuntime,
    });
    return new MainWireIntegratedTypedAuthoritySessionV1(
      targetRuntime,
      acceptedState,
      "hemodynamic-input-warm-start",
      typedAuthorityFactory(targetRuntime.cold.acceptedState),
      undefined,
      executionPlanInitialization,
    );
  }

  observe(): MainWireIntegratedModelObservationV3 {
    this.assertSessionUsableV1();
    const cached = this.#lastPresentationObservation;
    if (cached !== null) return cached;
    const detached = this.detachedObservation();
    this.#lastPresentationObservation = detached;
    return detached;
  }

  /**
   * Projects the exact current accepted boundary without forcing the typed
   * ordinary path back through a public accepted-step reconstruction. The
   * cold/restored boundary deliberately falls back to the complete
   * observation until the Session owns a clock-matched numerical readback.
   */
  projectCurrentAcceptedValuesV1(
    outputIds: readonly MainWireIntegratedModelOutputIdV3[],
  ): Readonly<Record<string, MainWireIntegratedModelOutputValueV3>> {
    this.assertSessionUsableV1();
    validateTypedProjectionOutputIds(outputIds);
    if (
      this.#typedAuthority !== null &&
      this.#acceptedNumericalReadbackAvailable
    ) {
      const typedPresentation = readMainWireAcceptedTypedPresentationStateV1(
        this.#typedAuthority.currentCursor(),
        this.requiredTypedBoundaryBinding(),
        this.#rhythmInput.configuration,
      );
      if (
        this.#acceptedNumericalReadback[
          MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
        ] === typedPresentation.acceptedTimeSec
      ) {
        return projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
          Object.freeze({
            acceptedTimeSec: typedPresentation.acceptedTimeSec,
            regularSinusCycleLengthSec:
              typedPresentation.regularSinusCycleLengthSec,
            regularSinusNextActivationTimeSec:
              typedPresentation.regularSinusNextActivationTimeSec,
            dynamicMechanicalSupportLvadFlowMlPerSec:
              typedPresentation.lvadFlowMlPerSec,
            runtimeSignals: runtimeSignalsAtAcceptedTime(
              typedPresentation.acceptedTimeSec,
              this.#runtime,
            ),
            completedBeatMetrics: this.#completedBeatMetrics,
            mechanismResearchInputs: this.#runtime.mechanismResearchInputs,
            acceptedNumericalReadback: this.#acceptedNumericalReadback,
          }),
          outputIds,
        );
      }
    }
    return projectMainWireIntegratedModelSelectedValuesV3(
      this.observe(),
      outputIds,
    );
  }

  /**
   * Advances exactly to one presentation boundary. Boundary-limited solver
   * commits stay internal; typed-image authority commits occur after every
   * accepted substep, not merely after presentation delivery.
   */
  advanceToPresentationTime(
    targetTimeSec: number,
  ): MainWireIntegratedModelPresentationAdvanceV3 {
    this.assertSessionUsableV1();
    this.#executionPlanWorkspaceInstallationClosed = true;
    return this.advanceToPresentationTimeInternal(targetTimeSec, true);
  }

  /**
   * Model-owned output projection seam. The exact solver mirror never escapes:
   * only scalar output records and observation-free advance metadata return. A
   * public observation requested later is rehydrated from typed authority.
   */
  advanceToPresentationTimeWithSelectedOutputProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelOutputIdV3[],
  ): MainWireFlatSelectedOutputProjectionAdvanceV1 {
    this.assertSessionUsableV1();
    this.#executionPlanWorkspaceInstallationClosed = true;
    validateTypedProjectionOutputIds(outputIds);
    const direct = this.tryAdvanceTypedOrdinaryProjectionV1(
      targetTimeSec,
      outputIds,
    );
    if (direct !== null) return direct;
    const result = this.advanceToPresentationTimeInternal(targetTimeSec, false);
    if (!("observation" in result)) {
      return Object.freeze({
        advance: result,
        projectedValues: null,
        outputProjectionDurationMs: 0,
      });
    }
    const projectionStartedAt = performance.now();
    const typedPresentation =
      this.#typedAuthority === null
        ? null
        : readMainWireAcceptedTypedPresentationStateV1(
            this.#typedAuthority.currentCursor(),
            this.requiredTypedBoundaryBinding(),
            this.#rhythmInput.configuration,
          );
    const projectedValues =
      typedPresentation === null
        ? projectMainWireIntegratedModelSelectedValuesV3(
            result.observation,
            outputIds,
          )
        : projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
            Object.freeze({
              acceptedTimeSec: typedPresentation.acceptedTimeSec,
              regularSinusCycleLengthSec:
                typedPresentation.regularSinusCycleLengthSec,
              regularSinusNextActivationTimeSec:
                typedPresentation.regularSinusNextActivationTimeSec,
              dynamicMechanicalSupportLvadFlowMlPerSec:
                typedPresentation.lvadFlowMlPerSec,
              runtimeSignals: result.observation.runtimeSignals,
              completedBeatMetrics: this.#completedBeatMetrics,
              mechanismResearchInputs: this.#runtime.mechanismResearchInputs,
              acceptedNumericalReadback: this.#acceptedNumericalReadback,
            }),
            outputIds,
          );
    const outputProjectionDurationMs = performance.now() - projectionStartedAt;
    const { observation: _trustedObservation, ...withoutObservation } = result;
    return Object.freeze({
      advance: Object.freeze(
        withoutObservation,
      ) as MainWireFlatModelOwnedProjectionAdvanceV1,
      projectedValues,
      outputProjectionDurationMs,
    });
  }

  /**
   * Adapter-free ordinary presentation step. Event and rollover boundaries
   * return null before a candidate opens so the existing public transaction
   * remains their independent authority during migration.
   */
  private tryAdvanceTypedOrdinaryProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelOutputIdV3[],
  ): MainWireFlatSelectedOutputProjectionAdvanceV1 | null {
    if (
      this.#typedAuthority === null ||
      this.#typedHemodynamicBinding === null ||
      fullHotPathInvariantsEnabledV1()
    )
      return null;
    const currentClock = this.currentAcceptedClock();
    if (
      !Number.isFinite(targetTimeSec) ||
      !(targetTimeSec > currentClock.acceptedTimeSec)
    )
      return null;
    const limit = this.limitCandidateTime(targetTimeSec);
    if (
      limit.candidateTimeSec !== targetTimeSec ||
      !isStrictlyOrdinaryTypedCandidate(
        currentClock,
        limit,
        this.#rhythmInput,
        this.#autoregulationOwner,
      )
    )
      return null;

    const binding = this.requiredTypedBoundaryBinding();
    const current = this.#typedAuthority.currentCursor();
    const candidate = this.#typedAuthority.beginDirectCandidate();
    let candidateOpen = true;
    let hemodynamicAuthorityCommitted = false;
    let selectedTicket: MainWireSelectedAorticPortSessionTicketV1 | null = null;
    try {
      const candidateClock = stageMainWireAcceptedTypedClockCandidateV1(
        current,
        candidate,
        binding,
        targetTimeSec,
      );
      const calciumDrive = stageMainWireAcceptedTypedCalciumCandidateV1(
        current,
        candidate,
        binding,
        targetTimeSec,
        this.#rhythmInput.configuration.calciumParametersByWall,
      );
      stageMainWireAcceptedTypedAuthoredScheduleCandidateV1(
        current,
        candidate,
        binding,
        targetTimeSec,
        this.#rhythmInput.configuration,
      );
      stageMainWireAcceptedTypedRegularAtrialCandidateV1(
        current,
        candidate,
        binding,
        targetTimeSec,
        this.#rhythmInput.configuration,
        null,
      );
      const previousAdapter =
        materializeMainWireAcceptedTypedCoupledSolverAdapterV1(
          current,
          this.#typedHemodynamicBinding,
          this.#coupledAcceptedAdapterTemplate,
          this.#typedHemodynamicScratch,
        );
      const autoregulationStepInput = Object.freeze({
        ...this.#runtime.coronaryStepInput,
        dtSec: targetTimeSec - currentClock.acceptedTimeSec,
        calciumDriveOverride: calciumDrive,
      });
      const solved = solveMainWireFiveWallCoupledCandidateV1(
        this.#provider,
        previousAdapter,
        autoregulationStepInput,
        this.#coupledNewtonWorkspace,
        Object.freeze({
          residualWorkspace: this.#coupledResidualWorkspace,
          previousAcceptedNumericalSource:
            this.#nonCoronaryAcceptedNumericalSource,
          predictor: Object.freeze({
            workspace: this.#coupledPredictorWorkspace,
            order: "cubic" as const,
          }),
        }),
      );
      const profiledSolverResult = solved.solver.result;
      this.#coupledSolverProfile.solveCount += 1;
      this.#coupledSolverProfile.iterationCount +=
        profiledSolverResult.iterations;
      this.#coupledSolverProfile.residualEvaluationCount +=
        profiledSolverResult.residualEvaluationCount;
      this.#coupledSolverProfile.jacobianEvaluationCount +=
        profiledSolverResult.jacobianEvaluationCount;
      this.#coupledSolverProfile.lineSearchBacktrackCount +=
        profiledSolverResult.lineSearchBacktrackCount;
      this.#coupledSolverProfile.jacobianResidualEvaluationCount +=
        solved.solver.jacobianResidualEvaluationCount;
      if (profiledSolverResult.status === "converged") {
        this.#coupledSolverProfile.convergedSolveCount += 1;
      }
      if (solved.status === "failed") {
        const failure = solved.solver.result;
        if (failure.status !== "failed") {
          throw new Error("typed ordinary coupled solve status drifted");
        }
        throw new Error(
          "typed ordinary coupled solve failed: " +
            `${failure.reason}: ${failure.message}`,
        );
      }
      const solverResult = solved.solver.result;
      if (solverResult.status !== "converged") {
        throw new Error("typed ordinary converged solve status drifted");
      }
      let nextAutoregulationOwner: MainWireFiveWallCoronaryAutoregulationAcceptedOwnerV3 | null =
        null;
      let borrowed = false;
      solved.context.withConvergedCandidate(
        solverResult.solution,
        (candidateBorrow) => {
          borrowed = true;
          stageMainWireAcceptedTypedCoupledCandidateV1(
            candidate,
            this.#typedHemodynamicBinding!,
            candidateBorrow,
            this.#typedHemodynamicScratch,
          );
          this.#candidateNumericalReadback.set(
            candidateBorrow.acceptedNumericalReadback,
          );
          if (this.#selectedAorticPortExtension !== null) {
            if (candidateBorrow.selectedAorticValveReadback === undefined) {
              throw new Error(
                "selected aortic ordinary candidate readback is unavailable",
              );
            }
            selectedTicket =
              this.#selectedAorticPortExtension.stageCandidateV1({
                expectedCandidateTimeSec: candidateClock.acceptedTimeSec,
                expectedCandidateRevision: candidateClock.revision,
                candidateTimeSec: candidateBorrow.candidateTimeSec,
                candidateRevision: candidateBorrow.candidateRevision,
                historicalAcceptedNumericalReadback:
                  candidateBorrow.acceptedNumericalReadback,
                selectedAorticValveReadback:
                  candidateBorrow.selectedAorticValveReadback,
              });
          }
          const regulation =
            advanceMainWireFiveWallCoronaryAutoregulationOwnerFromPackedV3(
              this.#autoregulationOwner,
              autoregulationStepInput,
              candidateBorrow.candidateTimeSec,
              candidateBorrow.candidateRevision,
              candidateBorrow.coronaryAutoregulationHydraulicObservables,
            );
          if (
            regulation.completedWindow !== null ||
            !autoregulationControlsUnchanged(
              this.#autoregulationOwner.state,
              regulation.nextState,
            ) ||
            regulation.hydraulicToneUsed !==
              this.#autoregulationOwner.toneResistanceScaleByTerritoryLayer ||
            regulation.nextToneResistanceScaleByTerritoryLayer !==
              this.#autoregulationOwner.toneResistanceScaleByTerritoryLayer
          ) {
            throw new Error(
              "typed ordinary autoregulation crossed a discrete boundary",
            );
          }
          stageMainWireAcceptedTypedOrdinaryPostSolverCandidateV1(
            current,
            candidate,
            binding,
            candidateClock,
            regulation.nextState,
          );
          nextAutoregulationOwner = Object.freeze({
            ...this.#autoregulationOwner,
            acceptedTimeSec: candidateBorrow.candidateTimeSec,
            state: regulation.nextState,
          });
        },
      );
      if (!borrowed || nextAutoregulationOwner === null) {
        throw new Error("typed ordinary candidate borrow is unavailable");
      }
      let trialBeatAccumulator: MainWireIntegratedModelBeatAccumulatorV3 | null =
        null;
      let trialCompletedBeatMetrics:
        MainWireIntegratedModelCompletedBeatMetricsV3 | null = null;
      if (this.#selectedAorticPortExtension !== null) {
        if (selectedTicket === null) {
          throw new Error("selected aortic ordinary candidate ticket is missing");
        }
        trialBeatAccumulator = MainWireIntegratedModelBeatAccumulatorV3.restore(
          this.#beatAccumulator.checkpoint(),
        );
        trialCompletedBeatMetrics =
          trialBeatAccumulator.acceptNumericalReadback(
            this.#candidateNumericalReadback,
            null,
          );
      }
      const acceptedRevisionSpanFromPrevious =
        candidateClock.revision - this.#lastPresentationRevision;
      if (acceptedRevisionSpanFromPrevious < 1) {
        throw new Error("typed ordinary accepted revision did not advance");
      }
      this.#typedAuthority.commitModelOwnedTypedCandidate(
        this.requiredModelOwnedPromotionPlan(),
      );
      candidateOpen = false;
      hemodynamicAuthorityCommitted = true;
      if (this.#selectedAorticPortExtension !== null) {
        selectedTicket!.promote({
          committedAcceptedTimeSec: candidateClock.acceptedTimeSec,
          committedRevision: candidateClock.revision,
          capturedAtrialActivationId: null,
          baseCompletedBeatMetrics: trialCompletedBeatMetrics,
        });
        this.#beatAccumulator = trialBeatAccumulator!;
        this.#completedBeatMetrics =
          trialCompletedBeatMetrics ?? this.#completedBeatMetrics;
        this.#acceptedNumericalReadback.set(this.#candidateNumericalReadback);
        this.#acceptedNumericalReadbackAvailable = true;
      }
      recordAcceptedMainWireFiveWallCoupledSolutionV1(
        solved.context,
        solverResult.solution,
        this.#coupledPredictorWorkspace,
      );
      this.#autoregulationOwner = nextAutoregulationOwner;
      if (this.#selectedAorticPortExtension === null) {
        this.#acceptedNumericalReadback.set(this.#candidateNumericalReadback);
        this.#acceptedNumericalReadbackAvailable = true;
        const completedBeat = this.#beatAccumulator.acceptNumericalReadback(
          this.#acceptedNumericalReadback,
          null,
        );
        this.#completedBeatMetrics = completedBeat ?? this.#completedBeatMetrics;
      }
      this.#lastAcceptedStep = null;
      this.#lastPresentationSource = "typed-authority-readback";
      this.#lastPresentationRevision = candidateClock.revision;
      this.#lastPresentationObservation = null;
      const substep = Object.freeze({
        acceptedRevision: candidateClock.revision,
        acceptedTimeSec: candidateClock.acceptedTimeSec,
        landedOnPresentationTarget: true,
        clippedByCoronaryWindow: false,
        clippedByRhythmBoundary: false,
        rhythmBoundaryTimeSec: limit.rhythmBoundaryTimeSec,
        rhythmBoundaryOwners: Object.freeze([...limit.rhythmBoundaryOwners]),
      }) satisfies MainWireIntegratedModelSubstepRecordV3;
      const advance = Object.freeze({
        status: "advanced" as const,
        presentationTimeSec: targetTimeSec,
        acceptedTimeSec: candidateClock.acceptedTimeSec,
        acceptedRevision: candidateClock.revision,
        acceptedRevisionSpanFromPrevious,
        internalAcceptedSubstepCount: 1,
        boundaryClippedSubstepCount: 0,
        substeps: Object.freeze([substep]),
      }) satisfies MainWireFlatModelOwnedProjectionAdvanceV1;
      const projectionStartedAt = performance.now();
      const typedPresentation = readMainWireAcceptedTypedPresentationStateV1(
        this.#typedAuthority.currentCursor(),
        binding,
        this.#rhythmInput.configuration,
      );
      const projectedValues =
        projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
          Object.freeze({
            acceptedTimeSec: typedPresentation.acceptedTimeSec,
            regularSinusCycleLengthSec:
              typedPresentation.regularSinusCycleLengthSec,
            regularSinusNextActivationTimeSec:
              typedPresentation.regularSinusNextActivationTimeSec,
            dynamicMechanicalSupportLvadFlowMlPerSec:
              typedPresentation.lvadFlowMlPerSec,
            runtimeSignals: runtimeSignalsAtAcceptedTime(
              typedPresentation.acceptedTimeSec,
              this.#runtime,
            ),
            completedBeatMetrics: this.#completedBeatMetrics,
            mechanismResearchInputs: this.#runtime.mechanismResearchInputs,
            acceptedNumericalReadback: this.#acceptedNumericalReadback,
          }),
          outputIds,
        );
      return Object.freeze({
        advance,
        projectedValues,
        outputProjectionDurationMs: performance.now() - projectionStartedAt,
      });
    } catch (error) {
      if (candidateOpen) this.#typedAuthority.abortDirectCandidate();
      if (hemodynamicAuthorityCommitted) {
        this.poisonAfterCommittedSelectedAnalysisFailureV1(error);
      }
      throw error;
    } finally {
      selectedTicket?.close();
    }
  }

  private advanceToPresentationTimeInternal(
    targetTimeSec: number,
    detachObservation: boolean,
  ): MainWireIntegratedModelPresentationAdvanceV3 {
    this.#acceptedState = this.#authority.current();
    this.#autoregulationOwner = autoregulationOwnerFromAcceptedState(
      this.#acceptedState,
    );
    let acceptedClock = this.currentAcceptedClock();
    if (!Number.isFinite(targetTimeSec) || targetTimeSec < 0) {
      throw new Error(
        "Main Wire flat reference presentation target time is invalid",
      );
    }
    if (targetTimeSec < acceptedClock.acceptedTimeSec) {
      throw new Error("Main Wire flat reference target precedes accepted time");
    }
    if (targetTimeSec === acceptedClock.acceptedTimeSec) {
      return Object.freeze({
        status: "already-at-target" as const,
        presentationTimeSec: targetTimeSec,
        acceptedTimeSec: acceptedClock.acceptedTimeSec,
        acceptedRevision: acceptedClock.revision,
        internalAcceptedSubstepCount: 0 as const,
        observation: detachObservation
          ? this.observe()
          : this.modelOwnedObservation(),
      });
    }

    const previousPresentationRevision = this.#lastPresentationRevision;
    let substepCount = 0;
    const substeps: MainWireIntegratedModelSubstepRecordV3[] = [];

    while (acceptedClock.acceptedTimeSec !== targetTimeSec) {
      if (
        substepCount >= MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3
      ) {
        return this.failedAdvance(
          "substep-budget-exhausted",
          "Main Wire flat reference interval exhausted its substep budget",
          targetTimeSec,
          substeps,
        );
      }

      let limit;
      try {
        limit = this.limitCandidateTime(targetTimeSec);
      } catch (error) {
        if (!isNonadvancingLimiterError(error)) throw error;
        return this.failedAdvance(
          "candidate-time-did-not-advance",
          errorMessage(error),
          targetTimeSec,
          substeps,
        );
      }

      if (!(limit.candidateTimeSec > acceptedClock.acceptedTimeSec)) {
        return this.failedAdvance(
          "candidate-time-did-not-advance",
          "Main Wire flat reference candidate time did not advance",
          targetTimeSec,
          substeps,
        );
      }

      let directCandidateOpen = false;
      let borrowedAutoregulation: CoronaryAcceptedAutoregulationStateV3 | null =
        null;
      let borrowedAutoregulationCompleted = false;
      let acceptedNumericalReadbackAvailable = false;
      let previousCoupledAcceptedAdapter:
        | ReturnType<typeof mainWireFiveWallCoronaryBaseStateV2<WallState>>
        | undefined;
      let directCurrentCursor: TransactionalTypedStateCurrentCursorV1 | null =
        null;
      let directCandidateCursor: TransactionalTypedStateCandidateCursorV1 | null =
        null;
      let directCandidateClock: MainWireAcceptedTypedClockV1 | null = null;
      let hemodynamicAuthorityCommitted = false;
      let selectedTicket: MainWireSelectedAorticPortSessionTicketV1 | null =
        null;
      const abortDirectCandidateIfOpen = (): void => {
        if (!directCandidateOpen) return;
        if (this.#typedAuthority === null) {
          throw new Error("open typed candidate has no typed authority");
        }
        this.#typedAuthority.abortDirectCandidate();
        directCandidateOpen = false;
      };
      try {
      if (this.#typedAuthority !== null) {
        try {
          const current = this.#typedAuthority.currentCursor();
          const candidate = this.#typedAuthority.beginDirectCandidate();
          directCurrentCursor = current;
          directCandidateCursor = candidate;
          directCandidateOpen = true;
          directCandidateClock = stageMainWireAcceptedTypedClockCandidateV1(
            current,
            candidate,
            this.requiredTypedBoundaryBinding(),
            limit.candidateTimeSec,
          );
          stageMainWireAcceptedTypedCalciumCandidateV1(
            current,
            candidate,
            this.requiredTypedBoundaryBinding(),
            limit.candidateTimeSec,
            this.#rhythmInput.configuration.calciumParametersByWall,
          );
          stageMainWireAcceptedTypedAuthoredScheduleCandidateV1(
            current,
            candidate,
            this.requiredTypedBoundaryBinding(),
            limit.candidateTimeSec,
            this.#rhythmInput.configuration,
          );
          if (this.#typedHemodynamicBinding === null) {
            throw new Error(
              "Main Wire typed hemodynamic binding is unavailable",
            );
          }
          previousCoupledAcceptedAdapter =
            materializeMainWireAcceptedTypedCoupledSolverAdapterV1(
              current,
              this.#typedHemodynamicBinding,
              mainWireFiveWallCoronaryBaseStateV2(this.#acceptedState.coronary),
              this.#typedHemodynamicScratch,
            );
        } catch (error) {
          abortDirectCandidateIfOpen();
          throw error;
        }
      }
      let result: MainWireIntegratedModelStepResultV3<WallState>;
      try {
        const stepInput = Object.freeze({
          candidateTimeSec: limit.candidateTimeSec,
          coronary: this.#runtime.coronaryStepInput,
          rhythm: this.#rhythmInput,
          dynamicMechanicalSupport: Object.freeze({
            config: this.#dynamicMechanicalSupportConfig,
            profile: this.#runtime.profile,
          }),
        });
        result =
          this.#typedAuthority === null
            ? stepMainWireIntegratedModelV3(
                this.#provider,
                this.#acceptedState,
                stepInput,
                this.#coronaryScratchWorkspace,
                this.#nonCoronaryScratchWorkspace,
                this.#nonCoronaryAcceptedNumericalSource,
              )
            : stepMainWireIntegratedModelCoupledV1(
                this.#provider,
                this.#acceptedState,
                stepInput,
                this.#coupledNewtonWorkspace,
                Object.freeze({
                  residualWorkspace: this.#coupledResidualWorkspace,
                  previousAcceptedNumericalSource:
                    this.#nonCoronaryAcceptedNumericalSource ?? undefined,
                  previousCoupledAcceptedAdapter,
                  onConvergedCandidate: (candidateBorrow) => {
                    if (
                      directCandidateCursor === null ||
                      this.#typedHemodynamicBinding === null
                    ) {
                      throw new Error(
                        "Main Wire coupled typed candidate cursor is missing",
                      );
                    }
                    stageMainWireAcceptedTypedCoupledCandidateV1(
                      directCandidateCursor,
                      this.#typedHemodynamicBinding,
                      candidateBorrow,
                      this.#typedHemodynamicScratch,
                    );
                    const numericalReadbackDestination =
                      this.#selectedAorticPortExtension === null
                        ? this.#acceptedNumericalReadback
                        : this.#candidateNumericalReadback;
                    numericalReadbackDestination.set(
                      candidateBorrow.acceptedNumericalReadback,
                    );
                    if (this.#selectedAorticPortExtension !== null) {
                      if (
                        directCandidateClock === null
                        || candidateBorrow.selectedAorticValveReadback === undefined
                      ) {
                        throw new Error(
                          "selected aortic full candidate clock or readback is unavailable",
                        );
                      }
                      selectedTicket =
                        this.#selectedAorticPortExtension.stageCandidateV1({
                          expectedCandidateTimeSec:
                            directCandidateClock.acceptedTimeSec,
                          expectedCandidateRevision:
                            directCandidateClock.revision,
                          candidateTimeSec: candidateBorrow.candidateTimeSec,
                          candidateRevision: candidateBorrow.candidateRevision,
                          historicalAcceptedNumericalReadback:
                            candidateBorrow.acceptedNumericalReadback,
                          selectedAorticValveReadback:
                            candidateBorrow.selectedAorticValveReadback,
                        });
                    }
                    acceptedNumericalReadbackAvailable = true;
                    const regulation =
                      advanceMainWireFiveWallCoronaryAutoregulationFromPackedV3(
                        this.#acceptedState.coronary,
                        Object.freeze({
                          ...this.#runtime.coronaryStepInput,
                          dtSec:
                            candidateBorrow.candidateTimeSec -
                            this.#acceptedState.acceptedTimeSec,
                        }),
                        candidateBorrow.candidateTimeSec,
                        candidateBorrow.candidateRevision,
                        candidateBorrow.coronaryAutoregulationHydraulicObservables,
                      );
                    borrowedAutoregulation = regulation.nextState;
                    borrowedAutoregulationCompleted =
                      regulation.completedWindow !== null;
                  },
                }),
              );
      } catch (error) {
        abortDirectCandidateIfOpen();
        throw error;
      }
      if (result.converged === false) {
        abortDirectCandidateIfOpen();
        return this.failedAdvance(
          result.reason,
          result.message,
          targetTimeSec,
          substeps,
        );
      }
      if (result.acceptedState.acceptedTimeSec !== limit.candidateTimeSec) {
        abortDirectCandidateIfOpen();
        return this.failedAdvance(
          "integrated-promotion-rejected",
          "Main Wire flat reference accepted clock differs from candidate",
          targetTimeSec,
          substeps,
        );
      }
      if (
        this.#typedAuthority !== null &&
        (borrowedAutoregulation === null ||
          !autoregulationStatesExactlyEqual(
            borrowedAutoregulation,
            result.acceptedState.coronary.coronaryAutoregulation,
          ) ||
          borrowedAutoregulationCompleted !==
            result.coronaryStep.autoregulationWindowCompleted)
      ) {
        abortDirectCandidateIfOpen();
        throw new Error(
          "Main Wire packed autoregulation readback differs from public promotion",
        );
      }
      if (
        this.#typedAuthority !== null &&
        (!acceptedNumericalReadbackAvailable ||
          (this.#selectedAorticPortExtension === null
            ? this.#acceptedNumericalReadback
            : this.#candidateNumericalReadback)[
            MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
          ] !== result.acceptedState.acceptedTimeSec)
      ) {
        abortDirectCandidateIfOpen();
        throw new Error(
          "Main Wire accepted numerical readback is missing or clock-misaligned",
        );
      }

      const capturedAtrialActivationId =
        result.composedRhythmCandidate.capturedAtrialActivation
          ?.capturedActivationId ?? null;
      let trialBeatAccumulator: MainWireIntegratedModelBeatAccumulatorV3 | null =
        null;
      let trialCompletedBeatMetrics:
        MainWireIntegratedModelCompletedBeatMetricsV3 | null = null;
      if (this.#selectedAorticPortExtension !== null) {
        if (selectedTicket === null) {
          throw new Error("selected aortic full candidate ticket is missing");
        }
        trialBeatAccumulator = MainWireIntegratedModelBeatAccumulatorV3.restore(
          this.#beatAccumulator.checkpoint(),
        );
        trialCompletedBeatMetrics =
          trialBeatAccumulator.acceptNumericalReadback(
            this.#candidateNumericalReadback,
            capturedAtrialActivationId,
          );
      }

      let committedState: AcceptedState;
      try {
        if (this.#typedAuthority !== null) {
          if (directCurrentCursor === null || directCandidateCursor === null) {
            throw new Error(
              "Main Wire flat reference typed transaction cursors are missing",
            );
          }
          stageMainWireAcceptedTypedRegularAtrialCandidateV1(
            directCurrentCursor,
            directCandidateCursor,
            this.requiredTypedBoundaryBinding(),
            limit.candidateTimeSec,
            this.#rhythmInput.configuration,
            result.composedRhythmCandidate.pacSinusClockPolicyApplied,
          );
          stageMainWireAcceptedTypedResolvedCandidateV1(
            directCurrentCursor,
            directCandidateCursor,
            this.requiredTypedBoundaryBinding(),
            result.composedRhythmCandidate,
            result.dynamicMechanicalSupportTrial.candidateAcceptedState,
          );
          stageMainWireAcceptedTypedContinuousOwnerCandidateV1(
            directCandidateCursor,
            this.requiredTypedBoundaryBinding(),
            result.composedRhythmCandidate,
            result.acceptedState.coronary.coronaryAutoregulation,
          );
        }
        if (this.#typedAuthority !== null) {
          const previousAutoregulation =
            this.#acceptedState.coronary.coronaryAutoregulation;
          const candidateAutoregulation =
            result.acceptedState.coronary.coronaryAutoregulation;
          const modelOwnedCandidate =
            !hasDiscreteRhythmTransition(result.composedRhythmCandidate) &&
            !result.coronaryStep.autoregulationWindowCompleted &&
            autoregulationControlsUnchanged(
              previousAutoregulation,
              candidateAutoregulation,
            );
          committedState =
            (modelOwnedCandidate
              ? this.#typedAuthority.tryCommitModelOwnedDirectCandidate(
                  result.acceptedState,
                  this.requiredModelOwnedPromotionPlan(),
                  this.requiredDirectCompletionPlan(),
                )
              : null) ??
            this.#typedAuthority.tryCommitExactDirectCandidate(
              result.acceptedState,
              this.requiredDirectCompletionPlan(),
            ) ??
            this.#typedAuthority.commitDirectCandidate(
              result.acceptedState,
              this.requiredDirectCompletionPlan(),
            );
          directCandidateOpen = false;
        } else {
          committedState = this.#authority.commit(result.acceptedState);
        }
        hemodynamicAuthorityCommitted = true;
      } catch (error) {
        abortDirectCandidateIfOpen();
        throw error;
      }
      this.#acceptedState = committedState;
      if (
        this.#selectedAorticPortExtension === null
        && this.#typedAuthority !== null
        && acceptedNumericalReadbackAvailable
      ) {
        this.#acceptedNumericalReadbackAvailable = true;
      }
      resetMainWireFiveWallCoupledPredictorV1(this.#coupledPredictorWorkspace);
      this.#autoregulationOwner =
        autoregulationOwnerFromAcceptedState(committedState);
      acceptedClock = this.currentAcceptedClock();
      if (
        acceptedClock.acceptedTimeSec !== committedState.acceptedTimeSec ||
        acceptedClock.revision !== committedState.revision
      ) {
        throw new Error(
          "Main Wire flat reference typed clock differs from committed adapter",
        );
      }
      const committedResult = Object.freeze({
        ...result,
        acceptedState: committedState,
      });
      if (this.#selectedAorticPortExtension !== null) {
        selectedTicket!.promote({
          committedAcceptedTimeSec: committedState.acceptedTimeSec,
          committedRevision: committedState.revision,
          capturedAtrialActivationId,
          baseCompletedBeatMetrics: trialCompletedBeatMetrics,
        });
        this.#beatAccumulator = trialBeatAccumulator!;
        this.#completedBeatMetrics =
          trialCompletedBeatMetrics ?? this.#completedBeatMetrics;
        this.#acceptedNumericalReadback.set(this.#candidateNumericalReadback);
        this.#acceptedNumericalReadbackAvailable = true;
      } else {
        const completedBeat =
          this.#typedAuthority === null
            ? this.#beatAccumulator.accept(committedResult)
            : this.#beatAccumulator.acceptNumericalReadback(
                this.#acceptedNumericalReadback,
                capturedAtrialActivationId,
              );
        this.#completedBeatMetrics = completedBeat ?? this.#completedBeatMetrics;
      }
      this.#lastAcceptedStep = committedResult;
      substepCount += 1;
      substeps.push(
        Object.freeze({
          acceptedRevision: committedState.revision,
          acceptedTimeSec: committedState.acceptedTimeSec,
          landedOnPresentationTarget:
            committedState.acceptedTimeSec === targetTimeSec,
          clippedByCoronaryWindow: limit.clippedByCoronaryWindow,
          clippedByRhythmBoundary: limit.clippedByRhythmBoundary,
          rhythmBoundaryTimeSec: limit.rhythmBoundaryTimeSec,
          rhythmBoundaryOwners: Object.freeze([...limit.rhythmBoundaryOwners]),
        }),
      );
      } catch (error) {
        abortDirectCandidateIfOpen();
        if (hemodynamicAuthorityCommitted) {
          this.poisonAfterCommittedSelectedAnalysisFailureV1(error);
        }
        throw error;
      } finally {
        selectedTicket?.close();
      }
    }

    if (acceptedClock.acceptedTimeSec !== targetTimeSec) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire flat reference did not land on its presentation target",
        targetTimeSec,
        substeps,
      );
    }
    if (this.#lastAcceptedStep === null) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire flat reference advanced without accepted-step readback",
        targetTimeSec,
        substeps,
      );
    }
    const acceptedRevisionSpanFromPrevious =
      acceptedClock.revision - previousPresentationRevision;
    if (acceptedRevisionSpanFromPrevious < 1) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire flat reference accepted revision did not advance",
        targetTimeSec,
        substeps,
      );
    }

    this.#lastPresentationSource = "presentation-target";
    this.#lastPresentationRevision = acceptedClock.revision;
    const nextObservation = detachObservation
      ? this.detachedObservation()
      : this.modelOwnedObservation();
    this.#lastPresentationObservation = detachObservation
      ? nextObservation
      : null;
    return Object.freeze({
      status: "advanced" as const,
      presentationTimeSec: targetTimeSec,
      acceptedTimeSec: acceptedClock.acceptedTimeSec,
      acceptedRevision: acceptedClock.revision,
      acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount: substepCount,
      boundaryClippedSubstepCount: substeps.filter(
        (substep) => !substep.landedOnPresentationTarget,
      ).length,
      substeps: Object.freeze([...substeps]),
      observation: nextObservation,
    });
  }

  async checkpointStandardExact(): Promise<MainWireIntegratedModelStandardCheckpointV2> {
    this.assertSessionUsableV1();
    this.assertLegacySessionOperationAvailableV1("Standard 65 exact checkpoint");
    this.#acceptedState = this.#authority.current();
    this.#typedAuthority?.assertCurrentMatches(this.#acceptedState);
    return checkpointMainWireIntegratedModelStandardV2(
      this.checkpointContext(),
      this.#acceptedState,
      this.#beatAccumulator,
      this.#completedBeatMetrics,
    );
  }

  /**
   * Synchronously captures the base half of a selected Standard66 checkpoint
   * before its digest promise can yield. The selected subclass must capture
   * its extension checkpoint immediately after calling this method and before
   * awaiting the returned promise, so both owners describe one accepted
   * epoch. This seam remains unavailable to Standard65 owners.
   */
  protected checkpointSelectedAorticBaseStandardExactV1(): Promise<
    MainWireIntegratedModelStandardCheckpointV2
  > {
    this.assertSessionUsableV1();
    if (this.#selectedAorticPortExtension === null) {
      throw new Error(
        "selected aortic base checkpoint requires its Session extension owner",
      );
    }
    this.#acceptedState = this.#authority.current();
    this.#typedAuthority?.assertCurrentMatches(this.#acceptedState);
    return checkpointMainWireIntegratedModelStandardV2(
      this.selectedAorticCheckpointContextV1(),
      this.#acceptedState,
      this.#beatAccumulator,
      this.#completedBeatMetrics,
    );
  }

  /** Exact accepted clock for the selected subclass's readback borrow. */
  protected selectedAorticAcceptedClockV1(): MainWireAcceptedTypedClockV1 {
    this.assertSessionUsableV1();
    if (this.#selectedAorticPortExtension === null) {
      throw new Error(
        "selected aortic accepted clock requires its Session extension owner",
      );
    }
    return this.currentAcceptedClock();
  }

  /** Captures the selected owner's algorithmic continuation history. */
  protected checkpointSelectedAorticCoupledPredictorV1():
    MainWireFiveWallCoupledPredictorCheckpointV2 {
    this.assertSessionUsableV1();
    if (this.#selectedAorticPortExtension === null) {
      throw new Error(
        "selected aortic predictor checkpoint requires its Session extension owner",
      );
    }
    return checkpointMainWireFiveWallCoupledPredictorV1(
      this.#coupledPredictorWorkspace,
    );
  }

  /** Restores predictor history against the already-restored accepted root. */
  protected restoreSelectedAorticCoupledPredictorV1(
    checkpoint: unknown,
  ): void {
    this.assertSessionUsableV1();
    if (this.#selectedAorticPortExtension === null) {
      throw new Error(
        "selected aortic predictor restore requires its Session extension owner",
      );
    }
    const acceptedState = this.#authority.current();
    restoreMainWireFiveWallCoupledPredictorV1(
      checkpoint,
      Object.freeze({
        revision: acceptedState.revision,
        acceptedTimeSec: acceptedState.acceptedTimeSec,
        unknownsMl: coupledUnknownsFromAcceptedStateV1(acceptedState),
      }),
      this.#coupledPredictorWorkspace,
    );
  }

  async checkpointCanonicalBinary(): Promise<Uint8Array> {
    this.assertSessionUsableV1();
    this.assertLegacySessionOperationAvailableV1("Standard 65 canonical checkpoint");
    return encodeCanonicalFlatCheckpointV1(
      Object.freeze({
        checkpointId: MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_CHECKPOINT_V2_ID,
        schemaVersion: 2 as const,
        standardCheckpoint: await this.checkpointStandardExact(),
        coupledPredictor: checkpointMainWireFiveWallCoupledPredictorV1(
          this.#coupledPredictorWorkspace,
        ),
      }) satisfies MainWireFlatAuthoritativeReferenceCheckpointV2,
    );
  }

  authorityReport(): MainWireAcceptedTypedStateAuthorityReportV1 {
    if (this.#typedAuthority === null) {
      throw new Error(
        "Typed authority Session uses a non-typed test authority",
      );
    }
    return this.#typedAuthority.report();
  }

  coupledSolverProfile(): MainWireFlatCoupledSolverProfileV1 {
    return Object.freeze({ ...this.#coupledSolverProfile });
  }

  coupledPredictorReport(): MainWireFiveWallCoupledPredictorReportV1 {
    return reportMainWireFiveWallCoupledPredictorV1(
      this.#coupledPredictorWorkspace,
    );
  }

  snapshotAcceptedStateBytes(): Uint8Array {
    this.assertSessionUsableV1();
    if (this.#typedAuthority === null) {
      throw new Error(
        "Typed authority Session uses a non-typed test authority",
      );
    }
    const state = this.#typedAuthority.snapshot();
    const encoded = new Uint8Array(measureCanonicalFlatDataV1(state));
    const length = encodeCanonicalFlatDataIntoV1(state, encoded);
    if (length !== encoded.byteLength) {
      throw new Error(
        "Typed authority accepted-state length changed while encoding",
      );
    }
    return encoded;
  }

  private checkpointContext() {
    const base = mainWireIntegratedModelCheckpointContextV3(
      this.requiredLegacyRuntimeV1(),
      this.#acceptedState,
    );
    return Object.freeze({
      ...base,
      provider: this.#provider,
      dynamicMechanicalSupportConfig: this.#dynamicMechanicalSupportConfig,
    });
  }

  private selectedAorticCheckpointContextV1() {
    if (!isSelectedAorticOutflowRuntimeV1(this.#runtime)) {
      throw new Error(
        "selected aortic checkpoint context requires the fixed selected runtime",
      );
    }
    const base =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        this.#runtime,
      );
    return Object.freeze({
      ...base,
      provider: this.#provider,
      coronaryAutoregulationBinding:
        this.#acceptedState.coronary.coronaryAutoregulationBinding,
      dynamicMechanicalSupportConfig: this.#dynamicMechanicalSupportConfig,
      mechanismResearchInputs: this.#runtime.mechanismResearchInputs,
    });
  }

  private detachedObservation(): MainWireIntegratedModelObservationV3 {
    const acceptedState = this.#authority.snapshot();
    const lastAcceptedStep =
      this.#lastAcceptedStep === null
        ? null
        : Object.freeze({
            ...this.#lastAcceptedStep,
            acceptedState,
          });
    return observation(
      this.#lastPresentationSource,
      acceptedState,
      lastAcceptedStep,
      this.#runtime,
      this.#completedBeatMetrics,
    );
  }

  private modelOwnedObservation(): MainWireIntegratedModelObservationV3 {
    return observation(
      this.#lastPresentationSource,
      this.#acceptedState,
      this.#lastAcceptedStep,
      this.#runtime,
      this.#completedBeatMetrics,
    );
  }

  private currentAcceptedClock(): MainWireAcceptedTypedClockV1 {
    if (this.#typedAuthority !== null) {
      return readMainWireAcceptedTypedClockV1(
        this.#typedAuthority.currentCursor(),
        this.requiredTypedBoundaryBinding(),
      );
    }
    return Object.freeze({
      acceptedTimeSec: this.#acceptedState.acceptedTimeSec,
      revision: this.#acceptedState.revision,
    });
  }

  private limitCandidateTime(targetTimeSec: number) {
    if (this.#typedAuthority !== null) {
      return limitMainWireAcceptedTypedCandidateTimeV1(
        this.#typedAuthority.currentCursor(),
        this.requiredTypedBoundaryBinding(),
        targetTimeSec,
        this.#rhythmInput.configuration,
        this.#rhythmInput.externalAfNextBoundaryTimeSec,
      );
    }
    return limitMainWireIntegratedModelCandidateTimeV3(
      this.#acceptedState,
      targetTimeSec,
      {
        configuration: this.#rhythmInput.configuration,
        externalAfNextBoundaryTimeSec:
          this.#rhythmInput.externalAfNextBoundaryTimeSec,
      },
      this.#runtime.profile,
      this.#dynamicMechanicalSupportConfig,
    );
  }

  private requiredTypedBoundaryBinding(): MainWireAcceptedTypedBoundaryBindingV1 {
    if (this.#typedBoundaryBinding === null) {
      throw new Error("Typed authority Session has no typed boundary binding");
    }
    return this.#typedBoundaryBinding;
  }

  private requiredDirectCompletionPlan(): TransactionalTypedStateCompletionPlanV1 {
    if (this.#directCompletionPlan === null) {
      throw new Error("Typed authority direct completion plan is unavailable");
    }
    return this.#directCompletionPlan;
  }

  private requiredModelOwnedPromotionPlan(): TransactionalTypedStatePromotionPlanV1 {
    if (this.#modelOwnedPromotionPlan === null) {
      throw new Error(
        "Typed authority model-owned promotion plan is unavailable",
      );
    }
    return this.#modelOwnedPromotionPlan;
  }

  private failedAdvance(
    reason: AdvanceFailureReason,
    message: string,
    targetTimeSec: number,
    substeps: readonly MainWireIntegratedModelSubstepRecordV3[],
  ): Extract<
    MainWireIntegratedModelPresentationAdvanceV3,
    { status: "failed" }
  > {
    const acceptedClock = this.currentAcceptedClock();
    return Object.freeze({
      status: "failed" as const,
      reason,
      message,
      acceptedTimeSec: acceptedClock.acceptedTimeSec,
      acceptedRevision: acceptedClock.revision,
      partiallyAdvanced: substeps.length > 0,
      internalAcceptedSubstepCount: substeps.length,
      boundaryClippedSubstepCount: substeps.filter(
        (substep) => !substep.landedOnPresentationTarget,
      ).length,
      substeps: Object.freeze([...substeps]),
      requestedPresentationTimeSec: targetTimeSec,
    });
  }

  private assertSessionUsableV1(): void {
    if (this.#terminalPoison !== null) throw this.#terminalPoison;
  }

  private assertLegacySessionOperationAvailableV1(operation: string): void {
    if (this.#selectedAorticPortExtension !== null) {
      throw new Error(
        `${operation} is unavailable for the selected aortic Session owner`,
      );
    }
  }

  private requiredLegacyRuntimeV1(): MainWireIntegratedModelRuntimeV3 {
    if (isSelectedAorticOutflowRuntimeV1(this.#runtime)) {
      throw new Error("selected aortic runtime is not a Standard 65 runtime");
    }
    return this.#runtime;
  }

  private poisonAfterCommittedSelectedAnalysisFailureV1(error: unknown): void {
    if (
      this.#selectedAorticPortExtension === null
      || this.#terminalPoison !== null
    ) {
      return;
    }
    const poison = new Error(
      "selected aortic Session is terminally poisoned after a committed analysis synchronization failure",
    );
    (poison as Error & { cause?: unknown }).cause = error;
    this.#terminalPoison = poison;
  }
}

function isSelectedAorticOutflowRuntimeV1(
  runtime: SessionRuntime,
): runtime is MainWireIntegratedModelSelectedAorticOutflowFixtureV1 {
  const vascular = runtime.runtime.vascular as Readonly<Record<string, unknown>>;
  const selectedProfile = vascular.selectedAorticOutflowProfile;
  if (
    !("fixedAssemblyId" in runtime)
    || !("fixedAssemblyClaim" in runtime)
  ) {
    return false;
  }
  const selected = runtime as MainWireIntegratedModelSelectedAorticOutflowFixtureV1;
  const claim = selected.fixedAssemblyClaim;
  const configuration = selected.rhythm.configuration;
  return (
    selected.fixedAssemblyId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && claim
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_CLAIM
    && claim.fixtureId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && claim.ventricularMaterialProfileId
      === MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID
    && claim.aorticOutflowCirculationProfileId
      === MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID
    && claim.regularSinusProfileId
      === MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID
    && selected.runtime === selected.coronaryStepInput.runtime
    && selectedProfile
      === MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
    && selected.provider.parameterSetId.includes(
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
    )
    && selected.coronaryStepInput.calciumDriveParams.parameterSetId
      === MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID
    && configuration.ventricularIntervalStrength.parameterProvenance.sourceId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && configuration.avGateParameters.parameterProvenance.sourceId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && configuration.distalGate.parameterProvenance.sourceId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && configuration.ventricularBackup.parameterProvenance.sourceId
      === MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
    && configuration.ventricularIntervalStrength.referenceCycleLengthSec
      === selected.cycleLengthSec
    && selected.rhythm.state.configuration === configuration
    && selected.cold.acceptedState.composedRhythm.configuration
      === configuration
  );
}

function hasSelectedAorticOutflowRuntimeMarkerV1(
  runtime: SessionRuntime,
): boolean {
  const vascular = runtime.runtime.vascular as Readonly<Record<string, unknown>>;
  return (
    "fixedAssemblyId" in runtime
    || "fixedAssemblyClaim" in runtime
    || Object.prototype.hasOwnProperty.call(
      vascular,
      "selectedAorticOutflowProfile",
    )
  );
}

function assertSynchronizedSelectedAorticBeatRestoreV1(
  acceptedTimeSec: number,
  baseAccumulator: MainWireIntegratedModelBeatAccumulatorV3,
  baseLatest: MainWireIntegratedModelCompletedBeatMetricsV3 | null,
  selectedExtension: MainWireSelectedAorticPortSessionExtensionV1,
): void {
  const baseActive = baseAccumulator.checkpoint().active;
  const selectedState = selectedExtension.checkpointExactBeatStateV1();
  const selectedActive = selectedState.selectedBeatAccumulator.active;
  const selectedLatest = selectedState.latestCompletedBeatMetrics;
  if ((baseActive === null) !== (selectedActive === null)) {
    throw new Error(
      "base and selected aortic restored active beat availability differs",
    );
  }
  if (baseActive !== null && selectedActive !== null) {
    if (
      !Object.is(baseActive.previous.timeSec, acceptedTimeSec)
      || !Object.is(selectedActive.previous.timeSec, acceptedTimeSec)
      || baseActive.startAtrialCaptureId
        !== selectedActive.startAtrialCaptureId
      || !Object.is(baseActive.startTimeSec, selectedActive.startTimeSec)
      || !Object.is(
        baseActive.previous.aorticValveFlowMlPerSec,
        selectedActive.previous.aorticValveFlowMlPerSec,
      )
      || !Object.is(
        baseActive.valveForwardPressureGradientAccumulators.AoV
          .forwardFlowDurationSec,
        selectedActive.forwardFlowDurationSec,
      )
    ) {
      throw new Error(
        "base and selected aortic restored active beat boundary differs",
      );
    }
  }
  if ((baseLatest === null) !== (selectedLatest === null)) {
    throw new Error(
      "base and selected aortic restored completed beat availability differs",
    );
  }
  if (baseLatest === null || selectedLatest === null) return;
  if (
    baseActive === null
    || selectedActive === null
    || baseActive.startAtrialCaptureId !== baseLatest.endAtrialCaptureId
    || selectedActive.startAtrialCaptureId
      !== selectedLatest.endAtrialCaptureId
    || !Object.is(baseActive.startTimeSec, baseLatest.endTimeSec)
    || !Object.is(selectedActive.startTimeSec, selectedLatest.endTimeSec)
    || baseLatest.startAtrialCaptureId
      !== selectedLatest.startAtrialCaptureId
    || baseLatest.endAtrialCaptureId !== selectedLatest.endAtrialCaptureId
    || !Object.is(baseLatest.startTimeSec, selectedLatest.startTimeSec)
    || !Object.is(baseLatest.endTimeSec, selectedLatest.endTimeSec)
    || !Object.is(baseLatest.durationSec, selectedLatest.durationSec)
    || !Object.is(
      baseLatest.valveForwardPressureGradients.AoV.forwardFlowDurationSec,
      selectedLatest.localValveForwardPressureGradient.forwardFlowDurationSec,
    )
    || !Object.is(
      selectedLatest.localValveForwardPressureGradient.forwardFlowDurationSec,
      selectedLatest.venaContractaBernoulliForwardPressureGradient
        .forwardFlowDurationSec,
    )
  ) {
    throw new Error(
      "base and selected aortic restored completed beat boundary differs",
    );
  }
}

function isStrictlyOrdinaryTypedCandidate(
  clock: MainWireAcceptedTypedClockV1,
  limit: ReturnType<typeof limitMainWireAcceptedTypedCandidateTimeV1>,
  rhythm: MainWireIntegratedComposedRhythmStepContextV3,
  autoregulationOwner: MainWireFiveWallCoronaryAutoregulationAcceptedOwnerV3,
): boolean {
  if (
    rhythm.configuration.atrialSource.mode !== "regular" ||
    rhythm.configuration.atrialSource.regularSourceConfiguration.rhythmClass !==
      "sinus" ||
    rhythm.externalAfNextBoundaryTimeSec !== null ||
    rhythm.externalAtrialSourceBatch !== null ||
    limit.rhythmBoundaryTimeSec !== null ||
    limit.rhythmBoundaryOwners.length !== 0 ||
    autoregulationOwner.acceptedTimeSec !== clock.acceptedTimeSec ||
    autoregulationOwner.state.windowControl === null ||
    !optionalAutoregulationControlEqual(
      autoregulationOwner.state.windowControl,
      autoregulationOwner.state.desiredControl,
    )
  )
    return false;
  const windowEndTimeSec =
    clock.acceptedTimeSec + limit.coronaryWindowMaximumStepSec;
  const tolerance =
    64 *
    Number.EPSILON *
    Math.max(
      1,
      Math.abs(clock.acceptedTimeSec),
      Math.abs(limit.candidateTimeSec),
      Math.abs(windowEndTimeSec),
    );
  return limit.candidateTimeSec < windowEndTimeSec - tolerance;
}

const MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_ID_SET_V3 = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);

function validateTypedProjectionOutputIds(
  outputIds: readonly MainWireIntegratedModelOutputIdV3[],
): void {
  const seen = new Set<string>();
  for (const outputId of outputIds) {
    if (!MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_ID_SET_V3.has(outputId)) {
      throw new Error(`selected output ${String(outputId)} is not registered`);
    }
    if (seen.has(outputId)) {
      throw new Error(`selected output ${outputId} is duplicated`);
    }
    seen.add(outputId);
  }
}

function autoregulationOwnerFromAcceptedState(
  acceptedState: AcceptedState,
): MainWireFiveWallCoronaryAutoregulationAcceptedOwnerV3 {
  return Object.freeze({
    acceptedTimeSec: acceptedState.acceptedTimeSec,
    binding: acceptedState.coronary.coronaryAutoregulationBinding,
    state: acceptedState.coronary.coronaryAutoregulation,
    toneResistanceScaleByTerritoryLayer:
      acceptedState.coronary.coronary.toneResistanceScaleByTerritoryLayer,
  });
}

function runtimeSignalsAtAcceptedTime(
  acceptedTimeSec: number,
  runtime: SessionRuntime,
): MainWireIntegratedModelObservationV3["runtimeSignals"] {
  const respiratory = respiratoryExternalPressuresV1(
    acceptedTimeSec,
    runtime.coronaryStepInput.runtime.respiratory,
  );
  return Object.freeze({
    pleuralPressureMmHg: respiratory.pthMmHg,
    alveolarPressureMmHg: respiratory.palvMmHg,
  });
}

function typedAuthorityFactory(
  coldAcceptedState: AcceptedState,
): MainWireFlatReferenceAcceptedStateAuthorityFactoryV1 {
  return (initial, validate, ownDecoded, admitCompletedMirror) =>
    new MainWireAcceptedTypedStateAuthorityV1(
      coldAcceptedState,
      initial,
      validate,
      ownDecoded,
      admitCompletedMirror,
    );
}

function observation(
  source: MainWireIntegratedModelObservationV3["source"],
  acceptedState: AcceptedState,
  lastAcceptedStep: SuccessfulStep | null,
  runtime: SessionRuntime,
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null,
): MainWireIntegratedModelObservationV3 {
  const respiratory = respiratoryExternalPressuresV1(
    acceptedState.acceptedTimeSec,
    runtime.coronaryStepInput.runtime.respiratory,
  );
  return Object.freeze({
    source,
    acceptedState,
    lastAcceptedStep,
    runtimeSignals: Object.freeze({
      pleuralPressureMmHg: respiratory.pthMmHg,
      alveolarPressureMmHg: respiratory.palvMmHg,
    }),
    mechanismResearchInputs: runtime.mechanismResearchInputs,
    completedBeatMetrics,
  });
}

function hasDiscreteRhythmTransition(
  candidate: MainWireIntegratedModelStepSuccessV3<WallState>["composedRhythmCandidate"],
): boolean {
  return (
    candidate.capturedAtrialActivation !== null ||
    candidate.capturedVentricularActivation !== null ||
    candidate.pacSinusClockPolicyApplied !== null ||
    candidate.proximalAvOutputDecision !== null ||
    candidate.ventricularIntervalStrengthCandidate !== null ||
    candidate.conditionalVviAttempted ||
    candidate.dueProximalAvOutputs.length > 0 ||
    candidate.distalGateDecisions.length > 0 ||
    candidate.deliveredCalciumDeposits.length > 0 ||
    candidate.scheduledCalciumDeposits.length > 0 ||
    candidate.regularAtrialSourceCandidate?.sourceImpulse !== null ||
    candidate.authoredEctopyTrial.sourceImpulses.length > 0 ||
    (candidate.authoredVentricularPacingReplayTrial?.sourceImpulses.length ??
      0) > 0
  );
}

function validateReferenceCheckpointV2(
  input: unknown,
): MainWireFlatAuthoritativeReferenceCheckpointV2 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(
      "flat authoritative reference checkpoint must be a plain object",
    );
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(
      "flat authoritative reference checkpoint must be a plain object",
    );
  }
  const expectedKeys = [
    "checkpointId",
    "schemaVersion",
    "standardCheckpoint",
    "coupledPredictor",
  ].sort();
  const keys = Reflect.ownKeys(input);
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length !== expectedKeys.length ||
    (keys as string[]).sort().some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(
      "flat authoritative reference checkpoint has unexpected fields",
    );
  }
  const candidate =
    input as Partial<MainWireFlatAuthoritativeReferenceCheckpointV2>;
  if (
    candidate.checkpointId !==
      MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_CHECKPOINT_V2_ID ||
    candidate.schemaVersion !== 2 ||
    candidate.standardCheckpoint === undefined ||
    candidate.coupledPredictor === undefined
  ) {
    throw new Error(
      "unsupported flat authoritative reference checkpoint schema",
    );
  }
  return candidate as MainWireFlatAuthoritativeReferenceCheckpointV2;
}

function coupledUnknownsFromAcceptedStateV1(
  state: AcceptedState,
): Float64Array {
  const unknownsMl = new Float64Array(30);
  for (
    let index = 0;
    index < NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
    index += 1
  ) {
    unknownsMl[index] =
      state.coronary.circulation.nodeVolumesMl[
        NON_CORONARY_INDEPENDENT_NODE_NAMES_V1[index]!
      ];
  }
  for (
    let index = 0;
    index < CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
    index += 1
  ) {
    unknownsMl[NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index] =
      state.coronary.coronary.volumeMlByNode[
        CORONARY_CONSERVED_VOLUME_NODE_IDS_V2[index]!
      ];
  }
  return unknownsMl;
}

function autoregulationControlsUnchanged(
  previous: CoronaryAcceptedAutoregulationStateV3,
  candidate: CoronaryAcceptedAutoregulationStateV3,
): boolean {
  return (
    optionalAutoregulationControlEqual(
      previous.windowControl,
      candidate.windowControl,
    ) &&
    optionalAutoregulationControlEqual(
      previous.desiredControl,
      candidate.desiredControl,
    )
  );
}

function autoregulationStatesExactlyEqual(
  left: CoronaryAcceptedAutoregulationStateV3,
  right: CoronaryAcceptedAutoregulationStateV3,
): boolean {
  if (
    left.stateId !== right.stateId ||
    left.windowIndex !== right.windowIndex ||
    !Object.is(
      left.windowOriginAcceptedTimeSec,
      right.windowOriginAcceptedTimeSec,
    ) ||
    !Object.is(
      left.windowStartAcceptedTimeSec,
      right.windowStartAcceptedTimeSec,
    ) ||
    left.windowStartRevision !== right.windowStartRevision ||
    !Object.is(left.acceptedDurationSec, right.acceptedDurationSec) ||
    left.acceptedStepCount !== right.acceptedStepCount ||
    !optionalAutoregulationControlEqual(
      left.windowControl,
      right.windowControl,
    ) ||
    !optionalAutoregulationControlEqual(
      left.desiredControl,
      right.desiredControl,
    )
  )
    return false;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    if (
      !Object.is(
        left.perfusionPressureTimeIntegralMmHgSecByTerritory[territoryId],
        right.perfusionPressureTimeIntegralMmHgSecByTerritory[territoryId],
      )
    )
      return false;
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      if (
        !Object.is(
          left.qmTimeIntegralMlByTerritoryLayer[territoryId][layerId],
          right.qmTimeIntegralMlByTerritoryLayer[territoryId][layerId],
        )
      )
        return false;
    }
  }
  return true;
}

function optionalAutoregulationControlEqual(
  left: CoronaryAutoregulationWindowControlV3 | null,
  right: CoronaryAutoregulationWindowControlV3 | null,
): boolean {
  if (left === null || right === null) return left === right;
  if (left.controlId !== right.controlId) return false;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      if (
        left.demandScaleByTerritoryLayer[territoryId][layerId] !==
          right.demandScaleByTerritoryLayer[territoryId][layerId] ||
        left.hyperemia01ByTerritoryLayer[territoryId][layerId] !==
          right.hyperemia01ByTerritoryLayer[territoryId][layerId] ||
        left.effectiveMinimumToneScaleByTerritoryLayer[territoryId][layerId] !==
          right.effectiveMinimumToneScaleByTerritoryLayer[territoryId][layerId]
      )
        return false;
    }
  }
  return true;
}

function isNonadvancingLimiterError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "composed integrated requested endpoint must advance" ||
      error.message ===
        "composed integrated coronary-capped step must be positive")
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  checkpointMainWireIntegratedModelStandard66V1,
  createMainWireIntegratedModelStandard66CheckpointContextV1,
  restoreMainWireIntegratedModelStandard66V1,
  type MainWireIntegratedModelStandard66CheckpointContextV1,
  type MainWireIntegratedModelStandard66CheckpointV1,
  type RestoredMainWireIntegratedModelStandard66CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
import {
  decodeMainWireIntegratedModelStandard66CanonicalCheckpointV3,
  encodeMainWireIntegratedModelStandard66CanonicalCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CanonicalCheckpointV3";
import {
  mergeMainWireIntegratedModelStandard66SelectedValuesV1,
  partitionMainWireIntegratedModelStandard66OutputIdsV1,
  type MainWireIntegratedModelStandard66OutputIdV1,
  type MainWireIntegratedModelStandard66OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  projectMainWireAorticRecoveredRootPortSelectedValuesV1,
  type MainWireAorticRecoveredRootPortOutputIdV1,
  type MainWireAorticRecoveredRootPortOutputValueV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  type MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
  type MainWireAcceptedEndpointCommitForAnalysisV1,
  type MainWireAcceptedEndpointProjectionAdvanceForAnalysisV1,
  type MainWireFlatModelOwnedProjectionAdvanceV1,
  type MainWireTypedExecutionPlanInitializationV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  MainWireSelectedAorticPortSessionExtensionV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-model-standard66-typed-authority-session-v1" as const;

export type MainWireIntegratedModelStandard66SelectedOutputProjectionAdvanceV1 =
  Readonly<{
    advance: MainWireFlatModelOwnedProjectionAdvanceV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard66OutputValueV1>
    > | null;
    outputProjectionDurationMs: number;
  }>;

export type MainWireIntegratedModelStandard66AcceptedEndpointProjectionV1 =
  Readonly<{
    commit: MainWireAcceptedEndpointCommitForAnalysisV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard66OutputValueV1>
    >;
  }>;

export type MainWireIntegratedModelStandard66AcceptedEndpointProjectionAdvanceV1 =
  MainWireAcceptedEndpointProjectionAdvanceForAnalysisV1<
    MainWireIntegratedModelStandard66AcceptedEndpointProjectionV1
  >;

type RestoredStandard66V1 =
  RestoredMainWireIntegratedModelStandard66CheckpointV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;

type Standard66AcceptedStateV1 =
  MainWireIntegratedModelSelectedAorticOutflowFixtureV1["cold"]["acceptedState"];

/**
 * Public selected-model owner. Numerical advancement remains entirely in the
 * established typed-authority Session; this thin boundary only composes the
 * Standard66 output registry and exact object checkpoint around the same
 * selected extension instance admitted by the base transaction owner.
 */
export class MainWireIntegratedModelStandard66TypedAuthoritySessionV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly standard66SessionId =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #selectedAorticPortExtension:
    MainWireSelectedAorticPortSessionExtensionV1;
  readonly #checkpointContext:
    MainWireIntegratedModelStandard66CheckpointContextV1;

  private constructor(
    runtime: MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
    selectedAorticPortExtension:
      MainWireSelectedAorticPortSessionExtensionV1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    restored: RestoredStandard66V1 | null = null,
    warmAcceptedState: Standard66AcceptedStateV1 | null = null,
  ) {
    if (restored !== null && warmAcceptedState !== null) {
      throw new Error(
        "Standard66 Session cannot restore and warm-start the same epoch",
      );
    }
    super(
      runtime,
      warmAcceptedState ?? restored?.acceptedState ?? runtime.cold.acceptedState,
      warmAcceptedState !== null
        ? "hemodynamic-input-warm-start"
        : restored === null
          ? "cold"
          : "standard-exact-checkpoint-restore",
      null,
      restored ?? undefined,
      executionPlanInitialization,
      selectedAorticPortExtension,
    );
    this.#selectedAorticPortExtension = selectedAorticPortExtension;
    this.#checkpointContext =
      createMainWireIntegratedModelStandard66CheckpointContextV1({
        fixedAssemblyId: runtime.fixedAssemblyId,
        selectedAorticOutflowProfile:
          runtime.runtime.vascular.selectedAorticOutflowProfile,
      });
  }

  static override async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard66TypedAuthoritySessionV1> {
    const runtime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    return new MainWireIntegratedModelStandard66TypedAuthoritySessionV1(
      runtime,
      extension,
      executionPlanInitialization,
    );
  }

  /**
   * Starts a new selected-model research epoch from this exact accepted root.
   * Numerical state is adapted by the established warm-start law. Beat
   * accumulators, instantaneous readback, and predictor history intentionally
   * restart so no derived result spans an authored-input edit.
   */
  override async warmStartWithHemodynamicResearchInputs(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
    ventricularContractilityScale?: number,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3,
  ): Promise<MainWireIntegratedModelStandard66TypedAuthoritySessionV1> {
    if (
      ventricularContractilityScale === undefined
      || mechanismResearchInputs === undefined
    ) {
      throw new Error(
        "Standard66 research warm start requires an explicit complete target mechanism and contractility bundle",
      );
    }
    const targetRuntime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const acceptedState =
      this.warmStartSelectedAorticAcceptedStateV1(targetRuntime);
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    return new MainWireIntegratedModelStandard66TypedAuthoritySessionV1(
      targetRuntime,
      extension,
      executionPlanInitialization,
      null,
      acceptedState,
    );
  }

  /**
   * Historical Standard65 restore entrypoints remain disabled for this owner.
   * Call restoreStandard66ExactCheckpoint so both exact owners are restored.
   */
  static override async restoreStandardExactCheckpoint(
    _checkpoint: unknown,
    _inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    _ventricularContractilityScale = 1,
    _executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    _mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<never> {
    throw new Error(
      "Standard65 restore cannot own the selected model; use restoreStandard66ExactCheckpoint",
    );
  }

  static override async restoreCanonicalBinary(
    _checkpointBytes: Uint8Array,
    _inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    _ventricularContractilityScale = 1,
    _mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    _executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
  ): Promise<never> {
    throw new Error(
      "Standard65 restore cannot own the selected model; use restoreStandard66CanonicalBinaryV3",
    );
  }

  /** Restores numerical state and both exact beat-analysis owners. */
  static async restoreStandard66ExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard66TypedAuthoritySessionV1> {
    const runtime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const restored = await restoreMainWireIntegratedModelStandard66V1(
      standard66RestoreContextV1(runtime),
      checkpoint,
    );
    return new MainWireIntegratedModelStandard66TypedAuthoritySessionV1(
      runtime,
      restored.selectedAorticPortExtension,
      executionPlanInitialization,
      restored,
    );
  }

  /** Restores the complete exact model plus seed-identical predictor history. */
  static async restoreStandard66CanonicalBinaryV3(
    checkpointBytes: Uint8Array,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
  ): Promise<MainWireIntegratedModelStandard66TypedAuthoritySessionV1> {
    // Start both ownership branches before the first await: decode snapshots
    // caller bytes synchronously, while fixture construction validates and
    // owns the caller's input tuples synchronously.
    const checkpointPromise =
      decodeMainWireIntegratedModelStandard66CanonicalCheckpointV3(
        checkpointBytes,
      );
    const runtime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const checkpoint = await checkpointPromise;
    const restored = await restoreMainWireIntegratedModelStandard66V1(
      standard66RestoreContextV1(runtime),
      checkpoint.standard66Checkpoint,
    );
    const session = new MainWireIntegratedModelStandard66TypedAuthoritySessionV1(
      runtime,
      restored.selectedAorticPortExtension,
      executionPlanInitialization,
      restored,
    );
    session.restoreSelectedAorticCoupledPredictorV1(
      checkpoint.coupledPredictor,
    );
    return session;
  }

  projectCurrentAcceptedStandard66ValuesV1(
    outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
  ): Readonly<
    Record<string, MainWireIntegratedModelStandard66OutputValueV1>
  > {
    const partition = partitionMainWireIntegratedModelStandard66OutputIdsV1(
      outputIds,
    );
    const baseValues = super.projectCurrentAcceptedValuesV1(
      partition.baseOutputIds,
    );
    const selectedAorticPortValues =
      this.#projectCurrentSelectedAorticPortValuesV1(
        partition.selectedAorticPortOutputIds,
      );
    return mergeMainWireIntegratedModelStandard66SelectedValuesV1({
      outputIds,
      baseValues,
      selectedAorticPortValues,
    });
  }

  advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
  ): MainWireIntegratedModelStandard66SelectedOutputProjectionAdvanceV1 {
    // Validate and partition before opening any numerical candidate.
    const partition = partitionMainWireIntegratedModelStandard66OutputIdsV1(
      outputIds,
    );
    const baseProjection =
      super.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        targetTimeSec,
        partition.baseOutputIds,
      );
    if (baseProjection.projectedValues === null) {
      return Object.freeze({
        advance: baseProjection.advance,
        projectedValues: null,
        outputProjectionDurationMs:
          baseProjection.outputProjectionDurationMs,
      });
    }
    const selectedProjectionStartedAt = performance.now();
    const selectedAorticPortValues =
      this.#projectCurrentSelectedAorticPortValuesV1(
        partition.selectedAorticPortOutputIds,
      );
    const projectedValues =
      mergeMainWireIntegratedModelStandard66SelectedValuesV1({
        outputIds,
        baseValues: baseProjection.projectedValues,
        selectedAorticPortValues,
      });
    return Object.freeze({
      advance: baseProjection.advance,
      projectedValues,
      outputProjectionDurationMs:
        baseProjection.outputProjectionDurationMs
        + (performance.now() - selectedProjectionStartedAt),
    });
  }

  /**
   * Research/analysis projection of every accepted commit inside a requested
   * boundary interval. This is deliberately separate from exact frames and
   * the Model Surface: it adds no model output or persisted state identity.
   */
  advanceToPresentationTimeWithStandard66AcceptedEndpointProjectionForAnalysisV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
  ): MainWireIntegratedModelStandard66AcceptedEndpointProjectionAdvanceV1 {
    // Reject an invalid selection before a numerical candidate can open.
    partitionMainWireIntegratedModelStandard66OutputIdsV1(outputIds);
    return super
      .advanceToPresentationTimeWithAcceptedEndpointProjectionForAnalysisV1(
        targetTimeSec,
        (commit) => Object.freeze({
          commit,
          projectedValues: this.projectCurrentAcceptedStandard66ValuesV1(
            outputIds,
          ),
        }),
      );
  }

  /**
   * Creates the object wrapper only. The 76-f64 instantaneous readback is not
   * persisted; selected completed-beat analysis is the sole extension state.
   */
  async checkpointStandard66Exact():
    Promise<MainWireIntegratedModelStandard66CheckpointV1> {
    // Both calls below are synchronous captures. Do not await the base digest
    // before owning the selected sidecar, or a concurrent caller could splice
    // two accepted epochs into one wrapper.
    const baseCheckpointPromise =
      this.checkpointSelectedAorticBaseStandardExactV1();
    const selectedExactBeatState =
      this.#selectedAorticPortExtension.checkpointExactBeatStateV1();
    return checkpointMainWireIntegratedModelStandard66V1(
      this.#checkpointContext,
      await baseCheckpointPromise,
      selectedExactBeatState,
    );
  }

  /** Adds predictor history to the object checkpoint in one canonical image. */
  async checkpointStandard66CanonicalBinaryV3(): Promise<Uint8Array> {
    // Both captures are synchronous. In particular, predictor history must be
    // owned before awaiting either Standard checkpoint digest.
    const standard66CheckpointPromise = this.checkpointStandard66Exact();
    const coupledPredictor =
      this.checkpointSelectedAorticCoupledPredictorV1();
    return encodeMainWireIntegratedModelStandard66CanonicalCheckpointV3(
      await standard66CheckpointPromise,
      coupledPredictor,
    );
  }

  #projectCurrentSelectedAorticPortValuesV1(
    outputIds: readonly MainWireAorticRecoveredRootPortOutputIdV1[],
  ): Readonly<Record<string, MainWireAorticRecoveredRootPortOutputValueV1>> {
    const acceptedClock = this.selectedAorticAcceptedClockV1();
    const completedBeatMetrics =
      this.#selectedAorticPortExtension.latestCompletedBeatMetricsV1();
    const projected =
      this.#selectedAorticPortExtension.withAcceptedReadbackV3(
        acceptedClock,
        (acceptedNumericalReadbackV3) =>
          projectMainWireAorticRecoveredRootPortSelectedValuesV1(
            Object.freeze({
              acceptedTimeSec: acceptedClock.acceptedTimeSec,
              acceptedNumericalReadbackV3,
              completedBeatMetrics,
            }),
            outputIds,
          ),
      );
    return projected
      ?? projectMainWireAorticRecoveredRootPortSelectedValuesV1(
        Object.freeze({
          acceptedTimeSec: acceptedClock.acceptedTimeSec,
          acceptedNumericalReadbackV3: null,
          completedBeatMetrics,
        }),
        outputIds,
      );
  }
}

function standard66RestoreContextV1(
  runtime: MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
) {
  const base =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
      runtime,
    );
  return Object.freeze({
    base: Object.freeze({
      ...base,
      mechanismResearchInputs: runtime.mechanismResearchInputs,
    }),
    selected: createMainWireIntegratedModelStandard66CheckpointContextV1({
      fixedAssemblyId: runtime.fixedAssemblyId,
      selectedAorticOutflowProfile:
        runtime.runtime.vascular.selectedAorticOutflowProfile,
    }),
  });
}

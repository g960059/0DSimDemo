import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  checkpointMainWireIntegratedModelStandard67V1,
  createMainWireIntegratedModelStandard67CheckpointContextV1,
  restoreMainWireIntegratedModelStandard67V1,
  type MainWireIntegratedModelStandard67CheckpointContextV1,
  type MainWireIntegratedModelStandard67CheckpointV1,
  type RestoredMainWireIntegratedModelStandard67CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard67CheckpointV1";
import {
  decodeMainWireIntegratedModelStandard67CanonicalCheckpointV3,
  encodeMainWireIntegratedModelStandard67CanonicalCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelStandard67CanonicalCheckpointV3";
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
  createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
  type MainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
  type MainWireFlatModelOwnedProjectionAdvanceV1,
  type MainWireTypedExecutionPlanInitializationV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  MainWireSelectedAorticPortSessionExtensionV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-model-standard67-typed-authority-session-v1" as const;

export type MainWireIntegratedModelStandard67SelectedOutputProjectionAdvanceV1 =
  Readonly<{
    advance: MainWireFlatModelOwnedProjectionAdvanceV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard66OutputValueV1>
    > | null;
    outputProjectionDurationMs: number;
  }>;

type RestoredStandard67V1 =
  RestoredMainWireIntegratedModelStandard67CheckpointV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;

/**
 * Public selected-model owner. Numerical advancement remains entirely in the
 * established typed-authority Session; this thin boundary only composes the
 * unchanged Standard66 exact-output meanings and a new exact checkpoint
 * identity around the Standard67 construction. Analysis outputs remain
 * outside this exact frame.
 */
export class MainWireIntegratedModelStandard67TypedAuthoritySessionV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly standard67SessionId =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #selectedAorticPortExtension:
    MainWireSelectedAorticPortSessionExtensionV1;
  readonly #checkpointContext:
    MainWireIntegratedModelStandard67CheckpointContextV1;

  private constructor(
    runtime: MainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
    selectedAorticPortExtension:
      MainWireSelectedAorticPortSessionExtensionV1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    restored: RestoredStandard67V1 | null = null,
  ) {
    super(
      runtime,
      restored?.acceptedState ?? runtime.cold.acceptedState,
      restored === null ? "cold" : "standard-exact-checkpoint-restore",
      null,
      restored ?? undefined,
      executionPlanInitialization,
      selectedAorticPortExtension,
    );
    this.#selectedAorticPortExtension = selectedAorticPortExtension;
    this.#checkpointContext =
      createMainWireIntegratedModelStandard67CheckpointContextV1({
        fixedAssemblyId: runtime.fixedAssemblyId,
        selectedAorticOutflowProfile:
          runtime.runtime.vascular.selectedAorticOutflowProfile,
        algebraicProximalArterialRootsProfile:
          runtime.runtime.vascular.algebraicProximalArterialRootsProfile,
      });
  }

  static override async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard67TypedAuthoritySessionV1> {
    const runtime =
      createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    return new MainWireIntegratedModelStandard67TypedAuthoritySessionV1(
      runtime,
      extension,
      executionPlanInitialization,
    );
  }

  /**
   * Historical Standard65 restore entrypoints remain disabled for this owner.
   * Call restoreStandard67ExactCheckpoint so both exact owners are restored.
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
      "Standard65 restore cannot own the selected model; use restoreStandard67ExactCheckpoint",
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
      "Standard65 restore cannot own the selected model; use restoreStandard67CanonicalBinaryV3",
    );
  }

  /** Restores numerical state and the selected construction identity. */
  static async restoreStandard67ExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard67TypedAuthoritySessionV1> {
    const runtime =
      createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const restored = await restoreMainWireIntegratedModelStandard67V1(
      standard67RestoreContextV1(runtime),
      checkpoint,
    );
    return new MainWireIntegratedModelStandard67TypedAuthoritySessionV1(
      runtime,
      restored.selectedAorticPortExtension,
      executionPlanInitialization,
      restored,
    );
  }

  /** Restores the complete exact model plus seed-identical predictor history. */
  static async restoreStandard67CanonicalBinaryV3(
    checkpointBytes: Uint8Array,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
  ): Promise<MainWireIntegratedModelStandard67TypedAuthoritySessionV1> {
    // Start both ownership branches before the first await: decode snapshots
    // caller bytes synchronously, while fixture construction validates and
    // owns the caller's input tuples synchronously.
    const checkpointPromise =
      decodeMainWireIntegratedModelStandard67CanonicalCheckpointV3(
        checkpointBytes,
      );
    const runtime =
      createMainWireIntegratedModelAlgebraicProximalRootsFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const checkpoint = await checkpointPromise;
    const restored = await restoreMainWireIntegratedModelStandard67V1(
      standard67RestoreContextV1(runtime),
      checkpoint.standard67Checkpoint,
    );
    const session = new MainWireIntegratedModelStandard67TypedAuthoritySessionV1(
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

  projectCurrentAcceptedStandard67ValuesV1(
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

  advanceToPresentationTimeWithStandard67SelectedOutputProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
  ): MainWireIntegratedModelStandard67SelectedOutputProjectionAdvanceV1 {
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

  /** Creates the object wrapper without persisting instantaneous readback. */
  async checkpointStandard67Exact():
    Promise<MainWireIntegratedModelStandard67CheckpointV1> {
    this.#selectedAorticPortExtension.assertReadyForExactCheckpointV1();
    const baseCheckpointPromise =
      this.checkpointSelectedAorticBaseStandardExactV1();
    return checkpointMainWireIntegratedModelStandard67V1(
      this.#checkpointContext,
      await baseCheckpointPromise,
    );
  }

  /** Adds predictor history to the object checkpoint in one canonical image. */
  async checkpointStandard67CanonicalBinaryV3(): Promise<Uint8Array> {
    // Both captures are synchronous. In particular, predictor history must be
    // owned before awaiting either Standard checkpoint digest.
    const standard67CheckpointPromise = this.checkpointStandard67Exact();
    const coupledPredictor =
      this.checkpointSelectedAorticCoupledPredictorV1();
    return encodeMainWireIntegratedModelStandard67CanonicalCheckpointV3(
      await standard67CheckpointPromise,
      coupledPredictor,
    );
  }

  #projectCurrentSelectedAorticPortValuesV1(
    outputIds: readonly MainWireAorticRecoveredRootPortOutputIdV1[],
  ): Readonly<Record<string, MainWireAorticRecoveredRootPortOutputValueV1>> {
    const acceptedClock = this.selectedAorticAcceptedClockV1();
    const projected =
      this.#selectedAorticPortExtension.withAcceptedReadbackV3(
        acceptedClock,
        (acceptedNumericalReadbackV3) =>
          projectMainWireAorticRecoveredRootPortSelectedValuesV1(
            Object.freeze({
              acceptedTimeSec: acceptedClock.acceptedTimeSec,
              acceptedNumericalReadbackV3,
            }),
            outputIds,
          ),
      );
    return projected
      ?? projectMainWireAorticRecoveredRootPortSelectedValuesV1(
        Object.freeze({
          acceptedTimeSec: acceptedClock.acceptedTimeSec,
          acceptedNumericalReadbackV3: null,
        }),
        outputIds,
      );
  }
}

function standard67RestoreContextV1(
  runtime: MainWireIntegratedModelAlgebraicProximalRootsFixtureV1,
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
    selected: createMainWireIntegratedModelStandard67CheckpointContextV1({
      fixedAssemblyId: runtime.fixedAssemblyId,
      selectedAorticOutflowProfile:
        runtime.runtime.vascular.selectedAorticOutflowProfile,
      algebraicProximalArterialRootsProfile:
        runtime.runtime.vascular.algebraicProximalArterialRootsProfile,
    }),
  });
}

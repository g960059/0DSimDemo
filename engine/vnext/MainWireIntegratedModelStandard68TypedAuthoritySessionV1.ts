import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  checkpointMainWireIntegratedModelStandard68V1,
  restoreMainWireIntegratedModelStandard68V1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import type {
  RestoredMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  mergeMainWireIntegratedModelStandard68SelectedValuesV1,
  partitionMainWireIntegratedModelStandard68OutputIdsV1,
  type MainWireIntegratedModelStandard68OutputIdV1,
  type MainWireIntegratedModelStandard68OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
  type MainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  forkMainWireIntegratedModelAtFixedTbvV3,
  forkMainWireIntegratedModelResponsiveStarlingV3,
} from "@/engine/myocardium/MainWireIntegratedModelFixedTbvForkV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
  type MainWireFlatModelOwnedProjectionAdvanceV1,
  type MainWireTypedExecutionPlanInitializationV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-model-standard68-typed-authority-session-v1" as const;

type RestoredStandard68V1 =
  RestoredMainWireIntegratedModelStandardCheckpointV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;

export type MainWireIntegratedModelStandard68SelectedOutputProjectionAdvanceV1 =
  Readonly<{
    advance: MainWireFlatModelOwnedProjectionAdvanceV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard68OutputValueV1>
    > | null;
    outputProjectionDurationMs: number;
  }>;

/**
 * Exact owner for the rounded-ejection construction. The numerical topology
 * remains the source Main Wire topology, so no selected-aortic readback
 * extension or additional continuous state is required.
 */
export class MainWireIntegratedModelStandard68TypedAuthoritySessionV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly standard68SessionId =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #runtime: MainWireIntegratedModelRoundedEjectionFixtureV1;
  readonly #executionPlanInitialization:
    MainWireTypedExecutionPlanInitializationV1 | undefined;

  private constructor(
    runtime: MainWireIntegratedModelRoundedEjectionFixtureV1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    restored: RestoredStandard68V1 | null = null,
    analysisForkAcceptedState: ReturnType<
      typeof forkMainWireIntegratedModelAtFixedTbvV3
    > | null = null,
  ) {
    super(
      asSourceTopologyRuntimeV3(runtime),
      analysisForkAcceptedState
        ?? restored?.acceptedState
        ?? runtime.cold.acceptedState,
      analysisForkAcceptedState !== null
        ? "fixed-tbv-protocol-fork"
        : restored === null
          ? "cold"
          : "standard-exact-checkpoint-restore",
      null,
      analysisForkAcceptedState === null ? restored ?? undefined : undefined,
      executionPlanInitialization,
      null,
      analysisForkAcceptedState ?? undefined,
    );
    this.#runtime = runtime;
    this.#executionPlanInitialization = executionPlanInitialization;
  }

  static override async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard68TypedAuthoritySessionV1> {
    return new MainWireIntegratedModelStandard68TypedAuthoritySessionV1(
      createMainWireIntegratedModelRoundedEjectionFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      ),
      executionPlanInitialization,
    );
  }

  static override async restoreStandardExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard68TypedAuthoritySessionV1> {
    return this.restoreStandard68ExactCheckpoint(
      checkpoint,
      inputs,
      ventricularContractilityScale,
      executionPlanInitialization,
      mechanismResearchInputs,
    );
  }

  static async restoreStandard68ExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard68TypedAuthoritySessionV1> {
    const runtime = createMainWireIntegratedModelRoundedEjectionFixtureV1(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const restored = await restoreMainWireIntegratedModelStandard68V1(
      standard68RestoreContextV1(runtime),
      checkpoint,
    );
    return new MainWireIntegratedModelStandard68TypedAuthoritySessionV1(
      runtime,
      executionPlanInitialization,
      restored,
    );
  }

  override async warmStartWithHemodynamicResearchInputs(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard68TypedAuthoritySessionV1> {
    const targetRuntime = createMainWireIntegratedModelRoundedEjectionFixtureV1(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const acceptedState = warmStartMainWireIntegratedModelV3({
      source: this.currentAcceptedState(),
      sourceRuntime: asSourceTopologyRuntimeV3(this.#runtime),
      targetRuntime: asSourceTopologyRuntimeV3(targetRuntime),
    });
    return new MainWireIntegratedModelStandard68TypedAuthoritySessionV1(
      targetRuntime,
      executionPlanInitialization,
      null,
      acceptedState,
    );
  }

  projectCurrentAcceptedStandard68ValuesV1(
    outputIds: readonly MainWireIntegratedModelStandard68OutputIdV1[],
  ): Readonly<
    Record<string, MainWireIntegratedModelStandard68OutputValueV1>
  > {
    const partition = partitionMainWireIntegratedModelStandard68OutputIdsV1(
      outputIds,
    );
    return mergeMainWireIntegratedModelStandard68SelectedValuesV1({
      outputIds,
      baseValues: super.projectCurrentAcceptedValuesV1(
        partition.baseOutputIds,
      ),
      completedBeatMetrics: this.observe().completedBeatMetrics,
    });
  }

  advanceToPresentationTimeWithStandard68SelectedOutputProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelStandard68OutputIdV1[],
  ): MainWireIntegratedModelStandard68SelectedOutputProjectionAdvanceV1 {
    const partition = partitionMainWireIntegratedModelStandard68OutputIdsV1(
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
    const startedAt = performance.now();
    const projectedValues =
      mergeMainWireIntegratedModelStandard68SelectedValuesV1({
        outputIds,
        baseValues: baseProjection.projectedValues,
        completedBeatMetrics: this.observe().completedBeatMetrics,
      });
    return Object.freeze({
      advance: baseProjection.advance,
      projectedValues,
      outputProjectionDurationMs:
        baseProjection.outputProjectionDurationMs +
        (performance.now() - startedAt),
    });
  }

  async checkpointStandard68Exact():
    Promise<MainWireIntegratedModelStandard68CheckpointV1> {
    return checkpointMainWireIntegratedModelStandard68V1(
      this.#runtime.roundedEjectionAssemblyId,
      await super.checkpointStandardExact(),
    );
  }

  forkAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelStandard68TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard68TypedAuthoritySessionV1(
      this.#runtime,
      this.#executionPlanInitialization,
      null,
      forkMainWireIntegratedModelAtFixedTbvV3({
        source: this.currentAcceptedState(),
        runtime: this.#runtime,
        targetGlobalTotalBloodVolumeMl,
      }),
    );
  }

  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelStandard68TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard68TypedAuthoritySessionV1(
      this.#runtime,
      this.#executionPlanInitialization,
      null,
      forkMainWireIntegratedModelResponsiveStarlingV3({
        source: this.currentAcceptedState(),
        runtime: this.#runtime,
        targetGlobalTotalBloodVolumeMl,
      }),
    );
  }
}

/**
 * The rounded construction retains the source V3 circulation/runtime shape.
 * Its exact matched-alpha descriptor makes the optional per-wall decay map
 * narrower at the type boundary, but does not alter any runtime field consumed
 * by the source-topology authority.
 */
function asSourceTopologyRuntimeV3(
  runtime: MainWireIntegratedModelRoundedEjectionFixtureV1,
): MainWireIntegratedModelRuntimeV3 {
  return runtime as unknown as MainWireIntegratedModelRuntimeV3;
}

function standard68RestoreContextV1(
  runtime: MainWireIntegratedModelRoundedEjectionFixtureV1,
) {
  return Object.freeze({
    base: Object.freeze({
      ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        runtime,
      ),
      mechanismResearchInputs: runtime.mechanismResearchInputs,
    }),
    roundedEjectionAssemblyId: runtime.roundedEjectionAssemblyId,
  });
}

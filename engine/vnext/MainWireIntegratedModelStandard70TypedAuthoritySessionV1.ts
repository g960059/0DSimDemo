import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  checkpointMainWireIntegratedModelStandard70V1,
  restoreMainWireIntegratedModelStandard70V1,
  type MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type {
  RestoredMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  mergeMainWireIntegratedModelStandard68SelectedValuesV1,
  partitionMainWireIntegratedModelStandard68OutputIdsV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import {
  mergeMainWireIntegratedModelStandard70SelectedValuesV1,
  partitionMainWireIntegratedModelStandard70OutputIdsV1,
  type MainWireIntegratedModelStandard70OutputIdV1,
  type MainWireIntegratedModelStandard70OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
  type MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
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

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-model-standard70-typed-authority-session-v1" as const;

type RestoredStandard70V1 =
  RestoredMainWireIntegratedModelStandardCheckpointV2<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;

export type MainWireIntegratedModelStandard70SelectedOutputProjectionAdvanceV1 =
  Readonly<{
    advance: MainWireFlatModelOwnedProjectionAdvanceV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard70OutputValueV1>
    > | null;
    outputProjectionDurationMs: number;
  }>;

/** Exact owner for the fixed algebraic pulmonary-root construction. */
export class MainWireIntegratedModelStandard70TypedAuthoritySessionV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly standard70SessionId =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #runtime: MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1;
  readonly #executionPlanInitialization:
    MainWireTypedExecutionPlanInitializationV1 | undefined;

  private constructor(
    runtime: MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    restored: RestoredStandard70V1 | null = null,
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
  ): Promise<MainWireIntegratedModelStandard70TypedAuthoritySessionV1> {
    return new MainWireIntegratedModelStandard70TypedAuthoritySessionV1(
      createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
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
  ): Promise<MainWireIntegratedModelStandard70TypedAuthoritySessionV1> {
    return this.restoreStandard70ExactCheckpoint(
      checkpoint,
      inputs,
      ventricularContractilityScale,
      executionPlanInitialization,
      mechanismResearchInputs,
    );
  }

  static async restoreStandard70ExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  ): Promise<MainWireIntegratedModelStandard70TypedAuthoritySessionV1> {
    const runtime = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const restored = await restoreMainWireIntegratedModelStandard70V1(
      standard70RestoreContextV1(runtime),
      checkpoint,
    );
    return new MainWireIntegratedModelStandard70TypedAuthoritySessionV1(
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
  ): Promise<MainWireIntegratedModelStandard70TypedAuthoritySessionV1> {
    const targetRuntime =
      createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const acceptedState = warmStartMainWireIntegratedModelV3({
      source: this.currentAcceptedState(),
      sourceRuntime: asSourceTopologyRuntimeV3(this.#runtime),
      targetRuntime: asSourceTopologyRuntimeV3(targetRuntime),
    });
    return new MainWireIntegratedModelStandard70TypedAuthoritySessionV1(
      targetRuntime,
      executionPlanInitialization,
      null,
      acceptedState,
    );
  }

  projectCurrentAcceptedStandard70ValuesV1(
    outputIds: readonly MainWireIntegratedModelStandard70OutputIdV1[],
  ): Readonly<Record<string, MainWireIntegratedModelStandard70OutputValueV1>> {
    const standard70Partition =
      partitionMainWireIntegratedModelStandard70OutputIdsV1(outputIds);
    const standard68Partition =
      partitionMainWireIntegratedModelStandard68OutputIdsV1(
        standard70Partition.standard68OutputIds,
      );
    const standard68Values =
      mergeMainWireIntegratedModelStandard68SelectedValuesV1({
      outputIds: standard70Partition.standard68OutputIds,
      baseValues: super.projectCurrentAcceptedValuesV1(
        standard68Partition.baseOutputIds,
      ),
      completedBeatMetrics: this.observe().completedBeatMetrics,
    });
    return mergeMainWireIntegratedModelStandard70SelectedValuesV1({
      outputIds,
      standard68Values,
      completedBeatMetrics: this.observe().completedBeatMetrics,
    });
  }

  advanceToPresentationTimeWithStandard70SelectedOutputProjectionV1(
    targetTimeSec: number,
    outputIds: readonly MainWireIntegratedModelStandard70OutputIdV1[],
  ): MainWireIntegratedModelStandard70SelectedOutputProjectionAdvanceV1 {
    const standard70Partition =
      partitionMainWireIntegratedModelStandard70OutputIdsV1(outputIds);
    const standard68Partition =
      partitionMainWireIntegratedModelStandard68OutputIdsV1(
        standard70Partition.standard68OutputIds,
      );
    const baseProjection =
      super.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        targetTimeSec,
        standard68Partition.baseOutputIds,
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
    const completedBeatMetrics = this.observe().completedBeatMetrics;
    const standard68Values =
      mergeMainWireIntegratedModelStandard68SelectedValuesV1({
      outputIds: standard70Partition.standard68OutputIds,
      baseValues: baseProjection.projectedValues,
      completedBeatMetrics,
    });
    const projectedValues = mergeMainWireIntegratedModelStandard70SelectedValuesV1({
      outputIds,
      standard68Values,
      completedBeatMetrics,
    });
    return Object.freeze({
      advance: baseProjection.advance,
      projectedValues,
      outputProjectionDurationMs:
        baseProjection.outputProjectionDurationMs
        + (performance.now() - startedAt),
    });
  }

  async checkpointStandard70Exact():
    Promise<MainWireIntegratedModelStandard70CheckpointV1> {
    return checkpointMainWireIntegratedModelStandard70V1(
      this.#runtime.algebraicPulmonaryRootAssemblyId,
      await super.checkpointStandardExact(),
    );
  }

  forkAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelStandard70TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard70TypedAuthoritySessionV1(
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
  ): MainWireIntegratedModelStandard70TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard70TypedAuthoritySessionV1(
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

function asSourceTopologyRuntimeV3(
  runtime: MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
): MainWireIntegratedModelRuntimeV3 {
  return runtime as unknown as MainWireIntegratedModelRuntimeV3;
}

function standard70RestoreContextV1(
  runtime: MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1,
) {
  return Object.freeze({
    base: Object.freeze({
      ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        runtime,
      ),
      mechanismResearchInputs: runtime.mechanismResearchInputs,
    }),
    algebraicPulmonaryRootAssemblyId:
      runtime.algebraicPulmonaryRootAssemblyId,
  });
}

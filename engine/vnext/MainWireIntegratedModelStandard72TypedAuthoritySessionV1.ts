import {
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { assertMainWireUnextendedFiveWallMechanicsDomainV1 as assertOriginalDomain } from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  checkpointMainWireIntegratedModelStandard72V1,
  restoreMainWireIntegratedModelStandard72V1,
  type MainWireIntegratedModelStandard72CheckpointV1,
  type RestoredMainWireIntegratedModelStandard72V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
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
  createMainWireIntegratedModelStandard71FixtureV1,
  MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
  type MainWireIntegratedModelStandard71FixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
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

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_TYPED_AUTHORITY_SESSION_V1_ID =
  "main-wire-integrated-model-standard72-typed-authority-session-v1" as const;

type RestoredStandard72V1 =
  RestoredMainWireIntegratedModelStandard72V1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >;

export type MainWireIntegratedModelStandard72SelectedOutputProjectionAdvanceV1 =
  Readonly<{
    advance: MainWireFlatModelOwnedProjectionAdvanceV1;
    projectedValues: Readonly<
      Record<string, MainWireIntegratedModelStandard70OutputValueV1>
    > | null;
    outputProjectionDurationMs: number;
  }>;

/** Released72's fixed physical construction and history-preserving checkpoint. */
export class MainWireIntegratedModelStandard72TypedAuthoritySessionV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly standard72SessionId =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD72_TYPED_AUTHORITY_SESSION_V1_ID;

  readonly #runtime: MainWireIntegratedModelStandard71FixtureV1;
  readonly #executionPlanInitialization:
    MainWireTypedExecutionPlanInitializationV1 | undefined;

  private constructor(
    runtime: MainWireIntegratedModelStandard71FixtureV1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    restored: RestoredStandard72V1 | null = null,
    analysisForkAcceptedState: ReturnType<
      typeof forkMainWireIntegratedModelAtFixedTbvV3
    > | null = null,
  ) {
    assertOriginalDomain(runtime.mechanismResearchInputs.chamberMechanics);
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
    if (restored !== null && analysisForkAcceptedState === null) {
      this.restoreCoupledPredictorContinuationV1(restored.coupledPredictor);
    }
  }

  static override async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
  ): Promise<MainWireIntegratedModelStandard72TypedAuthoritySessionV1> {
    return new MainWireIntegratedModelStandard72TypedAuthoritySessionV1(
      createMainWireIntegratedModelStandard71FixtureV1(
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
      MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
  ): Promise<MainWireIntegratedModelStandard72TypedAuthoritySessionV1> {
    return this.restoreStandard72ExactCheckpoint(
      checkpoint,
      inputs,
      ventricularContractilityScale,
      executionPlanInitialization,
      mechanismResearchInputs,
    );
  }

  static async restoreStandard72ExactCheckpoint(
    checkpoint: unknown,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
  ): Promise<MainWireIntegratedModelStandard72TypedAuthoritySessionV1> {
    const runtime = createMainWireIntegratedModelStandard71FixtureV1(
      inputs,
      ventricularContractilityScale,
      mechanismResearchInputs,
    );
    const restored = await restoreMainWireIntegratedModelStandard72V1(
      standard72RestoreContextV1(runtime),
      checkpoint,
    );
    return new MainWireIntegratedModelStandard72TypedAuthoritySessionV1(
      runtime,
      executionPlanInitialization,
      restored,
    );
  }

  override async checkpointStandardExact(): Promise<never> {
    throw new Error("Standard72 requires checkpointStandard72Exact, including continuation history");
  }

  override async checkpointCanonicalBinary(): Promise<never> {
    throw new Error("Standard72 does not emit legacy canonical checkpoints");
  }

  static override async restoreCanonicalBinary(
    ..._args: Parameters<typeof MainWireIntegratedTypedAuthoritySessionV1.restoreCanonicalBinary>
  ): Promise<never> {
    throw new Error("Standard72 requires restoreStandard72ExactCheckpoint");
  }

  override async warmStartWithHemodynamicResearchInputs(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
    ventricularContractilityScale = 1,
    executionPlanInitialization?: MainWireTypedExecutionPlanInitializationV1,
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3 =
      MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1,
  ): Promise<MainWireIntegratedModelStandard72TypedAuthoritySessionV1> {
    const targetRuntime =
      createMainWireIntegratedModelStandard71FixtureV1(
        inputs,
        ventricularContractilityScale,
        mechanismResearchInputs,
      );
    const acceptedState = warmStartMainWireIntegratedModelV3({
      source: this.currentAcceptedState(),
      sourceRuntime: asSourceTopologyRuntimeV3(this.#runtime),
      targetRuntime: asSourceTopologyRuntimeV3(targetRuntime),
    });
    return new MainWireIntegratedModelStandard72TypedAuthoritySessionV1(
      targetRuntime,
      executionPlanInitialization,
      null,
      acceptedState,
    );
  }

  projectCurrentAcceptedStandard70ValuesV1(
    outputIds: readonly MainWireIntegratedModelStandard70OutputIdV1[],
  ): Readonly<Record<string, MainWireIntegratedModelStandard70OutputValueV1>> {
    const standard72Partition =
      partitionMainWireIntegratedModelStandard70OutputIdsV1(outputIds);
    const standard68Partition =
      partitionMainWireIntegratedModelStandard68OutputIdsV1(
        standard72Partition.standard68OutputIds,
      );
    const standard68Values =
      mergeMainWireIntegratedModelStandard68SelectedValuesV1({
      outputIds: standard72Partition.standard68OutputIds,
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
  ): MainWireIntegratedModelStandard72SelectedOutputProjectionAdvanceV1 {
    const standard72Partition =
      partitionMainWireIntegratedModelStandard70OutputIdsV1(outputIds);
    const standard68Partition =
      partitionMainWireIntegratedModelStandard68OutputIdsV1(
        standard72Partition.standard68OutputIds,
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
      outputIds: standard72Partition.standard68OutputIds,
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

  async checkpointStandard72Exact():
    Promise<MainWireIntegratedModelStandard72CheckpointV1> {
    // Capture both at the same accepted epoch, before either digest yields.
    // Taking a checkpoint must not reset the live solver or change its path.
    const predictor = this.checkpointCoupledPredictorContinuationV1();
    const base = super.checkpointStandardExact();
    return checkpointMainWireIntegratedModelStandard72V1(
      this.#runtime.standard71AssemblyId,
      await base,
      predictor,
    );
  }

  forkAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelStandard72TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard72TypedAuthoritySessionV1(
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
  ): MainWireIntegratedModelStandard72TypedAuthoritySessionV1 {
    return new MainWireIntegratedModelStandard72TypedAuthoritySessionV1(
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
  runtime: MainWireIntegratedModelStandard71FixtureV1,
): MainWireIntegratedModelRuntimeV3 {
  return runtime as unknown as MainWireIntegratedModelRuntimeV3;
}

function standard72RestoreContextV1(
  runtime: MainWireIntegratedModelStandard71FixtureV1,
) {
  return Object.freeze({
    base: Object.freeze({
      ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        runtime,
      ),
      mechanismResearchInputs: runtime.mechanismResearchInputs,
    }),
    standard71AssemblyId:
      runtime.standard71AssemblyId,
  });
}

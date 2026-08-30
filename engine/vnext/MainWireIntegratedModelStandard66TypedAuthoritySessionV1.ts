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
  type MainWireIntegratedModelStandard66CheckpointContextV1,
  type MainWireIntegratedModelStandard66CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
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
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  type MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
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
  ) {
    super(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      null,
      undefined,
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
   * A Standard66 restore must validate and restore both exact owners. Until
   * that boundary exists, inherited Standard65 restore entrypoints fail
   * closed instead of silently constructing the historical model.
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
      "Standard66 exact restore is unavailable; Standard65 restore cannot own the selected model",
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
      "Standard66 canonical restore is unavailable; Standard65 restore cannot own the selected model",
    );
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

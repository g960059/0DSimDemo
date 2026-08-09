import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  validateMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmStepContextV3,
  type MainWireIntegratedModelStepFailureReasonV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRuntimeV3,
  mainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  forkMainWireIntegratedModelAtFixedTbvV3,
  forkMainWireIntegratedModelResponsiveStarlingV3,
} from "@/engine/myocardium/MainWireIntegratedModelFixedTbvForkV3";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  checkpointMainWireIntegratedModelStandardV1,
  restoreMainWireIntegratedModelStandardV1,
  type MainWireIntegratedModelStandardCheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV1";
import {
  respiratoryExternalPressuresV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";

export const MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID =
  "main-wire-integrated-model-session-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3 = 0.002 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3 = 16 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3 =
  "integrated-v3-live-presentation" as const;

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;
type AdvanceFailureReason =
  | MainWireIntegratedModelStepFailureReasonV3
  | "substep-budget-exhausted"
  | "candidate-time-did-not-advance";

export type MainWireIntegratedModelObservationV3 = Readonly<{
  source:
    | "cold"
    | "presentation-target"
    | "operational-checkpoint-restore"
    | "standard-exact-checkpoint-restore"
    | "fixed-tbv-protocol-fork"
    | "hemodynamic-input-warm-start";
  acceptedState: AcceptedState;
  /** Null at cold start and after either checkpoint restore. */
  lastAcceptedStep: SuccessfulStep | null;
  /** Algebraic environment values at the exact accepted clock. */
  runtimeSignals: Readonly<{
    pleuralPressureMmHg: number;
    alveolarPressureMmHg: number;
  }>;
  /** Latest full atrial-capture-to-capture beat; null until one completes. */
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

/** One internal accepted commit. It is diagnostic state, not a sample. */
export type MainWireIntegratedModelSubstepRecordV3 = Readonly<{
  acceptedRevision: number;
  acceptedTimeSec: number;
  landedOnPresentationTarget: boolean;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
}>;

export type MainWireIntegratedModelPresentationAdvanceV3 =
  | Readonly<{
      status: "advanced";
      presentationTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
      acceptedRevisionSpanFromPrevious: number;
      internalAcceptedSubstepCount: number;
      boundaryClippedSubstepCount: number;
      substeps: readonly MainWireIntegratedModelSubstepRecordV3[];
      observation: MainWireIntegratedModelObservationV3;
    }>
  | Readonly<{
      status: "already-at-target";
      presentationTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
      internalAcceptedSubstepCount: 0;
      observation: MainWireIntegratedModelObservationV3;
    }>
  | Readonly<{
      status: "failed";
      reason: AdvanceFailureReason;
      message: string;
      acceptedTimeSec: number;
      acceptedRevision: number;
      partiallyAdvanced: boolean;
      internalAcceptedSubstepCount: number;
      boundaryClippedSubstepCount?: number;
      substeps?: readonly MainWireIntegratedModelSubstepRecordV3[];
      requestedPresentationTimeSec: number;
    }>;

/** Pure ordinal-to-time map. The presentation ordinal is the sample identity. */
export function mainWireIntegratedModelPresentationTargetTimeSecV3(
  presentationOrdinal: number,
): number {
  if (!Number.isSafeInteger(presentationOrdinal) || presentationOrdinal < 0) {
    throw new Error("Main Wire Integrated V3 presentation ordinal is invalid");
  }
  return presentationOrdinal * MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_DT_SEC_V3;
}

/**
 * Numerical session for the exact integrated V3 runtime. It owns model state
 * and accepted-boundary readback behind the registered Studio adapter.
 */
export class MainWireIntegratedModelSessionV3 {
  readonly sessionId = MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID;

  private readonly runtime: MainWireIntegratedModelRuntimeV3;
  private readonly provider: MainWireNormalAdultFiveWallProviderV1;
  private readonly rhythmInput: MainWireIntegratedComposedRhythmStepContextV3;
  private readonly dynamicMechanicalSupportConfig:
    MainWireIntegratedModelRuntimeV3["config"];
  private acceptedState: AcceptedState;
  private lastAcceptedStep: SuccessfulStep | null;
  private lastPresentationObservation: MainWireIntegratedModelObservationV3;
  private readonly beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  private completedBeatMetrics:
    MainWireIntegratedModelCompletedBeatMetricsV3 | null = null;

  private constructor(
    runtime: MainWireIntegratedModelRuntimeV3,
    acceptedState: AcceptedState,
    observationSource:
      MainWireIntegratedModelObservationV3["source"],
    exactBeatState?: Readonly<{
      beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
      completedBeatMetrics:
        MainWireIntegratedModelCompletedBeatMetricsV3 | null;
    }>,
  ) {
    validateMainWireIntegratedModelAcceptedStateV3(
      acceptedState,
      { configuration: runtime.rhythm.configuration },
      runtime.profile,
      runtime.config,
    );
    this.runtime = runtime;
    this.provider = runtime.provider;
    this.rhythmInput = Object.freeze({
      configuration: runtime.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    });
    this.dynamicMechanicalSupportConfig = runtime.config;
    this.acceptedState = acceptedState;
    this.lastAcceptedStep = null;
    this.beatAccumulator = exactBeatState?.beatAccumulator
      ?? new MainWireIntegratedModelBeatAccumulatorV3();
    this.completedBeatMetrics = exactBeatState?.completedBeatMetrics ?? null;
    this.lastPresentationObservation = observation(
      observationSource,
      acceptedState,
      null,
      runtime,
      this.completedBeatMetrics,
    );
  }

  static async create(
    hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireIntegratedModelSessionV3> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      hemodynamicResearchInputs,
      ventricularContractilityScale,
    );
    return new MainWireIntegratedModelSessionV3(
      runtime,
      runtime.cold.acceptedState,
      "cold",
    );
  }

  static async restoreOperationalCheckpoint(
    checkpoint: unknown,
    hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireIntegratedModelSessionV3> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      hemodynamicResearchInputs,
      ventricularContractilityScale,
    );
    const acceptedState = await restoreMainWireIntegratedModelV3(
      mainWireIntegratedModelCheckpointContextV3(
        runtime,
        runtime.cold.acceptedState,
      ),
      checkpoint,
    );
    return new MainWireIntegratedModelSessionV3(
      runtime,
      acceptedState,
      "operational-checkpoint-restore",
    );
  }

  /**
   * Restores the Standard exact checkpoint, including the accepted-substep
   * beat accumulator and last completed beat exposed by the exact output ABI.
   */
  static async restoreStandardExactCheckpoint(
    checkpoint: unknown,
    hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireIntegratedModelSessionV3> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      hemodynamicResearchInputs,
      ventricularContractilityScale,
    );
    const restored = await restoreMainWireIntegratedModelStandardV1(
      mainWireIntegratedModelCheckpointContextV3(
        runtime,
        runtime.cold.acceptedState,
      ),
      checkpoint,
    );
    return new MainWireIntegratedModelSessionV3(
      runtime,
      restored.acceptedState,
      "standard-exact-checkpoint-restore",
      restored,
    );
  }

  currentAcceptedState(): AcceptedState {
    return this.acceptedState;
  }

  observe(): MainWireIntegratedModelObservationV3 {
    return this.lastPresentationObservation;
  }

  /**
   * Starts a new fixture epoch from the current accepted boundary. This is an
   * atomic candidate session for Studio controls: failure leaves the source
   * session untouched, while success preserves its accepted revision/time.
   */
  async warmStartWithHemodynamicResearchInputs(
    hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireIntegratedModelSessionV3> {
    const targetRuntime = await createMainWireIntegratedModelRuntimeV3(
      hemodynamicResearchInputs,
      ventricularContractilityScale,
    );
    const acceptedState = warmStartMainWireIntegratedModelV3({
      source: this.acceptedState,
      sourceRuntime: this.runtime,
      targetRuntime,
    });
    return new MainWireIntegratedModelSessionV3(
      targetRuntime,
      acceptedState,
      "hemodynamic-input-warm-start",
    );
  }

  /**
   * Creates an isolated numerical branch for an ephemeral fixed-TBV protocol.
   * The source session and its accepted readback remain untouched.
   */
  forkAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelSessionV3 {
    return new MainWireIntegratedModelSessionV3(
      this.runtime,
      forkMainWireIntegratedModelAtFixedTbvV3({
        source: this.acceptedState,
        runtime: this.runtime,
        targetGlobalTotalBloodVolumeMl,
      }),
      "fixed-tbv-protocol-fork",
    );
  }

  /**
   * Isolated fixed-tone continuation branch used only by the responsive
   * Starling analysis. It is never a durable checkpoint or live authority.
   */
  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(
    targetGlobalTotalBloodVolumeMl: number,
  ): MainWireIntegratedModelSessionV3 {
    return new MainWireIntegratedModelSessionV3(
      this.runtime,
      forkMainWireIntegratedModelResponsiveStarlingV3({
        source: this.acceptedState,
        runtime: this.runtime,
        targetGlobalTotalBloodVolumeMl,
      }),
      "fixed-tbv-protocol-fork",
    );
  }

  async checkpointOperational():
  Promise<MainWireIntegratedModelCheckpointV3> {
    return checkpointMainWireIntegratedModelV3(
      this.checkpointContext(),
      this.acceptedState,
    );
  }

  /**
   * Captures every state element that affects the Standard exact output ABI.
   * The legacy operational checkpoint intentionally remains unchanged.
   */
  async checkpointStandardExact():
  Promise<MainWireIntegratedModelStandardCheckpointV1> {
    return checkpointMainWireIntegratedModelStandardV1(
      this.checkpointContext(),
      this.acceptedState,
      this.beatAccumulator,
      this.completedBeatMetrics,
    );
  }

  /**
   * Advance exactly to the requested presentation time. Boundary-limited
   * commits remain internal and never become presentation observations.
   */
  advanceToPresentationTime(
    targetTimeSec: number,
  ): MainWireIntegratedModelPresentationAdvanceV3 {
    if (!Number.isFinite(targetTimeSec) || targetTimeSec < 0) {
      throw new Error(
        "Main Wire Integrated V3 presentation target time is invalid",
      );
    }
    if (targetTimeSec < this.acceptedState.acceptedTimeSec) {
      throw new Error(
        "Main Wire Integrated V3 presentation target precedes accepted time",
      );
    }
    if (targetTimeSec === this.acceptedState.acceptedTimeSec) {
      return Object.freeze({
        status: "already-at-target" as const,
        presentationTimeSec: targetTimeSec,
        acceptedTimeSec: this.acceptedState.acceptedTimeSec,
        acceptedRevision: this.acceptedState.revision,
        internalAcceptedSubstepCount: 0 as const,
        observation: this.lastPresentationObservation,
      });
    }

    const previousPresentationRevision =
      this.lastPresentationObservation.acceptedState.revision;
    let substepCount = 0;
    const substeps: MainWireIntegratedModelSubstepRecordV3[] = [];

    while (this.acceptedState.acceptedTimeSec !== targetTimeSec) {
      if (substepCount >= MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3) {
        return this.failedAdvance(
          "substep-budget-exhausted",
          "Main Wire Integrated V3 interval exhausted its substep budget",
          targetTimeSec,
          substeps,
        );
      }

      let limit;
      try {
        limit = limitMainWireIntegratedModelCandidateTimeV3(
          this.acceptedState,
          targetTimeSec,
          {
            configuration: this.rhythmInput.configuration,
            externalAfNextBoundaryTimeSec:
              this.rhythmInput.externalAfNextBoundaryTimeSec,
          },
          this.runtime.profile,
          this.dynamicMechanicalSupportConfig,
        );
      } catch (error) {
        if (!isNonadvancingLimiterError(error)) throw error;
        return this.failedAdvance(
          "candidate-time-did-not-advance",
          errorMessage(error),
          targetTimeSec,
          substeps,
        );
      }

      if (!(limit.candidateTimeSec > this.acceptedState.acceptedTimeSec)) {
        return this.failedAdvance(
          "candidate-time-did-not-advance",
          "Main Wire Integrated V3 candidate time did not advance",
          targetTimeSec,
          substeps,
        );
      }

      const result = stepMainWireIntegratedModelV3(
        this.provider,
        this.acceptedState,
        {
          candidateTimeSec: limit.candidateTimeSec,
          coronary: this.runtime.coronaryStepInput,
          rhythm: this.rhythmInput,
          dynamicMechanicalSupport: Object.freeze({
            config: this.dynamicMechanicalSupportConfig,
            profile: this.runtime.profile,
          }),
        },
      );
      if (result.converged === false) {
        return this.failedAdvance(
          result.reason,
          result.message,
          targetTimeSec,
          substeps,
        );
      }
      if (result.acceptedState.acceptedTimeSec !== limit.candidateTimeSec) {
        return this.failedAdvance(
          "integrated-promotion-rejected",
          "Main Wire Integrated V3 accepted clock differs from candidate",
          targetTimeSec,
          substeps,
        );
      }

      this.acceptedState = result.acceptedState;
      this.lastAcceptedStep = result;
      this.completedBeatMetrics = this.beatAccumulator.accept(result)
        ?? this.completedBeatMetrics;
      substepCount += 1;
      substeps.push(Object.freeze({
        acceptedRevision: result.acceptedState.revision,
        acceptedTimeSec: result.acceptedState.acceptedTimeSec,
        landedOnPresentationTarget:
          result.acceptedState.acceptedTimeSec === targetTimeSec,
        clippedByCoronaryWindow: limit.clippedByCoronaryWindow,
        clippedByRhythmBoundary: limit.clippedByRhythmBoundary,
        rhythmBoundaryTimeSec: limit.rhythmBoundaryTimeSec,
        rhythmBoundaryOwners: Object.freeze([
          ...limit.rhythmBoundaryOwners,
        ]),
      }));
    }

    if (this.acceptedState.acceptedTimeSec !== targetTimeSec) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire Integrated V3 did not land on its presentation target",
        targetTimeSec,
        substeps,
      );
    }
    if (this.lastAcceptedStep === null) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire Integrated V3 advanced without accepted-step readback",
        targetTimeSec,
        substeps,
      );
    }
    const acceptedRevisionSpanFromPrevious =
      this.acceptedState.revision - previousPresentationRevision;
    if (acceptedRevisionSpanFromPrevious < 1) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "Main Wire Integrated V3 accepted revision did not advance",
        targetTimeSec,
        substeps,
      );
    }

    const nextObservation = observation(
      "presentation-target",
      this.acceptedState,
      this.lastAcceptedStep,
      this.runtime,
      this.completedBeatMetrics,
    );
    this.lastPresentationObservation = nextObservation;
    const frozenSubsteps = Object.freeze([...substeps]);
    return Object.freeze({
      status: "advanced" as const,
      presentationTimeSec: targetTimeSec,
      acceptedTimeSec: this.acceptedState.acceptedTimeSec,
      acceptedRevision: this.acceptedState.revision,
      acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount: substepCount,
      boundaryClippedSubstepCount:
        substeps.filter((substep) => !substep.landedOnPresentationTarget).length,
      substeps: frozenSubsteps,
      observation: nextObservation,
    });
  }

  private checkpointContext() {
    const base = mainWireIntegratedModelCheckpointContextV3(
      this.runtime,
      this.acceptedState,
    );
    return Object.freeze({
      ...base,
      provider: this.provider,
      dynamicMechanicalSupportConfig: this.dynamicMechanicalSupportConfig,
    });
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
    return Object.freeze({
      status: "failed" as const,
      reason,
      message,
      acceptedTimeSec: this.acceptedState.acceptedTimeSec,
      acceptedRevision: this.acceptedState.revision,
      partiallyAdvanced: substeps.length > 0,
      internalAcceptedSubstepCount: substeps.length,
      boundaryClippedSubstepCount:
        substeps.filter((substep) => !substep.landedOnPresentationTarget).length,
      substeps: Object.freeze([...substeps]),
      requestedPresentationTimeSec: targetTimeSec,
    });
  }
}

function observation(
  source: MainWireIntegratedModelObservationV3["source"],
  acceptedState: AcceptedState,
  lastAcceptedStep: SuccessfulStep | null,
  runtime: MainWireIntegratedModelRuntimeV3,
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
    completedBeatMetrics,
  });
}

function isNonadvancingLimiterError(error: unknown): boolean {
  return error instanceof Error
    && (
      error.message === "composed integrated requested endpoint must advance"
      || error.message
        === "composed integrated coronary-capped step must be positive"
    );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
  createMainWireIntegratedLaneBootstrapV1,
  mainWireIntegratedLaneCheckpointContextV1,
  type MainWireIntegratedLaneBootstrapV1,
} from "@/engine/myocardium/MainWireIntegratedLaneBootstrapV1";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_INTEGRATED_LANE_SESSION_V1_ID =
  "main-wire-integrated-lane-session-v1" as const;

export const INTEGRATED_LANE_PRESENTATION_DT_SEC_V1 = 0.002 as const;
export const INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1 = 16 as const;
export const INTEGRATED_LANE_PRESENTATION_COVERAGE_V1 =
  "integrated-v3-live-presentation" as const;

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;
type AdvanceFailureReason =
  | MainWireIntegratedModelStepFailureReasonV3
  | "substep-budget-exhausted"
  | "candidate-time-did-not-advance";

export type MainWireIntegratedLaneObservationV1 = Readonly<{
  source:
    | "cold"
    | "presentation-target"
    | "operational-checkpoint-restore";
  acceptedState: AcceptedState;
  /** Null at cold start and after operational checkpoint restore. */
  lastAcceptedStep: SuccessfulStep | null;
}>;

/** One internal accepted commit. It is diagnostic state, not a sample. */
export type MainWireIntegratedLaneSubstepRecordV1 = Readonly<{
  acceptedRevision: number;
  acceptedTimeSec: number;
  landedOnPresentationTarget: boolean;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
}>;

export type MainWireIntegratedLanePresentationAdvanceV1 =
  | Readonly<{
      status: "advanced";
      presentationTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
      acceptedRevisionSpanFromPrevious: number;
      internalAcceptedSubstepCount: number;
      boundaryClippedSubstepCount: number;
      substeps: readonly MainWireIntegratedLaneSubstepRecordV1[];
      observation: MainWireIntegratedLaneObservationV1;
    }>
  | Readonly<{
      status: "already-at-target";
      presentationTimeSec: number;
      acceptedTimeSec: number;
      acceptedRevision: number;
      internalAcceptedSubstepCount: 0;
      observation: MainWireIntegratedLaneObservationV1;
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
      substeps?: readonly MainWireIntegratedLaneSubstepRecordV1[];
      requestedPresentationTimeSec: number;
    }>;

/** Pure ordinal-to-time map. The presentation ordinal is the sample identity. */
export function integratedLanePresentationTargetTimeSecV1(
  presentationOrdinal: number,
): number {
  if (!Number.isSafeInteger(presentationOrdinal) || presentationOrdinal < 0) {
    throw new Error("integrated lane presentation ordinal is invalid");
  }
  return presentationOrdinal * INTEGRATED_LANE_PRESENTATION_DT_SEC_V1;
}

/**
 * Numerical session for the fixed integrated-lane bootstrap. It owns model
 * state and readback only; it is not a registered Studio model adapter.
 */
export class MainWireIntegratedLaneSessionV1 {
  readonly sessionId = MAIN_WIRE_INTEGRATED_LANE_SESSION_V1_ID;

  private readonly bootstrap: MainWireIntegratedLaneBootstrapV1;
  private readonly provider: MainWireNormalAdultFiveWallProviderV1;
  private readonly rhythmInput: MainWireIntegratedComposedRhythmStepContextV3;
  private acceptedState: AcceptedState;
  private lastAcceptedStep: SuccessfulStep | null;
  private lastPresentationObservation: MainWireIntegratedLaneObservationV1;

  private constructor(
    bootstrap: MainWireIntegratedLaneBootstrapV1,
    acceptedState: AcceptedState,
    observationSource:
      MainWireIntegratedLaneObservationV1["source"],
  ) {
    validateMainWireIntegratedModelAcceptedStateV3(
      acceptedState,
      { configuration: bootstrap.rhythm.configuration },
      bootstrap.profile,
      bootstrap.config,
    );
    this.bootstrap = bootstrap;
    this.provider = bootstrap.provider;
    this.rhythmInput = Object.freeze({
      configuration: bootstrap.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    });
    this.acceptedState = acceptedState;
    this.lastAcceptedStep = null;
    this.lastPresentationObservation = observation(
      observationSource,
      acceptedState,
      null,
    );
  }

  static async create(): Promise<MainWireIntegratedLaneSessionV1> {
    const bootstrap = await createMainWireIntegratedLaneBootstrapV1();
    return new MainWireIntegratedLaneSessionV1(
      bootstrap,
      bootstrap.cold.acceptedState,
      "cold",
    );
  }

  static async restoreOperationalCheckpoint(
    checkpoint: unknown,
  ): Promise<MainWireIntegratedLaneSessionV1> {
    const bootstrap = await createMainWireIntegratedLaneBootstrapV1();
    const acceptedState = await restoreMainWireIntegratedModelV3(
      mainWireIntegratedLaneCheckpointContextV1(
        bootstrap,
        bootstrap.cold.acceptedState,
      ),
      checkpoint,
    );
    return new MainWireIntegratedLaneSessionV1(
      bootstrap,
      acceptedState,
      "operational-checkpoint-restore",
    );
  }

  currentAcceptedState(): AcceptedState {
    return this.acceptedState;
  }

  observe(): MainWireIntegratedLaneObservationV1 {
    return this.lastPresentationObservation;
  }

  async checkpointOperational():
  Promise<MainWireIntegratedModelCheckpointV3> {
    return checkpointMainWireIntegratedModelV3(
      this.checkpointContext(),
      this.acceptedState,
    );
  }

  /**
   * Advance exactly to the requested presentation time. Boundary-limited
   * commits remain internal and never become presentation observations.
   */
  advanceToPresentationTime(
    targetTimeSec: number,
  ): MainWireIntegratedLanePresentationAdvanceV1 {
    if (!Number.isFinite(targetTimeSec) || targetTimeSec < 0) {
      throw new Error("integrated lane presentation target time is invalid");
    }
    if (targetTimeSec < this.acceptedState.acceptedTimeSec) {
      throw new Error(
        "integrated lane presentation target precedes accepted model time",
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
    const substeps: MainWireIntegratedLaneSubstepRecordV1[] = [];

    while (this.acceptedState.acceptedTimeSec !== targetTimeSec) {
      if (substepCount >= INTEGRATED_LANE_MAX_SUBSTEPS_PER_INTERVAL_V1) {
        return this.failedAdvance(
          "substep-budget-exhausted",
          "integrated lane presentation interval exhausted its substep budget",
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
          this.bootstrap.profile,
          this.bootstrap.config,
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
          "integrated lane candidate time did not advance",
          targetTimeSec,
          substeps,
        );
      }

      const result = stepMainWireIntegratedModelV3(
        this.provider,
        this.acceptedState,
        {
          candidateTimeSec: limit.candidateTimeSec,
          coronary: this.bootstrap.coronaryStepInput,
          rhythm: this.rhythmInput,
          dynamicMechanicalSupport: this.bootstrap.dynamicMechanicalSupport,
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
          "integrated lane accepted clock did not equal the limited candidate",
          targetTimeSec,
          substeps,
        );
      }

      this.acceptedState = result.acceptedState;
      this.lastAcceptedStep = result;
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
        "integrated lane did not land exactly on its presentation target",
        targetTimeSec,
        substeps,
      );
    }
    if (this.lastAcceptedStep === null) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "integrated lane advanced without an accepted-step readback",
        targetTimeSec,
        substeps,
      );
    }
    const acceptedRevisionSpanFromPrevious =
      this.acceptedState.revision - previousPresentationRevision;
    if (acceptedRevisionSpanFromPrevious < 1) {
      return this.failedAdvance(
        "integrated-promotion-rejected",
        "integrated lane accepted revision did not advance",
        targetTimeSec,
        substeps,
      );
    }

    const nextObservation = observation(
      "presentation-target",
      this.acceptedState,
      this.lastAcceptedStep,
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
    const base = mainWireIntegratedLaneCheckpointContextV1(
      this.bootstrap,
      this.acceptedState,
    );
    return Object.freeze({ ...base, provider: this.provider });
  }

  private failedAdvance(
    reason: AdvanceFailureReason,
    message: string,
    targetTimeSec: number,
    substeps: readonly MainWireIntegratedLaneSubstepRecordV1[],
  ): Extract<
    MainWireIntegratedLanePresentationAdvanceV1,
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
  source: MainWireIntegratedLaneObservationV1["source"],
  acceptedState: AcceptedState,
  lastAcceptedStep: SuccessfulStep | null,
): MainWireIntegratedLaneObservationV1 {
  return Object.freeze({ source, acceptedState, lastAcceptedStep });
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

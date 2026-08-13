import {
  respiratoryExternalPressuresV1,
} from "@/engine/core/circulationGraphKernelV1";
import type {
  AcceptedStateAuthorityV1,
  AcceptedStateValidatorV1,
} from "@/engine/core/acceptedStateAuthorityV1";
import {
  restoreDynamicMechanicalSupportAcceptedStateV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  createMainWireIntegratedModelRuntimeV3,
  mainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3,
  type MainWireIntegratedModelObservationV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
  type MainWireIntegratedModelSubstepRecordV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  checkpointMainWireIntegratedModelStandardV1,
  restoreMainWireIntegratedModelStandardV1,
  type MainWireIntegratedModelStandardCheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV1";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  validateMainWireIntegratedModelAcceptedStateV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmStepContextV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepFailureReasonV3,
  type MainWireIntegratedModelStepResultV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  decodeCanonicalFlatCheckpointV1,
  encodeCanonicalFlatDataIntoV1,
  encodeCanonicalFlatCheckpointV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  createMainWireAcceptedScalarSlotManifestV1,
} from "@/engine/vnext/MainWireAcceptedScalarSlotsV1";
import {
  createMainWireAcceptedTypedBoundaryBindingV1,
  limitMainWireAcceptedTypedCandidateTimeV1,
  readMainWireAcceptedTypedClockV1,
  stageMainWireAcceptedTypedAuthoredScheduleCandidateV1,
  stageMainWireAcceptedTypedCalciumCandidateV1,
  stageMainWireAcceptedTypedClockCandidateV1,
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
  TransactionalScalarSlotsV1,
  type TransactionalScalarSlotsReportV1,
  type TransactionalScalarSlotsSnapshotV1,
} from "@/engine/vnext/TransactionalScalarSlotsV1";
import type {
  TransactionalTypedStateCandidateCursorV1,
  TransactionalTypedStateCurrentCursorV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

export const MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_SESSION_V1_ID =
  "main-wire-flat-authoritative-reference-session-v1" as const;

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<WallState>;
type AdvanceFailureReason =
  | MainWireIntegratedModelStepFailureReasonV3
  | "substep-budget-exhausted"
  | "candidate-time-did-not-advance";

export type MainWireFlatReferenceAcceptedStateAuthorityFactoryV1 = (
  initialState: AcceptedState,
  validate: AcceptedStateValidatorV1<AcceptedState>,
  ownDecoded: AcceptedStateValidatorV1<AcceptedState>,
) => AcceptedStateAuthorityV1<AcceptedState>;

type ExactBeatState = Readonly<{
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

/**
 * Phase 1b reference Session. It deliberately owns a copy of the accepted
 * transaction loop instead of injecting a hook into the registered exact
 * Session. That keeps every released artifact byte-identical while this
 * replacement authority is evaluated out of production.
 *
 * The current solver still produces object candidates. Every successful
 * candidate must nevertheless survive projection into the inactive complete
 * typed image, model-owned rehydration, and validation before the next step
 * can observe it.
 */
export class MainWireFlatAuthoritativeReferenceSessionV1 {
  readonly sessionId = MAIN_WIRE_FLAT_AUTHORITATIVE_REFERENCE_SESSION_V1_ID;

  readonly #runtime: MainWireIntegratedModelRuntimeV3;
  readonly #provider: MainWireNormalAdultFiveWallProviderV1;
  readonly #rhythmInput: MainWireIntegratedComposedRhythmStepContextV3;
  readonly #dynamicMechanicalSupportConfig:
    MainWireIntegratedModelRuntimeV3["config"];
  readonly #authority: AcceptedStateAuthorityV1<AcceptedState>;
  readonly #typedAuthority:
    MainWireAcceptedTypedStateAuthorityV1 | null;
  readonly #typedBoundaryBinding:
    MainWireAcceptedTypedBoundaryBindingV1 | null;
  readonly #directRetainedContinuousSlots: readonly number[];
  readonly #scalarSlots: TransactionalScalarSlotsV1<AcceptedState>;
  #acceptedState: AcceptedState;
  #lastAcceptedStep: SuccessfulStep | null;
  #lastPresentationObservation: MainWireIntegratedModelObservationV3;
  readonly #beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  #completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;

  private constructor(
    runtime: MainWireIntegratedModelRuntimeV3,
    acceptedState: AcceptedState,
    observationSource: MainWireIntegratedModelObservationV3["source"],
    authorityFactory: MainWireFlatReferenceAcceptedStateAuthorityFactoryV1,
    exactBeatState?: ExactBeatState,
  ) {
    const validateAcceptedState: AcceptedStateValidatorV1<AcceptedState> =
      (candidate) => {
        const acceptedCandidate = candidate as AcceptedState;
        validateMainWireIntegratedModelAcceptedStateV3(
          acceptedCandidate,
          { configuration: runtime.rhythm.configuration },
          runtime.profile,
          runtime.config,
        );
        return acceptedCandidate;
      };
    const ownDecodedAcceptedState: AcceptedStateValidatorV1<AcceptedState> =
      (candidate) => {
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
    validateAcceptedState(acceptedState);
    this.#runtime = runtime;
    this.#provider = runtime.provider;
    this.#rhythmInput = Object.freeze({
      configuration: runtime.rhythm.configuration,
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: null,
    });
    this.#dynamicMechanicalSupportConfig = runtime.config;
    this.#authority = authorityFactory(
      acceptedState,
      validateAcceptedState,
      ownDecodedAcceptedState,
    );
    this.#typedAuthority =
      this.#authority instanceof MainWireAcceptedTypedStateAuthorityV1
      ? this.#authority
      : null;
    this.#typedBoundaryBinding = this.#typedAuthority === null
      ? null
      : createMainWireAcceptedTypedBoundaryBindingV1(
          this.#typedAuthority.manifest(),
        );
    this.#directRetainedContinuousSlots = this.#typedBoundaryBinding === null
      ? Object.freeze([])
      : Object.freeze([
          ...this.#typedBoundaryBinding.directContinuousSlots,
          ...(runtime.rhythm.configuration
            .authoredVentricularPacingReplay === null
            ? []
            : this.#typedBoundaryBinding
              .authoredVentricularPacingContinuousSlots),
          ...(runtime.rhythm.configuration.atrialSource.mode === "regular"
            ? this.#typedBoundaryBinding.regularAtrialSourceContinuousSlots
            : []),
          ...this.#typedBoundaryBinding.postSolverContinuousSlots,
        ]);
    this.#acceptedState = this.#authority.current();
    this.#scalarSlots = new TransactionalScalarSlotsV1(
      createMainWireAcceptedScalarSlotManifestV1(
        runtime.cold.acceptedState,
      ),
      this.#acceptedState,
    );
    this.#lastAcceptedStep = null;
    this.#beatAccumulator = exactBeatState?.beatAccumulator
      ?? new MainWireIntegratedModelBeatAccumulatorV3();
    this.#completedBeatMetrics = exactBeatState?.completedBeatMetrics ?? null;
    this.#lastPresentationObservation = observation(
      observationSource,
      this.#authority.snapshot(),
      null,
      runtime,
      this.#completedBeatMetrics,
    );
  }

  static async create(
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireFlatAuthoritativeReferenceSessionV1> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
    );
    return new MainWireFlatAuthoritativeReferenceSessionV1(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      typedAuthorityFactory(runtime.cold.acceptedState),
    );
  }

  /** Test-only failure seam kept entirely outside the registered model. */
  static async createWithAcceptedStateAuthorityForTestV1(
    authorityFactory: MainWireFlatReferenceAcceptedStateAuthorityFactoryV1,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireFlatAuthoritativeReferenceSessionV1> {
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
    );
    return new MainWireFlatAuthoritativeReferenceSessionV1(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      authorityFactory,
    );
  }

  static async restoreCanonicalBinary(
    checkpointBytes: Uint8Array,
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3 =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ventricularContractilityScale = 1,
  ): Promise<MainWireFlatAuthoritativeReferenceSessionV1> {
    const checkpoint = await decodeCanonicalFlatCheckpointV1(checkpointBytes);
    const runtime = await createMainWireIntegratedModelRuntimeV3(
      inputs,
      ventricularContractilityScale,
    );
    const restored = await restoreMainWireIntegratedModelStandardV1(
      mainWireIntegratedModelCheckpointContextV3(
        runtime,
        runtime.cold.acceptedState,
      ),
      checkpoint,
    );
    return new MainWireFlatAuthoritativeReferenceSessionV1(
      runtime,
      restored.acceptedState,
      "standard-exact-checkpoint-restore",
      typedAuthorityFactory(runtime.cold.acceptedState),
      restored,
    );
  }

  currentAcceptedState(): AcceptedState {
    return this.#authority.snapshot();
  }

  observe(): MainWireIntegratedModelObservationV3 {
    return this.#lastPresentationObservation;
  }

  /**
   * Advances exactly to one presentation boundary. Boundary-limited solver
   * commits stay internal; typed-image authority commits occur after every
   * accepted substep, not merely after presentation delivery.
   */
  advanceToPresentationTime(
    targetTimeSec: number,
  ): MainWireIntegratedModelPresentationAdvanceV3 {
    this.#acceptedState = this.#authority.current();
    let acceptedClock = this.currentAcceptedClock();
    if (!Number.isFinite(targetTimeSec) || targetTimeSec < 0) {
      throw new Error(
        "Main Wire flat reference presentation target time is invalid",
      );
    }
    if (targetTimeSec < acceptedClock.acceptedTimeSec) {
      throw new Error(
        "Main Wire flat reference target precedes accepted time",
      );
    }
    if (targetTimeSec === acceptedClock.acceptedTimeSec) {
      return Object.freeze({
        status: "already-at-target" as const,
        presentationTimeSec: targetTimeSec,
        acceptedTimeSec: acceptedClock.acceptedTimeSec,
        acceptedRevision: acceptedClock.revision,
        internalAcceptedSubstepCount: 0 as const,
        observation: this.#lastPresentationObservation,
      });
    }

    const previousPresentationRevision =
      this.#lastPresentationObservation.acceptedState.revision;
    let substepCount = 0;
    const substeps: MainWireIntegratedModelSubstepRecordV3[] = [];

    while (acceptedClock.acceptedTimeSec !== targetTimeSec) {
      if (
        substepCount
          >= MAIN_WIRE_INTEGRATED_MODEL_MAX_SUBSTEPS_PER_INTERVAL_V3
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
      let directCurrentCursor:
        TransactionalTypedStateCurrentCursorV1 | null = null;
      let directCandidateCursor:
        TransactionalTypedStateCandidateCursorV1 | null = null;
      if (this.#typedAuthority !== null) {
        try {
          const current = this.#typedAuthority.currentCursor();
          const candidate = this.#typedAuthority.beginDirectCandidate();
          directCurrentCursor = current;
          directCandidateCursor = candidate;
          directCandidateOpen = true;
          stageMainWireAcceptedTypedClockCandidateV1(
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
        } catch (error) {
          if (directCandidateOpen) {
            this.#typedAuthority.abortDirectCandidate();
          }
          throw error;
        }
      }
      let result: MainWireIntegratedModelStepResultV3<WallState>;
      try {
        result = stepMainWireIntegratedModelV3(
          this.#provider,
          this.#acceptedState,
          {
            candidateTimeSec: limit.candidateTimeSec,
            coronary: this.#runtime.coronaryStepInput,
            rhythm: this.#rhythmInput,
            dynamicMechanicalSupport: Object.freeze({
              config: this.#dynamicMechanicalSupportConfig,
              profile: this.#runtime.profile,
            }),
          },
        );
      } catch (error) {
        if (directCandidateOpen) {
          this.#typedAuthority?.abortDirectCandidate();
        }
        throw error;
      }
      if (result.converged === false) {
        if (directCandidateOpen) {
          this.#typedAuthority?.abortDirectCandidate();
        }
        return this.failedAdvance(
          result.reason,
          result.message,
          targetTimeSec,
          substeps,
        );
      }
      if (result.acceptedState.acceptedTimeSec !== limit.candidateTimeSec) {
        if (directCandidateOpen) {
          this.#typedAuthority?.abortDirectCandidate();
        }
        return this.failedAdvance(
          "integrated-promotion-rejected",
          "Main Wire flat reference accepted clock differs from candidate",
          targetTimeSec,
          substeps,
        );
      }

      let scalarCandidateOpen = false;
      let committedState: AcceptedState;
      try {
        if (this.#typedAuthority !== null) {
          if (
            directCurrentCursor === null
            || directCandidateCursor === null
          ) {
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
        }
        this.#scalarSlots.stage(result.acceptedState);
        scalarCandidateOpen = true;
        if (this.#typedAuthority !== null) {
          directCandidateOpen = false;
          committedState = this.#typedAuthority.commitDirectCandidate(
            result.acceptedState,
            {
              continuous: this.#directRetainedContinuousSlots,
            },
          );
        } else {
          committedState = this.#authority.commit(result.acceptedState);
        }
      } catch (error) {
        if (scalarCandidateOpen) this.#scalarSlots.abort();
        if (directCandidateOpen) {
          this.#typedAuthority?.abortDirectCandidate();
        }
        throw error;
      }
      this.#scalarSlots.promote();
      this.#acceptedState = committedState;
      acceptedClock = this.currentAcceptedClock();
      if (
        acceptedClock.acceptedTimeSec !== committedState.acceptedTimeSec
        || acceptedClock.revision !== committedState.revision
      ) {
        throw new Error(
          "Main Wire flat reference typed clock differs from committed adapter",
        );
      }
      const committedResult = Object.freeze({
        ...result,
        acceptedState: committedState,
      });
      this.#lastAcceptedStep = committedResult;
      this.#completedBeatMetrics = this.#beatAccumulator.accept(committedResult)
        ?? this.#completedBeatMetrics;
      substepCount += 1;
      substeps.push(Object.freeze({
        acceptedRevision: committedState.revision,
        acceptedTimeSec: committedState.acceptedTimeSec,
        landedOnPresentationTarget:
          committedState.acceptedTimeSec === targetTimeSec,
        clippedByCoronaryWindow: limit.clippedByCoronaryWindow,
        clippedByRhythmBoundary: limit.clippedByRhythmBoundary,
        rhythmBoundaryTimeSec: limit.rhythmBoundaryTimeSec,
        rhythmBoundaryOwners: Object.freeze([...limit.rhythmBoundaryOwners]),
      }));
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

    const exposedAcceptedState = this.#authority.snapshot();
    const exposedLastAcceptedStep = Object.freeze({
      ...this.#lastAcceptedStep,
      acceptedState: exposedAcceptedState,
    });
    const nextObservation = observation(
      "presentation-target",
      exposedAcceptedState,
      exposedLastAcceptedStep,
      this.#runtime,
      this.#completedBeatMetrics,
    );
    this.#lastPresentationObservation = nextObservation;
    return Object.freeze({
      status: "advanced" as const,
      presentationTimeSec: targetTimeSec,
      acceptedTimeSec: acceptedClock.acceptedTimeSec,
      acceptedRevision: acceptedClock.revision,
      acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount: substepCount,
      boundaryClippedSubstepCount:
        substeps.filter((substep) => !substep.landedOnPresentationTarget).length,
      substeps: Object.freeze([...substeps]),
      observation: nextObservation,
    });
  }

  async checkpointStandardExact():
  Promise<MainWireIntegratedModelStandardCheckpointV1> {
    this.#acceptedState = this.#authority.current();
    this.#scalarSlots.assertCurrentMatches(this.#acceptedState);
    this.#typedAuthority?.assertCurrentMatches(this.#acceptedState);
    return checkpointMainWireIntegratedModelStandardV1(
      this.checkpointContext(),
      this.#acceptedState,
      this.#beatAccumulator,
      this.#completedBeatMetrics,
    );
  }

  async checkpointCanonicalBinary(): Promise<Uint8Array> {
    return encodeCanonicalFlatCheckpointV1(
      await this.checkpointStandardExact(),
    );
  }

  authorityReport(): MainWireAcceptedTypedStateAuthorityReportV1 {
    if (this.#typedAuthority === null) {
      throw new Error("Flat reference Session uses a non-typed test authority");
    }
    return this.#typedAuthority.report();
  }

  snapshotAcceptedStateBytes(): Uint8Array {
    if (this.#typedAuthority === null) {
      throw new Error("Flat reference Session uses a non-typed test authority");
    }
    const state = this.#typedAuthority.snapshot();
    const encoded = new Uint8Array(measureCanonicalFlatDataV1(state));
    const length = encodeCanonicalFlatDataIntoV1(state, encoded);
    if (length !== encoded.byteLength) {
      throw new Error("Flat reference accepted-state length changed while encoding");
    }
    return encoded;
  }

  scalarSlotsReport(): TransactionalScalarSlotsReportV1 {
    return this.#scalarSlots.report();
  }

  snapshotScalarSlots(): TransactionalScalarSlotsSnapshotV1 {
    return this.#scalarSlots.snapshot();
  }

  private checkpointContext() {
    const base = mainWireIntegratedModelCheckpointContextV3(
      this.#runtime,
      this.#acceptedState,
    );
    return Object.freeze({
      ...base,
      provider: this.#provider,
      dynamicMechanicalSupportConfig: this.#dynamicMechanicalSupportConfig,
    });
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

  private requiredTypedBoundaryBinding():
    MainWireAcceptedTypedBoundaryBindingV1 {
    if (this.#typedBoundaryBinding === null) {
      throw new Error("Flat reference Session has no typed boundary binding");
    }
    return this.#typedBoundaryBinding;
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
      boundaryClippedSubstepCount:
        substeps.filter((substep) => !substep.landedOnPresentationTarget).length,
      substeps: Object.freeze([...substeps]),
      requestedPresentationTimeSec: targetTimeSec,
    });
  }
}

function typedAuthorityFactory(
  coldAcceptedState: AcceptedState,
): MainWireFlatReferenceAcceptedStateAuthorityFactoryV1 {
  return (initial, validate, ownDecoded) =>
    new MainWireAcceptedTypedStateAuthorityV1(
      coldAcceptedState,
      initial,
      validate,
      ownDecoded,
    );
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

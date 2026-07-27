import {
  createScientificWorkbenchResearchControlStoreV0,
  type ScientificWorkbenchResearchControlDraftV0,
  type ScientificWorkbenchResearchControlOwnerActionRefV0,
  type ScientificWorkbenchResearchControlOwnerActionsV0,
  type ScientificWorkbenchParameterGenerationFramesV0,
  type ScientificWorkbenchResearchControlSnapshotInputV0,
  type ScientificWorkbenchResearchControlSourceV0,
  type ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  type MainWireScientificResearchControlIdV0,
  type MainWireScientificResearchControlScaleV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  SimulationSessionCoordinatorV1,
} from "@/studio/application/runtime/SimulationSessionCoordinatorV1";
import type {
  RuntimeLivePacingStateV1,
  RuntimePresentationEventV1,
  RuntimeSteadyCandidateV1,
  ScenarioRuntimeBranchStateV1,
  StudioArtifactRefV1,
  StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";
import {
  INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
} from "@/studio/contracts/v1";

import {
  projectRuntimeObservablePointToMainWireScientificObservableFrameV1,
} from "./ScientificProductStudioObservableFrameProjectionV1";
import type {
  ScientificProductStudioBootstrapResultV1,
} from "./ScientificProductStudioBootstrapV1";

const PRESENTATION_HISTORY_WINDOW_SEC_V1 = 20;
const PRESENTATION_HISTORY_HARD_LIMIT_V1 = 12_000;
const PARAMETER_GENERATION_HISTORY_LIMIT_V1 = 6;

let intentOrdinalV1 = 0;

export type ScientificProductStudioScenarioStatusV1 = Readonly<{
  targetGeneration: number;
  presentationRevision: number;
  livePlayback: "running" | "suspended";
  livePacing: RuntimeLivePacingStateV1;
  strictPhase:
    | "source-settled"
    | "running"
    | "candidate-ready"
    | "settled-in-use"
    | "failed";
  strictCandidateAvailable: boolean;
  strictCandidatePinned: boolean;
  pinnedRunCount: number;
  promotionInFlight: boolean;
  pinInFlight: boolean;
  lastActionError: string | null;
  lastFailure: Readonly<{
    lane: "live" | "strict" | "presentation";
    message: string;
  }> | null;
}>;

export class ScientificProductStudioScenarioControllerV1 {
  readonly controlStore: ScientificWorkbenchResearchControlStoreV0;

  private readonly coordinator: SimulationSessionCoordinatorV1;
  private readonly scenarioId: string;
  private readonly releaseRef:
    ScientificProductStudioBootstrapResultV1["source"]["seedFrame"]["releaseRef"];
  private readonly baseSessionInputSha256: string;
  private readonly initialParameterEpoch: number;
  private readonly ownerToken = Symbol("product-studio-control-owner-v1");
  private readonly ownerActionRef:
    ScientificWorkbenchResearchControlOwnerActionRefV0;
  private readonly disconnectOwner: () => void;
  private readonly unsubscribeCoordinator: () => void;
  private readonly unsubscribePresentation: () => void;
  private source: ScientificWorkbenchResearchControlSourceV0;
  private draft: ScientificWorkbenchResearchControlDraftV0;
  private desiredTargetState: MainWireScientificResearchControlTargetStateV0;
  private displayedTargetState:
    MainWireScientificResearchControlTargetStateV0;
  private displayedParameterEpoch: number;
  private displayedTargetGeneration = 0;
  private parameterGenerationHistory:
    readonly ScientificWorkbenchParameterGenerationFramesV0[] =
      Object.freeze([]);
  private readonly targetStatesByGeneration = new Map<
    number,
    MainWireScientificResearchControlTargetStateV0
  >();
  private frames: readonly MainWireScientificObservableFrameV1[];
  private displayKind: "settled" | "transient" = "settled";
  private liveTransitionOriginAcceptedTimeSec: number | null = null;
  private operationTail: Promise<void> = Promise.resolve();
  private pendingControlIntentCount = 0;
  private promotionInFlight = false;
  private pinInFlight = false;
  private pinnedCandidateId: string | null = null;
  private actionError: string | null = null;
  private presentationFailure: string | null = null;
  private latestActionOrdinal = 0;
  private lastCompletedActionOrdinal = 0;
  private framePublishScheduled = false;
  private lastCoordinatorSignature = "";
  private desiredLivePlayback: "running" | "suspended" = "running";
  private acknowledgedLivePlayback: "running" | "suspended" = "suspended";
  private pendingPlaybackActionCount = 0;
  private lastPromotedSettledAnalysisSource:
    StudioSettledAnalysisSourceV1 | null = null;
  private disposePromise: Promise<void> | null = null;
  private disposed = false;

  private constructor(
    bootstrap: ScientificProductStudioBootstrapResultV1,
    coordinator: SimulationSessionCoordinatorV1,
  ) {
    this.coordinator = coordinator;
    this.scenarioId = bootstrap.branch.scenarioId;
    this.releaseRef = bootstrap.source.seedFrame.releaseRef;
    this.baseSessionInputSha256 = bootstrap.baseSessionInputSha256;
    this.initialParameterEpoch = bootstrap.source.context.parameterEpoch;
    this.source = Object.freeze({
      sessionId: bootstrap.source.sessionId,
      context: bootstrap.source.context,
      frames: Object.freeze([bootstrap.source.seedFrame]),
    });
    this.frames = this.source.frames;
    this.desiredTargetState = bootstrap.source.context.controlState;
    this.displayedTargetState = this.desiredTargetState;
    this.displayedParameterEpoch = this.initialParameterEpoch;
    this.targetStatesByGeneration.set(0, this.desiredTargetState);
    this.draft = draftFromTargetStateV1(this.desiredTargetState);
    this.controlStore = createScientificWorkbenchResearchControlStoreV0(
      this.source,
      Number.MAX_SAFE_INTEGER,
    );
    const actions: ScientificWorkbenchResearchControlOwnerActionsV0 =
      Object.freeze({
        setControlValue: (controlId, value) => {
          const patch = draftPatchV1(controlId, value);
          if (patch === null) return;
          this.draft = Object.freeze({ ...this.draft, ...patch });
          this.publishV1();
        },
        commitControlValue: (controlId, value) => {
          const patch = draftPatchV1(controlId, value);
          if (patch === null) return;
          this.commitDraftPatchV1(patch);
        },
        setSystemicScale: (systemic) => {
          this.draft = Object.freeze({ ...this.draft, systemic });
          this.publishV1();
        },
        setPulmonaryScale: (pulmonary) => {
          this.draft = Object.freeze({ ...this.draft, pulmonary });
          this.publishV1();
        },
        commitSystemicScale: (systemic) =>
          this.commitDraftPatchV1({ systemic }),
        commitPulmonaryScale: (pulmonary) =>
          this.commitDraftPatchV1({ pulmonary }),
        // Studio has one honest behavior: live and strict lanes start
        // automatically for every complete target.
        setMode: () => undefined,
        applyTransition: () => this.queueControlIntentV1(this.draft),
        cancelSteady: () => undefined,
        pauseLive: () => {
          this.desiredLivePlayback = "suspended";
          void this.pauseV1();
        },
        resumeLive: () => {
          this.desiredLivePlayback = "running";
          void this.resumeV1();
        },
        resetLiveOrFailure: () =>
          this.queueControlIntentV1(
            this.draft,
            this.desiredLivePlayback === "running",
          ),
      });
    this.ownerActionRef = { current: actions };
    this.disconnectOwner = this.controlStore.connectOwner(
      this.ownerToken,
      this.ownerActionRef,
    );
    this.unsubscribeCoordinator = this.coordinator.subscribe(
      this.onCoordinatorStateV1,
    );
    this.unsubscribePresentation = this.coordinator.subscribePresentation(
      this.onPresentationEventV1,
    );
    this.publishV1();
  }

  static async create(
    input: Readonly<{
      bootstrap: ScientificProductStudioBootstrapResultV1;
      coordinator: SimulationSessionCoordinatorV1;
      sessionId: string;
      deferInitialLivePresentation?: boolean;
      signal?: AbortSignal;
    }>,
  ): Promise<ScientificProductStudioScenarioControllerV1> {
    const deferInitialLivePresentation =
      input.deferInitialLivePresentation === true;
    const controller = new ScientificProductStudioScenarioControllerV1(
      input.bootstrap,
      input.coordinator,
    );
    controller.desiredLivePlayback = deferInitialLivePresentation
      ? "suspended"
      : "running";
    try {
      await input.coordinator.open(Object.freeze({
        sessionId: input.sessionId,
        branches: Object.freeze([input.bootstrap.branch]),
      }), {
        initialLivePlayback: deferInitialLivePresentation
          ? "suspended"
          : "running",
        signal: input.signal,
      });
      controller.synchronizeAcknowledgedLivePlaybackV1(true);
      controller.lastCoordinatorSignature =
        controller.coordinatorSignatureV1();
      controller.publishV1();
      return controller;
    } catch (error) {
      await controller.dispose();
      throw error;
    }
  }

  get status(): ScientificProductStudioScenarioStatusV1 {
    const branch = this.branchV1();
    const candidate = branch?.latestSteadyCandidate ?? null;
    const strictPhase = branch?.lastRuntimeFailure?.lane === "strict"
      ? "failed" as const
      : candidate !== null
        ? "candidate-ready" as const
        : branch?.display.origin.kind === "promoted-steady-candidate"
          && branch.display.origin.targetGeneration === branch.targetGeneration
          ? "settled-in-use" as const
          : branch?.targetGeneration === 0
            ? "source-settled" as const
            : "running" as const;
    return Object.freeze({
      targetGeneration: branch?.targetGeneration ?? 0,
      presentationRevision: branch?.presentationRevision ?? 0,
      livePlayback: this.acknowledgedLivePlayback,
      livePacing: branch?.livePacing ?? INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
      strictPhase,
      strictCandidateAvailable: candidate !== null,
      strictCandidatePinned:
        candidate !== null && candidate.candidateId === this.pinnedCandidateId,
      pinnedRunCount: branch?.pinnedRunRefs.length ?? 0,
      promotionInFlight: this.promotionInFlight,
      pinInFlight: this.pinInFlight,
      lastActionError: this.actionError,
      lastFailure: this.presentationFailure !== null
        ? Object.freeze({
          lane: "presentation" as const,
          message: this.presentationFailure,
        })
        : (
            branch?.lastRuntimeFailure === null
            || branch?.lastRuntimeFailure === undefined
          )
          ? null
          : Object.freeze({
            lane: branch.lastRuntimeFailure.lane,
            message: branch.lastRuntimeFailure.message,
          }),
    });
  }

  /**
   * Exact settled source for side analyses. It is unavailable immediately
   * after a new control intent and becomes available only when that same
   * generation's strict candidate arrives (or when it has been promoted).
   */
  get settledAnalysisSource(): StudioSettledAnalysisSourceV1 | null {
    if (this.disposed || this.pendingControlIntentCount > 0) return null;
    const branch = this.branchV1();
    if (branch === null) return null;
    const candidate = branch.latestSteadyCandidate;
    if (
      candidate !== null
      && candidate.targetGeneration === branch.targetGeneration
      && candidate.targetInputSha256 === branch.targetInputSha256
    ) {
      return settledAnalysisSourceFromCandidateV1(
        candidate,
        "automatic-strict-candidate",
      );
    }
    const promoted = this.lastPromotedSettledAnalysisSource;
    if (
      promoted !== null
      && promoted.targetGeneration === branch.targetGeneration
      && promoted.targetInputSha256 === branch.targetInputSha256
      && branch.display.origin.kind === "promoted-steady-candidate"
    ) return promoted;
    if (branch.targetGeneration !== 0) return null;
    return Object.freeze({
      scenarioId: branch.scenarioId,
      targetGeneration: branch.targetGeneration,
      sourceRole: "initial-settled-source" as const,
      targetInputSha256: branch.targetInputSha256,
      sourceRunRef: branch.sourceRunRef,
      simulationInputRef: branch.sourceInputRef,
      snapshotRef: branch.sourceSnapshotRef,
      execution: branch.execution,
    });
  }

  async promoteSteadyCandidate(): Promise<void> {
    if (
      this.disposed
      || this.promotionInFlight
      || this.branchV1()?.latestSteadyCandidate == null
    ) return;
    const actionOrdinal = this.beginActionV1();
    this.promotionInFlight = true;
    this.publishV1();
    try {
      await this.enqueueOperationV1(async () => {
        if (
          this.disposed
          || this.branchV1()?.latestSteadyCandidate == null
        ) return;
        const candidate = this.branchV1()!.latestSteadyCandidate!;
        await this.coordinator.promoteSteadyCandidate(this.scenarioId);
        this.lastPromotedSettledAnalysisSource =
          settledAnalysisSourceFromCandidateV1(
            candidate,
            "promoted-settled-source",
          );
        const first = this.frames[0];
        if (first === undefined) {
          throw new Error(
            "promoted Studio trace did not expose its first point",
          );
        }
        const branch = this.coordinator.branch(this.scenarioId);
        const promotedTargetState =
          this.targetStatesByGeneration.get(branch.targetGeneration)
          ?? this.desiredTargetState;
        this.displayKind = "settled";
        this.liveTransitionOriginAcceptedTimeSec = null;
        this.source = Object.freeze({
          sessionId:
            `${this.scenarioId}:generation:${branch.targetGeneration}`,
          context: Object.freeze({
            stateIdentity: Object.freeze({
              revision: first.revision,
              acceptedTimeSec: first.acceptedTimeSec,
              totalBloodVolumeMl:
                this.source.context.stateIdentity.totalBloodVolumeMl,
            }),
            controlState: promotedTargetState,
            parameterEpoch:
              this.initialParameterEpoch + branch.targetGeneration,
          }),
          frames: Object.freeze([first]),
        });
      });
      this.finishActionSuccessV1(actionOrdinal);
    } catch (error) {
      this.finishActionFailureV1(actionOrdinal, error);
      throw error;
    } finally {
      this.promotionInFlight = false;
      this.publishV1();
    }
  }

  async pinSteadyCandidate(): Promise<StudioArtifactRefV1<"run-artifact"> | null> {
    if (
      this.disposed
      || this.pinInFlight
      || this.branchV1()?.latestSteadyCandidate == null
    ) {
      return null;
    }
    const actionOrdinal = this.beginActionV1();
    this.pinInFlight = true;
    this.publishV1();
    try {
      const ref = await this.enqueueOperationV1(async () => {
        if (
          this.disposed
          || this.branchV1()?.latestSteadyCandidate == null
        ) return null;
        const pinned =
          await this.coordinator.pinSteadyCandidate(this.scenarioId);
        this.pinnedCandidateId =
          this.coordinator.branch(this.scenarioId)
            .latestSteadyCandidate?.candidateId ?? null;
        return pinned;
      });
      this.finishActionSuccessV1(actionOrdinal);
      return ref;
    } catch (error) {
      this.finishActionFailureV1(actionOrdinal, error);
      throw error;
    } finally {
      this.pinInFlight = false;
      this.publishV1();
    }
  }

  dispose(): Promise<void> {
    if (this.disposePromise !== null) return this.disposePromise;
    this.disposed = true;
    this.unsubscribePresentation();
    this.unsubscribeCoordinator();
    this.disconnectOwner();
    // Disposal is a lifecycle barrier, not another queued user action. Close
    // the runtime immediately so an in-flight signal activation cannot retain
    // its Worker (or keep route unmount waiting indefinitely).
    this.disposePromise = this.coordinator
      .close({ force: true })
      .catch(() => undefined);
    return this.disposePromise;
  }

  private readonly onCoordinatorStateV1 = (): void => {
    if (this.disposed) return;
    const signature = this.coordinatorSignatureV1();
    if (signature === this.lastCoordinatorSignature) return;
    this.lastCoordinatorSignature = signature;
    // While a pause/resume is outstanding the runtime boundary has not
    // acknowledged the desired state yet, so product state must not claim the
    // action completed. A failure landing in that window is picked up when the
    // action settles, through the equality gate's failure override.
    if (this.pendingPlaybackActionCount === 0) {
      this.synchronizeAcknowledgedLivePlaybackV1(true);
    }
    this.publishV1();
  };

  private readonly onPresentationEventV1 = (
    event: RuntimePresentationEventV1,
  ): void => {
    if (this.disposed || event.scenarioId !== this.scenarioId) return;
    if (event.kind === "reset") {
      let frame: MainWireScientificObservableFrameV1;
      try {
        frame =
          projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
            point: event.frame.point,
            releaseRef: this.releaseRef,
          });
      } catch (error) {
        this.recordPresentationFailureV1(error);
        return;
      }
      if (event.targetGeneration !== this.displayedTargetGeneration) {
        this.retainDisplayedParameterGenerationV1();
      }
      this.frames = Object.freeze([frame]);
      this.displayKind = event.origin.kind === "live-transition"
        ? "transient"
        : "settled";
      this.liveTransitionOriginAcceptedTimeSec =
        this.displayKind === "transient" ? frame.acceptedTimeSec : null;
      this.displayedTargetState =
        this.targetStatesByGeneration.get(event.targetGeneration)
        ?? this.displayedTargetState;
      this.displayedParameterEpoch =
        this.initialParameterEpoch + event.targetGeneration;
      this.displayedTargetGeneration = event.targetGeneration;
      this.presentationFailure = null;
      this.publishV1();
      return;
    }
    if (this.presentationFailure !== null) return;
    let appended: readonly MainWireScientificObservableFrameV1[];
    try {
      appended = event.points.map((point) =>
        projectRuntimeObservablePointToMainWireScientificObservableFrameV1({
          point,
          releaseRef: this.releaseRef,
        }));
    } catch (error) {
      this.recordPresentationFailureV1(error);
      return;
    }
    if (this.displayKind === "settled") {
      this.displayKind = "transient";
      this.liveTransitionOriginAcceptedTimeSec =
        this.frames[0]?.acceptedTimeSec
        ?? appended[0]?.acceptedTimeSec
        ?? null;
    }
    this.frames = boundedFramesV1([...this.frames, ...appended]);
    this.scheduleFramePublishV1();
  };

  private recordPresentationFailureV1(error: unknown): void {
    this.presentationFailure =
      `Studio presentation projection failed: ${errorMessageV1(error)}`;
    this.publishV1();
  }

  private retainDisplayedParameterGenerationV1(): void {
    // A single reset point cannot preserve a waveform segment or PV
    // trajectory, so it is not useful presentation history.
    if (this.frames.length < 2) return;
    const retained: ScientificWorkbenchParameterGenerationFramesV0 =
      Object.freeze({
        targetGeneration: this.displayedTargetGeneration,
        parameterEpoch: this.displayedParameterEpoch,
        controlStateSha256:
          this.displayedTargetState.targetStateSha256,
        frames: Object.freeze([...this.frames]),
        liveTransitionOriginAcceptedTimeSec:
          this.liveTransitionOriginAcceptedTimeSec,
        displayedEvidence: this.displayKind === "settled"
          ? "settled-snapshot-one-point" as const
          : "open-transient-no-periodic-claim" as const,
      });
    this.parameterGenerationHistory = Object.freeze([
      retained,
      ...this.parameterGenerationHistory.filter(({ targetGeneration }) =>
        targetGeneration !== retained.targetGeneration),
    ].slice(0, PARAMETER_GENERATION_HISTORY_LIMIT_V1));
  }

  private commitDraftPatchV1(
    patch: Partial<ScientificWorkbenchResearchControlDraftV0>,
  ): void {
    this.draft = Object.freeze({ ...this.draft, ...patch });
    this.queueControlIntentV1(this.draft);
  }

  private queueControlIntentV1(
    draft: ScientificWorkbenchResearchControlDraftV0,
    resumeAfterApplication = false,
  ): void {
    if (this.disposed) return;
    const controls = controlsFromDraftV1(draft);
    const actionOrdinal = this.beginActionV1();
    this.pendingControlIntentCount += 1;
    this.publishV1();
    const operation = this.enqueueOperationV1(async () => {
      if (this.disposed) return;
      const {
        resolveMainWireStudioTargetInputV1,
      } = await import(
        "@/studio/adapters/mainWire/MainWireStudioTargetResolverV1"
      );
      const resolved = await resolveMainWireStudioTargetInputV1(
        this.desiredTargetState,
        this.baseSessionInputSha256,
        controls,
      );
      if (this.disposed) return;
      const before = this.coordinator.branch(this.scenarioId);
      const targetGeneration = before.targetGeneration + 1;
      const previousTargetState = this.desiredTargetState;
      this.desiredTargetState = resolved.targetState;
      this.targetStatesByGeneration.set(
        targetGeneration,
        resolved.targetState,
      );
      let acceptedGeneration: number | undefined;
      try {
        const applied = this.coordinator.applyControlIntent(Object.freeze({
          intentId:
            `${this.scenarioId}:product-ui:${++intentOrdinalV1}`,
          targets: Object.freeze([Object.freeze({
            scenarioId: this.scenarioId,
            patch: resolved.patch,
          })]),
        }));
        acceptedGeneration =
          applied.targetGenerations.find(({ scenarioId }) =>
            scenarioId === this.scenarioId)?.targetGeneration;
        if (acceptedGeneration !== targetGeneration) {
          throw new Error(
            "Studio coordinator accepted an unexpected target generation",
          );
        }
      } catch (error) {
        this.desiredTargetState = previousTargetState;
        this.targetStatesByGeneration.delete(targetGeneration);
        throw error;
      }
      for (const generation of this.targetStatesByGeneration.keys()) {
        if (generation !== targetGeneration) {
          this.targetStatesByGeneration.delete(generation);
        }
      }
      if (
        resumeAfterApplication
        && this.desiredLivePlayback === "running"
        && this.coordinator.branch(this.scenarioId).livePlayback
          === "suspended"
      ) {
        await this.coordinator.resumeBranch(this.scenarioId);
      }
      this.publishV1();
    });
    void operation.then(() => {
      this.finishActionSuccessV1(actionOrdinal);
    }, (error) => {
      this.finishActionFailureV1(actionOrdinal, error);
    }).finally(() => {
      this.pendingControlIntentCount -= 1;
      this.publishV1();
    });
  }

  private async pauseV1(): Promise<void> {
    if (this.disposed) return;
    this.pendingPlaybackActionCount += 1;
    const actionOrdinal = this.beginActionV1();
    try {
      await this.enqueueOperationV1(async () => {
        if (
          this.disposed
          || this.desiredLivePlayback !== "suspended"
        ) return;
        await this.coordinator.suspendBranch(this.scenarioId);
      });
      this.finishActionSuccessV1(actionOrdinal);
    } catch (error) {
      this.finishActionFailureV1(actionOrdinal, error);
    } finally {
      this.pendingPlaybackActionCount -= 1;
      this.synchronizeAcknowledgedLivePlaybackV1();
      this.publishV1();
    }
  }

  private async resumeV1(): Promise<void> {
    if (this.disposed) return;
    this.pendingPlaybackActionCount += 1;
    const actionOrdinal = this.beginActionV1();
    try {
      await this.enqueueOperationV1(async () => {
        if (
          this.disposed
          || this.desiredLivePlayback !== "running"
        ) return;
        await this.coordinator.resumeBranch(this.scenarioId);
      });
      this.finishActionSuccessV1(actionOrdinal);
    } catch (error) {
      this.finishActionFailureV1(actionOrdinal, error);
    } finally {
      this.pendingPlaybackActionCount -= 1;
      this.synchronizeAcknowledgedLivePlaybackV1();
      this.publishV1();
    }
  }

  private enqueueOperationV1<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationTail.then(operation);
    this.operationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private beginActionV1(): number {
    const ordinal = ++this.latestActionOrdinal;
    this.publishV1();
    return ordinal;
  }

  private finishActionSuccessV1(ordinal: number): void {
    if (ordinal < this.lastCompletedActionOrdinal) return;
    this.lastCompletedActionOrdinal = ordinal;
    this.actionError = null;
  }

  private finishActionFailureV1(ordinal: number, error: unknown): void {
    if (ordinal < this.lastCompletedActionOrdinal) return;
    this.lastCompletedActionOrdinal = ordinal;
    this.actionError = errorMessageV1(error);
  }

  private branchV1(): ScenarioRuntimeBranchStateV1 | null {
    const state = this.coordinator.getSnapshot();
    if (state === null || state.status === "closed") return null;
    return state.branches.find(({ scenarioId }) =>
      scenarioId === this.scenarioId) ?? null;
  }

  /**
   * The coordinator switches its control-plane state before awaiting the
   * runtime boundary so it can accept the final contiguous in-flight batch.
   * Product UI state must not claim that pause/resume has completed until that
   * boundary acknowledges the desired state.
   */
  private synchronizeAcknowledgedLivePlaybackV1(force = false): void {
    const branch = this.branchV1();
    if (
      branch !== null
      && (force || branch.livePlayback === this.desiredLivePlayback)
    ) {
      this.acknowledgedLivePlayback = branch.livePlayback;
    }
  }

  private coordinatorSignatureV1(): string {
    const state = this.coordinator.getSnapshot();
    const branch = this.branchV1();
    if (state === null || branch === null) return "unopened";
    return JSON.stringify([
      state.status,
      branch.targetGeneration,
      branch.presentationRevision,
      branch.streamEpoch,
      branch.livePlayback,
      // Only the durable pacing facts belong in the change signature; the
      // volatile lag and rate reach consumers with each sample append.
      branch.livePacing.mode,
      branch.livePacing.cumulativeRebasedDeficitMs,
      branch.display.origin,
      branch.latestSteadyCandidate?.candidateId ?? null,
      branch.lastRuntimeFailure?.lane ?? null,
      branch.lastRuntimeFailure?.message ?? null,
    ]);
  }

  private scheduleFramePublishV1(): void {
    if (this.framePublishScheduled || this.disposed) return;
    this.framePublishScheduled = true;
    const publish = (): void => {
      this.framePublishScheduled = false;
      if (!this.disposed) this.publishV1();
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(publish);
    } else {
      globalThis.setTimeout(publish, 16);
    }
  }

  private publishV1(): void {
    if (this.disposed) return;
    const branch = this.branchV1();
    const liveFailure = branch?.lastRuntimeFailure?.lane === "live"
      ? branch.lastRuntimeFailure.message
      : null;
    const strictFailure = branch?.lastRuntimeFailure?.lane === "strict"
      ? branch.lastRuntimeFailure.message
      : null;
    const errorMessage =
      this.actionError ?? this.presentationFailure ?? liveFailure;
    const displayAligned = branch === null
      || branch.targetGeneration === 0
      || (
        branch.display.origin.kind === "live-transition"
        && branch.display.origin.targetGeneration === branch.targetGeneration
      )
      || (
        branch.display.origin.kind === "promoted-steady-candidate"
        && branch.display.origin.targetGeneration === branch.targetGeneration
      );
    const paused = this.acknowledgedLivePlayback === "suspended";
    const retargeting =
      this.pendingControlIntentCount > 0 || !displayAligned;
    const strictPhase = this.status.strictPhase;
    const phase = this.presentationFailure !== null || liveFailure !== null
      ? "failed" as const
      : paused
        ? "live-paused" as const
        : retargeting
          ? "live-retargeting" as const
          : "live-running" as const;
    const evidence = this.displayKind === "settled"
      ? "settled-snapshot-one-point" as const
      : "open-transient-no-periodic-claim" as const;
    const input: ScientificWorkbenchResearchControlSnapshotInputV0 =
      Object.freeze({
        phase,
        mode: "live" as const,
        source: this.source,
        candidate: null,
        frames: this.frames,
        parameterGenerationHistory: this.parameterGenerationHistory,
        targetControlStateSha256:
          this.desiredTargetState.targetStateSha256,
        liveTransitionOriginAcceptedTimeSec:
          this.liveTransitionOriginAcceptedTimeSec,
        inFlight: retargeting || this.promotionInFlight,
        periodicStatus: strictPhase === "failed"
          ? "automatic-strict-failed"
          : strictPhase === "candidate-ready"
            ? "period1-converged"
            : strictPhase === "running"
              ? "automatic-strict-running"
              : strictPhase,
        completedBeatCount: 0,
        capturedStepCount: Math.max(0, this.frames.length - 1),
        sourceRetirementPending: false,
        remainingRegularRequestCount: Number.MAX_SAFE_INTEGER,
        message: this.presentationFailure !== null
          ? "Studio presentation stopped at the last accepted trace. Retry the current target to recover from a fresh reset."
          : liveFailure !== null
            ? "Studio runtime stopped at the last accepted state."
            : this.actionError !== null
              ? "The last Studio action failed; the accepted simulation remains editable."
              : strictFailure !== null
                ? "Live simulation continues; strict settlement failed for this target."
                : strictPhase === "candidate-ready"
                  ? "Live simulation is running. A settled candidate is ready to use."
                  : paused
                    ? strictPhase === "running"
                      ? "Live simulation is paused; strict settlement continues."
                      : "Live simulation is paused."
                    : strictPhase === "source-settled"
                      ? "Live simulation is running from the settled source."
                      : strictPhase === "settled-in-use"
                        ? "Live simulation is running from the selected settled state."
                        : "Live simulation and strict settlement run automatically.",
        errorMessage,
        draft: this.draft,
        busy: this.promotionInFlight,
        noChange: controlsEqualV1(
          controlsFromDraftV1(this.draft),
          this.desiredTargetState.controls,
        ),
        steadyActive: false,
        liveActive: true,
        requestCapacityExhausted: false,
        provenance: Object.freeze({
          displayedFrameOwner: this.displayKind === "settled"
            ? "source" as const
            : "candidate" as const,
          displayedParameterEpoch: this.displayedParameterEpoch,
          displayedControlStateSha256:
            this.displayedTargetState.targetStateSha256,
          displayedEvidence: evidence,
        }),
      });
    this.controlStore.publishOwnerSnapshot(this.ownerToken, input);
  }
}

function settledAnalysisSourceFromCandidateV1(
  candidate: RuntimeSteadyCandidateV1,
  sourceRole: StudioSettledAnalysisSourceV1["sourceRole"],
): StudioSettledAnalysisSourceV1 {
  return Object.freeze({
    scenarioId: candidate.scenarioId,
    targetGeneration: candidate.targetGeneration,
    sourceRole,
    targetInputSha256: candidate.targetInputSha256,
    sourceRunRef: candidate.sourceRunRef,
    simulationInputRef: candidate.simulationInputRef,
    snapshotRef: candidate.snapshotRef,
    execution: candidate.execution,
  });
}

function draftPatchV1(
  controlId: MainWireScientificResearchControlIdV0,
  value: number,
): Partial<ScientificWorkbenchResearchControlDraftV0> | null {
  switch (controlId) {
    case "circulation.systemic-vascular-resistance-scale":
      return { systemic: value as MainWireScientificResearchControlScaleV0 };
    case "circulation.pulmonary-vascular-resistance-scale":
      return { pulmonary: value as MainWireScientificResearchControlScaleV0 };
    case "circulation.venous-tone":
      return { venousTone: value };
    case "circulation.arterial-stiffness":
      return { arterialStiffness: value };
    case "ventilation.peep-cm-h2o":
      return { peepCmH2O: value };
    case "pericardium.prescribed-fluid-volume-ml":
      return { pericardialFluidVolumeMl: value };
  }
}

function draftFromTargetStateV1(
  state: MainWireScientificResearchControlTargetStateV0,
): ScientificWorkbenchResearchControlDraftV0 {
  return Object.freeze({
    systemic:
      state.controls["circulation.systemic-vascular-resistance-scale"],
    pulmonary:
      state.controls["circulation.pulmonary-vascular-resistance-scale"],
    venousTone: state.controls["circulation.venous-tone"],
    arterialStiffness: state.controls["circulation.arterial-stiffness"],
    peepCmH2O: state.controls["ventilation.peep-cm-h2o"],
    pericardialFluidVolumeMl:
      state.controls["pericardium.prescribed-fluid-volume-ml"],
  });
}

function controlsFromDraftV1(
  draft: ScientificWorkbenchResearchControlDraftV0,
): Readonly<Record<MainWireScientificResearchControlIdV0, number>> {
  const controls: Record<string, number> = {
    "circulation.systemic-vascular-resistance-scale": draft.systemic,
    "circulation.pulmonary-vascular-resistance-scale": draft.pulmonary,
    "circulation.venous-tone": draft.venousTone,
    "circulation.arterial-stiffness": draft.arterialStiffness,
    "ventilation.peep-cm-h2o": draft.peepCmH2O,
    "pericardium.prescribed-fluid-volume-ml":
      draft.pericardialFluidVolumeMl,
  };
  if (
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.some((id) =>
      !Number.isFinite(controls[id]))
  ) throw new Error("Studio control draft contains a non-finite value");
  return Object.freeze(controls) as Readonly<
    Record<MainWireScientificResearchControlIdV0, number>
  >;
}

function controlsEqualV1(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): boolean {
  return MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.every((id) =>
    left[id] === right[id]);
}

function boundedFramesV1(
  frames: readonly MainWireScientificObservableFrameV1[],
): readonly MainWireScientificObservableFrameV1[] {
  const lastTime = frames.at(-1)?.acceptedTimeSec ?? 0;
  const minimumTime = lastTime - PRESENTATION_HISTORY_WINDOW_SEC_V1;
  const firstRetained = frames.findIndex(({ acceptedTimeSec }) =>
    acceptedTimeSec >= minimumTime);
  const bounded = firstRetained <= 0 ? frames : frames.slice(firstRetained);
  return Object.freeze(
    bounded.length <= PRESENTATION_HISTORY_HARD_LIMIT_V1
      ? [...bounded]
      : bounded.slice(-PRESENTATION_HISTORY_HARD_LIMIT_V1),
  );
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

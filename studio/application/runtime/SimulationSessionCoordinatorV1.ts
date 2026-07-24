import {
  INITIAL_PRESENTATION_REVISION_V1,
  INITIAL_TARGET_GENERATION_V1,
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  type AppliedRuntimeControlIntentV1,
  type ArtifactStorePortV1,
  type OpenScenarioRuntimeBranchV1,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RunArtifactRefV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeControlIntentV1,
  type RuntimeControlPatchV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeLaneFailureV1,
  type RuntimeLiveIntentResultV1,
  type RuntimeLiveTransitionResultV1,
  type RuntimeObservablePointV1,
  type RuntimePresentationEventV1,
  type RuntimePresentationFrameV1,
  type RuntimeScenarioBranchOpenedV1,
  type RuntimeSessionOpenedV1,
  type RuntimeSignalChannelRefV1,
  type RuntimeSignalEventV1,
  type RuntimeSignalSubscriptionV1,
  type RuntimeSteadyCandidateV1,
  type RuntimeStrictIntentResultV1,
  type RuntimeTargetIntentBranchV1,
  type RuntimeTargetIntentCommandV1,
  type RuntimeWindowMetricStateV1,
  type ScenarioRuntimeBranchStateV1,
  type Sha256HexV1,
  type SimulationRuntimePortV1,
  type SimulationSessionStateV1,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
  type StudioJsonValueV1,
  type StudioRunArtifactContentV1,
  type TargetGenerationV1,
} from "@/studio/contracts/v1";

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;
const RUN_ARTIFACT_MEDIA_TYPE_V1 =
  "application/vnd.circleheart.studio-run-artifact.v1+json" as const;

export type SimulationSessionCoordinatorOptionsV1 = Readonly<{
  runtime: SimulationRuntimePortV1;
  artifacts: ArtifactStorePortV1;
}>;

export class SimulationSessionCoordinatorErrorV1 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationSessionCoordinatorErrorV1";
  }
}

export class SimulationSessionCommandConflictV1
  extends SimulationSessionCoordinatorErrorV1 {
  constructor(message: string) {
    super(message);
    this.name = "SimulationSessionCommandConflictV1";
  }
}

/**
 * Owns one Studio interaction containing N scenario runtime branches.
 *
 * A shared control intent first advances every targeted branch generation in
 * one immutable aggregate-state replacement. Only then is the exact same
 * aggregate command handed to the foreground live and background strict
 * lanes. Completions are correlated independently at each branch generation,
 * so a later subset intent cannot overwrite its targets or erase valid work on
 * untouched branches.
 */
export class SimulationSessionCoordinatorV1 {
  private readonly runtime: SimulationRuntimePortV1;
  private readonly artifacts: ArtifactStorePortV1;
  private readonly submittedIntentIds = new Set<string>();
  private readonly promotingScenarioIds = new Set<string>();
  private readonly playbackTransitionScenarioIds = new Set<string>();
  private readonly signalSubscriptions =
    new Map<string, RuntimeSignalSubscriptionV1>();
  private readonly signalActivationTokens = new Map<string, number>();
  private readonly signalActivationOperations = new Map<
    string,
    Promise<void>
  >();
  private readonly stateListeners = new Set<() => void>();
  private readonly presentationListeners =
    new Set<(event: RuntimePresentationEventV1) => void>();
  private state: SimulationSessionStateV1 | null = null;
  private openingSessionId: string | null = null;
  private openingCompletion: Promise<void> | null = null;
  private closeRequestedWhileOpening = false;
  private openingRuntimeClose: Promise<void> | null = null;
  private closePromise: Promise<void> | null = null;

  constructor(options: SimulationSessionCoordinatorOptionsV1) {
    this.runtime = options.runtime;
    this.artifacts = options.artifacts;
  }

  /**
   * Stable external-store reader. `null` means no session has completed
   * allocation yet (or an attempted open was rolled back).
   */
  readonly getSnapshot = (): SimulationSessionStateV1 | null => this.state;

  /**
   * Subscribes to immutable aggregate-state replacements. No initial callback
   * is fired; consumers read `getSnapshot()` before/after subscribing.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  /**
   * Ordered, non-replayed presentation trace events owned by the coordinator.
   * Subscribe before `open()` to receive the initial one-point reset.
   */
  readonly subscribePresentation = (
    listener: (event: RuntimePresentationEventV1) => void,
  ): (() => void) => {
    this.presentationListeners.add(listener);
    return () => {
      this.presentationListeners.delete(listener);
    };
  };

  get current(): SimulationSessionStateV1 {
    if (this.state === null) {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session has not been opened",
      );
    }
    return this.state;
  }

  branch(scenarioId: string): ScenarioRuntimeBranchStateV1 {
    return requiredBranchV1(this.current, scenarioId);
  }

  async open(
    command: OpenSimulationSessionCommandV1,
    options: Readonly<{
      initialLivePlayback?: "running" | "suspended";
      signal?: AbortSignal;
    }> = {},
  ): Promise<SimulationSessionStateV1> {
    if (this.state !== null || this.openingSessionId !== null) {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session is already open or opening",
      );
    }
    if (options.signal?.aborted) {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session opening was aborted",
      );
    }
    const safeCommand = copyOpenCommandV1(command);
    const initialLivePlayback = options.initialLivePlayback ?? "running";
    this.openingSessionId = safeCommand.sessionId;
    this.closeRequestedWhileOpening = false;
    this.openingRuntimeClose = null;
    let resolveOpeningCompletion!: () => void;
    const openingCompletion = new Promise<void>((resolve) => {
      resolveOpeningCompletion = resolve;
    });
    this.openingCompletion = openingCompletion;
    const abortOpening = () => {
      void this.close().catch(() => undefined);
    };
    options.signal?.addEventListener("abort", abortOpening, { once: true });
    let runtimeAllocationReturned = false;
    try {
      const runtimeOpened = await this.runtime.openSession(safeCommand);
      runtimeAllocationReturned = true;
      if (this.closeRequestedWhileOpening) {
        throw new SimulationSessionCoordinatorErrorV1(
          "simulation session opening was aborted by close",
        );
      }
      const opened = copyOpenedSessionV1(
        runtimeOpened,
        safeCommand,
      );
      const openedByScenario = new Map(
        opened.branches.map((branch) => [branch.scenarioId, branch]),
      );
      const branches = safeCommand.branches.map((source) => Object.freeze({
        ...initialBranchStateV1(
          source,
          openedByScenario.get(source.scenarioId)!,
        ),
        livePlayback: initialLivePlayback,
      }));

      const openedState = Object.freeze({
        status: "live",
        sessionId: opened.sessionId,
        branches: Object.freeze(branches),
        lastAppliedIntentId: null,
      });
      this.publishStateV1(openedState);
      for (const branch of openedState.branches) {
        this.publishPresentationResetV1(openedState.sessionId, branch);
      }
      this.bindOpenedSignalChannelsV1();
      if (initialLivePlayback === "running") {
        await Promise.all(openedState.branches.map((branch) =>
          this.runtime.resumeSignalChannel(
            branch.signalChannelRef,
            branch.streamEpoch,
          )));
      }
      if (
        this.state === null
        || this.state.sessionId !== opened.sessionId
        || this.state.status !== "live"
        || this.closeRequestedWhileOpening
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          "simulation session changed while signal channels were starting",
        );
      }
      return this.state;
    } catch (error) {
      this.unsubscribeAllSignalsV1();
      if (this.state?.sessionId === safeCommand.sessionId) {
        this.publishStateV1(null);
      }
      if (runtimeAllocationReturned) {
        const runtimeClose = this.openingRuntimeClose
          ?? this.runtime.closeSession(safeCommand.sessionId);
        this.openingRuntimeClose = runtimeClose;
        try {
          await runtimeClose;
        } catch {
          // Preserve the validation/open failure. Runtime adapters must make
          // close idempotent and own their final termination fallback.
        }
      }
      throw error;
    } finally {
      options.signal?.removeEventListener("abort", abortOpening);
      this.openingSessionId = null;
      this.closeRequestedWhileOpening = false;
      resolveOpeningCompletion();
      if (this.openingCompletion === openingCompletion) {
        this.openingCompletion = null;
      }
      this.openingRuntimeClose = null;
    }
  }

  applyControlIntent(
    intent: RuntimeControlIntentV1,
  ): AppliedRuntimeControlIntentV1 {
    const current = this.requireLiveStateV1();
    const safeIntent = copyControlIntentV1(intent, current);
    const promotingTarget = safeIntent.targets.find(({ scenarioId }) =>
      this.promotingScenarioIds.has(scenarioId)
    );
    if (promotingTarget !== undefined) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${promotingTarget.scenarioId} is being promoted`,
      );
    }
    const playbackTarget = safeIntent.targets.find(({ scenarioId }) =>
      this.playbackTransitionScenarioIds.has(scenarioId)
    );
    if (playbackTarget !== undefined) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${playbackTarget.scenarioId} playback is transitioning`,
      );
    }
    if (this.submittedIntentIds.has(safeIntent.intentId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `intentId ${safeIntent.intentId} has already been submitted`,
      );
    }
    const targetByScenario = new Map(
      safeIntent.targets.map((target) => [target.scenarioId, target]),
    );
    const commandTargets: RuntimeTargetIntentBranchV1[] = [];
    const nextBranches = current.branches.map((branch) => {
      const target = targetByScenario.get(branch.scenarioId);
      if (target === undefined) return branch;
      const targetGeneration = nextGenerationV1(branch.targetGeneration);
      const presentationRevision = nextPresentationRevisionV1(
        branch.presentationRevision,
      );
      commandTargets.push(Object.freeze({
        scenarioId: branch.scenarioId,
        liveBranchId: branch.liveBranchId,
        targetGeneration,
        presentationRevision,
        patch: target.patch,
      }));
      return Object.freeze({
        ...branch,
        targetGeneration,
        presentationRevision,
        targetInputSha256: target.patch.targetInputSha256,
        latestSteadyCandidate: null,
        lastRuntimeFailure: null,
      });
    });
    const command = Object.freeze({
      sessionId: current.sessionId,
      intentId: safeIntent.intentId,
      targets: Object.freeze(commandTargets),
    }) satisfies RuntimeTargetIntentCommandV1;
    this.submittedIntentIds.add(command.intentId);
    for (const target of command.targets) {
      this.invalidateSignalActivationV1(
        requiredBranchV1(current, target.scenarioId).signalChannelRef,
      );
    }

    // This is the atomic application-state boundary for a shared intent.
    this.publishStateV1(Object.freeze({
      ...current,
      branches: Object.freeze(nextBranches),
      lastAppliedIntentId: safeIntent.intentId,
    }));

    let livePromise: Promise<RuntimeLiveIntentResultV1>;
    let strictPromise: Promise<RuntimeStrictIntentResultV1>;
    try {
      const execution = this.runtime.startTargetIntent(command);
      if (
        execution === null
        || typeof execution !== "object"
        || typeof execution.live?.then !== "function"
        || typeof execution.strict?.then !== "function"
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          "runtime returned invalid target intent completion handles",
        );
      }
      livePromise = execution.live;
      strictPromise = execution.strict;
    } catch (error) {
      this.acceptIntentFailureV1(command, "live", error);
      this.acceptIntentFailureV1(command, "strict", error);
      return Object.freeze({
        intentId: command.intentId,
        targetGenerations: Object.freeze(command.targets.map((target) =>
          Object.freeze({
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            presentationRevision: target.presentationRevision,
          }))),
      });
    }

    void livePromise.then(
      (result) => this.acceptLiveIntentV1(command, result),
      (error) => this.acceptIntentFailureV1(command, "live", error),
    );
    void strictPromise.then(
      (result) => this.acceptStrictIntentV1(command, result),
      (error) => this.acceptIntentFailureV1(command, "strict", error),
    );

    return Object.freeze({
      intentId: command.intentId,
      targetGenerations: Object.freeze(command.targets.map((target) =>
        Object.freeze({
          scenarioId: target.scenarioId,
          targetGeneration: target.targetGeneration,
          presentationRevision: target.presentationRevision,
        }))),
    });
  }

  async promoteSteadyCandidate(
    scenarioId: string,
  ): Promise<ScenarioRuntimeBranchStateV1> {
    const beforeSession = this.requireLiveStateV1();
    const before = requiredBranchV1(beforeSession, scenarioId);
    if (this.promotingScenarioIds.has(before.scenarioId)) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${before.scenarioId} is already being promoted`,
      );
    }
    if (this.playbackTransitionScenarioIds.has(before.scenarioId)) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${before.scenarioId} playback is transitioning`,
      );
    }
    const candidate = currentCandidateV1(before);
    const presentationRevision = nextPresentationRevisionV1(
      before.presentationRevision,
    );
    const command = Object.freeze({
      sessionId: beforeSession.sessionId,
      scenarioId: before.scenarioId,
      liveBranchId: before.liveBranchId,
      targetGeneration: before.targetGeneration,
      presentationRevision,
      candidate,
    }) satisfies PromoteSteadyCandidateCommandV1;
    this.promotingScenarioIds.add(before.scenarioId);
    try {
      const promoted = await this.runtime.promoteSteadyCandidate(command);
      const currentSession = this.requireLiveStateV1();
      const current = requiredBranchV1(currentSession, scenarioId);
      assertCandidateStillCurrentV1(
        currentSession,
        current,
        beforeSession,
        before,
        candidate,
        before.presentationRevision,
        "steady candidate changed while promotion was in flight",
      );
      const safePromoted = copyPromotionV1(promoted, command);
      if (safePromoted.streamEpoch <= current.streamEpoch) {
        throw new SimulationSessionCoordinatorErrorV1(
          "promoted snapshot did not advance the stream epoch",
        );
      }
      assertOnePointCollectingFrameV1(
        safePromoted.initialFrame,
        "promoted snapshot",
      );

      const replacement = Object.freeze({
        ...current,
        presentationRevision,
        streamEpoch: safePromoted.streamEpoch,
        targetInputSha256: candidate.targetInputSha256,
        display: Object.freeze({
          origin: Object.freeze({
            kind: "promoted-steady-candidate" as const,
            targetGeneration: current.targetGeneration,
            candidateId: candidate.candidateId,
          }),
          firstPoint: safePromoted.initialFrame.point,
          latestPoint: safePromoted.initialFrame.point,
          pointCount: 1,
          windowMetrics: safePromoted.initialFrame.windowMetrics,
        }),
        latestSteadyCandidate: null,
        lastRuntimeFailure: null,
      });
      const shouldActivate = current.livePlayback === "running";
      this.replaceBranchV1(current.scenarioId, replacement);
      this.publishPresentationResetV1(
        currentSession.sessionId,
        replacement,
      );
      if (shouldActivate) {
        this.activateSignalEpochV1(
          replacement,
          "promoted signal epoch activation failed",
        );
      }
      return replacement;
    } finally {
      this.promotingScenarioIds.delete(before.scenarioId);
    }
  }

  async pinSteadyCandidate(
    scenarioId: string,
  ): Promise<RunArtifactRefV1> {
    const beforeSession = this.requireLiveStateV1();
    const before = requiredBranchV1(beforeSession, scenarioId);
    const candidate = currentCandidateV1(before);
    const [snapshotExists, sourceRunExists, simulationInputExists] =
      await Promise.all([
      this.artifacts.has(candidate.snapshotRef),
      this.artifacts.has(candidate.sourceRunRef),
      this.artifacts.has(candidate.simulationInputRef),
    ]);
    if (!snapshotExists) {
      throw new SimulationSessionCoordinatorErrorV1(
        `candidate snapshot artifact ${candidate.snapshotRef.sha256} does not exist`,
      );
    }
    if (!sourceRunExists) {
      throw new SimulationSessionCoordinatorErrorV1(
        `candidate source run artifact ${candidate.sourceRunRef.sha256} does not exist`,
      );
    }
    if (!simulationInputExists) {
      throw new SimulationSessionCoordinatorErrorV1(
        `candidate simulation input artifact ${candidate.simulationInputRef.sha256} does not exist`,
      );
    }
    const validatedSession = this.requireLiveStateV1();
    const validated = requiredBranchV1(validatedSession, scenarioId);
    assertCandidateStillCurrentV1(
      validatedSession,
      validated,
      beforeSession,
      before,
      candidate,
      before.presentationRevision,
      "steady candidate changed while artifact references were validated",
    );
    const content: StudioRunArtifactContentV1 = Object.freeze({
      schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
      sourceRunRef: candidate.sourceRunRef,
      simulationInputRef: candidate.simulationInputRef,
      targetInputSha256: candidate.targetInputSha256,
      snapshotRef: candidate.snapshotRef,
      execution: candidate.execution,
      claims: Object.freeze({
        steadyStatus: "converged" as const,
        numericalHealth: "passed" as const,
        snapshotIsWarmRestartable: true as const,
        canonicalSignalSamplesStored: false as const,
        canonicalWindowMetricsStored: false as const,
      }),
    });
    const ref = await this.artifacts.putJson({
      kind: "run-artifact",
      mediaType: RUN_ARTIFACT_MEDIA_TYPE_V1,
      content: content as unknown as StudioJsonValueV1,
    });

    const currentSession = this.requireLiveStateV1();
    const current = requiredBranchV1(currentSession, scenarioId);
    assertCandidateStillCurrentV1(
      currentSession,
      current,
      beforeSession,
      before,
      candidate,
      before.presentationRevision,
      "steady candidate changed while run artifact was being pinned",
    );
    if (!current.pinnedRunRefs.some(({ sha256 }) => sha256 === ref.sha256)) {
      this.replaceBranchV1(scenarioId, Object.freeze({
        ...current,
        pinnedRunRefs: Object.freeze([...current.pinnedRunRefs, ref]),
      }));
    }
    return ref;
  }

  async suspendBranch(scenarioId: string): Promise<void> {
    const before = requiredBranchV1(this.requireLiveStateV1(), scenarioId);
    if (before.livePlayback === "suspended") return;
    this.beginPlaybackTransitionV1(scenarioId);
    this.invalidateSignalActivationV1(before.signalChannelRef);
    const pendingActivation = this.signalActivationOperations.get(
      before.signalChannelRef.channelId,
    );
    try {
      this.replaceBranchV1(scenarioId, Object.freeze({
        ...before,
        livePlayback: "suspended",
      }));
      await pendingActivation;
      await this.runtime.suspendSignalChannel(before.signalChannelRef);
      const current = requiredBranchV1(this.requireLiveStateV1(), scenarioId);
      assertSameSignalChannelV1(
        current.signalChannelRef,
        before.signalChannelRef,
      );
    } finally {
      this.playbackTransitionScenarioIds.delete(scenarioId);
    }
  }

  async resumeBranch(scenarioId: string): Promise<void> {
    const before = requiredBranchV1(this.requireLiveStateV1(), scenarioId);
    if (before.livePlayback === "running") return;
    this.beginPlaybackTransitionV1(scenarioId);
    this.invalidateSignalActivationV1(before.signalChannelRef);
    const pendingActivation = this.signalActivationOperations.get(
      before.signalChannelRef.channelId,
    );
    try {
      this.replaceBranchV1(scenarioId, Object.freeze({
        ...before,
        livePlayback: "running",
      }));
      await pendingActivation;
      await this.runtime.resumeSignalChannel(
        before.signalChannelRef,
        before.streamEpoch,
      );
      const current = requiredBranchV1(this.requireLiveStateV1(), scenarioId);
      assertSameSignalChannelV1(
        current.signalChannelRef,
        before.signalChannelRef,
      );
      if (current.streamEpoch !== before.streamEpoch) {
        throw new SimulationSessionCommandConflictV1(
          "signal epoch changed during playback transition",
        );
      }
    } catch (error) {
      this.failSignalIdentityV1(
        before,
        `runtime signal channel resume failed: ${errorMessageV1(error)}`,
      );
      throw error;
    } finally {
      this.playbackTransitionScenarioIds.delete(scenarioId);
    }
  }

  async close(): Promise<void> {
    const openingCompletion = this.openingCompletion;
    const openingSessionId = this.openingSessionId;
    if (openingCompletion !== null && openingSessionId !== null) {
      this.closeRequestedWhileOpening = true;
      const runtimeClose = this.openingRuntimeClose
        ?? this.runtime.closeSession(openingSessionId);
      this.openingRuntimeClose = runtimeClose;
      let closeFailure: unknown = null;
      try {
        await runtimeClose;
      } catch (error) {
        closeFailure = error;
      }
      await openingCompletion;
      if (closeFailure !== null) throw closeFailure;
      return;
    }
    const current = this.state;
    if (current === null || current.status === "closed") return;
    if (current.status === "closing") {
      await this.closePromise;
      return;
    }
    if (this.promotingScenarioIds.size > 0) {
      throw new SimulationSessionCommandConflictV1(
        "simulation session has an in-flight branch promotion",
      );
    }
    if (this.playbackTransitionScenarioIds.size > 0) {
      throw new SimulationSessionCommandConflictV1(
        "simulation session has an in-flight playback transition",
      );
    }
    const pendingActivations: Promise<void>[] = [];
    for (const branch of current.branches) {
      this.invalidateSignalActivationV1(branch.signalChannelRef);
      const pending = this.signalActivationOperations.get(
        branch.signalChannelRef.channelId,
      );
      if (pending !== undefined) pendingActivations.push(pending);
    }
    const closingState = Object.freeze({
      ...current,
      status: "closing" as const,
    });
    this.publishStateV1(closingState);
    const runtimeClose = pendingActivations.length === 0
      ? this.runtime.closeSession(current.sessionId)
      : Promise.allSettled(pendingActivations)
        .then(() => this.runtime.closeSession(current.sessionId));
    const operation = runtimeClose.then(
      () => {
        if (this.state === closingState) {
          this.unsubscribeAllSignalsV1();
          this.signalActivationTokens.clear();
          this.signalActivationOperations.clear();
          this.publishStateV1(Object.freeze({
            ...closingState,
            status: "closed",
            branches: Object.freeze(closingState.branches.map((branch) =>
              Object.freeze({
                ...branch,
                latestSteadyCandidate: null,
              }))),
          }));
        }
      },
      (error) => {
        if (this.state === closingState) {
          const restored = Object.freeze({
            ...closingState,
            status: "live",
          });
          this.publishStateV1(restored);
          for (const branch of restored.branches) {
            if (branch.livePlayback === "running") {
              this.activateSignalEpochV1(
                branch,
                "signal epoch reactivation after close failure failed",
              );
            }
          }
        }
        throw error;
      },
    ).finally(() => {
      if (this.closePromise === operation) this.closePromise = null;
    });
    this.closePromise = operation;
    await operation;
  }

  private beginPlaybackTransitionV1(scenarioId: string): void {
    if (this.promotingScenarioIds.has(scenarioId)) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${scenarioId} is being promoted`,
      );
    }
    if (this.playbackTransitionScenarioIds.has(scenarioId)) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${scenarioId} playback is already transitioning`,
      );
    }
    this.playbackTransitionScenarioIds.add(scenarioId);
  }

  private bindOpenedSignalChannelsV1(): void {
    const current = this.requireLiveStateV1();
    for (const branch of current.branches) {
      const channel = branch.signalChannelRef;
      if (this.signalSubscriptions.has(channel.channelId)) {
        throw new SimulationSessionCoordinatorErrorV1(
          `duplicate signal channel ${channel.channelId}`,
        );
      }
      const subscription = this.runtime.subscribeSignalChannel(
        channel,
        (event) => this.acceptSignalEventV1(channel, event),
      );
      if (
        subscription === null
        || typeof subscription !== "object"
        || typeof subscription.unsubscribe !== "function"
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          `runtime returned invalid signal subscription for ${channel.channelId}`,
        );
      }
      this.signalSubscriptions.set(channel.channelId, subscription);
    }
  }

  private unsubscribeAllSignalsV1(): void {
    for (const subscription of this.signalSubscriptions.values()) {
      try {
        subscription.unsubscribe();
      } catch {
        // A local listener detach failure cannot make closed state live again.
      }
    }
    this.signalSubscriptions.clear();
  }

  private acceptSignalEventV1(
    channel: RuntimeSignalChannelRefV1,
    event: RuntimeSignalEventV1,
  ): void {
    const current = this.state;
    if (current === null || current.status !== "live") return;
    const branch = current.branches.find(({ scenarioId }) =>
      scenarioId === channel.scenarioId
    );
    if (branch === undefined) return;
    // The runtime completes and publishes the command already in flight at a
    // manual suspend boundary. Accept that final contiguous batch while the
    // suspend command is still active; dropping it would make the next resumed
    // sequence and collectedPointCount appear to jump.
    const acceptingSuspensionBoundary =
      branch.livePlayback === "suspended"
      && this.playbackTransitionScenarioIds.has(branch.scenarioId);
    if (
      branch.livePlayback !== "running"
      && !acceptingSuspensionBoundary
    ) return;

    const untrustedEvent: unknown = event;
    if (!hasRuntimeSignalIdentityV1(untrustedEvent)) {
      this.failSignalIdentityV1(
        branch,
        "runtime signal channel emitted a malformed current event",
      );
      return;
    }
    const signal = untrustedEvent;
    if (
      signal.channelId !== channel.channelId
      || signal.sessionId !== current.sessionId
      || signal.scenarioId !== branch.scenarioId
      || signal.liveBranchId !== branch.liveBranchId
      || signal.targetGeneration !== branch.targetGeneration
      || signal.presentationRevision !== branch.presentationRevision
      || signal.streamEpoch !== branch.streamEpoch
    ) {
      // An already-issued callback may cross a target/presentation boundary.
      // Explicitly stale identities are expected and never affect the current
      // branch.
      return;
    }
    if (signal.kind === "failure") {
      const message = typeof signal.message === "string"
        && signal.message.length > 0
        ? signal.message
        : "runtime signal channel emitted a malformed failure";
      this.failSignalIdentityV1(branch, message);
      return;
    }

    try {
      if (
        signal.kind !== "samples"
        || !Array.isArray(signal.points)
        || signal.points.length === 0
        || signal.points.length > 1_024
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          "runtime signal channel emitted a malformed sample batch",
        );
      }
      const points = Object.freeze(signal.points.map((point) =>
        copyPointV1(point as RuntimeObservablePointV1)));
      let prior = branch.display.latestPoint;
      for (const point of points) {
        if (
          point.sequence !== prior.sequence + 1
          || point.simulationTimeSec <= prior.simulationTimeSec
        ) {
          throw new SimulationSessionCoordinatorErrorV1(
            "runtime signal batch is not strictly monotonic",
          );
        }
        prior = point;
      }
      const metrics = copyMetricsV1(
        signal.windowMetrics as RuntimeWindowMetricStateV1,
      );
      const nextPointCount = branch.display.pointCount + points.length;
      if (metrics.collectedPointCount !== nextPointCount) {
        throw new SimulationSessionCoordinatorErrorV1(
          "runtime signal metrics do not match the trace point count",
        );
      }
      const previousMetrics = branch.display.windowMetrics;
      if (
        (
          previousMetrics.status === "complete"
          && metrics.status === "collecting"
        )
        || metrics.completedCycleCount
          < previousMetrics.completedCycleCount
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          "runtime signal metrics regressed",
        );
      }
      const replacement = Object.freeze({
        ...branch,
        display: Object.freeze({
          ...branch.display,
          latestPoint: points.at(-1)!,
          pointCount: nextPointCount,
          windowMetrics: metrics,
        }),
      });
      this.replaceBranchV1(branch.scenarioId, replacement);
      this.publishPresentationAppendV1(
        current.sessionId,
        replacement,
        points,
        metrics,
      );
    } catch {
      this.failSignalIdentityV1(
        branch,
        "runtime signal channel emitted an invalid batch",
      );
    }
  }

  private activateSignalEpochV1(
    branch: ScenarioRuntimeBranchStateV1,
    failurePrefix: string,
  ): void {
    const channelId = branch.signalChannelRef.channelId;
    const token = this.invalidateSignalActivationV1(
      branch.signalChannelRef,
    );
    const predecessor = this.signalActivationOperations.get(channelId);
    const operation = (async () => {
      await predecessor?.catch(() => undefined);
      if (!this.isSignalActivationCurrentV1(branch, token)) return;
      try {
        await this.runtime.resumeSignalChannel(
          branch.signalChannelRef,
          branch.streamEpoch,
        );
      } catch (error) {
        if (this.isSignalActivationCurrentV1(branch, token)) {
          this.failSignalIdentityV1(
            branch,
            `${failurePrefix}: ${errorMessageV1(error)}`,
          );
        }
        await this.bestEffortSuspendSignalChannelV1(
          branch.signalChannelRef,
        );
        return;
      }
      if (!this.isSignalActivationCurrentV1(branch, token)) {
        // A delayed resume can cross a suspend, target, promotion, or close
        // boundary. Fence that stale activation before the next queued epoch
        // may start.
        await this.bestEffortSuspendSignalChannelV1(
          branch.signalChannelRef,
        );
      }
    })();
    this.signalActivationOperations.set(channelId, operation);
    void operation.finally(() => {
      if (this.signalActivationOperations.get(channelId) === operation) {
        this.signalActivationOperations.delete(channelId);
      }
    });
  }

  private invalidateSignalActivationV1(
    channel: RuntimeSignalChannelRefV1,
  ): number {
    const current = this.signalActivationTokens.get(channel.channelId) ?? 0;
    const next = current === Number.MAX_SAFE_INTEGER ? 1 : current + 1;
    this.signalActivationTokens.set(channel.channelId, next);
    return next;
  }

  private isSignalActivationCurrentV1(
    expected: ScenarioRuntimeBranchStateV1,
    token: number,
  ): boolean {
    if (
      this.signalActivationTokens.get(
        expected.signalChannelRef.channelId,
      ) !== token
    ) return false;
    const current = this.state;
    if (current === null || current.status !== "live") return false;
    const branch = current.branches.find(({ scenarioId }) =>
      scenarioId === expected.scenarioId
    );
    if (
      branch === undefined
      || branch.livePlayback !== "running"
      || branch.liveBranchId !== expected.liveBranchId
      || branch.targetGeneration !== expected.targetGeneration
      || branch.presentationRevision !== expected.presentationRevision
      || branch.streamEpoch !== expected.streamEpoch
    ) return false;
    try {
      assertSameSignalChannelV1(
        branch.signalChannelRef,
        expected.signalChannelRef,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async bestEffortSuspendSignalChannelV1(
    channel: RuntimeSignalChannelRefV1,
  ): Promise<void> {
    try {
      await this.runtime.suspendSignalChannel(channel);
    } catch {
      // The current control-plane state remains authoritative and fail-closed.
    }
  }

  private failSignalIdentityV1(
    expected: ScenarioRuntimeBranchStateV1,
    message: string,
  ): void {
    const current = this.state;
    if (current === null || current.status !== "live") return;
    const branch = current.branches.find(({ scenarioId }) =>
      scenarioId === expected.scenarioId
    );
    if (
      branch === undefined
      || branch.liveBranchId !== expected.liveBranchId
      || branch.targetGeneration !== expected.targetGeneration
      || branch.presentationRevision !== expected.presentationRevision
      || branch.streamEpoch !== expected.streamEpoch
    ) return;
    try {
      assertSameSignalChannelV1(
        branch.signalChannelRef,
        expected.signalChannelRef,
      );
    } catch {
      return;
    }
    // Data-plane corruption and activation failure are fail-closed for
    // presentation. Runtime suspension is best effort because this path is
    // also used from observer callbacks.
    void this.runtime.suspendSignalChannel(branch.signalChannelRef)
      .catch(() => undefined);
    this.replaceBranchV1(branch.scenarioId, Object.freeze({
      ...branch,
      livePlayback: "suspended",
      lastRuntimeFailure: Object.freeze({
        lane: "live" as const,
        intentId: current.lastAppliedIntentId ?? "runtime/signal-channel",
        targetGeneration: branch.targetGeneration,
        message,
      }),
    }));
  }

  private acceptLiveIntentV1(
    command: RuntimeTargetIntentCommandV1,
    result: RuntimeLiveIntentResultV1,
  ): void {
    try {
      assertIntentEnvelopeV1(command, result);
      const byScenario = exactResultsByScenarioV1(
        command,
        result.branches,
        "live",
      );
      const current = this.state;
      if (
        current === null
        || current.status !== "live"
        || current.sessionId !== command.sessionId
      ) return;
      let changed = false;
      const activations: ScenarioRuntimeBranchStateV1[] = [];
      const suspensions: ScenarioRuntimeBranchStateV1[] = [];
      const presentationResets: ScenarioRuntimeBranchStateV1[] = [];
      const branches = current.branches.map((branch) => {
        const target = targetForScenarioV1(command, branch.scenarioId);
        if (
          target === null
          || branch.targetGeneration !== target.targetGeneration
          || branch.presentationRevision !== target.presentationRevision
          || branch.targetInputSha256 !== target.patch.targetInputSha256
        ) return branch;
        const branchResult = byScenario.get(branch.scenarioId)!;
        assertBranchResultIdentityV1(branchResult, target, "live");
        if (branchResult.status === "failure") {
          changed = true;
          const replacement = Object.freeze({
            ...branch,
            livePlayback: "suspended" as const,
            lastRuntimeFailure: laneFailureV1(
              command,
              target,
              "live",
              branchResult.message,
            ),
          });
          suspensions.push(replacement);
          return replacement;
        }
        if (branchResult.status !== "success") return branch;
        changed = true;
        const live = copyLiveResultV1(branchResult.result, target);
        if (live.streamEpoch <= branch.streamEpoch) {
          throw new SimulationSessionCoordinatorErrorV1(
            "live transition did not advance the stream epoch",
          );
        }
        const replacement = Object.freeze({
          ...branch,
          streamEpoch: live.streamEpoch,
          display: Object.freeze({
            origin: Object.freeze({
              kind: "live-transition" as const,
              targetGeneration: target.targetGeneration,
            }),
            firstPoint: live.frame.point,
            latestPoint: live.frame.point,
            pointCount: 1,
            windowMetrics: live.frame.windowMetrics,
          }),
          lastRuntimeFailure: clearLaneFailureV1(
            branch.lastRuntimeFailure,
            "live",
          ),
        });
        if (branch.livePlayback === "running") {
          activations.push(replacement);
        }
        presentationResets.push(replacement);
        return replacement;
      });
      if (changed) {
        this.publishStateV1(Object.freeze({
          ...current,
          branches: Object.freeze(branches),
        }));
        for (const branch of presentationResets) {
          this.publishPresentationResetV1(current.sessionId, branch);
        }
        for (const branch of suspensions) {
          void this.runtime.suspendSignalChannel(branch.signalChannelRef)
            .catch(() => undefined);
        }
        for (const branch of activations) {
          this.activateSignalEpochV1(
            branch,
            "live transition signal epoch activation failed",
          );
        }
      }
    } catch (error) {
      this.acceptIntentFailureV1(command, "live", error);
    }
  }

  private acceptStrictIntentV1(
    command: RuntimeTargetIntentCommandV1,
    result: RuntimeStrictIntentResultV1,
  ): void {
    try {
      assertIntentEnvelopeV1(command, result);
      const byScenario = exactResultsByScenarioV1(
        command,
        result.branches,
        "strict",
      );
      const current = this.state;
      if (
        current === null
        || current.status !== "live"
        || current.sessionId !== command.sessionId
      ) return;
      let changed = false;
      const branches = current.branches.map((branch) => {
        const target = targetForScenarioV1(command, branch.scenarioId);
        if (
          target === null
          || branch.targetGeneration !== target.targetGeneration
          || branch.presentationRevision !== target.presentationRevision
          || branch.targetInputSha256 !== target.patch.targetInputSha256
        ) return branch;
        const branchResult = byScenario.get(branch.scenarioId)!;
        assertBranchResultIdentityV1(branchResult, target, "strict");
        if (branchResult.status === "failure") {
          changed = true;
          return Object.freeze({
            ...branch,
            lastRuntimeFailure: laneFailureV1(
              command,
              target,
              "strict",
              branchResult.message,
            ),
          });
        }
        if (branchResult.status !== "success") return branch;
        changed = true;
        const candidate = copyCandidateV1(
          branchResult.candidate,
          current.sessionId,
          target,
          branch,
        );
        return Object.freeze({
          ...branch,
          latestSteadyCandidate: candidate,
          lastRuntimeFailure: clearLaneFailureV1(
            branch.lastRuntimeFailure,
            "strict",
          ),
        });
      });
      if (changed) {
        this.publishStateV1(Object.freeze({
          ...current,
          branches: Object.freeze(branches),
        }));
      }
    } catch (error) {
      this.acceptIntentFailureV1(command, "strict", error);
    }
  }

  private acceptIntentFailureV1(
    command: RuntimeTargetIntentCommandV1,
    lane: RuntimeLaneFailureV1["lane"],
    error: unknown,
  ): void {
    const current = this.state;
    if (
      current === null
      || current.status !== "live"
      || current.sessionId !== command.sessionId
    ) return;
    let changed = false;
    const suspensions: ScenarioRuntimeBranchStateV1[] = [];
    const branches = current.branches.map((branch) => {
      const target = targetForScenarioV1(command, branch.scenarioId);
      if (
        target === null
        || branch.targetGeneration !== target.targetGeneration
        || branch.presentationRevision !== target.presentationRevision
      ) return branch;
      changed = true;
      const replacement = Object.freeze({
        ...branch,
        ...(lane === "live"
          ? { livePlayback: "suspended" as const }
          : {}),
        lastRuntimeFailure: laneFailureV1(
          command,
          target,
          lane,
          errorMessageV1(error),
        ),
      });
      if (lane === "live") suspensions.push(replacement);
      return replacement;
    });
    if (changed) {
      this.publishStateV1(Object.freeze({
        ...current,
        branches: Object.freeze(branches),
      }));
      for (const branch of suspensions) {
        void this.runtime.suspendSignalChannel(branch.signalChannelRef)
          .catch(() => undefined);
      }
    }
  }

  private publishStateV1(
    next: SimulationSessionStateV1 | null,
  ): boolean {
    if (this.state === next) return false;
    this.state = next;
    for (const listener of [...this.stateListeners]) {
      try {
        listener();
      } catch {
        // External-store subscribers cannot invalidate an accepted numerical
        // state transition or prevent other external-store listeners.
      }
    }
    return true;
  }

  private publishPresentationResetV1(
    sessionId: string,
    branch: ScenarioRuntimeBranchStateV1,
  ): void {
    const frame = Object.freeze({
      point: branch.display.firstPoint,
      windowMetrics: branch.display.windowMetrics,
    }) satisfies RuntimePresentationFrameV1;
    assertOnePointCollectingFrameV1(
      frame,
      `presentation reset for ${branch.scenarioId}`,
    );
    if (
      branch.display.pointCount !== 1
      || branch.display.firstPoint !== branch.display.latestPoint
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `presentation reset for ${branch.scenarioId} must contain one point`,
      );
    }
    this.publishPresentationEventV1(Object.freeze({
      kind: "reset" as const,
      sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration: branch.targetGeneration,
      presentationRevision: branch.presentationRevision,
      streamEpoch: branch.streamEpoch,
      origin: branch.display.origin,
      frame,
    }));
  }

  private publishPresentationAppendV1(
    sessionId: string,
    branch: ScenarioRuntimeBranchStateV1,
    points: readonly RuntimeObservablePointV1[],
    windowMetrics: RuntimeWindowMetricStateV1,
  ): void {
    this.publishPresentationEventV1(Object.freeze({
      kind: "append" as const,
      sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration: branch.targetGeneration,
      presentationRevision: branch.presentationRevision,
      streamEpoch: branch.streamEpoch,
      points: Object.freeze([...points]),
      windowMetrics,
    }));
  }

  private publishPresentationEventV1(
    event: RuntimePresentationEventV1,
  ): void {
    for (const listener of [...this.presentationListeners]) {
      try {
        listener(event);
      } catch {
        // A consumer rendering a validated trace cannot corrupt or suspend the
        // coordinator-owned numerical branch.
      }
    }
  }

  private replaceBranchV1(
    scenarioId: string,
    replacement: ScenarioRuntimeBranchStateV1,
  ): void {
    const current = this.requireLiveStateV1();
    this.publishStateV1(Object.freeze({
      ...current,
      branches: Object.freeze(current.branches.map((branch) =>
        branch.scenarioId === scenarioId ? replacement : branch)),
    }));
  }

  private requireLiveStateV1(): SimulationSessionStateV1 {
    const current = this.current;
    if (current.status !== "live") {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session is not live",
      );
    }
    return current;
  }
}

function initialBranchStateV1(
  source: OpenScenarioRuntimeBranchV1,
  opened: RuntimeScenarioBranchOpenedV1,
): ScenarioRuntimeBranchStateV1 {
  assertOnePointCollectingFrameV1(
    opened.initialFrame,
    `opened snapshot for ${source.scenarioId}`,
  );
  return Object.freeze({
    scenarioId: source.scenarioId,
    liveBranchId: opened.liveBranchId,
    sourceRunRef: source.sourceRunRef,
    sourceInputRef: source.sourceInputRef,
    sourceSnapshotRef: source.sourceSnapshotRef,
    signalChannelRef: opened.signalChannelRef,
    streamEpoch: opened.streamEpoch,
    livePlayback: "suspended",
    execution: opened.execution,
    targetGeneration: INITIAL_TARGET_GENERATION_V1,
    presentationRevision: INITIAL_PRESENTATION_REVISION_V1,
    targetInputSha256: source.initialTargetInputSha256,
    display: Object.freeze({
      origin: Object.freeze({
        kind: "opened-run" as const,
        runRef: source.sourceRunRef,
      }),
      firstPoint: opened.initialFrame.point,
      latestPoint: opened.initialFrame.point,
      pointCount: 1,
      windowMetrics: opened.initialFrame.windowMetrics,
    }),
    latestSteadyCandidate: null,
    pinnedRunRefs: Object.freeze([]),
    lastRuntimeFailure: null,
  });
}

function assertOnePointCollectingFrameV1(
  frame: RuntimePresentationFrameV1,
  path: string,
): void {
  if (
    frame.windowMetrics.status !== "collecting"
    || frame.windowMetrics.collectedPointCount !== 1
    || frame.windowMetrics.completedCycleCount !== 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must restart with exactly one collected point and no completed cycle`,
    );
  }
}

function assertCandidateStillCurrentV1(
  currentSession: SimulationSessionStateV1,
  current: ScenarioRuntimeBranchStateV1,
  beforeSession: SimulationSessionStateV1,
  before: ScenarioRuntimeBranchStateV1,
  candidate: RuntimeSteadyCandidateV1,
  expectedPresentationRevision: number,
  message: string,
): void {
  const currentCandidate = current.latestSteadyCandidate;
  if (
    currentSession.sessionId !== beforeSession.sessionId
    || current.scenarioId !== before.scenarioId
    || current.targetGeneration !== before.targetGeneration
    || current.presentationRevision !== expectedPresentationRevision
    || currentCandidate === null
    || currentCandidate.candidateId !== candidate.candidateId
    || currentCandidate.targetGeneration !== candidate.targetGeneration
    || currentCandidate.targetInputSha256 !== candidate.targetInputSha256
    || !sameArtifactRefV1(
      currentCandidate.snapshotRef,
      candidate.snapshotRef,
    )
    || !sameArtifactRefV1(
      currentCandidate.sourceRunRef,
      candidate.sourceRunRef,
    )
    || !sameArtifactRefV1(
      currentCandidate.simulationInputRef,
      candidate.simulationInputRef,
    )
    || !sameExecutionV1(currentCandidate.execution, candidate.execution)
    || currentCandidate.steadyStatus !== candidate.steadyStatus
    || currentCandidate.numericalHealth !== candidate.numericalHealth
  ) {
    throw new SimulationSessionCommandConflictV1(message);
  }
}

function currentCandidateV1(
  branch: ScenarioRuntimeBranchStateV1,
): RuntimeSteadyCandidateV1 {
  const candidate = branch.latestSteadyCandidate;
  if (
    candidate === null
    || candidate.targetGeneration !== branch.targetGeneration
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `no steady candidate exists for current scenario ${branch.scenarioId}`,
    );
  }
  return candidate;
}

function requiredBranchV1(
  state: SimulationSessionStateV1,
  scenarioId: string,
): ScenarioRuntimeBranchStateV1 {
  const branch = state.branches.find((entry) =>
    entry.scenarioId === scenarioId
  );
  if (branch === undefined) {
    throw new SimulationSessionCoordinatorErrorV1(
      `unknown scenarioId ${scenarioId}`,
    );
  }
  return branch;
}

function nextGenerationV1(
  current: TargetGenerationV1,
): TargetGenerationV1 {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "current target generation is invalid",
    );
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw new SimulationSessionCoordinatorErrorV1(
      "target generation exhausted",
    );
  }
  return current + 1;
}

function nextPresentationRevisionV1(current: number): number {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "current presentation revision is invalid",
    );
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw new SimulationSessionCoordinatorErrorV1(
      "presentation revision exhausted",
    );
  }
  return current + 1;
}

function copyOpenCommandV1(
  command: OpenSimulationSessionCommandV1,
): OpenSimulationSessionCommandV1 {
  assertPortableIdV1(command?.sessionId, "sessionId");
  if (!Array.isArray(command?.branches) || command.branches.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "open command requires at least one scenario branch",
    );
  }
  const seen = new Set<string>();
  const branches = command.branches.map((branch, index) => {
    assertPortableIdV1(branch?.scenarioId, `branches[${index}].scenarioId`);
    if (seen.has(branch.scenarioId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `duplicate scenarioId ${branch.scenarioId}`,
      );
    }
    seen.add(branch.scenarioId);
    assertSha256V1(
      branch.initialTargetInputSha256,
      `branches[${index}].initialTargetInputSha256`,
    );
    return Object.freeze({
      scenarioId: branch.scenarioId,
      sourceRunRef: copyArtifactRefV1(
        branch.sourceRunRef,
        "run-artifact",
        `branches[${index}].sourceRunRef`,
      ),
      sourceInputRef: copyArtifactRefV1(
        branch.sourceInputRef,
        "simulation-input",
        `branches[${index}].sourceInputRef`,
      ),
      sourceSnapshotRef: copyArtifactRefV1(
        branch.sourceSnapshotRef,
        "snapshot-envelope",
        `branches[${index}].sourceSnapshotRef`,
      ),
      initialTargetInputSha256: branch.initialTargetInputSha256,
    });
  });
  return Object.freeze({
    sessionId: command.sessionId,
    branches: Object.freeze(branches),
  });
}

function copyOpenedSessionV1(
  opened: RuntimeSessionOpenedV1,
  command: OpenSimulationSessionCommandV1,
): RuntimeSessionOpenedV1 {
  if (
    opened?.sessionId !== command.sessionId
    || !Array.isArray(opened?.branches)
    || opened.branches.length !== command.branches.length
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime opened a different session or branch count",
    );
  }
  const expected = new Set(command.branches.map(({ scenarioId }) => scenarioId));
  const sourceByScenario = new Map(
    command.branches.map((source) => [source.scenarioId, source]),
  );
  const seen = new Set<string>();
  const branches = opened.branches.map((branch, index) => {
    if (
      !expected.has(branch?.scenarioId)
      || seen.has(branch.scenarioId)
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `opened branch ${index} has an unexpected or duplicate scenarioId`,
      );
    }
    seen.add(branch.scenarioId);
    const source = sourceByScenario.get(branch.scenarioId)!;
    assertPortableIdV1(branch.liveBranchId, "liveBranchId");
    const sourceRunRef = copyArtifactRefV1(
      branch.sourceRunRef,
      "run-artifact",
      `opened.branches[${index}].sourceRunRef`,
    );
    const sourceInputRef = copyArtifactRefV1(
      branch.sourceInputRef,
      "simulation-input",
      `opened.branches[${index}].sourceInputRef`,
    );
    const sourceSnapshotRef = copyArtifactRefV1(
      branch.sourceSnapshotRef,
      "snapshot-envelope",
      `opened.branches[${index}].sourceSnapshotRef`,
    );
    const signalChannelRef = copySignalChannelRefV1(
      branch.signalChannelRef,
      command.sessionId,
      branch.scenarioId,
      branch.liveBranchId,
    );
    assertStreamEpochV1(
      branch.streamEpoch,
      `opened.branches[${index}].streamEpoch`,
    );
    if (
      !sameArtifactRefV1(sourceRunRef, source.sourceRunRef)
      || !sameArtifactRefV1(sourceInputRef, source.sourceInputRef)
      || !sameArtifactRefV1(sourceSnapshotRef, source.sourceSnapshotRef)
      || branch.initialTargetInputSha256
        !== source.initialTargetInputSha256
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `opened branch ${branch.scenarioId} source binding mismatch`,
      );
    }
    return Object.freeze({
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      sourceRunRef,
      sourceInputRef,
      sourceSnapshotRef,
      initialTargetInputSha256: branch.initialTargetInputSha256,
      signalChannelRef,
      streamEpoch: branch.streamEpoch,
      execution: copyExecutionV1(branch.execution),
      initialFrame: copyFrameV1(branch.initialFrame),
    });
  });
  return Object.freeze({
    sessionId: opened.sessionId,
    branches: Object.freeze(branches),
  });
}

function copyControlIntentV1(
  intent: RuntimeControlIntentV1,
  state: SimulationSessionStateV1,
): RuntimeControlIntentV1 {
  assertPortableIdV1(intent?.intentId, "intentId");
  if (!Array.isArray(intent?.targets) || intent.targets.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "control intent requires at least one targeted branch",
    );
  }
  const known = new Set(state.branches.map(({ scenarioId }) => scenarioId));
  const seen = new Set<string>();
  const targets = intent.targets.map((target, index) => {
    if (
      !known.has(target?.scenarioId)
      || seen.has(target.scenarioId)
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `intent target ${index} has an unknown or duplicate scenarioId`,
      );
    }
    seen.add(target.scenarioId);
    return Object.freeze({
      scenarioId: target.scenarioId,
      patch: copyControlPatchV1(target.patch),
    });
  });
  return Object.freeze({
    intentId: intent.intentId,
    targets: Object.freeze(targets),
  });
}

function copyControlPatchV1(
  patch: RuntimeControlPatchV1,
): RuntimeControlPatchV1 {
  assertSha256V1(patch?.targetInputSha256, "targetInputSha256");
  if (
    patch.values === null
    || typeof patch.values !== "object"
    || Array.isArray(patch.values)
    || Object.keys(patch.values).length === 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "control patch values must be a non-empty object",
    );
  }
  const values: Record<string, boolean | number | string> = {};
  for (const [key, value] of Object.entries(patch.values)) {
    assertPortableIdV1(key, "control patch key");
    if (
      typeof value !== "boolean"
      && typeof value !== "string"
      && (typeof value !== "number" || !Number.isFinite(value))
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `control patch ${key} must be a finite scalar`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    targetInputSha256: patch.targetInputSha256,
    values: Object.freeze(values),
  });
}

function assertIntentEnvelopeV1(
  command: RuntimeTargetIntentCommandV1,
  result: RuntimeLiveIntentResultV1 | RuntimeStrictIntentResultV1,
): void {
  if (
    result?.sessionId !== command.sessionId
    || result?.intentId !== command.intentId
    || !Array.isArray(result.branches)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime intent result identity mismatch",
    );
  }
}

function exactResultsByScenarioV1<T extends Readonly<{
  scenarioId: string;
}>>(
  command: RuntimeTargetIntentCommandV1,
  results: readonly T[],
  lane: string,
): Map<string, T> {
  if (results.length !== command.targets.length) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} intent result branch count mismatch`,
    );
  }
  const expected = new Set(command.targets.map(({ scenarioId }) => scenarioId));
  const map = new Map<string, T>();
  for (const result of results) {
    if (!expected.has(result.scenarioId) || map.has(result.scenarioId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `${lane} intent result has an unexpected or duplicate scenario`,
      );
    }
    map.set(result.scenarioId, result);
  }
  return map;
}

function targetForScenarioV1(
  command: RuntimeTargetIntentCommandV1,
  scenarioId: string,
): RuntimeTargetIntentBranchV1 | null {
  return command.targets.find((target) =>
    target.scenarioId === scenarioId
  ) ?? null;
}

function assertBranchResultIdentityV1(
  result: Readonly<{
    scenarioId: string;
    targetGeneration: number;
    targetInputSha256?: string;
  }>,
  target: RuntimeTargetIntentBranchV1,
  lane: string,
): void {
  const targetInputSha256 = "targetInputSha256" in result
    ? result.targetInputSha256
    : undefined;
  if (
    result.scenarioId !== target.scenarioId
    || result.targetGeneration !== target.targetGeneration
    || (
      targetInputSha256 !== undefined
      && targetInputSha256 !== target.patch.targetInputSha256
    )
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} branch result identity mismatch`,
    );
  }
}

function laneFailureV1(
  command: RuntimeTargetIntentCommandV1,
  target: RuntimeTargetIntentBranchV1,
  lane: RuntimeLaneFailureV1["lane"],
  message: string,
): RuntimeLaneFailureV1 {
  if (typeof message !== "string" || message.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} branch failure requires a message`,
    );
  }
  return Object.freeze({
    lane,
    intentId: command.intentId,
    targetGeneration: target.targetGeneration,
    message,
  });
}

function clearLaneFailureV1(
  failure: RuntimeLaneFailureV1 | null,
  lane: RuntimeLaneFailureV1["lane"],
): RuntimeLaneFailureV1 | null {
  return failure?.lane === lane ? null : failure;
}

function copyLiveResultV1(
  result: RuntimeLiveTransitionResultV1,
  target: RuntimeTargetIntentBranchV1,
): RuntimeLiveTransitionResultV1 {
  if (
    result?.scenarioId !== target.scenarioId
    || result?.targetGeneration !== target.targetGeneration
    || result?.presentationRevision !== target.presentationRevision
    || result?.targetInputSha256 !== target.patch.targetInputSha256
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "live transition result identity mismatch",
    );
  }
  assertStreamEpochV1(result.streamEpoch, "live.streamEpoch");
  const frame = copyFrameV1(result.frame);
  assertOnePointCollectingFrameV1(frame, "live transition");
  return Object.freeze({
    scenarioId: result.scenarioId,
    targetGeneration: result.targetGeneration,
    presentationRevision: result.presentationRevision,
    targetInputSha256: result.targetInputSha256,
    streamEpoch: result.streamEpoch,
    frame,
  });
}

function copyCandidateV1(
  candidate: RuntimeSteadyCandidateV1,
  sessionId: string,
  target: RuntimeTargetIntentBranchV1,
  branch: ScenarioRuntimeBranchStateV1,
): RuntimeSteadyCandidateV1 {
  if (
    candidate?.sessionId !== sessionId
    || candidate?.scenarioId !== target.scenarioId
    || candidate?.targetGeneration !== target.targetGeneration
    || candidate?.targetInputSha256 !== target.patch.targetInputSha256
    || candidate?.steadyStatus !== "converged"
    || candidate?.numericalHealth !== "passed"
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "strict steady candidate identity or health mismatch",
    );
  }
  assertPortableIdV1(candidate.candidateId, "candidateId");
  const sourceRunRef = copyArtifactRefV1(
    candidate.sourceRunRef,
    "run-artifact",
    "candidate.sourceRunRef",
  );
  const simulationInputRef = copyArtifactRefV1(
    candidate.simulationInputRef,
    "simulation-input",
    "candidate.simulationInputRef",
  );
  const execution = copyExecutionV1(candidate.execution);
  if (
    !sameArtifactRefV1(sourceRunRef, branch.sourceRunRef)
    || !sameArtifactRefV1(simulationInputRef, branch.sourceInputRef)
    || !sameExecutionV1(execution, branch.execution)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "strict steady candidate lineage mismatch",
    );
  }
  return Object.freeze({
    candidateId: candidate.candidateId,
    sessionId: candidate.sessionId,
    scenarioId: candidate.scenarioId,
    targetGeneration: candidate.targetGeneration,
    sourceRunRef,
    simulationInputRef,
    targetInputSha256: candidate.targetInputSha256,
    snapshotRef: copyArtifactRefV1(
      candidate.snapshotRef,
      "snapshot-envelope",
      "candidate.snapshotRef",
    ),
    execution,
    steadyStatus: "converged",
    numericalHealth: "passed",
  });
}

function copyPromotionV1(
  promoted: RuntimeCandidatePromotedV1,
  command: PromoteSteadyCandidateCommandV1,
): RuntimeCandidatePromotedV1 {
  if (
    promoted?.sessionId !== command.sessionId
    || promoted?.scenarioId !== command.scenarioId
    || promoted?.targetGeneration !== command.targetGeneration
    || promoted?.presentationRevision !== command.presentationRevision
    || promoted?.candidateId !== command.candidate.candidateId
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "promoted candidate result identity mismatch",
    );
  }
  assertStreamEpochV1(promoted.streamEpoch, "promoted.streamEpoch");
  return Object.freeze({
    sessionId: promoted.sessionId,
    scenarioId: promoted.scenarioId,
    targetGeneration: promoted.targetGeneration,
    presentationRevision: promoted.presentationRevision,
    candidateId: promoted.candidateId,
    streamEpoch: promoted.streamEpoch,
    initialFrame: copyFrameV1(promoted.initialFrame),
  });
}

function copyFrameV1(
  frame: RuntimePresentationFrameV1,
): RuntimePresentationFrameV1 {
  return Object.freeze({
    point: copyPointV1(frame?.point),
    windowMetrics: copyMetricsV1(frame?.windowMetrics),
  });
}

type RuntimeSignalIdentityRecordV1 = Readonly<{
  channelId: string;
  sessionId: string;
  scenarioId: string;
  liveBranchId: string;
  targetGeneration: number;
  presentationRevision: number;
  streamEpoch: number;
  [key: string]: unknown;
}>;

function hasRuntimeSignalIdentityV1(
  event: unknown,
): event is RuntimeSignalIdentityRecordV1 {
  if (
    event === null
    || typeof event !== "object"
    || Array.isArray(event)
  ) return false;
  const identity = event as Readonly<Record<string, unknown>>;
  return typeof identity.channelId === "string"
    && identity.channelId.length > 0
    && typeof identity.sessionId === "string"
    && identity.sessionId.length > 0
    && typeof identity.scenarioId === "string"
    && identity.scenarioId.length > 0
    && typeof identity.liveBranchId === "string"
    && identity.liveBranchId.length > 0
    && Number.isSafeInteger(identity.targetGeneration)
    && (identity.targetGeneration as number) >= 0
    && Number.isSafeInteger(identity.presentationRevision)
    && (identity.presentationRevision as number) >= 0
    && Number.isSafeInteger(identity.streamEpoch)
    && (identity.streamEpoch as number) >= 0;
}

function copyPointV1(
  point: RuntimeObservablePointV1,
): RuntimeObservablePointV1 {
  if (
    !Number.isSafeInteger(point?.sequence)
    || point.sequence < 0
    || !Number.isFinite(point?.simulationTimeSec)
    || point.simulationTimeSec < 0
    || (
      point.phase01 !== null
      && (
        !Number.isFinite(point.phase01)
        || point.phase01 < 0
        || point.phase01 >= 1
      )
    )
    || point.values === null
    || typeof point.values !== "object"
    || Array.isArray(point.values)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime observable point is invalid",
    );
  }
  const values: Record<string, number> = {};
  for (const [key, value] of Object.entries(point.values)) {
    assertPortableIdV1(key, "observable id");
    if (!Number.isFinite(value)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `observable ${key} must be finite`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    sequence: point.sequence,
    simulationTimeSec: point.simulationTimeSec,
    phase01: point.phase01,
    values: Object.freeze(values),
  });
}

function copyMetricsV1(
  metrics: RuntimeWindowMetricStateV1,
): RuntimeWindowMetricStateV1 {
  if (
    metrics === null
    || typeof metrics !== "object"
    || !Number.isSafeInteger(metrics.collectedPointCount)
    || metrics.collectedPointCount < 1
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime window metric state is invalid",
    );
  }
  if (metrics.status === "collecting") {
    if (metrics.completedCycleCount !== 0) {
      throw new SimulationSessionCoordinatorErrorV1(
        "collecting metrics cannot claim a completed cycle",
      );
    }
    return collectingMetricsV1(metrics.collectedPointCount);
  }
  if (
    metrics.status !== "complete"
    || !Number.isSafeInteger(metrics.completedCycleCount)
    || metrics.completedCycleCount < 1
    || metrics.values === null
    || typeof metrics.values !== "object"
    || Array.isArray(metrics.values)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "complete runtime window metrics are invalid",
    );
  }
  const values: Record<string, number> = {};
  for (const [key, value] of Object.entries(metrics.values)) {
    assertPortableIdV1(key, "metric id");
    if (!Number.isFinite(value)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `metric ${key} must be finite`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    status: "complete",
    collectedPointCount: metrics.collectedPointCount,
    completedCycleCount: metrics.completedCycleCount,
    values: Object.freeze(values),
  });
}

function collectingMetricsV1(
  collectedPointCount: number,
): RuntimeWindowMetricStateV1 {
  return Object.freeze({
    status: "collecting" as const,
    collectedPointCount,
    completedCycleCount: 0 as const,
  });
}

function copyExecutionV1(
  execution: RuntimeExecutionIdentityV1,
): RuntimeExecutionIdentityV1 {
  const copy = {
    modelRef: execution?.modelRef,
    runtimeRef: execution?.runtimeRef,
    solverRef: execution?.solverRef,
    stateCodecRef: execution?.stateCodecRef,
    protocolRef: execution?.protocolRef,
  };
  for (const [key, value] of Object.entries(copy)) {
    assertPortableIdV1(value, `execution.${key}`);
  }
  return Object.freeze(copy) as RuntimeExecutionIdentityV1;
}

function copySignalChannelRefV1(
  channel: RuntimeSignalChannelRefV1,
  sessionId: string,
  scenarioId: string,
  liveBranchId: string,
): RuntimeSignalChannelRefV1 {
  if (
    channel?.protocolId !== "circleheart-studio-runtime-signal-channel-v1"
    || channel.sessionId !== sessionId
    || channel.scenarioId !== scenarioId
    || channel.liveBranchId !== liveBranchId
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `signal channel binding mismatch for ${scenarioId}`,
    );
  }
  assertPortableIdV1(channel.channelId, "signal channelId");
  return Object.freeze({
    protocolId: "circleheart-studio-runtime-signal-channel-v1",
    channelId: channel.channelId,
    sessionId: channel.sessionId,
    scenarioId: channel.scenarioId,
    liveBranchId: channel.liveBranchId,
  });
}

function assertSameSignalChannelV1(
  left: RuntimeSignalChannelRefV1,
  right: RuntimeSignalChannelRefV1,
): void {
  if (
    left.protocolId !== right.protocolId
    || left.channelId !== right.channelId
    || left.sessionId !== right.sessionId
    || left.scenarioId !== right.scenarioId
    || left.liveBranchId !== right.liveBranchId
  ) {
    throw new SimulationSessionCommandConflictV1(
      "signal channel changed during playback transition",
    );
  }
}

function assertStreamEpochV1(value: unknown, path: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must be a nonnegative safe integer`,
    );
  }
}

function copyArtifactRefV1<TKind extends StudioArtifactKindV1>(
  ref: StudioArtifactRefV1<TKind>,
  expectedKind: TKind,
  path: string,
): StudioArtifactRefV1<TKind> {
  if (
    ref?.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== expectedKind
    || !SHA256_HEX_PATTERN_V1.test(ref.sha256)
    || typeof ref.mediaType !== "string"
    || ref.mediaType.length === 0
    || !Number.isSafeInteger(ref.byteLength)
    || ref.byteLength < 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} is not a valid ${expectedKind} artifact ref`,
    );
  }
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: ref.kind,
    sha256: ref.sha256,
    mediaType: ref.mediaType,
    byteLength: ref.byteLength,
  });
}

function sameArtifactRefV1(
  left: StudioArtifactRefV1,
  right: StudioArtifactRefV1,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function sameExecutionV1(
  left: RuntimeExecutionIdentityV1,
  right: RuntimeExecutionIdentityV1,
): boolean {
  return left.modelRef === right.modelRef
    && left.runtimeRef === right.runtimeRef
    && left.solverRef === right.solverRef
    && left.stateCodecRef === right.stateCodecRef
    && left.protocolRef === right.protocolRef;
}

function assertSha256V1(
  value: unknown,
  path: string,
): asserts value is Sha256HexV1 {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN_V1.test(value)) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must be lowercase SHA-256 hex`,
    );
  }
}

function assertPortableIdV1(
  value: unknown,
  path: string,
): asserts value is string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/.test(value)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must be a portable identifier`,
    );
  }
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

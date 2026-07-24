import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls";
import {
  loadMainWireScientificResolvedSessionInputEnvelopeV1,
  type MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
} from "@/engine/scientific/runtime";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  type ArtifactStorePortV1,
  type OpenScenarioRuntimeBranchV1,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeControlPatchV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeIntentBranchInterruptionV1,
  type RuntimeLiveIntentBranchResultV1,
  type RuntimeLiveIntentResultV1,
  type RuntimeObservablePointV1,
  type RuntimePresentationFrameV1,
  type RuntimeScenarioBranchOpenedV1,
  type RuntimeSessionOpenedV1,
  type RuntimeSignalChannelRefV1,
  type RuntimeSignalEventV1,
  type RuntimeSignalFailureV1,
  type RuntimeSignalSubscriptionV1,
  type RuntimeSteadyCandidateV1,
  type RuntimeStrictIntentBranchResultV1,
  type RuntimeStrictIntentResultV1,
  type RuntimeTargetIntentBranchV1,
  type RuntimeTargetIntentCommandV1,
  type RuntimeTargetIntentExecutionV1,
  type RuntimeWindowMetricStateV1,
  type RunArtifactRefV1,
  type SimulationInputRefV1,
  type SimulationRuntimePortV1,
  type SnapshotEnvelopeRefV1,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
  type StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";
import {
  createMainWireBrowserWorkerSessionHostFactoryV1,
  MainWireStudioTransientPartialProgressErrorV1,
} from "./MainWireBrowserWorkerSessionHostV1";
import type {
  MainWireStudioCheckpointReceiptV1,
  MainWireStudioHostedSessionV1,
  MainWireStudioPeriodicSettlementChunkV1,
  MainWireStudioSessionHostFactoryV1,
  MainWireStudioSessionHostV1,
  MainWireStudioTransientChunkV1,
} from "./MainWireStudioSessionHostV1";
import {
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
  mainWireStudioSeedPresentationFrameV1,
  putMainWireStudioSnapshotEnvelopeV1,
  type MainWireStudioSnapshotEnvelopeContentV1,
} from "./MainWireStudioSnapshotEnvelopeV1";
import {
  assertMainWireStudioTargetPatchV1,
  mainWireStudioTargetInputSha256V1,
} from "./MainWireStudioTargetResolverV1";

const MAIN_WIRE_LIVE_DT_SEC_V1 = 0.002;
const MAIN_WIRE_CYCLE_LENGTH_SEC_V1 = 1;
const DEFAULT_STRICT_MAXIMUM_BEAT_COUNT_V1 = 32;
const SIGNAL_CHANNEL_PROTOCOL_V1 =
  "circleheart-studio-runtime-signal-channel-v1" as const;

export type MainWireSimulationRuntimeAdapterOptionsV1 = Readonly<{
  artifacts: ArtifactStorePortV1;
  hostFactory?: MainWireStudioSessionHostFactoryV1;
  liveStepCountPerChunk?: number;
  strictMaximumBeatCount?: number;
  nowMs?: () => number;
  delayMs?: (durationMs: number) => Promise<void>;
}>;

export class MainWireSimulationRuntimeAdapterErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire Studio runtime failed: ${message}`);
    this.name = "MainWireSimulationRuntimeAdapterErrorV1";
  }
}

type AdapterSessionV1 = {
  sessionId: string;
  branches: Map<string, AdapterBranchV1>;
  activeIntentByScenario: Map<string, IntentBranchTokenV1>;
  transientHosts: Set<MainWireStudioSessionHostV1>;
  mutationTail: Promise<void>;
  closed: boolean;
};

type AdapterBranchV1 = {
  scenarioId: string;
  liveBranchId: string;
  sourceRunRef: RunArtifactRefV1;
  sourceInputRef: SimulationInputRefV1;
  sourceSnapshotRef: SnapshotEnvelopeRefV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
  host: MainWireStudioSessionHostV1;
  hostedSession: MainWireStudioHostedSessionV1;
  execution: RuntimeExecutionIdentityV1;
  signalChannelRef: RuntimeSignalChannelRefV1;
  signalObservers: Set<(event: RuntimeSignalEventV1) => void>;
  targetGeneration: number;
  reservedTargetGeneration: number;
  presentationRevision: number;
  reservedPresentationRevision: number;
  targetInputSha256: string;
  streamEpoch: number;
  activatedStreamEpoch: number | null;
  playbackRequested: boolean;
  desiredRunning: boolean;
  loopPromise: Promise<void> | null;
  activeLiveCommand: Promise<void> | null;
  suspensionCount: number;
  transitionCount: number;
  promotionInProgress: boolean;
  loopIdentity: number;
  liveFailure: Error | null;
  traceOriginTimeSec: number;
  tracePointCount: number;
};

type IntentBranchTokenV1 = {
  command: RuntimeTargetIntentCommandV1;
  target: RuntimeTargetIntentBranchV1;
  cancellation: "superseded" | "aborted" | null;
  cancellationReason: string | null;
  strictHost: MainWireStudioSessionHostV1 | null;
  liveSettled: boolean;
  strictSettled: boolean;
};

type PreparedBranchV1 = Readonly<{
  token: IntentBranchTokenV1;
  branch: AdapterBranchV1;
  oldLiveSessionId: string;
  liveTarget: MainWireStudioHostedSessionV1;
  strictHost: MainWireStudioSessionHostV1;
  strictTarget: MainWireStudioHostedSessionV1;
  targetState: MainWireScientificResearchControlTargetStateV0;
}>;

type PreparationOutcomeV1 = Readonly<{
  preparedByScenario: ReadonlyMap<string, PreparedBranchV1>;
  failureMessage: string | null;
}>;

type LoadedSourceV1 = Readonly<{
  source: OpenScenarioRuntimeBranchV1;
  runContent: StudioRunArtifactContentV1;
  envelope: MainWireStudioSnapshotEnvelopeContentV1;
  resolvedSessionInput: MainWireScientificResolvedSessionInputV1;
}>;

let nextAdapterRuntimeIdentityV1 = 0;

/**
 * MainWire implementation of the Studio runtime port.
 *
 * A live branch owns a dedicated Worker host. Every strict job owns a separate
 * exclusive Worker host, preventing the kernel-wide command queue from
 * serializing foreground live work behind periodic settlement.
 */
export class MainWireSimulationRuntimeAdapterV1
implements SimulationRuntimePortV1 {
  private readonly artifacts: ArtifactStorePortV1;
  private readonly hostFactory: MainWireStudioSessionHostFactoryV1;
  private readonly liveStepCountPerChunk: number;
  private readonly strictMaximumBeatCount: number;
  private readonly nowMs: () => number;
  private readonly delayMs: (durationMs: number) => Promise<void>;
  private readonly sessions = new Map<string, AdapterSessionV1>();
  private readonly openingSessionIds = new Set<string>();
  private readonly openingHostsBySessionId =
    new Map<string, Set<MainWireStudioSessionHostV1>>();
  private readonly cancelledOpeningSessionIds = new Set<string>();
  private readonly promotionReceipts =
    new Map<string, RuntimeCandidatePromotedV1>();
  private readonly promotionOperations =
    new Map<string, Promise<RuntimeCandidatePromotedV1>>();
  private readonly issuedCandidates =
    new Map<string, RuntimeSteadyCandidateV1>();
  private internalIdentityOrdinal = 0;

  constructor(options: MainWireSimulationRuntimeAdapterOptionsV1) {
    this.artifacts = options.artifacts;
    this.hostFactory = options.hostFactory
      ?? createMainWireBrowserWorkerSessionHostFactoryV1();
    this.liveStepCountPerChunk = boundedPositiveIntegerV1(
      options.liveStepCountPerChunk
        ?? MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumTransientStepCountPerCommand,
      MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumTransientStepCountPerCommand,
      "liveStepCountPerChunk",
    );
    this.strictMaximumBeatCount = boundedPositiveIntegerV1(
      options.strictMaximumBeatCount
        ?? DEFAULT_STRICT_MAXIMUM_BEAT_COUNT_V1,
      DEFAULT_STRICT_MAXIMUM_BEAT_COUNT_V1,
      "strictMaximumBeatCount",
    );
    this.nowMs = options.nowMs ?? monotonicNowMsV1;
    this.delayMs = options.delayMs ?? delayMsV1;
    nextAdapterRuntimeIdentityV1 += 1;
  }

  async openSession(
    command: OpenSimulationSessionCommandV1,
  ): Promise<RuntimeSessionOpenedV1> {
    assertOpenCommandV1(command);
    if (
      this.sessions.has(command.sessionId)
      || this.openingSessionIds.has(command.sessionId)
    ) throw runtimeErrorV1(`session ${command.sessionId} already exists`);
    this.openingSessionIds.add(command.sessionId);
    const hosts = new Set<MainWireStudioSessionHostV1>();
    this.openingHostsBySessionId.set(command.sessionId, hosts);
    const assertOpeningActive = () => {
      if (this.cancelledOpeningSessionIds.has(command.sessionId)) {
        throw new Error(`session ${command.sessionId} opening was aborted`);
      }
    };
    try {
      const loaded = await Promise.all(command.branches.map((source) =>
        this.loadSourceV1(source)));
      assertOpeningActive();
      const opened = await Promise.all(loaded.map(async (entry) => {
        assertOpeningActive();
        const host = this.hostFactory();
        hosts.add(host);
        const hosted = await host.restoreV4({
          sessionId: this.nextInternalIdV1("live-open"),
          resolvedSessionInput: entry.resolvedSessionInput,
          checkpointV4: entry.envelope.checkpointV4,
        });
        assertOpeningActive();
        return this.openBranchV1(command.sessionId, entry, host, hosted);
      }));
      assertOpeningActive();
      const session: AdapterSessionV1 = {
        sessionId: command.sessionId,
        branches: new Map(opened.map((branch) => [
          branch.internal.scenarioId,
          branch.internal,
        ])),
        activeIntentByScenario: new Map(),
        transientHosts: new Set(),
        mutationTail: Promise.resolve(),
        closed: false,
      };
      this.sessions.set(command.sessionId, session);
      return Object.freeze({
        sessionId: command.sessionId,
        branches: Object.freeze(opened.map(({ receipt }) => receipt)),
      });
    } catch (error) {
      for (const host of hosts) host.terminate();
      throw runtimeErrorV1(errorMessageV1(error));
    } finally {
      this.openingSessionIds.delete(command.sessionId);
      this.openingHostsBySessionId.delete(command.sessionId);
      this.cancelledOpeningSessionIds.delete(command.sessionId);
    }
  }

  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1 {
    const session = this.requiredSessionV1(command.sessionId);
    const tokens = this.reserveIntentV1(session, command);
    const preparation = this.enqueueMutationV1(
      session,
      () => this.prepareTargetIntentV1(session, command, tokens),
    );
    const live = preparation.then((outcome) =>
      this.runInitialLiveIntentV1(session, command, tokens, outcome));
    const strict = preparation.then((outcome) =>
      this.runStrictIntentV1(session, command, tokens, outcome));
    return Object.freeze({ live, strict });
  }

  async promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1> {
    const session = this.requiredSessionV1(command.sessionId);
    const idempotencyKey = promotionKeyV1(command);
    const prior = this.promotionReceipts.get(idempotencyKey);
    if (prior !== undefined) return prior;
    const inFlight = this.promotionOperations.get(idempotencyKey);
    if (inFlight !== undefined) return inFlight;
    const operation = this.enqueueMutationV1(
      session,
      () => this.promoteCandidateV1(session, command),
    );
    this.promotionOperations.set(idempotencyKey, operation);
    try {
      const receipt = await operation;
      this.promotionReceipts.set(idempotencyKey, receipt);
      return receipt;
    } finally {
      if (this.promotionOperations.get(idempotencyKey) === operation) {
        this.promotionOperations.delete(idempotencyKey);
      }
    }
  }

  subscribeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    observer: (event: RuntimeSignalEventV1) => void,
  ): RuntimeSignalSubscriptionV1 {
    const branch = this.requiredChannelBranchV1(channel);
    branch.signalObservers.add(observer);
    let subscribed = true;
    return Object.freeze({
      unsubscribe: () => {
        if (!subscribed) return;
        subscribed = false;
        branch.signalObservers.delete(observer);
      },
    });
  }

  async suspendSignalChannel(
    channel: RuntimeSignalChannelRefV1,
  ): Promise<void> {
    const branch = this.requiredChannelBranchV1(channel);
    branch.playbackRequested = false;
    await this.suspendBranchAtBoundaryV1(branch);
  }

  async resumeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    expectedStreamEpoch: number,
  ): Promise<void> {
    const branch = this.requiredChannelBranchV1(channel);
    if (branch.liveFailure !== null) throw branch.liveFailure;
    if (
      !Number.isSafeInteger(expectedStreamEpoch)
      || expectedStreamEpoch < 0
      || expectedStreamEpoch !== branch.streamEpoch
    ) throw runtimeErrorV1("signal activation stream epoch mismatch");
    branch.activatedStreamEpoch = expectedStreamEpoch;
    branch.playbackRequested = true;
    this.resumeBranchIfAllowedV1(branch);
  }

  async closeSession(sessionId: string): Promise<void> {
    const openingHosts = this.openingHostsBySessionId.get(sessionId);
    if (openingHosts !== undefined) {
      this.cancelledOpeningSessionIds.add(sessionId);
      for (const host of openingHosts) host.terminate();
    }
    const session = this.sessions.get(sessionId);
    if (session === undefined) return;
    session.closed = true;
    for (const token of session.activeIntentByScenario.values()) {
      cancelTokenV1(token, "aborted", "simulation session closed");
    }
    const hosts = new Set<MainWireStudioSessionHostV1>();
    for (const branch of session.branches.values()) {
      branch.playbackRequested = false;
      branch.desiredRunning = false;
      branch.signalObservers.clear();
      hosts.add(branch.host);
    }
    for (const token of session.activeIntentByScenario.values()) {
      if (token.strictHost !== null) hosts.add(token.strictHost);
    }
    for (const host of hosts) host.terminate();
    for (const host of session.transientHosts) host.terminate();
    session.transientHosts.clear();
    session.activeIntentByScenario.clear();
    this.sessions.delete(sessionId);
    this.deleteSessionEphemeraV1(sessionId);
  }

  private async loadSourceV1(
    source: OpenScenarioRuntimeBranchV1,
  ): Promise<LoadedSourceV1> {
    const [runExists, inputExists, snapshotExists] = await Promise.all([
      this.artifacts.has(source.sourceRunRef),
      this.artifacts.has(source.sourceInputRef),
      this.artifacts.has(source.sourceSnapshotRef),
    ]);
    if (!runExists) {
      throw runtimeErrorV1(
        `source run ${source.sourceRunRef.sha256} does not exist`,
      );
    }
    if (!inputExists) {
      throw runtimeErrorV1(
        `source input ${source.sourceInputRef.sha256} does not exist`,
      );
    }
    if (!snapshotExists) {
      throw runtimeErrorV1(
        `source snapshot ${source.sourceSnapshotRef.sha256} does not exist`,
      );
    }
    const [runValue, inputValue, snapshotValue] = await Promise.all([
      this.artifacts.readJson(source.sourceRunRef),
      this.artifacts.readJson(source.sourceInputRef),
      this.artifacts.readJson(source.sourceSnapshotRef),
    ]);
    const runContent = loadStudioRunArtifactContentV1(runValue);
    const envelope = await loadMainWireStudioSnapshotEnvelopeV1(snapshotValue);
    if (!sameArtifactRefV1(
      envelope.simulationInputRef,
      source.sourceInputRef,
    )) throw runtimeErrorV1("snapshot/input artifact binding mismatch");
    const resolvedSessionInput =
      await loadMainWireScientificResolvedSessionInputEnvelopeV1(
        inputValue,
        envelope.checkpointV4.releaseRef,
      );
    if (
      resolvedSessionInput.sessionInputSha256
        !== envelope.checkpointV4.baseSessionInputSha256
    ) throw runtimeErrorV1("checkpoint/base input digest mismatch");
    const expectedTargetInputSha256 =
      await mainWireStudioTargetInputSha256V1(
        envelope.checkpointV4.controlTargetState,
        resolvedSessionInput.sessionInputSha256,
      );
    if (expectedTargetInputSha256 !== source.initialTargetInputSha256) {
      throw runtimeErrorV1("initial target input identity mismatch");
    }
    const execution = mainWireStudioExecutionIdentityV1(
      envelope.checkpointV4,
    );
    if (
      !sameArtifactRefV1(
        runContent.simulationInputRef,
        source.sourceInputRef,
      )
      || !sameArtifactRefV1(
        runContent.snapshotRef,
        source.sourceSnapshotRef,
      )
      || runContent.targetInputSha256 !== source.initialTargetInputSha256
      || !sameExecutionIdentityV1(runContent.execution, execution)
    ) throw runtimeErrorV1("source run artifact binding mismatch");
    if (!await this.artifacts.has(runContent.sourceRunRef)) {
      throw runtimeErrorV1(
        `source run parent ${runContent.sourceRunRef.sha256} does not exist`,
      );
    }
    return Object.freeze({
      source,
      runContent,
      envelope,
      resolvedSessionInput,
    });
  }

  private openBranchV1(
    studioSessionId: string,
    loaded: LoadedSourceV1,
    host: MainWireStudioSessionHostV1,
    restored: MainWireStudioHostedSessionV1,
  ): Readonly<{
    internal: AdapterBranchV1;
    receipt: RuntimeScenarioBranchOpenedV1;
  }> {
    const { source, envelope } = loaded;
    if (
      restored.baseSessionInputSha256
        !== loaded.resolvedSessionInput.sessionInputSha256
      || restored.controlState.targetStateSha256
        !== envelope.checkpointV4.controlTargetStateSha256
      || restored.parameterEpoch !== envelope.checkpointV4.parameterEpoch
      || restored.stateIdentity.revision
        !== envelope.seedObservableFrame.revision
      || restored.stateIdentity.acceptedTimeSec
        !== envelope.seedObservableFrame.acceptedTimeSec
    ) throw runtimeErrorV1(`restore receipt mismatch for ${source.scenarioId}`);
    const hostedSession = Object.freeze({
      ...restored,
      observableFrame: envelope.seedObservableFrame,
    });
    const liveBranchId = this.nextInternalIdV1("branch");
    const signalChannelRef = Object.freeze({
      protocolId: SIGNAL_CHANNEL_PROTOCOL_V1,
      channelId: this.nextInternalIdV1("signal"),
      sessionId: studioSessionId,
      scenarioId: source.scenarioId,
      liveBranchId,
    });
    const execution = mainWireStudioExecutionIdentityV1(
      envelope.checkpointV4,
    );
    const initialFrame = mainWireStudioSeedPresentationFrameV1(envelope);
    const internal: AdapterBranchV1 = {
      scenarioId: source.scenarioId,
      liveBranchId,
      sourceRunRef: source.sourceRunRef,
      sourceInputRef: source.sourceInputRef,
      sourceSnapshotRef: source.sourceSnapshotRef,
      resolvedSessionInput: loaded.resolvedSessionInput,
      host,
      hostedSession,
      execution,
      signalChannelRef,
      signalObservers: new Set(),
      targetGeneration: 0,
      reservedTargetGeneration: 0,
      presentationRevision: 0,
      reservedPresentationRevision: 0,
      targetInputSha256: source.initialTargetInputSha256,
      streamEpoch: 0,
      activatedStreamEpoch: null,
      playbackRequested: false,
      desiredRunning: false,
      loopPromise: null,
      activeLiveCommand: null,
      suspensionCount: 0,
      transitionCount: 0,
      promotionInProgress: false,
      loopIdentity: 0,
      liveFailure: null,
      traceOriginTimeSec: initialFrame.point.simulationTimeSec,
      tracePointCount: 1,
    };
    return Object.freeze({
      internal,
      receipt: Object.freeze({
        scenarioId: source.scenarioId,
        liveBranchId,
        sourceRunRef: source.sourceRunRef,
        sourceInputRef: source.sourceInputRef,
        sourceSnapshotRef: source.sourceSnapshotRef,
        initialTargetInputSha256: source.initialTargetInputSha256,
        signalChannelRef,
        streamEpoch: 0,
        execution,
        initialFrame,
      }),
    });
  }

  private reserveIntentV1(
    session: AdapterSessionV1,
    command: RuntimeTargetIntentCommandV1,
  ): readonly IntentBranchTokenV1[] {
    if (!Array.isArray(command.targets) || command.targets.length === 0) {
      throw runtimeErrorV1("target intent requires at least one branch");
    }
    const seen = new Set<string>();
    const reservations = command.targets.map((target) => {
      if (seen.has(target.scenarioId)) {
        throw runtimeErrorV1(`duplicate target ${target.scenarioId}`);
      }
      seen.add(target.scenarioId);
      const branch = requiredBranchV1(session, target.scenarioId);
      if (
        target.liveBranchId !== branch.liveBranchId
        || target.targetGeneration
          !== branch.reservedTargetGeneration + 1
        || target.presentationRevision
          !== branch.reservedPresentationRevision + 1
      ) throw runtimeErrorV1(`target reservation mismatch for ${target.scenarioId}`);
      if (branch.transitionCount === Number.MAX_SAFE_INTEGER) {
        throw runtimeErrorV1(
          `target transition count exhausted for ${target.scenarioId}`,
        );
      }
      return Object.freeze({ target, branch });
    });
    const tokens = reservations.map(({ target, branch }) => {
      this.deleteIssuedCandidatesForScenarioV1(
        session.sessionId,
        target.scenarioId,
      );
      const prior = session.activeIntentByScenario.get(target.scenarioId);
      if (prior !== undefined) {
        cancelTokenV1(
          prior,
          "superseded",
          `generation ${target.targetGeneration} superseded generation ${prior.target.targetGeneration}`,
        );
      }
      branch.reservedTargetGeneration = target.targetGeneration;
      branch.reservedPresentationRevision = target.presentationRevision;
      branch.transitionCount += 1;
      branch.desiredRunning = false;
      const token: IntentBranchTokenV1 = {
        command,
        target,
        cancellation: null,
        cancellationReason: null,
        strictHost: null,
        liveSettled: false,
        strictSettled: false,
      };
      session.activeIntentByScenario.set(target.scenarioId, token);
      return token;
    });
    return Object.freeze(tokens);
  }

  private async prepareTargetIntentV1(
    session: AdapterSessionV1,
    command: RuntimeTargetIntentCommandV1,
    tokens: readonly IntentBranchTokenV1[],
  ): Promise<PreparationOutcomeV1> {
    if (session.closed) {
      for (const token of tokens) {
        cancelTokenV1(token, "aborted", "simulation session closed");
      }
      return Object.freeze({
        preparedByScenario: new Map(),
        failureMessage: null,
      });
    }
    await Promise.all(tokens.map(async (token) => {
      const branch = requiredBranchV1(session, token.target.scenarioId);
      await this.suspendBranchAtBoundaryV1(branch);
    }));
    const settled = await Promise.allSettled(tokens.map((token) =>
      this.prepareIntentBranchV1(session, token)));
    const failures = settled.flatMap((result, index) =>
      result.status === "rejected"
      && tokens[index]?.cancellation === null
        ? [result]
        : []);
    const prepared = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []);
    if (failures.length > 0) {
      await Promise.all(prepared.map((entry) =>
        this.cleanupPreparedBranchV1(entry)));
      return Object.freeze({
        preparedByScenario: new Map(),
        failureMessage: failures.map(({ reason }) =>
          errorMessageV1(reason)).join("; "),
      });
    }

    const committedEntries = prepared.filter(({ token, branch, oldLiveSessionId }) =>
      token.cancellation === null
      && session.activeIntentByScenario.get(branch.scenarioId) === token
      && branch.hostedSession.sessionId === oldLiveSessionId);
    const discardedEntries = prepared.filter(
      (entry) => !committedEntries.includes(entry),
    );

    // This loop contains no await: every still-current branch pointer changes
    // in one JavaScript turn after the all-branch preparation barrier.
    const committed = new Map<string, PreparedBranchV1>();
    for (const entry of committedEntries) {
      const { token, branch } = entry;
      branch.hostedSession = entry.liveTarget;
      branch.targetGeneration = token.target.targetGeneration;
      branch.presentationRevision = token.target.presentationRevision;
      branch.targetInputSha256 = token.target.patch.targetInputSha256;
      branch.streamEpoch = nextSafeIntegerV1(
        branch.streamEpoch,
        "stream epoch",
      );
      branch.traceOriginTimeSec =
        entry.liveTarget.stateIdentity.acceptedTimeSec;
      branch.tracePointCount = 0;
      branch.liveFailure = null;
      committed.set(branch.scenarioId, entry);
    }
    // Source retirement is cleanup after the numerical commit. A transport
    // failure here must not expose a partially switched multi-branch intent;
    // the owning host is terminated on session close and bounds any orphan.
    await Promise.allSettled([
      ...discardedEntries.map((entry) =>
        this.cleanupPreparedBranchV1(entry)),
      ...committedEntries.map((entry) =>
        entry.branch.host.dispose(entry.oldLiveSessionId)),
    ]);
    return Object.freeze({
      preparedByScenario: committed,
      failureMessage: null,
    });
  }

  private async prepareIntentBranchV1(
    session: AdapterSessionV1,
    token: IntentBranchTokenV1,
  ): Promise<PreparedBranchV1> {
    const branch = requiredBranchV1(session, token.target.scenarioId);
    if (token.cancellation !== null) throw runtimeErrorV1(
      token.cancellationReason ?? "target preparation cancelled",
    );
    const targetState = await assertMainWireStudioTargetPatchV1(
      branch.hostedSession.controlState,
      branch.resolvedSessionInput.sessionInputSha256,
      token.target.patch,
    );
    const sourceCheckpoint =
      await branch.host.checkpointV4(branch.hostedSession);
    if (branch.hostedSession.sessionId === sourceCheckpoint.session.sessionId) {
      branch.hostedSession = sourceCheckpoint.session;
    }
    const strictHost = this.hostFactory();
    token.strictHost = strictHost;
    let liveTarget: MainWireStudioHostedSessionV1 | null = null;
    try {
      const strictSource = await strictHost.restoreV4({
        sessionId: this.nextInternalIdV1("strict-source"),
        resolvedSessionInput: branch.resolvedSessionInput,
        checkpointV4: sourceCheckpoint.checkpointV4,
      });
      const [liveFork, strictFork] = await Promise.allSettled([
        branch.host.forkControl({
          source: sourceCheckpoint.session,
          targetSessionId: this.nextInternalIdV1("live-target"),
          targetControlState: targetState,
        }),
        strictHost.forkControl({
          source: strictSource,
          targetSessionId: this.nextInternalIdV1("strict-target"),
          targetControlState: targetState,
        }),
      ]);
      if (liveFork.status === "fulfilled") liveTarget = liveFork.value;
      if (
        liveFork.status === "rejected"
        || strictFork.status === "rejected"
      ) {
        if (liveTarget !== null) {
          await branch.host.dispose(liveTarget.sessionId).catch(
            () => undefined,
          );
        }
        strictHost.terminate();
        throw runtimeErrorV1([
          liveFork.status === "rejected"
            ? errorMessageV1(liveFork.reason)
            : null,
          strictFork.status === "rejected"
            ? errorMessageV1(strictFork.reason)
            : null,
        ].filter((value): value is string => value !== null).join("; "));
      }
      await strictHost.dispose(strictSource.sessionId);
      return Object.freeze({
        token,
        branch,
        oldLiveSessionId: sourceCheckpoint.session.sessionId,
        liveTarget: liveFork.value,
        strictHost,
        strictTarget: strictFork.value,
        targetState,
      });
    } catch (error) {
      if (liveTarget !== null) {
        await branch.host.dispose(liveTarget.sessionId).catch(() => undefined);
      }
      strictHost.terminate();
      throw error;
    }
  }

  private async runInitialLiveIntentV1(
    session: AdapterSessionV1,
    command: RuntimeTargetIntentCommandV1,
    tokens: readonly IntentBranchTokenV1[],
    outcome: PreparationOutcomeV1,
  ): Promise<RuntimeLiveIntentResultV1> {
    const branches = await Promise.all(tokens.map(async (token) => {
      try {
        const interruption = interruptionForTokenV1(token);
        if (interruption !== null) return interruption;
        if (outcome.failureMessage !== null) {
          this.failLiveTransitionV1(
            session,
            token,
            outcome.failureMessage,
          );
          return failureForTargetV1(token.target, outcome.failureMessage);
        }
        const prepared = outcome.preparedByScenario.get(
          token.target.scenarioId,
        );
        if (prepared === undefined) {
          const lateInterruption = interruptionForTokenV1(token);
          if (lateInterruption !== null) return lateInterruption;
          const message = "target preparation did not commit";
          this.failLiveTransitionV1(session, token, message);
          return failureForTargetV1(token.target, message);
        }
        try {
          const chunk = await this.runInitialTransientV1(prepared);
          if (
            prepared.branch.hostedSession.sessionId
              === chunk.session.sessionId
          ) prepared.branch.hostedSession = chunk.session;
          const after = interruptionForTokenV1(token);
          if (after !== null) return after;
          const latest = chunk.observableFrames.at(-1)
            ?? chunk.session.observableFrame;
          prepared.branch.traceOriginTimeSec = latest.acceptedTimeSec;
          prepared.branch.tracePointCount = 1;
          return Object.freeze({
            status: "success" as const,
            scenarioId: token.target.scenarioId,
            targetGeneration: token.target.targetGeneration,
            result: Object.freeze({
              scenarioId: token.target.scenarioId,
              targetGeneration: token.target.targetGeneration,
              presentationRevision: token.target.presentationRevision,
              targetInputSha256: token.target.patch.targetInputSha256,
              streamEpoch: prepared.branch.streamEpoch,
              frame: presentationFrameFromObservableV1(
                latest,
                collectingMetricsV1(1),
              ),
            }),
          });
        } catch (error) {
          this.synchronizeAcceptedTransientFailureV1(
            prepared.branch,
            error,
          );
          const lateInterruption = interruptionForTokenV1(token);
          if (lateInterruption !== null) return lateInterruption;
          const message = errorMessageV1(error);
          this.failLiveTransitionV1(session, token, message);
          return failureForTargetV1(token.target, message);
        }
      } finally {
        this.finishLiveIntentBranchV1(session, token);
      }
    }));
    return Object.freeze({
      sessionId: command.sessionId,
      intentId: command.intentId,
      branches: Object.freeze(branches),
    });
  }

  private async runStrictIntentV1(
    session: AdapterSessionV1,
    command: RuntimeTargetIntentCommandV1,
    tokens: readonly IntentBranchTokenV1[],
    outcome: PreparationOutcomeV1,
  ): Promise<RuntimeStrictIntentResultV1> {
    const branches = await Promise.all(tokens.map(async (token) => {
      try {
        const interruption = interruptionForTokenV1(token);
        if (interruption !== null) return interruption;
        if (outcome.failureMessage !== null) {
          return failureForTargetV1(token.target, outcome.failureMessage);
        }
        const prepared = outcome.preparedByScenario.get(
          token.target.scenarioId,
        );
        if (prepared === undefined) {
          return interruptionForTokenV1(token)
            ?? failureForTargetV1(
              token.target,
              "strict target preparation did not commit",
            );
        }
        try {
          let strictSession = prepared.strictTarget;
          for (
            let beatIndex = 0;
            beatIndex < this.strictMaximumBeatCount;
            beatIndex += 1
          ) {
            const before = interruptionForTokenV1(token);
            if (before !== null) return before;
            const settlement =
              await prepared.strictHost.settlePeriodic(strictSession);
            strictSession = settlement.session;
            const after = interruptionForTokenV1(token);
            if (after !== null) return after;
            if (settlement.status === "period1-converged") {
              if (
                !settlement.periodicSteadyStateClaimed
                || settlement.period2OrbitSuspected
              ) {
                return failureForTargetV1(
                  token.target,
                  "period-1 settlement receipt failed admission",
                );
              }
              const checkpoint =
                await prepared.strictHost.checkpointV4(strictSession);
              await assertStrictCandidateCheckpointV1(
                prepared,
                settlement,
                checkpoint,
              );
              const snapshotRef = await putMainWireStudioSnapshotEnvelopeV1(
                this.artifacts,
                {
                  simulationInputRef: prepared.branch.sourceInputRef,
                  checkpointV4: checkpoint.checkpointV4,
                  seedObservableFrame:
                    checkpoint.session.observableFrame,
                },
              );
              const finalInterruption = interruptionForTokenV1(token);
              if (finalInterruption !== null) return finalInterruption;
              const candidate = Object.freeze({
                candidateId: this.nextInternalIdV1("candidate"),
                sessionId: command.sessionId,
                scenarioId: token.target.scenarioId,
                targetGeneration: token.target.targetGeneration,
                sourceRunRef: prepared.branch.sourceRunRef,
                simulationInputRef: prepared.branch.sourceInputRef,
                targetInputSha256: token.target.patch.targetInputSha256,
                snapshotRef,
                execution: prepared.branch.execution,
                steadyStatus: "converged" as const,
                numericalHealth: "passed" as const,
              }) satisfies RuntimeSteadyCandidateV1;
              this.issuedCandidates.set(
                issuedCandidateKeyV1(candidate),
                candidate,
              );
              return Object.freeze({
                status: "success" as const,
                scenarioId: token.target.scenarioId,
                targetGeneration: token.target.targetGeneration,
                candidate,
              });
            }
            if (settlement.status !== "tracking") {
              return failureForTargetV1(
                token.target,
                `strict settlement terminated as ${settlement.status}`,
              );
            }
          }
          return failureForTargetV1(
            token.target,
            `strict settlement exceeded ${this.strictMaximumBeatCount} beats`,
          );
        } catch (error) {
          return interruptionForTokenV1(token)
            ?? failureForTargetV1(token.target, errorMessageV1(error));
        }
      } finally {
        token.strictHost?.terminate();
        token.strictHost = null;
        token.strictSettled = true;
        releaseSettledTokenV1(session, token);
      }
    }));
    return Object.freeze({
      sessionId: command.sessionId,
      intentId: command.intentId,
      branches: Object.freeze(branches),
    });
  }

  private async runInitialTransientV1(
    prepared: PreparedBranchV1,
  ): Promise<MainWireStudioTransientChunkV1> {
    const { branch } = prepared;
    if (
      branch.hostedSession.sessionId !== prepared.liveTarget.sessionId
      || branch.host.hostId !== prepared.liveTarget.hostId
    ) throw runtimeErrorV1(
      `live target ${branch.scenarioId} is no longer current`,
    );
    const prior = branch.activeLiveCommand;
    if (prior !== null) await prior;
    if (
      branch.hostedSession.sessionId !== prepared.liveTarget.sessionId
      || branch.host.hostId !== prepared.liveTarget.hostId
    ) throw runtimeErrorV1(
      `live target ${branch.scenarioId} changed before first step`,
    );
    const request = branch.host.runTransient({
      session: prepared.liveTarget,
      dtSec: MAIN_WIRE_LIVE_DT_SEC_V1,
      stepCount: 1,
      observationStride: 1,
    });
    let boundary!: Promise<void>;
    boundary = request.then(
      () => undefined,
      () => undefined,
    ).finally(() => {
      if (branch.activeLiveCommand === boundary) {
        branch.activeLiveCommand = null;
      }
    });
    branch.activeLiveCommand = boundary;
    return await request;
  }

  private finishLiveIntentBranchV1(
    session: AdapterSessionV1,
    token: IntentBranchTokenV1,
  ): void {
    if (token.liveSettled) return;
    token.liveSettled = true;
    const branch = requiredBranchV1(session, token.target.scenarioId);
    if (branch.transitionCount < 1) {
      throw runtimeErrorV1(
        `target transition count underflow for ${branch.scenarioId}`,
      );
    }
    branch.transitionCount -= 1;
    if (!session.closed) this.resumeBranchIfAllowedV1(branch);
    releaseSettledTokenV1(session, token);
  }

  private failLiveTransitionV1(
    session: AdapterSessionV1,
    token: IntentBranchTokenV1,
    message: string,
  ): void {
    const branch = requiredBranchV1(session, token.target.scenarioId);
    branch.playbackRequested = false;
    branch.desiredRunning = false;
    branch.liveFailure = runtimeErrorV1(message);
  }

  private synchronizeAcceptedTransientFailureV1(
    branch: AdapterBranchV1,
    error: unknown,
  ): boolean {
    if (!(error instanceof MainWireStudioTransientPartialProgressErrorV1)) {
      return false;
    }
    const accepted = error.acceptedPartialProgress.session;
    if (
      branch.host.hostId !== accepted.hostId
      || branch.hostedSession.sessionId !== accepted.sessionId
    ) return false;
    if (error.completedStepCount > 0) {
      branch.hostedSession = accepted;
    }
    return true;
  }

  private async promoteCandidateV1(
    session: AdapterSessionV1,
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1> {
    const branch = requiredBranchV1(session, command.scenarioId);
    this.assertPromotionPreconditionsV1(session, branch, command);
    const oldHost = branch.host;
    const oldSessionId = branch.hostedSession.sessionId;
    const newHost = this.hostFactory();
    session.transientHosts.add(newHost);
    let enteredCommitWindow = false;
    let committed = false;
    try {
      const [snapshotValue, inputValue] = await Promise.all([
        this.artifacts.readJson(command.candidate.snapshotRef),
        this.artifacts.readJson(command.candidate.simulationInputRef),
      ]);
      const envelope =
        await loadMainWireStudioSnapshotEnvelopeV1(snapshotValue);
      if (
        !sameArtifactRefV1(
          envelope.simulationInputRef,
          command.candidate.simulationInputRef,
        )
        || envelope.checkpointV4.controlTargetStateSha256
          !== branch.hostedSession.controlState.targetStateSha256
      ) throw runtimeErrorV1("candidate snapshot binding mismatch");
      const resolvedInput =
        await loadMainWireScientificResolvedSessionInputEnvelopeV1(
          inputValue,
          envelope.checkpointV4.releaseRef,
        );
      if (
        resolvedInput.sessionInputSha256
          !== envelope.checkpointV4.baseSessionInputSha256
      ) throw runtimeErrorV1("candidate checkpoint/input digest mismatch");
      const expectedTargetInputSha256 =
        await mainWireStudioTargetInputSha256V1(
          envelope.checkpointV4.controlTargetState,
          resolvedInput.sessionInputSha256,
        );
      const candidateExecution = mainWireStudioExecutionIdentityV1(
        envelope.checkpointV4,
      );
      if (
        expectedTargetInputSha256
          !== command.candidate.targetInputSha256
        || !sameExecutionIdentityV1(
          candidateExecution,
          command.candidate.execution,
        )
      ) throw runtimeErrorV1("candidate snapshot identity mismatch");
      const restored = await newHost.restoreV4({
        sessionId: this.nextInternalIdV1("live-promoted"),
        resolvedSessionInput: resolvedInput,
        checkpointV4: envelope.checkpointV4,
      });
      if (
        restored.baseSessionInputSha256
          !== resolvedInput.sessionInputSha256
        || restored.controlState.targetStateSha256
          !== envelope.checkpointV4.controlTargetStateSha256
        || restored.parameterEpoch !== envelope.checkpointV4.parameterEpoch
        || restored.stateIdentity.revision
          !== envelope.seedObservableFrame.revision
        || restored.stateIdentity.acceptedTimeSec
          !== envelope.seedObservableFrame.acceptedTimeSec
      ) throw runtimeErrorV1("candidate restore receipt mismatch");
      const seeded = Object.freeze({
        ...restored,
        observableFrame: envelope.seedObservableFrame,
      });
      const execution = mainWireStudioExecutionIdentityV1(
        envelope.checkpointV4,
      );

      // Artifact validation and candidate restore are fallible. The accepted
      // live host remains untouched until all of them have succeeded.
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        oldHost,
        oldSessionId,
      );
      branch.promotionInProgress = true;
      enteredCommitWindow = true;
      const alignWhilePlaying = branch.playbackRequested
        && branch.activatedStreamEpoch === branch.streamEpoch;
      await this.suspendBranchAtBoundaryV1(branch);
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        oldHost,
        oldSessionId,
      );
      if (alignWhilePlaying && branch.playbackRequested) {
        await this.alignLiveBranchForPromotionV1(
          session,
          branch,
          command,
          oldHost,
          oldSessionId,
          envelope.checkpointV4.canonicalPhase.phase01,
          envelope.checkpointV4.canonicalPhase.cycleLengthSec,
        );
      }
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        oldHost,
        oldSessionId,
      );

      const streamEpoch = nextSafeIntegerV1(
        branch.streamEpoch,
        "stream epoch",
      );
      const initialFrame = mainWireStudioSeedPresentationFrameV1(envelope);
      const receipt = Object.freeze({
        sessionId: command.sessionId,
        scenarioId: command.scenarioId,
        targetGeneration: command.targetGeneration,
        presentationRevision: command.presentationRevision,
        candidateId: command.candidate.candidateId,
        streamEpoch,
        initialFrame,
      });

      // From here through the pointer swap there is no await or fallible
      // validation. A rejected promotion never cancels an active intent or
      // replaces the accepted host.
      const active = session.activeIntentByScenario.get(branch.scenarioId);
      if (active !== undefined) {
        cancelTokenV1(active, "superseded", "steady candidate promoted");
      }
      branch.host = newHost;
      branch.hostedSession = seeded;
      branch.execution = execution;
      branch.presentationRevision = command.presentationRevision;
      branch.reservedPresentationRevision = command.presentationRevision;
      branch.streamEpoch = streamEpoch;
      branch.traceOriginTimeSec = envelope.seedObservableFrame.acceptedTimeSec;
      branch.tracePointCount = 1;
      branch.liveFailure = null;
      session.transientHosts.delete(newHost);
      this.issuedCandidates.delete(
        issuedCandidateKeyV1(command.candidate),
      );
      committed = true;
      try {
        oldHost.terminate();
      } catch {
        // Retirement follows the pointer swap; close still owns newHost.
      }
      return receipt;
    } catch (error) {
      if (this.synchronizeAcceptedTransientFailureV1(branch, error)) {
        branch.playbackRequested = false;
        branch.desiredRunning = false;
        branch.liveFailure = runtimeErrorV1(errorMessageV1(error));
      }
      if (!committed) {
        session.transientHosts.delete(newHost);
        try {
          newHost.terminate();
        } catch {
          // Preserve the promotion failure and the still-current old branch.
        }
      }
      throw runtimeErrorV1(errorMessageV1(error));
    } finally {
      if (enteredCommitWindow) branch.promotionInProgress = false;
      if (
        !session.closed
        && this.sessions.get(session.sessionId) === session
      ) this.resumeBranchIfAllowedV1(branch);
    }
  }

  private assertPromotionPreconditionsV1(
    session: AdapterSessionV1,
    branch: AdapterBranchV1,
    command: PromoteSteadyCandidateCommandV1,
  ): void {
    const issued = this.issuedCandidates.get(
      issuedCandidateKeyV1(command.candidate),
    );
    if (
      session.closed
      || this.sessions.get(session.sessionId) !== session
      || command.liveBranchId !== branch.liveBranchId
      || command.targetGeneration !== branch.targetGeneration
      || command.targetGeneration !== branch.reservedTargetGeneration
      || command.presentationRevision
        !== branch.reservedPresentationRevision + 1
      || command.candidate.sessionId !== session.sessionId
      || command.candidate.scenarioId !== branch.scenarioId
      || command.candidate.targetGeneration !== branch.targetGeneration
      || command.candidate.targetInputSha256 !== branch.targetInputSha256
      || !sameArtifactRefV1(
        command.candidate.sourceRunRef,
        branch.sourceRunRef,
      )
      || !sameArtifactRefV1(
        command.candidate.simulationInputRef,
        branch.sourceInputRef,
      )
      || !sameExecutionIdentityV1(
        command.candidate.execution,
        branch.execution,
      )
      || issued === undefined
      || !sameCandidateV1(issued, command.candidate)
    ) throw runtimeErrorV1("candidate promotion precondition mismatch");
  }

  private assertPromotionStillCurrentV1(
    session: AdapterSessionV1,
    branch: AdapterBranchV1,
    command: PromoteSteadyCandidateCommandV1,
    expectedHost: MainWireStudioSessionHostV1,
    expectedSessionId: string,
  ): void {
    this.assertPromotionPreconditionsV1(session, branch, command);
    if (
      requiredBranchV1(session, command.scenarioId) !== branch
      || branch.host !== expectedHost
      || branch.hostedSession.sessionId !== expectedSessionId
    ) throw runtimeErrorV1("candidate promotion was superseded");
  }

  private async alignLiveBranchForPromotionV1(
    session: AdapterSessionV1,
    branch: AdapterBranchV1,
    command: PromoteSteadyCandidateCommandV1,
    expectedHost: MainWireStudioSessionHostV1,
    expectedSessionId: string,
    targetPhase01: number,
    cycleLengthSec: number,
  ): Promise<void> {
    const currentPhase01 = canonicalPhaseForCycleV1(
      branch.hostedSession.stateIdentity.acceptedTimeSec,
      cycleLengthSec,
    );
    const phaseDelta01 = positiveModuloOneV1(
      targetPhase01 - currentPhase01,
    );
    const deltaSec = phaseDelta01 * cycleLengthSec;
    const totalStepCount = Math.round(
      deltaSec / MAIN_WIRE_LIVE_DT_SEC_V1,
    );
    const reachedPhase01 = canonicalPhaseForCycleV1(
      branch.hostedSession.stateIdentity.acceptedTimeSec
        + totalStepCount * MAIN_WIRE_LIVE_DT_SEC_V1,
      cycleLengthSec,
    );
    if (circularPhaseDistanceV1(reachedPhase01, targetPhase01) > 1e-9) {
      throw runtimeErrorV1(
        "candidate phase is not reachable on the live integration grid",
      );
    }

    let remainingStepCount = totalStepCount;
    while (remainingStepCount > 0 && branch.playbackRequested) {
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        expectedHost,
        expectedSessionId,
      );
      const stepCount = Math.min(
        remainingStepCount,
        this.liveStepCountPerChunk,
      );
      const commandStartedAtMs = this.nowMs();
      const chunk = await this.runPromotionAlignmentChunkV1(
        branch,
        expectedHost,
        stepCount,
      );
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        expectedHost,
        expectedSessionId,
      );
      branch.hostedSession = chunk.session;
      this.publishTransientChunkV1(
        branch,
        chunk,
        branch.targetGeneration,
        branch.presentationRevision,
        branch.streamEpoch,
      );
      remainingStepCount -= stepCount;
      const remainingMs = Math.max(
        0,
        stepCount * MAIN_WIRE_LIVE_DT_SEC_V1 * 1_000
          - (this.nowMs() - commandStartedAtMs),
      );
      if (
        remainingStepCount > 0
        && remainingMs > 0
        && branch.playbackRequested
      ) await this.delayMs(remainingMs);
    }
  }

  private async runPromotionAlignmentChunkV1(
    branch: AdapterBranchV1,
    host: MainWireStudioSessionHostV1,
    stepCount: number,
  ): Promise<MainWireStudioTransientChunkV1> {
    if (branch.activeLiveCommand !== null) {
      await branch.activeLiveCommand;
    }
    const request = host.runTransient({
      session: branch.hostedSession,
      dtSec: MAIN_WIRE_LIVE_DT_SEC_V1,
      stepCount,
      observationStride: 1,
    });
    let boundary!: Promise<void>;
    boundary = request.then(
      () => undefined,
      () => undefined,
    ).finally(() => {
      if (branch.activeLiveCommand === boundary) {
        branch.activeLiveCommand = null;
      }
    });
    branch.activeLiveCommand = boundary;
    return await request;
  }

  private resumeBranchIfAllowedV1(branch: AdapterBranchV1): void {
    if (
      !branch.playbackRequested
      || branch.activatedStreamEpoch !== branch.streamEpoch
      || branch.suspensionCount !== 0
      || branch.transitionCount !== 0
      || branch.promotionInProgress
      || branch.liveFailure !== null
    ) return;
    branch.desiredRunning = true;
    this.ensureLiveLoopV1(branch);
  }

  private ensureLiveLoopV1(branch: AdapterBranchV1): void {
    if (
      !branch.desiredRunning
      || !branch.playbackRequested
      || branch.activatedStreamEpoch !== branch.streamEpoch
      || branch.suspensionCount !== 0
      || branch.transitionCount !== 0
      || branch.promotionInProgress
      || branch.loopPromise !== null
    ) return;
    branch.loopIdentity = nextSafeIntegerV1(
      branch.loopIdentity,
      "live loop identity",
    );
    const loopIdentity = branch.loopIdentity;
    const operation = this.runLiveLoopV1(branch, loopIdentity).catch(
      (error) => {
        this.synchronizeAcceptedTransientFailureV1(branch, error);
        const failure = runtimeErrorV1(errorMessageV1(error));
        branch.liveFailure = failure;
        branch.playbackRequested = false;
        branch.desiredRunning = false;
        this.emitSignalEventV1(branch, Object.freeze({
          kind: "failure",
          channelId: branch.signalChannelRef.channelId,
          sessionId: branch.signalChannelRef.sessionId,
          scenarioId: branch.scenarioId,
          liveBranchId: branch.liveBranchId,
          targetGeneration: branch.targetGeneration,
          presentationRevision: branch.presentationRevision,
          streamEpoch: branch.streamEpoch,
          message: failure.message,
        }) satisfies RuntimeSignalFailureV1);
      },
    ).finally(() => {
      if (branch.loopPromise === operation) branch.loopPromise = null;
      if (
        branch.loopPromise === null
        && branch.liveFailure === null
      ) this.resumeBranchIfAllowedV1(branch);
    });
    branch.loopPromise = operation;
  }

  private async runLiveLoopV1(
    branch: AdapterBranchV1,
    loopIdentity: number,
  ): Promise<void> {
    while (
      branch.desiredRunning
      && branch.loopIdentity === loopIdentity
      && branch.liveFailure === null
    ) {
      const commandStartedAtMs = this.nowMs();
      const sourceSessionId = branch.hostedSession.sessionId;
      const sourceHost = branch.host;
      const targetGeneration = branch.targetGeneration;
      const presentationRevision = branch.presentationRevision;
      const streamEpoch = branch.streamEpoch;
      const chunk = await sourceHost.runTransient({
        session: branch.hostedSession,
        dtSec: MAIN_WIRE_LIVE_DT_SEC_V1,
        stepCount: this.liveStepCountPerChunk,
        observationStride: 1,
      });
      if (
        branch.host === sourceHost
        && branch.hostedSession.sessionId === sourceSessionId
      ) branch.hostedSession = chunk.session;
      if (
        branch.host !== sourceHost
        || branch.hostedSession.sessionId !== sourceSessionId
        || branch.targetGeneration !== targetGeneration
        || branch.presentationRevision !== presentationRevision
        || branch.streamEpoch !== streamEpoch
      ) continue;
      // A manual suspension still accepts and publishes the command that was
      // already in flight. This preserves a contiguous sequence on resume.
      this.publishTransientChunkV1(
        branch,
        chunk,
        targetGeneration,
        presentationRevision,
        streamEpoch,
      );
      if (
        !branch.desiredRunning
        || branch.loopIdentity !== loopIdentity
      ) continue;
      const simulatedDurationMs =
        MAIN_WIRE_LIVE_DT_SEC_V1 * this.liveStepCountPerChunk * 1_000;
      const remainingMs = Math.max(
        0,
        simulatedDurationMs - (this.nowMs() - commandStartedAtMs),
      );
      if (remainingMs > 0) await this.delayMs(remainingMs);
    }
  }

  private emitSignalEventV1(
    branch: AdapterBranchV1,
    event: RuntimeSignalEventV1,
  ): void {
    for (const observer of [...branch.signalObservers]) {
      try {
        observer(event);
      } catch {
        branch.signalObservers.delete(observer);
      }
    }
  }

  private publishTransientChunkV1(
    branch: AdapterBranchV1,
    chunk: MainWireStudioTransientChunkV1,
    targetGeneration: number,
    presentationRevision: number,
    streamEpoch: number,
  ): void {
    const points = Object.freeze(
      chunk.observableFrames.map(observablePointV1),
    );
    if (points.length === 0) return;
    branch.tracePointCount += points.length;
    this.emitSignalEventV1(branch, Object.freeze({
      kind: "samples",
      channelId: branch.signalChannelRef.channelId,
      sessionId: branch.signalChannelRef.sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration,
      presentationRevision,
      streamEpoch,
      points,
      windowMetrics: metricsForTraceV1(
        branch.tracePointCount,
        branch.traceOriginTimeSec,
        points.at(-1)!.simulationTimeSec,
      ),
    }));
  }

  private async suspendBranchAtBoundaryV1(
    branch: AdapterBranchV1,
  ): Promise<void> {
    branch.suspensionCount = nextSafeIntegerV1(
      branch.suspensionCount,
      "suspension count",
    );
    branch.desiredRunning = false;
    branch.loopIdentity = nextSafeIntegerV1(
      branch.loopIdentity,
      "live loop identity",
    );
    const pending = [
      branch.loopPromise,
      branch.activeLiveCommand,
    ].filter((operation): operation is Promise<void> => operation !== null);
    try {
      // Capture this boundary once. A concurrent resume can request playback,
      // but suspensionCount prevents it from starting a replacement loop
      // until this exact in-flight command has settled.
      await Promise.all(pending);
    } finally {
      branch.suspensionCount -= 1;
      if (branch.suspensionCount < 0) {
        branch.suspensionCount = 0;
        throw runtimeErrorV1(
          `suspension count underflow for ${branch.scenarioId}`,
        );
      }
      if (branch.suspensionCount === 0) {
        this.resumeBranchIfAllowedV1(branch);
      }
    }
  }

  private async cleanupPreparedBranchV1(
    prepared: PreparedBranchV1,
  ): Promise<void> {
    await prepared.branch.host.dispose(
      prepared.liveTarget.sessionId,
    ).catch(() => undefined);
    prepared.strictHost.terminate();
    prepared.token.strictHost = null;
  }

  private deleteIssuedCandidatesForScenarioV1(
    sessionId: string,
    scenarioId: string,
  ): void {
    for (const [key, candidate] of this.issuedCandidates) {
      if (
        candidate.sessionId === sessionId
        && candidate.scenarioId === scenarioId
      ) this.issuedCandidates.delete(key);
    }
  }

  private deleteSessionEphemeraV1(sessionId: string): void {
    for (const [key, candidate] of this.issuedCandidates) {
      if (candidate.sessionId === sessionId) {
        this.issuedCandidates.delete(key);
      }
    }
    for (const key of this.promotionReceipts.keys()) {
      if (promotionKeyBelongsToSessionV1(key, sessionId)) {
        this.promotionReceipts.delete(key);
      }
    }
    for (const key of this.promotionOperations.keys()) {
      if (promotionKeyBelongsToSessionV1(key, sessionId)) {
        this.promotionOperations.delete(key);
      }
    }
  }

  private requiredSessionV1(sessionId: string): AdapterSessionV1 {
    const session = this.sessions.get(sessionId);
    if (session === undefined || session.closed) {
      throw runtimeErrorV1(`unknown or closed session ${sessionId}`);
    }
    return session;
  }

  private requiredChannelBranchV1(
    channel: RuntimeSignalChannelRefV1,
  ): AdapterBranchV1 {
    const session = this.requiredSessionV1(channel.sessionId);
    const branch = requiredBranchV1(session, channel.scenarioId);
    if (
      channel.protocolId !== SIGNAL_CHANNEL_PROTOCOL_V1
      || channel.channelId !== branch.signalChannelRef.channelId
      || channel.liveBranchId !== branch.liveBranchId
    ) throw runtimeErrorV1("signal channel binding mismatch");
    return branch;
  }

  private enqueueMutationV1<T>(
    session: AdapterSessionV1,
    operation: () => Promise<T>,
  ): Promise<T> {
    const result = session.mutationTail.then(operation);
    session.mutationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private nextInternalIdV1(kind: string): string {
    this.internalIdentityOrdinal += 1;
    return `studio-${nextAdapterRuntimeIdentityV1}-${kind}-${this.internalIdentityOrdinal}`;
  }
}

async function assertStrictCandidateCheckpointV1(
  prepared: PreparedBranchV1,
  settlement: MainWireStudioPeriodicSettlementChunkV1,
  receipt: MainWireStudioCheckpointReceiptV1,
): Promise<void> {
  const { checkpointV4, session } = receipt;
  if (
    session.hostId !== prepared.strictHost.hostId
    || session.sessionId !== prepared.strictTarget.sessionId
    || session.baseSessionInputSha256
      !== prepared.branch.resolvedSessionInput.sessionInputSha256
    || checkpointV4.baseSessionInputSha256
      !== prepared.branch.resolvedSessionInput.sessionInputSha256
    || session.controlState.targetStateSha256
      !== prepared.targetState.targetStateSha256
    || checkpointV4.controlTargetStateSha256
      !== prepared.targetState.targetStateSha256
    || session.parameterEpoch !== checkpointV4.parameterEpoch
    || session.stateIdentity.revision !== checkpointV4.transaction.revision
    || session.stateIdentity.acceptedTimeSec
      !== checkpointV4.transaction.acceptedTimeSec
    || session.observableFrame.revision !== session.stateIdentity.revision
    || session.observableFrame.acceptedTimeSec
      !== session.stateIdentity.acceptedTimeSec
    || settlement.session.hostId !== session.hostId
    || settlement.session.sessionId !== session.sessionId
    || settlement.session.baseSessionInputSha256
      !== session.baseSessionInputSha256
    || settlement.session.controlState.targetStateSha256
      !== session.controlState.targetStateSha256
    || settlement.session.parameterEpoch !== session.parameterEpoch
    || settlement.session.stateIdentity.revision
      !== session.stateIdentity.revision
    || !sameStrictAcceptedTimeV1(
      settlement.session.stateIdentity.acceptedTimeSec,
      session.stateIdentity.acceptedTimeSec,
    )
    || settlement.session.stateIdentity.totalBloodVolumeMl
      !== session.stateIdentity.totalBloodVolumeMl
    || checkpointV4.transaction.circulation.state.totalBloodVolumeMl
      !== session.stateIdentity.totalBloodVolumeMl
  ) throw runtimeErrorV1("strict checkpoint receipt mismatch");
  assertStrictPeriod1EvidenceV1(settlement, checkpointV4);
  const targetInputSha256 = await mainWireStudioTargetInputSha256V1(
    checkpointV4.controlTargetState,
    checkpointV4.baseSessionInputSha256,
  );
  if (
    targetInputSha256 !== prepared.token.target.patch.targetInputSha256
    || !sameExecutionIdentityV1(
      mainWireStudioExecutionIdentityV1(checkpointV4),
      prepared.branch.execution,
    )
  ) throw runtimeErrorV1("strict checkpoint identity mismatch");
}

function assertStrictPeriod1EvidenceV1(
  settlement: MainWireStudioPeriodicSettlementChunkV1,
  checkpoint: MainWireStudioCheckpointReceiptV1["checkpointV4"],
): void {
  const protocol = MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1;
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  const tracker = checkpoint.periodicSettlementTracker;
  const classification = settlement.periodicity;
  const expectedClosureCount = Math.min(
    settlement.completedBeatCount,
    protocol.retainedClosureCount,
  );
  const firstRetainedBeatIndex =
    settlement.completedBeatCount - expectedClosureCount + 1;
  const evidence = settlement.retainedBeatClosure.slice(
    -policy.consecutiveBeats,
  );
  const evidenceBeatIndices = evidence.map(({ beatIndex }) => beatIndex);
  if (
    settlement.status !== "period1-converged"
    || settlement.periodicSteadyStateClaimed !== true
    || settlement.period2OrbitSuspected !== false
    || !(
      settlement.beatCompletedThisCall === true
      && settlement.completedStepCountThisCall === protocol.stepsPerBeat
      || settlement.beatCompletedThisCall === false
        && settlement.trackerStartedThisCall === false
        && settlement.completedStepCountThisCall === 0
    )
    || (settlement.trackerStartedThisCall
      && settlement.completedBeatCount !== 1)
    || !Number.isSafeInteger(settlement.completedBeatCount)
    || settlement.completedBeatCount < policy.consecutiveBeats
    || settlement.completedBeatCount > protocol.maximumBeatCount
    || !Number.isFinite(settlement.anchorAcceptedTimeSec)
    || settlement.anchorAcceptedTimeSec < 0
    || !Number.isFinite(settlement.anchorPhase01)
    || settlement.anchorPhase01 < 0
    || settlement.anchorPhase01 >= 1
    || cyclePhaseDistanceV1(
      cyclePhase01V1(settlement.anchorAcceptedTimeSec),
      settlement.anchorPhase01,
    ) > 1e-10
    || classification.status !== "period1-converged"
    || classification.latestBeatIndex !== settlement.completedBeatCount
    || classification.consecutiveBeatsRequired !== policy.consecutiveBeats
    || !Array.isArray(classification.evidenceBeatIndices)
    || !Array.isArray(settlement.retainedBeatClosure)
    || settlement.retainedBeatClosure.length !== expectedClosureCount
    || evidence.length !== policy.consecutiveBeats
    || !sameNumberSequenceV1(
      classification.evidenceBeatIndices,
      evidenceBeatIndices,
    )
    || tracker === null
    || tracker.trackerCheckpointId
      !== "main-wire-periodic-settlement-tracker-checkpoint-v1"
    || tracker.schemaVersion !== 1
    || tracker.completedBeatCount !== settlement.completedBeatCount
    || !sameStrictAcceptedTimeV1(
      tracker.anchorAcceptedTimeSec,
      settlement.anchorAcceptedTimeSec,
    )
    || cyclePhaseDistanceV1(
      tracker.anchorPhase01,
      settlement.anchorPhase01,
    ) > 1e-10
  ) throw runtimeErrorV1("strict period-1 evidence mismatch");

  for (let index = 0; index < expectedClosureCount; index += 1) {
    const closure = settlement.retainedBeatClosure[index]!;
    const expectedBeatIndex = firstRetainedBeatIndex + index;
    if (
      closure.beatIndex !== expectedBeatIndex
      || closure.period1 === null
      || !Number.isFinite(closure.period1.maximumNormalizedDelta)
      || closure.period1.maximumNormalizedDelta < 0
      || !sameStrictAcceptedTimeV1(
        closure.period1.elapsedTimeSec,
        protocol.cycleLengthSec,
      )
      || (expectedBeatIndex === 1
        ? closure.period2 !== null
        : closure.period2 === null
          || !Number.isFinite(closure.period2.maximumNormalizedDelta)
          || closure.period2.maximumNormalizedDelta < 0
          || !sameStrictAcceptedTimeV1(
            closure.period2.elapsedTimeSec,
            protocol.cycleLengthSec * 2,
          ))
    ) throw runtimeErrorV1("strict period-1 closure evidence mismatch");
  }
  if (
    evidence.some(({ period1 }) =>
      period1 === null
      || period1.maximumNormalizedDelta
        > policy.period1NormalizedTolerance)
    || classification.latestPeriod1MaximumNormalizedDelta
      !== settlement.retainedBeatClosure.at(-1)!.period1!
        .maximumNormalizedDelta
    || classification.latestPeriod2MaximumNormalizedDelta
      !== (settlement.retainedBeatClosure.at(-1)!.period2
        ?.maximumNormalizedDelta ?? null)
  ) throw runtimeErrorV1("strict period-1 classification evidence mismatch");

  const expectedBoundaryCount = Math.min(
    settlement.completedBeatCount + 1,
    protocol.retainedBeatBoundaryCount,
  );
  if (tracker.boundaryTransactions.length !== expectedBoundaryCount) {
    throw runtimeErrorV1("strict period-1 tracker boundary count mismatch");
  }
  const firstBoundaryBeatIndex =
    settlement.completedBeatCount - expectedBoundaryCount + 1;
  for (let index = 0; index < expectedBoundaryCount; index += 1) {
    const transaction = tracker.boundaryTransactions[index]!;
    const beatIndex = firstBoundaryBeatIndex + index;
    if (
      transaction.checkpointId
        !== "main-wire-five-wall-noncoronary-checkpoint-v1"
      || transaction.schemaVersion !== 1
      || transaction.transactionId
        !== "main-wire-five-wall-noncoronary-transaction-v1"
      || transaction.revision !== transaction.circulation.state.revision
      || transaction.revision !== transaction.mechanics.revision
      || !sameStrictAcceptedTimeV1(
        transaction.acceptedTimeSec,
        transaction.circulation.state.acceptedTimeSec,
      )
      || !sameStrictAcceptedTimeV1(
        transaction.acceptedTimeSec,
        transaction.mechanics.acceptedTimeSec,
      )
      || !/^[0-9a-f]{8}$/.test(transaction.checkpointFingerprint)
      || transaction.revision
        !== checkpoint.transaction.revision
          - (settlement.completedBeatCount - beatIndex)
            * protocol.stepsPerBeat
      || !sameStrictAcceptedTimeV1(
        transaction.acceptedTimeSec,
        settlement.anchorAcceptedTimeSec
          + beatIndex * protocol.cycleLengthSec,
      )
      || cyclePhaseDistanceV1(
        cyclePhase01V1(transaction.acceptedTimeSec),
        settlement.anchorPhase01,
      ) > 1e-9
    ) throw runtimeErrorV1("strict period-1 tracker boundary mismatch");
  }
  const terminal = tracker.boundaryTransactions.at(-1)!;
  if (
    terminal.revision !== checkpoint.transaction.revision
    || !sameStrictAcceptedTimeV1(
      terminal.acceptedTimeSec,
      checkpoint.transaction.acceptedTimeSec,
    )
    || terminal.checkpointFingerprint
      !== checkpoint.transaction.checkpointFingerprint
    || !sameStrictAcceptedTimeV1(
      checkpoint.transaction.acceptedTimeSec,
      settlement.anchorAcceptedTimeSec
        + settlement.completedBeatCount * protocol.cycleLengthSec,
    )
    || cyclePhaseDistanceV1(
      checkpoint.canonicalPhase.phase01,
      settlement.anchorPhase01,
    ) > 1e-9
  ) throw runtimeErrorV1("strict period-1 tracker terminal mismatch");
}

function sameStrictAcceptedTimeV1(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right)
      <= 1e-9 * Math.max(1, Math.abs(left), Math.abs(right));
}

function cyclePhase01V1(timeSec: number): number {
  const cycleLengthSec =
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.cycleLengthSec;
  const raw = timeSec / cycleLengthSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function cyclePhaseDistanceV1(left: number, right: number): number {
  const direct = Math.abs(left - right);
  return Math.min(direct, 1 - direct);
}

function sameNumberSequenceV1(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function assertOpenCommandV1(
  command: OpenSimulationSessionCommandV1,
): void {
  if (
    typeof command.sessionId !== "string"
    || command.sessionId.trim().length === 0
  ) throw runtimeErrorV1("session ID is required");
  if (!Array.isArray(command.branches) || command.branches.length === 0) {
    throw runtimeErrorV1("session requires at least one scenario branch");
  }
  const seen = new Set<string>();
  for (const branch of command.branches) {
    if (
      typeof branch.scenarioId !== "string"
      || branch.scenarioId.trim().length === 0
    ) throw runtimeErrorV1("scenario ID is required");
    if (seen.has(branch.scenarioId)) {
      throw runtimeErrorV1(`duplicate scenario ${branch.scenarioId}`);
    }
    seen.add(branch.scenarioId);
    if (!/^[0-9a-f]{64}$/.test(branch.initialTargetInputSha256)) {
      throw runtimeErrorV1(
        `initial target identity is invalid for ${branch.scenarioId}`,
      );
    }
  }
}

function loadStudioRunArtifactContentV1(
  value: unknown,
): StudioRunArtifactContentV1 {
  const content = runtimeRecordV1(value, "source run artifact");
  assertRuntimeExactKeysV1(content, [
    "schemaId",
    "sourceRunRef",
    "simulationInputRef",
    "targetInputSha256",
    "snapshotRef",
    "execution",
    "claims",
  ], "source run artifact");
  if (content.schemaId !== STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID) {
    throw runtimeErrorV1("source run artifact schema mismatch");
  }
  const sourceRunRef = loadStudioArtifactRefV1(
    content.sourceRunRef,
    "run-artifact",
    "sourceRunRef",
  );
  const simulationInputRef = loadStudioArtifactRefV1(
    content.simulationInputRef,
    "simulation-input",
    "simulationInputRef",
  );
  const snapshotRef = loadStudioArtifactRefV1(
    content.snapshotRef,
    "snapshot-envelope",
    "snapshotRef",
  );
  if (
    typeof content.targetInputSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(content.targetInputSha256)
  ) throw runtimeErrorV1("source run target identity is invalid");
  const executionValue = runtimeRecordV1(
    content.execution,
    "source run execution",
  );
  assertRuntimeExactKeysV1(executionValue, [
    "modelRef",
    "runtimeRef",
    "solverRef",
    "stateCodecRef",
    "protocolRef",
  ], "source run execution");
  const executionEntries = Object.entries(executionValue);
  if (executionEntries.some(([, entry]) =>
    typeof entry !== "string" || entry.length === 0
  )) throw runtimeErrorV1("source run execution identity is invalid");
  const execution = Object.freeze({
    modelRef: executionValue.modelRef as string,
    runtimeRef: executionValue.runtimeRef as string,
    solverRef: executionValue.solverRef as string,
    stateCodecRef: executionValue.stateCodecRef as string,
    protocolRef: executionValue.protocolRef as string,
  });
  const claims = runtimeRecordV1(content.claims, "source run claims");
  assertRuntimeExactKeysV1(claims, [
    "steadyStatus",
    "numericalHealth",
    "snapshotIsWarmRestartable",
    "canonicalSignalSamplesStored",
    "canonicalWindowMetricsStored",
  ], "source run claims");
  if (
    claims.steadyStatus !== "converged"
    || claims.numericalHealth !== "passed"
    || claims.snapshotIsWarmRestartable !== true
    || claims.canonicalSignalSamplesStored !== false
    || claims.canonicalWindowMetricsStored !== false
  ) throw runtimeErrorV1("source run claims mismatch");
  return Object.freeze({
    schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
    sourceRunRef,
    simulationInputRef,
    targetInputSha256: content.targetInputSha256,
    snapshotRef,
    execution,
    claims: Object.freeze({
      steadyStatus: "converged",
      numericalHealth: "passed",
      snapshotIsWarmRestartable: true,
      canonicalSignalSamplesStored: false,
      canonicalWindowMetricsStored: false,
    }),
  });
}

function loadStudioArtifactRefV1<TKind extends StudioArtifactKindV1>(
  value: unknown,
  expectedKind: TKind,
  path: string,
): StudioArtifactRefV1<TKind> {
  const ref = runtimeRecordV1(value, path);
  assertRuntimeExactKeysV1(ref, [
    "schemaId",
    "kind",
    "sha256",
    "mediaType",
    "byteLength",
  ], path);
  if (
    ref.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== expectedKind
    || typeof ref.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(ref.sha256)
    || typeof ref.mediaType !== "string"
    || ref.mediaType.length === 0
    || !Number.isSafeInteger(ref.byteLength)
    || (ref.byteLength as number) < 0
  ) throw runtimeErrorV1(`${path} is invalid`);
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: expectedKind,
    sha256: ref.sha256,
    mediaType: ref.mediaType,
    byteLength: ref.byteLength as number,
  });
}

function runtimeRecordV1(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw runtimeErrorV1(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertRuntimeExactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) throw runtimeErrorV1(`${path} field set mismatch`);
}

function requiredBranchV1(
  session: AdapterSessionV1,
  scenarioId: string,
): AdapterBranchV1 {
  const branch = session.branches.get(scenarioId);
  if (branch === undefined) {
    throw runtimeErrorV1(`unknown scenario ${scenarioId}`);
  }
  return branch;
}

function cancelTokenV1(
  token: IntentBranchTokenV1,
  status: "superseded" | "aborted",
  reason: string,
): void {
  if (token.cancellation !== null) return;
  token.cancellation = status;
  token.cancellationReason = reason;
  token.strictHost?.terminate();
}

function releaseSettledTokenV1(
  session: AdapterSessionV1,
  token: IntentBranchTokenV1,
): void {
  if (
    token.liveSettled
    && token.strictSettled
    && session.activeIntentByScenario.get(token.target.scenarioId) === token
  ) session.activeIntentByScenario.delete(token.target.scenarioId);
}

function interruptionForTokenV1(
  token: IntentBranchTokenV1,
): RuntimeIntentBranchInterruptionV1 | null {
  if (token.cancellation === null) return null;
  return Object.freeze({
    status: token.cancellation,
    scenarioId: token.target.scenarioId,
    targetGeneration: token.target.targetGeneration,
    targetInputSha256: token.target.patch.targetInputSha256,
    reason: token.cancellationReason ?? token.cancellation,
  });
}

function failureForTargetV1(
  target: RuntimeTargetIntentBranchV1,
  message: string,
): Extract<
  RuntimeLiveIntentBranchResultV1 | RuntimeStrictIntentBranchResultV1,
  { status: "failure" }
> {
  return Object.freeze({
    status: "failure" as const,
    scenarioId: target.scenarioId,
    targetGeneration: target.targetGeneration,
    targetInputSha256: target.patch.targetInputSha256,
    message,
  });
}

function presentationFrameFromObservableV1(
  frame: MainWireScientificObservableFrameV1,
  windowMetrics: RuntimeWindowMetricStateV1,
): RuntimePresentationFrameV1 {
  return Object.freeze({
    point: observablePointV1(frame),
    windowMetrics,
  });
}

function observablePointV1(
  frame: MainWireScientificObservableFrameV1,
): RuntimeObservablePointV1 {
  const values: Record<string, number> = {};
  for (const [observableId, observable] of Object.entries(frame.values)) {
    if (
      observable.availability === "available"
      && typeof observable.value === "number"
      && Number.isFinite(observable.value)
    ) values[observableId] = observable.value;
  }
  return Object.freeze({
    sequence: frame.revision,
    simulationTimeSec: frame.acceptedTimeSec,
    phase01: canonicalPhase01V1(frame.acceptedTimeSec),
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

function metricsForTraceV1(
  collectedPointCount: number,
  originTimeSec: number,
  latestTimeSec: number,
): RuntimeWindowMetricStateV1 {
  const completedCycleCount = Math.floor(
    Math.max(0, latestTimeSec - originTimeSec + 1e-12)
      / MAIN_WIRE_CYCLE_LENGTH_SEC_V1,
  );
  return completedCycleCount === 0
    ? collectingMetricsV1(collectedPointCount)
    : Object.freeze({
      status: "complete" as const,
      collectedPointCount,
      completedCycleCount,
      values: Object.freeze({}),
    });
}

function canonicalPhase01V1(timeSec: number): number {
  const raw = timeSec / MAIN_WIRE_CYCLE_LENGTH_SEC_V1;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function sameArtifactRefV1(
  left: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
  right: Readonly<{
    schemaId: string;
    kind: string;
    sha256: string;
    mediaType: string;
    byteLength: number;
  }>,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function sameExecutionIdentityV1(
  left: RuntimeExecutionIdentityV1,
  right: RuntimeExecutionIdentityV1,
): boolean {
  return left.modelRef === right.modelRef
    && left.runtimeRef === right.runtimeRef
    && left.solverRef === right.solverRef
    && left.stateCodecRef === right.stateCodecRef
    && left.protocolRef === right.protocolRef;
}

function sameCandidateV1(
  left: RuntimeSteadyCandidateV1,
  right: RuntimeSteadyCandidateV1,
): boolean {
  return left.candidateId === right.candidateId
    && left.sessionId === right.sessionId
    && left.scenarioId === right.scenarioId
    && left.targetGeneration === right.targetGeneration
    && left.targetInputSha256 === right.targetInputSha256
    && sameArtifactRefV1(left.sourceRunRef, right.sourceRunRef)
    && sameArtifactRefV1(
      left.simulationInputRef,
      right.simulationInputRef,
    )
    && sameArtifactRefV1(left.snapshotRef, right.snapshotRef)
    && sameExecutionIdentityV1(left.execution, right.execution)
    && left.steadyStatus === right.steadyStatus
    && left.numericalHealth === right.numericalHealth;
}

function issuedCandidateKeyV1(
  candidate: RuntimeSteadyCandidateV1,
): string {
  return JSON.stringify([
    candidate.sessionId,
    candidate.scenarioId,
    candidate.candidateId,
  ]);
}

function promotionKeyV1(command: PromoteSteadyCandidateCommandV1): string {
  return JSON.stringify([
    command.sessionId,
    command.scenarioId,
    command.liveBranchId,
    command.targetGeneration,
    command.presentationRevision,
    command.candidate.candidateId,
    command.candidate.sessionId,
    command.candidate.scenarioId,
    command.candidate.targetGeneration,
    command.candidate.targetInputSha256,
    artifactRefFingerprintV1(command.candidate.sourceRunRef),
    artifactRefFingerprintV1(command.candidate.simulationInputRef),
    artifactRefFingerprintV1(command.candidate.snapshotRef),
    [
      command.candidate.execution.modelRef,
      command.candidate.execution.runtimeRef,
      command.candidate.execution.solverRef,
      command.candidate.execution.stateCodecRef,
      command.candidate.execution.protocolRef,
    ],
    command.candidate.steadyStatus,
    command.candidate.numericalHealth,
  ]);
}

function promotionKeyBelongsToSessionV1(
  key: string,
  sessionId: string,
): boolean {
  try {
    const parsed: unknown = JSON.parse(key);
    return Array.isArray(parsed) && parsed[0] === sessionId;
  } catch {
    return false;
  }
}

function artifactRefFingerprintV1(
  ref: StudioArtifactRefV1,
): readonly unknown[] {
  return [
    ref.schemaId,
    ref.kind,
    ref.sha256,
    ref.mediaType,
    ref.byteLength,
  ];
}

function canonicalPhaseForCycleV1(
  timeSec: number,
  cycleLengthSec: number,
): number {
  if (
    !Number.isFinite(timeSec)
    || !Number.isFinite(cycleLengthSec)
    || cycleLengthSec <= 0
  ) throw runtimeErrorV1("canonical phase input is invalid");
  return positiveModuloOneV1(timeSec / cycleLengthSec);
}

function positiveModuloOneV1(value: number): number {
  if (!Number.isFinite(value)) {
    throw runtimeErrorV1("canonical phase is invalid");
  }
  const phase = value - Math.floor(value);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function circularPhaseDistanceV1(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, 1 - distance);
}

function nextSafeIntegerV1(current: number, path: string): number {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw runtimeErrorV1(`${path} is invalid`);
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw runtimeErrorV1(`${path} is exhausted`);
  }
  return current + 1;
}

function boundedPositiveIntegerV1(
  value: number,
  maximum: number,
  path: string,
): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw runtimeErrorV1(`${path} must be an integer in [1, ${maximum}]`);
  }
  return value;
}

function monotonicNowMsV1(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function delayMsV1(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function runtimeErrorV1(
  message: string,
): MainWireSimulationRuntimeAdapterErrorV1 {
  return new MainWireSimulationRuntimeAdapterErrorV1(message);
}

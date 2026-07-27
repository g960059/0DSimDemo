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
  canonicalJsonStringify,
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
} from "@/engine/scientific/runtime";
import {
  MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
} from "@/engine/scientific/metrics";
import {
  SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  browserMainWireScientificWorkerLaneBudgetV1,
  MainWireScientificWorkerLaneSchedulerV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerLaneSchedulerV1";
import {
  INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
  EXACT_SIGNAL_EXPORT_LIMITS_V1,
  RUNTIME_PRESENTATION_COVERAGE_V1,
  RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1,
  RUNTIME_PRESENTATION_DT_SEC_V1,
  RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
  runtimePresentationCanonicalPhaseV1,
  runtimePresentationStepsToNextCanonicalBoundaryV1,
  type ArtifactStorePortV1,
  type ExactSignalExportCommandV1,
  type ExactSignalExportOptionsV1,
  type ExactSignalExportPortV1,
  type ExactSignalExportResultV1,
  type OpenScenarioRuntimeBranchV1,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeControlPatchV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeIntentBranchInterruptionV1,
  type RuntimeLiveIntentBranchResultV1,
  type RuntimeLiveIntentResultV1,
  type RuntimeLivePacingModeV1,
  type RuntimeLivePacingStateV1,
  type RuntimePresentationMetricStateV1,
  type RuntimePresentationSampleV1,
  type RuntimePresentationSignalChannelRefV1,
  type RuntimePresentationSignalEventV1,
  type RuntimePresentationSignalFailureV1,
  type RuntimePresentationSignalSubscriptionV1,
  type RuntimePresentationSnapshotV1,
  type RuntimeScenarioBranchOpenedV1,
  type RuntimeSessionOpenedV1,
  type RuntimeSteadyCandidateV1,
  type RuntimeStrictIntentBranchResultV1,
  type RuntimeStrictIntentResultV1,
  type RuntimeTargetIntentBranchV1,
  type RuntimeTargetIntentCommandV1,
  type RuntimeTargetIntentExecutionV1,
  type RunArtifactRefV1,
  type SimulationInputRefV1,
  type SimulationRuntimePortV1,
  type SnapshotEnvelopeRefV1,
  type StudioArtifactRefV1,
  type StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";
import {
  loadStudioRunArtifactContentV1,
} from "@/studio/infrastructure/artifacts/StudioRunArtifactContentLoaderV1";
export {
  loadStudioRunArtifactContentV1,
} from "@/studio/infrastructure/artifacts/StudioRunArtifactContentLoaderV1";
import {
  StudioExactSignalExportWriterV1,
} from "@/studio/infrastructure/artifacts/StudioExactSignalExportWriterV1";
import {
  createMainWireBrowserWorkerClientV1,
  createMainWireBrowserWorkerSessionHostFactoryV1,
  MainWireStudioTransientPartialProgressErrorV1,
  type MainWireStudioWorkerClientV1,
} from "./MainWireBrowserWorkerSessionHostV1";
import {
  MainWireExactSignalReplayWorkerV1,
} from "./MainWireExactSignalReplayWorkerV1";
import {
  putMainWireExactSignalReplayOriginEnvelopeV1,
  type MainWireRetainedExactSignalReplayOriginV1,
} from "./MainWireExactSignalReplayOriginEnvelopeV1";
import type {
  MainWireStudioCheckpointReceiptV1,
  MainWireStudioHostedSessionV1,
  MainWireStudioPeriodicSettlementChunkV1,
  MainWireStudioSessionHostFactoryV1,
  MainWireStudioSessionHostRequestV1,
  MainWireStudioSessionHostV1,
  MainWireStudioTransientChunkV1,
} from "./MainWireStudioSessionHostV1";
import {
  putMainWireStudioReplayCheckpointEnvelopeV1,
} from "./MainWireStudioReplayCheckpointEnvelopeV1";
import {
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
  mainWireStudioSeedPresentationSnapshotV1,
  putMainWireStudioSnapshotEnvelopeV1,
  type MainWireStudioSnapshotEnvelopeContentV1,
} from "./MainWireStudioSnapshotEnvelopeV1";
import {
  assertMainWireStudioTargetPatchV1,
  mainWireStudioTargetInputSha256V1,
} from "./MainWireStudioTargetResolverV1";
import {
  attachMainWireFullRateMetricIntegrationV1,
  createMainWirePresentationBeatAccumulatorV1,
  type MainWirePresentationBeatAccumulatorV1,
  type MainWirePresentationEstimatorInstrumentationV1,
} from "./MainWirePresentationEstimatorRegistryV1";

const MAIN_WIRE_LIVE_DT_SEC_V1 = RUNTIME_PRESENTATION_DT_SEC_V1;
const MAIN_WIRE_CYCLE_LENGTH_SEC_V1 = 1;
const DEFAULT_STRICT_MAXIMUM_BEAT_COUNT_V1 = 32;
/**
 * A fixed-1x presentation may recover short compute stalls against its
 * cumulative deadline, but it must not silently drift by a complete canonical
 * cycle. Crossing this budget re-anchors the pacing epoch: the accepted chunk
 * is still published, the lane keeps running, and the discarded wall/model
 * separation is reported as degraded pacing. It is not a lane failure.
 */
export const MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1 =
  MAIN_WIRE_CYCLE_LENGTH_SEC_V1 * 1_000;
// Keep a 10,000-request margin below the audited 100,000-request Worker cap.
// The host reads the whole shared Worker generation's request count, including
// analysis-control requests. Rotation is exact-checkpoint based and invisible
// to the signal-channel identity, so a continuous authoring session is not
// lifetime-bounded.
const LIVE_HOST_ROTATION_REQUEST_COUNT_V1 = 90_000;
const SIGNAL_CHANNEL_PROTOCOL_V1 =
  "circleheart-studio-runtime-signal-channel-v1" as const;
const RETAINED_REPLAY_ORIGIN_GENERATION_COUNT_V1 = 7;
/**
 * Live lanes — opening a branch, the strict steady candidate, promotion and
 * host rotation — run the hot-path-lean integrity tier. The exact-signal
 * replay/export host deliberately does not pass this and therefore keeps the
 * full-invariant tier, as does any injected test host factory that ignores the
 * request. The tiers produce identical numbers; see
 * engine/hotPathIntegrityTierV1.ts.
 */
const LIVE_LANE_HOST_REQUEST_V1: MainWireStudioSessionHostRequestV1 =
  Object.freeze({
    integrityTier: "hot-path-lean" as const,
    workerRole: "live-lane" as const,
  });
const STRICT_SETTLEMENT_HOST_REQUEST_V1:
MainWireStudioSessionHostRequestV1 = Object.freeze({
  integrityTier: "hot-path-lean" as const,
  workerRole: "strict-settlement" as const,
});
const EXACT_SIGNAL_REPLAY_HOST_REQUEST_V1:
MainWireStudioSessionHostRequestV1 = Object.freeze({
  workerRole: "exact-signal-replay" as const,
});

export type MainWireSimulationRuntimeAdapterOptionsV1 = Readonly<{
  artifacts: ArtifactStorePortV1;
  hostFactory?: MainWireStudioSessionHostFactoryV1;
  createLiveLaneClient?: (
    integrityTier: HotPathIntegrityTierV1,
  ) => MainWireStudioWorkerClientV1;
  liveStepCountPerChunk?: number;
  strictMaximumBeatCount?: number;
  nowMs?: () => number;
  delayMs?: (durationMs: number) => Promise<void>;
  presentationEstimatorInstrumentation?:
    MainWirePresentationEstimatorInstrumentationV1;
}>;

export const MAIN_WIRE_SCIENTIFIC_WORKER_LANE_SCHEDULER_V1 =
  new MainWireScientificWorkerLaneSchedulerV1(
    browserMainWireScientificWorkerLaneBudgetV1(),
    (integrityTier) =>
      createMainWireBrowserWorkerClientV1(integrityTier, 4),
  );

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
  exactExportControllers: Set<AbortController>;
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
  presentationSignalChannelRef: RuntimePresentationSignalChannelRefV1;
  presentationSignalObservers:
    Set<(event: RuntimePresentationSignalEventV1) => void>;
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
  livePacing: RuntimeLivePacingStateV1;
  /**
   * Stream-epoch scoped, so the reported rate survives loop restarts and host
   * rotation. Only a new stream epoch clears it.
   */
  livePacingReportingWindow: readonly MainWireStudioLivePacingRateSliceV1[];
  presentationOrdinal: number;
  retainedSampleCount: number;
  latestPresentationSample: RuntimePresentationSampleV1 | null;
  presentationEstimator: MainWirePresentationBeatAccumulatorV1;
  presentationMetricState: RuntimePresentationMetricStateV1;
  replayOrigins: readonly MainWireRetainedExactSignalReplayOriginV1[];
};

type IntentBranchTokenV1 = {
  command: RuntimeTargetIntentCommandV1;
  target: RuntimeTargetIntentBranchV1;
  cancellation: "superseded" | "aborted" | null;
  cancellationReason: string | null;
  strictHost: MainWireStudioSessionHostV1 | null;
  artifactCommitController: AbortController | null;
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
  replayOrigin: MainWireRetainedExactSignalReplayOriginV1 | null;
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
 * A live branch owns a dedicated logical host. Product lanes co-locate their
 * small hemodynamic-analysis control plane on that host's Worker thread.
 * Every strict job still owns a separate exclusive Worker host, preventing
 * the kernel-wide command queue from serializing foreground live work behind
 * periodic settlement.
 */
export class MainWireSimulationRuntimeAdapterV1
implements SimulationRuntimePortV1, ExactSignalExportPortV1 {
  private readonly artifacts: ArtifactStorePortV1;
  private readonly exactSignalWriter: StudioExactSignalExportWriterV1;
  private readonly hostFactory: MainWireStudioSessionHostFactoryV1;
  private readonly liveStepCountPerChunk: number;
  private readonly strictMaximumBeatCount: number;
  private readonly nowMs: () => number;
  private readonly delayMs: (durationMs: number) => Promise<void>;
  private readonly presentationEstimatorInstrumentation:
    MainWirePresentationEstimatorInstrumentationV1;
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
  private activeExactExportCount = 0;
  private internalIdentityOrdinal = 0;

  constructor(options: MainWireSimulationRuntimeAdapterOptionsV1) {
    this.artifacts = options.artifacts;
    this.exactSignalWriter =
      new StudioExactSignalExportWriterV1(options.artifacts);
    this.hostFactory = options.hostFactory
      ?? createMainWireBrowserWorkerSessionHostFactoryV1({
        ...(options.createLiveLaneClient === undefined
          ? {}
          : { createLiveLaneClient: options.createLiveLaneClient }),
      });
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
    this.presentationEstimatorInstrumentation =
      options.presentationEstimatorInstrumentation ?? {};
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
        const host = this.hostFactory(LIVE_LANE_HOST_REQUEST_V1);
        hosts.add(host);
        const hosted = await host.restoreV4({
          sessionId: this.nextInternalIdV1("live-open"),
          resolvedSessionInput: entry.resolvedSessionInput,
          checkpointV4: entry.envelope.checkpointV4,
        });
        assertOpeningActive();
        return await this.openBranchV1(
          command.sessionId,
          entry,
          host,
          hosted,
        );
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
        exactExportControllers: new Set(),
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

  async exportExactSignals(
    command: ExactSignalExportCommandV1,
    options: ExactSignalExportOptionsV1 = {},
  ): Promise<ExactSignalExportResultV1> {
    assertExactSignalExportCommandV1(command);
    if (options.signal?.aborted) {
      throw runtimeErrorV1("exact export was cancelled");
    }
    if (
      this.activeExactExportCount
        >= EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumConcurrentExportCount
    ) throw runtimeErrorV1("exact export concurrency budget is exhausted");
    const session = this.requiredSessionV1(command.sessionId);
    const branch = requiredBranchV1(session, command.scenarioId);
    if (
      command.liveBranchId !== branch.liveBranchId
      || command.targetGeneration > branch.reservedTargetGeneration
      || command.presentationRevision
        > branch.reservedPresentationRevision
    ) throw runtimeErrorV1("exact export branch identity mismatch");
    const origin = branch.replayOrigins.find((candidate) =>
      candidate.correlation.targetGeneration === command.targetGeneration
      && candidate.correlation.presentationRevision
        === command.presentationRevision
    );
    if (origin === undefined) {
      throw runtimeErrorV1(
        "exact export origin is unavailable or outside retention",
      );
    }

    const controller = new AbortController();
    const cancelFromCaller = () => controller.abort();
    options.signal?.addEventListener("abort", cancelFromCaller, {
      once: true,
    });
    this.activeExactExportCount += 1;
    session.exactExportControllers.add(controller);
    let host: MainWireStudioSessionHostV1 | null = null;
    try {
      host = this.hostFactory(EXACT_SIGNAL_REPLAY_HOST_REQUEST_V1);
      session.transientHosts.add(host);
      const worker = new MainWireExactSignalReplayWorkerV1({
        artifacts: this.artifacts,
        writer: this.exactSignalWriter,
        host,
        replaySessionId: this.nextInternalIdV1("exact-replay"),
      });
      return await worker.exportExactSignals(
        origin,
        command,
        controller.signal,
      );
    } catch (error) {
      throw runtimeErrorV1(errorMessageV1(error));
    } finally {
      options.signal?.removeEventListener("abort", cancelFromCaller);
      session.exactExportControllers.delete(controller);
      if (host !== null) {
        session.transientHosts.delete(host);
        host.terminate();
      }
      this.activeExactExportCount -= 1;
    }
  }

  subscribePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
    observer: (event: RuntimePresentationSignalEventV1) => void,
  ): RuntimePresentationSignalSubscriptionV1 {
    const branch = this.requiredChannelBranchV1(channel);
    branch.presentationSignalObservers.add(observer);
    let subscribed = true;
    return Object.freeze({
      unsubscribe: () => {
        if (!subscribed) return;
        subscribed = false;
        branch.presentationSignalObservers.delete(observer);
      },
    });
  }

  async suspendPresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
  ): Promise<void> {
    const branch = this.requiredChannelBranchV1(channel);
    branch.playbackRequested = false;
    await this.suspendBranchAtBoundaryV1(branch);
  }

  async resumePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
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
    for (const controller of session.exactExportControllers) {
      controller.abort();
    }
    session.exactExportControllers.clear();
    for (const token of session.activeIntentByScenario.values()) {
      cancelTokenV1(token, "aborted", "simulation session closed");
    }
    const hosts = new Set<MainWireStudioSessionHostV1>();
    for (const branch of session.branches.values()) {
      branch.playbackRequested = false;
      branch.desiredRunning = false;
      branch.presentationSignalObservers.clear();
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
    const resolvedSessionInput =
      await loadMainWireScientificResolvedSessionInputEnvelopeV1(
        inputValue,
      );
    const envelope = await loadMainWireStudioSnapshotEnvelopeV1(
      snapshotValue,
      {
        simulationInputRef: source.sourceInputRef,
        baseSessionInputSha256: resolvedSessionInput.sessionInputSha256,
      },
    );
    if (
      !sameSimulationReleaseRef(
        resolvedSessionInput.releaseRef,
        envelope.checkpointV4.releaseRef,
      )
    ) throw runtimeErrorV1("checkpoint/input release identity mismatch");
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

  private async openBranchV1(
    studioSessionId: string,
    loaded: LoadedSourceV1,
    host: MainWireStudioSessionHostV1,
    restored: MainWireStudioHostedSessionV1,
  ): Promise<Readonly<{
    internal: AdapterBranchV1;
    receipt: RuntimeScenarioBranchOpenedV1;
  }>> {
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
    // The hosted-session token has to stay exactly what the Worker restored.
    //
    // This used to substitute the envelope's accepted-step seed frame, which
    // split the browser-side token from the Worker: the Worker keeps returning
    // its own exact-checkpoint-restore projection, so the first checkpoint taken
    // to prepare a target failed its accepted-state binding ("checkpoint V4
    // accepted-state binding mismatch") and suspended both the live and the
    // strict lane. The receipt check above already pins the seed and the restore
    // to the same revision and accepted time; only the projection differed. The
    // seed still drives the initial presentation on its own, through
    // mainWireStudioSeedPresentationSnapshotV1 below.
    const hostedSession = restored;
    const liveBranchId = this.nextInternalIdV1("branch");
    const presentationSignalChannelRef = Object.freeze({
      protocolId: SIGNAL_CHANNEL_PROTOCOL_V1,
      channelId: this.nextInternalIdV1("signal"),
      sessionId: studioSessionId,
      scenarioId: source.scenarioId,
      liveBranchId,
    });
    const execution = mainWireStudioExecutionIdentityV1(
      envelope.checkpointV4,
    );
    const initialPresentation =
      mainWireStudioSeedPresentationSnapshotV1(envelope);
    const presentationEstimator =
      createMainWirePresentationBeatAccumulatorV1(
        this.presentationEstimatorInstrumentation,
      );
    presentationEstimator.update(initialPresentation.sample);
    let openingReplayOrigin:
      MainWireRetainedExactSignalReplayOriginV1 | null = null;
    try {
      openingReplayOrigin =
        await putMainWireExactSignalReplayOriginEnvelopeV1(
          this.artifacts,
          {
            correlation: {
              originKind: "opened-run",
              sessionId: studioSessionId,
              scenarioId: source.scenarioId,
              liveBranchId,
              targetGeneration: 0,
              presentationRevision: 0,
              candidateId: null,
            },
            sourceRunRef: source.sourceRunRef,
            simulationInputRef: source.sourceInputRef,
            replayCheckpointRef: source.sourceSnapshotRef,
            targetInputSha256: source.initialTargetInputSha256,
            execution,
            boundaryRevision:
              envelope.checkpointV4.transaction.revision,
            boundaryTimeSec:
              envelope.checkpointV4.transaction.acceptedTimeSec,
            cycleLengthSec:
              envelope.checkpointV4.canonicalPhase.cycleLengthSec,
          },
        );
    } catch {
      // Opening remains usable; only its initial generation is non-exportable.
    }
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
      presentationSignalChannelRef,
      presentationSignalObservers: new Set(),
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
      livePacing: INITIAL_RUNTIME_LIVE_PACING_STATE_V1,
      livePacingReportingWindow: Object.freeze([]),
      presentationOrdinal: 0,
      retainedSampleCount: 1,
      latestPresentationSample: initialPresentation.sample,
      presentationEstimator,
      presentationMetricState: initialPresentation.metricState,
      replayOrigins: openingReplayOrigin === null
        ? Object.freeze([])
        : Object.freeze([openingReplayOrigin]),
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
        presentationSignalChannelRef,
        streamEpoch: 0,
        execution,
        initialPresentation,
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
        artifactCommitController: null,
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
      branch.presentationOrdinal = -1;
      branch.retainedSampleCount = 0;
      branch.latestPresentationSample = null;
      branch.presentationEstimator =
        createMainWirePresentationBeatAccumulatorV1(
          this.presentationEstimatorInstrumentation,
        );
      branch.presentationMetricState = collectingMetricStateV1(0);
      branch.liveFailure = null;
      // A new stream epoch is a new 1x contract. Neither the old epoch's lag,
      // its accumulated deficit, nor its measured rate describes the trace
      // that starts here.
      branch.livePacing = INITIAL_RUNTIME_LIVE_PACING_STATE_V1;
      branch.livePacingReportingWindow = Object.freeze([]);
      committed.set(branch.scenarioId, entry);
    }
    // Source retirement is cleanup after the numerical commit. A transport
    // failure here must not expose a partially switched multi-branch intent;
    // the owning host is terminated on session close and bounds any orphan.
    await Promise.allSettled([
      ...discardedEntries.map((entry) =>
        this.cleanupPreparedBranchV1(entry)),
      ...committedEntries.map((entry) =>
        this.disposeLiveSessionOrQuarantineV1(
          entry.branch,
          entry.oldLiveSessionId,
        )),
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
    await this.rotateLiveHostIfRequiredV1(branch);
    const sourceCheckpoint =
      await branch.host.checkpointV4(branch.hostedSession);
    if (branch.hostedSession.sessionId === sourceCheckpoint.session.sessionId) {
      branch.hostedSession = sourceCheckpoint.session;
    }
    const strictHost = this.hostFactory(STRICT_SETTLEMENT_HOST_REQUEST_V1);
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
          await this.disposeLiveSessionOrQuarantineV1(
            branch,
            liveTarget.sessionId,
          ).catch(() => undefined);
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
      // The accepted live target is the fork itself. Taking it from the
      // checkpoint receipt instead would make the committed numerical state
      // depend on a host returning a faithful token, which the receipt
      // assertion below does not fully establish.
      liveTarget = liveFork.value;
      // Materialising the replay origin is best effort. Export availability
      // must never become part of live-lane correctness: a slow or failing
      // artifact write makes this generation non-exportable, it does not
      // suspend a numerically healthy lane. Ownership is rechecked before the
      // write so a superseded intent does not leave an unreachable blob.
      let replayOrigin:
        MainWireRetainedExactSignalReplayOriginV1 | null = null;
      try {
        if (token.cancellation === null) {
          const liveReplayCheckpoint =
            await branch.host.checkpointV4(liveFork.value);
          assertLiveReplayCheckpointReceiptV1(
            branch,
            liveFork.value,
            targetState,
            liveReplayCheckpoint,
          );
          if (token.cancellation === null) {
            const replayCheckpointRef =
              await putMainWireStudioReplayCheckpointEnvelopeV1(
                this.artifacts,
                {
                  simulationInputRef: branch.sourceInputRef,
                  resolvedSessionInput: branch.resolvedSessionInput,
                  checkpointV4: liveReplayCheckpoint.checkpointV4,
                },
              );
            if (token.cancellation === null) {
              replayOrigin =
                await putMainWireExactSignalReplayOriginEnvelopeV1(
                  this.artifacts,
                  {
                    correlation: {
                      originKind: "live-transition",
                      sessionId: session.sessionId,
                      scenarioId: branch.scenarioId,
                      liveBranchId: branch.liveBranchId,
                      targetGeneration: token.target.targetGeneration,
                      presentationRevision:
                        token.target.presentationRevision,
                      candidateId: null,
                    },
                    sourceRunRef: branch.sourceRunRef,
                    simulationInputRef: branch.sourceInputRef,
                    replayCheckpointRef,
                    targetInputSha256:
                      token.target.patch.targetInputSha256,
                    execution: branch.execution,
                    boundaryRevision:
                      liveReplayCheckpoint.checkpointV4.transaction
                        .revision,
                    boundaryTimeSec:
                      liveReplayCheckpoint.checkpointV4.transaction
                        .acceptedTimeSec,
                    cycleLengthSec:
                      liveReplayCheckpoint.checkpointV4.canonicalPhase
                        .cycleLengthSec,
                  },
                );
            }
          }
        }
      } catch {
        // Leaves this generation non-exportable. The live transition commits.
        replayOrigin = null;
      }
      await strictHost.dispose(strictSource.sessionId);
      return Object.freeze({
        token,
        branch,
        oldLiveSessionId: sourceCheckpoint.session.sessionId,
        liveTarget,
        strictHost,
        strictTarget: strictFork.value,
        targetState,
        replayOrigin,
      });
    } catch (error) {
      if (liveTarget !== null) {
        await this.disposeLiveSessionOrQuarantineV1(
          branch,
          liveTarget.sessionId,
        ).catch(() => undefined);
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
          if (prepared.replayOrigin !== null) {
            assertInitialLiveReplayContinuationV1(
              prepared.replayOrigin,
              latest,
            );
            retainReplayOriginV1(
              prepared.branch,
              prepared.replayOrigin,
            );
          }
          const initialPresentation = this.resetPresentationAccumulatorV1(
            prepared.branch,
            latest,
          );
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
              initialPresentation,
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
              const beforeArtifactCommit = interruptionForTokenV1(token);
              if (beforeArtifactCommit !== null) {
                return beforeArtifactCommit;
              }
              const artifactCommitController = new AbortController();
              token.artifactCommitController = artifactCommitController;
              let snapshotRef: SnapshotEnvelopeRefV1;
              try {
                snapshotRef = await putMainWireStudioSnapshotEnvelopeV1(
                  this.artifacts,
                  {
                    simulationInputRef: prepared.branch.sourceInputRef,
                    checkpointV4: checkpoint.checkpointV4,
                    seedObservableFrame:
                      checkpoint.session.observableFrame,
                  },
                  { signal: artifactCommitController.signal },
                );
              } finally {
                if (token.artifactCommitController === artifactCommitController) {
                  token.artifactCommitController = null;
                }
              }
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
    if (branch.liveFailure !== null) throw branch.liveFailure;
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
      observationStride: RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
      metricIntegrationPolicy:
        MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
      rendererRetentionPolicy:
        SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
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
      // A failed command may still have committed accepted numerical steps.
      // Preserve every observation retained by the Worker before publishing
      // the terminal failure, but only when this stream already owns a reset
      // boundary (initial-transition failure has no publishable trace yet).
      if (
        branch.latestPresentationSample !== null
        && error.acceptedPartialProgress.observableFrames.length > 0
      ) {
        this.publishTransientChunkV1(
          branch,
          error.acceptedPartialProgress,
          branch.targetGeneration,
          branch.presentationRevision,
          branch.streamEpoch,
        );
      }
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
    const newHost = this.hostFactory(LIVE_LANE_HOST_REQUEST_V1);
    session.transientHosts.add(newHost);
    let enteredCommitWindow = false;
    let committed = false;
    try {
      const [snapshotValue, inputValue] = await Promise.all([
        this.artifacts.readJson(command.candidate.snapshotRef),
        this.artifacts.readJson(command.candidate.simulationInputRef),
      ]);
      const resolvedInput =
        await loadMainWireScientificResolvedSessionInputEnvelopeV1(
          inputValue,
        );
      const envelope = await loadMainWireStudioSnapshotEnvelopeV1(
        snapshotValue,
        {
          simulationInputRef: command.candidate.simulationInputRef,
          baseSessionInputSha256: resolvedInput.sessionInputSha256,
        },
      );
      if (
        !sameSimulationReleaseRef(
          resolvedInput.releaseRef,
          envelope.checkpointV4.releaseRef,
        )
        || envelope.checkpointV4.controlTargetStateSha256
          !== branch.hostedSession.controlState.targetStateSha256
      ) throw runtimeErrorV1("candidate snapshot binding mismatch");
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
          envelope.checkpointV4.transaction.revision,
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
      const initialPresentation =
        mainWireStudioSeedPresentationSnapshotV1(envelope);
      let promotedReplayOrigin:
        MainWireRetainedExactSignalReplayOriginV1 | null = null;
      try {
        promotedReplayOrigin =
          await putMainWireExactSignalReplayOriginEnvelopeV1(
            this.artifacts,
            {
              correlation: {
                originKind: "promoted-steady-candidate",
                sessionId: command.sessionId,
                scenarioId: command.scenarioId,
                liveBranchId: branch.liveBranchId,
                targetGeneration: command.targetGeneration,
                presentationRevision: command.presentationRevision,
                candidateId: command.candidate.candidateId,
              },
              sourceRunRef: command.candidate.sourceRunRef,
              simulationInputRef: command.candidate.simulationInputRef,
              replayCheckpointRef: command.candidate.snapshotRef,
              targetInputSha256: command.candidate.targetInputSha256,
              execution,
              boundaryRevision:
                envelope.checkpointV4.transaction.revision,
              boundaryTimeSec:
                envelope.checkpointV4.transaction.acceptedTimeSec,
              cycleLengthSec:
                envelope.checkpointV4.canonicalPhase.cycleLengthSec,
            },
          );
      } catch {
        // Promotion remains valid; this presentation is non-exportable.
      }
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        oldHost,
        oldSessionId,
      );
      const replayOrigins = promotedReplayOrigin === null
        ? branch.replayOrigins
        : nextReplayOriginsV1(
          branch.replayOrigins,
          promotedReplayOrigin,
        );
      const receipt = Object.freeze({
        sessionId: command.sessionId,
        scenarioId: command.scenarioId,
        targetGeneration: command.targetGeneration,
        presentationRevision: command.presentationRevision,
        candidateId: command.candidate.candidateId,
        streamEpoch,
        initialPresentation,
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
      branch.presentationOrdinal = 0;
      branch.retainedSampleCount = 1;
      branch.latestPresentationSample = initialPresentation.sample;
      branch.presentationEstimator =
        createMainWirePresentationBeatAccumulatorV1(
          this.presentationEstimatorInstrumentation,
        );
      branch.presentationEstimator.update(initialPresentation.sample);
      branch.presentationMetricState = initialPresentation.metricState;
      branch.liveFailure = null;
      branch.livePacing = INITIAL_RUNTIME_LIVE_PACING_STATE_V1;
      branch.livePacingReportingWindow = Object.freeze([]);
      branch.replayOrigins = replayOrigins;
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
    targetAcceptedRevision: number,
  ): Promise<void> {
    const stepsPerCycle = Math.round(
      RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1
        / RUNTIME_PRESENTATION_DT_SEC_V1,
    );
    const currentPhaseStep =
      branch.hostedSession.stateIdentity.revision % stepsPerCycle;
    const targetPhaseStep = targetAcceptedRevision % stepsPerCycle;
    const totalStepCount =
      (targetPhaseStep - currentPhaseStep + stepsPerCycle) % stepsPerCycle;

    let remainingStepCount = totalStepCount;
    // Phase alignment is still 1x presentation on the outgoing stream, so it
    // uses the same epoch rules. The successful promotion resets pacing
    // immediately afterwards.
    let pacingState = this.reanchorLivePacingEpochV1(branch);
    while (remainingStepCount > 0 && branch.playbackRequested) {
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        expectedHost,
        expectedSessionId,
      );
      const maximumStepCount = Math.min(
        remainingStepCount,
        this.liveStepCountPerChunk,
      );
      const stepCount = boundaryRetainingLiveStepCountV1(
        branch.hostedSession.stateIdentity.revision,
        maximumStepCount,
      );
      const activeStartedWallMs = this.nowMs();
      const chunk = await this.runPromotionAlignmentChunkV1(
        branch,
        expectedHost,
        stepCount,
      );
      const activeWallDurationMs = this.nowMs() - activeStartedWallMs;
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        expectedHost,
        expectedSessionId,
      );
      branch.hostedSession = chunk.session;
      // Supersession during the pacing wait is reported by the promotion
      // assertion below, which throws rather than silently dropping the chunk.
      const decision = await this.settleLivePacingDelayV1(
        pacingState,
        chunk.session.stateIdentity.acceptedTimeSec,
        activeWallDurationMs,
        () => true,
      );
      this.assertPromotionStillCurrentV1(
        session,
        branch,
        command,
        expectedHost,
        expectedSessionId,
      );
      if (decision === null) {
        throw runtimeErrorV1("promotion alignment pacing lost its chunk");
      }
      pacingState = decision.nextState;
      branch.livePacing = decision.livePacing;
      branch.livePacingReportingWindow = decision.nextState.reportingRateWindow;
      this.publishTransientChunkV1(
        branch,
        chunk,
        branch.targetGeneration,
        branch.presentationRevision,
        branch.streamEpoch,
      );
      remainingStepCount -= stepCount;
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
      observationStride: RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
      metricIntegrationPolicy:
        MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
      rendererRetentionPolicy:
        SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
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
          channelId: branch.presentationSignalChannelRef.channelId,
          sessionId: branch.presentationSignalChannelRef.sessionId,
          scenarioId: branch.scenarioId,
          liveBranchId: branch.liveBranchId,
          targetGeneration: branch.targetGeneration,
          presentationRevision: branch.presentationRevision,
          streamEpoch: branch.streamEpoch,
          message: failure.message,
        }) satisfies RuntimePresentationSignalFailureV1);
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
    // The epoch carries the branch's current mode and accumulated deficit
    // across pause/resume: a resumed lane that was degraded has not proven it
    // can hold 1x again until a full cycle of compute says so.
    let pacingState = this.reanchorLivePacingEpochV1(branch);
    while (
      branch.desiredRunning
      && branch.loopIdentity === loopIdentity
      && branch.liveFailure === null
    ) {
      const activeStartedWallMs = this.nowMs();
      await this.rotateLiveHostIfRequiredV1(branch);
      if (
        !branch.desiredRunning
        || branch.loopIdentity !== loopIdentity
        || branch.liveFailure !== null
      ) return;
      const sourceSessionId = branch.hostedSession.sessionId;
      const sourceHost = branch.host;
      const targetGeneration = branch.targetGeneration;
      const presentationRevision = branch.presentationRevision;
      const streamEpoch = branch.streamEpoch;
      const stepCount = boundaryRetainingLiveStepCountV1(
        branch.hostedSession.stateIdentity.revision,
        this.liveStepCountPerChunk,
      );
      const chunk = await sourceHost.runTransient({
        session: branch.hostedSession,
        dtSec: MAIN_WIRE_LIVE_DT_SEC_V1,
        stepCount,
        observationStride: RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1,
        metricIntegrationPolicy:
          MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
        rendererRetentionPolicy:
          SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
      });
      // Rotation is compute this lane had to perform, so it counts as active
      // wall time; the pacing sleep below deliberately does not.
      const activeWallDurationMs = this.nowMs() - activeStartedWallMs;
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
      ) {
        // The accepted state this epoch was measuring against is gone. Re-anchor
        // scheduling on whatever is current instead of comparing the next chunk
        // to a superseded timeline.
        pacingState = this.reanchorLivePacingEpochV1(branch);
        continue;
      }
      // A manual suspension still accepts, paces, and publishes the command
      // that was already in flight. This preserves a contiguous sequence on
      // resume, so the suspension boundary is not a reason to skip pacing.
      const decision = await this.settleLivePacingDelayV1(
        pacingState,
        chunk.session.stateIdentity.acceptedTimeSec,
        activeWallDurationMs,
        () =>
          branch.host === sourceHost
          && branch.hostedSession.sessionId === sourceSessionId
          && branch.targetGeneration === targetGeneration
          && branch.presentationRevision === presentationRevision
          && branch.streamEpoch === streamEpoch,
      );
      if (decision === null) {
        pacingState = this.reanchorLivePacingEpochV1(branch);
        continue;
      }
      pacingState = decision.nextState;
      branch.livePacing = decision.livePacing;
      branch.livePacingReportingWindow = decision.nextState.reportingRateWindow;
      this.publishTransientChunkV1(
        branch,
        chunk,
        targetGeneration,
        presentationRevision,
        streamEpoch,
      );
    }
  }

  private reanchorLivePacingEpochV1(
    branch: AdapterBranchV1,
  ): MainWireStudioLivePacingEpochStateV1 {
    return mainWireStudioInitialLivePacingEpochStateV1({
      wallNowMs: this.nowMs(),
      acceptedSimulationNowSec:
        branch.hostedSession.stateIdentity.acceptedTimeSec,
      mode: branch.livePacing.mode,
      cumulativeRebasedDeficitMs: branch.livePacing.cumulativeRebasedDeficitMs,
      reportingRateWindow: branch.livePacingReportingWindow,
      epochLagMs: branch.livePacing.epochLagMs,
    });
  }

  /**
   * Waits out the 1x presentation delay for an accepted chunk and returns the
   * decision to commit, or null when the chunk's identity was superseded while
   * waiting.
   *
   * The wait happens before the caller publishes, so presentation can never run
   * ahead of the declared rate by up to a chunk. The pure decision is recomputed
   * from the same pre-chunk epoch after each wait, so an early-returning timer
   * simply leaves a smaller residual delay rather than releasing the chunk early.
   *
   * A wait the monotonic clock cannot resolve ends the loop instead of
   * repeating it. Sub-millisecond residual delays are routine once compute runs
   * faster than realtime, and the host clock's granularity is the floor on how
   * precisely any deadline can be honoured. Spinning on that floor would burn
   * the lane, and failing on it would kill exactly the healthy lane this pacing
   * model exists to keep running.
   */
  private async settleLivePacingDelayV1(
    pacingState: MainWireStudioLivePacingEpochStateV1,
    acceptedSimulationNowSec: number,
    activeWallDurationMs: number,
    stillCurrent: () => boolean,
  ): Promise<MainWireStudioLivePacingDecisionV1 | null> {
    let decision = mainWireStudioLivePacingDecisionV1({
      state: pacingState,
      wallNowMs: this.nowMs(),
      acceptedSimulationNowSec,
      activeWallDurationMs,
    });
    while (decision.delayMs > 0) {
      const waitStartedWallMs = this.nowMs();
      await this.delayMs(decision.delayMs);
      if (!stillCurrent()) return null;
      const wallNowMs = this.nowMs();
      if (wallNowMs <= waitStartedWallMs) break;
      decision = mainWireStudioLivePacingDecisionV1({
        state: pacingState,
        wallNowMs,
        acceptedSimulationNowSec,
        activeWallDurationMs,
      });
    }
    return decision;
  }

  private async rotateLiveHostIfRequiredV1(
    branch: AdapterBranchV1,
  ): Promise<void> {
    if (branch.host.requestCount < LIVE_HOST_ROTATION_REQUEST_COUNT_V1) return;
    const session = this.sessions.get(
      branch.presentationSignalChannelRef.sessionId,
    );
    if (
      session === undefined
      || session.closed
      || session.branches.get(branch.scenarioId) !== branch
    ) throw runtimeErrorV1("live host rotation lost session ownership");

    const oldHost = branch.host;
    const oldSession = branch.hostedSession;
    const checkpoint = await oldHost.checkpointV4(oldSession);
    if (
      branch.host !== oldHost
      || branch.hostedSession.sessionId !== oldSession.sessionId
    ) throw runtimeErrorV1("live host changed during rotation checkpoint");
    branch.hostedSession = checkpoint.session;
    if (
      session.closed
      || this.sessions.get(session.sessionId) !== session
      || session.branches.get(branch.scenarioId) !== branch
      || branch.host !== oldHost
      || branch.hostedSession.sessionId !== checkpoint.session.sessionId
    ) throw runtimeErrorV1("live host rotation lost session ownership");

    const newHost = this.hostFactory(LIVE_LANE_HOST_REQUEST_V1);
    session.transientHosts.add(newHost);
    try {
      const restored = await newHost.restoreV4({
        sessionId: this.nextInternalIdV1("live-rotated"),
        resolvedSessionInput: branch.resolvedSessionInput,
        checkpointV4: checkpoint.checkpointV4,
      });
      if (
        session.closed
        || this.sessions.get(session.sessionId) !== session
        || session.branches.get(branch.scenarioId) !== branch
        || branch.host !== oldHost
        || branch.hostedSession.sessionId !== checkpoint.session.sessionId
        || restored.baseSessionInputSha256
          !== checkpoint.session.baseSessionInputSha256
        || restored.controlState.targetStateSha256
          !== checkpoint.session.controlState.targetStateSha256
        || restored.parameterEpoch !== checkpoint.session.parameterEpoch
        || restored.stateIdentity.revision
          !== checkpoint.session.stateIdentity.revision
        || restored.stateIdentity.acceptedTimeSec
          !== checkpoint.session.stateIdentity.acceptedTimeSec
        || restored.stateIdentity.totalBloodVolumeMl
          !== checkpoint.session.stateIdentity.totalBloodVolumeMl
      ) throw runtimeErrorV1("live host rotation receipt mismatch");

      branch.host = newHost;
      branch.hostedSession = Object.freeze({
        ...restored,
        observableFrame: checkpoint.session.observableFrame,
      });
      session.transientHosts.delete(newHost);
      try {
        oldHost.terminate();
      } catch {
        // The accepted pointer already owns newHost; the retired host cannot
        // participate in further numerical commands.
      }
    } catch (error) {
      session.transientHosts.delete(newHost);
      try {
        newHost.terminate();
      } catch {
        // Preserve the exact-checkpoint rotation failure.
      }
      throw error;
    }
  }

  private emitSignalEventV1(
    branch: AdapterBranchV1,
    event: RuntimePresentationSignalEventV1,
  ): void {
    let observerFailed = false;
    let firstObserverFailure: unknown;
    for (const observer of [...branch.presentationSignalObservers]) {
      try {
        observer(event);
      } catch (error) {
        if (!observerFailed) {
          observerFailed = true;
          firstObserverFailure = error;
        }
      }
    }
    if (!observerFailed || event.kind === "failure") return;

    const failure = runtimeErrorV1(
      "live signal observer callback failed: "
      + errorMessageV1(firstObserverFailure),
    );
    branch.playbackRequested = false;
    branch.desiredRunning = false;
    branch.liveFailure = failure;
    // Do not detach a callback behind its owner's back. The branch is now
    // fail-closed, and every subscriber gets one attempt to observe the cause.
    // A callback that also rejects the failure event cannot prevent healthy
    // subscribers from receiving it or invalidate numerical ownership.
    this.emitSignalEventV1(branch, Object.freeze({
      kind: "failure",
      channelId: branch.presentationSignalChannelRef.channelId,
      sessionId: branch.presentationSignalChannelRef.sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration: branch.targetGeneration,
      presentationRevision: branch.presentationRevision,
      streamEpoch: branch.streamEpoch,
      message: failure.message,
    }) satisfies RuntimePresentationSignalFailureV1);
  }

  private publishTransientChunkV1(
    branch: AdapterBranchV1,
    chunk: MainWireStudioTransientChunkV1,
    targetGeneration: number,
    presentationRevision: number,
    streamEpoch: number,
  ): void {
    const samples: RuntimePresentationSampleV1[] = [];
    const fullRateMetricBeat =
      chunk.metricIntegration?.latestCompletedBeat ?? null;
    for (const [frameIndex, frame] of chunk.observableFrames.entries()) {
      const previous = branch.latestPresentationSample;
      if (previous === null) {
        throw runtimeErrorV1(
          "presentation chunk has no retained stream boundary",
        );
      }
      const presentationOrdinal = nextSafeIntegerV1(
        branch.presentationOrdinal,
        "presentation ordinal",
      );
      const phase = runtimePresentationCanonicalPhaseV1(frame.revision);
      const span = frame.revision - previous.acceptedRevision;
      const retentionReason = phase === 0
        ? "canonical-beat-boundary" as const
        : span < RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1
          ? frameIndex === chunk.observableFrames.length - 1
            ? "command-boundary" as const
            : "geometry-feature" as const
          : "observation-stride" as const;
      const sample = presentationSampleFromObservableV1(
        frame,
        presentationOrdinal,
        previous,
        retentionReason,
      );
      const estimate = branch.presentationEstimator.update(sample);
      branch.presentationOrdinal = presentationOrdinal;
      branch.retainedSampleCount += 1;
      branch.latestPresentationSample = sample;
      if (
        estimate !== null
        && fullRateMetricBeat !== null
        && estimate.startAcceptedRevision
          === fullRateMetricBeat.startAcceptedRevision
        && estimate.endAcceptedRevision
          === fullRateMetricBeat.endAcceptedRevision
      ) {
        const fullRateEstimate =
          attachMainWireFullRateMetricIntegrationV1(
            estimate,
            fullRateMetricBeat,
          );
        const completedBeatCount =
          branch.presentationMetricState.completedBeatCount + 1;
        branch.presentationMetricState = Object.freeze({
          status: "complete" as const,
          retainedSampleCount: branch.retainedSampleCount,
          completedBeatCount,
          latestBeatEstimate: fullRateEstimate,
        });
      } else if (branch.presentationMetricState.status === "complete") {
        branch.presentationMetricState = Object.freeze({
          ...branch.presentationMetricState,
          retainedSampleCount: branch.retainedSampleCount,
        });
      } else {
        branch.presentationMetricState =
          collectingMetricStateV1(branch.retainedSampleCount);
      }
      samples.push(sample);
    }
    if (samples.length === 0) return;
    this.emitSignalEventV1(branch, Object.freeze({
      kind: "samples",
      channelId: branch.presentationSignalChannelRef.channelId,
      sessionId: branch.presentationSignalChannelRef.sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration,
      presentationRevision,
      streamEpoch,
      samples: Object.freeze(samples),
      metricState: branch.presentationMetricState,
      livePacing: branch.livePacing,
    }));
  }

  private resetPresentationAccumulatorV1(
    branch: AdapterBranchV1,
    frame: MainWireScientificObservableFrameV1,
  ): RuntimePresentationSnapshotV1 {
    const sample = presentationSampleFromObservableV1(frame, 0, null);
    const estimator = createMainWirePresentationBeatAccumulatorV1(
      this.presentationEstimatorInstrumentation,
    );
    estimator.update(sample);
    const metricState = collectingMetricStateV1(1);
    branch.presentationOrdinal = 0;
    branch.retainedSampleCount = 1;
    branch.latestPresentationSample = sample;
    branch.presentationEstimator = estimator;
    branch.presentationMetricState = metricState;
    return Object.freeze({ sample, metricState });
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
    await this.disposeLiveSessionOrQuarantineV1(
      prepared.branch,
      prepared.liveTarget.sessionId,
    ).catch(() => undefined);
    prepared.strictHost.terminate();
    prepared.token.strictHost = null;
  }

  private async disposeLiveSessionOrQuarantineV1(
    branch: AdapterBranchV1,
    sessionId: string,
  ): Promise<void> {
    try {
      await branch.host.dispose(sessionId);
    } catch (error) {
      const failure = runtimeErrorV1(
        `live host disposal failed and was quarantined: ${errorMessageV1(error)}`,
      );
      branch.playbackRequested = false;
      branch.desiredRunning = false;
      branch.liveFailure = failure;
      try {
        branch.host.terminate();
      } catch {
        // Preserve the receipt/transport failure that caused quarantine.
      }
      throw failure;
    }
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
    channel: RuntimePresentationSignalChannelRefV1,
  ): AdapterBranchV1 {
    const session = this.requiredSessionV1(channel.sessionId);
    const branch = requiredBranchV1(session, channel.scenarioId);
    if (
      channel.protocolId !== SIGNAL_CHANNEL_PROTOCOL_V1
      || channel.channelId !== branch.presentationSignalChannelRef.channelId
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

/**
 * One chunk's contribution to the rolling throughput window. Active wall
 * duration covers host rotation and the transient command itself; it excludes
 * adapter-inserted pacing sleeps, which are not compute cost.
 */
export type MainWireStudioLivePacingRateSliceV1 = Readonly<{
  acceptedSimulationDurationMs: number;
  activeWallDurationMs: number;
}>;

export type MainWireStudioLivePacingEpochStateV1 = Readonly<{
  wallAnchorMs: number;
  simulationAnchorSec: number;
  lastDecisionWallMs: number;
  lastAcceptedSimulationSec: number;
  mode: RuntimeLivePacingModeV1;
  cumulativeRebasedDeficitMs: number;
  /**
   * Diagnostic throughput window, scoped to the stream epoch. It survives
   * pacing re-anchors and loop restarts, so a lane that re-anchors faster than
   * it can accumulate a cycle still reports a measured rate. Reporting a rate
   * and proving recovery are deliberately separate: the recovery window below
   * is the evidence, this one is the number a reader sees.
   */
  reportingRateWindow: readonly MainWireStudioLivePacingRateSliceV1[];
  /**
   * Recovery evidence, scoped to the pacing epoch. A re-anchor clears it and
   * the re-anchoring chunk never enters it, so returning to 1x always requires
   * a clean cycle that contains no re-anchor.
   */
  recoveryRateWindow: readonly MainWireStudioLivePacingRateSliceV1[];
}>;

export type MainWireStudioLivePacingDecisionInputV1 = Readonly<{
  state: MainWireStudioLivePacingEpochStateV1;
  wallNowMs: number;
  acceptedSimulationNowSec: number;
  activeWallDurationMs: number;
}>;

export type MainWireStudioLivePacingDecisionV1 = Readonly<{
  delayMs: number;
  didRebase: boolean;
  /**
   * Full pre-rebase epoch lag discarded by this decision; zero otherwise.
   */
  rebasedDeficitMs: number;
  nextState: MainWireStudioLivePacingEpochStateV1;
  livePacing: RuntimeLivePacingStateV1;
}>;

const LIVE_PACING_CYCLE_MS_V1 = MAIN_WIRE_CYCLE_LENGTH_SEC_V1 * 1_000;

function assertFiniteLivePacingValueV1(value: number): void {
  if (!Number.isFinite(value)) {
    throw runtimeErrorV1("live pacing state is invalid");
  }
}

type LivePacingWindowTotalsV1 = Readonly<{
  totalAcceptedSimulationMs: number;
  totalActiveWallMs: number;
}>;

function livePacingWindowTotalsV1(
  window: readonly MainWireStudioLivePacingRateSliceV1[],
): LivePacingWindowTotalsV1 {
  let totalAcceptedSimulationMs = 0;
  let totalActiveWallMs = 0;
  for (const slice of window) {
    totalAcceptedSimulationMs += slice.acceptedSimulationDurationMs;
    totalActiveWallMs += slice.activeWallDurationMs;
  }
  return { totalAcceptedSimulationMs, totalActiveWallMs };
}

function assertLivePacingRateWindowV1(
  window: readonly MainWireStudioLivePacingRateSliceV1[],
): void {
  if (!Array.isArray(window)) {
    throw runtimeErrorV1("live pacing state is invalid");
  }
  for (const slice of window) {
    if (
      slice.acceptedSimulationDurationMs <= 0
      || slice.activeWallDurationMs < 0
    ) throw runtimeErrorV1("live pacing state is invalid");
    assertFiniteLivePacingValueV1(slice.acceptedSimulationDurationMs);
    assertFiniteLivePacingValueV1(slice.activeWallDurationMs);
  }
  const { totalAcceptedSimulationMs } = livePacingWindowTotalsV1(window);
  assertFiniteLivePacingValueV1(totalAcceptedSimulationMs);
  // A stored window must already be the minimal trailing window holding one
  // cycle. Anything longer would silently widen the horizon it reports over.
  // A shorter, partial window is valid: it is what a lane that re-anchors
  // often has to report from.
  if (
    window.length > 1
    && totalAcceptedSimulationMs - window[0]!.acceptedSimulationDurationMs
      >= LIVE_PACING_CYCLE_MS_V1
  ) throw runtimeErrorV1("live pacing state is invalid");
}

function assertLivePacingEpochStateV1(
  state: MainWireStudioLivePacingEpochStateV1,
): void {
  if (
    (state.mode !== "realtime-1x" && state.mode !== "degraded")
    || state.cumulativeRebasedDeficitMs < 0
    || state.wallAnchorMs > state.lastDecisionWallMs
    || state.simulationAnchorSec > state.lastAcceptedSimulationSec
  ) throw runtimeErrorV1("live pacing state is invalid");
  assertFiniteLivePacingValueV1(state.wallAnchorMs);
  assertFiniteLivePacingValueV1(state.simulationAnchorSec);
  assertFiniteLivePacingValueV1(state.lastDecisionWallMs);
  assertFiniteLivePacingValueV1(state.lastAcceptedSimulationSec);
  assertFiniteLivePacingValueV1(state.cumulativeRebasedDeficitMs);
  assertLivePacingRateWindowV1(state.reportingRateWindow);
  assertLivePacingRateWindowV1(state.recoveryRateWindow);
}

/**
 * Keeps the shortest trailing chunk-aligned window that still holds one
 * complete canonical cycle. A window shorter than a cycle is retained whole.
 */
function trimmedLivePacingWindowV1(
  window: readonly MainWireStudioLivePacingRateSliceV1[],
  slice: MainWireStudioLivePacingRateSliceV1,
): readonly MainWireStudioLivePacingRateSliceV1[] {
  const next = [...window, slice];
  let { totalAcceptedSimulationMs } = livePacingWindowTotalsV1(next);
  while (
    next.length > 1
    && totalAcceptedSimulationMs - next[0]!.acceptedSimulationDurationMs
      >= LIVE_PACING_CYCLE_MS_V1
  ) {
    totalAcceptedSimulationMs -= next.shift()!.acceptedSimulationDurationMs;
  }
  return Object.freeze(next);
}

export function mainWireStudioInitialLivePacingEpochStateV1(
  input: Readonly<{
    wallNowMs: number;
    acceptedSimulationNowSec: number;
    mode: RuntimeLivePacingModeV1;
    cumulativeRebasedDeficitMs: number;
    /**
     * Carried across loop restarts within one stream epoch. Recovery evidence
     * is deliberately not carried: a resumed degraded lane has to earn 1x
     * again. A lane already at 1x keeps that mode immediately.
     */
    reportingRateWindow?: readonly MainWireStudioLivePacingRateSliceV1[];
    /**
     * Outstanding sub-cycle lag from the epoch being replaced. Restarting a
     * loop must not quietly forgive it: the new anchor is moved back by this
     * much so the deadline still owes it.
     */
    epochLagMs?: number;
  }>,
): MainWireStudioLivePacingEpochStateV1 {
  const epochLagMs = input.epochLagMs ?? 0;
  if (input.acceptedSimulationNowSec < 0 || epochLagMs < 0) {
    throw runtimeErrorV1("live pacing state is invalid");
  }
  assertFiniteLivePacingValueV1(epochLagMs);
  const state = Object.freeze({
    wallAnchorMs: input.wallNowMs - epochLagMs,
    simulationAnchorSec: input.acceptedSimulationNowSec,
    lastDecisionWallMs: input.wallNowMs,
    lastAcceptedSimulationSec: input.acceptedSimulationNowSec,
    mode: input.mode,
    cumulativeRebasedDeficitMs: input.cumulativeRebasedDeficitMs,
    reportingRateWindow: Object.freeze([...input.reportingRateWindow ?? []]),
    recoveryRateWindow: Object.freeze([]),
  }) satisfies MainWireStudioLivePacingEpochStateV1;
  assertLivePacingEpochStateV1(state);
  return state;
}

/**
 * Decides how long to wait before presenting an accepted chunk, and whether
 * the lane can still honour 1x at all.
 *
 * Lag is measured against the cumulative deadline of the current epoch, so a
 * short stall is repaid by a later fast chunk rather than accumulating. Only
 * when lag crosses a whole canonical cycle does the epoch re-anchor: the
 * accepted chunk is still published, model time is untouched, and the
 * discarded wall/model separation is reported instead of hidden.
 */
export function mainWireStudioLivePacingDecisionV1(
  input: MainWireStudioLivePacingDecisionInputV1,
): MainWireStudioLivePacingDecisionV1 {
  const { state } = input;
  assertLivePacingEpochStateV1(state);
  assertFiniteLivePacingValueV1(input.wallNowMs);
  assertFiniteLivePacingValueV1(input.acceptedSimulationNowSec);
  assertFiniteLivePacingValueV1(input.activeWallDurationMs);
  if (
    input.acceptedSimulationNowSec < 0
    || state.lastDecisionWallMs > input.wallNowMs
    || input.acceptedSimulationNowSec <= state.lastAcceptedSimulationSec
    || input.activeWallDurationMs < 0
    || input.activeWallDurationMs > input.wallNowMs - state.lastDecisionWallMs
  ) throw runtimeErrorV1("live pacing state is invalid");

  const acceptedSimulationDurationMs =
    (input.acceptedSimulationNowSec - state.lastAcceptedSimulationSec) * 1_000;
  const simulatedFromAnchorMs =
    (input.acceptedSimulationNowSec - state.simulationAnchorSec) * 1_000;
  const deadlineWallMs = state.wallAnchorMs + simulatedFromAnchorMs;
  const signedLagMs = input.wallNowMs - deadlineWallMs;
  const preRebaseLagMs = Math.max(0, signedLagMs);
  assertFiniteLivePacingValueV1(acceptedSimulationDurationMs);
  assertFiniteLivePacingValueV1(simulatedFromAnchorMs);
  assertFiniteLivePacingValueV1(deadlineWallMs);
  assertFiniteLivePacingValueV1(signedLagMs);

  const slice = Object.freeze({
    acceptedSimulationDurationMs,
    activeWallDurationMs: input.activeWallDurationMs,
  });
  // Every accepted chunk contributes to the reported rate, including one that
  // re-anchors. Only recovery evidence is reset by a re-anchor, so a lane too
  // slow to ever complete a clean cycle can still report how slow it is.
  const reportingRateWindow = trimmedLivePacingWindowV1(
    state.reportingRateWindow,
    slice,
  );
  const reporting = livePacingWindowTotalsV1(reportingRateWindow);
  assertFiniteLivePacingValueV1(reporting.totalAcceptedSimulationMs);
  assertFiniteLivePacingValueV1(reporting.totalActiveWallMs);
  const recentAchievedRate = reportingRateWindow.length > 0
      && reporting.totalActiveWallMs > 0
    ? reporting.totalAcceptedSimulationMs / reporting.totalActiveWallMs
    : null;

  if (preRebaseLagMs > MAIN_WIRE_STUDIO_MAXIMUM_LIVE_PACING_LAG_MS_V1) {
    // Both anchors move together, so the entire separation is discarded here
    // rather than the excess over the threshold.
    const cumulativeRebasedDeficitMs =
      state.cumulativeRebasedDeficitMs + preRebaseLagMs;
    assertFiniteLivePacingValueV1(cumulativeRebasedDeficitMs);
    return Object.freeze({
      delayMs: 0,
      didRebase: true,
      rebasedDeficitMs: preRebaseLagMs,
      nextState: Object.freeze({
        wallAnchorMs: input.wallNowMs,
        simulationAnchorSec: input.acceptedSimulationNowSec,
        lastDecisionWallMs: input.wallNowMs,
        lastAcceptedSimulationSec: input.acceptedSimulationNowSec,
        mode: "degraded" as const,
        cumulativeRebasedDeficitMs,
        reportingRateWindow,
        recoveryRateWindow: Object.freeze([]),
      }),
      livePacing: Object.freeze({
        mode: "degraded" as const,
        epochLagMs: 0,
        recentAchievedRate,
        cumulativeRebasedDeficitMs,
      }) satisfies RuntimeLivePacingStateV1,
    });
  }

  const recoveryRateWindow = trimmedLivePacingWindowV1(
    state.recoveryRateWindow,
    slice,
  );
  const recovery = livePacingWindowTotalsV1(recoveryRateWindow);
  assertFiniteLivePacingValueV1(recovery.totalAcceptedSimulationMs);
  assertFiniteLivePacingValueV1(recovery.totalActiveWallMs);
  // A momentarily small lag does not prove sustainable 1x, and neither does a
  // healthy reported rate. Recovery needs a whole cycle of compute that
  // actually kept up, containing no re-anchor.
  const recovered = state.mode === "degraded"
    && recovery.totalAcceptedSimulationMs >= LIVE_PACING_CYCLE_MS_V1
    && recovery.totalActiveWallMs <= recovery.totalAcceptedSimulationMs;
  const mode = recovered ? "realtime-1x" : state.mode;
  const delayMs = Math.max(0, deadlineWallMs - input.wallNowMs);
  assertFiniteLivePacingValueV1(delayMs);

  return Object.freeze({
    delayMs,
    didRebase: false,
    rebasedDeficitMs: 0,
    nextState: Object.freeze({
      ...state,
      lastDecisionWallMs: input.wallNowMs,
      lastAcceptedSimulationSec: input.acceptedSimulationNowSec,
      mode,
      reportingRateWindow,
      recoveryRateWindow,
    }),
    livePacing: Object.freeze({
      mode,
      epochLagMs: preRebaseLagMs,
      recentAchievedRate,
      cumulativeRebasedDeficitMs: state.cumulativeRebasedDeficitMs,
    }) satisfies RuntimeLivePacingStateV1,
  });
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
    || canonicalJsonStringify(terminal)
      !== canonicalJsonStringify(checkpoint.transaction)
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

function assertLiveReplayCheckpointReceiptV1(
  branch: AdapterBranchV1,
  forked: MainWireStudioHostedSessionV1,
  targetState: MainWireScientificResearchControlTargetStateV0,
  receipt: MainWireStudioCheckpointReceiptV1,
): void {
  const { session, checkpointV4 } = receipt;
  if (
    session.hostId !== branch.host.hostId
    || session.sessionId !== forked.sessionId
    || session.baseSessionInputSha256
      !== branch.resolvedSessionInput.sessionInputSha256
    || session.controlState.targetStateSha256
      !== targetState.targetStateSha256
    || session.parameterEpoch !== forked.parameterEpoch
    || session.stateIdentity.revision !== forked.stateIdentity.revision
    || !sameExactExportTimeV1(
      session.stateIdentity.acceptedTimeSec,
      forked.stateIdentity.acceptedTimeSec,
    )
    || checkpointV4.baseSessionInputSha256
      !== branch.resolvedSessionInput.sessionInputSha256
    || checkpointV4.controlTargetStateSha256
      !== targetState.targetStateSha256
    || checkpointV4.parameterEpoch !== session.parameterEpoch
    || checkpointV4.transaction.revision
      !== session.stateIdentity.revision
    || !sameExactExportTimeV1(
      checkpointV4.transaction.acceptedTimeSec,
      session.stateIdentity.acceptedTimeSec,
    )
    || !sameExecutionIdentityV1(
      mainWireStudioExecutionIdentityV1(checkpointV4),
      branch.execution,
    )
  ) throw runtimeErrorV1("live replay checkpoint receipt mismatch");
}

function assertInitialLiveReplayContinuationV1(
  origin: MainWireRetainedExactSignalReplayOriginV1,
  frame: MainWireScientificObservableFrameV1,
): void {
  if (
    origin.correlation.originKind !== "live-transition"
    || frame.source !== "accepted-step"
    || frame.revision !== origin.recipe.boundaryRevision + 1
    || !sameExactExportTimeV1(
      frame.acceptedTimeSec,
      origin.recipe.boundaryTimeSec + MAIN_WIRE_LIVE_DT_SEC_V1,
    )
  ) throw runtimeErrorV1("live replay origin does not precede first step");
}

function retainReplayOriginV1(
  branch: AdapterBranchV1,
  origin: MainWireRetainedExactSignalReplayOriginV1,
): void {
  branch.replayOrigins = nextReplayOriginsV1(
    branch.replayOrigins,
    origin,
  );
}

function nextReplayOriginsV1(
  retained: readonly MainWireRetainedExactSignalReplayOriginV1[],
  origin: MainWireRetainedExactSignalReplayOriginV1,
): readonly MainWireRetainedExactSignalReplayOriginV1[] {
  const latest = retained.at(-1);
  if (
    (
      latest !== undefined
      && (
        origin.correlation.sessionId
          !== latest.correlation.sessionId
        || origin.correlation.scenarioId
          !== latest.correlation.scenarioId
        || origin.correlation.liveBranchId
          !== latest.correlation.liveBranchId
        || origin.correlation.targetGeneration
          < latest.correlation.targetGeneration
        || origin.correlation.presentationRevision
          <= latest.correlation.presentationRevision
      )
    )
    || retained.some((candidate) =>
      candidate.correlation.presentationRevision
        === origin.correlation.presentationRevision
    )
  ) throw runtimeErrorV1("replay origin retention identity mismatch");
  const appended = [...retained, origin];
  const generations = [...new Set(appended.map((candidate) =>
    candidate.correlation.targetGeneration
  ))];
  const retainedGenerations = new Set(
    generations.slice(-RETAINED_REPLAY_ORIGIN_GENERATION_COUNT_V1),
  );
  return Object.freeze(appended.filter((candidate) =>
    retainedGenerations.has(candidate.correlation.targetGeneration)
  ));
}

function assertExactSignalExportCommandV1(
  command: ExactSignalExportCommandV1,
): void {
  const ids = [
    command.sessionId,
    command.scenarioId,
    command.liveBranchId,
  ];
  const startStepCount = Math.round(
    command.intervalStartOffsetSec / MAIN_WIRE_LIVE_DT_SEC_V1,
  );
  const intervalCount = Math.round(
    command.intervalDurationSec / MAIN_WIRE_LIVE_DT_SEC_V1,
  );
  if (
    ids.some((value) =>
      typeof value !== "string" || value.trim().length === 0
    )
    || !Number.isSafeInteger(command.targetGeneration)
    || command.targetGeneration < 0
    || !Number.isSafeInteger(command.presentationRevision)
    || command.presentationRevision < 0
    || !Number.isFinite(command.intervalStartOffsetSec)
    || command.intervalStartOffsetSec < 0
    || !Number.isFinite(command.intervalDurationSec)
    || command.intervalDurationSec <= 0
    || !Number.isSafeInteger(startStepCount)
    || !Number.isSafeInteger(intervalCount)
    || intervalCount < 1
    || startStepCount
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumStartOffsetStepCount
    || intervalCount + 1
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumSampleCount
    || 1
        + Math.ceil(
          startStepCount
            / MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumTransientStepCountPerCommand,
        )
        + Math.ceil(
          intervalCount
            / MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
              .maximumTransientStepCountPerCommand,
        )
      > EXACT_SIGNAL_EXPORT_LIMITS_V1.maximumWorkerRequestCount
    || !sameExactExportTimeV1(
      command.intervalStartOffsetSec,
      startStepCount * MAIN_WIRE_LIVE_DT_SEC_V1,
    )
    || !sameExactExportTimeV1(
      command.intervalDurationSec,
      intervalCount * MAIN_WIRE_LIVE_DT_SEC_V1,
    )
    || !Number.isFinite(
      command.intervalStartOffsetSec + command.intervalDurationSec,
    )
  ) throw runtimeErrorV1("exact export command is invalid");
}

function sameExactExportTimeV1(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right) <= 1e-11;
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
  token.artifactCommitController?.abort();
  token.artifactCommitController = null;
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

function presentationSampleFromObservableV1(
  frame: MainWireScientificObservableFrameV1,
  presentationOrdinal: number,
  previous: RuntimePresentationSampleV1 | null,
  retainedReason?: RuntimePresentationSampleV1["retentionReason"],
): RuntimePresentationSampleV1 {
  const values: Record<string, number> = {};
  for (const [observableId, observable] of Object.entries(frame.values)) {
    if (
      observable.availability === "available"
      && typeof observable.value === "number"
      && Number.isFinite(observable.value)
    ) values[observableId] = observable.value;
  }
  const phase = runtimePresentationCanonicalPhaseV1(frame.revision);
  return Object.freeze({
    coverage: RUNTIME_PRESENTATION_COVERAGE_V1,
    presentationOrdinal,
    acceptedRevision: frame.revision,
    acceptedTimeSec: frame.acceptedTimeSec,
    acceptedStepSpanFromPrevious: previous === null
      ? 0
      : frame.revision - previous.acceptedRevision,
    phase,
    values: Object.freeze(values),
    retentionReason: previous === null
      ? "stream-boundary" as const
      : retainedReason ?? (
        phase === 0
          ? "canonical-beat-boundary" as const
          : "observation-stride" as const
      ),
  });
}

function collectingMetricStateV1(
  retainedSampleCount: number,
): RuntimePresentationMetricStateV1 {
  return Object.freeze({
    status: "collecting" as const,
    retainedSampleCount,
    completedBeatCount: 0 as const,
    latestBeatEstimate: null,
  });
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

function nextSafeIntegerV1(current: number, path: string): number {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw runtimeErrorV1(`${path} is invalid`);
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw runtimeErrorV1(`${path} is exhausted`);
  }
  return current + 1;
}

/**
 * The Worker always retains a command's final accepted state. Shortening the
 * command that would cross a canonical boundary therefore makes retention
 * explicit and remains correct when the observation stride is later raised.
 */
function boundaryRetainingLiveStepCountV1(
  acceptedRevision: number,
  maximumStepCount: number,
): number {
  if (
    !Number.isSafeInteger(maximumStepCount)
    || maximumStepCount < 1
  ) throw runtimeErrorV1("live step-count boundary is invalid");
  return Math.min(
    maximumStepCount,
    runtimePresentationStepsToNextCanonicalBoundaryV1(
      acceptedRevision,
    ),
  );
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

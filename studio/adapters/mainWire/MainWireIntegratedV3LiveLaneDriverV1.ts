import {
  MAIN_WIRE_INTEGRATED_LANE_EXPLORATORY_PROTOCOL_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import {
  createIntegratedV3LaneDescriptorV1,
  INTEGRATED_V3_LANE_KIND_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_HOST_V1_ID,
  MainWireIntegratedScientificBrowserHostV1Impl,
  type MainWireIntegratedBrowserAdvanceReceiptV1,
  type MainWireIntegratedBrowserHostedSessionV1,
  type MainWireIntegratedScientificBrowserHostV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1";
import {
  mainWireStudioInitialLivePacingEpochStateV1,
  mainWireStudioLivePacingDecisionV1,
  type MainWireStudioLivePacingDecisionV1,
  type MainWireStudioLivePacingEpochStateV1,
} from "@/studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1";
import {
  STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
  STUDIO_LIVE_LANE_SIGNAL_CHANNEL_PROTOCOL_V1,
  type OpenStudioIntegratedV3LiveLaneCommandV1,
  type StudioIntegratedV3LiveLaneDriverV1,
  type StudioIntegratedV3LiveLaneOpenedV1,
  type StudioIntegratedV3PresentationSampleV1,
  type StudioIntegratedV3PresentationSignalEventV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";
import type {
  RuntimeExecutionIdentityV1,
} from "@/studio/contracts/v1/artifacts";
import type {
  RuntimePresentationSignalSubscriptionV1,
} from "@/studio/contracts/v1/ports";
import type {
  RuntimeLivePacingStateV1,
  RuntimePresentationSignalChannelRefV1,
  RuntimePresentationSignalFailureV1,
} from "@/studio/contracts/v1/runtime";

/**
 * Measured in step 6: one request per 2 ms ordinal gives 150 simulated seconds
 * before rotation and a 25,000-request margin below the audited Worker cap.
 *
 * Provisional: structured-clone cost, long-session memory growth, browser
 * rotation latency, and user-visible interruption remain unmeasured.
 */
export const MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_POLICY_V1 =
  Object.freeze({
    requestCount: 75_000 as const,
    status: "provisional" as const,
    auditedWorkerLifetimeRequestCount: 100_000 as const,
    unmeasured: Object.freeze([
      "structured-clone-cost",
      "long-session-memory-growth",
      "browser-rotation-latency",
      "user-visible-interruption",
    ] as const),
  });
export const MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_REQUEST_COUNT_V1 =
  MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_POLICY_V1.requestCount;

/**
 * A partially accepted event-boundary interval may be retried at the same
 * presentation ordinal once. A repeated deterministic failure then closes the
 * stream instead of spinning.
 */
export const MAIN_WIRE_INTEGRATED_V3_ADVANCE_MAXIMUM_ATTEMPT_COUNT_V1 =
  2 as const;

export const MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1 =
  createIntegratedV3LaneDescriptorV1(
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef,
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
      .observableCatalogSha256,
  );

export const MAIN_WIRE_INTEGRATED_V3_EXECUTION_IDENTITY_V1 = Object.freeze({
  modelRef:
    `${MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef.id}@${MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef.version}:sha256:${MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef.sha256}`,
  runtimeRef: `${MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_HOST_V1_ID}@1`,
  solverRef: `${MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID}@3`,
  stateCodecRef: `${MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID}@1`,
  protocolRef: `${MAIN_WIRE_INTEGRATED_LANE_EXPLORATORY_PROTOCOL_V1_ID}@1`,
} satisfies RuntimeExecutionIdentityV1);

export type MainWireIntegratedV3LiveLaneHostFactoryV1 =
  () => MainWireIntegratedScientificBrowserHostV1;

export type MainWireIntegratedV3LiveLaneDriverOptionsV1 = Readonly<{
  hostFactory?: MainWireIntegratedV3LiveLaneHostFactoryV1;
  nowMs?: () => number;
  delayMs?: (durationMs: number) => Promise<void>;
}>;

type IntegratedBranchV1 = {
  readonly scenarioId: string;
  readonly liveBranchId: string;
  readonly channel: RuntimePresentationSignalChannelRefV1;
  host: MainWireIntegratedScientificBrowserHostV1;
  hostedSession: MainWireIntegratedBrowserHostedSessionV1;
  readonly observers:
    Set<(event: StudioIntegratedV3PresentationSignalEventV1) => void>;
  presentationOrdinal: number;
  pacingEpoch: MainWireStudioLivePacingEpochStateV1;
  loopPromise: Promise<void> | null;
  closed: boolean;
  failure: Error | null;
};

type IntegratedSessionV1 = {
  readonly sessionId: string;
  readonly branches: Map<string, IntegratedBranchV1>;
  closed: boolean;
};

type IntegratedAdvanceOutcomeV1 =
  | Readonly<{
      status: "advanced";
      receipt: Extract<
        MainWireIntegratedBrowserAdvanceReceiptV1,
        { status: "advanced" | "already-at-target" }
      >;
      acceptedRevisionSpanFromPrevious: number;
      internalAcceptedSubstepCount: number;
      boundaryClippedSubstepCount: number;
    }>
  | Readonly<{
      status: "failed";
      receipt: Extract<
        MainWireIntegratedBrowserAdvanceReceiptV1,
        { status: "failed" }
      >;
    }>;

export class MainWireIntegratedV3LiveLaneDriverErrorV1 extends Error {
  constructor(message: string) {
    super(`integrated V3 Studio live lane failed: ${message}`);
    this.name = "MainWireIntegratedV3LiveLaneDriverErrorV1";
  }
}

/**
 * Stream driver for the fixed V3 preset. Ordinal advancement, observation,
 * retry and operational checkpoint rotation are deliberately private here.
 */
export class MainWireIntegratedV3LiveLaneDriverV1
implements StudioIntegratedV3LiveLaneDriverV1 {
  readonly laneKind = INTEGRATED_V3_LANE_KIND_V1;
  readonly laneDescriptor = MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1;
  readonly executionIdentity =
    MAIN_WIRE_INTEGRATED_V3_EXECUTION_IDENTITY_V1;

  private readonly hostFactory:
    MainWireIntegratedV3LiveLaneHostFactoryV1;
  private readonly nowMs: () => number;
  private readonly delayMs: (durationMs: number) => Promise<void>;
  private readonly sessions = new Map<string, IntegratedSessionV1>();
  private readonly openingSessionIds = new Set<string>();
  private readonly branchesByChannelId =
    new Map<string, IntegratedBranchV1>();
  private identityOrdinal = 0;

  constructor(options: MainWireIntegratedV3LiveLaneDriverOptionsV1 = {}) {
    this.hostFactory = options.hostFactory
      ?? (() => new MainWireIntegratedScientificBrowserHostV1Impl());
    this.nowMs = options.nowMs ?? monotonicNowMsV1;
    this.delayMs = options.delayMs ?? delayMsV1;
  }

  async openSession(
    command: OpenStudioIntegratedV3LiveLaneCommandV1,
  ): Promise<StudioIntegratedV3LiveLaneOpenedV1> {
    assertOpenCommandV1(command);
    if (
      this.sessions.has(command.sessionId)
      || this.openingSessionIds.has(command.sessionId)
    ) {
      throw laneErrorV1(`session ${command.sessionId} already exists`);
    }
    this.openingSessionIds.add(command.sessionId);

    const allocated: Array<Readonly<{
      host: MainWireIntegratedScientificBrowserHostV1;
      hostedSession: MainWireIntegratedBrowserHostedSessionV1 | null;
    }>> = [];
    const branches = new Map<string, IntegratedBranchV1>();
    try {
      for (const source of command.branches) {
        const host = this.hostFactory();
        allocated.push({ host, hostedSession: null });
        const hostedSession = await host.createWorkerOwnedPreset(
          this.nextIdentityV1(`${command.sessionId}:open`),
        );
        allocated[allocated.length - 1] = { host, hostedSession };
        this.assertHostedSessionV1(hostedSession);
        const liveBranchId =
          this.nextIdentityV1(`${command.sessionId}:branch`);
        const channel = Object.freeze({
          protocolId: STUDIO_LIVE_LANE_SIGNAL_CHANNEL_PROTOCOL_V1,
          channelId:
            this.nextIdentityV1(`${command.sessionId}:signal`),
          sessionId: command.sessionId,
          scenarioId: source.scenarioId,
          liveBranchId,
        }) satisfies RuntimePresentationSignalChannelRefV1;
        const pacingEpoch = mainWireStudioInitialLivePacingEpochStateV1({
          wallNowMs: this.nowMs(),
          acceptedSimulationNowSec: hostedSession.acceptedTimeSec,
          mode: "degraded",
          cumulativeRebasedDeficitMs: 0,
        });
        const branch: IntegratedBranchV1 = {
          scenarioId: source.scenarioId,
          liveBranchId,
          channel,
          host,
          hostedSession,
          observers: new Set(),
          presentationOrdinal: hostedSession.presentationOrdinal!,
          pacingEpoch,
          loopPromise: null,
          closed: false,
          failure: null,
        };
        branches.set(source.scenarioId, branch);
      }

      const session: IntegratedSessionV1 = {
        sessionId: command.sessionId,
        branches,
        closed: false,
      };
      this.sessions.set(command.sessionId, session);
      for (const branch of branches.values()) {
        this.branchesByChannelId.set(branch.channel.channelId, branch);
      }
      return Object.freeze({
        laneKind: this.laneKind,
        laneDescriptor: this.laneDescriptor,
        executionIdentity: this.executionIdentity,
        sessionId: command.sessionId,
        branches: Object.freeze(
          [...branches.values()].map((branch) =>
            this.openedBranchV1(branch)),
        ),
      });
    } catch (error) {
      for (const entry of allocated) {
        if (entry.hostedSession !== null) {
          try {
            await entry.host.dispose(entry.hostedSession);
          } catch {
            // Preserve the opening error; termination retires this host.
          }
        }
        try {
          entry.host.terminate();
        } catch {
          // Preserve the opening error.
        }
      }
      throw laneErrorV1(errorMessageV1(error));
    } finally {
      this.openingSessionIds.delete(command.sessionId);
    }
  }

  subscribePresentationSignalChannel(
    channel: RuntimePresentationSignalChannelRefV1,
    observer: (
      event: StudioIntegratedV3PresentationSignalEventV1,
    ) => void,
  ): RuntimePresentationSignalSubscriptionV1 {
    const branch = this.requiredBranchV1(channel);
    if (branch.failure !== null) throw branch.failure;
    branch.observers.add(observer);
    this.startLoopV1(branch);
    let subscribed = true;
    return Object.freeze({
      unsubscribe: () => {
        if (!subscribed) return;
        subscribed = false;
        branch.observers.delete(observer);
      },
    });
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session === undefined) return;
    session.closed = true;
    this.sessions.delete(sessionId);
    for (const branch of session.branches.values()) {
      branch.closed = true;
      this.branchesByChannelId.delete(branch.channel.channelId);
    }
    await Promise.all(
      [...session.branches.values()].map(async (branch) => {
        if (branch.loopPromise !== null) await branch.loopPromise;
      }),
    );

    let firstError: unknown;
    for (const branch of session.branches.values()) {
      branch.observers.clear();
      try {
        await branch.host.dispose(branch.hostedSession);
      } catch (error) {
        firstError ??= error;
      } finally {
        try {
          branch.host.terminate();
        } catch (error) {
          firstError ??= error;
        }
      }
    }
    if (firstError !== undefined) {
      throw laneErrorV1(errorMessageV1(firstError));
    }
  }

  private openedBranchV1(
    branch: IntegratedBranchV1,
  ) {
    const initialPacing = Object.freeze({
      mode: "degraded" as const,
      epochLagMs: 0,
      recentAchievedRate: null,
      cumulativeRebasedDeficitMs: 0,
    }) satisfies RuntimeLivePacingStateV1;
    const initialSample = this.presentationSampleV1(
      branch.hostedSession,
      branch.presentationOrdinal,
      0,
      0,
      0,
    );
    return Object.freeze({
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      presentationSignalChannelRef: branch.channel,
      streamEpoch: 0 as const,
      execution: this.executionIdentity,
      initialPresentation: Object.freeze({
        sample: initialSample,
        livePacing: initialPacing,
        metricState: null,
      }),
    });
  }

  private startLoopV1(branch: IntegratedBranchV1): void {
    if (
      branch.closed
      || branch.failure !== null
      || branch.observers.size === 0
      || branch.loopPromise !== null
    ) return;
    branch.loopPromise = this.runLoopV1(branch).finally(() => {
      branch.loopPromise = null;
      if (
        !branch.closed
        && branch.failure === null
        && branch.observers.size > 0
      ) this.startLoopV1(branch);
    });
  }

  private async runLoopV1(branch: IntegratedBranchV1): Promise<void> {
    try {
      while (
        !branch.closed
        && branch.failure === null
        && branch.observers.size > 0
      ) {
        const presentationOrdinal = branch.presentationOrdinal + 1;
        const previousAcceptedRevision =
          branch.hostedSession.acceptedRevision;
        const activeStartedWallMs = this.nowMs();
        await this.rotateHostIfRequiredV1(branch);
        if (branch.closed) return;
        const outcome = await this.advanceWithRetryV1(
          branch,
          presentationOrdinal,
          previousAcceptedRevision,
        );
        const activeWallDurationMs =
          this.nowMs() - activeStartedWallMs;
        if (branch.closed) return;
        if (outcome.status === "failed") {
          const { receipt } = outcome;
          this.failBranchV1(
            branch,
            `presentation ordinal ${presentationOrdinal} failed after ${receipt.internalAcceptedSubstepCount} accepted substeps: ${receipt.failureReason}: ${receipt.message}`,
          );
          return;
        }
        const { receipt } = outcome;
        if (receipt.status !== "advanced") {
          throw laneErrorV1(
            "next presentation ordinal was already accepted",
          );
        }
        this.assertAdvanceReceiptV1(
          receipt,
          presentationOrdinal,
          previousAcceptedRevision,
          outcome.acceptedRevisionSpanFromPrevious,
          outcome.internalAcceptedSubstepCount,
          outcome.boundaryClippedSubstepCount,
        );

        const pacingDecision = await this.settlePacingV1(
          branch,
          receipt.session.acceptedTimeSec,
          activeWallDurationMs,
        );
        if (branch.closed || pacingDecision === null) return;
        branch.pacingEpoch = pacingDecision.nextState;
        branch.presentationOrdinal = presentationOrdinal;
        const sample = this.presentationSampleV1(
          receipt.session,
          presentationOrdinal,
          outcome.acceptedRevisionSpanFromPrevious,
          outcome.internalAcceptedSubstepCount,
          outcome.boundaryClippedSubstepCount,
        );
        this.emitV1(branch, Object.freeze({
          kind: "samples" as const,
          channelId: branch.channel.channelId,
          sessionId: branch.channel.sessionId,
          scenarioId: branch.scenarioId,
          liveBranchId: branch.liveBranchId,
          targetGeneration: 0 as const,
          presentationRevision: 0 as const,
          streamEpoch: 0 as const,
          samples: Object.freeze([sample]),
          metricState: null,
          livePacing: pacingDecision.livePacing,
        }));
      }
    } catch (error) {
      if (!branch.closed) {
        this.failBranchV1(branch, errorMessageV1(error));
      }
    }
  }

  private async advanceWithRetryV1(
    branch: IntegratedBranchV1,
    presentationOrdinal: number,
    previousAcceptedRevision: number,
  ): Promise<IntegratedAdvanceOutcomeV1> {
    let receipt: MainWireIntegratedBrowserAdvanceReceiptV1 | null = null;
    let partialAcceptedSubstepCount = 0;
    for (
      let attempt = 1;
      attempt <=
        MAIN_WIRE_INTEGRATED_V3_ADVANCE_MAXIMUM_ATTEMPT_COUNT_V1;
      attempt += 1
    ) {
      receipt = await branch.host.advanceToPresentationOrdinal(
        branch.hostedSession,
        presentationOrdinal,
      );
      branch.hostedSession = receipt.session;
      if (receipt.status !== "failed") {
        return Object.freeze({
          status: "advanced" as const,
          receipt,
          acceptedRevisionSpanFromPrevious:
            receipt.session.acceptedRevision - previousAcceptedRevision,
          internalAcceptedSubstepCount:
            partialAcceptedSubstepCount
            + receipt.internalAcceptedSubstepCount,
          boundaryClippedSubstepCount:
            partialAcceptedSubstepCount
            + receipt.boundaryClippedSubstepCount,
        });
      }
      partialAcceptedSubstepCount +=
        receipt.internalAcceptedSubstepCount;
      if (!receipt.partiallyAdvanced) {
        return Object.freeze({ status: "failed" as const, receipt });
      }
    }
    return Object.freeze({
      status: "failed" as const,
      receipt: receipt as Extract<
        MainWireIntegratedBrowserAdvanceReceiptV1,
        { status: "failed" }
      >,
    });
  }

  private async settlePacingV1(
    branch: IntegratedBranchV1,
    acceptedSimulationNowSec: number,
    activeWallDurationMs: number,
  ): Promise<MainWireStudioLivePacingDecisionV1 | null> {
    let decision = mainWireStudioLivePacingDecisionV1({
      state: branch.pacingEpoch,
      wallNowMs: this.nowMs(),
      acceptedSimulationNowSec,
      activeWallDurationMs,
    });
    while (decision.delayMs > 0) {
      const waitStartedWallMs = this.nowMs();
      await this.delayMs(decision.delayMs);
      if (branch.closed) return null;
      const wallNowMs = this.nowMs();
      if (wallNowMs <= waitStartedWallMs) break;
      decision = mainWireStudioLivePacingDecisionV1({
        state: branch.pacingEpoch,
        wallNowMs,
        acceptedSimulationNowSec,
        activeWallDurationMs,
      });
    }
    return decision;
  }

  private async rotateHostIfRequiredV1(
    branch: IntegratedBranchV1,
  ): Promise<void> {
    if (
      branch.host.requestCount
        < MAIN_WIRE_INTEGRATED_V3_LIVE_HOST_ROTATION_REQUEST_COUNT_V1
    ) return;
    const oldHost = branch.host;
    const checkpointReceipt =
      await oldHost.getOperationalCheckpoint(branch.hostedSession);
    branch.hostedSession = checkpointReceipt.session;
    if (branch.closed) return;

    const newHost = this.hostFactory();
    try {
      const restored = await newHost.restoreOperationalCheckpoint({
        sessionId: this.nextIdentityV1("rotated"),
        checkpoint: checkpointReceipt.checkpoint,
      });
      this.assertRotationReceiptV1(
        checkpointReceipt.session,
        restored,
      );
      if (branch.closed || branch.host !== oldHost) {
        try {
          await newHost.dispose(restored);
        } finally {
          newHost.terminate();
        }
        return;
      }
      branch.host = newHost;
      branch.hostedSession = restored;
      try {
        oldHost.terminate();
      } catch {
        // The accepted pointer already owns newHost.
      }
    } catch (error) {
      try {
        newHost.terminate();
      } catch {
        // Preserve the exact-checkpoint rotation failure.
      }
      throw error;
    }
  }

  private assertHostedSessionV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): void {
    this.assertLaneDescriptorV1(session);
    if (
      session.presentationOrdinal !== 0
      || session.acceptedRevision !== 0
      || session.acceptedTimeSec !== 0
    ) throw laneErrorV1("cold Worker preset did not open at ordinal zero");
  }

  private assertLaneDescriptorV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): void {
    const descriptor = session.laneDescriptor;
    if (
      descriptor.laneKind !== this.laneDescriptor.laneKind
      || descriptor.laneId !== this.laneDescriptor.laneId
      || descriptor.releaseRef.id !== this.laneDescriptor.releaseRef.id
      || descriptor.releaseRef.version
        !== this.laneDescriptor.releaseRef.version
      || descriptor.releaseRef.sha256
        !== this.laneDescriptor.releaseRef.sha256
      || descriptor.observableCatalogId
        !== this.laneDescriptor.observableCatalogId
      || descriptor.observableCatalogSha256
        !== this.laneDescriptor.observableCatalogSha256
      || descriptor.lifecycleStatus
        !== this.laneDescriptor.lifecycleStatus
      || descriptor.evidenceStatus
        !== this.laneDescriptor.evidenceStatus
      || JSON.stringify(descriptor.capabilities)
        !== JSON.stringify(this.laneDescriptor.capabilities)
      || JSON.stringify(descriptor.limitations)
        !== JSON.stringify(this.laneDescriptor.limitations)
    ) throw laneErrorV1("Worker lane descriptor identity mismatch");
  }

  private assertAdvanceReceiptV1(
    receipt: Extract<
      MainWireIntegratedBrowserAdvanceReceiptV1,
      { status: "advanced" | "already-at-target" }
    >,
    presentationOrdinal: number,
    previousAcceptedRevision: number,
    acceptedRevisionSpanFromPrevious: number,
    internalAcceptedSubstepCount: number,
    boundaryClippedSubstepCount: number,
  ): void {
    this.assertLaneDescriptorV1(receipt.session);
    if (
      receipt.status !== "advanced"
      || receipt.emittedPresentationSample !== true
      || receipt.presentationOrdinal !== presentationOrdinal
      || receipt.session.presentationOrdinal !== presentationOrdinal
      || receipt.presentationTimeSec
        !== presentationOrdinal
          * MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1
            .presentationDtSec
      || receipt.presentationTimeSec !== receipt.session.acceptedTimeSec
      || receipt.session.acceptedRevision
        - previousAcceptedRevision
          !== acceptedRevisionSpanFromPrevious
      || acceptedRevisionSpanFromPrevious < 1
      || internalAcceptedSubstepCount < 1
      || internalAcceptedSubstepCount
        !== acceptedRevisionSpanFromPrevious
      || boundaryClippedSubstepCount < 0
      || boundaryClippedSubstepCount
        >= internalAcceptedSubstepCount
    ) throw laneErrorV1("presentation advance receipt mismatch");
  }

  private assertRotationReceiptV1(
    checkpointed: MainWireIntegratedBrowserHostedSessionV1,
    restored: MainWireIntegratedBrowserHostedSessionV1,
  ): void {
    this.assertLaneDescriptorV1(restored);
    if (
      restored.presentationOrdinal !== checkpointed.presentationOrdinal
      || restored.acceptedRevision !== checkpointed.acceptedRevision
      || restored.acceptedTimeSec !== checkpointed.acceptedTimeSec
      || JSON.stringify(restored.observableFrame)
        !== JSON.stringify(checkpointed.observableFrame)
    ) throw laneErrorV1("operational rotation receipt mismatch");
  }

  private presentationSampleV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
    presentationOrdinal: number,
    acceptedRevisionSpanFromPrevious: number,
    internalAcceptedSubstepCount: number,
    boundaryClippedSubstepCount: number,
  ): StudioIntegratedV3PresentationSampleV1 {
    return Object.freeze({
      coverage: STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
      presentationOrdinal,
      presentationTimeSec: session.acceptedTimeSec,
      acceptedRevision: session.acceptedRevision,
      acceptedTimeSec: session.acceptedTimeSec,
      acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount,
      boundaryClippedSubstepCount,
      observableFrame: session.observableFrame,
    });
  }

  private emitV1(
    branch: IntegratedBranchV1,
    event: StudioIntegratedV3PresentationSignalEventV1,
  ): void {
    let firstObserverError: unknown;
    for (const observer of [...branch.observers]) {
      try {
        observer(event);
      } catch (error) {
        firstObserverError ??= error;
      }
    }
    if (firstObserverError !== undefined && event.kind !== "failure") {
      this.failBranchV1(
        branch,
        `live signal observer callback failed: ${errorMessageV1(firstObserverError)}`,
      );
    }
  }

  private failBranchV1(branch: IntegratedBranchV1, message: string): void {
    if (branch.failure !== null || branch.closed) return;
    branch.failure = laneErrorV1(message);
    this.emitV1(branch, Object.freeze({
      kind: "failure" as const,
      channelId: branch.channel.channelId,
      sessionId: branch.channel.sessionId,
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      targetGeneration: 0,
      presentationRevision: 0,
      streamEpoch: 0,
      message: branch.failure.message,
    }) satisfies RuntimePresentationSignalFailureV1);
  }

  private requiredBranchV1(
    channel: RuntimePresentationSignalChannelRefV1,
  ): IntegratedBranchV1 {
    const branch = this.branchesByChannelId.get(channel.channelId);
    if (
      branch === undefined
      || branch.closed
      || channel.protocolId
        !== STUDIO_LIVE_LANE_SIGNAL_CHANNEL_PROTOCOL_V1
      || channel.sessionId !== branch.channel.sessionId
      || channel.scenarioId !== branch.scenarioId
      || channel.liveBranchId !== branch.liveBranchId
    ) throw laneErrorV1("presentation signal channel identity mismatch");
    return branch;
  }

  private nextIdentityV1(prefix: string): string {
    if (this.identityOrdinal === Number.MAX_SAFE_INTEGER) {
      throw laneErrorV1("internal identity space exhausted");
    }
    this.identityOrdinal += 1;
    return `${prefix}:${this.identityOrdinal}`;
  }
}

function assertOpenCommandV1(
  command: OpenStudioIntegratedV3LiveLaneCommandV1,
): void {
  if (
    command.laneKind !== INTEGRATED_V3_LANE_KIND_V1
    || typeof command.sessionId !== "string"
    || command.sessionId.trim() === ""
    || !Array.isArray(command.branches)
    || command.branches.length === 0
  ) throw laneErrorV1("open command is invalid");
  const scenarioIds = new Set<string>();
  for (const branch of command.branches) {
    if (
      typeof branch.scenarioId !== "string"
      || branch.scenarioId.trim() === ""
      || scenarioIds.has(branch.scenarioId)
    ) throw laneErrorV1("open command scenario identity is invalid");
    scenarioIds.add(branch.scenarioId);
  }
}

function laneErrorV1(
  message: string,
): MainWireIntegratedV3LiveLaneDriverErrorV1 {
  return new MainWireIntegratedV3LiveLaneDriverErrorV1(message);
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function monotonicNowMsV1(): number {
  if (
    typeof globalThis.performance === "object"
    && typeof globalThis.performance.now === "function"
  ) return globalThis.performance.now();
  return Date.now();
}

function delayMsV1(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, durationMs));
  });
}

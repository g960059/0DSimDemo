import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import type {
  StudioLaneDescriptorV1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import type {
  MainWireIntegratedLaneObservableFrameV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import type {
  MainWireIntegratedLaneSubstepRecordV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
  type MainWireIntegratedScientificWorkerAdvanceBatchPartialProgressV1,
  type MainWireIntegratedScientificWorkerAdvancePayloadV1,
  type MainWireIntegratedScientificWorkerAdvancePartialProgressV1,
  type MainWireIntegratedScientificWorkerCommandV1,
  type MainWireIntegratedScientificWorkerErrorResponseV1,
  type MainWireIntegratedScientificWorkerResponseV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MainWireIntegratedScientificWorkerClientV1,
  createDefaultMainWireIntegratedScientificWorkerV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificWorkerClientV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedScientificBrowserRuntimeLimitsV1";
import type {
  MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";

export const MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_HOST_V1_ID =
  "main-wire-integrated-scientific-browser-host-v1" as const;

export type MainWireIntegratedBrowserHostedSessionV1 = Readonly<{
  hostId: string;
  sessionId: string;
  laneDescriptor: StudioLaneDescriptorV1;
  presentationOrdinal: number | null;
  acceptedRevision: number;
  acceptedTimeSec: number;
  observableFrame: MainWireIntegratedLaneObservableFrameV1;
}>;

export type MainWireIntegratedBrowserAdvanceReceiptV1 =
  | Readonly<{
    status: "advanced" | "already-at-target";
    session: MainWireIntegratedBrowserHostedSessionV1;
    presentationOrdinal: number;
    presentationTimeSec: number;
    acceptedRevisionSpanFromPrevious: number;
    internalAcceptedSubstepCount: number;
    boundaryClippedSubstepCount: number;
    substeps: readonly MainWireIntegratedLaneSubstepRecordV1[];
    emittedPresentationSample: boolean;
    observableFrame: MainWireIntegratedLaneObservableFrameV1;
  }>
  | Readonly<{
    status: "failed";
    session: MainWireIntegratedBrowserHostedSessionV1;
    requestedPresentationOrdinal: number;
    requestedPresentationTimeSec: number;
    partiallyAdvanced: boolean;
    internalAcceptedSubstepCount: number;
    emittedPresentationSample: false;
    observableFrame: null;
    failureReason: string;
    message: string;
  }>;

type MainWireIntegratedBrowserSuccessfulAdvanceReceiptV1 = Extract<
  MainWireIntegratedBrowserAdvanceReceiptV1,
  { status: "advanced" | "already-at-target" }
>;

export type MainWireIntegratedBrowserAdvanceBatchReceiptV1 =
  | Readonly<{
    status: "advanced";
    session: MainWireIntegratedBrowserHostedSessionV1;
    firstPresentationOrdinal: number;
    lastPresentationOrdinal: number;
    requestedPresentationOrdinalCount: number;
    advances:
      readonly MainWireIntegratedBrowserSuccessfulAdvanceReceiptV1[];
  }>
  | Readonly<{
    status: "failed";
    session: MainWireIntegratedBrowserHostedSessionV1;
    firstPresentationOrdinal: number;
    requestedPresentationOrdinalCount: number;
    completedAdvances:
      readonly MainWireIntegratedBrowserSuccessfulAdvanceReceiptV1[];
    failedPresentationOrdinal: number;
    failedPresentationTimeSec: number;
    failedOrdinalPartiallyAdvanced: boolean;
    failedOrdinalInternalAcceptedSubstepCount: number;
    failedOrdinalBoundaryClippedSubstepCount: number;
    failedOrdinalSubsteps:
      readonly MainWireIntegratedLaneSubstepRecordV1[];
    failureReason: string;
    message: string;
  }>;

export type MainWireIntegratedBrowserCheckpointReceiptV1 = Readonly<{
  session: MainWireIntegratedBrowserHostedSessionV1;
  checkpoint: MainWireIntegratedModelCheckpointV3;
}>;

/**
 * V3-only live host. Every method is supported by the protocol; controls,
 * settlement, persistence, export, promotion and analyses are absent.
 */
export interface MainWireIntegratedScientificBrowserHostV1 {
  readonly hostId: string;
  readonly requestCount: number;

  createWorkerOwnedPreset(
    sessionId: string,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1>;

  observe(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1>;

  advanceToPresentationOrdinal(
    session: MainWireIntegratedBrowserHostedSessionV1,
    presentationOrdinal: number,
  ): Promise<MainWireIntegratedBrowserAdvanceReceiptV1>;

  advanceConsecutivePresentationOrdinals?(
    session: MainWireIntegratedBrowserHostedSessionV1,
    firstPresentationOrdinal: number,
    presentationOrdinalCount: number,
  ): Promise<MainWireIntegratedBrowserAdvanceBatchReceiptV1>;

  getOperationalCheckpoint(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<MainWireIntegratedBrowserCheckpointReceiptV1>;

  restoreOperationalCheckpoint(input: Readonly<{
    sessionId: string;
    checkpoint: unknown;
  }>): Promise<MainWireIntegratedBrowserHostedSessionV1>;

  dispose(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<void>;

  terminate(): void;
}

type BrowserClient = Pick<
  MainWireIntegratedScientificWorkerClientV1,
  "request" | "requestCount" | "terminate"
>;

export type MainWireIntegratedScientificBrowserHostOptionsV1 =
  Readonly<{
    hostId?: string;
    integrityTier?: HotPathIntegrityTierV1;
    client?: BrowserClient;
    clientFactory?: (integrityTier: HotPathIntegrityTierV1) => BrowserClient;
  }>;

export class MainWireIntegratedScientificBrowserHostErrorV1 extends Error {
  readonly code:
    | "host-contract-mismatch"
    | "scientific-command-rejected";
  readonly scientificError:
    MainWireIntegratedScientificWorkerErrorResponseV1 | null;

  constructor(
    code:
      | "host-contract-mismatch"
      | "scientific-command-rejected",
    message: string,
    scientificError:
      MainWireIntegratedScientificWorkerErrorResponseV1 | null = null,
  ) {
    super(`integrated browser host rejected: ${message}`);
    this.name = "MainWireIntegratedScientificBrowserHostErrorV1";
    this.code = code;
    this.scientificError = scientificError;
  }
}

let nextHostOrdinalV1 = 0;

export class MainWireIntegratedScientificBrowserHostV1Impl
implements MainWireIntegratedScientificBrowserHostV1 {
  readonly hostId: string;
  private readonly client: BrowserClient;
  private readonly sessions =
    new Map<string, MainWireIntegratedBrowserHostedSessionV1>();
  private requestOrdinal = 0;
  private terminated = false;

  constructor(
    options: MainWireIntegratedScientificBrowserHostOptionsV1 = {},
  ) {
    nextHostOrdinalV1 += 1;
    this.hostId = options.hostId
      ?? `main-wire-integrated-live-worker-${nextHostOrdinalV1}`;
    if (options.client !== undefined && options.clientFactory !== undefined) {
      throw hostErrorV1("provide either client or clientFactory, not both");
    }
    const integrityTier = options.integrityTier ?? "hot-path-lean";
    this.client = options.client
      ?? (options.clientFactory ?? createIntegratedBrowserClientV1)(
        integrityTier,
      );
  }

  get requestCount(): number {
    return this.client.requestCount;
  }

  async createWorkerOwnedPreset(
    sessionId: string,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.assertCanAllocateV1(sessionId);
    const response = await this.successfulRequestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "createWorkerOwnedPresetSession",
      requestId: this.nextRequestIdV1("create"),
      sessionId,
    });
    if (
      response.commandKind !== "createWorkerOwnedPresetSession"
      || response.payload.kind
        !== "worker-owned-preset-session-created"
    ) throw hostErrorV1("create receipt mismatch");
    return this.installSessionV1(
      sessionId,
      response.laneDescriptor,
      response.payload.session,
    );
  }

  async observe(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.assertCurrentSessionV1(session);
    const response = await this.successfulRequestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "observe",
      requestId: this.nextRequestIdV1("observe"),
      sessionId: session.sessionId,
    });
    if (
      response.commandKind !== "observe"
      || response.payload.kind !== "observation"
    ) throw hostErrorV1("observe receipt mismatch");
    this.assertSameLaneV1(session, response.laneDescriptor);
    return this.installSessionV1(
      session.sessionId,
      response.laneDescriptor,
      response.payload.session,
    );
  }

  async advanceToPresentationOrdinal(
    session: MainWireIntegratedBrowserHostedSessionV1,
    presentationOrdinal: number,
  ): Promise<MainWireIntegratedBrowserAdvanceReceiptV1> {
    this.assertCurrentSessionV1(session);
    const response = await this.requestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "advanceToPresentationOrdinal",
      requestId: this.nextRequestIdV1("advance"),
      sessionId: session.sessionId,
      presentationOrdinal,
    });
    if (response.ok === false) {
      const progress = response.error.partialProgress;
      if (
        response.error.code !== "simulation-step-failed"
        || progress === null
        || progress.kind !== "presentation-advance-partial-progress"
      ) throw commandErrorV1(response);
      this.assertSameLaneV1(session, response.laneDescriptor);
      return this.failedAdvanceV1(session, response, progress);
    }
    if (
      response.commandKind !== "advanceToPresentationOrdinal"
      || response.payload.kind !== "presentation-advance"
      || response.payload.presentationOrdinal !== presentationOrdinal
    ) throw hostErrorV1("presentation advance receipt mismatch");
    this.assertSameLaneV1(session, response.laneDescriptor);
    const updated = Object.freeze({
      hostId: this.hostId,
      sessionId: session.sessionId,
      laneDescriptor: response.laneDescriptor,
      presentationOrdinal: response.payload.presentationOrdinal,
      acceptedRevision: response.payload.acceptedRevision,
      acceptedTimeSec: response.payload.acceptedTimeSec,
      observableFrame: response.payload.observableFrame,
    });
    this.sessions.set(session.sessionId, updated);
    return Object.freeze({
      status: response.payload.status,
      session: updated,
      presentationOrdinal: response.payload.presentationOrdinal,
      presentationTimeSec: response.payload.presentationTimeSec,
      acceptedRevisionSpanFromPrevious:
        response.payload.acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount:
        response.payload.internalAcceptedSubstepCount,
      boundaryClippedSubstepCount:
        response.payload.boundaryClippedSubstepCount,
      substeps: response.payload.substeps,
      emittedPresentationSample:
        response.payload.emittedPresentationSample,
      observableFrame: response.payload.observableFrame,
    });
  }

  async advanceConsecutivePresentationOrdinals(
    session: MainWireIntegratedBrowserHostedSessionV1,
    firstPresentationOrdinal: number,
    presentationOrdinalCount: number,
  ): Promise<MainWireIntegratedBrowserAdvanceBatchReceiptV1> {
    this.assertCurrentSessionV1(session);
    if (
      !Number.isSafeInteger(presentationOrdinalCount)
      || presentationOrdinalCount < 1
      || presentationOrdinalCount
        > MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
          .maximumPresentationOrdinalCountPerAdvanceCommand
    ) throw hostErrorV1("presentation advance batch count is invalid");
    const response = await this.requestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "advanceToPresentationOrdinal",
      requestId: this.nextRequestIdV1("advance-batch"),
      sessionId: session.sessionId,
      presentationOrdinal: firstPresentationOrdinal,
      presentationOrdinalCount,
    });
    if (response.ok === false) {
      const progress = response.error.partialProgress;
      if (
        response.error.code !== "simulation-step-failed"
        || progress === null
        || progress.kind
          !== "presentation-advance-batch-partial-progress"
      ) throw commandErrorV1(response);
      this.assertSameLaneV1(session, response.laneDescriptor);
      return this.failedAdvanceBatchV1(
        session,
        response,
        progress,
      );
    }
    if (
      response.commandKind !== "advanceToPresentationOrdinal"
      || response.payload.kind !== "presentation-advance-batch"
      || response.payload.firstPresentationOrdinal
        !== firstPresentationOrdinal
      || response.payload.requestedPresentationOrdinalCount
        !== presentationOrdinalCount
    ) throw hostErrorV1("presentation advance batch receipt mismatch");
    this.assertSameLaneV1(session, response.laneDescriptor);
    const advances = response.payload.advances.map((payload) =>
      this.successfulAdvanceReceiptV1(
        session.sessionId,
        response.laneDescriptor,
        payload,
      ));
    const updated = advances.at(-1)?.session;
    if (updated === undefined) {
      throw hostErrorV1("presentation advance batch was empty");
    }
    this.sessions.set(session.sessionId, updated);
    return Object.freeze({
      status: "advanced" as const,
      session: updated,
      firstPresentationOrdinal:
        response.payload.firstPresentationOrdinal,
      lastPresentationOrdinal:
        response.payload.lastPresentationOrdinal,
      requestedPresentationOrdinalCount:
        response.payload.requestedPresentationOrdinalCount,
      advances: Object.freeze(advances),
    });
  }

  async getOperationalCheckpoint(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<MainWireIntegratedBrowserCheckpointReceiptV1> {
    this.assertCurrentSessionV1(session);
    const response = await this.successfulRequestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "getOperationalCheckpoint",
      requestId: this.nextRequestIdV1("checkpoint"),
      sessionId: session.sessionId,
    });
    if (
      response.commandKind !== "getOperationalCheckpoint"
      || response.payload.kind !== "operational-checkpoint"
    ) throw hostErrorV1("operational checkpoint receipt mismatch");
    this.assertSameLaneV1(session, response.laneDescriptor);
    const updated = this.installSessionV1(
      session.sessionId,
      response.laneDescriptor,
      response.payload.session,
    );
    return Object.freeze({
      session: updated,
      checkpoint: response.payload.checkpoint,
    });
  }

  async restoreOperationalCheckpoint(
    input: Readonly<{
      sessionId: string;
      checkpoint: unknown;
    }>,
  ): Promise<MainWireIntegratedBrowserHostedSessionV1> {
    this.assertCanAllocateV1(input.sessionId);
    const response = await this.successfulRequestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "restoreOperationalCheckpoint",
      requestId: this.nextRequestIdV1("restore"),
      sessionId: input.sessionId,
      checkpoint: input.checkpoint,
    });
    if (
      response.commandKind !== "restoreOperationalCheckpoint"
      || response.payload.kind
        !== "operational-checkpoint-session-restored"
    ) throw hostErrorV1("operational restore receipt mismatch");
    return this.installSessionV1(
      input.sessionId,
      response.laneDescriptor,
      response.payload.session,
    );
  }

  async dispose(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): Promise<void> {
    this.assertCurrentSessionV1(session);
    const response = await this.successfulRequestV1({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: this.nextRequestIdV1("dispose"),
      sessionId: session.sessionId,
    });
    if (
      response.commandKind !== "disposeSession"
      || response.payload.kind !== "session-disposed"
      || response.payload.disposedSessionId !== session.sessionId
    ) throw hostErrorV1("dispose receipt mismatch");
    this.assertSameLaneV1(session, response.laneDescriptor);
    this.sessions.delete(session.sessionId);
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.sessions.clear();
    this.client.terminate();
  }

  private async requestV1(
    command: MainWireIntegratedScientificWorkerCommandV1,
  ): Promise<MainWireIntegratedScientificWorkerResponseV1> {
    if (this.terminated) throw hostErrorV1("host is terminated");
    this.requestOrdinal += 1;
    return this.client.request(command);
  }

  private async successfulRequestV1(
    command: MainWireIntegratedScientificWorkerCommandV1,
  ): Promise<Extract<
    MainWireIntegratedScientificWorkerResponseV1,
    { ok: true }
  >> {
    const response = await this.requestV1(command);
    if (response.ok === false) throw commandErrorV1(response);
    return response;
  }

  private nextRequestIdV1(operation: string): string {
    return `${this.hostId}:${operation}:${this.requestOrdinal + 1}`;
  }

  private assertCanAllocateV1(sessionId: string): void {
    if (this.terminated) throw hostErrorV1("host is terminated");
    if (this.sessions.has(sessionId)) {
      throw hostErrorV1(`sessionId ${sessionId} is already hosted`);
    }
  }

  private assertCurrentSessionV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
  ): void {
    if (this.terminated) throw hostErrorV1("host is terminated");
    if (
      session.hostId !== this.hostId
      || this.sessions.get(session.sessionId) !== session
    ) throw hostErrorV1("session is stale or belongs to another host");
  }

  private assertSameLaneV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
    descriptor: StudioLaneDescriptorV1 | null,
  ): asserts descriptor is StudioLaneDescriptorV1 {
    if (
      descriptor === null
      || descriptor.laneId !== session.laneDescriptor.laneId
      || descriptor.releaseRef.sha256
        !== session.laneDescriptor.releaseRef.sha256
      || descriptor.observableCatalogSha256
        !== session.laneDescriptor.observableCatalogSha256
    ) throw hostErrorV1("lane descriptor changed within a hosted session");
  }

  private installSessionV1(
    sessionId: string,
    laneDescriptor: StudioLaneDescriptorV1,
    snapshot: Readonly<{
      presentationOrdinal: number | null;
      acceptedRevision: number;
      acceptedTimeSec: number;
      observableFrame: MainWireIntegratedLaneObservableFrameV1;
    }>,
  ): MainWireIntegratedBrowserHostedSessionV1 {
    const session = Object.freeze({
      hostId: this.hostId,
      sessionId,
      laneDescriptor,
      presentationOrdinal: snapshot.presentationOrdinal,
      acceptedRevision: snapshot.acceptedRevision,
      acceptedTimeSec: snapshot.acceptedTimeSec,
      observableFrame: snapshot.observableFrame,
    });
    this.sessions.set(sessionId, session);
    return session;
  }

  private failedAdvanceV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
    response: MainWireIntegratedScientificWorkerErrorResponseV1,
    progress: MainWireIntegratedScientificWorkerAdvancePartialProgressV1,
  ): MainWireIntegratedBrowserAdvanceReceiptV1 {
    const laneDescriptor = response.laneDescriptor;
    if (laneDescriptor === null) {
      throw hostErrorV1("failed advance omitted its lane descriptor");
    }
    const updated = Object.freeze({
      ...session,
      laneDescriptor,
      presentationOrdinal: progress.lastPresentationOrdinal,
      acceptedRevision: progress.acceptedRevision,
      acceptedTimeSec: progress.acceptedTimeSec,
    });
    this.sessions.set(session.sessionId, updated);
    return Object.freeze({
      status: "failed" as const,
      session: updated,
      requestedPresentationOrdinal:
        progress.requestedPresentationOrdinal,
      requestedPresentationTimeSec:
        progress.requestedPresentationTimeSec,
      partiallyAdvanced: progress.partiallyAdvanced,
      internalAcceptedSubstepCount:
        progress.internalAcceptedSubstepCount,
      emittedPresentationSample: false as const,
      observableFrame: null,
      failureReason: progress.failureReason,
      message: response.error.message,
    });
  }

  private successfulAdvanceReceiptV1(
    sessionId: string,
    laneDescriptor: StudioLaneDescriptorV1,
    payload: MainWireIntegratedScientificWorkerAdvancePayloadV1,
  ): MainWireIntegratedBrowserSuccessfulAdvanceReceiptV1 {
    const updated = Object.freeze({
      hostId: this.hostId,
      sessionId,
      laneDescriptor,
      presentationOrdinal: payload.presentationOrdinal,
      acceptedRevision: payload.acceptedRevision,
      acceptedTimeSec: payload.acceptedTimeSec,
      observableFrame: payload.observableFrame,
    });
    return Object.freeze({
      status: payload.status,
      session: updated,
      presentationOrdinal: payload.presentationOrdinal,
      presentationTimeSec: payload.presentationTimeSec,
      acceptedRevisionSpanFromPrevious:
        payload.acceptedRevisionSpanFromPrevious,
      internalAcceptedSubstepCount:
        payload.internalAcceptedSubstepCount,
      boundaryClippedSubstepCount:
        payload.boundaryClippedSubstepCount,
      substeps: payload.substeps,
      emittedPresentationSample:
        payload.emittedPresentationSample,
      observableFrame: payload.observableFrame,
    });
  }

  private failedAdvanceBatchV1(
    session: MainWireIntegratedBrowserHostedSessionV1,
    response: MainWireIntegratedScientificWorkerErrorResponseV1,
    progress:
      MainWireIntegratedScientificWorkerAdvanceBatchPartialProgressV1,
  ): MainWireIntegratedBrowserAdvanceBatchReceiptV1 {
    const laneDescriptor = response.laneDescriptor;
    if (laneDescriptor === null) {
      throw hostErrorV1(
        "failed advance batch omitted its lane descriptor",
      );
    }
    const completedAdvances = progress.completedAdvances.map((payload) =>
      this.successfulAdvanceReceiptV1(
        session.sessionId,
        laneDescriptor,
        payload,
      ));
    const latestCompleted = completedAdvances.at(-1);
    const updated = Object.freeze({
      hostId: this.hostId,
      sessionId: session.sessionId,
      laneDescriptor,
      presentationOrdinal: progress.lastPresentationOrdinal,
      acceptedRevision: progress.acceptedRevision,
      acceptedTimeSec: progress.acceptedTimeSec,
      observableFrame:
        latestCompleted?.observableFrame ?? session.observableFrame,
    });
    this.sessions.set(session.sessionId, updated);
    return Object.freeze({
      status: "failed" as const,
      session: updated,
      firstPresentationOrdinal: progress.firstPresentationOrdinal,
      requestedPresentationOrdinalCount:
        progress.requestedPresentationOrdinalCount,
      completedAdvances: Object.freeze(completedAdvances),
      failedPresentationOrdinal: progress.failedPresentationOrdinal,
      failedPresentationTimeSec: progress.failedPresentationTimeSec,
      failedOrdinalPartiallyAdvanced:
        progress.failedOrdinalPartiallyAdvanced,
      failedOrdinalInternalAcceptedSubstepCount:
        progress.failedOrdinalInternalAcceptedSubstepCount,
      failedOrdinalBoundaryClippedSubstepCount:
        progress.failedOrdinalBoundaryClippedSubstepCount,
      failedOrdinalSubsteps: progress.failedOrdinalSubsteps,
      failureReason: progress.failureReason,
      message: response.error.message,
    });
  }
}

export function createIntegratedBrowserClientV1(
  integrityTier: HotPathIntegrityTierV1 = "hot-path-lean",
): MainWireIntegratedScientificWorkerClientV1 {
  return new MainWireIntegratedScientificWorkerClientV1({
    workerFactory: () =>
      createDefaultMainWireIntegratedScientificWorkerV1(integrityTier),
    maximumPendingRequestCount:
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumPendingRequestCount,
    maximumRequestCountPerClientLifetime:
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumRequestCountPerLifetime,
    requestTimeoutMs:
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .requestTimeoutMs,
  });
}

function commandErrorV1(
  response: MainWireIntegratedScientificWorkerErrorResponseV1,
): MainWireIntegratedScientificBrowserHostErrorV1 {
  return new MainWireIntegratedScientificBrowserHostErrorV1(
    "scientific-command-rejected",
    `${response.commandKind ?? "unknown-command"}: ${response.error.code}: ${response.error.message}`,
    response,
  );
}

function hostErrorV1(
  message: string,
): MainWireIntegratedScientificBrowserHostErrorV1 {
  return new MainWireIntegratedScientificBrowserHostErrorV1(
    "host-contract-mismatch",
    message,
  );
}

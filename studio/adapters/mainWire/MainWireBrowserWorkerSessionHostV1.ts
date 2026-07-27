import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1,
  type ScientificCommandErrorResponseV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  createDefaultMainWireScientificWorkerV1,
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1,
  SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1,
  type MainWireScientificObservableDefinitionV1,
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  canonicalJsonStringify,
  loadSimulationReleaseRefV1,
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  type MainWireScientificSessionExactCheckpointV4,
} from "@/engine/scientific/runtime";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
  type MainWireScientificTransientMetricIntegrationResultV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireStudioCheckpointReceiptV1,
  MainWireStudioHostedSessionV1,
  MainWireStudioPeriodicSettlementChunkV1,
  MainWireStudioSessionHostFactoryV1,
  MainWireStudioSessionHostV1,
  MainWireStudioTransientChunkV1,
} from "./MainWireStudioSessionHostV1";

type MainWireStudioWorkerClientV1 = Pick<
  MainWireScientificWorkerClientV1,
  "request" | "terminate"
>;

export type MainWireBrowserWorkerSessionHostOptionsV1 = Readonly<{
  client?: MainWireStudioWorkerClientV1;
  clientFactory?: () => MainWireStudioWorkerClientV1;
  hostId?: string;
  /**
   * Hot-path integrity tier for this host's Worker. Omitted means the
   * full-invariant tier; only a live Workbench lane asks for the lean tier.
   * See engine/hotPathIntegrityTierV1.ts.
   */
  integrityTier?: HotPathIntegrityTierV1;
}>;

let nextBrowserHostOrdinalV1 = 0;

export class MainWireStudioSessionHostErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire Studio host failed: ${message}`);
    this.name = "MainWireStudioSessionHostErrorV1";
  }
}

export type MainWireStudioAcceptedTransientPartialProgressV1 = Readonly<{
  requestedStepCount: number;
  completedStepCount: number;
  acceptedPartialProgress: MainWireStudioTransientChunkV1;
}>;

export class MainWireStudioTransientPartialProgressErrorV1
extends MainWireStudioSessionHostErrorV1 {
  readonly requestedStepCount: number;
  readonly completedStepCount: number;
  readonly acceptedPartialProgress: MainWireStudioTransientChunkV1;

  constructor(
    message: string,
    progress: MainWireStudioAcceptedTransientPartialProgressV1,
  ) {
    super(message);
    this.name = "MainWireStudioTransientPartialProgressErrorV1";
    this.requestedStepCount = progress.requestedStepCount;
    this.completedStepCount = progress.completedStepCount;
    this.acceptedPartialProgress = progress.acceptedPartialProgress;
  }
}

/**
 * Production browser host. Each instance owns exactly one Worker client and
 * never falls back to an in-process/main-thread session.
 */
export class MainWireBrowserWorkerSessionHostV1
implements MainWireStudioSessionHostV1 {
  readonly hostId: string;
  private readonly client: MainWireStudioWorkerClientV1;
  private requestOrdinal = 0;
  private terminated = false;

  constructor(options: MainWireBrowserWorkerSessionHostOptionsV1 = {}) {
    nextBrowserHostOrdinalV1 += 1;
    this.hostId = options.hostId
      ?? `main-wire-studio-worker-${nextBrowserHostOrdinalV1}`;
    if (options.client !== undefined && options.clientFactory !== undefined) {
      throw new MainWireStudioSessionHostErrorV1(
        "provide either client or clientFactory, not both",
      );
    }
    this.client = options.client
      ?? (options.clientFactory
        ?? (() => createProductionClientV1(options.integrityTier)))();
  }

  get requestCount(): number {
    return this.requestOrdinal;
  }

  async restoreV4(
    input: Parameters<MainWireStudioSessionHostV1["restoreV4"]>[0],
  ): Promise<MainWireStudioHostedSessionV1> {
    const resolvedInput = resolvedInputBindingV1(
      input.resolvedSessionInput,
    );
    assertRestoreInputBindingV1(
      resolvedInput,
      input.checkpointV4,
    );
    const response = await this.requestV1({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "restoreExactSessionV4",
      requestId: this.nextRequestIdV1("restore-v4"),
      sessionId: input.sessionId,
      resolvedSessionInput: input.resolvedSessionInput,
      checkpoint: input.checkpointV4,
    });
    if (
      response.commandKind !== "restoreExactSessionV4"
      || response.payload.kind !== "sessionRestoredV4"
      || response.sessionId !== input.sessionId
      || response.sessionOrigin.kind
        !== "control-aware-exact-checkpoint-v4-restore"
    ) throw hostErrorV1("restore V4 receipt mismatch");
    assertRestoreReceiptBindingV1(
      response,
      input.checkpointV4,
      resolvedInput.fixedTotalBloodVolumeMl,
    );
    return Object.freeze({
      hostId: this.hostId,
      sessionId: input.sessionId,
      baseSessionInputSha256: input.checkpointV4.baseSessionInputSha256,
      controlState:
        response.payload.researchControlContext.controlState,
      parameterEpoch:
        response.payload.researchControlContext.parameterEpoch,
      stateIdentity:
        response.payload.researchControlContext.stateIdentity,
      observableFrame: response.payload.observableFrame,
    });
  }

  async forkControl(
    input: Parameters<MainWireStudioSessionHostV1["forkControl"]>[0],
  ): Promise<MainWireStudioHostedSessionV1> {
    assertOwnedSessionV1(this.hostId, input.source);
    assertHostedSessionBindingV1(input.source);
    if (
      !sameSimulationReleaseRef(
        input.targetControlState.releaseRef,
        input.source.observableFrame.releaseRef,
      )
    ) throw hostErrorV1("control fork target release mismatch");
    const response = await this.requestV1({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "forkResearchControlSession",
      requestId: this.nextRequestIdV1("fork-control"),
      sessionId: input.targetSessionId,
      sourceSessionId: input.source.sessionId,
      expectedSource: Object.freeze({
        ...input.source.stateIdentity,
        controlStateSha256:
          input.source.controlState.targetStateSha256,
        parameterEpoch: input.source.parameterEpoch,
      }),
      targetControlState: input.targetControlState,
    });
    if (
      response.commandKind !== "forkResearchControlSession"
      || response.payload.kind !== "researchControlSessionForked"
      || response.sessionId !== input.targetSessionId
      || response.payload.sourceSessionId !== input.source.sessionId
      || response.payload.targetControlState.targetStateSha256
        !== input.targetControlState.targetStateSha256
      || response.sessionOrigin.kind
        !== "research-control-state-preserving-fork-v0"
    ) throw hostErrorV1("control fork receipt mismatch");
    assertForkReceiptBindingV1(response, input);
    return Object.freeze({
      hostId: this.hostId,
      sessionId: input.targetSessionId,
      baseSessionInputSha256:
        response.sessionOrigin.baseSessionInputSha256,
      controlState: response.payload.targetControlState,
      parameterEpoch: response.payload.parameterEpoch,
      stateIdentity: response.payload.targetStateIdentity,
      observableFrame: response.payload.observableFrame,
    });
  }

  async runTransient(
    input: Parameters<MainWireStudioSessionHostV1["runTransient"]>[0],
  ): Promise<MainWireStudioTransientChunkV1> {
    assertOwnedSessionV1(this.hostId, input.session);
    assertHostedSessionBindingV1(input.session);
    assertTransientRequestV1(input);
    if (this.terminated) throw hostErrorV1("host is terminated");
    const response = await this.client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "runTransient",
      requestId: this.nextRequestIdV1("live"),
      sessionId: input.session.sessionId,
      dtSec: input.dtSec,
      stepCount: input.stepCount,
      observationStride: input.observationStride,
      ...(input.metricIntegrationPolicy === undefined
        ? {}
        : { metricIntegrationPolicy: input.metricIntegrationPolicy }),
      ...(input.rendererRetentionPolicy === undefined
        ? {}
        : { rendererRetentionPolicy: input.rendererRetentionPolicy }),
    });
    if (response.ok === false) {
      if (
        response.commandKind === "runTransient"
        && response.error.code === "simulation-step-failed"
      ) {
        const accepted =
          acceptedTransientPartialProgressV1(response, input);
        throw new MainWireStudioTransientPartialProgressErrorV1(
          `${response.commandKind}: ${response.error.code}: ${response.error.message}`,
          accepted,
        );
      }
      throw commandErrorV1(response);
    }
    if (
      response.commandKind !== "runTransient"
      || response.payload.kind !== "transientCompleted"
      || response.sessionId !== input.session.sessionId
      || response.payload.requestedStepCount !== input.stepCount
      || response.payload.completedStepCount !== input.stepCount
    ) throw hostErrorV1("transient receipt mismatch");
    assertResponseBoundToSessionV1(response, input.session);
    assertTransientReceiptBindingV1(response.payload, input);
    const final = response.payload.finalObservableFrame;
    return Object.freeze({
      session: updateHostedSessionV1(input.session, final),
      observableFrames: response.payload.observableFrames,
      metricIntegration: response.payload.metricIntegration,
    });
  }

  async settlePeriodic(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioPeriodicSettlementChunkV1> {
    assertOwnedSessionV1(this.hostId, session);
    assertHostedSessionBindingV1(session);
    const response = await this.requestV1({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "settlePeriodic",
      requestId: this.nextRequestIdV1("settle"),
      sessionId: session.sessionId,
    });
    if (
      response.commandKind !== "settlePeriodic"
      || response.payload.kind !== "periodic-settlement-progress"
      || response.sessionId !== session.sessionId
    ) throw hostErrorV1("periodic settlement receipt mismatch");
    assertResponseBoundToSessionV1(response, session);
    assertSettlementReceiptBindingV1(response.payload, session);
    return Object.freeze({
      session: updateHostedSessionV1(
        session,
        response.payload.finalObservableFrame,
      ),
      status: response.payload.status,
      periodicSteadyStateClaimed:
        response.payload.periodicSteadyStateClaimed,
      period2OrbitSuspected: response.payload.period2OrbitSuspected,
      trackerStartedThisCall: response.payload.trackerStartedThisCall,
      beatCompletedThisCall: response.payload.beatCompletedThisCall,
      completedStepCountThisCall:
        response.payload.completedStepCountThisCall,
      completedBeatCount: response.payload.completedBeatCount,
      anchorAcceptedTimeSec: response.payload.anchorAcceptedTimeSec,
      anchorPhase01: response.payload.anchorPhase01,
      periodicity: response.payload.periodicity,
      retainedBeatClosure: response.payload.retainedBeatClosure,
    });
  }

  async checkpointV4(
    session: MainWireStudioHostedSessionV1,
  ): Promise<MainWireStudioCheckpointReceiptV1> {
    assertOwnedSessionV1(this.hostId, session);
    assertHostedSessionBindingV1(session);
    const response = await this.requestV1({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "getExactCheckpointV4",
      requestId: this.nextRequestIdV1("checkpoint-v4"),
      sessionId: session.sessionId,
    });
    if (
      response.commandKind !== "getExactCheckpointV4"
      || response.payload.kind !== "exactCheckpointV4"
      || response.sessionId !== session.sessionId
    ) throw hostErrorV1("checkpoint V4 receipt mismatch");
    assertResponseBoundToSessionV1(response, session);
    assertCheckpointReceiptBindingV1(response.payload, session);
    return Object.freeze({
      session: updateHostedSessionV1(
        session,
        response.payload.observableFrame,
      ),
      checkpointV4: response.payload.checkpoint,
    });
  }

  async dispose(sessionId: string): Promise<void> {
    const response = await this.requestV1({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: this.nextRequestIdV1("dispose"),
      sessionId,
    });
    if (
      response.commandKind !== "disposeSession"
      || response.payload.kind !== "sessionDisposed"
      || response.payload.disposedSessionId !== sessionId
    ) throw hostErrorV1("dispose receipt mismatch");
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.client.terminate();
  }

  private async requestV1(
    command: Parameters<MainWireScientificWorkerClientV1["request"]>[0],
  ): Promise<Extract<MainWireScientificWorkerResponseV1, { ok: true }>> {
    if (this.terminated) throw hostErrorV1("host is terminated");
    const response = await this.client.request(command);
    if (response.ok === false) throw commandErrorV1(response);
    return response;
  }

  private nextRequestIdV1(operation: string): string {
    this.requestOrdinal += 1;
    return `${this.hostId}:${operation}:${this.requestOrdinal}`;
  }
}

export function createMainWireBrowserWorkerSessionHostFactoryV1():
MainWireStudioSessionHostFactoryV1 {
  return (request) => new MainWireBrowserWorkerSessionHostV1({
    ...(request?.integrityTier === undefined
      ? {}
      : { integrityTier: request.integrityTier }),
  });
}

function createProductionClientV1(
  integrityTier: HotPathIntegrityTierV1 = "full-invariant",
): MainWireScientificWorkerClientV1 {
  return new MainWireScientificWorkerClientV1({
    workerFactory: () => createDefaultMainWireScientificWorkerV1(integrityTier),
    maximumPendingRequestCount: 1,
    maximumRequestCountPerClientLifetime:
      MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumRequestCountPerLifetime,
    requestTimeoutMs:
      MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1.requestTimeoutMs,
  });
}

function updateHostedSessionV1(
  session: MainWireStudioHostedSessionV1,
  observableFrame: MainWireStudioHostedSessionV1["observableFrame"],
): MainWireStudioHostedSessionV1 {
  return Object.freeze({
    ...session,
    stateIdentity: Object.freeze({
      revision: observableFrame.revision,
      acceptedTimeSec: observableFrame.acceptedTimeSec,
      // Research-control transitions preserve fixed total blood volume.
      totalBloodVolumeMl: session.stateIdentity.totalBloodVolumeMl,
    }),
    observableFrame,
  });
}

type ResolvedInputBindingV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  sessionInputSha256: string;
  fixedTotalBloodVolumeMl: number;
}>;

function resolvedInputBindingV1(value: unknown): ResolvedInputBindingV1 {
  const input = recordV1(value, "resolved session input");
  const initialization = recordV1(
    input.initialization,
    "resolved session input initialization",
  );
  if (
    typeof input.sessionInputSha256 !== "string"
    || !Number.isFinite(initialization.fixedTotalBloodVolumeMl)
    || !(initialization.fixedTotalBloodVolumeMl as number > 0)
  ) throw hostErrorV1("resolved session input identity mismatch");
  let releaseRef: SimulationReleaseRef;
  try {
    releaseRef = loadSimulationReleaseRefV1(input.releaseRef);
  } catch {
    throw hostErrorV1("resolved session input release mismatch");
  }
  return Object.freeze({
    releaseRef,
    sessionInputSha256: input.sessionInputSha256,
    fixedTotalBloodVolumeMl:
      initialization.fixedTotalBloodVolumeMl as number,
  });
}

function assertRestoreInputBindingV1(
  input: ResolvedInputBindingV1,
  checkpoint: MainWireScientificSessionExactCheckpointV4,
): void {
  if (
    checkpoint.baseSessionInputSha256 !== input.sessionInputSha256
    || !sameSimulationReleaseRef(checkpoint.releaseRef, input.releaseRef)
    || checkpoint.controlTargetStateSha256
      !== checkpoint.controlTargetState.targetStateSha256
    || !sameSimulationReleaseRef(
      checkpoint.controlTargetState.releaseRef,
      input.releaseRef,
    )
    || !Number.isSafeInteger(checkpoint.transaction.revision)
    || checkpoint.transaction.revision < 0
    || !Number.isFinite(checkpoint.transaction.acceptedTimeSec)
    || checkpoint.transaction.acceptedTimeSec < 0
  ) throw hostErrorV1("restore V4 input binding mismatch");
}

function assertRestoreReceiptBindingV1(
  response: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "restoreExactSessionV4" }
  >,
  checkpoint: MainWireScientificSessionExactCheckpointV4,
  fixedTotalBloodVolumeMl: number,
): void {
  const origin = response.sessionOrigin;
  const context = response.payload.researchControlContext;
  const expectedState = Object.freeze({
    revision: checkpoint.transaction.revision,
    acceptedTimeSec: checkpoint.transaction.acceptedTimeSec,
    totalBloodVolumeMl: fixedTotalBloodVolumeMl,
  });
  if (
    origin.kind !== "control-aware-exact-checkpoint-v4-restore"
    || origin.checkpointSchemaVersion !== 4
    || origin.checkpointSha256 !== checkpoint.checkpointSha256
    || origin.baseSessionInputSha256 !== checkpoint.baseSessionInputSha256
    || origin.controlTargetStateSha256
      !== checkpoint.controlTargetStateSha256
    || origin.parameterEpoch !== checkpoint.parameterEpoch
    || !sameSimulationReleaseRef(response.releaseRef, checkpoint.releaseRef)
    || !sameAcceptedStateIdentityV1(context.stateIdentity, expectedState)
    || context.parameterEpoch !== checkpoint.parameterEpoch
    || !sameCanonicalV1(context.controlState, checkpoint.controlTargetState)
  ) throw hostErrorV1("restore V4 accepted-state binding mismatch");
  assertFrameAtStateV1(
    response.payload.observableFrame,
    expectedState,
    checkpoint.releaseRef,
    "restore V4 observable frame",
  );
  if (response.payload.observableFrame.source !== "exact-checkpoint-restore") {
    throw hostErrorV1("restore V4 observable frame source mismatch");
  }
}

function assertForkReceiptBindingV1(
  response: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "forkResearchControlSession" }
  >,
  input: Parameters<MainWireStudioSessionHostV1["forkControl"]>[0],
): void {
  const origin = response.sessionOrigin;
  const payload = response.payload;
  const expectedEpoch = input.source.parameterEpoch + 1;
  if (
    !Number.isSafeInteger(expectedEpoch)
    || origin.kind !== "research-control-state-preserving-fork-v0"
    || origin.sourceSessionId !== input.source.sessionId
    || origin.baseSessionInputSha256
      !== input.source.baseSessionInputSha256
    || origin.sourceControlStateSha256
      !== input.source.controlState.targetStateSha256
    || origin.targetControlStateSha256
      !== input.targetControlState.targetStateSha256
    || origin.parameterEpoch !== expectedEpoch
    || !sameSimulationReleaseRef(
      response.releaseRef,
      input.source.observableFrame.releaseRef,
    )
    || payload.sourceSessionId !== input.source.sessionId
    || payload.sourceControlStateSha256
      !== input.source.controlState.targetStateSha256
    || payload.parameterEpoch !== expectedEpoch
    || !sameAcceptedStateIdentityV1(
      payload.sourceStateIdentity,
      input.source.stateIdentity,
    )
    || !sameAcceptedStateIdentityV1(
      payload.targetStateIdentity,
      input.source.stateIdentity,
    )
    || !sameCanonicalV1(
      payload.targetControlState,
      input.targetControlState,
    )
    || payload.acceptedStatePreservedAtFork !== true
    || payload.periodicTrackerResetAtFork !== true
    || payload.sourceSessionRetainedAtFork !== true
    || payload.exactCheckpointAvailable !== true
    || payload.periodicSteadyStateClaimed !== false
  ) throw hostErrorV1("control fork accepted-state binding mismatch");
  assertFrameAtStateV1(
    payload.observableFrame,
    input.source.stateIdentity,
    input.source.observableFrame.releaseRef,
    "control fork observable frame",
  );
  if (payload.observableFrame.source !== "research-control-state-fork") {
    throw hostErrorV1("control fork observable frame source mismatch");
  }
}

function assertResponseBoundToSessionV1(
  response: Extract<MainWireScientificWorkerResponseV1, { ok: true }>,
  session: MainWireStudioHostedSessionV1,
): void {
  if (
    response.sessionId !== session.sessionId
    || !sameSimulationReleaseRef(
      response.releaseRef,
      session.observableFrame.releaseRef,
    )
  ) throw hostErrorV1("Worker response session binding mismatch");
  const origin = response.sessionOrigin;
  if (origin.kind === "control-aware-exact-checkpoint-v4-restore") {
    if (
      origin.baseSessionInputSha256 !== session.baseSessionInputSha256
      || origin.controlTargetStateSha256
        !== session.controlState.targetStateSha256
      || origin.parameterEpoch !== session.parameterEpoch
    ) throw hostErrorV1("Worker response restore-origin binding mismatch");
    return;
  }
  if (origin.kind === "research-control-state-preserving-fork-v0") {
    if (
      origin.baseSessionInputSha256 !== session.baseSessionInputSha256
      || origin.targetControlStateSha256
        !== session.controlState.targetStateSha256
      || origin.parameterEpoch !== session.parameterEpoch
      || !sameSimulationReleaseRef(
        origin.releaseRef,
        session.observableFrame.releaseRef,
      )
    ) throw hostErrorV1("Worker response fork-origin binding mismatch");
    return;
  }
  throw hostErrorV1("Worker response origin is not Studio-compatible");
}

function assertTransientRequestV1(
  input: Parameters<MainWireStudioSessionHostV1["runTransient"]>[0],
): void {
  if (
    !Number.isFinite(input.dtSec)
    || !(input.dtSec > 0)
    || !Number.isSafeInteger(input.stepCount)
    || input.stepCount < 1
    || !Number.isSafeInteger(input.observationStride)
    || input.observationStride < 1
  ) throw hostErrorV1("transient request identity mismatch");
}

function assertTransientReceiptBindingV1(
  payload: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "runTransient" }
  >["payload"],
  input: Parameters<MainWireStudioSessionHostV1["runTransient"]>[0],
): void {
  assertTransientExecutionProtocolBindingV1(
    payload.executionProtocol,
    input,
  );

  const expectedOffsets = input.rendererRetentionPolicy === undefined
    ? transientObservationOffsetsV1(
      input.stepCount,
      input.observationStride,
    )
    : payload.observableFrames.map((frame) =>
      frame.revision - input.session.stateIdentity.revision
    );
  if (payload.observableFrames.length !== expectedOffsets.length) {
    throw hostErrorV1("transient observable frame count mismatch");
  }
  assertRendererRetentionOffsetsV1(
    expectedOffsets,
    input.stepCount,
    input.observationStride,
    input.rendererRetentionPolicy,
  );
  for (let index = 0; index < expectedOffsets.length; index += 1) {
    const offset = expectedOffsets[index]!;
    const frame = payload.observableFrames[index]!;
    assertFrameAtStateV1(
      frame,
      {
        revision: input.session.stateIdentity.revision + offset,
        acceptedTimeSec:
          input.session.stateIdentity.acceptedTimeSec + input.dtSec * offset,
      },
      input.session.observableFrame.releaseRef,
      `transient observable frame ${index}`,
    );
    if (frame.source !== "accepted-step") {
      throw hostErrorV1(`transient observable frame ${index} source mismatch`);
    }
  }
  const last = payload.observableFrames.at(-1);
  if (
    last === undefined
    || !sameCanonicalV1(last, payload.finalObservableFrame)
  ) throw hostErrorV1("transient final observable frame mismatch");
  assertMetricIntegrationReceiptV1(
    payload.metricIntegration,
    input.metricIntegrationPolicy,
    input.stepCount,
    input.session.stateIdentity.revision,
    payload.finalObservableFrame.revision,
  );
}

function acceptedTransientPartialProgressV1(
  response: ScientificCommandErrorResponseV1<
    MainWireScientificObservableFrameV1
  >,
  input: Parameters<MainWireStudioSessionHostV1["runTransient"]>[0],
): MainWireStudioAcceptedTransientPartialProgressV1 {
  const partial = response.error.partialProgress;
  if (
    response.commandKind !== "runTransient"
    || response.sessionId !== input.session.sessionId
    || response.releaseRef === null
    || response.sessionOrigin === null
    || partial === null
    || partial.kind !== "transient-partial-progress"
    || partial.requestedStepCount !== input.stepCount
    || !Number.isSafeInteger(partial.completedStepCount)
    || partial.completedStepCount < 0
    || partial.completedStepCount >= input.stepCount
  ) throw hostErrorV1("transient partial-progress receipt mismatch");

  assertResponseBoundToSessionV1(
    response as unknown as Extract<
      MainWireScientificWorkerResponseV1,
      { ok: true }
    >,
    input.session,
  );
  assertTransientExecutionProtocolBindingV1(
    partial.executionProtocol,
    input,
  );
  const expectedOffsets = input.rendererRetentionPolicy === undefined
    ? transientObservationOffsetsV1(
      partial.completedStepCount,
      input.observationStride,
    )
    : response.error.observableFrames.map((frame) =>
      frame.revision - input.session.stateIdentity.revision
    );
  if (response.error.observableFrames.length !== expectedOffsets.length) {
    throw hostErrorV1(
      "transient partial-progress observable frame count mismatch",
    );
  }
  assertRendererRetentionOffsetsV1(
    expectedOffsets,
    partial.completedStepCount,
    input.observationStride,
    input.rendererRetentionPolicy,
  );
  for (let index = 0; index < expectedOffsets.length; index += 1) {
    const offset = expectedOffsets[index]!;
    const frame = response.error.observableFrames[index]!;
    assertFrameAtStateV1(
      frame,
      {
        revision: input.session.stateIdentity.revision + offset,
        acceptedTimeSec:
          input.session.stateIdentity.acceptedTimeSec + input.dtSec * offset,
      },
      input.session.observableFrame.releaseRef,
      `transient partial-progress observable frame ${index}`,
    );
    if (
      offset === 0
      && !sameCanonicalV1(frame, input.session.observableFrame)
    ) {
      throw hostErrorV1(
        "transient partial-progress zero-step observable frame mismatch",
      );
    }
    if (offset > 0 && frame.source !== "accepted-step") {
      throw hostErrorV1(
        `transient partial-progress observable frame ${index} source mismatch`,
      );
    }
  }
  const final = response.error.observableFrames.at(-1);
  if (
    final === undefined
    || !sameCanonicalV1(final, partial.finalObservableFrame)
  ) throw hostErrorV1(
    "transient partial-progress final observable frame mismatch",
  );
  assertMetricIntegrationReceiptV1(
    partial.metricIntegration,
    input.metricIntegrationPolicy,
    partial.completedStepCount,
    input.session.stateIdentity.revision,
    partial.finalObservableFrame.revision,
  );
  return Object.freeze({
    requestedStepCount: partial.requestedStepCount,
    completedStepCount: partial.completedStepCount,
    acceptedPartialProgress: Object.freeze({
      session: updateHostedSessionV1(
        input.session,
        partial.finalObservableFrame,
      ),
      observableFrames: response.error.observableFrames,
      metricIntegration: partial.metricIntegration,
    }),
  });
}

function assertTransientExecutionProtocolBindingV1(
  protocol: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "runTransient" }
  >["payload"]["executionProtocol"],
  input: Parameters<MainWireStudioSessionHostV1["runTransient"]>[0],
): void {
  if (
    protocol.dtSec !== input.dtSec
    || protocol.stepCount !== input.stepCount
    || (
      input.rendererRetentionPolicy === undefined
        ? protocol.observationPolicy.kind !== "accepted-step-stride"
          || protocol.observationPolicy.stride !== input.observationStride
        : protocol.observationPolicy.kind
            !== "fixed-renderer-geometry-error"
          || protocol.observationPolicy.maximumStride
            !== input.observationStride
          || protocol.observationPolicy.policyId
            !== input.rendererRetentionPolicy
    )
    || protocol.observationPolicy.finalAcceptedStateAlwaysIncluded !== true
    || protocol.metricIntegrationPolicy
      !== (input.metricIntegrationPolicy ?? null)
    || protocol.commitPolicy
      !== "each-step-atomic-partial-progress-retained"
  ) throw hostErrorV1("transient execution protocol mismatch");
}

function assertRendererRetentionOffsetsV1(
  offsets: readonly number[],
  completedStepCount: number,
  maximumStride: number,
  policy:
    typeof SCIENTIFIC_TRANSIENT_RENDERER_RETENTION_POLICY_V1 | undefined,
): void {
  if (policy === undefined) return;
  if (
    offsets.length === 0
    || offsets.at(-1) !== completedStepCount
    || offsets.some((offset, index) =>
      !Number.isSafeInteger(offset)
      || offset < (completedStepCount === 0 ? 0 : 1)
      || offset > completedStepCount
      || (
        index > 0
        && (
          offset <= offsets[index - 1]!
          || offset - offsets[index - 1]! > maximumStride
        )
      )
    )
    || (
      offsets[0]! > maximumStride
      && completedStepCount > 0
    )
  ) throw hostErrorV1("transient renderer retention receipt mismatch");
}

function assertMetricIntegrationReceiptV1(
  result: MainWireScientificTransientMetricIntegrationResultV1 | null,
  requestedPolicy:
    typeof MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1
      | undefined,
  completedStepCount: number,
  sourceRevision: number,
  finalRevision: number,
): void {
  if (requestedPolicy === undefined) {
    if (result !== null) {
      throw hostErrorV1("unexpected transient metric integration");
    }
    return;
  }
  if (
    result === null
    || result.policyId !== requestedPolicy
    || result.acceptedStepFrameCountThisCall !== completedStepCount
  ) throw hostErrorV1("transient metric integration receipt mismatch");
  const beat = result.latestCompletedBeat;
  if (beat === null) return;
  if (
    beat.policyId !== requestedPolicy
    || beat.acceptedStepSampleCount !== 501
    || beat.endAcceptedRevision > finalRevision
    || beat.endAcceptedRevision <= sourceRevision
    || beat.endAcceptedRevision - beat.startAcceptedRevision !== 500
    || beat.evaluation.cycleAvailability !== "provisional"
    || beat.evaluation.cycleInterpretation
      !== "provisional-complete-transient-beat"
    || beat.evidence.acceptedStepReadbackOnly !== true
    || beat.evidence.bothBeatBoundariesMeasured !== true
    || beat.evidence.revisionsContiguous !== true
    || beat.evidence.cadenceUniform2ms !== true
    || beat.evidence.smoothingOrInterpolationApplied !== false
    || beat.evidence.periodicOrbitClaimed !== false
    || beat.evidence.exactExportEquivalent !== false
  ) throw hostErrorV1("transient metric integration beat mismatch");
}

function transientObservationOffsetsV1(
  stepCount: number,
  observationStride: number,
): readonly number[] {
  const offsets: number[] = [];
  for (
    let completed = observationStride;
    completed < stepCount;
    completed += observationStride
  ) offsets.push(completed);
  offsets.push(stepCount);
  return Object.freeze(offsets);
}

function assertSettlementReceiptBindingV1(
  payload: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "settlePeriodic" }
  >["payload"],
  session: MainWireStudioHostedSessionV1,
): void {
  const protocol = payload.executionProtocol;
  if (
    !sameCanonicalV1(
      protocol,
      MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
    )
    || !Number.isSafeInteger(payload.completedStepCountThisCall)
    || payload.completedStepCountThisCall < 0
    || !Number.isSafeInteger(payload.completedBeatCount)
    || payload.completedBeatCount < 1
    || payload.completedBeatCount > protocol.maximumBeatCount
    || payload.periodicSteadyStateClaimed
      !== (payload.status === "period1-converged")
    || payload.period2OrbitSuspected
      !== (payload.status === "period2-suspect")
  ) throw hostErrorV1("periodic settlement protocol mismatch");
  assertPeriodicSettlementProgressV1(payload);
  assertFrameAtStateV1(
    payload.finalObservableFrame,
    {
      revision:
        session.stateIdentity.revision + payload.completedStepCountThisCall,
      acceptedTimeSec: session.stateIdentity.acceptedTimeSec
        + protocol.dtSec * payload.completedStepCountThisCall,
    },
    session.observableFrame.releaseRef,
    "periodic settlement final observable frame",
  );
}

function assertPeriodicSettlementProgressV1(
  payload: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "settlePeriodic" }
  >["payload"],
): void {
  const protocol = MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1;
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  const completedBeat = payload.beatCompletedThisCall === true
    && payload.completedStepCountThisCall === protocol.stepsPerBeat;
  const terminalNoOp = payload.beatCompletedThisCall === false
    && payload.trackerStartedThisCall === false
    && payload.completedStepCountThisCall === 0
    && payload.status !== "tracking";
  if (
    (!completedBeat && !terminalNoOp)
    || (payload.trackerStartedThisCall
      && (!completedBeat || payload.completedBeatCount !== 1))
    || !Number.isFinite(payload.anchorAcceptedTimeSec)
    || payload.anchorAcceptedTimeSec < 0
    || !Number.isFinite(payload.anchorPhase01)
    || payload.anchorPhase01 < 0
    || payload.anchorPhase01 >= 1
    || cyclePhaseDistanceV1(
      cyclePhase01V1(payload.anchorAcceptedTimeSec),
      payload.anchorPhase01,
    ) > 1e-10
    || !sameAcceptedTimeV1(
      payload.finalObservableFrame.acceptedTimeSec,
      payload.anchorAcceptedTimeSec
        + payload.completedBeatCount * protocol.cycleLengthSec,
    )
  ) throw hostErrorV1("periodic settlement progress mismatch");

  const classification = payload.periodicity;
  const expectedClassificationStatus =
    payload.status === "period1-converged"
      ? "period1-converged"
      : payload.status === "period2-suspect"
        ? "period2-suspect"
        : "not-converged";
  const expectedClosureCount = Math.min(
    payload.completedBeatCount,
    protocol.retainedClosureCount,
  );
  const firstRetainedBeatIndex =
    payload.completedBeatCount - expectedClosureCount + 1;
  if (
    classification.status !== expectedClassificationStatus
    || classification.latestBeatIndex !== payload.completedBeatCount
    || classification.consecutiveBeatsRequired !== policy.consecutiveBeats
    || !Array.isArray(classification.evidenceBeatIndices)
    || !Array.isArray(payload.retainedBeatClosure)
    || payload.retainedBeatClosure.length !== expectedClosureCount
    || (payload.status === "tracking"
      && payload.completedBeatCount >= protocol.maximumBeatCount)
    || (payload.status === "maximum-beats-reached"
      && payload.completedBeatCount !== protocol.maximumBeatCount)
  ) throw hostErrorV1("periodic settlement classification mismatch");

  for (let index = 0; index < expectedClosureCount; index += 1) {
    const closure = payload.retainedBeatClosure[index]!;
    const expectedBeatIndex = firstRetainedBeatIndex + index;
    if (
      closure.beatIndex !== expectedBeatIndex
      || closure.period1 === null
      || !validPeriodicClosureSummaryV1(
        closure.period1,
        protocol.cycleLengthSec,
      )
      || (expectedBeatIndex === 1
        ? closure.period2 !== null
        : closure.period2 === null
          || !validPeriodicClosureSummaryV1(
            closure.period2,
            protocol.cycleLengthSec * 2,
          ))
    ) throw hostErrorV1("periodic settlement closure evidence mismatch");
  }

  const latest = payload.retainedBeatClosure.at(-1)!;
  if (
    classification.latestPeriod1MaximumNormalizedDelta
      !== latest.period1!.maximumNormalizedDelta
    || classification.latestPeriod2MaximumNormalizedDelta
      !== (latest.period2?.maximumNormalizedDelta ?? null)
  ) throw hostErrorV1("periodic settlement classification mismatch");

  const evidence = payload.retainedBeatClosure.slice(-policy.consecutiveBeats);
  const evidenceBeatIndices = evidence.map(({ beatIndex }) => beatIndex);
  if (classification.status === "period1-converged") {
    if (
      payload.completedBeatCount < policy.consecutiveBeats
      || evidence.length !== policy.consecutiveBeats
      || evidence.some(({ period1 }) =>
        period1 === null
        || period1.maximumNormalizedDelta
          > policy.period1NormalizedTolerance)
      || !sameNumberSequenceV1(
        classification.evidenceBeatIndices,
        evidenceBeatIndices,
      )
    ) throw hostErrorV1("periodic settlement period-1 evidence mismatch");
    return;
  }
  if (classification.status === "period2-suspect") {
    if (
      evidence.length !== policy.consecutiveBeats
      || evidence.some(({ period1, period2 }) =>
        period1 === null
        || period2 === null
        || period1.maximumNormalizedDelta
          < policy.period2MinimumPeriod1NormalizedDelta
        || period2.maximumNormalizedDelta
          > policy.period2NormalizedTolerance)
      || !sameNumberSequenceV1(
        classification.evidenceBeatIndices,
        evidenceBeatIndices,
      )
    ) throw hostErrorV1("periodic settlement period-2 evidence mismatch");
    return;
  }
  if (classification.evidenceBeatIndices.length !== 0) {
    throw hostErrorV1("periodic settlement classification mismatch");
  }
}

function validPeriodicClosureSummaryV1(
  summary: Readonly<{
    maximumNormalizedDelta: number;
    worstGroup: string;
    worstPath: string;
    elapsedTimeSec: number;
  }>,
  expectedElapsedTimeSec: number,
): boolean {
  return Number.isFinite(summary.maximumNormalizedDelta)
    && summary.maximumNormalizedDelta >= 0
    && typeof summary.worstGroup === "string"
    && summary.worstGroup.length > 0
    && typeof summary.worstPath === "string"
    && summary.worstPath.length > 0
    && sameAcceptedTimeV1(
      summary.elapsedTimeSec,
      expectedElapsedTimeSec,
    );
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

function assertCheckpointReceiptBindingV1(
  payload: Extract<
    MainWireScientificWorkerResponseV1,
    { ok: true; commandKind: "getExactCheckpointV4" }
  >["payload"],
  session: MainWireStudioHostedSessionV1,
): void {
  const checkpoint = payload.checkpoint;
  if (
    checkpoint.baseSessionInputSha256 !== session.baseSessionInputSha256
    || checkpoint.controlTargetStateSha256
      !== session.controlState.targetStateSha256
    || checkpoint.parameterEpoch !== session.parameterEpoch
    || checkpoint.transaction.revision !== session.stateIdentity.revision
    || !sameAcceptedTimeV1(
      checkpoint.transaction.acceptedTimeSec,
      session.stateIdentity.acceptedTimeSec,
    )
    || !sameSimulationReleaseRef(
      checkpoint.releaseRef,
      session.observableFrame.releaseRef,
    )
    || !sameCanonicalV1(
      checkpoint.controlTargetState,
      session.controlState,
    )
    || !sameCanonicalV1(
      payload.observableFrame,
      session.observableFrame,
    )
  ) throw hostErrorV1("checkpoint V4 accepted-state binding mismatch");
  assertFrameAtStateV1(
    payload.observableFrame,
    session.stateIdentity,
    checkpoint.releaseRef,
    "checkpoint V4 observable frame",
  );
}

function assertHostedSessionBindingV1(
  session: MainWireStudioHostedSessionV1,
): void {
  if (
    !Number.isSafeInteger(session.stateIdentity.revision)
    || session.stateIdentity.revision < 0
    || !Number.isFinite(session.stateIdentity.acceptedTimeSec)
    || session.stateIdentity.acceptedTimeSec < 0
    || !Number.isFinite(session.stateIdentity.totalBloodVolumeMl)
    || !(session.stateIdentity.totalBloodVolumeMl > 0)
    || !Number.isSafeInteger(session.parameterEpoch)
    || session.parameterEpoch < 0
    || !sameSimulationReleaseRef(
      session.controlState.releaseRef,
      session.observableFrame.releaseRef,
    )
  ) throw hostErrorV1("hosted session identity mismatch");
  assertFrameAtStateV1(
    session.observableFrame,
    session.stateIdentity,
    session.controlState.releaseRef,
    "hosted session observable frame",
  );
}

function assertFrameAtStateV1(
  frame: MainWireScientificObservableFrameV1,
  state: Readonly<{ revision: number; acceptedTimeSec: number }>,
  releaseRef: SimulationReleaseRef,
  label: string,
): void {
  if (
    !hasExactKeysV1(frame, [
      "frameId",
      "registryId",
      "schemaVersion",
      "releaseRef",
      "sourceObservationId",
      "source",
      "revision",
      "acceptedTimeSec",
      "values",
    ])
    || frame.frameId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
    || frame.registryId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
    || frame.schemaVersion
      !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
    || frame.sourceObservationId
      !== "main-wire-scientific-session-observation-v1"
    || !isObservableFrameSourceV1(frame.source)
    || !Number.isSafeInteger(frame.revision)
    || frame.revision < 0
    || frame.revision !== state.revision
    || !Number.isFinite(frame.acceptedTimeSec)
    || frame.acceptedTimeSec < 0
    || !sameAcceptedTimeV1(frame.acceptedTimeSec, state.acceptedTimeSec)
    || !isSimulationReleaseRefV1(frame.releaseRef)
    || !sameSimulationReleaseRef(frame.releaseRef, releaseRef)
  ) throw hostErrorV1(`${label} accepted-state mismatch`);
  assertObservableCatalogV1(frame, label);
}

function assertObservableCatalogV1(
  frame: MainWireScientificObservableFrameV1,
  label: string,
): void {
  if (
    frame.values === null
    || typeof frame.values !== "object"
    || Array.isArray(frame.values)
  ) throw hostErrorV1(`${label} observable catalog mismatch`);
  const expectedIds = MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map(
    ({ observableId }) => observableId,
  );
  const actualIds = Object.keys(frame.values);
  if (
    actualIds.length !== expectedIds.length
    || expectedIds.some((observableId) =>
      !Object.prototype.hasOwnProperty.call(frame.values, observableId))
  ) throw hostErrorV1(`${label} observable catalog mismatch`);

  for (const definition of MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1) {
    const value = frame.values[definition.observableId];
    if (
      !hasExactKeysV1(value, [
        "observableId",
        "value",
        "availability",
        "quality",
      ])
      || value.observableId !== definition.observableId
      || !SCIENTIFIC_OBSERVABLE_AVAILABILITY_VALUES_V1.includes(
        value.availability,
      )
      || !SCIENTIFIC_OBSERVABLE_QUALITY_VALUES_V1.includes(value.quality)
    ) throw hostErrorV1(`${label} observable value mismatch`);
    assertObservableValueV1(definition, value, label);
  }
}

function assertObservableValueV1(
  definition: MainWireScientificObservableDefinitionV1,
  value: MainWireScientificObservableFrameV1["values"][keyof
    MainWireScientificObservableFrameV1["values"]],
  label: string,
): void {
  if (definition.modelingStatus === "not-modeled") {
    if (
      value.value !== null
      || value.availability !== "not-modeled"
      || value.quality !== "not-assessed"
    ) throw hostErrorV1(`${label} observable value mismatch`);
    return;
  }
  if (value.availability === "not-modeled") {
    throw hostErrorV1(`${label} observable value mismatch`);
  }
  if (value.availability !== "available") {
    if (value.value !== null || value.quality !== "not-assessed") {
      throw hostErrorV1(`${label} observable value mismatch`);
    }
    return;
  }
  const expectedQuality = definition.sourceKind === "accepted-state"
    ? "authoritative-state"
    : definition.sourceKind === "accepted-step-readback"
    ? "accepted-derived"
    : "solver-diagnostic";
  if (
    typeof value.value !== "number"
    || !Number.isFinite(value.value)
    || value.quality !== expectedQuality
  ) throw hostErrorV1(`${label} observable value mismatch`);
}

function isObservableFrameSourceV1(
  value: unknown,
): value is MainWireScientificObservableFrameV1["source"] {
  return value === "cold-initialization"
    || value === "accepted-step"
    || value === "exact-checkpoint-restore"
    || value === "research-control-state-fork";
}

function isSimulationReleaseRefV1(
  value: unknown,
): value is SimulationReleaseRef {
  return hasExactKeysV1(value, ["id", "version", "sha256"])
    && typeof value.id === "string"
    && value.id.length > 0
    && typeof value.version === "string"
    && value.version.length > 0
    && typeof value.sha256 === "string"
    && /^[0-9a-f]{64}$/.test(value.sha256);
}

function hasExactKeysV1(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value);
  return actual.length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function sameAcceptedStateIdentityV1(
  left: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }>,
  right: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }>,
): boolean {
  return left.revision === right.revision
    && sameAcceptedTimeV1(left.acceptedTimeSec, right.acceptedTimeSec)
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl;
}

function sameAcceptedTimeV1(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right)
      <= 1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}

function sameCanonicalV1(left: unknown, right: unknown): boolean {
  try {
    return canonicalJsonStringify(left) === canonicalJsonStringify(right);
  } catch {
    return false;
  }
}

function recordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw hostErrorV1(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertOwnedSessionV1(
  hostId: string,
  session: MainWireStudioHostedSessionV1,
): void {
  if (session.hostId !== hostId) {
    throw hostErrorV1(
      `session ${session.sessionId} belongs to ${session.hostId}, not ${hostId}`,
    );
  }
}

function commandErrorV1(
  response: ScientificCommandErrorResponseV1<unknown>,
): MainWireStudioSessionHostErrorV1 {
  return hostErrorV1(
    `${response.commandKind ?? "unknown command"}: ${response.error.code}: ${response.error.message}`,
  );
}

function hostErrorV1(message: string): MainWireStudioSessionHostErrorV1 {
  return new MainWireStudioSessionHostErrorV1(message);
}

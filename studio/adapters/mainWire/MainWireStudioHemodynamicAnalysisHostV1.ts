import {
  loadMainWireScientificResolvedSessionInputEnvelopeV1,
  type MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import type {
  MainWireScientificHemodynamicCalculationDetailV2,
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import {
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1";
import {
  MainWireScientificWorkerClientV1,
  type MainWireScientificWorkerClientStatusV1,
  type MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";
import type {
  ArtifactStorePortV1,
  RuntimeExecutionIdentityV1,
  StudioArtifactRefV1,
  StudioRunArtifactContentV1,
  StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";

import {
  loadMainWireStudioSnapshotEnvelopeV1,
  mainWireStudioExecutionIdentityV1,
} from "./MainWireStudioSnapshotEnvelopeV1";
import {
  loadStudioRunArtifactContentV1,
} from "./MainWireSimulationRuntimeAdapterV1";
import {
  mainWireStudioTargetInputSha256V1,
} from "./MainWireStudioTargetResolverV1";

export type MainWireStudioHemodynamicAnalysisClientV1 = Readonly<{
  status: MainWireScientificWorkerClientStatusV1;
  request(command: ScientificCommandV1):
    Promise<MainWireScientificWorkerResponseV1>;
  terminate(): void;
}>;

export type MainWireStudioHemodynamicAnalysisSourceIdentityV1 = Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
  parameterEpoch: number;
  controlStateSha256: string;
}>;

export type MainWireStudioHemodynamicAnalysisSessionV1 = Readonly<{
  sessionId: string;
  source: StudioSettledAnalysisSourceV1;
  sourceIdentity: MainWireStudioHemodynamicAnalysisSourceIdentityV1;
}>;

export type MainWireStudioHemodynamicAnalysisJobStartV1 = Readonly<{
  session: MainWireStudioHemodynamicAnalysisSessionV1;
  jobId: string;
  detailMode: MainWireScientificHemodynamicCalculationDetailV2;
  snapshot: MainWireScientificHemodynamicJobSnapshotV2;
  suggestedPollIntervalMs: number;
}>;

export type MainWireStudioHemodynamicAnalysisHostOptionsV1 = Readonly<{
  artifacts: ArtifactStorePortV1;
  createClient?: () => MainWireStudioHemodynamicAnalysisClientV1;
  hostId?: string;
}>;

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;
const SCIENTIFIC_WORKER_IDENTIFIER_MAXIMUM_LENGTH_V1 = 96;
let hostOrdinalV1 = 0;

/**
 * One persistent logical analysis host for a Studio scenario. In the product
 * runtime its short-lived client lease shares the scenario's live parent
 * Worker; source sessions remain independent exact V4 restores and the
 * compute-heavy bidirectional continuations stay in their own child Workers.
 */
export class MainWireStudioHemodynamicAnalysisHostV1 {
  readonly hostId: string;

  private readonly artifacts: ArtifactStorePortV1;
  private readonly createClient:
    () => MainWireStudioHemodynamicAnalysisClientV1;
  private client: MainWireStudioHemodynamicAnalysisClientV1 | null = null;
  private requestOrdinal = 0;
  private sessionOrdinal = 0;
  private terminated = false;

  constructor(options: MainWireStudioHemodynamicAnalysisHostOptionsV1) {
    this.artifacts = options.artifacts;
    this.createClient = options.createClient ?? createProductionClientV1;
    this.hostId = normalizedScientificWorkerHostIdV1(options.hostId);
  }

  async restoreSettledSource(
    source: StudioSettledAnalysisSourceV1,
  ): Promise<MainWireStudioHemodynamicAnalysisSessionV1> {
    this.assertOpenV1();
    assertSettledSourceV1(source);
    const [runExists, inputValue, snapshotValue] = await Promise.all([
      this.artifacts.has(source.sourceRunRef),
      this.artifacts.readJson(source.simulationInputRef),
      this.artifacts.readJson(source.snapshotRef),
    ]);
    if (!runExists) {
      throw hostErrorV1(
        `source run ${source.sourceRunRef.sha256} does not exist`,
      );
    }
    const runValue = await this.artifacts.readJson(source.sourceRunRef);
    const runContent = loadStudioRunArtifactContentV1(runValue);
    const resolvedSessionInput =
      await loadMainWireScientificResolvedSessionInputEnvelopeV1(
        inputValue,
      );
    const envelope = await loadMainWireStudioSnapshotEnvelopeV1(
      snapshotValue,
      {
        simulationInputRef: source.simulationInputRef,
        baseSessionInputSha256: resolvedSessionInput.sessionInputSha256,
      },
    );
    if (
      !sameSimulationReleaseRef(
        resolvedSessionInput.releaseRef,
        envelope.checkpointV4.releaseRef,
      )
    ) throw hostErrorV1("snapshot/input release identity mismatch");
    await assertSourceArtifactBindingsV1(
      source,
      resolvedSessionInput,
      envelope.checkpointV4,
    );
    await assertSourceRunLineageV1(
      this.artifacts,
      source,
      runContent,
    );
    this.assertOpenV1();

    // Artifact validation is intentionally complete before the Worker exists.
    const client = this.ensureClientV1();
    const sessionId =
      `${this.hostId}:source:${++this.sessionOrdinal}`;
    try {
      const response = await requestSuccessfulV1(
        client,
        Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "restoreExactSessionV4" as const,
          requestId: this.nextRequestIdV1("restore-v4"),
          sessionId,
          resolvedSessionInput,
          checkpoint: envelope.checkpointV4,
        }),
      );
      if (
        response.commandKind !== "restoreExactSessionV4"
        || response.payload.kind !== "sessionRestoredV4"
        || response.sessionId !== sessionId
        || response.sessionOrigin.kind
          !== "control-aware-exact-checkpoint-v4-restore"
      ) throw hostErrorV1("restore V4 receipt mismatch");

      const context = response.payload.researchControlContext;
      const checkpoint = envelope.checkpointV4;
      const totalBloodVolumeMl =
        resolvedSessionInput.initialization.fixedTotalBloodVolumeMl;
      if (
        response.sessionOrigin.checkpointSha256
          !== checkpoint.checkpointSha256
        || response.sessionOrigin.baseSessionInputSha256
          !== checkpoint.baseSessionInputSha256
        || response.sessionOrigin.controlTargetStateSha256
          !== checkpoint.controlTargetStateSha256
        || response.sessionOrigin.parameterEpoch !== checkpoint.parameterEpoch
        || !sameSimulationReleaseRef(response.releaseRef, checkpoint.releaseRef)
        || context.stateIdentity.revision !== checkpoint.transaction.revision
        || context.stateIdentity.acceptedTimeSec
          !== checkpoint.transaction.acceptedTimeSec
        || context.stateIdentity.totalBloodVolumeMl !== totalBloodVolumeMl
        || context.parameterEpoch !== checkpoint.parameterEpoch
        || context.controlState.targetStateSha256
          !== checkpoint.controlTargetStateSha256
        || response.payload.observableFrame.revision
          !== checkpoint.transaction.revision
        || response.payload.observableFrame.acceptedTimeSec
          !== checkpoint.transaction.acceptedTimeSec
      ) throw hostErrorV1("restore V4 accepted-state binding mismatch");

      return Object.freeze({
        sessionId,
        source,
        sourceIdentity: Object.freeze({
          revision: context.stateIdentity.revision,
          acceptedTimeSec: context.stateIdentity.acceptedTimeSec,
          totalBloodVolumeMl: context.stateIdentity.totalBloodVolumeMl,
          parameterEpoch: context.parameterEpoch,
          controlStateSha256: context.controlState.targetStateSha256,
        }),
      });
    } catch (error) {
      await this.disposeSessionIdBestEffortV1(sessionId);
      throw error;
    }
  }

  async startGuytonStarlingJob(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
    detailMode: MainWireScientificHemodynamicCalculationDetailV2,
  ): Promise<MainWireStudioHemodynamicAnalysisJobStartV1> {
    this.assertOpenV1();
    assertDetailModeV1(detailMode);
    try {
      const response = await requestSuccessfulV1(
        this.requiredClientV1(),
        Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "startGuytonStarlingProtocolJob" as const,
          requestId: this.nextRequestIdV1("guyton-start"),
          sessionId: session.sessionId,
          detailMode,
        }),
      );
      if (
        response.commandKind !== "startGuytonStarlingProtocolJob"
        || response.payload.kind !== "guytonStarlingProtocolJobStarted"
        || response.sessionId !== session.sessionId
      ) throw hostErrorV1("Guyton/Starling start receipt mismatch");
      const started = response.payload.job;
      assertJobSnapshotV1(
        started.snapshot,
        session,
        detailMode,
        started.jobId,
      );
      return Object.freeze({
        session,
        jobId: started.jobId,
        detailMode,
        snapshot: started.snapshot,
        suggestedPollIntervalMs: started.suggestedPollIntervalMs,
      });
    } catch (error) {
      await this.disposeSessionIdBestEffortV1(session.sessionId);
      throw error;
    }
  }

  async pollGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<MainWireScientificHemodynamicJobSnapshotV2> {
    this.assertOpenV1();
    const response = await requestSuccessfulV1(
      this.requiredClientV1(),
      Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "pollGuytonStarlingProtocolJob" as const,
        requestId: this.nextRequestIdV1("guyton-poll"),
        sessionId: job.session.sessionId,
        jobId: job.jobId,
      }),
    );
    if (
      response.commandKind !== "pollGuytonStarlingProtocolJob"
      || response.payload.kind !== "guytonStarlingProtocolJobProgress"
      || response.sessionId !== job.session.sessionId
    ) throw hostErrorV1("Guyton/Starling poll receipt mismatch");
    assertJobSnapshotV1(
      response.payload.snapshot,
      job.session,
      job.detailMode,
      job.jobId,
    );
    return response.payload.snapshot;
  }

  async cancelGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<void> {
    if (this.terminated || this.client?.status !== "open") return;
    const response = await requestSuccessfulV1(
      this.client,
      Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "cancelGuytonStarlingProtocolJob" as const,
        requestId: this.nextRequestIdV1("guyton-cancel"),
        sessionId: job.session.sessionId,
        jobId: job.jobId,
      }),
    );
    if (
      response.commandKind !== "cancelGuytonStarlingProtocolJob"
      || response.payload.kind !== "guytonStarlingProtocolJobCancelled"
      || response.sessionId !== job.session.sessionId
      || response.payload.snapshot.jobId !== job.jobId
    ) throw hostErrorV1("Guyton/Starling cancel receipt mismatch");
  }

  async disposeSession(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
  ): Promise<void> {
    if (this.terminated || this.client?.status !== "open") return;
    const client = this.client;
    try {
      const response = await requestSuccessfulV1(
        client,
        Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "disposeSession" as const,
          requestId: this.nextRequestIdV1("dispose-source"),
          sessionId: session.sessionId,
        }),
      );
      if (
        response.commandKind !== "disposeSession"
        || response.payload.kind !== "sessionDisposed"
        || response.payload.disposedSessionId !== session.sessionId
      ) throw hostErrorV1("analysis source disposal receipt mismatch");
      if (this.client === client) {
        client.terminate();
        this.client = null;
      }
    } catch (error) {
      if (this.client === client) {
        // The caller may intentionally treat cleanup as best effort. Keep that
        // safe by quarantining ownership here whenever the Worker did not
        // prove that the restored session was released.
        client.terminate();
        this.client = null;
      }
      throw error;
    }
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.client?.terminate();
    this.client = null;
  }

  private ensureClientV1(): MainWireStudioHemodynamicAnalysisClientV1 {
    if (this.client?.status === "open") return this.client;
    this.client?.terminate();
    const client = this.createClient();
    if (client.status !== "open") {
      client.terminate();
      throw hostErrorV1("analysis Worker client did not open");
    }
    this.client = client;
    return client;
  }

  private requiredClientV1(): MainWireStudioHemodynamicAnalysisClientV1 {
    if (this.client === null || this.client.status !== "open") {
      throw hostErrorV1("analysis Worker client is not open");
    }
    return this.client;
  }

  private assertOpenV1(): void {
    if (this.terminated) throw hostErrorV1("analysis host is terminated");
  }

  private async disposeSessionIdBestEffortV1(
    sessionId: string,
  ): Promise<void> {
    if (this.terminated || this.client?.status !== "open") return;
    const client = this.client;
    let cleanupConfirmed = false;
    try {
      const response = await requestSuccessfulV1(
        client,
        Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "disposeSession" as const,
          requestId: this.nextRequestIdV1("dispose-invalid-source"),
          sessionId,
        }),
      );
      cleanupConfirmed =
        response.commandKind === "disposeSession"
        && response.payload.kind === "sessionDisposed"
        && response.payload.disposedSessionId === sessionId;
    } catch {
      // The original malformed/failing receipt remains the actionable error.
    }
    if (!cleanupConfirmed && this.client === client) {
      // Session ownership is now uncertain. Quarantine this Worker rather than
      // reusing a client that may retain an untracked restored session. The
      // host itself stays open so a later request can allocate a fresh client.
      client.terminate();
      this.client = null;
    }
  }

  private nextRequestIdV1(operation: string): string {
    this.requestOrdinal += 1;
    return `${this.hostId}:${operation}:${this.requestOrdinal}`;
  }
}

function normalizedScientificWorkerHostIdV1(
  requested: string | undefined,
): string {
  const normalized = (requested ?? "")
    .trim()
    .replace(/[^A-Za-z0-9._:-]+/g, "-")
    .replace(/^[^A-Za-z0-9]+/, "")
    .slice(0, SCIENTIFIC_WORKER_IDENTIFIER_MAXIMUM_LENGTH_V1);
  return normalized.length > 0
    ? normalized
    : `main-wire-studio-analysis-${++hostOrdinalV1}`;
}

async function assertSourceArtifactBindingsV1(
  source: StudioSettledAnalysisSourceV1,
  resolvedInput: MainWireScientificResolvedSessionInputV1,
  checkpoint: Parameters<typeof mainWireStudioExecutionIdentityV1>[0],
): Promise<void> {
  if (
    resolvedInput.sessionInputSha256 !== checkpoint.baseSessionInputSha256
    || checkpoint.controlTargetStateSha256
      !== checkpoint.controlTargetState.targetStateSha256
    || !sameSimulationReleaseRef(
      resolvedInput.releaseRef,
      checkpoint.releaseRef,
    )
  ) throw hostErrorV1("checkpoint/base input binding mismatch");
  const targetInputSha256 = await mainWireStudioTargetInputSha256V1(
    checkpoint.controlTargetState,
    resolvedInput.sessionInputSha256,
  );
  if (targetInputSha256 !== source.targetInputSha256) {
    throw hostErrorV1("settled target input identity mismatch");
  }
  if (!sameExecutionIdentityV1(
    mainWireStudioExecutionIdentityV1(checkpoint),
    source.execution,
  )) throw hostErrorV1("settled execution identity mismatch");
}

async function assertSourceRunLineageV1(
  artifacts: ArtifactStorePortV1,
  source: StudioSettledAnalysisSourceV1,
  runContent: StudioRunArtifactContentV1,
): Promise<void> {
  if (
    !sameArtifactRefV1(
      runContent.simulationInputRef,
      source.simulationInputRef,
    )
    || !sameExecutionIdentityV1(runContent.execution, source.execution)
  ) throw hostErrorV1("settled source run lineage mismatch");
  if (
    source.sourceRole === "initial-settled-source"
    && (
      !sameArtifactRefV1(runContent.snapshotRef, source.snapshotRef)
      || runContent.targetInputSha256 !== source.targetInputSha256
    )
  ) throw hostErrorV1("initial settled source run binding mismatch");
  if (!await artifacts.has(runContent.sourceRunRef)) {
    throw hostErrorV1(
      `settled source run parent ${runContent.sourceRunRef.sha256} does not exist`,
    );
  }
}

function assertJobSnapshotV1(
  snapshot: MainWireScientificHemodynamicJobSnapshotV2,
  session: MainWireStudioHemodynamicAnalysisSessionV1,
  detailMode: MainWireScientificHemodynamicCalculationDetailV2,
  jobId: string,
): void {
  const source = session.sourceIdentity;
  if (
    snapshot.jobId !== jobId
    || snapshot.source.revision !== source.revision
    || snapshot.source.acceptedTimeSec !== source.acceptedTimeSec
    || snapshot.source.fixedTotalBloodVolumeMl !== source.totalBloodVolumeMl
    || snapshot.detailMode !== detailMode
  ) throw hostErrorV1("Guyton/Starling job source identity mismatch");
}

function assertSettledSourceV1(
  source: StudioSettledAnalysisSourceV1,
): void {
  if (
    source.scenarioId.trim().length === 0
    || !Number.isSafeInteger(source.targetGeneration)
    || source.targetGeneration < 0
    || (
      source.sourceRole !== "initial-settled-source"
      && source.sourceRole !== "automatic-strict-candidate"
      && source.sourceRole !== "promoted-settled-source"
    )
    || !SHA256_HEX_PATTERN_V1.test(source.targetInputSha256)
    || source.sourceRunRef.kind !== "run-artifact"
    || source.simulationInputRef.kind !== "simulation-input"
    || source.snapshotRef.kind !== "snapshot-envelope"
  ) throw hostErrorV1("settled source identity is invalid");
}

function assertDetailModeV1(
  value: MainWireScientificHemodynamicCalculationDetailV2,
): void {
  if (
    value !== "standard"
    && value !== "settled-reference"
    && value !== "compare"
  ) throw hostErrorV1("unsupported hemodynamic detail mode");
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

async function requestSuccessfulV1(
  client: MainWireStudioHemodynamicAnalysisClientV1,
  command: ScientificCommandV1,
): Promise<Extract<MainWireScientificWorkerResponseV1, { ok: true }>> {
  const response = await client.request(command);
  if (!response.ok) {
    throw hostErrorV1(`${response.error.code}: ${response.error.message}`);
  }
  return response;
}

function createProductionClientV1():
MainWireStudioHemodynamicAnalysisClientV1 {
  return new MainWireScientificWorkerClientV1({
    maximumPendingRequestCount: 2,
    maximumRequestCountPerClientLifetime:
      MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
        .maximumRequestCountPerLifetime,
    requestTimeoutMs: 3 * 60_000,
  });
}

function hostErrorV1(
  message: string,
): MainWireStudioHemodynamicAnalysisHostErrorV1 {
  return new MainWireStudioHemodynamicAnalysisHostErrorV1(message);
}

export class MainWireStudioHemodynamicAnalysisHostErrorV1 extends Error {
  constructor(message: string) {
    super(`MainWire Studio hemodynamic analysis failed: ${message}`);
    this.name = "MainWireStudioHemodynamicAnalysisHostErrorV1";
  }
}

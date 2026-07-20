import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  MainWireScientificPvRelationJobSnapshotV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";
import { SHA256_HEX_PATTERN } from "@/engine/scientific/release/sha256";
import type {
  ScientificCommandV1,
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import { SCIENTIFIC_COMMAND_PROTOCOL_V1_ID } from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";

import {
  SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1,
  type ScientificProductHemodynamicAnalysisBootstrapSourceV1,
  type ScientificProductHemodynamicAnalysisClientV1,
} from "./ScientificProductHemodynamicAnalysisCoordinatorV1";
import type {
  ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

/**
 * The target-state branch is the same release-bound warm-continuation route
 * used by Guyton/Starling. The distinct export keeps PV callbacks strongly
 * typed without inventing a second scientific provenance claim.
 */
export const SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1 =
  SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1;

export type ScientificProductPvRelationAnalysisRequestV1 = Readonly<{
  requestToken: string;
  targetControlState: MainWireScientificResearchControlTargetStateV0;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
}>;

export type ScientificProductPvRelationAnalysisSnapshotEventV1 = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
  provenance:
    typeof SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1;
  snapshot: MainWireScientificPvRelationJobSnapshotV1;
}>;

export type ScientificProductPvRelationAnalysisErrorPhaseV1 =
  | "request-validation"
  | "bootstrap"
  | "fork"
  | "settlement"
  | "job-start"
  | "job-poll";

export type ScientificProductPvRelationAnalysisErrorEventV1 = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
  provenance:
    typeof SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1;
  phase: ScientificProductPvRelationAnalysisErrorPhaseV1;
  message: string;
  previousSnapshotRetained: true;
}>;

export type ScientificProductPvRelationAnalysisCoordinatorOptionsV1 =
  Readonly<{
    caseEntry: ScientificProductCaseV1;
    createClient: () => ScientificProductHemodynamicAnalysisClientV1;
    loadBootstrapSource: (
      caseEntry: ScientificProductCaseV1,
      client: ScientificProductHemodynamicAnalysisClientV1,
    ) => Promise<ScientificProductHemodynamicAnalysisBootstrapSourceV1>;
    onJobSnapshot: (
      event: ScientificProductPvRelationAnalysisSnapshotEventV1,
    ) => void;
    onError: (event: ScientificProductPvRelationAnalysisErrorEventV1) => void;
    pollIntervalMs?: number;
  }>;

type RequestRecordV1 = ScientificProductPvRelationAnalysisRequestV1 &
  Readonly<{
    generation: number;
    validationError: string | null;
  }>;

type StableSourceV1 = Readonly<{
  sessionId: string;
  context: ScientificResearchControlContextV0;
}>;

type ActiveJobV1 = {
  ownerSessionId: string;
  jobId: string;
  targetControlStateSha256: string;
  snapshot: MainWireScientificPvRelationJobSnapshotV1;
  suggestedPollIntervalMs: number;
  lastPublishedRequestToken: string | null;
  lastPublishedSequence: number;
};

const MAXIMUM_SETTLEMENT_BEAT_COUNT_V1 = 32;
const MINIMUM_POLL_INTERVAL_MS_V1 = 100;
const MAXIMUM_POLL_INTERVAL_MS_V1 = 2_000;
let coordinatorOrdinalV1 = 0;

/**
 * Computes the latest live-transition target P1 on an independent Worker,
 * then starts the fixed-TBV PV relation protocol from that accepted state.
 * The visible scenario is never advanced or mutated by this coordinator.
 *
 * A request is latest-wins at every command/beat boundary. The last renderable
 * generation remains owned by the presentation reducer until a correlated
 * replacement produces enough evidence to render.
 */
export class ScientificProductPvRelationAnalysisCoordinatorV1 {
  private readonly caseEntry: ScientificProductCaseV1;
  private readonly createClient:
    ScientificProductPvRelationAnalysisCoordinatorOptionsV1["createClient"];
  private readonly loadBootstrapSource:
    ScientificProductPvRelationAnalysisCoordinatorOptionsV1[
      "loadBootstrapSource"
    ];
  private readonly onJobSnapshot:
    ScientificProductPvRelationAnalysisCoordinatorOptionsV1["onJobSnapshot"];
  private readonly onError:
    ScientificProductPvRelationAnalysisCoordinatorOptionsV1["onError"];
  private readonly defaultPollIntervalMs: number;
  private readonly coordinatorOrdinal = ++coordinatorOrdinalV1;

  private client: ScientificProductHemodynamicAnalysisClientV1 | null = null;
  private stableSource: StableSourceV1 | null = null;
  private candidate: StableSourceV1 | null = null;
  private activeJob: ActiveJobV1 | null = null;
  private latestRequest: RequestRecordV1 | null = null;
  private failedRequestGeneration: number | null = null;
  private requestGeneration = 0;
  private commandOrdinal = 0;
  private sessionOrdinal = 0;
  private driveRequested = false;
  private drivePromise: Promise<void> | null = null;
  private pollDue = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(
    options: ScientificProductPvRelationAnalysisCoordinatorOptionsV1,
  ) {
    this.caseEntry = options.caseEntry;
    this.createClient = options.createClient;
    this.loadBootstrapSource = options.loadBootstrapSource;
    this.onJobSnapshot = options.onJobSnapshot;
    this.onError = options.onError;
    this.defaultPollIntervalMs = boundedPollIntervalV1(
      options.pollIntervalMs ?? 125,
    );
  }

  requestLatest(request: ScientificProductPvRelationAnalysisRequestV1): void {
    if (this.disposed) return;
    if (
      sameRequestV1(this.latestRequest, request)
      && this.failedRequestGeneration !== this.latestRequest?.generation
    ) return;
    const previous = this.latestRequest;
    const generation = ++this.requestGeneration;
    this.latestRequest = Object.freeze({
      ...request,
      generation,
      validationError: validateRequestV1(request),
    });
    this.failedRequestGeneration = null;
    if (!sameComputationV1(previous, this.latestRequest)) {
      this.clearPollTimer();
      this.pollDue = false;
    }
    this.requestDrive();
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.requestGeneration += 1;
    this.latestRequest = null;
    this.driveRequested = false;
    this.pollDue = false;
    this.clearPollTimer();
    await this.drivePromise?.catch(() => undefined);
    const client = this.client;
    if (client !== null && client.status === "open") {
      await this.cancelActiveJobBestEffort();
      const sessions = new Set<string>();
      if (this.candidate !== null) sessions.add(this.candidate.sessionId);
      if (this.stableSource !== null) sessions.add(this.stableSource.sessionId);
      for (const sessionId of sessions) {
        await this.disposeSessionBestEffort(sessionId);
      }
    }
    this.activeJob = null;
    this.candidate = null;
    this.stableSource = null;
    client?.terminate();
    this.client = null;
  }

  private requestDrive(): void {
    if (this.disposed) return;
    this.driveRequested = true;
    if (this.drivePromise !== null) return;
    this.drivePromise = this.drive().catch(() => undefined).finally(() => {
      this.drivePromise = null;
      if (this.driveRequested && !this.disposed) this.requestDrive();
    });
  }

  private async drive(): Promise<void> {
    while (this.driveRequested && !this.disposed) {
      this.driveRequested = false;
      const request = this.latestRequest;
      if (request === null) return;
      if (this.failedRequestGeneration === request.generation) return;
      try {
        await this.reconcile(request);
      } catch (error) {
        await this.handleRequestFailure(request, error);
      }
    }
  }

  private async reconcile(request: RequestRecordV1): Promise<void> {
    if (request.validationError !== null) {
      await this.cancelActiveJobBestEffort();
      this.reportError(request, "request-validation", request.validationError);
      this.failedRequestGeneration = request.generation;
      return;
    }
    if (this.activeJob !== null) {
      if (activeJobMatchesRequestV1(this.activeJob, request)) {
        this.publishActiveJobForLatestRequest();
        if (this.activeJob.snapshot.status === "running" && this.pollDue) {
          this.pollDue = false;
          await this.pollActiveJob(request);
        }
        return;
      }
      await this.cancelActiveJobBestEffort();
      if (!this.requestIsCurrent(request)) return;
    }

    const source = await this.ensureStableSource(request);
    if (source === null || !this.requestIsCurrent(request)) return;
    if (
      source.context.controlState.targetStateSha256
        !== request.targetControlState.targetStateSha256
    ) {
      await this.transitionStableSource(request, source);
      if (!this.latestTargetMatches(request) || this.disposed) return;
    }
    const latest = this.latestRequest;
    if (
      latest === null
      || latest.validationError !== null
      || this.stableSource === null
      || this.stableSource.context.controlState.targetStateSha256
        !== latest.targetControlState.targetStateSha256
    ) return;
    await this.startJob(latest, this.stableSource);
  }

  private async ensureStableSource(
    request: RequestRecordV1,
  ): Promise<StableSourceV1 | null> {
    if (this.stableSource !== null) return this.stableSource;
    try {
      const client = this.ensureClient();
      const loaded = await this.loadBootstrapSource(this.caseEntry, client);
      assertBootstrapSourceV1(loaded);
      if (this.disposed) {
        await this.disposeSessionBestEffort(loaded.sessionId);
        return null;
      }
      this.stableSource = Object.freeze({
        sessionId: loaded.sessionId,
        context: loaded.context,
      });
      return this.stableSource;
    } catch (error) {
      this.reportError(request, "bootstrap", errorMessageV1(error));
      this.failedRequestGeneration = request.generation;
      if (this.client?.status !== "open") {
        this.client?.terminate();
        this.client = null;
      }
      return null;
    }
  }

  private async transitionStableSource(
    request: RequestRecordV1,
    source: StableSourceV1,
  ): Promise<void> {
    const client = this.requiredOpenClient();
    const targetSessionId = this.nextSessionId("target");
    let response: MainWireScientificWorkerResponseV1;
    try {
      response = await client.request(Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "forkResearchControlSession" as const,
        requestId: this.nextRequestId("fork"),
        sessionId: targetSessionId,
        sourceSessionId: source.sessionId,
        expectedSource: Object.freeze({
          ...source.context.stateIdentity,
          controlStateSha256: source.context.controlState.targetStateSha256,
          parameterEpoch: source.context.parameterEpoch,
        }),
        targetControlState: request.targetControlState,
      }));
    } catch (error) {
      throw phaseErrorV1("fork", errorMessageV1(error));
    }
    if (
      !response.ok
      || response.commandKind !== "forkResearchControlSession"
      || response.payload.kind !== "researchControlSessionForked"
    ) throw phaseErrorV1("fork", commandErrorMessageV1(response));
    if (
      response.payload.sourceSessionId !== source.sessionId
      || response.payload.targetControlState.targetStateSha256
        !== request.targetControlState.targetStateSha256
      || response.payload.parameterEpoch !== source.context.parameterEpoch + 1
    ) throw phaseErrorV1("fork", "hidden PV target identity mismatch");

    const candidate = Object.freeze({
      sessionId: targetSessionId,
      context: Object.freeze({
        stateIdentity: response.payload.targetStateIdentity,
        controlState: response.payload.targetControlState,
        parameterEpoch: response.payload.parameterEpoch,
      }),
    });
    this.candidate = candidate;
    if (!this.latestTargetMatches(request) || this.disposed) {
      await this.disposeCandidateStrict(candidate);
      return;
    }

    for (
      let beatIndex = 0;
      beatIndex < MAXIMUM_SETTLEMENT_BEAT_COUNT_V1;
      beatIndex += 1
    ) {
      let settled: MainWireScientificWorkerResponseV1;
      try {
        settled = await client.request(Object.freeze({
          protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
          kind: "settlePeriodic" as const,
          requestId: this.nextRequestId(`settle-${beatIndex + 1}`),
          sessionId: candidate.sessionId,
        }));
      } catch (error) {
        throw phaseErrorV1("settlement", errorMessageV1(error));
      }
      if (
        !settled.ok
        || settled.commandKind !== "settlePeriodic"
        || settled.payload.kind !== "periodic-settlement-progress"
      ) throw phaseErrorV1("settlement", commandErrorMessageV1(settled));
      if (!this.latestTargetMatches(request) || this.disposed) {
        await this.disposeCandidateStrict(candidate);
        return;
      }
      if (settled.payload.status === "period1-converged") {
        if (
          !settled.payload.periodicSteadyStateClaimed
          || settled.payload.period2OrbitSuspected
        ) {
          throw phaseErrorV1(
            "settlement",
            "hidden PV target carried inconsistent periodic evidence",
          );
        }
        const promoted: StableSourceV1 = Object.freeze({
          sessionId: candidate.sessionId,
          context: Object.freeze({
            stateIdentity: Object.freeze({
              revision: settled.payload.finalObservableFrame.revision,
              acceptedTimeSec:
                settled.payload.finalObservableFrame.acceptedTimeSec,
              totalBloodVolumeMl:
                candidate.context.stateIdentity.totalBloodVolumeMl,
            }),
            controlState: candidate.context.controlState,
            parameterEpoch: candidate.context.parameterEpoch,
          }),
        });
        await this.disposeSessionStrict(source.sessionId);
        this.stableSource = promoted;
        this.candidate = null;
        return;
      }
      if (settled.payload.status !== "tracking") {
        throw phaseErrorV1(
          "settlement",
          settled.payload.status === "period2-suspect"
            ? "hidden PV target reached a period-2-suspect orbit"
            : "hidden PV target reached the bounded settlement cap without P1",
        );
      }
    }
    throw phaseErrorV1(
      "settlement",
      "hidden PV target exceeded the 32-beat P1 settlement bound",
    );
  }

  private async startJob(
    request: RequestRecordV1,
    source: StableSourceV1,
  ): Promise<void> {
    let response: MainWireScientificWorkerResponseV1;
    try {
      response = await this.requiredOpenClient().request(Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "startPvRelationsProtocolJob" as const,
        requestId: this.nextRequestId("job-start"),
        sessionId: source.sessionId,
      }));
    } catch (error) {
      throw phaseErrorV1("job-start", errorMessageV1(error));
    }
    if (
      !response.ok
      || response.commandKind !== "startPvRelationsProtocolJob"
      || response.payload.kind !== "pvRelationsProtocolJobStarted"
    ) throw phaseErrorV1("job-start", commandErrorMessageV1(response));
    const started = response.payload.job;
    assertJobSnapshotMatchesSourceV1(started.snapshot, source);
    this.activeJob = {
      ownerSessionId: source.sessionId,
      jobId: started.jobId,
      targetControlStateSha256:
        request.targetControlState.targetStateSha256,
      snapshot: started.snapshot,
      suggestedPollIntervalMs: boundedPollIntervalV1(
        started.suggestedPollIntervalMs || this.defaultPollIntervalMs,
      ),
      lastPublishedRequestToken: null,
      lastPublishedSequence: -1,
    };
    if (!this.requestIsCurrent(request)) {
      await this.cancelActiveJobBestEffort();
      return;
    }
    if (started.snapshot.status === "error") {
      this.activeJob = null;
      this.reportError(
        request,
        "job-start",
        started.snapshot.errorMessage ?? "hidden PV relation job failed",
      );
      this.failedRequestGeneration = request.generation;
      return;
    }
    if (started.snapshot.status === "cancelled") {
      throw phaseErrorV1("job-start", "hidden PV relation job was cancelled");
    }
    this.publishActiveJobForLatestRequest();
    if (started.snapshot.status === "running") {
      this.schedulePoll(this.activeJob.suggestedPollIntervalMs);
    }
  }

  private async pollActiveJob(request: RequestRecordV1): Promise<void> {
    const job = this.activeJob;
    if (job === null || !activeJobMatchesRequestV1(job, request)) return;
    let response: MainWireScientificWorkerResponseV1;
    try {
      response = await this.requiredOpenClient().request(Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "pollPvRelationsProtocolJob" as const,
        requestId: this.nextRequestId("job-poll"),
        sessionId: job.ownerSessionId,
        jobId: job.jobId,
      }));
    } catch (error) {
      throw phaseErrorV1("job-poll", errorMessageV1(error));
    }
    if (
      !response.ok
      || response.commandKind !== "pollPvRelationsProtocolJob"
      || response.payload.kind !== "pvRelationsProtocolJobProgress"
    ) throw phaseErrorV1("job-poll", commandErrorMessageV1(response));
    const snapshot = response.payload.snapshot;
    if (snapshot.jobId !== job.jobId || snapshot.sequence < job.snapshot.sequence) {
      throw phaseErrorV1("job-poll", "hidden PV job progress identity regressed");
    }
    job.snapshot = snapshot;
    if (!this.requestIsCurrent(request)) return;
    if (snapshot.status === "error") {
      this.activeJob = null;
      this.reportError(
        request,
        "job-poll",
        snapshot.errorMessage ?? "hidden PV relation job failed",
      );
      this.failedRequestGeneration = request.generation;
      return;
    }
    if (snapshot.status === "cancelled") {
      throw phaseErrorV1("job-poll", "hidden PV relation job was cancelled");
    }
    this.publishActiveJobForLatestRequest();
    if (snapshot.status === "running") {
      this.schedulePoll(job.suggestedPollIntervalMs);
    }
  }

  private publishActiveJobForLatestRequest(): void {
    const request = this.latestRequest;
    const job = this.activeJob;
    if (
      request === null
      || job === null
      || request.validationError !== null
      || !activeJobMatchesRequestV1(job, request)
      || this.disposed
    ) return;
    if (
      job.lastPublishedRequestToken === request.requestToken
      && job.lastPublishedSequence === job.snapshot.sequence
    ) return;
    job.lastPublishedRequestToken = request.requestToken;
    job.lastPublishedSequence = job.snapshot.sequence;
    callSafelyV1(this.onJobSnapshot, Object.freeze({
      requestToken: request.requestToken,
      visibleParameterEpoch: request.visibleParameterEpoch,
      visibleControlStateSha256: request.visibleControlStateSha256,
      provenance: SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
      snapshot: job.snapshot,
    }));
  }

  private async handleRequestFailure(
    request: RequestRecordV1,
    error: unknown,
  ): Promise<void> {
    const candidate = this.candidate;
    if (candidate !== null) {
      const disposed = await this.disposeSessionBestEffort(candidate.sessionId);
      this.candidate = null;
      if (!disposed) this.resetClientAfterUnsafeCleanup();
    }
    const phased = phaseOfErrorV1(error);
    if (phased.phase === "job-start" || phased.phase === "job-poll") {
      await this.cancelActiveJobBestEffort();
    }
    if (!this.requestIsCurrent(request)) return;
    this.reportError(request, phased.phase, phased.message);
    this.failedRequestGeneration = request.generation;
  }

  private reportError(
    request: RequestRecordV1,
    phase: ScientificProductPvRelationAnalysisErrorPhaseV1,
    message: string,
  ): void {
    if (!this.requestIsCurrent(request)) return;
    callSafelyV1(this.onError, Object.freeze({
      requestToken: request.requestToken,
      visibleParameterEpoch: request.visibleParameterEpoch,
      visibleControlStateSha256: request.visibleControlStateSha256,
      provenance: SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1,
      phase,
      message,
      previousSnapshotRetained: true as const,
    }));
  }

  private async cancelActiveJobBestEffort(): Promise<void> {
    this.clearPollTimer();
    this.pollDue = false;
    const job = this.activeJob;
    this.activeJob = null;
    const client = this.client;
    if (
      job === null
      || job.snapshot.status !== "running"
      || client === null
      || client.status !== "open"
    ) return;
    await client.request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "cancelPvRelationsProtocolJob" as const,
      requestId: this.nextRequestId("job-cancel"),
      sessionId: job.ownerSessionId,
      jobId: job.jobId,
    })).catch(() => undefined);
  }

  private async disposeCandidateStrict(candidate: StableSourceV1): Promise<void> {
    await this.disposeSessionStrict(candidate.sessionId);
    if (this.candidate?.sessionId === candidate.sessionId) this.candidate = null;
  }

  private async disposeSessionStrict(sessionId: string): Promise<void> {
    const response = await this.requiredOpenClient().request(Object.freeze({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession" as const,
      requestId: this.nextRequestId("session-dispose"),
      sessionId,
    }));
    if (
      !response.ok
      || response.commandKind !== "disposeSession"
      || response.payload.kind !== "sessionDisposed"
      || response.payload.disposedSessionId !== sessionId
    ) throw new Error(`hidden PV session ${sessionId} could not be disposed`);
  }

  private async disposeSessionBestEffort(sessionId: string): Promise<boolean> {
    const client = this.client;
    if (client === null || client.status !== "open") return false;
    try {
      const response = await client.request(Object.freeze({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: "disposeSession" as const,
        requestId: this.nextRequestId("session-dispose"),
        sessionId,
      }));
      return response.ok
        && response.commandKind === "disposeSession"
        && response.payload.kind === "sessionDisposed"
        && response.payload.disposedSessionId === sessionId;
    } catch {
      return false;
    }
  }

  private resetClientAfterUnsafeCleanup(): void {
    this.client?.terminate();
    this.client = null;
    this.stableSource = null;
    this.candidate = null;
    this.activeJob = null;
  }

  private ensureClient(): ScientificProductHemodynamicAnalysisClientV1 {
    if (this.client?.status === "open") return this.client;
    this.client?.terminate();
    const client = this.createClient();
    if (client.status !== "open") {
      client.terminate();
      throw new Error("hidden PV analysis client did not open");
    }
    this.client = client;
    return client;
  }

  private requiredOpenClient(): ScientificProductHemodynamicAnalysisClientV1 {
    if (this.client === null || this.client.status !== "open") {
      throw new Error("hidden PV analysis client is not open");
    }
    return this.client;
  }

  private requestIsCurrent(request: RequestRecordV1): boolean {
    return !this.disposed
      && this.latestRequest?.generation === request.generation;
  }

  private latestTargetMatches(request: RequestRecordV1): boolean {
    const latest = this.latestRequest;
    return !this.disposed
      && latest !== null
      && latest.validationError === null
      && latest.targetControlState.targetStateSha256
        === request.targetControlState.targetStateSha256;
  }

  private schedulePoll(delayMs: number): void {
    if (this.disposed) return;
    this.clearPollTimer();
    this.pollTimer = globalThis.setTimeout(() => {
      this.pollTimer = null;
      this.pollDue = true;
      this.requestDrive();
    }, boundedPollIntervalV1(delayMs));
  }

  private clearPollTimer(): void {
    if (this.pollTimer !== null) globalThis.clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }

  private nextRequestId(action: string): string {
    this.commandOrdinal += 1;
    return `hidden-pv-${this.coordinatorOrdinal}:${action}:${this.commandOrdinal}`;
  }

  private nextSessionId(role: string): string {
    this.sessionOrdinal += 1;
    return `hidden-pv-${this.coordinatorOrdinal}-${role}-${this.sessionOrdinal}`;
  }
}

function validateRequestV1(
  request: ScientificProductPvRelationAnalysisRequestV1,
): string | null {
  if (request.requestToken.trim().length === 0) {
    return "hidden PV request token must not be empty";
  }
  if (
    !Number.isSafeInteger(request.visibleParameterEpoch)
    || request.visibleParameterEpoch < 0
  ) return "visible parameter epoch must be a non-negative safe integer";
  if (!SHA256_HEX_PATTERN.test(request.visibleControlStateSha256)) {
    return "visible control-state identity must be a lowercase SHA-256 digest";
  }
  if (
    request.visibleControlStateSha256
      !== request.targetControlState.targetStateSha256
  ) return "visible and complete target control-state identities do not match";
  return null;
}

function sameRequestV1(
  previous: RequestRecordV1 | null,
  next: ScientificProductPvRelationAnalysisRequestV1,
): boolean {
  return previous !== null
    && previous.requestToken === next.requestToken
    && previous.visibleParameterEpoch === next.visibleParameterEpoch
    && previous.visibleControlStateSha256 === next.visibleControlStateSha256
    && previous.targetControlState.targetStateSha256
      === next.targetControlState.targetStateSha256;
}

function sameComputationV1(
  previous: RequestRecordV1 | null,
  next: RequestRecordV1 | null,
): boolean {
  return previous !== null
    && next !== null
    && previous.validationError === null
    && next.validationError === null
    && previous.targetControlState.targetStateSha256
      === next.targetControlState.targetStateSha256;
}

function assertBootstrapSourceV1(
  source: ScientificProductHemodynamicAnalysisBootstrapSourceV1,
): void {
  if (source.sessionId.trim().length === 0) {
    throw new Error("hidden PV bootstrap returned an empty session id");
  }
  if (!SHA256_HEX_PATTERN.test(source.context.controlState.targetStateSha256)) {
    throw new Error("hidden PV bootstrap returned an invalid control digest");
  }
  const state = source.context.stateIdentity;
  if (
    !Number.isSafeInteger(state.revision)
    || state.revision < 0
    || !Number.isFinite(state.acceptedTimeSec)
    || !Number.isFinite(state.totalBloodVolumeMl)
    || state.totalBloodVolumeMl <= 0
  ) throw new Error("hidden PV bootstrap returned invalid state identity");
}

function assertJobSnapshotMatchesSourceV1(
  snapshot: MainWireScientificPvRelationJobSnapshotV1,
  source: StableSourceV1,
): void {
  const expected = source.context.stateIdentity;
  if (
    snapshot.source.revision !== expected.revision
    || snapshot.source.acceptedTimeSec !== expected.acceptedTimeSec
    || snapshot.source.fixedTotalBloodVolumeMl !== expected.totalBloodVolumeMl
  ) throw phaseErrorV1("job-start", "hidden PV job source identity mismatch");
}

function activeJobMatchesRequestV1(
  job: ActiveJobV1,
  request: RequestRecordV1,
): boolean {
  return job.targetControlStateSha256
    === request.targetControlState.targetStateSha256;
}

function boundedPollIntervalV1(value: number): number {
  if (!Number.isFinite(value)) return 125;
  return Math.max(
    MINIMUM_POLL_INTERVAL_MS_V1,
    Math.min(MAXIMUM_POLL_INTERVAL_MS_V1, Math.round(value)),
  );
}

function commandErrorMessageV1(
  response: MainWireScientificWorkerResponseV1,
): string {
  return response.ok
    ? `unexpected ${response.commandKind} response payload`
    : `${response.error.code}: ${response.error.message}`;
}

type PhaseErrorV1 = Error & Readonly<{
  analysisPhase: ScientificProductPvRelationAnalysisErrorPhaseV1;
}>;

function phaseErrorV1(
  phase: ScientificProductPvRelationAnalysisErrorPhaseV1,
  message: string,
): PhaseErrorV1 {
  return Object.assign(new Error(message), { analysisPhase: phase });
}

function phaseOfErrorV1(error: unknown): Readonly<{
  phase: ScientificProductPvRelationAnalysisErrorPhaseV1;
  message: string;
}> {
  if (
    error instanceof Error
    && "analysisPhase" in error
    && typeof error.analysisPhase === "string"
  ) {
    return Object.freeze({
      phase: error.analysisPhase as ScientificProductPvRelationAnalysisErrorPhaseV1,
      message: error.message,
    });
  }
  return Object.freeze({
    phase: "settlement" as const,
    message: errorMessageV1(error),
  });
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function callSafelyV1<T>(callback: (value: T) => void, value: T): void {
  try {
    callback(value);
  } catch {
    // Presentation callbacks cannot own hidden session cleanup.
  }
}

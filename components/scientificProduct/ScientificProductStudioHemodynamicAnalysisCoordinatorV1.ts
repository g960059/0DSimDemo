import type {
  MainWireScientificHemodynamicCalculationDetailV2,
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";
import {
  MainWireStudioHemodynamicAnalysisHostV1,
  type MainWireStudioHemodynamicAnalysisJobStartV1,
  type MainWireStudioHemodynamicAnalysisSessionV1,
  type MainWireStudioHemodynamicAnalysisSourceIdentityV1,
} from "@/studio/adapters/mainWire/MainWireStudioHemodynamicAnalysisHostV1";

export type ScientificProductStudioHemodynamicAnalysisRequestV1 =
  Readonly<{
    requestToken: string;
    source: StudioSettledAnalysisSourceV1;
    detailMode: MainWireScientificHemodynamicCalculationDetailV2;
  }>;

export type ScientificProductStudioHemodynamicAnalysisSnapshotEventV1 =
  Readonly<{
    requestToken: string;
    source: StudioSettledAnalysisSourceV1;
    sourceIdentity: MainWireStudioHemodynamicAnalysisSourceIdentityV1;
    detailMode: MainWireScientificHemodynamicCalculationDetailV2;
    snapshot: MainWireScientificHemodynamicJobSnapshotV2;
  }>;

export type ScientificProductStudioHemodynamicAnalysisErrorEventV1 =
  Readonly<{
    requestToken: string;
    source: StudioSettledAnalysisSourceV1;
    detailMode: MainWireScientificHemodynamicCalculationDetailV2;
    message: string;
    previousSnapshotRetained: true;
  }>;

export type ScientificProductStudioHemodynamicAnalysisHostV1 = Readonly<{
  restoreSettledSource(
    source: StudioSettledAnalysisSourceV1,
  ): Promise<MainWireStudioHemodynamicAnalysisSessionV1>;
  startGuytonStarlingJob(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
    detailMode: MainWireScientificHemodynamicCalculationDetailV2,
  ): Promise<MainWireStudioHemodynamicAnalysisJobStartV1>;
  pollGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<MainWireScientificHemodynamicJobSnapshotV2>;
  cancelGuytonStarlingJob(
    job: MainWireStudioHemodynamicAnalysisJobStartV1,
  ): Promise<void>;
  disposeSession(
    session: MainWireStudioHemodynamicAnalysisSessionV1,
  ): Promise<void>;
  terminate(): void;
}>;

export type ScientificProductStudioHemodynamicAnalysisCoordinatorOptionsV1 =
  Readonly<{
    host: ScientificProductStudioHemodynamicAnalysisHostV1;
    onSnapshot(
      event: ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
    ): void;
    onError(
      event: ScientificProductStudioHemodynamicAnalysisErrorEventV1,
    ): void;
    pollIntervalMs?: number;
  }>;

type RequestRecordV1 =
  ScientificProductStudioHemodynamicAnalysisRequestV1 & Readonly<{
    generation: number;
    sourceIdentityKey: string;
  }>;

type ActiveJobV1 = {
  session: MainWireStudioHemodynamicAnalysisSessionV1;
  job: MainWireStudioHemodynamicAnalysisJobStartV1;
  detailMode: MainWireScientificHemodynamicCalculationDetailV2;
  sourceIdentityKey: string;
  snapshot: MainWireScientificHemodynamicJobSnapshotV2;
  suggestedPollIntervalMs: number;
  lastPublishedRequestToken: string | null;
};

const MINIMUM_POLL_INTERVAL_MS_V1 = 50;
const MAXIMUM_POLL_INTERVAL_MS_V1 = 2_000;

/**
 * Latest-only orchestration over one scenario-owned persistent analysis
 * Worker. All commands are serialized. A superseded restore/job is cancelled
 * and disposed before the next exact settled source can publish.
 */
export class ScientificProductStudioHemodynamicAnalysisCoordinatorV1 {
  private readonly host: ScientificProductStudioHemodynamicAnalysisHostV1;
  private readonly onSnapshot:
    ScientificProductStudioHemodynamicAnalysisCoordinatorOptionsV1[
      "onSnapshot"
    ];
  private readonly onError:
    ScientificProductStudioHemodynamicAnalysisCoordinatorOptionsV1["onError"];
  private readonly defaultPollIntervalMs: number;

  private latestRequest: RequestRecordV1 | null = null;
  private activeJob: ActiveJobV1 | null = null;
  private requestGeneration = 0;
  private driveRequested = false;
  private drivePromise: Promise<void> | null = null;
  private pollDue = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private disposePromise: Promise<void> | null = null;
  private disposed = false;

  constructor(
    options: ScientificProductStudioHemodynamicAnalysisCoordinatorOptionsV1,
  ) {
    this.host = options.host;
    this.onSnapshot = options.onSnapshot;
    this.onError = options.onError;
    this.defaultPollIntervalMs = boundedPollIntervalV1(
      options.pollIntervalMs ?? 250,
    );
  }

  requestLatest(
    request: ScientificProductStudioHemodynamicAnalysisRequestV1,
  ): void {
    if (this.disposed) return;
    assertRequestV1(request);
    const sourceIdentityKey =
      studioSettledAnalysisSourceIdentityKeyV1(request.source);
    if (
      this.latestRequest?.requestToken === request.requestToken
      && this.latestRequest.sourceIdentityKey === sourceIdentityKey
      && this.latestRequest.detailMode === request.detailMode
    ) return;
    this.latestRequest = Object.freeze({
      ...request,
      generation: ++this.requestGeneration,
      sourceIdentityKey,
    });
    this.clearPollTimerV1();
    this.pollDue = false;
    this.requestDriveV1();
  }

  clearDemand(): void {
    if (this.disposed || this.latestRequest === null) return;
    this.latestRequest = null;
    this.requestGeneration += 1;
    this.clearPollTimerV1();
    this.pollDue = false;
    this.requestDriveV1();
  }

  dispose(): Promise<void> {
    if (this.disposePromise !== null) return this.disposePromise;
    this.disposed = true;
    this.latestRequest = null;
    this.requestGeneration += 1;
    this.driveRequested = false;
    this.clearPollTimerV1();
    this.disposePromise = (async () => {
      // Terminating first rejects any in-flight Worker request immediately.
      // Otherwise a route change could wait for the request timeout before the
      // drive can be joined.
      this.host.terminate();
      await this.drivePromise?.catch(() => undefined);
      await this.releaseActiveJobBestEffortV1();
    })();
    return this.disposePromise;
  }

  private requestDriveV1(): void {
    if (this.disposed) return;
    this.driveRequested = true;
    if (this.drivePromise !== null) return;
    this.drivePromise = this.driveV1().finally(() => {
      this.drivePromise = null;
      if (this.driveRequested && !this.disposed) this.requestDriveV1();
    });
  }

  private async driveV1(): Promise<void> {
    while (this.driveRequested && !this.disposed) {
      this.driveRequested = false;
      const request = this.latestRequest;
      if (request === null) {
        await this.releaseActiveJobBestEffortV1();
        continue;
      }
      try {
        await this.reconcileV1(request);
      } catch (error) {
        if (this.requestIsCurrentV1(request)) {
          await this.releaseActiveJobBestEffortV1();
          try {
            this.onError(Object.freeze({
              requestToken: request.requestToken,
              source: request.source,
              detailMode: request.detailMode,
              message: errorMessageV1(error),
              previousSnapshotRetained: true as const,
            }));
          } catch {
            // A presentation callback cannot invalidate Worker ownership or
            // turn a handled analysis failure into an unhandled drive reject.
          }
        }
      }
    }
  }

  private async reconcileV1(request: RequestRecordV1): Promise<void> {
    const active = this.activeJob;
    if (
      active !== null
      && active.sourceIdentityKey === request.sourceIdentityKey
      && detailModeSatisfiesV1(active.detailMode, request.detailMode)
    ) {
      this.publishActiveV1(request, active);
      if (active.snapshot.status === "running" && this.pollDue) {
        this.pollDue = false;
        await this.pollActiveV1(request, active);
      } else if (
        active.snapshot.status === "running"
        && this.pollTimer === null
      ) {
        // A new request token for the same settled source clears the old
        // timer. Reusing the compatible job must also restart its polling;
        // otherwise a still-running persistent Worker becomes permanently
        // silent after the token hand-off.
        this.schedulePollV1(active.suggestedPollIntervalMs);
      }
      return;
    }
    if (active !== null) {
      await this.releaseActiveJobBestEffortV1();
      if (!this.requestIsCurrentV1(request)) return;
    }

    const session = await this.host.restoreSettledSource(request.source);
    if (!this.requestIsCurrentV1(request)) {
      await this.host.disposeSession(session).catch(() => undefined);
      return;
    }
    let started: MainWireStudioHemodynamicAnalysisJobStartV1;
    try {
      started = await this.host.startGuytonStarlingJob(
        session,
        request.detailMode,
      );
    } catch (error) {
      await this.host.disposeSession(session).catch(() => undefined);
      throw error;
    }
    if (!this.requestIsCurrentV1(request)) {
      await this.host.cancelGuytonStarlingJob(started).catch(() => undefined);
      await this.host.disposeSession(session).catch(() => undefined);
      return;
    }
    const next: ActiveJobV1 = {
      session,
      job: started,
      detailMode: request.detailMode,
      sourceIdentityKey: request.sourceIdentityKey,
      snapshot: started.snapshot,
      suggestedPollIntervalMs: boundedPollIntervalV1(
        started.suggestedPollIntervalMs || this.defaultPollIntervalMs,
      ),
      lastPublishedRequestToken: null,
    };
    this.activeJob = next;
    this.publishActiveV1(request, next);
    if (next.snapshot.status === "running") {
      this.schedulePollV1(next.suggestedPollIntervalMs);
    }
  }

  private async pollActiveV1(
    request: RequestRecordV1,
    active: ActiveJobV1,
  ): Promise<void> {
    const snapshot = await this.host.pollGuytonStarlingJob(active.job);
    if (
      !this.requestIsCurrentV1(request)
      || this.activeJob !== active
    ) return;
    if (snapshot.sequence < active.snapshot.sequence) {
      throw new Error("analysis Worker returned a stale job sequence");
    }
    active.snapshot = snapshot;
    active.lastPublishedRequestToken = null;
    this.publishActiveV1(request, active);
    if (snapshot.status === "running") {
      this.schedulePollV1(active.suggestedPollIntervalMs);
    }
  }

  private publishActiveV1(
    request: RequestRecordV1,
    active: ActiveJobV1,
  ): void {
    if (
      !this.requestIsCurrentV1(request)
      || active.lastPublishedRequestToken === request.requestToken
    ) return;
    active.lastPublishedRequestToken = request.requestToken;
    try {
      this.onSnapshot(Object.freeze({
        requestToken: request.requestToken,
        source: request.source,
        sourceIdentity: active.session.sourceIdentity,
        detailMode: active.detailMode,
        snapshot: active.snapshot,
      }));
    } catch {
      // Registry/UI listeners are outside scientific job ownership. A render
      // callback bug must not cancel an otherwise valid persistent sweep.
    }
  }

  private async releaseActiveJobBestEffortV1(): Promise<void> {
    const active = this.activeJob;
    this.activeJob = null;
    if (active === null) return;
    this.clearPollTimerV1();
    if (active.snapshot.status === "running") {
      await this.host.cancelGuytonStarlingJob(active.job)
        .catch(() => undefined);
    }
    await this.host.disposeSession(active.session).catch(() => undefined);
  }

  private requestIsCurrentV1(request: RequestRecordV1): boolean {
    return !this.disposed
      && this.latestRequest?.generation === request.generation;
  }

  private schedulePollV1(delayMs: number): void {
    if (this.disposed) return;
    this.clearPollTimerV1();
    this.pollTimer = globalThis.setTimeout(() => {
      this.pollTimer = null;
      this.pollDue = true;
      this.requestDriveV1();
    }, boundedPollIntervalV1(delayMs));
  }

  private clearPollTimerV1(): void {
    if (this.pollTimer !== null) globalThis.clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }
}

export function studioSettledAnalysisSourceIdentityKeyV1(
  source: StudioSettledAnalysisSourceV1,
): string {
  return [
    source.scenarioId,
    source.targetGeneration,
    source.targetInputSha256,
    source.sourceRunRef.sha256,
    source.simulationInputRef.sha256,
    source.snapshotRef.sha256,
    source.execution.modelRef,
    source.execution.runtimeRef,
    source.execution.solverRef,
    source.execution.stateCodecRef,
    source.execution.protocolRef,
  ].join(":");
}

export function createScientificProductStudioHemodynamicAnalysisCoordinatorV1(
  input: Omit<
    ScientificProductStudioHemodynamicAnalysisCoordinatorOptionsV1,
    "host"
  > & Readonly<{
    hostOptions: ConstructorParameters<
      typeof MainWireStudioHemodynamicAnalysisHostV1
    >[0];
  }>,
): ScientificProductStudioHemodynamicAnalysisCoordinatorV1 {
  return new ScientificProductStudioHemodynamicAnalysisCoordinatorV1({
    host: new MainWireStudioHemodynamicAnalysisHostV1(input.hostOptions),
    onSnapshot: input.onSnapshot,
    onError: input.onError,
    pollIntervalMs: input.pollIntervalMs,
  });
}

function assertRequestV1(
  request: ScientificProductStudioHemodynamicAnalysisRequestV1,
): void {
  if (
    request.requestToken.trim().length === 0
    || request.source.scenarioId.trim().length === 0
    || (
      request.detailMode !== "standard"
      && request.detailMode !== "settled-reference"
      && request.detailMode !== "compare"
    )
  ) throw new Error("invalid Studio hemodynamic analysis request");
}

function detailModeSatisfiesV1(
  available: MainWireScientificHemodynamicCalculationDetailV2,
  requested: MainWireScientificHemodynamicCalculationDetailV2,
): boolean {
  return available === requested || available === "compare";
}

function boundedPollIntervalV1(value: number): number {
  if (!Number.isFinite(value)) return 250;
  return Math.max(
    MINIMUM_POLL_INTERVAL_MS_V1,
    Math.min(MAXIMUM_POLL_INTERVAL_MS_V1, Math.round(value)),
  );
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

import {
  mainWireScientificHemodynamicJobSourceFingerprintV2,
  type MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationJobSnapshotV1,
  MainWireScientificPvRelationJobStartV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID,
  type MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import type {
  MainWireScientificPvRelationJobManagerV1,
} from "@/engine/scientific/worker/MainWireScientificPvRelationJobManagerV1";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
  type MainWireScientificPvRelationWorkerCommandV1,
  type MainWireScientificPvRelationWorkerMessageV1,
} from "@/engine/scientificBrowser/MainWireScientificPvRelationWorkerProtocolV1";

export interface MainWireScientificPvRelationWorkerLikeV1 {
  onmessage:
    | ((event: MessageEvent<MainWireScientificPvRelationWorkerMessageV1>) => void)
    | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: MainWireScientificPvRelationWorkerCommandV1): void;
  terminate(): void;
}

export type MainWireScientificPvRelationWorkerManagerOptionsV1 = Readonly<{
  createWorker?: () => MainWireScientificPvRelationWorkerLikeV1;
  sourceFingerprint?: (
    capsule: MainWireScientificHemodynamicJobCapsuleV2,
  ) => Promise<string>;
  suggestedPollIntervalMs?: number;
  maximumCachedResultCount?: number;
}>;

type ActiveJobV1 = {
  ownerSessionId: string;
  capsule: MainWireScientificHemodynamicJobCapsuleV2;
  jobId: string;
  sourceFingerprint: string;
  worker: MainWireScientificPvRelationWorkerLikeV1 | null;
  snapshot: MainWireScientificPvRelationJobSnapshotV1;
};

const DEFAULT_POLL_INTERVAL_MS = 125;
const DEFAULT_MAXIMUM_CACHED_RESULT_COUNT = 4;
const MAXIMUM_RETAINED_JOB_COUNT = 16;

/**
 * One on-demand branch Worker per active fixed-TBV preload-reduction job.
 * Completed results are cached by the full release/checkpoint fingerprint,
 * never by a display label or mutable scenario id.
 */
export class MainWireScientificPvRelationWorkerManagerV1
implements MainWireScientificPvRelationJobManagerV1 {
  private readonly createWorker: () => MainWireScientificPvRelationWorkerLikeV1;
  private readonly sourceFingerprint: (
    capsule: MainWireScientificHemodynamicJobCapsuleV2,
  ) => Promise<string>;
  private readonly suggestedPollIntervalMs: number;
  private readonly maximumCachedResultCount: number;
  private readonly jobs = new Map<string, ActiveJobV1>();
  private readonly cachedResults = new Map<
    string,
    MainWireScientificPvRelationsProtocolResultV2
  >();
  private readonly activeJobsByOwner = new Map<string, ActiveJobV1>();
  private readonly startEpochByOwner = new Map<string, number>();
  private jobOrdinal = 0;
  private disposed = false;

  constructor(options: MainWireScientificPvRelationWorkerManagerOptionsV1 = {}) {
    this.createWorker = options.createWorker ?? createDefaultWorkerV1;
    this.sourceFingerprint = options.sourceFingerprint
      ?? mainWireScientificHemodynamicJobSourceFingerprintV2;
    this.suggestedPollIntervalMs = boundedInteger(
      options.suggestedPollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      50,
      2_000,
      "suggestedPollIntervalMs",
    );
    this.maximumCachedResultCount = boundedInteger(
      options.maximumCachedResultCount ?? DEFAULT_MAXIMUM_CACHED_RESULT_COUNT,
      0,
      16,
      "maximumCachedResultCount",
    );
  }

  async start(input: Readonly<{
    ownerSessionId: string;
    capsule: MainWireScientificHemodynamicJobCapsuleV2;
  }>): Promise<MainWireScientificPvRelationJobStartV1> {
    if (this.disposed) throw new Error("PV relation job manager is disposed");
    const startEpoch = (this.startEpochByOwner.get(input.ownerSessionId) ?? 0)
      + 1;
    this.startEpochByOwner.set(input.ownerSessionId, startEpoch);
    const activeForOwner = this.activeJobsByOwner.get(input.ownerSessionId);
    if (activeForOwner?.snapshot.status === "running") {
      this.cancel({
        ownerSessionId: activeForOwner.ownerSessionId,
        jobId: activeForOwner.jobId,
        reason: "source-invalidated",
      });
    }
    this.pruneJobs();
    const sourceFingerprint = await this.sourceFingerprint(input.capsule);
    if (this.disposed) throw new Error("PV relation job manager is disposed");
    if (this.startEpochByOwner.get(input.ownerSessionId) !== startEpoch) {
      throw new Error("PV relation job start was superseded by a newer source");
    }
    const jobId = `main-wire-pv-relation-v1-${++this.jobOrdinal}`;
    const cached = this.cachedResults.get(sourceFingerprint) ?? null;
    if (cached !== null) {
      if (!sameSource(cached, input.capsule)) {
        this.cachedResults.delete(sourceFingerprint);
        throw new Error("cached PV relation source identity mismatch");
      }
      // Refresh insertion order so the bounded cache is true LRU.
      this.cachedResults.delete(sourceFingerprint);
      this.cachedResults.set(sourceFingerprint, cached);
      const job = this.createJob({
        ownerSessionId: input.ownerSessionId,
        capsule: input.capsule,
        jobId,
        sourceFingerprint,
        worker: null,
        snapshot: Object.freeze({
          jobId,
          sequence: 1,
          status: "complete" as const,
          stage: "complete" as const,
          source: input.capsule.source,
          sourceFingerprint,
          cacheStatus: "hit" as const,
          beats: cached.beats,
          progress: null,
          result: cached,
          errorMessage: null,
        }),
      });
      this.jobs.set(jobId, job);
      return this.jobStart(job);
    }

    const worker = this.createWorker();
    const job = this.createJob({
      ownerSessionId: input.ownerSessionId,
      capsule: input.capsule,
      jobId,
      sourceFingerprint,
      worker,
      snapshot: Object.freeze({
        jobId,
        sequence: 1,
        status: "running" as const,
        stage: "preload-reduction" as const,
        source: input.capsule.source,
        sourceFingerprint,
        cacheStatus: "miss" as const,
        beats: Object.freeze([]),
        progress: null,
        result: null,
        errorMessage: null,
      }),
    });
    worker.onmessage = (event) => this.handleWorkerMessage(job, event.data);
    worker.onerror = (event) => {
      event.preventDefault?.();
      this.failJob(job, event.message || "PV relation branch Worker failed");
    };
    this.jobs.set(jobId, job);
    this.activeJobsByOwner.set(input.ownerSessionId, job);
    try {
      worker.postMessage(Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
        kind: "start" as const,
        jobId,
        sourceFingerprint,
        capsule: input.capsule,
      }));
    } catch (error) {
      this.failJob(job, errorMessage(error));
      throw error;
    }
    return this.jobStart(job);
  }

  poll(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
  }>): MainWireScientificPvRelationJobSnapshotV1 {
    return this.requireOwnedJob(input).snapshot;
  }

  cancel(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
    reason: "host-request" | "source-invalidated" | "session-disposed";
  }>): MainWireScientificPvRelationJobSnapshotV1 {
    const job = this.requireOwnedJob(input);
    if (job.snapshot.status !== "running") return job.snapshot;
    this.terminateWorker(job);
    job.snapshot = Object.freeze({
      ...job.snapshot,
      sequence: job.snapshot.sequence + 1,
      status: "cancelled" as const,
      stage: "cancelled" as const,
      errorMessage: null,
    });
    if (this.activeJobsByOwner.get(job.ownerSessionId) === job) {
      this.activeJobsByOwner.delete(job.ownerSessionId);
    }
    return job.snapshot;
  }

  disposeOwner(ownerSessionId: string): void {
    this.startEpochByOwner.set(
      ownerSessionId,
      (this.startEpochByOwner.get(ownerSessionId) ?? 0) + 1,
    );
    for (const job of [...this.jobs.values()]) {
      if (job.ownerSessionId !== ownerSessionId) continue;
      if (job.snapshot.status === "running") {
        this.cancel({
          ownerSessionId,
          jobId: job.jobId,
          reason: "session-disposed",
        });
      }
      this.jobs.delete(job.jobId);
    }
    this.activeJobsByOwner.delete(ownerSessionId);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const job of this.jobs.values()) this.terminateWorker(job);
    this.jobs.clear();
    this.cachedResults.clear();
    this.activeJobsByOwner.clear();
    this.startEpochByOwner.clear();
  }

  private handleWorkerMessage(
    job: ActiveJobV1,
    message: MainWireScientificPvRelationWorkerMessageV1,
  ): void {
    if (
      this.disposed
      || this.activeJobsByOwner.get(job.ownerSessionId) !== job
      || job.snapshot.status !== "running"
      || message.protocolId
        !== MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID
      || message.jobId !== job.jobId
      || message.sourceFingerprint !== job.sourceFingerprint
    ) return;
    if (message.kind === "progress") {
      job.snapshot = Object.freeze({
        ...job.snapshot,
        sequence: job.snapshot.sequence + 1,
        beats: message.progress.beats,
        progress: message.progress,
      });
      return;
    }
    if (message.kind === "worker-failure") {
      this.failJob(job, message.message);
      return;
    }
    if (
      message.result.protocolId
        !== MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID
      || !sameSource(message.result, job.capsule)
    ) {
      this.failJob(job, "PV relation result source identity mismatch");
      return;
    }
    job.snapshot = Object.freeze({
      ...job.snapshot,
      sequence: job.snapshot.sequence + 1,
      status: "complete" as const,
      stage: "complete" as const,
      beats: message.result.beats,
      result: message.result,
      errorMessage: null,
    });
    this.cacheResult(job.sourceFingerprint, message.result);
    this.terminateWorker(job);
    if (this.activeJobsByOwner.get(job.ownerSessionId) === job) {
      this.activeJobsByOwner.delete(job.ownerSessionId);
    }
  }

  private failJob(job: ActiveJobV1, message: string): void {
    if (job.snapshot.status !== "running") return;
    job.snapshot = Object.freeze({
      ...job.snapshot,
      sequence: job.snapshot.sequence + 1,
      status: "error" as const,
      stage: "error" as const,
      errorMessage: message,
    });
    this.terminateWorker(job);
    if (this.activeJobsByOwner.get(job.ownerSessionId) === job) {
      this.activeJobsByOwner.delete(job.ownerSessionId);
    }
  }

  private terminateWorker(job: ActiveJobV1): void {
    const worker = job.worker;
    if (worker === null) return;
    job.worker = null;
    worker.onmessage = null;
    worker.onerror = null;
    try {
      worker.terminate();
    } catch {
      // Termination is best effort after the immutable terminal snapshot wins.
    }
  }

  private cacheResult(
    sourceFingerprint: string,
    result: MainWireScientificPvRelationsProtocolResultV2,
  ): void {
    if (this.maximumCachedResultCount === 0) return;
    this.cachedResults.delete(sourceFingerprint);
    this.cachedResults.set(sourceFingerprint, result);
    while (this.cachedResults.size > this.maximumCachedResultCount) {
      const oldest = this.cachedResults.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.cachedResults.delete(oldest);
    }
  }

  private requireOwnedJob(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
  }>): ActiveJobV1 {
    const job = this.jobs.get(input.jobId);
    if (job === undefined) throw new Error(`unknown PV relation job ${input.jobId}`);
    if (job.ownerSessionId !== input.ownerSessionId) {
      throw new Error("PV relation job owner mismatch");
    }
    return job;
  }

  private createJob(input: ActiveJobV1): ActiveJobV1 {
    return input;
  }

  private jobStart(job: ActiveJobV1): MainWireScientificPvRelationJobStartV1 {
    return Object.freeze({
      jobId: job.jobId,
      snapshot: job.snapshot,
      suggestedPollIntervalMs: this.suggestedPollIntervalMs,
    });
  }

  private pruneJobs(): void {
    for (const [jobId, job] of this.jobs) {
      if (this.jobs.size < MAXIMUM_RETAINED_JOB_COUNT) break;
      if (job.snapshot.status !== "running") this.jobs.delete(jobId);
    }
  }
}

function createDefaultWorkerV1(): MainWireScientificPvRelationWorkerLikeV1 {
  return new Worker(
    new URL("./mainWireScientificPvRelationWorkerV1.ts", import.meta.url),
    { type: "module" },
  ) as unknown as MainWireScientificPvRelationWorkerLikeV1;
}

function sameSource(
  result: MainWireScientificPvRelationsProtocolResultV2,
  capsule: MainWireScientificHemodynamicJobCapsuleV2,
): boolean {
  return result.source.revision === capsule.source.revision
    && result.source.acceptedTimeSec === capsule.source.acceptedTimeSec
    && result.source.fixedTotalBloodVolumeMl
      === capsule.source.fixedTotalBloodVolumeMl;
}

function boundedInteger(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

import {
  checkpointMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import { createCanonicalMainWireNormalAdultFiveWallProviderV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2,
  advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2,
  createMainWireScientificAdaptivePreloadEnvelopePlannerV2,
  type MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  type MainWireScientificPreloadEnvelopeLaneV2,
  type MainWireScientificPreloadEnvelopeTargetV2,
} from "@/engine/scientific/protocols/MainWireScientificAdaptivePreloadEnvelopePlannerV2";
import {
  MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_CALCULATION_DETAILS_V2,
  MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V2_ID,
  mainWireScientificHemodynamicJobSourceFingerprintV2,
  type MainWireScientificGuytonStarlingProtocolResultV2,
  type MainWireScientificHemodynamicCalculationDetailV2,
  type MainWireScientificHemodynamicJobCapsuleV2,
  type MainWireScientificHemodynamicJobSnapshotV2,
  type MainWireScientificHemodynamicJobStartV2,
  type MainWireScientificPreloadPointEvidenceV2,
  type MainWireScientificPreloadPointProvenanceV2,
  type MainWireScientificPreloadSweepDirectionV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  buildMainWireScientificPreloadOperatingLocusFromIdentifiedPointsV1,
  prepareMainWireScientificGuytonStarlingBaselineV2,
  type MainWireScientificGuytonStarlingBaselineV2,
  type MainWireScientificHemodynamicProtocolDependenciesV1,
  type MainWireScientificPreloadOperatingPointV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import {
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1,
  createMainWireScientificFastTbvPreviewTargetsV1,
  emptyMainWireScientificFastTbvPreviewV1,
  type MainWireScientificFastTbvPointEvidenceV1,
  type MainWireScientificFastTbvPreviewTargetV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1,
  planMainWireScientificFastTbvRefinementDispatchesV1,
  type MainWireScientificFastTbvRefinementStageV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvRefinementPolicyV1";
import type { MainWireScientificHemodynamicJobManagerV2 } from "@/engine/scientific/worker/MainWireScientificHemodynamicJobManagerV2";
import {
  MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
  type MainWireScientificPreloadBranchWorkerCommandV2,
  type MainWireScientificPreloadBranchWorkerLaneV2,
  type MainWireScientificPreloadBranchWorkerMessageV2,
  type MainWireScientificPreloadBranchWorkerFastPreviewResultV2,
  type MainWireScientificPreloadBranchWorkerTargetResultV2,
} from "@/engine/scientificBrowser/MainWireScientificPreloadBranchWorkerProtocolV2";

export interface MainWireScientificPreloadBranchWorkerLikeV2 {
  onmessage:
    | ((
        event: MessageEvent<MainWireScientificPreloadBranchWorkerMessageV2>,
      ) => void)
    | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: MainWireScientificPreloadBranchWorkerCommandV2): void;
  terminate(): void;
}

export type MainWireScientificHemodynamicWorkerPoolOptionsV2 = Readonly<{
  createBranchWorker?: (
    lane: MainWireScientificPreloadBranchWorkerLaneV2,
  ) => MainWireScientificPreloadBranchWorkerLikeV2;
  suggestedPollIntervalMs?: number;
  nowMs?: () => number;
}>;

type LaneRuntimeV2 = {
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  worker: MainWireScientificPreloadBranchWorkerLikeV2;
  ready: boolean;
  inFlightTargetId: string | null;
  inFlightFastPreviewRequest: Readonly<{
    target: MainWireScientificFastTbvPreviewTargetV1;
    requestedNaturalBeatCount: 2 | 3 | 4 | 5;
  }> | null;
  previewComplete: boolean;
  complete: boolean;
};

type AuditTaskV2 = Readonly<{
  referencePointId: string;
  referenceTarget: MainWireScientificPreloadEnvelopeTargetV2;
  auditTarget: MainWireScientificPreloadEnvelopeTargetV2;
}>;

type ActiveJobV2 = {
  ownerSessionId: string;
  jobId: string;
  detailMode: MainWireScientificHemodynamicCalculationDetailV2;
  capsule: MainWireScientificHemodynamicJobCapsuleV2;
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1;
  baseline: MainWireScientificGuytonStarlingBaselineV2;
  baselineCapsule: MainWireScientificHemodynamicJobCapsuleV2;
  planner: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2;
  evidence: MainWireScientificPreloadPointEvidenceV2[];
  fastPreviewEvidence: MainWireScientificFastTbvPointEvidenceV1[];
  fastPreviewRefinementStageByTargetId: Map<
    string,
    MainWireScientificFastTbvRefinementStageV1
  >;
  fastPreviewTargetQueue: Record<
    MainWireScientificPreloadBranchWorkerLaneV2,
    MainWireScientificFastTbvPreviewTargetV1[]
  >;
  sourceFingerprint: string;
  fastPreviewStartedAtMs: number | null;
  fastPreviewBeatWallTimesByLane: Record<
    MainWireScientificPreloadBranchWorkerLaneV2,
    number[]
  >;
  fastPreviewRefinementComplete: boolean;
  targetById: Map<string, MainWireScientificPreloadEnvelopeTargetV2>;
  terminalCheckpointByPointId: Map<
    string,
    NonNullable<
      MainWireScientificPreloadBranchWorkerTargetResultV2["terminalCheckpoint"]
    >
  >;
  lanes: Record<MainWireScientificPreloadBranchWorkerLaneV2, LaneRuntimeV2>;
  status: MainWireScientificHemodynamicJobSnapshotV2["status"];
  stage: MainWireScientificHemodynamicJobSnapshotV2["stage"];
  sequence: number;
  completedBeatCount: number;
  auditQueue: AuditTaskV2[];
  activeAuditByLane: Record<
    MainWireScientificPreloadBranchWorkerLaneV2,
    AuditTaskV2 | null
  >;
  snapshot: MainWireScientificHemodynamicJobSnapshotV2;
};

const POLL_INTERVAL_MS = 250;
const MINIMUM_PLANNED_POINT_COUNT = 11;
const AUDIT_TARGET_SCALES = Object.freeze([0.35, 0.7, 1.3]);
const FAST_PREVIEW_PLANNED_POINT_COUNT =
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.lowerTargetScales.length +
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.higherTargetScales.length;

/**
 * Standard user-facing preview budget. The hypovolemic knee receives more
 * natural beats because its chamber/vascular redistribution is slowest and
 * its directional error is largest; all other targets keep the fast 3-beat
 * observation. This remains finite-hold evidence, never a periodicity claim.
 */
export function scientificStandardQuickResponseNaturalBeatCountV1(
  target: MainWireScientificFastTbvPreviewTargetV1,
): 3 | 4 | 5 {
  const lowerScales = [
    ...MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.lowerTargetScales,
  ].sort((left, right) => left - right);
  if (target.lane === "lower-volume") {
    if (target.targetScale === lowerScales[0]) return 5;
    if (target.targetScale === lowerScales[1]) return 4;
  }
  return 3;
}

/**
 * Owns two long-lived branch workers. Only the small start/poll/cancel control
 * plane remains on the interactive scenario worker; Land/TriSeg settlement is
 * isolated in the lower- and higher-volume workers.
 */
export class MainWireScientificHemodynamicWorkerPoolV2 implements MainWireScientificHemodynamicJobManagerV2 {
  private readonly createBranchWorker: (
    lane: MainWireScientificPreloadBranchWorkerLaneV2,
  ) => MainWireScientificPreloadBranchWorkerLikeV2;
  private readonly suggestedPollIntervalMs: number;
  private readonly nowMs: () => number;
  private readonly jobs = new Map<string, ActiveJobV2>();
  private readonly persistentWorkers = new Map<
    MainWireScientificPreloadBranchWorkerLaneV2,
    MainWireScientificPreloadBranchWorkerLikeV2
  >();
  private activeJob: ActiveJobV2 | null = null;
  private jobOrdinal = 0;

  constructor(options: MainWireScientificHemodynamicWorkerPoolOptionsV2 = {}) {
    this.createBranchWorker =
      options.createBranchWorker ?? createDefaultBranchWorkerV2;
    this.suggestedPollIntervalMs = boundedPollInterval(
      options.suggestedPollIntervalMs ?? POLL_INTERVAL_MS,
    );
    this.nowMs = options.nowMs ?? monotonicNowMs;
  }

  async start(
    input: Readonly<{
      ownerSessionId: string;
      capsule: MainWireScientificHemodynamicJobCapsuleV2;
      detailMode?: MainWireScientificHemodynamicCalculationDetailV2;
    }>,
  ): Promise<MainWireScientificHemodynamicJobStartV2> {
    const detailMode = input.detailMode ?? "compare";
    if (
      !MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_CALCULATION_DETAILS_V2.includes(
        detailMode,
      )
    ) throw new Error("hemodynamic calculation detail is unsupported");
    if (this.activeJob?.status === "running") {
      this.cancel({
        ownerSessionId: this.activeJob.ownerSessionId,
        jobId: this.activeJob.jobId,
        reason: "source-invalidated",
      });
    }
    for (const [jobId, job] of this.jobs) {
      if (job.status !== "running") this.jobs.delete(jobId);
    }
    const dependencies = dependenciesFromCapsule(input.capsule);
    const sourceState = restoreMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      input.capsule.transactionCheckpoint,
    );
    const baseline = prepareMainWireScientificGuytonStarlingBaselineV2(
      dependencies,
      sourceState,
    );
    if (
      baseline.baselinePeriodicity !== "period1-converged" ||
      !baseline.baselinePoint.acceptedForPeriod1Locus
    ) {
      throw new Error(
        "bidirectional preload continuation requires a reproduced P1 source beat",
      );
    }
    const baselineMetrics = plannerMetrics(baseline.baselinePoint);
    const initialized =
      createMainWireScientificAdaptivePreloadEnvelopePlannerV2({
        baselineTotalBloodVolumeMl: baseline.source.fixedTotalBloodVolumeMl,
        baselineMetrics,
      });
    const jobId = `main-wire-hemodynamic-v2-${++this.jobOrdinal}`;
    const baselineCapsule = Object.freeze({
      ...input.capsule,
      source: baseline.source,
      transactionCheckpoint: checkpointMainWireFiveWallNonCoronaryV1(
        dependencies.provider,
        baseline.continuationSeedState,
      ),
    });
    const baselineEvidence = baselinePointEvidence(baseline.baselinePoint);
    const sourceFingerprint =
      await mainWireScientificHemodynamicJobSourceFingerprintV2(
        baselineCapsule,
      );
    const fastTargets = createMainWireScientificFastTbvPreviewTargetsV1(
      baseline.source.fixedTotalBloodVolumeMl,
    );
    const lower = this.createLane(jobId, "lower-volume");
    const higher = this.createLane(jobId, "higher-volume");
    const job = {} as ActiveJobV2;
    Object.assign(job, {
      ownerSessionId: input.ownerSessionId,
      jobId,
      detailMode,
      capsule: input.capsule,
      dependencies,
      baseline,
      baselineCapsule,
      planner: initialized.state,
      evidence: [baselineEvidence],
      fastPreviewEvidence: [],
      fastPreviewRefinementStageByTargetId: new Map(),
      fastPreviewTargetQueue: {
        "lower-volume": [...fastTargets["lower-volume"]],
        "higher-volume": [...fastTargets["higher-volume"]],
      },
      sourceFingerprint,
      fastPreviewStartedAtMs: null,
      fastPreviewBeatWallTimesByLane: {
        "lower-volume": [],
        "higher-volume": [],
      },
      fastPreviewRefinementComplete: false,
      targetById: new Map(
        initialized.initialTargets.map((target) => [target.targetId, target]),
      ),
      terminalCheckpointByPointId: new Map(),
      lanes: { "lower-volume": lower, "higher-volume": higher },
      status: "running",
      stage: "vascular-ready",
      sequence: 1,
      completedBeatCount: 1,
      auditQueue: [],
      activeAuditByLane: {
        "lower-volume": null,
        "higher-volume": null,
      },
    } satisfies Omit<ActiveJobV2, "snapshot">);
    job.snapshot = snapshotForJob(job);
    this.jobs.set(jobId, job);
    this.activeJob = job;
    try {
      for (const lane of [lower, higher]) {
        lane.worker.postMessage(
          Object.freeze({
            protocolId:
              MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
            kind: "initialize" as const,
            jobId,
            lane: lane.lane,
            sourceFingerprint,
            baselineCapsule,
          }),
        );
      }
    } catch (error) {
      this.failJob(job, errorMessageV2(error));
      this.jobs.delete(jobId);
      throw error;
    }
    return Object.freeze({
      jobId,
      snapshot: job.snapshot,
      suggestedPollIntervalMs: this.suggestedPollIntervalMs,
    });
  }

  poll(
    input: Readonly<{
      ownerSessionId: string;
      jobId: string;
    }>,
  ): MainWireScientificHemodynamicJobSnapshotV2 {
    return this.requireOwnedJob(input).snapshot;
  }

  cancel(
    input: Readonly<{
      ownerSessionId: string;
      jobId: string;
      reason: "host-request" | "source-invalidated" | "session-disposed";
    }>,
  ): MainWireScientificHemodynamicJobSnapshotV2 {
    const job = this.requireOwnedJob(input);
    if (job.status !== "running") return job.snapshot;
    for (const lane of Object.values(job.lanes)) {
      try {
        lane.worker.postMessage(
          Object.freeze({
            protocolId:
              MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
            kind: "cancel" as const,
            jobId: job.jobId,
          }),
        );
      } catch {
        // terminate() below remains the authoritative cancellation boundary.
      } finally {
        lane.worker.terminate();
        this.persistentWorkers.delete(lane.lane);
      }
    }
    job.status = "cancelled";
    job.stage = "cancelled";
    job.sequence += 1;
    job.snapshot = snapshotForJob(job, null, `Cancelled: ${input.reason}.`);
    if (this.activeJob === job) this.activeJob = null;
    return job.snapshot;
  }

  disposeOwner(ownerSessionId: string): void {
    for (const [jobId, job] of [...this.jobs]) {
      if (job.ownerSessionId !== ownerSessionId) continue;
      if (job.status === "running") {
        this.cancel({ ownerSessionId, jobId, reason: "session-disposed" });
      }
      this.jobs.delete(jobId);
    }
  }

  dispose(): void {
    for (const job of [...this.jobs.values()]) {
      if (job.status === "running") {
        this.cancel({
          ownerSessionId: job.ownerSessionId,
          jobId: job.jobId,
          reason: "session-disposed",
        });
      }
    }
    this.jobs.clear();
    for (const worker of this.persistentWorkers.values()) worker.terminate();
    this.persistentWorkers.clear();
    this.activeJob = null;
  }

  private createLane(
    jobId: string,
    lane: MainWireScientificPreloadBranchWorkerLaneV2,
  ): LaneRuntimeV2 {
    const worker =
      this.persistentWorkers.get(lane) ?? this.createBranchWorker(lane);
    this.persistentWorkers.set(lane, worker);
    const runtime: LaneRuntimeV2 = {
      lane,
      worker,
      ready: false,
      inFlightTargetId: null,
      inFlightFastPreviewRequest: null,
      previewComplete: false,
      complete: false,
    };
    worker.onmessage = (event) => {
      try {
        this.handleWorkerMessage(lane, event.data);
      } catch (error) {
        const job = this.jobs.get(jobId);
        if (job !== undefined && job.status === "running") {
          this.failJob(job, errorMessageV2(error));
        }
      }
    };
    worker.onerror = (event) => {
      const job = this.jobs.get(jobId);
      if (job !== undefined && job.status === "running") {
        this.failJob(job, event.message || `${lane} preload worker failed`);
      }
    };
    return runtime;
  }

  private handleWorkerMessage(
    lane: MainWireScientificPreloadBranchWorkerLaneV2,
    message: MainWireScientificPreloadBranchWorkerMessageV2,
  ): void {
    if (
      message.protocolId !==
      MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID
    )
      return;
    const job = this.jobs.get(message.jobId);
    if (job === undefined || job.status !== "running") return;
    if (message.kind === "worker-failure") {
      this.failJob(job, message.message);
      return;
    }
    if (message.lane !== lane) {
      this.failJob(job, "preload worker lane identity mismatch");
      return;
    }
    const runtime = job.lanes[lane];
    if (message.kind === "ready") {
      runtime.ready = true;
      job.fastPreviewStartedAtMs ??= this.nowMs();
      if (job.stage === "vascular-ready") {
        job.stage = "near-steady-preview";
      }
      this.dispatchNextFastPreviewTarget(job, runtime);
      this.publishProgress(job);
      return;
    }
    if (message.kind === "fast-preview-target-result") {
      const issued = runtime.inFlightFastPreviewRequest;
      if (
        issued === null
        || runtime.inFlightTargetId !== issued.target.targetId
        || !sameFastPreviewTargetV2(issued.target, message.target)
        || message.requestedNaturalBeatCount
            !== issued.requestedNaturalBeatCount
      ) {
        this.failJob(
          job,
          "preload worker returned a stale or mismatched fast-preview request",
        );
        return;
      }
      runtime.inFlightTargetId = null;
      runtime.inFlightFastPreviewRequest = null;
      this.acceptFastPreviewResult(job, runtime, message);
      return;
    }
    if (runtime.inFlightTargetId !== message.target.targetId) {
      this.failJob(job, "preload worker returned a stale target result");
      return;
    }
    runtime.inFlightTargetId = null;
    if (message.mode === "independent-audit") {
      this.acceptAuditResult(job, runtime, message);
    } else {
      this.acceptContinuationResult(job, runtime, message);
    }
  }

  private acceptFastPreviewResult(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
    message: MainWireScientificPreloadBranchWorkerFastPreviewResultV2,
  ): void {
    if (
      !("refinementStage" in message)
      || message.refinementStage === undefined
    ) {
      this.failJob(job, "fast-preview result omitted refinement stage");
      return;
    }
    if (message.evidence.sourceFingerprint !== job.sourceFingerprint) {
      this.failJob(job, "fast-preview source fingerprint mismatch");
      return;
    }
    const evidenceTarget = message.evidence.acquisition.target;
    const existingIndex = job.fastPreviewEvidence.findIndex(
      ({ evidenceId }) => evidenceId === message.evidence.evidenceId,
    );
    const existingEvidence = existingIndex < 0
      ? null
      : job.fastPreviewEvidence[existingIndex]!;
    const previousStage = job.fastPreviewRefinementStageByTargetId.get(
      message.target.targetId,
    ) ?? null;
    if (
      message.evidence.acquisition.plannedNaturalBeatCountAfterPrediction
        !== message.requestedNaturalBeatCount ||
      (message.evidence.evidenceClass !== "failure"
        && message.evidence.acquisition.completedNaturalBeatCountAfterPrediction
          !== message.requestedNaturalBeatCount) ||
      (message.evidence.evidenceClass === "failure"
        ? message.refinementStage !== null
        : message.refinementStage === null) ||
      message.evidence.evidenceId !== message.target.targetId ||
      !sameFastPreviewTargetV2(evidenceTarget, message.target) ||
      evidenceTarget.lane !== runtime.lane
    ) {
      this.failJob(job, "fast-preview target evidence identity mismatch");
      return;
    }
    if (
      message.evidence.eligibility.settledP1Locus ||
      message.evidence.eligibility.continuationSeed ||
      message.evidence.eligibility.espvrEdpvrPrswFit ||
      (message.evidence.evidenceClass === "failure"
        ? message.evidence.periodicityClaim !== "none"
        : message.evidence.periodicityClaim !== "not-demonstrated")
    ) {
      this.failJob(job, "fast-preview evidence leaked a canonical claim");
      return;
    }
    if (
      message.refinementStage !== null
      && (
        message.refinementStage.targetId !== message.target.targetId
        || message.refinementStage.claimBoundary.periodicityClaim !== "none"
        || message.refinementStage.claimBoundary.stageMayEnterCanonicalEvidence
        || message.refinementStage.assessment.claimBoundary.periodicityClaim
            !== "none"
        || message.refinementStage.assessment.claimBoundary
            .mayEnterSettledP1OrP2Evidence
        || message.refinementStage.assessment.claimBoundary
            .maySeedCanonicalContinuation
        || message.refinementStage.assessment.claimBoundary
            .mayEnterEspvrEdpvrPrswFit
        || message.refinementStage.completedNaturalBeatCount
            !== message.evidence.acquisition
              .completedNaturalBeatCountAfterPrediction
        || message.refinementStage.presentation.replaceEvidenceForSameTarget
            !== true
        || (
          previousStage === null
            ? message.refinementStage.revision !== 1
            : message.refinementStage.revision !== previousStage.revision + 1
              || message.refinementStage.supersedesRevision
                  !== previousStage.revision
        )
      )
    ) {
      this.failJob(job, "fast-preview refinement revision/claim mismatch");
      return;
    }
    if (
      (existingEvidence === null
        && message.refinementStage !== null
        && message.refinementStage.revision !== 1)
      || (existingEvidence !== null
        && message.evidence.acquisition.completedNaturalBeatCountAfterPrediction
            < existingEvidence.acquisition.completedNaturalBeatCountAfterPrediction
      )
    ) {
      this.failJob(job, "fast-preview replacement evidence order mismatch");
      return;
    }
    const previousCompleted = existingEvidence?.acquisition
      .completedNaturalBeatCountAfterPrediction ?? 0;
    if (
      existingEvidence !== null
      && message.evidence.evidenceClass === "failure"
    ) {
      if (
        job.detailMode === "standard"
        && previousCompleted < 3
      ) {
        // The quick overview requires three accepted natural beats for every
        // point it displays. A target-specific third-beat failure therefore
        // replaces the earlier two-beat estimate with explicit failure
        // evidence, but it must not erase the other valid points or the prior
        // parameter generation from the product chart.
        job.fastPreviewEvidence[existingIndex] = message.evidence;
        job.completedBeatCount += Math.max(
          0,
          message.evidence.acquisition.completedNaturalBeatCountAfterPrediction
            - previousCompleted,
        );
        job.fastPreviewRefinementStageByTargetId.delete(message.target.targetId);
        this.dispatchFastPreviewRefinements(job);
        this.publishProgress(job);
        return;
      }
      job.completedBeatCount += Math.max(
        0,
        message.evidence.acquisition.completedNaturalBeatCountAfterPrediction
          - previousCompleted,
      );
      job.fastPreviewRefinementStageByTargetId.delete(message.target.targetId);
      this.dispatchFastPreviewRefinements(job);
      this.publishProgress(job);
      return;
    }
    if (existingIndex < 0) job.fastPreviewEvidence.push(message.evidence);
    else job.fastPreviewEvidence[existingIndex] = message.evidence;
    if (message.refinementStage !== null) {
      job.fastPreviewRefinementStageByTargetId.set(
        message.target.targetId,
        message.refinementStage,
      );
      const times = job.fastPreviewBeatWallTimesByLane[runtime.lane];
      times.push(message.refinementStage.measuredLatestBeatWallTimeMs);
      if (times.length > 16) times.shift();
    } else {
      job.fastPreviewRefinementStageByTargetId.delete(message.target.targetId);
    }
    job.completedBeatCount += Math.max(
      0,
      message.evidence.acquisition.completedNaturalBeatCountAfterPrediction
        - previousCompleted,
    );
    if (existingEvidence === null) {
      this.dispatchNextFastPreviewTarget(job, runtime);
    } else {
      this.dispatchFastPreviewRefinements(job);
    }
    this.publishProgress(job);
  }

  private dispatchNextFastPreviewTarget(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
  ): void {
    const target = job.fastPreviewTargetQueue[runtime.lane].shift() ?? null;
    if (target !== null) {
      if (
        runtime.inFlightTargetId !== null
        || runtime.inFlightFastPreviewRequest !== null
      ) {
        this.failJob(
          job,
          `${runtime.lane} worker already has an active target`,
        );
        return;
      }
      const issuedTarget = copyFastPreviewTargetV2(target);
      runtime.inFlightTargetId = issuedTarget.targetId;
      runtime.inFlightFastPreviewRequest = Object.freeze({
        target: issuedTarget,
        requestedNaturalBeatCount: 2 as const,
      });
      runtime.worker.postMessage(
        Object.freeze({
          protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
          kind: "solve-fast-preview-target" as const,
          jobId: job.jobId,
          lane: runtime.lane,
          target: issuedTarget,
          requestedNaturalBeatCount: 2 as const,
        }),
      );
      return;
    }
    runtime.previewComplete = true;
    const allPreviewsComplete =
      job.lanes["lower-volume"].previewComplete &&
      job.lanes["higher-volume"].previewComplete;
    job.stage = allPreviewsComplete
      ? "preview-ready"
      : "near-steady-preview";
    if (allPreviewsComplete) this.dispatchFastPreviewRefinements(job);
  }

  private dispatchFastPreviewRefinements(job: ActiveJobV2): void {
    if (job.fastPreviewRefinementComplete) return;
    const allInitialPreviewsComplete =
      job.lanes["lower-volume"].previewComplete
      && job.lanes["higher-volume"].previewComplete;
    if (!allInitialPreviewsComplete) return;
    if (job.detailMode === "standard") {
      this.dispatchStandardPreviewBeats(job);
      return;
    }
    const idleLanes = (
      ["lower-volume", "higher-volume"] as const
    ).filter((lane) => job.lanes[lane].inFlightTargetId === null);
    const elapsedMs = job.fastPreviewStartedAtMs === null
      ? 0
      : this.nowMs() - job.fastPreviewStartedAtMs;
    const remainingWallTimeMs = Math.max(
      0,
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_REFINEMENT_POLICY_V1
        .globalSoftWallTimeBudgetMs - elapsedMs,
    );
    const plan = planMainWireScientificFastTbvRefinementDispatchesV1({
      remainingWallTimeMs,
      idleLanes,
      candidates: job.fastPreviewEvidence.flatMap((evidence) => {
        const stage = job.fastPreviewRefinementStageByTargetId.get(
          evidence.evidenceId,
        );
        if (stage === undefined || evidence.evidenceClass === "failure") {
          return [];
        }
        return [Object.freeze({
          targetId: evidence.evidenceId,
          lane: evidence.acquisition.target.lane,
          completedNaturalBeatCount:
            stage.completedNaturalBeatCount,
          assessment: stage.assessment,
          estimatedNextBeatWallTimeMs: estimatedNextFastPreviewBeatWallTimeMs(
            job.fastPreviewBeatWallTimesByLane[
              evidence.acquisition.target.lane
            ],
          ),
          initialTargetsRemainingInLane:
            job.fastPreviewTargetQueue[evidence.acquisition.target.lane].length,
          inFlight:
            job.lanes[evidence.acquisition.target.lane].inFlightTargetId
              === evidence.evidenceId,
        })];
      }),
    });
    for (const dispatch of plan.dispatches) {
      const runtime = job.lanes[dispatch.lane];
      const evidence = job.fastPreviewEvidence.find(
        ({ evidenceId }) => evidenceId === dispatch.targetId,
      );
      if (
        evidence === undefined
        || runtime.inFlightTargetId !== null
        || runtime.inFlightFastPreviewRequest !== null
      ) {
        this.failJob(job, "fast-preview refinement dispatch state mismatch");
        return;
      }
      const issuedTarget = copyFastPreviewTargetV2(
        evidence.acquisition.target,
      );
      runtime.inFlightTargetId = dispatch.targetId;
      runtime.inFlightFastPreviewRequest = Object.freeze({
        target: issuedTarget,
        requestedNaturalBeatCount: dispatch.requestedNaturalBeatCount,
      });
      runtime.worker.postMessage(Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "refine-fast-preview-target" as const,
        jobId: job.jobId,
        lane: dispatch.lane,
        target: issuedTarget,
        requestedNaturalBeatCount: dispatch.requestedNaturalBeatCount,
      }));
    }
    if (plan.dispatches.length > 0) {
      job.stage = "preview-ready";
      return;
    }
    if (
      job.lanes["lower-volume"].inFlightTargetId !== null
      || job.lanes["higher-volume"].inFlightTargetId !== null
    ) return;

    job.fastPreviewRefinementComplete = true;
    job.stage = "continuation";
    this.dispatchPendingLaneTarget(job, job.lanes["lower-volume"]);
    this.dispatchPendingLaneTarget(job, job.lanes["higher-volume"]);
  }

  private dispatchStandardPreviewBeats(job: ActiveJobV2): void {
    let dispatched = false;
    for (const lane of ["lower-volume", "higher-volume"] as const) {
      const runtime = job.lanes[lane];
      if (
        runtime.inFlightTargetId !== null
        || runtime.inFlightFastPreviewRequest !== null
      ) continue;
      const evidence = job.fastPreviewEvidence
        .filter((candidate) =>
          candidate.evidenceClass !== "failure"
          && candidate.acquisition.target.lane === lane
          && candidate.acquisition.completedNaturalBeatCountAfterPrediction
            < scientificStandardQuickResponseNaturalBeatCountV1(
              candidate.acquisition.target,
            )
        )
        .sort((left, right) => {
          const leftNeedsThirdBeat = left.acquisition
            .completedNaturalBeatCountAfterPrediction < 3 ? 0 : 1;
          const rightNeedsThirdBeat = right.acquisition
            .completedNaturalBeatCountAfterPrediction < 3 ? 0 : 1;
          return leftNeedsThirdBeat - rightNeedsThirdBeat
            || left.acquisition.target.targetOrdinal
              - right.acquisition.target.targetOrdinal;
        })[0];
      if (evidence === undefined) continue;
      const stage = job.fastPreviewRefinementStageByTargetId.get(
        evidence.evidenceId,
      );
      if (
        stage === undefined
        || stage.completedNaturalBeatCount
          !== evidence.acquisition.completedNaturalBeatCountAfterPrediction
        || stage.completedNaturalBeatCount < 2
        || stage.completedNaturalBeatCount >= 5
      ) {
        this.failJob(
          job,
          "standard rapid preview lacks valid refinement evidence",
        );
        return;
      }
      const requestedNaturalBeatCount = (
        stage.completedNaturalBeatCount + 1
      ) as 3 | 4 | 5;
      const issuedTarget = copyFastPreviewTargetV2(
        evidence.acquisition.target,
      );
      runtime.inFlightTargetId = evidence.evidenceId;
      runtime.inFlightFastPreviewRequest = Object.freeze({
        target: issuedTarget,
        requestedNaturalBeatCount,
      });
      runtime.worker.postMessage(Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "refine-fast-preview-target" as const,
        jobId: job.jobId,
        lane,
        target: issuedTarget,
        requestedNaturalBeatCount,
      }));
      dispatched = true;
    }
    if (dispatched) {
      job.stage = "preview-ready";
      return;
    }
    if (
      job.lanes["lower-volume"].inFlightTargetId !== null
      || job.lanes["higher-volume"].inFlightTargetId !== null
    ) return;
    if (job.fastPreviewEvidence.some((evidence) =>
      evidence.evidenceClass !== "failure"
      && evidence.acquisition.completedNaturalBeatCountAfterPrediction
        < scientificStandardQuickResponseNaturalBeatCountV1(
          evidence.acquisition.target,
        )
    )) {
      this.failJob(
        job,
        "standard rapid preview completed with an under-refined point",
      );
      return;
    }
    this.finalizeStandardPreviewJob(job);
  }

  private finalizeStandardPreviewJob(job: ActiveJobV2): void {
    job.fastPreviewRefinementComplete = true;
    job.status = "complete";
    job.stage = "preview-complete";
    job.sequence += 1;
    job.snapshot = snapshotForJob(job);
    if (this.activeJob === job) this.activeJob = null;
  }

  private acceptContinuationResult(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
    message: MainWireScientificPreloadBranchWorkerTargetResultV2,
  ): void {
    const pointId = message.target.targetId;
    const issuedTarget = job.targetById.get(pointId);
    const isPeriod1 = message.point.status === "period1-converged";
    if (
      issuedTarget === undefined ||
      issuedTarget.lane !== message.target.lane ||
      Math.abs(issuedTarget.normalizedTbv - message.target.normalizedTbv) >
        1e-12 ||
      Math.abs(
        issuedTarget.totalBloodVolumeMl - message.target.totalBloodVolumeMl,
      ) > 1e-6 ||
      Math.abs(message.point.targetScale - message.target.normalizedTbv) >
        1e-12 ||
      Math.abs(
        message.point.fixedTotalBloodVolumeMl -
          message.target.totalBloodVolumeMl,
      ) > 1e-6 ||
      message.point.acceptedForPeriod1Locus !== isPeriod1 ||
      (isPeriod1 &&
        (!message.continuationAcceptedAsSeed ||
          message.terminalCheckpoint === null)) ||
      (!isPeriod1 &&
        (message.continuationAcceptedAsSeed ||
          message.terminalCheckpoint !== null))
    ) {
      this.failJob(
        job,
        "canonical continuation result violated its issued target or P1 seed contract",
      );
      return;
    }
    job.evidence.push(
      Object.freeze({
        point: message.point,
        provenance: provenanceForTarget(
          message.target,
          pointId,
          message.continuationAcceptedAsSeed,
          message.seedInitialization,
        ),
      }),
    );
    if (message.terminalCheckpoint !== null) {
      job.terminalCheckpointByPointId.set(pointId, message.terminalCheckpoint);
    }
    job.completedBeatCount += message.point.completedBeatCount;
    const plannerLane = plannerLaneForWorkerLane(runtime.lane);
    const outcome =
      message.point.status === "period1-converged"
        ? Object.freeze({
            targetId: message.target.targetId,
            lane: plannerLane,
            outcome: "P1" as const,
            completedBeatCount: Math.max(1, message.point.completedBeatCount),
            metrics: plannerMetrics(message.point),
          })
        : Object.freeze({
            targetId: message.target.targetId,
            lane: plannerLane,
            outcome:
              message.point.status === "period2-suspect"
                ? ("P2" as const)
                : ("failure" as const),
            completedBeatCount: Math.max(1, message.point.completedBeatCount),
            reason: message.point.failureReason ?? message.point.status,
          });
    const advanced = advanceMainWireScientificAdaptivePreloadEnvelopePlannerV2(
      job.planner,
      outcome,
    );
    job.planner = advanced.state;
    if (advanced.nextTarget !== null) {
      job.targetById.set(advanced.nextTarget.targetId, advanced.nextTarget);
      this.dispatchTarget(job, runtime, advanced.nextTarget, "continuation");
    } else {
      runtime.complete = true;
      if (
        job.lanes["lower-volume"].complete &&
        job.lanes["higher-volume"].complete
      ) {
        this.beginIndependentAudits(job);
      }
    }
    this.publishProgress(job);
  }

  private beginIndependentAudits(job: ActiveJobV2): void {
    const candidates = job.evidence.filter(
      ({ point, provenance }) =>
        provenance.direction !== "independent-audit" &&
        provenance.targetScale !== 1 &&
        point.status === "period1-converged",
    );
    const selected = AUDIT_TARGET_SCALES.flatMap((scale) => {
      const nearest =
        candidates.reduce<MainWireScientificPreloadPointEvidenceV2 | null>(
          (best, candidate) =>
            best === null ||
            Math.abs(candidate.provenance.targetScale - scale) <
              Math.abs(best.provenance.targetScale - scale)
              ? candidate
              : best,
          null,
        );
      return nearest === null ? [] : [nearest];
    }).filter(
      (candidate, index, all) =>
        all.findIndex(
          (other) => other.provenance.pointId === candidate.provenance.pointId,
        ) === index,
    );
    job.auditQueue = selected.flatMap((candidate, index) => {
      const referenceTarget = job.targetById.get(candidate.provenance.pointId);
      if (referenceTarget === undefined) return [];
      const auditTarget = Object.freeze({
        ...referenceTarget,
        targetId: `preload-envelope-v2-audit-${String(index + 1).padStart(2, "0")}-${referenceTarget.targetId}`,
        deterministicOrderKey: `2:${String(index + 1).padStart(6, "0")}`,
        lane:
          referenceTarget.normalizedTbv < 1
            ? ("negative" as const)
            : ("positive" as const),
        provenance: Object.freeze({
          ...referenceTarget.provenance,
          decision: "retain-step" as const,
          seedPointId: "preload-envelope-v2-baseline-nu-1p000000",
          seedNormalizedTbv: 1,
          stepFromSeedNormalizedTbv: Math.abs(
            referenceTarget.normalizedTbv - 1,
          ),
          priorBlockingTargetId: null,
          minimumStepFailureOrdinal: 0 as const,
        }),
      });
      return [
        Object.freeze({
          referencePointId: candidate.provenance.pointId,
          referenceTarget,
          auditTarget,
        }),
      ];
    });
    if (job.auditQueue.length === 0) {
      this.finalizeJob(job);
      return;
    }
    job.stage = "independent-audit";
    this.dispatchAvailableAudits(job);
  }

  private dispatchAvailableAudits(job: ActiveJobV2): void {
    for (const lane of ["lower-volume", "higher-volume"] as const) {
      if (job.activeAuditByLane[lane] !== null) continue;
      const queueIndex = job.auditQueue.findIndex(
        ({ auditTarget }) =>
          auditWorkerLane(auditTarget.normalizedTbv) === lane,
      );
      if (queueIndex < 0) continue;
      const [task] = job.auditQueue.splice(queueIndex, 1);
      if (task === undefined) continue;
      job.activeAuditByLane[lane] = task;
      this.dispatchTarget(
        job,
        job.lanes[lane],
        task.auditTarget,
        "independent-audit",
      );
    }
    if (
      job.auditQueue.length === 0 &&
      job.activeAuditByLane["lower-volume"] === null &&
      job.activeAuditByLane["higher-volume"] === null
    )
      this.finalizeJob(job);
  }

  private acceptAuditResult(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
    message: MainWireScientificPreloadBranchWorkerTargetResultV2,
  ): void {
    const task = job.activeAuditByLane[runtime.lane];
    if (
      task === null ||
      task.auditTarget.targetId !== message.target.targetId
    ) {
      this.failJob(job, "independent audit target identity mismatch");
      return;
    }
    const referenceCheckpoint =
      job.terminalCheckpointByPointId.get(task.referencePointId) ?? null;
    const auditComparison = auditComparisonForResult(
      job,
      referenceCheckpoint,
      message,
    );
    job.evidence = job.evidence.map((evidence) =>
      evidence.provenance.pointId === task.referencePointId
        ? Object.freeze({
            ...evidence,
            provenance: Object.freeze({
              ...evidence.provenance,
              auditStatus: auditComparison.status,
              auditMaximumNormalizedStateDelta:
                auditComparison.maximumNormalizedStateDelta,
            }),
          })
        : evidence,
    );
    job.evidence.push(
      Object.freeze({
        point: message.point,
        provenance: Object.freeze({
          pointId: message.target.targetId,
          direction: "independent-audit" as const,
          targetScale: message.target.normalizedTbv,
          seedScale: 1,
          seedKind: "source-baseline" as const,
          adaptiveStepScale: Math.abs(message.target.normalizedTbv - 1),
          attemptOrdinal: message.target.laneAttemptIndex,
          continuationAcceptedAsSeed: false,
          refinementReason: "independent-audit" as const,
          auditStatus: auditComparison.status,
          auditMaximumNormalizedStateDelta:
            auditComparison.maximumNormalizedStateDelta,
          seedInitialization: message.seedInitialization,
        }),
      }),
    );
    job.completedBeatCount += message.point.completedBeatCount;
    job.activeAuditByLane[runtime.lane] = null;
    this.publishProgress(job);
    this.dispatchAvailableAudits(job);
  }

  private dispatchPendingLaneTarget(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
  ): void {
    const target =
      job.planner.lanes[plannerLaneForWorkerLane(runtime.lane)].pendingTarget;
    if (target === null) {
      runtime.complete = true;
      return;
    }
    this.dispatchTarget(job, runtime, target, "continuation");
  }

  private dispatchTarget(
    job: ActiveJobV2,
    runtime: LaneRuntimeV2,
    target: MainWireScientificPreloadEnvelopeTargetV2,
    mode: "continuation" | "independent-audit",
  ): void {
    if (
      runtime.inFlightTargetId !== null
      || runtime.inFlightFastPreviewRequest !== null
    ) {
      this.failJob(job, `${runtime.lane} worker already has an active target`);
      return;
    }
    runtime.inFlightTargetId = target.targetId;
    runtime.worker.postMessage(
      Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "solve-target" as const,
        jobId: job.jobId,
        lane: runtime.lane,
        target,
        mode,
      }),
    );
  }

  private publishProgress(job: ActiveJobV2): void {
    if (job.status !== "running") return;
    job.sequence += 1;
    job.snapshot = snapshotForJob(job);
  }

  private finalizeJob(job: ActiveJobV2): void {
    const orderedEvidence = [...job.evidence].sort(comparePointEvidenceV2);
    const continuationEvidence = orderedEvidence.filter(
      ({ provenance }) => provenance.direction !== "independent-audit",
    );
    const points = continuationEvidence.map(({ point }) => point);
    const limits = MAIN_WIRE_SCIENTIFIC_ADAPTIVE_PRELOAD_ENVELOPE_LIMITS_V2;
    const result: MainWireScientificGuytonStarlingProtocolResultV2 =
      Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_GUYTON_STARLING_PROTOCOL_V2_ID,
        protocolVersion: "2.1.0" as const,
        source: job.baseline.source,
        claim: Object.freeze({
          totalBloodVolumeSweepIsOneDimensionalPreloadOperatingLocus:
            true as const,
          totalBloodVolumeSweepIsNotGuytonPumpExperiment: true as const,
          totalBloodVolumeSweepIsNotEspvrOrEdpvr: true as const,
          vascularCurveMethod:
            "cycle-mean-fixed-volume-vascular-pv-law-volume-constrained" as const,
          preloadInitialization:
            "bidirectional-adaptive-p1-secant-predictor-assisted-continuation-with-sparse-independent-audit" as const,
          frozenAutonomicRenalAndVascularControls: true as const,
          period2PointsAveragedIntoPeriod1Locus: false as const,
          interpolationAcrossPeriod2FailureOrUnresolvedBoundary: false as const,
        }),
        baselinePeriodicity: job.baseline.baselinePeriodicity,
        rightVascularFunction: job.baseline.rightVascularFunction,
        leftVascularFunction: job.baseline.leftVascularFunction,
        fastPreloadPreview: fastPreviewForJob(job),
        preloadPointEvidence: Object.freeze(orderedEvidence),
        preloadOperatingPoints: Object.freeze(points),
        preloadOperatingLocus:
          buildMainWireScientificPreloadOperatingLocusFromIdentifiedPointsV1(
            continuationEvidence.map(({ point, provenance }) =>
              Object.freeze({
                pointId: provenance.pointId,
                point,
              }),
            ),
          ),
        exploration: Object.freeze({
          normalizedTotalBloodVolumeEnvelope: Object.freeze([
            limits.minimumNormalizedTbv,
            limits.maximumNormalizedTbv,
          ]) as readonly [number, number],
          hardMinimumTotalBloodVolumeMl:
            limits.minimumNormalizedTbv *
            job.baseline.source.fixedTotalBloodVolumeMl,
          hardMaximumTotalBloodVolumeMl:
            limits.maximumNormalizedTbv *
            job.baseline.source.fixedTotalBloodVolumeMl,
          minimumAdaptiveStepScale: limits.minimumStepNormalizedTbv,
          maximumAdaptiveStepScale: limits.maximumStepNormalizedTbv,
          lowerBoundaryStatus: boundaryStatus(job.planner, "negative"),
          higherBoundaryStatus: boundaryStatus(job.planner, "positive"),
          sourceSessionMutated: false as const,
        }),
      });
    job.status = "complete";
    job.stage = "complete";
    job.sequence += 1;
    job.snapshot = snapshotForJob(job, result);
    if (this.activeJob === job) this.activeJob = null;
  }

  private failJob(job: ActiveJobV2, message: string): void {
    if (job.status !== "running") return;
    for (const lane of Object.values(job.lanes)) {
      try {
        lane.worker.terminate();
      } catch {
        // The job is already fail-closed.
      } finally {
        this.persistentWorkers.delete(lane.lane);
      }
    }
    job.status = "error";
    job.stage = "error";
    job.sequence += 1;
    job.snapshot = snapshotForJob(job, null, message);
    if (this.activeJob === job) this.activeJob = null;
  }

  private requireOwnedJob(
    input: Readonly<{
      ownerSessionId: string;
      jobId: string;
    }>,
  ): ActiveJobV2 {
    const job = this.jobs.get(input.jobId);
    if (job === undefined || job.ownerSessionId !== input.ownerSessionId) {
      throw new Error(
        "hemodynamic protocol job was not found for this session",
      );
    }
    return job;
  }
}

function sameFastPreviewTargetV2(
  left: MainWireScientificFastTbvPreviewTargetV1,
  right: MainWireScientificFastTbvPreviewTargetV1,
): boolean {
  return left.targetId === right.targetId
    && left.lane === right.lane
    && left.targetOrdinal === right.targetOrdinal
    && left.targetScale === right.targetScale
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl;
}

function copyFastPreviewTargetV2(
  target: MainWireScientificFastTbvPreviewTargetV1,
): MainWireScientificFastTbvPreviewTargetV1 {
  return Object.freeze({
    targetId: target.targetId,
    lane: target.lane,
    targetOrdinal: target.targetOrdinal,
    targetScale: target.targetScale,
    totalBloodVolumeMl: target.totalBloodVolumeMl,
  });
}

function createDefaultBranchWorkerV2(): MainWireScientificPreloadBranchWorkerLikeV2 {
  return new Worker(
    new URL("./mainWireScientificPreloadBranchWorkerV2.ts", import.meta.url),
    { type: "module" },
  ) as unknown as MainWireScientificPreloadBranchWorkerLikeV2;
}

function dependenciesFromCapsule(
  capsule: MainWireScientificHemodynamicJobCapsuleV2,
): MainWireScientificHemodynamicProtocolDependenciesV1 {
  if (capsule.capsuleId !== "main-wire-scientific-hemodynamic-job-capsule-v2") {
    throw new Error("hemodynamic protocol capsule identity mismatch");
  }
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  if (
    provider.providerId !== capsule.providerIdentity.providerId ||
    provider.parameterSetId !== capsule.providerIdentity.parameterSetId ||
    provider.parameterIdentityHash !==
      capsule.providerIdentity.parameterIdentityHash
  )
    throw new Error("hemodynamic protocol provider identity mismatch");
  return Object.freeze({
    provider,
    runtime: capsule.runtime,
    pericardium: capsule.pericardium,
    calciumDriveParams: capsule.calciumDriveParams,
  });
}

function plannerMetrics(point: MainWireScientificPreloadOperatingPointV1) {
  const cardiacOutputLMin = point.netCardiacOutputLMin;
  const meanRapTransmuralMmHg = point.meanRapTransmuralMmHg;
  const meanLapTransmuralMmHg = point.meanLapTransmuralMmHg;
  if (
    cardiacOutputLMin === null ||
    meanRapTransmuralMmHg === null ||
    meanLapTransmuralMmHg === null ||
    !Number.isFinite(cardiacOutputLMin) ||
    !Number.isFinite(meanRapTransmuralMmHg) ||
    !Number.isFinite(meanLapTransmuralMmHg)
  )
    throw new Error("preload point lacks finite planner metrics");
  return Object.freeze({
    cardiacOutputLMin,
    meanRapTransmuralMmHg,
    meanLapTransmuralMmHg,
  });
}

function baselinePointEvidence(
  point: MainWireScientificPreloadOperatingPointV1,
): MainWireScientificPreloadPointEvidenceV2 {
  return Object.freeze({
    point,
    provenance: Object.freeze({
      pointId: "preload-envelope-v2-baseline-nu-1p000000",
      direction: "source-baseline" as const,
      targetScale: 1,
      seedScale: 1,
      seedKind: "source-baseline" as const,
      adaptiveStepScale: 0,
      attemptOrdinal: 0,
      continuationAcceptedAsSeed: point.status === "period1-converged",
      refinementReason: "initial" as const,
      auditStatus: "not-scheduled" as const,
      auditMaximumNormalizedStateDelta: null,
      seedInitialization: null,
    }),
  });
}

function provenanceForTarget(
  target: MainWireScientificPreloadEnvelopeTargetV2,
  pointId: string,
  continuationAcceptedAsSeed: boolean,
  seedInitialization: MainWireScientificPreloadBranchWorkerTargetResultV2["seedInitialization"],
): MainWireScientificPreloadPointProvenanceV2 {
  return Object.freeze({
    pointId,
    direction:
      target.lane === "negative"
        ? ("lower-volume" as const)
        : ("higher-volume" as const),
    targetScale: target.normalizedTbv,
    seedScale: target.provenance.seedNormalizedTbv,
    seedKind:
      target.provenance.seedNormalizedTbv === 1
        ? ("source-baseline" as const)
        : ("previous-period1" as const),
    adaptiveStepScale: target.provenance.stepFromSeedNormalizedTbv,
    attemptOrdinal: target.laneAttemptIndex,
    continuationAcceptedAsSeed,
    refinementReason: refinementReason(target),
    auditStatus: "not-scheduled" as const,
    auditMaximumNormalizedStateDelta: null,
    seedInitialization,
  });
}

function refinementReason(
  target: MainWireScientificPreloadEnvelopeTargetV2,
): MainWireScientificPreloadPointProvenanceV2["refinementReason"] {
  switch (target.provenance.decision) {
    case "initial-step":
      return "initial";
    case "fast-low-curvature-grow":
      return "easy-convergence";
    case "high-curvature-shrink":
      return "high-curvature";
    case "slow-convergence-shrink":
      return "slow-convergence";
    case "blocking-midpoint-retry":
    case "minimum-step-confirmation":
      return "periodicity-boundary";
    default:
      return "routine-continuation";
  }
}

function plannerLaneForWorkerLane(
  lane: MainWireScientificPreloadBranchWorkerLaneV2,
): MainWireScientificPreloadEnvelopeLaneV2 {
  return lane === "lower-volume" ? "negative" : "positive";
}

function auditComparisonForResult(
  job: ActiveJobV2,
  referenceCheckpoint: MainWireScientificPreloadBranchWorkerTargetResultV2["terminalCheckpoint"],
  message: MainWireScientificPreloadBranchWorkerTargetResultV2,
): Readonly<{
  status: MainWireScientificPreloadPointProvenanceV2["auditStatus"];
  maximumNormalizedStateDelta: number | null;
}> {
  if (
    referenceCheckpoint === null ||
    message.terminalCheckpoint === null ||
    message.point.status !== "period1-converged"
  )
    return Object.freeze({
      status: "audit-failed" as const,
      maximumNormalizedStateDelta: null,
    });
  try {
    const reference = restoreMainWireFiveWallNonCoronaryV1(
      job.dependencies.provider,
      referenceCheckpoint,
    );
    const audit = restoreMainWireFiveWallNonCoronaryV1(
      job.dependencies.provider,
      message.terminalCheckpoint,
    );
    const closure = compareMainWireFiveWallAcceptedStatesV1(
      audit,
      reference,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    return Object.freeze({
      status:
        closure.overall.maximumNormalizedDelta <= 1e-3
          ? ("matched" as const)
          : ("path-dependence-suspect" as const),
      maximumNormalizedStateDelta: closure.overall.maximumNormalizedDelta,
    });
  } catch {
    return Object.freeze({
      status: "audit-failed" as const,
      maximumNormalizedStateDelta: null,
    });
  }
}

function snapshotForJob(
  job: ActiveJobV2,
  result: MainWireScientificGuytonStarlingProtocolResultV2 | null = null,
  errorMessage: string | null = null,
): MainWireScientificHemodynamicJobSnapshotV2 {
  const activeDirections: MainWireScientificPreloadSweepDirectionV2[] = [];
  if (job.status === "running") {
    if (job.stage === "independent-audit") {
      activeDirections.push("independent-audit");
    } else {
      if (!job.lanes["lower-volume"].complete) {
        activeDirections.push("lower-volume");
      }
      if (!job.lanes["higher-volume"].complete) {
        activeDirections.push("higher-volume");
      }
    }
  }
  const completedPointCount = job.evidence.length;
  return Object.freeze({
    jobId: job.jobId,
    detailMode: job.detailMode,
    sequence: job.sequence,
    status: job.status,
    stage: job.stage,
    source: job.baseline.source,
    baselinePeriodicity: job.baseline.baselinePeriodicity,
    rightVascularFunction: job.baseline.rightVascularFunction,
    leftVascularFunction: job.baseline.leftVascularFunction,
    fastPreloadPreview: fastPreviewForJob(job),
    preloadPointEvidence: Object.freeze([...job.evidence]),
    progress: Object.freeze({
      completedPointCount,
      plannedPointCountLowerBound: Math.max(
        job.detailMode === "standard"
          ? completedPointCount
          : MINIMUM_PLANNED_POINT_COUNT,
        completedPointCount + activeDirections.length,
      ),
      activeDirections: Object.freeze(activeDirections),
      completedBeatCount: job.completedBeatCount,
      fastPreviewCompletedPointCount: job.fastPreviewEvidence.length,
      fastPreviewPlannedPointCount: FAST_PREVIEW_PLANNED_POINT_COUNT,
    }),
    result,
    errorMessage,
  });
}

function fastPreviewForJob(job: ActiveJobV2) {
  const empty = emptyMainWireScientificFastTbvPreviewV1({
    source: job.baseline.source,
    sourceFingerprint: job.sourceFingerprint,
  });
  return Object.freeze({
    ...empty,
    evidence: Object.freeze(
      [...job.fastPreviewEvidence].sort(
        (left, right) =>
          left.acquisition.target.targetScale -
          right.acquisition.target.targetScale,
      ),
    ),
  });
}

function boundaryStatus(
  planner: MainWireScientificAdaptivePreloadEnvelopePlannerStateV2,
  lane: MainWireScientificPreloadEnvelopeLaneV2,
): "reached" | "unresolved" | "cancelled" {
  return planner.lanes[lane].status === "complete" ? "reached" : "unresolved";
}

function boundedPollInterval(value: number): number {
  if (!Number.isFinite(value)) throw new Error("poll interval must be finite");
  return Math.max(100, Math.min(2_000, Math.round(value)));
}

function estimatedNextFastPreviewBeatWallTimeMs(
  measuredBeatWallTimesMs: readonly number[],
): number {
  const finitePositive = measuredBeatWallTimesMs
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);
  if (finitePositive.length === 0) return 500;
  const percentileIndex = Math.min(
    finitePositive.length - 1,
    Math.ceil(finitePositive.length * 0.8) - 1,
  );
  return finitePositive[percentileIndex]!;
}

function monotonicNowMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function auditWorkerLane(
  normalizedTbv: number,
): MainWireScientificPreloadBranchWorkerLaneV2 {
  return normalizedTbv < 1 ? "lower-volume" : "higher-volume";
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function comparePointEvidenceV2(
  left: MainWireScientificPreloadPointEvidenceV2,
  right: MainWireScientificPreloadPointEvidenceV2,
): number {
  const leftAudit = left.provenance.direction === "independent-audit" ? 1 : 0;
  const rightAudit = right.provenance.direction === "independent-audit" ? 1 : 0;
  if (leftAudit !== rightAudit) return leftAudit - rightAudit;
  if (left.provenance.targetScale !== right.provenance.targetScale) {
    return left.provenance.targetScale - right.provenance.targetScale;
  }
  if (left.provenance.attemptOrdinal !== right.provenance.attemptOrdinal) {
    return left.provenance.attemptOrdinal - right.provenance.attemptOrdinal;
  }
  return left.provenance.pointId < right.provenance.pointId
    ? -1
    : left.provenance.pointId > right.provenance.pointId
      ? 1
      : 0;
}

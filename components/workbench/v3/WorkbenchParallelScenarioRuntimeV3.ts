import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  type ExperimentScenarioV2,
  type ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  validateStudioSimulationAnalysisV2,
  validateStudioSimulationPortableIdV2,
  validateStudioSimulationScenarioInputV2,
  type StudioSimulationAnalysisExecutionPlanResolverV2,
  type StudioSimulationAnalysisV2,
  type StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import { StudioSimulationWorkerClientV2 } from
  "@/studio/workers/StudioSimulationWorkerClientV2";
import type {
  StudioSimulationWorkerApplyControlInputV2,
  StudioSimulationWorkerRequestAnalysisInputV2,
  StudioSimulationWorkerScenarioCapturesV2,
  StudioSimulationWorkerScenarioDescriptorV2,
  StudioSimulationWorkerScenarioStateV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";

import {
  WorkbenchGroupTimeConductorV3,
  type WorkbenchGroupPlaybackRateStateV3,
  type WorkbenchGroupTimeConductorDependenciesV3,
} from "./WorkbenchGroupTimeConductorV3";
import {
  recordWorkbenchPerformanceDurationV3,
  recordWorkbenchPerformanceEventIntervalV3,
  recordWorkbenchPerformanceValueV3,
  workbenchPerformanceDiagnosticsEnabledV3,
} from "./WorkbenchPerformanceDiagnosticsV3";
import {
  resolveWorkbenchPresentationProfileV3,
  type WorkbenchPresentationProfileV3,
} from "./WorkbenchPresentationProfileV3";
import type {
  WorkbenchBackgroundJobHandleV3,
  WorkbenchBackgroundWorkerPoolPortV3,
} from "./WorkbenchBackgroundWorkerPoolV3";
import {
  WorkbenchScenarioSteadyCandidateCoordinatorV3,
  type WorkbenchSteadyCandidateSourceV3,
} from "./WorkbenchScenarioSteadyCandidateCoordinatorV3";
import { randomPortableTokenV3 } from "./randomPortableTokenV3";

export type WorkbenchParallelScenarioSeedV3 = Readonly<{
  scenarioId: string;
  label: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
}>;

export type WorkbenchParallelScenarioRuntimeClientV3 = Pick<
  StudioSimulationWorkerClientV2,
  | "advance"
  | "advancePresentation"
  | "applyControl"
  | "initialize"
  | "readScenarios"
  | "requestAnalysis"
  | "terminate"
> & Readonly<{
  presentationTiming?: StudioSimulationWorkerClientV2["presentationTiming"];
}>;

type WorkbenchParallelScenarioTimeConductorV3 = Pick<
  WorkbenchGroupTimeConductorV3<StudioSimulationFrameV2>,
  | "dispose"
  | "lanesChanged"
  | "pause"
  | "play"
  | "playbackRateState"
  | "running"
  | "setPlaybackRate"
  | "terminate"
>;

type WorkbenchParallelScenarioLaneV3 = {
  descriptor: StudioSimulationWorkerScenarioDescriptorV2;
  runtimeSessionId: string;
  client: WorkbenchParallelScenarioRuntimeClientV3;
  latestFrame: StudioSimulationFrameV2;
  completeOutputIds: ReadonlySet<string>;
};

export type WorkbenchParallelScenarioRuntimeDependenciesV3 = Readonly<{
  expectedModelId: string;
  releaseTicket: StudioModelWorkerReleaseTicketV2;
  onFrames(frames: readonly StudioSimulationFrameV2[]): void;
  onError(error: Error): void;
  createClient?: (
    scenarioId: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
  createAnalysisClient?: (
    scenarioId: string,
    analysisPartition?: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
  backgroundWorkerPool?: WorkbenchBackgroundWorkerPoolPortV3;
  resolveAnalysisExecutionPlan?:
    StudioSimulationAnalysisExecutionPlanResolverV2;
  createTimeConductor?: (
    dependencies:
      WorkbenchGroupTimeConductorDependenciesV3<StudioSimulationFrameV2>,
  ) => WorkbenchParallelScenarioTimeConductorV3;
  createRuntimeSessionId?: (scenarioId: string) => string;
  presentationProfile?: WorkbenchPresentationProfileV3;
  /** Current authored scalar signals needed between complete terminal frames. */
  presentationOutputIds?: () => ReadonlySet<string> | readonly string[];
  onPlaybackRateChange?(state: WorkbenchGroupPlaybackRateStateV3): void;
}>;

type ParallelRuntimeStateV3 =
  | "new"
  | "initializing"
  | "active"
  | "terminated";

/**
 * Runtime-only pool with one persistent numerical Worker per Scenario.
 *
 * No lane identity or playback status crosses the durable boundary. Exact
 * captures are gathered only on an explicit authoring command and are then
 * handed to the short-lived authoring/qualification coordinator.
 */
export class WorkbenchParallelScenarioRuntimeV3 {
  readonly #expectedModelId: string;
  readonly #releaseTicket: StudioModelWorkerReleaseTicketV2;
  readonly #onFrames: (frames: readonly StudioSimulationFrameV2[]) => void;
  readonly #onError: (error: Error) => void;
  readonly #createClient: (
    scenarioId: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
  readonly #createAnalysisClient: (
    scenarioId: string,
    analysisPartition?: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
  readonly #backgroundWorkerPool:
    WorkbenchBackgroundWorkerPoolPortV3 | undefined;
  readonly #steadyCandidates:
    WorkbenchScenarioSteadyCandidateCoordinatorV3 | undefined;
  readonly #resolveAnalysisExecutionPlan:
    StudioSimulationAnalysisExecutionPlanResolverV2;
  readonly #timeConductor: WorkbenchParallelScenarioTimeConductorV3;
  readonly #createRuntimeSessionId: (scenarioId: string) => string;
  readonly #presentationProfile: WorkbenchPresentationProfileV3;
  readonly #presentationOutputIds:
    () => ReadonlySet<string> | readonly string[];
  readonly #lanes = new Map<string, WorkbenchParallelScenarioLaneV3>();
  readonly #analysisClients = new Set<
    WorkbenchParallelScenarioRuntimeClientV3
  >();
  readonly #analysisJobsByScenario = new Map<
    string,
    Set<WorkbenchBackgroundJobHandleV3<unknown>>
  >();
  readonly #pendingScenarioIds = new Set<string>();
  readonly #scenarioPauseLeaseCounts = new Map<string, number>();
  #state: ParallelRuntimeStateV3 = "new";
  #activeScenarioId: string | null = null;
  #playing = false;
  #failed = false;

  constructor(dependencies: WorkbenchParallelScenarioRuntimeDependenciesV3) {
    this.#expectedModelId = dependencies.expectedModelId;
    this.#releaseTicket = dependencies.releaseTicket;
    this.#onFrames = dependencies.onFrames;
    this.#onError = dependencies.onError;
    this.#createClient = dependencies.createClient
      ?? (() => new StudioSimulationWorkerClientV2());
    this.#createAnalysisClient = dependencies.createAnalysisClient
      ?? (() => new StudioSimulationWorkerClientV2());
    this.#backgroundWorkerPool = dependencies.backgroundWorkerPool;
    this.#steadyCandidates = dependencies.backgroundWorkerPool === undefined
      ? undefined
      : new WorkbenchScenarioSteadyCandidateCoordinatorV3(
          dependencies.backgroundWorkerPool,
        );
    this.#resolveAnalysisExecutionPlan = dependencies.resolveAnalysisExecutionPlan
      ?? (() => null);
    this.#createRuntimeSessionId = dependencies.createRuntimeSessionId
      ?? (() => `workbench-lane-${randomPortableTokenV3()}`);
    this.#presentationProfile = dependencies.presentationProfile
      ?? resolveWorkbenchPresentationProfileV3();
    this.#presentationOutputIds = dependencies.presentationOutputIds
      ?? (() => Object.freeze([]));
    const createTimeConductor = dependencies.createTimeConductor
      ?? ((conductorDependencies) =>
        new WorkbenchGroupTimeConductorV3(conductorDependencies));
    this.#timeConductor = createTimeConductor({
      lanes: () => [...this.#lanes.values()].map((lane) => Object.freeze({
        laneId: lane.descriptor.scenarioId,
        acceptedTimeSec: lane.latestFrame.acceptedTimeSec,
        advance: (stepCount) => this.#advanceLane(lane, stepCount),
        frameAcceptedTimeSec: (frame) => frame.acceptedTimeSec,
      })),
      onFrames: (frames) => this.#publishFrames(frames),
      onError: (error) => this.#fail(error),
      onPlaybackRateChange: dependencies.onPlaybackRateChange,
      batchSteps: this.#presentationProfile.maximumBatchSteps,
      presentationIntervalMs:
        this.#presentationProfile.presentationIntervalMs,
      maximumPresentationFramesPerLane:
        this.#presentationProfile.maximumPresentationBatchFrames,
    });
  }

  async initialize(input: Readonly<{
    scenarios: readonly WorkbenchParallelScenarioSeedV3[];
    activeScenarioId: string;
  }>): Promise<StudioSimulationWorkerScenarioStateV2> {
    if (this.#state !== "new") {
      throw new Error("parallel Scenario runtime cannot initialize twice");
    }
    validateScenarioSeedsV3(input.scenarios, input.activeScenarioId);
    this.#state = "initializing";
    // Reserve the live-lane budget before module Workers start. This prevents
    // speculative settlement from filling the device while initial Scenario
    // lanes are coming online.
    this.#syncBackgroundWorkerBudget(input.scenarios.length);
    const results = await Promise.allSettled(input.scenarios.map((seed) =>
      this.#createLane(seed)));
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failures.length > 0 || this.#isTerminated()) {
      for (const result of results) {
        if (result.status === "fulfilled") terminateLaneV3(result.value);
      }
      this.#state = "terminated";
      this.#syncBackgroundWorkerBudget(0);
      const reason = failures[0]?.reason;
      throw errorAsErrorV3(
        reason ?? "parallel Scenario runtime was terminated during initialization",
      );
    }
    for (const result of results) {
      if (result.status === "fulfilled") {
        this.#lanes.set(result.value.descriptor.scenarioId, result.value);
      }
    }
    this.#timeConductor.lanesChanged();
    this.#syncBackgroundWorkerBudget();
    this.#activeScenarioId = input.activeScenarioId;
    this.#state = "active";
    return this.currentState();
  }

  get playing(): boolean {
    return this.#playing;
  }

  get scenarioCount(): number {
    return this.#lanes.size;
  }

  playbackRateState(): WorkbenchGroupPlaybackRateStateV3 {
    return this.#timeConductor.playbackRateState();
  }

  setPlaybackRate(
    rate: number | "auto",
  ): WorkbenchGroupPlaybackRateStateV3 {
    this.#requireActive();
    return this.#timeConductor.setPlaybackRate(rate);
  }

  descriptors(): readonly StudioSimulationWorkerScenarioDescriptorV2[] {
    this.#requireActive();
    return Object.freeze([...this.#lanes.values()].map(({ descriptor }) =>
      descriptor));
  }

  activeFrame(): StudioSimulationFrameV2 {
    const activeScenarioId = this.#requiredActiveScenarioId();
    return this.#requiredLane(activeScenarioId).latestFrame;
  }

  latestFrame(scenarioId: string): StudioSimulationFrameV2 {
    this.#requireActive();
    return this.#requiredLane(scenarioId).latestFrame;
  }

  /**
   * Non-throwing frame lookup for asynchronous presentation callbacks.
   * A queued visual slice may arrive after its Scenario was deleted; that is
   * normal cancellation, not a runtime failure.
   */
  maybeLatestFrame(scenarioId: string): StudioSimulationFrameV2 | undefined {
    if (this.#state !== "active") return undefined;
    return this.#lanes.get(scenarioId)?.latestFrame;
  }

  currentState(): StudioSimulationWorkerScenarioStateV2 {
    return Object.freeze({
      activeScenarioId: this.#requiredActiveScenarioId(),
      scenarios: this.descriptors(),
      frame: this.activeFrame(),
    });
  }

  selectScenario(scenarioId: string): StudioSimulationWorkerScenarioStateV2 {
    this.#requireActive();
    this.#requiredLane(scenarioId);
    this.#activeScenarioId = scenarioId;
    return this.currentState();
  }

  async addScenario(
    seed: WorkbenchParallelScenarioSeedV3,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    this.#requireActive();
    if (
      this.#lanes.has(seed.scenarioId)
      || this.#pendingScenarioIds.has(seed.scenarioId)
    ) {
      throw new Error(`parallel Scenario already exists: ${seed.scenarioId}`);
    }
    if (
      this.#lanes.size + this.#pendingScenarioIds.size
        >= STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
    ) {
      throw new Error(
        `parallel Scenario limit is ${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2}`,
      );
    }
    this.#pendingScenarioIds.add(seed.scenarioId);
    this.#syncBackgroundWorkerBudget();
    let lane: WorkbenchParallelScenarioLaneV3 | undefined;
    let adopted = false;
    try {
      lane = await this.#createLane(seed);
      if (this.#state !== "active") {
        throw new Error("parallel Scenario runtime was terminated during add");
      }
      if (this.#lanes.has(seed.scenarioId)) {
        throw new Error(`parallel Scenario already exists: ${seed.scenarioId}`);
      }
      const shouldResume = this.#timeConductor.running;
      if (shouldResume) await this.#timeConductor.pause();
      this.#lanes.set(seed.scenarioId, lane);
      adopted = true;
      this.#activeScenarioId = seed.scenarioId;
      this.#timeConductor.lanesChanged();
      if (shouldResume && this.#canRunGroup()) this.#timeConductor.play();
      return this.currentState();
    } catch (error) {
      if (!adopted && lane !== undefined) terminateLaneV3(lane);
      else if (adopted && this.#state === "active") {
        this.#fail(errorAsErrorV3(error));
      }
      throw error;
    } finally {
      this.#pendingScenarioIds.delete(seed.scenarioId);
      this.#syncBackgroundWorkerBudget();
    }
  }

  async duplicateScenario(input: Readonly<{
    sourceScenarioId: string;
    scenarioId: string;
    label: string;
  }>): Promise<StudioSimulationWorkerScenarioStateV2> {
    const source = await this.#captureScenario(input.sourceScenarioId);
    const ownedCapture = validateStudioSimulationScenarioInputV2({
      scenarioId: input.scenarioId,
      fixture: source.capture.fixture,
      checkpoint: source.capture.checkpoint,
    }, "$.duplicateScenario");
    return this.addScenario({
      scenarioId: input.scenarioId,
      label: input.label,
      fixture: ownedCapture.fixture,
      checkpoint: ownedCapture.checkpoint,
    });
  }

  renameScenario(input: Readonly<{
    scenarioId: string;
    label: string;
  }>): StudioSimulationWorkerScenarioStateV2 {
    this.#requireActive();
    const lane = this.#requiredLane(input.scenarioId);
    requireScenarioLabelV3(input.label);
    lane.descriptor = Object.freeze({
      scenarioId: input.scenarioId,
      label: input.label,
    });
    return this.currentState();
  }

  async deleteScenario(
    scenarioId: string,
  ): Promise<StudioSimulationWorkerScenarioStateV2> {
    this.#requireActive();
    if (this.#lanes.size <= 1) {
      throw new Error("parallel Scenario runtime cannot delete its last Scenario");
    }
    const lane = this.#requiredLane(scenarioId);
    const shouldResume = this.#timeConductor.running;
    if (shouldResume) await this.#timeConductor.pause();
    this.#cancelScenarioAnalysisJobs(scenarioId);
    this.#lanes.delete(scenarioId);
    this.#scenarioPauseLeaseCounts.delete(scenarioId);
    this.#timeConductor.lanesChanged();
    this.#syncBackgroundWorkerBudget();
    this.#steadyCandidates?.invalidateScenario(scenarioId);
    if (this.#activeScenarioId === scenarioId) {
      this.#activeScenarioId = this.#lanes.keys().next().value ?? null;
    }
    lane.client.terminate();
    if (shouldResume && this.#canRunGroup()) this.#timeConductor.play();
    this.#syncBackgroundWorkerBudget();
    return this.currentState();
  }

  async applyControl(
    input: Omit<StudioSimulationWorkerApplyControlInputV2, "runtimeSessionId">,
  ): Promise<StudioSimulationFrameV2> {
    this.#requireActive();
    const lane = this.#requiredLane(input.scenarioId);
    const frame = await lane.client.applyControl({
      ...input,
      runtimeSessionId: lane.runtimeSessionId,
    });
    lane.latestFrame = frame;
    // Every queued/running analysis was forked from the old input epoch. Letting
    // it finish cannot produce an admissible result and, on a one-slot device,
    // can keep the current PV/Starling request behind minutes of stale work.
    // Cancel only after the control was accepted: a rejected edit leaves the
    // old input (and its analysis) valid. Unrelated Scenario work and explicit
    // Save/Snapshot jobs retain their normal QoS contract.
    this.#cancelScenarioAnalysisJobs(input.scenarioId);
    await this.#prewarmLane(lane);
    return frame;
  }

  async requestAnalysis(
    input: Omit<StudioSimulationWorkerRequestAnalysisInputV2, "runtimeSessionId">
      & Readonly<{
        onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
        onLiveLaneReleased?: () => void;
        /** Transfers one pauseScenario lease already owned by the caller. */
        sourceAlreadyPaused?: boolean;
      }>,
  ): Promise<StudioSimulationAnalysisV2> {
    this.#requireActive();
    const lane = this.#requiredLane(input.scenarioId);
    const executionPlan = input.analysisPartition === undefined
      ? this.#resolveAnalysisExecutionPlan(input.analysisId)
      : null;
    const partitions = executionPlan === null
      ? Object.freeze([input.analysisPartition])
      : validatedAnalysisPartitionsV3(executionPlan.partitions);
    let sourcePauseLeaseOwned = false;
    try {
      if (input.sourceAlreadyPaused === true) {
        if (!this.#scenarioPauseLeaseCounts.has(input.scenarioId)) {
          throw new Error(
            "parallel Scenario analysis was not given its declared pause lease",
          );
        }
        sourcePauseLeaseOwned = true;
      } else {
        await this.pauseScenario(input.scenarioId);
        sourcePauseLeaseOwned = true;
      }
      const sourceFrame = lane.latestFrame;
      if (
        sourceFrame.inputEpoch !== input.expectedInputEpoch
        || sourceFrame.acceptedRevision !== input.expectedAcceptedRevision
        || sourceFrame.acceptedTimeSec !== input.expectedAcceptedTimeSec
      ) throw new Error("parallel Scenario analysis source clocks are stale");

      const source = await this.#captureScenario(input.scenarioId);
      if (
        source.capture.checkpoint.acceptedRevision
          !== input.expectedAcceptedRevision
        || source.capture.checkpoint.acceptedTimeSec
          !== input.expectedAcceptedTimeSec
      ) throw new Error("parallel Scenario analysis capture clocks differ");

      // The exact source tuple is now detached from the live lane. Resume it
      // before the shared steady candidate is awaited or another Worker is
      // leased; queueing and numerical work must never extend the visible pause.
      this.resumeScenario(input.scenarioId);
      sourcePauseLeaseOwned = false;
      input.onLiveLaneReleased?.();

      const sourceForAnalysis = this.#bestAvailableSteadyCandidate(
        source,
        sourceFrame.inputEpoch,
      );
      const checkpoint = sourceForAnalysis.capture.checkpoint;

      const remap = (analysis: StudioSimulationAnalysisV2) =>
        validateStudioSimulationAnalysisV2({
          ...analysis,
          runtimeSessionId: lane.runtimeSessionId,
          inputEpoch: input.expectedInputEpoch,
          sourceAcceptedRevision: checkpoint.acceptedRevision,
          sourceAcceptedTimeSec: checkpoint.acceptedTimeSec,
        }, "$.parallelScenarioAnalysis");
      const latestByPartition = new Map<string | undefined,
        StudioSimulationAnalysisV2>();
      const publishProgress = (
        analysisPartition: string | undefined,
        progress: StudioSimulationAnalysisV2,
      ) => {
        const remapped = remap(progress);
        latestByPartition.set(analysisPartition, remapped);
        input.onProgress?.(
          executionPlan === null
            ? remapped
            : executionPlan.merge([...latestByPartition.values()]),
        );
      };
      const analyses = await Promise.all(partitions.map((analysisPartition) =>
        this.#withAnalysisClient(
          input.scenarioId,
          analysisPartition,
          async (client) => {
            if (this.#state === "terminated") {
              throw new Error("parallel Scenario runtime was terminated");
            }
            this.#analysisClients.add(client);
            try {
              const runtimeSessionId =
                `workbench-analysis-${randomPortableTokenV3()}`;
              const initialFrame = await client.initialize({
                expectedModelId: this.#expectedModelId,
                releaseTicket: this.#releaseTicket,
                runtimeSessionId,
                scenarioId: input.scenarioId,
                scenarioLabel: sourceForAnalysis.label,
                fixture: sourceForAnalysis.capture.fixture,
                checkpoint,
              });
              const analysis = await client.requestAnalysis({
                runtimeSessionId,
                scenarioId: input.scenarioId,
                analysisId: input.analysisId,
                expectedInputEpoch: initialFrame.inputEpoch,
                expectedAcceptedRevision: initialFrame.acceptedRevision,
                expectedAcceptedTimeSec: initialFrame.acceptedTimeSec,
                ...(analysisPartition === undefined
                  ? {}
                  : { analysisPartition }),
                ...(input.onProgress === undefined
                  ? {}
                  : {
                      onProgress: (progress) => publishProgress(
                        analysisPartition,
                        progress,
                      ),
                    }),
              });
              return remap(analysis);
            } finally {
              this.#analysisClients.delete(client);
            }
          },
        )));
      return executionPlan === null
        ? analyses[0]!
        : executionPlan.merge(analyses);
    } finally {
      if (sourcePauseLeaseOwned) this.resumeScenario(input.scenarioId);
    }
  }

  async #withAnalysisClient<T>(
    scenarioId: string,
    analysisPartition: string | undefined,
    operation: (client: WorkbenchParallelScenarioRuntimeClientV3) => Promise<T>,
  ): Promise<T> {
    if (this.#backgroundWorkerPool !== undefined) {
      const handle = this.#backgroundWorkerPool.schedule("analysis", operation);
      this.#trackScenarioAnalysisJob(scenarioId, handle);
      try {
        return await handle.promise;
      } finally {
        this.#untrackScenarioAnalysisJob(scenarioId, handle);
      }
    }
    const client = this.#createAnalysisClient(scenarioId, analysisPartition);
    try {
      return await operation(client);
    } finally {
      client.terminate();
    }
  }

  async captureScenarios(): Promise<StudioSimulationWorkerScenarioCapturesV2> {
    this.#requireActive();
    const scenarios = await Promise.all([...this.#lanes.values()].map(async (
      lane,
    ) => {
      const capture = await lane.client.readScenarios({
        runtimeSessionId: lane.runtimeSessionId,
      });
      const scenario = capture.scenarios.find(({ scenarioId }) =>
        scenarioId === lane.descriptor.scenarioId);
      if (capture.scenarios.length !== 1 || scenario === undefined) {
        throw new Error(
          "parallel Scenario lane returned another Scenario membership",
        );
      }
      return Object.freeze({
        scenarioId: lane.descriptor.scenarioId,
        label: lane.descriptor.label,
        capture: scenario.capture,
      });
    }));
    return Object.freeze({
      activeScenarioId: this.#requiredActiveScenarioId(),
      scenarios: Object.freeze(scenarios),
    });
  }

  /**
   * Selects the newest already-produced cycle-boundary candidate for each
   * detached intent target. It never waits for speculative convergence. When
   * no candidate is ready, the click-time exact capture remains authoritative
   * and a low-priority candidate is started only for a later request.
   */
  selectBestAvailableScenarioCaptures(
    captures: StudioSimulationWorkerScenarioCapturesV2,
  ): StudioSimulationWorkerScenarioCapturesV2 {
    this.#requireActive();
    if (this.#steadyCandidates === undefined) return captures;
    const scenarios = captures.scenarios.map((scenario) => {
      const lane = this.#requiredLane(scenario.scenarioId);
      const source = {
        modelId: this.#expectedModelId,
        releaseTicket: this.#releaseTicket,
        inputEpoch: lane.latestFrame.inputEpoch,
        scenario,
      } satisfies WorkbenchSteadyCandidateSourceV3;
      const candidate = this.#steadyCandidates!.bestAvailable(source);
      if (candidate === null) {
        this.#steadyCandidates!.prewarm(source);
        return scenario;
      }
      return Object.freeze({
        ...candidate.scenario,
        // Labels are authored presentation metadata, not numerical candidate
        // identity. Preserve a rename without recomputing the same state.
        label: scenario.label,
      });
    });
    return Object.freeze({
      activeScenarioId: captures.activeScenarioId,
      scenarios: Object.freeze(scenarios),
    });
  }

  playAll(): void {
    // Async UI continuations may still hold this pool after a lane failure has
    // already fail-closed it. Resuming a discarded authority is intentionally
    // a no-op; new/initializing misuse remains an error.
    if (this.#state === "terminated") return;
    this.#requireActive();
    if (this.#playing) return;
    this.#playing = true;
    // Reserve foreground capacity before the conductor starts requesting batches;
    // otherwise paused-time speculation can briefly overfill the device.
    this.#syncBackgroundWorkerBudget(
      this.#lanes.size + this.#pendingScenarioIds.size,
    );
    try {
      if (this.#scenarioPauseLeaseCounts.size === 0) {
        this.#timeConductor.play();
      }
      this.#syncBackgroundWorkerBudget();
    } catch (error) {
      this.#fail(errorAsErrorV3(error));
    }
  }

  async pauseAll(): Promise<void> {
    if (this.#state === "terminated") return;
    this.#requireActive();
    this.#playing = false;
    try {
      await this.#timeConductor.pause();
    } finally {
      // A paused Workbench has no foreground numerical lanes. Give its idle
      // cores back to explicit analysis/prewarm instead of charging Scenario
      // membership as if every Scenario were still running.
      this.#syncBackgroundWorkerBudget();
    }
  }

  /**
   * Acquires a short group-pause lease for one Scenario operation.
   *
   * Comparative lanes share one model-time clock, so a source capture cannot
   * advance its siblings independently. The group resumes as soon as all
   * outstanding Scenario leases are released.
   */
  async pauseScenario(
    scenarioId: string,
  ): Promise<StudioSimulationFrameV2> {
    if (this.#state === "terminated") {
      throw new Error("parallel Scenario runtime is not active");
    }
    this.#requireActive();
    const lane = this.#requiredLane(scenarioId);
    this.#scenarioPauseLeaseCounts.set(
      scenarioId,
      (this.#scenarioPauseLeaseCounts.get(scenarioId) ?? 0) + 1,
    );
    try {
      await this.#timeConductor.pause();
    } catch (error) {
      this.#releaseScenarioPauseLease(scenarioId);
      throw error;
    }
    this.#syncBackgroundWorkerBudget();
    return lane.latestFrame;
  }

  /** Releases one group-pause lease without changing global playback intent. */
  resumeScenario(scenarioId: string): void {
    if (this.#state === "terminated") return;
    this.#requireActive();
    this.#requiredLane(scenarioId);
    if (!this.#releaseScenarioPauseLease(scenarioId)) return;
    // Global pause changes playback intent, not operation ownership. Release
    // the lease even while paused so a later playAll() is not held forever by
    // an operation that already completed.
    if (!this.#playing) {
      this.#syncBackgroundWorkerBudget();
      return;
    }
    if (
      this.#scenarioPauseLeaseCounts.size > 0
      || this.#timeConductor.running
    ) return;
    this.#syncBackgroundWorkerBudget(
      this.#lanes.size + this.#pendingScenarioIds.size,
    );
    try {
      this.#timeConductor.play();
    } finally {
      this.#syncBackgroundWorkerBudget();
    }
  }

  terminate(): void {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#timeConductor.terminate();
    this.#steadyCandidates?.dispose();
    this.#cancelAllAnalysisJobs();
    for (const client of this.#analysisClients) client.terminate();
    this.#analysisClients.clear();
    for (const lane of this.#lanes.values()) terminateLaneV3(lane);
    this.#lanes.clear();
    this.#pendingScenarioIds.clear();
    this.#scenarioPauseLeaseCounts.clear();
    this.#syncBackgroundWorkerBudget(0);
    this.#activeScenarioId = null;
  }

  async dispose(): Promise<void> {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#steadyCandidates?.dispose();
    this.#cancelAllAnalysisJobs();
    for (const client of this.#analysisClients) client.terminate();
    this.#analysisClients.clear();
    const lanes = [...this.#lanes.values()];
    this.#lanes.clear();
    this.#pendingScenarioIds.clear();
    this.#scenarioPauseLeaseCounts.clear();
    this.#syncBackgroundWorkerBudget(0);
    this.#activeScenarioId = null;
    await this.#timeConductor.dispose();
    for (const { client } of lanes) client.terminate();
  }

  async #createLane(
    seed: WorkbenchParallelScenarioSeedV3,
  ): Promise<WorkbenchParallelScenarioLaneV3> {
    const runtimeSessionId = this.#createRuntimeSessionId(seed.scenarioId);
    const client = this.#createClient(seed.scenarioId);
    try {
      const initialFrame = await client.initialize({
        expectedModelId: this.#expectedModelId,
        releaseTicket: this.#releaseTicket,
        runtimeSessionId,
        scenarioId: seed.scenarioId,
        scenarioLabel: seed.label,
        fixture: seed.fixture,
        ...(seed.checkpoint === undefined
          ? {}
          : { checkpoint: seed.checkpoint }),
      });
      const lane = {
        descriptor: Object.freeze({
          scenarioId: seed.scenarioId,
          label: seed.label,
        }),
        runtimeSessionId,
        client,
        latestFrame: initialFrame,
        completeOutputIds: new Set(Object.keys(initialFrame.outputs)),
      };
      return lane;
    } catch (error) {
      client.terminate();
      throw error;
    }
  }

  async #captureScenario(scenarioId: string): Promise<ExperimentScenarioV2> {
    this.#requireActive();
    const lane = this.#requiredLane(scenarioId);
    const captures = await lane.client.readScenarios({
      runtimeSessionId: lane.runtimeSessionId,
    });
    const scenario = captures.scenarios.find((candidate) =>
      candidate.scenarioId === scenarioId);
    if (captures.scenarios.length !== 1 || scenario === undefined) {
      throw new Error("parallel Scenario lane returned another capture");
    }
    return Object.freeze({
      scenarioId,
      label: lane.descriptor.label,
      capture: scenario.capture,
    });
  }

  async #prewarmLane(lane: WorkbenchParallelScenarioLaneV3): Promise<void> {
    if (this.#steadyCandidates === undefined) return;
    const scenario = await this.#captureScenario(
      lane.descriptor.scenarioId,
    );
    this.#steadyCandidates.prewarm(
      this.#steadyCandidateSource(lane, scenario),
    );
  }

  #bestAvailableSteadyCandidate(
    scenario: ExperimentScenarioV2,
    inputEpoch: number,
  ): ExperimentScenarioV2 {
    if (this.#steadyCandidates === undefined) return scenario;
    const lane = this.#requiredLane(scenario.scenarioId);
    const candidate = this.#steadyCandidates.bestAvailable(
      this.#steadyCandidateSource(lane, scenario, inputEpoch),
    );
    if (candidate === null) return scenario;
    return Object.freeze({
      ...candidate.scenario,
      label: scenario.label,
    });
  }

  #steadyCandidateSource(
    lane: WorkbenchParallelScenarioLaneV3,
    scenario: ExperimentScenarioV2,
    inputEpoch = lane.latestFrame.inputEpoch,
  ): WorkbenchSteadyCandidateSourceV3 {
    return Object.freeze({
      modelId: this.#expectedModelId,
      releaseTicket: this.#releaseTicket,
      inputEpoch,
      scenario,
    });
  }

  async #advanceLane(
    lane: WorkbenchParallelScenarioLaneV3,
    stepCount: number,
  ): Promise<readonly StudioSimulationFrameV2[]> {
    const presentationOutputIds = Object.freeze([
      ...new Set(this.#presentationOutputIds()),
    ]);
    if (workbenchPerformanceDiagnosticsEnabledV3()) {
      const typedArrayBytes = stepCount * 16
        + stepCount * presentationOutputIds.length * 9;
      recordWorkbenchPerformanceValueV3(
        "worker.presentation-selected-output-count",
        presentationOutputIds.length,
      );
      recordWorkbenchPerformanceValueV3(
        "worker.presentation-typed-array-bytes",
        typedArrayBytes,
      );
      recordWorkbenchPerformanceValueV3(
        `worker.lane.${lane.descriptor.scenarioId}.presentation-typed-array-bytes`,
        typedArrayBytes,
      );
    }
    const frames = await lane.client.advancePresentation({
      runtimeSessionId: lane.runtimeSessionId,
      scenarioId: lane.descriptor.scenarioId,
      stepCount,
      presentationOutputIds,
    });
    if (workbenchPerformanceDiagnosticsEnabledV3()) {
      const timing = lane.client.presentationTiming?.();
      if (timing !== undefined) {
        recordWorkbenchPerformanceDurationV3(
          "worker.presentation-advance",
          timing.workerAdvanceMs,
        );
        recordWorkbenchPerformanceDurationV3(
          "worker.presentation-prepare",
          timing.workerPrepareMs,
        );
        recordWorkbenchPerformanceDurationV3(
          `worker.lane.${lane.descriptor.scenarioId}.presentation-advance`,
          timing.workerAdvanceMs,
        );
        recordWorkbenchPerformanceDurationV3(
          `worker.lane.${lane.descriptor.scenarioId}.presentation-prepare`,
          timing.workerPrepareMs,
        );
      }
    }
    const complete = frames.at(-1);
    if (
      complete === undefined
      || ![...lane.completeOutputIds].every((outputId) =>
        Object.prototype.hasOwnProperty.call(complete.outputs, outputId),
      )
    ) {
      throw new Error(
        `parallel Scenario ${lane.descriptor.scenarioId} presentation batch `
          + "did not end in a complete exact frame",
      );
    }
    // The packed Worker contract makes its terminal row the complete frame.
    // Advance the lane authority before the next group request; visual slices
    // may still drain the preceding exact prefix independently.
    lane.latestFrame = complete;
    return frames;
  }

  #publishFrames(frames: readonly StudioSimulationFrameV2[]): void {
    if (frames.length === 0 || this.#state !== "active") return;
    for (const frame of frames) {
      const lane = this.#lanes.get(frame.scenarioId);
      if (
        lane !== undefined
        && frame.inputEpoch >= lane.latestFrame.inputEpoch
        && frame.acceptedRevision >= lane.latestFrame.acceptedRevision
        && frame.acceptedTimeSec >= lane.latestFrame.acceptedTimeSec
        && [...lane.completeOutputIds].every((outputId) =>
          Object.prototype.hasOwnProperty.call(frame.outputs, outputId),
        )
      ) lane.latestFrame = frame;
    }
    if (workbenchPerformanceDiagnosticsEnabledV3()) {
      const framesByScenario = new Map<string, StudioSimulationFrameV2[]>();
      for (const frame of frames) {
        const scenarioFrames = framesByScenario.get(frame.scenarioId) ?? [];
        scenarioFrames.push(frame);
        framesByScenario.set(frame.scenarioId, scenarioFrames);
      }
      for (const [scenarioId, scenarioFrames] of framesByScenario) {
        const terminal = scenarioFrames.at(-1)!;
        const outputs = Object.values(terminal.outputs);
        const valueCount = outputs.reduce((count, output) =>
          count + (Array.isArray(output.value) ? output.value.length : 1), 0);
        recordWorkbenchPerformanceValueV3(
          `runtime.${scenarioId}.batch-frame-count`,
          scenarioFrames.length,
        );
        recordWorkbenchPerformanceValueV3(
          `runtime.${scenarioId}.outputs-per-frame`,
          outputs.length,
        );
        recordWorkbenchPerformanceValueV3(
          `runtime.${scenarioId}.values-per-frame`,
          valueCount,
        );
      }
    }
    this.#onFrames(Object.freeze([...frames]));
    recordWorkbenchPerformanceEventIntervalV3(
      "runtime.presentation-commit-interval",
    );
  }

  #syncBackgroundWorkerBudget(
    liveScenarioCount = this.#runningLaneCount()
      + this.#pendingScenarioIds.size,
  ): void {
    this.#backgroundWorkerPool?.setLiveScenarioCount(liveScenarioCount);
  }

  #trackScenarioAnalysisJob<T>(
    scenarioId: string,
    handle: WorkbenchBackgroundJobHandleV3<T>,
  ): void {
    const jobs = this.#analysisJobsByScenario.get(scenarioId) ?? new Set();
    jobs.add(handle as WorkbenchBackgroundJobHandleV3<unknown>);
    this.#analysisJobsByScenario.set(scenarioId, jobs);
  }

  #untrackScenarioAnalysisJob<T>(
    scenarioId: string,
    handle: WorkbenchBackgroundJobHandleV3<T>,
  ): void {
    const jobs = this.#analysisJobsByScenario.get(scenarioId);
    if (jobs === undefined) return;
    jobs.delete(handle as WorkbenchBackgroundJobHandleV3<unknown>);
    if (jobs.size === 0) this.#analysisJobsByScenario.delete(scenarioId);
  }

  #cancelScenarioAnalysisJobs(scenarioId: string): void {
    const jobs = this.#analysisJobsByScenario.get(scenarioId);
    if (jobs === undefined) return;
    this.#analysisJobsByScenario.delete(scenarioId);
    for (const job of jobs) job.cancel();
  }

  #cancelAllAnalysisJobs(): void {
    const scenarioIds = [...this.#analysisJobsByScenario.keys()];
    for (const scenarioId of scenarioIds) {
      this.#cancelScenarioAnalysisJobs(scenarioId);
    }
  }

  #runningLaneCount(): number {
    return this.#timeConductor.running ? this.#lanes.size : 0;
  }

  #canRunGroup(): boolean {
    return this.#playing && this.#scenarioPauseLeaseCounts.size === 0;
  }

  /** Returns true only when one owned lease was actually released. */
  #releaseScenarioPauseLease(scenarioId: string): boolean {
    const count = this.#scenarioPauseLeaseCounts.get(scenarioId);
    if (count === undefined) return false;
    if (count <= 1) this.#scenarioPauseLeaseCounts.delete(scenarioId);
    else this.#scenarioPauseLeaseCounts.set(scenarioId, count - 1);
    return true;
  }

  #fail(error: Error): void {
    if (this.#failed || this.#state === "terminated") return;
    this.#failed = true;
    const normalized = errorAsErrorV3(error);
    this.terminate();
    this.#onError(normalized);
  }

  #requireActive(): void {
    if (this.#state !== "active") {
      throw new Error("parallel Scenario runtime is not active");
    }
  }

  #isTerminated(): boolean {
    return this.#state === "terminated";
  }

  #requiredActiveScenarioId(): string {
    this.#requireActive();
    if (this.#activeScenarioId === null) {
      throw new Error("parallel Scenario runtime has no active Scenario");
    }
    return this.#activeScenarioId;
  }

  #requiredLane(scenarioId: string): WorkbenchParallelScenarioLaneV3 {
    const lane = this.#lanes.get(scenarioId);
    if (lane === undefined) {
      throw new Error(`parallel Scenario not found: ${scenarioId}`);
    }
    return lane;
  }
}

function validateScenarioSeedsV3(
  scenarios: readonly WorkbenchParallelScenarioSeedV3[],
  activeScenarioId: string,
): void {
  if (
    scenarios.length < 1
    || scenarios.length > STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2
  ) {
    throw new Error(
      `parallel Scenario runtime requires 1-${STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2} Scenarios`,
    );
  }
  const ids = new Set<string>();
  for (const scenario of scenarios) {
    requireScenarioLabelV3(scenario.label);
    if (ids.has(scenario.scenarioId)) {
      throw new Error(`parallel Scenario is duplicated: ${scenario.scenarioId}`);
    }
    ids.add(scenario.scenarioId);
  }
  if (!ids.has(activeScenarioId)) {
    throw new Error("parallel active Scenario is not in the seed set");
  }
}

function validatedAnalysisPartitionsV3(
  partitions: readonly string[],
): readonly string[] {
  if (partitions.length < 1 || partitions.length > 4) {
    throw new Error("parallel analysis requires 1-4 Worker partitions");
  }
  const validated = partitions.map((partition, index) =>
    validateStudioSimulationPortableIdV2(
      partition,
      `$.analysisExecutionPlan.partitions[${index}]`,
    ));
  if (new Set(validated).size !== validated.length) {
    throw new Error("parallel analysis Worker partitions must be unique");
  }
  return Object.freeze(validated);
}

function requireScenarioLabelV3(label: string): void {
  if (
    label.length === 0
    || label.length > 4_096
    || label.trim() !== label
  ) {
    throw new Error(
      "parallel Scenario label must be a nonempty trimmed string of at most 4096 characters",
    );
  }
}

function terminateLaneV3(lane: WorkbenchParallelScenarioLaneV3): void {
  lane.client.terminate();
}

function errorAsErrorV3(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

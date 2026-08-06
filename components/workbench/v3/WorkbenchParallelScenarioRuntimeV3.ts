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
  WorkbenchLiveSchedulerV3,
  type WorkbenchLiveSchedulerDependenciesV3,
  type WorkbenchLiveSchedulerTimerV3,
} from "./WorkbenchLiveSchedulerV3";
import type {
  WorkbenchBackgroundWorkerPoolPortV3,
} from "./WorkbenchBackgroundWorkerPoolV3";
import {
  WorkbenchScenarioSteadyCandidateCoordinatorV3,
  type WorkbenchSteadyCandidateSourceV3,
} from "./WorkbenchScenarioSteadyCandidateCoordinatorV3";
import { randomPortableTokenV3 } from "./randomPortableTokenV3";

// One short visual deadline lets independently completing Scenario Workers
// coalesce without stacking a second full 32 ms delay on top of each lane's
// scheduler-side presentation buffer.
const WORKBENCH_PARALLEL_FRAME_FLUSH_MS_V3 = 16;

export type WorkbenchParallelScenarioSeedV3 = Readonly<{
  scenarioId: string;
  label: string;
  fixture: StudioJsonValueV2;
  checkpoint?: ScenarioCheckpointV2;
}>;

export type WorkbenchParallelScenarioRuntimeClientV3 = Pick<
  StudioSimulationWorkerClientV2,
  | "advance"
  | "applyControl"
  | "initialize"
  | "readScenarios"
  | "requestAnalysis"
  | "terminate"
>;

type WorkbenchParallelScenarioSchedulerV3 = Pick<
  WorkbenchLiveSchedulerV3<StudioSimulationFrameV2>,
  "dispose" | "flushAcceptedFrames" | "pause" | "play" | "running"
>;

type WorkbenchParallelScenarioLaneV3 = {
  descriptor: StudioSimulationWorkerScenarioDescriptorV2;
  runtimeSessionId: string;
  client: WorkbenchParallelScenarioRuntimeClientV3;
  scheduler: WorkbenchParallelScenarioSchedulerV3;
  latestFrame: StudioSimulationFrameV2;
};

export type WorkbenchParallelScenarioRuntimeDependenciesV3 = Readonly<{
  expectedModelId: string;
  releaseTicket?: StudioModelWorkerReleaseTicketV2;
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
  createScheduler?: (
    scenarioId: string,
    dependencies: WorkbenchLiveSchedulerDependenciesV3<StudioSimulationFrameV2>,
  ) => WorkbenchParallelScenarioSchedulerV3;
  createRuntimeSessionId?: (scenarioId: string) => string;
  scheduleFrameFlush?: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchLiveSchedulerTimerV3;
  cancelFrameFlush?: (timer: WorkbenchLiveSchedulerTimerV3) => void;
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
  readonly #releaseTicket: StudioModelWorkerReleaseTicketV2 | undefined;
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
  readonly #createScheduler: (
    scenarioId: string,
    dependencies: WorkbenchLiveSchedulerDependenciesV3<StudioSimulationFrameV2>,
  ) => WorkbenchParallelScenarioSchedulerV3;
  readonly #createRuntimeSessionId: (scenarioId: string) => string;
  readonly #scheduleFrameFlush: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchLiveSchedulerTimerV3;
  readonly #cancelFrameFlush: (timer: WorkbenchLiveSchedulerTimerV3) => void;
  readonly #lanes = new Map<string, WorkbenchParallelScenarioLaneV3>();
  readonly #analysisClients = new Set<
    WorkbenchParallelScenarioRuntimeClientV3
  >();
  readonly #pendingScenarioIds = new Set<string>();
  #state: ParallelRuntimeStateV3 = "new";
  #activeScenarioId: string | null = null;
  #playing = false;
  #pendingFrames: StudioSimulationFrameV2[] = [];
  #frameFlushTimer: WorkbenchLiveSchedulerTimerV3 | undefined;
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
    this.#createScheduler = dependencies.createScheduler
      ?? ((_scenarioId, schedulerDependencies) =>
        new WorkbenchLiveSchedulerV3(schedulerDependencies));
    this.#createRuntimeSessionId = dependencies.createRuntimeSessionId
      ?? (() => `workbench-lane-${randomPortableTokenV3()}`);
    this.#scheduleFrameFlush = dependencies.scheduleFrameFlush
      ?? ((callback, delayMs) => setTimeout(callback, delayMs));
    this.#cancelFrameFlush = dependencies.cancelFrameFlush
      ?? ((timer) => clearTimeout(timer));
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
    try {
      const lane = await this.#createLane(seed);
      if (this.#state !== "active") {
        terminateLaneV3(lane);
        throw new Error("parallel Scenario runtime was terminated during add");
      }
      if (this.#lanes.has(seed.scenarioId)) {
        terminateLaneV3(lane);
        throw new Error(`parallel Scenario already exists: ${seed.scenarioId}`);
      }
      this.#lanes.set(seed.scenarioId, lane);
      this.#activeScenarioId = seed.scenarioId;
      if (this.#playing) lane.scheduler.play(lane.latestFrame.acceptedTimeSec);
      return this.currentState();
    } finally {
      this.#pendingScenarioIds.delete(seed.scenarioId);
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
    this.#lanes.delete(scenarioId);
    this.#steadyCandidates?.invalidateScenario(scenarioId);
    if (this.#activeScenarioId === scenarioId) {
      this.#activeScenarioId = this.#lanes.keys().next().value ?? null;
    }
    try {
      await lane.scheduler.dispose();
    } finally {
      lane.client.terminate();
    }
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
    await this.#prewarmLane(lane);
    return frame;
  }

  async requestAnalysis(
    input: Omit<StudioSimulationWorkerRequestAnalysisInputV2, "runtimeSessionId">
      & Readonly<{
        onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
        onLiveLaneReleased?: () => void;
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
    try {
      await lane.scheduler.pause();
      this.#flushFrames();
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
                ...(this.#releaseTicket === undefined
                  ? {}
                  : { releaseTicket: this.#releaseTicket }),
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
      this.resumeScenario(input.scenarioId);
    }
  }

  async #withAnalysisClient<T>(
    scenarioId: string,
    analysisPartition: string | undefined,
    operation: (client: WorkbenchParallelScenarioRuntimeClientV3) => Promise<T>,
  ): Promise<T> {
    if (this.#backgroundWorkerPool !== undefined) {
      return await this.#backgroundWorkerPool.run("analysis", operation);
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
        ...(this.#releaseTicket === undefined
          ? {}
          : { releaseTicket: this.#releaseTicket }),
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
    try {
      for (const lane of this.#lanes.values()) {
        lane.scheduler.play(lane.latestFrame.acceptedTimeSec);
      }
    } catch (error) {
      this.#fail(null, errorAsErrorV3(error));
    }
  }

  async pauseAll(): Promise<void> {
    if (this.#state === "terminated") return;
    this.#requireActive();
    this.#playing = false;
    await Promise.all([...this.#lanes.values()].map(({ scheduler }) =>
      scheduler.pause()));
    this.#flushFrames();
  }

  /** Pauses and drains only one numerical lane; sibling Scenarios stay live. */
  async pauseScenario(
    scenarioId: string,
  ): Promise<StudioSimulationFrameV2> {
    if (this.#state === "terminated") {
      throw new Error("parallel Scenario runtime is not active");
    }
    this.#requireActive();
    const lane = this.#requiredLane(scenarioId);
    await lane.scheduler.pause();
    this.#flushFrames();
    return lane.latestFrame;
  }

  /** Resumes one drained lane only when global playback intent is still live. */
  resumeScenario(scenarioId: string): void {
    if (this.#state === "terminated" || !this.#playing) return;
    this.#requireActive();
    const lane = this.#requiredLane(scenarioId);
    if (lane.scheduler.running) return;
    lane.scheduler.play(lane.latestFrame.acceptedTimeSec);
  }

  terminate(): void {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#steadyCandidates?.dispose();
    this.#cancelPendingFlush();
    this.#pendingFrames = [];
    for (const client of this.#analysisClients) client.terminate();
    this.#analysisClients.clear();
    for (const lane of this.#lanes.values()) terminateLaneV3(lane);
    this.#lanes.clear();
    this.#pendingScenarioIds.clear();
    this.#activeScenarioId = null;
  }

  async dispose(): Promise<void> {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#steadyCandidates?.dispose();
    this.#cancelPendingFlush();
    this.#pendingFrames = [];
    for (const client of this.#analysisClients) client.terminate();
    this.#analysisClients.clear();
    const lanes = [...this.#lanes.values()];
    this.#lanes.clear();
    this.#pendingScenarioIds.clear();
    this.#activeScenarioId = null;
    await Promise.allSettled(lanes.map(({ scheduler }) => scheduler.dispose()));
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
        ...(this.#releaseTicket === undefined
          ? {}
          : { releaseTicket: this.#releaseTicket }),
        runtimeSessionId,
        scenarioId: seed.scenarioId,
        scenarioLabel: seed.label,
        fixture: seed.fixture,
        ...(seed.checkpoint === undefined
          ? {}
          : { checkpoint: seed.checkpoint }),
      });
      let lane: WorkbenchParallelScenarioLaneV3 | undefined;
      const scheduler = this.#createScheduler(seed.scenarioId, {
        advance: (stepCount) => client.advance({
          runtimeSessionId,
          scenarioId: seed.scenarioId,
          stepCount,
        }),
        acceptedTimeSec: (frame) => frame.acceptedTimeSec,
        onFrames: (frames) => {
          if (this.#state !== "active") return;
          const last = frames.at(-1);
          if (last === undefined || lane === undefined) return;
          lane.latestFrame = last;
          this.#enqueueFrames(frames);
        },
        onError: (error) => this.#fail(seed.scenarioId, error),
      });
      lane = {
        descriptor: Object.freeze({
          scenarioId: seed.scenarioId,
          label: seed.label,
        }),
        runtimeSessionId,
        client,
        scheduler,
        latestFrame: initialFrame,
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
      ...(this.#releaseTicket === undefined
        ? {}
        : { releaseTicket: this.#releaseTicket }),
      inputEpoch,
      scenario,
    });
  }

  #enqueueFrames(frames: readonly StudioSimulationFrameV2[]): void {
    if (frames.length === 0 || this.#state !== "active") return;
    this.#pendingFrames.push(...frames);
    if (this.#frameFlushTimer !== undefined) return;
    this.#frameFlushTimer = this.#scheduleFrameFlush(() => {
      this.#frameFlushTimer = undefined;
      this.#flushFrames();
    }, WORKBENCH_PARALLEL_FRAME_FLUSH_MS_V3);
  }

  #flushFrames(): void {
    if (this.#pendingFrames.length === 0) return;
    const frames = Object.freeze(this.#pendingFrames.slice());
    this.#pendingFrames = [];
    if (this.#state === "active") this.#onFrames(frames);
  }

  #cancelPendingFlush(): void {
    if (this.#frameFlushTimer === undefined) return;
    this.#cancelFrameFlush(this.#frameFlushTimer);
    this.#frameFlushTimer = undefined;
  }

  #fail(failingScenarioId: string | null, error: Error): void {
    if (this.#failed || this.#state === "terminated") return;
    this.#failed = true;
    const normalized = errorAsErrorV3(error);
    // A healthy sibling may have accepted frames buffered behind its own
    // presentation cadence. Publish those synchronously while the pool is
    // active, but never await or re-enter the failing scheduler's in-flight
    // rejection. The failing scheduler flushes its own accepted prefix before
    // invoking this callback.
    for (const [scenarioId, lane] of this.#lanes) {
      if (scenarioId === failingScenarioId) continue;
      try {
        lane.scheduler.flushAcceptedFrames();
      } catch {
        // A presentation callback cannot replace the causal lane error or
        // prevent the numerical authority from failing closed.
      }
    }
    // Scheduler flushes append to the pool's coalescing queue. Publish the
    // exact accumulated prefix before termination clears runtime state.
    this.#cancelPendingFlush();
    try {
      this.#flushFrames();
    } catch {
      // Presentation callback failure cannot keep a compromised numerical
      // authority alive or replace the causal lane error.
    }
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
  void lane.scheduler.dispose().catch(() => undefined);
  lane.client.terminate();
}

function errorAsErrorV3(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

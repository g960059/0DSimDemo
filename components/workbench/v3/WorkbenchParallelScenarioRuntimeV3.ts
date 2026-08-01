import {
  STUDIO_EXPERIMENT_SCENARIO_LIMIT_V2,
  type ExperimentScenarioV2,
  type ScenarioCheckpointV2,
} from "@/studio/contracts/v2/content";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
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
  onFrames(frames: readonly StudioSimulationFrameV2[]): void;
  onError(error: Error): void;
  createClient?: (
    scenarioId: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
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
  readonly #onFrames: (frames: readonly StudioSimulationFrameV2[]) => void;
  readonly #onError: (error: Error) => void;
  readonly #createClient: (
    scenarioId: string,
  ) => WorkbenchParallelScenarioRuntimeClientV3;
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
  readonly #pendingScenarioIds = new Set<string>();
  #state: ParallelRuntimeStateV3 = "new";
  #activeScenarioId: string | null = null;
  #playing = false;
  #pendingFrames: StudioSimulationFrameV2[] = [];
  #frameFlushTimer: WorkbenchLiveSchedulerTimerV3 | undefined;
  #failed = false;

  constructor(dependencies: WorkbenchParallelScenarioRuntimeDependenciesV3) {
    this.#expectedModelId = dependencies.expectedModelId;
    this.#onFrames = dependencies.onFrames;
    this.#onError = dependencies.onError;
    this.#createClient = dependencies.createClient
      ?? (() => new StudioSimulationWorkerClientV2());
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
    return this.addScenario({
      scenarioId: input.scenarioId,
      label: input.label,
      fixture: source.capture.fixture,
      checkpoint: source.capture.checkpoint,
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
    return frame;
  }

  async requestAnalysis(
    input: Omit<StudioSimulationWorkerRequestAnalysisInputV2, "runtimeSessionId">,
  ): Promise<StudioSimulationAnalysisV2> {
    this.#requireActive();
    const lane = this.#requiredLane(input.scenarioId);
    return lane.client.requestAnalysis({
      ...input,
      runtimeSessionId: lane.runtimeSessionId,
    });
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

  terminate(): void {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#cancelPendingFlush();
    this.#pendingFrames = [];
    for (const lane of this.#lanes.values()) terminateLaneV3(lane);
    this.#lanes.clear();
    this.#pendingScenarioIds.clear();
    this.#activeScenarioId = null;
  }

  async dispose(): Promise<void> {
    if (this.#state === "terminated") return;
    this.#state = "terminated";
    this.#playing = false;
    this.#cancelPendingFlush();
    this.#pendingFrames = [];
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

import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

import {
  incrementWorkbenchPerformanceCounterV3,
  recordWorkbenchPerformanceValueV3,
} from "./WorkbenchPerformanceDiagnosticsV3";

export type WorkbenchBackgroundJobPriorityV3 =
  | "snapshot"
  | "save"
  | "analysis"
  | "prewarm";

export type WorkbenchBackgroundJobHandleV3<T> = Readonly<{
  promise: Promise<T>;
  /** Raises a queued or running job's urgency. */
  promote(priority: WorkbenchBackgroundJobPriorityV3): void;
  /** Cancels queued work or terminates the single-use Worker running it. */
  cancel(): boolean;
}>;

export type WorkbenchBackgroundWorkerPoolPortV3 = Readonly<{
  setLiveScenarioCount(count: number): void;
  schedule<T>(
    priority: WorkbenchBackgroundJobPriorityV3,
    operation: (client: StudioSimulationWorkerClientV2) => Promise<T>,
  ): WorkbenchBackgroundJobHandleV3<T>;
  run<T>(
    priority: WorkbenchBackgroundJobPriorityV3,
    operation: (client: StudioSimulationWorkerClientV2) => Promise<T>,
  ): Promise<T>;
}>;

export type WorkbenchBackgroundWorkerBudgetV3 = Readonly<{
  warmSize: number;
  maxSize: number;
}>;

type WaitingJobV3 = Readonly<{
  token: symbol;
  sequence: number;
  resolve(client: StudioSimulationWorkerClientV2): void;
  reject(error: Error): void;
}> & {
  priority: WorkbenchBackgroundJobPriorityV3;
};

type RunningJobV3 = {
  token: symbol;
  client: StudioSimulationWorkerClientV2;
  priority: WorkbenchBackgroundJobPriorityV3;
  cancelled: boolean;
};

const PRIORITY_ORDER_V3: Readonly<Record<WorkbenchBackgroundJobPriorityV3, number>> =
  Object.freeze({ snapshot: 0, save: 1, analysis: 2, prewarm: 3 });

/**
 * Bounded pool of pre-created, uninitialized numerical Workers.
 *
 * A StudioSimulationWorkerClient is deliberately single-use: once a job has
 * initialized it, its numerical authority cannot be reset for another job.
 * The pool therefore keeps only *uninitialized* Workers warm, terminates each
 * leased Worker after its job, and replenishes the warm reserve. This avoids a
 * module-Worker cold start on the common path without introducing reusable
 * runtime identity or state leakage between analyses and Snapshots.
 */
export class WorkbenchBackgroundWorkerPoolV3
  implements WorkbenchBackgroundWorkerPoolPortV3 {
  readonly #createClient: () => StudioSimulationWorkerClientV2;
  readonly #warmSize: number;
  readonly #maxSize: number;
  readonly #logicalCoreCount: number;
  readonly #idle: StudioSimulationWorkerClientV2[] = [];
  readonly #leased = new Set<StudioSimulationWorkerClientV2>();
  readonly #foregroundBurst = new Set<StudioSimulationWorkerClientV2>();
  readonly #waiting: WaitingJobV3[] = [];
  readonly #running = new Map<symbol, RunningJobV3>();
  #sequence = 0;
  #liveScenarioCount = 0;
  #disposed = false;

  constructor(
    budget: WorkbenchBackgroundWorkerBudgetV3 =
      resolveWorkbenchBackgroundWorkerBudgetV3(),
    createClient: () => StudioSimulationWorkerClientV2 =
      () => new StudioSimulationWorkerClientV2(),
    logicalCoreCount = resolveLogicalCoreCountV3(),
  ) {
    requireWorkerBudgetV3(budget);
    requireLogicalCoreCountV3(logicalCoreCount);
    this.#warmSize = budget.warmSize;
    this.#maxSize = budget.maxSize;
    this.#logicalCoreCount = logicalCoreCount;
    this.#createClient = createClient;
    this.#replenishWarmWorkers();
    this.#recordState();
  }

  setLiveScenarioCount(count: number): void {
    if (!Number.isSafeInteger(count) || count < 0 || count > 128) {
      throw new Error("Workbench live Scenario count is invalid");
    }
    if (this.#disposed || count === this.#liveScenarioCount) return;
    this.#liveScenarioCount = count;
    this.#preemptSpeculativeJobsOverBudget();
    this.#trimWarmWorkers();
    this.#dispatchWaiting();
    this.#replenishWarmWorkers();
    this.#recordState();
  }

  async run<T>(
    priority: WorkbenchBackgroundJobPriorityV3,
    operation: (client: StudioSimulationWorkerClientV2) => Promise<T>,
  ): Promise<T> {
    return await this.schedule(priority, operation).promise;
  }

  schedule<T>(
    priority: WorkbenchBackgroundJobPriorityV3,
    operation: (client: StudioSimulationWorkerClientV2) => Promise<T>,
  ): WorkbenchBackgroundJobHandleV3<T> {
    requirePriorityV3(priority);
    const token = Symbol("workbench-background-job");
    const promise = (async () => {
      const client = await this.#acquire(priority, token);
      const running = this.#running.get(token);
      if (running === undefined) {
        throw new Error("Workbench background Worker lease was lost");
      }
      try {
        if (running.cancelled) {
          throw new WorkbenchBackgroundJobCancelledErrorV3();
        }
        const result = await operation(client);
        if (running.cancelled) {
          throw new WorkbenchBackgroundJobCancelledErrorV3();
        }
        return result;
      } catch (error) {
        if (
          running.cancelled
          && !(error instanceof WorkbenchBackgroundJobCancelledErrorV3)
        ) {
          throw new WorkbenchBackgroundJobCancelledErrorV3();
        }
        throw error;
      } finally {
        this.#release(token, client);
      }
    })();
    return Object.freeze({
      promise,
      promote: (nextPriority) => this.#promote(token, nextPriority),
      cancel: () => this.#cancel(token),
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    const error = new Error("Workbench background Worker pool is disposed");
    for (const waiting of this.#waiting.splice(0)) waiting.reject(error);
    for (const client of this.#idle.splice(0)) terminateClientV3(client);
    for (const client of this.#leased) terminateClientV3(client);
    this.#leased.clear();
    this.#foregroundBurst.clear();
    this.#running.clear();
  }

  async #acquire(
    priority: WorkbenchBackgroundJobPriorityV3,
    token: symbol,
  ): Promise<StudioSimulationWorkerClientV2> {
    if (this.#disposed) {
      throw new Error("Workbench background Worker pool is disposed");
    }
    if (this.#regularLeaseCount() < this.#effectiveMaxSize(priority)) {
      return this.#leaseRegularClient(token, priority);
    }
    if (this.#canLeaseForegroundBurst(priority)) {
      return this.#leaseBurstClient(token, priority);
    }
    this.#preemptOneSpeculativeJob(priority);
    return await new Promise<StudioSimulationWorkerClientV2>(
      (resolve, reject) => {
        this.#waiting.push({
          token,
          priority,
          sequence: this.#sequence++,
          resolve,
          reject: (error) => reject(error),
        });
        this.#sortWaiting();
        this.#recordState();
      },
    );
  }

  #release(token: symbol, client: StudioSimulationWorkerClientV2): void {
    this.#running.delete(token);
    if (!this.#leased.delete(client)) return;
    this.#foregroundBurst.delete(client);
    terminateClientV3(client);
    if (this.#disposed) return;
    this.#dispatchWaiting();
    this.#replenishWarmWorkers();
    this.#recordState();
  }

  #promote(
    token: symbol,
    priority: WorkbenchBackgroundJobPriorityV3,
  ): void {
    requirePriorityV3(priority);
    const running = this.#running.get(token);
    if (
      running !== undefined
      && PRIORITY_ORDER_V3[priority] < PRIORITY_ORDER_V3[running.priority]
    ) {
      running.priority = priority;
      return;
    }
    const waiting = this.#waiting.find((candidate) => candidate.token === token);
    if (
      waiting === undefined
      || PRIORITY_ORDER_V3[priority] >= PRIORITY_ORDER_V3[waiting.priority]
    ) return;
    waiting.priority = priority;
    this.#sortWaiting();
    this.#dispatchWaiting();
  }

  #cancel(token: symbol): boolean {
    const index = this.#waiting.findIndex((candidate) => candidate.token === token);
    if (index >= 0) {
      const [waiting] = this.#waiting.splice(index, 1);
      waiting!.reject(new WorkbenchBackgroundJobCancelledErrorV3());
      incrementWorkbenchPerformanceCounterV3(
        "background.pool.cancelled-before-start",
      );
      this.#recordState();
      return true;
    }
    const running = this.#running.get(token);
    if (running === undefined || running.cancelled) return false;
    running.cancelled = true;
    terminateClientV3(running.client);
    incrementWorkbenchPerformanceCounterV3(
      "background.pool.cancelled-running",
    );
    this.#recordState();
    return true;
  }

  #dispatchWaiting(): void {
    if (this.#disposed) return;
    while (this.#waiting.length > 0) {
      const waiting = this.#waiting[0]!;
      const regularLeaseAvailable =
        this.#regularLeaseCount() < this.#effectiveMaxSize(waiting.priority);
      const burstLeaseAvailable = this.#canLeaseForegroundBurst(
        waiting.priority,
      );
      if (!regularLeaseAvailable && !burstLeaseAvailable) return;
      this.#waiting.shift();
      try {
        const replacement = regularLeaseAvailable
          ? this.#leaseRegularClient(waiting.token, waiting.priority)
          : this.#leaseBurstClient(waiting.token, waiting.priority);
        waiting.resolve(replacement);
      } catch (error) {
        waiting.reject(errorAsErrorV3(error));
      }
    }
    this.#recordState();
  }

  #canLeaseForegroundBurst(
    priority: WorkbenchBackgroundJobPriorityV3,
  ): boolean {
    return (priority === "snapshot" || priority === "save")
      && this.#foregroundBurst.size === 0
      && this.#regularLeaseCount() >= this.#effectiveMaxSize(priority)
      && this.#leased.size < Math.min(8, this.#maxSize + 1)
      && this.#hasForegroundBurstHeadroom();
  }

  #regularLeaseCount(): number {
    return this.#leased.size - this.#foregroundBurst.size;
  }

  #sortWaiting(): void {
    this.#waiting.sort((left, right) =>
      PRIORITY_ORDER_V3[left.priority] - PRIORITY_ORDER_V3[right.priority]
      || left.sequence - right.sequence);
  }

  #replenishWarmWorkers(): void {
    if (this.#disposed) return;
    while (
      this.#idle.length < this.#warmSize
      && this.#idle.length + this.#regularLeaseCount()
        < this.#speculativeMaxSize()
    ) {
      try {
        this.#idle.push(this.#createClient());
      } catch {
        // Warm reserve is an acceleration, not an authority. A later explicit
        // lease retries construction and reports that failure to its caller.
        break;
      }
    }
  }

  #leaseRegularClient(
    token: symbol,
    priority: WorkbenchBackgroundJobPriorityV3,
  ): StudioSimulationWorkerClientV2 {
    const client = this.#idle.pop() ?? this.#createClient();
    this.#leased.add(client);
    this.#running.set(token, { token, client, priority, cancelled: false });
    this.#recordState();
    return client;
  }

  #leaseBurstClient(
    token: symbol,
    priority: WorkbenchBackgroundJobPriorityV3,
  ): StudioSimulationWorkerClientV2 {
    const client = this.#createClient();
    this.#leased.add(client);
    this.#foregroundBurst.add(client);
    this.#running.set(token, { token, client, priority, cancelled: false });
    incrementWorkbenchPerformanceCounterV3("background.pool.burst-leases");
    this.#recordState();
    return client;
  }

  #effectiveMaxSize(
    priority: WorkbenchBackgroundJobPriorityV3 = "analysis",
  ): number {
    const spareLogicalCores =
      this.#logicalCoreCount - this.#liveScenarioCount - 1;
    // Speculative settlement yields completely when the live lanes and the UI
    // already consume the device budget. Explicit analysis / Save / Snapshot
    // work remains possible, but is serialized through one foreground lane.
    const minimum = priority === "prewarm" ? 0 : 1;
    return Math.min(this.#maxSize, Math.max(minimum, spareLogicalCores));
  }

  #speculativeMaxSize(): number {
    return this.#effectiveMaxSize("prewarm");
  }

  #hasForegroundBurstHeadroom(): boolean {
    return this.#liveScenarioCount + this.#leased.size + 1
      <= Math.max(1, this.#logicalCoreCount - 1);
  }

  #preemptOneSpeculativeJob(
    priority: WorkbenchBackgroundJobPriorityV3,
  ): boolean {
    if (
      PRIORITY_ORDER_V3[priority] >= PRIORITY_ORDER_V3.prewarm
    ) return false;
    const speculative = [...this.#running.values()].find((job) =>
      job.priority === "prewarm" && !job.cancelled);
    if (speculative === undefined) return false;
    incrementWorkbenchPerformanceCounterV3(
      "background.pool.preempted-prewarm",
    );
    return this.#cancel(speculative.token);
  }

  #preemptSpeculativeJobsOverBudget(): void {
    let excess = this.#regularLeaseCount() - this.#speculativeMaxSize();
    if (excess <= 0) return;
    for (const job of this.#running.values()) {
      if (excess <= 0) break;
      if (job.priority !== "prewarm" || job.cancelled) continue;
      incrementWorkbenchPerformanceCounterV3(
        "background.pool.preempted-prewarm",
      );
      if (this.#cancel(job.token)) excess -= 1;
    }
  }

  #trimWarmWorkers(): void {
    const maximumIdle = Math.max(
      0,
      Math.min(
        this.#warmSize,
        this.#speculativeMaxSize() - this.#regularLeaseCount(),
      ),
    );
    while (this.#idle.length > maximumIdle) {
      terminateClientV3(this.#idle.pop()!);
    }
  }

  #recordState(): void {
    recordWorkbenchPerformanceValueV3(
      "background.pool.live-scenario-count",
      this.#liveScenarioCount,
    );
    recordWorkbenchPerformanceValueV3(
      "background.pool.effective-capacity",
      this.#effectiveMaxSize(),
    );
    recordWorkbenchPerformanceValueV3(
      "background.pool.speculative-capacity",
      this.#speculativeMaxSize(),
    );
    recordWorkbenchPerformanceValueV3(
      "background.pool.active-workers",
      this.#leased.size,
    );
    recordWorkbenchPerformanceValueV3(
      "background.pool.queued-jobs",
      this.#waiting.length,
    );
  }
}

export class WorkbenchBackgroundJobCancelledErrorV3 extends Error {
  constructor() {
    super("Workbench background job was cancelled");
    this.name = "WorkbenchBackgroundJobCancelledErrorV3";
  }
}

export function resolveWorkbenchBackgroundWorkerBudgetV3(
  hardwareConcurrency = typeof navigator === "undefined"
    ? 8
    : navigator.hardwareConcurrency,
): WorkbenchBackgroundWorkerBudgetV3 {
  const logicalCores = Number.isFinite(hardwareConcurrency)
    ? Math.max(1, Math.floor(hardwareConcurrency))
    : 8;
  // Four or more logical cores can run the two directional analysis branches
  // together when the live Scenario count leaves headroom. High-core devices
  // can also serve another Scenario's analysis or an explicit capture without
  // serializing everything behind those two branches. The live-lane-aware
  // effective cap below still reserves a core for UI/browser composition.
  const maxSize = logicalCores < 4
    ? 1
    : Math.min(4, Math.max(2, Math.floor(logicalCores / 4)));
  return Object.freeze({
    warmSize: Math.min(2, maxSize),
    maxSize,
  });
}

function resolveLogicalCoreCountV3(
  hardwareConcurrency = typeof navigator === "undefined"
    ? 8
    : navigator.hardwareConcurrency,
): number {
  return Number.isFinite(hardwareConcurrency)
    ? Math.max(1, Math.floor(hardwareConcurrency))
    : 8;
}

function requireLogicalCoreCountV3(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > 512) {
    throw new Error("Workbench logical core count is invalid");
  }
}

function requireWorkerBudgetV3(
  budget: WorkbenchBackgroundWorkerBudgetV3,
): void {
  if (
    !Number.isSafeInteger(budget.warmSize)
    || !Number.isSafeInteger(budget.maxSize)
    || budget.warmSize < 0
    || budget.maxSize < 1
    || budget.warmSize > budget.maxSize
    || budget.maxSize > 8
  ) {
    throw new Error("Workbench background Worker budget is invalid");
  }
}

function requirePriorityV3(
  priority: WorkbenchBackgroundJobPriorityV3,
): void {
  if (!(priority in PRIORITY_ORDER_V3)) {
    throw new Error("Workbench background Worker priority is invalid");
  }
}

function terminateClientV3(client: StudioSimulationWorkerClientV2): void {
  try {
    client.terminate();
  } catch {
    // Termination is an idempotent cleanup boundary. A transport that already
    // failed cannot be allowed to prevent the next queued job from starting.
  }
}

function errorAsErrorV3(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

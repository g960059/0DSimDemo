import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  elapsedWorkbenchRuntimeMsV3,
  emitWorkbenchRuntimeObservationV3,
  workbenchRuntimeNowMsV3,
  type WorkbenchBackgroundWorkerLeaseKindV3,
  type WorkbenchRuntimeClockV3,
  type WorkbenchRuntimeObserverV3,
} from "./WorkbenchRuntimeObservabilityV3";

export type WorkbenchBackgroundJobPriorityV3 =
  | "snapshot"
  | "save"
  | "analysis"
  | "prewarm";

export type WorkbenchBackgroundJobHandleV3<T> = Readonly<{
  promise: Promise<T>;
  /** Raises a queued job's urgency. Running jobs are already leased. */
  promote(priority: WorkbenchBackgroundJobPriorityV3): void;
  /** Cancels only a job that has not yet acquired numerical authority. */
  cancel(): boolean;
}>;

export type WorkbenchBackgroundWorkerPoolPortV3 = Readonly<{
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

export type WorkbenchBackgroundWorkerPoolDependenciesV3 = Readonly<{
  nowMs?: WorkbenchRuntimeClockV3;
  observe?: WorkbenchRuntimeObserverV3;
}>;

type BackgroundJobContextV3 = {
  token: symbol;
  sequence: number;
  scheduledPriority: WorkbenchBackgroundJobPriorityV3;
  priority: WorkbenchBackgroundJobPriorityV3;
  scheduledAtMs: number;
  queueDepthAtSchedule: number;
};

type BackgroundWorkerLeaseV3 = Readonly<{
  client: StudioSimulationWorkerClientV2;
  kind: WorkbenchBackgroundWorkerLeaseKindV3;
}>;

type WaitingJobV3 = Readonly<{
  context: BackgroundJobContextV3;
  resolve(lease: BackgroundWorkerLeaseV3): void;
  reject(error: Error): void;
}>;

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
  readonly #nowMs: WorkbenchRuntimeClockV3;
  readonly #observe: WorkbenchRuntimeObserverV3 | undefined;
  readonly #warmSize: number;
  readonly #maxSize: number;
  readonly #idle: StudioSimulationWorkerClientV2[] = [];
  readonly #leased = new Set<StudioSimulationWorkerClientV2>();
  readonly #foregroundBurst = new Set<StudioSimulationWorkerClientV2>();
  readonly #waiting: WaitingJobV3[] = [];
  #sequence = 0;
  #disposed = false;

  constructor(
    budget: WorkbenchBackgroundWorkerBudgetV3 =
      resolveWorkbenchBackgroundWorkerBudgetV3(),
    createClient: () => StudioSimulationWorkerClientV2 =
      () => new StudioSimulationWorkerClientV2(),
    dependencies: WorkbenchBackgroundWorkerPoolDependenciesV3 = {},
  ) {
    requireWorkerBudgetV3(budget);
    this.#warmSize = budget.warmSize;
    this.#maxSize = budget.maxSize;
    this.#createClient = createClient;
    this.#nowMs = dependencies.nowMs ?? workbenchRuntimeNowMsV3;
    this.#observe = dependencies.observe;
    this.#replenishWarmWorkers();
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
    const context: BackgroundJobContextV3 = {
      token: Symbol("workbench-background-job"),
      sequence: this.#sequence++,
      scheduledPriority: priority,
      priority,
      scheduledAtMs: this.#nowMs(),
      queueDepthAtSchedule: 0,
    };
    const promise = (async () => {
      let lease: BackgroundWorkerLeaseV3 | null = null;
      let startedAtMs: number | null = null;
      try {
        lease = await this.#acquire(context);
        startedAtMs = this.#nowMs();
        const result = await operation(lease.client);
        this.#observeTerminalJob(
          context,
          lease.kind,
          startedAtMs,
          "completed",
        );
        return result;
      } catch (error) {
        this.#observeTerminalJob(
          context,
          lease?.kind ?? null,
          startedAtMs,
          error instanceof WorkbenchBackgroundJobCancelledErrorV3
            ? "cancelled"
            : "failed",
        );
        throw error;
      } finally {
        if (lease !== null) this.#release(lease.client);
      }
    })();
    return Object.freeze({
      promise,
      promote: (nextPriority) => this.#promote(
        context.token,
        nextPriority,
      ),
      cancel: () => this.#cancel(context.token),
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
  }

  async #acquire(
    context: BackgroundJobContextV3,
  ): Promise<BackgroundWorkerLeaseV3> {
    if (this.#disposed) {
      throw new Error("Workbench background Worker pool is disposed");
    }
    const idle = this.#idle.pop();
    if (idle !== undefined) {
      this.#leased.add(idle);
      return Object.freeze({ client: idle, kind: "warm" });
    }
    if (this.#regularLeaseCount() < this.#maxSize) {
      const created = this.#createClient();
      this.#leased.add(created);
      return Object.freeze({ client: created, kind: "regular" });
    }
    if (this.#canLeaseForegroundBurst(context.priority)) {
      const created = this.#createClient();
      this.#leased.add(created);
      this.#foregroundBurst.add(created);
      return Object.freeze({ client: created, kind: "foreground-burst" });
    }
    return await new Promise<BackgroundWorkerLeaseV3>(
      (resolve, reject) => {
        context.queueDepthAtSchedule = this.#waiting.length + 1;
        this.#waiting.push({
          context,
          resolve,
          reject: (error) => reject(error),
        });
        this.#sortWaiting();
      },
    );
  }

  #release(client: StudioSimulationWorkerClientV2): void {
    if (!this.#leased.delete(client)) return;
    this.#foregroundBurst.delete(client);
    terminateClientV3(client);
    if (this.#disposed) return;
    this.#dispatchWaiting();
    this.#replenishWarmWorkers();
  }

  #promote(
    token: symbol,
    priority: WorkbenchBackgroundJobPriorityV3,
  ): void {
    requirePriorityV3(priority);
    const waiting = this.#waiting.find(
      (candidate) => candidate.context.token === token,
    );
    if (
      waiting === undefined
      || PRIORITY_ORDER_V3[priority]
        >= PRIORITY_ORDER_V3[waiting.context.priority]
    ) return;
    waiting.context.priority = priority;
    this.#sortWaiting();
    this.#dispatchWaiting();
  }

  #cancel(token: symbol): boolean {
    const index = this.#waiting.findIndex(
      (candidate) => candidate.context.token === token,
    );
    if (index < 0) return false;
    const [waiting] = this.#waiting.splice(index, 1);
    waiting!.reject(new WorkbenchBackgroundJobCancelledErrorV3());
    return true;
  }

  #dispatchWaiting(): void {
    if (this.#disposed) return;
    while (this.#waiting.length > 0) {
      const waiting = this.#waiting[0]!;
      const regularLeaseAvailable = this.#regularLeaseCount() < this.#maxSize;
      const burstLeaseAvailable = this.#canLeaseForegroundBurst(
        waiting.context.priority,
      );
      if (!regularLeaseAvailable && !burstLeaseAvailable) return;
      this.#waiting.shift();
      try {
        const replacement = this.#createClient();
        this.#leased.add(replacement);
        if (!regularLeaseAvailable) this.#foregroundBurst.add(replacement);
        waiting.resolve(Object.freeze({
          client: replacement,
          kind: regularLeaseAvailable ? "regular" : "foreground-burst",
        }));
      } catch (error) {
        waiting.reject(errorAsErrorV3(error));
      }
    }
  }

  #canLeaseForegroundBurst(
    priority: WorkbenchBackgroundJobPriorityV3,
  ): boolean {
    return (priority === "snapshot" || priority === "save")
      && this.#foregroundBurst.size === 0
      && this.#regularLeaseCount() >= this.#maxSize
      && this.#leased.size < Math.min(8, this.#maxSize + 1);
  }

  #regularLeaseCount(): number {
    return this.#leased.size - this.#foregroundBurst.size;
  }

  #sortWaiting(): void {
    this.#waiting.sort((left, right) =>
      PRIORITY_ORDER_V3[left.context.priority]
        - PRIORITY_ORDER_V3[right.context.priority]
      || left.context.sequence - right.context.sequence);
  }

  #observeTerminalJob(
    context: BackgroundJobContextV3,
    leaseKind: WorkbenchBackgroundWorkerLeaseKindV3 | null,
    startedAtMs: number | null,
    outcome: "completed" | "failed" | "cancelled",
  ): void {
    const finishedAtMs = this.#nowMs();
    const queueDurationMs = elapsedWorkbenchRuntimeMsV3(
      context.scheduledAtMs,
      startedAtMs ?? finishedAtMs,
    );
    emitWorkbenchRuntimeObservationV3(this.#observe, {
      kind: "background-worker-job",
      scheduledPriority: context.scheduledPriority,
      finalPriority: context.priority,
      promoted: context.scheduledPriority !== context.priority,
      leaseKind,
      queueDepthAtSchedule: context.queueDepthAtSchedule,
      queueDurationMs,
      executionDurationMs: startedAtMs === null
        ? null
        : elapsedWorkbenchRuntimeMsV3(startedAtMs, finishedAtMs),
      totalDurationMs: elapsedWorkbenchRuntimeMsV3(
        context.scheduledAtMs,
        finishedAtMs,
      ),
      outcome,
    });
  }

  #replenishWarmWorkers(): void {
    if (this.#disposed) return;
    while (
      this.#idle.length < this.#warmSize
      && this.#idle.length + this.#regularLeaseCount() < this.#maxSize
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
}

export class WorkbenchBackgroundJobCancelledErrorV3 extends Error {
  constructor() {
    super("Workbench background job was cancelled before it started");
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
  // Responsive Guyton / Starling and rapid PV analysis intentionally fork
  // hypovolemic and hypervolemic continuation lanes. Keep both directions
  // concurrent whenever the browser reports at least two logical cores;
  // serializing them makes progressive analysis visibly stall on modest
  // laptops and shared CI runners. The live Scenario lane remains separate
  // and the global cap still prevents unbounded numerical Worker growth.
  const maxSize = logicalCores === 1
    ? 1
    : Math.min(4, Math.max(2, Math.floor(logicalCores / 4)));
  return Object.freeze({
    warmSize: Math.min(2, maxSize),
    maxSize,
  });
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

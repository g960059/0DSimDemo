import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

export type WorkbenchBackgroundJobPriorityV3 =
  | "snapshot"
  | "save"
  | "analysis";

export type WorkbenchBackgroundWorkerPoolPortV3 = Readonly<{
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
  priority: WorkbenchBackgroundJobPriorityV3;
  sequence: number;
  resolve(client: StudioSimulationWorkerClientV2): void;
  reject(error: Error): void;
}>;

const PRIORITY_ORDER_V3: Readonly<Record<WorkbenchBackgroundJobPriorityV3, number>> =
  Object.freeze({ snapshot: 0, save: 1, analysis: 2 });

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
  readonly #idle: StudioSimulationWorkerClientV2[] = [];
  readonly #leased = new Set<StudioSimulationWorkerClientV2>();
  readonly #waiting: WaitingJobV3[] = [];
  #sequence = 0;
  #disposed = false;

  constructor(
    budget: WorkbenchBackgroundWorkerBudgetV3 =
      resolveWorkbenchBackgroundWorkerBudgetV3(),
    createClient: () => StudioSimulationWorkerClientV2 =
      () => new StudioSimulationWorkerClientV2(),
  ) {
    requireWorkerBudgetV3(budget);
    this.#warmSize = budget.warmSize;
    this.#maxSize = budget.maxSize;
    this.#createClient = createClient;
    this.#replenishWarmWorkers();
  }

  async run<T>(
    priority: WorkbenchBackgroundJobPriorityV3,
    operation: (client: StudioSimulationWorkerClientV2) => Promise<T>,
  ): Promise<T> {
    const client = await this.#acquire(priority);
    try {
      return await operation(client);
    } finally {
      this.#release(client);
    }
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    const error = new Error("Workbench background Worker pool is disposed");
    for (const waiting of this.#waiting.splice(0)) waiting.reject(error);
    for (const client of this.#idle.splice(0)) terminateClientV3(client);
    for (const client of this.#leased) terminateClientV3(client);
    this.#leased.clear();
  }

  async #acquire(
    priority: WorkbenchBackgroundJobPriorityV3,
  ): Promise<StudioSimulationWorkerClientV2> {
    if (this.#disposed) {
      throw new Error("Workbench background Worker pool is disposed");
    }
    const idle = this.#idle.pop();
    if (idle !== undefined) {
      this.#leased.add(idle);
      return idle;
    }
    if (this.#leased.size < this.#maxSize) {
      const created = this.#createClient();
      this.#leased.add(created);
      return created;
    }
    return await new Promise<StudioSimulationWorkerClientV2>(
      (resolve, reject) => {
        this.#waiting.push(Object.freeze({
          priority,
          sequence: this.#sequence++,
          resolve,
          reject: (error) => reject(error),
        }));
        this.#waiting.sort((left, right) =>
          PRIORITY_ORDER_V3[left.priority] - PRIORITY_ORDER_V3[right.priority]
          || left.sequence - right.sequence);
      },
    );
  }

  #release(client: StudioSimulationWorkerClientV2): void {
    if (!this.#leased.delete(client)) return;
    terminateClientV3(client);
    if (this.#disposed) return;

    while (this.#waiting.length > 0) {
      const waiting = this.#waiting.shift()!;
      try {
        const replacement = this.#createClient();
        this.#leased.add(replacement);
        waiting.resolve(replacement);
        return;
      } catch (error) {
        waiting.reject(errorAsErrorV3(error));
      }
    }
    this.#replenishWarmWorkers();
  }

  #replenishWarmWorkers(): void {
    if (this.#disposed) return;
    while (
      this.#idle.length < this.#warmSize
      && this.#idle.length + this.#leased.size < this.#maxSize
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

export function resolveWorkbenchBackgroundWorkerBudgetV3(
  hardwareConcurrency = typeof navigator === "undefined"
    ? 8
    : navigator.hardwareConcurrency,
): WorkbenchBackgroundWorkerBudgetV3 {
  const logicalCores = Number.isFinite(hardwareConcurrency)
    ? Math.max(1, Math.floor(hardwareConcurrency))
    : 8;
  const maxSize = Math.min(4, Math.max(1, Math.floor(logicalCores / 4)));
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

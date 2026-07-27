import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import type {
  ScientificCommandV1,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerClientStatusV1,
  MainWireScientificWorkerResponseV1,
} from "./MainWireScientificWorkerClientV1";

export const MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1 = Object.freeze({
  policyId: "main-wire-scientific-worker-live-lane-budget-v1" as const,
  logicalProcessorCountPerLiveLane: 4 as const,
  minimumLiveLaneCount: 1 as const,
  maximumLiveLaneCount: 4 as const,
  nonBrowserFallbackLiveLaneCount: 4 as const,
  allocation: "fixed-hardware-concurrency-admission" as const,
  throughputFeedbackAllowed: false as const,
  analysisControlPlaneSharesLiveWorker: true as const,
  strictSettlementWorkerIsolation: "separate-transient-worker" as const,
  exactSignalReplayWorkerIsolation: "separate-transient-worker" as const,
});

export type MainWireScientificWorkerLaneBudgetV1 = Readonly<{
  policyId: typeof MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1.policyId;
  hardwareConcurrency: number;
  maximumConcurrentLiveLaneCount: number;
}>;

export function mainWireScientificWorkerLaneBudgetV1(
  hardwareConcurrency: number,
): MainWireScientificWorkerLaneBudgetV1 {
  const normalizedHardwareConcurrency =
    Number.isSafeInteger(hardwareConcurrency) && hardwareConcurrency > 0
      ? hardwareConcurrency
      : 1;
  const policy = MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1;
  const maximumConcurrentLiveLaneCount = Math.max(
    policy.minimumLiveLaneCount,
    Math.min(
      policy.maximumLiveLaneCount,
      Math.floor(
        normalizedHardwareConcurrency
          / policy.logicalProcessorCountPerLiveLane,
      ),
    ),
  );
  return Object.freeze({
    policyId: policy.policyId,
    hardwareConcurrency: normalizedHardwareConcurrency,
    maximumConcurrentLiveLaneCount,
  });
}

export function browserMainWireScientificWorkerLaneBudgetV1():
  MainWireScientificWorkerLaneBudgetV1 {
  if (
    typeof globalThis.window === "undefined"
    || typeof globalThis.navigator === "undefined"
  ) {
    return mainWireScientificWorkerLaneBudgetV1(
      MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1
        .nonBrowserFallbackLiveLaneCount
      * MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1
        .logicalProcessorCountPerLiveLane,
    );
  }
  return mainWireScientificWorkerLaneBudgetV1(
    globalThis.navigator.hardwareConcurrency,
  );
}

export interface MainWireScientificWorkerClientLeaseV1 {
  readonly status: MainWireScientificWorkerClientStatusV1;
  readonly requestCount: number;
  request(command: ScientificCommandV1):
    Promise<MainWireScientificWorkerResponseV1>;
  terminate(): void;
}

type UnderlyingScientificClientV1 = MainWireScientificWorkerClientLeaseV1;

type UnderlyingClientFactoryV1 = (
  integrityTier: HotPathIntegrityTierV1,
) => UnderlyingScientificClientV1;

type WorkerGenerationV1 = {
  client: UnderlyingScientificClientV1;
  liveLeaseCount: number;
  leaseCount: number;
};

export class MainWireScientificWorkerLaneErrorV1 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MainWireScientificWorkerLaneErrorV1";
  }
}

/**
 * One admitted product lane.
 *
 * The live host and the scenario's hemodynamic-analysis control plane share
 * the current parent Worker/kernel. The analysis manager's compute-heavy
 * continuation Workers remain separate. A live host replacement starts a new
 * generation so exact-checkpoint host rotation retains its fresh-kernel
 * boundary; an in-flight analysis may finish on the retired generation.
 */
export class MainWireScientificWorkerLaneV1 {
  private readonly createUnderlyingClient: UnderlyingClientFactoryV1;
  private readonly onReleased: () => void;
  private readonly generations = new Set<WorkerGenerationV1>();
  private currentGeneration: WorkerGenerationV1 | null = null;
  private released = false;

  constructor(options: Readonly<{
    createUnderlyingClient: UnderlyingClientFactoryV1;
    onReleased?: () => void;
  }>) {
    this.createUnderlyingClient = options.createUnderlyingClient;
    this.onReleased = options.onReleased ?? (() => undefined);
  }

  createLiveClient(
    integrityTier: HotPathIntegrityTierV1,
  ): MainWireScientificWorkerClientLeaseV1 {
    this.assertOpenV1();
    let generation = this.currentGeneration;
    if (generation?.liveLeaseCount) {
      generation = this.createGenerationV1(integrityTier);
    } else if (generation === null) {
      generation = this.createGenerationV1(integrityTier);
    }
    generation.liveLeaseCount += 1;
    return this.createLeaseV1(generation, "live");
  }

  createAnalysisClient(): MainWireScientificWorkerClientLeaseV1 {
    this.assertOpenV1();
    const generation = this.currentGeneration;
    if (generation === null || generation.liveLeaseCount === 0) {
      throw new MainWireScientificWorkerLaneErrorV1(
        "scientific analysis cannot acquire a lane without a live Worker",
      );
    }
    return this.createLeaseV1(generation, "analysis");
  }

  terminate(): void {
    if (this.released) return;
    this.released = true;
    for (const generation of this.generations) {
      generation.client.terminate();
    }
    this.generations.clear();
    this.currentGeneration = null;
    this.onReleased();
  }

  private createGenerationV1(
    integrityTier: HotPathIntegrityTierV1,
  ): WorkerGenerationV1 {
    const generation: WorkerGenerationV1 = {
      client: this.createUnderlyingClient(integrityTier),
      liveLeaseCount: 0,
      leaseCount: 0,
    };
    this.generations.add(generation);
    this.currentGeneration = generation;
    return generation;
  }

  private createLeaseV1(
    generation: WorkerGenerationV1,
    role: "live" | "analysis",
  ): MainWireScientificWorkerClientLeaseV1 {
    generation.leaseCount += 1;
    let terminated = false;
    return {
      get status(): MainWireScientificWorkerClientStatusV1 {
        return terminated ? "terminated" : generation.client.status;
      },
      get requestCount(): number {
        return generation.client.requestCount;
      },
      request: (command) => {
        if (terminated) {
          return Promise.reject(
            new MainWireScientificWorkerLaneErrorV1(
              "scientific Worker lane lease is terminated",
            ),
          );
        }
        return generation.client.request(command);
      },
      terminate: () => {
        if (terminated) return;
        terminated = true;
        generation.leaseCount -= 1;
        if (role === "live") generation.liveLeaseCount -= 1;
        this.releaseGenerationIfUnusedV1(generation);
      },
    };
  }

  private releaseGenerationIfUnusedV1(
    generation: WorkerGenerationV1,
  ): void {
    if (generation.leaseCount !== 0) return;
    generation.client.terminate();
    this.generations.delete(generation);
    if (this.currentGeneration === generation) {
      const fallback = [...this.generations]
        .reverse()
        .find((candidate) => candidate.liveLeaseCount > 0) ?? null;
      this.currentGeneration = fallback;
    }
    if (this.generations.size !== 0 || this.released) return;
    this.released = true;
    this.onReleased();
  }

  private assertOpenV1(): void {
    if (this.released) {
      throw new MainWireScientificWorkerLaneErrorV1(
        "scientific Worker lane was released",
      );
    }
  }
}

export class MainWireScientificWorkerLaneSchedulerV1 {
  readonly budget: MainWireScientificWorkerLaneBudgetV1;
  private activeLaneCount = 0;

  constructor(
    budget: MainWireScientificWorkerLaneBudgetV1,
    private readonly createUnderlyingClient: UnderlyingClientFactoryV1,
  ) {
    this.budget = budget;
  }

  get maximumConcurrentLiveLaneCount(): number {
    return this.budget.maximumConcurrentLiveLaneCount;
  }

  get admittedLiveLaneCount(): number {
    return this.activeLaneCount;
  }

  acquireLane(): MainWireScientificWorkerLaneV1 {
    if (this.activeLaneCount >= this.maximumConcurrentLiveLaneCount) {
      throw new MainWireScientificWorkerLaneErrorV1(
        `scientific live-lane budget ${this.maximumConcurrentLiveLaneCount} is exhausted`,
      );
    }
    this.activeLaneCount += 1;
    return new MainWireScientificWorkerLaneV1({
      createUnderlyingClient: this.createUnderlyingClient,
      onReleased: () => {
        this.activeLaneCount -= 1;
      },
    });
  }
}

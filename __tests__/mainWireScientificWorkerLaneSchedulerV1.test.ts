import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1,
  MainWireScientificWorkerLaneSchedulerV1,
  mainWireScientificWorkerLaneBudgetV1,
  type MainWireScientificWorkerClientLeaseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerLaneSchedulerV1";
import type {
  HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";

describe("MainWire scientific Worker lane scheduler V1", () => {
  it("declares a fixed hardware-concurrency policy with no throughput feedback", () => {
    expect(MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1).toEqual({
      policyId: "main-wire-scientific-worker-live-lane-budget-v1",
      logicalProcessorCountPerLiveLane: 4,
      minimumLiveLaneCount: 1,
      maximumLiveLaneCount: 4,
      nonBrowserFallbackLiveLaneCount: 4,
      allocation: "fixed-hardware-concurrency-admission",
      throughputFeedbackAllowed: false,
      analysisControlPlaneSharesLiveWorker: true,
      strictSettlementWorkerIsolation: "separate-transient-worker",
      exactSignalReplayWorkerIsolation: "separate-transient-worker",
    });
    expect(mainWireScientificWorkerLaneBudgetV1(1))
      .toMatchObject({ maximumConcurrentLiveLaneCount: 1 });
    expect(mainWireScientificWorkerLaneBudgetV1(4))
      .toMatchObject({ maximumConcurrentLiveLaneCount: 1 });
    expect(mainWireScientificWorkerLaneBudgetV1(8))
      .toMatchObject({ maximumConcurrentLiveLaneCount: 2 });
    expect(mainWireScientificWorkerLaneBudgetV1(18))
      .toMatchObject({ maximumConcurrentLiveLaneCount: 4 });
    expect(mainWireScientificWorkerLaneBudgetV1(64))
      .toMatchObject({ maximumConcurrentLiveLaneCount: 4 });
  });

  it("co-locates live and analysis leases and keeps fresh live generations exact", () => {
    const clients: FakeUnderlyingClientV1[] = [];
    const scheduler = new MainWireScientificWorkerLaneSchedulerV1(
      mainWireScientificWorkerLaneBudgetV1(4),
      (integrityTier) => {
        const client = new FakeUnderlyingClientV1(integrityTier);
        clients.push(client);
        return client;
      },
    );
    const lane = scheduler.acquireLane();
    const live = lane.createLiveClient("hot-path-lean");
    const analysis = lane.createAnalysisClient();

    expect(clients).toHaveLength(1);
    expect(clients[0]!.integrityTier).toBe("hot-path-lean");
    expect(scheduler.admittedLiveLaneCount).toBe(1);

    const replacementLive = lane.createLiveClient("hot-path-lean");
    expect(clients).toHaveLength(2);
    live.terminate();
    expect(clients[0]!.terminated).toBe(false);
    analysis.terminate();
    expect(clients[0]!.terminated).toBe(true);
    expect(clients[1]!.terminated).toBe(false);

    replacementLive.terminate();
    expect(clients[1]!.terminated).toBe(true);
    expect(scheduler.admittedLiveLaneCount).toBe(0);
  });

  it("admits no more live lanes than the declared budget", () => {
    const scheduler = new MainWireScientificWorkerLaneSchedulerV1(
      mainWireScientificWorkerLaneBudgetV1(4),
      (integrityTier) => new FakeUnderlyingClientV1(integrityTier),
    );
    const first = scheduler.acquireLane();
    expect(() => scheduler.acquireLane()).toThrow(/budget 1 is exhausted/);
    first.terminate();
    expect(scheduler.admittedLiveLaneCount).toBe(0);
    expect(() => scheduler.acquireLane()).not.toThrow();
  });

  it("returns to the accepted generation when a replacement is abandoned", () => {
    const clients: FakeUnderlyingClientV1[] = [];
    const scheduler = new MainWireScientificWorkerLaneSchedulerV1(
      mainWireScientificWorkerLaneBudgetV1(4),
      (integrityTier) => {
        const client = new FakeUnderlyingClientV1(integrityTier);
        clients.push(client);
        return client;
      },
    );
    const lane = scheduler.acquireLane();
    const acceptedLive = lane.createLiveClient("hot-path-lean");
    const abandonedReplacement =
      lane.createLiveClient("hot-path-lean");

    abandonedReplacement.terminate();
    const analysis = lane.createAnalysisClient();
    expect(clients).toHaveLength(2);
    expect(clients[0]!.terminated).toBe(false);
    expect(clients[1]!.terminated).toBe(true);

    analysis.terminate();
    acceptedLive.terminate();
    expect(clients[0]!.terminated).toBe(true);
    expect(scheduler.admittedLiveLaneCount).toBe(0);
  });
});

class FakeUnderlyingClientV1
implements MainWireScientificWorkerClientLeaseV1 {
  status = "open" as const;
  requestCount = 0;
  terminated = false;

  constructor(readonly integrityTier: HotPathIntegrityTierV1) {}

  request(): ReturnType<MainWireScientificWorkerClientLeaseV1["request"]> {
    return Promise.reject(new Error("unused fake request"));
  }

  terminate(): void {
    this.terminated = true;
  }
}

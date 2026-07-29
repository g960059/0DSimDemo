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
import {
  SCIENTIFIC_PRODUCT_SCENARIO_CAP_V1,
} from "@/components/scientificProduct/ScientificProductScenarioPolicyV1";

describe("MainWire scientific Worker lane scheduler V1", () => {
  it("uses the product scenario cap and keeps performance report-only", () => {
    expect(MAIN_WIRE_SCIENTIFIC_WORKER_LANE_POLICY_V1).toEqual({
      policyId: "main-wire-scientific-worker-live-lane-budget-v1",
      maximumLiveLaneCount: SCIENTIFIC_PRODUCT_SCENARIO_CAP_V1,
      allocation: "product-scenario-cap-admission",
      performance: {
        policy: "reported-not-rationed",
        runtimeRateReporting: "achieved-rate-published",
        issue508Measurement: {
          machineScope: "one-high-end-machine",
          approximateMainThreadFractionPerLiveLane: 0.4,
          saturationObservedBetweenLiveLaneCounts: [2, 3],
          threadOversubscriptionAtOneTimes: "ruled-out",
        },
        supportedHardwareFloor: {
          device: "iPhone 14 or later",
          logicalProcessorCount: 6,
          sweptByIssue508: false,
        },
      },
      analysisControlPlaneSharesLiveWorker: true,
      strictSettlementWorkerIsolation: "separate-transient-worker",
      exactSignalReplayWorkerIsolation: "separate-transient-worker",
    });
    const budget = mainWireScientificWorkerLaneBudgetV1();
    expect(budget).toEqual({
      policyId: "main-wire-scientific-worker-live-lane-budget-v1",
      maximumConcurrentLiveLaneCount: SCIENTIFIC_PRODUCT_SCENARIO_CAP_V1,
    });
    expect("hardwareConcurrency" in budget).toBe(false);
  });

  it("co-locates live and analysis leases and keeps fresh live generations exact", () => {
    const clients: FakeUnderlyingClientV1[] = [];
    const scheduler = new MainWireScientificWorkerLaneSchedulerV1(
      mainWireScientificWorkerLaneBudgetV1(),
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
      mainWireScientificWorkerLaneBudgetV1(),
      (integrityTier) => new FakeUnderlyingClientV1(integrityTier),
    );
    const lanes = Array.from(
      { length: SCIENTIFIC_PRODUCT_SCENARIO_CAP_V1 },
      () => scheduler.acquireLane(),
    );
    expect(scheduler.availableLiveLaneCount).toBe(0);
    expect(() => scheduler.acquireLane()).toThrow(/budget 4 is exhausted/);
    lanes[0]!.terminate();
    expect(scheduler.admittedLiveLaneCount).toBe(3);
    const replacement = scheduler.acquireLane();
    for (const lane of lanes.slice(1)) lane.terminate();
    replacement.terminate();
    expect(scheduler.admittedLiveLaneCount).toBe(0);
  });

  it("returns to the accepted generation when a replacement is abandoned", () => {
    const clients: FakeUnderlyingClientV1[] = [];
    const scheduler = new MainWireScientificWorkerLaneSchedulerV1(
      mainWireScientificWorkerLaneBudgetV1(),
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

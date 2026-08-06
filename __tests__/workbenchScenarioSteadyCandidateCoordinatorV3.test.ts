import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchBackgroundWorkerPoolV3,
} from "@/components/workbench/v3/WorkbenchBackgroundWorkerPoolV3";
import {
  WorkbenchScenarioSteadyCandidateCoordinatorV3,
} from "@/components/workbench/v3/WorkbenchScenarioSteadyCandidateCoordinatorV3";
import type { StudioSimulationFrameV2 } from
  "@/studio/contracts/v2/simulation";
import type { StudioSimulationWorkerClientV2 } from
  "@/studio/workers/StudioSimulationWorkerClientV2";

describe("WorkbenchScenarioSteadyCandidateCoordinatorV3", () => {
  it("promotes one queued prewarm into a foreground Snapshot burst and reuses it", async () => {
    const clients: ReturnType<typeof steadyClientV3>[] = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => {
        const client = steadyClientV3();
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
    );
    let releaseBlocker!: () => void;
    const blockerGate = new Promise<void>((resolve) => {
      releaseBlocker = resolve;
    });
    const blocker = pool.run("analysis", async () => await blockerGate);
    await Promise.resolve();

    const coordinator = new WorkbenchScenarioSteadyCandidateCoordinatorV3(
      pool,
    );
    const source = sourceV3(4);
    coordinator.prewarm(source);
    expect(coordinator.bestAvailable(source)).toBeNull();
    const snapshotCandidate = await coordinator.resolve(source, "snapshot");

    expect(snapshotCandidate.convergence).toBe("observed-period1");
    expect(snapshotCandidate.completedCycleCount).toBe(4);
    expect(snapshotCandidate.scenario.capture.checkpoint.acceptedRevision)
      .toBeGreaterThan(4);
    expect(clients).toHaveLength(2);
    expect(clients[1]!.initialize).toHaveBeenCalledOnce();
    expect(coordinator.bestAvailable(source)).toBe(snapshotCandidate);

    const reused = await coordinator.resolve(source, "analysis");
    expect(reused).toBe(snapshotCandidate);
    expect(clients[1]!.initialize).toHaveBeenCalledOnce();

    releaseBlocker();
    await blocker;
    coordinator.dispose();
    pool.dispose();
  });

  it("invalidates a previous parameter target instead of reusing its checkpoint", async () => {
    const clients: ReturnType<typeof steadyClientV3>[] = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => {
        const client = steadyClientV3();
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
    );
    const coordinator = new WorkbenchScenarioSteadyCandidateCoordinatorV3(
      pool,
    );

    const first = await coordinator.resolve(sourceV3(1), "analysis");
    const second = await coordinator.resolve(sourceV3(2), "analysis");

    expect(first.inputEpoch).toBe(1);
    expect(second.inputEpoch).toBe(2);
    expect(second).not.toBe(first);
    expect(clients.filter((client) => client.initialize.mock.calls.length > 0))
      .toHaveLength(2);
    coordinator.dispose();
    pool.dispose();
  });
});

function steadyClientV3() {
  let scenarioId = "scenario/baseline";
  let runtimeSessionId = "runtime/steady";
  let revision = 0;
  let timeSec = 0;
  return {
    initialize: vi.fn(async (input: Readonly<{
      runtimeSessionId: string;
      scenarioId: string;
      checkpoint: Readonly<{
        acceptedRevision: number;
        acceptedTimeSec: number;
      }>;
    }>) => {
      runtimeSessionId = input.runtimeSessionId;
      scenarioId = input.scenarioId;
      revision = input.checkpoint.acceptedRevision;
      timeSec = input.checkpoint.acceptedTimeSec;
      return frameV3(runtimeSessionId, scenarioId, revision, timeSec, 0.95);
    }),
    advance: vi.fn(async (input: Readonly<{ stepCount: number }>) =>
      Object.freeze(Array.from({ length: input.stepCount }, (_, index) => {
        revision += 1;
        timeSec += 0.002;
        const phase = ((index + 1) % 4) / 4;
        return frameV3(
          runtimeSessionId,
          scenarioId,
          revision,
          timeSec,
          phase,
        );
      }))),
    readScenarios: vi.fn(async () => ({
      activeScenarioId: scenarioId,
      scenarios: [{
        scenarioId,
        label: "Baseline",
        capture: {
          fixture: { totalBloodVolumeMl: 5_600 },
          checkpoint: {
            acceptedRevision: revision,
            acceptedTimeSec: timeSec,
            payload: { state: revision },
          },
        },
      }],
    })),
    terminate: vi.fn(),
  };
}

function sourceV3(inputEpoch: number) {
  return {
    modelId: "model/main-wire-v3-r1",
    inputEpoch,
    scenario: {
      scenarioId: "scenario/baseline",
      label: "Baseline",
      capture: {
        fixture: { totalBloodVolumeMl: 5_600 + inputEpoch },
        checkpoint: {
          acceptedRevision: inputEpoch,
          acceptedTimeSec: inputEpoch * 0.002,
          payload: { state: inputEpoch },
        },
      },
    },
  } as const;
}

function frameV3(
  runtimeSessionId: string,
  scenarioId: string,
  acceptedRevision: number,
  acceptedTimeSec: number,
  phase: number,
): StudioSimulationFrameV2 {
  return Object.freeze({
    modelId: "model/main-wire-v3-r1",
    runtimeSessionId,
    scenarioId,
    inputEpoch: 0,
    acceptedRevision,
    acceptedTimeSec,
    outputs: Object.freeze({
      "rhythm.phase.regular-sinus": Object.freeze({
        outputId: "rhythm.phase.regular-sinus",
        value: phase,
        availability: "available",
        quality: "authoritative-state",
      }),
      "hemodynamics.cardiac-output.native-left": Object.freeze({
        outputId: "hemodynamics.cardiac-output.native-left",
        value: 5.4,
        availability: "available",
        quality: "accepted-derived",
      }),
    }),
  });
}

import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchBackgroundWorkerPoolV3,
  resolveWorkbenchBackgroundWorkerBudgetV3,
} from "@/components/workbench/v3/WorkbenchBackgroundWorkerPoolV3";
import type {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import type {
  WorkbenchRuntimeObservationV3,
} from "@/components/workbench/v3/WorkbenchRuntimeObservabilityV3";

describe("WorkbenchBackgroundWorkerPoolV3", () => {
  it("keeps only uninitialized Workers warm and replaces each used lease", async () => {
    const clients: Array<{ terminate: ReturnType<typeof vi.fn> }> = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 1, maxSize: 1 },
      () => {
        const client = { terminate: vi.fn() };
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
    );
    expect(clients).toHaveLength(1);

    const firstClient = await pool.run("analysis", async (client) => client);
    expect(firstClient).toBe(clients[0]);
    expect(clients[0]!.terminate).toHaveBeenCalledOnce();
    expect(clients).toHaveLength(2);

    const secondClient = await pool.run("snapshot", async (client) => client);
    expect(secondClient).toBe(clients[1]);
    expect(clients[1]!.terminate).toHaveBeenCalledOnce();
    expect(clients).toHaveLength(3);

    pool.dispose();
    expect(clients[2]!.terminate).toHaveBeenCalledOnce();
  });

  it("runs a queued Snapshot before older analysis work at the bounded cap", async () => {
    const clients: Array<{ terminate: ReturnType<typeof vi.fn> }> = [];
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 1, maxSize: 1 },
      () => {
        const client = { terminate: vi.fn() };
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
    );

    const first = pool.run("analysis", async () => {
      events.push("active-analysis");
      await firstGate;
    });
    const queuedAnalysis = pool.run("analysis", async () => {
      events.push("queued-analysis");
    });
    const queuedSnapshot = pool.run("snapshot", async () => {
      events.push("snapshot");
    });
    releaseFirst();

    await Promise.all([first, queuedAnalysis, queuedSnapshot]);
    expect(events).toEqual([
      "active-analysis",
      "snapshot",
      "queued-analysis",
    ]);
    expect(clients.slice(0, 3).every(({ terminate }) =>
      terminate.mock.calls.length === 1)).toBe(true);
    pool.dispose();
  });

  it("keeps regular capacity usable while one Save burst is running", async () => {
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => ({ terminate: vi.fn() }) as unknown as
        StudioSimulationWorkerClientV2,
    );
    let releaseAnalysis!: () => void;
    let releaseSave!: () => void;
    const analysisGate = new Promise<void>((resolve) => {
      releaseAnalysis = resolve;
    });
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    const events: string[] = [];

    const analysis = pool.run("analysis", async () => {
      events.push("analysis:start");
      await analysisGate;
      events.push("analysis:end");
    });
    const save = pool.run("save", async () => {
      events.push("save:start");
      await saveGate;
      events.push("save:end");
    });
    await Promise.resolve();
    releaseAnalysis();
    await analysis;

    await pool.run("analysis", async () => {
      events.push("analysis:next");
    });
    expect(events).toEqual([
      "analysis:start",
      "save:start",
      "analysis:end",
      "analysis:next",
    ]);

    releaseSave();
    await save;
    pool.dispose();
  });

  it("derives a conservative bounded budget from logical CPU count", () => {
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(1)).toEqual({
      warmSize: 1,
      maxSize: 1,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(2)).toEqual({
      warmSize: 2,
      maxSize: 2,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(8)).toEqual({
      warmSize: 2,
      maxSize: 2,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(64)).toEqual({
      warmSize: 2,
      maxSize: 4,
    });
  });

  it("observes queue and execution latency without changing the job result", async () => {
    const observations: WorkbenchRuntimeObservationV3[] = [];
    const clock = vi.fn()
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(103)
      .mockReturnValueOnce(113);
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => ({ terminate: vi.fn() }) as unknown as
        StudioSimulationWorkerClientV2,
      {
        nowMs: clock,
        observe: (observation) => observations.push(observation),
      },
    );

    await expect(pool.run("analysis", async () => "result"))
      .resolves.toBe("result");

    expect(observations).toEqual([{
      kind: "background-worker-job",
      scheduledPriority: "analysis",
      finalPriority: "analysis",
      promoted: false,
      leaseKind: "regular",
      queueDepthAtSchedule: 0,
      queueDurationMs: 3,
      executionDurationMs: 10,
      totalDurationMs: 13,
      outcome: "completed",
    }]);
    pool.dispose();
  });

  it("observes cancellation before a queued job acquires numerical authority", async () => {
    const observations: WorkbenchRuntimeObservationV3[] = [];
    let nowMs = 0;
    let releaseActive!: () => void;
    const activeGate = new Promise<void>((resolve) => {
      releaseActive = resolve;
    });
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => ({ terminate: vi.fn() }) as unknown as
        StudioSimulationWorkerClientV2,
      {
        nowMs: () => nowMs,
        observe: (observation) => observations.push(observation),
      },
    );
    const active = pool.run("analysis", async () => await activeGate);
    await Promise.resolve();
    nowMs = 5;
    const queued = pool.schedule("prewarm", async () => undefined);
    nowMs = 17;
    expect(queued.cancel()).toBe(true);
    await expect(queued.promise).rejects.toThrow(/cancelled before it started/);

    const cancelled = observations.find((observation) =>
      observation.kind === "background-worker-job"
      && observation.outcome === "cancelled");
    expect(cancelled).toMatchObject({
      scheduledPriority: "prewarm",
      finalPriority: "prewarm",
      leaseKind: null,
      queueDepthAtSchedule: 1,
      queueDurationMs: 12,
      executionDurationMs: null,
      totalDurationMs: 12,
    });

    releaseActive();
    await active;
    pool.dispose();
  });
});

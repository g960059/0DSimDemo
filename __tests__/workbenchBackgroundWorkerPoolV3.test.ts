import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchBackgroundJobCancelledErrorV3,
  WorkbenchBackgroundWorkerPoolV3,
  resolveWorkbenchBackgroundWorkerBudgetV3,
} from "@/components/workbench/v3/WorkbenchBackgroundWorkerPoolV3";
import type {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

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
      warmSize: 1,
      maxSize: 1,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(4)).toEqual({
      warmSize: 2,
      maxSize: 2,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(8)).toEqual({
      warmSize: 2,
      maxSize: 2,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(12)).toEqual({
      warmSize: 2,
      maxSize: 3,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(16)).toEqual({
      warmSize: 2,
      maxSize: 4,
    });
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(64)).toEqual({
      warmSize: 2,
      maxSize: 4,
    });
  });

  it("keeps speculative settlement queued when live lanes consume the device", async () => {
    const events: string[] = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 2 },
      () => ({ terminate: vi.fn() }) as unknown as
        StudioSimulationWorkerClientV2,
      4,
    );
    pool.setLiveScenarioCount(4);

    const handle = pool.schedule("prewarm", async () => {
      events.push("started");
      return "done";
    });
    await Promise.resolve();
    expect(events).toEqual([]);

    handle.promote("analysis");
    await expect(handle.promise).resolves.toBe("done");
    expect(events).toEqual(["started"]);
    pool.dispose();
  });

  it("uses bounded surplus capacity on a high-core device", async () => {
    const events: number[] = [];
    let releaseActive!: () => void;
    const activeGate = new Promise<void>((resolve) => {
      releaseActive = resolve;
    });
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 4 },
      () => ({ terminate: vi.fn() }) as unknown as
        StudioSimulationWorkerClientV2,
      16,
    );
    pool.setLiveScenarioCount(4);

    const handles = Array.from({ length: 5 }, (_, index) =>
      pool.schedule("analysis", async () => {
        events.push(index);
        if (index < 4) await activeGate;
        return index;
      }));
    await Promise.resolve();
    expect(events).toEqual([0, 1, 2, 3]);

    releaseActive();
    await expect(Promise.all(handles.map(({ promise }) => promise)))
      .resolves.toEqual([0, 1, 2, 3, 4]);
    pool.dispose();
  });

  it("cancels a running single-use Worker instead of retaining stale prewarm", async () => {
    const clients: ReturnType<typeof cancellableClientV3>[] = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => {
        const client = cancellableClientV3();
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
      4,
    );
    const handle = pool.schedule("prewarm", async (client) =>
      await (client as unknown as ReturnType<typeof cancellableClientV3>).wait());
    await Promise.resolve();

    expect(handle.cancel()).toBe(true);
    await expect(handle.promise).rejects.toBeInstanceOf(
      WorkbenchBackgroundJobCancelledErrorV3,
    );
    expect(clients[0]!.terminate).toHaveBeenCalled();

    await expect(pool.run("analysis", async () => "fresh"))
      .resolves.toBe("fresh");
    expect(clients).toHaveLength(2);
    pool.dispose();
  });

  it("preempts running prewarm when explicit analysis needs its only lane", async () => {
    const clients: ReturnType<typeof cancellableClientV3>[] = [];
    const events: string[] = [];
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      { warmSize: 0, maxSize: 1 },
      () => {
        const client = cancellableClientV3();
        clients.push(client);
        return client as unknown as StudioSimulationWorkerClientV2;
      },
      4,
    );
    const prewarm = pool.schedule("prewarm", async (client) => {
      events.push("prewarm:start");
      return await (client as unknown as ReturnType<
        typeof cancellableClientV3
      >).wait();
    });
    await Promise.resolve();

    const analysis = pool.run("analysis", async () => {
      events.push("analysis:start");
      return "analysis";
    });
    await expect(prewarm.promise).rejects.toBeInstanceOf(
      WorkbenchBackgroundJobCancelledErrorV3,
    );
    await expect(analysis).resolves.toBe("analysis");
    expect(events).toEqual(["prewarm:start", "analysis:start"]);
    pool.dispose();
  });
});

function cancellableClientV3() {
  let rejectWait: ((error: Error) => void) | undefined;
  return {
    wait: () => new Promise<void>((_resolve, reject) => {
      rejectWait = reject;
    }),
    terminate: vi.fn(() => {
      rejectWait?.(new Error("test Worker terminated"));
      rejectWait = undefined;
    }),
  };
}

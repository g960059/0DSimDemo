import { describe, expect, it, vi } from "vitest";

import {
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

  it("derives a conservative bounded budget from logical CPU count", () => {
    expect(resolveWorkbenchBackgroundWorkerBudgetV3(2)).toEqual({
      warmSize: 1,
      maxSize: 1,
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
});

import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import type { StarlingSweepRequest } from "@/engine/guytonStarling";
import { createLatestOnlyRequestQueue } from "@/engine/guytonStarlingWorkerQueue";

describe("Guyton / Starling latest-only worker queue", () => {
  it("keeps only the latest queued request for an instance", () => {
    const queue = createLatestOnlyRequestQueue();
    const first = request("first");
    const second = request("second");
    const third = request("third");

    expect(queue.enqueue(first)).toEqual([]);
    expect(queue.enqueue(second).map((item) => item.signature)).toEqual([first.signature]);
    expect(queue.enqueue(third).map((item) => item.signature)).toEqual([second.signature]);

    expect(queue.size()).toBe(1);
    expect(queue.shift()?.signature).toBe(third.signature);
    expect(queue.stats().droppedQueuedRequests).toBe(2);
  });

  it("marks an active request stale when a newer request for the same instance arrives", () => {
    const queue = createLatestOnlyRequestQueue();
    const active = request("active");
    const latest = request("latest");

    queue.enqueue(active);
    expect(queue.shift()).toEqual(active);
    expect(queue.isLatest(active)).toBe(true);

    queue.enqueue(latest);
    expect(queue.isLatest(active)).toBe(false);
    expect(queue.isLatest(latest)).toBe(true);
  });

  it("does not drop queued requests for other instances", () => {
    const queue = createLatestOnlyRequestQueue();
    const first = request("first", "inst-a");
    const second = request("second", "inst-b");

    queue.enqueue(first);
    expect(queue.enqueue(second)).toEqual([]);

    expect(queue.shift()?.signature).toBe(first.signature);
    expect(queue.shift()?.signature).toBe(second.signature);
  });
});

function request(signature: string, instanceId = "inst-1"): StarlingSweepRequest {
  return {
    requestId: `req-${signature}`,
    signature,
    instanceId,
    params: DEFAULT_PARAMS,
    targetVolumeMl: 5600,
  };
}

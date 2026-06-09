import type { StarlingSweepRequest } from "@/engine/guytonStarling";

export type GuytonStarlingDroppedRequest = {
  requestId: string;
  signature: string;
  instanceId: string;
  reason: "superseded-queued";
};

export type LatestOnlyQueueStats = {
  droppedQueuedRequests: number;
};

export type LatestOnlyRequestQueue = {
  enqueue: (request: StarlingSweepRequest) => GuytonStarlingDroppedRequest[];
  shift: () => StarlingSweepRequest | undefined;
  isLatest: (request: Pick<StarlingSweepRequest, "instanceId" | "signature">) => boolean;
  size: () => number;
  stats: () => LatestOnlyQueueStats;
};

export function createLatestOnlyRequestQueue(): LatestOnlyRequestQueue {
  const queue: StarlingSweepRequest[] = [];
  const latestSignatureByInstance = new Map<string, string>();
  let droppedQueuedRequests = 0;

  return {
    enqueue(request) {
      latestSignatureByInstance.set(request.instanceId, request.signature);
      const dropped: GuytonStarlingDroppedRequest[] = [];
      for (let i = queue.length - 1; i >= 0; i--) {
        const queued = queue[i];
        if (queued.instanceId !== request.instanceId) continue;
        queue.splice(i, 1);
        droppedQueuedRequests += 1;
        dropped.push({
          requestId: queued.requestId,
          signature: queued.signature,
          instanceId: queued.instanceId,
          reason: "superseded-queued",
        });
      }
      queue.push(request);
      return dropped.reverse();
    },
    shift() {
      return queue.shift();
    },
    isLatest(request) {
      return latestSignatureByInstance.get(request.instanceId) === request.signature;
    },
    size() {
      return queue.length;
    },
    stats() {
      return { droppedQueuedRequests };
    },
  };
}

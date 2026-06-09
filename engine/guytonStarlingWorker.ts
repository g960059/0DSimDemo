import type {
  GuytonStarlingWorkerMessage,
  StarlingSweepRequest,
} from "@/engine/guytonStarling";
import type { GuytonChainId } from "@/engine/guytonStarlingChainProtocol";
import {
  postGuytonStarlingWorkerMessagesAsync,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";
import { createLatestOnlyRequestQueue } from "@/engine/guytonStarlingWorkerQueue";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<StarlingSweepRequest>) => void) | null;
  postMessage: (message: GuytonStarlingWorkerMessage) => void;
};

const requestQueue = createLatestOnlyRequestQueue();
const chainWorkers = new Map<GuytonChainId, GuytonChainWorkerLike>();
let running = false;

ctx.onmessage = (event: MessageEvent<StarlingSweepRequest>) => {
  requestQueue.enqueue(event.data);
  void drainQueue();
};

async function drainQueue(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (requestQueue.size() > 0) {
      const req = requestQueue.shift();
      if (!req) continue;
      if (!requestQueue.isLatest(req)) continue;
      const isCancelled = () => !requestQueue.isLatest(req);
      await postGuytonStarlingWorkerMessagesAsync(
        req,
        (message) => {
          if (!isCancelled()) ctx.postMessage(message);
        },
        {
          createChainWorker,
          persistentChainWorkers: true,
          onChainWorkerFailure: destroyChainWorker,
          isCancelled,
        },
      );
    }
  } finally {
    running = false;
  }
}

function createChainWorker(chainId: GuytonChainId): GuytonChainWorkerLike {
  const existing = chainWorkers.get(chainId);
  if (existing) return existing;
  const worker = new Worker(new URL("./guytonStarlingChainWorker.ts", import.meta.url), { type: "module" });
  chainWorkers.set(chainId, worker);
  return worker;
}

function destroyChainWorker(chainId: GuytonChainId): void {
  chainWorkers.get(chainId)?.terminate();
  chainWorkers.delete(chainId);
}

export {};

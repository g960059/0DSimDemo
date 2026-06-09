import type {
  GuytonStarlingWorkerMessage,
  StarlingSweepRequest,
} from "@/engine/guytonStarling";
import {
  postGuytonStarlingWorkerMessagesAsync,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<StarlingSweepRequest>) => void) | null;
  postMessage: (message: GuytonStarlingWorkerMessage) => void;
};

ctx.onmessage = (event: MessageEvent<StarlingSweepRequest>) => {
  void postGuytonStarlingWorkerMessagesAsync(
    event.data,
    (message) => ctx.postMessage(message),
    { createChainWorker },
  );
};

function createChainWorker(): GuytonChainWorkerLike {
  return new Worker(new URL("./guytonStarlingChainWorker.ts", import.meta.url), { type: "module" });
}

export {};

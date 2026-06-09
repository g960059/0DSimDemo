import type {
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
} from "@/engine/guytonStarlingChainProtocol";
import {
  buildGuytonChainWorkerErrorResponse,
  postGuytonChainWorkerMessages,
} from "@/engine/guytonStarlingChainWorkerCore";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<GuytonChainWorkerRequest>) => void) | null;
  postMessage: (message: GuytonChainWorkerMessage) => void;
};

ctx.onmessage = (event: MessageEvent<GuytonChainWorkerRequest>) => {
  try {
    postGuytonChainWorkerMessages(event.data, (message) => ctx.postMessage(message));
  } catch (err) {
    ctx.postMessage(buildGuytonChainWorkerErrorResponse(event.data, err));
  }
};

export {};

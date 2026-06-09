import type {
  GuytonChainWorkerRequest,
  GuytonChainWorkerResponse,
} from "@/engine/guytonStarlingChainProtocol";
import {
  buildGuytonChainWorkerErrorResponse,
  buildGuytonChainWorkerResponse,
} from "@/engine/guytonStarlingChainWorkerCore";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<GuytonChainWorkerRequest>) => void) | null;
  postMessage: (message: GuytonChainWorkerResponse) => void;
};

ctx.onmessage = (event: MessageEvent<GuytonChainWorkerRequest>) => {
  try {
    ctx.postMessage(buildGuytonChainWorkerResponse(event.data));
  } catch (err) {
    ctx.postMessage(buildGuytonChainWorkerErrorResponse(event.data, err));
  }
};

export {};

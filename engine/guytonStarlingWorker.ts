import type {
  GuytonStarlingWorkerMessage,
  StarlingSweepRequest,
} from "@/engine/guytonStarling";
import { postGuytonStarlingWorkerMessages } from "@/engine/guytonStarlingWorkerCore";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<StarlingSweepRequest>) => void) | null;
  postMessage: (message: GuytonStarlingWorkerMessage) => void;
};

ctx.onmessage = (event: MessageEvent<StarlingSweepRequest>) => {
  postGuytonStarlingWorkerMessages(event.data, (message) => ctx.postMessage(message));
};

export {};

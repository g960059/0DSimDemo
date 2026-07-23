/// <reference lib="webworker" />

import {
  MainWireIntegratedPreviewWorkerKernelV1,
} from "@/engine/scientific/worker/MainWireIntegratedPreviewWorkerKernelV1";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const kernel = new MainWireIntegratedPreviewWorkerKernelV1();

scope.onmessage = (event: MessageEvent<unknown>): void => {
  void kernel.handle(event.data).then((response) => {
    scope.postMessage(response);
  }).catch((error) => {
    scope.postMessage(Object.freeze({
      kind: "circleheart-integrated-preview-worker-fatal-v1",
      message: error instanceof Error ? error.message : String(error),
    }));
  });
};

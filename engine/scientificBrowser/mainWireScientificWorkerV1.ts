import {
  MainWireScientificInProcessKernelV1,
} from "@/engine/scientific/worker/MainWireScientificInProcessKernelV1";

type ScientificWorkerScopeV1 = Readonly<{
  postMessage: (message: unknown) => void;
}> & {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

const scope = globalThis as unknown as ScientificWorkerScopeV1;
const kernel = new MainWireScientificInProcessKernelV1();

scope.onmessage = (event: MessageEvent<unknown>): void => {
  void kernel.handle(event.data).then((response) => {
    scope.postMessage(response);
  });
};

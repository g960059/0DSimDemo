import {
  createStudioDefaultWorkerCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  type StudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import {
  StudioSimulationWorkerRuntimeV2,
} from "@/studio/workers/StudioSimulationWorkerRuntimeV2";

type WorkerPortV2 = Readonly<{
  postMessage(message: StudioSimulationWorkerResponseV2): void;
  close(): void;
}>;

const workerPort = globalThis as unknown as WorkerPortV2;
const workerRuntime = new StudioSimulationWorkerRuntimeV2({
  port: workerPort,
  async loadExactRuntime() {
    const composition = await createStudioDefaultWorkerCompositionV2();
    return composition.runtime;
  },
});

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  workerRuntime.enqueue(event.data);
});

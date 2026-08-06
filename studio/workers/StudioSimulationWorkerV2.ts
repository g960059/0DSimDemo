import {
  createStudioDefaultWorkerCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  DynamicExactModelRuntimeLoaderV2,
} from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";
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
const dynamicRuntimeLoader = new DynamicExactModelRuntimeLoaderV2();
const workerRuntime = new StudioSimulationWorkerRuntimeV2({
  port: workerPort,
  async loadExactRuntime(input) {
    if (input.releaseTicket !== undefined) {
      if (input.releaseTicket.modelId !== input.expectedModelId) {
        throw new Error("Worker release ticket does not match the requested model");
      }
      return dynamicRuntimeLoader.load(input.releaseTicket);
    }
    // Bundled fallback keeps local/tests usable without Supabase. It is exact:
    // never substitute the current default for a requested historical model.
    const composition = await createStudioDefaultWorkerCompositionV2();
    if (composition.defaultModelId !== input.expectedModelId) {
      throw new Error("Requested exact model requires a registry release ticket");
    }
    return composition.runtime;
  },
});

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  workerRuntime.enqueue(event.data);
});

import {
  MainWireScientificInProcessKernelV1,
} from "@/engine/scientific/worker/MainWireScientificInProcessKernelV1";
import {
  loadBundledOfficialHealthyPeriodicPresetV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicCheckpointPresetV1";
import {
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";

type ScientificWorkerScopeV1 = Readonly<{
  postMessage: (message: unknown) => void;
}> & {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

const scope = globalThis as unknown as ScientificWorkerScopeV1;
const kernel = new MainWireScientificInProcessKernelV1({
  officialPresetLoader: loadBundledOfficialHealthyPeriodicPresetV1,
  officialDocumentCaseLoader:
    loadBundledOfficialHealthyPeriodicDocumentChainV1,
});

scope.onmessage = (event: MessageEvent<unknown>): void => {
  void kernel.handle(event.data).then((response) => {
    scope.postMessage(response);
  });
};

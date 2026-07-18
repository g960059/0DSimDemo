import {
  MainWireScientificInProcessKernelV1,
} from "@/engine/scientific/worker/MainWireScientificInProcessKernelV1";
import {
  loadBundledOfficialHealthyPeriodicPresetV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicCheckpointPresetV1";
import {
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";
import {
  MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
  isMainWireScientificPerformanceSidebandConnectV0,
  scientificCommandIdentityForPerformanceSidebandV0,
  type MainWireScientificPerformanceSidebandMessageV0,
} from "@/engine/scientificBrowser/performance/mainWireScientificPerformanceSidebandV0";

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
let performanceSidebandPort: MessagePort | null = null;

scope.onmessage = (event: MessageEvent<unknown>): void => {
  if (isMainWireScientificPerformanceSidebandConnectV0(event.data)) {
    const port = event.ports[0] ?? null;
    if (port === null || event.ports.length !== 1 || performanceSidebandPort !== null) {
      return;
    }
    performanceSidebandPort = port;
    port.start();
    postPerformanceSidebandMessage({
      protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
      kind: "worker-protocol-ready",
      workerNowMs: performance.now(),
    });
    return;
  }

  // Preserve the canonical Worker path when the measurement-only sideband is
  // absent. In particular, do not read the clock, inspect command identity, or
  // allocate timing records for the ordinary scientific Workbench.
  if (performanceSidebandPort === null) {
    void kernel.handle(event.data).then((response) => {
      scope.postMessage(response);
    });
    return;
  }

  const identity = scientificCommandIdentityForPerformanceSidebandV0(
    event.data,
  );
  const receivedAtWorkerMs = performance.now();
  const kernelStartedAtWorkerMs = performance.now();
  void kernel.handle(event.data).then((response) => {
    const kernelSettledAtWorkerMs = performance.now();
    const scientificResponsePostStartedAtWorkerMs = performance.now();
    scope.postMessage(response);
    const scientificResponsePostReturnedAtWorkerMs = performance.now();
    if (identity !== null) {
      postPerformanceSidebandMessage({
        protocolId: MAIN_WIRE_SCIENTIFIC_PERFORMANCE_SIDEBAND_V0_ID,
        kind: "worker-command-timing",
        requestId: identity.requestId,
        commandKind: identity.commandKind,
        receivedAtWorkerMs,
        kernelStartedAtWorkerMs,
        kernelSettledAtWorkerMs,
        scientificResponsePostStartedAtWorkerMs,
        scientificResponsePostReturnedAtWorkerMs,
      });
    }
  });
};

function postPerformanceSidebandMessage(
  message: MainWireScientificPerformanceSidebandMessageV0,
): void {
  try {
    performanceSidebandPort?.postMessage(message);
  } catch {
    // Performance telemetry is observational only. Its failure must not alter
    // scientific command handling or promote a fallback.
  }
}

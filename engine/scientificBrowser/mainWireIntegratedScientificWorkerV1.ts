import {
  HOT_PATH_INTEGRITY_TIERS_V1,
  selectHotPathIntegrityTierV1,
  type HotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MainWireIntegratedScientificWorkerKernelV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerKernelV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedScientificBrowserRuntimeLimitsV1";

// The live host names this Worker `hot-path-lean`. An unnamed or malformed
// Worker request remains on the conservative full-invariant tier.
selectHotPathIntegrityTierV1(requestedIntegrityTierV1());

function requestedIntegrityTierV1(): HotPathIntegrityTierV1 {
  const requested = (globalThis as { name?: unknown }).name;
  return HOT_PATH_INTEGRITY_TIERS_V1.includes(
      requested as HotPathIntegrityTierV1,
    )
    ? requested as HotPathIntegrityTierV1
    : "full-invariant";
}

type IntegratedWorkerScopeV1 = Readonly<{
  postMessage: (message: unknown) => void;
}> & {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

const scope = globalThis as unknown as IntegratedWorkerScopeV1;
const kernel = new MainWireIntegratedScientificWorkerKernelV1({
  maximumRequestCountPerKernelLifetime:
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumRequestCountPerLifetime,
  maximumSessionIdentityCountPerKernelLifetime:
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumSessionIdentityCountPerLifetime,
  maximumCommandJsonBytes:
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumCommandJsonBytes,
  maximumCommandJsonNodeCount:
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumCommandJsonNodeCount,
  maximumPresentationOrdinalCountPerAdvanceCommand:
    MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1
      .maximumPresentationOrdinalCountPerAdvanceCommand,
});

scope.onmessage = (event: MessageEvent<unknown>): void => {
  void postKernelResponseV1(event.data);
};

async function postKernelResponseV1(command: unknown): Promise<void> {
  try {
    scope.postMessage(await kernel.handle(command));
  } catch (error) {
    // A non-envelope response makes the client reject all pending work and
    // terminate the Worker instead of leaving the live lane frozen.
    scope.postMessage(Object.freeze({
      kind: "main-wire-integrated-worker-fatal-v1",
      message: error instanceof Error ? error.message : String(error),
    }));
  }
}

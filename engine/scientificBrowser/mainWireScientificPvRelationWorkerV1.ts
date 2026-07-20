import {
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  runMainWireScientificPvRelationsProtocolV2,
  type MainWireScientificPvRelationsProtocolDependenciesV2,
  type MainWireScientificPvRelationsProtocolOptionsV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import { SHA256_HEX_PATTERN } from "@/engine/scientific/release/sha256";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
  type MainWireScientificPvRelationWorkerCommandV1,
  type MainWireScientificPvRelationWorkerMessageV1,
} from "@/engine/scientificBrowser/MainWireScientificPvRelationWorkerProtocolV1";

type WorkerScopeV1 = Readonly<{
  postMessage: (message: MainWireScientificPvRelationWorkerMessageV1) => void;
}> & {
  onmessage: ((event: MessageEvent<
    MainWireScientificPvRelationWorkerCommandV1
  >) => void) | null;
};

const scope = globalThis as unknown as WorkerScopeV1;
let activeJobId: string | null = null;
let cancelledJobId: string | null = null;

scope.onmessage = (event): void => {
  const command = event.data;
  if (
    command.protocolId
      !== MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID
  ) return;
  if (command.kind === "cancel") {
    if (activeJobId === command.jobId) cancelledJobId = command.jobId;
    return;
  }
  if (activeJobId !== null) {
    postFailure(command, "PV relation worker already owns an active job");
    return;
  }
  activeJobId = command.jobId;
  cancelledJobId = null;
  try {
    if (!SHA256_HEX_PATTERN.test(command.sourceFingerprint)) {
      throw new Error("PV relation source fingerprint is not SHA-256");
    }
    const capsule = command.capsule;
    if (
      capsule.capsuleId
        !== "main-wire-scientific-hemodynamic-job-capsule-v2"
    ) throw new Error("PV relation capsule identity mismatch");
    const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
    if (
      provider.providerId !== capsule.providerIdentity.providerId
      || provider.parameterSetId !== capsule.providerIdentity.parameterSetId
      || provider.parameterIdentityHash
        !== capsule.providerIdentity.parameterIdentityHash
    ) throw new Error("PV relation provider identity mismatch");
    const dependencies: MainWireScientificPvRelationsProtocolDependenciesV2 =
      Object.freeze({
        provider,
        runtime: capsule.runtime,
        pericardium: capsule.pericardium,
        calciumDriveParams: capsule.calciumDriveParams,
      });
    const sourceState = restoreMainWireFiveWallNonCoronaryV1(
      provider,
      capsule.transactionCheckpoint,
    );
    const options: MainWireScientificPvRelationsProtocolOptionsV2 =
      Object.freeze({
        onProgress: (progress) => {
          if (cancelledJobId === command.jobId) return;
          scope.postMessage(Object.freeze({
            protocolId:
              MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
            kind: "progress" as const,
            jobId: command.jobId,
            sourceFingerprint: command.sourceFingerprint,
            progress,
          }));
        },
        shouldCancel: () => cancelledJobId === command.jobId,
      });
    const result = runMainWireScientificPvRelationsProtocolV2(
      dependencies,
      sourceState,
      options,
    );
    if (cancelledJobId !== command.jobId) {
      scope.postMessage(Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
        kind: "complete" as const,
        jobId: command.jobId,
        sourceFingerprint: command.sourceFingerprint,
        result,
      }));
    }
  } catch (error) {
    if (cancelledJobId !== command.jobId) {
      postFailure(
        command,
        error instanceof Error ? error.message : String(error),
      );
    }
  } finally {
    activeJobId = null;
    cancelledJobId = null;
  }
};

function postFailure(
  command: Extract<MainWireScientificPvRelationWorkerCommandV1, {
    kind: "start";
  }>,
  message: string,
): void {
  scope.postMessage(Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
    kind: "worker-failure" as const,
    jobId: command.jobId,
    sourceFingerprint: command.sourceFingerprint,
    message,
  }));
}

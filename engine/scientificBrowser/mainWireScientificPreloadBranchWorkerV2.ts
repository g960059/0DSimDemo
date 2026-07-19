import {
  checkpointMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  settleMainWireScientificContinuationPreloadPointV2,
  type MainWireScientificHemodynamicProtocolDependenciesV1,
  type MainWireScientificProtocolAcceptedStateV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import {
  MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
  type MainWireScientificPreloadBranchWorkerCommandV2,
  type MainWireScientificPreloadBranchWorkerLaneV2,
  type MainWireScientificPreloadBranchWorkerMessageV2,
} from "@/engine/scientificBrowser/MainWireScientificPreloadBranchWorkerProtocolV2";

type BranchWorkerScopeV2 = Readonly<{
  postMessage: (message: MainWireScientificPreloadBranchWorkerMessageV2) => void;
}> & {
  onmessage: ((event: MessageEvent<MainWireScientificPreloadBranchWorkerCommandV2>) => void) | null;
};

type ActiveBranchV2 = {
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1;
  baselineState: MainWireScientificProtocolAcceptedStateV1;
  continuationState: MainWireScientificProtocolAcceptedStateV1;
  continuationScale: number;
};

const scope = globalThis as unknown as BranchWorkerScopeV2;
let active: ActiveBranchV2 | null = null;

scope.onmessage = (event): void => {
  const command = event.data;
  if (
    command.protocolId
      !== MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID
  ) return;
  try {
    if (command.kind === "initialize") {
      const capsule = command.baselineCapsule;
      if (capsule.capsuleId
          !== "main-wire-scientific-hemodynamic-job-capsule-v2") {
        throw new Error("preload branch capsule identity mismatch");
      }
      const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
      if (
        provider.providerId !== capsule.providerIdentity.providerId
        || provider.parameterSetId !== capsule.providerIdentity.parameterSetId
        || provider.parameterIdentityHash
          !== capsule.providerIdentity.parameterIdentityHash
      ) {
        throw new Error("preload branch provider identity mismatch");
      }
      const baselineState = restoreMainWireFiveWallNonCoronaryV1(
        provider,
        capsule.transactionCheckpoint,
      );
      active = {
        jobId: command.jobId,
        lane: command.lane,
        dependencies: Object.freeze({
          provider,
          runtime: capsule.runtime,
          pericardium: capsule.pericardium,
          calciumDriveParams: capsule.calciumDriveParams,
        }),
        baselineState,
        continuationState: baselineState,
        continuationScale: 1,
      };
      scope.postMessage(Object.freeze({
        protocolId:
          MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "ready" as const,
        jobId: command.jobId,
        lane: command.lane,
      }));
      return;
    }
    if (command.kind === "cancel") {
      if (active?.jobId === command.jobId) active = null;
      return;
    }
    const branch = active;
    if (
      branch === null
      || branch.jobId !== command.jobId
      || branch.lane !== command.lane
      || command.target.lane !== laneForPlanner(branch.lane)
    ) throw new Error("preload branch target does not match active job/lane");
    const audit = command.mode === "independent-audit";
    if (
      !audit
      && Math.abs(
        command.target.provenance.seedNormalizedTbv
          - branch.continuationScale,
      ) > 1e-9
    ) {
      throw new Error("preload branch continuation seed scale mismatch");
    }
    const settled = settleMainWireScientificContinuationPreloadPointV2(
      branch.dependencies,
      audit ? branch.baselineState : branch.continuationState,
      command.target.totalBloodVolumeMl,
      command.target.normalizedTbv,
    );
    const acceptedAsSeed = !audit
      && settled.continuationSeedState !== null;
    if (acceptedAsSeed) {
      branch.continuationState = settled.continuationSeedState!;
      branch.continuationScale = command.target.normalizedTbv;
    }
    scope.postMessage(Object.freeze({
      protocolId:
        MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
      kind: "target-result" as const,
      jobId: command.jobId,
      lane: command.lane,
      target: command.target,
      mode: command.mode,
      point: settled.point,
      continuationAcceptedAsSeed: acceptedAsSeed,
      terminalCheckpoint: settled.continuationSeedState === null
        ? null
        : checkpointMainWireFiveWallNonCoronaryV1(
          branch.dependencies.provider,
          settled.continuationSeedState,
        ),
    }));
  } catch (error) {
    scope.postMessage(Object.freeze({
      protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
      kind: "worker-failure" as const,
      jobId: event.data.jobId,
      lane: "lane" in event.data ? event.data.lane : active?.lane ?? null,
      message: error instanceof Error ? error.message : String(error),
    }));
  }
};

function laneForPlanner(
  lane: MainWireScientificPreloadBranchWorkerLaneV2,
): "negative" | "positive" {
  return lane === "lower-volume" ? "negative" : "positive";
}

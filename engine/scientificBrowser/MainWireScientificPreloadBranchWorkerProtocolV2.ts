import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type {
  MainWireScientificPreloadEnvelopeTargetV2,
} from "@/engine/scientific/protocols/MainWireScientificAdaptivePreloadEnvelopePlannerV2";
import type {
  MainWireScientificHemodynamicJobCapsuleV2,
  MainWireScientificPreloadSweepDirectionV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPreloadOperatingPointV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";

export const MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID =
  "main-wire-scientific-preload-branch-worker-protocol-v2" as const;

export type MainWireScientificPreloadBranchWorkerLaneV2 =
  Exclude<
    MainWireScientificPreloadSweepDirectionV2,
    "source-baseline" | "independent-audit"
  >;

export type MainWireScientificPreloadBranchWorkerInitializeV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "initialize";
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  baselineCapsule: MainWireScientificHemodynamicJobCapsuleV2;
}>;

export type MainWireScientificPreloadBranchWorkerSolveV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "solve-target";
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  target: MainWireScientificPreloadEnvelopeTargetV2;
  mode: "continuation" | "independent-audit";
}>;

export type MainWireScientificPreloadBranchWorkerCancelV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "cancel";
  jobId: string;
}>;

export type MainWireScientificPreloadBranchWorkerCommandV2 =
  | MainWireScientificPreloadBranchWorkerInitializeV2
  | MainWireScientificPreloadBranchWorkerSolveV2
  | MainWireScientificPreloadBranchWorkerCancelV2;

export type MainWireScientificPreloadBranchWorkerReadyV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "ready";
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
}>;

export type MainWireScientificPreloadBranchWorkerTargetResultV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "target-result";
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  target: MainWireScientificPreloadEnvelopeTargetV2;
  mode: "continuation" | "independent-audit";
  point: MainWireScientificPreloadOperatingPointV1;
  continuationAcceptedAsSeed: boolean;
  terminalCheckpoint: MainWireFiveWallNonCoronaryCheckpointV1 | null;
}>;

export type MainWireScientificPreloadBranchWorkerFailureV2 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID;
  kind: "worker-failure";
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2 | null;
  message: string;
}>;

export type MainWireScientificPreloadBranchWorkerMessageV2 =
  | MainWireScientificPreloadBranchWorkerReadyV2
  | MainWireScientificPreloadBranchWorkerTargetResultV2
  | MainWireScientificPreloadBranchWorkerFailureV2;

import type {
  MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationsProgressV3,
  MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

export const MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID =
  "main-wire-scientific-pv-relation-worker-protocol-v1" as const;

export type MainWireScientificPvRelationWorkerStartV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "start";
  jobId: string;
  sourceFingerprint: string;
  protocolCacheIdentity: string;
  capsule: MainWireScientificHemodynamicJobCapsuleV2;
}>;

export type MainWireScientificPvRelationWorkerCancelV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "cancel";
  jobId: string;
  sourceFingerprint: string;
  protocolCacheIdentity: string;
}>;

export type MainWireScientificPvRelationWorkerCommandV1 =
  | MainWireScientificPvRelationWorkerStartV1
  | MainWireScientificPvRelationWorkerCancelV1;

export type MainWireScientificPvRelationWorkerProgressV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "progress";
  jobId: string;
  sourceFingerprint: string;
  protocolCacheIdentity: string;
  progress: MainWireScientificPvRelationsProgressV3;
}>;

export type MainWireScientificPvRelationWorkerCompleteV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "complete";
  jobId: string;
  sourceFingerprint: string;
  protocolCacheIdentity: string;
  result: MainWireScientificPvRelationsProtocolResultV3;
}>;

export type MainWireScientificPvRelationWorkerFailureV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "worker-failure";
  jobId: string;
  sourceFingerprint: string;
  protocolCacheIdentity: string;
  message: string;
}>;

export type MainWireScientificPvRelationWorkerMessageV1 =
  | MainWireScientificPvRelationWorkerProgressV1
  | MainWireScientificPvRelationWorkerCompleteV1
  | MainWireScientificPvRelationWorkerFailureV1;

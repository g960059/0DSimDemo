import type {
  MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationsProgressV2,
  MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";

export const MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID =
  "main-wire-scientific-pv-relation-worker-protocol-v1" as const;

export type MainWireScientificPvRelationWorkerStartV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "start";
  jobId: string;
  sourceFingerprint: string;
  capsule: MainWireScientificHemodynamicJobCapsuleV2;
}>;

export type MainWireScientificPvRelationWorkerCancelV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "cancel";
  jobId: string;
  sourceFingerprint: string;
}>;

export type MainWireScientificPvRelationWorkerCommandV1 =
  | MainWireScientificPvRelationWorkerStartV1
  | MainWireScientificPvRelationWorkerCancelV1;

export type MainWireScientificPvRelationWorkerProgressV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "progress";
  jobId: string;
  sourceFingerprint: string;
  progress: MainWireScientificPvRelationsProgressV2;
}>;

export type MainWireScientificPvRelationWorkerCompleteV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "complete";
  jobId: string;
  sourceFingerprint: string;
  result: MainWireScientificPvRelationsProtocolResultV2;
}>;

export type MainWireScientificPvRelationWorkerFailureV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID;
  kind: "worker-failure";
  jobId: string;
  sourceFingerprint: string;
  message: string;
}>;

export type MainWireScientificPvRelationWorkerMessageV1 =
  | MainWireScientificPvRelationWorkerProgressV1
  | MainWireScientificPvRelationWorkerCompleteV1
  | MainWireScientificPvRelationWorkerFailureV1;

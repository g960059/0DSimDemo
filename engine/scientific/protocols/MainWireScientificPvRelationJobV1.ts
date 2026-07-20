import type {
  MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationBeatV2,
  MainWireScientificPvRelationsProgressV2,
  MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import type {
  MainWireScientificPvRelationsProgressV3,
  MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

export const MAIN_WIRE_SCIENTIFIC_PV_RELATION_JOB_V1_ID =
  "main-wire-scientific-pv-relation-job-v1" as const;

export type MainWireScientificPvRelationJobStatusV1 =
  | "running"
  | "complete"
  | "cancelled"
  | "error";

export type MainWireScientificPvRelationJobStageV1 =
  | "preload-reduction"
  | "lower-loading"
  | "higher-loading"
  | "complete"
  | "cancelled"
  | "error";

/**
 * Immutable polling snapshot for the dedicated fixed-TBV preload-reduction
 * protocol. Heavy transaction state remains inside the branch Worker.
 */
export type MainWireScientificPvRelationJobSnapshotV1 = Readonly<{
  jobId: string;
  sequence: number;
  status: MainWireScientificPvRelationJobStatusV1;
  stage: MainWireScientificPvRelationJobStageV1;
  source: MainWireScientificHemodynamicJobCapsuleV2["source"];
  sourceFingerprint: string;
  cacheStatus: "miss" | "hit";
  beats: readonly MainWireScientificPvRelationBeatV2[];
  progress: MainWireScientificPvRelationsProgressV2 | null;
  result: MainWireScientificPvRelationsProtocolResultV2 | null;
  /** Optional V3 research payload preserves the existing V2 UI snapshot ABI. */
  researchProtocolCacheIdentity?: string;
  researchProgressV3?: MainWireScientificPvRelationsProgressV3 | null;
  researchResultV3?: MainWireScientificPvRelationsProtocolResultV3 | null;
  errorMessage: string | null;
}>;

export type MainWireScientificPvRelationJobStartV1 = Readonly<{
  jobId: string;
  snapshot: MainWireScientificPvRelationJobSnapshotV1;
  suggestedPollIntervalMs: number;
}>;

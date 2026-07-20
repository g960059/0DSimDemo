import type {
  MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificPvRelationJobSnapshotV1,
  MainWireScientificPvRelationJobStartV1,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationJobV1";

export interface MainWireScientificPvRelationJobManagerV1 {
  start(input: Readonly<{
    ownerSessionId: string;
    capsule: MainWireScientificHemodynamicJobCapsuleV2;
  }>): Promise<MainWireScientificPvRelationJobStartV1>;

  poll(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
  }>): MainWireScientificPvRelationJobSnapshotV1;

  cancel(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
    reason: "host-request" | "source-invalidated" | "session-disposed";
  }>): MainWireScientificPvRelationJobSnapshotV1;

  disposeOwner(ownerSessionId: string): void;

  dispose(): void;
}

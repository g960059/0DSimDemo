import type {
  MainWireScientificHemodynamicCalculationDetailV2,
  MainWireScientificHemodynamicJobCapsuleV2,
  MainWireScientificHemodynamicJobSnapshotV2,
  MainWireScientificHemodynamicJobStartV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";

export interface MainWireScientificHemodynamicJobManagerV2 {
  start(input: Readonly<{
    ownerSessionId: string;
    capsule: MainWireScientificHemodynamicJobCapsuleV2;
    detailMode?: MainWireScientificHemodynamicCalculationDetailV2;
  }>): Promise<MainWireScientificHemodynamicJobStartV2>;

  poll(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
  }>): MainWireScientificHemodynamicJobSnapshotV2;

  cancel(input: Readonly<{
    ownerSessionId: string;
    jobId: string;
    reason: "host-request" | "source-invalidated" | "session-disposed";
  }>): MainWireScientificHemodynamicJobSnapshotV2;

  disposeOwner(ownerSessionId: string): void;

  dispose(): void;
}

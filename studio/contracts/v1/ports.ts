import type {
  StudioArtifactKindV1,
  StudioArtifactRefV1,
  StudioJsonValueV1,
  StudioJsonWriteV1,
} from "./artifacts";
import type {
  OpenSimulationSessionCommandV1,
  PromoteSteadyCandidateCommandV1,
  RuntimeCandidatePromotedV1,
  RuntimeLiveIntentResultV1,
  RuntimeSessionOpenedV1,
  RuntimeStrictIntentResultV1,
  RuntimeTargetIntentCommandV1,
} from "./runtime";

/**
 * Application-facing runtime seam. Implementations may be in-process, Worker,
 * or remote, but commands and results remain portable control-plane values.
 */
export interface SimulationRuntimePortV1 {
  openSession(
    command: OpenSimulationSessionCommandV1,
  ): Promise<RuntimeSessionOpenedV1>;

  /**
   * Atomically captures every targeted accepted source and starts both lanes
   * before returning. A conforming adapter must not advance either lane until
   * all source clones for this intent have been created.
   *
   * The returned Promises are adapter-local completion handles; command and
   * result payloads remain plain portable control-plane values.
   */
  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1;

  /**
   * Transactionally installs the candidate at presentationRevision. A
   * successful promotion must cancel or serialize any older live lane before
   * resolving; a rejected promotion leaves runtime state unchanged. A late
   * completion may still cross the transport boundary after success, so the
   * coordinator independently rejects every older presentation revision.
   */
  promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1>;

  closeSession(sessionId: string): Promise<void>;
}

export type RuntimeTargetIntentExecutionV1 = Readonly<{
  live: Promise<RuntimeLiveIntentResultV1>;
  strict: Promise<RuntimeStrictIntentResultV1>;
}>;

/**
 * Minimal combined JSON store used by the first vertical slice. The persisted
 * ref is the control-plane value; future binary SnapshotEnvelope adapters can
 * split this into index and blob ports without changing runtime coordination.
 */
export interface ArtifactStorePortV1 {
  putJson<TKind extends StudioArtifactKindV1>(
    write: StudioJsonWriteV1<TKind>,
  ): Promise<StudioArtifactRefV1<TKind>>;

  readJson(ref: StudioArtifactRefV1): Promise<StudioJsonValueV1>;

  has(ref: StudioArtifactRefV1): Promise<boolean>;
}

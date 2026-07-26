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
  RuntimeSignalChannelRefV1,
  RuntimeSignalEventV1,
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
   * Synchronously reserves every target and starts one asynchronous aggregate
   * preparation barrier. A conforming adapter must not advance either lane
   * until all source clones for this intent have been created.
   *
   * The returned Promises are adapter-local completion handles; command and
   * result payloads remain plain portable control-plane values. Expected
   * branch supersession/abort settles as a branch terminal result; aggregate
   * rejection is reserved for a transport/session-wide fatal failure.
   */
  startTargetIntent(
    command: RuntimeTargetIntentCommandV1,
  ): RuntimeTargetIntentExecutionV1;

  /**
   * Transactionally installs the candidate at presentationRevision. A
   * successful promotion must cancel or serialize any older live lane before
   * resolving; a rejected promotion leaves the accepted target, host, and
   * presentation identity unchanged (normally accepted old-live alignment
   * steps may already have streamed). A late completion may still cross the
   * transport boundary after success, so the coordinator independently
   * rejects every older presentation revision.
   */
  promoteSteadyCandidate(
    command: PromoteSteadyCandidateCommandV1,
  ): Promise<RuntimeCandidatePromotedV1>;

  /**
   * Adapter-local data-plane binding. Channel refs and batches are portable;
   * the callback/subscription convenience is not a wire-format contract.
   */
  subscribeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    observer: (event: RuntimeSignalEventV1) => void,
  ): RuntimeSignalSubscriptionV1;

  /**
   * Stops/starts numerical live advancement at an accepted command boundary.
   * Strict settlement is independent and continues while presentation is
   * suspended. Resume continues the same accepted state and stream epoch.
   */
  suspendSignalChannel(channel: RuntimeSignalChannelRefV1): Promise<void>;

  resumeSignalChannel(
    channel: RuntimeSignalChannelRefV1,
    expectedStreamEpoch: number,
  ): Promise<void>;

  /**
   * Cancels every live/strict lane owned by the session before resolving.
   * While this Promise is in flight the application exposes `closing` and
   * rejects new control intents. A rejection must leave the runtime usable so
   * the application can return to `live`.
   */
  closeSession(sessionId: string): Promise<void>;
}

export type RuntimeSignalSubscriptionV1 = Readonly<{
  unsubscribe(): void;
}>;

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

  /**
   * Validates and hashes every write before making any of them visible.
   * Cancellation is observed immediately before the synchronous commit.
   */
  putJsonBatch(
    writes: readonly StudioJsonWriteV1[],
    options?: Readonly<{ signal?: AbortSignal }>,
  ): Promise<readonly StudioArtifactRefV1[]>;

  readJson(ref: StudioArtifactRefV1): Promise<StudioJsonValueV1>;

  has(ref: StudioArtifactRefV1): Promise<boolean>;
}

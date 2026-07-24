import type {
  RunArtifactRefV1,
  RuntimeExecutionIdentityV1,
  SimulationInputRefV1,
  SnapshotEnvelopeRefV1,
} from "./artifacts";
import type {
  RuntimeBranchIdV1,
  RuntimeCandidateIdV1,
  RuntimeIntentIdV1,
  PresentationRevisionV1,
  ScenarioIdV1,
  Sha256HexV1,
  StudioSessionIdV1,
  TargetGenerationV1,
} from "./ids";

export type RuntimeControlValueV1 = boolean | number | string;

export type RuntimeControlPatchV1 = Readonly<{
  /**
   * Digest of the complete resolved target input. `values` is likewise the
   * complete resolved control map; partial UI edits must be merged before the
   * runtime command is issued so rapid supersession never depends on whether
   * an older target reached the accepted numerical branch.
   */
  targetInputSha256: Sha256HexV1;
  values: Readonly<Record<string, RuntimeControlValueV1>>;
}>;

export type RuntimeObservablePointV1 = Readonly<{
  sequence: number;
  simulationTimeSec: number;
  phase01: number | null;
  values: Readonly<Record<string, number>>;
}>;

export type RuntimeWindowMetricStateV1 =
  | Readonly<{
    status: "collecting";
    collectedPointCount: number;
    completedCycleCount: 0;
  }>
  | Readonly<{
    status: "complete";
    collectedPointCount: number;
    completedCycleCount: number;
    values: Readonly<Record<string, number>>;
  }>;

export type RuntimePresentationFrameV1 = Readonly<{
  point: RuntimeObservablePointV1;
  windowMetrics: RuntimeWindowMetricStateV1;
}>;

export type RuntimeSignalChannelRefV1 = Readonly<{
  protocolId: "circleheart-studio-runtime-signal-channel-v1";
  channelId: string;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
}>;

export type RuntimeSignalBatchV1 = Readonly<{
  kind: "samples";
  channelId: string;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  streamEpoch: number;
  points: readonly RuntimeObservablePointV1[];
  windowMetrics: RuntimeWindowMetricStateV1;
}>;

export type RuntimeSignalFailureV1 = Readonly<{
  kind: "failure";
  channelId: string;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  streamEpoch: number;
  message: string;
}>;

export type RuntimeSignalEventV1 =
  | RuntimeSignalBatchV1
  | RuntimeSignalFailureV1;

export type OpenScenarioRuntimeBranchV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  sourceRunRef: RunArtifactRefV1;
  sourceInputRef: SimulationInputRefV1;
  sourceSnapshotRef: SnapshotEnvelopeRefV1;
  initialTargetInputSha256: Sha256HexV1;
}>;

export type OpenSimulationSessionCommandV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  branches: readonly OpenScenarioRuntimeBranchV1[];
}>;

export type RuntimeScenarioBranchOpenedV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  sourceRunRef: RunArtifactRefV1;
  sourceInputRef: SimulationInputRefV1;
  sourceSnapshotRef: SnapshotEnvelopeRefV1;
  initialTargetInputSha256: Sha256HexV1;
  signalChannelRef: RuntimeSignalChannelRefV1;
  streamEpoch: number;
  execution: RuntimeExecutionIdentityV1;
  initialFrame: RuntimePresentationFrameV1;
}>;

export type RuntimeSessionOpenedV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  branches: readonly RuntimeScenarioBranchOpenedV1[];
}>;

/**
 * One user/system intent may target any explicit subset of scenario branches.
 * Each target carries its own complete resolved input identity because shared
 * absolute/delta/relative bindings can resolve differently per scenario.
 */
export type RuntimeControlIntentTargetV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  patch: RuntimeControlPatchV1;
}>;

export type RuntimeControlIntentV1 = Readonly<{
  intentId: RuntimeIntentIdV1;
  targets: readonly RuntimeControlIntentTargetV1[];
}>;

export type RuntimeTargetIntentBranchV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  patch: RuntimeControlPatchV1;
}>;

/**
 * Both foreground and strict lanes receive this exact immutable aggregate
 * command. The adapter can clone every targeted accepted state before either
 * lane advances, preserving session-level atomic intent.
 */
export type RuntimeTargetIntentCommandV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  intentId: RuntimeIntentIdV1;
  targets: readonly RuntimeTargetIntentBranchV1[];
}>;

export type RuntimeLiveTransitionResultV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  targetInputSha256: Sha256HexV1;
  streamEpoch: number;
  frame: RuntimePresentationFrameV1;
}>;

export type RuntimeIntentBranchFailureV1 = Readonly<{
  status: "failure";
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  targetInputSha256: Sha256HexV1;
  message: string;
}>;

/**
 * Expected lifecycle completion. Supersession and abort never reject the
 * aggregate lane Promise and are not user-visible runtime failures.
 */
export type RuntimeIntentBranchInterruptionV1 = Readonly<{
  status: "superseded" | "aborted";
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  targetInputSha256: Sha256HexV1;
  reason: string;
}>;

export type RuntimeLiveIntentBranchResultV1 =
  | Readonly<{
    status: "success";
    scenarioId: ScenarioIdV1;
    targetGeneration: TargetGenerationV1;
    result: RuntimeLiveTransitionResultV1;
  }>
  | RuntimeIntentBranchFailureV1
  | RuntimeIntentBranchInterruptionV1;

export type RuntimeLiveIntentResultV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  intentId: RuntimeIntentIdV1;
  branches: readonly RuntimeLiveIntentBranchResultV1[];
}>;

export type RuntimeSteadyCandidateV1 = Readonly<{
  candidateId: RuntimeCandidateIdV1;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  sourceRunRef: RunArtifactRefV1;
  simulationInputRef: SimulationInputRefV1;
  targetInputSha256: Sha256HexV1;
  snapshotRef: SnapshotEnvelopeRefV1;
  execution: RuntimeExecutionIdentityV1;
  steadyStatus: "converged";
  numericalHealth: "passed";
}>;

export type RuntimeStrictIntentResultV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  intentId: RuntimeIntentIdV1;
  branches: readonly RuntimeStrictIntentBranchResultV1[];
}>;

export type RuntimeStrictIntentBranchResultV1 =
  | Readonly<{
    status: "success";
    scenarioId: ScenarioIdV1;
    targetGeneration: TargetGenerationV1;
    candidate: RuntimeSteadyCandidateV1;
  }>
  | RuntimeIntentBranchFailureV1
  | RuntimeIntentBranchInterruptionV1;

export type PromoteSteadyCandidateCommandV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  /**
   * Newly reserved presentation revision. Promotion supersedes every live
   * completion issued for an earlier revision, including the same generation.
   */
  presentationRevision: PresentationRevisionV1;
  candidate: RuntimeSteadyCandidateV1;
}>;

export type RuntimeCandidatePromotedV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  candidateId: RuntimeCandidateIdV1;
  streamEpoch: number;
  /**
   * Projection of the candidate snapshot itself. It starts a new trace with
   * one point; no synthetic previous beat is returned.
   */
  initialFrame: RuntimePresentationFrameV1;
}>;

export type RuntimeDisplayOriginV1 =
  | Readonly<{
    kind: "opened-run";
    runRef: RunArtifactRefV1;
  }>
  | Readonly<{
    kind: "live-transition";
    targetGeneration: TargetGenerationV1;
  }>
  | Readonly<{
    kind: "promoted-steady-candidate";
    targetGeneration: TargetGenerationV1;
    candidateId: RuntimeCandidateIdV1;
  }>;

/**
 * Portable identity shared by coordinator-owned presentation events.
 *
 * Unlike the adapter signal channel, this stream contains only data that has
 * passed the coordinator's current generation, presentation revision, stream
 * epoch, continuity, and metric validation.
 */
export type RuntimePresentationEventIdentityV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  streamEpoch: number;
}>;

/**
 * Starts a new disposable trace with exactly one accepted point.
 *
 * A reset is emitted for an opened run, an accepted live target transition,
 * and a successful steady-candidate promotion.
 */
export type RuntimePresentationResetEventV1 =
  RuntimePresentationEventIdentityV1 & Readonly<{
    kind: "reset";
    origin: RuntimeDisplayOriginV1;
    frame: RuntimePresentationFrameV1;
  }>;

/**
 * Appends a coordinator-validated contiguous signal batch to the current
 * trace. `windowMetrics.collectedPointCount` is the total point count after
 * this append, not merely the size of this event.
 */
export type RuntimePresentationAppendEventV1 =
  RuntimePresentationEventIdentityV1 & Readonly<{
    kind: "append";
    points: readonly RuntimeObservablePointV1[];
    windowMetrics: RuntimeWindowMetricStateV1;
  }>;

export type RuntimePresentationEventV1 =
  | RuntimePresentationResetEventV1
  | RuntimePresentationAppendEventV1;

export type RuntimeDisplayWindowV1 = Readonly<{
  origin: RuntimeDisplayOriginV1;
  /**
   * The high-frequency trace belongs on a signal channel. This control-plane
   * view keeps only its exact first/latest projections and a growth count.
   */
  firstPoint: RuntimeObservablePointV1;
  latestPoint: RuntimeObservablePointV1;
  pointCount: number;
  windowMetrics: RuntimeWindowMetricStateV1;
}>;

export type RuntimeLaneFailureV1 = Readonly<{
  lane: "live" | "strict";
  intentId: RuntimeIntentIdV1;
  targetGeneration: TargetGenerationV1;
  message: string;
}>;

export type ScenarioRuntimeBranchStateV1 = Readonly<{
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  sourceRunRef: RunArtifactRefV1;
  sourceInputRef: SimulationInputRefV1;
  sourceSnapshotRef: SnapshotEnvelopeRefV1;
  signalChannelRef: RuntimeSignalChannelRefV1;
  streamEpoch: number;
  livePlayback: "running" | "suspended";
  execution: RuntimeExecutionIdentityV1;
  targetGeneration: TargetGenerationV1;
  /**
   * Monotonic branch-local display identity. Unlike targetGeneration, this
   * also advances when a same-generation steady candidate is promoted.
   */
  presentationRevision: PresentationRevisionV1;
  targetInputSha256: Sha256HexV1;
  display: RuntimeDisplayWindowV1;
  /**
   * Candidate availability is derived from generation equality. There is no
   * persistent stale/available state; old results are discarded.
   */
  latestSteadyCandidate: RuntimeSteadyCandidateV1 | null;
  pinnedRunRefs: readonly RunArtifactRefV1[];
  lastRuntimeFailure: RuntimeLaneFailureV1 | null;
}>;

/**
 * One Studio interaction owns N independently advancing scenario branches.
 * The array order is stable from open; scenarioId is the aggregate key.
 */
export type SimulationSessionStateV1 = Readonly<{
  status: "live" | "closing" | "closed";
  sessionId: StudioSessionIdV1;
  branches: readonly ScenarioRuntimeBranchStateV1[];
  lastAppliedIntentId: RuntimeIntentIdV1 | null;
}>;

export type AppliedRuntimeControlIntentV1 = Readonly<{
  intentId: RuntimeIntentIdV1;
  targetGenerations: readonly Readonly<{
    scenarioId: ScenarioIdV1;
    targetGeneration: TargetGenerationV1;
    presentationRevision: PresentationRevisionV1;
  }>[];
}>;

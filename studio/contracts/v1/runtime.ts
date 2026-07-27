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

export const RUNTIME_PRESENTATION_COVERAGE_V1 =
  "decimated-presentation" as const;
export const RUNTIME_PRESENTATION_DT_SEC_V1 = 0.002 as const;
export const RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1 = 1 as const;
export const RUNTIME_PRESENTATION_STEPS_PER_CYCLE_V1 =
  RUNTIME_PRESENTATION_CYCLE_LENGTH_SEC_V1
  / RUNTIME_PRESENTATION_DT_SEC_V1;
/**
 * Stage 1/2 contract value. A later change may increase this without changing
 * the accepted numerical step or exact replay/export grid.
 */
export const RUNTIME_PRESENTATION_OBSERVATION_STRIDE_V1 = 1 as const;

/**
 * Canonical presentation phase is indexed by the fixed accepted-step grid,
 * rather than by applying a narrow modulo tolerance to the accumulated
 * floating-point clock. The numerical state and exact export retain their
 * original accepted time; this function only identifies which accepted state
 * owns a presentation beat boundary.
 */
export function runtimePresentationCanonicalPhaseV1(
  acceptedRevision: number,
): number {
  assertRuntimePresentationRevisionV1(acceptedRevision);
  const phaseStep =
    acceptedRevision % RUNTIME_PRESENTATION_STEPS_PER_CYCLE_V1;
  return phaseStep * RUNTIME_PRESENTATION_DT_SEC_V1;
}

/**
 * Positive accepted-step distance to the next canonical phase-zero state.
 * A boundary state therefore reports one whole cycle, never zero.
 */
export function runtimePresentationStepsToNextCanonicalBoundaryV1(
  acceptedRevision: number,
): number {
  assertRuntimePresentationRevisionV1(acceptedRevision);
  const phaseStep =
    acceptedRevision % RUNTIME_PRESENTATION_STEPS_PER_CYCLE_V1;
  return phaseStep === 0
    ? RUNTIME_PRESENTATION_STEPS_PER_CYCLE_V1
    : RUNTIME_PRESENTATION_STEPS_PER_CYCLE_V1 - phaseStep;
}

export type RuntimePresentationSampleRetentionReasonV1 =
  | "stream-boundary"
  | "observation-stride"
  | "canonical-beat-boundary";

/**
 * Presentation-only accepted-state projection.
 *
 * The accepted revision/time identify the state that was observed; they do
 * not claim that intervening accepted states were retained. Coverage and the
 * declared step span keep this DTO structurally and semantically separate from
 * exact replay samples.
 */
export type RuntimePresentationSampleV1 = Readonly<{
  coverage: typeof RUNTIME_PRESENTATION_COVERAGE_V1;
  presentationOrdinal: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  acceptedStepSpanFromPrevious: number;
  phase: number;
  values: Readonly<Record<string, number>>;
  retentionReason: RuntimePresentationSampleRetentionReasonV1;
}>;

function assertRuntimePresentationRevisionV1(
  acceptedRevision: number,
): void {
  if (
    !Number.isSafeInteger(acceptedRevision)
    || acceptedRevision < 0
  ) {
    throw new Error("runtime presentation accepted revision is invalid");
  }
}

export type RuntimePresentationMetricEstimateValueV1 = Readonly<{
  metricId: string;
  value: number | null;
  availability:
    | "available"
    | "not-modeled"
    | "not-measurable"
    | "not-converged"
    | "not-evaluated-at-accepted-state";
  unavailableReason:
    | "dependency-unavailable"
    | "dependency-contract-invalid"
    | "invalid-derived-denominator"
    | "derived-value-non-finite"
    | null;
  unavailableDependency: string | null;
}>;

/**
 * Finalized over retained samples from one canonical phase-0 boundary to the
 * next. This is an estimate even while the Stage 1/2 stride is one: none of
 * the false evidence fields may be promoted merely because today's adapter
 * happened to retain every accepted step.
 */
export type RuntimePresentationBeatEstimateV1 = Readonly<{
  coverage: typeof RUNTIME_PRESENTATION_COVERAGE_V1;
  startPresentationOrdinal: number;
  endPresentationOrdinal: number;
  startAcceptedRevision: number;
  endAcceptedRevision: number;
  startAcceptedTimeSec: number;
  endAcceptedTimeSec: number;
  durationSec: number;
  retainedSampleCount: number;
  values: Readonly<Record<string, RuntimePresentationMetricEstimateValueV1>>;
  evidence: Readonly<{
    bothCanonicalBeatBoundariesRetained: true;
    transientBeatFullyMeasured: false;
    revisionsContiguous: false;
    cadenceUniform: false;
    exportEquivalent: false;
  }>;
}>;

export type RuntimePresentationMetricStateV1 =
  | Readonly<{
    status: "collecting";
    retainedSampleCount: number;
    completedBeatCount: 0;
    latestBeatEstimate: null;
  }>
  | Readonly<{
    status: "complete";
    retainedSampleCount: number;
    completedBeatCount: number;
    latestBeatEstimate: RuntimePresentationBeatEstimateV1;
  }>;

export type RuntimePresentationSnapshotV1 = Readonly<{
  sample: RuntimePresentationSampleV1;
  metricState: RuntimePresentationMetricStateV1;
}>;

export type RuntimePresentationSignalChannelRefV1 = Readonly<{
  protocolId: "circleheart-studio-runtime-signal-channel-v1";
  channelId: string;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
}>;

/**
 * `realtime-1x` is the declared presentation contract: one second of model
 * time per second of wall time, measured against a cumulative epoch deadline.
 * `degraded` means compute could not sustain that rate, the lane re-anchored
 * its epoch rather than failing, and wall/model time have separated by an
 * amount the runtime reports instead of hiding.
 */
export type RuntimeLivePacingModeV1 =
  | "realtime-1x"
  | "degraded";

export type RuntimeLivePacingStateV1 = Readonly<{
  mode: RuntimeLivePacingModeV1;
  /**
   * Lag against the current, possibly re-anchored, epoch deadline. A short
   * stall shows here and is repaid at 1x; it is not a mode change.
   */
  epochLagMs: number;
  /**
   * Recent achieved compute throughput as a dimensionless multiple of
   * realtime: accepted simulation duration over active compute duration across
   * the trailing window, or across all available accepted simulation when less
   * than one canonical cycle has been observed. This diagnostic window
   * survives pacing re-anchors within a stream epoch, so a lane too slow to
   * ever complete a clean cycle still reports how slow it is. Null only when
   * no finite rate is measurable, such as an empty window or zero observed
   * active-wall duration.
   *
   * Diagnostic only. It does not by itself prove recovery and never determines
   * `mode`: a degraded lane may report a rate at or above 1x while its clean
   * recovery window is still incomplete.
   */
  recentAchievedRate: number | null;
  /**
   * Total wall/model separation discarded by every re-anchor in this stream
   * epoch. Cumulative slowdown stays explicit; it is never silently absorbed.
   */
  cumulativeRebasedDeficitMs: number;
}>;

export const INITIAL_RUNTIME_LIVE_PACING_STATE_V1 = Object.freeze({
  mode: "realtime-1x" as const,
  epochLagMs: 0,
  recentAchievedRate: null,
  cumulativeRebasedDeficitMs: 0,
}) satisfies RuntimeLivePacingStateV1;

export type RuntimePresentationSampleBatchV1 = Readonly<{
  kind: "samples";
  channelId: string;
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  streamEpoch: number;
  samples: readonly RuntimePresentationSampleV1[];
  metricState: RuntimePresentationMetricStateV1;
  /**
   * Pacing is carried by the batch that caused it so the reported state is
   * atomic with the accepted chunk. A separate event kind would reintroduce
   * ordering and staleness questions the coordinator cannot resolve.
   */
  livePacing: RuntimeLivePacingStateV1;
}>;

export type RuntimePresentationSignalFailureV1 = Readonly<{
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

export type RuntimePresentationSignalEventV1 =
  | RuntimePresentationSampleBatchV1
  | RuntimePresentationSignalFailureV1;

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
  presentationSignalChannelRef: RuntimePresentationSignalChannelRefV1;
  streamEpoch: number;
  execution: RuntimeExecutionIdentityV1;
  initialPresentation: RuntimePresentationSnapshotV1;
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
  initialPresentation: RuntimePresentationSnapshotV1;
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
   * one presentation sample; no synthetic previous beat is returned.
   */
  initialPresentation: RuntimePresentationSnapshotV1;
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
 * Starts a new disposable trace with exactly one presentation sample.
 *
 * A reset is emitted for an opened run, an accepted live target transition,
 * and a successful steady-candidate promotion.
 */
export type RuntimePresentationResetEventV1 =
  RuntimePresentationEventIdentityV1 & Readonly<{
    kind: "reset";
    origin: RuntimeDisplayOriginV1;
    presentation: RuntimePresentationSnapshotV1;
  }>;

/**
 * Appends coordinator-validated presentation samples to the current trace.
 * `metricState.retainedSampleCount` is the total retained sample count after
 * this append, not merely the size of this event.
 */
export type RuntimePresentationAppendEventV1 =
  RuntimePresentationEventIdentityV1 & Readonly<{
    kind: "append";
    samples: readonly RuntimePresentationSampleV1[];
    metricState: RuntimePresentationMetricStateV1;
  }>;

export type RuntimePresentationEventV1 =
  | RuntimePresentationResetEventV1
  | RuntimePresentationAppendEventV1;

export type RuntimeDisplayWindowV1 = Readonly<{
  origin: RuntimeDisplayOriginV1;
  /**
   * The high-frequency trace belongs on a signal channel. This control-plane
   * view keeps only its first/latest presentation samples and a growth count.
   */
  firstSample: RuntimePresentationSampleV1;
  latestSample: RuntimePresentationSampleV1;
  retainedSampleCount: number;
  metricState: RuntimePresentationMetricStateV1;
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
  presentationSignalChannelRef: RuntimePresentationSignalChannelRefV1;
  streamEpoch: number;
  livePlayback: "running" | "suspended";
  /**
   * Degraded pacing is a reported status, not a failure. `livePlayback`
   * remains "running" and `lastRuntimeFailure` stays null while it is set.
   */
  livePacing: RuntimeLivePacingStateV1;
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

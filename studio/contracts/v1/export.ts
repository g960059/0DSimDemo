import type {
  ExactSignalExportArtifactRefV1,
  RunArtifactRefV1,
  RuntimeExecutionIdentityV1,
  SimulationInputRefV1,
  SnapshotEnvelopeRefV1,
} from "./artifacts";
import type {
  PresentationRevisionV1,
  RuntimeBranchIdV1,
  RuntimeCandidateIdV1,
  ScenarioIdV1,
  Sha256HexV1,
  StudioSessionIdV1,
  TargetGenerationV1,
} from "./ids";

export const EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID =
  "circleheart-exact-signal-export-content-v1" as const;
export const EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID =
  "circleheart-exact-signal-export-manifest-v1" as const;
export const EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE =
  "application/vnd.circleheart.exact-signal-export.v1+json" as const;
export const EXACT_SIGNAL_REPLAY_COVERAGE_V1 =
  "exact-signal-replay-v1" as const;

export type RuntimeReplayOriginV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  sourceRunRef: RunArtifactRefV1;
  simulationInputRef: SimulationInputRefV1;
  targetInputSha256: Sha256HexV1;
  execution: RuntimeExecutionIdentityV1;
  boundaryRevision: number;
  boundaryTimeSec: number;
}> & (
  | Readonly<{
    kind: "opened-run";
    sourceSnapshotRef: SnapshotEnvelopeRefV1;
  }>
  | Readonly<{
    kind: "live-transition";
    replayCheckpointRef: SnapshotEnvelopeRefV1;
  }>
  | Readonly<{
    kind: "promoted-steady-candidate";
    candidateId: RuntimeCandidateIdV1;
    promotedSnapshotRef: SnapshotEnvelopeRefV1;
  }>
);

export type ExactSignalExportCommandV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  /**
   * Both values are measured from the retained replay origin. The MainWire
   * adapter admits only values on its exact 0.002-second integration grid.
   */
  intervalStartOffsetSec: number;
  intervalDurationSec: number;
}>;

export type ExactSignalObservableAvailabilityV1 =
  | "available"
  | "not-modeled"
  | "not-measurable"
  | "not-converged"
  | "not-evaluated-at-accepted-state";

export type ExactSignalObservableQualityV1 =
  | "authoritative-state"
  | "accepted-derived"
  | "solver-diagnostic"
  | "not-assessed";

export type ExactSignalObservableValueV1 = Readonly<{
  observableId: string;
  value: number | null;
  availability: ExactSignalObservableAvailabilityV1;
  quality: ExactSignalObservableQualityV1;
}>;

/**
 * `coverage` is intentionally required and exact-only. A presentation point,
 * which carries no such proof, is structurally ineligible for an evaluator
 * accepting this sample type.
 */
export type ExactSignalSampleV1 = Readonly<{
  coverage: typeof EXACT_SIGNAL_REPLAY_COVERAGE_V1;
  provenance: "checkpoint-boundary" | "accepted-step";
  revision: number;
  simulationTimeSec: number;
  phase01: number;
  values: Readonly<Record<string, ExactSignalObservableValueV1>>;
}>;

export type ExactSignalExportCoverageV1 = Readonly<{
  kind: typeof EXACT_SIGNAL_REPLAY_COVERAGE_V1;
  dtSec: 0.002;
  observationStride: 1;
  intervalCount: number;
  sampleCount: number;
}>;

export type ExactSignalExportManifestDraftV1 = Readonly<{
  schemaId: typeof EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID;
  schemaVersion: 1;
  origin: RuntimeReplayOriginV1;
  intervalStartOffsetSec: number;
  intervalDurationSec: number;
  coverage: ExactSignalExportCoverageV1;
  claims: Readonly<{
    onDemandResimulation: true;
    fastForwardIntermediateObservationsRetained: false;
    restoredBoundaryProvenance: "checkpoint-boundary";
    acceptedStepRevisionAndTimeContinuityValidated: true;
    smoothingOrInterpolationApplied: false;
    presentationSamplesConsumed: false;
    liveRuntimeBranchMutated: false;
  }>;
}>;

export type ExactSignalExportManifestV1 =
  ExactSignalExportManifestDraftV1 & Readonly<{
    firstRevision: number;
    finalRevision: number;
    firstSimulationTimeSec: number;
    finalSimulationTimeSec: number;
    checkpointBoundarySampleCount: 0 | 1;
    acceptedStepSampleCount: number;
    dataSha256: Sha256HexV1;
    dataByteLength: number;
  }>;

export type ExactSignalExportContentV1 = Readonly<{
  schemaId: typeof EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  manifest: ExactSignalExportManifestV1;
  samples: readonly ExactSignalSampleV1[];
}>;

export type ExactSignalExportWriteV1 = Readonly<{
  manifest: ExactSignalExportManifestDraftV1;
  samples: AsyncIterable<ExactSignalSampleV1>;
}>;

export type ExactSignalExportResultV1 = Readonly<{
  artifactRef: ExactSignalExportArtifactRefV1;
  manifest: ExactSignalExportManifestV1;
}>;

/**
 * Exact replay is a control-plane job, not a sampling mode on the live
 * presentation subscription.
 */
export interface ExactSignalExportPortV1 {
  exportExactSignals(
    command: ExactSignalExportCommandV1,
  ): Promise<ExactSignalExportResultV1>;
}

/**
 * The replay worker yields samples incrementally. A writer may spool them to
 * disk, remote storage, or a bounded in-memory CAS without changing replay.
 */
export interface ExactSignalExportWriterPortV1 {
  writeExactSignalExport(
    write: ExactSignalExportWriteV1,
  ): Promise<ExactSignalExportResultV1>;
}

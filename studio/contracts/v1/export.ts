import type {
  ExactSignalExportArtifactRefV1,
  RuntimeExecutionIdentityV1,
  SimulationInputRefV1,
  SnapshotEnvelopeRefV1,
} from "./artifacts";
import type {
  PresentationRevisionV1,
  RuntimeBranchIdV1,
  ScenarioIdV1,
  Sha256HexV1,
  StudioSessionIdV1,
  TargetGenerationV1,
} from "./ids";

export const EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID =
  "circleheart-exact-signal-export-content-v1" as const;
export const EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID =
  "circleheart-exact-signal-export-manifest-v1" as const;
export const EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID =
  "circleheart-exact-signal-replay-recipe-v1" as const;
export const EXACT_SIGNAL_EXPORT_V1_MEDIA_TYPE =
  "application/vnd.circleheart.exact-signal-export.v1+json" as const;
export const EXACT_SIGNAL_REPLAY_COVERAGE_V1 =
  "exact-signal-replay-v1" as const;
export const EXACT_SIGNAL_DETERMINISM_SCOPE_V1 =
  "same-recipe-same-build-v1" as const;

/**
 * Audited MainWire export limits. Admission also checks revision arithmetic,
 * the exact request count implied by the command, and encoded output bytes.
 */
export const EXACT_SIGNAL_EXPORT_LIMITS_V1 = Object.freeze({
  maximumStartOffsetStepCount: 50_000,
  maximumSampleCount: 10_001,
  maximumOutputByteLength: 64 * 1_024 * 1_024,
  maximumWorkerRequestCount: 4_096,
  maximumConcurrentExportCount: 1,
} as const);

export type ExactSignalExportCommandV1 = Readonly<{
  sessionId: StudioSessionIdV1;
  scenarioId: ScenarioIdV1;
  liveBranchId: RuntimeBranchIdV1;
  targetGeneration: TargetGenerationV1;
  presentationRevision: PresentationRevisionV1;
  /**
   * Both values are measured from a retained, content-addressed replay origin.
   * The MainWire adapter admits only bounded values on its exact 0.002-second
   * integration grid.
   */
  intervalStartOffsetSec: number;
  intervalDurationSec: number;
}>;

export type ExactSignalExportOptionsV1 = Readonly<{
  signal?: AbortSignal;
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

declare const EXACT_SIGNAL_SAMPLE_V1_VERIFIED: unique symbol;

/**
 * A sample returned by the strict exact-export loader. The private nominal
 * member prevents a structurally similar presentation or caller-authored value
 * from satisfying this type. Persisted JSON remains untrusted until loaded.
 */
export type ExactSignalSampleV1 = Readonly<{
  coverage: typeof EXACT_SIGNAL_REPLAY_COVERAGE_V1;
  provenance: "checkpoint-boundary" | "accepted-step";
  revision: number;
  simulationTimeSec: number;
  phase01: number;
  values: Readonly<Record<string, ExactSignalObservableValueV1>>;
  readonly [EXACT_SIGNAL_SAMPLE_V1_VERIFIED]: true;
}>;

export type ExactSignalExportCoverageV1 = Readonly<{
  kind: typeof EXACT_SIGNAL_REPLAY_COVERAGE_V1;
  dtSec: 0.002;
  observationStride: 1;
  intervalCount: number;
  sampleCount: number;
}>;

/**
 * Stable scientific replay identity. Studio correlation and lineage fields
 * are deliberately absent so two sessions replaying this same recipe on the
 * same build produce the same export bytes.
 */
export type ExactSignalReplayRecipeV1 = Readonly<{
  schemaId: typeof EXACT_SIGNAL_REPLAY_RECIPE_V1_SCHEMA_ID;
  schemaVersion: 1;
  simulationInputRef: SimulationInputRefV1;
  replayCheckpointRef: SnapshotEnvelopeRefV1;
  targetInputSha256: Sha256HexV1;
  execution: RuntimeExecutionIdentityV1;
  boundaryRevision: number;
  boundaryTimeSec: number;
  cycleLengthSec: number;
}>;

declare const EXACT_SIGNAL_MANIFEST_V1_VERIFIED: unique symbol;

/**
 * A manifest returned by the adapter or strict persisted-content loader.
 *
 * `same-recipe-same-build-v1` is intentionally narrower than durable,
 * cross-process or cross-build reproducibility. Runtime, solver, codec and
 * protocol refs currently identify the running build; they are not claimed to
 * be independent content hashes of every implementation module.
 */
export type ExactSignalExportManifestV1 = Readonly<{
  schemaId: typeof EXACT_SIGNAL_EXPORT_MANIFEST_V1_SCHEMA_ID;
  schemaVersion: 1;
  recipe: ExactSignalReplayRecipeV1;
  recipeSha256: Sha256HexV1;
  determinismScope: typeof EXACT_SIGNAL_DETERMINISM_SCOPE_V1;
  intervalStartOffsetSec: number;
  intervalDurationSec: number;
  coverage: ExactSignalExportCoverageV1;
  claims: Readonly<{
    onDemandResimulation: true;
    verifiedReplayCapabilityConsumed: true;
    fastForwardIntermediateObservationsRetained: false;
    restoredBoundaryProvenance: "checkpoint-boundary";
    acceptedStepRevisionAndTimeContinuityValidated: true;
    smoothingOrInterpolationApplied: false;
    presentationSamplesConsumed: false;
    liveRuntimeBranchMutated: false;
    sameRecipeSameBuildSampleDeterminism: true;
    durableReplayLedgerAvailable: false;
    crossBuildDeterminismClaimed: false;
  }>;
  firstRevision: number;
  finalRevision: number;
  firstSimulationTimeSec: number;
  finalSimulationTimeSec: number;
  checkpointBoundarySampleCount: 0 | 1;
  acceptedStepSampleCount: number;
  dataSha256: Sha256HexV1;
  dataByteLength: number;
  readonly [EXACT_SIGNAL_MANIFEST_V1_VERIFIED]: true;
}>;

declare const EXACT_SIGNAL_CONTENT_V1_VERIFIED: unique symbol;

/**
 * Strictly loaded content. The JSON stored under the artifact ref is an
 * untrusted DTO and does not acquire this type through structural assignment.
 */
export type ExactSignalExportContentV1 = Readonly<{
  schemaId: typeof EXACT_SIGNAL_EXPORT_CONTENT_V1_SCHEMA_ID;
  schemaVersion: 1;
  manifest: ExactSignalExportManifestV1;
  samples: readonly ExactSignalSampleV1[];
  readonly [EXACT_SIGNAL_CONTENT_V1_VERIFIED]: true;
}>;

export type ExactSignalExportResultV1 = Readonly<{
  artifactRef: ExactSignalExportArtifactRefV1;
  manifest: ExactSignalExportManifestV1;
}>;

/**
 * Exact replay is a bounded, cancellable control-plane job, not a sampling
 * mode on the live presentation subscription.
 */
export interface ExactSignalExportPortV1 {
  exportExactSignals(
    command: ExactSignalExportCommandV1,
    options?: ExactSignalExportOptionsV1,
  ): Promise<ExactSignalExportResultV1>;
}

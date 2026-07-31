import type {
  ExperimentContentV2,
  ExperimentSnapshotV2,
  ExperimentSurfaceV2,
  ExperimentWorkspaceV2,
} from "./content";
import type {
  ExperimentDraftVersionV2,
  ExperimentIdV2,
  ExperimentSnapshotIdV2,
  ModelIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";
import type {
  ModelContractV2,
} from "./model";

export type CreateExperimentWorkspaceCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  content: ExperimentContentV2;
}>;

export type ForkExperimentWorkspaceCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  sourceSnapshotId: ExperimentSnapshotIdV2;
}>;

/**
 * Ephemeral authored Save intent. It deliberately cannot represent a
 * ScenarioCapture: edited fixtures have no checkpoint until the exact model
 * runtime captures one at an accepted boundary.
 */
export type ExperimentDesiredScenarioV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  label: string;
  fixture: StudioJsonValueV2;
}>;

export type ExperimentDesiredContentV2 = Readonly<{
  modelId: ModelIdV2;
  scenarios: readonly ExperimentDesiredScenarioV2[];
  surface: ExperimentSurfaceV2;
}>;

/**
 * The command carries checkpoint-free desired authored content. The
 * application freezes and validates it, then asks the exact registered model
 * runtime to construct complete accepted-boundary captures. Settlement is
 * deliberately not required.
 */
export type SaveExperimentDraftCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  expectedDraftVersion: ExperimentDraftVersionV2;
  desiredContent: ExperimentDesiredContentV2;
  captureCorrelation: ExperimentDraftCaptureCorrelationV2;
}>;

export type ExperimentScenarioCaptureCorrelationV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  expectedInputEpoch: number;
}>;

/** Runtime-only correlation. It is confirmed by capture and never persisted. */
export type ExperimentDraftCaptureCorrelationV2 = Readonly<{
  runtimeSessionId: string;
  scenarios: readonly ExperimentScenarioCaptureCorrelationV2[];
}>;

export type ExperimentDraftCaptureConfirmationV2 = Readonly<{
  experimentId: ExperimentIdV2;
  runtimeSessionId: string;
  scenarios: readonly ExperimentScenarioCaptureCorrelationV2[];
}>;

export type ExperimentDraftCaptureResultV2 = Readonly<{
  content: ExperimentContentV2;
  confirmation: ExperimentDraftCaptureConfirmationV2;
}>;

/**
 * Explicitly rebases one saved Draft onto another immutable Snapshot. The
 * caller supplies already conflict-resolved complete content; no inheritance
 * or automatic merge occurs.
 */
export type RebaseExperimentDraftCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  expectedDraftVersion: ExperimentDraftVersionV2;
  expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
  targetSnapshotId: ExperimentSnapshotIdV2;
  content: ExperimentContentV2;
}>;

export type CreateExperimentSnapshotCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  expectedDraftVersion: ExperimentDraftVersionV2;
  expectedHeadSnapshotId: ExperimentSnapshotIdV2 | null;
  createdBy?: string;
}>;

/**
 * Ephemeral result of settling and checking one frozen candidate.
 *
 * A passed result may replace checkpoints with freshly settled captures but
 * must preserve modelId, scenario identity/fixture, and Surface. Neither
 * branch of this union is persisted in an ExperimentSnapshot.
 */
export type ExperimentSnapshotGateResultV2 =
  | Readonly<{
    status: "passed";
    qualifiedContent: ExperimentContentV2;
  }>
  | Readonly<{
    status: "rejected";
    reason: string;
  }>;

export interface ExperimentSnapshotGatePortV2 {
  qualifyFrozenCandidate(
    input: Readonly<{
      model: ModelContractV2;
      content: ExperimentContentV2;
    }>,
  ): Promise<ExperimentSnapshotGateResultV2>;
}

/**
 * Model-owned accepted-boundary capture seam used by explicit Draft Save.
 *
 * It constructs complete captures from checkpoint-free desired content.
 * Fixture, scenario identity/order/label, Surface, and modelId must remain
 * identical to the frozen desired candidate.
 */
export interface ExperimentDraftCapturePortV2 {
  captureAcceptedCandidate(
    input: Readonly<{
      experimentId: ExperimentIdV2;
      model: ModelContractV2;
      desiredContent: ExperimentDesiredContentV2;
      correlation: ExperimentDraftCaptureCorrelationV2;
    }>,
  ): Promise<ExperimentDraftCaptureResultV2>;
}

/**
 * Public read façade. Reads await exact capture validation; Snapshot write
 * capabilities are deliberately absent.
 */
export interface ExperimentQueryPortV2 {
  readWorkspace(
    experimentId: ExperimentIdV2,
  ): Promise<ExperimentWorkspaceV2 | null>;
  readSnapshot(
    snapshotId: ExperimentSnapshotIdV2,
  ): Promise<ExperimentSnapshotV2 | null>;
}

export interface ExperimentSnapshotIdFactoryPortV2 {
  nextSnapshotId(): ExperimentSnapshotIdV2;
}

export interface StudioClockPortV2 {
  nowIso(): string;
}

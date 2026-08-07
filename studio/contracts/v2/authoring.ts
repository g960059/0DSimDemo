import type {
  ExperimentContentV2,
  ExperimentPlacementBriefingV2,
  ExperimentSnapshotV2,
  ExperimentSurfaceV2,
  ExperimentV2,
} from "./content";
import type {
  ExperimentIdV2,
  ExperimentSnapshotIdV2,
  ExperimentVersionV2,
  ModelIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";
import type {
  ModelContractV2,
} from "./model";

export type CreateExperimentCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  content: ExperimentContentV2;
}>;

export type ForkExperimentCommandV2 = Readonly<{
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
 * The command carries checkpoint-free desired authored content. When any
 * Scenario fixture changed, `captureCorrelation` binds Save to fresh
 * accepted-boundary captures from the exact registered model runtime. A
 * Surface/label/order-only Save may omit it and reuse the matching persisted
 * checkpoints. Settlement is deliberately not required.
 */
export type SaveExperimentCommandV2 = Readonly<{
  experimentId: ExperimentIdV2;
  expectedVersion: ExperimentVersionV2;
  desiredContent: ExperimentDesiredContentV2;
  captureCorrelation?: ExperimentCaptureCorrelationV2;
}>;

export type ExperimentScenarioCaptureCorrelationV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  expectedInputEpoch: number;
}>;

/** Runtime-only correlation. It is confirmed by capture and never persisted. */
export type ExperimentCaptureCorrelationV2 = Readonly<{
  runtimeSessionId: string;
  scenarios: readonly ExperimentScenarioCaptureCorrelationV2[];
}>;

export type ExperimentCaptureConfirmationV2 = Readonly<{
  experimentId: ExperimentIdV2;
  runtimeSessionId: string;
  scenarios: readonly ExperimentScenarioCaptureCorrelationV2[];
}>;

export type ExperimentCaptureResultV2 = Readonly<{
  content: ExperimentContentV2;
  confirmation: ExperimentCaptureConfirmationV2;
}>;

export type CreateExperimentSnapshotCommandV2 =
  Readonly<{
    /** Complete frozen candidate captured from an Experiment Session. */
    content: ExperimentContentV2;
    /**
     * Present only when the workflow requires a clean, explicitly saved
     * Experiment head (currently standalone Publication). It constrains the
     * command, not the resulting neutral Snapshot identity.
     */
    savedExperiment?: Readonly<{
      experimentId: ExperimentIdV2;
      expectedVersion: ExperimentVersionV2;
    }>;
    createdBy?: string;
  }>;

/**
 * Ephemeral result of applying the common Studio public-executable admission
 * service to one frozen candidate. A legacy exact-model gate may serve as the
 * adapter for historical packages. Admission verifies the candidate on a fork;
 * it cannot replace or otherwise mutate the captured content.
 */
export type ExperimentSnapshotAdmissionResultV2 =
  | Readonly<{
    status: "passed";
  }>
  | Readonly<{
    status: "rejected";
    reason: string;
  }>;

export interface ExperimentSnapshotAdmissionPortV2 {
  admitFrozenCandidate(
    input: Readonly<{
      model: ModelContractV2;
      content: ExperimentContentV2;
    }>,
  ): Promise<ExperimentSnapshotAdmissionResultV2>;
}

/**
 * Model-owned accepted-boundary capture seam used by explicit Experiment Save.
 *
 * It constructs complete captures from checkpoint-free desired content.
 * Fixture, scenario identity/order/label, Surface, and modelId must remain
 * identical to the frozen desired candidate.
 */
export interface ExperimentCapturePortV2 {
  captureAcceptedCandidate(
    input: Readonly<{
      experimentId: ExperimentIdV2;
      model: ModelContractV2;
      desiredContent: ExperimentDesiredContentV2;
      correlation: ExperimentCaptureCorrelationV2;
    }>,
  ): Promise<ExperimentCaptureResultV2>;
}

/**
 * Public read façade. Reads await exact capture validation; Snapshot write
 * capabilities are deliberately absent.
 */
export interface ExperimentQueryPortV2 {
  readExperiment(
    experimentId: ExperimentIdV2,
  ): Promise<ExperimentV2 | null>;
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

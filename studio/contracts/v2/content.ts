import type {
  ExperimentDraftVersionV2,
  ExperimentIdV2,
  ExperimentPlacementIdV2,
  ExperimentSnapshotIdV2,
  ModelIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";

export const STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID =
  "circleheart-studio-experiment-workspace-v2" as const;
export const STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID =
  "circleheart-studio-experiment-snapshot-v2" as const;
export const STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID =
  "circleheart-studio-experiment-placement-v2" as const;
export const STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID =
  "circleheart-studio-scenario-preset-v2" as const;
export const STUDIO_SWEEP_WINDOW_DEFAULT_SEC_V2 = 2;
export const STUDIO_SWEEP_WINDOW_MIN_SEC_V2 = 1;
export const STUDIO_SWEEP_WINDOW_MAX_SEC_V2 = 6;
export const STUDIO_SWEEP_WINDOW_STEP_SEC_V2 = 0.5;

export type SurfacePaneIdV2 = string;
export type ScenarioPresetIdV2 = string;

/**
 * The model-owned fixture and its exact checkpoint are captured together.
 *
 * Studio deliberately does not interpret either opaque JSON value. A model
 * adapter is responsible for validating the fixture and checkpoint payload
 * against `modelId` before executing them. The registered model already pins
 * the checkpoint codec, so content does not repeat a second codec identity.
 */
export type ScenarioCheckpointV2 = Readonly<{
  acceptedRevision: number;
  acceptedTimeSec: number;
  payload: StudioJsonValueV2;
}>;

export type ScenarioCaptureV2 = Readonly<{
  fixture: StudioJsonValueV2;
  checkpoint: ScenarioCheckpointV2;
}>;

export type ExperimentScenarioV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  label: string;
  capture: ScenarioCaptureV2;
}>;

/**
 * One reusable, named input/state object.
 *
 * Applying a preset copies `capture`; it never creates a live link and makes no
 * qualification, certification, or publication claim.
 */
export type ScenarioPresetV2 = Readonly<{
  schemaId: typeof STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID;
  presetId: ScenarioPresetIdV2;
  modelId: ModelIdV2;
  title: string;
  description: string;
  capture: ScenarioCaptureV2;
}>;

export type ExperimentSurfaceGraphSeriesV2 = Readonly<{
  outputId: string;
  label: string;
  colorHex: string;
  order: number;
}>;

export type ExperimentSurfaceGraphPaneV2 = Readonly<{
  paneId: SurfacePaneIdV2;
  role: "graph";
  label: string;
  colorHex: string;
  order: number;
  priority: number;
  graphId: string;
  /**
   * Durable author-selected sweep extent in model seconds. Required only when
   * the registered graph renderer is `sweep`; structural renderers must omit
   * it because they do not own a time window.
   */
  windowSec?: number;
  /**
   * Sweep graphs select scalar outputs with one shared registered unit here.
   * Structural renderers own their registered axes/analysis contract and
   * therefore require an empty series.
   */
  series: readonly ExperimentSurfaceGraphSeriesV2[];
}>;

export type ExperimentSurfaceOutputItemV2 = Readonly<{
  outputId: string;
  label: string;
  colorHex: string;
  order: number;
}>;

export type ExperimentSurfaceOutputPaneV2 = Readonly<{
  paneId: SurfacePaneIdV2;
  role: "output";
  label: string;
  order: number;
  priority: number;
  items: readonly ExperimentSurfaceOutputItemV2[];
}>;

export type ExperimentSurfaceControlItemV2 = Readonly<{
  controlId: string;
  label: string;
  colorHex: string;
  /**
   * Explicit durable binding. A control never relies on an implicit
   * "currently active" Scenario when an Experiment contains comparisons.
   */
  targetScenarioIds: readonly ScenarioIdV2[];
  order: number;
}>;

export type ExperimentSurfaceControlPaneV2 = Readonly<{
  paneId: SurfacePaneIdV2;
  role: "control";
  label: string;
  order: number;
  priority: number;
  items: readonly ExperimentSurfaceControlItemV2[];
}>;

/** One Experiment-owned, Markdown-compatible note. */
export type ExperimentSurfaceNoteV2 = Readonly<{
  text: string;
}>;

/**
 * Durable semantic pane composition only. Screen extent, Dockview geometry,
 * fullscreen state, active focus, and renderer layout remain derived UI state.
 */
export type ExperimentSurfaceV2 = Readonly<{
  graphPanes: readonly ExperimentSurfaceGraphPaneV2[];
  outputPanes: readonly ExperimentSurfaceOutputPaneV2[];
  controlPanes: readonly ExperimentSurfaceControlPaneV2[];
  note: ExperimentSurfaceNoteV2;
}>;

export type ExperimentContentV2 = Readonly<{
  modelId: ModelIdV2;
  scenarios: readonly ExperimentScenarioV2[];
  surface: ExperimentSurfaceV2;
}>;

/**
 * Mutable authoring workspace. `draftVersion` is only an optimistic concurrency
 * token; immutable identity is always an opaque `snapshotId`.
 */
export type ExperimentWorkspaceV2 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID;
  experimentId: ExperimentIdV2;
  draftVersion: ExperimentDraftVersionV2;
  headSnapshotId: ExperimentSnapshotIdV2 | null;
  basedOnSnapshotId: ExperimentSnapshotIdV2 | null;
  content: ExperimentContentV2;
}>;

export type ExperimentSnapshotV2 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID;
  snapshotId: ExperimentSnapshotIdV2;
  experimentId: ExperimentIdV2;
  parentSnapshotId: ExperimentSnapshotIdV2 | null;
  content: ExperimentContentV2;
  createdAt: string;
  createdBy?: string;
}>;

export type ExperimentPlacementPanePickV2 = Readonly<{
  paneId: SurfacePaneIdV2;
  /** Larger values are rendered more prominently. */
  priority: number;
}>;

/**
 * Inline article projection of a pinned Surface. Omission means every Scenario
 * and pane. A present briefing may explicitly select no panes.
 */
export type ExperimentPlacementBriefingV2 = Readonly<{
  scenarioIds?: readonly ScenarioIdV2[];
  panePicks: readonly ExperimentPlacementPanePickV2[];
}>;

export type ExperimentPlacementV2 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID;
  placementId: ExperimentPlacementIdV2;
  snapshotId: ExperimentSnapshotIdV2;
  caption: string | null;
  briefing?: ExperimentPlacementBriefingV2;
}>;

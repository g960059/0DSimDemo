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

export type SurfaceGroupIdV2 = string;
export type SurfaceInstanceIdV2 = string;
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

/**
 * Semantic grouping and ordering only. These values carry no screen extent,
 * fullscreen state, board coordinates, panel geometry, or renderer layout.
 */
export type ExperimentSurfaceGroupV2 = Readonly<{
  groupId: SurfaceGroupIdV2;
  label: string;
  order: number;
  priority: number;
}>;

export type ExperimentSurfaceGraphInstanceV2 = Readonly<{
  instanceId: SurfaceInstanceIdV2;
  graphId: string;
  groupId: SurfaceGroupIdV2;
  order: number;
  priority: number;
}>;

export type ExperimentSurfaceReadoutInstanceV2 = Readonly<{
  instanceId: SurfaceInstanceIdV2;
  /** Stable `outputId` from the registered model's output catalog. */
  outputId: string;
  groupId: SurfaceGroupIdV2;
  order: number;
  priority: number;
}>;

export type ExperimentSurfaceControlInstanceV2 = Readonly<{
  instanceId: SurfaceInstanceIdV2;
  controlId: string;
  groupId: SurfaceGroupIdV2;
  order: number;
  priority: number;
}>;

/**
 * An Experiment surface owns exactly one note. It participates in the same
 * semantic group/order/priority system as the model-backed view instances.
 */
export type ExperimentSurfaceNoteV2 = Readonly<{
  instanceId: SurfaceInstanceIdV2;
  text: string;
  groupId: SurfaceGroupIdV2;
  order: number;
  priority: number;
}>;

export type ExperimentSurfaceV2 = Readonly<{
  groups: readonly ExperimentSurfaceGroupV2[];
  graphs: readonly ExperimentSurfaceGraphInstanceV2[];
  readouts: readonly ExperimentSurfaceReadoutInstanceV2[];
  controls: readonly ExperimentSurfaceControlInstanceV2[];
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

/**
 * Omitted subset = every corresponding value from the pinned snapshot.
 * Explicit empty subset = none. `order`, when supplied, is an exact
 * permutation of the selected graph/readout/control instances plus the one
 * always-present note.
 */
export type ExperimentPlacementViewV2 = Readonly<{
  scenarioIds?: readonly ScenarioIdV2[];
  graphInstanceIds?: readonly SurfaceInstanceIdV2[];
  readoutInstanceIds?: readonly SurfaceInstanceIdV2[];
  controlInstanceIds?: readonly SurfaceInstanceIdV2[];
  order?: readonly SurfaceInstanceIdV2[];
}>;

export type ExperimentPlacementV2 = Readonly<{
  schemaId: typeof STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID;
  placementId: ExperimentPlacementIdV2;
  snapshotId: ExperimentSnapshotIdV2;
  caption: string | null;
  view?: ExperimentPlacementViewV2;
}>;

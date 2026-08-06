import type {
  ExperimentSnapshotIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";

export type StudioScenarioPreviewKindV2 =
  | "loopable-beat"
  | "trace-strip"
  | "poster";

export type StudioPreviewTimeRangeV2 = Readonly<{
  startSec: number;
  endSec: number;
}>;

/**
 * Generic, renderer-owned cache material for one scenario. Samples are opaque
 * JSON and carry no scientific qualification or publication evidence.
 */
export type StudioScenarioPreviewV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  kind: StudioScenarioPreviewKindV2;
  timeRange?: StudioPreviewTimeRangeV2;
  loopable: boolean;
  samples: StudioJsonValueV2;
}>;

/**
 * Regenerable cache artifact derived from a snapshot.
 *
 * This artifact points to snapshot identity but is not part of that identity:
 * format upgrades or regeneration timestamps cannot change the snapshot.
 */
export type StudioPreviewArtifactV2 = Readonly<{
  snapshotId: ExperimentSnapshotIdV2;
  cacheFormatVersion: number;
  generatedAt: string;
  scenarios: readonly StudioScenarioPreviewV2[];
}>;

import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
  type ExperimentPlacementPanePickV2,
  type ExperimentPlacementV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceControlPaneV2,
  type ExperimentSurfaceGraphPaneV2,
  type ExperimentSurfaceOutputPaneV2,
  type ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import {
  validateExperimentPlacementAgainstSnapshotV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import type {
  StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";

export type ArticleSurfacePaneV3 =
  | ExperimentSurfaceGraphPaneV2
  | ExperimentSurfaceOutputPaneV2
  | ExperimentSurfaceControlPaneV2;

export type ArticleResolvedPaneV3 = Readonly<{
  pane: ArticleSurfacePaneV3;
  priority: number;
}>;

const ROLE_ORDER_V3: Readonly<Record<ArticleSurfacePaneV3["role"], number>> = {
  graph: 0,
  output: 1,
  control: 2,
};

export function articleSurfacePanesV3(
  surface: ExperimentSurfaceV2,
): readonly ArticleSurfacePaneV3[] {
  return Object.freeze([
    ...surface.graphPanes,
    ...surface.outputPanes,
    ...surface.controlPanes,
  ].sort((left, right) => (
    ROLE_ORDER_V3[left.role] - ROLE_ORDER_V3[right.role]
    || left.order - right.order
    || left.paneId.localeCompare(right.paneId)
  )));
}

/**
 * Resolves the inline Briefing against one immutable Snapshot. Omission means
 * every pane; an explicit empty selection remains empty.
 */
export function resolveArticlePlacementPanesV3(
  placement: ExperimentPlacementV2,
  snapshot: ExperimentSnapshotV2,
): readonly ArticleResolvedPaneV3[] {
  const panes = articleSurfacePanesV3(snapshot.content.surface);
  const byId = new Map(panes.map((pane) => [pane.paneId, pane]));
  const picks: readonly ExperimentPlacementPanePickV2[] = placement.briefing
    ?.panePicks ?? panes.map(({ paneId, priority }) => ({ paneId, priority }));

  return Object.freeze(picks.flatMap((pick) => {
    const pane = byId.get(pick.paneId);
    return pane === undefined ? [] : [{ pane, priority: pick.priority }];
  }).sort((left, right) => (
    right.priority - left.priority
    || ROLE_ORDER_V3[left.pane.role] - ROLE_ORDER_V3[right.pane.role]
    || left.pane.order - right.pane.order
    || left.pane.paneId.localeCompare(right.pane.paneId)
  )));
}

/**
 * A session handoff is advisory UI state, not Snapshot content. Resolve it
 * through the ordinary Placement validator and treat a stale pane/Scenario
 * selection as absent instead of broadening the durable Snapshot schema.
 */
export function resolveArticleBriefingHandoffV3(
  snapshot: ExperimentSnapshotV2,
  briefing: ExperimentPlacementBriefingV2 | null,
): ExperimentPlacementBriefingV2 | null {
  if (briefing === null) return null;
  try {
    return validateExperimentPlacementAgainstSnapshotV2({
      schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
      placementId: "placement/session-briefing-handoff-validation",
      snapshotId: snapshot.snapshotId,
      caption: null,
      briefing,
    }, snapshot).briefing ?? null;
  } catch {
    return null;
  }
}

export function createArticleExperimentBlockV3(
  snapshot: ExperimentSnapshotV2,
  briefing?: ExperimentPlacementBriefingV2,
  createId: (kind: "block" | "placement") => string = portableEditorIdV3,
): StudioArticleExperimentBlockV2 {
  const blockId = createId("block");
  const placementId = createId("placement");
  const initialBriefing = briefing ?? Object.freeze({
    panePicks: Object.freeze(articleSurfacePanesV3(snapshot.content.surface)
      .map(({ paneId, priority }) => Object.freeze({ paneId, priority }))),
  });
  const placement = validateExperimentPlacementAgainstSnapshotV2({
    schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
    placementId,
    snapshotId: snapshot.snapshotId,
    caption: null,
    briefing: initialBriefing,
  }, snapshot);
  return Object.freeze({
    blockId,
    kind: "experiment",
    placement,
  });
}

export function portableEditorIdV3(kind: "block" | "placement" | "article"): string {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${kind}/local-${random}`;
}

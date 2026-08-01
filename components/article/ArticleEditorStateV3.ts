import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
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
 * Resolves the role-specific Reader Briefing against one immutable Snapshot.
 * Omission expands to an explicit, portable projection of the complete Surface.
 */
export function resolveArticlePlacementBriefingV3(
  placement: ExperimentPlacementV2,
  snapshot: ExperimentSnapshotV2,
): ExperimentPlacementBriefingV2 {
  const briefing = placement.briefing ?? defaultArticleBriefingV3(snapshot);
  const resolved = validateExperimentPlacementAgainstSnapshotV2({
    ...placement,
    briefing,
  }, snapshot).briefing;
  if (resolved === undefined) {
    throw new Error("Article Placement Briefing resolution returned no Briefing");
  }
  return resolved;
}

/** Creates the explicit Reader projection used for a newly placed Snapshot. */
export function defaultArticleBriefingV3(
  snapshot: ExperimentSnapshotV2,
): ExperimentPlacementBriefingV2 {
  const visibleScenarioIds = Object.freeze(snapshot.content.scenarios.map(
    ({ scenarioId }) => scenarioId,
  ));
  const initialFocusScenarioId = visibleScenarioIds[0];
  if (initialFocusScenarioId === undefined) {
    throw new Error("Article Briefing requires at least one Snapshot Scenario");
  }
  const surface = snapshot.content.surface;
  const highestGraphPriority = surface.graphPanes.reduce(
    (highest, pane) => Math.max(highest, pane.priority),
    Number.NEGATIVE_INFINITY,
  );
  const graphs = Object.freeze([...surface.graphPanes]
    .sort(compareSurfacePaneOrderV3)
    .map((pane, order) => Object.freeze({
      paneId: pane.paneId,
      order,
      emphasis: pane.priority === highestGraphPriority
        ? "primary" as const
        : "supporting" as const,
    })));
  const seenOutputIds = new Set<string>();
  const outputs = Object.freeze([...surface.outputPanes]
    .sort(compareSurfacePaneOrderV3)
    .flatMap((pane) => [...pane.items].sort(compareItemOrderV3))
    .filter(({ outputId }) => {
      if (seenOutputIds.has(outputId)) return false;
      seenOutputIds.add(outputId);
      return true;
    })
    .map((item, order) => Object.freeze({
      outputId: item.outputId,
      label: item.label,
      order,
    })));
  const seenControlIds = new Set<string>();
  const controls = Object.freeze([...surface.controlPanes]
    .sort(compareSurfacePaneOrderV3)
    .flatMap((pane) => [...pane.items].sort(compareItemOrderV3))
    .filter(({ controlId }) => {
      if (seenControlIds.has(controlId)) return false;
      seenControlIds.add(controlId);
      return true;
    })
    .map((item, order) => Object.freeze({
      controlId: item.controlId,
      label: item.label,
      order,
      presentation: Object.freeze({ kind: "slider" as const }),
      binding: Object.freeze({
        mode: "fixed" as const,
        scenarioIds: Object.freeze([initialFocusScenarioId]),
        application: "absolute" as const,
      }),
    })));
  return Object.freeze({
    scenarioScope: Object.freeze({
      visibleScenarioIds,
      initialFocusScenarioId,
    }),
    graphs,
    outputs,
    controls,
  });
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
  const initialBriefing = briefing ?? defaultArticleBriefingV3(snapshot);
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
  if (kind === "article") return `article-${random}`;
  return `${kind}/local-${random}`;
}

function compareSurfacePaneOrderV3(
  left: Readonly<{ order: number; paneId: string }>,
  right: Readonly<{ order: number; paneId: string }>,
): number {
  return left.order - right.order || left.paneId.localeCompare(right.paneId);
}

function compareItemOrderV3(
  left: Readonly<{ order: number }>,
  right: Readonly<{ order: number }>,
): number {
  return left.order - right.order;
}

import {
  validateStudioArticleDraftV2,
} from "@/studio/application/authoring/StudioArticleDataV2";
import {
  validateExperimentPlacementAgainstSnapshotV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ExperimentPlacementBriefingV2,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type {
  StudioArticleDraftV2,
  StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";

export type StudioArticleBriefingSelectionV1 = Readonly<{
  title: string;
  visibleScenarioIds: readonly string[] | null;
  initialFocusScenarioId: string | null;
  graphPaneIds: readonly string[] | null;
  outputIds: readonly string[] | null;
  controlIds: readonly string[] | null;
}>;

export type StudioArticleBriefingPlacementTargetV1 =
  | Readonly<{ mode: "replace"; blockId: string }>
  | Readonly<{ mode: "insert-after"; blockId: string }>
  | Readonly<{ mode: "append" }>;

export type StudioArticleBriefingPlacementIdentityV1 = Readonly<{
  placementId: string;
  blockId: string;
}>;

/**
 * Creates the same explicit, fixed Reader projection used by the Article UI.
 * Active-slot pane bindings are materialized now; later Scenario Manager
 * changes cannot retarget an already placed Briefing.
 */
export function createStudioArticleBriefingV1(
  snapshot: ExperimentSnapshotV2,
  selection: StudioArticleBriefingSelectionV1,
): ExperimentPlacementBriefingV2 {
  const allScenarioIds = snapshot.content.scenarios.map(({ scenarioId }) => scenarioId);
  const visibleScenarioIds = selection.visibleScenarioIds ?? allScenarioIds;
  if (visibleScenarioIds.length === 0) {
    throw new Error("Article Briefing requires at least one visible Scenario");
  }
  const availableScenarioIds = new Set(allScenarioIds);
  for (const scenarioId of visibleScenarioIds) {
    if (!availableScenarioIds.has(scenarioId)) {
      throw new Error(`Article Briefing Scenario is unavailable: ${scenarioId}`);
    }
  }
  const initialFocusScenarioId = selection.initialFocusScenarioId
    ?? visibleScenarioIds[0]!;
  if (!visibleScenarioIds.includes(initialFocusScenarioId)) {
    throw new Error("Article Briefing focus Scenario must be visible");
  }
  const graphFilter = selection.graphPaneIds === null
    ? null
    : new Set(selection.graphPaneIds);
  const graphPanes = [...snapshot.content.surface.graphPanes]
    .sort(comparePaneV1)
    .filter((pane) => graphFilter === null || graphFilter.has(pane.paneId));
  if (graphFilter !== null && graphPanes.length !== graphFilter.size) {
    throw new Error("Article Briefing selected an unavailable graph pane");
  }
  const highestPriority = graphPanes.reduce(
    (highest, pane) => Math.max(highest, pane.priority),
    Number.NEGATIVE_INFINITY,
  );
  const outputs = [...snapshot.content.surface.outputPanes]
    .sort(comparePaneV1)
    .flatMap((pane) => [...pane.items].sort(compareItemV1)
      .map((item) => ({ pane, item })))
    .filter(({ item }) =>
      selection.outputIds === null || selection.outputIds.includes(item.outputId))
    .map(({ pane, item }, order) => Object.freeze({
      sourcePaneId: pane.paneId,
      outputId: item.outputId,
      scenarioId: pane.binding.mode === "fixed"
        && visibleScenarioIds.includes(pane.binding.scenarioId)
        ? pane.binding.scenarioId
        : initialFocusScenarioId,
      label: item.label,
      order,
    }));
  assertSelectedIdsResolvedV1(
    selection.outputIds,
    outputs.map(({ outputId }) => outputId),
    "output",
  );
  const controls = [...snapshot.content.surface.controlPanes]
    .sort(comparePaneV1)
    .flatMap((pane) => [...pane.items].sort(compareItemV1)
      .map((item) => ({ pane, item })))
    .filter(({ item }) =>
      selection.controlIds === null || selection.controlIds.includes(item.controlId))
    .map(({ pane, item }, order) => {
      const fixed = pane.binding.mode === "fixed"
        ? pane.binding.scenarioIds.filter((scenarioId) =>
            visibleScenarioIds.includes(scenarioId))
        : [];
      return Object.freeze({
        sourcePaneId: pane.paneId,
        controlId: item.controlId,
        label: item.label,
        order,
        presentation: item.presentation,
        binding: Object.freeze({
          mode: "fixed" as const,
          scenarioIds: Object.freeze(fixed.length > 0
            ? fixed
            : [initialFocusScenarioId]),
          application: "absolute" as const,
        }),
      });
    });
  assertSelectedIdsResolvedV1(
    selection.controlIds,
    controls.map(({ controlId }) => controlId),
    "control",
  );
  return Object.freeze({
    defaultTitle: selection.title,
    scenarioScope: Object.freeze({
      visibleScenarioIds: Object.freeze([...visibleScenarioIds]),
      initialFocusScenarioId,
    }),
    graphs: Object.freeze(graphPanes.map((pane, order) => Object.freeze({
      paneId: pane.paneId,
      order,
      emphasis: pane.priority === highestPriority
        ? "primary" as const
        : "supporting" as const,
    }))),
    outputs: Object.freeze(outputs),
    controls: Object.freeze(controls),
  });
}

export function placeStudioArticleBriefingV1(input: Readonly<{
  article: StudioArticleDraftV2;
  snapshot: ExperimentSnapshotV2;
  selection: StudioArticleBriefingSelectionV1;
  target: StudioArticleBriefingPlacementTargetV1;
  identity: StudioArticleBriefingPlacementIdentityV1;
}>): StudioArticleDraftV2 {
  const briefing = createStudioArticleBriefingV1(
    input.snapshot,
    input.selection,
  );
  const placement = validateExperimentPlacementAgainstSnapshotV2({
    schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
    placementId: input.identity.placementId,
    snapshotId: input.snapshot.snapshotId,
    briefing,
    titleOverride: null,
    caption: null,
  }, input.snapshot);
  const block: StudioArticleExperimentBlockV2 = Object.freeze({
    blockId: input.identity.blockId,
    kind: "experiment",
    placement,
  });
  const blocks = [...input.article.blocks];
  if (input.target.mode === "append") {
    blocks.push(block);
  } else {
    const targetBlockId = input.target.blockId;
    const index = blocks.findIndex(({ blockId }) => blockId === targetBlockId);
    if (index < 0) {
      throw new Error(`Article target block is unavailable: ${targetBlockId}`);
    }
    if (input.target.mode === "replace") {
      blocks.splice(index, 1, block);
    } else {
      blocks.splice(index + 1, 0, block);
    }
  }
  return validateStudioArticleDraftV2({
    ...input.article,
    blocks,
  });
}

function comparePaneV1(
  left: Readonly<{ order: number; paneId: string }>,
  right: Readonly<{ order: number; paneId: string }>,
): number {
  return left.order - right.order || left.paneId.localeCompare(right.paneId);
}

function compareItemV1(
  left: Readonly<{ order: number }>,
  right: Readonly<{ order: number }>,
): number {
  return left.order - right.order;
}

function assertSelectedIdsResolvedV1(
  selected: readonly string[] | null,
  resolved: readonly string[],
  kind: string,
): void {
  if (selected === null) return;
  const resolvedIds = new Set(resolved);
  for (const id of selected) {
    if (!resolvedIds.has(id)) {
      throw new Error(`Article Briefing selected an unavailable ${kind}: ${id}`);
    }
  }
}

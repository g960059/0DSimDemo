import type { SerializedDockview } from "dockview";
import type { GraphBoardLayout } from "@/features/workbench/viewSpec";
import { normalizeGraphBoardLayout } from "@/features/workbench/viewSpec";
import type { PanelDef } from "@/types";

type GraphBoardSplitLayout = Extract<GraphBoardLayout, { type: "split" }>;

type DockviewGridNode = {
  type: "leaf" | "branch";
  data?: unknown;
  size?: number;
};

type DockviewGroupState = {
  views?: unknown;
  activeView?: unknown;
};

export type GraphBoardSplitDirection = "right" | "below";

export type GraphBoardAddPanelInstruction = {
  panelId: string;
  placement: "first" | "within" | "split";
  referencePanelId?: string;
  direction?: GraphBoardSplitDirection;
  sizeRatio?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isGridNode(value: unknown): value is DockviewGridNode {
  return isRecord(value) && (value.type === "leaf" || value.type === "branch");
}

function groupViews(data: unknown): string[] {
  if (!isRecord(data)) return [];
  const group = data as DockviewGroupState;
  return Array.isArray(group.views) ? group.views.filter((view): view is string => typeof view === "string") : [];
}

function leafIdFromGroup(data: unknown): string | undefined {
  const views = groupViews(data);
  if (views.length === 0) return undefined;
  const activeView = isRecord(data) && typeof data.activeView === "string" ? data.activeView : undefined;
  return activeView && views.includes(activeView) ? activeView : views[0];
}

function childSizes(children: readonly DockviewGridNode[]): number[] {
  const rawSizes = children.map((child) => child.size);
  const usable = rawSizes.every((size) => Number.isFinite(size) && (size ?? 0) > 0)
    ? rawSizes.map((size) => size!)
    : children.map(() => 1);
  const total = usable.reduce((sum, size) => sum + size, 0);
  return usable.map((size) => size / total);
}

function oppositeOrientation(orientation: "HORIZONTAL" | "VERTICAL"): "HORIZONTAL" | "VERTICAL" {
  return orientation === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL";
}

function directionForOrientation(orientation: "HORIZONTAL" | "VERTICAL"): GraphBoardSplitLayout["direction"] {
  return orientation === "HORIZONTAL" ? "row" : "column";
}

function layoutFromGridNode(
  node: DockviewGridNode,
  orientation: "HORIZONTAL" | "VERTICAL",
): GraphBoardLayout | undefined {
  if (node.type === "leaf") {
    const graphViewId = leafIdFromGroup(node.data);
    return graphViewId ? { type: "leaf", graphViewId } : undefined;
  }

  const childNodes = Array.isArray(node.data) ? node.data.filter(isGridNode) : [];
  const children = childNodes
    .map((child) => layoutFromGridNode(child, oppositeOrientation(orientation)))
    .filter((child): child is GraphBoardLayout => Boolean(child));
  if (children.length === 0) return undefined;
  if (children.length === 1) return children[0];

  return {
    type: "split",
    direction: directionForOrientation(orientation),
    children,
    sizes: childSizes(childNodes).slice(0, children.length),
  };
}

export function deriveGraphBoardLayoutFromDockviewState(
  state: SerializedDockview | unknown,
  graphViewIds?: Iterable<string>,
): GraphBoardLayout | undefined {
  if (!isRecord(state) || !isRecord(state.grid) || !isGridNode(state.grid.root)) return undefined;
  const orientation = state.grid.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL";
  const layout = layoutFromGridNode(state.grid.root, orientation);
  return normalizeGraphBoardLayout(layout, graphViewIds ? { graphViewIds } : {}).layout;
}

function normalizeToBinarySplit(layout: GraphBoardLayout): GraphBoardLayout {
  if (layout.type === "leaf") return layout;
  const children = layout.children.map(normalizeToBinarySplit);
  const sizes = layout.sizes.length === children.length ? layout.sizes : children.map(() => 1);
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const normalizedSizes = total > 0 ? sizes.map((size) => size / total) : children.map(() => 1 / children.length);
  if (children.length <= 2) return { ...layout, children, sizes: normalizedSizes };

  const [first, ...rest] = children;
  const [firstSize, ...restSizes] = normalizedSizes;
  const restTotal = restSizes.reduce((sum, size) => sum + size, 0);
  return {
    type: "split",
    direction: layout.direction,
    children: [
      first,
      normalizeToBinarySplit({
        type: "split",
        direction: layout.direction,
        children: rest,
        sizes: restSizes.map((size) => size / restTotal),
      }),
    ],
    sizes: [firstSize, restTotal],
  };
}

function firstLeafId(layout: GraphBoardLayout): string {
  return layout.type === "leaf" ? layout.graphViewId : firstLeafId(layout.children[0]);
}

function appendInstructions(
  layout: GraphBoardLayout,
  instructions: GraphBoardAddPanelInstruction[],
  placement: GraphBoardAddPanelInstruction["placement"],
  referencePanelId?: string,
  direction?: GraphBoardSplitDirection,
  sizeRatio?: number,
): string {
  if (layout.type === "leaf") {
    instructions.push({
      panelId: layout.graphViewId,
      placement,
      ...(referencePanelId ? { referencePanelId } : {}),
      ...(direction ? { direction } : {}),
      ...(sizeRatio ? { sizeRatio } : {}),
    });
    return layout.graphViewId;
  }

  const [first, second] = layout.children;
  const firstRoot = appendInstructions(first, instructions, placement, referencePanelId, direction, sizeRatio ?? layout.sizes[0]);
  appendInstructions(
    second,
    instructions,
    "split",
    firstRoot,
    layout.direction === "row" ? "right" : "below",
    layout.sizes[1],
  );
  return firstLeafId(layout);
}

export function graphBoardLayoutToDockviewInstructions(
  layout: GraphBoardLayout | undefined,
  panels: readonly Pick<PanelDef, "id">[],
): GraphBoardAddPanelInstruction[] {
  const validIds = new Set(panels.map((panel) => panel.id));
  const normalized = normalizeGraphBoardLayout(layout, { graphViewIds: validIds }).layout;
  if (!normalized) return panels.map((panel, index) => ({
    panelId: panel.id,
    placement: index === 0 ? "first" : "within",
    ...(index > 0 ? { referencePanelId: panels[0].id } : {}),
  }));

  const binary = normalizeToBinarySplit(normalized);
  const instructions: GraphBoardAddPanelInstruction[] = [];
  appendInstructions(binary, instructions, "first");

  const included = new Set(instructions.map((instruction) => instruction.panelId));
  for (const panel of panels) {
    if (included.has(panel.id)) continue;
    instructions.push({ panelId: panel.id, placement: "within", referencePanelId: instructions[0]?.panelId });
  }
  return instructions;
}

// UI-unwired by design in P1c. Keep this pure helper for future MCP/LLM layout
// commands and regression coverage without exposing an Arrange menu.
export function arrangeGraphBoardLayout(
  panels: readonly Pick<PanelDef, "id">[],
  arrangement: "2x2" | "sideBySide" | "stacked",
): GraphBoardLayout | undefined {
  if (panels.length === 0) return undefined;
  if (panels.length === 1) return { type: "leaf", graphViewId: panels[0].id };

  if (arrangement === "sideBySide") {
    return {
      type: "split",
      direction: "row",
      children: panels.map((panel) => ({ type: "leaf", graphViewId: panel.id })),
      sizes: panels.map(() => 1),
    };
  }

  if (arrangement === "stacked") {
    return {
      type: "split",
      direction: "column",
      children: panels.map((panel) => ({ type: "leaf", graphViewId: panel.id })),
      sizes: panels.map(() => 1),
    };
  }

  const selected = panels.slice(0, 4);
  if (selected.length <= 2) {
    return arrangeGraphBoardLayout(selected, "sideBySide");
  }

  const firstRow = selected.slice(0, 2);
  const secondRow = selected.slice(2, 4);
  const rows: GraphBoardLayout[] = [
    arrangeGraphBoardLayout(firstRow, "sideBySide")!,
    secondRow.length === 1 ? { type: "leaf", graphViewId: secondRow[0].id } : arrangeGraphBoardLayout(secondRow, "sideBySide")!,
  ];
  return {
    type: "split",
    direction: "column",
    children: rows,
    sizes: rows.map(() => 1),
  };
}

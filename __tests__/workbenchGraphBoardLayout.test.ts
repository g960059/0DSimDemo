import { describe, expect, it } from "vitest";
import {
  arrangeGraphBoardLayout,
  deriveGraphBoardLayoutFromDockviewState,
  graphBoardLayoutToDockviewInstructions,
} from "@/features/workbench/graphBoardLayout";
import { normalizeGraphBoardLayout, type GraphBoardLayout } from "@/features/workbench/viewSpec";
import { deriveGraphBoardLayoutChange } from "@/components/workbench/WorkbenchDockview";
import type { PanelDef } from "@/types";

function panel(id: string): Pick<PanelDef, "id"> {
  return { id };
}

function roundedLayout(layout: GraphBoardLayout | undefined): GraphBoardLayout | undefined {
  if (!layout || layout.type === "leaf") return layout;
  return {
    ...layout,
    sizes: layout.sizes.map((size) => Number(size.toFixed(12))),
    children: layout.children.map((child) => roundedLayout(child)!),
  };
}

type SimNode = {
  type: "leaf" | "branch";
  size?: number;
  data?: { views: string[]; activeView: string } | SimNode[];
};

function simulateInstructionApplication(layout: GraphBoardLayout, panels: Pick<PanelDef, "id">[]) {
  const instructions = graphBoardLayoutToDockviewInstructions(layout, panels);
  let root: SimNode | undefined;

  function splitLeaf(node: SimNode, referencePanelId: string, nextPanelId: string, sizeRatio: number): SimNode {
    if (node.type === "leaf" && (node.data as { activeView?: string }).activeView === referencePanelId) {
      return {
        type: "branch",
        size: node.size,
        data: [
          { ...node, size: 1 - sizeRatio },
          { type: "leaf", size: sizeRatio, data: { views: [nextPanelId], activeView: nextPanelId } },
        ],
      };
    }
    if (node.type !== "branch" || !Array.isArray(node.data)) return node;
    return { ...node, data: node.data.map((child) => splitLeaf(child, referencePanelId, nextPanelId, sizeRatio)) };
  }

  for (const instruction of instructions) {
    if (!root || instruction.placement === "first") {
      root = { type: "leaf", size: 1, data: { views: [instruction.panelId], activeView: instruction.panelId } };
      continue;
    }
    if (instruction.placement === "within") continue;
    root = splitLeaf(root, instruction.referencePanelId!, instruction.panelId, instruction.sizeRatio ?? 0.5);
  }

  return {
    grid: {
      orientation: instructions.find((instruction) => instruction.placement === "split")?.direction === "below"
        ? "VERTICAL"
        : "HORIZONTAL",
      root,
    },
    panels: {},
  };
}

describe("GraphBoardLayout Dockview wiring helpers", () => {
  it("derives the canonical split tree from serialized Dockview grid state", () => {
    const state = {
      grid: {
        width: 1000,
        height: 600,
        orientation: "HORIZONTAL",
        root: {
          type: "branch",
          size: 1000,
          data: [
            {
              type: "leaf",
              size: 300,
              data: { id: "group-a", views: ["pv"], activeView: "pv" },
            },
            {
              type: "branch",
              size: 700,
              data: [
                { type: "leaf", size: 200, data: { id: "group-b", views: ["wave"], activeView: "wave" } },
                { type: "leaf", size: 400, data: { id: "group-c", views: ["guyton"], activeView: "guyton" } },
              ],
            },
          ],
        },
      },
      panels: {},
    };

    expect(deriveGraphBoardLayoutFromDockviewState(state, ["pv", "wave", "guyton"])).toEqual({
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "pv" },
        {
          type: "split",
          direction: "column",
          children: [
            { type: "leaf", graphViewId: "wave" },
            { type: "leaf", graphViewId: "guyton" },
          ],
          sizes: [1 / 3, 2 / 3],
        },
      ],
      sizes: [0.3, 0.7],
    });
  });

  it("uses the active tab from a tab group as the canonical leaf", () => {
    const state = {
      grid: {
        width: 500,
        height: 300,
        orientation: "HORIZONTAL",
        root: { type: "leaf", size: 500, data: { id: "group-a", views: ["pv", "wave"], activeView: "wave" } },
      },
      panels: {},
    };

    expect(deriveGraphBoardLayoutFromDockviewState(state, ["pv", "wave"])).toEqual({ type: "leaf", graphViewId: "wave" });
  });

  it("does not produce a canonical layout change when Dockview re-derivation is temporarily invalid", () => {
    const viewState = {
      library: "dockview" as const,
      schemaVersion: 1 as const,
      zone: "main" as const,
      state: {
        grid: {
          orientation: "HORIZONTAL",
          root: { type: "leaf", size: 500, data: { id: "group-a", views: ["missing"], activeView: "missing" } },
        },
        panels: {},
      },
    };

    expect(deriveGraphBoardLayoutChange(viewState, ["pv"])).toBeUndefined();
  });

  it("normalizes multi-child splits into pairwise Dockview add-panel instructions", () => {
    const layout: GraphBoardLayout = {
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "a" },
        { type: "leaf", graphViewId: "b" },
        { type: "leaf", graphViewId: "c" },
      ],
      sizes: [1, 2, 1],
    };

    expect(graphBoardLayoutToDockviewInstructions(layout, [panel("a"), panel("b"), panel("c")])).toEqual([
      { panelId: "a", placement: "first", sizeRatio: 0.25 },
      { panelId: "b", placement: "split", referencePanelId: "a", direction: "right", sizeRatio: 0.75 },
      { panelId: "c", placement: "split", referencePanelId: "b", direction: "right", sizeRatio: 1 / 3 },
    ]);
  });

  it("falls back to current panel order when a saved layout no longer matches the panel set", () => {
    const layout: GraphBoardLayout = {
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "a" },
        { type: "leaf", graphViewId: "missing" },
      ],
      sizes: [1, 1],
    };

    expect(graphBoardLayoutToDockviewInstructions(layout, [panel("a"), panel("b")])).toEqual([
      { panelId: "a", placement: "first" },
      { panelId: "b", placement: "within", referencePanelId: "a" },
    ]);
  });

  it("keeps representative rebuild and re-derive trees at a normalized fixpoint", () => {
    const layout: GraphBoardLayout = {
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "a" },
        {
          type: "split",
          direction: "column",
          children: [
            { type: "leaf", graphViewId: "b" },
            { type: "leaf", graphViewId: "c" },
          ],
          sizes: [1, 2],
        },
      ],
      sizes: [3, 7],
    };
    const panels = [panel("a"), panel("b"), panel("c")];
    const normalized = normalizeGraphBoardLayout(layout, { graphViewIds: panels.map((p) => p.id) }).layout;
    const rebuiltState = simulateInstructionApplication(layout, panels);
    const derived = deriveGraphBoardLayoutFromDockviewState(rebuiltState, panels.map((p) => p.id));

    expect(roundedLayout(derived)).toEqual(roundedLayout(normalized));
    expect(normalizeGraphBoardLayout(derived, { graphViewIds: panels.map((p) => p.id) }).layout).toEqual(derived);
    expect(graphBoardLayoutToDockviewInstructions(normalized, panels)).toEqual(graphBoardLayoutToDockviewInstructions(normalized, panels));
  });

  it("emits deterministic Dockview instructions from a normalized graph board layout", () => {
    const layout: GraphBoardLayout = {
      type: "split",
      direction: "column",
      children: [
        { type: "leaf", graphViewId: "a" },
        { type: "leaf", graphViewId: "b" },
      ],
      sizes: [4, 6],
    };
    const panels = [panel("a"), panel("b")];
    const normalized = normalizeGraphBoardLayout(layout, { graphViewIds: panels.map((p) => p.id) }).layout;

    expect(graphBoardLayoutToDockviewInstructions(normalized, panels)).toEqual(graphBoardLayoutToDockviewInstructions(normalized, panels));
  });

  it("generates Arrange command trees from current graph panes without creating panes", () => {
    expect(arrangeGraphBoardLayout([panel("a"), panel("b"), panel("c")], "2x2")).toEqual({
      type: "split",
      direction: "column",
      children: [
        {
          type: "split",
          direction: "row",
          children: [
            { type: "leaf", graphViewId: "a" },
            { type: "leaf", graphViewId: "b" },
          ],
          sizes: [1, 1],
        },
        { type: "leaf", graphViewId: "c" },
      ],
      sizes: [1, 1],
    });

    expect(arrangeGraphBoardLayout([panel("a"), panel("b")], "stacked")).toEqual({
      type: "split",
      direction: "column",
      children: [
        { type: "leaf", graphViewId: "a" },
        { type: "leaf", graphViewId: "b" },
      ],
      sizes: [1, 1],
    });
  });
});

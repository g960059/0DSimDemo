import { describe, expect, it } from "vitest";
import {
  arrangeGraphBoardLayout,
  deriveGraphBoardLayoutFromDockviewState,
  graphBoardLayoutToDockviewInstructions,
} from "@/features/workbench/graphBoardLayout";
import type { GraphBoardLayout } from "@/features/workbench/viewSpec";
import type { PanelDef } from "@/types";

function panel(id: string): Pick<PanelDef, "id"> {
  return { id };
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

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DockviewApi } from "dockview";
import { describe, expect, it, vi } from "vitest";

import {
  createDefaultControlPaneV3,
  createDefaultGraphPanesV3,
  createDefaultOutputPaneV3,
} from "@/components/WorkbenchV3Page";
import {
  WorkbenchDockview,
  reconcileWorkbenchPaneTitlesV3,
  reconcileWorkbenchPanesV3,
  resetWorkbenchDockviewTrackingV3,
  type WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";

describe("V3 Dockview Workbench", () => {
  it("derives graph, output, and control panes only from the exact registry contract", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const graphPanes = createDefaultGraphPanesV3(composition.contract);
    const outputPane = createDefaultOutputPaneV3(composition.contract);
    const controlPane = createDefaultControlPaneV3(composition.contract);

    expect(graphPanes.map(({ graphId }) => graphId)).toEqual(
      composition.contract.graphCatalog.map(({ graphId }) => graphId),
    );
    expect(outputPane.outputIds).toEqual(
      composition.contract.outputCatalog.map(({ outputId }) => outputId),
    );
    expect(controlPane.controlIds).toEqual(
      composition.contract.controlCatalog.map(({ controlId }) => controlId),
    );
    expect(controlPane.controlIds).toEqual([]);
    expect(Object.isFrozen(graphPanes)).toBe(true);
    expect(Object.isFrozen(outputPane.outputIds)).toBe(true);
  });

  it("keeps role areas exact in the server fallback", () => {
    const pane: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-1",
      role: "graph",
      title: "Graph",
    });
    const html = renderToStaticMarkup(
      <WorkbenchDockview
        ariaLabel="Graph area"
        panes={[pane]}
        role="graph"
        renderPane={() => <div>V3 graph</div>}
      />,
    );

    expect(html).toContain('aria-label="Graph area"');
    expect(html).toContain('data-workbench-role-area="graph"');
    expect(html).toContain("V3 graph");
  });

  it("rejects a pane placed into a different role area", () => {
    const pane: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "output-1",
      role: "output",
      title: "Outputs",
    });

    expect(() => renderToStaticMarkup(
      <WorkbenchDockview
        ariaLabel="Graph area"
        panes={[pane]}
        role="graph"
        renderPane={() => null}
      />,
    )).toThrow(/graph area cannot host output pane output-1/);
  });

  it("does not rebuild Dockview for title or content-only pane changes", () => {
    const clear = vi.fn();
    const addPanel = vi.fn();
    const api = {
      addPanel,
      clear,
      panels: [],
    } as unknown as DockviewApi;
    const pane: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-1",
      role: "graph",
      title: "Pressure",
    });

    let signature = reconcileWorkbenchPanesV3(api, [pane], null);
    signature = reconcileWorkbenchPanesV3(
      api,
      [{ ...pane, title: "Flow" }],
      signature,
    );
    const changedContent = {
      ...pane,
      graphId: "graph-definition/flow",
      title: "Flow",
    };
    signature = reconcileWorkbenchPanesV3(api, [changedContent], signature);

    expect(clear).toHaveBeenCalledTimes(1);
    expect(addPanel).toHaveBeenCalledTimes(1);
  });

  it("updates Dockview's internal title without rebuilding pane structure", () => {
    const clear = vi.fn();
    const addPanel = vi.fn();
    const setTitle = vi.fn();
    const getPanel = vi.fn(() => ({ setTitle }));
    const api = {
      addPanel,
      clear,
      getPanel,
      panels: [],
    } as unknown as DockviewApi;
    const pane: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-1",
      role: "graph",
      title: "Pressure",
    });

    const structureSignature = reconcileWorkbenchPanesV3(api, [pane], null);
    let titleSignature = reconcileWorkbenchPaneTitlesV3(api, [pane], null);
    const renamed = { ...pane, title: "Flow" };
    reconcileWorkbenchPanesV3(api, [renamed], structureSignature);
    titleSignature = reconcileWorkbenchPaneTitlesV3(
      api,
      [renamed],
      titleSignature,
    );
    const changedContent = {
      ...renamed,
      graphId: "graph-definition/flow",
    };
    reconcileWorkbenchPaneTitlesV3(
      api,
      [changedContent],
      titleSignature,
    );

    expect(clear).toHaveBeenCalledTimes(1);
    expect(addPanel).toHaveBeenCalledTimes(1);
    expect(getPanel).toHaveBeenCalledTimes(2);
    expect(setTitle.mock.calls).toEqual([["Pressure"], ["Flow"]]);
  });

  it("rebuilds Dockview when pane ID, role, or order changes", () => {
    const clear = vi.fn();
    const addPanel = vi.fn();
    const api = {
      addPanel,
      clear,
      panels: [],
    } as unknown as DockviewApi;
    const first: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-1",
      role: "graph",
      title: "Pressure",
    });
    const second: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-2",
      role: "graph",
      title: "Flow",
    });

    let signature = reconcileWorkbenchPanesV3(api, [first, second], null);
    signature = reconcileWorkbenchPanesV3(api, [second, first], signature);
    signature = reconcileWorkbenchPanesV3(
      api,
      [second, { ...first, paneId: "graph-3" }],
      signature,
    );
    reconcileWorkbenchPanesV3(
      api,
      [second, { ...first, paneId: "graph-3", role: "output" }],
      signature,
    );

    expect(clear).toHaveBeenCalledTimes(4);
    expect(addPanel).toHaveBeenCalledTimes(8);
  });

  it("drops stale Dockview tracking when its framework element unmounts", () => {
    const apiRef: { current: DockviewApi | null } = {
      current: { clear: vi.fn() } as unknown as DockviewApi,
    };
    const appliedSignatureRef: { current: string | null } = {
      current: "[[\"graph-1\",\"graph\"]]",
    };
    const appliedTitleSignatureRef: { current: string | null } = {
      current: "[[\"graph-1\",\"Pressure\"]]",
    };

    resetWorkbenchDockviewTrackingV3(
      apiRef,
      appliedSignatureRef,
      appliedTitleSignatureRef,
    );

    expect(apiRef.current).toBeNull();
    expect(appliedSignatureRef.current).toBeNull();
    expect(appliedTitleSignatureRef.current).toBeNull();
  });
});

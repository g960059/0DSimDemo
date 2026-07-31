import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createDefaultControlPaneV3,
  createDefaultGraphPanesV3,
  createDefaultOutputPaneV3,
} from "@/components/WorkbenchV3Page";
import {
  WorkbenchDockview,
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
});

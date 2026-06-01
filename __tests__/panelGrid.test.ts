import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PanelGrid, canEditWorkbenchLayout, type PanelGridMode } from "@/components/workbench/PanelGrid";
import type { PanelDef } from "@/types";

const noop = () => {};

function renderPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], layoutEditable = true) {
  return renderToStaticMarkup(
    React.createElement(PanelGrid, {
      authoringMode: false,
      publishedLesson: null,
      copyShareUrl: noop,
      instances: [],
      stepsDraft: [],
      setStepsDraft: noop,
      panels,
      onPanelsChange: noop,
      mode,
      layoutEditable,
      setLayoutEditable: noop,
      isMobile: false,
      noteModes: {},
      setNoteModes: noop,
      physicsRefs: { current: new Map() },
      instanceHealth: {},
      activeInstanceId: "",
      setActiveInstanceId: noop,
      updateInstanceParams: noop,
      updateInstanceKnobs: noop,
      updateInstanceVolume: noop,
      updateInstanceColor: noop,
      addInstance: noop,
      removeInstance: noop,
      timeScale: 1,
      setTimeScale: noop,
      isPlaying: true,
      togglePlay: noop,
      addPanel: noop,
      removePanel: noop,
      updatePanelTitle: noop,
      toggleShowLegend: noop,
      updatePanelInstanceColor: noop,
      updatePanelInstanceName: noop,
      updatePanelSignalColor: noop,
      updatePanelSignalName: noop,
      toggleSettings: noop,
      toggleInstanceVisibility: noop,
      updateInstanceSignals: noop,
      toggleGuides: noop,
      updateTimeWindow: noop,
      noteCaseKey: "test",
      notes: {},
      onNoteChange: noop,
      chambers: [],
      signals: [],
      metrics: [],
      controlGroups: [],
    }),
  );
}

describe("PanelGrid layout edit gating", () => {
  it("allows layout editing only for non-mobile author and sandbox modes", () => {
    expect(canEditWorkbenchLayout("sandbox", false)).toBe(true);
    expect(canEditWorkbenchLayout("author", false)).toBe(true);
    expect(canEditWorkbenchLayout("learner", false)).toBe(false);
    expect(canEditWorkbenchLayout("sandbox", true)).toBe(false);
  });

  it("does not render the layout toolbar or editor entry point in learner mode", () => {
    const html = renderPanelGrid("learner");

    expect(html).not.toContain("Edit layout");
    expect(html).not.toContain("Done editing");
    expect(html).not.toContain("Loading layout editor");
    expect(html).not.toContain("panel-grid-editor");
  });

  it("renders the layout toolbar for sandbox mode", () => {
    const html = renderPanelGrid("sandbox", [], false);

    expect(html).toContain("Edit layout");
  });
});

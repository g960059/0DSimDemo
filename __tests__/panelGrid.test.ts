import React from "react";
import { Writable } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PanelGrid, canEditWorkbenchLayout, type PanelGridMode } from "@/components/workbench/PanelGrid";
import type { PanelDef } from "@/types";

// These tests cover layout gating, not BlockNote behavior. Keeping NotePanel
// stubbed avoids cross-file BlockNote schema registration in shared workers.
vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  return {
    NotePanel: () => React.createElement("div", { "data-note-panel-stub": "true" }),
  };
});

const noop = () => {};

function renderPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], layoutEditable = true) {
  return renderToStaticMarkup(
    createPanelGrid(mode, panels, layoutEditable),
  );
}

function createPanelGrid(mode: PanelGridMode, panels: PanelDef[] = [], layoutEditable = true) {
  return React.createElement(PanelGrid, {
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
  });
}

function renderPanelGridAllReady(mode: PanelGridMode, panels: PanelDef[] = [], layoutEditable = true) {
  return new Promise<string>((resolve, reject) => {
    let html = "";
    let settled = false;
    let stream: ReturnType<typeof renderToPipeableStream> | undefined;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stream?.abort();
      reject(new Error("Timed out rendering PanelGrid."));
    }, 5000);

    stream = renderToPipeableStream(
      createPanelGrid(mode, panels, layoutEditable),
      {
        onAllReady() {
          const writable = new Writable({
            write(chunk, _encoding, callback) {
              html += chunk.toString();
              callback();
            },
            final(callback) {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                resolve(html);
              }
              callback();
            },
          });
          stream?.pipe(writable);
        },
        onError(error) {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(error);
          }
        },
      },
    );
  });
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

  it.each(["author", "sandbox"] as const)("mounts the layout editor for %s mode", async (mode) => {
    const html = await renderPanelGridAllReady(mode);

    expect(html).toContain('data-panel-grid-editor="mounted"');
  });
});

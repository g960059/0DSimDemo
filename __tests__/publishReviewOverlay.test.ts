import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { simInstancesToCaseDocument, workspaceForPanels, type CaseDocument } from "@/caseDoc";
import { DEFAULT_PARAMS } from "@/constants";
import { PublishReviewOverlay } from "@/features/workbench/publish/PublishReviewOverlay";
import type { NoteContent } from "@/noteTypes";
import type { PanelDef, SimInstance } from "@/types";

vi.mock("@/components/NotePanel", async () => {
  const React = await import("react");
  return {
    deriveHeadingAnchors: () => [],
    NotePanel: () => React.createElement("div", { "data-note-panel-stub": "true" }),
  };
});

const mockInstance: SimInstance = {
  id: "s1",
  name: "Scenario 1",
  color: "#38bdf8",
  params: { ...DEFAULT_PARAMS },
  targetVolume: 5600,
  isVisible: true,
};

vi.mock("@/features/workbench/hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/features/workbench/publish/usePreviewRuntime", () => ({
  usePreviewRuntime: () => ({
    instances: [mockInstance],
    activeInstanceId: "s1",
    setActiveInstanceId: () => {},
    setActive: () => {},
    toggleVisibility: () => {},
    toggleScenarioGlobalVisibility: () => {},
    updateInstanceParams: () => {},
    updateInstanceKnobs: () => {},
    updateInstanceVolume: () => {},
    resetInstanceKnobs: () => {},
    reset: () => {},
    simulation: {
      physicsRefs: { current: new Map() },
      instanceHealth: {},
      steadyUpdateStatuses: {},
      timeScale: 1,
      setTimeScale: () => {},
      isPlaying: true,
      togglePlay: () => {},
    },
  }),
}));

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

function note(text: string): NoteContent {
  return [{ type: "paragraph", content: [{ type: "text", text, styles: {} }] }];
}

function notePanel(): PanelDef {
  return {
    id: "note",
    type: "NOTE",
    title: "Note",
    w: 4,
    h: 4,
    config: {},
    view: { kind: "note", noteId: "note" },
    isSettingsOpen: false,
  };
}

function wavePanel(): PanelDef {
  return {
    id: "wave",
    type: "WAVEFORM",
    title: "Waveform",
    w: 6,
    h: 4,
    config: { s1: { visible: true, selectedSignals: ["AoP"] } },
    isSettingsOpen: false,
  };
}

function reviewDoc(): CaseDocument {
  const panels = [notePanel(), wavePanel()];
  return simInstancesToCaseDocument([mockInstance], panels, {
    id: "review-overlay",
    title: "Review overlay",
    createdAt: 1,
    updatedAt: 2,
    spec: { title: "Review overlay", modelLimitations: ["0D model."] },
    notes: { note: note("Reader note") },
    reading: { schemaVersion: 1, column: [{ kind: "noteRef", noteId: "note" }] },
    workspace: workspaceForPanels(panels),
    initialActiveScenarioId: "s1",
  });
}

describe("PublishReviewOverlay", () => {
  it("SSR-renders the full learner Explore composition", () => {
    const html = renderToStaticMarkup(
      React.createElement(MemoryRouter, null,
        React.createElement(PublishReviewOverlay, {
          reviewDoc: reviewDoc(),
          initialEntry: "explore",
          workbenchTheme: "dark",
          onExit: () => {},
        }),
      ),
    );

    expect(html).toContain("Preview: reader view");
    expect(html).toContain("Scenarios");
    expect(html).toContain("Clinical parameters");
  });
});

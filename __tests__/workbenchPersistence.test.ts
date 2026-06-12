import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { workspaceForPanels } from "@/caseDoc";
import { DEFAULT_PARAMS } from "@/constants";
import { useWorkbenchPersistence, type BuildCurrentDoc } from "@/features/workbench/hooks/useWorkbenchPersistence";
import type { WorkbenchPanelsState } from "@/features/workbench/hooks/useWorkbenchPanels";
import type { WorkbenchSceneState } from "@/features/workbench/hooks/useWorkbenchScene";
import type { PanelDef, SimInstance } from "@/types";

const instances: SimInstance[] = [
  { id: "a", name: "A", color: "#a855f7", params: { ...DEFAULT_PARAMS }, targetVolume: 5000, isVisible: true },
  { id: "b", name: "B", color: "#22c55e", params: { ...DEFAULT_PARAMS }, targetVolume: 5000, isVisible: true },
];

const panels: PanelDef[] = [
  {
    id: "pv",
    type: "PVLOOP",
    title: "PV",
    w: 6,
    h: 6,
    config: {
      a: { visible: true, selectedSignals: ["LV"] },
      b: { visible: true, selectedSignals: ["LV"] },
    },
    isSettingsOpen: false,
  },
];

function captureBuildCurrentDoc(sceneOverrides: Partial<WorkbenchSceneState> = {}): BuildCurrentDoc {
  let captured: BuildCurrentDoc | null = null;
  const workspace = workspaceForPanels(panels);
  const scene = {
    instances,
    activeInstanceId: "b",
    sceneMeta: {
      title: "Active save test",
      description: "",
      modelLimitations: ["Known limitation"],
    },
    caseAuthor: "Author",
    currentCaseSource: { kind: "authored" },
    currentCaseDerivedFrom: undefined,
    currentCaseOwnerId: undefined,
    currentCaseInitialActiveScenarioId: "a",
    currentCaseDefaultLocale: "en",
    currentCaseAvailableLocales: ["en"],
    currentCaseI18n: undefined,
    currentCaseReading: undefined,
    currentCaseExposedControllers: undefined,
    currentCaseViews: [],
    currentCaseGraphBoardLayout: undefined,
    replaceSceneFromDoc: () => {},
    applySavedCase: () => {},
    ...sceneOverrides,
  } as unknown as WorkbenchSceneState;
  const panelState = {
    panels,
    workspace,
    notes: {},
    replacePanelState: () => {},
  } as unknown as WorkbenchPanelsState;

  function Harness() {
    const persistence = useWorkbenchPersistence({
      user: null,
      authLoading: false,
      signIn: async () => null,
      scene,
      panels: panelState,
      userEditedRef: { current: false },
      buildCurrentDocRef: { current: null },
      pushWarningToast: () => {},
    });
    captured = persistence.buildCurrentDoc;
    return null;
  }

  renderToString(React.createElement(MemoryRouter, { initialEntries: ["/en/workbench"] }, React.createElement(Harness)));
  if (!captured) throw new Error("buildCurrentDoc was not captured.");
  return captured;
}

describe("useWorkbenchPersistence", () => {
  it("persists the current active scenario on normal saves", () => {
    const doc = captureBuildCurrentDoc()({
      id: "case-active-b",
      createdAt: 1,
      updatedAt: 2,
    });

    expect(doc.initialActiveScenarioId).toBe("b");
  });

  it("lets fork overrides keep the viewer-active scenario", () => {
    const doc = captureBuildCurrentDoc({ activeInstanceId: "a", currentCaseInitialActiveScenarioId: "b" })({
      id: "case-fork",
      initialActiveScenarioId: "a",
      createdAt: 1,
      updatedAt: 2,
    });

    expect(doc.initialActiveScenarioId).toBe("a");
  });
});

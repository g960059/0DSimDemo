import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveCase } from "@/caseCloud";
import { workspaceForPanels, type CaseDocument } from "@/caseDoc";
import { DEFAULT_PARAMS } from "@/constants";
import { useWorkbenchPersistence, type BuildCurrentDoc } from "@/features/workbench/hooks/useWorkbenchPersistence";
import type { WorkbenchPanelsState } from "@/features/workbench/hooks/useWorkbenchPanels";
import type { WorkbenchSceneState } from "@/features/workbench/hooks/useWorkbenchScene";
import type { PanelDef, SimInstance } from "@/types";

vi.mock("@/caseCloud", () => ({
  createUserCaseId: vi.fn((title: string, uid: string, now: number) => `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${uid}-${now}`),
  fetchCase: vi.fn(),
  isValidCaseId: vi.fn((id: string) => /^[a-zA-Z0-9_-]+$/.test(id)),
  saveCase: vi.fn(async () => ({ ok: true })),
}));

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
    currentCaseDefaultEntry: "explore",
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

type CapturedPersistence = ReturnType<typeof useWorkbenchPersistence>;

function capturePersistence({
  sceneOverrides = {},
  user = { uid: "owner", displayName: "Owner", email: "owner@example.test" },
  signIn = async () => user,
  pushWarningToast = vi.fn(),
}: {
  sceneOverrides?: Partial<WorkbenchSceneState>;
  user?: { uid: string; displayName?: string | null; email?: string | null } | null;
  signIn?: () => Promise<{ uid: string; displayName?: string | null; email?: string | null } | null>;
  pushWarningToast?: (name: string, message: string) => void;
} = {}): { persistence: CapturedPersistence; applySavedCase: ReturnType<typeof vi.fn>; pushWarningToast: (name: string, message: string) => void } {
  let captured: CapturedPersistence | null = null;
  const workspace = workspaceForPanels(panels);
  const applySavedCase = vi.fn();
  const scene = {
    instances,
    activeInstanceId: "b",
    sceneMeta: {
      title: "Cloud save test",
      description: "Cloud description",
      modelLimitations: ["Known limitation"],
    },
    caseAuthor: "Author",
    currentCaseId: "owned-case",
    currentCaseOwnerId: "owner",
    currentCaseCreatedAt: 10,
    currentCaseSource: { kind: "authored" },
    currentCaseDerivedFrom: undefined,
    currentCaseInitialActiveScenarioId: "a",
    currentCaseDefaultLocale: "en",
    currentCaseAvailableLocales: ["en"],
    currentCaseI18n: undefined,
    currentCaseReading: undefined,
    currentCaseExposedControllers: undefined,
    currentCaseDefaultEntry: "explore",
    currentCaseStatus: "draft",
    currentCaseVisibility: "private",
    currentCaseViews: [],
    currentCaseGraphBoardLayout: undefined,
    replaceSceneFromDoc: () => {},
    applySavedCase,
    headerMode: "sandbox",
    ...sceneOverrides,
  } as unknown as WorkbenchSceneState;
  const panelState = {
    panels,
    workspace,
    notes: {},
    noteCaseKey: "note-key",
    replacePanelState: () => {},
  } as unknown as WorkbenchPanelsState;

  function Harness() {
    captured = useWorkbenchPersistence({
      user,
      authLoading: false,
      signIn,
      scene,
      panels: panelState,
      userEditedRef: { current: false },
      buildCurrentDocRef: { current: null },
      pushWarningToast,
    });
    return null;
  }

  renderToString(React.createElement(MemoryRouter, { initialEntries: ["/en/workbench/owned-case"] }, React.createElement(Harness)));
  if (!captured) throw new Error("persistence was not captured.");
  return { persistence: captured, applySavedCase, pushWarningToast };
}

describe("useWorkbenchPersistence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(saveCase).mockReset();
    vi.mocked(saveCase).mockResolvedValue({ ok: true });
  });

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

  it("preserves the current default entry on current-doc builds", () => {
    const doc = captureBuildCurrentDoc()({
      id: "case-default-entry",
      createdAt: 1,
      updatedAt: 2,
    });

    expect(doc.defaultEntry).toBe("explore");
  });

  it("preserves published status and visibility on normal Save", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const { persistence, applySavedCase } = capturePersistence({
      sceneOverrides: {
        currentCaseStatus: "published",
        currentCaseVisibility: "public",
      },
    });

    await persistence.saveCurrentCaseToCloud({ copy: false });

    expect(saveCase).toHaveBeenCalledTimes(1);
    const [savedDoc, uid, opts] = vi.mocked(saveCase).mock.calls[0] as [CaseDocument, string, { publish?: boolean; visibility?: string; kind?: string }];
    expect(uid).toBe("owner");
    expect(savedDoc.status).toBe("published");
    expect(savedDoc.visibility).toBe("public");
    expect(opts).toEqual({ visibility: "public", kind: "case" });
    expect(applySavedCase).toHaveBeenCalledWith(expect.objectContaining({
      status: "published",
      visibility: "public",
    }));
  });

  it("preserves the case default entry on a normal Save (does not drop scene defaultEntry)", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const { persistence } = capturePersistence({
      sceneOverrides: {
        currentCaseStatus: "published",
        currentCaseVisibility: "unlisted",
        currentCaseDefaultEntry: "explore",
      },
    });

    await persistence.saveCurrentCaseToCloud({ copy: false });

    const [savedDoc] = vi.mocked(saveCase).mock.calls[0] as [CaseDocument, string, unknown];
    expect(savedDoc.defaultEntry).toBe("explore");
  });

  it("publishes a fresh authoring doc with publish save options and saved status", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const { persistence, applySavedCase } = capturePersistence();

    const result = await persistence.publishCurrentCase({ visibility: "unlisted", defaultEntry: "explore" });

    expect(result.ok).toBe(true);
    expect(saveCase).toHaveBeenCalledTimes(1);
    const [savedDoc, uid, opts] = vi.mocked(saveCase).mock.calls[0] as [CaseDocument, string, { publish?: boolean; visibility?: string; kind?: string }];
    expect(uid).toBe("owner");
    expect(savedDoc.status).toBe("published");
    expect(savedDoc.visibility).toBe("unlisted");
    expect(savedDoc.defaultEntry).toBeUndefined();
    expect(opts).toEqual({ publish: true, visibility: "unlisted", kind: "case" });
    expect(applySavedCase).toHaveBeenCalledWith(expect.objectContaining({
      status: "published",
      visibility: "unlisted",
      defaultEntry: "explore",
    }));
  });

  it("does not call saveCase when the publish boundary guard finds blockers", async () => {
    const { persistence, applySavedCase } = capturePersistence({
      sceneOverrides: {
        sceneMeta: {
          title: "Blocked publish",
          description: "",
          modelLimitations: [""],
        },
      },
    });

    const result = await persistence.publishCurrentCase({ visibility: "public", defaultEntry: "explore" });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.issues?.map((issue) => issue.code) : []).toContain("publish.blocker.model-limitations-empty");
    expect(saveCase).not.toHaveBeenCalled();
    expect(applySavedCase).not.toHaveBeenCalled();
  });

  it("unpublishes an existing owned cloud case without the publish flag", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const { persistence, applySavedCase } = capturePersistence({
      sceneOverrides: {
        currentCaseStatus: "published",
        currentCaseVisibility: "public",
      },
    });

    const result = await persistence.unpublishCurrentCase();

    expect(result.ok).toBe(true);
    expect(saveCase).toHaveBeenCalledTimes(1);
    const [savedDoc, uid, opts] = vi.mocked(saveCase).mock.calls[0] as [CaseDocument, string, { publish?: boolean; visibility?: string; kind?: string }];
    expect(uid).toBe("owner");
    expect(savedDoc.status).toBe("draft");
    expect(savedDoc.visibility).toBe("public");
    expect(opts).toEqual({ visibility: "public", kind: "case" });
    expect(opts.publish).toBeUndefined();
    expect(applySavedCase).toHaveBeenCalledWith(expect.objectContaining({
      status: "draft",
      visibility: "public",
    }));
  });
});

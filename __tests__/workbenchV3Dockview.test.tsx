import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DockviewApi } from "dockview";
import { describe, expect, it, vi } from "vitest";
import "@/i18n";

import {
  archiveWorkbenchAnalysesV3,
  cloneWorkbenchAnalysisForScenarioV3,
  cloneWorkbenchScenarioAnalysesV3,
  cloneWorkbenchControlValuesV3,
  createWorkbenchBriefingSnapshotV3,
  invalidateWorkbenchScenarioAnalysisEquivalenceV3,
  modelLabEnabledV3,
  workbenchPublicationAvailableV3,
  reconcileWorkbenchBriefingV3,
  resolveWorkbenchBriefingEditorChangeV3,
  resolveWorkbenchInitialBriefingV3,
  resolveWorkbenchInitialSaveStateV3,
  shouldConfirmWorkbenchDiscardV3,
  resolveControlDraftCommitV3,
  resolveWorkbenchSurfaceAfterCommitV3,
  shouldAutoRequestStructuralReturnComparisonV3,
  shouldPublishWorkbenchRootFrameV3,
  structuralReturnComparisonRequestKeyV3,
  withoutWorkbenchScenarioAnalysisHistoryV3,
  workbenchAnalysisHistoryKeyV3,
  workbenchAnalysisMatchesFrameEpochV3,
  workbenchBriefingSourceScenariosMatchV3,
  workbenchBoundedGraphHistoryV3,
  workbenchStructuralHistoryAnalysisIdsV3,
  workbenchScenarioRuntimeStatusV3,
} from "@/components/WorkbenchV3Page";
import {
  createDefaultExperimentSurfaceV3,
  isWorkbenchGraphTraceExcludedV3,
  reconcileWorkbenchSurfaceScenariosV3,
  resolveWorkbenchControlPaneScenarioIdsV3,
  resolveWorkbenchGraphScenarioIdsV3,
  resolveWorkbenchOutputPaneScenarioIdV3,
  WORKBENCH_GRAPH_PANE_OPTIONS_V3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  DEFAULT_WORKBENCH_PANE_EDITOR_STRINGS_V3,
  addWorkbenchSurfacePaneV3,
  compareWorkbenchOutputPaneByScenarioV3,
  deleteWorkbenchSurfacePaneV3,
  duplicateWorkbenchSurfacePaneV3,
  updateWorkbenchGraphTraceCustomColorV3,
  updateWorkbenchSurfacePaneV3,
} from "@/components/workbench/WorkbenchPaneEditorV3";
import { WorkbenchPaneBindingButtonV3 } from "@/components/workbench/WorkbenchPaneBindingV3";
import { WorkbenchSimulationInfoPanelV3 } from "@/components/workbench/WorkbenchSimulationInfoV3";
import {
  DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3,
  WorkbenchScenarioManagerV3,
  suggestWorkbenchScenarioIdV3,
  suggestWorkbenchScenarioLabelV3,
} from "@/components/workbench/WorkbenchScenarioManagerV3";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  WorkbenchDockview,
  applyWorkbenchPanesV3,
  workbenchDockDropPositionAllowedForRoleV3,
  workbenchDockLayoutModeForRoleV3,
  reconcileWorkbenchPaneMembershipV3,
  reconcileWorkbenchPaneTitlesV3,
  reconcileWorkbenchPanesV3,
  resetWorkbenchDockviewTrackingV3,
  shouldRenderWorkbenchDockPanelV3,
  workbenchAddPaneAnchorForGroupV3,
  workbenchPanePlacementV3,
  workbenchPaneSplitDirectionsForRoleV3,
  type WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";
import {
  DEFAULT_WORKBENCH_AREA_LAYOUT_V3,
  WORKBENCH_AREA_LAYOUT_STORAGE_KEY_V3,
  loadWorkbenchAreaLayoutPreferenceV3,
  normalizeWorkbenchAreaLayoutPreferenceV3,
  saveWorkbenchAreaLayoutPreferenceV3,
} from "@/components/workbench/WorkbenchAreaLayoutV3";
import { loadStudioDefaultClientCompositionV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import { modelLimitationsAcknowledgementKey } from "@/components/ModelLimitations";
import { commitWorkbenchTransientAuthoringResultV3 } from "@/components/workbench/WorkbenchTransientAuthoringCommitV3";

describe("V3 Dockview Workbench", () => {
  it("keeps the single Model Lab development-only unless explicitly enabled", () => {
    expect(modelLabEnabledV3({ PROD: false })).toBe(true);
    expect(modelLabEnabledV3({ PROD: true })).toBe(false);
    expect(modelLabEnabledV3({
      PROD: true,
      VITE_MODEL_LAB_ENABLED: "1",
    })).toBe(true);
  });

  it("keeps dev releases saveable but outside public publication", () => {
    expect(workbenchPublicationAvailableV3({
      modelLab: false,
      releaseStage: "stable",
    })).toBe(true);
    expect(workbenchPublicationAvailableV3({
      modelLab: false,
      releaseStage: "dev",
    })).toBe(false);
    expect(workbenchPublicationAvailableV3({
      modelLab: true,
      releaseStage: "stable",
    })).toBe(false);
  });

  it("discloses human model information without implementation identities", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const contract = composition.contract;
    const markup = renderToStaticMarkup(
      <WorkbenchSimulationInfoPanelV3
        activeTab="model"
        currentModelId={contract.modelId}
        limitations={["Research and education only"]}
        models={[{
          contract,
          publicName: "Integrated haemodynamic model",
          shortLabel: "Main Wire V3",
          description: "Human-readable model description",
        }]}
        onClose={() => undefined}
        onTabChange={() => undefined}
        scenarios={[]}
      />,
    );

    expect(markup).toContain("Integrated haemodynamic model");
    expect(markup).toContain("Human-readable model description");
    expect(markup).not.toContain(contract.modelId);
    expect(markup).not.toContain(contract.fixtureSchemaId);
    expect(markup).not.toContain(contract.checkpointCodecId);
    expect(markup).not.toContain(contract.snapshotGateId);
  });

  it("keeps pane binding quiet for one Scenario and content-sized for comparison", () => {
    const common = {
      label: "連動：Baseline",
      modeLabel: "連動",
      onClick: () => undefined,
      targetLabel: "Baseline",
      testId: "binding-test",
    } as const;
    expect(renderToStaticMarkup(
      <WorkbenchPaneBindingButtonV3 {...common} visible={false} />,
    )).toBe("");

    const visible = renderToStaticMarkup(
      <WorkbenchPaneBindingButtonV3 {...common} visible />,
    );
    expect(visible).toContain('aria-label="連動：Baseline"');
    expect(visible).toContain("inline-flex");
    expect(visible).not.toContain(" w-full min-w-0");
    expect(visible).toContain("連動");
    expect(visible).toContain("Baseline");
  });

  it("preloads Placement Briefing independently from its neutral Snapshot", () => {
    const snapshot = createWorkbenchBriefingSnapshotV3({
      modelId: "model/main-wire-v3",
      scenarios: [{ scenarioId: "scenario/a", label: "A" }],
      surface: {
        graphPanes: [],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
      },
    });
    const sourceBriefing = reconcileWorkbenchBriefingV3({
      briefing: null,
      preferredFocusScenarioId: "scenario/a",
      defaultTitle: "A",
      snapshot,
    });
    expect(resolveWorkbenchInitialBriefingV3({
      current: null,
      sourceBriefing,
    })).toEqual(sourceBriefing);
    expect(resolveWorkbenchInitialBriefingV3({
      current: sourceBriefing,
      sourceBriefing: null,
    })).toBe(sourceBriefing);
    expect(resolveWorkbenchInitialBriefingV3({
      current: null,
      sourceBriefing: null,
    })).toBeNull();
  });

  it("treats a changed Scenario collection as a stale frozen Briefing source", () => {
    const snapshot = createWorkbenchBriefingSnapshotV3({
      modelId: "model/main-wire-v3",
      scenarios: [
        { scenarioId: "scenario/a", label: "A" },
        { scenarioId: "scenario/b", label: "B" },
      ],
      surface: {
        graphPanes: [],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
      },
    });
    const captured = snapshot.content.scenarios;

    expect(workbenchBriefingSourceScenariosMatchV3(snapshot, captured))
      .toBe(true);
    expect(workbenchBriefingSourceScenariosMatchV3(snapshot, [captured[0]!]))
      .toBe(false);
    expect(workbenchBriefingSourceScenariosMatchV3(snapshot, [
      captured[0]!,
      { ...captured[1]!, label: "Renamed" },
    ])).toBe(false);
  });

  it("owns duplicate control values independently from their source", () => {
    const source = Object.freeze({
      "control/systemic-resistance": 1,
      "control/venous-tone": 0.14,
    });
    const duplicate = cloneWorkbenchControlValuesV3(source);

    expect(duplicate).toEqual(source);
    expect(duplicate).not.toBe(source);
    expect(Object.isFrozen(duplicate)).toBe(true);
  });

  it("resolves one pane-level Scenario context and reconciles deleted targets", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const scenarios = [
      { scenarioId: "scenario/a" },
      { scenarioId: "scenario/b" },
    ] as const;
    const original = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/a",
    );
    const graph = original.graphPanes[0]!;
    const seriesId = graph.series[0]!.seriesId;
    const surface = {
      ...original,
      graphPanes: [{
        ...graph,
        scenarioScope: {
          mode: "fixed" as const,
          scenarioIds: ["scenario/a", "scenario/b"],
        },
        excludedTraces: [{ scenarioId: "scenario/b", seriesId }],
      }, ...original.graphPanes.slice(1)],
      controlPanes: [{
        ...original.controlPanes[0]!,
        binding: {
          mode: "fixed" as const,
          scenarioIds: ["scenario/a", "scenario/b"],
        },
      }],
      outputPanes: [{
        ...original.outputPanes[0]!,
        binding: {
          mode: "fixed" as const,
          scenarioId: "scenario/b",
        },
      }],
    };

    expect(resolveWorkbenchGraphScenarioIdsV3(
      surface.graphPanes[0]!,
      ["scenario/b", "scenario/a"],
    )).toEqual(["scenario/a", "scenario/b"]);
    expect(resolveWorkbenchGraphScenarioIdsV3(
      surface.graphPanes[0]!,
      ["scenario/a"],
    )).toEqual(["scenario/a"]);
    expect(isWorkbenchGraphTraceExcludedV3(
      surface.graphPanes[0]!,
      "scenario/b",
      seriesId,
    )).toBe(true);
    expect(resolveWorkbenchControlPaneScenarioIdsV3(
      surface.controlPanes[0]!,
      "scenario/b",
      scenarios,
    )).toEqual(["scenario/a", "scenario/b"]);
    expect(resolveWorkbenchOutputPaneScenarioIdV3(
      surface.outputPanes[0]!,
      "scenario/a",
      scenarios,
    )).toBe("scenario/b");

    const afterDelete = reconcileWorkbenchSurfaceScenariosV3(
      surface,
      [{ scenarioId: "scenario/a" }],
    );
    expect(afterDelete.graphPanes[0]?.scenarioScope).toEqual({
      mode: "fixed",
      scenarioIds: ["scenario/a"],
    });
    expect(afterDelete.graphPanes[0]?.excludedTraces).toEqual([]);
    expect(afterDelete.controlPanes[0]?.binding).toEqual({
      mode: "fixed",
      scenarioIds: ["scenario/a"],
    });
    expect(afterDelete.outputPanes[0]?.binding).toEqual({
      mode: "active-slot",
    });

    const afterAllFixedTargetsDisappear = reconcileWorkbenchSurfaceScenariosV3(
      surface,
      [{ scenarioId: "scenario/c" }],
    );
    expect(afterAllFixedTargetsDisappear.graphPanes[0]?.scenarioScope).toEqual({
      mode: "visible-scenarios",
    });
    expect(afterAllFixedTargetsDisappear.controlPanes[0]?.binding).toEqual({
      mode: "active-slot",
    });
    expect(afterAllFixedTargetsDisappear.outputPanes[0]?.binding).toEqual({
      mode: "active-slot",
    });
  });

  it("materializes only the current Output pane contract before persistence", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/a",
    );
    const outputPane = original.outputPanes[0]!;
    const { binding: _retiredBinding, ...preBindingPane } = outputPane;
    const staleSurface = {
      ...original,
      outputPanes: [{
        ...preBindingPane,
        transientScenarioLabel: "must not persist",
      }],
    } as unknown as typeof original;

    const materialized = reconcileWorkbenchSurfaceScenariosV3(
      staleSurface,
      [{ scenarioId: "scenario/a" }],
    );

    expect(materialized.outputPanes[0]?.binding).toEqual({
      mode: "active-slot",
    });
    expect(Object.keys(materialized.outputPanes[0]!).sort()).toEqual([
      "binding",
      "items",
      "label",
      "order",
      "paneId",
      "priority",
      "role",
    ]);
  });

  it("marks a new Workbench dirty until its first durable Save", () => {
    expect(
      resolveWorkbenchInitialSaveStateV3({
        hasStoredExperiment: false,
        hasPendingSurface: false,
        pendingSaveState: null,
      }),
    ).toBe("dirty");
    expect(
      resolveWorkbenchInitialSaveStateV3({
        hasStoredExperiment: true,
        hasPendingSurface: false,
        pendingSaveState: null,
      }),
    ).toBe("clean");
    expect(
      resolveWorkbenchInitialSaveStateV3({
        hasStoredExperiment: true,
        hasPendingSurface: true,
        pendingSaveState: null,
      }),
    ).toBe("dirty");
    expect(
      resolveWorkbenchInitialSaveStateV3({
        hasStoredExperiment: true,
        hasPendingSurface: false,
        pendingSaveState: "error",
      }),
    ).toBe("error");
  });

  it("prompts only for authored Session, title, or Briefing changes", () => {
    expect(shouldConfirmWorkbenchDiscardV3({
      hasUnsavedContentChanges: false,
      hasUncommittedTitleChanges: false,
      hasUncapturedBriefingChanges: false,
    })).toBe(false);
    expect(shouldConfirmWorkbenchDiscardV3({
      hasUnsavedContentChanges: true,
      hasUncommittedTitleChanges: false,
      hasUncapturedBriefingChanges: false,
    })).toBe(true);
    expect(shouldConfirmWorkbenchDiscardV3({
      hasUnsavedContentChanges: false,
      hasUncommittedTitleChanges: true,
      hasUncapturedBriefingChanges: false,
    })).toBe(true);
    expect(shouldConfirmWorkbenchDiscardV3({
      hasUnsavedContentChanges: false,
      hasUncommittedTitleChanges: false,
      hasUncapturedBriefingChanges: true,
    })).toBe(true);
  });

  it("treats a graph history depth of zero as no history", () => {
    const history = Object.freeze(["oldest", "older", "newer", "newest"]);
    expect(workbenchBoundedGraphHistoryV3(history, 0)).toEqual([]);
    expect(workbenchBoundedGraphHistoryV3(history, 1)).toEqual(["newest"]);
    expect(workbenchBoundedGraphHistoryV3(history, 3)).toEqual([
      "older",
      "newer",
      "newest",
    ]);
  });

  it("archives, deduplicates, caps, and prunes analysis epochs", () => {
    const analysis = (
      scenarioId: string,
      analysisId: string,
      inputEpoch: number,
      sourceAcceptedRevision = inputEpoch,
    ): StudioSimulationAnalysisV2 =>
      Object.freeze({
        modelId: "model/exact",
        runtimeSessionId: "runtime/1",
        scenarioId,
        inputEpoch,
        sourceAcceptedRevision,
        sourceAcceptedTimeSec: sourceAcceptedRevision * 0.002,
        analysisId,
        payload: { sourceAcceptedRevision },
      });
    let history: Readonly<
      Record<string, readonly StudioSimulationAnalysisV2[]>
    > = {};
    for (let epoch = 0; epoch <= 4; epoch += 1) {
      history = archiveWorkbenchAnalysesV3(history, [
        analysis("scenario/a", "analysis/systemic", epoch),
      ]);
    }
    const keyA = workbenchAnalysisHistoryKeyV3(
      "scenario/a",
      "analysis/systemic",
    );
    expect(history[keyA]?.map(({ inputEpoch }) => inputEpoch)).toEqual([
      2, 3, 4,
    ]);

    history = archiveWorkbenchAnalysesV3(history, [
      analysis("scenario/a", "analysis/systemic", 4, 99),
      analysis("scenario/b", "analysis/pulmonary", 4, 100),
    ]);
    expect(history[keyA]).toHaveLength(3);
    expect(history[keyA]?.at(-1)?.sourceAcceptedRevision).toBe(99);

    const pruned = withoutWorkbenchScenarioAnalysisHistoryV3(
      history,
      "scenario/a",
    );
    expect(pruned).not.toHaveProperty(keyA);
    expect(
      Object.values(pruned)
        .flat()
        .every(({ scenarioId }) => scenarioId === "scenario/b"),
    ).toBe(true);
    expect(withoutWorkbenchScenarioAnalysisHistoryV3(pruned, "missing")).toBe(
      pruned,
    );

    const current = analysis("scenario/a", "analysis/systemic", 4, 99);
    const frame = {
      modelId: current.modelId,
      runtimeSessionId: current.runtimeSessionId,
      scenarioId: current.scenarioId,
      inputEpoch: current.inputEpoch,
      acceptedRevision: 200,
      acceptedTimeSec: 0.4,
      outputs: {},
    } as StudioSimulationFrameV2;
    expect(workbenchAnalysisMatchesFrameEpochV3(current, frame)).toBe(true);
    expect(
      workbenchAnalysisMatchesFrameEpochV3(current, {
        ...frame,
        inputEpoch: 5,
      }),
    ).toBe(false);

    const duplicateFrame = {
      ...frame,
      runtimeSessionId: "runtime/duplicate",
      scenarioId: "scenario/duplicate",
      acceptedRevision: 201,
      acceptedTimeSec: 0.402,
    } as StudioSimulationFrameV2;
    const cloned = cloneWorkbenchScenarioAnalysesV3(
      { [keyA]: current },
      "scenario/a",
      duplicateFrame,
    );
    const duplicate = cloned[workbenchAnalysisHistoryKeyV3(
      "scenario/duplicate",
      "analysis/systemic",
    )]!;
    expect(workbenchAnalysisMatchesFrameEpochV3(
      duplicate,
      duplicateFrame,
    )).toBe(true);
    expect(duplicate.payload).toBe(current.payload);
    expect(cloned[keyA]).toBe(current);

    const lateDuplicate = cloneWorkbenchAnalysisForScenarioV3(
      current,
      duplicateFrame,
    );
    expect(lateDuplicate).toEqual(duplicate);
    const equivalence = new Map([
      ["scenario/duplicate", "scenario/a"],
      ["scenario/other-copy", "scenario/a"],
    ]);
    invalidateWorkbenchScenarioAnalysisEquivalenceV3(
      equivalence,
      new Set(["scenario/duplicate"]),
    );
    expect(equivalence).toEqual(new Map([
      ["scenario/other-copy", "scenario/a"],
    ]));
    invalidateWorkbenchScenarioAnalysisEquivalenceV3(
      equivalence,
      new Set(["scenario/a"]),
    );
    expect(equivalence.size).toBe(0);
  });

  it("selects every analysis-backed pane that retains visual history", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    const structural = composition.contract.graphCatalog.find(
      ({ renderer }) => renderer === "structural-return",
    )!;
    if (structural.renderer !== "structural-return") {
      throw new Error("expected a structural-return graph");
    }
    const configuredResult = addWorkbenchSurfacePaneV3(
      original,
      "graph",
      composition.contract,
      structural.graphId,
      "right",
    );
    const configured = configuredResult.surface;
    const targetPaneId = configuredResult.selectedPane!.paneId;
    expect(
      workbenchStructuralHistoryAnalysisIdsV3(configured, composition.contract),
    ).toEqual([structural.analysisId]);
    expect(
      workbenchStructuralHistoryAnalysisIdsV3(
        {
          ...configured,
          graphPanes: configured.graphPanes.map((pane) =>
            pane.paneId === targetPaneId ? { ...pane, historyDepth: 0 } : pane,
          ),
        },
        composition.contract,
      ),
    ).toEqual([structural.analysisId]);
  });

  it("preserves the live authority after transient Draft persistence failure and permits retry", () => {
    const adoptDurable = vi.fn();
    const persist = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("storage quota rejected setItem");
      })
      .mockReturnValueOnce("durable-experiment");

    expect(() =>
      commitWorkbenchTransientAuthoringResultV3({
        persist,
        adoptDurable,
      }),
    ).toThrow("storage quota rejected setItem");
    expect(adoptDurable).not.toHaveBeenCalled();

    expect(
      commitWorkbenchTransientAuthoringResultV3({
        persist,
        adoptDurable,
      }),
    ).toBe("durable-experiment");
    expect(adoptDurable).toHaveBeenCalledOnce();
  });

  it("renders a visible panel even when it is not globally active", () => {
    // Dockview can expose one visible panel in each split group even though
    // only one panel across the whole Dockview is globally active.
    const panel = { isActive: false, isVisible: true } as const;
    expect(
      shouldRenderWorkbenchDockPanelV3(panel.isActive, panel.isVisible),
    ).toBe(true);
  });

  it.each([true, false])(
    "never renders an invisible panel when global active is %s",
    (isActive) => {
      const panel = { isActive, isVisible: false } as const;
      expect(
        shouldRenderWorkbenchDockPanelV3(panel.isActive, panel.isVisible),
      ).toBe(false);
    },
  );

  it("renders an active visible panel", () => {
    expect(shouldRenderWorkbenchDockPanelV3(true, true)).toBe(true);
  });

  it("scopes limitations acknowledgement to the exact model disclosure", () => {
    expect(
      modelLimitationsAcknowledgementKey("model/dev-3:disclosure-v1"),
    ).toBe("circleheart.modelLimitations.ack.model%2Fdev-3%3Adisclosure-v1");
    expect(
      modelLimitationsAcknowledgementKey("model/dev-4:disclosure-v1"),
    ).not.toBe(modelLimitationsAcknowledgementKey("model/dev-3:disclosure-v1"));
  });

  it("starts with only LVP/LAP/AoP and the LV pressure-volume loop", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const graphPanes = surface.graphPanes;
    const outputPane = surface.outputPanes[0]!;
    const controlPane = surface.controlPanes[0]!;

    expect(
      graphPanes.map(({ graphId, series }) => ({
        graphId,
        seriesIds: series.map(({ seriesId }) => seriesId),
      })),
    ).toEqual([
      {
        graphId: "hemodynamics.pressure.waveform",
        seriesIds: ["LVP", "LAP", "AoP"],
      },
      {
        graphId: "hemodynamics.pressure-volume",
        seriesIds: ["LV"],
      },
    ]);
    expect(outputPane.items.map(({ outputId }) => outputId)).toEqual([
      "rhythm.heart-rate.instantaneous",
      "hemodynamics.output.native-left",
      "hemodynamics.pressure.mean.Ao",
      "hemodynamics.ejection-fraction.LV-extrema",
      "hemodynamics.pressure.mean.LA",
    ]);
    expect(outputPane.binding).toEqual({ mode: "active-slot" });
    expect(controlPane.items.map(({ controlId }) => controlId)).toEqual([
      "rhythm.heart-rate-bpm",
      "hemodynamics.total-blood-volume-ml",
      "hemodynamics.systemic-resistance",
      "hemodynamics.venous-tone",
      "ventilation.peep-cm-h2o",
    ]);
    expect(controlPane.items.length).toBeGreaterThan(0);
    expect(graphPanes).toHaveLength(2);
    expect(graphPanes[1]?.pressureVolumeAnalysisMode).toBe(
      "responsive-preview",
    );
    expect(Object.isFrozen(graphPanes)).toBe(true);
    expect(Object.isFrozen(outputPane.items)).toBe(true);
    expect("colorHex" in outputPane).toBe(false);
    expect("colorHex" in controlPane).toBe(false);
    expect(outputPane.items.every((item) => !("colorHex" in item))).toBe(true);
    expect(
      controlPane.items.every(
        (item) => !("colorHex" in item) && !("targetScenarioIds" in item),
      ),
    ).toBe(true);
    for (const pane of graphPanes) {
      const graph = composition.contract.graphCatalog.find(
        ({ graphId }) => graphId === pane.graphId,
      )!;
      expect("windowSec" in pane).toBe(graph.renderer === "sweep");
      expect("historyDepth" in pane).toBe(graph.renderer !== "sweep");
      if (graph.renderer !== "structural-return") {
        expect(
          pane.series.every(({ seriesId }) =>
            graph.seriesCatalog.some(
              (candidate) => candidate.seriesId === seriesId,
            ),
          ),
        ).toBe(true);
      }
      if (graph.renderer === "sweep") {
        expect(pane.windowSec).toBe(2);
      } else {
        expect(pane.historyDepth).toBe(1);
      }
    }
  });

  it("resolves authored sweep series only through the graph-owned catalog", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const pressurePane = surface.graphPanes.find(
      ({ graphId }) => graphId === "hemodynamics.pressure.waveform",
    )!;
    const pressureGraph = composition.contract.graphCatalog.find(
      ({ graphId }) => graphId === pressurePane.graphId,
    )!;
    if (pressureGraph.renderer !== "sweep") {
      throw new Error("expected the pressure waveform graph");
    }
    const selectedBindings = pressurePane.series.map(({ seriesId }) =>
      pressureGraph.seriesCatalog.find(
        (series) => series.seriesId === seriesId,
      )!,
    );
    const selectedOutputs = selectedBindings.map(({ outputId }) =>
      composition.contract.outputCatalog.find(
        (output) => output.outputId === outputId,
      )!,
    );

    expect(selectedBindings.map(({ seriesId }) => seriesId)).toEqual([
      "LVP",
      "LAP",
      "AoP",
    ]);
    expect(
      selectedOutputs.every(
        (output) =>
          output.kind === "signal" &&
          output.shape === "scalar" &&
          output.unit === "mmHg",
      ),
    ).toBe(true);
  });

  it("keeps custom pane presentation in the Experiment Surface", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    const added = addWorkbenchSurfacePaneV3(
      original,
      "output",
      composition.contract,
    );
    expect(added.selectedPane).not.toBeNull();
    const selectedPane = added.selectedPane!;
    const customized = updateWorkbenchSurfacePaneV3(
      added.surface,
      selectedPane,
      (pane) => ({
        ...pane,
        label: "Primary readouts",
      }),
    );
    const customPane = customized.outputPanes.find(
      ({ paneId }) => paneId === selectedPane.paneId,
    );
    expect(customPane).toMatchObject({
      label: "Primary readouts",
      role: "output",
    });
    expect(customPane?.items).toHaveLength(1);
    expect(customPane === undefined ? true : "colorHex" in customPane).toBe(
      false,
    );
    const deleted = deleteWorkbenchSurfacePaneV3(customized, selectedPane);
    expect(deleted.deleted).toBe(true);
    expect(deleted.surface.outputPanes).toHaveLength(1);
    const deleteLast = deleteWorkbenchSurfacePaneV3(deleted.surface, {
      kind: "output",
      paneId: deleted.surface.outputPanes[0]!.paneId,
    });
    expect(deleteLast.deleted).toBe(true);
    expect(deleteLast.surface.outputPanes).toEqual([]);
    expect(deleteLast.nextSelectedPane).toBeNull();
  });

  it("duplicates a split pane with independent authored items", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const source = surface.graphPanes[0]!;
    const duplicated = duplicateWorkbenchSurfacePaneV3(surface, {
      kind: "graph",
      paneId: source.paneId,
    });
    const copy = duplicated.surface.graphPanes.at(-1)!;
    expect(copy.paneId).not.toBe(source.paneId);
    expect(copy.graphId).toBe(source.graphId);
    expect(copy.series).toEqual(source.series);
    expect(copy.series).not.toBe(source.series);
    expect(copy.series[0]).not.toBe(source.series[0]);
    expect(copy.traceColors).toEqual(source.traceColors);
    expect(copy.traceColors).not.toBe(source.traceColors);
    expect(copy.traceColors?.[0]).not.toBe(source.traceColors?.[0]);
  });

  it("compares Output panes by fixing one whole pane per Scenario", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/a",
    );
    const source = surface.outputPanes[0]!;
    const scenarios = [
      { scenarioId: "scenario/a" },
      { scenarioId: "scenario/b" },
      { scenarioId: "scenario/c" },
    ] as const;

    const firstComparison = compareWorkbenchOutputPaneByScenarioV3(surface, {
      paneId: source.paneId,
      activeScenarioId: "scenario/a",
      scenarios,
    });
    expect(firstComparison.paneId).not.toBeNull();
    expect(firstComparison.surface.outputPanes).toHaveLength(2);
    expect(firstComparison.surface.outputPanes[0]?.binding).toEqual({
      mode: "fixed",
      scenarioId: "scenario/a",
    });
    expect(firstComparison.surface.outputPanes[1]?.binding).toEqual({
      mode: "fixed",
      scenarioId: "scenario/b",
    });
    expect(firstComparison.surface.outputPanes[1]?.items).toEqual(source.items);
    expect(firstComparison.surface.outputPanes[1]?.items).not.toBe(source.items);

    const secondComparison = compareWorkbenchOutputPaneByScenarioV3(
      firstComparison.surface,
      {
        paneId: source.paneId,
        activeScenarioId: "scenario/b",
        scenarios,
      },
    );
    expect(secondComparison.surface.outputPanes).toHaveLength(3);
    expect(secondComparison.surface.outputPanes[2]?.binding).toEqual({
      mode: "fixed",
      scenarioId: "scenario/c",
    });

    const exhausted = compareWorkbenchOutputPaneByScenarioV3(
      secondComparison.surface,
      {
        paneId: source.paneId,
        activeScenarioId: "scenario/c",
        scenarios,
      },
    );
    expect(exhausted.paneId).toBeNull();
    expect(exhausted.surface).toBe(secondComparison.surface);
  });

  it("updates and resets one exact Scenario/item color without touching siblings", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const pane = createDefaultExperimentSurfaceV3(composition.contract)
      .graphPanes[0]!;
    const first = pane.traceColors![0]!;
    const sibling = pane.traceColors![1]!;
    const customized = updateWorkbenchGraphTraceCustomColorV3(pane, {
      scenarioId: first.scenarioId,
      seriesId: first.seriesId,
      colorHex: "#db2777",
    });
    const withSibling = updateWorkbenchGraphTraceCustomColorV3(customized, {
      scenarioId: sibling.scenarioId,
      seriesId: sibling.seriesId,
      colorHex: "#167db8",
    });

    expect(
      withSibling.traceColors?.find(
        (trace) =>
          trace.scenarioId === first.scenarioId &&
          trace.seriesId === first.seriesId,
      )?.customColorHex,
    ).toBe("#db2777");
    expect(
      withSibling.traceColors?.find(
        (trace) =>
          trace.scenarioId === sibling.scenarioId &&
          trace.seriesId === sibling.seriesId,
      )?.customColorHex,
    ).toBe("#167db8");
    const reset = updateWorkbenchGraphTraceCustomColorV3(withSibling, {
      scenarioId: first.scenarioId,
      seriesId: first.seriesId,
      colorHex: null,
    });
    expect(
      reset.traceColors?.find(
        (trace) =>
          trace.scenarioId === first.scenarioId &&
          trace.seriesId === first.seriesId,
      ),
    ).toEqual(first);
    expect(
      reset.traceColors?.find(
        (trace) =>
          trace.scenarioId === sibling.scenarioId &&
          trace.seriesId === sibling.seriesId,
      )?.customColorHex,
    ).toBe("#167db8");
  });

  it("preserves role-specific and explicitly empty Briefings across Worker restart", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const snapshot = createWorkbenchBriefingSnapshotV3({
      defaultTitle: "Workbench experiment",
      modelId: composition.contract.modelId,
      scenarios: [
        { scenarioId: "scenario/default", label: "Baseline" },
        { scenarioId: "scenario/comparison", label: "Comparison" },
      ],
      surface,
    });
    const defaultBriefing = reconcileWorkbenchBriefingV3({
      briefing: null,
      preferredFocusScenarioId: "scenario/comparison",
      snapshot,
    });
    expect(defaultBriefing.scenarioScope.initialFocusScenarioId).toBe(
      "scenario/comparison",
    );
    expect(
      defaultBriefing.controls.every(
        (control) =>
          control.binding.mode === "fixed" &&
          control.binding.scenarioIds[0] === "scenario/comparison",
      ),
    ).toBe(true);

    const explicitEmpty = {
      defaultTitle: "Workbench experiment",
      scenarioScope: {
        visibleScenarioIds: ["scenario/default"],
        initialFocusScenarioId: "scenario/default",
      },
      graphs: [],
      outputs: [],
      controls: [],
    } as const;
    expect(
      reconcileWorkbenchBriefingV3({
        briefing: explicitEmpty,
        preferredFocusScenarioId: "scenario/comparison",
        snapshot,
      }),
    ).toEqual(explicitEmpty);
    expect(reconcileWorkbenchBriefingV3({
      briefing: { ...explicitEmpty, defaultTitle: "Stale title" },
      preferredFocusScenarioId: "scenario/default",
      defaultTitle: "Workbench experiment",
      snapshot,
    }).defaultTitle).toBe("Workbench experiment");

    const graph = surface.graphPanes[0]!;
    const partial = {
      ...explicitEmpty,
      graphs: [
        {
          paneId: graph.paneId,
          order: 0,
          emphasis: "primary" as const,
          overrides: {
            label: "Article pressure",
            legend: "compact" as const,
            series: graph.series.slice(0, 1).map((series) => ({
              ...series,
              label: "Focused series",
              order: 0,
            })),
            traceColors: graph.series.slice(0, 1).map((series) => ({
              scenarioId: "scenario/default",
              seriesId: series.seriesId,
              colorHex: "#3ea8ff",
            })),
            ...(graph.windowSec === undefined
              ? {}
              : { windowSec: graph.windowSec }),
            ...(graph.historyDepth === undefined
              ? {}
              : { historyDepth: graph.historyDepth }),
          },
        },
      ],
    };
    const reconciled = reconcileWorkbenchBriefingV3({
      briefing: partial,
      preferredFocusScenarioId: "scenario/default",
      snapshot,
    });
    expect(reconciled.graphs).toEqual(partial.graphs);
    expect(reconciled.outputs).toEqual([]);
    expect(reconciled.controls).toEqual([]);
  });

  it("materializes the active slot only for a newly picked control", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const snapshot = createWorkbenchBriefingSnapshotV3({
      modelId: composition.contract.modelId,
      scenarios: [
        { scenarioId: "scenario/default", label: "Baseline" },
        { scenarioId: "scenario/comparison", label: "Comparison" },
      ],
      surface,
    });
    const defaults = reconcileWorkbenchBriefingV3({
      briefing: null,
      preferredFocusScenarioId: "scenario/default",
      snapshot,
    });
    const control = defaults.controls[0]!;
    const current = {
      ...defaults,
      scenarioScope: {
        visibleScenarioIds: ["scenario/default"],
        initialFocusScenarioId: "scenario/default",
      },
      controls: [],
    };
    const picked = resolveWorkbenchBriefingEditorChangeV3({
      activeScenarioId: "scenario/comparison",
      current,
      next: { ...current, controls: [control] },
      snapshot,
    });
    expect(picked.scenarioScope.visibleScenarioIds).toEqual([
      "scenario/default",
      "scenario/comparison",
    ]);
    expect(picked.controls[0]?.binding).toEqual({
      mode: "fixed",
      scenarioIds: ["scenario/comparison"],
      application: "absolute",
    });

    const refocused = resolveWorkbenchBriefingEditorChangeV3({
      activeScenarioId: "scenario/default",
      current: picked,
      next: picked,
      snapshot,
    });
    expect(refocused.controls[0]?.binding).toEqual(picked.controls[0]?.binding);
  });

  it("copies a fixed source-pane binding instead of the active capture slot", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    const surface = {
      ...original,
      controlPanes: [{
        ...original.controlPanes[0]!,
        binding: {
          mode: "fixed" as const,
          scenarioIds: ["scenario/default"],
        },
      }],
    };
    const snapshot = createWorkbenchBriefingSnapshotV3({
      modelId: composition.contract.modelId,
      scenarios: [
        { scenarioId: "scenario/default", label: "Baseline" },
        { scenarioId: "scenario/comparison", label: "Comparison" },
      ],
      surface,
    });

    const briefing = reconcileWorkbenchBriefingV3({
      briefing: null,
      preferredFocusScenarioId: "scenario/comparison",
      snapshot,
    });
    expect(briefing.controls[0]?.binding).toEqual({
      mode: "fixed",
      scenarioIds: ["scenario/default"],
      application: "absolute",
    });
  });

  it.each(["graph", "output", "control"] as const)(
    "adds and deletes every %s pane, including the final pane",
    async (kind) => {
      const composition = await loadStudioDefaultClientCompositionV2();
      const original = createDefaultExperimentSurfaceV3(
        composition.contract,
        "scenario/default",
      );
      const panes = (surface: typeof original) =>
        kind === "graph"
          ? surface.graphPanes
          : kind === "output"
            ? surface.outputPanes
            : surface.controlPanes;
      const added = addWorkbenchSurfacePaneV3(
        original,
        kind,
        composition.contract,
        kind === "graph" ? "hemodynamics.flow.waveform" : undefined,
      );
      expect(added.selectedPane?.kind).toBe(kind);
      expect(panes(added.surface)).toHaveLength(panes(original).length + 1);

      let emptied = added.surface;
      for (const pane of [...panes(emptied)]) {
        const deleted = deleteWorkbenchSurfacePaneV3(emptied, {
          kind,
          paneId: pane.paneId,
        });
        expect(deleted.deleted).toBe(true);
        emptied = deleted.surface;
      }
      expect(panes(emptied)).toEqual([]);
    },
  );

  it("constructs four unit-safe graph families with one circulation per structural pane", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    expect([
      ...new Set(WORKBENCH_GRAPH_PANE_OPTIONS_V3.map(({ graphId }) => graphId)),
    ]).toEqual(
      composition.contract.graphCatalog
        .map(({ graphId }) => graphId)
        .sort((left, right) => {
          const order = [
            "hemodynamics.pressure-volume",
            "hemodynamics.pressure.waveform",
            "hemodynamics.flow.waveform",
            "hemodynamics.guyton-starling",
          ];
          return order.indexOf(left) - order.indexOf(right);
        }),
    );
    for (const option of WORKBENCH_GRAPH_PANE_OPTIONS_V3) {
      const added = addWorkbenchSurfacePaneV3(
        original,
        "graph",
        composition.contract,
        option.graphId,
        "structuralSide" in option ? option.structuralSide : undefined,
      );
      const pane = added.surface.graphPanes.at(-1)!;
      const graph = composition.contract.graphCatalog.find(
        ({ graphId }) => graphId === option.graphId,
      )!;
      expect(pane.graphId).toBe(option.graphId);
      expect("windowSec" in pane).toBe(graph.renderer === "sweep");
      expect("historyDepth" in pane).toBe(graph.renderer !== "sweep");
      if (graph.renderer === "structural-return") {
        if (!("structuralSide" in option)) {
          throw new Error("structural pane option must select one circulation");
        }
        expect(pane.structuralSide).toBe(option.structuralSide);
        expect(pane.label).toContain(
          option.structuralSide === "right" ? "Systemic" : "Pulmonary",
        );
      }
      expect(pane.series).toEqual(
        graph.renderer === "structural-return"
          ? []
          : expect.arrayContaining(
              graph.defaultSeriesIds.map((seriesId) =>
                expect.objectContaining({ seriesId }),
              ),
            ),
      );
    }

    const systemic = addWorkbenchSurfacePaneV3(
      original,
      "graph",
      composition.contract,
      "hemodynamics.guyton-starling",
      "right",
    );
    const pulmonary = addWorkbenchSurfacePaneV3(
      systemic.surface,
      "graph",
      composition.contract,
      "hemodynamics.guyton-starling",
      "left",
    );
    const structuralPanes = pulmonary.surface.graphPanes.filter(
      ({ graphId }) => graphId === "hemodynamics.guyton-starling",
    );
    expect(structuralPanes).toHaveLength(2);
    expect(new Set(structuralPanes.map(({ paneId }) => paneId)).size).toBe(2);
    expect(structuralPanes.map(({ structuralSide }) => structuralSide)).toEqual(
      ["right", "left"],
    );
  });

  it("keeps an empty role area recoverable through an explicit add action", () => {
    const html = renderToStaticMarkup(
      <WorkbenchDockview
        ariaLabel="Output area"
        panes={[]}
        role="output"
        renderPane={() => null}
        addPaneLabel="Add output pane"
        emptyPaneLabel="No output panes"
        onAddPane={() => undefined}
      />,
    );

    expect(html).toContain("No output panes");
    expect(html).toContain("Add output pane");
  });

  it("keeps output and control pane composition Scenario-neutral", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const baselineSurface = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/baseline",
    );
    const alternateSurface = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/as",
    );
    expect(alternateSurface.outputPanes).toEqual(baselineSurface.outputPanes);
    expect(alternateSurface.controlPanes).toEqual(baselineSurface.controlPanes);
    expect(JSON.stringify(baselineSurface.outputPanes)).not.toMatch(
      /colorHex|targetScenarioIds/,
    );
    expect(JSON.stringify(baselineSurface.controlPanes)).not.toMatch(
      /colorHex|targetScenarioIds/,
    );
  });

  it("suggests portable collision-free Scenario identities and labels", () => {
    expect(
      suggestWorkbenchScenarioIdV3(
        "preset/healthy",
        new Set(["scenario/healthy", "scenario/healthy-2"]),
      ),
    ).toBe("scenario/healthy-3");
    expect(
      suggestWorkbenchScenarioLabelV3(
        "Healthy",
        new Set(["Healthy", "Healthy 2"]),
      ),
    ).toBe("Healthy 3");
  });

  it("keeps the Scenario Manager independent from controller pane content", () => {
    const html = renderToStaticMarkup(
      <WorkbenchScenarioManagerV3
        variant="embedded"
        modelId="model/main-wire-v3"
        scenarios={[{ scenarioId: "scenario/healthy", label: "Healthy" }]}
        activeScenarioId="scenario/healthy"
        pendingScenarioIds={["scenario/healthy"]}
        scenarioBaseColors={[
          {
            scenarioId: "scenario/healthy",
            colorHex: "#8b76d1",
          },
        ]}
        presets={[]}
        strings={DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3}
        onSelectScenario={() => {}}
        onChangeScenarioBaseColor={() => {}}
        onAddFromPreset={() => {}}
        onDuplicateScenario={() => {}}
        onRenameScenario={() => {}}
        onDeleteScenario={() => {}}
      />,
    );
    expect(html).toContain('data-scenario-manager-variant="embedded"');
    expect(html).not.toContain("controller-scenario-id");
    expect(html).not.toContain("controller-for");
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('aria-label="Base color for new traces: Healthy"');
    expect(html).toContain('value="#8b76d1"');
    expect(html).toContain('data-scenario-analysis-pending="true"');
    expect(html).toContain("Recalculating Guyton / Starling: Healthy");
  });

  it("disables Scenario creation at the four-Scenario comparison limit", () => {
    const limitReason = "At most 4 Scenarios can be compared.";
    const html = renderToStaticMarkup(
      <WorkbenchScenarioManagerV3
        variant="embedded"
        modelId="model/main-wire-v3"
        scenarios={Array.from({ length: 4 }, (_, index) => ({
          scenarioId: `scenario/${index + 1}`,
          label: `Scenario ${index + 1}`,
        }))}
        activeScenarioId="scenario/1"
        presets={[
          {
            schemaId: "circleheart-studio-scenario-preset-v2",
            presetId: "preset/healthy",
            modelId: "model/main-wire-v3",
            title: "Healthy",
            description: "Baseline",
            capture: {
              fixture: {},
              checkpoint: {
                acceptedRevision: 0,
                acceptedTimeSec: 0,
                payload: {},
              },
            },
          },
        ]}
        strings={{
          ...DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3,
          scenarioLimitReached: limitReason,
        }}
        onSelectScenario={() => {}}
        onAddFromPreset={() => {}}
        onDuplicateScenario={() => {}}
        onRenameScenario={() => {}}
        onDeleteScenario={() => {}}
      />,
    );

    expect(html.match(new RegExp(`title="${limitReason}"`, "g"))).toHaveLength(
      1,
    );
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });

  it("keys structural auto-analysis by the missing Scenario set and retries after busy", () => {
    const analysisId = "analysis/structural-return";
    const scenarioAKey = structuralReturnComparisonRequestKeyV3(analysisId, [
      "scenario/a",
    ]);
    const scenarioBKey = structuralReturnComparisonRequestKeyV3(analysisId, [
      "scenario/b",
    ]);
    expect(scenarioAKey).not.toBe(scenarioBKey);
    expect(structuralReturnComparisonRequestKeyV3(analysisId, [])).toBeNull();

    expect(
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable: true,
        currentRequestKey: scenarioAKey,
        lastAutoRequestedKey: null,
        operationPending: false,
      }),
    ).toBe(true);
    expect(
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable: true,
        currentRequestKey: scenarioBKey,
        lastAutoRequestedKey: scenarioAKey,
        operationPending: false,
      }),
    ).toBe(true);
    // A competing pane waits while the global operation is occupied, then
    // becomes admissible when the busy state returns to false.
    expect(
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable: true,
        currentRequestKey: scenarioBKey,
        lastAutoRequestedKey: scenarioAKey,
        operationPending: true,
      }),
    ).toBe(false);
    expect(
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable: true,
        currentRequestKey: scenarioBKey,
        lastAutoRequestedKey: scenarioAKey,
        operationPending: false,
      }),
    ).toBe(true);
    expect(
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable: true,
        currentRequestKey: scenarioBKey,
        lastAutoRequestedKey: scenarioBKey,
        operationPending: false,
      }),
    ).toBe(false);
  });

  it("preserves Surface edits submitted after an asynchronous durable operation", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const durableSurface = createDefaultExperimentSurfaceV3(
      composition.contract,
    );
    const editedSurface = {
      ...durableSurface,
      note: { text: "written while snapshot qualification was running" },
    };
    const unchanged = resolveWorkbenchSurfaceAfterCommitV3({
      submittedMutationRevision: 4,
      currentMutationRevision: 4,
      currentSurface: durableSurface,
      durableSurface,
    });
    expect(unchanged).toEqual({
      surface: durableSurface,
      hasNewerMutations: false,
    });

    const changed = resolveWorkbenchSurfaceAfterCommitV3({
      submittedMutationRevision: 4,
      currentMutationRevision: 5,
      currentSurface: editedSurface,
      durableSurface,
    });
    expect(changed.surface).toBe(editedSurface);
    expect(changed.hasNewerMutations).toBe(true);
  });

  it("publishes the exact final root frame when playback pauses", () => {
    expect(
      shouldPublishWorkbenchRootFrameV3({
        acceptedTimeSec: 1.052,
        lastPublishedTimeSec: 1,
        schedulerRunning: true,
      }),
    ).toBe(false);
    expect(
      shouldPublishWorkbenchRootFrameV3({
        acceptedTimeSec: 1.052,
        lastPublishedTimeSec: 1,
        schedulerRunning: false,
      }),
    ).toBe(true);
  });

  it("labels every concurrently simulated Scenario from global playback", () => {
    expect(workbenchScenarioRuntimeStatusV3(true)).toBe("Live");
    expect(workbenchScenarioRuntimeStatusV3(false)).toBe("Paused");
  });

  it("restores the accepted control value after a rejected commit", async () => {
    const control = {
      controlId: "hemodynamics.systemic-resistance",
      valueType: "number" as const,
      unit: "1",
      minimum: 0.75,
      maximum: 1.25,
      step: 0.01,
      defaultValue: 1,
      changeSemantics: "accepted-state-warm-start" as const,
    };
    const reject = vi.fn(async () => false);
    const accept = vi.fn(async () => true);

    await expect(
      resolveControlDraftCommitV3({
        acceptedValue: 1,
        candidate: 1.2,
        control,
        onCommit: reject,
      }),
    ).resolves.toEqual({ accepted: false, displayValue: 1 });
    await expect(
      resolveControlDraftCommitV3({
        acceptedValue: 1,
        candidate: 1.2,
        control,
        onCommit: accept,
      }),
    ).resolves.toEqual({ accepted: true, displayValue: 1.2 });
    expect(reject).toHaveBeenCalledWith(1.2);
    expect(accept).toHaveBeenCalledWith(1.2);
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

  it("uses one tab group for narrow graph panes and a desktop split", () => {
    expect(
      [0, 1, 2, 3].map((index) => workbenchPanePlacementV3(index, "tabs")),
    ).toEqual(["first", "within", "within", "within"]);
    // Desktop stays at two columns: pane 2 starts the right-hand group and
    // panes 3+ join its tab strip.
    expect(
      [0, 1, 2, 3].map((index) => workbenchPanePlacementV3(index, "split")),
    ).toEqual(["first", "right", "within", "within"]);
  });

  it("constrains split axes by role and adds controller panes as tabs", () => {
    expect(workbenchPaneSplitDirectionsForRoleV3("graph")).toEqual([
      "right",
      "below",
    ]);
    expect(workbenchPaneSplitDirectionsForRoleV3("output")).toEqual(["right"]);
    expect(workbenchPaneSplitDirectionsForRoleV3("control")).toEqual(["below"]);
    expect(workbenchDockLayoutModeForRoleV3("output", false)).toBe("split");
    expect(workbenchDockLayoutModeForRoleV3("control", false)).toBe("tabs");
    expect(workbenchDockLayoutModeForRoleV3("control", true)).toBe("tabs");
    expect(workbenchDockDropPositionAllowedForRoleV3("output", "right")).toBe(
      true,
    );
    expect(workbenchDockDropPositionAllowedForRoleV3("output", "bottom")).toBe(
      false,
    );
    expect(workbenchDockDropPositionAllowedForRoleV3("control", "bottom")).toBe(
      true,
    );
    expect(workbenchDockDropPositionAllowedForRoleV3("control", "right")).toBe(
      false,
    );
    expect(workbenchDockDropPositionAllowedForRoleV3("control", "center")).toBe(
      true,
    );
  });

  it("anchors an add action inside every Dockview tab group", () => {
    expect(workbenchAddPaneAnchorForGroupV3(["pane/one"])).toBe("pane/one");
    expect(workbenchAddPaneAnchorForGroupV3(["pane/two", "pane/three"])).toBe(
      "pane/three",
    );
    expect(workbenchAddPaneAnchorForGroupV3([])).toBeUndefined();
    expect("addPane" in DEFAULT_WORKBENCH_PANE_EDITOR_STRINGS_V3).toBe(false);
  });

  it("adds a pane to the exact group whose adjacent add action was used", () => {
    const leftGroup = { id: "left-group" };
    const rightGroup = { id: "right-group" };
    const setActive = vi.fn();
    let paneAdded = false;
    const addPanel = vi.fn(() => {
      paneAdded = true;
    });
    const clear = vi.fn();
    const api = {
      activePanel: { id: "graph/right" },
      addPanel,
      clear,
      panels: [
        { id: "graph/pressure", group: leftGroup },
        { id: "graph/pv", group: rightGroup },
        { id: "graph/flow", group: leftGroup },
      ],
      getPanel: vi.fn((paneId: string) => {
        if (paneId === "graph/pressure" || paneId === "graph/flow") {
          return { group: leftGroup, api: { setActive: vi.fn() } };
        }
        if (paneId === "graph/pv") {
          return { group: rightGroup, api: { setActive: vi.fn() } };
        }
        if (paneId === "graph/starling" && paneAdded) {
          return { group: leftGroup, api: { setActive } };
        }
        return undefined;
      }),
    } as unknown as DockviewApi;
    const panes: readonly WorkbenchPaneDefinitionV3[] = [
      { paneId: "graph/pressure", role: "graph", title: "Pressure" },
      { paneId: "graph/pv", role: "graph", title: "PV loop" },
      { paneId: "graph/flow", role: "graph", title: "Flow" },
      {
        paneId: "graph/starling",
        role: "graph",
        title: "Systemic Guyton / Starling",
      },
    ];

    applyWorkbenchPanesV3(
      api,
      panes,
      "split",
      null,
      { paneId: "graph/starling", anchorPaneId: "graph/flow" },
    );

    expect(clear).not.toHaveBeenCalled();
    expect(addPanel).toHaveBeenCalledOnce();
    expect(addPanel).toHaveBeenCalledWith(expect.objectContaining({
      id: "graph/starling",
      position: {
        referenceGroup: leftGroup,
        direction: "within",
      },
    }));
    expect(setActive).toHaveBeenCalledOnce();
  });

  it("rejects a pane placed into a different role area", () => {
    const pane: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "output-1",
      role: "output",
      title: "Outputs",
    });

    expect(() =>
      renderToStaticMarkup(
        <WorkbenchDockview
          ariaLabel="Graph area"
          panes={[pane]}
          role="graph"
          renderPane={() => null}
        />,
      ),
    ).toThrow(/graph area cannot host output pane output-1/);
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

  it("removes the rightmost output pane without rebuilding or splitting survivors", () => {
    const leftGroup = { id: "left" };
    const rightGroup = { id: "right" };
    const panels = [
      { id: "output-1", group: leftGroup },
      { id: "output-2", group: leftGroup },
      { id: "output-3", group: rightGroup },
    ];
    const clear = vi.fn();
    const removePanel = vi.fn((panel: (typeof panels)[number]) => {
      const index = panels.indexOf(panel);
      if (index >= 0) panels.splice(index, 1);
    });
    const api = {
      activePanel: panels[2],
      addPanel: vi.fn(),
      clear,
      get panels() {
        return panels;
      },
      getPanel: vi.fn((paneId: string) =>
        panels.find(({ id }) => id === paneId)),
      removePanel,
    } as unknown as DockviewApi;

    reconcileWorkbenchPaneMembershipV3(
      api,
      [
        { paneId: "output-1", role: "output", title: "Outputs 1" },
        { paneId: "output-2", role: "output", title: "Outputs 2" },
      ],
      "split",
    );

    expect(clear).not.toHaveBeenCalled();
    expect(removePanel).toHaveBeenCalledOnce();
    expect(panels.map(({ id }) => id)).toEqual(["output-1", "output-2"]);
    expect(panels.every(({ group }) => group === leftGroup)).toBe(true);
  });

  it("rebuilds only when responsive layout changes between split and tabs", () => {
    const panel = { id: "graph-1", group: { id: "group-1" } };
    const clear = vi.fn();
    const api = {
      activePanel: panel,
      addPanel: vi.fn(),
      clear,
      getPanel: vi.fn(() => panel),
      panels: [panel],
      removePanel: vi.fn(),
    } as unknown as DockviewApi;
    const panes: readonly WorkbenchPaneDefinitionV3[] = [
      { paneId: "graph-1", role: "graph", title: "Pressure" },
    ];

    const splitSignature = reconcileWorkbenchPanesV3(
      api,
      panes,
      null,
      "split",
    );
    expect(clear).not.toHaveBeenCalled();
    reconcileWorkbenchPanesV3(api, panes, splitSignature, "tabs");
    expect(clear).toHaveBeenCalledOnce();
  });

  it("keeps Workbench area proportions as a defensive device-local preference", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const preference = normalizeWorkbenchAreaLayoutPreferenceV3({
      inspectorWidthRatio: 0.31,
      outputHeightRatio: 0.34,
    });
    saveWorkbenchAreaLayoutPreferenceV3(storage, preference);

    expect(values.has(WORKBENCH_AREA_LAYOUT_STORAGE_KEY_V3)).toBe(true);
    expect(loadWorkbenchAreaLayoutPreferenceV3(storage)).toEqual(preference);
    values.set(WORKBENCH_AREA_LAYOUT_STORAGE_KEY_V3, "not-json");
    expect(loadWorkbenchAreaLayoutPreferenceV3(storage)).toBe(
      DEFAULT_WORKBENCH_AREA_LAYOUT_V3,
    );
    expect(
      normalizeWorkbenchAreaLayoutPreferenceV3({
        inspectorWidthRatio: 8,
        outputHeightRatio: -2,
      }),
    ).toEqual({ inspectorWidthRatio: 0.42, outputHeightRatio: 0.18 });
  });

  it("updates Dockview's internal title without rebuilding pane structure", () => {
    const clear = vi.fn();
    const addPanel = vi.fn();
    const setTitle = vi.fn();
    const setActive = vi.fn();
    const getPanel = vi.fn(() => ({ api: { setActive }, setTitle }));
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
    reconcileWorkbenchPaneTitlesV3(api, [changedContent], titleSignature);

    expect(clear).toHaveBeenCalledTimes(1);
    expect(addPanel).toHaveBeenCalledTimes(1);
    expect(getPanel).toHaveBeenCalledTimes(3);
    expect(setActive).toHaveBeenCalledTimes(1);
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

  it("preserves the active pane across rebuilds until that pane is removed", () => {
    const firstSetActive = vi.fn();
    const secondSetActive = vi.fn();
    const thirdSetActive = vi.fn();
    const panelById = new Map([
      ["graph-1", { api: { setActive: firstSetActive } }],
      ["graph-2", { api: { setActive: secondSetActive } }],
      ["graph-3", { api: { setActive: thirdSetActive } }],
    ]);
    let activePanel: Readonly<{ id: string }> | undefined;
    const api = {
      get activePanel() {
        return activePanel;
      },
      addPanel: vi.fn(),
      clear: vi.fn(),
      getPanel: vi.fn((paneId: string) => panelById.get(paneId)),
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
    const third: WorkbenchPaneDefinitionV3 = Object.freeze({
      paneId: "graph-3",
      role: "graph",
      title: "Volume",
    });

    let signature = reconcileWorkbenchPanesV3(api, [first, second], null);
    expect(firstSetActive).toHaveBeenCalledTimes(1);

    activePanel = { id: second.paneId };
    signature = reconcileWorkbenchPanesV3(
      api,
      [first, second, third],
      signature,
    );
    expect(secondSetActive).toHaveBeenCalledTimes(1);
    expect(firstSetActive).toHaveBeenCalledTimes(1);

    signature = reconcileWorkbenchPanesV3(api, [first, third], signature);
    expect(firstSetActive).toHaveBeenCalledTimes(2);
    expect(secondSetActive).toHaveBeenCalledTimes(1);
    expect(thirdSetActive).not.toHaveBeenCalled();
  });

  it("drops stale Dockview tracking when its framework element unmounts", () => {
    const apiRef: { current: DockviewApi | null } = {
      current: { clear: vi.fn() } as unknown as DockviewApi,
    };
    const appliedSignatureRef: { current: string | null } = {
      current: '[["graph-1","graph"]]',
    };
    const appliedTitleSignatureRef: { current: string | null } = {
      current: '[["graph-1","Pressure"]]',
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

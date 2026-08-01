import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DockviewApi } from "dockview";
import { describe, expect, it, vi } from "vitest";

import {
  persistWorkbenchBriefingHandoffV3,
  reconcileWorkbenchBriefingPicksV3,
  resolveWorkbenchBriefingPicksAfterRestartV3,
  resolveControlDraftCommitV3,
  resolveWorkbenchSurfaceAfterCommitV3,
  shouldAutoRequestStructuralReturnAnalysisV3,
  shouldPublishWorkbenchRootFrameV3,
  structuralReturnAnalysisRequestKeyV3,
  structuralReturnAnalysisBoundaryStatusV3,
} from "@/components/WorkbenchV3Page";
import {
  addScenarioToControlTargetsV3,
  createDefaultExperimentSurfaceV3,
  reconcileSurfaceControlTargetsV3,
  removeScenarioFromControlTargetsV3,
  workbenchSweepCompatibleOutputsV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  addWorkbenchSurfacePaneV3,
  deleteWorkbenchSurfacePaneV3,
  selectWorkbenchGraphV3,
  updateWorkbenchSurfacePaneV3,
} from "@/components/workbench/WorkbenchPaneEditorV3";
import {
  DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3,
  WorkbenchScenarioManagerV3,
  suggestWorkbenchScenarioIdV3,
  suggestWorkbenchScenarioLabelV3,
} from "@/components/workbench/WorkbenchScenarioManagerV3";
import {
  WorkbenchDurablePersistenceErrorV3,
  commitWorkbenchDurableMutationV3,
} from "@/components/workbench/WorkbenchDurableCommitV3";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  WorkbenchDockview,
  reconcileWorkbenchPaneTitlesV3,
  reconcileWorkbenchPanesV3,
  resetWorkbenchDockviewTrackingV3,
  shouldRenderWorkbenchDockPanelV3,
  workbenchPanePlacementV3,
  type WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  modelLimitationsAcknowledgementKey,
} from "@/components/ModelLimitations";
import {
  StudioSnapshotBriefingHandoffV3,
} from "@/studio/infrastructure/browser/StudioSnapshotBriefingHandoffV3";

describe("V3 Dockview Workbench", () => {
  it("renders a visible panel even when it is not globally active", () => {
    // Dockview can expose one visible panel in each split group even though
    // only one panel across the whole Dockview is globally active.
    const panel = { isActive: false, isVisible: true } as const;
    expect(shouldRenderWorkbenchDockPanelV3(
      panel.isActive,
      panel.isVisible,
    )).toBe(true);
  });

  it.each([true, false])(
    "never renders an invisible panel when global active is %s",
    (isActive) => {
      const panel = { isActive, isVisible: false } as const;
      expect(shouldRenderWorkbenchDockPanelV3(
        panel.isActive,
        panel.isVisible,
      )).toBe(false);
    },
  );

  it("renders an active visible panel", () => {
    expect(shouldRenderWorkbenchDockPanelV3(true, true)).toBe(true);
  });

  it.each(["draft-save", "snapshot"] as const)(
    "fails closed and reloads durable state after %s persistence failure",
    (kind) => {
      const events: string[] = [];
      const adoptDurable = vi.fn();

      expect(() => commitWorkbenchDurableMutationV3({
        kind,
        persist: () => {
          events.push("persist");
          throw new Error("storage quota rejected setItem");
        },
        adoptDurable,
        terminateRuntime: () => {
          events.push("terminate-runtime");
        },
        reinitializeFromDurable: () => {
          events.push("reinitialize-from-durable");
        },
      })).toThrow(WorkbenchDurablePersistenceErrorV3);

      expect(events).toEqual([
        "persist",
        "terminate-runtime",
        "reinitialize-from-durable",
      ]);
      expect(adoptDurable).not.toHaveBeenCalled();
    },
  );

  it("scopes limitations acknowledgement to the exact model disclosure", () => {
    expect(modelLimitationsAcknowledgementKey("model/dev-3:disclosure-v1"))
      .toBe("circleheart.modelLimitations.ack.model%2Fdev-3%3Adisclosure-v1");
    expect(modelLimitationsAcknowledgementKey("model/dev-4:disclosure-v1"))
      .not.toBe(modelLimitationsAcknowledgementKey(
        "model/dev-3:disclosure-v1",
      ));
  });

  it("derives graph, output, and control panes only from the exact registry contract", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const graphPanes = surface.graphPanes;
    const outputPane = surface.outputPanes[0]!;
    const controlPane = surface.controlPanes[0]!;

    expect(graphPanes.map(({ graphId }) => graphId)).toEqual(
      composition.contract.graphCatalog.map(({ graphId }) => graphId),
    );
    expect(outputPane.items.map(({ outputId }) => outputId)).toEqual(
      composition.contract.outputCatalog.map(({ outputId }) => outputId),
    );
    expect(controlPane.items.map(({ controlId }) => controlId)).toEqual(
      composition.contract.controlCatalog.map(({ controlId }) => controlId),
    );
    expect(controlPane.items.length).toBeGreaterThan(0);
    expect(graphPanes.length).toBeGreaterThan(2);
    expect(composition.contract.graphCatalog.some(
      ({ renderer }) => renderer === "pressure-volume",
    )).toBe(true);
    expect(Object.isFrozen(graphPanes)).toBe(true);
    expect(Object.isFrozen(outputPane.items)).toBe(true);
    expect("colorHex" in outputPane).toBe(false);
    expect("colorHex" in controlPane).toBe(false);
    for (const pane of graphPanes) {
      const graph = composition.contract.graphCatalog.find(({ graphId }) =>
        graphId === pane.graphId)!;
      expect("windowSec" in pane).toBe(graph.renderer === "sweep");
      if (graph.renderer === "sweep") {
        expect(pane.windowSec).toBe(2);
        const units = pane.series.map(({ outputId }) =>
          composition.contract.outputCatalog.find((output) =>
            output.outputId === outputId)!.unit);
        expect(new Set(units).size).toBe(1);
      }
    }
  });

  it("offers only scalar outputs compatible with a sweep pane's shared Y-axis unit", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const pressurePane = surface.graphPanes.find((pane) => {
      const graph = composition.contract.graphCatalog.find(({ graphId }) =>
        graphId === pane.graphId);
      return graph?.renderer === "sweep"
        && pane.series.some(({ outputId }) => outputId.includes("pressure"));
    })!;
    const selectedUnit = composition.contract.outputCatalog.find(({ outputId }) =>
      outputId === pressurePane.series[0]!.outputId)!.unit;
    const candidates = workbenchSweepCompatibleOutputsV3(
      pressurePane.series,
      composition.contract,
    );

    expect(candidates.length).toBeGreaterThan(1);
    expect(candidates.every((output) =>
      output.shape === "scalar" && output.unit === selectedUnit)).toBe(true);
    expect(candidates.some(({ outputId }) =>
      outputId === "hemodynamics.volume.LV")).toBe(false);
  });

  it("keeps custom pane presentation in the Experiment Surface", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    const added = addWorkbenchSurfacePaneV3(
      original,
      "output",
      composition.contract,
      "scenario/default",
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
    const customPane = customized.outputPanes.find(({ paneId }) =>
      paneId === selectedPane.paneId);
    expect(customPane).toMatchObject({
      label: "Primary readouts",
      role: "output",
    });
    expect(customPane?.items).toHaveLength(1);
    expect(customPane === undefined ? true : "colorHex" in customPane).toBe(false);
    const deleted = deleteWorkbenchSurfacePaneV3(customized, selectedPane);
    expect(deleted.deleted).toBe(true);
    expect(deleted.surface.outputPanes).toHaveLength(1);
    expect(reconcileWorkbenchBriefingPicksV3([
      { paneId: selectedPane.paneId, priority: 4 },
      { paneId: customized.graphPanes[0]!.paneId, priority: 3 },
    ], deleted.surface)).toEqual([
      { paneId: customized.graphPanes[0]!.paneId, priority: 3 },
    ]);
    const deleteLast = deleteWorkbenchSurfacePaneV3(
      deleted.surface,
      { kind: "output", paneId: deleted.surface.outputPanes[0]!.paneId },
    );
    expect(deleteLast.deleted).toBe(true);
    expect(deleteLast.surface.outputPanes).toEqual([]);
    expect(deleteLast.nextSelectedPane).toBeNull();
  });

  it("preserves partial and explicitly empty Briefings across Worker restart", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const paneId = surface.graphPanes[0]!.paneId;

    expect(resolveWorkbenchBriefingPicksAfterRestartV3(null, surface))
      .toHaveLength(
        surface.graphPanes.length
        + surface.outputPanes.length
        + surface.controlPanes.length,
      );
    expect(resolveWorkbenchBriefingPicksAfterRestartV3([], surface)).toEqual([]);
    expect(resolveWorkbenchBriefingPicksAfterRestartV3([
      { paneId, priority: 12 },
    ], surface)).toEqual([{ paneId, priority: 12 }]);
  });

  it("hands the exact authored Briefing to Article without risking Snapshot commit", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const surface = createDefaultExperimentSurfaceV3(composition.contract);
    const paneId = surface.graphPanes[0]!.paneId;
    const values = new Map<string, string>();
    const handoff = new StudioSnapshotBriefingHandoffV3({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: (key) => { values.delete(key); },
    });

    expect(persistWorkbenchBriefingHandoffV3({
      handoff,
      snapshotId: "snapshot/workbench-briefing",
      picks: [
        { paneId, priority: 12 },
        { paneId: "pane/deleted-before-snapshot", priority: 9 },
      ],
      snapshotSurface: surface,
    })).toBe(true);
    expect(handoff.read("snapshot/workbench-briefing")).toEqual({
      panePicks: [{ paneId, priority: 12 }],
    });

    const unavailable = new StudioSnapshotBriefingHandoffV3({
      getItem: () => null,
      setItem: () => { throw new Error("sessionStorage unavailable"); },
      removeItem: () => undefined,
    });
    expect(persistWorkbenchBriefingHandoffV3({
      handoff: unavailable,
      snapshotId: "snapshot/workbench-briefing",
      picks: [],
      snapshotSurface: surface,
    })).toBe(false);
  });

  it.each(["graph", "output", "control"] as const)(
    "adds and deletes every %s pane, including the final pane",
    async (kind) => {
      const composition = await loadStudioDefaultClientCompositionV2();
      const original = createDefaultExperimentSurfaceV3(
        composition.contract,
        "scenario/default",
      );
      const panes = (surface: typeof original) => kind === "graph"
        ? surface.graphPanes
        : kind === "output"
          ? surface.outputPanes
          : surface.controlPanes;
      const added = addWorkbenchSurfacePaneV3(
        original,
        kind,
        composition.contract,
        "scenario/default",
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

  it("adds and removes authored sweep windows with the selected renderer", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(composition.contract);
    const sweep = composition.contract.graphCatalog.find(({ renderer }) =>
      renderer === "sweep")!;
    const structural = composition.contract.graphCatalog.find(({ renderer }) =>
      renderer !== "sweep")!;
    const paneId = original.graphPanes.find(({ graphId }) =>
      graphId === sweep.graphId)!.paneId;

    const changed = selectWorkbenchGraphV3(
      original,
      paneId,
      structural.graphId,
      composition.contract,
    );
    const structuralPane = changed.graphPanes.find((pane) => pane.paneId === paneId)!;
    expect("windowSec" in structuralPane).toBe(false);
    expect(structuralPane.series).toEqual([]);

    const restored = selectWorkbenchGraphV3(
      changed,
      paneId,
      sweep.graphId,
      composition.contract,
    );
    expect(restored.graphPanes.find((pane) => pane.paneId === paneId)?.windowSec)
      .toBe(2);
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
        onAddPane={() => {}}
      />,
    );

    expect(html).toContain("No output panes");
    expect(html).toContain("Add output pane");
  });

  it("keeps controller-to-Scenario bindings explicit across add and delete", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/baseline",
    );
    const added = addScenarioToControlTargetsV3(original, "scenario/as");
    expect(added.controlPanes[0]!.items.every(({ targetScenarioIds }) =>
      targetScenarioIds.includes("scenario/baseline")
      && targetScenarioIds.includes("scenario/as"))).toBe(true);

    const removed = removeScenarioFromControlTargetsV3(
      added,
      "scenario/baseline",
      "scenario/as",
    );
    expect(removed.controlPanes[0]!.items.every(({ targetScenarioIds }) =>
      targetScenarioIds.length === 1
      && targetScenarioIds[0] === "scenario/as")).toBe(true);
  });

  it("reconciles carried Surface bindings after a durable Scenario rollback", async () => {
    const composition = await loadStudioDefaultClientCompositionV2();
    const original = createDefaultExperimentSurfaceV3(
      composition.contract,
      "scenario/baseline",
    );
    const withUnsavedScenario = addScenarioToControlTargetsV3(
      original,
      "scenario/unsaved",
    );
    const editedWhileSaving = {
      ...withUnsavedScenario,
      note: { text: "edit made while browser persistence was pending" },
    };
    const reconciled = reconcileSurfaceControlTargetsV3(
      editedWhileSaving,
      ["scenario/baseline"],
      "scenario/baseline",
    );
    expect(reconciled.note.text).toBe(editedWhileSaving.note.text);
    expect(reconciled.controlPanes[0]!.items.every(({ targetScenarioIds }) =>
      targetScenarioIds.length === 1
      && targetScenarioIds[0] === "scenario/baseline")).toBe(true);

    const onlyUnsavedTargets = removeScenarioFromControlTargetsV3(
      withUnsavedScenario,
      "scenario/baseline",
      "scenario/unsaved",
    );
    const rebound = reconcileSurfaceControlTargetsV3(
      onlyUnsavedTargets,
      ["scenario/baseline"],
      "scenario/baseline",
    );
    expect(rebound.controlPanes[0]!.items.every(({ targetScenarioIds }) =>
      targetScenarioIds[0] === "scenario/baseline")).toBe(true);
  });

  it("suggests portable collision-free Scenario identities and labels", () => {
    expect(suggestWorkbenchScenarioIdV3(
      "preset/healthy",
      new Set(["scenario/healthy", "scenario/healthy-2"]),
    )).toBe("scenario/healthy-3");
    expect(suggestWorkbenchScenarioLabelV3(
      "Healthy",
      new Set(["Healthy", "Healthy 2"]),
    )).toBe("Healthy 3");
  });

  it("renders the Scenario inspector inside a Dockview control pane", () => {
    const html = renderToStaticMarkup(
      <WorkbenchScenarioManagerV3
        variant="embedded"
        modelId="model/main-wire-v3"
        scenarios={[{ scenarioId: "scenario/healthy", label: "Healthy" }]}
        activeScenarioId="scenario/healthy"
        presets={[]}
        strings={DEFAULT_WORKBENCH_SCENARIO_MANAGER_STRINGS_V3}
        renderControllerSlot={({ scenarioId }) => (
          <span data-controller-for={scenarioId}>controller</span>
        )}
        onSelectScenario={() => {}}
        onAddFromPreset={() => {}}
        onDuplicateScenario={() => {}}
        onRenameScenario={() => {}}
        onDeleteScenario={() => {}}
      />,
    );
    expect(html).toContain('data-scenario-manager-variant="embedded"');
    expect(html).toContain('data-controller-scenario-id="scenario/healthy"');
    expect(html).toContain('data-controller-for="scenario/healthy"');
    expect(html).not.toContain('role="dialog"');
  });

  it("keys structural auto-analysis by exact Scenario identity and retries after busy", () => {
    const analysisId = "analysis/structural-return";
    const scenarioAKey = structuralReturnAnalysisRequestKeyV3({
      modelId: "model/main-wire-v3",
      runtimeSessionId: "runtime/1",
      scenarioId: "scenario/a",
      inputEpoch: 0,
    }, analysisId);
    const scenarioBKey = structuralReturnAnalysisRequestKeyV3({
      modelId: "model/main-wire-v3",
      runtimeSessionId: "runtime/1",
      scenarioId: "scenario/b",
      inputEpoch: 0,
    }, analysisId);
    expect(scenarioAKey).not.toBe(scenarioBKey);

    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: null,
      currentRequestKey: scenarioAKey,
      error: null,
      lastAutoRequestedKey: null,
      operationPending: false,
    })).toBe(true);
    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: null,
      currentRequestKey: scenarioAKey,
      error: "analysis unavailable",
      lastAutoRequestedKey: scenarioAKey,
      operationPending: false,
    })).toBe(false);
    // Clearing A's recoverable error and switching to B at the same input
    // epoch produces a new request identity rather than inheriting A's guard.
    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: null,
      currentRequestKey: scenarioBKey,
      error: null,
      lastAutoRequestedKey: scenarioAKey,
      operationPending: false,
    })).toBe(true);
    // A competing pane waits while the global operation is occupied, then
    // becomes admissible when the busy state returns to false.
    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: null,
      currentRequestKey: scenarioBKey,
      error: null,
      lastAutoRequestedKey: scenarioAKey,
      operationPending: true,
    })).toBe(false);
    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: null,
      currentRequestKey: scenarioBKey,
      error: null,
      lastAutoRequestedKey: scenarioAKey,
      operationPending: false,
    })).toBe(true);
    expect(shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable: true,
      analysisRequestKey: scenarioBKey,
      currentRequestKey: scenarioBKey,
      error: null,
      lastAutoRequestedKey: null,
      operationPending: false,
    })).toBe(false);
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
    expect(shouldPublishWorkbenchRootFrameV3({
      acceptedTimeSec: 1.052,
      lastPublishedTimeSec: 1,
      schedulerRunning: true,
    })).toBe(false);
    expect(shouldPublishWorkbenchRootFrameV3({
      acceptedTimeSec: 1.052,
      lastPublishedTimeSec: 1,
      schedulerRunning: false,
    })).toBe(true);
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
      changeSemantics: "reset" as const,
    };
    const reject = vi.fn(async () => false);
    const accept = vi.fn(async () => true);

    await expect(resolveControlDraftCommitV3({
      acceptedValue: 1,
      candidate: 1.2,
      control,
      onCommit: reject,
    })).resolves.toEqual({ accepted: false, displayValue: 1 });
    await expect(resolveControlDraftCommitV3({
      acceptedValue: 1,
      candidate: 1.2,
      control,
      onCommit: accept,
    })).resolves.toEqual({ accepted: true, displayValue: 1.2 });
    expect(reject).toHaveBeenCalledWith(1.2);
    expect(accept).toHaveBeenCalledWith(1.2);
  });

  it("marks a structural analysis stale when any accepted clock advances", () => {
    const identity = {
      modelId: "model/exact",
      runtimeSessionId: "runtime-1",
      scenarioId: "scenario-1",
      inputEpoch: 2,
    } as const;
    const frame = {
      ...identity,
      acceptedRevision: 40,
      acceptedTimeSec: 0.08,
      outputs: {},
    } as StudioSimulationFrameV2;
    const analysis = {
      ...identity,
      sourceAcceptedRevision: 40,
      sourceAcceptedTimeSec: 0.08,
      analysisId: "analysis/return",
      payload: null,
    } as StudioSimulationAnalysisV2;

    expect(structuralReturnAnalysisBoundaryStatusV3(analysis, frame))
      .toBe("current");
    expect(structuralReturnAnalysisBoundaryStatusV3(analysis, {
      ...frame,
      acceptedRevision: 41,
      acceptedTimeSec: 0.082,
    })).toBe("stale");
    expect(structuralReturnAnalysisBoundaryStatusV3(analysis, {
      ...frame,
      inputEpoch: 3,
    })).toBe("stale");
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
    expect([0, 1, 2, 3].map((index) =>
      workbenchPanePlacementV3(index, "tabs")))
      .toEqual(["first", "within", "within", "within"]);
    // Desktop stays at two columns: pane 2 is standalone on the right while
    // panes 1 and 3+ form the primary tab group on the left.
    expect([0, 1, 2, 3].map((index) =>
      workbenchPanePlacementV3(index, "split")))
      .toEqual(["first", "right", "within", "within"]);
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
    reconcileWorkbenchPaneTitlesV3(
      api,
      [changedContent],
      titleSignature,
    );

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

    signature = reconcileWorkbenchPanesV3(
      api,
      [first, third],
      signature,
    );
    expect(firstSetActive).toHaveBeenCalledTimes(2);
    expect(secondSetActive).toHaveBeenCalledTimes(1);
    expect(thirdSetActive).not.toHaveBeenCalled();
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HealthToasts } from "@/components/HealthIndicators";
import { ReadingPresenter } from "@/components/reading/ReadingPresenter";
import { PanelGrid } from "@/components/workbench/PanelGrid";
import { WorkbenchHeader } from "@/components/workbench/WorkbenchHeader";
import { useAuth } from "@/contexts/AuthContext";
import type { SimInstance } from "@/types";
import { AddPanelDialog } from "@/features/workbench/dialogs/AddPanelDialog";
import { useIsMobile } from "@/features/workbench/hooks/useIsMobile";
import { useWorkbenchPanels } from "@/features/workbench/hooks/useWorkbenchPanels";
import { type BuildCurrentDoc, useWorkbenchPersistence } from "@/features/workbench/hooks/useWorkbenchPersistence";
import { useWorkbenchScene } from "@/features/workbench/hooks/useWorkbenchScene";
import { useWorkbenchSimulation } from "@/features/workbench/hooks/useWorkbenchSimulation";
import { useWorkbenchTheme } from "@/features/workbench/hooks/useWorkbenchTheme";
import { canUseReadExplore, deriveReadExploreEntryMode, switchReadExplorePresentation, type ReadExploreMode } from "@/features/workbench/readExplore";
import {
  ALL_CHAMBERS,
  ALL_CONTROL_GROUPS,
  ALL_METRICS,
  ALL_SIGNALS,
  type AddedInstanceConfig,
} from "@/features/workbench/workbenchDefaults";
import { resolveReadingColumn } from "@/readingConversion";

export function WorkbenchRoute() {
  const { user, signIn, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { workbenchTheme, setWorkbenchTheme } = useWorkbenchTheme();
  const userEditedRef = useRef(false);
  const entryPresentationKeyRef = useRef<string | null>(null);
  const [readExploreState, setReadExploreState] = useState<{ presentation: ReadExploreMode }>({ presentation: "explore" });
  const buildCurrentDocRef = useRef<BuildCurrentDoc | null>(null);
  const requestSteadyTransitionRef = useRef<(id: string, nextInstances: SimInstance[]) => void>(() => {});
  const addVisibleInstanceConfigsRef = useRef<(additions: AddedInstanceConfig[]) => void>(() => {});

  const markUserEdited = useCallback(() => {
    userEditedRef.current = true;
  }, []);

  const scene = useWorkbenchScene({
    user,
    markUserEdited,
    requestSteadyTransitionRef,
    addVisibleInstanceConfigsRef,
  });

  const panels = useWorkbenchPanels({
    instances: scene.instances,
    headerMode: scene.headerMode,
    markUserEdited,
  });
  addVisibleInstanceConfigsRef.current = panels.addVisibleInstanceConfigs;

  const addSimulationInstanceConfigs = useCallback((ids: string[]) => {
    panels.addVisibleInstanceConfigs(ids.map((id) => ({ id })));
  }, [panels.addVisibleInstanceConfigs]);
  const simulation = useWorkbenchSimulation(scene.instances, addSimulationInstanceConfigs);
  requestSteadyTransitionRef.current = simulation.requestSteadyTransition;

  const readExploreDoc = useMemo(() => ({
    panels: panels.panels,
    notes: panels.notes,
    reading: scene.currentCaseReading,
  }), [panels.notes, panels.panels, scene.currentCaseReading]);
  const readExploreAvailable = scene.headerMode === "learner" && canUseReadExplore(readExploreDoc);
  const resolvedReadingColumn = useMemo(() => resolveReadingColumn(readExploreDoc), [readExploreDoc]);
  const readingColumn = "column" in resolvedReadingColumn ? resolvedReadingColumn.column : undefined;
  const setReadExploreMode = useCallback((presentation: ReadExploreMode) => {
    setReadExploreState((prev) => switchReadExplorePresentation(prev, presentation));
  }, []);

  useEffect(() => {
    if (scene.headerMode !== "learner") {
      entryPresentationKeyRef.current = null;
      setReadExploreMode("explore");
      return;
    }
    if (!scene.currentCaseId) return;
    const entryKey = `${scene.currentCaseId}:${panels.noteCaseKey}`;
    if (entryPresentationKeyRef.current === entryKey) return;
    entryPresentationKeyRef.current = entryKey;
    setReadExploreMode(deriveReadExploreEntryMode(readExploreDoc, { readOnly: true }));
  }, [panels.noteCaseKey, readExploreDoc, scene.currentCaseId, scene.headerMode, setReadExploreMode]);

  useEffect(() => {
    if (!readExploreAvailable && readExploreState.presentation === "read") setReadExploreMode("explore");
  }, [readExploreAvailable, readExploreState.presentation, setReadExploreMode]);

  const persistence = useWorkbenchPersistence({
    user,
    authLoading,
    signIn,
    scene,
    panels,
    userEditedRef,
    buildCurrentDocRef,
    pushWarningToast: simulation.pushWarningToast,
  });

  const showReadingPresentation = readExploreAvailable && readExploreState.presentation === "read" && Boolean(readingColumn);

  return (
    <div
      className="workbench-root flex flex-col h-full w-full bg-wb-app text-wb-text overflow-hidden font-sans relative"
      data-workbench-theme={workbenchTheme}
    >
      {showReadingPresentation && (
        <ReadingPresenter
          lessonTitle={scene.sceneMeta.title}
          objective={scene.sceneMeta.description}
          caseDoc={{
            meta: { id: scene.currentCaseId ?? panels.noteCaseKey, title: scene.sceneMeta.title, createdAt: scene.currentCaseCreatedAt ?? 0, updatedAt: scene.currentCaseCreatedAt ?? 0 },
            panels: panels.panels,
            notes: panels.notes,
            views: scene.currentCaseViews,
            exposedControllers: scene.currentCaseExposedControllers,
          }}
          column={readingColumn ?? []}
          runtime={{
            instances: scene.instances,
            physicsRefs: simulation.physicsRefs,
            instanceHealth: simulation.instanceHealth,
            activeInstanceId: scene.activeInstanceId,
            updateInstanceParams: scene.updateInstanceParams,
            updateInstanceKnobs: scene.updateInstanceKnobs,
            updateInstanceVolume: scene.updateInstanceVolume,
          }}
          chrome={{
            backHref: persistence.backTarget.href,
            backLabel: persistence.backTarget.label,
            showReadExploreSwitcher: readExploreAvailable,
            readExploreMode: readExploreState.presentation,
            onReadExploreModeChange: setReadExploreMode,
            onResetToAuthorState: scene.resetToAuthorState,
            onFork: persistence.runHeaderPrimaryAction,
            isForking: persistence.isSavingCase,
          }}
        />
      )}
      {/* The Explore subtree stays mounted while Reading shows so PanelGrid-local
          state (metrics dockview mirrors/layout) survives Read<->Explore. */}
      <div className={showReadingPresentation ? 'hidden' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}>
      <WorkbenchHeader
        mode={scene.headerMode}
        backHref={persistence.backTarget.href}
        backLabel={persistence.backTarget.label}
        sceneMeta={scene.sceneMeta}
        onSceneMetaChange={scene.updateSceneMeta}
        onPrimaryAction={persistence.runHeaderPrimaryAction}
        onResetToAuthorState={scene.resetToAuthorState}
        instances={scene.instances}
        instanceHealth={simulation.instanceHealth}
        getLiveHealth={simulation.getLiveHealth}
        fileInputRef={persistence.fileInputRef}
        onImportFile={persistence.handleImportFile}
        onExport={persistence.handleExport}
        isSavingCase={persistence.isSavingCase}
        isPlaying={simulation.isPlaying}
        togglePlay={simulation.togglePlay}
        timeScale={simulation.timeScale}
        setTimeScale={simulation.setTimeScale}
        noteOpen={panels.workbenchLayout.noteOpen}
        metricsOpen={panels.workbenchLayout.metricsOpen}
        rightRailVisible={panels.workbenchLayout.rightRailVisible}
        metricsSpan={panels.workbenchLayout.metricsSpan}
        hasNotePanel={panels.panels.some((panel) => panel.type === "NOTE")}
        onToggleNote={panels.toggleNoteDrawer}
        onToggleMetrics={() => panels.setWorkbenchLayout((prev) => ({ ...prev, metricsOpen: !prev.metricsOpen }))}
        onToggleRightRail={() => panels.setWorkbenchLayout((prev) => ({ ...prev, rightRailVisible: !prev.rightRailVisible }))}
        onMetricsSpanChange={(metricsSpan) => panels.setWorkbenchLayout((prev) => ({ ...prev, metricsSpan }))}
        theme={workbenchTheme}
        onThemeChange={setWorkbenchTheme}
        showReadExploreSwitcher={readExploreAvailable}
        readExploreMode={readExploreState.presentation}
        onReadExploreModeChange={setReadExploreMode}
      />

      <PanelGrid
        instances={scene.instances}
        panels={panels.panels}
        layoutState={panels.workbenchLayout}
        onLayoutStateChange={panels.setWorkbenchLayout}
        dockviewLayoutKey={`${panels.noteCaseKey}:${panels.dockviewLayoutVersion}`}
        dockviewViewStates={panels.workspace.viewStates}
        onDockviewViewStateChange={panels.updateDockviewViewState}
        graphBoardLayout={scene.currentCaseGraphBoardLayout}
        onGraphBoardLayoutChange={scene.updateGraphBoardLayout}
        workbenchTheme={workbenchTheme}
        authoredViews={scene.currentCaseViews}
        reading={scene.currentCaseReading}
        createControllerView={scene.createControllerView}
        createMetricsView={scene.createMetricsView}
        updateAuthoredView={scene.updateAuthoredView}
        renameAuthoredView={scene.renameAuthoredView}
        restoreStandardViews={scene.restoreStandardViews}
        duplicateAuthoredView={scene.duplicateAuthoredView}
        deleteAuthoredView={scene.deleteAuthoredView}
        mode={scene.headerMode}
        isMobile={isMobile}
        noteModes={panels.noteModes}
        setNoteModes={panels.setNoteModes}
        physicsRefs={simulation.physicsRefs}
        instanceHealth={simulation.instanceHealth}
        steadyUpdateStatuses={simulation.steadyUpdateStatuses}
        activeInstanceId={scene.activeInstanceId}
        setActiveInstanceId={scene.setActiveInstanceId}
        updateInstanceParams={scene.updateInstanceParams}
        updateInstanceKnobs={scene.updateInstanceKnobs}
        updateInstanceVolume={scene.updateInstanceVolume}
        updateInstanceColor={scene.updateInstanceColor}
        updateInstanceName={scene.updateInstanceName}
        toggleScenarioGlobalVisibility={scene.toggleScenarioGlobalVisibility}
        resetInstanceKnobs={scene.resetInstanceKnobs}
        addInstance={scene.addInstance}
        removeInstance={scene.removeInstance}
        timeScale={simulation.timeScale}
        setTimeScale={simulation.setTimeScale}
        isPlaying={simulation.isPlaying}
        togglePlay={simulation.togglePlay}
        addPanel={panels.addPanel}
        duplicatePanel={panels.duplicatePanel}
        removePanel={panels.removePanel}
        updatePanelTitle={panels.updatePanelTitle}
        toggleShowLegend={panels.toggleShowLegend}
        updatePanelInstanceColor={panels.updatePanelInstanceColor}
        updatePanelInstanceName={panels.updatePanelInstanceName}
        updatePanelSignalColor={panels.updatePanelSignalColor}
        updatePanelSignalName={panels.updatePanelSignalName}
        toggleSettings={panels.toggleSettings}
        togglePaneMembership={panels.togglePaneMembership}
        updateInstanceSignals={panels.updateInstanceSignals}
        toggleGuides={panels.toggleGuides}
        updateTimeWindow={panels.updateTimeWindow}
        updatePanelControllerItems={panels.updatePanelControllerItems}
        updatePanelLegendPosition={panels.updatePanelLegendPosition}
        noteCaseKey={panels.noteCaseKey}
        notes={panels.notes}
        onNoteChange={panels.onNoteChange}
        chambers={ALL_CHAMBERS}
        signals={ALL_SIGNALS}
        metrics={ALL_METRICS}
        controlGroups={ALL_CONTROL_GROUPS}
      />
      </div>

      <AddPanelDialog
        panelType={panels.addingPanelType}
        instances={scene.instances}
        config={panels.addingPanelConfig}
        setConfig={panels.setAddingPanelConfig}
        onCancel={panels.cancelAddPanel}
        onConfirm={panels.confirmAddPanel}
      />

      <HealthToasts toasts={simulation.healthToasts} onDismiss={simulation.dismissToast} />
    </div>
  );
}

export default WorkbenchRoute;

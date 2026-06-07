import { useCallback, useRef } from "react";
import { HealthToasts } from "@/components/HealthIndicators";
import { PanelGrid } from "@/components/workbench/PanelGrid";
import { WorkbenchHeader } from "@/components/workbench/WorkbenchHeader";
import { useAuth } from "@/contexts/AuthContext";
import type { SimInstance } from "@/types";
import { AddPanelDialog } from "@/features/workbench/dialogs/AddPanelDialog";
import { SaveLessonDialog } from "@/features/workbench/dialogs/SaveLessonDialog";
import { useIsMobile } from "@/features/workbench/hooks/useIsMobile";
import { useLessonAuthoring } from "@/features/workbench/hooks/useLessonAuthoring";
import { useWorkbenchPanels } from "@/features/workbench/hooks/useWorkbenchPanels";
import { type BuildCurrentDoc, useWorkbenchPersistence } from "@/features/workbench/hooks/useWorkbenchPersistence";
import { useWorkbenchScene } from "@/features/workbench/hooks/useWorkbenchScene";
import { useWorkbenchSimulation } from "@/features/workbench/hooks/useWorkbenchSimulation";
import { useWorkbenchTheme } from "@/features/workbench/hooks/useWorkbenchTheme";
import {
  ALL_CHAMBERS,
  ALL_CONTROL_GROUPS,
  ALL_METRICS,
  ALL_SIGNALS,
  EMPTY_NOTE_SPINE,
  noteExcerpt,
} from "@/features/workbench/workbenchDefaults";

export function WorkbenchRoute() {
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { workbenchTheme, setWorkbenchTheme } = useWorkbenchTheme();
  const userEditedRef = useRef(false);
  const buildCurrentDocRef = useRef<BuildCurrentDoc | null>(null);
  const requestSteadyTransitionRef = useRef<(id: string, nextInstances: SimInstance[]) => void>(() => {});
  const addHiddenInstanceConfigsRef = useRef<(ids: string[]) => void>(() => {});

  const markUserEdited = useCallback(() => {
    userEditedRef.current = true;
  }, []);

  const scene = useWorkbenchScene({
    user,
    markUserEdited,
    requestSteadyTransitionRef,
    addHiddenInstanceConfigsRef,
  });

  const panels = useWorkbenchPanels({
    instances: scene.instances,
    headerMode: scene.headerMode,
    markUserEdited,
  });
  addHiddenInstanceConfigsRef.current = panels.addHiddenInstanceConfigs;

  const simulation = useWorkbenchSimulation(scene.instances, panels.addHiddenInstanceConfigs);
  requestSteadyTransitionRef.current = simulation.requestSteadyTransition;

  const defaultSceneTitle = useCallback(() => (
    scene.sceneMeta.title.trim() || (scene.instances[0] ? `${scene.instances[0].name} scene` : "Workbench scene")
  ), [scene.instances, scene.sceneMeta.title]);

  const lesson = useLessonAuthoring({
    user,
    isAdmin,
    signIn,
    panels: panels.panels,
    notes: panels.notes,
    defaultSceneTitle,
    buildCurrentDocRef,
    pushWarningToast: simulation.pushWarningToast,
    setAuthoringMode: scene.setAuthoringMode,
  });

  const persistence = useWorkbenchPersistence({
    user,
    authLoading,
    signIn,
    scene,
    panels,
    lesson,
    userEditedRef,
    buildCurrentDocRef,
    pushWarningToast: simulation.pushWarningToast,
  });

  return (
    <div
      className="workbench-root flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative"
      data-workbench-theme={workbenchTheme}
    >
      <WorkbenchHeader
        mode={scene.headerMode}
        backHref={persistence.backTarget.href}
        backLabel={persistence.backTarget.label}
        sceneMeta={scene.sceneMeta}
        onSceneMetaChange={scene.updateSceneMeta}
        onPrimaryAction={persistence.runHeaderPrimaryAction}
        instances={scene.instances}
        instanceHealth={simulation.instanceHealth}
        getLiveHealth={simulation.getLiveHealth}
        fileInputRef={persistence.fileInputRef}
        onImportFile={persistence.handleImportFile}
        onExport={persistence.handleExport}
        authoringMode={scene.authoringMode}
        setAuthoringMode={scene.setWorkbenchAuthoringMode}
        stepsDraftLength={lesson.stepsDraft.length}
        openLessonDialog={lesson.openLessonDialog}
        onExitAuthoring={lesson.exitAuthoring}
        user={user}
        isAdmin={isAdmin}
        publishCurrentLesson={lesson.publishCurrentLesson}
        isPublishingLesson={lesson.isPublishingLesson}
        isSavingCase={persistence.isSavingCase}
        savedLesson={lesson.savedLesson}
        publishedLesson={lesson.publishedLesson}
        copyShareUrl={lesson.copyShareUrl}
        isPlaying={simulation.isPlaying}
        togglePlay={simulation.togglePlay}
        timeScale={simulation.timeScale}
        setTimeScale={simulation.setTimeScale}
        controlsSide={panels.workbenchLayout.controlsSide}
        onControlsSideChange={(side) => panels.setWorkbenchLayout((prev) => ({ ...prev, controlsSide: side }))}
        onResetLayout={panels.resetWorkbenchLayout}
        theme={workbenchTheme}
        onThemeChange={setWorkbenchTheme}
      />

      <PanelGrid
        authoringMode={scene.authoringMode}
        publishedLesson={lesson.publishedLesson}
        copyShareUrl={lesson.copyShareUrl}
        instances={scene.instances}
        stepsDraft={lesson.stepsDraft}
        setStepsDraft={lesson.setStepsDraft}
        panels={panels.panels}
        layoutState={panels.workbenchLayout}
        onLayoutStateChange={panels.setWorkbenchLayout}
        dockviewLayoutKey={`${panels.noteCaseKey}:${panels.dockviewLayoutVersion}`}
        dockviewViewStates={panels.workspace.viewStates}
        onDockviewViewStateChange={panels.updateDockviewViewState}
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
        addInstance={scene.addInstance}
        removeInstance={scene.removeInstance}
        timeScale={simulation.timeScale}
        setTimeScale={simulation.setTimeScale}
        isPlaying={simulation.isPlaying}
        togglePlay={simulation.togglePlay}
        addPanel={panels.addPanel}
        removePanel={panels.removePanel}
        updatePanelTitle={panels.updatePanelTitle}
        toggleShowLegend={panels.toggleShowLegend}
        updatePanelInstanceColor={panels.updatePanelInstanceColor}
        updatePanelInstanceName={panels.updatePanelInstanceName}
        updatePanelSignalColor={panels.updatePanelSignalColor}
        updatePanelSignalName={panels.updatePanelSignalName}
        toggleSettings={panels.toggleSettings}
        toggleInstanceVisibility={panels.toggleInstanceVisibility}
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

      <AddPanelDialog
        panelType={panels.addingPanelType}
        instances={scene.instances}
        config={panels.addingPanelConfig}
        setConfig={panels.setAddingPanelConfig}
        onCancel={panels.cancelAddPanel}
        onConfirm={panels.confirmAddPanel}
      />

      <SaveLessonDialog
        isOpen={lesson.isLessonDialogOpen}
        lessonTitle={lesson.lessonTitle}
        noteExcerptText={noteExcerpt(panels.notes[panels.panels.find((panel) => panel.type === "NOTE")?.id ?? ""] ?? EMPTY_NOTE_SPINE)}
        stepsCount={lesson.stepsDraft.length}
        onTitleChange={lesson.setLessonTitle}
        onCancel={() => lesson.setIsLessonDialogOpen(false)}
        onSave={lesson.saveCurrentLesson}
      />

      <HealthToasts toasts={simulation.healthToasts} onDismiss={simulation.dismissToast} />
    </div>
  );
}

export default WorkbenchRoute;

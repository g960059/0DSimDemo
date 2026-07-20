import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, X } from "lucide-react";
import { ReadingPresenter } from "@/components/reading/ReadingPresenter";
import { PanelGrid } from "@/components/workbench/PanelGrid";
import { ReadExploreSwitcher } from "@/components/workbench/ReadExploreSwitcher";
import type { CaseDocument } from "@/caseDoc";
import { authoredViewsForLoad, createControllerViewSpec, createMetricsViewSpec } from "@/features/workbench/authoredViews";
import { useIsMobile } from "@/features/workbench/hooks/useIsMobile";
import { useWorkbenchPanels, type WorkbenchPanelStateInitializer } from "@/features/workbench/hooks/useWorkbenchPanels";
import { canUseReadExplore, deriveReadExploreEntryMode, switchReadExplorePresentation, type ReadExploreMode } from "@/features/workbench/readExplore";
import { usePreviewRuntime } from "@/features/workbench/publish/usePreviewRuntime";
import {
  ALL_CHAMBERS,
  ALL_CONTROL_GROUPS,
  ALL_METRICS,
  ALL_SIGNALS,
} from "@/features/workbench/workbenchDefaults";
import { resolveReadingColumn } from "@/readingConversion";
import type { WorkbenchThemeId } from "@/components/workbench/WorkbenchSidePanel";
import type { ControllerItem, MetricType } from "@/types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function idFactory(kind: "controller" | "metrics"): string {
  return `preview-${kind}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PublishReviewOverlay({
  reviewDoc,
  initialEntry,
  workbenchTheme,
  onExit,
}: {
  reviewDoc: CaseDocument;
  initialEntry: ReadExploreMode;
  workbenchTheme: WorkbenchThemeId;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const preview = usePreviewRuntime(reviewDoc);
  const canRead = canUseReadExplore(reviewDoc);
  const resolvedInitialEntry = useMemo(() => {
    if (initialEntry === "read" && canRead) return "read";
    if (initialEntry === "explore") return "explore";
    return deriveReadExploreEntryMode(reviewDoc, { readOnly: true });
  }, [canRead, initialEntry, reviewDoc]);
  const [readExploreState, setReadExploreState] = useState<{ presentation: ReadExploreMode }>({ presentation: resolvedInitialEntry });
  const setReadExploreMode = useCallback((presentation: ReadExploreMode) => {
    setReadExploreState((prev) => switchReadExplorePresentation(prev, presentation === "read" && !canRead ? "explore" : presentation));
  }, [canRead]);

  const initialPanelState = useMemo<WorkbenchPanelStateInitializer>(() => ({
    panels: clone(reviewDoc.panels),
    workspace: clone(reviewDoc.workspace),
    notes: clone(reviewDoc.notes ?? {}),
    noteCaseKey: `publish-review:${reviewDoc.meta.id}`,
  }), [reviewDoc]);
  const previewPanels = useWorkbenchPanels({
    instances: preview.instances,
    headerMode: "learner",
    markUserEdited: () => {},
    initialPanelState,
  });
  const authoredViews = useMemo(() => authoredViewsForLoad(reviewDoc.views, reviewDoc.panels, {
    idFactory,
    instances: preview.instances,
    locale: reviewDoc.defaultLocale,
  }), [preview.instances, reviewDoc.defaultLocale, reviewDoc.panels, reviewDoc.views]);
  const readingColumnResult = useMemo(() => resolveReadingColumn(reviewDoc), [reviewDoc]);
  const readingColumn = "column" in readingColumnResult ? readingColumnResult.column : [];
  const showRead = canRead && readExploreState.presentation === "read";

  const resetPreview = useCallback(() => {
    preview.reset();
    previewPanels.replacePanelState(initialPanelState);
  }, [initialPanelState, preview, previewPanels]);

  const runtimeHandlers = {
    activeInstanceId: preview.activeInstanceId,
    setActiveInstanceId: preview.setActiveInstanceId,
    updateInstanceParams: preview.updateInstanceParams,
    updateInstanceKnobs: preview.updateInstanceKnobs,
    updateInstanceVolume: preview.updateInstanceVolume,
    toggleScenarioGlobalVisibility: preview.toggleScenarioGlobalVisibility,
    resetInstanceKnobs: preview.resetInstanceKnobs,
    timeScale: preview.simulation.timeScale,
    setTimeScale: preview.simulation.setTimeScale,
    isPlaying: preview.simulation.isPlaying,
    togglePlay: preview.simulation.togglePlay,
  };

  const previewLocalHandlers = {
    onLayoutStateChange: previewPanels.setWorkbenchLayout,
    onDockviewViewStateChange: previewPanels.updateDockviewViewState,
    noteModes: previewPanels.noteModes,
    setNoteModes: previewPanels.setNoteModes,
  };

  const docOpNoops = {
    updateInstanceColor: () => {},
    updateInstanceName: () => {},
    addInstance: () => undefined,
    removeInstance: () => {},
    addPanel: () => undefined,
    duplicatePanel: () => undefined,
    removePanel: () => {},
    updatePanelTitle: () => {},
    toggleShowLegend: () => {},
    updatePanelInstanceColor: () => {},
    updatePanelInstanceName: () => {},
    updatePanelSignalColor: () => {},
    updatePanelSignalName: () => {},
    toggleSettings: () => {},
    togglePaneMembership: () => {},
    updateInstanceSignals: () => {},
    toggleGuides: () => {},
    updateTimeWindow: () => {},
    togglePvDebugOverlay: () => {},
    updatePvDebugTraceMode: () => {},
    updatePanelPvHistory: () => {},
    updatePanelPvRelations: () => {},
    updatePanelHemodynamicSettings: () => {},
    updatePanelControllerItems: () => {},
    updatePanelLegendPosition: () => {},
    onNoteChange: () => {},
    onGraphBoardLayoutChange: () => {},
    updateAuthoredView: () => {},
    renameAuthoredView: () => {},
    restoreStandardViews: () => {},
    duplicateAuthoredView: () => undefined,
    deleteAuthoredView: () => {},
    createControllerView: (title: string, items: ControllerItem[] = []) => createControllerViewSpec("preview-controller", title, items),
    createMetricsView: (title: string, metrics: MetricType[] = []) => createMetricsViewSpec("preview-metrics", title, metrics, preview.instances),
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-wb-app text-wb-text">
      <header className="workbench-header flex h-14 shrink-0 items-center gap-2 px-3 sm:px-4">
        <div className="min-w-0 flex-1 truncate text-sm font-bold text-wb-text">{t("publish.review.title")}</div>
        {canRead && (
          <ReadExploreSwitcher mode={readExploreState.presentation} onModeChange={setReadExploreMode} />
        )}
        <button
          type="button"
          onClick={resetPreview}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-wb-line bg-transparent px-2.5 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("publish.review.reset")}</span>
        </button>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("publish.review.exit")}</span>
        </button>
      </header>
      {showRead ? (
        <ReadingPresenter
          lessonTitle={reviewDoc.spec.title || reviewDoc.meta.title}
          objective={reviewDoc.spec.description}
          caseDoc={{
            meta: reviewDoc.meta,
            panels: reviewDoc.panels,
            notes: reviewDoc.notes,
            views: reviewDoc.views,
            exposedControllers: reviewDoc.exposedControllers,
          }}
          column={readingColumn}
          // No fallbackLocale: ReadingPresenter shows the locale-fallback notice whenever
          // fallbackLocale is truthy, and defaultLocale does NOT mean a fallback occurred.
          // The real workbench reader (WorkbenchRoute) omits it too, so the review must match
          // — otherwise every Read preview shows a spurious "available in X only" notice.
          runtime={{
            instances: preview.instances,
            physicsRefs: preview.simulation.physicsRefs,
            instanceHealth: preview.simulation.instanceHealth,
            activeInstanceId: preview.activeInstanceId,
            updateInstanceParams: preview.updateInstanceParams,
            updateInstanceKnobs: preview.updateInstanceKnobs,
            updateInstanceVolume: preview.updateInstanceVolume,
          }}
          chrome={{ hideHeader: true }}
        />
      ) : (
        <PanelGrid
          instances={preview.instances}
          panels={previewPanels.panels}
          layoutState={previewPanels.workbenchLayout}
          onLayoutStateChange={previewLocalHandlers.onLayoutStateChange}
          dockviewLayoutKey={`publish-review:${reviewDoc.meta.id}:${previewPanels.noteCaseKey}:${previewPanels.dockviewLayoutVersion}`}
          mainDockviewViewState={previewPanels.workspace.hosts.main.dockviewState}
          onDockviewViewStateChange={previewLocalHandlers.onDockviewViewStateChange}
          graphBoardLayout={reviewDoc.graphBoardLayout}
          onGraphBoardLayoutChange={docOpNoops.onGraphBoardLayoutChange}
          workbenchTheme={workbenchTheme}
          authoredViews={authoredViews}
          reading={reviewDoc.reading}
          createControllerView={docOpNoops.createControllerView}
          createMetricsView={docOpNoops.createMetricsView}
          updateAuthoredView={docOpNoops.updateAuthoredView}
          renameAuthoredView={docOpNoops.renameAuthoredView}
          restoreStandardViews={docOpNoops.restoreStandardViews}
          duplicateAuthoredView={docOpNoops.duplicateAuthoredView}
          deleteAuthoredView={docOpNoops.deleteAuthoredView}
          mode="learner"
          isMobile={isMobile}
          noteModes={previewLocalHandlers.noteModes}
          setNoteModes={previewLocalHandlers.setNoteModes}
          physicsRefs={preview.simulation.physicsRefs}
          instanceHealth={preview.simulation.instanceHealth}
          steadyUpdateStatuses={preview.simulation.steadyUpdateStatuses}
          activeInstanceId={runtimeHandlers.activeInstanceId}
          setActiveInstanceId={runtimeHandlers.setActiveInstanceId}
          updateInstanceParams={runtimeHandlers.updateInstanceParams}
          updateInstanceKnobs={runtimeHandlers.updateInstanceKnobs}
          updateInstanceVolume={runtimeHandlers.updateInstanceVolume}
          updateInstanceColor={docOpNoops.updateInstanceColor}
          updateInstanceName={docOpNoops.updateInstanceName}
          toggleScenarioGlobalVisibility={runtimeHandlers.toggleScenarioGlobalVisibility}
          resetInstanceKnobs={runtimeHandlers.resetInstanceKnobs}
          addInstance={docOpNoops.addInstance}
          removeInstance={docOpNoops.removeInstance}
          timeScale={runtimeHandlers.timeScale}
          setTimeScale={runtimeHandlers.setTimeScale}
          isPlaying={runtimeHandlers.isPlaying}
          togglePlay={runtimeHandlers.togglePlay}
          addPanel={docOpNoops.addPanel}
          duplicatePanel={docOpNoops.duplicatePanel}
          removePanel={docOpNoops.removePanel}
          updatePanelTitle={docOpNoops.updatePanelTitle}
          toggleShowLegend={docOpNoops.toggleShowLegend}
          updatePanelInstanceColor={docOpNoops.updatePanelInstanceColor}
          updatePanelInstanceName={docOpNoops.updatePanelInstanceName}
          updatePanelSignalColor={docOpNoops.updatePanelSignalColor}
          updatePanelSignalName={docOpNoops.updatePanelSignalName}
          toggleSettings={docOpNoops.toggleSettings}
          togglePaneMembership={docOpNoops.togglePaneMembership}
          updateInstanceSignals={docOpNoops.updateInstanceSignals}
          toggleGuides={docOpNoops.toggleGuides}
          updateTimeWindow={docOpNoops.updateTimeWindow}
          togglePvDebugOverlay={docOpNoops.togglePvDebugOverlay}
          updatePvDebugTraceMode={docOpNoops.updatePvDebugTraceMode}
          updatePanelPvHistory={docOpNoops.updatePanelPvHistory}
          updatePanelPvRelations={docOpNoops.updatePanelPvRelations}
          updatePanelHemodynamicSettings={docOpNoops.updatePanelHemodynamicSettings}
          updatePanelControllerItems={docOpNoops.updatePanelControllerItems}
          updatePanelLegendPosition={docOpNoops.updatePanelLegendPosition}
          noteCaseKey={previewPanels.noteCaseKey}
          notes={previewPanels.notes}
          onNoteChange={docOpNoops.onNoteChange}
          chambers={ALL_CHAMBERS}
          signals={ALL_SIGNALS}
          metrics={ALL_METRICS}
          controlGroups={ALL_CONTROL_GROUPS}
        />
      )}
    </div>
  );
}

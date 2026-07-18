import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { WorkbenchHeader } from "@/components/workbench/WorkbenchHeader";
import { PanelGrid } from "@/components/workbench/PanelGrid";
import {
  normalizeControllerItemsForAuthoring,
  type ControllerAuthoringCatalog,
} from "@/components/workbench/ControllerItemsBuilder";
import type {
  ScenarioPresetCatalogEntry,
} from "@/components/workbench/ScenarioPane";
import { AddPanelDialog } from "@/features/workbench/dialogs/AddPanelDialog";
import { useIsMobile } from "@/features/workbench/hooks/useIsMobile";
import { useWorkbenchPanels } from "@/features/workbench/hooks/useWorkbenchPanels";
import { useWorkbenchTheme } from "@/features/workbench/hooks/useWorkbenchTheme";
import {
  addVisibleScenariosToMetricsViews,
  authoredViewsOnly,
  createMetricsViewSpec,
  deleteAuthoredView,
  duplicateAuthoredView,
  removeScenariosFromAuthoredViews,
  upsertAuthoredView,
  type AuthoredViewSpec,
} from "@/features/workbench/authoredViews";
import {
  graphBoardLayoutFromPanels,
  migratePanelsToViewSpecs,
  type GraphBoardLayout,
} from "@/features/workbench/viewSpec";
import { workspaceForPanels } from "@/caseDoc";
import { localeFromPathname } from "@/localeRouting";
import { allCasesHref } from "@/homeLinks";
import type {
  ControllerItem,
  MetricType,
  PanelDef,
  PhysicsRefState,
  SignalType,
  SimInstance,
  WorkbenchWorkspace,
} from "@/types";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type { SteadyUpdateStatusMap } from "@/engine/previewController";
import {
  ScientificWorkbenchResearchControlV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlV0";

import {
  createScientificWorkbenchRuntimeRendererV1,
  SCIENTIFIC_CONTROL_PULMONARY_V1,
  SCIENTIFIC_CONTROL_SYSTEMIC_V1,
  SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
  SCIENTIFIC_WORKBENCH_METRIC_OPTIONS_V1,
  SCIENTIFIC_WORKBENCH_SIGNAL_OPTIONS_V1,
} from "./ScientificWorkbenchRuntimeRendererV1";
import {
  createScientificWorkbenchDisplayClockV1,
} from "./ScientificWorkbenchDisplayClockV1";
import {
  createScientificProductWorkerClientV1,
  ScientificProductScenarioRegistryV1,
  loadScientificProductScenarioRuntimeV1,
  type ScientificProductLoadedRuntimeV1,
} from "./ScientificProductScenarioRegistryV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  resolveScientificProductCaseRouteV1,
  type ScientificProductCaseRouteResolutionV1,
} from "./scientificProductCaseCatalogV1";

type ScientificProductRuntimeLoadStateV1 =
  | Readonly<{ phase: "loading"; message: string }>
  | Readonly<{ phase: "failed"; message: string }>
  | Readonly<{ phase: "ready"; runtime: ScientificProductLoadedRuntimeV1 }>;

export default function ScientificProductWorkbenchRouteV1() {
  const { caseId } = useParams<{ caseId?: string }>();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const resolution = resolveProductRoute(caseId);

  if (resolution === null) {
    return (
      <main
        className="flex h-full items-center justify-center bg-wb-app px-4 text-wb-text"
        data-testid="product-workbench-unsupported-case-v1"
      >
        <section className="w-full max-w-xl rounded-lg border border-wb-line bg-wb-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-wb-danger">
            Unsupported scientific case
          </p>
          <h1 className="mt-2 text-xl font-semibold">
            This case is not available for the current model release.
          </h1>
          <p className="mt-3 text-sm leading-6 text-wb-muted">
            Legacy parameters are not translated silently and the previous
            ModelCore is not used as a fallback.
          </p>
          <Link
            to={allCasesHref(locale)}
            className="mt-5 inline-flex rounded-md bg-wb-accent px-3 py-2 text-sm font-semibold text-white"
          >
            Open case catalog
          </Link>
        </section>
      </main>
    );
  }

  return (
    <ScientificProductWorkbenchLoaderV1
      key={resolution.canonicalCaseId}
      resolution={resolution}
    />
  );
}

function ScientificProductWorkbenchLoaderV1({
  resolution,
}: Readonly<{ resolution: ScientificProductCaseRouteResolutionV1 }>) {
  const [state, setState] = React.useState<ScientificProductRuntimeLoadStateV1>({
    phase: "loading",
    message: "Restoring the release-bound scientific state…",
  });

  React.useEffect(() => {
    let active = true;
    let pendingClient: ReturnType<typeof createScientificProductWorkerClientV1>;
    try {
      pendingClient = createScientificProductWorkerClientV1();
    } catch (error: unknown) {
      setState({
        phase: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
    let clientOwnershipTransferred = false;
    let loadedRuntime: ScientificProductLoadedRuntimeV1 | null = null;
    setState({
      phase: "loading",
      message: resolution.caseEntry.kind === "official-exact-periodic"
        ? "Verifying the official document chain and restoring its exact P1 state…"
        : "Starting an independent release-bound run and waiting for numerical P1…",
    });
    void loadScientificProductScenarioRuntimeV1(
      resolution.caseEntry,
      (progress) => {
        if (!active) return;
        setState({
          phase: "loading",
          message: progress.status === "period1-converged"
            ? `P1 confirmed after ${progress.completedBeatCount} beats; capturing the following complete cycle…`
            : `Periodic settlement ${progress.completedBeatCount}/${progress.maximumBeatCount}; no steady graph is exposed yet.`,
        });
      },
      pendingClient,
    ).then((runtime) => {
      if (!active) {
        runtime.client.terminate();
        return;
      }
      loadedRuntime = runtime;
      clientOwnershipTransferred = true;
      setState({ phase: "ready", runtime });
    }).catch((error: unknown) => {
      if (active) {
        setState({
          phase: "failed",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return () => {
      active = false;
      if (clientOwnershipTransferred) loadedRuntime?.client.terminate();
      else pendingClient.terminate();
    };
  }, [resolution.canonicalCaseId]);

  if (state.phase === "loading") {
    return <ScientificProductWorkbenchStatusV1 message={state.message} />;
  }
  if (state.phase === "failed") {
    return <ScientificProductWorkbenchStatusV1 message={state.message} failed />;
  }
  return (
    <ScientificProductWorkbenchShellV1
      key={resolution.canonicalCaseId}
      resolution={resolution}
      runtime={state.runtime}
    />
  );
}

function ScientificProductWorkbenchShellV1({
  resolution,
  runtime,
}: Readonly<{
  resolution: ScientificProductCaseRouteResolutionV1;
  runtime: ScientificProductLoadedRuntimeV1;
}>) {
  const location = useLocation();
  const { t } = useTranslation();
  const locale = localeFromPathname(location.pathname);
  const isMobile = useIsMobile();
  const { workbenchTheme, setWorkbenchTheme } = useWorkbenchTheme();
  const [timeScale, setTimeScale] = React.useState(1);
  const [isPlaying, setPlaying] = React.useState(true);
  const [sceneMeta, setSceneMeta] = React.useState({
    title: resolution.caseEntry.displayName,
    description: resolution.caseEntry.description,
    modelLimitations: [
      "Research simulation; clinical validation and patient-specific fitting are not claimed.",
      "Coronary circulation, assist devices and multipatch myocardium are not modeled in this release.",
    ],
  });
  const [registry] = React.useState(() =>
    new ScientificProductScenarioRegistryV1(resolution, runtime));
  React.useEffect(() => () => registry.dispose(), [registry]);
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const instances = React.useMemo(
    () => descriptors as unknown as SimInstance[],
    [descriptors],
  );
  const scenarioStatuses = React.useMemo<SteadyUpdateStatusMap>(() =>
    Object.fromEntries(descriptors.map((descriptor) => [
      descriptor.id,
      descriptor.lifecycle === "loading"
        ? "computing"
        : descriptor.lifecycle === "failed"
          ? "failed"
          : "updated",
    ])), [descriptors]);
  const scenarioPresetCatalog = React.useMemo<readonly ScenarioPresetCatalogEntry[]>(
    () => descriptors.length >= registry.maximumScenarioCount
      ? SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1.map((entry) => ({
        ...entry,
        disabledReason: `Maximum of ${registry.maximumScenarioCount} scenarios reached.`,
      }))
      : SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1,
    [descriptors.length, registry],
  );
  const initialScenarioId = registry.getDescriptorSnapshot()[0]!.id;
  const markUserEdited = React.useCallback(() => undefined, []);
  const initialPresentation = React.useMemo(
    () => createScientificProductWorkbenchPresentationV1(
      runtime.result.workspaceDocument,
      initialScenarioId,
    ),
    [initialScenarioId, runtime.result.workspaceDocument],
  );
  const initialPanels = initialPresentation.panels;
  const panels = useWorkbenchPanels({
    instances,
    headerMode: "sandbox",
    markUserEdited,
    initialPanelState: {
      panels: initialPanels,
      workspace: initialPresentation.workbenchWorkspace,
      notes: {},
      noteCaseKey: runtime.result.workspaceDocument.ref.sha256,
    },
  });
  const [graphBoardLayout, setGraphBoardLayout] = React.useState<
    GraphBoardLayout | undefined
  >(initialPresentation.graphBoardLayout);
  const [activeInstanceId, setActiveInstanceId] = React.useState(initialScenarioId);
  const [authoredViews, setAuthoredViews] = React.useState<AuthoredViewSpec[]>(
    () => initialScientificAuthoredViews(initialPanels, initialScenarioId),
  );
  const nextViewOrdinal = React.useRef(0);
  const physicsRefs = React.useRef<Map<string, PhysicsRefState>>(new Map());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const displayClock = React.useMemo(
    () => createScientificWorkbenchDisplayClockV1(true, 1),
    [],
  );
  React.useEffect(() => {
    displayClock.configure(isPlaying, timeScale);
  }, [displayClock, isPlaying, timeScale]);

  React.useEffect(() => {
    if (!descriptors.some(({ id }) => id === activeInstanceId)) {
      setActiveInstanceId(descriptors[0]?.id ?? "");
    }
  }, [activeInstanceId, descriptors]);

  React.useEffect(() => {
    const graphViews = authoredViewsOnly(
      migratePanelsToViewSpecs(panels.panels).views,
    ).filter((view) => view.kind === "graph");
    setAuthoredViews((previous) => {
      const graphById = new Map(graphViews.map((view) => [view.id, view]));
      const retained = previous.map((view) =>
        view.kind === "graph" ? graphById.get(view.id) ?? view : view);
      const existing = new Set(retained.map(({ id }) => id));
      return [...retained, ...graphViews.filter(({ id }) => !existing.has(id))];
    });
  }, [panels.panels]);

  const runtimeRenderer = React.useMemo(
    () => createScientificWorkbenchRuntimeRendererV1({
      registry,
      clock: displayClock,
    }),
    [displayClock, registry],
  );

  const createControllerView = React.useCallback((
    title: string,
    items: ControllerItem[] = [...SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1],
  ) => {
    const view = scientificControllerViewV1(
      `scientific-controller-${++nextViewOrdinal.current}`,
      title,
      items,
    );
    setAuthoredViews((previous) => [...previous, view]);
    return view;
  }, []);
  const createMetricsView = React.useCallback((
    title: string,
    metrics: MetricType[] = [],
  ) => {
    const view = createMetricsViewSpec(
      `scientific-metrics-${++nextViewOrdinal.current}`,
      title,
      metrics,
      instances,
    );
    setAuthoredViews((previous) => [...previous, view]);
    return view;
  }, [instances]);

  const updateAuthoredViewV1 = React.useCallback((view: AuthoredViewSpec) => {
    setAuthoredViews((previous) => {
      if (view.kind === "controller") {
        const normalized = scientificControllerViewV1(
          view.id,
          view.title ?? "Controller view",
          view.items,
          view.binding,
        );
        const index = previous.findIndex(({ id }) => id === view.id);
        return index < 0
          ? [...previous, normalized]
          : previous.map((candidate, candidateIndex) =>
            candidateIndex === index ? normalized : candidate);
      }
      return upsertAuthoredView(previous, view);
    });
  }, []);

  const addInstance = React.useCallback((sourceId?: string, presetId?: string) => {
    const id = sourceId
      ? registry.duplicateStable(sourceId)
      : registry.addPreset(
        presetId ?? SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
      );
    if (id === null) return;
    panels.addVisibleInstanceConfigs([{ id, ...(sourceId ? { sourceId } : {}) }]);
    setAuthoredViews((previous) =>
      addVisibleScenariosToMetricsViews(previous, [id]));
    setActiveInstanceId(id);
  }, [panels.addVisibleInstanceConfigs, registry]);

  const removeInstance = React.useCallback((id: string) => {
    const before = registry.getDescriptorSnapshot();
    const nextActive = before.find(({ id: candidate }) => candidate !== id)?.id;
    if (!registry.remove(id)) return;
    panels.removeInstanceConfigs([id]);
    setAuthoredViews((previous) =>
      removeScenariosFromAuthoredViews(previous, [id]));
    if (activeInstanceId === id && nextActive !== undefined) {
      setActiveInstanceId(nextActive);
    }
  }, [activeInstanceId, panels.removeInstanceConfigs, registry]);

  const noPhysicsMutation = React.useCallback(() => undefined, []);

  return (
    <div
      className="workbench-root relative flex h-full w-full flex-col overflow-hidden bg-wb-app font-sans text-wb-text"
      data-workbench-theme={workbenchTheme}
      data-testid="scientific-product-workbench-host-v1"
      data-product-case-id={resolution.canonicalCaseId}
      data-release-id={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id}
      data-release-version={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version}
      data-release-sha256={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256}
      data-scenario-count={descriptors.length}
    >
      {descriptors.map(({ id }) => {
        const scenarioRuntime = registry.getRuntime(id);
        return scenarioRuntime === null ? null : (
          <ScientificWorkbenchResearchControlV0
            key={scenarioRuntime.sessionId}
            client={scenarioRuntime.client}
            workspaceDocument={scenarioRuntime.workspaceDocument}
            initialSource={scenarioRuntime.initialSource}
            store={scenarioRuntime.controlStore}
            renderController={false}
            renderWorkspace={false}
            surface="product"
          />
        );
      })}
      <ScientificProductFrameEvidenceV1
        registry={registry}
        activeScenarioId={activeInstanceId}
      />
      <WorkbenchHeader
        mode="sandbox"
        backHref={allCasesHref(locale)}
        backLabel="Cases"
        sceneMeta={sceneMeta}
        onSceneMetaChange={setSceneMeta}
        onPrimaryAction={noPhysicsMutation}
        instances={instances}
        instanceHealth={{}}
        getLiveHealth={() => undefined}
        fileInputRef={fileInputRef}
        onImportFile={noPhysicsMutation}
        onExport={noPhysicsMutation}
        primaryActionDisabled
        primaryActionUnavailableReason={t("workbench.scientificPersistenceUnavailable")}
        fileActionsDisabled
        fileActionsUnavailableReason={t("workbench.scientificFilesUnavailable")}
        isPlaying={isPlaying}
        togglePlay={() => setPlaying((value) => !value)}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        noteOpen={panels.workbenchLayout.noteOpen}
        metricsOpen={panels.workbenchLayout.metricsOpen}
        rightRailVisible={panels.workbenchLayout.rightRailVisible}
        metricsSpan={panels.workbenchLayout.metricsSpan}
        hasNotePanel={panels.panels.some(({ type }) => type === "NOTE")}
        onToggleNote={panels.toggleNoteDrawer}
        onToggleMetrics={() => panels.setWorkbenchLayout((previous) => ({
          ...previous,
          metricsOpen: !previous.metricsOpen,
        }))}
        onToggleRightRail={() => panels.setWorkbenchLayout((previous) => ({
          ...previous,
          rightRailVisible: !previous.rightRailVisible,
        }))}
        onMetricsSpanChange={(metricsSpan) =>
          panels.setWorkbenchLayout((previous) => ({ ...previous, metricsSpan }))}
        theme={workbenchTheme}
        onThemeChange={setWorkbenchTheme}
      />
      <PanelGrid
        instances={instances}
        panels={panels.panels}
        layoutState={panels.workbenchLayout}
        onLayoutStateChange={panels.setWorkbenchLayout}
        dockviewLayoutKey={`${panels.noteCaseKey}:${panels.dockviewLayoutVersion}`}
        mainDockviewViewState={panels.workspace.hosts.main.dockviewState}
        onDockviewViewStateChange={panels.updateDockviewViewState}
        graphBoardLayout={graphBoardLayout}
        onGraphBoardLayoutChange={setGraphBoardLayout}
        workbenchTheme={workbenchTheme}
        authoredViews={authoredViews}
        createControllerView={createControllerView}
        createMetricsView={createMetricsView}
        updateAuthoredView={updateAuthoredViewV1}
        renameAuthoredView={(id, title) => setAuthoredViews((previous) =>
          previous.map((view) => view.id === id ? { ...view, title } : view))}
        restoreStandardViews={() => setAuthoredViews((previous) => [
          ...previous.filter((view) => view.kind === "graph"),
          ...initialScientificAuthoredViews([], activeInstanceId)
            .filter((view) => view.kind !== "graph"),
        ])}
        duplicateAuthoredView={(id) => {
          const source = authoredViews.find((view) => view.id === id);
          if (source === undefined) return undefined;
          const copy = duplicateAuthoredView(
            source,
            `${source.id}-copy-${++nextViewOrdinal.current}`,
            `${source.title ?? "View"} copy`,
          );
          const normalized = copy.kind === "controller"
            ? scientificControllerViewV1(
              copy.id,
              copy.title ?? "Controller view copy",
              copy.items,
              copy.binding,
            )
            : copy;
          setAuthoredViews((previous) => [...previous, normalized]);
          return normalized;
        }}
        deleteAuthoredView={(id) => setAuthoredViews((previous) =>
          deleteAuthoredView(previous, id))}
        mode="sandbox"
        isMobile={isMobile}
        noteModes={panels.noteModes}
        setNoteModes={panels.setNoteModes}
        physicsRefs={physicsRefs}
        instanceHealth={{}}
        steadyUpdateStatuses={scenarioStatuses}
        activeInstanceId={activeInstanceId}
        setActiveInstanceId={setActiveInstanceId}
        updateInstanceParams={noPhysicsMutation}
        updateInstanceKnobs={noPhysicsMutation}
        updateInstanceVolume={noPhysicsMutation}
        updateInstanceColor={(id, color) => registry.recolor(id, color)}
        updateInstanceName={(id, name) => registry.rename(id, name)}
        toggleScenarioGlobalVisibility={(id) => registry.toggleGlobalVisibility(id)}
        resetInstanceKnobs={noPhysicsMutation}
        addInstance={addInstance}
        removeInstance={removeInstance}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        isPlaying={isPlaying}
        togglePlay={() => setPlaying((value) => !value)}
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
        togglePvDebugOverlay={panels.togglePvDebugOverlay}
        updatePvDebugTraceMode={panels.updatePvDebugTraceMode}
        updatePanelControllerItems={panels.updatePanelControllerItems}
        updatePanelLegendPosition={panels.updatePanelLegendPosition}
        noteCaseKey={panels.noteCaseKey}
        notes={panels.notes}
        onNoteChange={panels.onNoteChange}
        chambers={["LV", "LA", "RV", "RA"]}
        signals={SCIENTIFIC_WORKBENCH_SIGNAL_OPTIONS_V1 as unknown as SignalType[]}
        metrics={SCIENTIFIC_WORKBENCH_METRIC_OPTIONS_V1 as unknown as MetricType[]}
        controlGroups={["scientific-release-bound-controls-v1"]}
        runtimeRenderer={runtimeRenderer}
        controllerAuthoring={SCIENTIFIC_CONTROLLER_AUTHORING_V1}
        scenarioPresetCatalog={scenarioPresetCatalog}
      />
      <AddPanelDialog
        panelType={panels.addingPanelType}
        instances={instances}
        config={panels.addingPanelConfig}
        setConfig={panels.setAddingPanelConfig}
        onCancel={panels.cancelAddPanel}
        onConfirm={panels.confirmAddPanel}
      />
    </div>
  );
}

function ScientificProductFrameEvidenceV1({
  registry,
  activeScenarioId,
}: Readonly<{
  registry: ScientificProductScenarioRegistryV1;
  activeScenarioId: string;
}>) {
  React.useSyncExternalStore(
    registry.subscribeFrames,
    registry.getFrameVersionSnapshot,
    registry.getFrameVersionSnapshot,
  );
  const presentation = registry.getPresentation(activeScenarioId);
  return (
    <span
      hidden
      data-testid="scientific-product-frame-evidence-v1"
      data-scenario-id={activeScenarioId}
      data-scientific-frame-count={presentation?.frames.length ?? 0}
      data-scientific-final-revision={presentation?.frames.at(-1)?.revision ?? ""}
      data-displayed-evidence={presentation?.displayedEvidence ?? "unavailable"}
    />
  );
}

function ScientificProductWorkbenchStatusV1({
  message,
  failed = false,
}: Readonly<{ message: string; failed?: boolean }>) {
  return (
    <main className="flex h-full items-center justify-center bg-wb-app p-4 text-wb-text">
      <section
        className={`max-w-xl rounded-lg border bg-wb-panel px-5 py-4 text-sm ${failed ? "border-wb-danger" : "border-wb-line"}`}
        role={failed ? "alert" : "status"}
        data-testid={failed
          ? "scientific-product-workbench-failed-v1"
          : "scientific-product-workbench-loading-v1"}
      >
        {message}
      </section>
    </main>
  );
}

function resolveProductRoute(
  routeCaseId: string | undefined,
): ScientificProductCaseRouteResolutionV1 | null {
  return resolveScientificProductCaseRouteV1(
    routeCaseId ?? SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  );
}

export type ScientificProductWorkbenchPresentationV1 = Readonly<{
  panels: PanelDef[];
  workbenchWorkspace: WorkbenchWorkspace;
  graphBoardLayout: GraphBoardLayout | undefined;
}>;

const PRODUCT_LEFT_PRESSURE_OBSERVABLES_V1 = [
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.LA",
] as const;
const PRODUCT_MITRAL_FLOW_OBSERVABLE_V1 = "valve.MV.flow" as const;

/**
 * Builds the ordinary product's initial presentation without changing the
 * content-addressed scientific workspace document. The returned panels and
 * host layout are application state: users remain free to add, delete, split,
 * and rearrange them after mount.
 */
export function createScientificProductWorkbenchPresentationV1(
  workspace: MainWireScientificWorkspaceDocumentV1,
  scenarioId: string,
): ScientificProductWorkbenchPresentationV1 {
  const lvSource = workspace.content.panels.flatMap((panel) =>
    panel.view.kind === "pressure-volume"
      ? panel.view.trajectories.map((trajectory) => ({ panel, trajectory }))
      : []).find(({ trajectory }) =>
        trajectory.volumeObservableId === "hemodynamics.volume.LV"
        && trajectory.pressureObservableId === "hemodynamics.pressure.absolute.LV");
  if (lvSource === undefined) {
    throw new Error(
      "scientific product presentation requires an LV pressure-volume trajectory",
    );
  }

  const sourceObservableIds = new Set(workspace.content.panels.flatMap(({ view }) =>
    view.kind === "pressure-volume"
      ? view.trajectories.flatMap((trajectory) => [
        trajectory.volumeObservableId,
        trajectory.pressureObservableId,
      ])
      : [...view.observableIds]));
  for (const observableId of [
    ...PRODUCT_LEFT_PRESSURE_OBSERVABLES_V1,
    PRODUCT_MITRAL_FLOW_OBSERVABLE_V1,
  ]) {
    if (!sourceObservableIds.has(observableId)) {
      throw new Error(
        `scientific product presentation requires workspace observable ${observableId}`,
      );
    }
  }

  const visibleConfig = (selectedSignals: readonly string[]) => ({
    [scenarioId]: { visible: true, selectedSignals: [...selectedSignals] },
  });
  const panels: PanelDef[] = [
    {
      id: lvSource.panel.panelId,
      sourceViewId: lvSource.panel.panelId,
      type: "PVLOOP",
      title: "LV pressure–volume loop",
      role: "graph",
      zone: "main",
      x: 0,
      y: 0,
      w: 6,
      h: 8,
      config: visibleConfig([lvSource.trajectory.trajectoryId]),
      view: {
        kind: "graph",
        graphType: "pvloop",
        showLegend: true,
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: false,
    },
    {
      id: "product-left-pressure-v1",
      sourceViewId: "product-left-pressure-v1",
      type: "WAVEFORM",
      title: "AoP / LVP / LAP",
      role: "graph",
      zone: "main",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      config: visibleConfig(PRODUCT_LEFT_PRESSURE_OBSERVABLES_V1),
      view: {
        kind: "graph",
        graphType: "waveform",
        showLegend: true,
        timeWindow: 5_000,
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: false,
      timeWindow: 5_000,
    },
    {
      id: "product-mitral-flow-v1",
      sourceViewId: "product-mitral-flow-v1",
      type: "WAVEFORM",
      title: "Mitral valve flow (MVF)",
      role: "graph",
      zone: "main",
      x: 6,
      y: 4,
      w: 6,
      h: 4,
      config: visibleConfig([PRODUCT_MITRAL_FLOW_OBSERVABLE_V1]),
      view: {
        kind: "graph",
        graphType: "waveform",
        showLegend: true,
        timeWindow: 2_000,
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: false,
      timeWindow: 2_000,
    },
  ];
  const defaultWorkspace = workspaceForPanels(panels);
  return {
    panels,
    workbenchWorkspace: {
      ...defaultWorkspace,
      hosts: {
        ...defaultWorkspace.hosts,
        metrics: { open: true },
        main: {},
      },
    },
    graphBoardLayout: graphBoardLayoutFromPanels(panels),
  };
}

function scientificControllerViewV1(
  id: string,
  title: string,
  items: readonly ControllerItem[],
  binding: { kind: "active" } | { kind: "scenario"; scenarioId: string } = {
    kind: "active",
  },
): Extract<AuthoredViewSpec, { kind: "controller" }> {
  return {
    id,
    title: title.trim() || "Controller view",
    kind: "controller",
    items: normalizeControllerItemsForAuthoring(
      items,
      SCIENTIFIC_CONTROLLER_AUTHORING_V1,
    ).items,
    binding,
  };
}

function initialScientificAuthoredViews(
  panels: readonly PanelDef[],
  scenarioId: string,
): AuthoredViewSpec[] {
  const graphViews = authoredViewsOnly(
    migratePanelsToViewSpecs([...panels]).views,
  ).filter((view) => view.kind === "graph");
  return [
    ...graphViews,
    scientificControllerViewV1(
      "scientific-controller-standard-v1",
      "Circulation controls",
      SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
    ),
    createMetricsViewSpec(
      "scientific-metrics-pressure-v1",
      "Pressures",
      [
        "hemodynamics.pressure.mean.Ao",
        "hemodynamics.pressure.mean.RA",
        "hemodynamics.pressure.mean.PA",
        "hemodynamics.pressure.mean.LA",
      ] as unknown as MetricType[],
      [{ id: scenarioId } as SimInstance],
    ),
    createMetricsViewSpec(
      "scientific-metrics-output-v1",
      "Output",
      [
        "valve.AoV.cycle_volume.forward",
        "valve.AoV.cycle_volume.net",
        "valve.AoV.cardiac_output.forward",
        "valve.AoV.cardiac_output.net",
      ] as unknown as MetricType[],
      [{ id: scenarioId } as SimInstance],
    ),
    createMetricsViewSpec(
      "scientific-metrics-ventricular-v1",
      "Ventricular function",
      [
        "hemodynamics.volume.excursion.LV",
        "hemodynamics.ejection_fraction.LV",
        "hemodynamics.volume.excursion.RV",
        "hemodynamics.ejection_fraction.RV",
      ] as unknown as MetricType[],
      [{ id: scenarioId } as SimInstance],
    ),
  ];
}

const CONTROL_OPTIONS_V1 = [0.75, 1, 4 / 3].map((value) => ({
  value,
  label: `${value.toFixed(2)}×`,
}));

const SCIENTIFIC_CONTROLLER_AUTHORING_V1: ControllerAuthoringCatalog = {
  sections: [
    {
      id: "release-bound-circulation",
      title: "Release-bound controls",
      defaultOpen: true,
      entries: [
        {
          key: SCIENTIFIC_CONTROL_SYSTEMIC_V1,
          label: "Systemic vascular resistance",
          min: 0.75,
          max: 4 / 3,
          step: 1 / 12,
          unit: "×",
          defaultKind: "buttonGroup",
          allowedKinds: ["buttonGroup"],
          options: CONTROL_OPTIONS_V1,
        },
        {
          key: SCIENTIFIC_CONTROL_PULMONARY_V1,
          label: "Pulmonary vascular resistance",
          min: 0.75,
          max: 4 / 3,
          step: 1 / 12,
          unit: "×",
          defaultKind: "buttonGroup",
          allowedKinds: ["buttonGroup"],
          options: CONTROL_OPTIONS_V1,
        },
      ],
    },
    {
      id: "planned-release-controls",
      title: "Planned scientific controls",
      entries: [
        "Heart rate",
        "Total blood volume",
        "LV contractility",
        "RV contractility",
        "Atrial contractility",
        "Ventricular relaxation",
        "Pericardial restraint",
        "Valve effective orifice area",
      ].map((label) => ({
        key: `planned.${label.toLowerCase().replaceAll(" ", "-")}`,
        label,
        min: 0,
        max: 1,
        step: 0.01,
        disabledReason:
          "Not yet present in the release-bound scientific control catalog.",
      })),
    },
  ],
  baselineValues: {
    [SCIENTIFIC_CONTROL_SYSTEMIC_V1]: 1,
    [SCIENTIFIC_CONTROL_PULMONARY_V1]: 1,
  },
  defaultItems: SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
};

const SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1:
readonly ScenarioPresetCatalogEntry[] = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map(
  (entry) => ({
    id: entry.caseId,
    label: entry.displayName,
    detail: entry.badge,
  }),
);

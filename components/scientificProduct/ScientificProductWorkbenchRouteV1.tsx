import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { WorkbenchHeader } from "@/components/workbench/WorkbenchHeader";
import {
  EvidenceChecksStatusControl,
  type EvidenceChecksScenarioSummary,
  type EvidenceChecksStatus,
} from "@/components/workbench/EvidenceChecksStatusControl";
import {
  ScientificProductEvidencePageV1,
  type ScientificProductEvidenceSubjectV1,
} from "@/components/scientificVerification/ScientificProductEvidencePageV1";
import type {
  ScientificProductEvidenceMetricFilterV1,
} from "@/components/scientificVerification/ScientificProductEvidenceMetricExplorerV1";
import {
  PanelGrid,
  type MetricAuthoringCatalog,
} from "@/components/workbench/PanelGrid";
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
import { allCasesHref, workbenchHref } from "@/homeLinks";
import type {
  ControllerItem,
  MetricType,
  PanelDef,
  PhysicsRefState,
  SignalType,
  SimInstance,
  WorkbenchWorkspace,
} from "@/types";
import { DEFAULT_PV_LOOP_HISTORY_BEATS } from "@/types";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  ScientificWorkbenchResearchControlDraftV0,
  ScientificWorkbenchResearchControlSnapshotV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

import {
  createScientificWorkbenchRuntimeRendererV1,
  ScientificProductTransitionBehaviorSettingsV1,
  SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1,
  SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
  SCIENTIFIC_WORKBENCH_METRIC_OPTIONS_V1,
  SCIENTIFIC_WORKBENCH_SIGNAL_OPTIONS_V1,
  SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1,
  useScientificScenarioPresentationV1,
} from "./ScientificWorkbenchRuntimeRendererV1";
import {
  SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1,
  SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1,
  SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1,
  SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1,
  type ScientificWorkbenchMetricCategoryV1,
} from "./ScientificWorkbenchMetricPresentationV1";
import {
  createScientificWorkbenchDisplayClockV1,
} from "./ScientificWorkbenchDisplayClockV1";
import {
  type ScientificProductQuickCheckRecordV1,
} from "./ScientificProductQuickCheckRegistryV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "./ScientificProductRuntimeRegistryPortV1";
import {
  loadScientificProductStudioScenarioRuntimeV1,
  nextScientificProductStudioScenarioIdV1,
  ScientificProductStudioScenarioRegistryV1,
  type ScientificProductStudioScenarioRuntimeV1,
} from "./ScientificProductStudioScenarioRegistryV1";
import {
  createScientificProductEvidenceReportV1,
} from "./ScientificProductEvidenceReportV1";
import {
  ScientificWorkbenchBriefingControlV1,
} from "./ScientificWorkbenchBriefingControlV1";
import {
  StudioBriefingPickProviderV1,
  type StudioBriefingPickApiV1,
} from "./ScientificWorkbenchBriefingPickV1";
import {
  useStudioAuthorPreviewV1,
} from "@/components/studio/StudioAuthorPreviewProviderV1";
import {
  readScientificProductSavedScenarioCatalogV1,
  removeScientificProductSavedScenarioV1,
  saveScientificProductScenarioV1,
  writeScientificProductSavedScenarioCatalogV1,
  type ScientificProductSavedScenarioV1,
} from "./ScientificProductSavedScenarioCatalogV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  resolveScientificProductCaseRouteV1,
  scientificProductCaseByIdV1,
  type ScientificProductCaseRouteResolutionV1,
} from "./scientificProductCaseCatalogV1";
import {
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
  resolveScientificProductIntegratedV3CaseRouteV1,
} from "./ScientificProductIntegratedV3CaseV1";
import {
  ScientificProductIntegratedV3WorkbenchV1,
} from "./ScientificProductIntegratedV3WorkbenchV1";
import {
  SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1,
  SCIENTIFIC_PRODUCT_LANE_DESCRIPTOR_BY_KIND_V1,
  ScientificProductLaneSelectorV1,
  readScientificProductLanePreferenceV1,
  writeScientificProductLanePreferenceV1,
} from "./ScientificProductLaneSelectorV1";
import {
  INTEGRATED_V3_LANE_KIND_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  STUDIO_NONCORONARY_LANE_KIND_V1,
  type StudioLiveLaneKindV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

type ScientificProductRuntimeLoadStateV1 =
  | Readonly<{ phase: "loading"; message: string }>
  | Readonly<{ phase: "failed"; message: string }>
  | Readonly<{
    phase: "ready";
    runtime: ScientificProductStudioScenarioRuntimeV1;
  }>;

const EMPTY_STUDIO_QUICK_CHECK_SNAPSHOT_V1 = Object.freeze({
  records: Object.freeze([]) as readonly ScientificProductQuickCheckRecordV1[],
});
const STUDIO_VV_NOT_CONNECTED_MESSAGE_V1 =
  "Studio V&V reports are not connected to this product surface yet. "
  + "Live simulation and strict numerical settlement remain active.";

function scheduleAfterCommittedPaintV1(callback: () => void): () => void {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    const timeoutId = globalThis.setTimeout(callback, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }
  let secondFrameId: number | null = null;
  const firstFrameId = globalThis.requestAnimationFrame(() => {
    secondFrameId = globalThis.requestAnimationFrame(callback);
  });
  return () => {
    globalThis.cancelAnimationFrame(firstFrameId);
    if (secondFrameId !== null) {
      globalThis.cancelAnimationFrame(secondFrameId);
    }
  };
}

export default function ScientificProductWorkbenchRouteV1() {
  const { caseId } = useParams<{ caseId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const [lanePreference, setLanePreference] =
    React.useState<StudioLiveLaneKindV1>(
      readScientificProductLanePreferenceV1,
    );
  const integratedV3Case =
    resolveScientificProductIntegratedV3CaseRouteV1(caseId);
  const resolution = resolveProductRoute(caseId);

  if (integratedV3Case === null && resolution === null) {
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

  const selectedLaneKind = caseId === undefined
    ? lanePreference
    : integratedV3Case !== null
      ? INTEGRATED_V3_LANE_KIND_V1
      : STUDIO_NONCORONARY_LANE_KIND_V1;
  const selectedDescriptor =
    SCIENTIFIC_PRODUCT_LANE_DESCRIPTOR_BY_KIND_V1[selectedLaneKind];
  const selectLane = (laneKind: StudioLiveLaneKindV1): void => {
    writeScientificProductLanePreferenceV1(laneKind);
    setLanePreference(laneKind);
    if (caseId !== undefined) {
      void navigate(workbenchHref(locale));
    }
  };
  const laneContentByKind = {
    [INTEGRATED_V3_LANE_KIND_V1]: (
      <ScientificProductIntegratedV3WorkbenchV1
        caseEntry={
          integratedV3Case ?? SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1
        }
      />
    ),
    [STUDIO_NONCORONARY_LANE_KIND_V1]: resolution === null
      ? null
      : (
        <ScientificProductWorkbenchLoaderV1
          key={resolution.canonicalCaseId}
          resolution={resolution}
        />
      ),
  } satisfies Record<StudioLiveLaneKindV1, React.ReactNode>;

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-wb-app"
      data-default-lane-kind={SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1}
    >
      <ScientificProductLaneSelectorV1
        selectedDescriptor={selectedDescriptor}
        onSelectLane={selectLane}
      />
      <div className="min-h-0 flex-1" key={selectedLaneKind}>
        {laneContentByKind[selectedLaneKind]}
      </div>
    </div>
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
    const abortController = new AbortController();
    const artifacts = new InMemoryContentAddressedArtifactStoreV1();
    const scenarioId = nextScientificProductStudioScenarioIdV1();
    let loadedRuntime: ScientificProductStudioScenarioRuntimeV1 | null = null;
    setState({
      phase: "loading",
      message: resolution.caseEntry.kind === "official-exact-periodic"
        ? "Restoring the exact source and preparing its one-point Studio snapshot…"
        : "Starting an independent release-bound run and waiting for numerical P1…",
    });
    void loadScientificProductStudioScenarioRuntimeV1({
      scenarioId,
      caseEntry: resolution.caseEntry,
      artifacts,
      onProgress: (progress) => {
        if (!active) return;
        setState({
          phase: "loading",
          message: progress.message,
        });
      },
      signal: abortController.signal,
      deferInitialLivePresentation: true,
    }).then((runtime) => {
      if (!active) {
        void runtime.controller.dispose();
        runtime.scientificWorkerLane?.terminate();
        return;
      }
      loadedRuntime = runtime;
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
      abortController.abort();
      if (loadedRuntime !== null) {
        void loadedRuntime.controller.dispose().finally(() =>
          loadedRuntime?.scientificWorkerLane?.terminate()
        );
      }
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
  runtime: ScientificProductStudioScenarioRuntimeV1;
}>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const locale = localeFromPathname(location.pathname);
  const isMobile = useIsMobile();
  const { draft: authorDraft } = useStudioAuthorPreviewV1();
  /**
   * Which experiment this Workbench is composing.
   *
   * An article may hold several, so the placement that sent the author here
   * names the one they meant. It travels in the URL rather than in memory so
   * that a reload composes the same experiment. Without a name — an author
   * who opened the Workbench directly — the first experiment is composed,
   * which is the only one a single-experiment article has.
   */
  const composeTarget = React.useMemo(() => {
    const requested = new URLSearchParams(location.search).get("experiment");
    // Only an experiment the article places can be composed from here. An
    // experiment left behind by a deleted placement is not part of the
    // article any more, and composing it would edit a brief no reader meets.
    const placed = new Set(
      authorDraft.document.blocks
        .filter((block) => block.kind === "experiment-placement")
        .map((block) => block.experimentId),
    );
    const placedExperiments = authorDraft.experiments.filter(
      ({ experimentId }) => placed.has(experimentId),
    );
    // A named experiment that cannot be found is a mistake, not an invitation
    // to compose whichever one happens to be first.
    const experiment = requested === null
      ? placedExperiments[0]
      : placedExperiments.find(({ experimentId }) =>
        experimentId === requested);
    const brief = experiment?.readerBriefs[0];
    const scenario = experiment?.scenarios[0];
    return experiment === undefined
        || brief === undefined
        || scenario === undefined
      ? null
      : Object.freeze({
        experimentId: experiment.experimentId,
        briefId: brief.briefId,
        scenarioId: scenario.scenarioId,
      });
  }, [authorDraft.document.blocks, authorDraft.experiments, location.search]);
  const { workbenchTheme, setWorkbenchTheme } = useWorkbenchTheme();
  const [isPlaying, setPlaying] = React.useState(true);
  const [briefingOpen, setBriefingOpen] = React.useState(false);
  const [briefingPickApi, setBriefingPickApi] =
    React.useState<StudioBriefingPickApiV1 | null>(null);
  const [sceneMeta, setSceneMeta] = React.useState({
    title: resolution.caseEntry.displayName,
    description: resolution.caseEntry.description,
    modelLimitations: [
      "Research simulation; clinical validation and patient-specific fitting are not claimed.",
      "Coronary circulation, assist devices and multipatch myocardium are not modeled in this release.",
    ],
  });
  const [registry] = React.useState(() =>
    new ScientificProductStudioScenarioRegistryV1(
      resolution,
      runtime,
    ));
  const registryMountedRef = React.useRef(false);
  React.useEffect(() => {
    registry.connect();
    registryMountedRef.current = true;
    return () => {
      registryMountedRef.current = false;
      // React Strict Mode replays effect setup/cleanup during development.
      // Defer irreversible worker disposal so the immediate replay can retain
      // the same registry; a real unmount remains false at the microtask.
      globalThis.queueMicrotask(() => {
        if (!registryMountedRef.current) {
          void registry.dispose();
        }
      });
    };
  }, [registry]);
  const descriptors = React.useSyncExternalStore(
    registry.subscribeDescriptors,
    registry.getDescriptorSnapshot,
    registry.getDescriptorSnapshot,
  );
  const quickCheckSnapshot = EMPTY_STUDIO_QUICK_CHECK_SNAPSHOT_V1;
  const [savedScenarioCatalog, setSavedScenarioCatalog] = React.useState(
    readScientificProductSavedScenarioCatalogV1,
  );
  const instances = React.useMemo(
    () => descriptors as unknown as SimInstance[],
    [descriptors],
  );
  const scenarioCapacityReason = registry.scenarioCapacityReason;
  const scenarioCapacityMessage = scenarioCapacityReason === null
    ? null
    : scenarioCapacityReason.kind === "product-scenario-cap"
      ? t("workbench.scenarioPane.maximumScenariosReached", {
        count: scenarioCapacityReason.maximumScenarioCount,
      })
      : t("workbench.scenarioPane.liveLaneCapacityReached", {
        count: scenarioCapacityReason.maximumConcurrentLiveLaneCount,
      });
  const scenarioPresetCatalog = React.useMemo<readonly ScenarioPresetCatalogEntry[]>(
    () => scenarioCapacityMessage !== null
      ? SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1.map((entry) => ({
        ...entry,
        disabledReason: scenarioCapacityMessage,
      }))
      : SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1,
    [scenarioCapacityMessage],
  );
  const initialScenarioId = registry.getDescriptorSnapshot()[0]!.id;
  const markUserEdited = React.useCallback(() => undefined, []);
  const initialPresentation = React.useMemo(
    () => createScientificProductWorkbenchPresentationV1(
      runtime.workspaceDocument,
      initialScenarioId,
    ),
    [initialScenarioId, runtime.workspaceDocument],
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
      noteCaseKey: runtime.workspaceDocument.ref.sha256,
    },
    normalizePanelControllerItems: normalizeScientificPanelControllerItemsV1,
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
    displayClock.configure(isPlaying, 1);
  }, [displayClock, isPlaying]);

  React.useEffect(() => {
    let presentationBoundaryPassed = false;
    const synchronizePlayback = (): void => {
      const shouldRun = isPlaying && !document.hidden;
      for (const descriptor of registry.getDescriptorSnapshot()) {
        const scenarioRuntime = registry.getRuntime(descriptor.id);
        if (scenarioRuntime === null) continue;
        if (shouldRun) scenarioRuntime.controlStore.actions.resumeLive();
        else scenarioRuntime.controlStore.actions.pauseLive();
      }
    };
    // The paint boundary gates only starting or resuming presentation. A user
    // pause (or a hidden document) must suspend immediately rather than
    // accumulating another two animation frames of accepted work.
    if (!isPlaying || document.hidden) synchronizePlayback();
    const cancelDeferredStart = scheduleAfterCommittedPaintV1(() => {
      presentationBoundaryPassed = true;
      synchronizePlayback();
    });
    const synchronizeVisiblePlayback = (): void => {
      // Hidden always suspends immediately. Only visible resume is gated by
      // the paint boundary, which may still be pending for a new scenario.
      if (document.hidden || presentationBoundaryPassed) {
        synchronizePlayback();
      }
    };
    document.addEventListener(
      "visibilitychange",
      synchronizeVisiblePlayback,
    );
    return () => {
      cancelDeferredStart();
      document.removeEventListener(
        "visibilitychange",
        synchronizeVisiblePlayback,
      );
    };
  }, [descriptors, isPlaying, registry]);

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

  const openSavedScenario = React.useCallback((savedScenarioId: string) => {
    const normalizedSavedScenarioId = savedScenarioIdFromSubjectKeyV1(
      savedScenarioId,
    );
    const saved = savedScenarioCatalog.scenarios.find(
      ({ id }) => id === normalizedSavedScenarioId,
    );
    if (
      saved === undefined
      || saved.releaseRef.id !== SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id
      || saved.releaseRef.version !== SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version
      || saved.releaseRef.sha256 !== SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256
    ) return;
    const id = registry.addPreset(saved.sourceCaseId, {
      name: saved.name,
      color: saved.color,
      duplicateDraft: saved.controls,
    });
    if (id === null) return;
    panels.addVisibleInstanceConfigs([{ id }]);
    setAuthoredViews((previous) =>
      addVisibleScenariosToMetricsViews(previous, [id]));
    setActiveInstanceId(id);
    navigate({ pathname: location.pathname, search: "" });
  }, [
    location.pathname,
    navigate,
    panels.addVisibleInstanceConfigs,
    registry,
    savedScenarioCatalog.scenarios,
  ]);

  const saveCurrentScenario = React.useCallback((scenarioId: string): string | null => {
    const currentRuntime = registry.getRuntime(scenarioId);
    const presentation = registry.getPresentation(scenarioId);
    if (currentRuntime === null || presentation === null) return null;
    const committed = committedContextForPersistenceV1(
      currentRuntime.controlStore.getSnapshot(),
    );
    if (committed === null) return null;
    const savedId = nextSavedScenarioIdV1();
    const next = saveScientificProductScenarioV1(savedScenarioCatalog, {
      id: savedId,
      name: presentation.descriptor.name,
      color: presentation.descriptor.color,
      presentation,
      controlStateSha256: committed.controlState.targetStateSha256,
      controls: controlDraftFromContextV1(committed),
      savedAt: new Date(),
    });
    if (!writeScientificProductSavedScenarioCatalogV1(next)) return null;
    setSavedScenarioCatalog(next);
    return savedId;
  }, [registry, savedScenarioCatalog]);

  const removeSavedScenario = React.useCallback((savedScenarioId: string) => {
    const next = removeScientificProductSavedScenarioV1(
      savedScenarioCatalog,
      savedScenarioId,
    );
    if (!writeScientificProductSavedScenarioCatalogV1(next)) return;
    setSavedScenarioCatalog(next);
  }, [savedScenarioCatalog]);

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
  const toggleStudioPlayback = React.useCallback(() => {
    setPlaying((wasPlaying) => !wasPlaying);
  }, []);
  const evidenceViewOpen = React.useMemo(
    () => new URLSearchParams(location.search).get("view") === "evidence",
    [location.search],
  );
  React.useEffect(() => {
    if (!evidenceViewOpen || location.hash === "") return;
    navigate(
      { pathname: location.pathname, search: location.search, hash: "" },
      { replace: true },
    );
  }, [evidenceViewOpen, location.hash, location.pathname, location.search, navigate]);
  const evidenceScenarioSummaries = React.useMemo<
    readonly EvidenceChecksScenarioSummary[]
  >(() => descriptors.map((descriptor) => {
    const record = quickCheckSnapshot.records.find(
      ({ scenarioId }) => scenarioId === descriptor.id,
    );
    return Object.freeze({
      id: descriptor.id,
      name: descriptor.name,
      color: descriptor.color,
      status: evidenceControlStatusV1(record, descriptor.lifecycle),
      message: evidenceControlMessageV1(record, descriptor.lifecycle),
    });
  }), [descriptors, quickCheckSnapshot]);
  const evidenceStatus = React.useMemo<EvidenceChecksStatus>(() => {
    if (evidenceScenarioSummaries.some(({ status }) => status === "checking")) {
      return "checking";
    }
    const active = evidenceScenarioSummaries.find(
      ({ id }) => id === activeInstanceId,
    );
    return active?.status ?? "idle";
  }, [activeInstanceId, evidenceScenarioSummaries]);
  const openEvidenceView = React.useCallback(() => {
    const search = new URLSearchParams(location.search);
    search.set("view", "evidence");
    if (activeInstanceId) search.set("subject", sessionSubjectKeyV1(activeInstanceId));
    if (evidenceStatus === "findings" || evidenceStatus === "verification-error") {
      search.set("status", "review");
    } else {
      search.delete("status");
    }
    search.delete("scenario");
    navigate({ pathname: location.pathname, search: `?${search.toString()}` });
  }, [
    activeInstanceId,
    evidenceStatus,
    location.pathname,
    location.search,
    navigate,
  ]);
  const currentEvidenceSubjects = React.useMemo<
    readonly ScientificProductEvidenceSubjectV1[]
  >(() => descriptors.map((descriptor) => {
    const record = quickCheckSnapshot.records.find(
      ({ scenarioId }) => scenarioId === descriptor.id,
    );
    return Object.freeze({
      key: sessionSubjectKeyV1(descriptor.id),
      name: descriptor.name,
      description: descriptor.lifecycle === "ready"
        ? "Volatile Workbench session. Save explicitly to keep it in My scenarios."
        : descriptor.statusMessage,
      statusLabel: evidenceSubjectStatusLabelV1(record, descriptor.lifecycle),
      disabled: descriptor.lifecycle === "failed",
    });
  }), [descriptors, quickCheckSnapshot.records]);
  const presetEvidenceSubjects = React.useMemo<
    readonly ScientificProductEvidenceSubjectV1[]
  >(() => SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map((caseEntry) => {
    const report = quickCheckSnapshot.records.find((record) =>
      record.sourceCaseId === caseEntry.caseId
      && record.committedControlStateSha256
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0);
    return Object.freeze({
      key: presetSubjectKeyV1(caseEntry.caseId),
      name: caseEntry.displayName,
      description: caseEntry.description,
      statusLabel: report === undefined
        ? "Studio V&V report unavailable"
        : evidenceSubjectStatusLabelV1(report, "ready"),
    });
  }), [quickCheckSnapshot.records]);
  const savedEvidenceSubjects = React.useMemo<
    readonly ScientificProductEvidenceSubjectV1[]
  >(() => savedScenarioCatalog.scenarios.map((saved) => {
    const releaseMatches = saved.releaseRef.id
        === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id
      && saved.releaseRef.version === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version
      && saved.releaseRef.sha256 === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256;
    const report = quickCheckSnapshot.records.find((record) =>
      record.sourceCaseId === saved.sourceCaseId
      && record.committedControlStateSha256 === saved.controlStateSha256);
    return Object.freeze({
      key: savedSubjectKeyV1(saved.id),
      name: saved.name,
      description: releaseMatches
        ? `Saved ${new Date(saved.savedAtIso).toLocaleString()}. Studio V&V reporting is not connected yet.`
        : "Saved under a different model release; opening is disabled.",
      statusLabel: !releaseMatches
        ? "Release mismatch"
        : report === undefined
          ? "Saved · V&V report unavailable"
          : evidenceSubjectStatusLabelV1(report, "ready"),
    });
  }), [quickCheckSnapshot.records, savedScenarioCatalog.scenarios]);
  const requestedEvidenceSubject = React.useMemo(
    () => new URLSearchParams(location.search).get("subject"),
    [location.search],
  );
  const initialEvidenceFilter = React.useMemo(
    () => evidenceMetricFilterFromSearchV1(location.search),
    [location.search],
  );
  const selectedEvidenceSubjectKey = React.useMemo(() => {
    const keys = new Set([
      ...currentEvidenceSubjects,
      ...presetEvidenceSubjects,
      ...savedEvidenceSubjects,
    ].map(({ key }) => key));
    if (
      requestedEvidenceSubject !== null
      && keys.has(requestedEvidenceSubject)
    ) return requestedEvidenceSubject;
    const activeKey = sessionSubjectKeyV1(activeInstanceId);
    return keys.has(activeKey)
      ? activeKey
      : currentEvidenceSubjects[0]?.key
        ?? presetEvidenceSubjects[0]?.key
        ?? "unavailable";
  }, [
    activeInstanceId,
    currentEvidenceSubjects,
    presetEvidenceSubjects,
    requestedEvidenceSubject,
    savedEvidenceSubjects,
  ]);
  const selectedEvidence = React.useMemo(() => selectEvidenceSubjectV1({
    subjectKey: selectedEvidenceSubjectKey,
    registry,
    records: quickCheckSnapshot.records,
    savedScenarios: savedScenarioCatalog.scenarios,
  }), [
    quickCheckSnapshot.records,
    registry,
    savedScenarioCatalog.scenarios,
    selectedEvidenceSubjectKey,
  ]);
  const selectedEvidenceReport = React.useMemo(
    () => createScientificProductEvidenceReportV1({
      subjectKey: selectedEvidenceSubjectKey,
      subjectName: selectedEvidence.name,
      subjectKind: selectedEvidence.kind,
      record: selectedEvidence.record,
      builtInDiseasePreset: selectedEvidence.builtInDiseasePreset,
      releaseId: selectedEvidence.releaseId,
      releaseVersion: selectedEvidence.releaseVersion,
      releaseSha256: selectedEvidence.releaseSha256,
      workspaceSha256: selectedEvidence.workspaceSha256,
      unavailableVerificationError:
        selectedEvidence.unavailableVerificationError,
      unavailableMessage: selectedEvidence.unavailableMessage,
    }),
    [selectedEvidence, selectedEvidenceSubjectKey],
  );
  const selectEvidenceSubject = React.useCallback((subjectKey: string) => {
    const selectedSessionId = sessionIdFromSubjectKeyV1(subjectKey);
    if (
      selectedSessionId !== null
      && descriptors.some(({ id }) => id === selectedSessionId)
    ) setActiveInstanceId(selectedSessionId);
    const search = new URLSearchParams(location.search);
    search.set("view", "evidence");
    search.set("subject", subjectKey);
    navigate({ pathname: location.pathname, search: `?${search.toString()}` });
  }, [descriptors, location.pathname, location.search, navigate]);
  const closeEvidenceView = React.useCallback(() => {
    const search = new URLSearchParams(location.search);
    search.delete("view");
    search.delete("subject");
    search.delete("status");
    search.delete("scenario");
    const query = search.toString();
    navigate({ pathname: location.pathname, search: query ? `?${query}` : "" });
  }, [location.pathname, location.search, navigate]);
  const saveCurrentFromEvidence = React.useCallback(() => {
    const scenarioId = sessionIdFromSubjectKeyV1(selectedEvidenceSubjectKey);
    if (scenarioId === null) return;
    const savedId = saveCurrentScenario(scenarioId);
    if (savedId !== null) selectEvidenceSubject(savedSubjectKeyV1(savedId));
  }, [saveCurrentScenario, selectEvidenceSubject, selectedEvidenceSubjectKey]);
  const openCurrentFromEvidence = React.useCallback((subjectKey: string) => {
    const scenarioId = sessionIdFromSubjectKeyV1(subjectKey);
    if (
      scenarioId !== null
      && descriptors.some(({ id }) => id === scenarioId)
    ) setActiveInstanceId(scenarioId);
    closeEvidenceView();
  }, [closeEvidenceView, descriptors]);
  const openPresetFromEvidence = React.useCallback((subjectKey: string) => {
    const caseId = presetCaseIdFromSubjectKeyV1(subjectKey);
    if (caseId === null) return;
    addInstance(undefined, caseId);
    navigate({ pathname: location.pathname, search: "" });
  }, [addInstance, location.pathname, navigate]);
  const deleteSavedFromEvidence = React.useCallback((subjectKey: string) => {
    const savedId = savedScenarioIdFromSubjectKeyV1(subjectKey);
    removeSavedScenario(savedId);
    selectEvidenceSubject(sessionSubjectKeyV1(activeInstanceId));
  }, [activeInstanceId, removeSavedScenario, selectEvidenceSubject]);
  const selectedCurrentId = sessionIdFromSubjectKeyV1(
    selectedEvidenceSubjectKey,
  );
  const selectedCurrentRuntime = selectedCurrentId === null
    ? null
    : registry.getRuntime(selectedCurrentId);
  const selectedCurrentSettled = selectedCurrentRuntime !== null
    && committedContextForPersistenceV1(
      selectedCurrentRuntime.controlStore.getSnapshot(),
    ) !== null;
  const saveDisabled = selectedCurrentId === null
    || descriptors.find(({ id }) => id === selectedCurrentId)?.lifecycle
      !== "ready"
    || !selectedCurrentSettled
    || quickCheckSnapshot.records.find(
      ({ scenarioId }) => scenarioId === selectedCurrentId,
    )?.status === "checking";
  const openingWouldAddScenario = selectedEvidence.kind !== "current-session";
  const openInWorkbenchDisabled = openingWouldAddScenario
    && (
      descriptors.length >= registry.maximumScenarioCount
      || !selectedEvidence.releaseMatchesCurrent
    );

  return (
    <StudioBriefingPickProviderV1 value={briefingPickApi}>
    <div
      className="workbench-root relative flex h-full w-full flex-col overflow-hidden bg-wb-app font-sans text-wb-text"
      style={briefingOpen
        ? {
          // Compose is non-modal: the Workbench must stay reachable so a pane
          // can be adjusted and re-synced without closing the layer. Reserving
          // the width (rather than being overlaid) is what makes that true.
          paddingRight: "min(100vw, max(560px, min(45vw, 820px)))",
          transition: "padding-right 200ms cubic-bezier(0.32,0.72,0,1)",
        }
        : { transition: "padding-right 200ms cubic-bezier(0.32,0.72,0,1)" }}
      data-briefing-compose-open={String(briefingOpen)}
      data-workbench-theme={workbenchTheme}
      data-testid="scientific-product-workbench-host-v1"
      data-product-case-id={resolution.canonicalCaseId}
      data-release-id={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id}
      data-release-version={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version}
      data-release-sha256={SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256}
      data-scenario-count={descriptors.length}
    >
      <ScientificProductFrameEvidenceV1
        registry={registry}
        activeScenarioId={activeInstanceId}
      />
      {evidenceViewOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ScientificProductEvidencePageV1
            currentSessions={currentEvidenceSubjects}
            presets={presetEvidenceSubjects}
            savedScenarios={savedEvidenceSubjects}
            selectedSubjectKey={selectedEvidenceSubjectKey}
            selectedReport={selectedEvidenceReport}
            locale={locale}
            initialFilter={initialEvidenceFilter}
            onSelect={selectEvidenceSubject}
            onBack={closeEvidenceView}
            onSaveCurrent={saveCurrentFromEvidence}
            onOpenCurrent={openCurrentFromEvidence}
            onOpenPreset={openPresetFromEvidence}
            onOpenSaved={openSavedScenario}
            onDeleteSaved={deleteSavedFromEvidence}
            saveDisabled={saveDisabled}
            saveDisabledReason="Use the settled candidate before saving this scenario."
            openInWorkbenchDisabled={openInWorkbenchDisabled}
          />
        </div>
      )}
      {!evidenceViewOpen && <WorkbenchHeader
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
        showPrimaryAction={false}
        fileActionsDisabled
        fileActionsUnavailableReason={t("workbench.scientificFilesUnavailable")}
        isPlaying={isPlaying}
        togglePlay={toggleStudioPlayback}
        playLabel={t("workbench.header.resumeLiveTrace")}
        pauseLabel={t("workbench.header.pauseLiveTrace")}
        timeScale={1}
        setTimeScale={noPhysicsMutation}
        showTimeScaleControl={false}
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
        evidenceChecksControl={(
          <EvidenceChecksStatusControl
            status={evidenceStatus}
            scenarios={evidenceScenarioSummaries}
            onOpenFullReport={openEvidenceView}
          />
        )}
        presentationComposeControl={(
          composeTarget === null ? null : (
            <ScientificWorkbenchBriefingControlV1
              panels={panels.panels}
              registry={registry}
              activeScenarioId={activeInstanceId}
              target={composeTarget}
              onOpenChange={setBriefingOpen}
              onPickApiChange={setBriefingPickApi}
            />
          )
        )}
        settingsContent={(
          <ScientificProductTransitionBehaviorSettingsV1
            registry={registry}
            activeScenarioId={activeInstanceId}
          />
        )}
      />}
      <div
        className={evidenceViewOpen ? "hidden" : "contents"}
        aria-hidden={evidenceViewOpen}
        inert={evidenceViewOpen}
        data-workbench-surface-preserved="true"
      >
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
        timeScale={1}
        setTimeScale={noPhysicsMutation}
        isPlaying={isPlaying}
        togglePlay={toggleStudioPlayback}
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
        updatePanelPvHistory={panels.updatePanelPvHistory}
        updatePanelPvRelations={panels.updatePanelPvRelations}
        updatePanelHemodynamicSettings={panels.updatePanelHemodynamicSettings}
        updatePanelControllerItems={panels.updatePanelControllerItems}
        updatePanelLegendPosition={panels.updatePanelLegendPosition}
        noteCaseKey={panels.noteCaseKey}
        notes={panels.notes}
        onNoteChange={panels.onNoteChange}
        chambers={["LV", "LA", "RV", "RA"]}
        signals={SCIENTIFIC_WORKBENCH_SIGNAL_OPTIONS_V1 as unknown as SignalType[]}
        metrics={[...SCIENTIFIC_WORKBENCH_METRIC_OPTIONS_V1]}
        controlGroups={["scientific-release-bound-controls-v1"]}
        runtimeRenderer={runtimeRenderer}
        controllerAuthoring={SCIENTIFIC_CONTROLLER_AUTHORING_V1}
        metricAuthoring={SCIENTIFIC_METRIC_AUTHORING_V1}
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
    </div>
    </StudioBriefingPickProviderV1>
  );
}

function ScientificProductFrameEvidenceV1({
  registry,
  activeScenarioId,
}: Readonly<{
  registry: ScientificProductRuntimeRegistryPortV1;
  activeScenarioId: string;
}>) {
  const presentation = useScientificScenarioPresentationV1(
    registry,
    activeScenarioId,
  );
  const runtime = registry.getRuntime(activeScenarioId);
  React.useSyncExternalStore(
    runtime?.controlStore.subscribe ?? EMPTY_SUBSCRIBE_V1,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT_V1,
    runtime?.controlStore.getSnapshot ?? EMPTY_CONTROL_SNAPSHOT_V1,
  );
  const studio = registry.getStudioStatus?.(activeScenarioId) ?? null;
  return (
    <span
      hidden
      data-testid="scientific-product-frame-evidence-v1"
      data-scenario-id={activeScenarioId}
      data-scientific-frame-count={presentation?.frames.length ?? 0}
      data-scientific-final-revision={presentation?.frames.at(-1)?.revision ?? ""}
      data-displayed-evidence={presentation?.displayedEvidence ?? "unavailable"}
      data-studio-runtime="true"
      data-studio-target-generation={studio?.targetGeneration ?? ""}
      data-studio-presentation-revision={studio?.presentationRevision ?? ""}
      data-studio-live-playback={studio?.livePlayback ?? ""}
      data-studio-live-pacing-mode={studio?.livePacing.mode ?? ""}
      data-studio-live-pacing-epoch-lag-ms={studio?.livePacing.epochLagMs ?? ""}
      data-studio-live-pacing-achieved-rate={
        studio?.livePacing.recentAchievedRate ?? ""
      }
      data-studio-live-pacing-rebased-deficit-ms={
        studio?.livePacing.cumulativeRebasedDeficitMs ?? ""
      }
      data-studio-strict-phase={studio?.strictPhase ?? ""}
      data-studio-strict-candidate={String(
        studio?.strictCandidateAvailable === true,
      )}
      data-studio-strict-candidate-pinned={String(
        studio?.strictCandidatePinned === true,
      )}
      data-studio-pinned-run-count={studio?.pinnedRunCount ?? 0}
    />
  );
}

const EMPTY_SUBSCRIBE_V1 = (_listener: () => void): (() => void) =>
  () => undefined;
const EMPTY_CONTROL_SNAPSHOT_V1 = () => null;

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
        pvHistoryBeats: DEFAULT_PV_LOOP_HISTORY_BEATS,
        pvHistoryMode: "fade",
        pvRelationDisplayMode: "off",
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: true,
      pvHistoryBeats: DEFAULT_PV_LOOP_HISTORY_BEATS,
      pvHistoryMode: "fade",
      pvRelationDisplayMode: "off",
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
    {
      id: "product-guyton-left-v1",
      sourceViewId: "product-guyton-left-v1",
      type: "GUYTON_LEFT",
      title: "Left filling pressure–cardiac output",
      role: "graph",
      zone: "main",
      x: 0,
      y: 8,
      w: 6,
      h: 6,
      config: visibleConfig(["Default"]),
      view: {
        kind: "graph",
        graphType: "guyton-left",
        showLegend: true,
        showGuides: true,
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 5,
        hemodynamicAllowNegativeFillingPressure: false,
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: true,
      hemodynamicDetailMode: "compare",
      hemodynamicParameterHistoryCount: 5,
      hemodynamicAllowNegativeFillingPressure: false,
    },
    {
      id: "product-guyton-right-v1",
      sourceViewId: "product-guyton-right-v1",
      type: "GUYTON_RIGHT",
      title: "Right filling pressure–cardiac output",
      role: "graph",
      zone: "main",
      x: 6,
      y: 8,
      w: 6,
      h: 6,
      config: visibleConfig(["Default"]),
      view: {
        kind: "graph",
        graphType: "guyton-right",
        showLegend: true,
        showGuides: true,
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 5,
        hemodynamicAllowNegativeFillingPressure: false,
      },
      isSettingsOpen: false,
      showLegend: true,
      showGuides: true,
      hemodynamicDetailMode: "compare",
      hemodynamicParameterHistoryCount: 5,
      hemodynamicAllowNegativeFillingPressure: false,
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

function normalizeScientificPanelControllerItemsV1(
  items: ControllerItem[],
): ControllerItem[] {
  return normalizeControllerItemsForAuthoring(
    items,
    SCIENTIFIC_CONTROLLER_AUTHORING_V1,
  ).items;
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
      "scientific-controller-circulation-load-v1",
      "Circulation load",
      SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1,
    ),
    scientificControllerViewV1(
      "scientific-controller-ventilation-restraint-v1",
      "Ventilation & pericardium",
      SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1,
    ),
    scientificControllerViewV1(
      "scientific-controller-research-complete-v1",
      "All scientific controls",
      SCIENTIFIC_WORKBENCH_CONTROLLER_ITEMS_V1,
    ),
    createMetricsViewSpec(
      "scientific-metrics-pressure-v1",
      "Hemodynamics",
      [...SCIENTIFIC_WORKBENCH_OVERVIEW_METRICS_V1],
      [{ id: scenarioId } as SimInstance],
    ),
    createMetricsViewSpec(
      "scientific-metrics-output-v1",
      "Pump function",
      [...SCIENTIFIC_WORKBENCH_PUMP_METRICS_V1],
      [{ id: scenarioId } as SimInstance],
    ),
    createMetricsViewSpec(
      "scientific-metrics-ventricular-v1",
      "Valve function",
      [...SCIENTIFIC_WORKBENCH_VALVE_METRICS_V1],
      [{ id: scenarioId } as SimInstance],
    ),
  ];
}

const SCIENTIFIC_CONTROLLER_AUTHORING_V1: ControllerAuthoringCatalog = {
  sections: [
    {
      id: "release-bound-circulation",
      title: "Circulation load",
      defaultOpen: true,
      entries: SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1.map((item) => ({
        key: item.paramKey,
        label: item.label ?? item.paramKey,
        min: item.min ?? 0,
        max: item.max ?? 1,
        step: item.step ?? 0.01,
        unit: scientificControlUnitV1(item.paramKey),
        defaultKind: "slider" as const,
        allowedKinds: ["slider"] as const,
        options: item.options ?? [],
        lockedDomain: true,
      })),
    },
    {
      id: "release-bound-ventilation-restraint",
      title: "Ventilation & pericardial restraint",
      defaultOpen: false,
      entries: SCIENTIFIC_WORKBENCH_VENTILATION_RESTRAINT_CONTROLLER_ITEMS_V1
        .map((item) => ({
          key: item.paramKey,
          label: item.label ?? item.paramKey,
          min: item.min ?? 0,
          max: item.max ?? 1,
          step: item.step ?? 1,
          unit: scientificControlUnitV1(item.paramKey),
          defaultKind: "slider" as const,
          allowedKinds: ["slider"] as const,
          options: item.options ?? [],
          lockedDomain: true,
        })),
    },
  ],
  baselineValues: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0,
  defaultItems: SCIENTIFIC_WORKBENCH_CIRCULATION_CONTROLLER_ITEMS_V1,
};

function scientificControlUnitV1(paramKey: string): string {
  const domain = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
    paramKey as keyof typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0
  ];
  if (domain === undefined) return "";
  if (domain.unit === "scale-from-release-baseline") return "×";
  if (domain.unit === "cmH2O") return "cmH₂O";
  if (domain.unit === "mL") return "mL";
  return "";
}

const SCIENTIFIC_METRIC_CATEGORY_TITLES_V1 = {
  pressure: "Pressures",
  ventricular: "Ventricular pump",
  valve: "Valve flow and lesions",
} as const satisfies Record<ScientificWorkbenchMetricCategoryV1, string>;

const SCIENTIFIC_METRIC_AUTHORING_V1: MetricAuthoringCatalog = {
  sections: (Object.entries(SCIENTIFIC_METRIC_CATEGORY_TITLES_V1) as ReadonlyArray<
    readonly [ScientificWorkbenchMetricCategoryV1, string]
  >).map(([category, title]) => ({
    id: `scientific-metrics-${category}-v1`,
    title,
    entries: SCIENTIFIC_WORKBENCH_METRIC_PRESENTATION_CATALOG_V1
      .filter((entry) => entry.category === category)
      .map((entry) => ({
        key: entry.metricId,
        label: entry.label,
        unit: entry.unit,
      })),
  })),
};

const SCIENTIFIC_SCENARIO_PRESET_CATALOG_V1:
readonly ScenarioPresetCatalogEntry[] = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map(
  (entry) => ({
    id: entry.caseId,
    label: entry.displayName,
    detail: entry.badge,
  }),
);

function evidenceControlStatusV1(
  record: ScientificProductQuickCheckRecordV1 | undefined,
  lifecycle: "loading" | "ready" | "failed",
): EvidenceChecksStatus {
  if (lifecycle === "loading" || record?.status === "checking") {
    return "checking";
  }
  if (lifecycle === "failed" || record?.status === "verification-error") {
    return "verification-error";
  }
  if (record?.status === "passed") {
    return record.validationFindingCount > 0 ? "findings" : "passed";
  }
  return "idle";
}

function evidenceControlMessageV1(
  record: ScientificProductQuickCheckRecordV1 | undefined,
  lifecycle: "loading" | "ready" | "failed",
): string {
  if (lifecycle === "loading") return "Preparing scenario…";
  if (lifecycle === "failed") return "Scenario calculation failed.";
  if (record === undefined) return STUDIO_VV_NOT_CONNECTED_MESSAGE_V1;
  if (record.status === "passed") {
    const review = evidenceReferenceReviewLabelV1(record);
    return review === null ? "Quick check passed." : `${review}.`;
  }
  return record.message;
}

function committedContextForPersistenceV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): ScientificResearchControlContextV0 | null {
  const requestedSha256 = snapshot.targetControlStateSha256
    ?? snapshot.source.context.controlState.targetStateSha256;
  if (
    snapshot.candidate?.context.controlState.targetStateSha256
      === requestedSha256
  ) return snapshot.candidate.context;
  if (
    snapshot.source.context.controlState.targetStateSha256
      === requestedSha256
  ) return snapshot.source.context;
  return null;
}

function controlDraftFromContextV1(
  context: ScientificResearchControlContextV0,
): ScientificWorkbenchResearchControlDraftV0 {
  const controls = context.controlState.controls;
  return Object.freeze({
    systemic:
      controls["circulation.systemic-vascular-resistance-scale"],
    pulmonary:
      controls["circulation.pulmonary-vascular-resistance-scale"],
    venousTone: controls["circulation.venous-tone"],
    arterialStiffness: controls["circulation.arterial-stiffness"],
    peepCmH2O: controls["ventilation.peep-cm-h2o"],
    pericardialFluidVolumeMl:
      controls["pericardium.prescribed-fluid-volume-ml"],
  });
}

let savedScenarioOrdinalV1 = 0;

function nextSavedScenarioIdV1(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid !== undefined) return `my-scenario-${uuid}`;
  savedScenarioOrdinalV1 += 1;
  return `my-scenario-${Date.now()}-${savedScenarioOrdinalV1}`;
}

const SESSION_SUBJECT_PREFIX_V1 = "session:";
const PRESET_SUBJECT_PREFIX_V1 = "preset:";
const SAVED_SUBJECT_PREFIX_V1 = "saved:";

function sessionSubjectKeyV1(scenarioId: string): string {
  return `${SESSION_SUBJECT_PREFIX_V1}${scenarioId}`;
}

function presetSubjectKeyV1(caseId: string): string {
  return `${PRESET_SUBJECT_PREFIX_V1}${caseId}`;
}

function savedSubjectKeyV1(savedScenarioId: string): string {
  return `${SAVED_SUBJECT_PREFIX_V1}${savedScenarioId}`;
}

function sessionIdFromSubjectKeyV1(subjectKey: string): string | null {
  return subjectKey.startsWith(SESSION_SUBJECT_PREFIX_V1)
    ? subjectKey.slice(SESSION_SUBJECT_PREFIX_V1.length)
    : null;
}

function presetCaseIdFromSubjectKeyV1(subjectKey: string): string | null {
  return subjectKey.startsWith(PRESET_SUBJECT_PREFIX_V1)
    ? subjectKey.slice(PRESET_SUBJECT_PREFIX_V1.length)
    : null;
}

function savedScenarioIdFromSubjectKeyV1(subjectKey: string): string {
  return subjectKey.startsWith(SAVED_SUBJECT_PREFIX_V1)
    ? subjectKey.slice(SAVED_SUBJECT_PREFIX_V1.length)
    : subjectKey;
}

function evidenceMetricFilterFromSearchV1(
  search: string,
): ScientificProductEvidenceMetricFilterV1 {
  const requested = new URLSearchParams(search).get("status");
  if (
    requested === "review"
    || requested === "meets"
    || requested === "unassessed"
  ) return requested;
  return "all";
}

function evidenceSubjectStatusLabelV1(
  record: ScientificProductQuickCheckRecordV1 | undefined,
  lifecycle: "loading" | "ready" | "failed",
): string {
  if (lifecycle === "loading") return "Checking";
  if (lifecycle === "failed") return "Verification error";
  if (record === undefined) return "Studio V&V report unavailable";
  if (record.status === "checking") return "Checking";
  if (record.status === "verification-error") return "Verification error";
  return evidenceReferenceReviewLabelV1(record) ?? "Quick check passed";
}

function evidenceReferenceReviewLabelV1(
  record: ScientificProductQuickCheckRecordV1,
): string | null {
  const labels: string[] = [];
  if (record.validationFindingCount > 0) {
    labels.push(
      `${record.validationFindingCount} reference finding${record.validationFindingCount === 1 ? "" : "s"}`,
    );
  }
  if (record.validationUnavailableCount > 0) {
    labels.push(
      `${record.validationUnavailableCount} reference comparison${record.validationUnavailableCount === 1 ? "" : "s"} not assessed`,
    );
  }
  return labels.length === 0 ? null : labels.join(" · ");
}

type SelectedScientificProductEvidenceV1 = Readonly<{
  kind: "current-session" | "preset" | "saved-scenario";
  name: string;
  record: ScientificProductQuickCheckRecordV1 | null;
  builtInDiseasePreset: boolean;
  releaseId: string;
  releaseVersion: string;
  releaseSha256: string;
  workspaceSha256: string | null;
  releaseMatchesCurrent: boolean;
  unavailableVerificationError: string | null;
  unavailableMessage: string | null;
}>;

function selectEvidenceSubjectV1(input: Readonly<{
  subjectKey: string;
  registry: ScientificProductRuntimeRegistryPortV1;
  records: readonly ScientificProductQuickCheckRecordV1[];
  savedScenarios: readonly ScientificProductSavedScenarioV1[];
}>): SelectedScientificProductEvidenceV1 {
  const sessionId = sessionIdFromSubjectKeyV1(input.subjectKey);
  if (sessionId !== null) {
    const presentation = input.registry.getPresentation(sessionId);
    const descriptor = input.registry.getDescriptorSnapshot().find(
      ({ id }) => id === sessionId,
    );
    const record = input.records.find(
      ({ scenarioId }) => scenarioId === sessionId,
    ) ?? null;
    return Object.freeze({
      kind: "current-session" as const,
      name: descriptor?.name ?? "Current scenario",
      record,
      builtInDiseasePreset: false,
      releaseId: descriptor?.source.releaseId
        ?? SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id,
      releaseVersion: descriptor?.source.releaseVersion
        ?? SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version,
      releaseSha256: descriptor?.source.releaseSha256
        ?? SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256,
      workspaceSha256: presentation?.workspaceDocument.ref.sha256 ?? null,
      releaseMatchesCurrent: true,
      unavailableVerificationError: descriptor?.lifecycle === "failed"
        ? descriptor.statusMessage
        : null,
      unavailableMessage: record === null
        ? STUDIO_VV_NOT_CONNECTED_MESSAGE_V1
        : null,
    });
  }

  const presetCaseId = presetCaseIdFromSubjectKeyV1(input.subjectKey);
  if (presetCaseId !== null) {
    const caseEntry = scientificProductCaseByIdV1(presetCaseId);
    const record = input.records.find((candidate) =>
      candidate.sourceCaseId === presetCaseId
      && candidate.committedControlStateSha256
        === MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0)
      ?? null;
    const presentation = record === null
      ? null
      : input.registry.getPresentation(record.scenarioId);
    return Object.freeze({
      kind: "preset" as const,
      name: caseEntry?.displayName ?? presetCaseId,
      record,
      builtInDiseasePreset: caseEntry?.kind === "research-bracket",
      releaseId: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id,
      releaseVersion: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version,
      releaseSha256: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256,
      workspaceSha256: presentation?.workspaceDocument.ref.sha256 ?? null,
      releaseMatchesCurrent: true,
      unavailableVerificationError: null,
      unavailableMessage: record === null
        ? STUDIO_VV_NOT_CONNECTED_MESSAGE_V1
        : null,
    });
  }

  const savedId = savedScenarioIdFromSubjectKeyV1(input.subjectKey);
  const saved = input.savedScenarios.find(({ id }) => id === savedId);
  if (saved !== undefined) {
    const releaseMatchesCurrent =
      saved.releaseRef.id === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id
      && saved.releaseRef.version === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version
      && saved.releaseRef.sha256 === SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256;
    const record = releaseMatchesCurrent
      ? input.records.find((candidate) =>
        candidate.sourceCaseId === saved.sourceCaseId
        && candidate.committedControlStateSha256 === saved.controlStateSha256)
        ?? null
      : null;
    return Object.freeze({
      kind: "saved-scenario" as const,
      name: saved.name,
      record,
      builtInDiseasePreset: false,
      releaseId: saved.releaseRef.id,
      releaseVersion: saved.releaseRef.version,
      releaseSha256: saved.releaseRef.sha256,
      workspaceSha256: saved.workspaceSha256,
      releaseMatchesCurrent,
      unavailableVerificationError: null,
      unavailableMessage: releaseMatchesCurrent
        ? record === null
          ? STUDIO_VV_NOT_CONNECTED_MESSAGE_V1
          : null
        : "This saved scenario belongs to a different model release. Its evidence is not reused or translated silently.",
    });
  }

  return Object.freeze({
    kind: "preset" as const,
    name: "Unavailable scenario",
    record: null,
    builtInDiseasePreset: false,
    releaseId: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id,
    releaseVersion: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version,
    releaseSha256: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256,
    workspaceSha256: null,
    releaseMatchesCurrent: true,
    unavailableVerificationError: null,
    unavailableMessage: STUDIO_VV_NOT_CONNECTED_MESSAGE_V1,
  });
}

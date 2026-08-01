import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  Check,
  ClipboardList,
  FileText,
  Home,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { ModelLimitations } from "@/components/ModelLimitations";
import {
  WorkbenchDockview,
} from "@/components/workbench/WorkbenchDockview";
import {
  WorkbenchBriefingComposerV3,
  type WorkbenchBriefingPanePickV3,
} from "@/components/workbench/WorkbenchBriefingComposerV3";
import {
  WorkbenchModelMenuV3,
} from "@/components/workbench/WorkbenchModelMenuV3";
import {
  WorkbenchNoteEditorV3,
} from "@/components/workbench/WorkbenchNoteEditorV3";
import {
  WorkbenchPaneEditorV3,
  addWorkbenchSurfacePaneV3,
} from "@/components/workbench/WorkbenchPaneEditorV3";
import {
  WorkbenchScenarioManagerV3,
  type WorkbenchScenarioAddIntentV3,
  type WorkbenchScenarioDeleteIntentV3,
  type WorkbenchScenarioDuplicateIntentV3,
  type WorkbenchScenarioRenameIntentV3,
} from "@/components/workbench/WorkbenchScenarioManagerV3";
import {
  commitWorkbenchTransientAuthoringResultV3,
} from "@/components/workbench/WorkbenchTransientAuthoringCommitV3";
import {
  WORKBENCH_SCENARIO_ID_V3,
  WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3,
  allSurfacePanesV3,
  createDefaultExperimentSurfaceV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  allocateOpaqueWorkbenchIdV3,
  isOpaqueWorkbenchIdV3,
} from "@/studio/infrastructure/browser/StudioWorkbenchIdentityV3";
import {
  articlesHref,
  homeHref,
  workbenchDetailHref,
  workbenchHref,
} from "@/homeLinks";
import { isLocale } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
  ExperimentWorkspaceV2,
  ScenarioPresetV2,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import type {
  ControlDefinitionV2,
  ModelContractV2,
  StructuralReturnGraphDefinitionV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import type {
  StudioSimulationWorkerScenarioDescriptorV2,
  StudioSimulationWorkerScenarioStateV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  StudioSnapshotBriefingHandoffV3,
  createBrowserStudioSnapshotBriefingHandoffV3,
} from "@/studio/infrastructure/browser/StudioSnapshotBriefingHandoffV3";
import {
  GuytonStarlingOrientationCanvasV3,
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  WorkbenchScenarioPresentationSampleStoreV3,
  structuralReturnOrientationFromPayloadV3,
  useWorkbenchScenarioExactOrbitSamplesV3,
  useWorkbenchScenarioOrbitHistoryV3,
  useWorkbenchScenarioPresentationSamplesV3,
} from "@/components/workbench/v3";
import {
  WorkbenchParallelAuthoringCoordinatorV3,
} from "@/components/workbench/v3/WorkbenchParallelAuthoringCoordinatorV3";
import {
  WorkbenchParallelScenarioRuntimeV3,
  type WorkbenchParallelScenarioSeedV3,
} from "@/components/workbench/v3/WorkbenchParallelScenarioRuntimeV3";
import {
  randomPortableTokenV3,
} from "@/components/workbench/v3/randomPortableTokenV3";

type WorkbenchStatusV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "live";
      contract: ModelContractV2;
      frame: StudioSimulationFrameV2;
    }>
  | Readonly<{
      kind: "unavailable-model";
      savedModelId: string;
      currentModelId: string;
    }>
  | Readonly<{ kind: "error"; message: string }>;

type WorkbenchPaneSettingsV3 =
  | Readonly<{ kind: "graph"; paneId: string }>
  | Readonly<{ kind: "output"; paneId: string }>
  | Readonly<{ kind: "control"; paneId: string }>;

type WorkbenchScenarioOperationV3 =
  | "select"
  | "add"
  | "duplicate"
  | "rename"
  | "delete";

type WorkbenchRuntimeRestartFeedbackV3 = Readonly<{
  saveState: "clean" | "dirty" | "error";
  saveError: string | null;
  snapshotState: "idle" | "created" | "error";
  snapshotError: string | null;
}>;

const WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3 = 0.1;
const EMPTY_WORKBENCH_GRAPH_HISTORY_V3 = Object.freeze([] as never[]);

export const WorkbenchV3Page = () => {
  const { locale, workbenchId } = useParams();
  const selectedLocale = isLocale(locale) ? locale : undefined;
  if (!isOpaqueWorkbenchIdV3(workbenchId)) {
    return <Navigate to={workbenchHref(selectedLocale)} replace />;
  }
  return (
    <WorkbenchV3Session
      key={workbenchId}
      experimentId={workbenchId}
    />
  );
};

const WorkbenchV3Session = ({
  experimentId,
}: Readonly<{ experimentId: string }>) => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<WorkbenchStatusV3>({
    kind: "loading",
  });
  const [presentationSampleStore] = React.useState(
    () => new WorkbenchScenarioPresentationSampleStoreV3(),
  );
  const [briefingHandoff] = React.useState(
    createBrowserStudioSnapshotBriefingHandoffV3,
  );
  const [surface, setSurface] = React.useState<ExperimentSurfaceV2 | null>(null);
  const [workspace, setWorkspace] = React.useState<ExperimentWorkspaceV2 | null>(null);
  const [snapshotCount, setSnapshotCount] = React.useState(0);
  const [saveState, setSaveState] = React.useState<
    "clean" | "dirty" | "saving" | "error"
  >("clean");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [snapshotState, setSnapshotState] = React.useState<
    "idle" | "creating" | "created" | "error"
  >("idle");
  const [snapshotError, setSnapshotError] = React.useState<string | null>(null);
  const [recoveryError, setRecoveryError] = React.useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [briefingPicks, setBriefingPicks] = React.useState<
    readonly WorkbenchBriefingPanePickV3[]
  >([]);
  const [limitationsOpen, setLimitationsOpen] = React.useState(false);
  const [paneSettings, setPaneSettings] = React.useState<
  WorkbenchPaneSettingsV3 | null
  >(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [runtimeGeneration, setRuntimeGeneration] = React.useState(0);
  const [controlValues, setControlValues] = React.useState<
  Readonly<Record<string, number>>
  >({});
  const [pendingControlId, setPendingControlId] = React.useState<string | null>(null);
  const [controlError, setControlError] = React.useState<string | null>(null);
  const [scenarios, setScenarios] = React.useState<
    readonly StudioSimulationWorkerScenarioDescriptorV2[]
  >([]);
  const [activeScenarioId, setActiveScenarioId] = React.useState<string | null>(null);
  const [scenarioPresets, setScenarioPresets] = React.useState<
    readonly ScenarioPresetV2[]
  >([]);
  const [scenarioOperation, setScenarioOperation] = React.useState<
    WorkbenchScenarioOperationV3 | null
  >(null);
  const [scenarioError, setScenarioError] = React.useState<string | null>(null);
  const [analysisById, setAnalysisById] = React.useState<
  Readonly<Record<string, StudioSimulationAnalysisV2>>
  >({});
  const [analysisHistoryByKey, setAnalysisHistoryByKey] = React.useState<
  Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>
  >({});
  const [pendingAnalysisId, setPendingAnalysisId] = React.useState<string | null>(null);
  const [analysisErrorById, setAnalysisErrorById] = React.useState<
  Readonly<Record<string, string>>
  >({});
  const runtimeRef = React.useRef<WorkbenchParallelScenarioRuntimeV3 | null>(null);
  const translationRef = React.useRef(t);
  const analysisByIdRef = React.useRef<
    Readonly<Record<string, StudioSimulationAnalysisV2>>
  >({});
  const contentStoreRef = React.useRef<StudioBrowserContentStoreV3 | null>(null);
  const workspaceRef = React.useRef<ExperimentWorkspaceV2 | null>(null);
  const latestFrameRef = React.useRef<StudioSimulationFrameV2 | null>(null);
  const lastRootFrameTimeSecRef = React.useRef(Number.NEGATIVE_INFINITY);
  const activeScenarioIdRef = React.useRef<string | null>(null);
  const controlValuesByScenarioRef = React.useRef<
    Record<string, Readonly<Record<string, number>>>
  >({});
  const playingIntentRef = React.useRef(true);
  const exclusiveOperationRef = React.useRef<
    "control" | "analysis" | "scenario" | "save" | "snapshot" | null
  >(null);
  const surfaceRef = React.useRef<ExperimentSurfaceV2 | null>(null);
  const briefingPicksRef = React.useRef<
    readonly WorkbenchBriefingPanePickV3[] | null
  >(null);
  const surfaceMutationRevisionRef = React.useRef(0);
  const pendingSurfaceAfterRuntimeRestartRef = React.useRef<
    ExperimentSurfaceV2 | null
  >(null);
  const pendingFeedbackAfterRuntimeRestartRef = React.useRef<
    WorkbenchRuntimeRestartFeedbackV3 | null
  >(null);
  const contract = status.kind === "live" ? status.contract : null;

  React.useEffect(() => {
    translationRef.current = t;
  }, [t]);

  const replaceAnalysisByIdV3 = React.useCallback((
    next: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  ) => {
    analysisByIdRef.current = next;
    setAnalysisById(next);
  }, []);

  const commitAnalysisV3 = React.useCallback((
    analysis: StudioSimulationAnalysisV2,
  ) => {
    if (workbenchAnalysisMatchesFrameEpochV3(
      analysis,
      latestFrameRef.current,
    )) {
      replaceAnalysisByIdV3(Object.freeze({
        ...analysisByIdRef.current,
        [analysis.analysisId]: analysis,
      }));
    }
  }, [replaceAnalysisByIdV3]);

  const updateBriefingPicksV3 = React.useCallback((
    picks: readonly WorkbenchBriefingPanePickV3[],
  ) => {
    const next = Object.freeze(picks.map((pick) => Object.freeze({ ...pick })));
    briefingPicksRef.current = next;
    setBriefingPicks(next);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let runtime: WorkbenchParallelScenarioRuntimeV3 | undefined;

    const failRuntime = (error: unknown) => {
      if (cancelled) return;
      playingIntentRef.current = false;
      setIsPlaying(false);
      runtime?.terminate();
      runtime = undefined;
      runtimeRef.current = null;
      exclusiveOperationRef.current = null;
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    };

    const start = async () => {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (cancelled) return;
      const contentStore = new StudioBrowserContentStoreV3();
      contentStoreRef.current = contentStore;
      const storedWorkspace = contentStore.readWorkspace(experimentId);
      if (
        storedWorkspace !== null
        && storedWorkspace.content.modelId !== composition.defaultModelId
      ) {
        playingIntentRef.current = false;
        setIsPlaying(false);
        workspaceRef.current = storedWorkspace;
        setWorkspace(storedWorkspace);
        surfaceRef.current = null;
        setSurface(null);
        setSnapshotCount(contentStore.listSnapshots().filter((snapshot) =>
          snapshot.experimentId === experimentId
          && snapshot.content.modelId === storedWorkspace.content.modelId).length);
        setStatus({
          kind: "unavailable-model",
          savedModelId: storedWorkspace.content.modelId,
          currentModelId: composition.defaultModelId,
        });
        return;
      }
      const preferredScenarioId = activeScenarioIdRef.current;
      const initialScenarioId = preferredScenarioId !== null
        && storedWorkspace?.content.scenarios.some(({ scenarioId }) =>
          scenarioId === preferredScenarioId)
        ? preferredScenarioId
        : storedWorkspace?.content.scenarios[0]?.scenarioId
          ?? WORKBENCH_SCENARIO_ID_V3;
      const storedScenario = storedWorkspace?.content.scenarios.find(
        ({ scenarioId }) => scenarioId === initialScenarioId,
      );
      const pendingSurface = pendingSurfaceAfterRuntimeRestartRef.current;
      const pendingFeedback = pendingFeedbackAfterRuntimeRestartRef.current;
      const candidateSurface = pendingSurface
        ?? storedWorkspace?.content.surface
        ?? createDefaultExperimentSurfaceV3(
          composition.contract,
          initialScenarioId,
        );
      const nextSurface = candidateSurface;
      const storedSnapshots = contentStore.listSnapshots().filter((snapshot) =>
        snapshot.experimentId === experimentId
        && snapshot.content.modelId === composition.defaultModelId);
      surfaceRef.current = nextSurface;
      setSurface(nextSurface);
      workspaceRef.current = storedWorkspace;
      setWorkspace(storedWorkspace);
      setSnapshotCount(storedSnapshots.length);
      const nextBriefingPicks = resolveWorkbenchBriefingPicksAfterRestartV3(
        briefingPicksRef.current,
        nextSurface,
      );
      briefingPicksRef.current = nextBriefingPicks;
      setBriefingPicks(nextBriefingPicks);
      setSaveState(pendingFeedback?.saveState
        ?? (pendingSurface === null ? "clean" : "dirty"));
      setSaveError(pendingFeedback?.saveError ?? null);
      setSnapshotState(pendingFeedback?.snapshotState ?? "idle");
      setSnapshotError(pendingFeedback?.snapshotError ?? null);
      setScenarios([]);
      setActiveScenarioId(null);
      setScenarioPresets([]);
      setScenarioOperation(null);
      setScenarioError(null);
      controlValuesByScenarioRef.current = {};
      setControlValues(controlValuesForFixtureV3(
        composition.contract,
        storedScenario?.capture.fixture,
      ));
      setControlError(null);
      setPendingControlId(null);
      replaceAnalysisByIdV3({});
      setAnalysisHistoryByKey({});
      setPendingAnalysisId(null);
      setAnalysisErrorById({});
      exclusiveOperationRef.current = null;
      presentationSampleStore.reset();

      const runtimeSeeds: readonly WorkbenchParallelScenarioSeedV3[] =
        storedWorkspace === null
          ? [Object.freeze({
              scenarioId: initialScenarioId,
              label: translationRef.current(
                "workbench.editor.scenarioManager.baselinePresetTitle",
              ),
              fixture: composition.defaultFixture,
            })]
          : storedWorkspace.content.scenarios.map((scenario) => Object.freeze({
              scenarioId: scenario.scenarioId,
              label: scenario.label,
              fixture: scenario.capture.fixture,
              checkpoint: scenario.capture.checkpoint,
            }));
      runtime = new WorkbenchParallelScenarioRuntimeV3({
        expectedModelId: composition.defaultModelId,
        onFrames: (frames) => {
          if (cancelled) return;
          appendFramesV3(frames, presentationSampleStore);
          const activeId = activeScenarioIdRef.current;
          const frame = activeId === null
            ? undefined
            : [...frames].reverse().find(({ scenarioId }) =>
                scenarioId === activeId);
          if (frame === undefined) return;
          latestFrameRef.current = frame;
          if (shouldPublishWorkbenchRootFrameV3({
            acceptedTimeSec: frame.acceptedTimeSec,
            lastPublishedTimeSec: lastRootFrameTimeSecRef.current,
            schedulerRunning: runtime?.playing ?? false,
          })) {
            lastRootFrameTimeSecRef.current = frame.acceptedTimeSec;
            setStatus((current) => current.kind === "live"
              ? { ...current, frame }
              : current);
          }
        },
        onError: failRuntime,
      });
      const initialState = await runtime.initialize({
        scenarios: runtimeSeeds,
        activeScenarioId: initialScenarioId,
      });
      if (cancelled) {
        runtime.terminate();
        return;
      }
      const capturedScenarios = await runtime.captureScenarios();
      if (cancelled) {
        runtime.terminate();
        return;
      }
      const descriptors = Object.freeze(capturedScenarios.scenarios.map(
        ({ scenarioId, label }) => Object.freeze({ scenarioId, label }),
      ));
      const controlValuesByScenario = Object.fromEntries(
        capturedScenarios.scenarios.map((scenario) => [
          scenario.scenarioId,
          controlValuesForFixtureV3(
            composition.contract,
            scenario.capture.fixture,
          ),
        ]),
      );
      controlValuesByScenarioRef.current = controlValuesByScenario;
      activeScenarioIdRef.current = capturedScenarios.activeScenarioId;
      setScenarios(descriptors);
      setActiveScenarioId(capturedScenarios.activeScenarioId);
      setControlValues(controlValuesByScenario[capturedScenarios.activeScenarioId]
        ?? controlValuesForFixtureV3(composition.contract, undefined));
      const baseline = capturedScenarios.scenarios.find(({ scenarioId }) =>
        scenarioId === capturedScenarios.activeScenarioId);
      setScenarioPresets(baseline === undefined
        ? []
        : Object.freeze([Object.freeze({
            schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
            presetId: "preset/workbench-startup-baseline",
            modelId: composition.defaultModelId,
            title: translationRef.current(
              "workbench.editor.scenarioManager.baselinePresetTitle",
            ),
            description: translationRef.current(
              "workbench.editor.scenarioManager.baselinePresetDescription",
            ),
            capture: baseline.capture,
          })]));
      const initial = initialState.frame;
      const initialFrames = runtimeSeeds.map(({ scenarioId }) =>
        runtime!.latestFrame(scenarioId));
      latestFrameRef.current = initial;
      lastRootFrameTimeSecRef.current = initial.acceptedTimeSec;
      appendFramesV3(initialFrames, presentationSampleStore);
      // Publish the runtime authority only after every lane is active. Toolbar
      // and visibility handlers must never observe an initializing pool.
      runtimeRef.current = runtime;
      setStatus({
        kind: "live",
        contract: composition.contract,
        frame: initial,
      });
      const playbackIntent = playingIntentRef.current;
      setIsPlaying(playbackIntent);
      if (playbackIntent && !document.hidden) {
        runtime.playAll();
      }
      // Consume restart handoff only after every Scenario Worker and live
      // scheduler lane has been reconstructed successfully.
      pendingSurfaceAfterRuntimeRestartRef.current = null;
      pendingFeedbackAfterRuntimeRestartRef.current = null;
    };

    void start().catch(failRuntime);

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      void runtime?.dispose();
    };
  }, [
    experimentId,
    presentationSampleStore,
    replaceAnalysisByIdV3,
    runtimeGeneration,
  ]);

  React.useEffect(() => {
    const handleVisibility = () => {
      const runtime = runtimeRef.current;
      if (
        runtime === null
        || exclusiveOperationRef.current !== null
      ) return;
      if (document.hidden) {
        void runtime.pauseAll();
      } else if (playingIntentRef.current) {
        runtime.playAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const graphPanes = surface?.graphPanes ?? [];
  const outputPanes = surface?.outputPanes ?? [];
  const controlPanes = surface?.controlPanes ?? [];
  const markDraftDirtyV3 = React.useCallback(() => {
    setSaveState("dirty");
    setSaveError(null);
    setSnapshotState("idle");
    setSnapshotError(null);
  }, []);
  const updateSurface = React.useCallback((
    update: (current: ExperimentSurfaceV2) => ExperimentSurfaceV2,
  ) => {
    const current = surfaceRef.current;
    if (current === null) return;
    const next = update(current);
    if (next === current) return;
    surfaceRef.current = next;
    surfaceMutationRevisionRef.current += 1;
    setSurface(next);
    const durableOperation = exclusiveOperationRef.current;
    if (durableOperation !== "save" && durableOperation !== "snapshot") {
      markDraftDirtyV3();
    }
  }, [markDraftDirtyV3]);

  const openPaneSettings = React.useCallback((paneId: string) => {
    if (graphPanes.some((pane) => pane.paneId === paneId)) {
      setPaneSettings({ kind: "graph", paneId });
      return;
    }
    if (outputPanes.some((pane) => pane.paneId === paneId)) {
      setPaneSettings({ kind: "output", paneId });
      return;
    }
    if (controlPanes.some((pane) => pane.paneId === paneId)) {
      setPaneSettings({ kind: "control", paneId });
    }
  }, [controlPanes, graphPanes, outputPanes]);

  const addPaneToRoleArea = React.useCallback((
    kind: WorkbenchPaneSettingsV3["kind"],
  ) => {
    if (surface === null || contract === null) return;
    const result = addWorkbenchSurfacePaneV3(
      surface,
      kind,
      contract,
    );
    if (result.selectedPane === null || result.surface === surface) return;
    updateSurface(() => result.surface);
    setPaneSettings(result.selectedPane);
  }, [contract, surface, updateSurface]);

  const togglePlayback = React.useCallback(() => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    if (
      runtime === null
      || frame === null
      || exclusiveOperationRef.current !== null
    ) return;
    if (playingIntentRef.current) {
      playingIntentRef.current = false;
      setIsPlaying(false);
      void runtime.pauseAll().then(() => {
        const latest = latestFrameRef.current;
        if (latest === null) return;
        lastRootFrameTimeSecRef.current = latest.acceptedTimeSec;
        setStatus((current) => current.kind === "live"
          ? { ...current, frame: latest }
          : current);
      });
      return;
    }
    playingIntentRef.current = true;
    setIsPlaying(true);
    runtime.playAll();
  }, []);

  const restartRuntime = React.useCallback((playbackIntent = true) => {
    playingIntentRef.current = playbackIntent;
    setIsPlaying(playbackIntent);
    setStatus({ kind: "loading" });
    setRuntimeGeneration((generation) => generation + 1);
  }, []);

  const startLatestWorkbenchV3 = React.useCallback(() => {
    setRecoveryError(null);
    try {
      const contentStore = contentStoreRef.current
        ?? new StudioBrowserContentStoreV3();
      const nextWorkbenchId = allocateOpaqueWorkbenchIdV3(
        contentStore.listWorkspaces().map(({ experimentId: storedId }) => storedId),
      );
      navigate(workbenchDetailHref({
        locale: isLocale(locale) ? locale : undefined,
        workbenchId: nextWorkbenchId,
      }));
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : String(error));
    }
  }, [locale, navigate]);

  const applyControl = React.useCallback(async (
    controlId: string,
    value: number,
  ): Promise<boolean> => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    if (
      runtime === null
      || frame === null
      || exclusiveOperationRef.current !== null
    ) return false;
    exclusiveOperationRef.current = "control";
    setPendingControlId(controlId);
    setControlError(null);
    try {
      await runtime.pauseAll();
      const acceptedFrame = latestFrameRef.current;
      if (acceptedFrame === null) {
        throw new Error("The live Scenario no longer has an accepted frame");
      }
      const analysesToArchive = await requestExactStructuralHistoryAtBoundaryV3({
        analysisIds: workbenchStructuralHistoryAnalysisIdsV3(
          surfaceRef.current,
          contract,
        ),
        frame: acceptedFrame,
        runtime,
      });
      const nextFrame = await runtime.applyControl({
        scenarioId: acceptedFrame.scenarioId,
        controlId,
        value,
        expectedInputEpoch: acceptedFrame.inputEpoch,
      });
      latestFrameRef.current = nextFrame;
      lastRootFrameTimeSecRef.current = nextFrame.acceptedTimeSec;
      if (analysesToArchive.length > 0) {
        setAnalysisHistoryByKey((current) =>
          archiveWorkbenchAnalysesV3(current, analysesToArchive));
      }
      replaceAnalysisByIdV3({});
      setAnalysisErrorById({});
      appendFramesV3([nextFrame], presentationSampleStore);
      setStatus((current) => current.kind === "live"
        ? { ...current, frame: nextFrame }
        : current);
      const currentScenarioValues =
        controlValuesByScenarioRef.current[nextFrame.scenarioId] ?? {};
      const nextControlValues = Object.freeze({
        ...currentScenarioValues,
        [controlId]: value,
      });
      controlValuesByScenarioRef.current = {
        ...controlValuesByScenarioRef.current,
        [nextFrame.scenarioId]: nextControlValues,
      };
      setControlValues(nextControlValues);
      setSaveState("dirty");
      setSaveError(null);
      setSnapshotState("idle");
      setSnapshotError(null);
      if (playingIntentRef.current && !document.hidden) {
        runtime.playAll();
      }
      return true;
    } catch (error) {
      setControlError(error instanceof Error ? error.message : String(error));
      const latest = latestFrameRef.current;
      if (playingIntentRef.current && !document.hidden && latest !== null) {
        runtime.playAll();
      }
      return false;
    } finally {
      exclusiveOperationRef.current = null;
      setPendingControlId(null);
    }
  }, [contract, presentationSampleStore, replaceAnalysisByIdV3]);

  const requestAnalysis = React.useCallback((analysisId: string): boolean => {
    const runtime = runtimeRef.current;
    if (
      runtime === null
      || latestFrameRef.current === null
      || exclusiveOperationRef.current !== null
    ) return false;
    exclusiveOperationRef.current = "analysis";
    setPendingAnalysisId(analysisId);
    setAnalysisErrorById((current) => withoutRecordKeyV3(current, analysisId));
    void (async () => {
      try {
        await runtime.pauseAll();
        const acceptedFrame = latestFrameRef.current;
        if (acceptedFrame === null) {
          throw new Error("The live Scenario no longer has an accepted frame");
        }
        const analysis = await runtime.requestAnalysis({
          scenarioId: acceptedFrame.scenarioId,
          analysisId,
          expectedInputEpoch: acceptedFrame.inputEpoch,
          expectedAcceptedRevision: acceptedFrame.acceptedRevision,
          expectedAcceptedTimeSec: acceptedFrame.acceptedTimeSec,
        });
        commitAnalysisV3(analysis);
        if (playingIntentRef.current && !document.hidden) {
          runtime.playAll();
        }
      } catch (error) {
        setAnalysisErrorById((current) => Object.freeze({
          ...current,
          [analysisId]: error instanceof Error ? error.message : String(error),
        }));
        const latest = latestFrameRef.current;
        if (playingIntentRef.current && !document.hidden && latest !== null) {
          runtime.playAll();
        }
      } finally {
        exclusiveOperationRef.current = null;
        setPendingAnalysisId(null);
      }
    })();
    return true;
  }, [commitAnalysisV3]);

  const adoptScenarioStateV3 = React.useCallback((
    next: StudioSimulationWorkerScenarioStateV2,
  ) => {
    activeScenarioIdRef.current = next.activeScenarioId;
    setActiveScenarioId(next.activeScenarioId);
    setScenarios(next.scenarios);
    latestFrameRef.current = next.frame;
    lastRootFrameTimeSecRef.current = next.frame.acceptedTimeSec;
    appendFramesV3([next.frame], presentationSampleStore);
    replaceAnalysisByIdV3({});
    setAnalysisErrorById({});
    setControlError(null);
    setControlValues(
      controlValuesByScenarioRef.current[next.activeScenarioId]
        ?? (contract === null
          ? {}
          : controlValuesForFixtureV3(contract, undefined)),
    );
    setStatus((current) => current.kind === "live"
      ? { ...current, frame: next.frame }
      : current);
  }, [contract, presentationSampleStore, replaceAnalysisByIdV3]);

  const runScenarioOperationV3 = React.useCallback(async (
    kind: WorkbenchScenarioOperationV3,
    operation: (
      runtime: WorkbenchParallelScenarioRuntimeV3,
    ) => Promise<StudioSimulationWorkerScenarioStateV2>
      | StudioSimulationWorkerScenarioStateV2,
    beforeAdopt?: (state: StudioSimulationWorkerScenarioStateV2) => void,
  ): Promise<boolean> => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    if (
      runtime === null
      || frame === null
      || exclusiveOperationRef.current !== null
    ) return false;
    exclusiveOperationRef.current = "scenario";
    setScenarioOperation(kind);
    setScenarioError(null);
    try {
      await runtime.pauseAll();
      const next = await operation(runtime);
      beforeAdopt?.(next);
      adoptScenarioStateV3(next);
      return true;
    } catch (error) {
      setScenarioError(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      exclusiveOperationRef.current = null;
      setScenarioOperation(null);
      const latest = latestFrameRef.current;
      if (playingIntentRef.current && !document.hidden && latest !== null) {
        runtime.playAll();
      }
    }
  }, [adoptScenarioStateV3]);

  const selectScenarioV3 = React.useCallback((scenarioId: string) => {
    if (scenarioId === activeScenarioIdRef.current) return;
    void runScenarioOperationV3(
      "select",
      (runtime) => runtime.selectScenario(scenarioId),
    );
  }, [runScenarioOperationV3]);

  const addScenarioFromPresetV3 = React.useCallback((
    intent: WorkbenchScenarioAddIntentV3,
  ) => {
    void runScenarioOperationV3(
      "add",
      (runtime) => runtime.addScenario({
        scenarioId: intent.scenarioId,
        label: intent.label,
        fixture: intent.preset.capture.fixture,
        checkpoint: intent.preset.capture.checkpoint,
      }),
      () => {
        if (contract !== null) {
          controlValuesByScenarioRef.current = {
            ...controlValuesByScenarioRef.current,
            [intent.scenarioId]: controlValuesForFixtureV3(
              contract,
              intent.preset.capture.fixture,
            ),
          };
        }
        markDraftDirtyV3();
      },
    );
  }, [contract, markDraftDirtyV3, runScenarioOperationV3]);

  const duplicateScenarioV3 = React.useCallback((
    intent: WorkbenchScenarioDuplicateIntentV3,
  ) => {
    const sourceValues = controlValuesByScenarioRef.current[
      intent.sourceScenarioId
    ];
    void runScenarioOperationV3(
      "duplicate",
      (runtime) => runtime.duplicateScenario({
        sourceScenarioId: intent.sourceScenarioId,
        scenarioId: intent.scenarioId,
        label: intent.label,
      }),
      () => {
        if (sourceValues !== undefined) {
          controlValuesByScenarioRef.current = {
            ...controlValuesByScenarioRef.current,
            [intent.scenarioId]: sourceValues,
          };
        }
        presentationSampleStore.cloneScenario(
          intent.sourceScenarioId,
          intent.scenarioId,
        );
        markDraftDirtyV3();
      },
    );
  }, [markDraftDirtyV3, presentationSampleStore, runScenarioOperationV3]);

  const renameScenarioV3 = React.useCallback((
    intent: WorkbenchScenarioRenameIntentV3,
  ) => {
    void runScenarioOperationV3(
      "rename",
      (runtime) => runtime.renameScenario({
        scenarioId: intent.scenarioId,
        label: intent.label,
      }),
      () => {
        markDraftDirtyV3();
      },
    );
  }, [markDraftDirtyV3, runScenarioOperationV3]);

  const deleteScenarioV3 = React.useCallback((
    intent: WorkbenchScenarioDeleteIntentV3,
  ) => {
    void runScenarioOperationV3(
      "delete",
      (runtime) => runtime.deleteScenario(intent.scenarioId),
      () => {
        const { [intent.scenarioId]: _deleted, ...retained } =
          controlValuesByScenarioRef.current;
        controlValuesByScenarioRef.current = retained;
        presentationSampleStore.removeScenario(intent.scenarioId);
        setAnalysisHistoryByKey((current) =>
          withoutWorkbenchScenarioAnalysisHistoryV3(
            current,
            intent.scenarioId,
          ));
        markDraftDirtyV3();
      },
    );
  }, [markDraftDirtyV3, presentationSampleStore, runScenarioOperationV3]);

  const saveDraftV3 = React.useCallback(async () => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    const contentStore = contentStoreRef.current;
    if (
      runtime === null
      || frame === null
      || surface === null
      || contentStore === null
      || exclusiveOperationRef.current !== null
    ) return;
    const submittedSurface = surfaceRef.current;
    if (submittedSurface === null) return;
    const submittedSurfaceMutationRevision =
      surfaceMutationRevisionRef.current;
    exclusiveOperationRef.current = "save";
    setSaveState("saving");
    setSaveError(null);
    try {
      await runtime.pauseAll();
      const captures = await runtime.captureScenarios();
      const currentWorkspace = workspaceRef.current;
      const snapshots = currentWorkspace === null
        ? Object.freeze([])
        : contentStore.snapshotLineageForExperiment(experimentId);
      const coordinator = new WorkbenchParallelAuthoringCoordinatorV3();
      const saved = await coordinator.saveDraft({
        modelId: frame.modelId,
        scenarios: captures.scenarios,
        activeScenarioId: captures.activeScenarioId,
        workspace: currentWorkspace,
        snapshots,
        experimentId,
        surface: submittedSurface,
        runtimeSessionId: `workbench-authoring-${randomPortableTokenV3()}`,
      });
      // The authoring Worker is transient and already terminated. Persistence
      // failure therefore leaves the independent live lane pool untouched so
      // the user can retry without losing unsaved exact Scenario state.
      commitWorkbenchTransientAuthoringResultV3({
        persist: () => contentStore.saveWorkspace(saved),
        adoptDurable: (durableWorkspace) => {
          const surfaceResolution = resolveWorkbenchSurfaceAfterCommitV3({
            currentMutationRevision: surfaceMutationRevisionRef.current,
            currentSurface: surfaceRef.current,
            durableSurface: durableWorkspace.content.surface,
            submittedMutationRevision: submittedSurfaceMutationRevision,
          });
          workspaceRef.current = durableWorkspace;
          setWorkspace(durableWorkspace);
          surfaceRef.current = surfaceResolution.surface;
          setSurface(surfaceResolution.surface);
          setScenarios(Object.freeze(durableWorkspace.content.scenarios.map(
            ({ scenarioId, label }) => Object.freeze({ scenarioId, label }),
          )));
          if (contract !== null) {
            controlValuesByScenarioRef.current = Object.fromEntries(
              durableWorkspace.content.scenarios.map((scenario) => [
                scenario.scenarioId,
                controlValuesForFixtureV3(contract, scenario.capture.fixture),
              ]),
            );
            const activeId = activeScenarioIdRef.current;
            if (activeId !== null) {
              setControlValues(controlValuesByScenarioRef.current[activeId]
                ?? controlValuesForFixtureV3(contract, undefined));
            }
          }
          setSaveState(surfaceResolution.hasNewerMutations ? "dirty" : "clean");
          setSnapshotState("idle");
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // A quota/write failure leaves the live pool untouched. If another tab
      // advanced this Experiment, adopt only its durable version/lineage as
      // the next optimistic-concurrency base; the exact live captures and
      // current Surface remain the user's retry payload.
      const latestDurableWorkspace = readNewerDurableWorkbenchWorkspaceV3({
        reader: contentStore,
        experimentId,
        current: workspaceRef.current,
      });
      const durableBaseAdvanced = latestDurableWorkspace !== null;
      if (durableBaseAdvanced) {
        workspaceRef.current = latestDurableWorkspace;
        setWorkspace(latestDurableWorkspace);
      }
      const hasNewerSurfaceMutations =
        hasWorkbenchSurfaceMutationsAfterSubmissionV3(
          submittedSurfaceMutationRevision,
          surfaceMutationRevisionRef.current,
        );
      setSaveError(message);
      setSaveState(
        hasNewerSurfaceMutations || durableBaseAdvanced ? "dirty" : "error",
      );
    } finally {
      exclusiveOperationRef.current = null;
      const latest = latestFrameRef.current;
      if (
        playingIntentRef.current
        && !document.hidden
        && latest !== null
      ) {
        runtime.playAll();
      }
    }
  }, [contract, experimentId, surface]);

  const createSnapshotV3 = React.useCallback(async () => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    const contentStore = contentStoreRef.current;
    const durableWorkspace = workspaceRef.current;
    if (
      runtime === null
      || frame === null
      || durableWorkspace === null
      || contentStore === null
      || saveState !== "clean"
      || exclusiveOperationRef.current !== null
    ) return;
    const submittedSurfaceMutationRevision =
      surfaceMutationRevisionRef.current;
    exclusiveOperationRef.current = "snapshot";
    setSnapshotState("creating");
    setSnapshotError(null);
    let restartRuntimeAfterCommit = false;
    let runtimeRestartRequested = false;
    let snapshotHasNewerSurfaceMutations = false;
    try {
      await runtime.pauseAll();
      const snapshots = contentStore.snapshotLineageForExperiment(experimentId);
      const coordinator = new WorkbenchParallelAuthoringCoordinatorV3();
      const created = await coordinator.createSnapshot({
        modelId: frame.modelId,
        scenarios: durableWorkspace.content.scenarios,
        activeScenarioId: activeScenarioIdRef.current ?? frame.scenarioId,
        surface: durableWorkspace.content.surface,
        workspace: durableWorkspace,
        snapshots,
        experimentId,
        runtimeSessionId: `workbench-qualification-${randomPortableTokenV3()}`,
      });
      const persisted = contentStore.saveSnapshotAndWorkspace(created);
      restartRuntimeAfterCommit = true;
      const durable = Object.freeze({
        ...persisted,
        snapshotCount: contentStore.listSnapshots().filter((snapshot) =>
          snapshot.experimentId === experimentId).length,
      });
      const surfaceResolution = resolveWorkbenchSurfaceAfterCommitV3({
        currentMutationRevision: surfaceMutationRevisionRef.current,
        currentSurface: surfaceRef.current,
        durableSurface: durable.workspace.content.surface,
        submittedMutationRevision: submittedSurfaceMutationRevision,
      });
      workspaceRef.current = durable.workspace;
      setWorkspace(durable.workspace);
      surfaceRef.current = surfaceResolution.surface;
      setSurface(surfaceResolution.surface);
      setSaveState(surfaceResolution.hasNewerMutations ? "dirty" : "clean");
      snapshotHasNewerSurfaceMutations = surfaceResolution.hasNewerMutations;
      pendingSurfaceAfterRuntimeRestartRef.current =
        surfaceResolution.hasNewerMutations ? surfaceResolution.surface : null;
      setSnapshotCount(durable.snapshotCount);
      setSnapshotState("created");
      // Snapshot/Workspace persistence is already committed. This
      // session-only transport is deliberately best effort: a blocked or full
      // sessionStorage must never turn a durable Snapshot into a false failure.
      if (briefingHandoff !== null) {
        persistWorkbenchBriefingHandoffV3({
          handoff: briefingHandoff,
          snapshotId: durable.snapshot.snapshotId,
          picks: briefingPicksRef.current ?? [],
          snapshotSurface: durable.snapshot.content.surface,
        });
      }
      pendingFeedbackAfterRuntimeRestartRef.current = Object.freeze({
        saveState: snapshotHasNewerSurfaceMutations ? "dirty" : "clean",
        saveError: null,
        snapshotState: "created",
        snapshotError: null,
      });
      runtimeRestartRequested = true;
      restartRuntime(playingIntentRef.current);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const hasNewerSurfaceMutations =
        hasWorkbenchSurfaceMutationsAfterSubmissionV3(
          submittedSurfaceMutationRevision,
          surfaceMutationRevisionRef.current,
        );
      let durableBaseAdvanced = false;
      if (!restartRuntimeAfterCommit) {
        const latestDurableWorkspace = readNewerDurableWorkbenchWorkspaceV3({
          reader: contentStore,
          experimentId,
          current: workspaceRef.current,
        });
        if (latestDurableWorkspace !== null) {
          workspaceRef.current = latestDurableWorkspace;
          setWorkspace(latestDurableWorkspace);
          durableBaseAdvanced = true;
        }
      }
      if (restartRuntimeAfterCommit) {
        if (hasNewerSurfaceMutations && surfaceRef.current !== null) {
          pendingSurfaceAfterRuntimeRestartRef.current = surfaceRef.current;
        }
        pendingFeedbackAfterRuntimeRestartRef.current = Object.freeze({
          saveState: hasNewerSurfaceMutations ? "dirty" : "clean",
          saveError: null,
          snapshotState: "error",
          snapshotError: message,
        });
        if (!runtimeRestartRequested) {
          runtimeRestartRequested = true;
          restartRuntime(playingIntentRef.current);
        }
      }
      setSnapshotError(message);
      setSnapshotState("error");
      if (hasNewerSurfaceMutations || durableBaseAdvanced) {
        setSaveState("dirty");
      }
    } finally {
      exclusiveOperationRef.current = null;
      const latest = latestFrameRef.current;
      if (
        !restartRuntimeAfterCommit
        && playingIntentRef.current
        && !document.hidden
        && latest !== null
      ) {
        runtime.playAll();
      }
    }
  }, [briefingHandoff, experimentId, restartRuntime, saveState]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveDraftV3();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDraftV3]);

  const latestFrame = status.kind === "live" ? status.frame : null;
  const rootRuntimeData = status.kind === "live"
    ? {
      "data-accepted-revision": status.frame.acceptedRevision,
      "data-input-epoch": status.frame.inputEpoch,
      "data-model-id": status.frame.modelId,
      "data-model-time-sec": status.frame.acceptedTimeSec,
    }
    : {};
  const runtimeOperationPending = pendingControlId !== null
    || pendingAnalysisId !== null
    || scenarioOperation !== null
    || saveState === "saving"
    || snapshotState === "creating";
  const briefingOptions = surface === null
    ? []
    : allSurfacePanesV3(surface).map((pane) => Object.freeze({
      paneId: pane.paneId,
      role: pane.role,
      label: pane.label,
      defaultPriority: pane.priority,
      order: pane.order,
    }));

  return (
    <div
      className="workbench-root flex h-full min-h-0 w-full flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="v3-dockview-workbench"
      data-playback={isPlaying ? "playing" : "paused"}
      {...rootRuntimeData}
    >
      <header className="flex min-h-12 shrink-0 items-center gap-2 bg-wb-panel px-2.5 py-1.5 shadow-[inset_0_-1px_0_var(--wb-line)] sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link
            to={homeHref(locale === "ja" || locale === "en" ? locale : undefined)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={t("workbench.editor.home")}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="hidden truncate text-xs font-semibold text-wb-text sm:block">
            {t("workbench.editor.experimentTitle")}
          </h1>
          {contract !== null && (
            <WorkbenchModelMenuV3
              currentModelId={contract.modelId}
              models={[{ contract, shortLabel: "MW V3" }]}
              onOpenDisclosure={() => setLimitationsOpen(true)}
              strings={{
                chooseModel: t("workbench.editor.modelChoose"),
                close: t("workbench.editor.close"),
                copyModelId: t("workbench.editor.modelCopyId"),
                copied: t("workbench.editor.modelCopied"),
                details: t("workbench.editor.modelDetails"),
                exactModelId: t("workbench.editor.modelExactId"),
                fixtureSchema: t("workbench.editor.fixtureSchema"),
                checkpointCodec: t("workbench.editor.checkpointCodec"),
                snapshotGate: t("workbench.editor.snapshotGate"),
                validationAndLimitations: t("workbench.editor.validationAndLimitations"),
              }}
            />
          )}
        </div>
        <RuntimeStatusV3 status={status} />
        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            to={articlesHref(isLocale(locale) ? locale : undefined)}
            className="hidden min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:inline-flex"
          >
            <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
            {t("workbench.editor.articles")}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40"
            disabled={surface === null}
            onClick={() => setNoteOpen(true)}
            aria-label={t("workbench.editor.note")}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40"
            disabled={surface === null}
            onClick={() => setBriefingOpen(true)}
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">{t("workbench.editor.briefing")}</span>
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-wait disabled:opacity-40"
            disabled={status.kind !== "live" || runtimeOperationPending}
            onClick={() => void saveDraftV3()}
            title={saveError ?? undefined}
            data-testid="v3-save-draft"
          >
            {saveState === "clean"
              ? <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
            <span className="hidden sm:inline">
              {saveState === "saving"
                ? t("workbench.editor.saving")
                : saveState === "clean"
                  ? t("workbench.editor.saved")
                  : t("workbench.editor.save")}
            </span>
          </button>
          {status.kind === "live" && (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wb-primary text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent disabled:cursor-wait disabled:opacity-50"
              disabled={runtimeOperationPending}
              aria-label={isPlaying
                ? t("workbench.live.pause")
                : t("workbench.live.play")}
              aria-pressed={!isPlaying}
              onClick={togglePlayback}
              data-testid="v3-playback-toggle"
            >
              {isPlaying
                ? <Pause className="h-3.5 w-3.5" />
                : <Play className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </header>

      {status.kind === "unavailable-model" ? (
        <section
          className="m-4 max-w-3xl self-center rounded-xl border border-wb-warning/50 bg-wb-warning-soft p-6 text-sm"
          role="alert"
          data-testid="workbench-unavailable-model-v3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-wb-warning" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-bold text-wb-text">
                {t("workbench.unavailable.title")}
              </h2>
              <p className="mt-2 leading-6 text-wb-muted">
                {t("workbench.unavailable.description")}
              </p>
              <dl className="mt-4 grid gap-2 rounded-lg border border-wb-line bg-wb-panel p-3 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
                <dt className="font-bold text-wb-subtle">
                  {t("workbench.unavailable.savedModel")}
                </dt>
                <dd className="truncate font-mono text-wb-text" title={status.savedModelId}>
                  {status.savedModelId}
                </dd>
                <dt className="font-bold text-wb-subtle">
                  {t("workbench.unavailable.currentModel")}
                </dt>
                <dd className="truncate font-mono text-wb-text" title={status.currentModelId}>
                  {status.currentModelId}
                </dd>
              </dl>
              {recoveryError !== null && (
                <p className="mt-3 text-xs text-wb-danger" role="alert">
                  {recoveryError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={workbenchHref(isLocale(locale) ? locale : undefined)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-wb-line bg-wb-panel px-3 text-xs font-bold text-wb-text hover:bg-wb-hover"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("workbench.unavailable.back")}
                </Link>
                <button
                  type="button"
                  onClick={startLatestWorkbenchV3}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wb-accent px-3 text-xs font-bold text-white hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("workbench.unavailable.startLatest")}
                </button>
              </div>
              <p className="mt-4 text-xs leading-5 text-wb-subtle">
                {t("workbench.unavailable.preserved")}
              </p>
            </div>
          </div>
        </section>
      ) : status.kind === "error" ? (
        <section
          className="m-4 rounded-lg border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger"
          role="alert"
        >
          <p className="font-bold">{t("workbench.live.errorTitle")}</p>
          <p className="mt-2 font-mono text-xs">{status.message}</p>
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded border border-wb-danger/50 bg-wb-panel px-3 text-xs font-bold text-wb-text hover:bg-wb-hover"
            onClick={() => restartRuntime()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("workbench.live.restart")}
          </button>
        </section>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(420px,55vh)_260px_320px] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)_220px] lg:overflow-hidden">
          <WorkbenchDockview
            ariaLabel={t("workbench.live.graphArea")}
            className="workbench-dockview-main border-b border-wb-line lg:col-start-1 lg:row-start-1 lg:border-r"
            panes={graphPanes.map((pane) => ({
              paneId: pane.paneId,
              role: pane.role,
              title: pane.label,
            }))}
            role="graph"
            onOpenPaneSettings={openPaneSettings}
            onAddPane={() => addPaneToRoleArea("graph")}
            addPaneLabel={t("workbench.editor.addPane")}
            emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
            paneSettingsLabel={t("workbench.live.paneSettings")}
            renderPane={(pane) => {
              const graphPane = graphPanes.find(({ paneId }) => paneId === pane.paneId);
              return graphPane === undefined || contract === null
                ? <PaneLoadingV3 />
                : (
                  <GraphPaneBodyV3
                    activeScenarioId={activeScenarioId}
                    playbackRunning={isPlaying}
                    analysisById={analysisById}
                    analysisHistoryByKey={analysisHistoryByKey}
                    analysisErrorById={analysisErrorById}
                    contract={contract}
                    frame={latestFrame}
                    onRequestAnalysis={requestAnalysis}
                    operationPending={runtimeOperationPending}
                    pane={graphPane}
                    pendingAnalysisId={pendingAnalysisId}
                    sampleStore={presentationSampleStore}
                    scenarios={scenarios}
                  />
                );
            }}
          />
          <WorkbenchDockview
            ariaLabel={t("workbench.live.outputArea")}
            className="border-b border-wb-line lg:col-start-1 lg:row-start-2 lg:border-b-0 lg:border-r"
            panes={outputPanes.map((pane) => ({
              paneId: pane.paneId,
              role: pane.role,
              title: pane.label,
            }))}
            role="output"
            onOpenPaneSettings={openPaneSettings}
            onAddPane={() => addPaneToRoleArea("output")}
            addPaneLabel={t("workbench.editor.addPane")}
            emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
            paneSettingsLabel={t("workbench.live.paneSettings")}
            renderPane={(paneDefinition) => {
              const pane = outputPanes.find(({ paneId }) =>
                paneId === paneDefinition.paneId);
              return pane === undefined || contract === null
                ? <PaneLoadingV3 />
                : (
                <OutputPaneBodyV3
                  contract={contract}
                  frame={latestFrame}
                  pane={pane}
                  scenarioLabel={scenarios.find(({ scenarioId }) =>
                    scenarioId === activeScenarioId)?.label ?? "—"}
                />
                );
            }}
          />
          <WorkbenchDockview
            ariaLabel={t("workbench.live.controlArea")}
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
            panes={controlPanes.map((pane) => ({
              paneId: pane.paneId,
              role: pane.role,
              title: pane.label,
            }))}
            role="control"
            onOpenPaneSettings={openPaneSettings}
            onAddPane={() => addPaneToRoleArea("control")}
            addPaneLabel={t("workbench.editor.addPane")}
            emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
            paneSettingsLabel={t("workbench.live.paneSettings")}
            renderPane={(paneDefinition) => {
              const pane = controlPanes.find(({ paneId }) =>
                paneId === paneDefinition.paneId);
              return pane === undefined || contract === null
                ? <PaneLoadingV3 />
                : (
                  <WorkbenchScenarioManagerV3
                    variant="embedded"
                    modelId={contract.modelId}
                    scenarios={scenarios}
                    activeScenarioId={activeScenarioId}
                    presets={scenarioPresets}
                    actionDisabledReasons={scenarioOperation === null
                      ? undefined
                      : {
                          add: t("workbench.editor.scenarioManager.busy"),
                          delete: t("workbench.editor.scenarioManager.busy"),
                          duplicate: t("workbench.editor.scenarioManager.busy"),
                          rename: t("workbench.editor.scenarioManager.busy"),
                        }}
                    renderControllerSlot={() => (
                      <>
                        {scenarioError !== null && (
                          <p
                            className="mb-2 rounded-lg bg-wb-danger-soft p-2 text-[10px] text-wb-danger"
                            role="alert"
                          >
                            {scenarioError}
                          </p>
                        )}
                        <ControlPaneBodyV3
                          contract={contract}
                          controlError={controlError}
                          controlValues={controlValues}
                          disabledByAnalysis={
                            pendingAnalysisId !== null
                            || scenarioOperation !== null
                          }
                          onApplyControl={applyControl}
                          pane={pane}
                          pendingControlId={pendingControlId}
                        />
                      </>
                    )}
                    onSelectScenario={selectScenarioV3}
                    onAddFromPreset={addScenarioFromPresetV3}
                    onDuplicateScenario={duplicateScenarioV3}
                    onRenameScenario={renameScenarioV3}
                    onDeleteScenario={deleteScenarioV3}
                    strings={{
                      activeScenario: t("workbench.editor.scenarioManager.activeScenario"),
                      add: t("workbench.editor.scenarioManager.add"),
                      addFromPreset: t("workbench.editor.scenarioManager.addFromPreset"),
                      close: t("workbench.editor.scenarioManager.close"),
                      controllerSlot: t("workbench.editor.scenarioManager.controllerSlot"),
                      copySuffix: t("workbench.editor.scenarioManager.copySuffix"),
                      delete: t("workbench.editor.scenarioManager.delete"),
                      deleteLastScenario: t("workbench.editor.scenarioManager.deleteLastScenario"),
                      duplicate: t("workbench.editor.scenarioManager.duplicate"),
                      emptyScenarios: t("workbench.editor.scenarioManager.emptyScenarios"),
                      incompatiblePreset: t("workbench.editor.scenarioManager.incompatiblePreset"),
                      noControllerSelection: t("workbench.editor.scenarioManager.noControllerSelection"),
                      noPresets: t("workbench.editor.scenarioManager.noPresets"),
                      preset: t("workbench.editor.scenarioManager.preset"),
                      rename: t("workbench.editor.scenarioManager.rename"),
                      scenarioLimitReached: t("workbench.editor.scenarioManager.scenarioLimitReached"),
                      scenarioName: t("workbench.editor.scenarioManager.scenarioName"),
                      scenarios: t("workbench.editor.scenarioManager.scenarios"),
                      title: t("workbench.editor.scenarioManager.title"),
                    }}
                  />
                );
            }}
          />
        </div>
      )}

      {contract !== null && (
        surface !== null && paneSettings !== null && (
          <WorkbenchPaneEditorV3
            open
            selectedPane={paneSettings}
            contract={contract}
            surface={surface}
            onClose={() => setPaneSettings(null)}
            onSelectedPaneChange={setPaneSettings}
            onChange={(nextSurface) => {
              updateSurface(() => nextSurface);
              updateBriefingPicksV3(reconcileWorkbenchBriefingPicksV3(
                briefingPicksRef.current ?? [],
                nextSurface,
              ));
            }}
            strings={{
              close: t("workbench.editor.close"),
              color: t("workbench.editor.seriesColor"),
              controlCatalog: t("workbench.live.registeredControls"),
              deletePane: t("workbench.editor.deletePane"),
              emptyCatalog: t("workbench.editor.emptyCatalog"),
              graphCatalog: t("workbench.live.registeredGraphs"),
              historyDepth: t("workbench.editor.historyDepth"),
              historyDepthHint: t("workbench.editor.historyDepthHint"),
              label: t("workbench.editor.paneLabel"),
              noConfigurableSeries: t("workbench.editor.noConfigurableSeries"),
              outputCatalog: t("workbench.live.registeredOutputs"),
              paneKinds: {
                graph: t("workbench.editor.paneKinds.graph"),
                output: t("workbench.editor.paneKinds.output"),
                control: t("workbench.editor.paneKinds.control"),
              },
              seriesCatalog: t("workbench.editor.series"),
              title: t("workbench.live.paneSettings"),
              windowSec: t("workbench.editor.windowSec"),
              windowSecHint: t("workbench.editor.windowSecHint"),
            }}
          />
        )
      )}
      {contract !== null && (
        <ModelLimitations
          acknowledgementScope={`${contract.modelId}:disclosure-v1`}
          limitations={[
            ...(t("modelLimitations.items", { returnObjects: true }) as string[]),
            t("workbench.live.snapshotGateDescription"),
          ]}
          open={limitationsOpen}
          onOpenChange={setLimitationsOpen}
          showTrigger={false}
        />
      )}
      <WorkbenchNoteEditorV3
        open={noteOpen}
        value={surface?.note.text ?? ""}
        onClose={() => setNoteOpen(false)}
        onChange={(text) => updateSurface((current) => ({
          ...current,
          note: { text },
        }))}
        strings={{
          close: t("workbench.editor.close"),
          placeholder: t("workbench.editor.notePlaceholder"),
          title: t("workbench.editor.note"),
        }}
      />
      <WorkbenchBriefingComposerV3
        open={briefingOpen}
        options={briefingOptions}
        picks={briefingPicks}
        onChange={updateBriefingPicksV3}
        onClose={() => setBriefingOpen(false)}
        renderPreview={(paneId) => surface === null
          ? null
          : <BriefingPreviewPaneV3 paneId={paneId} surface={surface} />}
        snapshotAction={{
          disabled: workspace === null
            || saveState !== "clean"
            || snapshotState === "creating",
          label: snapshotState === "creating"
            ? t("workbench.editor.creatingSnapshot")
            : t("workbench.editor.createSnapshot"),
          pending: snapshotState === "creating",
          onCreate: () => void createSnapshotV3(),
        }}
        strings={{
          close: t("workbench.editor.close"),
          description: t("workbench.editor.briefingDescription"),
          empty: t("workbench.editor.briefingEmpty"),
          lowerPriority: t("workbench.editor.lowerPriority"),
          paneKinds: {
            graph: t("workbench.editor.paneKinds.graph"),
            output: t("workbench.editor.paneKinds.output"),
            control: t("workbench.editor.paneKinds.control"),
          },
          preview: t("workbench.editor.briefingPreview"),
          raisePriority: t("workbench.editor.raisePriority"),
          snapshotNotice: snapshotError
            ?? (snapshotState === "created"
              ? t("workbench.editor.snapshotCreated", { count: snapshotCount })
              : t("workbench.editor.briefingSnapshotNotice")),
          title: t("workbench.editor.briefingTitle"),
        }}
      />
    </div>
  );
};

function RuntimeStatusV3({ status }: Readonly<{ status: WorkbenchStatusV3 }>) {
  const { t } = useTranslation();
  if (status.kind === "loading") {
    return (
      <div className="text-xs text-wb-muted" role="status">
        {t("workbench.live.loading")}
      </div>
    );
  }
  if (status.kind === "error" || status.kind === "unavailable-model") return null;
  return (
    <div
      className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] text-wb-muted md:flex"
      data-testid="v3-runtime-status"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <span>{status.frame.acceptedTimeSec.toFixed(2)} s</span>
      <span className="sr-only">{t("workbench.live.modelTime")}</span>
    </div>
  );
}

export function reconcileWorkbenchBriefingPicksV3(
  picks: readonly WorkbenchBriefingPanePickV3[],
  surface: ExperimentSurfaceV2,
): readonly WorkbenchBriefingPanePickV3[] {
  const paneIds = new Set(allSurfacePanesV3(surface).map(({ paneId }) => paneId));
  return Object.freeze(picks.filter(({ paneId }) => paneIds.has(paneId)));
}

/**
 * Worker reconstruction must not turn an authored empty/partial briefing back
 * into "all panes". Only the first mount receives the complete default.
 */
export function resolveWorkbenchBriefingPicksAfterRestartV3(
  currentPicks: readonly WorkbenchBriefingPanePickV3[] | null,
  surface: ExperimentSurfaceV2,
): readonly WorkbenchBriefingPanePickV3[] {
  if (currentPicks !== null) {
    return reconcileWorkbenchBriefingPicksV3(currentPicks, surface);
  }
  return Object.freeze(allSurfacePanesV3(surface).map((pane) => Object.freeze({
    paneId: pane.paneId,
    priority: pane.priority,
  })));
}

export function persistWorkbenchBriefingHandoffV3(input: Readonly<{
  handoff: StudioSnapshotBriefingHandoffV3;
  snapshotId: string;
  picks: readonly WorkbenchBriefingPanePickV3[];
  snapshotSurface: ExperimentSurfaceV2;
}>): boolean {
  try {
    input.handoff.write(input.snapshotId, Object.freeze({
      panePicks: reconcileWorkbenchBriefingPicksV3(
        input.picks,
        input.snapshotSurface,
      ),
    }));
    return true;
  } catch {
    return false;
  }
}

export function hasWorkbenchSurfaceMutationsAfterSubmissionV3(
  submittedMutationRevision: number,
  currentMutationRevision: number,
): boolean {
  if (
    !Number.isSafeInteger(submittedMutationRevision)
    || submittedMutationRevision < 0
    || !Number.isSafeInteger(currentMutationRevision)
    || currentMutationRevision < submittedMutationRevision
  ) {
    throw new Error("Workbench Surface mutation revision is invalid");
  }
  return currentMutationRevision > submittedMutationRevision;
}

export function resolveWorkbenchSurfaceAfterCommitV3(input: Readonly<{
  submittedMutationRevision: number;
  currentMutationRevision: number;
  currentSurface: ExperimentSurfaceV2 | null;
  durableSurface: ExperimentSurfaceV2;
}>): Readonly<{
  surface: ExperimentSurfaceV2;
  hasNewerMutations: boolean;
}> {
  const hasNewerMutations = hasWorkbenchSurfaceMutationsAfterSubmissionV3(
    input.submittedMutationRevision,
    input.currentMutationRevision,
  );
  if (hasNewerMutations && input.currentSurface === null) {
    throw new Error("Workbench newer Surface mutation is unavailable");
  }
  return Object.freeze({
    surface: hasNewerMutations
      ? input.currentSurface!
      : input.durableSurface,
    hasNewerMutations,
  });
}

export function shouldPublishWorkbenchRootFrameV3(input: Readonly<{
  acceptedTimeSec: number;
  lastPublishedTimeSec: number;
  schedulerRunning: boolean;
}>): boolean {
  return !input.schedulerRunning
    || input.acceptedTimeSec - input.lastPublishedTimeSec
      >= WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3;
}

export function workbenchScenarioRuntimeStatusV3(
  isPlaying: boolean,
): "Live" | "Paused" {
  return isPlaying ? "Live" : "Paused";
}

export function readNewerDurableWorkbenchWorkspaceV3<
  T extends Pick<ExperimentWorkspaceV2, "draftVersion" | "experimentId">,
>(input: Readonly<{
  reader: Readonly<{ readWorkspace(experimentId: string): T | null }>;
  experimentId: string;
  current: T | null;
}>): T | null {
  let candidate: T | null;
  try {
    candidate = input.reader.readWorkspace(input.experimentId);
  } catch {
    return null;
  }
  if (candidate === null || candidate.experimentId !== input.experimentId) {
    return null;
  }
  if (
    input.current !== null
    && (
      candidate.experimentId !== input.current.experimentId
      || candidate.draftVersion <= input.current.draftVersion
    )
  ) return null;
  return candidate;
}

function GraphPaneBodyV3({
  activeScenarioId,
  playbackRunning,
  analysisById,
  analysisHistoryByKey,
  analysisErrorById,
  contract,
  frame,
  onRequestAnalysis,
  operationPending,
  pane,
  pendingAnalysisId,
  sampleStore,
  scenarios,
}: Readonly<{
  activeScenarioId: string | null;
  playbackRunning: boolean;
  analysisById: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisHistoryByKey: Readonly<
    Record<string, readonly StudioSimulationAnalysisV2[]>
  >;
  analysisErrorById: Readonly<Record<string, string>>;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  onRequestAnalysis: (analysisId: string) => boolean;
  operationPending: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  pendingAnalysisId: string | null;
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
}>) {
  const { t } = useTranslation();
  const graph = contract.graphCatalog.find(({ graphId }) => graphId === pane.graphId);
  if (graph === undefined) {
    return <div className="p-4 text-xs text-wb-danger">{t("workbench.live.unknownGraph")}</div>;
  }
  if (graph.renderer === "structural-return") {
    return (
      <StructuralReturnGraphPaneV3
        analysis={analysisById[graph.analysisId]}
        history={activeScenarioId === null
          ? []
          : workbenchBoundedGraphHistoryV3(analysisHistoryByKey[
              workbenchAnalysisHistoryKeyV3(
                activeScenarioId,
                graph.analysisId,
              )
            ] ?? [], pane.historyDepth ?? 1)}
        error={analysisErrorById[graph.analysisId] ?? null}
        frame={frame}
        graph={graph}
        onRequestAnalysis={onRequestAnalysis}
        operationPending={operationPending}
        pending={pendingAnalysisId === graph.analysisId}
      />
    );
  }
  return (
    <SampledGraphPaneBodyV3
      activeScenarioId={activeScenarioId}
      playbackRunning={playbackRunning}
      contract={contract}
      graph={graph}
      pane={pane}
      sampleStore={sampleStore}
      scenarios={scenarios}
    />
  );
}

function SampledGraphPaneBodyV3({
  activeScenarioId,
  playbackRunning,
  contract,
  graph,
  pane,
  sampleStore,
  scenarios,
}: Readonly<{
  activeScenarioId: string | null;
  playbackRunning: boolean;
  contract: ModelContractV2;
  graph: Exclude<
    ModelContractV2["graphCatalog"][number],
    StructuralReturnGraphDefinitionV2
  >;
  pane: ExperimentSurfaceGraphPaneV2;
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
}>) {
  const samplesByScenarioId = useWorkbenchScenarioPresentationSamplesV3(
    sampleStore,
  );
  const exactOrbitSamplesByScenarioId =
    useWorkbenchScenarioExactOrbitSamplesV3(sampleStore);
  const orbitHistoryByScenarioId =
    useWorkbenchScenarioOrbitHistoryV3(sampleStore);
  const displayedSeries = [...pane.series]
    .sort((left, right) => left.order - right.order);
  if (graph.renderer === "pressure-volume") {
    const bindings = displayedSeries.flatMap((series) => {
      const binding = graph.seriesCatalog.find((candidate) =>
        candidate.seriesId === series.seriesId);
      return binding === undefined ? [] : [{ binding, series }];
    });
    return (
      <div className="h-full min-h-0 bg-wb-app p-3">
        <PressureVolumeLoopCanvasV3
          traces={scenarios.flatMap((scenario, scenarioStyleIndex) => {
            const samples = exactOrbitSamplesByScenarioId[
              scenario.scenarioId
            ] ?? [];
            if (samples.length === 0) return [];
            return bindings.map(({ binding, series }) => ({
              scenarioId: scenario.scenarioId,
              scenarioLabel: scenario.label,
              scenarioStatus: workbenchScenarioRuntimeStatusV3(
                playbackRunning,
              ),
              scenarioStyleIndex,
              samples,
              historySampleSets: workbenchBoundedGraphHistoryV3(
                orbitHistoryByScenarioId[
                  scenario.scenarioId
                ] ?? [],
                pane.historyDepth ?? 1,
              ).map((entry) => entry.samples),
              volumeOutputId: binding.volumeOutputId,
              pressureOutputId: binding.pressureOutputId,
              pressureBasis: binding.pressureBasis,
              cyclePhaseOutputId: binding.cyclePhaseOutputId,
              chamberId: binding.seriesId,
              chamberLabel: series.label,
              chamberColor: series.colorHex,
              showSingleBeatOrientationGuides:
                scenario.scenarioId === activeScenarioId
                && binding.guideMode === "lv-single-beat-orientation",
            }));
          })}
        />
      </div>
    );
  }
  const bindings = displayedSeries.flatMap((series) => {
    const binding = graph.seriesCatalog.find((candidate) =>
      candidate.seriesId === series.seriesId);
    return binding === undefined ? [] : [{ binding, series }];
  });
  const outputs = bindings.flatMap(({ binding }) => {
    const definition = contract.outputCatalog.find((candidate) =>
      candidate.outputId === binding.outputId);
    return definition === undefined ? [] : [definition];
  });
  const commonUnit = outputs.length > 0
    && outputs.every(({ unit }) => unit === outputs[0]!.unit)
    ? outputs[0]!.unit
    : undefined;
  return (
    <div className="h-full min-h-0 bg-wb-app p-3">
      <SweepingWaveformCanvasV3
        activeScenarioId={activeScenarioId}
        includeZero={outputs.every(({ outputId }) =>
          outputId.includes(".flow.") || outputId.endsWith(".flow"))}
        traces={scenarios.flatMap((scenario, scenarioStyleIndex) => {
          const samples = samplesByScenarioId[scenario.scenarioId] ?? [];
          if (samples.length === 0) return [];
          return bindings.map(({ binding, series }) => ({
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            scenarioStatus: workbenchScenarioRuntimeStatusV3(
              playbackRunning,
            ),
            scenarioStyleIndex,
            samples,
            outputId: binding.outputId,
            signalLabel: series.label,
            signalColor: series.colorHex,
          }));
        })}
        unitLabel={commonUnit}
        windowSec={pane.windowSec ?? WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3}
      />
    </div>
  );
}

function StructuralReturnGraphPaneV3({
  analysis,
  history,
  error,
  frame,
  graph,
  onRequestAnalysis,
  operationPending,
  pending,
}: Readonly<{
  analysis: StudioSimulationAnalysisV2 | undefined;
  history: readonly StudioSimulationAnalysisV2[];
  error: string | null;
  frame: StudioSimulationFrameV2 | null;
  graph: StructuralReturnGraphDefinitionV2;
  onRequestAnalysis: (analysisId: string) => boolean;
  operationPending: boolean;
  pending: boolean;
}>) {
  const { t } = useTranslation();
  const acceptedStepAvailable = (frame?.acceptedRevision ?? 0) > 0;
  const lastAutoRequestedKeyRef = React.useRef<string | null>(null);
  const currentRequestKey = structuralReturnAnalysisRequestKeyV3(
    frame,
    graph.analysisId,
  );
  const analysisRequestKey = structuralReturnAnalysisRequestKeyV3(
    analysis,
    analysis?.analysisId,
  );
  const analysisBoundaryStatus = structuralReturnAnalysisBoundaryStatusV3(
    analysis,
    frame,
  );
  React.useEffect(() => {
    if (shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable,
      analysisRequestKey,
      currentRequestKey,
      error,
      lastAutoRequestedKey: lastAutoRequestedKeyRef.current,
      operationPending,
    })) {
      if (onRequestAnalysis(graph.analysisId)) {
        lastAutoRequestedKeyRef.current = currentRequestKey;
      }
    }
  }, [
    acceptedStepAvailable,
    analysisRequestKey,
    currentRequestKey,
    error,
    graph.analysisId,
    onRequestAnalysis,
    operationPending,
  ]);
  const orientation = React.useMemo(
    () => structuralReturnOrientationFromPayloadV3(
      analysis?.payload,
      graph.side,
    ),
    [analysis?.payload, graph.side],
  );
  const historyOrientations = React.useMemo(
    () => Object.freeze(history.flatMap((historical) => {
      const candidate = structuralReturnOrientationFromPayloadV3(
        historical.payload,
        graph.side,
      );
      return candidate === null ? [] : [candidate];
    })),
    [graph.side, history],
  );
  return (
    <div className="relative h-full min-h-0 bg-wb-app p-3">
      {orientation === null ? (
        <div className="flex h-full min-h-52 items-center justify-center rounded border border-wb-line bg-wb-aux px-5 text-center text-xs text-wb-muted">
          {pending
            ? t("workbench.live.analysisRunning")
            : error ?? (acceptedStepAvailable
              ? t("workbench.live.analysisUnavailable")
              : t("workbench.live.firstAcceptedStep"))}
        </div>
      ) : (
        <GuytonStarlingOrientationCanvasV3
          orientation={orientation}
          historyOrientations={historyOrientations}
        />
      )}
      {analysis !== undefined && (
        <div
          className={`pointer-events-none absolute bottom-5 left-5 z-10 rounded border px-2 py-1 font-mono text-[9px] shadow-sm ${
            analysisBoundaryStatus === "current"
              ? "border-emerald-500/40 bg-emerald-950/85 text-emerald-200"
              : "border-amber-500/40 bg-amber-950/85 text-amber-100"
          }`}
          data-analysis-boundary-status={analysisBoundaryStatus}
        >
          {t(
            analysisBoundaryStatus === "current"
              ? "workbench.live.analysisCurrentBoundary"
              : "workbench.live.analysisStaleBoundary",
            {
              revision: analysis.sourceAcceptedRevision,
              time: analysis.sourceAcceptedTimeSec.toFixed(3),
            },
          )}
        </div>
      )}
      <button
        type="button"
        className="absolute right-5 top-5 z-10 inline-flex h-7 items-center gap-1 rounded border border-wb-line bg-wb-panel/90 px-2 text-[10px] font-semibold text-wb-muted shadow-sm hover:bg-wb-hover hover:text-wb-text disabled:opacity-50"
        disabled={!acceptedStepAvailable || pending || operationPending}
        onClick={() => onRequestAnalysis(graph.analysisId)}
        aria-label={t("workbench.live.refreshAnalysis")}
      >
        <RefreshCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
        {t("workbench.live.refreshAnalysis")}
      </button>
    </div>
  );
}

export function shouldAutoRequestStructuralReturnAnalysisV3({
  acceptedStepAvailable,
  analysisRequestKey,
  currentRequestKey,
  error,
  lastAutoRequestedKey,
  operationPending,
}: Readonly<{
  acceptedStepAvailable: boolean;
  analysisRequestKey: string | null;
  currentRequestKey: string | null;
  error: string | null;
  lastAutoRequestedKey: string | null;
  operationPending: boolean;
}>): boolean {
  return acceptedStepAvailable
    && currentRequestKey !== null
    && analysisRequestKey !== currentRequestKey
    && error === null
    && lastAutoRequestedKey !== currentRequestKey
    && !operationPending;
}

export function structuralReturnAnalysisRequestKeyV3(
  source: Readonly<{
    modelId: string;
    runtimeSessionId: string;
    scenarioId: string;
    inputEpoch: number;
  }> | null | undefined,
  analysisId: string | null | undefined,
): string | null {
  if (source === null || source === undefined || analysisId === null
    || analysisId === undefined) return null;
  return JSON.stringify([
    source.modelId,
    source.runtimeSessionId,
    source.scenarioId,
    source.inputEpoch,
    analysisId,
  ]);
}

export function workbenchAnalysisHistoryKeyV3(
  scenarioId: string,
  analysisId: string,
): string {
  return JSON.stringify([scenarioId, analysisId]);
}

export function workbenchAnalysisMatchesFrameEpochV3(
  analysis: StudioSimulationAnalysisV2,
  frame: StudioSimulationFrameV2 | null,
): boolean {
  return frame !== null
    && analysis.modelId === frame.modelId
    && analysis.runtimeSessionId === frame.runtimeSessionId
    && analysis.scenarioId === frame.scenarioId
    && analysis.inputEpoch === frame.inputEpoch;
}

export function workbenchAnalysisMatchesExactFrameBoundaryV3(
  analysis: StudioSimulationAnalysisV2,
  frame: StudioSimulationFrameV2,
): boolean {
  return workbenchAnalysisMatchesFrameEpochV3(analysis, frame)
    && analysis.sourceAcceptedRevision === frame.acceptedRevision
    && Object.is(analysis.sourceAcceptedTimeSec, frame.acceptedTimeSec);
}

export function workbenchStructuralHistoryAnalysisIdsV3(
  surface: ExperimentSurfaceV2 | null,
  contract: ModelContractV2 | null,
): readonly string[] {
  if (surface === null || contract === null) return Object.freeze([]);
  const analysisIds = new Set<string>();
  for (const pane of surface.graphPanes) {
    if ((pane.historyDepth ?? 0) <= 0) continue;
    const graph = contract.graphCatalog.find(({ graphId }) =>
      graphId === pane.graphId);
    if (graph?.renderer === "structural-return") {
      analysisIds.add(graph.analysisId);
    }
  }
  return Object.freeze([...analysisIds]);
}

export async function requestExactStructuralHistoryAtBoundaryV3(input: Readonly<{
  analysisIds: readonly string[];
  frame: StudioSimulationFrameV2;
  runtime: Pick<WorkbenchParallelScenarioRuntimeV3, "requestAnalysis">;
}>): Promise<readonly StudioSimulationAnalysisV2[]> {
  const exact: StudioSimulationAnalysisV2[] = [];
  for (const analysisId of new Set(input.analysisIds)) {
    try {
      const analysis = await input.runtime.requestAnalysis({
        scenarioId: input.frame.scenarioId,
        analysisId,
        expectedInputEpoch: input.frame.inputEpoch,
        expectedAcceptedRevision: input.frame.acceptedRevision,
        expectedAcceptedTimeSec: input.frame.acceptedTimeSec,
      });
      if (
        analysis.analysisId === analysisId
        && workbenchAnalysisMatchesExactFrameBoundaryV3(analysis, input.frame)
      ) exact.push(analysis);
    } catch {
      // History is optional presentation context. A missing analysis must not
      // prevent the accepted control transition or create a stale curve.
    }
  }
  return Object.freeze(exact);
}

export function workbenchBoundedGraphHistoryV3<T>(
  history: readonly T[],
  depth: number,
): readonly T[] {
  if (!Number.isSafeInteger(depth) || depth <= 0) {
    return EMPTY_WORKBENCH_GRAPH_HISTORY_V3;
  }
  const boundedDepth = Math.min(3, depth);
  return history.length <= boundedDepth
    ? history
    : Object.freeze(history.slice(-boundedDepth));
}

export function archiveWorkbenchAnalysesV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  analyses: readonly StudioSimulationAnalysisV2[],
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  if (analyses.length === 0) return current;
  const next: Record<string, readonly StudioSimulationAnalysisV2[]> = {
    ...current,
  };
  for (const analysis of analyses) {
    const key = workbenchAnalysisHistoryKeyV3(
      analysis.scenarioId,
      analysis.analysisId,
    );
    const previous = next[key] ?? [];
    const withoutSameEpoch = previous.filter((candidate) =>
      candidate.inputEpoch !== analysis.inputEpoch);
    next[key] = Object.freeze([...withoutSameEpoch, analysis].slice(-3));
  }
  return Object.freeze(next);
}

export function withoutWorkbenchScenarioAnalysisHistoryV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  scenarioId: string,
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  let changed = false;
  const retained: Record<string, readonly StudioSimulationAnalysisV2[]> = {};
  for (const [key, history] of Object.entries(current)) {
    if (history.some((analysis) => analysis.scenarioId === scenarioId)) {
      changed = true;
    } else {
      retained[key] = history;
    }
  }
  return changed ? Object.freeze(retained) : current;
}

export type StructuralReturnAnalysisBoundaryStatusV3 =
  | "absent"
  | "current"
  | "stale";

export function structuralReturnAnalysisBoundaryStatusV3(
  analysis: StudioSimulationAnalysisV2 | undefined,
  frame: StudioSimulationFrameV2 | null,
): StructuralReturnAnalysisBoundaryStatusV3 {
  if (analysis === undefined) return "absent";
  if (frame === null) return "stale";
  return analysis.modelId === frame.modelId
    && analysis.runtimeSessionId === frame.runtimeSessionId
    && analysis.scenarioId === frame.scenarioId
    && analysis.inputEpoch === frame.inputEpoch
    && analysis.sourceAcceptedRevision === frame.acceptedRevision
    && Object.is(analysis.sourceAcceptedTimeSec, frame.acceptedTimeSec)
    ? "current"
    : "stale";
}

function OutputPaneBodyV3({
  contract,
  frame,
  pane,
  scenarioLabel,
}: Readonly<{
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  pane: ExperimentSurfaceOutputPaneV2;
  scenarioLabel: string;
}>) {
  const { t } = useTranslation();
  const selected = [...pane.items]
    .sort((left, right) => left.order - right.order)
    .flatMap((item) => {
      const definition = contract.outputCatalog.find((output) =>
        output.outputId === item.outputId);
      return definition === undefined ? [] : [{ definition, item }];
    });
  return (
    <div className="flex h-full min-h-0 flex-col bg-wb-aux">
      <div className="shrink-0 px-3 pt-2 text-right text-[10px] font-medium text-wb-subtle">
        {scenarioLabel}
      </div>
      <div className="grid min-h-0 flex-1 content-start grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 overflow-auto p-2">
        {selected.length === 0 ? (
          <p className="p-4 text-xs text-wb-subtle">
            {t("workbench.live.noSelectedOutputs")}
          </p>
        ) : selected.map(({ definition: output, item }) => {
          const value = frame?.outputs[item.outputId];
          const scalar = scalarAvailableOutputV3(value);
          return (
            <div
              key={item.outputId}
              className="min-w-0 rounded-lg bg-wb-soft px-3.5 py-3"
              data-output-availability={value?.availability ?? "unavailable"}
              data-output-quality={value?.quality ?? "not-assessed"}
            >
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-wb-subtle">
                {item.label}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-wb-text">
                {scalar === null ? "—" : scalar.toFixed(2)}
                <span className="ml-1 text-[10px] font-normal text-wb-muted">{output.unit}</span>
              </p>
              {value?.quality === "not-assessed" && (
                <p className="mt-1 text-[9px] text-wb-warning">
                  {t("workbench.live.outputNotAssessed")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControlPaneBodyV3({
  contract,
  controlError,
  controlValues,
  disabledByAnalysis,
  onApplyControl,
  pane,
  pendingControlId,
}: Readonly<{
  contract: ModelContractV2;
  controlError: string | null;
  controlValues: Readonly<Record<string, number>>;
  disabledByAnalysis: boolean;
  onApplyControl: (controlId: string, value: number) => Promise<boolean>;
  pane: ExperimentSurfaceControlPaneV2;
  pendingControlId: string | null;
}>) {
  const { t } = useTranslation();
  const selectedControls = [...pane.items]
    .sort((left, right) => left.order - right.order)
    .flatMap((item) => {
      const definition = contract.controlCatalog.find((control) =>
        control.controlId === item.controlId);
      return definition === undefined ? [] : [{ definition, item }];
    });
  return (
    <div className="min-w-0">
      <section>
        {contract.controlCatalog.length === 0 ? (
          <p className="rounded-lg bg-wb-panel p-3 text-xs leading-5 text-wb-muted">
            {t("workbench.live.noRegisteredControls")}
          </p>
        ) : selectedControls.length === 0 ? (
          <p className="text-xs text-wb-subtle">
            {t("workbench.live.noSelectedControls")}
          </p>
        ) : (
          <div className="grid gap-2">
            {selectedControls.map(({ definition: control, item }) => (
              <NumericControlV3
                key={control.controlId}
                control={control}
                disabled={pendingControlId !== null || disabledByAnalysis}
                label={item.label}
                pending={pendingControlId === control.controlId}
                value={controlValues[control.controlId] ?? control.defaultValue}
                onCommit={(value) => onApplyControl(control.controlId, value)}
              />
            ))}
          </div>
        )}
        {controlError !== null && (
          <p className="mt-3 rounded-lg bg-wb-danger-soft p-2 text-[10px] text-wb-danger" role="alert">
            {controlError}
          </p>
        )}
      </section>
    </div>
  );
}

function NumericControlV3({
  control,
  disabled,
  label,
  onCommit,
  pending,
  value,
}: Readonly<{
  control: ControlDefinitionV2;
  disabled: boolean;
  label: string;
  onCommit: (value: number) => Promise<boolean>;
  pending: boolean;
  value: number;
}>) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  const commit = async (candidate: number) => {
    const result = await resolveControlDraftCommitV3({
      acceptedValue: value,
      candidate,
      control,
      onCommit,
    });
    setDraft(result.displayValue);
  };
  const precision = controlStepPrecisionV3(control.step);
  return (
    <div className="rounded-lg bg-wb-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{label}</p>
        </div>
        <output className="shrink-0 font-mono text-xs font-bold text-wb-accent">
          {draft.toFixed(precision)} {control.unit}
        </output>
      </div>
      <input
        className="mt-3 w-full accent-[var(--wb-accent)] disabled:opacity-50"
        type="range"
        min={control.minimum}
        max={control.maximum}
        step={control.step}
        value={draft}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => setDraft(Number(event.currentTarget.value))}
        onPointerUp={() => void commit(draft)}
        onKeyUp={(event) => {
          if ([
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "End",
            "Home",
            "PageDown",
            "PageUp",
          ].includes(event.key)) {
            void commit(draft);
          }
        }}
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-wb-subtle">
        <span>{control.minimum}</span>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-wb-hover hover:text-wb-text disabled:opacity-50"
          disabled={disabled || value === control.defaultValue}
          onClick={() => {
            setDraft(control.defaultValue);
            void commit(control.defaultValue);
          }}
        >
          {pending ? t("workbench.live.applying") : t("workbench.live.resetControl")}
        </button>
        <span>{control.maximum}</span>
      </div>
    </div>
  );
}

function BriefingPreviewPaneV3({
  paneId,
  surface,
}: Readonly<{
  paneId: string;
  surface: ExperimentSurfaceV2;
}>) {
  const pane = allSurfacePanesV3(surface).find((candidate) =>
    candidate.paneId === paneId);
  if (pane === undefined) return null;
  if (pane.role === "graph") {
    const colors = pane.series.slice(0, 3).map(({ colorHex }) => colorHex);
    return (
      <div className="flex h-28 items-center justify-center bg-wb-app px-4">
        <svg viewBox="0 0 240 64" className="h-20 w-full" aria-hidden="true">
          {colors.map((color, index) => (
            <path
              key={`${color}:${index}`}
              d={`M 0 ${34 + index * 6} C 28 ${8 + index * 5}, 48 ${58 - index * 4}, 76 ${28 + index * 3} S 124 ${12 + index * 9}, 152 ${36 - index * 4} S 204 ${54 - index * 5}, 240 ${22 + index * 5}`}
              fill="none"
              stroke={color}
              strokeWidth="1.75"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    );
  }
  if (pane.role === "output") {
    return (
      <div className="grid grid-cols-2 gap-2 bg-wb-app p-3">
        {pane.items.slice(0, 4).map((item) => (
          <div key={item.outputId} className="rounded-lg bg-wb-soft px-2.5 py-2">
            <p className="truncate text-[9px] text-wb-subtle">{item.label}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-wb-muted">—</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3 bg-wb-app p-3">
      {pane.items.slice(0, 3).map((item) => (
        <div key={item.controlId}>
          <p className="truncate text-[9px] text-wb-subtle">{item.label}</p>
          <div className="mt-1.5 h-1 rounded-full bg-wb-line-strong">
            <div className="h-1 w-1/2 rounded-full bg-wb-accent" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PaneLoadingV3() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center text-xs text-wb-muted" role="status">
      <Activity className="mr-2 h-3.5 w-3.5 animate-pulse" />
      {t("workbench.live.loadingPane")}
    </div>
  );
}

function controlValueFromFixtureV3(
  fixture: unknown,
  controlId: string,
): number | null {
  if (fixture === null || typeof fixture !== "object" || Array.isArray(fixture)) {
    return null;
  }
  const inputs = (fixture as Record<string, unknown>).hemodynamicResearchInputs;
  if (inputs === null || typeof inputs !== "object" || Array.isArray(inputs)) {
    return null;
  }
  const inputKeyByControlId: Readonly<Record<string, string>> = {
    "hemodynamics.systemic-resistance": "systemicResistance",
    "hemodynamics.pulmonary-resistance": "pulmonaryResistance",
    "hemodynamics.venous-tone": "venousTone",
    "hemodynamics.arterial-stiffness": "arterialStiffness",
  };
  const inputKey = inputKeyByControlId[controlId];
  if (inputKey === undefined) return null;
  const value = (inputs as Record<string, unknown>)[inputKey];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function controlValuesForFixtureV3(
  contract: ModelContractV2,
  fixture: unknown,
): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries(contract.controlCatalog.map((control) => [
    control.controlId,
    controlValueFromFixtureV3(fixture, control.controlId)
      ?? control.defaultValue,
  ])));
}

function appendFramesV3(
  frames: readonly StudioSimulationFrameV2[],
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3,
): void {
  const framesByScenarioId = new Map<string, StudioSimulationFrameV2[]>();
  for (const frame of frames) {
    const grouped = framesByScenarioId.get(frame.scenarioId) ?? [];
    grouped.push(frame);
    framesByScenarioId.set(frame.scenarioId, grouped);
  }
  sampleStore.appendMany([...framesByScenarioId].map(([
    scenarioId,
    scenarioFrames,
  ]) => ({
    scenarioId,
    samples: scenarioFrames.map((frame) => Object.freeze({
      inputEpoch: frame.inputEpoch,
      acceptedRevision: frame.acceptedRevision,
      acceptedTimeSec: frame.acceptedTimeSec,
      values: Object.freeze(Object.fromEntries(Object.entries(frame.outputs).map(
        ([outputId, output]) => [
          outputId,
          scalarAvailableOutputV3(output),
        ],
      ))),
    })),
  })));
}

function scalarAvailableOutputV3(
  output: StudioSimulationFrameV2["outputs"][string] | undefined,
): number | null {
  return output?.availability === "available"
    && output.quality !== "not-assessed"
    && typeof output.value === "number"
    && Number.isFinite(output.value)
    ? output.value
    : null;
}

function withoutRecordKeyV3(
  record: Readonly<Record<string, string>>,
  key: string,
): Readonly<Record<string, string>> {
  if (!(key in record)) return record;
  return Object.freeze(Object.fromEntries(
    Object.entries(record).filter(([candidate]) => candidate !== key),
  ));
}

export type ControlDraftCommitResultV3 = Readonly<{
  accepted: boolean;
  displayValue: number;
}>;

export async function resolveControlDraftCommitV3({
  acceptedValue,
  candidate,
  control,
  onCommit,
}: Readonly<{
  acceptedValue: number;
  candidate: number;
  control: ControlDefinitionV2;
  onCommit: (value: number) => Promise<boolean>;
}>): Promise<ControlDraftCommitResultV3> {
  const normalized = normalizeControlValueV3(candidate, control);
  if (normalized === acceptedValue) {
    return Object.freeze({ accepted: true, displayValue: acceptedValue });
  }
  const accepted = await onCommit(normalized);
  return Object.freeze({
    accepted,
    displayValue: accepted ? normalized : acceptedValue,
  });
}

function normalizeControlValueV3(
  value: number,
  control: ControlDefinitionV2,
): number {
  const clamped = Math.min(control.maximum, Math.max(control.minimum, value));
  const steps = Math.round((clamped - control.minimum) / control.step);
  const snapped = control.minimum + steps * control.step;
  return Number(snapped.toFixed(Math.min(12, controlStepPrecisionV3(control.step) + 2)));
}

function controlStepPrecisionV3(step: number): number {
  const text = step.toString();
  if (text.includes("e-")) return Math.min(6, Number(text.split("e-")[1]));
  return Math.min(6, text.split(".")[1]?.length ?? 0);
}

export default WorkbenchV3Page;

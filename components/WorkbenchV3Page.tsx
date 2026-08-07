import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  FileText,
  Home,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sun,
  Undo2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAppTheme } from "@/appTheme";
import { useUnsavedChangesGuardV3 } from "@/components/useUnsavedChangesGuardV3";
import { useSiteAccountSessionV3 } from "@/components/site/SiteAccountSessionV3";

import {
  WorkbenchDockview,
  type WorkbenchPaneSplitDirectionV3,
} from "@/components/workbench/WorkbenchDockview";
import { WorkbenchAreaLayoutV3 } from "@/components/workbench/WorkbenchAreaLayoutV3";
import { WorkbenchBriefingComposerV3 } from "@/components/workbench/WorkbenchBriefingComposerV3";
import { WorkbenchPaneBindingButtonV3 } from "@/components/workbench/WorkbenchPaneBindingV3";
import {
  defaultArticleBriefingV3,
  materializeSurfaceControlPaneBindingV3,
} from "@/components/article/ArticleEditorStateV3";
import { WorkbenchNoteEditorV3 } from "@/components/workbench/WorkbenchNoteEditorV3";
import { WorkbenchSimulationInfoV3 } from "@/components/workbench/WorkbenchSimulationInfoV3";
import {
  WorkbenchPaneEditorV3,
  addWorkbenchSurfacePaneV3,
  compareWorkbenchOutputPaneByScenarioV3,
  deleteWorkbenchSurfacePaneV3,
  duplicateWorkbenchSurfacePaneV3,
  updateWorkbenchSurfacePaneV3,
} from "@/components/workbench/WorkbenchPaneEditorV3";
import {
  WorkbenchScenarioManagerV3,
  scenarioIdentityColorV3,
  type WorkbenchScenarioAddIntentV3,
  type WorkbenchScenarioDeleteIntentV3,
  type WorkbenchScenarioDuplicateIntentV3,
  type WorkbenchScenarioRenameIntentV3,
} from "@/components/workbench/WorkbenchScenarioManagerV3";
import { commitWorkbenchTransientAuthoringResultV3 } from "@/components/workbench/WorkbenchTransientAuthoringCommitV3";
import {
  WORKBENCH_SCENARIO_ID_V3,
  WORKBENCH_GRAPH_PANE_OPTIONS_V3,
  WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3,
  createDefaultExperimentSurfaceV3,
  isWorkbenchGraphTraceExcludedV3,
  reconcileWorkbenchSurfaceScenariosV3,
  resolveWorkbenchControlPaneScenarioIdsV3,
  resolveWorkbenchGraphScenarioIdsV3,
  resolveWorkbenchOutputPaneScenarioIdV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import {
  allocateOpaqueExperimentIdV3,
  isOpaqueExperimentIdV3,
} from "@/studio/infrastructure/browser/StudioExperimentIdentityV3";
import {
  articleEditorHref,
  experimentDetailHref,
  homeHref,
  myExperimentsHref,
  newExperimentHref,
} from "@/homeLinks";
import { isLocale } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
  loadStudioModelClientCompositionV2,
  type StudioClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  StudioExactModelUnavailableErrorV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import type {
  ExperimentControlPresentationV2,
  ExperimentSurfaceControlPaneV2,
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceOutputPaneV2,
  ExperimentSurfaceV2,
  ExperimentScenarioV2,
  ExperimentSnapshotV2,
  ExperimentPlacementBriefingV2,
  ExperimentPlacementBriefingGraphOverridesV2,
  ExperimentV2,
  ScenarioPresetV2,
} from "@/studio/contracts/v2/content";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";
import {
  validateExperimentPlacementBriefingV2,
} from "@/studio/application/authoring/StudioExperimentDataV2";
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
  StudioSimulationWorkerScenarioCapturesV2,
  StudioSimulationWorkerScenarioDescriptorV2,
  StudioSimulationWorkerScenarioStateV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import { StudioBrowserContentStoreV3 } from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import { studioCanonicalJsonStringify } from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  StudioBrowserExperimentIndexV3,
  STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
  type StudioBrowserExperimentRecordV3,
} from "@/studio/infrastructure/browser/StudioBrowserExperimentIndexV3";
import {
  createStudioSupabaseContentRepositoryV1,
  type StudioRemoteExperimentResourceV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  StudioArticleExperimentAuthoringHandoffStoreV3,
} from "@/studio/infrastructure/browser/StudioArticleExperimentAuthoringHandoffV3";
import {
  StudioExperimentSessionHandoffStoreV3,
} from "@/studio/infrastructure/browser/StudioExperimentSessionHandoffV3";
import { mainWireIntegratedStudioControlValueFromFixtureV3 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import {
  GuytonStarlingComparisonCanvasV3,
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  WorkbenchScenarioPresentationSampleStoreV3,
  WorkbenchBackgroundWorkerPoolV3,
  reconcileWorkbenchGraphColorsV3,
  resolveWorkbenchBackgroundWorkerBudgetV3,
  resolveWorkbenchGraphTraceStyleV3,
  recordWorkbenchPerformanceDurationV3,
  recordWorkbenchPerformanceEventIntervalV3,
  structuralReturnOrientationFromPayloadV3,
  useWorkbenchSampledGraphPresentationSamplesV3,
  updateWorkbenchScenarioBaseColorV3,
  workbenchModelCyclePhaseOutputIdV3,
  workbenchPresentationOutputSelectionV3,
  type WorkbenchScenarioOrbitHistoryV3,
  type WorkbenchScenarioPresentationSamplesV3,
  workbenchPerformanceDiagnosticsEnabledV3,
  workbenchPerformanceNowV3,
} from "@/components/workbench/v3";
import { WorkbenchParallelAuthoringCoordinatorV3 } from "@/components/workbench/v3/WorkbenchParallelAuthoringCoordinatorV3";
import {
  WorkbenchParallelScenarioRuntimeV3,
  type WorkbenchParallelScenarioSeedV3,
} from "@/components/workbench/v3/WorkbenchParallelScenarioRuntimeV3";
import { randomPortableTokenV3 } from "@/components/workbench/v3/randomPortableTokenV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import {
  buildMainWireIntegratedModelRapidPressureVolumeRelationV3,
  type MainWireIntegratedModelRapidPressureVolumeRelationV3,
} from "@/engine/myocardium/MainWireIntegratedModelRapidPressureVolumeRelationV3";

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
    }>
  | Readonly<{ kind: "error"; message: string }>;

type WorkbenchPaneSettingsV3 =
  | Readonly<{ kind: "graph"; paneId: string }>
  | Readonly<{
      kind: "output";
      paneId: string;
      section?: "binding";
    }>
  | Readonly<{
      kind: "control";
      paneId: string;
      section?: "binding";
    }>;

type WorkbenchScenarioOperationV3 =
  "select" | "add" | "duplicate" | "rename" | "delete";

type WorkbenchRuntimeRestartFeedbackV3 = Readonly<{
  saveState: "clean" | "dirty" | "error";
  saveError: string | null;
  snapshotState: "idle" | "created" | "error";
  snapshotError: string | null;
}>;

const WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3 = 0.1;
const WORKBENCH_ANALYSIS_PROGRESS_COMMIT_INTERVAL_MS_V3 = 400;
const EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3 = Object.freeze(
  Object.create(null),
) as WorkbenchScenarioPresentationSamplesV3;
const EMPTY_WORKBENCH_SCENARIO_ORBIT_HISTORY_V3 = Object.freeze(
  Object.create(null),
) as WorkbenchScenarioOrbitHistoryV3;

const recordWorkbenchReactCommitV3: React.ProfilerOnRenderCallback = (
  _id,
  _phase,
  actualDuration,
) => {
  recordWorkbenchPerformanceDurationV3(
    "react.workbench-area-commit",
    actualDuration,
  );
  recordWorkbenchPerformanceEventIntervalV3(
    "react.workbench-area-commit-interval",
  );
};

function WorkbenchPerformanceProfilerV3({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return workbenchPerformanceDiagnosticsEnabledV3() ? (
    <React.Profiler
      id="workbench-area-v3"
      onRender={recordWorkbenchReactCommitV3}
    >
      {children}
    </React.Profiler>
  ) : children;
}
const EMPTY_WORKBENCH_GRAPH_HISTORY_V3 = Object.freeze([] as never[]);

export function resolveWorkbenchInitialSaveStateV3(
  input: Readonly<{
    hasStoredExperiment: boolean;
    hasPendingSurface: boolean;
    pendingSaveState: "clean" | "dirty" | "error" | null;
  }>,
): "clean" | "dirty" | "error" {
  if (input.pendingSaveState !== null) return input.pendingSaveState;
  return input.hasStoredExperiment && !input.hasPendingSurface
    ? "clean"
    : "dirty";
}

export function shouldConfirmWorkbenchDiscardV3(input: Readonly<{
  hasUnsavedContentChanges: boolean;
  hasUncommittedTitleChanges: boolean;
  hasUncapturedBriefingChanges: boolean;
}>): boolean {
  return input.hasUnsavedContentChanges
    || input.hasUncommittedTitleChanges
    || input.hasUncapturedBriefingChanges;
}

export const WorkbenchV3Page = () => {
  const { experimentId, locale } = useParams();
  const selectedLocale = isLocale(locale) ? locale : undefined;
  if (experimentId === "new") {
    return <WorkbenchV3Session initialExperimentId={null} />;
  }
  if (!isOpaqueExperimentIdV3(experimentId)) {
    return <Navigate to={myExperimentsHref(selectedLocale)} replace />;
  }
  return <WorkbenchV3Session initialExperimentId={experimentId} />;
};

const WorkbenchV3Session = ({
  initialExperimentId,
}: Readonly<{ initialExperimentId: string | null }>) => {
  const { t } = useTranslation();
  const { appTheme, setAppTheme } = useAppTheme();
  const { authIdentity } = useSiteAccountSessionV3();
  const { locale } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedLocale = locale === "ja" || locale === "en" ? locale : "ja";
  const experimentIdRef = React.useRef<string | null>(initialExperimentId);
  const [sessionToken] = React.useState(() => {
    const queryToken = new URLSearchParams(location.search).get("sessionToken");
    return queryToken ?? `session-${randomPortableTokenV3()}`;
  });
  const experimentIndex = React.useMemo(
    () => new StudioBrowserExperimentIndexV3(),
    [],
  );
  const remoteContentRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const articleExperimentHandoff = React.useMemo(
    () => new StudioArticleExperimentAuthoringHandoffStoreV3(),
    [],
  );
  const experimentSessionHandoff = React.useMemo(
    () => new StudioExperimentSessionHandoffStoreV3(),
    [],
  );
  const articleAuthoringContext = React.useMemo(() => {
    const search = new URLSearchParams(location.search);
    const queryArticleId = search.get("articleId");
    const querySessionToken = search.get("sessionToken");
    const pending = articleExperimentHandoff.read();
    return queryArticleId !== null
      && querySessionToken !== null
      && pending !== null
      && pending.snapshotId === null
      && pending.articleId === queryArticleId
      && pending.sessionToken === querySessionToken
      && pending.sessionToken === sessionToken
      ? pending
      : null;
  }, [articleExperimentHandoff, location.search, sessionToken]);
  const experimentSessionContext = React.useMemo(() => {
    const search = new URLSearchParams(location.search);
    const snapshotId = search.get("snapshotId");
    const querySessionToken = search.get("sessionToken");
    const pending = experimentSessionHandoff.read();
    return snapshotId !== null
      && querySessionToken !== null
      && pending !== null
      && pending.snapshotId === snapshotId
      && pending.sessionToken === querySessionToken
      && pending.sessionToken === sessionToken
      ? pending
      : null;
  }, [experimentSessionHandoff, location.search, sessionToken]);
  const [experimentRecord, setExperimentRecord] =
    React.useState<StudioBrowserExperimentRecordV3 | null>(null);
  const [experimentTitle, setExperimentTitle] = React.useState("");
  const [status, setStatus] = React.useState<WorkbenchStatusV3>({
    kind: "loading",
  });
  const [presentationSampleStore] = React.useState(
    () => new WorkbenchScenarioPresentationSampleStoreV3(),
  );
  const [surface, setSurface] = React.useState<ExperimentSurfaceV2 | null>(
    null,
  );
  const [experiment, setExperiment] =
    React.useState<ExperimentV2 | null>(null);
  const [snapshotCount, setSnapshotCount] = React.useState(0);
  const [saveState, setSaveState] = React.useState<
    "clean" | "dirty" | "saving" | "error"
  >("dirty");
  const [hasUnsavedContentChanges, setHasUnsavedContentChanges] =
    React.useState(false);
  const [hasUncommittedTitleChanges, setHasUncommittedTitleChanges] =
    React.useState(false);
  const [hasUncapturedBriefingChanges, setHasUncapturedBriefingChanges] =
    React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [snapshotState, setSnapshotState] = React.useState<
    "idle" | "creating" | "created" | "error"
  >("idle");
  const [snapshotPurpose, setSnapshotPurpose] = React.useState<
    "article" | "publication" | null
  >(null);
  const [snapshotError, setSnapshotError] = React.useState<string | null>(null);
  const [recoveryError, setRecoveryError] = React.useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = React.useState(false);
  const [articleLinked, setArticleLinked] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [briefing, setBriefing] =
    React.useState<ExperimentPlacementBriefingV2 | null>(null);
  const [briefingCaptureSnapshot, setBriefingCaptureSnapshot] =
    React.useState<ExperimentSnapshotV2 | null>(null);
  const [briefingCaptureSurfaceMutationRevision, setBriefingCaptureSurfaceMutationRevision] =
    React.useState<number | null>(null);
  const [paneSettings, setPaneSettings] =
    React.useState<WorkbenchPaneSettingsV3 | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [backgroundWorkerPool, setBackgroundWorkerPool] =
    React.useState<WorkbenchBackgroundWorkerPoolV3 | null>(null);
  const [runtimeGeneration, setRuntimeGeneration] = React.useState(0);
  const [, setControlValues] = React.useState<
    Readonly<Record<string, number>>
  >({});
  const [pendingControlId, setPendingControlId] = React.useState<string | null>(
    null,
  );
  const [controlError, setControlError] = React.useState<string | null>(null);
  const [scenarios, setScenarios] = React.useState<
    readonly StudioSimulationWorkerScenarioDescriptorV2[]
  >([]);
  const [activeScenarioId, setActiveScenarioId] = React.useState<string | null>(
    null,
  );
  const [hiddenScenarioIds, setHiddenScenarioIds] = React.useState<
    readonly string[]
  >([]);
  const [scenarioPresets, setScenarioPresets] = React.useState<
    readonly ScenarioPresetV2[]
  >([]);
  const [scenarioOperation, setScenarioOperation] =
    React.useState<WorkbenchScenarioOperationV3 | null>(null);
  const [scenarioError, setScenarioError] = React.useState<string | null>(null);
  const [analysisByKey, setAnalysisByKey] = React.useState<
    Readonly<Record<string, StudioSimulationAnalysisV2>>
  >({});
  const [analysisHistoryByKey, setAnalysisHistoryByKey] = React.useState<
    Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>
  >({});
  const [pendingAnalysisKeys, setPendingAnalysisKeys] = React.useState<
    readonly string[]
  >([]);
  const [analysisCapturePending, setAnalysisCapturePending] =
    React.useState(false);
  const [analysisErrorByKey, setAnalysisErrorByKey] = React.useState<
    Readonly<Record<string, string>>
  >({});
  const runtimeRef = React.useRef<WorkbenchParallelScenarioRuntimeV3 | null>(
    null,
  );
  const workerReleaseTicketRef = React.useRef<
    StudioModelWorkerReleaseTicketV2 | undefined
  >(undefined);
  const translationRef = React.useRef(t);
  const analysisByKeyRef = React.useRef<
    Readonly<Record<string, StudioSimulationAnalysisV2>>
  >({});
  const equivalentAnalysisSourceByScenarioRef = React.useRef(
    new Map<string, string>(),
  );
  const queuedAnalysisProgressByKeyRef = React.useRef(
    new Map<string, StudioSimulationAnalysisV2>(),
  );
  const analysisProgressCommitTimerRef = React.useRef<number | null>(null);
  const contentStoreRef = React.useRef<StudioBrowserContentStoreV3 | null>(
    null,
  );
  const experimentRef = React.useRef<ExperimentV2 | null>(null);
  const experimentTitleRef = React.useRef("");
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
  const analysisCaptureTokenRef = React.useRef<symbol | null>(null);
  const surfaceRef = React.useRef<ExperimentSurfaceV2 | null>(null);
  const briefingRef = React.useRef<ExperimentPlacementBriefingV2 | null>(null);
  const briefingMutationRevisionRef = React.useRef(0);
  const scenarioDescriptorsRef = React.useRef<
    readonly StudioSimulationWorkerScenarioDescriptorV2[]
  >([]);
  const surfaceMutationRevisionRef = React.useRef(0);
  const pendingSurfaceAfterRuntimeRestartRef =
    React.useRef<ExperimentSurfaceV2 | null>(null);
  const pendingFeedbackAfterRuntimeRestartRef =
    React.useRef<WorkbenchRuntimeRestartFeedbackV3 | null>(null);
  const contract = status.kind === "live" ? status.contract : null;

  React.useEffect(() => {
    translationRef.current = t;
  }, [t]);

  React.useEffect(() => {
    const pool = new WorkbenchBackgroundWorkerPoolV3(
      resolveWorkbenchBackgroundWorkerBudgetV3(),
    );
    setBackgroundWorkerPool(pool);
    return () => pool.dispose();
  }, []);

  const replaceAnalysisByKeyV3 = React.useCallback(
    (next: Readonly<Record<string, StudioSimulationAnalysisV2>>) => {
      analysisByKeyRef.current = next;
      setAnalysisByKey(next);
    },
    [],
  );

  const commitAnalysesV3 = React.useCallback(
    (analyses: readonly StudioSimulationAnalysisV2[]) => {
      const runtime = runtimeRef.current;
      const accepted: Array<readonly [string, StudioSimulationAnalysisV2]> = [];
      for (const analysis of analyses) {
        let frame: StudioSimulationFrameV2 | null = null;
        if (runtime !== null) {
          try {
            frame = runtime.latestFrame(analysis.scenarioId);
          } catch {
            continue;
          }
        }
        if (workbenchAnalysisMatchesFrameEpochV3(analysis, frame)) {
          accepted.push(Object.freeze([
            workbenchAnalysisHistoryKeyV3(
              analysis.scenarioId,
              analysis.analysisId,
            ),
            analysis,
          ]));
          if (runtime !== null) {
            for (const [targetScenarioId, sourceScenarioId] of
              equivalentAnalysisSourceByScenarioRef.current) {
              if (sourceScenarioId !== analysis.scenarioId) continue;
              let targetFrame: StudioSimulationFrameV2;
              try {
                targetFrame = runtime.latestFrame(targetScenarioId);
              } catch {
                continue;
              }
              const cloned = cloneWorkbenchAnalysisForScenarioV3(
                analysis,
                targetFrame,
              );
              accepted.push(Object.freeze([
                workbenchAnalysisHistoryKeyV3(
                  cloned.scenarioId,
                  cloned.analysisId,
                ),
                cloned,
              ]));
            }
          }
        }
      }
      if (accepted.length === 0) return;
      replaceAnalysisByKeyV3(Object.freeze({
        ...analysisByKeyRef.current,
        ...Object.fromEntries(accepted),
      }));
    },
    [replaceAnalysisByKeyV3],
  );

  const commitAnalysisV3 = React.useCallback(
    (analysis: StudioSimulationAnalysisV2) => {
      queuedAnalysisProgressByKeyRef.current.delete(
        workbenchAnalysisHistoryKeyV3(
          analysis.scenarioId,
          analysis.analysisId,
        ),
      );
      commitAnalysesV3([analysis]);
    },
    [commitAnalysesV3],
  );

  const queueAnalysisProgressV3 = React.useCallback(
    (analysis: StudioSimulationAnalysisV2) => {
      queuedAnalysisProgressByKeyRef.current.set(
        workbenchAnalysisHistoryKeyV3(
          analysis.scenarioId,
          analysis.analysisId,
        ),
        analysis,
      );
      if (analysisProgressCommitTimerRef.current !== null) return;
      analysisProgressCommitTimerRef.current = window.setTimeout(() => {
        analysisProgressCommitTimerRef.current = null;
        const pending = Object.freeze([
          ...queuedAnalysisProgressByKeyRef.current.values(),
        ]);
        queuedAnalysisProgressByKeyRef.current.clear();
        commitAnalysesV3(pending);
      }, WORKBENCH_ANALYSIS_PROGRESS_COMMIT_INTERVAL_MS_V3);
    },
    [commitAnalysesV3],
  );

  React.useEffect(() => () => {
    if (analysisProgressCommitTimerRef.current !== null) {
      window.clearTimeout(analysisProgressCommitTimerRef.current);
      analysisProgressCommitTimerRef.current = null;
    }
    queuedAnalysisProgressByKeyRef.current.clear();
  }, []);

  const updateWorkbenchBriefingV3 = React.useCallback(
    (next: ExperimentPlacementBriefingV2) => {
      briefingMutationRevisionRef.current += 1;
      briefingRef.current = next;
      setBriefing(next);
    },
    [],
  );

  React.useEffect(() => {
    if (articleAuthoringContext !== null) setArticleLinked(true);
  }, [articleAuthoringContext]);

  React.useEffect(() => {
    if (briefingOpen || briefingCaptureSnapshot === null) return undefined;
    const timeout = window.setTimeout(
      () => {
        setBriefingCaptureSnapshot(null);
        setBriefingCaptureSurfaceMutationRevision(null);
      },
      180,
    );
    return () => window.clearTimeout(timeout);
  }, [briefingCaptureSnapshot, briefingOpen]);

  React.useEffect(() => {
    if (backgroundWorkerPool === null) return undefined;
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
      analysisCaptureTokenRef.current = null;
      setAnalysisCapturePending(false);
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    };

    const start = async () => {
      const contentStore = remoteContentRepository === null
        ? new StudioBrowserContentStoreV3()
        : null;
      contentStoreRef.current = contentStore;
      const durableExperimentId = experimentIdRef.current;
      const remoteExperimentResource = durableExperimentId === null
        || remoteContentRepository === null
        ? null
        : await remoteContentRepository.readMyExperiment(durableExperimentId);
      const storedExperiment = durableExperimentId === null
        ? null
        : remoteContentRepository === null
          ? contentStore!.readExperiment(durableExperimentId)
          : remoteExperimentResource?.experiment ?? null;
      if (durableExperimentId !== null && storedExperiment === null) {
        navigate(myExperimentsHref(resolvedLocale), { replace: true });
        return;
      }
      const requestedSnapshotId = new URLSearchParams(location.search).get(
        "snapshotId",
      );
      const sourceSnapshot = storedExperiment === null
        && requestedSnapshotId !== null
        ? remoteContentRepository === null
          ? contentStore!.readSnapshot(requestedSnapshotId)
          : await remoteContentRepository.readSnapshot(requestedSnapshotId)
        : null;
      const sourceBriefing = sourceSnapshot === null
        || articleAuthoringContext?.briefing === null
        || articleAuthoringContext?.briefing === undefined
        ? null
        : validateExperimentPlacementBriefingV2(
            articleAuthoringContext.briefing,
            sourceSnapshot.content,
          );
      const initialContent = storedExperiment?.content ?? sourceSnapshot?.content;
      let composition: StudioClientCompositionV2;
      try {
        composition = initialContent === undefined
          ? await loadStudioDefaultClientCompositionV2()
          : await loadStudioModelClientCompositionV2(initialContent.modelId);
      } catch (error) {
        if (
          initialContent !== undefined
          && error instanceof StudioExactModelUnavailableErrorV1
        ) {
          playingIntentRef.current = false;
          setIsPlaying(false);
          setStatus({
            kind: "unavailable-model",
            savedModelId: initialContent.modelId,
          });
          return;
        }
        throw error;
      }
      if (cancelled) return;
      workerReleaseTicketRef.current = composition.workerReleaseTicket;
      const record = storedExperiment === null
        ? null
        : remoteExperimentResource === null
          ? experimentIndex.ensure({
              experimentId: durableExperimentId!,
              title: storedExperiment.content.scenarios[0]?.label
                ?? translationRef.current("workbench.selector.untitled"),
              nowIso: new Date().toISOString(),
            })
          : remoteExperimentRecordV3(remoteExperimentResource);
      setExperimentRecord(record);
      const initialTitle = record?.title
        ?? sourceBriefing?.defaultTitle
        ?? sourceSnapshot?.content.scenarios[0]?.label
        ?? translationRef.current("workbench.selector.untitled");
      setExperimentTitle(initialTitle);
      experimentTitleRef.current = initialTitle;
      setArticleLinked(
        articleAuthoringContext !== null,
      );
      const preferredScenarioId = activeScenarioIdRef.current;
      const initialScenarioId =
        preferredScenarioId !== null &&
        initialContent?.scenarios.some(
          ({ scenarioId }) => scenarioId === preferredScenarioId,
        )
          ? preferredScenarioId
          : (initialContent?.scenarios[0]?.scenarioId ??
            WORKBENCH_SCENARIO_ID_V3);
      const storedScenario = initialContent?.scenarios.find(
        ({ scenarioId }) => scenarioId === initialScenarioId,
      );
      const pendingSurface = pendingSurfaceAfterRuntimeRestartRef.current;
      const pendingFeedback = pendingFeedbackAfterRuntimeRestartRef.current;
      const candidateSurface =
        pendingSurface ??
        initialContent?.surface ??
        createDefaultExperimentSurfaceV3(
          composition.contract,
          initialScenarioId,
        );
      const baselineLabel = translationRef.current(
        "workbench.editor.scenarioManager.baselinePresetTitle",
      );
      const candidateScenarioDescriptors =
        initialContent === undefined
          ? Object.freeze([
              Object.freeze({
                scenarioId: initialScenarioId,
                label: baselineLabel,
              }),
            ])
          : Object.freeze(
              initialContent.scenarios.map((scenario) =>
                Object.freeze({
                  scenarioId: scenario.scenarioId,
                  label: scenario.label,
                }),
              ),
            );
      const nextSurface = reconcileWorkbenchSurfaceScenariosV3(
        candidateSurface,
        candidateScenarioDescriptors,
      );
      surfaceRef.current = nextSurface;
      setSurface(nextSurface);
      experimentRef.current = storedExperiment;
      setExperiment(storedExperiment);
      setSnapshotCount(0);
      scenarioDescriptorsRef.current = candidateScenarioDescriptors;
      const nextBriefing = reconcileWorkbenchBriefingV3({
        briefing: resolveWorkbenchInitialBriefingV3({
          current: briefingRef.current,
          sourceBriefing,
        }),
        preferredFocusScenarioId: initialScenarioId,
        defaultTitle: experimentTitleRef.current,
        snapshot: createWorkbenchBriefingSnapshotV3({
          defaultTitle: experimentTitleRef.current,
          modelId: composition.defaultModelId,
          scenarios: candidateScenarioDescriptors,
          surface: nextSurface,
        }),
      });
      briefingRef.current = nextBriefing;
      setBriefing(nextBriefing);
      setSaveState(
        resolveWorkbenchInitialSaveStateV3({
          hasStoredExperiment: storedExperiment !== null,
          hasPendingSurface: pendingSurface !== null,
          pendingSaveState: pendingFeedback?.saveState ?? null,
        }),
      );
      setHasUnsavedContentChanges(
        pendingSurface !== null
        || pendingFeedback?.saveState === "dirty"
        || pendingFeedback?.saveState === "error",
      );
      setHasUncommittedTitleChanges(false);
      setHasUncapturedBriefingChanges(false);
      setSaveError(pendingFeedback?.saveError ?? null);
      setSnapshotState(pendingFeedback?.snapshotState ?? "idle");
      setSnapshotPurpose(null);
      setSnapshotError(pendingFeedback?.snapshotError ?? null);
      setScenarios([]);
      setActiveScenarioId(null);
      setScenarioPresets([]);
      setScenarioOperation(null);
      setScenarioError(null);
      controlValuesByScenarioRef.current = {};
      setControlValues(
        controlValuesForFixtureV3(
          composition.contract,
          storedScenario?.capture.fixture,
        ),
      );
      setControlError(null);
      setPendingControlId(null);
      replaceAnalysisByKeyV3({});
      equivalentAnalysisSourceByScenarioRef.current.clear();
      setAnalysisHistoryByKey({});
      setPendingAnalysisKeys([]);
      setAnalysisCapturePending(false);
      setAnalysisErrorByKey({});
      exclusiveOperationRef.current = null;
      analysisCaptureTokenRef.current = null;
      presentationSampleStore.reset();

      const runtimeSeeds: readonly WorkbenchParallelScenarioSeedV3[] =
        initialContent === undefined
          ? [
              Object.freeze({
                scenarioId: initialScenarioId,
                label: baselineLabel,
                fixture: composition.defaultFixture,
              }),
            ]
          : initialContent.scenarios.map((scenario) =>
              Object.freeze({
                scenarioId: scenario.scenarioId,
                label: scenario.label,
                fixture: scenario.capture.fixture,
                checkpoint: scenario.capture.checkpoint,
              }),
            );
      runtime = new WorkbenchParallelScenarioRuntimeV3({
        expectedModelId: composition.defaultModelId,
        ...(composition.workerReleaseTicket === undefined
          ? {}
          : { releaseTicket: composition.workerReleaseTicket }),
        backgroundWorkerPool,
        resolveAnalysisExecutionPlan: composition.analysisExecutionPlan,
        onFrames: (frames) => {
          if (cancelled) return;
          appendFramesV3(
            frames,
            presentationSampleStore,
            surfaceRef.current === null
              ? undefined
              : workbenchPresentationOutputSelectionV3(
                  composition.contract,
                  surfaceRef.current,
                ),
          );
          const activeId = activeScenarioIdRef.current;
          const frame =
            activeId === null
              ? undefined
              : [...frames]
                  .reverse()
                  .find(({ scenarioId }) => scenarioId === activeId);
          if (frame === undefined) return;
          latestFrameRef.current = frame;
          if (
            shouldPublishWorkbenchRootFrameV3({
              acceptedTimeSec: frame.acceptedTimeSec,
              lastPublishedTimeSec: lastRootFrameTimeSecRef.current,
              schedulerRunning: runtime?.playing ?? false,
            })
          ) {
            lastRootFrameTimeSecRef.current = frame.acceptedTimeSec;
            setStatus((current) =>
              current.kind === "live" ? { ...current, frame } : current,
            );
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
      const descriptors = Object.freeze(
        capturedScenarios.scenarios.map(({ scenarioId, label }) =>
          Object.freeze({ scenarioId, label }),
        ),
      );
      scenarioDescriptorsRef.current = descriptors;
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
      setControlValues(
        controlValuesByScenario[capturedScenarios.activeScenarioId] ??
          controlValuesForFixtureV3(composition.contract, undefined),
      );
      const baseline = capturedScenarios.scenarios.find(
        ({ scenarioId }) => scenarioId === capturedScenarios.activeScenarioId,
      );
      setScenarioPresets(
        baseline === undefined
          ? []
          : Object.freeze([
              Object.freeze({
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
              }),
            ]),
      );
      const initial = initialState.frame;
      const initialFrames = runtimeSeeds.map(({ scenarioId }) =>
        runtime!.latestFrame(scenarioId),
      );
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
    backgroundWorkerPool,
    location.search,
    navigate,
    presentationSampleStore,
    replaceAnalysisByKeyV3,
    remoteContentRepository,
    resolvedLocale,
    runtimeGeneration,
  ]);

  React.useEffect(() => {
    if (
      initialExperimentId === null
      || experimentIdRef.current === initialExperimentId
    ) return;
    experimentIdRef.current = initialExperimentId;
    playingIntentRef.current = true;
    setIsPlaying(true);
    setStatus({ kind: "loading" });
    setRuntimeGeneration((generation) => generation + 1);
  }, [initialExperimentId]);

  React.useEffect(() => {
    const handleVisibility = () => {
      const runtime = runtimeRef.current;
      if (runtime === null) return;
      if (document.hidden) {
        void runtime.pauseAll();
      } else if (
        exclusiveOperationRef.current === null
        && playingIntentRef.current
      ) {
        runtime.playAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const graphPanes = surface?.graphPanes ?? [];
  const outputPanes = surface?.outputPanes ?? [];
  const controlPanes = surface?.controlPanes ?? [];
  const visibleScenarioIds = React.useMemo(() => {
    const hidden = new Set(hiddenScenarioIds);
    return Object.freeze(
      scenarios
        .map(({ scenarioId }) => scenarioId)
        .filter((scenarioId) => !hidden.has(scenarioId)),
    );
  }, [hiddenScenarioIds, scenarios]);
  React.useEffect(() => {
    const available = new Set(scenarios.map(({ scenarioId }) => scenarioId));
    setHiddenScenarioIds((current) => {
      const next = current.filter((scenarioId) => available.has(scenarioId));
      return next.length === current.length ? current : Object.freeze(next);
    });
  }, [scenarios]);
  const toggleScenarioVisibilityV3 = React.useCallback((scenarioId: string) => {
    setHiddenScenarioIds((current) =>
      current.includes(scenarioId)
        ? Object.freeze(current.filter((candidate) => candidate !== scenarioId))
        : Object.freeze([...current, scenarioId]),
    );
  }, []);
  const markExperimentDirtyV3 = React.useCallback(() => {
    setSaveState("dirty");
    setHasUnsavedContentChanges(true);
    setSaveError(null);
    // A Surface mutation may arrive while the frozen Snapshot candidate is
    // qualifying. Preserve that operation's visible status; the edit remains
    // dirty and belongs only to the continuing Session.
    if (exclusiveOperationRef.current !== "snapshot") {
      setSnapshotState("idle");
      setSnapshotPurpose(null);
      setSnapshotError(null);
    }
  }, []);
  const updateSurface = React.useCallback(
    (update: (current: ExperimentSurfaceV2) => ExperimentSurfaceV2) => {
      const current = surfaceRef.current;
      if (current === null) return;
      const next = update(current);
      if (next === current) return;
      surfaceRef.current = next;
      surfaceMutationRevisionRef.current += 1;
      setSurface(next);
      const durableOperation = exclusiveOperationRef.current;
      if (durableOperation !== "save") {
        markExperimentDirtyV3();
      }
    },
    [markExperimentDirtyV3],
  );

  const openPaneSettings = React.useCallback(
    (paneId: string, section?: "binding") => {
      if (graphPanes.some((pane) => pane.paneId === paneId)) {
        setPaneSettings({ kind: "graph", paneId });
        return;
      }
      if (outputPanes.some((pane) => pane.paneId === paneId)) {
        setPaneSettings({ kind: "output", paneId, section });
        return;
      }
      if (controlPanes.some((pane) => pane.paneId === paneId)) {
        setPaneSettings({ kind: "control", paneId, section });
      }
    },
    [controlPanes, graphPanes, outputPanes],
  );

  const addPaneToRoleArea = React.useCallback(
    (
      kind: WorkbenchPaneSettingsV3["kind"],
      graphOptionId?: string,
    ): string | undefined => {
      const currentSurface = surfaceRef.current;
      if (currentSurface === null || contract === null) return undefined;
      const graphOption =
        kind === "graph"
          ? WORKBENCH_GRAPH_PANE_OPTIONS_V3.find(
              ({ optionId }) => optionId === graphOptionId,
            )
          : undefined;
      const result = addWorkbenchSurfacePaneV3(
        currentSurface,
        kind,
        contract,
        graphOption?.graphId ?? graphOptionId,
        graphOption !== undefined && "structuralSide" in graphOption
          ? graphOption.structuralSide
          : undefined,
      );
      if (result.selectedPane === null || result.surface === surface) {
        return undefined;
      }
      updateSurface(() =>
        reconcileWorkbenchGraphColorsV3(result.surface, scenarios),
      );
      return result.selectedPane.paneId;
    },
    [contract, scenarios, updateSurface],
  );

  const renamePaneV3 = React.useCallback(
    (paneId: string, title: string) => {
      const current = surfaceRef.current;
      if (current === null) return;
      const identity = workbenchPaneIdentityForIdV3(current, paneId);
      if (identity === null) return;
      updateSurface((candidate) =>
        updateWorkbenchSurfacePaneV3(candidate, identity, (pane) => ({
          ...pane,
          label: title,
        })),
      );
    },
    [updateSurface],
  );

  const deletePaneV3 = React.useCallback(
    (paneId: string) => {
      const current = surfaceRef.current;
      if (current === null) return;
      const identity = workbenchPaneIdentityForIdV3(current, paneId);
      if (identity === null) return;
      updateSurface(
        (candidate) =>
          deleteWorkbenchSurfacePaneV3(candidate, identity).surface,
      );
      setPaneSettings((selected) =>
        selected?.paneId === paneId ? null : selected,
      );
    },
    [updateSurface],
  );

  const splitPaneV3 = React.useCallback(
    (
      paneId: string,
      _direction: WorkbenchPaneSplitDirectionV3,
    ): string | undefined => {
      const current = surfaceRef.current;
      if (current === null) return undefined;
      const identity = workbenchPaneIdentityForIdV3(current, paneId);
      if (identity === null) return undefined;
      const result = duplicateWorkbenchSurfacePaneV3(current, identity);
      if (result.paneId === null || result.surface === current)
        return undefined;
      updateSurface(() => result.surface);
      return result.paneId;
    },
    [updateSurface],
  );

  const compareOutputPaneByScenarioV3 = React.useCallback(
    (paneId: string): string | undefined => {
      const current = surfaceRef.current;
      if (current === null || scenarios.length < 2) return undefined;
      const result = compareWorkbenchOutputPaneByScenarioV3(current, {
        paneId,
        activeScenarioId: activeScenarioIdRef.current,
        scenarios,
      });
      if (result.paneId === null || result.surface === current)
        return undefined;
      updateSurface(() => result.surface);
      return result.paneId;
    },
    [scenarios, updateSurface],
  );

  const togglePlayback = React.useCallback(() => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    if (
      runtime === null ||
      frame === null ||
      exclusiveOperationRef.current !== null
    )
      return;
    if (playingIntentRef.current) {
      playingIntentRef.current = false;
      setIsPlaying(false);
      void runtime.pauseAll().then(() => {
        const latest = latestFrameRef.current;
        if (latest === null) return;
        lastRootFrameTimeSecRef.current = latest.acceptedTimeSec;
        setStatus((current) =>
          current.kind === "live" ? { ...current, frame: latest } : current,
        );
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
    navigate(newExperimentHref(isLocale(locale) ? locale : undefined));
  }, [locale, navigate]);

  const applyControl = React.useCallback(
    async (
      scenarioIds: readonly string[],
      controlId: string,
      value: number,
    ): Promise<boolean> => {
      const runtime = runtimeRef.current;
      const frame = latestFrameRef.current;
      if (
        runtime === null ||
        frame === null ||
        scenarioIds.length === 0 ||
        exclusiveOperationRef.current !== null
      )
        return false;
      exclusiveOperationRef.current = "control";
      setPendingControlId(controlId);
      setControlError(null);
      try {
        await runtime.pauseAll();
        const uniqueScenarioIds = [...new Set(scenarioIds)];
        const acceptedFrames = uniqueScenarioIds.map((scenarioId) =>
          runtime.latestFrame(scenarioId));
        const structuralAnalysisIds = new Set(
          workbenchStructuralHistoryAnalysisIdsV3(surfaceRef.current, contract),
        );
        // History is visual comparison context, not a qualification result.
        // Preserve the latest curve that was actually renderable for the old
        // input epoch, including an accepted progressive preview. Requiring a
        // fully exhausted adaptive sweep here makes the curve disappear on
        // slower clients even though it was visible immediately before the
        // control change. Recomputing a full sweep would also hold every live
        // Scenario for tens of seconds before the slider visibly moved.
        const analysesToArchive = Object.freeze(
          Object.values(analysisByKeyRef.current).filter(
            (analysis) => {
              const acceptedFrame = acceptedFrames.find(({ scenarioId }) =>
                scenarioId === analysis.scenarioId);
              return acceptedFrame !== undefined &&
                structuralAnalysisIds.has(analysis.analysisId) &&
                analysis.inputEpoch === acceptedFrame.inputEpoch &&
                workbenchStructuralAnalysisRenderableV3(analysis);
            },
          ),
        );
        const nextFrames = await Promise.all(acceptedFrames.map(
          (acceptedFrame) => runtime.applyControl({
            scenarioId: acceptedFrame.scenarioId,
            controlId,
            value,
            expectedInputEpoch: acceptedFrame.inputEpoch,
          }),
        ));
        const activeId = activeScenarioIdRef.current;
        const nextRootFrame = activeId === null
          ? nextFrames[0]!
          : runtime.latestFrame(activeId);
        latestFrameRef.current = nextRootFrame;
        lastRootFrameTimeSecRef.current = nextRootFrame.acceptedTimeSec;
        if (analysesToArchive.length > 0) {
          setAnalysisHistoryByKey((current) =>
            archiveWorkbenchAnalysesV3(current, analysesToArchive),
          );
        }
        const targetScenarioIds = new Set(uniqueScenarioIds);
        invalidateWorkbenchScenarioAnalysisEquivalenceV3(
          equivalentAnalysisSourceByScenarioRef.current,
          targetScenarioIds,
        );
        replaceAnalysisByKeyV3(filterWorkbenchAnalysesByScenarioIdsV3(
          analysisByKeyRef.current,
          new Set(scenarios
            .map(({ scenarioId }) => scenarioId)
            .filter((scenarioId) => !targetScenarioIds.has(scenarioId))),
        ));
        setAnalysisErrorByKey((current) =>
          filterWorkbenchAnalysisErrorsByScenarioIdsV3(
            current,
            new Set(scenarios
              .map(({ scenarioId }) => scenarioId)
              .filter((scenarioId) => !targetScenarioIds.has(scenarioId))),
          ),
        );
        appendFramesV3(nextFrames, presentationSampleStore);
        setStatus((current) =>
          current.kind === "live"
            ? { ...current, frame: nextRootFrame }
            : current,
        );
        controlValuesByScenarioRef.current = Object.freeze({
          ...controlValuesByScenarioRef.current,
          ...Object.fromEntries(uniqueScenarioIds.map((scenarioId) => [
            scenarioId,
            Object.freeze({
              ...(controlValuesByScenarioRef.current[scenarioId] ?? {}),
              [controlId]: value,
            }),
          ])),
        });
        if (activeId !== null) {
          setControlValues(
            controlValuesByScenarioRef.current[activeId] ?? {},
          );
        }
        markExperimentDirtyV3();
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
    },
    [
      contract,
      markExperimentDirtyV3,
      presentationSampleStore,
      replaceAnalysisByKeyV3,
      scenarios,
    ],
  );

  const requestAnalysis = React.useCallback(
    (analysisId: string, requestedScenarioIds: readonly string[]): boolean => {
      const runtime = runtimeRef.current;
      const availableScenarioIds = new Set(
        scenarioDescriptorsRef.current.map(({ scenarioId }) => scenarioId),
      );
      const scenarioIds = Object.freeze(
        [...new Set(requestedScenarioIds)].filter((scenarioId) =>
          availableScenarioIds.has(scenarioId),
        ),
      );
      if (
        runtime === null ||
        scenarioIds.length === 0 ||
        exclusiveOperationRef.current !== null
      )
        return false;
      const captureToken = Symbol("structural-analysis-capture");
      analysisCaptureTokenRef.current = captureToken;
      exclusiveOperationRef.current = "analysis";
      setAnalysisCapturePending(true);
      const pendingKeys = Object.freeze(
        scenarioIds.map((scenarioId) =>
          workbenchAnalysisHistoryKeyV3(scenarioId, analysisId),
        ),
      );
      const pendingKeySet = new Set(pendingKeys);
      setPendingAnalysisKeys((current) =>
        Object.freeze([...new Set([...current, ...pendingKeys])]),
      );
      setAnalysisErrorByKey((current) =>
        withoutRecordKeysV3(current, pendingKeys),
      );
      void (async () => {
        let releasedLaneCount = 0;
        const releaseCaptureLock = () => {
          releasedLaneCount += 1;
          if (
            releasedLaneCount >= scenarioIds.length &&
            analysisCaptureTokenRef.current === captureToken
          ) {
            analysisCaptureTokenRef.current = null;
            if (exclusiveOperationRef.current === "analysis") {
              exclusiveOperationRef.current = null;
            }
            setAnalysisCapturePending(false);
          }
        };
        const forceReleaseCaptureLock = () => {
          if (analysisCaptureTokenRef.current !== captureToken) return;
          analysisCaptureTokenRef.current = null;
          if (exclusiveOperationRef.current === "analysis") {
            exclusiveOperationRef.current = null;
          }
          setAnalysisCapturePending(false);
        };
        try {
          const acceptedFrames = await Promise.all(
            scenarioIds.map((scenarioId) => runtime.pauseScenario(scenarioId)),
          );
          const activeId = activeScenarioIdRef.current;
          const activeFrame = acceptedFrames.find(
            ({ scenarioId }) => scenarioId === activeId,
          );
          if (activeFrame !== undefined) {
            latestFrameRef.current = activeFrame;
            lastRootFrameTimeSecRef.current = activeFrame.acceptedTimeSec;
            setStatus((current) =>
              current.kind === "live"
                ? { ...current, frame: activeFrame }
                : current,
            );
          }
          await Promise.all(
            acceptedFrames.map(async (acceptedFrame) => {
              const key = workbenchAnalysisHistoryKeyV3(
                acceptedFrame.scenarioId,
                analysisId,
              );
              let liveLaneReleased = false;
              const markLiveLaneReleased = () => {
                if (liveLaneReleased) return;
                liveLaneReleased = true;
                releaseCaptureLock();
              };
              try {
                const analysis = await runtime.requestAnalysis({
                  scenarioId: acceptedFrame.scenarioId,
                  analysisId,
                  expectedInputEpoch: acceptedFrame.inputEpoch,
                  expectedAcceptedRevision: acceptedFrame.acceptedRevision,
                  expectedAcceptedTimeSec: acceptedFrame.acceptedTimeSec,
                  onProgress: queueAnalysisProgressV3,
                  onLiveLaneReleased: markLiveLaneReleased,
                });
                commitAnalysisV3(analysis);
              } catch (error) {
                let currentFrame: StudioSimulationFrameV2 | null = null;
                try {
                  currentFrame = runtime.latestFrame(acceptedFrame.scenarioId);
                } catch {
                  // A deleted Scenario has no recoverable analysis error surface.
                }
                if (
                  currentFrame !== null &&
                  currentFrame.inputEpoch === acceptedFrame.inputEpoch
                ) {
                  setAnalysisErrorByKey((current) =>
                    Object.freeze({
                      ...current,
                      [key]:
                        error instanceof Error ? error.message : String(error),
                    }),
                  );
                }
              } finally {
                markLiveLaneReleased();
              }
            }),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          setAnalysisErrorByKey((current) =>
            Object.freeze({
              ...current,
              ...Object.fromEntries(pendingKeys.map((key) => [key, message])),
            }),
          );
        } finally {
          if (
            analysisCaptureTokenRef.current === captureToken &&
            playingIntentRef.current &&
            !document.hidden
          ) {
            scenarioIds.forEach((scenarioId) => {
              try {
                runtime.resumeScenario(scenarioId);
              } catch {
                // The Scenario may have been deleted after its analysis forked.
              }
            });
          }
          forceReleaseCaptureLock();
          setPendingAnalysisKeys((current) =>
            Object.freeze(current.filter((key) => !pendingKeySet.has(key))),
          );
        }
      })();
      return true;
    },
    [commitAnalysisV3, queueAnalysisProgressV3],
  );

  const adoptScenarioStateV3 = React.useCallback(
    (next: StudioSimulationWorkerScenarioStateV2) => {
      scenarioDescriptorsRef.current = next.scenarios;
      activeScenarioIdRef.current = next.activeScenarioId;
      setActiveScenarioId(next.activeScenarioId);
      setScenarios(next.scenarios);
      latestFrameRef.current = next.frame;
      lastRootFrameTimeSecRef.current = next.frame.acceptedTimeSec;
      appendFramesV3([next.frame], presentationSampleStore);
      const retainedScenarioIds = new Set(
        next.scenarios.map(({ scenarioId }) => scenarioId),
      );
      for (const [targetScenarioId, sourceScenarioId] of
        equivalentAnalysisSourceByScenarioRef.current) {
        if (
          !retainedScenarioIds.has(targetScenarioId)
          || !retainedScenarioIds.has(sourceScenarioId)
        ) equivalentAnalysisSourceByScenarioRef.current.delete(targetScenarioId);
      }
      replaceAnalysisByKeyV3(
        filterWorkbenchAnalysesByScenarioIdsV3(
          analysisByKeyRef.current,
          retainedScenarioIds,
        ),
      );
      setAnalysisErrorByKey((current) =>
        filterWorkbenchAnalysisErrorsByScenarioIdsV3(
          current,
          retainedScenarioIds,
        ),
      );
      setAnalysisHistoryByKey((current) =>
        filterWorkbenchAnalysisHistoryByScenarioIdsV3(
          current,
          retainedScenarioIds,
        ),
      );
      setControlError(null);
      setControlValues(
        controlValuesByScenarioRef.current[next.activeScenarioId] ??
          (contract === null
            ? {}
            : controlValuesForFixtureV3(contract, undefined)),
      );
      setStatus((current) =>
        current.kind === "live" ? { ...current, frame: next.frame } : current,
      );
    },
    [
      contract,
      presentationSampleStore,
      replaceAnalysisByKeyV3,
    ],
  );

  const runScenarioOperationV3 = React.useCallback(
    async (
      kind: WorkbenchScenarioOperationV3,
      operation: (
        runtime: WorkbenchParallelScenarioRuntimeV3,
      ) =>
        | Promise<StudioSimulationWorkerScenarioStateV2>
        | StudioSimulationWorkerScenarioStateV2,
      beforeAdopt?: (state: StudioSimulationWorkerScenarioStateV2) => void,
    ): Promise<boolean> => {
      const runtime = runtimeRef.current;
      const frame = latestFrameRef.current;
      if (
        runtime === null ||
        frame === null ||
        exclusiveOperationRef.current !== null
      )
        return false;
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
        setScenarioError(
          error instanceof Error ? error.message : String(error),
        );
        return false;
      } finally {
        exclusiveOperationRef.current = null;
        setScenarioOperation(null);
        const latest = latestFrameRef.current;
        if (playingIntentRef.current && !document.hidden && latest !== null) {
          runtime.playAll();
        }
      }
    },
    [adoptScenarioStateV3],
  );

  const selectScenarioV3 = React.useCallback(
    (scenarioId: string) => {
      if (scenarioId === activeScenarioIdRef.current) return;
      void runScenarioOperationV3("select", (runtime) =>
        runtime.selectScenario(scenarioId),
      );
    },
    [runScenarioOperationV3],
  );

  const addScenarioFromPresetV3 = React.useCallback(
    (intent: WorkbenchScenarioAddIntentV3) => {
      void runScenarioOperationV3(
        "add",
        (runtime) =>
          runtime.addScenario({
            scenarioId: intent.scenarioId,
            label: intent.label,
            fixture: intent.preset.capture.fixture,
            checkpoint: intent.preset.capture.checkpoint,
          }),
        (next) => {
          updateSurface((current) =>
            reconcileWorkbenchSurfaceScenariosV3(current, next.scenarios),
          );
          if (contract !== null) {
            controlValuesByScenarioRef.current = {
              ...controlValuesByScenarioRef.current,
              [intent.scenarioId]: controlValuesForFixtureV3(
                contract,
                intent.preset.capture.fixture,
              ),
            };
          }
          markExperimentDirtyV3();
        },
      );
    },
    [contract, markExperimentDirtyV3, runScenarioOperationV3, updateSurface],
  );

  const duplicateScenarioV3 = React.useCallback(
    (intent: WorkbenchScenarioDuplicateIntentV3) => {
      const sourceValues =
        controlValuesByScenarioRef.current[intent.sourceScenarioId];
      void runScenarioOperationV3(
        "duplicate",
        (runtime) =>
          runtime.duplicateScenario({
            sourceScenarioId: intent.sourceScenarioId,
            scenarioId: intent.scenarioId,
            label: intent.label,
          }),
        (next) => {
          updateSurface((current) =>
            reconcileWorkbenchSurfaceScenariosV3(current, next.scenarios),
          );
          // A duplicate has the same exact fixture + checkpoint and therefore
          // the same model-owned structural result at creation time. Reuse the
          // immutable analysis payload under the duplicate lane identity. A
          // later parameter edit archives this result as visible history while
          // the changed target is recomputed, instead of forcing low-core
          // devices to serialize an identical analysis before first paint.
          replaceAnalysisByKeyV3(cloneWorkbenchScenarioAnalysesV3(
            analysisByKeyRef.current,
            intent.sourceScenarioId,
            next.frame,
          ));
          const sourceScenarioId =
            equivalentAnalysisSourceByScenarioRef.current.get(
              intent.sourceScenarioId,
            ) ?? intent.sourceScenarioId;
          equivalentAnalysisSourceByScenarioRef.current.set(
            intent.scenarioId,
            sourceScenarioId,
          );
          if (sourceValues !== undefined) {
            controlValuesByScenarioRef.current = {
              ...controlValuesByScenarioRef.current,
              [intent.scenarioId]: cloneWorkbenchControlValuesV3(sourceValues),
            };
          }
          presentationSampleStore.cloneScenario(
            intent.sourceScenarioId,
            intent.scenarioId,
          );
          markExperimentDirtyV3();
        },
      );
    },
    [
      markExperimentDirtyV3,
      presentationSampleStore,
      replaceAnalysisByKeyV3,
      runScenarioOperationV3,
      updateSurface,
    ],
  );

  const renameScenarioV3 = React.useCallback(
    (intent: WorkbenchScenarioRenameIntentV3) => {
      void runScenarioOperationV3(
        "rename",
        (runtime) =>
          runtime.renameScenario({
            scenarioId: intent.scenarioId,
            label: intent.label,
          }),
        () => {
          markExperimentDirtyV3();
        },
      );
    },
    [markExperimentDirtyV3, runScenarioOperationV3],
  );

  const deleteScenarioV3 = React.useCallback(
    (intent: WorkbenchScenarioDeleteIntentV3) => {
      void runScenarioOperationV3(
        "delete",
        (runtime) => runtime.deleteScenario(intent.scenarioId),
        (next) => {
          updateSurface((current) =>
            reconcileWorkbenchSurfaceScenariosV3(current, next.scenarios),
          );
          const { [intent.scenarioId]: _deleted, ...retained } =
            controlValuesByScenarioRef.current;
          controlValuesByScenarioRef.current = retained;
          presentationSampleStore.removeScenario(intent.scenarioId);
          setAnalysisHistoryByKey((current) =>
            withoutWorkbenchScenarioAnalysisHistoryV3(
              current,
              intent.scenarioId,
            ),
          );
          markExperimentDirtyV3();
        },
      );
    },
    [
      markExperimentDirtyV3,
      presentationSampleStore,
      runScenarioOperationV3,
      updateSurface,
    ],
  );

  const saveExperimentV3 = React.useCallback(async () => {
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    const contentStore = contentStoreRef.current;
    if (
      runtime === null ||
      frame === null ||
      surface === null ||
      (remoteContentRepository === null && contentStore === null) ||
      backgroundWorkerPool === null ||
      exclusiveOperationRef.current !== null
    )
      return;
    const currentSurface = surfaceRef.current;
    if (currentSurface === null) return;
    const submittedSurface = reconcileWorkbenchSurfaceScenariosV3(
      currentSurface,
      scenarioDescriptorsRef.current,
    );
    const submittedSurfaceMutationRevision = surfaceMutationRevisionRef.current;
    const submittedTitle = experimentTitle.trim()
      || t("workbench.selector.untitled");
    exclusiveOperationRef.current = "save";
    setSaveState("saving");
    setSaveError(null);
    try {
      await runtime.pauseAll();
      let captures: StudioSimulationWorkerScenarioCapturesV2;
      try {
        captures = await runtime.captureScenarios();
      } finally {
        if (playingIntentRef.current && !document.hidden) runtime.playAll();
      }
      const currentExperiment = experimentRef.current;
      const submittedCandidateContent = {
        modelId: frame.modelId,
        scenarios: captures.scenarios,
        surface: submittedSurface,
      };
      const currentExperimentId = experimentIdRef.current;
      let saved: ExperimentV2;
      let remoteSavedResource: StudioRemoteExperimentResourceV1 | null = null;
      if (remoteContentRepository !== null) {
        saved = await remoteContentRepository.saveExperiment({
          experimentId: currentExperiment?.experimentId
            ?? currentExperimentId,
          expectedVersion: currentExperiment?.version ?? null,
          title: submittedTitle,
          content: submittedCandidateContent,
        });
        remoteSavedResource = await remoteContentRepository.readMyExperiment(
          saved.experimentId,
        );
        if (remoteSavedResource === null) {
          throw new Error("Saved Experiment could not be read back");
        }
      } else {
        const targetExperimentId = currentExperiment?.experimentId
          ?? currentExperimentId
          ?? allocateOpaqueExperimentIdV3([
            ...contentStore!.listExperiments().map(({ experimentId }) =>
              experimentId),
            ...experimentIndex.list().map(({ experimentId }) => experimentId),
          ]);
        const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
          undefined,
          backgroundWorkerPool,
        );
        const assembled = await coordinator.saveExperiment({
          modelId: frame.modelId,
          ...(workerReleaseTicketRef.current === undefined
            ? {}
            : { releaseTicket: workerReleaseTicketRef.current }),
          scenarios: captures.scenarios,
          activeScenarioId: captures.activeScenarioId,
          experiment: currentExperiment,
          experimentId: targetExperimentId,
          surface: submittedSurface,
          runtimeSessionId: `workbench-authoring-${randomPortableTokenV3()}`,
        });
        saved = contentStore!.saveExperiment(
          assembled,
          submittedCandidateContent,
        );
      }
      const targetExperimentId = saved.experimentId;
      // The authoring Worker is transient and already terminated. Persistence
      // failure therefore leaves the independent live lane pool untouched so
      // the user can retry without losing unsaved exact Scenario state.
      commitWorkbenchTransientAuthoringResultV3({
        persist: () => saved,
        adoptDurable: (durableExperiment) => {
          const surfaceResolution = resolveWorkbenchSurfaceAfterCommitV3({
            currentMutationRevision: surfaceMutationRevisionRef.current,
            currentSurface: surfaceRef.current,
            durableSurface: durableExperiment.content.surface,
            submittedMutationRevision: submittedSurfaceMutationRevision,
          });
          experimentRef.current = durableExperiment;
          setExperiment(durableExperiment);
          const nowIso = new Date().toISOString();
          const existingRecord = experimentRecord?.experimentId
            === targetExperimentId
            ? experimentRecord
            : null;
          const touchedRecord = remoteContentRepository === null
            ? existingRecord === null
              ? experimentIndex.ensure({
                  experimentId: targetExperimentId,
                  title: submittedTitle,
                  nowIso,
                })
              : experimentIndex.rename({
                  experimentId: targetExperimentId,
                  title: submittedTitle,
                  nowIso,
                })
            : remoteExperimentRecordV3(remoteSavedResource!);
          const isFirstSave = experimentIdRef.current === null;
          experimentIdRef.current = targetExperimentId;
          setExperimentRecord(touchedRecord);
          surfaceRef.current = surfaceResolution.surface;
          setSurface(surfaceResolution.surface);
          setScenarios(
            Object.freeze(
              durableExperiment.content.scenarios.map(({ scenarioId, label }) =>
                Object.freeze({ scenarioId, label }),
              ),
            ),
          );
          if (contract !== null) {
            controlValuesByScenarioRef.current = Object.fromEntries(
              durableExperiment.content.scenarios.map((scenario) => [
                scenario.scenarioId,
                controlValuesForFixtureV3(contract, scenario.capture.fixture),
              ]),
            );
            const activeId = activeScenarioIdRef.current;
            if (activeId !== null) {
              setControlValues(
                controlValuesByScenarioRef.current[activeId] ??
                  controlValuesForFixtureV3(contract, undefined),
              );
            }
          }
          setSaveState(surfaceResolution.hasNewerMutations ? "dirty" : "clean");
          setHasUnsavedContentChanges(surfaceResolution.hasNewerMutations);
          setHasUncommittedTitleChanges(
            (experimentTitleRef.current.trim()
              || t("workbench.selector.untitled")) !== touchedRecord.title,
          );
          setSnapshotState("idle");
          setSnapshotPurpose(null);
          if (isFirstSave) {
            navigate(`${experimentDetailHref({
              experimentId: targetExperimentId,
              locale: resolvedLocale,
            })}${location.search}`, { replace: true });
          }
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Never adopt another tab's newer version as an implicit retry base:
      // doing so would let a second Save overwrite that tab without an
      // explicit conflict decision. Keep this Session dirty and fail closed;
      // reload or a future backend conflict UI is the recovery boundary.
      setSaveError(message);
      setSaveState("error");
      setHasUnsavedContentChanges(true);
    } finally {
      exclusiveOperationRef.current = null;
      const latest = latestFrameRef.current;
      if (playingIntentRef.current && !document.hidden && latest !== null) {
        runtime.playAll();
      }
    }
  }, [
    backgroundWorkerPool,
    contract,
    experimentIndex,
    experimentRecord,
    experimentTitle,
    location.search,
    navigate,
    remoteContentRepository,
    resolvedLocale,
    surface,
    t,
  ]);

  const createSnapshotV3 = React.useCallback(async (
    options:
      | Readonly<{ kind: "publication" }>
      | Readonly<{
          kind: "article";
          sourceSnapshot: ExperimentSnapshotV2;
          sourceSurfaceMutationRevision: number;
          sourceBriefingMutationRevision: number;
        }>,
  ): Promise<ExperimentSnapshotV2 | null> => {
    setSnapshotPurpose(null);
    if (
      options.kind === "publication"
      && remoteContentRepository !== null
      && authIdentity.kind !== "account"
    ) {
      setSnapshotError(t("workbench.editor.publishRequiresLinkedAccount"));
      setSnapshotState("error");
      return null;
    }
    if (
      options.kind === "publication"
      && (experimentRef.current === null || saveState !== "clean")
    ) {
      setSnapshotError(t(
        experimentRef.current === null
          ? "workbench.editor.publishRequiresSave"
          : "workbench.editor.publishRequiresClean",
      ));
      setSnapshotState("error");
      return null;
    }
    const runtime = runtimeRef.current;
    const frame = latestFrameRef.current;
    const contentStore = contentStoreRef.current;
    const submittedSurface = options.kind === "article"
      ? options.sourceSnapshot.content.surface
      : surfaceRef.current;
    const publicationExperiment = options.kind === "publication"
      ? experimentRef.current
      : null;
    if (
      options.kind === "article"
      && surfaceMutationRevisionRef.current
        !== options.sourceSurfaceMutationRevision
    ) {
      setSnapshotError(t("workbench.editor.briefingSourceChanged"));
      setSnapshotState("error");
      return null;
    }
    if (
      runtime === null ||
      frame === null ||
      submittedSurface === null ||
      (remoteContentRepository === null && contentStore === null) ||
      backgroundWorkerPool === null
    ) {
      setSnapshotError(t("workbench.editor.snapshotNotReady"));
      setSnapshotState("error");
      return null;
    }
    if (exclusiveOperationRef.current !== null) {
      setSnapshotError(t("workbench.editor.snapshotBusy"));
      setSnapshotState("error");
      return null;
    }
    exclusiveOperationRef.current = "snapshot";
    setSnapshotPurpose(options.kind);
    setSnapshotState("creating");
    setSnapshotError(null);
    try {
      await runtime.pauseAll();
      let captures: StudioSimulationWorkerScenarioCapturesV2;
      try {
        captures = await runtime.captureScenarios();
      } finally {
        // The exact fixture + checkpoint tuple is now owned by the background
        // job. Resume every live lane before bounded admission so Snapshot
        // creation never freezes the visible simulation for that work.
        if (playingIntentRef.current && !document.hidden) runtime.playAll();
      }
      // Freeze authored intent at the click boundary, then opportunistically
      // reuse an exact cycle-boundary candidate already produced for the same
      // input epoch. Candidate convergence is never awaited here: the exact
      // click capture is the fallback and common Snapshot admission remains
      // the safety authority before persistence.
      captures = runtime.selectBestAvailableScenarioCaptures(captures);
      if (
        options.kind === "article"
        && !workbenchBriefingSourceScenariosMatchV3(
          options.sourceSnapshot,
          captures.scenarios,
        )
      ) {
        throw new Error(t("workbench.editor.briefingSourceChanged"));
      }
      const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
        undefined,
        backgroundWorkerPool,
      );
      const authoringInput = {
        modelId: frame.modelId,
        ...(workerReleaseTicketRef.current === undefined
          ? {}
          : { releaseTicket: workerReleaseTicketRef.current }),
        scenarios: captures.scenarios,
        activeScenarioId: captures.activeScenarioId,
        surface: submittedSurface,
        experiment: publicationExperiment,
        experimentId: publicationExperiment?.experimentId ?? null,
        runtimeSessionId: `workbench-admission-${randomPortableTokenV3()}`,
      };
      const created = options.kind === "article"
        ? await coordinator.createSnapshot({
            ...authoringInput,
            snapshotSource: "session",
          })
        : await coordinator.createSnapshot({
            ...authoringInput,
            snapshotSource: "saved-experiment",
          });
      if (
        options.kind === "article"
        && surfaceMutationRevisionRef.current
          !== options.sourceSurfaceMutationRevision
      ) {
        throw new Error(t("workbench.editor.briefingSourceChanged"));
      }
      if (
        options.kind === "article"
        && briefingMutationRevisionRef.current
          !== options.sourceBriefingMutationRevision
      ) {
        throw new Error(t("workbench.editor.briefingChangedDuringSnapshot"));
      }
      const persistedSnapshot = remoteContentRepository === null
        ? contentStore!.saveSnapshotCommit(
            created,
            {
              modelId: authoringInput.modelId,
              scenarios: authoringInput.scenarios,
              surface: authoringInput.surface,
            },
            options.kind === "publication" && publicationExperiment !== null
              ? {
                  experimentId: publicationExperiment.experimentId,
                  expectedVersion: publicationExperiment.version,
                }
              : undefined,
          ).snapshot
        : await remoteContentRepository.commitSnapshot({
            admitted: created,
            ...(options.kind === "publication" && publicationExperiment !== null
              ? {
                  sourceExperiment: {
                    experimentId: publicationExperiment.experimentId,
                    expectedVersion: publicationExperiment.version,
                  },
                }
              : {}),
          });
      if (options.kind === "publication" && experimentRef.current !== null) {
        if (remoteContentRepository !== null) {
          await remoteContentRepository.publishExperiment({
            experimentId: experimentRef.current.experimentId,
            expectedVersion: experimentRef.current.version,
            snapshotId: persistedSnapshot.snapshotId,
            publicSlug: publicExperimentSlugV3(
              experimentRef.current.experimentId,
            ),
          });
        }
        const nowIso = new Date().toISOString();
        const remotePublishedResource = remoteContentRepository === null
          ? null
          : await remoteContentRepository.readMyExperiment(
              experimentRef.current.experimentId,
            );
        if (
          remoteContentRepository !== null
          && remotePublishedResource === null
        ) {
          throw new Error("Published Experiment could not be read back");
        }
        const nextRecord = remoteContentRepository === null
          ? experimentIndex.publish({
              experimentId: experimentRef.current.experimentId,
              snapshotId: persistedSnapshot.snapshotId,
              nowIso,
            })
          : remoteExperimentRecordV3(remotePublishedResource!);
        setExperimentRecord(nextRecord);
      }
      setSnapshotCount((count) => count + 1);
      setSnapshotState("created");
      return persistedSnapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSnapshotError(message);
      setSnapshotState("error");
      return null;
    } finally {
      exclusiveOperationRef.current = null;
      const latest = latestFrameRef.current;
      if (
        playingIntentRef.current &&
        !document.hidden &&
        latest !== null
      ) {
        runtime.playAll();
      }
    }
  }, [
    authIdentity.kind,
    backgroundWorkerPool,
    experimentIndex,
    experimentRecord,
    remoteContentRepository,
    saveState,
    t,
  ]);

  const createArticleSnapshotV3 = React.useCallback(async () => {
    const currentBriefing = briefingRef.current;
    const sourceSnapshot = briefingCaptureSnapshot;
    const sourceSurfaceMutationRevision =
      briefingCaptureSurfaceMutationRevision;
    if (
      currentBriefing === null
      || sourceSnapshot === null
      || sourceSurfaceMutationRevision === null
    ) return;
    const snapshot = await createSnapshotV3({
      kind: "article",
      sourceSnapshot,
      sourceSurfaceMutationRevision,
      sourceBriefingMutationRevision: briefingMutationRevisionRef.current,
    });
    if (snapshot !== null) {
      setHasUncapturedBriefingChanges(false);
    }
    if (
      snapshot === null
      || articleAuthoringContext === null
    ) return;
    const completed = articleExperimentHandoff.complete({
      sessionToken,
      snapshotId: snapshot.snapshotId,
      briefing: currentBriefing,
    });
    if (completed === null) return;
    // Returning to the Article completes only the single-use handoff. The
    // neutral Snapshot exists independently; saving the Article persists its
    // Placement-owned Briefing even when this Session was never an Experiment.
    setHasUnsavedContentChanges(false);
    setHasUncommittedTitleChanges(false);
    setHasUncapturedBriefingChanges(false);
    navigate(articleEditorHref({
      articleId: completed.articleId,
      locale: resolvedLocale,
    }));
  }, [
    articleAuthoringContext,
    articleExperimentHandoff,
    briefingCaptureSnapshot,
    briefingCaptureSurfaceMutationRevision,
    createSnapshotV3,
    navigate,
    resolvedLocale,
    sessionToken,
  ]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveExperimentV3();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveExperimentV3]);

  const discardArticleHandoffV3 = React.useCallback(() => {
    if (articleAuthoringContext !== null) articleExperimentHandoff.clear();
    if (experimentSessionContext !== null) experimentSessionHandoff.clear();
  }, [
    articleAuthoringContext,
    articleExperimentHandoff,
    experimentSessionContext,
    experimentSessionHandoff,
  ]);
  useUnsavedChangesGuardV3({
    enabled: shouldConfirmWorkbenchDiscardV3({
      hasUnsavedContentChanges,
      hasUncommittedTitleChanges,
      hasUncapturedBriefingChanges,
    }),
    message: t("common.unsavedChanges"),
    onConfirmedDiscard: discardArticleHandoffV3,
  });

  const latestFrame = status.kind === "live" ? status.frame : null;
  const rootRuntimeData =
    status.kind === "live"
      ? {
          "data-accepted-revision": status.frame.acceptedRevision,
          "data-input-epoch": status.frame.inputEpoch,
          "data-model-id": status.frame.modelId,
          "data-model-time-sec": status.frame.acceptedTimeSec,
        }
      : {};
  const runtimeOperationPending =
    pendingControlId !== null ||
    analysisCapturePending ||
    scenarioOperation !== null ||
    saveState === "saving" ||
    snapshotState === "creating";
  const pendingAnalysisScenarioIds = new Set(
    pendingAnalysisKeys.flatMap((key) => {
      const scenarioId = workbenchScenarioIdFromAnalysisKeyV3(key);
      return scenarioId === null ? [] : [scenarioId];
    }),
  );
  const unavailableAnalysisScenarioIds = new Set(
    Object.keys(analysisErrorByKey).flatMap((key) => {
      const scenarioId = workbenchScenarioIdFromAnalysisKeyV3(key);
      return scenarioId === null ? [] : [scenarioId];
    }),
  );
  const simulationInfoScenarios = Object.freeze(
    scenarios.map((scenario, index) => {
      const authoredColor = surface?.scenarioColorSeeds?.find(
        ({ scenarioId }) => scenarioId === scenario.scenarioId,
      )?.colorHex;
      return Object.freeze({
        scenarioId: scenario.scenarioId,
        label: scenario.label,
        colorHex: authoredColor ?? scenarioIdentityColorV3(index),
        active: scenario.scenarioId === activeScenarioId,
        runtime: isPlaying ? ("live" as const) : ("paused" as const),
        settlement:
          snapshotPurpose === "publication" && snapshotState === "created"
            ? ("settled" as const)
            : snapshotPurpose === "publication" && snapshotState === "creating"
              ? ("checking" as const)
              : ("not-assessed" as const),
        numericalSafety:
          snapshotPurpose !== null && snapshotState === "created"
            ? ("passed" as const)
            : snapshotPurpose !== null && snapshotState === "creating"
              ? ("checking" as const)
              : snapshotPurpose !== null && snapshotState === "error"
                ? ("unavailable" as const)
                : ("not-checked" as const),
        analysis: pendingAnalysisScenarioIds.has(scenario.scenarioId)
          ? ("checking" as const)
          : unavailableAnalysisScenarioIds.has(scenario.scenarioId)
            ? ("unavailable" as const)
            : ("idle" as const),
      });
    }),
  );
  const openBriefingComposerV3 = React.useCallback(() => {
    const currentSurface = surfaceRef.current;
    const currentScenarios = scenarioDescriptorsRef.current;
    if (
      currentSurface === null ||
      contract === null ||
      currentScenarios.length === 0
    ) return;
    const capture = createWorkbenchBriefingSnapshotV3({
      defaultTitle: experimentTitleRef.current,
      modelId: contract.modelId,
      scenarios: currentScenarios,
      surface: currentSurface,
    });
    const activeId = activeScenarioIdRef.current ??
      currentScenarios[0]!.scenarioId;
    const nextBriefing = reconcileWorkbenchBriefingV3({
      briefing: briefingRef.current,
      preferredFocusScenarioId: activeId,
      defaultTitle: experimentTitleRef.current,
      snapshot: capture,
    });
    setBriefingCaptureSnapshot(capture);
    setBriefingCaptureSurfaceMutationRevision(
      surfaceMutationRevisionRef.current,
    );
    updateWorkbenchBriefingV3(nextBriefing);
    setBriefingOpen(true);
  }, [contract, updateWorkbenchBriefingV3]);
  const briefingSnapshot = briefingCaptureSnapshot;
  const commitExperimentTitleV3 = React.useCallback(() => {
    const fallback = experimentRecord?.title
      ?? t("workbench.selector.untitled");
    const nextTitle = experimentTitle.trim() || fallback;
    experimentTitleRef.current = nextTitle;
    setExperimentTitle(nextTitle);
    // Ephemeral Workbenches keep title locally until the first explicit Save.
    if (experimentRecord === null) return;
    if (nextTitle === experimentRecord.title) {
      setHasUncommittedTitleChanges(false);
      return;
    }
    if (remoteContentRepository !== null) {
      setHasUncommittedTitleChanges(true);
      setSaveState("dirty");
      setHasUnsavedContentChanges(true);
      return;
    }
    try {
      const nextRecord = experimentIndex.rename({
        experimentId: experimentRecord.experimentId,
        title: nextTitle,
        nowIso: new Date().toISOString(),
      });
      setExperimentRecord(nextRecord);
      setHasUncommittedTitleChanges(false);
    } catch (error) {
      experimentTitleRef.current = fallback;
      setExperimentTitle(fallback);
      setHasUncommittedTitleChanges(false);
      setSaveError(error instanceof Error ? error.message : String(error));
    }
  }, [
    experimentIndex,
    experimentRecord,
    experimentTitle,
    remoteContentRepository,
    t,
  ]);

  return (
    <div
      className={`workbench-root flex h-full min-h-0 w-full flex-col overflow-hidden bg-wb-app text-wb-text transition-[padding-right] duration-200 ease-out motion-reduce:transition-none ${
        briefingOpen ? "lg:pr-[min(42rem,45vw)]" : ""
      }`}
      data-testid="v3-dockview-workbench"
      data-playback={isPlaying ? "playing" : "paused"}
      {...rootRuntimeData}
    >
      <header className="workbench-app-header flex min-h-12 shrink-0 items-center gap-2 px-2.5 py-1.5 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Link
            to={articleAuthoringContext !== null
              ? articleEditorHref({
                  articleId: articleAuthoringContext.articleId,
                  locale: resolvedLocale,
                })
              : experimentSessionContext?.returnHref
                ?? homeHref(
                  locale === "ja" || locale === "en" ? locale : undefined,
                )}
            className="workbench-header-action inline-flex h-9 w-9 shrink-0 items-center justify-center"
            aria-label={t(
              articleAuthoringContext === null && experimentSessionContext === null
                ? "workbench.editor.home"
                : "workbench.editor.returnToArticle",
            )}
          >
            {articleAuthoringContext === null && experimentSessionContext === null
              ? <Home className="h-4 w-4" aria-hidden="true" />
              : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
          </Link>
          <input
            type="text"
            value={experimentTitle}
            maxLength={240}
            aria-label={t("workbench.editor.experimentTitle")}
            data-testid="workbench-experiment-title-v3"
            className="workbench-app-title min-w-16 max-w-[min(36vw,30rem)] flex-1 truncate border-0 bg-transparent p-0 text-left outline-none ring-0 selection:bg-wb-accent/25 focus:outline-none focus:ring-0"
            style={{ caretColor: "var(--wb-accent)" }}
            onChange={(event) => {
              const nextTitle = event.currentTarget.value;
              const fallback = experimentRecord?.title
                ?? t("workbench.selector.untitled");
              experimentTitleRef.current = nextTitle;
              setExperimentTitle(nextTitle);
              setHasUncommittedTitleChanges(
                (nextTitle.trim() || fallback) !== fallback,
              );
            }}
            onBlur={commitExperimentTitleV3}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              } else if (event.key === "Escape") {
                event.preventDefault();
                setExperimentTitle(
                  experimentRecord?.title
                    ?? t("workbench.selector.untitled"),
                );
                experimentTitleRef.current = experimentRecord?.title
                  ?? t("workbench.selector.untitled");
                setHasUncommittedTitleChanges(false);
                event.currentTarget.blur();
              }
            }}
          />
        </div>
        <RuntimeStatusV3 status={status} />
        <div className="flex shrink-0 items-center gap-0.5">
          {contract !== null && (
            <WorkbenchSimulationInfoV3
              currentModelId={contract.modelId}
              limitations={t("modelLimitations.items", {
                returnObjects: true,
              }) as string[]}
              models={[{
                contract,
                publicName: t(
                  "workbench.editor.simulationInfo.integratedModelName",
                ),
                shortLabel: t(
                  "workbench.editor.simulationInfo.integratedModelVersion",
                ),
                description: t(
                  "workbench.editor.simulationInfo.integratedModelDescription",
                ),
              }]}
              scenarios={simulationInfoScenarios}
            />
          )}
          <button
            type="button"
            className="workbench-header-action inline-flex h-9 w-9 items-center justify-center"
            aria-label={t("common.theme.toggle")}
            title={t("common.theme.toggle")}
            data-testid="workbench-theme-toggle"
            onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
          >
            {appTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="workbench-header-action inline-flex min-h-9 items-center gap-1.5 px-2.5 disabled:opacity-40"
            disabled={surface === null}
            onClick={() => setNoteOpen(true)}
            aria-label={t("workbench.editor.note")}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {articleLinked && (
            <button
              type="button"
              className="workbench-header-action inline-flex min-h-9 items-center gap-1.5 px-2.5 disabled:opacity-40"
              disabled={surface === null}
              onClick={openBriefingComposerV3}
              aria-label={t("workbench.editor.briefing")}
            >
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden md:inline">
                {t("workbench.editor.briefing")}
              </span>
            </button>
          )}
          <button
            type="button"
            className="workbench-header-action inline-flex min-h-9 items-center gap-1.5 px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={
              status.kind !== "live"
              || runtimeOperationPending
              || experiment === null
              || saveState !== "clean"
            }
            onClick={() => void createSnapshotV3({ kind: "publication" })}
            title={t(
              status.kind !== "live"
                ? "workbench.editor.snapshotNotReady"
                : runtimeOperationPending
                  ? "workbench.editor.snapshotBusy"
                  : experiment === null
                    ? "workbench.editor.publishRequiresSave"
                    : saveState !== "clean"
                      ? "workbench.editor.publishRequiresClean"
                      : "workbench.editor.publishDescription",
            )}
            data-testid="v3-publish-experiment"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden md:inline">
              {snapshotState === "creating"
                ? t("workbench.editor.publishing")
                : t("workbench.editor.publish")}
            </span>
          </button>
          <button
            type="button"
            className="workbench-header-action inline-flex min-h-9 items-center gap-1.5 px-2.5 disabled:cursor-wait disabled:opacity-40"
            disabled={status.kind !== "live" || runtimeOperationPending}
            onClick={() => void saveExperimentV3()}
            title={saveError ?? undefined}
            data-testid="v3-save-experiment"
          >
            {saveState === "clean" ? (
              <Check
                className="h-3.5 w-3.5 text-emerald-500"
                aria-hidden="true"
              />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
            )}
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
              className="workbench-header-playback inline-flex h-9 w-9 items-center justify-center disabled:cursor-wait disabled:opacity-50"
              disabled={runtimeOperationPending}
              aria-label={
                isPlaying ? t("workbench.live.pause") : t("workbench.live.play")
              }
              aria-pressed={!isPlaying}
              onClick={togglePlayback}
              data-testid="v3-playback-toggle"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </header>

      {saveError !== null && (
        <div
          role="alert"
          className="flex shrink-0 items-start gap-2 border-b border-wb-warning/25 bg-wb-warning-soft px-3 py-2 text-xs leading-5 text-wb-text"
          data-testid="workbench-save-error-v3"
        >
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wb-warning"
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">
            {t("workbench.editor.saveError")}: {saveError}
          </span>
        </div>
      )}

      {status.kind === "unavailable-model" ? (
        <section
          className="m-4 max-w-3xl self-center rounded-xl border border-wb-warning/50 bg-wb-warning-soft p-6 text-sm"
          role="alert"
          data-testid="workbench-unavailable-model-v3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-wb-warning"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="font-bold text-wb-text">
                {t("workbench.unavailable.title")}
              </h2>
              <p className="mt-2 leading-6 text-wb-muted">
                {t("workbench.unavailable.description")}
              </p>
              {recoveryError !== null && (
                <p className="mt-3 text-xs text-wb-danger" role="alert">
                  {recoveryError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={myExperimentsHref(isLocale(locale) ? locale : undefined)}
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
        <WorkbenchPerformanceProfilerV3>
          <WorkbenchAreaLayoutV3
          className="min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(420px,55vh)_260px_minmax(560px,70vh)] overflow-y-auto lg:overflow-hidden"
          inspectorResizeLabel={t("workbench.live.resizeInspectorArea")}
          outputResizeLabel={t("workbench.live.resizeOutputArea")}
        >
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
            onRenamePane={renamePaneV3}
            onDeletePane={deletePaneV3}
            onSplitPane={splitPaneV3}
            onAddPane={(graphOptionId) =>
              addPaneToRoleArea("graph", graphOptionId)
            }
            addPaneOptions={WORKBENCH_GRAPH_PANE_OPTIONS_V3.map((option) => ({
              id: option.optionId,
              label: t(`workbench.editor.graphPaneKinds.${option.kind}`),
            }))}
            addPaneLabel={t("workbench.editor.addPane")}
            renamePaneLabel={t("workbench.editor.renamePane")}
            deletePaneLabel={t("workbench.editor.deletePane")}
            splitRightLabel={t("workbench.editor.splitRight")}
            splitDownLabel={t("workbench.editor.splitDown")}
            emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
            paneSettingsLabel={t("workbench.live.paneSettings")}
            renderPane={(pane) => {
              const graphPane = graphPanes.find(
                ({ paneId }) => paneId === pane.paneId,
              );
              return graphPane === undefined || contract === null ? (
                <PaneLoadingV3 />
              ) : (
                <GraphPaneBodyV3
                  activeScenarioId={activeScenarioId}
                  playbackRunning={isPlaying}
                  analysisByKey={analysisByKey}
                  analysisHistoryByKey={analysisHistoryByKey}
                  analysisErrorByKey={analysisErrorByKey}
                  contract={contract}
                  frame={latestFrame}
                  onRequestAnalysis={requestAnalysis}
                  operationPending={runtimeOperationPending}
                  pane={graphPane}
                  pendingAnalysisKeys={pendingAnalysisKeys}
                  sampleStore={presentationSampleStore}
                  scenarios={scenarios}
                  surface={surface}
                  visibleScenarioIds={visibleScenarioIds}
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
            onRenamePane={renamePaneV3}
            onDeletePane={deletePaneV3}
            onSplitPane={splitPaneV3}
            onComparePane={scenarios.length > 1
              ? compareOutputPaneByScenarioV3
              : undefined}
            onAddPane={() => addPaneToRoleArea("output")}
            addPaneLabel={t("workbench.editor.addPane")}
            renamePaneLabel={t("workbench.editor.renamePane")}
            deletePaneLabel={t("workbench.editor.deletePane")}
            splitRightLabel={t("workbench.editor.splitRight")}
            comparePaneLabel={t("workbench.editor.compareScenarios")}
            emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
            paneSettingsLabel={t("workbench.live.paneSettings")}
            renderPane={(paneDefinition) => {
              const pane = outputPanes.find(
                ({ paneId }) => paneId === paneDefinition.paneId,
              );
              return pane === undefined || contract === null ? (
                <PaneLoadingV3 />
              ) : (() => {
                const scenarioId = resolveWorkbenchOutputPaneScenarioIdV3(
                  pane,
                  activeScenarioId,
                  scenarios,
                );
                const frame = scenarioId === null
                  ? null
                  : runtimeRef.current?.latestFrame(scenarioId)
                    ?? (latestFrame?.scenarioId === scenarioId
                      ? latestFrame
                      : null);
                return (
                  <OutputPaneBodyV3
                    contract={contract}
                    frame={frame}
                    onOpenBindingSettings={() =>
                      openPaneSettings(pane.paneId, "binding")}
                    pane={pane}
                    showBinding={scenarios.length > 1}
                    scenarioLabel={
                      scenarios.find((scenario) =>
                        scenario.scenarioId === scenarioId)?.label ?? "—"
                    }
                  />
                );
              })();
            }}
          />
          <div className="flex min-h-0 flex-col bg-wb-aux lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {contract !== null && (
              <div className="shrink-0 border-b border-wb-line">
                <WorkbenchScenarioManagerV3
                  variant="embedded"
                  modelId={contract.modelId}
                  scenarios={scenarios}
                  activeScenarioId={activeScenarioId}
                  pendingScenarioIds={scenarios.flatMap(({ scenarioId }) =>
                    contract.graphCatalog.some(
                      (graph) =>
                        graph.renderer === "structural-return" &&
                        pendingAnalysisKeys.includes(
                          workbenchAnalysisHistoryKeyV3(
                            scenarioId,
                            graph.analysisId,
                          ),
                        ),
                    )
                      ? [scenarioId]
                      : [],
                  )}
                  visibleScenarioIds={visibleScenarioIds}
                  scenarioBaseColors={surface.scenarioColorSeeds}
                  presets={scenarioPresets}
                  actionDisabledReasons={
                    scenarioOperation === null
                      ? undefined
                      : {
                          add: t("workbench.editor.scenarioManager.busy"),
                          delete: t("workbench.editor.scenarioManager.busy"),
                          duplicate: t("workbench.editor.scenarioManager.busy"),
                          rename: t("workbench.editor.scenarioManager.busy"),
                        }
                  }
                  onSelectScenario={selectScenarioV3}
                  onToggleScenarioVisibility={toggleScenarioVisibilityV3}
                  onChangeScenarioBaseColor={(scenarioId, colorHex) => {
                    updateSurface((current) =>
                      updateWorkbenchScenarioBaseColorV3(
                        current,
                        scenarioId,
                        colorHex,
                      ),
                    );
                  }}
                  onAddFromPreset={addScenarioFromPresetV3}
                  onDuplicateScenario={duplicateScenarioV3}
                  onRenameScenario={renameScenarioV3}
                  onDeleteScenario={deleteScenarioV3}
                  strings={{
                    addFromPreset: t(
                      "workbench.editor.scenarioManager.addFromPreset",
                    ),
                    analysisRunning: t("workbench.live.analysisRecalculating"),
                    baseColor: t("workbench.editor.scenarioManager.baseColor"),
                    close: t("workbench.editor.scenarioManager.close"),
                    copySuffix: t(
                      "workbench.editor.scenarioManager.copySuffix",
                    ),
                    delete: t("workbench.editor.scenarioManager.delete"),
                    deleteLastScenario: t(
                      "workbench.editor.scenarioManager.deleteLastScenario",
                    ),
                    duplicate: t("workbench.editor.scenarioManager.duplicate"),
                    emptyScenarios: t(
                      "workbench.editor.scenarioManager.emptyScenarios",
                    ),
                    hideScenario: t(
                      "workbench.editor.scenarioManager.hideScenario",
                    ),
                    incompatiblePreset: t(
                      "workbench.editor.scenarioManager.incompatiblePreset",
                    ),
                    noPresets: t("workbench.editor.scenarioManager.noPresets"),
                    rename: t("workbench.editor.scenarioManager.rename"),
                    scenarioLimitReached: t(
                      "workbench.editor.scenarioManager.scenarioLimitReached",
                    ),
                    scenarioMenu: t(
                      "workbench.editor.scenarioManager.scenarioMenu",
                    ),
                    scenarioName: t(
                      "workbench.editor.scenarioManager.scenarioName",
                    ),
                    scenarios: t("workbench.editor.scenarioManager.scenarios"),
                    showScenario: t(
                      "workbench.editor.scenarioManager.showScenario",
                    ),
                    title: t("workbench.editor.scenarioManager.title"),
                  }}
                />
              </div>
            )}
            {scenarioError !== null && (
              <p
                className="mx-2 mt-2 shrink-0 rounded-lg bg-wb-danger-soft p-2 text-[10px] text-wb-danger"
                role="alert"
              >
                {scenarioError}
              </p>
            )}
            <WorkbenchDockview
              ariaLabel={t("workbench.live.controlArea")}
              className="min-h-0 flex-1"
              panes={controlPanes.map((pane) => ({
                paneId: pane.paneId,
                role: pane.role,
                title: pane.label,
              }))}
              role="control"
              onOpenPaneSettings={openPaneSettings}
              onRenamePane={renamePaneV3}
              onDeletePane={deletePaneV3}
              onSplitPane={splitPaneV3}
              onAddPane={() => addPaneToRoleArea("control")}
              addPaneLabel={t("workbench.editor.addPane")}
              renamePaneLabel={t("workbench.editor.renamePane")}
              deletePaneLabel={t("workbench.editor.deletePane")}
              splitDownLabel={t("workbench.editor.splitDown")}
              emptyPaneLabel={t("workbench.editor.emptyPaneArea")}
              paneSettingsLabel={t("workbench.live.paneSettings")}
              renderPane={(paneDefinition) => {
                const pane = controlPanes.find(
                  ({ paneId }) => paneId === paneDefinition.paneId,
                );
                return pane === undefined || contract === null ? (
                  <PaneLoadingV3 />
                ) : (
                  <ControlPaneBodyV3
                    activeScenarioId={activeScenarioId}
                    contract={contract}
                    controlError={controlError}
                    controlValuesByScenario={
                      controlValuesByScenarioRef.current
                    }
                    disabledByAnalysis={
                      analysisCapturePending || scenarioOperation !== null
                    }
                    onApplyControl={applyControl}
                    onOpenBindingSettings={() =>
                      openPaneSettings(pane.paneId, "binding")}
                    pane={pane}
                    pendingControlId={pendingControlId}
                    scenarios={scenarios}
                  />
                );
              }}
            />
          </div>
          </WorkbenchAreaLayoutV3>
        </WorkbenchPerformanceProfilerV3>
      )}

      {contract !== null && surface !== null && paneSettings !== null && (
        <WorkbenchPaneEditorV3
          key={`${paneSettings.kind}:${paneSettings.paneId}`}
          open
          initialSection={paneSettings.kind !== "graph"
            ? paneSettings.section
            : undefined}
          selectedPane={paneSettings}
          contract={contract}
          surface={surface}
          scenarios={scenarios}
          onClose={() => setPaneSettings(null)}
          onChange={(nextSurface) => {
            updateSurface(() => nextSurface);
          }}
          strings={{
            addCatalogItem: t("workbench.editor.addCatalogItem"),
            backToCatalog: t("workbench.editor.backToCatalog"),
            availableItems: t("workbench.editor.availableItems"),
            cancel: t("workbench.editor.cancel"),
            activeSlotBinding: t("workbench.editor.activeSlotBinding"),
            activeSlotBindingHint: t(
              "workbench.editor.activeSlotBindingHint",
            ),
            outputActiveSlotBindingHint: t(
              "workbench.editor.outputActiveSlotBindingHint",
            ),
            bindingSection: t("workbench.editor.bindingSection"),
            close: t("workbench.editor.close"),
            chooseItem: t("workbench.editor.chooseItem"),
            controlPresentation: t(
              "workbench.editor.controlPresentation",
            ),
            controlPresentationHint: t(
              "workbench.editor.controlPresentationHint",
            ),
            sliderPresentation: t("workbench.editor.sliderPresentation"),
            buttonsPresentation: t("workbench.editor.buttonsPresentation"),
            buttonLabel: t("workbench.editor.buttonLabel"),
            buttonValue: t("workbench.editor.buttonValue"),
            addButtonOption: t("workbench.editor.addButtonOption"),
            removeButtonOption: t("workbench.editor.removeButtonOption"),
            controlCatalog: t("workbench.live.registeredControls"),
            catalogAdded: t("workbench.editor.catalogAdded"),
            catalogCategories: {
              advanced: t("workbench.editor.catalogCategories.advanced"),
              coronary: t("workbench.editor.catalogCategories.coronary"),
              hemodynamics: t(
                "workbench.editor.catalogCategories.hemodynamics",
              ),
              mechanicalSupport: t(
                "workbench.editor.catalogCategories.mechanicalSupport",
              ),
              rhythm: t("workbench.editor.catalogCategories.rhythm"),
              valves: t("workbench.editor.catalogCategories.valves"),
              ventilation: t(
                "workbench.editor.catalogCategories.ventilation",
              ),
            },
            catalogDrawerTitle: t("workbench.editor.catalogDrawerTitle"),
            closeDrawer: t("workbench.editor.closeDrawer"),
            dataSection: t("workbench.editor.settingsSections.data"),
            displaySection: t("workbench.editor.settingsSections.display"),
            done: t("workbench.editor.done"),
            emptyCatalog: t("workbench.editor.emptyCatalog"),
            editItem: t("workbench.editor.editItem"),
            generalSection: t("workbench.editor.settingsSections.general"),
            historyDepth: t("workbench.editor.historyDepth"),
            historyDepthHint: t("workbench.editor.historyDepthHint"),
            formalPressureVolumeAnalysis: t(
              "workbench.editor.formalPressureVolumeAnalysis",
            ),
            formalPressureVolumeAnalysisHint: t(
              "workbench.editor.formalPressureVolumeAnalysisHint",
            ),
            fixedBinding: t("workbench.editor.fixedBinding"),
            fixedBindingHint: t("workbench.editor.fixedBindingHint"),
            outputFixedBindingHint: t(
              "workbench.editor.outputFixedBindingHint",
            ),
            fixedScenarioBinding: t(
              "workbench.editor.fixedScenarioBinding",
            ),
            label: t("workbench.editor.label"),
            itemsSection: t("workbench.editor.items"),
            moveDown: t("workbench.editor.moveDown"),
            moveUp: t("workbench.editor.moveUp"),
            noCatalogMatches: t("workbench.editor.noCatalogMatches"),
            noConfigurableSeries: t("workbench.editor.noConfigurableSeries"),
            outputCatalog: t("workbench.live.registeredOutputs"),
            paneKinds: {
              graph: t("workbench.editor.paneKinds.graph"),
              output: t("workbench.editor.paneKinds.output"),
              control: t("workbench.editor.paneKinds.control"),
            },
            seriesCatalog: t("workbench.editor.series"),
            scenarioColors: t("workbench.editor.scenarioColors"),
            scenarioColorsHint: t("workbench.editor.scenarioColorsHint"),
            scenarioScope: t("workbench.editor.scenarioScope"),
            visibleScenarioScope: t(
              "workbench.editor.visibleScenarioScope",
            ),
            fixedScenarioScope: t("workbench.editor.fixedScenarioScope"),
            traceVisibility: t("workbench.editor.traceVisibility"),
            traceVisibilityHint: t(
              "workbench.editor.traceVisibilityHint",
            ),
            resetColor: t("workbench.editor.resetColor"),
            removeItem: t("workbench.editor.removeItem"),
            preview: t("workbench.editor.preview"),
            reorderItem: t("workbench.editor.reorderItem"),
            searchCatalog: t("workbench.editor.searchCatalog"),
            selectedItems: t("workbench.editor.selectedItems"),
            title: t("workbench.live.paneSettings"),
            windowSec: t("workbench.editor.windowSec"),
            windowSecHint: t("workbench.editor.windowSecHint"),
          }}
        />
      )}
      <WorkbenchNoteEditorV3
        open={noteOpen}
        value={surface?.note.text ?? ""}
        onClose={() => setNoteOpen(false)}
        onChange={(text) =>
          updateSurface((current) => ({
            ...current,
            note: { text },
          }))
        }
        strings={{
          close: t("workbench.editor.close"),
          placeholder: t("workbench.editor.notePlaceholder"),
          title: t("workbench.editor.note"),
        }}
      />
      {articleLinked && briefingSnapshot !== null && briefing !== null && (
        <WorkbenchBriefingComposerV3
          open={briefingOpen}
          briefing={briefing}
          captureScenarioId={
            activeScenarioId ?? briefing.scenarioScope.initialFocusScenarioId
          }
          contract={contract}
          snapshot={briefingSnapshot}
          onChange={(next) => {
            const resolved = resolveWorkbenchBriefingEditorChangeV3({
              activeScenarioId:
                activeScenarioId ?? next.scenarioScope.initialFocusScenarioId,
              current: briefing,
              next,
              snapshot: briefingSnapshot,
            });
            if (
              studioCanonicalJsonStringify(resolved)
              === studioCanonicalJsonStringify(briefing)
            ) return;
            setHasUncapturedBriefingChanges(true);
            updateWorkbenchBriefingV3(resolved);
          }}
          onClose={() => {
            setBriefingOpen(false);
          }}
          snapshotAction={{
            disabled:
              status.kind !== "live" || runtimeOperationPending,
            disabledReason:
              status.kind !== "live"
                ? t("workbench.editor.snapshotNotReady")
                : runtimeOperationPending && snapshotState !== "creating"
                  ? t("workbench.editor.snapshotBusy")
                  : undefined,
            label:
              snapshotState === "creating"
                ? t("workbench.editor.creatingSnapshot")
                : articleAuthoringContext === null
                  ? t("workbench.editor.createSnapshot")
                  : t("workbench.editor.createSnapshotForArticle"),
            pending: snapshotState === "creating",
            onCreate: () => void createArticleSnapshotV3(),
          }}
          strings={{
            close: t("workbench.editor.close"),
            description: t("workbench.editor.briefingDescription"),
            snapshotNotice:
              snapshotError ??
              (snapshotState === "created"
                ? t("workbench.editor.snapshotCreated", {
                    count: snapshotCount,
                  })
                : t("workbench.editor.briefingSnapshotNotice")),
            title: t("workbench.editor.briefingTitle"),
          }}
        />
      )}
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
  return null;
}

export function workbenchPaneIdentityForIdV3(
  surface: ExperimentSurfaceV2,
  paneId: string,
): WorkbenchPaneSettingsV3 | null {
  if (surface.graphPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "graph", paneId };
  }
  if (surface.outputPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "output", paneId };
  }
  if (surface.controlPanes.some((pane) => pane.paneId === paneId)) {
    return { kind: "control", paneId };
  }
  return null;
}

export function createWorkbenchBriefingSnapshotV3(
  input: Readonly<{
    defaultTitle?: string;
    modelId: string;
    scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
    surface: ExperimentSurfaceV2;
  }>,
): ExperimentSnapshotV2 {
  if (input.scenarios.length === 0) {
    throw new Error("Workbench Briefing requires at least one Scenario");
  }
  const surface = reconcileWorkbenchGraphColorsV3(
    input.surface,
    input.scenarios,
  );
  const content = Object.freeze({
    modelId: input.modelId,
    scenarios: Object.freeze(
      input.scenarios.map((scenario) =>
        Object.freeze({
          scenarioId: scenario.scenarioId,
          label: scenario.label,
          capture: Object.freeze({
            fixture: Object.freeze({}),
            checkpoint: Object.freeze({
              acceptedRevision: 0,
              acceptedTimeSec: 0,
              payload: Object.freeze({}),
            }),
          }),
        }),
      ),
    ),
    surface,
  });
  return Object.freeze({
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/workbench-briefing-composer",
    createdAt: "1970-01-01T00:00:00.000Z",
    content,
  });
}

/**
 * A Briefing editor is a projection frozen when its drawer opens. Live
 * numerical state may continue advancing, but changing the Scenario
 * collection or labels makes that projection stale and requires reopening
 * the composer before capture.
 */
export function workbenchBriefingSourceScenariosMatchV3(
  sourceSnapshot: ExperimentSnapshotV2,
  capturedScenarios: readonly ExperimentScenarioV2[],
): boolean {
  return sourceSnapshot.content.scenarios.length === capturedScenarios.length
    && sourceSnapshot.content.scenarios.every((source, index) => {
      const captured = capturedScenarios[index];
      return captured !== undefined
        && source.scenarioId === captured.scenarioId
        && source.label === captured.label;
    });
}

/**
 * Placement edits begin from the exact captured projection. An in-session
 * composer value wins only after the Session has authored one.
 */
export function resolveWorkbenchInitialBriefingV3(
  input: Readonly<{
    current: ExperimentPlacementBriefingV2 | null;
    sourceBriefing: ExperimentPlacementBriefingV2 | null;
  }>,
): ExperimentPlacementBriefingV2 | null {
  if (input.current !== null) return input.current;
  return input.sourceBriefing;
}

/**
 * Rebinds session-only author choices to the current Scenario/Surface schema.
 * Empty graph/output/control selections are intentional and remain empty.
 */
export function reconcileWorkbenchBriefingV3(
  input: Readonly<{
    briefing: ExperimentPlacementBriefingV2 | null;
    preferredFocusScenarioId: string;
    defaultTitle?: string;
    snapshot: ExperimentSnapshotV2;
  }>,
): ExperimentPlacementBriefingV2 {
  const availableScenarioIds = input.snapshot.content.scenarios.map(
    ({ scenarioId }) => scenarioId,
  );
  const fallbackFocusScenarioId = availableScenarioIds.includes(
    input.preferredFocusScenarioId,
  )
    ? input.preferredFocusScenarioId
    : availableScenarioIds[0];
  if (fallbackFocusScenarioId === undefined) {
    throw new Error(
      "Workbench Briefing requires at least one Snapshot Scenario",
    );
  }

  const defaultBriefing = defaultArticleBriefingV3(
    input.snapshot,
    fallbackFocusScenarioId,
    input.defaultTitle,
  );
  const authored = input.briefing ?? defaultBriefing;
  const authoredVisible = new Set(authored.scenarioScope.visibleScenarioIds);
  const retainedVisibleScenarioIds = availableScenarioIds.filter((scenarioId) =>
    authoredVisible.has(scenarioId),
  );
  const visibleScenarioIds =
    retainedVisibleScenarioIds.length > 0
      ? retainedVisibleScenarioIds
      : [fallbackFocusScenarioId];
  const initialFocusScenarioId = visibleScenarioIds.includes(
    authored.scenarioScope.initialFocusScenarioId,
  )
    ? authored.scenarioScope.initialFocusScenarioId
    : visibleScenarioIds.includes(fallbackFocusScenarioId)
      ? fallbackFocusScenarioId
      : visibleScenarioIds[0]!;

  const graphPanesById = new Map(
    input.snapshot.content.surface.graphPanes.map((pane) => [
      pane.paneId,
      pane,
    ]),
  );
  const graphs = [...authored.graphs]
    .sort(compareBriefingOrderV3)
    .flatMap((graph) => {
      const pane = graphPanesById.get(graph.paneId);
      if (pane === undefined) return [];
      const overrides = reconcileWorkbenchGraphOverridesV3(
        graph.overrides,
        pane,
        visibleScenarioIds,
      );
      return [
        Object.freeze({
          paneId: graph.paneId,
          order: 0,
          emphasis: graph.emphasis,
          ...(overrides === undefined ? {} : { overrides }),
        }),
      ];
    })
    .map((graph, order) => Object.freeze({ ...graph, order }));
  if (
    graphs.length > 0 &&
    !graphs.some(({ emphasis }) => emphasis === "primary")
  ) {
    graphs[0] = Object.freeze({ ...graphs[0]!, emphasis: "primary" });
  }

  const availableOutputKeys = new Set(
    input.snapshot.content.surface.outputPanes.flatMap((pane) =>
      pane.items.map(({ outputId }) =>
        workbenchBriefingOutputKeyV3(pane.paneId, outputId)),
    ),
  );
  const seenOutputKeys = new Set<string>();
  const outputs = [...authored.outputs]
    .sort(compareBriefingOrderV3)
    .filter(({ sourcePaneId, outputId, scenarioId }) => {
      const key = workbenchBriefingOutputKeyV3(sourcePaneId, outputId);
      if (
        !availableOutputKeys.has(key) ||
        seenOutputKeys.has(key) ||
        !visibleScenarioIds.includes(scenarioId)
      ) {
        return false;
      }
      seenOutputKeys.add(key);
      return true;
    })
    .map((output, order) => Object.freeze({ ...output, order }));

  const availableControlKeys = new Set(
    input.snapshot.content.surface.controlPanes.flatMap((pane) =>
      pane.items.map(({ controlId }) =>
        workbenchBriefingControlKeyV3(pane.paneId, controlId)),
    ),
  );
  const seenControlKeys = new Set<string>();
  const controls = [...authored.controls]
    .sort(compareBriefingOrderV3)
    .filter(({ sourcePaneId, controlId }) => {
      const key = workbenchBriefingControlKeyV3(sourcePaneId, controlId);
      if (
        !availableControlKeys.has(key) ||
        seenControlKeys.has(key)
      ) {
        return false;
      }
      seenControlKeys.add(key);
      return true;
    })
    .map((control, order) =>
      Object.freeze({
        ...control,
        order,
        binding: reconcileWorkbenchControlBindingV3(
          control.binding,
          visibleScenarioIds,
          initialFocusScenarioId,
        ),
      }),
    );

  const candidate = Object.freeze({
    // The composer has no detached title editor. Its default title always
    // comes from the frozen source projection so a stale in-memory Briefing
    // cannot override the Experiment title captured for this seal.
    defaultTitle: input.defaultTitle ?? authored.defaultTitle,
    scenarioScope: Object.freeze({
      visibleScenarioIds: Object.freeze(visibleScenarioIds),
      initialFocusScenarioId,
    }),
    graphs: Object.freeze(graphs),
    outputs: Object.freeze(outputs),
    controls: Object.freeze(controls),
  });
  return validateExperimentPlacementBriefingV2(
    candidate,
    input.snapshot.content,
  );
}

/** Materializes the Workbench active slot only for newly picked controls. */
export function resolveWorkbenchBriefingEditorChangeV3(
  input: Readonly<{
    activeScenarioId: string;
    current: ExperimentPlacementBriefingV2;
    next: ExperimentPlacementBriefingV2;
    snapshot: ExperimentSnapshotV2;
  }>,
): ExperimentPlacementBriefingV2 {
  const availableScenarioIds = input.snapshot.content.scenarios.map(
    ({ scenarioId }) => scenarioId,
  );
  const activeScenarioId = availableScenarioIds.includes(input.activeScenarioId)
    ? input.activeScenarioId
    : input.next.scenarioScope.initialFocusScenarioId;
  const existingControlKeys = new Set(
    input.current.controls.map(({ sourcePaneId, controlId }) =>
      workbenchBriefingControlKeyV3(sourcePaneId, controlId)),
  );
  const hasNewControl = input.next.controls.some(
    ({ sourcePaneId, controlId }) => !existingControlKeys.has(
      workbenchBriefingControlKeyV3(sourcePaneId, controlId),
    ),
  );
  const visibleScenarioIds = hasNewControl
    ? availableScenarioIds.filter(
        (scenarioId) =>
          input.next.scenarioScope.visibleScenarioIds.includes(scenarioId) ||
          scenarioId === activeScenarioId,
      )
    : input.next.scenarioScope.visibleScenarioIds;
  const candidate = Object.freeze({
    ...input.next,
    scenarioScope: Object.freeze({
      ...input.next.scenarioScope,
      visibleScenarioIds: Object.freeze(visibleScenarioIds),
    }),
    controls: Object.freeze(input.next.controls.map((control) => {
      const key = workbenchBriefingControlKeyV3(
        control.sourcePaneId,
        control.controlId,
      );
      if (existingControlKeys.has(key)) return control;
      const sourcePane = input.snapshot.content.surface.controlPanes.find(
        ({ paneId }) => paneId === control.sourcePaneId,
      );
      return sourcePane === undefined
        ? control
        : Object.freeze({
            ...control,
            binding: materializeSurfaceControlPaneBindingV3(
              sourcePane.binding,
              activeScenarioId,
              availableScenarioIds,
            ),
          });
    })),
  });
  return reconcileWorkbenchBriefingV3({
    briefing: candidate,
    preferredFocusScenarioId: input.next.scenarioScope.initialFocusScenarioId,
    defaultTitle: input.current.defaultTitle,
    snapshot: input.snapshot,
  });
}

function workbenchBriefingControlKeyV3(
  sourcePaneId: string,
  controlId: string,
): string {
  return `${sourcePaneId}\u001f${controlId}`;
}

function workbenchBriefingOutputKeyV3(
  sourcePaneId: string,
  outputId: string,
): string {
  return `${sourcePaneId}\u001f${outputId}`;
}

function reconcileWorkbenchGraphOverridesV3(
  overrides: ExperimentPlacementBriefingGraphOverridesV2 | undefined,
  pane: ExperimentSurfaceGraphPaneV2,
  visibleScenarioIds: readonly string[],
): ExperimentPlacementBriefingGraphOverridesV2 | undefined {
  if (overrides === undefined) return undefined;
  const availableSeriesIds = new Set(
    pane.series.map(({ seriesId }) => seriesId),
  );
  const series =
    overrides.series === undefined
      ? undefined
      : [...overrides.series]
          .sort(compareBriefingOrderV3)
          .filter(({ seriesId }) => availableSeriesIds.has(seriesId))
          .map((item, order) => Object.freeze({ ...item, order }));
  const retainSeries =
    series !== undefined && (series.length > 0 || pane.series.length === 0);
  const selectedSeriesIds = new Set(
    (retainSeries ? series : pane.series)?.map(({ seriesId }) => seriesId),
  );
  const visibleScenarioSet = new Set(visibleScenarioIds);
  const traceColors = overrides.traceColors?.filter((trace) =>
    visibleScenarioSet.has(trace.scenarioId)
    && (trace.seriesId === null
      ? pane.series.length === 0
      : selectedSeriesIds.has(trace.seriesId)),
  );
  const next: ExperimentPlacementBriefingGraphOverridesV2 = Object.freeze({
    ...(overrides.label === undefined ? {} : { label: overrides.label }),
    ...(overrides.legend === undefined ? {} : { legend: overrides.legend }),
    ...(retainSeries ? { series: Object.freeze(series) } : {}),
    ...(traceColors === undefined
      ? {}
      : { traceColors: Object.freeze(traceColors.map((trace) =>
          Object.freeze({ ...trace }))) }),
    ...(overrides.windowSec === undefined || pane.windowSec === undefined
      ? {}
      : { windowSec: overrides.windowSec }),
    ...(overrides.historyDepth === undefined || pane.historyDepth === undefined
      ? {}
      : { historyDepth: overrides.historyDepth }),
  });
  return Object.keys(next).length === 0 ? undefined : next;
}

function reconcileWorkbenchControlBindingV3(
  binding: ExperimentPlacementBriefingV2["controls"][number]["binding"],
  visibleScenarioIds: readonly string[],
  initialFocusScenarioId: string,
): ExperimentPlacementBriefingV2["controls"][number]["binding"] {
  const visible = new Set(visibleScenarioIds);
  if (binding.mode === "reader-focus") {
    const allowedScenarioIds = binding.allowedScenarioIds.filter((scenarioId) =>
      visible.has(scenarioId),
    );
    return Object.freeze({
      mode: "reader-focus",
      allowedScenarioIds: Object.freeze(
        allowedScenarioIds.length > 0
          ? allowedScenarioIds
          : [initialFocusScenarioId],
      ),
    });
  }
  const scenarioIds = binding.scenarioIds.filter((scenarioId) =>
    visible.has(scenarioId),
  );
  return Object.freeze({
    mode: "fixed",
    scenarioIds: Object.freeze(
      scenarioIds.length > 0 ? scenarioIds : [initialFocusScenarioId],
    ),
    application: "absolute",
  });
}

function compareBriefingOrderV3(
  left: Readonly<{ order: number }>,
  right: Readonly<{ order: number }>,
): number {
  return left.order - right.order;
}

export function hasWorkbenchSurfaceMutationsAfterSubmissionV3(
  submittedMutationRevision: number,
  currentMutationRevision: number,
): boolean {
  if (
    !Number.isSafeInteger(submittedMutationRevision) ||
    submittedMutationRevision < 0 ||
    !Number.isSafeInteger(currentMutationRevision) ||
    currentMutationRevision < submittedMutationRevision
  ) {
    throw new Error("Workbench Surface mutation revision is invalid");
  }
  return currentMutationRevision > submittedMutationRevision;
}

export function resolveWorkbenchSurfaceAfterCommitV3(
  input: Readonly<{
    submittedMutationRevision: number;
    currentMutationRevision: number;
    currentSurface: ExperimentSurfaceV2 | null;
    durableSurface: ExperimentSurfaceV2;
  }>,
): Readonly<{
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
    surface: hasNewerMutations ? input.currentSurface! : input.durableSurface,
    hasNewerMutations,
  });
}

export function shouldPublishWorkbenchRootFrameV3(
  input: Readonly<{
    acceptedTimeSec: number;
    lastPublishedTimeSec: number;
    schedulerRunning: boolean;
  }>,
): boolean {
  return (
    !input.schedulerRunning ||
    input.acceptedTimeSec - input.lastPublishedTimeSec >=
      WORKBENCH_ROOT_FRAME_INTERVAL_SEC_V3
  );
}

export function workbenchScenarioRuntimeStatusV3(
  isPlaying: boolean,
): "Live" | "Paused" {
  return isPlaying ? "Live" : "Paused";
}

function GraphPaneBodyV3({
  activeScenarioId,
  playbackRunning,
  analysisByKey,
  analysisHistoryByKey,
  analysisErrorByKey,
  contract,
  frame,
  onRequestAnalysis,
  operationPending,
  pane,
  pendingAnalysisKeys,
  sampleStore,
  scenarios,
  surface,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string | null;
  playbackRunning: boolean;
  analysisByKey: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisHistoryByKey: Readonly<
    Record<string, readonly StudioSimulationAnalysisV2[]>
  >;
  analysisErrorByKey: Readonly<Record<string, string>>;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  pendingAnalysisKeys: readonly string[];
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  surface: ExperimentSurfaceV2;
  visibleScenarioIds: readonly string[];
}>) {
  const { t } = useTranslation();
  const { appTheme } = useAppTheme();
  const graph = contract.graphCatalog.find(
    ({ graphId }) => graphId === pane.graphId,
  );
  if (graph === undefined) {
    return (
      <div className="p-4 text-xs text-wb-danger">
        {t("workbench.live.unknownGraph")}
      </div>
    );
  }
  const scopedVisibleScenarioIds = resolveWorkbenchGraphScenarioIdsV3(
    pane,
    visibleScenarioIds,
  );
  if (graph.renderer === "structural-return") {
    const pending = new Set(pendingAnalysisKeys);
    const traces = Object.freeze(
      scenarios.flatMap((scenario, scenarioIndex) => {
        if (
          !scopedVisibleScenarioIds.includes(scenario.scenarioId) ||
          isWorkbenchGraphTraceExcludedV3(pane, scenario.scenarioId, null)
        ) return [];
        const key = workbenchAnalysisHistoryKeyV3(
          scenario.scenarioId,
          graph.analysisId,
        );
        const traceStyle = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface,
          renderer: graph.renderer,
          authoredScenarioCount: scenarios.length,
          scenarioId: scenario.scenarioId,
          scenarioIndex,
          seriesId: null,
          appTheme,
        });
        const analysisPending = pending.has(key);
        const configuredHistoryDepth = pane.historyDepth ?? 1;
        return [
          Object.freeze({
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            color: traceStyle.color,
            analysis: analysisByKey[key],
            history: workbenchBoundedGraphHistoryV3(
              analysisHistoryByKey[key] ?? [],
              analysisPending
                ? Math.max(1, configuredHistoryDepth)
                : configuredHistoryDepth,
            ),
            error: analysisErrorByKey[key] ?? null,
            pending: analysisPending,
          }),
        ];
      }),
    );
    return (
      <StructuralReturnGraphPaneV3
        acceptedStepAvailable={(frame?.acceptedRevision ?? 0) > 0}
        graph={graph}
        structuralSide={
          pane.structuralSide ?? (graph.side === "left" ? "left" : "right")
        }
        onRequestAnalysis={onRequestAnalysis}
        operationPending={operationPending}
        traces={traces}
      />
    );
  }
  return (
    <SampledGraphPaneBodyV3
      activeScenarioId={activeScenarioId}
      analysisByKey={analysisByKey}
      analysisErrorByKey={analysisErrorByKey}
      analysisHistoryByKey={analysisHistoryByKey}
      playbackRunning={playbackRunning}
      contract={contract}
      frame={frame}
      graph={graph}
      onRequestAnalysis={onRequestAnalysis}
      operationPending={operationPending}
      pane={pane}
      pendingAnalysisKeys={pendingAnalysisKeys}
      sampleStore={sampleStore}
      scenarios={scenarios}
      surface={surface}
      visibleScenarioIds={scopedVisibleScenarioIds}
    />
  );
}

function SampledGraphPaneBodyV3({
  activeScenarioId,
  analysisByKey,
  analysisErrorByKey,
  analysisHistoryByKey,
  playbackRunning,
  contract,
  frame,
  graph,
  onRequestAnalysis,
  operationPending,
  pane,
  pendingAnalysisKeys,
  sampleStore,
  scenarios,
  surface,
  visibleScenarioIds,
}: Readonly<{
  activeScenarioId: string | null;
  analysisByKey: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisErrorByKey: Readonly<Record<string, string>>;
  analysisHistoryByKey: Readonly<
    Record<string, readonly StudioSimulationAnalysisV2[]>
  >;
  playbackRunning: boolean;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  graph: Exclude<
    ModelContractV2["graphCatalog"][number],
    StructuralReturnGraphDefinitionV2
  >;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  pane: ExperimentSurfaceGraphPaneV2;
  pendingAnalysisKeys: readonly string[];
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
  surface: ExperimentSurfaceV2;
  visibleScenarioIds: readonly string[];
}>) {
  const { appTheme } = useAppTheme();
  const graphPresentation = useWorkbenchSampledGraphPresentationSamplesV3(
    sampleStore,
    graph.renderer,
  );
  const samplesByScenarioId = graphPresentation.renderer === "sweep"
    ? graphPresentation.samplesByScenarioId
    : EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3;
  const exactOrbitSamplesByScenarioId =
    graphPresentation.renderer === "pressure-volume"
      ? graphPresentation.exactOrbitSamplesByScenarioId
      : EMPTY_WORKBENCH_SCENARIO_PRESENTATION_SAMPLES_V3;
  const orbitHistoryByScenarioId =
    graphPresentation.renderer === "pressure-volume"
      ? graphPresentation.orbitHistoryByScenarioId
      : EMPTY_WORKBENCH_SCENARIO_ORBIT_HISTORY_V3;
  const displayedSeries = React.useMemo(
    () => Object.freeze([...pane.series].sort(
      (left, right) => left.order - right.order,
    )),
    [pane.series],
  );
  const authoredScenarioCount = scenarios.length;
  const cyclePhaseOutputId = workbenchModelCyclePhaseOutputIdV3(contract);
  const pendingAnalysisSet = new Set(pendingAnalysisKeys);
  const pressureVolumeAnalysisId =
    pane.pressureVolumeAnalysisMode === "formal-periodic"
      ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
      : MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID;
  const rapidRelationScenarioIds = graph.renderer === "pressure-volume"
    && displayedSeries.some(({ seriesId }) =>
      seriesId === "LV" || seriesId === "RV")
    ? scenarios
        .filter(({ scenarioId }) => visibleScenarioIds.includes(scenarioId))
        .map(({ scenarioId }) => scenarioId)
    : [];
  const missingRapidRelationScenarioIds = rapidRelationScenarioIds.filter(
    (scenarioId) => {
      const key = workbenchAnalysisHistoryKeyV3(
        scenarioId,
        pressureVolumeAnalysisId,
      );
      return analysisByKey[key] === undefined
        && analysisErrorByKey[key] === undefined
        && !pendingAnalysisSet.has(key);
    },
  );
  const rapidRelationRequestKey = JSON.stringify(
    [pressureVolumeAnalysisId, ...missingRapidRelationScenarioIds],
  );
  const lastRapidRelationRequestKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (missingRapidRelationScenarioIds.length === 0) {
      lastRapidRelationRequestKeyRef.current = null;
      return;
    }
    if (
      graph.renderer !== "pressure-volume"
      || (frame?.acceptedRevision ?? 0) <= 0
      || operationPending
      || lastRapidRelationRequestKeyRef.current === rapidRelationRequestKey
    ) return;
    if (onRequestAnalysis(
      pressureVolumeAnalysisId,
      missingRapidRelationScenarioIds,
    )) {
      lastRapidRelationRequestKeyRef.current = rapidRelationRequestKey;
    }
  }, [
    frame?.acceptedRevision,
    graph.renderer,
    missingRapidRelationScenarioIds,
    onRequestAnalysis,
    operationPending,
    pressureVolumeAnalysisId,
    rapidRelationRequestKey,
  ]);
  if (graph.renderer === "pressure-volume") {
    const bindings = displayedSeries.flatMap((series) => {
      const binding = graph.seriesCatalog.find(
        (candidate) => candidate.seriesId === series.seriesId,
      );
      return binding === undefined ? [] : [{ binding, series }];
    });
    const tracesForBindings = (selectedBindings: typeof bindings) =>
      scenarios.flatMap((scenario, scenarioStyleIndex) => {
        if (!visibleScenarioIds.includes(scenario.scenarioId)) return [];
        const samples =
          exactOrbitSamplesByScenarioId[scenario.scenarioId] ?? [];
        if (samples.length === 0) return [];
        return selectedBindings.flatMap(({ binding, series }) => {
          if (isWorkbenchGraphTraceExcludedV3(
            pane,
            scenario.scenarioId,
            series.seriesId,
          )) return [];
          const analysisKey = workbenchAnalysisHistoryKeyV3(
            scenario.scenarioId,
            pressureVolumeAnalysisId,
          );
          const relationSide = pressureVolumeRelationSideV3(binding.seriesId);
          const rapidPressureVolumeRelation = relationSide === null
            ? undefined
            : rapidPressureVolumeRelationFromAnalysisV3(
                analysisByKey[analysisKey],
                relationSide,
              );
          const rapidPressureVolumeRelationHistory = relationSide === null
            ? Object.freeze([])
            : Object.freeze(
                workbenchBoundedGraphHistoryV3(
                  analysisHistoryByKey[analysisKey] ?? [],
                  pane.historyDepth ?? 1,
                ).flatMap((analysis) => {
                  const relation = rapidPressureVolumeRelationFromAnalysisV3(
                    analysis,
                    relationSide,
                  );
                  return relation === undefined ? [] : [relation];
                }),
              );
          const style = resolveWorkbenchGraphTraceStyleV3({
            pane,
            surface,
            renderer: graph.renderer,
            authoredScenarioCount,
            scenarioId: scenario.scenarioId,
            scenarioIndex: scenarioStyleIndex,
            seriesId: series.seriesId,
            seriesIndex: displayedSeries.findIndex(
              ({ seriesId }) => seriesId === series.seriesId,
            ),
            appTheme,
          });
          return [{
            scenarioId: scenario.scenarioId,
            scenarioLabel: scenario.label,
            scenarioStatus: workbenchScenarioRuntimeStatusV3(playbackRunning),
            scenarioStyleIndex,
            samples,
            historySampleSets: workbenchBoundedGraphHistoryV3(
              orbitHistoryByScenarioId[scenario.scenarioId] ?? [],
              pane.historyDepth ?? 1,
            ).map((entry) => entry.samples),
            volumeOutputId: binding.volumeOutputId,
            pressureOutputId: binding.pressureOutputId,
            pressureBasis: binding.pressureBasis,
            cyclePhaseOutputId: binding.cyclePhaseOutputId,
            chamberId: binding.seriesId,
            chamberLabel: series.label,
            chamberColor: style.color,
            ...(rapidPressureVolumeRelation === undefined
              ? {}
              : { rapidPressureVolumeRelation }),
            rapidPressureVolumeRelationHistory,
            rapidPressureVolumeRelationPending:
              pendingAnalysisSet.has(analysisKey),
          }];
        });
      });
    const traces = tracesForBindings(bindings);
    return (
      <div className="h-full min-h-0 bg-wb-app p-3">
        <PressureVolumeLoopCanvasV3
          analysisMode={
            pane.pressureVolumeAnalysisMode ?? "responsive-preview"
          }
          traces={traces}
        />
      </div>
    );
  }
  const bindings = displayedSeries.flatMap((series) => {
    const binding = graph.seriesCatalog.find(
      (candidate) => candidate.seriesId === series.seriesId,
    );
    return binding === undefined ? [] : [{ binding, series }];
  });
  const outputs = bindings.flatMap(({ binding }) => {
    const definition = contract.outputCatalog.find(
      (candidate) => candidate.outputId === binding.outputId,
    );
    return definition === undefined ? [] : [definition];
  });
  const commonUnit =
    outputs.length > 0 && outputs.every(({ unit }) => unit === outputs[0]!.unit)
      ? outputs[0]!.unit
      : undefined;
  const tracesForScenarios = (
    selectedScenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[],
  ) =>
    selectedScenarios.flatMap((scenario) => {
      const scenarioStyleIndex = scenarios.findIndex(
        ({ scenarioId }) => scenarioId === scenario.scenarioId,
      );
      if (
        scenarioStyleIndex < 0 ||
        !visibleScenarioIds.includes(scenario.scenarioId)
      )
        return [];
      const samples = samplesByScenarioId[scenario.scenarioId] ?? [];
      if (samples.length === 0) return [];
      return bindings.flatMap(({ binding, series }) => {
        if (isWorkbenchGraphTraceExcludedV3(
          pane,
          scenario.scenarioId,
          series.seriesId,
        )) return [];
        const style = resolveWorkbenchGraphTraceStyleV3({
          pane,
          surface,
          renderer: graph.renderer,
          authoredScenarioCount,
          scenarioId: scenario.scenarioId,
          scenarioIndex: scenarioStyleIndex,
          seriesId: series.seriesId,
          seriesIndex: displayedSeries.findIndex(
            ({ seriesId }) => seriesId === series.seriesId,
          ),
          appTheme,
        });
        return [{
          scenarioId: scenario.scenarioId,
          scenarioLabel: scenario.label,
          scenarioStatus: workbenchScenarioRuntimeStatusV3(playbackRunning),
          scenarioStyleIndex,
          samples,
          outputId: binding.outputId,
          signalLabel: series.label,
          signalColor: style.color,
          ...(cyclePhaseOutputId === undefined
            ? {}
            : { cyclePhaseOutputId }),
        }];
      });
    });
  const traces = tracesForScenarios(scenarios);
  return (
    <div className="h-full min-h-0 bg-wb-app p-3">
      <SweepingWaveformCanvasV3
        activeScenarioId={activeScenarioId}
        includeZero={outputs.every(
          ({ outputId }) =>
            outputId.includes(".flow.") || outputId.endsWith(".flow"),
        )}
        traces={traces}
        unitLabel={commonUnit}
        windowSec={pane.windowSec ?? WORKBENCH_SWEEP_WINDOW_DEFAULT_SEC_V3}
      />
    </div>
  );
}

function pressureVolumeRelationSideV3(
  seriesId: string,
): "left" | "right" | null {
  if (seriesId === "LV") return "left";
  if (seriesId === "RV") return "right";
  return null;
}

const RAPID_PRESSURE_VOLUME_RELATION_CACHE_V3 = new WeakMap<
  StudioSimulationAnalysisV2,
  Map<"left" | "right", MainWireIntegratedModelRapidPressureVolumeRelationV3 | null>
>();

function rapidPressureVolumeRelationFromAnalysisV3(
  analysis: StudioSimulationAnalysisV2 | undefined,
  side: "left" | "right",
): MainWireIntegratedModelRapidPressureVolumeRelationV3 | undefined {
  if (analysis === undefined) return undefined;
  const cached = RAPID_PRESSURE_VOLUME_RELATION_CACHE_V3
    .get(analysis)
    ?.get(side);
  if (cached !== undefined) return cached ?? undefined;
  const orientation = structuralReturnOrientationFromPayloadV3(
    analysis.payload,
    side,
  );
  let relation: MainWireIntegratedModelRapidPressureVolumeRelationV3 | null =
    null;
  try {
    if (orientation !== null) {
      relation = buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
        orientation.starlingLocus,
      );
    }
  } catch {
    relation = null;
  }
  const analysisCache = RAPID_PRESSURE_VOLUME_RELATION_CACHE_V3.get(analysis)
    ?? new Map();
  analysisCache.set(side, relation);
  RAPID_PRESSURE_VOLUME_RELATION_CACHE_V3.set(analysis, analysisCache);
  return relation ?? undefined;
}

type StructuralReturnScenarioTraceV3 = Readonly<{
  scenarioId: string;
  scenarioLabel: string;
  color: string;
  analysis: StudioSimulationAnalysisV2 | undefined;
  history: readonly StudioSimulationAnalysisV2[];
  error: string | null;
  pending: boolean;
}>;

function StructuralReturnGraphPaneV3({
  acceptedStepAvailable,
  graph,
  onRequestAnalysis,
  operationPending,
  structuralSide,
  traces,
}: Readonly<{
  acceptedStepAvailable: boolean;
  graph: StructuralReturnGraphDefinitionV2;
  onRequestAnalysis: (
    analysisId: string,
    scenarioIds: readonly string[],
  ) => boolean;
  operationPending: boolean;
  structuralSide: "left" | "right";
  traces: readonly StructuralReturnScenarioTraceV3[];
}>) {
  const { t } = useTranslation();
  const lastAutoRequestedKeyRef = React.useRef<string | null>(null);
  const missingScenarioIds = React.useMemo(
    () =>
      Object.freeze(
        traces
          .filter(
            ({ analysis, error, pending }) =>
              analysis === undefined && error === null && !pending,
          )
          .map(({ scenarioId }) => scenarioId),
      ),
    [traces],
  );
  const currentRequestKey = structuralReturnComparisonRequestKeyV3(
    graph.analysisId,
    missingScenarioIds,
  );
  React.useEffect(() => {
    if (currentRequestKey === null) lastAutoRequestedKeyRef.current = null;
  }, [currentRequestKey]);
  React.useEffect(() => {
    if (
      shouldAutoRequestStructuralReturnComparisonV3({
        acceptedStepAvailable,
        currentRequestKey,
        lastAutoRequestedKey: lastAutoRequestedKeyRef.current,
        operationPending,
      })
    ) {
      if (onRequestAnalysis(graph.analysisId, missingScenarioIds)) {
        lastAutoRequestedKeyRef.current = currentRequestKey;
      }
    }
  }, [
    acceptedStepAvailable,
    currentRequestKey,
    graph.analysisId,
    missingScenarioIds,
    onRequestAnalysis,
    operationPending,
  ]);
  const comparisonTraces = React.useMemo(
    () =>
      Object.freeze(
        traces.flatMap((trace) => {
          const currentOrientation = structuralReturnOrientationFromPayloadV3(
            trace.analysis?.payload,
            structuralSide,
          );
          const historyOrientations = Object.freeze(
            trace.history.flatMap((historical) => {
              const candidate = structuralReturnOrientationFromPayloadV3(
                historical.payload,
                structuralSide,
              );
              return candidate === null ? [] : [candidate];
            }),
          );
          const fallbackOrientation =
            trace.pending && currentOrientation === null
              ? (historyOrientations.at(-1) ?? null)
              : null;
          const orientation = currentOrientation ?? fallbackOrientation;
          if (orientation === null) return [];
          return [
            Object.freeze({
              scenarioId: trace.scenarioId,
              scenarioLabel: trace.scenarioLabel,
              color: trace.color,
              orientation,
              orientationAlpha: fallbackOrientation === null ? 1 : 0.34,
              pending: trace.pending,
              historyOrientations:
                fallbackOrientation === null
                  ? historyOrientations
                  : Object.freeze(historyOrientations.slice(0, -1)),
            }),
          ];
        }),
      ),
    [structuralSide, traces],
  );
  const pending = traces.some((trace) => trace.pending);
  const error = traces.find((trace) => trace.error !== null)?.error ?? null;
  return (
    <div
      className="relative h-full min-h-0 overflow-auto bg-wb-app p-3"
      data-analysis-error={error ?? undefined}
      data-analysis-pending={pending ? "true" : "false"}
    >
      {traces.length === 0 ? (
        <div className="flex h-full min-h-52 items-center justify-center text-xs text-wb-subtle">
          {t("workbench.live.scenarioHidden")}
        </div>
      ) : comparisonTraces.length === 0 ? (
        <div className="flex h-full min-h-52 items-center justify-center px-5 text-center text-xs text-wb-muted">
          {pending
            ? t("workbench.live.analysisRunning")
            : (error ??
              (acceptedStepAvailable
                ? t("workbench.live.analysisUnavailable")
                : t("workbench.live.firstAcceptedStep")))}
        </div>
      ) : (
        <GuytonStarlingComparisonCanvasV3
          recalculatingLabel={t("workbench.live.analysisRecalculating")}
          traces={comparisonTraces}
        />
      )}
      {traces.map(({ analysis, scenarioId }) =>
        analysis === undefined ? null : (
          <span
            key={scenarioId}
            className="sr-only"
            data-analysis-scenario-id={scenarioId}
            data-analysis-input-epoch={analysis.inputEpoch}
            data-analysis-boundary-status="current-input-epoch"
          >
            {analysis.sourceAcceptedRevision}@
            {analysis.sourceAcceptedTimeSec.toFixed(3)}
          </span>
        ),
      )}
    </div>
  );
}

export function shouldAutoRequestStructuralReturnComparisonV3({
  acceptedStepAvailable,
  currentRequestKey,
  lastAutoRequestedKey,
  operationPending,
}: Readonly<{
  acceptedStepAvailable: boolean;
  currentRequestKey: string | null;
  lastAutoRequestedKey: string | null;
  operationPending: boolean;
}>): boolean {
  return (
    acceptedStepAvailable &&
    currentRequestKey !== null &&
    lastAutoRequestedKey !== currentRequestKey &&
    !operationPending
  );
}

export function structuralReturnComparisonRequestKeyV3(
  analysisId: string,
  scenarioIds: readonly string[],
): string | null {
  return scenarioIds.length === 0
    ? null
    : JSON.stringify([analysisId, ...scenarioIds]);
}

export function workbenchAnalysisHistoryKeyV3(
  scenarioId: string,
  analysisId: string,
): string {
  return JSON.stringify([scenarioId, analysisId]);
}

/**
 * Rebinds immutable analysis payloads when an exact Scenario is duplicated.
 * The result remains runtime-only presentation/analysis state; it never enters
 * a Snapshot qualification decision or a durable Experiment capture.
 */
export function cloneWorkbenchScenarioAnalysesV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  sourceScenarioId: string,
  targetFrame: StudioSimulationFrameV2,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  const sourceAnalyses = Object.values(current).filter(({ scenarioId }) =>
    scenarioId === sourceScenarioId);
  if (sourceAnalyses.length === 0) return current;
  const cloned = sourceAnalyses.map((analysis) => {
    const targetAnalysis = cloneWorkbenchAnalysisForScenarioV3(
      analysis,
      targetFrame,
    );
    return Object.freeze([
      workbenchAnalysisHistoryKeyV3(
        targetFrame.scenarioId,
        analysis.analysisId,
      ),
      targetAnalysis,
    ] as const);
  });
  return Object.freeze({
    ...current,
    ...Object.fromEntries(cloned),
  });
}

export function cloneWorkbenchAnalysisForScenarioV3(
  analysis: StudioSimulationAnalysisV2,
  targetFrame: StudioSimulationFrameV2,
): StudioSimulationAnalysisV2 {
  return Object.freeze({
    ...analysis,
    modelId: targetFrame.modelId,
    runtimeSessionId: targetFrame.runtimeSessionId,
    scenarioId: targetFrame.scenarioId,
    inputEpoch: targetFrame.inputEpoch,
    // Preserve the original analysis source clock: the relation was already
    // accepted for this unchanged parameter target, but was not recomputed at
    // the duplicate's current accepted revision. The presentation contract
    // treats validated payloads as immutable, so sharing one does not share
    // mutable numerical Scenario state.
    payload: analysis.payload,
  }) satisfies StudioSimulationAnalysisV2;
}

export function invalidateWorkbenchScenarioAnalysisEquivalenceV3(
  sourceByTarget: Map<string, string>,
  changedScenarioIds: ReadonlySet<string>,
): void {
  for (const [targetScenarioId, sourceScenarioId] of sourceByTarget) {
    if (
      changedScenarioIds.has(targetScenarioId)
      || changedScenarioIds.has(sourceScenarioId)
    ) sourceByTarget.delete(targetScenarioId);
  }
}

export function workbenchAnalysisMatchesFrameEpochV3(
  analysis: StudioSimulationAnalysisV2,
  frame: StudioSimulationFrameV2 | null,
): boolean {
  return (
    frame !== null &&
    analysis.modelId === frame.modelId &&
    analysis.runtimeSessionId === frame.runtimeSessionId &&
    analysis.scenarioId === frame.scenarioId &&
    analysis.inputEpoch === frame.inputEpoch
  );
}

export function workbenchStructuralAnalysisCompleteV3(
  analysis: StudioSimulationAnalysisV2,
): boolean {
  return (["right", "left"] as const).every((side) => {
    const orientation = structuralReturnOrientationFromPayloadV3(
      analysis.payload,
      side,
    );
    if (orientation === null) return false;
    const locus = orientation.starlingLocus;
    return (
      locus.status === "measured-fixed-tbv-protocol" ||
      (locus.status === "responsive-fixed-tbv-preview" &&
        locus.completedPointCount === locus.totalPointCount)
    );
  });
}

export function workbenchStructuralAnalysisRenderableV3(
  analysis: StudioSimulationAnalysisV2,
): boolean {
  return (["right", "left"] as const).every((side) =>
    structuralReturnOrientationFromPayloadV3(analysis.payload, side) !== null
  );
}

export function workbenchStructuralHistoryAnalysisIdsV3(
  surface: ExperimentSurfaceV2 | null,
  contract: ModelContractV2 | null,
): readonly string[] {
  if (surface === null || contract === null) return Object.freeze([]);
  const analysisIds = new Set<string>();
  for (const pane of surface.graphPanes) {
    if ((pane.historyDepth ?? 0) <= 0) continue;
    const graph = contract.graphCatalog.find(
      ({ graphId }) => graphId === pane.graphId,
    );
    if (graph?.renderer === "structural-return") {
      analysisIds.add(graph.analysisId);
    } else if (graph?.renderer === "pressure-volume") {
      analysisIds.add(
        pane.pressureVolumeAnalysisMode === "formal-periodic"
          ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
          : MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      );
    }
  }
  return Object.freeze([...analysisIds]);
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
    const withoutSameEpoch = previous.filter(
      (candidate) => candidate.inputEpoch !== analysis.inputEpoch,
    );
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

function withoutWorkbenchScenarioAnalysesV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  scenarioId: string,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  return filterWorkbenchAnalysesByScenarioIdsV3(
    current,
    new Set(
      Object.values(current)
        .map((analysis) => analysis.scenarioId)
        .filter((candidate) => candidate !== scenarioId),
    ),
  );
}

function filterWorkbenchAnalysesByScenarioIdsV3(
  current: Readonly<Record<string, StudioSimulationAnalysisV2>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, StudioSimulationAnalysisV2>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(([, analysis]) =>
      retainedScenarioIds.has(analysis.scenarioId),
    ),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

function filterWorkbenchAnalysisHistoryByScenarioIdsV3(
  current: Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, readonly StudioSimulationAnalysisV2[]>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(
      ([, history]) =>
        history.length === 0 || retainedScenarioIds.has(history[0]!.scenarioId),
    ),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

function withoutWorkbenchScenarioAnalysisErrorsV3(
  current: Readonly<Record<string, string>>,
  scenarioId: string,
): Readonly<Record<string, string>> {
  return filterWorkbenchAnalysisErrorsByScenarioIdsV3(
    current,
    new Set(
      Object.keys(current)
        .map(workbenchScenarioIdFromAnalysisKeyV3)
        .filter(
          (candidate): candidate is string =>
            candidate !== null && candidate !== scenarioId,
        ),
    ),
  );
}

function filterWorkbenchAnalysisErrorsByScenarioIdsV3(
  current: Readonly<Record<string, string>>,
  retainedScenarioIds: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const retained = Object.fromEntries(
    Object.entries(current).filter(([key]) => {
      const scenarioId = workbenchScenarioIdFromAnalysisKeyV3(key);
      return scenarioId !== null && retainedScenarioIds.has(scenarioId);
    }),
  );
  return Object.keys(retained).length === Object.keys(current).length
    ? current
    : Object.freeze(retained);
}

function workbenchScenarioIdFromAnalysisKeyV3(key: string): string | null {
  try {
    const parsed: unknown = JSON.parse(key);
    return Array.isArray(parsed) && typeof parsed[0] === "string"
      ? parsed[0]
      : null;
  } catch {
    return null;
  }
}

function OutputPaneBodyV3({
  contract,
  frame,
  onOpenBindingSettings,
  pane,
  showBinding,
  scenarioLabel,
}: Readonly<{
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  onOpenBindingSettings: () => void;
  pane: ExperimentSurfaceOutputPaneV2;
  showBinding: boolean;
  scenarioLabel: string;
}>) {
  const { t } = useTranslation();
  const bindingModeLabel = pane.binding.mode === "active-slot"
    ? t("workbench.live.paneBindingModeActive")
    : t("workbench.live.paneBindingModeFixed");
  const bindingLabel = pane.binding.mode === "active-slot"
    ? t("workbench.live.paneBindingActive", { scenario: scenarioLabel })
    : t("workbench.live.paneBindingFixed", { scenarios: scenarioLabel });
  const selected = [...pane.items]
    .sort((left, right) => left.order - right.order)
    .flatMap((item) => {
      const definition = contract.outputCatalog.find(
        (output) => output.outputId === item.outputId,
      );
      return definition === undefined ? [] : [{ definition, item }];
    });
  return (
    <div className="workbench-output-pane flex h-full min-h-0 flex-col bg-wb-aux">
      <WorkbenchPaneBindingButtonV3
        label={bindingLabel}
        modeLabel={bindingModeLabel}
        onClick={onOpenBindingSettings}
        targetLabel={scenarioLabel}
        testId={`output-pane-binding-${pane.paneId}`}
        visible={showBinding}
      />
      <div className="workbench-output-grid grid min-h-0 flex-1 content-start grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] overflow-auto px-2 pb-2">
        {selected.length === 0 ? (
          <p className="p-4 text-xs text-wb-subtle">
            {t("workbench.live.noSelectedOutputs")}
          </p>
        ) : (
          selected.map(({ definition: output, item }) => {
            const value = frame?.outputs[item.outputId];
            const scalar = scalarAvailableOutputV3(value);
            return (
              <div
                key={item.outputId}
                className="workbench-output-item min-w-0 px-2.5 py-2"
                data-output-availability={value?.availability ?? "unavailable"}
                data-output-quality={value?.quality ?? "not-assessed"}
              >
                <p className="workbench-output-label truncate">
                  {item.label}
                </p>
                <p className="workbench-output-value mt-0.5 tabular-nums">
                  {scalar === null ? "—" : scalar.toFixed(2)}
                  <span className="workbench-output-unit ml-1">
                    {output.unit}
                  </span>
                </p>
                {value?.quality === "not-assessed" && (
                  <p className="mt-1 text-[9px] text-wb-warning">
                    {t("workbench.live.outputNotAssessed")}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ControlPaneBodyV3({
  activeScenarioId,
  contract,
  controlError,
  controlValuesByScenario,
  disabledByAnalysis,
  onApplyControl,
  onOpenBindingSettings,
  pane,
  pendingControlId,
  scenarios,
}: Readonly<{
  activeScenarioId: string | null;
  contract: ModelContractV2;
  controlError: string | null;
  controlValuesByScenario: Readonly<
    Record<string, Readonly<Record<string, number>>>
  >;
  disabledByAnalysis: boolean;
  onApplyControl: (
    scenarioIds: readonly string[],
    controlId: string,
    value: number,
  ) => Promise<boolean>;
  onOpenBindingSettings: () => void;
  pane: ExperimentSurfaceControlPaneV2;
  pendingControlId: string | null;
  scenarios: readonly StudioSimulationWorkerScenarioDescriptorV2[];
}>) {
  const { t } = useTranslation();
  const targetScenarioIds = resolveWorkbenchControlPaneScenarioIdsV3(
    pane,
    activeScenarioId,
    scenarios,
  );
  const targetLabels = targetScenarioIds.map((scenarioId) =>
    scenarios.find((scenario) => scenario.scenarioId === scenarioId)?.label ??
      scenarioId);
  const bindingLabel = pane.binding.mode === "active-slot"
    ? t("workbench.live.paneBindingActive", {
        scenario: targetLabels[0] ?? "—",
      })
    : t("workbench.live.paneBindingFixed", {
        scenarios: targetLabels.join(" + "),
      });
  const bindingModeLabel = pane.binding.mode === "active-slot"
    ? t("workbench.live.paneBindingModeActive")
    : t("workbench.live.paneBindingModeFixed");
  const bindingTargetLabel = targetLabels.join(" + ") || "—";
  const selectedControls = [...pane.items]
    .sort((left, right) => left.order - right.order)
    .flatMap((item) => {
      const definition = contract.controlCatalog.find(
        (control) => control.controlId === item.controlId,
      );
      return definition === undefined ? [] : [{ definition, item }];
    });
  const presentedControls = selectedControls.map(({ definition, item }) => {
    const values = targetScenarioIds.map((scenarioId) =>
      controlValuesByScenario[scenarioId]?.[definition.controlId] ??
        definition.defaultValue);
    const value = values[0] ?? definition.defaultValue;
    const mixed = values.some((candidate) => candidate !== value);
    return { definition, item, value, mixed };
  });
  return (
    <section className="workbench-control-pane flex h-full min-h-0 min-w-0 flex-col bg-wb-aux">
      <WorkbenchPaneBindingButtonV3
        label={bindingLabel}
        modeLabel={bindingModeLabel}
        onClick={onOpenBindingSettings}
        targetLabel={bindingTargetLabel}
        testId={`control-pane-binding-${pane.paneId}`}
        visible={scenarios.length > 1}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {contract.controlCatalog.length === 0 ? (
          <p className="p-3 text-xs leading-5 text-wb-muted">
            {t("workbench.live.noRegisteredControls")}
          </p>
        ) : selectedControls.length === 0 ? (
          <p className="p-3 text-xs text-wb-subtle">
            {t("workbench.live.noSelectedControls")}
          </p>
        ) : (
          <div className="workbench-control-list">
            {presentedControls.map(({ definition: control, item, value, mixed }) => (
              <NumericControlV3
                key={control.controlId}
                control={control}
                disabled={
                  targetScenarioIds.length === 0 ||
                  pendingControlId !== null ||
                  disabledByAnalysis
                }
                label={item.label}
                mixed={mixed}
                pending={pendingControlId === control.controlId}
                presentation={item.presentation}
                value={value}
                onCommit={(nextValue) => onApplyControl(
                  targetScenarioIds,
                  control.controlId,
                  nextValue,
                )}
              />
            ))}
          </div>
        )}
        {controlError !== null && (
          <p
            className="mt-3 rounded-lg bg-wb-danger-soft p-2 text-[10px] text-wb-danger"
            role="alert"
          >
            {controlError}
          </p>
        )}
      </div>
    </section>
  );
}

function NumericControlV3({
  control,
  disabled,
  label,
  mixed,
  onCommit,
  pending,
  presentation,
  value,
}: Readonly<{
  control: ControlDefinitionV2;
  disabled: boolean;
  label: string;
  mixed: boolean;
  onCommit: (value: number) => Promise<boolean>;
  pending: boolean;
  presentation: ExperimentControlPresentationV2;
  value: number;
}>) {
  const { t } = useTranslation();
  const precision = controlStepPrecisionV3(control.step);
  const formatValue = React.useCallback(
    (candidate: number) => candidate.toFixed(precision),
    [precision],
  );
  const [draft, setDraft] = React.useState(value);
  const [draftText, setDraftText] = React.useState(() => formatValue(value));
  React.useEffect(() => {
    setDraft(value);
    setDraftText(formatValue(value));
  }, [formatValue, value]);
  const commit = async (candidate: number) => {
    const result = await resolveControlDraftCommitV3({
      acceptedValue: value,
      candidate,
      control,
      onCommit,
    });
    setDraft(result.displayValue);
    setDraftText(formatValue(result.displayValue));
  };
  const changed = mixed || workbenchControlValueChangedV3(value, control);
  const displayUnit = workbenchControlDisplayUnitV3(control.unit);
  const valueInputCharacters = workbenchControlInputCharactersV3(
    control,
    draftText,
    precision,
  );
  const progress = workbenchControlRangeProgressV3(draft, control);
  return (
    <div
      className="workbench-control-row"
      data-control-presentation={presentation.kind}
      aria-busy={pending}
    >
      <p className="workbench-control-label" title={label}>{label}</p>

      <div className="workbench-control-widget">
        {presentation.kind === "buttons" ? (
          <div
            className="workbench-control-segments"
            role="group"
            aria-label={label}
          >
            {presentation.options.map((option) => {
              const active = !mixed && option.value === value;
              return (
                <button
                  key={`${option.label}:${option.value}`}
                  type="button"
                  aria-pressed={active}
                  data-active={active ? "true" : "false"}
                  disabled={disabled}
                  title={`${option.value.toFixed(precision)} ${displayUnit}`}
                  className="workbench-control-segment"
                  onClick={() => void commit(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            className="workbench-control-range"
            style={{
              "--workbench-control-progress": `${progress}%`,
            } as React.CSSProperties}
            type="range"
            min={control.minimum}
            max={control.maximum}
            step={control.step}
            value={draft}
            disabled={disabled}
            aria-label={label}
            title={`${control.minimum}–${control.maximum} ${displayUnit}`}
            onChange={(event) => {
              const nextValue = Number(event.currentTarget.value);
              setDraft(nextValue);
              setDraftText(formatValue(nextValue));
            }}
            onPointerUp={() => void commit(draft)}
            onKeyUp={(event) => {
              if (
                [
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "End",
                  "Home",
                  "PageDown",
                  "PageUp",
                ].includes(event.key)
              ) {
                void commit(draft);
              }
            }}
          />
        )}
      </div>

      <div className="workbench-control-value">
        <span
          className="workbench-control-pending-slot"
          aria-hidden="true"
        >
          {pending && <span className="workbench-control-pending-dot" />}
        </span>
        {pending && (
          <span className="sr-only" role="status">
            {t("workbench.live.applying")}
          </span>
        )}
        {mixed ? (
          <span className="workbench-control-mixed">
            {t("workbench.live.mixedValue")}
          </span>
        ) : presentation.kind === "buttons" ? (
          <output className="workbench-control-output">
            <span>{formatValue(value)}</span>
            <span className="workbench-control-unit">{displayUnit}</span>
          </output>
        ) : (
          <label className="workbench-control-number-group">
            <span className="sr-only">{t("workbench.live.exactControlValue", { label })}</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={draftText}
              disabled={disabled}
              style={{ width: `${valueInputCharacters}ch` }}
              className="workbench-control-number"
              aria-label={`${t("workbench.live.exactControlValue", { label })} ${displayUnit}`}
              onChange={(event) => {
                const nextText = event.currentTarget.value;
                setDraftText(nextText);
                const parsed = Number(nextText);
                if (nextText.length > 0 && Number.isFinite(parsed)) {
                  setDraft(parsed);
                }
              }}
              onBlur={() => {
                const parsed = Number(draftText);
                if (!Number.isFinite(parsed)) {
                  setDraft(value);
                  setDraftText(formatValue(value));
                  return;
                }
                void commit(parsed);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraft(value);
                  setDraftText(formatValue(value));
                  event.currentTarget.blur();
                }
              }}
            />
            <span className="workbench-control-unit">
              {displayUnit}
            </span>
          </label>
        )}
        <button
          type="button"
          className="workbench-control-reset"
          aria-label={`${t("workbench.live.resetControl")}: ${label}`}
          title={t("workbench.live.resetControl")}
          disabled={disabled || !changed}
          onClick={() => {
            setDraft(control.defaultValue);
            setDraftText(formatValue(control.defaultValue));
            void commit(control.defaultValue);
          }}
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function workbenchControlDisplayUnitV3(unit: string): string {
  return unit === "1" ? "×" : unit;
}

function workbenchControlInputCharactersV3(
  control: ControlDefinitionV2,
  draftText: string,
  precision: number,
): number {
  const longest = Math.max(
    draftText.length,
    control.minimum.toFixed(precision).length,
    control.maximum.toFixed(precision).length,
    control.defaultValue.toFixed(precision).length,
  );
  return Math.max(3, Math.min(10, longest));
}

function workbenchControlRangeProgressV3(
  value: number,
  control: ControlDefinitionV2,
): number {
  const span = control.maximum - control.minimum;
  if (!(span > 0)) return 0;
  return Math.max(0, Math.min(100, ((value - control.minimum) / span) * 100));
}

function workbenchControlValueChangedV3(
  value: number,
  control: ControlDefinitionV2,
): boolean {
  return Math.abs(value - control.defaultValue) >
    Math.max(Math.abs(control.step) * 1e-6, 1e-12);
}

function PaneLoadingV3() {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-full items-center justify-center text-xs text-wb-muted"
      role="status"
    >
      <Activity className="mr-2 h-3.5 w-3.5 animate-pulse" />
      {t("workbench.live.loadingPane")}
    </div>
  );
}

function controlValuesForFixtureV3(
  contract: ModelContractV2,
  fixture: unknown,
): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      contract.controlCatalog.map((control) => [
        control.controlId,
        mainWireIntegratedStudioControlValueFromFixtureV3(
          fixture,
          control.controlId,
        ) ?? control.defaultValue,
      ]),
    ),
  );
}

/**
 * A duplicate starts with the source values, but never with its object
 * identity. This keeps future local editor mutations from coupling two
 * otherwise independent numerical Scenario lanes.
 */
export function cloneWorkbenchControlValuesV3(
  source: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.freeze({ ...source });
}

function appendFramesV3(
  frames: readonly StudioSimulationFrameV2[],
  sampleStore: WorkbenchScenarioPresentationSampleStoreV3,
  selectedOutputIds?: ReadonlySet<string>,
): void {
  const diagnosticsEnabled = workbenchPerformanceDiagnosticsEnabledV3();
  const startedAtMs = diagnosticsEnabled ? workbenchPerformanceNowV3() : 0;
  const framesByScenarioId = new Map<string, StudioSimulationFrameV2[]>();
  for (const frame of frames) {
    const grouped = framesByScenarioId.get(frame.scenarioId) ?? [];
    grouped.push(frame);
    framesByScenarioId.set(frame.scenarioId, grouped);
  }
  const entries = [...framesByScenarioId].map(
    ([scenarioId, scenarioFrames]) => ({
      scenarioId,
      samples: scenarioFrames.map((frame) =>
        Object.freeze({
          inputEpoch: frame.inputEpoch,
          acceptedRevision: frame.acceptedRevision,
          acceptedTimeSec: frame.acceptedTimeSec,
          values: Object.freeze(Object.fromEntries(
            (selectedOutputIds === undefined
              ? Object.keys(frame.outputs)
              : [...selectedOutputIds]
            ).map((outputId) => [
              outputId,
              scalarAvailableOutputV3(frame.outputs[outputId]),
            ]),
          )),
        }),
      ),
    }),
  );
  if (diagnosticsEnabled) {
    recordWorkbenchPerformanceDurationV3(
      "presentation.frame-materialization",
      workbenchPerformanceNowV3() - startedAtMs,
    );
  }
  sampleStore.appendMany(entries);
}

function scalarAvailableOutputV3(
  output: StudioSimulationFrameV2["outputs"][string] | undefined,
): number | null {
  return output?.availability === "available" &&
    output.quality !== "not-assessed" &&
    typeof output.value === "number" &&
    Number.isFinite(output.value)
    ? output.value
    : null;
}

function withoutRecordKeysV3(
  record: Readonly<Record<string, string>>,
  keys: readonly string[],
): Readonly<Record<string, string>> {
  const removed = new Set(keys);
  if (!keys.some((key) => key in record)) return record;
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).filter(([candidate]) => !removed.has(candidate)),
    ),
  );
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
  return Number(
    snapped.toFixed(Math.min(12, controlStepPrecisionV3(control.step) + 2)),
  );
}

function controlStepPrecisionV3(step: number): number {
  const text = step.toString();
  if (text.includes("e-")) return Math.min(6, Number(text.split("e-")[1]));
  return Math.min(6, text.split(".")[1]?.length ?? 0);
}

function remoteExperimentRecordV3(
  resource: StudioRemoteExperimentResourceV1,
): StudioBrowserExperimentRecordV3 {
  return Object.freeze({
    schemaId: STUDIO_BROWSER_EXPERIMENT_RECORD_V3_SCHEMA_ID,
    experimentId: resource.experiment.experimentId,
    title: resource.title,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    publishedSnapshotId: resource.publishedSnapshotId,
  });
}

function publicExperimentSlugV3(experimentId: string): string {
  return `simulation-${experimentId.toLocaleLowerCase()}`;
}

export default WorkbenchV3Page;

import React from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Database,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Settings2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  WorkbenchDockview,
  type WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  ControlDefinitionV2,
  ModelContractV2,
  StructuralReturnGraphDefinitionV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  GuytonStarlingOrientationCanvasV3,
  PressureVolumeLoopCanvasV3,
  SweepingWaveformCanvasV3,
  structuralReturnOrientationFromPayloadV3,
  type WorkbenchScalarSampleV3,
} from "@/components/workbench/v3";
import {
  WorkbenchLiveSchedulerV3,
} from "@/components/workbench/v3/WorkbenchLiveSchedulerV3";

type WorkbenchStatusV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "live";
      contract: ModelContractV2;
      frame: StudioSimulationFrameV2;
      runtimeSessionId: string;
    }>
  | Readonly<{ kind: "error"; message: string }>;

export type WorkbenchGraphPaneV3 = WorkbenchPaneDefinitionV3 & Readonly<{
  role: "graph";
  graphId: string;
}>;

export type WorkbenchOutputPaneV3 = WorkbenchPaneDefinitionV3 & Readonly<{
  role: "output";
  outputIds: readonly string[];
}>;

export type WorkbenchControlPaneV3 = WorkbenchPaneDefinitionV3 & Readonly<{
  role: "control";
  controlIds: readonly string[];
}>;

type WorkbenchPaneSettingsV3 =
  | Readonly<{ kind: "graph"; paneId: string }>
  | Readonly<{ kind: "output"; paneId: string }>
  | Readonly<{ kind: "control"; paneId: string }>;

const SAMPLE_CAPACITY_V3 = 2_000;
const WORKBENCH_SCENARIO_ID_V3 = "workbench-live-default";
const CYCLE_PHASE_OUTPUT_ID_V3 = "rhythm.phase.regular-sinus";

const OUTPUT_COLOR_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  "hemodynamics.volume.LA": "#f9a8d4",
  "hemodynamics.volume.LV": "#a78bfa",
  "hemodynamics.volume.RA": "#67e8f9",
  "hemodynamics.volume.RV": "#60a5fa",
  "hemodynamics.pressure.absolute.LA": "#f9a8d4",
  "hemodynamics.pressure.absolute.LV": "#ff6685",
  "hemodynamics.pressure.absolute.RA": "#67e8f9",
  "hemodynamics.pressure.absolute.RV": "#60a5fa",
  "hemodynamics.pressure.transmural.LA": "#f472b6",
  "hemodynamics.pressure.transmural.LV": "#fb7185",
  "hemodynamics.pressure.transmural.RA": "#22d3ee",
  "hemodynamics.pressure.transmural.RV": "#3b82f6",
  "hemodynamics.pressure.absolute.Ao": "#3ea8ff",
  "hemodynamics.pressure.absolute.SA": "#38bdf8",
  "hemodynamics.pressure.absolute.PA": "#818cf8",
  "hemodynamics.pressure.absolute.PVein": "#c084fc",
  "hemodynamics.pressure.absolute.VC": "#2dd4bf",
  "hemodynamics.flow.valve.MV": "#f472b6",
  "hemodynamics.flow.valve.AoV": "#38bdf8",
  "hemodynamics.flow.valve.TV": "#2dd4bf",
  "hemodynamics.flow.valve.PV": "#818cf8",
  "coronary.flow.total": "#f8fafc",
  "coronary.flow.inlet.LAD": "#fb7185",
  "coronary.flow.inlet.LCx": "#34d399",
  "coronary.flow.inlet.RCA": "#60a5fa",
  "device.LVAD.flow": "#ffc56d",
});

const OUTPUT_LABEL_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  "hemodynamics.volume.LA": "LA volume",
  "hemodynamics.volume.LV": "LV volume",
  "hemodynamics.volume.RA": "RA volume",
  "hemodynamics.volume.RV": "RV volume",
  "hemodynamics.pressure.absolute.LA": "LA pressure",
  "hemodynamics.pressure.absolute.LV": "LV pressure",
  "hemodynamics.pressure.absolute.RA": "RA pressure",
  "hemodynamics.pressure.absolute.RV": "RV pressure",
  "hemodynamics.pressure.transmural.LA": "LA transmural pressure",
  "hemodynamics.pressure.transmural.LV": "LV transmural pressure",
  "hemodynamics.pressure.transmural.RA": "RA transmural pressure",
  "hemodynamics.pressure.transmural.RV": "RV transmural pressure",
  "hemodynamics.pressure.absolute.Ao": "Ao pressure",
  "hemodynamics.pressure.absolute.SA": "Systemic arterial pressure",
  "hemodynamics.pressure.absolute.PA": "Pulmonary arterial pressure",
  "hemodynamics.pressure.absolute.PVein": "Pulmonary venous pressure",
  "hemodynamics.pressure.absolute.VC": "Vena cava pressure",
  "hemodynamics.flow.valve.MV": "Mitral flow",
  "hemodynamics.flow.valve.AoV": "Aortic valve flow",
  "hemodynamics.flow.valve.TV": "Tricuspid flow",
  "hemodynamics.flow.valve.PV": "Pulmonary valve flow",
  "coronary.flow.total": "Total coronary flow",
  "coronary.flow.inlet.LAD": "LAD flow",
  "coronary.flow.inlet.LCx": "LCx flow",
  "coronary.flow.inlet.RCA": "RCA flow",
  "device.LVAD.flow": "LVAD flow",
  "rhythm.phase.regular-sinus": "Sinus cycle phase",
});

export function createDefaultGraphPanesV3(
  contract: ModelContractV2,
): readonly WorkbenchGraphPaneV3[] {
  return Object.freeze(contract.graphCatalog.map((graph, index) => Object.freeze({
    paneId: `graph-${index + 1}`,
    role: "graph" as const,
    title: graphTitleV3(graph.graphId),
    graphId: graph.graphId,
  })));
}

export function createDefaultOutputPaneV3(
  contract: ModelContractV2,
): WorkbenchOutputPaneV3 {
  return Object.freeze({
    paneId: "outputs-primary",
    role: "output" as const,
    title: "Outputs",
    outputIds: Object.freeze(contract.outputCatalog.map(({ outputId }) => outputId)),
  });
}

export function createDefaultControlPaneV3(
  contract: ModelContractV2,
): WorkbenchControlPaneV3 {
  return Object.freeze({
    paneId: "controls-primary",
    role: "control" as const,
    title: "Parameters",
    controlIds: Object.freeze(contract.controlCatalog.map(({ controlId }) => controlId)),
  });
}

export const WorkbenchV3Page = () => {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<WorkbenchStatusV3>({
    kind: "loading",
  });
  const [samples, setSamples] = React.useState<readonly WorkbenchScalarSampleV3[]>([]);
  const [graphPanes, setGraphPanes] = React.useState<
  readonly WorkbenchGraphPaneV3[]
  >([]);
  const [outputPane, setOutputPane] = React.useState<
  WorkbenchOutputPaneV3 | null
  >(null);
  const [controlPane, setControlPane] = React.useState<
  WorkbenchControlPaneV3 | null
  >(null);
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
  const [analysisById, setAnalysisById] = React.useState<
  Readonly<Record<string, StudioSimulationAnalysisV2>>
  >({});
  const [pendingAnalysisId, setPendingAnalysisId] = React.useState<string | null>(null);
  const [analysisErrorById, setAnalysisErrorById] = React.useState<
  Readonly<Record<string, string>>
  >({});
  const clientRef = React.useRef<StudioSimulationWorkerClientV2 | null>(null);
  const schedulerRef = React.useRef<WorkbenchLiveSchedulerV3<StudioSimulationFrameV2> | null>(null);
  const latestFrameRef = React.useRef<StudioSimulationFrameV2 | null>(null);
  const playingIntentRef = React.useRef(true);
  const exclusiveOperationRef = React.useRef<"control" | "analysis" | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let client: StudioSimulationWorkerClientV2 | undefined;
    let scheduler: WorkbenchLiveSchedulerV3<StudioSimulationFrameV2> | undefined;

    const failRuntime = (error: unknown) => {
      if (cancelled) return;
      playingIntentRef.current = false;
      setIsPlaying(false);
      client?.terminate();
      client = undefined;
      clientRef.current = null;
      schedulerRef.current = null;
      exclusiveOperationRef.current = null;
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    };

    const start = async () => {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (cancelled) return;
      setGraphPanes(createDefaultGraphPanesV3(composition.contract));
      setOutputPane(createDefaultOutputPaneV3(composition.contract));
      setControlPane(createDefaultControlPaneV3(composition.contract));
      setControlValues(Object.freeze(Object.fromEntries(
        composition.contract.controlCatalog.map((control) => [
          control.controlId,
          control.defaultValue,
        ]),
      )));
      setControlError(null);
      setPendingControlId(null);
      setAnalysisById({});
      setPendingAnalysisId(null);
      setAnalysisErrorById({});
      exclusiveOperationRef.current = null;
      setSamples([]);

      const runtimeSessionId = `workbench-${randomPortableTokenV3()}`;
      client = new StudioSimulationWorkerClientV2();
      clientRef.current = client;
      const initial = await client.initialize({
        expectedModelId: composition.defaultModelId,
        runtimeSessionId,
        scenarioId: WORKBENCH_SCENARIO_ID_V3,
        fixture: composition.defaultFixture,
      });
      if (cancelled) {
        client.terminate();
        return;
      }
      latestFrameRef.current = initial;
      appendFramesV3([initial], setSamples);
      setStatus({
        kind: "live",
        contract: composition.contract,
        runtimeSessionId,
        frame: initial,
      });
      scheduler = new WorkbenchLiveSchedulerV3({
        advance: (stepCount) => client!.advance({
          runtimeSessionId,
          scenarioId: WORKBENCH_SCENARIO_ID_V3,
          stepCount,
        }),
        acceptedTimeSec: (frame) => frame.acceptedTimeSec,
        onFrames: (frames) => {
          if (cancelled) return;
          appendFramesV3(frames, setSamples);
          const frame = frames.at(-1);
          if (frame === undefined) return;
          latestFrameRef.current = frame;
          setStatus((current) => current.kind === "live"
            ? { ...current, frame }
            : current);
        },
        onError: failRuntime,
      });
      schedulerRef.current = scheduler;
      playingIntentRef.current = true;
      setIsPlaying(true);
      scheduler.play(initial.acceptedTimeSec);
    };

    void start().catch(failRuntime);

    return () => {
      cancelled = true;
      schedulerRef.current = null;
      clientRef.current = null;
      void scheduler?.dispose();
      client?.terminate();
    };
  }, [runtimeGeneration]);

  React.useEffect(() => {
    const handleVisibility = () => {
      const scheduler = schedulerRef.current;
      const frame = latestFrameRef.current;
      if (
        scheduler === null
        || frame === null
        || exclusiveOperationRef.current !== null
      ) return;
      if (document.hidden) {
        void scheduler.pause();
      } else if (playingIntentRef.current) {
        scheduler.play(frame.acceptedTimeSec);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const openPaneSettings = React.useCallback((paneId: string) => {
    if (graphPanes.some((pane) => pane.paneId === paneId)) {
      setPaneSettings({ kind: "graph", paneId });
      return;
    }
    if (outputPane?.paneId === paneId) {
      setPaneSettings({ kind: "output", paneId });
      return;
    }
    if (controlPane?.paneId === paneId) {
      setPaneSettings({ kind: "control", paneId });
    }
  }, [controlPane, graphPanes, outputPane]);

  const togglePlayback = React.useCallback(() => {
    const scheduler = schedulerRef.current;
    const frame = latestFrameRef.current;
    if (
      scheduler === null
      || frame === null
      || exclusiveOperationRef.current !== null
    ) return;
    if (playingIntentRef.current) {
      playingIntentRef.current = false;
      setIsPlaying(false);
      void scheduler.pause();
      return;
    }
    playingIntentRef.current = true;
    setIsPlaying(true);
    scheduler.play(frame.acceptedTimeSec);
  }, []);

  const restartRuntime = React.useCallback(() => {
    playingIntentRef.current = true;
    setIsPlaying(true);
    setStatus({ kind: "loading" });
    setRuntimeGeneration((generation) => generation + 1);
  }, []);

  const applyControl = React.useCallback(async (
    controlId: string,
    value: number,
  ): Promise<boolean> => {
    const client = clientRef.current;
    const scheduler = schedulerRef.current;
    const frame = latestFrameRef.current;
    if (
      client === null
      || scheduler === null
      || frame === null
      || exclusiveOperationRef.current !== null
    ) return false;
    exclusiveOperationRef.current = "control";
    setPendingControlId(controlId);
    setControlError(null);
    try {
      await scheduler.pause();
      const acceptedFrame = latestFrameRef.current;
      if (acceptedFrame === null) {
        throw new Error("The live Scenario no longer has an accepted frame");
      }
      const nextFrame = await client.applyControl({
        runtimeSessionId: acceptedFrame.runtimeSessionId,
        scenarioId: acceptedFrame.scenarioId,
        controlId,
        value,
        expectedInputEpoch: acceptedFrame.inputEpoch,
      });
      latestFrameRef.current = nextFrame;
      setSamples([]);
      setAnalysisById({});
      setAnalysisErrorById({});
      appendFramesV3([nextFrame], setSamples);
      setStatus((current) => current.kind === "live"
        ? { ...current, frame: nextFrame }
        : current);
      setControlValues((current) => Object.freeze({
        ...current,
        [controlId]: value,
      }));
      if (playingIntentRef.current && !document.hidden) {
        scheduler.play(nextFrame.acceptedTimeSec);
      }
      return true;
    } catch (error) {
      setControlError(error instanceof Error ? error.message : String(error));
      const latest = latestFrameRef.current;
      if (playingIntentRef.current && !document.hidden && latest !== null) {
        scheduler.play(latest.acceptedTimeSec);
      }
      return false;
    } finally {
      exclusiveOperationRef.current = null;
      setPendingControlId(null);
    }
  }, []);

  const requestAnalysis = React.useCallback(async (analysisId: string) => {
    const client = clientRef.current;
    const scheduler = schedulerRef.current;
    if (
      client === null
      || scheduler === null
      || latestFrameRef.current === null
      || exclusiveOperationRef.current !== null
    ) return;
    exclusiveOperationRef.current = "analysis";
    setPendingAnalysisId(analysisId);
    setAnalysisErrorById((current) => withoutRecordKeyV3(current, analysisId));
    try {
      await scheduler.pause();
      const acceptedFrame = latestFrameRef.current;
      if (acceptedFrame === null) {
        throw new Error("The live Scenario no longer has an accepted frame");
      }
      const analysis = await client.requestAnalysis({
        runtimeSessionId: acceptedFrame.runtimeSessionId,
        scenarioId: acceptedFrame.scenarioId,
        analysisId,
        expectedInputEpoch: acceptedFrame.inputEpoch,
        expectedAcceptedRevision: acceptedFrame.acceptedRevision,
        expectedAcceptedTimeSec: acceptedFrame.acceptedTimeSec,
      });
      setAnalysisById((current) => Object.freeze({
        ...current,
        [analysisId]: analysis,
      }));
      if (playingIntentRef.current && !document.hidden) {
        scheduler.play(acceptedFrame.acceptedTimeSec);
      }
    } catch (error) {
      setAnalysisErrorById((current) => Object.freeze({
        ...current,
        [analysisId]: error instanceof Error ? error.message : String(error),
      }));
      const latest = latestFrameRef.current;
      if (playingIntentRef.current && !document.hidden && latest !== null) {
        scheduler.play(latest.acceptedTimeSec);
      }
    } finally {
      exclusiveOperationRef.current = null;
      setPendingAnalysisId(null);
    }
  }, []);

  const contract = status.kind === "live" ? status.contract : null;
  const latestFrame = status.kind === "live" ? status.frame : null;
  const rootRuntimeData = status.kind === "live"
    ? {
      "data-accepted-revision": status.frame.acceptedRevision,
      "data-model-time-sec": status.frame.acceptedTimeSec,
    }
    : {};
  const runtimeOperationPending = pendingControlId !== null
    || pendingAnalysisId !== null;

  return (
    <div
      className="workbench-root flex h-full min-h-0 w-full flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="v3-dockview-workbench"
      data-playback={isPlaying ? "playing" : "paused"}
      {...rootRuntimeData}
    >
      <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-wb-line bg-wb-panel px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-wb-accent/40 bg-wb-accent-soft px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-wb-accent">
            <Radio className="h-3 w-3" />
            {t("workbench.live.badge")}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold">
              {status.kind === "live"
                ? status.contract.displayName
                : t("workbench.live.title")}
            </h1>
            <p className="truncate font-mono text-[10px] text-wb-subtle">
              {status.kind === "live"
                ? status.contract.modelId
                : t("workbench.live.loading")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {status.kind === "live" && (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded border border-wb-line bg-wb-soft px-2.5 text-xs font-semibold text-wb-text transition-colors hover:bg-wb-hover disabled:cursor-wait disabled:opacity-50"
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
              <span>{isPlaying
                ? t("workbench.live.pause")
                : t("workbench.live.play")}</span>
            </button>
          )}
          <RuntimeStatusV3 status={status} />
        </div>
      </header>

      {status.kind === "error" ? (
        <section
          className="m-4 rounded-lg border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger"
          role="alert"
        >
          <p className="font-bold">{t("workbench.live.errorTitle")}</p>
          <p className="mt-2 font-mono text-xs">{status.message}</p>
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded border border-wb-danger/50 bg-wb-panel px-3 text-xs font-bold text-wb-text hover:bg-wb-hover"
            onClick={restartRuntime}
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
            panes={graphPanes}
            role="graph"
            onOpenPaneSettings={openPaneSettings}
            renderPane={(pane) => {
              const graphPane = graphPanes.find(({ paneId }) => paneId === pane.paneId);
              return graphPane === undefined || contract === null
                ? <PaneLoadingV3 />
                : (
                  <GraphPaneBodyV3
                    analysisById={analysisById}
                    analysisErrorById={analysisErrorById}
                    contract={contract}
                    frame={latestFrame}
                    onRequestAnalysis={requestAnalysis}
                    pane={graphPane}
                    pendingAnalysisId={pendingAnalysisId}
                    samples={samples}
                  />
                );
            }}
          />
          <WorkbenchDockview
            ariaLabel={t("workbench.live.outputArea")}
            className="border-b border-wb-line lg:col-start-1 lg:row-start-2 lg:border-b-0 lg:border-r"
            panes={outputPane === null ? [] : [outputPane]}
            role="output"
            onOpenPaneSettings={openPaneSettings}
            renderPane={() => outputPane === null || contract === null
              ? <PaneLoadingV3 />
              : (
                <OutputPaneBodyV3
                  contract={contract}
                  frame={latestFrame}
                  pane={outputPane}
                />
              )}
          />
          <WorkbenchDockview
            ariaLabel={t("workbench.live.controlArea")}
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
            panes={controlPane === null ? [] : [controlPane]}
            role="control"
            onOpenPaneSettings={openPaneSettings}
            renderPane={() => controlPane === null || contract === null
              ? <PaneLoadingV3 />
              : (
                <ControlPaneBodyV3
                  contract={contract}
                  controlError={controlError}
                  controlValues={controlValues}
                  disabledByAnalysis={pendingAnalysisId !== null}
                  frame={latestFrame}
                  onApplyControl={applyControl}
                  pane={controlPane}
                  pendingControlId={pendingControlId}
                />
              )}
          />
        </div>
      )}

      {paneSettings !== null && contract !== null && (
        <PaneSettingsModalV3
          contract={contract}
          graphPanes={graphPanes}
          outputPane={outputPane}
          controlPane={controlPane}
          settings={paneSettings}
          onClose={() => setPaneSettings(null)}
          onSelectGraph={(paneId, graphId) => {
            setGraphPanes((current) => current.map((pane) => pane.paneId === paneId
              ? { ...pane, graphId, title: graphTitleV3(graphId) }
              : pane));
          }}
          onToggleOutput={(outputId) => {
            setOutputPane((current) => current === null
              ? current
              : {
                ...current,
                outputIds: toggleIdV3(current.outputIds, outputId),
              });
          }}
          onToggleControl={(controlId) => {
            setControlPane((current) => current === null
              ? current
              : {
                ...current,
                controlIds: toggleIdV3(current.controlIds, controlId),
              });
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
  if (status.kind === "error") return null;
  return (
    <dl
      className="flex shrink-0 items-center gap-4 font-mono text-[10px]"
      data-testid="v3-runtime-status"
    >
      <div>
        <dt className="text-wb-subtle">{t("workbench.live.modelTime")}</dt>
        <dd className="text-right font-bold text-wb-text">
          {status.frame.acceptedTimeSec.toFixed(3)} s
        </dd>
      </div>
      <div>
        <dt className="text-wb-subtle">{t("workbench.live.revision")}</dt>
        <dd className="text-right font-bold text-wb-text">
          {status.frame.acceptedRevision}
        </dd>
      </div>
      <div>
        <dt className="text-wb-subtle">{t("workbench.live.inputEpoch")}</dt>
        <dd className="text-right font-bold text-wb-text">
          {status.frame.inputEpoch}
        </dd>
      </div>
    </dl>
  );
}

function GraphPaneBodyV3({
  analysisById,
  analysisErrorById,
  contract,
  frame,
  onRequestAnalysis,
  pane,
  pendingAnalysisId,
  samples,
}: Readonly<{
  analysisById: Readonly<Record<string, StudioSimulationAnalysisV2>>;
  analysisErrorById: Readonly<Record<string, string>>;
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  onRequestAnalysis: (analysisId: string) => Promise<void>;
  pane: WorkbenchGraphPaneV3;
  pendingAnalysisId: string | null;
  samples: readonly WorkbenchScalarSampleV3[];
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
        error={analysisErrorById[graph.analysisId] ?? null}
        frame={frame}
        graph={graph}
        onRequestAnalysis={onRequestAnalysis}
        pending={pendingAnalysisId === graph.analysisId}
      />
    );
  }
  const outputs = graph.outputIds.flatMap((outputId) => {
    const definition = contract.outputCatalog.find((candidate) => candidate.outputId === outputId);
    return definition === undefined ? [] : [definition];
  });
  if (graph.renderer === "pressure-volume") {
    const chamber = graph.graphId.split(".").at(-1)?.toUpperCase() ?? "PV";
    const pressureBasis = graph.pressureOutputId.includes(".transmural.")
      ? "transmural" as const
      : "intracavitary" as const;
    return (
      <div className="h-full min-h-0 bg-wb-app p-3">
        <PressureVolumeLoopCanvasV3
          chamberLabel={chamber}
          color={outputColorV3(graph.pressureOutputId)}
          pressureBasis={pressureBasis}
          pressureOutputId={graph.pressureOutputId}
          samples={samples}
          showSingleBeatOrientationGuides={
            graph.guideMode === "lv-single-beat-orientation"
          }
          volumeOutputId={graph.volumeOutputId}
        />
      </div>
    );
  }
  const commonUnit = outputs.length > 0
    && outputs.every(({ unit }) => unit === outputs[0]!.unit)
    ? outputs[0]!.unit
    : undefined;
  return (
    <div className="h-full min-h-0 bg-wb-app p-3">
      <SweepingWaveformCanvasV3
        includeZero={outputs.every(({ outputId }) =>
          outputId.includes(".flow.") || outputId.endsWith(".flow"))}
        samples={samples}
        series={outputs.map(({ outputId }) => ({
          outputId,
          label: outputLabelV3(outputId),
          color: outputColorV3(outputId),
        }))}
        unitLabel={commonUnit}
        windowSec={2}
      />
    </div>
  );
}

function StructuralReturnGraphPaneV3({
  analysis,
  error,
  frame,
  graph,
  onRequestAnalysis,
  pending,
}: Readonly<{
  analysis: StudioSimulationAnalysisV2 | undefined;
  error: string | null;
  frame: StudioSimulationFrameV2 | null;
  graph: StructuralReturnGraphDefinitionV2;
  onRequestAnalysis: (analysisId: string) => Promise<void>;
  pending: boolean;
}>) {
  const { t } = useTranslation();
  const acceptedStepAvailable = (frame?.acceptedRevision ?? 0) > 0;
  const lastAutoRequestedInputEpochRef = React.useRef<number | null>(null);
  const analysisBoundaryStatus = structuralReturnAnalysisBoundaryStatusV3(
    analysis,
    frame,
  );
  React.useEffect(() => {
    if (shouldAutoRequestStructuralReturnAnalysisV3({
      acceptedStepAvailable,
      analysisInputEpoch: analysis?.inputEpoch,
      currentInputEpoch: frame?.inputEpoch,
      error,
      lastAutoRequestedInputEpoch: lastAutoRequestedInputEpochRef.current,
      pending,
    })) {
      lastAutoRequestedInputEpochRef.current = frame!.inputEpoch;
      void onRequestAnalysis(graph.analysisId);
    }
  }, [
    acceptedStepAvailable,
    analysis?.inputEpoch,
    error,
    frame?.inputEpoch,
    graph.analysisId,
    onRequestAnalysis,
    pending,
  ]);
  const orientation = structuralReturnOrientationFromPayloadV3(
    analysis?.payload,
    graph.side,
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
        <GuytonStarlingOrientationCanvasV3 orientation={orientation} />
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
        disabled={!acceptedStepAvailable || pending}
        onClick={() => void onRequestAnalysis(graph.analysisId)}
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
  analysisInputEpoch,
  currentInputEpoch,
  error,
  lastAutoRequestedInputEpoch,
  pending,
}: Readonly<{
  acceptedStepAvailable: boolean;
  analysisInputEpoch: number | undefined;
  currentInputEpoch: number | undefined;
  error: string | null;
  lastAutoRequestedInputEpoch: number | null;
  pending: boolean;
}>): boolean {
  return acceptedStepAvailable
    && currentInputEpoch !== undefined
    && analysisInputEpoch !== currentInputEpoch
    && error === null
    && lastAutoRequestedInputEpoch !== currentInputEpoch
    && !pending;
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
}: Readonly<{
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  pane: WorkbenchOutputPaneV3;
}>) {
  const { t } = useTranslation();
  const selected = pane.outputIds.flatMap((outputId) => {
    const definition = contract.outputCatalog.find((output) => output.outputId === outputId);
    return definition === undefined ? [] : [definition];
  });
  return (
    <div className="grid h-full content-start grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-auto bg-wb-line p-px">
      {selected.length === 0 ? (
        <p className="bg-wb-aux p-4 text-xs text-wb-subtle">
          {t("workbench.live.noSelectedOutputs")}
        </p>
      ) : selected.map((output) => {
        const value = frame?.outputs[output.outputId];
        const scalar = scalarAvailableOutputV3(value);
        return (
          <div
            key={output.outputId}
            className="min-w-0 bg-wb-aux px-4 py-3"
            data-output-availability={value?.availability ?? "unavailable"}
            data-output-quality={value?.quality ?? "not-assessed"}
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-wb-subtle">
              {outputLabelV3(output.outputId)}
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
  );
}

function ControlPaneBodyV3({
  contract,
  controlError,
  controlValues,
  disabledByAnalysis,
  frame,
  onApplyControl,
  pane,
  pendingControlId,
}: Readonly<{
  contract: ModelContractV2;
  controlError: string | null;
  controlValues: Readonly<Record<string, number>>;
  disabledByAnalysis: boolean;
  frame: StudioSimulationFrameV2 | null;
  onApplyControl: (controlId: string, value: number) => Promise<boolean>;
  pane: WorkbenchControlPaneV3;
  pendingControlId: string | null;
}>) {
  const { t } = useTranslation();
  const selectedControls = pane.controlIds.flatMap((controlId) => {
    const definition = contract.controlCatalog.find((control) => control.controlId === controlId);
    return definition === undefined ? [] : [definition];
  });
  return (
    <div className="h-full overflow-y-auto bg-wb-aux p-4">
      <section>
        <div className="mb-3 rounded border border-wb-line bg-wb-strip px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-wb-subtle">
            {t("workbench.live.activeScenario")}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-wb-text">
            {WORKBENCH_SCENARIO_ID_V3}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-wb-text">
          <Settings2 className="h-3.5 w-3.5 text-wb-accent" />
          {t("workbench.live.registeredControls")}
        </div>
        {contract.controlCatalog.length === 0 ? (
          <p className="mt-3 rounded border border-wb-line bg-wb-soft p-3 text-xs leading-5 text-wb-muted">
            {t("workbench.live.noRegisteredControls")}
          </p>
        ) : selectedControls.length === 0 ? (
          <p className="mt-3 text-xs text-wb-subtle">
            {t("workbench.live.noSelectedControls")}
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {selectedControls.map((control) => (
              <NumericControlV3
                key={control.controlId}
                control={control}
                disabled={pendingControlId !== null || disabledByAnalysis}
                pending={pendingControlId === control.controlId}
                value={controlValues[control.controlId] ?? control.defaultValue}
                onCommit={(value) => onApplyControl(control.controlId, value)}
              />
            ))}
          </div>
        )}
        <p className="mt-3 text-[10px] leading-4 text-wb-subtle">
          {t("workbench.live.controlResetSemantics")}
        </p>
        {controlError !== null && (
          <p className="mt-3 rounded border border-wb-danger/40 bg-wb-danger-soft p-2 text-[10px] text-wb-danger" role="alert">
            {controlError}
          </p>
        )}
      </section>
      <section className="mt-5 border-t border-wb-line pt-4">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Database className="h-3.5 w-3.5 text-wb-accent" />
          {t("workbench.live.contentBoundary")}
        </div>
        <p className="mt-2 text-xs leading-5 text-wb-muted">
          {t("workbench.live.zeroContent")}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <BoundaryCountV3 label={t("workbench.live.workspaces")} value={0} />
          <BoundaryCountV3 label={t("workbench.live.snapshots")} value={0} />
        </dl>
      </section>
      <section className="mt-5 border-t border-wb-line pt-4">
        <p className="flex items-center gap-2 text-xs font-bold text-wb-warning">
          <ShieldAlert className="h-3.5 w-3.5" />
          {t("workbench.live.snapshotGateTitle")}
        </p>
        <p className="mt-2 text-xs leading-5 text-wb-muted">
          {t("workbench.live.snapshotGateDescription")}
        </p>
      </section>
      {frame !== null && (
        <p className="mt-5 border-t border-wb-line pt-3 font-mono text-[9px] text-wb-subtle">
          {t("workbench.live.inputEpoch")} {frame.inputEpoch} · {t("workbench.live.liveEditable")}
        </p>
      )}
    </div>
  );
}

function NumericControlV3({
  control,
  disabled,
  onCommit,
  pending,
  value,
}: Readonly<{
  control: ControlDefinitionV2;
  disabled: boolean;
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
    <div className="rounded border border-wb-line bg-wb-soft p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">
            {controlLabelV3(control.controlId)}
          </p>
          <p className="mt-0.5 truncate font-mono text-[9px] text-wb-subtle">
            {control.controlId}
          </p>
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
        aria-label={controlLabelV3(control.controlId)}
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

function PaneSettingsModalV3({
  contract,
  graphPanes,
  outputPane,
  controlPane,
  settings,
  onClose,
  onSelectGraph,
  onToggleOutput,
  onToggleControl,
}: Readonly<{
  contract: ModelContractV2;
  graphPanes: readonly WorkbenchGraphPaneV3[];
  outputPane: WorkbenchOutputPaneV3 | null;
  controlPane: WorkbenchControlPaneV3 | null;
  settings: WorkbenchPaneSettingsV3;
  onClose: () => void;
  onSelectGraph: (paneId: string, graphId: string) => void;
  onToggleOutput: (outputId: string) => void;
  onToggleControl: (controlId: string) => void;
}>) {
  const { t } = useTranslation();
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const graphPane = settings.kind === "graph"
    ? graphPanes.find(({ paneId }) => paneId === settings.paneId)
    : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <section
        className="max-h-[min(720px,90vh)] w-full max-w-xl overflow-hidden rounded-lg border border-wb-line bg-wb-panel shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v3-pane-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-12 items-center justify-between border-b border-wb-line px-4">
          <div>
            <h2 id="v3-pane-settings-title" className="text-sm font-bold">
              {t("workbench.live.paneSettings")}
            </h2>
            <p className="font-mono text-[9px] text-wb-subtle">{contract.modelId}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[calc(min(720px,90vh)-3rem)] overflow-y-auto p-4">
          {settings.kind === "graph" && graphPane !== undefined && (
            <fieldset>
              <legend className="text-xs font-bold">
                {t("workbench.live.registeredGraphs")}
              </legend>
              <div className="mt-3 grid gap-2">
                {contract.graphCatalog.map((graph) => (
                  <label key={graph.graphId} className="flex cursor-pointer gap-3 rounded border border-wb-line bg-wb-soft p-3">
                    <input
                      type="radio"
                      name={`graph-${settings.paneId}`}
                      checked={graphPane.graphId === graph.graphId}
                      onChange={() => onSelectGraph(settings.paneId, graph.graphId)}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{graphTitleV3(graph.graphId)}</span>
                      <span className="mt-1 block break-all font-mono text-[9px] text-wb-subtle">
                        {graph.renderer === "structural-return"
                          ? `${graph.analysisId} · ${graph.side}`
                          : graph.outputIds.join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {settings.kind === "output" && outputPane !== null && (
            <fieldset>
              <legend className="text-xs font-bold">
                {t("workbench.live.registeredOutputs")}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {contract.outputCatalog.map((output) => (
                  <label key={output.outputId} className="flex cursor-pointer gap-3 rounded border border-wb-line bg-wb-soft p-3">
                    <input
                      type="checkbox"
                      checked={outputPane.outputIds.includes(output.outputId)}
                      onChange={() => onToggleOutput(output.outputId)}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{outputLabelV3(output.outputId)}</span>
                      <span className="block font-mono text-[9px] text-wb-subtle">{output.unit} · {output.kind}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {settings.kind === "control" && controlPane !== null && (
            <fieldset>
              <legend className="text-xs font-bold">
                {t("workbench.live.registeredControls")}
              </legend>
              {contract.controlCatalog.length === 0 ? (
                <p className="mt-3 rounded border border-wb-line bg-wb-soft p-3 text-xs leading-5 text-wb-muted">
                  {t("workbench.live.noRegisteredControls")}
                </p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {contract.controlCatalog.map((control) => (
                    <label key={control.controlId} className="flex cursor-pointer gap-3 rounded border border-wb-line bg-wb-soft p-3">
                      <input
                        type="checkbox"
                        checked={controlPane.controlIds.includes(control.controlId)}
                        onChange={() => onToggleControl(control.controlId)}
                      />
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-bold">{control.controlId}</span>
                        <span className="block font-mono text-[9px] text-wb-subtle">
                          {control.minimum}–{control.maximum} {control.unit} · {control.changeSemantics}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function BoundaryCountV3({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded border border-wb-line bg-wb-soft p-2">
      <dt className="text-wb-subtle">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-bold">{value}</dd>
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

function appendFramesV3(
  frames: readonly StudioSimulationFrameV2[],
  setSamples: React.Dispatch<React.SetStateAction<readonly WorkbenchScalarSampleV3[]>>,
): void {
  const next = frames.map((frame) => Object.freeze({
    acceptedTimeSec: frame.acceptedTimeSec,
    cyclePhase01: scalarAvailableOutputV3(
      frame.outputs[CYCLE_PHASE_OUTPUT_ID_V3],
    ),
    values: Object.freeze(Object.fromEntries(Object.entries(frame.outputs).map(
      ([outputId, output]) => [
        outputId,
        scalarAvailableOutputV3(output),
      ],
    ))),
  }));
  setSamples((current) => Object.freeze(
    [...current, ...next].slice(-SAMPLE_CAPACITY_V3),
  ));
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

function toggleIdV3(ids: readonly string[], id: string): readonly string[] {
  return Object.freeze(ids.includes(id)
    ? ids.filter((candidate) => candidate !== id)
    : [...ids, id]);
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

function controlLabelV3(controlId: string): string {
  const labels: Readonly<Record<string, string>> = {
    "hemodynamics.systemic-resistance": "Systemic resistance",
    "hemodynamics.pulmonary-resistance": "Pulmonary resistance",
    "hemodynamics.venous-tone": "Venous tone",
    "hemodynamics.arterial-stiffness": "Arterial stiffness",
  };
  return labels[controlId] ?? humanizeCatalogIdV3(controlId);
}

function graphTitleV3(graphId: string): string {
  if (graphId === "hemodynamics.pressure.left-heart") {
    return "Left-heart pressure";
  }
  if (graphId === "hemodynamics.pressure.right-heart") {
    return "Right-heart pressure";
  }
  if (graphId === "hemodynamics.flow.valves") {
    return "Valve flows";
  }
  if (graphId === "coronary.flow.inlet-territories") {
    return "Coronary territory flow";
  }
  if (graphId === "hemodynamics.structural-return.systemic") {
    return "Systemic venous-return orientation";
  }
  if (graphId === "hemodynamics.structural-return.pulmonary") {
    return "Pulmonary venous-return orientation";
  }
  const pvChamber = graphId.match(/^hemodynamics\.pressure-volume\.([A-Za-z]+)$/)?.[1];
  if (pvChamber !== undefined) return `${pvChamber.toUpperCase()} pressure-volume loop`;
  return humanizeCatalogIdV3(graphId);
}

function outputLabelV3(outputId: string): string {
  return OUTPUT_LABEL_BY_ID_V3[outputId] ?? outputId;
}

function outputColorV3(outputId: string): string {
  if (OUTPUT_COLOR_BY_ID_V3[outputId] !== undefined) {
    return OUTPUT_COLOR_BY_ID_V3[outputId]!;
  }
  const palette = ["#38bdf8", "#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
  let hash = 0;
  for (let index = 0; index < outputId.length; index += 1) {
    hash = ((hash << 5) - hash + outputId.charCodeAt(index)) | 0;
  }
  return palette[Math.abs(hash) % palette.length]!;
}

function humanizeCatalogIdV3(value: string): string {
  const token = value.split(".").at(-1) ?? value;
  return token.replaceAll("-", " ").replace(/\b\w/g, (character) =>
    character.toUpperCase());
}

function randomPortableTokenV3(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

export default WorkbenchV3Page;

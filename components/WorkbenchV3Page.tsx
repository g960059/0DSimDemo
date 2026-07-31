import React from "react";
import { createPortal } from "react-dom";
import { Activity, Database, Radio, Settings2, ShieldAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  WorkbenchDockview,
  type WorkbenchPaneDefinitionV3,
} from "@/components/workbench/WorkbenchDockview";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  ModelContractV2,
  OutputDefinitionV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";

type WorkbenchStatusV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "live";
      contract: ModelContractV2;
      frame: StudioSimulationFrameV2;
      runtimeSessionId: string;
    }>
  | Readonly<{ kind: "error"; message: string }>;

type GraphSampleV3 = Readonly<{
  acceptedTimeSec: number;
  values: Readonly<Record<string, number | null>>;
}>;

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

const SAMPLE_CAPACITY_V3 = 500;
const WORKER_STEPS_PER_RENDER_V3 = 3;
const WORKBENCH_SCENARIO_ID_V3 = "workbench-live-default";

const OUTPUT_COLOR_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  "hemodynamics.volume.LV": "#a78bfa",
  "hemodynamics.pressure.absolute.LV": "#ff6685",
  "hemodynamics.pressure.absolute.Ao": "#3ea8ff",
  "coronary.flow.total": "#f8fafc",
  "coronary.flow.inlet.LAD": "#fb7185",
  "coronary.flow.inlet.LCx": "#34d399",
  "coronary.flow.inlet.RCA": "#60a5fa",
  "device.LVAD.flow": "#ffc56d",
});

const OUTPUT_LABEL_BY_ID_V3: Readonly<Record<string, string>> = Object.freeze({
  "hemodynamics.volume.LV": "LV volume",
  "hemodynamics.pressure.absolute.LV": "LV pressure",
  "hemodynamics.pressure.absolute.Ao": "Ao pressure",
  "coronary.flow.total": "Total coronary flow",
  "coronary.flow.inlet.LAD": "LAD flow",
  "coronary.flow.inlet.LCx": "LCx flow",
  "coronary.flow.inlet.RCA": "RCA flow",
  "device.LVAD.flow": "LVAD flow",
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
  const [samples, setSamples] = React.useState<readonly GraphSampleV3[]>([]);
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

  React.useEffect(() => {
    let cancelled = false;
    let nextTickTimer: ReturnType<typeof setTimeout> | undefined;
    let advancing = false;
    let client: StudioSimulationWorkerClientV2 | undefined;

    const start = async () => {
      const composition = await loadStudioDefaultClientCompositionV2();
      if (cancelled) return;
      setGraphPanes(createDefaultGraphPanesV3(composition.contract));
      setOutputPane(createDefaultOutputPaneV3(composition.contract));
      setControlPane(createDefaultControlPaneV3(composition.contract));

      const runtimeSessionId = `workbench-${randomPortableTokenV3()}`;
      client = new StudioSimulationWorkerClientV2();
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
      appendFramesV3([initial], setSamples);
      setStatus({
        kind: "live",
        contract: composition.contract,
        runtimeSessionId,
        frame: initial,
      });

      const tick = async () => {
        if (cancelled || client === undefined) return;
        if (!advancing) {
          advancing = true;
          try {
            const frames = await client.advance({
              runtimeSessionId,
              scenarioId: WORKBENCH_SCENARIO_ID_V3,
              stepCount: WORKER_STEPS_PER_RENDER_V3,
            });
            if (!cancelled) {
              appendFramesV3(frames, setSamples);
              const frame = frames.at(-1);
              if (frame !== undefined) {
                setStatus((current) => current.kind === "live"
                  ? { ...current, frame }
                  : current);
              }
            }
          } catch (error) {
            client.terminate();
            client = undefined;
            if (!cancelled) {
              setStatus({
                kind: "error",
                message: error instanceof Error
                  ? error.message
                  : String(error),
              });
            }
            return;
          } finally {
            advancing = false;
          }
        }
        if (!cancelled) nextTickTimer = setTimeout(tick, 16);
      };
      nextTickTimer = setTimeout(tick, 0);
    };

    void start().catch((error) => {
      if (cancelled) return;
      client?.terminate();
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      cancelled = true;
      if (nextTickTimer !== undefined) clearTimeout(nextTickTimer);
      client?.terminate();
    };
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

  const contract = status.kind === "live" ? status.contract : null;
  const latestFrame = status.kind === "live" ? status.frame : null;
  const rootRuntimeData = status.kind === "live"
    ? {
      "data-accepted-revision": status.frame.acceptedRevision,
      "data-model-time-sec": status.frame.acceptedTimeSec,
    }
    : {};

  return (
    <div
      className="workbench-root flex h-full min-h-0 w-full flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="v3-dockview-workbench"
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
        <RuntimeStatusV3 status={status} />
      </header>

      {status.kind === "error" ? (
        <section
          className="m-4 rounded-lg border border-wb-danger/50 bg-wb-danger-soft p-5 text-sm text-wb-danger"
          role="alert"
        >
          <p className="font-bold">{t("workbench.live.errorTitle")}</p>
          <p className="mt-2 font-mono text-xs">{status.message}</p>
        </section>
      ) : (
        <div className="grid min-h-[900px] flex-1 grid-cols-1 grid-rows-[minmax(420px,1fr)_260px_320px] overflow-auto lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)_220px] lg:overflow-hidden">
          <WorkbenchDockview
            ariaLabel="Graph area"
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
                    contract={contract}
                    pane={graphPane}
                    samples={samples}
                  />
                );
            }}
          />
          <WorkbenchDockview
            ariaLabel="Output area"
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
            ariaLabel="Control area"
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
            panes={controlPane === null ? [] : [controlPane]}
            role="control"
            onOpenPaneSettings={openPaneSettings}
            renderPane={() => controlPane === null || contract === null
              ? <PaneLoadingV3 />
              : (
                <ControlPaneBodyV3
                  contract={contract}
                  frame={latestFrame}
                  pane={controlPane}
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
  contract,
  pane,
  samples,
}: Readonly<{
  contract: ModelContractV2;
  pane: WorkbenchGraphPaneV3;
  samples: readonly GraphSampleV3[];
}>) {
  const graph = contract.graphCatalog.find(({ graphId }) => graphId === pane.graphId);
  if (graph === undefined) {
    return <div className="p-4 text-xs text-wb-danger">Unknown graph</div>;
  }
  const outputs = graph.outputIds.flatMap((outputId) => {
    const definition = contract.outputCatalog.find((candidate) => candidate.outputId === outputId);
    return definition === undefined ? [] : [definition];
  });
  return (
    <div className="h-full min-h-0 bg-wb-app p-3">
      <CatalogSignalChartV3 outputs={outputs} samples={samples} />
    </div>
  );
}

function CatalogSignalChartV3({
  outputs,
  samples,
}: Readonly<{
  outputs: readonly OutputDefinitionV2[];
  samples: readonly GraphSampleV3[];
}>) {
  const width = 760;
  const height = 300;
  const padding = 28;
  const scalarValues = samples.flatMap((sample) => outputs.flatMap(({ outputId }) => {
    const value = sample.values[outputId];
    return value === null || value === undefined ? [] : [value];
  }));
  const minimum = scalarValues.length === 0 ? 0 : Math.min(...scalarValues);
  const maximum = scalarValues.length === 0 ? 1 : Math.max(...scalarValues);
  const span = Math.max(1e-9, maximum - minimum);
  const xFor = (index: number) => padding
    + (index / Math.max(1, samples.length - 1)) * (width - padding * 2);
  const yFor = (value: number) => height - padding
    - ((value - minimum) / span) * (height - padding * 2);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
        {outputs.map((output) => (
          <span key={output.outputId} className="inline-flex items-center gap-1.5 text-[10px] text-wb-muted">
            <span
              className="h-1.5 w-4 rounded-full"
              style={{ background: outputColorV3(output.outputId) }}
            />
            {outputLabelV3(output.outputId)} · {output.unit}
          </span>
        ))}
      </div>
      <svg
        className="min-h-0 w-full flex-1 rounded border border-wb-line bg-wb-soft"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${outputs.map(({ outputId }) => outputLabelV3(outputId)).join(", ")} live graph`}
        preserveAspectRatio="none"
      >
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="var(--wb-border)" />
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="var(--wb-border)" />
        {outputs.map((output) => {
          const points = samples.flatMap((sample, index) => {
            const value = sample.values[output.outputId];
            return value === null || value === undefined
              ? []
              : [`${xFor(index)},${yFor(value)}`];
          }).join(" ");
          return (
            <polyline
              key={output.outputId}
              fill="none"
              points={points}
              stroke={outputColorV3(output.outputId)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <text x={padding + 4} y={padding + 11} fill="var(--wb-text-subtle)" fontSize="10">
          {maximum.toFixed(1)}
        </text>
        <text x={padding + 4} y={height - padding - 5} fill="var(--wb-text-subtle)" fontSize="10">
          {minimum.toFixed(1)}
        </text>
      </svg>
    </div>
  );
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
  const selected = pane.outputIds.flatMap((outputId) => {
    const definition = contract.outputCatalog.find((output) => output.outputId === outputId);
    return definition === undefined ? [] : [definition];
  });
  return (
    <div className="grid h-full content-start grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-auto bg-wb-line p-px">
      {selected.length === 0 ? (
        <p className="bg-wb-aux p-4 text-xs text-wb-subtle">No outputs selected.</p>
      ) : selected.map((output) => {
        const value = frame?.outputs[output.outputId];
        const scalar = typeof value?.value === "number" ? value.value : null;
        return (
          <div key={output.outputId} className="min-w-0 bg-wb-aux px-4 py-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-wb-subtle">
              {outputLabelV3(output.outputId)}
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-wb-text">
              {scalar === null ? "—" : scalar.toFixed(2)}
              <span className="ml-1 text-[10px] font-normal text-wb-muted">{output.unit}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ControlPaneBodyV3({
  contract,
  frame,
  pane,
}: Readonly<{
  contract: ModelContractV2;
  frame: StudioSimulationFrameV2 | null;
  pane: WorkbenchControlPaneV3;
}>) {
  const { t } = useTranslation();
  const selectedControls = pane.controlIds.flatMap((controlId) => {
    const definition = contract.controlCatalog.find((control) => control.controlId === controlId);
    return definition === undefined ? [] : [definition];
  });
  return (
    <div className="h-full overflow-y-auto bg-wb-aux p-4">
      <section>
        <div className="flex items-center gap-2 text-xs font-bold text-wb-text">
          <Settings2 className="h-3.5 w-3.5 text-wb-accent" />
          Registered parameters
        </div>
        {contract.parameterCatalog.length === 0 ? (
          <p className="mt-3 rounded border border-wb-line bg-wb-soft p-3 text-xs leading-5 text-wb-muted">
            This exact V3 release registers no writable parameters. The pane is catalog-driven and will expose controls only after a new modelId admits their execution semantics.
          </p>
        ) : selectedControls.length === 0 ? (
          <p className="mt-3 text-xs text-wb-subtle">No parameter controls selected.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {selectedControls.map((control) => (
              <div key={control.controlId} className="rounded border border-wb-line bg-wb-soft p-3">
                <p className="font-mono text-xs font-bold">{control.controlId}</p>
                <p className="mt-1 text-[10px] text-wb-subtle">
                  {control.parameterIds.join(", ")}
                </p>
              </div>
            ))}
          </div>
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
          input epoch {frame.inputEpoch} · live/read-only
        </p>
      )}
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
            <h2 id="v3-pane-settings-title" className="text-sm font-bold">Pane settings</h2>
            <p className="font-mono text-[9px] text-wb-subtle">{contract.modelId}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded text-wb-subtle hover:bg-wb-hover hover:text-wb-text"
            aria-label="Close pane settings"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[calc(min(720px,90vh)-3rem)] overflow-y-auto p-4">
          {settings.kind === "graph" && graphPane !== undefined && (
            <fieldset>
              <legend className="text-xs font-bold">Registered graph</legend>
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
                        {graph.outputIds.join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {settings.kind === "output" && outputPane !== null && (
            <fieldset>
              <legend className="text-xs font-bold">Registered outputs</legend>
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
              <legend className="text-xs font-bold">Registered parameters</legend>
              {contract.controlCatalog.length === 0 ? (
                <p className="mt-3 rounded border border-wb-line bg-wb-soft p-3 text-xs leading-5 text-wb-muted">
                  No parameter controls are registered for this exact modelId. Runtime mutation stays unavailable rather than exposing a raw fixture-path editor.
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
                        <span className="block font-mono text-[9px] text-wb-subtle">{control.parameterIds.join(" · ")}</span>
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
  return (
    <div className="flex h-full items-center justify-center text-xs text-wb-muted" role="status">
      <Activity className="mr-2 h-3.5 w-3.5 animate-pulse" />
      Loading V3 pane…
    </div>
  );
}

function appendFramesV3(
  frames: readonly StudioSimulationFrameV2[],
  setSamples: React.Dispatch<React.SetStateAction<readonly GraphSampleV3[]>>,
): void {
  const next = frames.map((frame) => Object.freeze({
    acceptedTimeSec: frame.acceptedTimeSec,
    values: Object.freeze(Object.fromEntries(Object.entries(frame.outputs).map(
      ([outputId, output]) => [
        outputId,
        typeof output.value === "number" ? output.value : null,
      ],
    ))),
  }));
  setSamples((current) => Object.freeze(
    [...current, ...next].slice(-SAMPLE_CAPACITY_V3),
  ));
}

function toggleIdV3(ids: readonly string[], id: string): readonly string[] {
  return Object.freeze(ids.includes(id)
    ? ids.filter((candidate) => candidate !== id)
    : [...ids, id]);
}

function graphTitleV3(graphId: string): string {
  if (graphId === "hemodynamics.pressure.lv-aorta") {
    return "LV and aortic pressure";
  }
  if (graphId === "coronary.flow.inlet-territories") {
    return "Coronary territory flow";
  }
  return graphId;
}

function outputLabelV3(outputId: string): string {
  return OUTPUT_LABEL_BY_ID_V3[outputId] ?? outputId;
}

function outputColorV3(outputId: string): string {
  return OUTPUT_COLOR_BY_ID_V3[outputId] ?? "#d6e3ed";
}

function randomPortableTokenV3(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

export default WorkbenchV3Page;

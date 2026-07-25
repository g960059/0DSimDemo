import React from "react";
import { Link, useLocation } from "react-router-dom";

import { allCasesHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireIntegratedPreviewMcsPresetIdV1,
  MainWireIntegratedPreviewRunPresentationV2,
  MainWireIntegratedPreviewRunRecordV2,
} from "@/engine/scientific/integratedPreview";
import {
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_ACK_KEY_V1,
} from "@/engine/scientific/assembly";
import {
  MainWireIntegratedPreviewWorkerClientV1,
} from "@/engine/scientificBrowser/MainWireIntegratedPreviewWorkerClientV1";
import {
  MODEL_LIMITATIONS_ACKNOWLEDGED_EVENT,
  hasModelLimitationsAcknowledgement,
} from "@/components/ModelLimitations";

type LoadState =
  | Readonly<{ phase: "loading"; message: string }>
  | Readonly<{ phase: "failed"; message: string }>
  | Readonly<{
    phase: "ready";
    runRecord: MainWireIntegratedPreviewRunRecordV2;
    presentation: MainWireIntegratedPreviewRunPresentationV2;
  }>;

const MCS_OPTIONS = Object.freeze([
  Object.freeze({
    id: "all-off" as const,
    label: "MCS off · P1 seed",
    description: "Numerically periodic all-off checkpoint (cycle 70).",
  }),
  Object.freeze({
    id: "lvad-hmii-9000-one-beat-transient" as const,
    label: "HeartMate II · 9,000 rpm",
    description: "One unsteady beat after activation from the same P1 state.",
  }),
]);

export default function IntegratedModelPreviewPageV1() {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [mcsPresetId, setMcsPresetId] =
    React.useState<MainWireIntegratedPreviewMcsPresetIdV1>("all-off");
  const [sessionRevision, setSessionRevision] = React.useState(0);
  const [limitationsAcknowledged, setLimitationsAcknowledged] =
    React.useState(() => hasModelLimitationsAcknowledgement(
      MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_ACK_KEY_V1,
    ));
  const [state, setState] = React.useState<LoadState>({
    phase: "loading",
    message: "Verifying the integrated release and restoring its P1 seed…",
  });
  const clientRef =
    React.useRef<MainWireIntegratedPreviewWorkerClientV1 | null>(null);
  const sessionIdRef = React.useRef("");
  const operationEpochRef = React.useRef(0);

  React.useEffect(() => {
    const onAcknowledged = (event: Event) => {
      const acknowledgementKey = (
        event as CustomEvent<Readonly<{ acknowledgementKey?: unknown }>>
      ).detail?.acknowledgementKey;
      if (
        acknowledgementKey
          === MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_LIMITATIONS_ACK_KEY_V1
      ) setLimitationsAcknowledged(true);
    };
    window.addEventListener(
      MODEL_LIMITATIONS_ACKNOWLEDGED_EVENT,
      onAcknowledged,
    );
    return () => window.removeEventListener(
      MODEL_LIMITATIONS_ACKNOWLEDGED_EVENT,
      onAcknowledged,
    );
  }, []);

  React.useEffect(() => {
    if (!limitationsAcknowledged) {
      setState({
        phase: "loading",
        message: "Review and acknowledge this release's model limitations to continue.",
      });
      return;
    }
    const operationEpoch = operationEpochRef.current + 1;
    operationEpochRef.current = operationEpoch;
    const client = new MainWireIntegratedPreviewWorkerClientV1();
    const sessionId = `integrated-preview-${mcsPresetId === "all-off"
      ? "baseline"
      : "hmii"}`;
    clientRef.current = client;
    sessionIdRef.current = sessionId;
    let active = true;
    setState({
      phase: "loading",
      message: mcsPresetId === "all-off"
        ? "Verifying the release-bound P1 run record…"
        : "Running one raw accepted-state beat after HMII activation (about 10 seconds)…",
    });
    void client.createSession(sessionId, mcsPresetId).then((response) => {
      if (!active || operationEpochRef.current !== operationEpoch) return;
      if (response.ok === false) throw new Error(response.error.message);
      if (response.runRecord === null || response.presentation === null) {
        throw new Error("integrated preview Worker omitted its run record");
      }
      setState({
        phase: "ready",
        runRecord: response.runRecord,
        presentation: response.presentation,
      });
    }).catch((error: unknown) => {
      if (!active || operationEpochRef.current !== operationEpoch) return;
      setState({
        phase: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    });
    return () => {
      active = false;
      if (operationEpochRef.current === operationEpoch) {
        operationEpochRef.current += 1;
      }
      client.terminate();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [limitationsAcknowledged, mcsPresetId, sessionRevision]);

  const runNextBeat = React.useCallback(() => {
    const client = clientRef.current;
    if (client === null || state.phase !== "ready") return;
    const operationEpoch = operationEpochRef.current;
    const sessionId = sessionIdRef.current;
    setState({
      phase: "loading",
      message: "Advancing every integrated owner through one accepted beat…",
    });
    void client.runNextBeat(sessionId).then((response) => {
      if (
        operationEpochRef.current !== operationEpoch
        || clientRef.current !== client
        || sessionIdRef.current !== sessionId
      ) return;
      if (response.ok === false) throw new Error(response.error.message);
      if (response.runRecord === null || response.presentation === null) {
        throw new Error("integrated preview Worker omitted its continuation");
      }
      setState({
        phase: "ready",
        runRecord: response.runRecord,
        presentation: response.presentation,
      });
    }).catch((error: unknown) => {
      if (
        operationEpochRef.current !== operationEpoch
        || clientRef.current !== client
        || sessionIdRef.current !== sessionId
      ) return;
      setState({
        phase: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, [state]);

  return (
    <main
      className="h-full w-full overflow-y-auto bg-slate-950 text-slate-100"
      data-testid="integrated-model-preview-page-v1"
      data-mcs-preset-id={mcsPresetId}
      data-runtime-phase={state.phase}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={allCasesHref(locale)}
              className="text-sm font-semibold text-sky-400 hover:text-sky-300"
            >
              ← Cases
            </Link>
            <span className="rounded-full border border-amber-600/60 bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-300">
              Experimental integrated preview
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Base + coronary + MCS + composed rhythm
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              One release-bound accepted-state transaction. Graphs use raw
              accepted endpoints; no smoothing, interpolation, or legacy model
              fallback is applied.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <StatusCard
              title="Coronary"
              value="V3 · autoregulation"
              detail="Total inlet and LAD subendocardial flow are sampled from the accepted coronary trial."
            />
            <StatusCard
              title="Rhythm"
              value="Composed V2 · sinus 60"
              detail="Source, AV conduction, capture, interval strength and event calcium share the accepted clock."
            />
            <StatusCard
              title="Mechanical support"
              value={mcsPresetId === "all-off" ? "Dynamic graph · all off" : "HMII · 9,000 rpm"}
              detail={mcsPresetId === "all-off"
                ? "All four rotary paths are present with zero accepted flow."
                : "Literature-transcribed R–L profile; this beat is not periodic or release-approved."}
            />
          </div>
        </header>

        <section className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            {state.phase === "loading" && (
              <RuntimeStatus message={state.message} />
            )}
            {state.phase === "failed" && (
              <div className="space-y-3">
                <RuntimeStatus message={state.message} failed />
                <button
                  type="button"
                  onClick={() => setSessionRevision((value) => value + 1)}
                  className="rounded-lg border border-sky-700 bg-sky-950/40 px-3 py-2 text-sm font-bold text-sky-200 hover:border-sky-500"
                >
                  Restore the exact release seed
                </button>
              </div>
            )}
            {state.phase === "ready" && (
              <IntegratedRunView presentation={state.presentation} />
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-sm font-bold text-slate-200">
                Simulation input
              </h2>
              <div className="mt-3 space-y-2">
                {MCS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      option.id === mcsPresetId
                        ? "border-sky-500 bg-sky-950/40"
                        : "border-slate-700 bg-slate-950/40 hover:border-slate-600"
                    }`}
                    aria-pressed={option.id === mcsPresetId}
                    onClick={() => setMcsPresetId(option.id)}
                    disabled={state.phase === "loading"}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={runNextBeat}
                disabled={state.phase !== "ready"}
                className="mt-4 w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white enabled:hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Run next beat
              </button>
              {state.phase === "ready" && (
                <button
                  type="button"
                  onClick={() => downloadRunRecord(state.runRecord)}
                  className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
                >
                  Download exact run record
                </button>
              )}
            </section>

            {state.phase === "ready" && (
              <ReleaseIdentity presentation={state.presentation} />
            )}

            <section className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-xs leading-5 text-amber-200/90">
              <h2 className="font-bold text-amber-300">
                Use boundary and known blockers
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Research and education only; not for patient-specific decisions.</li>
                <li>0D lumped model; spatial flow and regional wall mechanics are not resolved.</li>
                <li>Physiological and clinical validation are not established.</li>
                <li>The PA–PArt underdamped waveform mechanism remains open.</li>
                <li>External-AF joint checkpointing is not yet included.</li>
                <li>Rhythm-synchronized IABP remains blocked.</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function IntegratedRunView({
  presentation,
}: Readonly<{ presentation: MainWireIntegratedPreviewRunPresentationV2 }>) {
  const trace = presentation.trace;
  const metrics = summarize(trace);
  return (
    <div className="space-y-4" data-testid="integrated-model-preview-run-v1">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="LVEF" value={`${(metrics.lvef01 * 100).toFixed(1)}%`} />
        <Metric label="Ao mean" value={`${metrics.meanAo.toFixed(1)} mmHg`} />
        <Metric label="PA max" value={`${metrics.maxPa.toFixed(1)} mmHg`} />
        <Metric label="Forward CO" value={`${metrics.forwardCo.toFixed(2)} L/min`} />
        <Metric label="Coronary mean" value={`${metrics.meanCoronary.toFixed(1)} mL/s`} />
        <Metric label="LVAD mean" value={`${metrics.meanLvad.toFixed(2)} L/min`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LineChart
          title="Pressure waveforms"
          unit="mmHg"
          trace={trace}
          series={[
            { label: "Ao", color: "#38bdf8", read: (s) => s.absolutePressureMmHg.Ao },
            { label: "LV", color: "#f43f5e", read: (s) => s.absolutePressureMmHg.LV },
            { label: "PA", color: "#a78bfa", read: (s) => s.absolutePressureMmHg.PA },
          ]}
        />
        <PvLoop trace={trace} />
        <LineChart
          title="Valve flow"
          unit="mL/s"
          trace={trace}
          series={[
            { label: "MV", color: "#2dd4bf", read: (s) => s.valveFlowMlPerSec.MV },
            { label: "AoV", color: "#fb7185", read: (s) => s.valveFlowMlPerSec.AoV },
            { label: "TV", color: "#60a5fa", read: (s) => s.valveFlowMlPerSec.TV },
            { label: "PV", color: "#c084fc", read: (s) => s.valveFlowMlPerSec.PV },
          ]}
        />
        <LineChart
          title="Coronary flow"
          unit="mL/s"
          trace={trace}
          series={[
            { label: "Total inlet", color: "#f59e0b", read: (s) => s.coronary.totalInletFlowMlPerSec },
            { label: "LAD subendo Qm", color: "#fcd34d", read: (s) => s.coronary.ladSubendocardialQmFlowMlPerSec },
          ]}
        />
        <LineChart
          title="Dynamic MCS accepted flow"
          unit="L/min"
          trace={trace}
          series={[
            { label: "LVAD", color: "#22d3ee", read: (s) => s.dynamicMcsAcceptedFlowMlPerSec.LVAD * 0.06 },
            { label: "Impella", color: "#fb923c", read: (s) => s.dynamicMcsAcceptedFlowMlPerSec.IMPELLA * 0.06 },
            { label: "VA ECMO", color: "#34d399", read: (s) => s.dynamicMcsAcceptedFlowMlPerSec.VA_ECMO * 0.06 },
          ]}
        />
        <LineChart
          title="Event-owned free calcium"
          unit="µM"
          trace={trace}
          series={[
            { label: "LA", color: "#2dd4bf", read: (s) => s.freeCalciumUMByWall.LA },
            { label: "LVFW", color: "#f43f5e", read: (s) => s.freeCalciumUMByWall.LVFW },
            { label: "RVFW", color: "#60a5fa", read: (s) => s.freeCalciumUMByWall.RVFW },
          ]}
          eventMarkers
        />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          {presentation.run.kind === "bundled-p1-seed"
            ? "Numerical P1 seed"
            : "Open transient"}
        </span>
        {" · "}
        {presentation.trace.length} accepted endpoints
        {" · "}
        TBV error ≤ {presentation.run.maximumTotalBloodVolumeErrorMl.toExponential(2)} mL
        {" · "}
        coronary ledger ≤ {presentation.run.maximumCoronaryBloodVolumeLedgerResidualMl.toExponential(2)} mL
      </div>
    </div>
  );
}

type Trace = readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];

function LineChart({
  title,
  unit,
  trace,
  series,
  eventMarkers = false,
}: Readonly<{
  title: string;
  unit: string;
  trace: Trace;
  series: readonly Readonly<{
    label: string;
    color: string;
    read: (sample: Trace[number]) => number;
  }>[];
  eventMarkers?: boolean;
}>) {
  const width = 640;
  const height = 260;
  const pad = { left: 48, right: 16, top: 22, bottom: 28 };
  const values = series.flatMap(({ read }) => trace.map(read));
  const [yMin, yMax] = paddedDomain(values);
  const x = (phase: number) =>
    pad.left + phase * (width - pad.left - pad.right);
  const y = (value: number) =>
    height - pad.bottom
    - ((value - yMin) / (yMax - yMin))
      * (height - pad.top - pad.bottom);
  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-200">{title}</span>
        <span className="text-[11px] text-slate-500">{unit} · phase 0–1</span>
      </figcaption>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pb-2">
        {series.map(({ label, color }) => (
          <span key={label} className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        <ChartGrid
          width={width}
          height={height}
          pad={pad}
          yMin={yMin}
          yMax={yMax}
        />
        {eventMarkers && trace.map((sample, index) => {
          const event = sample.acceptedEventIdentity;
          if (
            event.atrialCapturedActivationId === null
            && event.ventricularCapturedActivationId === null
          ) return null;
          return (
            <line
              key={`event-${index}`}
              x1={x(sample.cyclePhase01)}
              x2={x(sample.cyclePhase01)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke={event.ventricularCapturedActivationId === null
                ? "#2dd4bf"
                : "#f43f5e"}
              strokeDasharray="4 4"
              opacity="0.7"
            />
          );
        })}
        {series.map(({ label, color, read }) => (
          <path
            key={label}
            d={trace.map((sample, index) =>
              `${index === 0 ? "M" : "L"} ${x(sample.cyclePhase01)} ${y(read(sample))}`,
            ).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </figure>
  );
}

function PvLoop({ trace }: Readonly<{ trace: Trace }>) {
  const width = 640;
  const height = 260;
  const pad = { left: 52, right: 16, top: 18, bottom: 32 };
  const volumes = trace.map((sample) => sample.chamberVolumeMl.LV);
  const pressures = trace.map((sample) => sample.absolutePressureMmHg.LV);
  const [xMin, xMax] = paddedDomain(volumes);
  const [yMin, yMax] = paddedDomain(pressures);
  const x = (value: number) =>
    pad.left + ((value - xMin) / (xMax - xMin))
      * (width - pad.left - pad.right);
  const y = (value: number) =>
    height - pad.bottom - ((value - yMin) / (yMax - yMin))
      * (height - pad.top - pad.bottom);
  const path = trace.map((sample, index) =>
    `${index === 0 ? "M" : "L"} ${x(sample.chamberVolumeMl.LV)} ${y(sample.absolutePressureMmHg.LV)}`,
  ).join(" ");
  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <figcaption className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-200">LV pressure–volume loop</span>
        <span className="text-[11px] text-slate-500">mL / mmHg</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        <rect
          x={pad.left}
          y={pad.top}
          width={width - pad.left - pad.right}
          height={height - pad.top - pad.bottom}
          fill="#020617"
          stroke="#334155"
        />
        <path d={`${path} Z`} fill="#f43f5e18" stroke="#fb7185" strokeWidth="2" />
        <text x={pad.left} y={height - 8} fill="#64748b" fontSize="11">
          {xMin.toFixed(0)}
        </text>
        <text x={width - pad.right} y={height - 8} textAnchor="end" fill="#64748b" fontSize="11">
          {xMax.toFixed(0)} mL
        </text>
        <text x={8} y={pad.top + 8} fill="#64748b" fontSize="11">
          {yMax.toFixed(0)}
        </text>
        <text x={8} y={height - pad.bottom} fill="#64748b" fontSize="11">
          {yMin.toFixed(0)}
        </text>
      </svg>
    </figure>
  );
}

function ChartGrid({
  width,
  height,
  pad,
  yMin,
  yMax,
}: Readonly<{
  width: number;
  height: number;
  pad: Readonly<{ left: number; right: number; top: number; bottom: number }>;
  yMin: number;
  yMax: number;
}>) {
  return (
    <>
      <rect
        x={pad.left}
        y={pad.top}
        width={width - pad.left - pad.right}
        height={height - pad.top - pad.bottom}
        fill="#020617"
        stroke="#334155"
      />
      {[0.25, 0.5, 0.75].map((fraction) => (
        <React.Fragment key={fraction}>
          <line
            x1={pad.left + fraction * (width - pad.left - pad.right)}
            x2={pad.left + fraction * (width - pad.left - pad.right)}
            y1={pad.top}
            y2={height - pad.bottom}
            stroke="#1e293b"
          />
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + fraction * (height - pad.top - pad.bottom)}
            y2={pad.top + fraction * (height - pad.top - pad.bottom)}
            stroke="#1e293b"
          />
        </React.Fragment>
      ))}
      <text x={8} y={pad.top + 8} fill="#64748b" fontSize="11">
        {yMax.toFixed(1)}
      </text>
      <text x={8} y={height - pad.bottom} fill="#64748b" fontSize="11">
        {yMin.toFixed(1)}
      </text>
      <text x={pad.left} y={height - 8} fill="#64748b" fontSize="11">0</text>
      <text x={width - pad.right} y={height - 8} textAnchor="end" fill="#64748b" fontSize="11">1</text>
    </>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-slate-100">{value}</div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  detail,
}: Readonly<{ title: string; value: string; detail: string }>) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}

function RuntimeStatus({
  message,
  failed = false,
}: Readonly<{ message: string; failed?: boolean }>) {
  return (
    <div
      className={`flex min-h-80 items-center justify-center rounded-xl border p-8 text-center text-sm ${
        failed
          ? "border-rose-800 bg-rose-950/20 text-rose-300"
          : "border-slate-800 bg-slate-900 text-slate-400"
      }`}
      role="status"
    >
      <div>
        {!failed && (
          <span className="mx-auto mb-4 block h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
        )}
        {message}
      </div>
    </div>
  );
}

function ReleaseIdentity({
  presentation,
}: Readonly<{ presentation: MainWireIntegratedPreviewRunPresentationV2 }>) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs">
      <h2 className="font-bold text-slate-200">Exact model identity</h2>
      <dl className="mt-3 space-y-3 text-slate-400">
        <div>
          <dt className="text-slate-500">Release</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.releaseRef.id}@{presentation.releaseRef.version}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Release SHA-256</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.releaseRef.sha256}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Input SHA-256</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.simulationInputSpecSha256}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Start checkpoint SHA-256</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.startModelStateRef.checkpointSha256}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Terminal checkpoint SHA-256</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.terminalModelStateRef.checkpointSha256}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Run record SHA-256</dt>
          <dd className="mt-1 break-all font-mono">
            {presentation.recordSha256}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function summarize(trace: Trace) {
  const duration = trace.reduce((sum, sample) => sum + sample.acceptedDtSec, 0);
  const lv = trace.map((sample) => sample.chamberVolumeMl.LV);
  const edv = Math.max(...lv);
  const esv = Math.min(...lv);
  const weighted = (
    read: (sample: Trace[number]) => number,
  ) => trace.reduce(
    (sum, sample) => sum + read(sample) * sample.acceptedDtSec,
    0,
  ) / duration;
  return {
    lvef01: (edv - esv) / edv,
    meanAo: weighted((sample) => sample.absolutePressureMmHg.Ao),
    maxPa: Math.max(...trace.map((sample) => sample.absolutePressureMmHg.PA)),
    forwardCo: trace.reduce(
      (sum, sample) =>
        sum
        + Math.max(0, sample.valveFlowMlPerSec.AoV)
          * sample.acceptedDtSec,
      0,
    ) * 60 / duration / 1_000,
    meanCoronary: weighted((sample) => sample.coronary.totalInletFlowMlPerSec),
    meanLvad: weighted(
      (sample) => sample.dynamicMcsAcceptedFlowMlPerSec.LVAD,
    ) * 0.06,
  };
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum;
  const padding = span > 0 ? span * 0.08 : Math.max(1, Math.abs(maximum) * 0.1);
  return [minimum - padding, maximum + padding];
}

function downloadRunRecord(
  runRecord: MainWireIntegratedPreviewRunRecordV2,
): void {
  const blob = new Blob([`${JSON.stringify(runRecord)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    `circleheart-integrated-run-record-${runRecord.recordSha256.slice(0, 12)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

import React from 'react';

import type {
  MainWireScientificObservableFrameV1,
} from '@/engine/scientific/observables';
import type { SimulationReleaseRef } from '@/engine/scientific/release';
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificSessionOriginV1,
} from '@/engine/scientific/worker';
import {
  MainWireScientificWorkerClientV1,
} from '@/engine/scientificBrowser';

import {
  ScientificAlphaPvTrajectories,
  ScientificAlphaWaveforms,
} from './ScientificRuntimeAlphaPlots';
import {
  SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC,
  SCIENTIFIC_ALPHA_DT_SEC,
  SCIENTIFIC_ALPHA_HISTORY_CAPACITY,
  SCIENTIFIC_ALPHA_STEPS_PER_CHUNK,
  SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC,
  appendBoundedScientificAlphaHistoryV1,
  selectTerminalScientificAlphaHistoryV1,
} from './scientificRuntimeAlphaHistoryV1';

const MAXIMUM_TRANSIENT_COMMANDS_PER_ALPHA_SESSION = 7_600;
const ALPHA_RENDER_EVERY_TRANSIENT_COMMANDS = 8;

type AlphaPhase = 'starting' | 'ready' | 'running' | 'paused' | 'failed';
type AlphaRunMode = 'idle' | 'continuous' | 'single-beat';

type AlphaState = Readonly<{
  phase: AlphaPhase;
  message: string;
  releaseRef: SimulationReleaseRef | null;
  sessionOrigin: ScientificSessionOriginV1 | null;
  history: readonly MainWireScientificObservableFrameV1[];
  transientCommandCount: number;
}>;

const INITIAL_STATE: AlphaState = Object.freeze({
  phase: 'starting',
  message: 'Creating the canonical cold-start session.',
  releaseRef: null,
  sessionOrigin: null,
  history: Object.freeze([]),
  transientCommandCount: 0,
});

/**
 * Explicit, non-default integration seam for the release-bound scientific
 * runtime. This page owns one real module Worker and has no legacy ModelCore
 * import, backend selector, or fallback path.
 */
export default function ScientificRuntimeAlphaPage() {
  const [sessionEpoch, setSessionEpoch] = React.useState(0);
  const [state, setState] = React.useState<AlphaState>(INITIAL_STATE);
  const [requestBusy, setRequestBusy] = React.useState(false);
  const clientRef = React.useRef<MainWireScientificWorkerClientV1 | null>(null);
  const generationRef = React.useRef(0);
  const requestSerialRef = React.useRef(0);
  const transientCommandCountRef = React.useRef(0);
  const historyRef = React.useRef<readonly MainWireScientificObservableFrameV1[]>(
    Object.freeze([]),
  );
  const latestFrameRef = React.useRef<MainWireScientificObservableFrameV1 | null>(null);
  const runModeRef = React.useRef<AlphaRunMode>('idle');
  const beatTargetTimeSecRef = React.useRef<number | null>(null);
  const requestInFlightRef = React.useRef(false);
  const pumpRef = React.useRef<(generation: number) => void>(() => undefined);

  const failClosed = React.useCallback((generation: number, error: unknown) => {
    if (generation !== generationRef.current) return;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    setRequestBusy(false);
    setState((previous) => ({
      ...previous,
      phase: 'failed',
      message: error instanceof Error ? error.message : String(error),
    }));
  }, []);

  const pump = React.useCallback(async (generation: number): Promise<void> => {
    if (
      generation !== generationRef.current
      || runModeRef.current === 'idle'
      || requestInFlightRef.current
    ) return;
    const client = clientRef.current;
    if (client === null) return;
    if (
      transientCommandCountRef.current
        >= MAXIMUM_TRANSIENT_COMMANDS_PER_ALPHA_SESSION
    ) {
      runModeRef.current = 'idle';
      beatTargetTimeSecRef.current = null;
      setRequestBusy(false);
      setState((previous) => ({
        ...previous,
        phase: 'paused',
        message: 'Bounded request budget reached. Reset to start a fresh Worker session.',
        history: historyRef.current,
        transientCommandCount: transientCommandCountRef.current,
      }));
      return;
    }

    requestInFlightRef.current = true;
    const requestId = requestIdentity(generation, ++requestSerialRef.current);
    transientCommandCountRef.current += 1;
    try {
      const response = await client.request({
        protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
        kind: 'runTransient',
        requestId,
        sessionId: sessionIdentity(generation),
        dtSec: SCIENTIFIC_ALPHA_DT_SEC,
        stepCount: SCIENTIFIC_ALPHA_STEPS_PER_CHUNK,
        observationStride: 1,
      });
      if (generation !== generationRef.current) return;

      if (!response.ok) {
        const partialFrames = response.error.observableFrames;
        if (partialFrames.length > 0) {
          historyRef.current = appendBoundedScientificAlphaHistoryV1(
            historyRef.current,
            partialFrames,
          );
          setState((previous) => ({
            ...previous,
            history: historyRef.current,
            transientCommandCount: transientCommandCountRef.current,
          }));
          latestFrameRef.current = partialFrames.at(-1) ?? latestFrameRef.current;
        }
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }
      if (
        response.commandKind !== 'runTransient'
        || response.payload.kind !== 'transientCompleted'
      ) {
        throw new Error('scientific Worker returned an unexpected transient payload');
      }

      const frames = response.payload.observableFrames;
      const finalFrame = response.payload.finalObservableFrame;
      latestFrameRef.current = finalFrame;
      historyRef.current = appendBoundedScientificAlphaHistoryV1(
        historyRef.current,
        frames,
      );

      const targetTimeSec = beatTargetTimeSecRef.current;
      const completedSingleBeat = (
        runModeRef.current === 'single-beat'
        && targetTimeSec !== null
        && finalFrame.acceptedTimeSec >= targetTimeSec - 1e-12
      );
      if (completedSingleBeat) {
        runModeRef.current = 'idle';
        beatTargetTimeSecRef.current = null;
        setState((previous) => ({
          ...previous,
          phase: 'ready',
          message: `Completed one ${SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC.toFixed(3)} s beat at an accepted chunk boundary.`,
          history: historyRef.current,
          transientCommandCount: transientCommandCountRef.current,
        }));
      } else if (
        !alphaRunModeIsActive(runModeRef.current)
        || transientCommandCountRef.current
          % ALPHA_RENDER_EVERY_TRANSIENT_COMMANDS === 0
      ) {
        setState((previous) => ({
          ...previous,
          history: historyRef.current,
          transientCommandCount: transientCommandCountRef.current,
        }));
      }
    } catch (error: unknown) {
      failClosed(generation, error);
    } finally {
      if (generation !== generationRef.current) return;
      requestInFlightRef.current = false;
      if (alphaRunModeIsActive(runModeRef.current)) {
        window.setTimeout(() => pumpRef.current(generation), 0);
      } else {
        setRequestBusy(false);
      }
    }
  }, [failClosed]);
  pumpRef.current = (generation) => {
    void pump(generation);
  };

  React.useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    requestSerialRef.current = 0;
    transientCommandCountRef.current = 0;
    latestFrameRef.current = null;
    historyRef.current = Object.freeze([]);
    requestInFlightRef.current = false;
    setRequestBusy(false);
    setState(INITIAL_STATE);

    let mounted = true;
    let client: MainWireScientificWorkerClientV1;
    try {
      client = new MainWireScientificWorkerClientV1();
      clientRef.current = client;
    } catch (error: unknown) {
      failClosed(generation, error);
      return undefined;
    }

    void client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: 'createCanonicalSession',
      requestId: requestIdentity(generation, ++requestSerialRef.current),
      sessionId: sessionIdentity(generation),
    }).then((response) => {
      if (!mounted || generation !== generationRef.current) return;
      if (!response.ok) {
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }
      if (
        response.commandKind !== 'createCanonicalSession'
        || response.payload.kind !== 'sessionCreated'
      ) {
        throw new Error('scientific Worker returned an unexpected session payload');
      }
      const frame = response.payload.observableFrame;
      latestFrameRef.current = frame;
      historyRef.current = Object.freeze([frame]);
      setState({
        phase: 'ready',
        message: 'Canonical scientific Worker session is ready.',
        releaseRef: response.releaseRef,
        sessionOrigin: response.sessionOrigin,
        history: historyRef.current,
        transientCommandCount: 0,
      });
    }).catch((error: unknown) => {
      if (!mounted) return;
      failClosed(generation, error);
    });

    return () => {
      mounted = false;
      if (generationRef.current === generation) {
        generationRef.current += 1;
        runModeRef.current = 'idle';
        beatTargetTimeSecRef.current = null;
      }
      if (clientRef.current === client) clientRef.current = null;
      client.terminate();
    };
  }, [failClosed, sessionEpoch]);

  const beginContinuous = () => {
    if (state.phase === 'starting' || state.phase === 'failed') return;
    runModeRef.current = 'continuous';
    beatTargetTimeSecRef.current = null;
    setRequestBusy(true);
    setState((previous) => ({
      ...previous,
      phase: 'running',
      message: 'Running bounded four-step Worker chunks.',
    }));
    pumpRef.current(generationRef.current);
  };

  const runSingleBeat = () => {
    const latest = latestFrameRef.current;
    if (latest === null || state.phase === 'starting' || state.phase === 'failed') return;
    runModeRef.current = 'single-beat';
    beatTargetTimeSecRef.current =
      latest.acceptedTimeSec + SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC;
    setRequestBusy(true);
    setState((previous) => ({
      ...previous,
      phase: 'running',
      message: `Advancing one ${SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC.toFixed(3)} s beat in bounded Worker chunks.`,
    }));
    pumpRef.current(generationRef.current);
  };

  const pause = () => {
    if (state.phase !== 'running') return;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    if (!requestInFlightRef.current) setRequestBusy(false);
    setState((previous) => ({
      ...previous,
      phase: 'paused',
      message: requestInFlightRef.current
        ? 'Pause requested; the in-flight four-step chunk will be retained.'
        : 'Paused at an accepted chunk boundary.',
      history: historyRef.current,
      transientCommandCount: transientCommandCountRef.current,
    }));
  };

  const reset = () => {
    generationRef.current += 1;
    runModeRef.current = 'idle';
    beatTargetTimeSecRef.current = null;
    requestInFlightRef.current = false;
    historyRef.current = Object.freeze([]);
    setRequestBusy(false);
    clientRef.current?.terminate();
    clientRef.current = null;
    setSessionEpoch((value) => value + 1);
  };

  return (
    <section
      className="h-full overflow-auto bg-slate-950 px-4 py-7 text-slate-100 sm:px-6"
      data-scientific-alpha-phase={state.phase}
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Isolated browser integration
          </p>
          <h1 className="text-2xl font-semibold">Scientific runtime alpha</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Release-bound main-wire science in one module Worker. This explicit
            route is not the default Workbench runtime and has no legacy fallback.
          </p>
        </header>

        {state.phase === 'starting' && (
          <StatusPanel tone="pending" title="Starting real scientific Worker…">
            {state.message}
          </StatusPanel>
        )}

        {state.phase === 'failed' && state.releaseRef === null && (
          <>
            <StatusPanel tone="failed" title="Scientific Worker failed closed">
              {state.message}
            </StatusPanel>
            <button type="button" className={secondaryButtonClass} onClick={reset}>
              Reset cold start
            </button>
          </>
        )}

        {state.releaseRef !== null && state.sessionOrigin !== null && (
          <ReadyPanel
            state={state}
            requestBusy={requestBusy}
            onStart={beginContinuous}
            onPause={pause}
            onSingleBeat={runSingleBeat}
            onReset={reset}
          />
        )}
      </div>
    </section>
  );
}

function ReadyPanel({
  state,
  requestBusy,
  onStart,
  onPause,
  onSingleBeat,
  onReset,
}: Readonly<{
  state: AlphaState & Readonly<{
    releaseRef: SimulationReleaseRef;
    sessionOrigin: ScientificSessionOriginV1;
  }>;
  requestBusy: boolean;
  onStart: () => void;
  onPause: () => void;
  onSingleBeat: () => void;
  onReset: () => void;
}>) {
  const frame = state.history.at(-1);
  if (frame === undefined) return null;
  const terminalFrames = selectTerminalScientificAlphaHistoryV1(state.history);
  const values = frame.values;
  const chamberRows = (['LA', 'RA', 'LV', 'RV'] as const).map((chamber) => ({
    chamber,
    volume: values[`hemodynamics.volume.${chamber}`],
    pressure: values[`hemodynamics.pressure.absolute.${chamber}`],
  }));
  const running = state.phase === 'running';

  return (
    <div className="space-y-7" data-testid="scientific-alpha-ready">
      <StatusPanel
        tone={state.phase === 'failed' ? 'failed' : running ? 'running' : 'ready'}
        title={state.phase === 'failed'
          ? 'Scientific Worker failed closed'
          : running
            ? 'Scientific Worker running'
            : 'Scientific Worker ready'}
      >
        {state.message}
      </StatusPanel>

      <div className="flex flex-wrap items-center gap-2" aria-label="Scientific simulation controls">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={onStart}
          disabled={running || requestBusy || state.phase === 'failed'}
        >
          Start
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onPause}
          disabled={!running}
        >
          Pause
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onSingleBeat}
          disabled={running || requestBusy || state.phase === 'failed'}
        >
          Run one beat
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onReset}
        >
          Reset cold start
        </button>
        <span className="ml-auto text-xs text-slate-500" aria-live="polite">
          {requestBusy ? 'Worker request active · ' : ''}
          {state.history.length}/{SCIENTIFIC_ALPHA_HISTORY_CAPACITY} retained · latest{' '}
          {SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC.toFixed(1)} s plotted
        </span>
      </div>

      <dl className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Metadata label="Accepted time" value={`${format(frame.acceptedTimeSec, 3)} s`} />
        <Metadata label="Revision" value={String(frame.revision)} />
        <Metadata label="Worker chunks" value={String(state.transientCommandCount)} />
        <Metadata label="Terminal samples" value={String(terminalFrames.length)} />
        <Metadata label="Release" value={`${state.releaseRef.id} v${state.releaseRef.version}`} wide />
        <Metadata label="Session origin" value={state.sessionOrigin.kind} wide />
        <Metadata label="Release SHA-256" value={state.releaseRef.sha256} full />
      </dl>

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Chamber</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Absolute pressure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/40">
            {chamberRows.map(({ chamber, volume, pressure }) => (
              <tr key={chamber}>
                <th className="px-4 py-3 font-medium text-slate-200">{chamber}</th>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {formatObservable(volume.value, volume.availability, 'mL')}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {formatObservable(pressure.value, pressure.availability, 'mmHg')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ScientificAlphaPvTrajectories frames={terminalFrames} />
      <ScientificAlphaWaveforms frames={terminalFrames} />
    </div>
  );
}

function StatusPanel({
  tone,
  title,
  children,
}: React.PropsWithChildren<Readonly<{
  tone: 'pending' | 'ready' | 'running' | 'failed';
  title: string;
}>>) {
  const toneClasses = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    running: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    failed: 'border-red-500/30 bg-red-500/10 text-red-100',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`} role="status">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-80">{children}</p>
    </div>
  );
}

function Metadata({
  label,
  value,
  wide = false,
  full = false,
}: Readonly<{
  label: string;
  value: string;
  wide?: boolean;
  full?: boolean;
}>) {
  const columnClass = full
    ? 'min-w-0 sm:col-span-2 lg:col-span-4'
    : wide
      ? 'min-w-0 sm:col-span-1 lg:col-span-2'
      : 'min-w-0';
  return (
    <div className={columnClass}>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-slate-200">{value}</dd>
    </div>
  );
}

const primaryButtonClass = [
  'rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950',
  'hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

const secondaryButtonClass = [
  'rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200',
  'hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

function requestIdentity(generation: number, serial: number): string {
  return `browser-scientific-alpha-g${generation}-request-${serial}`;
}

function sessionIdentity(generation: number): string {
  return `browser-scientific-alpha-session-g${generation}`;
}

function alphaRunModeIsActive(runMode: AlphaRunMode): boolean {
  return runMode !== 'idle';
}

function formatObservable(
  value: number | null,
  availability: string,
  unit: string,
): string {
  return value === null ? availability : `${format(value, 2)} ${unit}`;
}

function format(value: number, digits: number): string {
  return value.toFixed(digits);
}

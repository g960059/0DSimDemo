import React from 'react';

import {
  MainWireScientificWorkerClientV1,
} from '@/engine/scientificBrowser';
import {
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
  type ScientificCommandSuccessResponseForKindV1,
} from '@/engine/scientific/worker';
import type {
  MainWireScientificObservableFrameV1,
} from '@/engine/scientific/observables';

const ALPHA_SESSION_ID = 'browser-scientific-alpha-session-v1';
const CREATE_REQUEST_ID = 'browser-scientific-alpha-create-v1';

type AlphaReadyResponse = ScientificCommandSuccessResponseForKindV1<
  MainWireScientificObservableFrameV1,
  'createCanonicalSession'
>;

type AlphaState =
  | Readonly<{ phase: 'starting' }>
  | Readonly<{ phase: 'ready'; response: AlphaReadyResponse }>
  | Readonly<{ phase: 'failed'; message: string }>;

/**
 * Explicit, non-default integration seam for the release-bound scientific
 * runtime. This page owns one real module Worker and has no legacy ModelCore
 * import, backend selector, or fallback path.
 */
export default function ScientificRuntimeAlphaPage() {
  const [state, setState] = React.useState<AlphaState>({ phase: 'starting' });

  React.useEffect(() => {
    let mounted = true;
    let client: MainWireScientificWorkerClientV1;
    try {
      client = new MainWireScientificWorkerClientV1();
    } catch (error: unknown) {
      setState({
        phase: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }

    void client.request({
      protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
      kind: 'createCanonicalSession',
      requestId: CREATE_REQUEST_ID,
      sessionId: ALPHA_SESSION_ID,
    }).then((response) => {
      if (!mounted) return;
      if (!response.ok) {
        throw new Error(`${response.error.code}: ${response.error.message}`);
      }
      if (
        response.commandKind !== 'createCanonicalSession'
        || response.payload.kind !== 'sessionCreated'
      ) {
        throw new Error('scientific Worker returned an unexpected command payload');
      }
      setState({ phase: 'ready', response });
    }).catch((error: unknown) => {
      if (!mounted) return;
      setState({
        phase: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      mounted = false;
      client.terminate();
    };
  }, []);

  return (
    <section
      className="h-full overflow-auto bg-slate-950 px-5 py-8 text-slate-100"
      data-scientific-alpha-phase={state.phase}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Isolated browser integration
          </p>
          <h1 className="text-2xl font-semibold">Scientific runtime alpha</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            This explicit route starts the release-bound main-wire scientific
            core in a module Worker. It is not the default Workbench runtime.
          </p>
        </header>

        {state.phase === 'starting' && (
          <StatusPanel tone="pending" title="Starting real scientific Worker…">
            Creating the canonical cold-start session.
          </StatusPanel>
        )}

        {state.phase === 'failed' && (
          <StatusPanel tone="failed" title="Scientific Worker failed closed">
            {state.message}
          </StatusPanel>
        )}

        {state.phase === 'ready' && <ReadyPanel response={state.response} />}
      </div>
    </section>
  );
}

function ReadyPanel({ response }: Readonly<{ response: AlphaReadyResponse }>) {
  const frame = response.payload.observableFrame;
  const release = response.releaseRef;
  const values = frame.values;
  const chamberRows = (['LA', 'RA', 'LV', 'RV'] as const).map((chamber) => ({
    chamber,
    volume: values[`hemodynamics.volume.${chamber}`],
    pressure: values[`hemodynamics.pressure.absolute.${chamber}`],
  }));

  return (
    <div className="space-y-5" data-testid="scientific-alpha-ready">
      <StatusPanel tone="ready" title="Scientific Worker ready">
        Canonical session revision {frame.revision} at {format(frame.acceptedTimeSec, 3)} s.
      </StatusPanel>

      <dl className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm sm:grid-cols-2">
        <Metadata label="Release" value={`${release.id} v${release.version}`} />
        <Metadata label="Session origin" value={response.sessionOrigin.kind} />
        <Metadata label="Release SHA-256" value={release.sha256} wide />
        <Metadata label="Observable registry" value={frame.registryId} wide />
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
    </div>
  );
}

function StatusPanel({
  tone,
  title,
  children,
}: React.PropsWithChildren<Readonly<{
  tone: 'pending' | 'ready' | 'failed';
  title: string;
}>>) {
  const toneClasses = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
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
}: Readonly<{ label: string; value: string; wide?: boolean }>) {
  return (
    <div className={wide ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-slate-200">{value}</dd>
    </div>
  );
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

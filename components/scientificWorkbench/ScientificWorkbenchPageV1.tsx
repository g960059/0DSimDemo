import React from "react";

import {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";

import { ScientificWorkspaceRendererV1 } from "./ScientificWorkspaceRendererV1";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
} from "./scientificWorkbenchTerminalCycleV1";
import {
  loadScientificWorkbenchOfficialCycleV1,
  type ScientificWorkbenchOfficialCycleV1,
} from "./scientificWorkbenchOfficialCycleV1";

type ScientificWorkbenchPageStateV1 =
  | Readonly<{
    phase: "loading";
    message: string;
  }>
  | Readonly<{
    phase: "ready";
    result: ScientificWorkbenchOfficialCycleV1;
  }>
  | Readonly<{
    phase: "failed";
    message: string;
  }>;

let sessionOrdinal = 0;

/**
 * Document-bound scientific presentation route. It intentionally exposes no
 * legacy backend selector, free parameter controls, persistence, or mutation
 * surface while the new runtime remains behind explicit validation gates.
 */
export default function ScientificWorkbenchPageV1() {
  const [state, setState] = React.useState<ScientificWorkbenchPageStateV1>({
    phase: "loading",
    message: "Verifying the official V3 case and restoring its exact P1 state…",
  });

  React.useEffect(() => {
    const client = new MainWireScientificWorkerClientV1({
      maximumPendingRequestCount: 1,
      maximumRequestCountPerClientLifetime: 160,
    });
    const sessionId = nextScientificWorkbenchSessionId();
    let active = true;

    void loadScientificWorkbenchOfficialCycleV1(client, { sessionId })
      .then((result) => {
        if (active) setState({ phase: "ready", result });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            phase: "failed",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      })
      .finally(() => {
        client.terminate();
      });

    return () => {
      active = false;
      client.terminate();
    };
  }, []);

  return (
    <main
      className="h-full overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
      data-testid="scientific-workbench-page-v1"
    >
      <header className="mx-auto mb-6 max-w-[1600px] space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
              Scientific runtime · document-bound preview
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Official healthy periodic workspace
            </h1>
          </div>
          <span className="rounded-full border border-amber-700/70 bg-amber-950/40 px-3 py-1 text-xs text-amber-200">
            Research reference · not clinical validation
          </span>
        </div>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          One immutable release, resolved input, exact V3 checkpoint, case, and
          presentation workspace. The plots use accepted-state samples only;
          unavailable values remain unavailable and no smoothing or
          interpolation is applied.
        </p>
      </header>

      <div className="mx-auto max-w-[1600px]">
        {state.phase === "loading" && (
          <StatusPanel tone="neutral" role="status" title="Loading verified case">
            {state.message}
          </StatusPanel>
        )}
        {state.phase === "failed" && (
          <StatusPanel tone="danger" role="alert" title="Scientific workspace unavailable">
            {state.message}
          </StatusPanel>
        )}
        {state.phase === "ready" && (
          <ScientificWorkbenchReadyV1 result={state.result} />
        )}
      </div>
    </main>
  );
}

function ScientificWorkbenchReadyV1({
  result,
}: Readonly<{ result: ScientificWorkbenchOfficialCycleV1 }>) {
  const { terminalCycle, workspaceDocument, sessionOrigin } = result;
  return (
    <div className="space-y-5">
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Scientific workspace provenance"
      >
        <EvidenceCard
          label="Periodic evidence"
          value="Terminal P1 confirmed"
          detail="Exact restore; confirmation advanced 0 steps"
        />
        <EvidenceCard
          label="Captured cycle"
          value={`${terminalCycle.frames.length} boundary-inclusive frames`}
          detail={`${SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec * 1_000} ms cadence · ${terminalCycle.durationSec.toFixed(3)} s`}
        />
        <EvidenceCard
          label="Simulation release"
          value={`${terminalCycle.releaseRef.id} ${terminalCycle.releaseRef.version}`}
          detail={shortDigest(terminalCycle.releaseRef.sha256)}
        />
        <EvidenceCard
          label="Case / workspace"
          value={`${shortDigest(sessionOrigin.caseRef.sha256)} / ${shortDigest(workspaceDocument.ref.sha256)}`}
          detail={`checkpoint ${shortDigest(sessionOrigin.checkpointSha256)}`}
        />
      </section>
      <ScientificWorkspaceRendererV1
        workspaceDocument={workspaceDocument}
        frames={terminalCycle.frames}
      />
    </div>
  );
}

function EvidenceCard({
  label,
  value,
  detail,
}: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-100">
        {value}
      </p>
      <p className="mt-1 break-all font-mono text-[10px] text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function StatusPanel({
  tone,
  role,
  title,
  children,
}: React.PropsWithChildren<Readonly<{
  tone: "neutral" | "danger";
  role: "status" | "alert";
  title: string;
}>>) {
  const colors = tone === "danger"
    ? "border-rose-800 bg-rose-950/40 text-rose-100"
    : "border-slate-800 bg-slate-900/60 text-slate-200";
  return (
    <section className={`rounded-xl border p-5 ${colors}`} role={role}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm opacity-80">{children}</p>
    </section>
  );
}

function nextScientificWorkbenchSessionId(): string {
  sessionOrdinal += 1;
  return `scientific-workbench-${Date.now().toString(36)}-${sessionOrdinal}`;
}

function shortDigest(value: string): string {
  return `${value.slice(0, 12)}…`;
}

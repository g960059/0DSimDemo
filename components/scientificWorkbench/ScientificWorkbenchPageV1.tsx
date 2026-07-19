import React from "react";

import {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  type MainWireScientificResearchPresetIdV1,
} from "@/engine/scientific/presets";

import { ScientificWorkspaceRendererV1 } from "./ScientificWorkspaceRendererV1";
import {
  SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
  ScientificWorkbenchResearchControlV0,
  type ScientificWorkbenchResearchControlSourceV0,
} from "./ScientificWorkbenchResearchControlV0";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
} from "./scientificWorkbenchTerminalCycleV1";
import {
  loadScientificWorkbenchOfficialCycleV1,
  type ScientificWorkbenchOfficialCycleV1,
} from "./scientificWorkbenchOfficialCycleV1";
import {
  loadScientificWorkbenchResearchCycleV1,
  type ScientificWorkbenchResearchCycleV1,
} from "./scientificWorkbenchResearchCycleV1";

export const SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1 =
  "official-healthy-periodic" as const;

export type ScientificWorkbenchSelectionV1 =
  | typeof SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
  | MainWireScientificResearchPresetIdV1;

export type ScientificWorkbenchSurfaceV1 = "research" | "product";

export type ScientificWorkbenchPageV1Props = Readonly<{
  surface?: ScientificWorkbenchSurfaceV1;
  initialSelection?: ScientificWorkbenchSelectionV1;
  onSelectionChange?: (selection: ScientificWorkbenchSelectionV1) => void;
}>;

function loadingMessageForSelection(
  selection: ScientificWorkbenchSelectionV1,
): string {
  return selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
    ? "Verifying the official V3 case and restoring its exact P1 state…"
    : "Resolving the research Case and starting an independent cold periodic run…";
}

export type ScientificWorkbenchReadyResultV1 =
  | Readonly<{
    kind: "official";
    result: ScientificWorkbenchOfficialCycleV1;
  }>
  | Readonly<{
    kind: "research";
    result: ScientificWorkbenchResearchCycleV1;
  }>;

type ScientificWorkbenchPageStateV1 =
  | Readonly<{
    phase: "loading";
    message: string;
  }>
  | Readonly<{
    phase: "ready";
    result: ScientificWorkbenchReadyResultV1;
    runtime: Readonly<{
      client: MainWireScientificWorkerClientV1;
      sessionId: string;
    }> | null;
  }>
  | Readonly<{
    phase: "failed";
    message: string;
  }>;

let sessionOrdinal = 0;

/**
 * Document-bound scientific presentation route. Its sole mutation surface is
 * the release-bound research controller; legacy backends, arbitrary patches,
 * and persistence remain outside this runtime.
 */
export default function ScientificWorkbenchPageV1({
  surface = "research",
  initialSelection = SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1,
  onSelectionChange,
}: ScientificWorkbenchPageV1Props = {}) {
  const [selection, setSelection] =
    React.useState<ScientificWorkbenchSelectionV1>(initialSelection);
  const [state, setState] = React.useState<ScientificWorkbenchPageStateV1>({
    phase: "loading",
    message: loadingMessageForSelection(initialSelection),
  });
  const [transitionActive, setTransitionActive] = React.useState(false);

  React.useEffect(() => {
    const client = new MainWireScientificWorkerClientV1({
      maximumPendingRequestCount: 1,
      // Official load consumes 127 requests. Repeated warm forks, bounded
      // settlement, following-cycle capture, and live accepted-step commands
      // deliberately share one long-lived Worker/client.
      maximumRequestCountPerClientLifetime:
        SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
    });
    const sessionId = nextScientificWorkbenchSessionId();
    let active = true;

    setState({
      phase: "loading",
      message: loadingMessageForSelection(selection),
    });
    setTransitionActive(false);

    const load = selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
      ? loadScientificWorkbenchOfficialCycleV1(client, { sessionId }).then(
        (result): ScientificWorkbenchReadyResultV1 => Object.freeze({
          kind: "official" as const,
          result,
        }),
      )
      : loadScientificWorkbenchResearchCycleV1(client, {
        sessionId,
        presetId: selection,
        onProgress: (progress) => {
          if (active) {
            setState({
              phase: "loading",
              message: progress.status === "period1-converged"
                ? `P1 convergence confirmed after ${progress.completedBeatCount} beats. Capturing the following complete cycle…`
                : `Periodic settling: beat ${progress.completedBeatCount}/${progress.maximumBeatCount}. No steady plot is shown before P1 convergence.`,
            });
          }
        },
      }).then(
        (result): ScientificWorkbenchReadyResultV1 => Object.freeze({
          kind: "research" as const,
          result,
        }),
      );

    void load
      .then((result) => {
        if (active) {
          const runtime = result.kind === "official"
            ? Object.freeze({ client, sessionId })
            : null;
          if (runtime === null) client.terminate();
          setState({
            phase: "ready",
            result,
            runtime,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          client.terminate();
          setState({
            phase: "failed",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      active = false;
      client.terminate();
    };
  }, [selection]);

  const selectedResearch =
    selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
    ? null
    : MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.find(
      (entry) => entry.presetId === selection,
    ) ?? null;

  return (
    <main
      className="h-full overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
      data-testid={surface === "product"
        ? "product-workbench-page-v1"
        : "scientific-workbench-page-v1"}
    >
      <header className="mx-auto mb-6 max-w-[1600px] space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
              {surface === "product"
                ? "Circulation workbench"
                : "Scientific runtime · document-bound preview"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {selectedResearch?.displayName ?? (surface === "product"
                ? "Healthy adult circulation"
                : "Official healthy periodic workspace")}
            </h1>
          </div>
          <span className="rounded-full border border-amber-700/70 bg-amber-950/40 px-3 py-1 text-xs text-amber-200">
            {surface === "product"
              ? "Research simulation · not medical advice"
              : selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
                ? "Official catalog reference · not clinical validation"
                : "Built-in research bracket · not diagnosis"}
          </span>
        </div>
        <p className="max-w-4xl text-sm leading-6 text-slate-400">
          {surface === "product"
            ? selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
              ? "Explore a verified healthy-adult baseline and compare how the circulation responds to controlled changes."
              : "Explore a built-in research scenario after it reaches a stable periodic state."
            : selection === SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1
              ? "One immutable base release, resolved input, exact V3 checkpoint, case, and presentation workspace. Transitioned data remains linked to this ancestry while its displayed evidence and control identity are reported separately below."
              : "One immutable release and content-addressed Preset, Case, resolved input, and presentation Workspace. Research cases start independently from cold state and are plotted only after numerical P1 convergence."}
          {" "}{surface === "product"
            ? "Charts show accepted simulation states without smoothing or interpolation."
            : "Plots use accepted-state samples only; unavailable values remain unavailable and no smoothing or interpolation is applied."}
        </p>
        <label className="block max-w-xl text-sm text-slate-300">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {surface === "product" ? "Scenario" : "Document-bound case"}
          </span>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500 focus:ring-2"
            data-testid="scientific-workbench-case-selector-v1"
            value={selection}
            disabled={transitionActive}
            onChange={(event) => {
              const nextSelection =
                event.currentTarget.value as ScientificWorkbenchSelectionV1;
              // Clear the previous Case before the selection-change commit;
              // the new Worker is created by the selection-bound effect.
              setState({
                phase: "loading",
                message: loadingMessageForSelection(nextSelection),
              });
              if (onSelectionChange !== undefined) {
                onSelectionChange(nextSelection);
              } else {
                setSelection(nextSelection);
              }
            }}
          >
            <option value={SCIENTIFIC_WORKBENCH_OFFICIAL_SELECTION_V1}>
              {surface === "product"
                ? "Healthy adult baseline"
                : "Official healthy periodic — exact V3 restore"}
            </option>
            <optgroup label={surface === "product"
              ? "Research scenarios — not diagnosis"
              : "Research brackets — not diagnosis"}>
              {MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries
                .filter((entry) => surface === "research"
                  || entry.presetId !== "main-wire/healthy-cold")
                .map(
                (entry) => (
                  <option key={entry.presetId} value={entry.presetId}>
                    {entry.displayName}
                  </option>
                ),
              )}
            </optgroup>
          </select>
        </label>
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
          <ScientificWorkbenchReadyV1
            result={state.result}
            runtime={state.runtime ?? undefined}
            surface={surface}
            onTransitionActivityChange={setTransitionActive}
          />
        )}
      </div>
    </main>
  );
}

export function ScientificWorkbenchReadyV1({
  result,
  runtime,
  surface = "research",
  onTransitionActivityChange,
}: Readonly<{
  result: ScientificWorkbenchReadyResultV1;
  runtime?: Readonly<{
    client: MainWireScientificWorkerClientV1;
    sessionId: string;
  }>;
  surface?: ScientificWorkbenchSurfaceV1;
  onTransitionActivityChange?: (active: boolean) => void;
}>) {
  const { terminalCycle, workspaceDocument, sessionOrigin } = result.result;
  const official = result.kind === "official";
  const periodicValue = result.kind === "official"
    ? "Terminal P1 confirmed"
    : `P1 converged after ${result.result.completedBeatCount} beats`;
  const provenanceDetail = result.kind === "official"
    ? `checkpoint ${shortDigest(result.result.sessionOrigin.checkpointSha256)}`
    : `${shortDigest(result.result.sessionOrigin.presetRef.sha256)} · input ${shortDigest(result.result.sessionOrigin.sessionInputSha256)}`;
  const controlSource = React.useMemo<
    ScientificWorkbenchResearchControlSourceV0 | null
  >(() => result.kind === "official" && runtime !== undefined
    ? Object.freeze({
      sessionId: runtime.sessionId,
      context: result.result.researchControlContext,
      frames: result.result.terminalCycle.frames,
    })
    : null, [result, runtime]);
  return (
    <div className="space-y-5">
      <ScientificWorkbenchEvidenceV1
        result={result}
        surface={surface}
        periodicValue={periodicValue}
        provenanceDetail={provenanceDetail}
      />
      {!official && (
        <section className="rounded-xl border border-sky-900/80 bg-sky-950/30 px-4 py-3 text-sm text-sky-100">
          Built-in research bracket only. It is not an official healthy case,
          clinical diagnosis, patient-specific fit, or clinical validation.
        </section>
      )}
      {controlSource !== null && runtime !== undefined ? (
        <ScientificWorkbenchResearchControlV0
          client={runtime.client}
          workspaceDocument={workspaceDocument}
          initialSource={controlSource}
          surface={surface}
          onTransitionActivityChange={onTransitionActivityChange}
        />
      ) : (
        <ScientificWorkspaceRendererV1
          workspaceDocument={workspaceDocument}
          frames={terminalCycle.frames}
        />
      )}
    </div>
  );
}

function ScientificWorkbenchEvidenceV1({
  result,
  surface,
  periodicValue,
  provenanceDetail,
}: Readonly<{
  result: ScientificWorkbenchReadyResultV1;
  surface: ScientificWorkbenchSurfaceV1;
  periodicValue: string;
  provenanceDetail: string;
}>) {
  const { terminalCycle, workspaceDocument, sessionOrigin } = result.result;
  const official = result.kind === "official";
  const cards = (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Scientific workspace base ancestry"
    >
      <EvidenceCard
        label="Initial source periodic evidence"
        value={periodicValue}
        detail={official
          ? "Initial exact restore; confirmation advanced 0 steps"
          : "Independent cold start; whole-beat numerical closure"}
      />
      <EvidenceCard
        label="Initial source captured cycle"
        value={`${terminalCycle.frames.length} boundary-inclusive frames`}
        detail={`${SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec * 1_000} ms cadence · ${terminalCycle.durationSec.toFixed(3)} s`}
      />
      <EvidenceCard
        label="Base simulation release"
        value={`${terminalCycle.releaseRef.id} ${terminalCycle.releaseRef.version}`}
        detail={shortDigest(terminalCycle.releaseRef.sha256)}
      />
      <EvidenceCard
        label={official
          ? "Base case / workspace"
          : "Base preset / case / workspace"}
        value={`${shortDigest(sessionOrigin.caseRef.sha256)} / ${shortDigest(workspaceDocument.ref.sha256)}`}
        detail={provenanceDetail}
      />
    </section>
  );
  if (surface === "research") return cards;
  return (
    <details className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-300">
        Model and simulation details
      </summary>
      <div className="mt-3">{cards}</div>
    </details>
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

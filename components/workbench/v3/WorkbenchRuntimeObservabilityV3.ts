export const WORKBENCH_RUNTIME_OBSERVATION_EVENT_V3 =
  "circleheart:workbench-runtime-observation-v3";

export type WorkbenchRuntimeObservationOutcomeV3 =
  | "completed"
  | "failed"
  | "cancelled";

export type WorkbenchBackgroundWorkerLeaseKindV3 =
  | "warm"
  | "regular"
  | "foreground-burst";

export type WorkbenchBackgroundWorkerJobObservationV3 = Readonly<{
  kind: "background-worker-job";
  scheduledPriority: "snapshot" | "save" | "analysis" | "prewarm";
  finalPriority: "snapshot" | "save" | "analysis" | "prewarm";
  promoted: boolean;
  leaseKind: WorkbenchBackgroundWorkerLeaseKindV3 | null;
  queueDepthAtSchedule: number;
  queueDurationMs: number;
  executionDurationMs: number | null;
  totalDurationMs: number;
  outcome: WorkbenchRuntimeObservationOutcomeV3;
}>;

export type WorkbenchSteadyCandidateSelectionObservationV3 = Readonly<{
  kind: "steady-candidate-selection";
  consumer: "snapshot" | "analysis";
  result: "reused" | "click-capture-fallback";
  scenarioId: string;
  inputEpoch: number;
  candidateAgeMs: number | null;
  convergence: "bounded-warm-start" | "observed-period1" | "cycle-cap" | null;
}>;

export type WorkbenchSteadyCandidateComputationObservationV3 = Readonly<{
  kind: "steady-candidate-computation";
  scenarioId: string;
  inputEpoch: number;
  requestedPriority: "snapshot" | "analysis" | "prewarm";
  durationMs: number;
  outcome: WorkbenchRuntimeObservationOutcomeV3;
  convergence: "bounded-warm-start" | "observed-period1" | "cycle-cap" | null;
  completedCycleCount: number | null;
}>;

export type WorkbenchSnapshotPhaseV3 =
  | "intent-capture"
  | "candidate-selection"
  | "admission"
  | "persistence"
  | "publication"
  | "total";

export type WorkbenchSnapshotPhaseObservationV3 = Readonly<{
  kind: "snapshot-phase";
  purpose: "publication" | "article";
  phase: WorkbenchSnapshotPhaseV3;
  scenarioCount: number;
  durationMs: number;
  outcome: Extract<WorkbenchRuntimeObservationOutcomeV3, "completed" | "failed">;
}>;

export type WorkbenchRuntimeObservationV3 =
  | WorkbenchBackgroundWorkerJobObservationV3
  | WorkbenchSteadyCandidateSelectionObservationV3
  | WorkbenchSteadyCandidateComputationObservationV3
  | WorkbenchSnapshotPhaseObservationV3;

export type WorkbenchRuntimeObserverV3 =
  (observation: WorkbenchRuntimeObservationV3) => void;

export type WorkbenchRuntimeClockV3 = () => number;

export type WorkbenchSnapshotObservationContextV3 = Readonly<{
  purpose: "publication" | "article";
  scenarioCount: number;
}>;

export type WorkbenchSnapshotObservationDependenciesV3 = Readonly<{
  nowMs?: WorkbenchRuntimeClockV3;
  observe?: WorkbenchRuntimeObserverV3;
}>;

export type WorkbenchDurationDistributionV3 = Readonly<{
  sampleCount: number;
  p50Ms: number | null;
  p95Ms: number | null;
  maximumMs: number | null;
}>;

export type WorkbenchRuntimeObservationSummaryV3 = Readonly<{
  backgroundWorkerJobs: Readonly<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    promoted: number;
    foregroundBurst: number;
    queueDuration: WorkbenchDurationDistributionV3;
    executionDuration: WorkbenchDurationDistributionV3;
    byFinalPriority: Readonly<Record<
      "snapshot" | "save" | "analysis" | "prewarm",
      Readonly<{
        total: number;
        queueDuration: WorkbenchDurationDistributionV3;
        executionDuration: WorkbenchDurationDistributionV3;
      }>
    >>;
  }>;
  steadyCandidateComputations: Readonly<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    duration: WorkbenchDurationDistributionV3;
  }>;
  steadyCandidateSelections: Readonly<Record<
    "snapshot" | "analysis",
    Readonly<{
      total: number;
      reused: number;
      reuseRate: number | null;
      reusedCandidateAge: WorkbenchDurationDistributionV3;
    }>
  >>;
  snapshotPhases: Readonly<Partial<Record<
    WorkbenchSnapshotPhaseV3,
    Readonly<{
      completed: number;
      failed: number;
      duration: WorkbenchDurationDistributionV3;
    }>
  >>>;
}>;

/**
 * Monotonic clock for runtime-only latency measurements.
 *
 * Observation timestamps never cross the Experiment/Snapshot boundary and
 * are deliberately unrelated to accepted numerical time.
 */
export function workbenchRuntimeNowMsV3(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

/**
 * Browser transport for opt-in diagnostics collectors.
 *
 * It stores nothing, sends nothing over the network, and cannot make an
 * authoring command fail. Browser QA and a future telemetry adapter can listen
 * for the exported event name without coupling numerical code to a vendor.
 */
export const reportWorkbenchRuntimeObservationV3:
  WorkbenchRuntimeObserverV3 = (observation) => {
    if (typeof window === "undefined" || typeof CustomEvent === "undefined") {
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent(
        WORKBENCH_RUNTIME_OBSERVATION_EVENT_V3,
        { detail: observation },
      ));
    } catch {
      // Observation is never part of numerical or persistence authority.
    }
  };

export function emitWorkbenchRuntimeObservationV3(
  observer: WorkbenchRuntimeObserverV3 | undefined,
  observation: WorkbenchRuntimeObservationV3,
): void {
  if (observer === undefined) return;
  try {
    observer(Object.freeze(observation));
  } catch {
    // An observer must never alter Worker scheduling or Snapshot admission.
  }
}

export async function observeWorkbenchSnapshotPhaseV3<T>(
  context: WorkbenchSnapshotObservationContextV3,
  phase: Exclude<WorkbenchSnapshotPhaseV3, "total">,
  operation: () => T | Promise<T>,
  dependencies: WorkbenchSnapshotObservationDependenciesV3 = {},
): Promise<T> {
  const nowMs = dependencies.nowMs ?? workbenchRuntimeNowMsV3;
  const observer = dependencies.observe ?? reportWorkbenchRuntimeObservationV3;
  const startedAtMs = nowMs();
  try {
    const result = await operation();
    observeSnapshotTerminalPhaseV3(
      observer,
      nowMs,
      context,
      phase,
      startedAtMs,
      "completed",
    );
    return result;
  } catch (error) {
    observeSnapshotTerminalPhaseV3(
      observer,
      nowMs,
      context,
      phase,
      startedAtMs,
      "failed",
    );
    throw error;
  }
}

export function observeWorkbenchSnapshotSynchronousPhaseV3<T>(
  context: WorkbenchSnapshotObservationContextV3,
  phase: Exclude<WorkbenchSnapshotPhaseV3, "total">,
  operation: () => T,
  dependencies: WorkbenchSnapshotObservationDependenciesV3 = {},
): T {
  const nowMs = dependencies.nowMs ?? workbenchRuntimeNowMsV3;
  const observer = dependencies.observe ?? reportWorkbenchRuntimeObservationV3;
  const startedAtMs = nowMs();
  try {
    const result = operation();
    observeSnapshotTerminalPhaseV3(
      observer,
      nowMs,
      context,
      phase,
      startedAtMs,
      "completed",
    );
    return result;
  } catch (error) {
    observeSnapshotTerminalPhaseV3(
      observer,
      nowMs,
      context,
      phase,
      startedAtMs,
      "failed",
    );
    throw error;
  }
}

export function observeWorkbenchSnapshotTotalV3(
  context: WorkbenchSnapshotObservationContextV3,
  startedAtMs: number,
  outcome: "completed" | "failed",
  dependencies: WorkbenchSnapshotObservationDependenciesV3 = {},
): void {
  observeSnapshotTerminalPhaseV3(
    dependencies.observe ?? reportWorkbenchRuntimeObservationV3,
    dependencies.nowMs ?? workbenchRuntimeNowMsV3,
    context,
    "total",
    startedAtMs,
    outcome,
  );
}

/** A bounded test/QA collector; it is never instantiated by durable storage. */
export class WorkbenchRuntimeObservationBufferV3 {
  readonly #capacity: number;
  readonly #observations: WorkbenchRuntimeObservationV3[] = [];

  constructor(capacity = 512) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 10_000) {
      throw new Error("Workbench observation buffer capacity is invalid");
    }
    this.#capacity = capacity;
  }

  readonly observe: WorkbenchRuntimeObserverV3 = (observation) => {
    this.#observations.push(observation);
    if (this.#observations.length > this.#capacity) {
      this.#observations.splice(0, this.#observations.length - this.#capacity);
    }
  };

  read(): readonly WorkbenchRuntimeObservationV3[] {
    return Object.freeze(this.#observations.slice());
  }

  summarize(): WorkbenchRuntimeObservationSummaryV3 {
    return summarizeWorkbenchRuntimeObservationsV3(this.#observations);
  }

  clear(): void {
    this.#observations.splice(0);
  }
}

export function summarizeWorkbenchRuntimeObservationsV3(
  observations: readonly WorkbenchRuntimeObservationV3[],
): WorkbenchRuntimeObservationSummaryV3 {
  const jobs = observations.filter(
    (value): value is WorkbenchBackgroundWorkerJobObservationV3 =>
      value.kind === "background-worker-job",
  );
  const selections = observations.filter(
    (value): value is WorkbenchSteadyCandidateSelectionObservationV3 =>
      value.kind === "steady-candidate-selection",
  );
  const computations = observations.filter(
    (value): value is WorkbenchSteadyCandidateComputationObservationV3 =>
      value.kind === "steady-candidate-computation",
  );
  const snapshotPhases = observations.filter(
    (value): value is WorkbenchSnapshotPhaseObservationV3 =>
      value.kind === "snapshot-phase",
  );

  return Object.freeze({
    backgroundWorkerJobs: Object.freeze({
      total: jobs.length,
      completed: jobs.filter(({ outcome }) => outcome === "completed").length,
      failed: jobs.filter(({ outcome }) => outcome === "failed").length,
      cancelled: jobs.filter(({ outcome }) => outcome === "cancelled").length,
      promoted: jobs.filter(({ promoted }) => promoted).length,
      foregroundBurst: jobs.filter(({ leaseKind }) =>
        leaseKind === "foreground-burst").length,
      queueDuration: durationDistributionV3(
        jobs.map(({ queueDurationMs }) => queueDurationMs),
      ),
      executionDuration: durationDistributionV3(
        jobs.flatMap(({ executionDurationMs }) =>
          executionDurationMs === null ? [] : [executionDurationMs]),
      ),
      byFinalPriority: Object.freeze(Object.fromEntries(
        (["snapshot", "save", "analysis", "prewarm"] as const).map(
          (priority) => {
            const values = jobs.filter((value) =>
              value.finalPriority === priority);
            return [priority, Object.freeze({
              total: values.length,
              queueDuration: durationDistributionV3(
                values.map(({ queueDurationMs }) => queueDurationMs),
              ),
              executionDuration: durationDistributionV3(
                values.flatMap(({ executionDurationMs }) =>
                  executionDurationMs === null ? [] : [executionDurationMs]),
              ),
            })] as const;
          },
        ),
      )) as WorkbenchRuntimeObservationSummaryV3["backgroundWorkerJobs"]["byFinalPriority"],
    }),
    steadyCandidateComputations: Object.freeze({
      total: computations.length,
      completed: computations.filter(({ outcome }) =>
        outcome === "completed").length,
      failed: computations.filter(({ outcome }) => outcome === "failed").length,
      cancelled: computations.filter(({ outcome }) =>
        outcome === "cancelled").length,
      duration: durationDistributionV3(
        computations.map(({ durationMs }) => durationMs),
      ),
    }),
    steadyCandidateSelections: Object.freeze({
      snapshot: candidateSelectionSummaryV3(selections, "snapshot"),
      analysis: candidateSelectionSummaryV3(selections, "analysis"),
    }),
    snapshotPhases: Object.freeze(Object.fromEntries(
      ([
        "intent-capture",
        "candidate-selection",
        "admission",
        "persistence",
        "publication",
        "total",
      ] as const).flatMap((phase) => {
        const values = snapshotPhases.filter((value) => value.phase === phase);
        return values.length === 0
          ? []
          : [[phase, Object.freeze({
              completed: values.filter(({ outcome }) =>
                outcome === "completed").length,
              failed: values.filter(({ outcome }) => outcome === "failed").length,
              duration: durationDistributionV3(
                values.map(({ durationMs }) => durationMs),
              ),
            })] as const];
      }),
    )),
  });
}

export function elapsedWorkbenchRuntimeMsV3(
  startedAtMs: number,
  finishedAtMs: number,
): number {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(finishedAtMs)) return 0;
  return Math.max(0, finishedAtMs - startedAtMs);
}

function candidateSelectionSummaryV3(
  selections: readonly WorkbenchSteadyCandidateSelectionObservationV3[],
  consumer: WorkbenchSteadyCandidateSelectionObservationV3["consumer"],
) {
  const values = selections.filter((value) => value.consumer === consumer);
  const reused = values.filter(({ result }) => result === "reused");
  return Object.freeze({
    total: values.length,
    reused: reused.length,
    reuseRate: values.length === 0 ? null : reused.length / values.length,
    reusedCandidateAge: durationDistributionV3(
      reused.flatMap(({ candidateAgeMs }) =>
        candidateAgeMs === null ? [] : [candidateAgeMs]),
    ),
  });
}

function observeSnapshotTerminalPhaseV3(
  observer: WorkbenchRuntimeObserverV3,
  nowMs: WorkbenchRuntimeClockV3,
  context: WorkbenchSnapshotObservationContextV3,
  phase: WorkbenchSnapshotPhaseV3,
  startedAtMs: number,
  outcome: "completed" | "failed",
): void {
  emitWorkbenchRuntimeObservationV3(observer, {
    kind: "snapshot-phase",
    ...context,
    phase,
    durationMs: elapsedWorkbenchRuntimeMsV3(startedAtMs, nowMs()),
    outcome,
  });
}

function durationDistributionV3(
  values: readonly number[],
): WorkbenchDurationDistributionV3 {
  const sorted = values
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice()
    .sort((left, right) => left - right);
  return Object.freeze({
    sampleCount: sorted.length,
    p50Ms: nearestRankV3(sorted, 0.5),
    p95Ms: nearestRankV3(sorted, 0.95),
    maximumMs: sorted.at(-1) ?? null,
  });
}

function nearestRankV3(
  sorted: readonly number[],
  percentile: number,
): number | null {
  if (sorted.length === 0) return null;
  const index = Math.max(0, Math.ceil(percentile * sorted.length) - 1);
  return sorted[index] ?? null;
}

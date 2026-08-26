export type WorkbenchPerformanceMetricSnapshotV3 = Readonly<{
  count: number;
  meanMs: number;
  p95Ms: number;
  maximumMs: number;
  latestMs: number;
}>;

export type WorkbenchPerformanceValueSnapshotV3 = Readonly<{
  count: number;
  mean: number;
  recentMean: number;
  p05: number;
  p95: number;
  minimum: number;
  maximum: number;
  latest: number;
}>;

export type WorkbenchPerformanceSnapshotV3 = Readonly<{
  enabled: boolean;
  capturedAtMs: number;
  metrics: Readonly<Record<string, WorkbenchPerformanceMetricSnapshotV3>>;
  values: Readonly<Record<string, WorkbenchPerformanceValueSnapshotV3>>;
  counters: Readonly<Record<string, number>>;
}>;

type WorkbenchPerformanceMetricStateV3 = {
  count: number;
  totalMs: number;
  maximumMs: number;
  latestMs: number;
  recentMs: number[];
};

type WorkbenchPerformanceValueStateV3 = {
  count: number;
  total: number;
  minimum: number;
  maximum: number;
  latest: number;
  recent: number[];
};

export type WorkbenchPerformanceRecorderV3 = Readonly<{
  enabled: boolean;
  nowMs(): number;
  recordDuration(metric: string, durationMs: number): void;
  recordEventInterval(metric: string): void;
  recordValue(metric: string, value: number): void;
  incrementCounter(metric: string, amount?: number): void;
}>;

const WORKBENCH_PERFORMANCE_RECENT_SAMPLE_LIMIT_V3 = 240;
export const WORKBENCH_PERFORMANCE_DIAGNOSTICS_ELEMENT_ID_V3 =
  "circleheart-workbench-performance-v3";

/**
 * Development-only rolling diagnostics. It deliberately aggregates timings
 * instead of retaining frame payloads, model outputs, or scientific state.
 */
export class WorkbenchPerformanceDiagnosticsV3 {
  readonly #enabled: boolean;
  readonly #nowMs: () => number;
  readonly #metrics = new Map<string, WorkbenchPerformanceMetricStateV3>();
  readonly #values = new Map<string, WorkbenchPerformanceValueStateV3>();
  readonly #counters = new Map<string, number>();
  readonly #lastEventAtMs = new Map<string, number>();

  constructor(input: Readonly<{
    enabled: boolean;
    nowMs?: () => number;
  }>) {
    this.#enabled = input.enabled;
    this.#nowMs = input.nowMs ?? defaultPerformanceNowV3;
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  nowMs(): number {
    return this.#nowMs();
  }

  recordDuration(metric: string, durationMs: number): void {
    if (
      !this.#enabled
      || metric.trim().length === 0
      || !Number.isFinite(durationMs)
      || durationMs < 0
    ) return;
    const current = this.#metrics.get(metric) ?? {
      count: 0,
      totalMs: 0,
      maximumMs: 0,
      latestMs: 0,
      recentMs: [],
    };
    current.count += 1;
    current.totalMs += durationMs;
    current.maximumMs = Math.max(current.maximumMs, durationMs);
    current.latestMs = durationMs;
    current.recentMs.push(durationMs);
    if (
      current.recentMs.length
        > WORKBENCH_PERFORMANCE_RECENT_SAMPLE_LIMIT_V3
    ) {
      current.recentMs.splice(
        0,
        current.recentMs.length
          - WORKBENCH_PERFORMANCE_RECENT_SAMPLE_LIMIT_V3,
      );
    }
    this.#metrics.set(metric, current);
  }

  /** Records one finite unitless or domain-specific diagnostic value. */
  recordValue(metric: string, value: number): void {
    if (
      !this.#enabled
      || metric.trim().length === 0
      || !Number.isFinite(value)
    ) return;
    const current = this.#values.get(metric) ?? {
      count: 0,
      total: 0,
      minimum: value,
      maximum: value,
      latest: value,
      recent: [],
    };
    current.count += 1;
    current.total += value;
    current.minimum = Math.min(current.minimum, value);
    current.maximum = Math.max(current.maximum, value);
    current.latest = value;
    current.recent.push(value);
    trimRecentSamplesV3(current.recent);
    this.#values.set(metric, current);
  }

  /** Increments a session-local event counter without retaining event data. */
  incrementCounter(metric: string, amount = 1): void {
    if (
      !this.#enabled
      || metric.trim().length === 0
      || !Number.isFinite(amount)
      || amount <= 0
    ) return;
    this.#counters.set(metric, (this.#counters.get(metric) ?? 0) + amount);
  }

  /** Records the wall-clock interval between consecutive meaningful events. */
  recordEventInterval(metric: string): void {
    if (!this.#enabled || metric.trim().length === 0) return;
    const nowMs = this.#nowMs();
    const previousMs = this.#lastEventAtMs.get(metric);
    this.#lastEventAtMs.set(metric, nowMs);
    if (previousMs !== undefined && nowMs >= previousMs) {
      this.recordDuration(metric, nowMs - previousMs);
    }
  }

  reset(): void {
    this.#metrics.clear();
    this.#values.clear();
    this.#counters.clear();
    this.#lastEventAtMs.clear();
  }

  snapshot(): WorkbenchPerformanceSnapshotV3 {
    return Object.freeze({
      enabled: this.#enabled,
      capturedAtMs: this.#nowMs(),
      metrics: Object.freeze(Object.fromEntries(
        [...this.#metrics].map(([metric, state]) => {
          const ordered = [...state.recentMs].sort((left, right) => left - right);
          const p95Index = ordered.length === 0
            ? 0
            : Math.min(
                ordered.length - 1,
                Math.ceil(ordered.length * 0.95) - 1,
              );
          return [metric, Object.freeze({
            count: state.count,
            meanMs: state.count === 0 ? 0 : state.totalMs / state.count,
            p95Ms: ordered[p95Index] ?? 0,
            maximumMs: state.maximumMs,
            latestMs: state.latestMs,
          })];
        }),
      )),
      values: Object.freeze(Object.fromEntries(
        [...this.#values].map(([metric, state]) => {
          const ordered = [...state.recent]
            .sort((left, right) => left - right);
          return [metric, Object.freeze({
            count: state.count,
            mean: state.count === 0 ? 0 : state.total / state.count,
            recentMean: state.recent.length === 0
              ? 0
              : state.recent.reduce((sum, value) => sum + value, 0)
                / state.recent.length,
            p05: percentile05V3(ordered),
            p95: percentile95V3(ordered),
            minimum: state.minimum,
            maximum: state.maximum,
            latest: state.latest,
          })];
        }),
      )),
      counters: Object.freeze(Object.fromEntries(this.#counters)),
    });
  }
}

export type WorkbenchPerformanceDiagnosticsApiV3 = Readonly<{
  reset(): void;
  snapshot(): WorkbenchPerformanceSnapshotV3;
}>;

const workbenchPerformanceDiagnosticsV3 =
  new WorkbenchPerformanceDiagnosticsV3({
    enabled: workbenchPerformanceDiagnosticsRequestedV3(),
  });

export function workbenchPerformanceNowV3(): number {
  return workbenchPerformanceDiagnosticsV3.nowMs();
}

export function workbenchPerformanceDiagnosticsEnabledV3(): boolean {
  return workbenchPerformanceDiagnosticsV3.enabled;
}

export function recordWorkbenchPerformanceDurationV3(
  metric: string,
  durationMs: number,
): void {
  workbenchPerformanceDiagnosticsV3.recordDuration(metric, durationMs);
}

export function recordWorkbenchPerformanceEventIntervalV3(
  metric: string,
): void {
  workbenchPerformanceDiagnosticsV3.recordEventInterval(metric);
}

export function recordWorkbenchPerformanceValueV3(
  metric: string,
  value: number,
): void {
  workbenchPerformanceDiagnosticsV3.recordValue(metric, value);
}

export function incrementWorkbenchPerformanceCounterV3(
  metric: string,
  amount = 1,
): void {
  workbenchPerformanceDiagnosticsV3.incrementCounter(metric, amount);
}

export function getWorkbenchPerformanceRecorderV3():
  WorkbenchPerformanceRecorderV3 {
  return workbenchPerformanceDiagnosticsV3;
}

export function getWorkbenchPerformanceSnapshotV3():
  WorkbenchPerformanceSnapshotV3 {
  return workbenchPerformanceDiagnosticsV3.snapshot();
}

export function workbenchPerformanceDiagnosticsRequestedV3(
  search = typeof location === "undefined" ? "" : location.search,
): boolean {
  try {
    return new URLSearchParams(search).get("workbenchPerf") === "1";
  } catch {
    return false;
  }
}

function defaultPerformanceNowV3(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function trimRecentSamplesV3(samples: number[]): void {
  if (samples.length <= WORKBENCH_PERFORMANCE_RECENT_SAMPLE_LIMIT_V3) return;
  samples.splice(
    0,
    samples.length - WORKBENCH_PERFORMANCE_RECENT_SAMPLE_LIMIT_V3,
  );
}

function percentile95V3(ordered: readonly number[]): number {
  if (ordered.length === 0) return 0;
  return ordered[Math.min(
    ordered.length - 1,
    Math.ceil(ordered.length * 0.95) - 1,
  )] ?? 0;
}

function percentile05V3(ordered: readonly number[]): number {
  if (ordered.length === 0) return 0;
  return ordered[Math.max(
    0,
    Math.floor(ordered.length * 0.05),
  )] ?? 0;
}

function exposeWorkbenchPerformanceDiagnosticsV3(): void {
  if (!workbenchPerformanceDiagnosticsV3.enabled) return;
  const target = globalThis as typeof globalThis & Readonly<{
    __circleHeartWorkbenchPerfV3?: WorkbenchPerformanceDiagnosticsApiV3;
  }>;
  if (target.__circleHeartWorkbenchPerfV3 !== undefined) return;
  Object.defineProperty(target, "__circleHeartWorkbenchPerfV3", {
    configurable: true,
    enumerable: false,
    value: Object.freeze({
      reset: () => workbenchPerformanceDiagnosticsV3.reset(),
      snapshot: () => workbenchPerformanceDiagnosticsV3.snapshot(),
    }),
  });
  exposeWorkbenchPerformanceDiagnosticsElementV3();
}

function exposeWorkbenchPerformanceDiagnosticsElementV3(): void {
  if (typeof document === "undefined") return;
  const publish = () => {
    const element = document.getElementById(
      WORKBENCH_PERFORMANCE_DIAGNOSTICS_ELEMENT_ID_V3,
    );
    if (element !== null) {
      element.textContent = JSON.stringify(
        workbenchPerformanceDiagnosticsV3.snapshot(),
      );
    }
  };
  const attach = () => {
    if (
      document.getElementById(
        WORKBENCH_PERFORMANCE_DIAGNOSTICS_ELEMENT_ID_V3,
      ) !== null
    ) return;
    const element = document.createElement("output");
    element.id = WORKBENCH_PERFORMANCE_DIAGNOSTICS_ELEMENT_ID_V3;
    element.hidden = true;
    element.setAttribute("aria-hidden", "true");
    document.body.append(element);
    publish();
    window.setInterval(publish, 1_000);
  };
  if (document.body === null) {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }
}

exposeWorkbenchPerformanceDiagnosticsV3();

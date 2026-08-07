import {
  getWorkbenchPerformanceRecorderV3,
  type WorkbenchPerformanceRecorderV3,
} from "./WorkbenchPerformanceDiagnosticsV3";

export type WorkbenchLiveSchedulerTimerV3 = ReturnType<typeof setTimeout>;

export type WorkbenchLiveSchedulerDependenciesV3<TFrame> = Readonly<{
  advance(stepCount: number): Promise<readonly TFrame[]>;
  acceptedTimeSec(frame: TFrame): number;
  onFrames(frames: readonly TFrame[]): void;
  onError(error: Error): void;
  nowMs?: () => number;
  schedule?: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchLiveSchedulerTimerV3;
  cancel?: (timer: WorkbenchLiveSchedulerTimerV3) => void;
  presentationDtSec?: number;
  maximumBatchSteps?: number;
  /**
   * Deliberately waits for this many wall-clock-due steps before crossing the
   * Worker boundary. The model still advances in exact 2 ms presentation
   * steps, but the UI no longer pays one postMessage round-trip per step.
   */
  preferredBatchSteps?: number;
  maximumCatchUpSec?: number;
  /**
   * Worker stepping remains exact and wall-clock paced, while presentation
   * frames are delivered at this lower cadence to avoid rendering every
   * accepted 2 ms state. Pending accepted frames are never discarded.
   */
  presentationIntervalMs?: number;
  /**
   * Maximum accepted prefix published in one paced presentation callback.
   * Frames beyond this boundary remain queued in exact accepted order.
   */
  maximumPresentationBatchFrames?: number;
  maximumPendingPresentationFrames?: number;
  /** Ephemeral diagnostic identity; it never crosses a durable boundary. */
  diagnosticLaneId?: string;
  performanceRecorder?: WorkbenchPerformanceRecorderV3;
}>;

/**
 * Paces a request/response numerical Worker against monotonic wall time.
 *
 * The Worker remains the sole numerical owner. Pause only stops issuing new
 * advance commands; it never destroys or rewinds the accepted session.
 */
export class WorkbenchLiveSchedulerV3<TFrame> {
  readonly #advance: (stepCount: number) => Promise<readonly TFrame[]>;
  readonly #acceptedTimeSec: (frame: TFrame) => number;
  readonly #onFrames: (frames: readonly TFrame[]) => void;
  readonly #onError: (error: Error) => void;
  readonly #nowMs: () => number;
  readonly #schedule: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchLiveSchedulerTimerV3;
  readonly #cancel: (timer: WorkbenchLiveSchedulerTimerV3) => void;
  readonly #presentationDtSec: number;
  readonly #maximumBatchSteps: number;
  readonly #preferredBatchSteps: number;
  readonly #maximumCatchUpSec: number;
  readonly #presentationIntervalMs: number;
  readonly #maximumPresentationBatchFrames: number;
  readonly #maximumPendingPresentationFrames: number;
  readonly #diagnosticMetricPrefix: string;
  readonly #performance: WorkbenchPerformanceRecorderV3;

  #running = false;
  #disposed = false;
  #anchorWallMs = 0;
  #anchorModelTimeSec = 0;
  #acceptedModelTimeSec = 0;
  #pumpTimer: WorkbenchLiveSchedulerTimerV3 | undefined;
  #presentationTimer: WorkbenchLiveSchedulerTimerV3 | undefined;
  #inFlight: Promise<void> | undefined;
  #lastPresentationWallMs = 0;
  #lastRatioWallMs = 0;
  #lastRatioModelTimeSec = 0;
  #pendingPresentationFrames: TFrame[] = [];

  constructor(dependencies: WorkbenchLiveSchedulerDependenciesV3<TFrame>) {
    this.#advance = dependencies.advance;
    this.#acceptedTimeSec = dependencies.acceptedTimeSec;
    this.#onFrames = dependencies.onFrames;
    this.#onError = dependencies.onError;
    this.#nowMs = dependencies.nowMs ?? (() => performance.now());
    this.#schedule = dependencies.schedule ?? ((callback, delayMs) =>
      setTimeout(callback, delayMs));
    this.#cancel = dependencies.cancel ?? ((timer) => clearTimeout(timer));
    this.#presentationDtSec = dependencies.presentationDtSec ?? 0.002;
    // Sixteen exact 2 ms samples cover one 32 ms simulated interval while
    // halving Worker request/response traffic versus the former eight-sample
    // batch. No numerical step or accepted frame is skipped.
    this.#maximumBatchSteps = dependencies.maximumBatchSteps ?? 16;
    this.#preferredBatchSteps = dependencies.preferredBatchSteps
      ?? this.#maximumBatchSteps;
    this.#maximumCatchUpSec = dependencies.maximumCatchUpSec ?? 0.25;
    this.#presentationIntervalMs = dependencies.presentationIntervalMs ?? 32;
    this.#maximumPresentationBatchFrames =
      dependencies.maximumPresentationBatchFrames
      ?? this.#maximumBatchSteps;
    this.#maximumPendingPresentationFrames =
      dependencies.maximumPendingPresentationFrames ?? 64;
    this.#diagnosticMetricPrefix = dependencies.diagnosticLaneId === undefined
      ? "scheduler.unscoped"
      : `scheduler.${dependencies.diagnosticLaneId}`;
    this.#performance = dependencies.performanceRecorder
      ?? getWorkbenchPerformanceRecorderV3();
    if (
      !Number.isFinite(this.#presentationDtSec)
      || this.#presentationDtSec <= 0
      || !Number.isSafeInteger(this.#maximumBatchSteps)
      || this.#maximumBatchSteps < 1
      || !Number.isSafeInteger(this.#preferredBatchSteps)
      || this.#preferredBatchSteps < 1
      || this.#preferredBatchSteps > this.#maximumBatchSteps
      || !Number.isFinite(this.#maximumCatchUpSec)
      || this.#maximumCatchUpSec < this.#presentationDtSec
      || !Number.isFinite(this.#presentationIntervalMs)
      || this.#presentationIntervalMs < 0
      || !Number.isSafeInteger(this.#maximumPresentationBatchFrames)
      || this.#maximumPresentationBatchFrames < 1
      || !Number.isSafeInteger(this.#maximumPendingPresentationFrames)
      || this.#maximumPendingPresentationFrames < 1
    ) {
      throw new Error("Workbench live scheduler configuration is invalid");
    }
  }

  get running(): boolean {
    return this.#running;
  }

  play(acceptedModelTimeSec: number): void {
    if (this.#disposed) {
      throw new Error("Workbench live scheduler is disposed");
    }
    requireAcceptedTimeV3(acceptedModelTimeSec);
    this.#acceptedModelTimeSec = acceptedModelTimeSec;
    this.#anchorModelTimeSec = acceptedModelTimeSec;
    this.#anchorWallMs = this.#nowMs();
    this.#lastPresentationWallMs = this.#anchorWallMs;
    this.#lastRatioWallMs = this.#anchorWallMs;
    this.#lastRatioModelTimeSec = acceptedModelTimeSec;
    this.#running = true;
    this.#queuePump(0);
  }

  async pause(): Promise<void> {
    this.#running = false;
    this.#cancelPumpTimer();
    await this.#inFlight;
    this.#cancelPresentationTimer();
    this.#flushPresentationFrames(this.#nowMs());
  }

  /**
   * Publishes the already-accepted presentation prefix without changing
   * playback ownership or waiting for an in-flight Worker request.
   *
   * The parallel Scenario pool uses this synchronous boundary when a sibling
   * lane fails. Waiting for the failing lane from inside its own rejection
   * callback would self-depend, while disposing every lane immediately would
   * otherwise discard healthy lanes' scheduler-side accepted prefixes.
   */
  flushAcceptedFrames(): void {
    if (this.#disposed) return;
    this.#flushPresentationFrames(this.#nowMs());
  }

  /** Re-anchors after a hidden-tab interval without replaying wall-clock debt. */
  reanchor(acceptedModelTimeSec: number): void {
    requireAcceptedTimeV3(acceptedModelTimeSec);
    this.#acceptedModelTimeSec = acceptedModelTimeSec;
    this.#anchorModelTimeSec = acceptedModelTimeSec;
    this.#anchorWallMs = this.#nowMs();
    this.#lastRatioWallMs = this.#anchorWallMs;
    this.#lastRatioModelTimeSec = acceptedModelTimeSec;
    if (this.#running) this.#queuePump(0);
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#running = false;
    this.#cancelPumpTimer();
    this.#cancelPresentationTimer();
    await this.#inFlight;
    this.#pendingPresentationFrames = [];
  }

  #queuePump(delayMs: number): void {
    if (
      !this.#running
      || this.#disposed
      || this.#pumpTimer !== undefined
    ) return;
    this.#pumpTimer = this.#schedule(() => {
      this.#pumpTimer = undefined;
      this.#pump();
    }, Math.max(0, Math.ceil(delayMs)));
  }

  #pump(): void {
    if (
      !this.#running
      || this.#disposed
      || this.#inFlight !== undefined
    ) return;
    const nowMs = this.#nowMs();
    let targetModelTimeSec = this.#anchorModelTimeSec
      + (nowMs - this.#anchorWallMs) / 1_000;
    if (
      targetModelTimeSec - this.#acceptedModelTimeSec
        > this.#maximumCatchUpSec
    ) {
      const overloadLagMs = (
        targetModelTimeSec - this.#acceptedModelTimeSec
      ) * 1_000;
      if (this.#performance.enabled) {
        this.#performance.recordDuration(
          `${this.#diagnosticMetricPrefix}.overload-lag`,
          overloadLagMs,
        );
        this.#performance.incrementCounter(
          `${this.#diagnosticMetricPrefix}.overload-reanchors`,
        );
      }
      this.#anchorModelTimeSec = this.#acceptedModelTimeSec;
      this.#anchorWallMs = nowMs;
      targetModelTimeSec = this.#acceptedModelTimeSec;
      this.#lastRatioWallMs = nowMs;
      this.#lastRatioModelTimeSec = this.#acceptedModelTimeSec;
    }
    const dueSec = targetModelTimeSec - this.#acceptedModelTimeSec;
    const dueSteps = Math.floor(
      (dueSec + this.#presentationDtSec * 1e-9)
        / this.#presentationDtSec,
    );
    if (dueSteps < this.#preferredBatchSteps) {
      this.#queuePump(
        (this.#preferredBatchSteps * this.#presentationDtSec - dueSec) * 1_000,
      );
      return;
    }
    const stepCount = Math.min(this.#maximumBatchSteps, dueSteps);
    const diagnosticsEnabled = this.#performance.enabled;
    const roundTripStartedAtMs = diagnosticsEnabled ? this.#nowMs() : 0;
    if (diagnosticsEnabled) {
      this.#performance.recordValue(
        `${this.#diagnosticMetricPrefix}.requested-batch-steps`,
        stepCount,
      );
      if (stepCount > this.#preferredBatchSteps) {
        this.#performance.incrementCounter(
          `${this.#diagnosticMetricPrefix}.catch-up-batches`,
        );
      }
    }
    const operation = this.#advance(stepCount)
      .then((frames) => {
        if (diagnosticsEnabled) {
          const completedAtMs = this.#nowMs();
          this.#performance.recordDuration(
            "scheduler.worker-round-trip",
            completedAtMs - roundTripStartedAtMs,
          );
          this.#performance.recordDuration(
            `${this.#diagnosticMetricPrefix}.worker-round-trip`,
            completedAtMs - roundTripStartedAtMs,
          );
        }
        if (frames.length !== stepCount) {
          throw new Error(
            `Workbench Worker returned ${frames.length} frames for `
              + `${stepCount} requested steps`,
          );
        }
        const acceptedTimeSec = this.#acceptedTimeSec(frames.at(-1)!);
        requireAcceptedTimeV3(acceptedTimeSec);
        if (!(acceptedTimeSec > this.#acceptedModelTimeSec)) {
          throw new Error("Workbench Worker model time did not advance");
        }
        const completedAtMs = this.#nowMs();
        const wallDeltaMs = completedAtMs - this.#lastRatioWallMs;
        const modelDeltaSec = acceptedTimeSec - this.#lastRatioModelTimeSec;
        if (diagnosticsEnabled && wallDeltaMs > 0 && modelDeltaSec >= 0) {
          this.#performance.recordValue(
            `${this.#diagnosticMetricPrefix}.model-time-ratio`,
            modelDeltaSec / (wallDeltaMs / 1_000),
          );
        }
        this.#lastRatioWallMs = completedAtMs;
        this.#lastRatioModelTimeSec = acceptedTimeSec;
        this.#acceptedModelTimeSec = acceptedTimeSec;
        const currentTargetModelTimeSec = this.#anchorModelTimeSec
          + (completedAtMs - this.#anchorWallMs) / 1_000;
        if (diagnosticsEnabled) {
          this.#performance.recordDuration(
            `${this.#diagnosticMetricPrefix}.model-wall-lag`,
            Math.max(0, currentTargetModelTimeSec - acceptedTimeSec) * 1_000,
          );
        }
        this.#pendingPresentationFrames.push(...frames);
        const presentationWallMs = this.#nowMs();
        this.#publishOrSchedulePresentation(presentationWallMs);
      })
      .catch((error) => {
        this.#running = false;
        this.#cancelPumpTimer();
        this.#cancelPresentationTimer();
        if (!this.#disposed) {
          // A later Worker failure must not hide frames that were already
          // accepted successfully. Publish that exact prefix before exposing
          // the error; dispose remains the explicit discard boundary.
          this.#flushPresentationFrames(this.#nowMs());
        }
        this.#onError(errorAsErrorV3(error));
      })
      .finally(() => {
        if (this.#inFlight === operation) this.#inFlight = undefined;
        if (this.#running && !this.#disposed) this.#queuePump(0);
      });
    this.#inFlight = operation;
  }

  #cancelPumpTimer(): void {
    if (this.#pumpTimer === undefined) return;
    this.#cancel(this.#pumpTimer);
    this.#pumpTimer = undefined;
  }

  #cancelPresentationTimer(): void {
    if (this.#presentationTimer === undefined) return;
    this.#cancel(this.#presentationTimer);
    this.#presentationTimer = undefined;
  }

  #publishOrSchedulePresentation(nowMs: number): void {
    if (this.#pendingPresentationFrames.length === 0) return;
    const saturated = this.#pendingPresentationFrames.length
      >= this.#maximumPendingPresentationFrames;
    if (
      this.#presentationIntervalMs === 0
      || saturated
      || nowMs - this.#lastPresentationWallMs
        >= this.#presentationIntervalMs
    ) {
      this.#cancelPresentationTimer();
      this.#flushPresentationFrames(
        nowMs,
        saturated
          ? this.#pendingPresentationFrames.length
          : this.#maximumPresentationBatchFrames,
      );
    }
    if (
      this.#pendingPresentationFrames.length === 0
      || this.#presentationTimer !== undefined
      || !this.#running
      || this.#disposed
    ) return;
    const remainingMs = Math.max(
      0,
      this.#presentationIntervalMs
        - (this.#nowMs() - this.#lastPresentationWallMs),
    );
    this.#presentationTimer = this.#schedule(() => {
      this.#presentationTimer = undefined;
      if (!this.#running || this.#disposed) return;
      this.#publishOrSchedulePresentation(this.#nowMs());
    }, Math.ceil(remainingMs));
  }

  #flushPresentationFrames(
    presentationWallMs: number,
    maximumFrames = Number.POSITIVE_INFINITY,
  ): void {
    if (this.#pendingPresentationFrames.length === 0) return;
    const frameCount = Math.min(
      this.#pendingPresentationFrames.length,
      maximumFrames,
    );
    const frames = Object.freeze(
      this.#pendingPresentationFrames.slice(0, frameCount),
    );
    this.#pendingPresentationFrames =
      this.#pendingPresentationFrames.slice(frameCount);
    this.#lastPresentationWallMs = presentationWallMs;
    this.#onFrames(frames);
    if (this.#performance.enabled) {
      this.#performance.recordEventInterval(
        "scheduler.presentation-delivery-interval",
      );
      this.#performance.recordEventInterval(
        `${this.#diagnosticMetricPrefix}.presentation-delivery-interval`,
      );
    }
  }
}

function requireAcceptedTimeV3(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Workbench accepted model time is invalid");
  }
}

function errorAsErrorV3(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

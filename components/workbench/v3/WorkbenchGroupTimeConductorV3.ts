import {
  getWorkbenchPerformanceRecorderV3,
  type WorkbenchPerformanceRecorderV3,
} from "./WorkbenchPerformanceDiagnosticsV3";

export const WORKBENCH_MINIMUM_PLAYBACK_RATE_V3 = 0.1;
export const WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3 = 2;

const WORKBENCH_GROUP_RATE_HEADROOM_V3 = 0.9;
const WORKBENCH_GROUP_RATE_RISE_FACTOR_V3 = 0.16;
const WORKBENCH_GROUP_DURATION_SMOOTHING_V3 = 0.2;

export type WorkbenchGroupTimeConductorTimerV3 = ReturnType<typeof setTimeout>;

export type WorkbenchGroupPlaybackRateModeV3 = "auto" | "manual";

export type WorkbenchGroupPlaybackRateStateV3 = Readonly<{
  mode: WorkbenchGroupPlaybackRateModeV3;
  effectiveRate: number;
  safeMaximumRate: number;
  requestedRate: number | null;
  warmingUp: boolean;
}>;

export type WorkbenchGroupTimeConductorLaneV3<TFrame> = Readonly<{
  laneId: string;
  acceptedTimeSec: number;
  advance(stepCount: number): Promise<readonly TFrame[]>;
  frameAcceptedTimeSec(frame: TFrame): number;
}>;

export type WorkbenchGroupTimeConductorDependenciesV3<TFrame> = Readonly<{
  lanes(): readonly WorkbenchGroupTimeConductorLaneV3<TFrame>[];
  onFrames(frames: readonly TFrame[]): void;
  onError(error: Error): void;
  onPlaybackRateChange?(state: WorkbenchGroupPlaybackRateStateV3): void;
  nowMs?: () => number;
  schedule?: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchGroupTimeConductorTimerV3;
  cancel?: (timer: WorkbenchGroupTimeConductorTimerV3) => void;
  presentationDtSec?: number;
  batchSteps?: number;
  presentationIntervalMs?: number;
  /** Frames released per lane and interval at 1× playback. */
  maximumPresentationFramesPerLane?: number;
  minimumPlaybackRate?: number;
  maximumPlaybackRate?: number;
  performanceRecorder?: WorkbenchPerformanceRecorderV3;
}>;

type PendingGroupPresentationV3<TFrame> = {
  readonly laneFrames: readonly Readonly<{
    laneId: string;
    frames: readonly TFrame[];
  }>[];
  offset: number;
};

/**
 * Owns one shared model-time pace for every live Scenario.
 *
 * Every lane advances by the same exact accepted-step count. A presentation
 * prefix is released only after every lane has completed that group batch, so
 * comparative waveforms never imply independent playback speeds. When the
 * device has insufficient capacity, model time slows honestly instead of
 * discarding wall-clock debt.
 */
export class WorkbenchGroupTimeConductorV3<TFrame> {
  readonly #lanes: () => readonly WorkbenchGroupTimeConductorLaneV3<TFrame>[];
  readonly #onFrames: (frames: readonly TFrame[]) => void;
  readonly #onError: (error: Error) => void;
  readonly #onPlaybackRateChange:
    ((state: WorkbenchGroupPlaybackRateStateV3) => void) | undefined;
  readonly #nowMs: () => number;
  readonly #schedule: (
    callback: () => void,
    delayMs: number,
  ) => WorkbenchGroupTimeConductorTimerV3;
  readonly #cancel: (timer: WorkbenchGroupTimeConductorTimerV3) => void;
  readonly #presentationDtSec: number;
  readonly #batchSteps: number;
  readonly #presentationIntervalMs: number;
  readonly #maximumPresentationFramesPerLane: number;
  readonly #minimumPlaybackRate: number;
  readonly #maximumPlaybackRate: number;
  readonly #performance: WorkbenchPerformanceRecorderV3;

  #running = false;
  #disposed = false;
  #pumpTimer: WorkbenchGroupTimeConductorTimerV3 | undefined;
  #presentationTimer: WorkbenchGroupTimeConductorTimerV3 | undefined;
  #inFlight: Promise<void> | undefined;
  #lastPresentationWallMs = 0;
  #presentationFrameCreditPerLane = 0;
  #pendingPresentation: PendingGroupPresentationV3<TFrame>[] = [];
  #mode: WorkbenchGroupPlaybackRateModeV3 = "auto";
  #requestedRate: number | null = null;
  #safeMaximumRate = 0.5;
  #smoothedGroupWallMs: number | null = null;
  #measurementCount = 0;
  #lastPublishedRateState: WorkbenchGroupPlaybackRateStateV3 | null = null;

  constructor(dependencies: WorkbenchGroupTimeConductorDependenciesV3<TFrame>) {
    this.#lanes = dependencies.lanes;
    this.#onFrames = dependencies.onFrames;
    this.#onError = dependencies.onError;
    this.#onPlaybackRateChange = dependencies.onPlaybackRateChange;
    this.#nowMs = dependencies.nowMs ?? (() => performance.now());
    this.#schedule = dependencies.schedule ?? ((callback, delayMs) =>
      setTimeout(callback, delayMs));
    this.#cancel = dependencies.cancel ?? ((timer) => clearTimeout(timer));
    this.#presentationDtSec = dependencies.presentationDtSec ?? 0.002;
    this.#batchSteps = dependencies.batchSteps ?? 16;
    this.#presentationIntervalMs = dependencies.presentationIntervalMs ?? 16;
    this.#maximumPresentationFramesPerLane =
      dependencies.maximumPresentationFramesPerLane ?? 8;
    this.#minimumPlaybackRate = dependencies.minimumPlaybackRate
      ?? WORKBENCH_MINIMUM_PLAYBACK_RATE_V3;
    this.#maximumPlaybackRate = dependencies.maximumPlaybackRate
      ?? WORKBENCH_MAXIMUM_PLAYBACK_RATE_V3;
    this.#performance = dependencies.performanceRecorder
      ?? getWorkbenchPerformanceRecorderV3();
    if (
      !Number.isFinite(this.#presentationDtSec)
      || this.#presentationDtSec <= 0
      || !Number.isSafeInteger(this.#batchSteps)
      || this.#batchSteps < 1
      || !Number.isFinite(this.#presentationIntervalMs)
      || this.#presentationIntervalMs < 0
      || !Number.isSafeInteger(this.#maximumPresentationFramesPerLane)
      || this.#maximumPresentationFramesPerLane < 1
      || !Number.isFinite(this.#minimumPlaybackRate)
      || !Number.isFinite(this.#maximumPlaybackRate)
      || this.#minimumPlaybackRate <= 0
      || this.#maximumPlaybackRate <= this.#minimumPlaybackRate
    ) {
      throw new Error("Workbench group TimeConductor configuration is invalid");
    }
    this.#resetCapacityEstimate();
  }

  get running(): boolean {
    return this.#running;
  }

  playbackRateState(): WorkbenchGroupPlaybackRateStateV3 {
    const requested = this.#mode === "manual" ? this.#requestedRate : null;
    return Object.freeze({
      mode: this.#mode,
      effectiveRate: this.#effectiveRate(),
      safeMaximumRate: this.#safeMaximumRate,
      requestedRate: requested,
      warmingUp: this.#measurementCount < 3,
    });
  }

  setPlaybackRate(rate: number | "auto"): WorkbenchGroupPlaybackRateStateV3 {
    const previousEffectiveRate = this.#effectiveRate();
    const changedAtMs = this.#nowMs();
    if (this.#running && !this.#disposed) {
      this.#publishOrSchedulePresentation(changedAtMs);
    }
    if (rate === "auto") {
      this.#mode = "auto";
      this.#requestedRate = null;
    } else {
      requirePlaybackRateV3(
        rate,
        this.#minimumPlaybackRate,
        this.#maximumPlaybackRate,
      );
      this.#mode = "manual";
      this.#requestedRate = Math.min(rate, this.#safeMaximumRate);
    }
    if (this.#running && !this.#disposed) {
      // Apply the new rate from this wall-clock boundary. At most one partial
      // presentation interval is discarded; no accepted model frame is.
      this.#lastPresentationWallMs = changedAtMs;
      this.#presentationFrameCreditPerLane = 0;
      this.#publishOrSchedulePresentation(changedAtMs);
      const nextEffectiveRate = this.#effectiveRate();
      if (Math.abs(nextEffectiveRate - previousEffectiveRate) > 1e-9) {
        this.#cancelPumpTimer();
        if (this.#inFlight === undefined) {
          const nextBoundaryDemand = Math.max(
            1,
            Math.floor(
              this.#maximumPresentationFramesPerLane * nextEffectiveRate
                + 1e-9,
            ),
          );
          this.#queuePump(
            nextEffectiveRate > previousEffectiveRate
                && this.#presentationBacklogFramesPerLane()
                  < nextBoundaryDemand
              ? 0
              : this.#batchModelDurationMs() / nextEffectiveRate,
          );
        }
      }
    }
    this.#publishRateState();
    return this.playbackRateState();
  }

  play(): void {
    if (this.#disposed) {
      throw new Error("Workbench group TimeConductor is disposed");
    }
    if (this.#running) return;
    requireGroupLanesV3(this.#lanes());
    this.#running = true;
    this.#lastPresentationWallMs = this.#nowMs();
    this.#presentationFrameCreditPerLane = 0;
    this.#publishRateState();
    this.#queuePump(0);
  }

  async pause(): Promise<void> {
    if (this.#disposed) return;
    this.#running = false;
    this.#cancelPumpTimer();
    await this.#inFlight;
    this.#cancelPresentationTimer();
    this.#flushAllPresentation(this.#nowMs());
    this.#presentationFrameCreditPerLane = 0;
  }

  /** Must be called after a paused lane set changes. */
  lanesChanged(): WorkbenchGroupPlaybackRateStateV3 {
    if (this.#running || this.#inFlight !== undefined) {
      throw new Error("Workbench group lanes can change only while paused");
    }
    this.#cancelPresentationTimer();
    this.#flushAllPresentation(this.#nowMs());
    this.#resetCapacityEstimate();
    this.#publishRateState();
    return this.playbackRateState();
  }

  terminate(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#running = false;
    this.#cancelPumpTimer();
    this.#cancelPresentationTimer();
    this.#pendingPresentation = [];
    this.#presentationFrameCreditPerLane = 0;
    this.#recordPresentationBacklog();
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.terminate();
    await this.#inFlight;
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
    const lanes = requireGroupLanesV3(this.#lanes());
    const startedAtMs = this.#nowMs();
    const operation = Promise.all(lanes.map(async (lane) => {
      const frames = await lane.advance(this.#batchSteps);
      validateGroupLaneAdvanceV3(
        lane,
        frames,
        this.#batchSteps,
        this.#presentationDtSec,
      );
      return Object.freeze({ laneId: lane.laneId, frames });
    })).then((laneFrames) => {
      const completedAtMs = this.#nowMs();
      const groupWallMs = completedAtMs - startedAtMs;
      if (!(groupWallMs >= 0) || !Number.isFinite(groupWallMs)) {
        throw new Error("Workbench group clock moved backwards");
      }
      this.#recordGroupCompletion(groupWallMs, lanes.length);
      this.#updateCapacityEstimate(groupWallMs);
      this.#pendingPresentation.push({
        laneFrames: Object.freeze(laneFrames),
        offset: 0,
      });
      this.#recordPresentationBacklog();
      this.#publishOrSchedulePresentation(completedAtMs);
      const intervalMs = this.#batchModelDurationMs() / this.#effectiveRate();
      this.#queuePump(Math.max(0, intervalMs - groupWallMs));
    }).catch((error) => {
      this.#running = false;
      this.#cancelPumpTimer();
      this.#cancelPresentationTimer();
      if (!this.#disposed) this.#flushAllPresentation(this.#nowMs());
      if (!this.#disposed) this.#onError(errorAsErrorV3(error));
    }).finally(() => {
      if (this.#inFlight === operation) this.#inFlight = undefined;
      if (this.#running && !this.#disposed && this.#pumpTimer === undefined) {
        this.#queuePump(0);
      }
    });
    this.#inFlight = operation;
  }

  #recordGroupCompletion(groupWallMs: number, laneCount: number): void {
    if (!this.#performance.enabled) return;
    this.#performance.recordDuration(
      "scheduler.group.worker-round-trip",
      groupWallMs,
    );
    this.#performance.recordValue("scheduler.group.live-lane-count", laneCount);
    this.#performance.recordValue(
      "scheduler.group.requested-batch-steps",
      this.#batchSteps,
    );
    this.#performance.recordValue(
      "scheduler.group.model-time-ratio",
      groupWallMs === 0
        ? this.#maximumPlaybackRate
        : this.#batchModelDurationMs() / groupWallMs,
    );
  }

  #updateCapacityEstimate(groupWallMs: number): void {
    // A zero-duration synthetic clock is valid in unit tests but carries no
    // throughput information.
    if (groupWallMs <= 0) return;
    this.#smoothedGroupWallMs = this.#smoothedGroupWallMs === null
      ? groupWallMs
      : this.#smoothedGroupWallMs * (1 - WORKBENCH_GROUP_DURATION_SMOOTHING_V3)
        + groupWallMs * WORKBENCH_GROUP_DURATION_SMOOTHING_V3;
    this.#measurementCount += 1;
    const measuredSafeRate = clampV3(
      this.#batchModelDurationMs() / this.#smoothedGroupWallMs
        * WORKBENCH_GROUP_RATE_HEADROOM_V3,
      this.#minimumPlaybackRate,
      this.#maximumPlaybackRate,
    );
    if (measuredSafeRate < this.#safeMaximumRate) {
      this.#safeMaximumRate = measuredSafeRate;
    } else {
      this.#safeMaximumRate = Math.min(
        measuredSafeRate,
        this.#safeMaximumRate
          + (measuredSafeRate - this.#safeMaximumRate)
            * WORKBENCH_GROUP_RATE_RISE_FACTOR_V3,
      );
    }
    if (
      this.#mode === "manual"
      && this.#requestedRate !== null
      && this.#requestedRate > this.#safeMaximumRate
    ) this.#requestedRate = this.#safeMaximumRate;
    if (this.#performance.enabled) {
      this.#performance.recordValue(
        "scheduler.group.safe-playback-rate",
        this.#safeMaximumRate,
      );
      this.#performance.recordValue(
        "scheduler.group.effective-playback-rate",
        this.#effectiveRate(),
      );
    }
    this.#publishRateState();
  }

  #publishOrSchedulePresentation(nowMs: number): void {
    if (this.#pendingPresentation.length === 0) return;
    if (this.#presentationIntervalMs === 0) {
      this.#cancelPresentationTimer();
      this.#flushAllPresentation(nowMs);
      return;
    }
    const elapsedIntervals = Math.floor(
      Math.max(0, nowMs - this.#lastPresentationWallMs)
        / this.#presentationIntervalMs,
    );
    if (elapsedIntervals > 0) {
      this.#lastPresentationWallMs +=
        elapsedIntervals * this.#presentationIntervalMs;
      this.#presentationFrameCreditPerLane = Math.min(
        Math.max(
          this.#batchSteps,
          this.#maximumPresentationFramesPerLane
            * this.#maximumPlaybackRate,
        ),
        this.#presentationFrameCreditPerLane
          + elapsedIntervals
            * this.#maximumPresentationFramesPerLane
            * this.#effectiveRate(),
      );
      this.#flushCreditedPresentation();
    }
    if (
      this.#pendingPresentation.length === 0
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

  #flushCreditedPresentation(): void {
    let creditedFrames = Math.floor(
      this.#presentationFrameCreditPerLane + 1e-9,
    );
    while (creditedFrames > 0 && this.#pendingPresentation.length > 0) {
      const emitted = this.#flushPresentationSlice(creditedFrames);
      this.#presentationFrameCreditPerLane = Math.max(
        0,
        this.#presentationFrameCreditPerLane - emitted,
      );
      creditedFrames = Math.floor(
        this.#presentationFrameCreditPerLane + 1e-9,
      );
    }
  }

  #flushPresentationSlice(maximumFramesPerLane: number): number {
    const pending = this.#pendingPresentation[0];
    if (pending === undefined) return 0;
    const available = pending.laneFrames[0]!.frames.length - pending.offset;
    const count = Math.min(maximumFramesPerLane, available);
    const frames = pending.laneFrames.flatMap(({ frames: laneFrames }) =>
      laneFrames.slice(pending.offset, pending.offset + count));
    pending.offset += count;
    if (pending.offset === pending.laneFrames[0]!.frames.length) {
      this.#pendingPresentation.shift();
    }
    if (!this.#disposed && frames.length > 0) {
      this.#onFrames(Object.freeze(frames));
    }
    this.#recordPresentationBacklog();
    return count;
  }

  #flushAllPresentation(nowMs: number): void {
    while (this.#pendingPresentation.length > 0) {
      this.#flushPresentationSlice(Number.POSITIVE_INFINITY);
    }
    this.#lastPresentationWallMs = nowMs;
    this.#presentationFrameCreditPerLane = 0;
  }

  #recordPresentationBacklog(): void {
    if (!this.#performance.enabled) return;
    this.#performance.recordValue(
      "scheduler.group.presentation-backlog-frames-per-lane",
      this.#presentationBacklogFramesPerLane(),
    );
  }

  #presentationBacklogFramesPerLane(): number {
    return this.#pendingPresentation.reduce(
      (sum, pending) =>
        sum + pending.laneFrames[0]!.frames.length - pending.offset,
      0,
    );
  }

  #resetCapacityEstimate(): void {
    const laneCount = Math.max(1, this.#lanes().length);
    this.#safeMaximumRate = clampV3(
      0.85 / Math.sqrt(laneCount),
      this.#minimumPlaybackRate,
      this.#maximumPlaybackRate,
    );
    this.#smoothedGroupWallMs = null;
    this.#measurementCount = 0;
    if (
      this.#mode === "manual"
      && this.#requestedRate !== null
      && this.#requestedRate > this.#safeMaximumRate
    ) this.#requestedRate = this.#safeMaximumRate;
  }

  #effectiveRate(): number {
    return this.#mode === "manual" && this.#requestedRate !== null
      ? Math.min(this.#requestedRate, this.#safeMaximumRate)
      : this.#safeMaximumRate;
  }

  #publishRateState(): void {
    const state = this.playbackRateState();
    if (samePlaybackRateStateV3(state, this.#lastPublishedRateState)) return;
    this.#lastPublishedRateState = state;
    this.#onPlaybackRateChange?.(state);
  }

  #batchModelDurationMs(): number {
    return this.#batchSteps * this.#presentationDtSec * 1_000;
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
}

function requireGroupLanesV3<TFrame>(
  lanes: readonly WorkbenchGroupTimeConductorLaneV3<TFrame>[],
): readonly WorkbenchGroupTimeConductorLaneV3<TFrame>[] {
  if (lanes.length === 0) {
    throw new Error("Workbench group TimeConductor requires at least one lane");
  }
  const ids = new Set<string>();
  for (const lane of lanes) {
    if (lane.laneId.length === 0 || ids.has(lane.laneId)) {
      throw new Error("Workbench group TimeConductor lane identity is invalid");
    }
    if (!Number.isFinite(lane.acceptedTimeSec) || lane.acceptedTimeSec < 0) {
      throw new Error("Workbench group TimeConductor lane clock is invalid");
    }
    ids.add(lane.laneId);
  }
  return lanes;
}

function validateGroupLaneAdvanceV3<TFrame>(
  lane: WorkbenchGroupTimeConductorLaneV3<TFrame>,
  frames: readonly TFrame[],
  stepCount: number,
  presentationDtSec: number,
): void {
  if (frames.length !== stepCount) {
    throw new Error(
      `Workbench group lane ${lane.laneId} returned ${frames.length} frames `
        + `for ${stepCount} requested steps`,
    );
  }
  let previousTimeSec = lane.acceptedTimeSec;
  for (const frame of frames) {
    const acceptedTimeSec = lane.frameAcceptedTimeSec(frame);
    const expected = previousTimeSec + presentationDtSec;
    if (
      !Number.isFinite(acceptedTimeSec)
      || Math.abs(acceptedTimeSec - expected)
        > Math.max(1, Math.abs(expected)) * 1e-9
    ) {
      throw new Error(
        `Workbench group lane ${lane.laneId} did not advance by one exact `
          + `presentation tick (previous ${previousTimeSec}, expected `
          + `${expected}, received ${acceptedTimeSec})`,
      );
    }
    previousTimeSec = acceptedTimeSec;
  }
}

function requirePlaybackRateV3(rate: number, minimum: number, maximum: number) {
  if (!Number.isFinite(rate) || rate < minimum || rate > maximum) {
    throw new Error("Workbench playback rate is outside the supported range");
  }
}

function samePlaybackRateStateV3(
  left: WorkbenchGroupPlaybackRateStateV3,
  right: WorkbenchGroupPlaybackRateStateV3 | null,
): boolean {
  // The controller updates its EWMA after every group batch. React only needs
  // a new state when the two-decimal control can visibly change; the state we
  // do publish still carries the exact rate and exact safety ceiling.
  return right !== null
    && left.mode === right.mode
    && playbackRateUiBucketV3(left.effectiveRate)
      === playbackRateUiBucketV3(right.effectiveRate)
    && playbackRateUiBucketV3(left.safeMaximumRate)
      === playbackRateUiBucketV3(right.safeMaximumRate)
    && left.requestedRate === right.requestedRate
    && left.warmingUp === right.warmingUp;
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function playbackRateUiBucketV3(value: number): number {
  return Math.floor((value + 1e-9) * 100);
}

function errorAsErrorV3(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

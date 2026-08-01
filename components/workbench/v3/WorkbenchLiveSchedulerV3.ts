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
  maximumCatchUpSec?: number;
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
  readonly #maximumCatchUpSec: number;

  #running = false;
  #disposed = false;
  #anchorWallMs = 0;
  #anchorModelTimeSec = 0;
  #acceptedModelTimeSec = 0;
  #timer: WorkbenchLiveSchedulerTimerV3 | undefined;
  #inFlight: Promise<void> | undefined;

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
    this.#maximumBatchSteps = dependencies.maximumBatchSteps ?? 8;
    this.#maximumCatchUpSec = dependencies.maximumCatchUpSec ?? 0.25;
    if (
      !Number.isFinite(this.#presentationDtSec)
      || this.#presentationDtSec <= 0
      || !Number.isSafeInteger(this.#maximumBatchSteps)
      || this.#maximumBatchSteps < 1
      || !Number.isFinite(this.#maximumCatchUpSec)
      || this.#maximumCatchUpSec < this.#presentationDtSec
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
    this.#running = true;
    this.#queuePump(0);
  }

  async pause(): Promise<void> {
    this.#running = false;
    this.#cancelTimer();
    await this.#inFlight;
  }

  /** Re-anchors after a hidden-tab interval without replaying wall-clock debt. */
  reanchor(acceptedModelTimeSec: number): void {
    requireAcceptedTimeV3(acceptedModelTimeSec);
    this.#acceptedModelTimeSec = acceptedModelTimeSec;
    this.#anchorModelTimeSec = acceptedModelTimeSec;
    this.#anchorWallMs = this.#nowMs();
    if (this.#running) this.#queuePump(0);
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#running = false;
    this.#cancelTimer();
    await this.#inFlight;
  }

  #queuePump(delayMs: number): void {
    if (!this.#running || this.#disposed || this.#timer !== undefined) return;
    this.#timer = this.#schedule(() => {
      this.#timer = undefined;
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
      this.#anchorModelTimeSec = this.#acceptedModelTimeSec;
      this.#anchorWallMs = nowMs;
      targetModelTimeSec = this.#acceptedModelTimeSec;
    }
    const dueSec = targetModelTimeSec - this.#acceptedModelTimeSec;
    const dueSteps = Math.floor(
      (dueSec + this.#presentationDtSec * 1e-9)
        / this.#presentationDtSec,
    );
    if (dueSteps < 1) {
      this.#queuePump((this.#presentationDtSec - dueSec) * 1_000);
      return;
    }
    const stepCount = Math.min(this.#maximumBatchSteps, dueSteps);
    const operation = this.#advance(stepCount)
      .then((frames) => {
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
        this.#acceptedModelTimeSec = acceptedTimeSec;
        this.#onFrames(frames);
      })
      .catch((error) => {
        this.#running = false;
        this.#cancelTimer();
        this.#onError(errorAsErrorV3(error));
      })
      .finally(() => {
        if (this.#inFlight === operation) this.#inFlight = undefined;
        if (this.#running && !this.#disposed) this.#queuePump(0);
      });
    this.#inFlight = operation;
  }

  #cancelTimer(): void {
    if (this.#timer === undefined) return;
    this.#cancel(this.#timer);
    this.#timer = undefined;
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

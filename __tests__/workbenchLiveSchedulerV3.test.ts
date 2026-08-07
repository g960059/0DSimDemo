import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchLiveSchedulerV3,
  type WorkbenchLiveSchedulerTimerV3,
} from "@/components/workbench/v3/WorkbenchLiveSchedulerV3";
import {
  WorkbenchPerformanceDiagnosticsV3,
  workbenchPerformanceDiagnosticsRequestedV3,
} from "@/components/workbench/v3/WorkbenchPerformanceDiagnosticsV3";
import {
  WORKBENCH_BALANCED_PRESENTATION_PROFILE_V3,
  WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3,
  resolveWorkbenchPresentationProfileV3,
} from "@/components/workbench/v3/WorkbenchPresentationProfileV3";

type Frame = Readonly<{ acceptedTimeSec: number }>;

describe("WorkbenchLiveSchedulerV3", () => {
  it("tracks wall time near 1x with bounded Worker batches", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const batchSizes: number[] = [];
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        batchSizes.push(stepCount);
        return Array.from({ length: stepCount }, () => {
          acceptedTimeSec += 0.002;
          return { acceptedTimeSec };
        });
      },
      onFrames: () => undefined,
      onError: (error) => { throw error; },
    });

    scheduler.play(0);
    for (let index = 0; index < 100; index += 1) {
      await clock.advanceBy(10);
    }

    expect(acceptedTimeSec).toBeGreaterThanOrEqual(0.99);
    expect(acceptedTimeSec).toBeLessThanOrEqual(1.002);
    expect(Math.max(...batchSizes)).toBeLessThanOrEqual(16);
    expect(batchSizes.every((size) => size === 16)).toBe(true);
    // Sixteen exact 2 ms steps share one Worker request/response instead of
    // forcing roughly 500 structured-clone round trips per model second.
    expect(batchSizes.length).toBeLessThanOrEqual(32);
    await scheduler.dispose();
  });

  it("allows latency-sensitive callers to select a smaller preferred batch", async () => {
    const clock = new SchedulerClock();
    const batches: number[] = [];
    let acceptedTimeSec = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        batches.push(stepCount);
        return Array.from({ length: stepCount }, () => ({
          acceptedTimeSec: acceptedTimeSec += 0.002,
        }));
      },
      onFrames: () => undefined,
      onError: (error) => { throw error; },
      maximumBatchSteps: 8,
      preferredBatchSteps: 4,
    });

    scheduler.play(0);
    for (let index = 0; index < 10; index += 1) await clock.advanceBy(8);

    expect(batches[0]).toBe(4);
    expect(batches.every((size) => size >= 4 && size <= 8)).toBe(true);
    expect(batches.length).toBeLessThan(10);
    expect(acceptedTimeSec).toBeGreaterThanOrEqual(0.07);
    expect(acceptedTimeSec).toBeLessThanOrEqual(0.08);
    await scheduler.dispose();
  });

  it("uses a sustainable Worker batch and paced exact presentation slices", async () => {
    expect(WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3).toMatchObject({
      maximumBatchSteps: 16,
      preferredBatchSteps: 16,
      presentationIntervalMs: 16,
      maximumPresentationBatchFrames: 8,
    });

    const clock = new SchedulerClock();
    const batches: number[] = [];
    const delivered: Frame[][] = [];
    let acceptedTimeSec = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        batches.push(stepCount);
        return Array.from({ length: stepCount }, () => ({
          acceptedTimeSec: acceptedTimeSec += 0.002,
        }));
      },
      onFrames: (frames) => delivered.push([...frames]),
      onError: (error) => { throw error; },
      maximumBatchSteps: 16,
      preferredBatchSteps: 16,
      presentationIntervalMs: 16,
      maximumPresentationBatchFrames: 8,
    });

    scheduler.play(0);
    await clock.advanceBy(32);
    expect(batches).toEqual([16]);
    expect(delivered).toHaveLength(1);
    expect(delivered[0]).toHaveLength(8);
    expect(delivered[0]?.at(-1)?.acceptedTimeSec).toBeCloseTo(0.016);

    await clock.advanceBy(16);
    expect(delivered).toHaveLength(2);
    expect(delivered[1]).toHaveLength(8);
    for (const [index, frame] of delivered.flat().entries()) {
      expect(frame.acceptedTimeSec).toBeCloseTo((index + 1) * 0.002);
    }
    await scheduler.dispose();
  });

  it("permits an explicitly bounded catch-up batch", async () => {
    const clock = new SchedulerClock();
    const batches: number[] = [];
    let acceptedTimeSec = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        batches.push(stepCount);
        return Array.from({ length: stepCount }, () => ({
          acceptedTimeSec: acceptedTimeSec += 0.002,
        }));
      },
      onFrames: () => undefined,
      onError: (error) => { throw error; },
      maximumBatchSteps: 16,
      preferredBatchSteps: 8,
      presentationIntervalMs: 0,
    });

    scheduler.play(0);
    await clock.advanceBy(16);
    expect(batches).toEqual([8]);
    await clock.advanceBy(40);
    expect(batches.some((size) => size > 8 && size <= 16)).toBe(true);
    await scheduler.dispose();
  });

  it("pauses without destroying state and re-anchors on resume", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const scheduler = schedulerForClock(clock, (stepCount) => {
      acceptedTimeSec += stepCount * 0.002;
      return acceptedTimeSec;
    });

    scheduler.play(0);
    for (let index = 0; index < 10; index += 1) await clock.advanceBy(10);
    await scheduler.pause();
    const pausedAt = acceptedTimeSec;
    await clock.advanceBy(1_000);
    expect(acceptedTimeSec).toBe(pausedAt);

    scheduler.play(pausedAt);
    for (let index = 0; index < 10; index += 1) await clock.advanceBy(10);
    expect(acceptedTimeSec - pausedAt).toBeGreaterThanOrEqual(0.09);
    expect(acceptedTimeSec - pausedAt).toBeLessThanOrEqual(0.102);
    await scheduler.dispose();
  });

  it("re-anchors hidden-tab time instead of issuing an unbounded catch-up", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const advance = vi.fn(async (stepCount: number) => {
      acceptedTimeSec += stepCount * 0.002;
      return [{ acceptedTimeSec }];
    });
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      advance,
      onFrames: () => undefined,
      onError: (error) => { throw error; },
      maximumBatchSteps: 1,
    });

    scheduler.play(0);
    await clock.advanceBy(20);
    await scheduler.pause();
    const hiddenAt = acceptedTimeSec;
    await clock.advanceBy(10_000);
    scheduler.play(hiddenAt);
    await clock.advanceBy(10);

    expect(acceptedTimeSec - hiddenAt).toBeLessThanOrEqual(0.012);
    await scheduler.dispose();
  });

  it("coalesces a saturated 2,000-sample presentation buffer without dropping Worker frames", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const delivered: Frame[] = [];
    let presentationCount = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        return Array.from({ length: stepCount }, () => {
          acceptedTimeSec += 0.002;
          return { acceptedTimeSec };
        });
      },
      onFrames: (frames) => {
        presentationCount += 1;
        delivered.push(...frames);
      },
      onError: (error) => { throw error; },
      presentationIntervalMs: 32,
    });

    scheduler.play(0);
    for (let index = 0; index < 400; index += 1) {
      await clock.advanceBy(10);
    }
    await scheduler.pause();

    expect(acceptedTimeSec).toBeGreaterThanOrEqual(3.99);
    expect(delivered).toHaveLength(Math.round(acceptedTimeSec / 0.002));
    expect(delivered.length).toBeGreaterThanOrEqual(1_995);
    expect(delivered.length).toBeLessThanOrEqual(2_001);
    expect(delivered.at(-1)?.acceptedTimeSec).toBeCloseTo(acceptedTimeSec);
    // The old path published each 10 ms Worker response (~400 callbacks).
    expect(presentationCount).toBeLessThanOrEqual(102);
    await scheduler.dispose();
  });

  it("flushes a partial presentation batch when paused", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const delivered: Frame[] = [];
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        return Array.from({ length: stepCount }, () => ({
          acceptedTimeSec: acceptedTimeSec += 0.002,
        }));
      },
      onFrames: (frames) => delivered.push(...frames),
      onError: (error) => { throw error; },
      presentationIntervalMs: 100,
    });

    scheduler.play(0);
    await clock.advanceBy(40);
    expect(delivered).toHaveLength(0);
    await scheduler.pause();

    expect(delivered.length).toBeGreaterThan(0);
    expect(delivered.at(-1)?.acceptedTimeSec).toBeCloseTo(acceptedTimeSec);
    await scheduler.dispose();
  });

  it("publishes an accepted prefix synchronously without pausing or duplicating it", async () => {
    const clock = new SchedulerClock();
    let acceptedTimeSec = 0;
    const delivered: Frame[] = [];
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance() {
        return [{ acceptedTimeSec: acceptedTimeSec += 0.002 }];
      },
      onFrames: (frames) => delivered.push(...frames),
      onError: (error) => { throw error; },
      maximumBatchSteps: 1,
      presentationIntervalMs: 1_000,
    });

    scheduler.play(0);
    await clock.advanceBy(2);
    expect(delivered).toEqual([]);

    scheduler.flushAcceptedFrames();
    expect(delivered).toEqual([{ acceptedTimeSec: 0.002 }]);
    expect(scheduler.running).toBe(true);

    scheduler.flushAcceptedFrames();
    await scheduler.pause();
    expect(delivered).toEqual([{ acceptedTimeSec: 0.002 }]);
    await scheduler.dispose();
  });

  it("flushes buffered accepted frames in order before reporting a later Worker failure", async () => {
    const clock = new SchedulerClock();
    const events: string[] = [];
    let advanceCount = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance() {
        advanceCount += 1;
        if (advanceCount <= 2) {
          return [{ acceptedTimeSec: advanceCount * 0.002 }];
        }
        throw new Error("Worker advance failed");
      },
      onFrames: (frames) => {
        events.push(...frames.map(
          (frame) => `frame:${frame.acceptedTimeSec.toFixed(3)}`,
        ));
      },
      onError: (error) => events.push(`error:${error.message}`),
      maximumBatchSteps: 1,
      presentationIntervalMs: 1_000,
    });

    scheduler.play(0);
    await clock.advanceBy(2);
    await clock.advanceBy(2);
    expect(events).toEqual([]);

    await clock.advanceBy(2);

    expect(events).toEqual([
      "frame:0.002",
      "frame:0.004",
      "error:Worker advance failed",
    ]);
    expect(scheduler.running).toBe(false);
    await scheduler.dispose();
    expect(events).toHaveLength(3);
  });
});

describe("Workbench presentation performance controls V3", () => {
  it("aggregates duration and event-interval metrics without frame payloads", () => {
    let nowMs = 0;
    const diagnostics = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: () => nowMs,
    });
    diagnostics.recordDuration("canvas.sweep.draw", 1);
    diagnostics.recordDuration("canvas.sweep.draw", 2);
    diagnostics.recordDuration("canvas.sweep.draw", 10);
    diagnostics.recordEventInterval("canvas.sweep.display-interval");
    diagnostics.recordValue("scheduler.lane.model-time-ratio", 0.8);
    diagnostics.recordValue("scheduler.lane.model-time-ratio", 1.2);
    diagnostics.incrementCounter("scheduler.lane.overload-reanchors");
    diagnostics.incrementCounter("scheduler.lane.overload-reanchors", 2);
    nowMs = 16;
    diagnostics.recordEventInterval("canvas.sweep.display-interval");
    nowMs = 33;
    diagnostics.recordEventInterval("canvas.sweep.display-interval");

    expect(diagnostics.snapshot().metrics).toMatchObject({
      "canvas.sweep.draw": {
        count: 3,
        meanMs: 13 / 3,
        p95Ms: 10,
        maximumMs: 10,
        latestMs: 10,
      },
      "canvas.sweep.display-interval": {
        count: 2,
        meanMs: 16.5,
        p95Ms: 17,
        maximumMs: 17,
        latestMs: 17,
      },
    });
    expect(diagnostics.snapshot().values).toMatchObject({
      "scheduler.lane.model-time-ratio": {
        count: 2,
        mean: 1,
        recentMean: 1,
        p05: 0.8,
        p95: 1.2,
        minimum: 0.8,
        maximum: 1.2,
        latest: 1.2,
      },
    });
    expect(diagnostics.snapshot().counters).toEqual({
      "scheduler.lane.overload-reanchors": 3,
    });

    diagnostics.reset();
    expect(diagnostics.snapshot().metrics).toEqual({});
    expect(diagnostics.snapshot().values).toEqual({});
    expect(diagnostics.snapshot().counters).toEqual({});
  });

  it("reports active overload reanchors without retaining frame data", async () => {
    const clock = new SchedulerClock();
    const diagnostics = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: clock.now,
    });
    let acceptedTimeSec = 0;
    const scheduler = new WorkbenchLiveSchedulerV3<Frame>({
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      acceptedTimeSec: (frame) => frame.acceptedTimeSec,
      async advance(stepCount) {
        return Array.from({ length: stepCount }, () => ({
          acceptedTimeSec: acceptedTimeSec += 0.002,
        }));
      },
      onFrames: () => undefined,
      onError: (error) => { throw error; },
      diagnosticLaneId: "scenario/test",
      performanceRecorder: diagnostics,
      maximumBatchSteps: 16,
      preferredBatchSteps: 8,
      maximumCatchUpSec: 0.25,
    });

    scheduler.play(0);
    await clock.advanceBy(1_000);

    const snapshot = diagnostics.snapshot();
    expect(snapshot.counters).toEqual({
      "scheduler.scenario/test.overload-reanchors": 1,
    });
    expect(snapshot.metrics[
      "scheduler.scenario/test.overload-lag"
    ]?.latestMs).toBe(1_000);
    expect(JSON.stringify(snapshot)).not.toContain("acceptedTimeSec");
    await scheduler.dispose();
  });

  it("keeps diagnostics opt-in and resolves the exact-data cadence A/B flag", () => {
    expect(workbenchPerformanceDiagnosticsRequestedV3("?workbenchPerf=1"))
      .toBe(true);
    expect(workbenchPerformanceDiagnosticsRequestedV3("?workbenchPerf=0"))
      .toBe(false);
    expect(resolveWorkbenchPresentationProfileV3(""))
      .toBe(WORKBENCH_SMOOTH_PRESENTATION_PROFILE_V3);
    expect(resolveWorkbenchPresentationProfileV3(
      "?workbenchPresentation=balanced",
    )).toBe(WORKBENCH_BALANCED_PRESENTATION_PROFILE_V3);
  });
});

function schedulerForClock(
  clock: SchedulerClock,
  advanceTime: (stepCount: number) => number,
): WorkbenchLiveSchedulerV3<Frame> {
  return new WorkbenchLiveSchedulerV3({
    nowMs: clock.now,
    schedule: clock.schedule,
    cancel: clock.cancel,
    acceptedTimeSec: (frame: Frame) => frame.acceptedTimeSec,
    async advance(stepCount) {
      const terminal = advanceTime(stepCount);
      return Array.from({ length: stepCount }, (_, index) => ({
        acceptedTimeSec: terminal - (stepCount - index - 1) * 0.002,
      }));
    },
    onFrames: () => undefined,
    onError: (error) => { throw error; },
  });
}

class SchedulerClock {
  #nowMs = 0;
  #nextId = 1;
  readonly #timers = new Map<number, Readonly<{
    atMs: number;
    callback: () => void;
  }>>();

  readonly now = () => this.#nowMs;

  readonly schedule = (
    callback: () => void,
    delayMs: number,
  ): WorkbenchLiveSchedulerTimerV3 => {
    const id = this.#nextId;
    this.#nextId += 1;
    this.#timers.set(id, { atMs: this.#nowMs + delayMs, callback });
    return id as unknown as WorkbenchLiveSchedulerTimerV3;
  };

  readonly cancel = (timer: WorkbenchLiveSchedulerTimerV3): void => {
    this.#timers.delete(timer as unknown as number);
  };

  async advanceBy(deltaMs: number): Promise<void> {
    this.#nowMs += deltaMs;
    for (let iteration = 0; iteration < 1_000; iteration += 1) {
      const due = [...this.#timers.entries()]
        .filter(([, timer]) => timer.atMs <= this.#nowMs)
        .sort((left, right) => left[1].atMs - right[1].atMs)[0];
      if (due === undefined) {
        await Promise.resolve();
        const newlyDue = [...this.#timers.values()].some(
          (timer) => timer.atMs <= this.#nowMs,
        );
        if (!newlyDue) return;
        continue;
      }
      this.#timers.delete(due[0]);
      due[1].callback();
      await Promise.resolve();
      await Promise.resolve();
    }
    throw new Error("scheduler clock did not drain");
  }
}

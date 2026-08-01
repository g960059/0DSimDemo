import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchLiveSchedulerV3,
  type WorkbenchLiveSchedulerTimerV3,
} from "@/components/workbench/v3/WorkbenchLiveSchedulerV3";

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
    expect(Math.max(...batchSizes)).toBeLessThanOrEqual(8);
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

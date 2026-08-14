import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchGroupTimeConductorV3,
  type WorkbenchGroupTimeConductorLaneV3,
  type WorkbenchGroupTimeConductorTimerV3,
} from "@/components/workbench/v3/WorkbenchGroupTimeConductorV3";
import {
  formatWorkbenchPlaybackRateV3,
  snapWorkbenchPlaybackRateV3,
} from "@/components/workbench/WorkbenchPlaybackControlV3";

type Frame = Readonly<{ laneId: string; timeSec: number; index: number }>;

describe("WorkbenchGroupTimeConductorV3", () => {
  it("publishes only after every Scenario reaches the same group boundary", async () => {
    const clock = new GroupClockV3();
    const baseline = deferredV3<readonly Frame[]>();
    const comparison = deferredV3<readonly Frame[]>();
    const onFrames = vi.fn<(frames: readonly Frame[]) => void>();
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [
        laneV3("baseline", 0, () => baseline.promise),
        laneV3("comparison", 0, () => comparison.promise),
      ],
      onFrames,
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 2,
      presentationIntervalMs: 0,
      maximumPresentationFramesPerLane: 2,
    });

    conductor.play();
    await clock.advanceBy(0);
    baseline.resolve(framesV3("baseline", 0, 2));
    await flushMicrotasksV3();
    expect(onFrames).not.toHaveBeenCalled();

    comparison.resolve(framesV3("comparison", 0, 2));
    await flushMicrotasksV3();
    expect(onFrames).toHaveBeenCalledOnce();
    expect(onFrames.mock.calls[0]![0].map(({ laneId, timeSec }) =>
      [laneId, timeSec])).toEqual([
        ["baseline", 0.002],
        ["baseline", 0.004],
        ["comparison", 0.002],
        ["comparison", 0.004],
      ]);
    await conductor.pause();
  });

  it("derives a headroom-bound safe rate and caps manual selection", async () => {
    const clock = new GroupClockV3();
    let acceptedTimeSec = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(64);
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: vi.fn(),
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      presentationIntervalMs: 0,
    });

    conductor.play();
    await clock.advanceBy(0);
    await flushMicrotasksV3();
    expect(conductor.playbackRateState()).toMatchObject({
      mode: "auto",
      effectiveRate: 0.45,
      safeMaximumRate: 0.45,
    });

    expect(conductor.setPlaybackRate(1)).toMatchObject({
      mode: "manual",
      effectiveRate: 0.45,
      requestedRate: 0.45,
    });
    expect(conductor.setPlaybackRate(0.25)).toMatchObject({
      effectiveRate: 0.25,
      requestedRate: 0.25,
    });
    expect(conductor.setPlaybackRate("auto")).toMatchObject({
      mode: "auto",
      effectiveRate: 0.45,
      requestedRate: null,
    });
    await conductor.pause();
  });

  it("slices every Scenario at the same presentation offset", async () => {
    const clock = new GroupClockV3();
    const onFrames = vi.fn<(frames: readonly Frame[]) => void>();
    const accepted = new Map([["baseline", 0], ["comparison", 0]]);
    const lanes = ["baseline", "comparison"].map((laneId) =>
      laneV3(laneId, accepted.get(laneId)!, async (stepCount) => {
        clock.elapse(20);
        const frames = framesV3(laneId, accepted.get(laneId)!, stepCount);
        accepted.set(laneId, frames.at(-1)!.timeSec);
        return frames;
      }));
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => lanes.map((lane) => Object.freeze({
        ...lane,
        acceptedTimeSec: accepted.get(lane.laneId)!,
      })),
      onFrames,
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 4,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 2,
    });

    conductor.play();
    await clock.advanceBy(0);
    await flushMicrotasksV3();
    expect(onFrames).toHaveBeenCalledOnce();
    expect(onFrames.mock.calls[0]![0].map(({ index }) => index))
      .toEqual([1, 2, 1, 2]);

    await clock.advanceBy(16);
    expect(onFrames).toHaveBeenCalledTimes(2);
    expect(onFrames.mock.calls[1]![0].map(({ index }) => index))
      .toEqual([3, 4, 3, 4]);
    await conductor.pause();
  });

  it("fails closed before publishing a lane with an off-tick clock", async () => {
    const clock = new GroupClockV3();
    const onFrames = vi.fn();
    const onError = vi.fn();
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", 0, async () => Object.freeze([
        Object.freeze({ laneId: "baseline", timeSec: 0.003, index: 1 }),
      ]))],
      onFrames,
      onError,
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 1,
      presentationIntervalMs: 0,
    });

    conductor.play();
    await clock.advanceBy(0);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onFrames).not.toHaveBeenCalled();
    expect(conductor.running).toBe(false);
  });

  it("flushes the complete aligned prefix when playback pauses", async () => {
    const clock = new GroupClockV3();
    const onFrames = vi.fn<(frames: readonly Frame[]) => void>();
    let acceptedTimeSec = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames,
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 4,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 2,
    });

    conductor.play();
    await clock.advanceBy(0);
    await flushMicrotasksV3();
    expect(onFrames).not.toHaveBeenCalled();

    await conductor.pause();
    expect(onFrames).toHaveBeenCalledOnce();
    expect(onFrames.mock.calls[0]![0].map(({ index }) => index))
      .toEqual([1, 2, 3, 4]);
  });

  it("resets a conservative cold-start limit when lane membership changes", () => {
    let laneCount = 1;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => Array.from({ length: laneCount }, (_, index) =>
        laneV3(`lane-${index}`, 0, async () => [])),
      onFrames: vi.fn(),
      onError: vi.fn(),
    });
    expect(conductor.playbackRateState().safeMaximumRate).toBeCloseTo(0.85);

    laneCount = 4;
    expect(conductor.lanesChanged().safeMaximumRate).toBeCloseTo(0.425);
  });
});

describe("Workbench playback-rate presentation", () => {
  it("snaps to familiar detents without crossing the safe device limit", () => {
    expect(snapWorkbenchPlaybackRateV3(0.52, 1)).toBe(0.5);
    expect(snapWorkbenchPlaybackRateV3(0.73, 1)).toBe(0.75);
    expect(snapWorkbenchPlaybackRateV3(0.52, 0.47)).toBe(0.47);
    expect(formatWorkbenchPlaybackRateV3(0.5)).toBe("0.5×");
    expect(formatWorkbenchPlaybackRateV3(1)).toBe("1×");
  });
});

function laneV3(
  laneId: string,
  acceptedTimeSec: number,
  advance: (stepCount: number) => Promise<readonly Frame[]>,
): WorkbenchGroupTimeConductorLaneV3<Frame> {
  return Object.freeze({
    laneId,
    acceptedTimeSec,
    advance,
    frameAcceptedTimeSec: (frame) => frame.timeSec,
  });
}

function framesV3(
  laneId: string,
  startTimeSec: number,
  count: number,
): readonly Frame[] {
  return Object.freeze(Array.from({ length: count }, (_, offset) =>
    Object.freeze({
      laneId,
      timeSec: startTimeSec + (offset + 1) * 0.002,
      index: offset + 1,
    })));
}

function deferredV3<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

async function flushMicrotasksV3(): Promise<void> {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

class GroupClockV3 {
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
  ): WorkbenchGroupTimeConductorTimerV3 => {
    const id = this.#nextId;
    this.#nextId += 1;
    this.#timers.set(id, { atMs: this.#nowMs + delayMs, callback });
    return id as unknown as WorkbenchGroupTimeConductorTimerV3;
  };

  readonly cancel = (timer: WorkbenchGroupTimeConductorTimerV3): void => {
    this.#timers.delete(timer as unknown as number);
  };

  elapse(deltaMs: number): void {
    this.#nowMs += deltaMs;
  }

  async advanceBy(deltaMs: number): Promise<void> {
    this.#nowMs += deltaMs;
    for (let iteration = 0; iteration < 1_000; iteration += 1) {
      const due = [...this.#timers.entries()]
        .filter(([, timer]) => timer.atMs <= this.#nowMs)
        .sort((left, right) => left[1].atMs - right[1].atMs)[0];
      if (due === undefined) {
        await flushMicrotasksV3();
        return;
      }
      this.#timers.delete(due[0]);
      due[1].callback();
      await flushMicrotasksV3();
    }
    throw new Error("group TimeConductor clock did not drain");
  }
}

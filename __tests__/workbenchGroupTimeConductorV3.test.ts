import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchGroupTimeConductorV3,
  type WorkbenchGroupTimeConductorLaneV3,
  type WorkbenchGroupTimeConductorTimerV3,
} from "@/components/workbench/runtime/WorkbenchGroupTimeConductorV3";
import { WorkbenchPerformanceDiagnosticsV3 } from
  "@/components/workbench/runtime/WorkbenchPerformanceDiagnosticsV3";
import {
  formatWorkbenchPlaybackRateV3,
  snapWorkbenchPlaybackRateV3,
  workbenchPlaybackPresetRatesV3,
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

  it("calibrates once, defaults to real time, and keeps the selected rate fixed", async () => {
    const clock = new GroupClockV3();
    let acceptedTimeSec = 0;
    let groupWallMs = 16;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(groupWallMs);
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
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await clock.runNextTimer();
      if (!conductor.playbackRateState().calibrating) break;
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1,
      maximumRate: 1.5,
      calibrating: false,
      userSelected: false,
    });

    expect(conductor.setPlaybackRate(1.5)).toMatchObject({
      playbackRate: 1.5,
      maximumRate: 1.5,
      userSelected: true,
    });
    expect(() => conductor.setPlaybackRate(2)).toThrow(/calibrated limit/);

    groupWallMs = 40;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      await clock.runNextTimer();
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1.5,
      maximumRate: 1.5,
      performanceLimited: true,
    });
    await conductor.pause();
  });

  it("starts below real time when the calibrated tier cannot sustain 1×", async () => {
    const clock = new GroupClockV3();
    let acceptedTimeSec = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(50);
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
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await clock.runNextTimer();
      if (!conductor.playbackRateState().calibrating) break;
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 0.5,
      maximumRate: 0.5,
      calibrating: false,
      userSelected: false,
    });
    await conductor.pause();
  });

  it("excludes hidden or background-contended batches from calibration", async () => {
    const clock = new GroupClockV3();
    const performance = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: clock.now,
    });
    let acceptedTimeSec = 0;
    let eligible = false;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(eligible ? 16 : 64);
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: vi.fn(),
      onError: vi.fn(),
      capacityMeasurementEligible: () => eligible,
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      presentationIntervalMs: 0,
      performanceRecorder: performance,
    });

    conductor.play();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await clock.runNextTimer();
    }
    expect(conductor.playbackRateState()).toMatchObject({
      maximumRate: null,
      calibrating: true,
    });

    eligible = true;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await clock.runNextTimer();
      if (!conductor.playbackRateState().calibrating) break;
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1,
      maximumRate: 1.5,
      calibrating: false,
    });
    const counters = performance.snapshot().counters;
    expect(counters["scheduler.group.capacity-samples-rejected"])
      .toBeGreaterThanOrEqual(12);
    expect(counters["scheduler.group.capacity-samples-accepted"])
      .toBeGreaterThanOrEqual(12);
    await conductor.pause();
  });

  it("promotes a provisional low ceiling after stable foreground evidence", async () => {
    const clock = new GroupClockV3();
    const performance = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: clock.now,
    });
    let acceptedTimeSec = 0;
    let groupWallMs = 50;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(groupWallMs);
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: vi.fn(),
      onError: vi.fn(),
      capacityMeasurementEligible: () => true,
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      presentationIntervalMs: 0,
      performanceRecorder: performance,
    });

    conductor.play();
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await clock.runNextTimer();
      if (!conductor.playbackRateState().calibrating) break;
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 0.5,
      maximumRate: 0.5,
      calibrating: false,
    });

    groupWallMs = 16;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await clock.runNextTimer();
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1,
      maximumRate: 1.5,
      calibrating: false,
      userSelected: false,
      performanceLimited: false,
    });
    expect(
      performance.snapshot().counters[
        "scheduler.group.safe-playback-rate-promotions"
      ],
    ).toBe(1);
    await conductor.pause();
  });

  it("rounds a device ceiling down to a stable 0.5× tier", async () => {
    const clock = new GroupClockV3();
    let acceptedTimeSec = 0;
    const groupWallMs = 32 * 0.9 / 4.65;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(groupWallMs);
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
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await clock.runNextTimer();
      if (!conductor.playbackRateState().calibrating) break;
    }
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1,
      maximumRate: 4.5,
      calibrating: false,
    });
    await conductor.pause();
  });

  it("slices every Scenario at the same presentation offset", async () => {
    const clock = new GroupClockV3();
    const onFrames = vi.fn<(frames: readonly Frame[]) => void>();
    const accepted = new Map([["baseline", 0], ["comparison", 0]]);
    const lanes = ["baseline", "comparison"].map((laneId) =>
      laneV3(laneId, accepted.get(laneId)!, async (stepCount) => {
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
      maximumPresentationFramesPerLane: 4,
    });

    conductor.setPlaybackRate(0.5);
    conductor.play();
    await clock.advanceBy(0);
    await flushMicrotasksV3();
    expect(onFrames).not.toHaveBeenCalled();

    await clock.advanceBy(16);
    expect(onFrames).toHaveBeenCalledOnce();
    expect(onFrames.mock.calls[0]![0].map(({ index }) => index))
      .toEqual([1, 2, 1, 2]);

    await clock.advanceBy(16);
    expect(onFrames).toHaveBeenCalledTimes(2);
    expect(onFrames.mock.calls[1]![0].map(({ index }) => index))
      .toEqual([3, 4, 3, 4]);
    await conductor.pause();
  });

  it("uses fractional presentation credit for sub-unit playback", async () => {
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

    conductor.setPlaybackRate(0.25);
    conductor.play();
    await clock.advanceBy(0);
    await clock.advanceBy(16);
    expect(onFrames).not.toHaveBeenCalled();

    await clock.advanceBy(16);
    expect(onFrames).toHaveBeenCalledOnce();
    expect(onFrames.mock.calls[0]![0].map(({ index }) => index)).toEqual([1]);

    await clock.advanceBy(32);
    expect(onFrames).toHaveBeenCalledTimes(2);
    expect(onFrames.mock.calls[1]![0].map(({ index }) => index)).toEqual([2]);
    await conductor.pause();
  });

  it.each([
    { label: "0.25×", requestedRate: 0.25, minimumRate: 0.25, maximumRate: 5 },
    { label: "0.5×", requestedRate: 0.5, minimumRate: 0.25, maximumRate: 5 },
    { label: "1×", requestedRate: 1, minimumRate: 0.25, maximumRate: 5 },
    { label: "5×", requestedRate: 5, minimumRate: 0.25, maximumRate: 5 },
  ])("paces visible model time uniformly at $label", async ({
    requestedRate,
    minimumRate,
    maximumRate,
  }) => {
    const clock = new GroupClockV3();
    let acceptedTimeSec = 0;
    let presentedFrames = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: (frames) => { presentedFrames += frames.length; },
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 16,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 8,
      minimumPlaybackRate: minimumRate,
      maximumPlaybackRate: maximumRate,
    });

    const effectiveRate = conductor.setPlaybackRate(requestedRate)
      .playbackRate;
    conductor.play();
    await clock.advanceBy(0);
    for (let elapsedDeciMs = 0; elapsedDeciMs <= 16_000; elapsedDeciMs += 1) {
      await clock.advanceBy(0.1);
    }

    const expectedFrames = Math.floor(100 * 8 * effectiveRate + 1e-9);
    // A newly started lane may spend one presentation boundary filling its
    // initial queue. That fixed startup cost must not turn into
    // rate-dependent drift over the steady interval.
    expect(Math.abs(presentedFrames - expectedFrames)).toBeLessThanOrEqual(40);
    expect(presentedFrames * 0.002 / 1.6).toBeCloseTo(effectiveRate, 1);
    await conductor.pause();
  });

  it("re-times queued compute when the user raises the group rate", async () => {
    const clock = new GroupClockV3();
    const presentedTimes: number[] = [];
    let acceptedTimeSec = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: (frames) => {
        presentedTimes.push(...frames.map(({ timeSec }) => timeSec));
      },
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 16,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 8,
      minimumPlaybackRate: 0.25,
      maximumPlaybackRate: 1,
    });

    conductor.setPlaybackRate(0.5);
    conductor.play();
    await clock.advanceBy(0);
    expect(acceptedTimeSec).toBeCloseTo(0.032);

    await clock.advanceBy(8);
    const raisedRate = conductor.setPlaybackRate(1).playbackRate;
    await clock.advanceBy(0);
    expect(acceptedTimeSec).toBeCloseTo(0.032);
    expect(presentedTimes).toEqual([]);

    await clock.advanceBy(16);
    await clock.advanceBy(16);
    const expectedFrameCount = Math.floor(2 * 8 * raisedRate + 1e-9);
    expect(presentedTimes).toEqual(
      Array.from(
        { length: expectedFrameCount },
        (_, index) => (index + 1) * 0.002,
      ),
    );
    await clock.advanceBy(6);
    expect(acceptedTimeSec).toBeCloseTo(0.064);
    await conductor.pause();
  });

  it("keeps the presentation queue bounded above real time", async () => {
    const clock = new GroupClockV3();
    const performance = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: clock.now,
    });
    let acceptedTimeSec = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        clock.elapse(1);
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: vi.fn(),
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 8,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 8,
      performanceRecorder: performance,
    });

    conductor.play();
    await clock.advanceBy(0);
    for (let elapsedMs = 0; elapsedMs < 500; elapsedMs += 1) {
      await clock.advanceBy(1);
    }

    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 1,
      maximumRate: 5,
    });
    const backlog = performance.snapshot().values[
      "scheduler.group.presentation-backlog-frames-per-lane"
    ];
    expect(backlog).toBeDefined();
    expect(backlog!.maximum).toBeLessThanOrEqual(32);
    expect(backlog!.latest).toBeLessThanOrEqual(16);
    await conductor.pause();
  });

  it("re-anchors compute after a long stall instead of replaying missed deadlines", async () => {
    const clock = new GroupClockV3();
    const performance = new WorkbenchPerformanceDiagnosticsV3({
      enabled: true,
      nowMs: clock.now,
    });
    let acceptedTimeSec = 0;
    let advanceCount = 0;
    let presentedFrameCount = 0;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => [laneV3("baseline", acceptedTimeSec, async (stepCount) => {
        advanceCount += 1;
        clock.elapse(advanceCount === 1 ? 10_000 : 1);
        const frames = framesV3("baseline", acceptedTimeSec, stepCount);
        acceptedTimeSec = frames.at(-1)!.timeSec;
        return frames;
      })],
      onFrames: (frames) => { presentedFrameCount += frames.length; },
      onError: vi.fn(),
      nowMs: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
      batchSteps: 16,
      presentationIntervalMs: 16,
      maximumPresentationFramesPerLane: 8,
      performanceRecorder: performance,
    });

    conductor.play();
    await clock.advanceBy(0);

    // The completed stalled batch may be followed by one immediate batch.
    // Older wall deadlines are discarded rather than converted into accepted
    // model work and a many-second presentation queue.
    expect(advanceCount).toBe(2);
    expect(acceptedTimeSec).toBeCloseTo(0.064);
    const backlog = performance.snapshot().values[
      "scheduler.group.presentation-backlog-frames-per-lane"
    ];
    expect(backlog).toBeDefined();
    expect(backlog!.maximum).toBeLessThanOrEqual(16);
    expect(backlog!.latest).toBeLessThanOrEqual(16);

    await conductor.pause();
    expect(presentedFrameCount).toBe(32);
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

  it("recalibrates lane membership without changing an explicit selection", () => {
    let laneCount = 1;
    const conductor = new WorkbenchGroupTimeConductorV3({
      lanes: () => Array.from({ length: laneCount }, (_, index) =>
        laneV3(`lane-${index}`, 0, async () => [])),
      onFrames: vi.fn(),
      onError: vi.fn(),
    });
    expect(conductor.playbackRateState()).toMatchObject({
      playbackRate: 0.5,
      maximumRate: null,
      calibrating: true,
    });

    conductor.setPlaybackRate(0.75);

    laneCount = 4;
    expect(conductor.lanesChanged()).toMatchObject({
      playbackRate: 0.75,
      maximumRate: null,
      calibrating: true,
      userSelected: true,
    });
  });
});

describe("Workbench playback-rate presentation", () => {
  it("snaps every selection to the 0.25× lattice without crossing the limit", () => {
    expect(snapWorkbenchPlaybackRateV3(0.52, 1)).toBe(0.5);
    expect(snapWorkbenchPlaybackRateV3(0.73, 1)).toBe(0.75);
    expect(snapWorkbenchPlaybackRateV3(1.88, 1.75)).toBe(1.75);
    expect(formatWorkbenchPlaybackRateV3(0.5)).toBe("0.5×");
    expect(formatWorkbenchPlaybackRateV3(1)).toBe("1×");
  });

  it("keeps the preset row stable across device ceilings", () => {
    expect(workbenchPlaybackPresetRatesV3()).toEqual([0.25, 0.5, 1, 2, 5]);
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

  async runNextTimer(): Promise<void> {
    const next = [...this.#timers.entries()]
      .sort((left, right) => left[1].atMs - right[1].atMs)[0];
    if (next === undefined) throw new Error("group TimeConductor has no timer");
    this.#timers.delete(next[0]);
    this.#nowMs = Math.max(this.#nowMs, next[1].atMs);
    next[1].callback();
    await flushMicrotasksV3();
  }
}

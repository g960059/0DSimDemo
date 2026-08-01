import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchParallelScenarioRuntimeV3,
  type WorkbenchParallelScenarioRuntimeClientV3,
} from "@/components/workbench/v3/WorkbenchParallelScenarioRuntimeV3";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  WorkbenchLiveSchedulerV3,
  type WorkbenchLiveSchedulerDependenciesV3,
  type WorkbenchLiveSchedulerTimerV3,
} from "@/components/workbench/v3/WorkbenchLiveSchedulerV3";

describe("WorkbenchParallelScenarioRuntimeV3", () => {
  it("creates one persistent Worker and scheduler for every Scenario", async () => {
    const harness = harnessV3();
    const state = await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 4),
      ],
      activeScenarioId: "scenario/comparison",
    });

    expect([...harness.clients]).toHaveLength(2);
    expect(harness.clients.get("scenario/baseline")?.initialize)
      .toHaveBeenCalledWith(expect.objectContaining({
        runtimeSessionId: "runtime/scenario/baseline",
        scenarioId: "scenario/baseline",
        fixture: { value: 0 },
      }));
    expect(harness.clients.get("scenario/comparison")?.initialize)
      .toHaveBeenCalledWith(expect.objectContaining({
        runtimeSessionId: "runtime/scenario/comparison",
        scenarioId: "scenario/comparison",
        checkpoint: expect.objectContaining({ acceptedRevision: 4 }),
      }));
    expect(state.activeScenarioId).toBe("scenario/comparison");

    harness.runtime.playAll();
    expect([...harness.schedulers.values()].every(({ running }) => running))
      .toBe(true);
    await harness.runtime.pauseAll();
    expect([...harness.schedulers.values()].every(({ running }) => !running))
      .toBe(true);
  });

  it("coalesces independently delivered lane frames into one presentation commit", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });
    harness.runtime.playAll();
    harness.schedulers.get("scenario/baseline")!.emit([
      frameV3("scenario/baseline", 1),
      frameV3("scenario/baseline", 2),
    ]);
    harness.schedulers.get("scenario/comparison")!.emit([
      frameV3("scenario/comparison", 1),
    ]);

    expect(harness.onFrames).not.toHaveBeenCalled();
    expect(harness.flushCallbacks).toHaveLength(1);
    harness.flushCallbacks.shift()!();
    expect(harness.onFrames).toHaveBeenCalledOnce();
    expect(harness.onFrames.mock.calls[0]![0].map((frame) => [
      frame.scenarioId,
      frame.acceptedRevision,
    ])).toEqual([
      ["scenario/baseline", 1],
      ["scenario/baseline", 2],
      ["scenario/comparison", 1],
    ]);
    expect(harness.runtime.latestFrame("scenario/baseline").acceptedRevision)
      .toBe(2);
  });

  it("duplicates from the source lane's exact capture and keeps labels in the pool", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 3)],
      activeScenarioId: "scenario/baseline",
    });
    harness.clients.get("scenario/baseline")!.readScenarios.mockResolvedValue({
      activeScenarioId: "scenario/baseline",
      scenarios: [scenarioV3("scenario/baseline", "stale worker label", 9)],
    });

    const duplicated = await harness.runtime.duplicateScenario({
      sourceScenarioId: "scenario/baseline",
      scenarioId: "scenario/copy",
      label: "Copy",
    });
    expect(duplicated.activeScenarioId).toBe("scenario/copy");
    expect(harness.clients.get("scenario/copy")?.initialize)
      .toHaveBeenCalledWith(expect.objectContaining({
        fixture: { value: 9 },
        checkpoint: expect.objectContaining({ acceptedRevision: 9 }),
      }));

    harness.runtime.renameScenario({
      scenarioId: "scenario/baseline",
      label: "Renamed baseline",
    });
    const captures = await harness.runtime.captureScenarios();
    expect(captures.scenarios.map(({ scenarioId, label }) =>
      [scenarioId, label])).toEqual([
      ["scenario/baseline", "Renamed baseline"],
      ["scenario/copy", "Copy"],
    ]);
  });

  it("routes controls to only the selected lane and disposes a deleted lane", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/comparison",
    });
    const comparisonClient = harness.clients.get("scenario/comparison")!;
    comparisonClient.applyControl.mockResolvedValue(
      frameV3("scenario/comparison", 7),
    );
    await harness.runtime.applyControl({
      scenarioId: "scenario/comparison",
      controlId: "control/svr",
      value: 1.2,
      expectedInputEpoch: 0,
    });
    expect(comparisonClient.applyControl).toHaveBeenCalledOnce();
    expect(harness.clients.get("scenario/baseline")?.applyControl)
      .not.toHaveBeenCalled();

    const deletedScheduler = harness.schedulers.get("scenario/comparison")!;
    const next = await harness.runtime.deleteScenario("scenario/comparison");
    expect(next.activeScenarioId).toBe("scenario/baseline");
    expect(deletedScheduler.dispose).toHaveBeenCalledOnce();
    expect(comparisonClient.terminate).toHaveBeenCalledOnce();
  });

  it("fail-closes every lane when one persistent Worker scheduler fails", async () => {
    const onError = vi.fn();
    const harness = harnessV3(onError);
    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });

    harness.schedulers.get("scenario/baseline")!.emit([
      frameV3("scenario/baseline", 1),
      frameV3("scenario/baseline", 2),
    ]);
    expect(harness.onFrames).not.toHaveBeenCalled();

    harness.schedulers.get("scenario/comparison")!
      .fail(new Error("comparison Worker failed"));

    expect(harness.onFrames).toHaveBeenCalledOnce();
    expect(harness.onFrames.mock.calls[0]![0].map(({ acceptedRevision }) =>
      acceptedRevision)).toEqual([1, 2]);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: "comparison Worker failed",
    }));
    expect([...harness.clients.values()].every(({ terminate }) =>
      terminate.mock.calls.length === 1)).toBe(true);
    const firstTerminate = Math.min(...[...harness.clients.values()].map(
      ({ terminate }) => terminate.mock.invocationCallOrder[0]!,
    ));
    expect(harness.onFrames.mock.invocationCallOrder[0])
      .toBeLessThan(firstTerminate);
    expect(firstTerminate).toBeLessThan(onError.mock.invocationCallOrder[0]!);
    harness.flushCallbacks.shift()?.();
    expect(harness.onFrames).toHaveBeenCalledOnce();
    expect(() => harness.runtime.activeFrame()).toThrow(/not active/);
    expect(() => harness.runtime.playAll()).not.toThrow();
    await expect(harness.runtime.pauseAll()).resolves.toBeUndefined();
  });

  it("publishes a healthy real scheduler's buffered accepted prefix before a sibling fails", async () => {
    const clock = new ParallelSchedulerClockV3();
    const events: string[] = [];
    const clients = new Map<string, ReturnType<typeof clientV3>>();
    const stalePoolFlushes: Array<() => void> = [];
    const runtime = new WorkbenchParallelScenarioRuntimeV3({
      expectedModelId: "model/main-wire-v3-r1",
      createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
      createClient: (scenarioId) => {
        const client = clientV3(scenarioId);
        let acceptedRevision = 0;
        client.advance.mockImplementation(async (input) => {
          if (scenarioId === "scenario/comparison") {
            throw new Error("comparison failed");
          }
          const { stepCount } = input as unknown as { stepCount: number };
          return Array.from({ length: stepCount }, () =>
            frameV3(scenarioId, acceptedRevision += 1));
        });
        clients.set(scenarioId, client);
        return client as unknown as WorkbenchParallelScenarioRuntimeClientV3;
      },
      createScheduler: (_scenarioId, dependencies) =>
        new WorkbenchLiveSchedulerV3({
          ...dependencies,
          nowMs: clock.now,
          schedule: clock.schedule,
          cancel: clock.cancel,
          maximumBatchSteps: 1,
          preferredBatchSteps: 1,
          presentationIntervalMs: 1_000,
        }),
      scheduleFrameFlush: (callback) => {
        stalePoolFlushes.push(callback);
        return stalePoolFlushes.length as unknown as
          WorkbenchLiveSchedulerTimerV3;
      },
      cancelFrameFlush: () => undefined,
      onFrames: (frames) => events.push(...frames.map(
        ({ scenarioId, acceptedRevision }) =>
          `frame:${scenarioId}:${acceptedRevision}`,
      )),
      onError: (error) => events.push(`error:${error.message}`),
    });
    await runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });

    runtime.playAll();
    await clock.advanceBy(2);

    expect(events).toEqual([
      "frame:scenario/baseline:1",
      "error:comparison failed",
    ]);
    expect([...clients.values()].every(({ terminate }) =>
      terminate.mock.calls.length === 1)).toBe(true);
    expect(() => runtime.activeFrame()).toThrow(/not active/);

    // The canceled pool-level coalescing callback cannot republish the prefix.
    stalePoolFlushes.forEach((flush) => flush());
    expect(events).toEqual([
      "frame:scenario/baseline:1",
      "error:comparison failed",
    ]);
    await expect(runtime.pauseAll()).resolves.toBeUndefined();
    await runtime.dispose();
  });

  it("reserves an ID while a Scenario lane is being added", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });
    const first = harness.runtime.addScenario(
      seedV3("scenario/comparison", "Comparison", 0),
    );
    await expect(harness.runtime.addScenario(
      seedV3("scenario/comparison", "Another comparison", 0),
    )).rejects.toThrow(/already exists/);
    await expect(first).resolves.toMatchObject({
      activeScenarioId: "scenario/comparison",
    });
    expect(harness.clients.get("scenario/comparison")?.initialize)
      .toHaveBeenCalledOnce();
  });

  it("does not allocate a Worker when runtime-session identity creation fails", async () => {
    const createClient = vi.fn(() =>
      clientV3("scenario/baseline") as unknown as
        WorkbenchParallelScenarioRuntimeClientV3);
    const runtime = new WorkbenchParallelScenarioRuntimeV3({
      expectedModelId: "model/main-wire-v3-r1",
      createClient,
      createRuntimeSessionId: () => {
        throw new Error("identity unavailable");
      },
      onFrames: vi.fn(),
      onError: vi.fn(),
    });

    await expect(runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    })).rejects.toThrow("identity unavailable");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("fail-closes the pool if any scheduler rejects global playback", async () => {
    const onError = vi.fn();
    const harness = harnessV3(onError);
    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });
    harness.schedulers.get("scenario/comparison")!.play
      .mockImplementationOnce(() => {
        throw new Error("scheduler disposed unexpectedly");
      });

    expect(() => harness.runtime.playAll()).not.toThrow();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: "scheduler disposed unexpectedly",
    }));
    expect([...harness.clients.values()].every(({ terminate }) =>
      terminate.mock.calls.length === 1)).toBe(true);
  });
});

function harnessV3(onError = vi.fn<(error: Error) => void>()) {
  const clients = new Map<string, ReturnType<typeof clientV3>>();
  const schedulers = new Map<string, FakeSchedulerV3>();
  const flushCallbacks: Array<() => void> = [];
  const onFrames = vi.fn<(frames: readonly StudioSimulationFrameV2[]) => void>();
  const runtime = new WorkbenchParallelScenarioRuntimeV3({
    expectedModelId: "model/main-wire-v3-r1",
    createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
    createClient: (scenarioId) => {
      const client = clientV3(scenarioId);
      clients.set(scenarioId, client);
      return client as unknown as WorkbenchParallelScenarioRuntimeClientV3;
    },
    createScheduler: (scenarioId, dependencies) => {
      const scheduler = new FakeSchedulerV3(dependencies);
      schedulers.set(scenarioId, scheduler);
      return scheduler;
    },
    scheduleFrameFlush: (callback) => {
      flushCallbacks.push(callback);
      return flushCallbacks.length as unknown as WorkbenchLiveSchedulerTimerV3;
    },
    cancelFrameFlush: () => undefined,
    onFrames,
    onError,
  });
  return { clients, flushCallbacks, onFrames, runtime, schedulers };
}

class FakeSchedulerV3 {
  running = false;
  readonly dispose = vi.fn(async () => { this.running = false; });
  readonly flushAcceptedFrames = vi.fn(() => undefined);
  readonly pause = vi.fn(async () => { this.running = false; });
  readonly play = vi.fn(() => { this.running = true; });

  constructor(
    readonly dependencies:
      WorkbenchLiveSchedulerDependenciesV3<StudioSimulationFrameV2>,
  ) {}

  emit(frames: readonly StudioSimulationFrameV2[]): void {
    this.dependencies.onFrames(frames);
  }

  fail(error: Error): void {
    this.dependencies.onError(error);
  }
}

class ParallelSchedulerClockV3 {
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
    throw new Error("parallel scheduler clock did not drain");
  }
}

function clientV3(scenarioId: string) {
  let clock = 0;
  return {
    advance: vi.fn(async (stepCount: number) => Array.from(
      { length: stepCount },
      () => frameV3(scenarioId, clock += 1),
    )),
    applyControl: vi.fn(),
    initialize: vi.fn(async (input: { checkpoint?: { acceptedRevision: number } }) => {
      clock = input.checkpoint?.acceptedRevision ?? 0;
      return frameV3(scenarioId, clock);
    }),
    readScenarios: vi.fn(async () => ({
      activeScenarioId: scenarioId,
      scenarios: [scenarioV3(scenarioId, scenarioId, clock)],
    })),
    requestAnalysis: vi.fn(),
    terminate: vi.fn(),
  };
}

function seedV3(scenarioId: string, label: string, clock: number) {
  return {
    scenarioId,
    label,
    fixture: { value: clock },
    ...(clock === 0 ? {} : { checkpoint: checkpointV3(clock) }),
  };
}

function scenarioV3(scenarioId: string, label: string, clock: number) {
  return {
    scenarioId,
    label,
    capture: {
      fixture: { value: clock },
      checkpoint: checkpointV3(clock),
    },
  };
}

function checkpointV3(clock: number) {
  return {
    acceptedRevision: clock,
    acceptedTimeSec: clock * 0.002,
    payload: { state: clock },
  };
}

function frameV3(
  scenarioId: string,
  acceptedRevision: number,
): StudioSimulationFrameV2 {
  return {
    runtimeSessionId: `runtime/${scenarioId}`,
    scenarioId,
    modelId: "model/main-wire-v3-r1",
    inputEpoch: 0,
    acceptedRevision,
    acceptedTimeSec: acceptedRevision * 0.002,
    outputs: {},
  };
}

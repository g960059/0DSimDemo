import { describe, expect, it, vi } from "vitest";

import {
  WorkbenchParallelScenarioRuntimeV3,
  type WorkbenchParallelScenarioRuntimeClientV3,
} from "@/components/workbench/v3/WorkbenchParallelScenarioRuntimeV3";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  WorkbenchLiveSchedulerV3,
  type WorkbenchLiveSchedulerDependenciesV3,
  type WorkbenchLiveSchedulerTimerV3,
} from "@/components/workbench/v3/WorkbenchLiveSchedulerV3";
import type {
  WorkbenchBackgroundJobHandleV3,
  WorkbenchBackgroundJobPriorityV3,
  WorkbenchBackgroundWorkerPoolPortV3,
} from "@/components/workbench/v3/WorkbenchBackgroundWorkerPoolV3";
import {
  STANDARD_TEST_RELEASE_TICKET_V1,
} from "./helpers/standardReleaseTicketV1";

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
    expect(harness.schedulers.get("scenario/baseline")?.dependencies)
      .toMatchObject({
        maximumBatchSteps: 16,
        preferredBatchSteps: 16,
        presentationIntervalMs: 16,
        maximumPresentationBatchFrames: 8,
      });

    harness.runtime.playAll();
    expect([...harness.schedulers.values()].every(({ running }) => running))
      .toBe(true);
    await harness.runtime.pauseAll();
    expect([...harness.schedulers.values()].every(({ running }) => !running))
      .toBe(true);
  });

  it("keeps latest-value state on complete terminal frames between visual slices", async () => {
    const client = clientV3("scenario/baseline");
    const completeOutputs = {
      selected: scalarOutputV3("selected", 1),
      "latest-only": scalarOutputV3("latest-only", 7),
    };
    client.initialize.mockResolvedValue(frameV3(
      "scenario/baseline",
      0,
      completeOutputs,
    ));
    let scheduler: FakeSchedulerV3 | undefined;
    const runtime = new WorkbenchParallelScenarioRuntimeV3({
      releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      expectedModelId: "model/main-wire-v3-r1",
      createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
      createClient: () => client as unknown as
        WorkbenchParallelScenarioRuntimeClientV3,
      createScheduler: (_scenarioId, dependencies) => {
        scheduler = new FakeSchedulerV3(dependencies);
        return scheduler;
      },
      onFrames: vi.fn(),
      onError: vi.fn(),
    });
    await runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });

    scheduler!.emit([frameV3("scenario/baseline", 1, {
      selected: scalarOutputV3("selected", 2),
    })]);
    expect(runtime.latestFrame("scenario/baseline")).toMatchObject({
      acceptedRevision: 0,
      outputs: { "latest-only": { value: 7 } },
    });

    scheduler!.emit([frameV3("scenario/baseline", 2, {
      selected: scalarOutputV3("selected", 3),
      "latest-only": scalarOutputV3("latest-only", 8),
    })]);
    expect(runtime.latestFrame("scenario/baseline")).toMatchObject({
      acceptedRevision: 2,
      outputs: { "latest-only": { value: 8 } },
    });
  });

  it("reports live lane membership to the shared background QoS budget", async () => {
    const liveScenarioCounts: number[] = [];
    const backgroundWorkerPool = {
      setLiveScenarioCount: (count) => liveScenarioCounts.push(count),
      schedule: () => {
        throw new Error("background operation is not expected");
      },
      run: async () => {
        throw new Error("background operation is not expected");
      },
    } satisfies WorkbenchBackgroundWorkerPoolPortV3;
    const harness = harnessV3(vi.fn(), backgroundWorkerPool);

    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });
    // Initialization reserves both lanes while their Workers are being built,
    // then releases that reservation until playback actually starts.
    expect(liveScenarioCounts).toContain(2);
    expect(liveScenarioCounts.at(-1)).toBe(0);

    harness.runtime.playAll();
    expect(liveScenarioCounts.at(-1)).toBe(2);

    await harness.runtime.addScenario(
      seedV3("scenario/third", "Third", 0),
    );
    expect(liveScenarioCounts.at(-1)).toBe(3);

    await harness.runtime.deleteScenario("scenario/third");
    expect(liveScenarioCounts.at(-1)).toBe(2);
    await harness.runtime.pauseAll();
    expect(liveScenarioCounts.at(-1)).toBe(0);
    harness.runtime.playAll();
    expect(liveScenarioCounts.at(-1)).toBe(2);
    harness.runtime.terminate();
    expect(liveScenarioCounts.at(-1)).toBe(0);
  });

  it("pauses one analysis lane while sibling Scenarios remain live", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [
        seedV3("scenario/baseline", "Baseline", 0),
        seedV3("scenario/comparison", "Comparison", 0),
      ],
      activeScenarioId: "scenario/baseline",
    });
    harness.runtime.playAll();

    await harness.runtime.pauseScenario("scenario/baseline");
    expect(harness.schedulers.get("scenario/baseline")?.running).toBe(false);
    expect(harness.schedulers.get("scenario/comparison")?.running).toBe(true);

    harness.runtime.resumeScenario("scenario/baseline");
    expect(harness.schedulers.get("scenario/baseline")?.running).toBe(true);
    expect(harness.schedulers.get("scenario/comparison")?.running).toBe(true);
  });

  it("runs analysis in an isolated Worker and resumes the live lane after capture", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });
    harness.runtime.playAll();
    const analysisClient = harness.analysisClients.get("scenario/baseline")!;
    let releaseAnalysis!: (value: ReturnType<typeof analysisV3>) => void;
    analysisClient.requestAnalysis.mockImplementation((request) =>
      new Promise((resolve) => {
        releaseAnalysis = resolve;
        const initialized = analysisClient.initialize.mock.calls[0]![0] as {
          runtimeSessionId: string;
        };
        void request;
        queueMicrotask(() => releaseAnalysis(analysisV3(
          initialized.runtimeSessionId,
          "scenario/baseline",
          "analysis/guyton-starling",
        )));
      }));

    const pending = harness.runtime.requestAnalysis({
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    });
    await vi.waitFor(() => {
      expect(analysisClient.requestAnalysis).toHaveBeenCalledOnce();
    });

    expect(harness.clients.get("scenario/baseline")?.requestAnalysis)
      .not.toHaveBeenCalled();
    expect(analysisClient.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpoint: expect.objectContaining({ acceptedRevision: 0 }),
      }),
    );
    expect(harness.schedulers.get("scenario/baseline")?.running).toBe(true);
    await expect(pending).resolves.toMatchObject({
      runtimeSessionId: "runtime/scenario/baseline",
      scenarioId: "scenario/baseline",
      sourceAcceptedRevision: 0,
    });
    expect(analysisClient.terminate).toHaveBeenCalledOnce();
  });

  it("cancels obsolete Scenario analysis before applying a new control input", async () => {
    const cancelled = vi.fn();
    const scheduled = vi.fn();
    const schedule = <T>(
      _priority: WorkbenchBackgroundJobPriorityV3,
      _operation: (
        client: import("@/studio/workers/StudioSimulationWorkerClientV2")
          .StudioSimulationWorkerClientV2,
      ) => Promise<T>,
    ): WorkbenchBackgroundJobHandleV3<T> => {
      scheduled();
      let rejectJob!: (reason: Error) => void;
      let cancellationAccepted = false;
      const promise = new Promise<T>((_resolve, reject) => {
        rejectJob = reject;
      });
      return Object.freeze({
        promise,
        promote: () => undefined,
        cancel: () => {
          if (cancellationAccepted) return false;
          cancellationAccepted = true;
          cancelled();
          rejectJob(new Error("analysis cancelled after input change"));
          return true;
        },
      });
    };
    const backgroundWorkerPool = {
      setLiveScenarioCount: () => undefined,
      schedule,
      run: async <T>(
        priority: WorkbenchBackgroundJobPriorityV3,
        operation: (
          client: import("@/studio/workers/StudioSimulationWorkerClientV2")
            .StudioSimulationWorkerClientV2,
        ) => Promise<T>,
      ) => await schedule(priority, operation).promise,
    } satisfies WorkbenchBackgroundWorkerPoolPortV3;
    const harness = harnessV3(vi.fn(), backgroundWorkerPool);
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });

    const pendingAnalysis = harness.runtime.requestAnalysis({
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    });
    await vi.waitFor(() => expect(scheduled).toHaveBeenCalledOnce());
    const liveClient = harness.clients.get("scenario/baseline")!;
    liveClient.applyControl
      .mockRejectedValueOnce(new Error("control rejected"));
    await expect(harness.runtime.applyControl({
      scenarioId: "scenario/baseline",
      controlId: "control/systemic-resistance",
      value: 1.01,
      expectedInputEpoch: 0,
    })).rejects.toThrow("control rejected");
    expect(cancelled).not.toHaveBeenCalled();

    liveClient.applyControl
      .mockResolvedValueOnce(Object.freeze({
        ...frameV3("scenario/baseline", 1),
        inputEpoch: 1,
      }));

    await expect(harness.runtime.applyControl({
      scenarioId: "scenario/baseline",
      controlId: "control/systemic-resistance",
      value: 1.01,
      expectedInputEpoch: 0,
    })).resolves.toMatchObject({ inputEpoch: 1 });
    expect(cancelled).toHaveBeenCalledOnce();
    await expect(pendingAnalysis).rejects.toThrow(
      "analysis cancelled after input change",
    );
  });

  it("starts hypovolemic and hypervolemic analysis Workers from one exact capture", async () => {
    const liveClient = clientV3("scenario/baseline");
    const analysisClients = new Map<string, ReturnType<typeof clientV3>>();
    const releases = new Map<string, () => void>();
    const started: string[] = [];
    const onProgress = vi.fn<(analysis: StudioSimulationAnalysisV2) => void>();
    const onLiveLaneReleased = vi.fn();
    let scheduler: FakeSchedulerV3 | null = null;
    const runtime = new WorkbenchParallelScenarioRuntimeV3({
    releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      expectedModelId: "model/main-wire-v3-r1",
      createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
      createClient: () => liveClient as unknown as
        WorkbenchParallelScenarioRuntimeClientV3,
      createAnalysisClient: (_scenarioId, analysisPartition) => {
        if (analysisPartition === undefined) {
          throw new Error("partitioned analysis Worker requires a direction");
        }
        const client = clientV3("scenario/baseline");
        client.requestAnalysis.mockImplementation((request) => {
          const workerRequest = request as unknown as Readonly<{
            runtimeSessionId: string;
            scenarioId: string;
            analysisId: string;
            analysisPartition?: string;
            onProgress?: (analysis: StudioSimulationAnalysisV2) => void;
          }>;
          started.push(analysisPartition);
          const result: StudioSimulationAnalysisV2 = Object.freeze({
            ...analysisV3(
              workerRequest.runtimeSessionId,
              workerRequest.scenarioId,
              workerRequest.analysisId,
            ),
            payload: Object.freeze({
              status: "available",
              partition: analysisPartition,
            }),
          });
          workerRequest.onProgress?.(result);
          return new Promise<StudioSimulationAnalysisV2>((resolve) => {
            releases.set(analysisPartition, () => resolve(result));
          });
        });
        analysisClients.set(analysisPartition, client);
        return client as unknown as WorkbenchParallelScenarioRuntimeClientV3;
      },
      createScheduler: (_scenarioId, dependencies) => {
        scheduler = new FakeSchedulerV3(dependencies);
        return scheduler;
      },
      resolveAnalysisExecutionPlan: (analysisId) =>
        analysisId === "analysis/guyton-starling"
          ? Object.freeze({
              partitions: Object.freeze(["hypovolemic", "hypervolemic"]),
              merge: (analyses) => Object.freeze({
                ...analyses[0]!,
                payload: Object.freeze({
                  status: "available",
                  partitions: Object.freeze(analyses.map((analysis) =>
                    (analysis.payload as Readonly<{ partition: string }>)
                      .partition).sort()),
                }),
              }),
            })
          : null,
      onFrames: vi.fn(),
      onError: vi.fn(),
    });
    await runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });
    runtime.playAll();

    const pending = runtime.requestAnalysis({
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
      onProgress,
      onLiveLaneReleased,
    });
    await vi.waitFor(() => expect(started.sort()).toEqual([
      "hypervolemic",
      "hypovolemic",
    ]));

    expect(scheduler?.running).toBe(true);
    expect(onLiveLaneReleased).toHaveBeenCalledOnce();
    const lowClient = analysisClients.get("hypovolemic")!;
    const highClient = analysisClients.get("hypervolemic")!;
    expect(lowClient.initialize).toHaveBeenCalledOnce();
    expect(highClient.initialize).toHaveBeenCalledOnce();
    expect(lowClient.initialize.mock.calls[0]![0].checkpoint)
      .toBe(highClient.initialize.mock.calls[0]![0].checkpoint);
    expect(lowClient.requestAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ analysisPartition: "hypovolemic" }),
    );
    expect(highClient.requestAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ analysisPartition: "hypervolemic" }),
    );
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress.mock.calls.at(-1)?.[0].payload).toEqual({
      status: "available",
      partitions: ["hypervolemic", "hypovolemic"],
    });

    releases.get("hypovolemic")!();
    releases.get("hypervolemic")!();
    await expect(pending).resolves.toMatchObject({
      runtimeSessionId: "runtime/scenario/baseline",
      payload: {
        status: "available",
        partitions: ["hypervolemic", "hypovolemic"],
      },
    });
    expect(lowClient.terminate).toHaveBeenCalledOnce();
    expect(highClient.terminate).toHaveBeenCalledOnce();
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

  it("publishes one Scenario directly without an unnecessary merge deadline", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 0)],
      activeScenarioId: "scenario/baseline",
    });
    harness.schedulers.get("scenario/baseline")!.emit([
      frameV3("scenario/baseline", 1),
      frameV3("scenario/baseline", 2),
    ]);

    expect(harness.flushCallbacks).toEqual([]);
    expect(harness.onFrames).toHaveBeenCalledOnce();
    expect(harness.onFrames.mock.calls[0]![0].map(({ acceptedRevision }) =>
      acceptedRevision)).toEqual([1, 2]);
  });

  it("duplicates from the source lane's exact capture and keeps labels in the pool", async () => {
    const harness = harnessV3();
    await harness.runtime.initialize({
      scenarios: [seedV3("scenario/baseline", "Baseline", 3)],
      activeScenarioId: "scenario/baseline",
    });
    const sourceCapture = scenarioV3(
      "scenario/baseline",
      "stale worker label",
      9,
    );
    harness.clients.get("scenario/baseline")!.readScenarios.mockResolvedValue({
      activeScenarioId: "scenario/baseline",
      scenarios: [sourceCapture],
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
    const duplicateSeed = harness.clients.get("scenario/copy")?.initialize
      .mock.calls[0]![0] as Readonly<{
        fixture: unknown;
        checkpoint: unknown;
      }>;
    expect(duplicateSeed.fixture).not.toBe(sourceCapture.capture.fixture);
    expect(duplicateSeed.checkpoint).not.toBe(sourceCapture.capture.checkpoint);

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
    releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      expectedModelId: "model/main-wire-v3-r1",
      createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
      createClient: (scenarioId) => {
        const client = clientV3(scenarioId);
        let acceptedRevision = 0;
        client.advancePresentation.mockImplementation(async (input) => {
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
    releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
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

function harnessV3(
  onError = vi.fn<(error: Error) => void>(),
  backgroundWorkerPool?: WorkbenchBackgroundWorkerPoolPortV3,
) {
  const clients = new Map<string, ReturnType<typeof clientV3>>();
  const analysisClients = new Map<string, ReturnType<typeof clientV3>>();
  const schedulers = new Map<string, FakeSchedulerV3>();
  const flushCallbacks: Array<() => void> = [];
  const onFrames = vi.fn<(frames: readonly StudioSimulationFrameV2[]) => void>();
  const runtime = new WorkbenchParallelScenarioRuntimeV3({
    releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
    expectedModelId: "model/main-wire-v3-r1",
    createRuntimeSessionId: (scenarioId) => `runtime/${scenarioId}`,
    createClient: (scenarioId) => {
      const client = clientV3(scenarioId);
      clients.set(scenarioId, client);
      return client as unknown as WorkbenchParallelScenarioRuntimeClientV3;
    },
    createAnalysisClient: (scenarioId) => {
      const client = analysisClients.get(scenarioId) ?? clientV3(scenarioId);
      if (!analysisClients.has(scenarioId)) {
        analysisClients.set(scenarioId, client);
      }
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
    ...(backgroundWorkerPool === undefined ? {} : { backgroundWorkerPool }),
  });
  // Factories are lazy: provision deterministic analysis doubles for the
  // assertions before the request allocates one.
  for (const scenarioId of ["scenario/baseline", "scenario/comparison"]) {
    if (!analysisClients.has(scenarioId)) {
      const client = clientV3(scenarioId);
      analysisClients.set(scenarioId, client);
    }
  }
  return {
    analysisClients,
    clients,
    flushCallbacks,
    onFrames,
    runtime,
    schedulers,
  };
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
  const advance = async (input: number | { stepCount: number }) => {
    const stepCount = typeof input === "number" ? input : input.stepCount;
    return Array.from(
      { length: stepCount },
      () => frameV3(scenarioId, clock += 1),
    );
  };
  return {
    advance: vi.fn(advance),
    advancePresentation: vi.fn(advance),
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
  outputs: StudioSimulationFrameV2["outputs"] = {},
): StudioSimulationFrameV2 {
  return {
    runtimeSessionId: `runtime/${scenarioId}`,
    scenarioId,
    modelId: "model/main-wire-v3-r1",
    inputEpoch: 0,
    acceptedRevision,
    acceptedTimeSec: acceptedRevision * 0.002,
    outputs,
  };
}

function scalarOutputV3(outputId: string, value: number) {
  return {
    outputId,
    value,
    availability: "available" as const,
    quality: "authoritative-state" as const,
  };
}

function analysisV3(
  runtimeSessionId: string,
  scenarioId: string,
  analysisId: string,
) {
  return {
    runtimeSessionId,
    scenarioId,
    modelId: "model/main-wire-v3-r1",
    inputEpoch: 0,
    sourceAcceptedRevision: 0,
    sourceAcceptedTimeSec: 0,
    analysisId,
    payload: { status: "available" },
  } as const;
}

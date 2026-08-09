import { describe, expect, it, vi } from "vitest";

import {
  ArticleReaderLiveRuntimeV3,
  articleReaderAnalysisKeyV3,
  appendArticleReaderFramesV3,
  type ArticleReaderParallelRuntimeFactoryInputV3,
  type ArticleReaderParallelRuntimeV3,
} from "@/components/article/reader/ArticleReaderLiveRuntimeV3";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type {
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import type {
  StudioSimulationWorkerScenarioStateV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import {
  WorkbenchScenarioPresentationSampleStoreV3,
} from "@/components/workbench/v3/WorkbenchPresentationSampleStoreV3";
import type {
  WorkbenchParallelScenarioSeedV3,
} from "@/components/workbench/v3/WorkbenchParallelScenarioRuntimeV3";
import {
  STANDARD_TEST_RELEASE_TICKET_V1,
  STANDARD_TEST_SURFACE_RELEASE_ID_V1,
  STANDARD_TEST_SURFACE_SERIES_ID_V1,
} from "./helpers/standardReleaseTicketV1";

describe("ArticleReaderLiveRuntimeV3", () => {
  it("restores only the visible Scenario authority and starts those lanes", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      initialActiveScenarioId: "scenario/two",
      visibleScenarioIds: ["scenario/two"],
      createRuntime: harness.createRuntime,
    });
    const notifications = vi.fn();
    controller.subscribe(notifications);

    await controller.start();

    expect(harness.dependencies?.expectedModelId).toBe("model/exact-reader-v3");
    expect(harness.initializeInput?.activeScenarioId).toBe("scenario/two");
    expect(harness.initializeInput?.scenarios).toEqual(snapshot.content.scenarios
      .filter(({ scenarioId }) => scenarioId === "scenario/two").map(
      ({ scenarioId, label, capture }) => ({
        scenarioId,
        label,
        fixture: capture.fixture,
        checkpoint: capture.checkpoint,
      }),
    ));
    expect(harness.playAll).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      activeScenarioId: "scenario/two",
      scenarioIds: ["scenario/two"],
      committedControlValues: {},
    });
    expect(controller.sampleStore.getScenarioSnapshot("scenario/one"))
      .toEqual([]);
    expect(controller.sampleStore.getScenarioSnapshot("scenario/two").at(-1))
      .toMatchObject({ acceptedTimeSec: 1, values: { pressure: 20 } });
    await expect(controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one"],
      value: 44,
    })).rejects.toThrow(/targets an unknown Scenario/);
    expect(harness.pauseAll).not.toHaveBeenCalled();
    expect(notifications).toHaveBeenCalled();
  });

  it("rejects empty, duplicate, unknown, and hidden initial Scenario authority", () => {
    const snapshot = snapshotV3();
    expect(() => new ArticleReaderLiveRuntimeV3(snapshot, {
      releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      visibleScenarioIds: [],
    })).toThrow(/at least one visible Scenario/);
    expect(() => new ArticleReaderLiveRuntimeV3(snapshot, {
      releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      visibleScenarioIds: ["scenario/one", "scenario/one"],
    })).toThrow(/duplicate/);
    expect(() => new ArticleReaderLiveRuntimeV3(snapshot, {
      releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      visibleScenarioIds: ["scenario/missing"],
    })).toThrow(/not in the pinned Snapshot/);
    expect(() => new ArticleReaderLiveRuntimeV3(snapshot, {
      releaseTicket: STANDARD_TEST_RELEASE_TICKET_V1,
      visibleScenarioIds: ["scenario/one"],
      initialActiveScenarioId: "scenario/two",
    })).toThrow(/active Scenario is not in the visible Scenario scope/);
  });

  it("keeps active Scenario selection independent from all-Scenario playback", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    controller.selectScenario("scenario/two");
    await controller.pause();
    controller.play();

    expect(harness.selectScenario).toHaveBeenCalledWith("scenario/two");
    expect(harness.pauseAll).toHaveBeenCalledTimes(1);
    expect(harness.playAll).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      activeScenarioId: "scenario/two",
    });
    expect(() => controller.selectScenario("scenario/missing"))
      .toThrow(/unknown Scenario/);
  });

  it("queues Scenario focus during initialization without failing the pool", async () => {
    const snapshot = snapshotV3();
    const initializeGate = deferredV3<StudioSimulationWorkerScenarioStateV2>();
    const harness = runtimeHarnessV3(snapshot, { initializeGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    const starting = controller.start();
    await Promise.resolve();

    controller.selectScenario("scenario/two");

    expect(controller.getSnapshot()).toMatchObject({
      status: "starting",
      activeScenarioId: "scenario/two",
    });
    expect(harness.selectScenario).not.toHaveBeenCalled();
    initializeGate.resolve(workerStateV3(snapshot, "scenario/one"));
    await starting;

    expect(harness.selectScenario).toHaveBeenCalledTimes(1);
    expect(harness.selectScenario).toHaveBeenCalledWith("scenario/two");
    expect(harness.terminate).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      activeScenarioId: "scenario/two",
    });
  });

  it("honors a play intent that arrives while pause is awaiting its boundary", async () => {
    const snapshot = snapshotV3();
    const pauseGate = deferredV3<void>();
    const harness = runtimeHarnessV3(snapshot, { pauseGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    const pausing = controller.pause();
    controller.play();
    pauseGate.resolve();
    await pausing;

    expect(harness.playAll).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().status).toBe("playing");
  });

  it("applies one fixed control value to every bound Scenario at a paused boundary", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    await controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one", "scenario/two"],
      value: 44,
    });

    expect(harness.pauseAll).toHaveBeenCalledTimes(1);
    expect(harness.applyControl).toHaveBeenCalledTimes(2);
    expect(harness.applyControl.mock.calls.map(([input]) => input.scenarioId))
      .toEqual(["scenario/one", "scenario/two"]);
    expect(harness.playAll).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      pendingControlInstanceId: null,
      committedControlValues: {
        "scenario/one": { "control/svr": 44 },
        "scenario/two": { "control/svr": 44 },
      },
    });
    expect(controller.sampleStore.getScenarioSnapshot("scenario/two").at(-1))
      .toMatchObject({ values: { pressure: 44 } });
  });

  it("drains only each analysis source lane without pausing all Scenarios", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot, { advanceOnPause: true });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
      structuralAnalyses: [{
        analysisId: "analysis/return",
        historyDepth: 1,
      }],
    });
    await controller.start();

    await controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one", "scenario/two"],
    });

    expect(harness.pauseAll).not.toHaveBeenCalled();
    expect(harness.pauseScenario).toHaveBeenCalledTimes(2);
    expect(harness.pauseScenario.mock.calls.map(([scenarioId]) => scenarioId))
      .toEqual(["scenario/one", "scenario/two"]);
    expect(harness.requestAnalysis).toHaveBeenCalledTimes(2);
    expect(harness.requestAnalysis.mock.calls.map(([input]) => input))
      .toEqual([
        expect.objectContaining({
          scenarioId: "scenario/one",
          analysisId: "analysis/return",
          expectedInputEpoch: 0,
          expectedAcceptedRevision: 501,
          expectedAcceptedTimeSec: 1.002,
        }),
        expect.objectContaining({
          scenarioId: "scenario/two",
          analysisId: "analysis/return",
          expectedInputEpoch: 0,
          expectedAcceptedRevision: 501,
          expectedAcceptedTimeSec: 1.002,
        }),
      ]);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      pendingAnalysisKeys: [],
    });
    expect(Object.keys(controller.getSnapshot().analysisByKey)).toEqual([
      articleReaderAnalysisKeyV3("scenario/one", "analysis/return"),
      articleReaderAnalysisKeyV3("scenario/two", "analysis/return"),
    ]);
    expect(harness.playAll).toHaveBeenCalledTimes(2);
  });

  it("serializes analysis against controls and publishes recoverable analysis errors", async () => {
    const snapshot = snapshotV3();
    const analysisGate = deferredV3<void>();
    const harness = runtimeHarnessV3(snapshot, { analysisGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    const analysis = controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    });
    await Promise.resolve();
    expect(controller.getSnapshot().status).toBe("requesting-analysis");
    await expect(controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one"],
      value: 44,
    })).rejects.toThrow(/active live runtime/);
    analysisGate.resolve(undefined);
    await analysis;

    const failingHarness = runtimeHarnessV3(snapshot, {
      analysisError: new Error("analysis unavailable"),
    });
    const failing = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: failingHarness.createRuntime,
    });
    await failing.start();
    await expect(failing.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    })).resolves.toBeUndefined();
    expect(failing.getSnapshot()).toMatchObject({ status: "playing" });
    expect(failing.getSnapshot().analysisErrorByKey[
      articleReaderAnalysisKeyV3("scenario/one", "analysis/return")
    ]).toBe("analysis unavailable");
    expect(failingHarness.terminate).not.toHaveBeenCalled();
  });

  it("honors a pause intent that arrives while exact analysis is in flight", async () => {
    const snapshot = snapshotV3();
    const analysisGate = deferredV3<void>();
    const harness = runtimeHarnessV3(snapshot, { analysisGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    const analysis = controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    });
    await Promise.resolve();
    await controller.pause();
    analysisGate.resolve(undefined);
    await analysis;

    expect(controller.getSnapshot().status).toBe("paused");
    expect(harness.playAll).toHaveBeenCalledTimes(1);
    controller.play();
    expect(controller.getSnapshot().status).toBe("playing");
    expect(harness.playAll).toHaveBeenCalledTimes(2);
  });

  it("archives exact pre-control structural states, clears current, and refreshes the new epoch", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
      structuralAnalyses: [{
        analysisId: "analysis/return",
        historyDepth: 2,
      }],
    });
    await controller.start();
    await controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    });
    const key = articleReaderAnalysisKeyV3(
      "scenario/one",
      "analysis/return",
    );

    await controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one"],
      value: 44,
    });

    expect(controller.getSnapshot().analysisByKey[key]).toBeUndefined();
    expect(controller.getSnapshot().analysisHistoryByKey[key])
      .toHaveLength(1);
    expect(controller.getSnapshot().analysisHistoryByKey[key]?.[0])
      .toMatchObject({ inputEpoch: 0, analysisId: "analysis/return" });
    await controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    });
    expect(controller.getSnapshot().analysisByKey[key])
      .toMatchObject({ inputEpoch: 1 });
  });

  it("does not archive structural history when its authored depth is zero", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
      structuralAnalyses: [{
        analysisId: "analysis/return",
        historyDepth: 0,
      }],
    });
    await controller.start();
    await controller.requestAnalysis({
      analysisId: "analysis/return",
      scenarioIds: ["scenario/one"],
    });

    await controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one"],
      value: 44,
    });

    expect(controller.getSnapshot().analysisHistoryByKey).toEqual({});
    expect(harness.requestAnalysis).toHaveBeenCalledTimes(1);
  });

  it("keeps a rejected control recoverable and restores the prior play intent", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot, {
      applyControlError: new Error("control failed"),
    });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    await expect(controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one"],
      value: 44,
    })).rejects.toThrow("control failed");

    expect(Object.keys(controller.getSnapshot().committedControlValues))
      .toEqual([]);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      pendingControlInstanceId: null,
      controlErrorByInstanceId: {
        "pane/control\u001fcontrol/svr": "control failed",
      },
    });
    expect(harness.playAll).toHaveBeenCalledTimes(2);
    expect(harness.terminate).not.toHaveBeenCalled();
  });

  it("fails closed when a multi-Scenario control can partially commit", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot, {
      applyControlErrorByScenarioId: {
        "scenario/two": new Error("second lane rejected"),
      },
    });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    await expect(controller.applyControl({
      controlInstanceId: "pane/control\u001fcontrol/svr",
      controlId: "control/svr",
      scenarioIds: ["scenario/one", "scenario/two"],
      value: 44,
    })).rejects.toThrow("second lane rejected");

    expect(harness.applyControl).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toMatchObject({
      status: "failed",
      pendingControlInstanceId: null,
    });
    expect(controller.getSnapshot().committedControlValues).toEqual({});
    expect(harness.terminate).toHaveBeenCalledTimes(1);
    expect(harness.playAll).toHaveBeenCalledTimes(1);
  });

  it("pauses while the document is hidden and resumes only its preserved play intent", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();

    await controller.setDocumentVisible(false);
    expect(controller.getSnapshot().status).toBe("paused");
    expect(harness.pauseAll).toHaveBeenCalledTimes(1);
    await controller.setDocumentVisible(true);
    expect(controller.getSnapshot().status).toBe("playing");
    expect(harness.playAll).toHaveBeenCalledTimes(2);

    await controller.pause();
    await controller.setDocumentVisible(false);
    await controller.setDocumentVisible(true);
    expect(controller.getSnapshot().status).toBe("paused");
    expect(harness.playAll).toHaveBeenCalledTimes(2);
  });

  it("fails closed on a lane error and ignores every later callback", async () => {
    const snapshot = snapshotV3();
    const harness = runtimeHarnessV3(snapshot);
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    await controller.start();
    harness.dependencies?.onFrames([frameV3("scenario/one", 2, 11)]);
    const beforeFailure = controller.sampleStore
      .getScenarioSnapshot("scenario/one").length;

    harness.dependencies?.onError(new Error("reader lane failed"));
    harness.dependencies?.onFrames([frameV3("scenario/one", 3, 12)]);
    controller.play();
    await controller.pause();

    expect(harness.terminate).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({ status: "failed" });
    expect(controller.getSnapshot().error?.message).toBe("reader lane failed");
    expect(controller.sampleStore.getScenarioSnapshot("scenario/one"))
      .toHaveLength(beforeFailure);
    expect(harness.playAll).toHaveBeenCalledTimes(1);
  });

  it("disposes an initializing authority without publishing late completion", async () => {
    const snapshot = snapshotV3();
    const initializeGate = deferredV3<StudioSimulationWorkerScenarioStateV2>();
    const harness = runtimeHarnessV3(snapshot, { initializeGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    const starting = controller.start();

    await controller.dispose();
    initializeGate.resolve(workerStateV3(snapshot, "scenario/one"));
    await starting;
    harness.dependencies?.onFrames([frameV3("scenario/one", 2, 99)]);

    expect(controller.getSnapshot().status).toBe("disposed");
    expect(harness.dispose).toHaveBeenCalledTimes(1);
    expect(harness.playAll).not.toHaveBeenCalled();
    expect(controller.sampleStore.getScenarioSnapshot("scenario/one")).toEqual([]);
  });

  it("records synchronous construction failure without leaking it from start", async () => {
    const controller = new ArticleReaderLiveRuntimeV3(snapshotV3(), {
      createRuntime: () => {
        throw new Error("worker construction failed");
      },
    });

    await expect(controller.start()).resolves.toBeUndefined();
    expect(controller.getSnapshot()).toMatchObject({ status: "failed" });
    expect(controller.getSnapshot().error?.message)
      .toBe("worker construction failed");
  });

  it("treats pause during initialization as intent and never calls an inactive pool", async () => {
    const snapshot = snapshotV3();
    const initializeGate = deferredV3<StudioSimulationWorkerScenarioStateV2>();
    const harness = runtimeHarnessV3(snapshot, { initializeGate });
    const controller = new ArticleReaderLiveRuntimeV3(snapshot, {
      createRuntime: harness.createRuntime,
    });
    const starting = controller.start();

    await controller.pause();
    initializeGate.resolve(workerStateV3(snapshot, "scenario/one"));
    await starting;

    expect(harness.pauseAll).not.toHaveBeenCalled();
    expect(harness.playAll).not.toHaveBeenCalled();
    expect(controller.getSnapshot().status).toBe("paused");
  });

  it("projects only finite assessed scalar outputs into the shared sample store", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3();
    const base = frameV3("scenario/one", 1, 8);
    appendArticleReaderFramesV3([{
      ...base,
      outputs: {
        pressure: base.outputs.pressure!,
        vector: {
          outputId: "vector",
          value: [1, 2],
          availability: "available",
          quality: "accepted-derived",
        },
        unassessed: {
          outputId: "unassessed",
          value: 7,
          availability: "available",
          quality: "not-assessed",
        },
      },
    }], store);

    expect(store.getScenarioSnapshot("scenario/one").at(-1)?.values).toEqual({
      pressure: 8,
      vector: null,
      unassessed: null,
    });
  });
});

function snapshotV3(): ExperimentSnapshotV2 {
  return Object.freeze({
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId: "snapshot/reader-live-v3",
    surfaceReleaseId: STANDARD_TEST_SURFACE_RELEASE_ID_V1,
    createdAt: "2026-08-02T00:00:00.000Z",
    content: Object.freeze({
      modelId: "model/exact-reader-v3",
      surfaceSeriesId: STANDARD_TEST_SURFACE_SERIES_ID_V1,
      scenarios: Object.freeze([
        scenarioV3("scenario/one", "One", 0),
        scenarioV3("scenario/two", "Two", 1),
      ]),
      surface: Object.freeze({
        graphPanes: Object.freeze([]),
        outputPanes: Object.freeze([]),
        controlPanes: Object.freeze([]),
        note: Object.freeze({ text: "" }),
      }),
    }),
  });
}

function scenarioV3(scenarioId: string, label: string, offset: number) {
  return Object.freeze({
    scenarioId,
    label,
    capture: Object.freeze({
      fixture: Object.freeze({ offset }),
      checkpoint: Object.freeze({
        acceptedRevision: 5,
        acceptedTimeSec: 1,
        payload: Object.freeze({ state: offset }),
      }),
    }),
  });
}

function frameV3(
  scenarioId: string,
  acceptedTimeSec: number,
  pressure: number,
  inputEpoch = 0,
): StudioSimulationFrameV2 {
  return Object.freeze({
    modelId: "model/exact-reader-v3",
    runtimeSessionId: `runtime/${scenarioId}`,
    scenarioId,
    inputEpoch,
    acceptedRevision: Math.round(acceptedTimeSec * 500),
    acceptedTimeSec,
    outputs: Object.freeze({
      pressure: Object.freeze({
        outputId: "pressure",
        value: pressure,
        availability: "available",
        quality: "accepted-derived",
      }),
    }),
  });
}

function workerStateV3(
  snapshot: ExperimentSnapshotV2,
  activeScenarioId: string,
): StudioSimulationWorkerScenarioStateV2 {
  return Object.freeze({
    activeScenarioId,
    scenarios: Object.freeze(snapshot.content.scenarios.map(
      ({ scenarioId, label }) => Object.freeze({ scenarioId, label }),
    )),
    frame: frameV3(activeScenarioId, 1, activeScenarioId.endsWith("two") ? 20 : 10),
  });
}

function runtimeHarnessV3(
  snapshot: ExperimentSnapshotV2,
  gates: Readonly<{
    initializeGate?: DeferredV3<StudioSimulationWorkerScenarioStateV2>;
    pauseGate?: DeferredV3<void>;
    analysisGate?: DeferredV3<void>;
    analysisError?: Error;
    advanceOnPause?: boolean;
    applyControlError?: Error;
    applyControlErrorByScenarioId?: Readonly<Record<string, Error>>;
  }> = {},
) {
  let dependencies: ArticleReaderParallelRuntimeFactoryInputV3 | undefined;
  let initializeInput: Readonly<{
    scenarios: readonly WorkbenchParallelScenarioSeedV3[];
    activeScenarioId: string;
  }> | undefined;
  let activeScenarioId = snapshot.content.scenarios[0]!.scenarioId;
  const frames = new Map(snapshot.content.scenarios.map((scenario, index) => [
    scenario.scenarioId,
    frameV3(scenario.scenarioId, 1, (index + 1) * 10),
  ]));
  const playAll = vi.fn();
  const applyControl = vi.fn(async (input: Readonly<{
    scenarioId: string;
    controlId: string;
    value: number;
    expectedInputEpoch: number;
  }>) => {
    if (gates.applyControlError !== undefined) {
      throw gates.applyControlError;
    }
    const scenarioError = gates.applyControlErrorByScenarioId?.[
      input.scenarioId
    ];
    if (scenarioError !== undefined) throw scenarioError;
    const current = frames.get(input.scenarioId)!;
    const next = frameV3(
      input.scenarioId,
      current.acceptedTimeSec,
      input.value,
      current.inputEpoch + 1,
    );
    frames.set(input.scenarioId, next);
    return next;
  });
  const requestAnalysis = vi.fn(async (input: Readonly<{
    scenarioId: string;
    analysisId: string;
    expectedInputEpoch: number;
    expectedAcceptedRevision: number;
    expectedAcceptedTimeSec: number;
  }>): Promise<StudioSimulationAnalysisV2> => {
    await gates.analysisGate?.promise;
    if (gates.analysisError !== undefined) throw gates.analysisError;
    const frame = frames.get(input.scenarioId)!;
    return Object.freeze({
      modelId: frame.modelId,
      runtimeSessionId: frame.runtimeSessionId,
      scenarioId: frame.scenarioId,
      inputEpoch: frame.inputEpoch,
      sourceAcceptedRevision: frame.acceptedRevision,
      sourceAcceptedTimeSec: frame.acceptedTimeSec,
      analysisId: input.analysisId,
      payload: Object.freeze({ status: "available" }),
    });
  });
  const pauseAll = vi.fn(async () => {
    await gates.pauseGate?.promise;
  });
  const pauseScenario = vi.fn(async (scenarioId: string) => {
    const current = frames.get(scenarioId);
    if (current === undefined) throw new Error("missing test frame");
    if (!gates.advanceOnPause) return current;
    const pressure = current.outputs.pressure?.availability === "available"
      && typeof current.outputs.pressure.value === "number"
      ? current.outputs.pressure.value
      : 0;
    const drained = frameV3(
      scenarioId,
      current.acceptedTimeSec + 0.002,
      pressure,
      current.inputEpoch,
    );
    frames.set(scenarioId, drained);
    return drained;
  });
  const resumeScenario = vi.fn();
  const selectScenario = vi.fn((scenarioId: string) => {
    activeScenarioId = scenarioId;
    return workerStateV3(snapshot, scenarioId);
  });
  const terminate = vi.fn();
  const dispose = vi.fn(async () => undefined);
  const createRuntime = (
    input: ArticleReaderParallelRuntimeFactoryInputV3,
  ): ArticleReaderParallelRuntimeV3 => {
    dependencies = input;
    return {
      async initialize(next) {
        initializeInput = next;
        activeScenarioId = next.activeScenarioId;
        return gates.initializeGate?.promise
          ?? workerStateV3(snapshot, activeScenarioId);
      },
      applyControl,
      requestAnalysis,
      latestFrame(scenarioId) {
        const frame = frames.get(scenarioId);
        if (frame === undefined) throw new Error("missing test frame");
        return frame;
      },
      playAll,
      pauseAll,
      pauseScenario,
      selectScenario,
      resumeScenario,
      terminate,
      dispose,
    };
  };
  return {
    createRuntime,
    get dependencies() {
      return dependencies;
    },
    get initializeInput() {
      return initializeInput;
    },
    playAll,
    applyControl,
    requestAnalysis,
    pauseAll,
    pauseScenario,
    resumeScenario,
    selectScenario,
    terminate,
    dispose,
  };
}

type DeferredV3<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T): void;
}>;

function deferredV3<T>(): DeferredV3<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

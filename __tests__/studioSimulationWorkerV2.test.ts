import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  RegisteredModelSimulationAdapterV2,
  StudioSimulationAnalysisV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  StudioSimulationWorkerClientV2,
  type StudioSimulationWorkerTransportV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
  createStudioSimulationApplyControlRequestV2,
  createStudioSimulationAdvanceRequestV2,
  createStudioSimulationDisposeRequestV2,
  createStudioSimulationInitializeRequestV2,
  createStudioSimulationRequestAnalysisRequestV2,
  validateStudioSimulationWorkerRequestV2,
  validateStudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import {
  StudioSimulationWorkerRuntimeV2,
} from "@/studio/workers/StudioSimulationWorkerRuntimeV2";

afterEach(() => {
  vi.useRealTimers();
});

describe("Studio simulation worker V2 protocol", () => {
  it("detaches and freezes exact portable initialize requests", () => {
    const fixture = {
      controls: { heartRateBpm: 60 },
      values: [1, 2],
    };
    const request = validateStudioSimulationWorkerRequestV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      kind: "initialize",
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture,
      checkpoint: {
        acceptedRevision: 4,
        acceptedTimeSec: 0.4,
        payload: { state: [3, 4] },
      },
    });
    fixture.controls.heartRateBpm = 90;
    fixture.values.push(3);

    expect(request).toMatchObject({
      requestId: 1,
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: {
        controls: { heartRateBpm: 60 },
        values: [1, 2],
      },
    });
    if (request.kind !== "initialize") {
      throw new Error("expected an initialize request");
    }
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.fixture)).toBe(true);
    expect(Object.isFrozen(request.checkpoint?.payload)).toBe(true);
  });

  it("rejects unknown, explicitly undefined, accessor, and poisoned request data", () => {
    const base = initializeRequestV2(1);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      targetGeneration: 4,
    })).toThrow(/fields must match exactly/);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      checkpoint: undefined,
    })).toThrow(/checkpoint.*plain data object/);

    const getter = vi.fn(() => ({ value: 1 }));
    const accessor = { ...base } as Record<string, unknown>;
    Object.defineProperty(accessor, "fixture", {
      enumerable: true,
      get: getter,
    });
    expect(() => validateStudioSimulationWorkerRequestV2(accessor))
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();

    const customPrototype = Object.create({ poisoned: true });
    Object.defineProperties(
      customPrototype,
      Object.getOwnPropertyDescriptors(base),
    );
    expect(() => validateStudioSimulationWorkerRequestV2(customPrototype))
      .toThrow(/custom prototype/);

    const values = [1];
    const map = vi.fn(() => [Number.NaN]);
    const poisonedPrototype = Object.create(Array.prototype);
    Object.defineProperty(poisonedPrototype, "map", { value: map });
    Object.setPrototypeOf(values, poisonedPrototype);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      fixture: { values },
    })).toThrow(/array must not use a custom prototype/);
    expect(map).not.toHaveBeenCalled();
  });

  it("enforces request IDs, exact variants, and bounded step counts", () => {
    expect(() => createStudioSimulationAdvanceRequestV2(0, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).toThrow(/positive safe integer/);
    for (const stepCount of [0, 9, 1.5, Number.NaN]) {
      expect(() => createStudioSimulationAdvanceRequestV2(1, {
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        stepCount,
      })).toThrow(/within \[1, 8\]/);
    }
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...createStudioSimulationDisposeRequestV2(1, "runtime/session-1"),
      scenarioId: undefined,
    })).toThrow(/fields must match exactly/);
  });

  it("validates exact semantic control requests and finite scalar values", () => {
    const request = createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 3,
    });
    expect(request).toEqual({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 2,
      kind: "apply-control",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 3,
    });
    expect(Object.isFrozen(request)).toBe(true);

    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, "72"]) {
      expect(() => createStudioSimulationApplyControlRequestV2(2, {
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        controlId: "control/heart-rate",
        value,
        expectedInputEpoch: 3,
      })).toThrow(/finite scalar/);
    }
    expect(() => createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "not portable",
      value: 72,
      expectedInputEpoch: 3,
    })).toThrow(/portable opaque ID/);
    expect(() => createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: -1,
    })).toThrow(/nonnegative safe integer/);
    expect(() => createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 3,
      rawParameterId: "heartRateBpm",
    })).toThrow(/fields must match exactly/);
  });

  it("validates exact analysis requests and deeply owns portable results", () => {
    const request = createStudioSimulationRequestAnalysisRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 2,
      expectedAcceptedRevision: 45,
      expectedAcceptedTimeSec: 0.09,
    });
    expect(request).toEqual({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 3,
      kind: "request-analysis",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 2,
      expectedAcceptedRevision: 45,
      expectedAcceptedTimeSec: 0.09,
    });
    expect(Object.isFrozen(request)).toBe(true);

    const payload = { curve: [{ pressure: 1, flow: 2 }] };
    const response = validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 3,
      status: "ok",
      kind: "analysis-result",
      analysis: analysisV2({
        inputEpoch: 2,
        sourceAcceptedRevision: 45,
        sourceAcceptedTimeSec: 0.09,
        payload,
      }),
    });
    payload.curve[0]!.flow = 99;
    expect(response).toMatchObject({
      kind: "analysis-result",
      analysis: { payload: { curve: [{ pressure: 1, flow: 2 }] } },
    });
    if (response.status === "ok" && response.kind === "analysis-result") {
      expect(Object.isFrozen(response.analysis)).toBe(true);
      expect(Object.isFrozen(response.analysis.payload)).toBe(true);
      const owned = response.analysis.payload as {
        curve: readonly Readonly<{ pressure: number; flow: number }>[];
      };
      expect(Object.isFrozen(owned.curve)).toBe(true);
      expect(Object.isFrozen(owned.curve[0])).toBe(true);
    }

    for (const badClock of [-1, Number.NaN, -0]) {
      expect(() => createStudioSimulationRequestAnalysisRequestV2(3, {
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        analysisId: "analysis/guyton-starling-v1",
        expectedInputEpoch: 2,
        expectedAcceptedRevision: 45,
        expectedAcceptedTimeSec: badClock,
      })).toThrow(/finite/);
    }
    expect(() => createStudioSimulationRequestAnalysisRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "not portable",
      expectedInputEpoch: 2,
      expectedAcceptedRevision: 45,
      expectedAcceptedTimeSec: 0.09,
    })).toThrow(/portable opaque ID/);
  });

  it("validates and detaches exact response frames and output values", () => {
    const source = frameV2({
      outputs: {
        "pressure.lv": outputV2("pressure.lv", [80, 120]),
      },
    });
    const response = validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: source,
    });
    (source.outputs["pressure.lv"].value as number[]).push(70);

    expect(response).toMatchObject({
      kind: "initialized",
      frame: {
        runtimeSessionId: "runtime/session-1",
        outputs: {
          "pressure.lv": { value: [80, 120] },
        },
      },
    });
    expect(Object.isFrozen(response)).toBe(true);
    if (response.status === "ok" && response.kind === "initialized") {
      expect(Object.isFrozen(response.frame.outputs)).toBe(true);
      expect(Object.isFrozen(
        response.frame.outputs["pressure.lv"].value,
      )).toBe(true);
    }
  });

  it("validates the exact control-applied response variant", () => {
    const response = validateStudioSimulationWorkerResponseV2(
      controlAppliedResponseV2(4, frameV2({ inputEpoch: 1 })),
    );
    expect(response).toMatchObject({
      requestId: 4,
      status: "ok",
      kind: "control-applied",
      frame: { inputEpoch: 1 },
    });
    expect(() => validateStudioSimulationWorkerResponseV2({
      ...controlAppliedResponseV2(4, frameV2({ inputEpoch: 1 })),
      fixture: {},
    })).toThrow(/fields must match exactly/);
  });

  it("rejects malformed response fields without invoking accessors", () => {
    const getter = vi.fn(() => frameV2());
    const accessor: Record<string, unknown> = {
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
    };
    Object.defineProperty(accessor, "frame", {
      enumerable: true,
      get: getter,
    });
    expect(() => validateStudioSimulationWorkerResponseV2(accessor))
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();

    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: frameV2({ acceptedTimeSec: Number.NaN }),
    })).toThrow(/finite/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: frameV2({
        outputs: { wrong: outputV2("another", 1) },
      }),
    })).toThrow(/must match output map key/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: -0,
      status: "error",
      fatal: false,
      message: "failure",
    })).toThrow(/nonnegative safe integer/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "error",
      fatal: false,
      message: "failure",
      kind: undefined,
    })).toThrow(/fields must match exactly/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "error",
      message: "failure",
    })).toThrow(/fields must match exactly.*fatal/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "error",
      fatal: "yes",
      message: "failure",
    })).toThrow(/fatal.*boolean/);
  });
});

describe("Studio simulation worker V2 runtime", () => {
  it("serializes one exact session and rejects wrong Scenario identity", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/wrong",
      stepCount: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).not.toHaveBeenCalled();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      message: expect.stringMatching(/identity mismatch/),
    });

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 2,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).toHaveBeenCalledTimes(2);
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "ok",
      kind: "advanced",
      frames: [
        { acceptedRevision: 1 },
        { acceptedRevision: 2 },
      ],
    });
  });

  it("atomically rejects stale controls and commits one epoch on success", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.applyControl).not.toHaveBeenCalled();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      fatal: false,
      message: expect.stringMatching(/stale expected input epoch/),
    });
    expect(harness.runtime.state).toBe("active");

    harness.runtime.enqueue(createStudioSimulationApplyControlRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.applyControl).toHaveBeenCalledWith({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "ok",
      kind: "control-applied",
      frame: { inputEpoch: 1 },
    });
    expect(harness.runtime.state).toBe("active");
  });

  it("allows an accepted clock reset when a control starts a new input epoch", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      kind: "advanced",
      frames: [{ acceptedRevision: 1, acceptedTimeSec: 0.1 }],
    });

    harness.runtime.enqueue(createStudioSimulationApplyControlRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "ok",
      kind: "control-applied",
      frame: {
        inputEpoch: 1,
        acceptedRevision: 0,
        acceptedTimeSec: 0,
      },
    });
  });

  it("keeps the accepted epoch and frame after a rejected control", async () => {
    const applyControl = vi.fn(() => Promise.reject(
      new Error("value is outside the model-owned range"),
    ));
    const harness = runtimeHarnessV2({ applyControl });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 500,
      expectedInputEpoch: 0,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      fatal: false,
      message: expect.stringMatching(/outside the model-owned range/),
    });
    expect(harness.runtime.state).toBe("active");
    expect(harness.adapter.currentInputEpoch({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
    })).toBe(0);
    expect(harness.adapter.currentFrame({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
    })).toEqual(frameV2());

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "ok",
      kind: "advanced",
      frames: [{ inputEpoch: 0 }],
    });
  });

  it("fails closed if a rejected adapter control changes its committed frame", async () => {
    let inputEpoch = 0;
    let currentFrame = frameV2();
    const harness = runtimeHarnessV2({
      currentInputEpoch: vi.fn(() => inputEpoch),
      currentFrame: vi.fn(() => currentFrame),
      applyControl: vi.fn(() => {
        inputEpoch = 1;
        currentFrame = frameV2({ inputEpoch });
        return Promise.reject(new Error("rejected after mutation"));
      }),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    harness.runtime.enqueue(createStudioSimulationApplyControlRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    }));
    await harness.runtime.whenIdle();

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      fatal: true,
      message: expect.stringMatching(/violated atomicity/),
    });
    expect(harness.adapter.disposeSession).toHaveBeenCalledTimes(1);
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("failed");
  });

  it("computes an exact-clock analysis without changing the active frame", async () => {
    const requestAnalysis = vi.fn((input) => Promise.resolve(analysisV2({
      analysisId: input.analysisId,
      inputEpoch: input.expectedInputEpoch,
      sourceAcceptedRevision: input.expectedAcceptedRevision,
      sourceAcceptedTimeSec: input.expectedAcceptedTimeSec,
      payload: { curve: [{ pressure: 2, flow: 4 }] },
    })));
    const harness = runtimeHarnessV2({ requestAnalysis });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    const before = harness.adapter.currentFrame({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
    });

    harness.runtime.enqueue(createStudioSimulationRequestAnalysisRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    }));
    await harness.runtime.whenIdle();

    expect(requestAnalysis).toHaveBeenCalledTimes(1);
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "ok",
      kind: "analysis-result",
      analysis: {
        analysisId: "analysis/guyton-starling-v1",
        sourceAcceptedRevision: 0,
        sourceAcceptedTimeSec: 0,
      },
    });
    expect(harness.adapter.currentFrame({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
    })).toEqual(before);
    expect(harness.runtime.state).toBe("active");
  });

  it("rejects stale and unknown analyses recoverably", async () => {
    const requestAnalysis = vi.fn(() => Promise.reject(
      new Error("analysis is not registered"),
    ));
    const harness = runtimeHarnessV2({ requestAnalysis });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationRequestAnalysisRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/stale",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 1,
      expectedAcceptedTimeSec: 0,
    }));
    await harness.runtime.whenIdle();
    expect(requestAnalysis).not.toHaveBeenCalled();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      fatal: false,
      message: expect.stringMatching(/stale expected clocks/),
    });

    harness.runtime.enqueue(createStudioSimulationRequestAnalysisRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/unknown",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "error",
      fatal: false,
      message: expect.stringMatching(/not registered/),
    });
    expect(harness.runtime.state).toBe("active");

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(4, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 4,
      status: "ok",
      kind: "advanced",
    });
  });

  it("fails closed if analysis computation mutates the model frame", async () => {
    let current = frameV2();
    const harness = runtimeHarnessV2({
      currentFrame: vi.fn(() => current),
      requestAnalysis: vi.fn((input) => {
        current = frameV2({
          acceptedRevision: 1,
          acceptedTimeSec: 0.1,
        });
        return Promise.resolve(analysisV2({
          analysisId: input.analysisId,
        }));
      }),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    harness.runtime.enqueue(createStudioSimulationRequestAnalysisRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/mutating",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    }));
    await harness.runtime.whenIdle();

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      fatal: true,
      message: expect.stringMatching(/read-only semantics/),
    });
    expect(harness.runtime.state).toBe("failed");
    expect(harness.port.close).toHaveBeenCalledTimes(1);
  });

  it("rejects a loaded adapter for another model before creating a session", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(
      1,
      "model/another-release",
    ));
    await harness.runtime.whenIdle();

    expect(harness.adapter.createSession).not.toHaveBeenCalled();
    expect(harness.adapter.disposeSession).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({
        requestId: 1,
        status: "error",
        message: expect.stringMatching(/modelId.*requested model/),
      }),
    ]);
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("failed");
  });

  it("decodes before loading an adapter and consumes malformed request IDs", async () => {
    const harness = runtimeHarnessV2();
    const getter = vi.fn(() => ({ value: 1 }));
    const request = {
      ...initializeRequestV2(7),
    } as unknown as Record<string, unknown>;
    Object.defineProperty(request, "fixture", {
      enumerable: true,
      get: getter,
    });

    harness.runtime.enqueue(request);
    harness.runtime.enqueue(initializeRequestV2(6));
    await harness.runtime.whenIdle();

    expect(getter).not.toHaveBeenCalled();
    expect(harness.loadAdapter).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({ requestId: 7, status: "error" }),
      expect.objectContaining({
        requestId: 6,
        status: "error",
        message: expect.stringMatching(/increase strictly/),
      }),
    ]);
  });

  it("turns uninspectable messages into uncorrelated errors", async () => {
    const harness = runtimeHarnessV2();
    const revocable = Proxy.revocable({}, {});
    revocable.revoke();

    expect(() => harness.runtime.enqueue(revocable.proxy)).not.toThrow();
    await harness.runtime.whenIdle();

    expect(harness.loadAdapter).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({ requestId: 0, status: "error" }),
    ]);
  });

  it("bounds the active-plus-queued request count", async () => {
    const createGate = deferredV2<void>();
    const harness = runtimeHarnessV2({
      createSession: vi.fn(() => createGate.promise),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));

    expect(harness.port.messages).toContainEqual(expect.objectContaining({
      requestId: 3,
      status: "error",
      message: "simulation worker queue capacity exceeded",
    }));
    createGate.resolve();
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).toHaveBeenCalledTimes(1);
  });

  it("makes queued disposal terminal and rejects later work", async () => {
    const advanceGate = deferredV2<StudioSimulationFrameV2>();
    const harness = runtimeHarnessV2({
      advanceOnePresentationStep: vi.fn(() => advanceGate.promise),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    harness.runtime.enqueue(createStudioSimulationDisposeRequestV2(
      3,
      "runtime/session-1",
    ));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(4, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 4,
      status: "error",
      message: expect.stringMatching(/accepts no further requests/),
    });
    advanceGate.resolve(frameV2({ acceptedRevision: 1, acceptedTimeSec: 0.1 }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.disposeSession).toHaveBeenCalledTimes(1);
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("closed");
  });

  it("fails closed when disposal targets another session", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationDisposeRequestV2(
      2,
      "runtime/forged",
    ));
    await harness.runtime.whenIdle();

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      message: expect.stringMatching(/identity mismatch/),
    });
    expect(harness.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("failed");
  });

  it("cleans up a session whose initialization completes after termination", async () => {
    const createGate = deferredV2<void>();
    const createSession = vi.fn(() => createGate.promise);
    const harness = runtimeHarnessV2({ createSession });
    harness.runtime.enqueue(initializeRequestV2(1));
    await vi.waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));

    harness.runtime.terminate();
    createGate.resolve();
    await harness.runtime.whenIdle();

    expect(harness.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.port.messages).toEqual([]);
    expect(harness.runtime.state).toBe("closed");
  });

  it("disposes and closes after initialization or frame-validation failure", async () => {
    const createFailure = runtimeHarnessV2({
      createSession: vi.fn(() => Promise.reject(new Error("create failed"))),
    });
    createFailure.runtime.enqueue(initializeRequestV2(1));
    await createFailure.runtime.whenIdle();
    expect(createFailure.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(createFailure.port.close).toHaveBeenCalledTimes(1);
    expect(createFailure.runtime.state).toBe("failed");

    const invalidFrame = runtimeHarnessV2({
      currentFrame: vi.fn(() => frameV2({
        runtimeSessionId: "runtime/forged",
      })),
    });
    invalidFrame.runtime.enqueue(initializeRequestV2(1));
    await invalidFrame.runtime.whenIdle();
    expect(invalidFrame.adapter.disposeSession).toHaveBeenCalledTimes(1);
    expect(invalidFrame.port.close).toHaveBeenCalledTimes(1);
    expect(invalidFrame.runtime.state).toBe("failed");
  });
});

describe("Studio simulation worker V2 client", () => {
  it("validates input and response identity while returning detached frames", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const fixture = { value: 1 };
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture,
    });
    fixture.value = 2;
    expect(transport.messages[0]).toMatchObject({
      expectedModelId: "model/main-wire-v3-r1",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await expect(initialized).resolves.toMatchObject({
      runtimeSessionId: "runtime/session-1",
    });

    const advanced = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    transport.emitMessage(advancedResponseV2(2, [frameV2({
      acceptedRevision: 1,
      acceptedTimeSec: 0.1,
    })]));
    await expect(advanced).resolves.toHaveLength(1);
  });

  it("applies a semantic control and advances the client epoch exactly once", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    const beforeControl = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    transport.emitMessage(advancedResponseV2(2, [frameV2({
      acceptedRevision: 4,
      acceptedTimeSec: 0.4,
    })]));
    await beforeControl;

    const applied = client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    expect(transport.messages.at(-1)).toMatchObject({
      requestId: 3,
      kind: "apply-control",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    transport.emitMessage(controlAppliedResponseV2(
      3,
      frameV2({
        inputEpoch: 1,
        acceptedRevision: 0,
        acceptedTimeSec: 0,
      }),
    ));
    await expect(applied).resolves.toMatchObject({ inputEpoch: 1 });

    const advanced = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    transport.emitMessage(advancedResponseV2(4, [frameV2({
      inputEpoch: 1,
      acceptedRevision: 1,
      acceptedTimeSec: 0.1,
    })]));
    await expect(advanced).resolves.toHaveLength(1);
  });

  it("keeps the client active and its epoch unchanged after control rejection", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    const rejected = client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 500,
      expectedInputEpoch: 0,
    });
    transport.emitMessage({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 2,
      status: "error",
      fatal: false,
      message: "control value rejected",
    });
    await expect(rejected).rejects.toThrow(/control value rejected/);
    expect(transport.terminate).not.toHaveBeenCalled();

    const retried = client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    transport.emitMessage(controlAppliedResponseV2(
      3,
      frameV2({ inputEpoch: 1 }),
    ));
    await expect(retried).resolves.toMatchObject({ inputEpoch: 1 });
    expect(transport.terminate).not.toHaveBeenCalled();
  });

  it("requests an exact-clock analysis as a recoverable single operation", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;
    const advanced = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    transport.emitMessage(advancedResponseV2(2, [frameV2({
      acceptedRevision: 4,
      acceptedTimeSec: 0.4,
    })]));
    await advanced;

    const requested = client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 4,
      expectedAcceptedTimeSec: 0.4,
    });
    expect(transport.messages.at(-1)).toMatchObject({
      requestId: 3,
      kind: "request-analysis",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 4,
      expectedAcceptedTimeSec: 0.4,
    });
    await expect(client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).rejects.toThrow(/operation in flight/);
    transport.emitMessage(analysisResultResponseV2(3, analysisV2({
      sourceAcceptedRevision: 4,
      sourceAcceptedTimeSec: 0.4,
    })));
    await expect(requested).resolves.toMatchObject({
      analysisId: "analysis/guyton-starling-v1",
      sourceAcceptedRevision: 4,
      sourceAcceptedTimeSec: 0.4,
    });

    await expect(client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/guyton-starling-v1",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 3,
      expectedAcceptedTimeSec: 0.4,
    })).rejects.toThrow(/clocks are stale/);
    expect(transport.messages).toHaveLength(3);

    const unknown = client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/unknown",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 4,
      expectedAcceptedTimeSec: 0.4,
    });
    transport.emitMessage({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 5,
      status: "error",
      fatal: false,
      message: "analysis is not registered",
    });
    await expect(unknown).rejects.toThrow(/not registered/);
    expect(transport.terminate).not.toHaveBeenCalled();
  });

  it("permits only one advance or control operation in flight", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    const applied = client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    await expect(client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).rejects.toThrow(/operation in flight/);
    expect(transport.messages).toHaveLength(2);
    transport.emitMessage(controlAppliedResponseV2(
      2,
      frameV2({ inputEpoch: 1 }),
    ));
    await applied;
  });

  it("rejects a stale client epoch before posting a control", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    await expect(client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 1,
    })).rejects.toThrow(/input epoch is stale/);
    expect(transport.messages).toHaveLength(1);
    expect(transport.terminate).not.toHaveBeenCalled();
  });

  it("rejects input accessors without invoking or posting them", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const getter = vi.fn(() => "runtime/session-1");
    const input: Record<string, unknown> = {
      expectedModelId: "model/main-wire-v3-r1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    };
    Object.defineProperty(input, "runtimeSessionId", {
      enumerable: true,
      get: getter,
    });

    await expect(client.initialize(input as any)).rejects
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();
    expect(transport.messages).toEqual([]);
  });

  it("terminates on malformed, unknown, or cross-session responses", async () => {
    for (const response of [
      { ...initializedResponseV2(9) },
      initializedResponseV2(1, { runtimeSessionId: "runtime/forged" }),
      initializedResponseV2(1, { modelId: "model/forged" }),
    ]) {
      const transport = new FakeWorkerTransportV2();
      const client = new StudioSimulationWorkerClientV2({ transport });
      const initialized = client.initialize({
        expectedModelId: "model/main-wire-v3-r1",
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        fixture: { value: 1 },
      });
      transport.emitMessage(response);
      await expect(initialized).rejects.toThrow(/pending request|identity mismatch/);
      expect(transport.terminate).toHaveBeenCalledTimes(1);
    }

    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    const getter = vi.fn(() => frameV2());
    const malformed: Record<string, unknown> = {
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
    };
    Object.defineProperty(malformed, "frame", {
      enumerable: true,
      get: getter,
    });
    transport.emitMessage(malformed);
    await expect(initialized).rejects.toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();
    expect(transport.terminate).toHaveBeenCalledTimes(1);
  });

  it("makes timeout terminal for every pending request", async () => {
    vi.useFakeTimers();
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({
      transport,
      responseTimeoutMs: 10,
    });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    const assertion = expect(initialized).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    await expect(client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).rejects.toThrow(/not active/);
  });

  it("shares one dispose operation and terminates exactly once", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    const first = client.dispose("runtime/session-1");
    const second = client.dispose("runtime/session-1");
    expect(second).toBe(first);
    expect(transport.messages).toHaveLength(2);
    transport.emitMessage({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 2,
      status: "ok",
      kind: "disposed",
    });
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    client.terminate();
    expect(transport.terminate).toHaveBeenCalledTimes(1);
  });
});

describe("Studio simulation worker V2 client/runtime terminal integration", () => {
  it("terminates immediately after a fatal apply-control atomicity violation", async () => {
    let inputEpoch = 0;
    let currentFrame = frameV2();
    const adapter = runtimeHarnessV2({
      currentInputEpoch: vi.fn(() => inputEpoch),
      currentFrame: vi.fn(() => currentFrame),
      applyControl: vi.fn(() => {
        inputEpoch = 1;
        currentFrame = frameV2({ inputEpoch });
        return Promise.reject(new Error("rejected after mutation"));
      }),
    }).adapter;
    const transport = new RuntimeBackedWorkerTransportV2(adapter);
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: adapter.modelId,
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    await transport.whenIdle();
    await initialized;

    const failed = client.applyControl({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      controlId: "control/heart-rate",
      value: 72,
      expectedInputEpoch: 0,
    });
    const failedAssertion = expect(failed).rejects.toThrow(
      /violated atomicity/,
    );
    await transport.whenIdle();
    await failedAssertion;
    expect(transport.responses.at(-1)).toMatchObject({
      status: "error",
      fatal: true,
    });
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    await expect(client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).rejects.toThrow(/not active/);
    expect(transport.messages).toHaveLength(2);
  });

  it("terminates immediately after a fatal request-analysis mutation", async () => {
    let currentFrame = frameV2();
    const adapter = runtimeHarnessV2({
      currentFrame: vi.fn(() => currentFrame),
      requestAnalysis: vi.fn((input) => {
        currentFrame = frameV2({
          acceptedRevision: 1,
          acceptedTimeSec: 0.1,
        });
        return Promise.resolve(analysisV2({
          analysisId: input.analysisId,
        }));
      }),
    }).adapter;
    const transport = new RuntimeBackedWorkerTransportV2(adapter);
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: adapter.modelId,
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    await transport.whenIdle();
    await initialized;

    const failed = client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/mutating",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    });
    const failedAssertion = expect(failed).rejects.toThrow(
      /read-only semantics/,
    );
    await transport.whenIdle();
    await failedAssertion;
    expect(transport.responses.at(-1)).toMatchObject({
      status: "error",
      fatal: true,
    });
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    await expect(client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/another",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    })).rejects.toThrow(/not active/);
    expect(transport.messages).toHaveLength(2);
  });

  it("keeps an unknown analysis rejection recoverable end to end", async () => {
    const adapter = runtimeHarnessV2({
      requestAnalysis: vi.fn(() => Promise.reject(
        new Error("analysis is not registered"),
      )),
    }).adapter;
    const transport = new RuntimeBackedWorkerTransportV2(adapter);
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: adapter.modelId,
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    await transport.whenIdle();
    await initialized;

    const rejected = client.requestAnalysis({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      analysisId: "analysis/unknown",
      expectedInputEpoch: 0,
      expectedAcceptedRevision: 0,
      expectedAcceptedTimeSec: 0,
    });
    const rejectedAssertion = expect(rejected).rejects.toThrow(
      /not registered/,
    );
    await transport.whenIdle();
    await rejectedAssertion;
    expect(transport.responses.at(-1)).toMatchObject({
      status: "error",
      fatal: false,
    });
    expect(transport.terminate).not.toHaveBeenCalled();

    const advanced = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    await transport.whenIdle();
    await expect(advanced).resolves.toMatchObject([
      { acceptedRevision: 1, acceptedTimeSec: 0.1 },
    ]);
    expect(transport.terminate).not.toHaveBeenCalled();
  });
});

function initializeRequestV2(
  requestId: number,
  expectedModelId = "model/main-wire-v3-r1",
) {
  return createStudioSimulationInitializeRequestV2(requestId, {
    expectedModelId,
    runtimeSessionId: "runtime/session-1",
    scenarioId: "scenario/baseline",
    fixture: { value: 1 },
  });
}

function initializedResponseV2(
  requestId: number,
  frameOverrides: Partial<StudioSimulationFrameV2> = {},
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "initialized" as const,
    frame: frameV2(frameOverrides),
  };
}

function advancedResponseV2(
  requestId: number,
  frames: readonly StudioSimulationFrameV2[],
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "advanced" as const,
    frames,
  };
}

function controlAppliedResponseV2(
  requestId: number,
  frame: StudioSimulationFrameV2,
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "control-applied" as const,
    frame,
  };
}

function analysisResultResponseV2(
  requestId: number,
  analysis: StudioSimulationAnalysisV2,
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "analysis-result" as const,
    analysis,
  };
}

function frameV2(
  overrides: Partial<StudioSimulationFrameV2> = {},
): StudioSimulationFrameV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    runtimeSessionId: "runtime/session-1",
    scenarioId: "scenario/baseline",
    inputEpoch: 0,
    acceptedRevision: 0,
    acceptedTimeSec: 0,
    outputs: {
      "pressure.lv": outputV2("pressure.lv", 80),
    },
    ...overrides,
  };
}

function analysisV2(
  overrides: Partial<StudioSimulationAnalysisV2> = {},
): StudioSimulationAnalysisV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    runtimeSessionId: "runtime/session-1",
    scenarioId: "scenario/baseline",
    inputEpoch: 0,
    sourceAcceptedRevision: 0,
    sourceAcceptedTimeSec: 0,
    analysisId: "analysis/guyton-starling-v1",
    payload: { curve: [{ pressure: 1, flow: 2 }] },
    ...overrides,
  };
}

function outputV2(outputId: string, value: number | number[]) {
  return {
    outputId,
    value,
    availability: "available" as const,
    quality: "authoritative-state" as const,
  };
}

function runtimeHarnessV2(overrides: Readonly<{
  createSession?: RegisteredModelSimulationAdapterV2["createSession"];
  currentFrame?: RegisteredModelSimulationAdapterV2["currentFrame"];
  advanceOnePresentationStep?:
    RegisteredModelSimulationAdapterV2["advanceOnePresentationStep"];
  applyControl?: RegisteredModelSimulationAdapterV2["applyControl"];
  requestAnalysis?: RegisteredModelSimulationAdapterV2["requestAnalysis"];
  currentInputEpoch?: RegisteredModelSimulationAdapterV2["currentInputEpoch"];
}> = {}) {
  let revision = 0;
  let inputEpoch = 0;
  let currentFrame = frameV2();
  const adapter: RegisteredModelSimulationAdapterV2 = {
    modelId: "model/main-wire-v3-r1",
    fixtureSchemaId: "fixture/main-wire-v3-r1",
    checkpointCodecId: "checkpoint/main-wire-v3-r1",
    createSession: overrides.createSession ?? vi.fn(() => Promise.resolve()),
    disposeSession: vi.fn(),
    currentFrame: overrides.currentFrame ?? vi.fn(() => currentFrame),
    advanceOnePresentationStep: overrides.advanceOnePresentationStep
      ?? vi.fn(() => {
        revision += 1;
        currentFrame = frameV2({
          inputEpoch,
          acceptedRevision: revision,
          acceptedTimeSec: revision / 10,
        });
        return Promise.resolve(currentFrame);
      }),
    applyControl: overrides.applyControl ?? vi.fn((input) => {
      if (input.expectedInputEpoch !== inputEpoch) {
        return Promise.reject(new Error("stale input epoch"));
      }
      inputEpoch += 1;
      currentFrame = frameV2({
        inputEpoch,
      });
      return Promise.resolve(currentFrame);
    }),
    requestAnalysis: overrides.requestAnalysis ?? vi.fn((input) =>
      Promise.resolve(analysisV2({
        analysisId: input.analysisId,
        inputEpoch,
        sourceAcceptedRevision: currentFrame.acceptedRevision,
        sourceAcceptedTimeSec: currentFrame.acceptedTimeSec,
      }))),
    replaceFixture: vi.fn(() => Promise.resolve(0)),
    currentInputEpoch: overrides.currentInputEpoch
      ?? vi.fn(() => inputEpoch),
  };
  const port = {
    messages: [] as unknown[],
    postMessage: vi.fn((message: unknown) => {
      port.messages.push(message);
    }),
    close: vi.fn(),
  };
  const loadAdapter = vi.fn(() => Promise.resolve(adapter));
  const runtime = new StudioSimulationWorkerRuntimeV2({
    loadSimulationAdapter: loadAdapter,
    port,
  });
  return { adapter, loadAdapter, port, runtime };
}

function deferredV2<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

class FakeWorkerTransportV2 implements StudioSimulationWorkerTransportV2 {
  readonly messages: unknown[] = [];
  readonly terminate = vi.fn();
  readonly #messageListeners = new Set<(event: MessageEvent<unknown>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }

  emitMessage(data: unknown): void {
    for (const listener of this.#messageListeners) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
}

class RuntimeBackedWorkerTransportV2
implements StudioSimulationWorkerTransportV2 {
  readonly messages: unknown[] = [];
  readonly responses: unknown[] = [];
  readonly runtime: StudioSimulationWorkerRuntimeV2;
  readonly terminate: ReturnType<typeof vi.fn>;
  readonly close = vi.fn();
  readonly #messageListeners = new Set<(event: MessageEvent<unknown>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();

  constructor(adapter: RegisteredModelSimulationAdapterV2) {
    this.runtime = new StudioSimulationWorkerRuntimeV2({
      loadSimulationAdapter: () => Promise.resolve(adapter),
      port: {
        postMessage: (message) => {
          this.responses.push(message);
          for (const listener of this.#messageListeners) {
            listener({ data: message } as MessageEvent<unknown>);
          }
        },
        close: this.close,
      },
    });
    this.terminate = vi.fn(() => this.runtime.terminate());
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
    this.runtime.enqueue(message);
  }

  whenIdle(): Promise<void> {
    return this.runtime.whenIdle();
  }

  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }
}

import { describe, expect, it, vi } from "vitest";
import { PreviewController } from "@/engine/previewController";
import { ModelCore } from "@/engine/ModelCore";
import { DEFAULT_PARAMS } from "@/constants";
import {
  isCurrentTransitionSteadyResult,
  makeTransitionTargetSignature,
} from "@/engine/transitionSteadyProtocol";
import type { SerializedModelState, SteadyResult } from "@/engine/stateContract";
import type { SimInstance } from "@/types";

// Headless verification of the S3a driver. tick(now) is rAF-free and
// deterministic given timestamps, which is exactly what the extraction enables.

const inst = (id = "1", params: SimInstance["params"] = { ...DEFAULT_PARAMS }): SimInstance => ({
  id,
  name: `Heart ${id}`,
  color: "#ffffff",
  params,
  targetVolume: 5600,
  isVisible: true,
});

class FakePreviewWorker {
  static latest: FakePreviewWorker | null = null;
  static instances: FakePreviewWorker[] = [];
  static throwOnScript: string | null = null;

  onmessage: ((event: MessageEvent<any>) => void) | null = null;
  onerror: (() => void) | null = null;
  readonly messages: any[] = [];
  readonly script: string;
  terminated = false;

  constructor(...args: any[]) {
    this.script = String(args[0] ?? "");
    if (FakePreviewWorker.throwOnScript && this.script.includes(FakePreviewWorker.throwOnScript)) {
      throw new Error(`Failed to construct ${FakePreviewWorker.throwOnScript}`);
    }
    FakePreviewWorker.latest = this;
    FakePreviewWorker.instances.push(this);
  }

  postMessage(message: any): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: any): void {
    this.onmessage?.({ data: message } as MessageEvent<any>);
  }
}

const withFakeWorker = (options: { throwOnScript?: string } = {}) => {
  const previousWorker = (globalThis as any).Worker;
  FakePreviewWorker.latest = null;
  FakePreviewWorker.instances = [];
  FakePreviewWorker.throwOnScript = options.throwOnScript ?? null;
  (globalThis as any).Worker = FakePreviewWorker;
  return {
    latest: () => {
      if (!FakePreviewWorker.latest) throw new Error("Fake worker was not constructed");
      return FakePreviewWorker.latest;
    },
    byScript: (fragment: string) => {
      const worker = [...FakePreviewWorker.instances].reverse().find((candidate) => candidate.script.includes(fragment));
      if (!worker) throw new Error(`Fake worker for ${fragment} was not constructed`);
      return worker;
    },
    restore: () => {
      (globalThis as any).Worker = previousWorker;
      FakePreviewWorker.throwOnScript = null;
    },
  };
};

const phase = (phi: number): number => {
  const frac = phi - Math.floor(phi);
  return frac < 0 ? frac + 1 : frac;
};

const packedStateFor = (target: SimInstance): SerializedModelState => {
  const core = new ModelCore(target.params);
  core.initializeVenousPressuresForTargetTBV(target.targetVolume);
  return core.packState();
};

const steadyResult = (state: SteadyResult["state"] = {} as SteadyResult["state"]): SteadyResult => ({
  state,
} as SteadyResult);

const snapshot = (params: SimInstance["params"], t = 1) => ({
  t,
  p: params,
  metrics: {} as any,
  health: {} as any,
  observables: {} as any,
});

const transitionResult = (
  request: ReturnType<PreviewController["requestNextSteady"]>["request"],
  overrides: Record<string, unknown> = {},
) => ({
  type: "transitionSteadyResult" as const,
  outcome: "completed" as const,
  jobId: request.jobId,
  generation: request.generation,
  instanceId: request.instanceId,
  toSignature: request.toSignature,
  steady: steadyResult(),
  ...overrides,
});

const transitionErrorResult = (
  request: ReturnType<PreviewController["requestNextSteady"]>["request"],
  message: string,
  overrides: Record<string, unknown> = {},
) => ({
  type: "transitionSteadyResult" as const,
  outcome: "error" as const,
  jobId: request.jobId,
  generation: request.generation,
  instanceId: request.instanceId,
  toSignature: request.toSignature,
  message,
  ...overrides,
});

const transitionStaleResult = (
  request: ReturnType<PreviewController["requestNextSteady"]>["request"],
  overrides: Record<string, unknown> = {},
) => ({
  type: "transitionSteadyResult" as const,
  outcome: "stale" as const,
  jobId: request.jobId,
  generation: request.generation,
  instanceId: request.instanceId,
  toSignature: request.toSignature,
  ...overrides,
});

const latestWorkerMessage = (worker: FakePreviewWorker, type: string) => {
  for (let i = worker.messages.length - 1; i >= 0; i--) {
    if (worker.messages[i]?.type === type) return worker.messages[i];
  }
  throw new Error(`No worker message of type ${type}`);
};

describe("PreviewController (headless driver)", () => {
  it("debounces transition steady worker posts and status until the flush", () => {
    const workerHarness = withFakeWorker();
    vi.useFakeTimers();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 5 });
      c.setInstances([target]);
      const previewWorker = workerHarness.byScript("previewWorker");
      const beforeMessages = previewWorker.messages.length;
      const pending = c.requestNextSteady(target);

      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(previewWorker.messages.length).toBe(beforeMessages);
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);

      vi.advanceTimersByTime(299);
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);
      expect(c.getSteadyUpdateStatuses()).toEqual({});

      vi.advanceTimersByTime(1);
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      expect(transitionWorker.messages).toEqual([pending.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
      expect(pending.postedAtMs).toBeTypeOf("number");
      expect(pending.deadlineAtMs).toBe((pending.postedAtMs ?? 0) + 20_000);
    } finally {
      vi.useRealTimers();
      workerHarness.restore();
    }
  });

  it("debounces same-instance steady requests with latest-wins semantics", () => {
    const workerHarness = withFakeWorker();
    vi.useFakeTimers();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      c.setInstances([inst("1")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      vi.advanceTimersByTime(150);
      const second = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));

      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(second.request.jobId).not.toBe(first.request.jobId);
      vi.advanceTimersByTime(299);
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);

      vi.advanceTimersByTime(1);
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      expect(transitionWorker.messages).toEqual([second.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
    } finally {
      vi.useRealTimers();
      workerHarness.restore();
    }
  });

  it("coalesces multiple instance steady requests into one debounce flush", () => {
    const workerHarness = withFakeWorker();
    vi.useFakeTimers();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      c.setInstances([inst("1"), inst("2")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      vi.advanceTimersByTime(100);
      const second = c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      vi.advanceTimersByTime(299);
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);

      vi.advanceTimersByTime(1);
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      expect(transitionWorker.messages).toEqual([first.request, second.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing", "2": "computing" });
    } finally {
      vi.useRealTimers();
      workerHarness.restore();
    }
  });

  it("cancels debounce timers when pending steady jobs are cleared", () => {
    const workerHarness = withFakeWorker();
    vi.useFakeTimers();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      c.setInstances([inst("1")]);
      c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));

      c.clearPendingTransitionSteadyJob("1");
      vi.advanceTimersByTime(300);

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);
    } finally {
      vi.useRealTimers();
      workerHarness.restore();
    }
  });

  it("cancels debounced steady posts on reset, removal, fallback, and stop", () => {
    const cases: Array<{
      name: string;
      act: (controller: PreviewController, workerHarness: ReturnType<typeof withFakeWorker>) => void;
    }> = [
      { name: "reset", act: (controller) => controller.resetInstances(["1"]) },
      { name: "remove", act: (controller) => controller.setInstances([]) },
      {
        name: "fallback",
        act: (_controller, workerHarness) => workerHarness.byScript("previewWorker").emit({ type: "error", message: "boom" }),
      },
      { name: "stop", act: (controller) => controller.stop() },
    ];

    vi.useFakeTimers();
    try {
      for (const item of cases) {
        const workerHarness = withFakeWorker();
        try {
          const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
          c.setInstances([inst("1")]);
          c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));

          item.act(c, workerHarness);
          vi.advanceTimersByTime(300);

          expect(c.getPendingTransitionSteadyJob("1"), item.name).toBeUndefined();
          expect(c.getSteadyUpdateStatuses(), item.name).toEqual({});
          expect(() => workerHarness.byScript("transitionSteadyWorker"), item.name).toThrow(/was not constructed/);
        } finally {
          workerHarness.restore();
        }
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not time out unposted debounced steady jobs", () => {
    const workerHarness = withFakeWorker();
    const nowSpy = vi.spyOn(globalThis.performance, "now");
    try {
      nowSpy.mockReturnValue(1000);
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      c.setInstances([inst("1")]);
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));

      nowSpy.mockReturnValue(30_000);
      c.tick(1000);

      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(() => workerHarness.byScript("transitionSteadyWorker")).toThrow(/was not constructed/);
    } finally {
      nowSpy.mockRestore();
      workerHarness.restore();
    }
  });

  it("does not fail an unposted debounced latest job when an older transition worker errors", () => {
    const workerHarness = withFakeWorker();
    vi.useFakeTimers();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 300 });
      c.setInstances([inst("1")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      vi.advanceTimersByTime(300);
      const firstWorker = workerHarness.byScript("transitionSteadyWorker");
      expect(firstWorker.messages).toEqual([first.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });

      const second = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(c.getSteadyUpdateStatuses()).toEqual({});

      firstWorker.onerror?.();

      expect(firstWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});

      vi.advanceTimersByTime(300);
      const secondWorker = workerHarness.byScript("transitionSteadyWorker");
      expect(secondWorker).not.toBe(firstWorker);
      expect(secondWorker.messages).toEqual([second.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
    } finally {
      vi.useRealTimers();
      workerHarness.restore();
    }
  });

  it("creates preview transition steady pending jobs without posting to the preview worker", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0, dt: 0.002, sampleHz: 240 });
      const previewWorker = workerHarness.byScript("previewWorker");
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 5 });
      c.setInstances([target]);
      const beforeMessages = previewWorker.messages.length;
      const pending = c.requestNextSteady(target);
      const request = pending.request;
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      const expectedToSignature = makeTransitionTargetSignature({
        params: target.params,
        targetVolume: target.targetVolume,
      });

      expect(previewWorker.messages.length).toBe(beforeMessages);
      expect(transitionWorker.messages).toEqual([request]);
      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
      expect(request.type).toBe("computeTransitionSteady");
      expect(request.instanceId).toBe("1");
      expect(request.params).toBe(target.params);
      expect(request.targetVolume).toBe(target.targetVolume);
      expect(request.toSignature).toBe(expectedToSignature);
      expect(request.fromSignature).toBe(request.toSignature);
      expect(request.options).toMatchObject({
        dt: 0.002,
        sampleHz: 240,
        targetTBV: target.targetVolume,
        measureBeats: 1,
        includeLastBeatSamples: true,
        requireProjectorQuiet: false,
      });
      expect(request.options.settlePolicy).toBeDefined();
    } finally {
      workerHarness.restore();
    }
  });

  it("keeps only the latest transition steady request per instance", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const firstWorker = workerHarness.byScript("transitionSteadyWorker");
      const second = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      const secondWorker = workerHarness.byScript("transitionSteadyWorker");

      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(second.request.jobId).not.toBe(first.request.jobId);
      expect(second.request.generation).toBeGreaterThan(first.request.generation);
      expect(firstWorker.terminated).toBe(true);
      expect(firstWorker.messages).toEqual([first.request]);
      expect(secondWorker).not.toBe(firstWorker);
      expect(secondWorker.messages).toEqual([second.request]);

      firstWorker.emit(transitionResult(first.request));
      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
    } finally {
      workerHarness.restore();
    }
  });

  it("restarts the transition steady worker and reposts other pending jobs when superseding", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1"), inst("2")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const firstWorker = workerHarness.byScript("transitionSteadyWorker");
      const second = c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      const secondWorker = workerHarness.byScript("transitionSteadyWorker");

      expect(firstWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBe(first);
      expect(c.getPendingTransitionSteadyJob("2")).toBe(second);
      expect(secondWorker.messages).toEqual([first.request, second.request]);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing", "2": "computing" });
    } finally {
      workerHarness.restore();
    }
  });

  it("uses the current instance as the transition steady source signature", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const current = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 });
      const next = {
        ...inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }),
        targetVolume: current.targetVolume + 100,
      };
      c.setInstances([current]);
      c.setInstances([next]);
      const pending = c.requestNextSteady(next);
      const expectedFromSignature = makeTransitionTargetSignature({
        params: current.params,
        targetVolume: current.targetVolume,
      });
      const expectedToSignature = makeTransitionTargetSignature({
        params: next.params,
        targetVolume: next.targetVolume,
      });

      expect(pending.request.fromSignature).toBe(expectedFromSignature);
      expect(pending.request.toSignature).toBe(expectedToSignature);
      expect(pending.request.fromSignature).not.toBe(pending.request.toSignature);
    } finally {
      workerHarness.restore();
    }
  });

  it("keeps the preview worker on the previous live instance while a no-freeze steady request is pending", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const current = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 });
      const next = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 });
      c.setInstances([current]);
      const previewWorker = workerHarness.byScript("previewWorker");
      const beforeMessages = previewWorker.messages.length;

      c.setInstances([next], { steadyTransitionIds: ["1"] });
      const pending = c.requestNextSteady(next);
      const pendingMessages = previewWorker.messages.length;

      c.setInstances([{ ...next, name: "Renamed", color: "#38bdf8" }]);

      expect(previewWorker.messages.length).toBe(beforeMessages);
      expect(previewWorker.messages.length).toBe(pendingMessages);
      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(pending.request.params).toBe(next.params);
      c.tick(1000);
      c.tick(1050);
      const tick = latestWorkerMessage(previewWorker, "tick");
      expect(tick.generation).toBeDefined();
      expect(previewWorker.messages.some((message) => message.type === "resetInstances")).toBe(false);
    } finally {
      workerHarness.restore();
    }
  });

  it("clears pending transition steady jobs when a plain physical edit changes the target", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const current = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 });
      const next = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 });
      c.setInstances([current]);
      const phys = c.refs.get("1")!;
      const oldSamples = [{ t: 0.5, phi: 0.5 }] as any[];
      phys.buffer = oldSamples;
      c.setInstances([next], { steadyTransitionIds: ["1"] });
      const pending = c.requestNextSteady(next);
      const previewWorker = workerHarness.byScript("previewWorker");
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      const rawEdited = inst("1", { ...next.params, bleedRate: 100 });

      c.setInstances([rawEdited]);

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(latestWorkerMessage(previewWorker, "setInstances").instances[0].params.bleedRate).toBe(100);

      transitionWorker.emit(transitionResult(pending.request, {
        samples: [{ t: 1, phi: 1 }] as any[],
        snapshot: snapshot(next.params, 10),
      }));

      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(phys.buffer).toBe(oldSamples);
      expect(phys.transition).toBeUndefined();
    } finally {
      workerHarness.restore();
    }
  });

  it("keeps transition steady pending jobs independent by instance", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1"), inst("2")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const second = c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));

      expect(c.getPendingTransitionSteadyJob("1")).toBe(first);
      expect(c.getPendingTransitionSteadyJob("2")).toBe(second);
      c.clearPendingTransitionSteadyJob("1");
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getPendingTransitionSteadyJob("2")).toBe(second);
    } finally {
      workerHarness.restore();
    }
  });

  it("clears transition steady pending jobs when the instance is reset or removed", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const current = inst("1");
      c.setInstances([current]);
      const first = c.requestNextSteady({ ...current, targetVolume: current.targetVolume + 100 });
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      transitionWorker.emit(transitionResult(first.request));

      c.resetInstances(["1"]);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});

      const second = c.requestNextSteady({ ...current, targetVolume: current.targetVolume + 200 });
      transitionWorker.emit(transitionResult(second.request));
      c.setInstances([]);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
    } finally {
      workerHarness.restore();
    }
  });

  it("clears transition steady pending jobs when falling back to sync cores", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.byScript("previewWorker");
      const current = inst("1");
      c.setInstances([current]);
      c.requestNextSteady({ ...current, targetVolume: current.targetVolume + 100 });

      worker.emit({ type: "error", message: "boom" });

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(worker.terminated).toBe(true);
    } finally {
      workerHarness.restore();
    }
  });

  it("accepts only the latest matching transition steady worker result", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const phys = c.refs.get("1")!;
      const oldSamples = [{ t: 0.5, phi: 0.5 }] as any[];
      phys.buffer = oldSamples;
      const firstTarget = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 });
      c.setInstances([firstTarget], { steadyTransitionIds: ["1"] });
      const first = c.requestNextSteady(firstTarget);
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 });
      c.setInstances([target], { steadyTransitionIds: ["1"] });
      const second = c.requestNextSteady(target);
      const previewWorker = workerHarness.byScript("previewWorker");
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      transitionWorker.emit(transitionResult(first.request));
      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });

      const samples = [{ t: 1, phi: 1 }] as any[];
      const accepted = transitionResult(second.request, {
        samples,
        snapshot: snapshot(target.params, 10),
      });
      transitionWorker.emit(accepted);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toEqual(accepted);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "updated" });
      expect(phys.buffer).toEqual(samples);
      expect(phys.previousEpoch?.buffer).toEqual(oldSamples);
      expect(phys.steadySignature).toBe(second.request.toSignature);
      expect(phys.transition?.status).toBe("promoted");
      expect((phys.core as any).t).toBe(10);
      expect(latestWorkerMessage(previewWorker, "promoteTransitionSteady")).toMatchObject({
        type: "promoteTransitionSteady",
        instance: target,
        state: accepted.steady.state,
      });
    } finally {
      workerHarness.restore();
    }
  });

  it("phase-aligns completed transition steady results and keeps the old waveform buffer", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const phys = c.refs.get("1")!;
      const oldSamples = [{ t: 9.95, phi: 40.2 }, { t: 10, phi: 40.25 }] as any[];
      phys.buffer = oldSamples;
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 });
      const steadyState = packedStateFor(target);
      c.setInstances([target], { steadyTransitionIds: ["1"] });
      const pending = c.requestNextSteady(target);
      const previewWorker = workerHarness.byScript("previewWorker");
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      const accepted = transitionResult(pending.request, {
        steady: steadyResult(steadyState),
        samples: [{ t: 1, phi: 1 }] as any[],
        snapshot: snapshot(target.params, steadyState.t),
      });

      transitionWorker.emit(accepted);

      const alignedSample = phys.buffer.at(-1)!;
      const promoteMessage = latestWorkerMessage(previewWorker, "promoteTransitionSteady");
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toEqual(accepted);
      expect(phys.buffer.slice(0, oldSamples.length)).toEqual(oldSamples);
      expect(phys.buffer.length).toBe(oldSamples.length + 1);
      expect(alignedSample.t).toBeGreaterThan(oldSamples.at(-1)!.t);
      expect(phase(alignedSample.phi)).toBeCloseTo(phase(oldSamples.at(-1)!.phi), 5);
      expect(phys.waveformBreakT).toBe(alignedSample.t);
      expect(phys.previousEpoch?.buffer).toEqual(oldSamples);
      expect((phys.core as any).t).toBe(alignedSample.t);
      expect(promoteMessage).toMatchObject({
        type: "promoteTransitionSteady",
        instance: target,
      });
      expect(promoteMessage.state.t).toBe(alignedSample.t);
      expect(promoteMessage.state.t).not.toBe(steadyState.t);
      expect(phase(promoteMessage.state.phi)).toBeCloseTo(phase(oldSamples.at(-1)!.phi), 5);
    } finally {
      workerHarness.restore();
    }
  });

  it("falls back to replace promotion when phase alignment has no finite old anchor", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const phys = c.refs.get("1")!;
      phys.buffer = [{ t: Number.NaN, phi: 0.25 }] as any[];
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 });
      const steadyState = packedStateFor(target);
      c.setInstances([target], { steadyTransitionIds: ["1"] });
      const pending = c.requestNextSteady(target);
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      const replacementSamples = [{ t: 1, phi: 1 }] as any[];

      transitionWorker.emit(transitionResult(pending.request, {
        steady: steadyResult(steadyState),
        samples: replacementSamples,
        snapshot: snapshot(target.params, steadyState.t),
      }));

      expect(phys.buffer).toEqual(replacementSamples);
      expect(phys.waveformBreakT).toBeUndefined();
    } finally {
      workerHarness.restore();
    }
  });

  it("publishes steady update statuses and expires successful updates", () => {
    const workerHarness = withFakeWorker();
    const nowSpy = vi.spyOn(globalThis.performance, "now");
    try {
      nowSpy.mockReturnValue(1000);
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const changes: Array<Record<string, string>> = [];
      c.onSteadyUpdateStatusChange = (statuses) => changes.push(statuses);
      c.setInstances([inst("1")]);
      const target = inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 });
      c.setInstances([target], { steadyTransitionIds: ["1"] });
      const pending = c.requestNextSteady(target);
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
      expect(changes).toContainEqual({ "1": "computing" });

      nowSpy.mockReturnValue(1100);
      transitionWorker.emit(transitionResult(pending.request, {
        samples: [{ t: 1, phi: 1 }] as any[],
        snapshot: snapshot(target.params, 10),
      }));
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "updated" });
      expect(changes).toContainEqual({ "1": "updated" });

      nowSpy.mockReturnValue(2299);
      c.tick(1000);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "updated" });

      nowSpy.mockReturnValue(2301);
      c.tick(1016);
      expect(c.getSteadyUpdateStatuses()).toEqual({});
      expect(changes).toContainEqual({});
    } finally {
      nowSpy.mockRestore();
      workerHarness.restore();
    }
  });

  it("times out a silent transition steady worker and marks the job failed", () => {
    const workerHarness = withFakeWorker();
    const nowSpy = vi.spyOn(globalThis.performance, "now");
    try {
      nowSpy.mockReturnValue(1000);
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      nowSpy.mockReturnValue(20_999);
      c.tick(1000);
      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });

      nowSpy.mockReturnValue(21_001);
      c.tick(1016);
      expect(transitionWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        jobId: pending.request.jobId,
        message: "Transition steady worker timed out",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed" });
    } finally {
      nowSpy.mockRestore();
      workerHarness.restore();
    }
  });

  it("refreshes reposted pending job deadlines after a transition steady watchdog timeout", () => {
    const workerHarness = withFakeWorker();
    const nowSpy = vi.spyOn(globalThis.performance, "now");
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1"), inst("2")]);
      nowSpy.mockReturnValue(1000);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      nowSpy.mockReturnValue(5000);
      const second = c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      const activeWorker = workerHarness.byScript("transitionSteadyWorker");
      first.deadlineAtMs = 21_000;
      second.deadlineAtMs = 25_000;

      nowSpy.mockReturnValue(21_001);
      c.tick(1000);
      const restartedWorker = workerHarness.byScript("transitionSteadyWorker");

      expect(activeWorker.terminated).toBe(true);
      expect(restartedWorker).not.toBe(activeWorker);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getPendingTransitionSteadyJob("2")).toBe(second);
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        jobId: first.request.jobId,
        message: "Transition steady worker timed out",
      });
      expect(c.getTransitionSteadyResult("2")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed", "2": "computing" });
      expect(restartedWorker.messages).toEqual([second.request]);
      expect(second.deadlineAtMs).toBe(41_001);

      nowSpy.mockReturnValue(24_999);
      c.tick(1016);
      expect(c.getPendingTransitionSteadyJob("2")).toBe(second);
      expect(c.getTransitionSteadyResult("2")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed", "2": "computing" });

      nowSpy.mockReturnValue(41_002);
      c.tick(1032);
      expect(c.getPendingTransitionSteadyJob("2")).toBeUndefined();
      expect(c.getTransitionSteadyResult("2")).toMatchObject({
        outcome: "error",
        jobId: second.request.jobId,
        message: "Transition steady worker timed out",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed", "2": "failed" });
    } finally {
      nowSpy.mockRestore();
      workerHarness.restore();
    }
  });

  it("ignores mismatched transition steady worker results without clearing pending", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      transitionWorker.emit(transitionResult(pending.request, { jobId: "old-job" }));
      transitionWorker.emit(transitionResult(pending.request, { generation: pending.request.generation - 1 }));
      transitionWorker.emit(transitionResult(pending.request, { instanceId: "other" }));
      transitionWorker.emit(transitionResult(pending.request, { toSignature: "old-signature" }));

      expect(c.getPendingTransitionSteadyJob("1")).toBe(pending);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });
    } finally {
      workerHarness.restore();
    }
  });

  it("clears current transition steady errors and ignores stale errors", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const second = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      transitionWorker.emit(transitionErrorResult(first.request, "old error"));
      expect(c.getPendingTransitionSteadyJob("1")).toBe(second);
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "computing" });

      const error = transitionErrorResult(second.request, "boom");
      transitionWorker.emit(error);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toEqual(error);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed" });
    } finally {
      workerHarness.restore();
    }
  });

  it("does not leave pending jobs when the transition steady worker cannot be created", () => {
    const workerHarness = withFakeWorker({ throwOnScript: "transitionSteadyWorker" });
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);

      c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        message: "Transition steady worker is unavailable",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed" });
    } finally {
      workerHarness.restore();
    }
  });

  it("fails all pending transition steady jobs if worker recreation becomes unavailable", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1"), inst("2")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const firstWorker = workerHarness.byScript("transitionSteadyWorker");
      FakePreviewWorker.throwOnScript = "transitionSteadyWorker";

      c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));

      expect(firstWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getPendingTransitionSteadyJob("2")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        jobId: first.request.jobId,
        message: "Transition steady worker is unavailable",
      });
      expect(c.getTransitionSteadyResult("2")).toMatchObject({
        outcome: "error",
        message: "Transition steady worker is unavailable",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed", "2": "failed" });
    } finally {
      workerHarness.restore();
    }
  });

  it("stores failed results when the transition steady worker reports an error", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1"), inst("2")]);
      const first = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const second = c.requestNextSteady(inst("2", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 2 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      transitionWorker.onerror?.();

      expect(transitionWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getPendingTransitionSteadyJob("2")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        jobId: first.request.jobId,
        message: "Transition steady worker failed",
      });
      expect(c.getTransitionSteadyResult("2")).toMatchObject({
        outcome: "error",
        jobId: second.request.jobId,
        message: "Transition steady worker failed",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed", "2": "failed" });
    } finally {
      workerHarness.restore();
    }
  });

  it("stores a current completed result without samples or snapshot as an error without promotion", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const phys = c.refs.get("1")!;
      const oldSamples = [{ t: 0.5, phi: 0.5 }] as any[];
      phys.buffer = oldSamples;
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      transitionWorker.emit(transitionResult(pending.request));

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toMatchObject({
        outcome: "error",
        message: "Transition steady result cannot be promoted",
      });
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed" });
      expect(phys.buffer).toBe(oldSamples);
      expect(phys.transition).toBeUndefined();
    } finally {
      workerHarness.restore();
    }
  });

  it("resolves a current stale transition steady result as failed", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");
      const stale = transitionStaleResult(pending.request, { message: "superseded by worker" });

      transitionWorker.emit(stale);

      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toEqual(stale);
      expect(c.getSteadyUpdateStatuses()).toEqual({ "1": "failed" });
    } finally {
      workerHarness.restore();
    }
  });

  it("terminates transition steady worker and clears jobs on stop", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const transitionWorker = workerHarness.byScript("transitionSteadyWorker");

      c.stop();

      expect(transitionWorker.terminated).toBe(true);
      expect(c.getPendingTransitionSteadyJob("1")).toBeUndefined();
      expect(c.getTransitionSteadyResult("1")).toBeUndefined();
      expect(c.getSteadyUpdateStatuses()).toEqual({});
    } finally {
      workerHarness.restore();
    }
  });

  it("rejects transition steady requests for untracked instances", () => {
    const c = new PreviewController({ useWorker: false });

    expect(() => c.requestNextSteady(inst("missing"))).toThrow(/untracked instance missing/);
    expect(c.getPendingTransitionSteadyJob("missing")).toBeUndefined();
  });

  it("uses transition steady identity helpers to reject stale pending results", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      c.setInstances([inst("1")]);
      const pending = c.requestNextSteady(inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 }));
      const request = pending.request;
      const current = {
        type: "transitionSteadyResult" as const,
        outcome: "completed" as const,
        jobId: request.jobId,
        generation: request.generation,
        instanceId: request.instanceId,
        toSignature: request.toSignature,
        steady: {} as SteadyResult,
      };

      expect(isCurrentTransitionSteadyResult(current, pending)).toBe(true);
      expect(isCurrentTransitionSteadyResult({ ...current, jobId: "old" }, pending)).toBe(false);
      expect(isCurrentTransitionSteadyResult({ ...current, generation: request.generation - 1 }, pending)).toBe(false);
      expect(isCurrentTransitionSteadyResult({ ...current, toSignature: "old" }, pending)).toBe(false);
    } finally {
      workerHarness.restore();
    }
  });

  it("clamps a large frame gap to 100ms of sim time", () => {
    const c = new PreviewController();
    c.setInstances([inst()]);
    const core = c.refs.get("1")!.core;

    // The first tick only initializes the clock (deltaTime = 0), matching the
    // original loop. Clamping is exercised on subsequent ticks.
    c.tick(1000);
    const t0 = core.t;
    c.tick(1000 + 5000); // 5s real gap -> clamped to 100ms
    expect(core.t - t0).toBeGreaterThan(0.09);
    expect(core.t - t0).toBeLessThanOrEqual(0.1 + 1e-6);
  });

  it("does not advance while paused, and resume does not replay the gap", () => {
    const c = new PreviewController();
    c.setInstances([inst()]);
    const core = c.refs.get("1")!.core;

    c.tick(100);
    const tPaused = core.t;

    c.setPlaying(false);
    c.tick(2000); // big gap while paused
    expect(core.t).toBe(tPaused); // no advance

    c.setPlaying(true);
    c.tick(2016); // resume: dt ~16ms, NOT the 1900ms paused gap
    expect(core.t - tPaused).toBeGreaterThan(0);
    expect(core.t - tPaused).toBeLessThanOrEqual(0.1 + 1e-6);
  });

  it("retains at most ~20s in the ring buffer", () => {
    const c = new PreviewController();
    c.setInstances([inst()]);
    const phys = c.refs.get("1")!;

    let now = 0;
    for (let i = 0; i < 700; i++) {
      now += 50; // 50ms frames @ 1x -> ~35s of sim
      c.tick(now);
    }
    const span = phys.buffer.length
      ? phys.buffer[phys.buffer.length - 1].t - phys.buffer[0].t
      : 0;
    expect(span).toBeLessThanOrEqual(20 + 0.5);
    expect(span).toBeGreaterThan(15); // actually filled
  });

  it("records frame performance and trims buffers in a single batch", () => {
    const c = new PreviewController({ bufferRetentionSec: 0.2 });
    c.setInstances([inst()]);
    const phys = c.refs.get("1")!;

    let now = 0;
    for (let i = 0; i < 40; i++) {
      now += 50;
      c.tick(now);
    }

    const snapshot = c.getPerfSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.instanceCount).toBe(1);
    expect(snapshot!.samples).toBeGreaterThan(0);
    expect(snapshot!.trimmedSamples).toBeGreaterThan(0);
    expect(snapshot!.coreWallMs).toBeGreaterThanOrEqual(0);
    expect(snapshot!.frameWallMs).toBeGreaterThanOrEqual(snapshot!.coreWallMs);
    expect(snapshot!.byInstance["1"].bufferLength).toBe(phys.buffer.length);

    const span = phys.buffer[phys.buffer.length - 1].t - phys.buffer[0].t;
    expect(span).toBeLessThanOrEqual(0.25);
  });

  it("fires onHealthChange only on a status-signature change, not every tick", () => {
    const c = new PreviewController({ healthThrottleMs: 0 });
    c.setInstances([inst()]);
    let changes = 0;
    c.onHealthChange = () => {
      changes++;
    };
    let now = 0;
    for (let i = 0; i < 20; i++) {
      now += 100;
      c.tick(now);
    }
    expect(changes).toBeGreaterThanOrEqual(1); // initial signature
    expect(changes).toBeLessThan(5); // gated — not ~20
  });

  it("drops cores for removed instances", () => {
    const c = new PreviewController();
    c.setInstances([inst("1"), inst("2")]);
    expect(c.refs.size).toBe(2);
    c.setInstances([inst("1")]);
    expect(c.refs.size).toBe(1);
    expect(c.refs.has("2")).toBe(false);
  });

  it("keeps the live buffer when total blood volume is adjusted", () => {
    const c = new PreviewController();
    c.setInstances([inst("1")]);

    let now = 0;
    for (let i = 0; i < 30; i++) {
      now += 50;
      c.tick(now);
    }

    const phys = c.refs.get("1")!;
    expect(phys.buffer.length).toBeGreaterThan(0);
    const beforeBuffer = phys.buffer;
    const beforeLength = beforeBuffer.length;
    const beforeLastRenderX = phys.lastRenderX;

    c.setInstanceVolume("1", 6000);

    expect(phys.buffer).toBe(beforeBuffer);
    expect(phys.buffer.length).toBe(beforeLength);
    expect(phys.lastRenderX).toBe(beforeLastRenderX);
  });

  it("rebuilds the settled core and clears live history when heartModel changes", () => {
    const c = new PreviewController({ useWorker: false });
    c.setInstances([inst("1")]);

    let now = 0;
    for (let i = 0; i < 30; i++) {
      now += 50;
      c.tick(now);
    }

    const before = c.refs.get("1")!;
    const beforeCore = before.core;
    expect(before.buffer.length).toBeGreaterThan(0);

    c.setInstances([inst("1", { ...DEFAULT_PARAMS, heartModel: "elastance" })]);

    const after = c.refs.get("1")!;
    expect(after.core).not.toBe(beforeCore);
    expect(after.core.p.heartModel).toBe("elastance");
    expect(after.buffer).toEqual([]);
    expect(after.lastRenderX).toBe(0);

    c.tick(now + 50);
    expect(after.buffer).toEqual([]);
    c.tick(now + 100);
    expect(after.buffer.length).toBeGreaterThan(0);
  });

  it("falls back to sync cores after a typed worker error response", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.latest();
      c.setInstances([inst("1")]);

      expect(typeof (c.refs.get("1")!.core as any).runFor).toBe("undefined");

      worker.emit({ type: "error", message: "boom" });

      const phys = c.refs.get("1")!;
      expect(worker.terminated).toBe(true);
      expect(typeof (phys.core as any).runFor).toBe("function");

      const t0 = phys.core.t;
      expect(() => {
        c.tick(1000);
        c.tick(1050);
      }).not.toThrow();
      expect(phys.core.t).toBeGreaterThan(t0);
    } finally {
      workerHarness.restore();
    }
  });

  it("asks the worker to reset and discard stale frames when heartModel changes", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.latest();
      c.setInstances([inst("1")]);

      const phys = c.refs.get("1")!;
      phys.buffer = [{ t: 1, phi: 1 } as any];
      phys.lastRenderX = 1;

      c.tick(1000);
      const staleTick = latestWorkerMessage(worker, "tick");

      c.setInstances([inst("1", { ...DEFAULT_PARAMS, heartModel: "elastance" })]);
      const setInstances = latestWorkerMessage(worker, "setInstances");
      const resetInstances = latestWorkerMessage(worker, "resetInstances");

      expect(resetInstances.generation).toBe(setInstances.generation);
      expect(resetInstances.ids).toEqual(["1"]);
      expect(phys.buffer).toEqual([]);
      expect(phys.lastRenderX).toBe(0);
      expect(phys.isSettling).toBe(true);

      worker.emit({
        type: "frame",
        generation: staleTick.generation,
        requestId: staleTick.requestId,
        now: staleTick.now,
        instances: [{ id: "1", t: 123, samples: [{ t: 123, phi: 123 }], settling: false }],
        perf: { coreWallMs: 1, samples: 1, instanceCount: 1, settlingCount: 0 },
      });

      expect(phys.buffer).toEqual([]);
      expect(phys.isSettling).toBe(true);
    } finally {
      workerHarness.restore();
    }
  });

  it("drops stale worker frames and settle progress after a control generation bump", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.latest();
      c.setInstances([inst("1")]);

      c.tick(1000);
      const staleTick = latestWorkerMessage(worker, "tick");
      c.resetInstances(["1"]);

      const phys = c.refs.get("1")!;
      expect(phys.buffer).toEqual([]);
      expect(phys.isSettling).toBe(true);

      worker.emit({
        type: "frame",
        generation: staleTick.generation,
        requestId: staleTick.requestId,
        now: staleTick.now,
        instances: [{ id: "1", t: 123, samples: [{ t: 123, phi: 123 }], settling: false }],
        perf: { coreWallMs: 1, samples: 1, instanceCount: 1, settlingCount: 0 },
      });
      worker.emit({
        type: "settleProgress",
        generation: staleTick.generation,
        id: "1",
        snapshot: {},
        actualSeconds: 25,
        settling: false,
      });

      expect(phys.buffer).toEqual([]);
      expect(phys.isSettling).toBe(true);

      c.tick(1100);
      const currentTick = latestWorkerMessage(worker, "tick");
      expect(currentTick.generation).toBeGreaterThan(staleTick.generation);

      worker.emit({
        type: "frame",
        generation: currentTick.generation,
        requestId: currentTick.requestId,
        now: currentTick.now,
        instances: [{ id: "1", t: 124, samples: [{ t: 124, phi: 124 }], settling: false }],
        perf: { coreWallMs: 1, samples: 1, instanceCount: 1, settlingCount: 0 },
      });

      expect(phys.buffer).toHaveLength(1);
      expect(phys.isSettling).toBe(false);
    } finally {
      workerHarness.restore();
    }
  });

  it("keeps the old display buffer while a worker transition settles, then promotes final samples", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.latest();
      c.setInstances([inst("1")]);

      const phys = c.refs.get("1")!;
      const oldSamples = [{ t: 1, phi: 1 }, { t: 1.1, phi: 1.1 }] as any[];
      phys.buffer = oldSamples;

      const next = [inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 10 })];
      c.setInstances(next, { transitionIds: ["1"] });
      const reset = latestWorkerMessage(worker, "resetInstances");

      expect(phys.buffer).toBe(oldSamples);
      expect(phys.transition?.status).toBe("settling");
      expect(phys.isSettling).toBe(true);

      worker.emit({
        type: "settleProgress",
        generation: reset.generation,
        id: "1",
        snapshot: {
          t: 2,
          p: next[0].params,
          metrics: {} as any,
          health: {} as any,
          observables: {} as any,
        },
        actualSeconds: 1,
        settling: true,
      });

      expect(phys.buffer).toBe(oldSamples);
      expect(phys.transition?.status).toBe("settling");

      const newSamples = [{ t: 2, phi: 2 }, { t: 2.1, phi: 2.1 }] as any[];
      worker.emit({
        type: "settleProgress",
        generation: reset.generation,
        id: "1",
        snapshot: {
          t: 2.1,
          p: next[0].params,
          metrics: {} as any,
          health: {} as any,
          observables: {} as any,
        },
        actualSeconds: 2,
        settling: false,
        samples: newSamples,
      });

      expect(phys.buffer).toEqual(newSamples);
      expect(phys.previousEpoch?.buffer).toEqual(oldSamples);
      expect(phys.transition?.status).toBe("promoted");
      expect(phys.isSettling).toBe(false);
    } finally {
      workerHarness.restore();
    }
  });

  it("does not cancel an active transition on a duplicate worker setInstances call", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true, transitionSteadyDebounceMs: 0 });
      const worker = workerHarness.latest();
      const next = [inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 10 })];
      c.setInstances([inst("1")]);

      const beforeCount = worker.messages.length;
      c.setInstances(next, { transitionIds: ["1"] });
      const reset = latestWorkerMessage(worker, "resetInstances");
      const afterTransitionCount = worker.messages.length;

      c.setInstances(next);

      expect(worker.messages.length).toBe(afterTransitionCount);
      expect(worker.messages.length).toBeGreaterThan(beforeCount);

      const phys = c.refs.get("1")!;
      worker.emit({
        type: "settleProgress",
        generation: reset.generation,
        id: "1",
        snapshot: {
          t: 2,
          p: next[0].params,
          metrics: {} as any,
          health: {} as any,
          observables: {} as any,
        },
        actualSeconds: 2,
        settling: false,
        samples: [{ t: 2, phi: 2 }] as any[],
      });

      expect(phys.transition?.status).toBe("promoted");
      expect(phys.buffer).toHaveLength(1);
    } finally {
      workerHarness.restore();
    }
  });

  it("expires previous transition epochs on later ticks", () => {
    const c = new PreviewController({ useWorker: false });
    c.setInstances([inst("1")]);
    const phys = c.refs.get("1")!;
    phys.buffer = [{ t: 1, phi: 1 }] as any[];

    c.setInstances([inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 5 })], { transitionIds: ["1"] });

    const transitioned = c.refs.get("1")!;
    expect(transitioned.previousEpoch).toBeDefined();
    transitioned.previousEpoch!.expiresAtMs = 0;
    c.tick(1000);

    expect(transitioned.previousEpoch).toBeUndefined();
  });

  it("resets selected instances to clean settled cores and buffers", () => {
    const c = new PreviewController();
    c.setInstances([inst("1"), inst("2")]);

    let now = 0;
    for (let i = 0; i < 30; i++) {
      now += 50;
      c.tick(now);
    }

    const before = c.refs.get("1")!;
    const untouched = c.refs.get("2")!;
    const beforeCore = before.core;
    const untouchedCore = untouched.core;

    expect(before.buffer.length).toBeGreaterThan(0);
    expect(untouched.buffer.length).toBeGreaterThan(0);

    c.setInstances([
      inst("1", { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 20 }),
      inst("2"),
    ]);
    c.resetInstances(["1"]);

    const reset = c.refs.get("1")!;
    const stillUntouched = c.refs.get("2")!;
    expect(reset.core).not.toBe(beforeCore);
    expect(reset.core.t).toBeGreaterThan(0);
    expect(reset.buffer).toEqual([]);
    expect(reset.lastRenderX).toBe(0);
    expect(stillUntouched.core).toBe(untouchedCore);
    expect(stillUntouched.buffer.length).toBeGreaterThan(0);

    c.tick(now + 50);
    expect(reset.buffer.length).toBe(0);
    c.tick(now + 100);
    expect(reset.buffer.length).toBeGreaterThan(0);
  });
});

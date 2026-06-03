import { describe, expect, it } from "vitest";
import { PreviewController } from "@/engine/previewController";
import { DEFAULT_PARAMS } from "@/constants";
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

  onmessage: ((event: MessageEvent<any>) => void) | null = null;
  onerror: (() => void) | null = null;
  readonly messages: any[] = [];
  terminated = false;

  constructor(..._args: any[]) {
    FakePreviewWorker.latest = this;
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

const withFakeWorker = () => {
  const previousWorker = (globalThis as any).Worker;
  FakePreviewWorker.latest = null;
  (globalThis as any).Worker = FakePreviewWorker;
  return {
    latest: () => {
      if (!FakePreviewWorker.latest) throw new Error("Fake worker was not constructed");
      return FakePreviewWorker.latest;
    },
    restore: () => {
      (globalThis as any).Worker = previousWorker;
    },
  };
};

const latestWorkerMessage = (worker: FakePreviewWorker, type: string) => {
  for (let i = worker.messages.length - 1; i >= 0; i--) {
    if (worker.messages[i]?.type === type) return worker.messages[i];
  }
  throw new Error(`No worker message of type ${type}`);
};

describe("PreviewController (headless driver)", () => {
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

  it("falls back to sync cores after a typed worker error response", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true });
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

  it("drops stale worker frames and settle progress after a control generation bump", () => {
    const workerHarness = withFakeWorker();
    try {
      const c = new PreviewController({ useWorker: true });
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

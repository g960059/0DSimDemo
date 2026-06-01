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
    const resetAtT = before.core.t;

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
    expect(reset.core.t).toBeCloseTo(resetAtT, 6);
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

import { describe, expect, it } from "vitest";
import {
  PV_LOOP_ACTIVE_ALPHA,
  PV_LOOP_GHOST_ALPHA,
  PV_LOOP_GHOST_DURATION_SEC,
  PV_LOOP_PENDING_ALPHA,
  buildPvLoopDrawPlan,
} from "@/components/pvLoopTransition";

describe("PV loop transition helpers", () => {
  it("draws only the current loop in the normal state", () => {
    const plan = buildPvLoopDrawPlan({ instanceLatestT: 12 });

    expect(plan.currentAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.markerAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.previousAlpha).toBe(0);
    expect(plan.showPrevious).toBe(false);
  });

  it("dims the current loop and marker while pending", () => {
    const plan = buildPvLoopDrawPlan({
      status: "pending",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 12,
    });

    expect(plan.currentAlpha).toBe(PV_LOOP_PENDING_ALPHA);
    expect(plan.markerAlpha).toBe(PV_LOOP_PENDING_ALPHA);
    expect(plan.previousAlpha).toBe(0);
    expect(plan.showPrevious).toBe(false);
  });

  it("draws the previous loop as a ghost during promoted transition", () => {
    const plan = buildPvLoopDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 14.9,
    });

    expect(plan.currentAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.markerAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.previousAlpha).toBe(PV_LOOP_GHOST_ALPHA);
    expect(plan.showPrevious).toBe(true);
  });

  it("hides the previous loop after five seconds of simulation time", () => {
    const plan = buildPvLoopDrawPlan({
      status: "promoted",
      previousEpoch: { wipeStartedAtT: 10 },
      instanceLatestT: 10 + PV_LOOP_GHOST_DURATION_SEC,
    });

    expect(plan.currentAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.markerAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.previousAlpha).toBe(0);
    expect(plan.showPrevious).toBe(false);
  });

  it("does not show a ghost when the previous epoch is missing", () => {
    const plan = buildPvLoopDrawPlan({
      status: "promoted",
      instanceLatestT: 12,
    });

    expect(plan.currentAlpha).toBe(PV_LOOP_ACTIVE_ALPHA);
    expect(plan.previousAlpha).toBe(0);
    expect(plan.showPrevious).toBe(false);
  });
});

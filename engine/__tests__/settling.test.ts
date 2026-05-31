import { describe, expect, it } from "vitest";
import { assessBeatRing, DEFAULT_SETTLE_POLICY, type BeatSummary, type SignalKey } from "@/engine/settling";
import { ModelCore } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";

function beat(b: number, overrides: Partial<Record<SignalKey, number>> = {}): BeatSummary {
  const base: Record<SignalKey, number> = {
    aopMean: 90, aopSys: 120, aopDia: 70, papMean: 15, papSys: 25, papDia: 8,
    rapMean: 4, lapMean: 8, svL: 70, svR: 68, edvL: 120, esvL: 50, edvR: 130, esvR: 60,
    lvEdp: 9, rvEdp: 5, pmsf: 10, tbv: 5600,
  };
  return { beat: b, vals: { ...base, ...overrides } };
}

describe("assessBeatRing (pure convergence logic)", () => {
  it("declares settled when consecutive beats agree, past minBeats", () => {
    const ring = Array.from({ length: 8 }, (_, i) => beat(i));
    const st = assessBeatRing(ring, 8, DEFAULT_SETTLE_POLICY);
    expect(st.settled).toBe(true);
    expect(st.reason).toBe("converged");
  });

  it("reports insufficient before minBeats", () => {
    const ring = Array.from({ length: 4 }, (_, i) => beat(i));
    expect(assessBeatRing(ring, 4, DEFAULT_SETTLE_POLICY).reason).toBe("insufficient");
  });

  it("is not settled when any tracked signal drifts above tolerance", () => {
    const ring = [...Array.from({ length: 7 }, (_, i) => beat(i)), beat(7, { svL: 70 * 1.05 })];
    const st = assessBeatRing(ring, 8, DEFAULT_SETTLE_POLICY);
    expect(st.settled).toBe(false);
    expect(st.worstSignal).toBe("svL");
  });
});

describe("ModelCore.settleToSteady", () => {
  const fresh = (p: Partial<typeof DEFAULT_PARAMS> = {}) => {
    const c = new ModelCore({ ...DEFAULT_PARAMS, ...p });
    c.initializeVenousPressuresForTargetTBV(5600);
    return c;
  };

  it("reaches the limit cycle on the default scenario, within the cap", () => {
    const c = fresh();
    const st = c.settleToSteady();
    expect(st.settled).toBe(true);
    expect(st.reason).toBe("converged");
    expect(c.isSettled()).toBe(true);
    expect(st.actualSeconds!).toBeLessThan(DEFAULT_SETTLE_POLICY.capSeconds);
  });

  it("is deterministic (same stop time across runs)", () => {
    expect(fresh().settleToSteady().actualSeconds).toBe(fresh().settleToSteady().actualSeconds);
  });

  it("never declares ongoing hemorrhage settled (forced-trend)", () => {
    const st = fresh({ bleedRate: 600 }).settleToSteady();
    expect(st.settled).toBe(false);
    expect(st.reason).toBe("forced-trend");
  });

  it("harness converge mode lands on a settled state", () => {
    const r = runScenario(DEFAULT_PARAMS, { settleMode: "converge", measureSeconds: 2 });
    expect(r.core.isSettled()).toBe(true);
  });

  it("re-arms (no longer settled) immediately after an operating-point change", () => {
    const c = fresh();
    c.settleToSteady();
    expect(c.isSettled()).toBe(true);
    c.setImmediateParameters({ HR: 100 }); // operating-point change must re-arm
    expect(c.isSettled()).toBe(false);
    // ...and re-converges to the new operating point.
    const st = c.settleToSteady();
    expect(st.settled).toBe(true);
  });
});

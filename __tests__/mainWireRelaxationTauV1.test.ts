import { describe, expect, it } from "vitest";
import { measureMainWireRelaxationTauV1 as measure, assertMainWireRelaxationTauMeasuredV1 as assertMeasured,
  assertMainWireRelaxationTraceReviewedV1 as assertReviewed } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

const events = { inletClosureTimeSec: .01, outletOpeningTimeSec: .02, outletClosureTimeSec: .1,
  inletOpeningTimeSec: .25, nextInletClosureTimeSec: .3, atrialCaptureTimeSec: .27, atrialCaptureId: "a" };
function trace(tau = .035, offset = 0, dt = .001): Sample[] {
  return Array.from({ length: Math.round(.31 / dt) + 1 }, (_, i) => {
    const t = i * dt;
    return { acceptedTimeSec: t, acceptedDtSec: dt,
      absolutePressureMmHg: { LV: t <= .1 ? 90 + offset : t <= .25 ? 90 * Math.exp(-(t - .1) / tau) + offset
        : 90 * Math.exp(-.15 / tau) + offset
          + (10 - 90 * Math.exp(-.15 / tau)) * (Math.min(t, .3) - .25) / .05 },
      valveFlowMlPerSec: { AoV: t > .02 && t < .1 ? 300 : 0, MV: t > .25 && t < .3 ? 100 : 0 } } as Sample;
  });
}
describe("method-qualified intracavitary LV relaxation tau", () => {
  it("recovers a known exponential without confusing tau with pressure half-time", () => {
    const result = measure(trace(), events);
    expect(result.status).toBe("measured");
    expect(result.weiss!.tauMs).toBeCloseTo(35, 3);
    expect(result.glantz!.tauMs).toBeCloseTo(35, 1);
    expect(result.weiss!.tauMs).not.toBeCloseTo(35 * Math.log(2), 1);
    expect(result.window!.endTimeSec).toBeLessThan(events.inletOpeningTimeSec);
    expect(result.referenceStatus).toBe("not-above-prolongation-reference");
    expect(() => assertMeasured(result)).not.toThrow();
    expect(() => assertReviewed(result)).not.toThrow();
  });
  it("does not apply the zero-asymptote threshold to the free-asymptote sensitivity result", () => {
    const zero = measure(trace(.035, 0), events), offset = measure(trace(.035, 10), events);
    expect(offset.glantz!.tauMs).toBeCloseTo(zero.glantz!.tauMs, 1);
    expect(offset.glantz!.asymptoteMmHg).toBeCloseTo(10, 1);
    expect(offset.weiss!.tauMs).toBeGreaterThan(zero.weiss!.tauMs);
    expect(measure(trace(.06), events).referenceStatus).toBe("above-reference");
  });
  it("uses elapsed time, is translation invariant and converges with refinement", () => {
    const a = measure(trace(), events), b = measure(trace(.035, 0, .0005), events);
    expect(a.weiss!.tauMs).toBeCloseTo(b.weiss!.tauMs, 3);
    const shifted = trace().map(s => ({ ...s, acceptedTimeSec: s.acceptedTimeSec + 100 }));
    const ev = Object.fromEntries(Object.entries(events).map(([k, v]) => [k, typeof v === "number" ? v + 100 : v]));
    expect(measure(shifted, ev as typeof events).weiss!.tauMs).toBeCloseTo(35, 3);
  });
  it("keeps a valid EDP+5 crossing inside the final pre-MVO accepted interval", () => {
    for (const opening of [.21, .208]) {
      const result = measure(trace(.06, 0, .01), { ...events, inletOpeningTimeSec: opening });
      expect(result.status).toBe("measured");
      expect(result.window!.endTimeSec).toBeGreaterThan(.2);
      expect(result.window!.endTimeSec).toBeLessThan(opening);
      expect(result.weiss!.tauMs).toBeCloseTo(60, 0);
    }
  });
  it("never silently changes the endpoint, admits regurgitant IVR, or ignores missing samples", () => {
    expect(measure(trace().slice(0, 270), events).status).toBe("unavailable");
    expect(measure(trace().filter((_, i) => i !== 115), events).status).toBe("unavailable");
    expect(measure(trace().map((s, i) => i !== 115 ? s : { ...s,
      valveFlowMlPerSec: { ...s.valveFlowMlPerSec, MV: -2 } }), events).issue).toBe("non-isovolumic-valve-flow");
    expect(measure(trace(.3), events).issue).toBe("EDP-plus-5-not-reached-before-mitral-opening");
    expect(measure(trace(), { ...events, outletClosureTimeSec: .12 }).issue).toBe("minimum-dpdt-not-resolved-after-aortic-closure");
  });
  it("retains a poor exponential fit as unresolved, not a normal tau", () => {
    const changed = trace().map(s => ({ ...s, absolutePressureMmHg: { ...s.absolutePressureMmHg,
      LV: s.acceptedTimeSec > .105 && s.acceptedTimeSec < .17
        ? 75 - 900 * (s.acceptedTimeSec - .105) : s.absolutePressureMmHg.LV } }));
    const result = measure(changed, events);
    expect(result.status).not.toBe("measured");
    expect(result.referenceStatus).toBe("unavailable");
  });
  it("does not let secondary fit quality veto primary usability or conceal pressure reversals", () => {
    const rippled = trace().map(s => ({ ...s, absolutePressureMmHg: { ...s.absolutePressureMmHg,
      LV: s.absolutePressureMmHg.LV + (s.acceptedTimeSec > .1 && s.acceptedTimeSec < .25
        ? .3 * Math.sin(2 * Math.PI * 160 * s.acceptedTimeSec) : 0) } }));
    const result = measure(rippled, events);
    expect(result.status).toBe("measured");
    expect(result.sensitivityStatus).toBe("poor-fit");
    expect(() => assertMeasured(result)).not.toThrow();
    expect(() => assertReviewed(result)).toThrow(/mechanistic review/);
    const clean = measure(trace(), events);
    expect(() => assertReviewed({ ...clean, relaxationTrace: { ...clean.relaxationTrace!,
      maximumRiseFromRunningMinimumMmHg: 2 } })).toThrow(/review/);
  });
  it("rejects missing or corrupt prospective tau evidence", () => {
    const r = measure(trace(), events);
    expect(() => assertMeasured(undefined)).toThrow();
    expect(() => assertMeasured({ ...r, weiss: { ...r.weiss!, tauMs: 0 } })).toThrow();
    expect(() => assertMeasured({ ...r, referenceStatus: "above-reference" })).toThrow();
    expect(() => assertMeasured({ ...r, endpointSensitivity: { shortenedWindowTauMs: 35, relativeDifference: .9 } })).toThrow();
    for (const field of ["tauMs", "asymptoteMmHg", "rSquared", "pressureRmseMmHg", "normalizedPressureRmse"]) {
      const incomplete = structuredClone(r);
      delete (incomplete.weiss as unknown as Record<string, unknown>)[field];
      expect(() => assertMeasured(incomplete)).toThrow();
    }
    for (const field of ["startTimeSec", "endTimeSec", "durationSec", "sampleCount", "nextEdpMmHg", "pressureDropMmHg", "maximumStepSec"]) {
      const incomplete = structuredClone(r);
      delete (incomplete.window as unknown as Record<string, unknown>)[field];
      expect(() => assertMeasured(incomplete)).toThrow();
    }
  });
});

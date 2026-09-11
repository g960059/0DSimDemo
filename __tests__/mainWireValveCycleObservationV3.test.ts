import { describe, expect, it } from "vitest";
import { observeMainWireValveCycleV3 as observe } from "@/analysis/methods/mainWire/MainWireValveCycleObservationV3";
import { observeMainWireBaselineV2 as legacy } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { observeMainWireHfrefCaseV3 as hfref } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV3";
import { assessMainWireHfrefDilatedRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { scoreMainWireCaseFittingResultV1 as score } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import bundle from "@/data/model-releases/standard73/bundle.json";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

// Synthetic event/pressure traces, not a physiological simulation or validation.
function fixture(reflow: "MV" | "TV" | null = null, amplitude = 2) {
  type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
  const beat = structuredClone(bundle.baseline.capture.checkpoint.payload.base.completedBeatMetrics) as Mutable<Beat>;
  const end = 6 / 7;
  beat.startTimeSec = 0; beat.endTimeSec = end; beat.durationSec = end; beat.endAtrialCaptureId = "end";
  for (const v of [beat.leftVentricularValveEventMetrics, beat.rightVentricularValveEventMetrics]) {
    v.endDiastolic!.timeSec = .1; v.endSystolic!.timeSec = .4;
  }
  beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec = .2;
  beat.valveForwardPressureGradients.PV.forwardFlowDurationSec = .2;
  const times = [...new Set([...Array.from({ length: 1001 }, (_, i) => i / 1000), end])].sort((a, b) => a - b);
  const triangle = (t: number, lo: number, center: number, hi: number) => Math.max(0, Math.min((t - lo) / (center - lo), (hi - t) / (hi - center)));
  const samples = times.map((t, i) => {
    const inlet = t < .1 ? 2 * (1 - t / .1) : 8 * triangle(t, .6, .7, .8) + 4 * triangle(t, .86, .9, .95);
    const bump = amplitude * triangle(t, .12, .14, .16);
    return { acceptedTimeSec: t, acceptedDtSec: t - (times[i - 1] ?? -.001),
      acceptedEventIdentity: { atrialCapturedActivationId: t === end ? "end" : null },
      absolutePressureMmHg: { LV: t <= .4 ? 90 : t <= .6 ? 90 * Math.exp(-(t - .4) / .05)
        : 90 * Math.exp(-4) + (10 - 90 * Math.exp(-4)) * (Math.min(t, .95) - .6) / .35 },
      valveFlowMlPerSec: { AoV: t > .2 && t < .4 ? 100 : 0, PV: t > .2 && t < .4 ? 100 : 0,
        MV: inlet + (reflow === "MV" ? bump : 0), TV: inlet + (reflow === "TV" ? bump : 0) } };
  });
  return { completedBeat: beat, samples };
}

describe("last-closure hydraulic timing with explicit local measurement availability", () => {
  it("agrees with pinned V2 when there is no reopening and leaves the beat unchanged", () => {
    const input = fixture(), before = JSON.stringify(input), old = legacy(input), result = observe(input);
    for (const side of ["left", "right"] as const) {
      expect(result[side].timing!.timing).toEqual(old[side].timing);
      expect(result[side].timing!.events).toEqual(old[side].events);
      expect(result[side].inletFlow).toEqual(old[side].inletFlow);
    }
    expect(result.reviewIssues).toEqual([]); expect(JSON.stringify(input)).toBe(before);
  });

  it.each(["MV", "TV"] as const)("reports %s reflow and measures only the final closed interval", valve => {
    const input = fixture(valve), before = JSON.stringify(input), side = valve === "MV" ? "left" : "right";
    expect(() => legacy(input)).toThrow(/recurs/);
    const result = observe(input), measured = result[side].timing!;
    expect(measured.timing.ictSec).toBeCloseTo(.04, 12);
    expect(measured.timing.teiIndex).toBeCloseTo((.04 + .2) / .2, 12);
    expect(measured.inletClosureSelection).toMatchObject({ nativeFirstClosureTimeSec: .1, selectedClosureTimeSec: .16 });
    const episode = measured.inletClosureSelection.reopeningEpisodes[0]!;
    expect(episode.forwardDurationSec).toBeCloseTo(.04, 12);
    expect(episode.forwardVolumeMl).toBeCloseTo(.04, 12); // triangular area, not peak times duration
    expect(episode.peakFlowMlPerSec).toBeCloseTo(2, 12);
    expect(result.reviewIssues).toMatchObject([{ side, code: "pre-ejection-inlet-reopening" }]);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("has no negligible-flow escape hatch and is invariant to collinear subdivision", () => {
    const input = fixture("TV", 1e-12), original = observe(input);
    expect(original.reviewIssues).toHaveLength(1);
    const samples = input.samples.flatMap((b, i) => {
      if (!i) return [b];
      const a = input.samples[i - 1]!, dt = (b.acceptedTimeSec - a.acceptedTimeSec) * .37;
      return [{ ...a, acceptedTimeSec: a.acceptedTimeSec + dt, acceptedDtSec: dt,
        acceptedEventIdentity: { atrialCapturedActivationId: null }, valveFlowMlPerSec: Object.fromEntries(
          Object.entries(a.valveFlowMlPerSec).map(([v, q]) => [v, q + .37 * (b.valveFlowMlPerSec[v as "TV"] - q)])) as typeof a.valveFlowMlPerSec },
      { ...b, acceptedDtSec: b.acceptedDtSec - dt }];
    });
    const refined = observe({ ...input, samples });
    expect(refined.right.timing!.timing.ictSec).toBeCloseTo(original.right.timing!.timing.ictSec, 12);
    expect(refined.right.timing!.inletClosureSelection.reopeningEpisodes[0]!.forwardVolumeMl)
      .toBeCloseTo(original.right.timing!.inletClosureSelection.reopeningEpisodes[0]!.forwardVolumeMl, 20);
  });

  it("retains valid left timing, E/A and tau when RV actually overlaps ejection, but never ranks that result as success", () => {
    const input = fixture(), original = hfref(input.completedBeat, input.samples);
    // Between .2 and .201, TV declines and PV rises: no sampled point has BOTH
    // positive flows, yet the piecewise-linear signals overlap. Do not miss it.
    const samples = input.samples.map(s => s.acceptedTimeSec === .2 ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, TV: 1 } } : s);
    const result = hfref(input.completedBeat, samples);
    expect(result.valves.right.timingIssue?.code).toBe("overlapping-valve-flow");
    expect(result.values.rvIctMs).toBeNull(); expect(result.values.rvTei).toBeNull();
    for (const metric of ["ictMs", "irtMs", "tei", "flowEToA", "weissTauMs", "ci", "lvef"] as const)
      expect(result.values[metric]).toEqual(original.values[metric]);
    expect(result.tau?.status).toBe("measured"); expect(result.measurementReview.status).toBe("required");
    const scoring = score({ status: "saved-result-ready", result: { rest: { referenceId: "hfref-chronic-dilated-v1",
      status: "held", observation: result, assessment: assess(result) } } } as never);
    expect(scoring.rank).toBeNull(); expect(scoring.targetsMet).toBe(false);
    expect(scoring.observations.length).toBeGreaterThan(0);
    expect(scoring.holds).toContain("measurement:right:overlapping-valve-flow");
  });

  it("keeps E/A unavailability local without requiring normal-looking waves", () => {
    const input = fixture();
    const samples = input.samples.map(s => s.acceptedTimeSec > .85 ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec,
      TV: s.acceptedTimeSec < .95 ? 1 : 0 } } : s);
    const result = observe({ ...input, samples });
    expect(result.left.inletFlow?.peakEToA).toBe(2);
    expect(result.right.inletFlow).toBeNull(); expect(result.right.inletFlowIssue?.code).toBe("unresolved-a-wave");
    expect(result.right.timing).not.toBeNull(); expect(result.reviewIssues).toEqual([]);
  });

  it("measures coincident closure/opening as zero ICT or IRT, not missing events", () => {
    const input = fixture();
    const zeroIct = { ...input, completedBeat: { ...input.completedBeat,
      rightVentricularValveEventMetrics: { ...input.completedBeat.rightVentricularValveEventMetrics,
        endDiastolic: { ...input.completedBeat.rightVentricularValveEventMetrics.endDiastolic!, timeSec: .2 } } },
    samples: input.samples.map(s => s.acceptedTimeSec < .2 ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec,
      TV: 2 * (1 - s.acceptedTimeSec / .2) } } : s) };
    const ict = observe(zeroIct);
    expect(ict.right.timing?.timing.ictSec).toBe(0); expect(ict.reviewIssues).toEqual([]);
    const samples = input.samples.map(s => s.acceptedTimeSec > .4 && s.acceptedTimeSec <= .6
      ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, TV: (s.acceptedTimeSec - .4) * 20 } } : s);
    const irt = observe({ ...input, samples });
    expect(irt.right.timing?.timing.irtSec).toBe(0); expect(irt.right.inletFlow).not.toBeNull();
    expect(irt.reviewIssues).toEqual([]);
    // A zero interval is a hydraulic observation, not an invented tau fit.
    const leftSamples = samples.map(s => ({ ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, MV: s.valveFlowMlPerSec.TV } }));
    const left = hfref(input.completedBeat, leftSamples);
    expect(left.values.irtMs).toBe(0); expect(left.tau?.status).toBe("unavailable");
    expect(left.values.weissTauMs).toBeNull();
  });

  it("rejects reverse transport in nominally isovolumic intervals without erasing the other side", () => {
    const input = fixture();
    for (const [valve, time] of [["TV", .18], ["PV", .5]] as const) {
      const samples = input.samples.map(s => s.acceptedTimeSec === time ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, [valve]: -1 } } : s);
      const result = observe({ ...input, samples });
      expect(result.right.timingIssue?.code).toBe("non-isovolumic-valve-flow");
      expect(result.left.timing).not.toBeNull(); expect(result.reviewIssues).toHaveLength(1);
    }
  });

  it("does not invent missing native closures, ejection duration or filling context", () => {
    const input = fixture();
    const missingBracket = observe({ ...input, samples: input.samples.filter(s => s.acceptedTimeSec >= .1) });
    expect(missingBracket.left.timingIssue?.code).toBe("missing-valve-landmark");
    expect(missingBracket.right.timingIssue?.code).toBe("missing-valve-landmark");
    const noRv = observe({ ...input, completedBeat: { ...input.completedBeat,
      rightVentricularValveEventMetrics: { ...input.completedBeat.rightVentricularValveEventMetrics, endDiastolic: null } } });
    expect(noRv.right.timingIssue?.code).toBe("missing-valve-landmark"); expect(noRv.left.timing).not.toBeNull();
    const short = observe({ ...input, samples: input.samples.filter(s => s.acceptedTimeSec <= 6 / 7) });
    expect(short.left.timingIssue?.code).toBe("incomplete-filling-phase");
    const wrongEt = observe({ ...input, completedBeat: { ...input.completedBeat, valveForwardPressureGradients: {
      ...input.completedBeat.valveForwardPressureGradients, PV: { ...input.completedBeat.valveForwardPressureGradients.PV, forwardFlowDurationSec: .21 } } } });
    expect(wrongEt.right.timingIssue?.code).toBe("inconsistent-ejection-duration");
    const reflow = fixture("TV");
    reflow.completedBeat.rightVentricularValveEventMetrics.endDiastolic!.timeSec = .16;
    expect(observe(reflow).right.timingIssue?.code).toBe("missing-valve-landmark");
  });

  it("does not turn malformed trace/capture or programming errors into a local physiological warning", () => {
    const input = fixture();
    expect(() => observe({ ...input, samples: input.samples.filter(s => s.acceptedTimeSec !== .3) })).toThrow(/contiguous/);
    expect(() => observe({ ...input, samples: input.samples.map(s => s.acceptedTimeSec === .3
      ? { ...s, valveFlowMlPerSec: { ...s.valveFlowMlPerSec, TV: NaN } } : s) })).toThrow(/nonfinite/);
    expect(() => observe({ ...input, completedBeat: { ...input.completedBeat, endAtrialCaptureId: "absent" } })).toThrow(/capture/);
    for (const valve of ["AoV", "PV"] as const) for (const duration of [NaN, Infinity, -1]) {
      const broken = { ...input.completedBeat, valveForwardPressureGradients: { ...input.completedBeat.valveForwardPressureGradients,
        [valve]: { ...input.completedBeat.valveForwardPressureGradients[valve], forwardFlowDurationSec: duration } } };
      expect(() => observe({ ...input, completedBeat: broken })).toThrow(/finite and nonnegative/);
      expect(() => hfref(broken, input.samples)).toThrow(/finite and nonnegative/);
    }
    expect(() => observe({ samples: null, completedBeat: input.completedBeat } as never)).toThrow();
  });
});

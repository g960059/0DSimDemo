import { describe, expect, it } from "vitest";
import standard70CheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import standard70ValidationJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { observeMainWireStandard70QualificationV2, observeMainWireStandard70TimingAndInletV2 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1,
  completeMainWireStandard70TimingAndInletTraceV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { reviewMainWireBaselineEvidenceSourceV2 } from
  "@/tools/scientific/reviewMainWireBaselineEvidenceV2";
import {
  MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
  MainWireBaselineObservationUnavailableErrorV2,
  observeMainWireBaselineV2,
  type MainWireBaselineObservationBeatV2,
  type MainWireBaselineObservationTraceSampleV2,
} from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";

describe("baseline observation V2", () => {
  it("uses one zero-flow ET for the reported timing and Tei on both sides", () => {
    const observed = observeMainWireBaselineV2(fixtureV2());
    expect(observed.methodId).toBe(MAIN_WIRE_BASELINE_OBSERVATION_V2_ID);
    for (const side of [observed.left, observed.right]) {
      expect(side.timing.ictSec).toBeCloseTo(0.1, 12);
      expect(side.timing.ejectionTimeSec).toBeCloseTo(0.3, 12);
      expect(side.timing.irtSec).toBeCloseTo(0.1, 12);
      expect(side.timing.teiIndex).toBe((side.timing.ictSec + side.timing.irtSec) / side.timing.ejectionTimeSec);
      expect(side.events).toEqual({
        inletClosureTimeSec: 0.1, outletOpeningTimeSec: 0.2,
        outletClosureTimeSec: 0.5, inletOpeningTimeSec: 0.6,
        atrialCaptureTimeSec: 1, atrialCaptureId: "atrial/end", nextInletClosureTimeSec: 1.2,
      });
    }
  });

  it("anchors A after the real capture despite a larger earlier secondary peak", () => {
    const input = fixtureV2();
    const observed = observeMainWireBaselineV2(input);
    expect(observed.left.inletFlow).toMatchObject({
      peakEMlPerSec: 8, peakAMlPerSec: 4, peakEToA: 2,
      peakETimeSec: 0.7, peakATimeSec: 1.1,
    });
    expect(observed.right.inletFlow.peakEToA).toBe(2);
    expect(input.samples.find((sample) => sample.acceptedTimeSec === 0.85)!.valveFlowMlPerSec.MV).toBe(7.6);
  });

  it("linearly interpolates zero crossings and remains invariant to uneven collinear subdivisions", () => {
    const input = fixtureV2();
    const samples = input.samples.map((sample) => ({
      ...sample,
      valveFlowMlPerSec: { ...sample.valveFlowMlPerSec,
        AoV: sample.acceptedTimeSec === 0.2 ? -20
          : sample.acceptedTimeSec === 0.3 ? 80
            : sample.acceptedTimeSec === 0.5 ? -40 : sample.valveFlowMlPerSec.AoV },
    }));
    const completedBeat = { ...input.completedBeat,
      leftVentricularValveEventMetrics: { ...input.completedBeat.leftVentricularValveEventMetrics,
        endSystolic: { ...input.completedBeat.leftVentricularValveEventMetrics.endSystolic!, timeSec: 0.48 } },
      valveForwardPressureGradients: { ...input.completedBeat.valveForwardPressureGradients,
        AoV: { ...input.completedBeat.valveForwardPressureGradients.AoV, forwardFlowDurationSec: 0.26 } },
    };
    const observed = observeMainWireBaselineV2({ samples, completedBeat });
    expect(observed.left.events.outletOpeningTimeSec).toBeCloseTo(0.22, 12);
    expect(observed.left.timing.ejectionTimeSec).toBeCloseTo(0.26, 12);
    const divided = samples.flatMap((sample, index) => {
      if (index === 0) return [sample];
      const previous = samples[index - 1]!;
      const fraction = 0.37;
      const inserted = { ...sample,
        acceptedTimeSec: previous.acceptedTimeSec + fraction * sample.acceptedDtSec,
        acceptedDtSec: fraction * sample.acceptedDtSec,
        acceptedEventIdentity: { atrialCapturedActivationId: null },
        valveFlowMlPerSec: Object.fromEntries(Object.entries(sample.valveFlowMlPerSec).map(([valve, flow]) => [
          valve, previous.valveFlowMlPerSec[valve as keyof typeof sample.valveFlowMlPerSec]
            + fraction * (flow - previous.valveFlowMlPerSec[valve as keyof typeof sample.valveFlowMlPerSec]),
        ])) as typeof sample.valveFlowMlPerSec,
      };
      return [inserted, { ...sample, acceptedDtSec: (1 - fraction) * sample.acceptedDtSec }];
    });
    const refined = observeMainWireBaselineV2({ samples: divided, completedBeat });
    expect(refined.left.timing).toEqual(observed.left.timing);
    expect(refined.left.inletFlow).toEqual(observed.left.inletFlow);
  });

  it("does not invent next-beat filling or an atrial capture from beat duration", () => {
    const input = fixtureV2();
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.filter((sample) => sample.acceptedTimeSec <= 1) }))
      .toThrow(/post-capture inlet closure/);
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.map((sample) => ({
      ...sample, acceptedEventIdentity: { atrialCapturedActivationId: null },
    })) })).toThrow(/ending capture/);
  });

  it("rejects unresolved or fused A waves instead of reporting an arbitrary ratio", () => {
    const input = fixtureV2();
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.map((sample) => ({
      ...sample, valveFlowMlPerSec: { ...sample.valveFlowMlPerSec,
        MV: sample.acceptedTimeSec === 1.1 ? 1 : sample.valveFlowMlPerSec.MV },
    })) })).toThrow(/A needs a positive interior peak/);
  });

  it("rejects hidden extra forward-flow duration and duplicate ejection episodes", () => {
    const input = fixtureV2();
    expect(() => observeMainWireBaselineV2({ ...input, completedBeat: { ...input.completedBeat,
      valveForwardPressureGradients: { ...input.completedBeat.valveForwardPressureGradients,
        AoV: { ...input.completedBeat.valveForwardPressureGradients.AoV, forwardFlowDurationSec: 0.31 } },
    } })).toThrow(/total forward-flow duration/);
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.map((sample) => ({
      ...sample, valveFlowMlPerSec: { ...sample.valveFlowMlPerSec,
        AoV: sample.acceptedTimeSec === 0.35 ? 0 : sample.valveFlowMlPerSec.AoV },
    })) })).toThrow(/one fully observed ejection/);
  });

  it("rejects omitted accepted endpoints, nonfinite inputs and absent exact closures", () => {
    const input = fixtureV2();
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.filter((sample) => sample.acceptedTimeSec !== 0.4) }))
      .toThrow(/contiguous/);
    expect(() => observeMainWireBaselineV2({ ...input, samples: input.samples.map((sample, index) => index === 0
      ? { ...sample, valveFlowMlPerSec: { ...sample.valveFlowMlPerSec, PV: NaN } } : sample) }))
      .toThrow(MainWireBaselineObservationUnavailableErrorV2);
    expect(() => observeMainWireBaselineV2({ ...input, completedBeat: { ...input.completedBeat,
      rightVentricularValveEventMetrics: { ...input.completedBeat.rightVentricularValveEventMetrics, endDiastolic: null },
    } })).toThrow(/ordered exact inlet\/outlet closures/);
  });

  it("re-observes analysis without mutating or rehashing the stored exact checkpoint", async () => {
    const qualification = qualificationFixtureV2();
    const before = JSON.stringify(qualification);
    const checkpointContentHash = await sha256CanonicalJsonHex(qualification.checkpoint);
    const observed = observeMainWireStandard70QualificationV2(qualification);
    expect(observed).not.toBe(qualification);
    expect(observed.checkpoint).toBe(qualification.checkpoint);
    expect(observed.terminalTrace).toBe(qualification.terminalTrace);
    expect(observed.checkpoint.checkpointSha256).toBe(standard70CheckpointJson.checkpointSha256);
    expect(await sha256CanonicalJsonHex(observed.checkpoint)).toBe(checkpointContentHash);
    expect(JSON.stringify(qualification)).toBe(before);
    expect(observed.measurements).not.toBe(qualification.measurements);
    expect(observed.checks).not.toBe(qualification.checks);
    expect(observed.sourceObservation.measurements).toBe(qualification.measurements);
    expect(observed.sourceObservation.checks).toBe(qualification.checks);
    expect(observed.sourceObservation.checks.map(({ status }) => status))
      .toEqual(standard70ValidationJson.checks.map(({ status }) => status));
    expect(observed.measurements.aorticValve.ejectionTimeSec)
      .toBe(observed.observation.left.timing.ejectionTimeSec);
    expect(observed.measurements.timing.teiIndex).toBe(
      (observed.measurements.timing.ictSec + observed.measurements.timing.irtSec)
      / observed.measurements.aorticValve.ejectionTimeSec,
    );
    expect(observed.measurements.leftVentricle).toBe(qualification.measurements.leftVentricle);
    expect(observed.measurements.rightVentricle).toBe(qualification.measurements.rightVentricle);
  });

  it("safely reads qualification, bare evaluation and wrapped saved evaluation evidence", async () => {
    const qualification = qualificationFixtureV2();
    const evaluation = { status: "accepted", exactResult: qualification };
    for (const [sourceKind, input] of [
      ["qualification", qualification], ["evaluation", evaluation], ["wrapped-evaluation", { evaluation }],
    ] as const) {
      const before = JSON.stringify(input);
      const review = await reviewMainWireBaselineEvidenceSourceV2(input);
      expect(review.status).toBe("reobserved");
      expect(review.sourceKind).toBe(sourceKind);
      expect(review.checkpointSha256).toBe(standard70CheckpointJson.checkpointSha256);
      expect(review.old!.checks).toBe(qualification.checks);
      expect(review.new!.checks).not.toBe(qualification.checks);
      expect(review.old!.asStoredFailedCheckIds).toEqual([]);
      expect(review.observation!.methodId).toBe(MAIN_WIRE_BASELINE_OBSERVATION_V2_ID);
      expect(JSON.stringify(input)).toBe(before);
    }
  });

  it("reports malformed, ambiguous and incomplete saved evidence as unavailable", async () => {
    const qualification = qualificationFixtureV2();
    for (const source of [
      {}, null, { evaluation: { status: "numerical-unresolved" } },
      { evaluation: { status: "accepted", exactResult: qualification }, exactResult: qualification },
      { ...qualification, terminalTrace: [] },
      { ...qualification, checks: qualification.checks.slice(1) },
      { ...qualification, checkpoint: { ...qualification.checkpoint, checkpointSha256: "0".repeat(64) } },
    ]) {
      const review = await reviewMainWireBaselineEvidenceSourceV2(source);
      expect(review.status).toBe("unavailable");
      expect(review.new).toBeNull();
      expect(review.observation).toBeNull();
    }
  });

  it("allows an explicitly observed V2 filling phase when the legacy extractor is unavailable", () => {
    const input = candidateEvidenceFixtureV2();
    const before = JSON.stringify(input);
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1(input)).toThrow(/transition/);
    let calls = 0;
    const measured = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...input,
      timingAndInletObserver: (observedInput) => {
        calls += 1;
        expect(observedInput.terminalTrace).toBe(input.terminalTrace);
        expect(observedInput.completedBeat).toBe(input.completedBeat);
        return observeMainWireStandard70TimingAndInletV2(observedInput);
      },
    });
    const expected = observeMainWireStandard70TimingAndInletV2(input);
    expect(calls).toBe(1);
    expect(measured.timing).toEqual(expected.left.timing);
    expect(measured.rightTiming).toEqual(expected.right.timing);
    expect(measured.mitralFlow).toEqual(expected.left.inletFlow);
    expect(measured.tricuspidFlow).toEqual(expected.right.inletFlow);
    expect(measured.mitralFlow.peakEMlPerSec).toBeLessThan(1);
    expect(measured.aorticValve.ejectionTimeSec).toBe(expected.left.ejectionTimeSec);
    expect(measured.pulmonaryValve.ejectionTimeSec).toBe(expected.right.ejectionTimeSec);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("uses real lookahead only for timing/inlet while keeping cycle morphology and exact pressure-rate measurements", () => {
    const full = candidateEvidenceFixtureV2();
    const terminalTrace = full.terminalTrace.slice(0, -1);
    const terminalBefore = JSON.stringify(terminalTrace);
    const window = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace,
      completedBeatEndTimeSec: full.completedBeat.endTimeSec,
      runLookaheadCycle: () => full.terminalTrace.slice(-1),
    });
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...full, terminalTrace,
      timingAndInletObserver: observeMainWireStandard70TimingAndInletV2 })).toThrow(/post-capture/);
    const measured = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...full, terminalTrace, ...window,
      timingAndInletObserver: (input) => {
        expect(input.terminalTrace).toBe(window.timingAndInletTrace);
        expect(input.completedBeat).toBe(full.completedBeat);
        return observeMainWireStandard70TimingAndInletV2(input);
      },
    });
    const observed = observeMainWireStandard70TimingAndInletV2(full);
    // The same original (truncated-for-filling) cycle plus a supplied observed
    // timing result yields identical shape, pressure and size measurements.
    const cycleOnly = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...full, terminalTrace,
      timingAndInletObserver: () => observed,
    });
    expect(measured).toEqual(cycleOnly);
    expect(JSON.stringify(terminalTrace)).toBe(terminalBefore);
    const qualification = { ...qualificationFixtureV2(), terminalTrace, ...window };
    const sourceBefore = JSON.stringify(qualification.checkpoint);
    const reobserved = observeMainWireStandard70QualificationV2(qualification);
    expect(reobserved.checkpoint).toBe(qualification.checkpoint);
    expect(reobserved.terminalTrace).toBe(terminalTrace);
    expect(JSON.stringify(reobserved.checkpoint)).toBe(sourceBefore);
    expect(reobserved.measurements.timing).toEqual(measured.timing);
    expect(reobserved.measurements.mitralFlow).toEqual(measured.mitralFlow);
  });

  it("rejects incomplete or inconsistent explicit observations without falling back or using placeholders", () => {
    const input = candidateEvidenceFixtureV2();
    const valid = observeMainWireStandard70TimingAndInletV2(input);
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...input,
      timingAndInletObserver: () => undefined as unknown as typeof valid,
    })).toThrow(/return both ventricles/);
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...input,
      timingAndInletObserver: () => ({ ...valid, left: { ...valid.left,
        inletFlow: { ...valid.left.inletFlow, peakAMlPerSec: 0 } } }),
    })).toThrow(/positive peaks/);
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...input,
      timingAndInletObserver: () => ({ ...valid, left: { ...valid.left,
        timing: { ...valid.left.timing, teiIndex: 99 } } }),
    })).toThrow(/coherent phase/);
    expect(() => measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ ...input,
      timingAndInletObserver: () => ({ ...valid, right: { ...valid.right,
        ejectionTimeSec: valid.right.ejectionTimeSec * 2,
        timing: { ...valid.right.timing, teiIndex: valid.right.timing.teiIndex / 2 } } }),
    })).toThrow(/ET differs from the exact/);
  });
});

/** Tiny positive flow peaks deliberately fall below the historical 1 ml/s
 * timing threshold; their zero-flow phases and atrial capture remain resolved. */
function candidateEvidenceFixtureV2() {
  const qualification = qualificationFixtureV2();
  const terminalTrace = qualification.terminalTrace.map((sample) => ({ ...sample,
    valveFlowMlPerSec: { ...sample.valveFlowMlPerSec, MV: sample.valveFlowMlPerSec.MV * 0.001,
      TV: sample.valveFlowMlPerSec.TV * 0.001 },
    absolutePressureMmHg: { LV: 80 + sample.valveFlowMlPerSec.AoV * 0.4,
      RV: 20 + sample.valveFlowMlPerSec.PV * 0.1, LA: 10, RA: 3, Ao: 80, PA: 20, PVein: 10 },
    chamberVolumeMl: { LA: 50, RA: 50, LV: 100, RV: 120 },
  }));
  return { terminalTrace, completedBeat: qualification.checkpoint.baseStandardCheckpointV2.completedBeatMetrics! };
}

/** Synthetic flow only: exercises the analysis wrapper against the unmodified
 * persisted checkpoint. It is not a simulation or baseline physiology claim. */
function qualificationFixtureV2(): Parameters<typeof observeMainWireStandard70QualificationV2>[0] {
  type Qualification = Parameters<typeof observeMainWireStandard70QualificationV2>[0];
  const checkpoint = standard70CheckpointJson as unknown as Qualification["checkpoint"];
  const beat = checkpoint.baseStandardCheckpointV2.completedBeatMetrics!;
  const start = Math.max(beat.leftVentricularValveEventMetrics.endDiastolic!.timeSec,
    beat.rightVentricularValveEventMetrics.endDiastolic!.timeSec) + 0.01;
  const end = beat.endTimeSec + 0.1;
  type Knots = readonly (readonly [number, number])[];
  const outlet = (closure: number, duration: number): Knots => [
    [start, 0], [closure - duration, 0], [closure - duration / 2, 100], [closure, 0], [end, 0],
  ];
  const inlet = (closure: number): Knots => [
    [start, 0], [closure + 0.08, 0], [closure + 0.16, 8],
    [beat.endTimeSec - 0.1, 2], [beat.endTimeSec, 2], [beat.endTimeSec + 0.05, 4], [end, 0],
  ];
  const knots = {
    AoV: outlet(beat.leftVentricularValveEventMetrics.endSystolic!.timeSec,
      beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec),
    PV: outlet(beat.rightVentricularValveEventMetrics.endSystolic!.timeSec,
      beat.valveForwardPressureGradients.PV.forwardFlowDurationSec),
    MV: inlet(beat.leftVentricularValveEventMetrics.endSystolic!.timeSec),
    TV: inlet(beat.rightVentricularValveEventMetrics.endSystolic!.timeSec),
  };
  const times = [...new Set(Object.values(knots).flatMap((points) => points.map(([time]) => time)))].sort((a, b) => a - b);
  const interpolate = (points: Knots, time: number) => {
    const exact = points.find(([at]) => at === time);
    if (exact !== undefined) return exact[1];
    const upper = points.findIndex(([at]) => at > time);
    const [leftTime, leftFlow] = points[upper - 1]!;
    const [rightTime, rightFlow] = points[upper]!;
    return leftFlow + (rightFlow - leftFlow) * (time - leftTime) / (rightTime - leftTime);
  };
  const samples: MainWireBaselineObservationTraceSampleV2[] = times.map((time, index) => ({
    acceptedTimeSec: time,
    acceptedDtSec: time - (times[index - 1] ?? start - 0.002),
    valveFlowMlPerSec: Object.fromEntries(Object.entries(knots).map(([valve, points]) =>
      [valve, interpolate(points, time)])) as MainWireBaselineObservationTraceSampleV2["valveFlowMlPerSec"],
    acceptedEventIdentity: { atrialCapturedActivationId: time === beat.endTimeSec ? beat.endAtrialCaptureId : null },
  }));
  return {
    ...standard70ValidationJson,
    checkpoint,
    classification: { status: "period1-converged" } as Qualification["classification"],
    measurements: standard70ValidationJson.measurements as Qualification["measurements"],
    checks: standard70ValidationJson.checks as Qualification["checks"],
    terminalTrace: samples as unknown as Qualification["terminalTrace"],
  } as Qualification;
}

function fixtureV2(): {
  samples: MainWireBaselineObservationTraceSampleV2[];
  completedBeat: MainWireBaselineObservationBeatV2;
} {
  const points = [
    [0.15, 0, 0], [0.2, 0, 0], [0.3, 100, 0], [0.35, 130, 0], [0.4, 160, 0],
    [0.5, 0, 0], [0.55, 0, 0], [0.6, 0, 0], [0.7, 0, 8], [0.8, 0, 2],
    [0.85, 0, 7.6], [0.9, 0, 3], [1, 0, 2], [1.1, 0, 4], [1.2, 0, 0],
  ] as const;
  const samples = points.map(([time, outflow, inflow], index) => ({
    acceptedTimeSec: time,
    acceptedDtSec: time - (points[index - 1]?.[0] ?? 0.1),
    valveFlowMlPerSec: { MV: inflow, AoV: outflow, TV: inflow * 2, PV: outflow * 2 },
    acceptedEventIdentity: { atrialCapturedActivationId: time === 1 ? "atrial/end" : null },
  }));
  const closure = (valveId: "MV" | "AoV" | "TV" | "PV", timeSec: number) => ({
    event: "valve-closure-zero-flow-crossing" as const,
    valveId, timeSec, volumeMl: 100, absolutePressureMmHg: 10, transmuralPressureMmHg: 10,
  });
  const gradient = {
    basis: "upstream-minus-downstream-absolute-pressure-during-forward-flow" as const,
    forwardFlowDurationSec: 0.3, timeWeightedMeanMmHg: 2, peakMmHg: 4,
  };
  return { samples, completedBeat: {
    startTimeSec: 0, endTimeSec: 1, durationSec: 1, endAtrialCaptureId: "atrial/end",
    leftVentricularValveEventMetrics: { inletValveId: "MV", semilunarValveId: "AoV",
      endDiastolic: closure("MV", 0.1), endSystolic: closure("AoV", 0.5) },
    rightVentricularValveEventMetrics: { inletValveId: "TV", semilunarValveId: "PV",
      endDiastolic: closure("TV", 0.1), endSystolic: closure("PV", 0.5) },
    valveForwardPressureGradients: { AoV: gradient, PV: gradient },
  } };
}

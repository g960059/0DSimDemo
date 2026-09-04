import { describe, expect, it } from "vitest";
import { auditMainWireEjectionCouplingV1, MainWireEjectionCouplingUnavailableErrorV1,
  type MainWireEjectionCouplingBeatV1, type MainWireEjectionCouplingTraceSampleV1 } from
  "@/analysis/methods/mainWire/MainWireEjectionCouplingAuditV1";

describe("research-only ejection pressure-flow coupling audit V1", () => {
  it("uses actual accepted times and distinguishes flow, velocity and both pressure bases", () => {
    const input = fixtureV1(), before = JSON.stringify(input);
    const result = auditMainWireEjectionCouplingV1(input);
    expect(result.ejection.durationSec).toBeCloseTo(0.8, 12);
    expect(result.flow.peak).toMatchObject({ value: 150, timeSec: 0.2, timeFromOpeningSec: 0.1 });
    expect(result.flow.peak.ejectionPhase01).toBeCloseTo(0.125, 12);
    expect(result.velocity.status).toBe("available");
    expect(result.velocity.peak).toMatchObject({ value: 3, timeSec: 0.625, timeFromOpeningSec: 0.525 });
    expect(result.pressure.peaks.lvAbsolute.timeSec).toBe(0.45);
    expect(result.pressure.peaks.lvTransmural.timeSec).toBe(0.3);
    expect(result.pressure.lvAbsolutePeakMinusFlowPeakSec).toBe(0.25);
    expect(result.centralAorticPressure).toMatchObject({ maximumMmHg: 145, minimumMmHg: 70, pulseMmHg: 75 });
    expect(result.alignedSamples[0]).toMatchObject({ sourceSampleIndex: 2, timeSec: 0.2,
      aorticFlowMlPerSec: 150, jetVelocityMPerSec: 1, signedLvAoGradientMmHg: 10 });
    expect(JSON.stringify(input)).toBe(before);
  });

  it("preserves signed adverse gradient and makes late local sag distinct from the full chord", () => {
    const result = auditMainWireEjectionCouplingV1(fixtureV1());
    expect(result.gradient.minimumMmHg).toBeLessThan(0);
    expect(result.gradient.adverseGradientDurationSec).toBeGreaterThan(0);
    expect(result.gradient.adverseGradientDurationSec).toBeLessThan(result.ejection.durationSec);
    expect(result.pvRoof.transmural.full!.midpointResidualMmHg).toBeGreaterThan(0);
    expect(result.pvRoof.transmural.late).toMatchObject({
      fromExpelledVolumeFraction01: 0.6, toExpelledVolumeFraction01: 0.85 });
    expect(result.pvRoof.transmural.late!.midpointResidualMmHg).toBeCloseTo(-2, 12);
    expect(result.pvRoof.absolute.late!.midpointResidualMmHg).toBeCloseTo(1, 12);
    // Transmural pressure must never be subtracted from absolute central Ao.
    const at = result.alignedSamples.find((sample) => sample.timeSec === 0.625)!;
    expect(at.signedLvAoGradientMmHg).toBe(-10);
    expect(at.lvTransmuralMmHg - at.aoAbsoluteMmHg).toBe(-23);
  });

  it("does not replace missing/zero area with flow, anatomical area or an inferred velocity", () => {
    const input = fixtureV1();
    for (const aorticEffectiveAreaCm2 of [undefined, null, 0, NaN]) {
      const result = auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample) => ({
        ...sample, aorticEffectiveAreaCm2,
      })) });
      expect(result.flow.peak.value).toBe(150);
      expect(result.velocity.status).toBe("unavailable");
      expect(result.velocity.peak).toBeNull();
      expect(result.alignedSamples.every((sample) => sample.jetVelocityMPerSec === null)).toBe(true);
    }
    const partial = auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample, index) => index === 6
      ? { ...sample, aorticEffectiveAreaCm2: null } : sample) });
    expect(partial.velocity.status).toBe("unavailable");
    expect(partial.velocity.peak).toBeNull();
  });

  it("does not invent adverse forward-flow gradient from zero-flow endpoint pressure", () => {
    const input = fixtureV1();
    const samples = input.samples.map((sample) => ({ ...sample,
      absolutePressureMmHg: { LV: sample.valveFlowMlPerSec.AoV > 0 ? 110 : 70, Ao: 100 } }));
    const result = auditMainWireEjectionCouplingV1({ ...input, samples });
    expect(result.ejection.opening.lvAbsoluteMmHg - result.ejection.opening.aoAbsoluteMmHg).toBe(-30);
    expect(result.gradient.minimumMmHg).toBe(10);
    expect(result.gradient.maximumMmHg).toBe(10);
    expect(result.gradient.timeWeightedMeanMmHg).toBeCloseTo(10, 12);
    expect(result.gradient.adverseGradientDurationSec).toBe(0);
    expect(result.gradient.coveredDurationSec).toBeCloseTo(0.65, 12);
    expect(result.gradient.coverageFractionOfEjection).toBeCloseTo(0.65 / 0.8, 12);
  });

  it("time-weights gradient with actual nonuniform timestamps rather than sample count", () => {
    const input = fixtureV1();
    const result = auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample) => ({ ...sample,
      absolutePressureMmHg: { LV: 100 + 20 * sample.acceptedTimeSec, Ao: 100 } })) });
    // Linear gradient from 4 to17 over observed positive-flow times .2–.85.
    expect(result.gradient.timeWeightedMeanMmHg).toBeCloseTo(10.5, 12);
    const unweighted = result.alignedSamples.reduce((sum, sample) => sum + sample.signedLvAoGradientMmHg, 0)
      / result.alignedSamples.length;
    expect(unweighted).not.toBeCloseTo(result.gradient.timeWeightedMeanMmHg!, 6);
  });

  it("selects the intended exact beat among multiple observed cycles without stitching their ejections", () => {
    const input = fixtureV1();
    const samples = [-1, 0, 1].flatMap((shift) => input.samples.map((sample) => ({ ...sample,
      acceptedTimeSec: sample.acceptedTimeSec + shift })))
      .map((sample, index, all) => ({ ...sample,
        acceptedDtSec: index === 0 ? 0.05 : sample.acceptedTimeSec - all[index - 1]!.acceptedTimeSec }));
    const result = auditMainWireEjectionCouplingV1({ ...input, samples });
    expect(result.flow.peak.timeSec).toBe(0.2);
    expect(result.flow.peak.sourceSampleIndex).toBe(input.samples.length + 2);
    expect(result.ejection.forwardSampleCount).toBe(8);
    expect(() => auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample) =>
      sample.acceptedTimeSec === 0.55 ? { ...sample, valveFlowMlPerSec: { AoV: 0 } } : sample) }))
      .toThrow(/one fully bracketed/);
    expect(() => auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.slice(2) }))
      .toThrow(/one fully bracketed/);
  });

  it("reports sampled vs interpolated zero-flow endpoints without treating first positive sample as opening", () => {
    const input = fixtureV1();
    expect(auditMainWireEjectionCouplingV1(input).ejection.opening.basis).toBe("accepted-sample-flow-zero");
    const rows = [[0.1, -10, 140], [0.3, 10, 130], [0.6, 10, 100], [0.8, -10, 90]] as const;
    const samples = rows.map(([time, flow, volume], index) => ({ ...input.samples[0]!, acceptedTimeSec: time,
      acceptedDtSec: time - (rows[index - 1]?.[0] ?? 0), chamberVolumeMl: { LV: volume },
      valveFlowMlPerSec: { AoV: flow } }));
    const completedBeat = { ...input.completedBeat,
      leftVentricularValveEventMetrics: { ...input.completedBeat.leftVentricularValveEventMetrics,
        endSystolic: { ...input.completedBeat.leftVentricularValveEventMetrics.endSystolic!, timeSec: 0.7 } },
      valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: 0.5 } } };
    const result = auditMainWireEjectionCouplingV1({ samples, completedBeat });
    expect(result.ejection.opening).toMatchObject({ basis: "linearly-interpolated-flow-zero",
      timeSec: 0.2, bracketStartTimeSec: 0.1, bracketEndTimeSec: 0.3, volumeMl: 135 });
    expect(result.ejection.closure.timeSec).toBeCloseTo(0.7, 12);
    expect(result.flow.peak.timeSec).toBe(0.3); // Earliest equal accepted maximum.
    expect(result.flow.peak.timeFromOpeningSec).toBeCloseTo(0.1, 12);
  });

  it("rejects noncontiguous clocks, nonfinite channels and mismatched completed-beat duration", () => {
    const input = fixtureV1();
    expect(() => auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.filter((_, index) => index !== 4) }))
      .toThrow(/contiguous/);
    expect(() => auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample, index) => index === 2
      ? { ...sample, absolutePressureMmHg: { ...sample.absolutePressureMmHg, LV: NaN } } : sample) }))
      .toThrow(MainWireEjectionCouplingUnavailableErrorV1);
    expect(() => auditMainWireEjectionCouplingV1({ ...input, completedBeat: { ...input.completedBeat,
      valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: 0.9 } } } }))
      .toThrow(/total forward-flow duration/);
  });

  it("retains near-zero positive flow and makes a non-single-valued volume roof unavailable", () => {
    const input = fixtureV1();
    const result = auditMainWireEjectionCouplingV1(input);
    expect(result.alignedSamples.at(-1)!.aorticFlowMlPerSec).toBe(1e-15);
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
    const nonmonotone = auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample, index) => index === 6
      ? { ...sample, chamberVolumeMl: { LV: 135 } } : sample) });
    expect(nonmonotone.pvRoof.absolute).toMatchObject({ status: "unavailable",
      issue: "nonmonotone-ejection-volume-no-single-valued-roof", late: null });
    expect(nonmonotone.flow.peak.value).toBe(150);
    // Finite-precision volume can already equal closure volume while tiny Q
    // remains. The chord must still use the exact closure, not that earlier P.
    const flatEndpoint = auditMainWireEjectionCouplingV1({ ...input, samples: input.samples.map((sample) =>
      sample.acceptedTimeSec === 0.85 ? { ...sample, chamberVolumeMl: { LV: 70 } } : sample) });
    expect(flatEndpoint.pvRoof.absolute.full!.endPressureMmHg).toBe(flatEndpoint.ejection.closure.lvAbsoluteMmHg);
  });
});

function fixtureV1(): { samples: MainWireEjectionCouplingTraceSampleV1[]; completedBeat: MainWireEjectionCouplingBeatV1 } {
  // time, expelled-volume fraction, Q, effective area, transmural LV, absolute LV, absolute Ao.
  const rows = [
    [0.05, 0, 0, 1, 75, 85, 85], [0.1, 0, 0, 1, 80, 90, 85],
    [0.2, 0.1, 150, 1.5, 100, 110, 100], [0.3, 0.3, 130, 1.3, 115, 125, 110],
    [0.45, 0.5, 120, 1.2, 110, 150, 140], [0.55, 0.6, 100, 1, 100, 110, 115],
    [0.625, 0.725, 90, 0.3, 97, 110, 120], [0.65, 0.75, 80, 1, 97.2, 107.2, 119],
    [0.725, 0.85, 50, 1, 98, 108, 115], [0.85, 0.95, 1e-15, 1, 95, 105, 108],
    [0.9, 1, 0, 1, 90, 100, 105], [0.95, 1, 0, 1, 85, 95, 104],
  ] as const;
  const samples = rows.map(([time, x, flow, area, transmural, absolute, ao], index) => ({
    acceptedTimeSec: time, acceptedDtSec: time - (rows[index - 1]?.[0] ?? 0),
    chamberVolumeMl: { LV: 140 - 70 * x }, absolutePressureMmHg: { LV: absolute, Ao: ao },
    transmuralPressureMmHg: { LV: transmural }, valveFlowMlPerSec: { AoV: flow }, aorticEffectiveAreaCm2: area,
  }));
  const closure = (valveId: "MV" | "AoV", timeSec: number) => ({ valveId, timeSec,
    event: "valve-closure-zero-flow-crossing" as const, volumeMl: 140, absolutePressureMmHg: 90, transmuralPressureMmHg: 80 });
  return { samples, completedBeat: { startTimeSec: 0, endTimeSec: 1, durationSec: 1,
    leftVentricularValveEventMetrics: { inletValveId: "MV", semilunarValveId: "AoV",
      endDiastolic: closure("MV", 0.04), endSystolic: closure("AoV", 0.9) },
    valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: 0.8 } },
    pressureSummaries: { Ao: { maximumMmHg: 145, minimumMmHg: 70, pulseMmHg: 75 } } } };
}

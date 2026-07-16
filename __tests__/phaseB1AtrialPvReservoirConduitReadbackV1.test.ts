import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1AtrialPvReservoirConduitReadbackV1,
  validatePhaseB1AtrialPvReservoirConduitReadbackV1,
  type PhaseB1AtrialPvReadbackSampleV1,
  type PhaseB1AtrialPvReadbackTraceV1,
} from "@/tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1";

describe("Phase B1 held-out atrial reservoir/conduit PV readback", () => {
  it("selects the unique largest integrated AV-flow lobe and measures positive reservoir-minus-conduit separation", () => {
    const result = build(defaultTrace(1), true);

    for (const atrium of ["LA", "RA"] as const) {
      const readback = result.byAtrium[atrium];
      expect(readback.status).toBe("resolved");
      expect(readback.functionalValveLobe).toMatchObject({
        status: "resolved",
        positiveLobeCount: 2,
        wrapsCycleBoundary: false,
      });
      expect(readback.functionalValveLobe.opening?.phaseSec).toBeCloseTo(0.4, 15);
      expect(readback.functionalValveLobe.closure?.phaseSec).toBeCloseTo(0.8, 15);
      expect(readback.functionalValveLobe.selectedIntegratedPositiveVolumeM3)
        .toBeGreaterThan(
          readback.functionalValveLobe.nextLargestIntegratedPositiveVolumeM3!,
        );
      expect(readback.exactInterpolatedValveBoundaryEndpointsPreserved)
        .toBe(true);
      expect(readback.reservoirBranch).toMatchObject({
        status: "resolved",
        expectedVolumeDirection: "increasing",
        strictlyMonotone: true,
      });
      expect(readback.conduitBranch).toMatchObject({
        status: "resolved",
        expectedVolumeDirection: "decreasing",
        strictlyMonotone: true,
      });
      expect(readback.conduitBranch.points[0])
        .toEqual(readback.functionalValveLobe.opening?.endpoint);
      expect(readback.matchedVolume?.gridPointCount).toBe(101);
      expect(readback.matchedVolume?.overlapWidthM3).toBeCloseTo(20e-6, 15);
      expect(readback.matchedVolume?.meanReservoirMinusConduitPressurePa)
        .toBeCloseTo(100, 10);
      expect(readback.matchedVolume?.minimumReservoirMinusConduitPressurePa)
        .toBeCloseTo(0, 10);
      expect(readback.matchedVolume?.maximumReservoirMinusConduitPressurePa)
        .toBeCloseTo(200, 10);
      expect(readback.matchedVolume?.positiveGridPointFraction)
        .toBeCloseTo(100 / 101, 15);
      expect(readback.matchedVolume
        ?.trapezoidalIntegralReservoirMinusConduitPressurePaM3)
        .toBeCloseTo(0.002, 12);
      expect(readback.wholeCyclePv.volumeRangeM3.width).toBeGreaterThan(0);
      expect(readback.wholeCyclePv.pressureRangePa.width).toBeGreaterThan(0);
      expect(Number.isFinite(readback.wholeCyclePv.signedShoelaceAreaPaM3))
        .toBe(true);
    }

    expect(result.periodicity).toMatchObject({
      formalPeriodOneConvergencePass: true,
      gateEligible: true,
      classification: "formal-period-one-held-out-readback",
    });
    expect(result.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      heldOutReadback: true,
      candidateSelectionPerformed: false,
      parameterFittingPerformed: false,
      physiologicalValidationEstablished: false,
      unresolvedOrAmbiguousBranchesAreNotForced: true,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.byAtrium.LA.matchedVolume?.grid)).toBe(true);
  });

  it("reports an inverted held-out pressure separation without turning its sign into a gate", () => {
    const result = build(defaultTrace(-1), false);
    const readback = result.byAtrium.LA;

    expect(readback.status).toBe("resolved");
    expect(readback.matchedVolume?.meanReservoirMinusConduitPressurePa)
      .toBeCloseTo(-100, 10);
    expect(readback.matchedVolume?.maximumReservoirMinusConduitPressurePa)
      .toBeCloseTo(0, 10);
    expect(readback.matchedVolume?.positiveGridPointFraction).toBe(0);
    expect(result.periodicity).toMatchObject({
      formalPeriodOneConvergencePass: false,
      gateEligible: false,
      classification: "nonperiodic-exploratory-readback",
      diagnosticComputedRegardlessOfGateEligibility: true,
    });
    expect(result.claimBoundary.pressureDifferenceSignUsedAsPassFailGate)
      .toBe(false);
  });

  it("reports an ambiguous/non-overlap readback instead of forcing a matched-volume branch", () => {
    const trace = defaultTrace(1);
    const replacementMlByPhase = new Map([
      [0.5, 80],
      [0.6, 75],
      [0.7, 85],
    ]);
    const samples = trace.samples.map((sample) => {
      const replacementMl = replacementMlByPhase.get(sample.phaseSec);
      return replacementMl === undefined
        ? sample
        : withAtrialVolume(
          sample,
          replacementMl * 1e-6,
          (replacementMl + 5) * 1e-6,
        );
    });
    const result = build({ ...trace, samples }, false);

    for (const atrium of ["LA", "RA"] as const) {
      const readback = result.byAtrium[atrium];
      expect(readback.status).toBe("ambiguous");
      expect(readback.reasons)
        .toContain("conduit-branch-is-not-strictly-decreasing");
      expect(readback.reasons)
        .toContain("reservoir-conduit-common-volume-overlap-is-empty");
      expect(readback.conduitBranch.strictlyMonotone).toBe(false);
      expect(readback.matchedVolume).toBeNull();
    }
  });

  it("resolves a valve lobe that wraps the duplicated cycle endpoint", () => {
    const result = build(wrappingTrace(), true);
    const readback = result.byAtrium.LA;

    expect(readback.status).toBe("resolved");
    expect(readback.functionalValveLobe).toMatchObject({
      status: "resolved",
      positiveLobeCount: 1,
      wrapsCycleBoundary: true,
    });
    expect(readback.functionalValveLobe.opening?.phaseSec).toBeCloseTo(0.7, 15);
    expect(readback.functionalValveLobe.closure?.phaseSec).toBeCloseTo(0.2, 15);
    expect(readback.conduitBranch.startPhaseSec).toBeCloseTo(0.7, 15);
    expect(readback.conduitBranch.endPhaseSec).toBeCloseTo(1, 15);
    expect(readback.matchedVolume?.grid).toHaveLength(101);
  });

  it("accepts one duplicated phase endpoint without double-counting it as a valve lobe", () => {
    const trace = defaultTrace(1);
    expect(trace.samples[0]).toMatchObject({ phaseSec: 0 });
    expect(trace.samples.at(-1)).toMatchObject({ phaseSec: 1 });
    expect(trace.samples.at(-1)?.bloodVolumesM3)
      .toEqual(trace.samples[0].bloodVolumesM3);
    expect(trace.samples.at(-1)?.allFlowsM3PerSec)
      .toEqual(trace.samples[0].allFlowsM3PerSec);

    const readback = build(trace, true).byAtrium.LA;
    expect(readback.functionalValveLobe.positiveLobeCount).toBe(2);
    expect(readback.functionalValveLobe.opening?.phaseSec).toBeCloseTo(0.4, 15);
    expect(readback.functionalValveLobe.closure?.phaseSec).toBeCloseTo(0.8, 15);
  });

  it("strictly validates trace inventory, finiteness, phase coverage, and canonical hash integrity", () => {
    const trace = defaultTrace(1);
    const report = build(trace, true);
    expect(validatePhaseB1AtrialPvReservoirConduitReadbackV1(report, sha256))
      .toBe(report);

    expect(() => build({
      ...trace,
      samples: trace.samples.slice(0, -1),
    }, false)).toThrow(/duplicated cycle endpoint/i);
    expect(() => build({
      ...trace,
      samples: trace.samples.map((sample, index) => index === 3
        ? {
          ...sample,
          pressuresPa: { ...sample.pressuresPa, LA: Number.NaN },
        }
        : sample),
    }, false)).toThrow(/must be finite/i);
    expect(() => build({
      ...trace,
      samples: trace.samples.map((sample, index) => index === 3
        ? { ...sample, undeclared: true }
        : sample) as never,
    }, false)).toThrow(/must contain exactly/i);

    const reconstructed = JSON.parse(JSON.stringify(report));
    reconstructed.contentSha256 = "0".repeat(64);
    expect(() => validatePhaseB1AtrialPvReservoirConduitReadbackV1(
      reconstructed,
      sha256,
    )).toThrow(/contentSha256/i);
  });
});

function build(trace: PhaseB1AtrialPvReadbackTraceV1, periodOne: boolean) {
  return buildPhaseB1AtrialPvReservoirConduitReadbackV1({
    trace,
    formalPeriodOneConvergencePass: periodOne,
    sha256Hex: sha256,
  });
}

function defaultTrace(separationSign: 1 | -1): PhaseB1AtrialPvReadbackTraceV1 {
  const phases = Array.from({ length: 11 }, (_, index) => index / 10);
  const laVolumesMl = [50, 55, 60, 65, 70, 60, 50, 55, 40, 45, 50];
  const flows = [
    -1e-3,
    1e-4,
    -1e-3,
    -1e-3,
    0,
    1e-3,
    2e-3,
    1e-3,
    0,
    -1e-3,
    -1e-3,
  ];
  return {
    cycleLengthSec: 1,
    samples: phases.map((phaseSec, index) => {
      const laVolumeM3 = laVolumesMl[index] * 1e-6;
      const raVolumeM3 = laVolumeM3 + 5e-6;
      const onReservoir = phaseSec <= 0.4 || phaseSec >= 0.8;
      const laSeparationPa = onReservoir
        ? separationSign * 1e7 * (70e-6 - laVolumeM3)
        : 0;
      const raSeparationPa = onReservoir
        ? separationSign * 1e7 * (75e-6 - raVolumeM3)
        : 0;
      return sample(
        phaseSec,
        laVolumeM3,
        raVolumeM3,
        8_000 + 1e7 * laVolumeM3 + laSeparationPa,
        7_000 + 1e7 * raVolumeM3 + raSeparationPa,
        flows[index],
        flows[index],
      );
    }),
  };
}

function wrappingTrace(): PhaseB1AtrialPvReadbackTraceV1 {
  const phases = Array.from({ length: 11 }, (_, index) => index / 10);
  const laVolumesMl = [45, 55, 40, 45, 50, 55, 60, 70, 60, 50, 45];
  const flows = [1e-3, 1e-3, 0, -1e-3, -1e-3, -1e-3, -1e-3, 0, 1e-3, 1e-3, 1e-3];
  return {
    cycleLengthSec: 1,
    samples: phases.map((phaseSec, index) => {
      const laVolumeM3 = laVolumesMl[index] * 1e-6;
      const raVolumeM3 = laVolumeM3 + 5e-6;
      const onReservoir = phaseSec >= 0.2 && phaseSec <= 0.7;
      const separationPa = onReservoir ? 1e7 * (70e-6 - laVolumeM3) : 0;
      return sample(
        phaseSec,
        laVolumeM3,
        raVolumeM3,
        8_000 + 1e7 * laVolumeM3 + separationPa,
        7_000 + 1e7 * raVolumeM3 + separationPa,
        flows[index],
        flows[index],
      );
    }),
  };
}

function sample(
  phaseSec: number,
  laVolumeM3: number,
  raVolumeM3: number,
  laPressurePa: number,
  raPressurePa: number,
  qMv: number,
  qTv: number,
): PhaseB1AtrialPvReadbackSampleV1 {
  return {
    phaseSec,
    bloodVolumesM3: { LA: laVolumeM3, RA: raVolumeM3 },
    pressuresPa: { LA: laPressurePa, RA: raPressurePa },
    allFlowsM3PerSec: { Q_MV: qMv, Q_TV: qTv },
  };
}

function withAtrialVolume(
  sampleValue: PhaseB1AtrialPvReadbackSampleV1,
  laVolumeM3: number,
  raVolumeM3: number,
): PhaseB1AtrialPvReadbackSampleV1 {
  return {
    ...sampleValue,
    bloodVolumesM3: { LA: laVolumeM3, RA: raVolumeM3 },
    pressuresPa: {
      LA: 8_000 + 1e7 * laVolumeM3,
      RA: 7_000 + 1e7 * raVolumeM3,
    },
  };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

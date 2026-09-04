import { describe, expect, it } from "vitest";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  evaluateMainWireBaselinePressureRateQualityV1,
  assertMainWireBaselinePressureRateQualityV1,
  MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID,
  type MainWireBaselinePressureRateQualificationV1,
} from "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";

type InputV1 = Parameters<typeof evaluateMainWireBaselinePressureRateQualityV1>[0];
const ratesV1 = [0, 60, 100, 60, 0, -60, -100, -60, 0];

describe("baseline pressure-rate numerical quality V1", () => {
  it("reports four supported extrema without claiming normality, accuracy or convergence", () => {
    const input = fixtureV1(50, 50);
    const before = JSON.stringify(input);
    const report = evaluateMainWireBaselinePressureRateQualityV1(input);
    expect(report.status).toBe("passed");
    expect(report.methodId).toBe(MAIN_WIRE_BASELINE_PRESSURE_RATE_QUALITY_V1_ID);
    expect(report.policy).toMatchObject({
      maximumTwoGridRelativeDifference: 0.05, minimumAdjacentSameSignMagnitudeFraction: 0.5,
      comparison: "two-grid-consistency-not-convergence-order-or-accuracy-proof",
      physiologicalNormalityClaimed: false, fullBeatTraceCompletenessClaimed: false,
    });
    expect(report.checks).toHaveLength(4);
    expect(report.checks[0]!.coarse).toMatchObject({
      reportedMmHgPerSec: 5_000, observedMmHgPerSec: 5_000,
      peakStartTimeSec: 0.25, peakEndTimeSec: 0.375,
      previousSameSignFraction: 0.6, nextSameSignFraction: 0.6,
    });
    expect(report.checks[0]!.coarse.peakPhase01).toBe(0.3125 / 1.125);
    expect(report.checks.map(({ relativeDifference }) => relativeDifference)).toEqual([0, 0, 0, 0]);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    expect(() => assertMainWireBaselinePressureRateQualityV1(JSON.parse(JSON.stringify(report)))).not.toThrow();
    expect(JSON.stringify(input)).toBe(before);
  });

  it("applies the explicit inclusive 5% two-grid sensitivity budget", () => {
    expect(evaluateMainWireBaselinePressureRateQualityV1(fixtureV1(0.95, 1)).status).toBe("passed");
    const report = evaluateMainWireBaselinePressureRateQualityV1(fixtureV1(0.949, 1));
    expect(report.status).toBe("failed");
    expect(report.checks[0]!.relativeDifference).toBeCloseTo(0.051, 12);
    expect(report.checks[0]!.coarse.status).toBe("passed");
    expect(report.checks[0]!.fine.status).toBe("passed");
  });

  it("uses actual elapsed time on clipped accepted segments, not nominal dt", () => {
    const input = fixtureV1();
    const samples = input.coarse.qualification.terminalTrace;
    const left = samples[2]!, right = samples[3]!;
    const inserted = { acceptedTimeSec: (left.acceptedTimeSec + right.acceptedTimeSec) / 2,
      acceptedDtSec: right.acceptedDtSec / 2,
      absolutePressureMmHg: { LV: (left.absolutePressureMmHg.LV + right.absolutePressureMmHg.LV) / 2,
        RV: (left.absolutePressureMmHg.RV + right.absolutePressureMmHg.RV) / 2 } };
    const qualification = { ...input.coarse.qualification,
      terminalTrace: [...samples.slice(0, 3), inserted, { ...right, acceptedDtSec: right.acceptedDtSec / 2 }, ...samples.slice(4)] };
    const report = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification } });
    expect(report.status).toBe("passed");
    expect(report.checks[0]!.coarse.observedMmHgPerSec).toBe(100);
    expect(report.checks[0]!.coarse.nextSameSignFraction).toBe(1);
  });

  it("rejects isolated excursions even when the reported magnitudes agree between grids", () => {
    const input = fixtureV1();
    const qualification = qualificationV1(0.125, [0, 0, 100, 0, 0, 0, -100, 0, 0]);
    const report = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification } });
    expect(report.status).toBe("failed");
    expect(report.checks.every((check) => check.relativeDifference === 0)).toBe(true);
    expect(report.checks[0]!.coarse.issue).toBe("isolated-one-segment-excursion");
  });

  it("requires visible extrema and neighbor evidence without inventing a periodic seam", () => {
    const input = fixtureV1();
    const qualification = { ...input.coarse.qualification, terminalTrace: input.coarse.qualification.terminalTrace.slice(4) };
    const report = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification } });
    expect(report.status).toBe("unresolved");
    expect(report.checks[0]!.coarse.issue).toBe("reported-extremum-not-visible-no-periodic-seam-invented");
    const isolated = qualificationV1(0.125, [0, 0, 100, 0, 0, 0, -100, 0, 0]);
    const edge = { ...isolated, terminalTrace: isolated.terminalTrace.slice(2) };
    const edgeReport = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification: edge } });
    expect(edgeReport.checks[0]!.coarse.issue).toBe("peak-neighbor-not-observed");
    expect(edgeReport.checks[0]!.coarse.status).toBe("unresolved");
  });

  it("requires the same candidate, exact model, period-one status and halved dt", () => {
    const input = fixtureV1();
    const changed = (qualification: MainWireBaselinePressureRateQualificationV1) =>
      evaluateMainWireBaselinePressureRateQualityV1({ ...input, fine: { ...input.fine, qualification } });
    expect(evaluateMainWireBaselinePressureRateQualityV1({ ...input, fine: {
      ...input.fine, candidateIdentitySha256: "b".repeat(64),
    } }).issue).toBe("candidate-identity-mismatch");
    expect(evaluateMainWireBaselinePressureRateQualityV1({ ...input, fine: {
      ...input.fine, candidateIdentitySha256: "unbound",
    } }).issue).toBe("invalid-source-identity");
    expect(changed({ ...input.fine.qualification, checkpoint: { ...input.fine.qualification.checkpoint,
      modelIdentity: { ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1, ventricularMaterialParameterHash: "different" },
    } }).issue).toBe("exact-model-identity-mismatch");
    expect(changed({ ...input.fine.qualification, nominalDtSec: 0.125 }).issue).toBe("dt-halving-required");
    expect(changed({ ...input.fine.qualification, classification: { status: "period2-suspect" } }).issue).toBe("period1-required");
  });

  it("keeps nonfinite data unavailable and rejects wrong signs or inconsistent recorded extrema", () => {
    for (const value of [NaN, Infinity, 0, -100, 60]) {
      const input = fixtureV1();
      const oldBeat = input.coarse.qualification.checkpoint.baseStandardCheckpointV2.completedBeatMetrics!;
      const qualification = { ...input.coarse.qualification, checkpoint: { ...input.coarse.qualification.checkpoint,
        baseStandardCheckpointV2: { completedBeatMetrics: { ...oldBeat, ventricularAbsolutePressureRateExtrema: {
          ...oldBeat.ventricularAbsolutePressureRateExtrema, LV: { ...oldBeat.ventricularAbsolutePressureRateExtrema.LV, maximumMmHgPerSec: value },
        } } },
      } };
      const report = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification } });
      expect(report.status).toBe(Number.isFinite(value) ? "failed" : "unresolved");
      expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    }
  });

  it("rejects skipped accepted endpoints rather than using a multi-step secant", () => {
    const input = fixtureV1();
    const qualification = { ...input.coarse.qualification,
      terminalTrace: input.coarse.qualification.terminalTrace.filter((_, index) => index !== 4) };
    const report = evaluateMainWireBaselinePressureRateQualityV1({ ...input, coarse: { ...input.coarse, qualification } });
    expect(report.status).toBe("unresolved");
    expect(report.checks[0]!.coarse.issue).toBe("invalid-or-incomplete-accepted-trace");
  });

  it("validates persisted policy, identities, coverage, values and support instead of trusting passed", () => {
    const report = evaluateMainWireBaselinePressureRateQualityV1(fixtureV1());
    const tampered: unknown[] = [
      { ...report, methodId: "another-method" },
      { ...report, status: "failed" },
      { ...report, issue: "unresolved-source" },
      { ...report, policy: { ...report.policy, maximumTwoGridRelativeDifference: 1 } },
      { ...report, grids: { ...report.grids, fine: { ...report.grids.fine, nominalDtSec: 0.125 } } },
      { ...report, grids: { ...report.grids, fine: { ...report.grids.fine, candidateIdentitySha256: "b".repeat(64) } } },
      { ...report, grids: { ...report.grids, fine: { ...report.grids.fine, checkpointSha256: "unbound" } } },
      { ...report, grids: { ...report.grids, fine: { ...report.grids.fine, modelIdentity: {} } } },
      { ...report, checks: report.checks.slice(1) },
      { ...report, checks: [report.checks[0], report.checks[0], ...report.checks.slice(2)] },
    ];
    const first = report.checks[0]!;
    for (const mutation of [
      { status: "unresolved" }, { issue: "peak-neighbor-not-observed" },
      { reportedMmHgPerSec: -100 }, { observedMmHgPerSec: 101 }, { observedMmHgPerSec: NaN },
      { peakStartTimeSec: first.coarse.peakEndTimeSec }, { peakEndTimeSec: 999 }, { peakPhase01: 1.1 },
      { previousSameSignFraction: 0.1, nextSameSignFraction: null },
      { previousSameSignFraction: Infinity }, { previousSameSignFraction: 2 },
    ]) tampered.push({ ...report, checks: [{ ...first, coarse: { ...first.coarse, ...mutation } }, ...report.checks.slice(1)] });
    tampered.push({ ...report, checks: [{ ...first, relativeDifference: 0.01 }, ...report.checks.slice(1)] });
    const changedPeak = { ...first.fine, reportedMmHgPerSec: 110, observedMmHgPerSec: 110 };
    tampered.push({ ...report, checks: [{ ...first, fine: changedPeak, relativeDifference: 10 / 110 }, ...report.checks.slice(1)] });
    for (const candidate of tampered) expect(() => assertMainWireBaselinePressureRateQualityV1(candidate)).toThrow();
  });
});

function fixtureV1(coarseScale = 1, fineScale = 1): InputV1 {
  return {
    coarse: { candidateIdentitySha256: "a".repeat(64), qualification: qualificationV1(0.125, ratesV1.map((rate) => rate * coarseScale)) },
    fine: { candidateIdentitySha256: "a".repeat(64), qualification: qualificationV1(0.0625, ratesV1.flatMap((rate) => [rate * fineScale, rate * fineScale])) },
  };
}

/** Analytic piecewise-linear fixture: no exact runner or physiology assertion. */
function qualificationV1(dt: number, rates: number[]): MainWireBaselinePressureRateQualificationV1 {
  let pressure = 10;
  const terminalTrace = [0, ...rates].map((rate, index) => {
    pressure += rate * dt;
    return { acceptedTimeSec: index * dt, acceptedDtSec: dt, absolutePressureMmHg: { LV: pressure, RV: pressure / 2 } };
  });
  return { nominalDtSec: dt, classification: { status: "period1-converged" }, terminalTrace,
    checkpoint: { modelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1, checkpointSha256: "1".repeat(64),
      baseStandardCheckpointV2: { completedBeatMetrics: { startTimeSec: 0, endTimeSec: rates.length * dt, durationSec: rates.length * dt,
        ventricularAbsolutePressureRateExtrema: {
          LV: { maximumMmHgPerSec: Math.max(...rates), minimumMmHgPerSec: Math.min(...rates) },
          RV: { maximumMmHgPerSec: Math.max(...rates) / 2, minimumMmHgPerSec: Math.min(...rates) / 2 },
        },
      } },
    },
  };
}

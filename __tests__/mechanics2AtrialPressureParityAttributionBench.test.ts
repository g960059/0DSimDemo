import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialPressureParityAttributionBenchV1,
  type AtrialPressureParityAttributionReportV1,
} from "@/engine/mechanics2/benches/AtrialPressureParityAttributionBench";
import pressureParityAttributionReport
  from "@/data/mechanics2/reports/atrial-pressure-parity-attribution-report-v1.json";

describe("AtrialPressureParityAttributionBench V1", () => {
  let report: AtrialPressureParityAttributionReportV1;

  beforeAll(() => {
    report = runAtrialPressureParityAttributionBenchV1();
  }, 360_000);

  it("classifies the focused LA pressure-parity residual without pressure substitution", () => {
    expect(report.upstreamClosedLoopReplay.observedStatus).toBe("atrial-fiber-closed-loop-replay-signal");
    expect(report.upstreamClosedLoopReplay.residualRows).toEqual([
      "LA:preload-high",
      "LA:afterload-high",
      "LA:contractility-low",
    ]);
    expect(report.attributionMode).toBe("LA-closed-loop-pressure-parity-no-substitution");
    expect(report.decision.atrialPressureParityStatus).toBe("la-pressure-parity-attribution-signal");
    expect(report.summary).toMatchObject({
      focusedResidualCount: 3,
      classifiedCount: 3,
      baselineOffsetDominantCount: 3,
      pulseScaleMismatchCount: 3,
      wallPressureDecoupledCount: 3,
      vWaveReservoirComponentCount: 1,
      lateAWaveAlignedCount: 3,
    });
  });

  it("shows raw atrial fiber pressure needs a decomposed pressure contract before substitution", () => {
    for (const row of report.rows) {
      expect(row.classifications).toContain("baseline-offset-dominant");
      expect(row.classifications).toContain("wall-pulse-scale-mismatch");
      expect(row.classifications).toContain("wall-pressure-decoupled-from-current-waveform");
      expect(row.classifications).toContain("late-a-wave-phase-aligned");
      expect(row.classifications).toContain("decomposed-pressure-contract-needed");
      expect(row.offsetImprovementFraction).toBeGreaterThan(0.65);
      expect(row.affineImprovementFraction).toBeGreaterThan(0.89);
      expect(row.currentToFiberPulseRatio).toBeLessThan(0.42);
      expect(row.affineSlope).toBeLessThan(0.1);
    }
  });

  it("keeps runtime, pressure substitution, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("atrial-pressure-substitution");
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed attribution artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(pressureParityAttributionReport, report);
  });
});

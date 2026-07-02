import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialFiberSourceReservoirShadowReplayBenchV1,
  type AtrialFiberSourceReservoirShadowReplayReportV1,
} from "@/engine/mechanics2/benches/AtrialFiberSourceReservoirShadowReplayBench";
import shadowReport
  from "@/data/mechanics2/reports/atrial-fiber-source-reservoir-shadow-replay-report-v1.json";

describe("AtrialFiberSourceReservoirShadowReplayBench V1", () => {
  let report: AtrialFiberSourceReservoirShadowReplayReportV1;

  beforeAll(() => {
    report = runAtrialFiberSourceReservoirShadowReplayBenchV1();
  }, 600_000);

  it("keeps atrial fiber as a source/reservoir-conditioned shadow readback", () => {
    expect(report.upstreamSourceReservoirContract.observedStatus)
      .toBe("source-reservoir-contract-review-signal");
    expect(report.upstreamSourceReservoirContract).toMatchObject({
      effectiveEnvelopePassCount: 21,
      dtHalfReservoirParityPassCount: 7,
    });
    expect(report.decision.atrialFiberSourceReservoirShadowReplayStatus)
      .toBe("atrial-fiber-source-reservoir-shadow-replay-signal");
    expect(report.summary).toMatchObject({
      total: 14,
      pass: 14,
      fail: 0,
      laPass: 7,
      raPass: 7,
      finiteBoundedCount: 14,
      lateActivePeakCount: 14,
      sourceReservoirConditionedCount: 14,
    });
  });

  it("keeps LA and RA active pressure readbacks finite, late, and bounded", () => {
    expect(report.summary.meanLaActivePressurePeakMmHg).toBeGreaterThan(10);
    expect(report.summary.meanLaActivePressurePeakMmHg).toBeLessThan(12);
    expect(report.summary.meanRaActivePressurePeakMmHg).toBeGreaterThan(3);
    expect(report.summary.meanRaActivePressurePeakMmHg).toBeLessThan(3.4);
    for (const row of report.rows) {
      expect(row.status).toBe("pass");
      expect(row.allFinite).toBe(true);
      expect(row.activePeakTheta).toBeGreaterThanOrEqual(0.78);
      expect(row.activePeakTheta).toBeLessThanOrEqual(0.98);
      expect(row.volumePulseMl).toBeGreaterThan(1);
      expect(row.maxAbsLSiVelocityNormPerSec).toBeLessThan(1.65);
      expect(row.classes).toContain("pressure-substitution-disabled");
      expect(row.classes).toContain("source-reservoir-pressure-conditioned");
      expect(row.classes).toContain("finite-bounded-shadow");
    }
  });

  it("keeps pressure substitution, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("atrial-pressure-substitution");
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed source/reservoir shadow replay artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(shadowReport, report);
  });
});

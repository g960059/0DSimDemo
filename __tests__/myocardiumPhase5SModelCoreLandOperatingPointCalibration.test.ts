import resultArtifact from "@/data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json";
import { validateModelCoreLandOperatingPointCalibration } from "@/tools/myocardium/verifyModelCoreLandOperatingPointCalibration";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5S ModelCore Land operating-point calibration", () => {
  it("records diagnostic-only operating-point evidence with no acceptance claim", () => {
    expect(resultArtifact.id).toBe("modelcore-land-operating-point-calibration-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5S");
    expect(resultArtifact.claimBoundary).toBe("operating-point-calibration-diagnostic-only");
    expect(resultArtifact.analysis.operatingPointStatus)
      .toBe("main-domain-calibration-signal-low-preload-edge-report-only");
    expect(resultArtifact.analysis.finalNoAlternansClaim).toBe("not-claimed");
    expect(resultArtifact.analysis.structuralAlternansRemovalClaim).toBe("not-established");
    expect(resultArtifact.analysis.level3Acceptance).toBe("not-claimed");
    expect(resultArtifact.analysis.level4Acceptance).toBe("not-claimed");
    expect(resultArtifact.analysis.officialMorphologyAcceptance).toBe("not-claimed");
    expect(resultArtifact.analysis.runtimeReplacement).toBe("not-claimed");
  });

  it("uses fixed diagnostic operating points and keeps same-delta comparisons source-provider-only", () => {
    expect(resultArtifact.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 0, 1000]);
    expect(resultArtifact.diagnosticProtocol.mainDomainDeltasMl).toEqual([0, 1000]);
    expect(resultArtifact.diagnosticProtocol.preloadAxisMode)
      .toBe("fixed-diagnostic-operating-points-not-tuning");
    expect(resultArtifact.pairs).toHaveLength(3);
    for (const pair of resultArtifact.pairs) {
      expect(pair.sameClosureStableHash).toBe(true);
      expect(pair.sourceProviderDifferenceOnlyWithinPoint).toBe(true);
      expect(pair.land.providerInstrumentation.landSolveFailureCount).toBe(0);
      expect(pair.land.settled).toBe(true);
      expect(pair.land.healthStatus).toBe("ok");
    }
  });

  it("classifies main-domain mapped Land as a report-only education DoD checkpoint", () => {
    const level34 = resultArtifact.levelEvidence.level3_4ClosedLoopOperatingPoint;
    expect(resultArtifact.runHealth.landSolveFailureCount).toBe(0);
    expect(resultArtifact.levelEvidence.level1CalciumInterface.pass).toBe(true);
    expect(resultArtifact.levelEvidence.level2SourceStressTransfer.stressRatiosInCoarseLegacyClass).toBe(true);
    expect(level34.status).toBe("main-domain-calibration-signal");
    expect(level34.mainDomainOutputScoreMax).toBeLessThan(0.35);
    expect(level34.mainDomainQAoPeakRatioMin).toBeGreaterThan(0.55);
    expect(level34.mainDomainAllPeriod1).toBe(true);
    expect(level34.lowPreloadEdgeStillReportOnly).toBe(true);
    expect(resultArtifact.educationDoDCheckpoint.status).toBe("draft-do-d-ready-for-owner-review");
    expect(resultArtifact.educationDoDCheckpoint.satisfiedNow).toBe(false);
  });

  it("passes the live verifier", () => {
    const report = validateModelCoreLandOperatingPointCalibration(process.cwd());

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toContain("phase5s_diagnostic_only");
  });
});

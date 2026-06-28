import { describe, expect, it } from "vitest";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json";
import {
  MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID,
  type ModelCoreLandSdirk2ReferenceEvidence,
} from "@/tools/myocardium/buildModelCoreLandSdirk2ReferenceEvidence";

describe("myocardium Phase 5C-R ModelCore Land provider-local SDIRK2 reference", () => {
  const evidence = resultArtifact as ModelCoreLandSdirk2ReferenceEvidence;

  it("records a provider-local commit solver robustness protocol", () => {
    expect(evidence.id).toBe(MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID);
    expect(evidence.phase).toBe("Phase 5C-R");
    expect(evidence.claimBoundary).toBe("land-source-provider-commit-solver-robustness-only");
    expect(evidence.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 1000]);
    expect(evidence.diagnosticProtocol.phase5QCalciumMappingScenario).toBe("phase2b-absolute-peak-ca");
    expect(evidence.diagnosticProtocol.modelCoreGlobalIntegrator).toBe("unchanged-current-ModelCore-stepper");
    expect(evidence.diagnosticProtocol.sdirk2ProviderLocalStagePolicy.finalStateSource).toBe("Y1");
    expect(evidence.diagnosticProtocol.sdirk2ProviderLocalStagePolicy.notClaimed).toBe(
      "not a global ModelCore SDIRK2 stage state",
    );
    expect(evidence.runMatrix).toHaveLength(10);
    expect(evidence.boundary.landProviderCommitSchemeOnly).toBe(true);
    expect(evidence.boundary.globalModelCoreSdirk2).toBe("not-claimed");
  });

  it("runs the narrow legacy/raw/mapped BE-vs-SDIRK2 matrix", () => {
    expect(evidence.runHealth.legacyTargetsSettledByConvergence).toBe(true);
    expect(evidence.runHealth.landPointCount).toBe(8);
    expect(evidence.runHealth.landPointsSettledByConvergence).toBe(8);
    expect(evidence.runHealth.landPointsCapOrNonOk).toBe(0);
    expect(evidence.runHealth.sdirk2PointCount).toBe(4);
    expect(evidence.runHealth.sourceAuditSamplesPresent).toBe(true);
    expect(evidence.runHealth.commitAuditSamplesPresent).toBe(true);
    expect(evidence.runHealth.calciumScaleAuditSamplesPresent).toBe(true);
    expect(evidence.pairs.map((pair) => pair.scenarioId)).toEqual([
      "raw-land-be",
      "raw-land-sdirk2",
      "phase2b-calcium-mapped-be",
      "phase2b-calcium-mapped-sdirk2",
      "raw-land-be",
      "raw-land-sdirk2",
      "phase2b-calcium-mapped-be",
      "phase2b-calcium-mapped-sdirk2",
    ]);
  });

  it("records that pinned mapped SDIRK2 preserves the signal but remains inconclusive", () => {
    const pinned = evidence.analysis.pinnedPhase2bCalciumMappedComparison;

    expect(evidence.analysis.robustnessStatus).toBe("sdirk2-reference-inconclusive");
    expect(pinned.deltaVolumeMl).toBe(-1250);
    expect(pinned.be.land.periodBeats).toBe(1);
    expect(pinned.sdirk2.land.periodBeats).toBe(1);
    expect(pinned.sdirk2.comparison.matchedLegacyOutputRegime).toBe(true);
    expect(pinned.sdirk2.comparison.clampRegimeRecovered).toBe(true);
    expect(pinned.outputScoreDeltaAbs).toBeLessThan(0.01);
    expect(pinned.sdirk2.land.providerInstrumentation.landSolveFailureCount).toBeGreaterThan(0);
    expect(evidence.runHealth.sdirk2SolveFailureCount).toBeGreaterThan(0);
    expect(evidence.analysis.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.analysis.structuralAlternansRemovalClaim).toBe("not-established");
    expect(evidence.analysis.globalModelCoreSdirk2).toBe("not-claimed");
  });

  it("records SDIRK2 stage failure details instead of silently accepting the period result", () => {
    const sdirk2Pairs = evidence.pairs.filter((pair) => pair.land.commitScheme === "SDIRK2");

    expect(sdirk2Pairs).toHaveLength(4);
    for (const pair of sdirk2Pairs) {
      const instrumentation = pair.land.providerInstrumentation;
      expect(instrumentation.sdirk2Stage0SolveCount).toBeGreaterThan(0);
      expect(instrumentation.sdirk2Stage1SolveCount).toBeGreaterThan(0);
      expect(instrumentation.sdirk2Stage0FailureCount).toBe(0);
      expect(instrumentation.sdirk2Stage1FailureCount).toBeGreaterThan(0);
      expect(instrumentation.maxSdirk2Stage0ResidualNorm).toBeLessThan(1e-7);
      expect(instrumentation.maxSdirk2Stage1ResidualNorm).toBeGreaterThan(0);
      expect(pair.sourceProviderSolverOnlyWithinPoint).toBe(false);
    }
  });
});

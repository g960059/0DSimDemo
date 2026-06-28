import { describe, expect, it } from "vitest";
import resultArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import {
  MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID,
  classifyOutputMatchStatus,
  periodAwareMax,
  type ModelCorePairedLandOutputMatchedQDotAttributionEvidence,
} from "@/tools/myocardium/buildModelCorePairedLandOutputMatchedQDotAttributionEvidence";

describe("myocardium Phase 5C-N paired Land output-matched qDot attribution", () => {
  const evidence = resultArtifact as ModelCorePairedLandOutputMatchedQDotAttributionEvidence;

  it("records a predeclared TBV-axis diagnostic with clean converged matrix points", () => {
    expect(evidence.id).toBe(MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID);
    expect(evidence.diagnosticProtocol.predeclaredDeltasMl).toEqual([
      -1250,
      -1000,
      -750,
      -500,
      0,
      500,
      1000,
    ]);
    expect(evidence.runHealth.allPointsSettledWithoutCap).toBe(true);
    expect(evidence.runHealth.capReachedPointCount).toBe(0);
    expect(evidence.runHealth.nonOkHealthPointCount).toBe(0);
    expect(evidence.boundary.sourceProviderDifferenceOnlyScope)
      .toBe("within-each-same-effective-tbv-pair-only");
    expect(evidence.boundary.crossTbvOutputMatchIsSourceProviderOnly).toBe(false);
    expect(evidence.boundary.preloadTuning).toBe(false);
    expect(evidence.matrix.every((pair) => pair.sourceProviderDifferenceOnlyWithinPoint)).toBe(true);
    expect(evidence.matrix.every((pair) =>
      pair.legacy.providerInstrumentation.sourceActiveStressCallCount > 0
      && pair.land.providerInstrumentation.sourceActiveStressCallCount > 0
      && pair.land.providerInstrumentation.commitProviderStateAfterStepCount > 0
      && pair.land.providerInstrumentation.landSolveFailureCount === 0
    )).toBe(true);
  });

  it("keeps qDot clamp-threshold attribution unresolved when output match is not overlapped", () => {
    expect(evidence.pinnedPointReproduction.legacyPeriodBeats).toBe(2);
    expect(evidence.pinnedPointReproduction.landPeriodBeats).toBe(1);
    expect(evidence.pinnedPointReproduction.legacyAoVQDotClampHitFraction).toBeGreaterThan(0);
    expect(evidence.pinnedPointReproduction.landAoVQDotClampHitFraction).toBe(0);
    expect(evidence.outputMatchAnalysis.status).toBe("not-overlapped");
    expect(evidence.outputMatchAnalysis.bestLandCandidate.meanNormalizedScore)
      .toBeGreaterThan(evidence.outputMatchAnalysis.threshold.meanNormalizedScoreMax);
    expect(evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.CO_L).toBeLessThan(0.5);
    expect(evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.SV_L).toBeLessThan(0.5);
    expect(evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.QAoPeakMlPerSec).toBeLessThan(0.2);
    expect(evidence.attributionInterpretation.structuralAlternansRemovalClaim).toBe("not-established");
    expect(evidence.attributionInterpretation.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.doesNotUnlock).toContain("preloadTuning");
    expect(evidence.doesNotUnlock).toContain("structuralAlternansRemoval");
  });

  it("defines QAo peak over the settled period instead of the final beat only", () => {
    const beats = [
      { QAoMax: 100 },
      { QAoMax: 300 },
      { QAoMax: 200 },
    ];

    expect(periodAwareMax(beats, 2, (beat) => beat.QAoMax)).toBe(300);
    expect(periodAwareMax(beats, 1, (beat) => beat.QAoMax)).toBe(200);
  });

  it("classifies matched diagnostics from the best matched Land candidate", () => {
    expect(classifyOutputMatchStatus("matched", 1, 0.08, 0.1))
      .toBe("output-matched-land-period1-clamp-risk-reduced-not-final");
    expect(classifyOutputMatchStatus("matched", 2, 0.08, 0.1))
      .toBe("output-match-diagnostic-inconclusive");
    expect(classifyOutputMatchStatus("not-overlapped", 1, 0.08, 0.1))
      .toBe("preload-axis-output-match-not-achieved-clamp-avoidance-risk-remains");
  });
});

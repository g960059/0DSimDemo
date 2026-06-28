import { describe, expect, it } from "vitest";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json";
import {
  MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID,
  type ModelCoreLandCalciumSourceForcingBracketEvidence,
} from "@/tools/myocardium/buildModelCoreLandCalciumSourceForcingBracketEvidence";

describe("myocardium Phase 5C-P ModelCore Land calcium/source forcing bracket", () => {
  const evidence = resultArtifact as ModelCoreLandCalciumSourceForcingBracketEvidence;

  it("records a bounded explicit forcing bracket over the pinned and best-Land points", () => {
    expect(evidence.id).toBe(MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID);
    expect(evidence.phase).toBe("Phase 5C-P");
    expect(evidence.claimBoundary).toBe("calcium-source-scale-forcing-bracket-only");
    expect(evidence.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 1000]);
    expect(evidence.diagnosticProtocol.forcingScenarios).toHaveLength(9);
    expect(evidence.boundary.sourceProviderForcingOnly).toBe(true);
    expect(evidence.boundary.crossScaleInterpretationIsSourceProviderOnly).toBe(false);
    expect(evidence.boundary.explicitForcingNotTuning).toBe(true);
    expect(evidence.boundary.noRuntimeReplacement).toBe(true);
  });

  it("keeps every forced point converged with source/commit/forcing audit samples", () => {
    expect(evidence.runHealth.legacyTargetsSettledByConvergence).toBe(true);
    expect(evidence.runHealth.forcedPointCount).toBe(18);
    expect(evidence.runHealth.forcedPointsSettledByConvergence).toBe(18);
    expect(evidence.runHealth.forcedPointsCapOrNonOk).toBe(0);
    expect(evidence.runHealth.landSolveFailureCount).toBe(0);
    expect(evidence.pairs.every((pair) => pair.sourceProviderForcingOnlyWithinPoint)).toBe(true);
    expect(evidence.pairs.every((pair) =>
      pair.forcedLand.providerInstrumentation.sourcePathAudit?.sampleCount
      && pair.forcedLand.providerInstrumentation.commitPathAudit?.sampleCount
      && pair.forcedLand.providerInstrumentation.forcingAudit?.sourceCallCount
    )).toBe(true);
  });

  it("records calcium scaling into the legacy output and qDot regime without acceptance", () => {
    const bestCalcium = evidence.analysis.bestCalciumScaleCandidate;

    expect(evidence.analysis.classification).toBe("calcium-input-scaling-reaches-legacy-regime");
    expect(bestCalcium.forcedLand.axis).toBe("calcium-input-scale");
    expect(bestCalcium.comparison.matchedLegacyOutputRegime).toBe(true);
    expect(bestCalcium.comparison.clampRegimeRecovered).toBe(true);
    expect(bestCalcium.forcedLand.periodBeats).toBe(1);
    expect(bestCalcium.comparison.meanOutputMatchScore).toBeLessThan(0.15);
    expect(bestCalcium.comparison.forcedVsLegacyPeakSigmaActRatio).toBeGreaterThan(0.8);
    expect(bestCalcium.comparison.forcedVsLegacyPeakSigmaActRatio).toBeLessThan(1.2);
    expect(evidence.analysis.structuralAlternansRemovalClaim).toBe("not-established");
    expect(evidence.analysis.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.analysis.officialMorphologyAcceptance).toBe("not-claimed");
    expect(evidence.doesNotUnlock).toContain("runtimeReplacement");
    expect(evidence.doesNotUnlock).toContain("structuralAlternansRemoval");
  });
});

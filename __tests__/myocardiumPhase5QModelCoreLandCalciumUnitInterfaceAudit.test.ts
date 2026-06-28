import { describe, expect, it } from "vitest";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import {
  MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID,
  type ModelCoreLandCalciumUnitInterfaceAuditEvidence,
} from "@/tools/myocardium/buildModelCoreLandCalciumUnitInterfaceAuditEvidence";

describe("myocardium Phase 5C-Q ModelCore Land calcium unit/source-interface audit", () => {
  const evidence = resultArtifact as ModelCoreLandCalciumUnitInterfaceAuditEvidence;

  it("records the bounded calcium unit/source-interface protocol", () => {
    expect(evidence.id).toBe(MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID);
    expect(evidence.phase).toBe("Phase 5C-Q");
    expect(evidence.claimBoundary).toBe("calcium-unit-source-interface-audit-only");
    expect(evidence.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 1000]);
    expect(evidence.diagnosticProtocol.phase2bAbsolutePeakCaUM).toBe(1.02);
    expect(evidence.diagnosticProtocol.phase5PScale10Reference).toBe(10);
    expect(evidence.diagnosticProtocol.phase5PPositiveControlScale).toBe(30);
    expect(evidence.mappingScenarios.map((scenario) => scenario.scenarioId)).toEqual([
      "raw-direct-internal-c",
      "phase2b-absolute-peak-ca",
      "land-cat50ref-peak-ca",
      "legacy-aInfRaw-equivalent-ca-trpn",
      "legacy-aInf-equivalent-ca-trpn",
      "phase5p-calcium-scale-10-reference",
      "phase5p-calcium-scale-30-control",
    ]);
    expect(evidence.boundary.calciumInputMappingOnly).toBe(true);
    expect(evidence.boundary.activationEquivalentMappingsAreDiagnosticOnly).toBe(true);
    expect(evidence.boundary.fixedScale30IsPhase5PPositiveControlOnly).toBe(true);
    expect(evidence.boundary.noRuntimeReplacement).toBe(true);
  });

  it("derives fixed mappings once from the pinned legacy LV calcium peak", () => {
    const cPeak = evidence.calibration.pinnedLegacyCPeak;

    expect(evidence.calibration.pinnedLegacyDeltaMl).toBe(-1250);
    expect(evidence.calibration.pinnedLegacyCSource).toBe("last-two-beat-overlay-LV_c-max");
    expect(cPeak).toBeGreaterThan(0.1);
    expect(cPeak).toBeLessThan(0.2);
    expect(evidence.calibration.phase2bAbsolutePeakScale).toBeCloseTo(1.02 / cPeak, 12);
    expect(evidence.calibration.landCaT50RefScale).toBeCloseTo(evidence.diagnosticProtocol.landCaT50RefUM / cPeak, 12);
    expect(evidence.calibration.phase5PScale10Reference).toBe(10);
    expect(evidence.calibration.phase5PPositiveControlScale).toBe(30);
  });

  it("keeps every mapped point converged with source, commit, and calcium mapping audits", () => {
    expect(evidence.runHealth.legacyTargetsSettledByConvergence).toBe(true);
    expect(evidence.runHealth.mappedPointCount).toBe(14);
    expect(evidence.runHealth.mappedPointsSettledByConvergence).toBe(14);
    expect(evidence.runHealth.mappedPointsCapOrNonOk).toBe(0);
    expect(evidence.runHealth.landSolveFailureCount).toBe(0);
    expect(evidence.runHealth.sourceAuditSamplesPresent).toBe(true);
    expect(evidence.runHealth.commitAuditSamplesPresent).toBe(true);
    expect(evidence.runHealth.calciumMappingAuditSamplesPresent).toBe(true);
    expect(evidence.pairs.every((pair) => pair.sameClosureStableHash && pair.calciumMappingOnlyWithinPoint)).toBe(true);
    expect(evidence.pairs.every((pair) =>
      pair.mappedLand.providerInstrumentation.sourcePathAudit?.sampleCount
      && pair.mappedLand.providerInstrumentation.commitPathAudit?.sampleCount
      && pair.mappedLand.providerInstrumentation.calciumMappingAudit?.sourceCallCount
      && pair.mappedLand.providerInstrumentation.calciumMappingAudit?.commitCallCount
    )).toBe(true);
  });

  it("records a fixed unit-style mapping into the coarse legacy output/qDot regime without acceptance", () => {
    const bestFixed = evidence.analysis.bestFixedUnitCandidate;
    const phase5PReference = evidence.analysis.phase5PPositiveControlCandidate;

    expect(evidence.analysis.classification).toBe("simple-unit-mapping-sufficient");
    expect(bestFixed.mappedLand.scenarioId).toBe("phase2b-absolute-peak-ca");
    expect(bestFixed.deltaVolumeMl).toBe(-1250);
    expect(bestFixed.mappedLand.axis).toBe("fixed-unit-scale");
    expect(bestFixed.comparison.matchedLegacyOutputRegime).toBe(true);
    expect(bestFixed.comparison.clampRegimeRecovered).toBe(true);
    expect(bestFixed.mappedLand.periodBeats).toBe(1);
    expect(bestFixed.comparison.meanOutputMatchScore).toBeLessThan(0.15);
    expect(bestFixed.comparison.mappedVsLegacyPeakSigmaActRatio).toBeGreaterThan(0.8);
    expect(bestFixed.comparison.mappedVsLegacyPeakSigmaActRatio).toBeLessThan(1.25);
    expect(phase5PReference.mappedLand.axis).toBe("positive-control-scale");
    expect(evidence.analysis.structuralAlternansRemovalClaim).toBe("not-established");
    expect(evidence.analysis.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.analysis.officialMorphologyAcceptance).toBe("not-claimed");
    expect(evidence.analysis.runtimeReplacement).toBe("not-claimed");
    expect(evidence.doesNotUnlock).toContain("runtimeReplacement");
    expect(evidence.doesNotUnlock).toContain("structuralAlternansRemoval");
  });

  it("keeps activation-equivalent mappings diagnostic with explicit inverse audit ranges", () => {
    const activationPairs = evidence.pairs.filter((pair) => pair.mappedLand.axis === "activation-equivalent");

    expect(activationPairs).toHaveLength(4);
    for (const pair of activationPairs) {
      const audit = pair.mappedLand.providerInstrumentation.calciumMappingAudit;
      expect(audit?.inverseTargetRaw.max).toBeGreaterThan(0);
      expect(audit?.inverseTargetClamped.min).toBeGreaterThan(0);
      expect(audit?.inverseCaT50UM.max).toBeGreaterThan(0);
      expect(audit?.inverseTargetClampCount).toBeGreaterThan(0);
    }
  });
});

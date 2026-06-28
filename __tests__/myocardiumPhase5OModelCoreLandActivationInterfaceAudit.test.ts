import { describe, expect, it } from "vitest";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json";
import {
  MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID,
  type ModelCoreLandActivationInterfaceAuditEvidence,
} from "@/tools/myocardium/buildModelCoreLandActivationInterfaceAuditEvidence";

describe("myocardium Phase 5C-O ModelCore Land activation/source-interface audit", () => {
  const evidence = resultArtifact as ModelCoreLandActivationInterfaceAuditEvidence;

  it("records a bounded two-point activation/source-interface audit", () => {
    expect(evidence.id).toBe(MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID);
    expect(evidence.phase).toBe("Phase 5C-O");
    expect(evidence.claimBoundary).toBe("activation-source-interface-audit-only");
    expect(evidence.diagnosticProtocol.diagnosticDeltasMl).toEqual([-1250, 1000]);
    expect(evidence.boundary.sourceProviderDifferenceOnlyScope)
      .toBe("within-each-same-effective-tbv-pair-only");
    expect(evidence.boundary.crossTbvInterpretationIsSourceProviderOnly).toBe(false);
    expect(evidence.boundary.auditOnlyNoTuning).toBe(true);
    expect(evidence.boundary.noRuntimeReplacement).toBe(true);
  });

  it("keeps every point converged and paired while localizing the settled trace stress gap", () => {
    expect(evidence.runHealth.allPointsSettledByConvergence).toBe(true);
    expect(evidence.runHealth.nonOkHealthPointCount).toBe(0);
    expect(evidence.runHealth.landSolveFailureCount).toBe(0);
    expect(evidence.runHealth.landSourceAuditSamplesPresent).toBe(true);
    expect(evidence.runHealth.landCommitAuditSamplesPresent).toBe(true);
    expect(evidence.pairs.every((pair) => pair.sourceProviderDifferenceOnlyWithinPoint)).toBe(true);
    expect(evidence.pairs.every((pair) =>
      pair.stressGap.landPeakSigmaActToLegacyRatio < 0.01
      && pair.stressGap.landSourcePathStressMaxToLegacyPeakSigmaRatio
        > pair.stressGap.landPeakSigmaActToLegacyRatio
      && pair.land.providerInstrumentation.sourcePathAudit?.sampleCount
      && pair.land.providerInstrumentation.commitPathAudit?.sampleCount
    )).toBe(true);
  });

  it("does not turn the audit into structural alternans or runtime acceptance", () => {
    expect(evidence.auditInterpretation.classification)
      .toBe("land-source-interface-underactivation-gap-observed");
    expect(evidence.auditInterpretation.structuralAlternansRemovalClaim).toBe("not-established");
    expect(evidence.auditInterpretation.finalNoAlternansClaim).toBe("not-claimed");
    expect(evidence.auditInterpretation.officialMorphologyAcceptance).toBe("not-claimed");
    expect(evidence.auditInterpretation.recommendedNextChecks)
      .toContain("explicit-source-output-forcing-bracket-before-structural-attribution");
    expect(evidence.doesNotUnlock).toContain("runtimeReplacement");
    expect(evidence.doesNotUnlock).toContain("structuralAlternansRemoval");
  });
});

import { describe, expect, it } from "vitest";
import {
  MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID,
  buildModelCorePairedLandQDotClampAttributionEvidence,
} from "@/tools/myocardium/buildModelCorePairedLandQDotClampAttributionEvidence";
import {
  validateModelCorePairedLandQDotClampAttribution,
} from "@/tools/myocardium/verifyModelCorePairedLandQDotClampAttribution";

describe("myocardium Phase 5C-M paired Land qDot clamp attribution", () => {
  it("records trace-derived AoV qDot clamp attribution without final acceptance claims", () => {
    const validation = validateModelCorePairedLandQDotClampAttribution();

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.evidence.id).toBe(MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID);
    expect(validation.evidence.sameClosureBoundary.sourceProviderDifferenceOnly).toBe(true);
    expect(validation.evidence.sameClosureBoundary.noQDotTuning).toBe(true);
    expect(validation.evidence.pairedRunStatus.legacyStatus).toBe("period-2-positive-control-pass");
    expect(validation.evidence.pairedRunStatus.landStatus).toBe("finite-period-1");
    expect(validation.evidence.attributionInterpretation.structuralAlternansRemovalClaim).toBe("not-established");
    expect(validation.evidence.attributionInterpretation.finalNoAlternansClaim).toBe("not-claimed");
    expect(validation.evidence.attributionInterpretation.officialMorphologyAcceptance).toBe("not-claimed");
  });

  it("keeps qDot clamp avoidance as an attribution question when Land output is lower", () => {
    const evidence = buildModelCorePairedLandQDotClampAttributionEvidence();
    const legacyTrace = evidence.clampAttribution.legacy.clampAttributionTrace;
    const landTrace = evidence.clampAttribution.land.clampAttributionTrace;

    expect(legacyTrace.traceBeatCount).toBeGreaterThan(0);
    expect(landTrace.traceBeatCount).toBeGreaterThan(0);
    expect(legacyTrace.sampleCount).toBeGreaterThan(0);
    expect(landTrace.sampleCount).toBeGreaterThan(0);
    expect(legacyTrace.aovQDotClampHitCount).toBeGreaterThan(0);
    expect(legacyTrace.aovQDotMaxImpulseAbsMlPerS2).toBeGreaterThan(0);
    expect(evidence.clampAttribution.deltas.landVsLegacyQAoPeakDeltaMlPerSec).toBeLessThan(0);
    expect(evidence.attributionInterpretation.requiredNextChecks)
      .toContain("output-matched-paired-run-before-structural-attribution");
    expect(evidence.doesNotUnlock).toContain("finalNoAlternans");
  });
});

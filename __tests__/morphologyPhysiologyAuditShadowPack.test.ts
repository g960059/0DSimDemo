import { describe, expect, it } from "vitest";
import artifact from "../data/diagnostics/morphology/morphology-physiology-audit-shadow-pack-v1.json";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import { buildMorphologyPhysiologyAuditShadowPackV1 } from "@/tools/diagnostics/runMorphologyPhysiologyAuditShadowPack";

describe("Morphology physiology audit shadow pack", () => {
  it("keeps the physiology audit report-only and unable to affect current gates", () => {
    const pack = buildMorphologyPhysiologyAuditShadowPackV1();

    expect(pack.summary.scenarioCount).toBe(11);
    expect(pack.summary.allReportOnly).toBe(true);
    expect(pack.summary.noScenarioCanAffectGate).toBe(true);
    expect(pack.summary.diseaseProfilesReportOnly).toBe(true);
    expect(pack.scenarios.every((scenario) => scenario.report.overall.canAffectGate === false)).toBe(true);
  });

  it("classifies curated AV inflow physiology patterns without rescuing artifact guards", () => {
    const pack = buildMorphologyPhysiologyAuditShadowPackV1();
    const byId = new Map(pack.scenarios.map((scenario) => [scenario.scenarioId, scenario]));

    for (const scenario of pack.scenarios) {
      expect(scenario.report.mvf?.patternClass.patternClass).toBe(scenario.expectedMvPattern);
      expect(scenario.report.tvf?.patternClass.patternClass).toBe(scenario.expectedTvPattern);
    }

    expect(byId.get("normal-ea-biphasic")?.report.mvf?.patternClass.patternClass).toBe("EA_biphasic");
    expect(byId.get("normal-low-preload-e-reduced")?.report.mvf?.patternClass.patternClass)
      .toBe("EA_biphasic");
    expect(byId.get("high-hr-ea-fusion")?.report.mvf?.patternClass.patternClass).toBe("EA_fused");
    expect(byId.get("bradycardia-small-l-wave")?.report.mvf?.patternClass.patternClass).toBe("ELA_triphasic");
    expect(byId.get("af-a-wave-absent")?.report.mvf?.patternClass.patternClass).toBe("E_only_or_A_absent");

    const artifactThirdWave = byId.get("artifact-reservoir-third-wave")?.report;
    expect(artifactThirdWave?.overall.artifactGuard).toBe("fail");
    expect(artifactThirdWave?.overall.finalDecision).toBe("report-only");
    expect(artifactThirdWave?.overall.enforcedEquivalentDecision).toBe("fail");
    expect(artifactThirdWave?.forbiddenRescueFlags).toContain("artifact-fail-cannot-be-rescued-by-profile");

    const closedValveFlow = byId.get("artifact-closed-valve-forward-flow")?.report;
    expect(closedValveFlow?.overall.artifactGuard).toBe("fail");
    expect(closedValveFlow?.mvf?.artifactGuard.failedArtifactIds).toContain("valve-state-unsupported");

    const sharpFlow = byId.get("artifact-unphysiologic-sharpness")?.report;
    expect(sharpFlow?.overall.artifactGuard).toBe("fail");
    expect(sharpFlow?.mvf?.artifactGuard.failedArtifactIds).toContain("unphysiologic-sharpness");
    expect(sharpFlow?.overall.enforcedEquivalentDecision).toBe("fail");

    const highAfterloadTooNormal = byId.get("high-afterload-too-normal-missing-response")?.report;
    expect(highAfterloadTooNormal?.mvf?.profileExpectation.expectationIdsFailed)
      .toContain("high-afterload-load-response-evidence-missing");
  });

  it("reports low-preload directionality versus the nominal baseline", () => {
    const pack = buildMorphologyPhysiologyAuditShadowPackV1();
    const lowPreload = pack.scenarios.find((scenario) => scenario.scenarioId === "normal-low-preload-e-reduced");

    expect(lowPreload?.report.mvf?.profileExpectation.expectationIdsMet)
      .toContain("low-preload-directionality-met");
    expect(lowPreload?.report.mvf?.profileExpectation.directionalityEvidence?.deltaEAreaVsNominal)
      .toBeLessThan(-0.03);
    expect(lowPreload?.report.mvf?.profileExpectation.directionalityEvidence?.deltaAContributionVsNominal)
      .toBeGreaterThan(-0.05);
  });

  it("matches the committed shadow-pack artifact exactly", () => {
    const rerun = buildMorphologyPhysiologyAuditShadowPackV1();
    const { normalizedSha256: _hash, ...rerunWithoutHash } = rerun;
    expectMechanics2ReportArtifactParity(artifact, rerunWithoutHash);
  });
});

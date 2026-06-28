import resultArtifact from "@/data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json";
import { validateEducationToolDefinitionOfDoneCheckpoint } from "@/tools/myocardium/verifyEducationToolDefinitionOfDoneCheckpoint";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5T education-tool DoD checkpoint", () => {
  it("records owner-review-ready evidence without accepting the DoD", () => {
    expect(resultArtifact.id).toBe("myocardium-education-tool-dod-checkpoint-v1");
    expect(resultArtifact.phase).toBe("Phase 5T");
    expect(resultArtifact.claimBoundary).toBe("education-tool-dod-owner-review-checkpoint-not-acceptance");
    expect(resultArtifact.classification.ownerReviewStatus).toBe("ready");
    expect(resultArtifact.classification.accepted).toBe(false);
    expect(resultArtifact.classification.evidenceMode).toBe("education-tool-report-only");
    expect(resultArtifact.ownerReview.status).toBe("owner-review-ready-not-accepted");
    expect(resultArtifact.ownerReview.satisfiedNow).toBe(false);
  });

  it("derives from Phase 5S while keeping runtime and scientific claims blocked", () => {
    const envelope = resultArtifact.phase5SOperatingEnvelope;

    expect(envelope.upstreamArtifactId).toBe("modelcore-land-operating-point-calibration-result-v1");
    expect(envelope.upstreamClaimBoundary).toBe("operating-point-calibration-diagnostic-only");
    expect(envelope.mainDomainStatus).toBe("main-domain-calibration-signal");
    expect(envelope.lowPreloadEdgeStillReportOnly).toBe(true);
    expect(envelope.landSolveFailureCount).toBe(0);
    expect(envelope.level3Acceptance).toBe("not-claimed");
    expect(envelope.level4Acceptance).toBe("not-claimed");
    expect(envelope.runtimeReplacement).toBe("not-claimed");
    expect(envelope.finalNoAlternansClaim).toBe("not-claimed");
    expect(envelope.structuralAlternansRemovalClaim).toBe("not-established");
  });

  it("checks education surfaces but leaves case/workbench/runtime wiring absent", () => {
    const cases = resultArtifact.officialCaseSurfaceSummary;

    expect(cases.officialCaseCount).toBeGreaterThanOrEqual(3);
    expect(cases.displayableCaseCount).toBe(cases.officialCaseCount);
    expect(cases.expectedFindingsCaseCount).toBe(cases.officialCaseCount);
    expect(cases.allCasesHaveCorePanels).toBe(true);
    expect(cases.clinicalCaveatsNativeFieldStatus).toBe("studio-roadmap-required-not-in-case-schema-yet");
    expect(cases.notMedicalAdviceNativeFieldStatus).toBe("studio-roadmap-required-not-in-case-schema-yet");
    expect(resultArtifact.classification.officialCaseReauthoring).toBe("required-before-runtime");
    expect(resultArtifact.classification.runtimeWiring).toBe("absent");
    expect(resultArtifact.classification.caseWiring).toBe("absent");
    expect(resultArtifact.classification.workbenchWiring).toBe("absent");
  });

  it("passes the live verifier", () => {
    const report = validateEducationToolDefinitionOfDoneCheckpoint(process.cwd());

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toContain("phase5t_owner_review_not_acceptance");
  });
});

import resultArtifact from "@/data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json";
import { validateMorphologyBlockerBundlePhaseM1 } from "@/tools/myocardium/verifyMorphologyBlockerBundlePhaseM1";
import { describe, expect, it } from "vitest";

describe("myocardium morphology blocker bundle Phase M1", () => {
  it("records current-main morphology blocker classification without acceptance claims", () => {
    expect(resultArtifact.id).toBe("morphology-blocker-bundle-phase-m1-result-v1");
    expect(resultArtifact.phase).toBe("Phase M1");
    expect(resultArtifact.claimBoundary)
      .toBe("diagnostic-only-current-main-morphology-blocker-classification-no-acceptance");
    expect(resultArtifact.scope.doesNotResolveFullMorphologyBlockerSet).toBe(true);
    expect(resultArtifact.boundary.noOfficialMorphologyAcceptance).toBe(true);
    expect(resultArtifact.boundary.noRootCauseAcceptance).toBe(true);
    expect(resultArtifact.boundary.noFixAcceptance).toBe(true);
    expect(resultArtifact.boundary.noRuntimeReplacement).toBe(true);
  });

  it("keeps runner and comparator counts pinned to the measured M1 bundle", () => {
    expect(resultArtifact.runner).toMatchObject({
      branchCount: 7,
      metricRowCount: 17304,
      sampleRowCount: 60572,
      warningCount: 0,
      errorCount: 0,
    });
    expect(resultArtifact.filling).toMatchObject({
      groupCount: 42,
      interpretableGroupCount: 39,
      uninterpretableGroupCount: 3,
      residualClassification: "ea-like-proxy-specific-missingness",
    });
    expect(resultArtifact.arterial).toMatchObject({
      groupCount: 42,
      interpretableGroupCount: 42,
      directZcReflectionEvidenceStatus: "missing-no-proxy",
      hypothesisPromotion: "not-promoted-no-proxy",
    });
  });

  it("records exact residual filling identities and forbidden no-proxy arterial signals", () => {
    expect(resultArtifact.filling.residualGroups.map((group) => ({
      caseId: group.caseId,
      branchId: group.branchId,
      branchName: group.branchName,
      beatIndex: group.beatIndex,
      chamber: group.chamber,
      missingReadouts: group.missingReadouts,
      missingOnlyEaLikeInflowProxy: group.missingOnlyEaLikeInflowProxy,
    }))).toEqual([
      {
        caseId: "lv-failure-dobutamine",
        branchId: "1",
        branchName: "LV failure",
        beatIndex: 1,
        chamber: "RV",
        missingReadouts: ["eaLikeInflowProxy"],
        missingOnlyEaLikeInflowProxy: true,
      },
      {
        caseId: "lv-failure-dobutamine",
        branchId: "1",
        branchName: "LV failure",
        beatIndex: 2,
        chamber: "RV",
        missingReadouts: ["eaLikeInflowProxy"],
        missingOnlyEaLikeInflowProxy: true,
      },
      {
        caseId: "lv-failure-dobutamine",
        branchId: "1",
        branchName: "LV failure",
        beatIndex: 3,
        chamber: "RV",
        missingReadouts: ["eaLikeInflowProxy"],
        missingOnlyEaLikeInflowProxy: true,
      },
    ]);
    expect(resultArtifact.filling.allOtherAntiGamingReadoutsAvailableForResidualGroups).toBe(true);
    expect(resultArtifact.arterial.missingNoProxySignals.map((signal) => signal.name).sort()).toEqual([
      "arterialReflectionCoefficient",
      "arterialReflectionDelaySec",
      "characteristicImpedancePaSecPerM3",
    ]);
    for (const signal of resultArtifact.arterial.missingNoProxySignals) {
      expect(signal.status).toBe("missing-no-proxy");
      expect(signal.proxyPolicy).toBe("forbidden");
      expect(signal.promotesHypothesis).toBe(false);
    }
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateMorphologyBlockerBundlePhaseM1(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase_m1_rebuild_not_run_by_default",
        "phase_m1_diagnostic_not_morphology_acceptance",
      ]),
    );
  });
});

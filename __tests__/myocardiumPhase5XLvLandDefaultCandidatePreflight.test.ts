import resultArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import { validateLvLandDefaultCandidatePreflightPhase5X } from "@/tools/myocardium/verifyLvLandDefaultCandidatePreflightPhase5X";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5X LV Land default-candidate preflight", () => {
  it("records a default-candidate preflight without flipping runtime default", () => {
    expect(resultArtifact.id).toBe("lv-land-default-candidate-preflight-phase5x-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5X");
    expect(resultArtifact.claimBoundary)
      .toBe("early-default-candidate-user-knob-morphology-preflight-diagnostic-only");
    expect(resultArtifact.migrationPolicy).toMatchObject({
      landRuntimeDefault: "early-default-candidate-after-preflight-not-in-this-artifact",
      legacyActiveStress: "freeze-positive-control-reference-do-not-delete",
      alternansSdirk2: "parallel-science-closure-not-product-migration-gate",
      officialCases: "not-individually-tuned-until-model-stabilizes",
    });
    expect(resultArtifact.preflight.defaultFlipInThisArtifact).toBe(false);
    expect(resultArtifact.preflight.legacyDeletionReadiness).toBe("blocked-freeze-reference");
    expect(resultArtifact.boundary.noRuntimeDefaultFlipInThisArtifact).toBe(true);
    expect(resultArtifact.boundary.noLegacyActiveStressDeletion).toBe(true);
    expect(resultArtifact.boundary.noTrefFudge).toBe(true);
    expect(resultArtifact.boundary.noOfficialCaseReauthoring).toBe(true);
  });

  it("covers normal floor plus one-axis user knob sweeps for stock and developer-only Land", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.protocol.sweepPoints.map((point) => point.id)).toEqual([
      "normal-floor",
      "preload-low",
      "preload-high",
      "hr60",
      "hr90",
      "hr120",
      "contractility-low",
      "contractility-high",
      "afterload-low",
      "afterload-high",
      "arterial-stiffness-low",
      "arterial-stiffness-high",
      "venous-tone-low",
      "venous-tone-high",
    ]);
    expect(resultArtifact.runner.stock.branchCount).toBe(14);
    expect(resultArtifact.runner.land.branchCount).toBe(14);
    expect(resultArtifact.points).toHaveLength(14);
    for (const point of resultArtifact.points) {
      expect(point.bothBranchesPresent).toBe(true);
      expect(point.stock).not.toBeNull();
      expect(point.land).not.toBeNull();
      expect(point.metricDeltas.some((delta) => delta.chamber === "LV" && delta.metricId === "CO")).toBe(true);
      expect(point.metricDeltas.some((delta) => delta.chamber === "LV" && delta.metricId === "qDotClampHitFraction")).toBe(true);
    }
  });

  it("records the current measured blockers as evidence, not verifier failures", () => {
    expect(resultArtifact.landProviderInstrumentation.landSolveFailureCount).toBe(0);
    expect(resultArtifact.landProviderInstrumentation.sourceActiveStressCallCount).toBeGreaterThan(0);
    expect(resultArtifact.landProviderInstrumentation.commitProviderStateAfterStepCount).toBeGreaterThan(0);
    expect(resultArtifact.normalOperatingPointFloor.pass).toBe(false);
    expect(resultArtifact.normalOperatingPointFloor.failures).toContain("LVEDPApprox");
    expect(resultArtifact.preflight.readiness).toBe("blocked-before-default-flip");
    expect(resultArtifact.preflight.absoluteMorphologyFailureCount).toBeGreaterThan(0);
    expect(resultArtifact.points.some((point) =>
      point.absoluteMorphologyFailures.some((failure) => failure.startsWith("qdot-clamp-high:LV"))
    )).toBe(true);
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateLvLandDefaultCandidatePreflightPhase5X(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase5x_normal_floor_blocked",
        "phase5x_preflight_blocked",
        "phase5x_rebuild_not_run_by_default",
        "phase5x_default_flip_not_unlocked",
      ]),
    );
  });

  it("rejects normal floor overclaims in the committed artifact", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalPass = artifact.normalOperatingPointFloor.pass;
    const originalFailures = artifact.normalOperatingPointFloor.failures;
    try {
      artifact.normalOperatingPointFloor.pass = true;
      artifact.normalOperatingPointFloor.failures = [];

      const report = validateLvLandDefaultCandidatePreflightPhase5X(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toContain("phase5x_normal_floor_failures");
    } finally {
      artifact.normalOperatingPointFloor.pass = originalPass;
      artifact.normalOperatingPointFloor.failures = originalFailures;
    }
  });

  it("rejects morphology and readiness overclaims in the committed artifact", () => {
    const artifact = resultArtifact as Record<string, any>;
    const point = artifact.points.find((candidate: { id: string }) => candidate.id === "preload-low");
    const originalPointFailures = point.absoluteMorphologyFailures;
    const originalPointClassification = point.classification;
    const originalReadiness = artifact.preflight.readiness;
    const originalMorphologyFailureCount = artifact.preflight.absoluteMorphologyFailureCount;
    const originalCandidatePassPointCount = artifact.preflight.candidatePassPointCount;
    try {
      point.absoluteMorphologyFailures = [];
      point.classification = "candidate-pass-diagnostic-only";
      artifact.preflight.readiness = "ready-for-separate-default-flip-pr-with-legacy-frozen";
      artifact.preflight.absoluteMorphologyFailureCount = 0;
      artifact.preflight.candidatePassPointCount = artifact.points.length;

      const report = validateLvLandDefaultCandidatePreflightPhase5X(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(
        expect.arrayContaining([
          "phase5x_point_morphology_failure_consistency",
          "phase5x_point_classification_consistency",
          "phase5x_preflight_consistency",
        ]),
      );
    } finally {
      point.absoluteMorphologyFailures = originalPointFailures;
      point.classification = originalPointClassification;
      artifact.preflight.readiness = originalReadiness;
      artifact.preflight.absoluteMorphologyFailureCount = originalMorphologyFailureCount;
      artifact.preflight.candidatePassPointCount = originalCandidatePassPointCount;
    }
  });
});

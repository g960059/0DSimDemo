import localizationArtifact from "@/data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
import { validateAtrialBridgeBlockerLocalization } from "@/tools/myocardium/verifyAtrialBridgeBlockerLocalization";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5.5B atrial bridge blocker localization", () => {
  it("records a measured localization artifact without bridge selection", () => {
    expect(localizationArtifact.id).toBe("atrial-bridge-blocker-localization-phase5p5b-result-v1");
    expect(localizationArtifact.phase).toBe("Phase 5.5B");
    expect(localizationArtifact.claimBoundary).toBe("diagnostic-localization-only-no-bridge-selection");
    expect(localizationArtifact.protocol.candidateIds).toEqual([
      "atrial-elastance-negative-control-v0",
      "legacy-atrial-active-bridge-v0",
      "atrial-reservoir-booster-bridge-v1",
    ]);
    expect(localizationArtifact.protocol.highHrSweepPoints.map((point) => point.id)).toEqual([
      "normal-hr75-reference",
      "normal-hr90",
      "normal-hr105",
    ]);
    expect(localizationArtifact.summary.selectedCandidateId).toBeNull();
    expect(localizationArtifact.summary.recommendedCandidateId).toBeNull();
  });

  it("keeps high-HR cap runs measurable through tail windows", () => {
    const highHrRuns = localizationArtifact.highHrSweepRuns.filter((run) =>
      run.sweepPointId === "normal-hr105"
    );
    const hr90Runs = localizationArtifact.highHrSweepRuns.filter((run) =>
      run.sweepPointId === "normal-hr90"
    );

    expect(highHrRuns).toHaveLength(3);
    expect(highHrRuns.every((run) => run.settled === false && run.tailWindow.windowKind === "cap-tail-window")).toBe(true);
    expect(highHrRuns.every((run) => run.tailWindow.sampleCount > 100)).toBe(true);
    expect(highHrRuns.every((run) => run.tailWindow.LA && run.tailWindow.RA)).toBe(true);
    expect(highHrRuns.map((run) => run.failureClass)).toEqual(
      expect.arrayContaining(["cap-with-valve-activity", "health-warning"]),
    );
    expect(hr90Runs.find((run) => run.candidateId === "legacy-atrial-active-bridge-v0")?.settled).toBe(true);
    expect(hr90Runs.find((run) => run.candidateId === "atrial-elastance-negative-control-v0")?.settled).toBe(false);
    expect(hr90Runs.find((run) => run.candidateId === "atrial-reservoir-booster-bridge-v1")?.settled).toBe(false);
    expect(localizationArtifact.summary.highHrGapStatus).toBe("hr105-common-nonsettle-persists");
  });

  it("separates real A1 blockers from repeatability instrumentation artifact", () => {
    expect(localizationArtifact.summary.a1ValveBlockerAfterNormalization).toBe("supported");
    expect(localizationArtifact.summary.a1ValveWorsePointIds).toEqual([
      "normal",
      "low-preload",
      "high-preload",
      "high-hr",
    ]);
    expect(localizationArtifact.summary.a1RepeatabilityBlockerLocalized).toBe("not-supported");
    expect(localizationArtifact.summary.a1SamplingInvariantBlockerLocalized).toBe("supported");
    expect(localizationArtifact.summary.a1SamplingFailureSites).toEqual(["isolated-LA", "isolated-RA"]);

    const a1Repeatability = localizationArtifact.repeatabilityDiagnostics.filter((run) =>
      run.candidateId === "atrial-reservoir-booster-bridge-v1"
    );
    expect(a1Repeatability.every((run) => run.status === "pass")).toBe(true);
  });

  it("keeps diagnostic variants non-selectable and passes verifier", () => {
    expect(localizationArtifact.diagnosticVariantRuns).toHaveLength(3);
    expect(localizationArtifact.diagnosticVariantRuns.every((run) => run.selectable === false)).toBe(true);
    expect(localizationArtifact.summary.diagnosticVariantsRemainNonSelectable).toBe(true);

    const report = validateAtrialBridgeBlockerLocalization(process.cwd(), { rebuildEvidence: false });

    expect(report.errors).toEqual([]);
    expect(report.pass).toBe(true);
    expect(report.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "phase5p5b_diagnostic_only",
        "phase5p5b_selection_blocked",
        "phase5p5b_rebuild_not_run_by_default",
      ]),
    );
    expect(localizationArtifact.boundary.noProductionRuntimeWiring).toBe(true);
    expect(localizationArtifact.boundary.noWorkbenchRuntimeWiring).toBe(true);
    expect(localizationArtifact.boundary.noFinalAtrialPhysiologyClaim).toBe(true);
  });
});

import resultArtifact from "@/data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json";
import { validateArterialRootInertanceBenchPhase5AA } from "@/tools/myocardium/verifyArterialRootInertanceBenchPhase5AA";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AA arterial root inertance bench", () => {
  it("records a diagnostic-only prescribed-pressure bench without runtime adoption", () => {
    expect(resultArtifact.id).toBe("arterial-root-inertance-bench-phase5aa-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AA");
    expect(resultArtifact.claimBoundary).toBe("isolated-arterial-root-inertance-bench-diagnostic-only");
    expect(resultArtifact.upstreamPhase5ZArtifactId).toBe("lv-land-ejection-window-localization-phase5z-result-v1");
    expect(resultArtifact.protocol.replayEquation).toBe("ModelCore-current-loss-AoV-replay-with-root-inertance-addition");
    expect(resultArtifact.protocol.pressureDriver).toBe("measured-LVP-minus-AoP-prescribed-from-current-closure");
    expect(resultArtifact.boundary.noModelCoreEquationChange).toBe(true);
    expect(resultArtifact.boundary.noQDotTuning).toBe(true);
    expect(resultArtifact.boundary.noValveThresholdTuning).toBe(true);
    expect(resultArtifact.boundary.noRootCauseAcceptance).toBe(true);
  });

  it("covers the Phase 5X synthetic user-knob matrix for stock and Land", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.points.map((point) => point.id)).toEqual([
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
    expect(resultArtifact.summary.pointCount).toBe(14);
    expect(resultArtifact.summary.runCount).toBe(28);
    expect(resultArtifact.summary.healthOkRunCount).toBe(27);
    expect(resultArtifact.summary.landSolveFailureCount).toBe(0);
  });

  it("finds lower-clamp inertance candidates without severe forward-volume loss", () => {
    expect(resultArtifact.summary.runsWithCandidateLowerClampWithoutSevereVolumeLoss).toBe(28);
    expect(resultArtifact.summary.landRunsWithCandidateLowerClampWithoutSevereVolumeLoss).toBe(14);
    expect(resultArtifact.summary.healthOkRunsWithCandidateLowerClampWithoutSevereVolumeLoss).toBe(27);
    expect(resultArtifact.summary.healthOkLandRunsWithCandidateLowerClampWithoutSevereVolumeLoss).toBe(14);
    expect(resultArtifact.summary.failedHealthRunsWithCandidateLowerClampWithoutSevereVolumeLoss).toEqual([{
      pointId: "hr120",
      modelPathId: "stock-active-no-provider-v0",
      healthStatus: "failed",
      messages: ["Left/right CO mismatch 3.35 L/min."],
    }]);
    expect(resultArtifact.summary.currentInterpretation).toContain("27/27 health-ok stock/Land runs");
    expect(resultArtifact.summary.currentInterpretation).toContain("failed-health runs are tracked separately");
    expect(resultArtifact.summary.medianCurrentReplayAovOpenClampFraction).toBe(0.518773);
    expect(resultArtifact.summary.medianBestCandidateClampReductionFraction).toBe(1);
  });

  it("records the normal-floor stock and Land candidate contrast", () => {
    const normal = resultArtifact.points.find((point) => point.id === "normal-floor")!;
    const stockCurrent = normal.stock.replayCandidates.find((candidate) => candidate.id === "current-aov-l")!;
    const stockBest = normal.stock.replayCandidates.find((candidate) => candidate.id === normal.stock.bestCandidateId)!;
    const landCurrent = normal.land.replayCandidates.find((candidate) => candidate.id === "current-aov-l")!;
    const landBest = normal.land.replayCandidates.find((candidate) => candidate.id === normal.land.bestCandidateId)!;

    expect(normal.stock.bestCandidateId).toBe("root-l-plus-1x-aov-l");
    expect(normal.land.bestCandidateId).toBe("root-l-plus-3x-aov-l");
    expect(stockCurrent.qDotClampHitFractionAovOpen).toBe(0.711538);
    expect(stockBest.qDotClampHitFractionAovOpen).toBe(0);
    expect(stockBest.forwardVolumeRatioVsMeasured).toBeGreaterThan(0.8);
    expect(landCurrent.qDotClampHitFractionAovOpen).toBe(0.44);
    expect(landBest.qDotClampHitFractionAovOpen).toBe(0);
    expect(landBest.forwardVolumeRatioVsMeasured).toBeGreaterThan(0.5);
  });

  it("keeps limitations explicit", () => {
    expect(resultArtifact.summary.limitations).toEqual(expect.arrayContaining([
      expect.stringContaining("offline prescribed-pressure replay"),
      expect.stringContaining("not direct adoption or calibration of the existing Ao_SA inertance edge"),
      expect.stringContaining("does not model candidate valve timing"),
      expect.stringContaining("not Zc/reflection availability"),
      expect.stringContaining("clamp-reduction-prioritized diagnostic ranking"),
    ]));
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateArterialRootInertanceBenchPhase5AA(process.cwd(), { rebuildEvidence: false });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5aa_candidate_signal_count",
      "phase5aa_rebuild_not_run_by_default",
      "phase5aa_runtime_not_unlocked",
    ]));
  });

  it("rejects boundary erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalEquationChange = artifact.boundary.noModelCoreEquationChange;
    const originalRootCause = artifact.boundary.noRootCauseAcceptance;
    const originalQDot = artifact.boundary.noQDotTuning;
    try {
      artifact.boundary.noModelCoreEquationChange = false;
      artifact.boundary.noRootCauseAcceptance = false;
      artifact.boundary.noQDotTuning = false;

      const report = validateArterialRootInertanceBenchPhase5AA(process.cwd(), { rebuildEvidence: false });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toContain("phase5aa_boundary");
    } finally {
      artifact.boundary.noModelCoreEquationChange = originalEquationChange;
      artifact.boundary.noRootCauseAcceptance = originalRootCause;
      artifact.boundary.noQDotTuning = originalQDot;
    }
  });
});

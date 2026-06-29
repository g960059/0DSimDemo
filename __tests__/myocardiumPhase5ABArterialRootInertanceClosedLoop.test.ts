import resultArtifact from "@/data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json";
import { validateArterialRootInertanceClosedLoopPhase5AB } from "@/tools/myocardium/verifyArterialRootInertanceClosedLoopPhase5AB";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AB arterial root inertance closed-loop diagnostic", () => {
  it("records a diagnostic-only closed-loop effective AoV/root inertance sweep", () => {
    expect(resultArtifact.id).toBe("arterial-root-inertance-closed-loop-phase5ab-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AB");
    expect(resultArtifact.claimBoundary).toBe("closed-loop-effective-aov-root-inertance-diagnostic-only");
    expect(resultArtifact.upstreamPhase5AAArtifactId).toBe("arterial-root-inertance-bench-phase5aa-result-v1");
    expect(resultArtifact.protocol.closedLoopCarrier).toBe("existing-AoV_L-effective-aov-root-boundary-inertance");
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noValveThresholdTuning).toBe(true);
    expect(resultArtifact.boundary.noDirectAoSAAdoption).toBe(true);
    expect(resultArtifact.boundary.noFinalNoAlternansAcceptance).toBe(true);
  });

  it("covers the full Phase 5X matrix plus low-preload edge for stock and Land", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.protocol.candidateSet.map((candidate) => candidate.id)).toEqual([
      "current-aov-l",
      "effective-root-l-plus-1x-aov-l",
      "effective-root-l-plus-2x-aov-l",
      "effective-root-l-plus-3x-aov-l",
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
      "low-preload-alternans-edge",
    ]);
    expect(resultArtifact.summary.pointCount).toBe(15);
    expect(resultArtifact.summary.runCount).toBe(120);
    expect(resultArtifact.summary.candidateComparisonCount).toBe(90);
    expect(resultArtifact.summary.healthOkCandidateComparisonCount).toBe(83);
    expect(resultArtifact.summary.healthOkParetoSignalOutputPreservedCount).toBe(72);
    expect(resultArtifact.summary.healthOkPositiveMorphologySignalCount).toBe(67);
    expect(resultArtifact.summary.positiveMorphologySignalCount).toBe(70);
  });

  it("keeps low-preload alternans evidence bounded", () => {
    expect(resultArtifact.summary.lowPreloadAlternansEdge.interpretation).toContain("does not unlock final no-alternans");
    expect(resultArtifact.summary.currentInterpretation).toContain("not runtime adoption");
    expect(resultArtifact.summary.currentInterpretation).toContain("72/83 health-ok candidate comparisons");
    expect(resultArtifact.summary.currentInterpretation).toContain("67 health-ok candidate comparisons");
    expect(resultArtifact.summary.limitations).toEqual(expect.arrayContaining([
      expect.stringContaining("existing AoV_L inertance carrier"),
      expect.stringContaining("not a final structural alternans"),
      expect.stringContaining("not an official morphology gate"),
    ]));
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateArterialRootInertanceClosedLoopPhase5AB(process.cwd(), {
      rebuildEvidence: false,
    });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5ab_candidate_signal_count",
      "phase5ab_rebuild_not_run_by_default",
      "phase5ab_runtime_not_unlocked",
    ]));
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noQDotClampRemoval;
    try {
      artifact.boundary.noQDotClampRemoval = false;

      const report = validateArterialRootInertanceClosedLoopPhase5AB(process.cwd(), {
        rebuildEvidence: false,
      });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ab_identity",
        "phase5ab_boundary",
      ]));
    } finally {
      artifact.boundary.noQDotClampRemoval = originalBoundary;
    }
  });
});

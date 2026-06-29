import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
import { validateArterialRootBoundaryTimingPhase5AG } from "@/tools/myocardium/verifyArterialRootBoundaryTimingPhase5AG";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AG arterial boundary/root timing", () => {
  it("records a closed-loop timing diagnostic without adoption", () => {
    expect(resultArtifact.id).toBe("arterial-root-boundary-timing-phase5ag-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AG");
    expect(resultArtifact.claimBoundary).toBe("closed-loop-sourced-boundary-root-timing-diagnostic-only");
    expect(resultArtifact.upstreamPhase5AFArtifactId).toBe("arterial-root-zc-calibration-phase5af-result-v1");
    expect(resultArtifact.protocol.pointSource).toBe("phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge");
    expect(resultArtifact.protocol.sourcedCalibrationStatus).toBe("preferred-physiological-calibration-candidate");
    expect(resultArtifact.boundary.noModelCoreEquationChange).toBe(true);
    expect(resultArtifact.boundary.noTopologyChange).toBe(true);
    expect(resultArtifact.boundary.noDefaultParamChange).toBe(true);
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noValveLoadTimingAcceptance).toBe(true);
    expect(resultArtifact.boundary.noBoundaryRootProductionAdoption).toBe(true);
  });

  it("covers the full Phase 5X matrix plus the frozen low-preload edge", () => {
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
    expect(resultArtifact.protocol.candidateSet.map((candidate) => candidate.id)).toEqual([
      "current-closure",
      "boundary-root-l-plus-1x-aov-l-mechanism",
    ]);
    expect(resultArtifact.summary.pointCount).toBe(15);
    expect(resultArtifact.summary.runCount).toBe(60);
    expect(resultArtifact.summary.measuredRunCount).toBe(60);
    expect(resultArtifact.summary.healthOkRunCount).toBe(56);
    expect(resultArtifact.summary.healthOkCandidateComparisonCount).toBe(28);
    expect(resultArtifact.summary.landSolveFailureCount).toBe(0);
  });

  it("classifies qDot and valve/load timing signals separately", () => {
    expect(resultArtifact.summary.qDotAndTimingOutputPreservedCount).toBe(18);
    expect(resultArtifact.summary.stockQDotAndTimingOutputPreservedCount).toBe(12);
    expect(resultArtifact.summary.landQDotAndTimingOutputPreservedCount).toBe(6);
    expect(resultArtifact.summary.outputOrTimingCostCount).toBe(1);
    expect(resultArtifact.summary.normalFloorLandClassification)
      .toBe("candidate-timing-only-output-preserved");

    const normalLand = resultArtifact.points
      .find((point) => point.id === "normal-floor")!
      .land.find((run) => run.candidateId === "boundary-root-l-plus-1x-aov-l-mechanism")!;
    expect(normalLand.comparisonVsCurrent.qDotEngagementSignal).toBe(false);
    expect(normalLand.comparisonVsCurrent.valveLoadTimingSignal).toBe(true);
    expect(normalLand.comparisonVsCurrent.outputPreserved).toBe(true);
  });

  it("keeps the boundary/root candidate off direct Ao_SA edge overrides", () => {
    for (const point of resultArtifact.points) {
      for (const side of ["stock", "land"] as const) {
        const current = point[side][0];
        const candidate = point[side][1];
        expect(current.candidateId).toBe("current-closure");
        expect(current.comparisonVsCurrent.classification).toBe("current-closure-reference");
        expect(candidate.candidateId).toBe("boundary-root-l-plus-1x-aov-l-mechanism");
        expect(candidate.parameterization).toBe("experimental-boundary-root-inertance-mechanism");
        expect(candidate.edgeOverrides).toBeNull();
        expect(candidate.boundaryRootAdditionalMultipleOfAoVL).toBe(1);
      }
    }
  });

  it("passes the verifier", () => {
    const report = validateArterialRootBoundaryTimingPhase5AG(process.cwd(), {
      rebuildEvidence: false,
    });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5ag_rebuild_not_run_by_default",
      "phase5ag_runtime_not_unlocked",
    ]));
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noQDotClampRemoval;
    const originalHash = artifact.normalizedSha256;
    try {
      artifact.boundary.noQDotClampRemoval = false;
      artifact.normalizedSha256 = "f".repeat(64);

      const report = validateArterialRootBoundaryTimingPhase5AG(process.cwd(), {
        rebuildEvidence: false,
      });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ag_boundary",
        "phase5ag_hash",
      ]));
    } finally {
      artifact.boundary.noQDotClampRemoval = originalBoundary;
      artifact.normalizedSha256 = originalHash;
    }
  });
});

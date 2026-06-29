import resultArtifact from "@/data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json";
import { validateArterialRootZcPrototypeSmokePhase5AD } from "@/tools/myocardium/verifyArterialRootZcPrototypeSmokePhase5AD";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AD arterial root/Zc prototype smoke", () => {
  it("records an off-by-default root/Zc prototype smoke diagnostic", () => {
    expect(resultArtifact.id).toBe("arterial-root-zc-prototype-smoke-phase5ad-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AD");
    expect(resultArtifact.claimBoundary).toBe("off-by-default-root-zc-prototype-smoke-diagnostic-only");
    expect(resultArtifact.upstreamPhase5ACArtifactId).toBe("arterial-root-zc-impedance-bench-phase5ac-result-v1");
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noDirectAoSAAdoption).toBe(true);
    expect(resultArtifact.boundary.noAoVBoundaryCarrierAdoption).toBe(true);
    expect(resultArtifact.boundary.noOfficialMorphologyAcceptance).toBe(true);
  });

  it("covers selected stock and Land smoke points with fixed candidate order", () => {
    expect(resultArtifact.protocol.modelPathIds).toEqual([
      "stock-active-no-provider-v0",
      "developer-only-lv-land-v0",
    ]);
    expect(resultArtifact.points.map((point) => point.id)).toEqual([
      "normal-floor",
      "hr90",
      "arterial-stiffness-high",
      "low-preload-alternans-edge",
    ]);
    expect(resultArtifact.protocol.candidateSet.map((candidate) => candidate.id)).toEqual([
      "current-closure",
      "aov-boundary-l-2x-reference",
      "aosa-l-1p5x-prototype",
      "aosa-l-2x-prototype",
      "combined-aov2-aosa1p5-prototype",
    ]);
    expect(resultArtifact.summary.runCount).toBe(40);
    expect(resultArtifact.summary.measuredRunCount).toBe(38);
    expect(resultArtifact.summary.healthOkRunCount).toBe(33);
    expect(resultArtifact.summary.healthOkCandidateComparisonCount).toBe(26);
    expect(resultArtifact.summary.landSolveFailureCount).toBe(0);
    const nonHealthOkPositiveSignals = resultArtifact.points.flatMap((point) => (
      (["stock", "land"] as const).flatMap((side) => (
        point[side].filter((run) => (
          (run.status !== "measured" || run.health?.status !== "ok")
          && run.comparisonVsCurrent?.positiveMorphologySignal
        ))
      ))
    ));
    expect(nonHealthOkPositiveSignals).toEqual([]);
  });

  it("keeps direct Ao_SA adoption blocked by measured smoke evidence", () => {
    expect(resultArtifact.summary.prototypeAssessment).toEqual({
      directAoSaOnly: "not-supported-by-phase5ad-smoke",
      aovBoundaryCarrierReference: "signal-present-diagnostic-only",
      combinedPrototype: "not-robust",
    });
    expect(resultArtifact.summary.healthOkDirectAoSaOnlySignalCount).toBe(0);
    expect(resultArtifact.summary.healthOkAovBoundaryReferenceSignalCount).toBeGreaterThan(0);
    expect(resultArtifact.summary.currentInterpretation).toContain("does not support direct Ao_SA.L-only adoption");
    expect(resultArtifact.summary.currentInterpretation).toContain("routing diagnostic");
  });

  it("records direct Ao_SA candidates as edge overrides, not production wiring", () => {
    for (const point of resultArtifact.points) {
      for (const side of ["stock", "land"] as const) {
        const current = point[side][0];
        expect(current.candidateId).toBe("current-closure");
        expect(current.edgeOverrides).toBeNull();
        for (const run of point[side]) {
          if (run.parameterization === "direct-aosa-edge-override-only") {
            expect(run.edgeOverrides?.Ao_SA?.L).toBe(run.effectiveAoSAInertanceMmHgSec2PerMl);
            expect(run.effectiveAoVInertanceMmHgSec2PerMl).toBe(run.baseAoVInertanceMmHgSec2PerMl);
          }
        }
      }
    }
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateArterialRootZcPrototypeSmokePhase5AD(process.cwd(), {
      rebuildEvidence: false,
    });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5ad_candidate_signal_count",
      "phase5ad_rebuild_not_run_by_default",
      "phase5ad_runtime_not_unlocked",
    ]));
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noDirectAoSAAdoption;
    try {
      artifact.boundary.noDirectAoSAAdoption = false;

      const report = validateArterialRootZcPrototypeSmokePhase5AD(process.cwd(), {
        rebuildEvidence: false,
      });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ad_identity",
        "phase5ad_boundary",
      ]));
    } finally {
      artifact.boundary.noDirectAoSAAdoption = originalBoundary;
    }
  });
});

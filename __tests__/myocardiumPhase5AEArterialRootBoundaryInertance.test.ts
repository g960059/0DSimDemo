import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json";
import { validateArterialRootBoundaryInertancePhase5AE } from "@/tools/myocardium/verifyArterialRootBoundaryInertancePhase5AE";
import { describe, expect, it } from "vitest";

describe("myocardium Phase 5AE arterial boundary/root inertance", () => {
  it("records an experimental boundary/root inertance diagnostic", () => {
    expect(resultArtifact.id).toBe("arterial-root-boundary-inertance-phase5ae-result-v1");
    expect(resultArtifact.phase).toBe("Phase 5AE");
    expect(resultArtifact.claimBoundary).toBe("experimental-boundary-root-inertance-diagnostic-only");
    expect(resultArtifact.upstreamPhase5ADArtifactId).toBe("arterial-root-zc-prototype-smoke-phase5ad-result-v1");
    expect(resultArtifact.boundary.noProductionModelCoreEquationChange).toBe(true);
    expect(resultArtifact.boundary.noTopologyChange).toBe(true);
    expect(resultArtifact.boundary.noStateLayoutChange).toBe(true);
    expect(resultArtifact.boundary.noDefaultParamChange).toBe(true);
    expect(resultArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(resultArtifact.boundary.noDirectAoSAAdoption).toBe(true);
    expect(resultArtifact.boundary.noAoVBoundaryCarrierAdoption).toBe(true);
    expect(resultArtifact.boundary.noBoundaryRootProductionAdoption).toBe(true);
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
      "boundary-root-l-plus-1x-aov-l-mechanism",
    ]);
    expect(resultArtifact.summary.runCount).toBe(48);
    expect(resultArtifact.summary.measuredRunCount).toBe(46);
    expect(resultArtifact.summary.healthOkRunCount).toBe(40);
    expect(resultArtifact.summary.healthOkCandidateComparisonCount).toBe(33);
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

  it("carries the AoV-boundary signal through the experimental mechanism", () => {
    expect(resultArtifact.summary.prototypeAssessment).toEqual({
      directAoSaOnly: "not-supported-by-phase5ae-smoke",
      aovBoundaryCarrierReference: "signal-present-diagnostic-only",
      combinedPrototype: "not-robust",
      boundaryRootMechanism: "matches-carrier-diagnostic-only",
    });
    expect(resultArtifact.summary.healthOkDirectAoSaOnlySignalCount).toBe(0);
    expect(resultArtifact.summary.healthOkAovBoundaryReferenceSignalCount).toBe(5);
    expect(resultArtifact.summary.healthOkBoundaryRootMechanismSignalCount).toBe(5);
    expect(resultArtifact.summary.healthOkCarrierMechanismMatchCount).toBeGreaterThanOrEqual(5);
    expect(resultArtifact.summary.currentInterpretation).toContain("physicalizes");
    expect(resultArtifact.summary.currentInterpretation).toContain("diagnostic-only mechanism routing");
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
          if (run.parameterization === "experimental-boundary-root-inertance-mechanism") {
            expect(run.edgeOverrides).toBeNull();
            expect(run.experimentalBoundaryRootInertance?.mechanismId)
              .toBe("phase5ae-experimental-aortic-boundary-root-inertance-v1");
            expect(run.boundaryRootAdditionalMultipleOfAoVL).toBe(1);
            expect(run.effectiveAoVInertanceMmHgSec2PerMl).toBe(run.baseAoVInertanceMmHgSec2PerMl * 2);
          }
        }
      }
    }
  });

  it("passes the verifier in non-rebuild mode", () => {
    const report = validateArterialRootBoundaryInertancePhase5AE(process.cwd(), {
      rebuildEvidence: false,
    });
    expect(report.pass).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "phase5ae_candidate_signal_count",
      "phase5ae_rebuild_not_run_by_default",
      "phase5ae_runtime_not_unlocked",
    ]));
  });

  it("rejects boundary and hash erosion", () => {
    const artifact = resultArtifact as Record<string, any>;
    const originalBoundary = artifact.boundary.noDirectAoSAAdoption;
    try {
      artifact.boundary.noDirectAoSAAdoption = false;

      const report = validateArterialRootBoundaryInertancePhase5AE(process.cwd(), {
        rebuildEvidence: false,
      });

      expect(report.pass).toBe(false);
      expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
        "phase5ae_identity",
        "phase5ae_boundary",
      ]));
    } finally {
      artifact.boundary.noDirectAoSAAdoption = originalBoundary;
    }
  });
});
